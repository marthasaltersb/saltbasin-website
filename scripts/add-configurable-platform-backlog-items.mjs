// Configurable Platform Initiative — Phases A/B/C backlog logging.
//
// Session 4ded6650-5817-4768-a501-7b55b01fb2f6 (2026-07-08) built:
//   Phase A — section layout config (width/height/padding) + drag-to-reorder Layout view
//   Phase B — page type registry (New Page type picker → editable templates)
//   Phase C — per-column sub-section widgets (photo/slideshow/form/wheel) via flexColumns
// Full detail: HANDOVER_configurable_platform.md. Phases D/E/F (button classification,
// output configurator, content-mapping) are NOT started and are NOT logged here.
//
// Overlap check: before creating, this script scans every existing backlog item's
// title/summary/tags for Phase A/B/C keywords (page types, section layout, drag-reorder,
// flex columns, widgets, industry wheel) and prints any hits for human review — the same
// duplicate-prevention gap called out in contributionMethodology.js's
// RETROACTIVE_SESSION_ANALYSIS.knownGaps ("would not catch two items whose externalRefs
// differ but whose scope overlaps"). A manual pass against the live backlog on
// 2026-07-08 found three adjacent-but-distinct items that do NOT overlap and were
// deliberately left untouched:
//   - TT.96 "Expand admin configurability layer" — hardcoded footer/social-grid/lead-form/
//     modal copy, not page types or section layout.
//   - PB.2 "CTA / button configurability" + PB.5 "Configurable top navigation" — Phase D/
//     nav territory, not this phase's scope.
//   - "Templates Phase A/B" (id 41/53) — whole-site starter templates (pick an entire
//     pre-built site archetype), a different concept from Phase B's per-page defaultSections.
// If the automated scan below finds something the manual pass missed, it PATCHes that
// item via the same upsert-by-externalRef path (server/routes/backlog.js) rather than
// creating a duplicate — it does not silently overwrite an unrelated item on a fuzzy
// match; a hit only causes an update if you set FOLD_INTO_EXISTING for that phase below.
//
// Hours: real burst-analysis session total from extract-classify-turns.mjs (session
// 4ded6650 added to its SESSIONS map this pass) — hoursClaude=2.42 (raw active hours,
// analyze-contribution-sessions.mjs), hoursBetsy=1.78 weighted / hoursStrategicDirection=1.10
// (turn-classification.json; domain_authoring=0 for this session). Apportioned across the
// three phases proportional to each phase's new-file line count (a concrete, reproducible
// split basis, not a subjective per-phase guess): Phase A 365, Phase B 244, Phase C 822 of
// 1431 total new lines. dataSource: 'measured_burst_analysis' — the session total is
// measured; the per-phase split is an estimate on top of it, disclosed here and in each
// item's requirementDetail.
//
// patch_note_version deliberately left UNSET: the concurrent session's uncommitted
// scripts/add-v019-backlog-items.mjs claims "v0.19" for its own (NRM/PLM) work as of
// 2026-07-08, and nothing from either session is committed yet. Assign the version number
// by hand once the two sessions' work is reconciled and a commit order is chosen.
//
// Idempotent via POST /api/backlog/items' upsert-by-externalRef. Usage:
//   node scripts/add-configurable-platform-backlog-items.mjs
// Requires in .env: ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD, optional PUBLIC_BASE_URL.

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASS || !EMAIL) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

const CLAUDE_RATE = 115;
const TRADITIONAL_RATE = 175;

function withCost(hoursBetsy, hoursClaude, hoursStrategicDirection, hoursDomainAuthoring) {
  return {
    hoursBetsy,
    hoursClaude,
    hoursStrategicDirection,
    hoursDomainAuthoring,
    activitiesBetsy: Math.ceil(hoursBetsy * 3),
    activitiesClaude: Math.ceil(hoursClaude * 6),
    costUsdClaude: Math.round(hoursClaude * CLAUDE_RATE * 100) / 100,
    traditionalCostUsd: Math.round((hoursBetsy + hoursClaude) * TRADITIONAL_RATE * 100) / 100,
    dataSource: 'measured_burst_analysis',
  };
}

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

