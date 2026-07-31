// World Variant Engine Phase 4 (master-build-prompt.md §VI) — the nine Variant Component Profile
// systems (Orbit, Atom, Molecule, Rod, Lineage, Convergence, Environment, Camera, Label) as
// data-driven config, not per-component conditionals scattered through SpatialJourneyWorld.jsx.
//
// Per phases.md's own scope note: atomGeometry.js's builders (getBipyramidParts, buildAtomMaterial,
// buildStageAnchorMesh, buildMoleculeShellMesh, buildHashNodeMesh, buildReconciliationRingMesh,
// buildHomeAnchorPinMesh, buildGateBeaconMesh, buildGlowSprite) are the existing geometry vocabulary
// for Crystal Basin's Atom/Molecule/Orbit profiles, and the current hand-rolled spherical camera
// (resetView/focusPoint/zoomBy/enterWorld) is the baseline Camera Profile — both are FORMALIZED
// here (referenced by name), not replaced or reimplemented. Where a variant's profile field has no
// real builder yet, `builder: null` is honest about that — matching Phase 3's `implementedBy: null`
// convention — rather than inventing placeholder rendering code this file can't actually run.
//
// Depth over breadth: Crystal Basin and Temporal Journey Canyon get fully real profiles (they are
// the two variants phases.md's own Phase 5 note says extend REAL existing code — atomGeometry.js
// and layout.js respectively — not from-scratch builds). The other five variants get real,
// spec-faithful profile STRUCTURE with builder fields left null pending Phase 5/6's actual
// implementation — declaring seven shallow variants would not satisfy DoD item 8 ("working
// structural implementations... rather than static screenshots"); leaving them honestly
// unimplemented does not overclaim it either.

import { WORLD_VARIANT_REGISTRY } from './worldVariantRegistry.js';
import { getVisualEncodingProfile } from './worldVariantEncodingProfiles.js';

// -----------------------------------------------------------------------------------------------
// §VI field shapes — one factory per profile type so every variant's profile carries the same
// required keys (a missing key is a real Phase 3/7 "required profile is missing" failure, not a
// silent gap) even where a variant's OWN behavior for that field is "not yet built."
// -----------------------------------------------------------------------------------------------

function orbitProfile(f) {
  return Object.freeze({
    geometry: f.geometry, scale: f.scale, shellBehavior: f.shellBehavior,
    queryActivationBehavior: f.queryActivationBehavior, selectionAnimation: f.selectionAnimation,
    contextualGravityBehavior: f.contextualGravityBehavior, labels: f.labels,
    metricSummaryPlacement: f.metricSummaryPlacement, builder: f.builder ?? null,
  });
}
function atomProfile(f) {
  return Object.freeze({
    baseGeometry: f.baseGeometry, metadataGeometryMapping: f.metadataGeometryMapping,
    maturityGeometryBehavior: f.maturityGeometryBehavior, confidenceTreatment: f.confidenceTreatment,
    stabilityMotion: f.stabilityMotion, selectedState: f.selectedState, hoverState: f.hoverState,
    builder: f.builder ?? null,
  });
}
function moleculeProfile(f) {
  return Object.freeze({
    clusterArrangement: f.clusterArrangement, spacing: f.spacing,
    localRelationshipBehavior: f.localRelationshipBehavior, clusterBounds: f.clusterBounds,
    moleculeLabelBehavior: f.moleculeLabelBehavior, builder: f.builder ?? null,
  });
}
function rodProfile(f) {
  return Object.freeze({
    geometry: f.geometry, stageSegmentation: f.stageSegmentation, activePosition: f.activePosition,
    branchBehavior: f.branchBehavior, mergeBehavior: f.mergeBehavior, cycleBehavior: f.cycleBehavior,
    maturityEncoding: f.maturityEncoding, completenessEncoding: f.completenessEncoding,
    readinessEncoding: f.readinessEncoding, historicalLineageBehavior: f.historicalLineageBehavior,
    builder: f.builder ?? null,
  });
}
function lineageProfile(f) {
  return Object.freeze({
    pathGeometry: f.pathGeometry, directionIndication: f.directionIndication,
    observedRelationshipTreatment: f.observedRelationshipTreatment,
    inferredRelationshipTreatment: f.inferredRelationshipTreatment, pathStrength: f.pathStrength,
    temporalDecayBehavior: f.temporalDecayBehavior, selectedLineageBehavior: f.selectedLineageBehavior,
    colorSource: 'resolvePathColor()/PINNED_PATH_COLORS — journeyEngine/pathColor.js, unchanged (§XII)',
  });
}
function convergenceProfile(f) {
  return Object.freeze({
    layoutAlgorithm: f.layoutAlgorithm, relevanceToPositionMapping: f.relevanceToPositionMapping,
    movementDuration: f.movementDuration, easing: f.easing, collisionHandling: f.collisionHandling,
    semanticBandBehavior: f.semanticBandBehavior, topologyPreservation: f.topologyPreservation,
    cameraTransition: f.cameraTransition, builder: f.builder ?? null,
  });
}
function environmentProfile(f) {
  return Object.freeze({
    fog: f.fog, background: f.background, floor: f.floor, terrain: f.terrain,
    environmentalParticles: f.environmentalParticles, atmosphericDepth: f.atmosphericDepth,
    environmentalMotion: f.environmentalMotion,
    note: 'Environmental motion must not overpower semantic movement (§VI) — semantic state motion (bounded oscillation, orbit lock, particle flow) always takes visual priority over ambient/atmospheric motion.',
  });
}
function cameraProfile(f) {
  return Object.freeze({
    defaultPosition: f.defaultPosition, fieldOfView: f.fieldOfView, minDistance: f.minDistance,
    maxDistance: f.maxDistance, orbitBehavior: f.orbitBehavior, panBehavior: f.panBehavior,
    focusBehavior: f.focusBehavior, followBehavior: f.followBehavior,
    transitionBehavior: f.transitionBehavior, rodTraversalBehavior: f.rodTraversalBehavior,
    builder: f.builder ?? null,
  });
}
function labelProfile(f) {
  return Object.freeze({
    worldSpaceLabels: f.worldSpaceLabels, htmlOverlays: f.htmlOverlays,
    distanceBasedVisibility: f.distanceBasedVisibility, selectedLabels: f.selectedLabels,
    semanticBandLabels: f.semanticBandLabels, metricBadges: f.metricBadges,
    collisionHandling: f.collisionHandling,
  });
}

