# Scope review: in-app-release-loop, round 1

Method: read the round-1 test result, the build reconciliation, the change and training specs, and checked the base commit (first parent of merge 50b5c98, the earliest merge of in-app-release-loop). No code changed; no browser reproduction was needed because every item is decidable from the base tree.

Key base fact: `server/lib/mcpToolRegistry.js` already exists on 50b5c98^1 (platform-mcp, b77049b, merged before this feature). The reconciliation's claim that the registry was absent was true only on the feature branch's older base.

| Id | Scope | Owner |
| --- | --- | --- |
| T1 | this_feature | in-app-release-loop |
| T2 | this_feature | in-app-release-loop |
| in-app-release-loop-B1 | this_feature | in-app-release-loop |
| in-app-release-loop-B2 | this_feature | in-app-release-loop |
| in-app-release-loop-B3 | pre_existing | none |
| in-app-release-loop-B4 | this_feature | in-app-release-loop |

## T1: this_feature
The feature introduces 13 admin capabilities (routes in `server/routes/releaseLoop.js`). Interface parity (v3) requires an MCP tool for each. On the base the registry exists, so nothing blocks registering `release_loop_*` tools; the capabilities themselves do not exist on the base. The tools listed in docs/changes/in-app-release-loop.md line 65 are this feature's to add (including an admin-only scope in `MCP_SCOPES`, manifest and parity-map rows).

## T2: this_feature
Spec step E.8 (docs/training/in-app-release-loop.md, baseline v1) asserts the registry is absent. It was already present on the base, so the step was wrong when written. Spec error in the feature's own spec; fix by an approved amendment under docs/spec-amendments/in-app-release-loop/ (validator proposed: assert the file exists and `tools/list` contains the `release_loop_*` tools once T1 is fixed). Agents other than the amendment reviewer must not edit the spec or baseline.

## in-app-release-loop-B1: this_feature
Same defect as T1. The note "platform-mcp owns the registry and is not merged here" is wrong: platform-mcp (b77049b) is an ancestor of the merge and the registry is in the first parent. Not other_feature, because platform-mcp's registry works; the missing tools are this feature's. Fix together with T1.

## in-app-release-loop-B2: this_feature
Extra admin navigation entry points (`server/db.js` admin_nav seed/merge, `TAB_COMPONENTS.releaseLoop` and fallback nav entry in `src/components/admin/AdminShell.jsx`, Classic Tools mentions in docs/changes/in-app-release-loop.md) were added by this feature's own commits (fa70419); the base has no `releaseLoop` reference in `server/db.js`. Contradicts owner direction that everything comes from the World Shell. Note: `admin_nav` is additive-only, so a merged entry stays as a dead key; record that in the change spec. Training spec line 8 mentions the Classic Tools path and is frozen: needs an amendment, not an edit.

## in-app-release-loop-B3: pre_existing
The stale text ("there is no platform screen" at `server/data/releaseLoop/definition.json` line 234; no mention in docs/release-process.md or the skill) is present on the base (50b5c98^1) unchanged. Updating the process definition and docs is not part of this feature's request (request: seed roles, endpoints with gates, and the Release loop screen). Updating them would also fail the frozen release-loop-tooling spec J1.3 (forbids claiming the World Shell view and `api/release-loop` in docs). Resolution requires a release-loop-tooling spec amendment approved by a different reviewer, then updating all three files together with a definition version bump; this is separate work, not a fix for this feature's round.

## in-app-release-loop-B4: this_feature
The request says the screen shows "the editable definition (version bump)". Roles, summary, gates and limits are editable, but the stage graph (next/onPass/onFail/onFixable/onBusinessDefinition) is display-only in `src/components/admin/ReleaseLoopPanel.jsx`; `validateDefinition` in `server/lib/releaseLoopDefinition.js` already checks stage targets. The deferral was this feature's own choice and the limitation is only in its Known limitations. Fix: add stage-target editing with required stage keys locked, server-validated, with a version bump; or obtain the owner's sign-off to accept the limitation. If the owner accepts, record it as an owner decision rather than closing silently.
