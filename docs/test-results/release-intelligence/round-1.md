# Test result — release-intelligence, round 1 (re-test after fix round)

```json
{"feature":"release-intelligence","baseline":1,"specSha256":"77be12c9a16726bfa67075a79bc3008eca265f968c6f9b68f6acf5b540627101","total":54,"passed":1,"notRun":[]}
```

Feature: Release reconciliation, failed-run states and contribution intelligence trends
Training spec: `docs/training/release-intelligence.md`, pinned baseline v1 (`node scripts/release-spec-baseline.mjs check` passed: "baselines match: release-intelligence v1"). Baseline did not change since the last round, so no diff table is needed.
Tested commit: `c3a71b4` (integration head `claude/zealous-meitner-5tuft5`, worktree reset to it). Date: 2026-10-09.
Validator: val-5900-1 · Chromium (pinned) via Playwright, TZ=UTC, en-US, light scheme, fresh database + `npm run seed` + `scripts/create-test-member.mjs` per surface walkthrough, production build served on port 5902, logged in through the login form as the platform admin (`betsy@test.local`), navigated `/world` -> Journeys -> Release Intelligence by clicking/tapping, every fixture pasted through the UI as written. Desktop 1280x900; mobile 390x844 with isMobile + hasTouch (taps).
Evidence: `/var/tmp/sbpg/release-loop/release-intelligence/round-1/` (`steps.jsonl`, `desktop-<id>.png`, `mobile-<id>.png`, `mobile-<id>-full.png` for every mobile layout failure, `e1-run1.txt`, `e1-run2.txt`).

## Result: FAIL — 1 of 54 baseline steps passed on every required surface

Every step's functional expectations (all counts, gap lines, tooltips, alerts, history order) matched on BOTH surfaces. The score is low for two reasons only:

1. **Desktop: 53 of 53 browser steps pass** (J1.1-J10.5, E.2-E.5), including the layout check (no content outside the card, no page overflow).
2. **Mobile (390px): 52 of 53 browser steps fail the regression-gate "clipped / unreadable screen" rule**, although the text of every Expect matched. Only J1.1 (empty state) is clean. The panel's content is wider than its card, so inputs, tables and charts poke out of or are cut off by the white card, and on several tabs the whole card is shifted left (its left edge at -23 to -71 px, heading cut off). Seen on every tab: Releases list (table 530-577px wide in a ~340px card), release detail (Approval note input 320px wide, Features table 573-641px), Failed runs (What failed input 320px, table 493-604px), Outputs (table 808px), Import (Document path input 380px), Trends (charts 420-462px, card shifted), Settings (every input pokes ~30px past the card edge). Screenshots: `mobile-J2.1.png`, `mobile-J3.3.png`, `mobile-J8.3.png`, `mobile-J9.1.png` and the `-full.png` of each. This is the same defect the previous round recorded as P.5 (release detail clipped at 390px) — it was never fixed and is much wider than that one screen.
3. **E.1 fails**: the importer script exits 1, not 0 (see below).

| Journey | Desktop | Mobile (functional) | Mobile (layout) |
| --- | --- | --- | --- |
| J1 Open screen, empty state | pass | pass | pass |
| J2 Import, idempotent re-import | pass | pass | FAIL clipped |
| J3 Release record, features, reconciliation | pass | pass | FAIL clipped |
| J4 Failed runs list/filter/record/dispose | pass | pass | FAIL clipped |
| J5 Tracker snapshot | pass | pass | FAIL clipped |
| J6 Outputs unattributed -> linked | pass | pass | FAIL clipped |
| J7 Reconcile, approve, reopen, history | pass | pass | FAIL clipped |
| J8 Trends | pass | pass | FAIL clipped |
| J9 Settings | pass | pass | FAIL clipped |
| J10 Hand-made release record | pass | pass | FAIL clipped |
| E.1 importer script | FAIL exit 1 | FAIL | FAIL |
| E.2-E.5 | pass | pass | FAIL clipped |

## Failures

