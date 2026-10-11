# Change spec: Release scope (planned vs backlog vs added after the cut)

Version 1, 2026-10-10. Release 0.3.0. Session S-0.3.0-02-build.

## Owner direction (2026-10-10)

> Now that we're in a new release, we have to define the features we're trying to do vs the backlog (not this
> work) vs newly added from this release.

Decision for 0.3.0 (owner chose "Recommended, minus added"): **planned** = production fixes, every carried
unfinished feature and the three unblocked new features; **backlog** = delivered features with only open bugs
(qr-gated-outputs, release-loop-tooling, release-intelligence, in-app-release-loop) and the owner-blocked features
(career-application-journey, career-master-single-source); **added after the cut** = guided-training-agent,
global-change-standard, security-provisioning-model, recorded as added and kept in backlog for now. This
feature itself (release-scope) was added after the cut at the owner's request, as planned work.

## Traces to

- `docs/changes/release-cut-and-session-plans.md` / commit 7d76341 (release cut, `kind` carried / carried_backlog / new,
  session estimates). `kind` says where a feature came from; it never said whether it is this release's work.
- Commit 0bee332 (owner decisions after the cut that added three features to 0.3.0).
- `docs/changes/live-release-tracker.md` (platform tracker: snapshot ingest, pull from committed files).
- `docs/changes/release-loop-tooling.md` (tracker artifact page, `scripts/release-tracker-sync.mjs`).

## What changed

### Data model (no new tables)

Each feature in `docs/release-log/active-release.features.json` gains:

| Field | Values | Meaning |
| --- | --- | --- |
| `scope` | `planned` / `backlog` | Planned is this release's work and the only thing the release score counts. Backlog stays on the record (its bugs never disappear) but is not worked or counted. |
| `added` | `{ at, commit, decidedBy, reason }` | Present only when the feature joined after the cut. An added feature still has a scope, so scope growth is visible, not hidden. |
| `scopeHistory` | `[{ at, from, to, decidedBy, reason }]` | Every later scope change, appended, never rewritten. |

The file also records the release's `scopeDecision` (`{ at, decidedBy, note }`). A file with no `scope` (older
releases) reads as before: `carried_backlog` and owner-blocked features are backlog, the rest planned.

### Shared logic

`server/lib/releaseScope.js` (pure): `scopeOf`, `isAddedAfterCut`, `groupByScope`, `annotateFeatures`. Every surface
groups features through it, so the scripts, the artifact page and the platform screen cannot disagree.

### Scripts

- `scripts/release-scope.mjs show | add | set`: prints the three groups; adds a feature after the cut (scope,
  decider and reason required); moves a feature between planned and backlog (appended to `scopeHistory`). An
  invalid scope, a missing reason/decider, an unknown or duplicate key, or a no-op change exits 1 with a
  plain-language message and writes nothing.
- `scripts/release-tracker-sync.mjs`: every snapshot feature carries `scope` (and `added`); a defined feature with
  no runs yet is listed as `queued`; anything not defined in the release (the whole-app sweep) is
  `not_in_release`.
- `scripts/release-loop-resume.mjs --args`: launches planned features only and lists the skipped backlog
  features on stderr; `--include-backlog` launches them too.
- `scripts/session-plan.mjs estimate`: an item for a backlog feature is recorded with `outOfScope: true` and a note;
  it is not refused.
- `scripts/release-cut.mjs`: `counts.planned/delivered/carried` cover planned features only; new counts
  `backlog`, `backlogDelivered`, `addedAfterCut`, `addedAfterCutPlanned`; each feature row keeps `scope` and `added`.
  Carrying forward: unfinished planned stays planned, backlog stays backlog, delivered-with-open-bugs becomes
  backlog, and `added` becomes `addedInRelease: <version>`. `--add` features default to planned. The next release
  starts without a `scopeDecision`.

### Screens

- Tracker artifact (`tools/release-tracker/index.html`) and the platform tracker (World Shell → Release tracker,
  `TrackerLayers.jsx`) overview: the single "Features" list becomes **Planned at the cut: N of M passed**,
  **Added after the cut (n)** (each with date, commit, whether it counts, and reason), **Backlog: kept on the record,
  not this release's work (n)**, and **Other tracked work** (the whole-app sweep). A snapshot with no scopes still
  shows one "Features" list. The Releases table's live "Planned" and "Delivered" count every feature with scope planned (planned at the cut plus any added into planned); backlog is never counted.
- Sessions table: an out-of-scope estimate item shows "(backlog, outside planned scope)".
- The platform's pull path (`normalizeCommitted` in `releaseTrackerService.js`) annotates features the same way,
  so "Fetch from repository now" shows the groups.

## Interface parity

- Reading scope: platform UI (desktop and 390px), `GET /api/release-tracker/state` (features carry `scope` /
  `added`), the tracker artifact.
