import React from 'react';

// Central icon registry — river/nautical icons, hot-pink special-situation
// icons, and metric icons, all in one place so any component (and the
// drag-and-drop Icon Library palette) can look an icon up by a single string
// key instead of importing dozens of one-off components.
//
// Style rule: every icon here is stroke-based line art. Nautical + metric
// icons use var(--sb-navy)/var(--sb-gold)/var(--sb-teal) so they re-theme
// automatically; pink icons use var(--sb-pink-500) and must never be given a
// fill background per the brand's pink-is-a-line-not-a-fill rule.
//
// Registering a NEW icon: add a `{ paths, viewBox }` entry to ICON_DEFS below
// (paths is raw SVG child markup as a string, keeps this file diffable) and
// it's immediately available to <Icon name="..." />, the icon field in
// EditorPane.jsx, and the IconLibraryPanel palette — no other file changes.

export const ICON_CATEGORIES = {
  nautical: 'River System',
  pink: 'Hot Pink — Special Situations',
  metric: 'Metric Icons',
};

const ICON_DEFS = {
  // ── Nautical / river system ──
  anchor: {
    category: 'nautical', label: 'Anchor', meaning: 'Foundational capability',
    stroke: 'var(--sb-navy)',
    paths: '<circle cx="0" cy="-9" r="4"/><line x1="0" y1="-5" x2="0" y2="11"/><path d="M -9 11 A 9 9 0 0 0 9 11"/><line x1="-11" y1="1" x2="11" y2="1"/>',
  },
  compass: {
    category: 'nautical', label: 'Compass', meaning: 'Direction / strategy',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="12"/><path d="M 0 -7 L 3 0 L 0 7 L -3 0 Z" fill="var(--sb-gold)" stroke="none"/><circle r="1.4" fill="var(--sb-navy)" stroke="none"/>',
  },
  lighthouse: {
    category: 'nautical', label: 'Lighthouse', meaning: 'Insight / analytics',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -5 12 L -7 -7 L 7 -7 L 5 12 Z"/><line x1="-7" y1="-7" x2="7" y2="-7"/><rect x="-3.5" y="-13" width="7" height="6"/>',
  },
  channelBuoy: {
    category: 'nautical', label: 'Channel Buoy', meaning: 'Milestone / waypoint',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M 0 -12 L 6 6 L -6 6 Z"/><line x1="-8" y1="8" x2="8" y2="8"/>',
  },
  vessel: {
    category: 'nautical', label: 'Vessel', meaning: 'Active / in-flight initiative',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -9 4 L 9 4 L 6 10 L -6 10 Z"/><line x1="0" y1="4" x2="0" y2="-9"/><path d="M 0 -9 L 8 4 L 0 4 Z"/>',
  },
  lifeRing: {
    category: 'nautical', label: 'Life Ring', meaning: 'Retention / support',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="11"/><circle r="5"/><line x1="0" y1="-11" x2="0" y2="-5"/><line x1="0" y1="5" x2="0" y2="11"/><line x1="-11" y1="0" x2="-5" y2="0"/><line x1="5" y1="0" x2="11" y2="0"/>',
  },
  dock: {
    category: 'nautical', label: 'Dock / Pier', meaning: 'Integration point',
    stroke: 'var(--sb-navy)',
    paths: '<line x1="-12" y1="8" x2="12" y2="8"/><line x1="-8" y1="8" x2="-8" y2="-9"/><line x1="0" y1="8" x2="0" y2="-9"/><line x1="8" y1="8" x2="8" y2="-9"/>',
  },
  pennant: {
    category: 'nautical', label: 'Pennant Flag', meaning: 'Status callout',
    stroke: 'var(--sb-navy)',
    paths: '<line x1="-9" y1="12" x2="-9" y2="-11"/><path d="M -9 -11 L 8 -6 L -9 -1 Z" fill="var(--sb-teal)" stroke="none"/>',
  },
  currentLines: {
    category: 'nautical', label: 'Current Lines', meaning: 'Data flow connector',
    stroke: 'var(--sb-teal)',
    paths: '<path d="M -13 0 Q -9 -6 -5 0 T 3 0 T 11 0" opacity="0.9"/><path d="M -13 6 Q -9 0 -5 6 T 3 6 T 11 6" opacity="0.5"/>',
  },

  // ── Hot pink — special situations only. Never given a fill background. ──
  starburst: {
    category: 'pink', label: 'Starburst', meaning: 'Featured / spotlight',
    stroke: 'var(--sb-pink-500)',
    paths: '<path d="M 0 -13 L 3 -3 L 13 0 L 3 3 L 0 13 L -3 3 L -13 0 L -3 -3 Z"/>',
  },
  signalFlare: {
    category: 'pink', label: 'Signal Flare', meaning: 'Urgent / time-sensitive',
    stroke: 'var(--sb-pink-500)',
    paths: '<path d="M -3 -12 L 5 -2 L 0 -2 L 3 12 L -6 -1 L -1 -1 Z"/>',
  },
  chartPin: {
    category: 'pink', label: 'Chart Pin', meaning: 'Critical data point',
    stroke: 'var(--sb-pink-500)',
    paths: '<path d="M 0 -12 C 8 -12 11 -2 0 10 C -11 -2 -8 -12 0 -12 Z"/><circle cy="-4" r="3"/>',
  },
  escalationHalo: {
    category: 'pink', label: 'Escalation Halo', meaning: 'Escalated — ring around an existing icon',
    stroke: 'var(--sb-pink-500)',
    paths: '<circle r="9"/><circle r="13" opacity="0.45"/>',
  },

  // ── Metric icons — one per metricCode, permanently ──
  ARR: {
    category: 'metric', label: 'ARR', meaning: 'Annual Recurring Revenue',
    stroke: 'var(--sb-navy)',
    paths: '<line x1="-9" y1="9" x2="-9" y2="1"/><line x1="-3" y1="9" x2="-3" y2="-3"/><line x1="3" y1="9" x2="3" y2="-8"/><line x1="9" y1="9" x2="9" y2="-5"/><path d="M -9 -3 L 9 -10" opacity="0.5"/>',
  },
  EBITDA: {
    category: 'metric', label: 'EBITDA', meaning: 'Core profitability',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M 0 -11 L 9 -6 L 9 5 L 0 11 L -9 5 L -9 -6 Z"/><path d="M -3 0 L -1 3 L 4 -3" stroke-width="1.9"/>',
  },
  GROSS_M: {
    category: 'metric', label: 'Gross Margin', meaning: 'Margin gauge',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="10"/><path d="M 0 -10 A 10 10 0 0 1 8.5 5" stroke="var(--sb-gold)" stroke-width="2.2"/>',
  },
  FCF: {
    category: 'metric', label: 'FCF', meaning: 'Free Cash Flow',
    stroke: 'var(--sb-teal)',
    paths: '<path d="M -11 -2 Q -7 -8 -3 -2 T 5 -2 T 11 -3" transform="translate(0,2)"/><path d="M -11 3 Q -7 -3 -3 3 T 5 3 T 11 2" transform="translate(0,2)" opacity="0.5"/>',
  },
  RUNWAY: {
    category: 'metric', label: 'Runway', meaning: 'Runway / cash horizon',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -9 3 L 9 3 L 6 8 L -6 8 Z"/><line x1="0" y1="3" x2="0" y2="-7"/><path d="M 0 -7 L 6 3 L 0 3 Z"/><line x1="-11" y1="10" x2="11" y2="10" opacity="0.4"/>',
  },
  DSO: {
    category: 'metric', label: 'DSO', meaning: 'Days Sales Outstanding',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="10"/><line x1="0" y1="0" x2="0" y2="-6"/><line x1="0" y1="0" x2="4" y2="2"/>',
  },
  NRR: {
    category: 'metric', label: 'NRR', meaning: 'Net Revenue Retention',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="9"/><circle r="4"/><line x1="0" y1="-9" x2="0" y2="-4"/><line x1="0" y1="4" x2="0" y2="9"/><line x1="-9" y1="0" x2="-4" y2="0"/><line x1="4" y1="0" x2="9" y2="0"/><path d="M 6 -8 L 9 -11" stroke="var(--sb-gold)" stroke-width="2"/>',
  },
  GRR: {
    category: 'metric', label: 'GRR', meaning: 'Gross Revenue Retention',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="9"/><circle r="4"/><line x1="0" y1="-9" x2="0" y2="-4"/><line x1="0" y1="4" x2="0" y2="9"/><line x1="-9" y1="0" x2="-4" y2="0"/><line x1="4" y1="0" x2="9" y2="0"/>',
  },
  EXPANSION_ARR: {
    category: 'metric', label: 'Expansion ARR', meaning: 'Expansion revenue',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -8 4 L 8 4 L 5 8 L -5 8 Z"/><line x1="0" y1="4" x2="0" y2="-8"/><path d="M -4 -4 L 0 -8 L 4 -4" stroke="var(--sb-gold)"/>',
  },
  LOGO_CHURN: {
    category: 'metric', label: 'Logo Churn', meaning: 'Customer churn',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -8 -4 L 4 -4 L 1 0 L -3 0 Z"/><line x1="-2" y1="-4" x2="-2" y2="-13" opacity="0.4"/><path d="M 4 6 L 12 -2" stroke-dasharray="1 3"/>',
  },
  RULE_40: {
    category: 'metric', label: 'Rule of 40', meaning: 'Growth + margin dial',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -10 6 A 10 10 0 0 1 10 6"/><line x1="0" y1="6" x2="3" y2="-3"/><circle cx="0" cy="6" r="1.3" fill="var(--sb-navy)" stroke="none"/>',
  },
  MAGIC_NUM: {
    category: 'metric', label: 'Magic Number', meaning: 'Sales efficiency',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="8"/><path d="M 0 -5 L 1.8 -1.5 L 5.5 -1 L 2.8 1.5 L 3.5 5 L 0 3 L -3.5 5 L -2.8 1.5 L -5.5 -1 L -1.8 -1.5 Z" fill="var(--sb-gold)" stroke="none"/>',
  },
  AUM: {
    category: 'metric', label: 'AUM', meaning: 'Assets Under Management',
    stroke: 'var(--sb-navy)',
    paths: '<circle cx="0" cy="-8" r="3"/><line x1="0" y1="-5" x2="0" y2="7"/><path d="M -8 7 A 8 8 0 0 0 8 7"/><line x1="-9.5" y1="0" x2="9.5" y2="0"/><rect x="-4" y="7" width="8" height="4" rx="1" fill="var(--sb-gold)" stroke="none"/>',
  },
  MOIC: {
    category: 'metric', label: 'MOIC / IRR / TVPI', meaning: 'Fund return multiples',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -8 5 L -1 5 L -1 -6 L 3 -6 L 3 5 L 8 5" opacity="0.35"/><path d="M -8 5 L 8 5 L 5 9 L -5 9 Z"/><line x1="0" y1="5" x2="0" y2="-6"/><path d="M -4 -1 L 0 -6 L 4 -1" stroke="var(--sb-gold)"/>',
  },
  CARRY: {
    category: 'metric', label: 'Carry', meaning: 'Carried interest',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="9"/><path d="M 0 0 L 0 -9 A 9 9 0 0 1 7.8 4.5 Z" fill="var(--sb-gold)" stroke="none"/>',
  },
  PORTCO: {
    category: 'metric', label: 'PortCo', meaning: 'Portfolio companies',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -11 3 L 4 3 L 2 6 L -9 6 Z"/><line x1="-4.5" y1="3" x2="-4.5" y2="-4"/><path d="M -4.5 -4 L 0 0 L -4.5 0 Z"/><path d="M -1 -4 L 9 -4 L 7 -1 L -1 -1 Z" opacity="0.55"/><line x1="5" y1="-4" x2="5" y2="-9"/><path d="M 5 -9 L 8.5 -6 L 5 -6 Z" opacity="0.55"/>',
  },
  SALARY: {
    category: 'metric', label: 'Salary', meaning: 'Base compensation',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="9"/><path d="M -3.5 3 Q -3.5 0 0 0 Q 3.5 0 3.5 -2.5 Q 3.5 -5 0 -5 Q -3.5 -5 -3.5 -7.5 Q -3.5 -10 0 -10" stroke="var(--sb-gold)"/><line x1="0" y1="-10" x2="0" y2="-11.5" opacity="0.4"/><line x1="0" y1="9" x2="0" y2="10.5" opacity="0.4"/>',
  },
  ROLES_HELD: {
    category: 'metric', label: 'Roles Held', meaning: 'Career waypoints',
    stroke: 'var(--sb-navy)',
    paths: '<circle r="9"/><circle cx="0" cy="0" r="3"/><path d="M -8 -4 L -5 -3 M 8 -4 L 5 -3 M -8 4 L -5 3 M 8 4 L 5 3"/>',
  },
  CERTIFICATIONS: {
    category: 'metric', label: 'Certifications', meaning: 'Credentials earned',
    stroke: 'var(--sb-navy)',
    paths: '<path d="M -7 -9 L 7 -9 L 7 6 L 0 10 L -7 6 Z"/><path d="M -3 -1 L -1 1 L 3 -3" stroke="var(--sb-gold)"/>',
  },
};

export function getIconDef(name) {
  return ICON_DEFS[name] || null;
}

export function listIcons(category) {
  return Object.entries(ICON_DEFS)
    .filter(([, def]) => !category || def.category === category)
    .map(([key, def]) => ({ key, ...def }));
}

// <Icon name="anchor" size={24} /> — looks the icon up by key and renders it.
// Unknown names render nothing (fails quiet, not loud — this is decorative).
export default function Icon({ name, size = 24, style, className }) {
  const def = getIconDef(name);
  if (!def) return null;
  return (
    <svg
      viewBox="-16 -16 32 32"
      width={size}
      height={size}
      style={style}
      className={className}
      aria-hidden="true"
    >
      <g
        stroke={def.stroke}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: def.paths }}
      />
    </svg>
  );
}
