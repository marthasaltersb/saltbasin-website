// 1. Logs in as admin to the live site
// 2. Patches the published config:
//    - email.fromAddress: betsy@saltbasin.net  → betsysalter@saltbasin.net
//    - email.replyTo:     betsy@saltbasin.net  → betsysalter@saltbasin.net
// 3. Publishes the config
// 4. Fires a test email via POST /api/config/test-email
// 5. Reports the Brevo message ID (or any error)
//
// Idempotent on step 2 — if the addresses are already correct, just runs the test.

import 'dotenv/config';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;

if (!PASS)  throw new Error('ADMIN_INITIAL_PASSWORD missing from .env');
if (!EMAIL) throw new Error('ADMIN_EMAIL missing from .env');

const NEW_FROM = 'betsysalter@saltbasin.net';

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const cookie = res.headers.get('set-cookie');
  if (!cookie) throw new Error('No session cookie');
  return cookie.split(';')[0];
}

async function getDraftConfig(cookie) {
  const res = await fetch(`${BASE}/api/config/draft`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`getDraftConfig failed: ${res.status}`);
  return res.json();
}

async function putDraftConfig(cookie, config) {
  const res = await fetch(`${BASE}/api/config/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`putDraftConfig failed: ${res.status} ${await res.text()}`);
}

async function publish(cookie) {
  const res = await fetch(`${BASE}/api/site/publish`, {
    method: 'POST', headers: { Cookie: cookie },
  });
  if (!res.ok) throw new Error(`site publish failed: ${res.status}`);
}

async function testEmail(cookie) {
  const res = await fetch(`${BASE}/api/config/test-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      to: EMAIL,
      subject: 'Salt Basin · Brevo live test',
      body: `Test from the deploy pipeline at ${new Date().toLocaleString()}. If you got this, Brevo + Render + the platform are all talking. — Betsy's CMS`,
    }),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

(async () => {
  console.log(`→ ${BASE}`);
  const cookie = await login();
  console.log('✓ logged in');

  const cfg = await getDraftConfig(cookie);
  cfg.email = cfg.email || {};
  const before = { from: cfg.email.fromAddress, replyTo: cfg.email.replyTo };

  let changed = false;
  if (cfg.email.fromAddress !== NEW_FROM) { cfg.email.fromAddress = NEW_FROM; changed = true; }
  if (cfg.email.replyTo     !== NEW_FROM) { cfg.email.replyTo     = NEW_FROM; changed = true; }
  cfg.email.fromName = cfg.email.fromName || 'Betsy at Salt Basin';

  if (changed) {
    await putDraftConfig(cookie, cfg);
    console.log(`  · fromAddress: ${before.from} → ${NEW_FROM}`);
    console.log(`  · replyTo:     ${before.replyTo} → ${NEW_FROM}`);
    // Publish — the site/publish endpoint promotes the config_state too.
    await publish(cookie);
    console.log('✓ config published');
  } else {
    console.log('· config already correct, no changes');
  }

  console.log('→ Sending test email via /api/config/test-email');
  const result = await testEmail(cookie);
  console.log('  status:', result.status);
  console.log('  body:  ', JSON.stringify(result.body, null, 2));

  if (result.body.ok) {
    if (result.body.stub) {
      console.log('');
      console.log('⚠️  Response says "stub" — that means BREVO_API_KEY is not in Render env yet,');
      console.log('   or Render is still picking it up. Wait 30s and re-run.');
    } else {
      console.log('');
      console.log('✓ Brevo accepted the message. Check your Zoho inbox.');
    }
  } else {
    console.log('');
    console.log('✗ Send failed. See body above for details.');
  }
})().catch((e) => {
  console.error('✗ Script failed:', e.message);
  process.exit(1);
});
