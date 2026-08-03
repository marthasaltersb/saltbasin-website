# Salt Basin Genesis — Experience Proof

A working, self-contained browser prototype proving the canonical Universe Builder / Active
Avatar / Agent Delegation / Experience Studio interaction model for Salt Basin Genesis, ahead
of any production backend, runtime, or mapping-compiler work (per `SB-GEN-SPEC-001`, this is a
Phase 6 "Playable world" proof — it deliberately does not implement Phases 0–5).

This lives entirely outside `src/` and `server/` and does not read from, write to, or require
the production app, database, or auth. It is safe to open, edit, and delete independently of
the rest of the repository.

## Run it

No build step. Either:

- **Double-click** `experience-proof/index.html` (works via `file://` — Three.js is vendored
  locally at `vendor/three.min.js`, not loaded from a CDN, so it has zero network dependency).
- Or serve the folder with any static server, e.g. `python3 -m http.server 8080` from inside
  `experience-proof/`, then open `http://localhost:8080/`.

Tested headless in Chromium via Playwright on both `file://` and a local static server, with a
scripted pass through the full scenario below — see **Validation** at the bottom.

## What's here

- **Universe Builder mode** — an elevated cosmos view of the three Journey Rods (Revenue,
  Customer, Member) as orbiting clusters. Click a region or an individual governed definition
  to inspect it; regions with open conflicts glow red instead of the rod's normal color.
- **Active Avatar mode** — a placeholder avatar (clearly labeled as such in the HUD) that
  travels toward a selected stage on request ("Approach"), with nearby structures pulsing as it
  passes. Arrival opens the close-range inspector.
- **Agent delegation** — two bounded agents per client config, each with an explicit stated
  role, objective, and **capability limits** (what it is *not* allowed to do), spatially
  anchored to the atom they're working on rather than living only in a chat panel. They run
  concurrently with visible progress.
- **Evidence review + approve / revise / reject / defer** — the Evidence Investigator returns
  observations with confidence scores; the Definition Reconciliation Agent proposes a
  transition with a predicate pass/fail table (mirroring the Decision Runtime pattern in
  `SB-GEN-SPEC-001` Appendix B) and an explicit disposition. Nothing commits without your
  action — matches the spec's Agent-Centric Security model (§12: agents may *propose* and
  *stage*, never *commit*).
- **World transformation** — approving a proposal changes the atom's underlying maturity/
  conflict state, which deterministically recomputes its facet count, color band, and glow
  (the render grammar from `SB-GEN-SPEC-001` §14.1), animates the crystal to its new geometry,
  and leaves a fading wireframe "historical echo" at the old shape.
- **Temporal history** — every user and agent action is logged with a stamped `EVAL-####` ID,
  actor, and timestamp, and is reachable from any mode.
- **Two client configurations** — Salt Basin HOS™ and Salt Basin × LoneTree Capital. Identity,
  world name, terminology, role, agent names/objectives, visible metrics, accent color,
  complexity, guidance level, and gamification level all vary; navigation, camera, selection,
  delegation, and transition mechanics do not (the canonical kernel).
- **Experience Studio** — Studio-mode toggle; a stable touchpoint registry (dot-notation IDs,
  never DOM selectors); click-to-annotate touchpoint markers; a Feedback Queue with the full
  lifecycle (`draft` → … → `accepted`/`rejected`/`superseded`); a Preserve Exactly ledger; an
  Iteration Builder that only accepts `approved_for_iteration` feedback and generates a
  paste-ready Codex brief; local autosave with a saved/unsaved indicator; JSON export/import of
  the full Experience Memory with duplicate detection; and a lightweight before/after snapshot
  comparison.

## The vertical slice ("repair and mature an incomplete journey")

Grounded in real flagged data already present across the reference prototypes, not invented:
the **Bill-To Party Definition** on the Revenue Journey Rod's Contract stage, maturity 30%,
`conflict: true`, source `Halt_Maturity_Rules HR-001`.

1. Enter the world → Universe Builder shows the Revenue region.
2. Select the region or the atom directly → progressive disclosure explains the contested
   state without a dashboard dump.
3. Enter Avatar Mode → approach the Contract stage.
4. Delegate the Evidence Investigator and the Definition Reconciliation Agent — both run
   concurrently, visible in-world.
5. The Investigator returns two evidence records with confidence scores.
6. The Reconciliation Agent proposes a definition and raises an approval request (2 of 4
   predicates fail — a real dependency and human approval are both outstanding).
7. Review evidence → Approve.
8. The atom matures 30% → 82%, `conflict` clears, the crystal transforms live, a historical
   echo fades out, and the event is logged with an eval ID.
9. Builder mode reflects the new state on return.
10. Annotate any of this via Studio mode at any point.

## Touchpoint registry

18 stable IDs (`arrival.world-entry`, `navigation.orbit`, `navigation.zoom`,
`navigation.mode-toggle`, `config.client-switch`, `builder.region-selection`,
`builder.intervention-preview`, `avatar.enter-journey`, `avatar.approach-structure`,
`agent.select`, `agent.delegate-task`, `agent.parallel-progress`, `agent.approval-request`,
`evidence.review`, `journey.maturity-transformation`, `history.temporal-replay`,
`studio.toggle`, `studio.annotation-create`, `studio.preserve-exactly`,
`studio.iteration-build`) with full field definitions (objective, trigger, expected response,
success condition, related component, status, introduced/modified version) inline in
`index.html` (`TOUCHPOINTS` array) and browsable in-app via Studio → Touchpoint Registry.
Not every ID currently has a live in-world marker — only the subset wired to a `[data-tp]`
element does today (8 markers live in the shipped state); the rest are registered and
documented for the next iteration to wire up, per the registry's own `status` field.

