// River System Map — a branching main-trunk + tributaries diagram, matching
// the brandIconData.js stroke language (rounded caps, currentColor-able,
// stroke-only, no fills). Geometry lives here as plain data so it can be
// consumed either as a React component (RiverSystemMap.jsx) or interpolated
// directly into print-safe output HTML (src/lib/outputBlocks.js), the same
// split brandIconData.js/brandIcons.jsx already uses for icons.
export const RIVER_MAP_VIEWBOX = '0 0 600 300';

// The main river (Revenue Highway / primary Channel Journey trunk).
export const RIVER_TRUNK_PATH =
  'M20 260 C120 250 160 200 220 190 C300 175 340 160 420 150 C480 143 520 148 580 150';

// Tributaries — each joins the trunk at a confluence point, source at the
// opposite end. Labels are left to the consuming component; this module only
// carries geometry, same convention as brandIconData.js.
export const RIVER_TRIBUTARIES = [
  { id: 'tributary-nw', path: 'M120 60 C150 90 180 120 215 185', source: { x: 120, y: 60 }, confluence: { x: 219, y: 189 } },
  { id: 'tributary-s', path: 'M300 280 C310 250 320 220 335 165', source: { x: 300, y: 280 }, confluence: { x: 336, y: 162 } },
  { id: 'tributary-ne', path: 'M560 40 C520 70 480 100 455 148', source: { x: 560, y: 40 }, confluence: { x: 453, y: 149 } },
  { id: 'tributary-se', path: 'M520 260 C510 230 500 200 490 152', source: { x: 520, y: 260 }, confluence: { x: 489, y: 151 } },
];

export const RIVER_ENDPOINTS = [
  { x: 20, y: 260, r: 5 },  // trunk source
  { x: 580, y: 150, r: 5 }, // trunk mouth
];

// Static, print-safe SVG string — same pattern as outputBlocks.js's iconSvg().
export function riverSystemMapSvg({ color = '#345A68', tributaryColor = '#C4843A', width = 600, height = 300 } = {}) {
  const trunk = `<path d="${RIVER_TRUNK_PATH}" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const tributaries = RIVER_TRIBUTARIES.map((t) =>
    `<path d="${t.path}" stroke="${tributaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  ).join('');
  const confluences = RIVER_TRIBUTARIES.map((t) =>
    `<circle cx="${t.confluence.x}" cy="${t.confluence.y}" r="3" stroke="${color}" stroke-width="2" fill="none"/>`
  ).join('');
  const sources = RIVER_TRIBUTARIES.map((t) =>
    `<circle cx="${t.source.x}" cy="${t.source.y}" r="3" stroke="${tributaryColor}" stroke-width="2" fill="none"/>`
  ).join('');
  const endpoints = RIVER_ENDPOINTS.map((e) =>
    `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" stroke="${color}" stroke-width="2" fill="none"/>`
  ).join('');
  return `<svg viewBox="${RIVER_MAP_VIEWBOX}" width="${width}" height="${height}" fill="none">${trunk}${tributaries}${confluences}${sources}${endpoints}</svg>`;
}
