# Reconciliation: in-app-release-loop build (release 2026-10-02-application-packages-resume)

Branch reviewed: release-loop/in-app-release-loop-build (fa70419). Reviewer: reconciliation agent. No code changed.

| # | Item | Kind | Status |
| --- | --- | --- | --- |
| 1 | No MCP tools (mcpToolRegistry.js absent) | requirement_gap | unresolved |
| 2 | Extra admin navigation entry points (admin_nav seed, AdminShell tab, Classic Tools path) | owner_direction_conflict | unresolved |
| 3 | Stale branch reset with switch -C | process | resolved |
| 4 | Walk run 1 builder-script faults | test_harness | resolved |
| 5 | Product defects found by walks and fixed | product_defect | resolved |
| 6 | Classic Tools has no module menu at 390px | informational | resolved |
| 7 | definition.json tracker string / release-process.md / skill not updated | requirement_gap | unresolved |
| 8 | Sandbox refused compound commands | environment | resolved |
| 9 | Scratch files left in bld-5900-2 | informational | resolved |
| 10 | Stage graph not editable on the Definition tab | requirement_gap | unresolved |
| 11 | Live steps are polling, not push | informational | resolved |
| 12 | One run per feature per release | informational | resolved |
| 13 | Saved definition does not update definition.json | informational | resolved |

Evidence for resolved items was checked on the branch: `npm test -- server/lib/releaseLoopDefinition.test.js` gives 4 passed; WorldShell.jsx:1371 has `minHeight: 44` on Back to World; ReleaseLoopPanel.jsx:98 has the "restored by a reset" label; releaseLoopPlatform.js:294 sets status `done`.

## Unresolved

### 1. MCP gap (requirement_gap)
Step: interface parity (definition.json interfaceParity, v3); training spec parity table and [E.8].
Root cause: server/lib/mcpToolRegistry.js does not exist on this branch (`ls` confirms). The platform-mcp work is on a separate branch, release-loop/platform-mcp-build, not merged here. The rule says every capability needs an MCP tool, and the validators fail `MCP_GAP`. The spec accepts the absence at this baseline (E.8), so this does not fail the feature, but it is an open gap.
Files: server/lib/mcpToolRegistry.js (owned by platform-mcp), server/lib/releaseLoopPlatform.js, server/lib/releaseLoopDefinition.js.
Proposed fix: assign to platform-mcp; after it merges, register release_loop_get_definition, _save_definition, _list_runs, _start_run, _get_run, _transition_run, _record_round, _log_step, _add_bug, _bug_action, _add_reconciliation, _resolve_reconciliation, _list_escalations, each calling the same exported function with the same admin-only check. Keep the gap on the release log until then.

### 2. Admin-navigation entry points (owner_direction_conflict)
Step: wiring. The owner direction is that everything comes from the World Shell. The branch also adds:
- server/db.js ~3328: a `release-loop` entry in the `admin_nav` seed/merge (view plm, "Release loop", componentId releaseLoop).
- src/components/admin/AdminShell.jsx: `TAB_COMPONENTS.releaseLoop` plus a nav fallback entry (`id: 'release-loop'`).
- The change spec and training spec line 8 advertise Classic Tools -> PLATFORM LIFECYCLE MANAGEMENT -> RELEASE LOOP.
Root cause: copied the pattern of earlier admin tabs. The World Shell card (worldIslands.js `releaseLoop` plus WorldShell SIMPLE_EMBED_COMPONENTS) is sufficient.
Proposed fix: remove the admin_nav seed entry, the AdminShell TAB_COMPONENTS and fallback nav entries, and the Classic Tools mentions in docs/changes/in-app-release-loop.md. The training spec line 8 is frozen: propose an amendment through docs/spec-amendments/in-app-release-loop/ rather than editing it. Note config_state admin_nav is additive-only, so if the row was already merged on any real database, the entry stays there as a dead key; that is harmless but should be noted in the change spec.

### 7. definition.json tracker text and docs (requirement_gap)
Step: process definition. definition.json line 234 still says "there is no platform screen"; docs/release-process.md and the skill do not mention the in-platform loop. Left alone deliberately because docs/training/release-loop-tooling.md journey 1 step 3 fails if they claim a World Shell Release loop view.
Root cause: a frozen spec conflicts with the new feature.
Files: server/data/releaseLoop/definition.json, docs/release-process.md, .claude/skills/salt-basin-release-loop/SKILL.md, docs/spec-amendments/release-loop-tooling/.
Proposed fix: file an amendment for release-loop-tooling (approved by a reviewer other than the proposer), then update all three together and bump the definition version.

### 10. Stage graph not editable (requirement_gap, partial)
Step: "editable definition (version bump)". Roles, summary, gates and both limits are editable (ReleaseLoopPanel.jsx ~106); the stages (line ~138) are display-only. This is listed in Known limitations, not in the build agent's report.
Root cause: gate logic references stage keys, so editing was deferred.
Files: src/components/admin/ReleaseLoopPanel.jsx, server/lib/releaseLoopDefinition.js (validateDefinition already checks stage targets).
Proposed fix: either accept the limitation with the owner's sign-off, or add editing of stage targets (next/onPass/onFail/onFixable/onBusinessDefinition) while keeping the required stage keys locked, validated server-side, with a version bump.

## Resolved items (notes)

3. Stale already-merged ancestor branch reset to the integration head; nothing lost (branch contains the integration head commits plus the build commit).
4. Hidden audit-probe text matching and wrong button name were walk-script faults, not product.
5. Back to World height, error-alert race, run status `done`, and reset label are all in the branch (see evidence above).
6, 11, 12, 13 are documented behaviours in the change spec Known limitations and accepted by the spec.
8, 9 had no partial state left; the worktree scratch directory is outside the repo.

## Gaps in the Known limitations the build report missed
Items 7 (partly reported), 10 and the Live-steps polling note. Items 10 is the only one that affects the "editable definition" request.
