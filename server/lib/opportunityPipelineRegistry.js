// Opportunity Pipeline Registry (2026-08-06) — shared infrastructure for the
// Salt Basin Weekly Research & Outreach Master Agent spec's two pipelines
// (commercial and career), built after a reuse-first audit via the
// salt-basin-channel-journey-architecture skill. Classification summary:
//
//   REUSES EXISTING SUBSTRATE
//     - Claim/Evidence          -> journey_rod_evidence (source_type,
//                                  source_reference, confidence already
//                                  there; +1 additive column, source_tier).
//     - Signal/Event taxonomy   -> journey_metadata_molecules/_clusters'
//                                  signal/business_hypothesis cluster keys
//                                  (server/lib/lonetreeDemoRegistry.js),
//                                  plus new journey_rod_events event_types
//                                  (config, not schema).
//     - Scoring dimensions +
//       outreach cadence        -> journey_current_definitions, via
//                                  currentRegistry.js's existing org_id
//                                  NULL=default/org_id=override seam. See
//                                  evaluateWeightedScore() below, which
//                                  interprets a Current's entryCriteria as a
//                                  {dimensions,tiers} or {touches} shape —
//                                  currentRegistry.js itself stays
//                                  domain-agnostic, same relationship
//                                  eidosBonding.js has to
//                                  journey_atom_affinity_rules.
//     - Target-expansion rings  -> tributaryRegistry.js's new 'reference'
//                                  relationshipKind (opportunity_entity_
//                                  reference / opportunity_person_reference)
//                                  + journey_rod_entity_links' expansion_ring/
//                                  parent_entity_id/reason columns.
//     - Career-opportunity <->
//       real Career Master       -> career_opportunity_provisioning
//                                  Tributary (hierarchical, career_master
//                                  parent), so match scoring reads a
//                                  member's actual Career Atoms, never a
//                                  fabricated profile.
//     - Per-org/per-user scope  -> existing riverbedRegistry.js resolution
//                                  + org_memberships/data_entitlements; no
//                                  new scoping mechanism.
//
//   NEW TABLES, JUSTIFIED (no existing surface fit any of the six
//   reuse-first checklist items — see server/db.js's bootstrap() comment at
//   the Career Placement Agents section for the full per-table reasoning)
//     - entities, persons, relationships — shared master data referenced by
//       many rods, not owned by exactly one parent rod (rules out the
//       existing 'satellite' Tributary shape).
//     - agent_definitions, agent_schedules, agent_approval_workflows — the
//       Agent Boundary gap this codebase's own audit skill already flags as
//       "design-stage only, not implemented anywhere." Agent *actions*
//       reuse journey_rod_events; only the role/capability/schedule
//       *definitions* are new tables.
//
// Every list below (agent roster, scoring weights, expansion rings, source
// tiers, approval-workflow gates) is governed config an org can override via
// the org_id seam, not hardcoded business logic — a different org gets its
// own empty/different set through these same tables, never a fork.
import { db } from '../db.js';
import { validateReferenceTributary, linkRodToEntity, linkRodToPerson } from './tributaryRegistry.js';

// ── Fixed taxonomy (spec Sections 3 and 4) — the *shape* every org's
// expansion/evidence follows is shared vocabulary, not a hardcoded target
// list. Which entities land in which ring, and which evidence carries which
// tier, is per-org/per-user DATA in journey_rod_entity_links/
// journey_rod_evidence, never encoded here. ──
export const SOURCE_TIERS = Object.freeze({
  1: { key: 'primary', label: 'Primary', examples: 'Company newsroom, investor relations, SEC/regulatory filings, official careers pages, fund portfolio pages, lender or court filings, earnings materials, executive biographies.' },
  2: { key: 'authoritative_reporting', label: 'Authoritative reporting', examples: 'Reuters, Bloomberg, Financial Times, WSJ and high-quality trade publications with original reporting.' },
  3: { key: 'structured_discovery', label: 'Structured discovery', examples: 'LinkedIn public pages, job boards, PitchBook-like directories, sponsor/portfolio indexes, conference agendas, professional associations.' },
  4: { key: 'leads_only', label: 'Leads only', examples: 'Aggregators, reposts, snippets, social commentary and unsourced databases — generate search leads only.' },
});

