# Triage: in-app-release-loop, round 2

Release 2026-10-02-application-packages-resume. Baseline v1 (unchanged). Triage head f76786c. No code or spec changed.

## T2 (recurrence of round 1 bug T2), step [E.8] - class spec_error

Reproduced: `ls server/lib/mcpToolRegistry.js` prints the path, exit 0.

Root cause: the step hard-codes a point-in-time repo state ("At this baseline it prints ... No such file"). That state stopped being true when `platform-mcp` added the file in b77049b (docs/training/in-app-release-loop.md line 171; baseline v1 step E.8). The step also says the absence "does not fail this feature", so the product is not wrong, and it can only pass on a checkout that predates b77049b. That breaks the "Deterministic" and "Independent of the fix" spec standards in definition.json.

Product matches the change spec and owner direction:
- docs/changes/in-app-release-loop.md line 65 records MCP as "Not yet... assigned to platform-mcp", as an interim state.
- definition.json `interfaceParity` requires every capability to have an MCP tool calling the same server function once the platform MCP server exists. It does now.
- Fix round 1 (T1/B1, commit 8ff2cb3, merged 3e4bcc1) registered the 13 `release_loop_*` tools in `server/lib/mcpToolRegistry.js`, with names appended to `server/data/mcpToolManifest.json`. The validator confirmed they match the UI and API. The parity map has the rows.

Not a defect: reverting would delete shipped, append-only MCP tools (forbidden by CLAUDE.md) and re-open an MCP_GAP.

Why it recurred: round 1 produced the same observation, and no amendment was filed or decided (the decided-amendments list is empty). Frozen specs cannot be edited by fixers, so the step keeps failing until an amendment is approved. The release loop should not count it against the fix-round limit. The fix agents should get no work item for it.

Amendment (to the amendment reviewer, not a fix agent; proposer must not be the approver):
- stepId: E.8
- op: change
- before: Run `ls server/lib/mcpToolRegistry.js`. At this baseline it prints `ls: cannot access ...: No such file or directory`. Record it as an MCP gap assigned to the `platform-mcp` feature; it does not fail this feature.
- after: Run `ls server/lib/mcpToolRegistry.js` and `node scripts/check-interface-parity.mjs`. Expect the file to exist, and `server/data/mcpToolManifest.json` to list all 13 names `release_loop_get_definition`, `_save_definition`, `_list_runs`, `_start_run`, `_get_run`, `_transition_run`, `_record_round`, `_log_step`, `_add_bug`, `_bug_action`, `_add_reconciliation`, `_resolve_reconciliation`, `_list_escalations`. Expect the parity script to print OK. (Optional: with an admin token holding `release.loop.read`, `tools/list` contains them.)
- tracesTo: definition.json `interfaceParity` (MCP tool required once the platform MCP server exists); docs/changes/in-app-release-loop.md T1/B1 (fix round 1); platform-mcp b77049b.
- reason: the step asserts a past repo state and is not repeatable. The replacement checks the stable, owner-directed outcome (every capability has an MCP tool), keeps the stepId, and stays a cli step. The change spec's line 65 and the "Not yet" training text should be updated by the same amendment's reviewer to say the MCP tools now exist.
- If the reviewer prefers, op `retire` for E.8 is acceptable because the validator's J1/B1 checks already cover MCP parity. Any rejection makes a repeat failure class defect.

## Validator observations

- T1/B1, B2, B4 verified: no action.
- Terms dialog for P.1 never exercised because the harness pre-accepts terms: not a spec gap. Terms flow is covered by `create-test-member.mjs --no-terms`. A coverage_gap is not proposed because the P.1 baseline step already exists and the harness limitation is environmental.
- Journeys click hang past 15 s while the 3D scene was busy, not in scored passes: environment (slow headless WebGL), no product change. Validators should use a longer timeout for that click.
- Round 1 observations (label-in-name on "Feature name (optional)", refresh lag after Move to fix, unconfirmed intermittent): not reproduced, nothing to triage.
- Baseline still v1: no diff table needed.
