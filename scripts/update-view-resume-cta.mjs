// One-off: repoint the homepage "View Resume" CTA from /consulting/founder
// to the new portfolio hub (/output/portfolio), on the live persisted site
// (defaultSite.js only affects fresh installs, not an already-seeded DB).
//
// Usage: node scripts/update-view-resume-cta.mjs
// Requires in .env: ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD. Optional
// PUBLIC_BASE_URL (defaults to the local dev API).

import 'dotenv/config';

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

const draft = await (await fetch(`${BASE}/api/site/draft`, { headers: { Cookie: cookie } })).json();
const home = draft.pages.home;
const aboutIntro = home.sections.find((s) => s.type === 'aboutIntro');
if (!aboutIntro) throw new Error('aboutIntro section not found on home page');

const before = aboutIntro.fields.cta1Link;
aboutIntro.fields.cta1Link = '/output/portfolio';
console.log(`cta1Link: "${before}" -> "/output/portfolio"`);

const saveRes = await fetch(`${BASE}/api/site/draft`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookie },
  body: JSON.stringify(draft),
});
if (!saveRes.ok) throw new Error(`save draft failed: ${saveRes.status} ${await saveRes.text()}`);

const pubRes = await fetch(`${BASE}/api/site/publish`, { method: 'POST', headers: { Cookie: cookie } });
if (!pubRes.ok) throw new Error(`publish failed: ${pubRes.status} ${await pubRes.text()}`);

console.log('saved + published.');
