// Resume Output Projection (master-org-admin-config.md §5, 2026-07-16).
// "A Resume Output is a projection of the canonical Career state ... it is
// not a separate copy of the Member's Career truth." This module computes a
// deterministic fingerprint of a member's current Career Atom evidence
// (server/lib/careerAtomMigration.js populates that evidence), snapshots it
// into a resume_output_projections row when a member generates output, and
// can later tell whether that snapshot has gone stale relative to the
// Career state it was drawn from — without ever silently rewriting an
// approved output (§5: "Do not automatically rewrite an approved resume").
import crypto from 'node:crypto';
import { db } from '../db.js';
import { computeResumeTargeting } from './resumeTargeting.js';
import { assertReadyToFinalize } from './finalizationGates.js';

async function getCareerMasterRod(userId) {
  return db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type='career_master'`).get(userId);
}

// Deterministic hash of every Career Atom evidence row for this member —
// changes if any atom value, or the set of atoms, changes. Cheap staleness
// check without needing a separate "career atom version" column on each row.
export async function computeCareerStateFingerprint(userId) {
  const rod = await getCareerMasterRod(userId);
  if (!rod) return { fingerprint: null, atomCount: 0, rodId: null };
  const rows = await db.prepare(`
    SELECT molecule_key, value, source_reference, observed_at
    FROM journey_rod_evidence WHERE rod_id=$1 ORDER BY molecule_key, source_reference
  `).all(rod.id);
  const hash = crypto.createHash('sha256');
  for (const row of rows) hash.update(`${row.molecule_key}|${row.source_reference}|${row.value}|${row.observed_at}\n`);
  return { fingerprint: hash.digest('hex'), atomCount: rows.length, rodId: Number(rod.id) };
}

export async function createResumeOutputProjection(userId, { presetId, presetName, includedSections = [], regenerateFromId = null, targetJobDescription = null, careerOpportunityRodId = null, generatedContent = null, outputType = 'resume', source = 'ai_generated', authors = null, sourceCreatedAt = null }) {
  const { fingerprint: careerFingerprint, atomCount } = await computeCareerStateFingerprint(userId);
  // 'generated' (cover-letter agent, 2026-10-02) is a template draft built from whatever Career
  // Master data exists — an empty Career Master yields a letter without experience paragraphs.
  // An imported document is the member's own finished text, not a
  // projection of Career state — it still records the Career state it was
  // filed against when one exists, but never requires one.
  if (!careerFingerprint && source !== 'imported' && source !== 'generated') throw new Error('No Career Master Channel Rod or evidence found for this member — nothing to project yet.');
  const fingerprint = careerFingerprint || 'no-career-state';
  const now = Date.now();

  let lineageRootId = null;
  if (regenerateFromId) {
    const prior = await db.prepare(`SELECT id, lineage_root_id FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(regenerateFromId, userId);
    if (prior) lineageRootId = Number(prior.lineage_root_id || prior.id);
  }

  // Best-effort — a targeting failure (no key configured, model error) never
  // blocks saving the projection itself; the member just gets no emphasis
  // guidance for this output.
  let targetingResult = null;
  if (targetJobDescription) {
    targetingResult = await computeResumeTargeting(userId, targetJobDescription).catch((e) => {
      console.warn('[resumeProjection] targeting computation skipped:', e.message);
      return null;
    });
  }

  const result = await db.prepare(`
    INSERT INTO resume_output_projections
      (user_id, preset_id, preset_name, included_sections, career_state_fingerprint, atom_count, generated_at, effective_career_state_at, output_status, lineage_root_id, target_job_description, targeting_result, career_opportunity_rod_id, generated_content, output_type, source, created_at, updated_at, authors, source_created_at)
    VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$7,'draft',$8,$9,$10::jsonb,$11,$12::jsonb,$13,$14,$7,$7,$15::jsonb,$16)
    RETURNING id
  `).run(userId, presetId, presetName || null, includedSections, fingerprint, atomCount, now, lineageRootId, targetJobDescription || null, targetingResult || null, careerOpportunityRodId, generatedContent, outputType, source, authors, sourceCreatedAt);
  const id = Number(result.lastInsertRowid);
  if (!lineageRootId) {
    // First projection in this lineage — it's its own root.
    await db.prepare(`UPDATE resume_output_projections SET lineage_root_id=$1 WHERE id=$1`).run(id);
  }
  return db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1`).get(id);
}

export async function checkStaleness(projectionId, userId) {
  const projection = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, userId);
  if (!projection) return null;
  const current = await computeCareerStateFingerprint(userId);
  // An imported document is finished text, not a projection of Career
  // state, so Career changes never make it stale.
  const isStale = projection.source !== 'imported' && current.fingerprint !== projection.career_state_fingerprint;
  return {
    projectionId: Number(projectionId),
    isStale,
    currentAtomCount: current.atomCount,
    projectionAtomCount: Number(projection.atom_count),
    atomCountDelta: current.atomCount - Number(projection.atom_count),
  };
}

// Document metadata shown on every view/PDF of an output: who wrote it, when
// it was created and last changed, and who approved the version a QR code
// serves. createdAt prefers the document's own creation date (an imported
// package was authored before it was filed here); modifiedAt is the last
// content change, which approval deliberately does not bump.
export function projectionMetadata(row) {
  const authors = typeof row.authors === 'string' ? JSON.parse(row.authors) : row.authors;
  return {
    authors: Array.isArray(authors) ? authors : [],
    createdAt: Number(row.source_created_at || row.created_at),
    modifiedAt: Number(row.updated_at || row.generated_at || row.created_at),
    approvedAt: row.approved_at != null ? Number(row.approved_at) : null,
    approvedBy: row.approved_by_name || null,
  };
}

export async function listResumeOutputProjections(userId) {
  const rows = await db.prepare(`
    SELECT p.*, COALESCE(NULLIF(u.display_name, ''), u.email) AS approved_by_name
      FROM resume_output_projections p
      LEFT JOIN users u ON u.id = p.approved_by
     WHERE p.user_id=$1 ORDER BY p.created_at DESC`).all(userId);
  const out = [];
  for (const row of rows) {
    const staleness = await checkStaleness(row.id, userId);
    out.push({
      id: Number(row.id),
      presetId: row.preset_id,
      presetName: row.preset_name,
      atomCount: Number(row.atom_count),
      generatedAt: Number(row.generated_at),
      outputStatus: row.output_status,
      lineageRootId: Number(row.lineage_root_id),
      isRoot: Number(row.lineage_root_id) === Number(row.id),
      isStale: staleness?.isStale || false,
      atomCountDelta: staleness?.atomCountDelta || 0,
      targetJobDescription: row.target_job_description || null,
      targetingResult: row.targeting_result
        ? (typeof row.targeting_result === 'string' ? JSON.parse(row.targeting_result) : row.targeting_result)
        : null,
      careerOpportunityRodId: row.career_opportunity_rod_id != null ? Number(row.career_opportunity_rod_id) : null,
      generatedContent: row.generated_content
        ? (typeof row.generated_content === 'string' ? JSON.parse(row.generated_content) : row.generated_content)
        : null,
      outputType: row.output_type || 'resume',
      source: row.source || 'ai_generated',
      metadata: projectionMetadata(row),
      share: row.share_token ? { token: row.share_token, live: row.output_status === 'published' } : null,
      shareSyncError: row.share_sync_error ? (typeof row.share_sync_error === 'string' ? JSON.parse(row.share_sync_error) : row.share_sync_error) : null,
    });
  }
  return out;
}

/** Every resume output projection generated for a specific tracked opportunity ("the attached career pipeline lead"). */
export async function listResumeOutputProjectionsForOpportunity(userId, careerOpportunityRodId) {
  const all = await listResumeOutputProjections(userId);
  return all.filter((p) => p.careerOpportunityRodId === Number(careerOpportunityRodId));
}

/** Single ownership-checked fetch — the raw row (not the list-shaped rollup) for rendering/export routes. */
export async function getResumeOutputProjectionRaw(projectionId, userId) {
  return db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, userId);
}

const ALLOWED_STATUSES = ['draft', 'approved', 'published', 'archived'];

export async function updateProjectionStatus(projectionId, userId, status) {
  if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid output status: ${status}`);
  if (status === 'approved' || status === 'published') await assertReadyToFinalize(userId);
  if (status === 'published') {
    // Publishing is an approval — record who approved it, same as
    // applicationPackages.js's approveOutputForSharing (a QR slug only ever
    // resolves for a version with a recorded approver).
    await db.prepare(`UPDATE resume_output_projections SET output_status=$1, approved_by=$3, approved_at=$4 WHERE id=$2 AND user_id=$3`).run(status, projectionId, userId, Date.now());
  } else {
    await db.prepare(`UPDATE resume_output_projections SET output_status=$1 WHERE id=$2 AND user_id=$3`).run(status, projectionId, userId);
  }
  return db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1`).get(projectionId);
}
