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

export async function createResumeOutputProjection(userId, { presetId, presetName, includedSections = [], regenerateFromId = null, targetJobDescription = null, careerOpportunityRodId = null, generatedContent = null, outputType = 'resume' }) {
  const { fingerprint, atomCount } = await computeCareerStateFingerprint(userId);
  if (!fingerprint) throw new Error('No Career Master Channel Rod or evidence found for this member — nothing to project yet.');
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
      (user_id, preset_id, preset_name, included_sections, career_state_fingerprint, atom_count, generated_at, effective_career_state_at, output_status, lineage_root_id, target_job_description, targeting_result, career_opportunity_rod_id, generated_content, output_type, created_at)
    VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$7,'draft',$8,$9,$10::jsonb,$11,$12::jsonb,$13,$7)
    RETURNING id
  `).run(userId, presetId, presetName || null, includedSections, fingerprint, atomCount, now, lineageRootId, targetJobDescription || null, targetingResult || null, careerOpportunityRodId, generatedContent, outputType);
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
  const isStale = current.fingerprint !== projection.career_state_fingerprint;
  return {
    projectionId: Number(projectionId),
    isStale,
    currentAtomCount: current.atomCount,
    projectionAtomCount: Number(projection.atom_count),
    atomCountDelta: current.atomCount - Number(projection.atom_count),
  };
}

export async function listResumeOutputProjections(userId) {
  const rows = await db.prepare(`SELECT * FROM resume_output_projections WHERE user_id=$1 ORDER BY created_at DESC`).all(userId);
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
    });
  }
  return out;
}

/** Every resume output projection generated for a specific tracked opportunity ("the attached career pipeline lead"). */
export async function listResumeOutputProjectionsForOpportunity(userId, careerOpportunityRodId) {
  const all = await listResumeOutputProjections(userId);
  return all.filter((p) => p.careerOpportunityRodId === Number(careerOpportunityRodId));
}

const ALLOWED_STATUSES = ['draft', 'approved', 'published', 'archived'];

export async function updateProjectionStatus(projectionId, userId, status) {
  if (!ALLOWED_STATUSES.includes(status)) throw new Error(`Invalid output status: ${status}`);
  await db.prepare(`UPDATE resume_output_projections SET output_status=$1 WHERE id=$2 AND user_id=$3`).run(status, projectionId, userId);
  return db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1`).get(projectionId);
}
