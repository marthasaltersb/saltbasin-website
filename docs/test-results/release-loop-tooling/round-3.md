# Test result: Release loop tooling, round 3

- Feature: Release loop tooling (definition, saved workflow, skill, bug-attempt limit, failure reconciliation, live step logs, tracker sync, test accounts)
- Release: 2026-10-02-application-packages-resume
- Round: 3 (re-test after fixes)
- Commit tested: 536aa29 (integration head `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-09
- Validator: val-10300-1 (Chromium via Playwright, API port 10302, preview port 11402, local DB dropped afterwards)
- Step log: `/var/tmp/sbpg/release-loop/release-loop-tooling/round-3/steps.jsonl` (126 checks: 104 pass, 22 fail); screenshots in the same folder.

## Result: FAIL. 104 of 126 checked expectations passed; 22 failed (5 distinct defects, each repeated across the 5 viewport/theme runs).

## Per-journey results

| Journey | Result | Seen |
|---|---|---|
| Preconditions | pass | Fixture written (19 agents); sync exit 0, silent; preview URL printed |
| J1 Definition file | pass | `6 8 2 context,prompt,cache,memory initialCheck,validation,noSilentCaps,push`; ten statuses in order; `d.tracker` clean; grep prints nothing |
| J2 Workflow parses | pass | `node --check` exit 0, silent |
| J3 Sync output | pass | verify-snapshot matches; runId `runA + runB`; statuses, attempts, totals, agent states (by journal label), sentinel 0, runA-only has no delta-board |
| J3b Test accounts | pass | creds.json as specified; second run identical (one member); login lands on `/world` with Your World, Journeys, Classic Tools; remote DB refused exit 2 with exact message; no page errors |
| J4 Tracker, 1280 light | FAIL | Steps 1.1, 1.3, 1.4, 2.1 to 2.7, 3.x, 4.x, 5.1 pass. Fails: 1.2, 1.5, background, 2.8 (see below) |
| J5 1280 dark, 390 light, 390 dark, `?theme=dark` | FAIL | Same failures as J4, plus the 390 px cards failure (5.2) on both 390 runs. 5.3/5.4 (clicking card name or text opens the feature layer) pass |
| Edge 1, 2, 3, 4 | pass | `snapshot not found: /nonexistent.json` exit 2; `Preview failed: snapshot 404` with no tracker; zero agents for run dir without journal; `--stale-minutes 60` gives echo-audit agent `running`, feature `validate` |

## Failures

1. **J4/J5 step 1.2, eight tiles.** The page shows nine tiles. A ninth tile, `0.2.0-u4 Status updates` (Open), sits between "Finished with unreconciled failures" and "Tokens out / cache read". The page also gained a Board/World switch, a "Release trends" panel ("Trend history loads with the next sync.") and render bindings that the spec does not describe. The spec is stale against the page. Screenshot: `J4-1280-light-overview.png`.
2. **J4/J5 steps 1.5 and 2.8, status labels.** Features table and Tokens layer: charlie-export shows `Agent stopped` (spec: `Failed`); echo-audit shows raw lowercase `stalled` (spec: `Stalled (no sign of life)`); the Tokens row for `Validate · round 1` echo-audit shows `stalled`. `tools/release-tracker/index.html` has no `stalled` label entry and its status map (line 221) uses `failed: 'Agent stopped'`. Fix B2's labelling is absent from the current page.
3. **Background colours.** Light page background is `rgb(248, 244, 236)` (spec `rgb(243, 246, 247)`); dark is `rgb(22, 26, 28)` (spec `rgb(15, 26, 31)`), on all five runs including `?theme=dark`. (Spec/page mismatch; could also be an intended redesign.)
4. **J5 step 5.2, 390 px layout (regression of B3).** At 390 px the Features table is NOT stacked cards: no `data-label` cells exist, rows are `display: table-row`, the Latest test column is clipped at the panel edge, and Rounds / Its own bugs verified are not visible without sideways scroll. `.panel` scrollWidth exceeds clientWidth on the overview (1 panel), bravo-forms layer (2), round layer (2) and Tokens layer (1). This is a clipped screen, a failure under the regression-gate rule. Screenshot: `J5b-390-light-cards.png`. Page-level `scrollWidth` equals `clientWidth` (the clipping is inside the panel).
5. Ambiguity: the spec's tile count and background values cannot be satisfied by the current page; recorded as failures 1 and 3 rather than guessed.

## Console errors and failed requests

- Page errors: none.
- Failed app requests: none.
- Blocked externally (logged `external_blocked`): `cdnjs.cloudflare.com` Chart.js 4.4.0 and three.js r128 on every page load (`ERR_TUNNEL_CONNECTION_FAILED`). The trends panel and World view depend on these, so the trend chart, history slider and 3D World view could not be tested in the sandbox and are untested.

## Fix details received: status of each

| Item | Now passes? | Evidence |
|---|---|---|
| release-loop-tooling-F1-2 (setup copy not regenerated: `stalled` label and data-label card CSS) | No | `tools/release-tracker/SETUP-FOR-CLAUDE.md` has 0 `stalled` and 0 `data-label`; `index.html` also has 0 of each at this commit (the handed-over claim that index.html has them at lines 55, 104-111, 138 is false here). Page shows `stalled` raw and 390 px tables are not cards. Recurrence of B2/B3 page behaviour. |
| release-loop-tooling-F1-5 (agent card count) | Open owner decision | Agent card shows `2 checks · 1 passed · 1 failed`, as the spec says; no page-errors count. Passes the current spec; the design question is unanswered. |
| release-loop-tooling-F1-6 (Known limitations bullets false) | No | `docs/changes/release-loop-tooling.md` line 51 still says a started-with-no-end agent stays `running` forever and the idle check applies only to `--extra` agents; the sync now marks journey agents `stalled` (verified: echo-audit agent `stalled` at default, `running` at 60 min). Line 53 still says 390 px tables scroll inside their panel, which contradicts spec step 5.3 (cards). |
| Earlier B2 (stale detection) | Sync yes, page label no | Sync output correct; page label missing (failure 2) |
| Earlier B3 (390 px stacked cards) | No | Failure 4 |
| Branch `release-loop/release-loop-tooling-fix-r2` (fc60764) | Not in the tested commit | Not reviewed here; none of its effects are visible at 536aa29 |

## Observations (not failures)

- `scripts/create-test-member.mjs` still prints about 140 KB of Postgres NOTICE lines on stdout (exit code and creds file are correct).
- Spec J3 step 4 names agents by label (`validate:echo-audit:r1`); snapshot ids are `fx0NN`/`fxstale`; the labels match.

## Cleanup

API and preview servers stopped by PID file; database `sb_rl_val_10300_1` dropped. Scratch fixture left under `/var/tmp/sbpg/agents/val-10300-1/`.
