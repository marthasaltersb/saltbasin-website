// Release cut records (frozen per-release history) and session estimates tracked against each merge's test results.
// One implementation shared by the CLI (scripts/session-plan.mjs, scripts/release-cut.mjs), the API
// (server/routes/releaseCut.js) and the MCP tools (release_cut_* in server/lib/mcpToolRegistry.js).
// Files only (docs/release-log/**), no database table: a frozen release is a folder that is never rewritten,
// a session plan is one JSON file. Fictional data only (public repo). Docs: docs/changes/release-cut-and-session-plans.md
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { scopeOf, isAddedAfterCut } from './releaseScope.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
/** Repository root; SB_RELEASE_ROOT points the CLI and tests at another folder that holds docs/. */
export const releaseRoot = () => process.env.SB_RELEASE_ROOT || path.resolve(HERE, '../..');
const logDir = () => path.join(releaseRoot(), 'docs/release-log');
const plansDir = () => path.join(logDir(), 'session-plans');

export const SIZES = ['S', 'M', 'L'];
const BACKLOG = new Set(['backlog_pre_existing', 'reassigned', 'process_note']);
const PERSON = new Set(['needs_human', 'needs_business_definition']);
const DONE = new Set(['passed', 'passed_with_backlog']);

export function problem(message, status = 400, code = 'bad_request') {
  return Object.assign(new Error(message), { status, code });
}
const rd = (p, d = null) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

export function gitHead() {
  const tries = [releaseRoot(), path.resolve(HERE, '../..')];
  for (const cwd of tries) {
    try { return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* try next */ }
  }
  return null;
}

export function activeDefs() {
  const d = rd(path.join(logDir(), 'active-release.features.json'));
  if (!d) throw problem('The open release has no feature list yet (docs/release-log/active-release.features.json is missing).', 404, 'not_found');
  return d;
}

export function baselineOf(key) {
  const d = path.join(releaseRoot(), 'docs/training/baselines', key);
  try { const n = Math.max(...fs.readdirSync(d).map((f) => Number((f.match(/^v(\d+)\.json$/) || [])[1])).filter(Boolean)); return Number.isFinite(n) ? n : null; } catch { return null; }
}

/** One row per feature of a release: status and score from the state file, bug counts from its bugs. */
export function featureRows(defs, state) {
  return defs.features.map((f) => {
    const s = state?.features?.[f.key] || {};
    const bugs = (state?.bugs || []).filter((b) => b.feature === f.key && b.status !== 'seen_in_test');
    return {
      key: f.key, title: f.title, kind: f.kind || 'new', scope: scopeOf(f), ...(isAddedAfterCut(f) ? { added: f.added } : {}), status: s.status || 'not_started', lastRound: s.lastRound ?? null,
      lastScore: s.lastScore ?? null, baseline: baselineOf(f.key), delivered: DONE.has(s.status),
      bugs: {
        verified: bugs.filter((b) => b.status === 'verified').length,
        backlog: bugs.filter((b) => BACKLOG.has(b.status)).length,
        needsPerson: bugs.filter((b) => PERSON.has(b.status)).length,
        open: bugs.filter((b) => b.status !== 'verified' && !BACKLOG.has(b.status)).length,
      },
    };
  });
}

function readPlans() {
  const d = plansDir();
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort().map((f) => rd(path.join(d, f))).filter(Boolean);
}

// ── Releases ────────────────────────────────────────────────────────────────
export function listReleases() {
  const index = rd(path.join(logDir(), 'releases/index.json'), { releases: [] });
  const plans = readPlans();
  const releases = index.releases.map((r) => ({ ...r, sessions: plans.filter((p) => p.release === r.version).length }));
  return { releases, updatedAt: index.updatedAt || null };
}

