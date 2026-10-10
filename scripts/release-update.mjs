#!/usr/bin/env node
// Numbered status updates for the active release, each compared with the one before.
//
//   node scripts/release-update.mjs --snapshot <tracker snapshot.json | active-release.state.json>
//        --note "what changed, in plain words" [--at <ISO time>] [--commit <sha>] [--headline "..."]
//
// Appends one entry to docs/release-log/updates.json and rewrites docs/release-log/updates.md (newest
// first, ready to send to someone outside the project). Each entry is versioned
// <release version>-u<n> (release version from active-release.features.json `version`), pinned to the
// commit it describes, and carries an automatic comparison with the previous update: features passed,
// open / verified / backlog bugs, and per-feature status and score changes. The tracker sync embeds the
// entries so the tracker page shows them too. Counts and labels only — fictional data, public repo.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const DEFS = JSON.parse(fs.readFileSync(path.join(root, 'docs/release-log/active-release.features.json'), 'utf8'));
const LOG = path.join(root, 'docs/release-log/updates.json');
const MD = path.join(root, 'docs/release-log/updates.md');
const BACKLOG = new Set(['backlog_pre_existing', 'reassigned', 'process_note']);
const PASSED = new Set(['passed', 'passed_with_backlog']);
const NEEDS_PERSON = new Set(['needs_human', 'needs_business_definition']);
const LABEL = {
  passed: 'passed', passed_with_backlog: 'passed (backlog elsewhere)', failing: 'failing', awaiting_retest: 'fixed, awaiting re-test',
  needs_human: 'needs a person', failed: 'agent stopped', queued: 'queued', between_stages: 'between stages', not_started: 'not started',
  build: 'being built', integrate: 'merging', validate: 'in browser testing', triage: 'failures being triaged', scope: 'scope check',
  fix: 'being fixed', reconcile: 'reviewing failed commands', record: 'writing release log',
};

// Works on a tracker snapshot (features[].lastResult) or the exported state file (features as an object).
export function metrics(src) {
  const feats = Array.isArray(src.features)
    ? src.features.filter((f) => f.key !== 'whole-app-sweep').map((f) => ({ key: f.key, status: f.status, round: f.lastResult?.round ?? null, score: f.lastResult ? `${f.lastResult.stepsPassed}/${f.lastResult.stepsTotal}` : null }))
    : Object.entries(src.features || {}).map(([key, f]) => ({ key, status: f.status, round: f.lastRound || null, score: f.lastScore || null }));
  const bugs = (src.bugs || []).filter((b) => b.status !== 'seen_in_test');
  const agents = Array.isArray(src.agents) ? src.agents.filter((a) => a.status === 'running').length : null;
  return {
    featuresTotal: feats.length,
    featuresPassed: feats.filter((f) => PASSED.has(f.status)).length,
    openBugs: bugs.filter((b) => b.status !== 'verified' && !BACKLOG.has(b.status)).length,
    verified: bugs.filter((b) => b.status === 'verified').length,
    backlog: bugs.filter((b) => BACKLOG.has(b.status)).length,
    needPerson: bugs.filter((b) => NEEDS_PERSON.has(b.status)).length,
    agentsRunning: agents,
    features: Object.fromEntries(feats.map((f) => [f.key, { status: f.status, round: f.round, score: f.score }])),
  };
}

const status = (s) => (s ? String(s).split(', ').map((x) => LABEL[x] || x.replace(/_/g, ' ')).join(' + ') : '—');
// Neutral deltas: more open bugs often means testing found more, which is progress, not a regression.
const arrow = (a, b) => {
  if (a == null || b == null) return `${b ?? '—'}`;
  const d = b - a;
  return d ? `${a} → **${b}** (${d > 0 ? '+' : ''}${d})` : `${b} (no change)`;
};

