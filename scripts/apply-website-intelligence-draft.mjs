import 'dotenv/config';
import { createHash } from 'node:crypto';

const base = process.env.APP_BASE_URL?.includes('localhost') ? process.env.APP_BASE_URL : 'http://127.0.0.1:3001';

async function json(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path}: ${response.status} ${body.error || ''}`.trim());
  return { response, body };
}

function pagesByKey(site) {
  if (Array.isArray(site.pages)) return Object.fromEntries(site.pages.map((page) => [page.key || page.slug || 'home', page]));
  return structuredClone(site.pages || {});
}

function hash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function hero(id, eyebrow, heading, subtitle) {
  return { id, type: 'hero', name: 'Hero', status: 'live', bg: 'navy', fields: { eyebrow, heading, subtitle } };
}

function composeProposal(published) {
  const pages = pagesByKey(published);
  const home = pages.home;
  const resources = pages.resources;
  if (!home || !resources) throw new Error('Expected published home and resources pages');
  const homeSections = Object.fromEntries((home.sections || []).map((section) => [section.id, section]));
  const resourceSections = Object.fromEntries((resources.sections || []).map((section) => [section.id, section]));
  const marketingHooks = structuredClone(homeSections['home-marketing-hooks']);
  const comparisonSteps = {
    networks: [
      ['Start with an enterprise operating model and ask people to conform to it.', 'Begin with the person, customer, or member context, then preserve the structure needed for enterprise governance.', 'The framework is consumer-first while remaining configurable for enterprise authority, evidence, and scale.'],
      ['Separate customer experience from operational-system design.', 'Connect customer, member, revenue, and source-system context inside one Salt Basin Net Work.', 'The public experience and the enterprise operating model share governed definitions instead of becoming parallel stories.'],
      ['Deliver a transformation program with a defined end date.', 'Maintain the configured Net Work as evidence, definitions, and operating conditions change.', 'Institutional context can compound rather than being rediscovered at the start of each engagement.'],
    ],
    mrs: [
      ['Interview stakeholders and document a point-in-time systems map.', 'Read the configured systems map and operating evidence as one enterprise context.', 'The output remains connected to source definitions and can be refreshed as the operating system changes.'],
      ['Assess functions in separate workstreams and reconcile findings in a presentation.', 'Score revenue, customer, member, and data handoffs together.', 'Cross-functional dependencies are evaluated as one governed operating model instead of separate observations.'],
      ['Deliver a target-state diagram and implementation roadmap.', 'Render the client-specific Salt Basin Net Work as a configurable system.', 'The model is designed to become maintained configuration, not a static recommendation artifact.'],
      ['Close the engagement after recommendations and handoff.', 'Maintain the measured operating model and update it as evidence changes.', 'The work compounds into a living institutional record rather than resetting with the next project.'],
    ],
    hos: [
      ['Document current-state processes and recommend a target state.', 'Trace the executed contract through pipeline, contracting, metering, billing, recognition, disputes, and reporting.', 'HOS treats handoffs and evidence lineage as part of the operating methodology, not supporting documentation.'],
      ['Score maturity in a standalone assessment.', 'Use RLMM and the Salter Momentum spine to diagnose the revenue lifecycle before MRS builds.', 'The diagnostic is connected to the methodology and the resulting configuration rather than ending as a score.'],
      ['Hand the roadmap to a separate implementation team.', 'Carry approved definitions and evidence into the MRS build and maintained Salt Basin Net Work.', 'The transition from diagnosis to build preserves context and reduces re-discovery.'],
    ],
    mesa: [
      ['Run discovery and summarize the operating gap.', 'Diagnose the gap against the same products and methods Salt Basin operates.', 'Advisory recommendations are grounded in an operating architecture with reusable configuration.'],
      ['Benchmark maturity using a fixed assessment workbook.', 'Map capabilities, evidence, and maturity against the organization’s configured context.', 'The diagnostic can preserve institutional definitions instead of forcing every client into one static benchmark.'],
      ['Produce a scope and roadmap for a separate delivery team.', 'Translate the diagnosis into a signed-off, configuration-ready plan of record.', 'The recommendation is structured for direct continuation into build and maintenance.'],
    ],
    rlmm: [
      ['Apply a generic revenue-operations maturity checklist.', 'Score the actual revenue lifecycle against the Salter Momentum spine and configured HOS dimensions.', 'Maturity is evaluated in the client’s operating context, with assumptions and evidence visible.'],
      ['Compare scores to a benchmark and issue a findings deck.', 'Identify the highest-leverage gap and its dependencies across the lifecycle.', 'Prioritization includes the handoffs and semantic dependencies that can make an isolated fix fail.'],
      ['Recommend a transformation roadmap.', 'Produce a prioritized build sequence that can feed Salt Basin MRS configuration.', 'The diagnostic becomes an executable input to the maintained operating environment.'],
    ],
  };
  if (marketingHooks?.fields) marketingHooks.fields.hooks = [
    { id: 'networks', productLabel: 'Salt Basin Net Works', hookLine: 'Consumer-first context. Enterprise-adoptable governance.', teaser: 'A framework for carrying human, customer, member, revenue, and source-system context into a governed operating model without losing the person at the center.', metricValue: '16', metricLabel: 'Documented client and operating environments informing the framework', ctaLabel: 'Start with BestyStaff', ctaLink: '#bestystaff' },
    { id: 'mrs', productLabel: 'Salt Basin MRS', hookLine: 'Operating intelligence gathered in the field, designed into the system.', teaser: 'Measurement Rendering Systems applies the HOS methodology to design, build, and maintain a client-specific Enterprise Ecosystem—a Salt Basin Net Work. Its operating intelligence draws on 24 documented engagements and build cases across 16 distinct client and operating environments, from early-stage product builds through $500M+ ARR automation.', metricValue: '$500M+', metricLabel: 'Recurring revenue automation represented in Career Master evidence', ctaLabel: 'Explore the Platform', ctaLink: '/platform' },
    { id: 'hos', productLabel: 'Salt Basin HOS™', hookLine: 'The governed methodology behind the build.', teaser: 'HOS is the methodology Salt Basin MRS operationalizes: a Quote-to-Revenue intelligence model connecting executed-contract truth, operational evidence, Channel Rods, and approval-aware handoffs.', metricValue: '29', metricLabel: 'Documented leakage scenarios across six categories; benchmarks require source validation', ctaLabel: 'Explore the Methodology', ctaLink: '/methodology' },
    { id: 'mesa', productLabel: 'MES Agencies (MESA)', hookLine: 'Advisory and delivery grounded in what Salt Basin operates.', teaser: 'MESA is the advisory, diagnostic, and delivery layer—bringing founder-led operating experience into scoped client work without presenting planned holding-company structure as filed legal status.', metricValue: '$60M+', metricLabel: 'Largest documented program-rescue environment', ctaLabel: 'Explore Advisory', ctaLink: '/consulting' },
  ].map((hook) => ({ ...hook, simComparisons: (comparisonSteps[hook.id] || []).map(([traditional, mrs, differentiated]) => ({ traditional, mrs, differentiated })) }));

  const founderSection = {
    id: 'home-founder', type: 'aboutIntro', name: 'Founder Experience', status: 'live', bg: 'navy',
    fields: {
      introEyebrow: 'Founder-built operating intelligence',
      introHeading: 'The system was designed from the work—not around a template.',
      introBody: 'Salt Basin MRS carries operating intelligence Betsy Salter gathered across 24 documented engagements and build cases in 16 distinct client and operating environments. The Career Master record spans nonprofit technology, global publishing, consumer goods, private-equity software portfolios, healthcare, manufacturing, and enterprise SaaS—from early-stage AI-native builds through work supporting $500M+ recurring-revenue automation.',
      founderEyebrow: 'Founder', founderName: 'Betsy Salter', founderTitle: 'Strategic Operator · Founder, Salt Basin Net Works',
      founderBlurb: 'Betsy has 12+ years of enterprise consulting and operating experience across Blackbaud, Accenture, Vista Equity Partners, TIBCO, PwC, Slalom, Streamforce Consulting, and Salt Basin Net Works. Her work connects commercial design, CPQ/CLM, billing, data, revenue operations, and executive decision context.',
      howIWork: 'Understand the operating reality, render the dependencies, build the configured system, and preserve the evidence so the organization does not have to start over.',
      cta1: 'View Founder Experience', cta1Link: '/consulting', cta2: 'Ask BestyStaff', cta2Link: '#bestystaff',
    },
  };
  const founderStats = {
    id: 'home-founder-highlights', type: 'statGrid', name: 'Founder Highlights', status: 'live', bg: 'navy',
    fields: { eyebrow: 'Career Master evidence', heading: 'Experience measured by the operating outcomes.', intro: 'These figures come from the Career Master record. Transaction outcomes describe environments Betsy supported and do not claim she was the investor, broker, or transaction owner.', stats: [
      { value: '12+', label: 'Years of experience', sublabel: 'Enterprise consulting and operating work' },
      { value: '24', label: 'Documented cases', sublabel: 'Engagements and product/build cases' },
      { value: '16', label: 'Operating environments', sublabel: 'Distinct clients and employer-operated environments' },
      { value: '$500M+', label: 'ARR automated', sublabel: 'Recurring-revenue automation represented in Career Master' },
      { value: '$50M+', label: 'Follow-on win', sublabel: 'Documented multi-year implementation outcome' },
      { value: '2M+', label: 'Products rationalized', sublabel: 'ISBN-scale pricing and product-catalog environment' },
    ] },
  };
  const startEngagement = structuredClone(homeSections['home-start-engagement']);
  if (startEngagement?.fields?.engageProducts) {
    startEngagement.fields.engageProducts = startEngagement.fields.engageProducts.filter((product) => product.id !== 'salttide');
  }
  const channelRods = structuredClone(homeSections['home-journeys']);
  if (channelRods?.fields) {
    channelRods.name = 'Converging Channel Rods';
    channelRods.fields.eyebrow = 'Converging Channel Rods';
    channelRods.fields.heading = 'Member, Customer, and Revenue truth form as evidence arrives.';
    channelRods.fields.intro = 'The rods do not appear together by default. This external-intake path begins with a Member identity, creates Customer and Revenue Lifecycle rods only when qualifying metadata exists, and advances each rod through its own interdependent Channel Stage.';
    channelRods.fields.rods = [
      { key: 'member', label: 'Member Channel Rod', color: 'var(--sbh-mauve)', increment: 14 },
      { key: 'customer', label: 'Customer Channel Rod', color: 'var(--sbh-teal)', increment: 13 },
      { key: 'revenue', label: 'Revenue Lifecycle Rod', color: 'var(--sbh-gold)', increment: 12 },
    ];
    channelRods.fields.channelEvents = [
      { id: 'identity', label: 'Identity signal observed', evidence: 'A visitor begins an intake and supplies a permissioned identity signal.', createsRod: 'member', affects: ['member'], stage: 'Identity Observed' },
      { id: 'intent', label: 'Intent and need captured', evidence: 'BestyStaff collects the visitor’s stated need and desired outcome.', affects: ['member'], stage: 'Context Enrichment' },
      { id: 'org', label: 'Organization relationship resolved', evidence: 'Work context and buyer or influencer capacity establish a governed organization relationship.', createsRod: 'customer', affects: ['member', 'customer'], stage: 'Organization Qualified' },
      { id: 'scenario', label: 'Operating scenario compiled', evidence: 'Selected exceptions and numeric context create evidence-backed scenario hypotheses.', affects: ['member', 'customer'], stage: 'Scenario Defined' },
      { id: 'commercial', label: 'Commercial pathway identified', evidence: 'A service, diagnostic, or platform pathway becomes specific enough to track commercially.', createsRod: 'revenue', affects: ['member', 'customer', 'revenue'], stage: 'Commercial Qualification' },
      { id: 'scope', label: 'MRS scope aligned', evidence: 'The desired outcome, evidence requirements, and delivery boundary align across all three rods.', affects: ['member', 'customer', 'revenue'], stage: 'Scope Alignment' },
      { id: 'confluence', label: 'Cross-rod confluence established', evidence: 'Member intent, Customer operating context, and Revenue pathway converge without collapsing their separate identities.', affects: ['member', 'customer', 'revenue'], stage: 'Confluence Ready' },
    ];
  }

  const proposedPages = {
    home: {
      ...home,
      order: 0,
      seo: {
        title: 'Salt Basin | Enterprise Ecosystems Measured and Rendered',
        description: 'Salt Basin MRS applies the HOS methodology to design, build, and maintain client-specific enterprise ecosystems called Salt Basin Net Works.',
        canonicalPath: '/',
      },
      sections: [
        homeSections['home-hero'],
        marketingHooks,
        founderSection,
        founderStats,
        homeSections['home-build-flow'],
        homeSections['home-exposure-calculator'],
        channelRods,
        homeSections['home-conversation'],
        startEngagement,
      ].filter(Boolean),
    },
    platform: {
      key: 'platform', name: 'Solutions & Services', navLabel: 'Solutions & Services', slug: 'platform', type: 'standard', status: 'live', order: 1,
      seo: {
        title: 'Salt Basin Platform | Measurement Rendering Systems',
        description: 'Explore how Salt Basin MRS connects enterprise systems, measures operating signals, and renders governed enterprise intelligence.',
        canonicalPath: '/platform',
      },
      sections: [
        hero('platform-hero', 'Salt Basin MRS', 'Measure the enterprise. Render the system.', 'A configuration-driven operating environment designed to connect source systems, preserve evidence, and render a governed view of the enterprise.'),
        homeSections['home-metadata-model'],
        homeSections['home-apis'],
        homeSections['home-platform-cadence'],
      ].filter(Boolean),
    },
    methodology: {
      key: 'methodology', name: 'Methodology', navParent: 'resources', slug: 'methodology', type: 'standard', status: 'live', order: 2,
      seo: {
        title: 'HOS Methodology | Salt Basin',
        description: 'See how the HOS methodology, RLMM diagnostic, Salter Momentum, and Channel Rod model work together.',
        canonicalPath: '/methodology',
      },
      sections: [
        hero('methodology-hero', 'HOS™ Methodology', 'A governed path from understanding to a maintained operating model.', 'HOS is the methodology Salt Basin MRS operationalizes. It connects diagnostic evidence, semantic structure, Channel Rods, and human approval into a configurable system.'),
        homeSections['home-method'],
        resourceSections['res-ip-stack'],
        resourceSections['res-methodology-math'],
      ].filter(Boolean),
    },
    consulting: { ...pages.consulting, navLabel: 'Consulting Services', navParent: 'platform', order: 3 },
    resources: {
      ...resources, order: 4,
      seo: {
        title: 'Resources | Salt Basin',
        description: 'Reference material for Salt Basin terminology, brands, products, and enterprise operating concepts.',
        canonicalPath: '/resources',
      },
      sections: [resourceSections['res-hero'], resourceSections['res-acronyms']].filter(Boolean),
    },
    creative: { ...pages.creative, status: 'draft', hideFromNav: true, order: 5 },
  };

  const proposedHero = proposedPages.home?.sections?.find((section) => section.id === 'home-hero');
  if (proposedHero?.fields) proposedHero.fields.cta1Label = "See what we're building";

  Object.values(proposedPages).forEach((page) => {
    page.sections = (page.sections || []).map((section) => ({
      ...section,
      navSubPage: section.hideFromNav ? false : section.status !== 'draft' && section.status !== 'placeholder',
      navLabel: section.navLabel || section.name || section.fields?.heading,
    }));
  });

  return { ...published, version: Number(published.version || 0) + 1, pages: proposedPages };
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_INITIAL_PASSWORD;
if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD are required');

const login = await json('/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
});
const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
if (!cookie) throw new Error('Login did not return a session cookie');

const { body: published } = await json('/api/site/published');
const { body: previousDraft } = await json('/api/site/draft', { headers: { Cookie: cookie } });
const proposed = composeProposal(published);

await json('/api/site/draft', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Cookie: cookie },
  body: JSON.stringify(proposed),
});

const changeset = {
  changeset_id: `website-intelligence-${Date.now()}`,
  scope: 'DRAFT_SITE',
  from_configuration_version: published.version || null,
  to_configuration_version: proposed.version,
  from_hash: hash(published),
  previous_draft_hash: hash(previousDraft),
  to_hash: hash(proposed),
  pages_created: ['platform', 'methodology'],
  pages_updated: ['home', 'resources', 'consulting', 'creative'],
  pages_removed: [],
  sections_moved: ['home-metadata-model', 'home-apis', 'home-exposure-calculator', 'home-platform-cadence', 'home-method', 'res-ip-stack', 'res-methodology-math'],
  sections_archived_from_proposal: ['home-products'],
  seo_changes: ['home', 'platform', 'methodology', 'resources'],
  publication_status: 'DRAFT_ONLY',
  reversible_from: 'site_state:published',
};

console.log(JSON.stringify(changeset, null, 2));
