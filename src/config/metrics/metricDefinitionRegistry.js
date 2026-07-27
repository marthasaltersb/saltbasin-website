// The Metric Definition Registry (Visual Metrics master prompt §XV) — the single source of truth for
// what every semantic metric in the 3D environment means, how it's calculated, and what business question
// it answers. A UI component must read a metric's label/explanation/directionality from here; it must
// never hardcode metric meaning in JSX or component text (see salt-basin-config-audit's resolution rules).
//
// `implementationStatus` is not part of the master prompt's minimum field list — it's added here because
// this registry is seeded directly from the Phase 1 Current Metric Audit
// (docs/salt-basin-visual-metrics-progress.md), and several of these metrics are defined but not yet
// calculated, or calculated today only by a legacy formula that doesn't yet meet this definition (e.g.
// Rod Maturity is currently a flat single-dimension average, not the 6-dimension composite defined below).
// Values:
//   'defined_not_calculated'     — definition exists here; no calculation exists anywhere in the codebase yet (Phase 3/4 builds it)
//   'partial_legacy_calculation' — a real calculation already exists but doesn't yet meet this full definition; `calculationVersion` names it
//   'live'                       — calculation meets this definition and is wired into the UI (none yet — Phase 6)
//   'calculated_not_rendered'    — engine and methodology are real; the legacy UI has not been replaced yet
//
// Do not mark anything 'live' until Phase 6 actually renders it through this registry.

import { METRIC_CATEGORY_REGISTRY as C } from './metricCategoryRegistry.js';

