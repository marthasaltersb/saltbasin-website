// Credits session 50a9edca — previously zero hours anywhere, despite
// producing three real spec documents. Real burst data: 1.12 active
// hours (Claude, full session), 0.56hr Strategic Direction (Betsy,
// burst-level content classification — the session is a single burst,
// entirely direction-setting/spec-defining turns, weight 0.5 per the
// existing turn-density band since density was 8.9/hr "low").

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
  title: 'Functional/Technical design spec documents + mapping',
  summary: 'FUNCTIONAL_DESIGN_SPEC.md, TECHNICAL_DESIGN_SPEC.md, and FUNCTIONAL_TECHNICAL_MAPPING.md — full scenario, rule, requirement, and end-user-flow documentation for built functionality, plus the architectural mapping between functional and technical design.',
  userStory: 'As Betsy, I want the platform\'s functional and technical design fully documented and mapped, so the build has a real specification trail instead of only living in commit history and my own memory.',
  requirementDetail: 'Real session (50a9edca-f76e-4aad-aeb1-702e16c9b604, 2026-07-04T00:55-02:02) never mapped to a backlog item at creation time — found and credited retroactively 2026-07-07 while pricing Strategic Direction / Domain Authoring activities. 1.12 real active hours (JSONL burst analysis), single burst, 10 real human turns at 8.9/hr density ("low" band). Content classification: entirely Strategic Direction (specification/architecture-defining turns), not Active Supervision — this session\'s whole purpose was direction-setting, not build oversight.',
  status: 'completed',
  priority: 'p2',
  hoursClaude: 1.12,
  hoursBetsy: 0.56,
  hoursStrategicDirection: 0.56,
  hoursDomainAuthoring: 0,
  costUsdClaude: Math.round(1.12 * 115 * 100) / 100,
  traditionalCostUsd: Math.round((1.12 + 0.56) * 175 * 100) / 100,
  activitiesClaude: Math.max(1, Math.ceil(1.12 * 6)),
  activitiesBetsy: Math.max(1, Math.ceil(0.56 * 3)),
  tags: ['spec', 'documentation', 'strategic-direction', 'retroactively-credited'],
  externalRef: 'session 50a9edca-f76e-4aad-aeb1-702e16c9b604',
  dataSource: 'measured_burst_analysis',
  feeType: 'ad_hoc_overage', // falls in the 2026-07-04 window, adjacent to that day's overage purchase
  deployedGithub: true,
  deployedRender: false,
  deployedNetlify: false,
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
