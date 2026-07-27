import { CROSS_ROD_STATE_EXPECTATIONS, ROD_MATHEMATICS_METHODOLOGY as DEFAULT_METHODOLOGY } from '../../config/metrics/rodMathematicsMethodology.js';

const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const weighted = (values, weights) => Object.entries(weights).reduce((sum, [key, weight]) => sum + clamp(values[key]) * weight, 0);

export function calculateRodPosition(rod, stageDefinition = {}) {
  const stages = rod.stages || [];
  const index = Math.max(0, stages.findIndex((stage) => stage.id === (rod.currentStageId || rod.currentStage)));
  const stage = stages[index] || null;
  const requirements = stageDefinition.requirements || [];
  const satisfied = requirements.filter((requirement) => requirement.satisfied).length;
  const intraStagePosition = requirements.length ? satisfied / requirements.length : 0;
  return { metricKey: 'ROD_POSITION', stageIndex: index, stageNumber: index + 1, stageId: stage?.id || null, stageLabel: stage?.name || stage?.label || null, intraStagePosition, cycle: Math.max(1, Number(rod.cycle) || 1), rawCoordinate: index + intraStagePosition };
}

export function calculateStageCompleteness(stageDefinition, state, methodology = DEFAULT_METHODOLOGY) {
  const breakdown = {};
  for (const [bucket, bucketWeight] of Object.entries(methodology.stageCompleteness.bucketWeights)) {
    const requirements = (stageDefinition.requirements || []).filter((item) => item.bucket === bucket && item.applicable !== false);
    const totalWeight = requirements.reduce((sum, item) => sum + (item.weight ?? 1), 0);
    const completedWeight = requirements.filter((item) => item.satisfied?.(state) ?? state[item.id]?.satisfied).reduce((sum, item) => sum + (item.weight ?? 1), 0);
    breakdown[bucket] = { score: totalWeight ? completedWeight / totalWeight : 1, completedWeight, totalWeight, bucketWeight };
  }
  return { metricKey: 'STAGE_COMPLETENESS', score: weighted(Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, value.score])), methodology.stageCompleteness.bucketWeights), breakdown, methodologyId: methodology.methodologyId };
}

export function calculateStageReadiness({ completeness, minimumDefinitions, requiredEvidence, contradictions = [], dependencyState, requiredDecisions, blockers = [] }, methodology = DEFAULT_METHODOLOGY) {
  const components = { stageCompleteness: completeness, minimumDefinitions, requiredEvidence, contradictionClearance: contradictions.length ? 0 : 1, dependencyState, requiredDecisions };
  const generatedBlockers = contradictions.map((item) => ({ type: 'contradiction', ...item }));
  return { metricKey: 'STAGE_READINESS', score: clamp(weighted(components, methodology.stageReadiness.weights)), components, blockers: [...blockers, ...generatedBlockers], methodologyId: methodology.methodologyId };
}

export function calculateRodMaturity(dimensions, methodology = DEFAULT_METHODOLOGY) {
  return { metricKey: 'ROD_MATURITY', score: clamp(weighted(dimensions, methodology.rodMaturity.weights)), dimensions: Object.fromEntries(Object.entries(methodology.rodMaturity.weights).map(([key, weight]) => [key, { score: clamp(dimensions[key]), weight }])), methodologyId: methodology.methodologyId };
}

export function calculateJourneyDensity(events, methodology = DEFAULT_METHODOLOGY) {
  const breakdown = Object.fromEntries(methodology.journeyDensity.eventTypes.map((type) => [type, new Set((events[type] || []).map((event) => event.id || JSON.stringify(event))).size]));
  return { metricKey: 'JOURNEY_DENSITY', materialContributionPoints: Object.values(breakdown).reduce((sum, value) => sum + value, 0), breakdown, methodologyId: methodology.methodologyId };
}

export function calculateRodCoherence({ axialDivergence, densityDivergence, crossRodContradictions = [] }, methodology = DEFAULT_METHODOLOGY) {
  const components = { axialDivergence: clamp(axialDivergence), densityDivergence: clamp(densityDivergence), crossRodContradictions: clamp(crossRodContradictions.length ? mean(crossRodContradictions.map((item) => item.severity ?? 1)) : 0) };
  return { metricKey: 'ROD_COHERENCE', score: 1 - clamp(weighted(components, methodology.coherence.weights)), components, mismatches: crossRodContradictions, methodologyId: methodology.methodologyId };
}

export function calculateCrossRodAlignment(states, expectations = CROSS_ROD_STATE_EXPECTATIONS, methodology = DEFAULT_METHODOLOGY) {
  const reference = states.revenue;
  const expected = expectations[reference] || {};
  const comparisons = Object.entries(states).filter(([rodType]) => rodType !== 'revenue').map(([rodType, observedState]) => ({ rodType, observedState, expectedStates: expected[rodType] || [], aligned: (expected[rodType] || []).includes(observedState) }));
  const exceptions = comparisons.filter((item) => !item.aligned);
  return { metricKey: 'CROSS_ROD_ALIGNMENT', score: comparisons.length ? Math.max(0, 1 - (exceptions.length * methodology.alignment.exceptionPenalty) / comparisons.length) : 0, aligned: comparisons.length > 0 && !exceptions.length, referenceState: reference, comparisons, exceptions, methodologyId: methodology.methodologyId };
}
