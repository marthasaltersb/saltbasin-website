// World Variant Engine Phase 3 (master-build-prompt.md §IV, §VII) — the per-variant
// VisualEncodingProfile layer and the typed WorldVariantConfig schema/validators.
//
// This is the metric-KEYED layer visualSemanticRegistry.js doesn't have: that registry maps
// object TYPE (evidence_atom, atom_cluster, ...) to geometry/material/color rules with a plain-
// language `meaning`; this file maps SEMANTIC METRIC (QUERY_RELEVANCE, CHANNEL_MATURITY, ...) to
// exactly one primary visual channel, per variant. Extends both registries — replaces neither.
//
// Phase 4 (Variant Component Profiles) is where these channel descriptions become real Three.js
// builders. Where a real calculation/renderer already exists (resolveQueryDistance for Crystal
// Basin's radial distance, computeAtomVisual's facet complexity for maturity), this file's entry
// says so explicitly via `implementedBy` rather than re-describing rendering math that already
// lives elsewhere — Phase 3's job is the DECLARATION and its VALIDATION, not a second math layer.
//
// Every metricKey referenced below must exist in METRIC_DEFINITION_REGISTRY (validated) and must
// never redefine what that metric means — only which visual channel represents it, in this one
// variant. The same metric may (and does) map to a different channel in a different variant; see
// §VIII's worked example (Query Relevance = radial distance in Crystal Basin, orbital shell in
// Orbital Intelligence, channel strength in Monetary River, ...) — that's the entire point of the
// variant engine, not an inconsistency to reconcile.

import { METRIC_DEFINITION_REGISTRY } from '../metrics/metricDefinitionRegistry.js';
import { WORLD_VARIANT_REGISTRY } from './worldVariantRegistry.js';
import { QUERY_CONVERGENCE_METHODOLOGY } from '../metrics/queryConvergenceMethodology.js';

// §IV's visual channel vocabulary, one enum so a profile can't invent an ad hoc channel name that
// silently drifts from another variant's spelling of the same concept.
export const VISUAL_CHANNEL = Object.freeze({
  RADIAL_DISTANCE: 'radial_distance',
  ORBITAL_RADIUS: 'orbital_radius',
  VERTICAL_ELEVATION: 'vertical_elevation',
  DEPTH: 'depth',
  SPATIAL_PROXIMITY: 'spatial_proximity',
  CRYSTAL_SCALE: 'crystal_scale',
  CRYSTAL_COMPLEXITY: 'crystal_complexity',
  CRYSTAL_CLARITY: 'crystal_clarity', // refraction/diffuseness treatment — deliberately NOT flat opacity, see §V Variant 1 "do not use simple opacity if it makes the object unreadable"
  OPACITY: 'opacity',
  PATH_THICKNESS: 'path_thickness',
  PATH_CONTINUITY: 'path_continuity', // solid (observed/validated) vs dashed/segmented (inferred)
  PARTICLE_DENSITY: 'particle_density',
  PULSE_FREQUENCY: 'pulse_frequency',
  BOUNDED_MOVEMENT: 'bounded_movement', // low-stability jitter within a bounded range
  SETTLEMENT_STATE: 'settlement_state', // high-stability anchoring, the counterpart to BOUNDED_MOVEMENT
  ROTATION_SPEED: 'rotation_speed',
  SHELL_LAYER: 'shell_layer', // discrete banded shell, not continuous distance
  CORRIDOR_WIDTH: 'corridor_width',
  TERRAIN_ELEVATION: 'terrain_elevation',
  FLUID_FLOW_VELOCITY: 'fluid_flow_velocity',
  BRANCH_ANGLE: 'branch_angle',
  ROD_SEGMENT_FILL: 'rod_segment_fill',
  GEOMETRY_SUBDIVISION: 'geometry_subdivision',
  ROUTE_PRIORITY: 'route_priority',
  GATE_VISIBILITY: 'gate_visibility', // named, selectable unresolved-gate labels, never a red wall
  EDGE_CERTAINTY_BAND: 'edge_certainty_band',
  GRAPH_ATTRACTION: 'graph_attraction',
  ILLUMINATION_INTENSITY: 'illumination_intensity',
  NESTING_DEPTH: 'nesting_depth',
});

