// v0.16 + v0.16.1 backlog update
//
// Covers:
//   v0.16  — Lead email management + auth login fix
//   v0.16.1 — CTA visibility gate + build metrics + deploy process docs
//
// Enhanced over prior scripts with:
//   • searchItems(items, query)    — fuzzy search by title/summary/externalRef
//   • findByVersion(items, ver)    — all items for a given patch note version
//   • patchNoteVersion tag         — items tagged "patch:vX.XX" for traceability
//   • parentRef / testScenarioRef  — explicit defect-to-feature and req-to-scenario links
//
// Idempotent by externalRef. Usage:
//   node scripts/add-v016-backlog-items.mjs
//
// Requires in .env:
//   ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD
//   PUBLIC_BASE_URL (defaults to https://saltbasin.net)

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASS || !EMAIL) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

// ── API helpers ───────────────────────────────────────────────────────────────

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

// ── Search helpers ────────────────────────────────────────────────────────────
//
// Use these during script authoring to find the right externalRef before
// writing UPDATES_BY_REF entries. They are pure local functions (no API calls).
//
// Example (add a temporary console.log call at the bottom of main()):
//   const matches = searchItems(existingItems, 'resume scope');
//   console.log(matches.map(i => `[${i.id}] ${i.externalRef} — ${i.title}`).join('\n'));

/** Fuzzy search: case-insensitive substring match across title, summary, externalRef */
function searchItems(items, query) {
  const q = query.toLowerCase();
  return items.filter(i =>
    (i.title || '').toLowerCase().includes(q) ||
    (i.summary || '').toLowerCase().includes(q) ||
    (i.externalRef || '').toLowerCase().includes(q)
  );
}

/** Return all items whose externalRef begins with the given version string */
function findByVersion(items, version) {
  const prefix = version.toLowerCase();
  return items.filter(i => (i.externalRef || '').toLowerCase().startsWith(prefix));
}

/** Print a formatted search result table to stdout — call from main() while authoring */
function printSearchResults(label, results) {
  console.log(`\n── ${label} (${results.length} found) ──`);
  if (!results.length) { console.log('  (none)'); return; }
  for (const r of results) {
    console.log(`  [${r.id}] ${(r.externalRef || '(no ref)').padEnd(50)} ${r.status.padEnd(12)} ${r.title.slice(0, 60)}`);
  }
}

// ── Status presets ────────────────────────────────────────────────────────────

const DEPLOYED = {
  kind: 'feature',
  status: 'completed',
  deployedGithub: true, deployedRender: true, deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: false },
};

const PENDING = {
  kind: 'feature',
  status: 'pending',
  deployedGithub: false, deployedRender: false, deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: false },
};

// ── SECTION 1 — Update existing items now deployed in v0.16 / v0.16.1 ────────
//
// To find the right externalRef for an item you need to update:
//   1. Run the script with SEARCH_MODE=true (add a printSearchResults call below)
//   2. Or look up the ref from a prior script in scripts/add-vXXX-backlog-items.mjs

const UPDATES_BY_REF = [
  {
    externalRef: 'v0.15 · pending · connection-email-notifications',
    patch: {
      summary: 'Still pending as of v0.16.1. No changes to email notification scope in this release. Brevo transactional emails for connection requests and new messages remain on the roadmap.',
    },
  },
];

// ── SECTION 2 — New items for v0.16 DEPLOYED features ────────────────────────
//
// patchNoteVersion tag: every item carries "patch:vX.XX" so it can be queried
// by version across the backlog without relying solely on externalRef parsing.
//
// parentRef: on defect items, names the externalRef of the feature it was found in.
// testScenarioRef: when a requirement was validated by a specific test scenario,
//   record the scenario's externalRef here for traceability.