export const EXPANSION_RINGS = Object.freeze({
  ring_0: { label: 'Ring 0 — Canonical targets', description: 'Already present in the existing reports and workbooks.' },
  ring_1: { label: 'Ring 1 — Ownership graph', description: 'Sponsor portfolio, former ownership, add-ons, buyers, sellers, lenders, strategic investors and board relationships.' },
  ring_2: { label: 'Ring 2 — Business-model peers', description: 'Same buyer, revenue model, customer base, product category, capital structure or operating challenge.' },
  ring_3: { label: 'Ring 3 — Event peers', description: 'Companies experiencing the same trigger regardless of sector.' },
  ring_4: { label: 'Ring 4 — Talent peers', description: 'Companies hiring adjacent roles or leaders with relevant mandates.' },
  ring_5: { label: 'Ring 5 — Ecosystem routes', description: 'Advisors, implementation partners, vendors, recruiters, portfolio talent teams and professional communities.' },
});

export const CONTACT_CONFIDENCE_LABELS = Object.freeze([
  'confirmed_by_employer',
  'strong_public_functional_evidence',
  'plausible_function_only',
  'recruiter_route',
  'unverified_lead',
]);

function parseJsonb(v, fallback) {
  if (v == null) return fallback;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

// ── Entity / Person / Relationship — shared master data ──

/**
 * Finds an existing Entity in scope by case-insensitive canonical_name
 * match, or creates one. Scope is org-first (shared across an org's
 * members) then owner_user_id (a Member-scoped personal target universe) —
 * matching riverbedRegistry.js's Member-vs-Member-Organization resolution.
 * Never silently merges two differently-named entities; that stays a human
 * "merge duplicate" decision (spec Section 19), recorded via merged_into_id.
 */
export async function findOrCreateEntity({ orgId = null, ownerUserId = null, canonicalName, entityType = 'company', aliases = [], ownershipSummary = null, metadata = {} }) {
  const existing = orgId
    ? await db.prepare(`SELECT * FROM entities WHERE org_id=$1 AND lower(canonical_name)=lower($2) AND merged_into_id IS NULL`).get(orgId, canonicalName)
    : await db.prepare(`SELECT * FROM entities WHERE owner_user_id=$1 AND org_id IS NULL AND lower(canonical_name)=lower($2) AND merged_into_id IS NULL`).get(ownerUserId, canonicalName);
  if (existing) return existing;
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO entities (org_id, owner_user_id, canonical_name, aliases, entity_type, ownership_summary, metadata, created_at, updated_at)
    VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7::jsonb,$8,$8) RETURNING id
  `).run(orgId, ownerUserId, canonicalName, aliases, entityType, ownershipSummary, metadata, now);
  return db.prepare(`SELECT * FROM entities WHERE id=$1`).get(Number(result.lastInsertRowid));
}

/** Same find-or-create pattern as findOrCreateEntity(), for Persons. */
export async function findOrCreatePerson({ orgId = null, ownerUserId = null, entityId = null, fullName, publicRole = null, confidenceLabel = 'unverified_lead', sourceType = null, sourceReference = null, metadata = {} }) {
  if (!CONTACT_CONFIDENCE_LABELS.includes(confidenceLabel)) {
    throw new Error(`Invalid confidenceLabel "${confidenceLabel}" — must be one of ${CONTACT_CONFIDENCE_LABELS.join(', ')}.`);
  }
  const existing = orgId
    ? await db.prepare(`SELECT * FROM persons WHERE org_id=$1 AND lower(full_name)=lower($2) AND merged_into_id IS NULL`).get(orgId, fullName)
    : await db.prepare(`SELECT * FROM persons WHERE owner_user_id=$1 AND org_id IS NULL AND lower(full_name)=lower($2) AND merged_into_id IS NULL`).get(ownerUserId, fullName);
  if (existing) return existing;
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO persons (org_id, owner_user_id, entity_id, full_name, public_role, confidence_label, source_type, source_reference, metadata, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$10) RETURNING id
  `).run(orgId, ownerUserId, entityId, fullName, publicRole, confidenceLabel, sourceType, sourceReference, metadata, now);
  return db.prepare(`SELECT * FROM persons WHERE id=$1`).get(Number(result.lastInsertRowid));
}