## Reuse matrix (from the Asset Cartographer's discovery pass)

| Reused from | For |
|---|---|
| `saltbasinvisuallibrary.html` (canonical visual candidate; already ported into production `src/components/SaltBasinCrystal.jsx`) | Palette, camera/orbit pointer handling, glow-sprite and env-map technique |
| `saltbasincrystallineworldv5_2.html` / the "governed" v2–v4 variants | Maturity-driven facet count + color band (`symmetryClass`), rod/stage/atom world layout, flight/approach avatar mechanic |
| `saltbasinimmersive.html` / `saltbasincollab.html` (admin-configurable journey) | Agent context-cache pattern, in-world chat/agent anchor projection technique, two-client-config demonstration pattern |
| `spatialjourneyworldgood_camera_nav.html` (canonical functional candidate; ancestor of production `src/components/SpatialJourneyWorld.jsx`) | Confirms this prototype's world-building approach is consistent with what's already shipped — cross-referenced, not reimplemented from scratch |
| `SB-GEN-SPEC-001` (Genesis Program & Technical Specification v1.0) | Vocabulary (Rod/Atom/Molecule/Orbit/Evidence Chain), the deterministic render-grammar table (§14.1), the Decision Runtime predicate-table pattern (Appendix B), the Agent-Centric Security action classes (§12) |

Full lineage, duplicate-checksum, and missing-dependency findings are in the Asset
Cartographer's discovery report (delivered in-conversation, not duplicated here per the
token-discipline instruction against redundant documents).

## Known limitations and placeholders

- **Avatar is a placeholder** — a labeled colored sphere, not an approved character asset.
- **Agents are deterministic timers**, not real LLM calls — this proves the *interaction
  grammar* (delegate → concurrent progress → evidence/exception → approve), not live model
  behavior.
- **Persistence uses `localStorage`**, not IndexedDB — sufficient for this prototype's data
  volume; noted here so nobody assumes a heavier durability guarantee than exists. Durable
  export is real (a downloaded JSON file), autosave between sessions is real, but it is
  single-browser/single-profile, not synced anywhere.
- **Two of three discovery agents commissioned for this build hit an account-wide session
  limit mid-run** (Experience & Touchpoint Architect, Runtime/Feasibility Examiner) and did not
  return their reports. The Asset Cartographer's report did complete and is reflected above.
  Validation below is therefore my own direct Playwright-driven testing, not an independently
  authored second pass — flagged honestly rather than presented as fully independent QA.
- **Raycasting precision in the tightly-packed cosmos cluster view** can be fiddly at small
  scale (confirmed during testing — a click near a cluster's center can land on a neighboring
  atom rather than the intended one). Avatar mode, where atoms are laid out at full stage
  spacing, does not have this problem. Worth a pass in the next iteration if cosmos-view
  precision matters more than it does today.
- Only 8 of the 18 registered touchpoints currently have a live, clickable in-world marker
  (see Touchpoint registry above).
- Iteration Builder generates and exports a real package, but no build loop consumes it
  automatically — by design, per the brief's mandatory stopping point.

## Validation performed

Headless Chromium via Playwright (browsers pre-installed in this environment), scripted
end-to-end: world load → region selection → atom inspection → Enter Avatar Mode → Approach →
delegate both agents → evidence returned → proposal raised → Approve → maturity/conflict/facet
change confirmed in state → history log confirmed → Studio mode → touchpoint marker → annotate
→ save → page reload → feedback confirmed still present. Also checked cold `file://` load with
zero network dependency. Two real bugs were found and fixed during this pass:

1. `[data-tp]{position:relative}` (added for the Studio marker system) had equal CSS
   specificity to `.panel{position:fixed}` and came later in source order, silently breaking
   every side panel's fixed positioning. Removed — unnecessary, since touchpoint markers are
   positioned via `getBoundingClientRect()` into a dedicated fixed layer, not by relying on the
   marked element's own position.
2. Touchpoint markers were appended into `#worldLayer` (`z-index:12`), which sits below the
   side panels (`z-index:50`) and — because it establishes its own stacking context — no child
   z-index could ever raise them above those panels. Added a dedicated `#markerLayer`
   (`z-index:70`) above all chrome.

Also caught and fixed: the reference prototypes' CDN-loaded Three.js (`cdnjs.cloudflare.com`)
is blocked by this environment's outbound network policy — confirmed via direct `curl` (403)
before assuming it was a Playwright-only artifact. Vendored `three@0.128.0` (matching the `r128`
the reference prototypes use) locally via the npm registry instead, removing the dependency
entirely rather than working around a network condition that might not generalize.

Not yet independently re-validated: full keyboard-only navigation coverage, screen-reader
behavior, and a second reviewer's pass on visual/interaction fidelity — the two discovery
agents scoped for exactly that did not complete (see Known limitations). Escape-to-close,
Enter/Space marker activation, and `prefers-reduced-motion` handling are implemented in code
and exercised once each during scripted testing, but not stress-tested.
