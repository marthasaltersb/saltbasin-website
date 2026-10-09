// Current Registry (2026-07-27, generalized to a real table 2026-07-28;
// personal-override tier added 2026-09-10) — the rule set governing a
// Channel journey's context: stage sequence (by reference to
// journey_scenarios/journey_gate_definitions), minimum atom/molecule
// maturity, and (declarative-only for now — no executor yet) transition
// rules and Tributary-trigger rules. Every Channel (rod_type) can have one
// or more business-defined Currents — this is no longer a hardcoded object a
// developer edits, but a real, admin-editable journey_current_definitions
// table (server/db.js).
//
// Resolution is now the same 3-tier platform-default/org/personal-owner
// precedence agent_definitions already uses (opportunityPipelineRegistry.js's
// resolveAgentRoster()) — one tier more specific than the original org-only
// seam, so a member can reweight a scoring/threshold Current's own
// entryCriteria for themselves without touching the platform default or any
// other member's value. Per Betsy's explicit instruction (2026-09-10): every
// methodology with a weight, threshold, or formula must expose this seam —
// "not a replacement, but a configuration the user can change for their own
// spec." Not every Current needs a personal-override row to exist; when none
// does, resolution falls through to the org row, then the platform default,
// exactly as before.
//
// A Current exists in one of two scopes, evaluated against the same
// underlying Atoms/Molecules without ever duplicating them:
//   - master_data     — canonical, applies to any evaluation of this Channel type
//   - channel_current  — scoped to one specific Channel Rod's journey context
//
// The resulting temporal state a Current's rules produce against a specific
// Rod is a Current Arc — event-sourced as journey_rod_events rows (see
// server/lib/eidosBonding.js's recordCurrentArc/reconstructLatestCurrentArc/
// reconstructCurrentArcHistory), not stored here. This registry only holds
// the rules, never live state.
import { db } from '../db.js';

export const CURRENT_SCOPES = Object.freeze({
  MASTER_DATA: 'master_data',
  CHANNEL_CURRENT: 'channel_current',
});

