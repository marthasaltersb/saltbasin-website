# Test result: in-app-release-loop, round 2

Commit tested: 0800b1c18ce1b2f1003085d0010f95a36fe75932 (integration head). Date: 2026-10-10. Validation agent val-5900-2.

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

Result: NOT PASSED (59 of 60 scored steps; one failure, E.8, a stale spec expectation). Baseline is still v1, same as round 1, so no diff table is needed.

## Method

- `release-spec-baseline.mjs check` passed (baseline v1). Constraints: fresh database plus seed per pass (desktop and mobile each on their own), production build on port 5904, 1280x900 desktop and 390x844 touch phone, light scheme, en-US, TZ=UTC.
- Signed in through the login form, navigated World -> Journeys -> Release loop by clicking. Both passes ran every journey and edge case; command steps (J6.2, E.5-E.9) ran once as `cli`.
- Screenshots: `/var/tmp/sbpg/release-loop/in-app-release-loop/round-2/<surface>-<step id>.png`. Live log: `.../round-2/steps.jsonl`.
- Page errors: 0. Failed app requests: 0. The only 4xx responses were the spec-named HTTP 400/409 refusals (15 per pass). Blocked external fonts/CDN were classed `external_blocked`.

## Fix verification (by step id)

- T1 / B1 (MCP tools for the release loop): VERIFIED. `server/lib/mcpToolRegistry.js` now registers 13 `release_loop_*` tools (all 12 named in the spec plus `release_loop_list_runs`). I created a token through World -> Journeys -> Connected Agents in the UI with scopes `release.loop.read` and `release.loop.write`, then used `scripts/mcp-call.mjs`. Results matched the UI and API: `release_loop_get_definition` returned version 6; `release_loop_list_runs` showed tide-chart/compost-notes/water-planner/seed-catalog with the same stage, status, rounds and open bug counts as the run cards; `release_loop_get_run` for water-planner matched; `release_loop_transition_run` on water-planner returned `isError: true`, 409 "This run is not passed and cannot move" (same as E.7); `release_loop_list_escalations` was empty (same as the Escalations tab); `release_loop_log_step` wrote a step (`J9.8 | mcp`, verified in `release_loop_steps`); `release_loop_start_run` for a duplicate feature returned the 409 of E.2. No MCP_GAP remains for this feature.
- B2 (wiring) and B4 (editable definition): the Definition tab edits, versioning and reset steps J1.1-J1.5 and E.4 pass on both surfaces; saving, bad-input refusals and reset behave as specified.
- T2 / E.8: still FAILS, see below. This is the same stale expectation as round 1, not a product defect.

## Failure

### E.8 (cli): spec expects the MCP registry to be absent
- Expected (spec): `ls server/lib/mcpToolRegistry.js` prints `ls: cannot access ... No such file or directory`.
- Observed: prints `server/lib/mcpToolRegistry.js`, exit 0 (platform-mcp merged in b77049b).
- Evidence: steps.jsonl line for E.8 (surface cli).
- Proposed amendment (same as round 1): replace the E.8 expectation with "the file exists and `tools/list` for an admin token with the release loop scopes contains the `release_loop_*` tools". Under the current step text it cannot pass. Not edited by me.

## Observations (not scored)

1. The harness pre-accepts terms for the admin (`create-test-member.mjs`), so the P.1 terms dialog never appeared; the terms flow was not exercised.
2. `release_loop_log_step` takes `{runId, step:{...}}` and `release_loop_bug_action` takes its own argument names; guessing flat arguments gives a clear 400 `invalid_arguments` naming the missing/unknown argument (good, not silent).
3. Clicking **Journeys** in an automated session once hung past the 15 s default click timeout (WebGL scene busy on first paint); retried with a longer timeout and it worked. Only seen in the token-creation helper, not in the scored passes.
4. Round 1 observations 2 to 4 (label-in-name for "Feature name (optional)", delayed refresh after Move to fix at the round limit, an unconfirmed intermittent) were not re-checked beyond the scored passes, which ran clean.

## Cleanup

Server stopped via PID file; both test databases dropped; credentials file removed. No product code, spec or baseline files were changed.
