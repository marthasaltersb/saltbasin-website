// Push BREVO_API_KEY (and ensure ADMIN_EMAIL) to Render env vars.
//
// Reads BREVO_API_KEY + ADMIN_EMAIL from local .env, fetches Render's full
// env-var list, merges these two in, then PUTs the whole list back so we
// don't drop anything else. Render auto-redeploys on env-var change.
//
// Usage: node scripts/push-brevo-key-to-render.mjs

import 'dotenv/config';

const RENDER_K  = process.env.RENDER_API_KEY;
const RENDER_SV = process.env.RENDER_SERVICE_ID;
const BREVO_KEY = process.env.BREVO_API_KEY;
const ADMIN_EM  = process.env.ADMIN_EMAIL;

if (!RENDER_K)  throw new Error('RENDER_API_KEY missing from .env');
if (!RENDER_SV) throw new Error('RENDER_SERVICE_ID missing from .env');
if (!BREVO_KEY) throw new Error('BREVO_API_KEY missing from .env');
if (!ADMIN_EM)  throw new Error('ADMIN_EMAIL missing from .env');

console.log('→ Fetching existing Render env vars');
const existingRes = await fetch(
  `https://api.render.com/v1/services/${RENDER_SV}/env-vars`,
  { headers: { Authorization: `Bearer ${RENDER_K}` } }
);
if (!existingRes.ok) {
  throw new Error(`Render GET env-vars failed: ${existingRes.status} ${await existingRes.text()}`);
}
const existing = await existingRes.json();
const map = new Map();
for (const item of existing) {
  const ev = item.envVar || item;
  if (ev?.key) map.set(ev.key, ev.value);
}

const before = {
  hasBrevo: map.has('BREVO_API_KEY'),
  adminEmail: map.get('ADMIN_EMAIL'),
};

map.set('BREVO_API_KEY', BREVO_KEY);
map.set('ADMIN_EMAIL', ADMIN_EM);

console.log('→ Pushing updated env vars to Render');
const body = [...map.entries()].map(([key, value]) => ({ key, value }));
const putRes = await fetch(
  `https://api.render.com/v1/services/${RENDER_SV}/env-vars`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${RENDER_K}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
);
if (!putRes.ok) {
  throw new Error(`Render PUT env-vars failed: ${putRes.status} ${await putRes.text()}`);
}

console.log('✓ Render env updated');
console.log(`  BREVO_API_KEY: ${before.hasBrevo ? 'replaced existing' : 'newly added'}`);
console.log(`  ADMIN_EMAIL:   ${before.adminEmail === ADMIN_EM ? 'unchanged' : `was ${before.adminEmail || 'unset'}, now ${ADMIN_EM}`}`);
console.log('');
console.log('Render typically auto-redeploys on env-var change. Watch:');
console.log(`  https://dashboard.render.com/web/${RENDER_SV}/deploys`);