export function compare(prev, cur) {
  if (!prev) return { lines: ['First update in this series: the baseline later updates are compared with.'], featureChanges: [] };
  const p = prev.metrics; const c = cur;
  const lines = [
    `Features passed: ${arrow(p.featuresPassed, c.featuresPassed)} of ${c.featuresTotal}`,
    `Open bugs caused by this work: ${arrow(p.openBugs, c.openBugs)}${c.openBugs > p.openBugs ? ' — new failures found in testing' : ''}`,
    `Bugs verified fixed: ${arrow(p.verified, c.verified)}`,
    `Backlog (not this work): ${arrow(p.backlog, c.backlog)}`,
    `Waiting on a person: ${arrow(p.needPerson, c.needPerson)}`,
  ];
  if (c.agentsRunning != null) lines.push(`Agents running: ${p.agentsRunning ?? '—'} → ${c.agentsRunning}`);
  const featureChanges = [];
  for (const [key, f] of Object.entries(c.features)) {
    const o = p.features?.[key];
    if (!o) { featureChanges.push(`${key}: new in this update (${status(f.status)})`); continue; }
    const parts = [];
    if (o.score !== f.score || o.round !== f.round) parts.push(`test ${o.round ? `round ${o.round} ${o.score}` : 'not run'} → ${f.round ? `round ${f.round} **${f.score}**` : 'not run'}`);
    if (o.status !== f.status) parts.push(`${status(o.status)} → **${status(f.status)}**`);
    if (parts.length) featureChanges.push(`${key}: ${parts.join('; ')}`);
  }
  return { lines, featureChanges };
}

function render(entries) {
  const L = [`# ${DEFS.title || 'Release'} — status updates`, '',
    `Release **${DEFS.version}** (\`${DEFS.release}\`), built on branch \`${DEFS.integrationBranch}\`. Each update is numbered \`${DEFS.version}-u<n>\`, pinned to the commit it describes, and compared with the update before it. Newest first.`, ''];
  for (const e of [...entries].reverse()) {
    const m = e.metrics;
    L.push(`## ${e.version} — ${e.at.replace('T', ' ').slice(0, 16)} UTC`, '',
      `Commit [\`${e.commit.slice(0, 7)}\`](${DEFS.repoUrl || 'https://github.com/marthasaltersb/saltbasin-website'}/commit/${e.commit})${e.previous ? ` · compared with ${e.previous}` : ''}`, '');
    if (e.headline) L.push(`**${e.headline}**`, '');
    L.push(e.note, '', '**Compared with the previous update**', '', ...e.comparison.lines.map((x) => `- ${x}`), '');
    if (e.comparison.featureChanges.length) L.push('**Feature changes**', '', ...e.comparison.featureChanges.map((x) => `- ${x}`), '');
    L.push('<details><summary>Every feature at this update</summary>', '', '| Feature | Status | Latest test |', '|---|---|---|',
      ...Object.entries(m.features).map(([k, f]) => `| ${k} | ${status(f.status)} | ${f.round ? `round ${f.round}: ${f.score}` : 'not tested yet'} |`), '', '</details>', '');
  }
  return `${L.join('\n')}\n`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (argv.includes('--render')) {   // rebuild comparisons and updates.md from the stored entries
    const entries = JSON.parse(fs.readFileSync(LOG, 'utf8'));
    entries.forEach((e, i) => { e.comparison = compare(entries[i - 1] || null, e.metrics); });
    fs.writeFileSync(LOG, `${JSON.stringify(entries, null, 2)}\n`); fs.writeFileSync(MD, render(entries));
    console.log(`Re-rendered ${entries.length} updates.`); process.exit(0);
  }
  const snapPath = opt('--snapshot'); const note = opt('--note');
  if (!snapPath || !note) { console.error('Usage: --snapshot <file> --note "text" [--at ISO] [--commit sha] [--headline text]'); process.exit(2); }
  const entries = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : [];
  const cur = metrics(JSON.parse(fs.readFileSync(snapPath, 'utf8')));
  const prev = entries[entries.length - 1] || null;
  const entry = {
    version: `${DEFS.version}-u${entries.length + 1}`,
    release: DEFS.release,
    at: opt('--at') || new Date().toISOString(),
    commit: opt('--commit') || execSync('git rev-parse HEAD', { cwd: root }).toString().trim(),
    previous: prev?.version || null,
    headline: opt('--headline') || null,
    note,
    metrics: cur,
    comparison: compare(prev, cur),
  };
  entries.push(entry);
  fs.writeFileSync(LOG, `${JSON.stringify(entries, null, 2)}\n`);
  fs.writeFileSync(MD, render(entries));
  console.log(`${entry.version} written (compared with ${entry.previous || 'nothing — baseline'}).`);
}