// §III curve vocabulary — kept small and named, not a free-text field, so Phase 4 builders can
// switch on it rather than parse an arbitrary formula string.
export const CURVE_TYPE = Object.freeze({
  LINEAR: 'linear',
  NONLINEAR_INVERSE: 'nonlinear_inverse', // e.g. resolveQueryDistance's (1 - relevance)^curveFactor
  STEP: 'step', // discrete bands, e.g. facetCountForMaturity's ordinal-level stepping
  THRESHOLD: 'threshold',
});

function encoding({
  metricKey, visualChannel, curveType, minVisualValue, maxVisualValue,
  thresholdBands = null, animationBehavior, labelBehavior, interactionBehavior,
  explanationText, implementedBy = null,
}) {
  return {
    metricKey, visualChannel, curveType, minVisualValue, maxVisualValue,
    thresholdBands, animationBehavior, labelBehavior, interactionBehavior,
    explanationText, implementedBy,
  };
}

// Semantic bands every relevance-driven variant reuses for its shell/band language (§III, §V
// Variant 1's CORE/STRONGLY RELATED/CONTEXTUAL/PERIPHERAL). Re-exported from
// QUERY_CONVERGENCE_METHODOLOGY.relevance.bands (queryConvergenceMethodology.js) rather than
// redeclared here — that registry is the one already-live source `calculateQueryRelevance()`
// itself bands against (journeyEngine/queryConvergence.js's `bandFor()`), so every atom's `.band`
// already matches this list by construction. A second, differently-cased copy would be exactly the
// "one metric, two names" drift salt-basin-config-audit exists to catch.
export const QUERY_RELEVANCE_BANDS = QUERY_CONVERGENCE_METHODOLOGY.relevance.bands;

// -----------------------------------------------------------------------------------------------
// Per-variant Visual Encoding Profiles. Each profile is a short list — §IV: "one visual channel
// should represent one primary semantic concept within a variant" — not every one of the 12
// invariants forced into every variant. Which metrics appear per variant follows the master
// prompt's own §V per-variant sections and §XVI's cross-variant Customer Orbit reference, not
// invented groupings.
// -----------------------------------------------------------------------------------------------

const CRYSTAL_BASIN_PROFILE = Object.freeze({
  variantKey: 'CRYSTAL_BASIN',
  requiresQueryContext: true,
  encodings: Object.freeze([
    encoding({
      metricKey: 'QUERY_RELEVANCE', visualChannel: VISUAL_CHANNEL.RADIAL_DISTANCE,
      curveType: CURVE_TYPE.NONLINEAR_INVERSE, minVisualValue: 0.8, maxVisualValue: 6,
      thresholdBands: QUERY_RELEVANCE_BANDS,
      animationBehavior: 'lerp to target radius over the existing converging/hashConverging state machine',
      labelBehavior: 'shell band label (Core/Strongly Related/Contextual/Peripheral) shown on selection',
      interactionBehavior: 'click an atom to open its relevance component breakdown',
      explanationText: 'Discrete shell radius from the selected Orbit, grouped by Query Relevance band — closer shells mean more directly relevant, and atoms within a shell fan out evenly so a band reads as an organized ring, not one dense ball.',
      implementedBy: 'shellRadiusForBand() in this file, called from runCustomerOrbit() in SpatialJourneyWorld.jsx (Phase 5, 2026-07-30) — supersedes the earlier continuous resolveQueryDistance()-only placement, which remains available in metricVisualEncodingRegistry.js for variants that want a continuous gradient instead of discrete shells',
    }),
    encoding({
      metricKey: 'QUERY_CONFIDENCE', visualChannel: VISUAL_CHANNEL.CRYSTAL_CLARITY,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'material clearcoat/roughness shift, not opacity — low confidence should look diffuse/refracted, not merely faint',
      labelBehavior: 'confidence score + band shown in the Inspector, not as a floating world-space label',
      interactionBehavior: 'none (passive read)',
      explanationText: 'Crystal clarity — a clear crystalline surface means strong, well-corroborated evidence; a diffuse, refracted internal structure means the system trusts the view less.',
      implementedBy: null, // Phase 4/5: not yet a distinct material channel from opacity in computeAtomVisual()
    }),
    encoding({
      metricKey: 'CONVERGENCE_STABILITY', visualChannel: VISUAL_CHANNEL.BOUNDED_MOVEMENT,
      curveType: CURVE_TYPE.THRESHOLD, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'low stability: subtle bounded internal oscillation; high stability: settles into a visually anchored structure',
      labelBehavior: 'none — motion itself is the signal, per §VI "motion should communicate state, not decorate"',
      interactionBehavior: 'none (passive read)',
      explanationText: 'Bounded motion means this element may still reorganize as pending evidence resolves; a settled, anchored crystal means the view is unlikely to change.',
      implementedBy: null, // Phase 4: no stability-driven motion in the current animate() loop yet
    }),
    encoding({
      metricKey: 'CHANNEL_MATURITY', visualChannel: VISUAL_CHANNEL.CRYSTAL_COMPLEXITY,
      curveType: CURVE_TYPE.STEP, minVisualValue: 4, maxVisualValue: 24,
      animationBehavior: 'geometry swap (not scale) when maturity crosses an ordinal level — a crystal visibly gains structure, it does not grow bigger',
      labelBehavior: 'purpose-named maturity breakdown in the Inspector (legal/billing/rev-rec/...), never a single collapsed number',
      interactionBehavior: 'click to open the per-purpose maturity breakdown',
      explanationText: 'Facet complexity — a low-maturity atom renders as a simple low-poly crystal; a high-maturity one as a refined, many-faceted crystal. Because maturity is purpose-scoped, complexity reflects whichever purpose is in focus.',
      implementedBy: 'facetCountForMaturity() in journeyEngine/maturityEngine.js, consumed by computeAtomVisual() in journeyEngine/maturity.js',
    }),
  ]),
});

