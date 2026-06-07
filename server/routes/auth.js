import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
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
  requireAdmin,
} from '../auth.js';
import { db, getJSON } from '../db.js';
import { dispatchRaw } from '../lib/email.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await login(email, password);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const { token } = await createSession(user.id);
  setAdminCookie(res, token);
  res.json({ ok: true, user: { id: user.id, role: user.role, email } });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.[ADMIN_COOKIE];
  await destroySession(token);
  clearAdminCookie(res);
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const user = await getUserFromCookie(req);
  res.json({ user });
});

router.post('/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'newPassword must be at least 8 chars' });
  }
  const ok = await changePassword(req.user.id, currentPassword, newPassword);
  if (!ok) return res.status(401).json({ error: 'current password incorrect' });
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

router.post('/reset-request', async (req, res) => {
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
      await dispatchRaw({
        to: user.email,
        subject: 'Salt Basin Net Works · Reset your password',
        text,
        html,
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
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  const row = await db
    .prepare(`SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = $1`)
    .get(token);
  if (!row) return res.status(400).json({ error: 'invalid or expired link' });
  if (row.used_at) return res.status(400).json({ error: 'this link has already been used' });
  if (Number(row.expires_at) < Date.now()) {
    return res.status(400).json({ error: 'this link has expired — request a new one' });
  }

  const hash = await bcrypt.hash(password, 10);
  const userId = Number(row.user_id);
  await db.prepare(`UPDATE users SET password_hash = $1 WHERE id = $2`).run(hash, userId);
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
      });
    } catch (e) {
      console.error('[auth/email-recover] dispatch failed:', e.message);
    }
  }

  res.json({ ok: true });
});

export default router;
