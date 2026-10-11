// Tracker World engine: ONE implementation shared by both release-tracker surfaces
//   - the platform screen  src/components/releaseTracker/TrackerWorld.jsx  (imports this module), and
//   - the artifact page    tools/release-tracker/index.html                (this file is inlined between the
//     "world-engine:begin/end" markers by tools/release-tracker/sync-world-engine.mjs; never edit that copy).
// Because the artifact cannot import, this file has NO imports and NO JSX: Three.js and the crystal recipes
// (src/lib/crystalGeometry.js) are injected as `THREE` and `geo`. Every `export ` keyword is stripped on inlining.
//
// What it draws (docs/changes/tracker-world-navigation.md):
//   * the Sun = the release; three concentric DISTRICTS (rings) = the release scope groups of
//     server/lib/releaseScope.js: "This release", "Added after the cut", "Backlog";
//   * a crystal per feature on its district's ring (colour = status, size = suite size, gold ring = pass share);
//   * satellites: bugs (octahedra), test rounds (cubes on the feature's ring) and agents (tetrahedra);
//   * a persistent label on everything that matters, a legend in place, and an "Objects" list of every object;
//   * clicking any object opens ITS data view over the world (one layer on the shared #/ trail), highlights what is
//     related to it and dims the rest, and moves the camera to it; Back pops one layer and the camera returns;
//   * Current / Historic: Historic draws the recorded state at the slider point and marks what changed since.
// Nothing is invented: an untested feature has no score ("not tested yet"), never 0.

