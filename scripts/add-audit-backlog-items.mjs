// Adds 33 backlog items identified during the post-Session-2 chat audit:
//   Group A: 5 Phase B profile-admin items
//   Group B: 8 multi-session roadmap items
//   Group C: 18 session-task-tracker items
//   Group D: 2 tech-debt observations
//
// All items have status='pending' (nothing built yet). Idempotent by
// external_ref — re-runs skip items already present.
//
// Usage: node scripts/add-audit-backlog-items.mjs

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

// Common payload bits for pending items.
const PENDING_FRONTEND_BACKEND = {
  status: 'pending', kind: 'feature',
  deployedGithub: false, deployedRender: false, deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: true },
};
const PENDING_BACKEND_ONLY = {
  status: 'pending', kind: 'feature',
  deployedGithub: false, deployedRender: false, deployedNetlify: false,
  deployRelevance: { github: true, render: true, netlify: false },
};
const PENDING_INFRA_ONLY = {
  status: 'pending', kind: 'chore',
  deployedGithub: false, deployedRender: false, deployedNetlify: false,
  deployRelevance: { github: false, render: false, netlify: false },
};

const ITEMS = [
  // ──────────────────────── Group A · Phase B profile-admin ────────────────────────
  {
    capabilitySlug: 'admin-experience', externalRef: 'PB.1 · profile-admin · jobs-list',
    title: 'Jobs as dynamic add/remove list in Resume sections',
    summary: 'Replace hardcoded role1/role2/role3 slots with a true dynamic list — add, delete, reorder.',
    userStory: 'As a member editing my resume, I want to add as many jobs as I need (or remove some) without being capped at a fixed slot count, so my profile reflects my full career arc.',
    requirementDetail:
      'The Resume block currently uses fixed field keys (role1, role1Desc, role1Start, role1End, role2, ...) up to role6. Refactor to store roles as an array under section.fields.roles, each with { title, company, start, end, description, current? }. EditorPane gets a custom list editor for the "roles" key: add row button at bottom, drag handles for reorder, delete icon per row. Migration step converts existing role* keys to the new array on first load.',
    businessRules:
      '- Existing role1...role6 data migrates lossless on first read.\n- Current job (no end date) renders as "(present)" on the public view.\n- A role with no title is filtered from public render but kept in edit state.\n- Reorder is by drag handle; keyboard accessibility via up/down arrow buttons.',
    designSpec:
      'List editor below the standard field grid. Each row: drag handle · Title input · Company input · Start (date picker, from PA.4) · End (date picker or "Current" checkbox) · Description textarea · delete button. Plus a full-width "+ Add role" button at bottom.',
    acceptanceCriteria:
      'Given I have 3 existing roles\nWhen I click + Add role\nThen a 4th empty row appears\nAnd saving persists all 4 in the array.',
    processSteps: '1. Edit Resume section → 2. See list of roles → 3. Add / delete / reorder → 4. Save → 5. Publish → 6. Public profile shows updated list.',
    priority: 'p1', tags: ['phase-b', 'editor', 'resume', 'member'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'admin-experience', externalRef: 'PB.2 · profile-admin · cta-configurability',
    title: 'CTA / button configurability per section',
    summary: 'Sections with buttons (References request, Contact, lead-capture forms) expose label + target + form-recipient as editable fields.',
    userStory: 'As a member, I want to control where my CTAs send visitors and what they say, so I can route engagement to my preferred channel.',
    requirementDetail:
      'Section types with CTAs currently render hardcoded behavior (e.g. References request submits to /api/leads with source=references). Refactor to expose: cta1Label / cta1Target / cta1FormRecipient + (where applicable) cta1Action ("submit form" | "external link" | "scroll-to-anchor") as editable fields on the section. EditorPane shows them grouped under a "CTAs" sub-heading.',
    businessRules:
      '- Default behavior preserved when fields are blank (back-compat).\n- "submit form" routes to /api/leads with source=<section-id> automatically.\n- "external link" requires cta1Target to be an absolute URL.\n- "scroll-to-anchor" requires a matching id on the page.',
    designSpec:
      'Grouped under "Call-to-Action 1" / "Call-to-Action 2" in the field editor. Each group shows the action selector first (dropdown), then conditionally relevant inputs based on the action.',
    acceptanceCriteria:
      'Given I am editing a References Request section\nWhen I change cta1Label to "Talk to Betsy"\nThen the public site button reads "Talk to Betsy"\nAnd clicking still posts to /api/leads as source=references.',
    processSteps: '1. Member opens section editor → 2. Edits CTA fields → 3. Saves + publishes → 4. Public visitor sees new label + behavior.',
    priority: 'p1', tags: ['phase-b', 'editor', 'cta'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'output-pages', externalRef: 'PB.3 · resume-layouts',
    title: 'Multiple resume layout variants',
    summary: 'Career timeline + case studies offer 2-3 alternative visual treatments selectable per member.',
    userStory: 'As a member with a specific brand aesthetic, I want to pick a resume layout that fits my style (timeline vs. card grid vs. modern columns) instead of being locked into the Salt Basin default.',
    requirementDetail:
      'Resume block + Case Studies block each gain a "variant" field (e.g. "timeline" | "cards" | "columns"). Each variant is a separate render path inside the block component, sharing the same data. Member picks the variant from the section editor.',
    businessRules:
      '- Variants share the same data — switching layouts never loses content.\n- Default variant: timeline (current behavior).\n- Print output (/output/resume) honors the variant.',
    designSpec:
      'Section editor: small visual radio-card picker showing tiny previews of each variant. Variants: 1) "Timeline" (current vertical timeline with gold rule), 2) "Cards" (grid of 3-col role cards), 3) "Columns" (sleek 2-col with photo on left, content on right).',
    acceptanceCriteria:
      'Given my resume has 5 roles\nWhen I switch variant from timeline to cards\nThen the same 5 roles render in a 3-column card grid\nAnd switching back restores the timeline.',
    processSteps: '1. Edit Resume section → 2. Pick variant → 3. Preview updates → 4. Publish.',
    priority: 'p2', tags: ['phase-b', 'resume', 'layout-variants'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'output-pages', externalRef: 'PB.4 · pdf-upload-auto-populate',
    title: 'PDF resume upload → AI auto-populate',
    summary: 'Member uploads their existing resume as PDF. Server parses + LLM extracts → roles, skills, education fill the Resume section + a layout is recommended.',
    userStory: 'As a new member with a polished existing resume, I want to upload my PDF and have the platform extract the structure so I do not have to retype everything.',
    requirementDetail:
      'PDF text extraction via pdf-parse or pdfjs. Extracted text sent to Claude with a structured-output prompt that returns { roles[], education[], skills[], summary, recommended_layout }. Result populates the member\'s Resume section as a proposed update — member previews + confirms before saving.',
    businessRules:
      '- PDFs only (no Word docs in v1).\n- Max 5MB.\n- LLM call uses the member\'s BYO Anthropic key OR a platform key.\n- Member can edit the proposed extraction before accepting.\n- Layout recommendation is just a suggestion; member can override.',
    designSpec:
      'New "Import from PDF" button in the Resume section editor. Opens a modal: upload area → progress → preview pane showing extracted data → Accept / Edit / Discard.',
    acceptanceCriteria:
      'Given I upload a clean PDF resume\nWhen extraction completes\nThen I see the parsed roles + education + skills in a preview\nAnd accepting populates my Resume section\'s data.',
    processSteps: '1. Click Import from PDF → 2. Upload → 3. Server extracts text → 4. LLM structures it → 5. Preview shown → 6. Member accepts → 7. Section populated.',
    priority: 'p2', tags: ['phase-b', 'resume', 'pdf', 'ai'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'admin-experience', externalRef: 'PB.5 · configurable-nav',
    title: 'Configurable top navigation + dropdown pages',
    summary: 'Nav structure (top items + dropdown grouping) editable from the admin instead of hardcoded.',
    userStory: 'As Betsy (or a member), I want to add, remove, or reorganize the nav items + dropdown groups without code changes.',
    requirementDetail:
      'New nav structure stored as a JSON tree under config.nav: [ { label, slug, kind: "page"|"dropdown", children?: [...] } ]. Admin gets a nav editor (sidebar list with add/edit/delete/reorder + nested dropdown editor). PublicNav component reads from config.nav and renders accordingly. Migration converts the current hardcoded nav to the JSON tree on first load.',
    businessRules:
      '- Empty nav.children = single link.\n- Non-empty children = dropdown with those links underneath.\n- Anchor links (e.g. /#contact) are supported.\n- Mobile collapses to existing hamburger pattern.',
    designSpec:
      'Inside admin Config: new "Navigation" card with a vertical list of nav items. Each row: drag handle · label input · slug/anchor input · expand-arrow if dropdown. Nested children indent. "+ Add nav item" buttons at root and per-dropdown.',
    acceptanceCriteria:
      'Given I add a "Resources" dropdown with 3 children\nWhen I publish\nThen the public nav shows a Resources dropdown with the 3 links\nAnd existing nav items still work.',
    processSteps: '1. Admin opens Config → Navigation card → 2. Edits structure → 3. Saves + publishes → 4. Public site nav updates.',
    priority: 'p2', tags: ['phase-b', 'nav', 'admin', 'config'],
    ...PENDING_FRONTEND_BACKEND,
  },

  // ──────────────────────── Group B · Multi-session roadmap ────────────────────────
  {
    capabilitySlug: 'multi-tenant-cms', externalRef: 'S3 · Templates Phase B · gallery UX',
    title: 'Templates Phase B — gallery UX',
    summary: 'Member admin gets a Templates tab: browse the 3 starters with previews + brand kits, apply with confirm dialog.',
    userStory: 'As a member, I want to see the templates with previews before I apply one, so I can pick the right archetype.',
    requirementDetail:
      'New "Templates" tab in MemberDashboard (member scope only). Grid of template cards each showing: archetype label, name, tagline, brand color swatch row, "Apply" + "Preview" buttons. Preview opens the template\'s home page in a modal iframe-like overlay. Apply shows a confirm dialog ("This will replace your draft pages — your changes will be lost") then calls /api/member-templates/:slug/apply.',
    businessRules:
      '- Member-only tab.\n- Preview reads pages_preset and renders in-process (not iframe) for parity with the live preview pane.\n- After Apply, member is redirected to My Site tab so they can immediately edit.',
    designSpec:
      '3-card grid (2-up on tablet, 1-up on mobile). Card chrome matches Salt Basin Strategic Operator palette. Color swatches row at top of card shows the brand kit. Hover state on the Apply button emphasizes the destructive nature.',
    acceptanceCriteria:
      'Given I am a member viewing the Templates tab\nWhen I click Apply on Consulting Practice\nThen I see a confirm dialog\nAnd confirming swaps my draft pages with the template + lands me on My Site.',
    processSteps: '1. Member opens Templates tab → 2. Reviews cards → 3. Previews one → 4. Applies → 5. Confirms → 6. Lands on My Site → 7. Edits.',
    priority: 'p1', tags: ['session-3', 'templates', 'phase-b', 'member'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'requirements-mgmt', externalRef: 'S3 · Scrum Agent Phase B · tools + propose-approve',
    title: 'Scrum Agent Phase B — backlog tools (propose-and-approve)',
    summary: 'Agent gains tools: list/get/search/create/update/archive backlog items + list groups. Each proposed change appears as a pending action card the user clicks Approve on.',
    userStory: 'As Betsy in a planning conversation, I want the agent to actually create + update requirements I dictate to it, without me having to manually paste between chat and the backlog.',
    requirementDetail:
      'Server-side: agent tool definitions for list_items / get_item / search_items / create_item / update_item / archive_item / list_groups. Each tool returns either a result OR a "proposed_action" object. UI: when the agent\'s response contains proposed_actions, render each as a card with "Approve / Reject" buttons. Approve commits via the existing /api/backlog/items endpoints.',
    businessRules:
      '- Nothing hits the DB until user clicks Approve.\n- Multiple proposed actions in one turn: each gets its own card, approve individually.\n- Approved actions are logged to agent_messages as role=tool_result with success/failure.\n- Rejected actions are logged similarly with the user\'s optional rejection note.',
    designSpec:
      'Proposed action card inside the chat bubble: small ✦ icon · short summary ("Update item #42: change status to in_progress") · Approve button (gold) · Reject button (outline) · expand chevron to see full diff. After approve/reject, card collapses to a one-line confirmation.',
    acceptanceCriteria:
      'Given I say "Create a defect for the date picker not parsing European date formats"\nWhen the agent proposes the action\nThen I see a card with title + capability + summary\nAnd clicking Approve inserts the item into the backlog.',
    processSteps: '1. Conversation produces proposal → 2. Card renders → 3. User reviews → 4. Approve or Reject → 5. Action commits (or not) → 6. Result logged.',
    priority: 'p1', tags: ['session-3', 'agent', 'phase-b', 'tools'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'requirements-mgmt', externalRef: 'S4 · JIRA Phase B · bidirectional sync',
    title: 'JIRA Phase B — bidirectional sync + conflict resolution',
    summary: 'Backlog edits push to JIRA; JIRA webhook updates push back. Conflict UX when both sides changed since last sync.',
    userStory: 'As Betsy, I want my backlog and JIRA to stay in sync both ways, so I can plan in either tool without one source becoming stale.',
    requirementDetail:
      'Outbound: every PATCH to a backlog item with non-null jira_issue_key fires a PUT to JIRA REST. Inbound: register /api/jira/webhook endpoint with signature validation; on issue.updated payload, find matching backlog row by jira_issue_key, apply the JIRA changes. Conflict detection: if both sides changed since last_pull_at, mark the item with conflict_flag + show "Resolve conflict" UI.',
    businessRules:
      '- Mapping: status / priority / type fields sync. Free-text fields (requirement_detail, business_rules) are local-only for now.\n- Webhook requires JIRA Cloud app or shared secret for signature validation.\n- Conflicts: show side-by-side view with "Keep mine / Keep JIRA / Merge manually" actions.',
    designSpec:
      'Conflict resolution UI inside the BacklogDrawer when conflict_flag=true: orange band at top with "Both sides changed since last sync. Resolve below." Below: two columns showing the conflicting values, with radio selectors per field.',
    acceptanceCriteria:
      'Given I update a backlog item locally and the JIRA issue also updated\nWhen I open the item\nThen I see the conflict band\nAnd resolving routes the chosen values to both stores.',
    processSteps: '1. Edit locally → 2. PUT to JIRA → 3. Webhook on JIRA change → 4. Apply locally → 5. Conflict detected → 6. UI prompts resolve → 7. Both stores aligned.',
    priority: 'p1', tags: ['session-4', 'jira', 'phase-b', 'sync'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'multi-tenant-cms', externalRef: 'S4 · Image Library',
    title: 'Image library: upload + Unsplash search + AI-generated',
    summary: 'Member admin gains an image library: their own uploads (Supabase Storage), Unsplash search by keyword, and AI-generated images via Replicate or similar.',
    userStory: 'As a member building my profile, I want to grab a good image without leaving the platform, whether from my own collection or stock photography.',
    requirementDetail:
      'Three sources unified under a single Image Library panel: (1) member uploads via existing /api/uploads route, (2) Unsplash API search with chosen image saved to the member\'s library, (3) AI generation via Replicate (cheap, broad models) — admin-config\'d provider key, billed per image. Image picker is reusable — appears wherever an image field is edited.',
    businessRules:
      '- Library is per-member (uploads scoped to user_id).\n- Unsplash images respect attribution (stored alongside).\n- AI generation cost is tracked per member (capped via member-level setting).\n- All library items can be deleted by the member.',
    designSpec:
      'Tab-bar at top: Mine / Unsplash / AI. Grid of thumbnails. Click to insert. Right rail shows source attribution + delete.',
    acceptanceCriteria:
      'Given I am editing a section with an image field\nWhen I click the image picker\nThen the library opens with my uploads + Unsplash search + AI tab\nAnd choosing any image populates the field.',
    processSteps: '1. Edit field → 2. Open library → 3. Browse / search / generate → 4. Pick → 5. Field populated → 6. Save + publish.',
    priority: 'p2', tags: ['session-4', 'images', 'library', 'ai'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'requirements-mgmt', externalRef: 'S5 · Scrum Agent Phase C · sprint planning',
    title: 'Scrum Agent Phase C — sprint planning tools',
    summary: 'New sprints table + agent tools to assign items to sprints, set capacity, recommend assignments based on velocity.',
    userStory: 'As Betsy planning next iteration, I want the agent to look at the backlog + my historical velocity + priorities and propose a sprint plan I can ratify.',
    requirementDetail:
      'New sprints table (id, name, start, end, capacity_hours, status). New backlog_items.sprint_id column. Agent tools: list_sprints / create_sprint / assign_to_sprint / list_sprint / set_sprint_capacity / recommend_sprint_assignments. The recommend tool looks at hours estimates per item, priority, dependencies, and proposes a balanced sprint.',
    businessRules:
      '- Sprint length is configurable per sprint (default 2 weeks).\n- One active sprint at a time; future sprints can be drafted.\n- Recommendations are proposals — propose-and-approve as Phase B established.',
    designSpec:
      'Sprint view inside Backlog (new sub-tab or section in the existing left rail). Shows the active sprint as a kanban-style column list (backlog / in progress / completed). Agent chat can reference sprints by name.',
    acceptanceCriteria:
      'Given I ask the agent "Plan a 2-week sprint with my 5 most important items"\nWhen the agent proposes assignments\nThen I see a card per assignment\nAnd approving each adds the item to that sprint.',
    processSteps: '1. Create sprint → 2. Agent recommends items → 3. Approve each assignment → 4. Work the sprint → 5. Close out.',
    priority: 'p1', tags: ['session-5', 'agent', 'phase-c', 'sprint-planning'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'multi-tenant-cms', externalRef: 'S5 · Brand Kit expansion',
    title: 'Brand kit expansion — logo, fonts, SEO meta, custom domain',
    summary: 'Beyond colors: logo upload, font pairing picker, SEO meta (title/description/OG image), custom domain field.',
    userStory: 'As a member with a real brand identity, I want to express it fully — logo, type, social-card previews — not just colors.',
    requirementDetail:
      'Member Config gains a Brand Kit card with: logo URL/upload, font picker (3-4 curated Google Fonts pairs: Cormorant+Inter / Playfair+Source Sans / Merriweather+Lato / Bodoni+Karla), SEO meta (title template, description, OG image upload), custom domain field (for future custom-domain serving from Netlify).',
    businessRules:
      '- Logo renders in the public profile nav and on Net Works home banner card.\n- Font picker swaps --sb-font-display + --sb-font-body on member profile pages only.\n- SEO meta populates <title>, <meta description>, <meta property="og:*">.\n- Custom domain is collected but not yet served (future infrastructure work).',
    designSpec:
      'Brand Kit card sections: Identity (name, logo, tagline) · Typography (font pair selector with previews) · SEO (3 inputs + OG image picker) · Custom Domain (single input).',
    acceptanceCriteria:
      'Given I upload a logo + pick Cormorant+Inter\nWhen I publish\nThen my profile nav shows my logo\nAnd the page renders in Cormorant for display + Inter for body.',
    processSteps: '1. Open Brand Kit card → 2. Configure → 3. Save + publish → 4. Profile recolors / re-types / re-metadatas.',
    priority: 'p2', tags: ['session-5', 'brand', 'config', 'expansion'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'requirements-mgmt', externalRef: 'S5 · JIRA Phase C · sprint sync',
    title: 'JIRA Phase C — sprint sync (one-way pull)',
    summary: 'JIRA sprints map to local sprints. Sprint name + start/end pull from JIRA on a schedule.',
    userStory: 'As Betsy using JIRA for sprint governance, I want JIRA sprints to be the source of truth and have my backlog mirror them.',
    requirementDetail:
      'Reuse the sprints table from Phase C. Add sprint_jira_id column. New background job pulls sprints from /rest/agile/1.0/board/<id>/sprint and upserts. Per-item sprint assignment also pulls from JIRA when an issue is updated (extends Phase B webhook handler).',
    businessRules:
      '- One-way (JIRA → local) in this phase. Bidirectional sprint sync is Phase D.\n- Closed sprints are kept but marked status=closed.\n- Capacity is local-only (JIRA does not expose capacity uniformly).',
    designSpec: 'Operational; no new UI beyond existing sprint view.',
    acceptanceCriteria:
      'Given JIRA has 3 sprints\nWhen the sync runs\nThen I see all 3 in my sprints view\nAnd issue assignments reflect their JIRA sprint.',
    processSteps: '1. JIRA sprint state → 2. Sync job → 3. Local sprints + assignments updated.',
    priority: 'p2', tags: ['session-5', 'jira', 'phase-c', 'sprints'],
    ...PENDING_BACKEND_ONLY,
  },
  {
    capabilitySlug: 'requirements-mgmt', externalRef: 'S6 · Scrum Agent Phase D · JIRA tools',
    title: 'Scrum Agent Phase D — JIRA tools (push / pull / reconcile)',
    summary: 'Agent gains tools to push items to JIRA, pull from JIRA, reconcile conflicts. Closes the loop.',
    userStory: 'As Betsy ending a planning session, I want to say "push this sprint to JIRA" and have the agent do it after I approve a preview.',
    requirementDetail:
      'Tools: push_to_jira(item_id) → POST to JIRA + sets jira_issue_key. pull_from_jira(issue_key) → fetches latest, applies via the existing webhook handler. reconcile(item_id) → opens the Phase B conflict resolver in the agent UI. push_sprint(sprint_id) → preview of all N items, single approve → batch push.',
    businessRules:
      '- All JIRA pushes go through Phase B\'s field mapping.\n- Batch push from sprint shows a single approval card with the N items listed.\n- Failed pushes log to agent_messages with the JIRA error.',
    designSpec:
      'Approval cards specialized for JIRA actions show the JIRA project + issue type that will be created.',
    acceptanceCriteria:
      'Given my sprint has 8 items, 0 of which are in JIRA\nWhen I ask the agent to push the sprint\nThen I see one card showing the 8 issues that will be created\nAnd approving creates all 8 in JIRA with jira_issue_key set locally.',
    processSteps: '1. Sprint complete → 2. Ask agent to push → 3. See preview → 4. Approve → 5. JIRA + local stay in sync.',
    priority: 'p1', tags: ['session-6', 'agent', 'phase-d', 'jira-integration'],
    ...PENDING_FRONTEND_BACKEND,
  },

  // ──────────────────────── Group C · Session task tracker migration ────────────────────────
  {
    capabilitySlug: 'lead-capture', externalRef: 'TT.72 · lead-file-upload',
    title: 'User-facing file upload on Lead view (persist + delete)',
    summary: 'Authenticated leads can upload files to their lead record — persists to Supabase Storage, deletable.',
    userStory: 'As a lead who wants to share supporting context (resume, RFP, brief), I want to attach files directly to my lead record so Betsy has them in one place.',
    requirementDetail:
      'On LeadView (when lead_session cookie present), expose an upload widget similar to the admin one. Files persist to Supabase Storage under lead-attachments/<publicId>/. New lead_attachments table tracks filename, size, content-type, uploaded_at. Member can delete their own uploads.',
    businessRules: '- Max 25MB per file.\n- Allowed types: pdf, doc/docx, images.\n- Deletion is soft (kept in storage 7 days for audit).',
    designSpec: 'Section between Activity and Add Note panels on the lead view. Drag-drop zone + button. List of existing uploads with download + delete.',
    acceptanceCriteria: 'Given I am authenticated to my lead record\nWhen I upload a PDF\nThen it appears in my attachments list\nAnd Betsy sees it in her admin view of the same lead.',
    processSteps: '1. Open lead URL → 2. Authenticate → 3. Upload → 4. File visible to both sides.',
    priority: 'p2', tags: ['leads', 'uploads', 'tt-72'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'observability', externalRef: 'TT.76 · secret-rotation-gh-action',
    title: 'Manual "rotate now" GitHub Action for Supabase + Render secrets',
    summary: 'GitHub Actions workflow that rotates Supabase + Render API keys on demand.',
    userStory: 'As Betsy maintaining the platform, I want to rotate critical secrets with one click rather than manually re-pasting through three dashboards.',
    requirementDetail:
      'workflow_dispatch action that: calls Supabase API to rotate service role key, calls Render API to rotate API key, fetches the new values, encrypts them, updates GitHub Secrets via the secret API. Re-uses libsodium-wrappers pattern from push-github-secrets.mjs.',
    businessRules: '- Manual trigger only (no schedule).\n- Logs success/failure to a GitHub Issue.\n- Old secrets retained for 24h to allow rollback.',
    designSpec: 'CI-only. No UI.',
    acceptanceCriteria: 'Given I trigger the workflow\nWhen it completes\nThen Supabase + Render APIs have new keys\nAnd GitHub Secrets are updated\nAnd I have a tracking issue for the rotation.',
    processSteps: '1. Trigger workflow → 2. Rotate via APIs → 3. Update GH secrets → 4. Log to issue.',
    priority: 'p3', tags: ['security', 'ci', 'tt-76'],
    ...PENDING_INFRA_ONLY,
  },
  {
    capabilitySlug: 'observability', externalRef: 'TT.77 · test-framework',
    title: 'Test framework: Vitest + Playwright + GitHub Issues integration',
    summary: 'Vitest unit tests, Playwright e2e tests, on-failure GitHub Issue auto-creation, all wired into GitHub Actions.',
    userStory: 'As Betsy growing the platform, I want a real test suite so regressions are caught before they hit prod.',
    requirementDetail:
      'Install vitest + @vitest/coverage-v8 + @playwright/test. Initial unit tests cover: email.js parseFrom + dispatch, backlog.js field mappers, member-templates apply interpolation. Initial e2e: admin login + create section + publish + view public. GitHub Actions runs both on PR + main; failures open Issues with the test output.',
    businessRules: '- Unit tests must pass before merge to main.\n- E2E runs on main pushes only (slower).\n- Issue auto-creation labeled "test-failure".',
    designSpec: 'CI-only.',
    acceptanceCriteria: 'Given I push a commit that breaks a test\nWhen CI runs\nThen the test fails loudly\nAnd a GitHub Issue is opened with the failure context.',
    processSteps: '1. Write code → 2. Push → 3. CI runs vitest + playwright → 4. Pass merge / fail issue.',
    priority: 'p2', tags: ['quality', 'testing', 'ci', 'tt-77'],
    ...PENDING_INFRA_ONLY,
  },
  {
    capabilitySlug: 'lead-capture', externalRef: 'TT.80 · email-verification',
    title: 'Email verification on lead submission',
    summary: 'Lead must click a verification link in their confirmation email before their record becomes "verified".',
    userStory: 'As Betsy, I want to know which lead emails are real so I can prioritize my outreach.',
    requirementDetail:
      'New leads.verified_email column. Confirmation email includes a unique verification link. Clicking sets verified_email=true. Admin Leads view filters/sorts by verified status.',
    businessRules: '- Token expires in 7 days.\n- Already-verified leads do not re-trigger verification.\n- Unverified leads still get full lead record access (they just lack the badge).',
    designSpec: 'Email gains a "Verify your email" CTA. Admin lead row shows a small green check badge for verified emails.',
    acceptanceCriteria: 'Given a new lead submits the form\nWhen they click the verify link in their email\nThen their record shows verified_email=true.',
    processSteps: '1. Lead submits → 2. Confirmation email sent → 3. Lead clicks verify link → 4. Verified status set.',
    priority: 'p1', tags: ['leads', 'verification', 'tt-80'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'email-infrastructure', externalRef: 'TT.83 · lead-receipt-email',
    title: 'Lead receipt confirmation email (separate template)',
    summary: 'Dedicated polished receipt email confirming submission — distinct from the URL+password notification.',
    userStory: 'As a lead who just submitted a form, I want a friendly receipt email that confirms my submission and sets expectations, not just credentials.',
    requirementDetail:
      'New template in email.js: sendLeadReceipt({ leadId, name, source }). Sent in addition to (or replacing) the URL+password confirmation depending on lead source. Includes: thank-you, summary of what they submitted, what to expect next, contact-info-for-questions.',
    businessRules: '- Sent immediately after lead create.\n- Source-specific copy ("Thanks for joining the network" vs "Thanks for the references request").\n- Does NOT include the password (security — that\'s in the URL email).',
    designSpec: 'Brand-styled HTML email matching the existing template look but warmer in voice.',
    acceptanceCriteria: 'Given I submit a contact form\nWhen the API returns success\nThen I receive 1 receipt email + 1 URL+password email within seconds.',
    processSteps: '1. Lead submits → 2. Receipt email sent → 3. URL+password email sent (existing) → 4. Both arrive in inbox.',
    priority: 'p1', tags: ['email', 'leads', 'tt-83'],
    ...PENDING_BACKEND_ONLY,
  },
  {
    capabilitySlug: 'lead-capture', externalRef: 'TT.84 · anonymous-follow',
    title: 'Anonymous "follow for updates" option',
    summary: 'Visitors can subscribe to updates with email only — no full lead form — and unsubscribe later.',
    userStory: 'As a casual visitor who wants to stay informed without a sales conversation, I want a lightweight follow option.',
    requirementDetail:
      'New followers table (id, email, created_at, unsubscribed_at). Public form on home page (small inline). Subscribers receive periodic updates (admin-curated). Unsubscribe link in every email.',
    businessRules: '- Single-opt-in (email entry counts).\n- Unsubscribed followers are NOT deleted, just marked.\n- Followers != leads (different table, different intent).',
    designSpec: 'Inline form at the bottom of the home page: single email input + "Follow updates" button.',
    acceptanceCriteria: 'Given I enter my email on the follow form\nWhen I submit\nThen I get a confirmation email\nAnd I can unsubscribe from any future update.',
    processSteps: '1. Visitor enters email → 2. Subscriber created → 3. Confirmation sent → 4. Future updates go out → 5. Unsubscribe anytime.',
    priority: 'p2', tags: ['leads', 'subscribers', 'tt-84'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'security-and-data', externalRef: 'TT.85 · lead-protection-never-delete',
    title: 'Lead protection: never delete, only convert/archive',
    summary: 'Business rule: leads are never hard-deleted. Conversion + archival are the only end-states.',
    userStory: 'As Betsy preserving relationship history, I want no lead data ever lost, so I can see the full context of every prior interaction.',
    requirementDetail:
      'Audit the schema + routes: no DELETE on leads, only status changes. Existing soft-delete (merged_into_id) preserves merged records. Add explicit archive_at + archive_reason columns. Admin Leads view gains an "Archived" filter.',
    businessRules: '- Hard delete is reserved for GDPR/data-removal requests (separate workflow with audit).\n- Default state: lead remains visible in active list forever.\n- Conversion (lead → member) preserves the lead record.',
    designSpec: 'Admin Leads view filter chip "Active / Archived / All".',
    acceptanceCriteria: 'Given a lead has been merged or marked stale\nWhen I view active leads\nThen they do not appear\nBut I can find them under the Archived filter.',
    processSteps: '1. Audit existing delete paths → 2. Replace with archival → 3. Add filter UI → 4. Document the rule.',
    priority: 'p1', tags: ['security', 'data', 'leads', 'tt-85'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'lead-capture', externalRef: 'TT.86 · lead-identity-matching',
    title: 'Lead identity matching + dedup analysis (admin tool)',
    summary: 'Admin can find suspected duplicate leads across all data points (email variants, phone formats, name fuzzy match) and merge with one click.',
    userStory: 'As Betsy with 100+ leads, I want a tool to find suspected duplicates I have not auto-merged, so I do not contact the same person twice.',
    requirementDetail:
      'New admin Leads view sub-panel "Suspected duplicates" running periodic match queries: email-domain matches, phone-prefix matches, name + similar email. UI shows pairs with one-click merge.',
    businessRules: '- Match-and-merge already happens at lead-create time. This is a retro tool for leads that pre-dated normalization.\n- Merges run through the same merged_into_id flow.',
    designSpec: 'Side panel listing suspected pairs with side-by-side previews + Merge / Dismiss / Keep separate buttons.',
    acceptanceCriteria: 'Given two leads with the same phone in different formats\nWhen I open suspected duplicates\nThen the pair appears\nAnd merging them combines into one record.',
    processSteps: '1. Periodic job builds candidate list → 2. Admin reviews → 3. Merge or dismiss per pair.',
    priority: 'p2', tags: ['leads', 'dedup', 'admin', 'tt-86'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'security-and-data', externalRef: 'TT.87 · signup-verification',
    title: 'Signup verification: prevent impersonation',
    summary: 'New member signups require email verification + (for institutional accounts) domain ownership proof before the profile goes live.',
    userStory: 'As Betsy protecting the network\'s integrity, I want signups verified so impersonators cannot pretend to be someone they are not.',
    requirementDetail:
      'New users.verified_at column. Member profile is invisible to public until verified_at is set. Verification flow: email click → unlock signup. For institutional signups (future), also require DNS TXT or HTML upload proof of domain ownership.',
    businessRules: '- Unverified members can edit their draft but not publish.\n- Verification email expires in 24h; can be resent.',
    designSpec: 'Member admin shows a yellow band at top until verified: "Verify your email to publish your profile."',
    acceptanceCriteria: 'Given I sign up\nWhen I have not verified my email\nThen I can edit but Publish is disabled\nAnd clicking the verify link unlocks publishing.',
    processSteps: '1. Sign up → 2. Verification email → 3. Click link → 4. Verified → 5. Can publish.',
    priority: 'p1', tags: ['security', 'signup', 'verification', 'tt-87'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'multi-tenant-cms', externalRef: 'TT.88 · user-hierarchy-sb_id',
    title: 'User hierarchy + internal universal identifier (sb_id)',
    summary: 'Every user gets a stable opaque sb_id. Foundation for cross-account linking, hierarchy (orgs > teams > individuals), and external integrations.',
    userStory: 'As Betsy building toward institutional accounts, I want a stable identifier for every entity in the system that does not change even if email or role does.',
    requirementDetail:
      'New users.sb_id column (TEXT, generated via crypto.randomBytes). All future links between users (admin manages members, members in same org, etc.) use sb_id. Backfill existing rows with generated values.',
    businessRules: '- sb_id is server-generated, never user-editable.\n- Format: prefix "sb_" + 22 chars base62.\n- Indexed for fast lookup.',
    designSpec: 'No user-facing UI.',
    acceptanceCriteria: 'Given a new user signs up\nWhen the row is created\nThen sb_id is populated and unique.',
    processSteps: '1. Signup → 2. sb_id generated → 3. Stored → 4. Used in all future relations.',
    priority: 'p1', tags: ['identity', 'foundation', 'tt-88'],
    ...PENDING_BACKEND_ONLY,
  },
  {
    capabilitySlug: 'multi-tenant-cms', externalRef: 'TT.89 · person-institution-dual-role',
    title: 'Person + Institution dual-role accounts',
    summary: 'A user can act as both an individual person AND as a member of one or more institutional accounts. Profiles and permissions scoped accordingly.',
    userStory: 'As an operator who consults under my own name AND through my firm, I want a single login that represents both identities.',
    requirementDetail:
      'New institutions table + memberships table linking users to institutions with a role (admin / member / contributor). User dashboard exposes a "Switch identity" affordance. Each identity has its own profile, brand kit, and Net Works opt-in status.',
    businessRules: '- One user, many memberships.\n- Institution profiles live alongside personal profiles in /u/:slug.\n- Sub-accounts (institution admin invites others to their org) are a future phase.',
    designSpec: 'Topbar identity switcher (dropdown showing current identity + alternatives).',
    acceptanceCriteria: 'Given I have a personal profile + 1 institutional membership\nWhen I switch identity\nThen the admin shell re-scopes to that identity\'s data.',
    processSteps: '1. User signs up → 2. (optional) Joins institutional account → 3. Switches between identities → 4. Each has its own profile.',
    priority: 'p1', tags: ['identity', 'institutions', 'tt-89'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'observability', externalRef: 'TT.90 · usage-monitoring-by-sb_id',
    title: 'Dynamic provisioning + usage monitoring by sb_id',
    summary: 'Track API call counts, AI token usage, storage usage per sb_id. Provision resources dynamically based on activity.',
    userStory: 'As Betsy planning scale, I want to know who is using how much so I can size infrastructure + tier offerings.',
    requirementDetail:
      'New usage_events table logs key actions (api call, agent token, storage byte) keyed by sb_id. Periodic rollup to usage_summary (daily aggregates). Admin dashboard shows top users by various metrics.',
    businessRules: '- High-cardinality table — partition by date.\n- Aggregates retained 90 days; raw events 7 days.\n- Usage feeds into tier / billing logic (future).',
    designSpec: 'Admin dashboard panel with leaderboard + line chart per metric.',
    acceptanceCriteria: 'Given users are active\nWhen I view the usage panel\nThen I see top 10 by API calls, AI tokens, storage used.',
    processSteps: '1. Events logged on action → 2. Daily rollup → 3. Admin dashboard surface.',
    priority: 'p2', tags: ['monitoring', 'usage', 'foundation', 'tt-90'],
    ...PENDING_BACKEND_ONLY,
  },
  {
    capabilitySlug: 'multi-tenant-cms', externalRef: 'TT.91 · member-only-sections-missing-out',
    title: 'Member-only public sections with "missing out" prompts',
    summary: 'Public profile sections can be marked member-only. Non-members see a teaser + "Join to see more" CTA.',
    userStory: 'As a member showing my premium content, I want some sections gated to logged-in visitors so my best work is rewarded for engagement.',
    requirementDetail:
      'Section gains a visibility field: public | member-only. Public renders the teaser (configurable per section) + CTA. Members see the full content.',
    businessRules: '- Default visibility: public.\n- Teaser is the first 1-2 sentences + a blurred-fade effect.\n- CTA copy is admin-configurable.',
    designSpec: 'Visibility toggle in section editor. Public render shows lock icon + teaser + "Sign in to see" CTA.',
    acceptanceCriteria: 'Given a section is member-only\nWhen a non-member views it\nThen they see a teaser + CTA\nAnd members see full content.',
    processSteps: '1. Member marks section member-only → 2. Public visitor sees teaser → 3. They sign in → 4. Full content unlocks.',
    priority: 'p2', tags: ['member', 'gating', 'tt-91'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'security-and-data', externalRef: 'TT.92 · non-guessable-profile-links',
    title: 'Unique non-guessable profile links',
    summary: 'Members can optionally use an opaque link (e.g. /u/sb_abc123xyz) instead of their friendly slug for stealth sharing.',
    userStory: 'As a member sharing my profile selectively, I want a non-guessable URL I can share with specific people without it being public on search engines.',
    requirementDetail:
      'New member_profiles.opaque_id column. Both /u/:slug and /u/sb_:opaque resolve to the same profile. robots.txt noindex on the opaque variant. Member toggles "Stealth mode" to hide the slug-based URL from sitemaps.',
    businessRules: '- Opaque IDs are server-generated, base62, 12+ chars.\n- Stealth mode hides slug URL from public sitemap but keeps it functional.\n- Both URLs always work — opaque is additive, not replacement.',
    designSpec: 'Profile sharing card shows both URLs with copy buttons + stealth toggle.',
    acceptanceCriteria: 'Given I enable stealth mode\nWhen I share my opaque URL\nThen viewers see the profile\nAnd Google does not index the slug URL.',
    processSteps: '1. Enable stealth → 2. Use opaque URL → 3. Share selectively.',
    priority: 'p3', tags: ['member', 'privacy', 'tt-92'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'multi-tenant-cms', externalRef: 'TT.93 · monthly-renewals-not-auto-subscriptions',
    title: 'Membership model: monthly renewals (not auto-subscriptions)',
    summary: 'Membership requires active monthly renewal (manual click), not auto-billing. Lapsed memberships gracefully downgrade.',
    userStory: 'As an operator who values control over my subscriptions, I want to choose to renew each month rather than be on a default auto-bill that I have to remember to cancel.',
    requirementDetail:
      'New memberships table: status (active / lapsed / cancelled), expires_at, last_renewed_at. 7 days before expires_at, reminder email goes out. On expiry, profile downgrades to view-only (can read draft but not edit/publish).',
    businessRules: '- No auto-charge.\n- Lapsed members can renew at any time.\n- Public profile remains visible during lapse (just not editable).',
    designSpec: 'Member admin shows "Membership expires in X days. Renew now →" banner once <7 days out.',
    acceptanceCriteria: 'Given my membership expires tomorrow\nWhen I log in\nThen I see the renewal banner\nAnd clicking Renew extends 30 days.',
    processSteps: '1. Member signs up → 2. 30-day membership starts → 3. Reminder at day 23 → 4. Member renews manually → 5. Cycle repeats.',
    priority: 'p2', tags: ['member', 'billing', 'membership-model', 'tt-93'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'public-site-content', externalRef: 'TT.95 · content-auto-distribution',
    title: 'Content auto-distribution: LinkedIn / X / Amazon / Etsy',
    summary: 'When admin publishes a new section or post, optionally syndicate to connected social/commerce channels.',
    userStory: 'As Betsy publishing thought leadership, I want one-click distribution to LinkedIn / X (and shopify-style channels for products) so I do not have to manually cross-post.',
    requirementDetail:
      'Per-channel API client (LinkedIn API, X API v2, Amazon Selling Partner, Etsy Open API). OAuth flows + connected-channel storage per admin. Publish dialog gains a "Syndicate to" multi-select. Per-channel templating to adapt format.',
    businessRules: '- All syndication is opt-in per publish.\n- Failed sends log to a notifications panel but do not block the publish.\n- Rate limits respected per channel.',
    designSpec: 'Publish modal gains a "Syndicate to" section after the confirm.',
    acceptanceCriteria: 'Given I have LinkedIn connected\nWhen I publish a new section + check LinkedIn\nThen a corresponding LinkedIn post is created with adapted format.',
    processSteps: '1. Connect channel → 2. Publish a section → 3. Pick channels → 4. Syndicated.',
    priority: 'p3', tags: ['distribution', 'social', 'commerce', 'tt-95'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'admin-experience', externalRef: 'TT.96 · expand-admin-configurability',
    title: 'Expand admin configurability layer',
    summary: 'Things still hardcoded (footer template, social grid layout, lead form prompts, default copy in modals) become admin-editable.',
    userStory: 'As Betsy iterating on copy + structure, I want to change anything visible without code, so I can tune the product without a deploy.',
    requirementDetail:
      'Survey existing hardcoded strings/structures and migrate each to config_state JSON. Group: footer, lead-form prompts, output-page intros, modal copy. New Config panel sections per group.',
    businessRules: '- Each migration includes a back-compat fallback to the old hardcoded value.\n- Changes go to draft, take effect on publish.',
    designSpec: 'Multiple new Config cards organized by location.',
    acceptanceCriteria: 'Given a previously hardcoded string\nWhen I edit it in the Config panel\nThen the public site reflects the change after publish.',
    processSteps: '1. Survey hardcoded strings → 2. Migrate to config_state → 3. Add editor UI → 4. Test → 5. Publish.',
    priority: 'p2', tags: ['admin', 'config', 'configurability', 'tt-96'],
    ...PENDING_FRONTEND_BACKEND,
  },
  {
    capabilitySlug: 'output-pages', externalRef: 'TT.121 · interactive-scoping-configurator',
    title: 'Interactive proposal scoping configurator',
    summary: 'Buyer drag-drops + selects scope items to build a custom proposal interactively, gets a generated price + deliverable list.',
    userStory: 'As a buyer evaluating an engagement, I want to interactively configure my own scope (pick services, set duration, add options) and see what the engagement looks like, instead of negotiating from a static proposal.',
    requirementDetail:
      'New /output/proposal/configurator route. Drag-drop scope builder with: service modules (Diagnostic / Embedded / Advisory) + add-ons + duration slider. Live-updates a proposal preview + price range estimate. Saves the custom proposal as a lead with source=proposal-configurator.',
    businessRules: '- Configurations are saved as JSON on the lead record.\n- Buyers can return to refine via their lead URL.\n- Pricing is shown as a range, not a fixed quote (real negotiation still happens via conversation).',
    designSpec: 'Two-column layout: left = scope builder (drag-and-drop), right = live preview pane with running price/deliverable list.',
    acceptanceCriteria: 'Given I am a visitor\nWhen I configure a scope\nThen I see a live-updating proposal\nAnd submitting creates a lead with my configuration saved.',
    processSteps: '1. Visitor opens configurator → 2. Drags services → 3. Sees live preview → 4. Submits → 5. Lead created with config.',
    priority: 'p2', tags: ['proposal', 'interactive', 'lead-gen', 'tt-121'],
    ...PENDING_FRONTEND_BACKEND,
  },

  // ──────────────────────── Group D · Tech debt ────────────────────────
  {
    capabilitySlug: 'observability', externalRef: 'TD.1 · bundle-code-splitting',
    title: 'Code-split output pages into a separate JS chunk',
    summary: 'JS bundle is now 713 KB (was 484 KB). Output pages are admin-only — split them out to cut initial page load.',
    userStory: 'As any visitor to saltbasin.net, I want the page to load fast, not be bloated by admin-only code I will never execute.',
    requirementDetail:
      'Convert the /output/* route imports in App.jsx to React.lazy() + dynamic import(). Each output component loads only when its route is visited. Initial bundle drops significantly. PreviewPane (which can show output blocks during admin editing) remains synchronously available.',
    businessRules: '- Public site bundle should not include any /output/* code.\n- Admin chrome can lazy-load when navigating to Backlog or output preview.',
    designSpec: 'Operational only.',
    acceptanceCriteria: 'Given I visit saltbasin.net/ for the first time\nWhen the bundle loads\nThen it is < 500 KB gzipped\nAnd /output/* routes still work via dynamic load.',
    processSteps: '1. Wrap output imports with React.lazy → 2. Add Suspense boundary → 3. Verify split in build → 4. Test all output routes.',
    priority: 'p3', kind: 'chore', tags: ['performance', 'bundle', 'tech-debt'],
    deployedGithub: false, deployedRender: false, deployedNetlify: false,
    deployRelevance: { github: true, render: false, netlify: true }, status: 'pending',
  },
  {
    capabilitySlug: 'requirements-mgmt', externalRef: 'TD.2 · patch-notes-to-db',
    title: 'Migrate patch_notes from code to a DB-backed table',
    summary: 'Currently patch_notes lives in server/data/patchNotes.js. Move to a patch_notes table so future releases can be added through the admin without a code push.',
    userStory: 'As Betsy authoring release notes, I want to write them directly in the admin instead of editing JS and pushing.',
    requirementDetail:
      'New patch_notes table (id, version, name, date, summary, sections JSON, sort_order, published). Admin "Patch Notes" editor panel with rich-text-ish inputs. /api/backlog/patch-notes reads from DB. Existing patchNotes.js seeds initial values on first boot.',
    businessRules: '- Versions are unique.\n- Sections JSON validates against a schema (heading + items[]).\n- Admin can mark a release as draft (not yet published).',
    designSpec: 'Inside Backlog tab, new "Patch Notes" sub-view (under Outputs or as a new sub-tab). List of releases + editor.',
    acceptanceCriteria: 'Given I add a new release via the admin editor\nWhen I publish\nThen /output/patch-notes immediately reflects it.',
    processSteps: '1. Migrate seed → 2. Admin UI → 3. Backend reads from DB → 4. Future releases added via UI.',
    priority: 'p3', kind: 'chore', tags: ['admin', 'patch-notes', 'tech-debt'],
    ...PENDING_FRONTEND_BACKEND,
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
