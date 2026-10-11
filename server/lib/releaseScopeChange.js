// Changing a release's scope: ONE implementation shared by scripts/release-scope.mjs, the API
// (server/routes/releaseTracker.js, /scope) and the MCP tools (release_tracker_*_scope in mcpToolRegistry.js).
// Edits docs/release-log/active-release.features.json only; a decider and a reason are required, every move is
// appended to scopeHistory and never rewritten. Fictional data only (public repo).
import fs from 'node:fs';
import path from 'node:path';
import { SCOPES, scopeOf, isAddedAfterCut, groupByScope } from './releaseScope.js';
import { releaseRoot, gitHead, problem } from './releaseCut.js';

const file = () => path.join(releaseRoot(), 'docs/release-log/active-release.features.json');
function load() {
  let d;
  try { d = JSON.parse(fs.readFileSync(file(), 'utf8')); } catch { d = null; }
  if (!d || !Array.isArray(d.features)) throw problem('The open release has no feature list yet (docs/release-log/active-release.features.json is missing).', 404, 'not_found');
  return d;
}
const save = (d) => fs.writeFileSync(file(), `${JSON.stringify(d, null, 2)}\n`);
const need = (v, what, flag) => {
  if (v == null || !String(v).trim()) throw problem(`Give ${what}${flag ? ` with ${flag}` : ''}.`, 400, 'missing_field');
  return String(v).trim();
};
const needScope = (v, flag) => {
  const s = need(v, 'the scope (planned or backlog)', flag);
  if (!SCOPES.includes(s)) throw problem(`The scope must be one of: ${SCOPES.join(', ')}. Got "${s}".`, 400, 'bad_scope');
  return s;
};

/** The release's features grouped planned / added / backlog (what `show` prints). */
export function showScope() {
  const defs = load();
  const g = groupByScope(defs.features);
  const row = (f) => ({ key: f.key, title: f.title || f.key, scope: scopeOf(f), kind: f.kind || 'new', added: f.added || null });
  return { version: defs.version, scopeDecision: defs.scopeDecision || null, planned: g.planned.map(row), added: g.added.map(row), backlog: g.backlog.map(row) };
}

/** Move an existing feature between planned and backlog. `flags` names the CLI flags in error text (CLI only). */
export function setFeatureScope({ key, scope, decidedBy, reason }, flags = {}) {
  const k = need(key, 'the feature key', flags.key);
  const defs = load();
  const f = defs.features.find((x) => x.key === k);
  if (!f) throw problem(`Feature "${k}" is not in release ${defs.version}. Use "add" for a new feature.`, 404, 'not_found');
  const to = needScope(scope, flags.scope); const by = need(decidedBy, 'who decided', flags.by); const why = need(reason, 'the reason', flags.reason);
  const from = scopeOf(f);
  if (from === to) throw problem(`${k} is already ${to}; nothing changed.`, 409, 'no_change');
  f.scope = to;
  f.scopeHistory = [...(f.scopeHistory || []), { at: new Date().toISOString(), from, to, decidedBy: by, reason: why }];
  save(defs);
  return { key: k, from, to, addedAfterCut: isAddedAfterCut(f), version: defs.version, message: `${k}: ${from} -> ${to}${isAddedAfterCut(f) ? ' (added after the cut)' : ''}.` };
}

/** A feature that joins the open release after the cut, recorded with added {at, commit, decidedBy, reason}. */
export function addFeatureAfterCut({ key, title, scope, decidedBy, reason, training, change, build }, flags = {}) {
  const k = need(key, 'the feature key', flags.key);
  const defs = load();
  if (defs.features.some((f) => f.key === k)) throw problem(`Feature "${k}" is already in release ${defs.version}. Use "set" to change its scope.`, 409, 'duplicate');
  const sc = needScope(scope, flags.scope); const by = need(decidedBy, 'who decided', flags.by); const why = need(reason, 'the reason', flags.reason);
  const t = need(title, 'the title', flags.title);
  const at = new Date().toISOString();
  defs.features.push({
    key: k, title: t,
    trainingSpec: training || `docs/training/${k}.md`, changeSpec: change || `docs/changes/${k}.md`,
    build: build || null, dependsOn: [], kind: 'new', scope: sc,
    added: { at, commit: gitHead(), decidedBy: by, reason: why },
    scopeHistory: [{ at, from: null, to: sc, decidedBy: by, reason: why }],
  });
  save(defs);
  return { key: k, scope: sc, version: defs.version, message: `Added ${k} to release ${defs.version} after the cut, scope ${sc}.` };
}
