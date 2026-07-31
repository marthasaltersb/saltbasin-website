// Current Registry (2026-07-27, generalized to a real table 2026-07-28) —
// the rule set governing a Channel journey's context: stage sequence (by
// reference to journey_scenarios/journey_gate_definitions), minimum atom/
// molecule maturity, and (declarative-only for now — no executor yet)
// transition rules and Tributary-trigger rules. Every Channel (rod_type)
// can have one or more business-defined Currents — this is no longer a
// hardcoded object a developer edits, but a real, admin-editable
// journey_current_definitions table (server/db.js), same org_id-NULL-is-
// default/org_id-set-is-override seam as journey_atom_affinity_rules/
// data_ports.
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

function rowToCurrent(row) {
  if (!row) return null;
  const parseJsonb = (v, fallback) => {
    if (v == null) return fallback;
    return typeof v === 'string' ? JSON.parse(v) : v;
  };
  return {
    currentKey: row.current_key,
    label: row.label,
    rodType: row.rod_type,
    scope: row.scope_type,
    orgId: row.org_id != null ? Number(row.org_id) : null,
    primaryScenarioKey: row.primary_scenario_key || null,
    portStages: parseJsonb(row.port_stages, []),
    entryCriteria: parseJsonb(row.entry_criteria, {}),
    minimumCarry: parseJsonb(row.minimum_carry, []),
    transitionRules: parseJsonb(row.transition_rules, []),
    tributaryTriggerRules: parseJsonb(row.tributary_trigger_rules, []),
    isActive: !!row.is_active,
  };
}

// Resolves every registered Current, org-scoped row taking precedence over
// the platform default (org_id IS NULL) when both exist for the same
// current_key — same resolution pattern used elsewhere in the EIDOS schema.
export async function resolveCurrentTemplate(orgId = null) {
  const rows = orgId
    ? await db.prepare(`SELECT * FROM journey_current_definitions WHERE is_active=true AND (org_id=$1 OR org_id IS NULL) ORDER BY current_key, org_id NULLS LAST`).all(orgId)
    : await db.prepare(`SELECT * FROM journey_current_definitions WHERE is_active=true AND org_id IS NULL ORDER BY current_key`).all();
  const currents = {};
  for (const row of rows) {
    // With orgId set, rows are ordered org-specific-first per current_key —
    // first write wins, so an org override shadows the platform default.
    if (!currents[row.current_key]) currents[row.current_key] = rowToCurrent(row);
  }
  return { currents };
}

export async function getCurrent(currentKey, orgId = null) {
  const template = await resolveCurrentTemplate(orgId);
  return template.currents[currentKey] || null;
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
