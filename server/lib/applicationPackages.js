// Tailored application packages (2026-10-02) — a set of finished documents
// written for one opportunity (e.g. one company's package: Salt Basin-format
// resume, ATS resume, cover letter, combined package), filed as ordinary
// resume_output_projections rows so they share the existing view / PDF /
// ZIP / email / status pipeline instead of a parallel one.
//
// Each output (document) gets its own QR-gated URL (/r/:token). The token is
// minted the first time the owner explicitly approves a version for
// sharing, then follows whichever version of that document is approved
// last. It is unguessable (144 random bits) and resolves only while the
// row holding it is 'published' — it is never listed, linked, or indexed
// anywhere. Revoking clears it, so a printed QR stops working immediately.
//
// generated_content shape for these documents ("document_blocks", v1):
//   { format: 'document_blocks', version: 1,
//     header: { name, headline, contact },
//     blocks: [ { type: 'heading'|'paragraph'|'bullet', text, emphasis? }
//             | { type: 'role', title, dates }
//             | { type: 'table', rows: [[ [line, ...], ... ]] }
//             | { type: 'figure' } ] }
// produced from .docx files by scripts/extract-application-package.py.
import crypto from 'node:crypto';
import { db } from '../db.js';
import { createResumeOutputProjection, projectionMetadata } from './resumeProjection.js';
import { loadProficiencyResolution } from '../routes/careerMaster.js';
import { timelineRows, trendSeries, proficiencyRows, footnoteForRows } from '../../src/lib/careerCharts.js';
import { snapshotFingerprint } from '../../src/lib/shareSnapshotDiff.js';
import { careerChangeEvents } from './careerChangeEvents.js';
import { assertReadyToFinalize } from './finalizationGates.js';

const OUTPUT_TYPES = new Set(['resume', 'cover_letter', 'application_package']);
const BLOCK_TYPES = new Set(['heading', 'paragraph', 'bullet', 'role', 'table', 'figure']);

export function presetIdFor(packageKey, variant) {
  return `application_package:${packageKey}:${variant}`;
}

function assertDocumentBlocks(content) {
  if (content?.format !== 'document_blocks' || Number(content.version) !== 1) {
    throw new Error('Output content must be document_blocks v1.');
  }
  if (!Array.isArray(content.blocks) || !content.blocks.every((b) => BLOCK_TYPES.has(b?.type))) {
    throw new Error('Output content has an unrecognized block type.');
  }
}

// JSONB stores object keys in its own order, so compare key-sorted forms.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]));
  }
  return value;
}

function sameContent(a, b) {
  const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
  return JSON.stringify(canonical(parse(a))) === JSON.stringify(canonical(parse(b)));
}

/**
 * Files every output of a package for this member. Re-importing is safe:
 * an output whose content is unchanged is skipped, and a changed one becomes
 * a new draft version in the same lineage (the approved version and its QR
 * are left alone until the owner approves the new one).
 */
export async function importApplicationPackage(userId, pkg) {
  if (!pkg?.packageKey || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(pkg.packageKey)) throw new Error('packageKey must be a lowercase slug.');
  if (!Array.isArray(pkg.outputs) || !pkg.outputs.length) throw new Error('Package has no outputs.');
  const createdAt = pkg.createdAt ? Date.parse(pkg.createdAt) : null;
  if (pkg.createdAt && Number.isNaN(createdAt)) throw new Error('createdAt must be an ISO-8601 date.');
  const authors = Array.isArray(pkg.authors) ? pkg.authors.map((a) => String(a).trim()).filter(Boolean) : [];

  const results = [];
  for (const output of pkg.outputs) {
    if (!output?.variant || !/^[a-z0-9_]{1,40}$/.test(output.variant)) throw new Error('Each output needs a snake_case variant.');
    if (!OUTPUT_TYPES.has(output.outputType)) throw new Error(`Unsupported outputType: ${output.outputType}`);
    assertDocumentBlocks(output.content);

    const presetId = presetIdFor(pkg.packageKey, output.variant);
    const latest = await db.prepare(`
      SELECT * FROM resume_output_projections WHERE user_id=$1 AND preset_id=$2 ORDER BY created_at DESC, id DESC LIMIT 1
    `).get(userId, presetId);
    if (latest && sameContent(latest.generated_content, output.content)) {
      results.push({ variant: output.variant, id: Number(latest.id), status: 'unchanged' });
      continue;
    }
    const projection = await createResumeOutputProjection(userId, {
      presetId,
      presetName: output.name || output.variant,
      generatedContent: output.content,
      outputType: output.outputType,
      source: 'imported',
      regenerateFromId: latest ? Number(latest.id) : null,
      targetJobDescription: pkg.company ? `${pkg.company} application package` : null,
      authors,
      sourceCreatedAt: createdAt,
    });
    results.push({ variant: output.variant, id: Number(projection.id), status: latest ? 'new_version' : 'created' });
  }
  return results;
}

