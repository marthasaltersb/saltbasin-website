# Test result — session-mapping — round 1

Feature: After-session context / prompt / cache / memory mapping with token, spend and time trends
Commit tested: 6df04dc959a85eb094573e5b4354d331c03c9412 (integration head `claude/zealous-meitner-5tuft5`)
Validator: val-5900-3 (database `sb_rl_val_5900_3`, API port 5906, production build served by `node server/index.js` with NODE_ENV=production)

```json
{
  "feature": "session-mapping",
  "baseline": 1,
  "specSha256": "1adb496f20fe354930c1c9c25e7e426c32f16430778fd73c2132699a8a2bc4db",
  "total": 56,
  "passed": 56,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Baseline check: `baselines match: session-mapping v1` (no diff table needed; the baseline version did not change).

## Result

All 56 baseline steps passed on every required surface (desktop 1280x900, phone 390x844 touch, cli, setup). Interface parity is NOT met: one failure, MCP_GAP (below). `passed` is therefore false.

Run method: Chromium via Playwright, logged in through the login form as the admin, clicked World -> Journeys -> Sessions, then followed the spec in order. The whole spec was run twice, each on a fresh database with freshly written fixtures (desktop, then phone with isMobile + hasTouch, tapping; the phone slider step used real touch drags through CDP touch events). CLI steps were logged once as surface `cli` (desktop run) and re-executed in the phone run to keep numbers identical (`cli-mobile-rerun.jsonl`, all passed). Screenshots: `/var/tmp/sbpg/release-loop/session-mapping/round-1/` (`desktop-<id>.png`, `mobile-<id>.png`). Step log: `steps.jsonl` in that folder.

Validator-side note: two earlier desktop attempts in this round were discarded and re-run from a fresh database because my own text matcher was too strict (it did not allow the on-screen colon in "Input tokens: 150", and picked the wrong card container in J4.2). The product text was correct each time; the logged run is the third, clean run.

## Failures

1. MCP_GAP: the platform MCP server exists (`/mcp`, `server/lib/mcpToolRegistry.js`) but has no Sessions tool. `grep session_mapping` over `server/lib/mcpToolRegistry.js`, `server/data/mcpToolManifest.json` and `server/lib/capabilityParity.js` finds nothing. None of the six planned tools exist: `session_mapping_config`, `session_mapping_sessions`, `session_mapping_trends`, `session_mapping_proposals`, `session_mapping_import`, `session_mapping_failures`. The UI calls these API routes (from the network log) with no MCP equivalent: `GET/PUT/DELETE /api/session-mapping/config`, `GET /sessions`, `GET /sessions/:id`, `GET /trends`, `GET /proposals`, `POST /proposals/:id/reject`, `POST /proposals/:id/apply`, `POST /import/transcript`, `POST /import/metrics`, `POST /import/scan`, `GET /failures`, `PUT /failures/:id/disposition`. This is the still-open bug session-mapping-B5. It maps to no baseline step (the spec says "No step below depends on MCP"), so it is outside the score.

## Fix verification (open bugs handed over)

- session-mapping-B5 (MCP parity): NOT fixed. See failure above.
- session-mapping-B7 (classic admin-menu entry point): NOT fixed. `server/db.js:3335` still seeds the `plm` -> `Sessions` nav entry and `src/components/admin/AdminShell.jsx:126` still lists it. The frozen spec still documents "Also reachable from Classic Tools -> Platform Lifecycle Management -> Sessions". No baseline step covers it (the World Shell route, J1.1-J1.4, passes).
- session-mapping-B8 (SessionEnd hook files directly to the database): NOT fixed. Baseline steps J7.1, J7.2, J8.4 and J8.5 pass (hook installed, never blocks, silent on success, failures go to `hook-failures.jsonl`). But with `DATABASE_URL` unset, `node scripts/analyze-session.mjs --hook < hook-ok.json` prints `analyze-session failed (...): DATABASE_URL is not set. Add it to .env (see DEPLOY.md).`, exits 0, writes a failure line and captures nothing. No `.env` exists in the checkout (only `.env.example`), so a default dev environment captures nothing automatically. No baseline step covers it.

## Step table

| Step | desktop | mobile | cli | setup |
| --- | --- | --- | --- | --- |
| P.1, P.2, P.3 | | | | pass |
| J1.1-J1.5 | pass | pass | | |
| J2.1-J2.2 | pass | pass | | |
| J3.1-J3.5 | pass | pass | | |
| J4.1-J4.7 | pass | pass | | |
| J5.1-J5.5 | pass | pass | | |
| J6.1-J6.4 | pass | pass | | |
| J7.1, J7.2 | | | pass | |
| J7.3-J7.7 | pass | pass | | |
| J8.1-J8.5 | | | pass | |
| J9.1 | | | pass | |
| J9.2, J9.3 | pass | pass | | |
| J10.1-J10.4 | | | pass | |
| E.1-E.8 | pass | pass | | |
| E.9 | | | pass | |

## Observations (outside the baseline, not scored)

1. Wording: J3.4 lists "Input tokens **150**" but the screen shows "Input tokens: 150" (colon); same for the other labelled values. Judged equivalent and passed. Proposed amendment wording: "Input tokens: **150**".
2. Settings inputs have accessible names that differ from the visible labels (visible "Idle gap that is not work (minutes)" versus `aria-label="Idle gap minutes"`; "Transcripts folder on the server (blank = default)" versus `aria-label="Transcripts folder"`; thresholds and price rows similar). Voice-control and screen-reader users who say the visible label will not match (WCAG label-in-name). Low severity.
3. Every expected HTTP 400 (J4.4, J7.5, E.1-E.4, E.6-E.8) produced a browser console "Failed to load resource: 400" line; no other console error or page error occurred. One `requestfailed` (`net::ERR_ABORTED`, `/api/config/admin-nav`) appears in `steps.jsonl` at J1.1: it is the validator's own `goto('/world')` cancelling an in-flight request right after sign-in, not a product defect.
4. Sandbox noise only: Google Fonts and the cdnjs three.js CDN (`ERR_CERT_AUTHORITY_INVALID`, `ERR_TUNNEL_CONNECTION_FAILED`), logged in `noise.jsonl`.
5. J4.6 "Mark applied" completed with no category-gate dialog showing.
6. Housekeeping: the server was stopped by PID file and database `sb_rl_val_5900_3` was dropped. `server/data/sessionMapping/hook-failures.jsonl` created during the B8 probe was deleted (git-ignored). The worktree has no uncommitted changes.