// -----------------------------------------------------------------------------------------------
// The current hand-rolled spherical camera (SpatialJourneyWorld.jsx) is the baseline every variant
// starts from — formalized once here, not reimplemented per variant. `entered ? 0.07/0.08 :
// 0.012/0.01` is the real lerp-smoothing factor pair (slower drift before "Enter the World").
// -----------------------------------------------------------------------------------------------
const BASELINE_CAMERA = cameraProfile({
  defaultPosition: 'spherical { radius: 130, theta: 0.4, phi: 1.2 } before entry',
  fieldOfView: 'unchanged from current PerspectiveCamera setup',
  minDistance: 6, maxDistance: 160,
  orbitBehavior: 'drag rotates theta/phi, lerp-smoothed toward a goal at 0.07/0.08 (entered) or 0.012/0.01 (pre-entry)',
  panBehavior: 'none — orbit (drag) + zoom (wheel/pinch) only, matches current implementation',
  focusBehavior: 'focusPoint(pos, radius=14) sets sphericalGoal.radius/theta and phi=0.95',
  followBehavior: 'not implemented — camera does not track a moving target automatically',
  transitionBehavior: 'resetView() -> sphericalGoal { radius: 62, theta: 0.6, phi: 1.05 }',
  rodTraversalBehavior: 'not implemented — no dedicated camera path along a rod\'s stage axis yet',
  builder: 'resetView()/focusPoint()/zoomBy()/enterWorld() in SpatialJourneyWorld.jsx',
});

const BASELINE_ENVIRONMENT = environmentProfile({
  fog: 'none currently configured',
  background: 'hand-built vertical-gradient sphere skybox, brand-palette-driven via readBrandPalette()',
  floor: 'ground plane + THREE.GridHelper',
  terrain: 'flat — no terrain elevation system exists yet',
  environmentalParticles: 'none currently — variant-specific particle systems are Phase 5/6 work',
  atmosphericDepth: 'none beyond the skybox gradient',
  environmentalMotion: 'none currently animated',
});

