# Test result — release-intelligence, round 3 (re-test after fix RI-R1-7)

```json
{"feature":"release-intelligence","baseline":3,"specSha256":"eab62ec64606ee2a8f3346829c16d4cabf847408231eaf887f12dc4d0e407c4b","total":55,"passed":55,"failed":[],"blocked":[],"notRun":[],"preconditionsFailed":[]}
```

Feature: Release reconciliation, failed-run states and contribution intelligence trends
Training spec: `docs/training/release-intelligence.md`, pinned baseline v3 (`check` passed: "baselines match: release-intelligence v3"). Tested commit: `e28d2e1557ee9c1183aaa64dc0e366c4e6702032` (integration head, worktree reset to it, production build). Date: 2026-10-10.
Validator: val-5900-15. Chromium via Playwright, TZ=UTC, en-US, light scheme, fresh database + `npm run seed` + `scripts/create-test-member.mjs` per walkthrough (desktop and mobile each on their own fresh database), logged in through the login form as the platform admin, `/world` -> Journeys -> Release Intelligence reached by clicking or tapping, every fixture pasted through the UI as written. Desktop 1280x900; mobile 390x844 isMobile + hasTouch (taps).
Evidence: `/var/tmp/sbpg/release-loop/release-intelligence/round-3/` (`steps.jsonl`, `desktop-<id>.png`, `mobile-<id>.png`, `e1-run1.txt`, `e1-run2.txt`, `e1-snapshot.txt`, `mcp-parity.json`, `desktop-mcp-token-*.png`).

## Result

Baseline steps: 55 of 55 pass on every required surface (score tool output above, copied verbatim). Browser steps J1.1-J10.5 and E.2-E.5 pass on desktop and on mobile; E.1 passes on cli. No step failed, none blocked, none not run. The baseline version did not change since round 2 (still v3), so no diff table is needed; scores are like for like with round 2 (55/55).

`passed` is true: every baseline step passed, and the interface-parity MCP check that failed in round 2 now passes.

## Fix verification, by step id

| Fix | Steps / check | Result |
| --- | --- | --- |
| RI-R1-7 (MCP tools for every release-intelligence route) | no baseline step; interface-parity MCP check | **Verified fixed**, see below. Round 2's MCP_GAP is closed. |
| Earlier fixes (J1.2 entry point, RI-R1-1 importer exit code, RI-R1-3/4/5/6 mobile layout) | E.1, J1.2, all mobile steps | Still pass (whole baseline re-run). |

### MCP parity (Connected Agents token created in the UI; calls made over `/mcp` with the official SDK client)
- Admin token with `release.read` + `release.write`: `tools/list` contains all 17 release tools (`release_tracker_read` plus the 16 new ones).
- Reads match the API responses the UI uses (deep equality): release list (6 releases), release detail, failed runs (308), outputs, trends, config rules.
- Writes and refusals match the API: `release_create` with a bad key gives isError with the same 400 text as the route; a valid create succeeds and is visible in the API list; a duplicate create gives 409 as the route does; `release_approve` on an unreconciled release gives isError `409 release_not_reconciled: ... 1 gap remains` (same as the route and the UI alert in J10.5/J7.6); `release_failed_run_record` with an empty run gives 400 "Describe what failed"; `release_import_snapshot` with non-JSON gives isError 400; `release_config_save` with `maxSeries: 9` gives the same 400 text as J9.2.
- Scope and role: a token with only `release.read` can read but is refused on `release_create` (403 `scope_not_granted`); a member token (all scopes offered) is refused on both a read and a write tool (403 `forbidden`, administrators only).

## Failures

None.

## Page errors, console errors, failed requests

- No `pageerror` and no failed application request (`requestfailed`) on either surface.
- Expected refusals only, at their named steps: 400 on failed-run record and disposition (J4.3, J4.5), config save (J9.2-J9.4), release create (J10.1, J10.2), reopen without reason (J7.11), snapshot and document import errors (E.3, E.4); 409 on approve (J7.6, J10.5) and duplicate release (J10.5). The browser also echoes each of these as a console "Failed to load resource" line.
- Sandbox-blocked external requests (web fonts, `ERR_CERT_AUTHORITY_INVALID`, `ERR_TUNNEL_CONNECTION_FAILED`) logged as `external_blocked` or as the one console error the spec allows.

## Observations (not scored)

- Carried over from round 2, unchanged: round commit shas (`abc1234` etc.) render as plain text with no verify or "unverified" marker (B8); snapshots are still ingested by hand or `--snapshot`, classes are not guessed, Trends charts are categorical (B10). Awaiting owner answers.
- E.1: both importer runs exited 0. Run 1: 150 imported/updated lines, 63 `warning:` lines; run 2: no imported/updated lines, 151 `unchanged`, the same 63 warnings. `--snapshot snap.json --release 2030-02-09-harvest-board` exited 0. The importer prints Postgres `NOTICE ... already exists, skipping` blocks on every run (bootstrap migrations). They are harmless but noisy, and column names in them contain "updated", which can confuse a log grep.
- The MCP checks ran against the mobile-walkthrough database after the mobile run and created one extra release (`2030-05-01-mcp-pond`) there. That database is dropped.
- Housekeeping: server stopped via PID file, database `sb_rl_val_5900_15` dropped. Nothing committed; no product code, spec or baseline file changed.
