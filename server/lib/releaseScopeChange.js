// Changing a release's scope: ONE implementation shared by scripts/release-scope.mjs, the API
// (server/routes/releaseTracker.js, /scope) and the MCP tools (release_tracker_*_scope in mcpToolRegistry.js).
//
// Where a change is kept (round 4): on the CLI (and any checkout) it edits docs/release-log/active-release.features.json,
// which is committed. On a deployed server that file is an ephemeral copy of the build, so there the change is kept in
// the config_state row `release_scope_overrides` (merged over the file whenever scope is read and whenever the tracker
// pulls from the repository). Deployed = SB_SCOPE_STORE=db, or RENDER set while SB_SCOPE_STORE is not set.
// A decider and a reason are required; every move is appended to scopeHistory (with the surface, requester and
// approver) and never rewritten. Fictional data only (public repo).
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
const saveFile = (d) => fs.writeFileSync(file(), `${JSON.stringify(d, null, 2)}\n`);

const OVERRIDES_ROW = 'release_scope_overrides';
export const usesDatabaseStore = () => (process.env.SB_SCOPE_STORE ? process.env.SB_SCOPE_STORE === 'db' : !!process.env.RENDER);
const dbm = () => import('../db.js');
async function readOverrides() {
  if (!usesDatabaseStore()) return {};
  const { getJSON } = await dbm();
  let v;
  try { v = await getJSON('config_state', OVERRIDES_ROW); } catch (e) {
    throw problem(`The saved scope changes could not be read, so nothing was shown or changed. Try again in a moment.\nTechnical detail: ${e.message}`, 500, 'overrides_unreadable');
  }
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}
/** Merge saved scope changes (database store) over a features document: an override wins only when its history is longer. */
export function applyScopeOverrides(defs, overrides) {
  const mine = defs && overrides && overrides[defs.version];
  if (!mine || !Array.isArray(defs.features)) return defs;
  const features = defs.features.map((f) => {
    const o = mine[f.key];
    if (o && Array.isArray(o.scopeHistory) && o.scopeHistory.length > (f.scopeHistory || []).length) return { ...f, scope: o.scope, scopeHistory: o.scopeHistory };
    return f;
  });
  for (const [k, o] of Object.entries(mine)) if (o.def && !features.some((f) => f.key === k)) features.push(o.def);
  return { ...defs, features };
}
/** For the tracker pull: the repository's features file with the platform's saved scope changes merged in. */
export async function withScopeOverrides(defs) { return applyScopeOverrides(defs, await readOverrides()); }
async function loadMerged() { return applyScopeOverrides(load(), await readOverrides()); }

/** Keep a changed feature: in the database store when deployed, otherwise in the release file. */
async function persist(defs, f, isNew) {
  if (usesDatabaseStore()) {
    const { setJSON } = await dbm();
    const all = await readOverrides();
    all[defs.version] = { ...(all[defs.version] || {}), [f.key]: { scope: f.scope, scopeHistory: f.scopeHistory, ...(isNew ? { def: f } : {}) } };
    try { await setJSON('config_state', OVERRIDES_ROW, all); } catch (e) {
      throw problem(`The scope change could not be saved, so nothing changed. Try again in a moment.\nTechnical detail: ${e.message}`, 500, 'overrides_unsaved');
    }
    return 'database';
  }
  const d = load();
  const i = d.features.findIndex((x) => x.key === f.key);
  if (i >= 0) d.features[i] = f; else d.features.push(f);
  saveFile(d);
  return 'file';
}
const STORED_NOTE = {
  database: 'Saved on the platform, so the tracker shows it now and keeps it across redeploys.',
  file: 'Recorded in docs/release-log/active-release.features.json in this checkout; commit that file to keep it.',
};
export const storedNote = (where) => STORED_NOTE[where] || '';
const SURFACES = ['cli', 'api', 'mcp', 'card'];
const surfaceOf = (v, dflt) => (SURFACES.includes(v) ? v : dflt);

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
export async function showScope() {
  const defs = await loadMerged();
  const g = groupByScope(defs.features);
  const row = (f) => ({ key: f.key, title: f.title || f.key, scope: scopeOf(f), kind: f.kind || 'new', added: f.added || null });
  return { version: defs.version, scopeDecision: defs.scopeDecision || null, storage: usesDatabaseStore() ? 'database' : 'file', planned: g.planned.map(row), added: g.added.map(row), backlog: g.backlog.map(row) };
}