// -----------------------------------------------------------------------------------------------
// CRYSTAL BASIN — real profile, extends real code (atomGeometry.js, computeAtomVisual, pathColor.js,
// the baseline camera). This is the variant closest to already shipped.
// -----------------------------------------------------------------------------------------------
const CRYSTAL_BASIN_COMPONENT_PROFILE = Object.freeze({
  variantKey: 'CRYSTAL_BASIN',
  orbit: orbitProfile({
    geometry: 'large icosahedron (buildHashNodeMesh) — the compound-query/Customer-360 hash node',
    scale: 'radius 2.6, existing default',
    shellBehavior: 'organized dimensional shells by Query Relevance band (Core/Strongly Related/Contextual/Peripheral), not one dense ball — Phase 5 build target',
    queryActivationBehavior: 'runCustomerOrbit() two-stage converging -> hashConverging choreography, already real',
    selectionAnimation: 'glow sprite (buildGlowSprite) pulse on activation',
    contextualGravityBehavior: 'atoms lerp toward world.hashNodePos at shellRadiusForBand(band) — grouped by Query Relevance band into discrete shells, already real (Phase 5, 2026-07-30)',
    labels: 'context summary panel (HashResultPanel), not world-space floating text',
    metricSummaryPlacement: 'docked panel, not in-scene',
    builder: 'buildHashNodeMesh() in journeyEngine/atomGeometry.js — hash node material roughness (clarity) and bounded positional wobble (stability) now driven by the entity-level QUERY_CONFIDENCE/CONVERGENCE_STABILITY scores from triangulateEntity(), already real (Phase 5, 2026-07-30); per-atom confidence/stability is not calculated anywhere yet, only the entity-level aggregate applied to this one hash node',
  }),
  atom: atomProfile({
    baseGeometry: 'bipyramid (getBipyramidParts) — two cones joined base-to-base',
    metadataGeometryMapping: 'atom metadata type -> VISUAL_SEMANTIC_REGISTRY.evidence_atom.geometryId (atom_crystal)',
    maturityGeometryBehavior: 'facet count (radial segments) steps 4->24 by CHANNEL_MATURITY ordinal level via facetCountForMaturity() — already real, not a scale change',
    confidenceTreatment: 'crystal_clarity channel per worldVariantEncodingProfiles.js — Phase 5 build target, not yet a distinct material channel from opacity',
    stabilityMotion: 'bounded_movement channel per worldVariantEncodingProfiles.js — Phase 5 build target, no stability-driven motion in the animate() loop yet',
    selectedState: 'glow halo intensity increases (buildGlowSprite), existing behavior',
    hoverState: 'not currently distinguished from selected state — Phase 5 gap',
    builder: 'getBipyramidParts() + buildAtomMaterial() in journeyEngine/atomGeometry.js, visual computed by computeAtomVisual() in journeyEngine/maturity.js',
  }),
  molecule: moleculeProfile({
    clusterArrangement: 'wire icosahedron shell (buildMoleculeShellMesh) enclosing member atoms',
    spacing: 'radius 3.4, existing default',
    localRelationshipBehavior: 'members positioned by existing orbitPosition()/layout math, not yet relevance-shell-aware within a molecule',
    clusterBounds: 'wireframe shell boundary, semi-transparent (opacity 0.12)',
    moleculeLabelBehavior: 'not currently labeled independently of member atoms',
    builder: 'buildMoleculeShellMesh() in journeyEngine/atomGeometry.js',
  }),
  rod: rodProfile({
    geometry: 'hex-drum cylinder per stage (buildStageAnchorMesh), chained along computeRodLayout() positions',
    stageSegmentation: 'one anchor mesh per stage, non-parallel gate-driven branching (layout.js)',
    activePosition: 'ROD_POSITION not yet rendered on the rod itself — Phase 5 gap (currently only stage anchors exist, no explicit position marker)',
    branchBehavior: 'branchAngleDeg/branchElevation off the parent rod\'s origin gate — already real in layout.js',
    mergeBehavior: 'reconciliation torus (buildReconciliationRingMesh) at confluence/master-data merge points',
    cycleBehavior: 'not yet distinguished from stage index — ROD_POSITION\'s cycle field (rodMathematics.js) is calculated but not yet fed into rod geometry',
    maturityEncoding: 'rollupStageMaturity() feeds stage anchor scaleY (lerp 0.6-1.3) — already real',
    completenessEncoding: 'STAGE_COMPLETENESS not yet rendered as rod_fill — Phase 5 gap',
    readinessEncoding: 'evaluateGate() soft-guidance text — already real; scored STAGE_READINESS not yet visualized',
    historicalLineageBehavior: 'per-atom lineage via getAtomLineage()/lineageValueAtOffset(), time-slider UI in AtomPanel — already real',
    builder: 'buildStageAnchorMesh() in journeyEngine/atomGeometry.js, positions from computeRodLayout() in journeyEngine/layout.js',
  }),
  lineage: lineageProfile({
    pathGeometry: 'THREE.Line between home anchor pin and current atom position',
    directionIndication: 'home-anchor pin (buildHomeAnchorPinMesh) marks the owning stage',
    observedRelationshipTreatment: 'continuous solid line',
    inferredRelationshipTreatment: 'not yet visually distinguished (dashed/segmented) from observed — Phase 5 gap, spec calls for this explicitly (§V Variant 1)',
    pathStrength: 'not yet mapped to path thickness — Phase 5 gap',
    temporalDecayBehavior: 'not yet rendered — lineage.js has the data (pendingBranches, version history), no decay visual yet',
    selectedLineageBehavior: 'full lineage + time slider opens in AtomPanel on demand',
  }),
  convergence: convergenceProfile({
    layoutAlgorithm: 'two-stage: per-stage ring fan-out (angle = i/n * 2pi) -> hash-node convergence at resolveQueryDistance(relevance) radius',
    relevanceToPositionMapping: 'resolveQueryDistance() — nonlinear inverse, already real and live',
    movementDuration: 'HASH_PHASE1 + HASH_HOLD + 1.6s total, existing constants',
    easing: 'lerpVectors/smoothstep per frame in the animate() loop',
    collisionHandling: 'even angular fan-out within each shell (i/n * 2pi per band) keeps same-band atoms from stacking; no cross-shell collision detection beyond that',
semanticBandBehavior: 'organized into discrete Core/Strongly Related/Contextual/Peripheral shells via shellRadiusForBand() (Phase 5, 2026-07-30) — each band forms its own evenly-fanned ring rather than one continuous relevance-to-radius gradient, per §V Variant 1',
    topologyPreservation: 'n/a for this variant — Crystal Basin is explicitly radial-shell, not graph-topology-preserving (that\'s Neural Constellation\'s job)',
    cameraTransition: 'focusPoint() on selection, existing behavior',
    builder: 'runCustomerOrbit() in SpatialJourneyWorld.jsx — needs Phase 7\'s Interaction Intent layer to stop computing ring/angle math inline in the handler',
  }),
  environment: BASELINE_ENVIRONMENT,
  camera: BASELINE_CAMERA,
  label: labelProfile({
    worldSpaceLabels: 'none currently — all labels are HTML overlay (HUD panels)',
    htmlOverlays: 'objectives panel, atom inspector panel, hash result panel, legend — all real',
    distanceBasedVisibility: 'not implemented',
    selectedLabels: 'atom name + eyebrow (rod type / stage) in AtomPanel',
    semanticBandLabels: 'not yet shown per Query Relevance band — Phase 5 gap once shell banding exists',
    metricBadges: 'maturity/conflict badge in AtomPanel (sjw-badge classes) — already real',
    collisionHandling: 'n/a — no world-space labels to collide yet',
  }),
});

