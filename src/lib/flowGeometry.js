// Journey flow studio: pure geometry + static SVG drawing, shared by the React editor (src/components/admin/
// FlowStudioPanel.jsx) and the server's self-contained HTML viewer export (server/lib/flowStudioDoc.js).
// Sizes, colours and drawing kinds come from the versioned definition (shapeTypes), never from this file.

export const LANE_H = 150;
export const LANE_LABEL_W = 0;

export const shapeOf = (def, type) => def.shapeTypes.find((s) => s.key === type) || def.shapeTypes[0];

export function nodeBox(def, n) {
  const s = shapeOf(def, n.type);
  return { x: n.x, y: n.y, w: s.w, h: s.h, cx: n.x + s.w / 2, cy: n.y + s.h / 2 };
}

/** Where an arrow between two nodes leaves one and enters the other (clipped to the bounding box). */
export function edgeEndpoints(def, from, to) {
  const a = nodeBox(def, from); const b = nodeBox(def, to);
  const clip = (box, tx, ty) => {
    const dx = tx - box.cx; const dy = ty - box.cy;
    if (dx === 0 && dy === 0) return { x: box.cx, y: box.cy };
    const sx = dx !== 0 ? (box.w / 2) / Math.abs(dx) : Infinity;
    const sy = dy !== 0 ? (box.h / 2) / Math.abs(dy) : Infinity;
    const t = Math.min(sx, sy);
    return { x: box.cx + dx * t, y: box.cy + dy * t };
  };
  const p1 = clip(a, b.cx, b.cy); const p2 = clip(b, a.cx, a.cy);
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

/** Path + label anchor for one connector. Self-loops draw an arc above the step (kept inside the canvas). */
export function edgePath(def, from, to, selfIndex = 0) {
  if (from.id === to.id) {
    const b = nodeBox(def, from);
    const top = Math.max(b.y, 40);
    const r = 26 + selfIndex * 14;
    const x1 = b.cx - 18; const x2 = b.cx + 18; const y = top;
    const d = `M ${x1} ${y} C ${x1 - r} ${y - r - 18}, ${x2 + r} ${y - r - 18}, ${x2} ${y}`;
    return { d, lx: b.cx, ly: y - r - 10, loop: true };
  }
  const { x1, y1, x2, y2 } = edgeEndpoints(def, from, to);
  return { d: `M ${x1} ${y1} L ${x2} ${y2}`, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2, loop: false };
}

/** The drawing primitives of one shape: an extruded back layer and the face, as plain data. */
export function shapePrims(def, n) {
  const s = shapeOf(def, n.type); const b = nodeBox(def, n);
  const off = 4;
  const rect = (dx, dy) => ({ t: 'rect', x: b.x + dx, y: b.y + dy, w: b.w, h: b.h, rx: 12 });
  const diamond = (dx, dy) => ({ t: 'poly', pts: `${b.cx + dx},${b.y + dy} ${b.x + b.w + dx},${b.cy + dy} ${b.cx + dx},${b.y + b.h + dy} ${b.x + dx},${b.cy + dy}` });
  const circle = (dx, dy) => ({ t: 'circle', cx: b.cx + dx, cy: b.cy + dy, r: b.w / 2 });
  const flag = (dx, dy) => { const cut = b.w * 0.18; return { t: 'poly', pts: `${b.x + dx},${b.y + dy} ${b.x + b.w - cut + dx},${b.y + dy} ${b.x + b.w + dx},${b.y + b.h * 0.3 + dy} ${b.x + b.w + dx},${b.y + b.h + dy} ${b.x + dx},${b.y + b.h + dy}` }; };
  const pill = (dx, dy) => ({ t: 'rect', x: b.x + dx, y: b.y + dy, w: b.w, h: b.h, rx: b.h / 2 });
  const draw = { rect, diamond, circle, flag, pill }[s.kind] || rect;
  return { back: draw(off, off + 1), face: draw(0, 0), s, b };
}

export const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const primSvg = (p, attrs) => {
  if (p.t === 'rect') return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rx}" ${attrs}/>`;
  if (p.t === 'circle') return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" ${attrs}/>`;
  return `<polygon points="${p.pts}" ${attrs}/>`;
};

