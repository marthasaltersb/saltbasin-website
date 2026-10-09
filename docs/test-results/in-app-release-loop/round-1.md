# Test result: in-app-release-loop, round 1

Commit tested: aa12832cd5efbcd78732b64d388aa373e0e8b994 (integration head). Date: 2026-10-09. Validation agent val-5900-7.

```json
{
  "feature": "in-app-release-loop",
  "baseline": 1,
  "specSha256": "b3175d15abdadd0df4ff6843604f9a3e60904507ab2b2bf635669a73222c06b9",
  "total": 60,
  "passed": 59,
  "failed": ["E.8"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": []
}
```

Result: NOT PASSED (59 of 60 scored steps; one failure, E.8).

## Method

- `release-spec-baseline.mjs check` passed (baseline v1). Constraints: fresh database plus seed per pass (desktop and mobile each on their own), production build on port 5914, 1280x900 desktop and 390x844 touch phone, light scheme, en-US, TZ=UTC.
- Signed in through the login form from the start page, then navigated World -> Journeys -> Release loop by clicking. Both passes ran every journey and edge case; command steps (J6.2, E.5-E.9) ran once as `cli`.
- Screenshots: `/var/tmp/sbpg/release-loop/in-app-release-loop/round-1/<surface>-<step id>.png`. Live log: `.../round-1/steps.jsonl`.
- Page errors: 0 on both passes. Failed app requests: 0. The only 4xx responses were the spec-named HTTP 400/409 refusals (15 per pass). Blocked external fonts/CDN were classed `external_blocked`.

## Failure

### E.8 (cli): MCP registry now exists, spec says it does not

- Expected (spec): `ls server/lib/mcpToolRegistry.js` prints `ls: cannot access ... No such file or directory`.
- Observed: the file exists (commit b77049b, platform MCP server). `ls` printed `server/lib/mcpToolRegistry.js`, exit 0.
- The spec expectation is stale for this commit (amendment proposed below). It is also an interface-parity gap, see MCP_GAP.

### MCP_GAP: no release-loop tools in the platform MCP server

The registry has 11 tools (career and application tools plus `release_tracker_read`). None of the tools the spec names exist: `release_loop_get_definition`, `release_loop_save_definition`, `release_loop_start_run`, `release_loop_get_run`, `release_loop_transition_run`, `release_loop_record_round`, `release_loop_log_step`, `release_loop_add_bug`, `release_loop_bug_action`, `release_loop_add_reconciliation`, `release_loop_resolve_reconciliation`, `release_loop_list_escalations`. I created a `release.read` token through Connected Agents in the UI. `tools/list` returned only `release_tracker_read`, and `tools/call release_loop_get_definition` returned `404 unknown_tool`. So Journeys 1, 2, 3, 4 and 6 have UI and API but no MCP tool; assign to platform-mcp.

Journey 5 parity holds: `release_tracker_read` returned release `2030-04-01-garden-gate` with `features: 4, passedFeatures: 1` after tide-chart was added, matching the Releases tab (1 of 3 at J5; 1 of 4 once tide-chart existed).

## Proposed spec amendment

E.8: replace the expected `ls` output with a check that `server/lib/mcpToolRegistry.js` exists and that `tools/list` (admin token with `release.read`) contains no `release_loop_*` tool, recorded as an MCP gap for platform-mcp. The current text cannot pass once the registry exists.

## Observations (not scored)

1. P.1 says the first `/world` open shows the Career Portfolio Terms dialog. The harness setup (`create-test-member.mjs`) pre-accepts terms for the admin, so no dialog appeared; the terms flow was not exercised.
2. The visible label "Feature name (optional)" has an accessible name of just "Feature name" (aria-label overrides the label), a label-in-name mismatch (WCAG 2.5.3).
3. J3.9: in an early pass, right after clicking **Move to fix** on a run at its fix-round limit, the screen at about 0.7 s showed the banner and a toast "Run recorded as not passed" but still **Status: active** and the Move buttons. About 3.7 s later the state was correct. The refresh after that transition lags.
4. In my first desktop pass (0.7 s waits after each click) J3.3 showed the run still at `integrate_fix`, and J4.3 showed "No bugs recorded" with no POST sent for the second Add bug click. With waits tied to the response neither reproduced in two later full passes. Unconfirmed intermittent; cause not identified.
5. The Classic Tools path (desktop only, not scored) was not exercised.

## Cleanup

Server stopped via PID file; both test databases dropped; credentials file removed. No product code, spec or baseline files were changed.
