import { QUERY_CONVERGENCE_METHODOLOGY as DEFAULT_METHODOLOGY } from '../../config/metrics/queryConvergenceMethodology.js';

const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const weighted = (values, weights) => Object.entries(weights).reduce((sum, [key, weight]) => sum + clamp(values[key]) * weight, 0);
const bandFor = (value, bands) => bands.find((band) => value >= band.min) || bands.at(-1);

export function calculateQueryRelevance(components, methodology = DEFAULT_METHODOLOGY) {
  const weights = methodology.relevance.weights;
  const contributions = Object.fromEntries(Object.entries(weights).map(([key, weight]) => [key, clamp(components[key]) * weight]));
  const score = clamp(Object.values(contributions).reduce((sum, value) => sum + value, 0));
  return { metricKey: 'QUERY_RELEVANCE', score, band: bandFor(score, methodology.relevance.bands), components: Object.fromEntries(Object.keys(weights).map((key) => [key, { input: clamp(components[key]), weight: weights[key], contribution: contributions[key] }])), methodologyId: methodology.methodologyId };
}

export function deriveRelevanceComponents(element, context) {
  const tags = new Set(element.magneticProperties || element.capabilityTags || []);
  const directIds = new Set(context.requiredContextDimensions.flatMap((dimension) => dimension.matchAtomIds || []));
  const directSemanticRelationship = directIds.has(element.atomId) ? 1 : 0;
  const rodRelationship = element.rodType === context.primaryRodType ? 1 : (context.relatedRodTypes || []).includes(element.rodType) ? 0.7 : 0;
  const lineageRelationship = element.lineageParentId || element.lineage?.past?.length || element.lineage?.future?.length ? 1 : 0;
  const hierarchyRelationship = element.parentAtomId || element.clusterId || element.moleculeId ? 1 : 0;
  const related = [...(context.coreTags || []), ...(context.relatedTags || [])];
  const semanticSimilarity = related.length ? related.filter((tag) => tags.has(tag)).length / new Set(related).size : 0;
  return { directSemanticRelationship, rodRelationship, lineageRelationship, hierarchyRelationship, semanticSimilarity };
}

export function calculateQueryCoverage(elements, context, methodology = DEFAULT_METHODOLOGY) {
  const atomIds = new Set(elements.map((element) => element.atomId));
  const dimensions = context.requiredContextDimensions.map((dimension) => {
    const weight = methodology.coverage.tierWeights[dimension.tier] ?? 0;
    const applicable = dimension.applicable !== false && weight > 0;
    const covered = applicable && (dimension.matchAtomIds || []).some((id) => atomIds.has(id));
    return { ...dimension, weight, applicable, covered };
  });
  const applicableWeight = dimensions.filter((item) => item.applicable).reduce((sum, item) => sum + item.weight, 0);
  const coveredWeight = dimensions.filter((item) => item.covered).reduce((sum, item) => sum + item.weight, 0);
  return { metricKey: 'QUERY_COVERAGE', score: applicableWeight ? coveredWeight / applicableWeight : 0, percent: applicableWeight ? (coveredWeight / applicableWeight) * 100 : 0, coveredWeight, applicableWeight, dimensions, methodologyId: methodology.methodologyId };
}

export function calculateQueryConfidence(signals, methodology = DEFAULT_METHODOLOGY) {
  const normalized = { ...signals, agreement: signals.agreement ?? 1 - clamp(signals.contradiction) };
  const score = clamp(weighted(normalized, methodology.confidence.weights));
  return { metricKey: 'QUERY_CONFIDENCE', score, band: bandFor(score, methodology.confidence.bands), components: normalized, methodologyId: methodology.methodologyId };
}

export function calculateConvergenceStability(risks, methodology = DEFAULT_METHODOLOGY) {
  const riskScore = clamp(weighted(risks, methodology.stability.riskWeights));
  const score = 1 - riskScore;
  return { metricKey: 'CONVERGENCE_STABILITY', score, riskScore, band: bandFor(score, methodology.stability.bands), components: Object.fromEntries(Object.keys(methodology.stability.riskWeights).map((key) => [key, clamp(risks[key])])), methodologyId: methodology.methodologyId };
}

export function deriveQueryEvidenceMetrics(elements, methodology = DEFAULT_METHODOLOGY) {
  const evidence = elements.flatMap((element) => element.evidence || []);
  const confidenceSignals = {
    evidenceQuality: evidence.map((item) => item.quality).filter(Number.isFinite),
    sourceAuthority: evidence.map((item) => item.sourceAuthority).filter(Number.isFinite),
    temporalFreshness: evidence.map((item) => item.temporalFreshness).filter(Number.isFinite),
    lineageIntegrity: elements.map((item) => item.lineageIntegrity).filter(Number.isFinite),
    validationStatus: elements.map((item) => item.validationScore).filter(Number.isFinite),
  };
  const conflicts = elements.filter((item) => item.conflict);
  const availableConfidence = Object.values(confidenceSignals).flat();
  const confidence = availableConfidence.length ? calculateQueryConfidence({
    evidenceQuality: meanOrNull(confidenceSignals.evidenceQuality),
    sourceAuthority: meanOrNull(confidenceSignals.sourceAuthority),
    agreement: elements.length ? 1 - conflicts.length / elements.length : 0,
    temporalFreshness: meanOrNull(confidenceSignals.temporalFreshness),
    lineageIntegrity: meanOrNull(confidenceSignals.lineageIntegrity),
    validationStatus: meanOrNull(confidenceSignals.validationStatus),
  }, methodology) : null;

  const riskInputs = {
    unresolvedContradictions: elements.length ? conflicts.length / elements.length : 0,
    pendingEvidence: ratio(elements, (item) => item.evidenceStatus === 'pending'),
    incompleteBranches: ratio(elements, (item) => item.branchStatus === 'incomplete'),
    sourceVolatility: meanOrNull(elements.map((item) => item.sourceVolatility).filter(Number.isFinite)),
    lowConfidenceLineage: ratio(elements, (item) => Number.isFinite(item.lineageIntegrity) && item.lineageIntegrity < 0.5),
    unvalidatedDefinitions: ratio(elements, (item) => item.validationStatus === 'unvalidated'),
  };
  const hasStabilityEvidence = conflicts.length || elements.some((item) => item.evidenceStatus || item.branchStatus || Number.isFinite(item.sourceVolatility) || Number.isFinite(item.lineageIntegrity) || item.validationStatus);
  return { confidence, stability: hasStabilityEvidence ? calculateConvergenceStability(riskInputs, methodology) : null };
}

function meanOrNull(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function ratio(values, predicate) {
  return values.length ? values.filter(predicate).length / values.length : 0;
}
