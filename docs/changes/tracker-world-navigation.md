# Change spec — Release tracker World as the whole navigation

Feature key: `tracker-world-navigation` · Release: `2026-10-10-production-hardening-resume` (0.3.0, scope `planned`, added after the cut on owner feedback) · Version 1 · 2026-10-11
Training spec: `docs/training/tracker-world-navigation.md` (frozen as baseline v1)
Branch: `release-loop/tracker-world-navigation-build-2` (continues the stopped build on `release-loop/tracker-world-navigation-build`, commit `880278e`, which was reviewed and reused)

## Owner direction

> The World should be the whole view, not a disconnected orbit beside a side panel. Every object identifiable at a glance with a legend in place; structure that means something. Clicking an object opens its data view and highlights what is related to it. Journey-specific highlights, current versus historic. Navigation that makes sense: one layer stack, Back pops one layer, camera moves to the object and returns. (Owner feedback recorded in `docs/release-log/active-release.features.json`, commit `884b6db`.)

## Traces to

| Earlier spec / code | Version | How this builds on it |
| --- | --- | --- |
| `docs/changes/live-release-tracker.md` and `docs/training/live-release-tracker.md` (baseline v1) | v1 | Its World mode (orbit of crystals with a 400px side panel, journeys J8 and J9) is **superseded** by this feature. Its data model, ingest, Board layers, trends and settings are untouched. Steps J8.2 to J8.12 and J9.2, J9.3 and J9.6 of that baseline describe the old side-panel World and need an amendment (listed under Known limitations). |
| `docs/changes/release-scope.md` and `server/lib/releaseScope.js` | v1 | The three scope groups (This release, Added after the cut, Backlog) become the three rings (districts) of the World; `added {at, commit, reason}` is shown in the district and feature data views. |
| `tools/release-tracker/index.html` (commits `98e05dd`, `a65d21b`, `35ccc43`, `71d50e4`) | n/a | The artifact page gains the same World through the shared engine; its Board layers, trends and releases picker are unchanged. |
| `src/lib/crystalGeometry.js` (header rule: never fork geometry) | n/a | The engine uses only `addCrystalLights`, `CRYSTAL_VARIANTS.signature`, `buildGemMesh`, `buildRiverParticles` / `advanceRiverParticles`, `projectToScreen` and `buildEnvironment`. The artifact inlines that file whole (generated, never edited). |
| `docs/changes/world-shell-layers.md` | v1 | Same idea (one stack in the address, Back pops one layer); the tracker keeps its own `#/rt/...` trail (the Board already used it) rather than the World Shell's `?at=` stack, because the artifact page has no World Shell. |
| `docs/changes/render-bindings.md` and `src/lib/releaseTrackerWorld.js` | v1 | The World still draws only mapped channels; the data map and pending changes stay, now inside the feature's data view. |
| `docs/changes/platform-mcp.md`, `server/lib/mcpToolRegistry.js` | v1 | One new append-only tool, `release_tracker_world_object`. |
| `880278e` WIP salvage | n/a | Engine, `TrackerWorld.jsx`, CSS and fixtures reviewed and reused; fixed here: camera fit, label crowding, phone HUD, touch picking, scroll reset, history edge cases, `data-world` aids. |

## What changed

### One shared engine

`src/lib/trackerWorld/trackerWorldEngine.js` (no imports, no JSX; THREE and the crystal recipes are injected) is the only implementation of the World:

- **Whole-view stage**: full width, the data view opens over the stage (a right panel on desktop, a bottom sheet with Collapse/Expand on a phone) instead of beside it.
- **Structure that means something**: the Sun is the release (label: version, live/as-of, "n of m passed (this release)"); three concentric rings are the scope districts from `releaseScope`, each with a name pill ("THIS RELEASE 1/3 passed"); a feature is a crystal on its district's ring (colour = status, size = steps in its suite, gold arc = share passing, bubbles = an agent running); bugs are gems, test rounds cubes, agents tetrahedra orbiting their feature. A district pill sits at the widest gap of its ring so it never covers a crystal.
- **Labels and legend**: every feature has a persistent two-line label (name, then status · steps · percentage; "not tested yet" for an untested feature, never 0); a legend in place (rings, crystal, satellites, bug states); headline chips; an **Objects** list holding every object (districts, features, bugs, rounds, agents) as links. On a phone the six feature labels collapse and everything stays reachable from **Objects**.
- **Object data views** (HTML built by the engine, escaped): feature (where it sits incl. added-after-the-cut reason, latest test, journey chart and rows, bugs, agents, related), bug (ribbon Found / Being fixed / Verified fixed, history, root cause, scope owner), agent (loop stage, activity, tokens, live test log, agents on that feature in order), district (at a glance, notes, table). Round and stat layers are drawn by the host (Board layer) inside the same data view.
- **Related highlights** (`relatedOf`): selecting an object lights its bugs, rounds, agents, its district and the features it depends on, depends on it, or shares a bug with (a reassigned bug links the reporting feature and its owner) and dims the rest; thin lines join linked features. The camera moves to the object and returns on Back.
- **Journey and history**: **Current** / **Historic** toggle and the time slider (one point per recorded state, update markers, previous/next update); Historic draws the recorded state at the chosen point, marks every changed feature "changed since" with a ring and label, and the data view says what changed ("Status: Failing → Fixed, awaiting retest"), marks journey rows "after this point", and says plainly that bugs and agents are counts only at an earlier point. A feature not yet tracked then is drawn "Not tracked yet".
- **Navigation**: one trail shared with the Board (tokens `feature:`, `bug:`, `agent:`, `round:<key>:<n>`, `scope:`, `stat:`); links go one layer deeper from where you are, **‹ Back** pops one layer, **Overview** returns to the top; keyboard (arrows move a cursor over districts, features and satellites, Enter opens, Escape goes back, +/- zoom), pointer and touch (nearest-crystal picking with a finger-sized reach), drag/pinch/wheel camera; reduced motion cuts instead of flying and stops ambient motion; **Pause motion** on desktop.
- **Test aids**: `data-world` and `data-crystals` on the stage element (documented in the training spec), published at every state change.
- Pure functions exported for the server and tests: `buildWorldModel`, `selectionOf`, `relatedOf`, `worldObjectData`.

