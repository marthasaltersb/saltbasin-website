#!/usr/bin/env node
// Creates a ready-to-use member test account in a LOCAL test database, and readies the admin too:
// platform terms and career terms accepted at the current version, no forced password change,
// a member profile and journey rods — so test agents land in the World Shell, not on a terms or
// password gate. Run after the server has booted once against the database (bootstrap creates tables).
//
//   node scripts/create-test-member.mjs [--email member@test.local] [--password 'TestPass!2345'] [--name 'Test Member'] [--no-terms] [--out creds.json]
//
// --no-terms leaves career terms unaccepted, for journeys that test the terms flow itself.
// Prints the credentials as JSON. Refuses any DATABASE_URL that is not on this machine.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const email = opt('--email', 'member@test.local').toLowerCase();
const password = opt('--password', 'TestPass!2345');
const name = opt('--name', 'Test Member');
const withTerms = !argv.includes('--no-terms');

const url = process.env.DATABASE_URL || '';
let host = '';
try { host = new URL(url).hostname; } catch { /* handled below */ }
if (!['127.0.0.1', 'localhost', '::1', ''].includes(host) || !url) {
  console.error(`Refusing: DATABASE_URL must point at a local test database (got host "${host || 'none'}").`);
  process.exit(2);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = (p) => import(pathToFileURL(path.join(root, p)).href);
const { db } = await load('server/db.js');
const { createMember } = await load('server/auth.js');
const { recordConsent, hasCurrentConsent } = await load('server/lib/consentRegistry.js');
const { defaultMemberProfile } = await load('server/data/defaultMemberProfile.js');
const { ensureMemberJourneyRods } = await load('server/lib/journeyRods.js');

async function grantTerms(userId) {
  for (const type of ['platform_terms', 'career_portfolio']) {
    if (!(await hasCurrentConsent(userId, type))) await recordConsent(userId, type, true, { context: { source: 'create-test-member' } });
  }
}

let user = await db.prepare('SELECT id FROM users WHERE email = $1').get(email);
if (!user) {
  const created = await createMember(email, password, name);
  if (created.error) { console.error(`Could not create ${email}: ${created.error}`); process.exit(1); }
  user = { id: created.id };
}
const userId = Number(user.id);
await db.prepare('UPDATE users SET must_change_password = false WHERE id = $1').run(userId);

const hasProfile = await db.prepare('SELECT slug FROM member_profiles WHERE user_id = $1').get(userId);
let slug = hasProfile?.slug;
if (!slug) {
  const base = email.split('@')[0].replace(/[^a-z0-9-]+/g, '-').slice(0, 40) || 'test-member';
  slug = base;
  for (let n = 1; await db.prepare('SELECT 1 FROM member_profiles WHERE slug = $1').get(slug); n += 1) slug = `${base}-${n}`;
  await db.prepare('INSERT INTO member_profiles (user_id, slug, draft, published) VALUES ($1, $2, $3, NULL)')
    .run(userId, slug, JSON.stringify(defaultMemberProfile({ displayName: name, email })));
}
await ensureMemberJourneyRods(userId);
if (withTerms) await grantTerms(userId);

// The admin used by admin-scope journeys gets the same treatment, so no test lands on a gate by accident.
const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
const admin = adminEmail ? await db.prepare('SELECT id FROM users WHERE email = $1').get(adminEmail) : null;
if (admin) {
  await db.prepare('UPDATE users SET must_change_password = false WHERE id = $1').run(admin.id);
  if (withTerms) await grantTerms(Number(admin.id));
}

const check = async (id) => ({
  careerTerms: await hasCurrentConsent(id, 'career_portfolio'),
  platformTerms: await hasCurrentConsent(id, 'platform_terms'),
});
const result = JSON.stringify({
  member: { email, password, slug, ...(await check(userId)) },
  admin: admin ? { email: adminEmail, ...(await check(Number(admin.id))) } : null,
}, null, 2);
// Bootstrap notices share stdout, so --out gives callers a clean file to read.
if (opt('--out')) fs.writeFileSync(opt('--out'), result);
console.log(result);
await db.raw?.end?.({ timeout: 2 });
process.exit(0);
