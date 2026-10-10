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
// Edits docs/release-log/active-release.features.json only. A reason and a decider are required: a scope change
// is an owner decision and the tracker shows it. Fictional data only (public repo).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SCOPES, scopeOf, isAddedAfterCut, groupByScope } from '../server/lib/releaseScope.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs/release-log/active-release.features.json');
const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const fail = (m) => { console.error(m); process.exit(1); };
const defs = JSON.parse(fs.readFileSync(file, 'utf8'));
const save = () => fs.writeFileSync(file, `${JSON.stringify(defs, null, 2)}\n`);
const now = new Date().toISOString();
const head = () => { try { return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { cwd: root }).toString().trim(); } catch { return null; } };
const need = (n, what) => { const v = opt(n); if (!v || !String(v).trim()) fail(`Give ${what} with ${n}.`); return String(v).trim(); };
const needScope = () => { const s = need('--scope', 'the scope (planned or backlog)'); if (!SCOPES.includes(s)) fail(`The scope must be one of: ${SCOPES.join(', ')}. Got "${s}".`); return s; };

if (cmd === 'show') {
  const g = groupByScope(defs.features);
  if (argv.includes('--json')) { process.stdout.write(`${JSON.stringify({ version: defs.version, scopeDecision: defs.scopeDecision || null, ...Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.map((f) => ({ key: f.key, scope: scopeOf(f), kind: f.kind || 'new', added: f.added || null }))])) }, null, 2)}\n`); process.exit(0); }
  console.log(`Release ${defs.version}${defs.scopeDecision ? ` — ${defs.scopeDecision.note}` : ''}`);
  console.log(`\nPlanned at the cut (${g.planned.length}):`); for (const f of g.planned) console.log(`  ${f.key}  [${f.kind || 'new'}]`);
  console.log(`\nAdded after the cut (${g.added.length}; ${g.added.filter((f) => scopeOf(f) === 'planned').length} counted in this release's planned work):`); for (const f of g.added) console.log(`  ${f.key}  scope=${scopeOf(f)}  added ${String(f.added.at).slice(0, 10)} ${f.added.commit || ''} by ${f.added.decidedBy}: ${f.added.reason}`);
  console.log(`\nBacklog, not this release's work (${g.backlog.length}):`); for (const f of g.backlog) console.log(`  ${f.key}  [${f.kind || 'new'}]${f.blockedOn ? ` blocked on ${f.blockedOn}` : ''}`);
} else if (cmd === 'add') {
  const key = need('--key', 'the feature key');
  if (defs.features.some((f) => f.key === key)) fail(`Feature "${key}" is already in release ${defs.version}. Use "set" to change its scope.`);
  const scope = needScope(); const by = need('--by', 'who decided'); const reason = need('--reason', 'the reason');
  defs.features.push({
    key, title: need('--title', 'the title'),
    trainingSpec: opt('--training') || `docs/training/${key}.md`, changeSpec: opt('--change') || `docs/changes/${key}.md`,
    build: opt('--build') || null, dependsOn: [], kind: 'new', scope,
    added: { at: now, commit: head(), decidedBy: by, reason },
    scopeHistory: [{ at: now, from: null, to: scope, decidedBy: by, reason }],
  });
  save(); console.log(`Added ${key} to release ${defs.version} after the cut, scope ${scope}.`);
} else if (cmd === 'set') {
  const key = need('--key', 'the feature key');
  const f = defs.features.find((x) => x.key === key); if (!f) fail(`Feature "${key}" is not in release ${defs.version}. Use "add" for a new feature.`);
  const scope = needScope(); const by = need('--by', 'who decided'); const reason = need('--reason', 'the reason');
  const from = scopeOf(f); if (from === scope) fail(`${key} is already ${scope}; nothing changed.`);
  f.scope = scope; f.scopeHistory = [...(f.scopeHistory || []), { at: now, from, to: scope, decidedBy: by, reason }];
  save(); console.log(`${key}: ${from} -> ${scope}${isAddedAfterCut(f) ? ' (added after the cut)' : ''}.`);
} else {
  fail('usage: release-scope.mjs show|add|set (see the header of this file)');
}
