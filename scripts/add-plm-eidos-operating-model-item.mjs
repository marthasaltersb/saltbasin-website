// Adds the backlog item for the PLM/EIDOS Operating Model dashboard —
// built in Codex (OpenAI), not Claude Code, so it has no JSONL session
// transcript and can't be measured by the Contribution Intelligence
// Methodology's primary tier.
//
// Real evidence found instead: file-mtime spans across two Codex working
// sessions (~/Documents/Codex/2026-07-05/can-you-2 and .../2026-07-07/are-y),
// corroborated by SaltTide_Operating_Model_Merge_Handover.md (written
// 13:27, explicitly bridging the two sessions):
//   Prototype build:  2026-07-07T12:13 -> 12:46  (33 min, salttide-operating-
//                      model-platform/{index.html,styles.css,app.js,
//                      platform-config.js})
//   Merge into repo:  2026-07-07T13:27 -> 13:36  (9 min, handover doc ->
//                      platformLifecycleConfig.js/MemberPlmPanel.jsx/
//                      AdminShell.jsx last write)
//   Total real evidence-backed span: 42 min (0.70 hr)
//
// This is NOT Claude's work — hoursClaude/costUsdClaude stay null so it
// never gets folded into the Anthropic-specific Contribution Intelligence
// totals. The 0.70hr goes in a dedicated non-Claude field via tags +
// requirementDetail disclosure instead, since the schema has no generic
// "other AI tool" hours column.

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  return res.headers.get('set-cookie').split(';')[0];
}

const ITEM = {
  capabilityId: 12, // Requirements & Test Management
  title: 'PLM Operating Model dashboard — EIDOS taxonomy + admin nav tab',
  summary: 'New "Operating Model" tab under Platform Lifecycle Management, surfacing the EIDOS enterprise-hierarchy object taxonomy (Enterprise → Portfolio → Thesis → Tributary → Capability → Feature/Task/Deliverable) that the PLM and Contribution Intelligence apps build on.',
  userStory: 'As Betsy, I want a dashboard view of the platform\'s operating-model hierarchy so I can see how requirements, features, and contribution data roll up from individual tasks to enterprise-level portfolios.',
  requirementDetail:
    'Built in Codex (OpenAI), not Claude Code — no JSONL session transcript exists for this work, so it cannot be measured by the Contribution Intelligence Methodology\'s primary (real burst analysis) or secondary (turn-count estimate) tiers, both of which are Claude-specific. Real evidence instead comes from file-modification timestamps across two Codex working sessions: a standalone prototype (salttide-operating-model-platform/index.html + styles.css + app.js + platform-config.js) built 2026-07-07T12:13-12:46 (33 min), then merged into the Salt Basin platform architecture 2026-07-07T13:27-13:36 (9 min), per SaltTide_Operating_Model_Merge_Handover.md which explicitly bridges the two sessions. Total real evidence-backed span: 42 minutes (0.70 hr) of Codex (OpenAI) work — not included in hoursClaude/costUsdClaude, which remain null so this never gets folded into Anthropic-specific Contribution Intelligence totals.',
  businessRules:
    '- Adds app.eidosOperatingModel and app.contributionIntelligence to the platform app registry (server/db.js).\n- New admin_nav tab id "plm-dashboard", componentId "plmDashboard", wired to MemberPlmPanel via the standard TAB_COMPONENTS registry pattern.\n- platformLifecycleConfig.js defines the object taxonomy as data, not hardcoded component logic — consistent with the existing config-driven architecture (block registry, field metadata).',
  designSpec: 'Dashboard view under Platform Lifecycle Management → Operating Model, first tab (sortOrder 0), ahead of Backlog and QA.',
  acceptanceCriteria: 'Given I am logged in as admin\nWhen I click the "Operating Model" tab under Platform Lifecycle Management\nThen I see the EIDOS object taxonomy dashboard, not the Config panel fallback.',
  status: 'completed',
  priority: 'p2',
  hoursClaude: null,
  hoursBetsy: null,
  tags: ['plm', 'eidos', 'operating-model', 'codex-built', 'non-claude-ai-tool'],
  externalRef: 'Codex sessions 2026-07-05/can-you-2 + 2026-07-07/are-y · SaltTide_Operating_Model_Merge_Handover.md',
  dataSource: 'non_claude_tool_file_mtime_estimate',
  deployedGithub: true,
  deployedRender: true,
  deployedNetlify: true,
};

async function main() {
  const cookie = await login();
  const res = await fetch(`${BASE}/api/backlog/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(ITEM),
  });
  if (!res.ok) { console.error(`FAILED: ${res.status} ${await res.text()}`); process.exit(1); }
  const { id } = await res.json();
  console.log(`Created backlog item ${id}: ${ITEM.title}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
