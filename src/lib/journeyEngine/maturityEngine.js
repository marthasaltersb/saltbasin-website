// The single maturity engine. Every maturity layer calls this one function.
//
// Betsy, 2026-07-29: "I want all maturity to be the most robust definition that
// is defined and extend it across the three maturity layers or make it generic
// to be called ... I do want the robust dimensions and math calculations that
// produce the most mathematically robust maturity score."
//
// So the layer differences (evidence / journey / purpose) live entirely in the
// profile passed in — see MATURITY_PROFILES. There is no per-layer branch in
// this file, and adding a fourth layer requires no change here.
//
// Why WEIGHTED_CAPPED_BY_WEAKEST is the default and the most defensible:
//
//   A pure weighted sum lets six strong dimensions hide one fatal gap — a chain
//   with no lineage at all still scores 0.85 and reads "Explainable", which is
//   exactly the claim that collapses when a buyer samples the worst link.
//   A pure minimum is honest but useless for prioritisation: everything with one
//   weak signal scores identically, so nothing can be ranked or improved
//   visibly.
//   Capping the weighted sum at the weakest dimension's value keeps both
//   properties — breadth still earns score and moves the number, but no amount
//   of breadth can carry a claim past its weakest link. The reported result
//   always names which dimension imposed the cap, so the score is actionable
//   rather than merely low.

import {
  MATURITY_MODEL, MATURITY_SIGNALS, MAX_MATURITY_LEVEL, AGGREGATION,
  levelForScore, scoreForLevel,
} from '../../config/metrics/maturityModel.js';
import { maturityBandFor } from '../maturityScoring.js';

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
const SIGNAL_BY_KEY = new Map(MATURITY_SIGNALS.map((s) => [s.key, s]));

function bandFor(score, model) {
  return maturityBandFor(clamp01(score), model.bands);
}

// Resolves one dimension to a normalized 0-1 value. `levels` are ordinal 0-5,
// `scores` are already 0-1. Supplying both for the same dimension is a caller
// bug, so the ordinal wins and it is reported rather than silently averaged.
function resolveDimension(key, { levels = {}, scores = {} }, maxLevel) {
  if (Object.prototype.hasOwnProperty.call(levels, key)) {
    const level = Math.max(0, Math.min(maxLevel, Number(levels[key]) || 0));
    return { score: scoreForLevel(level, maxLevel), level, source: 'level' };
  }
  const score = clamp01(scores[key]);
  return { score, level: levelForScore(score, maxLevel), source: 'score' };
}

/**
 * computeMaturity(input, profile, options)
 *
 * input   { levels?: {dimKey: 0..5}, scores?: {dimKey: 0..1} }
 * profile one of MATURITY_PROFILES (or any object of the same shape)
 * options { model, maxLevel }
 *
 * Returns a fully explainable result — never a bare number.
 */
export function computeMaturity(input = {}, profile = MATURITY_MODEL.profiles.evidence, { model = MATURITY_MODEL, maxLevel = MAX_MATURITY_LEVEL } = {}) {
  if (!profile || !Array.isArray(profile.dimensions) || !profile.dimensions.length) {
    throw new Error('computeMaturity requires a profile with a non-empty dimensions array');
  }

  const weights = profile.weights || null;
  const totalWeight = weights ? Object.values(weights).reduce((a, b) => a + b, 0) : profile.dimensions.length;

  const dimensions = {};
  let weightedSum = 0;
  let weakest = null;

  for (const key of profile.dimensions) {
    const resolved = resolveDimension(key, input, maxLevel);
    const weight = weights ? (weights[key] ?? 0) : 1;
    weightedSum += resolved.score * weight;

    const signal = SIGNAL_BY_KEY.get(key);
    dimensions[key] = {
      score: resolved.score,
      level: resolved.level,
      weight: totalWeight ? weight / totalWeight : 0,
      label: signal?.label || key,
      // The level's own words, so a UI can say "Reconciled to source" rather
      // than "0.4".
      descriptor: signal ? signal.descriptors[resolved.level] : null,
      volatilityEvent: signal?.volatilityEvent || null,
      isWeakest: false,
    };

    if (!weakest || resolved.score < weakest.score) weakest = { key, score: resolved.score, level: resolved.level, label: dimensions[key].label };
  }
  if (weakest) dimensions[weakest.key].isWeakest = true;

  const normalizedSum = totalWeight ? weightedSum / totalWeight : 0;

  let score;
  let cappedBy = null;
  switch (profile.aggregation) {
    case AGGREGATION.WEAKEST_LINK:
      score = weakest ? weakest.score : 0;
      break;
    case AGGREGATION.WEIGHTED_SUM:
      score = normalizedSum;
      break;
    case AGGREGATION.WEIGHTED_CAPPED_BY_WEAKEST:
    default:
      score = Math.min(normalizedSum, weakest ? weakest.score : 0);
      if (weakest && normalizedSum > weakest.score) cappedBy = weakest.key;
      break;
  }
  score = clamp01(score);

  // Blocking is reported, never silently applied to the score — a blocked state
  // is a governance fact about what the score may be used FOR, not a different
  // number. MAT-003 blocks converged state; it does not lower maturity.
  let blocked = null;
  if (profile.blocking) {
    const actual = dimensions[profile.blocking.dimension]?.score ?? 0;
    if (actual < profile.blocking.minimum) blocked = { ...profile.blocking, actual };
  }

  const band = bandFor(score, model);
  return {
    profileKey: profile.key,
    label: profile.label,
    aggregation: profile.aggregation || AGGREGATION.WEIGHTED_CAPPED_BY_WEAKEST,
    score,
    level: levelForScore(score, maxLevel),
    band,
    weightedSum: normalizedSum,
    weakestLink: weakest,
    cappedBy,
    blocked,
    dimensions,
  };
}

// Applies a volatility event: regresses every signal it touches by `levels`.
// Maturity is not monotonic — an acquisition or billing redesign pulls the
// chain backward, which the Maturity_Signals sheet documents per signal.
export function applyVolatility(levels = {}, volatilityEvent, { levelsLost = 1, maxLevel = MAX_MATURITY_LEVEL } = {}) {
  const affected = MATURITY_SIGNALS.filter((s) => s.volatilityEvent === volatilityEvent);
  if (!affected.length) return { levels: { ...levels }, affected: [] };
  const next = { ...levels };
  for (const signal of affected) {
    const current = Math.max(0, Math.min(maxLevel, Number(next[signal.key]) || 0));
    next[signal.key] = Math.max(0, current - levelsLost);
  }
  return { levels: next, affected: affected.map((s) => ({ key: s.key, label: s.label, chainImpact: s.chainImpact })) };
}

// Structure from score, per Visual_Channels VIS-004: input is the ORDINAL level
// (0-5), curve is `step`, output is a discrete facet count between min and max.
// Stepping on the level rather than interpolating on the float is the point —
// a crystal gains facets when it crosses into a new maturity level, so the
// structure reads as a state change rather than a continuous drift.
export function facetCountForMaturity(scoreOrLevel, { model = MATURITY_MODEL, maxLevel = MAX_MATURITY_LEVEL, isLevel = false } = {}) {
  const facet = model.atomVisual.facet;
  const level = isLevel ? Math.max(0, Math.min(maxLevel, Math.round(Number(scoreOrLevel) || 0))) : levelForScore(scoreOrLevel, maxLevel);
  const steps = maxLevel === 0 ? 0 : level / maxLevel;
  return Math.round(facet.min + (facet.max - facet.min) * steps);
}
