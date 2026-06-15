// v0.15 test scenarios — Resume fix, CRM Job Leads, Member Connections, Messaging, Inbox
//
// Idempotent by title. Usage: node scripts/add-v015-test-scenarios.mjs

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

const SCENARIOS = [

  // ──────────────────────────────────────────────────────────────────────────
  // RESUME GENERATOR
  // ──────────────────────────────────────────────────────────────────────────

  {
    title: 'v0.15: Admin — My Resume shows sections (scope bug fix)',
    capabilitySlug: 'output-pages',
    featureExternalRefs: ['v0.15 · resume-scope-fix'],
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Logged in as admin (Betsy) at /admin. At least one page with sections exists in the admin CMS (consulting-founder page).',
    steps: [
      { action: 'Click "My Profile" → "My Resume" tab', expectedOutcome: 'My Resume panel loads. Primary Resume card is visible.' },
      { action: 'Click "Edit Preset" on the Primary Resume card', expectedOutcome: 'Preset editor expands showing Layout Template and Include Sections pickers.' },
      { action: 'Look at the sections list under "Include Sections"', expectedOutcome: 'Sections are listed (not "Loading profile sections…" permanently). Sections from the consulting-founder page (e.g. Timeline, Industries) are present.' },
      { action: 'Toggle a section to "Included"', expectedOutcome: 'Gold numbered badge appears next to the section. Section is now part of the preset.' },
      { action: 'Click "Save Preset"', expectedOutcome: 'Toast confirms "Preset saved". The preset card shows updated section count.' },
      { action: 'Scroll down to "Resume Interpreter Agent". Paste any job description text. Click "Tailor My Resume"', expectedOutcome: 'Agent runs (spinner visible). After a few seconds, a structured diff appears showing tailored resume sections.' },
    ],
  },

  {
    title: 'v0.15: My Resume panel — create new preset with layout + sections',
    capabilitySlug: 'output-pages',
    featureExternalRefs: ['v0.15 · resume-scope-fix'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Logged in as admin or member at /admin or /member. My Resume tab open.',
    steps: [
      { action: 'Click "+ New Preset"', expectedOutcome: 'Name prompt modal appears.' },
      { action: 'Type "ERP Consultant" and press Enter', expectedOutcome: 'Modal closes. Preset editor opens for "ERP Consultant" preset.' },
      { action: 'Click the "Modern SB" layout thumbnail', expectedOutcome: 'Modern SB thumbnail shows gold border (selected).' },
      { action: 'Toggle 3 sections to "Included"', expectedOutcome: 'Badges 1, 2, 3 appear on each section. Drag to reorder — sections swap positions.' },
      { action: 'Click "Save Preset"', expectedOutcome: '"ERP Consultant" appears in the Other Presets grid with "3 sections · Modern SB".' },
      { action: 'Click "Set Primary" on the new preset', expectedOutcome: 'New preset moves to the Primary Resume hero card. Old primary moves to the grid.' },
      { action: 'Click "Preview PDF" on the primary preset', expectedOutcome: 'Inline iframe opens showing /output/resume. Layout tabs appear (Classic SB, Modern SB, etc.). PDF is renderable.' },
    ],
  },

  {
    title: 'v0.15: My Resume — agent diff view and accept flow',
    capabilitySlug: 'output-pages',
    featureExternalRefs: ['v0.15 · resume-scope-fix'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Admin at /admin > My Profile > My Resume. A preset with at least 2 sections included exists.',
    steps: [
      { action: 'Select a preset with sections from the "Starting from preset" dropdown', expectedOutcome: 'No warning about "0 sections" shown (or it warns if 0 sections — this is expected behavior).' },
      { action: 'Paste a realistic job description (e.g. "Director of Finance Operations… must have ERP experience…") into the text area', expectedOutcome: 'Text pasted successfully.' },
      { action: 'Click "✦ Tailor My Resume"', expectedOutcome: 'Button shows "⏳ Analyzing…". Agent runs.' },
      { action: 'Wait for agent to return (10–30 seconds)', expectedOutcome: 'Structured diff view appears below with "Agent Tailored Preview" navy header, tailored summary, per-section changes (UPDATED/ADDED/UNCHANGED badges), and recommendations.' },
      { action: 'Click "✓ Accept & Save Preset"', expectedOutcome: 'New preset saved (toast confirmation). Diff view clears. New AI-tailored preset appears in Other Presets grid with "✦ AI tailored" label.' },
      { action: 'Click "Discard" on a separate agent run instead of Accept', expectedOutcome: 'Diff clears without saving. Presets list unchanged.' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CRM: MANUAL LEAD CREATION
  // ──────────────────────────────────────────────────────────────────────────

  {
    title: 'v0.15: CRM — manually add a network lead without sending email',
    capabilitySlug: 'crm',
    featureExternalRefs: ['v0.15 · crm-manual-lead-creation'],
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Logged in as admin at /admin. CRM > Leads panel open.',
    steps: [
      { action: 'Click "+ Add Lead" button in the Leads panel header', expectedOutcome: 'Create lead form expands inline below the header. "Network Lead" tab is selected by default.' },
      { action: 'Enter email: "testmanual@example.com", name: "Test Manual", leave phone blank', expectedOutcome: 'Fields fill correctly.' },
      { action: 'Check "Skip confirmation email" checkbox', expectedOutcome: 'Checkbox is checked.' },
      { action: 'Click "Add Lead"', expectedOutcome: 'Toast "Lead created". Form collapses. New lead appears at top of lead list with "Manual" source badge.' },
      { action: 'Click the new lead in the list', expectedOutcome: 'Detail pane shows email, name, "Manual" source. No phone, no answers section.' },
      { action: 'Verify no email sent (check Brevo dashboard or stdout logs)', expectedOutcome: 'No outbound email sent to testmanual@example.com.' },
    ],
  },

  {
    title: 'v0.15: CRM — create a job lead with full job details',
    capabilitySlug: 'crm',
    featureExternalRefs: ['v0.15 · crm-job-lead-type'],
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Logged in as admin at /admin. CRM > Leads panel open.',
    steps: [
      { action: 'Click "+ Add Lead". Click "Job Lead" type button', expectedOutcome: 'Form switches to job lead mode. Fields change: Company, Hiring Manager, Job URL, Status, Job Description appear. Phone field hidden.' },
      { action: 'Fill: email: recruiter@bigcorp.com, company: "BigCorp Inc", hiring manager: "Jane Doe — jane@bigcorp.com", job URL: "https://bigcorp.com/jobs/123", status: "New", paste 200-char job description', expectedOutcome: 'All fields accept input correctly.' },
      { action: 'Check "Skip confirmation email". Click "Add Lead"', expectedOutcome: 'Toast "Lead created". Lead appears in list.' },
      { action: 'Click the "Job" filter tab', expectedOutcome: 'Only job leads are shown. New BigCorp lead is visible. Shows "BigCorp Inc" prominently with "New" status badge.' },
      { action: 'Click the BigCorp lead in the list', expectedOutcome: 'Detail pane shows: company name as heading, "Job Lead" label with New status badge, "Job Details" section with company, hiring manager, job URL link, and truncated job description.' },
      { action: 'Click "Edit Job Info". Change status to "Applied". Click "Save"', expectedOutcome: 'Status badge updates to "Applied" in both list and detail view.' },
    ],
  },

  {
    title: 'v0.15: CRM — lead type filter tabs work correctly',
    capabilitySlug: 'crm',
    featureExternalRefs: ['v0.15 · crm-job-lead-type'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'At least 2 network leads and 1 job lead exist in the system.',
    steps: [
      { action: 'Open Leads panel. Look at the type tabs below the header', expectedOutcome: 'Three tabs: "All (N)", "Network (n)", "Job (j)" with counts. All tab is active by default.' },
      { action: 'Click "Job" tab', expectedOutcome: 'Only job leads shown. Network leads filtered out. Count matches.' },
      { action: 'Click "Network" tab', expectedOutcome: 'Only network leads shown. Job leads filtered out.' },
      { action: 'Click "All" tab', expectedOutcome: 'All leads shown. Both types visible.' },
      { action: 'Export CSV while on "All" tab', expectedOutcome: 'CSV downloads. Includes "type" column with "network" and "job" values. Job leads have company and job_status columns populated.' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MEMBER CONNECTIONS
  // ──────────────────────────────────────────────────────────────────────────

  {
    title: 'v0.15: Member connections — send and accept a connection request',
    capabilitySlug: 'network-relationship-mgmt',
    featureExternalRefs: ['v0.15 · member-connections'],
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Two member accounts exist (Member A and Member B). Member B has a published profile at /u/member-b-slug. Both members are logged in on separate browser sessions.',
    steps: [
      { action: 'As Member A, navigate to /u/member-b-slug', expectedOutcome: 'Profile page loads. A "+ Connect" button is visible in the top nav (gold outline button).' },
      { action: 'Click "+ Connect"', expectedOutcome: 'Button changes to "Request Sent" (grey, non-clickable). No page reload.' },
      { action: 'As Member B, go to /member → My Profile → Inbox → Requests tab', expectedOutcome: 'One pending request appears. Shows Member A\'s slug/email, timestamp, and Accept/Decline buttons.' },
      { action: 'As Member B, click "Accept"', expectedOutcome: 'Toast "Connection accepted". Request disappears from the list.' },
      { action: 'As Member A, navigate to /u/member-b-slug again (refresh)', expectedOutcome: '"+ Connect" button is gone. "Message" button (gold) appears instead.' },
      { action: 'As Member B, go to Inbox → Connections tab', expectedOutcome: 'Member A appears in the connections list.' },
    ],
  },

  {
    title: 'v0.15: Member connections — decline a request',
    capabilitySlug: 'network-relationship-mgmt',
    featureExternalRefs: ['v0.15 · member-connections'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Two member accounts. Member A has sent a connection request to Member B (use previous test or re-send). Member B is logged in at /member.',
    steps: [
      { action: 'As Member B, go to Inbox → Requests', expectedOutcome: 'Pending request from Member A visible.' },
      { action: 'Click "Decline"', expectedOutcome: 'Toast "Request declined". Request disappears from list.' },
      { action: 'As Member A, navigate to /u/member-b-slug', expectedOutcome: '"+ Connect" button is visible again (or "Request Sent" still shows — either is acceptable; re-request from same person behavior).' },
    ],
  },

  {
    title: 'v0.15: Connection button hidden from anonymous visitors',
    capabilitySlug: 'security-and-data',
    featureExternalRefs: ['v0.15 · member-connections'],
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'A published member profile exists at /u/some-slug. You are NOT logged in (incognito window).',
    steps: [
      { action: 'Navigate to /u/some-slug in an incognito browser', expectedOutcome: 'Profile page loads normally. No "+ Connect" button is visible anywhere in the nav.' },
      { action: 'Inspect page source / network tab for /api/members/me/connection-status/:slug request', expectedOutcome: 'No connection status API call is made. The component renders nothing for anonymous users.' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MEMBER MESSAGING
  // ──────────────────────────────────────────────────────────────────────────

  {
    title: 'v0.15: Member messaging — send message from profile page',
    capabilitySlug: 'network-relationship-mgmt',
    featureExternalRefs: ['v0.15 · member-messaging'],
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Member A and Member B are connected (accepted connection). Member A is logged in. Member B has a published profile.',
    steps: [
      { action: 'As Member A, visit /u/member-b-slug', expectedOutcome: '"Message" gold button visible in nav (because they are connected).' },
      { action: 'Click "Message"', expectedOutcome: 'Message compose popover opens below/near the button with a textarea and Send/Cancel buttons.' },
      { action: 'Type "Hi, this is a test message from Member A" and click "Send"', expectedOutcome: 'Toast "Message sent". Popover closes.' },
      { action: 'As Member B, go to /member → Inbox → Messages tab', expectedOutcome: 'Thread list shows Member A as a sender. "1 new" badge visible on their entry (or unread indicator).' },
      { action: 'Click Member A\'s thread', expectedOutcome: 'Thread view opens. "Hi, this is a test message from Member A" shows as a received bubble (left-aligned, grey).' },
      { action: 'Type a reply and press Enter', expectedOutcome: 'Reply sends. Blue/gold bubble appears on the right side. Conversation is bidirectional.' },
    ],
  },

  {
    title: 'v0.15: Member messaging — non-connection cannot send message (403)',
    capabilitySlug: 'security-and-data',
    featureExternalRefs: ['v0.15 · member-messaging'],
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Member A and Member C exist but are NOT connected.',
    steps: [
      { action: 'As Member A, attempt POST /api/members/me/messages with recipientId=Member C\'s userId (via curl or dev tools)', expectedOutcome: '403 response: {"error":"you must be connected to message this member"}.' },
      { action: 'As Member A, visit /u/member-c-slug', expectedOutcome: 'No "Message" button in nav. "Connect" button visible instead (or "Request Sent" if pending).' },
    ],
  },

  {
    title: 'v0.15: Member messaging — thread view marks messages as read',
    capabilitySlug: 'network-relationship-mgmt',
    featureExternalRefs: ['v0.15 · member-messaging'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Member A has sent 2 messages to Member B. Member B has not opened the thread yet.',
    steps: [
      { action: 'As Member B, check GET /api/members/me/messages/unread-count', expectedOutcome: 'Returns {"count": 2}.' },
      { action: 'Go to Inbox → Messages. Click Member A\'s thread', expectedOutcome: 'Thread view opens. Both messages visible.' },
      { action: 'Navigate away from the thread and check unread count again', expectedOutcome: 'Returns {"count": 0} — messages marked read when thread was opened.' },
      { action: 'Thread list entry for Member A no longer shows "2 new" badge', expectedOutcome: 'Unread indicator removed.' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INBOX PANEL
  // ──────────────────────────────────────────────────────────────────────────

  {
    title: 'v0.15: InboxPanel — all three tabs accessible and functional',
    capabilitySlug: 'network-relationship-mgmt',
    featureExternalRefs: ['v0.15 · inbox-panel'],
    environmentScope: 'prod',
    priority: 'p0',
    preconditions: 'Logged in as a member at /member. Has at least 1 message, 1 pending request, and 1 accepted connection.',
    steps: [
      { action: 'From member dashboard, find and click the "Inbox" tab in the nav', expectedOutcome: 'Inbox panel loads. Three sub-tabs visible: Messages, Requests (with count if pending), Connections.' },
      { action: 'Click "Messages" tab', expectedOutcome: 'Left column shows thread list. Right column shows "Select a conversation" placeholder.' },
      { action: 'Click a sender in the thread list', expectedOutcome: 'Right pane shows thread view with chat bubbles. Sent messages right-aligned (gold), received left-aligned (grey). Name/slug shown in thread header.' },
      { action: 'Click "Requests" tab', expectedOutcome: 'Pending connection requests appear. Each shows requester name/slug, timestamp, Accept and Decline buttons.' },
      { action: 'Click "Connections" tab', expectedOutcome: 'Accepted connections listed. Each shows name/slug, "Connected X days ago", Profile ↗ link, and Message button.' },
      { action: 'Click "Message" next to a connection in the Connections tab', expectedOutcome: 'Switches to Messages tab with that connection\'s thread open.' },
    ],
  },

  {
    title: 'v0.15: InboxPanel — enter to send, no page reload',
    capabilitySlug: 'network-relationship-mgmt',
    featureExternalRefs: ['v0.15 · inbox-panel'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Member logged in. Inbox open on a thread.',
    steps: [
      { action: 'Click in the message compose textarea at the bottom of the thread view', expectedOutcome: 'Cursor focuses in the textarea.' },
      { action: 'Type "Enter-key test message" and press Enter', expectedOutcome: 'Message sends. No page reload. New bubble appears immediately in the thread. Textarea clears.' },
      { action: 'Type a multi-line message using Shift+Enter, then press Enter', expectedOutcome: 'Shift+Enter adds a newline within the textarea. Pressing Enter without Shift sends the message.' },
    ],
  },

  {
    title: 'v0.15: InboxPanel — "Requests (N)" count shows pending count',
    capabilitySlug: 'network-relationship-mgmt',
    featureExternalRefs: ['v0.15 · inbox-panel'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Member has 2 pending incoming connection requests.',
    steps: [
      { action: 'Look at the Inbox panel sub-tab header', expectedOutcome: '"Requests (2)" tab label is visible (count in parentheses).' },
      { action: 'Accept one request', expectedOutcome: 'Tab label changes to "Requests (1)". The accepted request disappears from the requests list.' },
      { action: 'Accept the remaining request', expectedOutcome: 'Tab label changes to "Requests" (no count, or "(0)"). Both former requesters now appear in Connections tab.' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CROSS-CUTTING / REGRESSION
  // ──────────────────────────────────────────────────────────────────────────

  {
    title: 'v0.15: Regression — existing Leads panel (network leads) unaffected',
    capabilitySlug: 'crm',
    featureExternalRefs: ['v0.15 · crm-manual-lead-creation', 'v0.15 · crm-job-lead-type'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'At least one existing network lead captured from public form (joinNetwork or contact source).',
    steps: [
      { action: 'Open CRM > Leads. Click "All" tab', expectedOutcome: 'All existing leads appear including pre-v0.15 leads.' },
      { action: 'Click a legacy (network) lead from a public form submission', expectedOutcome: 'Detail panel shows email, name, captured answers, source label (Join the Network, Contact, etc.). No job fields section.' },
      { action: 'Confirm the "View as lead ↗" link still works', expectedOutcome: 'Opens /lead/:publicId in a new tab. Lead view page loads correctly.' },
      { action: 'Delete a lead via the Delete button', expectedOutcome: 'Confirmation dialog. On confirm, lead removed from list.' },
    ],
  },

  {
    title: 'v0.15: Regression — admin shell tabs and navigation unaffected',
    capabilitySlug: 'admin-experience',
    featureExternalRefs: ['v0.15 · inbox-panel'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'Logged in as admin at /admin.',
    steps: [
      { action: 'Navigate through all top-level admin views (My Profile, PLM, CRM, System)', expectedOutcome: 'All views and their sub-tabs load without errors.' },
      { action: 'Click My Profile — should open the CMS content editor', expectedOutcome: 'Sidebar + EditorPane + PreviewPane layout appears.' },
      { action: 'Navigate to My Profile → My Resume', expectedOutcome: 'Resume panel loads. Sections visible (scope fix confirmed).' },
      { action: 'Navigate to My Profile → Inbox (if admin has this tab)', expectedOutcome: 'InboxPanel loads. Three tabs visible.' },
      { action: 'Navigate to CRM → Leads', expectedOutcome: 'Leads panel loads. "+ Add Lead" button visible. Type filter tabs present.' },
    ],
  },

  {
    title: 'v0.15: Regression — public profile pages scroll and render correctly',
    capabilitySlug: 'public-site-content',
    featureExternalRefs: ['v0.15 · member-connections'],
    environmentScope: 'prod',
    priority: 'p1',
    preconditions: 'A published member profile exists at /u/some-slug.',
    steps: [
      { action: 'Navigate to /u/some-slug as an anonymous user', expectedOutcome: 'Profile loads. Nav has brand styling. No "+ Connect" or "Message" buttons visible.' },
      { action: 'Scroll down the page', expectedOutcome: 'Page scrolls smoothly. All sections visible. Footer appears at bottom.' },
      { action: 'Log in as a member in the same tab (navigate to /login, then return to /u/some-slug)', expectedOutcome: '"+Connect" button visible in nav IF not already connected to this member.' },
      { action: 'Check the profile loads in <3 seconds on a standard connection', expectedOutcome: 'No layout shift. Sections render in correct order.' },
    ],
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
  const { scenarios: existingScenarios = [] } = await getScenarios(cookie);

  const refToItem = new Map();
  for (const item of existingItems) {
    if (item.external_ref) refToItem.set(item.external_ref, item);
  }

  const slugMap = {};
  for (const g of groups) {
    if (g.slug) slugMap[g.slug] = g.id;
  }

  const existingTitles = new Set(existingScenarios.map(s => s.title));

  console.log('=== CREATING test scenarios ===');
  let created = 0, skipped = 0;

  for (const scenario of SCENARIOS) {
    if (existingTitles.has(scenario.title)) {
      console.log(`  SKIP (exists): ${scenario.title.slice(0, 70)}`);
      skipped++; continue;
    }

    const { capabilitySlug, featureExternalRefs = [], ...rest } = scenario;
    const capabilityId = slugMap[capabilitySlug] || null;
    if (!capabilityId) console.warn(`  WARN: no group for slug "${capabilitySlug}"`);

    const backlogItemIds = featureExternalRefs
      .map(ref => refToItem.get(ref)?.id)
      .filter(Boolean);

    const payload = {
      ...rest,
      capabilityId,
      backlogItemIds,
    };

    const result = await createScenario(cookie, payload);
    console.log(`  CREATED [${result.id}]: ${rest.title.slice(0, 70)}`);
    created++;
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scenarios created:  ${created}
Scenarios skipped:  ${skipped} (already existed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => { console.error(e); process.exit(1); });
