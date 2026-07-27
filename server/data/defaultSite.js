// Home page: the Salt Basin MRS "Product Experience" — fully config-driven
// via the block registry (src/components/blocks/ProductExperienceBlocks.jsx,
// MetadataModelBlock.jsx). Content here reflects the real Salt Basin brand
// hierarchy per docs/salt-basin-foundation-source-of-truth.md: Salt Basin
// Net Works is the brand; Salt Basin MRS is the flagship product, applying
// the HOS™ methodology to build a client's Salt Basin Net Work. Consulting
// splits into 3 sub-pages: founder, services, assessments. Resources is a
// placeholder. Creative Storefront houses the Decor + Faith content.

const HOME_SECTIONS = [
  {
    id: 'home-hero',
    type: 'productHero',
    name: 'Hero',
    status: 'live',
    bg: 'cream',
    fields: {
      script: 'Salt Basin Net Works —',
      heading: 'We build for the customer you keep,',
      headingEmphasis: 'not just the deal you close.',
      lede: 'Salt Basin MRS designs, builds, and maintains your Enterprise Ecosystem — a Salt Basin Net Work — applying the HOS™ methodology across revenue, systems, and data.',
      cta1Label: "See what we're building",
      cta1Link: '#home-build-flow',
      cta2Label: 'Get in Touch',
      cta2Link: '#bestystaff',
    },
  },
  {
    id: 'home-highlights',
    type: 'rotatingHighlights',
    name: 'Highlights',
    status: 'live',
    bg: 'cream',
    navSubPage: true,
    fields: {
      eyebrow: 'What Salt Basin Builds',
      heading: 'One founder. A family of real products.',
      intro: "Each product is a working piece of the same operating philosophy — measure it, render it, and keep it honest.",
      rotationMs: 5000,
      highlights: [
        {
          eyebrow: 'Salt Basin MRS',
          title: 'Design and build your Enterprise Ecosystem.',
          text: 'Salt Basin MRS (Measurement Rendering Systems) applies the HOS™ methodology to design, build, and maintain a client-specific Salt Basin Net Work — measured and rendered as one living system.',
          chips: 'HOS™ Methodology, Enterprise Ecosystem, Salt Basin Net Work',
        },
        {
          eyebrow: 'SaltTide™',
          title: 'Bottom lines with a rising tide.',
          text: "Consumer credit intelligence and routing — reading a person's financial DNA to find the path that actually helps them, not just the next offer.",
          chips: 'Credit Health, Routing Intelligence, Consumer Finance',
        },
        {
          eyebrow: 'MESA',
          title: 'Next-generation agentic infrastructure, measured honestly.',
          text: 'MES Agencies designs agent hierarchies, cache systems, and agentic infrastructure that apply the Contribution Intelligence Methodology to quantify human + AI interactions, compare cost-basis and traditional delivery models, and calculate value-based pricing margin.',
          chips: 'Agentic Hierarchy, Cache Infrastructure, Contribution Intelligence, Value-Based Margin',
        },
        {
          eyebrow: 'RLMM™',
          title: 'A proprietary maturity model for revenue.',
          text: 'Revenue Lifecycle Mechanics Maturity — the diagnostic that applies the Salter Momentum™* spine to revenue operations before anything gets built.',
          chips: 'Diagnostic, Revenue Operations, Maturity Model',
        },
      ],
      metrics: [
        { label: 'Years of enterprise consulting', value: '12+', sublabel: 'Blackbaud, Accenture, PwC, Vista, TIBCO, Slalom' },
        { label: 'Largest engagement', value: '$38B+', sublabel: 'Semiconductor usage-based billing' },
        { label: 'Renewal process automated', value: '$500M', sublabel: 'Recurring revenue' },
        { label: 'Real products in the family', value: '4', sublabel: 'Salt Basin MRS, SaltTide™, MESA, RLMM™' },
      ],
    },
  },
  {
    id: 'home-build-flow',
    type: 'buildFlow',
    name: 'Build Flow',
    status: 'live',
    bg: 'ivory',
    navSubPage: true,
    fields: {
      eyebrow: 'How It Comes Together',
      heading: 'From methodology to a Salt Basin Net Work',
      intro: 'Salt Basin MRS is the product. The Salter Momentum™* and HOS™ are how it thinks. Here is the build sequence, start to finish.',
      path: [
        { label: 'Understand', desc: "The Salter Momentum™* — meet the business where it's at." },
        { label: 'Diagnose', desc: 'RLMM™ scores revenue lifecycle maturity before anything gets built.' },
        { label: 'Design & Build', desc: 'Salt Basin MRS applies the HOS™ methodology to design and build your ecosystem.' },
        { label: 'Deliver', desc: 'You receive a Salt Basin Net Work — your Enterprise Ecosystem, purpose-built.' },
        { label: 'Maintain', desc: 'The Salt Basin Net Works maintenance model keeps it running and current.' },
      ],
      tabs: [
        { name: 'Founder', desc: 'Betsy leads product, strategy, and delivery across the whole family — the person behind the platform.', chips: 'Product, Strategy, Delivery' },
        { name: 'Operator', desc: 'Hands-on build and configuration work — the same AI-augmented execution used on client engagements.', chips: 'Configuration, Execution, AI-augmented' },
        { name: 'Advisor', desc: "MESA-branded advisory, delivery, and diagnostic engagements built on Salt Basin's own products.", chips: 'MESA, Advisory, Diagnostics' },
        { name: 'Creative', desc: 'Faith-rooted creative work under Salt Basin Creative Works — a different branch, the same person.', chips: 'Creative Works, Faith-Rooted' },
      ],
    },
  },
  {
    id: 'home-journeys',
    type: 'journeyRods',
    name: 'Journey Data Rods',
    status: 'live',
    bg: 'cream',
    navSubPage: true,
    fields: {
      eyebrow: 'Journey Data Rods',
      heading: 'Revenue, customer, and member truth — tracked together',
      intro: 'Journey Data Rods live inside the HOS™ methodology, tracked through SaltBridge. Actions, conversations, and approvals move all three rods as your ecosystem matures.',
      rods: [
        { key: 'revenue', label: 'Revenue Rod', color: 'var(--sbh-gold)', start: '32', checkoutBoost: '0', increment: '7' },
        { key: 'customer', label: 'Customer Rod', color: 'var(--sbh-teal)', start: '28', checkoutBoost: '0', increment: '6' },
        { key: 'member', label: 'Member Rod', color: 'var(--sbh-mauve)', start: '20', checkoutBoost: '0', increment: '8' },
      ],
      stepSequence: 'Ecosystem Scoped, RLMM™ Diagnostic Complete, HOS™ Design Approved, Salt Basin Net Work Delivered, Maintenance Model Active, Sponsor Identified, Second Engagement Started',
    },
  },
  {
    id: 'home-products',
    type: 'productCatalog',
    name: 'Product Catalog',
    status: 'live',
    bg: 'ivory',
    navSubPage: true,
    fields: {
      eyebrow: 'The Product Family',
      heading: 'Real products, one operating philosophy',
      intro: 'Every product ships from the same founder-led practice — engagement-based, outcome-driven, never oversold.',
      products: [
        { id: 'platform', name: 'Salt Basin Net Works Platform', tagline: 'The operating platform behind the network', desc: 'A configurable multi-tenant platform for public sites, operator profiles, governed content, lead context, integrations, products, and reusable operating intelligence.', priceLabel: 'Platform access · Scope by use case', outputs: 'Operator Network, Configurable Sites, Lead Intelligence, Integration APIs' },
        { id: 'career-portfolio', name: 'Living Career Portfolio', tagline: 'Direct-to-consumer career placement outputs', desc: 'A living career source of truth that turns experience, skills, case studies, tools, and outcomes into tailored resumes, portfolio sites, role-specific outputs, and placement-ready evidence.', priceLabel: 'Direct to consumer · Output-based', outputs: 'Portfolio Site, Tailored Resume, Case Studies, Career Placement Outputs' },
        { id: 'mrs', name: 'Salt Basin MRS', tagline: 'Measurement Rendering Systems', desc: 'Designs, builds, and maintains your Enterprise Ecosystem — a Salt Basin Net Work — by applying the HOS™ methodology.', priceLabel: 'Engagement-based · Contact for scope', outputs: 'Enterprise Ecosystem, HOS™ Design, Maintenance Model' },
        { id: 'salttide', name: 'SaltTide™', tagline: 'Bottom lines with a rising tide', desc: 'Consumer credit intelligence and routing, built on a covenant-of-salt brand promise.', priceLabel: 'Engagement-based · Contact for scope', outputs: 'Routing Intelligence, Credit Health Signal' },
        { id: 'mesa', name: 'MESA', tagline: 'MES Agencies · Next Gen Agentic Infrastructure', desc: 'Designs agentic hierarchies, governed cache systems, and human + AI operating infrastructure. Contribution Intelligence measures interaction and contribution, compares cost-basis to traditional delivery, and supports value-based pricing margin calculations.', priceLabel: 'Engagement-based · Value model by scope', outputs: 'Agent Hierarchy, Cache System, Contribution Intelligence, Cost-Basis Comparison, Value-Based Margin' },
        { id: 'bestystaff', name: 'BestyStaff', tagline: "Betsy's AI proxy agent", desc: 'An intake-sequenced agentic assistant with deliberate pacing, loop-back logic, and persistent memory — never claims licensure.', priceLabel: 'Available on this site', outputs: 'Guided Intake, Follow-up Routing' },
        { id: 'rlmm', name: 'RLMM™ Diagnostic', tagline: 'Revenue Lifecycle Mechanics Maturity', desc: 'The proprietary diagnostic that scores revenue lifecycle maturity before Salt Basin MRS designs anything.', priceLabel: 'Engagement-based · Contact for scope', outputs: 'Maturity Score, Diagnostic Report' },
      ],
    },
  },
  {
    id: 'home-exposure-calculator',
    type: 'exposureCalculator',
    name: 'Exposure Calculator',
    status: 'live',
    bg: 'cream',
    navSubPage: true,
    fields: {
      eyebrow: 'Where Revenue Leaks',
      heading: 'Estimate your exposure by category',
      intro: "The HOS™ methodology's six-layer framework maps revenue leakage by category. Enter your ARR for each to see an illustrative exposure estimate.",
      categories: [
        { key: 'salesPipeline', label: 'Sales Pipeline', defaultArr: '5000000', defaultExposurePct: '3' },
        { key: 'contractExecution', label: 'Contract Execution', defaultArr: '5000000', defaultExposurePct: '4' },
        { key: 'metering', label: 'Metering', defaultArr: '5000000', defaultExposurePct: '5' },
        { key: 'billingTrack', label: 'Billing Track', defaultArr: '5000000', defaultExposurePct: '6' },
        { key: 'recognitionTrack', label: 'Recognition Track', defaultArr: '5000000', defaultExposurePct: '3' },
        { key: 'disputeManagement', label: 'Dispute Management', defaultArr: '5000000', defaultExposurePct: '2' },
      ],
      disclaimer: 'These percentages are illustrative, industry-estimate ranges — not a scored result. A real RLMM™ diagnostic validates exposure against your own data before any number is used in a client-facing decision.',
    },
  },
  {
    id: 'home-apis',
    type: 'apiCatalogTable',
    name: 'System Engine APIs on our Connector Radar',
    status: 'live',
    bg: 'ivory',
    navSubPage: true,
    fields: {
      eyebrow: 'System Engine APIs on our Connector Radar',
      heading: 'A configurable connector horizon for the systems that run the work',
      intro: 'No rip-and-replace. These are active and priority connector targets for ingesting, normalizing, tracing, and returning data across the Salt Basin platform.',
      apis: [
        { name: 'Salesforce', purpose: 'CRM objects and native capabilities', auth: 'OAuth 2.0', setup: '2–4 weeks', costModel: 'API + platform licenses', journeyUse: 'Revenue Journey' },
        { name: 'QuickBooks', purpose: 'Billing and financial records', auth: 'OAuth 2.0', setup: '1–2 weeks', costModel: 'Usage-based', journeyUse: 'Billing Track' },
        { name: 'HubSpot', purpose: 'Marketing and lead data', auth: 'OAuth 2.0', setup: '1–2 weeks', costModel: 'Usage-based', journeyUse: 'Sales Pipeline' },
        { name: 'Microsoft', purpose: 'Email, calendar, files, identity', auth: 'OAuth 2.0', setup: '1–2 weeks', costModel: 'Tenant licensing', journeyUse: 'Evidence + Identity' },
        { name: 'Supabase / Postgres', purpose: 'Identity, persistence, storage', auth: 'Service role / JWT', setup: '3–7 days', costModel: 'Usage-based', journeyUse: 'Core Platform' },
        { name: 'Allvue / iLevel / PitchBook', purpose: 'Fund admin upward data push (priority targets)', auth: 'Partner-dependent', setup: 'TBD', costModel: 'TBD', journeyUse: 'Fund Admin Layer' },
      ],
    },
  },
  {
    id: 'home-start-engagement',
    type: 'startEngagement',
    name: 'Start an Engagement',
    status: 'draft',
    bg: 'cream',
    navSubPage: true,
    fields: {
      eyebrow: 'Start a Conversation',
      heading: "Tell us which products you're exploring",
      intro: 'Select what\'s relevant. Betsy follows up directly — engagement-based, no cart, no invented pricing.',
      engageProducts: [
        { id: 'mrs', name: 'Salt Basin MRS' },
        { id: 'salttide', name: 'SaltTide™' },
        { id: 'mesa', name: 'MESA' },
        { id: 'bestystaff', name: 'BestyStaff' },
        { id: 'rlmm', name: 'RLMM™ Diagnostic' },
      ],
      submitLabel: 'Start a Conversation',
    },
  },
  {
    id: 'home-platform-cadence',
    type: 'platformCadence',
    name: 'Platform Cadence',
    status: 'live',
    bg: 'ivory',
    navSubPage: true,
    fields: {
      eyebrow: 'How This Site Stays Current',
      heading: 'Platform update cadence',
      intro: "This is a living portfolio and product studio — here's the honest rhythm behind it.",
      schedule: [
        { cadence: 'Ongoing', title: 'Content and copy review', description: 'Section content is reviewed and refreshed directly in the admin CMS as products and positioning evolve.' },
        { cadence: 'Monthly', title: 'Methodology releases', description: 'Updates to the Salter Momentum™*, RLMM™, and HOS™ methodology documentation as they mature.' },
        { cadence: 'Quarterly', title: 'Product family review', description: 'A check-in across Salt Basin MRS, SaltTide™, MESA, and BestyStaff to confirm positioning still matches reality.' },
      ],
    },
  },
  {
    id: 'home-conversation',
    type: 'conversationalDemo',
    name: 'BestyStaff Demo',
    status: 'draft',
    bg: 'navy',
    navSubPage: true,
    fields: {
      eyebrow: 'Meet BestyStaff',
      heading: 'A guided conversation, not a form',
      intro: 'BestyStaff asks before it remembers anything, paces itself deliberately, and never claims licensure.',
      seedMessages: [
        { role: 'agent', text: "Before we go deeper, is it okay if I capture the context from this chat so Betsy can follow up more intelligently? You can say no, and I can still answer general questions." },
        { role: 'agent', text: "Do you already know Betsy? If so, what's the connection?" },
      ],
      replyText: "Noted. What are the top questions you want answered today — if you don't have five, start with one.",
      chipUpdates: 'Consent Requested, Awaiting Context',
      journeyImpactText: 'Journey impact:\n• Member Rod +0.05 — identity context captured\n• Revenue Rod unchanged — no commercial intent yet\n\nNext action:\nAsk what the visitor is trying to accomplish today.',
    },
  },
  {
    id: 'home-method',
    type: 'salterMomentumMethod',
    name: 'The Salter Momentum',
    status: 'live',
    bg: 'navy',
    navSubPage: true,
    fields: {
      eyebrow: 'The Master Methodology',
      heading: 'The Salter Momentum™*',
      footnote: '*Transformation > Manifestation — "You can\'t measure success… if you\'re still trying to prove success by re-proving what failed."',
      momentumSteps: [
        { phase: 'U', label: 'Understanding', subtitle: 'Old World', points: "Meet the business where it's at, Uncover what's actually broken, Investigate historically to inform present reality, Accept the impossible to answer" },
        { phase: 'R', label: 'Rendering', subtitle: 'A New Perspective', points: 'Definitions aligned, Sources verified as truth, Reality tested against assumptions, Cross-functional coalescence on mapping rules' },
        { phase: 'M', label: 'Manifesting', subtitle: 'Desired World', points: 'Defined success, Measurable outcomes, Seamless operations, Own + adopt + report' },
      ],
    },
  },
  {
    id: 'home-metadata-model',
    type: 'metadataModelDiagram',
    name: 'Metadata Model',
    status: 'live',
    bg: 'navy',
    navSubPage: true,
    fields: {
      eyebrow: 'The Metadata Model',
      heading: 'Atom → Joint → Molecule',
      intro: 'A Salt Basin Net Work is structurally an atom/joint/molecule graph. Salt Basin MRS is the system that measures and renders it.',
      nodes: [
        { id: 'atom1', label: 'Contract Data Field', tier: 'atom', desc: "A single, irreducible fact — e.g. a contract's renewal date." },
        { id: 'joint1', label: 'Traced To', tier: 'joint', desc: 'The relationship connecting the fact to what it drives.' },
        { id: 'molecule1', label: 'Journey Data Rod', tier: 'molecule', desc: 'A composed, portfolio-visible unit inside your Salt Basin Net Work.' },
      ],
      edges: [
        { from: 'atom1', to: 'molecule1', label: 'Traced To' },
      ],
    },
  },
];