export const METRIC_DEFINITION_REGISTRY = Object.freeze({
  QUERY_RELEVANCE: {
    metricId: 'query_relevance', metricKey: 'QUERY_RELEVANCE', displayName: 'Query Relevance',
    metricCategory: C.RELEVANCE.categoryId,
    definition: 'How directly relevant an element is to understanding the currently active query context (the selected Orbit).',
    businessQuestionAnswered: 'How directly does this element help explain the selected context?',
    calculationMethod: 'configurable-weight component sum',
    formulaDescription: 'Direct Semantic Relationship + Rod Relationship + Lineage Relationship + Hierarchy Relationship + Semantic Similarity, each weighted by a configurable methodology weight (not hardcoded in a component)',
    inputDimensions: ['directSemanticRelationship', 'rodRelationship', 'lineageRelationship', 'hierarchyRelationship', 'semanticSimilarity'],
    rangeMin: 0, rangeMax: 1, unit: 'score_0_1', higherIsBetter: null,
    directionalityDescription: 'Higher means more directly relevant to the active query context. It does not mean better performance, higher maturity, or higher confidence.',
    confidenceSupported: true, calculationVersion: 'query-convergence-v1', implementationStatus: 'live',
    visualEncoding: 'distance_from_orbit', allowedScopeTypes: ['evidence_atom', 'atom_cluster', 'journey_rod'],
    drilldownType: 'component_breakdown', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  QUERY_COVERAGE: {
    metricId: 'query_coverage', metricKey: 'QUERY_COVERAGE', displayName: 'Query Coverage',
    metricCategory: C.COMPLETENESS.categoryId,
    definition: 'How much of the defined-required semantic coverage for the active query context is present in the convergence result.',
    businessQuestionAnswered: 'How much of what we need to represent this context do we actually have?',
    calculationMethod: 'covered required dimension weight ÷ applicable required dimension weight',
    formulaDescription: 'sum(weight of satisfied required/conditional context dimensions) ÷ sum(weight of applicable required/conditional context dimensions) — never raw data-point count; ten duplicate elements must not outweigh one governed authoritative definition',
    inputDimensions: ['requiredContextDimensions', 'conditionalContextDimensions'],
    rangeMin: 0, rangeMax: 100, unit: 'percent', higherIsBetter: true,
    directionalityDescription: 'Higher coverage means more of the required context is represented. It does not mean the represented data is correct, current, or that the entity itself is healthy or mature.',
    confidenceSupported: false, calculationVersion: 'query-convergence-v1', implementationStatus: 'live',
    visualEncoding: null, allowedScopeTypes: ['journey_rod', 'entity'],
    drilldownType: 'dimension_breakdown', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  QUERY_CONFIDENCE: {
    metricId: 'query_confidence', metricKey: 'QUERY_CONFIDENCE', displayName: 'Query Confidence',
    metricCategory: C.CONFIDENCE.categoryId,
    definition: 'How confident the system is that the converged semantic view accurately represents the active query context, based on evidence quality, agreement, and freshness.',
    businessQuestionAnswered: 'How much should I trust what is showing?',
    calculationMethod: 'evidence-quality-weighted composite, calculated independently of Query Coverage',
    formulaDescription: 'component sum of evidence quality, source authority, agreement (inverse of contradiction), temporal freshness, lineage integrity, and definition validation status',
    inputDimensions: ['evidenceQuality', 'sourceAuthority', 'agreement', 'contradiction', 'temporalFreshness', 'lineageIntegrity', 'validationStatus'],
    rangeMin: 0, rangeMax: 1, unit: 'score_0_1', higherIsBetter: true,
    directionalityDescription: 'Higher means the available evidence is stronger and more internally consistent — independent of how much of the context is covered. High coverage with low confidence means most required areas have data, but it is contradictory or weak; low coverage with high confidence means the system knows only part of the context, but what it knows is well-supported.',
    confidenceSupported: false, calculationVersion: 'query-convergence-v1', implementationStatus: 'live',
    visualEncoding: 'opacity', allowedScopeTypes: ['journey_rod', 'entity'],
    drilldownType: 'dimension_breakdown', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  CONVERGENCE_STABILITY: {
    metricId: 'convergence_stability', metricKey: 'CONVERGENCE_STABILITY', displayName: 'Convergence Stability',
    metricCategory: C.STABILITY.categoryId,
    definition: 'How likely the current query convergence result is to materially change if additional known evidence or pending validation is processed.',
    businessQuestionAnswered: 'Should I trust this view will still look like this once outstanding evidence resolves?',
    calculationMethod: 'unresolved-evidence-weighted composite',
    formulaDescription: 'component sum of unresolved contradictions, pending evidence, incomplete branches, source volatility, low-confidence lineage, and unvalidated definitions',
    inputDimensions: ['unresolvedContradictions', 'pendingEvidence', 'incompleteBranches', 'sourceVolatility', 'lowConfidenceLineage', 'unvalidatedDefinitions'],
    rangeMin: 0, rangeMax: 1, unit: 'score_0_1', higherIsBetter: true,
    directionalityDescription: 'Higher means the current view is unlikely to reorganize as more evidence resolves. Lower does not mean the view is wrong — it means it may still change; drives motion semantics (pulse, bounded orbit, settled position), never decorative animation.',
    confidenceSupported: false, calculationVersion: 'query-convergence-v1', implementationStatus: 'live',
    visualEncoding: 'motion_behavior', allowedScopeTypes: ['journey_rod', 'entity'],
    drilldownType: 'component_breakdown', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  ROD_POSITION: {
    metricId: 'rod_position', metricKey: 'ROD_POSITION', displayName: 'Rod Position',
    metricCategory: C.POSITION.categoryId,
    definition: "The current stage and intra-stage progress of a Data Rod's journey, plus an explicit cycle number for renewals — never a single ambiguous decimal.",
    businessQuestionAnswered: 'Where is this journey right now?',
    calculationMethod: 'stage index + fraction of current-stage requirements satisfied',
    formulaDescription: 'stageIndex + intraStagePosition (0–1 fraction); cycle tracked as its own explicit field, never folded silently into the decimal (e.g. never render bare "12.47" — render "Cycle 2 · Stage 4 · 63% stage position")',
    inputDimensions: ['stageIndex', 'intraStagePosition', 'cycle'],
    rangeMin: null, rangeMax: null, unit: 'stage_position', higherIsBetter: null,
    directionalityDescription: 'A higher stage index means further along the defined lifecycle sequence. It does not mean the journey is more mature, complete, or healthy — see Rod Maturity for that.',
    confidenceSupported: false, calculationVersion: 'rod-mathematics-v1', implementationStatus: 'calculated_not_rendered',
    visualEncoding: 'rod_length_segmentation', allowedScopeTypes: ['journey_rod'],
    drilldownType: null, effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  STAGE_COMPLETENESS: {
    metricId: 'stage_completeness', metricKey: 'STAGE_COMPLETENESS', displayName: 'Stage Completeness',
    metricCategory: C.COMPLETENESS.categoryId,
    definition: 'How much of the applicable required definition, metadata, evidence, and validation for the current stage is present.',
    businessQuestionAnswered: 'Is this stage actually filled in, or just entered?',
    calculationMethod: 'applicable requirement weight completed ÷ total applicable requirement weight',
    formulaDescription: 'weighted sum across the Definitions / Evidence / Relationships / Validation requirement buckets for the current stage',
    inputDimensions: ['definitions', 'evidence', 'relationships', 'validation'],
    rangeMin: 0, rangeMax: 100, unit: 'percent', higherIsBetter: true,
    directionalityDescription: 'Higher means more of this stage’s required content exists. It is not the same as Rod Maturity (definition/evidence quality across the whole journey) or Stage Readiness (whether the journey can advance).',
    confidenceSupported: false, calculationVersion: 'rod-mathematics-v1', implementationStatus: 'calculated_not_rendered',
    visualEncoding: 'rod_fill', allowedScopeTypes: ['journey_rod_stage'],
    drilldownType: 'dimension_breakdown', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  STAGE_READINESS: {
    metricId: 'stage_readiness', metricKey: 'STAGE_READINESS', displayName: 'Next Stage Readiness',
    metricCategory: C.READINESS.categoryId,
    definition: 'How prepared the journey is to naturally transition into its next defined stage.',
    businessQuestionAnswered: "Why can't this journey move to the next stage?",
    calculationMethod: 'extends the existing soft-guidance gate check (journeyEngine/maturity.js evaluateGate) with a scored composite',
    formulaDescription: 'weighted sum of stage completeness, required minimum definitions, required evidence, absence of critical contradictions, dependency state, and required decisions',
    inputDimensions: ['stageCompleteness', 'requiredMinimumDefinitions', 'requiredEvidence', 'criticalContradictions', 'dependencyState', 'requiredDecisions'],
    rangeMin: 0, rangeMax: 1, unit: 'score_0_1', higherIsBetter: true,
    directionalityDescription: 'Higher means fewer blockers remain before the next stage. This is guidance, never a hard stop — always paired with an explanation of what specifically is missing.',
    confidenceSupported: false, calculationVersion: 'rod-mathematics-v1', implementationStatus: 'calculated_not_rendered',
    visualEncoding: null, allowedScopeTypes: ['journey_rod_stage'],
    drilldownType: 'blocker_list', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  ROD_MATURITY: {
    metricId: 'rod_maturity', metricKey: 'ROD_MATURITY', displayName: 'Rod Maturity',
    metricCategory: C.MATURITY.categoryId,
    definition: 'The quality and depth of semantic definition, evidence, lineage, validation, temporal continuity, and cross-source reconciliation accumulated across the journey — independent of how far the journey has progressed.',
    businessQuestionAnswered: 'Is this journey well-understood, or just far along?',
    calculationMethod: '7-dimension weighted composite',
    formulaDescription: 'Definition Maturity + Evidence Maturity + Lineage Maturity + Validation Maturity + Temporal Maturity + Relationship Maturity + Reconciliation Maturity, each weighted by a configurable methodology weight. Reconciliation Maturity: how well definitions, evidence, and lineage agree once compared across departments, systems, and users — a cross-source agreement score, not a rollup of the other six.',
    inputDimensions: ['definitionMaturity', 'evidenceMaturity', 'lineageMaturity', 'validationMaturity', 'temporalMaturity', 'relationshipMaturity', 'reconciliationMaturity'],
    rangeMin: 0, rangeMax: 1, unit: 'score_0_1', higherIsBetter: true,
    directionalityDescription: 'Higher means better-defined, evidenced, and validated — not further along the lifecycle. A brand-new journey can have high maturity; a late-stage journey can have low maturity. Reconciliation Maturity is not the same as Rod Coherence: Reconciliation Maturity scores agreement across sources (departments/systems/users) feeding one Rod/atom; Rod Coherence scores agreement across parallel Rods (Revenue/Customer/Member) — a Rod can reconcile perfectly internally while still being incoherent with a sibling Rod, or vice versa.',
    confidenceSupported: true, calculationVersion: 'rod-mathematics-v1', implementationStatus: 'calculated_not_rendered',
    visualEncoding: 'rod_crystal_complexity', allowedScopeTypes: ['evidence_atom', 'atom_cluster', 'journey_rod'],
    drilldownType: 'dimension_breakdown', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  JOURNEY_DENSITY: {
    metricId: 'journey_density', metricKey: 'JOURNEY_DENSITY', displayName: 'Journey Density',
    metricCategory: C.DENSITY.categoryId,
    definition: 'The amount of meaningful differentiated state — unique transitions, branches, decisions, adjustments, merges — accumulated along a journey, independent of raw data-point count.',
    businessQuestionAnswered: 'How much real complexity or history has this journey accumulated, and is that expected for a deal like this?',
    calculationMethod: 'deduplicated material-event count',
    formulaDescription: 'count(unique state transitions) + count(unique branches) + count(material decisions) + count(material adjustments) + count(exceptions) + count(merge events) + count(validated relationship changes); repeated copies of the same event never increase density',
    inputDimensions: ['uniqueStateTransitions', 'uniqueBranches', 'materialDecisions', 'materialAdjustments', 'exceptions', 'mergeEvents', 'validatedRelationshipChanges'],
    rangeMin: 0, rangeMax: null, unit: 'material_event_count', higherIsBetter: null,
    directionalityDescription: 'High density is not automatically good or bad — never render this with a green-high/red-low treatment. It may indicate a sophisticated enterprise customer, complex pricing, or high exception activity.',
    confidenceSupported: false, calculationVersion: 'rod-mathematics-v1', implementationStatus: 'calculated_not_rendered',
    visualEncoding: 'rod_crystal_complexity', allowedScopeTypes: ['journey_rod'],
    drilldownType: 'dimension_breakdown', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  ROD_COHERENCE: {
    metricId: 'rod_coherence', metricKey: 'ROD_COHERENCE', displayName: 'Rod Coherence',
    metricCategory: C.COHERENCE.categoryId,
    definition: 'How consistently the definitions, states, evidence, relationships, and linked parallel rods agree with one another.',
    businessQuestionAnswered: 'Do my Revenue, Customer, and Member rods actually agree?',
    calculationMethod: 'extends the existing Axial/Density Divergence calculation (journeyEngine/divergence.js) into a coherence score with a mismatch narrative',
    formulaDescription: '1 − normalized weighted combination of Axial Divergence, Density Divergence, and unexplained cross-rod contradictions; not every mismatch is an error — temporal rules and configured business logic determine which divergences are valid concurrent states',
    inputDimensions: ['axialDivergence', 'densityDivergence', 'crossRodContradictions', 'temporalValidityRules'],
    rangeMin: 0, rangeMax: 1, unit: 'score_0_1', higherIsBetter: true,
    directionalityDescription: 'Higher means related rods’ states agree. A lower score requires reading the mismatch narrative to determine whether it is a real issue or a valid temporal difference (e.g. Revenue truth is not Customer truth by design).',
    confidenceSupported: true, calculationVersion: 'rod-mathematics-v1', implementationStatus: 'live',
    visualEncoding: null, allowedScopeTypes: ['rod_pair', 'entity'],
    drilldownType: 'mismatch_narrative', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
  CROSS_ROD_ALIGNMENT: {
    metricId: 'cross_rod_alignment', metricKey: 'CROSS_ROD_ALIGNMENT', displayName: 'Cross-Rod Alignment',
    metricCategory: C.ALIGNMENT.categoryId,
    definition: 'Whether Revenue, Customer, and Member rod states fall within configured expected-state relationships for each other — never numeric stage equality.',
    businessQuestionAnswered: 'Given where Revenue is, are Customer and Member where they are expected to be?',
    calculationMethod: 'expected-state-relationship matching against a configured state-relationship table',
    formulaDescription: 'for each rod pair, check whether the observed state falls within the configured expected-states set for the reference rod’s current state; ALIGNED if within range, exception listed with the specific mismatch if not',
    inputDimensions: ['referenceRodState', 'expectedStateTable', 'observedRodState'],
    rangeMin: 0, rangeMax: 1, unit: 'score_0_1', higherIsBetter: true,
    directionalityDescription: 'Higher means observed states fall within their expected relationship windows for the current reference state. Rods running in parallel are not expected to occupy equivalent numbered stages.',
    confidenceSupported: false, calculationVersion: 'rod-mathematics-v1', implementationStatus: 'calculated_not_rendered',
    visualEncoding: null, allowedScopeTypes: ['rod_pair', 'entity'],
    drilldownType: 'mismatch_narrative', effectiveFrom: '2026-07-12', effectiveTo: null,
  },
});

export function metricsByCategory(categoryId) {
  return Object.values(METRIC_DEFINITION_REGISTRY).filter((m) => m.metricCategory === categoryId);
}

export function metricsByImplementationStatus(status) {
  return Object.values(METRIC_DEFINITION_REGISTRY).filter((m) => m.implementationStatus === status);
}
