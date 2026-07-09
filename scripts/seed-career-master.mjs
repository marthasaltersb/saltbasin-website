// One-off: seed the Career Master tables (career_jobs/skills/tools/
// engagements/domains) against a running dev API server. Idempotent —
// POST /api/career/seed only inserts if the tables are empty.
//
// Usage: node scripts/seed-career-master.mjs
// Requires in .env: ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD. Optional
// PUBLIC_BASE_URL (defaults to the local dev API).

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;
if (!PASS || !EMAIL) throw new Error('ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD required in .env');

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  return res.headers.get('set-cookie').split(';')[0];
}

const cookie = await login();
const seedRes = await fetch(`${BASE}/api/career/seed`, { method: 'POST', headers: { Cookie: cookie } });
console.log('seed:', seedRes.status, await seedRes.json());

const masterRes = await fetch(`${BASE}/api/career/master`);
const master = await masterRes.json();
console.log('master counts:', {
  jobs: master.jobs?.length,
  skills: master.skills?.length,
  tools: master.tools?.length,
  engagements: master.engagements?.length,
  domains: master.domains?.length,
});
console.log('redaction check — clientNameReal present anywhere?', master.engagements?.some((e) => 'clientNameReal' in e));
