// THE canonical Maturity Model — one definition, used by every maturity layer.
//
// Rebuilt 2026-07-29 against Betsy's source workbooks rather than inference:
//   Salt_Basin_Thesis_Evidence_Chain_Examples.xlsx  -> Maturity_Signals, Evidence_Chain
//   Salt_Basin_LoneTree_MVP_Executable_Repository_v1.0.xlsx -> MVP_20_Maturity_Rules
//   Salt_Basin_Workbook_001A_Enterprise_Foundation_v4.xlsx  -> Visual_Channels
//   Salt_Basin_Value_Driver_Tributary_Orbit.html            -> weakest-signal rule, 7-stage chain
//
// Design decision (Betsy, 2026-07-29): "I want all maturity to be the most
// robust definition that is defined and extend it across the three maturity
// layers or make it generic to be called."
//
// So there is ONE dimension set and ONE math engine. The three layers that
// previously wanted three different models — journey/deal maturity, evidence
// maturity, purpose maturity — are now just PROFILES over the same engine
// (MATURITY_PROFILES below). Adding a fourth layer is a config entry, not code.
//
// The robust core is the 7 signal categories at Level 0-5, transcribed verbatim
// from the Maturity_Signals sheet. They are ordinal levels, not a 0-1 float:
// "Reconciled" is a defined state with a definition, not 0.6.

// ── Level scale (Maturity_Signals column headers) ───────────────────────────
export const MATURITY_LEVELS = Object.freeze([
  Object.freeze({ level: 0, key: 'asserted', label: 'Asserted' }),
  Object.freeze({ level: 1, key: 'defined', label: 'Defined' }),
  Object.freeze({ level: 2, key: 'reproducible', label: 'Reproducible' }),
  Object.freeze({ level: 3, key: 'reconciled', label: 'Reconciled' }),
  Object.freeze({ level: 4, key: 'explainable', label: 'Explainable' }),
  Object.freeze({ level: 5, key: 'outcome_validated', label: 'Outcome Validated' }),
]);

export const MAX_MATURITY_LEVEL = 5;

// ── The 7 signal dimensions ─────────────────────────────────────────────────
// `descriptors` are indexed by level 0-5. `volatilityEvent` / `chainImpact`
// record how this signal REGRESSES — maturity is not monotonic, and an
// acquisition or a billing redesign can pull a chain backward. Nothing consumes
// the regression fields yet; they are carried so the model can express it.
export const MATURITY_SIGNALS = Object.freeze([
  Object.freeze({
    key: 'definition_quality', label: 'Definition Quality',
    descriptors: Object.freeze(['Ad hoc', 'Documented', 'Versioned with clear intent', 'Consistent across domains', 'Aligned to outcomes', 'Continuously validated']),
    volatilityEvent: 'Leadership turnover',
    chainImpact: 'Definitions and priorities change; historical intent can be lost.',
  }),
  Object.freeze({
    key: 'data_lineage', label: 'Data Lineage',
    descriptors: Object.freeze(['Unknown', 'Partial', 'End-to-end identified', 'Tested and documented', 'Explains movements', 'Proves outcomes']),
    volatilityEvent: 'System change',
    chainImpact: 'Old-to-new hierarchy mapping and lineage can break.',
  }),
  Object.freeze({
    key: 'reconciliation', label: 'Reconciliation',
    descriptors: Object.freeze(['None', 'Manual one-way', 'Reconciled to source', 'Cross-system tested', 'Breaks root-caused', 'Continuous monitoring']),
    volatilityEvent: 'Billing redesign',
    chainImpact: 'Contract, usage, invoice and revenue logic can change.',
  }),
  Object.freeze({
    key: 'business_event_linkage', label: 'Business Event Linkage',
    descriptors: Object.freeze(['None', 'Assumed', 'Events mapped', 'Events drive measures', 'Events explain variance', 'Events prove drivers']),
    volatilityEvent: 'Add-on acquisition',
    chainImpact: 'New products, customers and systems create inconsistent identifiers.',
  }),
  Object.freeze({
    key: 'data_quality', label: 'Data Quality',
    descriptors: Object.freeze(['Unknown', 'Low visibility', 'Issues tracked', 'Rules / thresholds', 'Fit for key metrics', 'Trusted for exit']),
    volatilityEvent: 'Manual data erosion',
    chainImpact: 'Missing and inconsistent entries lower confidence.',
  }),
  Object.freeze({
    key: 'ownership_governance', label: 'Ownership & Governance',
    descriptors: Object.freeze(['No owner', 'Owner named', 'Accountable owner', 'Cadence governed', 'Change control', 'Sustained improvement']),
    volatilityEvent: 'Resource constraints',
    chainImpact: 'Documentation and controls weaken.',
  }),
  Object.freeze({
    key: 'temporal_coverage', label: 'Temporal Coverage',
    descriptors: Object.freeze(['Point in time', 'Incomplete history', 'History captured', 'Consistent updates', 'Full context for change', 'Supports backtest']),
    volatilityEvent: 'Time pressure / exit',
    chainImpact: 'Evidence assembled reactively instead of maintained.',
  }),
]);

