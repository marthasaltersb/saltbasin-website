// Cost/activity/fee-type reconciliation — follow-up to
// reconcile-backlog-hours-full.mjs (v0.18.2). That pass corrected
// hoursClaude/hoursBetsy; this pass recomputes every field DERIVED from
// hours (which had gone stale/inconsistent) and populates the v0.17
// contribution-tracking columns that existed in the schema but were never
// wired into the API (est_*/actual_*/data_source, now exposed via
// backlog.js rowToItem/ITEM_FIELD_MAP).
//
// Formulas (all tied to documented RATE_CONFIGS_2026, replacing the old
// undocumented $0.02/min and $6.25/min legacy formulas from seed.js):
//   costUsdClaude      = hoursClaude * $115/hr  (claude_quality_adjusted)
//   traditionalCostUsd = (hoursClaude + hoursBetsy) * $175/hr (benchmark_onshore_senior)
//   activitiesClaude   = max(1, ceil(hoursClaude * 6))  -- same formula already
//   activitiesBetsy    = max(1, ceil(hoursBetsy * 3))   -- dormant in db.js migration
//
// est_claude_hours / est_betsy_hours: the ORIGINAL pre-correction estimate,
// recovered from source (seed.js timeMinutes*workSplitClaude% for items
// 1-47, scripts/add-v018-backlog-items.mjs literals for 102-110). Items
// 81-101 were never estimated at all (null - genuinely no prior estimate,
// not a zero). Preserves Loop 1 (Estimation Accuracy) variance instead of
// destroying the original estimate when hours got corrected.
//
// fee_type: classified from real Anthropic billing receipts (Gmail search,
// 2026-07-07) against each item's build-session window — 'ad_hoc_overage'
// where a "Prepaid extra usage" purchase fell inside/adjacent to the
// session, 'subscription_included' otherwise. Purchase-date-level
// precision, not per-token metering — disclosed as a gap.

import 'dotenv/config';
import fs from 'fs';

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

const plan = JSON.parse(fs.readFileSync('cost-reconciliation-plan.json', 'utf8'));

async function main() {
  const cookie = await login();
  console.log('Logged in.\n');

  const r = await fetch(`${BASE}/api/backlog/`, { headers: { Cookie: cookie } });
  const { items } = await r.json();
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  let patched = 0, skipped = 0;
  for (const p of plan) {
    const it = byId[p.id];
    if (!it) { console.warn(`  MISSING item ${p.id}`); continue; }

    const hoursClaude = it.hoursClaude ?? 0;
    const hoursBetsy = it.hoursBetsy ?? 0;
    const isPending = it.status === 'pending';

    const body = {};
    if (isPending) {
      // Not yet built — cost/activities should be 0/null, not stale.
      body.costUsdClaude = 0;
      body.traditionalCostUsd = 0;
      body.activitiesClaude = null;
      body.activitiesBetsy = null;
    } else {
      body.costUsdClaude = Math.round(hoursClaude * 115 * 100) / 100;
      body.traditionalCostUsd = Math.round((hoursClaude + hoursBetsy) * 175 * 100) / 100;
      body.activitiesClaude = Math.max(1, Math.ceil(hoursClaude * 6));
      body.activitiesBetsy = Math.max(1, Math.ceil(hoursBetsy * 3));
    }
    body.estClaudeHours = p.estClaude;
    body.estBetsyHours = p.estBetsy;
    body.actualClaudeHours = isPending ? null : hoursClaude;
    body.actualBetsyHours = isPending ? null : hoursBetsy;
    body.dataSource = p.dataSource;
    body.feeType = p.feeType;

    const res = await fetch(`${BASE}/api/backlog/items/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(body),
    });
    if (!res.ok) { console.error(`  FAILED [${p.id}]: ${res.status} ${await res.text()}`); continue; }
    patched++;
    console.log(`  [${p.id}] cost=$${body.costUsdClaude} trad=$${body.traditionalCostUsd} src=${p.dataSource || 'n/a'} fee=${p.feeType || 'n/a'}`);
  }
  console.log(`\nDone. Patched ${patched} items.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
