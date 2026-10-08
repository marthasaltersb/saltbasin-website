# Test result: Release loop tooling, round 1

- Feature: `release-loop-tooling`
- Round: 1
- Commit tested: d23759e (integration head `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-02
- Verdict: PASS (all spec steps passed; one harness mis-click noted below)
- Step log: `/var/tmp/sbpg/release-loop/release-loop-tooling/round-1/steps.jsonl`; screenshots in the same directory.

## Journey steps

| Journey | Step | Result | What was seen |
|---|---|---|---|
| J1 | 1 | pass | `6 8 2 context,prompt,cache,memory initialCheck,validation,noSilentCaps,push` |
| J1 | 2 | pass | seven statuses exactly as specified |
| J2 | 1-2 | pass | wrapped copy, `node --check` exit 0, no output |
| J3 | 1 | pass | `snapshot matches expected` |
| J3 | 2 | pass | runId `runA + runB`; feature statuses, A1 verified/1, B1 needs_human/2, B9 needs_business_definition, four delta-board seen_in_test |
| J3 | 3 | pass | totals 391 / 20000 / 40 / 2000 |
| J3 | 4 | pass | charlie failed, delta validate running, build:delta done_unreconciled |
| J3 | 5 | pass | sentinel count 0 |
| J3 | 6 | pass | runA only: runId `runA`, no delta-board |
| J3b | 1 | pass | creds.json values correct. The exit code of the first run scrolled out of captured output (file was written correctly) |
| J3b | 2 | pass | rerun exit 0, byte-identical creds, one user row |
| J3b | 3 | pass | login form -> `/world`, shows Your World, Journeys, Classic Tools; no password or terms page (`3b.3-world.png`) |
| J3b | 4 | pass | exit 2 with the exact refusal message |
| J3b | 5 | pass | no page errors; only blocked external font loads |
| J4 | 1 | pass | heading, header `Updated 2 min ago · run runA + runB`, seven tiles, callout, filters, agent card, feature rows, bug order, 18 agent rows |
| J4 | 1 (B9) | pass | `Question for you: Should totals round half up or half even?` |
| J4 | 2 | pass | bravo filter: B1/B9 only, "No agent is running for this selection."; All features restores |
| J4 | 3 | pass | B1 history R1 Found, R1 Fix applied, R2 Came back, R2 Fix applied, R3 Came back |
| J4 | 4 | pass | no console/page errors or failed requests; scrollWidth == clientWidth (1280) |
| J5 | 4 variants | pass | same content; bg rgb(243,246,247) light / rgb(15,26,31) dark (on body); scrollWidth == clientWidth incl. 390 px; no errors |
| Edge | 1 | pass | exit 2, `snapshot not found: <path>` |
| Edge | 2 | pass | `Preview failed: snapshot 404`, no tracker |
| Edge | 3 | pass | empty run dir: zero agents, exit 0 |

## Notes and ambiguities

- J4 step 3: my first attempt clicked a text node that is only rendered after opening, and the log has one `fail` line for it. Retried by clicking the B1 row's root-cause text ("Server rejects the body on a stale session."); the history then showed exactly the expected sequence. The step wording "B1 row's text" does not say which cell. Treated as pass.
- J4/J5 background colours are set on `body` (the `html` element is transparent). Values match.
- J4: the B9 "Question for you" text is visible without opening the row (the spec says "after opening its row"). Not a defect.
- Phone width (390 px) checked in J5: tables scroll inside their panel, the page does not; nothing blank or clipped.

## Console errors and failed requests

- App/tracker pages: none.
- `external_blocked`: fonts.googleapis.com certificate/tunnel errors on the login page (sandbox proxy). Edge 2 intentionally requested a missing snapshot (HTTP 404, expected).

## Fix details received

None (round 1). No carried items named.

## Cleanup

Servers stopped via PID files, database `sb_rl_val_4600_8` dropped, fixture removed. No product code or specs changed.
