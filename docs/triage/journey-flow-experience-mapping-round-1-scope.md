# Scope review: journey-flow-experience-mapping, round 1

Base for comparison: 7d54686 (first parent of merge 30eabe4, the feature's first merge). None of these ids were classified in docs/triage/scope-review.json. No code was changed and no processes or databases were started. Items on this feature's own new files cannot be run on the base, because the files do not exist there, so those are this_feature by rule.

| id | scope | owner |
|---|---|---|
| T1 | this_feature | |
| B7 | pre_existing | |
| B8 | this_feature | |
| B9 | pre_existing | |
| B10 | this_feature | |
| B11 | this_feature | |
| B12 | this_feature | |
| B13 | this_feature | |

## T1 this_feature
`src/components/admin/FlowJourneyParts.jsx` was created by 5780411 (this feature) and is absent at 7d54686. It renders the Experience map `<table className="fs-table">` (line 174) inside `.fs-scroll`. The `.fs-table` rule (no min-width) and `.fs-root { overflow-wrap:anywhere }` come from journey-flow-studio's panel. The collapse only shows on this feature's table, and the fix is in this feature's table or the shared rule. The base has no such table, so it cannot be reproduced there. Read confirmed: `.fs-root` line 18 has `overflow-wrap:anywhere`, `.fs-table` line 51 has `width:100%` only.

## B7 pre_existing
platform-mcp J1.4 lists exactly eighteen scopes with no `flows.read` or `flows.write`. At 7d54686 `server/lib/mcpToolRegistry.js` already defines `flows.write` (line 34) and `server/lib/mcpFlowStudioTools.js` registers `flows.read` and `flows.write` tools. Those come from journey-flow-studio, not this feature. J1.4 and J2.1 (tool count) therefore already fail on the base. This feature adds three more scopes, `flowjourney.read|write|publish`, and more tools, which widens the drift. The fix is still an amendment to platform-mcp, proposed and approved under spec governance. Nobody should edit the spec or baseline v5 directly.

## B8 this_feature
The request asks for each node's experience (asset, World Shell layer or scene, crystal variant, animation, interaction, destination) and for the compiled definition to be "consumed by journeyDefinitionFromPersistedRod / SpatialJourneyWorld / World Shell layers". The change spec's own Known limitations say the data is passed through (`genesis.js`, `journeyRods.js`) and nothing is drawn. This is requested work that is not done. (Same finding as reconciliation U1.)

## B9 pre_existing
The request asks for the actor (role/profile) and action authority (permission/license) as structured bindings "defined in the metadata config". That is delivered as configured lists. At 7d54686 there is no profile or permission registry (grep for profile registry names finds nothing in server/). The registry belongs to the separate backlog feature security-provisioning-model (active-release.features.json line 305), which is not part of this request. Not reproducible as a defect of this feature.

## B10 this_feature
"Decision tree branch conditions" is in the request. The feature's decision branches are one field and one operator each. This is a limitation in its own `src/lib/flowJourneyCompile.js` and `FlowJourneyParts.jsx`, in the requested area, and cannot be shown on the base. If the owner decides compound conditions are out of scope, reclassify as a documented limitation. Until then it is this feature's.

## B11 this_feature
The request names variant/scenario as a binding and the compiled journey as the published artifact. The compiler (`src/lib/flowJourneyCompile.js`, `server/lib/flowJourney.js`) compiles one scenario from base values, so per-scenario overrides do not change the generated gates or experience. That sits in this feature's own code and in its own spec wording ("Per-scenario overrides apply to the step bindings"). Not reproducible on the base.

## B12 this_feature
The actor-role enforcement is pre-existing engine behaviour (`server/lib/scenarioLibraryApply.js` lines 64 and 135 at 7d54686). But this feature's compile emits `requiredActorRoles` from the actor bindings and assigns no actors, so the published journey, which the request says the platform "runs", stops at its first gate. The gap is in `server/lib/flowJourney.js`. The engine itself needs no change.

## B13 this_feature
`activateJourney` (`server/lib/flowJourney.js` line 211) is new in 5780411. It compares the approval token to the preview token but not to `journeyActive.token`. The token (line 184) hashes the scenario and molecules but omits the running-journey impact. Re-activating the same version writes a duplicate history row. The request requires one approval and an impact preview on publish.

## Notes for the round
- B7 needs a platform-mcp amendment proposal (not an edit).
- B9 should be carried to security-provisioning-model.
