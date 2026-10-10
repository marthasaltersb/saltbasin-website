// Live release tracker API (docs/changes/live-release-tracker.md).
//
// Permission model (the same one the UI and the MCP tool descriptors use):
//   admin            everything
//   granted member   read state + stream (email listed on the Settings tab)
//   share token      read state + stream via /shared/:token/*
//   ingest token     POST /snapshots only, for the release it was made for
import crypto from 'node:crypto';
import { Router } from 'express';
import { getUserFromCookie } from '../auth.js';
import { assertReadyToFinalize, sendFinalizationError, FinalizationBlockedError } from '../lib/finalizationGates.js';
import {
  TrackerError, loadSettings, saveSettings, generateWebhookSecret, setWebhookSecret, webhookSecret,
  ingestSnapshot, getState, listSnapshots, listIngestLog, createToken, listTokens, revokeToken, verifyToken,
  viewerKindForUser, shareTokenAllowed, pullFromRepo, subscribe, streamClientCount,
} from '../lib/releaseTrackerService.js';
import { jsonProblemMessage } from '../lib/friendlyErrors.js';

const router = Router();
const fail = (res, e) => {
  if (!(e instanceof TrackerError) && !e.status) console.error('[release-tracker]', e);
  res.status(e.status || 500).json({ error: e.message, code: e.code });
};
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { fail(res, e); } };

async function sessionUser(req) { try { return await getUserFromCookie(req); } catch { return null; } }
const bearer = (req) => { const h = req.headers.authorization || ''; return /^Bearer\s+/i.test(h) ? h.replace(/^Bearer\s+/i, '').trim() : null; };

async function requireAdmin(req, res) {
  const user = await sessionUser(req);
  if (!user) { res.status(401).json({ error: 'Sign in to use the release tracker', code: 'not_authenticated' }); return null; }
  if (user.role !== 'admin') { res.status(403).json({ error: 'Only an admin can do this', code: 'admin_only' }); return null; }
  return user;
}
/** Admin or a member whose email is granted on the Settings tab. */
async function requireViewer(req, res) {
  const user = await sessionUser(req);
  if (!user) { res.status(401).json({ error: 'Sign in to use the release tracker', code: 'not_authenticated' }); return null; }
  const kind = await viewerKindForUser(user);
  if (!kind) { res.status(403).json({ error: 'You do not have access to the release tracker. Ask an admin to add your email on its Settings tab.', code: 'tracker_access_denied' }); return null; }
  return { user, kind };
}

// ── Who am I (so the screen can pick what to show) ──────────────────────────
router.get('/access', wrap(async (req, res) => {
  const user = await sessionUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in to use the release tracker', code: 'not_authenticated' });
  const kind = await viewerKindForUser(user);
  res.json({ kind, canView: !!kind, isAdmin: kind === 'admin' });
}));

// ── Read ────────────────────────────────────────────────────────────────────
router.get('/state', wrap(async (req, res) => {
  const v = await requireViewer(req, res); if (!v) return;
  const state = await getState({ releaseKey: req.query.release ? String(req.query.release) : null });
  res.json({ viewer: v.kind, state });
}));

router.get('/stream', wrap(async (req, res) => {
  const v = await requireViewer(req, res); if (!v) return;
  subscribe(res, { kind: v.kind, user: v.user });
}));

router.get('/shared/:token/state', wrap(async (req, res) => {
  const t = await shareTokenAllowed(req.params.token);
  if (!t) return res.status(403).json({ error: 'This share link is not valid. It may have been revoked or switched off.', code: 'share_invalid' });
  res.json({ viewer: 'share', state: await getState({ releaseKey: t.releaseKey }) });
}));
router.get('/shared/:token/stream', wrap(async (req, res) => {
  const t = await shareTokenAllowed(req.params.token);
  if (!t) return res.status(403).json({ error: 'This share link is not valid. It may have been revoked or switched off.', code: 'share_invalid' });
  subscribe(res, { kind: 'share', tokenPlain: req.params.token });
}));

