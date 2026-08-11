import { Router } from 'express';
import crypto from 'node:crypto';
import {
  login,
  createSession,
  destroySession,
  setAdminCookie,
  clearAdminCookie,
  getUserFromCookie,
  changePassword,
  unlockLanding,
  isLandingUnlocked,
  ADMIN_COOKIE,
  requireUser,
} from '../auth.js';
import { db, getJSON } from '../db.js';
import { dispatchRaw } from '../lib/email.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';
import { audit } from '../lib/audit.js';
import { makeRateLimiter } from '../lib/rateLimit.js';
import { recordLogin } from '../lib/usageTracking.js';
import { replacePassword, validatePasswordPolicy, PASSWORD_POLICY } from '../lib/passwordPolicy.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { generateTotpSecret, verifyTotp, totpUri } from '../lib/totp.js';
import { organizationSsoConfig, discoverOidc, exchangeOidcCode, hashSsoState, randomSsoValue } from '../lib/organizationSso.js';

// 10 attempts per IP per 15 minutes on auth endpoints
const authLimiter = makeRateLimiter({ windowMs: 15 * 60_000, max: 10, message: 'Too many attempts — please try again in 15 minutes' });

const router = Router();
const SSO_TTL_MS = 10 * 60_000;
const SSO_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || 'https://saltbasin.net';

router.post('/sso/discover', authLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'email required' });
  const candidate = await db.prepare(`SELECT u.id AS user_id,p.org_id,p.sso_provider_key,p.allowed_routes FROM users u JOIN org_memberships om ON om.user_id=u.id JOIN organization_authentication_policies p ON p.org_id=om.org_id WHERE (u.email=$1 OR EXISTS (SELECT 1 FROM user_emails ue WHERE ue.user_id=u.id AND ue.email=$1 AND ue.verified=true)) AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.allowed_routes) route WHERE route='sso') AND p.sso_provider_key IS NOT NULL ORDER BY (om.role='admin') DESC LIMIT 1`).get(email);
  // Keep discovery non-enumerating: unavailable identities receive the same generic result.
  if (!candidate || !organizationSsoConfig(candidate.sso_provider_key)) return res.json({ available: false });
  const state = randomSsoValue();
  const nonce = randomSsoValue();
  const now = Date.now();
  await db.prepare(`INSERT INTO organization_sso_login_states (token_hash,org_id,user_id,provider_key,nonce,expires_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`).run(hashSsoState(state), candidate.org_id, candidate.user_id, candidate.sso_provider_key, nonce, now + SSO_TTL_MS, now);
  const config = organizationSsoConfig(candidate.sso_provider_key);
  const metadata = await discoverOidc(config);
  const redirectUri = `${SSO_BASE_URL}/api/auth/sso/callback`;
  const url = new URL(metadata.authorization_endpoint);
  for (const [key, value] of Object.entries({ response_type: 'code', client_id: config.clientId, redirect_uri: redirectUri, scope: config.scope, state, nonce })) url.searchParams.set(key, value);
  res.json({ available: true, authorizationUrl: url.toString() });
});

