// The ONE fictional production test account the production smoke and regression suite signs in with
// (feature production-smoke-regression, owner decision 2026-10-10). Fictional by construction: the address
// uses the reserved `.invalid` TLD (RFC 2606, never deliverable), there is no real data, and email.js refuses
// to deliver to any `.invalid` address, so the account is excluded from all email.
//
// `readySmokeAccount` is idempotent and is the single implementation behind the API route
// (/api/production-smoke/account), the MCP tool (production_smoke_account_*) and the World Shell screen.
// It creates the account if it is missing, or readies it if it exists (password set to the one supplied,
// forced password change cleared, platform + Career Portfolio terms current, starter profile present and
// unpublished). It only ever touches the row whose email is SMOKE_ACCOUNT.email, and refuses (409) when
// that row is not a plain member. The password is never stored by Salt Basin beyond its bcrypt hash, never
// returned and never logged. Nothing here runs from seed/bootstrap, and no other member's row is read.
import bcrypt from 'bcryptjs';
import { db } from '../db.js';

export const SMOKE_ACCOUNT = Object.freeze({
  email: 'smoke-member@test.saltbasin.invalid',
  displayName: 'Smoke Test Member',
  slug: 'smoke-test-member',
});

export const SMOKE_SECRET_NAMES = Object.freeze({
  provisioning: ['SMOKE_ADMIN_EMAIL', 'SMOKE_ADMIN_PASSWORD'],
  account: ['SMOKE_MEMBER_PASSWORD'],
  optional: ['SMOKE_BASE_URL'],
});

const err = (status, code, message, extra = {}) => Object.assign(new Error(message), { status, code, ...extra });

/** True for any address that can never receive mail (reserved test TLDs). Used by email.js. */
export function isReservedTestAddress(addr) {
  const m = /@([^@\s>]+)>?\s*$/.exec(String(addr || '').trim().toLowerCase());
  return !!m && (m[1].endsWith('.invalid') || m[1] === 'invalid');
}

async function consentGranted(userId, type) {
  const { getConsentStatus } = await import('./consentRegistry.js');
  const s = await getConsentStatus(userId, type);
  return { granted: s.granted, version: s.consentVersion };
}

/** Read-only status. Never reveals anything about any other user. */
export async function getSmokeAccountStatus() {
  const user = await db.prepare('SELECT id, email, role, display_name, must_change_password FROM users WHERE email = $1').get(SMOKE_ACCOUNT.email);
  const base = { account: { email: SMOKE_ACCOUNT.email, displayName: SMOKE_ACCOUNT.displayName, slug: SMOKE_ACCOUNT.slug }, secrets: SMOKE_SECRET_NAMES, emailExcluded: isReservedTestAddress(SMOKE_ACCOUNT.email) };
  if (!user) return { ...base, exists: false, ready: false, problems: ['The account has not been created yet.'] };
  const platform = await consentGranted(Number(user.id), 'platform_terms');
  const career = await consentGranted(Number(user.id), 'career_portfolio');
  const profile = await db.prepare('SELECT slug, published FROM member_profiles WHERE user_id = $1').get(Number(user.id));
  const problems = [];
  if (user.role !== 'member') problems.push(`The account's role is "${user.role}", not "member". Fix it by hand; the suite refuses to use it.`);
  if (user.must_change_password) problems.push('The account still has a forced password change pending.');
  if (!platform.granted) problems.push('Platform terms are not current for the account.');
  if (!career.granted) problems.push('Career Portfolio terms are not current for the account.');
  if (!profile) problems.push('The starter member profile is missing.');
  return {
    ...base, exists: true, userId: Number(user.id), role: user.role, mustChangePassword: !!user.must_change_password,
    platformTermsCurrent: platform.granted, careerTermsCurrent: career.granted,
    profileSlug: profile?.slug || null, profilePublished: !!profile?.published,
    ready: problems.length === 0, problems,
  };
}