// This db adapter can return a jsonb column as either a parsed object/array
// or its raw JSON-text string (see careerAtomRegistry.js's isJsonbSourceColumn
// comment for the confirmed-by-reproduction reason) — always run a value back
// through this before re-inserting it as a ::jsonb param, or a string value
// gets serialized a second time and lands as a JSON string scalar instead of
// the real object/array.
function parseJsonb(v, fallback) {
  if (v == null) return fallback;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

function rowToCurrent(row) {
  if (!row) return null;
  return {
    currentKey: row.current_key,
    label: row.label,
    rodType: row.rod_type,
    scope: row.scope_type,
    orgId: row.org_id != null ? Number(row.org_id) : null,
    ownerUserId: row.owner_user_id != null ? Number(row.owner_user_id) : null,
    primaryScenarioKey: row.primary_scenario_key || null,
    portStages: parseJsonb(row.port_stages, []),
    entryCriteria: parseJsonb(row.entry_criteria, {}),
    minimumCarry: parseJsonb(row.minimum_carry, []),
    transitionRules: parseJsonb(row.transition_rules, []),
    tributaryTriggerRules: parseJsonb(row.tributary_trigger_rules, []),
    isActive: !!row.is_active,
  };
}

// Resolves every registered Current at the most specific tier available for
// this caller: platform default (org_id AND owner_user_id both NULL) <
// org override (org_id set) < personal-owner override (owner_user_id set) —
// same 3-tier specificity resolution as opportunityPipelineRegistry.js's
// resolveAgentRoster(). Pass neither orgId nor ownerUserId to get platform
// defaults only (existing callers that never scoped by org keep working
// unchanged).
export async function resolveCurrentTemplate({ orgId = null, ownerUserId = null } = {}) {
  const rows = await db.prepare(`
    SELECT * FROM journey_current_definitions
    WHERE is_active=true
      AND (org_id IS NULL AND owner_user_id IS NULL
           OR ($1::bigint IS NOT NULL AND org_id=$1 AND owner_user_id IS NULL)
           OR ($2::bigint IS NOT NULL AND owner_user_id=$2))
    ORDER BY current_key
  `).all(orgId, ownerUserId);
  const currents = {};
  const specificityByKey = {};
  for (const row of rows) {
    const specificity = row.owner_user_id != null ? 2 : row.org_id != null ? 1 : 0;
    if (specificityByKey[row.current_key] == null || specificity > specificityByKey[row.current_key]) {
      currents[row.current_key] = rowToCurrent(row);
      specificityByKey[row.current_key] = specificity;
    }
  }
  return { currents };
}

// currentKey, then either an orgId (legacy positional call — still supported
// since every existing caller passes a plain org id or nothing) or an
// options object { orgId, ownerUserId } for the new personal-override tier.
export async function getCurrent(currentKey, orgIdOrOptions = null) {
  const options = orgIdOrOptions != null && typeof orgIdOrOptions === 'object'
    ? orgIdOrOptions
    : { orgId: orgIdOrOptions };
  const template = await resolveCurrentTemplate(options);
  return template.currents[currentKey] || null;
}

const WEIGHT_SUM_TOLERANCE = 0.01;

// Creates or updates the calling user's personal reweighting of a
// weighted_sum_x20 scoring Current (e.g. career_match_scoring_v1) — the
// concrete mechanism behind "the user can change their own spec, but it
// doesn't change for all users." Only reweights dimensions the platform
// default already defines; never adds, removes, or renames a dimension via a
// personal override (that stays an admin/platform change to the default row).
export async function setPersonalScoringWeights({ userId, currentKey, weights }) {
  if (!userId) throw new Error('userId is required.');
  const base = await db.prepare(`
    SELECT * FROM journey_current_definitions WHERE current_key=$1 AND org_id IS NULL AND owner_user_id IS NULL AND is_active=true
  `).get(currentKey);
  if (!base) throw new Error(`No platform default Current found for "${currentKey}".`);
  const baseCriteria = parseJsonb(base.entry_criteria, {});
  if (baseCriteria?.scoringModel !== 'weighted_sum_x20') {
    throw new Error(`"${currentKey}" is not a reweightable scoring Current (scoringModel is "${baseCriteria?.scoringModel}").`);
  }

  const baseDimensions = baseCriteria.dimensions || [];
  const baseKeys = new Set(baseDimensions.map((d) => d.key));
  const suppliedKeys = Object.keys(weights || {});
  const unknown = suppliedKeys.filter((k) => !baseKeys.has(k));
  if (unknown.length) throw new Error(`Unknown scoring dimension(s): ${unknown.join(', ')}. A personal override can only reweight this Current's existing dimensions, not add or remove one.`);
  const missing = [...baseKeys].filter((k) => !suppliedKeys.includes(k));
  if (missing.length) throw new Error(`Missing weight(s) for: ${missing.join(', ')}. Every dimension needs an explicit weight so none is silently dropped.`);
  const sum = Object.values(weights).reduce((total, w) => total + Number(w), 0);
  if (!Number.isFinite(sum) || Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new Error(`Weights must sum to 1.0 (got ${Number.isFinite(sum) ? sum.toFixed(3) : sum}).`);
  }

  const newCriteria = { ...baseCriteria, dimensions: baseDimensions.map((d) => ({ ...d, weight: Number(weights[d.key]) })) };
  const now = Date.now();
  const existing = await db.prepare(`SELECT id FROM journey_current_definitions WHERE current_key=$1 AND owner_user_id=$2`).get(currentKey, userId);
  if (existing) {
    await db.prepare(`UPDATE journey_current_definitions SET entry_criteria=$1::jsonb, updated_at=$2 WHERE id=$3`).run(newCriteria, now, existing.id);
    return rowToCurrent(await db.prepare(`SELECT * FROM journey_current_definitions WHERE id=$1`).get(existing.id));
  }
  const result = await db.prepare(`
    INSERT INTO journey_current_definitions
      (current_key, org_id, owner_user_id, label, rod_type, scope_type, primary_scenario_key, port_stages, entry_criteria, minimum_carry, transition_rules, tributary_trigger_rules, is_active, created_at, updated_at)
    VALUES ($1,NULL,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,true,$12,$12)
    RETURNING id
  `).run(
    currentKey, userId, base.label, base.rod_type, base.scope_type, base.primary_scenario_key,
    parseJsonb(base.port_stages, []), newCriteria, parseJsonb(base.minimum_carry, []),
    parseJsonb(base.transition_rules, []), parseJsonb(base.tributary_trigger_rules, []), now,
  );
  return rowToCurrent(await db.prepare(`SELECT * FROM journey_current_definitions WHERE id=$1`).get(Number(result.lastInsertRowid)));
}

// Removes the calling user's personal override, reverting them to whatever
// the org/platform-default tier resolves to next. Idempotent — deleting a
// row that doesn't exist is not an error.
export async function clearPersonalScoringWeights({ userId, currentKey }) {
  await db.prepare(`DELETE FROM journey_current_definitions WHERE current_key=$1 AND owner_user_id=$2`).run(currentKey, userId);
}

// Evaluates a Current's entry criteria against a Rod's actual atom/molecule/
// event counts. A plain threshold check for v1 — extend when a real Current
// needs richer criteria-expression logic than min-counts.
export function evaluateEntryCriteria(current, { atomCount = 0, moleculeCount = 0, eventCount = 0 } = {}) {
  const c = current?.entryCriteria || {};
  if (c.minAtoms != null && atomCount < c.minAtoms) return false;
  if (c.minMolecules != null && moleculeCount < c.minMolecules) return false;
  if (c.minEvents != null && eventCount < c.minEvents) return false;
  return true;
}
