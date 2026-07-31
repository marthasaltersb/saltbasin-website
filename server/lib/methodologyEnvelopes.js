// Registers the P0 weighted-composite registries as Config Envelopes (see
// configEnvelope.js) — the pilot slice for making "everything editable
// without an engineer" real, per Betsy's direction 2026-07-12. Each
// validator enforces the same invariant tests/rodMathematics.test.js and
// tests/queryConvergence.test.js already check at dev time — now enforced on
// every actual write, not just in CI.
//
// Importing from src/ here mirrors the existing precedent in
// server/lib/careerBondingEngine.js (imports tagOverlapRatio from
// src/lib/journeyEngine/bonding.js) — server code reusing src/'s plain JS
// config/logic rather than duplicating it.
//
// Import this module once for its registration side effects (see
// server/routes/configEnvelopes.js).

import { defineConfigEnvelope } from './configEnvelope.js';
import { ROD_MATHEMATICS_METHODOLOGY } from '../../src/config/metrics/rodMathematicsMethodology.js';
import { QUERY_CONVERGENCE_METHODOLOGY } from '../../src/config/metrics/queryConvergenceMethodology.js';
import { MATURITY_MODEL } from '../../src/config/metrics/maturityModel.js';
import { SCENARIO_LIBRARY, validateScenarioLibraryShape } from '../data/scenarioLibrary.js';
import { DEFAULT_ATOM_WEIGHTS } from '../../src/scenarios/scenarioRegistry.js';

const SUM_TOLERANCE = 1e-9;

function validateWeightGroup(weights, path) {
  if (!weights || typeof weights !== 'object') return [`${path}: missing or not an object`];
  const errors = [];
  for (const [key, value] of Object.entries(weights)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) errors.push(`${path}.${key}: must be a non-negative number, got ${JSON.stringify(value)}`);
  }
  if (errors.length) return errors;
  const sum = Object.values(weights).reduce((total, value) => total + value, 0);
  if (Math.abs(sum - 1) > SUM_TOLERANCE) errors.push(`${path}: weights sum to ${sum}, must sum to 1`);
  return errors;
}

function nonNegativeNumbers(weights, path) {
  if (!weights || typeof weights !== 'object') return [`${path}: missing or not an object`];
  const errors = [];
  for (const [key, value] of Object.entries(weights)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) errors.push(`${path}.${key}: must be a non-negative number, got ${JSON.stringify(value)}`);
  }
  return errors;
}

const NETWORK_SCOPES = ['self', 'related'];

// Validates the purpose-scoped Channel Maturity block. Every purpose is scored
// independently, so there is no sum-to-1 constraint; what does have to hold is
// that dependsOn references resolve and contain no cycle — calculateChannelMaturity
// caps each purpose by its dependencies, and a cycle there would make the cap
// order meaningless.
function validateMaturityPurposes(block, path) {
  if (!block || typeof block !== 'object') return [`${path}: missing or not an object`];
  if (!Array.isArray(block.purposes) || !block.purposes.length) return [`${path}.purposes: must be a non-empty array`];
  const errors = [];
  const keys = new Set();

  block.purposes.forEach((purpose, i) => {
    const at = `${path}.purposes[${i}]`;
    if (!purpose || typeof purpose !== 'object') { errors.push(`${at}: not an object`); return; }
    if (typeof purpose.key !== 'string' || !purpose.key.trim()) errors.push(`${at}.key: must be a non-empty string`);
    else if (keys.has(purpose.key)) errors.push(`${at}.key: duplicate "${purpose.key}"`);
    else keys.add(purpose.key);
    if (typeof purpose.label !== 'string' || !purpose.label.trim()) errors.push(`${at}.label: must be a non-empty string`);
    if (purpose.networkScope !== undefined && !NETWORK_SCOPES.includes(purpose.networkScope)) errors.push(`${at}.networkScope: must be one of ${NETWORK_SCOPES.join(', ')}`);
    for (const key of ['requiresClusters', 'requiresMolecules', 'dependsOn']) {
      if (purpose[key] !== undefined && !Array.isArray(purpose[key])) errors.push(`${at}.${key}: must be an array`);
    }
  });
  if (errors.length) return errors;

  for (const purpose of block.purposes) {
    for (const dependency of purpose.dependsOn || []) {
      if (!keys.has(dependency)) errors.push(`${path}: purpose "${purpose.key}" dependsOn "${dependency}", which is not a declared purpose`);
    }
  }

  // Cycle detection over dependsOn.
  const graph = new Map(block.purposes.map((p) => [p.key, p.dependsOn || []]));
  const state = new Map();
  const walk = (key, trail) => {
    if (state.get(key) === 'done') return;
    if (state.get(key) === 'open') { errors.push(`${path}: dependency cycle ${[...trail, key].join(' -> ')}`); return; }
    state.set(key, 'open');
    for (const next of graph.get(key) || []) if (graph.has(next)) walk(next, [...trail, key]);
    state.set(key, 'done');
  };
  for (const key of graph.keys()) walk(key, []);

  const cap = block.dependencyCapFactor;
  if (cap !== undefined && (typeof cap !== 'number' || !Number.isFinite(cap) || cap < 0)) errors.push(`${path}.dependencyCapFactor: must be a non-negative number`);
  return errors;
}

