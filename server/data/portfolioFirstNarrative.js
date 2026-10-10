// Default narrative for the Portfolio-First Site Agent (2026-10-01).
//
// Provenance: Betsy's own application package (Strategic Operator resume +
// cover letter, dated 2026-09-30). Wording is carried verbatim wherever
// possible — her voice, not a rewrite — with the employer-specific "Why
// <company>" material removed so the site reads as a general career
// foundation profile, not one application.
//
// This is a STARTING POINT the agent UI pre-fills and Betsy edits before
// staging; it is never written anywhere on its own. Proof claims carry an
// `evidence` matcher (employer + terms) that the public foundationProofLedger
// block resolves live against Career Master — a claim with no matching row
// renders as "not yet linked", never as verified.
//
// Every scoped caveat from the package's Notes & Methodology (Vista scope,
// client-financials sourcing, "design and prototype, not a live product")
// is carried into `context`/`status` on purpose: the public site must say
// what the resume's footnotes say.

export const PORTFOLIO_FIRST_NARRATIVE_SOURCE = {
  label: 'Application package — resume, cover letter, and notes (2026-09-30)',
  carriedVerbatim: true,
};

export function defaultPortfolioFirstNarrative() {
  return {
    hero: {
      eyebrow: 'Martha (Betsy) Salter · Strategic Operator',
      heading: "Hiring me is hiring for the blindspot your organization doesn't know it has.",
      lede: 'Strategic Operator | C-Suite Partner | Private Capital Value Creation | Business Architecture. I span Sales, Finance, and IT, tie unit economics so pipeline reconciles to accounting, and show the confidence behind the numbers, surfacing risk before it becomes an issue or added expense.',
      cta1Label: 'See the proof',
      cta2Label: 'Request references',
    },
    proofIntro: {
      eyebrow: 'Portfolio outcomes',
      heading: 'Proof first, then the story',
      intro: 'Each figure below opens to the Career Master record behind it. If a claim is not linked to a record yet, it says so.',
    },
    proofs: [
      {
        value: '$500M+',
        label: 'recurring revenue on automated renewals',
        context: 'Vista Equity Partners: CPQ/CLM architecture and migration methodology. Operational contribution within a broader Vista team; not deal execution or investment decisions.',
        evidenceEmployer: 'Vista',
        evidenceTerms: ['500M'],
      },
      {
        value: '2M+',
        label: 'SKUs rationalized into one variable pricing engine',
        context: 'Accenture, global education publisher program: 8-tab, 200+ formula variable pricing engine.',
        evidenceEmployer: 'Accenture',
        evidenceTerms: ['2M'],
      },
    ],
    builds: {
      eyebrow: 'Owner-first builds · 2025 – Present',
      heading: 'Self-directed product portfolio',
      intro: 'Mechanics for turning multi-source, physical and financial events into decisions. These are solo-built diagnostic and reporting tools, not enterprise-scale or production-validated systems.',
      products: [
        {
          id: 'q2r-diagnostics',
          tagline: 'Q2R Diagnostics',
          name: 'Pipeline-to-accounting reconciliation',
          desc: 'An eight-scenario revenue-leakage library that traces price movement to value-creation initiatives, with the reconciliation confidence shown alongside the number.',
          outputs: 'Revenue leakage, Reconciliation confidence, Value creation',
          status: 'Solo-built diagnostic',
        },
        {
          id: 'underutilized-asset-pipeline',
          tagline: 'Underutilized Asset Pipeline',
          name: 'Distressed mortgage and real estate scoring',
          desc: 'The same data-reconciliation mechanics applied to distressed mortgages and real estate, from public-record inputs.',
          outputs: 'Public-record inputs, Asset scoring',
          status: 'Solo-built diagnostic',
        },
        {
          id: 'card-payment-routing',
          tagline: 'Card Payment Routing · SaltTide CHI',
          name: 'Credit health infrastructure',
          desc: 'Before a purchase clears, a routing engine checks available-credit buffers, spend velocity, merchant-category restrictions, and issuer-freeze signals, then sends the transaction to the card that will clear and serve the cardholder best. One rule is fixed: partner revenue is never a routing input.',
          outputs: 'Decline prevention, Account health, Rewards protection',
          status: 'Design and prototype; not a live product',
        },
        {
          id: 'output-governance',
          tagline: 'Output Governance',
          name: 'Human-in-the-loop publishing',
          desc: 'Recommendations tested against repeatable processes with human-in-the-loop approval before anything publishes.',
          outputs: 'Repeatable process, Human approval',
          status: 'Solo-built workflow',
        },
      ],
    },
    lenses: {
      eyebrow: 'How I operate',
      heading: 'Owner first',
      tabs: [
        {
          tabLabel: 'Owner first',
          kicker: 'How I operate',
          title: 'Owning whether the outcome actually materializes',
          copy: "Owner first is how I operate: owning whether the outcome actually materializes, not just my own workstream's piece of it. Prioritization usually fails when everything needs fixing to reach one goal, but each team keeps moving against its own measure. I'll give up some upfront speed for coordinated progress that can actually scale, while still recognizing when time loss isn't an option and urgency has to set the sequence.",
        },
        {
          tabLabel: 'Questions I bring',
          kicker: 'In the door',
          title: 'The questions I ask first',
          copy: 'Where is private capital being allocated, and does it map to the highest-value constraint? Where is the biggest customer or product pain, and has it been sized by frequency, volume, and dollars, including downstream dependencies? Which problems need a targeted feature now, versus a change to the data model, integrations, contracts, or process underneath it? What has to move together across Product, Engineering, Finance, Sales, and Operations, toward one measured outcome, not five separate ones?',
        },
        {
          tabLabel: 'In my own words',
          kicker: 'Where I work',
          title: 'Most problems are not isolated',
          copy: "What I've learned is that most problems aren't isolated. And most opportunities take a backseat to the problems. Most sit somewhere between financial logic, systems, and go-to-market timeline pressures. That's the space I operate in: connecting those pieces in a way that turns complexity into clarity and ideas into results, without compromising quality, ethics, or consumer perception.",
        },
        {
          tabLabel: 'Full transparency',
          kicker: 'On AI',
          title: 'Yes, I use AI',
          copy: "Not because I couldn't do the work myself, but because I know how to use the tools available to me to be more effective. My technical depth is business architecture, financial and data models, and integration design beneath analytics. I do not claim hands-on data science, BI engineering, or production ML.",
        },
      ],
    },
    timeline: {
      eyebrow: 'Career foundation',
      heading: 'Professional experience',
      intro: 'Read live from the Career Master. Click any milestone to read the work.',
      educationLine: 'College of Charleston — B.S. Accounting, 2013',
    },
    cases: {
      eyebrow: 'Selected engagements',
      heading: 'Case studies',
      intro: 'Context to impact for each engagement. Client names stay confidential.',
    },
    skills: {
      eyebrow: 'Capabilities',
      heading: 'Capabilities and proficiency',
      intro: 'Grouped from the Career Master skills inventory, with years and engagement counts behind each.',
    },
    industries: {
      eyebrow: 'Industries',
      heading: 'Where the work has run',
      intro: 'Industries and platforms across employers and client engagements.',
    },
    references: {
      eyebrow: 'Validate the work',
      heading: 'Request to contact my references',
      intro: "References include former partners and clients from Slalom, PwC, Vista Equity, and Accenture. I protect their time — references are released after a brief context check. Tell me who you are and what perspective you'd like to hear.",
    },
    contact: {
      eyebrow: 'Contact',
      heading: "Let's talk",
      intro: "I'm looking for a role where I can partner closely with leadership and actually move things forward, not just recommend ideas, but work through what it takes to make them real.",
      location: 'St. Petersburg, Florida · Remote',
    },
    seo: {
      title: 'Martha (Betsy) Salter — Strategic Operator | Salt Basin Net Works',
      description: 'Strategic Operator and C-Suite partner: Quote-to-Revenue architecture, multi-party contracts, and ARR and retention reporting. Career portfolio read live from the Career Master.',
    },
  };
}
