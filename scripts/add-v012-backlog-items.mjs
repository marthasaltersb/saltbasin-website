// Backlog items for the v0.12 session (2026-06-09):
//   - Field settings system (visible, auditable, fieldType, valueSet, multiSelect, cascades)
//   - 9 new block types (kpiDashboard, roadmap, heatmap, leaderboard, executiveSummary,
//     appMockup, choiceGrid, decisionTree, outputGenerator)
//   - Section template modal (2-step visual flow, 15 templates)
//   - Sidebar scroll fix (section list scrolls, Add Section pinned)
//   - field_audit_log table + /api/field-audit route
//
// Idempotent by externalRef — re-runs skip items already present.
// Usage: node scripts/add-v012-backlog-items.mjs

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
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
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

async function updateItem(cookie, id, payload) {
  const res = await fetch(`${BASE}/api/backlog/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateItem failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const DEPLOYED = {
  kind: 'feature',
  status: 'completed',
  deployedGithub: true, deployedRender: true, deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: false },
  hoursClaudeEst: 3, hoursBetsyEst: 0.5,
};

const ITEMS = [
  // ── Field Settings System ──────────────────────────────────────────────────
  {
    capabilitySlug: 'content-management',
    externalRef: 'FEAT.2026-06-09.1 · field-settings-system',
    title: 'Field settings panel — visible, auditable, type, value set, cascades',
    summary: 'Every content field in every section now has a tabbed settings panel accessible by clicking the source-type badge. Settings tab: visible/hidden toggle, auditable toggle, field type (13 options), predefined value set editor for select/multiselect, description. Source tab: existing source type system, now tab-organized. Cascade tab: rules so selecting a value in one field filters downstream field options.',
    userStory: 'As a site admin, I want granular control over every content field — whether it\'s visible to editors, whether changes are logged for compliance, what kind of data it holds, and whether selecting a value in it narrows the choices in a related field — so my CMS is as structured or as flexible as each use case needs.',
    requirementDetail: 'Extended FieldMetaEditor component with tabbed UI (Settings / Source / Cascade). Settings tab adds: visible boolean (default true), auditable boolean (default false), fieldType enum (text/textarea/number/date/boolean/select/multiselect/url/email/json/image/color/richtext), valueSet array [{value, label}] for select types, multiSelect boolean for non-select types, description string. Cascade tab: array of rules [{triggerField, triggerValue, targetField, filterValues[]}]. All saved to section.fieldMeta[key] via onUpdateSection. Clone (⧉) and Remove (✕) controls on every field row. + Add Field inline creator at the bottom of the Content Fields card.',
    businessRules: '- visible:false fields are rendered in the editor with 50% opacity and a (hidden) tag so the admin can see them but visitors will not see them in the published site (block renderer must respect this — pending).\n- auditable fields fire a POST /api/field-audit on every patchField call; non-fatal (errors caught and swallowed).\n- Removing a field deletes both the fields[key] entry and the fieldMeta[key] entry atomically in a single onUpdateSection call.\n- Cloning a field appends _copy (then _copy2, _copy3, …) if the base key is already taken.',
    designSpec: 'Source badge click opens the meta panel inline below the field label, full width of the editor card. Three tabs across the top (⚙ Settings, ⇌ Source, ⇒ Cascade). Toggle pills use green/gray styling consistent with existing status chips. Value set rows are editable inline; new row added via Enter or + Add button. Cascade rules show as a small card each with When / equals / filter grid.',
    acceptanceCriteria: '- Clicking the source badge opens the extended panel with all 3 tabs.\n- Toggling visible off and saving → fieldMeta[key].visible === false.\n- Toggling auditable on, saving, then editing the field → a row appears in field_audit_log with the correct before/after values.\n- Adding a predefined option for a select field → it appears in the value set list and can be removed.\n- Adding a cascade rule and saving → fieldMeta[key].cascades array is populated.\n- Clone (⧉) creates a duplicate field with _copy suffix.\n- Remove (✕) with confirm removes both the field value and its meta.\n- + Add Field creates a new empty field at the bottom of the section.',
    ...DEPLOYED,
    hoursClaudeEst: 1.5,
  },

  // ── Field Audit Log ────────────────────────────────────────────────────────
  {
    capabilitySlug: 'content-management',
    externalRef: 'FEAT.2026-06-09.2 · field-audit-log',
    title: 'Field audit log — capture before/after on auditable field edits',
    summary: 'New field_audit_log table and /api/field-audit route. Any field with auditable: true in its fieldMeta fires a background POST on every edit, recording user_id, section_id, field_key, before_value, after_value, and created_at. GET endpoint retrieves history filtered by sectionId and optional fieldKey.',
    userStory: 'As a platform admin or compliance stakeholder, I want to see the full edit history of any field I\'ve marked as auditable, so I can trace who changed what and when without relying on git history.',
    requirementDetail: 'New table field_audit_log(id, user_id FK, section_id TEXT, field_key TEXT, before_value TEXT, after_value TEXT, created_at BIGINT). Idempotent ALTER TABLE IF NOT EXISTS in db.js bootstrap. New route file server/routes/fieldAudit.js: POST /api/field-audit (requires auth, inserts row), GET /api/field-audit?sectionId=&fieldKey=&limit= (requires auth, returns rows with user email joined). Mounted at /api/field-audit in server/index.js. Front-end patchField() detects meta.auditable and fires the POST; errors are caught and swallowed (non-fatal).',
    businessRules: '- Audit entries are append-only — no update or delete endpoints.\n- Both before_value and after_value are stored as TEXT (JSON.stringify for objects/arrays).\n- null is stored as SQL NULL (not the string "null").\n- GET endpoint requires auth (admin or member — any authenticated user can read audit history for sections they can edit).\n- Limit defaults to 50, max 500.',
    acceptanceCriteria: '- POST /api/field-audit with valid auth returns { ok: true }.\n- GET /api/field-audit?sectionId=X returns rows array.\n- Editing an auditable field while logged in creates a row with correct before/after values.\n- Re-running db bootstrap does not error (idempotent CREATE TABLE IF NOT EXISTS).',
    ...DEPLOYED,
    hoursClaudeEst: 0.5,
  },

  // ── 9 New Block Types ──────────────────────────────────────────────────────
  {
    capabilitySlug: 'content-management',
    externalRef: 'FEAT.2026-06-09.3 · nine-new-block-types',
    title: '9 new block types — KPI dashboard, roadmap, heatmap, leaderboard, executive summary, app mockup, choice grid, decision tree, output generator',
    summary: 'Nine React block components added to blocks/index.jsx and registered in REGISTRY, each seeded as a template in SectionTemplateModal. Designed from the PPTX visual reference library (18 presentations analyzed): pastel metric panels, timeline milestones, color-coded status matrices, ranked lists, two-col summaries, phone/tablet frames, interactive option tiles, YES/NO flowcharts, and an AI-powered output builder.',
    userStory: 'As a member building my profile or a site admin composing content, I want a rich library of visual section types that match the quality of presentation-design tools — dashboards, roadmaps, heatmaps, leaderboards — so my website looks like it was designed by a consultant, not assembled from generic templates.',
    requirementDetail: 'KpiDashboardBlock: panels[] array, each {label, value, change, caption, color, icon}. RoadmapBlock: milestones[] {date, title, description, status}, horizontally scrollable with gradient spine. HeatmapBlock: columns[] + rows[] {label, values[]}, status values mapped to green/yellow/red/blue/teal/gray. LeaderboardBlock: entries[] {name, subtitle, value, change, icon, avatar}, gold/silver/bronze rank colors. ExecutiveSummaryBlock: two-col, stats[] + contacts[]. AppMockupBlock: screens[], layout (phone/tablet/browser), gradient. ChoiceGridBlock: choices[] {icon, title, description, color, cta, ctaLink}, click-to-select with expansion. DecisionTreeBlock: nodes[] {id, question, yes, no, type, answer}, interactive React state. OutputGeneratorBlock: drag-to-reorder, outputType select, audience textarea, AI call to /api/members/me/agent.',
    businessRules: '- All blocks accept { section, config, mode, memberSlug } props consistent with existing block API.\n- BG_VAR and STATUS_PILL helpers are defined once at the top of the new block section and shared.\n- OutputGeneratorBlock is functional in preview/editor but should be gated on the public site (mode check pending).\n- ChoiceGridBlock and DecisionTreeBlock use local React state — selections are not persisted to the site draft.\n- All blocks are responsive via CSS Grid auto-fill / auto-fit.',
    acceptanceCriteria: '- Each of the 9 block types renders without errors in the preview pane when added via the template modal.\n- BLOCK_TYPES export includes all 9 new keys.\n- OutputGenerator Generate button calls /api/members/me/agent and renders the response.\n- DecisionTree YES/NO buttons navigate the tree; Reset clears state.\n- ChoiceGrid tile click expands with CTA; second click collapses.',
    ...DEPLOYED,
    hoursClaudeEst: 2,
  },

  // ── Section Template Modal ─────────────────────────────────────────────────
  {
    capabilitySlug: 'content-management',
    externalRef: 'FEAT.2026-06-09.4 · section-template-modal',
    title: 'Section template modal — 2-step visual picker with 15 templates',
    summary: 'The "+ Add Section" flow is replaced by a two-step modal. Step 1: a visual card grid of 15 pre-built templates with icon, label, description, and default column count. Step 2: name the section, set columns (1–4), choose background, set visibility. Confirmed sections are seeded with the template\'s default fields. AdminShell addSection() updated to accept columns + pre-seeded fields.',
    userStory: 'As a member or admin adding a new section to a page, I want to choose from a visual library of pre-built templates so I start with a working section rather than a blank slate, and I can see what each type looks like before committing.',
    requirementDetail: 'New component SectionTemplateModal.jsx. TEMPLATES array of 15 objects: {id, type, label, icon, desc, accent, fields, defaultCols}. Step 1 renders a CSS Grid of template cards with hover animation. Step 2 renders a form: name input (autofocus, Enter submits), column selector (1–4 toggle buttons), background select, visibility toggle. onConfirm({name, type, columns, bg, status, fields}) called on confirm. AdminShell addSection() updated: accepts columns and pre-seeded fields, sets fieldMeta: {} on new sections. setSectionModal(true) replaces the old setSectionModal({name: "", ...}) call.',
    businessRules: '- The "Blank" template seeds {heading, intro} with placeholder text.\n- All other templates seed the complete fields object matching their block type\'s expected shape.\n- Column count is stored as section.columns (integer) for future layout use — not yet consumed by the block renderer but stored for forward compatibility.\n- onConfirm is only callable if name.trim() is non-empty (button disabled + Enter guard).',
    acceptanceCriteria: '- Clicking "+ Add Section" opens the modal at Step 1.\n- Clicking any template card advances to Step 2 with that template pre-selected.\n- "Change" button in Step 2 returns to Step 1.\n- Confirming adds the section to the current page with the correct type and pre-seeded fields.\n- The new section is immediately selected in the editor.\n- Clicking outside the modal or pressing ✕ closes without adding a section.',
    ...DEPLOYED,
    hoursClaudeEst: 0.75,
  },

  // ── Sidebar Scroll Fix ─────────────────────────────────────────────────────
  {
    capabilitySlug: 'admin-shell',
    externalRef: 'FIX.2026-06-09.1 · sidebar-scroll-add-section-visible',
    title: 'Fix: sidebar section list scrolls, Add Section button always visible',
    summary: 'The section list in the sidebar now takes all remaining flex space with overflowY: auto and minHeight: 0. The "+ Add Section" button sits outside the scroll area, pinned to the bottom with a faint gold divider. Pages list and sections label remain fixed at the top. Previously, adding many sections pushed the button off-screen with no way to scroll to it.',
    userStory: 'As an admin with many sections on a page, I want the "+ Add Section" button to always be visible at the bottom of the sidebar so I can add sections without scrolling past existing ones to find the button.',
    requirementDetail: 'Sidebar.jsx restructured into 4 flex zones: (1) pages list, fixed; (2) gold divider, fixed; (3) sections label, fixed; (4) section list, flex:1 + overflowY:auto + minHeight:0, scrolls. (5) Add Section button, flexShrink:0, pinned below with border-top. adminStyles.js sidebar gets minHeight: 0 comment. sectionList style removed from adminStyles.js (now inline). Button is full-width in its container.',
    businessRules: '- Both the Pages area and the "+ Add Section" button must remain visible at all viewport heights the admin shell is likely to be used at (laptop 768px+ height).\n- The sidebar overflow: hidden on the container must stay so no horizontal overflow leaks.',
    acceptanceCriteria: '- Adding 20+ sections to a page → section list scrolls, "+ Add Section" button remains visible.\n- Pages list does not scroll off screen.\n- Section label ("Sections — Page Name") remains visible.\n- Add Section button click opens the template modal.',
    kind: 'defect',
    status: 'completed',
    deployedGithub: true, deployedRender: true, deployedNetlify: false,
    deployRelevance: { github: true, render: true, netlify: false },
    hoursClaudeEst: 0.25,
  },
];

// ── Runner ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Connecting to ${BASE}…`);
  const cookie = await login();
  console.log('Logged in.');

  const { groups = [], items: existingItems = [] } = await getBacklog(cookie);
  const existingRefs = new Set(existingItems.map((i) => i.external_ref).filter(Boolean));

  // Build slug → group id map
  const slugMap = {};
  for (const g of groups) {
    if (g.slug) slugMap[g.slug] = g.id;
  }

  let created = 0, skipped = 0;

  for (const item of ITEMS) {
    const { capabilitySlug, ...rest } = item;

    if (existingRefs.has(rest.externalRef)) {
      console.log(`  SKIP (exists): ${rest.externalRef}`);
      skipped++;
      continue;
    }

    const groupId = slugMap[capabilitySlug];
    if (!groupId) {
      console.warn(`  WARN: no group found for slug "${capabilitySlug}" — item will be ungrouped`);
    }

    const payload = {
      ...rest,
      capabilityGroupId: groupId || null,
      source: 'bulk_script',
    };

    const result = await createItem(cookie, payload);
    console.log(`  CREATED [${result.id}]: ${rest.title.slice(0, 70)}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
