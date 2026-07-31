// The Scenario Library — declarative scenario + stage-gate definitions for the
// Channel Journey evaluation engine (server/lib/journeyRods.js
// evaluateJourneyRod).
//
// Why this file exists: journey_scenarios and journey_gate_definitions were
// both empty, which is why evaluateJourneyRod() has always returned early
// (`if (!scenario) return ...`) without evaluating a single gate. The only
// prior path to populating them was scenarioGenerator.js's cross-product,
// whose DRAFT_DIMENSION_DEFINITIONS are explicitly flagged as invented
// placeholder values — running it would have written thousands of fabricated
// scenarios into real config. This file is the opposite: a small number of
// hand-declared scenarios that reference ONLY vocabulary that already exists
// in the database.
//
// Every key below was verified present on 2026-07-29:
//   stages   -> journey_stage_gates (revenue_lifecycle has 8 stages)
//   clusters -> journey_metadata_clusters (revenue_recognition_readiness,
//               adoption_signal)
//   atoms    -> journey_metadata_molecules (arr, opportunity_amount, ...)
// The applier (server/lib/scenarioLibraryApply.js) re-checks all three against
// the live database before writing and refuses to create dangling references,
// so this file drifting from the vocabulary is a caught error, not silent rot.
//
// Registered as the `scenario-library` Config Envelope, so the whole library is
// editable at runtime without a deploy. Gates are soft guidance — a gate that
// does not pass explains what is missing and (per judgment_policy) can request
// a human decision; it is never a hard stop.
//
// KNOWN GAP against the Core scenario definition. Betsy's principle set defines
// a scenario as: trigger/source event + business context + semantic state +
// Current movement + topology invocation + authority + gates + calculations +
// downstream impacts + evidence lineage. Of those ten, this file and the two
// tables behind it currently model FOUR — semantic state (selectedClusterKeys),
// Current movement (via the scenario's rod_type and journey_current_definitions),
// gates, and evidence lineage (through journey_rod_evidence.lineage_parent_id).
// Trigger/source event, business context, topology invocation, authority, and
// downstream impacts have no representation here yet. They are deliberately
// absent rather than stubbed: adding empty keys would imply the engine consumes
// them. Extend this shape and the applier together when those land.

export const SCENARIO_LIBRARY = Object.freeze({
  libraryId: 'scenario-library-v1',
  effectiveFrom: '2026-07-29',
  scenarios: Object.freeze([
    Object.freeze({
      scenarioKey: 'default_revenue',
      rodType: 'revenue_lifecycle',
      label: 'Default Revenue Lifecycle',
      description: 'The baseline commercial progression. Named default_revenue because evaluateJourneyRod() falls back to exactly this key when a rod carries no metadata.scenarioKey — so this is the scenario every existing revenue rod resolves to today.',
      selectedClusterKeys: Object.freeze(['revenue_recognition_readiness', 'adoption_signal']),
      actorRoles: Object.freeze(['commercial_owner']),
      gates: Object.freeze([
        Object.freeze({
          stageKey: 'qualified_context',
          sortOrder: 10,
          requiredMolecules: Object.freeze(['opportunity_amount']),
          judgmentPolicy: 'never',
          humanPrompt: null,
        }),
        Object.freeze({
          stageKey: 'qualified_opportunity',
          sortOrder: 15,
          requiredMolecules: Object.freeze(['opportunity_amount', 'probability']),
          judgmentPolicy: 'when_ambiguous',
          humanPrompt: 'Confirm this opportunity is genuinely qualified before it advances.',
        }),
        Object.freeze({
          stageKey: 'committed',
          sortOrder: 50,
          // The commercial-commitment cluster: ARR, amount, probability and
          // contract effective date must all be present for the cluster to
          // pass its `all` completion rule.
          requiredClusters: Object.freeze(['revenue_recognition_readiness']),
          requiredMolecules: Object.freeze(['contract_effective_date']),
          requiredActorRoles: Object.freeze(['commercial_owner']),
          judgmentPolicy: 'always',
          humanPrompt: 'Commitment is a revenue-recognition boundary. Confirm the contract evidence is authoritative before this rod is treated as committed.',
        }),
        Object.freeze({
          stageKey: 'customer',
          sortOrder: 60,
          requiredClusters: Object.freeze(['adoption_signal']),
          judgmentPolicy: 'when_ambiguous',
          humanPrompt: 'Adoption evidence should show real provisioning and usage, not just a signed contract.',
        }),
      ]),
    }),
  ]),
});

