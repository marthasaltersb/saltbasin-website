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
//   (every command also takes --root <dir>: use another folder that holds docs/, e.g. a test fixture)
//
// The logic lives in server/lib/releaseCut.js, shared with the website (World Shell > Journeys > Release loop >
// Releases) and the release_cut_* MCP tools. SB_RELEASE_ROOT=<dir> points it at another folder that holds docs/.
// Files: docs/release-log/session-plans/<session>.json (committed; the tracker shows them). A score is
// never estimated after the fact and never filled in by hand: "not validated" stays null, never 0.
import path from 'node:path';
import * as rc from '../server/lib/releaseCut.js';

// --root <dir> = SB_RELEASE_ROOT: use another folder that holds docs/ (the training spec's fixture).
{ const i = process.argv.indexOf('--root'); if (i >= 0 && process.argv[i + 1]) process.env.SB_RELEASE_ROOT = path.resolve(process.argv[i + 1]); }

const [cmd, ...argv] = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const opts = (k) => argv.flatMap((a, i) => (a === k ? [argv[i + 1]] : []));
const fail = (m) => { console.error(m); process.exit(2); };

function parseItem(raw) {
  const o = Object.fromEntries(String(raw).split(';').map((kv) => kv.split('=')).filter((p) => p.length >= 2).map(([k, ...v]) => [k.trim(), v.join('=').trim()]));
  if (!o.feature) fail(`--item needs feature=<key>: ${raw}`);
  return { feature: o.feature, goal: o.goal || null, expect: o.expect || null, size: o.size || null };
}

try {
  if (cmd === 'estimate') {
    const s = opt('--session') || fail('--session is required');
    const out = rc.recordEstimate({ session: s, intent: opt('--intent'), items: opts('--item').map(parseItem), reestimate: opt('--reestimate') });
    const items = out.reEstimated ? out.session.reEstimates[out.session.reEstimates.length - 1].items : out.session.estimate.items;
    for (const it of items.filter((x) => x.outOfScope)) console.error(`Note: ${it.feature} is in the backlog of release ${out.session.release}${it.addedAfterCut ? ' (added after the cut)' : ''}, not its planned work; recorded as outOfScope.`);
    console.log(out.reEstimated ? `Re-estimate recorded for ${s} (original kept).` : `Estimate recorded for ${s}: ${out.session.estimate.items.length} item(s) in release ${out.session.release}.`);
  } else if (cmd === 'merge') {
    const s = opt('--session') || fail('--session is required');
    const out = rc.recordMerge({ session: s, commit: opt('--commit'), features: opts('--feature'), ifNew: argv.includes('--if-new') });
    const m = out.session.merges[out.session.merges.length - 1];
    console.log(out.recorded ? `Merge ${m.commit} recorded for ${s}: ${m.results.length} feature result(s).` : out.reason);
  } else if (cmd === 'close') {
    const s = opt('--session') || fail('--session is required');
    rc.closeSession({ session: s, note: opt('--note') });
    console.log(`Closed ${s}.`);
  } else if (cmd === 'report') {
    const r = rc.sessionReport({ release: opt('--release') });
    if (argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
    else {
      console.log(`Release ${r.release}: ${r.sessions.length} session plan(s)`);
      for (const x of r.rows) console.log(`  ${x.session}  ${x.feature.padEnd(28)} size ${x.size || '-'}  expected ${x.expected || '-'}  actual ${x.actual || 'not validated'}  ${x.met === null ? '' : x.met ? 'MET' : 'MISSED'}`);
    }
  } else {
    console.error('usage: session-plan.mjs estimate|merge|close|report (see the header of this file)'); process.exit(2);
  }
} catch (e) { console.error(e.message); process.exit(2); }