function newShareToken() {
  return crypto.randomBytes(18).toString('base64url');
}

/**
 * The explicit human approval step: publishes this version and records who
 * approved it. Each document (one version lineage — e.g. a cover
 * letter) has ONE QR slug that follows its approved version: approving a
 * newer version moves the slug to it, so every QR already printed keeps
 * working and always opens the version approved last.
 */
export async function approveOutputForSharing(projectionId, approver) {
  const row = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, approver.id);
  if (!row) return null;
  await assertReadyToFinalize(approver.id);
  const lineageRoot = Number(row.lineage_root_id || row.id);
  const holder = row.share_token ? row : await db.prepare(`
    SELECT id, share_token FROM resume_output_projections
     WHERE user_id=$1 AND COALESCE(lineage_root_id, id)=$2 AND share_token IS NOT NULL LIMIT 1
  `).get(approver.id, lineageRoot);
  const token = holder?.share_token || newShareToken();
  if (holder && Number(holder.id) !== Number(projectionId)) {
    // Retire the previously approved version first (share_token is unique).
    await db.prepare(`
      UPDATE resume_output_projections
         SET share_token=NULL, output_status=CASE WHEN output_status='published' THEN 'approved' ELSE output_status END
       WHERE id=$1 AND user_id=$2
    `).run(holder.id, approver.id);
  }
  const warnings = [];
  const snapshot = await buildShareSnapshot(approver.id).catch((e) => {
    console.error('[applicationPackages] chart snapshot failed at approval:', e.message);
    warnings.push(`The chart snapshot for the printed version could not be captured (${e.message}). The QR page will say so and can't compare live data to print.`);
    return null;
  });
  await db.prepare(`
    UPDATE resume_output_projections
       SET share_token=$1, output_status='published', approved_by=$2, approved_at=$3, shared_snapshot=$5::jsonb, share_history='[]'::jsonb
     WHERE id=$4 AND user_id=$2
  `).run(token, approver.id, Date.now(), projectionId, snapshot);
  return { id: Number(projectionId), token, movedFrom: holder && Number(holder.id) !== Number(projectionId) ? Number(holder.id) : null, warnings };
}

/**
 * Chart data for the public QR page, computed from the owner's Career
 * Master at the moment of approval. Each chart is one unit family (years,
 * levels) so every view of it — chart, salt particles, table — shares one
 * honest scale. An empty Career Master yields no charts, never placeholders.
 */
export async function buildShareSnapshot(userId) {
  const jobRows = await db.prepare(`SELECT company, title, start_date, end_date, industry FROM career_jobs WHERE user_id=$1`).all(userId);
  const master = { jobs: jobRows.map((j) => ({ company: j.company, title: j.title, startDate: j.start_date, endDate: j.end_date, industry: j.industry })) };
  const charts = [];
  const timeline = timelineRows(master).filter((r) => r.start);
  if (timeline.length) {
    charts.push({ key: 'timeline', kind: 'timeline', title: 'Career timeline', subtitle: 'Years in each role, coloured by industry', unit: 'yrs', rows: timeline });
  }
  const experience = trendSeries(master, 'experience_years');
  if (experience.length > 1) {
    charts.push({ key: 'experience', kind: 'trend', title: 'Cumulative years of experience', subtitle: 'One step per year with an active role', unit: ' yrs', series: experience });
  }
  const { resolution, definitions } = await loadProficiencyResolution(userId, 'current');
  const levels = definitions.filter((d) => d.type === 'proficiency_level' && d.isActive)
    .map((d) => ({ key: d.key, label: d.label, ordinal: Number(d.definition?.ordinal) || 0 }))
    .sort((a, b) => a.ordinal - b.ordinal);
  const profRows = proficiencyRows(resolution).filter((r) => r.ordinal > 0).slice(0, 10);
  if (profRows.length) {
    charts.push({ key: 'proficiency', kind: 'proficiency', title: 'Top proficiencies', subtitle: 'Level per skill and tool', unit: 'level', levels, rows: profRows, footnote: footnoteForRows(profRows) });
  }
  return { capturedAt: Date.now(), charts };
}

const HISTORY_LIMIT = 100;
const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

/**
 * Appends `snapshot` to each of the owner's live-shared documents whose last
 * recorded state differs from it — so the QR page's timeline holds one entry
 * per real change, never duplicates.
 */
