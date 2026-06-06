// One-shot: insert backlog items for tonight's Session 2 + Phase A work.
//
// Idempotent: each item has a unique external_ref. If the ref already
// exists, the script skips that item.
//
// Usage: node scripts/add-session2-backlog-items.mjs

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

const DEPLOYED_ALL_REL_BOTH = {
  deployedGithub: true, deployedRender: true, deployedNetlify: true,
  deployRelevance: { github: true, render: true, netlify: true },
};
const DEPLOYED_BACKEND_REL_BACKEND = {
  deployedGithub: true, deployedRender: true, deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: false },
};

function cost(hClaude, hBetsy) {
  const total = (hClaude || 0) + (hBetsy || 0);
  return Math.round(total * 60 * 0.02 * 100) / 100;
}
function trad(hClaude, hBetsy) {
  const total = (hClaude || 0) + (hBetsy || 0);
  return Math.round(total * 2.5 * 150 * 100) / 100;
}
function workSplit(hClaude, hBetsy) {
  const total = (hClaude || 0) + (hBetsy || 0);
  return total ? Math.round((hClaude / total) * 100) : null;
}

const ITEMS = [
  // Session 2 — JIRA Phase A
  {
    capabilitySlug: 'requirements-mgmt',
    externalRef: 'S2 · JIRA Phase A · commit 69ae9c2',
    title: 'JIRA Phase A — read-only import',
    summary: 'Admin can connect a JIRA Cloud project and pull issues into the backlog as a "JIRA Mirror" capability group.',
    userStory: 'As Betsy, I want to sync my JIRA backlog into the Salt Basin admin so I can plan in one place and not maintain two separate lists.',
    requirementDetail:
      'New jira_config singleton table stores the Atlassian base URL, email, API token, and project key. Admin Config card lets the admin save credentials, Test the connection (calls /myself + /project), and run Import. Issues come back via JQL, are mapped status/priority/issuetype to backlog fields, and inserted into a new "JIRA Mirror" capability group. Idempotent by jira_issue_key — re-running updates instead of duplicating.',
    businessRules:
      '- Admin-only. No other roles see JIRA config.\n- API token is never returned to the client (4+4 preview only).\n- Status maps: done→completed, indeterminate→in_progress, new→pending.\n- Priority maps: highest/critical→p0, high→p1, medium→p2, low→p3.\n- Atlassian Document Format (ADF) descriptions flatten to plain text for requirement_detail.',
    designSpec: 'JIRA Integration card in admin Config panel between New-Lead Notifications and BestyStaff cards. Token field shows "Saved: XXXX…XXXX (leave blank to keep)" once set. Test/Import buttons disabled until prerequisites met.',
    acceptanceCriteria:
      'Given I am admin and have a valid JIRA Cloud token\nWhen I save the config and click Test\nThen I see "✓ Authenticated as <my name>"\n\nWhen I click Import\nThen all project issues appear under a "JIRA Mirror" capability group in the Backlog tab.',
    processSteps: '1. Admin opens Config → 2. Enters base URL + email + token + project key → 3. Saves → 4. Tests → 5. Imports → 6. Issues appear in Backlog.',
    status: 'deployed', priority: 'p1', kind: 'feature',
    hoursClaude: 1.5, hoursBetsy: 0.2, activitiesClaude: 12, activitiesBetsy: 3,
    timeMinutes: 102, workSplitClaude: workSplit(1.5, 0.2),
    costUsdClaude: cost(1.5, 0.2), traditionalCostUsd: trad(1.5, 0.2),
    techStack: ['JIRA Cloud REST API v3', 'HTTP Basic auth', 'JQL', 'Atlassian Document Format flattener'],
    tags: ['jira', 'integration', 'session-2', 'phase-a'],
    ...DEPLOYED_ALL_REL_BOTH,
  },

  // Session 2 — Member Templates Phase A
  {
    capabilitySlug: 'multi-tenant-cms',
    externalRef: 'S2 · Templates Phase A · commit 69ae9c2',
    title: 'Member Templates Phase A — 3 starter templates seeded',
    summary: 'Three curated starter templates (Operator Profile / Consulting Practice / Coach-Speaker) live in the DB and apply via API. Gallery UX next session.',
    userStory: 'As a brand-new member, I want to pick a template that fits my archetype so I get a meaningful starting point instead of placeholder copy.',
    requirementDetail:
      'New member_templates table stores curated templates with full pages_preset + brand_kit + tagline + description. Three starters seeded: Operator Profile (Salt Basin default shape), Consulting Practice (service-led, navy + teal), Coach/Speaker (warmer, sage + gold). API exposes list / detail / seed (admin) / apply. Apply writes pages_preset to the member\'s draft + merges brand_kit into their config. Token interpolation ({NAME}, {SLUG}, {AUDIENCE} etc.) resolves from the member\'s profile.',
    businessRules:
      '- Templates are starting points; everything is editable after apply.\n- Apply replaces the member\'s current draft pages — they get a confirm dialog in the UX (Phase B).\n- Idempotent seed: slugs already present are skipped.\n- Token interpolation falls back to bracket placeholder if no context.',
    designSpec: 'Phase A is API-only. Phase B (next session) ships the gallery UX: preview-before-apply, archetype filter chips, brand kit color swatch row.',
    acceptanceCriteria:
      'Given I call POST /api/member-templates/seed as admin\nWhen the response returns\nThen exactly 3 starters are present in the DB\nAnd repeated calls do not duplicate.',
    processSteps: '1. Admin seeds templates once → 2. Member calls /apply with a slug → 3. Member\'s draft replaced with template content → 4. Member edits and publishes.',
    status: 'deployed', priority: 'p1', kind: 'feature',
    hoursClaude: 1.0, hoursBetsy: 0.1, activitiesClaude: 8, activitiesBetsy: 2,
    timeMinutes: 66, workSplitClaude: workSplit(1.0, 0.1),
    costUsdClaude: cost(1.0, 0.1), traditionalCostUsd: trad(1.0, 0.1),
    techStack: ['member_templates table', 'pages_preset JSON', 'brand_kit JSON', 'placeholder interpolation'],
    tags: ['templates', 'member', 'session-2', 'phase-a'],
    ...DEPLOYED_BACKEND_REL_BACKEND,
  },

  // Session 2 — Scrum Agent Phase A
  {
    capabilitySlug: 'requirements-mgmt',
    externalRef: 'S2 · Scrum Agent Phase A · commits 69ae9c2 + cd9ba5c',
    title: 'Scrum Agent Phase A — chat scaffold with real Claude responses',
    summary: 'Floating ✦ button inside Backlog opens a docked chat panel. Real Claude API calls with conversation persistence. Tool wiring (propose-and-approve) comes Session 3.',
    userStory: 'As Betsy planning sprints, I want a focused chat assistant inside my backlog so I can think through requirements without context-switching to a separate tool.',
    requirementDetail:
      'New agent_threads + agent_messages tables persist conversations. POST /api/agent/chat accepts a message + optional thread id, calls Claude (sonnet-4-5 default), stores both turns. Tools array is empty in Phase A — agent acknowledges that limit in its system prompt. Reads ANTHROPIC_API_KEY env first, falls back to member_configs.draft.integrations.anthropicKey. Frontend: right-side dock 380px wide with thread list, message bubbles, composer with ⌘+Enter shortcut, optimistic user-message UX.',
    businessRules:
      '- Admin-only access; member-side agent is a future concern.\n- Conversation persistence: thread id stored in localStorage, restored on panel open.\n- Anthropic key precedence: env > member config (BYO).\n- System prompt explicitly acknowledges Phase A constraints so the agent doesn\'t pretend to apply backlog changes.',
    designSpec: 'Right-side dock 380px. Header with Scrum Agent display title + Phase A eyebrow + "+ New" + ✕. Compact thread list (max 6 recent) below header. Messages scroll area. Composer fixed at bottom. User bubbles right-aligned gold-tinted; assistant bubbles left-aligned cream on dark.',
    acceptanceCriteria:
      'Given ANTHROPIC_API_KEY is set on Render\nWhen I send "Reply OK if you can read this"\nThen the agent returns "OK" within a few seconds\nAnd the thread + both turns persist in agent_messages.',
    processSteps: '1. Admin opens Backlog → 2. Clicks ✦ Scrum Agent → 3. Composes message → 4. ⌘+Enter sends → 5. Claude responds → 6. Conversation persists across reloads.',
    status: 'deployed', priority: 'p1', kind: 'feature',
    hoursClaude: 1.5, hoursBetsy: 0.25, activitiesClaude: 18, activitiesBetsy: 5,
    timeMinutes: 105, workSplitClaude: workSplit(1.5, 0.25),
    costUsdClaude: cost(1.5, 0.25), traditionalCostUsd: trad(1.5, 0.25),
    techStack: ['Anthropic Messages API', 'claude-sonnet-4-5', 'agent_threads + agent_messages tables', 'localStorage thread persistence'],
    tags: ['agent', 'ai', 'session-2', 'phase-a'],
    ...DEPLOYED_ALL_REL_BOTH,
  },

  // Phase A — Split divider
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'PA.1 · commit 3ed52c2',
    title: 'Adjustable + responsive Split view (drag-resize divider)',
    summary: 'Editor and preview panes are now draggable to any ratio between 20%/80% and 80%/20%. Persisted per browser, separately for admin vs member scope.',
    userStory: 'As anyone editing in Split view, I want to resize the editor and preview to fit my screen so the layout never feels lopsided.',
    requirementDetail:
      'New SplitDivider component (6px wide, gold-tinted) sits between editor and preview. Mouse-down arms drag; window mousemove updates splitRatio (clamped 0.2-0.8); mouse-up commits and persists to localStorage. Double-click resets to default 0.55. Removed previewPane\'s hardcoded 46% width + 420px floor; both panes now flex off the ratio. Ratio key is namespaced by scope so admin and member admin remember independently.',
    businessRules:
      '- Ratio clamped to 0.2-0.8 to prevent collapsing either pane.\n- Persisted in localStorage as `sb_admin_split_<scope>`.\n- Below the 900px mobile breakpoint, the existing @media stack-vertically rule takes over and the divider is hidden.',
    designSpec: '6px-wide handle, base color rgba(196,132,58,0.12), saturates to gold during drag. Inner 2px×36px grip indicator. Title attribute shows "Drag to resize · double-click to reset".',
    acceptanceCriteria:
      'Given I am on My Profile → Split view\nWhen I drag the divider left\nThen the editor pane shrinks and preview grows\nAnd refreshing the page restores my ratio.',
    processSteps: '1. Open Split view → 2. Drag divider → 3. Pane widths update → 4. Mouse-up persists → 5. Page reload restores.',
    status: 'deployed', priority: 'p1', kind: 'feature',
    hoursClaude: 0.75, hoursBetsy: 0.1, activitiesClaude: 7, activitiesBetsy: 1,
    timeMinutes: 51, workSplitClaude: workSplit(0.75, 0.1),
    costUsdClaude: cost(0.75, 0.1), traditionalCostUsd: trad(0.75, 0.1),
    techStack: ['React state + useRef + useEffect', 'window.mousemove/mouseup listeners', 'localStorage', 'CSS flex-basis'],
    tags: ['admin', 'ux', 'phase-a', 'split-view'],
    ...DEPLOYED_ALL_REL_BOTH,
  },

  // Phase A — Brand colors bug + admin palette
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'PA.2 + PA.3 · commits 0c352be + 3ed52c2',
    title: 'Brand colors bug fixed + Salt Basin admin palette wired to saltbasin.net',
    summary: 'Brand Colors card now visible to admin (was hidden behind isMember). Admin edits flow through publicConfig → recolor saltbasin.net public pages.',
    userStory: 'As Betsy, I want to set my own brand palette for saltbasin.net without code changes so I can iterate on the visual identity over time.',
    requirementDetail:
      'Removed the `{isMember && ...}` wrapper around the Brand Colors card so admin sees the editor. publicConfig() now includes config.brand. PublicSite injects a scoped <style> block on .sb-public-site-root applying overrides for --sb-navy / --sb-gold / --sb-cream / --sb-ivory. defaultConfig.brand seeded with Salt Basin canonical palette so the card lands populated on first open. Added "Reset to Salt Basin defaults" button.',
    businessRules:
      '- Scoped to .sb-public-site-root so admin chrome (/admin/*) stays canonical.\n- 6-char hex enforced by the picker.\n- Only applies after Publish (lives in published config).',
    designSpec: 'Same Brand Colors card design as member side. 4 hex inputs with native color pickers side-by-side. "Reset to Salt Basin defaults" button at the bottom.',
    acceptanceCriteria:
      'Given I am admin and set Accent to red\nWhen I publish and visit saltbasin.net\nThen gold elements (eyebrows, CTAs, gold rules) render in red\nAnd the admin chrome at /admin is unchanged.',
    processSteps: '1. Admin opens Config → 2. Brand Colors card → 3. Edit + Save → 4. Publish → 5. saltbasin.net recolors.',
    status: 'deployed', priority: 'p1', kind: 'feature',
    hoursClaude: 0.5, hoursBetsy: 0.1, activitiesClaude: 6, activitiesBetsy: 2,
    timeMinutes: 36, workSplitClaude: workSplit(0.5, 0.1),
    costUsdClaude: cost(0.5, 0.1), traditionalCostUsd: trad(0.5, 0.1),
    techStack: ['CSS custom properties', 'React inline <style> block', 'publicConfig sanitizer'],
    tags: ['admin', 'brand', 'phase-a', 'fix'],
    ...DEPLOYED_ALL_REL_BOTH,
  },

  // Phase A — Date pickers
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'PA.4 · commit 3ed52c2',
    title: 'Calendar date pickers for date-shaped fields in EditorPane',
    summary: 'Field keys ending in start / end / date / since / until / from / thru render as native <input type="date"> instead of free text.',
    userStory: 'As anyone editing a resume or career timeline, I want date fields to use a calendar picker so I do not have to type formatted strings.',
    requirementDetail:
      'EditorPane field rendering checks each field key against a regex matching common date suffixes. If matched, renders an HTML5 date input. toIsoDate() helper normalizes incoming values (ISO strings, loose date text like "Jan 2023") to YYYY-MM-DD; falls back to empty if unparseable. Image-field and long-text checks happen before the date check so they take precedence.',
    businessRules:
      '- Regex match: /(start|end|date|since|until|from|thru)(date)?$/i\n- Unparseable existing values become empty so the user can pick fresh.\n- Output format: YYYY-MM-DD (HTML5 standard).',
    designSpec: 'Native browser calendar widget. Inherits sb-input styling so visually consistent with text inputs.',
    acceptanceCriteria:
      'Given a section with a field key "role1Start"\nWhen I view the editor for that section\nThen I see a calendar picker, not a text input.',
    processSteps: '1. Edit a resume section → 2. Click a date field → 3. Calendar opens → 4. Pick a date → 5. Saves as YYYY-MM-DD.',
    status: 'deployed', priority: 'p2', kind: 'feature',
    hoursClaude: 0.3, hoursBetsy: 0.05, activitiesClaude: 3, activitiesBetsy: 1,
    timeMinutes: 21, workSplitClaude: workSplit(0.3, 0.05),
    costUsdClaude: cost(0.3, 0.05), traditionalCostUsd: trad(0.3, 0.05),
    techStack: ['HTML5 <input type="date">', 'Regex field detection', 'Date normalization helper'],
    tags: ['admin', 'editor', 'phase-a'],
    ...DEPLOYED_ALL_REL_BOTH,
  },

  // Hotfix — TDZ crash
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'Hotfix · commit c03db1d',
    title: 'Hotfix: TDZ crash in AdminShell (admin page wasn\'t loading)',
    summary: 'PA.1 introduced a useEffect that referenced `sidebarOpen` before its declaration → ReferenceError → blank admin page on every load.',
    userStory: 'As a defect: admin tab rendered blank because of a Temporal Dead Zone reference error in AdminShell.',
    requirementDetail:
      'The split-view useEffect listed `sidebarOpen` in its deps array. `sidebarOpen` was declared further down in the component body with `useState`. JavaScript const/let bindings exist in their temporal dead zone until their declaration line is reached — so when React evaluated the deps array on render, it threw ReferenceError: Cannot access "sidebarOpen" before initialization, crashing AdminShell entirely.',
    businessRules:
      '- Hook ordering: declarations whose values are read in a deps array MUST come before the useEffect that references them.\n- An inline comment now flags the requirement so future edits do not regress.',
    designSpec: 'N/A — runtime error fix.',
    acceptanceCriteria:
      'Given I navigate to /admin\nWhen the page loads\nThen AdminShell renders without ReferenceError in the console\nAnd the admin tabs are functional.',
    processSteps: 'Reorder: sidebarOpen + currentPageKey + currentSectionId now declared before the splitRatio block that depends on sidebarOpen.',
    status: 'deployed', priority: 'p0', kind: 'defect',
    hoursClaude: 0.25, hoursBetsy: 0.05, activitiesClaude: 4, activitiesBetsy: 1,
    timeMinutes: 18, workSplitClaude: workSplit(0.25, 0.05),
    costUsdClaude: cost(0.25, 0.05), traditionalCostUsd: trad(0.25, 0.05),
    techStack: ['React hooks order', 'JavaScript TDZ semantics'],
    tags: ['hotfix', 'defect', 'phase-a', 'regression'],
    ...DEPLOYED_ALL_REL_BOTH,
  },

  // Closeout — Patch Notes output
  {
    capabilitySlug: 'requirements-mgmt',
    externalRef: 'Closeout · this commit',
    title: 'Patch Notes output (/output/patch-notes)',
    summary: 'New print-friendly output rendering the curated release log. Wired into the Backlog → Outputs catalog.',
    userStory: 'As Betsy preparing stakeholder updates, I want a clean release-log artifact I can share so people see the cadence and quality of what shipped.',
    requirementDetail:
      'server/data/patchNotes.js holds the curated release log as a structured array (version + date + name + summary + sections[{heading, items[]}]). GET /api/backlog/patch-notes returns the list newest-first. PatchNotesOutput component at /output/patch-notes renders each release as a card with version eyebrow, display title, "Latest" badge on the newest, summary paragraph, and color-coded section cards (New / Changed / Fixed / Behind the scenes). Admin-only, print-friendly via the same OutputFrame.',
    businessRules:
      '- Newest release first.\n- "Latest" badge only on the first release.\n- Section headings color-coded: New=green, Changed=gold, Fixed=teal, Behind the scenes=dusty, Known issues=red.\n- New releases added by appending to RELEASES in patchNotes.js.',
    designSpec: 'OutputFrame chrome. Hero with display title "Patch Notes" + summary. Release cards separated by gold-rule lines, breakInside: avoid for clean printing. Section cards color-tinted per heading type.',
    acceptanceCriteria:
      'Given I am admin\nWhen I visit /output/patch-notes\nThen I see every release in reverse chronological order\nAnd I can print to a clean letter-sized PDF.',
    processSteps: '1. Future release → append entry to patchNotes.js → 2. Backend serves it → 3. Output page renders → 4. Print or share.',
    status: 'deployed', priority: 'p1', kind: 'feature',
    hoursClaude: 0.5, hoursBetsy: 0.1, activitiesClaude: 7, activitiesBetsy: 2,
    timeMinutes: 36, workSplitClaude: workSplit(0.5, 0.1),
    costUsdClaude: cost(0.5, 0.1), traditionalCostUsd: trad(0.5, 0.1),
    techStack: ['React + OutputFrame', 'Static structured data file', 'Print CSS'],
    tags: ['backlog', 'outputs', 'release-log'],
    ...DEPLOYED_ALL_REL_BOTH,
  },
];

(async () => {
  console.log(`→ ${BASE}`);
  const cookie = await login();
  console.log('✓ logged in');

  const snap = await getBacklog(cookie);
  const existingRefs = new Set((snap.items || []).map((it) => it.externalRef).filter(Boolean));
  console.log(`  · ${existingRefs.size} existing items with external_ref`);

  let inserted = 0, skipped = 0;
  for (const item of ITEMS) {
    if (existingRefs.has(item.externalRef)) {
      console.log(`  · skip "${item.title}" (ref already present)`);
      skipped += 1;
      continue;
    }
    // Map capabilitySlug to capabilityId from existing groups
    const grp = (snap.groups || []).find((g) => g.slug === item.capabilitySlug);
    const payload = { ...item, capabilityId: grp?.id ?? null };
    delete payload.capabilitySlug;
    const r = await createItem(cookie, payload);
    console.log(`  ✓ inserted "${item.title}" → #${r.id}`);
    inserted += 1;
  }
  console.log('');
  console.log(`Done. ${inserted} inserted, ${skipped} skipped.`);
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
