// Deterministic per-atom lineage: a 10-week history + up to two pending
// future branches (open decisions/deals that would move the atom in the
// next review cycle), synthesized from the atom's id so it's stable across
// renders without hand-authoring a time series for every atom.
//
// This is the "past/future" half of a rod's real-time convergence model
// (see rodHash.js) — the rod is never just its present state; querying it
// converges present + this lineage into one result.

import { clamp01 } from './maturity.js';

function stableHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
}

function seededRand(id, salt) {
  return (stableHash(`${id}::${salt}`) % 10000) / 10000;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Keyed by object identity (WeakMap), not atomInstance.atomId — the same
// template atomId (e.g. "a-billto") is cloned into a fresh object per rod
// instance (see genesis.js cloneStages), so a string-keyed cache would
// collide two different rods' atoms that happen to share a template id.
const lineageCache = new WeakMap();

export function getAtomLineage(atomInstance) {
  const cached = lineageCache.get(atomInstance);
  if (cached && cached.version === (atomInstance.version || 1)) return cached.lineage;

  const history = [];
  let maturity = clamp01(atomInstance.maturity - (0.25 + seededRand(atomInstance.atomId, 'drift') * 0.2));
  for (let weeksAgo = 10; weeksAgo >= 1; weeksAgo -= 1) {
    const jitter = (seededRand(atomInstance.atomId, `w${weeksAgo}`) - 0.5) * 0.06;
    maturity = clamp01(lerp(maturity, atomInstance.maturity, 0.14) + jitter);
    const note = maturity > 0.8 ? 'Stable, single authoritative source' : maturity > 0.5 ? 'Partially reconciled' : 'Fragmented across systems';
    history.push({ weeksAgo, maturity, note });
  }

  const present = {
    maturity: atomInstance.maturity,
    note: atomInstance.conflict ? 'Unresolved conflict — no single authoritative value' : 'Current definition',
  };

  const pendingBranches = [];
  if (atomInstance.conflict && atomInstance.evidence?.length) {
    atomInstance.evidence.forEach((ev) => {
      pendingBranches.push({
        etaWeeks: 1,
        label: `Open decision: adopt ${ev.source} as authoritative`,
        detail: `If resolved toward ${ev.source}, value becomes "${ev.value}" and maturity moves to 100%.`,
        maturity: 1,
      });
    });
  } else if (seededRand(atomInstance.atomId, 'branch') > 0.55) {
    pendingBranches.push({
      etaWeeks: 1,
      label: 'Open deal/definition change pending',
      detail: `A pending update in this atom's molecule would shift its maturity by the next review cycle.`,
      maturity: clamp01(atomInstance.maturity + 0.08 + seededRand(atomInstance.atomId, 'branchdelta') * 0.15),
    });
  }

  (atomInstance.versionHistory || []).forEach((entry) => {
    pendingBranches.push({
      etaWeeks: 0,
      label: `Version ${entry.version} generated`,
      detail: entry.reason,
      maturity: atomInstance.maturity,
      isVersionEvent: true,
    });
  });

  const lineage = { history, present, pendingBranches };
  lineageCache.set(atomInstance, { version: atomInstance.version || 1, lineage });
  return lineage;
}

// offset: -10..-1 past weeks, 0 present, 1..N pending branches (in order).
export function lineageValueAtOffset(lineage, offset) {
  if (offset === 0) return { tag: 'Present', maturity: lineage.present.maturity, note: lineage.present.note, future: false };
  if (offset < 0) {
    const point = lineage.history.find((entry) => entry.weeksAgo === -offset);
    if (point) return { tag: `${-offset} week${-offset === 1 ? '' : 's'} ago`, maturity: point.maturity, note: point.note, future: false };
    return { tag: `${-offset} weeks ago`, maturity: lineage.present.maturity, note: 'No record', future: false };
  }
  const branch = lineage.pendingBranches[offset - 1];
  if (!branch) return { tag: 'No pending branch', maturity: lineage.present.maturity, note: 'No open decision projected in this window', future: true };
  return { tag: branch.isVersionEvent ? branch.label : `+${branch.etaWeeks} week (pending)`, maturity: branch.maturity, note: `${branch.label} — ${branch.detail}`, future: true };
}

// Used by the Outputs Agent's "regenerate as a new version" action: writes a
// real version-bump event into the atom's lineage instead of only narrating
// one. Mutates and returns the atom instance; callers should still trigger a
// visual refresh (refreshAtomVisual) since maturity/version changed. Records
// the value being superseded so version history carries a real prior value,
// not just a version number.
export function bumpVersion(atomInstance, reason) {
  const previousValue = atomInstance.value;
  atomInstance.version = (atomInstance.version || 1) + 1;
  atomInstance.versionHistory = atomInstance.versionHistory || [];
  atomInstance.versionHistory.push({ version: atomInstance.version, reason, at: Date.now(), previousValue });
  return atomInstance;
}