export const ROD_MATHEMATICS_ENVELOPE = defineConfigEnvelope({
  id: 'rod-mathematics-methodology',
  label: 'Rod Mathematics Methodology',
  description: 'Weight and purpose configuration for Stage Completeness, Stage Readiness, Channel Maturity (purpose-scoped), State Confidence, Atom Density, and Rod Coherence.',
  defaultValue: ROD_MATHEMATICS_METHODOLOGY,
  validate(value) {
    if (!value || typeof value !== 'object') return ['value must be an object'];
    return [
      ...validateWeightGroup(value.stageCompleteness?.bucketWeights, 'stageCompleteness.bucketWeights'),
      ...validateWeightGroup(value.stageReadiness?.weights, 'stageReadiness.weights'),
      // channelMaturity purposes are INDEPENDENT scores, not a partition of 1 —
      // deliberately not run through validateWeightGroup. Summing them would
      // reintroduce the single composite the Maturity principle rejects.
      ...validateMaturityPurposes(value.channelMaturity, 'channelMaturity'),
      // MVP_20B_Confidence_Rules — six components summing to 1.
      ...validateWeightGroup(value.stateConfidence?.weights, 'stateConfidence.weights'),
      ...validateWeightGroup(value.atomDensity?.weights, 'atomDensity.weights'),
      ...validateWeightGroup(value.coherence?.weights, 'coherence.weights'),
    ];
  },
});

export const QUERY_CONVERGENCE_ENVELOPE = defineConfigEnvelope({
  id: 'query-convergence-methodology',
  label: 'Query Convergence Methodology',
  description: 'Weight configuration for Query Relevance, Query Confidence, and Convergence Stability, plus their display bands.',
  defaultValue: QUERY_CONVERGENCE_METHODOLOGY,
  validate(value) {
    if (!value || typeof value !== 'object') return ['value must be an object'];
    return [
      ...validateWeightGroup(value.relevance?.weights, 'relevance.weights'),
      ...validateWeightGroup(value.confidence?.weights, 'confidence.weights'),
      ...validateWeightGroup(value.stability?.riskWeights, 'stability.riskWeights'),
      // coverage.tierWeights (required/conditional/optional) are independent
      // multipliers, not a partition of 1 — required: 1, conditional: 0.65,
      // optional: 0 by design. Do not force a sum-to-1 constraint on it.
    ];
  },
});

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const VALID_TONES = ['ok', 'mid', 'risk'];

// Bands must be ascending, contiguous, and cover the whole 0..1 range —
// otherwise a real score can land in no band at all and the renderer silently
// falls back to the last one, which is how a "Trusted" label ends up on an
// unresolved atom.
function validateBands(bands, path) {
  if (!Array.isArray(bands) || !bands.length) return [`${path}: must be a non-empty array`];
  const errors = [];
  bands.forEach((band, i) => {
    if (!band || typeof band !== 'object') { errors.push(`${path}[${i}]: not an object`); return; }
    for (const key of ['min', 'max']) {
      const v = band[key];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) errors.push(`${path}[${i}].${key}: must be a number in 0..1, got ${JSON.stringify(v)}`);
    }
    if (typeof band.min === 'number' && typeof band.max === 'number' && band.min >= band.max) errors.push(`${path}[${i}]: min (${band.min}) must be less than max (${band.max})`);
    if (typeof band.label !== 'string' || !band.label.trim()) errors.push(`${path}[${i}].label: must be a non-empty string`);
    if (typeof band.color !== 'string' || !HEX_COLOR.test(band.color)) errors.push(`${path}[${i}].color: must be a #rrggbb hex string, got ${JSON.stringify(band.color)}`);
    if (band.tone !== undefined && !VALID_TONES.includes(band.tone)) errors.push(`${path}[${i}].tone: must be one of ${VALID_TONES.join(', ')}`);
  });
  if (errors.length) return errors;
  if (bands[0].min !== 0) errors.push(`${path}: first band must start at 0, got ${bands[0].min}`);
  if (bands[bands.length - 1].max !== 1) errors.push(`${path}: last band must end at 1, got ${bands[bands.length - 1].max}`);
  for (let i = 1; i < bands.length; i += 1) {
    if (bands[i].min !== bands[i - 1].max) errors.push(`${path}: band ${i} starts at ${bands[i].min} but band ${i - 1} ends at ${bands[i - 1].max} — bands must be contiguous with no gap or overlap`);
  }
  return errors;
}

