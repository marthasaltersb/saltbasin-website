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

// CHANNEL_MATURITY — purpose-scoped, per the Maturity principle.
//
// Returns a SET of independent purpose scores. There is deliberately no
// `score` field: averaging the purposes would collapse "100% legal, 40%
// billing readiness" back into the single number the principle exists to
// reject. Callers that need a headline figure must name which purpose they
// mean.
//
// `signals` is { [purposeKey]: 0-1 } — how much of that purpose's required
// evidence is present, supplied by the caller (the engine knows the evidence;
// this module stays pure math). Purposes are resolved in dependency order so a
// dependency cap always applies to an already-final value.
export function calculateChannelMaturity(signals = {}, methodology = DEFAULT_METHODOLOGY) {
  const config = methodology.channelMaturity;
  const byKey = new Map(config.purposes.map((p) => [p.key, p]));
  const resolved = {};

  const resolve = (key, seen = new Set()) => {
    if (key in resolved) return resolved[key];
    const purpose = byKey.get(key);
    if (!purpose) return 0;
    // A dependency cycle would otherwise recurse forever; treat it as uncapped
    // rather than throwing, and let validation catch the cycle at config time.
    if (seen.has(key)) return clamp(signals[key]);
    seen.add(key);

    let value = clamp(signals[key]);
    for (const dependencyKey of purpose.dependsOn || []) {
      const cap = resolve(dependencyKey, seen) * (config.dependencyCapFactor ?? 1);
      if (value > cap) value = cap;
    }
    resolved[key] = value;
    return value;
  };

  const purposes = {};
  for (const purpose of config.purposes) {
    const raw = clamp(signals[purpose.key]);
    const score = resolve(purpose.key);
    purposes[purpose.key] = {
      score,
      raw,
      // Surfaced so a UI can explain "billing readiness is held at 0.4 by legal"
      // rather than showing an unexplained drop.
      cappedBy: score < raw ? (purpose.dependsOn || []).find((d) => resolve(d) * (config.dependencyCapFactor ?? 1) === score) || null : null,
      label: purpose.label,
      definition: purpose.definition,
      networkScope: purpose.networkScope,
      dependsOn: purpose.dependsOn || [],
    };
  }

  return { metricKey: 'CHANNEL_MATURITY', purposes, methodologyId: methodology.methodologyId };
}

// STATE_CONFIDENCE — separate axis, per the Confidence principle.
//
// Six positive inputs weighted to 1, then the scenario's own risk applied as a
// penalty. Risk is subtracted rather than weighted in, because a high risk
// value must never be able to raise confidence.
export function calculateStateConfidence(inputs = {}, methodology = DEFAULT_METHODOLOGY, { scenarioRisk } = {}) {
  const config = methodology.stateConfidence;
  const base = weighted(inputs, config.weights);
  const risk = clamp(scenarioRisk ?? config.riskAdjustment.defaultScenarioRisk);
  const penalty = risk * config.riskAdjustment.maxPenalty;
  return {
    metricKey: 'STATE_CONFIDENCE',
    score: clamp(base - penalty),
    base: clamp(base),
    penalty,
    components: Object.fromEntries(Object.entries(config.weights).map(([key, weight]) => [key, { score: clamp(inputs[key]), weight }])),
    methodologyId: methodology.methodologyId,
  };
}

// Converts an evidence row's age into the CONF-002 recency input. A banded step
// function, not a decay curve: the sheet specifies discrete bands, and fitting
// a smooth curve to them gave different answers either side of each boundary.
export function recencyScore(observedAtMs, nowMs = Date.now(), methodology = DEFAULT_METHODOLOGY) {
  const ageDays = Math.max(0, nowMs - Number(observedAtMs || 0)) / 86400000;
  for (const band of methodology.stateConfidence.recencyBands) {
    if (band.maxAgeDays === null || ageDays <= band.maxAgeDays) return band.value;
  }
  return 0;
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
