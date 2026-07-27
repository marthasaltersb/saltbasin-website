export const QUERY_CONVERGENCE_METHODOLOGY = Object.freeze({
  methodologyId: 'query-convergence-v1',
  effectiveFrom: '2026-07-12',
  relevance: Object.freeze({
    weights: Object.freeze({ directSemanticRelationship: 0.35, rodRelationship: 0.25, lineageRelationship: 0.20, hierarchyRelationship: 0.10, semanticSimilarity: 0.10 }),
    bands: Object.freeze([
      { min: 0.90, key: 'core', label: 'Core Context' },
      { min: 0.70, key: 'strong', label: 'Strongly Related' },
      { min: 0.50, key: 'contextual', label: 'Contextually Related' },
      { min: 0.25, key: 'weak', label: 'Weakly Related' },
      { min: 0, key: 'peripheral', label: 'Peripheral' },
    ]),
  }),
  coverage: Object.freeze({ tierWeights: Object.freeze({ required: 1, conditional: 0.65, optional: 0 }) }),
  confidence: Object.freeze({
    weights: Object.freeze({ evidenceQuality: 0.20, sourceAuthority: 0.20, agreement: 0.20, temporalFreshness: 0.15, lineageIntegrity: 0.15, validationStatus: 0.10 }),
    bands: Object.freeze([{ min: 0.8, label: 'High Confidence' }, { min: 0.55, label: 'Moderate Confidence' }, { min: 0, label: 'Low Confidence' }]),
  }),
  stability: Object.freeze({
    riskWeights: Object.freeze({ unresolvedContradictions: 0.25, pendingEvidence: 0.20, incompleteBranches: 0.15, sourceVolatility: 0.15, lowConfidenceLineage: 0.15, unvalidatedDefinitions: 0.10 }),
    bands: Object.freeze([{ min: 0.8, label: 'Stable' }, { min: 0.55, label: 'Settling' }, { min: 0, label: 'Unstable' }]),
  }),
});
