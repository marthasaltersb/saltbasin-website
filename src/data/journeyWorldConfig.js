// The Spatial Journey World's domain configuration: the three Lifecycle
// Journey Data Rod *type* templates (Revenue / Customer / Member), the
// Private Equity Deal variant of the Revenue template, molecule
// bonding-rule definitions, the Member-Organization branch relationship
// type, objectives, and the seed leads used to populate the world at init.
//
// Every atom instance references an elementRegistry id instead of inlining
// ad hoc shape. Rendering code (SpatialJourneyWorld.jsx) never branches on
// rodType/templateName — it reads whatever this file (or a future
// alternate config) describes.

function atomInstance(atomId, elementId, name, meaning, maturity, magneticProperties, opts = {}) {
  return {
    atomId,
    elementId,
    name,
    meaning,
    maturity,
    magneticProperties,
    value: opts.value ?? null,
    evidence: opts.evidence || null,
    conflict: !!opts.conflict,
    risk: opts.risk || 0,
    security: opts.security || { scope: 'org' },
  };
}

// ---------------------------------------------------------------------------
// Molecule bonding-rule definitions (magnetic field -> Bond -> Molecule).
// A new molecule type/variant is an addition to this array only.
// ---------------------------------------------------------------------------
export const MOLECULE_DEFINITIONS = [
  { moleculeId: 'dealDimensionMolecule', name: 'Deal Dimension Molecule', attractionTags: ['dealDimension'] },
  { moleculeId: 'diligenceMolecule', name: 'Diligence Molecule', attractionTags: ['diligence'] },
  {
    moleculeId: 'pricingMolecule', name: 'Pricing Molecule', attractionTags: ['pricing'],
    variantDimension: 'pricingModel', defaultVariant: 'flat-rate',
    variants: { 'flat-rate': {}, tiered: {}, 'usage-based': {} },
  },
  { moleculeId: 'contractTermsMolecule', name: 'Contract Terms Molecule', attractionTags: ['contractTerms'] },
  { moleculeId: 'billingMolecule', name: 'Billing Molecule', attractionTags: ['billing'] },
  { moleculeId: 'customerIdentityMolecule', name: 'Customer Identity Molecule', attractionTags: ['identity'] },
  { moleculeId: 'securityMolecule', name: 'Security Molecule', attractionTags: ['security'] },
];

// Not a rod type — a labeled relationship connecting a Member rod (a person,
// acting as buyer/influencer for an org) to that org's Customer rod and
// typically a Revenue rod. One person, one Member rod, ever.
export const MEMBER_ORGANIZATION_RELATIONSHIP_TYPE = {
  id: 'memberOrganizationRelationship',
  name: 'Member Organization Relationship',
  description: 'A typed relationship between a Member Rod and organization Customer/Revenue Rods. It is not a Tributary because it does not represent scenario divergence.',
};

