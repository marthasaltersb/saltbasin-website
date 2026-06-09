// Backlog items for the v0.13 session (2026-06-09):
//   - Categorized section template modal (4 categories, 26 templates)
//   - My Resume member app (preset builder + AI interpreter)
//   - Resume page default in new member sites
//   - Skills, Client Snapshot, expanded Case Studies blocks
//   - Configurable section action buttons
//   - member_json_store table
//
// Idempotent by externalRef — re-runs skip items already present.
// Usage: node scripts/add-v013-backlog-items.mjs

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

const DEPLOYED = {
  kind: 'feature',
  status: 'completed',
  deployedGithub: true, deployedRender: true, deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: false },
  hoursClaudeEst: 2, hoursBetsyEst: 0.25,
};

const ITEMS = [
  {
    capabilitySlug: 'multi-tenant-cms',
    externalRef: 'FEAT.2026-06-09.5 · categorized-template-modal',
    title: 'Section template modal — 4-category sidebar with 26 templates',
    summary: 'The flat 15-template grid is replaced by a sidebar-categorized 2-step modal. Categories: General (5), Member Profile (9), Org Profile (4), Project Management (6). Each template is purpose-seeded with fields appropriate to its use case. The Timeline template is only available in Org Profile and Project Management — not General member use. Career Timeline in Member Profile is seeded with experience eyebrow, heading, and a Download Resume action button.',
    userStory: 'As a member or admin adding a section, I want to browse templates by their intended purpose — not a flat list — so I find the right starting point without guessing what each block type does.',
    requirementDetail: 'TEMPLATE_CATEGORIES array replaces TEMPLATES. Each category has id, label, icon, templates[]. Category sidebar renders on the left of the Step 1 modal; clicking a category filters the grid on the right. Template count shown per category. Compact grid: 160px min-width cards with icon, label, desc. Step 2 unchanged: name, columns, background, visibility. onConfirm seeds from selected template fields. Org Profile category includes: Company Timeline, Roadmap, Product Mockup, Team/Leaderboard. Project Management includes: KPI Dashboard, Status Heatmap, Project Timeline, Feature Cards, Decision Tree, Output Generator.',
    businessRules: '- Timeline template appears ONLY in Org Profile and Project Management categories, not in General or Member Profile.\n- Career Timeline (Member Profile) seeds actions:[{label:"Download Resume",href:"/output/resume",style:"gold"}] — no hardcoded button labels elsewhere.\n- Blank template in General seeds empty heading/intro only.\n- Each category template list is exhaustive — there is no "All" tab; users must pick a category first.\n- The modal\'s Step 1 remembers the last active category during a session (React state, not persisted).',
    acceptanceCriteria: '- Opening "+ Add Section" shows 4 category tabs in left sidebar.\n- Clicking General shows 5 template cards.\n- Clicking Member Profile shows 9 template cards including Career Timeline.\n- Career Timeline is NOT in General or Project Management.\n- Selecting any template, advancing to Step 2, and confirming adds the section with the correct type and pre-seeded fields.\n- Timeline in Org Profile seeds "Company Milestones" heading, not "Our Story".',
    ...DEPLOYED,
    hoursClaudeEst: 1,
  },
  {
    capabilitySlug: 'multi-tenant-cms',
    externalRef: 'FEAT.2026-06-09.6 · my-resume-panel',
    title: 'My Resume — preset builder and AI resume interpreter agent',
    summary: 'New "My Resume" tab in the member admin shell. Preset builder: create named resume variants by checking which site pages/sections to include. One preset marked as primary becomes the publicly downloadable version on the member\'s profile. Resume interpreter agent: member pastes a job description, agent returns tailored professional summary, top skills, experience bullet rewrites, and gap analysis. Copy-to-clipboard + direct output renderer link.',
    userStory: 'As a member, I want a dedicated space to manage different versions of my resume — one for general download, one tailored for specific roles — and I want an AI assistant that takes any job description and tells me exactly how to reframe my experience to match it.',
    requirementDetail: 'New component MyResumePanel.jsx. Preset CRUD: preset object = {id, name, primaryResume, includedSections:[]}. GET/PUT /api/members/me/resume-presets persists to member_json_store key="resume_presets". Server enforces only one primaryResume. UI: preset card grid, "+ New Preset" add button, inline preset editor with name input + section checkboxes from the member\'s draft site pages. Primary preset shows a public URL badge. Interpreter: textarea for job description, optional preset selector if >1 presets, "Tailor My Resume" button calls /api/members/me/agent with a structured prompt. Agent output rendered in a scrollable pre block with copy + output link.',
    businessRules: '- Only one preset may be primaryResume: true; the PUT endpoint enforces this server-side by scanning left-to-right and nulling duplicates.\n- Deleting the primary preset unsets it; the member must manually designate a new one.\n- The agent call is non-streaming (single response JSON). Long descriptions are handled by the existing member agent endpoint\'s token budget.\n- The public download URL is /output/resume?presetId=X; the output renderer does NOT yet filter by presetId (that is a future enhancement — the URL is forward-compatible).\n- My Resume tab is excluded from PublishBar (self-contained persistence).',
    acceptanceCriteria: '- "My Resume" tab appears in the member admin top bar.\n- Creating a preset, checking sections, and saving → GET returns the preset.\n- Marking a preset as primary → it shows the PUBLIC badge and public URL.\n- Deleting a preset removes it from the list.\n- Pasting a job description and clicking "Tailor My Resume" returns an AI response.\n- Copy to clipboard works.\n- PublishBar does NOT appear when My Resume tab is active.',
    ...DEPLOYED,
    hoursClaudeEst: 1.5,
  },
  {
    capabilitySlug: 'multi-tenant-cms',
    externalRef: 'FEAT.2026-06-09.7 · resume-page-default',
    title: 'Resume page added as default in new member sites',
    summary: 'defaultMemberSite.js now seeds a 4th page — "Resume" — for every new member alongside Home, About, and Contact. The Resume page contains: a navy hero with Download PDF + Contact Me CTAs, a Career Timeline section (eyebrow/heading/intro + actions), a Role Detail section with 2 placeholder roles, and a Skills section with one skill group. Existing members are unaffected (seed only runs at site creation).',
    userStory: 'As a new member joining Salt Basin, I want my resume page to exist out of the box so I can immediately start filling in my career history without manually adding sections one by one.',
    requirementDetail: 'Added resume: {} page to the pages map in defaultMemberSite.js with order:2. Sections: resume-hero (type:hero, navy bg), resume-timeline (type:timeline, ivory), resume-roles (type:resume, linen), resume-skills (type:skills, cream). Contact page order bumped from 2 → 3. All sections use the standardized field shapes matching their block renderers.',
    businessRules: '- The seed only applies to new member site creation — existing member_sites rows are not touched.\n- The Resume hero actions array seeds with [{label:"Download PDF",href:"/output/resume",style:"gold"},{label:"Contact Me",href:"#contact",style:"outline-light"}].\n- The Career Timeline actions seed with [{label:"Download Resume",href:"/output/resume",style:"gold"}].',
    acceptanceCriteria: '- A newly registered member\'s admin shell shows a "Resume" page in the sidebar.\n- The Resume page has 4 sections: Resume Hero, Career Timeline, Role Detail, Skills.\n- Contact page is still present (order bumped to 3).',
    ...DEPLOYED,
    hoursClaudeEst: 0.25,
  },
  {
    capabilitySlug: 'multi-tenant-cms',
    externalRef: 'FEAT.2026-06-09.8 · skills-clientsnapshot-casestudies-blocks',
    title: 'Skills, Client Snapshot, and expanded Case Studies blocks',
    summary: 'Three enhanced member profile block types. SkillsBlock: skill groups with category headings, name, level (expert/proficient/familiar as colored chips), and years. ClientSnapshotBlock: per-client inputs for industry, employer sponsor, capabilities/technology delivered+touched, revenue range, tags; rendered as a rolled-up grouping view (by industry, capability, or revenue). CaseStudiesBlock expanded to 8 structured fields per case with accordion editor and public expand/collapse.',
    userStory: 'As a member consultant, I want rich structured blocks for my skills, clients, and case studies so that visitors immediately understand my depth — not just a wall of text, but scannable proof points with professional visual hierarchy.',
    requirementDetail: 'SkillsBlock: accepts section.fields.skills (array of {category, items:[{name,level,years}]}). Level chips: expert=teal, proficient=gold, familiar=light gray. SkillsListEditor in EditorPane with accordion per group. ClientSnapshotBlock: section.fields.clients (array of per-client objects), defaultGroupBy, rendered as grouped table/cards. ClientSnapshotListEditor accordion. CaseStudiesBlock: section.fields.cases each {title, clientSummary, problemStatement, kpiImprovement, methodsTaken, challenges, impact, feedback, tags}. Public CaseStudyCard shows 3-field preview + accordion "More detail". CaseListEditor rebuilt with 8-field accordion per case.',
    businessRules: '- SkillsBlock falls back gracefully if skills array is empty (renders nothing).\n- ClientSnapshotBlock groupBy selector (industry/capability/revenue) is UI state only — not persisted to the section.\n- CaseStudiesBlock is backward-compatible: old fields (clientName, outcome, description) still render in a legacy fallback path.\n- Tags field is comma-separated and rendered as gold chip spans.',
    acceptanceCriteria: '- Skills template in section modal → adds section with SkillsBlock rendered.\n- Skill groups with levels display colored chips.\n- Client Snapshot groupBy selector changes the rollup view.\n- Case Studies accordion: collapsed shows title + clientSummary + kpiImprovement, expanded shows all 8 fields.\n- Legacy case study shapes (with clientName/outcome/description) still render.',
    ...DEPLOYED,
    hoursClaudeEst: 1,
  },
  {
    capabilitySlug: 'multi-tenant-cms',
    externalRef: 'FEAT.2026-06-09.9 · section-action-buttons',
    title: 'Configurable section action buttons — visible and editable for every section',
    summary: 'Every section now has a "Action Buttons" card in the EditorPane, always visible regardless of section type. Admins can add, edit (label/href/style), and remove CTA buttons via SectionActionsEditor. Buttons are stored in section.fields.actions as [{label, href, style}]. Block renderers (Timeline, Hero, and any block that reads actions) consume this array. The Timeline block no longer hardcodes "View Resume" — it falls back to legacy cta1/cta2 fields if actions is empty.',
    userStory: 'As a member admin, I want to control the buttons on every section of my site from the editor — not hunt through JSON or wonder why a button appeared — so I can drive visitors to take specific actions from each piece of content.',
    requirementDetail: 'SectionActionsEditor component in EditorPane: table-like row editor, each row = label input + href input + style select (gold/navy/outline-dark/outline-light/teal). Add row button. Remove (✕) per row. Wired into the field dispatch as k==="actions". Actions card rendered ABOVE Content Fields in EditorPane (not inside). TimelineBlock updated to read section.fields.actions array first, then fallback to cta1/cta2. HeroBlock already uses cta1/cta2 — its actions compatibility can be added in a future pass.',
    businessRules: '- An empty actions array renders nothing (no buttons) — no default buttons are injected by the renderer.\n- Legacy cta1/cta2 fields are preserved and still render as fallback when actions is absent or empty.\n- Style options: gold, navy, outline-dark, outline-light, teal — matching the sb-btn class variants.\n- The Actions card is ALWAYS shown in the editor, even for section types that don\'t currently render buttons (forward-compatible).',
    acceptanceCriteria: '- EditorPane shows "Action Buttons" card for every section type.\n- Adding a button with label "Contact Us" and href "#contact" → section.fields.actions contains the entry.\n- Timeline section with actions defined renders the configured buttons instead of hardcoded ones.\n- Removing all action rows → actions: [] → no buttons rendered.\n- Legacy Timeline sections with cta1/cta2 (no actions) still render their buttons.',
    ...DEPLOYED,
    hoursClaudeEst: 0.5,
  },
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'FEAT.2026-06-09.10 · member-json-store',
    title: 'member_json_store — generic key-value store for member settings',
    summary: 'New table member_json_store (user_id, key, data, updated_at) with PK (user_id, key). Created idempotently in db.js bootstrap. Provides a flexible storage layer for member-specific settings that don\'t fit the draft/published content model or the legacy member_configs CHECK constraint. First consumer: resume_presets. Future consumers might include notification preferences, UI layout preferences, agent conversation history summaries.',
    userStory: 'As a platform engineer, I want a generic key-value store for member JSON settings so I can ship new member-facing features without modifying the DB schema for every new preference type.',
    requirementDetail: 'New table created with idempotent CREATE TABLE IF NOT EXISTS in db.js bootstrap(). Columns: user_id (FK→users, ON DELETE CASCADE), key TEXT, data TEXT DEFAULT \'{}\', updated_at BIGINT. PK is (user_id, key). Index on user_id. Upsert pattern: INSERT ... ON CONFLICT (user_id, key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at.',
    businessRules: '- No CHECK constraint on key — any string is valid.\n- Data is always stored as JSON string; consumers are responsible for parse/stringify.\n- ON DELETE CASCADE ensures cleanup when a user is deleted.\n- No row-level security beyond being behind the member auth middleware.',
    acceptanceCriteria: '- db bootstrap runs without error on a database that already has the table (idempotent).\n- PUT /api/members/me/resume-presets stores to this table.\n- GET /api/members/me/resume-presets reads from this table.\n- Deleting a user cascades and removes their member_json_store rows.',
    kind: 'infrastructure',
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

    const payload = { ...rest, capabilityGroupId: groupId || null, source: 'bulk_script' };
    const result = await createItem(cookie, payload);
    console.log(`  CREATED [${result.id}]: ${rest.title.slice(0, 70)}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
