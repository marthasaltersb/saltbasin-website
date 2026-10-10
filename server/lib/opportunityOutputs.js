// Opportunity <-> application output linking, provenance, and draft versions
// (2026-10-02, World Shell navigation to a tracked job opportunity).
//
// A tracked career opportunity is a career_opportunity_target rod. An output
// (resume_output_projections row) is linked to it through the EXISTING
// nullable career_opportunity_rod_id column (added 2026-08-07) — this module
// adds no new link table. A link applies to a whole version lineage (every
// row sharing lineage_root_id) so a newly saved draft version never drops
// out of the opportunity it belongs to.
//
// Provenance is computed, never stored as free text: where the output came
// from (imported package vs generated from Career Master), when, by whom,
// which version it is in its lineage, and the Career Master state it was
// filed against compared with the Career Master now.
import { db } from '../db.js';
import { createResumeOutputProjection, computeCareerStateFingerprint, projectionMetadata } from './resumeProjection.js';
import { assertDocumentBlocks, sameContent } from './applicationPackages.js';
import { listCareerOpportunities, createCareerOpportunity } from './careerOpportunityRollups.js';

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

/**
 * The block-editor view of an output's content, or null when it cannot be
 * edited as a document. document_blocks content is returned as-is. An
 * imported plain-text document ({ rawText }) is opened as paragraphs - saving
 * writes a new document_blocks version; the imported original stays as it was.
 */
export function editableDocumentContent(rawContent) {
  const content = parseJson(rawContent);
  if (content?.format === 'document_blocks') return { content, convertedFrom: null };
  if (typeof content?.rawText === 'string' && content.rawText.trim()) {
    const blocks = content.rawText.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean).map((text) => ({ type: 'paragraph', text }));
    return { content: { format: 'document_blocks', version: 1, header: { name: '', headline: '', contact: '' }, blocks }, convertedFrom: 'rawText' };
  }
  return null;
}

function sourceLabelFor(row) {
  if (row.source !== 'imported') return 'Generated from your Career Master';
  if (String(row.preset_id || '').startsWith('application_package:')) return 'Imported application package';
  return 'Imported document (uploaded by you)';
}

/** Ownership check shared by every opportunity-scoped output action. */
export async function assertOwnedOpportunity(userId, rodId) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_opportunity_target'`).get(rodId);
  if (!rod) throw new Error('Career opportunity not found.');
  const careerRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rod.parent_rod_id);
  if (!careerRod || Number(careerRod.user_id) !== Number(userId)) throw new Error('Not your career opportunity.');
  return rod;
}

async function ownedOutput(userId, projectionId) {
  const row = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, userId);
  if (!row) throw new Error('Output not found.');
  return row;
}

/** Links an output's whole lineage to an opportunity (moves it if linked elsewhere). */
export async function linkOutputToOpportunity(userId, projectionId, rodId) {
  await assertOwnedOpportunity(userId, rodId);
  const row = await ownedOutput(userId, projectionId);
  const root = Number(row.lineage_root_id || row.id);
  const result = await db.prepare(`
    UPDATE resume_output_projections SET career_opportunity_rod_id=$1
     WHERE user_id=$2 AND COALESCE(lineage_root_id, id)=$3
  `).run(rodId, userId, root);
  return { lineageRootId: root, versionsLinked: result.changes };
}

/** Unlinks an output's lineage from this opportunity. The output itself is untouched. */
export async function unlinkOutputFromOpportunity(userId, projectionId, rodId) {
  await assertOwnedOpportunity(userId, rodId);
  const row = await ownedOutput(userId, projectionId);
  const root = Number(row.lineage_root_id || row.id);
  const result = await db.prepare(`
    UPDATE resume_output_projections SET career_opportunity_rod_id=NULL
     WHERE user_id=$1 AND COALESCE(lineage_root_id, id)=$2 AND career_opportunity_rod_id=$3
  `).run(userId, root, rodId);
  if (!result.changes) throw new Error('That output is not linked to this opportunity.');
  return { lineageRootId: root, versionsUnlinked: result.changes };
}

async function careerMasterCounts(userId) {
  const one = async (table) => Number((await db.prepare(`SELECT COUNT(*)::int AS n FROM ${table} WHERE user_id=$1`).get(userId)).n);
  const [jobs, skills, tools, certifications, engagements] = await Promise.all([
    one('career_jobs'), one('career_skills'), one('career_tools'), one('career_certifications'), one('career_engagements'),
  ]);
  return { jobs, skills, tools, certifications, engagements };
}

/**
 * Every output linked to this opportunity, one entry per document (lineage),
 * newest version first, each carrying the provenance block the UI shows.
 */
