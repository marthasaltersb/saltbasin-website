// Lead to Revenue Capability Model
// © 2026 Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works · All rights reserved
//
// MES Best Bets™ — GTM + Q2R, end-to-end full revenue lifecycle best of experience practices
// and platforms that lead to business results that can be actually proven.
//
// Lead to Revenue Capability Model™ is a core IP artifact under MES Best Bets™.
// Practitioner-derived from 12+ years of enterprise delivery across Q2R, CPQ, CLM,
// RevRec, and RevOps programs. AI-assisted organization. Practitioner-signed.
//
// "Where the practitioner meets AI augmentation to go from practitioner-derived,
// AI augmented, to AI-derived, practitioner signed." — Betsy Salter, 2026
//
// Not for redistribution. Licensed use only under Salt Basin Net Works engagement agreement.

export const ARTIFACT = {
  id: 'l2r-capability-model-v1',
  type: 'methodology_widget',
  title: 'Lead to Revenue Capability Model',
  trademark: 'Lead to Revenue Capability Model™',
  parentBrand: 'MES Best Bets™',
  parentBrandDescriptor: 'GTM + Q2R, end-to-end full revenue lifecycle best of experience practices and platforms that lead to business results that can be actually proven.',
  author: 'Martha Elizabeth Salter aka Betsy Salter',
  organization: 'Salt Basin Net Works',
  copyright: '© 2026 Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works · All rights reserved',
  tagline: 'Where the practitioner meets AI augmentation — practitioner-derived, AI-augmented, practitioner-signed.',
  version: '1.0',
  publishedAt: '2026-06-30',
  provenance: 'Derived from 12+ years of practitioner delivery across enterprise Q2R, CPQ, CLM, RevRec, and RevOps programs across PE-backed, high-growth, and Fortune 500 environments. AI-assisted structuring and organization. No vendor framework reproduced.',
  license: {
    public: 'teaser_only',
    member: 'read_only_framework',
    client: 'engagement_licensed',
  },
  watermarkTemplate: '© 2026 Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works · Lead to Revenue Capability Model™ · MES Best Bets™ · Licensed to: {{licensee}} · {{date}}',
};

// ── GTM Architecture Layer ──────────────────────────────────────────────────
// The strategic foundation. Precedes and informs the operational revenue lifecycle.
// Two valid entry paths: market-first (startup) and product-first (mature org).

export const GTM_PATHS = {
  market_first: {
    id: 'market_first',
    name: 'Market-First Path',
    context: 'Startup / early-stage. Market opportunity or problem statement precedes product definition.',
    sequence: ['market_intelligence', 'product_definition', 'revenue_model', 'channel_motion', 'gtm_execution'],
    risk: 'Performance obligations defined too loosely — startup promises what it cannot yet recognize under ASC 606.',
  },
  product_first: {
    id: 'product_first',
    name: 'Product-First Path',
    context: 'Mature / PE-backed / established org. Product architecture and performance obligations drive GTM design.',
    sequence: ['product_definition', 'market_intelligence', 'revenue_model', 'channel_motion', 'gtm_execution'],
    risk: 'Product definition owned by engineering and legal; never translated into a shared language for sales and finance — creating the RevRec and deal-desk problems that surface downstream.',
  },
};

