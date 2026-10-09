# Change spec — Live release tracker inside the Salt Basin platform

Feature key: `live-release-tracker` · Release: `2026-10-02-application-packages-resume` · Version 1 · 2026-10-09
Training spec: `docs/training/live-release-tracker.md` (frozen as baseline v1 by the integrator)
Branch: `release-loop/live-release-tracker-build-2` (the name `release-loop/live-release-tracker-build` was already checked out in another worktree, so this build used the `-2` branch)

## Owner direction

> "i want to rebuild this into my platform for real time updates in the salt basin website itself." (2026-10-09)
> "turn this into something accessible through a 3d interactive experience using salt basin 3d objects" (World view, prototype to extend to other data)
> "make it an underwater scene" (environment)
> Render bindings: every visual channel is mapped to a source field, with a legend and a change policy; pending changes are drawn as ghosts with an impact list.

## Traces to

| Earlier spec / code | How this builds on it |
| --- | --- |
| `tools/release-tracker/index.html` (reference prototype, commits `98e05dd`, `a65d21b`) | Its data rules, layers, chart palette and underwater environment are the spec. Ported to `src/lib/releaseTrackerModel.js`, `src/components/releaseTracker/*`, `src/lib/worldEngine/graphWorld.js`, and an environment in `src/lib/crystalGeometry.js`. |
| `scripts/release-tracker-sync.mjs`, `release-history.mjs`, `release-update.mjs` | Define the snapshot, history and updates JSON the platform ingests. `release-tracker-sync.mjs` gains an optional push. |
| `docs/changes/release-intelligence.md` (v1) and `server/lib/releaseIntelligenceSchema.js` | No second release store. Every stored snapshot is also handed to `releaseLogImporter.importSnapshot`, so the `release_*` reconciliation tables stay in step. The new tables sit in the same lazy schema function. |
| `docs/changes/render-bindings.md` (design, v1, not built) | `render-bindings` is not merged. The tracker implements its bindings through a LOCAL registry with the shared contract (`src/lib/renderBindings.js`), so it swaps to `server/lib/renderBindingRegistry.js` without changing the renderer. |
| `src/lib/crystalGeometry.js` (header rule: never fork geometry) | The World uses only `addCrystalLights`, `CRYSTAL_VARIANTS.signature`, `buildGemMesh`, `buildRiverParticles` / `advanceRiverParticles`, `projectToScreen`, plus the new `buildEnvironment`. |
| `docs/changes/world-shell-opportunity-outputs.md`, `src/lib/worldIslands.js`, `WorldShell.jsx` | The tracker is an `embed` island reached from World Shell -> Journeys. |
| Release loop v3/v4 (`server/data/releaseLoop/definition.json`: interfaceParity, specGovernance) | Training spec has stable step ids, UI + API + MCP surfaces per journey, 390px walkthrough. |

## What changed

### Data model (additive only; created lazily by `ensureReleaseIntelligenceSchema()`, never in bootstrap)

- `release_tracker_snapshots` (append-only): `release_key`, `source` (`push` | `pull` | `poll` | `webhook` | `manual`), `source_ref`, `content_hash`, `snapshot_at`, `received_at`, `snapshot JSONB`, `extras JSONB` (carried history + commit), `reconcile_note`.
- `release_tracker_tokens`: `kind` (`ingest` | `share`), `release_key`, `label`, `token_hash` (SHA-256; plaintext shown once), `token_hint` (last 4), `created_at`, `revoked_at`, `last_used_at`.
- `release_tracker_ingest_log`: every ingest attempt (stored / unchanged / rejected / error) so a failure is visible on the Settings tab.
- Settings: `config_state` row `release_tracker_settings` (repo, branch, source base URL, poll interval, default release key, committed-file paths, member emails, share-links switch, webhook secret encrypted with `TOKEN_ENCRYPTION_KEY`).
- No member rows are written. `defaultMemberConfig.js` gains one `memberTabs` entry (`releaseTracker`); `memberConfig.js GET /draft` removes it at read time for anyone not granted. `db.js` adds one `admin_nav` tab (`release-tracker`) through the existing additive nav migration.

### Server

