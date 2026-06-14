// v0.14 backlog reconciliation — platform merge (HERQ, NRM, Services, Standards,
// Governance, Analytics, Lineage, Security hardening)
//
// This script does THREE things:
//   1. UPDATES existing pending items that are now fully or partially deployed in v0.14
//   2. UPDATES existing items whose requirement data changed due to platform merge decisions
//   3. CREATES new items for what was built in v0.14 + what's still outstanding
//
// Idempotent by externalRef — re-runs skip items already present.
// Usage: node scripts/add-v014-backlog-items.mjs

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
// SECTION 1 — Existing items to UPDATE
//
// These were seeded as 'pending' in prior scripts but are now deployed in v0.14.
// Keyed by external_ref so we can find + patch them.
// ─────────────────────────────────────────────────────────────────────────────

const UPDATES_BY_REF = [
  // PB.1 — Jobs as dynamic list. Built in commit 1e5c8f1. The audit script seeded
  // it as pending but the git commit message explicitly names PB.1 as deployed.
  {
    externalRef: 'PB.1 · profile-admin · jobs-list',
    patch: {
      status: 'completed',
      deployedGithub: true, deployedRender: true,
      summary: 'DEPLOYED in commit 1e5c8f1. Dynamic add/remove roles list ships in v0.13 session (Resume: dynamic add/remove roles list). The fixed role1–role6 slots are replaced by a roles[] array with full CRUD in the editor.',
    },
  },
  // PB.2 — CTA configurability. Built in commit 94865b0 (Action button editor:
  // guided link picker with site pages, anchors, output routes).
  {
    externalRef: 'PB.2 · profile-admin · cta-configurability',
    patch: {
      status: 'completed',
      deployedGithub: true, deployedRender: true,
      summary: 'DEPLOYED in commit 94865b0. Action button editor ships with guided link picker: site pages, anchor targets, output routes (/output/resume etc.). Each section\'s action buttons are fully configurable. Original spec called for cta1Label/cta1Target fields; shipped as actions[] array (more flexible — supports multiple CTAs per section).',
      requirementDetail: 'SHIPPED DIFFERENTLY than originally specced. Instead of cta1/cta2 sub-fields, sections now carry an actions:[] array where each item is {label, href, style}. The guided link picker in EditorPane handles site pages, anchors, and /output/* routes. This supersedes the original cta1Action dropdown approach — the actions array is more flexible and does not need a separate "action type" selector.',
    },
  },
  // TT.88 — sb_id universal identifier. The profiles system in v0.14 adds
  // personal_profiles (1:1 with users). The sb_id concept is partially there
  // via the profiles table — note the delta.
  {
    externalRef: 'TT.88 · user-hierarchy-sb_id',
    patch: {
      summary: 'PARTIALLY addressed in v0.14. The personal_profiles table (1:1 with users) and org_memberships structure exist. A formal sb_id opaque identifier column on users was not added — personal_profiles.id serves as the stable profile reference. Update: sb_id column still needed on users table if we want a prefix-based identifier for external integrations.',
    },
  },
  // TT.89 — Person + Institution dual-role. The org_memberships + organization_profiles
  // tables shipped in v0.14 db.js migrations. Backend foundation is there.
  {
    externalRef: 'TT.89 · person-institution-dual-role',
    patch: {
      status: 'in_progress',
      deployedGithub: true, deployedRender: true,
      summary: 'BACKEND FOUNDATION DEPLOYED in v0.14. Tables exist: personal_profiles, organization_profiles, org_memberships, personal_org_links. The identity-switcher UI and member admin re-scoping are still pending (Phase 2F in PLATFORM_MERGE_SPEC.md). The data model exactly matches the spec requirement.',
      requirementDetail: 'DB tables (personal_profiles, organization_profiles, org_memberships, personal_org_links, product_licenses, data_entitlements) ship in v0.14 db.js bootstrap. Routes for profile management ship in server/routes/profiles.js. Still needed: org creation flow UI, org profile editor, org admin role gating, identity switcher in member admin topbar.',
    },
  },
  // S3 · Templates Phase B. The gallery UX ships in v0.13 (commit 1f57747 + 9adc7b9).
  // SectionTemplateModal (v0.12) + categorized version (v0.13) cover this.
  {
    externalRef: 'S3 · Templates Phase B · gallery UX',
    patch: {
      status: 'completed',
      deployedGithub: true, deployedRender: true,
      summary: 'DEPLOYED in v0.12 + v0.13. SectionTemplateModal ships in v0.12 (2-step visual picker, 15 templates). v0.13 upgrades to 4-category sidebar with 26 templates (categorized-template-modal). The apply-with-confirm-dialog was built differently: template selection happens at section creation time rather than as a standalone Templates tab — more ergonomic for the existing add-section flow.',
      requirementDetail: 'SHIPPED DIFFERENTLY than originally specced. The standalone "Templates tab in MemberDashboard" approach was not built. Instead, the template picker is embedded in the "+ Add Section" flow as a 2-step modal (Step 1: category + template selection; Step 2: name + columns + bg + visibility). This is a better UX for the actual use case (creating sections, not swapping entire page layouts).',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — New items for v0.14 DEPLOYED features
// ─────────────────────────────────────────────────────────────────────────────

const NEW_DEPLOYED_ITEMS = [
  // ── Platform Merge Foundation ─────────────────────────────────────────────
  {
    capabilitySlug: 'platform-architecture',
    externalRef: 'v0.14 · platform-merge-spec · canonical-build-reference',
    title: 'PLATFORM_MERGE_SPEC.md — unified platform canonical build reference',
    summary: 'A 1,500-line canonical specification merging the existing Salt Basin stack with the HERQ Configurable Output Platform. Defines the full 3-phase build sequence, all application maps, data models, ADRs, brand modes, governance layer, and "what is undefined" explicitly. Committed to the repo as PLATFORM_MERGE_SPEC.md.',
    userStory: 'As Betsy directing the platform build, I want a single reference document that Claude and I both read at the start of every session so we never re-derive architecture decisions or contradict each other.',
    requirementDetail: 'PLATFORM_MERGE_SPEC.md covers: 29 sections, 16 ADRs (architecture decisions), 3 build phases, 10 application maps, full DB schema for new tables, route map for all routes, admin shell tab registry, brand system (Mode 1 Strategic Operator / Mode 2 HERQ Salter Momentum), governance flow, what is undefined. Committed in v0.14.',
    acceptanceCriteria: 'PLATFORM_MERGE_SPEC.md exists in repo root. Every build session reads it first (enforced by CLAUDE.md instruction). All architectural decisions in the doc are reflected in the codebase.',
    ...DEPLOYED, kind: 'chore', hoursClaudeEst: 3, hoursBetsyEst: 1,
  },

  // ── DB Foundation (Phase 1A) ───────────────────────────────────────────────
  {
    capabilitySlug: 'platform-architecture',
    externalRef: 'v0.14 · 1A · db-foundation-all-tables',
    title: 'Phase 1A — DB foundation: all new platform tables + migrations',
    summary: 'All Phase 1–3 tables added to db.js bootstrap as idempotent IF NOT EXISTS migrations. Covers: global_standards, pending_standards, standard_overrides, platform_applications, app_object_label_maps, unified_content_items, unified_outputs, herq_series, herq_series_versions, herq_outputs, herq_posts, herq_comment_insights, herq_research_inputs, nrm_contacts, nrm_connections, nrm_reference_requests, nrm_network_requests, crm_pipelines, crm_pipeline_stages, crm_deals, crm_activities, services_proposals, services_proposal_access, analytics_events, field_lineage, data_snapshots, personal_profiles, organization_profiles, org_memberships, personal_org_links, product_licenses, data_entitlements, emotional_weather_states.',
    userStory: 'As the platform, I need all tables to exist before any application route tries to use them.',
    requirementDetail: 'All migrations run at boot via idempotent ALTER TABLE ... ADD COLUMN IF NOT EXISTS and CREATE TABLE IF NOT EXISTS. New tables do not touch existing SB tables. Admin nav seed updated to include all new application tabs.',
    acceptanceCriteria: 'App boots without migration errors. All new tables exist in Supabase. Existing data is untouched.',
    ...DEPLOYED, kind: 'chore', hoursClaudeEst: 2, hoursBetsyEst: 0,
  },

  // ── Analytics (Phase 1B) ──────────────────────────────────────────────────
  {
    capabilitySlug: 'observability',
    externalRef: 'v0.14 · 1B · analytics-event-tracking',
    title: 'Phase 1B — Analytics event tracking + AnalyticsPanel',
    summary: 'Client-side src/lib/analytics.js track() function fires to POST /api/analytics/event. Tracks: profile views, resume page visits, download attempts, form submissions. Server stores in analytics_events table. Admin AnalyticsPanel shows event log with type, entity, user, timestamp. Member analytics tab (own data only).',
    userStory: 'As Betsy, I want to know who is visiting profiles and attempting resume downloads so I can measure member engagement and site traffic.',
    requirementDetail: 'src/lib/analytics.js exports track(eventType, props) — fire-and-forget fetch to /api/analytics/event. server/routes/analytics.js: POST /event (unauthenticated, rate-limited by IP), GET /summary (admin), GET /member-summary (member, own data only). PublicProfile.jsx fires track("profile_view") on mount. Output.jsx fires track("resume_page_view") and track("resume_download_attempt") at gate stages.',
    acceptanceCriteria: 'Visiting /u/:slug creates an analytics_events row. Admin AnalyticsPanel shows the event. Member analytics tab shows their own profile view counts.',
    ...DEPLOYED, hoursClaudeEst: 2, hoursBetsyEst: 0.25,
  },

  // ── Resume Access Gate (Phase 1C) ─────────────────────────────────────────
  {
    capabilitySlug: 'output-pages',
    externalRef: 'v0.14 · 1C · resume-access-gate',
    title: 'Phase 1C — Resume access gate (multi-state, temp tokens, member reasons)',
    summary: 'The resume PDF output (/output/resume) is gated behind a multi-state flow. Anonymous visitors see a "become a member" gate or can request 24-hour temporary access. Members provide a download reason before downloading. All attempts are tracked. Network request form creates a lead and fires email to Betsy.',
    userStory: 'As Betsy, I want to know exactly who downloads my resume and why before they can access it, capturing either a lead record or member context with every download.',
    requirementDetail: 'server/routes/resumeAccess.js: POST /temp-access (creates temp token in resume_temp_access), GET /validate-temp/:token, GET /member-reason-check, POST /member-reason, POST /temp-download-request, POST /member-download-request. Output.jsx: multi-state UI — checking → gate-anon or gate-member-reason → viewer-temp (no print) or viewer-member (print enabled). Token stored in localStorage under sb_resume_temp_token.',
    acceptanceCriteria: 'Anonymous visit to /output/resume shows gate. Completing the form creates a lead + temp token + grants 24h access. Member sees reason modal before download. All attempts tracked in analytics_events.',
    ...DEPLOYED, hoursClaudeEst: 3, hoursBetsyEst: 0.25,
  },

  // ── NRM Core (Phase 1D) ───────────────────────────────────────────────────
  {
    capabilitySlug: 'network-relationship-mgmt',
    externalRef: 'v0.14 · 1D · nrm-core',
    title: 'Phase 1D — NRM core (Network Relationship Manager)',
    summary: 'Full NRM backend and admin panel. Replaces NetWorksPanel. Manages contacts (nrm_contacts), connections (nrm_connections), reference requests (nrm_reference_requests), and inbound network requests (nrm_network_requests). Admin NrmPanel shows contact list, connection graph links, reference request queue, and network request log.',
    userStory: 'As Betsy managing my professional network, I want a dedicated relationship manager that tracks contacts, how I know them, reference requests, and inbound connection requests — all in one place.',
    requirementDetail: 'server/routes/nrm.js: CRUD for contacts, connections, reference requests, network requests. src/components/admin/NrmPanel.jsx: tabbed view (Contacts / Connections / References / Requests). SUPERSEDES NetWorksPanel (the old tab). Member read-only NRM tab still pending (Phase 2E).',
    acceptanceCriteria: 'NRM tab appears in admin shell. Contacts can be created, linked, and viewed. Reference requests from the public site appear in the queue. Network requests (inbound) are logged.',
    ...DEPLOYED, hoursClaudeEst: 2.5, hoursBetsyEst: 0.25,
  },

  // ── HERQ Content Manager (Phase 1E — partial) ────────────────────────────
  {
    capabilitySlug: 'herq-content-manager',
    externalRef: 'v0.14 · 1E · herq-content-manager-shell',
    title: 'Phase 1E — HERQ Content Manager shell + output configurator (partial)',
    summary: 'ContentManagerShell with HERQ sub-application. HerqPanel: series list, post tracker, research inputs, comment insights, output list. HerqOutputConfigurator: block-based output editor with merge field picker ({{field}} tokens from mergeFieldRegistry.js), field namespace groups, live block preview. HERQ brand CSS variables (--herq-*) under data-brand-mode="herq". outputBlocks.js renderTemplateToHtml engine.',
    userStory: 'As Betsy running the HERQ content program, I want to build structured outputs (one-pagers, frameworks, post series) using a configurable block editor that pulls from my profile data via merge fields.',
    requirementDetail: 'server/routes/herq.js: series CRUD (GET/PUT only — POST create still missing), outputs CRUD, posts, research, comment insights. src/lib/mergeFieldRegistry.js: 60+ merge field paths across namespaces (about, timeline, jobs, wheel, output, series, post, org). src/lib/outputBlocks.js: renderTemplateToHtml() engine. HerqOutputConfigurator.jsx: FieldPicker component inserts {{field}} tokens into text/textarea fields.',
    acceptanceCriteria: 'Content Manager tab routes to HERQ sub-panel. Series list shows seeded series. Output configurator opens for a selected output. FieldPicker inserts merge tokens. Saving an output captures lineage.',
    ...DEPLOYED, hoursClaudeEst: 5, hoursBetsyEst: 0.5,
  },

  // ── Services Proposal Manager (Phase 1F — partial) ────────────────────────
  {
    capabilitySlug: 'services-proposal-mgr',
    externalRef: 'v0.14 · 1F · services-proposal-manager',
    title: 'Phase 1F — Services Proposal Manager (backend + admin panel)',
    summary: 'Backend for services proposals as unified_content_items. ServicesPanel in admin Content Manager shell: create/edit/view proposals with title, status, recipient, body, access gate toggle. Email notification on access request. Public /services/:slug route still pending.',
    userStory: 'As Betsy managing client engagements, I want to create proposals in the platform, share them via a gated link, and track who has requested access.',
    requirementDetail: 'server/routes/services.js: proposal CRUD, access request endpoint, email trigger. src/components/admin/ServicesPanel.jsx: proposal list, editor, access log. services_proposal_access table tracks requesters. Public /services/:slug + access gate UI still needed.',
    acceptanceCriteria: 'ServicesPanel shows in Content Manager. Proposals can be created and saved. Access requests trigger email to Betsy.',
    ...DEPLOYED, hoursClaudeEst: 2, hoursBetsyEst: 0.25,
  },

  // ── Global Standards (Phase 2B — partial) ────────────────────────────────
  {
    capabilitySlug: 'global-standards',
    externalRef: 'v0.14 · 2B · global-standards-partial',
    title: 'Phase 2B — Global Standards backend + admin panel (partial)',
    summary: 'global_standards + pending_standards + standard_overrides tables. GlobalStandardsPanel: browse standards by type, create/edit entries, view pending standards queue. capabilityTags.js seed migration script still needed. /resources/standards/:slug public route still needed.',
    userStory: 'As Betsy maintaining the vocabulary that all apps share, I want to manage the global standards repository — adding new standards, reviewing overrides that have been proposed from app usage.',
    requirementDetail: 'server/routes/globalStandards.js: standards CRUD, pending standards queue. src/components/admin/GlobalStandardsPanel.jsx: tabbed (Standards / Pending / Overrides). Pending standards review flow (approve/reject) built. Migration script to seed from capabilityTags.js still outstanding.',
    acceptanceCriteria: 'GlobalStandardsPanel shows standards. Pending standards can be reviewed and approved/rejected. Standards can be created manually.',
    ...DEPLOYED, hoursClaudeEst: 2, hoursBetsyEst: 0.25,
  },

  // ── Governance (Phase 3A — partial) ───────────────────────────────────────
  {
    capabilitySlug: 'governance',
    externalRef: 'v0.14 · 3A · governance-backend',
    title: 'Phase 3A — Governance layer (backend + panel, partial)',
    summary: 'GovernancePanel shows pending standards waiting for review, with approve/reject/merge workflow. Backend enforces GOV-005 (published output prerequisite) when reviewing. Auto-creation of pending standards on user override and enforcement in the output configurator still pending.',
    userStory: 'As Betsy governing the platform vocabulary, I want to see and action every proposed standard deviation before it becomes permanent.',
    requirementDetail: 'server/routes/governance.js: pending review queue, approve/reject actions. GovernancePanel.jsx: review queue with source context, diff view. Still missing: auto-creation of pending_standards when any app-level override is made, enforcement of GOV-005 (must have published output before merge review).',
    acceptanceCriteria: 'Governance tab shows pending standards. Approve action merges to global_standards. Reject closes the pending standard.',
    ...DEPLOYED, hoursClaudeEst: 1.5, hoursBetsyEst: 0.25,
  },

  // ── FinBridgeCo Placeholder (Phase 2C) ────────────────────────────────────
  {
    capabilitySlug: 'finbridgeco',
    externalRef: 'v0.14 · 2C · finbridgeco-placeholder',
    title: 'Phase 2C — FinBridgeCo Manager (placeholder panel)',
    summary: 'FinBridgeCoPanel: placeholder with config key-value editor, module notes area, and product_licenses status overview. Full application-specific model deferred pending Betsy\'s specification of the FinBridgeCo product requirements.',
    userStory: 'As Betsy, I want a placeholder FinBridgeCo tab so the space is reserved in the admin shell while the full spec is developed.',
    requirementDetail: 'server/routes/finbridgeco.js + FinBridgeCoPanel.jsx. Shows product_licenses rows for product_id=finbridgeco. Config key-value editor writes to a finbridgeco config namespace. Full product model (modules, billing, feature flags) is undefined — see PLATFORM_MERGE_SPEC section 29.',
    acceptanceCriteria: 'FinBridgeCo tab shows in admin shell. Config key-value pairs can be saved.',
    ...DEPLOYED, hoursClaudeEst: 1, hoursBetsyEst: 0,
  },

  // ── Data Lineage ──────────────────────────────────────────────────────────
  {
    capabilitySlug: 'observability',
    externalRef: 'v0.14 · data-lineage-system',
    title: 'Data lineage system — field-level hashing, snapshot diffs, waterfall view',
    summary: 'Every save to site_state and herq_outputs now captures field-level lineage: SHA-256 context hash per field, snapshot hash (composite of all field hashes), diff vs previous snapshot. LineagePanel: entity picker → snapshot timeline waterfall → expandable field diffs → field history drawer. Fire-and-forget (never breaks the save operation).',
    userStory: 'As Betsy, I want a complete audit trail of every data value change across the platform — who changed what, when, what it was before — with a unique hash representing the data state at any point in time.',
    requirementDetail: 'server/lib/lineage.js: flattenJSON, contextHash, snapshotHash, diffFlat, captureLineage. field_lineage + data_snapshots tables. server/routes/lineage.js: entities, snapshots, snapshot fields, field history. LineagePanel.jsx: HashChip (click-to-copy), ValueDiff (red/green), SnapshotCard (lazy-load fields), FieldHistoryDrawer (slide-in).',
    acceptanceCriteria: 'Every site_state save creates field_lineage rows and a data_snapshots row. LineagePanel shows the waterfall. Clicking History for a field shows its full chronological change log.',
    ...DEPLOYED, hoursClaudeEst: 4, hoursBetsyEst: 0.25,
  },

  // ── Security Hardening ────────────────────────────────────────────────────
  {
    capabilitySlug: 'security-and-data',
    externalRef: 'v0.14 · security-hardening',
    title: 'Security hardening — rate limiting, cookie fix, session purge, enum fix, entropy',
    summary: 'Five targeted security fixes: (1) rate limiter on login + reset-request (10 attempts / 15min / IP), (2) clearAdminCookie now passes matching httpOnly/sameSite/secure attributes so it actually clears in all browsers, (3) lazy session purge (0.5% probability, 1-min cooldown) prevents sessions table from growing unbounded, (4) org invite no longer leaks whether an email is registered (returns ok:true either way), (5) lead access password increased from 10 to 16 chars (~80-bit entropy).',
    userStory: 'As Betsy protecting the platform, I want the auth and session infrastructure to meet standard security baselines.',
    requirementDetail: 'server/lib/rateLimit.js: makeRateLimiter() sliding-window per IP, in-process Map store. server/routes/auth.js: authLimiter applied to POST /login and POST /reset-request. server/auth.js: clearAdminCookie attribute match fix + maybePurgeExpiredSessions(). server/routes/profiles.js: org invite email enumeration → ok:true. server/routes/leads.js: 16-char password.',
    acceptanceCriteria: 'More than 10 login attempts from same IP in 15 min → 429 with Retry-After. Logout clears the cookie in all tested browsers. sessions table rows with past expires_at are periodically deleted. Org invite with unknown email returns same response as known email.',
    ...DEPLOYED, kind: 'chore', hoursClaudeEst: 2, hoursBetsyEst: 0,
  },

  // ── Merge Field Registry ──────────────────────────────────────────────────
  {
    capabilitySlug: 'herq-content-manager',
    externalRef: 'v0.14 · merge-field-registry',
    title: 'Merge field registry — central {{field}} path registry for all output templates',
    summary: 'src/lib/mergeFieldRegistry.js defines every interpolation field available in output templates: 60+ paths across namespaces (about, timeline, jobs.0–9, wheel, output, series, post, org). Each field has path, label, description, type, example, and context (which output types it applies to). fieldsForContext(), fieldsByNamespace(), fieldByPath() helper functions.',
    userStory: 'As the output template system, I need a single registry of all {{field}} paths so the field picker UI can show them grouped by namespace, and so template rendering knows what\'s valid.',
    requirementDetail: 'src/lib/mergeFieldRegistry.js exports MERGE_FIELDS[], NAMESPACE_LABELS, fieldsForContext(outputType), fieldsByNamespace(outputType), fieldByPath(path). Used by HerqOutputConfigurator.jsx FieldPicker and by outputBlocks.js renderTemplateToHtml engine.',
    acceptanceCriteria: 'FieldPicker in HERQ output configurator groups fields by namespace. Clicking a field inserts the {{path}} token. renderTemplateToHtml resolves the token against live member data.',
    ...DEPLOYED, kind: 'chore', hoursClaudeEst: 1, hoursBetsyEst: 0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — New PENDING items for outstanding work
// ─────────────────────────────────────────────────────────────────────────────

const NEW_PENDING_ITEMS = [
  // ── CRM (Phase 2A) ────────────────────────────────────────────────────────
  {
    capabilitySlug: 'crm',
    externalRef: 'v0.14 · 2A · crm-pipeline',
    title: 'Phase 2A — CRM: pipeline, lead record, org view',
    summary: 'Full Customer Relationship Manager for SB admin and org-admin members. Pipeline board (crm_pipelines + crm_pipeline_stages + crm_deals), deal record view, org-level view showing all deals across contacts, activity log (crm_activities). Route file server/routes/crm.js does not exist yet.',
    userStory: 'As Betsy managing active client engagements, I want a pipeline-style CRM so I can track where each potential deal stands, log activities, and see org-level deal rollups.',
    requirementDetail: 'Create server/routes/crm.js: pipelines CRUD, stages CRUD, deals CRUD, activities CRUD. Create CrmPanel.jsx in admin shell: Kanban board per pipeline, deal card with stage/value/contact, deal detail drawer, org view tab. Org-admin member access gated on product_licenses for app.crm.',
    acceptanceCriteria: 'CRM tab in admin shell shows pipeline board. Deals can be created, moved between stages, and have activities logged. Org view shows all deals for members of an org.',
    priority: 'p1', ...PENDING, hoursClaudeEst: 4, hoursBetsyEst: 0.5,
  },

  // ── HERQ series create form ────────────────────────────────────────────────
  {
    capabilitySlug: 'herq-content-manager',
    externalRef: 'v0.14 · 1E-gap · herq-series-create',
    title: 'HERQ series create form (POST /api/herq/series)',
    summary: 'The HERQ backend only has PUT /api/herq/series/:id (update) and GET. No POST to create a new series. The HerqPanel shows the series list but has no "+ New Series" button that actually works end-to-end.',
    userStory: 'As Betsy managing HERQ content, I want to create new series from the admin panel without needing a database script.',
    requirementDetail: 'Add POST /api/herq/series to server/routes/herq.js (requires admin). Add "+ New Series" button in HerqPanel that opens a create form (id slug, display_name, description, color token, status). On submit, POST and refresh the series list.',
    acceptanceCriteria: 'Clicking "+ New Series" shows a form. Submitting creates a row in herq_series and shows it in the list.',
    priority: 'p1', ...PENDING, hoursClaudeEst: 1, hoursBetsyEst: 0.1,
  },

  // ── HERQ SVG Visual Library ────────────────────────────────────────────────
  {
    capabilitySlug: 'herq-content-manager',
    externalRef: 'v0.14 · 1E-gap · herq-svg-visual-library',
    title: 'HERQ SVG visual library — 95 v4 SVGs + HerqSvg.jsx + Visual Library panel',
    summary: '95 HERQ v4 SVG assets need to be copied to public/svg/herq/v4/. HerqSvg.jsx component wraps them with size/color props. Visual Library sub-tab in HerqPanel shows the full asset browser with search/filter by category.',
    userStory: 'As Betsy building HERQ outputs, I want to browse and insert SVG assets from the HERQ v4 visual library into my output blocks without leaving the admin.',
    requirementDetail: 'Copy 95 SVGs to public/svg/herq/v4/{category}/{name}.svg. Build HerqSvg.jsx: props={name, size, color, className}. Add Visual Library tab to HerqPanel: grid of SVG thumbnails, category filter chips, click-to-copy <HerqSvg> snippet or insert token into output block field.',
    acceptanceCriteria: 'Visual Library tab shows all 95 SVGs. Filter by category works. Clicking an SVG copies its token. SVG renders in output block preview.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 2, hoursBetsyEst: 1,
  },

  // ── HERQ public content pages ──────────────────────────────────────────────
  {
    capabilitySlug: 'herq-content-manager',
    externalRef: 'v0.14 · 1E-gap · herq-public-pages',
    title: 'HERQ public content pages (/resources/herq/:slug)',
    summary: 'Published HERQ posts and outputs need public-facing routes. /resources/herq/:slug renders a published post/output using the HERQ brand mode. Linked from the Resources index page.',
    userStory: 'As a public visitor interested in HERQ frameworks, I want to read published HERQ content at a clean URL without needing admin access.',
    requirementDetail: 'Add /resources/herq/:slug route to React Router (App.jsx). Create HerqPublicPage.jsx: reads published herq_posts or herq_outputs by slug, renders with HERQ brand mode (data-brand-mode="herq"). Back-link to /resources index.',
    acceptanceCriteria: 'Published HERQ post is readable at /resources/herq/zero-post. Page uses HERQ color scheme. Non-published slugs return 404.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 2, hoursBetsyEst: 0.25,
  },

  // ── Resources index page (Phase 1G) ───────────────────────────────────────
  {
    capabilitySlug: 'public-site-content',
    externalRef: 'v0.14 · 1G · resources-index-page',
    title: 'Phase 1G — Resources page (/resources) + ResourcesIndexBlock',
    summary: 'Public /resources page listing published HERQ posts, global standards definitions, and services proposals (public ones). ResourcesIndexBlock component pulls from published state. Add resources page to site CMS seed so it\'s editable from admin.',
    userStory: 'As a public visitor, I want a resources hub where I can discover Betsy\'s published frameworks, standards, and service offerings without browsing individual profile pages.',
    requirementDetail: 'Create ResourcesIndexBlock.jsx: fetches /api/herq/posts?published=true, /api/standards?public=true, /api/services?public=true. Renders as three-section grid (Frameworks / Standards / Services). Add resources page to site_state seed in db.js. Add /resources React Router route. Link from main nav.',
    acceptanceCriteria: 'Visiting /resources shows published HERQ posts, public standards, and accessible proposals. Admin can edit the resources page in the CMS.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 2, hoursBetsyEst: 0.25,
  },

  // ── Services public route ──────────────────────────────────────────────────
  {
    capabilitySlug: 'services-proposal-mgr',
    externalRef: 'v0.14 · 1F-gap · services-public-route',
    title: 'Phase 1F gap — /services/:slug public route + access gate',
    summary: 'The ServicesPanel creates proposals but there\'s no public URL for sharing them. /services/:slug needs a React route, a public render component, and the request-access flow (email → approval → token).',
    userStory: 'As Betsy sharing a proposal with a client, I want a public URL I can send that shows the proposal behind a request-access gate.',
    requirementDetail: 'Add /services/:slug to React Router. Create ServicesPublicPage.jsx: shows proposal metadata, request-access form (name + email + reason), submit → POST /api/services/:slug/request-access → email to Betsy → Betsy approves → client gets access token in email → token grants time-limited read access.',
    acceptanceCriteria: 'Sending /services/my-proposal to a client shows the gate. Submitting the form emails Betsy. Betsy approves from ServicesPanel. Client receives access link. Link shows the full proposal.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 2.5, hoursBetsyEst: 0.5,
  },

  // ── Global Standards seed ──────────────────────────────────────────────────
  {
    capabilitySlug: 'global-standards',
    externalRef: 'v0.14 · 2B-gap · global-standards-seed',
    title: 'Global Standards seed — migrate capabilityTags.js into global_standards table',
    summary: 'src/data/capabilityTags.js has 180+ tags (SOURCE_TYPES, MERGED_FIELD_DEFAULTS, TAG_CATEGORIES). These need to be migrated into the global_standards table as the authoritative runtime source. A one-time seed script reads the JS file and inserts/upserts rows.',
    userStory: 'As the platform, I need the global_standards table populated from capabilityTags.js so all apps that query it see the complete vocabulary.',
    requirementDetail: 'Write scripts/seed-global-standards.mjs: reads capabilityTags.js, maps each tag to a global_standards row with appropriate type (capability, domain, audience, metric, etc.), upserts by id slug. Preserves metricCode, model, colorToken in metadata JSONB. After seeding, GlobalStandardsPanel should show all 180+ entries.',
    acceptanceCriteria: 'Running the script populates global_standards with 180+ rows. GlobalStandardsPanel shows them all. Re-running is idempotent (no duplicates).',
    priority: 'p1', ...PENDING, kind: 'chore', hoursClaudeEst: 1, hoursBetsyEst: 0.1,
  },

  // ── Analytics daily digest (Phase 2D) ─────────────────────────────────────
  {
    capabilitySlug: 'observability',
    externalRef: 'v0.14 · 2D · analytics-daily-digest',
    title: 'Phase 2D — Analytics daily digest email (Brevo + cron)',
    summary: 'Daily email to Betsy and each member summarizing their analytics: profile views, resume download attempts, form submissions, top referrers. Sent at 8am via a server-side cron (node-cron or Express interval). Brevo transactional email with templated HTML.',
    userStory: 'As Betsy, I want a daily email summary of platform activity so I don\'t need to log into the admin just to see who\'s been active.',
    requirementDetail: 'Add node-cron to server. Create server/lib/digestEmail.js: queries analytics_events for past 24h, groups by member, calls dispatchRaw() per recipient. Template: header, metric cards (views/downloads/forms), sparkline of past 7 days, link to admin. Admin receives platform-wide digest; members receive own-data digest. Gate on ANALYTICS_DIGEST_ENABLED env var.',
    acceptanceCriteria: 'At 8am daily, Betsy receives an email with platform analytics. Each member receives their own stats. Email renders correctly in Gmail + Apple Mail.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 2, hoursBetsyEst: 0.5,
  },

  // ── PLM member read view (Phase 2E) ───────────────────────────────────────
  {
    capabilitySlug: 'platform-architecture',
    externalRef: 'v0.14 · 2E · plm-member-read-view',
    title: 'Phase 2E — PLM member read-only tab',
    summary: 'MemberPlmPanel.jsx (file exists, content minimal). Needs a real read-only view of the platform lifecycle: current version/release, recent patch notes, roadmap items relevant to members, their own feature requests submitted via the backlog. Member cannot edit; they can upvote/comment on items.',
    userStory: 'As a member, I want visibility into the platform roadmap so I know what\'s coming, what was recently released, and whether my feature requests are on the list.',
    requirementDetail: 'Extend MemberPlmPanel.jsx: call GET /api/backlog/patch-notes and GET /api/backlog/items?status=pending&visibility=member. Show: current version badge, recent releases (last 3), upcoming items (p1+p2 pending), member\'s own submitted items. GET /api/backlog/member-summary endpoint returns this scoped view.',
    acceptanceCriteria: 'Member admin shows Platform tab. Current version and recent releases shown. Member can see pending items. Member can submit a feature request (creates a backlog item with kind=request).',
    priority: 'p2', ...PENDING, hoursClaudeEst: 1.5, hoursBetsyEst: 0.25,
  },

  // ── Org accounts (Phase 2F) ───────────────────────────────────────────────
  {
    capabilitySlug: 'multi-tenant-cms',
    externalRef: 'v0.14 · 2F · org-accounts',
    title: 'Phase 2F — Organization accounts (creation flow + org profile editor)',
    summary: 'Members can create an organization profile linked to their personal profile (via personal_org_links) or join an existing one. Org admin role allows inviting other members. Org profile is separately editable (brand, description, members roster). Org public page /org/:slug still deferred.',
    userStory: 'As a member consultant who also works under a firm, I want to create an org profile for my LLC and link it to my personal profile so visitors see my institutional context.',
    requirementDetail: 'Create org creation flow in member admin: "Create Org" form (name, slug, website, tagline). POST /api/profiles/orgs. Org profile editor: brand fields, member roster, invite by email. personal_org_links allows linking personal profile to LLC org. Org admin can see member list and remove members. Org public page /org/:slug deferred to a later phase.',
    acceptanceCriteria: 'Member can create an org. Org shows up linked to their personal profile. Org admin can invite another member. Invited member sees the org in their profile hub.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 3, hoursBetsyEst: 0.5,
  },

  // ── Governance review queue enforcement ───────────────────────────────────
  {
    capabilitySlug: 'governance',
    externalRef: 'v0.14 · 3A-gap · governance-auto-pending-standards',
    title: 'Phase 3A gap — auto-create pending standards on any app-level override',
    summary: 'Currently pending_standards must be manually created. Per ADR-004 + GOV-003, any time a user overrides a global standard value in any app (HERQ, Services, etc.), a pending_standard row should be created automatically linking the override to the source context.',
    userStory: 'As the governance layer, I want to automatically capture every deviation from a global standard so Betsy has a complete review queue without users needing to manually flag overrides.',
    requirementDetail: 'When any field in HERQ outputs, services proposals, or global standards content deviates from a global_standards.display_name or .metadata value, create a pending_standards row: proposed_value, standard_type, app_id, context_ref_id, proposed_by_user_id. Wire into the save paths for herq.js and services.js. GovernancePanel review queue should then show these automatically.',
    acceptanceCriteria: 'Saving a HERQ output that uses a non-standard capability name creates a pending_standards row. GovernancePanel shows it in the review queue. Approving merges to global_standards.',
    priority: 'p3', ...PENDING, hoursClaudeEst: 2, hoursBetsyEst: 0.25,
  },

  // ── BestyStaff agent UI ───────────────────────────────────────────────────
  {
    capabilitySlug: 'ai-agent',
    externalRef: 'v0.14 · bestystaff-agent-ui',
    title: 'BestyStaff agent UI — dedicated admin agent with platform tools',
    summary: 'BestyStaff is the admin-facing AI agent (distinct from the member agent). Needs a dedicated panel in the admin shell with: persistent conversation history, tool access (backlog CRUD, site state, HERQ outputs, analytics queries, lineage lookup, standards management), propose-and-approve pattern for destructive actions.',
    userStory: 'As Betsy, I want a smart assistant inside the admin panel that knows the full platform and can help me manage content, query analytics, and update the backlog by talking to me.',
    requirementDetail: 'BestyStaff tab in admin shell (or floating panel). Uses /api/agent/chat with an admin-specific system prompt that references platform context. Tool set: read_site_state, read_analytics_summary, list_backlog_items, create_backlog_item, read_lineage_snapshot, list_herq_outputs, read_standards. Propose-and-approve for writes. Conversation persists in agent_threads keyed to the admin user.',
    acceptanceCriteria: 'BestyStaff panel opens. Asking "What are my top 3 pending backlog items?" returns a real answer from the DB. Proposing a backlog item creation shows an approval card. Approving creates the item.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 4, hoursBetsyEst: 1,
  },

  // ── Canva integration ─────────────────────────────────────────────────────
  {
    capabilitySlug: 'marketing-outputs',
    externalRef: 'v0.14 · canva-integration',
    title: 'Canva integration — marketing output panel using Canva MCP',
    summary: 'Admin panel for generating marketing assets via the connected Canva MCP (generate-design, search-brand-templates, list-brand-kits, export-design). Two brand kits available: "The Salter Influence" (kAGDGq-cmG8) and "Salt Basin Holdings" (kAHGFWvWtwg). Generated designs are exported as PDF/PNG and stored as unified_outputs.',
    userStory: 'As Betsy creating marketing materials, I want to generate on-brand designs (social posts, proposals, one-pagers, flyers) directly from the admin using my Canva brand kits, without leaving the platform.',
    requirementDetail: 'Create CanvaPanel.jsx in admin shell. Features: (1) template search (search-brand-templates by keyword), (2) design generation form (prompt + design type selector + brand kit picker), (3) generate via Canva MCP, (4) export to PDF/PNG via export-design, (5) save exported URL to unified_outputs with app_id="app.canva". Brand kit IDs hardcoded from MCP discovery (kAGDGq-cmG8, kAHGFWvWtwg). This requires the Canva MCP to be wired through the BestyStaff agent or a dedicated endpoint.',
    acceptanceCriteria: 'CanvaPanel shows template search. Entering a prompt + selecting brand kit generates a design. Exported PDF URL is saved and viewable in the outputs list.',
    priority: 'p2', ...PENDING, hoursClaudeEst: 3, hoursBetsyEst: 0.5,
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
    if (!existing) {
      console.log(`  NOT FOUND (skip update): ${externalRef}`);
      updateMissed++;
      continue;
    }
    await updateItem(cookie, existing.id, patch);
    console.log(`  UPDATED [${existing.id}]: ${externalRef.slice(0, 70)}`);
    updated++;
  }

  // ── NEW DEPLOYED ──
  console.log('\n=== CREATING new deployed items ===');
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
    console.log(`  CREATED [${result.id}]: ${rest.title.slice(0, 70)}`);
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
    console.log(`  CREATED [${result.id}]: ${rest.title.slice(0, 70)}`);
    createdPending++;
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Updates applied:    ${updated}  (${updateMissed} refs not found in DB)
Deployed created:   ${createdDeployed}  (${skippedDeployed} already existed)
Pending created:    ${createdPending}  (${skippedPending} already existed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => { console.error(e); process.exit(1); });