// -----------------------------------------------------------------------------------------------
// TEMPORAL JOURNEY CANYON — real profile, extends real code (layout.js's non-parallel gate-driven
// positioning, which already makes time/stage the primary spatial axis).
// -----------------------------------------------------------------------------------------------
const TEMPORAL_CANYON_COMPONENT_PROFILE = Object.freeze({
  variantKey: 'TEMPORAL_CANYON',
  orbit: orbitProfile({
    geometry: 'reuse buildHashNodeMesh() as a canyon waypoint/junction marker',
    scale: 'radius 2.6, existing default',
    shellBehavior: 'n/a — this variant\'s primary axis is Rod Position (longitudinal), not relevance shells',
    queryActivationBehavior: 'when active, illuminate relevant elements at their existing journey position (§XVI) rather than moving them to a query radius',
    selectionAnimation: 'glow sprite pulse, reused from Crystal Basin',
    contextualGravityBehavior: 'n/a for this variant by design',
    labels: 'context summary panel, reused pattern',
    metricSummaryPlacement: 'docked panel',
    builder: null,
  }),
  atom: atomProfile({
    baseGeometry: 'reuse bipyramid (getBipyramidParts) — same crystal vocabulary as Crystal Basin per §XII',
    metadataGeometryMapping: 'same VISUAL_SEMANTIC_REGISTRY mapping as Crystal Basin',
    maturityGeometryBehavior: 'same facetCountForMaturity() step function — local environment richness scales with maturity',
    confidenceTreatment: 'not yet distinct in this variant — reuse Crystal Basin\'s crystal_clarity target once built',
    stabilityMotion: 'not yet built',
    selectedState: 'reuse glow halo',
    hoverState: 'not yet built',
    builder: 'getBipyramidParts() + computeAtomVisual(), shared with Crystal Basin',
  }),
  molecule: moleculeProfile({
    clusterArrangement: 'positioned along the canyon walls at their rod stage location, not a free-floating shell',
    spacing: 'derived from computeRodLayout() stage spacing (STAGE_SPACING=8)',
    localRelationshipBehavior: 'not yet built',
    clusterBounds: 'reuse wire icosahedron shell',
    moleculeLabelBehavior: 'not yet built',
    builder: null,
  }),
  rod: rodProfile({
    geometry: 'canyon wall segments along computeRodLayout() — the primary visual structure of this entire variant',
    stageSegmentation: 'major canyon regions per stage, already the real shape of layout.js\'s output',
    activePosition: 'ROD_POSITION as longitudinal camera/marker location — Phase 5 build target (rodMathematics.js already calculates stageIndex + intraStagePosition + cycle)',
    branchBehavior: 'alternate dimensional paths off branchAngleDeg/branchElevation — already real in layout.js, this variant is its most literal visualization',
    mergeBehavior: 'reconnection into the primary canyon structure — reuse buildReconciliationRingMesh at merge points',
    cycleBehavior: 'renewal cycles as repeated canyon regions — Phase 5 build target',
    maturityEncoding: 'local environment richness (stronger defined geometry, evidence structures) — Phase 5 build target',
    completenessEncoding: 'internal stage lattice / illuminated requirements, never a literal wall-fraction — Phase 5 build target, explicit spec warning against the literal-percentage trap (§V Variant 6)',
    readinessEncoding: 'not yet built',
    historicalLineageBehavior: 'remains visible behind the active position — reuse lineage.js, Phase 5 build target for canyon-specific rendering',
    builder: 'computeRodLayout() in journeyEngine/layout.js — already the real non-parallel gate-driven shape this variant needs',
  }),
  lineage: lineageProfile({
    pathGeometry: 'trailing path behind the active canyon position',
    directionIndication: 'canyon axis direction itself indicates temporal direction',
    observedRelationshipTreatment: 'solid, reused from Crystal Basin',
    inferredRelationshipTreatment: 'not yet built',
    pathStrength: 'not yet built',
    temporalDecayBehavior: 'strongest natural fit for this variant — not yet built',
    selectedLineageBehavior: 'reuse AtomPanel\'s lineage + time slider',
  }),
  convergence: convergenceProfile({
    layoutAlgorithm: 'positional illumination, not radial movement — elements stay at their journey-position location and change emphasis (§XVI)',
    relevanceToPositionMapping: 'illumination_intensity per worldVariantEncodingProfiles.js, not a position change',
    movementDuration: 'n/a — no repositioning on query activation, only illumination change',
    easing: 'fade in/out for illumination, not yet built',
    collisionHandling: 'n/a',
    semanticBandBehavior: 'illumination intensity banded by relevance, not shell distance',
    topologyPreservation: 'canyon topology (layout.js\'s branch/merge shape) is never altered by query activation — the strongest topology-preservation guarantee of any variant since nothing moves',
    cameraTransition: 'camera travels along the canyon axis — rodTraversalBehavior, not yet built (baseline camera has no dedicated rod-traversal path yet)',
    builder: null,
  }),
  environment: environmentProfile({
    ...BASELINE_ENVIRONMENT,
    terrain: 'canyon walls are the primary terrain — Phase 5 build target, not flat like the current default',
    atmosphericDepth: 'fog-based depth cueing along the canyon length would help readability — Phase 5 consideration, not yet built',
  }),
  camera: cameraProfile({
    ...BASELINE_CAMERA,
    rodTraversalBehavior: 'dedicated camera path along the canyon\'s temporal axis — the one camera capability this variant most needs and the baseline does not yet have',
  }),
  label: labelProfile({
    worldSpaceLabels: 'stage region labels along the canyon — Phase 5 build target',
    htmlOverlays: 'reuse existing HUD panel pattern',
    distanceBasedVisibility: 'not implemented',
    selectedLabels: 'reuse AtomPanel',
    semanticBandLabels: 'illumination band label on selection',
    metricBadges: 'reuse sjw-badge pattern',
    collisionHandling: 'not implemented',
  }),
});

