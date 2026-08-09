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

  // ── Nautical / River System set — Salt Basin Buoys concept ──
  hourglass: {
    label: 'Hourglass — Salt Basin Buoys Mark',
    paths: [
      'M12 6 H36', 'M12 42 H36',
      'M14 6 L24 24 L14 42', 'M34 6 L24 24 L34 42',
    ],
    circles: [{ cx: 24, cy: 24, r: 1.4 }],
  },
  buoy: {
    label: 'Buoy — Channel Marker Float',
    paths: [
      'M18 44 H30',
      'M18 44 C18 30 18 20 24 8 C30 20 30 30 30 44 Z',
      'M17 26 H31',
      'M17 34 H31',
    ],
    circles: [{ cx: 24, cy: 6, r: 2 }],
  },
  anchor: {
    label: 'Anchor — Stability / Commitment',
    paths: [
      'M24 12 V38', 'M18 16 H30',
      'M12 26 C12 34 18 40 24 40 C30 40 36 34 36 26',
      'M12 26 L16 22', 'M36 26 L32 22',
    ],
    circles: [{ cx: 24, cy: 8, r: 4 }],
  },
  boat: {
    label: 'Boat — Journey Vessel',
    paths: ['M8 30 H40 L34 40 H14 Z', 'M24 30 V10', 'M24 12 L36 26 L24 26 Z'],
  },
  lifeboat: {
    label: 'Lifeboat — Rescue / Support',
    paths: ['M8 32 H40 L34 42 H14 Z', 'M24 8 V24', 'M16 16 H32'],
    circles: [{ cx: 24, cy: 16, r: 8 }, { cx: 24, cy: 16, r: 4 }],
  },
  channelMarkerRed: {
    label: 'Red Channel Marker — Odd / Return Boundary',
    paths: ['M24 20 V44', 'M24 4 L34 20 H14 Z'],
  },
  channelMarkerGreen: {
    label: 'Green Channel Marker — Even / Outbound Boundary',
    paths: ['M24 20 V44', 'M14 4 H34 V20 H14 Z'],
  },
  jetSki: {
    label: 'Jet Ski — Fast Track / Quick Action',
    paths: [
      'M6 30 C6 22 14 16 24 16 C34 16 42 22 42 30 C42 34 38 36 34 36 H14 C10 36 6 34 6 30 Z',
      'M30 16 V8', 'M26 8 H34', 'M18 22 H30',
    ],
  },
  island: {
    label: 'Island — Destination / Milestone',
    paths: [
      'M4 38 H44',
      'M8 34 C8 26 16 22 24 22 C32 22 40 26 40 34 Z',
      'M24 22 V12',
      'M24 12 L14 8', 'M24 12 L34 8', 'M24 12 L18 4', 'M24 12 L30 4',
    ],
  },
  sailboat: {
    label: 'Sailboat — Guided Journey',
    paths: [
      'M10 34 H38 L32 42 H16 Z', 'M24 34 V6',
      'M24 8 L36 30 L24 30 Z', 'M24 14 L14 30 L24 30 Z',
    ],
  },
  tugBoat: {
    label: 'Tug Boat — Escort / Enablement',
    paths: ['M6 30 H42 L36 40 H12 Z', 'M16 30 V18 H30 V30', 'M28 18 V10'],
    circles: [{ cx: 20, cy: 23, r: 2 }],
  },
  shippingContainer: {
    label: 'Shipping Container — Delivered Output',
    paths: [
      'M8 14 H40 V36 H8 Z', 'M8 14 L12 10 H44 L40 14',
      'M14 14 V36', 'M20 14 V36', 'M26 14 V36', 'M32 14 V36',
    ],
  },
  coralReef: {
    label: 'Coral Reef — Ecosystem / Accumulated Evidence',
    paths: [
      'M4 42 H44',
      'M10 42 V30 C10 26 6 24 6 18', 'M10 30 C10 26 14 24 14 18',
      'M22 42 V26 C22 20 28 18 28 12', 'M22 30 C22 26 18 24 18 20',
      'M34 42 V28 C34 24 38 22 38 16',
    ],
  },
  mineralGold: {
    label: 'Gold Mineral — High-Value Signal',
    paths: [
      'M14 20 L20 10 L30 12 L38 20 L36 32 L26 40 L16 36 L10 28 Z',
      'M20 10 L24 24 L30 12', 'M10 28 L24 24 L16 36', 'M38 20 L24 24 L36 32',
    ],
  },
  mineralIron: {
    label: 'Iron Mineral — Structural / Foundational Signal',
    paths: [
      'M10 30 L16 14 L28 10 L38 18 L36 34 L22 40 L10 30 Z',
      'M16 14 L22 26', 'M28 10 L22 26', 'M38 18 L22 26', 'M22 40 L22 26',
    ],
  },
  crystalOrbit: {
    label: 'Crystal with Orbit Rings — Convergence Core',
    paths: [
      'M24 6 L34 18 V28 L24 42 L14 28 V18 Z',
      'M14 18 L24 24 L34 18', 'M24 24 V42',
      'M4 24 A20 7 0 1 0 44 24 A20 7 0 1 0 4 24',
      'M34 41.3 A20 7 60 1 1 14 6.7 A20 7 60 1 1 34 41.3',
    ],
  },
  chatBubbles: {
    label: 'Chat Bubbles — Comment / Interaction',
    paths: [
      'M6 8 H28 V22 H14 L8 28 V22 H6 Z',
      'M20 16 H42 V30 H30 L36 36 V30 H20 Z',
    ],
  },
  weatherSun: {
    label: 'Weather — Sun (Emotional Weather: Clear)',
    paths: [
      'M24 4 V10', 'M24 38 V44', 'M4 24 H10', 'M38 24 H44',
      'M10.5 10.5 L14.6 14.6', 'M33.4 33.4 L37.5 37.5',
      'M10.5 37.5 L14.6 33.4', 'M33.4 14.6 L37.5 10.5',
    ],
    circles: [{ cx: 24, cy: 24, r: 8 }],
  },
  weatherCloud: {
    label: 'Weather — Cloud (Emotional Weather: Overcast)',
    paths: [
      'M14 32 C8 32 4 28 4 23 C4 18 8 15 13 15 C15 9 21 5 27 7 C33 9 36 15 34 20 C40 21 44 25 44 30 C44 34 40 37 35 37 H14 Z',
    ],
  },
  weatherRain: {
    label: 'Weather — Rain (Emotional Weather: Strained)',
    paths: [
      'M12 24 C7 24 4 21 4 17 C4 13 8 10 12 10 C14 6 19 4 24 6 C29 8 31 13 29 17 C34 17 38 20 38 24 C38 27 35 29 31 29 H12 Z',
      'M14 34 L12 40', 'M22 34 L20 40', 'M30 34 L28 40',
    ],
  },
  weatherStorm: {
    label: 'Weather — Storm (Emotional Weather: Crisis)',
    paths: [
      'M12 22 C7 22 4 19 4 15 C4 11 8 8 12 8 C14 4 19 2 24 4 C29 6 31 11 29 15 C34 15 38 18 38 22 C38 25 35 27 31 27 H12 Z',
      'M24 28 L18 38 H24 L20 44 L32 32 H26 Z',
    ],
  },
  brainFog: {
    label: 'Brain Fog — Cognitive Load Signal',
    paths: [
      'M16 10 C10 10 7 15 8 20 C4 22 4 28 8 30 C7 35 11 39 17 38 C19 41 24 41 26 38 C32 39 36 35 35 30 C39 28 39 22 35 20 C36 15 33 10 27 10 C24 10 22 12 21 14 C20 12 18 10 16 10 Z',
      'M2 20 H12', 'M36 20 H46', 'M0 27 H10', 'M38 27 H48',
    ],
  },
  queensCrown: {
    label: "Queen's Crown — Elevated / Executive Signal",
    paths: [
      'M8 34 H40 V40 H8 Z',
      'M8 34 L14 18 L20 28 L24 14 L28 28 L34 18 L40 34',
    ],
    circles: [{ cx: 14, cy: 22, r: 1.5 }, { cx: 24, cy: 20, r: 1.5 }, { cx: 34, cy: 22, r: 1.5 }],
  },
};

export const ICON_NAMES = Object.keys(ICONS);
