# Reconciliation: journey-flow-experience-mapping (build), branch release-loop/journey-flow-experience-mapping-build @ 5780411

Verified by reading the code on the branch and re-running `node scripts/check-interface-parity.mjs` (131 of 131, 240 tools, manifest matches) and `node scripts/release-spec-baseline.mjs check --all` (all baselines match, journey-flow-experience-mapping v1 included). `git merge-tree` against the integration head reports no conflicts. The branch diff from its merge base touches only this feature's files. The large deletions in a plain diff against the integration head are only because the branch was cut before later merges.

## Reported items
1. Worktree guard refused compound commands: process/harness, nothing ran, reran. Resolved (no code effect).
2. `timeout 110` killed a walker and left a duplicate activation row: environment. DB was reset by the build agent; not verifiable here, no code involved. A related real behaviour found: `activateJourney` lets the same published version be activated again (a fresh token each time), re-applying and appending another `flow_journey_activated` history row. Unresolved, minor (see U6).
3. First walk 8 of 15 failed (cleared success message, walker bug): fixed in the branch per the change spec; the code path is in the branch. Resolved as test_harness plus an already-fixed defect.
4. Build timeout moved to background: environment, completed. Resolved.
5. Expected non-2xx responses: informational, all listed in the spec's constraints.
6. Baseline v1 frozen by the build agent although the integrator freezes it: process. `check --all` passes now. Unresolved only in the sense that the integrator must re-run its freeze/check (informational).
7. platform-mcp drift: the platform-mcp v5 baseline J1.4 (eighteen scope checkboxes) and J2.1 (126 tools) were already behind (registry now has 240 tools); three more scopes (`flowjourney.read|write|publish`) widen it. Not edited, correct per spec governance. Unresolved until an amendment is proposed and approved.

## Gaps the reports missed (from the change spec "Known limitations" and the request)
- U1 requirement_gap: the World Shell and Spatial Journey World receive `stage.flowJourney` / `stage.experience` but draw nothing from them (grep: no consumer in WorldShell.jsx or SpatialJourneyWorld.jsx; only genesis.js passes it through). The request says the mapped asset, layer, crystal variant, animation, interaction and destination must render as the user experience and be consumed by those surfaces.
- U2 requirement_gap: actors are a configured list (`definition.lists.actors`), not role/profile registry data; licences likewise. Owner direction on provisioning (roles/licences/permissions as grantable) is only partly met until `security-provisioning-model` lands.
- U3 requirement_gap (partial): decision branch condition is one field, one operator; no compound/tree conditions, though the request says decision tree branch conditions.
- U4 requirement_gap (partial): variants/scenarios compile to a path per variant, but the compiled journey uses the base values; per-scenario overrides do not change the generated gates or experience.
- U5 requirement_gap (partial): `requiredActorRoles` are enforced only once actors are assigned, so a member's test journey cannot advance past its first gate in the browser; the generated journey can be started but not walked end to end.
- U6 product_defect (low): re-activating an already-active identical version is allowed and writes a duplicate history row; the token also omits the impact counts, so running-member numbers can change between preview and approval.

No owner-direction conflict found: no admin-navigation entry points were added (diff has no AdminShell or admin_nav change); every journey in the training spec runs from `/world`, with the member window for member journeys and the admin window only for admin-only actions (activation, Settings).
