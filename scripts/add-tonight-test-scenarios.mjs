// Test scenarios for everything I've asked Betsy to verify during the
// 2026-06-07 session (the QA + admin-nav + member-signup builds).
//
// Each scenario has Given/When/Then-style steps with explicit expected
// outcomes so the tester can mark pass/fail/blocked per step. Failed steps
// auto-create defect backlog_items linked back to the scenario (and to the
// primary feature) via the QA flow we built.
//
// Idempotent by title — re-runs skip scenarios already present with the
// same title. Safe to run more than once.
//
// Usage: node scripts/add-tonight-test-scenarios.mjs

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
async function getScenarios(cookie) {
  const res = await fetch(`${BASE}/api/qa/scenarios`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`getScenarios failed: ${res.status}`);
  return res.json();
}
async function createScenario(cookie, payload) {
  const res = await fetch(`${BASE}/api/qa/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createScenario failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Each scenario carries a capabilitySlug (resolved to capability_id) and an
// optional list of featureExternalRefs (resolved to backlog_item_ids via the
// existing backlog items' external_ref column). The first feature in the
// list becomes the primary unless `primaryExternalRef` is set explicitly.
const SCENARIOS = [
  // ───────── Admin nav structure + scoping ─────────
  {
    title: 'Tonight verify: Admin sees PLM / CRM / System view groupings',
    capabilitySlug: 'admin-experience',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Render has redeployed past commit 2ba3870 (My Profile rename + relabel migration). You are logged in as admin at /admin.',
    steps: [
      { action: 'Look at the topbar nav tabs', expectedOutcome: 'See exactly four view labels: My Profile, Platform Lifecycle Management, Customer Relationship Management, System' },
      { action: 'Click Platform Lifecycle Management', expectedOutcome: 'A sub-tab row appears below the topbar with two tabs: Backlog and QA' },
      { action: 'Click Customer Relationship Management', expectedOutcome: 'Sub-tab row shows Leads and Net Works' },
      { action: 'Click System', expectedOutcome: 'Sub-tab row shows only Config (or no sub-tab strip if only one tab)' },
      { action: 'Click My Profile', expectedOutcome: 'Content editor opens (Sidebar + EditorPane + PreviewPane); the tab label reads "My Profile" not "Content" or "My Site"' },
    ],
  },
  {
    title: 'Tonight verify: Member sees ONLY My Profile and Config (no PLM / CRM tabs)',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'A test member account exists (sign up at /signup if needed). You are NOT logged in as admin.',
    steps: [
      { action: 'In an incognito browser window, navigate to /login and sign in as the test member', expectedOutcome: 'Land on /member with a logged-in session' },
      { action: 'Look at the topbar nav tabs', expectedOutcome: 'See exactly two tab labels: My Profile and Config' },
      { action: 'Confirm no other tabs are visible', expectedOutcome: 'Platform Lifecycle Management, Customer Relationship Management, System, Backlog, QA, Leads, Net Works are all ABSENT' },
      { action: 'Manually navigate to /admin', expectedOutcome: 'Redirected to /login or /member — never gets into the admin shell' },
    ],
  },
  {
    title: 'Tonight verify: Config tab opens with explanation card describing what it does',
    capabilitySlug: 'admin-experience',
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Render redeployed past commit 2ba3870. You are signed in.',
    steps: [
      { action: 'As member: click Config tab', expectedOutcome: 'Top of panel shows a gold-bordered intro card titled "About Config" with member-scoped wording referencing My Profile' },
      { action: 'As admin: click System → Config', expectedOutcome: 'Top of panel shows the same intro card but with admin-scoped wording about saltbasin.net' },
      { action: 'Read the intro paragraph', expectedOutcome: 'Wording clarifies what Config configures vs what My Profile contains' },
    ],
  },

  // ───────── QA system itself (meta) ─────────
  {
    title: 'Tonight verify: Add Scenario flow with multi-select linked features',
    capabilitySlug: 'requirements-mgmt',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Logged in as admin. Render past commit ba9fe8c.',
    steps: [
      { action: 'Navigate Platform Lifecycle Management → QA', expectedOutcome: 'QA panel loads with capability rail + empty-state or existing scenario list' },
      { action: 'Click + Add Scenario', expectedOutcome: 'Modal opens with title, summary, preconditions, capability, linked features (multi-select with search), env scope, priority, and steps list' },
      { action: 'Pick a capability from the dropdown', expectedOutcome: 'Linked-features list filters to deployed feature backlog items in that capability' },
      { action: 'Check 2-3 features in the linked-features list', expectedOutcome: 'Each checked row shows a "set primary" radio; the first checked becomes primary by default with a ★' },
      { action: 'Change the primary by clicking another row\'s radio', expectedOutcome: 'The ★ moves; only one feature is primary at a time' },
      { action: 'Add 2 steps with action + expected outcome', expectedOutcome: 'Step rows appear with numbered prefixes' },
      { action: 'Click Save Scenario', expectedOutcome: 'Modal closes; new scenario appears in the list with the right capability, env scope, and priority chips' },
      { action: 'Click the new scenario', expectedOutcome: 'Side drawer opens showing the scenario detail, linked features (★ next to the primary), steps, and an empty run history' },
    ],
  },
  {
    title: 'Tonight verify: Log Test Run modal captures per-step verdicts and auto-creates defects on fail',
    capabilitySlug: 'requirements-mgmt',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'A scenario with at least 2 steps exists. The scenario has a primary linked feature. Logged in as admin.',
    steps: [
      { action: 'Open the scenario drawer and click Log Test Run', expectedOutcome: 'Modal opens with env selector (test / prod), per-step pass/fail/blocked radios, per-step notes + evidence URL inputs, and an overall notes box' },
      { action: 'Mark all steps as Pass and submit', expectedOutcome: 'Modal closes; toast "Run logged"; drawer\'s run history shows a new run with overallResult=pass' },
      { action: 'Log a second run; mark one step Fail with a note', expectedOutcome: 'Modal warns that N defects will be created; on submit toast reads "Run logged · 1 defect created in backlog"' },
      { action: 'Navigate to Backlog tab', expectedOutcome: 'A new kind=defect item appears, titled "Defect — <scenario> — step N", parented under the scenario\'s primary feature, tagged with env-<env> and run-<runId>' },
      { action: 'Click into the defect', expectedOutcome: 'Its parent_id is the primary feature; test_scenario_id is the scenario id' },
    ],
  },

  // ───────── Resume dynamic roles ─────────
  {
    title: 'Tonight verify: Resume section uses a dynamic add/remove roles list',
    capabilitySlug: 'multi-tenant-cms',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'A test member account exists with the default starter site. Logged in as that member.',
    steps: [
      { action: 'My Profile → About page → click the Resume section in the sidebar', expectedOutcome: 'EditorPane loads with the section\'s fields; the Resume area shows a list-of-rows editor labeled "Roles (N)" NOT individual role1/role2 inputs' },
      { action: 'Click "+ Add role"', expectedOutcome: 'A new empty role row appears at the bottom with inputs for Title, Company, start date, end date, Current checkbox, and Description' },
      { action: 'Check the Current checkbox on one role', expectedOutcome: 'End-date input becomes disabled; on the public profile this role will render as "Present"' },
      { action: 'Click the ↑ button on a non-first role', expectedOutcome: 'The role moves up; reorder persists after Save' },
      { action: 'Click × on a role and confirm', expectedOutcome: 'The role disappears from the editor; no error' },
      { action: 'Save then Publish; visit /u/<your-slug>/about', expectedOutcome: 'Public Resume section renders all your roles in their reordered order with title · company on one line, date range below, description paragraph beneath' },
    ],
  },

  // ───────── Patch notes ─────────
  {
    title: 'Tonight verify: Patch notes show v0.11 at the top and all older entries still appear',
    capabilitySlug: 'requirements-mgmt',
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Render redeployed past commit 621e3dc.',
    steps: [
      { action: 'Visit /output/patch-notes', expectedOutcome: 'Page loads; first entry is v0.11 "A real member sign-up process"' },
      { action: 'Scroll down', expectedOutcome: 'See v0.10, v0.9, v0.8, ..., v0.1 in descending order — none are missing' },
      { action: 'Confirm v0.11 mentions reCAPTCHA, convert-to-member, password reset, email recovery', expectedOutcome: 'All four show under New / Behind the scenes' },
    ],
  },

  // ───────── Login + signup routes ─────────
  {
    title: 'Tonight verify: /login is the canonical sign-in URL; /admin/login still works as alias',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Render redeployed past commit 762f424.',
    steps: [
      { action: 'Visit /login in a fresh browser', expectedOutcome: 'Sign-in form renders with title "Sign In" (not "Admin Login")' },
      { action: 'Visit /admin/login', expectedOutcome: 'Same form renders (back-compat alias)' },
      { action: 'Go to the home page (saltbasin.net) and look at top-right', expectedOutcome: 'Sign In button is visible' },
      { action: 'Click the Sign In button', expectedOutcome: 'URL bar goes to /login, NOT /admin/login' },
      { action: 'Sign in as admin', expectedOutcome: 'Redirects to /admin' },
      { action: 'Sign out and sign in as member', expectedOutcome: 'Redirects to /member (role-aware redirect)' },
    ],
  },
  {
    title: 'Tonight verify: Forgot password? — email link → set new password → sign in',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'You can receive email at an address that\'s a real user in the system. RECAPTCHA_SECRET_KEY may be unset (no-op) or set.',
    steps: [
      { action: 'Visit /login and click "Forgot password?"', expectedOutcome: 'Form switches to "Reset password" mode asking for email' },
      { action: 'Enter your email and click "Send reset link"', expectedOutcome: 'Screen swaps to "Check your email" with text explaining the link expires in 1 hour' },
      { action: 'Open your inbox', expectedOutcome: 'Email arrives from saltbasin.net with a reset link of the shape /reset/<token>' },
      { action: 'Click the link', expectedOutcome: '/reset/:token page loads with "Set a new password" + two password inputs' },
      { action: 'Type a new 8+ char password, type the same in the confirm box, click "Update password"', expectedOutcome: 'Success screen: "Password updated" + "Sign in" button' },
      { action: 'Click Sign in → enter the NEW password', expectedOutcome: 'Login succeeds, role-aware redirect happens' },
      { action: 'Try the OLD password', expectedOutcome: 'Login fails (old password no longer valid)' },
    ],
  },
  {
    title: 'Tonight verify: Forgot password? — non-existent email still returns success (anti-enumeration)',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: '—',
    steps: [
      { action: 'Visit /login → Forgot password? → enter a clearly-not-registered email like never-existed-12345@example.com', expectedOutcome: 'Screen still shows the same "Check your email" success state (no error)' },
      { action: 'Check the inbox of that fake address (or use a catchall)', expectedOutcome: 'No email is sent — server matched no user, but the client got 200 to defeat enumeration' },
    ],
  },
  {
    title: 'Tonight verify: Forgot your email? — phone lookup sends reminder to the matched user',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'A test lead exists with a phone number AND has been converted to a member. You know the email on that member.',
    steps: [
      { action: 'Visit /login → click "Forgot your email?"', expectedOutcome: 'Form switches to phone-entry mode' },
      { action: 'Enter the phone number from the matching lead and submit', expectedOutcome: 'Generic "Check your email" success screen' },
      { action: 'Check the inbox of the matched member', expectedOutcome: 'Email arrives saying "The account you\'re looking for is X@Y.com"' },
      { action: 'Submit a phone number with no matching lead', expectedOutcome: 'Same generic success screen — no email sent (anti-enumeration)' },
    ],
  },
  {
    title: 'Tonight verify: Password reset deletes all existing sessions for the user',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'You can sign in as the same user from two browsers (or browser + incognito).',
    steps: [
      { action: 'Sign in as a test user in Browser A', expectedOutcome: 'Land in their dashboard' },
      { action: 'Sign in as the same user in Browser B', expectedOutcome: 'Same user is logged in in both browsers' },
      { action: 'In Browser C, do the Forgot password flow for that user and set a new password', expectedOutcome: 'Password reset completes' },
      { action: 'Reload Browser A', expectedOutcome: 'Session is gone — redirected to /login (existing session was invalidated)' },
      { action: 'Reload Browser B', expectedOutcome: 'Same — session invalidated, redirected to /login' },
    ],
  },

  // ───────── Lead view + Convert to Member ─────────
  {
    title: 'Tonight verify: Lead URL requires password when accessed by non-admin (incognito)',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'A test lead exists at /lead/<publicId> and you know its password.',
    steps: [
      { action: 'Open an incognito browser window (no admin cookie)', expectedOutcome: 'Fresh session, no auth state' },
      { action: 'Navigate to /lead/<publicId>', expectedOutcome: 'Page shows "Private lead record" + password prompt — NOT the lead data' },
      { action: 'Enter wrong password and submit', expectedOutcome: 'Inline error "incorrect password"; page stays on prompt' },
      { action: 'Enter correct password and submit', expectedOutcome: 'Lead record loads with email, phone, source, activity, emails, intake answers' },
      { action: 'In a normal (non-incognito) admin window, visit the same /lead/<publicId>', expectedOutcome: 'Loads directly without prompt — admins bypass the lead password (by design)' },
    ],
  },
  {
    title: 'Tonight verify: Convert to Member CTA + password confirmation modal works end-to-end',
    capabilitySlug: 'lead-capture',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'You have a lead authenticated in your browser via the password prompt. The lead has an email and has NOT been converted yet.',
    steps: [
      { action: 'On the authed lead view, scroll to below the summary block', expectedOutcome: 'Gold-bordered CTA card shows "I know you love it / Go ahead and convert to member" with a "Convert to Member ↗" button' },
      { action: 'Click "Convert to Member ↗"', expectedOutcome: 'Modal opens asking to re-enter the lead password as confirmation' },
      { action: 'Type the WRONG password and submit', expectedOutcome: 'Inline error "incorrect password"; modal stays open' },
      { action: 'Type the CORRECT password and submit', expectedOutcome: 'Brief "Converting…" state, then redirect to /member with logged-in member session' },
      { action: 'You land in the member dashboard', expectedOutcome: 'AdminShell renders in member scope: "My Profile" + "Config" tabs only, default starter site is editable' },
      { action: 'Sign out and try to access /lead/<original publicId> again', expectedOutcome: 'Lead record still exists; CTA is replaced by a green "This lead has been converted" strip linking to /member' },
    ],
  },
  {
    title: 'Tonight verify: Already-converted lead cannot be converted again',
    capabilitySlug: 'lead-capture',
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'A lead has converted_user_id set (from a previous conversion).',
    steps: [
      { action: 'Open the lead view as admin (bypassing password)', expectedOutcome: 'Lead record loads; the green "This lead has been converted to a member account" strip is visible instead of the gold CTA' },
      { action: 'Attempt POST /api/leads/public/<publicId>/convert with correct password via curl or browser devtools', expectedOutcome: 'Response 409 with error "already converted"; no second user is created' },
    ],
  },

  // ───────── reCAPTCHA ─────────
  {
    title: 'Tonight verify: reCAPTCHA is a no-op until both keys are configured',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'RECAPTCHA_SECRET_KEY is NOT yet set on Render (default state for now).',
    steps: [
      { action: 'Visit /login, do the Forgot password flow with a real email', expectedOutcome: 'Flow completes normally; reset email arrives' },
      { action: 'Check Render logs', expectedOutcome: 'One-time warning "[recaptcha] RECAPTCHA_SECRET_KEY not set — captcha verification skipped"' },
      { action: 'In browser devtools, inspect the network request to /api/auth/reset-request', expectedOutcome: 'Request body includes recaptchaToken: null (frontend correctly sends null when site key missing)' },
    ],
  },
  {
    title: 'Tonight verify: After keys are set, signup / convert / reset / recover all require valid captcha',
    capabilitySlug: 'security-and-data',
    environmentScope: 'prod',
    priority: 'p2',
    preconditions: 'You have registered a reCAPTCHA v3 site at https://www.google.com/recaptcha/admin for saltbasin.net. VITE_RECAPTCHA_SITE_KEY is set in Netlify env; RECAPTCHA_SECRET_KEY is set in Render env. Both have redeployed.',
    steps: [
      { action: 'Sign up a fresh user via /signup', expectedOutcome: 'Account is created; in Render logs you can see the captcha verification fired and passed' },
      { action: 'Do the Forgot password flow', expectedOutcome: 'Reset email arrives; logs show captcha verification' },
      { action: 'Convert a lead to a member', expectedOutcome: 'Conversion succeeds; logs show captcha verification' },
      { action: 'Try POSTing to /api/auth/reset-request via curl WITHOUT a recaptchaToken', expectedOutcome: 'Response 400 with error "captcha token missing"' },
      { action: 'Try POSTing with a fake recaptchaToken=foo', expectedOutcome: 'Response 400 with error "captcha verification failed"' },
    ],
  },

  // ───────── Audit log ─────────
  {
    title: 'Tonight verify: Every QA + backlog mutation writes a row to audit_events',
    capabilitySlug: 'observability',
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Logged in as admin. Can query Supabase Postgres directly (or via psql).',
    steps: [
      { action: 'Create a new test scenario via the QA UI', expectedOutcome: 'audit_events gets one row with entity_type=test_scenario, action=create, source=manual_ui, after_value=<the scenario row>' },
      { action: 'Add a step to the scenario', expectedOutcome: 'audit_events gets one row with entity_type=test_scenario_step, action=create' },
      { action: 'Log a test run with a failed step', expectedOutcome: 'audit_events gets rows for: test_run create, test_run_step_result create, and a backlog_item create (the defect)' },
      { action: 'Patch a scenario field', expectedOutcome: 'audit_events row with entity_type=test_scenario, action=update, before_value + after_value showing what changed' },
      { action: 'Delete a scenario', expectedOutcome: 'audit_events row with action=delete, before_value populated, after_value null' },
    ],
  },

  // ───────── Smoke / end-to-end ─────────
  {
    title: 'Tonight verify: End-to-end — sign up brand-new member, edit their profile, publish, visit /u/:slug',
    capabilitySlug: 'multi-tenant-cms',
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Fresh email you can receive at.',
    steps: [
      { action: 'In incognito, visit /signup', expectedOutcome: 'Signup form renders with displayName / email / password / requestedSlug fields' },
      { action: 'Fill in fields and submit', expectedOutcome: 'Redirect to /member with logged-in session; member sees their starter site' },
      { action: 'Click My Profile → Home → Hero section', expectedOutcome: 'EditorPane loads the hero with editable fields' },
      { action: 'Change the headline; click Save', expectedOutcome: 'Toast confirms save; PreviewPane updates' },
      { action: 'Click About → Resume; add 2 roles via the dynamic list editor', expectedOutcome: 'Roles persist on save' },
      { action: 'Click Publish', expectedOutcome: 'Publish bar runs through; success state shown' },
      { action: 'Open a new tab and visit /u/<your-requestedSlug>', expectedOutcome: 'Public profile renders with the saved headline + roles; URL stable' },
      { action: 'Visit /output/resume', expectedOutcome: 'Renders the member-flavored resume output (no admin chrome leaks)' },
    ],
  },
];

(async () => {
  console.log(`→ ${BASE}`);
  const cookie = await login();
  console.log('✓ logged in');

  const backlog = await getBacklog(cookie);
  const groupBySlug = Object.fromEntries((backlog.groups || []).map((g) => [g.slug, g]));
  const itemByRef = Object.fromEntries(
    (backlog.items || []).filter((it) => it.externalRef).map((it) => [it.externalRef, it])
  );
  console.log(`  · ${backlog.groups.length} capabilities, ${backlog.items.length} backlog items in scope`);

  const existing = await getScenarios(cookie);
  const existingTitles = new Set((existing.scenarios || []).map((s) => s.title));
  console.log(`  · ${existingTitles.size} existing scenarios`);

  let inserted = 0, skipped = 0;
  for (const sc of SCENARIOS) {
    if (existingTitles.has(sc.title)) {
      console.log(`  · skip "${sc.title.slice(0, 64)}…" (already present)`);
      skipped += 1; continue;
    }
    const grp = groupBySlug[sc.capabilitySlug];
    const featureIds = (sc.featureExternalRefs || [])
      .map((ref) => itemByRef[ref]?.id)
      .filter(Boolean);
    const primaryId = sc.primaryExternalRef
      ? itemByRef[sc.primaryExternalRef]?.id
      : featureIds[0] || null;

    const payload = {
      title: sc.title,
      summary: sc.summary || null,
      preconditions: sc.preconditions || null,
      capabilityId: grp?.id ?? null,
      featureBacklogItemIds: featureIds,
      primaryBacklogItemId: primaryId,
      environmentScope: sc.environmentScope || 'both',
      priority: sc.priority || 'p2',
      steps: sc.steps || [],
    };
    const r = await createScenario(cookie, payload);
    console.log(`  ✓ #${r.id} · ${sc.title.slice(0, 64)}…`);
    inserted += 1;
  }
  console.log('');
  console.log(`Done. ${inserted} inserted, ${skipped} skipped. Total target: ${SCENARIOS.length}.`);
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
