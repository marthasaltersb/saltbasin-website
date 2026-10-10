// Portfolio-First homepage blueprint (2026-10-01) — the ordered section
// composition the Portfolio-First Site Agent proposes. Each entry maps to an
// existing REGISTRY block type (src/components/blocks/index.jsx); this file
// only decides order, which fields each block gets from the narrative, and
// whether the owner's Career Master can support it. Sections that read
// Career Master live (timeline, caseStudies, skills, industryWheel,
// foundationProofLedger) carry presentational fields only — their content
// comes from the foundation at render time, so the site stays current
// without re-running the agent.
//
// Section ids are stable ("pf-*") so re-staging replaces rather than
// duplicates, and the editor's per-section state survives a re-run.

// Block types whose rendered content comes from Career Master at render time.
export const CAREER_DRIVEN_TYPES = new Set([
  'timeline', 'caseStudies', 'skills', 'industryWheel', 'clientSnapshot',
  'careerExplorer', 'careerRollupShowcase', 'foundationProofLedger',
]);

// Block types that pitch a product/platform rather than the person.
export const PRODUCT_LEAD_TYPES = new Set([
  'productHero', 'productCatalog', 'rotatingHighlights', 'buildFlow', 'journeyRods',
  'exposureCalculator', 'apiCatalogTable', 'startEngagement', 'platformCadence',
  'conversationalDemo', 'appMockup', 'netWorksBanner', 'joinNetwork', 'forCompanies',
]);

// Block types that lead with the person.
export const PERSON_LEAD_TYPES = new Set(['careerHeroOrbit', 'about', 'aboutIntro']);

const always = () => true;

function heroBadges(foundation) {
  const c = foundation?.counts || {};
  const badges = [];
  if (foundation?.yearsSpan) badges.push(`${foundation.yearsSpan} years`);
  if (c.employers) badges.push(`${c.employers} employers`);
  if (c.engagements) badges.push(`${c.engagements} engagements`);
  if (c.industries) badges.push(`${c.industries} industries`);
  return badges.map((label) => ({ label }));
}

export const PORTFOLIO_FIRST_BLUEPRINT = [
  {
    id: 'pf-hero', type: 'careerHeroOrbit', name: 'Career Foundation Hero', bg: 'cream', defaultOn: true,
    purpose: 'Leads with you: name, positioning, and live Career Master counts.',
    supported: always,
    fields: (n, f) => ({
      eyebrow: n.hero.eyebrow,
      heading: n.hero.heading,
      lede: n.hero.lede,
      statBadges: heroBadges(f),
      cta1Label: n.hero.cta1Label, cta1Link: '#pf-proof',
      cta2Label: n.hero.cta2Label, cta2Link: '#pf-references',
    }),
  },
  {
    id: 'pf-proof', type: 'foundationProofLedger', name: 'Proof Ledger', bg: 'navy', defaultOn: true,
    purpose: 'Headline outcomes, each opening to the Career Master record behind it.',
    supported: always,
    fields: (n) => ({ ...n.proofIntro, proofs: n.proofs }),
  },
  {
    id: 'pf-timeline', type: 'timeline', name: 'Career Foundation Timeline', bg: 'ivory', defaultOn: true,
    purpose: 'Employers and roles, read live from Career Master jobs.',
    supported: (f) => (f?.counts?.jobs || 0) > 0,
    unsupportedReason: 'Add jobs in Career Master first.',
    fields: (n) => ({ ...n.timeline }),
  },
  {
    id: 'pf-cases', type: 'caseStudies', name: 'Case Studies', bg: 'navy', defaultOn: true,
    purpose: 'Engagements marked "publish as case study", read live.',
    supported: (f) => (f?.counts?.engagements || 0) > 0,
    unsupportedReason: 'Mark at least one engagement "publish as case study" in Career Master.',
    fields: (n) => ({ ...n.cases }),
  },
  {
    id: 'pf-builds', type: 'productCatalog', name: 'Owner-First Builds', bg: 'linen', defaultOn: true,
    purpose: 'Your self-directed products, each with its honest build status.',
    supported: always,
    fields: (n) => ({
      eyebrow: n.builds.eyebrow, heading: n.builds.heading, intro: n.builds.intro,
      // productCatalog renders `priceLabel` as the card's status chip.
      products: (n.builds.products || []).map((p) => ({ id: p.id, tagline: p.tagline, name: p.name, desc: p.desc, outputs: p.outputs, priceLabel: p.status })),
    }),
  },
  {
    id: 'pf-capabilities', type: 'skills', name: 'Capabilities', bg: 'ivory', defaultOn: true,
    purpose: 'Skills grouped by category with proficiency, read live.',
    supported: (f) => (f?.counts?.skills || 0) > 0,
    unsupportedReason: 'Add skills in Career Master first.',
    fields: (n) => ({ ...n.skills }),
  },
  {
    id: 'pf-industries', type: 'industryWheel', name: 'Industries', bg: 'linen', defaultOn: false,
    purpose: 'Industry wheel from Career Master industry domains and tools.',
    supported: (f) => (f?.counts?.industries || 0) > 0,
    unsupportedReason: 'Add industry domains in Career Master first.',
    fields: (n) => ({ ...n.industries }),
  },
  {
    id: 'pf-operate', type: 'careerLensTabs', name: 'How I Operate', bg: 'linen', defaultOn: true,
    purpose: 'Owner-first operating model, questions you bring, and your own words.',
    supported: always,
    fields: (n) => ({ eyebrow: n.lenses.eyebrow, heading: n.lenses.heading, lensTabs: n.lenses.tabs }),
  },
  {
    id: 'pf-references', type: 'referencesRequest', name: 'References', bg: 'cream', defaultOn: true,
    purpose: 'Visitors request references; you release them after a context check.',
    supported: always,
    fields: (n) => ({ ...n.references }),
  },
  {
    id: 'pf-contact', type: 'contact', name: 'Contact', bg: 'linen', defaultOn: true,
    purpose: 'Contact form.',
    supported: always,
    fields: (n) => ({ ...n.contact }),
  },
];
