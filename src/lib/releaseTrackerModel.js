// Release tracker data rules (ported from tools/release-tracker/index.html, the
// reference implementation). Pure functions: no DOM, no React, so the Board,
// the World adapter and the tests all read the same rules.
//
//   snap  = the tracker snapshot  (features, agents, bugs, updates, totals, release, repoUrl)
//   hist  = { points: [{ t, c, f: { [feature]: [status, round, passed, total, open, verified, backlog, person] } }],
//             updates: [{ version, at, headline, commit }] }

export const ROLE = { build: 'Build', integrate: 'Integrate', validate: 'Validate', triage: 'Triage', scope: 'Scope check', fix: 'Fix', record: 'Record', reconcile: 'Reconcile' };
export const BACKLOG = ['backlog_pre_existing', 'reassigned', 'process_note'];
export const PERSON = ['needs_human', 'needs_business_definition'];
export const PASSED_S = ['passed', 'passed_with_backlog'];
export const PENDING = ['fixed_awaiting_retest', 'retesting'];
export const STATUS = {
  stalled: 'Stalled (no sign of life)', running: 'Running', passed: 'Passed', failing: 'Failing', queued: 'Queued', between_stages: 'Between stages',
  needs_human: 'Needs a person', needs_business_definition: 'Needs a business decision', open: 'Open', recurred: 'Came back',
  fixing: 'Being fixed', fixed_awaiting_retest: 'Fixed, awaiting re-test', retest_failed: 'Re-test failed', verified: 'Verified fixed',
  done: 'Done', failed: 'Agent stopped', idle_or_done: 'Idle', done_unreconciled: 'Finished, failures not reconciled',
  seen_in_test: 'Seen in test, awaiting triage', retesting: 'Fixed, being retested now',
  retest_failed_pending_triage: 'Retest failed, being triaged', passed_with_backlog: 'Passed (backlog elsewhere)',
  backlog_pre_existing: 'Backlog: was already broken', reassigned: 'Belongs to another feature', process_note: 'Test or process note', stopped: 'Stopped (run replaced)', awaiting_retest: 'Fixed, awaiting retest',
};
export const EVENT = { found: 'Found', recurred: 'Came back', fixed: 'Fix applied', not_fixed: 'Not fixed', seen: 'Seen in test', verified: 'Verified fixed' };
export const SCOPE = { this_feature: 'This feature', pre_existing: 'Was already broken before this work', other_feature: 'Another feature', process_note: 'Test or process note, not a product bug' };
export const BUG_ORDER = { needs_human: 0, needs_business_definition: 1, recurred: 2, retest_failed: 3, open: 4, seen_in_test: 5, fixing: 6, fixed_awaiting_retest: 7, reassigned: 8, backlog_pre_existing: 9, process_note: 10, verified: 11 };

// The four bug series. Colours are the validated chart palette (CSS vars --rt-s1..--rt-s4).
export const BUG_SERIES = [
  { key: 'open', label: 'Open (this work)', idx: 4, color: '--rt-s1' },
  { key: 'verified', label: 'Verified fixed', idx: 5, color: '--rt-s2' },
  { key: 'backlog', label: 'Backlog (not this work)', idx: 6, color: '--rt-s3' },
  { key: 'person', label: 'Waiting on a person', idx: 7, color: '--rt-s4' },
];
export const MEASURES = [['bugs', 'Bugs'], ['scores', 'Test scores'], ['features', 'Features passed']];
export const VIEWS = [['totals', 'Totals'], ['change', 'Change per update']];

export const statusText = (st) => STATUS[st] || (st ? String(st).split(', ').map((r) => ROLE[r] || r).join(' + ') : 'Not started');
export const isRunningLabel = (st) => !STATUS[st] && !!st;

