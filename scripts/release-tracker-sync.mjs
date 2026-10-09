#!/usr/bin/env node
// Builds the release tracker snapshot from a release-loop workflow run.
//
//   node scripts/release-tracker-sync.mjs --run <workflow transcript dir> [--run <another>] [--steps-root <dir>] [--extra <agent transcript>=<label>] --out snapshot.json
//
// Reads the workflow journal (agent started/finished + each agent's structured result) and each agent's
// own transcript (latest activity + token usage), and derives feature, agent and bug status using the
// same rules as server/data/releaseLoop/definition.json (bugEscalation). Writes one JSON snapshot that the
// tracker page renders. Contains labels, statuses, summaries and counts only — never transcript text.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const runDirs = argv.flatMap((a, i) => (a === '--run' ? [argv[i + 1]] : []));   // one or more workflow runs
const runDir = runDirs[0] || null;
const out = opt('--out');
// Where validators append live step logs (<root>/<feature>/round-N/steps.jsonl). Default is the shared local test root.
const stepsRoot = opt('--steps-root') || '/var/tmp/sbpg/release-loop';
// Minutes of silence after which a started agent with no end entry is treated as dead (override for fixtures).
const STALE_MIN = Number(opt('--stale-minutes') ?? 15);
const extras = argv.flatMap((a, i) => (a === '--extra' ? [argv[i + 1]] : []));
const definition = JSON.parse(fs.readFileSync(new URL('../server/data/releaseLoop/definition.json', import.meta.url), 'utf8'));
const MAX_ATTEMPTS = definition.bugEscalation?.maxFixAttemptsPerBug ?? 2;