- `server/lib/releaseTrackerService.js`: settings, sanitising (clips every string, drops unknown keys: labels and counts only), append-only ingest with identical-content detection, derived recorded states for snapshots that carry no history, pull from committed files (`normalizeCommitted`), tokens, access, poller (`startReleaseTrackerPoller`), SSE hub, and `RELEASE_TRACKER_TOOLS` (MCP tool descriptors).
- `server/routes/releaseTracker.js` mounted at `/api/release-tracker`:
  `GET /access`, `GET /state`, `GET /stream` (SSE), `GET /shared/:token/state`, `GET /shared/:token/stream`, `POST /snapshots` (ingest token OR admin), `POST /pull`, `POST /webhook/github` (HMAC-SHA256, raw body, registered ahead of the JSON parser in `server/index.js`), `GET|PUT /settings`, `POST /settings/webhook-secret`, `GET|POST /tokens`, `DELETE /tokens/:id`, `GET /snapshots`, `GET /ingest-log`.
- Permission model: admin always; a member only when their email is listed on the Settings tab; a share link only through its own token; an ingest token only for `POST /snapshots` and only for the release it was made for. Creating a share link publishes the tracker, so it goes through `assertReadyToFinalize` (client: `useToolCategoryGate().run`).
- Real time: `snapshot` events on the stream; `denied` events when access is removed or a share link revoked (the stream is ended and the screen shows the refusal).

### Client

- `src/components/releaseTracker/ReleaseTrackerApp.jsx` (screen), `TrackerTrends.jsx` (SVG chart, no CDN script), `TrackerLayers.jsx` (drill-down), `TrackerWorld.jsx` (World mode), `TrackerSettings.jsx` (Settings), `ReleaseTrackerPages.jsx` (`/release-tracker`, `/release-tracker/shared/:token`), `releaseTracker.css` (scoped `.rt-*`; light + dark; validated series colours).
- `src/lib/releaseTrackerModel.js` (pure data rules), `releaseTrackerWorld.js` (bindings + adapter), `renderBindings.js` (binding contract), `worldEngine/graphWorld.js` (generic engine: graph contract in its header), `crystalGeometry.js` (`buildEnvironment`, `ENVIRONMENTS.underwater`).
- World Shell: island `releaseTracker` (`worldIslands.js`, `WorldShell.jsx`); a `#/rt/...` hash on `/world` reopens the island so refresh restores the path.
- Claude Code side: `scripts/release-tracker-push.mjs` (+ optional push at the end of `release-tracker-sync.mjs` when `PLATFORM_URL` and `RELEASE_TRACKER_INGEST_TOKEN` are set; a failed push is logged to stderr and the sync exits 3).
- Fixtures (fictional): `docs/training/fixtures/live-release-tracker/`; fixture repository server `scripts/release-tracker-fixture-server.mjs`.

## Behaviour changes to know

- The platform never claims freshness it does not have: the header always reads `Live`, `Connecting…` or `Live stream interrupted — checking every 10 s`, plus `Updated N s ago` from the time the newest snapshot arrived.
- A snapshot identical to the newest one for its release is logged as `unchanged` and not stored again; everything else is a new row (history is replayable).
- A pulled repository has no agents (the committed state file carries none), so Agents running is 0 and no bubble stream is drawn for pulled data; pushed snapshots carry agents.
- When two releases exist the screen shows the newest snapshot's release and a Release selector.
- The World shows individual bugs only for the live state; replaying an earlier moment draws satellites from the recorded counts.

## Verified (initial check)

`npm run build` passes; server boots on a fresh database; every journey of the training spec walked once in Chromium (desktop 1280x900 and 390x844 phone, light and dark) with the fixture repository server and curl pushes. Results are in the build handoff.

## Known limitations

- MCP: `server/lib/mcpToolRegistry.js` does not exist on this branch. Each capability is exposed as a descriptor in `RELEASE_TRACKER_TOOLS` calling the same service function; registration is MCP_GAP assigned to `platform-mcp`.
- Render bindings are local (see Traces to). The "pending ghost" is derived from bug status (`fixed_awaiting_retest`, `retesting`); there is no approver workflow beyond the next re-test, as in the prototype.
- The stream drop fallback (polling every 10 s) cannot be forced from the UI; it is covered by an edge case that uses the browser's offline switch, not a numbered journey step.
- Mid-snapshot history points created from pushed snapshots without history are derived from the snapshot's bugs and features, so earlier states recorded by the sync script (with `history.json`) are preferred whenever supplied.

## Fix notes per round

(appended by fix agents)
