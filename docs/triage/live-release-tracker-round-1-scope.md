# live-release-tracker round 1: scope review

Base for reproduction: d7340d6 (first parent of merge 281e863, the first merge of live-release-tracker). The first parent has no live-tracker files (0 paths matching releaseTracker), so none of T1-T5 can occur without this feature. The ids T1-T3 in docs/triage/scope-review.json belong to qr-gated-outputs, not this feature, so they were not reused.

| id | scope | evidence |
|----|-------|----------|
| T1 | this_feature | TrackerSettings.jsx was created in 6f9a155 (this feature). The stale pull.error is not cleared by the source save (line 78 vs 81). Absent on d7340d6. |
| T2 | this_feature | Spec error in docs/training/live-release-tracker.md [J6.2]/[J6.4]. stepUpdate() in releaseTrackerModel.js (6f9a155) behaves per J3.2. Needs an amendment, not a spec edit. |
| T3 | this_feature | .rt-world-hint / .rt-world-tools (releaseTracker.css:164-165) introduced by 6f9a155 and 98e05dd (3D World view). |
| T4 | this_feature | The paste handler in TrackerSettings.jsx (line 135) only reloads on a result. Feature code from 6f9a155. |
| T5 | this_feature | Interface parity (MCP_GAP) is a requirement for every capability per definition.json. RELEASE_TRACKER_TOOLS (releaseTrackerService.js, 6f9a155) is not in mcpToolRegistry.js, has no capabilityParity.js row, and its route file is not in GOVERNED_ROUTE_FILES. release_tracker_read at d7340d6 belongs to Release Intelligence and is a different tool. |
