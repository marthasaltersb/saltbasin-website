#!/usr/bin/env node
// Session estimates, tracked against the test results of each merge.
//
// Before a session starts work, record what it is trying to accomplish:
//   node scripts/session-plan.mjs estimate --session <id> --intent "<one line>" \
//        --item "feature=<key>;goal=<what changes>;expect=<passed>/<total>;size=S|M|L" [--item ...]
//   (an estimate is fixed once the first merge is recorded; a later change is a re-estimate with a reason:
//    --reestimate "<reason>", kept beside the original, never replacing it)
// After each merge to the integration branch:
//   node scripts/session-plan.mjs merge --session <id> [--commit <sha>] [--feature <key> ...]
//   [--if-new] records only when a feature has a new validated round (the tracker sync runs it each pass)
//   (reads each feature's latest docs/test-results/<feature>/round-N.md score block; no feature given =
//    every feature in the estimate)
// At the end:
//   node scripts/session-plan.mjs close --session <id> [--note "<text>"]
//   node scripts/session-plan.mjs report [--release <version>] [--json]
//
// Files: docs/release-log/session-plans/<session>.json (committed; the tracker shows them). A score is
// never estimated after the fact and never filled in by hand: "not validated" stays null, never 0.
import fs from 'node:fs';
import path from 'node:path';
import { scopeOf, isAddedAfterCut } from '../server/lib/releaseScope.js';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [cmd, ...argv] = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const opts = (k) => argv.flatMap((a, i) => (a === k ? [argv[i + 1]] : []));
const DIR = path.join(root, 'docs/release-log/session-plans');
const defs = JSON.parse(fs.readFileSync(path.join(root, 'docs/release-log/active-release.features.json'), 'utf8'));
const git = (...a) => execFileSync('git', a, { cwd: root }).toString().trim();
const fail = (m) => { console.error(m); process.exit(2); };
const file = (s) => path.join(DIR, `${s.replace(/[^A-Za-z0-9._-]/g, '_')}.json`);
const load = (s) => { try { return JSON.parse(fs.readFileSync(file(s), 'utf8')); } catch { return null; } };
const save = (p) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(file(p.session), `${JSON.stringify(p, null, 2)}\n`); };
const frac = (s) => { const m = String(s || '').match(/^(\d+)\s*\/\s*(\d+)$/); return m ? { passed: Number(m[1]), total: Number(m[2]) } : null; };

function parseItem(raw) {
  const o = Object.fromEntries(String(raw).split(';').map((kv) => kv.split('=')).filter((p) => p.length >= 2).map(([k, ...v]) => [k.trim(), v.join('=').trim()]));
  if (!o.feature) fail(`--item needs feature=<key>: ${raw}`);
  if (!defs.features.some((f) => f.key === o.feature) && o.feature !== 'production') fail(`unknown feature "${o.feature}" (not in active-release.features.json)`);
  const e = frac(o.expect);
  if (o.expect && !e) fail(`expect must look like 30/32: ${raw}`);
  if (o.size && !['S', 'M', 'L'].includes(o.size)) fail(`size must be S, M or L: ${raw}`);
  // Scope (server/lib/releaseScope.js): an item outside the release's planned work is recorded as such, not refused.
  const def = defs.features.find((f) => f.key === o.feature);
  const scope = def ? scopeOf(def) : null;
  if (def && scope !== 'planned') console.error(`Note: ${o.feature} is in the backlog of release ${defs.version}${isAddedAfterCut(def) ? ' (added after the cut)' : ''}, not its planned work; recorded as outOfScope.`);
  return { feature: o.feature, goal: o.goal || null, expect: e, size: o.size || null, ...(def && scope !== 'planned' ? { outOfScope: true } : {}) };
}

function latestScore(feature) {
  const d = path.join(root, 'docs/test-results', feature);
  let files = [];
  try { files = fs.readdirSync(d).map((f) => [f, Number((f.match(/^round-(\d+)\.md$/) || [])[1])]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]); } catch { /* none */ }
  if (!files.length) return { round: null, passed: null, total: null, baseline: null, report: null };
  const [f, round] = files[0];
  const txt = fs.readFileSync(path.join(d, f), 'utf8');
  const num = (k) => { const m = txt.match(new RegExp(`"${k}"\\s*:\\s*(\\d+)`)); return m ? Number(m[1]) : null; };
  return { round, passed: num('passed'), total: num('total'), baseline: num('baseline'), report: `docs/test-results/${feature}/${f}` };
}

