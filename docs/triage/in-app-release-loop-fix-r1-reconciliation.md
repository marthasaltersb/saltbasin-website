# Reconciliation: in-app-release-loop fix round 1 (release 2026-10-02-application-packages-resume)

Branch reviewed: release-loop/in-app-release-loop-fix-r1 (8ff2cb3, one commit on top of the build branch). Reviewer: reconciliation agent. No code changed. Checked by reading the code and re-running: `node scripts/check-interface-parity.mjs` (OK, no release_loop gap listed), `npm test -- server/lib/releaseLoopDefinition.test.js` (4 passed), `node scripts/release-spec-baseline.mjs check --all` (in-app-release-loop v1 baseline matches). The browser walk was not repeated by this agent.

| # | Reported item | Kind | Status |
| --- | --- | --- | --- |
| 1 | Sandbox refused compound commands | environment | resolved |
| 2 | First browser run without NODE_ENV=production | test_harness | resolved |
| 3 | B2: db.js seed kept, Classic Tools hidden by WORLD_SHELL_ONLY | owner_direction_conflict | resolved (with caveat in item 6) |
| 4 | MCP done-gate refusal: status 409, code undefined | informational | resolved |
| 5 | Scratch DB dropped, server killed | process | resolved |
| 6 | Spec amendment for training line 8 proposed but not filed; change spec and tracker docs stale | requirement_gap | unresolved |
| 7 | Stage graph: only transitions editable, stages cannot be added or removed | requirement_gap | unresolved (needs owner sign-off) |
| 8 | Branch base is behind the integration head | process | informational, resolved |

## Per item

1. Environment. Nothing partial left; commands were split. Resolved (evidence: the commit is clean, `git log claude/zealous-meitner-5tuft5..HEAD` shows one commit with 7 files).
2. Test harness. Without NODE_ENV=production the server does not serve dist, so /world answers "Cannot GET". Not a product defect. Resolved.
3. Owner direction (everything from the World Shell). Verified in the branch: `AdminShell.jsx` no longer imports `ReleaseLoopPanel`, has no `TAB_COMPONENTS.releaseLoop` and no fallback-nav entry, and filters `WORLD_SHELL_ONLY` (`releaseLoop`) out of the Classic Tools nav. `WorldShell.jsx` builds its islands from its own `resolveWorldIslands(tabsConfig)` (src/components/WorldShell.jsx:188) and `worldIslands.js:215` still defines the `releaseLoop` island, so the World Shell card is unaffected by the filter. The `admin_nav` seed row at `server/db.js:3331` must stay: it produces the island, and `admin_nav` is additive-only (CLAUDE.md deployment-safety invariants), so removing it would also leave a dead key on any database that already merged it. The row is still returned by `GET` admin-nav (API data), but no Classic Tools screen renders it. Accepted as satisfying the direction.
4. The done-gate error carries `code: 'done_gate'` and `gaps` (`releaseLoopPlatform.js:279`: `err(msg, 409, { gaps, code })`), and `mcpServer.js:51` maps `e.code` into the MCP error, so that refusal is identical to the route. Only 409s from the stage graph and round checks have no `code`; the route and MCP behave the same for them. No change needed. The report's wording "code undefined" is true only for those other 409s.
5. Process, no leftover state reported or found in the repo.
8. `git merge-base` of the branch and the current integration head is 6c13538; the integration head (e798b47) has moved on (it contains session-mapping files this branch lacks, which show as deletions in a plain diff). The fix commit touches only the 7 release-loop files, so merge, do not replace. Informational.

## Unresolved

### 6. Amendment and documentation not completed (requirement_gap)
Step: spec governance (definition.json specGovernance v4). The fix notes say an amendment is "proposed", but `docs/spec-amendments/in-app-release-loop/` does not exist (the directory list has no such folder). Frozen `docs/training/in-app-release-loop.md` line 8 still advertises Classic Tools -> PLATFORM LIFECYCLE MANAGEMENT -> RELEASE LOOP, which the product no longer has, and the spec's parity table and edge case still say the MCP registry does not exist (it now does, with 13 `release_loop_*` tools). `docs/changes/in-app-release-loop.md` still contains stale statements: the "Interface parity" table row "MCP: Not yet", Known limitations "No MCP tools yet", "The stage graph ... is not editable", and "desktop also has Classic Tools -> ... RELEASE LOOP"; the Client section still lists `AdminShell.jsx TAB_COMPONENTS.releaseLoop`. Also still open from the build reconciliation (item 7): `server/data/releaseLoop/definition.json` line 234 ("there is no platform screen"), `docs/release-process.md` and the skill do not mention the in-platform loop, blocked by the frozen release-loop-tooling spec.
Root cause: the fix agent may not edit frozen specs and did not file the amendment documents; the change spec (not frozen) was only appended to, not corrected.
Files: docs/spec-amendments/in-app-release-loop/ (new), docs/spec-amendments/release-loop-tooling/, docs/changes/in-app-release-loop.md, server/data/releaseLoop/definition.json, docs/release-process.md, .claude/skills/salt-basin-release-loop/SKILL.md.
Proposed fix: (a) file an amendment for in-app-release-loop v1 (line 8: Classic Tools is not a path; parity table and edge case: MCP tools now exist; add MCP steps for the 13 tools) for approval by a reviewer other than the proposer; (b) correct the stale lines in the change spec; (c) file the release-loop-tooling amendment, then update definition.json (bump version), release-process.md and the skill together.

### 7. Stage graph only partly editable (requirement_gap)
Step: editable definition. `validateDefinition` now blocks removing required transitions (`REQUIRED_TRANSITIONS`) and the Definition tab edits each existing transition target; stage keys, adding and removing stages, and the gate-relevant `role` per stage are still fixed. The change spec lists the graph as a limitation. This is partial against "the definition is editable in the platform".
Files: src/components/admin/ReleaseLoopPanel.jsx, server/lib/releaseLoopDefinition.js.
Proposed fix: owner decision. Either accept transitions-only editing and say so in the change spec, or add stage role editing (the role list is validated already) and optional stages with the required keys locked.