// -----------------------------------------------------------------------------------------------
// The remaining five variants — real, spec-faithful STRUCTURE (every §VI field present, drawn
// directly from the master prompt's own per-variant section), builders left null. Declaring these
// with real content (not stub objects) satisfies DoD item 6's registration bar; actually rendering
// them is Phase 5/6's job, which this file does not pretend to have already done.
// -----------------------------------------------------------------------------------------------

function structuralOnlyProfile(fields) {
  return Object.freeze({
    orbit: orbitProfile(fields.orbit),
    atom: atomProfile(fields.atom),
    molecule: moleculeProfile(fields.molecule),
    rod: rodProfile(fields.rod),
    lineage: lineageProfile(fields.lineage),
    convergence: convergenceProfile(fields.convergence),
    environment: environmentProfile(fields.environment),
    camera: cameraProfile({ ...BASELINE_CAMERA, ...fields.cameraOverrides }),
    label: labelProfile(fields.label),
  });
}

const ORBITAL_INTELLIGENCE_COMPONENT_PROFILE = Object.freeze({
  variantKey: 'ORBITAL_INTELLIGENCE',
  ...structuralOnlyProfile({
    orbit: { geometry: 'contextual gravity body, modern abstract (not literal sci-fi)', scale: 'scales with query activation', shellBehavior: 'stable orbital shells, never continuous high-speed spin', queryActivationBehavior: 'selected Orbit becomes the semantic gravity center', selectionAnimation: 'gravity-well activation pulse', contextualGravityBehavior: 'related intelligence assumes orbit based on relevance', labels: 'context summary at gravity center', metricSummaryPlacement: 'docked, near the active gravity body' },
    atom: { baseGeometry: 'intelligence body — reuse bipyramid vocabulary per §XII', metadataGeometryMapping: 'shared VISUAL_SEMANTIC_REGISTRY mapping', maturityGeometryBehavior: 'controls orbital-history trail complexity/persistence', confidenceTreatment: 'orbital path precision (edge_certainty_band)', stabilityMotion: 'orbit lock (stable) vs. bounded shell transition (unstable)', selectedState: 'not yet built', hoverState: 'not yet built' },
    molecule: { clusterArrangement: 'orbital constellations', spacing: 'shell-radius-dependent', localRelationshipBehavior: 'not yet built', clusterBounds: 'not yet built', moleculeLabelBehavior: 'not yet built' },
    rod: { geometry: 'temporal arcs / elongated orbital tracks — three parallel arcs for Revenue/Customer/Member', stageSegmentation: 'arc segments', activePosition: 'not yet built', branchBehavior: 'diverging orbital paths', mergeBehavior: 'trajectory intersections', cycleBehavior: 'not yet built', maturityEncoding: 'trajectory history complexity/persistence', completenessEncoding: 'not yet built', readinessEncoding: 'not yet built', historicalLineageBehavior: 'orbital history trails' },
    lineage: { pathGeometry: 'trajectories', directionIndication: 'orbital direction', observedRelationshipTreatment: 'stable precise path', inferredRelationshipTreatment: 'broader uncertainty band', pathStrength: 'not yet built', temporalDecayBehavior: 'not yet built', selectedLineageBehavior: 'not yet built' },
    convergence: { layoutAlgorithm: 'gravity-body orbital placement', relevanceToPositionMapping: 'shell_layer per worldVariantEncodingProfiles.js', movementDuration: 'not yet built', easing: 'not yet built', collisionHandling: 'discrete shells reduce overlap by construction', semanticBandBehavior: 'shell = band, direct mapping', topologyPreservation: 'n/a — radial-shell variant like Crystal Basin, not topology-preserving', cameraTransition: 'not yet built' },
    environment: { ...BASELINE_ENVIRONMENT, background: 'modern abstract space field, not a literal starfield' },
    cameraOverrides: {},
    label: { worldSpaceLabels: 'not yet built', htmlOverlays: 'reuse HUD pattern', distanceBasedVisibility: 'not implemented', selectedLabels: 'not yet built', semanticBandLabels: 'shell band on selection', metricBadges: 'not yet built', collisionHandling: 'not implemented' },
  }),
});

