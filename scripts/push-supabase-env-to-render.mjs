// One-time script: push the three Supabase env vars to your Render service
// via the Render REST API. Reads everything from .env on your local machine
// — no secrets ever leave this folder.
//
// Usage:
//   node scripts/push-supabase-env-to-render.mjs
//
// Requires these in .env (in addition to the Supabase vars):
//   RENDER_API_KEY        — created at dashboard.render.com → Account → API Keys
//   RENDER_SERVICE_ID     — the "srv-..." id from your service's dashboard URL
//
// The script:
//   1. Pulls your current Render env vars
//   2. Merges in (or replaces) SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
//   3. PUTs the merged list back to Render
//   4. Render auto-triggers a new deploy with the new env in place

import 'dotenv/config';

const REQUIRED = [
  'RENDER_API_KEY',
  'RENDER_SERVICE_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
];

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ Missing env vars in .env: ${missing.join(', ')}`);
  process.exit(1);
}

const apiKey = process.env.RENDER_API_KEY;
const serviceId = process.env.RENDER_SERVICE_ID;

// Vars we're pushing to Render.
const VARS_TO_PUSH = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'];

const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const baseUrl = `https://api.render.com/v1/services/${serviceId}/env-vars`;

// ── 1. Fetch current env vars on Render ──
console.log('• Fetching current Render env vars…');
const getRes = await fetch(baseUrl, { headers });
if (!getRes.ok) {
  console.error(`✗ Failed to fetch env vars: ${getRes.status} ${getRes.statusText}`);
  console.error(await getRes.text());
  process.exit(1);
}
const currentRaw = await getRes.json();
// Render returns: [{ envVar: { key, value } }, …]
const current = currentRaw.map((item) => ({
  key: item.envVar.key,
  value: item.envVar.value,
}));
console.log(`  found ${current.length} existing var(s)`);

// ── 2. Build merged list ──
const replaceKeys = new Set(VARS_TO_PUSH);
const merged = [
  ...current.filter((v) => !replaceKeys.has(v.key)),
  ...VARS_TO_PUSH.map((k) => ({ key: k, value: process.env[k] })),
];
const adding = VARS_TO_PUSH.filter((k) => !current.find((v) => v.key === k));
const updating = VARS_TO_PUSH.filter((k) => current.find((v) => v.key === k));
console.log(`  adding: ${adding.join(', ') || '(none)'}`);
console.log(`  updating: ${updating.join(', ') || '(none)'}`);

// ── 3. PUT merged list ──
console.log('• Pushing to Render…');
const putRes = await fetch(baseUrl, {
  method: 'PUT',
  headers,
  body: JSON.stringify(merged),
});
if (!putRes.ok) {
  console.error(`✗ Failed to update env vars: ${putRes.status} ${putRes.statusText}`);
  console.error(await putRes.text());
  process.exit(1);
}

console.log('✓ Render env vars updated.');
console.log('  Render will auto-trigger a new deploy in ~10 seconds.');
console.log('  Watch progress at https://dashboard.render.com');
