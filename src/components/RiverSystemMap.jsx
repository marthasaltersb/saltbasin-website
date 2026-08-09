import React from 'react';
import { RIVER_MAP_VIEWBOX, RIVER_TRUNK_PATH, RIVER_TRIBUTARIES, RIVER_ENDPOINTS } from '../lib/riverSystemMap.js';

// Interactive/React form of the river system map — same geometry as
// src/lib/riverSystemMap.js's riverSystemMapSvg() (used for print-safe
// output HTML), rendered here with optional labels and hover state for
// admin/journey UI use (e.g. a Season/Theme/Topic overview).
export default function RiverSystemMap({
  color = 'var(--sb-teal-deep, #345A68)',
  tributaryColor = 'var(--sb-gold, #C4843A)',
  labels = {},
  width = 600,
  height = 300,
  className,
  style,
}) {
  return (
    <svg viewBox={RIVER_MAP_VIEWBOX} width={width} height={height} fill="none" className={className} style={style} role="img" aria-label="River system map">
      <path d={RIVER_TRUNK_PATH} stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {RIVER_TRIBUTARIES.map((t) => (
        <path key={t.id} d={t.path} stroke={tributaryColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
      {RIVER_TRIBUTARIES.map((t) => (
        <circle key={`c-${t.id}`} cx={t.confluence.x} cy={t.confluence.y} r={3} stroke={color} strokeWidth={2} fill="none" />
      ))}
      {RIVER_TRIBUTARIES.map((t) => (
        <g key={`s-${t.id}`}>
          <circle cx={t.source.x} cy={t.source.y} r={3} stroke={tributaryColor} strokeWidth={2} fill="none" />
          {labels[t.id] && (
            <text x={t.source.x} y={t.source.y - 8} textAnchor="middle" fontSize="10" fill={tributaryColor} fontFamily="var(--sb-font-label, sans-serif)">
              {labels[t.id]}
            </text>
          )}
        </g>
      ))}
      {RIVER_ENDPOINTS.map((e, i) => (
        <circle key={i} cx={e.x} cy={e.y} r={e.r} stroke={color} strokeWidth={2} fill="none" />
      ))}
      {labels.trunk && (
        <text x={(RIVER_ENDPOINTS[0].x + RIVER_ENDPOINTS[1].x) / 2} y={175} textAnchor="middle" fontSize="11" fill={color} fontFamily="var(--sb-font-label, sans-serif)">
          {labels.trunk}
        </text>
      )}
    </svg>
  );
}