// ── Aggregation strategies ──────────────────────────────────────────────────
// Named here rather than hardcoded in the engine so a profile can choose, and
// so the trade-off between them is documented in one place.
export const AGGREGATION = Object.freeze({
  // Σ w·x. Rewards breadth. Used by MVP_20_Maturity_Rules. Its weakness is that
  // strong scores elsewhere can mask a single fatal gap.
  WEIGHTED_SUM: 'weighted_sum',
  // min(x). The value-driver tree's rule: "weakest-signal maturity across
  // definition, lineage, quality and governance". Honest about the weak link,
  // but gives no credit at all for everything else being strong.
  WEAKEST_LINK: 'weakest_link',
  // Σ w·x, then capped at the weakest dimension's ceiling. The default, and the
  // most defensible of the three: breadth still earns score, but no amount of
  // breadth can carry a chain past its weakest link. This is what makes the
  // number survive a buyer sampling the worst link in diligence.
  WEIGHTED_CAPPED_BY_WEAKEST: 'weighted_capped_by_weakest',
});

// ── Profiles — the three layers, same engine ────────────────────────────────
// A profile says: which dimensions, how to weight them, how to aggregate, and
// what blocks. Everything else is the engine.
export const MATURITY_PROFILES = Object.freeze({
  // Layer 1 — evidence maturity. All 7 signals, equally weighted, capped by the
  // weakest. This is the richest and most defensible reading.
  evidence: Object.freeze({
    key: 'evidence',
    label: 'Evidence Maturity',
    definition: 'How defensible the evidence chain under a claim is, scored across all seven signal categories.',
    dimensions: Object.freeze(MATURITY_SIGNALS.map((s) => s.key)),
    weights: null, // equal weighting
    aggregation: AGGREGATION.WEIGHTED_CAPPED_BY_WEAKEST,
    blocking: null,
  }),

  // Layer 2 — journey/deal maturity. MVP_20_Maturity_Rules verbatim: four
  // components, weights summing to 1, plus MAT-003's explicit block.
  journey: Object.freeze({
    key: 'journey',
    label: 'Journey Maturity',
    definition: 'How far a deal or journey has progressed toward close, weighted across stage completion, evidence coverage, reconciliation and approval.',
    dimensions: Object.freeze(['stage_completion', 'evidence_coverage', 'reconciliation_completeness', 'approval_completeness']),
    weights: Object.freeze({ stage_completion: 0.4, evidence_coverage: 0.25, reconciliation_completeness: 0.2, approval_completeness: 0.15 }),
    aggregation: AGGREGATION.WEIGHTED_CAPPED_BY_WEAKEST,
    // MAT-003: "Blocks converged state below 0.8."
    blocking: Object.freeze({ dimension: 'reconciliation_completeness', minimum: 0.8, blocks: 'converged_state', message: 'Reconciliation completeness below 0.8 blocks converged state (MAT-003).' }),
  }),

  // Layer 3 — purpose maturity. Same engine, scoped per purpose, with the
  // dependency capping the Maturity principle requires (billing readiness can
  // never exceed legal maturity). Purposes live in rodMathematicsMethodology.js
  // because they are commercial, not evidential.
  purpose: Object.freeze({
    key: 'purpose',
    label: 'Purpose Maturity',
    definition: 'How mature a Channel Rod is for one specific purpose — legal, billing readiness, rev-rec readiness and so on. Never collapsed into a single figure.',
    dimensions: Object.freeze(['stage_completion', 'evidence_coverage', 'reconciliation_completeness', 'approval_completeness']),
    weights: Object.freeze({ stage_completion: 0.4, evidence_coverage: 0.25, reconciliation_completeness: 0.2, approval_completeness: 0.15 }),
    aggregation: AGGREGATION.WEIGHTED_CAPPED_BY_WEAKEST,
    blocking: null,
  }),
});

// ── Evidence chain — 7 stages ───────────────────────────────────────────────
// The Evidence_Chain sheet carries 9 stages; the value-driver tree's rail
// carries 7. Reconciled to 7 per Betsy 2026-07-29 ("just update the evidence
// chain to match the 7 stages"): "Explanation" folds into Attribution, and
// Outcome merges with Exit Defense. Kept as flat config precisely because she
// expects to redefine it — changing this list should never require touching the
// engine.
export const EVIDENCE_CHAIN_STAGES = Object.freeze([
  Object.freeze({ order: 1, key: 'thesis', label: 'Thesis', question: 'What did we believe?', weakLinkSignal: 'Thesis only in narrative' }),
  Object.freeze({ order: 2, key: 'definition', label: 'Definition', question: 'What exactly counts?', weakLinkSignal: 'Definition drifts between versions' }),
  Object.freeze({ order: 3, key: 'measurement', label: 'Measurement', question: 'How is it calculated?', weakLinkSignal: 'Formula not governed' }),
  Object.freeze({ order: 4, key: 'source_events', label: 'Source Events', question: 'What actually changed?', weakLinkSignal: 'No amendment lineage' }),
  Object.freeze({ order: 5, key: 'reconciliation', label: 'Reconciliation', question: 'Does it tie out?', weakLinkSignal: 'Manual unexplained breaks' }),
  // Absorbs the 9-stage sheet's separate "Explanation" stage: explaining what
  // moved and attributing why it moved are one accountability in the 7-stage
  // model.
  Object.freeze({ order: 6, key: 'attribution', label: 'Attribution', question: 'What moved, and why?', weakLinkSignal: 'Correlation treated as causation' }),
  Object.freeze({ order: 7, key: 'outcome_exit_defense', label: 'Outcome / Exit Defense', question: 'What was the financial impact, and can a buyer reproduce it?', weakLinkSignal: 'Weeks of reconstruction' }),
]);

