// World Variant Engine — Phase 8 slice: Variant Creation Studio, generative seed layer
// (salt-basin-world-variants, 2026-09-06). Betsy asked for "a standalone generator that can
// create new [world] variants through a prompt and different geometric specifications, using
// the same high level quality of visual for pixel and color and graphic" — "like generative
// art... model the seed randomness dimensions" for "the elevated 3d objects."
//
// This file is the DECLARATION layer for that: a GenerativeSeedSpec is a small, bounded set of
// purely AESTHETIC/GEOMETRIC dials (which real atomGeometry.js primitive, how many facets, how
// much rotational scatter, how tight a preview cluster, which brand accent token) driven by a
// deterministic seeded PRNG — same seed always reproduces the same cluster, the one property that
// makes it "generative art" rather than "random every render."
//
// HARD BOUNDARY (do not weaken this file to make a future caller's life easier): nothing in
// GenerativeSeedSpec may ever stand in for a semantic metric. The 11 invariants this build governs
// (Query Relevance/Coverage/Confidence, Convergence Stability, Journey Position, Stage
// Completeness/Readiness, Rod Maturity, Journey Density, Rod Coherence, Cross-Rod Alignment — see
// worldVariantRegistry.js's WORLD_VARIANT_SEMANTIC_INVARIANTS) are computed exactly once from real
// data and handed to whichever variant is active. A generative seed never computes, approximates,
// or substitutes for any of them — it only decides how an object LOOKS within bounds a semantic
// profile (worldVariantComponentProfiles.js) has already set. This file imports exactly one thing
// from the semantic layer — WORLD_VARIANT_SEMANTIC_INVARIANTS's read-only NAME list, below, used
// only to derive the field-name guard in validateGenerativeSeedSpec() — never a metric VALUE, a
// weight, or an encoding mapping. Deriving the guard from that real list (instead of hand-typing a
// parallel word list here) is deliberate: a hand-duplicated list is exactly the "one metric, two
// names" drift this build's own Phase 5 already hit once (QUERY_RELEVANCE_BANDS) and had to fix.
// This file must never import metricDefinitionRegistry.js or worldVariantEncodingProfiles.js
// directly, and must never compute or shape a metric value.
//
// Geometry vocabulary is reused, never forked: every primitiveFamily value here is one of
// atomGeometry.js's real geometryKey strings (getBipyramidParts / getConfiguredAtomParts). Color is
// reused, never forked: every accent token here is one of the brand `--sb-*` CSS custom properties
// SpatialJourneyWorld.jsx's readBrandPalette() already resolves — a spec can pick WHICH brand token
// accents an object, never introduce a new hex outside the theme system (see CLAUDE.md's brand.css
// note: pink/rose is reserved as mark/underline/border only and is deliberately not offered here).

import { WORLD_VARIANT_SEMANTIC_INVARIANTS } from './worldVariantRegistry.js';

export const GENERATIVE_PRIMITIVE_FAMILY = Object.freeze({
  BIPYRAMID: 'bipyramid', // getBipyramidParts — the only family whose facet count (radialSegments) is variable
  OCTAHEDRON: 'octahedron',
  ICOSAHEDRON: 'icosahedron',
  TETRAHEDRON: 'tetrahedron',
  HEX_CRYSTAL: 'hex_crystal',
  PRISM: 'prism',
});

// Brand CSS custom-property names, not raw hex — resolved at render time the same way
// SpatialJourneyWorld.jsx's readBrandPalette() already does, so a Studio-generated cluster always
// re-tints correctly if the active theme changes. Pink is intentionally absent (CLAUDE.md: never a
// fill color, mark/underline/border only, by explicit product decision).
export const GENERATIVE_ACCENT_TOKEN = Object.freeze({
  GOLD: '--sb-gold',
  TEAL: '--sb-teal',
  MAUVE: '--sbh-mauve',
  CHAMPAGNE: '--sb-champagne',
  GREIGE: '--sb-greige',
});

const FACET_RANGE = Object.freeze({ min: 5, max: 14 }); // matches the radial-segment domain getBipyramidParts already renders at
const COUNT_RANGE = Object.freeze({ min: 3, max: 24 });

export const DEFAULT_GENERATIVE_SEED_SPEC = Object.freeze({
  seed: 1,
  primitiveFamily: GENERATIVE_PRIMITIVE_FAMILY.BIPYRAMID,
  facetAmount: 0.5, // 0..1, only meaningful for BIPYRAMID (others have fixed facet counts) — maps into FACET_RANGE
  twist: 0.3, // 0..1, per-instance Y-axis rotation jitter as a fraction of a full turn
  clusterSpread: 0.5, // 0..1, radius of the seeded scatter positions in the preview cluster
  accentToken: GENERATIVE_ACCENT_TOKEN.GOLD,
  clarity: 0.6, // 0..1 — reuses buildAtomMaterial's existing roughness/opacity domain, never a new material system
  count: 9, // how many instances appear in the generative preview cluster
});

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v)));
}

