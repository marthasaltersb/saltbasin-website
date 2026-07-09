// v0.19 backlog update — Operating Model Dashboard rebuild + NRM nav
// consolidation + field-definition-driven stage gates.
//
// Built in Claude Code (this session, 2026-07-08). Two of these three items
// touch capability/scope already covered by prior backlog entries:
//   - #111 (Codex-built PLM/EIDOS Operating Model dashboard) gets UPDATED —
//     not duplicated — since this session rebuilt/extended that same surface.
//     Its original Codex-authored 0.70hr stays disclosed in requirementDetail
//     and is NOT folded into this update's hoursClaude figure, which covers
//     only this session's Claude-authored increment, per the methodology's
//     rule that non-Claude AI-tool work must never be folded into
//     Anthropic-attributed totals.
//   - The Net Works admin tab (#28) and public opt-in banner (#18) are
//     unaffected in function — this session only relocated the Net Works tab
//     in the nav, tracked here as new scope, not a duplicate of #28/#18.
//
// Hours are this session's own practitioner-logged estimate (data_source
// stays at its 'estimated' default) — not a retroactive JSONL burst analysis
// (that tier of the methodology is applied separately, in batch, per
// contributionMethodology.js's documented process). costUsdClaude /
// traditionalCostUsd are computed from RATE_CONFIGS_2026 ($115/hr Claude,
// $175/hr traditional-team comparison); activitiesBetsy/Claude from the
// documented CEIL(hoursBetsy×3) / CEIL(hoursClaude×6) formula.
//
// Idempotent via POST /api/backlog/items' upsert-by-externalRef (server/
// routes/backlog.js) — safe to re-run.
//
// Usage: node scripts/add-v019-backlog-items.mjs
// Requires in .env: ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD. Optional PUBLIC_BASE_URL
// (defaults to the local dev API so this can be run against a running `npm run server`).

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASS || !EMAIL) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

const CLAUDE_RATE = 115;
const TRADITIONAL_RATE = 175;

function withCost(hoursBetsy, hoursClaude) {
  return {
    hoursBetsy,
    hoursClaude,
    activitiesBetsy: Math.ceil(hoursBetsy * 3),
    activitiesClaude: Math.ceil(hoursClaude * 6),
    costUsdClaude: Math.round(hoursClaude * CLAUDE_RATE * 100) / 100,
    traditionalCostUsd: Math.round((hoursBetsy + hoursClaude) * TRADITIONAL_RATE * 100) / 100,
  };
}

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

