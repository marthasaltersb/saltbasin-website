# Test result: journey-flow-experience-mapping, round 2

Feature: Journey flow to experience: each shape captures gates, variants, actors, decisions, capabilities, authorities and system, and maps to the user experience asset
Round: 2 (validation after fixes, fresh database + seed per surface pass)
Commit tested: be2b5032f9c8dbd83692849b1c0d2122a31fb124 (integration head `claude/zealous-meitner-5tuft5`)
Date: 2026-10-11

## Score (from `scripts/release-spec-baseline.mjs score`)

```json
{
  "feature": "journey-flow-experience-mapping",
  "baseline": 1,
  "specSha256": "dcda6c46b487e91cff080e2c332822f810a6b7bac2d899e78d01e4e1af674f94",
  "total": 58,
  "passed": 58,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Baseline check passed (`baselines match: journey-flow-experience-mapping v1`). Baseline version unchanged since round 1 (v1, same sha), so scores compare like for like (round 1: 57 of 58, J10.4 failed). Result: PASSED (58 of 58).

## Method

Chromium via Playwright, two contexts (MEMBER WINDOW member@test.local, ADMIN WINDOW admin@test.local), signed in through the login form, navigated by clicking from `/world`. Two full walkthroughs on separate fresh databases and fresh seeds: desktop 1280x900 (click) and phone 390x844 (isMobile, hasTouch, tap); Journey 10 on desktop run at 390px wide. Command-line steps (J9.x) used curl and `scripts/mcp-call.mjs` with a token created in the UI (J9.1); J6.2 opened `/api/journey-rods/me/world` as the spec says. No API, script or database edit performed any browser step. Test accounts from `scripts/create-test-member.mjs` only. Evidence: `/var/tmp/sbpg/release-loop/journey-flow-experience-mapping/round-2/` (`steps.jsonl`, screenshots `<surface>-<id>.png`).

## Fix by fix

- journey-flow-experience-mapping-T1 (Experience map table at 390px): PASS. J10.4 passes on desktop-at-390px and mobile: the table box scrolls inside itself (box scrollWidth 828 vs clientWidth 286, overflow-x auto), page does not scroll sideways, and the screenshot `desktop-J10.4-table.png` shows readable headings and pills (no letter-by-letter breaking).
- journey-flow-experience-mapping-B12 (test-run starter recorded as every actor role): no baseline step covers it. J6.1 still passes (test journey starts at `f<ID>_stock_check`, listed under Your test journeys), and the journey impact panel now shows the line "Test runs: whoever starts a test run is recorded as every actor role this journey asks for (agent), marked as a test-run assignment, so one person can walk every gate alone..." (seen in `desktop-J10.4-table.png`). The authority question (amendment A2, needs_owner) stays with the owner.
- journey-flow-experience-mapping-B13 (activation token covers running journeys and removed gates): no baseline step covers an already-active re-activation. The baseline activations (J5.2 v5, J7.3 v6 after a test run was running) both succeeded with the new token and the J7.2 impact lines were exact, so the changed token did not break the covered path. The `alreadyActive` message was not exercised (amendment A3 rejected).

## Per step (both surfaces unless noted)

All 58 required step/surface rows passed: P.1 to P.3 (setup), J1.1 to J1.10, J2.1 to J2.3, J3.1 to J3.2, J4.1 to J4.7, J5.1 to J5.3, J6.1 to J6.2, J7.1 to J7.3, J8.1 to J8.6, J9.1 to J9.11 (J9.2, J9.3, J9.8 cli once), J10.1 to J10.6, E.1 to E.5. Highlights: exact preview/impact/gate/experience-map text (5 render / 30 not set / 0 not mapped / 1 invalid, then 6/30/0/0); member cannot activate (UI and 403 `role_not_allowed`); admin activation and History rows; replacement impact lines in J7.2; six experience channels and the unmapped read-back 5/25/6/0 in J8.3; Courier option selectable; exactly 6 MCP tools without `flow_journey_activate`, which is refused 403 `scope_not_granted` without the publish scope; admin 409 `impact_approval_required`; no sensitive fields on `users`; 404 text exact; 44px controls and no sideways scroll at 390px; Render Bindings lists no journey experience rendering.

## Failures

None.

## Console errors and failed requests

Only the spec's expected non-2xx: 409 on `GET .../journey-preview?source=published` (J4.2), 409 on `PUT /api/flow-studio/experience-channels` twice (J8.1, J8.4), and the J9 command-line responses. External three.js CDN request blocked by the sandbox (`external_blocked`). No page errors. Lazy-loaded `/assets/*.js` chunks report `ERR_ABORTED` only when the test navigated away mid-preload; no screen was affected.

## Interface parity

- API: every capability was driven through the UI and its route seen in the network log (`/api/flow-studio/flows`, `/catalogs`, `/journey-preview`, `/journey/activate`, `/journey`, `/journey/test-run`, `/experience-channels`, `/definition`).
- MCP: the 6 tools allowed by the token's scopes list exactly as specified; `flow_journey_catalogs_read`, `flow_journey_preview` and `flow_experience_channels_read` return the same data as the UI; `flow_journey_activate` is refused without the publish scope. No UI_GAP, MOBILE_GAP or MCP_GAP found.

## Observations (outside the baseline, not scored)

1. Not re-verified this round beyond what the run showed: the open items B8, B10, B11 are unchanged (owner questions pending; B8 only partly done), and no baseline step covers them.
2. The J4.2 red error toast still stays on screen for several seconds and on the phone can overlap the journey list (round 1 observation 1, unchanged).

## Cleanup

Server stopped via PID file; database `sb_rl_val_16700_16` dropped. No product code, spec or baseline changed; nothing committed.
