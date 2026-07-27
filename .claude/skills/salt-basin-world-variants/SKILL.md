---
name: salt-basin-world-variants
description: Repeatable multi-session driver for the "Master Build Prompt — Salt Basin 3D World Variant Engine" — configurable, materially distinct 3D spatial metaphors (Crystal Basin, Orbital Intelligence, Monetary River, Enterprise Highway, Neural Constellation, Temporal Canyon) rendering the same governed Salt Basin semantic model. Use when Betsy invokes /world-variants, references "the world variant engine," "the 3D variant prompt," "Crystal Basin vs Orbital Intelligence," "the variant switcher," or asks to make the 3D environment render through multiple spatial metaphors without changing what the numbers mean.
---

# Salt Basin 3D World Variant Engine

This skill drives Betsy's "Master Build Prompt — Salt Basin 3D World Variant Engine" — a 19-section
(I–XIX) brief that makes the existing 3D spatial environment render through multiple materially distinct
spatial metaphors (Crystal Basin, Orbital Intelligence System, Monetary River System, Enterprise Highway
Network, Neural Crystal Constellation, Temporal Journey Canyon) over one unchanged semantic model.

This is a **sibling** to `salt-basin-master-build`, `salt-basin-visual-metrics`, `salt-basin-pre-build`, and
`salt-basin-contribution-intelligence`, not a replacement. It doesn't invent new semantic metrics — it
consumes the metrics `salt-basin-visual-metrics` defines (Query Relevance/Coverage/Confidence, Convergence
Stability, Rod Position/Maturity/Density/Coherence, Cross-Rod Alignment) and gives them multiple valid
spatial renderings. It extends `salt-basin-master-build`'s Loop 9 (Visual Language) and Loop 10 (World
Navigation) — those loops are not `done` until they've either run this skill or explicitly deferred to it,
matching the pattern already used for Loops 2/3/6/7/16 deferring to `salt-basin-pre-build`.

## Non-negotiables (apply on every invocation, no exceptions)

- **The visual world may change; the semantic meaning must never change.** Query Relevance, Coverage,
  Confidence, Stability, Rod Position, Stage Completeness, Stage Readiness, Rod Maturity, Journey Density,
  Rod Coherence, and Cross-Rod Alignment are computed once and handed to whichever variant is active. A
  variant may never redefine, recompute-differently, or reinterpret one of these values — only its spatial
  representation may differ.
- **Reuse the Metric Definition Registry — do not redefine the same 11 metrics a second time.** These are
  the exact same metrics `salt-basin-visual-metrics` is building a registry for. If that registry doesn't
  exist yet when this skill runs, build the `WorldVariantRegistry` shell and record the metric-reconciliation
  half as blocked — do not invent a competing metric taxonomy to unblock yourself.
- **No `if variant === "x"` scattered through render components.** Resolve a structured
  `WorldVariantConfig` once per selection, then feed the same generic Orbit/Atom/Molecule/Rod/Lineage
  builders the resolved profile. A variant conditional inside an unrelated component is the anti-pattern
  §II explicitly names — don't reintroduce it.
- **One primary visual channel = one semantic metric, within a single variant.** Confidence and temporal
  freshness both driving opacity in the same variant is the exact conflict §IV prohibits. Phase 3's
  validation rules must actually catch this, not just describe it in a comment.
- **Never invent a new path color per world.** `src/lib/journeyEngine/pathColor.js`'s `resolvePathColor()` /
  `PINNED_PATH_COLORS` (revenue=gold, customer=teal, member=mauve, deterministic hash fallback otherwise) is
  the real, already-shipped implementation of §XII's permanent-path-color rule. Every variant reuses it
  unchanged — never a per-variant random palette.
- **Never let personalization redefine semantic directionality.** The permitted customization surface
  (camera sensitivity, environmental density, label scale, reduced motion, variant choice, grid visibility)
  never includes which direction a metric moves a visual property. "Higher relevance = farther away" is a
  semantic decision the variant's Visual Encoding Profile makes once, not a user preference.