const BACKLOG = ['backlog_pre_existing', 'reassigned', 'process_note'];
const PERSON = ['needs_human', 'needs_business_definition'];
const PASSED = ['passed', 'passed_with_backlog'];
const PENDING = ['fixed_awaiting_retest', 'retesting'];
const CATS = ['Open (this work)', 'Verified fixed', 'Backlog (not this work)', 'Waiting on a person'];
const EVENT_LABEL = { found: 'Found', recurred: 'Came back', fixed: 'Fix applied', not_fixed: 'Not fixed', seen: 'Seen in test', verified: 'Verified fixed' };
const EVENT_RANK = { found: 0, recurred: 0, seen: 0, fixed: 1, not_fixed: 1, verified: 2 };
const ROLE_LABEL = { build: 'Build', integrate: 'Integrate', validate: 'Validate', triage: 'Triage', scope: 'Scope check', fix: 'Fix', record: 'Record', reconcile: 'Reconcile' };
const STAGES = ['build', 'validate', 'triage', 'scope', 'fix', 'reconcile', 'integrate'];
export const DISTRICT_DEFS = [
  ['planned', 'This release', 'Planned work. Only these features count toward the release score.'],
  ['added', 'Added after the cut', 'Joined after the release was cut. Each one says whether it counts in this release or sits in the backlog.'],
  ['backlog', 'Backlog', 'Kept on the record, but not this release\'s work.'],
  ['other', 'Other tracked work', 'Tracked, but not part of this release.'],
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
const enc = encodeURIComponent;
export const twTok = (...parts) => parts.map((p) => enc(p)).join(':');
export const twSplit = (t) => String(t).split(':').map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
const kfmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n || 0));
const agoText = (iso, now) => { if (!iso) return '—'; const m = Math.round(((now || Date.now()) - Date.parse(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`; };
const toneVar = (t) => `var(--tw-${t})`;
const isOpenBug = (b) => !['verified', 'seen_in_test', ...BACKLOG].includes(b.status);

export function toneOfStatus(st) {
  if (PASSED.includes(st) || st === 'verified') return 'good';
  if (['failing', 'done_unreconciled', 'not_passed_after_max_rounds'].includes(st)) return 'bad';
  if (PERSON.includes(st)) return 'human';
  if (!st || ['queued', 'stopped', 'idle_or_done', 'failed'].includes(st)) return 'muted';
  if (['awaiting_retest', 'between_stages'].includes(st)) return 'gold';
  return 'teal';
}
const bugCat = (st) => (st === 'verified' ? 2 : BACKLOG.includes(st) ? 3 : PERSON.includes(st) ? 4 : 1);
const agentTone = (st) => (st === 'running' ? 'teal' : ['failed', 'done_unreconciled'].includes(st) ? 'bad' : st === 'stalled' ? 'gold' : 'muted');
const tokenVarName = (v) => String(v).replace(/^--(rt-)?/, '');

export function districtOf(f, hasScopes) {
  if (!hasScopes) return 'planned';
  if (f.scope === 'not_in_release') return 'other';
  if (f.added && typeof f.added === 'object') return 'added';
  return f.scope === 'backlog' ? 'backlog' : 'planned';
}

// ── Rounds of one feature, from the snapshot and the recorded history (never invented) ──────────────────────
function roundsOf(snap, hist, f, maxRound) {
  const nums = new Set();
  (snap.agents || []).forEach((a) => { if (a.feature === f.key && a.round != null) nums.add(a.round); });
  if (f.lastResult?.round) nums.add(f.lastResult.round);
  (snap.bugs || []).forEach((b) => { if (b.feature === f.key) (b.history || []).forEach((h) => { if (h.round) nums.add(h.round); }); });
  (hist?.points || []).forEach((p) => { const v = p.f?.[f.key]; if (v && v[1]) nums.add(v[1]); });
  if (!nums.size && f.rounds > 0) for (let i = 1; i <= f.rounds; i += 1) nums.add(i);
  return [...nums].filter((n) => (maxRound == null || n <= maxRound)).sort((a, b) => a - b).map((n) => {
    let passed = null; let total = null; let status = null; let firstAt = null; let firstIdx = null; let firstStatus = null;
    if (f.lastResult && f.lastResult.round === n) { passed = f.lastResult.stepsPassed; total = f.lastResult.stepsTotal; }
    (hist?.points || []).forEach((p, i) => {
      const v = p.f?.[f.key]; if (!v || v[1] !== n) return;
      if (firstAt == null) { firstAt = p.t; firstIdx = i; firstStatus = v[0]; }
      if (!(f.lastResult && f.lastResult.round === n) && v[3]) { passed = v[2]; total = v[3]; }
    });
    const validate = (snap.agents || []).find((a) => a.feature === f.key && a.role === 'validate' && a.round === n);
    const ok = total ? passed === total : null;
    return { n, passed, total, ok, status: firstStatus, firstAt: firstAt || validate?.startedAt || null, firstIdx, running: validate?.status === 'running', summary: validate?.summary || null, agentId: validate?.id || null };
  });
}

// ── The world model: pure, no DOM, no THREE ──────────────────────────────────────────────────────────────────
// `bind(channelId, entity, ctx)` is optional (the platform maps channels through its render bindings): return the
// mapped value, or undefined for "not mapped" (the world then draws the neutral fallback and says so).
export function buildWorldModel({ snap, hist, at, bind, statusText, fmtT }) {
  const live = !hist || at == null || at >= hist.points.length - 1;
  const pt = hist && !live ? hist.points[at] : null;
  const lastPt = hist ? hist.points[hist.points.length - 1] : null;
  const feats = (snap.features || []).filter((f) => f.key !== 'whole-app-sweep');
  const hasScopes = feats.some((f) => f.scope);
  const maxSteps = Math.max(1, ...feats.map((f) => f.lastResult?.stepsTotal || 0), ...(pt ? Object.values(pt.f).map((v) => v[3] || 0) : []));
  const unmapped = new Set();
  const val = (id, entity, ctx, derive) => {
    if (!bind) return derive();
    const v = bind(id, entity, ctx);
    if (v === undefined) { unmapped.add(id); return null; }
    return v;
  };
  const nodes = feats.map((f) => {
    const h = pt?.f?.[f.key];
    const absent = !!pt && !h;
    const status = h ? h[0] : f.status;
    const total = h ? h[3] : f.lastResult?.stepsTotal;
    const passed = h ? h[2] : f.lastResult?.stepsPassed;
    const hctx = { hist: h || null, maxSteps };
    const ownBugs = (snap.bugs || []).filter((b) => b.feature === f.key && b.status !== 'seen_in_test');
    // satellites
    const sats = [];
    if (h) {
      [[4, 1], [5, 2], [6, 3], [7, 4]].forEach(([idx, cat]) => {
        const n = idx === 4 ? h[4] - h[7] : h[idx];
        for (let i = 0; i < Math.min(n, 8); i += 1) sats.push({ id: `${f.key}|count|${cat}|${i}`, kind: 'count', label: CATS[cat - 1], short: CATS[cat - 1], tone: `s${cat}`, cat, token: twTok('feature', f.key), feature: f.key });
      });
    } else {
      ownBugs.forEach((b) => {
        const cat = bugCat(b.status);
        const color = val('satellite.colour', b, hctx, () => `--rt-s${cat}`);
        const ghost = val('satellite.ghost', b, hctx, () => PENDING.includes(b.status));
        sats.push({ id: twTok('bug', b.id), kind: 'bug', label: `${b.id}: ${b.step || ''}`, short: b.id, tone: color ? tokenVarName(color) : 'muted', cat, pending: !!ghost, token: twTok('bug', b.id), feature: f.key, status: b.status });
      });
    }
    const maxRound = h ? h[1] : null;
    const rounds = absent ? [] : roundsOf(snap, hist, f, maxRound);
    rounds.forEach((r) => sats.push({ id: twTok('round', f.key, r.n), kind: 'round', label: `Round ${r.n}${r.total ? `: ${r.passed}/${r.total} steps` : r.running ? ': being tested now' : ': score not recorded'}`, short: `R${r.n}${r.total ? ` ${r.passed}/${r.total}` : ''}`, tone: r.ok == null ? 'muted' : r.ok ? 'good' : 'bad', token: twTok('round', f.key, r.n), feature: f.key, round: r.n }));
    let agentsMore = 0; let agentsAll = 0;
    if (!h) {
      const ag = (snap.agents || []).filter((a) => a.feature === f.key);
      agentsAll = ag.length;
      const ordered = [...ag].sort((a, b) => (b.status === 'running') - (a.status === 'running') || String(b.startedAt || '').localeCompare(String(a.startedAt || '')));
      ordered.slice(0, 4).forEach((a) => sats.push({ id: twTok('agent', a.id), kind: 'agent', label: `${ROLE_LABEL[a.role] || a.role || 'Agent'}${a.round ? ` · round ${a.round}` : ''}: ${statusText(a.status)}`, short: `${ROLE_LABEL[a.role] || a.role || 'Agent'}${a.round ? ` r${a.round}` : ''}`, tone: agentTone(a.status), token: twTok('agent', a.id), feature: f.key, status: a.status }));
      agentsMore = Math.max(0, ag.length - 4);
    }
    const active = !!val('crystal.river', f, hctx, () => (snap.agents || []).some((a) => a.feature === f.key && a.status === 'running')) && !h;
    const colour = val('crystal.colour', f, hctx, () => `--rt-${toneOfStatus(status)}`);
    const weightRaw = val('crystal.size', f, hctx, () => (total ? 0.35 + 0.65 * (total / maxSteps) : 0.3));
    const ring = val('crystal.ring', f, hctx, () => (total ? passed / total : null));
    // what changed between the chosen point and now
    let changed = null;
    if (pt) {
      if (absent) changed = { absent: true, lines: ['Not tracked yet at this point in time; it joined the release later.'] };
      else {
        const lines = [];
        if (h[0] !== f.status) lines.push(`Status: ${statusText(h[0])} → ${statusText(f.status)}`);
        const nowTotal = f.lastResult?.stepsTotal; const nowPassed = f.lastResult?.stepsPassed;
        if ((h[3] || 0) !== (nowTotal || 0) || (h[2] || 0) !== (nowPassed || 0)) lines.push(`Test score: ${h[3] ? `${h[2]}/${h[3]} steps` : 'not tested yet'} → ${nowTotal ? `${nowPassed}/${nowTotal} steps` : 'not tested yet'}`);
        const lv = lastPt?.f?.[f.key];
        if (lv) CATS.forEach((c, i) => { if ((h[4 + i] || 0) !== (lv[4 + i] || 0)) lines.push(`${c}: ${h[4 + i] || 0} → ${lv[4 + i] || 0}`); });
        if (lines.length) changed = { absent: false, lines };
      }
    }
    return {
      id: twTok('feature', f.key), kind: 'feature', key: f.key, label: f.key,
      status, statusLabel: statusText(status), tone: colour ? tokenVarName(colour) : 'muted',
      district: districtOf(f, hasScopes), absent,
      scoreText: total ? `${passed}/${total} steps` : 'not tested yet', pct: total ? Math.round((passed / total) * 100) : null,
      weight: typeof weightRaw === 'number' ? weightRaw : 0.3, progress: typeof ring === 'number' ? ring : null,
      active, changed, sats, agentsMore, agentsAll,
      counts: { bugs: sats.filter((s) => s.kind === 'bug' || s.kind === 'count').length, rounds: rounds.length },
      added: f.added || null, scope: f.scope || null, dependsOn: Array.isArray(f.dependsOn) ? f.dependsOn : [],
    };
  });
  const defs = hasScopes ? DISTRICT_DEFS.filter(([k]) => k !== 'other' || nodes.some((n) => n.district === 'other')) : [['planned', 'All features', 'Every feature in this release.']];
  const districts = defs.map(([key, label, note]) => {
    const members = nodes.filter((n) => n.district === key);
    const ids = new Set(members.map((n) => n.key));
    return {
      id: twTok('scope', key), key, label, note, members: members.map((n) => n.id),
      passed: members.filter((n) => PASSED.includes(n.status)).length, total: members.length,
      openBugs: (snap.bugs || []).filter((b) => ids.has(b.feature) && isOpenBug(b)).length,
    };
  });
  // The release score counts only this release's work (planned, including features added into planned), like the Board.
  const counted = nodes.filter((n) => !hasScopes || (n.scope !== 'backlog' && n.scope !== 'not_in_release'));
  const releaseScore = `${counted.filter((n) => PASSED.includes(n.status)).length} of ${counted.length} passed`;
  return {
    live, at: live ? null : at, pt, hasScopes, nodes, districts, unmapped: [...unmapped],
    root: { label: snap.release?.version ? `Release ${snap.release.version}` : 'Release', sub: pt ? `as of ${fmtT(pt.t)} UTC` : 'live', score: releaseScore },
  };
}

// ── Selection: which object a path (the trail) points at ─────────────────────────────────────────────────────
export function selectionOf(path, snap) {
  const last = (path || [])[path.length - 1];
  if (!last) return null;
  const [type, a, b] = twSplit(last);
  if (type === 'feature') { const f = (snap.features || []).find((x) => x.key === a); return f ? { kind: 'feature', id: twTok('feature', a), feature: a } : { kind: 'missing' }; }
  if (type === 'round') { const f = (snap.features || []).find((x) => x.key === a); return f ? { kind: 'round', id: twTok('round', a, b), feature: a, round: Number(b) } : { kind: 'missing' }; }
  if (type === 'bug') { const x = (snap.bugs || []).find((q) => q.id === a); return x ? { kind: 'bug', id: twTok('bug', a), feature: x.feature, bug: a } : { kind: 'missing' }; }
  if (type === 'agent') { const x = (snap.agents || []).find((q) => q.id === a); return x ? { kind: 'agent', id: twTok('agent', a), feature: x.feature || null, agent: a } : { kind: 'missing' }; }
  if (type === 'scope') return DISTRICT_DEFS.some(([k]) => k === a) ? { kind: 'scope', id: twTok('scope', a), scope: a } : { kind: 'missing' };
  return { kind: 'other', id: last };
}

// ── Related objects of the selection (highlighted in the world; the rest is dimmed) ──────────────────────────
export function relatedOf(model, snap, sel) {
  const ids = new Set(); const why = {}; const links = [];
  if (!sel || sel.kind === 'other' || sel.kind === 'missing') return { ids, why, links, active: false };
  const add = (id, reason) => { if (id) { ids.add(id); if (reason && !why[id]) why[id] = reason; } };
  const nodeOf = (key) => model.nodes.find((n) => n.key === key);
  const link = (a, b) => { if (a && b && a !== b) links.push([a, b]); };
  const bugsOf = (key) => (snap.bugs || []).filter((b) => b.feature === key || b.scope?.owner === key);
  const featureWide = (key, reasonPrefix) => {
    const n = nodeOf(key); if (!n) return;
    add(n.id, reasonPrefix);
    const dn = model.districts.find((d) => d.members.includes(n.id)); if (dn) add(dn.id, 'its district');
  };
  if (sel.kind === 'scope') {
    const d = model.districts.find((x) => x.id === sel.id); add(sel.id);
    (d?.members || []).forEach((m) => add(m, 'in this district'));
  } else if (sel.kind === 'feature') {
    const n = nodeOf(sel.feature); add(sel.id); featureWide(sel.feature);
    (n?.sats || []).forEach((s) => add(s.id, s.kind === 'bug' ? 'its bug' : s.kind === 'round' ? 'its test round' : s.kind === 'agent' ? 'an agent working on it' : 'its bugs'));
    bugsOf(sel.feature).forEach((b) => {
      const other = b.feature === sel.feature ? b.scope?.owner : b.feature;
      if (other && other !== sel.feature && nodeOf(other)) { add(twTok('feature', other), `shares bug ${b.id}`); link(sel.id, twTok('feature', other)); }
    });
    const f = (snap.features || []).find((x) => x.key === sel.feature);
    (f?.dependsOn || []).forEach((d) => { if (nodeOf(d)) { add(twTok('feature', d), `${sel.feature} depends on it`); link(sel.id, twTok('feature', d)); } });
    model.nodes.forEach((o) => { if (o.dependsOn.includes(sel.feature)) { add(o.id, `depends on ${sel.feature}`); link(sel.id, o.id); } });
  } else if (sel.kind === 'bug') {
    const b = (snap.bugs || []).find((x) => x.id === sel.bug); add(sel.id);
    if (b) {
      featureWide(b.feature, 'reported against');
      if (b.scope?.owner && nodeOf(b.scope.owner)) { add(twTok('feature', b.scope.owner), 'the feature this bug belongs to'); link(twTok('feature', b.feature), twTok('feature', b.scope.owner)); }
      const rounds = [...new Set((b.history || []).map((h) => h.round).filter(Boolean))];
      rounds.forEach((r) => add(twTok('round', b.feature, r), `round it was touched in`));
      (snap.agents || []).filter((a) => a.feature === b.feature && rounds.includes(a.round)).forEach((a) => add(twTok('agent', a.id), 'worked in a round this bug was touched'));
      link(sel.id, twTok('feature', b.feature));
    }
  } else if (sel.kind === 'agent') {
    const a = (snap.agents || []).find((x) => x.id === sel.agent); add(sel.id);
    if (a?.feature) {
      featureWide(a.feature, 'what it works on');
      if (a.round) add(twTok('round', a.feature, a.round), 'its round');
      (snap.bugs || []).filter((b) => b.feature === a.feature && (b.history || []).some((h) => h.round === a.round)).forEach((b) => add(twTok('bug', b.id), 'a bug of that round'));
      link(sel.id, twTok('feature', a.feature));
    }
  } else if (sel.kind === 'round') {
    add(sel.id); featureWide(sel.feature, 'its feature');
    (snap.bugs || []).filter((b) => b.feature === sel.feature && (b.history || []).some((h) => h.round === sel.round)).forEach((b) => add(twTok('bug', b.id), 'touched in this round'));
    (snap.agents || []).filter((a) => a.feature === sel.feature && a.round === sel.round).forEach((a) => add(twTok('agent', a.id), 'worked in this round'));
    link(sel.id, twTok('feature', sel.feature));
  }
  return { ids, why, links, active: true };
}

// ── History helpers ──────────────────────────────────────────────────────────────────────────────────────────
function updateAtPoint(hist, idx, pointIndexAt) {
  return [...(hist.updates || [])].reverse().find((u) => pointIndexAt(u.at) <= idx) || null;
}
export function updateMarkIndexes(hist, pointIndexAt) { return (hist?.updates || []).map((u) => pointIndexAt(u.at)); }
/** The index Historic should start at: the update marker before live, else the first recorded point. */
export function defaultHistoricIndex(hist, pointIndexAt) {
  if (!hist || hist.points.length < 2) return null;
  const last = hist.points.length - 1;
  const prev = [...updateMarkIndexes(hist, pointIndexAt)].reverse().find((x) => x < last);
  return prev == null ? 0 : prev;
}

// ── Data views (HTML strings, everything escaped) ────────────────────────────────────────────────────────────
function pill(tone, text) { return `<span class="tw-pill" style="--c:${toneVar(tone)}">${esc(text)}</span>`; }
function kv(rows) { return `<dl class="tw-kv">${rows.filter(Boolean).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`; }
function sec(title, body, extra = '') { return `<section class="tw-sec"${extra}><h2>${esc(title)}</h2>${body}</section>`; }
const commitLink = (c, snap) => (c ? ` <a class="tw-mono" href="${esc(`${snap.repoUrl || ''}/commit/${c}`)}" target="_blank" rel="noopener noreferrer">${esc(String(c).slice(0, 7))}</a>` : '');
function relatedList(model, snap, sel, rel, href) {
  if (!rel.active) return '';
  const nodeByTok = new Map(); model.nodes.forEach((n) => { nodeByTok.set(n.id, [n.label, 'Feature']); n.sats.forEach((s) => { if (s.kind !== 'count') nodeByTok.set(s.id, [s.short, s.kind === 'bug' ? 'Bug' : s.kind === 'round' ? 'Round' : 'Agent']); }); });
  model.districts.forEach((d) => nodeByTok.set(d.id, [d.label, 'District']));
  const items = [...rel.ids].filter((id) => id !== sel.id && nodeByTok.has(id) && !id.startsWith('scope:')).map((id) => {
    const [label, type] = nodeByTok.get(id); const t = twSplit(id);
    const h = t[0] === 'round' ? href('round', t[1], t[2]) : href(...t);
    return `<li><a href="${esc(h)}" data-id="${esc(id)}"><span class="tw-rtype">${esc(type)}</span> <b>${esc(label)}</b></a>${rel.why[id] ? ` <span class="tw-muted">· ${esc(rel.why[id])}</span>` : ''}</li>`;
  });
  return sec('Related (highlighted in the world)', items.length ? `<ul class="tw-rel">${items.join('')}</ul>` : '<div class="tw-muted">Nothing else is linked to this.</div>', ' data-testid="tw-related"');
}

// The journey of a feature: a pass-rate line over the recorded states, then rounds and bug events in order.
function journeyChart(f, hist, at, fmtT) {
  const pts = (hist?.points || []).map((p, i) => ({ i, t: p.t, v: p.f?.[f.key] || null }));
  if (pts.length < 2) return '<div class="tw-muted">History has fewer than two recorded states, so there is no line to draw yet.</div>';
  const W = 320; const H = 96; const padX = 8; const padT = 8; const padB = 22;
  const x = (i) => padX + (i / (pts.length - 1)) * (W - 2 * padX);
  const y = (p) => padT + (1 - p) * (H - padT - padB);
  let d = ''; let pen = false; const dots = [];
  pts.forEach((p) => {
    if (p.v && p.v[3]) { const pct = p.v[2] / p.v[3]; d += `${pen ? 'L' : 'M'}${x(p.i).toFixed(1)} ${y(pct).toFixed(1)} `; pen = true; dots.push([p, pct]); } else pen = false;
  });
  const roundMarks = []; let lastRound = null;
  pts.forEach((p) => { const r = p.v?.[1]; if (r && r !== lastRound) { roundMarks.push([p, r]); lastRound = r; } });
  const cur = at == null ? pts.length - 1 : at;
  return `<svg class="tw-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pass rate of ${esc(f.key)} over the recorded states. Gaps mean not tested yet.">
    <title>Pass rate of ${esc(f.key)} over time (gaps = not tested yet)</title>
    <line x1="${padX}" y1="${y(1)}" x2="${W - padX}" y2="${y(1)}" class="tw-grid"/><line x1="${padX}" y1="${y(0)}" x2="${W - padX}" y2="${y(0)}" class="tw-grid"/>
    ${d ? `<path d="${d}" class="tw-line" fill="none"/>` : ''}
    ${dots.map(([p, pct]) => `<circle cx="${x(p.i).toFixed(1)}" cy="${y(pct).toFixed(1)}" r="3" style="fill:${toneVar(toneOfStatus(p.v[0]))}"><title>${esc(fmtT(p.t))} UTC: ${p.v[2]}/${p.v[3]} steps</title></circle>`).join('')}
    ${roundMarks.map(([p, r]) => `<g><rect x="${(x(p.i) - 5).toFixed(1)}" y="${H - 18}" width="10" height="10" class="tw-rmark"/><text x="${x(p.i).toFixed(1)}" y="${H - 10}" text-anchor="middle" class="tw-rtext">${r}</text></g>`).join('')}
    <line x1="${x(cur).toFixed(1)}" y1="${padT - 4}" x2="${x(cur).toFixed(1)}" y2="${H - padB + 2}" class="tw-here"/>
    <text x="${padX}" y="${padT + 4}" class="tw-axis">100%</text><text x="${padX}" y="${y(0) - 3}" class="tw-axis">0%</text>
  </svg>
  <div class="tw-axis-row"><span>${esc(fmtT(pts[0].t))} UTC</span><span>${at == null ? 'now (live)' : `chosen point · ${esc(fmtT(pts[cur].t))} UTC`}</span><span>${esc(fmtT(pts[pts.length - 1].t))} UTC</span></div>`;
}

function featureJourneyRows(ctx, f) {
  const { snap, hist, at, href, fmtT } = ctx;
  const histRound = at != null && hist ? (hist.points[at]?.f?.[f.key]?.[1] ?? 0) : null;
  const rounds = roundsOf(snap, hist, f, null);
  const bugs = (snap.bugs || []).filter((b) => b.feature === f.key && b.status !== 'seen_in_test');
  const byRound = new Map(); rounds.forEach((r) => byRound.set(r.n, { round: r, events: [] }));
  bugs.forEach((b) => (b.history || []).forEach((h) => { const n = h.round || 0; if (!byRound.has(n)) byRound.set(n, { round: null, n, events: [] }); byRound.get(n).events.push({ b, h }); }));
  const rows = [];
  [...byRound.keys()].sort((a, b) => a - b).forEach((n) => {
    const g = byRound.get(n);
    const after = histRound != null && n > histRound;
    if (g.round) {
      const r = g.round;
      rows.push(`<li class="tw-j${after ? ' tw-after' : ''}"><span class="tw-jt">${r.firstAt ? esc(fmtT(r.firstAt)) : 'time not recorded'}</span><span class="tw-jb"><a href="${esc(href('round', f.key, r.n))}"><b>Round ${r.n}</b></a> ${r.total ? `${r.passed}/${r.total} steps (${Math.round((r.passed / r.total) * 100)}%)` : r.running ? 'being tested now, no score yet' : 'score not recorded'}${r.status ? ` · ${esc(ctx.statusText(r.status))}` : ''}${after ? ' <span class="tw-chip">after this point</span>' : ''}</span></li>`);
    }
    g.events.sort((a, b) => (EVENT_RANK[a.h.event] ?? 1) - (EVENT_RANK[b.h.event] ?? 1)).forEach(({ b, h }) => {
      const ev = EVENT_LABEL[h.event] || h.event;
      const tone = h.event === 'verified' ? 'good' : h.event === 'fixed' ? 'gold' : 'bad';
      rows.push(`<li class="tw-j tw-jbug${after ? ' tw-after' : ''}"><span class="tw-jt">${n ? `R${n}` : 'Build'}</span><span class="tw-jb">${pill(tone, ev)} <a href="${esc(href('bug', b.id))}" class="tw-mono">${esc(b.id)}</a> ${esc(h.note || '')}${commitLink(h.commit, snap)}${after ? ' <span class="tw-chip">after this point</span>' : ''}</span></li>`);
    });
  });
  return rows.length ? `<ol class="tw-jlist">${rows.join('')}</ol>` : '<div class="tw-muted">No test round has been recorded for this feature yet.</div>';
}

function modeNote(ctx) {
  const { hist, at, fmtT } = ctx;
  if (at == null || !hist) return '<div class="tw-note" data-testid="tw-mode-note"><b>Current</b> state: what the release looks like right now.</div>';
  const pt = hist.points[at]; const u = updateAtPoint(hist, at, ctx.pointIndexAt);
  return `<div class="tw-note tw-note-hist" data-testid="tw-mode-note"><b>Historic</b> state: ${esc(fmtT(pt.t))} UTC${u ? ` · after ${esc(u.version)}` : ''}. Amber items changed since then; rows marked <i>after this point</i> had not happened yet.</div>`;
}

function changedBlock(node, ctx) {
  if (!ctx.at || !node?.changed) return '';
  return sec('Changed since this point', `<ul class="tw-chg">${node.changed.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`, ' data-testid="tw-changed"');
}

function viewFeature(ctx, sel, rel) {
  const { snap, model, href } = ctx;
  const f = (snap.features || []).find((x) => x.key === sel.feature); const n = model.nodes.find((x) => x.key === sel.feature);
  if (!f || !n) return null;
  const d = model.districts.find((x) => x.members.includes(n.id));
  const r = f.lastResult;
  const own = (snap.bugs || []).filter((b) => b.status !== 'seen_in_test' && ((b.feature === f.key && !BACKLOG.includes(b.status)) || (b.status === 'reassigned' && b.scope?.owner === f.key)));
  const bl = (snap.bugs || []).filter((b) => b.feature === f.key && BACKLOG.includes(b.status));
  const agents = (snap.agents || []).filter((a) => a.feature === f.key);
  const scopeRows = n.added
    ? `<b>${esc(d?.label || 'Added after the cut')}</b> · added ${esc(String(n.added.at || '').slice(0, 10))}${n.added.commit ? ` (${esc(n.added.commit)})` : ''} · ${n.scope === 'planned' ? 'counted in this release' : 'kept in backlog'}<div class="tw-muted">${esc(n.added.reason || 'No reason recorded.')}</div>`
    : `<a href="${esc(href('scope', n.district))}"><b>${esc(d?.label || 'This release')}</b></a>${n.scope === 'backlog' ? ' · not this release\'s work' : n.scope === 'planned' ? ' · counted in this release' : ''}`;
  const bugList = (list) => (list.length ? `<ul class="tw-rel">${list.map((b) => `<li><a href="${esc(href('bug', b.id))}" class="tw-mono">${esc(b.id)}</a> ${pill(`s${bugCat(b.status)}`, ctx.statusText(b.status))} <span class="tw-muted">${esc(b.step || '')}</span></li>`).join('')}</ul>` : '<div class="tw-muted">None.</div>');
  return `<header class="tw-vh"><div class="tw-type">Feature</div><h3>${esc(f.key)}</h3><div>${pill(n.tone, n.statusLabel)} ${n.changed ? '<span class="tw-chip tw-chip-chg">changed since</span>' : ''}</div></header>
  ${modeNote(ctx)}
  ${n.absent ? '<div class="tw-note">This feature was not tracked yet at the chosen point.</div>' : ''}
  ${sec('Where it sits', kv([['District', scopeRows], ['Latest test', n.absent ? '—' : (n.pct == null ? 'Not tested yet' : `${esc(n.scoreText)} (${n.pct}%)${r?.round && ctx.at == null ? ` · round ${r.round}${r.baseline ? ` · baseline v${r.baseline}` : ''}` : ''}`)], ['Test rounds', esc(String(ctx.at == null ? f.rounds : n.counts.rounds))], ['Depends on', f.dependsOn?.length ? f.dependsOn.map((k) => `<a href="${esc(href('feature', k))}">${esc(k)}</a>`).join(', ') : '<span class="tw-muted">Nothing recorded</span>']]))}
  ${changedBlock(n, ctx)}
  ${sec('Journey through the release', `${journeyChart(f, ctx.hist, ctx.at, ctx.fmtT)}${featureJourneyRows(ctx, f)}`, ' data-testid="tw-journey"')}
  ${sec(`Its bugs (${own.length}${bl.length ? ` + ${bl.length} in backlog` : ''})`, ctx.at != null ? `<div class="tw-muted">At this point the record holds counts only: ${CATS.map((c, i) => `${ctx.hist.points[ctx.at]?.f?.[f.key]?.[4 + i] ?? 0} ${c.toLowerCase()}`).join(', ')}. Switch to Current to open the individual bugs.</div>` : bugList([...own, ...bl]))}
  ${sec(`Agents (${agents.length})`, ctx.at != null ? '<div class="tw-muted">Agent runs are shown for the Current state only.</div>' : (agents.length ? `<ul class="tw-rel">${agents.slice(0, 12).map((a) => `<li><a href="${esc(href('agent', a.id))}"><b>${esc(ROLE_LABEL[a.role] || a.role || 'Agent')}${a.round ? ` · round ${a.round}` : ''}</b></a> ${pill(agentTone(a.status), ctx.statusText(a.status))} <span class="tw-muted">${esc(a.summary || a.activity || '')}</span></li>`).join('')}${agents.length > 12 ? `<li class="tw-muted">+ ${agents.length - 12} older runs</li>` : ''}</ul>` : '<div class="tw-muted">No agent runs here.</div>'))}
  ${relatedList(model, snap, sel, rel, href)}`;
}

function viewBug(ctx, sel, rel) {
  const { snap, href, model } = ctx;
  const b = (snap.bugs || []).find((x) => x.id === sel.bug); if (!b) return null;
  const hist = (b.history || []);
  const touched = [...new Set(hist.map((h) => h.round).filter(Boolean))];
  const stages = [['found', 'Found'], ['fixing', 'Being fixed'], ['verified', 'Verified fixed']];
  const stageIdx = b.status === 'verified' ? 2 : ['fixing', 'fixed_awaiting_retest', 'retesting'].includes(b.status) ? 1 : 0;
  const histRound = ctx.at != null && ctx.hist ? (ctx.hist.points[ctx.at]?.f?.[b.feature]?.[1] ?? 0) : null;
  const ribbon = `<ol class="tw-stages" aria-label="Where this bug is in its journey">${stages.map(([k, l], i) => `<li class="${i < stageIdx ? 'tw-done' : i === stageIdx ? 'tw-cur' : ''}" ${i === stageIdx ? 'aria-current="step"' : ''}>${esc(l)}</li>`).join('')}</ol>`;
  const rows = hist.length ? hist.map((h) => { const after = histRound != null && (h.round || 0) > histRound; return `<li class="tw-j${after ? ' tw-after' : ''}"><span class="tw-jt">${h.round ? `<a href="${esc(href('round', b.feature, h.round))}">R${h.round}</a>` : 'Build'}</span><span class="tw-jb">${pill(h.event === 'verified' ? 'good' : h.event === 'fixed' ? 'gold' : 'bad', EVENT_LABEL[h.event] || h.event)} ${esc(h.note || '')}${h.files?.length ? ` <span class="tw-mono tw-muted">${esc(h.files.join(', '))}</span>` : ''}${commitLink(h.commit, snap)}${after ? ' <span class="tw-chip">after this point</span>' : ''}</span></li>`; }).join('') : '<li class="tw-muted">No history recorded.</li>';
  const own = b.scope?.owner;
  return `<header class="tw-vh"><div class="tw-type">Bug</div><h3>${esc(b.step || b.id)}</h3><div>${pill(`s${bugCat(b.status)}`, ctx.statusText(b.status))} <span class="tw-mono tw-muted">${esc(b.id)}</span> · fix attempts ${b.attempts || 0} of ${esc(snap.maxFixAttemptsPerBug ?? '—')}</div></header>
  ${modeNote(ctx)}
  ${b.question ? `<div class="tw-callout"><b>Question for you:</b> ${esc(b.question)}</div>` : ''}
  ${sec('Journey of this bug', ribbon + `<ol class="tw-jlist">${rows}</ol>`, ' data-testid="tw-journey"')}
  ${sec('Details', kv([
    ['Root cause', esc(b.rootCause || '—')], ['Class', esc(b.class || '—')], ['Files', `<span class="tw-mono">${esc((b.files || []).join(', ') || '—')}</span>`],
    ['Fix attempts', `${b.attempts || 0} of ${esc(snap.maxFixAttemptsPerBug ?? '—')}`],
    ['Whose bug', b.scope ? `${esc(({ this_feature: 'This feature', pre_existing: 'Was already broken before this work', other_feature: 'Another feature', process_note: 'Test or process note, not a product bug' })[b.scope.scope] || b.scope.scope)}${own ? ` — <a href="${esc(href('feature', own))}">${esc(own)}</a>` : ''}<div class="tw-muted">${esc(b.scope.evidence || '')} (${esc(b.scope.decidedBy || '')})</div>` : '<span class="tw-muted">Not scope-checked yet</span>'],
    ['Reported against', `<a href="${esc(href('feature', b.feature))}">${esc(b.feature)}</a>${touched.length ? ` · rounds ${touched.map((n) => `<a href="${esc(href('round', b.feature, n))}">${n}</a>`).join(', ')}` : ''}`],
  ]))}
  ${relatedList(model, snap, sel, rel, href)}`;
}

function viewAgent(ctx, sel, rel) {
  const { snap, href, model, now } = ctx;
  const a = (snap.agents || []).find((x) => x.id === sel.agent); if (!a) return null;
  const ls = a.liveSteps; const t = a.tokens || {};
  const sameFeature = (snap.agents || []).filter((x) => x.feature === a.feature).sort((p, q) => String(p.startedAt || '').localeCompare(String(q.startedAt || '')));
  const loop = `<ol class="tw-stages" aria-label="Where this agent sits in the release loop">${STAGES.map((s) => `<li class="${s === a.role ? 'tw-cur' : ''}" ${s === a.role ? 'aria-current="step"' : ''}>${esc(ROLE_LABEL[s] || s)}</li>`).join('')}</ol>`;
  return `<header class="tw-vh"><div class="tw-type">Agent</div><h3>${esc(ROLE_LABEL[a.role] || a.role || 'Agent')}${a.round ? ` · round ${a.round}` : ''}${a.feature ? ` — ${esc(a.feature)}` : ''}</h3><div>${pill(agentTone(a.status), ctx.statusText(a.status))} <span class="tw-mono tw-muted">${esc(a.label || a.id)}</span></div></header>
  ${modeNote(ctx)}
  ${sec('Activity', `${loop}${kv([['Result', esc(a.summary || '—')], ['Latest step', `<span class="tw-mono">${esc(a.activity || '—')}</span>`], ['Started', esc(agoText(a.startedAt, now))], ['Last activity', esc(agoText(a.lastActivityAt, now))]])}`)}
  ${sec('Tokens', `<div class="tw-tokens"><div><b>${kfmt(t.output)}</b><span>out</span></div><div><b>${kfmt(t.input)}</b><span>in</span></div><div><b>${kfmt(t.cacheWrite)}</b><span>cache write</span></div><div><b>${kfmt(t.cacheRead)}</b><span>cache read</span></div></div>${t.output == null ? '<div class="tw-muted">Token counts were not recorded for this run.</div>' : ''}`)}
  ${ls ? sec('Live test log', `${kv([['Checks logged', `${ls.checked} (${ls.passed} passed)`]])}${(ls.failed || []).length ? `<ul class="tw-rel">${ls.failed.map((f) => `<li><b>${esc(f.step)}</b> expected: ${esc(f.expect || '—')} · saw: ${esc(f.seen || '—')}</li>`).join('')}</ul>` : ''}`) : ''}
  ${a.failures?.length ? sec(`Command failures it reported (${a.failures.length})`, `<ul class="tw-rel">${a.failures.map((f, i) => `<li>#${i + 1} ${esc(typeof f === 'string' ? f : JSON.stringify(f))}</li>`).join('')}</ul>`) : ''}
  ${a.feature ? sec(`Agents on ${a.feature} in order (${sameFeature.length})`, `<ol class="tw-jlist">${sameFeature.slice(-10).map((x) => `<li class="tw-j${x.id === a.id ? ' tw-me' : ''}"><span class="tw-jt">${x.startedAt ? esc(ctx.fmtT(x.startedAt)) : '—'}</span><span class="tw-jb"><a href="${esc(href('agent', x.id))}">${esc(ROLE_LABEL[x.role] || x.role || 'Agent')}${x.round ? ` · round ${x.round}` : ''}</a> ${pill(agentTone(x.status), ctx.statusText(x.status))}</span></li>`).join('')}</ol>`, ' data-testid="tw-journey"') : ''}
  ${relatedList(model, snap, sel, rel, href)}`;
}

function viewScope(ctx, sel, rel) {
  const { snap, model, href } = ctx;
  const d = model.districts.find((x) => x.id === sel.id); if (!d) return null;
  const rows = d.members.map((id) => model.nodes.find((n) => n.id === id)).filter(Boolean).map((n) => `<tr><td><a href="${esc(href('feature', n.key))}"><b>${esc(n.key)}</b></a></td><td>${pill(n.tone, n.statusLabel)}</td><td class="tw-num">${esc(n.scoreText)}</td><td class="tw-num">${n.counts.bugs}</td></tr>`).join('');
  const added = d.key === 'added' ? `<div class="tw-note">${d.members.map((id) => model.nodes.find((n) => n.id === id)).filter((n) => n?.added).map((n) => `<div><b>${esc(n.key)}</b> · added ${esc(String(n.added.at || '').slice(0, 10))}${n.added.commit ? ` (${esc(n.added.commit)})` : ''} · ${n.scope === 'planned' ? 'counted in this release' : 'kept in backlog'} · ${esc(n.added.reason || '')}</div>`).join('')}</div>` : '';
  return `<header class="tw-vh"><div class="tw-type">District</div><h3>${esc(d.label)}: ${d.total}</h3><div class="tw-muted">${esc(d.note)}</div></header>
  ${modeNote(ctx)}
  ${sec('At a glance', kv([['Features', String(d.total)], ['Passed', `${d.passed} of ${d.total}`], ['Open bugs (this work)', String(d.openBugs)]]))}
  ${added}
  ${sec('Features in this district', d.members.length ? `<div class="tw-tablewrap"><table class="tw-table"><thead><tr><th>Feature</th><th>Status</th><th>Latest test</th><th>Bugs</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="tw-muted">No feature is in this district.</div>')}
  ${relatedList(model, snap, sel, rel, href).replace(/<li><a [^>]*data-id="scope:[^"]*"[\s\S]*?<\/li>/g, '')}`;
}

export function viewHtml(ctx, sel, rel) {
  if (!sel) return null;
  if (sel.kind === 'feature') return viewFeature(ctx, sel, rel);
  if (sel.kind === 'bug') return viewBug(ctx, sel, rel);
  if (sel.kind === 'agent') return viewAgent(ctx, sel, rel);
  if (sel.kind === 'scope') return viewScope(ctx, sel, rel);
  return null;
}

// ── Always-visible overlays: legend, headline chips, the Objects list ────────────────────────────────────────
const TONE_KEY = [['teal', 'In progress'], ['good', 'Passed'], ['bad', 'Failing'], ['gold', 'Awaiting re-test'], ['human', 'Needs a person'], ['muted', 'Queued, not started or agent stopped']];
export function legendHtml(model) {
  const dist = model.districts.map((d, i) => `<li><span class="tw-ring-sw" style="--c:${toneVar(['teal', 'gold', 'muted', 'human'][i] || 'muted')}"></span><b>${esc(d.label)}</b> <span class="tw-muted">${d.total} feature${d.total === 1 ? '' : 's'}${d.total ? ` · ${d.passed} passed` : ''}</span></li>`).join('');
  return `<div class="tw-leg-body">
    <div class="tw-leg-h">Rings (where a feature sits)</div><ul class="tw-leg-list">${dist}</ul>
    <div class="tw-leg-h">Crystal = a feature</div>
    <div class="tw-leg-row">${TONE_KEY.map(([c, l]) => `<span class="tw-k"><span class="tw-gem" style="background:${toneVar(c)}"></span>${esc(l)}</span>`).join('')}</div>
    <div class="tw-muted">Size = steps in its test suite · gold arc = share of steps passing · bubbles = an agent working on it now</div>
    <div class="tw-leg-h">Satellites</div>
    <div class="tw-leg-row"><span class="tw-k"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><polygon points="6,0 12,6 6,12 0,6" fill="${toneVar('s1')}"/></svg>Bug (colour = its state)</span><span class="tw-k"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="${toneVar('good')}"/></svg>Test round (green = all steps passed)</span><span class="tw-k"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><polygon points="6,1 11,11 1,11" fill="${toneVar('teal')}"/></svg>Agent</span></div>
    <div class="tw-leg-row">${CATS.map((c, i) => `<span class="tw-k"><span class="tw-gem" style="background:${toneVar(`s${i + 1}`)}"></span>${esc(c)}</span>`).join('')}</div>
  </div>`;
}
export function headlineHtml(snap, href) {
  const bugs = snap.bugs || [];
  const chips = [
    ['open-bugs', 'Open bugs (this work)', bugs.filter(isOpenBug).length], ['verified', 'Bugs verified fixed', bugs.filter((b) => b.status === 'verified').length],
    ['backlog', 'Backlog: not this work', bugs.filter((b) => BACKLOG.includes(b.status)).length], ['human', 'Need a person', bugs.filter((b) => PERSON.includes(b.status)).length],
    ['agents-running', 'Agents running', (snap.agents || []).filter((a) => a.status === 'running').length],
  ];
  return chips.map(([k, l, n]) => `<a class="tw-chipbtn" href="${esc(href('stat', k))}"><b>${n}</b> ${esc(l)}</a>`).join('');
}
export function objectsHtml(model, href) {
  return model.districts.map((d) => {
    const members = d.members.map((id) => model.nodes.find((n) => n.id === id)).filter(Boolean);
    return `<section class="tw-ol-d"><h2><a href="${esc(href('scope', d.key))}" data-id="${esc(d.id)}">${esc(d.label)}</a> <span class="tw-muted">${d.total}</span></h2>${members.length ? `<ul class="tw-ol">${members.map((n) => `<li><a class="tw-ol-f" href="${esc(href('feature', n.key))}" data-id="${esc(n.id)}"><span><b>${esc(n.key)}</b><br><span class="tw-muted">${esc(n.statusLabel)}</span></span><span class="tw-num tw-muted">${esc(n.scoreText)}</span></a>${n.sats.filter((s) => s.kind !== 'count').length ? `<ul class="tw-ol-s">${n.sats.filter((s) => s.kind !== 'count').map((s) => { const t = twSplit(s.token); return `<li><a href="${esc(t[0] === 'round' ? href('round', t[1], t[2]) : href(...t))}" data-id="${esc(s.id)}"><span class="tw-rtype">${s.kind === 'bug' ? 'Bug' : s.kind === 'round' ? 'Round' : 'Agent'}</span> ${esc(s.short)}</a></li>`; }).join('')}</ul>` : ''}</li>`).join('')}</ul>` : '<div class="tw-muted">No feature here.</div>'}</section>`;
  }).join('');
}

// ── The shared CSS (tokens --tw-* are set from the host's own variables at mount and on theme change) ─────────
export const WORLD_CSS = `
.tw { position: relative; border: 1px solid var(--tw-line); border-radius: 16px; overflow: hidden; background: var(--tw-panel); color: var(--tw-ink); font: 15px/1.45 var(--tw-body, system-ui, sans-serif); }
.tw *, .tw *::before, .tw *::after { box-sizing: border-box; }
.tw a { color: var(--tw-teal); }
.tw-stage { position: relative; height: clamp(560px, calc(100vh - 190px), 900px); overflow: hidden; touch-action: none; outline: none; background: linear-gradient(180deg, var(--tw-waterTop) 0%, var(--tw-waterMid) 45%, var(--tw-waterDeep) 100%); }
.tw-stage:focus-visible { box-shadow: inset 0 0 0 3px var(--tw-gold); }
.tw-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; }
.tw-stage canvas.tw-pointing { cursor: pointer; }
.tw-labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.tw-wl { position: absolute; transform: translate(-50%, 14px); font: 500 12px/1.25 var(--tw-body, system-ui, sans-serif); color: var(--tw-ink); text-align: center; white-space: nowrap; background: color-mix(in srgb, var(--tw-panel) 82%, transparent); padding: 2px 8px; border-radius: 8px; border: 1px solid transparent; transition: opacity .2s; }
.tw-wl b { font: 600 13px var(--tw-display, Georgia, serif); display: block; }
.tw-wl .tw-sub { display: block; color: var(--tw-muted); }
.tw-wl .tw-st { display: inline-block; width: 8px; height: 8px; border-radius: 2px; transform: rotate(45deg); margin-right: 5px; vertical-align: 0; }
.tw-wl.tw-dim { opacity: .22; }
.tw-wl.tw-sel { border-color: var(--tw-gold); background: var(--tw-panel); }
.tw-wl.tw-rel { border-color: var(--tw-teal); }
.tw-wl.tw-kbd { outline: 2px solid var(--tw-gold); }
.tw-wl-sun b { font-size: 17px; }
.tw-wl-sat { transform: translate(-50%, 8px); font-size: 11px; padding: 1px 6px; }
.tw-wl-dist { pointer-events: auto; text-decoration: none; transform: translate(-50%, -50%); font: 600 11px var(--tw-body, system-ui, sans-serif); letter-spacing: .12em; text-transform: uppercase; color: var(--tw-ink); border: 1px solid var(--c, var(--tw-line)); background: color-mix(in srgb, var(--tw-panel) 88%, transparent); padding: 3px 10px; border-radius: 999px; min-height: 24px; }
.tw-wl-dist .tw-muted { text-transform: none; letter-spacing: 0; font-weight: 500; }
.tw-tip { position: absolute; pointer-events: none; background: var(--tw-panel); border: 1px solid var(--tw-line); border-radius: 8px; padding: 7px 10px; font-size: 13px; box-shadow: 0 8px 22px -12px rgba(0,0,0,.35); max-width: 260px; display: none; z-index: 6; }
.tw-muted { color: var(--tw-muted); }
.tw-mono { font-family: var(--tw-mono, ui-monospace, monospace); font-size: 12.5px; }
.tw-num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.tw-hud { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; justify-content: space-between; z-index: 4; pointer-events: none; }
.tw-hud > * { pointer-events: auto; }
.tw-hud-l { display: grid; gap: 8px; justify-items: start; max-width: min(420px, 100%); }
.tw-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tw-chipbtn { display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 4px 11px; border-radius: 999px; border: 1px solid var(--tw-line); background: color-mix(in srgb, var(--tw-panel) 90%, transparent); color: var(--tw-ink) !important; text-decoration: none; font-size: 13px; }
.tw-chipbtn b { font-variant-numeric: tabular-nums; }
.tw-legend { border: 1px solid var(--tw-line); border-radius: 12px; background: color-mix(in srgb, var(--tw-panel) 92%, transparent); max-width: 100%; }
.tw-legend > summary { cursor: pointer; padding: 8px 12px; min-height: 44px; display: flex; align-items: center; font: 600 13px var(--tw-body, system-ui, sans-serif); list-style: none; }
.tw-legend > summary::-webkit-details-marker { display: none; }
.tw-legend > summary::after { content: '▾'; margin-left: 8px; color: var(--tw-muted); }
.tw-legend:not([open]) > summary::after { content: '▸'; }
.tw-leg-body { padding: 2px 12px 12px; display: grid; gap: 6px; font-size: 12.5px; max-height: 42vh; overflow: auto; }
.tw-leg-h { font: 600 11px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .14em; color: var(--tw-muted); margin-top: 4px; }
.tw-leg-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px; }
.tw-leg-row { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.tw-k { display: inline-flex; align-items: center; gap: 6px; }
.tw-gem { width: 10px; height: 10px; transform: rotate(45deg); display: inline-block; border-radius: 2px; }
.tw-ring-sw { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--c); vertical-align: -2px; margin-right: 6px; }
.tw-tools { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
.tw-seg { display: inline-flex; border: 1px solid var(--tw-line); border-radius: 999px; padding: 2px; background: color-mix(in srgb, var(--tw-panel2) 92%, transparent); }
.tw-seg button { font: 500 13px var(--tw-body, system-ui, sans-serif); border: 0; background: transparent; color: var(--tw-ink); border-radius: 999px; padding: 5px 14px; cursor: pointer; min-height: 40px; }
.tw-seg button[aria-pressed="true"] { background: var(--tw-teal); color: var(--tw-panel); }
.tw-seg button:disabled { opacity: .5; cursor: not-allowed; }
.tw-btn { font: 600 13px var(--tw-body, system-ui, sans-serif); border: 1px solid var(--tw-line); background: color-mix(in srgb, var(--tw-panel) 92%, transparent); color: var(--tw-ink); border-radius: 999px; padding: 6px 14px; cursor: pointer; min-height: 44px; }
.tw-btn[aria-pressed="true"], .tw-btn[aria-expanded="true"] { border-color: var(--tw-teal); }
.tw button:focus-visible, .tw a:focus-visible, .tw summary:focus-visible, .tw input:focus-visible { outline: 2px solid var(--tw-gold); outline-offset: 2px; }
.tw-hint { position: absolute; left: 10px; bottom: 62px; z-index: 3; font-size: 12px; color: var(--tw-ink); background: color-mix(in srgb, var(--tw-panel) 80%, transparent); padding: 3px 10px; border-radius: 999px; pointer-events: none; }
.tw-bar { position: absolute; left: 10px; right: 10px; bottom: 10px; display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--tw-panel) 90%, transparent); border: 1px solid var(--tw-line); border-radius: 999px; padding: 4px 10px; z-index: 5; }
.tw-bar input[type=range] { flex: 1; min-width: 0; accent-color: var(--tw-teal); height: 44px; }
.tw-bar .tw-asof { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40%; font-size: 13px; }
.tw-step { min-width: 44px; min-height: 44px; border-radius: 999px; border: 1px solid var(--tw-line); background: var(--tw-panel); color: var(--tw-ink); font: 600 16px var(--tw-body, system-ui, sans-serif); cursor: pointer; }
.tw-step[aria-pressed="true"] { background: var(--tw-teal); color: var(--tw-panel); border-color: var(--tw-teal); }
.tw-step:disabled { opacity: .5; cursor: not-allowed; }
.tw-drawer, .tw-objects { position: absolute; z-index: 5; background: var(--tw-panel); border: 1px solid var(--tw-line); box-shadow: 0 12px 36px -16px rgba(0,0,0,.5); display: flex; flex-direction: column; min-height: 0; }
.tw-drawer[hidden], .tw-objects[hidden] { display: none; }
.tw-drawer { top: 62px; right: 10px; bottom: 66px; width: min(430px, calc(100% - 20px)); border-radius: 14px; }
.tw-objects { top: 62px; left: 10px; bottom: 66px; width: min(360px, calc(100% - 20px)); border-radius: 14px; }
.tw-dh { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 10px; border-bottom: 1px solid var(--tw-line); }
.tw-dh h2 { margin: 0 auto 0 4px; font: 600 12px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .16em; color: var(--tw-muted); }
.tw-db { overflow: auto; padding: 14px; display: grid; gap: 14px; align-content: start; min-height: 0; overscroll-behavior: contain; }
.tw-vh .tw-type { font: 600 11px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .16em; color: var(--tw-muted); }
.tw-vh h3 { margin: 2px 0 6px; font: 600 21px/1.2 var(--tw-display, Georgia, serif); overflow-wrap: anywhere; color: var(--tw-ink); }
.tw-sec h2 { font: 600 11px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .16em; color: var(--tw-muted); margin: 0 0 8px; }
.tw-pill { display: inline-block; font: 600 12px/1 var(--tw-body, system-ui, sans-serif); padding: 4px 9px; border-radius: 999px; color: var(--c); border: 1px solid var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); }
.tw-chip { display: inline-block; font: 600 11px/1 var(--tw-body, system-ui, sans-serif); padding: 3px 7px; border-radius: 999px; background: var(--tw-panel2); color: var(--tw-muted); }
.tw-chip-chg { background: var(--tw-goldSoft); color: var(--tw-gold); }
.tw-kv { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 6px 10px; margin: 0; font-size: 14px; }
.tw-kv dt { color: var(--tw-muted); } .tw-kv dd { margin: 0; overflow-wrap: anywhere; }
.tw-note { border: 1px solid var(--tw-line); background: var(--tw-panel2); border-radius: 10px; padding: 8px 12px; font-size: 13px; }
.tw-note-hist { border-color: var(--tw-gold); background: var(--tw-goldSoft); }
.tw-callout { border: 1px solid var(--tw-human); background: var(--tw-humanSoft); border-radius: 10px; padding: 8px 12px; font-size: 14px; }
.tw-jlist { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; }
.tw-j { display: grid; grid-template-columns: 78px minmax(0, 1fr); gap: 8px; font-size: 13.5px; padding: 4px 0; border-bottom: 1px dashed var(--tw-line); }
.tw-jt { color: var(--tw-muted); font-size: 12.5px; }
.tw-jb { overflow-wrap: anywhere; }
.tw-after { opacity: .55; }
.tw-me { background: var(--tw-tealSoft); }
.tw-chg { margin: 0; padding-left: 18px; color: var(--tw-gold); font-weight: 600; }
.tw-rel { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 13.5px; }
.tw-rel li { min-height: 28px; }
.tw-rtype { display: inline-block; font: 600 10.5px/1 var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .08em; padding: 3px 6px; border-radius: 6px; background: var(--tw-panel2); color: var(--tw-muted); }
.tw-chart { width: 100%; height: auto; display: block; }
.tw-grid { stroke: var(--tw-line); stroke-width: 1; }
.tw-line { stroke: var(--tw-s1); stroke-width: 2; }
.tw-here { stroke: var(--tw-gold); stroke-width: 2; stroke-dasharray: 3 3; }
.tw-rmark { fill: var(--tw-panel2); stroke: var(--tw-muted); stroke-width: 1; }
.tw-rtext, .tw-axis { font: 9px var(--tw-body, system-ui, sans-serif); fill: var(--tw-muted); }
.tw-axis-row { display: flex; justify-content: space-between; gap: 6px; font-size: 11.5px; color: var(--tw-muted); }
.tw-stages { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-wrap: wrap; gap: 4px; }
.tw-stages li { font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--tw-line); color: var(--tw-muted); }
.tw-stages li.tw-done { background: var(--tw-goodSoft); color: var(--tw-good); border-color: var(--tw-good); }
.tw-stages li.tw-cur { background: var(--tw-teal); color: var(--tw-panel); border-color: var(--tw-teal); font-weight: 600; }
.tw-tokens { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; text-align: center; }
.tw-tokens div { border: 1px solid var(--tw-line); border-radius: 10px; padding: 6px 4px; display: grid; }
.tw-tokens span { font-size: 11.5px; color: var(--tw-muted); }
.tw-tablewrap { overflow-x: auto; }
.tw-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.tw-table th, .tw-table td { text-align: left; padding: 6px 6px; border-bottom: 1px solid var(--tw-line); vertical-align: top; }
.tw-table th { font: 600 11px var(--tw-body, system-ui, sans-serif); color: var(--tw-muted); text-transform: uppercase; letter-spacing: .08em; }
.tw-ol-d { margin-bottom: 10px; } .tw-ol-d h2 { font: 600 11px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .16em; margin: 0 0 6px; }
.tw-ol-d h2 a { color: var(--tw-ink); }
.tw-ol, .tw-ol-s { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.tw-ol-f { display: flex; justify-content: space-between; gap: 10px; padding: 8px; border-radius: 8px; text-decoration: none; color: var(--tw-ink) !important; font-size: 13.5px; min-height: 44px; align-items: center; }
.tw-ol-f:hover, .tw-ol-f:focus-visible, .tw-ol-s a:hover { background: var(--tw-tealSoft); }
.tw-ol-s { margin-left: 18px; }
.tw-ol-s a { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 4px 8px; border-radius: 8px; text-decoration: none; font-size: 13px; }
.tw-ol-on { background: var(--tw-goldSoft); }
.tw-sheet-toggle { display: none; }
.tw-fallback { padding: 12px; }
.tw-host { display: grid; gap: 14px; }
.tw-host:empty { display: none; }
.tw-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 760px) {
  .tw-stage { height: clamp(520px, calc(100vh - 150px), 820px); }
  .tw-hud { top: 8px; left: 8px; right: 8px; }
  .tw-hint { display: none; }
  .tw-legend:not([open]) { max-width: 150px; }
  .tw-drawer { top: auto; left: 8px; right: 8px; bottom: 64px; width: auto; max-height: 56%; border-radius: 16px 16px 12px 12px; }
  .tw-drawer[data-collapsed="true"] .tw-db { display: none; }
  .tw-drawer[data-collapsed="true"] { max-height: none; }
  .tw-objects { top: auto; left: 8px; right: 8px; bottom: 64px; width: auto; max-height: 62%; }
  .tw-sheet-toggle { display: inline-flex; }
  .tw-bar .tw-asof { display: none; }
  .tw-kv { grid-template-columns: 1fr; gap: 0; } .tw-kv dt { margin-top: 6px; }
  .tw-j { grid-template-columns: 58px minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) { .tw-wl { transition: none; } }
`;

// ── The controller: DOM + Three.js ───────────────────────────────────────────────────────────────────────────
const TOKENS = ['panel', 'panel2', 'ink', 'muted', 'line', 'teal', 'tealSoft', 'gold', 'goldSoft', 'good', 'goodSoft', 'bad', 'badSoft', 'human', 'humanSoft', 's1', 's2', 's3', 's4', 'waterTop', 'waterMid', 'waterDeep', 'sand'];

/**
 * createTrackerWorld({ THREE, geo, root, host })
 *   host: { cssVar(token) -> css value, hashFor(path[]) -> '#/...', navigate(hash), reducedMotion, statusText, fmtT,
 *           pointIndexAt(iso), bind? (render-binding resolver), environment? }
 *   geo : { addCrystalLights(scene, THREE), signature(group, THREE), buildGemMesh(THREE, opts), buildRiverParticles(THREE, opts),
 *           advanceRiverParticles(points, dt), projectToScreen(THREE, v3, camera, w, h), buildEnvironment(name, scene, THREE, opts) }
 * Returns { update({snap, hist, path, now}), setAt(i|null), refreshColors(), hostSlot, state(), dispose() }.
 */
export function createTrackerWorld({ THREE, geo, root, host }) {
  const css = () => { if (!document.getElementById('tw-style')) { const s = document.createElement('style'); s.id = 'tw-style'; s.textContent = WORLD_CSS; document.head.appendChild(s); } };
  css();
  const cv = (t) => host.cssVar(t) || '#888888';
  const col = (t) => new THREE.Color(cv(t));
  let reduce = !!host.reducedMotion; let paused = false;
  const S = { snap: null, hist: null, path: [], now: Date.now(), at: null, lastHistoric: null, model: null, sel: null, rel: { ids: new Set(), why: {}, links: [], active: false }, kbd: -1, collapsed: false, hostOverview: false, viewKey: '' };

  root.innerHTML = `<div class="tw" data-tw="1">
    <div class="tw-stage" tabindex="0" role="application" aria-label="Release world. Use the arrow keys to move between objects, Enter to open one, Escape to go back. Every object is also in the Objects list.">
      <div class="tw-labels" aria-hidden="true"></div><div class="tw-tip" role="status"></div>
      <div class="tw-hud"><div class="tw-hud-l"><div class="tw-chips"></div><details class="tw-legend" open><summary>Legend</summary><div class="tw-legend-slot"></div></details></div>
        <div class="tw-tools"><div class="tw-seg" role="group" aria-label="World state"><button type="button" data-state="current" aria-pressed="true">Current</button><button type="button" data-state="historic" aria-pressed="false">Historic</button></div>
          <button type="button" class="tw-btn" data-act="objects" aria-expanded="false" aria-controls="tw-objects">Objects</button>${host.overviewSlot ? '<button type="button" class="tw-btn" data-act="datamap" aria-pressed="false">Data map</button>' : ''}<button type="button" class="tw-btn" data-act="pause" aria-pressed="false">Pause motion</button></div></div>
      <div class="tw-hint">Drag to orbit · scroll or pinch to zoom · click an object to open it</div>
      <aside class="tw-objects" id="tw-objects" hidden aria-label="Every object in the world"><div class="tw-dh"><h2>Objects</h2><button type="button" class="tw-btn" data-act="objects-close">Close</button></div><div class="tw-db tw-objects-body"></div></aside>
      <aside class="tw-drawer" hidden aria-label="Data view" aria-live="polite"><div class="tw-dh"><button type="button" class="tw-btn" data-act="back">‹ Back</button><button type="button" class="tw-btn" data-act="overview">Overview</button><h2 class="tw-dtitle">Data view</h2><button type="button" class="tw-btn tw-sheet-toggle" data-act="sheet" aria-expanded="true">Collapse</button></div>
        <div class="tw-db"><div class="tw-own"></div><div class="tw-host"></div></div></aside>
      <div class="tw-bar" hidden><button type="button" class="tw-step" data-act="prev" aria-label="Previous update (world)">‹</button><input type="range" min="0" max="0" step="1" value="0" aria-label="Replay the world at an earlier moment"><button type="button" class="tw-step" data-act="next" aria-label="Next update (world)">›</button><button type="button" class="tw-step" data-act="live" aria-pressed="true" style="padding:0 12px">Live</button><span class="tw-asof" aria-live="polite"></span></div>
    </div></div>`;
  const $ = (sel) => root.querySelector(sel);
  const stage = $('.tw-stage'); const labelsEl = $('.tw-labels'); const tipEl = $('.tw-tip'); const drawer = $('.tw-drawer'); const objectsEl = $('.tw-objects'); const bar = $('.tw-bar');
  const own = $('.tw-own'); const hostSlot = $('.tw-host'); const range = bar.querySelector('input'); const asof = bar.querySelector('.tw-asof');
  const twRoot = $('.tw');

  function syncTokens() { TOKENS.forEach((t) => twRoot.style.setProperty(`--tw-${t}`, cv(t))); twRoot.style.setProperty('--tw-body', host.cssVar('body') || ''); twRoot.style.setProperty('--tw-display', host.cssVar('display') || ''); twRoot.style.setProperty('--tw-mono', host.cssVar('mono') || ''); }
  syncTokens();

  // ---- Three.js scene ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.prepend(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D release world. Every object in it is listed under Objects.');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  geo.addCrystalLights(scene, THREE);
  const sun = new THREE.Group(); geo.signature(sun, THREE);
  sun.userData = { kind: 'sun', id: 'sun' }; sun.children.forEach((m) => { m.userData = sun.userData; });
  scene.add(sun);
  const env = geo.buildEnvironment(host.environment || 'underwater', scene, THREE, { palette: { waterMid: col('waterMid'), sand: col('sand') }, keepClear: 80 });
  if (scene.fog && scene.fog.density) scene.fog.density = Math.min(scene.fog.density, 0.009);   // a wider world needs thinner water
  const clock = new THREE.Clock();
  const cam = { theta: 0.6, phi: 0.92, dist: 30, target: new THREE.Vector3(), want: { dist: 30, target: new THREE.Vector3() }, shiftX: 0, shiftY: 0, wantShiftX: 0, wantShiftY: 0 };
  let objs = {}; let rings = []; let rivers = []; let linkLines = []; const pickables = []; let graphSig = ''; let outerR = 20;
  let drag = null; let pinch = null; const pointers = new Map(); let disposed = false; let raf = 0; let lastPublish = 0; let selRing = null;
  const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(); const v3 = new THREE.Vector3();
  const disposeObj = (o) => o.traverse((x) => { x.geometry?.dispose?.(); (Array.isArray(x.material) ? x.material : [x.material]).forEach((m) => m?.dispose?.()); });

  const hrefTo = (...parts) => {
    const t = parts[0] === 'round' ? twTok('round', parts[1], parts[2]) : twTok(...parts);
    const i = S.path.indexOf(t);
    return host.hashFor(i >= 0 ? S.path.slice(0, i + 1) : [...S.path, t]);
  };
  const openTok = (id) => { if (!id) { host.navigate(host.hashFor([])); return; } const t = twSplit(id); host.navigate(hrefTo(...t)); };
  const back = () => host.navigate(host.hashFor(S.path.slice(0, -1)));

  function layoutRadii(model) {
    const radii = []; let prev = 0;
    model.districts.forEach((d, i) => { const r = Math.max(i === 0 ? 8 : prev + 5.5, d.total * 0.62, 5); radii.push(r); prev = r; });
    return radii;
  }

  function build(model) {
    Object.values(objs).forEach((o) => { if (o.group) { scene.remove(o.group); disposeObj(o.group); } });
    rings.forEach((r) => { scene.remove(r); disposeObj(r); }); rivers.forEach((r) => { scene.remove(r); disposeObj(r); }); linkLines.forEach((l) => { scene.remove(l.line); disposeObj(l.line); });
    objs = {}; rings = []; rivers = []; linkLines = []; pickables.length = 0; sun.children.forEach((m) => pickables.push(m));
    const radii = layoutRadii(model); outerR = (radii[radii.length - 1] || 7) + 3.2;
    const toneOfDistrict = ['teal', 'gold', 'muted', 'human'];
    model.districts.forEach((d, i) => {
      const r = radii[i]; const c = col(toneOfDistrict[i] || 'muted');
      const g = new THREE.Group();
      const line = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 6, 160), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75 })); line.rotation.x = Math.PI / 2; g.add(line);
      const band = new THREE.Mesh(new THREE.RingGeometry(r - 1.5, r + 1.5, 96), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })); band.rotation.x = -Math.PI / 2; g.add(band);
      const hit = new THREE.Mesh(new THREE.TorusGeometry(r, 0.45, 6, 96), new THREE.MeshBasicMaterial({ visible: false })); hit.rotation.x = Math.PI / 2; hit.userData = { kind: 'district', id: d.id, district: d }; g.add(hit); pickables.push(hit);
      g.position.y = -1.0; scene.add(g); rings.push(g); g.userData.radius = r; g.userData.districtId = d.id;
    });
    const posByTok = {};
    model.nodes.forEach((node) => {
      const di = Math.max(0, model.districts.findIndex((d) => d.key === node.district)); const d = model.districts[di];
      const j = d.members.indexOf(node.id); const n = Math.max(1, d.members.length);
      const a = (j / n) * Math.PI * 2 + di * 0.55; const R = radii[di];
      const group = new THREE.Group(); group.position.set(Math.cos(a) * R, Math.sin(a * 2) * 0.4, Math.sin(a) * R);
      const size = 0.34 + node.weight * 0.5; const tc = col(node.tone);
      const gem = geo.buildGemMesh(THREE, { color: tc, size, metalness: 0.15, roughness: 0.45 });
      gem.material.emissive = tc.clone(); gem.material.emissiveIntensity = 0.45; gem.material.transparent = true;
      gem.userData = { kind: 'feature', id: node.id, node }; pickables.push(gem); group.add(gem);
      gem.add(new THREE.LineSegments(new THREE.EdgesGeometry(gem.geometry), new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 })));
      const hitF = new THREE.Mesh(new THREE.SphereGeometry(size + 0.5, 8, 8), new THREE.MeshBasicMaterial({ visible: false })); hitF.userData = gem.userData; group.add(hitF); pickables.push(hitF);
      const ringR = size + 0.6;
      const track = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.025, 6, 64), new THREE.MeshBasicMaterial({ color: col('line'), transparent: true, opacity: 0.9 })); track.rotation.x = Math.PI / 2; group.add(track);
      if (node.progress != null && node.progress > 0) { const arc = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.055, 8, 96, Math.PI * 2 * Math.min(1, node.progress)), new THREE.MeshBasicMaterial({ color: 0xC4843A, transparent: true })); arc.rotation.x = Math.PI / 2; group.add(arc); }
      if (node.changed) { const ping = new THREE.Mesh(new THREE.TorusGeometry(ringR + 0.55, 0.04, 6, 64), new THREE.MeshBasicMaterial({ color: col('gold'), transparent: true, opacity: 0.95 })); ping.rotation.x = Math.PI / 2; ping.userData.ping = true; group.add(ping); }
      const sats = new THREE.Group(); const satMeshes = {};
      const bugs = node.sats.filter((s) => s.kind === 'bug' || s.kind === 'count'); const rounds = node.sats.filter((s) => s.kind === 'round'); const agents = node.sats.filter((s) => s.kind === 'agent');
      const mkSat = (s, mesh, pos) => {
        mesh.position.copy(pos); mesh.userData = { kind: s.kind, id: s.id, sat: s, node };
        if (mesh.material) { mesh.material.transparent = true; }
        if (s.pending) { mesh.material.opacity = 0.35; mesh.material.depthWrite = false; mesh.userData.ghost = true; const dash = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineDashedMaterial({ color: 0xC4843A, dashSize: 0.03, gapSize: 0.02, transparent: true })); dash.computeLineDistances(); mesh.add(dash); }
        const hit = new THREE.Mesh(new THREE.SphereGeometry(0.34, 6, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.userData = mesh.userData; mesh.add(hit); pickables.push(hit);
        pickables.push(mesh); sats.add(mesh); satMeshes[s.id] = satMeshes[s.id] || mesh;
      };
      const stdMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c.clone(), emissiveIntensity: 0.4, flatShading: true, roughness: 0.45, transparent: true });
      bugs.forEach((s, k) => { const sc = col(s.tone); const m = geo.buildGemMesh(THREE, { color: sc, size: 0.12, metalness: 0.1, roughness: 0.45 }); m.material.emissive = sc.clone(); m.material.emissiveIntensity = 0.4; const ang = (k / Math.max(1, bugs.length)) * Math.PI * 2; const rr = ringR + 0.9 + (k % 3) * 0.3; mkSat(s, m, new THREE.Vector3(Math.cos(ang) * rr, ((k % 5) - 2) * 0.16, Math.sin(ang) * rr)); });
      rounds.forEach((s, k) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), stdMat(col(s.tone))); const ang = (k / Math.max(1, rounds.length)) * Math.PI * 2 + 0.4; m.rotation.set(0.4, 0.6, 0); mkSat(s, m, new THREE.Vector3(Math.cos(ang) * ringR, 0, Math.sin(ang) * ringR)); });
      agents.forEach((s, k) => { const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.16, 0), stdMat(col(s.tone))); const ang = (k / Math.max(1, agents.length)) * Math.PI * 2 + 1.2; mkSat(s, m, new THREE.Vector3(Math.cos(ang) * (ringR * 0.9), 1.15 + (k % 2) * 0.25, Math.sin(ang) * (ringR * 0.9))); });
      group.add(sats); scene.add(group);
      objs[node.id] = { group, gem, sats, node, satMeshes, baseY: group.position.y, ringR };
      Object.keys(satMeshes).forEach((id) => { objs[id] = { satOf: node.id, mesh: satMeshes[id], sat: node.sats.find((s) => s.id === id) }; });
      posByTok[node.id] = group;
      if (node.active) { const rv = geo.buildRiverParticles(THREE, { from: new THREE.Vector3(0, 0, 0), to: group.position, color: 0xE8FBFF, count: 70, curveLift: 0.9 }); rv.material.size = 0.16; scene.add(rv); rivers.push(rv); }
    });
    env.setPalette({ waterMid: col('waterMid'), sand: col('sand') });
    buildLabels(model); applySelection(true);
  }

  function buildLabels(model) {
    const m = model;
    const score = `${m.root.score}${m.hasScopes ? ' (this release)' : ''}`;
    labelsEl.innerHTML = `<div class="tw-wl tw-wl-sun" data-id="sun"><b>${esc(m.root.label)}</b>${esc(m.root.sub)} · ${esc(score)}</div>`
      + m.districts.map((d) => `<a class="tw-wl tw-wl-dist" data-id="${esc(d.id)}" data-district="${esc(d.key)}" href="${esc(hrefTo('scope', d.key))}" style="--c:${toneVar(['teal', 'gold', 'muted', 'human'][m.districts.indexOf(d)] || 'muted')}">${esc(d.label)} <span class="tw-muted">${d.total ? `${d.passed}/${d.total} passed` : 'none'}</span></a>`).join('')
      + m.nodes.map((n) => `<div class="tw-wl" data-id="${esc(n.id)}"><b><span class="tw-st" style="background:${toneVar(n.tone)}"></span>${esc(n.label)}</b><span class="tw-sub">${esc(n.statusLabel)} · ${n.pct != null ? `${esc(n.scoreText)} · ${n.pct}%` : esc(n.scoreText)}</span>${n.changed ? `<span class="tw-sub" style="color:${toneVar('gold')}">${n.changed.absent ? 'not tracked yet then' : 'changed since'}</span>` : ''}<span class="tw-sub">${n.counts.bugs} bug${n.counts.bugs === 1 ? '' : 's'} · ${n.counts.rounds} round${n.counts.rounds === 1 ? '' : 's'}${n.agentsAll ? ` · ${n.agentsAll} agent${n.agentsAll === 1 ? '' : 's'}` : ''}</span></div>`).join('')
      + m.nodes.flatMap((n) => n.sats.filter((s) => s.kind !== 'count').map((s) => `<div class="tw-wl tw-wl-sat" data-id="${esc(s.id)}" data-sat="1" style="display:none"><span class="tw-st" style="background:${toneVar(s.tone)}"></span>${esc(s.short)}</div>`)).join('');
  }

  // ---- selection, highlight, camera ----
  function applySelection(snapCam) {
    const rel = S.rel; const sel = S.sel; const hasSel = rel.active;
    const featureOf = sel && sel.feature ? twTok('feature', sel.feature) : null;
    Object.entries(objs).forEach(([id, o]) => {
      if (o.group) {
        const on = !hasSel || rel.ids.has(id);
        o.group.traverse((x) => { if (x.material && !x.material.userData?.keep && x.userData?.kind !== 'district') { const base = x.userData?.ghost ? 0.35 : 1; const sat = x.userData?.kind && x.userData.kind !== 'feature' && x.userData.id; const satOn = !hasSel || (sat ? rel.ids.has(x.userData.id) || x.userData.id === sel?.id : on); x.material.opacity = (sat ? (satOn ? 1 : 0.14) : (on ? 1 : 0.18)) * base; } });
        o.gem.scale.setScalar(sel && sel.id === id ? 1.3 : on && hasSel ? 1.12 : 1);
      } else if (o.mesh) {
        const isSel = sel && sel.id === id; const on = !hasSel || rel.ids.has(id) || isSel;
        o.mesh.scale.setScalar(isSel ? 2.1 : on && hasSel ? 1.5 : 1);
      }
    });
    rings.forEach((r) => { const on = !hasSel || rel.ids.has(r.userData.districtId); r.traverse((x) => { if (x.material && x.userData?.kind !== 'district') x.material.opacity = (x.geometry.type === 'RingGeometry' ? 0.1 : 0.75) * (on ? 1 : 0.3); }); });
    // relation lines
    linkLines.forEach((l) => { scene.remove(l.line); disposeObj(l.line); }); linkLines = [];
    rel.links.forEach(([a, b]) => {
      const pa = objs[a]?.group || objs[a]?.mesh; const pb = objs[b]?.group || objs[b]?.mesh; if (!pa || !pb) return;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col('gold'), transparent: true, opacity: 0.9 }));
      line.frustumCulled = false; scene.add(line); linkLines.push({ line, pa, pb });
    });
    // camera
    const f = featureOf && objs[featureOf];
    const R = outerR; const half = Math.tan((camera.fov * Math.PI) / 360);
    if (sel && sel.kind === 'scope') {
      const idx = S.model.districts.findIndex((d) => d.id === sel.id); const r = (layoutRadii(S.model)[idx] || 8) + 2.4;
      cam.want.target.set(0, -0.4, 0); cam.want.dist = fitDist(r);
    } else if (f) {
      cam.want.target.copy(f.group.position); cam.want.dist = sel.kind === 'feature' ? 10 : 8.5;
    } else {
      cam.want.target.set(0, -0.4, 0); cam.want.dist = fitDist(R);
    }
    layoutOffsets();
    if (reduce || snapCam === 'cut') { cam.target.copy(cam.want.target); cam.dist = cam.want.dist; cam.shiftX = cam.wantShiftX; cam.shiftY = cam.wantShiftY; }
    updateLabelClasses();
  }
  // Distance at which a disc of radius R (seen from the camera's tilt) fits the stage, labels included.
  function fitDist(R) {
    const half = Math.tan((camera.fov * Math.PI) / 360); const asp = Math.max(0.3, camera.aspect || 1);
    return Math.max(16, Math.max((R * (0.35 + 0.65 * Math.cos(cam.phi)) + 2) / half, R / (half * asp)) * 1.0);
  }
  function layoutOffsets() {
    const open = !drawer.hidden; const narrow = stage.clientWidth < 760;
    const leg = root.querySelector('.tw-legend'); const legOpen = leg && leg.open && !narrow;
    const rightInset = open && !narrow ? drawer.offsetWidth + 10 : 0; const leftInset = Math.max(legOpen ? leg.offsetWidth + 10 : 0, !objectsEl.hidden && !narrow ? objectsEl.offsetWidth + 10 : 0);
    cam.wantShiftX = (rightInset - leftInset) / 2;
    cam.wantShiftY = open && narrow && !(drawer.dataset.collapsed === 'true') ? drawer.offsetHeight * 0.5 : 0;
  }
  function updateLabelClasses() {
    const rel = S.rel; const sel = S.sel;
    labelsEl.querySelectorAll('.tw-wl').forEach((el) => {
      const id = el.dataset.id; const isSun = id === 'sun';
      const on = !rel.active || rel.ids.has(id) || isSun;
      el.classList.toggle('tw-dim', rel.active && !on);
      el.classList.toggle('tw-sel', !!sel && sel.id === id);
      el.classList.toggle('tw-rel', rel.active && rel.ids.has(id) && !(sel && sel.id === id));
      el.classList.toggle('tw-kbd', S.kbd >= 0 && kbdOrder()[S.kbd] === id);
      if (el.dataset.district) el.setAttribute('href', hrefTo('scope', el.dataset.district));
    });
  }
  const kbdOrder = () => (S.model ? [...S.model.districts.map((d) => d.id), ...S.model.nodes.flatMap((n) => [n.id, ...n.sats.filter((s) => s.kind !== 'count').map((s) => s.id)])] : []);

  function placeCamera(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-(dt || 0.016) * 5);   // time-based, so a slow frame rate settles as fast as a fast one
    cam.target.lerp(cam.want.target, k); cam.dist += (cam.want.dist - cam.dist) * k; cam.shiftX += (cam.wantShiftX - cam.shiftX) * k; cam.shiftY += (cam.wantShiftY - cam.shiftY) * k;
    camera.position.set(cam.target.x + cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta), cam.target.y + cam.dist * Math.cos(cam.phi), cam.target.z + cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta));
    camera.lookAt(cam.target);
    const w = stage.clientWidth; const h = stage.clientHeight;
    if (Math.abs(cam.shiftX) > 0.5 || Math.abs(cam.shiftY) > 0.5) camera.setViewOffset(w, h, cam.shiftX, cam.shiftY, w, h); else camera.clearViewOffset();
  }

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05); const t = clock.elapsedTime; const still = reduce || paused;
    if (!still) {
      sun.rotation.y += dt * 0.18; sun.position.y = Math.sin(t * 0.5) * 0.12;
      Object.values(objs).forEach((o, i) => { if (!o.group) return; o.gem.rotation.y += dt * 0.5; o.sats.rotation.y += dt * (0.22 + (i % 3) * 0.04); o.group.position.y = o.baseY + Math.sin(t * 0.8 + i * 1.3) * 0.15; o.group.traverse((x) => { if (x.userData?.ping) x.scale.setScalar(1 + 0.08 * Math.sin(t * 3)); }); });
      env.update(t, dt, camera); rivers.forEach((r) => geo.advanceRiverParticles(r, dt));
      if (!drag && !pinch && !S.sel) cam.theta += dt * 0.02;
    }
    placeCamera(dt);
    linkLines.forEach((l) => { const pos = l.line.geometry.getAttribute('position'); l.pa.getWorldPosition(v3); pos.setXYZ(0, v3.x, v3.y, v3.z); l.pb.getWorldPosition(v3); pos.setXYZ(1, v3.x, v3.y, v3.z); pos.needsUpdate = true; });
    renderer.render(scene, camera);
    positionLabels(t);
  }

  function positionLabels(t) {
    const w = stage.clientWidth; const h = stage.clientHeight; const narrow = w < 760; const rel = S.rel; const sel = S.sel;
    const published = []; const radii = S.model ? layoutRadii(S.model) : [];
    labelsEl.querySelectorAll('.tw-wl').forEach((el) => {
      const id = el.dataset.id; const isSun = id === 'sun'; const isDist = !!el.dataset.district; const isSat = !!el.dataset.sat;
      let pos = null;
      if (isSun) pos = sun.position;
      else if (isDist) { const i = S.model.districts.findIndex((d) => d.id === id); const r = radii[i] || 6; const a = cam.theta + (i - (S.model.districts.length - 1) / 2) * 0.5; v3.set(Math.cos(a) * r, -1.0, Math.sin(a) * r); pos = v3; }
      else if (isSat) { const o = objs[id]; if (o?.mesh) { o.mesh.getWorldPosition(v3); pos = v3; } }
      else { const o = objs[id]; pos = o?.group?.position || null; if (o?.group) { o.group.getWorldPosition(v3); pos = v3; } }
      if (!pos) { el.style.display = 'none'; return; }
      const p = geo.projectToScreen(THREE, pos.clone(), camera, w, h);
      if (p && isDist) { p.y = Math.min(Math.max(p.y, 150), h - 84); p.x = Math.min(Math.max(p.x, 90), w - 90); }
      let hide = !p || p.x < -60 || p.x > w + 60 || p.y < -30 || p.y > h + 30;
      if (isSat) hide = hide || !(rel.active && (rel.ids.has(id) || (sel && sel.id === id)));
      // Phone: crowded labels collapse into the Objects list; the sun, the districts, the selection and what is related to it stay.
      if (narrow && !isSun && !isDist && !isSat) hide = hide || (rel.active ? !(rel.ids.has(id) || (sel && sel.id === id)) : !(S.model && S.model.nodes.length <= 4));
      if (!isSat && !isSun && !isDist && !p) hide = true;
      el.style.display = hide ? 'none' : '';
      if (!hide) {
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y + (isDist ? 0 : isSun ? 32 : (sel && sel.id === id) ? 40 : 16)}px`;
        el.style.zIndex = (sel && sel.id === id) ? 3 : isDist ? 1 : 2;
      }
      if (!isSun && !isDist && p) published.push({ id, kind: isSat ? (objs[id]?.sat?.kind || 'sat') : 'feature', x: Math.round(p.x), y: Math.round(p.y), visible: !hide });
    });
    if (t - lastPublish > 0.25) publish(published, t);
    lastPublish = t > lastPublish + 0.25 ? t : lastPublish;
  }
  function publish(published) {
    stage.dataset.crystals = JSON.stringify(published);
    const m = S.model;
    stage.dataset.world = JSON.stringify({
      environment: host.environment || 'underwater', nodes: m ? m.nodes.length : 0,
      satellites: pickables.filter((p) => ['bug', 'count', 'round', 'agent'].includes(p.userData?.kind) && p.geometry?.type !== 'SphereGeometry').length,
      bugs: m ? m.nodes.reduce((n, x) => n + x.sats.filter((s) => s.kind === 'bug' || s.kind === 'count').length, 0) : 0,
      rounds: m ? m.nodes.reduce((n, x) => n + x.sats.filter((s) => s.kind === 'round').length, 0) : 0,
      agents: m ? m.nodes.reduce((n, x) => n + x.sats.filter((s) => s.kind === 'agent').length, 0) : 0,
      rivers: rivers.length, districts: m ? m.districts.map((d) => ({ key: d.key, total: d.total })) : [],
      focusId: S.sel?.feature ? S.sel.feature : null, selected: S.sel?.id || null, related: [...S.rel.ids], mode: S.at == null ? 'current' : 'historic', at: S.at,
      changed: m ? m.nodes.filter((n) => n.changed).map((n) => n.key) : [], paused, reducedMotion: reduce,
    });
  }

  // ---- picking and gestures ----
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(pickables, false);
    const order = { bug: 0, count: 0, round: 0, agent: 0, feature: 1, sun: 2, district: 3 };
    const hit = hits.filter((h) => h.object.visible).sort((a, b) => ((order[a.object.userData.kind] ?? 4) - (order[b.object.userData.kind] ?? 4)) || a.distance - b.distance)[0];
    return hit ? hit.object.userData : null;
  }
  canvas.twPick = (cx, cy, detail) => {   // test hook: what is under this page point
    const u = pick({ clientX: cx, clientY: cy });
    if (!detail) return u ? (u.id || u.kind) : null;
    const f = Object.values(objs).find((o) => o.group);
    const fp = f ? f.group.getWorldPosition(new THREE.Vector3()).project(camera) : null;
    return { pick: u ? (u.id || u.kind) : null, n: pickables.length, ndc: [mouse.x, mouse.y], ray: ray.ray.direction.toArray(), org: ray.ray.origin.toArray(), cam: camera.position.toArray(), firstFeatureNdc: fp && fp.toArray(), rect: canvas.getBoundingClientRect().toJSON(), size: [canvas.width, canvas.height] };
  };
  const dist2 = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  function onDown(e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    if (pointers.size === 2) { pinch = { d: dist2(), dist: cam.want.dist }; drag = null; } else drag = { x: e.clientX, y: e.clientY, moved: 0 };
  }
  function tipFor(u) {
    if (u.kind === 'feature') return `<b>${esc(u.node.label)}</b><br>${esc(u.node.statusLabel)} · ${esc(u.node.scoreText)}<br><span class="tw-muted">${u.node.counts.bugs} bug(s), ${u.node.counts.rounds} round(s) · click to open</span>`;
    if (u.kind === 'district') return `<b>${esc(u.district.label)}</b><br><span class="tw-muted">${u.district.total} feature(s) · click to open</span>`;
    if (u.sat) return `<b>${esc(u.sat.label)}</b><br><span class="tw-muted">${esc(u.node.label)}${u.sat.pending ? ' · fix pending approval (re-test)' : ''} · click to open</span>`;
    return '';
  }
  function onMove(e) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) { cam.want.dist = Math.max(3, Math.min(70, pinch.dist * (pinch.d / Math.max(1, dist2())))); return; }
    if (drag) { cam.theta += (e.clientX - drag.x) * 0.006; cam.phi = Math.max(0.3, Math.min(1.45, cam.phi - (e.clientY - drag.y) * 0.004)); drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; return; }
    const u = pick(e);
    canvas.classList.toggle('tw-pointing', !!u && u.kind !== 'sun');
    if (!u || u.kind === 'sun') { tipEl.style.display = 'none'; return; }
    const r = stage.getBoundingClientRect();
    tipEl.innerHTML = tipFor(u); tipEl.style.display = 'block'; tipEl.style.left = `${Math.max(0, Math.min(e.clientX - r.left + 14, r.width - 270))}px`; tipEl.style.top = `${Math.max(0, e.clientY - r.top + 14)}px`;
  }
  function onUp(e) {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    const wasDrag = drag && drag.moved > 6; drag = null; if (wasDrag) return;
    const u = pick(e); stage.dataset.lastPick = u ? (u.id || u.kind) : 'none'; if (!u) return;
    tipEl.style.display = 'none';
    if (u.kind === 'sun') openTok(null); else openTok(u.kind === 'count' ? u.node.id : u.id);
  }
  const onLeave = () => { tipEl.style.display = 'none'; };
  const onWheel = (e) => { e.preventDefault(); cam.want.dist = Math.max(3, Math.min(70, cam.want.dist * (1 + Math.sign(e.deltaY) * 0.1))); };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp); canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // Keyboard: arrows move a cursor over objects (districts, features, then their satellites), Enter opens, Escape goes back.
  stage.addEventListener('keydown', (e) => {
    if (e.target !== stage) { if (e.key === 'Escape' && S.path.length) { e.preventDefault(); back(); } return; }
    const order = kbdOrder();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); S.kbd = (S.kbd + 1) % Math.max(1, order.length); announceKbd(order); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); S.kbd = (S.kbd - 1 + order.length) % Math.max(1, order.length); announceKbd(order); }
    else if (e.key === 'Enter' && S.kbd >= 0) { e.preventDefault(); openTok(order[S.kbd]); }
    else if (e.key === 'Escape' && S.path.length) { e.preventDefault(); back(); }
    else if (e.key === '+' || e.key === '=') cam.want.dist = Math.max(3, cam.want.dist * 0.85);
    else if (e.key === '-') cam.want.dist = Math.min(70, cam.want.dist * 1.15);
  });
  function announceKbd(order) {
    const id = order[S.kbd]; updateLabelClasses();
    const o = S.model.nodes.find((n) => n.id === id) || S.model.nodes.flatMap((n) => n.sats).find((s) => s.id === id); const d = S.model.districts.find((x) => x.id === id);
    stage.setAttribute('aria-description', `Cursor on ${d ? d.label : o?.label || id}. Press Enter to open.`);
    tipEl.style.display = 'block'; tipEl.style.left = '12px'; tipEl.style.top = '110px'; tipEl.innerHTML = `<b>${esc(d ? d.label : (o?.label || id))}</b><br><span class="tw-muted">Enter to open</span>`;
  }
  stage.addEventListener('blur', () => { S.kbd = -1; tipEl.style.display = 'none'; updateLabelClasses(); });

  // ---- chrome: buttons, slider ----
  const jump = (dir) => {
    const hist = S.hist; if (!hist) return; const last = hist.points.length - 1; const cur = S.at == null ? last : S.at;
    const idx = updateMarkIndexes(hist, host.pointIndexAt); const tgt = dir < 0 ? [...idx].reverse().find((x) => x < cur) : idx.find((x) => x > cur);
    const to = tgt == null ? (dir < 0 ? 0 : last) : tgt; setAt(to >= last ? null : to);
  };
  function setAt(i) { S.at = i == null ? null : i; if (S.at != null) S.lastHistoric = S.at; render(); }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    const act = b.dataset.act; const st = b.dataset.state;
    if (st === 'current') setAt(null);
    else if (st === 'historic') { if (!S.hist) return; const i = S.lastHistoric ?? defaultHistoricIndex(S.hist, host.pointIndexAt); setAt(i); }
    else if (act === 'pause') { paused = !paused; b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? 'Resume motion' : 'Pause motion'; }
    else if (act === 'objects') { objectsEl.hidden = !objectsEl.hidden; b.setAttribute('aria-expanded', String(!objectsEl.hidden)); renderDrawer(); }
    else if (act === 'objects-close') { objectsEl.hidden = true; root.querySelector('[data-act="objects"]').setAttribute('aria-expanded', 'false'); renderDrawer(); }
    else if (act === 'back') { if (!S.path.length) { S.hostOverview = false; render(); } else back(); }
    else if (act === 'datamap') { S.hostOverview = !S.hostOverview; render(); }
    else if (act === 'overview') host.navigate(host.hashFor([]));
    else if (act === 'sheet') { const c = drawer.dataset.collapsed === 'true'; drawer.dataset.collapsed = String(!c); b.setAttribute('aria-expanded', String(c)); b.textContent = c ? 'Collapse' : 'Expand'; layoutOffsets(); }
    else if (act === 'prev') jump(-1); else if (act === 'next') jump(1); else if (act === 'live') setAt(null);
  });
  range.addEventListener('input', () => { const last = S.hist.points.length - 1; setAt(Number(range.value) >= last ? null : Number(range.value)); });
  objectsEl.addEventListener('click', (e) => { if (e.target.closest('a') && stage.clientWidth < 760) { objectsEl.hidden = true; root.querySelector('[data-act="objects"]').setAttribute('aria-expanded', 'false'); } });

  // ---- render everything from state ----
  const cache = { legend: '', chips: '', objects: '', own: '', title: '' };
  function ctxFor() {
    return { snap: S.snap, hist: S.hist, at: S.at, model: S.model, href: hrefTo, statusText: host.statusText, fmtT: host.fmtT, pointIndexAt: host.pointIndexAt, now: S.now };
  }
  function renderDrawer() {
    const sel = S.sel; const pathOpen = S.path.length > 0 || S.hostOverview;
    const html = sel && ['feature', 'bug', 'agent', 'scope'].includes(sel.kind) ? viewHtml(ctxFor(), sel, S.rel) : null;
    const hasHost = pathOpen && !html;      // a layer the host draws (stat, status updates, a round ...)
    const open = pathOpen && !(objectsEl.hidden === false && stage.clientWidth < 760);
    drawer.hidden = !open;
    if (html !== null && html !== cache.own) { const sc = $('.tw-db').scrollTop; own.innerHTML = html; cache.own = html; $('.tw-db').scrollTop = sc; }
    if (html === null && cache.own !== '') { own.innerHTML = ''; cache.own = ''; }
    const title = !S.path.length && S.hostOverview ? 'Data map' : sel && sel.kind === 'round' ? 'Test round' : sel && sel.kind === 'missing' ? 'Not found' : 'Data view';
    if (title !== cache.title) { drawer.querySelector('.tw-dtitle').textContent = title; cache.title = title; }
    drawer.querySelector('[data-act="overview"]').hidden = S.path.length < 2;
    const dm = root.querySelector('[data-act="datamap"]'); if (dm) dm.setAttribute('aria-pressed', String(S.hostOverview && !S.path.length));
    root.dataset.hostLayer = hasHost ? '1' : '0';
    layoutOffsets();
  }
  function render() {
    if (!S.snap) return;
    const last = S.hist ? S.hist.points.length - 1 : 0;
    if (S.hist && S.at != null && S.at >= last) S.at = null;
    S.model = buildWorldModel({ snap: S.snap, hist: S.hist, at: S.at, bind: host.bind, statusText: host.statusText, fmtT: host.fmtT });
    S.sel = selectionOf(S.path, S.snap);
    if (S.sel && S.sel.kind === 'round') { /* the round's own data view is drawn by the host (Board layer) */ }
    S.rel = relatedOf(S.model, S.snap, S.sel);
    const sig = JSON.stringify(S.model.nodes.map((n) => [n.id, n.tone, n.weight, n.progress, n.active, n.absent, !!n.changed, n.sats.map((s) => [s.id, s.tone, s.pending])])) + JSON.stringify(S.model.districts.map((d) => [d.id, d.total])) + S.model.root.sub;
    if (sig !== graphSig) { graphSig = sig; build(S.model); } else { buildLabelsTextOnly(); applySelection(false); }
    // chrome
    const ctx = ctxFor();
    const leg = legendHtml(S.model); if (leg !== cache.legend) { $('.tw-legend-slot').innerHTML = leg; cache.legend = leg; }
    const chips = headlineHtml(S.snap, hrefTo); if (chips !== cache.chips) { $('.tw-chips').innerHTML = chips; cache.chips = chips; }
    const objs2 = objectsHtml(S.model, hrefTo) + `<!--${S.path.join('/')}-->`; if (objs2 !== cache.objects) { $('.tw-objects-body').innerHTML = objs2; cache.objects = objs2; }
    objectsEl.querySelectorAll('a[data-id]').forEach((a) => a.classList.toggle('tw-ol-on', !!S.sel && a.dataset.id === S.sel.id));
    const hasHist = !!S.hist && S.hist.points.length > 1;
    bar.hidden = !hasHist;
    root.querySelector('[data-state="historic"]').disabled = !hasHist;
    root.querySelector('[data-state="historic"]').title = hasHist ? '' : 'No history has been recorded yet';
    root.querySelector('[data-state="current"]').setAttribute('aria-pressed', String(S.at == null));
    root.querySelector('[data-state="historic"]').setAttribute('aria-pressed', String(S.at != null));
    if (hasHist) {
      range.min = 0; range.max = last; range.value = S.at == null ? last : S.at;
      bar.querySelector('[data-act="live"]').setAttribute('aria-pressed', String(S.at == null));
      const pt = S.at != null ? S.hist.points[S.at] : null; const u = pt ? updateAtPoint(S.hist, S.at, host.pointIndexAt) : null;
      asof.innerHTML = pt ? `${esc(host.fmtT(pt.t))} UTC${u ? ` · after ${esc(u.version)}` : ''}` : '<b>Live</b>';
    }
    renderDrawer(); void ctx;
    stage.classList.toggle('tw-has-sel', !!S.sel);
    const vk = `${S.path.join('/')}|${S.at}|${S.hostOverview}`;
    if (host.onView && (vk !== S.viewKey || S.snap !== S.viewSnap)) { S.viewKey = vk; S.viewSnap = S.snap; host.onView({ sel: S.sel, at: S.at, path: S.path, overview: S.hostOverview && !S.path.length, slot: hostSlot, owns: !!S.sel && ['feature', 'bug', 'agent', 'scope'].includes(S.sel.kind) }); }
  }
  function buildLabelsTextOnly() { /* labels are rebuilt whenever the graph signature changes; text for unchanged graphs is identical */ }

  const ro = new ResizeObserver(() => {
    const w = stage.clientWidth; const h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); if (S.model) applySelection(false);
  });
  ro.observe(stage);
  const ro2 = new ResizeObserver(() => layoutOffsets()); ro2.observe(drawer);
  root.querySelector('.tw-legend').addEventListener('toggle', () => layoutOffsets());
  frame();

  return {
    hostSlot,
    update({ snap, hist, path, now }) {
      const changedPath = S.path.join('/') !== (path || []).join('/');
      if (changedPath && (path || []).length) S.hostOverview = false;
      S.snap = snap; S.hist = hist || null; S.path = path || []; S.now = now || Date.now();
      if (S.at != null && (!S.hist || S.at >= S.hist.points.length - 1)) S.at = null;
      render();
      if (changedPath) { S.kbd = -1; const b = $('.tw-db'); if (b) b.scrollTop = 0; }
    },
    setAt, getAt: () => S.at,
    refreshColors() { syncTokens(); graphSig = ''; if (S.snap) render(); },
    setReducedMotion(v) { reduce = !!v; applySelection(true); },
    ownsView: () => !!S.sel && ['feature', 'bug', 'agent', 'scope'].includes(S.sel.kind),
    state: () => ({ nodes: S.model ? S.model.nodes.length : 0, selected: S.sel?.id || null, related: [...S.rel.ids], mode: S.at == null ? 'current' : 'historic', paused, reduce }),
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); ro2.disconnect();
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('pointerleave', onLeave); canvas.removeEventListener('wheel', onWheel);
      Object.values(objs).forEach((o) => { if (o.group) disposeObj(o.group); }); rings.forEach(disposeObj); rivers.forEach(disposeObj); disposeObj(sun); try { env.dispose(); } catch { /* environment already gone */ }
      renderer.dispose(); canvas.remove(); root.innerHTML = '';
    },
  };
}