const ORBITAL_INTELLIGENCE_PROFILE = Object.freeze({
  variantKey: 'ORBITAL_INTELLIGENCE',
  requiresQueryContext: true,
  encodings: Object.freeze([
    encoding({
      metricKey: 'QUERY_RELEVANCE', visualChannel: VISUAL_CHANNEL.SHELL_LAYER,
      curveType: CURVE_TYPE.STEP, minVisualValue: 0, maxVisualValue: 4,
      thresholdBands: QUERY_RELEVANCE_BANDS,
      animationBehavior: 'stable orbital shell transition, never continuous high-speed spin — the environment must remain readable',
      labelBehavior: 'shell band label on selection',
      interactionBehavior: 'click a body to open its relevance breakdown',
      explanationText: 'Orbital shell — highest relevance sits in the innermost shell around the active Orbit; lowest relevance sits in the outermost shell.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'QUERY_COVERAGE', visualChannel: VISUAL_CHANNEL.SPATIAL_PROXIMITY,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'unresolved required dimensions render as clearly marked empty orbital sectors',
      labelBehavior: 'coverage % in the context summary panel',
      interactionBehavior: 'click an empty sector to see which required dimension is missing',
      explanationText: 'An empty orbital sector means a required context dimension has no representation yet — not that data is missing everywhere.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'QUERY_CONFIDENCE', visualChannel: VISUAL_CHANNEL.EDGE_CERTAINTY_BAND,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'high confidence: stable, precise orbital path; low confidence: a broader uncertainty band around the path',
      labelBehavior: 'confidence score in the Inspector',
      interactionBehavior: 'none (passive read)',
      explanationText: 'Orbital path precision — a tight, precise path is high-confidence; a wide uncertainty band is low-confidence.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'CONVERGENCE_STABILITY', visualChannel: VISUAL_CHANNEL.SETTLEMENT_STATE,
      curveType: CURVE_TYPE.THRESHOLD, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'low stability: body may transition between nearby allowable shells; high stability: orbit locks',
      labelBehavior: 'none — motion is the signal',
      interactionBehavior: 'none (passive read)',
      explanationText: 'Orbit lock means the current shell placement is stable; bounded shell-hopping means it may still move as evidence resolves.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'CROSS_ROD_ALIGNMENT', visualChannel: VISUAL_CHANNEL.BRANCH_ANGLE,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'aligned relationship bridges connect compatible state positions across the three parallel arcs; misalignment appears as angular tension, never a flat red flag',
      labelBehavior: 'ALIGNED / exception label with the specific mismatch',
      interactionBehavior: 'click a bridge to see the mismatch narrative',
      explanationText: 'Cross-Rod Alignment renders as bridge geometry between Revenue, Customer, and Member arcs — tension, not automatically an error.',
      implementedBy: null,
    }),
  ]),
});