// ---------------------------------------------------------------------------
// Revenue Lifecycle Journey Data Rod — Private Equity Deal template.
// ---------------------------------------------------------------------------
export const REVENUE_ROD_TEMPLATE = {
  templateName: 'Private Equity Deal',
  agent: { id: 'agent-revenue', name: 'Revenue Channel Rod Staff' },
  stages: [
    { id: 'rev-lead', name: 'Lead', maturity: 0.9, atoms: [
      atomInstance('a-lead-source', 'OrgIdentifier', 'Lead Source Definition', 'Where this deal originated', 0.9, ['identity']),
    ] },
    { id: 'rev-qualification', name: 'Sourcing Qualification', maturity: 0.6, atoms: [
      atomInstance('a-deal-size', 'CurrencyAmount', 'Deal Size', 'Anticipated transaction value', 0.7, ['dealDimension']),
      atomInstance('a-pricing-model', 'PricingModelEnum', 'Pricing Model', 'How this deal will be priced', 0.65, ['dealDimension'], { value: 'tiered' }),
      atomInstance('a-billing-cadence', 'BillingCadenceEnum', 'Billing Cadence', 'How often this deal bills', 0.6, ['dealDimension']),
      atomInstance('a-segment', 'SegmentEnum', 'Customer Segment', 'Which segment this counterparty falls into', 0.75, ['dealDimension'], { value: 'portfolio-company' }),
      atomInstance('a-sold-to', 'PartyIdentifier', 'Sold-To Party', 'The party this deal is sold to', 0.55, ['dealDimension']),
    ], gate: {
      id: 'qualification', label: 'Deal Officially Qualified',
      requiredAtomIds: ['a-deal-size', 'a-pricing-model', 'a-billing-cadence', 'a-segment', 'a-sold-to'],
      atomThreshold: 0.6, moleculeId: 'dealDimensionMolecule',
      qualifiedMessage: 'This deal is officially qualified.',
    } },
    { id: 'rev-diligence', name: 'Diligence', maturity: 0.55, atoms: [
      atomInstance('a-diligence-checklist', 'FreeTextNote', 'Diligence Checklist', 'Outstanding diligence items', 0.55, ['diligence']),
      atomInstance('a-risk-assessment', 'ConfidenceScore', 'Risk Assessment Confidence', 'Confidence in the current risk read', 0.5, ['diligence']),
    ] },
    { id: 'rev-proposal', name: 'Proposal / LOI', maturity: 0.6, atoms: [
      atomInstance('a-proposal-terms', 'FreeTextNote', 'Proposal Terms Definition', 'Core terms offered in the LOI', 0.62, ['contractTerms']),
      atomInstance('a-loi-status', 'ApprovalStateEnum', 'Letter of Intent Status', 'Current LOI approval state', 0.6, ['contractTerms'], { value: 'pending' }),
    ], gate: {
      id: 'proposal', label: 'Proposals Unlocked',
      requiredAtomIds: ['a-proposal-terms', 'a-loi-status'],
      atomThreshold: 0.55,
      qualifiedMessage: 'Proposals unlocked for this counterparty.',
    } },
    { id: 'rev-quote', name: 'Quote / Pricing', maturity: 0.45, atoms: [
      atomInstance('a-pricing-version', 'DocumentVersionRef', 'Pricing Version', 'The authoritative pricing document version', 0.5, ['pricing'], {
        conflict: true, risk: 0.5,
        evidence: [
          { source: 'CPQ', value: 'Pricing Version 4.2 (2026 list)' },
          { source: 'Contract Ops Sheet', value: 'Pricing Version 4.1 (legacy)' },
        ],
      }),
      atomInstance('a-min-usage', 'CurrencyAmount', 'Minimum Usage Commitment', 'Minimum committed usage under this pricing', 0.4, ['pricing']),
    ], gate: {
      id: 'quote', label: 'Master Pricing Record Produced',
      requiredAtomIds: ['a-pricing-version', 'a-min-usage'],
      atomThreshold: 0.7, moleculeId: 'pricingMolecule',
      mergeBackStageId: 'rev-contract',
      qualifiedMessage: 'Pricing finalized — preparing the master pricing record.',
    } },
    { id: 'rev-contract', name: 'Definitive Agreement', maturity: 0.35, atoms: [
      atomInstance('a-billto', 'PartyIdentifier', 'Bill-To / Financing-Party-of-Record Definition', 'Who is invoiced — and, if financed, who is authoritative on the financing side', 0.3, ['contractTerms', 'partyRole'], {
        conflict: true, risk: 0.8,
        evidence: [
          { source: 'Salesforce (CRM)', value: 'Ridgeline Data — HQ (New York, NY)' },
          { source: 'Financing Partner Docs', value: 'Meridian Capital Financing SPV (San Jose, CA)' },
        ],
      }),
      atomInstance('a-effective-date', 'EffectiveDate', 'Contract Effective Date Definition', 'When this agreement takes effect', 0.75, ['contractTerms']),
      atomInstance('a-perf-obligation', 'FreeTextNote', 'Performance Obligation Definition', 'What each party is obligated to deliver', 0.55, ['contractTerms']),
    ] },
    { id: 'rev-order', name: 'Closing', maturity: 0.5, locked: true, atoms: [
      atomInstance('a-fulfillto', 'PartyIdentifier', 'Fulfill-To Party Definition', 'Who receives delivery at close', 0.8, ['billing']),
      atomInstance('a-payment-method', 'FreeTextNote', 'Payment Method', 'How this deal is paid', 0.65, ['billing']),
    ] },
    { id: 'rev-sub', name: 'Post-Close Integration', maturity: 0.55, locked: true, atoms: [
      atomInstance('a-renewal-rule', 'DurationTerm', 'Renewal Rule', 'How and when this deal renews', 0.85, ['billing']),
      atomInstance('a-usage-metering', 'ConfidenceScore', 'Usage Metering Definition', 'Confidence in usage metering setup', 0.4, ['billing']),
    ] },
    { id: 'rev-renew', name: 'Renewal / Follow-on', maturity: 0.7, atoms: [
      atomInstance('a-expansion-trigger', 'FreeTextNote', 'Expansion Trigger Definition', 'What triggers a follow-on deal', 0.7, ['billing']),
      atomInstance('a-adjustment-rule', 'PercentageRate', 'Adjustment Rule', 'How pricing adjusts at renewal', 0.85, ['billing'], { value: '3%' }),
    ] },
  ],
};

