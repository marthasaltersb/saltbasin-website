// Commercial Opportunity rollups (2026-08-06, Phase 3 — Commercial
// Opportunity Pipeline vertical slice, mirroring careerOpportunityRollups.js
// for the spec's other pipeline). Unlike career_opportunity_target,
// commercial_opportunity_target rods have no natural Tributary parent (per
// Phase 1's data-model audit — there's no single "GTM rod" a commercial
// opportunity is provisioned from) — they're standalone, scoped by org_id
// when the acting admin belongs to an org, else by user_id directly.
import { db } from '../db.js';
import { getLinkedEntities, getLinkedPersons } from './tributaryRegistry.js';
import { findOrCreateEntity, linkRodToEntity, resolveAgentRoster, resolveApprovalWorkflow, evaluateWeightedScore } from './opportunityPipelineRegistry.js';
import { getCurrent } from './currentRegistry.js';

const COMMERCIAL_DIMENSION_KEYS = [
  'trigger_strength', 'solution_fit', 'economic_materiality', 'timing_urgency',
  'evidence_gap_plausibility', 'access_relationship_path', 'serviceability',
];

function parseJsonb(v, fallback) {
  if (v == null) return fallback;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

/** Resolves whether the acting admin should scope commercial rods by org_id or by user_id directly. */
async function resolveScope(userId) {
  const memberships = await db.prepare(`SELECT org_id FROM org_memberships WHERE user_id=$1 LIMIT 1`).all(userId);
  const orgId = memberships[0]?.org_id ? Number(memberships[0].org_id) : null;
  return orgId ? { orgId, userId: null } : { orgId: null, userId };
}

function extractDimensionScores(evidenceRows) {
  const scores = {};
  for (const row of evidenceRows) {
    if (!row.molecule_key?.startsWith('commercial_dim_')) continue;
    const dimKey = row.molecule_key.slice('commercial_dim_'.length);
    if (!COMMERCIAL_DIMENSION_KEYS.includes(dimKey)) continue;
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
    // Never fabricates a number or a tier: no evidence means score: null,
    // same "honest empty state" discipline as the career rollups.
    score: scored && current ? evaluateWeightedScore(current, dimensionScores) : null,
  };
}

/** Every commercial_opportunity_target rod tracked in this scope, scored where evidence supports it. */
export async function listCommercialOpportunities(userId) {
  const scope = await resolveScope(userId);
  const rows = scope.orgId
    ? await db.prepare(`SELECT * FROM journey_data_rods WHERE org_id=$1 AND rod_type='commercial_opportunity_target' ORDER BY created_at DESC`).all(scope.orgId)
    : await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND org_id IS NULL AND rod_type='commercial_opportunity_target' ORDER BY created_at DESC`).all(scope.userId);
  const current = await getCurrent('commercial_opportunity_scoring_v1');
  const opportunities = await Promise.all(rows.map((rod) => rollupOneOpportunity(rod, current)));
  return { opportunities };
}

/**
 * Tracks a new commercial opportunity — what the Target Expansion
 * Researcher / Market Signal Researcher agents would produce; a real manual
 * write path here (agent execution itself is a later phase). Optionally
 * links a company Entity by name (find-or-create, deduped) and records the
 * spec's target-expansion-ring metadata when the opportunity was discovered
 * via adjacency to an existing target.
 */
export async function createCommercialOpportunity(userId, { companyName, eventTrigger = null, hypothesis = null, expansionRing = null, parentEntityName = null, reason = null }) {
  if (!companyName) throw new Error('companyName is required.');
  const scope = await resolveScope(userId);
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO journey_data_rods (rod_type, user_id, org_id, current_stage, metadata, created_at, updated_at)
    VALUES ('commercial_opportunity_target',$1,$2,'discovered',$3::jsonb,$4,$4) RETURNING id
  `).run(scope.userId, scope.orgId, { companyName, eventTrigger, hypothesis }, now);
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(Number(result.lastInsertRowid));

  const entity = await findOrCreateEntity({ orgId: scope.orgId, ownerUserId: scope.userId, canonicalName: companyName, entityType: 'company' });
  let parentEntityId = null;
  if (parentEntityName) {
    const parentEntity = await findOrCreateEntity({ orgId: scope.orgId, ownerUserId: scope.userId, canonicalName: parentEntityName, entityType: 'company' });
    parentEntityId = parentEntity.id;
  }
  await linkRodToEntity({ rod, tributaryType: 'opportunity_entity_reference', entityId: entity.id, roleInContext: 'subject', expansionRing, parentEntityId, reason });

  return rollupOneOpportunity(rod, await getCurrent('commercial_opportunity_scoring_v1'));
}

/**
 * Records dimension scores as real evidence (0-5 scale, spec Section 6) —
 * upserts per dimension so re-scoring revises rather than duplicates.
 */
export async function recordCommercialDimensionScores(userId, rodId, { dimensionScores, sourceType = 'user_manual_entry', sourceReference = 'manual-review', sourceTier = 1 }) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='commercial_opportunity_target'`).get(rodId);
  if (!rod) throw new Error('Commercial opportunity not found.');
  const scope = await resolveScope(userId);
  const owns = scope.orgId ? Number(rod.org_id) === scope.orgId : Number(rod.user_id) === scope.userId;
  if (!owns) throw new Error('Not your commercial opportunity.');

  const invalidKeys = Object.keys(dimensionScores || {}).filter((k) => !COMMERCIAL_DIMENSION_KEYS.includes(k));
  if (invalidKeys.length) throw new Error(`Unknown scoring dimension(s): ${invalidKeys.join(', ')}`);

  const now = Date.now();
  for (const [dimKey, rawValue] of Object.entries(dimensionScores || {})) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0 || value > 5) throw new Error(`Dimension "${dimKey}" must be 0-5, got ${rawValue}.`);
    await db.prepare(`
      INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, actor_key, confidence, source_tier, observed_at)
      VALUES ($1,$2,$3::jsonb,$4,$5,'user_manual_entry',1.0,$6,$7)
      ON CONFLICT (rod_id, molecule_key, source_reference) DO UPDATE SET value=excluded.value, observed_at=excluded.observed_at, source_tier=excluded.source_tier
    `).run(rodId, `commercial_dim_${dimKey}`, value, sourceType, sourceReference, sourceTier, now);
  }
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,metadata,created_at) VALUES ($1,'commercial_opportunity_scored',$2::jsonb,$3)`)
    .run(rodId, { dimensionScores, sourceType, sourceReference }, now);

  return rollupOneOpportunity(await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId), await getCurrent('commercial_opportunity_scoring_v1'));
}

/** Agent roster + hierarchy scoped to the commercial pipeline (+ shared agents), for the Agent Hub view. */
export async function getCommercialAgentHub(userId) {
  const scope = await resolveScope(userId);
  const [roster, workflow] = await Promise.all([
    resolveAgentRoster({ orgId: scope.orgId, ownerUserId: scope.userId, pipeline: 'commercial' }),
    resolveApprovalWorkflow({ orgId: scope.orgId, pipeline: 'commercial' }),
  ]);
  return { agents: roster, workflow };
}
