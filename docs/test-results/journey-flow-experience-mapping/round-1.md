# Test result: journey-flow-experience-mapping, round 1

Feature: Journey flow to experience: each shape captures gates, variants, actors, decisions, capabilities, authorities and system, and maps to the user experience asset
Round: 1 (validation, fresh database + seed per surface pass)
Commit tested: 99ee8d51a22356426f35a9c5c9199eb02cccd893 (integration head `claude/zealous-meitner-5tuft5`)
Date: 2026-10-11
Fix details received: none (round 1)

## Score (from `scripts/release-spec-baseline.mjs score`)

```json
{
  "feature": "journey-flow-experience-mapping",
  "baseline": 1,
  "specSha256": "dcda6c46b487e91cff080e2c332822f810a6b7bac2d899e78d01e4e1af674f94",
  "total": 58,
  "passed": 57,
  "failed": ["J10.4"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Baseline check passed (`baselines match: journey-flow-experience-mapping v1`). Result: NOT PASSED (57 of 58).

## Method

Chromium via Playwright, two browser contexts (MEMBER WINDOW as member@test.local, ADMIN WINDOW as admin@test.local), both logged in through the login form and navigated by clicking from `/world`. Two full walkthroughs on separate fresh databases: desktop 1280x900 (click), and phone 390x844 (isMobile, hasTouch, tap). For the desktop walkthrough, Journey 10 was run with the window resized to 390x844 (the spec says "at 390px wide"). Command-line steps (J9.x) were run with curl and `scripts/mcp-call.mjs` against the same server with a token created in the UI (J9.1). J6.2 opened `/api/journey-rods/me/world` in a second tab, as the spec says. No API, database or script was used to perform any browser step.

Evidence: `/var/tmp/sbpg/release-loop/journey-flow-experience-mapping/round-1/` (`steps.jsonl`, one screenshot per step and surface named `<surface>-<id>.png`).

## Per step (both surfaces unless noted)

| Id | desktop | mobile | Seen |
|---|---|---|---|
| P.1, P.2, P.3 | pass | pass | World Shell tabs; studio tabs without Settings for member and with Settings for admin; empty-state text |
| J1.1 to J1.10 | pass | pass | Flow created; Experience binding and Structured bindings groups, no Extension fields; all bindings added, saved as v2, survive reopen |
| J2.1 to J2.3 | pass | pass | Branch condition `career_jobs.order_index`, v3 |
| J3.1, J3.2 | pass | pass | Template values shown, v4 |
| J4.1 to J4.7 | pass | pass | Draft preview with 1 warning, published preview refused in red, path/gates/map text exact (5 render, 30 not set, 0 not mapped, 1 invalid), impact lines, v5 no problems, published v5, member cannot activate |
| J5.1 to J5.3 | pass | pass | Admin activation, active read-back, history rows |
| J6.1, J6.2 | pass | pass | Test journey started; `/api/journey-rods/me/world` shows `flow-<ID>`, `journey_flow_run`, both stages, `flowJourney` |
| J7.1 to J7.3 | pass | pass | v6 published; replacement impact lines; activated v6 |
| J8.1 to J8.6 | pass | pass | Six channels, impact card, unmapped read-back (5 / 25 / 6 / 0), re-enable, definition v2, Courier selectable |
| J9.1 | pass | pass | Token with flowjourney.read and write; flowjourney.publish listed unticked |
| J9.2, J9.3, J9.8 | pass (cli) | n/a | login, flow v6 published; exactly 6 tools listed, no activate; 403 `role_not_allowed` body exact |
| J9.4 to J9.7, J9.9 to J9.11 | pass | pass | catalogs, preview ok, activate refused 403 `scope_not_granted`, six channels, admin 409 `impact_approval_required`, no sensitive fields on `users`, 404 text exact |
| J10.1, J10.2, J10.3, J10.5, J10.6 | pass | pass | Inspector below lists, Remove button at least 44px, Branch condition, all studio controls at least 44px, no Settings for member |
| **J10.4** | **FAIL** | **FAIL** | see below |
| E.1 to E.5 | pass | pass | Gate key problem, bad key, no-operator condition, 2 warnings, Render Bindings has no journey experience rendering |

## Failures

### J10.4 (desktop at 390px, and mobile)

Expected: tap **Journey**; the preview shows and the **Experience map** table scrolls inside its own box, not the page.
Seen: the page does not scroll sideways, but the table does not scroll in its box either. The table is squeezed to the box width (scrollWidth 286 = clientWidth 286, box overflow-x is `auto`, so it is never needed). The seven columns are cut to 40px or less, so headings and the `mapped` / `not set` pills break letter by letter ("m a p p e d", "Anim ation", "Destin ation link"). That is unreadable, which is also a failure under the regression-gate ground rule.
Evidence: `desktop-J10.4-table.png`, `mobile-J10.4-table.png`, `desktop-J10.4.png`, `mobile-J10.4.png`. Cause to look at: `.fs-table` inside `.fs-scroll` in `src/components/admin/FlowJourneyParts.jsx` has no minimum width, so it shrinks instead of overflowing.

## Console errors and failed requests

Only the spec's expected non-2xx: 409 on `GET .../journey-preview?source=published` (J4.2) and 409 on `PUT /api/flow-studio/experience-channels` twice (J8.1, J8.4); the J9 command-line responses. External CDN request (cdnjs three.js on /login) blocked by the sandbox: `external_blocked`. No page errors. Lazy-loaded `/assets/*.js` chunks show `ERR_ABORTED` when the test navigated away during preloading (login to `/world`, `/world` to `/api/...`); they load on use and no screen was affected, so they are not counted.

## Interface parity

- API: every capability the spec exercised was driven through the UI and its route seen in the network log (`/api/flow-studio/flows`, `/catalogs`, `/journey-preview`, `/journey/activate`, `/journey`, `/journey/test-run`, `/experience-channels`, `/definition`).
- MCP: the 6 tools the token's scopes allow are listed exactly as specified; `flow_journey_catalogs_read`, `flow_journey_preview` and `flow_experience_channels_read` returned the same data as the UI; `flow_journey_activate` is refused without the publish scope. No MCP_GAP, UI_GAP or MOBILE_GAP found. `node scripts/check-interface-parity.mjs`: 132 of 132 capabilities, 0 gaps.

## Observations (outside the baseline, not scored)

1. The red error message from J4.2 ("This flow has not been published yet...") stays on screen for many seconds as a toast and, on the phone, overlaps the generated journey list in J4.3 and J4.4 (`mobile-J4.3.png`). Content stays reachable by scrolling.
2. The Preview of the saved draft keeps showing the old version text for a moment after Save draft and a click on **Preview saved draft** (it refreshes to "version 5" within about a second).
3. In J10.2 add then remove of an actor marks the flow "unsaved changes"; expected for an edit.
