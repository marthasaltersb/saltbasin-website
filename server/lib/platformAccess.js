// Platform access tokens (2026-10-09) - the credential an AI agent uses to act through the platform
// MCP server (/mcp) as a real platform user.
//
//  - A token belongs to one user and acts AS that user: every tool call re-checks the user's role, forced
//    password change and Career Portfolio terms exactly like the API does (server/auth.js
//    getAccountGateBlock). Scopes only NARROW what the token may call; they never grant anything the
//    user could not do in the website.
//  - Only the SHA-256 hash is stored. The plaintext is returned once, at creation.
//  - Revoking sets revoked_at; a revoked or expired token is refused at the door (HTTP 401).
import crypto from 'node:crypto';
import { db } from '../db.js';

export const TOKEN_PREFIX = 'sbpat_';
export const MAX_ACTIVE_TOKENS_PER_USER = 20;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export class AccessError extends Error {
  constructor(message, status = 400, code = 'bad_request', details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

function view(row, calls = 0) {
  const now = Date.now();
  const revoked = row.revoked_at != null;
  const expired = row.expires_at != null && Number(row.expires_at) < now;
  return {
    id: Number(row.id),
    name: row.name,
    prefix: row.token_prefix,
    scopes: parseJson(row.scopes) || [],
    createdAt: Number(row.created_at),
    expiresAt: row.expires_at != null ? Number(row.expires_at) : null,
    lastUsedAt: row.last_used_at != null ? Number(row.last_used_at) : null,
    revokedAt: revoked ? Number(row.revoked_at) : null,
    status: revoked ? 'revoked' : expired ? 'expired' : 'active',
    calls,
  };
}

/** The member's own tokens (never the secret), newest first, with how many tool calls each has made. */
export async function listTokens(userId) {
  const rows = await db.prepare(`SELECT * FROM platform_access_tokens WHERE user_id=$1 ORDER BY created_at DESC, id DESC`).all(userId);
  const counts = await db.prepare(`
    SELECT metadata->>'tokenId' AS token_id, COUNT(*)::int AS n
      FROM analytics_events
     WHERE event_type='mcp_tool_call' AND member_user_id=$1
     GROUP BY metadata->>'tokenId'
  `).all(userId);
  const byToken = new Map(counts.map((c) => [String(c.token_id), c.n]));
  return rows.map((r) => view(r, byToken.get(String(r.id)) || 0));
}

/**
 * Creates a token. `knownScopes` is the list of scope keys the registry defines; an unknown scope or an
 * empty selection is refused rather than silently widened to "everything".
 */
export async function createToken(userId, { name, scopes, expiresInDays = null }, knownScopes) {
  const label = String(name || '').trim();
  if (!label) throw new AccessError('Give the token a name so you can recognise it later.', 400, 'name_required');
  if (label.length > 80) throw new AccessError('Token names are limited to 80 characters.', 400, 'name_too_long');
  if (!Array.isArray(scopes) || !scopes.length) throw new AccessError('Choose at least one scope for the token.', 400, 'scopes_required');
  const unknown = scopes.filter((s) => !knownScopes.includes(s));
  if (unknown.length) throw new AccessError(`Unknown scope: ${unknown.join(', ')}.`, 400, 'unknown_scope');
  let expiresAt = null;
  if (expiresInDays != null && expiresInDays !== '') {
    const days = Number(expiresInDays);
    if (!Number.isFinite(days) || days < 1 || days > 365) throw new AccessError('Expiry must be between 1 and 365 days.', 400, 'bad_expiry');
    expiresAt = Date.now() + Math.round(days) * 86400000;
  }
  const active = (await listTokens(userId)).filter((t) => t.status === 'active').length;
  if (active >= MAX_ACTIVE_TOKENS_PER_USER) throw new AccessError(`You already have ${active} active tokens. Revoke one before creating another.`, 409, 'too_many_tokens');
  const token = TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const row = await db.prepare(`
    INSERT INTO platform_access_tokens (user_id, name, token_hash, token_prefix, scopes, created_at, expires_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING *
  `).get(userId, label, hashToken(token), token.slice(0, TOKEN_PREFIX.length + 6), [...new Set(scopes)], now, expiresAt);
  return { token, ...view(row) };
}

/** Revokes one of the user's own tokens. A revoked token is never reactivated. */
export async function revokeToken(userId, tokenId) {
  const row = await db.prepare(`SELECT * FROM platform_access_tokens WHERE id=$1 AND user_id=$2`).get(tokenId, userId);
  if (!row) throw new AccessError('Token not found.', 404, 'not_found');
  if (row.revoked_at != null) return view(row);
  const updated = await db.prepare(`UPDATE platform_access_tokens SET revoked_at=$1 WHERE id=$2 AND user_id=$3 RETURNING *`).get(Date.now(), tokenId, userId);
  return view(updated);
}

/**
 * Resolves a bearer token to { user, token } or throws AccessError(401). The user is read fresh on every
 * request, so a demoted, deleted or password-reset-pending user is never served from a stale cache.
 */
export async function authenticateToken(bearer) {
  const raw = String(bearer || '').trim();
  if (!raw.startsWith(TOKEN_PREFIX)) throw new AccessError('Missing or malformed access token.', 401, 'invalid_token');
  const row = await db.prepare(`
    SELECT t.*, u.email, u.role, u.display_name, u.must_change_password
      FROM platform_access_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1
  `).get(hashToken(raw));
  if (!row) throw new AccessError('This access token is not recognised.', 401, 'invalid_token');
  if (row.revoked_at != null) throw new AccessError('This access token has been revoked.', 401, 'token_revoked');
  if (row.expires_at != null && Number(row.expires_at) < Date.now()) throw new AccessError('This access token has expired.', 401, 'token_expired');
  const user = { id: Number(row.user_id), email: row.email, role: row.role, displayName: row.display_name || null, mustChangePassword: !!row.must_change_password };
  return { user, token: { id: Number(row.id), name: row.name, scopes: parseJson(row.scopes) || [] } };
}

export async function touchToken(tokenId) {
  await db.prepare(`UPDATE platform_access_tokens SET last_used_at=$1 WHERE id=$2`).run(Date.now(), tokenId);
}
