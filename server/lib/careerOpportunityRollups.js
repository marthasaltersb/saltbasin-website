// Career Opportunity rollups (2026-08-06, Phase 2 — Career Placement Agents
// vertical slice) — the read/write surface a member-facing panel uses for
// the career half of the Weekly Research & Outreach pipeline. Same
// architectural relationship to the raw tables that careerAtomRollups.js has
// to the legacy career_* tables: this module is where evidence/rod rows get
// assembled into something a UI can render, not a second source of truth.
//
// A career_opportunity_target rod is real evidence-bearing state, not a
// summary — creating one (createCareerOpportunity) and scoring one
// (recordDimensionScores) both write through the real substrate built in
// Phase 1 (tributaryRegistry.js, opportunityPipelineRegistry.js,
// currentRegistry.js), never a parallel in-memory or JSON-blob structure.
import { db } from '../db.js';
import { createJourneyTributary, getLinkedEntities, getLinkedPersons } from './tributaryRegistry.js';
import { findOrCreateEntity, linkRodToEntity, resolveAgentRoster, resolveApprovalWorkflow, evaluateWeightedScore } from './opportunityPipelineRegistry.js';
import { getCurrent } from './currentRegistry.js';

const CAREER_DIMENSION_KEYS = [
  'scope_altitude', 'strategic_ops_transformation', 'revenue_systems_q2r', 'ai_validation_data_intel',
  'pe_value_creation_finance', 'leadership_stakeholder_fit', 'transferable_industry_fit', 'practical_fit',
];

function parseJsonb(v, fallback) {
  if (v == null) return fallback;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

/**
 * A member's career_master rod, created lazily if they don't have one yet —
 * mirrors careerAtomRollups.js's getOrBackfillRod() shape but Career Master
 * provisioning itself (via migrateCareerDataForUser) is out of scope here;
 * this only needs *a* career_master rod to hang career_opportunity_target
 * rods off of, so a bare rod (no atoms yet) is a valid starting point.
 */
export async function getOrCreateCareerMasterRod(userId) {
  const existing = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type='career_master'`).get(userId);
  if (existing) return existing;
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO journey_data_rods (rod_type, user_id, current_stage, metadata, created_at, updated_at)
    VALUES ('career_master',$1,'requested','{}'::jsonb,$2,$2) RETURNING id
  `).run(userId, now);
  return db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(Number(result.lastInsertRowid));
}

function extractDimensionScores(evidenceRows) {
  const scores = {};
  for (const row of evidenceRows) {
    if (!row.molecule_key?.startsWith('career_dim_')) continue;
    const dimKey = row.molecule_key.slice('career_dim_'.length);
    if (!CAREER_DIMENSION_KEYS.includes(dimKey)) continue;
    const value = parseJsonb(row.value, null);
    if (typeof value === 'number') scores[dimKey] = value;
  }
  return scores;
}

async function rollupOneOpportunity(rod, current) {
  const [entities, persons, evidence] = await Promise.all([
    getLinkedEntities(rod.id),
    getLinkedPersons(rod.id),
    db.prepare(`SELECT * FROM journey_rod_evidence WHERE rod_id=$1 ORDER BY observed_at DESC`).all(rod.id),
  ]);
  const dimensionScores = extractDimensionScores(evidence);
  const scored = Object.keys(dimensionScores).length > 0;
  return {
    id: Number(rod.id),
    currentStage: rod.current_stage,
    metadata: parseJsonb(rod.metadata, {}),
    createdAt: Number(rod.created_at),
    entities: entities.map((e) => ({
      linkId: Number(e.id), entityId: Number(e.entity_id), canonicalName: e.canonical_name, entityType: e.entity_type,
      roleInContext: e.role_in_context, expansionRing: e.expansion_ring, reason: e.reason,
    })),
    persons: persons.map((p) => ({
      linkId: Number(p.id), personId: Number(p.person_id), fullName: p.full_name, publicRole: p.public_role, confidenceLabel: p.confidence_label,
    })),
    evidence: evidence.map((ev) => ({
      id: Number(ev.id), moleculeKey: ev.molecule_key, value: parseJsonb(ev.value, null),
      sourceType: ev.source_type, sourceReference: ev.source_reference, sourceTier: ev.source_tier != null ? Number(ev.source_tier) : null,
      confidence: ev.confidence != null ? Number(ev.confidence) : null, observedAt: Number(ev.observed_at),
    })),
    // Never fabricates a number: an opportunity with no recorded dimension
    // evidence yet reports score: null, not a 0 or a guessed placeholder —
    // same "honest empty state" discipline as careerAtomRollups.js.
    score: scored && current ? evaluateWeightedScore(current, dimensionScores) : null,
  };
}

