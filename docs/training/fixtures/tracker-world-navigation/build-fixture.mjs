#!/usr/bin/env node
// Builds the FICTIONAL release used by docs/training/tracker-world-navigation.md ("demo harbor", release 0.9.0).
//   node docs/training/fixtures/tracker-world-navigation/build-fixture.mjs
// Writes, next to this script:
//   push.json      { snapshot, history, updates }  -> the platform's Settings > "Paste a snapshot" (or release-tracker-push.mjs)
//   artifact.json  one object (snapshot fields + history points/updates)  -> tools/release-tracker/serve.mjs / preview.html
// Every name, commit, date and number is invented; nothing here is real project data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const RELEASE = { version: '0.9.0', release: '2030-03-01-demo-harbor', title: 'Demo harbor release' };
const C = (n) => String(n).repeat(40).slice(0, 40);
const iso = (d, h, m = 0) => `2030-03-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;

// history row: [status, round, passed, total, open, verified, backlog, person]
const T = [iso(1, 8), iso(1, 14), iso(2, 9), iso(3, 10), iso(4, 10)];
const rows = [
  { 'harbor-chart': ['build', null, 0, null, 0, 0, 0, 0], 'tide-table': ['queued', null, 0, null, 0, 0, 0, 0], 'buoy-sync': ['queued', null, 0, null, 0, 0, 0, 0], 'net-mender': ['failing', 3, 17, 20, 0, 0, 2, 0] },
  { 'harbor-chart': ['failing', 1, 10, 14, 1, 0, 0, 0], 'tide-table': ['failing', 1, 12, 16, 2, 0, 0, 0], 'buoy-sync': ['queued', null, 0, null, 0, 0, 0, 0], 'net-mender': ['failing', 3, 17, 20, 0, 0, 2, 0] },
  { 'harbor-chart': ['passed', 2, 14, 14, 0, 1, 0, 0], 'tide-table': ['failing', 1, 12, 16, 2, 0, 0, 0], 'buoy-sync': ['queued', null, 0, null, 0, 0, 0, 0], 'net-mender': ['failing', 3, 18, 20, 0, 0, 2, 0] },
  { 'harbor-chart': ['passed', 2, 14, 14, 0, 1, 0, 0], 'tide-table': ['failing', 1, 12, 16, 2, 0, 0, 0], 'buoy-sync': ['queued', null, 0, null, 0, 0, 0, 0], 'net-mender': ['failing', 3, 18, 20, 0, 0, 2, 0], 'pier-booking': ['failing', 1, 6, 9, 1, 0, 0, 1], 'lighthouse-log': ['queued', null, 0, null, 0, 0, 0, 0] },
  { 'harbor-chart': ['passed', 2, 14, 14, 0, 1, 0, 0], 'tide-table': ['awaiting_retest', 1, 12, 16, 2, 0, 0, 0], 'buoy-sync': ['queued', null, 0, null, 0, 0, 0, 0], 'net-mender': ['failing', 3, 18, 20, 0, 0, 2, 0], 'pier-booking': ['failing', 1, 6, 9, 1, 0, 0, 1], 'lighthouse-log': ['queued', null, 0, null, 0, 0, 0, 0] },
];
const points = T.map((t, i) => ({ t, c: C(i + 1).slice(0, 7), f: rows[i] }));
const updDefs = [
  [0, 'Harbor build started', 'harbor-chart was built and queued for testing.'],
  [1, 'First test round', 'harbor-chart and tide-table had their first browser round; both found bugs.'],
  [2, 'harbor-chart passes', 'harbor-chart passed its second round; its bug is verified fixed.'],
  [3, 'pier-booking added', 'pier-booking joined the release after the cut; lighthouse-log was added to the backlog.'],
];
const PASSED = ['passed', 'passed_with_backlog'];
const updates = updDefs.map(([i, headline, note], n) => {
  const f = rows[i]; const feats = {};
  Object.entries(f).forEach(([k, v]) => { feats[k] = { status: v[0], round: v[1], score: v[3] ? `${v[2]}/${v[3]}` : null }; });
  const sum = (idx) => Object.values(f).reduce((a, v) => a + v[idx], 0);
  const passed = Object.values(f).filter((v) => PASSED.includes(v[0])).length;
  const prev = n ? updDefs[n - 1] : null;
  return {
    version: `${RELEASE.version}-u${n + 1}`, release: RELEASE.release, at: T[i].replace('.000Z', 'Z'), commit: C(i + 1), previous: n ? `${RELEASE.version}-u${n}` : null,
    headline, note,
    metrics: { featuresTotal: Object.keys(f).length, featuresPassed: passed, openBugs: sum(4), verified: sum(5), backlog: sum(6), needPerson: sum(7), agentsRunning: n === 3 ? 2 : 1, features: feats },
    comparison: { lines: prev ? [`Features passed **${passed} of ${Object.keys(f).length}**.`] : ['First update: nothing to compare with yet.'], featureChanges: [] },
  };
});

const hist = (k, e, round, note, commit = null, files) => ({ round, event: e, note, commit, ...(files ? { files } : {}) });
const bug = (o) => ({ class: 'defect', attempts: 0, files: [], scope: { scope: 'this_feature', owner: null, evidence: 'Written in this feature', decidedBy: `scope:${o.feature}:r1`, round: 1 }, ...o });
const bugs = [
  bug({ id: 'tide-table-F1-1', feature: 'tide-table', status: 'open', step: '[J2.3] Total row shows 12', rootCause: 'The total ignores rows added after the first refresh.', files: ['src/demo/tide.js'], history: [hist('', 'found', 1, 'Total row shows 11 instead of 12')] }),
  bug({ id: 'tide-table-F1-2', feature: 'tide-table', status: 'fixed_awaiting_retest', attempts: 1, step: '[J2.5] Low-tide badge colour', rootCause: 'The badge reads the high-tide colour token.', files: ['src/demo/badge.js'], history: [hist('', 'found', 1, 'Badge stays grey'), hist('', 'fixed', 1, 'Read the low-tide token', C(7).slice(0, 7), ['src/demo/badge.js'])] }),
  bug({ id: 'harbor-chart-F1-1', feature: 'harbor-chart', status: 'verified', attempts: 1, step: '[J1.4] Depth axis label', rootCause: 'The axis label used metres for a feet chart.', files: ['src/demo/chart.js'], history: [hist('', 'found', 1, 'Depth axis says metres'), hist('', 'fixed', 1, 'Switch the unit label to feet', C(5).slice(0, 7), ['src/demo/chart.js']), hist('', 'verified', 2, 'Step passed in round 2')] }),
  bug({ id: 'pier-booking-F1-1', feature: 'pier-booking', status: 'needs_human', attempts: 2, class: 'needs_business_definition', step: '[J1.2] Booking cut-off time', rootCause: 'The cut-off time for same-day bookings is not defined.', question: 'What is the latest time of day a same-day pier booking can be made?', history: [hist('', 'found', 1, 'Cut-off not defined'), hist('', 'not_fixed', 1, 'Guessed 17:00; the owner has not confirmed')] }),
  bug({ id: 'net-mender-F2-1', feature: 'net-mender', status: 'reassigned', step: '[J2.2] Chart legend overlaps', rootCause: 'The legend belongs to the harbor chart component.', scope: { scope: 'other_feature', owner: 'harbor-chart', evidence: 'The legend is drawn by harbor-chart', decidedBy: 'scope:net-mender:r3', round: 3 }, history: [hist('', 'found', 3, 'Legend overlaps the net list')] }),
  bug({ id: 'net-mender-F3-1', feature: 'net-mender', status: 'backlog_pre_existing', step: '[J3.1] Mend count rounds down', rootCause: 'The mend count already rounded down before this release.', scope: { scope: 'pre_existing', owner: null, evidence: 'Reproduced on the previous release', decidedBy: 'scope:net-mender:r3', round: 3 }, history: [hist('', 'found', 3, 'Mend count rounds down')] }),
];

const tok = (o) => ({ input: 1200, cacheWrite: 30000, cacheRead: 900000, output: 8000, ...o });
const ag = (id, role, feature, round, status, o = {}) => ({ id, label: `${role}:${feature}${round ? `:r${round}` : ''}`, role, feature, round, status, startedAt: iso(1, 9), lastActivityAt: iso(4, 9, 50), activity: 'Write docs/changes/demo.md', summary: null, tokens: tok({}), failures: [], signals: [], ...o });
const agents = [
  ag('a1', 'validate', 'tide-table', 2, 'running', { startedAt: iso(4, 9, 30), activity: '$ node walk-journeys --journey 2', liveSteps: { checked: 14, passed: 12, failedTotal: 1, failed: [{ step: '[J2.3]', expect: 'Total shows 12', seen: 'Total shows 11' }], errors: [] }, tokens: tok({ output: 9100 }) }),
  ag('a2', 'fix', 'pier-booking', 1, 'running', { startedAt: iso(4, 9, 40), activity: 'Edit src/demo/pier.js', tokens: tok({ output: 4200 }) }),
  ag('a3', 'build', 'harbor-chart', null, 'done', { startedAt: iso(1, 7), lastActivityAt: iso(1, 8), summary: 'Built the harbor chart', tokens: tok({ output: 5000 }) }),
  ag('a4', 'validate', 'harbor-chart', 1, 'done', { startedAt: iso(1, 12), lastActivityAt: iso(1, 14), summary: '10/14 steps passed', tokens: tok({ output: 6100 }) }),
  ag('a5', 'fix', 'harbor-chart', 1, 'done', { startedAt: iso(1, 15), lastActivityAt: iso(1, 17), summary: 'Fixed the axis label', tokens: tok({ output: 3300 }) }),
  ag('a6', 'validate', 'harbor-chart', 2, 'done', { startedAt: iso(2, 8), lastActivityAt: iso(2, 9), summary: '14/14 steps passed', tokens: tok({ output: 5200 }) }),
  ag('a7', 'validate', 'tide-table', 1, 'done', { startedAt: iso(1, 12), lastActivityAt: iso(1, 14), summary: '12/16 steps passed', tokens: tok({ output: 6400 }) }),
  ag('a8', 'triage', 'tide-table', 1, 'done', { startedAt: iso(1, 14, 30), lastActivityAt: iso(1, 15), summary: 'Two defects triaged', tokens: tok({ output: 2100 }) }),
  ag('a9', 'fix', 'tide-table', 1, 'done', { startedAt: iso(3, 11), lastActivityAt: iso(3, 13), summary: 'Fixed the badge colour; the total is still open', tokens: tok({ output: 3900 }) }),
  ag('a10', 'validate', 'pier-booking', 1, 'done', { startedAt: iso(3, 9), lastActivityAt: iso(3, 10), summary: '6/9 steps passed', tokens: tok({ output: 4700 }) }),
];

const lr = (round, passed, total, key) => ({ round, passed: passed === total, stepsPassed: passed, stepsTotal: total, baseline: 1, report: `docs/test-results/${key}/round-${round}.md` });
const feature = (key, status, rounds, last, extra = {}) => ({ key, status, rounds, lastResult: last, openBugs: 0, backlog: 0, agents: agents.filter((a) => a.feature === key).length, ...extra });
const features = [
  feature('harbor-chart', 'passed', 2, lr(2, 14, 14, 'harbor-chart'), { scope: 'planned' }),
  feature('tide-table', 'awaiting_retest', 1, lr(1, 12, 16, 'tide-table'), { scope: 'planned', openBugs: 2, dependsOn: ['harbor-chart'] }),
  feature('buoy-sync', 'queued', 0, null, { scope: 'planned', dependsOn: ['tide-table'] }),
  feature('pier-booking', 'failing', 1, lr(1, 6, 9, 'pier-booking'), { scope: 'planned', openBugs: 1, added: { at: '2030-03-03T10:00:00Z', commit: 'b7c8d9e', decidedBy: 'owner', reason: 'The owner asked for pier booking after the cut.' } }),
  feature('lighthouse-log', 'queued', 0, null, { scope: 'backlog', added: { at: '2030-03-03T10:00:00Z', commit: 'c8d9e0f', decidedBy: 'owner', reason: 'Parked in the backlog until the harbor chart is stable.' } }),
  feature('net-mender', 'failing', 3, lr(3, 18, 20, 'net-mender'), { scope: 'backlog', backlog: 2 }),
];

const snapshot = {
  release: RELEASE, updates, runId: 'demo-run', syncedAt: T[4], maxFixAttemptsPerBug: 2, maxFixRounds: 4,
  repoUrl: 'https://example.test/demo-org/demo-harbor', features, agents, bugs,
  totals: { output: agents.reduce((n, a) => n + a.tokens.output, 0), cacheRead: agents.reduce((n, a) => n + a.tokens.cacheRead, 0) },
};
const history = { generatedAt: T[4], points, updates: updates.map((u) => ({ version: u.version, at: u.at, headline: u.headline, commit: u.commit })) };

fs.writeFileSync(path.join(dir, 'push.json'), `${JSON.stringify({ snapshot, history, updates }, null, 1)}\n`);
fs.writeFileSync(path.join(dir, 'artifact.json'), `${JSON.stringify({ ...snapshot, points: history.points, generatedAt: history.generatedAt, updates: updates.map((u) => ({ ...u })) })}\n`);
console.log('wrote push.json and artifact.json');
