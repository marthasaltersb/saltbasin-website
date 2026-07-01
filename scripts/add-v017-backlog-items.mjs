// v0.17 backlog update
//
// Covers this session's work:
//   - Master Enterprise Solution Best Bets™ trademark + copyright attribution (Martha Elizabeth Salter)
//   - Lead to Revenue Capability Model™ IP artifact (server/data/leadToRevenueModel.js)
//   - Contribution Intelligence Methodology™ IP artifact (server/data/contributionMethodology.js)
//   - /output/methodology + /output/l2r-model output routes with three-tier IP gating
//   - DB migrations: sessions table, rate_configs table, backlog_items new columns
//   - Integrations hidden behind "Under Research" notice (no partnerships claimed)
//   - Render env vars synced: TOKEN_ENCRYPTION_KEY + APP_BASE_URL added
//   - Local ADMIN_INITIAL_PASSWORD synced to match production
//
// Idempotent by externalRef. Usage:
//   node scripts/add-v017-backlog-items.mjs
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
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
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

function searchItems(items, query) {
  const q = query.toLowerCase();
  return items.filter(i =>
    (i.title || '').toLowerCase().includes(q) ||
    (i.summary || '').toLowerCase().includes(q) ||
    (i.externalRef || '').toLowerCase().includes(q)
  );
}

function findByVersion(items, version) {
  const prefix = version.toLowerCase();
  return items.filter(i => (i.externalRef || '').toLowerCase().startsWith(prefix));
}

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

// ── SECTION 1 — Update existing items now deployed or superseded ──────────────

const UPDATES_BY_REF = [
  {
    externalRef: 'v0.16.1 · pending · patch-notes-metrics-renderer',
    patch: {
      summary: 'Partially addressed in v0.17: sessions table and rate_configs table now exist in DB with 2026 benchmark rates. The actual /output/patch-notes renderer update (leverage multiple display, rate-configurable costs) remains pending. The new contribution methodology output (/output/methodology) is the richer artifact for now.',
    },
  },
];

// ── SECTION 2 — New items for v0.17 DEPLOYED features ────────────────────────