const MONETARY_RIVER_PROFILE = Object.freeze({
  variantKey: 'MONETARY_RIVER_SYSTEM',
  requiresQueryContext: true,
  encodings: Object.freeze([
    encoding({
      metricKey: 'QUERY_RELEVANCE', visualChannel: VISUAL_CHANNEL.FLUID_FLOW_VELOCITY,
      curveType: CURVE_TYPE.NONLINEAR_INVERSE, minVisualValue: 0, maxVisualValue: 1,
      thresholdBands: QUERY_RELEVANCE_BANDS,
      animationBehavior: 'highly relevant elements get a direct, strong channel; contextual elements a secondary tributary; peripheral elements a distant, low-flow path',
      labelBehavior: 'shell band label on selection',
      interactionBehavior: 'click a channel to open its relevance breakdown',
      explanationText: 'Channel strength toward the active Basin — this is semantic visualization; flow never implies data is physically transferred or centralized.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'QUERY_CONFIDENCE', visualChannel: VISUAL_CHANNEL.PATH_CONTINUITY,
      curveType: CURVE_TYPE.THRESHOLD, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'high confidence: a well-defined channel boundary; low confidence: a diffuse or branching uncertainty current',
      labelBehavior: 'confidence score in the Inspector',
      interactionBehavior: 'none (passive read)',
      explanationText: 'Channel definition — a crisp boundary is high-confidence; a diffuse, branching current is low-confidence.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'CONVERGENCE_STABILITY', visualChannel: VISUAL_CHANNEL.BOUNDED_MOVEMENT,
      curveType: CURVE_TYPE.THRESHOLD, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'low stability: channel path remains adaptive; high stability: channel becomes a clearly established route',
      labelBehavior: 'none — motion is the signal',
      interactionBehavior: 'none (passive read)',
      explanationText: 'An adaptive, still-shifting channel means the route may still change; an established route means it has settled.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'JOURNEY_DENSITY', visualChannel: VISUAL_CHANNEL.PARTICLE_DENSITY,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: null,
      animationBehavior: 'tributary complexity and visible event markers scale with density — complexity, never alarm coloring',
      labelBehavior: 'material-event count in the Inspector',
      interactionBehavior: 'click an event marker to inspect the underlying material event',
      explanationText: 'Journey Density shows up as tributary complexity and historical flow-pattern richness, not as a danger signal.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'ROD_COHERENCE', visualChannel: VISUAL_CHANNEL.CORRIDOR_WIDTH,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'continuity within each of the three parallel channels reflects coherence',
      labelBehavior: 'coherence score + mismatch narrative in the Inspector',
      interactionBehavior: 'click a bridge/exchange point to see the mismatch narrative',
      explanationText: 'Rod Coherence is shown through how continuous each channel stays as it flows, and how cleanly the three channels bridge at exchange points.',
      implementedBy: null,
    }),
  ]),
});

const ENTERPRISE_HIGHWAY_PROFILE = Object.freeze({
  variantKey: 'ENTERPRISE_HIGHWAY',
  requiresQueryContext: true,
  encodings: Object.freeze([
    encoding({
      metricKey: 'QUERY_RELEVANCE', visualChannel: VISUAL_CHANNEL.ROUTE_PRIORITY,
      curveType: CURVE_TYPE.STEP, minVisualValue: 0, maxVisualValue: 3,
      thresholdBands: QUERY_RELEVANCE_BANDS,
      animationBehavior: 'core context = primary route; strongly related = major connecting route; contextual = secondary route; peripheral = background route',
      labelBehavior: 'route-tier label on selection',
      interactionBehavior: 'click a route segment to open its relevance breakdown',
      explanationText: 'Route proximity and priority around the active Orbit — the network recalculates visible routes around the selected context.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'QUERY_COVERAGE', visualChannel: VISUAL_CHANNEL.CORRIDOR_WIDTH,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'missing required semantic dimensions render as unresolved route sections — never a fabricated road segment for unavailable data',
      labelBehavior: 'coverage % in the context summary',
      interactionBehavior: 'click an unresolved section to see which dimension is missing',
      explanationText: 'Route map completeness — an unresolved section is a real gap, not a rendering placeholder.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'STAGE_READINESS', visualChannel: VISUAL_CHANNEL.GATE_VISIBILITY,
      curveType: CURVE_TYPE.THRESHOLD, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'low readiness surfaces specific named, selectable unresolved gates (e.g. "PRICING TERM CONFLICT") — never a red wall with no explanation',
      labelBehavior: 'named blocker list',
      interactionBehavior: 'select a gate to resolve the underlying definition',
      explanationText: 'Unresolved gates are named and explained by the platform, never just a blocked route.',
      implementedBy: 'evaluateGate() guidance text in journeyEngine/maturity.js — extend with the scored composite, do not replace',
    }),
    encoding({
      metricKey: 'CROSS_ROD_ALIGNMENT', visualChannel: VISUAL_CHANNEL.BRANCH_ANGLE,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'synchronization across the three parallel highways renders as bridges/synchronized interchanges',
      labelBehavior: 'ALIGNED / exception label',
      interactionBehavior: 'click an interchange to see the mismatch narrative',
      explanationText: 'Cross-Rod Alignment across Revenue/Customer/Member routes, shown as interchange synchronization.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'JOURNEY_DENSITY', visualChannel: VISUAL_CHANNEL.GEOMETRY_SUBDIVISION,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: null,
      animationBehavior: 'route branching and historical path complexity scale with density — complexity, not automatically poor process quality',
      labelBehavior: 'material-event count in the Inspector',
      interactionBehavior: 'click a branch to inspect the underlying event',
      explanationText: 'A more complex traveled network reflects accumulated journey history, not necessarily a problem.',
      implementedBy: null,
    }),
  ]),
});