// Retired sections below — kept as an unused reference array (not wired into
// any page) during the reconciliation pass Betsy asked for, so nothing from
// the prior Phase 3 home seed gets silently lost.
const _RETIRED_HOME_SECTIONS = [
  {
    id: 'aboutIntro',
    type: 'aboutIntro',
    name: 'About / Intro',
    status: 'live',
    bg: 'navy',
    fields: {
      leftEyebrow: 'Face of the Founder',
      heading: 'Betsy Salter',
      title: 'Strategic Operator',
      photoUrl: '',
      leftBlurb:
        'I build the systems behind revenue — Quote-to-Revenue, RevOps, financial intelligence, and executive risk advisory. This site is my living portfolio and the front door to Salt Basin Net Works — the network behind the work.',
      cta1: 'View Resume',
      cta1Link: '/output/portfolio',
      cta2: 'Get in Touch',
      cta2Link: '#contact',
      rightEyebrow: 'Salt Basin Mission · Short-Term Growth',
      missionHeading: 'Bringing together the best of the best.',
      missionBody:
        'Salt Basin Net Works exists to convene senior lead-to-cash operators and Salesforce-ecosystem experts — the people who have already done the work — and the companies that need them. Short-term, this is a curated network and a living portfolio. Long-term, it is the franchise of trusted operators for PE-backed and high-growth companies that refuse to settle.',
      bullet1: 'Senior Q2R, RevOps, CPQ, and CLM expertise',
      bullet2: 'PE-grade rigor; AI-augmented speed',
      bullet3: 'For companies who need proven operators, not bench resumes',
      platformLine: 'Bottom Lines with a Rising Tide.',
    },
  },
  {
    id: 'netWorksBanner',
    type: 'netWorksBanner',
    name: 'Net Works Banner',
    status: 'live',
    bg: 'cream',
    fields: {
      eyebrow: 'The Network',
      heading: 'Salt Basin Net Works',
      intro:
        'A growing roster of senior operators building from the same shoreline. Each card links to an operator profile — opt-in only.',
    },
  },
  {
    id: 'scripture',
    type: 'scripture',
    name: 'Scripture Band',
    status: 'live',
    bg: 'teal',
    fields: { verse: '"You are the salt of the earth."', reference: 'Matthew 5:13' },
  },
  {
    id: 'industryWheel',
    type: 'industryWheel',
    name: 'Industries × Domains',
    status: 'live',
    bg: 'ivory',
    fields: {
      eyebrow: 'Where I have done the work · How I work',
      heading: 'Industries Served × Domains of Expertise',
      intro:
        'Cross-vertical experience across high-growth and PE-backed environments. Click any industry on the wheel for a client snapshot; categorized domains and niche solutions are full-width below.',
      handsOn:
        'Salesforce:salesforce, Salesforce CPQ:salesforce, Conga CPQ:, Zuora Billing:zuora',
      integrationDesign:
        'SAP:sap, Oracle Financials:oracle, NetSuite:oracle, NetSuite Zone Billing:, Avalara:, Adaptive Insights:, Informatica:informatica, Stripe:stripe, Snowflake:snowflake, MuleSoft:mulesoft, Boomi:boomi',
      adjacent:
        'TIBCO BusinessWorks:tibco, HubSpot:hubspot, Tableau:tableau, Looker:looker, PowerBI:powerbi, dbt:dbt, Workday:workday',
    },
  },
  {
    id: 'joinNetwork',
    type: 'joinNetwork',
    name: 'Join the Network',
    status: 'live',
    bg: 'cream',
    fields: {
      eyebrow: 'For Operators',
      heading: 'Build your Salt Basin profile.',
      intro:
        "If you are a senior operator — Q2R, RevOps, finance systems, transformation, AI build — and you have found yourself between chapters, Salt Basin Net Works is for you. Claim a profile. Keep it current. Let companies find you.",
      bullet1: 'Profile site you control, like this one',
      bullet2: 'Networked with other senior operators',
      bullet3: 'Visible to companies looking for proven talent',
      cta: 'Get on the early list',
      placeholder: 'your@email.com',
      thanks: "You're on the list. I will reach out personally as we open access.",
    },
  },
  {
    id: 'forCompanies',
    type: 'forCompanies',
    name: 'For Companies',
    status: 'live',
    bg: 'ivory',
    fields: {
      eyebrow: 'For Companies',
      heading: 'Find proven senior operators.',
      intro:
        'Salt Basin Net Works connects companies — PE-backed, growth-stage, or in transition — with senior operators who have already done the work. No recruiter overhead, no junior bench. Reach out and we will help you shape the engagement.',
      bullet1: 'Vetted talent across Q2R, RevOps, finance, and transformation',
      bullet2: 'Flexible engagement shapes — sprints, fractional, retainers',
      bullet3: 'Founding members include consulting alumni from Slalom, PwC, Accenture, Vista',
      cta: 'Start a conversation',
      placeholder: 'work email',
      thanks: 'Thanks — I will reply within 48 hours.',
    },
  },
  {
    id: 'social',
    type: 'socialGrid',
    name: 'Connect Online',
    status: 'live',
    bg: 'ivory',
    fields: {
      heading: 'Find Me Online',
      intro: 'Follow along, shop, read, and connect across all the places I show up.',
    },
  },
  {
    id: 'contact',
    type: 'contact',
    name: 'Contact',
    status: 'live',
    bg: 'linen',
    fields: {
      eyebrow: 'Contact',
      heading: "Let's Connect",
      intro:
        "Whether you're looking for a strategic consulting partner, want to claim a Salt Basin profile, or just want to connect — I'd love to hear from you.",
      location: 'St. Petersburg, Florida',
    },
  },
];