export async function listOpportunityOutputs(userId, rodId) {
  await assertOwnedOpportunity(userId, rodId);
  const linked = await db.prepare(`
    SELECT p.*, COALESCE(NULLIF(u.display_name, ''), u.email) AS approved_by_name
      FROM resume_output_projections p LEFT JOIN users u ON u.id = p.approved_by
     WHERE p.user_id=$1 AND p.career_opportunity_rod_id=$2
     ORDER BY p.created_at DESC, p.id DESC
  `).all(userId, rodId);
  if (!linked.length) return { outputs: [], careerMaster: await careerMasterCounts(userId), memberSite: await memberSiteInfo(userId) };

  const roots = [...new Set(linked.map((r) => Number(r.lineage_root_id || r.id)))];
  const lineageRows = await db.prepare(`
    SELECT id, lineage_root_id, created_at, output_status, parent_version_id, share_token
      FROM resume_output_projections WHERE user_id=$1 AND COALESCE(lineage_root_id, id) = ANY($2::bigint[])
     ORDER BY created_at ASC, id ASC
  `).all(userId, roots);
  const current = await computeCareerStateFingerprint(userId);
  const counts = await careerMasterCounts(userId);

  const outputs = [];
  for (const root of roots) {
    const versions = lineageRows.filter((r) => Number(r.lineage_root_id || r.id) === root);
    const latest = linked.find((r) => Number(r.lineage_root_id || r.id) === root);
    const meta = projectionMetadata(latest);
    const versionNumber = versions.findIndex((v) => Number(v.id) === Number(latest.id)) + 1;
    const editable = !!editableDocumentContent(latest.generated_content);
    const filedFingerprint = latest.career_state_fingerprint;
    outputs.push({
      id: Number(latest.id),
      title: latest.preset_name || 'Output',
      outputType: latest.output_type || 'resume',
      status: latest.output_status,
      editable,
      notEditableReason: editable ? null : 'This output was generated in a different format and cannot be opened in the block editor.',
      // The QR slug follows the document's lineage: it may sit on an older
      // approved version while a newer draft exists, and says which.
      share: (() => {
        const holder = versions.find((v) => v.share_token);
        return holder ? { token: holder.share_token, live: holder.output_status === 'published', versionNumber: versions.indexOf(holder) + 1, isShownVersion: Number(holder.id) === Number(latest.id), outputId: Number(holder.id) } : null;
      })(),
      provenance: {
        source: latest.source || 'ai_generated',
        sourceLabel: sourceLabelFor(latest),
        presetId: latest.preset_id,
        importedOrGeneratedAt: Number(latest.generated_at),
        documentCreatedAt: meta.createdAt,
        lastChangedAt: meta.modifiedAt,
        authors: meta.authors,
        approvedAt: meta.approvedAt,
        approvedBy: meta.approvedBy,
        versionNumber,
        versionCount: versions.length,
        lineageRootId: root,
        parentVersionId: latest.parent_version_id != null ? Number(latest.parent_version_id) : null,
        lineage: versions.map((v, i) => ({
          id: Number(v.id), version: i + 1, createdAt: Number(v.created_at), status: v.output_status,
          parentVersionId: v.parent_version_id != null ? Number(v.parent_version_id) : null,
          isQrVersion: !!v.share_token, isShown: Number(v.id) === Number(latest.id),
        })),
        // The Career Master state this output was filed against vs the
        // Career Master now. 'no-career-state' means the member had no
        // Career Master evidence when it was filed — said plainly.
        careerState: {
          filedAgainstFingerprint: filedFingerprint && filedFingerprint !== 'no-career-state' ? filedFingerprint.slice(0, 12) : null,
          filedAtomCount: Number(latest.atom_count),
          currentAtomCount: current.atomCount,
          unchangedSinceFiled: !!filedFingerprint && filedFingerprint === current.fingerprint,
          careerMasterRodId: current.rodId,
        },
      },
    });
  }
  return { outputs, careerMaster: counts, memberSite: await memberSiteInfo(userId) };
}

// The member's own Salt Basin site: its slug and whether a published version
// exists (an unpublished site has no public page, so the UI must not link to one).
async function memberSiteInfo(userId) {
  const row = await db.prepare(`SELECT slug FROM member_profiles WHERE user_id=$1`).get(userId);
  const published = await db.prepare(`SELECT 1 AS ok FROM member_sites WHERE user_id=$1 AND kind='published'`).get(userId);
  return { slug: row?.slug || null, published: !!published };
}

/** The member's outputs that are not linked to any opportunity — candidates for "Link existing output". */
export async function listUnlinkedOutputs(userId) {
  const rows = await db.prepare(`
    SELECT id, preset_name, output_type, output_status, generated_at, lineage_root_id
      FROM resume_output_projections WHERE user_id=$1 AND career_opportunity_rod_id IS NULL
     ORDER BY created_at DESC, id DESC
  `).all(userId);
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const root = Number(r.lineage_root_id || r.id);
    if (seen.has(root)) continue; // newest version per document only
    seen.add(root);
    out.push({ id: Number(r.id), title: r.preset_name || 'Output', outputType: r.output_type || 'resume', status: r.output_status, generatedAt: Number(r.generated_at) });
  }
  return out;
}

