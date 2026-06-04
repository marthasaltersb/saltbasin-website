// Force a new Render deploy via the API. Useful when env vars changed but
// Render's auto-deploy didn't fire, or after a manual config change.
//
// Reads RENDER_API_KEY + RENDER_SERVICE_ID from .env. No secrets leave the
// machine — same pattern as push-supabase-env-to-render.mjs.
import 'dotenv/config';

const apiKey = process.env.RENDER_API_KEY;
const serviceId = process.env.RENDER_SERVICE_ID;
if (!apiKey || !serviceId) {
  console.error('✗ RENDER_API_KEY and RENDER_SERVICE_ID must be set in .env');
  process.exit(1);
}

const url = `https://api.render.com/v1/services/${serviceId}/deploys`;
const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ clearCache: 'do_not_clear' }),
});

if (!res.ok) {
  console.error(`✗ Failed to trigger deploy: ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

const deploy = await res.json();
console.log('✓ Deploy queued.');
console.log(`  deploy id: ${deploy.id}`);
console.log(`  status: ${deploy.status}`);
console.log('  Watch progress at https://dashboard.render.com');
