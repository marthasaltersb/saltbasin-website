# Test result — release-intelligence, round 1

Feature: Release reconciliation, failed-run states and contribution intelligence trends
Training spec: `docs/training/release-intelligence.md` (v1) · Tested commit: `a207b2148f7838e35b3a6699460eb3ea2795ace1` (integration head, worktree reset to it)
Validator: browser agent val-8900-1 · Chromium via Playwright, fresh database, production build served on port 8902, logged in through the login form as the platform admin, navigated from `/world` -> Journeys -> Release Intelligence, all fixtures pasted through the UI as written.
Evidence: `/var/tmp/sbpg/release-loop/release-intelligence/round-1/` (screenshots, `steps.jsonl`).

## Result: FAIL — 69 of 74 checks passed

| Journey | Result |
| --- | --- |
| J1 Open screen, empty state | 2/2 pass |
| J2 Import, idempotent re-import | 2/2 pass |
| J3 Release record, features, reconciliation | 6/6 pass |
| J4 Failed runs: list, filter, record, dispose | 6/6 pass |
| J5 Tracker snapshot: tokens, time, usage-limit agent | 3/3 pass |
| J6 Outputs unattributed -> linked | 3/3 pass |
| J7 Reconcile, approve, reopen, history | 12/12 pass |
| J8 Trends | 12/12 pass (see harness note) |
| J9 Settings | 7/7 pass |
| J10 Hand-made release record | 5/5 pass |
| Edge cases (skipped docs, refused log, bad snapshot, repo import) | 7/8 pass |
| Phone width 390px | 4/5 pass |
| Carried bugs B7, B8, B10 | 0/3 — all still open |

Every "Expect" text in J1-J10 matched exactly (counts, gap lines, token and minute figures, tooltips, history order, error alerts).

## Failures

1. **PHONE P.5 — release detail clipped at 390px (new, rendering).** On Releases -> Open, the Features table is 584px wide and the "Approval or reopen note" input is 320px wide inside a card about 342px wide. Both spill past the white card's right edge over the dark background; the "Validation rounds" column is cut off and is reachable only by scrolling an outer wrapper horizontally. The Trends, Releases list and Failed runs tabs had no page-level horizontal overflow. Screenshot: `PHONE-release-full.png`. Regression-gate rule: clipped content is a failure.
2. **EDGE E.8 — importer script exit code.** `node scripts/import-release-logs.mjs` twice against the same database: the second run printed only `unchanged` (51 files, idempotent) but exited 1 with "Read 52 file(s); 1 error(s)". Cause: the repository's own `docs/release-log/release-tracker.md` has no `Date:`, so it is refused with a message (not silent). The spec states it exits 0. Either the spec or that document needs to change. Also, the first-boot database notices print about 660 lines of Postgres NOTICE output into this script's output, which buries the status lines (not a spec step).
3. **B7 — second entry point (still open).** `AdminShell.jsx` (`TAB_COMPONENTS` line 73, `FALLBACK_ADMIN_NAV` line 122) and `server/db.js` line 3326 still add `release-intelligence`. The `admin_nav` row on the fresh database contains it, and spec line 8 still says "Also reachable from Classic Tools". Nothing has changed since the bug was filed. Recurrence of release-intelligence-B7.
4. **B8 — commits not reconciled (still open).** J3 shows round commits `abc1234`, `def5678`, `1112223` (none are real commits) with no check line, no gap and no "unverified" flag. `releaseReconcile.js` has no commit check, `import-release-logs.mjs` has no git pass, and the spec has no step for it. Recurrence of release-intelligence-B8. Triage note: this needs a business decision (what counts as a known commit) before a spec step can be written; not guessed here.
5. **B10 — known limitations (still open).** Tracker snapshots are only imported by hand or with `--snapshot`; there is no automatic ingest from `release-tracker-sync` output. Failure classes are not guessed (rows stay `unclassified` until a reviewer sets one). Charts are categorical with equal spacing and date labels, not time-scaled. Recurrence of release-intelligence-B10; owner decision whether this is acceptable.

## Harness notes (not product failures)

- 8.2c and 8.3c were first logged as fail by my own script (chart titles render upper-case through CSS, so a case-sensitive text match missed them; the "no bar for release C" check counted the category hover title). Re-checked: each chart has one SVG with one value axis and the three dates; release C has no failure-class bar. Both are logged as pass in `steps.jsonl`.
- `steps.jsonl` also contains a few lines from an earlier attempt (port 4406, step "HARNESS err"); ignore those.

## Page errors, console errors, failed requests

- No `pageerror` events.
- Expected refusals only, each at its named step: 400 on failed-runs create (4.3), disposition (4.5), reopen without note (7.11), config save (9.2-9.4), release create (10.1, 10.2), import errors (edge cases); 409 on approve (7.6, 10.5) and duplicate release create (10.5).
- External blocked (sandbox): Google Fonts (`ERR_CERT_AUTHORITY_INVALID`) and a cdnjs script (`ERR_TUNNEL_CONNECTION_FAILED`).
- `ERR_ABORTED` on `/api/commercial-opportunities/*`, `/api/publication-pipelines/*`, `/api/config-envelopes/*` once per script run when the browser closed while the World Shell was still loading its other islands. These are cancellations at teardown, not failures of this feature.

## Fix verification

| Bug | Status |
| --- | --- |
| release-intelligence-B7 | not fixed (recurrenceOf release-intelligence-B7) |
| release-intelligence-B8 | not fixed (recurrenceOf release-intelligence-B8) |
| release-intelligence-B10 | not fixed (recurrenceOf release-intelligence-B10) |

The three bugs' listed files show no change on the tested commit.

## Cleanup

Server stopped via PID file, database `sb_rl_val_8900_1` dropped. Nothing committed or pushed; no product code or spec changed.
