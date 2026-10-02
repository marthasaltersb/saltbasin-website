#!/usr/bin/env node
// Builds the release tracker snapshot from a release-loop workflow run.
//
//   node scripts/release-tracker-sync.mjs --run <workflow transcript dir> [--extra <agent transcript>=<label>] --out snapshot.json
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

const journal = runDirs.flatMap((d) => readJsonl(path.join(d, 'journal.jsonl')).map((e) => ({ ...e, runDir: d })));
const agents = new Map();
for (const e of journal) {
  if (!e.agentId) continue;
  const a = agents.get(e.agentId) || { id: e.agentId, label: e.label, phase: e.phase, status: 'running', result: null, file: path.join(e.runDir, `agent-${e.agentId}.jsonl`), fromRun: true };
  if (e.label) a.label = e.label;
  if (e.phase) a.phase = e.phase;
  if (e.type === 'started') a.status = 'running';
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

const agentList = [];
for (const a of agents.values()) {
  const file = a.file;
  const act = file && fs.existsSync(file) ? agentActivity(file) : { activity: null, usage: null };
  if (!a.fromRun && act.lastAt && Date.now() - Date.parse(act.lastAt) > 15 * 60 * 1000 && a.status === 'running') a.status = 'idle_or_done';
  const [role, feature, round] = String(a.label || '').split(':');
  const r = a.result && typeof a.result === 'object' ? a.result : null;
  let summary = null;
  if (r) {
    if (role === 'build') summary = `Initial check ${r.initialCheckPassed ? 'passed' : 'did not pass'} · branch ${r.branch}`;
    else if (role === 'integrate') summary = r.merged ? `Merged → ${String(r.head).slice(0, 7)}${r.conflicts?.length ? ` · ${r.conflicts.length} conflicts resolved` : ''}${r.buildPassed ? '' : ' · BUILD FAILED'}` : 'Merge failed';
    else if (role === 'validate') summary = `${r.stepsPassed}/${r.stepsTotal} steps passed${r.passed ? ' · PASS' : ' · FAIL'}`;
    else if (role === 'triage') summary = `${r.items?.length ?? 0} triage items`;
    else if (role === 'fix') summary = `${r.fixed?.length ?? 0} fixed · ${r.notFixed?.length ?? 0} not fixed`;
  } else if (typeof a.result === 'string') summary = clip(a.result, 200);
  let liveSteps = null;
  if (role === 'validate' && feature && round) {
    const rows = readJsonl(path.join('/var/tmp/sbpg/release-loop', feature, `round-${round.replace('r', '')}`, 'steps.jsonl'));
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
  agentList.push({ liveSteps, signals: act.signals || [],
    id: a.id, label: a.label, role, feature, round: round ? Number(round.replace('r', '')) : null,
    phase: a.phase, status: a.status, activity: act.activity, summary, tokens: act.usage,
    startedAt: act.firstAt || null, lastActivityAt: act.lastAt || null,
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
for (const [key, list] of Object.entries(byFeature)) {
  const res = (role, round) => agents.get(list.find((a) => a.role === role && (round == null || a.round === round))?.id)?.result;
  const validations = list.filter((a) => a.role === 'validate').sort((x, y) => x.round - y.round);
  const fb = new Map(); const attempts = {};
  for (const v of validations) {
    const vr = agents.get(v.id)?.result;
    if (!vr) continue;
    // A validation after a fix round decides the fixed bugs' fate.
    for (const b of fb.values()) if (b.status === 'fixed_awaiting_retest') b.status = vr.passed ? 'verified' : 'retest_failed';
    if (vr.passed) continue;
    const tr = res('triage', v.round);
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
        b.status = 'fixed_awaiting_retest'; b.history.push({ round: v.round, event: 'fixed', note: clip(f.what, 200), files: f.files });
      }
      for (const f of fr.notFixed || []) {
        const b = fb.get(f.id); if (!b) continue;
        b.history.push({ round: v.round, event: 'not_fixed', note: clip(f.why, 200) });
      }
    } else if (list.some((a) => a.role === 'fix' && a.round === v.round && a.status === 'running')) {
      for (const b of fb.values()) if (['open', 'recurred'].includes(b.status)) b.status = 'fixing';
    }
  }
  // Reconciliation of reported failures: unresolved items are bugs; unreconciled ones are flagged.
  for (const rc of list.filter((a) => a.role === 'reconcile')) {
    const rr = agents.get(rc.id)?.result;
    for (const [i, it] of (rr?.items || []).entries()) {
      if (it.status === 'resolved') continue;
      const id = `${key}-${rc.label.includes('fix') ? 'F' : 'B'}${i + 1}`;
      if (!fb.has(id)) fb.set(id, { id, feature: key, status: 'open', class: it.kind, step: clip(it.step || it.reported, 200), rootCause: clip(it.rootCause || it.evidence, 400), files: it.files || [], history: [{ round: 0, event: 'found', note: `Reported by the agent, unresolved on reconciliation (${it.kind})` }] });
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
  bugs.push(...fb.values());
  const last = validations[validations.length - 1];
  const lastRes = last ? agents.get(last.id)?.result : null;
  const running = list.filter((a) => a.status === 'running');
  let status = 'queued';
  if (running.length) status = running.map((a) => a.role).join(', ');
  else if (lastRes?.passed) status = 'passed';
  else if ([...fb.values()].some((b) => b.status === 'needs_human')) status = 'needs_human';
  else if (lastRes) status = 'failing';
  else if (list.length) status = 'between_stages';
  features.push({
    key, status, rounds: validations.length,
    lastResult: lastRes ? { round: last.round, passed: lastRes.passed, stepsPassed: lastRes.stepsPassed, stepsTotal: lastRes.stepsTotal, report: lastRes.reportPath } : null,
    openBugs: [...fb.values()].filter((b) => !['verified'].includes(b.status)).length,
    agents: list.length,
  });
}

const snapshot = {
  runId: runDirs.map((d) => path.basename(d)).join(' + ') || null,
  syncedAt: new Date().toISOString(),
  maxFixAttemptsPerBug: MAX_ATTEMPTS,
  maxFixRounds: definition.maxFixRounds,
  features, agents: agentList.sort((x, y) => String(y.startedAt || '').localeCompare(String(x.startedAt || ''))), bugs,
  totals: agentList.reduce((t, a) => {
    for (const k of ['input', 'cacheWrite', 'cacheRead', 'output']) t[k] += a.tokens?.[k] || 0;
    return t;
  }, { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }),
};
const json = JSON.stringify(snapshot);
if (out) fs.writeFileSync(out, json); else process.stdout.write(json);
