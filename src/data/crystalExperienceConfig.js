import { MATURITY_MODEL } from '../config/metrics/maturityModel.js';

// Config contract for every CrystalMovementSystems scene. Product/member/client
// surfaces can override any branch without forking the renderer. Every tunable
// number that shapes the rendered experience — camera, movement, lighting,
// layout, and the field weights that drive computed maturity — lives here so
// none of it is a magic number buried in a component.
export const DEFAULT_CRYSTAL_EXPERIENCE = {
  id: 'salt-basin-office',
  theme: {
    void: '#030b0e', fog: '#07181e', floor: '#102c35',
    teal: '#71b8c0', tealDeep: '#4a7c8e', gold: '#c4843a',
    goldLight: '#f3d98a', cream: '#f1ebdd', rose: '#d98ca0', plum: '#785d69',
  },
  camera: { fov: 58, start: [0, 2.8, 20], endZ: 12, target: [0, 2.2, -13], enterSeconds: 1.65 },
  // Click-to-walk player movement — see CrystalOfficeScene.jsx.
  movement: {
    eyeHeight: 2.3,
    walkSpeed: 9.5, // world units / second
    arriveThreshold: 0.35,
    stopDistance: 3.4, // how far in front of a destination the player stops
    bobAmplitude: 0.06,
    bobSpeed: 9,
    lookEase: 0.12,
  },
  atmosphere: { fogDensity: .022, starCount: 180, dustCount: 90, shellRadius: 29, shellOpacity: .12 },
  lighting: { hemisphere: .75, entry: 2.4, city: 2, pulse: .35 },
  layout: { minBuildings: 6, maxBuildings: 14, laneSpacing: 6.5, roadWidth: 3.8, roadLength: 64 },
  motion: { shellRotation: .012, markerFlowSpeed: 2.2 },
  // The 5-band model is no longer defined here — it is the canonical
  // MATURITY_MODEL.bands (src/config/metrics/maturityModel.js), which is also
  // what the runtime-editable `maturity-model` Config Envelope serves. Kept as
  // this key so every existing `config.maturity` reader and any
  // mergeCrystalExperience({ maturity }) override keeps working unchanged.
  maturity: MATURITY_MODEL.bands,
  // Data-density scoring — how the system computes a real 0-1 maturity value
  // instead of a hand-picked number. fieldWeights says how much each captured
  // field counts toward "complete"; dimensionFieldMap groups those same
  // fields into the six HOS metadata dimensions shown in the New World
  // reveal, so each dimension's color/height is scored from the actual
  // content captured for that destination, not a placeholder. See
  // src/lib/maturityScoring.js for the calculation.
  dataDensity: {
    fieldWeights: {
      heading: 3, label: 3, title: 3, eyebrow: 1.5,
      intro: 2, lede: 2, description: 2,
      detail: 1.5, body: 1.5,
      cta1Label: 1.5, cta2Label: 1, href: 0.5,
      variant: 0.5, type: 0.5,
      chips: 1, tags: 1, highlights: 1, metrics: 1, stats: 1,
    },
    dimensionFieldMap: {
      identity: ['heading', 'label', 'title', 'eyebrow'],
      intent: ['intro', 'lede', 'description'],
      evidence: ['chips', 'tags', 'highlights', 'metrics', 'stats'],
      definition: ['detail', 'body', 'description'],
      lineage: ['variant', 'type', 'href'],
      outcome: ['cta1Label', 'cta2Label'],
    },
  },
  journeyRods: [
    { id: 'customer', label: 'Customer', color: '#71b8c0' },
    { id: 'revenue', label: 'Revenue', color: '#c4843a' },
    { id: 'product', label: 'Product', color: '#d98ca0' },
    { id: 'service', label: 'Service', color: '#785d69' },
  ],
};

export function mergeCrystalExperience(overrides = {}) {
  return {
    ...DEFAULT_CRYSTAL_EXPERIENCE,
    ...overrides,
    theme: { ...DEFAULT_CRYSTAL_EXPERIENCE.theme, ...(overrides.theme || {}) },
    camera: { ...DEFAULT_CRYSTAL_EXPERIENCE.camera, ...(overrides.camera || {}) },
    movement: { ...DEFAULT_CRYSTAL_EXPERIENCE.movement, ...(overrides.movement || {}) },
    atmosphere: { ...DEFAULT_CRYSTAL_EXPERIENCE.atmosphere, ...(overrides.atmosphere || {}) },
    lighting: { ...DEFAULT_CRYSTAL_EXPERIENCE.lighting, ...(overrides.lighting || {}) },
    layout: { ...DEFAULT_CRYSTAL_EXPERIENCE.layout, ...(overrides.layout || {}) },
    motion: { ...DEFAULT_CRYSTAL_EXPERIENCE.motion, ...(overrides.motion || {}) },
    dataDensity: {
      ...DEFAULT_CRYSTAL_EXPERIENCE.dataDensity,
      ...(overrides.dataDensity || {}),
      fieldWeights: { ...DEFAULT_CRYSTAL_EXPERIENCE.dataDensity.fieldWeights, ...(overrides.dataDensity?.fieldWeights || {}) },
      dimensionFieldMap: { ...DEFAULT_CRYSTAL_EXPERIENCE.dataDensity.dimensionFieldMap, ...(overrides.dataDensity?.dimensionFieldMap || {}) },
    },
  };
}