/**
 * Records a Relationship — the known connection between a Person and/or
 * Entity and a specific member. Per spec Section 11: consent defaults false;
 * only public professional data, never enriched sensitive personal data.
 */
export async function recordRelationship({ orgId = null, ownerUserId, personId = null, entityId = null, route = null, strength = null, origin = null, consent = false, lastInteractionAt = null, metadata = {} }) {
  if (personId == null && entityId == null) throw new Error('recordRelationship requires personId and/or entityId.');
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO relationships (org_id, owner_user_id, person_id, entity_id, route, strength, origin, consent, last_interaction_at, metadata, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$11) RETURNING id
  `).run(orgId, ownerUserId, personId, entityId, route, strength, origin, consent, lastInteractionAt, metadata, now);
  return db.prepare(`SELECT * FROM relationships WHERE id=$1`).get(Number(result.lastInsertRowid));
}

// Re-exported for callers that want the reference-Tributary link helpers
// alongside the entity/person CRUD above without importing tributaryRegistry
// directly.
export { validateReferenceTributary, linkRodToEntity, linkRodToPerson };

// ── Agent roster / schedule / approval workflow resolution ──
// Same org_id-NULL-is-default/org_id-set-is-override precedence as
// currentRegistry.js's resolveCurrentTemplate(), extended with a third,
// most-specific tier (owner_user_id) since a Member may want a personally
// customized agent (e.g. their own Career Researcher) layered over their
// org's version, layered over the platform default.

function rowToAgentDefinition(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    orgId: row.org_id != null ? Number(row.org_id) : null,
    ownerUserId: row.owner_user_id != null ? Number(row.owner_user_id) : null,
    key: row.key,
    name: row.name,
    pipeline: row.pipeline,
    roleDescription: row.role_description,
    objective: row.objective,
    capabilities: parseJsonb(row.capabilities, []),
    boundaries: parseJsonb(row.boundaries, []),
    reportsToAgentId: row.reports_to_agent_id != null ? Number(row.reports_to_agent_id) : null,
    tier: Number(row.tier),
    agentBoundaryRef: row.agent_boundary_ref != null ? parseJsonb(row.agent_boundary_ref, null) : null,
    isActive: !!row.is_active,
  };
}

/**
 * Resolves the full agent roster visible to a given scope: platform-default
 * rows (org_id/owner_user_id both NULL), shadowed by an org-level row with
 * the same `key`, shadowed by a member-level row with the same `key` — most
 * specific wins per key, same "first write wins, ordered specific-first"
 * pattern as resolveCurrentTemplate().
 */
export async function resolveAgentRoster({ orgId = null, ownerUserId = null, pipeline = null } = {}) {
  const rows = await db.prepare(`
    SELECT * FROM agent_definitions
    WHERE is_active=true
      AND (org_id IS NULL AND owner_user_id IS NULL
           OR ($1::bigint IS NOT NULL AND org_id=$1)
           OR ($2::bigint IS NOT NULL AND owner_user_id=$2))
      AND ($3::text IS NULL OR pipeline=$3 OR pipeline='shared')
    ORDER BY key,
      (org_id IS NULL AND owner_user_id IS NULL) DESC,
      (owner_user_id IS NOT NULL) ASC
  `).all(orgId, ownerUserId, pipeline);
  const byKey = {};
  for (const row of rows) {
    const specificity = row.owner_user_id != null ? 2 : row.org_id != null ? 1 : 0;
    if (!byKey[row.key] || specificity > byKey[row.key]._specificity) {
      byKey[row.key] = { ...rowToAgentDefinition(row), _specificity: specificity };
    }
  }
  return Object.values(byKey).map(({ _specificity, ...def }) => def);
}

export async function createAgentDefinition({ orgId = null, ownerUserId = null, key, name, pipeline = 'shared', roleDescription = null, objective = null, capabilities = [], boundaries = [], reportsToAgentId = null, tier = 1 }) {
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO agent_definitions (org_id, owner_user_id, key, name, pipeline, role_description, objective, capabilities, boundaries, reports_to_agent_id, tier, is_active, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,true,$12,$12) RETURNING id
  `).run(orgId, ownerUserId, key, name, pipeline, roleDescription, objective, capabilities, boundaries, reportsToAgentId, tier, now);
  return db.prepare(`SELECT * FROM agent_definitions WHERE id=$1`).get(Number(result.lastInsertRowid));
}