/** Create or ready the account. `password` is required; `ctx` carries { ip, userAgent } for the consent rows. */
export async function readySmokeAccount({ password, ctx = {} } = {}) {
  const { validatePasswordPolicy, replacePassword } = await import('./passwordPolicy.js');
  // A password is required to CREATE the account. Re-readying an existing account may omit it (the MCP tool does:
  // a secret is never passed through an agent session), which leaves the stored password as it is.
  const havePassword = password != null && password !== '';
  if (havePassword) {
    const policy = validatePasswordPolicy(password);
    if (typeof password !== 'string' || !policy.valid) {
      throw err(400, 'password_policy_failed', 'That password does not meet the password policy. Choose a stronger password and try again.', { details: policy.errors || [] });
    }
  }
  const { recordConsent, consentDefinition } = await import('./consentRegistry.js');
  const email = SMOKE_ACCOUNT.email;
  let user = await db.prepare('SELECT id, role, password_hash FROM users WHERE email = $1').get(email);
  let created = false;
  if (user && user.role !== 'member') {
    throw err(409, 'smoke_account_not_member', `${email} exists but is not a plain member, so it cannot be used as the test account. Nothing was changed.`);
  }
  if (!user && !havePassword) {
    throw err(400, 'password_required', 'The test account does not exist yet, so a password is needed to create it. Create it from World Shell > Journeys > Production smoke or the provisioning workflow; it cannot be created from an agent session.');
  }
  if (!user) {
    const hash = await bcrypt.hash(password, 10);
    const r = await db.prepare('INSERT INTO users (email, password_hash, role, display_name, must_change_password) VALUES ($1, $2, $3, $4, false) RETURNING id')
      .run(email, hash, 'member', SMOKE_ACCOUNT.displayName);
    user = { id: r.lastInsertRowid };
    created = true;
  } else {
    const same = !havePassword || await bcrypt.compare(password, user.password_hash);
    if (!same) {
      const rp = await replacePassword(Number(user.id), password, { clearMustChange: true });
      if (!rp.ok) throw err(400, rp.error, 'That password cannot be used for the test account. Choose one it has not used before and try again.', { details: rp.details || [] });
    }
    await db.prepare('UPDATE users SET display_name = $1, must_change_password = false WHERE id = $2').run(SMOKE_ACCOUNT.displayName, Number(user.id));
  }
  const userId = Number(user.id);
  await db.prepare('INSERT INTO user_emails (user_id, email, type, verified) VALUES ($1, $2, $3, true) ON CONFLICT (email) DO NOTHING').run(userId, email, 'primary');

  for (const type of ['platform_terms', 'career_portfolio']) {
    if ((await consentGranted(userId, type)).granted) continue;
    const def = consentDefinition(type);
    await recordConsent(userId, type, true, { ip: ctx.ip, userAgent: ctx.userAgent, context: { source: 'production_smoke_account', acknowledgementKeys: (def.acknowledgements || []).map((a) => a.key) } });
  }

  const profile = await db.prepare('SELECT user_id FROM member_profiles WHERE user_id = $1').get(userId);
  if (!profile) {
    const taken = await db.prepare('SELECT user_id FROM member_profiles WHERE slug = $1').get(SMOKE_ACCOUNT.slug);
    if (taken) throw err(409, 'smoke_slug_taken', `The profile address "${SMOKE_ACCOUNT.slug}" belongs to another member. Nothing else was changed; release that address and run this again.`);
    const { defaultMemberProfile } = await import('../data/defaultMemberProfile.js');
    await db.prepare('INSERT INTO member_profiles (user_id, slug, draft, published) VALUES ($1, $2, $3, NULL)')
      .run(userId, SMOKE_ACCOUNT.slug, JSON.stringify(defaultMemberProfile({ displayName: SMOKE_ACCOUNT.displayName, email })));
  }
  const { ensureMemberJourneyRods } = await import('./journeyRods.js');
  await ensureMemberJourneyRods(userId);
  return { created, ...(await getSmokeAccountStatus()) };
}
