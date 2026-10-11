// Live release tracker service (docs/changes/live-release-tracker.md).
//
// One server module behind every interface: the REST routes
// (server/routes/releaseTracker.js), the Settings screen, the GitHub pull
// poller/webhook and (once server/lib/mcpToolRegistry.js exists) the MCP tools
// described by RELEASE_TRACKER_TOOLS. They all call the functions below with
// the same permission model.
//
// Data rules
//  - Append-only: every accepted snapshot is a new row in
//    release_tracker_snapshots. Nothing is overwritten, so the history slider
//    can replay any recorded state. A snapshot whose content is identical to
//    the newest one for that release is reported as "unchanged" (logged, not
//    stored again) so polling does not bloat history.
//  - Reuse: release_* tables created by releaseIntelligenceSchema.js hold the
//    reconciled view; each stored snapshot is also handed to
//    releaseLogImporter.importSnapshot so Release Intelligence stays in step.
//  - Labels and counts only: ingest clips every string and drops unknown keys.
//    Non-admin viewers see exactly what is stored.
import { annotateFeatures } from './releaseScope.js';
import { worldObjectData } from '../../src/lib/trackerWorld/trackerWorldEngine.js';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { db, getJSON, setJSON } from '../db.js';
import { ensureReleaseIntelligenceSchema } from './releaseIntelligenceSchema.js';
import { importSnapshot } from './releaseLogImporter.js';
import { encrypt, decrypt } from './crypto.js';

export const SETTINGS_ROW_ID = 'release_tracker_settings';
export const BACKLOG_STATUSES = ['backlog_pre_existing', 'reassigned', 'process_note'];
const PERSON_STATUSES = ['needs_human', 'needs_business_definition'];

export const DEFAULT_SETTINGS = Object.freeze({
  repo: '',
  branch: 'main',
  sourceBaseUrl: 'https://raw.githubusercontent.com',
  pullIntervalMinutes: 0,
  releaseKey: '',
  paths: Object.freeze({
    state: 'docs/release-log/active-release.state.json',
    history: 'docs/release-log/history.json',
    updates: 'docs/release-log/updates.json',
    features: 'docs/release-log/active-release.features.json',
  }),
  memberEmails: [],
  shareLinksEnabled: true,
});