function validateChannelRange(channel, path) {
  if (!channel || typeof channel !== 'object') return [`${path}: missing or not an object`];
  const errors = [];
  for (const key of ['min', 'max']) {
    const v = channel[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) errors.push(`${path}.${key}: must be a finite number, got ${JSON.stringify(v)}`);
  }
  return errors;
}

function validateUnitPair(pair, path) {
  if (!pair || typeof pair !== 'object') return [`${path}: missing or not an object`];
  const errors = [];
  for (const key of ['atLow', 'atHigh']) {
    const v = pair[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) errors.push(`${path}.${key}: must be a finite number, got ${JSON.stringify(v)}`);
  }
  return errors;
}

export const MATURITY_MODEL_ENVELOPE = defineConfigEnvelope({
  id: 'maturity-model',
  label: 'Maturity Model',
  description: 'The 5 maturity bands (Unresolved → Trusted) with their labels, colors and badge tones, the default stage-gate atom threshold, and how maturity scales an atom crystal\'s facet count, metalness and roughness. Drives the Spatial Journey World demo live.',
  publicRead: true,
  defaultValue: MATURITY_MODEL,
  validate(value) {
    if (!value || typeof value !== 'object') return ['value must be an object'];
    const errors = [...validateBands(value.bands, 'bands')];
    const threshold = value.gates?.defaultAtomThreshold;
    if (typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
      errors.push(`gates.defaultAtomThreshold: must be a number in 0..1, got ${JSON.stringify(threshold)}`);
    }
    if (!value.atomVisual || typeof value.atomVisual !== 'object') {
      errors.push('atomVisual: missing or not an object');
    } else {
      // Channels transcribed from Visual_Channels carry {min,max}; metalness is
      // still an {atLow,atHigh} pair because no VIS row governs it yet.
      errors.push(...validateChannelRange(value.atomVisual.facet, 'atomVisual.facet'));
      errors.push(...validateChannelRange(value.atomVisual.transmission, 'atomVisual.transmission'));
      errors.push(...validateChannelRange(value.atomVisual.roughness, 'atomVisual.roughness'));
      errors.push(...validateUnitPair(value.atomVisual.metalness, 'atomVisual.metalness'));
      const facet = value.atomVisual.facet;
      if (facet && [facet.min, facet.max].every((v) => typeof v === 'number' && Number.isFinite(v))) {
        if (facet.min < 3 || facet.max < 3) errors.push('atomVisual.facet: radial segment counts below 3 cannot form a crystal');
      }
    }
    return errors;
  },
});

// Editing this envelope only changes the *definition*. Nothing reaches the
// evaluation engine until the library is applied into journey_scenarios /
// journey_gate_definitions — see server/lib/scenarioLibraryApply.js and
// POST /api/journey/scenario-library/apply. That separation is deliberate: a
// half-edited scenario should not silently start gating live rods mid-save.
export const SCENARIO_LIBRARY_ENVELOPE = defineConfigEnvelope({
  id: 'scenario-library',
  label: 'Scenario Library',
  description: 'Scenario and stage-gate definitions for the Channel Journey evaluation engine. Edit here, then apply to write them into journey_scenarios and journey_gate_definitions. References to clusters, atoms and stages are re-checked against the live vocabulary at apply time.',
  defaultValue: SCENARIO_LIBRARY,
  validate: validateScenarioLibraryShape,
});

export const SCENARIO_ATOM_WEIGHTS_ENVELOPE = defineConfigEnvelope({
  id: 'scenario-atom-weights',
  label: 'Scenario Atom Match Weights',
  description: 'Per-atom-path importance weights used when matching a query against the scenario library. Not required to sum to 1 — each is an independent importance multiplier, not a composite fraction.',
  defaultValue: DEFAULT_ATOM_WEIGHTS,
  validate(value) {
    return nonNegativeNumbers(value, 'weights');
  },
});
