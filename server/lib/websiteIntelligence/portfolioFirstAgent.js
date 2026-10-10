// Portfolio-First Site Agent (2026-10-01) — Website Intelligence engine.
//
// Reviews the current site_state, reads the owner's Career Master
// foundation, and composes a portfolio-first homepage as real site_state
// configuration built only from REGISTRY block types (most of which already
// read Career Master live: timeline, caseStudies, skills, industryWheel).
//
// Governance (per the website-intelligence skill's non-negotiables):
//   - Output is configuration, never JSX. The agent never writes a published
//     row: the route stages a DRAFT; Betsy publishes through the existing
//     PublishBar.
//   - Nothing is deleted. The previous homepage is preserved verbatim as a
//     draft, nav-hidden archive page; other pages are only hidden from the
//     nav (still routable), never removed or status-changed.
//   - No composite "website score". Each review metric answers one named
//     question (see REVIEW_QUESTIONS).
//   - Pure functions only in this file (no DB) so compose/diff is testable
//     and the dry-run preview and the staged draft are the same computation.

import { PORTFOLIO_FIRST_BLUEPRINT, CAREER_DRIVEN_TYPES, PRODUCT_LEAD_TYPES, PERSON_LEAD_TYPES } from './portfolioFirstBlueprint.js';
import { findCareerEvidence } from '../careerEvidenceMatch.js';

export const AGENT_KEY = 'portfolio_first_site_agent';
export const AGENT_VERSION = 1;

// ── page-shape helpers (pages is a keyed object in live data; tolerate arrays) ──
function pageEntries(pages) {
  if (Array.isArray(pages)) return pages.map((p, i) => [p.key || String(i), p]);
  if (pages && typeof pages === 'object') return Object.entries(pages);
  return [];
}

function findHome(site) {
  const entries = pageEntries(site?.pages);
  return entries.find(([, p]) => (p.slug || '') === '') || entries.find(([k]) => k === 'home') || null;
}

const isLive = (s) => s && s.status !== 'draft' && s.status !== 'placeholder';

// ── Step 1: review ────────────────────────────────────────────────────────
export const REVIEW_QUESTIONS = {
  leadKind: 'What does the first live homepage section lead with: the person, a product, or something else?',
  careerShare: 'Of the live homepage sections, how many render from the Career Master?',
  proofBeforeProduct: 'Does Career-Master-backed proof appear before the first product pitch on the homepage?',
  navPages: 'Which pages does a first-time visitor see in the navigation?',
};

export function reviewCurrentSite(site) {
  const home = findHome(site);
  const homeSections = (home?.[1]?.sections || []).filter(isLive);
  const first = homeSections[0];
  const leadKind = !first ? 'empty'
    : PERSON_LEAD_TYPES.has(first.type) ? 'person'
    : PRODUCT_LEAD_TYPES.has(first.type) ? 'product'
    : 'other';
  const careerSections = homeSections.filter((s) => CAREER_DRIVEN_TYPES.has(s.type));
  const firstCareerIdx = homeSections.findIndex((s) => CAREER_DRIVEN_TYPES.has(s.type));
  const firstProductIdx = homeSections.findIndex((s) => PRODUCT_LEAD_TYPES.has(s.type));
  const navPages = pageEntries(site?.pages)
    .filter(([, p]) => p.status !== 'draft' && !p.hideFromNav)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
    .map(([key, p]) => ({ key, name: p.navLabel || p.name || key, slug: p.slug || '' }));

  const findings = [];
  if (leadKind !== 'person') {
    findings.push(`The homepage opens with a ${first ? `"${first.name || first.type}" (${first.type})` : 'blank'} section, not with you. A portfolio-first site leads with the person and the proof.`);
  }
  if (careerSections.length === 0) {
    findings.push('No live homepage section reads from your Career Master, so the homepage cannot stay current as your career data changes.');
  } else {
    findings.push(`${careerSections.length} of ${homeSections.length} live homepage sections read from your Career Master (${careerSections.map((s) => s.type).join(', ')}).`);
  }
  if (firstProductIdx !== -1 && (firstCareerIdx === -1 || firstProductIdx < firstCareerIdx)) {
    findings.push('A product pitch appears before any Career-Master-backed proof.');
  }
  if (home?.[1]?.composedBy?.agent === AGENT_KEY) {
    findings.push(`This homepage was already composed by this agent (v${home[1].composedBy.version}, ${new Date(home[1].composedBy.at).toISOString().slice(0, 10)}). Re-staging replaces it without creating another archive.`);
  }

  return {
    questions: REVIEW_QUESTIONS,
    homeKey: home?.[0] || null,
    homeSectionCount: homeSections.length,
    homeSections: homeSections.map((s) => ({ id: s.id, type: s.type, name: s.name || s.type, careerDriven: CAREER_DRIVEN_TYPES.has(s.type) })),
    leadKind,
    careerShare: { careerDriven: careerSections.length, live: homeSections.length },
    proofBeforeProduct: firstProductIdx === -1 ? null : (firstCareerIdx !== -1 && firstCareerIdx < firstProductIdx),
    navPages,
    findings,
  };
}

