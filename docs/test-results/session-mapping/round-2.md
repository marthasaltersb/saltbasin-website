# Test result - session-mapping - round 2

Commit tested: 160edab6e3246a00524a60c3aff2b83a4f1fa163 (integration head, "session-mapping fix round 1" merged). Release 2026-10-02-application-packages-resume. Validation agent val-5900-17.

```json
{
  "feature": "session-mapping",
  "baseline": 1,
  "specSha256": "1adb496f20fe354930c1c9c25e7e426c32f16430778fd73c2132699a8a2bc4db",
  "total": 56,
  "passed": 56,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": []
}
```

Result: PASS, 56 of 56 baseline steps, no failures, nothing blocked or not run. `release-spec-baseline.mjs check` reported "baselines match: session-mapping v1". The baseline version did not change since round 1, so no diff table is needed.

## Setup (fixed test constraints)
- Fresh database per surface (`sb_rl_val_5900_17`), `npm run seed`, `create-test-member.mjs`. The server ran as the production build (`vite build`, `NODE_ENV=production`, port 5934). The database was dropped between the desktop run and the phone run.
- Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900. Phone 390x844 with isMobile and hasTouch (taps; the timeline sliders were dragged with the mouse because Playwright has no touch drag).
- Fixtures were written byte for byte from Appendix A (P.2). Logged in through the login form and navigated by clicking from the World Shell: Journeys, then the Sessions card. The only typed URLs were /login and /world, as the spec says.
- Screenshots and logs are in `/var/tmp/sbpg/release-loop/session-mapping/round-2/`, with the step log in `steps.jsonl`. The UI's API calls are in `api-calls-desktop.txt` and `api-calls-mobile.txt`.

## Fix verification
- T1 (MCP tools): the ten session_mapping tools are registered, and the Connected Agents screen offers the `sessions.read` and `sessions.write` scopes.
- No baseline step covers MCP, so the T1 check is logged as observations. The spec's interface-parity table still calls the tools "planned"; no step depends on it.
- The checks used an admin token created in the UI (World Shell -> Journeys -> Connected Agents) with both session scopes:
  - Read tools equal the API byte for byte. The tools were config, sessions list, one session, trends, proposals (all, and status=applied) and failures.
  - Mutating tools return the same errors as the UI. These were import (metrics, bad analysis, "needs a tokens object"), proposal reject with no note ("Say why this mapping is rejected") and capture-failure disposition with no note ("Closing a capture failure needs a note saying what was done"). A valid metrics import filed fine.
  - Not exercised through MCP: successful reject, apply, config save, scan and transcript import. These were only exercised through the UI and API.

## Steps
All of P.1-P.3, J1.1-J10.4 and E.1-E.9 passed.
- Desktop and phone: J1-J7, J9 and E.1-E.8 passed on both.
- CLI: J7.1, J7.2, J8.1-J8.5, J9.1, J10.1-J10.4 and E.9 passed, each run once per database.
- Setup: P.1-P.3 passed.

Every error response named by the spec was seen exactly where the spec says. Nothing was left as a failed or unexplained request.
- HTTP 400 on reject (J4.4), failure disposition (J7.5) and the metrics, transcript, config, apply and scan routes (E.1-E.4, E.6-E.8).
- 401 and 403 on the J10.4 and E.9 curl calls.
- No pageerrors on either surface.

## Observations (outside the baseline, never scored)
1. A `net::ERR_ABORTED` request for `/api/career/consent-status?consentType=career_portfolio` appeared once on the desktop run. It fired while `/world` was being opened, as an in-flight request aborted by the navigation. No visible effect.
2. The Connected Agents "Tools an agent can call" list shows only the 14 career tools. None of the release tools or the ten session_mapping tools appear there, even though the tokens and tools work. This is a documentation gap on that screen, not covered by a step.
3. On the phone, the "Analysis filed" toast sits over the "Showing ..." line under the timeline sliders for a few seconds, so the line is briefly partly hidden. It clears by itself.
4. The in-app run with 0 tokens shows "spend USD 0.00" while the 100-token run shows "USD 0.0011". Both are consistent with the spec (the spec elides this part of the line).
5. `docs/training/session-mapping.md` still labels the MCP tools "planned". The change spec was updated, the training spec is frozen, so any wording change needs an amendment.
6. The shared fixture folder `/var/tmp/session-mapping-fixture` is the same path for every validator. Concurrent validators could overwrite each other's scan state.

## Cleanup
The server process was killed by PID file, the database `sb_rl_val_5900_17` was dropped, and the cookie jars and credentials file were removed. Nothing was committed or pushed, and no product code, spec or baseline was changed.