// ---------------------------------------------------------------------------
// Customer Lifecycle Journey Data Rod — Portfolio Company template
// (alternate template: Financing Banking Partner — same stage topology,
// different counterparty framing; selected per-instance, not a fork here).
// ---------------------------------------------------------------------------
export const CUSTOMER_ROD_TEMPLATE = {
  templateName: 'Portfolio Company',
  alternateTemplates: ['Financing Banking Partner'],
  agent: { id: 'agent-customer', name: 'Customer Channel Rod Staff' },
  stages: [
    { id: 'cust-identified', name: 'Counterparty Identified', maturity: 0.8, atoms: [
      atomInstance('a-org-identity', 'OrgIdentifier', 'Counterparty Identity', 'The organization on the other side of this deal', 0.8, ['identity']),
    ] },
    { id: 'cust-diligence', name: 'Diligence Participation', maturity: 0.6, atoms: [
      atomInstance('a-diligence-response', 'FreeTextNote', 'Diligence Response Log', 'What this counterparty has provided so far', 0.6, ['diligence']),
    ] },
    { id: 'cust-negotiate', name: 'Term Negotiation', maturity: 0.55, atoms: [
      atomInstance('a-negotiation-position', 'FreeTextNote', 'Negotiation Position', 'Where this counterparty stands on open terms', 0.55, ['contractTerms']),
    ] },
    { id: 'cust-signature', name: 'Signature', maturity: 0.6, atoms: [
      atomInstance('a-sig-authority', 'PartyRoleEnum', 'Signature Authority Definition', 'Who is authorized to sign for this org', 0.6, ['contractTerms', 'partyRole'], { value: 'signatory' }),
    ] },
    { id: 'cust-onboard', name: 'Onboarding', maturity: 0.55, atoms: [
      atomInstance('a-onboard-checklist', 'FreeTextNote', 'Onboarding Checklist Definition', 'Steps remaining to activate this relationship', 0.55, ['billing']),
    ] },
    { id: 'cust-active', name: 'Active Relationship', maturity: 0.8, atoms: [
      atomInstance('a-service-recipient', 'PartyIdentifier', 'Service Recipient Definition', 'Who at this org receives service', 0.85, ['identity']),
      atomInstance('a-support-tier', 'SegmentEnum', 'Support Tier Definition', 'This org’s current support tier', 0.75, ['identity']),
    ] },
  ],
  tributary: {
    id: 'tributary-retrade', objectType: 'journey_tributary', name: 'Re-trade / Financing Change', originStageId: 'cust-active', confluenceStageId: 'cust-active',
    agent: { id: 'agent-tributary-retrade', name: 'Re-trade Tributary Agent' },
    confluence: { id: 'confluence-retrade', preserveRejectedContributions: true, historicalLineageAgentId: 'agent-history-retrade' },
    stages: [
      { id: 'branch-requested', name: 'Change Requested', maturity: 0.6, atoms: [
        atomInstance('a-change-reason', 'FreeTextNote', 'Change Reason Definition', 'Why a financing change was requested', 0.6, ['contractTerms']),
      ] },
      { id: 'branch-approved', name: 'Change Approved', maturity: 0.4, atoms: [
        atomInstance('a-approval-threshold', 'CurrencyAmount', 'Approval Threshold Definition', 'Dollar threshold requiring manager approval', 0.4, ['contractTerms'], {
          conflict: true, risk: 0.6,
          evidence: [
            { source: 'Approval Workflow (v1)', value: 'Manager approval required over $5,000' },
            { source: 'Approval Workflow (v2, branch)', value: 'Manager approval required over $10,000' },
          ],
        }),
      ] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Member Journey Data Rod. One person, one Member rod, ever — org-buyer and
// direct-consumer capacities are branches off this same rod, never separate
// logins.
// ---------------------------------------------------------------------------
export const MEMBER_ROD_TEMPLATE = {
  templateName: 'Customer Portal Member',
  agent: { id: 'agent-member', name: 'Member Channel Rod Staff' },
  stages: [
    { id: 'mem-invited', name: 'Invited', maturity: 0.7, atoms: [
      atomInstance('a-work-email', 'EmailAddress', 'Work Email Address', 'The email this member was invited with', 0.8, ['identity']),
    ] },
    { id: 'mem-provisioned', name: 'Provisioned', maturity: 0.75, atoms: [
      atomInstance('a-license-type', 'FreeTextNote', 'License Type Definition', 'What this member is licensed for', 0.75, ['security']),
    ] },
    { id: 'mem-active', name: 'Active', maturity: 0.65, atoms: [
      atomInstance('a-role-assignment', 'PartyRoleEnum', 'Role Assignment Definition', 'This member’s role in the org relationship', 0.7, ['security'], { value: 'signatory' }),
      atomInstance('a-personal-email', 'EmailAddress', 'Personal Email Address', 'Verified personal email — required for personal-scope modules', 0.2, ['personalScope']),
    ] },
    { id: 'mem-change', name: 'Change Request', maturity: 0.5, atoms: [
      atomInstance('a-change-approval', 'ApprovalStateEnum', 'Change Approval Definition', 'Status of this member’s pending change request', 0.5, ['security'], { value: 'pending' }),
    ] },
    { id: 'mem-offboarding', name: 'Offboarding', maturity: 0.6, atoms: [
      atomInstance('a-deprovision-rule', 'FreeTextNote', 'Deprovisioning Rule', 'What happens to this member’s access on offboarding', 0.6, ['security']),
    ] },
  ],
};

export const ROD_TEMPLATES = {
  revenue: REVENUE_ROD_TEMPLATE,
  customer: CUSTOMER_ROD_TEMPLATE,
  member: MEMBER_ROD_TEMPLATE,
};

// ---------------------------------------------------------------------------
// Objectives (spatial + accessible-list, see legend/objectives panel).
// ---------------------------------------------------------------------------
export const OBJECTIVES = [
  { id: 'obj-billto', title: 'Define the authoritative Bill-To / Financing-Party-of-Record', targetAtomId: 'a-billto', kind: 'resolve', complete: false },
  { id: 'obj-renewal-evidence', title: 'Validate renewal term evidence', targetAtomId: 'a-renewal-rule', kind: 'info', complete: true },
  { id: 'obj-pricing', title: 'Resolve pricing version conflict', targetAtomId: 'a-pricing-version', kind: 'info', complete: false },
  { id: 'obj-tributary-confluence', title: 'Review re-trade Tributary Confluence differences', targetAtomId: 'confluence::tributary-retrade', kind: 'lineage', complete: false },
  { id: 'obj-adjustment', title: 'Confirm usage adjustment behavior', targetAtomId: 'a-adjustment-rule', kind: 'info', complete: true },
  { id: 'obj-masterdata-approve', title: 'Approve the master pricing record merge', targetAtomId: 'masterdata-merge::pricingMolecule', kind: 'approve', complete: false },
];

// ---------------------------------------------------------------------------
// Seed leads — one per genesis rule, used to populate the world at init
// (see genesis.js / SpatialJourneyWorld.jsx).
// ---------------------------------------------------------------------------
export const SEED_LEADS = [
  {
    entityLabel: 'Ridgeline Data — Buyout by Meridian Capital',
    leadContext: { origin: 'internal', createdBy: 'AE — J. Alvarez' },
  },
  {
    entityLabel: 'Ridgeline Data — Dana Whit (VP Operations)',
    leadContext: { origin: 'externalIntake', emailKind: 'work', capacity: 'orgBuyer' },
  },
  {
    entityLabel: 'M. Torres — Direct Subscription',
    leadContext: { origin: 'externalIntake', emailKind: 'personal', capacity: 'directConsumer' },
  },
];
