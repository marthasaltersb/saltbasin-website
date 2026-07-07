// Corrects the hoursBetsy/hoursClaude on the 9 items created by
// add-v018-backlog-items.mjs, replacing hand-estimated guesses with values
// derived from real JSONL session-log burst analysis.
//
// Method: for each of the two real sessions these items map to, real active
// hours were computed via burst analysis (consecutive events grouped into a
// burst if the gap between them is <= 15 min; idle gaps between visits are
// excluded). Betsy's hours = active hours × an oversight-intensity weight
// (a new formalization of the previously-qualitative "turn density weight"
// language in contributionMethodology.js: critical=0.90, high=0.65,
// moderate=0.40, low=0.20 — both real sessions measured "low", ~8-17
// turns/hr). Claude's hours = full active hours (assistant turns dominate
// every burst). The item-level split below apportions each session's real
// total across its items, proportional to the original hour-estimate ratios
// (preserving relative complexity weighting, correcting only the absolute
// scale).
//
// Session 551b4cbf-3e51-4315-a936-732f68aa348d: 3.93 real active hours,
//   turn density 16.5/hr (low) → betsyHours = 3.93 * 0.20 = 0.79
// Session e3c9236b-fa3f-40be-8418-a807e0c3a21a: 2.82 real active hours,
//   turn density 7.8/hr (low) → betsyHours = 2.82 * 0.20 = 0.56

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

const CORRECTION_NOTE = 'Hours corrected against real JSONL session-log burst analysis (see CHANGELOG.md / contributionMethodology.js) — replaces an initial hand estimate.';

const CORRECTIONS = [
  // Session 551b4cbf (3.93 real active hrs, 0.79 real Betsy hrs)
  { id: 102, hoursClaude: 0.46, hoursBetsy: 0.13, sessionRef: '551b4cbf-3e51-4315-a936-732f68aa348d' },
  { id: 103, hoursClaude: 1.16, hoursBetsy: 0.22, sessionRef: '551b4cbf-3e51-4315-a936-732f68aa348d' },
  { id: 104, hoursClaude: 2.31, hoursBetsy: 0.44, sessionRef: '551b4cbf-3e51-4315-a936-732f68aa348d' },
  // Session e3c9236b (2.82 real active hrs, 0.56 real Betsy hrs)
  { id: 105, hoursClaude: 0.37, hoursBetsy: 0.09, sessionRef: 'e3c9236b-fa3f-40be-8418-a807e0c3a21a' },
  { id: 106, hoursClaude: 0.49, hoursBetsy: 0.09, sessionRef: 'e3c9236b-fa3f-40be-8418-a807e0c3a21a' },
  { id: 107, hoursClaude: 0.61, hoursBetsy: 0.14, sessionRef: 'e3c9236b-fa3f-40be-8418-a807e0c3a21a' },
  { id: 108, hoursClaude: 0.61, hoursBetsy: 0.09, sessionRef: 'e3c9236b-fa3f-40be-8418-a807e0c3a21a' },
  { id: 109, hoursClaude: 0.37, hoursBetsy: 0.05, sessionRef: 'e3c9236b-fa3f-40be-8418-a807e0c3a21a' },
  { id: 110, hoursClaude: 0.37, hoursBetsy: 0.09, sessionRef: 'e3c9236b-fa3f-40be-8418-a807e0c3a21a' },
];

async function main() {
  const cookie = await login();
  console.log('Logged in.\n');
  for (const { id, hoursClaude, hoursBetsy, sessionRef } of CORRECTIONS) {
    const res = await fetch(`${BASE}/api/backlog/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ hoursClaude, hoursBetsy }),
    });
    if (!res.ok) { console.error(`  FAILED [${id}]: ${res.status} ${await res.text()}`); continue; }
    console.log(`  CORRECTED [${id}]: hoursClaude=${hoursClaude}, hoursBetsy=${hoursBetsy} (session ${sessionRef})`);
  }
  console.log(`\n${CORRECTION_NOTE}\nDone. Re-check /output/build-summary for updated totals.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