const MONETARY_RIVER_COMPONENT_PROFILE = Object.freeze({
  variantKey: 'MONETARY_RIVER_SYSTEM',
  ...structuralOnlyProfile({
    orbit: { geometry: 'basin or major convergence reservoir', scale: 'not yet built', shellBehavior: 'n/a — flow-based, not shell-based', queryActivationBehavior: 'selecting Customer creates a contextual flow field', selectionAnimation: 'not yet built', contextualGravityBehavior: 'relevant data flows toward the Basin', labels: 'context summary at the Basin', metricSummaryPlacement: 'docked' },
    atom: { baseGeometry: 'crystalline data particle', metadataGeometryMapping: 'shared registry mapping', maturityGeometryBehavior: 'not directly a channel here — density is the primary complexity driver', confidenceTreatment: 'path_continuity (well-defined vs. diffuse channel boundary)', stabilityMotion: 'adaptive path (low) vs. established route (high)', selectedState: 'not yet built', hoverState: 'not yet built' },
    molecule: { clusterArrangement: 'structured current formations', spacing: 'not yet built', localRelationshipBehavior: 'not yet built', clusterBounds: 'not yet built', moleculeLabelBehavior: 'not yet built' },
    rod: { geometry: 'longitudinal river channels — three parallel channels for Revenue/Customer/Member', stageSegmentation: 'channel segments', activePosition: 'not yet built', branchBehavior: 'tributaries', mergeBehavior: 'confluences', cycleBehavior: 'not yet built', maturityEncoding: 'not directly mapped in this variant', completenessEncoding: 'not yet built', readinessEncoding: 'not yet built', historicalLineageBehavior: 'historical flow traces' },
    lineage: { pathGeometry: 'flow trace', directionIndication: 'current direction', observedRelationshipTreatment: 'well-defined channel boundary', inferredRelationshipTreatment: 'diffuse/branching uncertainty current', pathStrength: 'not yet built', temporalDecayBehavior: 'not yet built', selectedLineageBehavior: 'not yet built' },
    convergence: { layoutAlgorithm: 'flow-field toward the active Basin', relevanceToPositionMapping: 'fluid_flow_velocity per worldVariantEncodingProfiles.js', movementDuration: 'not yet built', easing: 'not yet built', collisionHandling: 'not yet built', semanticBandBehavior: 'direct channel (core) vs. secondary tributary (contextual) vs. distant low-flow path (peripheral)', topologyPreservation: 'n/a', cameraTransition: 'not yet built' },
    environment: { ...BASELINE_ENVIRONMENT, background: 'abstract translucent surfaces, never a cartoon landscape' },
    cameraOverrides: {},
    label: { worldSpaceLabels: 'not yet built', htmlOverlays: 'reuse HUD pattern', distanceBasedVisibility: 'not implemented', selectedLabels: 'not yet built', semanticBandLabels: 'channel-strength band on selection', metricBadges: 'not yet built', collisionHandling: 'not implemented' },
  }),
});

const ENTERPRISE_HIGHWAY_COMPONENT_PROFILE = Object.freeze({
  variantKey: 'ENTERPRISE_HIGHWAY',
  ...structuralOnlyProfile({
    orbit: { geometry: 'major interchange', scale: 'not yet built', shellBehavior: 'n/a — route-based', queryActivationBehavior: 'selecting Customer recalculates the visible network around Customer-relevant routes', selectionAnimation: 'not yet built', contextualGravityBehavior: 'n/a', labels: 'context summary at the interchange', metricSummaryPlacement: 'docked' },
    atom: { baseGeometry: 'intelligent waypoint', metadataGeometryMapping: 'shared registry mapping', maturityGeometryBehavior: 'not directly mapped in this variant', confidenceTreatment: 'not yet built', stabilityMotion: 'not yet built', selectedState: 'not yet built', hoverState: 'not yet built' },
    molecule: { clusterArrangement: 'operational districts / route complexes', spacing: 'not yet built', localRelationshipBehavior: 'not yet built', clusterBounds: 'not yet built', moleculeLabelBehavior: 'not yet built' },
    rod: { geometry: 'longitudinal routes — three parallel highways for Revenue/Customer/Member', stageSegmentation: 'route segments', activePosition: 'not yet built', branchBehavior: 'exits and alternate route paths', mergeBehavior: 'reconvergence ramps', cycleBehavior: 'not yet built', maturityEncoding: 'not directly mapped in this variant', completenessEncoding: 'route map completeness (corridor_width)', readinessEncoding: 'named, selectable unresolved gates (gate_visibility) — the strongest fit of any variant for Stage Readiness', historicalLineageBehavior: 'route history' },
    lineage: { pathGeometry: 'route history', directionIndication: 'route direction', observedRelationshipTreatment: 'solid route', inferredRelationshipTreatment: 'not yet built', pathStrength: 'not yet built', temporalDecayBehavior: 'not yet built', selectedLineageBehavior: 'not yet built' },
    convergence: { layoutAlgorithm: 'route recalculation around the active Orbit', relevanceToPositionMapping: 'route_priority per worldVariantEncodingProfiles.js', movementDuration: 'not yet built', easing: 'not yet built', collisionHandling: 'not yet built', semanticBandBehavior: 'primary route (core) / major connecting route (strongly related) / secondary route (contextual) / background route (peripheral)', topologyPreservation: 'n/a', cameraTransition: 'not yet built' },
    environment: { ...BASELINE_ENVIRONMENT, background: 'futuristic spatial operating network, never a literal maps clone' },
    cameraOverrides: {},
    label: { worldSpaceLabels: 'named gate labels (e.g. "PRICING TERM CONFLICT") — real requirement, not yet built', htmlOverlays: 'reuse HUD pattern', distanceBasedVisibility: 'not implemented', selectedLabels: 'not yet built', semanticBandLabels: 'route-tier label on selection', metricBadges: 'not yet built', collisionHandling: 'not implemented' },
  }),
});

