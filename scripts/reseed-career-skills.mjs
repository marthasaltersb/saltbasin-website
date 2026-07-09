// One-off: replace the live career_skills rows with the updated skill
// inventory in server/data/career/seed.js (deletes existing rows, inserts
// the new set). Run once after updating the skills array; safe to re-run
// (it always fully replaces, unlike POST /api/career/seed which only
// inserts into empty tables).
//
// Usage: node scripts/reseed-career-skills.mjs
// Requires in .env: ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD. Optional
// PUBLIC_BASE_URL (defaults to the local dev API).

import 'dotenv/config';
import { careerMasterSeed } from '../server/data/career/seed.js';

const BASE  = process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:3001';
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

const existing = await (await fetch(`${BASE}/api/career/skills`, { headers: { Cookie: cookie } })).json();
console.log(`deleting ${existing.items.length} existing skills…`);
for (const item of existing.items) {
  await fetch(`${BASE}/api/career/skills/${item.id}`, { method: 'DELETE', headers: { Cookie: cookie } });
}

const { skills } = careerMasterSeed();
console.log(`inserting ${skills.length} new skills…`);
for (let i = 0; i < skills.length; i++) {
  const s = skills[i];
  const res = await fetch(`${BASE}/api/career/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ ...s, orderIndex: i }),
  });
  if (!res.ok) throw new Error(`insert failed for "${s.skill}": ${res.status} ${await res.text()}`);
}

const check = await (await fetch(`${BASE}/api/career/master`)).json();
console.log('final skill count:', check.skills.length);
