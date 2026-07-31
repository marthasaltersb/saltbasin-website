// Channel Rod mathematics methodology.
//
// Rewritten 2026-07-29 to match the Maturity and Confidence principles:
//
//   Maturity   "Maturity is purpose-, stage-, dependency-, and network-aware.
//              A signed master contract may have 100% legal maturity while
//              participation coverage, billing readiness, rev-rec readiness,
//              renewal stability, and expected realization remain below 100%."
//
//   Confidence "Confidence is separate from maturity. It is calculated from
//              evidence quality, completeness, recency, consistency, authority,
//              dependency resolution, and scenario-specific risk adjustments."
//
// What changed and why it is not a rename:
//
// The previous model had a single `rodMaturity` composite over seven abstract
// quality dimensions (definition / evidence / lineage / validation / temporal /
// relationship / reconciliation) collapsed to one 0-1 score per rod. That is
// incompatible with the Maturity principle in a structural way, not a cosmetic
// one — a single score cannot express "100% legal, 40% billing readiness" at
// the same time. Those seven dimensions were also, on inspection, describing
// how much we TRUST the state rather than how far along it is, which is what
// the Confidence principle covers. So the seven did not get relabelled; they
// were retired and their intent redistributed:
//
//   -> CHANNEL_MATURITY  is now a SET of independent purpose scores, never a
//                        composite. There is deliberately no `overall` weight
//                        map, because averaging the purposes would reintroduce
//                        exactly the single number the principle rejects.
//   -> STATE_CONFIDENCE  is a genuine weighted composite over the six positive
//                        inputs the Confidence principle names, with the
//                        seventh ("scenario-specific risk adjustments") applied
//                        as a penalty rather than pretending risk contributes
//                        positively to confidence.
//
// Metric key note: ROD_MATURITY -> CHANNEL_MATURITY follows the canon's own
// Journey -> Channel move (see worldRegistry.js, which already carries
// `canonicalId: 'channel'` and `legacyAliases: ['Journey Rod']`). The old key
// is kept as a legacy alias in metricDefinitionRegistry.js, not deleted.