- **The UI dispatches semantic actions, not rendering calls.** `SELECT_CONTEXT_ORBIT` /
  `ACTIVATE_QUERY_CONTEXT` are Interaction Intents resolved by the active variant's Convergence Profile —
  a component must never call a positioning function like `moveNodesToRadius()` directly. This is not a
  hypothetical anti-pattern: `SpatialJourneyWorld.jsx`'s `runCustomerOrbit()` and `runStageQuery()` currently
  compute ring/angle convergence positions inline inside the click-handler chain itself. Phase 7 replaces
  this, it does not describe replacing it and leave the inline math in place.
- **"Orbit" is canonical — resolved 2026-07-12.** The spec text originally read "Orbin"; Betsy confirmed
  this was shorthand/typo for "Orbit," matching the already-shipped term in `SpatialJourneyWorld.jsx`'s
  `<h3>Customer Orbit — {result.entityLabel}</h3>`. Same resolution recorded in the sibling
  `salt-basin-visual-metrics` skill, which shared this decision.
- **Flag the `WORLD_REGISTRY` naming collision — don't collapse it.** `src/config/visual/worldRegistry.js`'s
  existing `WORLD_REGISTRY` / `getWorldDefinition` / `worldId` is a **content-domain** switcher (Foundation,
  Channel Rod, Query Channel, Career, Pricing, Infrastructure, Templates worlds — different underlying data
  per entry, driven today only by a cosmetic `<select>` + toast label, not wired into any actual rendering).
  This spec's `WorldVariant` (Crystal Basin, Orbital Intelligence, ...) is a **different axis**: the same
  data rendered through different spatial metaphors. Do not reuse the name `WorldRegistry` for the new
  concept, and do not merge the two systems without an explicit Betsy decision.
- **Build against real `journeyEngine` data.** Synthetic values are allowed only in clearly labeled dev
  fixtures, matching the standing rule already applied by `salt-basin-visual-metrics` and
  `salt-basin-contribution-intelligence`.

## Files

- `reference/master-build-prompt.md` — the full verbatim 19-section brief (I–XIX plus framing preamble).
  Read only the section(s) relevant to the current phase rather than the whole document.
- `reference/phases.md` — static definition of the 9 build phases, which spec sections each covers, their
  dependencies, and the cross-cutting rules that apply to all of them.
- `docs/salt-basin-world-variants-progress.md` (repo root, not under this skill directory) — the
  **mutable** state: phase statuses, the Phase 1 implementation audit, open naming decisions, and a
  changelog. Read first, update last, on every invocation.

## Cross-references into the existing codebase (real, verified 2026-07-12)

