# Test result: in-app-release-loop, round 4

Commit tested: c738308 (integration head `claude/zealous-meitner-5tuft5`). Date: 2026-10-10. Validation agent val-5900-2.

```json
{
  "feature": "in-app-release-loop",
  "baseline": 2,
  "specSha256": "8020b172e15894222ac91d5857779c34062a59213d8b82ae310d7627ede9b166",
  "total": 60,
  "passed": 59,
  "failed": ["E.1"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": []
}
```

Result: NOT PASSED (59 of 60). The one failure is E.1 on the desktop pass only (mobile passes).

Baseline: v2, unchanged since round 3 (`check` passed). No diff needed; scores compare like for like with round 3 (60 of 60).

## Method

Fresh database plus seed per pass (desktop, mobile), production build on port 5904, 1280x900 desktop and 390x844 touch phone (isMobile, hasTouch, taps), light scheme, en-US, TZ=UTC. Test accounts from `scripts/create-test-member.mjs`. Signed in through the login form, then navigated World -> Journeys -> card by clicking or tapping. Command steps (J6.2, E.5-E.9) ran once as `cli` on the desktop database. Screenshots and live log: `/var/tmp/sbpg/release-loop/in-app-release-loop/round-4/` (`steps.jsonl`, `network.jsonl`, `<surface>-<id>.png`).

Page errors: 0. Failed app requests: 0. 4xx responses: 15 per pass (8 x 400, 7 x 409), each at a step that names it. One external font request blocked (noise).

## Failure

- **E.1 (desktop only).** Expected every visible button, select, input, textarea and summary at least 44px tall. Observed three 21px-tall controls in the World Shell breadcrumb bar shown above the Release loop panel: **Sun**, **Journeys** and **Copy link** (identical after Journey 1, 2 and 4). No horizontal scroll (scrollWidth 1280 = innerWidth). **Back to World** is 44px or more. On the 390px pass every control is at least 44px and there is no horizontal scroll (E.1 mobile passes). Evidence: `desktop-E.1.png`, `desktop-layout.json`. Suggested owner: `WorldBreadcrumbs.jsx` desktop sizing (the mobile layout already meets 44px).

## Open bugs from the fix details

- **in-app-release-loop-F1-6 (spec governance and documentation).** No baseline step covers it. Seen: `docs/spec-amendments/in-app-release-loop/A1.json` and `docs/spec-amendments/release-loop-tooling/A1.json`, `A2.json` exist in the main checkout. I did not verify the content of `docs/changes/in-app-release-loop.md`. Not scored.
- **in-app-release-loop-F1-7 (editable stage graph).** No baseline step maps to it. The Definition tab does expose per-stage selects, but I did not test gate logic against edited stage keys. Not scored; remains a requirement gap.
- Nothing regressed since round 3; E.8 still passes (see below).

## CLI steps

- E.5: login HTTP 200, `GET /api/release-loop/definition` 200, `definition.version` 6 (same as the Definition tab after E.4), agents 9. Pass.
- E.6: no cookie prints `401`. Pass.
- E.7: `POST /runs/2/transition` -> HTTP 409 `This run is not passed and cannot move`. Pass.
- E.8: `server/lib/mcpToolRegistry.js` exists; manifest lists all 13 `release_loop_*` names; `check-interface-parity.mjs` exit 0, final line `OK: the registry matches the code.` Pass.
- E.9: nine `release_loop` agent rows, `release_builder` first, `release_scope_reviewer` last. Pass.
- J6.2: HTTP 201 using the browser session cookie. Pass. (On the mobile pass the same call was made as setup for J6.3, result 201.)

## MCP parity (not a baseline step)

Created a token in the UI (World -> Journeys -> Connected Agents, scopes `release.loop.read` and `release.loop.write`) and called `scripts/mcp-call.mjs` against the desktop database after E.4. `tools/list` shows 13 `release_loop_*` tools. `release_loop_get_definition` returned version 6 (as the Definition tab). `release_loop_list_runs` matched the run cards (tide-chart validate/active, compost-notes triage/1 round, water-planner triage/not_passed/3 rounds/1 open bug, seed-catalog done/2 rounds/0 open bugs). `release_loop_transition_run` on run 2 returned `isError: true`, 409 `This run is not passed and cannot move` (same as E.7). `release_loop_list_escalations` empty (same as the Escalations tab). No MCP_GAP.

## Observations (not scored)

1. The input labelled **Feature name (optional)** has `aria-label="Feature name"`, so its accessible name does not contain the visible label text. Other fields match.
2. The harness pre-accepts terms for the admin, so the P.1 terms dialog was not exercised.
3. The spec text still says "the registry file does not exist at this baseline" in its Where-things-are section while E.8 requires it to exist (wording amendment suggested, as in round 3).
4. `check-interface-parity.mjs` prints a non-failing gap line: `career-scoring-preferences: MCP_GAP - Merged from main (2026-10-10) without an MCP tool`. Outside this feature.
5. Steps ran noticeably slower in the second half of the first desktop pass (machine load from parallel agents); no step failed on timing.

## Cleanup

Server stopped via PID file, test database `sb_rl_val_5900_2` dropped, credentials file removed. No product code, spec or baseline files were changed. Nothing committed.
