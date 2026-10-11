# Test result: Release scope, round 4

Feature: Release scope: planned vs backlog vs added after the cut. Round 4. Commit tested: 330f014 (integration head). Date: 2026-10-11. Validator: val-16600-13 (fresh database per surface, TZ=UTC, en-US, light).

## Score (from `release-spec-baseline.mjs score`)

```json
{"feature":"release-scope","baseline":4,"specSha256":"6451912ea8458dea458ceabdb489ca9f3b46dc5ea9fb586eb80fecc2ea7dda31","total":27,"passed":25,"failed":["J2.7","J5.3"],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":[]}
```

Baseline v4 (spec sha 6451912ea845, amendment A4). Diff v3 to v4 (`diff`): 28 comparable steps all same, 0 changed, 2 added (J2.6, J2.7), 0 retired; context changed: "Where things are". Scores are comparable with v3 only on the 28 same ids.

## Fixes handed to this round

- release-scope-F2-3 (scope change on screen, API, MCP): the screen path now passes, J2.6 desktop and mobile. The API path (GET and POST /api/release-tracker/scope) is what the screen called. The MCP path works but J2.7 fails as written: see below.
- release-scope-F2-4 (change-spec text): no baseline step covers it; not tested.

## Failures

- J2.7 (cli), AMBIGUOUS: the step says TOKEN_A is created with only `release.read` ticked. With such a token the first call returns `isError: true`, status 403, code `scope_not_granted`, "This access token does not include the "release.write" scope needed for release_tracker_set_scope." Proposed wording: TOKEN_A and TOKEN_B are created "with the `release.read` and `release.write` scopes ticked". With those tokens, created in Connected Agents at 390px, everything else matched: first call `isError: false`, key release-loop-tooling, from backlog, to planned, message "release-loop-tooling: backlog -> planned."; repeat 409 `no_change` "release-loop-tooling is already planned; nothing changed."; member token 403 `forbidden` "release_tracker_set_scope is for administrators only. You are signed in as a member."; the file changed only on the first call. A member token holding only release.read gets `scope_not_granted`, not `forbidden`, so the TOKEN_B expectation also needs release.write.
- J5.3 (desktop and mobile), AMBIGUOUS: the step says each note has `added 2026-10-10`. There are 10 notes (A), 7 "counted in this release", 3 "kept in backlog", every note ends with its reason, but single-experience-world-shell reads `added 2026-10-11 (c8da5b1)` (its `added.at` is 2026-10-11). Proposed wording: each note has `added <date of that entry's added.at>`.

## Per step (pass on every listed surface unless stated)

| Step | Result | Seen |
|---|---|---|
| P.1, P.2, P.3 | pass | Fresh DB booted, seeded, test accounts created; snapshot wrapper written; signed in through the login form on both surfaces. |
| J1.1 | pass | First line and headings match: Planned (18), Added (10; 7 counted), Backlog (6). The spec's 18/7/6/4 is the 21:05Z example; the live `show --json` lengths are 18/10/6, C=7. |
| J1.2, J1.3 | pass | CLI text checks (no browser element). All named entries present with the right scope, hash and decider; three more planned entries exist. |
| J1.4 | pass | Valid JSON, 34 keys each in exactly one array, decidedBy owner. |
| J2.1, J2.2, J2.3, J2.4, J2.5 | pass | Exact messages; history entry correct; undo restores byte-identical `show` output. |
| J2.6 | pass desktop and mobile | Alert "Give who decided." (red) with no file change; then status "release-loop-tooling: backlog -> planned. Recorded in the release file; ..." and correct scopeHistory entry. Screenshots J2.6-*. |
| J2.7 | fail (AMBIGUOUS) | See Failures. |
| J3.1, J3.2 | pass | Not-launched line lists 6 backlog + 3 added; qr-gated-outputs launched for production bugs only; with --include-backlog no such line and a qr-gated-outputs file. |
| J4.1, J4.2, J4.3 | pass | Note on stderr, outOfScope flags as expected, file removed. |
| J5.1 | pass | Toast "Snapshot 1 stored" on each fresh database; no red error. |
| J5.2 | pass | Headings and order as specified, no "Features" heading. |
| J5.3 | fail (AMBIGUOUS) | See Failures. |
| J5.4, J5.5 | pass | Feature page opens and back works; state JSON has release-scope planned with added.decidedBy owner, qr-gated-outputs backlog with no added; `release_tracker_get_state` over MCP matches. |
| J6.1, J6.2 | pass | Mobile: three tiles stacked, rows as label/value cards, scrollWidth 390; notes wrap inside the card with 6px gaps. Desktop pass was evaluated at 1280x900 (the step's 390 clause is the mobile surface). |
| E.1, E.2, E.3 | pass | Exact messages, exit 1, worktree clean afterwards. |
| E.4 | pass | Checkout, DB dropped, server stopped, FX removed, `git status --short` empty. |

Screenshots and `steps.jsonl`: /var/tmp/sbpg/release-loop/release-scope/round-4/.

## Console errors and failed requests

- external_blocked: cdnjs three.js r128 (sandbox proxy), 14 times; not a failure.
- requestfailed `/api/release-tracker/stream` ERR_ABORTED, 4 times: the live stream closing when the page navigated or closed; no visible effect.
- HTTP 400 POST /api/release-tracker/scope: the expected rejected input in J2.6 (empty Decided by).
- No page errors.

## Interface parity

UI (screen), API (/api/release-tracker/scope, /state) and MCP (release_tracker_get_scope, set_scope, get_state) agree. MCP_GAP: none. UI_GAP / MOBILE_GAP: none.

## Observations (outside the baseline; not scored)

- Connected Agents shows the MCP address as http://localhost:5173/mcp (from APP_BASE_URL in the test environment), not the server port.
- A member can tick `release.read` and `release.write` ("administrators only" in the label) and the token is created; calls then fail with 403 forbidden at call time. A rejected scope at creation time would be clearer.
- In the same browser tab, navigating from the tracker page to the API URL hung (even to about:blank, no dialog seen); a new tab loaded it in under 100 ms. Low confidence; may be a test-harness effect.
- On the phone the content column is 270px of 390px (about 60px of padding each side); readable, but narrow.
- A second paste of the same snapshot on one database reports "Nothing new" rather than "Snapshot N stored", so each surface's J5.1 needed its own fresh database.
- "Added after the cut" notes are plain text lines with no visible card separation; the 6px gap meets the step but is tight.