/** The document content of one owned output, for the editor. */
export async function getOutputContentForEdit(userId, projectionId) {
  const row = await ownedOutput(userId, projectionId);
  const editable = editableDocumentContent(row.generated_content);
  if (!editable) throw new Error('This output cannot be opened in the block editor (it is neither a document-block nor an imported plain-text output).');
  return { id: Number(row.id), title: row.preset_name || 'Output', outputType: row.output_type, status: row.output_status, content: editable.content, convertedFrom: editable.convertedFrom };
}

/**
 * Saves edited content as a NEW draft version in the same lineage. Approved
 * versions and their QR are never modified — the member approves the new
 * version explicitly (and the QR then follows it).
 */
export async function saveEditedVersion(userId, projectionId, { content, name = null }) {
  const row = await ownedOutput(userId, projectionId);
  assertDocumentBlocks(content);
  const unchangedName = !name || name === row.preset_name;
  const baseline = editableDocumentContent(row.generated_content)?.content ?? row.generated_content;
  if (sameContent(baseline, content) && unchangedName) throw new Error('No changes to save.');
  const projection = await createResumeOutputProjection(userId, {
    presetId: row.preset_id,
    presetName: name || row.preset_name,
    generatedContent: content,
    outputType: row.output_type || 'resume',
    source: row.source || 'imported',
    regenerateFromId: Number(row.id),
    targetJobDescription: row.target_job_description || null,
    careerOpportunityRodId: row.career_opportunity_rod_id != null ? Number(row.career_opportunity_rod_id) : null,
    authors: parseJson(row.authors) || [],
    sourceCreatedAt: row.source_created_at != null ? Number(row.source_created_at) : null,
  });
  await db.prepare(`UPDATE resume_output_projections SET parent_version_id=$1 WHERE id=$2 AND user_id=$3`).run(Number(row.id), projection.id, userId);
  return { id: Number(projection.id), parentVersionId: Number(row.id), lineageRootId: Number(projection.lineage_root_id) };
}

/**
 * Finds the member's tracked opportunity for this company + role title
 * (case-insensitive), or creates a placeholder (company + role only — details
 * are filled in later). Used by the package import's --link-opportunity.
 */
export async function ensurePlaceholderOpportunity(userId, { company, role }) {
  const co = String(company || '').trim();
  const title = String(role || '').trim();
  if (!co || !title) throw new Error('Both a company and a role title are needed to create the placeholder opportunity.');
  const { opportunities } = await listCareerOpportunities(userId);
  const existing = opportunities.find((o) => String(o.metadata?.jobTitle || '').trim().toLowerCase() === title.toLowerCase()
    && (o.entities || []).some((e) => String(e.canonicalName || '').trim().toLowerCase() === co.toLowerCase()));
  if (existing) return { id: existing.id, created: false };
  const created = await createCareerOpportunity(userId, { jobTitle: title, companyName: co, extraMetadata: { placeholder: true } });
  return { id: created.id, created: true };
}

/** Fills in details of a tracked opportunity (any placeholder becomes a regular entry once a detail is given). */
export async function updateOpportunityDetails(userId, rodId, { jobTitle, url, location, notes }) {
  const rod = await assertOwnedOpportunity(userId, rodId);
  const metadata = { ...(parseJson(rod.metadata) || {}) };
  if (jobTitle !== undefined) {
    if (!String(jobTitle).trim()) throw new Error('Job title cannot be empty.');
    metadata.jobTitle = String(jobTitle).trim();
  }
  let detailGiven = false;
  for (const [k, v] of Object.entries({ url, location, notes })) {
    if (v === undefined) continue;
    metadata[k] = v === null || String(v).trim() === '' ? null : String(v).trim();
    if (metadata[k]) detailGiven = true;
  }
  if (detailGiven) metadata.placeholder = false;
  await db.prepare(`UPDATE journey_data_rods SET metadata=$1::jsonb, updated_at=$2 WHERE id=$3`).run(metadata, Date.now(), rodId);
  const { opportunities } = await listCareerOpportunities(userId);
  return opportunities.find((o) => o.id === Number(rodId));
}

/**
 * Tracks a new opportunity. A track with only a company + role title is a placeholder (details are filled in
 * later and the entry says so). Shared by POST /api/career-agents/opportunities and the MCP tool
 * career_opportunity_create.
 */
export async function trackCareerOpportunity(userId, { jobTitle, companyName, url, location, notes } = {}) {
  const placeholder = !url && !location && !notes;
  return createCareerOpportunity(userId, { jobTitle, companyName, url, location, notes, extraMetadata: placeholder ? { placeholder: true } : null });
}

/** One tracked opportunity (as the list shows it) with its linked outputs and provenance. */
export async function openCareerOpportunity(userId, rodId) {
  await assertOwnedOpportunity(userId, rodId);
  const { opportunities } = await listCareerOpportunities(userId);
  const opportunity = opportunities.find((o) => Number(o.id) === Number(rodId));
  if (!opportunity) throw new Error('Career opportunity not found.');
  return { opportunity, ...(await listOpportunityOutputs(userId, rodId)) };
}