export async function recordShareStateChange(userId, { snapshot = null, reason = 'career_master_change' } = {}) {
  const rows = await db.prepare(`
    SELECT id, shared_snapshot, share_history FROM resume_output_projections
     WHERE user_id=$1 AND share_token IS NOT NULL AND output_status='published'
  `).all(userId);
  if (!rows.length) return 0;
  let current = snapshot;
  if (!current) {
    try {
      current = await buildShareSnapshot(userId);
    } catch (e) {
      await markShareSyncError(rows.map((r) => r.id), e);
      throw e;
    }
  }
  const fingerprint = snapshotFingerprint(current);
  let appended = 0;
  for (const row of rows) {
    const history = parseJson(row.share_history) || [];
    const last = history.length ? history[history.length - 1] : parseJson(row.shared_snapshot);
    if (last && snapshotFingerprint(last) === fingerprint) continue;
    const next = [...history, { ...current, reason }].slice(-HISTORY_LIMIT);
    await db.prepare(`UPDATE resume_output_projections SET share_history=$1::jsonb, share_sync_error=NULL WHERE id=$2`).run(next, row.id);
    appended += 1;
  }
  // A successful check clears any earlier failure even when nothing changed.
  await db.prepare(`UPDATE resume_output_projections SET share_sync_error=NULL WHERE user_id=$1 AND share_sync_error IS NOT NULL`).run(userId);
  return appended;
}

async function markShareSyncError(ids, error) {
  const value = { at: Date.now(), message: String(error?.message || error).slice(0, 300) };
  for (const id of ids) {
    await db.prepare(`UPDATE resume_output_projections SET share_sync_error=$1::jsonb WHERE id=$2`).run(value, id)
      .catch((e) => console.error('[applicationPackages] could not record share sync error:', e.message));
  }
}

// Career Master writes arrive in bursts (a bulk edit, an import) — coalesce
// them per member so one burst records one state.
const pendingRecords = new Map();
careerChangeEvents.on('changed', (userId) => {
  clearTimeout(pendingRecords.get(userId));
  pendingRecords.set(userId, setTimeout(() => {
    pendingRecords.delete(userId);
    recordShareStateChange(userId).catch((e) => console.error('[applicationPackages] share history not recorded (saved on the output for the owner to see):', e.message));
  }, 2000));
});

/** Stops the QR from resolving — the slug is discarded, never reissued. */
export async function revokeOutputSharing(projectionId, userId) {
  const result = await db.prepare(`
    UPDATE resume_output_projections
       SET share_token=NULL, output_status=CASE WHEN output_status='published' THEN 'approved' ELSE output_status END
     WHERE id=$1 AND user_id=$2
  `).run(projectionId, userId);
  return result.changes > 0;
}

/** Public resolution of a QR slug — only an approved, still-published version. */
export async function getSharedOutputByToken(token) {
  if (!token || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  return db.prepare(`
    SELECT p.*, COALESCE(NULLIF(u.display_name, ''), u.email) AS approved_by_name
      FROM resume_output_projections p
      LEFT JOIN users u ON u.id = p.approved_by
     WHERE p.share_token=$1 AND p.output_status='published' AND p.approved_by IS NOT NULL
     LIMIT 1
  `).get(token);
}

/** Owner fetch with the approver's name joined, for owner-side PDF/QR routes. */
export async function getOwnedOutputWithApprover(projectionId, userId) {
  return db.prepare(`
    SELECT p.*, COALESCE(NULLIF(u.display_name, ''), u.email) AS approved_by_name
      FROM resume_output_projections p
      LEFT JOIN users u ON u.id = p.approved_by
     WHERE p.id=$1 AND p.user_id=$2
  `).get(projectionId, userId);
}

export function shareUrlFor(token, req) {
  const base = (process.env.APP_BASE_URL || (req ? `${req.protocol}://${req.get('host')}` : '')).replace(/\/+$/, '');
  return `${base}/r/${token}`;
}

/**
 * What a QR visitor sees: the approved document text (frozen), and the
 * chart data as three things — the approved/printed snapshot, every later
 * recorded state, and live data computed now. The page calls out every
 * difference between printed and whatever state the viewer selects.
 */
export async function publicSharedView(row) {
  const content = parseJson(row.generated_content);
  const approved = parseJson(row.shared_snapshot) || null;
  let live = null;
  let liveError = null;
  try {
    live = await buildShareSnapshot(row.user_id);
  } catch (e) {
    console.error('[applicationPackages] live snapshot unavailable:', e.message);
    liveError = 'Live career data could not be loaded right now.';
  }
  if (live) {
    // A change that bypassed the write hooks (an import, a reconciliation
    // approval) still lands in the timeline the first time it's viewed.
    await recordShareStateChange(row.user_id, { snapshot: live, reason: 'detected_on_view' })
      .catch((e) => console.error('[applicationPackages] view-time history record failed (saved on the output):', e.message));
  }
  const fresh = await db.prepare(`SELECT share_history FROM resume_output_projections WHERE id=$1`).get(row.id);
  return {
    title: row.preset_name || 'Resume',
    outputType: row.output_type || 'resume',
    content: content || {},
    metadata: projectionMetadata(row),
    states: {
      approved,
      history: parseJson(fresh?.share_history) || [],
      live: live ? { ...live, capturedAt: Date.now() } : null,
      liveError,
      approvedMissing: !approved,
    },
    // Only the charts read live data today; the document text is always the
    // approved version.
    liveScope: 'charts',
  };
}
