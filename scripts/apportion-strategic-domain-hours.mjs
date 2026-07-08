// Apportions each session's burst-level Strategic Direction / Domain
// Authoring / Active Supervision classification (see
// extract-classify-turns.mjs, turn-classification.json) across the
// backlog items that map to that session — same method already used for
// hoursBetsy: equal split for items 81-91/92-97 (never had an original
// per-item estimate to weight by), proportional to current hoursBetsy
// share for 102-104/105-110 (preserves relative complexity weighting
// from the original hand estimates).
//
// This is a pure relabeling of hoursBetsy already on production — each
// item's hoursStrategicDirection + hoursDomainAuthoring + implied
// active-supervision-remainder sums back to its existing hoursBetsy, not
// additional hours.

import 'dotenv/config';
import fs from 'fs';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;

const classification = JSON.parse(fs.readFileSync('turn-classification.json', 'utf8'));

const GROUPS = [
  { session: '97254a80', ids: [81,82,83,84,85,86,87,88,89,90,91], mode: 'equal' },
  { session: 'de055505', ids: [92,93,94,95,96,97], mode: 'equal' },
  { session: '551b4cbf', ids: [102,103,104], mode: 'proportional' },
  { session: 'e3c9236b', ids: [105,106,107,108,109,110], mode: 'proportional' },
];

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  return res.headers.get('set-cookie').split(';')[0];
}

async function patchItem(cookie, id, hoursStrategicDirection, hoursDomainAuthoring) {
  const res = await fetch(`${BASE}/api/backlog/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ hoursStrategicDirection, hoursDomainAuthoring }),
  });
  if (!res.ok) { console.error(`  FAILED [${id}]: ${res.status} ${await res.text()}`); return false; }
  return true;
}

async function main() {
  const cookie = await login();
  const r = await fetch(`${BASE}/api/backlog/`, { headers: { Cookie: cookie } });
  const { items } = await r.json();
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  let patched = 0;
  for (const g of GROUPS) {
    const c = classification[g.session];
    if (!c) { console.warn('no classification for', g.session); continue; }
    const currentSum = g.ids.reduce((s, id) => s + (byId[id]?.hoursBetsy || 0), 0);
    for (const id of g.ids) {
      const it = byId[id];
      const share = g.mode === 'equal' ? 1 / g.ids.length : (it.hoursBetsy || 0) / currentSum;
      const sd = Math.round(c.strategic_direction * share * 100) / 100;
      const da = Math.round(c.domain_authoring * share * 100) / 100;
      const ok = await patchItem(cookie, id, sd, da);
      if (ok) { patched++; console.log(`  [${id}] strategicDirection=${sd} domainAuthoring=${da} (hoursBetsy=${it.hoursBetsy})`); }
    }
  }
  console.log(`\nDone. Patched ${patched} items.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
