# Salt Basin Genesis — Experience Proof (v2)

A working, self-contained browser prototype proving the canonical two-layer interaction model
for Salt Basin Genesis: business rules are authored once in **Definition Studio**, then put
into motion by end users in **Your Journeys** — nothing runs that wasn't governed first. This
is ahead of any production backend, runtime, or mapping-compiler work (per `SB-GEN-SPEC-001`,
this is a Phase 6 "Playable world" proof — it deliberately does not implement Phases 0–5).

This lives entirely outside `src/` and `server/` and does not read from, write to, or require
the production app, database, or auth. It is safe to open, edit, and delete independently of
the rest of the repository.

## Run it

No build step. Either:

- **Double-click** `experience-proof/index.html` (works via `file://` — Three.js is vendored
  locally at `vendor/three.min.js`, not loaded from a CDN, so it has zero network dependency).
- Or serve the folder with any static server, e.g. `python3 -m http.server 8080` from inside
  `experience-proof/`, then open `http://localhost:8080/`.

Click **Enter Your World** on the intro screen — the 3D scene only initializes after that
click (matches the reference "Deal Journey Prototype" pattern this build adopted).

## The two layers — and why they exist

The real platform separates *what's governed* from *who's running it* (`SB-GEN-SPEC-001` §3:
R4 Organization Configuration vs. R5 Runtime Event Store). This prototype makes that split
literal and playable instead of leaving it as an abstract diagram:

| Layer | World | Badge | What happens here |
|---|---|---|---|
| **R4 — Organization Configuration** | **Definition Studio** | teal `R4 · ORG CONFIGURATION` | Author policies, answer guided intake questions, add scenarios, assign approver roles, and *translate* an approved rule into governed predicate/transition logic. |
| **R5 — Runtime Event Store** | **Your Journeys** | gold `R5 · RUNTIME EVENT STORE` | End users delegate agents, review evidence, and approve transitions — but only against atoms a compiled R4 policy actually governs. |

The breadcrumb and a persistent layer badge (top of screen) always show which side you're on.
Every governed atom in Your Journeys carries a **"Governed by → POL-xxx"** link that jumps
straight back to the exact policy in Definition Studio that authorizes it — the cross-layer
traceability the whole rebuild was about, not just a label.

### The causality is real, not decorative

Two atoms prove this two ways:

- **Bill-To Party Definition** (Revenue Rod, Contract stage) ships **pre-governed** — `POL-BILLTO`
  is already compiled, so its agent-delegation → evidence → approve loop works immediately.
- **Renewal Risk Score Definition** (Customer Rod, Renewal stage) ships **ungoverned** — its
  crystal renders dim with a dashed cage, and "Delegate to Agents" is disabled. It stays that
  way until you go to Definition Studio → Business Definition Builder → select the *Renewal
  Risk Score Policy* → answer the guided question → write the rule → assign and approve a role
  → **Translate to Governed Logic**. Only then does the atom back in Your Journeys light up,
  unlock delegation, and become mature-able — confirmed end-to-end in automated testing.

## What's here

- **Home (Work World hub)** — five crystals: Definition Studio, Your Journeys, and Configure
  Profile are real and enterable; two ("Review Prospects", "Escalate Deals") are explicit
  "World In Progress" states, demonstrating the roadmap without faking functionality.
- **Definition Studio** — three modules:
  - **Public Site Configuration** — org pages/sub-pages matching the real `site_state` page
    shape (`key`/`name`/`slug`/`status`/`order`/`subpages`). Add a sub-page, publish/unpublish,
    open a table view. Publishing a page visibly changes its crystal from dim/mauve to
    lit/teal.
  - **GTM & Operations Diagnostic** — a short guided assessment (3 questions) that computes a
    real capability/maturity scorecard from your answers, not a canned score.
  - **Business Definition Builder** — the deepest module: upload-source-file simulation,
    guided intake questions, scenario tracking, plain-language policy authoring, approver-role
    assignment + approval, and a **Translate** step that compiles the approved rule into
    predicates and a lineage record an agent can cite but never author on its own.
- **Your Journeys** — the Universe Builder / Active Avatar loop: an elevated cosmos view of
  the three Journey Rods, a placeholder avatar (clearly labeled) that approaches a selected
  stage, two bounded agents with explicit capability limits that delegate concurrently and are
  spatially anchored to the atom they're working on (not chat-only), an Evidence & Proposed
  Transition panel with a predicate pass/fail table (mirrors `SB-GEN-SPEC-001` Appendix B), and
  Approve/Reject/Defer actions. Approving deterministically recomputes the atom's facet count,
  color, and glow (the render grammar from §14.1), animates the crystal, and leaves a fading
  wireframe "historical echo."
- **Experience Studio** — Studio-mode toggle; a stable touchpoint registry (dot-notation IDs,
  never DOM selectors); click-to-annotate touchpoint markers; a Feedback Queue with the full
  lifecycle (`draft` → … → `accepted`/`rejected`/`superseded`); a Preserve Exactly ledger; an
  Iteration Builder that only accepts `approved_for_iteration` feedback; local autosave with a
  saved/unsaved indicator (now flushed synchronously on `beforeunload`/`pagehide`, not just a
  debounce, so a draft survives even an immediate reload); and JSON export/import.
- **Unified pointer controls** — one control scheme for mouse drag, touch drag, pinch-zoom, and
  wheel-zoom, with a tap/click distinguished from a drag by movement and duration thresholds
  (adopted from the "Deal Journey Prototype" reference). Arrow keys nudge the camera; Escape
  closes the topmost panel/modal.