// Presentational-only fields — job/timeline content is now sourced live from
// Career Master (career_jobs, via /api/career/master), which is uncapped and
// admin-editable through the "Career Master" tab rather than these flat
// job1..job10 fields. See src/components/blocks/index.jsx TimelineBlock and
// src/lib/careerMaster.js.
const TIMELINE_FIELDS = {
  eyebrow: 'Education → Career',
  heading: 'Professional Experience Evolution',
  intro:
    'Click any milestone on the timeline to read the work. Education foundation: College of Charleston, B.S. Accounting, Graduated 2013.',
  educationLine: 'College of Charleston — B.S. Accounting, Graduated 2013',
};

// Presentational-only fields — case study content is now sourced live from
// Career Master (career_engagements, via /api/career/master), which is
// uncapped (24 engagements vs. the previous fixed 3) and admin-editable
// through the "Career Master" tab. See CaseStudiesBlock / engagementToCase
// in src/components/blocks/index.jsx.
const CASE_STUDIES_FIELDS = {
  eyebrow: 'Selected Engagements',
  heading: 'Detailed Case Studies',
  intro:
    'Engagements that show the work at its full shape — context to impact, with the executive feedback that came with each.',
};

export const defaultSite = {
  version: 3,
  pages: {
    home: {
      key: 'home',
      name: 'Home',
      slug: '',
      type: 'landing',
      status: 'live',
      order: 0,
      sections: HOME_SECTIONS,
    },

    'consulting-founder': {
      key: 'consulting-founder',
      name: 'Meet the Founder',
      slug: 'consulting/founder',
      type: 'standard',
      status: 'live',
      order: 1,
      sections: [
        {
          id: 'founder-about',
          type: 'about',
          name: 'About',
          status: 'live',
          bg: 'ivory',
          fields: {
            eyebrow: 'Meet the Person Behind the Brand',
            heading: 'Betsy Salter',
            p1: "I wear a lot of hats, and I wear them all with intention — operating with a mindset that overlaps the big picture as well as the detailed tactics that make up a sustainable infrastructure.",
            p2: "As a consultant, and now platform founder, I've built a practice that sits at the intersection of strategic consulting, data intelligence, risk assessment, AI development, and mindfulness execution across multiple industries and multi-party contract networks.",
            p3: "My personality reflects the other pieces of my platform — involving creative making and faith-driven writing — because the work is never just the work. It's always connected to something deeper.",
            howIWork:
              "I leverage AI to do hands-on development and output generation — bringing enterprise-level thinking and execution to every engagement, without the enterprise overhead.",
          },
        },
        {
          id: 'founder-timeline',
          type: 'timeline',
          name: 'Career Timeline',
          status: 'live',
          bg: 'ivory',
          fields: TIMELINE_FIELDS,
        },
        {
          id: 'founder-cases',
          type: 'caseStudies',
          name: 'Detailed Case Studies',
          status: 'live',
          bg: 'navy',
          fields: CASE_STUDIES_FIELDS,
        },
        {
          id: 'founder-references',
          type: 'referencesRequest',
          name: 'References Request',
          status: 'live',
          bg: 'cream',
          fields: {
            eyebrow: 'Validate the work',
            heading: 'Request to contact my references',
            intro: "References include former partners and clients from Slalom, PwC, Vista Equity, and Accenture. I protect their time — references are released after a brief context check. Tell me who you are, who you'd like to hear from (or what kind of perspective), and I'll route accordingly.",
          },
        },
        {
          id: 'founder-contact',
          type: 'cta',
          name: 'Contact CTA',
          status: 'live',
          bg: 'linen',
          fields: {
            heading: 'Want to talk?',
            intro: "I'll reply personally within 48 hours.",
            cta1: 'Get in Touch',
            cta1Link: '/#contact',
          },
        },
      ],
    },

    'consulting-services': {
      key: 'consulting-services',
      name: 'Services',
      slug: 'consulting/services',
      type: 'standard',
      status: 'live',
      order: 2,
      sections: [
        {
          id: 'services',
          type: 'services',
          name: 'Services',
          status: 'live',
          bg: 'linen',
          fields: {
            eyebrow: 'How to work together',
            heading: 'Services',
            intro:
              'Three engagement shapes, all delivered with AI-assisted leverage. Pick the one that matches the moment.',
            s1Title: 'Diagnostic Sprint',
            s1Tag: '10-day fixed fee',
            s1Desc:
              'Rapid readiness assessment of your Q2R, RevOps, or CPQ stack. Risk map, prioritized roadmap, board-ready deliverable. Best when a problem is suspected but not yet scoped.',
            s1Cta: 'Discuss a Sprint',
            s2Title: 'Embedded Operator',
            s2Tag: '3–6 month engagement',
            s2Desc:
              'Fractional senior leader for system rebuilds, transformation programs, or interim leadership. Hands-on through design, vendor selection, and delivery. Best when the problem is real and execution capacity is thin.',
            s2Cta: 'Inquire',
            s3Title: 'Advisory Retainer',
            s3Tag: 'Monthly',
            s3Desc:
              'Executive-level strategic partner on standing call. Quarterly planning, deal-stage triage, board-prep, talent sounding. Best for founders and CFOs who want a seasoned operator in their corner without a full hire.',
            s3Cta: 'Start a Conversation',
          },
        },
      ],
    },

    'consulting-assessments': {
      key: 'consulting-assessments',
      name: 'Self-Service Assessments',
      slug: 'consulting/assessments',
      type: 'standard',
      status: 'live',
      order: 3,
      sections: [
        {
          id: 'assessments',
          type: 'assessments',
          name: 'Assessments',
          status: 'live',
          bg: 'navy',
          fields: {
            eyebrow: 'Coming soon',
            heading: 'Self-Service Assessments',
            intro:
              'Self-serve, scored, and benchmarked. Get a board-ready readout in under an hour. Notify me when they launch and you will be first in line.',
            a1Title: 'Q2R Readiness Score',
            a1Desc:
              'Score your lead-to-cash flow against the eight critical control points. Diagnoses leakage, deal-desk drag, and RevRec risk.',
            a1Price: '',
            a2Title: 'RevOps Maturity Assessment',
            a2Desc:
              'Pipeline, forecast, attribution, territory, and tooling — graded against fast-growth benchmarks. Identifies the wedge that buys back the most velocity.',
            a2Price: '',
            a3Title: 'AI-Adoption Readiness',
            a3Desc:
              'Where AI lifts your team next, and where it does not yet. Operating-model readout, talent and tooling map, 90-day pilot plan.',
            a3Price: '',
            notifyLabel: 'Notify Me at Launch',
          },
        },
      ],
    },

    resources: {
      key: 'resources',
      name: 'Resources',
      slug: 'resources',
      type: 'standard',
      status: 'live',
      order: 4,
      sections: [
        {
          id: 'res-hero',
          type: 'hero',
          name: 'Hero',
          status: 'live',
          bg: 'navy',
          fields: {
            eyebrow: 'For operators and the companies who hire them',
            heading: 'Resources',
            subtitle: 'Coming soon — data sheets, white papers, GTM frameworks',
            concept:
              'A library of board-ready deliverables, assessment reports, and operator-grade frameworks — the same artifacts I deliver inside engagements.',
            platformLine: 'White papers and GTM material will land here as they release.',
          },
        },
        {
          id: 'res-coming',
          type: 'cards',
          name: 'Coming Soon Resources',
          status: 'live',
          bg: 'ivory',
          fields: {
            eyebrow: 'In the pipeline',
            heading: 'What is coming',
            intro: 'Drops as they finalize. Subscribe via contact form to get the first look.',
            card1Title: 'Data Sheets',
            card1Desc: 'Service one-pagers, engagement maps, and pricing references.',
            card1Icon: '◇',
            card2Title: 'White Papers',
            card2Desc: 'Long-form frameworks — Q2R readiness, RevRec patterns, AI-adoption playbooks.',
            card2Icon: '◈',
            card3Title: 'GTM Material',
            card3Desc: 'Pitch frameworks, deck templates, board-pack templates and instrumentation.',
            card3Icon: '◰',
          },
        },
      ],
    },

    creative: {
      key: 'creative',
      name: 'Creative Storefront',
      slug: 'creative',
      type: 'standard',
      status: 'draft',
      hideFromNav: true,
      order: 5,
      sections: [
        {
          id: 'creative-hero',
          type: 'hero',
          name: 'Hero',
          status: 'live',
          bg: 'navy',
          fields: {
            eyebrow: 'The other side of the work',
            heading: 'Creative Storefront',
            subtitle: 'POP Decor · Poetry · Songs · Devotionals',
            concept:
              'The making and writing side of my practice. 3D printed home decor through POP Decor, and faith-rooted writing — devotionals, worship songs, and a life-story book in progress.',
          },
        },
        {
          id: 'creative-decor',
          type: 'twoCol',
          name: 'POP Decor',
          status: 'live',
          bg: 'linen',
          fields: {
            eyebrow: 'POP Decor',
            heading: 'Prints of Peace',
            subheading: '3D Home Decor · pop3decor.com',
            p1: 'Handcrafted 3D printed home decor with a boho soul. Every piece is designed and printed with intention — vases, lamps, wall art, and more.',
            p2: 'Find me at local craft shows in the St. Pete area, or browse the full collection online.',
            cta1: 'Visit the Shop',
            cta1Link: 'https://pop3decor.com',
            cta2: 'Custom Order',
            cta2Link: '/#contact',
          },
        },
        {
          id: 'creative-faith',
          type: 'cards',
          name: 'Faith & Writing',
          status: 'live',
          bg: 'navy',
          fields: {
            eyebrow: 'Faith & Writing',
            heading: 'Words That Point to Something Greater',
            intro:
              'Writing rooted in faith — devotionals, worship songs, and a life story told with honesty and hope.',
            card1Title: 'Devotional Blog',
            card1Desc:
              'Reflections on faith, creativity, and purpose — unexpected parallels between everyday life and biblical truth.',
            card1Icon: '✦',
            card2Title: 'Worship Songs',
            card2Desc:
              'From Ashes to Glory · Let This Reflection — original songs honest about the fall, anchored in redemption.',
            card2Icon: '♪',
            card3Title: 'Life Story Book',
            card3Desc:
              'A fictionalized memoir — including "The Fall" — for anyone who has had to be rebuilt from the ground up.',
            card3Icon: '◐',
          },
        },
      ],
    },
  },
};