export async function assignAgentSchedule({ agentDefinitionId, orgId = null, ownerUserId = null, cadence = 'on_demand', cadenceDetail = {}, triggerMode = 'scheduled', triggerMoleculeKey = null, actionKey = null }) {
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO agent_schedules (agent_definition_id, org_id, owner_user_id, cadence, cadence_detail, trigger_mode, trigger_molecule_key, action_key, is_active, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,true,$9,$9) RETURNING id
  `).run(agentDefinitionId, orgId, ownerUserId, cadence, cadenceDetail, triggerMode, triggerMoleculeKey, actionKey, now);
  return db.prepare(`SELECT * FROM agent_schedules WHERE id=$1`).get(Number(result.lastInsertRowid));
}

/**
 * Create-or-update the single schedule row for a given (agent, owner/org,
 * action) — the Automation UI changes cadence in place rather than
 * accumulating duplicate rows every time a member re-picks a preset.
 * next_run_at is (re)computed by the caller (agentDispatcher.js on each due
 * run, or the schedule route on save) from the cadence preset's intervalMs —
 * this function only persists the selection.
 */
export async function upsertAgentSchedule({ agentDefinitionId, orgId = null, ownerUserId = null, actionKey = null, cadence, cadenceDetail = {}, nextRunAt = null }) {
  const existing = await db.prepare(`
    SELECT * FROM agent_schedules
    WHERE agent_definition_id=$1 AND action_key IS NOT DISTINCT FROM $2
      AND org_id IS NOT DISTINCT FROM $3 AND owner_user_id IS NOT DISTINCT FROM $4
  `).get(agentDefinitionId, actionKey, orgId, ownerUserId);
  const now = Date.now();
  if (existing) {
    await db.prepare(`
      UPDATE agent_schedules SET cadence=$1, cadence_detail=$2::jsonb, next_run_at=$3, is_active=true, updated_at=$4 WHERE id=$5
    `).run(cadence, cadenceDetail, nextRunAt, now, existing.id);
    return db.prepare(`SELECT * FROM agent_schedules WHERE id=$1`).get(existing.id);
  }
  const result = await db.prepare(`
    INSERT INTO agent_schedules (agent_definition_id, org_id, owner_user_id, cadence, cadence_detail, action_key, next_run_at, is_active, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,true,$8,$8) RETURNING id
  `).run(agentDefinitionId, orgId, ownerUserId, cadence, cadenceDetail, actionKey, nextRunAt, now);
  return db.prepare(`SELECT * FROM agent_schedules WHERE id=$1`).get(Number(result.lastInsertRowid));
}

export async function resolveAgentSchedules(agentDefinitionId, { ownerUserId = null } = {}) {
  return ownerUserId
    ? db.prepare(`SELECT * FROM agent_schedules WHERE agent_definition_id=$1 AND is_active=true AND (owner_user_id=$2 OR owner_user_id IS NULL) ORDER BY action_key NULLS FIRST, created_at DESC`).all(agentDefinitionId, ownerUserId)
    : db.prepare(`SELECT * FROM agent_schedules WHERE agent_definition_id=$1 AND is_active=true ORDER BY action_key NULLS FIRST, created_at DESC`).all(agentDefinitionId);
}

/** Same org-override precedence as resolveAgentRoster(), for the approval-gate steps. */
export async function resolveApprovalWorkflow({ orgId = null, pipeline = 'shared' } = {}) {
  const rows = orgId
    ? await db.prepare(`SELECT * FROM agent_approval_workflows WHERE is_active=true AND (pipeline=$1 OR pipeline='shared') AND (org_id=$2 OR org_id IS NULL) ORDER BY step_key, org_id NULLS LAST`).all(pipeline, orgId)
    : await db.prepare(`SELECT * FROM agent_approval_workflows WHERE is_active=true AND (pipeline=$1 OR pipeline='shared') AND org_id IS NULL ORDER BY step_key`).all(pipeline);
  const byStep = {};
  for (const row of rows) if (!byStep[row.step_key]) byStep[row.step_key] = row;
  return Object.values(byStep)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      stepKey: row.step_key,
      name: row.name,
      sortOrder: row.sort_order,
      requiredRoleLabel: row.required_role_label,
      note: row.note,
    }));
}

// ── Weighted scoring — interprets a journey_current_definitions row whose
// entryCriteria carries the {scoringModel:'weighted_sum_x20', dimensions,
// tiers} shape seeded for commercial_opportunity_scoring_v1/
// career_match_scoring_v1. currentRegistry.js's own evaluateEntryCriteria()
// is untouched — this is a sibling interpreter for a different Current
// shape, same relationship eidosBonding.js has to journey_atom_affinity_rules. ──

/**
 * `dimensionScores` is `{ [dimensionKey]: 0-5 }` (the spec's own per-
 * dimension rating scale for e.g. trigger strength: 0 rumor, 5 consequential
 * primary-sourced event). Returns the weighted sum x20 (0-100) plus the
 * resolved tier, or null dimensions/components for any key the caller
 * didn't score — never silently treats a missing score as 0 without saying so.
 */
export function evaluateWeightedScore(current, dimensionScores = {}) {
  const criteria = current?.entryCriteria;
  if (!criteria || criteria.scoringModel !== 'weighted_sum_x20') {
    throw new Error(`evaluateWeightedScore requires a Current with entryCriteria.scoringModel === 'weighted_sum_x20', got "${criteria?.scoringModel}".`);
  }
  const components = criteria.dimensions.map((dim) => {
    const raw = dimensionScores[dim.key];
    return { key: dim.key, label: dim.label, weight: dim.weight, rawScore: raw ?? null, scored: raw != null };
  });
  const missing = components.filter((c) => !c.scored).map((c) => c.key);
  const weightedSum = components.reduce((sum, c) => sum + (c.rawScore || 0) * c.weight, 0);
  const score = Math.round(weightedSum * 20 * 100) / 100;
  const tier = (criteria.tiers || []).find((t) => score >= t.min && score <= t.max) || null;
  return { score, tier: tier?.tierLabel || null, components, missingDimensions: missing, complete: missing.length === 0 };
}

// ── Qualification gates — interprets a journey_current_definitions row whose
// entryCriteria carries the {gateModel:'qualification_gate_chain', gates:[...]}
// shape seeded for career_opportunity_verification_v1 (server/db.js). Same
// sibling-interpreter relationship to currentRegistry.js as
// evaluateWeightedScore/readCadencePlan above — currentRegistry.js itself
// stays domain-agnostic. Deliberately pipeline-agnostic: a commercial (or
// any future) gate chain Current can reuse readQualificationGates/
// applyGateOutcome unchanged — "pipeline nurturing" generally, not a
// career-specific mechanism. ──

/** Pure read of a gate-chain Current's ordered gate definitions — no execution. */
export function readQualificationGates(current) {
  const criteria = current?.entryCriteria;
  if (!criteria || criteria.gateModel !== 'qualification_gate_chain') {
    throw new Error(`readQualificationGates requires a Current with entryCriteria.gateModel === 'qualification_gate_chain', got "${criteria?.gateModel}".`);
  }
  return criteria.gates || [];
}

function fillGateTemplate(template, vars) {
  return String(template || '').replace(/\{(\w+)\}/g, (m, key) => (vars[key] != null ? String(vars[key]) : m));
}

function parseRodMetadata(rod) {
  return typeof rod.metadata === 'string' ? JSON.parse(rod.metadata) : (rod.metadata || {});
}

// Extensible, action-name-keyed — "the resulting actions of those [gates]"
// the config describes, never a per-pipeline fork. Add a new action here
// once, every gate chain in every pipeline can reference it by name.
const GATE_ACTION_HANDLERS = {
  archive: async (rod, reason) => {
    const now = Date.now();
    const metadata = { ...parseRodMetadata(rod), archiveReason: reason, archivedAt: now };
    await db.prepare(`UPDATE journey_data_rods SET current_stage='archived', metadata=$1::jsonb, updated_at=$2 WHERE id=$3`).run(metadata, now, rod.id);
    return { toStage: 'archived' };
  },
  flag_for_review: async (rod, reason) => {
    const now = Date.now();
    const metadata = { ...parseRodMetadata(rod), flaggedForReview: true, flagReason: reason };
    await db.prepare(`UPDATE journey_data_rods SET metadata=$1::jsonb, updated_at=$2 WHERE id=$3`).run(metadata, now, rod.id);
    return { toStage: rod.current_stage };
  },
  advance_stage: async (rod, reason, params) => {
    if (!params?.targetStage) throw new Error('advance_stage gate action requires params.targetStage.');
    const now = Date.now();
    await db.prepare(`UPDATE journey_data_rods SET current_stage=$1, updated_at=$2 WHERE id=$3`).run(params.targetStage, now, rod.id);
    return { toStage: params.targetStage };
  },
  none: async (rod) => ({ toStage: rod.current_stage }),
};

/** The known gate action names — exported so routes can validate an admin-edited gate chain without duplicating this list. */
export const GATE_ACTION_KEYS = Object.keys(GATE_ACTION_HANDLERS);

/**
 * Applies whichever action a gate's outcome (pass/fail) is configured to
 * trigger, updates the rod, and always writes one journey_rod_events row
 * (event_type 'qualification_gate_evaluated') — "how the events get
 * tracked" for any pipeline's gates, reusing the existing event table, never
 * a new log. templateVars fills {placeholders} in the configured
 * reasonTemplate (e.g. {company}, {date} — date defaults to today if omitted).
 */
export async function applyGateOutcome(rod, gate, outcome, templateVars = {}) {
  const directive = outcome.passed ? gate.onPass : gate.onFail;
  const actionKey = directive?.action || 'none';
  const handler = GATE_ACTION_HANDLERS[actionKey];
  if (!handler) throw new Error(`Unknown qualification gate action "${actionKey}".`);
  const reason = directive?.reasonTemplate
    ? fillGateTemplate(directive.reasonTemplate, { date: new Date().toISOString().slice(0, 10), ...templateVars })
    : null;
  const result = await handler(rod, reason, directive?.params);
  const now = Date.now();
  await db.prepare(`
    INSERT INTO journey_rod_events (rod_id, event_type, from_stage, to_stage, metadata, created_at)
    VALUES ($1,'qualification_gate_evaluated',$2,$3,$4::jsonb,$5)
  `).run(rod.id, rod.current_stage, result.toStage, { gateKey: gate.key, checkType: gate.checkType, passed: outcome.passed, detail: outcome.detail || null, action: actionKey, reason }, now);
  return { action: actionKey, reason, toStage: result.toStage };
}

/** Reads the {touches:[...]} cadence definition off an outreach-cadence Current, unchanged — no scoring math, just the ordered touch plan. */
export function readCadencePlan(current) {
  const criteria = current?.entryCriteria;
  if (!criteria || criteria.cadenceModel !== 'touch_sequence') {
    throw new Error(`readCadencePlan requires a Current with entryCriteria.cadenceModel === 'touch_sequence', got "${criteria?.cadenceModel}".`);
  }
  return criteria.touches;
}