// mulberry32 — small, dependency-free, deterministic: the same 32-bit seed always produces the
// same sequence, which is the entire point of calling this "generative art" rather than "random."
export function createSeededRandom(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function facetCountForAmount(facetAmount) {
  const t = clamp01(facetAmount);
  return Math.round(FACET_RANGE.min + t * (FACET_RANGE.max - FACET_RANGE.min));
}

export function validateGenerativeSeedSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object') return ['GenerativeSeedSpec must be an object.'];
  if (!Number.isFinite(spec.seed)) errors.push('seed must be a finite number.');
  if (!Object.values(GENERATIVE_PRIMITIVE_FAMILY).includes(spec.primitiveFamily)) {
    errors.push(`primitiveFamily '${spec.primitiveFamily}' is not one of atomGeometry.js's real geometry keys.`);
  }
  if (!Object.values(GENERATIVE_ACCENT_TOKEN).includes(spec.accentToken)) {
    errors.push(`accentToken '${spec.accentToken}' is not a real brand --sb-* token.`);
  }
  for (const field of ['facetAmount', 'twist', 'clusterSpread', 'clarity']) {
    const v = spec[field];
    if (!Number.isFinite(v) || v < 0 || v > 1) errors.push(`${field} must be a number between 0 and 1.`);
  }
  if (!Number.isInteger(spec.count) || spec.count < COUNT_RANGE.min || spec.count > COUNT_RANGE.max) {
    errors.push(`count must be an integer between ${COUNT_RANGE.min} and ${COUNT_RANGE.max}.`);
  }
  // Structural guard against the one mistake this file exists to prevent: a caller trying to smuggle
  // a semantic field (relevance/confidence/maturity/stability/...) into what must stay a pure
  // aesthetic spec. GenerativeSeedSpec's own shape has no such field, but a hand-built object could
  // still carry one — reject it outright rather than silently ignoring it. Derived from the real
  // WORLD_VARIANT_SEMANTIC_INVARIANTS list (not a hand-typed word list) so this guard tracks the
  // registry automatically if a 12th invariant is ever added. Matched on whole camelCase WORDS, not
  // a substring — 'facetAmount' must never trip on, say, a future 'FACET_DENSITY'-shaped invariant
  // the way a naive substring check would; only a real whole-word hit counts as a collision.
  for (const key of Object.keys(spec)) {
    const keyWords = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const matchedInvariant = WORLD_VARIANT_SEMANTIC_INVARIANTS.find((invariant) => {
      const invariantWord = invariant.split('_').pop().toLowerCase(); // e.g. QUERY_RELEVANCE -> 'relevance'
      return keyWords.includes(invariantWord);
    });
    if (matchedInvariant) {
      errors.push(`'${key}' collides with the governed semantic invariant ${matchedInvariant} and must never appear on a GenerativeSeedSpec — semantic values are computed once from real data, never from a generative seed.`);
    }
  }
  return errors;
}

// Pure, deterministic: resolveGenerativeCluster(spec) always returns the identical array of
// instance descriptors for the identical spec — no Date.now(), no Math.random(), no mutable
// module-level counters. This is what makes a seed reproducible/shareable ("send me your seed and
// you'll see the same cluster I do"), the defining property of generative art over plain randomness.
export function resolveGenerativeCluster(spec) {
  const errors = validateGenerativeSeedSpec(spec);
  if (errors.length) throw new Error(`Invalid GenerativeSeedSpec: ${errors.join(' ')}`);
  const rand = createSeededRandom(spec.seed);
  const radialSegments = facetCountForAmount(spec.facetAmount);
  const instances = [];
  for (let i = 0; i < spec.count; i += 1) {
    const angle = (i / spec.count) * Math.PI * 2 + rand() * 0.35;
    const radius = 1.4 + rand() * (spec.clusterSpread * 6);
    const height = (rand() - 0.5) * (1 + spec.clusterSpread * 3);
    instances.push({
      index: i,
      geometryKey: spec.primitiveFamily,
      radialSegments,
      position: { x: Math.cos(angle) * radius, y: height, z: Math.sin(angle) * radius },
      rotationY: rand() * Math.PI * 2 * spec.twist,
      scaleJitter: 0.82 + rand() * 0.36,
      // Reuses buildAtomMaterial's existing visual-channel domain (metalness/roughness/opacity),
      // never a new material system — clarity only picks WHERE in that existing domain to sit.
      roughness: 0.15 + (1 - clamp01(spec.clarity)) * 0.55,
      metalness: 0.35 + clamp01(spec.clarity) * 0.35,
      opacity: 0.75 + clamp01(spec.clarity) * 0.22,
    });
  }
  return instances;
}

export function describeGenerativeSeedSpec(spec) {
  const radialSegments = facetCountForAmount(spec.facetAmount);
  return `${spec.count} × ${spec.primitiveFamily} (seed ${spec.seed}) — facetAmount ${spec.facetAmount.toFixed(2)} → ${radialSegments} radial segments (atomGeometry.js's real getBipyramidParts range 5–14), twist ${spec.twist.toFixed(2)}, clusterSpread ${spec.clusterSpread.toFixed(2)}, accent ${spec.accentToken}, clarity ${spec.clarity.toFixed(2)}. Aesthetic only — encodes no semantic metric.`;
}
