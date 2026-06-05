// Phase 3 seed: Home page is lean (intro split + scripture + industries wheel
// + platform CTAs + contact). Consulting splits into 3 sub-pages: founder,
// services, assessments. Resources is a placeholder. Creative Storefront
// houses the Decor + Faith content.

const HOME_SECTIONS = [
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
      cta1Link: '/consulting/founder',
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

// Job descriptions ported verbatim from Salter Resume_2026.pdf.
const TIMELINE_FIELDS = {
  eyebrow: 'Education → Career',
  heading: 'Professional Experience Evolution',
  intro:
    'Click any milestone on the timeline to read the work — verbatim from the resume. Education foundation: College of Charleston, B.S. Accounting, Graduated 2013.',

  job1Company: 'Blackbaud, Inc.',
  job1Title: 'Senior Operations Associate',
  job1Dates: 'Aug 2013 – Apr 2015',
  job1Bullets:
    'Managed contract intake and validation, ensuring accuracy, completeness, and compliance prior to processing\nOversaw billing activities within SAP, verifying pricing, invoicing, and receivables alignment before posting to accounting\nPartnered with accounting to resolve revenue discrepancies and ensure accurate revenue recognition\nTrained and onboarded new team members on contract processing workflows and back-office systems\nServed as internal SME for contract-to-billing processes, supporting operational continuity and issue resolution',

  job2Company: 'Accenture',
  job2Title: 'Consultant',
  job2Dates: 'Apr 2015 – Aug 2018',
  job2Bullets:
    'Delivered business analysis and systems integration work across three major global clients: a $4.5B+ global education and publishing company navigating an active digital transformation, a global data analytics and technology company, and an enterprise coffee distributor company with operations across Europe (Netherlands)\nSupported systems and process integration work during a period when digital and services businesses had grown to represent 65%+ of total revenue, helping align operational infrastructure to a shifting revenue model mid-transformation\nPerformed business analysis, requirements translation, and systems integration work mapping data flows, defining interface requirements, and ensuring operational systems supported accurate financial and reporting outputs\nBuilt foundational fluency in how enterprise systems architecture connects to financial performance: the beginning of a career-long practice of understanding why system decisions matter to the P&L, not just how to configure them',

  job3Company: 'Vista Equity Partners',
  job3Title: 'Senior Consultant',
  job3Dates: 'Aug 2018 – May 2020',
  job3Bullets:
    'Supported portfolio companies in executing system changes tied to pricing strategy, revenue generation, and operational efficiency\nAssisted in translating GTM objectives into system updates across quoting, contracting, and billing workflows\nEvaluated operational and system performance to identify revenue leakage and inefficiencies\nContributed to implementation of changes improving cost structure and revenue scalability',

  job4Company: 'TIBCO',
  job4Title: 'Lead Solution Architect',
  job4Dates: 'Jun 2020 – Jan 2021',
  job4Bullets:
    'Built and supported system integrations between enterprise platforms, enabling flow of order, pricing, and billing data\nCoordinated with technical teams to define data mappings, interfaces, and system dependencies\nAssisted in reworking integrations to improve data accuracy, processing reliability, and visibility across systems\nTroubleshot data and system issues impacting transaction processing and downstream reporting',

  job5Company: 'PwC',
  job5Title: 'Advisory Manager',
  job5Dates: 'Jan 2021 – Jun 2023',
  job5Bullets:
    'Delivered CPQ and billing systems work across a portfolio of high-growth SaaS and technology clients — including a $2.6B virtual healthcare platform, a $430M+ enterprise SaaS operations company, and a $3.7B+ global positioning technology company across subscription, usage-based, and access fee revenue models\nGathered and translated complex requirements across pricing, quoting, and billing workflows ensuring system designs mapped directly to financial reporting and revenue recognition requirements for each client\'s specific model\nDeveloped process flows and system specifications bridging the gap between what sales promised and what finance could recognize, resolving misalignments before they created billing errors, deferred revenue distortions, or audit exposure',

  job6Company: 'Slalom Consulting',
  job6Title: 'Senior Principal',
  job6Dates: 'Jun 2023 – Jun 2024',
  job6Bullets:
    'Led Quote-to-Revenue transformation for a $9B global industrial automation manufacturer (~35% software/services revenue mix) — redesigned CPQ and CLM systems to support a new subscription pricing model the legacy manual workflows could not handle, eliminating ad hoc discounting and improving gross margin visibility per deal\nDesigned and implemented usage-based billing and pricing systems for the technology licensing division of a $38B+ global semiconductor company where billing accuracy and recognition timing had direct, material impact on hundreds of millions in recognized revenue\nSupported a publicly traded healthcare IT company (~$615M revenue) through an active NASDAQ delisting crisis rooted in $40M+ in revenue restatements. Aligned operational systems to SEC-grade financial reporting and audit readiness requirements during an active Audit Committee investigation\nMaintained consistent executive confidence across all three engagements: received ongoing partner-level feedback citing client trust, leadership credibility, and cross-functional effectiveness',

  job7Company: 'Streamforce Consulting',
  job7Title: 'Business Architect',
  job7Dates: 'Jan 2025 – May 2025',
  job7Bullets:
    'Partnered with C-suite leadership to translate revenue targets and GTM priorities into system-level execution plans with clear financial dependencies and delivery milestones\nStructured delivery roadmaps incorporating pricing logic, forecasting inputs, and operational constraints, enabling leadership to stress-test assumptions against financial outcomes\nEnsured system outputs aligned to revenue tracking and reporting requirements, reducing lag between operational execution and financial visibility\nGuided trade-off decisions across scope, timeline, and system capability, always anchored to business and financial impact, not just delivery convenience',

  educationLine: 'College of Charleston — B.S. Accounting, Graduated 2013',
};

// Case study fields, from SalterCareerProfilePackage_2026.pdf page 4.
const CASE_STUDIES_FIELDS = {
  eyebrow: 'Selected Engagements',
  heading: 'Detailed Case Studies',
  intro:
    'Three engagements that show the work at its full shape — context to impact, with the executive feedback that came with each.',

  case1Title: 'Healthcare Company',
  case1Subtitle: 'NASDAQ Relisting Initiative',
  case1Context:
    'Organization navigating post-delisting recovery and operational restructuring\nLimited alignment between financial reporting, systems, and execution',
  case1Role: 'Strategic Operator · Quote-to-Revenue Subject Matter Expert',
  case1Actions:
    'Supported restructuring initiatives by aligning operational systems with financial reporting needs\nBuilt frameworks connecting system outputs to performance tracking and relisting readiness\nCoordinated across stakeholders to ensure execution aligned with financial and regulatory expectations',
  case1Impact:
    'Improved visibility into performance and operational drivers\nEnabled more structured approach to financial reporting and readiness planning\nSupported initiatives tied to relisting strategy and execution',
  case1Feedback: 'Whoever put Betsy on this project is a genius. — CTO',

  case2Title: 'Global Tech Co.',
  case2Subtitle: 'GTM Alignment & Usage-Based Billing',
  case2Context:
    'Need to support launch of new products requiring usage-based pricing models\nExisting systems not equipped to handle dynamic billing and product structures',
  case2Role: 'GTM Advisor · CPQ / Billing Enablement Lead',
  case2Actions:
    'Designed and implemented system changes to support usage-based billing and pricing models\nAligned product structures, pricing logic, and billing workflows across systems\nWorked cross-functionally to ensure systems supported new product GTM requirements',
  case2Impact:
    'Enabled launch of new revenue-generating products\nEstablished scalable framework for usage-based pricing and billing\nImproved alignment between product, pricing, and billing systems',
  case2Feedback:
    'Betsy has won the trust of the client and maintained great working relationships with internal teams. I receive consistent positive feedback about Betsy\'s leadership. — Partner',

  case3Title: 'Global Manufacturing',
  case3Subtitle: 'Quote-to-Revenue Transformation',
  case3Context:
    'Fragmented quoting, pricing, and contracting processes across multiple tools\nHeavy reliance on manual workflows and inconsistent pricing logic',
  case3Role: 'CPQ / CLM Functional Lead',
  case3Actions:
    'Redesigned quoting and contracting workflows across CPQ and CLM platforms\nConfigured pricing logic, product models, and approval workflows\nLed workshops to align stakeholders across sales, finance, and operations',
  case3Impact:
    'Eliminated manual pricing processes across multiple tools\nImproved deal accuracy and execution speed\nEnabled consistent pricing governance and system-driven workflows',
  case3Feedback:
    'I cannot thank and applaud Betsy enough for her contributions on the complex deals project. — VP',
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
      status: 'live',
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
    copyrightLine: '© 2026 Betsy Salter · Salt Basin Net Works',
  },
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
  },
  platform: {
    membersEnabled: true,
    networkPitch:
      "Salt Basin Net Works is an opt-in network of senior operators — consultants and lead-to-cash experts — building the next chapter on their own terms.",
  },
  email: {
    fromName: 'Betsy at Salt Basin',
    fromAddress: 'betsy@saltbasin.net',
    replyTo: 'betsy@saltbasin.net',
    notifyOnNewLead: true,
    notifyTo: null, // null = falls back to ADMIN_EMAIL env var
  },
};