- **Visible failure, never silent** — a `window.onerror`/`unhandledrejection` handler surfaces
  a banner instead of a blank screen; the render loop catches its own errors and halts cleanly
  rather than spamming the console; a `hasWebGL()` guard runs before any Three.js call.

## Touchpoint registry

22 stable IDs spanning both layers — `arrival.world-entry`, `navigation.orbit`,
`home.action-defstudio`, `home.action-journeys`, `defstudio.module-sitecfg`,
`defstudio.module-gtm`, `defstudio.module-defbuilder`, `sitecfg.page-select`,
`sitecfg.publish`, `gtm.wizard-step`, `gtm.results`, `defbuilder.upload`,
`defbuilder.question-answer`, `defbuilder.scenario-add`, `defbuilder.policy-define`,
`defbuilder.role-assign`, `defbuilder.translate`, `journeys.governed-link`,
`avatar.approach-structure`, `agent.delegate-task`, `evidence.review`,
`journey.maturity-transformation` — defined inline in `index.html` (`TOUCHPOINTS` array) and
browsable in-app via Studio → Touchpoints. As in v1, only the subset wired to a live
`[data-tp]` DOM element gets a clickable in-world marker today (8 confirmed live); the rest are
registered for the next iteration to wire up.

## Known limitations and placeholders

- **Avatar is a placeholder** — a labeled colored sphere, not an approved character asset.
- **Agents are deterministic timers**, not real LLM calls — this proves the *interaction
  grammar*, not live model behavior.
- **Persistence uses `localStorage`**, not IndexedDB — durable export is a real downloaded
  JSON file; autosave is real but single-browser/single-profile.
- **File upload in Business Definition Builder is simulated** — clicking the dropzone appends a
  fixed placeholder file record; it does not read a real file from disk. Deliberate for a
  local-state-only prototype, flagged so it isn't mistaken for real ingestion.
- **Cosmos-view raycasting precision**: clicking very close to a cluster's center can land on a
  neighboring atom rather than the intended one at small scale. Avatar mode (full stage
  spacing) doesn't have this problem.
- **Cross-view mesh sync**: an atom's `_mesh` reference points at whichever view (cosmos or
  avatar) built it most recently. Approving a transition while the *other* view is what's
  currently mounted will still update the data model and history log correctly, but that other
  view's crystal won't visually refresh until you re-enter it. The demoed flow (approve while
  the target atom's own view is open) is unaffected; noted here rather than fixed, given time
  budget, since it's cosmetic staleness, not a data-correctness issue.
- Only 8 of 22 registered touchpoints currently have a live in-world marker.
- Iteration Builder generates and exports a real package, but no build loop consumes it
  automatically — by design, per the brief's mandatory stopping point.

## Validation performed

Headless Chromium via Playwright, scripted end-to-end for v2: Home → Definition Studio →
Business Definition Builder → work the *ungoverned* Renewal Risk policy through every wizard
step (question → rule → role assignment → approval → translate, confirming all three predicates
pass and status flips to `compiled`) → Home → Your Journeys → Customer Rod → confirm the atom
now shows "Governed by POL-RENEWAL →" and Delegate is enabled → delegate both agents → evidence
returned → proposal raised → Approve → confirmed maturity 40%→82%, `conflict` cleared, source
cites the policy → jumped the Bill-To atom's lineage link back to Definition Studio → published
a Site Config page → completed the GTM Diagnostic wizard and scorecard → Studio annotate → save
→ reload → confirmed the draft feedback survived. Also confirmed cold `file://` load.

Real bugs found and fixed during this pass (in order found):

1. `App._setLevel()` called `UI.hideComingSoon()`, which didn't exist on the `UI` object (lost
   in translation from the v1 `App`-scoped version). It threw on **every** level transition,
   including the very first one at boot — so `STATE.LEVEL` never actually updated and every
   world group stayed hidden. This was the root cause of "nothing is clickable."
2. `UI.renderBreadcrumb()` was called throughout but never implemented — added it along with
   the R4/R5 layer badge logic.
3. `Studio.decorateMarkers()` was called on every animation frame (60/sec) whenever Studio mode
   was on, destroying and recreating every touchpoint-marker DOM node continuously — a click had
   almost no chance of landing before its target was replaced. Touchpoint markers sit on static
   2D panel elements, not moving 3D objects, so they never needed per-frame repositioning;
   removed the per-frame call, kept the event-driven one (panel open/close, resize).
4. `GLOW_TEX` (the shared radial-gradient sprite texture for every crystal's glow) was built but
   never actually assigned — every glow rendered as a flat square instead of a soft radial
   highlight. Fixed the missing `GLOW_TEX = new THREE.CanvasTexture(c)` assignment.
5. `levelToGroupKey('journeyAvatar')` incorrectly mapped to the cosmos group, so raycasting in
   Avatar mode would have silently checked the wrong Three.js group. Fixed the mapping, and
   added pickables cleanup on repeated avatar-mode entry to prevent stale references
   accumulating across visits.
6. Studio's autosave was purely debounced (400ms) with no flush on page unload — a draft saved
   right before a reload could be lost if the reload happened inside the debounce window. Added
   `beforeunload`/`pagehide` listeners that flush synchronously, so "draft feedback survives
   reload" (an explicit acceptance criterion) holds even under fast navigation, not just when
   the user pauses first.

As with v1: not yet independently re-validated by a second reviewer — this is my own
Playwright-driven testing. Full keyboard-only navigation coverage and screen-reader behavior
are implemented in code (Escape closes panels, Enter/Space activate touchpoint markers,
`prefers-reduced-motion` disables idle rotation) but exercised only lightly during scripted
testing, not stress-tested.
