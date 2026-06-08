import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db, getJSON } from './db.js';

const ADMIN_COOKIE = 'sb_admin';
const LANDING_COOKIE = 'sb_landing';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const LANDING_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

// In production we set secure cookies (HTTPS only). Behind Render's TLS
// terminator the request still looks like http to express, so we trust the
// NODE_ENV signal rather than req.secure.
function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeMs,
    path: '/',
  };
}

export async function createSession(userId) {
  const token = newToken();
  const expires = Date.now() + SESSION_TTL_MS;
  await db
    .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)')
    .run(token, userId, expires);
  return { token, expires };
}

export async function destroySession(token) {
  if (!token) return;
  await db.prepare('DELETE FROM sessions WHERE token = $1').run(token);
}

export async function getUserFromCookie(req) {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) return null;
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.role, u.display_name, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = $1`
    )
    .get(token);
  if (!row) return null;
  if (Number(row.expires_at) < Date.now()) {
    await destroySession(token);
    return null;
  }
  return { id: Number(row.id), email: row.email, role: row.role, displayName: row.display_name || null };
}

export async function login(email, password) {
  const row = await db
    .prepare('SELECT id, password_hash, role FROM users WHERE email = $1')
    .get(email.toLowerCase());
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return { id: Number(row.id), role: row.role };
}

export async function changePassword(userId, currentPassword, newPassword) {
  const row = await db
    .prepare('SELECT password_hash FROM users WHERE id = $1')
    .get(userId);
  if (!row) return false;
  const ok = await bcrypt.compare(currentPassword, row.password_hash);
  if (!ok) return false;
  const hash = await bcrypt.hash(newPassword, 10);
  await db.prepare('UPDATE users SET password_hash = $1 WHERE id = $2').run(hash, userId);
  return true;
}

export function setAdminCookie(res, token) {
  res.cookie(ADMIN_COOKIE, token, cookieOptions(SESSION_TTL_MS));
}
export function clearAdminCookie(res) {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
}

// ── Landing gate ──
export async function isLandingUnlocked(req) {
  const config = (await getJSON('config_state', 'published')) || {};
  if (!config?.prelaunch?.enabled) return true;
  const token = req.cookies?.[LANDING_COOKIE];
  if (!token) return false;
  const row = await db
    .prepare('SELECT expires_at FROM landing_sessions WHERE token = $1')
    .get(token);
  if (!row) return false;
  if (Number(row.expires_at) < Date.now()) {
    await db.prepare('DELETE FROM landing_sessions WHERE token = $1').run(token);
    return false;
  }
  return true;
}

export async function unlockLanding(res, providedPassword) {
  const config = (await getJSON('config_state', 'published')) || {};
  const expected = config?.prelaunch?.password;
  if (!expected || providedPassword !== expected) return false;
  const token = newToken();
  const expires = Date.now() + LANDING_TTL_MS;
  await db
    .prepare('INSERT INTO landing_sessions (token, expires_at) VALUES ($1, $2)')
    .run(token, expires);
  res.cookie(LANDING_COOKIE, token, cookieOptions(LANDING_TTL_MS));
  return true;
}

export async function requireAdmin(req, res, next) {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  req.user = user;
  next();
}

export async function requireUser(req, res, next) {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  next();
}

export async function createMember(email, password, displayName) {
  if (!email || !password || password.length < 8) {
    return { error: 'email and 8+ char password required' };
  }
  const lower = email.toLowerCase();
  const exists = await db.prepare('SELECT 1 FROM users WHERE email = $1').get(lower);
  if (exists) return { error: 'email already registered' };
  const hash = await bcrypt.hash(password, 10);
  const result = await db
    .prepare(
      'INSERT INTO users (email, password_hash, role, display_name) VALUES ($1, $2, $3, $4) RETURNING id'
    )
    .run(lower, hash, 'member', displayName || null);
  return { id: Number(result.lastInsertRowid), email: lower, displayName };
}

export { ADMIN_COOKIE, LANDING_COOKIE };
