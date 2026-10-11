# Reconciliation: journey-flow-experience-mapping, fix round 1 (branch release-loop/journey-flow-experience-mapping-fix-r1 @ 4bd7149)

Checked by reading the commit diff (4 files: flowJourney.js, SpatialJourneyWorld.jsx, FlowStudioPanel.jsx, the change spec), `node --check server/lib/flowJourney.js` (ok), the `journey_rod_actors` schema in db.js (columns and UNIQUE(rod_id, actor_key, role_key) match the new INSERT), and genesis.js (it passes `stage.experience` through to the panel). No server or browser was started here, so runtime claims are unverified.

## Reported items
1. No browser walk after the fix (T1, B8, B12, B13 unverified at runtime): process, unresolved. A re-validation round is required, with J10.4 at 390px first.
2. `git add -A` refused because node_modules is a symlink: environment, resolved. The commit contains only the four expected files; nothing partially staged.
3. B8: requirement_gap, unresolved. Only the Spatial Journey World stage panel lists `stage.experience`. The World Shell layer push and crystal-variant rendering are not built. No owner conflict.
4. B10: requirement_gap, unresolved. One condition per connector remains (also in the change spec's Known limitations). The request says decision-tree branch conditions. Owner question stands.
5. B11: requirement_gap, unresolved. Variants compile to a path only; per-scenario overrides do not change the generated gates or experience. Owner question stands.

## Fixed in code, not yet proven (stay unresolved until the walk)
- T1 (mobile table CSS): code present (`.fs-scroll .fs-table` max-content, pill nowrap). Needs the 390px check.
- B12 (test-run actors): code inserts one `journey_rod_actors` row per scenario role for the starter, marked testRun. Schema-compatible. Needs a live start-test-journey and a walk past the first gate.
- B13 (idempotent activation): token now includes running-journey and at-removed-gate counts, and a matching stored token returns `alreadyActive` without writing. Needs a live double activation. This also closes the reconciliation note U6 (stale token, duplicate history row) once verified.

## Gaps from the change spec "Known limitations" that the reports missed
- World Shell does not draw a scene from `stage.flowJourney` at all (no consumer in WorldShell.jsx). The B8 report mentions it only as part of the layer push. requirement_gap.
- Actors and licences are configured lists, not registry/profile data (depends on `security-provisioning-model`). requirement_gap, partial.
- `requiredActorRoles` enforcement for real runs is unchanged; only test runs are bypassed through assigned actors. Informational.
- Real-model agent draft unverified (from the build notes). Informational.
