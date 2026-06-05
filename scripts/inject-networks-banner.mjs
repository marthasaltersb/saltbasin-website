// One-shot: insert the new netWorksBanner section into the live Salt Basin
// home page (draft + published), directly after the aboutIntro section.
// Idempotent — if the section already exists, the script is a no-op.
//
// Usage:
//   node scripts/inject-networks-banner.mjs
//
// Reads admin creds from .env (ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD), logs in
// to the live API (PUBLIC_BASE_URL or default), patches site_state via
// PUT /api/site/draft, then POST /api/site/publish.

import 'dotenv/config';

const BASE = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL || 'betsy@saltbasin.net';
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;

if (!PASS) {
  console.error('ADMIN_INITIAL_PASSWORD not in .env');
  process.exit(1);
}

const BANNER_SECTION = {
  id: 'netWorksBanner',
  type: 'netWorksBanner',
  name: 'Net Works Banner',
  status: 'live',
  bg: 'cream',
  fields: {
    eyebrow: 'The Network',
    heading: 'Salt Basin Net Works',
    intro:
      'A growing roster of senior operators building from the same shoreline. Each card links to an operator profile — opt-in only.',
  },
};

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const cookie = res.headers.get('set-cookie');
  if (!cookie) throw new Error('No session cookie returned');
  return cookie.split(';')[0];
}

async function getDraft(cookie) {
  const res = await fetch(`${BASE}/api/site/draft`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`getDraft failed: ${res.status}`);
  return res.json();
}

async function putDraft(cookie, site) {
  const res = await fetch(`${BASE}/api/site/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(site),
  });
  if (!res.ok) throw new Error(`putDraft failed: ${res.status} ${await res.text()}`);
}

async function publish(cookie) {
  const res = await fetch(`${BASE}/api/site/publish`, {
    method: 'POST', headers: { Cookie: cookie },
  });
  if (!res.ok) throw new Error(`publish failed: ${res.status}`);
}

function injectBanner(site) {
  const home = site.pages?.home;
  if (!home) throw new Error('No home page in site state');
  const sections = home.sections || [];
  if (sections.some((s) => s.type === 'netWorksBanner')) {
    return { changed: false, site };
  }
  const aboutIdx = sections.findIndex((s) => s.type === 'aboutIntro');
  const insertAt = aboutIdx >= 0 ? aboutIdx + 1 : 0;
  home.sections = [
    ...sections.slice(0, insertAt),
    BANNER_SECTION,
    ...sections.slice(insertAt),
  ];
  return { changed: true, site };
}

(async () => {
  console.log(`→ ${BASE}`);
  const cookie = await login();
  console.log('✓ logged in');
  const draft = await getDraft(cookie);
  const { changed, site } = injectBanner(draft);
  if (!changed) {
    console.log('· Net Works banner already present — nothing to do');
    return;
  }
  await putDraft(cookie, site);
  console.log('✓ patched draft');
  await publish(cookie);
  console.log('✓ published — banner now live on home page');
})();
