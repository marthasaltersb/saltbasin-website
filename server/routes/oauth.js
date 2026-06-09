import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import {
  PROVIDERS, PROVIDER_IDS, buildAuthUrl, exchangeCode, refreshToken, clientCredentialsToken,
} from '../lib/oauthProviders.js';
import { getUserFromCookie } from '../auth.js';

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

// Pending OAuth states: { [state]: { userId, providerId, extra } }
// In-memory is fine — these expire after the redirect round-trip (~30s).
const pendingStates = new Map();

function pruneStates() {
  const cutoff = Date.now() - 10 * 60 * 1000; // 10 min
  for (const [k, v] of pendingStates) {
    if (v.createdAt < cutoff) pendingStates.delete(k);
  }
}

// ── GET /api/oauth/:provider/connect ─────────────────────────────────────────
// Redirects the member's browser to the provider's authorization page.
router.get('/:provider/connect', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { provider } = req.params;
    if (!PROVIDERS[provider]) return res.status(404).json({ error: 'Unknown provider' });

    // Supabase PAT fallback: no OAuth app registered yet
    if (provider === 'supabase' && !PROVIDERS.supabase.clientId()) {
      return res.status(400).json({
        error: 'Supabase OAuth not configured. Use a Personal Access Token instead.',
        patFallback: true,
      });
    }

    if (!PROVIDERS[provider].clientId()) {
      return res.status(400).json({ error: `${provider} OAuth is not configured (missing CLIENT_ID in .env)` });
    }

    const p = PROVIDERS[provider];

    // client_credentials providers (Zuora, Marketo) skip the redirect entirely.
    if (p.grantType === 'client_credentials') {
      const extra = {};
      if (provider === 'marketo') extra.munchkinId = req.query.munchkinId;
      if (provider === 'snowflake') extra.accountId = req.query.accountId;
      try {
        const tokens = await clientCredentialsToken(provider, extra);
        const accessEnc = encrypt(tokens.access_token);
        const expiresAt = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;
        const identity = await p.fetchIdentity(tokens.access_token, extra);
        const now = Date.now();
        await db.prepare(`
          INSERT INTO member_oauth_connections
            (user_id, provider, external_id, label, access_token_enc, refresh_token_enc,
             token_expires_at, scopes, metadata, updated_at)
          VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9)
          ON CONFLICT (user_id, provider) DO UPDATE SET
            external_id = EXCLUDED.external_id, label = EXCLUDED.label,
            access_token_enc = EXCLUDED.access_token_enc, token_expires_at = EXCLUDED.token_expires_at,
            metadata = EXCLUDED.metadata, updated_at = EXCLUDED.updated_at
        `).run(user.id, provider, identity.externalId, identity.label, accessEnc,
               expiresAt, p.scopes.join(' ') || '', JSON.stringify(extra), now);
        const appBase = process.env.APP_BASE_URL || 'http://localhost:5173';
        return res.redirect(`${appBase}/admin?oauthSuccess=${provider}`);
      } catch (err) {
        const appBase = process.env.APP_BASE_URL || 'http://localhost:5173';
        return res.redirect(`${appBase}/admin?oauthError=${encodeURIComponent(err.message)}&provider=${provider}`);
      }
    }

    pruneStates();
    const state = crypto.randomBytes(24).toString('hex');
    const extra = {};
    // Collect tenant/account identifiers from query string per provider
    if (provider === 'workday')   { extra.tenantUrl = req.query.tenantUrl; extra.tenantId = req.query.tenantId; }
    if (provider === 'snowflake') { extra.accountId = req.query.accountId; }
    if (provider === 'sap')       { extra.tenantUrl = req.query.tenantUrl; extra.subdomain = req.query.subdomain; }
    if (provider === 'oracle')    { extra.tenantUrl = req.query.tenantUrl; }
    if (provider === 'tableau')   { extra.tenantUrl = req.query.tenantUrl; extra.siteName = req.query.siteName; }
    if (provider === 'marketo')   { extra.munchkinId = req.query.munchkinId; }
    pendingStates.set(state, { userId: user.id, providerId: provider, extra, createdAt: Date.now() });

    const url = buildAuthUrl(provider, state, extra);
    res.redirect(url);
  } catch (err) {
    console.error('[oauth/connect]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/oauth/:provider/callback ────────────────────────────────────────
router.get('/:provider/callback', async (req, res) => {
  const appBase = process.env.APP_BASE_URL || 'http://localhost:5173';
  try {
    const { provider } = req.params;
    const { code, state, error: oauthErr, realmId } = req.query;

    if (oauthErr) {
      return res.redirect(`${appBase}/admin?oauthError=${encodeURIComponent(oauthErr)}&provider=${provider}`);
    }

    const pending = pendingStates.get(state);
    if (!pending || pending.providerId !== provider) {
      return res.redirect(`${appBase}/admin?oauthError=invalid_state&provider=${provider}`);
    }
    pendingStates.delete(state);

    const extra = { ...pending.extra };
    if (realmId) extra.realmId = realmId;

    const tokens = await exchangeCode(provider, code, extra);
    const accessToken = tokens.access_token;
    const refreshTok = tokens.refresh_token || null;
    const expiresIn = tokens.expires_in || 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    // Fetch identity from provider
    const p = PROVIDERS[provider];
    let externalId = null;
    let label = provider;
    try {
      const identity = await p.fetchIdentity(accessToken, { ...extra, instanceUrl: tokens.instance_url });
      externalId = identity.externalId;
      label = identity.label;
      if (identity.instanceUrl) extra.instanceUrl = identity.instanceUrl;
    } catch (e) {
      console.warn(`[oauth] fetchIdentity failed for ${provider}:`, e.message);
    }

    const accessEnc = encrypt(accessToken);
    const refreshEnc = refreshTok ? encrypt(refreshTok) : null;
    const now = Date.now();

    await db.prepare(`
      INSERT INTO member_oauth_connections
        (user_id, provider, external_id, label, access_token_enc, refresh_token_enc,
         token_expires_at, scopes, metadata, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, provider) DO UPDATE SET
        external_id       = EXCLUDED.external_id,
        label             = EXCLUDED.label,
        access_token_enc  = EXCLUDED.access_token_enc,
        refresh_token_enc = EXCLUDED.refresh_token_enc,
        token_expires_at  = EXCLUDED.token_expires_at,
        scopes            = EXCLUDED.scopes,
        metadata          = EXCLUDED.metadata,
        updated_at        = EXCLUDED.updated_at
    `).run(
      pending.userId, provider, externalId, label, accessEnc, refreshEnc,
      expiresAt, p.scopes.join(' '), JSON.stringify(extra), now,
    );

    res.redirect(`${appBase}/admin?oauthSuccess=${provider}`);
  } catch (err) {
    console.error('[oauth/callback]', err);
    const appBase = process.env.APP_BASE_URL || 'http://localhost:5173';
    res.redirect(`${appBase}/admin?oauthError=${encodeURIComponent(err.message)}`);
  }
});

// ── POST /api/oauth/supabase/pat ─────────────────────────────────────────────
// Supabase personal access token fallback (for members not on partner OAuth).
router.post('/supabase/pat', express.json(), async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { pat, projectRef } = req.body;
    if (!pat) return res.status(400).json({ error: 'pat is required' });

    // Verify the PAT works
    const r = await fetch('https://api.supabase.com/v1/profile', {
      headers: { Authorization: `Bearer ${pat}` },
    });
    if (!r.ok) return res.status(400).json({ error: 'Invalid Supabase personal access token' });
    const profile = await r.json();

    const accessEnc = encrypt(pat);
    const now = Date.now();
    const meta = projectRef ? { projectRef } : {};

    await db.prepare(`
      INSERT INTO member_oauth_connections
        (user_id, provider, external_id, label, access_token_enc, refresh_token_enc,
         token_expires_at, scopes, metadata, updated_at)
      VALUES ($1, 'supabase', $2, $3, $4, NULL, NULL, 'all', $5, $6)
      ON CONFLICT (user_id, provider) DO UPDATE SET
        external_id = EXCLUDED.external_id, label = EXCLUDED.label,
        access_token_enc = EXCLUDED.access_token_enc, metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at
    `).run(user.id, profile.id, profile.username || 'Supabase', accessEnc, JSON.stringify(meta), now);

    res.json({ ok: true, label: profile.username || 'Supabase' });
  } catch (err) {
    console.error('[oauth/supabase/pat]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/oauth/connections ────────────────────────────────────────────────
// Returns the member's active connections (no tokens exposed).
router.get('/connections', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const rows = await db.prepare(`
      SELECT provider, external_id, label, token_expires_at, scopes, metadata, allow_write, updated_at
      FROM member_oauth_connections WHERE user_id = $1 ORDER BY provider
    `).all(user.id);

    // Annotate each row with provider display info
    const connections = rows.map((r) => {
      const p = PROVIDERS[r.provider] || {};
      return {
        provider: r.provider,
        label: p.label || r.provider,
        icon: p.icon || '🔌',
        description: p.description || '',
        connectedAs: r.label,
        externalId: r.external_id,
        expiresAt: r.token_expires_at,
        scopes: r.scopes,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
        allowWrite: r.allow_write,
        connectedAt: r.updated_at,
      };
    });

    // Also return list of unconnected providers
    const connectedIds = new Set(connections.map((c) => c.provider));
    const available = PROVIDER_IDS
      .filter((id) => !connectedIds.has(id))
      .map((id) => {
        const p = PROVIDERS[id];
        return { provider: id, label: p.label, icon: p.icon, description: p.description };
      });

    res.json({ connections, available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/oauth/connections/:provider ────────────────────────────────────
// Update allow_write flag.
router.patch('/connections/:provider', express.json(), async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const { allowWrite } = req.body;
    await db.prepare(`
      UPDATE member_oauth_connections SET allow_write = $1, updated_at = $2
      WHERE user_id = $3 AND provider = $4
    `).run(!!allowWrite, Date.now(), user.id, req.params.provider);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/oauth/connections/:provider ───────────────────────────────────
router.delete('/connections/:provider', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    await db.prepare(`
      DELETE FROM member_oauth_connections WHERE user_id = $1 AND provider = $2
    `).run(user.id, req.params.provider);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Internal: get a live access token (auto-refresh if needed) ───────────────
export async function getLiveToken(userId, providerId) {
  const row = await db.prepare(`
    SELECT access_token_enc, refresh_token_enc, token_expires_at, metadata
    FROM member_oauth_connections WHERE user_id = $1 AND provider = $2
  `).get(userId, providerId);

  if (!row) return null;

  const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;

  // If token is still valid (with 60s buffer), return it
  if (!row.token_expires_at || row.token_expires_at > Date.now() + 60_000) {
    return { token: decrypt(row.access_token_enc), metadata: meta };
  }

  // Try to refresh
  if (!row.refresh_token_enc) return null;
  const refreshTok = decrypt(row.refresh_token_enc);
  try {
    const tokens = await refreshToken(providerId, refreshTok, meta);
    const newAccessEnc = encrypt(tokens.access_token);
    const newRefreshEnc = tokens.refresh_token ? encrypt(tokens.refresh_token) : row.refresh_token_enc;
    const expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;

    await db.prepare(`
      UPDATE member_oauth_connections
      SET access_token_enc = $1, refresh_token_enc = $2, token_expires_at = $3, updated_at = $4
      WHERE user_id = $5 AND provider = $6
    `).run(newAccessEnc, newRefreshEnc, expiresAt, Date.now(), userId, providerId);

    return { token: tokens.access_token, metadata: meta };
  } catch (e) {
    console.error(`[oauth] refresh failed for ${providerId}:`, e.message);
    return null;
  }
}

export default router;
