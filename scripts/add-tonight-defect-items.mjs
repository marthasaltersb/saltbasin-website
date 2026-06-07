// Defect entries for the bugs Betsy flagged 2026-06-07 ahead of member onboarding.
//
// Three of these (DEF.1, DEF.2, DEF.5) are being fixed in the same commit and
// land here as status='completed' to provide an audit trail. The remaining
// ones are status='pending' with full requirement detail so the QA loop can
// verify them once fixed.
//
// Idempotent by externalRef — re-runs skip items already present.
//
// Usage: node scripts/add-tonight-defect-items.mjs

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

const DEFECT_COMMON = {
  kind: 'defect',
  priority: 'p0',
  deployedGithub: false,
  deployedRender: false,
  deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: true },
};

const ITEMS = [
  // ───────── DEF.1 — "My Profile" rename (fixed in same commit) ─────────
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'DEF.2026-06-07.1',
    title: 'Admin nav refactor renamed "My Profile" to "Content / My Site"',
    summary: 'The data-driven nav refactor (v0.9) accidentally renamed the member\'s primary editing surface from "My Profile" to "Content" / "My Site", obscuring the product use case.',
    userStory: 'As a member building my personal brand site, I want the editing surface to be labeled "My Profile" so it\'s clear this is where I represent myself, not generic CMS content.',
    requirementDetail:
      'The pre-v0.9 admin tab was "My Profile". When the admin nav became data-driven (admin_nav stored in config_state), the seeded default labeled the view "Content" with a "My Site" tab inside it. Restore "My Profile" everywhere: the seeded default, the hardcoded member 2-tab strip, and a migration that updates the existing config_state.admin_nav row in production to relabel.',
    businessRules:
      '- Member sees: TabToggle items [{ label: "My Profile" }, { label: "Config" }].\n- Admin sees: top view labeled "My Profile" (single tab so no sub-strip needed).\n- Migration only relabels — does NOT touch any other manual edits to the nav structure.',
    acceptanceCriteria:
      'Given a member is logged in\nWhen the admin shell loads\nThen the first tab is labeled "My Profile"\nAnd there is no tab labeled "Content" or "My Site".',
    processSteps: '1. Log in as a member at /member → 2. Confirm top tab reads "My Profile" → 3. Log in as admin at /admin → 4. Confirm top view label reads "My Profile".',
    status: 'completed', ...DEFECT_COMMON,
    tags: ['defect', 'pre-onboarding-launch', 'admin-nav', 'naming'],
  },

  // ───────── DEF.2 — Config tab confusion (intro added in same commit) ─────────
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'DEF.2026-06-07.2',
    title: 'Config tab had no top-of-panel explanation of what it does',
    summary: 'New members open the Config tab and have no clue what each card is for or why Config is separate from My Profile.',
    userStory: 'As a new member opening the Config tab for the first time, I want a one-paragraph intro telling me what I configure here vs in My Profile, so I don\'t fear breaking my profile by editing the wrong thing.',
    requirementDetail:
      'Add an intro card at the top of ConfigPanel, before the existing cards. Member-scoped wording explains it controls how the profile looks (brand colors, social links, footer) — NOT the content. Admin-scoped wording explains it controls saltbasin.net itself. Both versions distinguish draft vs published.',
    businessRules:
      '- Intro card uses a tinted background so it reads as guidance, not as a field group.\n- Wording explicitly references "My Profile" by name to reinforce the rename.\n- Mentions that changes go to draft until published.',
    acceptanceCriteria:
      'Given a member opens Config\nWhen the page loads\nThen the first card explains that Config is for how their profile looks (not its content)\nAnd references "My Profile" as the place for content.',
    processSteps: '1. Open Config tab as member → 2. Read intro card → 3. Understand difference between Config and My Profile without asking.',
    status: 'completed', ...DEFECT_COMMON,
    tags: ['defect', 'pre-onboarding-launch', 'config', 'docs'],
  },

  // ───────── DEF.3 — Member nav scoping (defensive verification) ─────────
  {
    capabilitySlug: 'security-and-data',
    externalRef: 'DEF.2026-06-07.3',
    title: 'Members must never see Platform Lifecycle Management or Customer Relationship Management views',
    summary: 'A regression here would expose Backlog, QA, Leads, and Net Works tabs to members — leaking platform internals and other tenants\' data.',
    userStory: 'As an admin, I want to be 100% sure that members logging into /member only see their own profile + config tabs, so the platform never leaks Backlog / QA / Leads / Net Works to non-admins.',
    requirementDetail:
      'AdminShell renders with scope="member" when MemberDashboard mounts it. When isMember=true, the hardcoded 2-tab strip [My Profile, Config] is used — the data-driven admin_nav (which contains PLM and CRM) is NOT rendered for members. Verify this end-to-end with a fresh non-admin login.',
    businessRules:
      '- Members see exactly 2 tabs: My Profile, Config.\n- Members do NOT see Platform Lifecycle Management.\n- Members do NOT see Customer Relationship Management.\n- Even if a member crafts a URL to /admin, RequireAdmin redirects them to /admin/login or /member.',
    acceptanceCriteria:
      'Given I sign up as a new member\nWhen I land on /member\nThen I see exactly 2 tabs: "My Profile" and "Config"\nAnd no tab labeled Backlog, QA, Leads, Net Works, or any PLM/CRM view.',
    processSteps: '1. Sign up at /signup → 2. Land on /member → 3. Verify only 2 tabs visible → 4. Manually visit /admin → 5. Confirm redirect to /admin/login or /member.',
    status: 'pending', ...DEFECT_COMMON,
    tags: ['defect', 'pre-onboarding-launch', 'security', 'scoping'],
  },

  // ───────── DEF.4 — Resume roles hardcoded slots ─────────
  {
    capabilitySlug: 'multi-tenant-cms',
    externalRef: 'DEF.2026-06-07.4',
    title: 'Resume section uses fixed role1 / role2 slots — members with >2 roles cannot fit',
    summary: 'The default member site\'s Resume section in defaultMemberSite.js uses role1, role1Desc, role2, role2Desc — locked to 2 roles. Real operators have 5-15 roles across their career.',
    userStory: 'As a member with a real career, I want to add as many roles to my resume as I need, with start/end dates and per-role descriptions, so my profile reflects my actual experience.',
    requirementDetail:
      'Change the Resume section\'s fields from individual role1/role2 keys to a single roles array: roles: [{title, company, start, end, description, current?}]. Block renderer iterates the array. EditorPane gets a dynamic list editor for the roles field (add row at bottom, delete per row, reorder via up/down). Backwards-compat: if a profile still has role1/role2 (already-stored member data), the renderer also reads those as a fallback so no existing data is lost.',
    businessRules:
      '- Default member site seeds 2 placeholder roles in the array so the section isn\'t empty on first publish.\n- Adding a new role appends to the array.\n- Deleting a role removes that index, no reflow needed.\n- "Current" role (no end date) renders as "(present)" in the public view.\n- Existing data in role1/role2 keys still renders correctly via fallback (we migrate on first edit, not on first read).',
    acceptanceCriteria:
      'Given I have 3 existing roles in my resume\nWhen I click "+ Add role"\nThen a 4th empty row appears in the editor\nAnd publishing renders all 4 roles on my /u/:slug/about page.',
    processSteps: '1. Open My Profile → 2. Edit Resume section → 3. See list of roles → 4. Add a new role with title + company + dates + description → 5. Save → 6. Publish → 7. Visit public profile → 8. Confirm new role appears.',
    status: 'completed', ...DEFECT_COMMON,
    tags: ['defect', 'pre-onboarding-launch', 'dynamic-sections', 'resume', 'related-to-pb-1'],
  },

  // ───────── DEF.5 — Patch notes not auto-generated on deploy ─────────
  {
    capabilitySlug: 'requirements-mgmt',
    externalRef: 'DEF.2026-06-07.5',
    title: 'Deploying does not auto-generate a patch_notes entry',
    summary: 'The v0.9 deploy shipped without a corresponding patch notes entry until I noticed and pushed a follow-up. Manual curation in server/data/patchNotes.js is easy to forget.',
    userStory: 'As Betsy shipping a release, I want a patch notes entry to be created (or proposed for my approval) as part of the deploy flow, so the public release log never silently lags behind the live code.',
    requirementDetail:
      'Combine with TD.2 (migrate patch_notes from code to DB) and the brain-dump reconciler pattern: when a deploy completes, an agent reads the diff + commit messages + recently-deployed backlog items and proposes a structured patch_notes entry in the existing shape. Admin reviews + approves in a new Patch Notes editor panel (sub-tab under System or Backlog). Entry lands in DB and auto-publishes to /output/patch-notes. Short-term guardrail: a CI check that warns if a code commit doesn\'t touch patchNotes.js.',
    businessRules:
      '- Proposals respect the existing patchNotes structure (version, name, date, summary, sections[]).\n- Version number auto-increments from the latest entry.\n- Admin approval required before publication — never auto-publish without review.\n- Audit log entry on each publication so we know who approved what.',
    acceptanceCriteria:
      'Given I push code to main\nWhen Render finishes deploying\nThen a draft patch_notes entry exists awaiting my approval\nAnd I can publish it from the admin in under 30 seconds.',
    processSteps: '1. Push code → 2. Render deploys → 3. Open Patch Notes editor → 4. Review proposed entry → 5. Edit if needed → 6. Publish → 7. /output/patch-notes shows the entry.',
    status: 'pending', ...DEFECT_COMMON,
    tags: ['defect', 'patch-notes', 'release-process', 'related-to-td-2'],
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
      console.log(`  · skip "${item.title}" (already present)`);
      skipped += 1; continue;
    }
    const grp = (snap.groups || []).find((g) => g.slug === item.capabilitySlug);
    const payload = { ...item, capabilityId: grp?.id ?? null };
    delete payload.capabilitySlug;
    const r = await createItem(cookie, payload);
    console.log(`  ✓ #${r.id} · ${item.title}`);
    inserted += 1;
  }
  console.log('');
  console.log(`Done. ${inserted} inserted, ${skipped} skipped. Total target: ${ITEMS.length}.`);
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
