# Autonomous Experience Blueprint

## 1. Existing Experience Inventory

The repository already contains a mature procedural foundation: `SpatialJourneyWorld`, `WorldShell`, `crystalGeometry`, the journey engine, seven domain worlds, seven spatial variants, the crystalline-world prototype, two SVG icon families, and the LoneTree experience. Three-dimensional assets are procedural; no GLB/GLTF/FBX/OBJ assets are currently canonical. The Experience Knowledge Graph should index these sources rather than duplicate them.

## 2–9. Governed Languages and Taxonomies

The Constitution, Visual Semantic Map, Motion Language, Camera Language, Character Registry, World Registry, Asset Registry, and Interaction Registry are maintained as sibling documents in this directory. Machine-readable genes and profiles live in `src/config/experience/`.

## 10. Experience Object Model

Each compiled object contains identity and semantic source, world/journey hierarchy, relationships, state/history, governance and permissions, visual profile references, interaction capabilities and engine targets, semantic motion bindings, information/evidence/lineage, accessibility equivalents, and compiler provenance. Business state is read-only input to the compiler.

## 11. Experience Manifest Schema

The manifest is a reproducible intermediate representation containing world composition, Experience Genome selection, objects, user/agent characters, assets, animations, interactions, precision surfaces, state/semantic bindings, outputs, performance budgets, accessibility rules, compiler provenance, validation, and promotion status. Candidate manifests cannot become canonical without approval.

## 12. Autonomous Asset Pipeline

`REQUESTED → MATCHED → PARAMETERIZED/PROCEDURAL/CANDIDATE_NEW → GENERATED → VALIDATED → CANDIDATE → APPROVED → CANONICAL`.

Resolution order is approved asset, parameterized family, procedural recipe, then new candidate. New identity or semantic mappings always require approval. Every asset carries content hash, source, parameters, format, dependencies, license, LOD, performance budget, responsive behavior, and accessibility alternative.

## 13. Experience Compiler Architecture

```text
Canonical Data + Ontology + Journey State + User/Agent State + Design System
  → semantic graph
  → Experience Genome / approved-pattern resolver
  → world × variant resolver
  → semantic encoding + object compiler
  → interaction/permission/state compiler
  → asset/layout/motion/camera/accessibility compilers
  → validated Experience Manifest
  → generic runtime renderer + precision surfaces
```

The renderer never authors business state. Engine commands are dispatched only from declared interactions, and confirmed engine state triggers consequential animation.

## 14. Experience QA Framework

Four layers: compile/static validity; WebGL/runtime instrumentation; deterministic journey simulation; experiential/accessibility testing. Findings include rule, severity, manifest path, object, evidence, expected/actual, repair recipe, automatic boundary, and approval need. Promotion requires semantic/permission integrity, critical-flow completion, performance budget compliance or waiver, accessibility parity, and human approval.

## 15. Reference Journey Storyboard

Reference: Member–Organization Relationship / Revenue lifecycle with the existing re-trade tributary.

1. World entry establishes operator presence and guide authority.
2. Identity signal pulses and becomes inspectable evidence.
3. Deal-dimension atoms emerge and bond into a molecule.
4. Validation crystallizes the definition and opens the route.
5. Conflicting pricing evidence fractures visibly and opens comparison.
6. A financing change branches into the governed re-trade tributary.
7. Reconciliation approaches the confluence; approval preserves accepted and rejected lineage.
8. Downstream flow resumes only after confirmed engine state.
9. The prior epoch remains available through historical rewind.
10. Completion returns the camera and focus to the world.

## 16. Interaction Map

`SELECT` changes local focus. `INSPECT` opens a precision surface without persistence. `SUBMIT_EVIDENCE`, `CREATE_BRANCH`, and `ACCEPT_MERGE` require permissions/guards and server confirmation. `VIEW_HISTORY` reads the event ledger. `RETURN_WORLD` restores prior camera/focus. Keyboard and non-visual controls must provide equivalent outcomes.

## 17. Reference Asset List

Reuse procedural atoms/crystals, molecule lattice, journey rod/stage anchors, evidence particles, tributary channel, reconciliation ring, agent genealogy, operator presence, and inspectors. Candidate gaps: accessible 2D journey map, history-epoch ghost, and a governed confluence structure.

## 18. Animation List

PULSE, EMERGE, BOND, CRYSTALLIZE, FRACTURE, BRANCH, FLOW, CONVERGE/MERGE, REWIND, agent point/retrieve/prepare. Each resolves through `motionRegistry.js` and has an interruptible reduced-motion equivalent.

## 19. Implementation Plan

1. Compile the existing reference manifest without changing the renderer.
2. Render the existing crystalline prototype as the live reference baseline.
3. Bind compiler identifiers into scene manifests.
4. Add accessible journey-map and focus restoration.
5. Persist runtime UX and performance QA results.
6. Incrementally replace scene-local constants with governed compiler profiles.
7. Promote reusable patterns only after human review.

## 20. Live Visual Prototype

The approved existing prototype is exposed at `/experience/reference`. It remains sourced from `prototypes/crystalline-world/salt-basin-crystalline-world-v2.html`; the new page frames it with manifest/compiler status and an accessible reference-journey summary rather than rebuilding it.