export class TrackerError extends Error {
  constructor(message, status = 400, code = 'tracker_error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ── Settings ────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH_RE = /^[A-Za-z0-9_./-]+$/;

async function rawSettings() {
  let stored = null;
  try { stored = await getJSON('config_state', SETTINGS_ROW_ID); } catch (e) {
    throw new TrackerError(`The saved tracker settings could not be read: ${e.message}`, 500, 'settings_unreadable');
  }
  const s = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  return { ...DEFAULT_SETTINGS, ...s, paths: { ...DEFAULT_SETTINGS.paths, ...(s.paths || {}) }, memberEmails: Array.isArray(s.memberEmails) ? s.memberEmails : [] };
}

/** Settings as the screen sees them: the webhook secret is never returned. */
export async function loadSettings() {
  const { webhookSecretEnc, ...s } = await rawSettings();
  return { ...s, webhookSecretSet: !!webhookSecretEnc };
}

export function validateSettings(input) {
  const errors = [];
  const src = input && typeof input === 'object' && !Array.isArray(input) ? input : null;
  if (!src) return { settings: null, errors: ['Settings must be an object'] };
  const out = {};
  out.repo = String(src.repo ?? '').trim();
  if (out.repo && !REPO_RE.test(out.repo)) errors.push('Repository must look like owner/name');
  out.branch = String(src.branch ?? 'main').trim() || 'main';
  if (!BRANCH_RE.test(out.branch) || out.branch.includes('..')) errors.push('Branch contains characters a branch name cannot have');
  out.sourceBaseUrl = String(src.sourceBaseUrl ?? DEFAULT_SETTINGS.sourceBaseUrl).trim().replace(/\/+$/, '');
  try {
    const u = new URL(out.sourceBaseUrl);
    if (!['http:', 'https:'].includes(u.protocol)) errors.push('Source base URL must start with http:// or https://');
  } catch { errors.push('Source base URL is not a valid URL'); }
  const iv = Number(src.pullIntervalMinutes ?? 0);
  if (!Number.isInteger(iv) || iv < 0 || iv > 1440) errors.push('Poll interval must be a whole number of minutes from 0 (off) to 1440');
  out.pullIntervalMinutes = iv;
  out.releaseKey = String(src.releaseKey ?? '').trim();
  if (out.releaseKey && !/^[A-Za-z0-9_.-]+$/.test(out.releaseKey)) errors.push('Release key may only contain letters, numbers, dots, dashes and underscores');
  const paths = {};
  for (const k of Object.keys(DEFAULT_SETTINGS.paths)) {
    const v = String(src.paths?.[k] ?? DEFAULT_SETTINGS.paths[k]).trim();
    if (!v || v.startsWith('/') || v.includes('..')) errors.push(`The ${k} file path must be relative to the repository root`);
    paths[k] = v;
  }
  out.paths = paths;
  const emails = [];
  for (const raw of Array.isArray(src.memberEmails) ? src.memberEmails : []) {
    const e = String(raw || '').trim().toLowerCase();
    if (!e) continue;
    if (!EMAIL_RE.test(e)) errors.push(`"${e}" is not a valid email address`);
    else if (!emails.includes(e)) emails.push(e);
  }
  out.memberEmails = emails;
  out.shareLinksEnabled = src.shareLinksEnabled !== false;
  return { settings: out, errors };
}

export async function saveSettings(input) {
  const { settings, errors } = validateSettings(input);
  if (errors.length) throw new TrackerError(errors.join('; '), 400, 'settings_invalid');
  const prev = await rawSettings();
  const next = { ...settings, webhookSecretEnc: prev.webhookSecretEnc || null };
  await setJSON('config_state', SETTINGS_ROW_ID, next);
  const { webhookSecretEnc, ...pub } = next;
  accessChanged().catch(() => {});
  return { ...pub, webhookSecretSet: !!webhookSecretEnc };
}

export async function setWebhookSecret(plain) {
  const prev = await rawSettings();
  const next = { ...prev, webhookSecretEnc: plain ? encrypt(String(plain)) : null };
  await setJSON('config_state', SETTINGS_ROW_ID, next);
}

export async function generateWebhookSecret() {
  const secret = crypto.randomBytes(24).toString('hex');
  await setWebhookSecret(secret);
  return secret;
}

export async function webhookSecret() {
  const s = await rawSettings();
  return s.webhookSecretEnc ? decrypt(s.webhookSecretEnc) : null;
}

// ── Sanitising ingested JSON ────────────────────────────────────────────────
const MAX_STR = 1200;
const MAX_ITEMS = 4000;
function clipDeep(v, depth = 0) {
  if (typeof v === 'string') return v.length > MAX_STR ? `${v.slice(0, MAX_STR - 1)}…` : v;
  if (Array.isArray(v)) return v.slice(0, MAX_ITEMS).map((x) => clipDeep(x, depth + 1));
  if (v && typeof v === 'object') {
    if (depth > 8) return null;
    const o = {};
    for (const [k, x] of Object.entries(v)) { if (k === '__proto__' || k === 'constructor') continue; o[k] = clipDeep(x, depth + 1); }
    return o;
  }
  return v;
}
const isoOk = (s) => typeof s === 'string' && !Number.isNaN(Date.parse(s));
const SNAPSHOT_KEYS = ['release', 'updates', 'runId', 'syncedAt', 'maxFixAttemptsPerBug', 'repoUrl', 'maxFixRounds', 'features', 'agents', 'bugs', 'totals', 'agentsTrimmed'];

/** Validate + clean a tracker snapshot (the shape scripts/release-tracker-sync.mjs writes). */
export function sanitizeSnapshot(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TrackerError('The snapshot must be a JSON object with features, agents and bugs', 400, 'snapshot_invalid');
  if (!Array.isArray(input.features)) throw new TrackerError('The snapshot has no "features" list', 400, 'snapshot_invalid');
  const snap = {};
  for (const k of SNAPSHOT_KEYS) if (input[k] !== undefined) snap[k] = clipDeep(input[k]);
  snap.features = (snap.features || []).filter((f) => f && typeof f.key === 'string' && f.key);
  if (!snap.features.length) throw new TrackerError('The snapshot lists no features with a "key"', 400, 'snapshot_invalid');
  snap.agents = Array.isArray(snap.agents) ? snap.agents.filter((a) => a && typeof a === 'object') : [];
  snap.bugs = Array.isArray(snap.bugs) ? snap.bugs.filter((b) => b && typeof b.id === 'string') : [];
  snap.updates = Array.isArray(snap.updates) ? snap.updates.filter((u) => u && typeof u.version === 'string' && isoOk(u.at)) : [];
  snap.totals = snap.totals && typeof snap.totals === 'object' ? snap.totals : { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  snap.maxFixAttemptsPerBug = Number(snap.maxFixAttemptsPerBug) || 2;
  if (!isoOk(snap.syncedAt)) snap.syncedAt = new Date().toISOString();
  return snap;
}

const POINT_REQUIRED = 8;
/** Validate a history document ({ points, updates }); invalid points are dropped and counted. */
export function sanitizeHistory(input) {
  if (input == null) return { history: null, dropped: 0 };
  if (typeof input !== 'object' || !Array.isArray(input.points)) throw new TrackerError('The history must be an object with a "points" list', 400, 'history_invalid');
  let dropped = 0;
  const points = [];
  for (const p of input.points) {
    if (p && isoOk(p.t) && p.f && typeof p.f === 'object' && Object.values(p.f).every((v) => Array.isArray(v) && v.length >= POINT_REQUIRED)) {
      points.push({ t: p.t, c: typeof p.c === 'string' ? p.c.slice(0, 64) : null, f: clipDeep(p.f) });
    } else dropped += 1;
  }
  points.sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  const updates = (Array.isArray(input.updates) ? input.updates : [])
    .filter((u) => u && typeof u.version === 'string' && isoOk(u.at))
    .map((u) => ({ version: u.version, at: u.at, headline: u.headline ? String(u.headline).slice(0, 300) : null, commit: u.commit ? String(u.commit).slice(0, 64) : null }));
  return { history: { points, updates }, dropped };
}

/** One recorded state derived from a snapshot: f[key] = [status, round, passed, total, open, verified, backlog, person]. */
export function derivePoint(snapshot, commit = null) {
  const f = {};
  for (const ft of snapshot.features) {
    const mine = (snapshot.bugs || []).filter((b) => b.feature === ft.key && b.status !== 'seen_in_test');
    const open = mine.filter((b) => b.status !== 'verified' && !BACKLOG_STATUSES.includes(b.status));
    const r = ft.lastResult;
    f[ft.key] = [
      ft.status || 'queued', r?.round ?? null, r?.stepsPassed ?? 0, r?.stepsTotal ?? null,
      open.length, mine.filter((b) => b.status === 'verified').length,
      mine.filter((b) => BACKLOG_STATUSES.includes(b.status)).length,
      mine.filter((b) => PERSON_STATUSES.includes(b.status)).length,
    ];
  }
  return { t: snapshot.syncedAt, c: commit || snapshot.release?.commit || null, f };
}

// ── Committed files (pull) -> snapshot ──────────────────────────────────────
const parseScore = (s) => { const m = /^(\d+)\s*\/\s*(\d+)$/.exec(String(s || '')); return m ? [Number(m[1]), Number(m[2])] : null; };

/** Turn the four committed release-log files into a snapshot + history. Pure. */
export function normalizeCommitted({ state, history, updates, features }, { fallbackNow = new Date().toISOString() } = {}) {
  if (!state || typeof state !== 'object' || (!state.features && !state.bugs)) throw new TrackerError('The state file has no "features" or "bugs"', 400, 'state_invalid');
  const sf = state.features && typeof state.features === 'object' ? state.features : {};
  const defs = Array.isArray(features?.features) ? features.features : [];
  const keys = [...new Set([...Object.keys(sf), ...defs.map((d) => d.key).filter(Boolean)])];
  const feats = keys.map((key) => {
    const s = sf[key] || {};
    const sc = parseScore(s.lastScore);
    return {
      key, status: s.status || 'queued', rounds: Number(s.lastRound) || 0,
      lastResult: sc ? { round: Number(s.lastRound) || 0, passed: sc[0] === sc[1], stepsPassed: sc[0], stepsTotal: sc[1], baseline: s.baseline ?? null, report: s.lastReport || null } : null,
      openBugs: Number(s.openBugs) || 0, backlog: Number(s.backlog) || 0, agents: 0,
    };
  });
  const scoped = defs.length ? annotateFeatures(feats, defs) : feats;   // planned / backlog / added after the cut
  const snapshot = {
    release: features ? { version: features.version || null, release: features.release || null, title: features.title || null } : null,
    updates: Array.isArray(updates) ? updates : [],
    runId: null,
    syncedAt: isoOk(state.exportedAt) ? state.exportedAt : fallbackNow,
    maxFixAttemptsPerBug: 2,
    repoUrl: features?.repoUrl || null,
    features: scoped,
    agents: [],
    bugs: Array.isArray(state.bugs) ? state.bugs : [],
    totals: { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 },
  };
  return { snapshot, history: history || null };
}

// ── Ingest ──────────────────────────────────────────────────────────────────
const hashOf = (obj) => crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');

async function logIngest(source, outcome, detail, snapshotId = null) {
  try {
    await db.prepare(`INSERT INTO release_tracker_ingest_log (at, source, outcome, detail, snapshot_id) VALUES ($1,$2,$3,$4,$5)`)
      .run(Date.now(), source, outcome, detail ? String(detail).slice(0, 600) : null, snapshotId);
  } catch (e) { console.error('[release-tracker] could not write the ingest log:', e.message); }
}

/**
 * Store one snapshot (append-only). Returns { outcome: 'stored'|'unchanged', id, releaseKey, reconcileNote }.
 * Throws TrackerError for a rejected snapshot (and logs the rejection).
 */
export async function ingestSnapshot({ source, sourceRef = null, releaseKey = null, snapshot, history = null, updates = null, commit = null, contentHash = null, tokenReleaseKey = null }) {
  await ensureReleaseIntelligenceSchema();
  try {
    const snap = sanitizeSnapshot(snapshot);
    if (updates && Array.isArray(updates) && !snap.updates.length) snap.updates = sanitizeSnapshot({ ...snap, features: snap.features, updates }).updates;
    const key = String(snap.release?.release || releaseKey || (await rawSettings()).releaseKey || 'unknown').trim() || 'unknown';
    if (tokenReleaseKey && key !== tokenReleaseKey) {
      throw new TrackerError(`This ingest token is for release "${tokenReleaseKey}" but the snapshot is for "${key}"`, 403, 'token_release_mismatch');
    }
    const { history: hist, dropped } = sanitizeHistory(history);
    const extras = { ...(hist ? { history: hist } : {}), ...(commit ? { commit } : {}), ...(dropped ? { droppedHistoryPoints: dropped } : {}) };
    const hash = contentHash || hashOf({ snap: { ...snap, syncedAt: undefined }, hist: hist ? { n: hist.points.length, last: hist.points.at(-1)?.t } : null });
    const last = await db.prepare(`SELECT id, content_hash FROM release_tracker_snapshots WHERE release_key=$1 ORDER BY id DESC LIMIT 1`).get(key);
    if (last && last.content_hash === hash) {
      await logIngest(source, 'unchanged', `Release ${key}: nothing new since snapshot ${last.id}`, Number(last.id));
      return { outcome: 'unchanged', id: Number(last.id), releaseKey: key, reconcileNote: null };
    }
    const snapAt = Date.parse(snap.syncedAt);
    const row = await db.prepare(
      `INSERT INTO release_tracker_snapshots (release_key, source, source_ref, content_hash, snapshot_at, received_at, snapshot, extras)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb) RETURNING id`,
    ).get(key, source, sourceRef, hash, snapAt, Date.now(), snap, extras);
    const id = Number(row.id);
    let reconcileNote = null;
    try { await importSnapshot(key, snap, { actor: null }); } catch (e) {
      reconcileNote = `Release Intelligence could not reconcile this snapshot: ${e.message}`;
      await db.prepare(`UPDATE release_tracker_snapshots SET reconcile_note=$1 WHERE id=$2`).run(reconcileNote, id);
    }
    await logIngest(source, 'stored', `Release ${key}: ${snap.features.length} features, ${snap.bugs.length} bugs${reconcileNote ? ` (${reconcileNote})` : ''}`, id);
    broadcast({ type: 'snapshot', id, releaseKey: key, receivedAt: Date.now() });
    return { outcome: 'stored', id, releaseKey: key, reconcileNote };
  } catch (e) {
    if (e instanceof TrackerError) await logIngest(source, 'rejected', e.message);
    else await logIngest(source, 'error', e.message);
    throw e;
  }
}

// ── Reading ─────────────────────────────────────────────────────────────────
export async function getState({ releaseKey = null } = {}) {
  await ensureReleaseIntelligenceSchema();
  const latest = releaseKey
    ? await db.prepare(`SELECT * FROM release_tracker_snapshots WHERE release_key=$1 ORDER BY id DESC LIMIT 1`).get(releaseKey)
    : await db.prepare(`SELECT * FROM release_tracker_snapshots ORDER BY id DESC LIMIT 1`).get();
  if (!latest) return null;
  const rows = await db.prepare(
    `SELECT id, snapshot_at, source, snapshot, extras FROM release_tracker_snapshots WHERE release_key=$1 ORDER BY id DESC LIMIT 600`,
  ).all(latest.release_key);
  rows.reverse();
  // Base history: the newest document that carried one; later snapshots add derived states after it.
  let base = null;
  for (let i = rows.length - 1; i >= 0; i -= 1) { if (rows[i].extras?.history?.points?.length) { base = rows[i].extras.history; break; } }
  const points = base ? base.points.map((p) => ({ ...p })) : [];
  let lastT = points.length ? Date.parse(points[points.length - 1].t) : -Infinity;
  for (const r of rows) {
    const t = Date.parse(r.snapshot.syncedAt);
    if (t > lastT) { points.push(derivePoint(r.snapshot, r.extras?.commit || null)); lastT = t; }
  }
  const snapshot = latest.snapshot;
  const updates = base?.updates?.length && (snapshot.updates || []).length <= base.updates.length
    ? base.updates
    : (snapshot.updates || []).map((u) => ({ version: u.version, at: u.at, headline: u.headline || null, commit: u.commit || null }));
  const count = await db.prepare(`SELECT COUNT(*)::int AS n FROM release_tracker_snapshots WHERE release_key=$1`).get(latest.release_key);
  const rels = await db.prepare(`SELECT release_key, COUNT(*)::int AS n, MAX(received_at) AS last FROM release_tracker_snapshots GROUP BY release_key ORDER BY MAX(id) DESC`).all();
  return {
    releases: rels.map((r) => ({ releaseKey: r.release_key, snapshotCount: Number(r.n), lastReceivedAt: Number(r.last) })),
    meta: { id: Number(latest.id), releaseKey: latest.release_key, receivedAt: Number(latest.received_at), snapshotAt: Number(latest.snapshot_at), source: latest.source, sourceRef: latest.source_ref, snapshotCount: Number(count.n), reconcileNote: latest.reconcile_note || null },
    snapshot,
    history: { points, updates },
  };
}

// One object of the World as data: the related objects the world highlights, the journey rows, and what changed since
// a chosen historic point. The screen (src/lib/trackerWorld) computes the same thing with the same function.
//   object: a trail token such as feature:<key>, bug:<id>, agent:<id>, round:<key>:<n>, scope:planned|added|backlog
//   at:     a history point index (Historic) or null / "current" (Current)
export async function getWorldObject({ releaseKey = null, object = '', at = null } = {}) {
  const obj = String(object || '').trim();
  if (!obj) throw new TrackerError('Say which object to open, for example feature:<key>, bug:<id>, agent:<id>, round:<key>:<n> or scope:planned.', 400, 'object_required');
  let idx = null;
  if (at !== null && at !== undefined && at !== '' && at !== 'current') {
    idx = Number(at);
    if (!Number.isInteger(idx) || idx < 0) throw new TrackerError('The point in time must be a whole number from 0 (the earliest recorded state), or "current".', 400, 'at_invalid');
  }
  const state = await getState({ releaseKey });
  if (!state) throw new TrackerError('No release data has arrived yet, so there is nothing to open.', 404, 'tracker_empty');
  if (idx != null && idx > state.history.points.length - 1) throw new TrackerError(`This release has ${state.history.points.length} recorded states, so the point in time must be between 0 and ${state.history.points.length - 1}.`, 400, 'at_invalid');
  const data = worldObjectData({ snap: state.snapshot, hist: state.history, object: obj, at: idx });
  if (!data) throw new TrackerError(`"${obj}" is not in release ${state.meta.releaseKey}. Check the object name against the list in the World's Objects panel.`, 404, 'object_not_found');
  return { releaseKey: state.meta.releaseKey, ...data };
}

export async function listSnapshots(limit = 50) {
  await ensureReleaseIntelligenceSchema();
  const rows = await db.prepare(
    `SELECT id, release_key, source, source_ref, snapshot_at, received_at, reconcile_note FROM release_tracker_snapshots ORDER BY id DESC LIMIT $1`,
  ).all(Math.min(Math.max(Number(limit) || 50, 1), 200));
  return rows.map((r) => ({ id: Number(r.id), releaseKey: r.release_key, source: r.source, sourceRef: r.source_ref, snapshotAt: Number(r.snapshot_at), receivedAt: Number(r.received_at), reconcileNote: r.reconcile_note || null }));
}

export async function listIngestLog(limit = 30) {
  await ensureReleaseIntelligenceSchema();
  const rows = await db.prepare(`SELECT id, at, source, outcome, detail, snapshot_id FROM release_tracker_ingest_log ORDER BY id DESC LIMIT $1`).all(Math.min(Math.max(Number(limit) || 30, 1), 200));
  return rows.map((r) => ({ id: Number(r.id), at: Number(r.at), source: r.source, outcome: r.outcome, detail: r.detail, snapshotId: r.snapshot_id == null ? null : Number(r.snapshot_id) }));
}

// ── Tokens (ingest + share) ─────────────────────────────────────────────────
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const TOKEN_KINDS = ['ingest', 'share'];

export async function createToken({ kind, releaseKey = null, label = '', actor }) {
  await ensureReleaseIntelligenceSchema();
  if (!TOKEN_KINDS.includes(kind)) throw new TrackerError('Token kind must be "ingest" or "share"', 400);
  const rk = String(releaseKey || '').trim() || null;
  if (kind === 'ingest' && !rk) throw new TrackerError('An ingest token belongs to one release: give the release key', 400);
  const token = `rt${kind === 'ingest' ? 'i' : 's'}_${crypto.randomBytes(24).toString('base64url')}`;
  const row = await db.prepare(
    `INSERT INTO release_tracker_tokens (kind, release_key, label, token_hash, token_hint, created_by, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
  ).get(kind, rk, String(label || '').slice(0, 120) || null, sha256(token), token.slice(-4), actor?.id ?? null, Date.now());
  return { id: Number(row.id), token, kind, releaseKey: rk, label: label || null };
}

export async function listTokens() {
  await ensureReleaseIntelligenceSchema();
  const rows = await db.prepare(`SELECT id, kind, release_key, label, token_hint, created_at, revoked_at, last_used_at FROM release_tracker_tokens ORDER BY id DESC`).all();
  return rows.map((r) => ({ id: Number(r.id), kind: r.kind, releaseKey: r.release_key, label: r.label, hint: r.token_hint, createdAt: Number(r.created_at), revokedAt: r.revoked_at == null ? null : Number(r.revoked_at), lastUsedAt: r.last_used_at == null ? null : Number(r.last_used_at) }));
}

export async function revokeToken(id, actor) {
  await ensureReleaseIntelligenceSchema();
  const row = await db.prepare(`UPDATE release_tracker_tokens SET revoked_at=$1, revoked_by=$2 WHERE id=$3 AND revoked_at IS NULL RETURNING id, kind`).get(Date.now(), actor?.id ?? null, id);
  if (!row) throw new TrackerError('That token does not exist or was already revoked', 404);
  accessChanged().catch(() => {});
  return { id: Number(row.id), revoked: true };
}

/** The live (not revoked) token row for a plaintext token of the given kind, or null. */
export async function verifyToken(plain, kind) {
  await ensureReleaseIntelligenceSchema();
  if (!plain || typeof plain !== 'string' || plain.length < 20 || plain.length > 200) return null;
  const row = await db.prepare(`SELECT id, kind, release_key FROM release_tracker_tokens WHERE token_hash=$1 AND revoked_at IS NULL`).get(sha256(plain));
  if (!row || row.kind !== kind) return null;
  db.prepare(`UPDATE release_tracker_tokens SET last_used_at=$1 WHERE id=$2`).run(Date.now(), row.id).catch(() => {});
  return { id: Number(row.id), kind: row.kind, releaseKey: row.release_key };
}

// ── Who may view ────────────────────────────────────────────────────────────
/** 'admin' | 'member' | null for a signed-in user. */
export async function viewerKindForUser(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'admin';
  const s = await rawSettings();
  return s.memberEmails.includes(String(user.email || '').toLowerCase()) ? 'member' : null;
}
export async function canViewTracker(user) { return !!(await viewerKindForUser(user)); }

export async function shareTokenAllowed(plain) {
  const s = await rawSettings();
  if (!s.shareLinksEnabled) return null;
  return verifyToken(plain, 'share');
}

// ── Pull (GitHub raw files) ─────────────────────────────────────────────────
async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'salt-basin-release-tracker' } });
  if (!res.ok) throw new TrackerError(`${url} answered ${res.status}`, res.status === 404 ? 404 : 502, 'pull_fetch_failed');
  return res.text();
}

export async function pullFromRepo({ source = 'pull', commit = null } = {}) {
  const s = await rawSettings();
  if (!s.repo) throw new TrackerError('No repository is configured. Set it on the Settings tab.', 400, 'pull_not_configured');
  const base = `${s.sourceBaseUrl}/${s.repo}/${s.branch}`;
  const texts = {};
  const missing = [];
  try {
    for (const k of ['state', 'features', 'history', 'updates']) {
      const url = `${base}/${s.paths[k]}`;
      try { texts[k] = await fetchText(url); } catch (e) {
        if (k === 'state') throw e;
        if (e.status === 404) missing.push(k); else throw e;
      }
    }
    const parsed = {};
    for (const [k, t] of Object.entries(texts)) {
      try { parsed[k] = JSON.parse(t); } catch (e) { throw new TrackerError(`The ${k} file in the repository could not be read, so nothing was pulled. Fix that file in the repository, then pull again.\nTechnical detail: ${e.message}`, 502, 'pull_bad_json'); }
    }
    const { snapshot, history } = normalizeCommitted(parsed);
    const res = await ingestSnapshot({
      source, sourceRef: `${s.repo}@${s.branch}`, releaseKey: s.releaseKey || null, snapshot, history, commit,
      contentHash: hashOf(texts),
    });
    return { ...res, missing };
  } catch (e) {
    if (!(e instanceof TrackerError) || !['rejected'].includes(e.code)) {
      await logIngest(source, 'error', e.message);
    }
    throw e;
  }
}

let pollTimer = null;
let lastPollAt = 0;
export function startReleaseTrackerPoller() {
  if (pollTimer) return;
  const tick = async () => {
    try {
      const s = await rawSettings();
      const every = s.pullIntervalMinutes * 60000;
      if (!every || !s.repo) return;
      if (Date.now() - lastPollAt < every) return;
      lastPollAt = Date.now();
      await pullFromRepo({ source: 'poll' });
    } catch (e) { console.error('[release-tracker] poll failed:', e.message); }
  };
  pollTimer = setInterval(tick, 20000);
  pollTimer.unref?.();
}
export function stopReleaseTrackerPoller() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

// ── Live stream (server-sent events) ────────────────────────────────────────
const hub = new EventEmitter();
hub.setMaxListeners(0);
const clients = new Set();

/** viewer = { kind: 'admin'|'member'|'share', userId?, tokenPlain? } */
export function subscribe(res, viewer) {
  res.status(200).set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();
  res.write(`retry: 3000\n\n`);
  const client = { res, viewer };
  clients.add(client);
  res.write(`event: hello\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`);
  const beat = setInterval(() => { try { res.write(`: keep-alive ${Date.now()}\n\n`); } catch { /* closed */ } }, 15000);
  const close = () => { clearInterval(beat); clients.delete(client); };
  res.on('close', close);
  return close;
}
export function broadcast(evt) {
  for (const c of clients) {
    try { c.res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`); } catch { clients.delete(c); }
  }
}
export function streamClientCount() { return clients.size; }

/** Access was edited or a token revoked: end every stream whose viewer is no longer allowed. */
export async function accessChanged() {
  for (const c of [...clients]) {
    let ok = false;
    try {
      if (c.viewer.kind === 'share') ok = !!(await shareTokenAllowed(c.viewer.tokenPlain));
      else ok = !!(await viewerKindForUser(c.viewer.user));
    } catch { ok = true; }
    if (!ok) {
      try { c.res.write(`event: denied\ndata: {}\n\n`); c.res.end(); } catch { /* closed */ }
      clients.delete(c);
    }
  }
}

// ── MCP tool descriptors ────────────────────────────────────────────────────
// server/lib/mcpToolRegistry.js registers release_tracker_get_state (same getState and viewer check as
// GET /api/release-tracker/state). The other descriptors below are not registered yet (parity gap row
// 'release-tracker-admin'). Each `handler` is the same function the REST route calls, and `viewerKinds` is
// the same permission the route enforces.
export const RELEASE_TRACKER_TOOLS = [
  { name: 'release_tracker_get_state', description: 'Latest release tracker snapshot, history points and numbered updates.', viewerKinds: ['admin', 'member'], handler: getState },
  { name: 'release_tracker_world_object', description: 'One World object as data: related objects, journey rows, what changed since a historic point.', viewerKinds: ['admin', 'member'], handler: getWorldObject },
  { name: 'release_tracker_list_snapshots', description: 'Every recorded snapshot (newest first).', viewerKinds: ['admin'], handler: listSnapshots },
  { name: 'release_tracker_ingest_snapshot', description: 'Store a snapshot, history and updates (append-only).', viewerKinds: ['admin', 'ingest-token'], handler: ingestSnapshot },
  { name: 'release_tracker_pull_now', description: 'Fetch the committed release-log files from the configured repository now.', viewerKinds: ['admin'], handler: pullFromRepo },
  { name: 'release_tracker_get_settings', description: 'Repository, branch, interval and access settings.', viewerKinds: ['admin'], handler: loadSettings },
  { name: 'release_tracker_save_settings', description: 'Edit repository, branch, interval, member access and share-link switch.', viewerKinds: ['admin'], handler: saveSettings },
  { name: 'release_tracker_create_token', description: 'Create an ingest or share token (plaintext returned once).', viewerKinds: ['admin'], handler: createToken },
  { name: 'release_tracker_revoke_token', description: 'Revoke an ingest or share token.', viewerKinds: ['admin'], handler: revokeToken },
];