const NEURAL_CONSTELLATION_PROFILE = Object.freeze({
  variantKey: 'NEURAL_CONSTELLATION',
  requiresQueryContext: true,
  encodings: Object.freeze([
    encoding({
      metricKey: 'QUERY_RELEVANCE', visualChannel: VISUAL_CHANNEL.GRAPH_ATTRACTION,
      curveType: CURVE_TYPE.NONLINEAR_INVERSE, minVisualValue: 0, maxVisualValue: 1,
      thresholdBands: QUERY_RELEVANCE_BANDS,
      animationBehavior: 'constrained force layout — more relevant elements move toward the active semantic anchor, but real molecule/lineage topology is preserved, never destroyed for a radial cluster',
      labelBehavior: 'shell band label on selection',
      interactionBehavior: 'click a node to open its relevance breakdown',
      explanationText: 'Graph attraction toward the active semantic anchor, using a constrained force layout — real relationships are never sacrificed for a cleaner radial shape.',
      implementedBy: 'candidate input: computeContributionAffinity()/assembleMolecules() in journeyEngine/bonding.js (real tag-overlap graph-formation calculation, reusable as the force-layout input — not yet wired to a force layout)',
    }),
    encoding({
      metricKey: 'QUERY_CONFIDENCE', visualChannel: VISUAL_CHANNEL.EDGE_CERTAINTY_BAND,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'edge certainty band width and internal node clarity vary with confidence',
      labelBehavior: 'confidence score in the Inspector',
      interactionBehavior: 'none (passive read)',
      explanationText: 'Edge certainty — a tight, certain edge is high-confidence; a wide band is low-confidence.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'ROD_COHERENCE', visualChannel: VISUAL_CHANNEL.PATH_CONTINUITY,
      curveType: CURVE_TYPE.THRESHOLD, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'structural continuity for coherent state; contradictions create explicit tension edges or alternate state structures — never a blanket "invalid" label',
      labelBehavior: 'coherence score + mismatch narrative',
      interactionBehavior: 'click a tension edge to see the mismatch narrative',
      explanationText: 'Contradictions render as tension edges, not automatic invalidation — some are valid concurrent states.',
      implementedBy: null,
    }),
  ]),
});