// ── Step 2: foundation summary (counts only; never salary) ─────────────────
function yearOf(value) {
  const m = String(value || '').match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

export function summarizeFoundation(master, now = new Date()) {
  const jobs = master?.jobs || [];
  const engagements = master?.engagements || [];
  const skills = master?.skills || [];
  const domains = master?.domains || [];
  const years = jobs.map((j) => yearOf(j.startDate)).filter(Boolean);
  const earliest = years.length ? Math.min(...years) : null;
  const employers = [...new Set(jobs.map((j) => (j.company || '').replace(/,?\s*(Inc\.?|LLC)$/i, '').trim()).filter(Boolean))];
  const industries = domains.filter((d) => d.groupType === 'industry');
  const tierCounts = skills.reduce((acc, s) => { acc[s.tier || 'Unrated'] = (acc[s.tier || 'Unrated'] || 0) + 1; return acc; }, {});

  const gaps = [];
  if (!jobs.length) gaps.push('No jobs in Career Master: the timeline section will be empty.');
  if (!engagements.length) gaps.push('No engagements marked "publish as case study": the case studies section will be skipped.');
  if (!skills.length) gaps.push('No skills in Career Master: the capabilities section will be skipped.');
  if (!industries.length) gaps.push('No industry domains in Career Master: the industries section will be skipped.');

  return {
    yearsSpan: earliest ? now.getFullYear() - earliest : null,
    firstYear: earliest,
    employers,
    counts: {
      jobs: jobs.length,
      employers: employers.length,
      engagements: engagements.length,
      skills: skills.length,
      industries: industries.length,
      certifications: (master?.certifications || []).length,
    },
    skillTiers: tierCounts,
    gaps,
  };
}

// Resolves each proof against Career Master with the same matcher the public
// block uses, so the preview shows exactly what visitors will see.
export function verifyProofs(master, proofs = []) {
  return proofs.map((p) => {
    const evidence = findCareerEvidence(master, { employer: p.evidenceEmployer, terms: p.evidenceTerms, figure: p.value });
    return { ...p, verified: evidence.length > 0, evidenceCount: evidence.length };
  });
}

// ── Step 3: compose ───────────────────────────────────────────────────────
function slugDate(now) {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * Builds the proposed site_state. Pure: returns { site, diff }.
 * @param site        current draft site_state
 * @param options.narrative           edited narrative (see defaultPortfolioFirstNarrative)
 * @param options.foundation          summarizeFoundation() output
 * @param options.enabledSectionIds   blueprint ids to include (default: blueprint defaults that the foundation supports)
 * @param options.navKeepPageKeys     non-home page keys that stay visible in nav
 * @param options.now                 ms timestamp
 */
export function composePortfolioFirstSite(site, { narrative, foundation, enabledSectionIds, navKeepPageKeys = [], now = Date.now() }) {
  const base = JSON.parse(JSON.stringify(site || { version: 3, pages: {} }));
  const pagesIsArray = Array.isArray(base.pages);
  const entries = pageEntries(base.pages);
  const homeEntry = findHome(base);
  const homeKey = homeEntry?.[0] || 'home';
  const oldHome = homeEntry?.[1] || { key: 'home', name: 'Home', slug: '', type: 'landing', status: 'live', order: 0, sections: [] };

  const enabled = new Set(enabledSectionIds || defaultEnabledSectionIds(foundation));
  const sections = PORTFOLIO_FIRST_BLUEPRINT
    .filter((b) => enabled.has(b.id) && b.supported(foundation))
    .map((b) => ({ id: b.id, type: b.type, name: b.name, status: 'live', bg: b.bg, fields: b.fields(narrative, foundation) }));

  const alreadyComposed = oldHome.composedBy?.agent === AGENT_KEY;
  const archiveKey = alreadyComposed ? null : `home-archive-${slugDate(now)}`;

  const newHome = {
    ...oldHome,
    key: oldHome.key || homeKey,
    name: oldHome.name || 'Home',
    slug: '',
    status: 'live',
    hideFromNav: false,
    seo: { ...(oldHome.seo || {}), title: narrative?.seo?.title || oldHome.seo?.title, description: narrative?.seo?.description || oldHome.seo?.description },
    composedBy: { agent: AGENT_KEY, version: AGENT_VERSION, at: now },
    sections,
  };

  const keep = new Set(navKeepPageKeys);
  const hidden = [];
  const kept = [];
  const nextEntries = entries.map(([key, page]) => {
    if (key === homeKey) return [key, newHome];
    if (page.status === 'draft') return [key, page];
    const show = keep.has(key);
    (show ? kept : hidden).push({ key, name: page.navLabel || page.name || key, slug: page.slug || '' });
    return [key, { ...page, hideFromNav: !show }];
  });
  if (!homeEntry) nextEntries.unshift([homeKey, newHome]);

  if (archiveKey) {
    nextEntries.push([archiveKey, {
      ...oldHome,
      key: archiveKey,
      name: `Archived homepage (${slugDate(now)})`,
      slug: `archive/home-${slugDate(now)}`,
      status: 'draft',
      hideFromNav: true,
      order: 999,
      archivedBy: { agent: AGENT_KEY, version: AGENT_VERSION, at: now, fromKey: homeKey },
    }]);
  }

  base.pages = pagesIsArray ? nextEntries.map(([, p]) => p) : Object.fromEntries(nextEntries);

  const oldIds = new Set((oldHome.sections || []).map((s) => s.id));
  return {
    site: base,
    diff: {
      homeKey,
      sectionsAdded: sections.filter((s) => !oldIds.has(s.id)).map((s) => ({ id: s.id, type: s.type, name: s.name })),
      sectionsReplaced: (oldHome.sections || []).filter(isLive).map((s) => ({ id: s.id, type: s.type, name: s.name || s.type })),
      archivedPage: archiveKey ? { key: archiveKey, slug: `archive/home-${slugDate(now)}` } : null,
      pagesHiddenFromNav: hidden,
      pagesKeptInNav: kept,
    },
  };
}

export function defaultEnabledSectionIds(foundation) {
  return PORTFOLIO_FIRST_BLUEPRINT.filter((b) => b.defaultOn && b.supported(foundation)).map((b) => b.id);
}

export function blueprintCatalog(foundation) {
  return PORTFOLIO_FIRST_BLUEPRINT.map((b) => ({
    id: b.id, type: b.type, name: b.name, purpose: b.purpose,
    readsCareerMaster: CAREER_DRIVEN_TYPES.has(b.type),
    defaultOn: b.defaultOn,
    supported: b.supported(foundation),
    unsupportedReason: b.supported(foundation) ? null : b.unsupportedReason,
  }));
}