export function getRelease(version) {
  const index = rd(path.join(logDir(), 'releases/index.json'), { releases: [] });
  const row = index.releases.find((r) => r.version === String(version));
  if (!row) throw problem(`There is no release "${version}". Pick one from the list.`, 404, 'not_found');
  if (row.state === 'frozen') {
    const summary = rd(path.join(logDir(), 'releases', row.version, 'summary.json'));
    if (!summary) throw problem(`Release ${row.version} is listed as frozen but its summary file is missing.`, 404, 'not_found');
    return { state: 'frozen', ...summary };
  }
  const defs = activeDefs();
  const state = rd(path.join(logDir(), 'active-release.state.json'), { features: {}, bugs: [] });
  const features = featureRows(defs, state);
  return {
    state: 'open', version: defs.version, release: defs.release, title: defs.title, startedAtCommit: defs.startedAtCommit || null,
    // Scope (server/lib/releaseScope.js): counts cover only scope 'planned'; backlog and added-after-the-cut are counted separately.
    counts: {
      planned: features.filter((f) => f.scope === 'planned').length,
      delivered: features.filter((f) => f.scope === 'planned' && f.delivered).length,
      carried: features.filter((f) => f.scope === 'planned' && !f.delivered).length,
      backlog: features.filter((f) => f.scope === 'backlog').length,
      addedAfterCut: features.filter((f) => f.added).length,
    },
    features,
    sessions: readPlans().filter((p) => p.release === defs.version).map((p) => ({ session: p.session, intent: p.intent, estimate: p.estimate, merges: p.merges, closedAt: p.closedAt || null })),
    note: 'The open release: scores are the latest validated round and change until the release is cut.',
  };
}

// ── Session plans ───────────────────────────────────────────────────────────
const frac = (s) => { const m = String(s ?? '').match(/^(\d+)\s*\/\s*(\d+)$/); return m ? { passed: Number(m[1]), total: Number(m[2]) } : null; };
const fileOf = (s) => path.join(plansDir(), `${String(s).replace(/[^A-Za-z0-9._-]/g, '_')}.json`);
const load = (s) => rd(fileOf(s));
const save = (p) => { fs.mkdirSync(plansDir(), { recursive: true }); fs.writeFileSync(fileOf(p.session), `${JSON.stringify(p, null, 2)}\n`); };

export function parseItem(it) {
  const feature = String(it?.feature || '').trim();
  if (!feature) throw problem('Each item needs a feature. Choose one of the open release\'s features.');
  const defs = activeDefs();
  if (!defs.features.some((f) => f.key === feature) && feature !== 'production') throw problem(`"${feature}" is not a feature of the open release (${defs.version}). Check the spelling against the feature list.`);
  let expect = null;
  const raw = it.expect;
  if (raw && typeof raw === 'object') expect = { passed: Number(raw.passed), total: Number(raw.total) };
  else if (raw !== undefined && raw !== null && String(raw).trim() !== '') expect = frac(raw);
  if (raw && String(typeof raw === 'object' ? 'x' : raw).trim() !== '' && (!expect || !Number.isInteger(expect.passed) || !Number.isInteger(expect.total) || expect.passed > expect.total)) {
    throw problem(`The expected score must look like 30/32 with the first number no larger than the second (got "${typeof raw === 'object' ? JSON.stringify(raw) : raw}").`);
  }
  const size = it.size ? String(it.size).toUpperCase() : null;
  if (size && !SIZES.includes(size)) throw problem(`Size must be S, M or L (got "${it.size}").`);
  // Scope (server/lib/releaseScope.js): an item outside the release's planned work is recorded as outOfScope, not refused.
  const def = defs.features.find((f) => f.key === feature);
  const outOfScope = !!def && scopeOf(def) !== 'planned';
  return { feature, goal: it.goal ? String(it.goal) : null, expect, size, ...(outOfScope ? { outOfScope: true } : {}) };
}

function assertSession(s) {
  const id = String(s || '').trim();
  if (!id) throw problem('A session id is required (for example S-0.3.0-01-build).');
  return id;
}

export function recordEstimate({ session, intent, items, reestimate }) {
  const id = assertSession(session);
  if (!Array.isArray(items) || !items.length) throw problem('Add at least one item (a feature, what changes, the score you expect) before saving the estimate.');
  const parsed = items.map(parseItem);
  const defs = activeDefs();
  const estimate = { recordedAt: new Date().toISOString(), atCommit: gitHead(), intent: intent || null, items: parsed };
  const prev = load(id);
  if (prev && prev.merges.length) {
    const reason = String(reestimate || '').trim();
    if (!reason) throw problem(`Session ${id} already recorded a merge, so its estimate is fixed. To change it, give a reason for the re-estimate; the original is kept beside it.`, 409, 'estimate_fixed');
    prev.reEstimates = [...(prev.reEstimates || []), { ...estimate, reason }];
    save(prev);
    return { session: prev, reEstimated: true };
  }
  const p = { session: id, release: defs.version, intent: intent || null, estimate, reEstimates: [], merges: [], closedAt: null };
  save(p);
  return { session: p, reEstimated: false };
}

