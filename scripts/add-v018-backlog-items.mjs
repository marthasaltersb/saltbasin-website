// v0.17.1 – v0.18 backlog update
//
// Backfills the gap between the v0.17 script and today, then covers today's
// session in full:
//   - v0.17.1: MES trademark corrected to full legal name + descriptor
//   - v0.17.2: v0.17 deploy crash fix (DB migrations isolated from sessions
//     column ALTERs)
//   - v0.17.3: Lead pledge flow (convert-to-member → pledge interest)
//   - v0.18: Home page restructure (paired-column layout), Consulting pages
//     merged into one with a per-section nav-link toggle, PublicNav.jsx made
//     fully data-driven, ExpandableTile dashboard-tile text pattern, three new
//     spec documents (FUNCTIONAL_DESIGN_SPEC / TECHNICAL_DESIGN_SPEC /
//     FUNCTIONAL_TECHNICAL_MAPPING), CHANGELOG.md brought current with a
//     retroactive Contribution Intelligence breakdown.
//
// Idempotent by externalRef. Usage:
//   node scripts/add-v018-backlog-items.mjs
//
// Requires in .env: ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD, optional PUBLIC_BASE_URL.

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASS || !EMAIL) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  return res.headers.get('set-cookie').split(';')[0];
}

async function getBacklog(cookie) {
  const res = await fetch(`${BASE}/api/backlog/`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`getBacklog failed: ${res.status}`);
  return res.json();
}

