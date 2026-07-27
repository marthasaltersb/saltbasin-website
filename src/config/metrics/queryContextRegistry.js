// Active Query Context definitions (Visual Metrics master prompt §I–§IV). An Orbit selection in the
// world (Customer / Revenue / Member) sets `active_query_context` to one of these entries. Every
// dimension's `matchAtomIds` below is a real atom id from `src/data/journeyWorldConfig.js`'s rod
// templates — not an invented business-jargon dimension — so Query Coverage is checkable against actual
// seeded data, per §IV's "use real existing Salt Basin data where available" rule.
//
// `coreTags`/`relatedTags` reference the real `magneticProperties` tag vocabulary already in use by
// `MOLECULE_DEFINITIONS` and the rod templates (identity, dealDimension, diligence, contractTerms,
// pricing, billing, security, personalScope, partyRole) — no new tag vocabulary invented here.
//
// CUSTOMER's requiredContextDimensions is the fullest-populated entry because it's the spec's own worked
// example throughout §I–§VI. REVENUE and MEMBER are seeded with what's directly grounded in their rod
// templates today; extend them as more of those templates' atoms get real coverage-worthy content.

export const QUERY_CONTEXT_REGISTRY = Object.freeze({
  customer: {
    contextId: 'customer', label: 'Customer', primaryRodType: 'customer',
    coreTags: ['identity'],
    relatedTags: ['dealDimension', 'contractTerms', 'billing', 'partyRole', 'security'],
    requiredContextDimensions: [
      { dimensionId: 'customer_identity', label: 'Customer Identity', tier: 'required', matchAtomIds: ['a-org-identity'] },
      { dimensionId: 'customer_segment', label: 'Customer Segment', tier: 'required', matchAtomIds: ['a-segment'] },
      { dimensionId: 'sold_to', label: 'Sold-To Party', tier: 'required', matchAtomIds: ['a-sold-to'] },
      { dimensionId: 'active_relationship', label: 'Active Relationship / Service Recipient', tier: 'required', matchAtomIds: ['a-service-recipient'] },
      { dimensionId: 'billing_relationship', label: 'Billing Relationship', tier: 'required', matchAtomIds: ['a-billing-cadence'] },
      { dimensionId: 'pricing_relationship', label: 'Pricing Relationship', tier: 'required', matchAtomIds: ['a-pricing-version'] },
      { dimensionId: 'signature_authority', label: 'Signature Authority', tier: 'conditional', matchAtomIds: ['a-sig-authority'] },
      { dimensionId: 'support_tier', label: 'Support Tier', tier: 'conditional', matchAtomIds: ['a-support-tier'] },
      { dimensionId: 'onboarding_status', label: 'Onboarding Status', tier: 'conditional', matchAtomIds: ['a-onboard-checklist'] },
      { dimensionId: 'contract_terms', label: 'Contract Terms Position', tier: 'conditional', matchAtomIds: ['a-negotiation-position'] },
      { dimensionId: 'member_role', label: 'Member Role Assignment (portal access)', tier: 'conditional', matchAtomIds: ['a-role-assignment'] },
    ],
  },
  revenue: {
    contextId: 'revenue', label: 'Revenue', primaryRodType: 'revenue',
    coreTags: ['dealDimension'],
    relatedTags: ['pricing', 'contractTerms', 'diligence', 'identity'],
    requiredContextDimensions: [
      { dimensionId: 'deal_size', label: 'Deal Size', tier: 'required', matchAtomIds: ['a-deal-size'] },
      { dimensionId: 'pricing_model', label: 'Pricing Model', tier: 'required', matchAtomIds: ['a-pricing-model'] },
      { dimensionId: 'billing_cadence', label: 'Billing Cadence', tier: 'required', matchAtomIds: ['a-billing-cadence'] },
      { dimensionId: 'sold_to', label: 'Sold-To Party', tier: 'required', matchAtomIds: ['a-sold-to'] },
      { dimensionId: 'pricing_version', label: 'Master Pricing Record', tier: 'required', matchAtomIds: ['a-pricing-version'] },
      { dimensionId: 'proposal_terms', label: 'Proposal Terms', tier: 'conditional', matchAtomIds: ['a-proposal-terms'] },
      { dimensionId: 'loi_status', label: 'Letter of Intent Status', tier: 'conditional', matchAtomIds: ['a-loi-status'] },
      { dimensionId: 'min_usage', label: 'Minimum Usage Commitment', tier: 'conditional', matchAtomIds: ['a-min-usage'] },
    ],
  },
  member: {
    contextId: 'member', label: 'Member', primaryRodType: 'member',
    coreTags: ['identity', 'security'],
    relatedTags: ['personalScope'],
    requiredContextDimensions: [
      { dimensionId: 'work_email', label: 'Work Email Address', tier: 'required', matchAtomIds: ['a-work-email'] },
      { dimensionId: 'license_type', label: 'License Type', tier: 'required', matchAtomIds: ['a-license-type'] },
      { dimensionId: 'role_assignment', label: 'Role Assignment', tier: 'required', matchAtomIds: ['a-role-assignment'] },
      { dimensionId: 'personal_email', label: 'Personal Email (personal-scope modules)', tier: 'conditional', matchAtomIds: ['a-personal-email'] },
      { dimensionId: 'change_approval', label: 'Change Approval Status', tier: 'conditional', matchAtomIds: ['a-change-approval'] },
    ],
  },
});

export const QUERY_INTERACTION_REGISTRY = Object.freeze({
  customerOrbit: Object.freeze({
    interactionId: 'customerOrbit', contextId: 'customer', shippedTerm: 'Customer Orbit',
    eyebrow: 'QUERY CONTEXT', activatedLabel: 'Customer context activated',
    summaryTemplate: 'Viewing the system through Customer context.',
    unavailableLabel: 'Not enough governed evidence',
    actions: Object.freeze({ highlight: 'Highlight contributing elements', release: 'Release query projection' }),
    divergence: Object.freeze({
      eyebrow: 'Heterosemantic State Divergence',
      explanation: 'These rods represent non-equivalent truths for the same entity. Their relative movement is the signal, not a discrepancy to eliminate.',
      boundaryWarning: 'Reconciliation Boundary Exceedance detected — at least one pair has moved outside its configured Correlated State Envelope.',
    }),
  }),
});
