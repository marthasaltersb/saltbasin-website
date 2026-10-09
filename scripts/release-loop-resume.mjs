#!/usr/bin/env node
// Carries the release loop across sessions with no re-instruction.
//
//   node scripts/release-loop-resume.mjs --export <tracker snapshot.json>
//       Writes docs/release-log/active-release.state.json from a release-tracker-sync snapshot:
//       each feature's status, last round and score, and every bug with its lifecycle.
//
//   node scripts/release-loop-resume.mjs --args [--port-base 5000] [--scripts <dir>]
//       Prints the Workflow args (one run per dependency group) that continue every unfinished
//       feature: merged features restart at their next test round with their open bugs as fix
//       notes; unbuilt features are built. Pass each printed object to the saved 'release-loop'
//       workflow. Scope-checked backlog (pre-existing / other feature / process note) never blocks the
//       feature it was reported against; a bug reassigned to a feature is carried by that feature.
//       Fictional data only — this state is committed to a public repo.
//       --scripts <dir> also writes one self-contained workflow script per run (the saved workflow with
//       its args built in), launched with Workflow({ scriptPath }) — this avoids pasting large args and
//       survives restarts, since a resumed run does not keep its original args.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DEFS = path.join(root, 'docs/release-log/active-release.features.json');
const STATE = path.join(root, 'docs/release-log/active-release.state.json');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const clip = (s, n) => (typeof s === 'string' && s.length > n ? `${s.slice(0, n - 1)}…` : s ?? null);
const DONE = new Set(['verified']);
// Bugs the scope check placed elsewhere (pre-existing, another feature's, process notes): kept and
// exported, but they never block or re-open the feature they were first reported against.
const BACKLOG = new Set(['backlog_pre_existing', 'reassigned', 'process_note']);
const FINISHED = new Set(['passed', 'passed_with_backlog']);

if (argv.includes('--export')) {
  const snap = JSON.parse(fs.readFileSync(opt('--export'), 'utf8'));
  const state = {
    exportedAt: new Date().toISOString(),
    features: Object.fromEntries((snap.features || []).filter((f) => f.key !== 'whole-app-sweep').map((f) => [f.key, {
      status: f.status,
      lastRound: f.lastResult?.round ?? 0,
      lastScore: f.lastResult ? `${f.lastResult.stepsPassed}/${f.lastResult.stepsTotal}` : null,
      lastReport: f.lastResult?.report ? path.relative(root, f.lastResult.report) : null,
      openBugs: f.openBugs ?? null,
      backlog: f.backlog ?? 0,
    }])),
    bugs: (snap.bugs || []).filter((b) => b.status !== 'seen_in_test').map((b) => ({
      id: b.id, feature: b.feature, status: b.status, class: b.class || null, attempts: b.attempts || 0,
      step: clip(b.step, 200), rootCause: clip(b.rootCause, 400), files: b.files || [],
      scope: b.scope ? { scope: b.scope.scope, owner: b.scope.owner || null, evidence: clip(b.scope.evidence, 300) } : null,
      history: (b.history || []).map((h) => ({ round: h.round, event: h.event, note: clip(h.note, 200), commit: h.commit || null })),
    })),
  };
  fs.writeFileSync(STATE, `${JSON.stringify(state, null, 2)}\n`);
  const open = state.bugs.filter((b) => !DONE.has(b.status) && !BACKLOG.has(b.status)).length;
  const backlog = state.bugs.filter((b) => BACKLOG.has(b.status)).length;
  console.log(`Wrote ${path.relative(root, STATE)}: ${Object.keys(state.features).length} features, ${state.bugs.length} bugs (${open} blocking and not yet verified, ${backlog} backlog).`);
  process.exit(0);
}

if (argv.includes('--args')) {
  const defs = JSON.parse(fs.readFileSync(DEFS, 'utf8'));
  const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { features: {}, bugs: [] };
  const portBase = Number(opt('--port-base') || 5000);
  const merged = (f) => fs.existsSync(path.join(root, f.trainingSpec)) && fs.existsSync(path.join(root, f.changeSpec));
  // A feature is unfinished while it has blocking bugs; bugs reassigned to it by the scope check count as its own.
  const owned = (key) => state.bugs.filter((b) => !DONE.has(b.status)
    && ((b.feature === key && !BACKLOG.has(b.status)) || (b.status === 'reassigned' && b.scope?.owner === key)));
  const unfinished = defs.features.filter((f) => !FINISHED.has(state.features[f.key]?.status) || owned(f.key).length);
  const groups = [];
  for (const f of unfinished) {
    const g = groups.find((x) => f.dependsOn.some((d) => x.some((y) => y.key === d)));
    if (g) g.push(f); else groups.push([f]);
  }
  const runs = groups.map((group, gi) => ({
    release: `${defs.release}-resume`,
    repo: root,
    integrationBranch: defs.integrationBranch,
    env: '/var/tmp/sbpg/env.sh',
    chromium: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    maxFixRounds: 4,
    maxFixAttemptsPerBug: 2,
    portBase: portBase + gi * 100,
    sweep: false,
    scopeCheck: true,
    features: group.map((f) => {
      const st = state.features[f.key];
      const bugs = owned(f.key);
      const base = { key: f.key, title: f.title, trainingSpec: f.trainingSpec, changeSpec: f.changeSpec, dependsOn: f.dependsOn.filter((d) => group.some((y) => y.key === d)) };
      if (!merged(f)) return { ...base, build: f.build };
      return {
        ...base,
        build: null,
        startRound: (st?.lastRound || 0) + 1,
        scopeFromRound: (st?.lastRound || 0) + 1,
        fixNotes: `Continuing from an earlier session (state: docs/release-log/active-release.state.json, last round ${st?.lastRound || 0}: ${st?.lastScore || 'not tested'}). `
          + `Re-test the whole spec and every open bug below; a bug whose step now passes is verified, otherwise report it so triage links it by id (recurrenceOf). `
          + `Open bugs: ${JSON.stringify(bugs.map((b) => ({ id: b.id, status: b.status, step: b.step, cause: b.rootCause, files: b.files })))}`,
      };
    }),
  }));
  const dir = opt('--scripts');
  if (dir) {
    const src = fs.readFileSync(path.join(root, '.claude/workflows/release-loop.js'), 'utf8');
    if (!src.includes('const A = args || {}')) throw new Error('release-loop.js no longer reads args as `const A = args || {}`');
    fs.mkdirSync(dir, { recursive: true });
    for (const run of runs) {
      const file = path.join(dir, `rl-${run.portBase}-${run.features.map((f) => f.key).join('-').slice(0, 60)}.js`);
      fs.writeFileSync(file, src.replace('const A = args || {}', `const A = ${JSON.stringify(run)}`));
      console.log(file);
    }
    process.exit(0);
  }
  console.log(JSON.stringify(runs, null, 2));
  process.exit(0);
}

console.error('Usage: --export <snapshot.json> | --args [--port-base N]');
process.exit(2);