- Changing scope: repository tooling (`scripts/release-scope.mjs`), like `release-cut.mjs` and `session-plan.mjs`,
  because the scope lives in the committed release file that the platform pulls. **Gap, for the owner:** there is
  no platform screen or MCP tool to change a feature's scope. Reading scope over MCP is
  `release_tracker_get_state` (registered in round 1 fix, see Fix notes). The other `RELEASE_TRACKER_TOOLS`
  descriptors remain unregistered (parity gap row `release-tracker-admin`).

## Verified (initial check)

`npm run build` exits 0. A sync against the running 0.3.0 runs gives 18 planned, 6 backlog, 3 added (backlog),
1 other (before release-scope itself was added). The artifact page, driven with that snapshot, shows the four sections at 1280 and 390 px with no
horizontal scroll and no page errors. A release cut on a throwaway copy froze 0/18 planned delivered,
18 carried, 9 backlog, 3 added after the cut, and opened 0.4.0 with scopes carried as above.

## Known limitations

- The tracker's snapshot budget check (`stored()` in `release-tracker-sync.mjs`) still measures all bugs as one
  document although they are split across `tracker/bugs` and `tracker/bugs-2`, so it warns and trims detail
  that would fit. Existing behaviour, not changed here.

## Fix notes — round 1

### release-scope-T1 (J5.5, MCP_GAP)
- Changed: registered `release_tracker_get_state` in `server/lib/mcpToolRegistry.js` (scope `release.read`, optional
  `release` arg, lazy-imports `getState` and `viewerKindForUser`, refuses with 403 `tracker_access_denied` exactly as
  `requireViewer` does, returns `{ viewer, state }`). Added it to `server/data/mcpToolManifest.json`; added
  `server/routes/releaseTracker.js` to `GOVERNED_ROUTE_FILES` and three parity rows in `capabilityParity.js` (state,
  stream/share with an explicit exclusion, admin routes with an honest `gap` note); updated the stale comment in
  `releaseTrackerService.js`.
- Files: `server/lib/mcpToolRegistry.js`, `server/data/mcpToolManifest.json`, `server/lib/capabilityParity.js`,
  `server/lib/releaseTrackerService.js`, `docs/changes/release-scope.md`.
- Checked: `node scripts/check-interface-parity.mjs` reports the registry matches the code and `--self-test` detects all 3 injected problems; the only gap left is the new honest row `release-tracker-admin` (admin routes without MCP tools, owned by live-release-tracker), so `--strict` still fails on it. On a fresh database with the test admin, a `release.read` token lists `release_tracker_get_state`, its result equals `GET /api/release-tracker/state` byte for byte (viewer admin), and the ungranted test member gets 403 `tracker_access_denied` on both the tool and the API. `npm run build` exits 0. Note: the local snapshot is empty, so feature scope fields were compared as identical empty state, not exercised with data.

## Fix notes — round 2

### release-scope-T2-3 (J4.1: estimate note lacks "(added after the cut)")
- What changed: `parseItem` in `server/lib/releaseCut.js` now also records an additive `addedAfterCut: true` next to `outOfScope` when the feature's definition has an `added` block (`isAddedAfterCut`). `scripts/session-plan.mjs` prints `(added after the cut)` in the stderr note when that flag is set; features that are backlog but not added keep the old text. Stdout is unchanged.
- Files: `scripts/session-plan.mjs`, `server/lib/releaseCut.js`.
- Checked: ran the J4.1 command; stderr and stdout matched the spec text exactly; J4.2 JSON has `outOfScope: true` for global-change-standard and no `outOfScope` key for platform-mcp; session file deleted afterwards (J4.3).

### release-scope-T2-4 (J5.1: MCP_GAP, snapshot paste has no MCP tool)
- What changed: registered admin-only MCP tools `release_tracker_ingest_snapshot` (snapshot/history/updates as object or JSON string, same friendly `json_invalid` error, `source: 'manual'`), `release_tracker_list_snapshots`, `release_tracker_pull_now`, `release_tracker_get_settings`, `release_tracker_save_settings`, `release_tracker_create_token` (share tokens run `assertReadyToFinalize` first, like the route) and `release_tracker_revoke_token`. Each calls the same service function as its route. Names appended to the manifest; the `release-tracker-admin` parity row now lists them and its gap is removed (webhook-secret, ingest log and bearer-token push are recorded as an explicit exclusion).
- Files: `server/lib/mcpToolRegistry.js`, `server/lib/releaseTrackerService.js` (comment), `server/lib/capabilityParity.js`, `server/data/mcpToolManifest.json`.
- Checked: `check-interface-parity.mjs`, `--strict` and `--self-test` all pass (121/121, 214 tools); called the ingest/list handlers through the registry against a fresh database (stored, list returned it, malformed JSON gave the friendly 400); `npm run build` passes. The paste UI in J5.1 was not re-walked in a browser: the UI and route were unchanged and the step failed only on parity.