### Platform screen

`src/components/releaseTracker/TrackerWorld.jsx` mounts the engine inside World Shell -> Journeys -> Release tracker and fills the engine's slot with the platform-only sections (render-binding data map, pending changes, the Board's own layers for stat and round tokens). `releaseTracker.css` drops the old side-panel styles; `html[data-rt-view="world"]` removes the page width cap and the intro line so the world gets the screen. `releaseTrackerWorld.js` keeps the binding resolver.

### Artifact page

`tools/release-tracker/index.html` now mounts the same engine (a generated block between `world-engine:begin` and `world-engine:end`). `tools/release-tracker/sync-world-engine.mjs` regenerates it (`--write`) or checks it; `sync-setup-guide.mjs` checks/regenerates both the block and the page copy embedded in `SETUP-FOR-CLAUDE.md` (which gains a paragraph describing the World). `preview.html` now answers `releases/*` documents with nothing instead of the snapshot (the old stub made the releases picker throw a page error offline).

### API and MCP (interface parity)

- `GET /api/release-tracker/world/object?object=<token>&at=<n|current>&release=<key>` (admin or granted member; same `requireViewer` as `/state`) returns the object's related objects (with reasons), journey rows, what changed since a historic point, and the object's facts. Server function `getWorldObject` in `server/lib/releaseTrackerService.js`, which calls the engine's `worldObjectData` (the screen runs the same function, so the three interfaces cannot disagree). Plain errors: 400 `object_required`, 400 `at_invalid`, 404 `object_not_found`, 404 `tracker_empty`.
- MCP tool `release_tracker_world_object` (scope `release.read`, permission `user` + the same tracker access check), added to `server/data/mcpToolManifest.json` (append-only); capability row `release-tracker-world` in `server/lib/capabilityParity.js`; descriptor in `RELEASE_TRACKER_TOOLS`.
- No new table, setting or schema.

### Fixtures

`docs/training/fixtures/tracker-world-navigation/` (fictional demo release 0.9.0, "demo harbor", six features, six bugs, ten agents, five recorded states, four updates): `build-fixture.mjs` regenerates `push.json` (for the platform's **Paste a snapshot**) and `artifact.json` (for the preview harness). The committed outputs are the fixtures; do not regenerate them during a test.

## Behaviour changes to know

- The old side-panel World is gone on both surfaces; steps of `live-release-tracker` that describe it no longer hold (see Known limitations).
- A feature with no recorded test shows "not tested yet" on the label, in the list and in the data view; the gold arc is not drawn and nothing says 0.
- Opening an object from the **Objects** list or a related link adds one layer to the current trail (like every Board link); **Overview** clears it.
- Historic keeps the open object and remembers the last point used.
- Satellites in Historic are drawn from the recorded counts per feature (not individual bugs), as before.

## Verified (initial check)

- `npm run build` passes; the server boots against a fresh database (`sb_rl_bld_16900_1`) and `npm run seed` completes.
- `node tools/release-tracker/sync-setup-guide.mjs` exits 0 (page block and guide copy match their sources).
- `node scripts/check-interface-parity.mjs` OK (the one remaining gap, `release-tracker-admin` MCP, predates this feature).
- Every journey of the training spec walked once in Chromium on desktop (1280x900) and on a phone (390x844, touch): artifact page Journeys 1 to 5, 8, 9, platform Journey 6 and the API and MCP Journey 7. Results in the build agent's report.

## Known limitations

- Proposed amendment (not made by the build agent, which may not edit baselines): `docs/training/live-release-tracker.md` steps J8.2 to J8.12 and J9.2, J9.3, J9.6 describe the superseded side-panel World (panel text "How to read the world" / "Every crystal", camera fly-in to `#/rt/feature:wave-gauge` with a side Data map, slider line "Release 0.2.0 as of …", the three-label phone layout). They should be re-pointed at the new World or retired as duplicates of this spec's Journeys 1 to 6. `docs/training/platform-mcp.md` J2.1 lists an exact tool set; it already differs from the registry and gains one more tool here.
- Bugs and agents in Historic are counts only (the record keeps no per-point bug list).
- The 3D scene itself is drawn with WebGL; the Objects list and data views carry every fact for a browser without it (the screen says so).

## Fix notes per round (appended by fix agents)

(none yet)
