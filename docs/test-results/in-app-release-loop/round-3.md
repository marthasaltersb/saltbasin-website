# Test result: in-app-release-loop, round 3

Commit tested: 13edeb2615b22e3c105ebda4f87d967634267c3a (integration head). Date: 2026-10-10. Validation agent val-5900-11.

```json
{
  "feature": "in-app-release-loop",
  "baseline": 2,
  "specSha256": "8020b172e15894222ac91d5857779c34062a59213d8b82ae310d7627ede9b166",
  "total": 60,
  "passed": 60,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": []
}
```

Result: PASSED (60 of 60 scored steps, on every required surface).

## Baseline diff (v1 -> v2, amendment A1)

Comparable 63 ids. Same: 62 (P.1-P.4, J1.1-J6.3, E.1-E.7, E.9). Changed: E.8. Added: none. Retired: none. Round 2 scored 59 of 60 on v1 (only E.8 failed). Round 3 scores 60 of 60 on v2, so the only like-for-like difference is E.8.

## Method

- `release-spec-baseline.mjs check` passed (v2). Constraints: fresh database plus seed per pass (desktop and mobile each on their own), production build on port 5922, 1280x900 desktop and 390x844 touch phone (isMobile, hasTouch), light scheme, en-US, TZ=UTC. Test accounts from `scripts/create-test-member.mjs`.
- Signed in through the login form, navigated World -> Journeys -> Release loop by clicking or tapping. Every journey ran on both surfaces; command steps (J6.2, E.5-E.9) ran once as `cli`.
- Screenshots: `/var/tmp/sbpg/release-loop/in-app-release-loop/round-3/<surface>-<step id>.png`. Live log: `.../round-3/steps.jsonl`.
- Page errors: 0. Failed app requests: 0. The only 4xx responses were the spec-named HTTP 400/409 refusals (15 per pass, 30 total).

## Fix verification (by step id)

- E.8 (amendment A1): PASSES. `server/lib/mcpToolRegistry.js` exists, `server/data/mcpToolManifest.json` lists all 13 `release_loop_*` names, and `node scripts/check-interface-parity.mjs` exits 0 with final line `OK: the registry matches the code.`
- Every other step: unchanged and passing (see score).

## MCP parity check (not a baseline step)

Created a token in the UI (World -> Journeys -> Connected Agents, scopes `release.loop.read` and `release.loop.write`) and used `scripts/mcp-call.mjs` against the mobile-pass database. `tools/list` returned the 13 release_loop tools. `release_loop_get_definition` returned version 6 (as the Definition tab after E.4). `release_loop_list_runs` returned tide-chart (validate, active), compost-notes (triage, 1 round, 1 bug), water-planner (triage, not_passed, 3 rounds, 1 open bug), seed-catalog (done, 2 rounds, 0 open bugs): same as the run cards. `release_loop_transition_run` on run 2 returned `isError: true`, 409 "This run is not passed and cannot move" (same as E.7). `release_loop_list_escalations` was empty (same as the Escalations tab). No MCP_GAP.

## Observations (not scored)

1. A first desktop attempt (discarded, replaced by a full fresh re-run) showed J2.12 (bug not yet listed after Add bug) and J2.15 (stage still triage after Move to fix) failing, because the script read the page about 1 second after the response. Later snapshots in the same attempt showed the expected state, so the screen did update, just later than the script waited. The full re-run on a fresh database, where the script polled up to 8 seconds, showed no wait above 600 ms in either pass. Likely transient machine load from parallel agents, not a confirmed product defect, but a one-off refresh lag of more than a second cannot be ruled out. Evidence: `/var/tmp/sbpg/agents/val-5900-11/steps-attempt1-desktop.jsonl`.
2. The harness pre-accepts terms for the admin, so the P.1 terms dialog was not exercised.
3. The spec text still says "the registry file does not exist at this baseline" in its Where-things-are section while E.8 now requires it to exist (outside the scored steps; suggest a later wording amendment).

## Cleanup

Server stopped via PID file; test database dropped; credentials file removed. No product code, spec or baseline files were changed.
