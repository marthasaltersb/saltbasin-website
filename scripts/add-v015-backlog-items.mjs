// v0.15 backlog update — Resume fix + CRM Job Leads + Member Connections/Messaging + Inbox
//
// 1. UPDATES existing pending items now deployed in v0.15
// 2. CREATES new items for v0.15 deployed features
// 3. CREATES new pending items for outstanding work
//
// Idempotent by externalRef. Usage: node scripts/add-v015-backlog-items.mjs

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
};

const PENDING = {
  kind: 'feature',
  status: 'pending',
  deployedGithub: false, deployedRender: false, deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: false },
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Existing items to UPDATE (now deployed in v0.15)
// ─────────────────────────────────────────────────────────────────────────────

const UPDATES_BY_REF = [
  {
    externalRef: 'v0.14 · 2A · crm-pipeline',
    patch: {
      status: 'in_progress',
      summary: 'PARTIALLY addressed in v0.15. CRM now has manual lead creation with job lead type support. Full pipeline board (kanban, stages, deals) still pending. v0.15 adds: POST /api/leads/admin-create (manual creation with skip_email), lead_type field (network|job), job-specific fields (job_description, job_url, company, hiring_manager, job_status), LeadsPanel type filter tabs (All/Network/Job), inline job status editor.',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — New items for v0.15 DEPLOYED features
// ─────────────────────────────────────────────────────────────────────────────

const NEW_DEPLOYED_ITEMS = [
  // ── Resume generator scope fix ────────────────────────────────────────────
  {
    capabilitySlug: 'output-pages',
    externalRef: 'v0.15 · resume-scope-fix',
    title: 'Resume generator scope bug fix — admin preset editor now loads all site sections',
    summary: 'Critical bug: TAB_COMPONENTS registry rendered <MyResumePanel /> without forwarding the scope="admin" prop, so Betsy\'s resume panel loaded member-only site data and showed 0 sections. Fixed by changing the entry to (props) => <MyResumePanel {...props} />. Also added overflowY: auto scroll wrapper so the panel scrolls within the admin workspace instead of being clipped.',
    userStory: 'As Betsy, when I open My Resume in the admin shell, I need to see all my profile sections so I can include them in resume presets and run the AI tailoring agent.',
    requirementDetail: 'AdminShell.jsx TAB_COMPONENTS line 41: was `() => <MyResumePanel />`, fixed to `(props) => <MyResumePanel {...props} />`. MyResumePanel.jsx: outer div now has flex: 1, overflowY: auto wrapper containing the S.wrap content div. Scope prop forwarding enables the allSettled merge of admin + member site pages for admin users.',
    acceptanceCriteria: 'Admin opens My Resume tab → sections list is populated with all profile sections. Preset editor shows sections available to include. Agent has profile context when tailoring.',
    ...DEPLOYED, kind: 'defect', hoursClaudeEst: 0.25, hoursBetsyEst: 0,
  },

  // ── CRM: manual lead creation + job lead type ─────────────────────────────
  {
    capabilitySlug: 'crm',
    externalRef: 'v0.15 · crm-manual-lead-creation',
    title: 'CRM — manual lead creation with skip-email option',
    summary: 'Admin can now manually create leads from within the Leads panel without going through a public form. POST /api/leads/admin-create handles creation with: email, name, phone, message, source="manual", skipEmail boolean (suppresses confirmation email), and all job lead fields. The LeadsPanel shows an "+ Add Lead" button that expands an inline creation form.',
    userStory: 'As Betsy tracking all my prospect activity, I want to manually add a lead record for someone I met in person or found on LinkedIn without sending them an automated email.',
    requirementDetail: 'server/routes/leads.js: POST /api/leads/admin-create (requireAdmin). Fields: email, name, phone, message, source, skipEmail, leadType, jobDescription, jobUrl, company, hiringManager, jobStatus. Does NOT fire sendLeadConfirmation when skipEmail=true. LeadsPanel.jsx: "+ Add Lead" button expands inline form with leadType toggle (Network | Job). Job type shows conditional job-specific fields.',
    acceptanceCriteria: 'Admin clicks "+ Add Lead", fills email, toggles off email, submits → lead created with no email sent. Lead appears in list with "Manual" source badge. Check skip email → no Brevo outbound.',
    ...DEPLOYED, hoursClaudeEst: 1.5, hoursBetsyEst: 0.1,
  },

  // ── CRM: job lead type ────────────────────────────────────────────────────
  {
    capabilitySlug: 'crm',
    externalRef: 'v0.15 · crm-job-lead-type',
    title: 'CRM — job lead type with full job tracking fields',
    summary: 'New lead_type field on leads table (network | job). Job leads have dedicated fields: job_description (full JD text), job_url (link to posting), company, hiring_manager (name + contact info), job_status (new → applied → interviewing → rejected → offer). Job leads show differently in the leads list (company name prominent, status badge). Job detail panel shows job fields. Status can be updated inline via PATCH /api/leads/:id/job.',
    userStory: 'As Betsy tracking my own job search alongside managing network leads, I want a separate "job" lead type with fields for job description, company, hiring manager, and application status so I can manage my pipeline from the same CRM.',
    requirementDetail: 'DB: ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT "network", job_description TEXT, job_url TEXT, company TEXT, hiring_manager TEXT, job_status TEXT DEFAULT "new". server/routes/leads.js: PATCH /:id/job (update job status/fields), GET / now returns all job columns. LeadsPanel.jsx: type filter tabs (All/Network/Job), job lead list row shows company name + status chip, job detail shows all job fields, edit form for job info inline.',
    acceptanceCriteria: 'Creating a job lead stores all job fields. Job lead list row shows company name prominently. Status chip shows New/Applied/Interviewing. Clicking "Edit Job Info" in detail panel allows updating status and fields.',
    ...DEPLOYED, hoursClaudeEst: 2, hoursBetsyEst: 0.1,
  },

  // ── Member connections ────────────────────────────────────────────────────
  {
    capabilitySlug: 'network-relationship-mgmt',
    externalRef: 'v0.15 · member-connections',
    title: 'Member connections — request, accept, decline between members',
    summary: 'Members can send connection requests to each other from public profile pages (/u/:slug). The "+ Connect" button is visible only to authenticated members (hidden from anonymous visitors). Connections go through pending → accepted | declined states. Backend: member_connections table with requester_id, recipient_id, status, message, timestamps.',
    userStory: 'As a member visiting another member\'s profile, I want to send a connection request so we can stay connected on the platform and eventually message each other.',
    requirementDetail: 'DB: CREATE TABLE member_connections (id, requester_id, recipient_id, status, message, created_at, updated_at, UNIQUE(requester_id, recipient_id)). server/routes/members.js: POST /me/connections/request (by slug), GET /me/connections (accepted), GET /me/connection-requests (pending incoming), POST /me/connections/:id/accept, POST /me/connections/:id/decline, GET /me/connection-status/:slug. PublicProfile.jsx: ConnectionActions component checks auth + connection status on mount, shows appropriate button state.',
    acceptanceCriteria: 'Logged-in member sees "+ Connect" on another member\'s profile. Sending a request shows "Request Sent". Recipient sees the request in their Inbox > Requests tab. Accepting moves both parties to accepted state. "+ Connect" button hidden when viewing own profile or when already connected.',
    ...DEPLOYED, hoursClaudeEst: 2, hoursBetsyEst: 0,
  },

  // ── Member direct messaging ───────────────────────────────────────────────
  {
    capabilitySlug: 'network-relationship-mgmt',
    externalRef: 'v0.15 · member-messaging',
    title: 'Member direct messaging — connection-to-connection only',
    summary: 'Connected members can send each other direct messages within Salt Basin. Messages are strictly connection-scoped: the send route (POST /me/messages) verifies an accepted member_connections row exists before accepting the message. Inbox shows a threaded view grouped by sender. Thread view marks messages read on open. Sending enforced only between accepted connections — no cold messaging.',
    userStory: 'As a member who is connected to another member, I want to send them a message directly within Salt Basin without needing to go to email or LinkedIn.',
    requirementDetail: 'DB: CREATE TABLE member_messages (id, sender_id, recipient_id, body, read_at, created_at). server/routes/members.js: POST /me/messages (verifies accepted connection, body required), GET /me/messages (inbox, most recent 200), GET /me/messages/thread/:userId (bidirectional thread, marks unread as read), GET /me/messages/unread-count. PublicProfile.jsx: accepted connection shows "Message" button with inline compose popover.',
    acceptanceCriteria: 'Accepted connection sees "Message" on profile. Submitting message creates record. Recipient sees it in Inbox > Messages. Thread view shows conversation. Non-connection attempt returns 403.',
    ...DEPLOYED, hoursClaudeEst: 2, hoursBetsyEst: 0,
  },

  // ── InboxPanel ───────────────────────────────────────────────────────────
  {
    capabilitySlug: 'network-relationship-mgmt',
    externalRef: 'v0.15 · inbox-panel',
    title: 'Member Inbox panel — messages, connection requests, connections list',
    summary: 'New InboxPanel component mounted as an "Inbox" tab in the member admin shell (and available to admin). Three sub-tabs: Messages (threaded conversation list + real-time thread view with Enter-to-send), Requests (pending connection requests with Accept/Decline), Connections (accepted connections list with quick Message button). Nav seed migration injects Inbox tab into member content view on boot.',
    userStory: 'As a member, I want a dedicated inbox inside my Salt Basin dashboard where I can read messages, manage connection requests, and see all my connections in one place.',
    requirementDetail: 'src/components/admin/InboxPanel.jsx: Messages tab — thread list (deduplicated by sender_id, sorted by most recent), thread view (bidirectional chat bubbles, ref scroll to bottom, Enter=send), send box with textarea + Send button. Requests tab — pending requests with accept/decline. Connections tab — accepted connections with Message button. AdminShell.jsx: import + TAB_COMPONENTS entry + componentId inline handler. server/db.js: Inbox tab injected into content view nav in both one-shot boot migration and admin_nav merge migration.',
    acceptanceCriteria: 'Member sees "Inbox" tab in dashboard. Messages thread list shows senders. Thread view shows full conversation. Enter sends. Requests tab shows pending with accept/decline. Connections tab shows all connected members.',
    ...DEPLOYED, hoursClaudeEst: 2.5, hoursBetsyEst: 0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — New PENDING items (outstanding work)
// ─────────────────────────────────────────────────────────────────────────────

const NEW_PENDING_ITEMS = [
  {
    capabilitySlug: 'network-relationship-mgmt',
    externalRef: 'v0.15 · pending · connection-email-notifications',
    title: 'Connection + message email notifications (Brevo)',
    summary: 'When a member receives a connection request, they should get an email. When they receive a new message, they should get a notification email. Both should use Brevo transactional email with fallback to stdout stub. Emails should link directly to /member (inbox tab).',
    userStory: 'As a member, I want to be notified by email when someone sends me a connection request or a message so I don\'t have to log in daily to check.',
    requirementDetail: 'server/routes/members.js: after INSERT into member_connections (POST /me/connections/request), look up recipient email and send sendConnectionRequest() via email.js. After INSERT into member_messages, send sendNewMessage() email to recipient. Add sendConnectionRequest and sendNewMessage to server/lib/email.js (Brevo transactional). Both fall back gracefully to stdout if BREVO_API_KEY unset.',
    acceptanceCriteria: 'Sending a connection request triggers Brevo email to recipient. Sending a message triggers email to recipient. Both emails include a link to /member. If BREVO_API_KEY not set, logs to stdout and returns ok:true.',
    priority: 'p1', ...PENDING, hoursClaudeEst: 1, hoursBetsyEst: 0,
  },
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'v0.15 · pending · inbox-unread-badge',
    title: 'Inbox unread count badge on admin topbar Inbox tab',
    summary: 'The Inbox tab in the admin shell should show a badge with the unread message count. Fetched from GET /api/members/me/messages/unread-count on load and polled every 60 seconds. Badge is a small gold circle with the count, hidden when count is 0.',
    userStory: 'As a member, I want to see at a glance in my dashboard navigation how many unread messages I have without having to click into the Inbox tab.',
    requirementDetail: 'AdminShell.jsx: add polling for /api/members/me/messages/unread-count (60s interval, only when scope=member or user is member). Inject unread count into the nav tab label for the "inbox" componentId tab. Badge renders as a small absolute-positioned circle on the tab label.',
    acceptanceCriteria: 'Member with 2 unread messages sees "Inbox (2)" or a badge on the tab. Reading messages clears the count on next poll. Count hidden (not shown as 0) when no unread.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 0.75, hoursBetsyEst: 0,
  },
  {
    capabilitySlug: 'admin-experience',
    externalRef: 'v0.15 · pending · dynamic-scrolling-all-panels',
    title: 'Dynamic scrolling — all admin panels scroll within workspace',
    summary: 'Some admin panels clip content instead of scrolling because they lack flex: 1 / overflow: auto on their outer container. MyResumePanel was fixed in v0.15. Audit remaining panels (BacklogPanel, QAPanel, MemberPlmPanel, GovernancePanel, FinBridgeCoPanel, ProfileHub, ContentManagerShell, EmotionalWeatherPanel) to ensure their outer divs use overflow: auto or overflowY: auto so content scrolls within the fixed-height admin workspace.',
    userStory: 'As Betsy using any admin panel, I want to be able to scroll through content that exceeds the viewport height without the workspace clipping my view.',
    requirementDetail: 'Audit each TAB_COMPONENTS panel. The admin workspace has overflow: hidden on its container. Each full-panel component must have flex: 1, overflowY: auto (or overflow: auto) on its outermost div to scroll within the workspace. NetWorksPanel and LeadsPanel already do this correctly — use them as the pattern.',
    acceptanceCriteria: 'Each admin panel with content that exceeds the viewport height is scrollable. No content is clipped. The sidebar remains fixed while the panel content scrolls.',
    priority: 'p2', ...PENDING, kind: 'chore', hoursClaudeEst: 1, hoursBetsyEst: 0.25,
  },
  {
    capabilitySlug: 'crm',
    externalRef: 'v0.15 · pending · crm-pipeline-board',
    title: 'CRM pipeline board — kanban stage view for deals (Phase 2A continuation)',
    summary: 'Full CRM pipeline board with crm_pipelines, crm_pipeline_stages, crm_deals, crm_activities. Drag-and-drop kanban board per pipeline. Deal cards show contact, value, stage, last activity. Deal detail drawer with activity log and notes. Org-level deal rollup view.',
    userStory: 'As Betsy managing active client engagements, I want a visual pipeline board where I can see all deals by stage, drag them forward, and log activities.',
    requirementDetail: 'Create server/routes/crm.js: pipeline CRUD, stage CRUD, deal CRUD (move stage), activities. Create CrmPanel.jsx: kanban board with columns per stage, deal card (contact + value + last activity), drag-to-move (HTML5 draggable), deal detail drawer. Org view tab shows deals across org members.',
    acceptanceCriteria: 'CRM tab shows pipeline board. Deals can be created and assigned to stages. Dragging a deal to a new column updates stage. Activity log attached to deal. Org view shows all org deals.',
    priority: 'p1', ...PENDING, hoursClaudeEst: 4, hoursBetsyEst: 0.5,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Connecting to ${BASE}…`);
  const cookie = await login();
  console.log('Logged in.\n');

  const { groups = [], items: existingItems = [] } = await getBacklog(cookie);

  const refToItem = new Map();
  for (const item of existingItems) {
    if (item.external_ref) refToItem.set(item.external_ref, item);
  }

  const slugMap = {};
  for (const g of groups) {
    if (g.slug) slugMap[g.slug] = g.id;
  }

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
  let createdDeployed = 0, skippedDeployed = 0;
  for (const item of NEW_DEPLOYED_ITEMS) {
    const { capabilitySlug, ...rest } = item;
    if (refToItem.has(rest.externalRef)) { console.log(`  SKIP (exists): ${rest.externalRef}`); skippedDeployed++; continue; }
    const groupId = slugMap[capabilitySlug] || null;
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}"`);
    const result = await createItem(cookie, { ...rest, capabilityGroupId: groupId, source: 'bulk_script' });
    console.log(`  CREATED [${result.id}]: ${rest.title.slice(0, 70)}`);
    createdDeployed++;
  }

  // ── NEW PENDING ──
  console.log('\n=== CREATING new pending items ===');
  let createdPending = 0, skippedPending = 0;
  for (const item of NEW_PENDING_ITEMS) {
    const { capabilitySlug, ...rest } = item;
    if (refToItem.has(rest.externalRef)) { console.log(`  SKIP (exists): ${rest.externalRef}`); skippedPending++; continue; }
    const groupId = slugMap[capabilitySlug] || null;
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}"`);
    const result = await createItem(cookie, { ...rest, capabilityGroupId: groupId, source: 'bulk_script' });
    console.log(`  CREATED [${result.id}]: ${rest.title.slice(0, 70)}`);
    createdPending++;
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Updates applied:    ${updated}  (${updateMissed} refs not found)
Deployed created:   ${createdDeployed}  (${skippedDeployed} already existed)
Pending created:    ${createdPending}  (${skippedPending} already existed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => { console.error(e); process.exit(1); });
