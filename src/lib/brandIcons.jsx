// Salt Basin Net Works — brand icon set.
// Two brand modes, one geometry source (brandIconData.js):
//   'operator'  — Strategic Operator: crisp stroke, currentColor, no sketch filter.
//   'momentum'  — Salter Momentum™: same geometry through a feTurbulence/
//                 feDisplacementMap filter for a hand-drawn line quality.
// Pink is never applied as a fill here — only as an optional accent dot/mark,
// per the brand rule that pink is line/mark/border only.
import React from 'react';
import { ICONS, ICON_VIEWBOX } from './brandIconData.js';

let filterInjected = false;
function ensureSketchFilter() {
  if (filterInjected || typeof document === 'undefined') return;
  filterInjected = true;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `
    <defs>
      <filter id="sb-sketch-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>`;
  document.body.appendChild(svg);
}

export function BrandIcon({ name, variant = 'operator', size = 32, color, accent = false, className, style }) {
  const icon = ICONS[name];
  if (!icon) return null;
  if (variant === 'momentum') ensureSketchFilter();
  const stroke = color || 'currentColor';
  const strokeWidth = variant === 'momentum' ? 2.25 : 1.75;

  return (
    <svg
      viewBox={ICON_VIEWBOX}
      width={size}
      height={size}
      fill="none"
      className={className}
      style={style}
      filter={variant === 'momentum' ? 'url(#sb-sketch-filter)' : undefined}
      aria-label={icon.label}
      role="img"
    >
      {icon.paths.map((d, i) => (
        <path key={i} d={d} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {(icon.circles || []).map((c, i) => (
        <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} stroke={stroke} strokeWidth={strokeWidth} fill="none" />
      ))}
      {accent && variant === 'momentum' && (
        <circle cx={40} cy={8} r={2.5} fill="var(--herq-accent, #E8407A)" stroke="none" />
      )}
    </svg>
  );
}

export default BrandIcon;
