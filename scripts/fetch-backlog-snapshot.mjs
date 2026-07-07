// One-off: dump the full backlog snapshot (id, externalRef, title, createdAt,
// hoursClaude, hoursBetsy, status) to a local JSON file for offline analysis.
// Read-only — no writes. Part of the ~101-item hours reconciliation
// (see HANDOVER_backlog_hours_reconciliation.md).

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

async function main() {
  const cookie = await login();
  const res = await fetch(`${BASE}/api/backlog/`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`fetch backlog failed: ${res.status}`);
  const data = await res.json();
  const out = {
    fetchedAt: new Date().toISOString(),
    itemCount: data.items.length,
    items: data.items.map((i) => ({
      id: i.id,
      title: i.title,
      externalRef: i.externalRef,
      status: i.status,
      createdAt: i.createdAt,
      createdAtIso: new Date(i.createdAt).toISOString(),
      hoursClaude: i.hoursClaude,
      hoursBetsy: i.hoursBetsy,
      capabilityId: i.capabilityId,
    })),
  };
  fs.writeFileSync('backlog-snapshot.json', JSON.stringify(out, null, 2));
  console.log(`Wrote backlog-snapshot.json — ${data.items.length} items`);
}

main().catch((e) => { console.error(e); process.exit(1); });
