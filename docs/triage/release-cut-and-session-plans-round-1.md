# Triage: release-cut-and-session-plans, round 1

Integration head checked: b46ad9a. Baseline v1. No code changed, no spec edited.

## Summary

Nine failing steps, two root causes. Neither is a product defect.

- **RC-1 (8 steps: J3.1, J3.4, J3.5, J7.8, J7.9, J7.11, J8.6, J8.7): spec_error.** The spec's fixture is the live, mutable `in-app-release-loop` feature, and it says that feature is "frozen at 60 of 60 on baseline v2" (spec, Journey 3 intro) with `round-3.md` as the report (J7.8). That stopped being true when `docs/test-results/in-app-release-loop/round-4.md` was filed (commit cea5b94: baseline 2, passed 59, total 60, failed E.1). `latestScore()` in `server/lib/releaseCut.js` (line ~157) deliberately picks the highest-numbered `round-N.md`, which is exactly what the change spec requires (read each feature's newest validated round). The product reports the true newest score, 59/60, with Missed. UI, API and MCP all agree with each other, which is the parity the spec is meant to prove. The validator's reading is correct.
- **RC-2 (J6.6): spec_error.** The command output sentence was lengthened by the later release-scope feature (`scripts/release-cut.mjs` line 110, commit 4841d2a; `docs/changes/release-scope.md`). Counts match the expected ones (1 of 2 delivered, 1 carried, 1 feature opened as carried).

The product matches the change spec and owner direction in both cases, so these go to the amendment reviewer, not a fix agent. Both amendments make the spec stop depending on mutable repository state (RC-1) or on one wording of a sentence that a later feature owns (RC-2).

Note for RC-1: the failing E.1 inside `in-app-release-loop` is a real finding of that feature's own loop, tracked there. Do not "fix" it here by editing round files.

## Reproduction

- Read `docs/test-results/in-app-release-loop/round-4.md`: JSON block has `"baseline": 2, "total": 60, "passed": 59`. `round-3.md` (60/60) is older.
- `latestScore()` sorts `round-(\d+).md` descending and parses `passed`/`total`/`baseline` from the first file. So `record merge` returns round 4, 59/60, report `round-4.md`. Matches every observed value in J3.1, J3.4, J3.5, J7.8, J7.9, J7.11, J8.6, J8.7. J3.4's re-estimate behavior (1 re-estimate, original kept, expected unchanged) passed as specified; only the actual number differs.
- Ran the J6.6 command output through reading `scripts/release-cut.mjs` line 110: the sentence is `Froze <v> at <commit>: <delivered>/<planned> planned delivered, <carried> carried, <backlog> in backlog, <addedAfterCut> added after the cut. Opened <v2> with N features (C carried, A new).` Observed text equals this exactly.

## Items

### T1-J3.1, T1-J3.4, T1-J3.5, T1-J7.8, T1-J7.9, T1-J7.11, T1-J8.6, T1-J8.7 (class spec_error, one root cause)

Show both: change spec (read each feature's newest validated round; "not validated" is never 0) versus the step (hardcodes one past score of a live feature). Proposed amendment, a single shared precondition plus per-step wording:

- Add **P.7**: "Read the newest `docs/test-results/in-app-release-loop/round-N.md` (highest N) and note `<IARL_ROUND>`, `<IARL_PASSED>`, `<IARL_TOTAL>`, `<IARL_BASELINE>` from its score block, and `<IARL_REPORT>` = `docs/test-results/in-app-release-loop/round-N.md`. Do not edit that file. `<IARL_LABEL>` is **Met** when `<IARL_PASSED>` is at least 60 and **Missed** otherwise (the steps expect 60 of 60)."
- J3.1: actual reads `<IARL_PASSED>/<IARL_TOTAL>` followed by the label `<IARL_LABEL>` (green Met or red Missed to match). guided-training-agent line unchanged.
- J3.4 and J3.5: same substitution for the actual part; expected values unchanged (60/60, 60/62). J3.5 label is Missed in every case because 60/62 can never be met.
- J7.8: result `{feature in-app-release-loop, round <IARL_ROUND>, passed <IARL_PASSED>, total <IARL_TOTAL>, baseline <IARL_BASELINE>, report <IARL_REPORT>}`.
- J7.9 and J8.7: `actual` is `<IARL_PASSED>/<IARL_TOTAL>` and `met` is true only when `<IARL_LABEL>` is Met.
- J7.11: item line actual `<IARL_PASSED>/<IARL_TOTAL>` with the matching label.
- J8.6: `passed <IARL_PASSED>, total <IARL_TOTAL>, baseline <IARL_BASELINE>`.

Traces to: `docs/changes/release-cut-and-session-plans.md` v1 (record merge reads the newest round's score block) and the release-scope change that left `in-app-release-loop` as a live feature. Why: the step's purpose is that the platform shows the real newest score and the right Met/Missed label across UI, API and MCP, which stays testable without freezing a live feature at a number that its own loop keeps changing. A stronger alternative for the reviewer: make P.6's fixture file hold a fictional feature for the UI journeys too, but that changes the open-release data the screens read, so it is a larger rewrite.

Files: `docs/training/release-cut-and-session-plans.md` (reviewer only), `docs/training/baselines/release-cut-and-session-plans/v1.json` (new v2 by the reviewer).
Recurrence: none (first round).

### T2-J6.6 (class spec_error)

Before: `Froze 1.0.0 at <HEAD7>: 1/2 delivered, 1 carried. Opened 1.1.0 with 1 features (1 carried, 0 new).`
After: `Froze 1.0.0 at <HEAD7>: 1/2 planned delivered, 1 carried, 0 in backlog, 0 added after the cut. Opened 1.1.0 with 1 features (1 carried, 0 new).`
Traces to: `docs/changes/release-scope.md` (planned / backlog / added-after-cut counts in the cut output; owner direction 2026-10-10). Why: the sentence is owned by the release-scope feature and the counts in it are what this step proves.

## Validator observations

- B3 parity and B7 durable store verified, no action.
- **B8 (no screen calls the session report): no new step.** `docs/changes/release-cut-and-session-plans.md` line 57 records it as a stated, deliberate limitation (per-item lines on each card instead of a table; report via API and MCP). Existing steps cover the report through J7.9/E.6 and J8.7. If the owner wants a report table on screen, that is a new capability for a later feature, not a coverage gap in this spec.
- **Stale red alerts accumulating on the Session plans tab, and the fixed red banner covering the Close button on the phone: worth a step, coverage_gap.** The owner's error convention (CLAUDE.md Frontend conventions) and the mobile requirement make it a real defect risk, but the baseline has no step that sees it. Proposed new step under Journey 3 (after J3.4), `[J3.6]`: "Click Record merge for S-garden-01 after the earlier refusal, then at 390px check the card. Expect the earlier red alert to be gone (only the latest message is shown, and none after a successful save) and the buttons Record merge, Close session fully visible and tappable." Traces to: owner direction 2026-10-10 on member-facing errors and interface parity (MOBILE_GAP). Add as an amendment; a fix agent then clears the alert on a successful action and keeps it out of the card's tap area. This is flagged, not yet proven as a product defect in the current spec, because no step asserts it.
- **MCP address shown as the Vite dev origin: nothing.** Environment (dev server origin); the spec uses `<API_BASE>`. Production serves the real origin.
- **outOfScope true on the backlog feature not shown on the card: nothing.** Expected (`session-plan.mjs` marks it; the card does not need to).
- Everything else (shared machine slowness, discarded attempts): environment noise, no action.