const TEMPORAL_CANYON_PROFILE = Object.freeze({
  variantKey: 'TEMPORAL_CANYON',
  requiresQueryContext: true, // still supports Customer Orbit per §XVI, but Rod Position is the PRIMARY axis
  encodings: Object.freeze([
    encoding({
      metricKey: 'ROD_POSITION', visualChannel: VISUAL_CHANNEL.DEPTH,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: null, maxVisualValue: null,
      animationBehavior: 'longitudinal location along the canyon axis — explicitly never used as a maturity proxy',
      labelBehavior: '"Cycle N · Stage M · X% stage position" — never a bare ambiguous decimal',
      interactionBehavior: 'move along the canyon to change position context',
      explanationText: 'Where the journey currently sits, longitudinally — not how far it has matured.',
      implementedBy: 'extends journeyEngine/layout.js\'s computeRodLayout() non-parallel gate-driven positioning',
    }),
    encoding({
      metricKey: 'QUERY_RELEVANCE', visualChannel: VISUAL_CHANNEL.ILLUMINATION_INTENSITY,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      thresholdBands: QUERY_RELEVANCE_BANDS,
      animationBehavior: 'when a query context is active, relevant elements illuminate and reorganize around their journey position — position stays primary, relevance modulates emphasis',
      labelBehavior: 'shell band label on selection',
      interactionBehavior: 'click an illuminated element to open its relevance breakdown',
      explanationText: 'Customer-relevant elements illuminate at their existing journey position rather than moving to a query-driven radius, per §XVI\'s Temporal Canyon behavior.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'STAGE_COMPLETENESS', visualChannel: VISUAL_CHANNEL.ROD_SEGMENT_FILL,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 100,
      animationBehavior: 'internal stage lattice, illuminated requirements, or completed structural markers — a 63%-complete stage should not literally mean 63% of a canyon wall exists unless that stays legible',
      labelBehavior: 'percent + dimension breakdown (Definitions/Evidence/Relationships/Validation)',
      interactionBehavior: 'click the active stage to see the completeness breakdown',
      explanationText: 'How much of this stage\'s required content actually exists, shown as internal structure rather than a literal wall fraction.',
      implementedBy: null,
    }),
    encoding({
      metricKey: 'CHANNEL_MATURITY', visualChannel: VISUAL_CHANNEL.CRYSTAL_COMPLEXITY,
      curveType: CURVE_TYPE.STEP, minVisualValue: 4, maxVisualValue: 24,
      animationBehavior: 'more mature local regions contain stronger defined geometry, evidence structures, and lineage connectivity',
      labelBehavior: 'purpose-named maturity breakdown',
      interactionBehavior: 'click to open the per-purpose maturity breakdown',
      explanationText: 'Semantic richness of the local canyon environment — reuses the same crystal-complexity language as Crystal Basin, per §XII.',
      implementedBy: 'facetCountForMaturity() in journeyEngine/maturityEngine.js',
    }),
    encoding({
      metricKey: 'JOURNEY_DENSITY', visualChannel: VISUAL_CHANNEL.BRANCH_ANGLE,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: null,
      animationBehavior: 'high density creates more branches, event traces, decision markers, and adjustment layers visible in the canyon walls',
      labelBehavior: 'material-event count',
      interactionBehavior: 'click a branch to inspect the underlying event',
      explanationText: 'More accumulated history renders as more branch and event structure in the canyon.',
      implementedBy: 'extends journeyEngine/layout.js\'s branch/merge geometry',
    }),
    encoding({
      metricKey: 'CROSS_ROD_ALIGNMENT', visualChannel: VISUAL_CHANNEL.SPATIAL_PROXIMITY,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'compatible states across the three parallel canyon walls create connecting structures; mismatches appear as visible separation or unresolved bridges',
      labelBehavior: 'ALIGNED / exception label',
      interactionBehavior: 'look across the parallel rods at any temporal region to compare',
      explanationText: 'Whether Revenue, Customer, and Member rods make sense together at this point in time.',
      implementedBy: null,
    }),
  ]),
});

// MATURITY_LATTICE (7th variant) intentionally has no QUERY_RELEVANCE encoding — its own registry
// entry documents "No active query context required," per Betsy's 2026-07-12 concept. Flagged via
// `requiresQueryContext: false` so the validator below can exempt it explicitly, not silently.
const MATURITY_LATTICE_PROFILE = Object.freeze({
  variantKey: 'MATURITY_LATTICE',
  requiresQueryContext: false,
  encodings: Object.freeze([
    encoding({
      metricKey: 'CHANNEL_MATURITY', visualChannel: VISUAL_CHANNEL.NESTING_DEPTH,
      curveType: CURVE_TYPE.STEP, minVisualValue: 0, maxVisualValue: 3,
      animationBehavior: 'Atom -> Cluster -> Molecule nesting depth and internal facet complexity both scale with each purpose\'s maturity score; a node can be visibly complete on one purpose axis and unfinished on another simultaneously',
      labelBehavior: 'per-purpose breakdown — legal / participation coverage / billing readiness / rev-rec readiness / renewal stability / expected realization — never one collapsed number',
      interactionBehavior: 'click a nesting level to switch which purpose is in focus',
      explanationText: 'Structural nesting depth by purpose-scoped maturity — this variant\'s primary organizing axis, independent of any query context.',
      implementedBy: 'facetCountForMaturity() in journeyEngine/maturityEngine.js (per-node facet complexity); nesting composition is Phase 5/6 build',
    }),
    encoding({
      metricKey: 'STATE_CONFIDENCE', visualChannel: VISUAL_CHANNEL.CRYSTAL_CLARITY,
      curveType: CURVE_TYPE.LINEAR, minVisualValue: 0, maxVisualValue: 1,
      animationBehavior: 'lattice clarity vs. fracture — how much the node can be trusted, strictly separate from how mature it is',
      labelBehavior: 'confidence score + dimension breakdown',
      interactionBehavior: 'click to open the confidence breakdown',
      explanationText: 'How much this node\'s current state can be trusted, independent of its maturity — a fully mature purpose can still be low-confidence if its evidence is stale or contradictory.',
      implementedBy: null,
    }),
  ]),
});