router.get('/sso/callback', async (req, res) => {
  const appLogin = `${SSO_BASE_URL}/login`;
  try {
    const state = String(req.query?.state || '');
    const code = String(req.query?.code || '');
    if (!state || !code || req.query?.error) throw new Error('SSO authorization was not completed');
    const record = await db.prepare(`UPDATE organization_sso_login_states SET consumed_at=$2 WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>$2 RETURNING org_id,user_id,provider_key,nonce`).get(hashSsoState(state), Date.now());
    if (!record) throw new Error('SSO state is invalid or expired');
    const config = organizationSsoConfig(record.provider_key);
    if (!config) throw new Error('SSO provider is not configured');
    const metadata = await discoverOidc(config);
    const identity = await exchangeOidcCode({ config, metadata, code, redirectUri: `${SSO_BASE_URL}/api/auth/sso/callback`, expectedNonce: record.nonce });
    if (!identity.email || identity.email_verified === false) throw new Error('SSO provider did not return a verified email');
    const matched = await db.prepare(`SELECT 1 FROM users u JOIN org_memberships om ON om.user_id=u.id AND om.org_id=$2 WHERE u.id=$1 AND (LOWER(u.email)=LOWER($3) OR EXISTS (SELECT 1 FROM user_emails ue WHERE ue.user_id=u.id AND LOWER(ue.email)=LOWER($3) AND ue.verified=true))`).get(record.user_id, record.org_id, identity.email);
    if (!matched) throw new Error('SSO identity does not match the provisioned organization member');
    await db.prepare(`INSERT INTO user_authentication_routes (user_id,route_type,provider_key,enabled,preferred,org_id,created_at) VALUES ($1,'sso',$2,true,true,$3,$4) ON CONFLICT (user_id,route_type,provider_key,org_id) DO UPDATE SET enabled=true`).run(record.user_id, record.provider_key, record.org_id, Date.now());
    const { token } = await createSession(record.user_id);
    setAdminCookie(res, token);
    await audit({ req, actor: { id: record.user_id }, action: 'auth.sso.login', entityType: 'user', entityId: record.user_id, summary: `Organization SSO login via ${record.provider_key}` });
    return res.redirect(`${SSO_BASE_URL}/world`);
  } catch (error) {
    return res.redirect(`${appLogin}?ssoError=${encodeURIComponent(error.message)}`);
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password, otp } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await login(email, password);
  if (!user) {
    await audit({ req, actor: null, action: 'auth.login.failed', entityType: 'user', summary: `Failed login attempt for ${email}` });
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const totpRoute = await db.prepare(`SELECT secret_enc FROM user_authentication_routes WHERE user_id=$1 AND route_type='totp' AND enabled=true ORDER BY preferred DESC,id LIMIT 1`).get(user.id);
  if (totpRoute) {
    if (!otp) return res.status(202).json({ ok: false, challengeRequired: true, methods: ['totp'], message: 'Enter the code from your authenticator app.' });
    let validOtp = false;
    try { validOtp = verifyTotp(decrypt(totpRoute.secret_enc), otp); } catch { validOtp = false; }
    if (!validOtp) return res.status(401).json({ error: 'invalid authentication code', challengeRequired: true, methods: ['totp'] });
  }
  const { token } = await createSession(user.id);
  setAdminCookie(res, token);
  await audit({ req, actor: { id: user.id, role: user.role, email }, action: 'auth.login', entityType: 'user', entityId: user.id, summary: `${email} logged in` });
  if (user.role === 'member') {
    // First-login stage transitions + login-count tracking (§ Member
    // Entitlement Provisioning) only apply to members — admin logins aren't
    // Channel Rod-backed identities.
    recordLogin(user.id).catch((e) => console.error('[auth] recordLogin failed:', e.message));
  }
  res.json({ ok: true, user: { id: user.id, role: user.role, email, mustChangePassword: user.mustChangePassword } });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.[ADMIN_COOKIE];
  const user = await getUserFromCookie(req);
  await destroySession(token);
  clearAdminCookie(res);
  if (user) await audit({ req, actor: user, action: 'auth.logout', entityType: 'user', entityId: user.id, summary: `${user.email} logged out` });
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const user = await getUserFromCookie(req);
  res.json({ user });
});

router.get('/password-policy', (_req, res) => res.json(PASSWORD_POLICY));

router.get('/authentication-routes', requireUser, async (req, res) => {
  const rows = await db.prepare(`SELECT id,route_type,provider_key,enabled,preferred,org_id,created_at FROM user_authentication_routes WHERE user_id=$1 ORDER BY preferred DESC,id`).all(req.user.id);
  res.json({ routes: rows.map((row) => ({ ...row, secret_enc: undefined })) });
});

router.post('/totp/setup', requireUser, async (req, res) => {
  const secret = generateTotpSecret();
  await db.prepare(`DELETE FROM user_authentication_routes WHERE user_id=$1 AND route_type='totp' AND provider_key='authenticator_app' AND org_id IS NULL`).run(req.user.id);
  await db.prepare(`INSERT INTO user_authentication_routes (user_id,route_type,provider_key,secret_enc,enabled,preferred,created_at) VALUES ($1,'totp','authenticator_app',$2,false,false,$3)`).run(req.user.id, encrypt(secret), Date.now());
  res.json({ secret, uri: totpUri({ secret, email: req.user.email }) });
});

router.post('/totp/enable', requireUser, async (req, res) => {
  const route = await db.prepare(`SELECT id,secret_enc FROM user_authentication_routes WHERE user_id=$1 AND route_type='totp' AND provider_key='authenticator_app' ORDER BY id DESC LIMIT 1`).get(req.user.id);
  if (!route) return res.status(404).json({ error: 'start authenticator setup first' });
  let valid = false;
  try { valid = verifyTotp(decrypt(route.secret_enc), req.body?.code); } catch { valid = false; }
  if (!valid) return res.status(400).json({ error: 'invalid authentication code' });
  await db.prepare(`UPDATE user_authentication_routes SET enabled=true,preferred=true WHERE id=$1 AND user_id=$2`).run(route.id, req.user.id);
  res.json({ ok: true });
});

router.delete('/totp', requireUser, async (req, res) => {
  await db.prepare(`DELETE FROM user_authentication_routes WHERE user_id=$1 AND route_type='totp' AND provider_key='authenticator_app'`).run(req.user.id);
  res.json({ ok: true });
});

router.get('/password-reset-preferences', requireUser, async (req, res) => {
  const row = await db.prepare(`SELECT default_destinations,ip_rules,updated_at FROM user_password_reset_preferences WHERE user_id=$1`).get(req.user.id);
  res.json(row || { default_destinations: ['primary'], ip_rules: [], updated_at: null });
});

router.put('/password-reset-preferences', requireUser, async (req, res) => {
  const allowed = new Set(['primary', 'personal', 'work', 'organization']);
  const defaults = Array.isArray(req.body?.defaultDestinations) ? req.body.defaultDestinations.filter((v) => allowed.has(v)) : [];
  const rules = Array.isArray(req.body?.ipRules) ? req.body.ipRules.slice(0, 20).map((rule) => ({ ip: String(rule?.ip || '').trim().slice(0, 80), destinations: Array.isArray(rule?.destinations) ? rule.destinations.filter((v) => allowed.has(v)) : [] })).filter((rule) => rule.ip && rule.destinations.length) : [];
  if (!defaults.length) defaults.push('primary');
  await db.prepare(`INSERT INTO user_password_reset_preferences (user_id,default_destinations,ip_rules,updated_at) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO UPDATE SET default_destinations=EXCLUDED.default_destinations,ip_rules=EXCLUDED.ip_rules,updated_at=EXCLUDED.updated_at`).run(req.user.id, defaults, rules, Date.now());
  res.json({ ok: true, defaultDestinations: defaults, ipRules: rules });
});

router.post('/change-password', requireUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'current and new password required' });
  const result = await changePassword(req.user.id, currentPassword, newPassword);
  if (!result.ok) return res.status(result.error === 'current_password_incorrect' ? 401 : 400).json(result);
  res.json({ ok: true });
});