// ── Display bands ───────────────────────────────────────────────────────────
// Bands describe how to LABEL and RENDER a single normalized 0-1 maturity
// value, whichever profile produced it. Boundaries are the Level 0-5 scale at
// 1/5 intervals, so a band edge always coincides with a level edge — a score
// reading "Reconciled" is exactly level 3.
export const MATURITY_MODEL = Object.freeze({
  modelId: 'maturity-model-v2',
  effectiveFrom: '2026-07-29',
  levels: MATURITY_LEVELS,
  signals: MATURITY_SIGNALS,
  profiles: MATURITY_PROFILES,
  evidenceChain: EVIDENCE_CHAIN_STAGES,

  bands: Object.freeze([
    Object.freeze({ min: 0, max: 0.2, level: 0, label: 'Asserted', color: '#3D4452', tone: 'risk' }),
    Object.freeze({ min: 0.2, max: 0.4, level: 1, label: 'Defined', color: '#345A68', tone: 'risk' }),
    Object.freeze({ min: 0.4, max: 0.6, level: 2, label: 'Reproducible', color: '#4A7C8E', tone: 'mid' }),
    Object.freeze({ min: 0.6, max: 0.8, level: 3, label: 'Reconciled', color: '#7FA6A8', tone: 'mid' }),
    Object.freeze({ min: 0.8, max: 0.95, level: 4, label: 'Explainable', color: '#dca64c', tone: 'ok' }),
    Object.freeze({ min: 0.95, max: 1, level: 5, label: 'Outcome Validated', color: '#f3d98a', tone: 'ok' }),
  ]),

  gates: Object.freeze({ defaultAtomThreshold: 0.75 }),

  // How maturity changes STRUCTURE. Transcribed from Visual_Channels VIS-004:
  // Validation Maturity, input 0-5, target geometry.facetComplexity, curve
  // step, min 4, max 24, transition 1.2s. The previous 5->11 linear ramp on a
  // 0-1 input was mine and was wrong on range, curve and domain.
  atomVisual: Object.freeze({
    facet: Object.freeze({ sourceMetric: 'Validation Maturity', inputRange: [0, MAX_MATURITY_LEVEL], curve: 'step', min: 4, max: 24, transitionSeconds: 1.2 }),
    // VIS-002: Confidence -> material.transmission, linear 0.1 -> 0.92.
    transmission: Object.freeze({ sourceMetric: 'Confidence', curve: 'linear', min: 0.1, max: 0.92, transitionSeconds: 0.8 }),
    // VIS-007: Stale Evidence -> material.roughness, logistic 0.2 -> 0.9.
    roughness: Object.freeze({ sourceMetric: 'Stale Evidence', curve: 'logistic', min: 0.2, max: 0.9, transitionSeconds: 1.0 }),
    // VIS-008: Source Disagreement -> effect.fractureIntensity, linear 0 -> 1.
    fracture: Object.freeze({ sourceMetric: 'Source Disagreement', curve: 'linear', min: 0, max: 1, transitionSeconds: 0.6 }),
    metalness: Object.freeze({ atLow: 0.18, atHigh: 0.62 }),
  }),
});

export function maturityToneFor(score, bands = MATURITY_MODEL.bands) {
  // Half-open [min, max) — see maturityBandFor. Kept consistent here so the
  // badge tone and the band label can never disagree at a boundary.
  const clamped = Math.max(0, Math.min(1, Number(score) || 0));
  const last = bands[bands.length - 1];
  const band = bands.find((b) => clamped >= b.min && (clamped < b.max || (b === last && clamped <= b.max))) || last;
  return band?.tone || 'mid';
}

// Normalized 0-1 <-> ordinal Level 0-5. A band edge is a level edge, so these
// round-trip cleanly.
export function levelForScore(score, maxLevel = MAX_MATURITY_LEVEL) {
  return Math.round(Math.max(0, Math.min(1, Number(score) || 0)) * maxLevel);
}
export function scoreForLevel(level, maxLevel = MAX_MATURITY_LEVEL) {
  return Math.max(0, Math.min(maxLevel, Number(level) || 0)) / maxLevel;
}
