// Full retroactive hours reconciliation — closes out
// HANDOVER_backlog_hours_reconciliation.md.
//
// Three evidence tiers, each labeled distinctly in the correction note:
//
// TIER 1 — real JSONL burst analysis (primary methodology). Items 81-91
//   (session 97254a80-feaa-4c85-80fb-f0938a553251, 5.47 active hrs, density
//   12.3/hr low -> weight 0.20) and items 92-97 (session
//   de055505-dc52-499d-978f-44e5e9323502, 5.05 active hrs, density 13.1/hr
//   low -> weight 0.20). Both sets had null hours (never estimated) and are
//   split equally across items sharing a session, since no prior estimate
//   ratio exists to preserve.
//
// TIER 2 — coarse turn-count estimate (secondary, lower-confidence tier).
//   Items 1-47's real build session ("Website admin panel and
//   configurability", 2026-06-03T11:18 -> 06-07T03:40, handover-os cwd,
//   confirmed via Claude Desktop's session index) has completedTurns=120
//   but transcriptUnavailable=true — no JSONL survives, so no burst/density
//   data exists. Active hours derived as completedTurns / platform-average
//   turn density (12.1/hr) = 9.92 hrs; Betsy hours = 9.92 * 0.20 (low
//   weight) = 1.98 hrs. This total is apportioned across the 41 non-epic
//   items in that batch, proportional to each item's ORIGINAL hand-estimate
//   ratio (preserving relative complexity weighting, correcting only the
//   absolute scale — same method as the original 9-item correction).
//
// MERGE — items #1, #6, #10 are "epic" entries whose externalRef task
//   range (e.g. "tasks #4-#12") is fully re-claimed by later per-task items
//   (#2, #3, #27 / #7, #8, #9, #18, #19 / #11) that already carry their own
//   hour estimates. Both were being summed in Build Summary. Epics are
//   retired to 0/0; detail items keep their (now Tier-2-corrected) hours.
//
// Untouched: items 37-39, 48-80, 98-101 (status=pending, correctly 0/null
// since no work has been done yet); items 102-110 (corrected 2026-07-07).

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

// ---- Tier 1: real burst-analysis sessions ----
const TIER1_SESSION_A = { hoursClaude: 0.50, hoursBetsy: 0.10, sessionRef: '97254a80-feaa-4c85-80fb-f0938a553251', ids: [81,82,83,84,85,86,87,88,89,90,91] };
const TIER1_SESSION_B = { hoursClaude: 0.84, hoursBetsy: 0.17, sessionRef: 'de055505-dc52-499d-978f-44e5e9323502', ids: [92,93,94,95,96,97] };

// ---- Merge: retire epic items ----
const EPICS_TO_ZERO = [1, 6, 10];

// ---- Tier 2: coarse-derived corrections for the 41 non-epic items in 1-47 ----
const TIER2_CORRECTIONS = {
  2: [0.19,0.04], 3: [0.64,0.12], 4: [0.24,0.09], 5: [0.38,0.07],
  7: [0.13,0], 8: [0.10,0], 9: [0.10,0],
  11: [0.40,0], 12: [0.20,0], 13: [0.13,0], 14: [0.08,0.43], 15: [0.19,0.04],
  16: [0.20,0], 17: [0.13,0], 18: [0.27,0], 19: [0.13,0], 20: [0.36,0.14],
  21: [0.76,0.14], 22: [0.60,0.24], 23: [0.20,0], 24: [0.40,0], 25: [0.27,0],
  26: [0.33,0], 27: [0.76,0.14], 28: [0.20,0], 29: [0.25,0.05], 30: [0.19,0.04],
  31: [0.20,0], 32: [0.07,0], 33: [0.13,0], 34: [0.13,0], 35: [0.13,0], 36: [0.54,0],
  40: [0.20,0.09], 41: [0.13,0.05], 42: [0.20,0.12], 43: [0.10,0.05], 44: [0.07,0.05],
  45: [0.04,0.02], 46: [0.03,0.02], 47: [0.07,0.05],
};

const CORRECTION_NOTES = {
  tier1: 'Hours corrected against real JSONL session-log burst analysis (Tier 1 — primary methodology). Never previously estimated; split equally across items sharing a session burst (no prior ratio to preserve). See contributionMethodology.js RETROACTIVE_SESSION_ANALYSIS.',
  tier2: 'Hours corrected via coarse turn-count estimate (Tier 2 — secondary/lower-confidence). Real session confirmed via Claude Desktop session index (completedTurns=120, 2026-06-03->06-07) but transcriptUnavailable=true, so no burst/density data survives. Active hours derived as completedTurns / platform-average density (12.1/hr); apportioned proportional to original hand-estimate ratios. See contributionMethodology.js RETROACTIVE_SESSION_ANALYSIS.knownGaps.',
  merge: 'Retired: this item\'s externalRef task range is fully re-claimed by later per-task items which carry their own corrected hour estimates. Was being double-counted in Build Summary totals alongside its sub-items.',
};

async function patchItem(cookie, id, hoursClaude, hoursBetsy) {
  const res = await fetch(`${BASE}/api/backlog/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ hoursClaude, hoursBetsy }),
  });
  if (!res.ok) { console.error(`  FAILED [${id}]: ${res.status} ${await res.text()}`); return false; }
  return true;
}

async function main() {
  const cookie = await login();
  console.log('Logged in.\n');

  console.log('=== Tier 1: session', TIER1_SESSION_A.sessionRef, '===');
  for (const id of TIER1_SESSION_A.ids) {
    const ok = await patchItem(cookie, id, TIER1_SESSION_A.hoursClaude, TIER1_SESSION_A.hoursBetsy);
    if (ok) console.log(`  [${id}] -> hoursClaude=${TIER1_SESSION_A.hoursClaude}, hoursBetsy=${TIER1_SESSION_A.hoursBetsy}`);
  }

  console.log('\n=== Tier 1: session', TIER1_SESSION_B.sessionRef, '===');
  for (const id of TIER1_SESSION_B.ids) {
    const ok = await patchItem(cookie, id, TIER1_SESSION_B.hoursClaude, TIER1_SESSION_B.hoursBetsy);
    if (ok) console.log(`  [${id}] -> hoursClaude=${TIER1_SESSION_B.hoursClaude}, hoursBetsy=${TIER1_SESSION_B.hoursBetsy}`);
  }

  console.log('\n=== Merge: retiring epic items ===');
  for (const id of EPICS_TO_ZERO) {
    const ok = await patchItem(cookie, id, 0, 0);
    if (ok) console.log(`  [${id}] -> hoursClaude=0, hoursBetsy=0 (retired)`);
  }

  console.log('\n=== Tier 2: coarse-derived corrections (items 1-47 batch) ===');
  for (const [id, [hc, hb]] of Object.entries(TIER2_CORRECTIONS)) {
    const ok = await patchItem(cookie, Number(id), hc, hb);
    if (ok) console.log(`  [${id}] -> hoursClaude=${hc}, hoursBetsy=${hb}`);
  }

  console.log('\nDone. Re-check /api/backlog/summary for updated totals.');
}

main().catch((e) => { console.error(e); process.exit(1); });
