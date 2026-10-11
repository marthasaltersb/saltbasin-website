#!/usr/bin/env node
// Release scope: planned (this release's work) vs backlog (kept on the record, not this release's work) vs added
// after the cut (owner direction 2026-10-10; shared logic in server/lib/releaseScope.js).
//
//   node scripts/release-scope.mjs show [--json]
//   node scripts/release-scope.mjs add --key <feature> --title "<title>" --scope planned|backlog --by <who> --reason "<why>"
//        [--training docs/training/x.md] [--change docs/changes/x.md] [--build "<what to build>"]
//        (a feature that joins the open release after the cut: recorded with added {at, commit, decidedBy, reason})
//   node scripts/release-scope.mjs set --key <feature> --scope planned|backlog --by <who> --reason "<why>"
//        (moves an existing feature; appended to its scopeHistory, never rewritten)
//
// Edits docs/release-log/active-release.features.json only (commit it to keep the change), through server/lib/releaseScopeChange.js (the same function the API and MCP tools call). A reason and a decider are required: a scope change
// is an owner decision and the tracker shows it. Fictional data only (public repo).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopeOf, groupByScope } from '../server/lib/releaseScope.js';
import { setFeatureScope, addFeatureAfterCut } from '../server/lib/releaseScopeChange.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs/release-log/active-release.features.json');
const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const fail = (m) => { console.error(m); process.exit(1); };
const defs = JSON.parse(fs.readFileSync(file, 'utf8'));
const FLAGS = { key: '--key', scope: '--scope', by: '--by', reason: '--reason', title: '--title' };
const run = async (fn) => { try { console.log((await fn()).message); } catch (e) { fail(e.message); } };

if (cmd === 'show') {
  const g = groupByScope(defs.features);
  if (argv.includes('--json')) { process.stdout.write(`${JSON.stringify({ version: defs.version, scopeDecision: defs.scopeDecision || null, ...Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.map((f) => ({ key: f.key, scope: scopeOf(f), kind: f.kind || 'new', added: f.added || null }))])) }, null, 2)}\n`); process.exit(0); }
  console.log(`Release ${defs.version}${defs.scopeDecision ? ` — ${defs.scopeDecision.note}` : ''}`);
  console.log(`\nPlanned at the cut (${g.planned.length}):`); for (const f of g.planned) console.log(`  ${f.key}  [${f.kind || 'new'}]`);
  console.log(`\nAdded after the cut (${g.added.length}; ${g.added.filter((f) => scopeOf(f) === 'planned').length} counted in this release's planned work):`); for (const f of g.added) console.log(`  ${f.key}  scope=${scopeOf(f)}  added ${String(f.added.at).slice(0, 10)} ${f.added.commit || ''} by ${f.added.decidedBy}: ${f.added.reason}`);
  console.log(`\nBacklog, not this release's work (${g.backlog.length}):`); for (const f of g.backlog) console.log(`  ${f.key}  [${f.kind || 'new'}]${f.blockedOn ? ` blocked on ${f.blockedOn}` : ''}`);
} else if (cmd === 'add') {
  await run(() => addFeatureAfterCut({
    key: opt('--key'), title: opt('--title'), scope: opt('--scope'), decidedBy: opt('--by'), reason: opt('--reason'),
    training: opt('--training'), change: opt('--change'), build: opt('--build'),
  }, FLAGS));
} else if (cmd === 'set') {
  await run(() => setFeatureScope({ key: opt('--key'), scope: opt('--scope'), decidedBy: opt('--by'), reason: opt('--reason') }, FLAGS));
} else {
  fail('usage: release-scope.mjs show|add|set (see the header of this file)');
}