export const defaultConfig = {
  version: 3,
  site: {
    name: 'Salt Basin Net Works',
    tagline: 'Bottom Lines with a Rising Tide',
    domain: 'saltbasin.net',
    copyrightLine: '© 2026 Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works',
  },
  // Brand palette — same shape as member configs. Admin can edit these in
  // the Config panel; overrides apply to saltbasin.net public pages.
  brand: {
    primary: '#1B2A3B',
    accent:  '#C4843A',
    ink:     '#F5F0E8',
    paper:   '#FBF6F0',
  },
  // Named theme applied as data-theme on .sb-public-site-root (see
  // src/brand.css [data-theme] blocks). New field — existing published
  // config_state rows without it fall back to 'strategic' at read time.
  theme: 'strategic',
  prelaunch: {
    enabled: false,
    password: 'rising-tide',
    headline: 'Coming Soon',
    subhead:
      'Salt Basin Net Works is opening its doors shortly. Enter the password to take a peek.',
  },
  social: {
    instagram: { label: 'Instagram', url: '', color: '#E1306C', on: false },
    linkedin: { label: 'LinkedIn', url: 'https://linkedin.com/in/marthasalter', color: '#0A66C2', on: true },
    skool: { label: 'Skool', url: '', color: '#6C4EF6', on: false },
    substack: { label: 'Substack', url: '', color: '#FF6719', on: false },
    etsy: { label: 'Etsy', url: '', color: '#F56400', on: false },
    amazon: { label: 'Amazon', url: '', color: '#FF9900', on: false },
    facebook: { label: 'Facebook', url: '', color: '#1877F2', on: false },
    tiktok: { label: 'TikTok', url: '', color: '#010101', on: false },
    pinterest: { label: 'Pinterest', url: '', color: '#E60023', on: false },
  },
  bestystaff: {
    enabled: true,
    greeting:
      "Hi — I'm BestyStaff, Betsy's AI proxy. I can answer initial questions about her work, point you to the right page, or help you get in touch.",
    persona:
      "You are BestyStaff, Martha Elizabeth (Betsy) Salter's personal AI proxy agent. Speak in first person about Betsy in the third person. You are warm, direct, and outcomes-oriented — never generic. Answer questions about her consulting work, background, faith writing, and POP Decor side. If someone wants to book a call, route them to the contact form. Never invent details — if you don't know, offer to forward the question.",
    aboutBio:
      "Betsy Salter is a Strategic Operator and C-suite partner who bridges enterprise knowledge with AI capability. She runs Salt Basin Net Works (Bottom Lines with a Rising Tide), builds HandoverOS (Q2R intelligence for PE-backed SaaS), and creates POP Decor (3D printed home goods). Based in St. Petersburg, FL.",
    homepage: {
      primaryCtaLabel: 'Explore the work',
      contactCtaLabel: 'Get in touch',
      eyebrow: 'Get in touch',
      heading: 'Start with BestyStaff.',
      description: 'Share what brought you here. BestyStaff will gather the useful context for Betsy, answer what it can, and create a lead record so the conversation can continue.',
    },
    intake: {
      contextPolicyKey: 'bestystaff_lead_intake_v1',
      greeting: "Hi — I'm BestyStaff, Betsy's AI proxy here at Salt Basin Net Works.",
      consentPrompt: 'May I capture this conversation as lead context so Betsy can follow up with the full picture?',
      flowOptions: [
        'Hire Betsy and / or Salt Basin Net Works for management consulting or technology consulting services',
        'Build a Salt Basin Net Works Career Portfolio Site',
        'Interested in purchasing and / or learning more about Salt Basin Net Works software offerings',
      ],
      questions: [
        { id: 'interestArea', cluster: 'intent', weight: 100, prompt: 'Which consulting, Career Portfolio, or software path are you interested in?', required: true, enabled: true },
        { id: 'contactName', cluster: 'identity', weight: 95, prompt: 'What name should Betsy use when following up?', required: true, enabled: true },
        { id: 'contactEmail', cluster: 'identity', weight: 95, prompt: 'What email should receive your private lead record?', required: true, enabled: true },
        { id: 'marketingConsent', cluster: 'consent', weight: 94, prompt: 'Do you consent to receiving marketing content from Salt Basin?', required: true, enabled: true },
        { id: 'businessNeed', cluster: 'need', weight: 90, prompt: 'What business problem, opportunity, or outcome brought you here?', required: true, enabled: true },
        { id: 'engagementType', cluster: 'engagement', weight: 85, prompt: 'Is this a full-time role, fractional role, fixed scope, or are you not sure yet?', required: false, enabled: true },
        { id: 'isBuyer', cluster: 'authority', weight: 80, prompt: 'Are you the buyer or decision maker for your organization?', required: false, enabled: true },
        { id: 'urgency', cluster: 'timing', weight: 70, prompt: 'What timing or urgency should Betsy understand?', required: false, enabled: true },
        { id: 'contactCompany', cluster: 'organization', weight: 65, prompt: 'What company or organization are you with?', required: false, enabled: true },
        { id: 'contactTitle', cluster: 'authority', weight: 60, prompt: 'What is your role or title?', required: false, enabled: true },
        { id: 'contactPhone', cluster: 'identity', weight: 40, prompt: 'Would you like to include a phone number?', required: false, enabled: true },
      ],
    },
    integrations: {
      providers: {
        pitchbook: { enabled: false, outboundUrl: '' },
        dnb: { enabled: false, outboundUrl: '' },
        salesforce: { enabled: false, outboundUrl: '' },
        hubspot: { enabled: false, outboundUrl: '' },
        marketo: { enabled: false, outboundUrl: '' },
        marketing: { enabled: false, outboundUrl: '' },
      },
    },
    privateContext: {
      contactEmail: 'betsysalter@saltbasin.net',
      contactPhone: '',
    },
    dataPolicy: {
      rules: {
        public: { read: ['anonymous', 'lead_owner', 'member', 'admin'], update: ['admin'] },
        business_contact: { read: ['anonymous', 'lead_owner', 'member', 'admin'], update: ['admin'] },
        personal_contact: { read: ['lead_owner', 'admin'], update: ['lead_owner', 'admin'] },
        private: { read: ['admin'], update: ['admin'] },
        sensitive: { read: ['lead_owner', 'admin'], update: ['lead_owner', 'admin'] },
        credential: { read: [], update: [] },
      },
    },
  },
  platform: {
    membersEnabled: true,
    networkPitch:
      "Salt Basin Net Works is an opt-in network of senior operators — consultants and lead-to-cash experts — building the next chapter on their own terms.",
  },
  email: {
    fromName: 'Betsy at Salt Basin',
    fromAddress: 'betsysalter@saltbasin.net',
    replyTo: 'betsysalter@saltbasin.net',
    notifyOnNewLead: true,
    notifyTo: null, // null = falls back to ADMIN_EMAIL env var
  },
};
