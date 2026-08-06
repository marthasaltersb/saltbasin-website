# Salt Basin Genesis — Experience Proof (v3)

A working, self-contained browser prototype proving how Salt Basin Genesis is layered: rules and
agents are configured once, then run against real day-to-day work. This is ahead of any
production backend, runtime, or mapping-compiler work (per `SB-GEN-SPEC-001`, this is a Phase 6
"Playable world" proof — it deliberately does not implement Phases 0–5).

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

## Four worlds — how the real platform is layered, made playable

v3 replaces the single "choose your path" list with four orbiting worlds, entered from Home.
Each is its own crystal orbit; the items orbiting it are either **deep modules** (their own
further level, camera re-centers) or **lighter modules** (a config-driven form/list that renders
inline in the hub's own side panel — no extra 3D level, but real, editable data).

| World | Badge | What happens here |
|---|---|---|
| **Definition Studio** | teal `R4 · ORG CONFIGURATION` | Current State Diagnostic, Future State Process Definitions, Policies & Business Rules, KPI Definitions & Outcomes Mapping, Public Site Configuration. |
| **The Agent Hub** | gold `R5 · RUNTIME EVENT STORE` | Agent Hierarchy (who reports to whom), Agent Schedules (when an agent runs unprompted), Agent Experience (the approval workflow gate + a live activity feed). |
| **User Configuration** | none — per-user, not org-governed | Account Settings, Payment Settings, Organization Alignment, Email Configuration, Visual Interface (a real, live accent-color picker). |
| **Day to Day** | gold `R5 · RUNTIME EVENT STORE` | Customer Health, Pipeline, Account Planning, Deal Journeys (the Universe Builder / Active Avatar loop, relocated here from v2's "Your Journeys"), and a Task List **computed live** from real app state. |

The breadcrumb and a persistent layer badge (top of screen) always show which world/module
you're in and its DB-layer analog. Definition Studio's policies still carry the v2 causality
proof through to Deal Journeys — see below.

### The causality is still real, not decorative

- **Bill-To Party Definition** (Revenue Rod, Contract stage) ships **pre-governed** — `POL-BILLTO`
  is already compiled, so its agent-delegation → evidence → approve loop works immediately.
- **Renewal Risk Score Definition** (Customer Rod, Renewal stage) ships **ungoverned** — its
  crystal renders dim with a dashed cage, and "Delegate to Agents" is disabled. It stays that
  way until you go to Definition Studio → Policies & Business Rules → select the *Renewal
  Risk Score Policy* → answer the guided question → write the rule → assign and approve a role
  → **Translate to Governed Logic**. Only then does the atom back in Deal Journeys light up,
  unlock delegation, and become mature-able.

## What's here

- **Home** — four hub crystals: Definition Studio, The Agent Hub, User Configuration, Day to
  Day. No stubbed "coming soon" items — every hub is real.
- **Definition Studio** — five orbit items. Current State Diagnostic and Policies & Business
  Rules are the deep v2 modules (renamed, unchanged mechanics — guided assessment scorecard;
  upload/question/scenario/policy/role/translate wizard). Future State Process Definitions and
  KPI Definitions & Outcomes Mapping are new, lighter config-driven list modules (add an item,
  see it persist). Public Site Configuration is unchanged from v2 (publish/unpublish pages,
  add sub-pages, table view).
- **The Agent Hub** — the deep area for this pass, built around a `personFigure()` builder
  (distinct from the crystal builder — agents are actors, not data):
  - **Agent Hierarchy** — a real tier-0/tier-1 org chart over the four bounded agents (2 roots,
    2 children), with a "Reports To" dropdown that actually reassigns an agent's rollup parent
    and redraws the connecting line in 3D.
  - **Agent Schedules** — per-agent cadence (on-demand, daily, weekly, hourly) and an
    active/paused toggle that recolors the agent's schedule crystal.
  - **Agent Experience** — the two-step approval workflow (Evidence Review, Proposal Approval)
    with an editable "required approver role" gate per step, plus a live feed of the most recent
    agent actions pulled from the same history log Deal Journeys writes to.
- **User Configuration** — five lighter modules, all real edits against a `UserSettings`
  object: Account, Payment, Organization Alignment, and Email Configuration are generic
  form modules (see below); Visual Interface is a working accent-color picker — selecting a
  swatch calls `document.documentElement.style.setProperty('--gold'/'--teal', …)` and the whole
  UI (buttons, badges, dots) recolors live, no reload.
- **Day to Day** — five orbit items. Customer Health, Pipeline, and Account Planning are
  lighter list modules. Deal Journeys is the full v2 Universe Builder / Active Avatar loop,
  unchanged: elevated cosmos view of the three Journey Rods, a placeholder avatar that approaches
  a selected stage, two-to-four bounded agents (now sourced from the same `AGENTS` array The
  Agent Hub configures) that delegate concurrently, an Evidence & Proposed Transition panel with
  a predicate pass/fail table, and Approve/Reject/Defer. Task List is **computed, not
  hardcoded** — it reads live from `DefinitionRegistry.policies`, `OrgSite.pages`,
  `GTMDiagnostic.completed`, and `agentsRuntime` proposals to surface exactly what needs
  attention right now, each item deep-linking back to where it's resolved.
- **Generic config-driven module renderer** — `LIST_MODULES` is a single config object (list
  items, editable forms, or the visual-theme picker) rendered by one shared
  `UI.renderModuleDetail()` function, used by 8 different orbit items across three worlds. Adding
  a new lighter item is adding an entry to this object, not writing new render code — the
  "users shouldn't have to touch code to add a new configurable thing" principle applied for
  real within this prototype's own architecture.
- **Experience Studio** — unchanged from v2: Studio-mode toggle; stable touchpoint registry;
  click-to-annotate markers; Feedback Queue with full lifecycle; Preserve Exactly ledger;
  Iteration Builder; local autosave with synchronous flush on `beforeunload`/`pagehide`; JSON
  export/import.
- **Unified pointer controls, visible failure, deterministic render grammar** — all unchanged
  from v2 (see the v2 section below for details); every crystal's facet count / color / glow
  still derives from `maturity` + `conflict` per `SB-GEN-SPEC-001` §14.1.

### What was retired

Home's old "Configure Profile" and the two stubbed "World In Progress" items ("Review
Prospects", "Escalate Deals") are gone — the new four-hub structure replaces Home entirely, and
this build doesn't ship stubbed functionality. `App.showComingSoon()` and the
`#comingsoon-overlay` were removed as dead code once nothing referenced them.

## Touchpoint registry

40 stable IDs spanning all four worlds — see `TOUCHPOINTS` in `index.html`. As in v1/v2, only
the subset wired to a live `[data-tp]` DOM element gets a clickable in-world marker; the rest are
registered for the next iteration to wire up (same documented policy as v2 — not every
touchpoint needs a marker to be a real interaction).

## Known limitations and placeholders

- **Avatar is a placeholder** — a labeled colored sphere, not an approved character asset.
- **Agents are deterministic timers**, not real LLM calls — this proves the *interaction
  grammar*, not live model behavior.
- **Persistence uses `localStorage`**, not IndexedDB — durable export is a real downloaded
  JSON file; autosave is real but single-browser/single-profile.
- **File upload in Policies & Business Rules is simulated** — clicking the dropzone appends a
  fixed placeholder file record; it does not read a real file from disk.
- **Agent Hierarchy's "Reports To" dropdown only offers tier-0 agents** — reassigning to a
  tier-1 agent (a 3-level chain) isn't modeled; the 3D view and list only render two tiers.
  Deliberate scope boundary, not a bug.
- **3D world labels can overlap at some camera angles** — e.g. a hub's title label and a distant
  item label can project to nearby screen positions depending on orbit angle. Cosmetic, not
  fixed given time budget (same class of gap as v2's noted cross-view mesh staleness).
- Only a subset of the 40 registered touchpoints currently have a live in-world marker.
- Iteration Builder generates and exports a real package, but no build loop consumes it
  automatically — by design.

## Validation performed

Headless Chromium via Playwright, scripted end-to-end for v3: Home → all 4 hub pickables
confirmed → Definition Studio → futurestate lighter module (add item, confirm persisted) →
Policies & Business Rules → worked the *ungoverned* Renewal Risk policy through every wizard
step to `compiled` → Home → The Agent Hub → Agent Hierarchy → selected the Reconciliation Agent
→ reassigned its "Reports To" via the dropdown → confirmed the data model updated → Agent
Schedules → toggled a schedule active/paused, confirmed the crystal and data updated → Agent
Experience → set a workflow step's required approver role → confirmed the activity feed reads
from the shared history log → User Configuration → edited Account Settings, confirmed the write
→ Visual Interface → applied a swatch, confirmed `--gold` actually changed on `documentElement`
→ Day to Day → Customer Health lighter module render → Task List confirmed computed (not
hardcoded) from live draft-policy/unpublished-page/incomplete-diagnostic state → Deal Journeys
(reached via Day to Day, not Home) → confirmed the full v2 governed-atom/agent/evidence/approve
loop still works unchanged → confirmed breadcrumb correctly nests Home / Day to Day / Deal
Journeys / Customer Journey Rod. Also confirmed cold `file://`-equivalent load and zero real
console errors (the only console entry is the browser's automatic, harmless `favicon.ico` 404).

Real bug found and fixed during this pass:

1. **Agent Hierarchy's tier-1 child figures rendered off-screen.** `buildAgentHierarchy()`
   originally placed tier-1 children at `radius + 3.4` (≈9.4 world units) while `_setLevel` set
   the camera's `orbitRadius` for that level to only 14 — far tighter than every other module's
   camera-distance-to-content-radius ratio (~2.2–2.5x elsewhere, ~1.5x here). At the default
   camera angle, a projected child position landed at screen y≈1057 in a 900px-tall viewport —
   entirely below the fold, so raycasting could never select it and the "Reports To" reassignment
   UI was unreachable. Fixed by tightening the child offset to `radius + 2.2` and widening the
   level's `orbitRadius` to 19, matching the ratio every other hub uses. Confirmed via a
   Playwright reproduction (manual raycast-to-screen-coordinate math showing the out-of-bounds y)
   before and after the fix.

As with v1/v2: not yet independently re-validated by a second reviewer — this is my own
Playwright-driven testing.

---

## v2 architecture reference (superseded, kept for continuity)

v2's "two-layer" model (Definition Studio vs. "Your Journeys") is still present conceptually —
Definition Studio is unchanged, and "Your Journeys" is now reached as Day to Day → Deal Journeys
rather than as a Home-level hub of its own. All of v2's mechanics (unified pointer controls,
deterministic render grammar, Decision Runtime predicate table, Agent-Centric Security action
classes, Experience Studio) carry forward unchanged; see git history for the full v2 README if
you need the original two-hub framing.