async function upsertItem(cookie, payload) {
  const res = await fetch(`${BASE}/api/backlog/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`upsertItem failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const BUILT_NOT_YET_DEPLOYED = {
  kind: 'feature',
  status: 'completed',
  deployedGithub: false,
  deployedRender: false,
  deployedNetlify: false,
};

// Keyword scan used for the automated overlap check (see header comment).
const OVERLAP_KEYWORDS = /page.?type|section.?layout|drag.?(and.?)?reorder|flex.?column|column.?widget|industry.?wheel|wheel.?infographic|slideshow|photo.?widget|per.?column|layout.?tab|template.?picker|new.?page.?type|configurable.?(page|section)/i;

// Set to a live item's externalRef to fold a phase's hours/status INTO that existing
// item instead of creating a new one. Left null for all three — the manual overlap
// review above found no genuine match.
const FOLD_INTO_EXISTING = {
  'configurable-platform · phase-a-section-layout': null,
  'configurable-platform · phase-b-page-type-registry': null,
  'configurable-platform · phase-c-flex-column-widgets': null,
};

const ITEMS = [
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'configurable-platform · phase-a-section-layout',
    title: 'Section layout config (width/height/padding) + drag-to-reorder Layout view',
    summary: 'New optional section.layout field ({width, height, padding, columnGap}) applied via a zero-DOM-impact SectionShell wrapper when absent (fully backward compatible). New "Layout" tab in the content editor shows section summary cards with an inline settings drawer and drag-to-reorder via @dnd-kit — reordering rides the existing patchDraft pipeline with zero new API calls, since site_state/member_sites are opaque JSON blobs.',
    userStory: 'As an admin or member editing a page, I want to control each section\'s width, height, and padding and drag sections into a new order, without touching JSON or waiting on a deploy.',
    requirementDetail: 'New files: src/components/blocks/SectionShell.jsx (wraps RenderSection\'s output; reaches into the block\'s own root <section> via useLayoutEffect + el.style.setProperty(..., "important") since blocks set height/padding inline), src/components/admin/SectionLayoutFields.jsx (shared width/height/padding/columns/bg controls), src/components/admin/PageLayoutView.jsx (drag-reorder via @dnd-kit/core + @dnd-kit/sortable, new deps). AdminShell.jsx gained reorderSections() and a "Layout" view tab. Bug found + fixed during this pass: SectionLayoutFields originally merged layout patches against a stale prop closure — two fast edits in the same render tick could clobber each other. Fixed by moving the merge into AdminShell.updateSection, which special-cases a layoutPatch key and merges against the live draft state inside patchDraft\'s functional updater.',
    acceptanceCriteria: 'Given a section with no layout field, the public/preview render is pixel-identical to before (verified). Given an admin sets width=narrow/height=fixed/padding=custom, the change is visible in preview and persists through publish. Given two sections are dragged into a new order in the Layout tab, the new order persists in the draft and publishes correctly.',
    businessRules: 'Absent section.layout is a zero-DOM pass-through — no visual regression for any pre-existing section. columnGap is reserved in the schema but not yet exposed in the UI.',
    tags: ['configurable-platform', 'phase-a', 'admin-experience', 'section-layout', 'drag-reorder'],
    ...BUILT_NOT_YET_DEPLOYED,
    ...withCost(0.45, 0.62, 0.28, 0),
  },
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'configurable-platform · phase-b-page-type-registry',
    title: 'Page type registry — New Page type picker with editable default-section templates',
    summary: 'New page_type_definitions config_state row (platform-wide shared taxonomy, admin-edits/both-scopes-read) replaces the hardcoded single-Hero page creation flow with 4 default types (Standard/Landing/Blog/Shop), each with its own defaultSections template. New admin-only PageTypeManagerPanel for CRUD on types and their default sections.',
    userStory: 'As Betsy (or a member), when I create a new page I want to pick a type (Landing, Blog, Shop, etc.) that seeds sensible starting sections, instead of always getting one blank Hero I have to build out by hand every time.',
    requirementDetail: 'server/db.js: page_type_definitions seeded in bootstrap() (check-then-insert, same pattern as admin_nav). GET/PUT /api/config/page-types (admin-only, server/routes/config.js) + read-only GET /api/member-config/page-types (server/routes/memberConfig.js) — one shared taxonomy, not per-member data. api.js: getPageTypes/getMemberPageTypes/updatePageTypes. AdminShell.jsx\'s PageModal is now data-driven from the loaded registry with an admin-only "Manage Page Types →" link; addPage() clones the selected type\'s defaultSections (fresh ids, {{pageName}} substitution) instead of always seeding one hardcoded Hero, falling back to today\'s exact single-Hero behavior if the registry hasn\'t loaded. New src/components/admin/PageTypeManagerPanel.jsx for admin CRUD, reusing SectionTemplateModal\'s exported TEMPLATE_CATEGORIES for the block-type picker.',
    acceptanceCriteria: 'Given the page type registry is unreachable, creating a new page still seeds exactly one Hero section (unchanged behavior). Given an admin picks "Landing" in the New Page modal, the created page has a Hero + Call to Action section pre-populated with the page name substituted in. Given an admin edits a page type\'s default sections in PageTypeManagerPanel and saves, subsequent new pages of that type reflect the change.',
    businessRules: 'Page types are platform-wide, not per-member — members read but cannot edit the registry.',
    tags: ['configurable-platform', 'phase-b', 'admin-experience', 'page-types', 'templates'],
    ...BUILT_NOT_YET_DEPLOYED,
    ...withCost(0.30, 0.41, 0.19, 0),
  },
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'configurable-platform · phase-c-flex-column-widgets',
    title: 'Per-column sub-section widgets (photo/slideshow/form/wheel) via new flexColumns section type',
    summary: 'New flexColumns section type gives every column of a multi-column section its own widget type — text (default), photo, auto-advancing photo slideshow, a lead-capture form (submits through the existing /api/leads with zero new backend), or the industry wheel infographic. The previously hardcoded IndustryWheelBlock was generalized to read its nodes/center-label from section.fields, with the original 8 industries as a fallback so existing content renders unchanged.',
    userStory: 'As Betsy building a page, I want each column of a section to independently be a photo, a slideshow, a form, or an infographic wheel — not just text — so I can compose richer multi-column layouts without a new hardcoded block type for every combination.',
    requirementDetail: 'New src/components/blocks/ColumnWidgets.jsx (WIDGET_REGISTRY, WIDGET_TYPES, FlexColumnsBlock, generalized WheelDisplay), src/components/blocks/blockUtils.jsx (useViewportWidth/PanelCard extracted to avoid circular imports), src/components/admin/FlexColumnsEditor.jsx (per-column widget-type picker + widget-specific config; exports WheelNodesEditor, reused by a new dedicated Wheel card in EditorPane.jsx for the legacy industryWheel section type), src/components/admin/ImageUploadField.jsx (extracted from EditorPane.jsx). IndustryWheelBlock generalized to read section.fields.wheelNodes/wheelCenterLabel with DEFAULT_INDUSTRY_WHEEL_NODES (the original 8 industries) as fallback — zero visual change until an admin edits it. userForm widget submissions: known field keys (email/name/phone) map to /api/leads\' named columns; other custom fields are appended to message as "Label: value" lines (not individually queryable later — accepted scoping boundary).',
    acceptanceCriteria: 'Given an existing industryWheel section with no edits, it renders identically to before (verified). Given an admin adds a flexColumns section with a photo, slideshow, form, and wheel column, all four render and function correctly in preview, including a real lead-form submission landing in the leads table. Given an admin edits one wheel node\'s label, only that node changes.',
    businessRules: 'Trade-off accepted by Betsy: the prior rich structured per-industry dashboard (2 stat boxes + badge list + bulleted list) is now one reformatted text block per industry — content preserved, layout simplified for cross-widget reusability.',
    tags: ['configurable-platform', 'phase-c', 'admin-experience', 'flex-columns', 'widgets', 'industry-wheel'],
    ...BUILT_NOT_YET_DEPLOYED,
    ...withCost(1.03, 1.39, 0.63, 0),
  },
];