const clip = (s, n = 280) => (typeof s === 'string' && s.length > n ? `${s.slice(0, n - 1)}…` : s ?? null);
const readJsonl = (p) => {
  try {
    return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
};

// Latest activity + token totals from an agent transcript.
function agentActivity(file) {
  const rows = readJsonl(file);
  const usage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  let activity = null; let lastAt = null; let firstAt = null;
  const signals = [];   // page errors / failed app requests the agent's own tools printed
  const perMessage = new Map();   // one message is streamed as several rows; keep its final usage
  for (const r of rows) {
    if (r.timestamp) { lastAt = r.timestamp; firstAt = firstAt || r.timestamp; }
    const m = r.message;
    if (r.type === 'user' && m && Array.isArray(m.content)) {
      for (const c of m.content) {
        if (c?.type !== 'tool_result') continue;
        const t = typeof c.content === 'string' ? c.content : (Array.isArray(c.content) ? c.content.map((x) => x?.text || '').join('\n') : '');
        for (const line of t.split('\n')) {
          const pe = line.match(/PAGEERROR\s+(.*)/);
          const rf = line.match(/REQFAIL\s+(https?:\/\/(?:localhost|127\.0\.0\.1)[^\s]*)\s*(.*)/);
          if (pe) signals.push({ type: 'pageerror', detail: clip(pe[1], 200), at: r.timestamp });
          else if (rf) signals.push({ type: 'requestfailed', detail: clip(`${rf[1]} ${rf[2]}`, 200), at: r.timestamp });
        }
      }
    }
    if (r.type === 'assistant' && m) {
      if (m.usage) perMessage.set(m.id || `row${perMessage.size}`, m.usage);
      for (const c of Array.isArray(m.content) ? m.content : []) {
        if (c.type === 'tool_use') {
          const i = c.input || {};
          const d = i.description || i.subject
            || (i.file_path ? `${c.name} ${path.basename(i.file_path)}` : null)
            || (i.command ? `$ ${String(i.command).split('\n')[0]}` : null)
            || (i.pattern ? `${c.name} ${i.pattern}` : null) || c.name;
          activity = clip(d, 140);
        }
      }
    }
  }
  for (const u of perMessage.values()) {
    usage.input += u.input_tokens || 0;
    usage.cacheWrite += u.cache_creation_input_tokens || 0;
    usage.cacheRead += u.cache_read_input_tokens || 0;
    usage.output += u.output_tokens || 0;
  }
  const uniq = [...new Map(signals.map((x) => [`${x.type}|${x.detail}`, x])).values()];
  return { activity, usage, firstAt, lastAt, signals: uniq.slice(-30) };
}

const archiveDirs = argv.flatMap((a, i) => (a === '--archive' ? [argv[i + 1]] : []));   // stopped runs: history only
const journal = [...archiveDirs, ...runDirs].flatMap((d) => readJsonl(path.join(d, 'journal.jsonl')).map((e) => ({ ...e, runDir: d, archived: archiveDirs.includes(d) })));
const agents = new Map();
for (const e of journal) {
  if (!e.agentId) continue;
  const a = agents.get(e.agentId) || { id: e.agentId, label: e.label, phase: e.phase, status: 'running', result: null, file: path.join(e.runDir, `agent-${e.agentId}.jsonl`), fromRun: true };
  if (e.label) a.label = e.label;
  if (e.phase) a.phase = e.phase;
  if (e.type === 'started') { a.status = e.archived ? 'stopped' : 'running'; a.journalStart = e.at || e.ts || e.timestamp || null; }
  else {
    const res = e.result ?? e.value ?? e.output ?? null;
    // A finished agent with no result died or was skipped — shown as failed, never as done.
    a.status = res == null || /error|fail|abort|kill|skip/i.test(e.type) ? 'failed' : 'done';
    a.result = res;
    a.endType = e.type;
  }
  agents.set(e.agentId, a);
}
for (const x of extras) {
  const [file, label] = x.split('=');
  agents.set(`extra:${label}`, { id: `extra:${label}`, label, phase: label.split(':')[0] === 'build' ? 'Build' : 'Other', status: 'running', result: null, file });
}

// A resumed run re-launches an agent under the same label; only its latest attempt is current.
// Earlier attempts that died (e.g. at a usage limit) stay visible as a count, not as the live status.
const latestByLabel = new Map();
for (const a of agents.values()) latestByLabel.set(a.label, a.id);
const supersededFailures = {};
for (const a of [...agents.values()]) {
  if (a.label && latestByLabel.get(a.label) !== a.id) {
    supersededFailures[a.label] = (supersededFailures[a.label] || 0) + 1;
    agents.delete(a.id);
  }
}
const agentList = [];
for (const a of agents.values()) {
  const file = a.file;
  const act = file && fs.existsSync(file) ? agentActivity(file) : { activity: null, usage: null };
  // Dead-agent detection for every running agent. Last sign of life = latest transcript line, else the journal start time.
  // A journal-built agent with no end entry is 'stalled' (it died or was cut off); a hand-added --extra transcript stays 'idle_or_done'.
  const alive = act.lastAt || a.journalStart;
  if (a.status === 'running' && alive && Date.now() - Date.parse(alive) > STALE_MIN * 60 * 1000) a.status = a.fromRun ? 'stalled' : 'idle_or_done';
  const [role, feature, round] = String(a.label || '').split(':');
  const r = a.result && typeof a.result === 'object' ? a.result : null;
  let summary = null;
  if (r) {
    if (role === 'build') summary = `Initial check ${r.initialCheckPassed ? 'passed' : 'did not pass'} · branch ${r.branch}`;
    else if (role === 'integrate') summary = r.merged ? `Merged → ${String(r.head).slice(0, 7)}${r.conflicts?.length ? ` · ${r.conflicts.length} conflicts resolved` : ''}${r.buildPassed ? '' : ' · BUILD FAILED'}` : 'Merge failed';
    else if (role === 'validate') summary = `${r.stepsPassed}/${r.stepsTotal} steps passed${r.baselineVersion ? ` on baseline v${r.baselineVersion}` : ''}${r.passed ? ' · PASS' : ' · FAIL'}`;
    else if (role === 'triage') summary = `${r.items?.length ?? 0} triage items`;
    else if (role === 'fix') summary = `${r.fixed?.length ?? 0} fixed · ${r.notFixed?.length ?? 0} not fixed`;
    else if (role === 'scope') { const own = (r.items || []).filter((i) => i.scope === 'this_feature').length; summary = `${r.items?.length ?? 0} items · ${own} this feature's · ${(r.items?.length ?? 0) - own} backlog`; }
  } else if (typeof a.result === 'string') summary = clip(a.result, 200);
  let liveSteps = null;
  if (role === 'validate' && feature && round) {
    const rows = readJsonl(path.join(stepsRoot, feature, `round-${round.replace('r', '')}`, 'steps.jsonl'));
    const steps = rows.filter((x) => x.result);
    liveSteps = {
      passed: steps.filter((x) => x.result === 'pass').length,
      failed: steps.filter((x) => x.result !== 'pass').map((x) => ({ step: `${x.journey || ''} ${x.step || ''}`.trim(), expect: clip(x.expect, 200), seen: clip(x.seen, 200), result: x.result })).slice(-30),
      errors: rows.filter((x) => x.type === 'pageerror' || x.type === 'requestfailed').map((x) => ({ type: x.type, detail: clip(x.detail || x.url, 200) })).slice(-30),
      checked: steps.length,
    };
  }
  if (role === 'reconcile' && r) {
    const un = (r.items || []).filter((x) => x.status !== 'resolved');
    summary = `${(r.items || []).length} reported items checked · ${un.length} unresolved`;
  }
  if (supersededFailures[a.label]) summary = `${summary ? `${summary} · ` : ''}${supersededFailures[a.label]} earlier attempt(s) died and were retried`;
  agentList.push({ liveSteps, signals: act.signals || [],
    id: a.id, label: a.label, role, feature, round: round ? Number(round.replace('r', '')) : null,
    phase: a.phase, status: a.status, activity: act.activity, summary, tokens: act.usage,
    startedAt: act.firstAt || a.journalStart || null, lastActivityAt: act.lastAt || null,
    failures: r?.failures && Array.isArray(r.failures) ? r.failures.slice(0, 20).map((f) => clip(typeof f === 'string' ? f : JSON.stringify(f), 240)) : [],
  });
}

// Features + bugs, derived round by round.
const byFeature = {};
for (const a of agentList) {
  if (!a.feature) continue;
  (byFeature[a.feature] ||= []).push(a);
}
for (const k of (opt('--features') || '').split(',').filter(Boolean)) byFeature[k] ||= [];
const features = []; const bugs = [];
// Whose bug is it? Decisions from the one-time review (docs/triage/scope-review.json) and from each run's
// scope agents. Out-of-scope bugs stay on the tracker as non-blocking backlog; the latest decision wins.
const scopeDecisions = new Map();
const SCOPE_STATUS = { pre_existing: 'backlog_pre_existing', other_feature: 'reassigned', process_note: 'process_note' };
try {
  const raw = JSON.parse(fs.readFileSync(opt('--scope-review') || new URL('../docs/triage/scope-review.json', import.meta.url), 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.items || raw.bugs || Object.entries(raw.decisions || {}).map(([id, d]) => ({ id, ...d }));
  for (const it of items) if (it?.id && it.scope) scopeDecisions.set(it.id, { ...it, decidedBy: 'scope review' });
} catch { /* no review yet */ }
for (const [key, list] of Object.entries(byFeature)) {
  const res = (role, round) => agents.get(list.find((a) => a.role === role && (round == null || a.round === round))?.id)?.result;
  const validations = list.filter((a) => a.role === 'validate').sort((x, y) => x.round - y.round);
  const fb = new Map(); const attempts = {};
  // 1. Failures the build/fix reconciliation left unresolved are bugs from the start (ids match the
  //    workflow's carried items: <feature>-B<n> for the build, <feature>-F<round>-<n> for a fix round).
  for (const rc of list.filter((a) => a.role === 'reconcile')) {
    const rr = agents.get(rc.id)?.result;
    const fixRound = (rc.label.match(/fix-r(\d+)/) || [])[1];
    for (const [i, it] of (rr?.items || []).entries()) {
      if (it.status === 'resolved') continue;
      const id = fixRound ? `${key}-F${fixRound}-${i + 1}` : `${key}-B${i + 1}`;
      if (!fb.has(id)) fb.set(id, { id, feature: key, status: 'open', class: it.kind, step: clip(it.step || it.reported, 200), rootCause: clip(it.rootCause || it.evidence, 400), files: it.files || [], firstRound: 0, history: [{ round: fixRound ? Number(fixRound) : 0, event: 'found', note: `Reported by the ${fixRound ? 'fix' : 'build'} agent, unresolved on reconciliation (${it.kind})` }] });
    }
  }
  // 2. Each test round: fixed bugs are re-tested; failures are triaged; fixes are applied.
  for (const v of validations) {
    const vr = agents.get(v.id)?.result;
    if (!vr) {
      for (const b of fb.values()) if (b.status === 'fixed_awaiting_retest' && v.status === 'running') b.status = 'retesting';
      continue;
    }
    const tr = res('triage', v.round);
    const reported = new Set((tr?.items || []).map((i) => i.recurrenceOf || i.id));
    for (const b of fb.values()) {
      if (!['fixed_awaiting_retest', 'retesting'].includes(b.status)) continue;
      if (vr.passed) { b.status = 'verified'; b.history.push({ round: v.round, event: 'verified', note: `Retest round ${v.round} passed every step`, commit: vr.commitTested || null }); }
      else if (!tr) b.status = 'retest_failed_pending_triage';
      else if (!reported.has(b.id)) { b.status = 'verified'; b.history.push({ round: v.round, event: 'verified', note: `Retest round ${v.round}: this bug's step passed (the round had other failures)`, commit: vr.commitTested || null }); }
    }
    if (vr.passed) continue;
    for (const item of tr?.items || []) {
      const id = item.recurrenceOf || item.id;
      const prev = fb.get(id);
      const b = prev || { id, feature: key, firstRound: v.round, history: [] };
      b.step = clip(item.step, 200); b.rootCause = clip(item.rootCause, 400); b.class = item.class; b.files = item.files;
      b.question = item.question || null;
      b.history.push({ round: v.round, event: prev ? 'recurred' : 'found', note: clip(item.rootCause, 200) });
      if (item.class === 'needs_business_definition') b.status = 'needs_business_definition';
      else if ((attempts[id] || 0) >= MAX_ATTEMPTS) b.status = 'needs_human';
      else b.status = prev ? 'recurred' : 'open';
      fb.set(id, b);
    }
    const fr = res('fix', v.round);
    if (fr) {
      for (const f of fr.fixed || []) {
        const b = fb.get(f.id); if (!b) continue;
        attempts[f.id] = (attempts[f.id] || 0) + 1; b.attempts = attempts[f.id];
        b.status = 'fixed_awaiting_retest'; b.history.push({ round: v.round, event: 'fixed', note: clip(f.what, 200), files: f.files, commit: fr.commit || null });
      }
      for (const f of fr.notFixed || []) {
        const b = fb.get(f.id); if (!b) continue;
        b.history.push({ round: v.round, event: 'not_fixed', note: clip(f.why, 200) });
      }
    } else if (list.some((a) => a.role === 'fix' && a.round === v.round && a.status === 'running')) {
      for (const b of fb.values()) if (['open', 'recurred'].includes(b.status)) b.status = 'fixing';
    }
  }
  for (const b of list.filter((a) => (a.role === 'build' || a.role === 'fix') && a.status === 'done')) {
    const reconciled = list.some((a) => a.role === 'reconcile' && a.status === 'done' && (b.role === 'build' ? a.label.endsWith(':build') : a.label.includes(`fix-r${b.round}`)));
    if (b.failures.length && !reconciled) { b.status = 'done_unreconciled'; b.summary = `${b.summary || 'Finished'} · ${b.failures.length} reported failures not yet reconciled`; }
  }
  // Failures a running validator has already seen (live log or its own tool output), before triage.
  for (const v of list.filter((a) => a.role === 'validate' && a.status === 'running')) {
    const live = [...(v.liveSteps?.failed || []).map((f) => ({ step: f.step, note: `Expected: ${f.expect || '—'} · Saw: ${f.seen || '—'}` })),
      ...(v.liveSteps?.errors || []).map((e) => ({ step: e.type, note: e.detail })),
      ...(v.signals || []).map((e) => ({ step: e.type, note: e.detail }))];
    live.forEach((f, i) => fb.set(`${key}-R${v.round}-live${i + 1}`, { id: `${key}-R${v.round}-live${i + 1}`, feature: key, status: 'seen_in_test', step: clip(f.step, 200), rootCause: clip(f.note, 400), history: [{ round: v.round, event: 'seen', note: 'Seen by the test agent; goes to triage when the round ends' }] }));
  }
  // Scope check results for this feature (scope:<feature>:r<N>): whose bug each triage item is.
  for (const sc of list.filter((a) => a.role === 'scope')) {
    for (const it of agents.get(sc.id)?.result?.items || []) scopeDecisions.set(it.id, { ...it, round: sc.round, decidedBy: sc.label });
  }
  bugs.push(...fb.values());
  const last = [...validations].reverse().find((v) => agents.get(v.id)?.result) || null;   // last round that finished
  const lastRes = last ? agents.get(last.id)?.result : null;
  const running = list.filter((a) => a.status === 'running');
  let status = 'queued';
  if (running.length) status = running.map((a) => a.role).join(', ');
  // A fix after the last test round means the feature is waiting on a retest, never "passed".
  else if (lastRes && list.some((a) => a.role === 'fix' && a.round >= last.round)) status = 'awaiting_retest';
  else if (lastRes?.passed) status = 'passed';
  else if ([...fb.values()].some((b) => b.status === 'needs_human')) status = 'needs_human';
  else if (lastRes) status = 'failing';
  else if (list.length && list[list.length - 1].status === 'failed') status = 'failed';
  else if (list.length && list[list.length - 1].status === 'stalled') status = 'stalled';   // the latest agent died with no result
  else if (list.length) status = 'between_stages';
  features.push({
    key, status, rounds: validations.length,
    lastResult: lastRes ? { round: last.round, passed: lastRes.passed, stepsPassed: lastRes.stepsPassed, stepsTotal: lastRes.stepsTotal, baseline: lastRes.baselineVersion ?? null, report: lastRes.reportPath } : null,
    openBugs: [...fb.values()].filter((b) => !['verified'].includes(b.status)).length,
    agents: list.length,
  });
}

// Permanent bug ledger: a bug never disappears from the tracker. If a later sync no longer derives it
// (a run was replaced or restarted), its last known state is kept and marked as carried over.
const ledgerPath = opt('--ledger');
if (ledgerPath) {
  let ledger = {};
  try { ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8')); } catch { /* first run */ }
  const now = new Map(bugs.map((b) => [b.id, b]));
  for (const [id, old] of Object.entries(ledger)) {
    if (!now.has(id) && old.status !== 'seen_in_test') bugs.push({ ...old, carriedOver: true });
  }
  for (const b of bugs) if (b.status !== 'seen_in_test') ledger[b.id] = b;
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger));
}

for (const b of bugs) {
  const d = scopeDecisions.get(b.id);
  if (!d) continue;
  b.scope = { scope: d.scope, owner: d.owner || null, evidence: clip(d.evidence, 400), decidedBy: d.decidedBy, round: d.round ?? null };
  if (SCOPE_STATUS[d.scope] && !['verified', 'seen_in_test'].includes(b.status)) {
    b.blockedStatus = b.status; b.status = SCOPE_STATUS[d.scope];
  }
}
const NON_BLOCKING = new Set(['verified', 'seen_in_test', ...Object.values(SCOPE_STATUS)]);
for (const f of features) {
  const mine = bugs.filter((b) => b.feature === f.key);
  f.openBugs = mine.filter((b) => !NON_BLOCKING.has(b.status)).length;
  f.backlog = mine.filter((b) => Object.values(SCOPE_STATUS).includes(b.status)).length;
  f.reassignedIn = bugs.filter((b) => b.status === 'reassigned' && b.scope?.owner === f.key).length;
  // Every remaining failure belongs elsewhere: the feature itself passes, with backlog.
  if (f.status === 'failing' && f.openBugs === 0 && f.backlog > 0) f.status = 'passed_with_backlog';
}

// Carry-over from earlier sessions (--carry <file>): a new session's runs start from nothing, so the agents,
// round counts and last results recorded by earlier sessions come from the carry file (committed as
// docs/release-log/tracker-carry.json) and are merged in. Read once per session from a fixed copy, so
// nothing is counted twice; --carry-out writes the merged result for the next session.
const carryPath = opt('--carry');
if (carryPath && fs.existsSync(carryPath)) {
  const carry = JSON.parse(fs.readFileSync(carryPath, 'utf8'));
  const ids = new Set(agentList.map((a) => a.id));
  for (const a of carry.agents || []) if (!ids.has(a.id)) agentList.push({ ...a, status: a.status === 'running' ? 'stopped' : a.status, carriedOver: true });
  const counts = Object.fromEntries(Object.entries(byFeature).map(([k, l]) => [k, l.length]));
  for (const cf of carry.features || []) {
    const f = features.find((x) => x.key === cf.key);
    if (!f) { features.push({ ...cf, carriedOver: true }); continue; }
    if (!counts[cf.key]) { Object.assign(f, { ...cf, status: /^(build|integrate|validate|triage|scope|fix|reconcile|record|amend)/.test(cf.status) ? 'between_stages' : cf.status, carriedOver: true }); continue; }
    f.rounds += cf.rounds || 0; f.agents += cf.agents || 0;
    if (!f.lastResult && cf.lastResult) f.lastResult = cf.lastResult;
  }
}
const carryOut = opt('--carry-out');
if (carryOut) {
  const lean = agentList.map(({ liveSteps, signals, ...a }) => ({ ...a, failures: (a.failures || []).slice(0, 5).map((f) => clip(typeof f === 'string' ? f : JSON.stringify(f), 160)), activity: clip(a.activity, 120) }));
  fs.writeFileSync(carryOut, `${JSON.stringify({ writtenAt: new Date().toISOString(), agents: lean, features }, null, 0)}\n`);
}

// Numbered status updates (scripts/release-update.mjs), shown on the tracker with their comparisons.
let updates = [];
try { updates = JSON.parse(fs.readFileSync(new URL('../docs/release-log/updates.json', import.meta.url), 'utf8')); } catch { /* none yet */ }
let releaseInfo = null;
try { const d = JSON.parse(fs.readFileSync(new URL('../docs/release-log/active-release.features.json', import.meta.url), 'utf8')); releaseInfo = { version: d.version || null, release: d.release, title: d.title || null }; } catch { /* optional */ }

const snapshot = {
  release: releaseInfo,
  updates,
  runId: runDirs.map((d) => path.basename(d)).join(' + ') || null,
  syncedAt: new Date().toISOString(),
  maxFixAttemptsPerBug: MAX_ATTEMPTS,
  repoUrl: opt('--repo-url') || null,
  maxFixRounds: definition.maxFixRounds,
  features, agents: agentList.sort((x, y) => String(y.startedAt || '').localeCompare(String(x.startedAt || ''))), bugs,
  totals: agentList.reduce((t, a) => {
    for (const k of ['input', 'cacheWrite', 'cacheRead', 'output']) t[k] += a.tokens?.[k] || 0;
    return t;
  }, { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }),
};
// The tracker database holds one document of at most 256 KB. Finished agents keep their counts and only
// their first few failures, shortened; running agents keep full detail. Bug records are never dropped.
for (const a of snapshot.agents) {
  a.failures = (a.failures || []).map((f) => clip(typeof f === 'string' ? f : JSON.stringify(f), 240));
  if (a.status !== 'running' && a.liveSteps) {
    const trim = (x) => ({ ...x, expect: clip(x.expect, 120), seen: clip(x.seen, 120), detail: clip(x.detail, 160) });
    a.liveSteps = { ...a.liveSteps, failedTotal: a.liveSteps.failed.length, failed: a.liveSteps.failed.slice(0, 8).map(trim), errors: (a.liveSteps.errors || []).slice(0, 5).map(trim) };
  }
}
let json = JSON.stringify(snapshot);
// Measured as stored: the tracker keeps the snapshot as one JSON-quoted string field, which adds escaping.
// Bugs are stored in their own document (tracker/bugs), so each of the two documents must fit the cap.
const LIMIT = 230 * 1024;   // headroom under the 256 KB document cap as the release grows
const stored = (j) => { const o = JSON.parse(j); const bugs = o.bugs || []; delete o.bugs;
  return Math.max(Buffer.byteLength(JSON.stringify({ json: JSON.stringify(o) })), Buffer.byteLength(JSON.stringify({ json: JSON.stringify(bugs) }))); };
if (stored(json) > LIMIT) {   // over budget: keep running agents, the latest per feature+role, and the last six hours; count the rest
  const dayAgo = Date.now() - 6 * 3600 * 1000; const latest = new Map();
  for (const a of snapshot.agents) { const k = `${a.feature}|${a.role}`; const t = Date.parse(a.lastActivityAt || a.startedAt || 0) || 0; if (!latest.has(k) || t > latest.get(k).t) latest.set(k, { id: a.id, t }); }
  const keep = (a) => a.status === 'running' || [...latest.values()].some((x) => x.id === a.id) || (Date.parse(a.lastActivityAt || 0) || 0) > dayAgo;
  const before = snapshot.agents.length; snapshot.agents = snapshot.agents.filter(keep);
  snapshot.agentsTrimmed = before - snapshot.agents.length;   // full records stay in the run journals and git history
  json = JSON.stringify(snapshot);
}
if (stored(json) > LIMIT) {   // still too big: drop finished agents' step detail, then shorten history notes
  for (const a of snapshot.agents) if (a.status !== 'running' && a.liveSteps) a.liveSteps = { ...a.liveSteps, failed: [], errors: [] };
  json = JSON.stringify(snapshot);
  if (stored(json) > LIMIT) for (const b of snapshot.bugs) for (const h of b.history || []) h.note = clip(h.note, 100);
  json = JSON.stringify(snapshot);
  if (stored(json) > LIMIT) {   // last resort: drop finished agents' latest-step text and failure text (counts stay)
    for (const a of snapshot.agents) if (a.status !== 'running') { a.activity = clip(a.activity, 80); a.failures = a.failures.map((f) => clip(f, 80)); }
    json = JSON.stringify(snapshot);
  }
  if (stored(json) > LIMIT) {   // then shorten bug text (full text stays in the ledger and triage files) and older updates' per-feature detail
    const done = new Set(['verified', 'backlog_pre_existing', 'reassigned', 'process_note']);
    for (const b of snapshot.bugs) {
      b.rootCause = clip(b.rootCause, done.has(b.status) ? 160 : 400);
      if (b.scope?.evidence) b.scope = { ...b.scope, evidence: clip(b.scope.evidence, 160) };
      if (done.has(b.status)) for (const h of b.history || []) h.note = clip(h.note, 60);
    }
    (snapshot.updates || []).slice(0, -2).forEach((u) => { if (u.metrics) u.metrics = { ...u.metrics, features: undefined }; });
    json = JSON.stringify(snapshot);
  }
  if (stored(json) > LIMIT) {   // finally: every bug keeps its short root cause and its last six history events in full
    for (const b of snapshot.bugs) {
      b.rootCause = clip(b.rootCause, 200);
      if ((b.history || []).length > 6) { b.historyTrimmed = b.history.length - 6; b.history = b.history.slice(-6); }
      for (const h of b.history || []) h.note = clip(h.note, 80);
    }
    json = JSON.stringify(snapshot);
  }
  if (stored(json) > LIMIT) {   // still over: compact every bug to its essentials (full records: bug ledger, triage files, git)
    for (const b of snapshot.bugs) {
      b.step = clip(b.step, 160); b.rootCause = clip(b.rootCause, 140);
      if ((b.files || []).length > 3) { b.filesTrimmed = b.files.length - 3; b.files = b.files.slice(0, 3); }
      if (b.scope?.evidence) b.scope = { ...b.scope, evidence: clip(b.scope.evidence, 90) };
      if ((b.history || []).length > 4) { b.historyTrimmed = (b.historyTrimmed || 0) + b.history.length - 4; b.history = b.history.slice(-4); }
      for (const h of b.history || []) h.note = clip(h.note, 60);
      if (b.status === 'seen_in_test') { delete b.rootCause; delete b.files; delete b.history; }
    }
    json = JSON.stringify(snapshot);
  }
  if (stored(json) > LIMIT) console.error(`Snapshot is ${stored(json)} bytes stored, over the tracker's ${LIMIT}-byte budget.`);
}
if (out) fs.writeFileSync(out, json); else process.stdout.write(json);

// Optional live push to the platform (PLATFORM_URL + RELEASE_TRACKER_INGEST_TOKEN). A failure is logged and
// makes this command exit 3 after the snapshot has been written; it is never swallowed.
if (process.env.PLATFORM_URL && process.env.RELEASE_TRACKER_INGEST_TOKEN) {
  const { pushToPlatform } = await import('./release-tracker-push.mjs');
  const r = await pushToPlatform(JSON.parse(json));
  if (r.ok === false) process.exitCode = 3;
}