export const GTM_NODES = [
  {
    id: 'product_definition',
    order: 1,
    name: 'Product Definition',
    shortName: 'Product',
    tierVisibility: 'member',
    color: '#1B2A3B',
    description: 'The documented translation of a product or service into its performance obligations (the contractual promises that govern revenue recognition under ASC 606 / IFRS 15) AND the engineering specifications required to fulfill those obligations. Not a features list. Not a roadmap. The minimum viable definition that allows a company to make a revenue-recognizable promise to a customer.',
    keyOutputs: [
      'Performance obligation definitions (ASC 606 / IFRS 15 compliant)',
      'Engineering specification minimums for go-to-market readiness',
      'Pricing model architecture (subscription, usage, perpetual, hybrid)',
      'Delivery method and acceptance criteria definition',
    ],
    riskAreas: [
      'Revenue recognized before performance obligation is clearly defined',
      'Sales promises features that engineering has not scoped',
      'Pricing model not aligned to recognition timing',
      'Product architecture changes after contract terms are set',
    ],
    players: ['Product', 'Engineering', 'Finance / RevRec', 'Legal'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'market_intelligence',
    order: 2,
    name: 'Market Intelligence & ICP',
    shortName: 'Market',
    tierVisibility: 'member',
    color: '#2A3B2A',
    description: 'Define the ideal customer profile, competitive landscape, and market opportunity. In market-first paths, this precedes product definition. In product-first paths, it validates and sharpens product-market fit.',
    keyOutputs: [
      'ICP definition (firmographic, technographic, behavioral)',
      'Competitive landscape and positioning map',
      'Total addressable market sizing',
      'Buyer persona and decision-maker map',
    ],
    riskAreas: [
      'ICP defined by who we sold to last, not who we should sell to next',
      'No shared definition between marketing and sales',
      'Competitive gaps not surfaced until late in deal cycle',
    ],
    players: ['Marketing', 'Sales Leadership', 'Product', 'Executive'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'revenue_model',
    order: 3,
    name: 'Revenue Model & Pricing Strategy',
    shortName: 'Revenue Model',
    tierVisibility: 'member',
    color: '#3B2A1B',
    description: 'How the company monetizes. Pricing model design, packaging, discounting governance, and the recognition implications of each model type. The revenue model determines what the CPQ system must enforce and what the billing system must calculate.',
    keyOutputs: [
      'Pricing model type: subscription / usage-based / perpetual / hybrid',
      'Packaging and tiering architecture',
      'Discount governance policy',
      'Revenue recognition method per model',
    ],
    riskAreas: [
      'Pricing model chosen by sales convenience, not by recognition feasibility',
      'No connection between pricing architecture and billing system capability',
      'Discount governance undefined — ad hoc erosion of margins',
    ],
    players: ['Finance', 'Sales Leadership', 'Product', 'Legal'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'channel_motion',
    order: 4,
    name: 'Channel & GTM Motion Design',
    shortName: 'Channel',
    tierVisibility: 'member',
    color: '#2A1B3B',
    description: 'How the company reaches buyers and closes deals. Direct, partner/channel, product-led growth, inbound, outbound, or hybrid. GTM motion determines handoff design at every downstream stage.',
    keyOutputs: [
      'Primary GTM motion(s) defined and resourced',
      'Partner/channel structure and rules of engagement',
      'Sales motion alignment to buyer journey',
      'Handoff design from marketing to sales',
    ],
    riskAreas: [
      'Multiple motions running without clear ownership boundaries',
      'Partner conflict with direct motion not governed',
      'PLG motion not connected to sales-assisted conversion',
    ],
    players: ['Sales Leadership', 'Marketing', 'Channel/Alliances', 'Executive'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'gtm_execution',
    order: 5,
    name: 'GTM Execution',
    shortName: 'Execution',
    tierVisibility: 'member',
    color: '#3B2A2A',
    description: 'Campaigns, content, plays, events, and outbound sequences. The activation of the GTM motion. Where the strategy meets the market.',
    keyOutputs: [
      'Campaign plan aligned to ICP and motion',
      'Content strategy by buyer stage',
      'Sales play library',
      'Attribution model for GTM spend',
    ],
    riskAreas: [
      'Campaigns not connected to pipeline attribution',
      'Content produced without buyer stage mapping',
      'No feedback loop from sales to marketing on lead quality',
    ],
    players: ['Marketing', 'Sales', 'SDR/BDR'],
    tierVisibilityDetail: 'client',
  },
];

// ── Revenue Lifecycle Stages ────────────────────────────────────────────────
// 9 operational stages from first lead through renewal and expansion.
// Delineated by handoff risk — each stage boundary is where revenue leakage concentrates.

export const LIFECYCLE_STAGES = [
  {
    id: 'demand_gen',
    order: 1,
    name: 'Demand & Lead Generation',
    shortName: 'Demand Gen',
    tierVisibility: 'member',
    color: '#1B2A3B',
    description: 'Top-of-funnel demand creation and initial lead capture. Controls the volume and quality of pipeline entering the revenue machine. Leakage here compounds at every downstream stage.',
    controlPoints: [
      'Campaign attribution accuracy',
      'Lead source data completeness',
      'MQL definition alignment (marketing ↔ sales)',
      'Lead routing speed and logic',
    ],
    riskAreas: [
      'Attribution leakage — untagged or misattributed source',
      'MQL/SQL threshold misalignment between functions',
      'Duplicate lead creation',
      'Dark funnel — unknown spend effectiveness',
    ],
    players: {
      owns: ['Marketing'],
      contributes: ['SDR/BDR', 'Product'],
      depends: ['Sales', 'Finance'],
    },
    systems: ['Marketing automation', 'Ad platforms', 'Lead enrichment', 'CRM (lead object)'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'lead_qualification',
    order: 2,
    name: 'Lead Qualification & Identity',
    shortName: 'Lead Qual',
    tierVisibility: 'member',
    color: '#2A3B2A',
    description: 'Converts raw leads into sales-qualified opportunities. Resolves identity (dedup, merge), scores leads against qualification criteria, and executes the MQL→SQL handoff — the single most commonly broken handoff in the revenue chain.',
    controlPoints: [
      'Deduplication and identity resolution',
      'Scoring threshold definition and enforcement',
      'MQL→SQL SLA (speed to contact)',
      'Lead routing to right rep and segment',
    ],
    riskAreas: [
      'Duplicate opportunities created in pipeline',
      'Leads never touched — no routing SLA enforced',
      'MQL definition drift over time',
      'Score gaming by marketing for attribution credit',
    ],
    players: {
      owns: ['SDR/BDR', 'Sales Operations'],
      contributes: ['Marketing', 'Sales'],
      depends: ['RevOps', 'Finance'],
    },
    systems: ['CRM', 'Lead scoring platform', 'Dedup tools', 'Routing logic'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'opportunity_pipeline',
    order: 3,
    name: 'Opportunity & Pipeline Management',
    shortName: 'Pipeline',
    tierVisibility: 'member',
    color: '#3B2A1B',
    description: 'Manages qualified opportunities from creation through commit. Stage hygiene, forecast accuracy, deal velocity, and coverage ratio live here. Where RevOps teams spend most of their time — and where most data quality problems become visible.',
    controlPoints: [
      'Stage definition clarity and enforcement',
      'Forecast category discipline',
      'Pipeline coverage ratio by segment',
      'Deal velocity by stage',
    ],
    riskAreas: [
      'Stage skipping — inflated win rates',
      'Forecast manipulation — sandbagging or sandcastling',
      'Stale opportunities without close date discipline',
      'Pipeline concentration risk',
    ],
    players: {
      owns: ['Sales', 'Sales Management'],
      contributes: ['RevOps', 'Sales Operations'],
      depends: ['Finance', 'Executive'],
    },
    systems: ['CRM (opportunity object)', 'Forecasting tools', 'Pipeline analytics', 'Conversation intelligence'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'cpq',
    order: 4,
    name: 'Configure, Price & Quote',
    shortName: 'CPQ',
    tierVisibility: 'member',
    color: '#2A1B3B',
    description: 'Translates a qualified opportunity into a formal commercial proposal. CPQ systems enforce pricing rules, approval workflows, and discount governance. The single biggest source of deal-desk drag and margin leakage in complex selling environments.',
    controlPoints: [
      'Product and pricing configuration accuracy',
      'Discount governance and approval routing',
      'Quote-to-proposal turnaround time',
      'Version control — which quote is live',
    ],
    riskAreas: [
      'Ad hoc discounting outside system',
      'Approval bypass under time pressure',
      'Quote proliferation — multiple active versions',
      'Product configuration errors that survive to contract',
    ],
    players: {
      owns: ['Sales', 'Deal Desk'],
      contributes: ['Finance', 'Legal', 'Product'],
      depends: ['RevOps', 'Billing'],
    },
    systems: ['CPQ (Salesforce, Conga, Apttus, custom)', 'Product catalog', 'Approval workflow engine', 'Document generation'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'clm',
    order: 5,
    name: 'Contract Lifecycle',
    shortName: 'CLM',
    tierVisibility: 'member',
    color: '#3B2A2A',
    description: 'Legal negotiation, redlining, signature, and executed contract storage. The handoff from commercial to legal introduces the most common source of revenue recognition timing errors — contract terms not matching booked deal terms.',
    controlPoints: [
      'Quote-to-contract term consistency',
      'Redline governance and version control',
      'Executed contract storage and accessibility',
      'Revenue-critical clause tracking (payment terms, acceptance, term dates)',
    ],
    riskAreas: [
      'Contract terms diverge from quoted terms',
      'Recognition trigger buried in non-standard clause',
      'Missing executed contracts',
      'Signature from unauthorized party',
    ],
    players: {
      owns: ['Legal'],
      contributes: ['Sales', 'Finance', 'Deal Desk'],
      depends: ['RevRec', 'Billing', 'Audit'],
    },
    systems: ['CLM (Ironclad, DocuSign CLM, Conga CLM)', 'eSignature', 'Contract repository', 'Legal intake workflow'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'order_to_book',
    order: 6,
    name: 'Order to Book',
    shortName: 'Order→Book',
    tierVisibility: 'member',
    color: '#1B3B2A',
    description: 'Converts a signed contract into a booked order, triggering downstream fulfillment and billing. The booking moment is when revenue is formally committed — and when the handoff to delivery and finance must be clean.',
    controlPoints: [
      'Contract-to-order accuracy — no manual re-entry',
      'Booking recognition trigger definition',
      'Handoff package to delivery completeness',
      'Finance notification and booking journal entry',
    ],
    riskAreas: [
      'Order entry errors from manual re-keying',
      'Booking recorded before contract is fully executed',
      'Finance not notified until delivery starts',
      'Missing start date or term on booking',
    ],
    players: {
      owns: ['Sales Operations', 'Order Management'],
      contributes: ['Finance', 'Legal', 'Delivery'],
      depends: ['RevRec', 'Billing'],
    },
    systems: ['CRM (opportunity→order)', 'ERP (order management)', 'CPQ-to-billing integration', 'Booking confirmation workflow'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'deliver_fulfill',
    order: 7,
    name: 'Deliver & Fulfill',
    shortName: 'Deliver',
    tierVisibility: 'member',
    color: '#2A2A3B',
    description: 'Service delivery, product fulfillment, and customer onboarding. For services businesses, delivery milestones often trigger billing and recognition events — making clean project tracking a financial control, not just an operations one.',
    controlPoints: [
      'Delivery milestone tracking and sign-off',
      'Usage metering accuracy for usage-based models',
      'Customer acceptance criteria and sign-off process',
      'Project data feeding billing triggers',
    ],
    riskAreas: [
      'Milestone reached but billing not triggered',
      'Customer rejects work silently — no formal acceptance',
      'Usage data not reconciled to billing',
      'Scope creep not captured in contract amendments',
    ],
    players: {
      owns: ['Delivery / Professional Services', 'Customer Success'],
      contributes: ['Product', 'Engineering', 'Project Management'],
      depends: ['Billing', 'RevRec', 'Finance'],
    },
    systems: ['PSA (FinancialForce, Certinia, Mavenlink)', 'Project management', 'Usage metering', 'Field service management'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'revrec_bill_collect',
    order: 8,
    name: 'Recognize, Bill & Collect',
    shortName: 'RevRec·Bill',
    tierVisibility: 'member',
    color: '#3B1B1B',
    description: 'Revenue recognition against contract terms, invoice generation, AR management, and cash application. Errors here produce audit risk, restatements, and DSO expansion. The eight critical control points for Q2R readiness concentrate heavily in this stage.',
    controlPoints: [
      'RevRec policy compliance (ASC 606 / IFRS 15)',
      'Invoice accuracy and timeliness',
      'AR aging discipline and escalation',
      'Cash application accuracy and speed',
    ],
    riskAreas: [
      'Revenue recognized before performance obligation is met',
      'Invoice sent to wrong entity or address',
      'Deferred revenue calculation errors',
      'Unapplied cash distorting AR aging',
    ],
    players: {
      owns: ['Finance / Accounting', 'RevRec team', 'AR'],
      contributes: ['Billing Ops', 'Legal', 'Delivery'],
      depends: ['Audit', 'Executive', 'Investors'],
    },
    systems: ['ERP (SAP, Oracle, NetSuite)', 'Billing (Zuora, Stripe, custom)', 'AR automation', 'RevRec subledger'],
    tierVisibilityDetail: 'client',
  },
  {
    id: 'renew_expand',
    order: 9,
    name: 'Renew & Expand',
    shortName: 'Renew·Expand',
    tierVisibility: 'member',
    color: '#1B2A3B',
    description: 'Retention, contract renewal, upsell, and cross-sell. Net Revenue Retention (NRR) is the dominant metric. The revenue machine only compounds if it retains and grows what it already has — the highest-leverage investment for most B2B businesses.',
    controlPoints: [
      'Renewal pipeline visibility at 90/60/30 days',
      'Health scoring accuracy and currency',
      'Expansion opportunity identification and qualification',
      'Churn signal detection and escalation',
    ],
    riskAreas: [
      'Renewal caught too late — last-minute saves lose',
      'Health score based on activity not outcomes',
      'Expansion credited to wrong source',
      'Churn not attributed back to root cause stage',
    ],
    players: {
      owns: ['Customer Success', 'Renewal Sales'],
      contributes: ['Sales', 'Product', 'Finance'],
      depends: ['RevOps', 'Executive'],
    },
    systems: ['CS platform (Gainsight, Totango, ChurnZero)', 'CRM', 'Product analytics', 'Renewal workflow'],
    tierVisibilityDetail: 'client',
  },
];

// ── Cross-Cutting Dimensions ────────────────────────────────────────────────

export const CROSS_CUTTING = [
  {
    id: 'analytics_intelligence',
    name: 'Analytics & Revenue Intelligence',
    description: 'The cross-cutting intelligence layer. Sees the full revenue chain in one view. Almost always built last. Should be designed first.',
    applies: 'all_stages',
  },
  {
    id: 'data_governance',
    name: 'Data Governance & Quality',
    description: 'Data standards, ownership, and quality controls that make every stage trustworthy.',
    applies: 'all_stages',
  },
  {
    id: 'integration_architecture',
    name: 'System Integration Architecture',
    description: 'The connective tissue. How data moves between stages without loss or distortion.',
    applies: 'all_stages',
  },
  {
    id: 'revenue_risk',
    name: 'Revenue Risk & Compliance',
    description: 'Audit readiness, RevRec compliance, regulatory exposure. Cross-stage because a clause in stage 05 creates risk in stage 08.',
    applies: 'all_stages',
  },
  {
    id: 'ai_automation',
    name: 'AI & Automation Enablement',
    description: 'Where AI augments human work per stage — from lead scoring to contract review to forecast generation.',
    applies: 'all_stages',
  },
  {
    id: 'people_process_change',
    name: 'People, Process & Change',
    description: 'The organizational layer. Who owns what, how roles are designed, how change lands across functions.',
    applies: 'all_stages',
  },
];

// ── Capability group → L2R stage mapping ───────────────────────────────────
// Links existing Salt Basin platform capabilities to L2R stages.
// Used for backlog traceability and patch note stage tagging.

export const PLATFORM_CAPABILITY_MAP = {
  'platform-foundation':    ['all'],
  'multi-tenant-cms':       ['all'],
  'lead-capture':           ['lead_qualification'],
  'email-infrastructure':   ['demand_gen'],
  'net-works-network':      ['demand_gen', 'opportunity_pipeline'],
  'public-site-content':    ['demand_gen'],
  'output-pages':           ['cpq', 'clm'],
  'admin-experience':       ['all'],
  'deployment-infrastructure': ['all'],
  'security-and-data':      ['cross_cutting'],
  'observability':          ['analytics_intelligence'],
  'requirements-mgmt':      ['analytics_intelligence'],
  // Planned
  'nrm':                    ['opportunity_pipeline', 'renew_expand'],
  'crm':                    ['lead_qualification', 'opportunity_pipeline', 'cpq'],
  'plm-contribution':       ['analytics_intelligence'],
  'services-proposals':     ['cpq', 'clm'],
  'herq-content':           ['demand_gen'],
};

export default {
  ARTIFACT,
  GTM_PATHS,
  GTM_NODES,
  LIFECYCLE_STAGES,
  CROSS_CUTTING,
  PLATFORM_CAPABILITY_MAP,
};
