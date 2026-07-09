// Salt Basin Net Works — brand icon geometry, single source of truth.
// Shared by src/lib/brandIcons.jsx (React) and scripts/exportBrandIcons.mjs
// (standalone .svg exports for Canva). viewBox is always 0 0 48 48, stroke-based,
// no fills except where noted — outlined/geometric per the Strategic Operator
// icon spec. Salter Momentum variant reuses the same geometry with a sketch filter.
export const ICON_VIEWBOX = '0 0 48 48';

export const ICONS = {
  shield: {
    label: 'Shield — Trust / Validation',
    paths: [
      'M24 5 L40 11 V22 C40 32 33 39 24 43 C15 39 8 32 8 22 V11 Z',
      'M17 23 L22 28 L32 17',
    ],
  },
  graph: {
    label: 'Graph — Revenue Growth / ARR',
    paths: [
      'M7 40 H41',
      'M7 40 V8',
      'M12 34 V26',
      'M20 34 V19',
      'M28 34 V24',
      'M36 34 V13',
      'M12 26 L20 19 L28 24 L36 13',
      'M30 13 H36 V19',
    ],
  },
  exit: {
    label: 'Exit — M&A / Successful Exit',
    paths: [
      'M18 6 H10 C8.9 6 8 6.9 8 8 V40 C8 41.1 8.9 42 10 42 H18',
      'M27 24 H41',
      'M34 17 L41 24 L34 31',
      'M18 6 H27 V42 H18',
    ],
  },
  handshake: {
    label: 'Handshake — Partnership / PE Deal',
    paths: [
      'M4 20 L13 12 L21 18 L18 22 L13 18 L8 23 V30 L4 26 Z',
      'M44 20 L35 12 L27 18 L30 22 L35 18 L40 23 V30 L44 26 Z',
      'M18 22 L22 26 C23.2 27.2 25 27.2 26.2 26 L30 22',
      'M21 25 L25.5 29.5',
    ],
  },
  portfolio: {
    label: 'Portfolio — PE Portfolio / PortOps',
    paths: [
      'M6 20 L24 8 L42 20',
      'M9 20 V40 H39 V20',
      'M16 40 V26 H22 V40',
      'M26 40 V26 H32 V40',
      'M6 40 H42',
    ],
  },
  magnifier: {
    label: 'Magnifier — Diagnostics / Insight',
    paths: [
      'M22 36 A14 14 0 1 1 22 8 A14 14 0 0 1 22 36 Z',
      'M32 32 L43 43',
      'M22 15 V29',
      'M15 22 H29',
    ],
  },
  gear: {
    label: 'Gear — Systems / RevOps',
    paths: [
      'M24 16 A8 8 0 1 1 24 32 A8 8 0 0 1 24 16 Z',
      'M24 4 V10',
      'M24 38 V44',
      'M4 24 H10',
      'M38 24 H44',
      'M9.5 9.5 L13.6 13.6',
      'M34.4 34.4 L38.5 38.5',
      'M9.5 38.5 L13.6 34.4',
      'M34.4 13.6 L38.5 9.5',
    ],
  },
  pipeline: {
    label: 'Pipeline — Automation / Data Flow',
    paths: [
      'M6 14 H18 V24 H30 V14 H42',
      'M6 34 H18 V24',
      'M30 24 V34 H42',
      'M18 24 H30',
    ],
    circles: [
      { cx: 6, cy: 14, r: 3 }, { cx: 6, cy: 34, r: 3 },
      { cx: 42, cy: 14, r: 3 }, { cx: 42, cy: 34, r: 3 },
    ],
  },
  network: {
    label: 'Network — Q2R Architect / Identity Graph',
    paths: [
      'M24 24 L11 13', 'M24 24 L37 13', 'M24 24 L11 35', 'M24 24 L37 35', 'M24 24 V9', 'M24 24 V39',
    ],
    circles: [
      { cx: 24, cy: 24, r: 5 },
      { cx: 11, cy: 13, r: 3 }, { cx: 37, cy: 13, r: 3 },
      { cx: 11, cy: 35, r: 3 }, { cx: 37, cy: 35, r: 3 },
      { cx: 24, cy: 9, r: 3 }, { cx: 24, cy: 39, r: 3 },
    ],
  },
  brain: {
    label: 'Brain — AI-Native Product Studio',
    paths: [
      'M18 8 C11 8 8 13 9 18 C5 20 5 27 9 29 C8 35 13 40 19 39 C21 42 27 42 29 39 C35 40 40 35 39 29 C43 27 43 20 39 18 C40 13 37 8 30 8 C27 8 25 10 24 12 C23 10 21 8 18 8 Z',
      'M24 12 V37',
      'M17 16 C19 17 19 20 17 21',
      'M31 16 C29 17 29 20 31 21',
      'M15 25 H19',
      'M29 25 H33',
    ],
  },
  document: {
    label: 'Document — CLM / CPQ / Contract',
    paths: [
      'M12 4 H30 L38 12 V44 H12 Z',
      'M30 4 V12 H38',
      'M17 22 H33',
      'M17 28 H33',
      'M17 34 H26',
    ],
  },
  layers: {
    label: 'Layers — SAP Integration / Systems Alignment',
    paths: [
      'M24 6 L44 16 L24 26 L4 16 Z',
      'M4 24 L24 34 L44 24',
      'M4 32 L24 42 L44 32',
    ],
  },
  compass: {
    label: 'Compass — Strategic Operator Mark',
    paths: [
      'M24 42 A18 18 0 1 1 24 6 A18 18 0 0 1 24 42 Z',
      'M31 17 L26 26 L17 31 L22 22 Z',
    ],
  },
  star: {
    label: 'Star — Salter Momentum Mark',
    paths: [
      'M24 4 L27.5 18 L42 18 L30.5 27 L34.5 42 L24 33 L13.5 42 L17.5 27 L6 18 L20.5 18 Z',
    ],
  },
  quote: {
    label: 'Quote Mark — Pull-Quote Callout',
    paths: [
      'M8 14 C8 22 8 28 15 32 L15 26 C11 24 11 20 11 14 Z',
      'M25 14 C25 22 25 28 32 32 L32 26 C28 24 28 20 28 14 Z',
    ],
  },
  check: {
    label: 'Status — Complete',
    paths: ['M24 42 A18 18 0 1 1 24 6 A18 18 0 0 1 24 42 Z', 'M15 24 L21 30 L33 17'],
  },
  rocket: {
    label: 'Status — Up Next',
    paths: [
      'M24 5 C31 10 33 20 30 30 L18 30 C15 20 17 10 24 5 Z',
      'M18 30 L12 38 L18 36 Z',
      'M30 30 L36 38 L30 36 Z',
      'M20 43 L24 38 L28 43',
    ],
    circles: [{ cx: 24, cy: 17, r: 3 }],
  },
  clock: {
    label: 'Status — Planned',
    paths: ['M24 42 A18 18 0 1 1 24 6 A18 18 0 0 1 24 42 Z', 'M24 14 V24 L32 29'],
  },
};

export const ICON_NAMES = Object.keys(ICONS);