const NEW_DEPLOYED_ITEMS = [

  // ── v0.16 ─────────────────────────────────────────────────────────────────

  {
    capabilitySlug: 'auth',
    externalRef: 'v0.16 · auth-login-multi-candidate',
    title: 'Auth — login() tries all candidate users for submitted email',
    summary: 'Critical bug: login() previously returned the first user record matching the email and checked the password only against that user. If a lead was converted to a member with an email that an admin had registered as a secondary address, the admin could no longer log in (wrong password hash checked first). Fixed by collecting ALL users matching the email (primary column + verified user_emails rows) and trying the password against each candidate in order.',
    userStory: 'As Betsy, when I log in with my admin password, I should always be able to authenticate regardless of whether someone else has my email registered as a secondary address on their account.',
    requirementDetail: 'server/auth.js login(): collect primary user row (WHERE users.email = lower) + all verified secondary rows (JOIN user_emails WHERE ue.email = lower AND ue.verified = true). Deduplicate by user id. Try bcrypt.compare against each candidate\'s password_hash. Return first match. If no match, return null. Prevents any single email conflict from permanently blocking a user.',
    acceptanceCriteria: 'Admin logs in with betsysalter@saltbasin.net and correct password after a lead using that same email was converted to a member. Member with email as secondary can log in with their own password. Wrong password still returns null (no bypass).',
    ...DEPLOYED, kind: 'defect',
    hoursBetsy: 1, hoursClaude: 0.5,
    tags: ['patch:v0.16', 'auth', 'security'],
  },

  {
    capabilitySlug: 'crm',
    externalRef: 'v0.16 · leads-multi-email',
    title: 'Leads — multi-email addresses with type, org, primary, and unsubscribe',
    summary: 'Each lead can now have multiple contact email addresses beyond the primary leads.email column. New lead_email_addresses table stores: email, email_type (personal/work), org_name (for work addresses), is_primary, subscribed (per-email unsubscribe), created_at. When a lead is matched by phone and the submitted email differs from the existing primary, the new email is automatically captured to lead_email_addresses.',
    userStory: 'As Betsy managing leads, I want to capture all email addresses a lead has provided across different touchpoints, with context on whether each is personal or work, so I can reach them appropriately and respect their unsubscribe preferences per address.',
    requirementDetail: 'DB: lead_email_addresses (id, lead_id FK→leads.id ON DELETE CASCADE, email UNIQUE(lead_id,email), email_type DEFAULT personal, org_name, is_primary DEFAULT false, subscribed DEFAULT true, created_at). POST /api/leads: on phone-match with different email, INSERT into lead_email_addresses. GET /api/leads/public/:publicId: includes contactEmails array. POST /public/:publicId/contact-emails: add address. PATCH /public/:publicId/contact-emails/:id: update type/org/primary/subscribed.',
    acceptanceCriteria: 'Phone-match scenario: submitting with a different email than the existing primary auto-creates a lead_email_addresses row. LeadView shows Email Addresses panel with all addresses. Can toggle primary, update type, change org name, toggle subscribed. GET public lead includes contactEmails.',
    ...DEPLOYED,
    hoursBetsy: 1.5, hoursClaude: 1.5,
    tags: ['patch:v0.16', 'crm', 'leads'],
  },

  {
    capabilitySlug: 'crm',
    externalRef: 'v0.16 · leads-conversion-secondary-email-check',
    title: 'Lead conversion — check user_emails secondary table before blocking',
    summary: 'The lead-to-member conversion route previously only checked users.email (primary column) when looking for an existing account with the same email. If the email existed as a verified secondary address in user_emails, conversion would silently fail or create a duplicate. Fixed: conversion now checks both tables, returns a clear "sign in with X" message if found, and auto-registers the new member\'s email in user_emails post-conversion so future secondary lookups work.',
    userStory: 'As a lead converting to a member, if my email is already registered under a different account, I should see a clear message telling me which account to use rather than getting a confusing error.',
    requirementDetail: 'server/routes/leads.js POST /public/:publicId/convert: (1) check users.email, (2) also check user_emails WHERE email = submitted AND verified = true. If found in either, return 409 with { error: "email already registered", existingEmail }. On successful conversion: INSERT into user_emails (user_id, email, type=primary, verified=true) ON CONFLICT DO NOTHING, so the email is discoverable via secondary lookup.',
    acceptanceCriteria: 'Lead with email that is a verified secondary on admin account sees "sign in with X" message on conversion attempt. New member post-conversion has their email in user_emails. user_emails lookup in login() finds the new member record correctly.',
    ...DEPLOYED, kind: 'defect',
    hoursBetsy: 0.5, hoursClaude: 0.5,
    tags: ['patch:v0.16', 'auth', 'crm', 'leads'],
  },

  {
    capabilitySlug: 'output-pages',
    externalRef: 'v0.16 · resume-output-draft-page-hang',
    title: 'Resume output — no longer hangs when consulting-founder page is draft',
    summary: 'ResumeOutput hardcoded site.pages["consulting-founder"] to find the Meet the Founder page. When that page was in draft, the public API filtered it out and the lookup returned undefined. The component never set isLoading=false, causing an infinite spinner. Fixed: falls back to slug search (find page with slug === "consulting/founder"), then shows a clear error message if the page is not found in published state at all.',
    userStory: 'As a visitor clicking the Resume button, I should see a useful error message if the Founder page is not published yet, not an infinite loading spinner.',
    requirementDetail: 'src/components/Output.jsx ResumeOutput: const founderPage = site.pages["consulting-founder"] || Object.values(site.pages || {}).find(p => p.slug === "consulting/founder"). If founderPage is null after both checks, call setSiteError("Founder page not found — check that the Meet the Founder page is published.") and return. isLoading never stays true past this check.',
    acceptanceCriteria: 'With consulting-founder page in draft: /output/resume shows error message instead of infinite spinner. With page live: resume loads normally.',
    ...DEPLOYED, kind: 'defect',
    hoursBetsy: 0.25, hoursClaude: 0.25,
    tags: ['patch:v0.16', 'output-pages'],
  },

  {
    capabilitySlug: 'crm',
    externalRef: 'v0.16 · lead-view-email-panel',
    title: 'LeadView — Email Addresses panel with multi-email management',
    summary: 'New Email Addresses section in the lead detail view (admin). Shows the primary email (from leads.email), all alternate addresses from lead_email_addresses with their type (personal/work) and org name for work addresses, a make-primary button per alternate, per-email unsubscribe toggle, and an add-email form with type and org fields.',
    userStory: 'As Betsy reviewing a lead\'s record, I want to see all email addresses associated with them in one place, with the ability to promote an alternate to primary and manage unsubscribe preferences per address.',
    requirementDetail: 'src/components/LeadView.jsx: Email Addresses panel section. State: contactEmails (from GET /api/leads/public/:publicId contactEmails), showAddEmail boolean, newEmail/newEmailType/newEmailOrg inputs. addEmail(): POST /public/:publicId/contact-emails. updateEmail(id, patch): PATCH /public/:publicId/contact-emails/:id. Render: primary email display, map contactEmails with type selector, org input (when type=work), make-primary button, unsubscribe toggle, add form.',
    acceptanceCriteria: 'LeadView shows Email Addresses section. Primary email shown with (primary) label. Alternate emails listed with type dropdown and org name field when work. Make Primary promotes to primary. Unsubscribed toggle saves immediately. Add email form creates new row.',
    ...DEPLOYED,
    hoursBetsy: 0.5, hoursClaude: 1,
    tags: ['patch:v0.16', 'crm', 'leads'],
  },

  {
    capabilitySlug: 'crm',
    externalRef: 'v0.16 · lead-success-modal-returning-lead',
    title: 'LeadSuccessModal — returning lead UX with credential reminder',
    summary: 'When a submitted form matches an existing lead, the success modal now shows the existing primary email and a credential reminder ("You\'ll need your original password to access your record"). When the matched lead was found by phone but a different email was submitted, the modal prompts to choose which email should be primary — applies the choice immediately without closing the modal.',
    userStory: 'As a returning lead who fills out a form again, I should be reminded which email and password I used to register so I can access my existing record without confusion.',
    requirementDetail: 'src/components/LeadView.jsx LeadSuccessModal: on existingEmail prop (returned by POST /api/leads when matched), show "Welcome back" variant with existingEmail displayed. On alternateEmail prop (different email submitted vs existing primary), show email choice UI with "Keep original" vs "Use new email" options. Choice triggers PATCH /public/:publicId/contact-emails/:id with is_primary=true.',
    acceptanceCriteria: 'Returning lead via email match: sees existing email and password reminder. Returning lead via phone match with different email: sees both emails and can choose primary. Choice is saved and reflected in contactEmails list.',
    ...DEPLOYED,
    hoursBetsy: 0.5, hoursClaude: 0.5,
    tags: ['patch:v0.16', 'crm', 'leads'],
  },

  // ── v0.16.1 ───────────────────────────────────────────────────────────────

  {
    capabilitySlug: 'cms-public',
    externalRef: 'v0.16.1 · cta-visibility-live-pages-only',
    title: 'Public site — CTA buttons hidden when target page is draft or missing',
    summary: 'isLiveHref() utility gates all CTA buttons on the public site. A button linking to an internal page is only rendered if that page exists in the published site with status="live". External links, anchors, and non-page routes (/output/, /u/, /member, etc.) are always shown. Preview and admin modes pass liveSlugs=null and see all CTAs regardless.',
    userStory: 'As a visitor on the public site, I should never see a button that leads to a 404 or a draft page. CTA buttons should only appear when the destination is actually live and accessible.',
    requirementDetail: 'src/components/blocks/index.jsx: NON_PAGE_PREFIXES constant, isLiveHref(href, liveSlugs) function. Returns true for: null/empty href, #anchors, http/https external links, any href starting with a NON_PAGE_PREFIX. Returns false when liveSlugs is provided and the slug is not in the Set. Returns true when liveSlugs is null (preview/admin). RenderSection: accepts liveSlugs prop, passes to Block. PublicSite.jsx: liveSlugs = new Set(Object.values(pages).filter(p => p.status === "live").map(p => slug)). Blocks updated: HeroBlock, TwoColBlock, CtaBlock, TimelineBlock, AppMockupBlock, ChoiceGridBlock.',
    acceptanceCriteria: 'CTA button pointing to a draft page is absent from the public site. Same button visible in admin preview. CTA pointing to an external URL always visible. CTA pointing to a live page always visible. No regression on existing live CTAs.',
    ...DEPLOYED,
    hoursBetsy: 0.5, hoursClaude: 1,
    tags: ['patch:v0.16.1', 'cms-public', 'ux'],
  },

  {
    capabilitySlug: 'admin-experience',
    externalRef: 'v0.16.1 · patch-notes-build-metrics',
    title: 'Patch notes — retroactive build metrics across all releases (v0.1–v0.16)',
    summary: 'Every patch note entry now carries a metrics block with: directorHours (Betsy\'s architecture/oversight time), claudeBuildMins (Claude\'s actual coding wall-clock time), and engineerEquivHours (senior engineer hours to produce the same output independently). Retroactively applied to all 16 prior releases based on session analysis. Computed fields (cost, leverage ratio) derived at render time using configurable hourly rates.',
    userStory: 'As Betsy reviewing the build\'s value, I want to see quantified director input alongside Claude\'s contribution and the equivalent human engineering cost for each release, so I can demonstrate the leverage ratio of AI-assisted development to stakeholders.',
    requirementDetail: 'server/data/patchNotes.js: metrics: { directorHours, claudeBuildMins, engineerEquivHours, notes } added to each release entry. Computed at render time: directorCostUsd = directorHours × DIRECTOR_RATE (default $150/hr), engineerEquivCostUsd = engineerEquivHours × ENGINEER_RATE (default $175/hr), leverageMultiple = engineerEquivHours / (directorHours + claudeBuildMins/60). The output renderer or API consumer multiplies by configurable rates so assumptions can change without touching release data.',
    acceptanceCriteria: 'GET /api/backlog/patch-notes returns metrics block on every entry. /output/patch-notes renders director hours, Claude build time, engineer equivalent, and leverage multiple per release. Cumulative totals visible. Rates can be changed without editing patchNotes.js.',
    ...DEPLOYED,
    hoursBetsy: 2, hoursClaude: 1,
    tags: ['patch:v0.16.1', 'backlog', 'metrics'],
  },

  {
    capabilitySlug: 'admin-experience',
    externalRef: 'v0.16.1 · deploy-process-documented',
    title: 'Post-deploy process — documented and added to patchNotes.js file header',
    summary: 'The four-step post-deploy process is now the canonical documented in the patchNotes.js file header: (1) verify Render deploy, (2) run backlog items script, (3) run test scenarios script if applicable, (4) confirm /output/patch-notes. Why it is manual rather than automated: scripts require credentials not in CI, should only run after confirmed deploy, failed deploy must not create partial backlog records.',
    userStory: 'As Betsy (or Claude) deploying a release, I want a single authoritative reference for what post-deploy steps are required so nothing is missed and the platform lifecycle management system stays current.',
    requirementDetail: 'server/data/patchNotes.js file header: Post-deploy steps section. Also carried in postDeploySteps array on the v0.16.1 release entry. Each release from v0.16.1 forward should include a postDeploySteps array listing the specific commands run for that release.',
    acceptanceCriteria: 'File header is readable by Claude or Betsy at the start of any session. postDeploySteps array on v0.16.1 entry lists the specific commands. Future release scripts follow the same pattern.',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.5, hoursClaude: 0.25,
    tags: ['patch:v0.16.1', 'process', 'documentation'],
  },

  {
    capabilitySlug: 'admin-experience',
    externalRef: 'v0.16.1 · backlog-script-search-traceability',
    title: 'Backlog script — searchItems(), findByVersion(), patchNoteVersion tagging',
    summary: 'The v0.16 backlog script introduces search and traceability helpers: searchItems(items, query) does fuzzy local search across title/summary/externalRef; findByVersion(items, version) returns all items for a given patch version; printSearchResults() formats results for terminal output during authoring. All new items carry a "patch:vX.XX" tag for cross-version querying. parentRef and testScenarioRef fields document defect-to-feature and requirement-to-scenario traceability.',
    userStory: 'As Claude authoring a backlog script for a new release, I want to search across existing items by keyword to find the right externalRef to update, without having to know the exact reference string from a prior session.',
    requirementDetail: 'scripts/add-v016-backlog-items.mjs: searchItems(items, query) — Array.filter over title/summary/externalRef with .toLowerCase().includes(). findByVersion(items, version) — filter where externalRef.toLowerCase().startsWith(version.toLowerCase()). printSearchResults(label, results) — formatted table to stdout. Usage: add temporary printSearchResults(searchItems(existingItems, "your query")) call inside main() while authoring. Remove before final run.',
    acceptanceCriteria: 'searchItems(items, "resume scope") returns the resume scope fix item from v0.15. findByVersion(items, "v0.15") returns all 6+ v0.15 items. Items created by this script include tags: ["patch:v0.16.1", ...]. Script runs to completion without error.',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.25, hoursClaude: 0.5,
    tags: ['patch:v0.16.1', 'backlog', 'tooling'],
  },
];