async function createItem(cookie, payload) {
  const res = await fetch(`${BASE}/api/backlog/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createItem failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const DEPLOYED = {
  kind: 'feature',
  status: 'completed',
  deployedGithub: true, deployedRender: true, deployedNetlify: true,
  deployRelevance: { github: true, render: true, netlify: true },
};

// ── v0.17.1 – v0.17.3 gap-fill ────────────────────────────────────────────────

const GAP_FILL_ITEMS = [
  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17.1 · mes-trademark-full-name',
    title: 'Master Enterprise Solution Best Bets™ — full legal name + corrected descriptor',
    summary: 'Corrected the MES Best Bets™ author/copyright attribution to the full legal name across all IP artifact files, and refined the parentBrandDescriptor wording.',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.3, hoursClaude: 0.2,
    tags: ['patch:v0.17.1', 'ip-artifacts', 'trademark'],
    contributionType: 'domain_authoring',
  },
  {
    capabilitySlug: 'platform-infra',
    externalRef: 'v0.17.2 · deploy-crash-db-migration-isolation',
    title: 'Fix v0.17 deploy crash — isolate DB migrations from sessions column ALTERs',
    summary: 'A boot-time crash on Render was traced to an ALTER TABLE against the sessions table colliding with an existing column. Isolated the v0.17 migration block so each ALTER is independently guarded and a failure in one does not take down bootstrap for the rest.',
    ...DEPLOYED, kind: 'bug',
    hoursBetsy: 0.5, hoursClaude: 0.5,
    tags: ['patch:v0.17.2', 'database', 'deploy', 'reliability'],
    contributionType: 'active_supervision',
  },
  {
    capabilitySlug: 'lead-capture',
    externalRef: 'v0.17.3 · lead-pledge-flow',
    title: 'Lead pledge flow — replace convert-to-member with pledge interest',
    summary: 'Replaced the old "convert lead to member" action with a lower-friction "pledge interest" flow — a lead can express interest in becoming an operator on the network without an immediate full account conversion, reducing the commitment required at the point of first interest.',
    ...DEPLOYED,
    hoursBetsy: 1.0, hoursClaude: 1.0,
    tags: ['patch:v0.17.3', 'lead-capture', 'member-experience'],
    contributionType: 'strategic_direction',
  },
];

// ── v0.18 — today's session ───────────────────────────────────────────────────

const V018_ITEMS = [
  {
    capabilitySlug: 'public-site-content',
    externalRef: 'v0.18 · home-intro-founder-pairing',
    title: 'Home page — About This Site paired with Face of the Founder',
    summary: 'Restructured Home\'s opening two-column row: left column now carries the site\'s purpose statement ("About This Site" — living portfolio, career source of truth, real-time resume/proposal output engine, background build sandbox), right column carries Face of the Founder (name, photo, blurb, CTAs) with the "How I Work" callout moved up underneath it. Previously these were two separate stacked sections.',
    userStory: 'As a visitor landing on the home page, I want to immediately understand what this site is for (not just who it belongs to) before I meet the founder, so the purpose and the person are presented together rather than the purpose being buried further down the page.',
    requirementDetail: 'src/components/blocks/index.jsx: AboutIntroBlock rewritten — left column renders introEyebrow/introHeading/introBody, right column renders founderEyebrow/founderName/founderTitle/photoUrl/founderBlurb/cta1/cta2 plus a howIWork callout box. One-off migration script merged the prior siteIntro (text) section and the aboutIntro (founder+mission) section\'s founder half into this shape.',
    acceptanceCriteria: 'Home page row 1 shows site-purpose text on the left and the founder card (with How I Work) on the right. No content lost from either prior section.',
    ...DEPLOYED,
    hoursBetsy: 1.0, hoursClaude: 1.5,
    tags: ['patch:v0.18', 'public-site-content', 'home-page'],
    contributionType: 'active_supervision',
  },
  {
    capabilitySlug: 'public-site-content',
    externalRef: 'v0.18 · exec-summary-dashboard',
    title: 'Executive Summary redesigned as a stat-tile dashboard, paired with Salt Basin Mission',
    summary: 'The Executive Summary & Selected Highlights section was a plain paragraph block; redesigned as a dashboard with large stat tiles (years of experience, industries served), narrative paragraphs, and the achievement highlights rendered as a scannable card grid instead of a bulleted wall of text. Paired with the Salt Basin Mission card on the right (moved here from the old aboutIntro right column) so row 2 mirrors row 1\'s two-column pattern.',
    userStory: 'As a visitor scanning the home page, I want the headline numbers (years of experience, industries served) to be immediately visible rather than buried in a paragraph, and the achievement highlights to read as distinct cards I can scan rather than a dense bulleted list.',
    requirementDetail: 'New execDashboard block type (ExecDashboardBlock in blocks/index.jsx): StatTile component for the large-number tiles, parseHighlights() strips bullet markers and the all-caps header line from the raw Selected_Notable_Highlights text and renders each achievement as its own card. Right column reuses the aboutIntro Mission card markup verbatim (missionEyebrow/missionHeading/missionBody/bullet1-3/platformLine).',
    acceptanceCriteria: 'Home page row 2 shows two stat tiles, narrative text, a card grid of highlights on the left, and the Salt Basin Mission card on the right. Background corrected to navy for text contrast (caught and fixed during verification).',
    ...DEPLOYED,
    hoursBetsy: 1.0, hoursClaude: 2.0,
    tags: ['patch:v0.18', 'public-site-content', 'home-page', 'new-block-type'],
    contributionType: 'strategic_direction',
  },
  {
    capabilitySlug: 'public-site-content',
    externalRef: 'v0.18 · consulting-pages-merged',
    title: 'Consulting pages merged into one; "Meet the Founder" page retired',
    summary: 'The three separate Consulting pages (Domains & Niche Expertise, Services, Self-Service Assessments) collapsed into a single Consulting page with three sections. The "Meet the Founder" page was retired entirely — its content (bio, career timeline, case studies) now lives on Home. Career Timeline and Case Studies added directly to Home, positioned below the Executive Summary dashboard.',
    userStory: 'As Betsy managing the site, I want "Consulting" to be one page in the Pages list (matching what visitors see as one nav item), not three separate pages that happen to share a nav dropdown, so the admin page list and the visitor-facing nav are never out of sync.',
    requirementDetail: 'New domainsNiche block type split out of the old industryWheel component (categorized domains + niche solutions panels, now standalone on the Consulting page). industryWheel trimmed to just the wheel + tech-capability panel, now living on Home. Output.jsx (resume, case-study, domains PDFs) updated to read from Home\'s aboutIntro/execDashboard/timeline/caseStudies sections instead of the removed founder page.',
    acceptanceCriteria: 'Pages list shows exactly Home / Consulting / Resources / Creative Storefront. Visiting /consulting shows all three sections. Resume and case-study PDF output still render correctly with the new section sources.',
    ...DEPLOYED,
    hoursBetsy: 1.5, hoursClaude: 2.5,
    tags: ['patch:v0.18', 'public-site-content', 'cms-public', 'consulting-page'],
    contributionType: 'strategic_direction',
  },
  {
    capabilitySlug: 'platform-architecture',
    externalRef: 'v0.18 · data-driven-public-nav',
    title: 'PublicNav.jsx rewritten to be fully data-driven — no hardcoded nav array',
    summary: 'Replaced the hardcoded NAV array in PublicNav.jsx with a nav built at render time from live page and section data: one top-level item per published page (ordered by page.order, skipping drafts/hidden), with a dropdown built from any section flagged navSubPage on that page, anchored to that section\'s id. Adding a page or flipping the toggle now updates the visitor-facing nav automatically with no code change.',
    userStory: 'As Betsy adding new pages or sections, I want the site nav to update itself from what I\'ve built in the CMS, so I never have to remember to also go edit a hardcoded nav file in the source code.',
    requirementDetail: 'buildNav(pages) in PublicNav.jsx replaces the static NAV array. AnchorLink generalized to accept a pageSlug (previously hardcoded to always route through Home). New navSubPage (boolean) + navLabel (string override) fields added to the section schema; EditorPane Section Settings gained a checkbox + label input for them. Admin Pages sidebar (Sidebar.jsx) simplified back to a flat list — it now matches the nav 1:1 since the admin/platform site collapsed to one page per nav item plus in-page navSubPage anchors, retiring page-level navGroup for this site (member sites keep navGroup for their own open-ended page counts).',
    acceptanceCriteria: 'Nav renders identically to the prior hardcoded version for existing content. Toggling navSubPage off/on a section immediately adds/removes its nav dropdown link, verified live in the admin preview.',
    ...DEPLOYED,
    hoursBetsy: 1.0, hoursClaude: 2.5,
    tags: ['patch:v0.18', 'platform-architecture', 'cms-public', 'nav'],
    contributionType: 'strategic_direction',
  },
  {
    capabilitySlug: 'public-site-content',
    externalRef: 'v0.18 · expandable-tile-dashboard-text',
    title: 'ExpandableTile — dashboard-tile pattern for dense resume text',
    summary: 'Career Timeline\'s per-job bullets and Case Studies\' labeled fields (Problem Statement, Methods & Approach, Impact & Outcomes, etc.) were dense paragraph/bullet blocks. New shared ExpandableTile component clamps each to 3 lines by default and expands to the full text in a raised overlay on hover (desktop) or tap (touch) — no underlying content shortened, only the default on-page presentation changed.',
    userStory: 'As a visitor reading the career timeline or case studies, I want to scan a grid of short teasers and only read the full paragraph for the ones I\'m interested in, rather than reading a wall of text top to bottom.',
    requirementDetail: 'ExpandableTile in blocks/index.jsx: -webkit-line-clamp for the collapsed state, onMouseEnter/onMouseLeave + onClick toggle a local active state that renders an absolutely-positioned overlay with the full text. Wired into TimelineBlock\'s bullet grid (onDark=false, light theme) and CaseField\'s text rendering (onDark=true, matches the existing navy card).',
    acceptanceCriteria: 'Career Timeline and Case Studies render as tile grids. Clicking/hovering any tile reveals its full text in an overlay without disrupting neighboring tiles.',
    ...DEPLOYED,
    hoursBetsy: 0.5, hoursClaude: 1.5,
    tags: ['patch:v0.18', 'public-site-content', 'new-component'],
    contributionType: 'domain_authoring',
  },
  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.18 · spec-docs-and-changelog-backfill',
    title: 'Three new spec documents committed; CHANGELOG + TECHNICAL_DESIGN_SPEC brought current',
    summary: 'FUNCTIONAL_DESIGN_SPEC.md, TECHNICAL_DESIGN_SPEC.md, and FUNCTIONAL_TECHNICAL_MAPPING.md (authored in a prior session, previously sitting uncommitted) were committed to the repo. TECHNICAL_DESIGN_SPEC.md updated with two new architecture diagrams (system/deployment topology, draft→publish→nav content flow) and the current block registry. CHANGELOG.md — stale since Session 7 (2026-06-09) — backfilled through v0.17.3 and today, with a retroactive Contribution Intelligence Methodology breakdown applied to this session\'s work.',
    userStory: 'As Betsy, I want the platform\'s build documentation to reflect what has actually shipped, including a retroactive application of the Contribution Intelligence Methodology I built in a prior session, so the documentation itself demonstrates the methodology rather than just describing it.',
    requirementDetail: 'CHANGELOG.md: new Session 8 entry + backfilled v0.13–v0.17.3 summary section, both grounded in git log rather than invented figures. TECHNICAL_DESIGN_SPEC.md §1: two Mermaid diagrams added; §2.1/§2.3 updated for navSubPage and the current 37-type block registry. Per the methodology\'s own honesty requirement, hour/leverage figures were not fabricated for this date range — the changelog notes that a session-JSONL burst analysis (as was run once for the June 2026 platform build) would be required before citing new precise figures.',
    acceptanceCriteria: 'All three spec docs present in the repo. CHANGELOG.md has no gap between Session 7 and today. TECHNICAL_DESIGN_SPEC.md diagrams render correctly on GitHub (Mermaid-compatible syntax).',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 1.0, hoursClaude: 1.5,
    tags: ['patch:v0.18', 'ip-artifacts', 'documentation', 'contribution-methodology'],
    contributionType: 'domain_authoring',
  },
];

async function main() {
  console.log(`Connecting to ${BASE}…`);
  const cookie = await login();
  console.log('Logged in.\n');

  const { groups = [], items: existingItems = [] } = await getBacklog(cookie);
  const refToItem = new Map();
  for (const item of existingItems) {
    if (item.externalRef) refToItem.set(item.externalRef, item);
  }
  const slugMap = {};
  for (const g of groups) {
    if (g.slug) slugMap[g.slug] = g.id;
  }

  const allItems = [...GAP_FILL_ITEMS, ...V018_ITEMS];
  const byCapability = {};
  let created = 0, skipped = 0;
  for (const item of allItems) {
    const { capabilitySlug, ...rest } = item;
    if (refToItem.has(rest.externalRef)) {
      console.log(`  SKIP (exists): ${rest.externalRef}`);
      skipped++;
      continue;
    }
    const groupId = slugMap[capabilitySlug] || null;
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}" — item will be ungrouped`);
    const result = await createItem(cookie, { ...rest, capabilityGroupId: groupId, source: 'bulk_script' });
    const cap = capabilitySlug || 'unknown';
    byCapability[cap] = (byCapability[cap] || 0) + 1;
    console.log(`  CREATED [${result.id}] (${cap}): ${rest.title.slice(0, 65)}`);
    created++;
  }

  const capSummary = Object.entries(byCapability).map(([k, v]) => `${k}: ${v}`).join(', ');
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Created:  ${created}  (${skipped} already existed)
By capability: ${capSummary || '—'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next steps:
  1. Confirm this deploy is green on Render + Netlify
  2. Visit /output/build-summary and /output/patch-notes to verify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => { console.error(e); process.exit(1); });
