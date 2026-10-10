# Triage: release-intelligence, round 2

Validator report: docs/test-results/release-intelligence/round-2.md. Integration head when triaged: f76786c. No code or spec changed by this triage.

## RI-R2-1 [defect] MCP_GAP: no MCP tools for release-intelligence (recurrence of RI-R1-7)

- Baseline step: MCP_GAP. Recurrence of RI-R1-7 (round-1 triage, class environment). The same root cause, a missing capability in the MCP registry, is now class defect: the blocker named in RI-R1-7 is gone. `server/lib/mcpToolRegistry.js` and `server/lib/capabilityParity.js` are on the integration branch (fix-r1 notes said "not on this branch"). Fix-round-1 therefore did nothing, and nothing assigned the work afterwards.
- Reproduced: `node scripts/check-interface-parity.mjs` reports "72 of 72 ... MCP gaps: 0", yet it cannot see this gap. `server/routes/releaseIntelligence.js` (mounted at `/api/release-intelligence`, `server/index.js:193`) is not in `GOVERNED_ROUTE_FILES` (`capabilityParity.js:17-24`), so its 19 routes are never checked. `capabilityParity.js:122` has only one row, `release-tracker-read`, covering 2 of the 19 routes. `mcpToolRegistry.js:710` has the matching tool `release_tracker_read` (list or detail). The validator's finding matches the code.
- Root cause: (1) the tools were never written; (2) the route file was never put under the parity governance, so the check script passes while 17 routes have no MCP tool.
- Routes with no MCP tool (`server/routes/releaseIntelligence.js`):
  - config read, save, reset (lines 23-28)
  - create release (31)
  - add feature (37)
  - approve (40) and reopen (49)
  - failed runs list, record, dispose (51-53)
  - outputs list and link (55-56)
  - trends (58)
  - import document and import snapshot (61, 68)
  - import repository (77)
- Proposed fix (fix agent, one change):
  1. Add tools to `mcpToolRegistry.js` using the existing `rlTool` pattern (permission `admin`, appended after `release_tracker_read`; the registry is append-only). Each handler calls the same `server/lib/releaseIntelligence.js`, `releaseLogImporter.js` or `releaseIntelligenceConfig.js` export the route calls, with `rlActor(user)` as the actor.
     - `release_intelligence_create_release`
     - `release_intelligence_add_feature`
     - `release_intelligence_approve_release`
     - `release_intelligence_reopen_release`
     - `release_intelligence_list_failed_runs`
     - `release_intelligence_record_failed_run`
     - `release_intelligence_dispose_failed_run`
     - `release_intelligence_list_outputs`
     - `release_intelligence_link_output`
     - `release_intelligence_trends`
     - `release_intelligence_import_document`
     - `release_intelligence_import_snapshot`
     - `release_intelligence_import_repository`
     - `release_intelligence_get_config`
     - `release_intelligence_save_config`
     - `release_intelligence_reset_config`
  2. Approve must call `assertReadyToFinalize(user.id)` first, exactly as the route at line 42 does, and surface a `FinalizationBlockedError` as an `isError` result with its status and code. Do not skip the gate.
  3. Errors must keep the route's status and code. Import-document needs `attributeOrphans()` after the import, as the route does. Import-snapshot must accept the snapshot as an object or a JSON string and refuse invalid JSON with 400, as the route does.
  4. Scopes: add `release.write` (and `release.read` for the reads) to the scope table at the top of the registry. Scopes only narrow, they never grant.
  5. Add rows to `capabilityParity.js` with a World Shell path (`Journeys > Release Intelligence` and its tab), the API routes and the MCP tools. Add `'server/routes/releaseIntelligence.js': '/api/release-intelligence'` to `GOVERNED_ROUTE_FILES` so a future route without a tool fails the check.
  6. Run `node scripts/check-interface-parity.mjs --update-manifest`, then without the flag, then `--self-test`.
  7. Verify each tool through `/mcp` with a personal access token (`scripts/mcp-call.mjs`) and compare the result with the matching API response. Also check that a non-admin token is refused.
- Import-repository decision: the route imports from `process.cwd()` (line 78). Keep the same behavior in the tool. Do not accept a caller path, because that would be a file-read vector the route does not have.
- Files: server/lib/mcpToolRegistry.js, server/lib/capabilityParity.js, server/data/mcpToolManifest.json, docs/changes/release-intelligence.md (fix notes). The routes file needs no change.
- Spec: the baseline step is unchanged and stands as written (definition.json interfaceParity: "a capability with no MCP tool fails as an MCP gap once the platform MCP server exists"). No amendment.

## Validator observations

- B8 (commit shas render as plain text, no verification): not a coverage_gap. The validator marks it "awaiting owner rule". No decision exists on what verifies a sha (git object exists in this repo, or a branch ancestor). It stays with the existing owner question and no new step is proposed.
- B10 (snapshots ingested by hand or `--snapshot`; classes not guessed; Trends charts categorical): same status, awaiting owner answers. No new step.
- `server/db.js` still seeds the release-intelligence `admin_nav` row (~line 3327): intentional. Fix-r1 notes for B7 explain that World Shell islands resolve from `admin_nav`, and the append-only rule forbids deleting the key. Classic Tools hides it and J1.2 passes. Nothing to do.
- E.1 importer: 46 warning lines for repo docs lacking version, Traces-to or result are expected for older docs. Exit 0, 0 errors. Nothing to do.
- Housekeeping notes (e1.sh overwrote round-1 evidence, killed concurrent run): process notes only. Evidence was copied to round-2. Nothing to do.

## Not run

Server was not started and no browser reproduction was needed: the gap is established directly from `mcpToolRegistry.js`, `capabilityParity.js` and `server/routes/releaseIntelligence.js` (`check-interface-parity.mjs` ran OK on the head). No environment was created, so no process or database needs cleanup.
