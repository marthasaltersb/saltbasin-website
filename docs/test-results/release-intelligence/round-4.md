# Test result — release-intelligence, round 4 (re-test of the whole baseline)

```json
{"feature":"release-intelligence","baseline":3,"specSha256":"eab62ec64606ee2a8f3346829c16d4cabf847408231eaf887f12dc4d0e407c4b","total":55,"passed":54,"failed":["E.1"],"blocked":[],"notRun":[],"preconditionsFailed":[]}
```

Feature: Release reconciliation, failed-run states and contribution intelligence trends
Training spec: `docs/training/release-intelligence.md`, pinned baseline v3 (`check`: "baselines match: release-intelligence v3"). Baseline did not change since round 3, so no diff table; scores are like for like with round 3 (55/55).
Tested commit: `c738308` (integration head, worktree reset to it, production build). Date: 2026-10-10. Validator: val-5900-1.
Method: Chromium via Playwright, TZ=UTC, en-US, light, fresh database + `npm run seed` + `scripts/create-test-member.mjs` per walkthrough (desktop 1280x900 and mobile 390x844 isMobile+hasTouch, each on its own fresh database). Logged in through the login form as the platform admin, reached `/world` -> Journeys -> Release Intelligence by clicking/tapping, all fixtures pasted through the UI.
Evidence: `/var/tmp/sbpg/release-loop/release-intelligence/round-4/` (`steps.jsonl`, `desktop-<id>.png`, `mobile-<id>.png`, `e1-run1.txt`, `e1-run2.txt`, `e1-snapshot.txt`, `desktop-mcp-token.png`).

## Result

54 of 55 baseline steps pass. **E.1 fails (cli).** All J1.1-J10.5 and E.2-E.5 pass on desktop and mobile. `passed` = false.

## Failures

### E.1 (cli): importer exits 1 on the repository's own docs
- Expected: `node scripts/import-release-logs.mjs` run twice exits 0; run 1 prints imported lines, run 2 only `unchanged`; `warning:` lines for documents missing a version or Traces-to.
- Observed: idempotence and warnings are correct (run 1: 169 imported lines, 92 warnings; run 2: 165 unchanged, 0 imported/updated, same 92 warnings; `--snapshot ... --release 2030-02-09-harvest-board` exit 0). But **both runs exit 1** because three files in `docs/release-log/` are treated as release logs and refused for having no `Date:` header: `docs/release-log/HANDOVER-0.3.0.md`, `docs/release-log/releases/0.2.0/release-tracker.md`, `docs/release-log/releases/0.2.0/updates.md` (added by the 0.2.0 release cut, commit 7d76341). The refusal itself is correct E.3 behaviour; the failure is that the repo now contains non-log files in the release-log folder, so the literal step "exits 0" cannot hold. Round 3 passed E.1 before these files existed.
- Suggested handling (not applied): add these files to the "Generated files skipped on import" setting / importer skip list, or an amendment clarifying the exit code when documents are refused.
- Evidence: `e1-run1.txt`, `e1-run2.txt`.

## Fix verification, by step id

| Bug | Step | Result |
| --- | --- | --- |
| release-intelligence-F1-3 / RI-R1-9 (single entry point) | J1.1, J1.2 | Verified. J1.2 exists in v3 (amendment A2) and passes: Classic Tools -> Platform Lifecycle Management tabs (Operating Model Dashboard, Backlog, Feedback, QA, Content Manager, Release Tracker, Render Bindings) contain no Release Intelligence; 390px page has no such text. |
| release-intelligence-F1-4 (MCP surface) | no baseline step | Verified. See MCP parity. |
| release-intelligence-F1-5 (390px layout, six tabs) | all mobile steps | Verified. Every tab walked at 390px, no panel or page horizontal overflow (automatic check on each step plus screenshots). |
| release-intelligence-F1-7 (owner questions) | none | Not testable; still awaiting owner answers. |

## MCP parity
Admin token created in the UI (World Shell -> Journeys -> Connected Agents, scopes release.read + release.write), calls over `/mcp` with the official SDK client. `tools/list` contains all 17 release tools listed in `capabilityParity.js`. Reads (list and detail, failed runs, outputs, trends, config) deep-equal the API responses. Refusals match the UI/API text: bad key 400, duplicate 409, approve unreconciled 409 "1 gap remains", empty failed run 400, non-JSON snapshot 400, `maxSeries: 9` 400. Valid `release_create` visible in the API list. No MCP_GAP.

## Errors and failed requests
- No `pageerror`, no `requestfailed` for application requests. External font/CDN failures logged as `external_blocked` or the allowed console error.
- 400/409 responses only at the steps naming them, plus the intentional MCP refusals.

## Observations (not scored)
- Spec text "Set by betsy@test.local" was checked against the fixed test admin `admin@test.local`.
- J8.4 on mobile: Home / ArrowRight were sent via keyboard after focusing the slider (no touch equivalent in the step).
- Commit shas render as plain text without a verified marker (B8); snapshots ingested by hand; Trends charts categorical (B10). Owner answers and second-reviewer approval remain open (F1-7).
- Importer prints Postgres NOTICE blocks on every run; noisy but harmless.
- Connected Agents shows the MCP address from APP_BASE_URL (`localhost:5173` here), not the real host:port.
- Housekeeping: server stopped via PID file, database dropped, nothing committed, no product code, spec or baseline changed.
