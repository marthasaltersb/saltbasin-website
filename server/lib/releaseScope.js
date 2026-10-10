// Release scope: what a release is trying to do vs. its backlog vs. what was added after the cut
// (owner direction 2026-10-10). Pure; shared by the release scripts, the tracker sync and the platform
// release tracker so every surface groups features the same way.
//
// Each feature in docs/release-log/active-release.features.json carries:
//   scope: 'planned'  -> this release's work; the release's score counts only these
//          'backlog'  -> kept on the record (bugs never disappear) but not this release's work
//   added: { at, commit, decidedBy, reason }  -> present only when the feature joined AFTER the cut;
//          an added feature still has a scope (planned or backlog), so scope growth is visible
//   scopeHistory: [{ at, from, to, decidedBy, reason }]  -> every later scope change, never rewritten
// Older files have no scope: carried_backlog and owner-blocked features read as backlog, the rest planned.

export const SCOPES = Object.freeze(['planned', 'backlog']);

export function scopeOf(f) {
  if (f && SCOPES.includes(f.scope)) return f.scope;
  if (!f) return null;
  if (f.kind === 'carried_backlog' || f.blockedOn) return 'backlog';
  return 'planned';
}

export const isAddedAfterCut = (f) => !!(f && f.added && typeof f.added === 'object');

/** Group features into the three lists the owner reviews. Features with no definition go to `other`. */
export function groupByScope(features, defs = null) {
  const byKey = new Map((defs || features || []).map((d) => [d.key, d]));
  const out = { planned: [], added: [], backlog: [], other: [] };
  for (const f of features || []) {
    const d = defs ? byKey.get(f.key) : f;
    if (!d) { out.other.push(f); continue; }
    if (isAddedAfterCut(d)) out.added.push(f);
    else if (scopeOf(d) === 'backlog') out.backlog.push(f);
    else out.planned.push(f);
  }
  return out;
}

/** Copy scope/added from the definitions onto snapshot features (additive keys only). */
export function annotateFeatures(features, defs) {
  const byKey = new Map((defs || []).map((d) => [d.key, d]));
  return (features || []).map((f) => {
    const d = byKey.get(f.key);
    if (!d) return { ...f, scope: f.scope || 'not_in_release' };
    return { ...f, scope: scopeOf(d), ...(isAddedAfterCut(d) ? { added: d.added } : {}) };
  });
}
