# release-scope round 1 - scope decision

Base for reproduction: d8ebe98^1 (first parent of the earliest release-scope merge, d8ebe98). Checked statically on that commit: `server/lib/mcpToolRegistry.js` contains 0 references to `release_tracker_get_state` / `RELEASE_TRACKER_TOOLS`, so the gap exists without this feature. (The base `releaseTrackerService.js` already exports `RELEASE_TRACKER_TOOLS`; it was added with live-release-tracker, 6f9a155, merged 281e863.)

| id | scope | evidence |
|---|---|---|
| release-scope-T1 | pre_existing | The tracker MCP tools were never registered in `mcpToolRegistry.js`, and `releaseTracker.js` was never in `GOVERNED_ROUTE_FILES` or `capabilityParity.js`. That is the live-release-tracker gap already recorded as T5 in `docs/triage/live-release-tracker-round-1-scope.md`; live-release-tracker is not in this workflow's owner list, so it is not routed as other_feature. release-scope's diff (`git diff d8ebe98^1 d8ebe98`) only adds an `annotateFeatures` call in `normalizeCommitted` so features carry `scope` / `added`. It adds no capability, route or tool. The request was to show planned / backlog / added on tracker surfaces and in the cut. Spec step J5.5 requires only `GET /api/release-tracker/state`, which works. Registering `release_tracker_get_state` is a separate fix, and when made it will return the new scope fields automatically. Not a release-scope defect. |

Nothing was changed in code. The failure also left no state behind: no processes started, no database created.