if (cmd === 'estimate') {
  const s = opt('--session') || fail('--session is required');
  const prev = load(s);
  const items = opts('--item').map(parseItem);
  if (!items.length) fail('at least one --item is required');
  const estimate = { recordedAt: new Date().toISOString(), atCommit: git('rev-parse', '--short=7', 'HEAD'), intent: opt('--intent'), items };
  if (prev && prev.merges.length) {
    const reason = opt('--reestimate') || fail('this session already recorded a merge: pass --reestimate "<reason>" (the original estimate is kept)');
    prev.reEstimates = [...(prev.reEstimates || []), { ...estimate, reason }];
    save(prev); console.log(`Re-estimate recorded for ${s} (original kept).`);
  } else {
    save({ session: s, release: defs.version, intent: opt('--intent'), estimate, reEstimates: [], merges: [], closedAt: null });
    console.log(`Estimate recorded for ${s}: ${items.length} item(s) in release ${defs.version}.`);
  }
} else if (cmd === 'merge') {
  const s = opt('--session') || fail('--session is required');
  const p = load(s) || fail(`no estimate for ${s}: record one first (session-plan.mjs estimate)`);
  const feats = opts('--feature').length ? opts('--feature') : [...new Set(p.estimate.items.map((i) => i.feature))].filter((k) => k !== 'production');
  const commit = opt('--commit') || git('rev-parse', '--short=7', 'HEAD');
  const results = feats.map((feature) => ({ feature, ...latestScore(feature) }));
  // --if-new (used by the tracker sync on every pass): record only when a feature has a new validated round.
  const prev = p.merges[p.merges.length - 1];
  const key = (rs) => JSON.stringify(rs.map((r) => [r.feature, r.round, r.passed, r.total]));
  if (argv.includes('--if-new') && (prev ? key(prev.results) === key(results) : results.every((r) => r.round == null))) { console.log('No new validated round since the last recorded merge.'); process.exit(0); }
  if (argv.includes('--if-new') && !prev) {
    // First pass: only rounds validated after the estimate count, so an old round is never credited to this session.
    const fresh = results.filter((r) => r.report && fs.statSync(path.join(root, r.report)).mtimeMs > Date.parse(p.estimate.recordedAt));
    if (!fresh.length) { console.log('No round validated since the estimate.'); process.exit(0); }
  }
  p.merges.push({ at: new Date().toISOString(), commit, results });
  save(p); console.log(`Merge ${commit} recorded for ${s}: ${feats.length} feature result(s).`);
} else if (cmd === 'close') {
  const s = opt('--session') || fail('--session is required');
  const p = load(s) || fail(`no plan for ${s}`);
  p.closedAt = new Date().toISOString(); p.closeNote = opt('--note');
  save(p); console.log(`Closed ${s}.`);
} else if (cmd === 'report') {
  const rel = opt('--release') || defs.version;
  const plans = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))).filter((p) => p.release === rel) : [];
  const rows = plans.flatMap((p) => p.estimate.items.map((it) => {
    const last = [...p.merges].reverse().flatMap((m) => m.results).find((r) => r.feature === it.feature) || null;
    const hit = it.expect && last && last.passed != null ? last.passed >= it.expect.passed && last.total === it.expect.total : null;
    return { session: p.session, feature: it.feature, size: it.size, expected: it.expect ? `${it.expect.passed}/${it.expect.total}` : null,
      actual: last && last.passed != null ? `${last.passed}/${last.total}` : null, merges: p.merges.length, met: hit };
  }));
  if (argv.includes('--json')) console.log(JSON.stringify({ release: rel, sessions: plans, rows }, null, 2));
  else {
    console.log(`Release ${rel}: ${plans.length} session plan(s)`);
    for (const r of rows) console.log(`  ${r.session}  ${r.feature.padEnd(28)} size ${r.size || '-'}  expected ${r.expected || '-'}  actual ${r.actual || 'not validated'}  ${r.met === null ? '' : r.met ? 'MET' : 'MISSED'}`);
  }
} else {
  console.error('usage: session-plan.mjs estimate|merge|close|report (see the header of this file)'); process.exit(2);
}