const NEURAL_CONSTELLATION_COMPONENT_PROFILE = Object.freeze({
  variantKey: 'NEURAL_CONSTELLATION',
  ...structuralOnlyProfile({
    orbit: { geometry: 'semantic anchor', scale: 'not yet built', shellBehavior: 'n/a — force-graph-based', queryActivationBehavior: 'selecting an Orbit changes the graph layout', selectionAnimation: 'not yet built', contextualGravityBehavior: 'graph attraction toward the active anchor', labels: 'context summary at the anchor', metricSummaryPlacement: 'docked' },
    atom: { baseGeometry: 'crystalline semantic node — reuse bipyramid per §XII', metadataGeometryMapping: 'shared registry mapping', maturityGeometryBehavior: 'not directly mapped in this variant', confidenceTreatment: 'edge_certainty_band + internal node clarity', stabilityMotion: 'not yet built', selectedState: 'not yet built', hoverState: 'not yet built' },
    molecule: { clusterArrangement: 'local constellations', spacing: 'force-layout-determined', localRelationshipBehavior: 'preserved molecule/lineage topology — never destroyed for a radial cluster (explicit spec requirement)', clusterBounds: 'not yet built', moleculeLabelBehavior: 'not yet built' },
    rod: { geometry: 'persistent longitudinal node chains', stageSegmentation: 'not yet built', activePosition: 'not yet built', branchBehavior: 'not yet built', mergeBehavior: 'convergence junctions (decisions)', cycleBehavior: 'not yet built', maturityEncoding: 'not directly mapped in this variant', completenessEncoding: 'not yet built', readinessEncoding: 'not yet built', historicalLineageBehavior: 'directed spatial connections, contribution-intelligence-aware (Human/AI/Agent Contribution Event, Decision, Correction, Rejection, Transformation, Artifact, Outcome)' },
    lineage: { pathGeometry: 'directed spatial connection', directionIndication: 'arrow/direction on the edge', observedRelationshipTreatment: 'structural continuity', inferredRelationshipTreatment: 'tension edge, not automatic invalidation', pathStrength: 'not yet built', temporalDecayBehavior: 'not yet built', selectedLineageBehavior: 'not yet built' },
    convergence: { layoutAlgorithm: 'constrained force layout — real candidate input already exists (computeContributionAffinity()/assembleMolecules() in journeyEngine/bonding.js), not yet wired to an actual force simulation', relevanceToPositionMapping: 'graph_attraction per worldVariantEncodingProfiles.js', movementDuration: 'not yet built', easing: 'not yet built', collisionHandling: 'force-layout collision resolution, not yet built', semanticBandBehavior: 'attraction strength substitutes for discrete shells here', topologyPreservation: 'the one variant where this is a hard requirement — real molecule/lineage relationships must never be destroyed to force a radial shape', cameraTransition: 'not yet built' },
    environment: BASELINE_ENVIRONMENT,
    cameraOverrides: {},
    label: { worldSpaceLabels: 'contribution-type labels (Human/AI/Agent) — not yet built', htmlOverlays: 'reuse HUD pattern', distanceBasedVisibility: 'not implemented', selectedLabels: 'not yet built', semanticBandLabels: 'not yet built', metricBadges: 'not yet built', collisionHandling: 'not implemented' },
  }),
});

