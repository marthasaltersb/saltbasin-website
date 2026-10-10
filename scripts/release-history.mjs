#!/usr/bin/env node
// Release history for the tracker's trend charts and time slider.
//
//   node scripts/release-history.mjs [--current <tracker snapshot.json>] [--out docs/release-log/history.json]
//
// Every tracker sync commits docs/release-log/active-release.state.json, so git already holds the release's
// full history. This walks those commits (oldest first), reduces each to per-feature counts, drops points
// identical to the one before, and appends the live snapshot. Nothing is overwritten: any earlier moment
// can be replayed on the tracker's slider. Each point: { t, c, f: { key: [status, round, stepsPassed,
// stepsTotal, open, verified, backlog, needsPerson] } }. Update markers come from updates.json.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const STATE = 'docs/release-log/active-release.state.json';
const out = opt('--out') || path.join(root, 'docs/release-log/history.json');
const BACKLOG = new Set(['backlog_pre_existing', 'reassigned', 'process_note']);
const PERSON = new Set(['needs_human', 'needs_business_definition']);
const git = (...a) => execFileSync('git', a, { cwd: root, maxBuffer: 64 << 20 }).toString();

function point(t, c, features, bugs) {
  const f = {};
  for (const [key, x] of features) {
    if (key === 'whole-app-sweep') continue;
    const [p, n] = String(x.score || '').split('/').map(Number);
    f[key] = [x.status || null, x.round || null, Number.isFinite(p) ? p : null, Number.isFinite(n) ? n : null, 0, 0, 0, 0];
  }
  for (const b of bugs || []) {
    const row = f[b.feature]; if (!row || b.status === 'seen_in_test') continue;
    if (b.status === 'verified') row[5]++;
    else if (BACKLOG.has(b.status)) row[6]++;
    else { row[4]++; if (PERSON.has(b.status)) row[7]++; }
  }
  return { t, c, f };
}

const points = [];
// A release's history starts at its cut (startedAtCommit in active-release.features.json, or --since); the
// earlier release's history is frozen in docs/release-log/releases/<version>/history.json.
let since = opt('--since');
if (!since) { try { since = JSON.parse(fs.readFileSync(path.join(root, 'docs/release-log/active-release.features.json'), 'utf8')).startedAtCommit || null; } catch { /* whole history */ } }
const log = git('log', '--reverse', '--format=%H %cI', ...(since ? [`${since}..HEAD`] : []), '--', STATE).trim().split('\n').filter(Boolean);
for (const line of log) {
  const [sha, at] = line.split(' ');
  let s; try { s = JSON.parse(git('show', `${sha}:${STATE}`)); } catch { continue; }
  const feats = Object.entries(s.features || {}).map(([k, v]) => [k, { status: v.status, round: v.lastRound, score: v.lastScore }]);
  points.push(point(s.exportedAt || at, sha.slice(0, 7), feats, s.bugs));
}
const cur = opt('--current');
if (cur && fs.existsSync(cur)) {
  const s = JSON.parse(fs.readFileSync(cur, 'utf8'));
  const feats = (s.features || []).map((x) => [x.key, { status: x.status, round: x.lastResult?.round, score: x.lastResult ? `${x.lastResult.stepsPassed}/${x.lastResult.stepsTotal}` : null }]);
  points.push(point(s.syncedAt, git('rev-parse', '--short=7', 'HEAD').trim(), feats, s.bugs));
}
// Keep a point only when something a chart shows changed.
const kept = points.filter((p, i) => i === 0 || JSON.stringify(p.f) !== JSON.stringify(points[i - 1].f) || i === points.length - 1);
let updates = [];
try { updates = JSON.parse(fs.readFileSync(path.join(root, 'docs/release-log/updates.json'), 'utf8')).map((u) => ({ version: u.version, at: u.at, headline: u.headline || null, commit: u.commit })); } catch { /* none yet */ }
const history = { generatedAt: new Date().toISOString(), points: kept, updates };
fs.writeFileSync(out, `${JSON.stringify(history)}\n`);
console.log(`History: ${kept.length} points (${points.length} syncs), ${updates.length} updates, ${Buffer.byteLength(JSON.stringify(history))} bytes.`);