- **J2.1-J10.5, E.2-E.5 on mobile (52 step ids), layout.** Expected: no clipped, cut-off or overflowing content at 390px. Observed: see item 2 above; per-step overflow detail is in `steps.jsonl` (`seen` field) and the `-full.png` screenshots. Suggested class: rendering defect (one shared cause: fixed min-widths on inputs/tables/charts in `ReleaseIntelligencePanel.jsx` and `releaseCharts.js` inside a card that does not scroll or wrap), recurrence of the previous round's P.5.
- **E.1 — importer script exit code.** `node scripts/import-release-logs.mjs` twice on one database: run 1 printed 63 `imported`/`updated` lines and 25 `warning:` lines; run 2 printed 64 `unchanged` lines, no imported/updated lines, warnings again. Both runs exit 1 ("Read 66 file(s); 2 error(s)") because `docs/release-log/release-tracker.md` and `docs/release-log/updates.md` have no `Date:` header and are refused with a message (correct per E.3, never silent). The spec says exit 0. Either the two documents or the spec's exit-code wording needs a decision (proposed amendment: "exits 0 unless a document is refused, in which case it exits 1 and names it"). `--snapshot <file> --release <key>` filed the snapshot, exit 0. Note E.1 is a terminal step the baseline lists as desktop+mobile; it was run once in bash and the result recorded on cli, desktop and mobile. Proposed amendment: re-tag E.1 as a `cli` surface step.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist. Capabilities this feature exercises through UI/API with no MCP tool: import document, import snapshot, list/open/create release, add feature, approve/reopen release, list/record/dispose failed runs, list/link outputs, read trends, read/save/reset settings.
- **API routes the UI used** (browser network log): `GET /api/release-intelligence/{releases,releases/:id,failed-runs,outputs,trends,config}`, `POST .../import/document`, `POST .../import/snapshot`, `POST .../releases`, `POST .../releases/:id/features`, `POST .../releases/:id/approve`, `POST .../releases/:id/reopen`, `POST .../failed-runs`, `PUT .../failed-runs/:id/disposition`, `PUT .../outputs/:id/release`, `PUT .../config`, `DELETE .../config`.

## Fix verification (bugs from the earlier session)

| Bug | Baseline step | Status on `c3a71b4` |
| --- | --- | --- |
| release-intelligence-B7 (second admin-nav entry point) | none covers it (the "Where things are" prose, hashed, still says "Also reachable from Classic Tools"); nearest J1.1 | **not fixed.** Classic Tools -> Platform Lifecycle Management still lists Release Intelligence (`AdminShell.jsx` lines 73/122, `server/db.js` line 3326 unchanged). `observation-B7-classic-tools.png`. Recurrence of B7. |
| release-intelligence-B8 (commit reconciliation) | J3.3 / J3.4 | **not fixed.** Round commits `abc1234`, `def5678`, `1112223` render as plain text with no check line, no gap and no "unverified" marker; `releaseReconcile.js` has no commit check. Recurrence of B8. |
| release-intelligence-B10 (known limitations) | J8.2 / J8.3, E.1 | **not fixed.** Snapshots are still only imported by hand or `--snapshot`; classes are not guessed; trend charts are categorical (equal spacing, date labels). Recurrence of B10. |

None of the files listed for B7/B8/B10 changed in the tested commit's history beyond the state commit.

## Page errors, console errors, failed requests

- No `pageerror` events and no failed application requests (`requestfailed`) on either surface.
- Expected refusals only, each at its named step: 400 on failed-runs create (J4.3), disposition (J4.5), release create (J10.1, J10.2), config save (J9.2-J9.4), import errors (E.3, E.4); 409 on approve (J7.6, J10.5), and one reopen-without-reason 400 (J7.11).
- External blocked by the sandbox: Google Fonts (`ERR_CERT_AUTHORITY_INVALID`) and the cdnjs three.js script (`ERR_TUNNEL_CONNECTION_FAILED`), with their matching generic "Failed to load resource" console lines.

## Observations (outside any baseline step, not scored)

- Logging in lands directly on `/world`; the terms dialog did not appear because `create-test-member.mjs` pre-accepts both terms.
- The Import tab has an extra card "Import repository docs" that no step covers.
- J4.1 list ordering: the newest recorded run is listed first, and a log row with status "Resolved" is pre-set to disposition `reconciled` (matches J4.2's expectation).
- Two harness races were fixed on my side (reading text before a tab's data arrived, and a selector quoting error); all results above come from the final runs.

## Cleanup

Server stopped via PID file, database `sb_rl_val_5900_1` dropped. Nothing committed or pushed; no product code, spec or baseline changed.