async function upsertItem(cookie, payload) {
  const res = await fetch(`${BASE}/api/backlog/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`upsertItem failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const BUILT_NOT_YET_DEPLOYED = {
  kind: 'feature',
  status: 'completed',
  deployedGithub: false,
  deployedRender: false,
  deployedNetlify: false,
  priority: 'p1',
};

const V019_ITEMS = [
  {
    capabilitySlug: 'net-works-network',
    externalRef: 'v0.19 · nrm-module-nav-consolidation',
    title: 'Network Relationship Management module — My Profile + Net Works + NRM contacts consolidated into one nav module',
    summary: 'Merged three previously separate admin nav entries — My Profile (site content editor + resume), Net Works (member roster, formerly under CRM), and the standalone Network Relationship Manager (contacts + reference requests) — into one "Network Relationship Management" nav module, per PLATFORM_MERGE_SPEC.md §9/§13/§14\'s intent that NRM own all network/contact/profile relationship data, distinct from CRM\'s org/lead pipeline.',
    userStory: 'As Betsy, I want My Profile, the member roster, and my contact/reference-request tracking to live under one "Network Relationship Management" nav module instead of three unrelated nav entries, so the admin nav reflects the actual architecture (NRM owns network relationships; CRM owns org/lead pipeline) instead of history.',
    requirementDetail: 'src/components/admin/AdminShell.jsx: FALLBACK_ADMIN_NAV\'s `content` view relabeled "Network Relationship Management" and now carries 4 tabs (My Profile, My Resume, Net Works, Network Contacts) in place of the old 2-tab My Profile view; the CRM view drops its Net Works tab down to Leads-only; the old standalone "Network Relationship Manager" view is retired. server/db.js gained a new idempotent one-shot migration block (mirrors the existing admin_nav migration pattern at ~line 1496) that relocates the `networks` and `nrm` tabs into the `content` view on Betsy\'s live persisted admin_nav config_state row, wherever they currently live, without clobbering any manual nav edits.',
    acceptanceCriteria: 'Given I am logged in as admin\nWhen I open the admin nav\nThen "Network Relationship Management" replaces "My Profile" as the first nav view, containing My Profile / My Resume / Net Works / Network Contacts tabs, and the CRM view shows only Leads.',
    tags: ['patch:v0.19', 'net-works-network', 'nav', 'admin-nav', 'nrm'],
    ...BUILT_NOT_YET_DEPLOYED,
    ...withCost(0.5, 1.0),
  },
  {
    // Update, not a duplicate — same externalRef as scripts/add-plm-eidos-operating-model-item.mjs.
    capabilitySlug: 'requirements-mgmt',
    externalRef: 'Codex sessions 2026-07-05/can-you-2 + 2026-07-07/are-y · SaltTide_Operating_Model_Merge_Handover.md',
    title: 'Operating Model Dashboard — module breakdown (11-app Application Map) + per-module backlog drill-down',
    summary: 'Rebuilt the "Operating Model" tab (relabeled "Operating Model Dashboard") from one flat list of every backlog item into a two-level view: a module grid mirroring the 11-app Application Map from PLATFORM_MERGE_SPEC.md §9 (NRM, CRM, PLM, HERQ, Services, Global Standards, FinBridgeCo, Resume, Analytics, Member Site CMS, Public Site CMS), each showing item count / real-progress / stage distribution, drilling into that module\'s own scoped backlog view on click.',
    userStory: 'As Betsy, I want the Operating Model Dashboard to show me backlog health broken down by the platform module I\'m building, not one undifferentiated list, so I can see at a glance which modules have real backlog behind them and drill into just that module\'s items.',
    requirementDetail: 'New src/data/platformModules.js: the 11-app catalog plus a capability-group→module mapping (no backlog_items schema change — a lightweight config, per decision with Betsy). src/components/admin/MemberPlmPanel.jsx rewritten: module grid (ModuleGrid/ModuleCard) as the default view, drill-down reuses the existing StageRail/Filters/RecordCard/DetailPanel scoped to the selected module\'s records, with a breadcrumb back to the grid. Builds on, does not replace, the original Codex-built EIDOS-taxonomy dashboard prototype (2026-07-07, 0.70hr, non-Claude — see original entry, unchanged/not folded into this update\'s hours). Not yet deployed — verified via a clean `npx vite build` (755 modules) and manual field-name cross-check against server/routes/backlog.js\'s row mappers; a live browser walkthrough of the module grid/drill-down was not completed this session due to a dev-server port conflict with a concurrent session.',
    acceptanceCriteria: 'Given I am logged in as admin\nWhen I open Operating Model Dashboard\nThen I see a grid of 11 module cards with item counts and real-progress, and clicking one scopes the backlog list + stage rail to that module with a way back to the grid.',
    tags: ['patch:v0.19', 'requirements-mgmt', 'plm', 'eidos', 'operating-model', 'module-dashboard', 'claude-code-extension'],
    ...BUILT_NOT_YET_DEPLOYED,
    ...withCost(0.7, 2.0),
  },
  {
    capabilitySlug: 'requirements-mgmt',
    externalRef: 'v0.19 · field-definition-driven-stage-gates',
    title: 'Stage-gate scoring rewired to a literal field-definition schema (replaces ad hoc heuristic)',
    summary: 'The "Data Definition" lifecycle gate and the definition-shaped methodology dimensions (Business/Functional/Technical Definition, Data Architecture, Documentation) were computed from a hardcoded set of `hasText()`/`boolScore()` checks with no traceability. Rewired to read from a new literal field-definition catalog transcribed from TECHNICAL_DESIGN_SPEC.md §10.1 and FUNCTIONAL_DESIGN_SPEC.md §4.12, so each gate\'s percentage is now a direct function of named, typed fields with doc provenance.',
    userStory: 'As Betsy, I want the Data Definition and methodology stage-gate percentages to be traceable to specific named fields from the design specs, not an opaque heuristic, so I can see exactly which literal field is missing (and where it\'s documented) when a gate isn\'t met.',
    requirementDetail: 'New src/data/backlogFieldSchema.js: BACKLOG_FIELD_SCHEMA catalog (field key, label, type, requirementCategory, methodologyDimension, sourceDoc/sourceSection) plus fieldPresent/categoryScore/dimensionScore/fieldCoverage helpers. src/data/platformLifecycleConfig.js: dataDefinitionScore() and the 5 definition-shaped methodologyScores() dimensions now compute from this schema instead of inline checks (build/testing/validation stay status-derived — those measure delivery state, not field presence); stageGateResult() gains a missingFields list with doc citations per gap. src/components/admin/MemberPlmPanel.jsx: gate-gap cards now show named missing fields + doc citation instead of a bare percentage; new Field Definition Coverage panel in the module drill-down shows per-field coverage % across that module\'s items — the requested "rolled up ... into different formats" view. Deliberately not built this pass: an automated markdown-prose parser (the spec\'s Data Model table mixes column names/type hints/formulas in unstructured prose — not reliably parseable) and a downloadable mapping-document export (the coverage panel is in-app only).',
    acceptanceCriteria: 'Given a backlog item missing Acceptance Criteria\nWhen I view its Lifecycle Gate Gaps\nThen the gap shows "Missing: Acceptance Criteria — see FUNCTIONAL_DESIGN_SPEC.md §4.12" rather than only a percentage, and the module drill-down\'s Field Definition Coverage panel lists that field\'s coverage % across the module.',
    tags: ['patch:v0.19', 'requirements-mgmt', 'contribution-methodology', 'data-definition', 'stage-gates'],
    ...BUILT_NOT_YET_DEPLOYED,
    ...withCost(0.8, 2.5),
  },
];

async function main() {
  console.log(`Connecting to ${BASE}…`);
  const cookie = await login();
  console.log('Logged in.\n');

  const { groups = [] } = await getBacklog(cookie);
  const slugMap = {};
  for (const g of groups) if (g.slug) slugMap[g.slug] = g.id;

  let created = 0, updated = 0;
  for (const item of V019_ITEMS) {
    const { capabilitySlug, ...rest } = item;
    const groupId = slugMap[capabilitySlug] || null;
    if (!groupId) console.warn(`  WARN: no group for slug "${capabilitySlug}" — item will be ungrouped`);
    const result = await upsertItem(cookie, { ...rest, capabilityId: groupId });
    if (result.upserted === 'updated') { updated++; console.log(`  UPDATED [${result.id}] (${capabilitySlug}): ${rest.title.slice(0, 70)}`); }
    else { created++; console.log(`  CREATED [${result.id}] (${capabilitySlug}): ${rest.title.slice(0, 70)}`); }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Created: ${created}   Updated: ${updated}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next: after today's 3 deploys go out, run a larger post-deploy backlog
pass to flip status→deployed and set deployedGithub/Render/Netlify.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