/** Every career_opportunity_target rod tracked for this member, scored where evidence supports it. */
export async function listCareerOpportunities(userId) {
  const careerRod = await getOrCreateCareerMasterRod(userId);
  const rows = await db.prepare(`
    SELECT * FROM journey_data_rods WHERE parent_rod_id=$1 AND rod_type='career_opportunity_target' ORDER BY created_at DESC
  `).all(careerRod.id);
  const current = await getCurrent('career_match_scoring_v1');
  const opportunities = await Promise.all(rows.map((rod) => rollupOneOpportunity(rod, current)));
  return { careerMasterRodId: Number(careerRod.id), opportunities };
}

/**
 * Tracks a new career opportunity — what the Career Researcher agent role
 * would produce; here, a real write path a member can trigger manually
 * (agent execution itself is a later phase). Optionally links a company
 * Entity by name (find-or-create, deduped).
 */
export async function createCareerOpportunity(userId, { jobTitle, companyName = null, url = null, location = null, notes = null }) {
  if (!jobTitle) throw new Error('jobTitle is required.');
  const careerRod = await getOrCreateCareerMasterRod(userId);
  const oppRod = await createJourneyTributary({
    parentJourney: careerRod,
    tributaryType: 'career_opportunity_provisioning',
    stage: 'discovered',
    metadata: { jobTitle, url, location, notes, verifiedOpenAt: null },
  });
  if (companyName) {
    const entity = await findOrCreateEntity({ ownerUserId: userId, canonicalName: companyName, entityType: 'company' });
    await linkRodToEntity({ rod: oppRod, tributaryType: 'opportunity_entity_reference', entityId: entity.id, roleInContext: 'subject' });
  }
  return rollupOneOpportunity(oppRod, await getCurrent('career_match_scoring_v1'));
}

/**
 * Records dimension scores as real evidence (0-5 scale, spec Section 7) —
 * upserts per dimension so re-scoring an opportunity revises rather than
 * duplicates. sourceTier follows the spec's 1-4 evidence hierarchy; defaults
 * to 1 (self-reported/primary) for a member's own manual rating.
 */
export async function recordDimensionScores(userId, rodId, { dimensionScores, sourceType = 'user_manual_entry', sourceReference = 'manual-review', sourceTier = 1 }) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_opportunity_target'`).get(rodId);
  if (!rod) throw new Error('Career opportunity not found.');
  const careerRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rod.parent_rod_id);
  if (!careerRod || Number(careerRod.user_id) !== Number(userId)) throw new Error('Not your career opportunity.');

  const invalidKeys = Object.keys(dimensionScores || {}).filter((k) => !CAREER_DIMENSION_KEYS.includes(k));
  if (invalidKeys.length) throw new Error(`Unknown scoring dimension(s): ${invalidKeys.join(', ')}`);

  const now = Date.now();
  for (const [dimKey, rawValue] of Object.entries(dimensionScores || {})) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0 || value > 5) throw new Error(`Dimension "${dimKey}" must be 0-5, got ${rawValue}.`);
    await db.prepare(`
      INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, actor_key, confidence, source_tier, observed_at)
      VALUES ($1,$2,$3::jsonb,$4,$5,'user_manual_entry',1.0,$6,$7)
      ON CONFLICT (rod_id, molecule_key, source_reference) DO UPDATE SET value=excluded.value, observed_at=excluded.observed_at, source_tier=excluded.source_tier
    `).run(rodId, `career_dim_${dimKey}`, value, sourceType, sourceReference, sourceTier, now);
  }
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,metadata,created_at) VALUES ($1,'career_opportunity_scored',$2::jsonb,$3)`)
    .run(rodId, { dimensionScores, sourceType, sourceReference }, now);

  return rollupOneOpportunity(await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId), await getCurrent('career_match_scoring_v1'));
}

/** Agent roster + hierarchy scoped to the career pipeline (+ shared agents), for the Agent Hub view. */
export async function getCareerAgentHub(userId) {
  const memberships = await db.prepare(`SELECT org_id FROM org_memberships WHERE user_id=$1 LIMIT 1`).all(userId);
  const orgId = memberships[0]?.org_id ? Number(memberships[0].org_id) : null;
  const [roster, workflow] = await Promise.all([
    resolveAgentRoster({ orgId, ownerUserId: userId, pipeline: 'career' }),
    resolveApprovalWorkflow({ orgId, pipeline: 'career' }),
  ]);
  return { agents: roster, workflow };
}