router.get('/landing-gate/status', async (req, res) => {
  const config = (await getJSON('config_state', 'published')) || {};
  res.json({
    enabled: !!config?.prelaunch?.enabled,
    unlocked: await isLandingUnlocked(req),
    headline: config?.prelaunch?.headline || 'Coming Soon',
    subhead: config?.prelaunch?.subhead || '',
  });
});

router.post('/landing-gate/unlock', async (req, res) => {
  const { password } = req.body || {};
  const ok = await unlockLanding(res, password);
  if (!ok) return res.status(401).json({ error: 'invalid password' });
  res.json({ ok: true });
});

// ── Password reset ──
//
// Two-endpoint flow:
//   POST /api/auth/reset-request { email }
//     Looks up the user. Whether one matches or not, the response is always
//     200 — we never reveal whether an email is registered (prevents enum
//     attacks). On match: generate a 32-byte hex token, store in
//     password_reset_tokens with a 1-hour expiry, email the user a link to
//     /reset/<token>.
//
//   POST /api/auth/reset-confirm { token, password }
//     Validates token (exists, not expired, not used). On success: bcrypt-hash
//     the new password, update users.password_hash, stamp used_at on this
//     token AND any other un-used tokens for the same user, and DELETE all
//     existing sessions for the user (force re-login with new password).

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';

router.post('/reset-request', authLimiter, async (req, res) => {
  const { email, recaptchaToken } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email required' });
  }
  const captcha = await verifyRecaptcha(recaptchaToken, 'forgot_password');
  if (!captcha.ok) return res.status(400).json({ error: captcha.error || 'captcha verification failed' });
  const lower = email.toLowerCase().trim();

  const user = await db.prepare(`SELECT id, email FROM users WHERE email = $1`).get(lower);
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + RESET_TTL_MS;
    await db
      .prepare(`INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`)
      .run(token, Number(user.id), expiresAt);

    const resetUrl = `${RESET_BASE_URL}/reset/${token}`;
    const text =
      `Someone (hopefully you) asked to reset the password for your Salt Basin Net Works account.\n\n` +
      `Use this link within the next hour to set a new password:\n${resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email — your password stays unchanged.`;
    const html =
      `<p>Someone (hopefully you) asked to reset the password for your Salt Basin Net Works account.</p>` +
      `<p>Use this link within the next hour to set a new password:</p>` +
      `<p><a href="${resetUrl}" style="color:#C4843A;">${resetUrl}</a></p>` +
      `<p style="color:#8B9BAE;font-size:0.85rem;">If you didn't request this, you can safely ignore this email — your password stays unchanged.</p>`;

    try {
      const preference = await db.prepare(`SELECT default_destinations,ip_rules FROM user_password_reset_preferences WHERE user_id=$1`).get(user.id);
      const requestIp = String(req.ip || req.socket?.remoteAddress || '');
      const matchedRule = (preference?.ip_rules || []).find((rule) => requestIp === rule.ip || (rule.ip.endsWith('*') && requestIp.startsWith(rule.ip.slice(0, -1))));
      const destinationTypes = matchedRule?.destinations || preference?.default_destinations || ['primary'];
      const verified = await db.prepare(`SELECT email,type FROM user_emails WHERE user_id=$1 AND verified=true`).all(user.id);
      const destinations = new Set();
      if (destinationTypes.includes('primary')) destinations.add(user.email);
      verified.forEach((entry) => { if (destinationTypes.includes(entry.type)) destinations.add(entry.email); });
      if (!destinations.size) destinations.add(user.email);
      for (const destination of destinations) await dispatchRaw({
        to: destination,
        subject: 'Salt Basin Net Works · Reset your password',
        text,
        html,
        authorization: { mode: 'user_requested' },
      });
    } catch (e) {
      // Log but don't reveal failure to the requester — same 200 response
      // either way to keep enumeration shut.
      console.error('[auth/reset-request] dispatch failed:', e.message);
    }
  }

  res.json({ ok: true });
});

