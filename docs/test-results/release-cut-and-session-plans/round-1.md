# Test result — release-cut-and-session-plans — round 1 (re-test after fixes)

Commit tested: 1032699 (integration head `claude/zealous-meitner-5tuft5`). Baseline v1, spec sha 89a7db47639d75cb09ef8ec0531d737c5314d0746b9f467c6f25c035270ebc64 (baseline check passed; no version change, so no diff table). Surfaces: desktop 1280x900, mobile 390x844 (touch, taps), cli. Each browser pass ran on its own freshly created and seeded database (production build served on port 16302), test accounts from `scripts/create-test-member.mjs`. Evidence: /var/tmp/sbpg/release-loop/release-cut-and-session-plans/round-1/ (steps.jsonl, screenshots named `<surface>-<step id>.png`).

This report replaces an earlier round-1 file written against commit 384d046. The two runs agree: the same 9 steps fail.

```json
{
  "feature": "release-cut-and-session-plans",
  "baseline": 1,
  "specSha256": "89a7db47639d75cb09ef8ec0531d737c5314d0746b9f467c6f25c035270ebc64",
  "total": 62,
  "passed": 53,
  "failed": ["J3.1", "J3.4", "J3.5", "J6.6", "J7.8", "J7.9", "J7.11", "J8.6", "J8.7"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: NOT passed (53 of 62 steps).

## Failures (9 steps, two causes)

1. **Stale fixture score for `in-app-release-loop`** (J3.1, J3.4, J3.5, J7.8, J7.9, J7.11, J8.6, J8.7; J3.x and J7.11 failed on both desktop and mobile). The spec says the feature is "frozen at 60 of 60 on baseline v2, round 3". `docs/test-results/in-app-release-loop/round-4.md` now exists with baseline 2, passed 59 of 60, so the platform (correctly, reading the newest round) records `actual 59/60`, a red **Missed** label and `"round":4,"passed":59`. Everything else those steps check matched the spec: label and alert wording, the 409 refusal, the re-estimate counter and "original kept", no score input on the card, `recorded:true`, closed card, `closeNote`, and `guided-training-agent` showing `actual not validated` with no label and no 0. Proposed amendment: use a feature whose newest round cannot change, or state the expected score as the newest round's score.
   - J3.1 seen: `in-app-release-loop · size S · expected 60/60 · actual 59/60` + red **Missed** (expected `actual 60/60` + green **Met**).
   - J3.4 seen: `1 re-estimate (original kept)` present; item line `expected 60/60 · actual 59/60` (original expected unchanged).
   - J3.5 seen: `in-app-release-loop · size - · expected 60/62 · actual 59/60` + red **Missed** (expected `actual 60/60`).
   - J7.8 seen: `"recorded":true`, result `{"feature":"in-app-release-loop","round":4,"passed":59,"total":60,"baseline":2,"report":"docs/test-results/in-app-release-loop/round-4.md"}` (expected round 3, 60/60).
   - J7.9 seen: row for `S-garden-api` with `"actual":"59/60","met":false` (expected `"60/60"`, `true`).
   - J7.11 seen: card `S-garden-api` closed, text `done`, item `expected 60/60 · actual 59/60 · Missed` (expected `actual 60/60`).
   - J8.6 seen: merge result `passed` 59 (expected 60), total 60, baseline 2. My first J8.6 line was a false pass (my check matched the estimate's `expect.passed`); a corrected fail line is appended to steps.jsonl and the score above includes it.
   - J8.7 seen: `S-garden-mcp` row `actual` `59/60`, `met` false (expected `60/60`, true).
2. **J6.6 command output wording** (cli). Seen: `Froze 1.0.0 at 1032699: 1/2 planned delivered, 1 carried, 0 in backlog, 0 added after the cut. Opened 1.1.0 with 1 features (1 carried, 0 new).` Expected: `Froze 1.0.0 at <HEAD7>: 1/2 delivered, 1 carried. Opened 1.1.0 with 1 features (1 carried, 0 new).` Counts and commit are right; the sentence now carries the planned/backlog/added-after-cut groups from the release-scope feature. Proposed amendment: replace the expected line with the new wording.

## Fix verification (by step id)

| Bug | Step id(s) | Verdict |
| --- | --- | --- |
| B3 parity (cut has UI, API and MCP forms and a parity row) | J8.11 (Capabilities card shows Website ready / API ready / MCP ready with the specified path, routes and tools), J8.12 (`check-interface-parity.mjs` exit 0, last line `OK: the registry matches the code.`) | Verified: both pass. |
| B7 no durable store | E.3 (after reload: S-garden-01 closed, 02, 03, api, mcp all present), J7.11 | E.3 passes on desktop and mobile. Records are files under `docs/release-log/session-plans/` (no table). J7.11 fails only for the stale score. |
| B8 report view not on screen | none in the baseline (J7.9, J8.7, E.6 use the API/MCP report) | Still a gap: no screen calls `GET /api/release-cut/sessions/report`. The UI network calls seen were `GET /api/release-cut/releases`, `/releases/:version`, `/sessions`, `POST /sessions/estimate`, `/:session/merge`, `/:session/close`. Expected vs actual does show on each session card. Reported as an observation. |
| B9 journeys use accounts with no Career Master technologies | none | Not exercised by this spec. |

## Interface parity

- UI to API: each UI action called the route in the spec's parity table. Closing ran without a gate dialog.
- MCP: the seven `release_cut_*` tools are listed in the specified consecutive order (J8.2); get_release, record_estimate, record_merge, close_session and session_report return the same data as the UI/API (apart from the stale 59/60); a member token gets 403 `forbidden` with the exact message (J8.10). Outside the baseline I also called `release_cut_list_releases` and `release_cut_list_sessions` with a UI-created admin token: they match the Releases and Session plans tabs. No `MCP_GAP`.
- Mobile: every UI journey ran at 390px with taps; no `MOBILE_GAP`. E.1 passes on both surfaces (no horizontal scroll; every control below the tab row at least 44px tall). No `UI_GAP`.

## Observations (not in the score)

1. Stale red alerts accumulate on Session plans: after the J2.2 to J2.5 refusals each later alert is shown together with all earlier ones, and they are still on screen after a successful save. On the phone the fixed red banner for the earlier "sixty" error covers the bottom of the card and hides part of **Close session** (see `mobile-J3.1.png`). Steps pass literally; the screen is confusing and partly obscured.
2. Connected Agents shows the MCP address as `http://localhost:5173/mcp` (the Vite dev origin) although the app was served on 16302.
3. The session report endpoint and `release_cut_session_report` tool have no screen (B8).
4. The estimate item for `in-app-release-loop` carries `outOfScope: true` (the feature is backlog); the card does not show this.
5. Environment: the machine was heavily shared. After "Back to World", clicking a card often hung Playwright for 25 to 45 seconds even though the panel opened; the harness retried or accepted the click when the panel was visible. One aborted chunk request (`ConnectedAgentsPanel-*.js`, `net::ERR_ABORTED`) came from the harness reloading during a retry. No page error occurred in either pass. Several earlier attempts were discarded and rerun from a fresh database because a previous attempt's background process kept writing to the same database and files; none of that data is in this score.
6. The diff stat of `docs/release-log/releases` is empty (E.4 pass); the fixture cut ran only against the fixture folder.

## Cleanup

Test server stopped via its PID file, database `sb_rl_val_16300_1` dropped, `S-garden-*.json` leftovers removed from the worktree. The fixture folder and scratch scripts remain under /var/tmp/sbpg/agents/val-16300-1/.