export const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n || 0));
export const ago = (iso, now = Date.now()) => { if (!iso) return '—'; const m = Math.round((now - Date.parse(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`; };
export const fmtT = (iso) => { const d = new Date(iso); return `${d.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} ${d.toISOString().slice(11, 16)}`; };
export const updateLabel = (u) => `${u.version} · ${u.at.replace('T', ' ').slice(0, 16)} UTC`;

export const sortBugs = (list) => [...list].sort((a, b) => (BUG_ORDER[a.status] ?? 7) - (BUG_ORDER[b.status] ?? 7));
export const ownBugs = (snap, key) => (snap.bugs || []).filter((b) => b.status !== 'seen_in_test' && ((b.feature === key && !BACKLOG.includes(b.status)) || (b.status === 'reassigned' && b.scope?.owner === key)));
export const agentName = (a) => `${ROLE[a.role] || a.role || 'Agent'}${a.round ? ` · round ${a.round}` : ''}`;
export const pendingFor = (snap, key) => (snap.bugs || []).filter((b) => b.feature === key && PENDING.includes(b.status));

// ── Stat tiles (overview strip + first drill-down layer) ────────────────────
const isOpen = (b) => !['verified', 'seen_in_test', ...BACKLOG].includes(b.status);
export const STATS = {
  'features-passed': { label: 'Features passed', tone: 'good', count: (s) => `${s.features.filter((f) => PASSED_S.includes(f.status)).length} / ${s.features.length}`, list: 'features', pick: (s) => s.features.filter((f) => PASSED_S.includes(f.status)), note: 'Features whose latest test round passed every journey step.' },
  'agents-running': { label: 'Agents running', tone: '', count: (s) => s.agents.filter((a) => a.status === 'running').length, list: 'agents', pick: (s) => s.agents.filter((a) => a.status === 'running'), note: 'Agents working right now, with their latest step.' },
  'open-bugs': { label: 'Open bugs (this work)', tone: 'bad', count: (s) => s.bugs.filter(isOpen).length, list: 'bugs', pick: (s) => s.bugs.filter(isOpen), note: 'Bugs caused by this work that are not yet verified fixed. They block their feature.' },
  backlog: { label: 'Backlog: not this work', tone: '', count: (s) => s.bugs.filter((b) => BACKLOG.includes(b.status)).length, list: 'bugs', pick: (s) => s.bugs.filter((b) => BACKLOG.includes(b.status)), note: 'Bugs the scope check placed elsewhere: already broken before this work, another feature’s, or a test/process note. They stay here until fixed and verified.' },
  verified: { label: 'Bugs verified fixed', tone: 'good', count: (s) => s.bugs.filter((b) => b.status === 'verified').length, list: 'bugs', pick: (s) => s.bugs.filter((b) => b.status === 'verified'), note: 'Bugs whose step passed in a later browser test after the fix.' },
  human: { label: 'Need a person', tone: 'human', count: (s) => s.bugs.filter((b) => PERSON.includes(b.status)).length, list: 'bugs', pick: (s) => s.bugs.filter((b) => PERSON.includes(b.status)), note: 'Out of the automated loop: fix attempts ran out, or a business decision is missing.' },
  unreconciled: { label: 'Finished with unreconciled failures', tone: 'bad', count: (s) => s.agents.filter((a) => a.status === 'done_unreconciled').length, list: 'agents', pick: (s) => s.agents.filter((a) => a.status === 'done_unreconciled'), note: 'Agents that finished but reported failures nobody has reconciled yet. They are not done.' },
  updates: { label: 'Status updates', tone: '', count: (s) => ((s.updates || []).length ? s.updates[s.updates.length - 1].version : '—'), list: 'updates', pick: () => [], note: '' },
  tokens: { label: 'Tokens out / cache read', tone: '', count: (s) => `${k(s.totals?.output)} / ${k(s.totals?.cacheRead)}`, list: 'agents', pick: (s) => [...s.agents].sort((a, b) => (b.tokens?.output || 0) - (a.tokens?.output || 0)), note: 'Every agent run, most output tokens first.' },
};

// ── Path in the URL: one token per layer (#/rt/stat:open-bugs/bug:<id>) ─────
const enc = encodeURIComponent;
export const tok = (...parts) => parts.map((p) => enc(p)).join(':');
export const parseHash = (hash) => {
  const raw = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (raw[0] === 'rt') raw.shift();
  return raw;
};
export const hashFor = (path) => `#/rt${path.length ? `/${path.join('/')}` : ''}`;
/** A link goes one layer deeper from where the viewer is; if that layer is already on the path, it returns to it. */
export function makeHref(path) {
  return (...parts) => {
    const t = parts[0] === 'feature' && parts[2] === 'round' ? tok('round', parts[1], parts[3]) : tok(...parts);
    const i = path.indexOf(t);
    return hashFor(i >= 0 ? path.slice(0, i + 1) : [...path, t]);
  };
}
export const splitTok = (t) => t.split(':').map((x) => { try { return decodeURIComponent(x); } catch { return x; } });

// ── History and the slider ──────────────────────────────────────────────────
export const DEFAULT_T = { measure: 'bugs', view: 'totals', feature: 'all', hidden: {}, table: false };

export function pointIndexAt(hist, iso) {
  const t = Date.parse(iso); let best = 0;
  hist.points.forEach((p, j) => { if (Math.abs(Date.parse(p.t) - t) < Math.abs(Date.parse(hist.points[best].t) - t)) best = j; });
  return best;
}
/** The update in force at a point: the latest update recorded at or before it. */
export function updateAt(hist, pt) {
  const i = hist.points.indexOf(pt);
  return [...(hist.updates || [])].reverse().find((u) => pointIndexAt(hist, u.at) <= i) || null;
}
const rowsOf = (pt, T) => Object.entries(pt.f).filter(([key]) => T.feature === 'all' || key === T.feature);
export function measureAt(pt, T) {
  const r = rowsOf(pt, T);
  if (T.measure === 'bugs') return Object.fromEntries(BUG_SERIES.map((s) => [s.key, r.reduce((n, [, v]) => n + (v[s.idx] || 0), 0)]));
  if (T.measure === 'features') return { passed: r.filter(([, v]) => PASSED_S.includes(v[0])).length, tested: r.filter(([, v]) => v[3]).length };
  const scored = r.filter(([, v]) => v[3]);
  return { score: scored.length ? Math.round((scored.reduce((n, [, v]) => n + v[2] / v[3], 0) / scored.length) * 1000) / 10 : null };
}
export function seriesDefs(T) {
  if (T.measure === 'bugs') return BUG_SERIES.map((s) => ({ key: s.key, label: s.label, color: s.color }));
  if (T.measure === 'features') return [{ key: 'passed', label: 'Features passed', color: '--rt-s1' }, { key: 'tested', label: 'Features tested at least once', color: '--rt-s2' }];
  return [{ key: 'score', label: T.feature === 'all' ? 'Average step pass rate (tested features)' : 'Step pass rate', color: '--rt-s1' }];
}
export function measureAtAll(pt) { const o = { open: 0, verified: 0, backlog: 0, person: 0 }; Object.values(pt.f).forEach((v) => { o.open += v[4]; o.verified += v[5]; o.backlog += v[6]; o.person += v[7]; }); return o; }
/** Update markers as history indexes, in order. */
export const updateIndexes = (hist) => (hist.updates || []).map((u) => pointIndexAt(hist, u.at));
/** Previous / next update marker from a position; falls back to the first point / live. */
export function stepUpdate(hist, from, dir) {
  const idx = updateIndexes(hist);
  const target = dir < 0 ? [...idx].reverse().find((x) => x < from) : idx.find((x) => x > from);
  return target ?? (dir < 0 ? 0 : hist.points.length - 1);
}
/** Change-per-update pairs for the "change" view. */
export function changePairs(hist, T) {
  const marks = (hist.updates || []).map((u) => ({ label: u.version, i: pointIndexAt(hist, u.at) }));
  marks.push({ label: 'Live', i: hist.points.length - 1 });
  return marks.slice(1).map((m, j) => ({ label: `${marks[j].label} → ${m.label}`, a: measureAt(hist.points[marks[j].i], T), b: measureAt(hist.points[m.i], T) }));
}
