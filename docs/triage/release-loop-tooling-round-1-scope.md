# release-loop-tooling round 1 scope review

Method: every file in these items is release-loop tooling (definition.json, saved workflow, skill, docs, tracker page and sync script). The feature request is this tooling itself, so none of these can occur "without the feature". Items B1-B3 are already classified this_feature in docs/triage/scope-review.json and no contrary evidence was found. Base check: the earliest merge (991999d) has first parent 8430eae; at that base tools/release-tracker/index.html and the training spec do not exist, and the other files are only the earlier release-loop tooling commits. No reproduction on a pre-feature base is possible or needed.

| id | scope | evidence |
|---|---|---|
| RLT-T1 | this_feature | Training spec line 21 lists 7 statuses; definition.json bugEscalation.statuses has 10 (a42b3cc, release-loop v2 scope check, part of this tooling). Stale spec of this feature. |
| RLT-T2 | this_feature | tools/release-tracker/index.html was created by this feature (bed12f0) and rebuilt as drill-down layers (21129a0, f56f185). Journey 4 and J5 still describe the old design. Spec error in this feature's own spec. |
| release-loop-tooling-B1 | this_feature | Reuse of scope-review.json. definition.json line 210, release-process.md line 52 and SKILL.md claim a World Shell "Release loop" view and /api/release-loop/*; the change spec line 53 says it is not part of this change. Docs of this feature claim an unbuilt capability. |
| release-loop-tooling-B2 | this_feature | Reuse of scope-review.json. scripts/release-tracker-sync.mjs line 115 guards the 15-minute idle check with !a.fromRun, while journal-built agents have fromRun true (line 82). This feature's own script. |
| release-loop-tooling-B3 | this_feature | Reuse of scope-review.json. index.html has max-width 640px rules only for .hist and .timeline (lines 76, 103); the tables have no narrow layout. This feature's own page. |