export function latestScore(feature) {
  const d = path.join(releaseRoot(), 'docs/test-results', feature);
  let files = [];
  try { files = fs.readdirSync(d).map((f) => [f, Number((f.match(/^round-(\d+)\.md$/) || [])[1])]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]); } catch { /* none */ }
  if (!files.length) return { round: null, passed: null, total: null, baseline: null, report: null };
  const [f, round] = files[0];
  const txt = fs.readFileSync(path.join(d, f), 'utf8');
  const num = (k) => { const m = txt.match(new RegExp(`"${k}"\\s*:\\s*(\\d+)`)); return m ? Number(m[1]) : null; };
  return { round, passed: num('passed'), total: num('total'), baseline: num('baseline'), report: `docs/test-results/${feature}/${f}` };
}

export function recordMerge({ session, commit, features, ifNew }) {
  const id = assertSession(session);
  const p = load(id);
  if (!p) throw problem(`Session ${id} has no estimate yet. Record the estimate first, then the merge.`, 404, 'not_found');
  const feats = features?.length ? features : [...new Set(p.estimate.items.map((i) => i.feature))].filter((k) => k !== 'production');
  const sha = commit || gitHead();
  if (!sha) throw problem('The current commit could not be read. Enter the commit that was merged.');
  const results = feats.map((feature) => ({ feature, ...latestScore(feature) }));
  if (ifNew) {
    const prev = p.merges[p.merges.length - 1];
    const key = (rs) => JSON.stringify(rs.map((r) => [r.feature, r.round, r.passed, r.total]));
    if (prev ? key(prev.results) === key(results) : results.every((r) => r.round == null)) return { session: p, recorded: false, reason: 'No new validated round since the last recorded merge.' };
    if (!prev) {
      const fresh = results.filter((r) => r.report && fs.statSync(path.join(releaseRoot(), r.report)).mtimeMs > Date.parse(p.estimate.recordedAt));
      if (!fresh.length) return { session: p, recorded: false, reason: 'No round validated since the estimate.' };
    }
  }
  p.merges.push({ at: new Date().toISOString(), commit: sha, results });
  save(p);
  return { session: p, recorded: true };
}

export function closeSession({ session, note }) {
  const id = assertSession(session);
  const p = load(id);
  if (!p) throw problem(`Session ${id} has no estimate to close.`, 404, 'not_found');
  if (p.closedAt) throw problem(`Session ${id} was already closed on ${p.closedAt.slice(0, 10)}. A closed session is not changed.`, 409, 'already_closed');
  p.closedAt = new Date().toISOString();
  p.closeNote = note || null;
  save(p);
  return { session: p };
}

export function listSessionPlans({ release } = {}) {
  const rel = release || activeDefs().version;
  return readPlans().filter((p) => p.release === rel);
}

export function getSessionPlan(session) {
  const p = load(assertSession(session));
  if (!p) throw problem(`There is no session "${session}".`, 404, 'not_found');
  return p;
}

/** Expected vs actual per session item. "Not validated" stays null, never 0. */
export function sessionReport({ release } = {}) {
  const rel = release || activeDefs().version;
  const plans = readPlans().filter((p) => p.release === rel);
  const rows = plans.flatMap((p) => p.estimate.items.map((it) => {
    const last = [...p.merges].reverse().flatMap((m) => m.results).find((r) => r.feature === it.feature) || null;
    const hit = it.expect && last && last.passed != null ? last.passed >= it.expect.passed && last.total === it.expect.total : null;
    return { session: p.session, feature: it.feature, size: it.size, expected: it.expect ? `${it.expect.passed}/${it.expect.total}` : null,
      actual: last && last.passed != null ? `${last.passed}/${last.total}` : null, merges: p.merges.length, met: hit };
  }));
  return { release: rel, sessions: plans, rows };
}