router.post('/reset-confirm', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ error: 'token and password required' });
  }
  const validation = validatePasswordPolicy(password);
  if (!validation.valid) return res.status(400).json({ error: 'password_policy_failed', details: validation.errors, policy: validation.policy });

  const row = await db
    .prepare(`SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = $1`)
    .get(token);
  if (!row) return res.status(400).json({ error: 'invalid or expired link' });
  if (row.used_at) return res.status(400).json({ error: 'this link has already been used' });
  if (Number(row.expires_at) < Date.now()) {
    return res.status(400).json({ error: 'this link has expired — request a new one' });
  }

  const userId = Number(row.user_id);
  const replacement = await replacePassword(userId, password);
  if (!replacement.ok) return res.status(400).json(replacement);
  // Mark this token used.
  await db
    .prepare(`UPDATE password_reset_tokens SET used_at = $1 WHERE token = $2`)
    .run(Date.now(), token);
  // Invalidate any OTHER un-used reset tokens for this user — defensive against
  // the case where multiple requests were in flight.
  await db
    .prepare(
      `UPDATE password_reset_tokens SET used_at = $1 WHERE user_id = $2 AND used_at IS NULL AND token != $3`
    )
    .run(Date.now(), userId, token);
  // Kick all existing sessions so the next access requires the NEW password.
  // Better paranoid than not, especially if the reset was triggered because
  // the previous password was compromised.
  await db.prepare(`DELETE FROM sessions WHERE user_id = $1`).run(userId);

  res.json({ ok: true });
});

// ── Email recovery via phone lookup ──
//
// "Forgot which email you signed up with?" User types in a phone number; if
// any lead carries that phone AND has been converted to a user, send that
// user an email saying "the account you're looking for is X@Y.com". Always
// returns 200 to prevent phone enumeration. Rate-limit happens upstream
// (proxy / cf rules) — we don't add per-IP throttling here.
//
// Phone normalization mirrors what the lead-capture flow does: digits only.
router.post('/email-recover', async (req, res) => {
  const { phone, recaptchaToken } = req.body || {};
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'phone required' });
  }
  const captcha = await verifyRecaptcha(recaptchaToken, 'forgot_email');
  if (!captcha.ok) return res.status(400).json({ error: captcha.error || 'captcha verification failed' });
  const digits = phone.replace(/\D+/g, '');
  if (digits.length < 7) {
    // Too short to be a real phone — silently no-op (still 200).
    return res.json({ ok: true });
  }

  // Find lead(s) with this phone that have a converted_user_id. Walk to user.
  const row = await db
    .prepare(
      `SELECT u.email
         FROM leads l JOIN users u ON u.id = l.converted_user_id
        WHERE l.phone = $1 AND l.merged_into_id IS NULL
        ORDER BY l.updated_at DESC
        LIMIT 1`
    )
    .get(digits);

  if (row?.email) {
    const text =
      `You (or someone with access to your phone) asked Salt Basin Net Works for a reminder of ` +
      `which email is on your account.\n\nThe account you're looking for is: ${row.email}\n\n` +
      `If this wasn't you, you can safely ignore this email — nothing has changed.`;
    const html =
      `<p>You (or someone with access to your phone) asked Salt Basin Net Works for a reminder of which email is on your account.</p>` +
      `<p>The account you're looking for is: <strong>${row.email}</strong></p>` +
      `<p style="color:#8B9BAE;font-size:0.85rem;">If this wasn't you, you can safely ignore this email — nothing has changed.</p>`;
    try {
      await dispatchRaw({
        to: row.email,
        subject: 'Salt Basin Net Works · Account email reminder',
        text,
        html,
        authorization: { mode: 'user_requested' },
      });
    } catch (e) {
      console.error('[auth/email-recover] dispatch failed:', e.message);
    }
  }

  res.json({ ok: true });
});

export default router;