// Shape validation only — this runs inside the Config Envelope validator, which
// must stay pure (no database access). Cross-checking cluster/atom/stage keys
// against the live vocabulary is the applier's job, deliberately, so an admin
// can save a library that references a cluster they are about to create.
const JUDGMENT_POLICIES = ['never', 'when_ambiguous', 'always'];

export function validateScenarioLibraryShape(value) {
  if (!value || typeof value !== 'object') return ['value must be an object'];
  if (!Array.isArray(value.scenarios)) return ['scenarios: must be an array'];
  const errors = [];
  const seenScenarioKeys = new Set();

  value.scenarios.forEach((scenario, i) => {
    const at = `scenarios[${i}]`;
    if (!scenario || typeof scenario !== 'object') { errors.push(`${at}: not an object`); return; }
    if (typeof scenario.scenarioKey !== 'string' || !scenario.scenarioKey.trim()) errors.push(`${at}.scenarioKey: must be a non-empty string`);
    else if (seenScenarioKeys.has(scenario.scenarioKey)) errors.push(`${at}.scenarioKey: duplicate "${scenario.scenarioKey}"`);
    else seenScenarioKeys.add(scenario.scenarioKey);
    if (typeof scenario.rodType !== 'string' || !scenario.rodType.trim()) errors.push(`${at}.rodType: must be a non-empty string`);
    if (scenario.selectedClusterKeys !== undefined && !Array.isArray(scenario.selectedClusterKeys)) errors.push(`${at}.selectedClusterKeys: must be an array`);
    if (scenario.actorRoles !== undefined && !Array.isArray(scenario.actorRoles)) errors.push(`${at}.actorRoles: must be an array`);
    if (!Array.isArray(scenario.gates)) { errors.push(`${at}.gates: must be an array`); return; }

    const seenStageKeys = new Set();
    let previousSort = -Infinity;
    scenario.gates.forEach((gate, g) => {
      const gAt = `${at}.gates[${g}]`;
      if (!gate || typeof gate !== 'object') { errors.push(`${gAt}: not an object`); return; }
      if (typeof gate.stageKey !== 'string' || !gate.stageKey.trim()) errors.push(`${gAt}.stageKey: must be a non-empty string`);
      else if (seenStageKeys.has(gate.stageKey)) errors.push(`${gAt}.stageKey: duplicate "${gate.stageKey}" in this scenario`);
      else seenStageKeys.add(gate.stageKey);
      if (typeof gate.sortOrder !== 'number' || !Number.isFinite(gate.sortOrder)) errors.push(`${gAt}.sortOrder: must be a finite number`);
      else {
        // Gates are evaluated in sort_order and the engine stops at the first
        // one that fails, so an out-of-order library silently changes which
        // gate blocks a rod. Reject it rather than let that happen quietly.
        if (gate.sortOrder <= previousSort) errors.push(`${gAt}.sortOrder (${gate.sortOrder}) must be greater than the previous gate's (${previousSort}) — gates are evaluated in order and the engine stops at the first failure`);
        previousSort = gate.sortOrder;
      }
      for (const key of ['requiredClusters', 'requiredMolecules', 'requiredDimensions', 'requiredActorRoles', 'dependencyRules']) {
        if (gate[key] !== undefined && !Array.isArray(gate[key])) errors.push(`${gAt}.${key}: must be an array`);
      }
      if (gate.judgmentPolicy !== undefined && !JUDGMENT_POLICIES.includes(gate.judgmentPolicy)) errors.push(`${gAt}.judgmentPolicy: must be one of ${JUDGMENT_POLICIES.join(', ')}`);
      const hasRequirement = ['requiredClusters', 'requiredMolecules', 'requiredDimensions', 'requiredActorRoles'].some((k) => Array.isArray(gate[k]) && gate[k].length);
      if (!hasRequirement) errors.push(`${gAt}: declares no requirement of any kind — a gate with nothing to check always passes and should be removed rather than left as a no-op`);
    });
  });

  return errors;
}