const MATURITY_LATTICE_COMPONENT_PROFILE = Object.freeze({
  variantKey: 'MATURITY_LATTICE',
  ...structuralOnlyProfile({
    orbit: { geometry: 'n/a — no active query context required, no gravity-center Orbit', scale: 'n/a', shellBehavior: 'n/a', queryActivationBehavior: 'n/a — inspectable independent of any query', selectionAnimation: 'not yet built', contextualGravityBehavior: 'n/a', labels: 'n/a', metricSummaryPlacement: 'docked, per-node purpose breakdown' },
    atom: { baseGeometry: 'reuse bipyramid vocabulary per §XII', metadataGeometryMapping: 'shared registry mapping', maturityGeometryBehavior: 'nesting_depth + facetCountForMaturity() per purpose — already real at the atom level, nesting composition is Phase 5/6', confidenceTreatment: 'crystal_clarity for STATE_CONFIDENCE, strictly separate from maturity', stabilityMotion: 'not applicable the same way — this variant has no query-convergence stability concept', selectedState: 'not yet built', hoverState: 'not yet built' },
    molecule: { clusterArrangement: 'Atom -> Cluster -> Molecule nesting hierarchy, the variant\'s primary spatial organizing principle', spacing: 'nesting-depth-determined', localRelationshipBehavior: 'not yet built', clusterBounds: 'not yet built', moleculeLabelBehavior: 'purpose name (legal/billing/rev-rec/...) per nesting level' },
    rod: { geometry: 'not the primary structure in this variant — the crystal-growth hierarchy is', stageSegmentation: 'n/a', activePosition: 'n/a', branchBehavior: 'n/a', mergeBehavior: 'n/a', cycleBehavior: 'n/a', maturityEncoding: 'the entire variant IS the maturity encoding', completenessEncoding: 'folded into per-purpose maturity', readinessEncoding: 'n/a', historicalLineageBehavior: 'not the focus of this variant' },
    lineage: { pathGeometry: 'n/a — not a lineage-focused variant', directionIndication: 'n/a', observedRelationshipTreatment: 'n/a', inferredRelationshipTreatment: 'n/a', pathStrength: 'n/a', temporalDecayBehavior: 'n/a', selectedLineageBehavior: 'n/a' },
    convergence: { layoutAlgorithm: 'n/a — no query convergence in this variant by design', relevanceToPositionMapping: 'n/a', movementDuration: 'n/a', easing: 'n/a', collisionHandling: 'n/a', semanticBandBehavior: 'n/a — maturity level substitutes for relevance band', topologyPreservation: 'n/a', cameraTransition: 'not yet built' },
    environment: BASELINE_ENVIRONMENT,
    cameraOverrides: {},
    label: { worldSpaceLabels: 'purpose labels at each nesting level — not yet built', htmlOverlays: 'reuse HUD pattern for the per-purpose breakdown', distanceBasedVisibility: 'not implemented', selectedLabels: 'not yet built', semanticBandLabels: 'n/a', metricBadges: 'per-purpose maturity badge — not yet built', collisionHandling: 'not implemented' },
  }),
});

export const WORLD_VARIANT_COMPONENT_PROFILES = Object.freeze({
  CRYSTAL_BASIN: CRYSTAL_BASIN_COMPONENT_PROFILE,
  TEMPORAL_CANYON: TEMPORAL_CANYON_COMPONENT_PROFILE,
  ORBITAL_INTELLIGENCE: ORBITAL_INTELLIGENCE_COMPONENT_PROFILE,
  MONETARY_RIVER_SYSTEM: MONETARY_RIVER_COMPONENT_PROFILE,
  ENTERPRISE_HIGHWAY: ENTERPRISE_HIGHWAY_COMPONENT_PROFILE,
  NEURAL_CONSTELLATION: NEURAL_CONSTELLATION_COMPONENT_PROFILE,
  MATURITY_LATTICE: MATURITY_LATTICE_COMPONENT_PROFILE,
});

export function getWorldVariantComponentProfile(variantKey) {
  return WORLD_VARIANT_COMPONENT_PROFILES[variantKey] || null;
}

const REQUIRED_PROFILE_KEYS = Object.freeze(['orbit', 'atom', 'molecule', 'rod', 'lineage', 'convergence', 'environment', 'camera', 'label']);

// §VII: "fail if a required profile is missing." Every variant registered here must carry all nine
// systems (even if individual FIELDS inside a system are honestly "not yet built") — a variant
// missing a whole profile system is a real registration failure, not a documented gap.
export function validateWorldVariantComponentProfile(variantKey) {
  const errors = [];
  if (!WORLD_VARIANT_REGISTRY[variantKey]) errors.push(`${variantKey}: not present in WORLD_VARIANT_REGISTRY`);
  if (!getVisualEncodingProfile(variantKey)) errors.push(`${variantKey}: no VisualEncodingProfile (Phase 3) — a component profile needs the encoding it renders to already exist`);
  const profile = getWorldVariantComponentProfile(variantKey);
  if (!profile) { errors.push(`${variantKey}: no component profile registered`); return errors; }
  for (const key of REQUIRED_PROFILE_KEYS) {
    if (!profile[key]) errors.push(`${variantKey}: missing required profile system "${key}"`);
  }
  return errors;
}

export function validateAllWorldVariantComponentProfiles() {
  const errors = [];
  for (const variantKey of Object.keys(WORLD_VARIANT_COMPONENT_PROFILES)) {
    errors.push(...validateWorldVariantComponentProfile(variantKey));
  }
  return errors;
}
