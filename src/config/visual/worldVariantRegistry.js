// The World Variant Registry (3D World Variant Engine master prompt §II) — the single source of truth for
// which spatial metaphors exist over the Salt Basin semantic model. Component code resolves a variant once
// via getWorldVariantDefinition(variantKey) and passes the resolved config into generic render systems; it
// must never branch on variant_key inside an unrelated component (`if variant === "crystal"` scattered
// through render code is the exact anti-pattern §II names).
//
// A WorldVariant entry never redefines what a metric means (see metricDefinitionRegistry.js) or how a
// metric maps to a visual channel (see Phase 3's per-variant VisualEncodingProfile — not yet built; this
// registry only carries the *profile ids* a variant composes, not the profiles themselves). The 11
// semantic invariants below (§III) are validated to exist as real entries in METRIC_DEFINITION_REGISTRY,
// not redefined here — see WORLD_VARIANT_SEMANTIC_INVARIANTS and validateSemanticInvariantCoverage().
//
// Distinct from src/config/visual/worldRegistry.js's WORLD_REGISTRY, which is a content-domain switcher
// (Foundation / Channel Rod / Query Channel / Career / Pricing / Infrastructure / Templates — different
// underlying DATA per entry). WorldVariant is a different axis: the SAME data rendered through a different
// spatial metaphor. Whether/how the two registries should eventually compose (`worldId × variantKey`) is an
// open decision recorded in docs/salt-basin-world-variants-progress.md — not resolved here, and this file
// deliberately does not import from or extend worldRegistry.js.
//
// Permanent path color (§XII) is not re-exported through this registry — every variant's Rod/Lineage
// profile (Phase 4) must import resolvePathColor()/PINNED_PATH_COLORS directly from
// src/lib/journeyEngine/pathColor.js, unchanged. Do not build a second color-resolution system per variant.

import { METRIC_DEFINITION_REGISTRY } from '../metrics/metricDefinitionRegistry.js';

export const WORLD_VARIANT_STATUS = Object.freeze({
  PLANNED: 'planned', // slot reserved beyond the master prompt's six named variants; no concept assigned yet
  REGISTERED: 'registered', // declared here; geometry/camera/convergence profiles not yet built (DoD §XIX item 6)
  STRUCTURAL: 'structural', // profiles wired and rendering; not full interaction polish (DoD item 8)
  INTERACTIVE: 'interactive', // fully rendered and interactive (DoD item 7)
});

export const WORLD_VARIANT_FAMILY = Object.freeze({
  CRYSTALLINE: 'crystalline',
  ORBITAL: 'orbital',
  FLUID: 'fluid',
  INFRASTRUCTURE: 'infrastructure',
  GRAPH: 'graph',
  TEMPORAL: 'temporal',
  LATTICE: 'lattice', // intrinsic structural/evidence-maturity nesting is the primary spatial axis, not query relevance
  UNASSIGNED: 'unassigned', // reserved slot, concept not yet chosen
});

// §III's 11 semantic invariants, referenced by their METRIC_DEFINITION_REGISTRY key — not redefined here.
// Note: the master prompt's §III heading is "JOURNEY POSITION"; the shipped Metric Definition Registry
// (built by salt-basin-visual-metrics) calls the same concept ROD_POSITION. Same metric, one naming choice
// already made by that registry — this list uses the shipped key, not a second parallel term.
export const WORLD_VARIANT_SEMANTIC_INVARIANTS = Object.freeze([
  'QUERY_RELEVANCE',
  'QUERY_COVERAGE',
  'QUERY_CONFIDENCE',
  'CONVERGENCE_STABILITY',
  'ROD_POSITION', // spec: "Journey Position"
  'STAGE_COMPLETENESS',
  'STAGE_READINESS',
  'CHANNEL_MATURITY',
  'STATE_CONFIDENCE',
  'JOURNEY_DENSITY',
  'ROD_COHERENCE',
  'CROSS_ROD_ALIGNMENT',
]);

// Confirms every §III invariant this variant engine depends on actually exists in the Metric Definition
// Registry, and that this registry hasn't silently drifted from that one. Run this at Phase 3+ whenever a
// variant's metricEncodings references a key — fail rather than let a profile point at an undefined metric.
export function validateSemanticInvariantCoverage(
  invariants = WORLD_VARIANT_SEMANTIC_INVARIANTS,
  registry = METRIC_DEFINITION_REGISTRY
) {
  const errors = [];
  for (const key of invariants) {
    if (!registry[key]) errors.push(`${key}: no matching entry in METRIC_DEFINITION_REGISTRY`);
  }
  for (const registryKey of Object.keys(registry)) {
    if (!invariants.includes(registryKey)) {
      errors.push(`${registryKey}: present in METRIC_DEFINITION_REGISTRY but not declared as a §III invariant — extend WORLD_VARIANT_SEMANTIC_INVARIANTS or confirm it's rendering-only`);
    }
  }
  return errors;
}

