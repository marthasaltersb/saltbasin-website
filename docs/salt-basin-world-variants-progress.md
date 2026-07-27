# Salt Basin World Variant Engine — Progress Tracker

Mutable state for the `salt-basin-world-variants` skill. Read first, update last, on every invocation.
Static phase definitions live in `.claude/skills/salt-basin-world-variants/reference/phases.md` — don't
duplicate that content here, just track status and findings.

## Phase status

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Inspect Existing 3D Implementation & Naming-Collision Audit | done | See findings below. |
| 2 | World Variant Domain, Registry & Semantic Invariant Reconciliation | done | `src/config/visual/worldVariantRegistry.js`. See below. |
| 3 | Visual Encoding Profile + Variant Configuration Schema + Validation | not started | Depends on Phase 2; unblocked — `salt-basin-visual-metrics` Phase 5 (Visual Encoding Registry) is done |
| 4 | Variant Component Profiles | not started | Depends on Phase 3 |
| 5 | First 3 fully rendered/interactive variants (Crystal Basin, Orbital Intelligence, Temporal Canyon) | not started | Depends on Phases 2–4 |
| 6 | Remaining 3 structural variants (Monetary River, Enterprise Highway, Neural Constellation) | not started | Depends on Phases 2–4. `MATURITY_LATTICE` (7th variant, added 2026-07-12) is not yet assigned to Phase 5 or 6 — schedule it when its build is picked up. |
| 7 | Variant Switcher, Interaction Intent Layer & Comparison Mode | not started | Depends on Phase 5 |
| 8 | Presets/Inheritance, Variant Creation Studio, Explanation Mode, Temporal Playback | not started | Depends on Phases 3, 5/6 |
| 9 | Performance, Cross-Variant Customer Orbit Reference, Evaluation Report & Closeout | not started | Depends on Phases 5–8 |

## Open decisions requiring a Betsy answer (do not default)

1. **`WORLD_REGISTRY` naming collision.** `src/config/visual/worldRegistry.js`'s existing `WORLD_REGISTRY`
   is a **content-domain** switcher (Foundation / Channel Rod / Query Channel / Career / Pricing /
   Infrastructure / Templates worlds — different underlying data per entry) driven today only by a cosmetic
   `<select>` + toast label, not wired into any actual rendering (`worldId` is never read by `orbitPosition()`,
   camera setup, or scene construction; `ROTATION_CHOREOGRAPHY_REGISTRY`'s per-world motion values are
   defined but unconsumed anywhere in `SpatialJourneyWorld.jsx`). This spec's `WorldVariant` (Crystal Basin,
   Orbital Intelligence, Monetary River, ...) is a **different axis**: the same data rendered through
   different spatial metaphors, not different data. Is the existing `WORLD_REGISTRY` concept: (a) meant to
   be finished as originally scoped (a content-domain switcher, kept separate from the new variant engine —
   two independent registries, two independent `<select>` controls), (b) intended to be renamed/retired now
   that "World" collides with the new, higher-priority spec's vocabulary, or (c) meant to become a second
   axis composed with variants (`worldId × variantKey`)? Not resolved here — blocks Phase 2's registry
   naming, not Phase 1's audit.

## Resolved decisions

1. **7th variant concept — RESOLVED 2026-07-12.** Betsy asked to add a 7th variant beyond the master
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

2. **"Orbin" vs. "Orbit" — RESOLVED 2026-07-12.** Betsy confirmed "Orbin" (as it appeared in the master
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

## Changelog

<!-- Newest entry on top. One entry per /world-variants invocation. -->

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