const NEW_DEPLOYED_ITEMS = [

  // ── Master Enterprise Solution Best Bets™ + IP copyright ─────────────────────────────────────────

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · mes-best-bets-trademark',
    title: 'Master Enterprise Solution Best Bets™ — top-level IP trademark registered across all artifacts',
    summary: 'Master Enterprise Solution Best Bets™ established as the top-level brand for Betsy\'s GTM + Q2R methodology IP. Defined as: "GTM + Q2R, end-to-end full revenue lifecycle best of experience practices and platforms that lead to business results that can be actually proven." All IP artifact files (leadToRevenueModel.js, contributionMethodology.js) now carry parentBrand and parentBrandDescriptor fields. Copyright updated everywhere to "Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works." Site footer copyrightLine updated to match.',
    userStory: 'As Betsy, I want my IP artifacts to carry my legal name and top-level trademark so that attribution is unambiguous and the Master Enterprise Solution Best Bets™ brand is established in code from the start.',
    requirementDetail: 'server/data/leadToRevenueModel.js: ARTIFACT.parentBrand, parentBrandDescriptor, author = "Martha Elizabeth Salter aka Betsy Salter", copyright updated. server/data/contributionMethodology.js: same. src/components/Output.jsx: eyebrow lines, IP badge, and footer copyright in MethodologyOutput + L2RModelOutput updated. server/data/defaultSite.js copyrightLine updated.',
    acceptanceCriteria: 'All IP artifact files carry Master Enterprise Solution Best Bets™ parentBrand. Copyright reads "Martha Elizabeth Salter aka Betsy Salter" everywhere. Site footer and output pages reflect the update.',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.5, hoursClaude: 0.3,
    tags: ['patch:v0.17', 'ip-artifacts', 'trademark', 'copyright'],
    l2rStage: 'gtm-product-definition',
    contributionType: 'strategic_direction',
  },

  // ── Lead to Revenue Capability Model™ ─────────────────────────────────────

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · l2r-model-data-file',
    title: 'Lead to Revenue Capability Model™ — canonical data file',
    summary: 'server/data/leadToRevenueModel.js created as the canonical IP artifact for the L2R Capability Model. Contains: ARTIFACT metadata (trademark, parentBrand Master Enterprise Solution Best Bets™, license tiers, watermark template), GTM_PATHS (market-first startup path + product-first mature org path), GTM_NODES (5 nodes including Product Definition with two-path architecture), LIFECYCLE_STAGES (9 stages with control points, risk areas, players, systems), CROSS_CUTTING (6 dimensions), PLATFORM_CAPABILITY_MAP (existing capability slugs linked to L2R stages). Practitioner-derived from 12+ years of enterprise Q2R/CPQ/CLM/RevRec/RevOps delivery.',
    userStory: 'As Betsy, I want my Lead to Revenue Capability Model to exist as a versioned, copyright-protected data file in the platform so it can power output widgets, capability tagging, and client proposals from a single source of truth.',
    requirementDetail: 'server/data/leadToRevenueModel.js exports: ARTIFACT, GTM_PATHS, GTM_NODES (5), LIFECYCLE_STAGES (9: market-landscape, icp-definition, gtm-product-definition, demand-generation, pipeline-development, deal-management, close-and-booking, quote-to-cash, revenue-recognition-reporting), CROSS_CUTTING (6), PLATFORM_CAPABILITY_MAP. Three-tier license: public=teaser_only, member=read_only_framework, client=engagement_licensed.',
    acceptanceCriteria: 'File exists and exports all named constants. ARTIFACT contains trademark, parentBrand, copyright with Martha Elizabeth Salter. All 9 lifecycle stages present with controlPoints, riskAreas, players, systems arrays.',
    ...DEPLOYED,
    hoursBetsy: 3.0, hoursClaude: 1.5,
    tags: ['patch:v0.17', 'ip-artifacts', 'l2r-model', 'mes-best-bets'],
    l2rStage: 'gtm-product-definition',
    contributionType: 'domain_authoring',
  },

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · l2r-model-output-route',
    title: '/output/l2r-model — three-tier IP gated output route',
    summary: 'L2RModelOutput component added to Output.jsx. Route /output/l2r-model wired in App.jsx. Three tiers: public = 6-card teaser with trademark, positioning quote, and CTA to inquire; member = interactive 9-stage model with clickable stage cards, control points + risk areas detail panel; client = same as member (engagement-licensed full detail). Dark SB design (#0f1117). © Martha Elizabeth Salter in footer on every tier. Master Enterprise Solution Best Bets™ in eyebrow. Member email shown when authenticated.',
    userStory: 'As a visitor or member, I want to see the Lead to Revenue Capability Model in a rendered output that shows me the right level of detail for my relationship with Salt Basin — teaser for public, framework for members, full detail for clients.',
    requirementDetail: 'src/components/Output.jsx: L2RModelOutput component. Auth state → tier: !user = public, user.role = admin = client, else member. Public: IpTierBadge + 6 teaser cards (one per L2R phase), positioning quote, IpProposalCta. Member/client: interactive stage grid, click to expand control points + risk areas. Footer: © Martha Elizabeth Salter aka Betsy Salter · Lead to Revenue Capability Model™ · Master Enterprise Solution Best Bets™.',
    acceptanceCriteria: '/output/l2r-model renders at all three tiers. Public sees teaser only. Authenticated member sees interactive model. Admin (client tier) sees full detail. Copyright in footer on all tiers.',
    ...DEPLOYED,
    hoursBetsy: 1.0, hoursClaude: 1.5,
    tags: ['patch:v0.17', 'output-pages', 'l2r-model', 'ip-artifacts'],
    l2rStage: 'gtm-product-definition',
    contributionType: 'active_supervision',
  },

  // ── Contribution Intelligence Methodology™ ─────────────────────────────────

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · contribution-methodology-data-file',
    title: 'Contribution Intelligence Methodology™ — canonical data file',
    summary: 'server/data/contributionMethodology.js created as the IP artifact for the Contribution Intelligence Methodology. Contains: ARTIFACT metadata (trademark, parentBrand Master Enterprise Solution Best Bets™), DERIVATION_RECORD (transparent co-derivation log — what was decided, by whom, why, and what evidence), CONTRIBUTION_TYPES (4 types: Strategic Direction, Domain Authoring, Active Supervision, Code Generation — each with 2026 rate, reducibility flag, examples), RATE_CONFIGS_2026 (4 rate entries: Betsy $225, Claude $115 quality-adjusted, offshore entry $65 benchmark, onshore senior $175 benchmark), OVERSIGHT_LEVELS (4 intensity levels keyed to turn density), REDUCTION_MAP (irreducible IP vs reducible execution), THREE_LOOPS (Loop 1 Estimation, Loop 2 Cost Ledger, Loop 3 Business Value/ROI). Calc helpers exported.',
    userStory: 'As Betsy, I want the methodology I developed for measuring practitioner + AI contribution to exist as versioned IP in the platform, with transparent derivation records so clients can understand how it was created.',
    requirementDetail: 'server/data/contributionMethodology.js: ARTIFACT, DERIVATION_RECORD, CONTRIBUTION_TYPES (4), RATE_CONFIGS_2026 (4), OVERSIGHT_LEVELS (4), REDUCTION_MAP, THREE_LOOPS (3). Exports: calcActualCost, calcEngineerEquivCost, calcLeverageMultiple, calcCostLeverage, getOversightLevel. Turn density thresholds: critical >120/hr, high 80-120, moderate 40-80, low <40.',
    acceptanceCriteria: 'File exports all named constants and helpers. calcLeverageMultiple(1002, 35.4) returns 28.3. getOversightLevel(115) returns OVERSIGHT_LEVELS[0] (critical). ARTIFACT.parentBrand = "Master Enterprise Solution Best Bets™".',
    ...DEPLOYED,
    hoursBetsy: 2.5, hoursClaude: 1.0,
    tags: ['patch:v0.17', 'ip-artifacts', 'contribution-methodology', 'mes-best-bets'],
    l2rStage: 'gtm-product-definition',
    contributionType: 'domain_authoring',
  },

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · methodology-output-route',
    title: '/output/methodology — three-tier IP gated output route',
    summary: 'MethodologyOutput component added to Output.jsx. Route /output/methodology wired in App.jsx. Three tiers: public = 4-card teaser (What, Why, How, Proof) + core IP phrase + CTA; member = 6-card framework overview + derivation record panel; client = member + full contribution type breakdown with reducibility flags, rate details, and oversight intensity scale. Shared IP_STYLES, IpTierBadge, IpProposalCta components used across both new output routes.',
    userStory: 'As a visitor or member, I want to see Betsy\'s Contribution Intelligence Methodology at the right depth for my relationship — enough to understand the value and authority publicly, full framework as a member, full detail as a client.',
    requirementDetail: 'src/components/Output.jsx: MethodologyOutput, shared IP_STYLES object, IpTierBadge (public/member/client badges), IpProposalCta (links to /#contact + /consulting/services). Public tier: 4 cards, core phrase, CTA. Member: derivation record + 6-card framework. Client: member + 4 contribution type cards with rate, reducibility, examples.',
    acceptanceCriteria: '/output/methodology renders. Public sees teaser with IP phrase. Member sees derivation record. Client/admin sees full contribution type breakdown. Footer © on all tiers.',
    ...DEPLOYED,
    hoursBetsy: 0.5, hoursClaude: 1.5,
    tags: ['patch:v0.17', 'output-pages', 'contribution-methodology', 'ip-artifacts'],
    l2rStage: 'gtm-product-definition',
    contributionType: 'active_supervision',
  },

  // ── DB migrations ──────────────────────────────────────────────────────────

  {
    capabilitySlug: 'platform-data',
    externalRef: 'v0.17 · db-sessions-table',
    title: 'DB — sessions table for JSONL ingestion and contribution tracking',
    summary: 'sessions table added to db.js bootstrap. Stores ingested JSONL session data: jsonl_filename, project_directory, date_start/end, active_hours, total_turns, user_turns, turn_density, oversight_intensity, versions_covered, burst_count, notes. Foundation for the Loop 1 (estimation) and Loop 2 (cost ledger) data pipelines. Each backlog_item can now reference a session_id for full contribution traceability.',
    userStory: 'As Betsy, I want each Claude Code session to be ingested as a record in the platform so that backlog items, patch notes, and contribution costs can be traced back to the specific session they were built in.',
    requirementDetail: 'CREATE TABLE IF NOT EXISTS sessions (id BIGSERIAL PK, jsonl_filename TEXT NOT NULL, project_directory TEXT, date_start/end BIGINT, active_hours NUMERIC, total_turns INT, user_turns INT, turn_density NUMERIC, oversight_intensity TEXT, versions_covered TEXT[], burst_count INT, notes TEXT, created_at BIGINT). backlog_items: ADD COLUMN IF NOT EXISTS session_id BIGINT REFERENCES sessions(id).',
    acceptanceCriteria: 'sessions table exists in production DB. backlog_items has session_id column. ALTER statements are idempotent (no error on re-run).',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.5, hoursClaude: 0.5,
    tags: ['patch:v0.17', 'database', 'contribution-methodology', 'platform-data'],
    l2rStage: 'revenue-recognition-reporting',
    contributionType: 'strategic_direction',
  },

  {
    capabilitySlug: 'platform-data',
    externalRef: 'v0.17 · db-rate-configs-table',
    title: 'DB — rate_configs table seeded with 2026 benchmark rates',
    summary: 'rate_configs table added with 4 seeded rows: betsy_director_2026 ($225/hr, applies to all 3 Betsy contribution types), claude_senior_2026 ($115/hr quality-adjusted, applies to code_generation), benchmark_offshore_2026 ($65/hr, comparison only), benchmark_onshore_senior_2026 ($175/hr, comparison only). Seeded with ON CONFLICT DO NOTHING so re-runs are safe. Foundation for Loop 2 cost ledger calculations.',
    userStory: 'As Betsy, I want the 2026 rate benchmarks to be stored in the database so that cost calculations on backlog items, patch notes, and capability groups can be computed and updated from a single source rather than hardcoded in multiple places.',
    requirementDetail: 'CREATE TABLE IF NOT EXISTS rate_configs (id TEXT PK, rate_type TEXT, contributor TEXT, rate_per_hour NUMERIC, effective_year INT, basis TEXT, applies_to TEXT, note TEXT, created_at BIGINT). Seed 4 rows with INSERT ... ON CONFLICT DO NOTHING.',
    acceptanceCriteria: 'rate_configs table exists. SELECT * FROM rate_configs returns 4 rows. Re-running bootstrap does not duplicate rows.',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.3, hoursClaude: 0.3,
    tags: ['patch:v0.17', 'database', 'contribution-methodology', 'rates'],
    l2rStage: 'revenue-recognition-reporting',
    contributionType: 'strategic_direction',
  },

  {
    capabilitySlug: 'platform-data',
    externalRef: 'v0.17 · db-backlog-contribution-columns',
    title: 'DB — backlog_items contribution tracing columns',
    summary: 'New columns added to backlog_items via idempotent ALTER TABLE: session_id (FK to sessions), l2r_stage (which L2R lifecycle stage this item belongs to), contribution_type (strategic_direction / domain_authoring / active_supervision / code_generation), est_director_hours / est_claude_hours (pre-build estimates), actual_director_hours / actual_claude_hours (post-build actuals), oversight_intensity, automation_potential, patch_note_version, data_source (session_actual / session_partial / estimated). Enables full Loop 1 and Loop 2 data pipelines.',
    userStory: 'As Betsy, I want each backlog item to carry enough data for contribution attribution, cost estimation, and L2R stage tracing so the platform can compute ROI and methodology metrics without manual spreadsheet work.',
    requirementDetail: 'ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS for each: session_id, l2r_stage, contribution_type, est_director_hours NUMERIC, est_claude_hours NUMERIC, actual_director_hours NUMERIC, actual_claude_hours NUMERIC, oversight_intensity, automation_potential, patch_note_version, data_source. All nullable, default NULL.',
    acceptanceCriteria: 'All 11 new columns exist on backlog_items. ALTER statements idempotent. Existing rows unaffected (NULL defaults).',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.3, hoursClaude: 0.5,
    tags: ['patch:v0.17', 'database', 'contribution-methodology', 'backlog'],
    l2rStage: 'revenue-recognition-reporting',
    contributionType: 'strategic_direction',
  },

  // ── Integrations gate ──────────────────────────────────────────────────────

  {
    capabilitySlug: 'member-experience',
    externalRef: 'v0.17 · integrations-research-gate',
    title: 'Integrations — hidden behind "Under Research" notice for all members',
    summary: 'Third-party app connections (OAuth providers, member DB connections) are no longer accessible to members. IntegrationHub, MemberDbsCard, and ConnectedAppsCard replaced with IntegrationsRoadmapNotice in both ConfigPanel.jsx and ProfileHub.jsx. Notice explicitly states no official partnerships or registered app status exist with any external platform. Integration possibilities are under research; nothing is committed. Underlying components (IntegrationHub, ProviderRow) remain in the codebase but are unreachable until a Salt Basin native connector launches.',
    userStory: 'As Betsy, I want members to see a clear "under research" message in the integrations section rather than Connect buttons that lead nowhere, so that no one thinks we have official partnerships with third-party platforms that we do not have.',
    requirementDetail: 'src/components/admin/ProfileHub.jsx: IntegrationsRoadmapNotice component replaces IntegrationHub in PersonalProfilePanel + OrgDetailPanel integrations tab. src/components/admin/ConfigPanel.jsx: IntegrationsRoadmapNotice replaces MemberDbsCard + ConnectedAppsCard for isMember. Copy: "Third-party app connections are not available to members at this time. Salt Basin Net Works does not currently hold official partnerships or registered app status with any external platform."',
    acceptanceCriteria: 'Members see "Integrations — Under Research" card in Config and Profile Hub. No Connect buttons visible. No OAuth flows accessible to members. Admin (Betsy) sees the same notice — integrations not exposed at any member role.',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.3, hoursClaude: 0.3,
    tags: ['patch:v0.17', 'integrations', 'member-experience', 'ip-protection'],
    l2rStage: 'gtm-product-definition',
    contributionType: 'strategic_direction',
  },

  // ── Render env vars ────────────────────────────────────────────────────────

  {
    capabilitySlug: 'platform-infra',
    externalRef: 'v0.17 · render-env-sync',
    title: 'Infra — Render env vars synced: TOKEN_ENCRYPTION_KEY + APP_BASE_URL added',
    summary: 'Two env vars were missing from Render that existed locally: TOKEN_ENCRYPTION_KEY (required for AES-256-GCM OAuth token encryption — any oauth-adjacent route would crash without it) and APP_BASE_URL (production base URL for OAuth callbacks, should be https://saltbasin.net). Both added via Render API. Full 13-var set confirmed on Render. Local .env ADMIN_INITIAL_PASSWORD synced to match production value so backlog scripts authenticate correctly against the live API.',
    userStory: 'As Betsy, I want my Render environment to have all required environment variables so that production deployments do not silently fail on routes that depend on encryption or base URL configuration.',
    requirementDetail: 'Render API PUT /v1/services/{id}/env-vars with full 13-var payload. TOKEN_ENCRYPTION_KEY = 64-char hex (AES-256-GCM key). APP_BASE_URL = https://saltbasin.net. Local .env ADMIN_INITIAL_PASSWORD updated to match Render value. Render notifyOnFail confirmed (requires dashboard account-level setting — not settable via API).',
    acceptanceCriteria: 'Render service has 13 env vars. TOKEN_ENCRYPTION_KEY and APP_BASE_URL present. node scripts/add-v017-backlog-items.mjs authenticates successfully against production.',
    ...DEPLOYED, kind: 'chore',
    hoursBetsy: 0.5, hoursClaude: 0.5,
    tags: ['patch:v0.17', 'infra', 'render', 'env-vars'],
    l2rStage: 'revenue-recognition-reporting',
    contributionType: 'active_supervision',
  },
];