export function hasField(meta, key) { return !!(meta && typeof meta[key] === 'string' && meta[key].trim()); }

/** Static SVG for a state (used by the HTML viewer). Interactive editor draws the same prims in React. */
export function stateSvg(def, state, scenario = 'base') {
  const nodes = state.nodes || []; const edges = state.edges || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const lanes = state.lanes || [];
  const maxX = Math.max(900, ...nodes.map((n) => n.x + shapeOf(def, n.type).w + 60));
  const maxY = Math.max(lanes.length * LANE_H, ...nodes.map((n) => n.y + shapeOf(def, n.type).h + 60), 300);
  const dim = (tags) => Array.isArray(tags) && tags.length > 0 && !(scenario !== 'base' && tags.includes(scenario));
  const laneSvg = lanes.map((l, i) => `<rect x="0" y="${i * LANE_H}" width="${maxX}" height="${LANE_H}" fill="${i % 2 ? '#fbf9f4' : '#f6f2ea'}" stroke="#e5ded3"/><text x="8" y="${i * LANE_H + 18}" font-family="sans-serif" font-size="12" font-weight="700" fill="#536173">${esc(l.label)}</text>`).join('');
  const loopCount = {};
  const edgeSvg = edges.map((e) => {
    const f = byId.get(e.from); const t = byId.get(e.to); if (!f || !t) return '';
    const si = e.from === e.to ? (loopCount[e.from] = (loopCount[e.from] ?? -1) + 1) : 0;
    const p = edgePath(def, f, t, si);
    const ov = (e.overlays && e.overlays[scenario]) || {};
    const label = ov.label ?? e.label;
    const op = dim(e.scenarioTags) ? 0.3 : 1;
    let out = `<g opacity="${op}"><path d="${p.d}" fill="none" stroke="${shapeOf(def, f.type).branching ? '#C4843A' : '#345A68'}" stroke-width="2" marker-end="url(#arrow)"/>`;
    if (label) { const lw = Math.max(34, label.length * 6.4 + 16); out += `<rect x="${p.lx - lw / 2}" y="${p.ly - 11}" width="${lw}" height="22" rx="11" fill="#F8F4EC" stroke="#C4843A"/><text x="${p.lx}" y="${p.ly + 4}" text-anchor="middle" font-family="monospace" font-size="10" fill="#345A68">${esc(label)}</text>`; }
    return `${out}</g>`;
  }).join('');
  const nodeSvg = nodes.map((n) => {
    const { back, face, s, b } = shapePrims(def, n);
    const exec = def.execModes.find((m) => m.key === (n.execMode || ''));
    const par = n.concurrency === 'parallel' ? def.concurrencyModes.find((m) => m.key === 'parallel') : null;
    const meta = { ...(n.meta?.base || {}), ...(n.meta?.[scenario] || {}) };
    let out = `<g opacity="${dim(n.scenarioTags) ? 0.3 : 1}">${primSvg(back, `fill="${s.shadow}" opacity="0.55"`)}${primSvg(face, `fill="${s.fill}" stroke="${s.stroke}" stroke-width="2"`)}`;
    out += `<text x="${b.cx}" y="${b.cy + 4}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${s.text}">${esc(n.label)}</text>`;
    if (exec && exec.badge) out += `<circle cx="${b.x + 2}" cy="${b.y + 2}" r="9" fill="${exec.color}"/><text x="${b.x + 2}" y="${b.y + 6}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="sans-serif">${esc(exec.badge)}</text>`;
    if (par) out += `<rect x="${b.x + b.w - 20}" y="${b.y - 8}" width="26" height="16" rx="8" fill="${par.color}"/><text x="${b.x + b.w - 7}" y="${b.y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="sans-serif">${esc(par.badge)}</text>`;
    const pain = def.resolveKinds.some((k) => hasField(meta, k.field));
    if (pain) out += `<circle cx="${b.x + b.w - 4}" cy="${b.y + b.h - 4}" r="5" fill="#a5391f"/>`;
    return `${out}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#C4843A"/></marker></defs><rect width="100%" height="100%" fill="#F8F4EC"/>${laneSvg}${edgeSvg}${nodeSvg}</svg>`;
}
