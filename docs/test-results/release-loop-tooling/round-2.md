# Test result: Release loop tooling, round 2

- Feature: Release loop tooling (definition, saved workflow, skill, bug-attempt limit, failure reconciliation, live step logs, tracker sync, test accounts)
- Release: 2026-10-02-application-packages-resume
- Round: 2 (re-test after fixes)
- Commit tested: d8ee228 (integration head `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-09
- Validator: val-8300-6 (Chromium via Playwright, API port 8312, preview port 9312, local DB dropped afterwards)
- Step log: `/var/tmp/sbpg/release-loop/release-loop-tooling/round-2/steps.jsonl` (108 checks, 108 pass, 0 fail); screenshots in the same folder.

## Result: PASS. 108 of 108 checked expectations passed.

## Per-journey results

| Journey | Result | Seen |
|---|---|---|
| Preconditions | pass | Fixture written (19 agents); sync exit 0, silent; preview server printed its URL |
| J1 Definition file | pass | `6 8 2 context,prompt,cache,memory initialCheck,validation,noSilentCaps,push`; ten statuses in the spec's order; `d.tracker` names the tracker artifact, has no World Shell or /api/release-loop; the grep prints nothing |
| J2 Workflow parses | pass | `node --check` exit 0, no output |
| J3 Sync output | pass | verify-snapshot "snapshot matches expected"; runId `runA + runB`; all feature statuses, bug statuses and attempts as specified; totals 391 / 20000 / 40 / 2000; echo-audit agent and feature `stalled`; sentinel count 0; runA-only has no delta-board |
| J3b Test accounts | pass | creds.json matches; second run identical (one member row); login lands on `/world` with Your World, Journeys, Classic Tools and no password or terms page; remote DB refused with exit 2 and the exact message; no page errors |
| J4 Tracker, 1280 light | pass | Eight tiles in order, callout, agent card, features table; every tile layer, B1 history (R1 Found, R1 Fix applied, R2 Came back, R2 Fix applied, R3 Came back), B9 question, crumb back, bravo-forms and Round 3 layers; 19 token rows; no horizontal scroll |
| J5 Other sizes and themes | pass | 1280 dark, 390 light, 390 dark and `?theme=dark` all show the same content; backgrounds `rgb(243, 246, 247)` and `rgb(15, 26, 31)`; at 390 Features rows are stacked cards with Status / Latest test / Rounds / Its own bugs verified captions; no `.panel` overflows on the overview, bravo-forms layer, round layer or Tokens layer; clicking the feature name or other card text opens the feature layer |
| Edge 1 | pass | `snapshot not found: /nonexistent.json`, exit 2 |
| Edge 2 | pass | `Preview failed: snapshot 404`, no tracker (the one console 404 is that missing snapshot request) |
| Edge 3 | pass | A run directory with no journal gave 0 agents, exit 0 |
| Edge 4 | pass | `--stale-minutes 60`: echo-audit agent `running`, feature `validate` |

## Console errors and failed requests

- Page errors: none.
- Failed app requests: none.
- External font requests blocked by the sandbox (`ERR_CERT_AUTHORITY_INVALID`): logged as `external_blocked`.

## Fix details received: status of each

| Fix | Now passes? | Evidence |
|---|---|---|
| RLT-T1 (statuses order, J1 step 3, traces) | Yes | J1 steps 1.2 and 1.3 passed literally |
| RLT-T2 (J4 and J5 for the drill-down) | Yes | Every J4 and J5 step passed as written, on all 5 viewport and theme combinations |
| release-loop-tooling-B1 (World Shell / api claims removed) | Yes | `d.tracker` is clean; the grep over docs/release-process.md and SKILL.md prints nothing |
| release-loop-tooling-B2 (stale detection) | Yes | echo-audit `stalled` at the default threshold, `running` at `--stale-minutes 60`; the page shows "Stalled (no sign of life)" on the overview, feature layer and Tokens layer |
| release-loop-tooling-B3 (390px stacked cards) | Yes | No `.panel` overflow on the overview, feature, round and tokens layers at 390 light and dark; the card name and other text both navigate; screenshot checked (`j5-390-dark-overview.png`) |
| RLT-T2 agent-card page-errors count (not fixed, open question) | Not testable | The agent card shows only checks, passed and failed, as the spec now says. The open question for the spec author remains. |

## Observations (not failures)

- `scripts/create-test-member.mjs` writes about 140 KB of Postgres NOTICE objects ("already exists, skipping") to stdout on every run, which buries the result. Exit code and creds file are correct. The spec does not require quiet output, so this is not a failure. Consider silencing notices.
- The agent-card page-errors count is still an open question for the spec author.

## Cleanup

The API server and preview server were stopped by PID file, database `sb_rl_val_8300_6` was dropped, and the fixture directory was removed.