export const WORLD_VARIANT_ENCODING_PROFILES = Object.freeze({
  CRYSTAL_BASIN: CRYSTAL_BASIN_PROFILE,
  ORBITAL_INTELLIGENCE: ORBITAL_INTELLIGENCE_PROFILE,
  MONETARY_RIVER_SYSTEM: MONETARY_RIVER_PROFILE,
  ENTERPRISE_HIGHWAY: ENTERPRISE_HIGHWAY_PROFILE,
  NEURAL_CONSTELLATION: NEURAL_CONSTELLATION_PROFILE,
  TEMPORAL_CANYON: TEMPORAL_CANYON_PROFILE,
  MATURITY_LATTICE: MATURITY_LATTICE_PROFILE,
});

export function getVisualEncodingProfile(variantKey) {
  return WORLD_VARIANT_ENCODING_PROFILES[variantKey] || null;
}

// Phase 5 helper: discrete shell radius per Query Relevance band, replacing a continuous
// distance-only gradient with the "organized dimensional shells rather than one dense ball" §V
// Variant 1 calls for. Radius is interpolated across the variant's own declared min/maxVisualValue
// (Phase 3's encoding, not a second hardcoded range) by the band's position in
// QUERY_CONVERGENCE_METHODOLOGY.relevance.bands — core (index 0) is closest, peripheral (last) is
// farthest.
export function shellRadiusForBand(bandKey, variantKey = 'CRYSTAL_BASIN') {
  const profile = getVisualEncodingProfile(variantKey);
  const relevanceEncoding = profile?.encodings.find((e) => e.metricKey === 'QUERY_RELEVANCE');
  if (!relevanceEncoding) return null;
  const bands = QUERY_RELEVANCE_BANDS;
  const idx = Math.max(0, bands.findIndex((b) => b.key === bandKey));
  const t = bands.length > 1 ? idx / (bands.length - 1) : 0;
  const { minVisualValue, maxVisualValue } = relevanceEncoding;
  return minVisualValue + (maxVisualValue - minVisualValue) * t;
}

// -----------------------------------------------------------------------------------------------
// §VII validation — "a variant should FAIL development validation if" the four named conditions.
// Runs against real registries, not a static findings list.
// -----------------------------------------------------------------------------------------------

// Rendering-only values a profile must never register as if they were a semantic metric (§I's
// RENDERING MATHEMATICS list) — camera distance, animation progress, interpolation, raw particle
// velocity, and the internal x/y/z coordinate itself.
const RENDERING_ONLY_VALUES = Object.freeze([
  'cameraDistance', 'animationProgress', 'interpolationValue', 'particleVelocity',
  'x', 'y', 'z', 'renderingRadius', 'visualScale',
]);