function baseVariantFields(overrides) {
  return {
    visualEncodingProfileId: null, // Phase 3
    geometryProfileId: null, // Phase 4
    environmentProfileId: null, // Phase 4
    cameraProfileId: null, // Phase 4
    interactionProfileId: null, // Phase 4/7
    motionProfileId: null, // Phase 4
    lightingProfileId: null, // Phase 4
    materialProfileId: null, // Phase 4
    labelProfileId: null, // Phase 4
    rodProfileId: null, // Phase 4
    orbitProfileId: null, // Phase 4
    lineageProfileId: null, // Phase 4
    convergenceProfileId: null, // Phase 4
    densityProfileId: null, // Phase 4
    performanceProfileId: null, // Phase 9
    accessibilityProfileId: null, // Phase 8
    status: WORLD_VARIANT_STATUS.REGISTERED,
    createdAt: '2026-07-12',
    updatedAt: '2026-07-12',
    version: 1,
    ...overrides,
  };
}

export const WORLD_VARIANT_REGISTRY = Object.freeze({
  CRYSTAL_BASIN: Object.freeze(baseVariantFields({
    variantId: 'world-variant-crystal-basin',
    variantKey: 'CRYSTAL_BASIN',
    displayName: 'Crystal Basin',
    description: 'A living field of crystalline intelligence structures suspended within a deep dimensional basin — the most direct evolution of the current bipyramid-atom/hex-drum-stage crystal vocabulary already in atomGeometry.js. Query Relevance controls radial distance from the active Orbit in organized dimensional shells (Core / Strongly Related / Contextual / Peripheral), never one dense ball.',
    worldFamily: WORLD_VARIANT_FAMILY.CRYSTALLINE,
    semanticModelVersion: 'query-convergence-v1',
  })),
  ORBITAL_INTELLIGENCE: Object.freeze(baseVariantFields({
    variantId: 'world-variant-orbital-intelligence',
    variantKey: 'ORBITAL_INTELLIGENCE',
    displayName: 'Orbital Intelligence System',
    description: 'A gravitational semantic solar system where the selected Orbit becomes the active contextual gravity body and related intelligence assumes orbit based on relevance. Query Relevance controls orbital shell radius (inner = highest relevance); Convergence Stability controls orbit lock vs. bounded transition between nearby shells.',
    worldFamily: WORLD_VARIANT_FAMILY.ORBITAL,
    semanticModelVersion: 'query-convergence-v1',
  })),
  MONETARY_RIVER_SYSTEM: Object.freeze(baseVariantFields({
    variantId: 'world-variant-monetary-river-system',
    variantKey: 'MONETARY_RIVER_SYSTEM',
    displayName: 'Monetary River System',
    description: 'A dimensional river and highway intelligence environment reflecting the Salt Basin monetary river system metaphor — abstract flow, channels, tributaries, and reservoirs, never a literal landscape. Query Relevance controls the strength/directness of the current path toward the active Orbit\'s Basin; visual flow never implies data is physically transferred or centralized.',
    worldFamily: WORLD_VARIANT_FAMILY.FLUID,
    semanticModelVersion: 'query-convergence-v1',
  })),
  ENTERPRISE_HIGHWAY: Object.freeze(baseVariantFields({
    variantId: 'world-variant-enterprise-highway',
    variantKey: 'ENTERPRISE_HIGHWAY',
    displayName: 'Enterprise Highway Network',
    description: 'A dimensional enterprise routing system — Orbits as major interchanges, Rods as longitudinal routes, branches as exits. Query Relevance determines route proximity/priority; Stage Readiness renders as named, selectable unresolved gates (e.g. "PRICING TERM CONFLICT"), never a red wall with no explanation.',
    worldFamily: WORLD_VARIANT_FAMILY.INFRASTRUCTURE,
    semanticModelVersion: 'rod-mathematics-v1',
  })),
  NEURAL_CONSTELLATION: Object.freeze(baseVariantFields({
    variantId: 'world-variant-neural-constellation',
    variantKey: 'NEURAL_CONSTELLATION',
    displayName: 'Neural Crystal Constellation',
    description: 'A spatial intelligence network combining crystalline atoms with graph-like semantic relationships — the strongest variant for lineage, contribution intelligence, and evidence exploration. Query Relevance controls graph attraction strength toward the active semantic anchor using a constrained force layout that preserves molecule/lineage topology; never a radial cluster that destroys real relationships.',
    worldFamily: WORLD_VARIANT_FAMILY.GRAPH,
    semanticModelVersion: 'query-convergence-v1',
  })),
  TEMPORAL_CANYON: Object.freeze(baseVariantFields({
    variantId: 'world-variant-temporal-canyon',
    variantKey: 'TEMPORAL_CANYON',
    displayName: 'Temporal Journey Canyon',
    description: 'A longitudinal dimensional environment where time and journey progression are the primary spatial axis — the most direct evolution of the existing non-parallel, gate-driven layout.js rod system. Rod Position controls longitudinal location (never conflated with Rod Maturity); Stage Completeness renders as internal stage lattice/illuminated requirements, not a literal percentage of canyon wall built.',
    worldFamily: WORLD_VARIANT_FAMILY.TEMPORAL,
    semanticModelVersion: 'rod-mathematics-v1',
  })),
  // 7th variant — beyond the master prompt's six named variants (§V). Concept supplied by Betsy 2026-07-12:
  // "Crystal Atom / Molecule / Cluster evidence maturity." Unlike the other six, its primary spatial axis is
  // NOT query relevance/convergence — it's intrinsic structural maturity, inspectable with no active query
  // context at all. Distinct organizing principle from Crystal Basin (same crystal geometry vocabulary,
  // different axis) — passes the §XVIII "materially different spatial model" bar, not a reskin.
  MATURITY_LATTICE: Object.freeze(baseVariantFields({
    variantId: 'world-variant-maturity-lattice',
    variantKey: 'MATURITY_LATTICE',
    displayName: 'Crystal Lattice Observatory',
    description: 'A navigable crystal-growth hierarchy — Atoms as base crystal units nesting into Cluster crystal formations, nesting into Molecule composite structures — where CHANNEL_MATURITY\'s per-purpose scores (legal, participation coverage, billing readiness, rev-rec readiness, renewal stability, expected realization) drive structural complexity, facet depth, and internal lattice at every level. Because maturity is purpose-scoped rather than a single composite, this variant renders a SET of readings per node, not one: the same crystal can be fully formed along its legal axis while visibly unfinished along billing readiness. STATE_CONFIDENCE is the separate axis and should read as internal lattice clarity/fracture — how much the node can be trusted, distinct from how mature it is, and distinct again from cross-Rod Coherence. No active query context required: this variant inspects how mature and how trustworthy the metadata itself is, independent of relevance to any selected Orbit. Extends the same atomGeometry.js crystal vocabulary and computeAtomVisual() maturity-to-rendering mapping Crystal Basin uses (§XII, do not fork a second crystal system) — the difference is the spatial organizing principle (hierarchical nesting by maturity depth, not radial distance from a query anchor), not the geometry language.',
    worldFamily: WORLD_VARIANT_FAMILY.LATTICE,
    semanticModelVersion: 'rod-mathematics-v2',
    status: WORLD_VARIANT_STATUS.REGISTERED,
  })),
});