// ── Ingest (push) ───────────────────────────────────────────────────────────
router.post('/snapshots', wrap(async (req, res) => {
  const plain = bearer(req);
  let tokenReleaseKey = null; let sourceRef;
  if (plain) {
    const t = await verifyToken(plain, 'ingest');
    if (!t) return res.status(401).json({ error: 'That ingest token is not valid. It may have been revoked.', code: 'token_invalid' });
    tokenReleaseKey = t.releaseKey; sourceRef = `ingest token #${t.id}`;
  } else {
    const admin = await requireAdmin(req, res); if (!admin) return;
    sourceRef = `admin ${admin.email || admin.id}`;
  }
  const body = req.body || {};
  const snapshot = typeof body.snapshot === 'string' ? safeParse(body.snapshot, 'snapshot') : body.snapshot;
  const history = typeof body.history === 'string' ? safeParse(body.history, 'history') : body.history;
  const updates = typeof body.updates === 'string' ? safeParse(body.updates, 'updates') : body.updates;
  const out = await ingestSnapshot({ source: plain ? 'push' : 'manual', sourceRef, snapshot, history: history ?? null, updates: updates ?? null, tokenReleaseKey, releaseKey: body.releaseKey || null, commit: body.commit || null });
  res.status(out.outcome === 'stored' ? 201 : 200).json(out);
}));
function safeParse(text, what) {
  try { return JSON.parse(text); } catch (e) { throw new TrackerError(jsonProblemMessage(what, e), 400, 'json_invalid'); }
}

// ── Pull ────────────────────────────────────────────────────────────────────
router.post('/pull', wrap(async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  res.json(await pullFromRepo({ source: 'pull' }));
}));

// GitHub push webhook. Registered with the raw body in server/index.js so the
// HMAC is computed over exactly the bytes GitHub signed.
export async function githubWebhookHandler(req, res) {
  try {
    const secret = await webhookSecret();
    if (!secret) return res.status(503).json({ error: 'No webhook secret is set. Generate one on the Settings tab.', code: 'webhook_not_configured' });
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
    const given = String(req.headers['x-hub-signature-256'] || '');
    const want = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
    const a = Buffer.from(given); const b = Buffer.from(want);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'The webhook signature does not match', code: 'webhook_bad_signature' });
    const event = String(req.headers['x-github-event'] || '');
    if (event === 'ping') return res.json({ ok: true, pong: true });
    if (event !== 'push') return res.json({ ok: true, ignored: `event ${event}` });
    let payload = {};
    try { payload = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).json({ error: 'The webhook body is not JSON', code: 'json_invalid' }); }
    const s = await loadSettings();
    if (s.repo && payload.repository?.full_name && payload.repository.full_name.toLowerCase() !== s.repo.toLowerCase()) {
      return res.json({ ok: true, ignored: `repository ${payload.repository.full_name}` });
    }
    if (payload.ref && payload.ref !== `refs/heads/${s.branch}`) return res.json({ ok: true, ignored: `branch ${payload.ref}` });
    const out = await pullFromRepo({ source: 'webhook', commit: payload.after ? String(payload.after).slice(0, 40) : null });
    res.json({ ok: true, ...out });
  } catch (e) { fail(res, e); }
}

// ── Settings, tokens, logs (admin) ──────────────────────────────────────────
router.get('/settings', wrap(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ settings: await loadSettings(), liveViewers: streamClientCount() });
}));
router.put('/settings', wrap(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ settings: await saveSettings(req.body?.settings) });
}));
router.post('/settings/webhook-secret', wrap(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  if (req.body?.clear) { await setWebhookSecret(null); return res.json({ cleared: true }); }
  res.status(201).json({ secret: await generateWebhookSecret() });
}));

router.get('/tokens', wrap(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ tokens: await listTokens() });
}));
router.post('/tokens', async (req, res) => {
  try {
    const admin = await requireAdmin(req, res); if (!admin) return;
    const kind = req.body?.kind;
    // A share token publishes the tracker to anyone holding the link: finalize path.
    if (kind === 'share') await assertReadyToFinalize(admin.id);
    const out = await createToken({ kind, releaseKey: req.body?.releaseKey, label: req.body?.label, actor: admin });
    res.status(201).json(out);
  } catch (e) {
    if (e instanceof FinalizationBlockedError) return sendFinalizationError(res, e);
    return fail(res, e);
  }
});
router.delete('/tokens/:id', wrap(async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  res.json(await revokeToken(Number(req.params.id), admin));
}));

router.get('/snapshots', wrap(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ snapshots: await listSnapshots(req.query.limit) });
}));
router.get('/ingest-log', wrap(async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  res.json({ log: await listIngestLog(req.query.limit) });
}));

export default router;
