// Current Registry (2026-07-27) — the rule set governing a Channel journey's
// context: entry criteria, derived-data rules, per-current-state user input,
// maturity progression entry/exit, minimum carry, required context data,
// port stage, port stage maturity. Config-driven, same org-override seam as
// server/lib/provisioningPolicyRegistry.js — no persisted table until a real
// organization needs to define custom Currents dynamically (reuse-first law:
// don't build storage speculatively).
//
// A Current exists in one of two scopes, evaluated against the same
// underlying Atoms/Molecules without ever duplicating them:
//   - master_data     — canonical, applies to any evaluation of this Channel type
//   - channel_current  — scoped to one specific Channel Rod's journey context
//
// The resulting temporal state a Current's rules produce against a specific
// Rod is a Current Arc — event-sourced as journey_rod_events rows (see
// server/lib/eidosBonding.js's recordCurrentArc/reconstructCurrentArc), not
// stored here. This registry only holds the rules, never live state.

export const CURRENT_SCOPES = Object.freeze({
  MASTER_DATA: 'master_data',
  CHANNEL_CURRENT: 'channel_current',
});

// Salt Basin default Currents. Each names: which Channel type it applies to,
// its scope, entry criteria (evaluated against a Rod's actual atom/molecule/
// event counts before the Current will admit that Rod), the port stages the
// Current's evaluation moves through, and minimum carry (which atom keys
// must persist forward once the Current is entered).
export const SALT_BASIN_CURRENTS = Object.freeze({
  career_master_intake: {
    currentKey: 'career_master_intake',
    label: 'Career Master Intake Current',
    rodType: 'career_master',
    scope: CURRENT_SCOPES.MASTER_DATA,
    entryCriteria: { minAtoms: 1 },
    portStages: ['requested', 'atoms_captured', 'molecules_bonded'],
    minimumCarry: ['career_skill_skill', 'career_job_title'],
  },
});

export function resolveCurrentTemplate(_orgId = null) {
  // No override table exists yet — always the Salt Basin default until a
  // real organization needs to diverge, same pattern as
  // provisioningPolicyRegistry.js's resolveProvisioningTemplate(). Kept as a
  // function (not a bare export) so callers already have the override seam
  // when that day comes.
  return { currents: SALT_BASIN_CURRENTS };
}

export function getCurrent(currentKey, orgId = null) {
  const template = resolveCurrentTemplate(orgId);
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