async function main() {
  console.log(`Connecting to ${BASE}…`);
  const cookie = await login();
  console.log('Logged in.\n');

  const { groups = [], items: existingItems = [] } = await getBacklog(cookie);
  const slugMap = {};
  for (const g of groups) if (g.slug) slugMap[g.slug] = g.id;

  const ourRefs = new Set(ITEMS.map((i) => i.externalRef));
  const overlapHits = existingItems.filter((i) => {
    if (ourRefs.has(i.externalRef)) return false; // our own prior run, not an overlap
    const haystack = `${i.title || ''} ${i.summary || ''} ${(i.tags || []).join(' ')}`;
    return OVERLAP_KEYWORDS.test(haystack);
  });

  console.log(`Overlap scan: ${overlapHits.length} existing item(s) matched Phase A/B/C keywords (reviewed manually — see header comment for why each is NOT a duplicate):`);
  for (const h of overlapHits) {
    console.log(`  [${h.id}] (${h.status}) ${h.externalRef || '(no externalRef)'} — ${h.title}`);
  }
  console.log('');

  let created = 0, updated = 0;
  for (const item of ITEMS) {
    const { capabilitySlug, ...rest } = item;
    const foldTarget = FOLD_INTO_EXISTING[item.externalRef];
    const payload = foldTarget ? { ...rest, externalRef: foldTarget } : rest;
    const groupId = slugMap[capabilitySlug] || null;
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}" — item will be ungrouped`);
    const result = await upsertItem(cookie, { ...payload, capabilityId: groupId });
    if (result.upserted === 'updated') { updated++; console.log(`  UPDATED [${result.id}] (${capabilitySlug}): ${rest.title.slice(0, 70)}`); }
    else { created++; console.log(`  CREATED [${result.id}] (${capabilitySlug}): ${rest.title.slice(0, 70)}`); }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Created: ${created}   Updated: ${updated}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next steps:
  1. Assign patch_note_version once this session's work and the concurrent
     v0.19 (NRM/PLM) session's work are both committed and their relative
     order is decided — do not guess a version number here.
  2. Once deployed, flip status/deployedGithub/deployedRender/deployedNetlify.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
