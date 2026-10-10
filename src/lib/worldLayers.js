// World Shell layer model (2026-10-09, docs/changes/world-shell-layers.md).
//
// ONE stack describes where the user is. The Sun (the world root menu) is
// implicit layer 0 and is never serialised; every click into an object pushes
// exactly one layer after it. The stack lives in the URL (`/world?at=...`) so
// refresh, browser Back/Forward and shared links restore the exact layer.
//
// A layer is { kind, key, label }. `label` is display-only and is NOT part of
// the URL (it is re-derived from data on restore).
//
//   journeys            the Journeys card grid (a summary page)
//   island:<tabId>      an island (docked panel / embed / atmosphere planet)
//   moon:<moonKey>      a moon inside an atmosphere island
//   opp:<id>            one tracked opportunity (inside a docked island)
//   outputs             the Application Outputs list of that opportunity (a summary page)
//   output:<id>         one output (full provenance + actions)
//   versions:<id>       the dated version history of that output
//   editor:<id>         the shared block editor on that output
//   classic:<tab|_>     Classic Tools (the unchanged AdminShell), '_' = default tab
//
// Segments are `kind:key` joined by `,`; keys are URI-encoded. Everything is
// append-only vocabulary: a layer kind may be added, never renamed, because a
// shared link may carry it.

export const LAYER_KINDS = ['journeys', 'island', 'moon', 'opp', 'outputs', 'output', 'versions', 'editor', 'classic'];
const KEYLESS = new Set(['journeys', 'outputs']);

export function parseAt(at) {
  if (!at) return [];
  const out = [];
  for (const seg of String(at).split(',')) {
    if (!seg) continue;
    const i = seg.indexOf(':');
    const kind = i < 0 ? seg : seg.slice(0, i);
    let key = i < 0 ? '' : seg.slice(i + 1);
    try { key = decodeURIComponent(key); } catch { /* keep raw */ }
    out.push({ kind, key });
  }
  return out;
}

export function serializeAt(stack) {
  return (stack || [])
    .map((l) => (KEYLESS.has(l.kind) ? l.kind : `${l.kind}:${encodeURIComponent(l.key)}`))
    .join(',');
}

export function searchFor(stack) {
  const at = serializeAt(stack);
  return at ? `?at=${at}` : '';
}

export const trailKeyOf = (stack) => serializeAt(stack) || 'sun';
export const sameLayer = (a, b) => !!a && !!b && a.kind === b.kind && String(a.key) === String(b.key);

// Index of the effective island (the last 'island' layer) or -1.
export function lastIslandIndex(stack) {
  for (let i = stack.length - 1; i >= 0; i -= 1) if (stack[i].kind === 'island') return i;
  return -1;
}

// Structural validity of one layer given the layer before it. Returns '' when
// fine, else a short reason. Data-dependent validity (does this opportunity
// still exist?) is checked by the shell against live data.
export function structuralProblem(layer, prev, index) {
  if (!LAYER_KINDS.includes(layer.kind)) return 'unknown layer';
  if (!KEYLESS.has(layer.kind) && !layer.key) return 'it needs a name';
  if (prev?.kind === 'classic') return 'nothing opens inside Classic Tools';
  switch (layer.kind) {
    case 'journeys': return index === 0 ? '' : 'Journeys is only a first layer';
    case 'island': case 'classic': return '';
    case 'moon': return prev?.kind === 'island' ? '' : 'a moon opens inside an island';
    case 'opp': return prev?.kind === 'island' ? '' : 'an opportunity opens inside an island';
    case 'outputs': return prev?.kind === 'opp' ? '' : 'outputs open inside an opportunity';
    case 'output': return ['outputs', 'opp'].includes(prev?.kind) ? '' : 'an output opens from the outputs list or its opportunity';
    case 'versions': return ['output', 'opp', 'editor'].includes(prev?.kind) ? '' : 'version history opens from an output, opportunity or draft';
    case 'editor': return ['output', 'opp'].includes(prev?.kind) ? '' : 'the editor opens from an output or its opportunity';
    default: return '';
  }
}

// ── per-layer UI memory (scroll position, filters) ────────────────────────
// Keyed by the trail that reaches the layer, so the same object reached from
// a different summary page keeps its own scroll/filters. sessionStorage is a
// per-viewer convenience only; every access is guarded.
const UI_KEY = 'sb-world-layer-ui:v1';
function readAll() {
  try { return JSON.parse(sessionStorage.getItem(UI_KEY) || '{}') || {}; } catch { return {}; }
}
export function readLayerUi(trailKey) { return readAll()[trailKey] || {}; }
export function writeLayerUi(trailKey, patch) {
  try {
    const all = readAll();
    all[trailKey] = { ...(all[trailKey] || {}), ...patch };
    const keys = Object.keys(all);
    if (keys.length > 200) for (const k of keys.slice(0, keys.length - 200)) delete all[k];
    sessionStorage.setItem(UI_KEY, JSON.stringify(all));
  } catch { /* storage unavailable: layers still work, just without memory */ }
}

export function prefersReducedMotion() {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}