export function getWorldVariantDefinition(variantKey) {
  return WORLD_VARIANT_REGISTRY[variantKey] || null;
}

export function listWorldVariants() {
  return Object.values(WORLD_VARIANT_REGISTRY);
}

export function listWorldVariantsByStatus(status) {
  return listWorldVariants().filter((variant) => variant.status === status);
}

// Fails registration if a variant key/id is malformed or duplicated, or its status isn't one of the four
// declared stages (planned/registered/structural/interactive) — the §VII "development validation" bar this
// registry itself must pass before any Phase 3+ profile is allowed to reference a variant.
export function validateWorldVariantRegistry(registry = WORLD_VARIANT_REGISTRY) {
  const errors = [];
  const seenIds = new Set();
  for (const [key, variant] of Object.entries(registry)) {
    if (variant.variantKey !== key) errors.push(`${key}: variantKey field (${variant.variantKey}) does not match registry key`);
    if (seenIds.has(variant.variantId)) errors.push(`${key}: duplicate variantId ${variant.variantId}`);
    seenIds.add(variant.variantId);
    if (!Object.values(WORLD_VARIANT_STATUS).includes(variant.status)) errors.push(`${key}: invalid status "${variant.status}"`);
    if (!variant.worldFamily) errors.push(`${key}: missing worldFamily`);
  }
  return errors;
}
