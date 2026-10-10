# Test result — release-intelligence, round 2 (re-test after fix round)

```json
{"feature":"release-intelligence","baseline":3,"specSha256":"eab62ec64606ee2a8f3346829c16d4cabf847408231eaf887f12dc4d0e407c4b","total":55,"passed":55,"failed":[],"blocked":[],"notRun":[],"preconditionsFailed":[]}
```

Feature: Release reconciliation, failed-run states and contribution intelligence trends
Training spec: `docs/training/release-intelligence.md`, pinned baseline v3 (`check` passed: "baselines match: release-intelligence v3"). Tested commit: `0800b1c` (integration head, worktree reset to it, production build). Date: 2026-10-10.
Validator: val-5900-1. Chromium (pinned) via Playwright, TZ=UTC, en-US, light scheme, fresh database + `npm run seed` + `scripts/create-test-member.mjs` per walkthrough (desktop and mobile each on their own fresh database), logged in through the login form as the platform admin, `/world` -> Journeys -> Release Intelligence reached by clicking or tapping, every fixture pasted through the UI as written. Desktop 1280x900; mobile 390x844 isMobile + hasTouch (taps).
Evidence: `/var/tmp/sbpg/release-loop/release-intelligence/round-2/` (`steps.jsonl`, `desktop-<id>.png`, `mobile-<id>.png`, `e1-run1.txt`, `e1-run2.txt`, `mcp-release-list.json`, `desktop-mcp-token.png`).

## Result

Baseline steps: 55 of 55 pass on every required surface (score tool output above). Browser steps J1.1-J10.5, E.2-E.5 (54) pass on both desktop and mobile; E.1 passes on cli. Every step also carried an automatic layout probe (no content outside its card, no page overflow, no horizontal scroll); none tripped on either surface.

Overall `passed` is reported false only because of the interface-parity MCP_GAP below, which no baseline step covers.

## Baseline diff (v2 -> v3, amendment A2)

Comparable 54; same: all 54 previous ids (J1.1, J2.1-J10.5, E.1-E.5), changed: none, retired: none, added: **J1.2** (Classic Tools holds no Release Intelligence). Scores are therefore read like for like for the 54 same steps; J1.2 is new.

## Fix verification, by step id

| Bug | Step | Result |
| --- | --- | --- |
| B7 second admin-nav entry point | J1.2 | **Verified fixed.** Desktop: Classic Tools -> Platform Lifecycle Management lists no Release Intelligence; mobile: page has no such text. `desktop-J1.2.png`, `mobile-J1.2.png`. |
| RI-R1-1 importer exit code | E.1 | **Verified fixed.** Run 1 exit 0 (123 imported/updated lines, 46 `warning:` lines), run 2 exit 0 (124 `unchanged`, no imported/updated lines, same warnings); `--snapshot ... --release 2030-02-09-harvest-board` exit 0. |
| RI-R1-3 inputs overflow at 390px | J2.1, J2.2, J3.2-J3.4, J4.1-J4.4, J5.1, J5.3, J6.1, J7.1-J7.12, J8.1, J9.1-J9.5, J9.7, J10.3, J10.4, E.2, E.4 | **Verified fixed** (mobile pass, layout probe clean). |
| RI-R1-4 tables escape the card | J3.1, J4.1-J4.6, J5.2, J6.2, J6.3, J7.5, J7.8, J10.1, J10.2, J10.5, E.3, E.5 | **Verified fixed** (mobile pass, layout probe clean). |
| RI-R1-5 Trends charts/grids force wide columns | J8.2-J8.6, J9.6 | **Verified fixed** (`mobile-J8.3.png`: charts fit the card). |
| RI-R1-6 card shifted left / heading cut | J4.5, J4.6, J6.3, E.3 | **Verified fixed.** |
| B8 (commit reconciliation), B10 (known limitations) | J3.3, J3.4; J8.2, J8.3, E.1 | Needs business definition (unchanged). Steps pass as frozen; see observations. |
| RI-R1-2, RI-R1-9, F1-3 | E.1 surface tag, single entry point | Addressed by amendments (E.1 now cli, J1.2 added). |
| RI-R1-7 / F1-4 MCP surface | none | **Still open**, see failure below. |

## Failures

- **MCP_GAP (no baseline step).** `server/lib/mcpToolRegistry.js` now exists and the platform MCP endpoint works (token created in the UI on Journeys -> Connected Agents with scope `release.read`; `tools/list` returned `release_tracker_read`). `release_tracker_read` (list, and detail with `releaseId`) matches the release list on the Releases tab (same keys, names, dates, gap counts, failed-run counts). Capabilities this feature exercises with **no** MCP tool: import document, import tracker snapshot, create release record, add feature to release, approve and reopen reconciliation, list/record/dispose failed runs, list/link outputs, read trends, read/save/reset settings.

## Page errors, console errors, failed requests

- No `pageerror` and no failed application request on either surface.
- Expected refusals only, at their named steps: 400 on failed-run disposition (J4.5), config save (J9.2-J9.4), release create (J10.1, J10.2), reopen without reason (J7.11); 409 on approve (J7.6, J10.5) and duplicate release (J10.5).
- Sandbox-blocked external requests (Google Fonts, `ERR_CERT_AUTHORITY_INVALID`) logged as `external_blocked`.

## Observations (not scored)

- B8: round commit shas (`abc1234` etc.) still render as plain text with no verify check or "unverified" marker; `releaseReconcile.js` stores `commitSha` only. Awaiting the owner's rule.
- B10: snapshots are still ingested by hand or `--snapshot`; classes are not guessed; Trends charts are categorical (equal spacing, date labels). Awaiting owner answers.
- `server/db.js` still seeds a `release-intelligence` nav row (line ~3327); Classic Tools hides it, and J1.2 passes, so no second entry point is visible.
- E.1: both importer runs read 126 files with 0 errors; the 46 warnings are for repo docs lacking a version line, Traces-to section or result.
- Housekeeping: my `e1.sh` helper wrote `e1-run1.txt`/`e1-run2.txt` into the round-1 evidence folder, overwriting round 1's copies (copied into round 2 as well). An earlier desktop run was started concurrently with a database reset by mistake and killed; its results were discarded and `steps.jsonl` cleared before the recorded runs. Server stopped via PID file and database `sb_rl_val_5900_1` dropped.
