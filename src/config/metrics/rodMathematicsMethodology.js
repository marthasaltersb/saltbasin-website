export const ROD_MATHEMATICS_METHODOLOGY = Object.freeze({
  methodologyId: 'rod-mathematics-v1',
  effectiveFrom: '2026-07-12',
  stageCompleteness: Object.freeze({
    bucketWeights: Object.freeze({ definitions: 0.25, evidence: 0.30, relationships: 0.20, validation: 0.25 }),
  }),
  stageReadiness: Object.freeze({
    weights: Object.freeze({ stageCompleteness: 0.30, minimumDefinitions: 0.15, requiredEvidence: 0.20, contradictionClearance: 0.15, dependencyState: 0.10, requiredDecisions: 0.10 }),
    atomMaturityThreshold: 0.75,
  }),
  rodMaturity: Object.freeze({
    // Reconciliation Maturity added 2026-07-12 (Betsy): how well definitions, evidence, and lineage agree
    // once compared across departments, systems, and users — a cross-source agreement dimension, distinct
    // from Coherence (which compares divergence across parallel Rods, not sources within one Rod/atom).
    weights: Object.freeze({ definitionMaturity: 0.18, evidenceMaturity: 0.18, lineageMaturity: 0.13, validationMaturity: 0.13, temporalMaturity: 0.13, relationshipMaturity: 0.13, reconciliationMaturity: 0.12 }),
  }),
  atomDensity: Object.freeze({
    weights: Object.freeze({ persistence: 0.30, corroboration: 0.25, temporalStability: 0.15, lineageAttachment: 0.10, semanticResolution: 0.20 }),
    evidenceSaturationCount: 2,
    compositionCorroborationMinimum: 3,
    compositionCorroborationBonus: 0.15,
  }),
  coherence: Object.freeze({ weights: Object.freeze({ axialDivergence: 0.45, densityDivergence: 0.30, crossRodContradictions: 0.25 }) }),
  correlatedStateEnvelope: Object.freeze({ defaultTolerance: 0.18 }),
  alignment: Object.freeze({ exceptionPenalty: 1 }),
  journeyDensity: Object.freeze({
    eventTypes: Object.freeze(['stateTransitions', 'branches', 'materialDecisions', 'materialAdjustments', 'exceptions', 'mergeEvents', 'linkedEvidenceEvents', 'validatedRelationshipChanges']),
  }),
});

export const CROSS_ROD_STATE_EXPECTATIONS = Object.freeze({
  active_subscription: Object.freeze({ customer: Object.freeze(['onboarding', 'active_customer']), member: Object.freeze(['provisioning', 'active_member']) }),
  contract_signed: Object.freeze({ customer: Object.freeze(['onboarding']), member: Object.freeze(['admin_provisioning', 'provisioning']) }),
});
