// Exports the brand icon set (src/lib/brandIconData.js) as standalone .svg
// files for Canva / non-React use. Two folders: strategic-operator (crisp,
// gold-stroke, transparent bg) and salter-momentum (hand-drawn via SVG
// turbulence filter baked into each file, teal-stroke with a small pink
// accent dot — pink used only as a mark, never a fill).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ICONS, ICON_VIEWBOX } from '../src/lib/brandIconData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = join(__dirname, '..', 'brand-assets', 'icons');
const opDir = join(outRoot, 'strategic-operator');
const moDir = join(outRoot, 'salter-momentum');
mkdirSync(opDir, { recursive: true });
mkdirSync(moDir, { recursive: true });

const OP_STROKE = '#C4843A'; // Terracotta Gold
const MO_STROKE = '#355C6A'; // Steel Teal (deep)
const MO_ACCENT = '#E8407A'; // Hot pink — mark only

function body(icon, stroke, strokeWidth) {
  const paths = icon.paths
    .map((d) => `  <path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    .join('\n');
  const circles = (icon.circles || [])
    .map((c) => `  <circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"/>`)
    .join('\n');
  return [paths, circles].filter(Boolean).join('\n');
}

function operatorSvg(name, icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX}" width="256" height="256">
  <title>${icon.label}</title>
${body(icon, OP_STROKE, 1.75)}
</svg>
`;
}

function momentumSvg(name, icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX}" width="256" height="256">
  <title>${icon.label}</title>
  <defs>
    <filter id="sketch-${name}" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <g filter="url(#sketch-${name})">
${body(icon, MO_STROKE, 2.25)}
  </g>
  <circle cx="40" cy="8" r="2.5" fill="${MO_ACCENT}"/>
</svg>
`;
}

let count = 0;
for (const [name, icon] of Object.entries(ICONS)) {
  writeFileSync(join(opDir, `${name}.svg`), operatorSvg(name, icon));
  writeFileSync(join(moDir, `${name}.svg`), momentumSvg(name, icon));
  count += 2;
}

console.log(`Exported ${count} SVG files (${Object.keys(ICONS).length} icons × 2 brand modes) to brand-assets/icons/`);