| Area | Where it lives today | What's real vs. what's missing |
|---|---|---|
| Renderer | `src/components/SpatialJourneyWorld.jsx` (1553 lines) | Raw `three` (`^0.185.1`, `package.json`) — no React Three Fiber, no Babylon.js, no WebGPU. One giant `useEffect` imperatively builds and owns the entire scene graph in a plain `world` object (`meshRegistry`, `atomGroups`, `stageMeshes`, ... — Maps and plain objects, not a declarative tree). |
| Camera | `SpatialJourneyWorld.jsx` (~line 752–780) | Hand-rolled spherical-orbit camera (`spherical = { radius, theta, phi }`, lerp-smoothed toward a `*Goal` each frame) — no `OrbitControls`/drei. `focusPoint()`, `resetView()`, `zoomBy()` already exist as the camera-transition primitives; formalize into the Camera Profile in Phase 4 rather than rewriting. |
| Interaction / raycasting | `SpatialJourneyWorld.jsx` (~line 171, 781–845) | Manual `pointerdown`/`pointermove`/`pointerup`/`wheel` handling (drag-to-orbit, pinch-to-zoom) plus a single `THREE.Raycaster` against a flat `world.raycastMeshes` array, dispatching to `apiRef.current.onSceneEntitySelected`. No Interaction Intent layer — see the non-negotiable above. |
| Convergence animation | `SpatialJourneyWorld.jsx`'s `runCustomerOrbit()` / `runStageQuery()` (~line 627–730) and the `animate()` state machine (~line 866–905) | Real state machine (`orbit → converging → atStage → returning`, plus a separate `hashConverging → atHash` phase for the compound-query "hash node") using `lerpVectors`/`smoothstep`. **Radial/ring placement today is pure index-based fan-out** (`angle = i / n × 2π`, `ring = 3 + (i % 3) × 0.8`) — not driven by Query Relevance or any other metric, because no such metric exists yet (confirms `salt-basin-visual-metrics` Phase 1's finding). This is the literal Convergence Profile / relevance-to-position mapping §IV and §VI ask for — currently hardcoded, not configurable, not metric-driven. |
| Atom/molecule/rod geometry | `src/lib/journeyEngine/atomGeometry.js` | Real, centralized builder vocabulary: bipyramid = atom, hex-drum cylinder = stage anchor, wire icosahedron = molecule shell, large icosahedron = compound-query hash node, torus = confluence, cone = home-anchor pin, thin additive column = gate beacon. `buildAtomMaterial()` already reads a `visual` object (color/metalness/roughness/opacity/emissive) computed elsewhere — good separation to extend for the Atom Profile, not replace. |
| Maturity → rendering mapping | `src/lib/journeyEngine/maturity.js` (`computeAtomVisual`) | Already correctly separates semantic (maturity) from rendering (scaleY/facet/opacity/metalness/roughness/emissive) — the template for every new profile's metric→channel mapping. Same finding `salt-basin-visual-metrics` Phase 1 already recorded; do not rebuild this from scratch. |
| Rod/branch layout | `src/lib/journeyEngine/layout.js` (`computeRodLayout`, `computeGateDimensionRibs`) | Real, already **non-parallel, gate-driven** branching layout — a branch rod's stages fan outward from its parent's origin gate at a declared angle/elevation, not three hardcoded parallel corridors. This is closer to Temporal Journey Canyon's and Enterprise Highway's structural requirements than a from-scratch build; Monetary River / Enterprise Highway variants should extend this module's origin/direction/angle model, not invent a second layout algorithm. |
| Permanent path color | `src/lib/journeyEngine/pathColor.js` | Real, deterministic (`resolvePathColor`, `PINNED_PATH_COLORS`, `FALLBACK_PATH_PALETTE`, `stableHash`) — exactly §XII's requirement, already shipped. Reuse unchanged across every variant. |
| Object-type → visual rule registry | `src/config/visual/visualSemanticRegistry.js` | Real (`VISUAL_SEMANTIC_REGISTRY`, `GEOMETRY_REGISTRY`, `legendEntries()`) — maps semantic object type (evidence_atom, atom_cluster, semantic_composition, journey_rod, journey_tributary) to geometryId/materialId/colorRule/outlineRule/lightingRule/opacityRule plus a plain-language `meaning` string. Keyed by **object type**, not by **metric** — Phase 3's Visual Encoding Profile is the metric-keyed layer this registry doesn't yet have. Extend, don't replace. |
| Content-domain "world" switcher | `src/config/visual/worldRegistry.js` (`WORLD_REGISTRY`, `ROTATION_CHOREOGRAPHY_REGISTRY`, `getWorldDefinition`) | Real but **cosmetically wired only** — `worldId` state drives a `<select>` dropdown and a toast label (`SpatialJourneyWorld.jsx` ~line 1057, 1159) but is never read by `orbitPosition()`, camera setup, or any rendering code; `ROTATION_CHOREOGRAPHY_REGISTRY`'s per-world `angularVelocity`/`elevation`/`distance`/`easing` values are defined but unconsumed anywhere in the file. See the naming-collision non-negotiable above — this is a different axis from `WorldVariant` and must not be silently merged with it. |
| Temporal lineage | `src/lib/journeyEngine/lineage.js` (`getAtomLineage`, `lineageValueAtOffset`, `bumpVersion`) | Real historical (10-week)/current/projected state per atom — the base for Phase 8's Lineage Playback Time Mode. History/projections are deterministically synthesized from the atom's id (seeded random), not derived from real event-sourced proposal/validation/staging/commit/rejection events — same caveat `salt-basin-master-build` Loop 12 already recorded. |
| Molecule/graph formation | `src/lib/journeyEngine/bonding.js` (`assembleMolecules`, `computeContributionAffinity`) | Real tag-overlap + conflict-penalty affinity calculation, already used to decide which atoms bond into a molecule — the natural input to Neural Constellation's (Phase 6) force-layout attraction, not a calculation to duplicate. |
| Data loading / LOD | `SpatialJourneyWorld.jsx`, `SEED_LEADS.forEach(spawnFromLead)` at mount | No `fetchNodes(bounds, zoom)` or equivalent, no viewport-bounds loading, no `InstancedMesh`, no LOD, no spatial indexing. Entire seed dataset is built synchronously at mount. Confirms `salt-basin-master-build-progress.md` Loop 18's existing finding ("no LOD/instancing anywhere in `src/`") — Phase 9 of this skill is where that gets addressed for the variant engine specifically, sequenced after Loop 10 (World Navigation) per that tracker's own dependency note. |
| Brand-mark crystal system (do not conflate) | `src/lib/crystalGeometry.js`, `src/components/SaltBasinCrystal.jsx`, `CrystalOfficeScene.jsx`, `CrystalRoomScene.jsx`, `CrystalMark.jsx`, `CrystalMarkField.jsx`, `src/data/crystalExperienceConfig.js` | A **separate** system for product-mark variants (signature/hourglass/engine geometries for brand marks) — `atomGeometry.js`'s own header comment explicitly calls this out as a different contract, not domain-driven journey atoms. Crystal Basin (the world variant) extends `atomGeometry.js` + `maturity.js`, not this brand-mark system. |