// ── SECTION 3 — Pending items from this session ───────────────────────────────

const NEW_PENDING_ITEMS = [

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · pending · patchnotes-real-session-metrics',
    title: 'Patch notes — update all 17 entries with real session JSONL metrics',
    summary: 'server/data/patchNotes.js still carries old estimated metrics format (directorHours, claudeBuildMins, engineerEquivHours). All 17 entries need to be updated to the new format: sessionActiveHours, turnDensity, dataSource (session_actual | session_partial | estimated), sessionIds, betsySessionHours, claudeActiveHours, engineerEquivHours, oversightIntensity, l2rStages, notes. Real session data is available from 7 JSONL files. v0.17 entry should be added.',
    userStory: 'As Betsy, I want every patch note entry to carry real session data — not estimates — so that the contribution methodology is backed by verifiable numbers from the actual JSONL files.',
    requirementDetail: 'Real session data: 7d7794e2 (13.57h, 1558 turns, 115/hr, v0.1-v0.8), f8dd2422 (4.40h, 453 turns, 103/hr, v0.9), 97254a80 (7.00h, 725 turns, 104/hr, v0.9-v0.11), ddf4fb85 (2.48h, 101 turns, 41/hr, v0.12-v0.13), 0caba5fc (1.15h, 92 turns, 80/hr, v0.12-v0.13), de055505 (5.79h, 785 turns, 135/hr, v0.14-v0.15), 551b4cbf (1.03h+ ongoing, 166/hr, v0.16-v0.17). New metrics format per entry. v0.17 entry to cover: IP artifacts, L2R model, contribution methodology, DB migrations, integrations gate, Render env sync.',
    acceptanceCriteria: '/output/patch-notes renders v0.17. All entries carry new metrics format. dataSource field present. No estimated values where actuals are available.',
    priority: 'p1', ...PENDING,
    tags: ['patch:v0.17', 'patch-notes', 'contribution-methodology', 'metrics'],
    l2rStage: 'revenue-recognition-reporting',
    contributionType: 'domain_authoring',
  },

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · pending · l2r-stage-tags-existing-backlog',
    title: 'Backlog — backfill l2r_stage tags on all existing items',
    summary: 'Now that backlog_items has an l2r_stage column and the L2R Capability Model defines 9 stages, all existing backlog items should be tagged with the appropriate l2r_stage. This enables Loop 3 (Business Value/ROI) calculations — cost by L2R stage, capability maturity by stage, and investment allocation across the revenue lifecycle. Can be done via a backfill script or admin UI once the backlog panel exposes the l2r_stage field.',
    userStory: 'As Betsy, I want every backlog item to be tagged to a stage in my Lead to Revenue Capability Model so I can see where I am investing my build time and what areas of the revenue lifecycle are most mature.',
    requirementDetail: 'L2R stages: market-landscape, icp-definition, gtm-product-definition, demand-generation, pipeline-development, deal-management, close-and-booking, quote-to-cash, revenue-recognition-reporting. Backlog items map roughly: auth/member → icp-definition, crm/leads → pipeline-development + deal-management, cms-public → demand-generation, output-pages → gtm-product-definition, platform-data/infra → revenue-recognition-reporting, backlog/qa/admin-experience → revenue-recognition-reporting.',
    acceptanceCriteria: 'All existing backlog items have a non-null l2r_stage. Distribution across stages reflects actual build investment. Backlog panel shows l2r_stage field.',
    priority: 'p2', ...PENDING, kind: 'chore',
    tags: ['patch:v0.17', 'backlog', 'l2r-model', 'traceability'],
    l2rStage: 'revenue-recognition-reporting',
    contributionType: 'domain_authoring',
  },

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · pending · sessions-ingest-script',
    title: 'Sessions — JSONL ingest script to populate sessions table',
    summary: 'A script or admin tool to read JSONL files and insert rows into the sessions table. Should compute: active_hours (from 30-min idle burst analysis), total_turns, user_turns, turn_density, oversight_intensity (from density thresholds), burst_count, versions_covered (inferred from session content or manual tag). Foundation for Loop 1 (estimation accuracy) and Loop 2 (cost ledger) to operate from real data rather than patchNotes.js estimates.',
    userStory: 'As Betsy, I want to be able to ingest a Claude Code session JSONL file and have the platform automatically compute and store the contribution metrics so I don\'t have to manually calculate active hours and turn density.',
    requirementDetail: 'Script: node scripts/ingest-session.mjs <path-to-jsonl> [--versions v0.16,v0.17] [--notes "..."]. Reads JSONL, applies 30-min idle threshold to separate bursts, counts user vs assistant turns, computes density = user_turns / active_hours, maps density to oversight_intensity. Inserts into sessions table via API or direct DB connection.',
    acceptanceCriteria: 'Running the script for a known JSONL file produces a sessions row with correct active_hours (within 5% of manual calculation), correct user_turns, turn_density, and oversight_intensity classification.',
    priority: 'p2', ...PENDING,
    tags: ['patch:v0.17', 'contribution-methodology', 'sessions', 'data-pipeline'],
    l2rStage: 'revenue-recognition-reporting',
    contributionType: 'strategic_direction',
  },

  {
    capabilitySlug: 'ip-artifacts',
    externalRef: 'v0.17 · pending · mes-best-bets-public-page',
    title: 'Master Enterprise Solution Best Bets™ — public-facing page or section on saltbasin.net',
    summary: 'Master Enterprise Solution Best Bets™ exists as a registered trademark in the data layer but has no public-facing presence on saltbasin.net yet. A page or section should introduce the brand: what it is (GTM + Q2R end-to-end best practices and platforms), who it is from (Betsy Salter), and what it offers (methodology, L2R model, client engagements). Could live as a section on the existing site or as a dedicated /mes-best-bets route. Should link to /output/methodology and /output/l2r-model.',
    userStory: 'As a visitor to saltbasin.net who sees Master Enterprise Solution Best Bets™ referenced in an output or proposal, I want to be able to find out what it is and how to engage with Betsy around it.',
    requirementDetail: 'CMS section or dedicated page. Headline: "Master Enterprise Solution Best Bets™". Subhead: descriptor. Body: brief explanation of the methodology and L2R model. CTAs: View Methodology (/output/methodology), View L2R Model (/output/l2r-model), Inquire (/#contact). Should carry © Martha Elizabeth Salter aka Betsy Salter in footer.',
    acceptanceCriteria: 'A public page or section exists that introduces Master Enterprise Solution Best Bets™. Links to both output pages. © attribution correct.',
    priority: 'p3', ...PENDING,
    tags: ['patch:v0.17', 'cms-public', 'mes-best-bets', 'ip-artifacts'],
    l2rStage: 'demand-generation',
    contributionType: 'strategic_direction',
  },

  {
    capabilitySlug: 'platform-infra',
    externalRef: 'v0.17 · pending · render-deploy-failure-notifications',
    title: 'Infra — Render deploy failure email notifications',
    summary: 'Render notifyOnFail is currently set to "default" (account-level default). The account-level notification setting needs to be confirmed on in the Render dashboard under Account → Notifications. The Render API cannot write this setting (read-only via API). Manual dashboard step: account avatar → Notifications → enable "Deploy failed" email.',
    userStory: 'As Betsy, I want to receive an email whenever a Render deploy fails so I know immediately when production is broken without having to check the dashboard manually.',
    requirementDetail: 'Render dashboard: Account → Notifications → Deploy failed → Email ON. This is an account-level setting, not service-level. The service notifyOnFail field shows "default" which inherits from the account setting.',
    acceptanceCriteria: 'A failing deploy sends an email to the Render account email. Confirmed by intentionally triggering a bad deploy or verifying the notification setting is enabled in the dashboard.',
    priority: 'p1', ...PENDING, kind: 'chore',
    tags: ['patch:v0.17', 'infra', 'render', 'notifications'],
    l2rStage: 'revenue-recognition-reporting',
    contributionType: 'active_supervision',
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
  // printSearchResults('integration items', searchItems(existingItems, 'integration'));
  // printSearchResults('v0.16 items', findByVersion(existingItems, 'v0.16'));

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
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}" — item will be ungrouped`);
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
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}" — item will be ungrouped`);
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
  1. Confirm Render deploy is green at https://dashboard.render.com
  2. Visit /output/methodology and /output/l2r-model to verify both routes render
  3. Enable deploy failure emails: Render dashboard → Account → Notifications
  4. Run patchNotes.js update with real session metrics (v0.17 · pending · patchnotes-real-session-metrics)
  5. Backfill l2r_stage on existing backlog items (v0.17 · pending · l2r-stage-tags-existing-backlog)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => { console.error(e); process.exit(1); });
