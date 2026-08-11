# Salt Basin World Variant Engine — Progress Tracker

Mutable state for the `salt-basin-world-variants` skill. Read first, update last, on every invocation.
Static phase definitions live in `.claude/skills/salt-basin-world-variants/reference/phases.md` — don't
duplicate that content here, just track status and findings.

## Phase status

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Inspect Existing 3D Implementation & Naming-Collision Audit | done | See findings below. |
| 2 | World Variant Domain, Registry & Semantic Invariant Reconciliation | done | `src/config/visual/worldVariantRegistry.js`. See below. |
| 3 | Visual Encoding Profile + Variant Configuration Schema + Validation | done | `src/config/visual/worldVariantEncodingProfiles.js`. See below. |
| 4 | Variant Component Profiles | done | `src/config/visual/worldVariantComponentProfiles.js`. See below. |
| 5 | First 3 fully rendered/interactive variants (Crystal Basin, Orbital Intelligence, Temporal Canyon) | in progress (Crystal Basin + Temporal Canyon slices done) | See below. Orbital Intelligence not started; neither built variant is fully DoD-item-7-complete yet (see remaining gaps per variant). |
| 6 | Remaining 3 structural variants (Monetary River, Enterprise Highway, Neural Constellation) | not started | Depends on Phases 2–4. `MATURITY_LATTICE` (7th variant, added 2026-07-12) is not yet assigned to Phase 5 or 6 — schedule it when its build is picked up. |
| 7 | Variant Switcher, Interaction Intent Layer & Comparison Mode | not started | Depends on Phase 5. Its "side-by-side Variant Comparison mode" line item is now partially prototyped outside this skill's own phase sequence — see the "Dashboard Definition View" entry below (2026-08-10, `flickering-petting-brook` plan) — real split-viewport rendering exists (`activateDashboard()`, `dashboardDefinitionRegistry.js`) but with a shared camera (no independent per-lens framing) and selection disabled while active. Full Phase 7 (Interaction Intent layer, per-lens cameras, preserved semantic state across switches) is still not started. |
| 8 | Presets/Inheritance, Variant Creation Studio, Explanation Mode, Temporal Playback | not started | Depends on Phases 3, 5/6 |
| 9 | Performance, Cross-Variant Customer Orbit Reference, Evaluation Report & Closeout | not started | Depends on Phases 5–8 |

## Open decisions requiring a Betsy answer (do not default)

None currently open.

## Resolved decisions

1. **`WORLD_REGISTRY` naming collision — RESOLVED 2026-08-10.** Betsy chose option (c): compose the two axes
   as `worldId × variantKey` rather than finishing `WORLD_REGISTRY` as a fully separate switcher (a) or
   renaming/retiring it (b). Built `src/config/visual/worldCompositionRegistry.js`: `resolveWorldComposition
   (worldId, variantKey)` resolves a read-only `{ worldId, world, variantKey, variant, errors }` pair from the
   two existing registries without merging or duplicating either one's data — content still comes from
   `WORLD_REGISTRY`, spatial/rendering config still comes from `WORLD_VARIANT_REGISTRY`.
   `resolveDefaultVariantForWorld(worldId)`/`WORLD_DEFAULT_VARIANT` give each content-domain world a default
   variant (currently `CRYSTAL_BASIN` for all seven — the only variant with any real rendering behind it).
   `validateWorldCompositionRegistry()`: 0 errors, all 7 worlds resolve. Not wired into
   `SpatialJourneyWorld.jsx` — the live renderer still doesn't read `worldId` for scene construction (Phase 1's
   finding stands); wiring the composed result into the renderer is Phase 7's (Variant Switcher) job, matching
   this build's declare-before-render sequencing every other phase has followed. One open observation recorded
   in the new file's header, not acted on: `WORLD_REGISTRY`'s `choreography` field is arguably a variant
   (spatial-metaphor) concern, not a content-domain one — worth Phase 7's design attention, not a reason to
   revisit this naming decision. Config-audit self-check: `Object.freeze` idiom throughout, no calculation
   weights, no per-member/org hardcoding, `DEFAULT_VARIANT_KEY` is a presentation default not a business rule
   — no findings requiring conversion.