function countsOf(features) {
  const g = groupByScope(features);
  return { planned: g.planned.length, added: g.added.length, backlog: g.backlog.length, plannedCounted: features.filter((f) => scopeOf(f) === 'planned').length };
}
function impactOf(before, after, notes) {
  const b = countsOf(before); const a = countsOf(after);
  return {
    before: b, after: a,
    effects: [
      `Release counts and scores cover planned work only: ${b.plannedCounted} counted now, ${a.plannedCounted} after this change.`,
      ...notes,
      'The feature\'s scope history gets one entry recording this change, who requested and approved it, and which surface it came from.',
    ],
  };
}

/** What a scope move would change, before anything is written (the same preview on the card, API and MCP tool). */
export async function previewScopeMove({ key, scope }) {
  const k = need(key, 'the feature key');
  const defs = await loadMerged();
  const f = defs.features.find((x) => x.key === k);
  if (!f) throw problem(`Feature "${k}" is not in release ${defs.version}. Add it as a new feature instead.`, 404, 'not_found');
  const to = needScope(scope); const from = scopeOf(f);
  if (from === to) throw problem(`${k} is already ${to}; nothing would change.`, 409, 'no_change');
  const after = defs.features.map((x) => (x.key === k ? { ...x, scope: to } : x));
  const notes = to === 'planned'
    ? [`${k} is launched by the release loop and counted in the release's planned work, scores and tracker totals.`]
    : [`${k} is no longer launched by the release loop unless backlog is included; its bugs stay on the record, and session plans mark it out of scope.`];
  return { key: k, from, to, version: defs.version, impact: impactOf(defs.features, after, notes) };
}

/** Move an existing feature between planned and backlog. `flags` names the CLI flags in error text (CLI only).
 *  `actor` = { surface, by } names who submitted it; submitting it after the preview is the one approval. */
export async function setFeatureScope({ key, scope, decidedBy, reason }, flags = {}, actor = {}) {
  const k = need(key, 'the feature key', flags.key);
  const defs = await loadMerged();
  const f = defs.features.find((x) => x.key === k);
  if (!f) throw problem(`Feature "${k}" is not in release ${defs.version}. Add it as a new feature instead.`, 404, 'not_found');
  const to = needScope(scope, flags.scope); const by = need(decidedBy, 'who decided', flags.by); const why = need(reason, 'the reason', flags.reason);
  const from = scopeOf(f);
  if (from === to) throw problem(`${k} is already ${to}; nothing changed.`, 409, 'no_change');
  const preview = await previewScopeMove({ key: k, scope: to });
  const at = new Date().toISOString();
  const who = actor.by || by;
  const next = { ...f, scope: to, scopeHistory: [...(f.scopeHistory || []), { at, from, to, decidedBy: by, reason: why, via: surfaceOf(actor.surface, 'cli'), requestedBy: who, approvedBy: who, approvedAt: at }] };
  const stored = await persist(defs, next, false);
  return { key: k, from, to, addedAfterCut: isAddedAfterCut(next), version: defs.version, storedIn: stored, impact: preview.impact, message: `${k}: ${from} -> ${to}${isAddedAfterCut(next) ? ' (added after the cut)' : ''}.` };
}

/** A feature that joins the open release after the cut, recorded with added {at, commit, decidedBy, reason}. */
export async function addFeatureAfterCut({ key, title, scope, decidedBy, reason, training, change, build }, flags = {}, actor = {}) {
  const k = need(key, 'the feature key', flags.key);
  const defs = await loadMerged();
  if (defs.features.some((f) => f.key === k)) throw problem(`Feature "${k}" is already in release ${defs.version}. Change its scope instead.`, 409, 'duplicate');
  const sc = needScope(scope, flags.scope); const by = need(decidedBy, 'who decided', flags.by); const why = need(reason, 'the reason', flags.reason);
  const t = need(title, 'the title', flags.title);
  const at = new Date().toISOString();
  const who = actor.by || by;
  const entry = {
    key: k, title: t,
    trainingSpec: training || `docs/training/${k}.md`, changeSpec: change || `docs/changes/${k}.md`,
    build: build || null, dependsOn: [], kind: 'new', scope: sc,
    added: { at, commit: gitHead(), decidedBy: by, reason: why },
    scopeHistory: [{ at, from: null, to: sc, decidedBy: by, reason: why, via: surfaceOf(actor.surface, 'cli'), requestedBy: who, approvedBy: who, approvedAt: at }],
  };
  const impact = impactOf(defs.features, [...defs.features, entry], [`${k} joins release ${defs.version} after the cut and is listed under "added after the cut"${sc === 'planned' ? ' and counted in planned work' : ', not counted'}.`]);
  const stored = await persist(defs, entry, true);
  return { key: k, scope: sc, version: defs.version, storedIn: stored, impact, message: `Added ${k} to release ${defs.version} after the cut, scope ${sc}.` };
}