export function validateVisualEncodingProfile(variantKey, profile = getVisualEncodingProfile(variantKey)) {
  const errors = [];
  if (!profile) return [`${variantKey}: no VisualEncodingProfile registered`];
  if (!WORLD_VARIANT_REGISTRY[variantKey]) errors.push(`${variantKey}: not present in WORLD_VARIANT_REGISTRY`);

  const hasRelevance = profile.encodings.some((e) => e.metricKey === 'QUERY_RELEVANCE');
  if (profile.requiresQueryContext && !hasRelevance) {
    errors.push(`${variantKey}: Query Relevance has no declared encoding (required unless requiresQueryContext is explicitly false)`);
  }

  const channelOwners = new Map();
  for (const e of profile.encodings) {
    // Rule: rendering-only value registered as if it were a semantic metric.
    if (RENDERING_ONLY_VALUES.includes(e.metricKey)) {
      errors.push(`${variantKey}/${e.metricKey}: rendering-only value registered as a semantic metric encoding`);
      continue;
    }
    const def = METRIC_DEFINITION_REGISTRY[e.metricKey];
    if (!def) {
      errors.push(`${variantKey}/${e.metricKey}: not present in METRIC_DEFINITION_REGISTRY`);
      continue;
    }
    // Rule: one visual channel representing two conflicting metrics within the same variant.
    const prior = channelOwners.get(e.visualChannel);
    if (prior && prior !== e.metricKey) {
      errors.push(`${variantKey}: visual channel "${e.visualChannel}" maps to both ${prior} and ${e.metricKey} — one channel must represent one metric per variant`);
    }
    channelOwners.set(e.visualChannel, e.metricKey);
    // Rule: encoding values outside the metric's own declared range.
    if (def.rangeMin !== null && e.minVisualValue !== null && typeof e.minVisualValue === 'number') {
      // minVisualValue/maxVisualValue describe the RENDERED range (e.g. pixels/radius units), not
      // the metric's own 0-1/percent domain — only flag a real domain violation: a curve declared
      // over a metric whose own range is null (unbounded, e.g. JOURNEY_DENSITY) must not claim a
      // fixed closed max unless the channel itself is inherently bounded (facet count, shell index).
      if (def.rangeMax === null && e.maxVisualValue !== null && e.curveType !== CURVE_TYPE.STEP) {
        errors.push(`${variantKey}/${e.metricKey}: metric range is unbounded (rangeMax null) but encoding declares a fixed maxVisualValue with a non-stepped curve — confirm this is a real rendering clamp, not an invented metric ceiling`);
      }
    }
  }
  return errors;
}

export function validateAllVisualEncodingProfiles() {
  const errors = [];
  for (const variantKey of Object.keys(WORLD_VARIANT_ENCODING_PROFILES)) {
    errors.push(...validateVisualEncodingProfile(variantKey));
  }
  return errors;
}

// -----------------------------------------------------------------------------------------------
// §VII WorldVariantConfig — composes Phase 2's registry entry (profile IDs, mostly still null
// pending Phase 4) with this phase's resolved VisualEncodingProfile into the one object a render
// system should ever need to resolve a variant. Phase 4 fills in the geometry/camera/etc. profile
// objects this currently only carries IDs for.
// -----------------------------------------------------------------------------------------------

export function resolveWorldVariantConfig(variantKey) {
  const variant = WORLD_VARIANT_REGISTRY[variantKey];
  if (!variant) return null;
  const visualEncodingProfile = getVisualEncodingProfile(variantKey);
  return Object.freeze({
    key: variant.variantKey,
    name: variant.displayName,
    family: variant.worldFamily,
    status: variant.status,
    semanticModelVersion: variant.semanticModelVersion,
    visualEncodingProfile, // Phase 3 — real
    geometryProfile: variant.geometryProfileId, // Phase 4 — still an id (null) until built
    orbitProfile: variant.orbitProfileId,
    atomProfile: null, // Phase 4
    moleculeProfile: null, // Phase 4
    rodProfile: variant.rodProfileId,
    lineageProfile: variant.lineageProfileId,
    convergenceProfile: variant.convergenceProfileId,
    cameraProfile: variant.cameraProfileId,
    environmentProfile: variant.environmentProfileId,
    lightingProfile: variant.lightingProfileId,
    materialProfile: variant.materialProfileId,
    labelProfile: variant.labelProfileId,
    performanceProfile: variant.performanceProfileId,
    metricEncodings: Object.fromEntries((visualEncodingProfile?.encodings || []).map((e) => [e.metricKey, e])),
  });
}

// A profile field being null is expected pre-Phase-4 (status REGISTERED) — only flag it as a real
// "required profile is missing" failure once a variant claims to be STRUCTURAL or INTERACTIVE,
// which is a real §VII rule ("fail if a required profile is missing") applied honestly rather than
// failing every variant permanently for work Phase 4 hasn't reached yet.
const REQUIRED_PROFILE_FIELDS_BEYOND_REGISTERED = Object.freeze([
  'geometryProfile', 'cameraProfile', 'convergenceProfile', 'atomProfile',
]);

export function validateWorldVariantConfig(variantKey) {
  const config = resolveWorldVariantConfig(variantKey);
  const errors = [];
  if (!config) return [`${variantKey}: could not resolve WorldVariantConfig`];
  errors.push(...validateVisualEncodingProfile(variantKey, config.visualEncodingProfile));
  if (config.status === 'structural' || config.status === 'interactive') {
    for (const field of REQUIRED_PROFILE_FIELDS_BEYOND_REGISTERED) {
      if (!config[field]) errors.push(`${variantKey}: status is "${config.status}" but required profile "${field}" is missing`);
    }
  }
  return errors;
}