// ── SECTION 3 — New PENDING items (outstanding work) ─────────────────────────

const NEW_PENDING_ITEMS = [
  {
    capabilitySlug: 'cms-public',
    externalRef: 'v0.16.1 · pending · cta-visibility-member-sites',
    title: 'CTA visibility gate — apply to member public sites (/u/:slug)',
    summary: 'The liveSlugs gate is currently implemented in PublicSite.jsx (Betsy\'s saltbasin.net pages). Member public sites rendered at /u/:slug via PublicProfile.jsx or a MemberSite component are not yet covered. Member sites should apply the same isLiveHref() check so member CTA buttons linking to their own draft pages are also hidden from public view.',
    userStory: 'As a member\'s site visitor, I should not see broken CTA buttons linking to draft pages on the member\'s public profile, just as I don\'t on the main Salt Basin site.',
    requirementDetail: 'Find the member public site renderer (likely PublicProfile.jsx or MemberPublicSite.jsx). Compute liveSlugs from the member\'s published pages. Pass to each RenderSection call in mode="public". isLiveHref() is already in blocks/index.jsx — no changes needed there.',
    acceptanceCriteria: 'Member public site (/u/:slug) hides CTA buttons pointing to their draft pages. Live CTAs remain visible. No regression on Betsy\'s site.',
    priority: 'p2', ...PENDING,
    tags: ['patch:v0.16.1', 'cms-public', 'member-sites'],
  },
  {
    capabilitySlug: 'cms-public',
    externalRef: 'v0.16.1 · pending · consulting-founder-page-live',
    title: 'Admin task — set consulting-founder page to live and republish',
    summary: 'The Meet the Founder page (/consulting/founder) needs to be set to status="live" in the admin CMS and the site republished. The resume output fix now shows an error message instead of hanging, but the actual button and page need to be live for the end user flow to work. Betsy must log in to admin, find the Consulting/Founder page, set its status to Live, and publish.',
    userStory: 'As a visitor clicking the Resume or Meet the Founder button, I want to land on the actual founder page, not see an error message.',
    requirementDetail: 'Admin action: log in at /admin → navigate to the Consulting section → find the Founder page → set status dropdown to "Live" → click Publish. No code change required.',
    acceptanceCriteria: '/consulting/founder loads correctly on the public site. Resume output page loads without the "Founder page not found" error. CTA button pointing to /consulting/founder is visible (now that the page is live, isLiveHref() will return true).',
    priority: 'p0', ...PENDING, kind: 'chore',
    tags: ['patch:v0.16.1', 'admin-task', 'cms-public'],
  },
  {
    capabilitySlug: 'crm',
    externalRef: 'v0.16.1 · pending · leads-multi-email-brevo-routing',
    title: 'Lead emails — route outbound email to the subscribed primary address',
    summary: 'Now that leads can have multiple email addresses with per-email unsubscribe flags, the Brevo outbound email functions (sendLeadConfirmation, sendBetsyAlert) should check lead_email_addresses for the subscribed primary address rather than always using leads.email. If the primary is unsubscribed, fall through to next subscribed address. If none are subscribed, suppress send.',
    userStory: 'As a lead who has unsubscribed one of my email addresses, I want future confirmations and alerts to go to my remaining subscribed address, not the unsubscribed one.',
    requirementDetail: 'server/lib/email.js sendLeadConfirmation / sendBetsyAlert: before sending, query lead_email_addresses WHERE lead_id = X AND subscribed = true ORDER BY is_primary DESC LIMIT 1. Use that email as the recipient if found, otherwise fall back to leads.email (the legacy primary). If lead_email_addresses has a primary subscribed address, prefer it.',
    acceptanceCriteria: 'Lead with unsubscribed primary and subscribed alternate gets email to the alternate. Lead with all addresses unsubscribed gets no email (send suppressed). Lead with no lead_email_addresses rows gets email to leads.email (unchanged behavior).',
    priority: 'p2', ...PENDING,
    tags: ['patch:v0.16.1', 'crm', 'email', 'leads'],
  },
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'v0.16.1 · pending · patch-notes-metrics-renderer',
    title: 'Patch notes output — render metrics block with rates, costs, and leverage multiple',
    summary: 'The /output/patch-notes renderer (or the admin Backlog → Outputs tab) should surface the new metrics block per release: director hours, Claude build time, engineer equivalent, computed costs at configurable rates, and leverage multiple. A cumulative summary row showing totals across all releases. Admin-configurable hourly rates (DIRECTOR_RATE, ENGINEER_RATE) stored in config_state so they can be updated without a code push.',
    userStory: 'As Betsy presenting the build to stakeholders, I want a rendered output page that shows the director contribution, Claude contribution, and what this would have cost with a traditional engineering team — including a running total and per-release breakdown.',
    requirementDetail: 'GET /api/backlog/patch-notes: return metrics block as-is. Output renderer: add a Metrics row per release showing directorHours, claudeBuildMins, engineerEquivHours. Compute leverageMultiple = engineerEquivHours / (directorHours + claudeBuildMins/60). Read rates from config_state["build_metrics"] (or hardcode defaults $150/$175 with a config override path). Add a cumulative totals section at the top of the output.',
    acceptanceCriteria: '/output/patch-notes shows metrics per release. Leverage multiple computed correctly. Totals row sums all releases. Hourly rates configurable without code push.',
    priority: 'p1', ...PENDING,
    tags: ['patch:v0.16.1', 'output-pages', 'metrics', 'backlog'],
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

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

  // ── Search examples (uncomment during authoring to inspect existing items) ──
  // printSearchResults('Resume items', searchItems(existingItems, 'resume'));
  // printSearchResults('v0.15 items', findByVersion(existingItems, 'v0.15'));
  // printSearchResults('Auth items', searchItems(existingItems, 'auth'));

  // ── UPDATES ──
  console.log('=== UPDATING existing items ===');
  let updated = 0, updateMissed = 0;
  for (const { externalRef, patch } of UPDATES_BY_REF) {
    const existing = refToItem.get(externalRef);
    if (!existing) { console.log(`  NOT FOUND (skip): ${externalRef}`); updateMissed++; continue; }
    await updateItem(cookie, existing.id, patch);
    console.log(`  UPDATED [${existing.id}]: ${externalRef.slice(0, 70)}`);
    updated++;
  }

  // ── NEW DEPLOYED ──
  console.log('\n=== CREATING new deployed items ===');
  const byCapability = {};
  let createdDeployed = 0, skippedDeployed = 0;
  for (const item of NEW_DEPLOYED_ITEMS) {
    const { capabilitySlug, ...rest } = item;
    if (refToItem.has(rest.externalRef)) {
      console.log(`  SKIP (exists): ${rest.externalRef}`);
      skippedDeployed++;
      continue;
    }
    const groupId = slugMap[capabilitySlug] || null;
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}"`);
    const result = await createItem(cookie, { ...rest, capabilityGroupId: groupId, source: 'bulk_script' });
    const cap = capabilitySlug || 'unknown';
    byCapability[cap] = (byCapability[cap] || 0) + 1;
    console.log(`  CREATED [${result.id}] (${cap}): ${rest.title.slice(0, 65)}`);
    createdDeployed++;
  }

  // ── NEW PENDING ──
  console.log('\n=== CREATING new pending items ===');
  let createdPending = 0, skippedPending = 0;
  for (const item of NEW_PENDING_ITEMS) {
    const { capabilitySlug, ...rest } = item;
    if (refToItem.has(rest.externalRef)) {
      console.log(`  SKIP (exists): ${rest.externalRef}`);
      skippedPending++;
      continue;
    }
    const groupId = slugMap[capabilitySlug] || null;
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}"`);
    const result = await createItem(cookie, { ...rest, capabilityGroupId: groupId, source: 'bulk_script' });
    console.log(`  CREATED [${result.id}] (${capabilitySlug}): ${rest.title.slice(0, 65)}`);
    createdPending++;
  }

  const capSummary = Object.entries(byCapability).map(([k, v]) => `${k}: ${v}`).join(', ');
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Updates applied:    ${updated}  (${updateMissed} refs not found)
Deployed created:   ${createdDeployed}  (${skippedDeployed} already existed)
Pending created:    ${createdPending}  (${skippedPending} already existed)
By capability:      ${capSummary || '—'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next steps:
  1. Verify Render deploy at https://dashboard.render.com
  2. Confirm /output/patch-notes shows v0.16.1
  3. Set consulting-founder page to Live in admin and republish (p0 task)
  4. node scripts/add-v016-test-scenarios.mjs  (when authored)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => { console.error(e); process.exit(1); });
