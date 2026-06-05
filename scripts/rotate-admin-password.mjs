// Rotate the admin login password.
//
// Generates a strong random password, then:
//   1. Updates users.password_hash for the admin row in Supabase
//   2. Rewrites ADMIN_INITIAL_PASSWORD in local .env
//   3. Pushes ADMIN_INITIAL_PASSWORD to Render env vars (so the running
//      server, and any future reseed, sees the same value)
//   4. Writes the new password to .admin-password-rotated-<date>.txt
//      (gitignored) so the user can copy it once and delete the file.
//
// The password is NEVER printed to stdout — it only exists in .env, Render,
// and the one-shot local file. Run:
//
//   node scripts/rotate-admin-password.mjs
//
// Requires in .env:
//   DATABASE_URL  (Supabase pooler)
//   ADMIN_EMAIL   (which user to rotate)
//   RENDER_API_KEY + RENDER_SERVICE_ID  (so we can push to Render)

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const DB_URL    = process.env.DATABASE_URL;
const ADMIN_EM  = process.env.ADMIN_EMAIL || 'betsy@saltbasin.net';
const RENDER_K  = process.env.RENDER_API_KEY;
const RENDER_SV = process.env.RENDER_SERVICE_ID;

if (!DB_URL)    throw new Error('DATABASE_URL is not set');
if (!ADMIN_EM)  throw new Error('ADMIN_EMAIL is not set');
if (!RENDER_K)  throw new Error('RENDER_API_KEY is not set');
if (!RENDER_SV) throw new Error('RENDER_SERVICE_ID is not set');

// ── Generate a strong password ──
// 24 chars, alphabet excludes ambiguous I/l/O/0 so it's safe to read off a
// page if needed. Symbols included for entropy + to satisfy any provider
// complexity rules.
function generatePassword() {
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const SYM   = '!@#$%^&*-_=+?';
  const bytes = randomBytes(64);
  const out = [];
  for (let i = 0; i < 22; i++) out.push(ALPHA[bytes[i] % ALPHA.length]);
  // Sprinkle two symbols at unpredictable positions so a generated value
  // always has them but never always-at-the-end.
  const symPositions = [bytes[22] % 22, bytes[23] % 22];
  out.splice(symPositions[0], 0, SYM[bytes[24] % SYM.length]);
  out.splice(symPositions[1] + 1, 0, SYM[bytes[25] % SYM.length]);
  return out.join('');
}

// ── DB update ──
async function updateDbPassword(newPlain) {
  const sql = postgres(DB_URL, { max: 2, idle_timeout: 5, prepare: false });
  try {
    const hash = await bcrypt.hash(newPlain, 10);
    const rows = await sql`
      UPDATE users SET password_hash = ${hash}
       WHERE email = ${ADMIN_EM.toLowerCase()} AND role = 'admin'
       RETURNING id
    `;
    if (rows.length === 0) {
      throw new Error(`No admin row found for ${ADMIN_EM} — check ADMIN_EMAIL in .env`);
    }
    return Number(rows[0].id);
  } finally {
    await sql.end({ timeout: 2 });
  }
}

// ── Local .env rewrite ──
function updateLocalEnv(newPlain) {
  const envPath = '.env';
  if (!existsSync(envPath)) throw new Error('.env not found at repo root');
  const raw = readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  let found = false;
  const out = lines.map((line) => {
    if (line.startsWith('ADMIN_INITIAL_PASSWORD=')) {
      found = true;
      return `ADMIN_INITIAL_PASSWORD=${newPlain}`;
    }
    return line;
  });
  if (!found) out.push(`ADMIN_INITIAL_PASSWORD=${newPlain}`);
  writeFileSync(envPath, out.join('\n'), 'utf8');
}

// ── Render env push ──
// Mirrors push-supabase-env-to-render.mjs: PATCH /v1/services/:id/env-vars.
// We only touch ADMIN_INITIAL_PASSWORD; other env vars are unchanged.
async function pushToRender(newPlain) {
  // Read existing env vars first so we don't drop anything else.
  const existingRes = await fetch(
    `https://api.render.com/v1/services/${RENDER_SV}/env-vars`,
    { headers: { Authorization: `Bearer ${RENDER_K}` } }
  );
  if (!existingRes.ok) {
    throw new Error(`Render GET env-vars failed: ${existingRes.status} ${await existingRes.text()}`);
  }
  const existing = await existingRes.json();
  // The list endpoint returns [{ envVar: { key, value } }] — normalize.
  const map = new Map();
  for (const item of existing) {
    const ev = item.envVar || item;
    if (ev?.key) map.set(ev.key, ev.value);
  }
  map.set('ADMIN_INITIAL_PASSWORD', newPlain);

  // PUT replaces the full list.
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
}

// ── Local one-shot password file ──
function writeLocalPasswordFile(newPlain) {
  const stamp = new Date().toISOString().slice(0, 10);
  const path = `.admin-password-rotated-${stamp}.txt`;
  const body = [
    'Salt Basin admin password — rotated ' + new Date().toLocaleString(),
    '',
    `Email:    ${ADMIN_EM}`,
    `Password: ${newPlain}`,
    '',
    'Copy this to your password manager, then DELETE this file.',
    'This file is gitignored but anyone with disk access can read it.',
    '',
  ].join('\n');
  writeFileSync(path, body, 'utf8');
  return path;
}

// ── Orchestrate ──
(async () => {
  console.log('→ Generating new admin password (24 chars, mixed)');
  const newPw = generatePassword();

  console.log(`→ Updating users.password_hash for ${ADMIN_EM} in Supabase`);
  const userId = await updateDbPassword(newPw);
  console.log(`  · user id ${userId} updated`);

  console.log('→ Rewriting ADMIN_INITIAL_PASSWORD in local .env');
  updateLocalEnv(newPw);

  console.log('→ Pushing ADMIN_INITIAL_PASSWORD to Render env-vars');
  await pushToRender(newPw);
  console.log('  · Render env updated (auto-deploy may queue)');

  const path = writeLocalPasswordFile(newPw);
  console.log(`→ Wrote one-shot password file: ${path}`);
  console.log('');
  console.log('───────────────────────────────────────────────────────');
  console.log('✓ Rotation complete.');
  console.log('  Next steps:');
  console.log(`    1. Open ${path} in Notepad — copy the password to your manager`);
  console.log(`    2. Delete ${path} (it is gitignored but still on disk)`);
  console.log('    3. The next time you log in at /admin/login, use the new password');
  console.log('───────────────────────────────────────────────────────');
})().catch((err) => {
  console.error('✗ Rotation failed:', err.message);
  process.exit(1);
});