2. **7th variant concept — RESOLVED 2026-07-12.** Betsy asked to add a 7th variant beyond the master
   prompt's six named ones, initially chose "just reserve the slot" (registered as `RESERVED_VARIANT_7`,
   `status: 'planned'`, no concept), then supplied the concept in the same session: "Crystal Atom / Molecule
   / Cluster evidence maturity." Renamed to `MATURITY_LATTICE` ("Crystal Lattice Observatory"),
   `status: 'registered'`, `worldFamily: 'lattice'` (new family value — its primary spatial axis is
   intrinsic structural maturity via the Atom→Cluster→Molecule nesting hierarchy, not query relevance/
   convergence, which is what every other variant organizes around; this passes the §XVIII "materially
   different spatial model" differentiation bar rather than being a Crystal Basin reskin even though it
   reuses the same crystal geometry vocabulary). Primary metric: `ROD_MATURITY`'s 7-dimension composite
   (Definition/Evidence/Lineage/Validation/Temporal/Relationship/**Reconciliation** — the 7th dimension
   Betsy added immediately after, see the changelog entry below), `semanticModelVersion:
   'rod-mathematics-v1'`. No active query context required to view it — a deliberate difference from the
   other six, which are all query-convergence-driven. Now needs a Phase 5/6/7-equivalent build slot
   assigned once Phase 3/4 profile work reaches it — not yet scheduled into a specific phase number.

3. **"Orbin" vs. "Orbit" — RESOLVED 2026-07-12.** Betsy confirmed "Orbin" (as it appeared in the master
   prompt text) was shorthand/typo for "Orbit," not a new, intentional, distinct term. "Orbit" is canonical
   — matches the already-shipped code (`SpatialJourneyWorld.jsx`'s "Customer Orbit — {entityLabel}") and
   the same resolution already recorded in `docs/salt-basin-visual-metrics-progress.md`, which shared this
   open decision. Every reference to "Orbin" in this skill's files has been corrected to "Orbit."

## Phase 1 — Existing 3D Implementation Audit (done 2026-07-12)

Inspected directly: `package.json`, `src/components/SpatialJourneyWorld.jsx` (1553 lines, full read of
lines 1–260 and 600–900, targeted grep for the remainder), `src/config/visual/worldRegistry.js`,
`src/config/visual/visualSemanticRegistry.js`, `src/lib/journeyEngine/atomGeometry.js`,
`src/lib/journeyEngine/layout.js`, `src/lib/journeyEngine/pathColor.js`. Cross-checked against
`docs/salt-basin-visual-metrics-progress.md`'s own Phase 1 audit (same codebase, adjacent concern) and
`docs/salt-basin-master-build-progress.md`'s Loop 9/10/11/18 rows.

### Renderer & scene graph

Raw **`three`** (`^0.185.1` in `package.json`) — no React Three Fiber, no Babylon.js, no WebGPU renderer
anywhere in the repo. The entire 3D world lives in one component, `SpatialJourneyWorld.jsx`, which mounts
everything imperatively inside a single `useEffect`: scene, skybox (a hand-built vertical-gradient sphere,
not an HDRI), lighting (ambient + 2 directional + 1 point, brand-palette-driven via `readBrandPalette()`
reading `--sb-*` CSS custom properties at mount), ground plane + `GridHelper`, camera, renderer, raycaster,
and a plain-JS `world` object holding the whole scene-graph registry (`meshRegistry: Map`, `atomGroups`,
`atomParts`, `atomHalos`, `atomLines`, `atomConflictRings`, `stageMeshes`, `connectors`, `moleculeShells`,
`gateBeacons`, `reconciliationZones`, `raycastMeshes: []`, ...). This is not a declarative scene graph — it's
hand-managed mutable state closed over by the effect. Any variant engine built on top of this must either
(a) formalize this `world` object's shape into the profile-resolved builder contract, or (b) introduce a
thin declarative layer above it; it should not pretend a React-tree scene graph already exists.

### Camera architecture

Hand-rolled spherical-orbit camera, not `OrbitControls`/drei: `spherical = { radius, theta, phi }` with a
parallel `sphericalGoal`, lerp-smoothed toward the goal every frame (`entered ? 0.07/0.08 : 0.012/0.01`
factors — slower drift before the world is "entered"). `cameraTarget`/`cameraTargetGoal` (a `Vector3`) is
lerped the same way. Primitives already exist and are reusable as the Camera Profile baseline: `resetView()`,
`focusPoint(pos, radius)`, `zoomBy(delta)`, `enterWorld()`. No pan — only orbit (drag) + zoom (wheel/pinch).

### Interaction & raycasting

Manual `pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`wheel` listeners on the canvas: single-pointer
drag rotates (`sphericalGoal.theta`/`phi`), two-pointer pinch zooms, wheel zooms, `+`/`-`/`0` keys zoom/reset.
Click detection is a single `THREE.Raycaster` cast against a flat `world.raycastMeshes` array on pointer-up
(only if the pointer didn't drag and released within 400ms), resolving to a `world.meshRegistry` entry and
dispatched via `apiRef.current?.onSceneEntitySelected?.(entry)`. **No Interaction Intent / semantic-action
dispatch layer exists** — selection handlers call scene-mutation functions directly (see Convergence
Animation below), which is precisely the `moveNodesToRadius()`-from-a-component anti-pattern §XV of the
master prompt names.

### Convergence animation ("Customer Orbit")

`runCustomerOrbit(entityLabel, onProgress, onComplete)` (~line 649) and `runStageQuery(sKey)` (~line 627)
are the existing convergence mechanism. Both directly compute target `Vector3` positions inline and set
`group.userData.state = 'converging'` / `'hashConverging'`; a single `animate()` state machine
(`orbit → converging → atStage → returning`, plus `hashConverging → atHash`) interpolates position every
frame via `lerpVectors`/`smoothstep`. Two concrete, load-bearing findings:

1. **Radial/ring placement is pure index-based fan-out, not metric-driven.** `runCustomerOrbit`:
   `angle = (i / n) × 2π`, `ring = 3 + (i % 3) × 0.8`, then `target = hashNodePos + (cos(angle)×ring, ...,
   sin(angle)×ring)`. There is no Query Relevance (or any other metric) input to this placement at all —
   confirms `salt-basin-visual-metrics` Phase 1's finding that no Query Relevance Score exists yet, and
   additionally shows the *geometry* of convergence (not just the missing metric) is hardcoded index math,
   exactly what §IV's Visual Encoding Profile and §VI's Convergence Profile are meant to replace with a
   declared `relevance → radius` mapping function.
2. **No Interaction Intent layer — this is the literal anti-pattern §XV names, not a hypothetical.**
   `runCustomerOrbit()`/`runStageQuery()` are called directly from selection-handling code with the ring/angle
   math inlined in the same function. Phase 7 of this skill's build must replace this call chain with a
   dispatched `ACTIVATE_QUERY_CONTEXT`/`SELECT_CONTEXT_ORBIT` intent resolved by the active variant's
   Convergence Profile — not merely describe doing so while leaving the inline math in place.

The separate "hash node" (large icosahedron, `buildHashNodeMesh`) represents the compound-query result —
atoms transition `converging → atStage` then, after a fixed delay (`HASH_PHASE1 + HASH_HOLD` seconds),
`hashConverging → atHash` toward `world.hashNodePos`. `releaseHash()` reverses this. This two-stage
approach (per-stage query, then compound-hash convergence) is a real, reusable choreography shape for the
Convergence Profile — it's the placement math inside it that's hardcoded, not the state-machine shape
itself, which is worth preserving.

### Node/geometry vocabulary (Crystal Basin's real starting point)

`src/lib/journeyEngine/atomGeometry.js` already implements a coherent crystal vocabulary, explicitly
separate from the brand-mark crystal system (`crystalGeometry.js`/`SaltBasinCrystal.jsx`/
`CrystalOfficeScene.jsx`/`CrystalRoomScene.jsx`/`CrystalMark.jsx`/`CrystalMarkField.jsx` — a different
contract for product-mark rendering, not domain atoms, per that file's own header comment):

- **bipyramid** (`getBipyramidParts` — two cones joined base-to-base, radial-segment count varies) = atom
- **hex-drum cylinder** (`buildStageAnchorMesh`) = stage anchor
- **wire icosahedron** (`buildMoleculeShellMesh`) = molecule shell
- **large icosahedron** (`buildHashNodeMesh`) = compound-query / Customer-360 hash node
- **torus** (`buildReconciliationRingMesh`) = Confluence reconciliation zone
- **cone pin** (`buildHomeAnchorPinMesh`) = home-anchor tether
- **thin additive-blended column** (`buildGateBeaconMesh`) = gate/objective beacon
- **canvas-gradient glow sprite** (`buildGlowSprite`, cached per color) = generic emphasis halo

`buildAtomMaterial(THREE, visual)` takes a pre-computed `visual` object (`colorHex`, `metalness`,
`roughness`, `opacity`, `emissiveColor`, `emissiveIntensity`) — that `visual` object is produced by
`maturity.js`'s `computeAtomVisual()`, which already correctly separates semantic maturity (input) from
rendering channels (output: scaleY/facet/opacity/metalness/roughness/emissiveIntensity/haloIntensity) —
same positive finding `salt-basin-visual-metrics` Phase 1 recorded. This is the template Phase 4's Atom
Profile should formalize, not redesign.

### Rod / branch layout

`src/lib/journeyEngine/layout.js`'s `computeRodLayout()` is **not** a naive three-parallel-corridor model —
it's already gate-driven and non-parallel: each non-root rod declares `parentRodId` + `originGateId` +
`branchAngleDeg`/`branchElevation`, and its stages fan outward from the parent's resolved origin-gate
position along a direction rotated off the parent's own direction. Which rod is root is decided by
`genesis.js`, not by `layout.js`. `computeGateDimensionRibs()` fans deal-dimension atoms (price model,
billing terms, segment, parties, deal size) out radially from a single gate point — explicitly documented
in the file's own header as "not a fourth parallel rod." This is a materially better starting point for
Temporal Journey Canyon and Enterprise Highway than a from-scratch parallel-highway build — extend this
module's origin/direction/angle model in Phases 5/6 rather than inventing a second layout algorithm.

### Permanent path color (§XII)

`src/lib/journeyEngine/pathColor.js` is a real, deterministic implementation of the exact rule §XII asks
for: `PINNED_PATH_COLORS` (revenue=gold/`0xC4843A`, customer=teal/`0x4A7C8E`, member=mauve/`0x8C6B7A`)
for the three named rod types, plus `resolvePathColor()` falling back to a stable string-hash into
`FALLBACK_PATH_PALETTE` for everything else (molecule ids, branch ids, master-data-rod ids) — same
semantic path always resolves to the same color, never derived from array order or object identity. A
reserved `RISK_COLOR` always overrides for conflicts/risk regardless of owning rod/molecule. **Reuse this
unchanged in every variant** — do not build a second color-resolution system.

### Existing visual-rule registries (extend, don't replace)

- `src/config/visual/visualSemanticRegistry.js` — `VISUAL_SEMANTIC_REGISTRY` maps semantic **object type**
  (`evidence_atom`, `atom_cluster`, `semantic_composition`, `journey_rod`, `journey_tributary`) to
  `geometryId`/`materialId`/`colorRule`/`outlineRule`/`lightingRule`/`opacityRule` + a plain-language
  `meaning` string; `legendEntries()` already produces a legend-ready array. This is keyed by object type,
  not by metric — Phase 3's Visual Encoding Profile is the metric-keyed layer this doesn't have yet.
- `src/config/visual/worldRegistry.js` — see the naming-collision open decision above. `WORLD_REGISTRY`
  entries (foundation/journey/query/career/pricing/infrastructure/templates) each declare a `choreography`
  key resolved through `ROTATION_CHOREOGRAPHY_REGISTRY` (`angularVelocity`/`elevation`/`distance`/`easing`)
  — real config shape, **zero runtime consumers**: `worldId` only drives a `<select>` (line ~1159) and a
  `pulseViewingLabel()` toast (line ~1159); nothing in `orbitPosition()`, camera setup, or scene
  construction reads `activeWorld` or its `choreography`. Confirms this is scaffolding, not a working
  content-domain renderer yet — relevant context for whichever way the open naming decision resolves.

### Data loading / performance

No `fetchNodes(bounds, zoom)` or equivalent adapter of any kind. `SEED_LEADS.forEach(({ leadContext,
entityLabel }) => spawnFromLead(leadContext, entityLabel))` runs synchronously at mount and builds the
entire seed dataset's meshes immediately — no viewport-bounds loading, no LOD, no `THREE.InstancedMesh`
anywhere in the file, no spatial indexing, no worker-based layout. This matches (does not contradict)
`docs/salt-basin-master-build-progress.md` Loop 18's existing finding ("no LOD/instancing anywhere in
`src/`") and that tracker's own sequencing note that meaningful performance work needs Loop 10 (World
Navigation, also `not started`) first. Phase 9 of this skill is where LOD/viewport-loading gets addressed
specifically for the variant engine — sequenced last, after real variants and a real switcher exist to
measure.

### Rendering / Semantic classification summary (mirrors the visual-metrics Phase 1 format)

- **Rendering mathematics (correctly separated already):** `computeAtomVisual()`'s scaleY/facet/opacity/
  metalness/roughness/emissive outputs; the convergence animation's `lerpVectors`/`smoothstep` interpolation;
  the spherical-camera lerp; all raw Three.js world-space positions from `layout.js`/`computeRodLayout`.
  No violations found — preserve as the rendering-layer template.
- **Semantic mathematics that exists but has no configurable visual mapping yet:** rod/atom maturity
  (real, feeds `computeAtomVisual` directly — good); permanent path color (real, `pathColor.js` — good).
- **Semantic mathematics that does not exist yet, blocking real relevance-driven convergence:** Query
  Relevance/Coverage/Confidence, Convergence Stability — same gap `salt-basin-visual-metrics` Phase 1
  already found; this skill's Phase 2 depends on that skill's Phase 2/3 landing before Crystal Basin's
  "distance = relevance" or Orbital Intelligence's "orbital radius = relevance" mappings can be real rather
  than the current index-based fan-out.
- **Configuration scaffolding present but not yet load-bearing:** `WORLD_REGISTRY` +
  `ROTATION_CHOREOGRAPHY_REGISTRY` (cosmetic only, see naming-collision decision);
  `VISUAL_SEMANTIC_REGISTRY` (real for object-type rules, no metric-keyed layer yet).

## World Variant Domain, Registry & Semantic Invariant Reconciliation (Phase 2 — done 2026-07-12)

Built `src/config/visual/worldVariantRegistry.js`:

- **`WorldVariant` shape + `WORLD_VARIANT_REGISTRY`** — all §II fields (`variantId`/`variantKey`/
  `displayName`/`description`/`worldFamily`/`semanticModelVersion`, the 15 profile-id fields, `status`,
  `createdAt`/`updatedAt`/`version`), with all six §V variant keys registered
  (`CRYSTAL_BASIN`, `ORBITAL_INTELLIGENCE`, `MONETARY_RIVER_SYSTEM`, `ENTERPRISE_HIGHWAY`,
  `NEURAL_CONSTELLATION`, `TEMPORAL_CANYON`) — satisfies DoD §XIX item 6. Every profile-id field is `null`
  for now (Phase 3/4 build the profiles); `status: 'registered'` reflects that honestly rather than
  claiming more than exists. A `WORLD_VARIANT_STATUS` enum (`registered` / `structural` / `interactive`)
  gives later phases a real place to record DoD items 6/7/8 as they land, instead of a single boolean.
- **Named, distinct from `WORLD_REGISTRY`.** Deliberately a new file (`worldVariantRegistry.js`, not an
  extension of `worldRegistry.js`) with no import between the two — keeps the open naming-collision decision
  live and answerable either way, rather than pre-committing an architecture that assumes one outcome.
- **Semantic invariant reconciliation (§III).** `WORLD_VARIANT_SEMANTIC_INVARIANTS` lists the 11 invariant
  keys **by reference** to `METRIC_DEFINITION_REGISTRY` (imported, not redefined) plus
  `validateSemanticInvariantCoverage()`, which checks both directions: every §III invariant has a real
  registry entry, and every registry entry is accounted for as a declared invariant. Ran it against the live
  registry — **0 errors, exact 11/11 match.** One real naming variance found and recorded (not silently
  resolved): the spec's §III heading is "Journey Position," the shipped registry (built by
  `salt-basin-visual-metrics`) calls the same metric `ROD_POSITION`. Used the shipped key — one metric, one
  name, sourced from the registry that already exists, not a second parallel term.
- **Permanent path color (§XII) — confirmed, not re-implemented.** No color-resolution code added to this
  registry; a comment directs every future Rod/Lineage profile (Phase 4) to import `resolvePathColor()`/
  `PINNED_PATH_COLORS` from `src/lib/journeyEngine/pathColor.js` directly, unchanged.
- **Validation.** `validateWorldVariantRegistry()` checks key/id consistency, duplicate ids, valid `status`
  values, and a present `worldFamily`. Ran both validators via a direct Node ESM import (no test runner in
  this repo per `CLAUDE.md`) — `validateWorldVariantRegistry()`: 0 errors; `validateSemanticInvariantCoverage()`:
  0 errors; 6 variants confirmed registered.
- **Config-audit self-check (this phase's step 4/5).** Walked `salt-basin-config-audit`'s checklist against
  this file: follows the same `Object.freeze` source-registry idiom already established by
  `visualSemanticRegistry.js`/`objectTypeRegistry.js`/`metricCategoryRegistry.js` (not a deviation); no
  hardcoded per-member/org differentiation; no calculation weights (correctly out of scope — those belong to
  Phase 3's methodology, same sequencing boundary `salt-basin-visual-metrics` already drew for its own Phase
  2/3 split); fixed enums (`WORLD_VARIANT_STATUS`, `WORLD_VARIANT_FAMILY`) match the existing fixed-taxonomy
  pattern (`METRIC_CATEGORY_REGISTRY`'s 10 categories), not an ad hoc addition. No findings requiring
  conversion.
- **Concurrent-session cross-check.** `salt-basin-visual-metrics`'s own Phase 2 changelog entry flagged this
  skill by name and asked a future `/visual-metrics` invocation to check here before its Phase 5 — confirmed
  no divergent visual-encoding registry was created on this side; `metricVisualEncodingRegistry.js` (that
  skill's Phase 5 output) is the one global encoding registry today and is exactly what Phase 3 of this skill
  generalizes into six per-variant profiles, not a second registry to reconcile against.

## Visual Encoding Profile + Variant Configuration Schema + Validation (Phase 3 — done 2026-07-30)

Built `src/config/visual/worldVariantEncodingProfiles.js`:

- **`VISUAL_CHANNEL` enum + `CURVE_TYPE` enum** — the §IV channel vocabulary (radial distance,
  orbital radius, crystal complexity, crystal clarity, bounded movement, settlement state, route
  priority, gate visibility, graph attraction, illumination intensity, nesting depth, ...) as fixed
  values, not free-text strings a profile could misspell into a silent duplicate. `crystal_clarity`
  is deliberately its own channel, not `opacity` — the master prompt explicitly warns against using
  flat opacity where it would make the object unreadable (§V Variant 1).
- **Seven `VisualEncodingProfile` objects**, one per registered variant (all six named + `MATURITY_LATTICE`),
  each a short list of `{ metricKey, visualChannel, curveType, min/maxVisualValue, animationBehavior,
  labelBehavior, interactionBehavior, explanationText, implementedBy }` entries — not every one of
  the 12 metric invariants forced into every variant (§IV: "one visual channel should represent one
  primary semantic concept within a variant"); which metrics appear per variant follows the master
  prompt's own §V per-variant sections and §XVI's cross-variant Customer Orbit reference verbatim,
  not an invented grouping. `implementedBy` names the real function where one already exists
  (`resolveQueryDistance()` for Crystal Basin's relevance→radial-distance, `facetCountForMaturity()`
  for maturity→crystal-complexity in both Crystal Basin and Temporal Canyon) and is `null` where
  Phase 4+ still needs to build the renderer — this file declares and validates the mapping, it does
  not invent a second rendering-math layer.
- **`MATURITY_LATTICE`'s deliberate exception.** Its own Phase 2 registry entry already documents
  "no active query context required" — this phase adds `requiresQueryContext: false` on its profile
  so the validator can exempt it from the Query-Relevance-required rule explicitly, not silently.
  All six query-convergence variants keep a required `QUERY_RELEVANCE` encoding.
- **`QUERY_RELEVANCE_BANDS`** — one shared CORE/STRONGLY_RELATED/CONTEXTUAL/WEAK/PERIPHERAL band
  definition (§III/§V's semantic bands), reused by every relevance-driven variant's profile rather
  than five variants each inventing their own thresholds.
- **`validateVisualEncodingProfile()` / `validateAllVisualEncodingProfiles()`** — real §VII
  validation, not a described-but-unenforced rule: fails if Query Relevance has no encoding (unless
  `requiresQueryContext: false`), fails if two encodings in the same variant claim the same visual
  channel for different metrics (channel-collision), fails if a metric key isn't in
  `METRIC_DEFINITION_REGISTRY`, fails if a rendering-only value (`cameraDistance`,
  `animationProgress`, raw `x`/`y`/`z`, ...) is registered as if it were a semantic metric. Ran
  live via direct Node ESM import (no test runner in this repo per `CLAUDE.md`): **0 errors across
  all 7 variants.**
- **`resolveWorldVariantConfig(variantKey)` / `validateWorldVariantConfig(variantKey)`** — the §VII
  typed `WorldVariantConfig`, composing Phase 2's registry entry (profile IDs, mostly still `null`
  pending Phase 4) with this phase's real `visualEncodingProfile`. The "required profile is missing"
  validation rule only fires once a variant's `status` is `structural`/`interactive` — a `null`
  `geometryProfile` on a `registered`-status variant is expected (Phase 4 hasn't run yet), not a
  permanent failure; this keeps the validator honest about what Phase 3 vs. Phase 4 actually owns.
- **Config-audit self-check.** Follows the same `Object.freeze` source-registry idiom as
  `worldVariantRegistry.js`/`visualSemanticRegistry.js`; no calculation weights added (correctly out
  of scope, same boundary Phase 2 and `salt-basin-visual-metrics` Phase 2/3 already drew); no
  hardcoded per-member/org differentiation; fixed enums match the existing fixed-taxonomy pattern.
  No findings requiring conversion.
- **Reused, not rebuilt:** `resolveQueryDistance()` (already live in `runCustomerOrbit()`) and
  `facetCountForMaturity()`/`computeAtomVisual()` (already live, see Task #14 in this session's
  separate LoneTree/SpatialJourneyWorld work) are referenced by `implementedBy`, confirming Crystal
  Basin's relevance-distance and maturity-complexity channels are not just declared but already
  rendering in the live app today — ahead of where this skill's own Phase 1 audit found things,
  because `salt-basin-visual-metrics` Phase 6 and a concurrent maturity-engine build landed in
  between.

## Variant Component Profiles (Phase 4 — done 2026-07-30)

Built `src/config/visual/worldVariantComponentProfiles.js`: nine §VI profile-type factories
(`orbitProfile`, `atomProfile`, `moleculeProfile`, `rodProfile`, `lineageProfile`,
`convergenceProfile`, `environmentProfile`, `cameraProfile`, `labelProfile`), each enforcing the
exact field set §VI names — a missing field is a real object-shape error, not a silent gap.

- **Depth over breadth, and said so explicitly.** Crystal Basin and Temporal Journey Canyon (the two
  variants phases.md's own Phase 5 note flags as extending real existing code) got fully real
  profiles: every `builder` field names the actual function it composes
  (`getBipyramidParts()`/`buildAtomMaterial()`/`computeAtomVisual()` for atoms,
  `computeRodLayout()` for Temporal Canyon's rod geometry, `resetView()`/`focusPoint()`/`zoomBy()`/
  `enterWorld()` formalized once as `BASELINE_CAMERA` and reused by every variant, not
  reimplemented seven times). Where a field genuinely has no renderer yet (confidence-as-clarity,
  stability-driven motion, discrete relevance-shell banding, dashed/segmented inferred-lineage
  paths), the value says `'not yet built'` or `null` — matching Phase 3's `implementedBy: null`
  convention — rather than a fabricated implementation claim.
- **The other five variants (Orbital Intelligence, Monetary River, Enterprise Highway, Neural
  Constellation, Maturity Lattice)** got real, spec-faithful profile structure — every field's
  content is drawn directly from that variant's own §V section (e.g. Enterprise Highway's
  `readinessEncoding` is literally "named, selectable unresolved gates... the strongest fit of any
  variant for Stage Readiness," matching §V Variant 4's PRICING TERM CONFLICT example) — with
  `builder: null` throughout, since none of their renderers exist yet. This satisfies DoD item 6
  (six-plus variants registered) honestly; it does not claim DoD items 7/8 (rendered/interactive),
  which are Phase 5/6's job.
- **Baseline Camera and Environment profiles formalized once**, not duplicated per variant —
  `BASELINE_CAMERA` documents the real current hand-rolled spherical camera
  (`spherical{radius,theta,phi}`, lerp factors `0.07/0.08` entered vs. `0.012/0.01` pre-entry,
  `resetView()`→`{radius:62,theta:0.6,phi:1.05}`), every variant either reuses it directly or
  overrides only the specific field it needs (Temporal Canyon's `rodTraversalBehavior`).
- **Validation.** `validateWorldVariantComponentProfile()`/`validateAllWorldVariantComponentProfiles()`
  check that a variant has a real `VisualEncodingProfile` (Phase 3) before a component profile can
  reference it, and that all nine required profile systems are present (a whole missing system is a
  real §VII "required profile is missing" failure). Ran live via direct Node ESM import: **0 errors
  across all 7 variants.**
- **Status intentionally NOT bumped.** `WORLD_VARIANT_STATUS` stays `registered` for every variant
  after this phase, including Crystal Basin — this file is a config/documentation layer describing
  what's real and what isn't; `SpatialJourneyWorld.jsx` does not yet import or resolve through
  `worldVariantComponentProfiles.js` at all, so nothing about the live renderer changed in this
  phase. Bumping to `structural` ("profiles wired and rendering") is Phase 5's claim to earn, not
  this phase's.
- **Config-audit self-check.** Same `Object.freeze` factory-function idiom as every other registry
  in this file family; no calculation weights, no member/org hardcoding. No findings requiring
  conversion.

## First Three Variants — Crystal Basin slice (Phase 5, partial — 2026-07-30)

Real rendering changes landed in `SpatialJourneyWorld.jsx`'s `runCustomerOrbit()` and its `animate()`
loop — the first Phase 5 work that touches the live renderer, not just config:

- **Organized dimensional shells, for real.** Atoms converging on the hash node are now grouped by
  their real per-atom `QUERY_RELEVANCE` band (`entry.band.key`, already computed by
  `calculateQueryRelevance()`/`bandFor()` in `queryConvergence.js`) and placed at a discrete shell
  radius (`shellRadiusForBand()`, new export in `worldVariantEncodingProfiles.js`) instead of one
  continuous relevance-to-radius gradient — closing the exact gap §V Variant 1 names ("organized
  dimensional shells... rather than one dense ball"). Within a shell, atoms fan out evenly
  (`angle = i/n * 2pi` per band, not globally), so same-band atoms read as a clean ring.
- **Fixed a real duplication caught mid-build**: `worldVariantEncodingProfiles.js`'s
  `QUERY_RELEVANCE_BANDS` was a second, differently-cased copy of
  `QUERY_CONVERGENCE_METHODOLOGY.relevance.bands` (`CORE` vs `core`, etc.) — the exact "one metric,
  two names" drift the config-audit discipline exists to catch. Fixed to re-export the real
  methodology bands directly; `shellRadiusForBand()` and every atom's actual `.band.key` now agree
  by construction, not by two lists staying in sync manually.
- **Query Confidence -> crystal clarity, Query Stability -> bounded motion, both real** — applied to
  `world.hashNode`'s material (`roughness`/`clearcoat` lerp toward confidence-derived targets) and
  position (sinusoidal bounded wobble scaled by `1 - stability`, zero at full stability) in the
  `animate()` loop. Only entity-level values exist today (`triangulateEntity()`'s
  `queryConfidence`/`convergenceStability`) — per-atom confidence/stability isn't calculated
  anywhere yet, so this applies to the one object (the hash node) where a real value exists, not to
  every atom individually. Both null-guarded: when the seeded entity has "not enough governed
  evidence" for confidence, the clarity treatment correctly does not run rather than fabricating a
  value — confirmed live (see verification below), this is the honest, expected behavior for the
  current seed data, not a bug.
- **Live browser verification** (not just syntax-checked): ran two full Customer Orbit convergences
  end-to-end (Ridgeline Data — Buyout by Meridian Capital; Ridgeline Data — Dana Whit) against the
  real seeded genesis data. Zero console errors through intro -> enter world -> picker -> full
  convergence animation on both runs. Both entities returned `QUERY_CONFIDENCE: "Not enough governed
  evidence"` (null, correctly skipped) and `CONVERGENCE_STABILITY: 0.99` (real, non-crashing,
  correctly near-zero wobble). Real per-atom relevance scores (0.02-0.37 range) and band assignments
  confirmed flowing into `HashResultPanel` unchanged by the rendering-side edit. Draw calls 728 /
  Logical atoms 99 in the dev stats overlay — scene populated, not empty.
- **Remaining gaps before Crystal Basin can be called DoD-item-7 "fully rendered and interactive"**
  (tracked honestly, not silently left implicit): confidence-as-crystal-clarity is per-hash-node
  only, not per-atom; stability-driven motion is the same; inferred-vs-observed lineage path
  treatment (dashed/segmented vs. solid) is not built; hover state is not distinguished from
  selected state; molecule-level labels are not built. These are real `builder: null` /
  `'not yet built'` entries already documented honestly in `worldVariantComponentProfiles.js`
  (Phase 4) — this pass closed the single highest-leverage gap (shell organization) plus the
  cheapest-to-reach real win (hash-node confidence/stability), not the full remaining list.
- **Orbital Intelligence and Temporal Journey Canyon — not started this pass.** phases.md flags
  Phase 5 as the largest phase in the build and explicitly permits splitting it
  ("if a single turn can't cover all three, build Crystal Basin and Temporal Canyon first"); this
  pass built the Crystal Basin slice only. Temporal Canyon (extends real `layout.js`) is the
  next-cheapest target per that same guidance.

## Temporal Journey Canyon — first slice (Phase 5 continuation, 2026-08-10)

Real rendering changes landed in `SpatialJourneyWorld.jsx`, following the same "declare in Phase 3/4, render
in Phase 5" discipline the Crystal Basin slice used, and immediately after resolving the `WORLD_REGISTRY`
naming decision (same invocation — see Resolved decisions above):

- **Canyon wall geometry, real, following the profile.** `TEMPORAL_CANYON_COMPONENT_PROFILE.rod.geometry`
  calls canyon walls "the primary visual structure of this entire variant," built along `computeRodLayout()`
  — no second layout algorithm. New `buildCanyonWalls(rod, positions)` builds two vertical wall ribbons
  (`THREE.BufferGeometry`, manually indexed quads) following a `CatmullRomCurve3` fit through the rod's real
  stage positions, called for every primary rod (`buildRodVisual`) and every branch pseudo-rod
  (`buildBranchVisual`) — 10 canyon-wall meshes confirmed built against the live seeded scene (verified
  below). Wall height/width is driven by the rod's average `stage.maturity` (the profile's
  `maturityEncoding`: "local environment richness scales with maturity") — deliberately **not** a literal
  completeness percentage, honoring that profile's explicit warning against the "literal wall-fraction" trap.
- **Minimal, real variant toggle — explicitly not Phase 7.** A new `variantKey` state + "Spatial Variant"
  `<select>` (only `CRYSTAL_BASIN`/`TEMPORAL_CANYON` listed — the other five registered variants have no
  renderer yet, so they're honestly left off a live control rather than offered non-functionally) drives a
  new `activateVariant(nextVariantKey)` on the imperative API: toggles canyon-wall mesh visibility, hides the
  default ground plane, dims the grid, and does a **partial** `rodTraversalBehavior` (aligns the camera down
  the root rod's canyon axis instead of the default top-down orbit — a real camera move, not the full moving
  traversal path along the axis, which stays `'not yet built'` per the component profile). This is real but
  intentionally narrow: no cross-switch semantic-state preservation, no comparison mode, no Interaction
  Intent dispatch layer — those remain Phase 7's job.
- **`worldId × variantKey` composition wired into a real consumer.** `activeWorld` in `SpatialJourneyWorld.jsx`
  now resolves through `resolveWorldComposition(worldId, variantKey)` (the file built for the naming decision
  above) instead of calling `getWorldDefinition(worldId)` directly — the first real usage of that resolver,
  in the one place both axes were already being selected.
- **Scene manifest compliance (DEC-007).** Every canyon-wall mesh is tagged via `attachSceneManifestTree()`
  with `variantId: 'TEMPORAL_CANYON'`, matching the ~10 other call sites already wired into this file by a
  concurrent session's Experience Compiler / scene-lineage work (`src/lib/sceneManifest.js`,
  `experience-memory/EXPERIENCE_DECISIONS.md`'s `DEC-007`). Confirmed live: `window.__SB_SCENE_MANIFESTS__`
  shows 10 `journey-canyon-wall:*` entries and **0 audit findings** from the already-mounted
  `UxRuntimeAuditProbe` (`UX-3D-LINEAGE-001`/`UX-3D-STATE-001` checks) — the new meshes are correctly
  registered, not silently unregistered renderables.
- **Live browser verification** (own dev server, port 5177, not another session's): entered the world,
  switched World detail unaffected, switched Spatial Variant `CRYSTAL_BASIN → TEMPORAL_CANYON → CRYSTAL_BASIN`
  twice. Zero new console errors introduced by the switch (the 6 pre-existing 401s are unrelated
  auth-gated endpoints — `config-envelopes/rod-mathematics-methodology`, `lonetree-mvp/value-creation` —
  confirmed via network log, not a regression). Scene stayed populated (99 logical atoms, consistent with the
  Crystal Basin slice's own earlier-recorded baseline) through both switches.
- **Config-audit self-check.** No hardcoded per-member/org differentiation; wall geometry reuses existing
  `clamp01`/`rollupStageMaturity`, no new weighting scheme invented; no calculation-weight or fixed-enum
  additions. No findings requiring conversion.
- **Remaining gaps before Temporal Canyon can be called DoD-item-7 "fully rendered and interactive"** (tracked
  honestly, matching `TEMPORAL_CANYON_COMPONENT_PROFILE`'s own `'not yet built'` markers): `activePosition`
  (ROD_POSITION as a longitudinal marker), `completenessEncoding` (internal stage lattice, explicitly not a
  wall-fraction), `cycleBehavior` (renewal cycles as repeated regions), full `rodTraversalBehavior` (a moving
  camera path, not just the initial alignment built here), fog-based atmospheric depth, world-space stage
  region labels, and hover-vs-selected state are all still open. Branch pseudo-rod canyon walls also inherit
  a real but narrower limitation: their `stage.maturity` values aren't recomputed by an equivalent of
  `evaluateStageGates()` inside `buildBranchVisual()` the way primary-rod stages are before their walls are
  built, so branch canyon richness may under-read until a later gate evaluation pass touches those stages —
  not fixed in this pass, flagged for whoever picks up the remaining Temporal Canyon polish.
- **`WORLD_VARIANT_STATUS` intentionally NOT bumped** for `TEMPORAL_CANYON` (still `registered`), same
  discipline the Crystal Basin slice used — real rendering landed, but the DoD item 7 bar (full interaction
  polish) isn't met yet.
- **Orbital Intelligence — not started this pass**, same as the prior Crystal Basin entry noted. It remains
  the last of the three Phase 5 variants.

## Dashboard Definition View — first slice (2026-08-10, `flickering-petting-brook` plan)

Built following DEC-001's amended wording (domain worlds = navigation, one shared state, variants =
composable lenses over it, never separate copies) and Betsy's description of "dashboard definition views
reorganizing the individual variants together to show the converged crystals that hold the scoped data
results":

- **Time Scope, real, reusing an already-threaded param.** `computeRodHash()`/`triangulateEntity()`
  (`rodHash.js`) already accepted `atOffset` end-to-end — nothing consumed it above the per-atom `AtomPanel`
  slider. Added a world-level `timeOffset` state + slider control; `runCustomerOrbit()` now passes
  `world.activeTimeOffset` through, so the whole converged hash — not just one atom — reflects the offset
  lineage values. Honestly labeled "illustrative" in the UI, since `lineage.js`'s history is a deterministic
  synthesized reconstruction, not a replay of real `journey_rod_events` (that reconciliation is explicitly a
  Non-Goal of this pass, flagged for later).
- **Scenario Scope, real, reusing `QUERY_CONTEXT_REGISTRY` as-is.** Added a Scenario Scope selector
  (customer/revenue/member, the existing registry — `journey_scenarios` was investigated and rejected as the
  wrong fit, see the plan file). New `applyScenarioScope(contextId)` reuses the existing `highlightedKeys`
  mechanism (already driving `activateWorld()`'s pricing/career focus) to highlight/dim atoms by
  `magneticProperties` tag overlap with the selected context's `coreTags`/`relatedTags` — no new highlight
  system. Selecting a scope also sets the `queryContextId` `runCustomerOrbit()` converges with, unifying
  "browsing scope" and "converging scope."
- **Dashboard Definition View, the genuinely new piece.** New `src/config/experience/
  dashboardDefinitionRegistry.js` (`DASHBOARD_DEFINITION_REGISTRY`, code-owned config registry, not a new
  table) + `resolveDashboardComposition(dashboardId, worldId)` in `worldCompositionRegistry.js` (maps
  `resolveWorldComposition()` per lens, never re-deriving world/variant lookups). Seeded with one real
  definition, `crystal-and-canyon` (Crystal Basin + Temporal Canyon — the only two variants with real
  rendering). Rendering is "one scene, N passes" (`renderer.setScissor`/`setViewport` per lens,
  `applyVariantVisualState()` toggling canyon-wall/ground visibility between passes) — not N separate WebGL
  canvases, per the plan's explicit rejection of that approach.
- **Real, honestly-scoped limitations**: both panes share the same user-controlled camera this pass — no
  independent per-lens camera framing yet (that's a real Phase 7 gap, not silently claimed here).
  Click-to-select is disabled while a dashboard is active (`handleClick`'s early return) since split-viewport
  hit-testing isn't built.
- **Validation**: `validateDashboardDefinitionRegistry()` — 0 errors. `resolveDashboardComposition
  ('crystal-and-canyon', 'journey')` — 2 lenses resolved, 0 errors, direct `node` ESM import (no test runner
  per `CLAUDE.md`).

## Changelog

<!-- Newest entry on top. One entry per /world-variants invocation. -->

- **2026-08-10** — Built the Dashboard Definition View first slice (plan `flickering-petting-brook`) — see
  the section above for full detail. Time Scope and Scenario Scope exposed as real UI controls over
  already-threaded engine params (`atOffset`, `QUERY_CONTEXT_REGISTRY`); new `dashboardDefinitionRegistry.js`
  + `resolveDashboardComposition()` + split-viewport rendering is the first real prototype of Phase 7's
  planned Comparison Mode, built ahead of that phase's own sequencing since it was directly requested. Real
  gaps flagged honestly: shared camera across panes, selection disabled in dashboard mode, illustrative (not
  event-replayed) time history.

- **2026-08-10** — Resolved the `WORLD_REGISTRY` naming collision (Betsy: compose as `worldId × variantKey`),
  then resumed Phase 5 with a real Temporal Journey Canyon slice — see both sections above for full detail.
  Canyon wall geometry built along `computeRodLayout()`, a minimal real variant toggle (not the full Phase 7
  switcher), `resolveWorldComposition()` wired into its first real consumer, scene-manifest tagging matching
  the concurrent Experience Compiler work's `DEC-007`, live-verified with zero new console errors. Orbital
  Intelligence remains for Phase 5 to close out, plus Temporal Canyon's own remaining gaps (position marker,
  completeness encoding, cycle behavior, full traversal camera, atmospheric depth, labels, hover state) and
  Crystal Basin's still-open gaps from the prior entry.

- **2026-07-30** — Ran Phase 5 (partial — Crystal Basin slice only). See the section above for full
  detail. Real rendering code changed in `SpatialJourneyWorld.jsx` for the first time in this build
  (Phases 1-4 were config-only); live-verified in browser with zero console errors across two full
  Customer Orbit runs against real seed data. Temporal Journey Canyon and Orbital Intelligence remain
  for Phase 5 to close out, plus Crystal Basin's own remaining gaps (per-atom confidence/stability,
  lineage dashing, hover state, molecule labels) before DoD item 7 is fully satisfied.

- **2026-07-30** — Ran Phase 4 (Variant Component Profiles). Built
  `src/config/visual/worldVariantComponentProfiles.js` — see the Phase 4 section above for full
  detail. Phase 5 (first three fully rendered/interactive variants — Crystal Basin, Orbital
  Intelligence, Temporal Canyon) is next and is now unblocked; it's flagged in phases.md as the
  largest phase in the whole build ("if a single turn can't cover all three, build Crystal Basin and
  Temporal Canyon first").

- **2026-07-30** — Ran Phase 3 (Visual Encoding Profile + Variant Configuration Schema + Validation)
  via the `world-variants` skill, prompted by Betsy asking to continue the SpatialJourneyWorld
  "orbit UX + aesthetic pass" using everything already established rather than redefining it. Built
  `src/config/visual/worldVariantEncodingProfiles.js` — see the Phase 3 section above for full
  detail. Phase 4 (Variant Component Profiles) is next and is now unblocked.

- **2026-07-12** — Betsy added a 7th dimension to `ROD_MATURITY` itself: **Reconciliation Maturity** — "how
  well do the definitions, evidence and lineage reconcile across departments, systems, users, etc. to
  produce a confidence." This is a `salt-basin-visual-metrics` metric-definition change (full detail in
  that skill's tracker), surfaced here because it directly changes what `MATURITY_LATTICE`'s primary metric
  composes: `metricDefinitionRegistry.js`'s `ROD_MATURITY` entry and `rodMathematicsMethodology.js`'s
  `rodMaturity.weights` both updated (7 weights, rebalanced to sum to 1.0: 0.18/0.18/0.13/0.13/0.13/0.13/
  0.12); `rodMathematics.js`'s `calculateRodMaturity()` needed no code change — config-driven. Updated
  `MATURITY_LATTICE`'s description in `worldVariantRegistry.js` from "6-dimension" to "7-dimension" and
  added a line distinguishing Reconciliation Maturity (cross-source agreement within one Rod) from Rod
  Coherence (cross-Rod agreement between Revenue/Customer/Member) — the two must not be conflated in this
  variant's rendering. Re-validated: registry and invariant checks both still 0 errors.

- **2026-07-12** — Betsy supplied the 7th variant's concept: "Crystal Atom / Molecule / Cluster evidence
  maturity." Renamed the reserved slot from `RESERVED_VARIANT_7` to `MATURITY_LATTICE` ("Crystal Lattice
  Observatory") in `worldVariantRegistry.js`, flipped `status` to `registered`, added a new
  `WORLD_VARIANT_FAMILY.LATTICE` value (its spatial axis — structural nesting by maturity depth — is
  distinct from every other variant's query-convergence axis, so it earns its own family rather than
  reusing `CRYSTALLINE`). Bound to `ROD_MATURITY`'s 6-dimension composite; extends the same
  `atomGeometry.js`/`computeAtomVisual()` crystal vocabulary Crystal Basin uses, per §XII — not a forked
  geometry system. Re-validated: 7 variants, 0 registry errors, 0 semantic-invariant errors. Moved the open
  decision to Resolved; it still needs a Phase 5/6-equivalent build slot once profile work (Phase 3/4)
  reaches it.

- **2026-07-12** — Betsy asked for a 7th variant ("can we make it 7?"), then chose to reserve the slot
  without a concept rather than have one described or proposed. Added `WORLD_VARIANT_STATUS.PLANNED` and
  `WORLD_VARIANT_FAMILY.UNASSIGNED` to `worldVariantRegistry.js`, and registered `RESERVED_VARIANT_7` —
  `status: 'planned'`, no concept, excluded from later-phase status filters. Registry re-validated: 7
  variants, 0 errors. Recorded as open decision #2 (concept still needed) rather than inventing a metaphor.

- **2026-07-12** — Ran Phase 2 (World Variant Domain, Registry & Semantic Invariant Reconciliation). Built
  `src/config/visual/worldVariantRegistry.js` — see the Phase 2 section above for full detail. Unblocked by
  `salt-basin-visual-metrics` Phases 2–5 all landing (Metric Definition Registry, Query Convergence engine,
  Rod Mathematics engine, Visual Encoding Registry) since this tracker's last entry. Phase 3 (Visual
  Encoding Profile + Variant Configuration Schema) is next and is now unblocked — it generalizes the
  existing single global `metricVisualEncodingRegistry.js` into six per-variant profiles rather than
  building from zero.

- **2026-07-12** — Betsy resolved the open "Orbin" vs. "Orbit" naming question: "Orbin is supposed to be
  Orbit." Moved the decision to Resolved decisions above and corrected every reference to "Orbin" across
  this tracker, `SKILL.md`, `reference/phases.md`, `reference/master-build-prompt.md`, and
  `.claude/commands/world-variants.md` to read "Orbit" — including the same correction applied to the
  sibling `salt-basin-visual-metrics` skill's equivalent files, since both shared this one decision. No code
  change needed — shipped code (`SpatialJourneyWorld.jsx`) already said "Orbit."

- **2026-07-12** — Skill, command, phases reference, and this tracker created (Betsy: "create a command and
  skill and invoke through the master build" for the 3D World Variant Engine prompt). Invoked immediately:
  ran Phase 1 (Inspect Existing 3D Implementation & Naming-Collision Audit) for real against
  `SpatialJourneyWorld.jsx` and its supporting `journeyEngine`/`config/visual` modules — see the audit above.
  Key findings: (1) raw Three.js, hand-rolled spherical camera, no Interaction Intent layer — convergence
  positioning is computed inline inside the click-handler chain (`runCustomerOrbit`/`runStageQuery`), the
  literal anti-pattern §XV warns against, not a hypothetical; (2) convergence radius/angle placement today is
  pure index-based fan-out with no relevance input, confirming and extending `salt-basin-visual-metrics`
  Phase 1's finding that no Query Relevance Score exists yet; (3) `atomGeometry.js`'s crystal vocabulary and
  `layout.js`'s gate-driven non-parallel rod layout are real, reusable starting points for Crystal Basin and
  Temporal Journey Canyon respectively — not from-scratch builds; (4) `pathColor.js` already correctly
  implements §XII's permanent-path-color requirement, reuse as-is; (5) a real naming collision found and
  recorded as an open decision, not resolved by fiat: `src/config/visual/worldRegistry.js`'s existing
  `WORLD_REGISTRY` is a content-domain switcher (different data per world), cosmetically wired only (drives a
  dropdown + toast, zero rendering consumers), and is a different concept from this spec's `WorldVariant`
  (same data, different spatial metaphor) — flagged for Betsy rather than merged or renamed unilaterally.
  Cross-linked into `salt-basin-master-build`'s Loop 9/10 rows and SKILL.md. Phases 2–9 not started; Phase 2
  is blocked on `salt-basin-visual-metrics` Phase 2 (Metric Definition Registry) landing for its metric
  reconciliation half.