export const ROD_MATHEMATICS_METHODOLOGY = Object.freeze({
  methodologyId: 'rod-mathematics-v2',
  effectiveFrom: '2026-07-29',
  supersedes: 'rod-mathematics-v1',

  stageCompleteness: Object.freeze({
    bucketWeights: Object.freeze({ definitions: 0.25, evidence: 0.30, relationships: 0.20, validation: 0.25 }),
  }),

  stageReadiness: Object.freeze({
    weights: Object.freeze({ stageCompleteness: 0.30, minimumDefinitions: 0.15, requiredEvidence: 0.20, contradictionClearance: 0.15, dependencyState: 0.10, requiredDecisions: 0.10 }),
    atomMaturityThreshold: 0.75,
  }),

  // ── CHANNEL_MATURITY — purpose-scoped ─────────────────────────────────────
  // Each purpose is scored independently on 0-1 and reported separately. The
  // six below are the ones the Maturity principle names by example; the set is
  // configuration, so an org can add its own without a code change.
  //
  //   requiresClusters / requiresMolecules  the stage-awareness: what evidence
  //                                         has to exist for this purpose.
  //   dependsOn                             the dependency-awareness: a purpose
  //                                         is capped by the purposes it rests
  //                                         on. Billing readiness cannot exceed
  //                                         legal maturity — you cannot bill
  //                                         against an unsigned contract.
  //   networkScope                          the network-awareness: 'self' scores
  //                                         from this rod alone; 'related'
  //                                         means sibling/child rods count
  //                                         toward it (participation coverage
  //                                         is about how many counterparties
  //                                         actually joined, which no single rod
  //                                         can know on its own).
  channelMaturity: Object.freeze({
    purposes: Object.freeze([
      Object.freeze({
        key: 'legal', label: 'Legal Maturity',
        definition: 'Whether a binding agreement exists and is executed.',
        requiresClusters: Object.freeze([]),
        requiresMolecules: Object.freeze(['contract_effective_date']),
        dependsOn: Object.freeze([]), networkScope: 'self',
      }),
      Object.freeze({
        key: 'participation_coverage', label: 'Participation Coverage',
        definition: 'How much of the intended counterparty population has actually joined the agreement.',
        requiresClusters: Object.freeze([]),
        requiresMolecules: Object.freeze(['provisioned_user_count']),
        dependsOn: Object.freeze(['legal']), networkScope: 'related',
      }),
      Object.freeze({
        key: 'billing_readiness', label: 'Billing Readiness',
        definition: 'Whether the commercial terms can actually be invoiced as configured.',
        requiresClusters: Object.freeze([]),
        requiresMolecules: Object.freeze(['arr']),
        dependsOn: Object.freeze(['legal']), networkScope: 'self',
      }),
      Object.freeze({
        key: 'rev_rec_readiness', label: 'Revenue Recognition Readiness',
        definition: 'Whether recognition can be performed against governed, reconciled evidence.',
        requiresClusters: Object.freeze(['revenue_recognition_readiness']),
        requiresMolecules: Object.freeze([]),
        dependsOn: Object.freeze(['legal', 'billing_readiness']), networkScope: 'self',
      }),
      Object.freeze({
        key: 'renewal_stability', label: 'Renewal Stability',
        definition: 'How durable the relationship looks going into its next term.',
        requiresClusters: Object.freeze(['adoption_signal']),
        requiresMolecules: Object.freeze([]),
        dependsOn: Object.freeze(['participation_coverage']), networkScope: 'related',
      }),
      Object.freeze({
        key: 'expected_realization', label: 'Expected Realization',
        definition: 'How much of the contracted value is actually expected to be realized.',
        requiresClusters: Object.freeze([]),
        requiresMolecules: Object.freeze(['probability']),
        dependsOn: Object.freeze(['billing_readiness', 'renewal_stability']), networkScope: 'related',
      }),
    ]),
    // A purpose is capped at this multiple of its weakest dependency. 1.0 means
    // a hard cap: billing readiness can never exceed legal maturity.
    dependencyCapFactor: 1.0,
  }),

  // ── STATE_CONFIDENCE — separate axis ──────────────────────────────────────
  // Transcribed from MVP_20B_Confidence_Rules. "Confidence measures support
  // quality and certainty; it is distinct from journey maturity."
  //
  // These six components and weights replace an earlier set that was inferred
  // from the Confidence principle's prose before the workbook was available.
  // The shape was right; the names and numbers were not. Every band below is
  // the sheet's own, not a smooth curve fitted to it — CONF-002 is genuinely a
  // step function, and modelling it as exponential decay produced different
  // answers either side of each boundary.
  stateConfidence: Object.freeze({
    weights: Object.freeze({
      sourceAuthority: 0.25,          // CONF-001
      evidenceAgreement: 0.20,        // CONF-003
      evidenceRecency: 0.15,          // CONF-002
      calculationCompleteness: 0.15,  // CONF-004
      reconciliationStatus: 0.15,     // CONF-005
      validationStatus: 0.10,         // CONF-006
    }),
    // CONF-001: public filing or authoritative system = 1.0; internal approved
    // = 0.8; synthetic authoritative demo = 0.7; inferred = 0.4.
    sourceAuthorityScale: Object.freeze({ authoritative: 1.0, internal_approved: 0.8, synthetic_demo: 0.7, inferred: 0.4 }),
    // CONF-002: <=30 days = 1.0; 31-90 = 0.8; 91-365 = 0.6; >365 = 0.4.
    recencyBands: Object.freeze([
      Object.freeze({ maxAgeDays: 30, value: 1.0 }),
      Object.freeze({ maxAgeDays: 90, value: 0.8 }),
      Object.freeze({ maxAgeDays: 365, value: 0.6 }),
      Object.freeze({ maxAgeDays: null, value: 0.4 }),
    ]),
    // CONF-005 / CONF-006 enumerations.
    reconciliationScale: Object.freeze({ full: 1.0, partial: 0.6, unreconciled: 0.2 }),
    validationScale: Object.freeze({ validated: 1.0, supported: 0.8, pending: 0.5, contradicted: 0.1 }),
    // Scenario-specific risk, applied as a penalty after the weighted sum so a
    // high-risk scenario can never raise confidence.
    riskAdjustment: Object.freeze({ maxPenalty: 0.35, defaultScenarioRisk: 0 }),
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