## Workflow for every invocation

1. Read `docs/salt-basin-world-variants-progress.md` first, including the Phase 1 audit and any recorded
   open decisions — later phases build on Phase 1's findings, don't re-derive them.
2. Determine which phase to run:
   - If the user named one (`/world-variants phase 5`, `/world-variants crystal-basin`,
     `/world-variants switcher`), run that phase.
   - Otherwise, pick the first phase in `reference/phases.md` whose status is `not started` or `blocked`
     (with its blocker now resolved) and whose dependencies are satisfied.
3. Read only the master-prompt sections that phase's row in `reference/phases.md` cites — via Grep/Read on
   `reference/master-build-prompt.md`, not the whole document.
4. Before designing anything, check `docs/salt-basin-visual-metrics-progress.md` for the current state of
   the Metric Definition Registry and Visual Encoding Registry this skill depends on. If a phase here
   depends on a not-yet-built piece of that skill, either invoke `salt-basin-visual-metrics` for the
   specific phase that unblocks it, or record the dependency as blocking and proceed only with the portion
   of this phase's scope that doesn't need it — don't invent a duplicate.
5. Do the actual work: build the real registry, profile, schema, variant renderer, or switcher — not just a
   findings list or a JSON configuration document with nothing rendering it. Run `salt-basin-config-audit`
   against any new profile/encoding config surface this phase adds (these are exactly the kind of
   per-variant "hardcoded visual assumption" that skill exists to catch).
6. Update `docs/salt-basin-world-variants-progress.md`: set the phase's status, update the audit/registry
   tables if this phase changed them, add a changelog entry (date, what changed structurally, what's still
   open).
7. Report back concisely: which phase ran, what structurally changed, what's still open or blocked, and
   what phase is next.

## Scope discipline

Nine phases. Phase 5 (first three fully-rendered variants) and Phase 6 (remaining three structural
variants) are each too large for one turn if taken whole — `reference/phases.md` already suggests a split
for Phase 5 (Crystal Basin + Temporal Canyon first, since both extend already-real code, Orbital
Intelligence second). Say so and split rather than doing a shallow pass across all three variants in a
phase at once.
