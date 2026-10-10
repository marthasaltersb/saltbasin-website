# Test result - no-silent-failures - round 2

Feature: No silent failures (snapshot, history, live-data and load errors surfaced)
Round: 2 - Commit tested: a9b5087 (integration head) - Validator: val-5200-7 - 2026-10-09
Environment: fresh local Postgres (`sb_rl_val_5200_7`, one fresh database per surface), production build on port 5214, Chromium via Playwright, TZ=UTC, en-US, light scheme. Desktop 1280x900 (click) and phone 390x844 (isMobile, hasTouch, tap). Fictional data only. Signed in through the login form as the test member (see observation 1).

## Score (from `release-spec-baseline.mjs score`)

```json
{ "feature": "no-silent-failures", "baseline": 2, "specSha256": "5dc2135a8eebd1b242aa47feb20d605a74929c6235c87f418cf759e88471e78c",
  "total": 29, "passed": 25, "failed": ["J0.2", "J0.3", "J3.4", "E.4"], "blocked": [], "notRun": [] }
```

Baseline v2 (amendment A1), check passes. Baseline diff v1 to v2: 20 same; changed J1.2 J2.2 J3.1 J3.2 J3.4 J5.1 E.1 E.4; added J2.3; retired none. Round 1 scored on v1, so compare only the 20 "same" ids like for like.

Machine log: `/var/tmp/sbpg/release-loop/no-silent-failures/round-2/steps.jsonl`; screenshots in the same folder (`<id>-desktop.png`, `<id>-mobile.png`).

## Fixes handed to this round

| Fix | Step | Result |
| --- | --- | --- |
| T2 red error toast | J3.4 | Works: the snapshot error renders as `.sb-toast-error`, `role=alert`, dark red background `rgb(122,31,31)`, readable on desktop and phone, after the (non-error, `role=status`) green success toast. J3.4 still FAILS, but only for the success-toast wording (below), not for T2. |
| T9 banner when live data unavailable | J2.2, J2.3 | Pass on desktop and mobile. Banner "RECORDED DATA — 1 recorded change since the approved printed version (live data unavailable)", sentence below begins "Live career data could not be loaded, so these charts show the last recorded state." and "update from the Salt Basin Career Master" is absent. Healthy banner (J0.4, J5.5) unchanged. |

## Failures

1. J0.2, J0.3, J3.4 (desktop and mobile): the success toast reads "Approved - private QR link created (copied to clipboard)." with an ASCII hyphen; the spec text has an em dash ("Approved — private QR link created ..."). Source: `src/components/admin/MyResumePanel.jsx:636` uses a hyphen (the same string is in `OpportunityOutputsSection.jsx:129`). Every other part of J0.2, J0.3 and J3.4 passed (dialog closes, no red toast, QR image and link, same link across versions, red snapshot toast with the exact copy, earlier version Approved with no QR). Round 1 passed these steps on an older commit, so the dash changed in code since then. Literal mismatch; the product string or the spec needs the dash made consistent (I edited neither).
2. E.4 (desktop and mobile), marked "AMBIGUOUS:": the only item outside the expected-noise list is one `net::ERR_ABORTED` on `/api/career/jobs`, a request cancelled by the page reload that J1.4 requires. Everything else matched: HTTP 500 on `/api/career/master|catalogs|proficiency|rollups|resume-rollups` only while a fault was in place, one 404 on `/api/shared-outputs/<slug>` after the E.1 revoke, 409 on `/api/resume-outputs/<id>/share` four times (J0.1, J3.3, the E.3 cancel then re-approve in J3.4, and E.2), no page errors. Proposed wording: add "a request cancelled by a page reload (net::ERR_ABORTED) is not a finding", and "one 409 per approval attempt that opens the gate dialog" (four occur in the specified walk, not one).
3. MCP_GAP (the platform MCP server exists at `/mcp` with 10 tools). Compared with the UI as the same test user via a bearer token: `career_master_read` matches `GET /api/career/master?owner=me` exactly; `application_output_approve_for_qr` runs the same gate (409 `tool_category_required`, listing Pipeline Tracker and the three categories, as in the dialog). Missing for what the spec exercises: (a) edit a Career Master entry (J1.1/J1.3/J5.3); (b) set technology proficiency categories (the gate can be hit over MCP but not cleared); (c) revoke a QR link (E.1); (d) read Resume Output History including `shareSyncError`, the "QR history could not record" state (J1.4/J5.4) - `application_outputs_list` needs a tracked opportunity id and these outputs have none; (e) read the public QR page state and live-data status (J2.x, J3.5, J5.x); (f) read the template output chart/loading state (J4.1/J5.2); (g) create or save the primary output template (P4).
4. UI parity: no UI_GAP or MOBILE_GAP on any baseline step. Phone path: World Shell, Journeys (Career Master, My Resume, Output Templates cards), then the panels; QR pages and `/output/resume` are reached by tapping the links on My Resume. Desktop path: Classic Tools button.

## Per step (both surfaces pass unless stated)

| Step | Desktop | Mobile | Seen |
| --- | --- | --- | --- |
| J0.1 | pass | pass | Gate dialog, two dropdowns (Choose..., Hands-on (suggested), Integration design, Adjacent exposure), no "Suggestions are unavailable" |
| J0.2 | FAIL | FAIL | Everything right except the toast dash (failure 1) |
| J0.3 | FAIL | FAIL | No dialog, second link, toast dash |
| J0.4 | pass | pass | "LIVE DATA — matches the approved printed version", no alert |
| J0.5 | pass | pass | Tools (3); banner for Pipeline Tracker |
| J1.1 | pass | pass | Edit Entry open, 11 changed to 12 |
| J1.2 (cli) | pass | n/a | FAULT A applied |
| J1.3 | pass | pass | Toasts "Saved" and "Failed to load career master data: Failed to load career catalogs" (plain dark style, not red - observation 3) |
| J1.4 | pass | pass | Both approved outputs show the "QR history could not record a Career Master change (...): relation "career_jobs" does not exist. It retries ..." line |
| J1.5 | pass | pass | Banner lists Pipeline Tracker |
| J2.1 | pass | pass | Alert exact, banner RECORDED DATA |
| J2.2 | pass | pass | Same alert, banner RECORDED DATA |
| J2.3 | pass | pass | T9 fix verified |
| J3.1 (cli) | pass | n/a | FAULT B, import `resume_standard #3 new_version`, `cover_letter #2 unchanged` |
| J3.2 | pass | pass | New Draft with Approve for QR; earlier version Published with QR, link, Revoke QR |
| J3.3 | pass | pass | Pipeline Tracker only, "Suggestions are unavailable (... relation "career_proficiency_assertions" does not exist) — choose each category yourself.", options without "(suggested)" |
| J3.4 | FAIL | FAIL | Red toast exact (T2 verified); same link; earlier version Approved, no QR; fails only on the green toast dash |
| J3.5 | pass | pass | Alert exact, no banner, no slider |
| J4.1 | pass | pass | Pat Example header, three alerts in order with exact copy, neither empty-data message |
| J5.1 (cli) | pass | n/a | RESTORE |
| J5.2 | pass | pass | No alerts; proficiency list in spec order with levels; trend and timeline |
| J5.3 | pass | pass | Only "Saved"; row reads 11 |
| J5.4 | pass | pass | No QR-history line |
| J5.5 | pass | pass | "LIVE DATA — 1 change since the approved printed version", no alert |
| J5.6 | pass | pass | Alert ends "Live career data is shown below." |
| E.1 | pass | pass | After revoke the cover link shows "This link isn't available" |
| E.2 | pass | pass | Fault A only: Pipeline Tracker preselected "Integration design (suggested)", no unavailable line |
| E.3 | pass | pass | Cancel toast exact, output unchanged |
| E.4 | FAIL | FAIL | Failure 2 |

Setup (surface "setup", not scored): P1 sign-in via login form; P2 counts Skills (2), Jobs (1), Tools (2), Certifications (1); P3 import plus banner; P4 gallery offered all three charts and Save & Set Primary worked, then the spec console fixture returned 200 (needed because the gallery template has no member name and different chart titles).

## Observations (not scored)

1. P1 says sign in as the test admin, but the admin's "Classic Tools" opens the admin console (Commercial Opportunity Pipeline), which has no Career Master or My Resume. The whole spec was run as `member@test.local`, with the importer pointed at the same member via `SB_EMAIL`/`SB_PASSWORD`. Proposed amendment: P1 should say "test member".
2. E.2 setup is not specified. To get an uncategorised technology under FAULT A only, I reset Pipeline Tracker's "How it was used" to (none) in Career Master through the UI, applied FAULT A, imported a changed package ("thirteen"), and approved the new draft. Proposed: give E.2 explicit setup steps.
3. The failure toast "Failed to load career master data: Failed to load career catalogs" (J1.3) is a normal dark `role=status` toast, not red. The fix covered only the J3.4 toast; a load failure shown in the success style is a remaining mild form of the same problem.
4. The E.3 cancel toast is created twice (two identical toasts in the DOM).
5. J2.x banner and alerts, the red toast, My Resume and the gate dialog are readable at 390px with no clipping or horizontal scroll. At 390px the Classic Tools tab strip is hidden (`display:none`, no menu toggle), so the only phone route to Career Master, My Resume and Output Templates is World Shell, Journeys. That route works, but inside Classic Tools on a phone only the open panel and "Back to World" are available, and the Career Placement Agents panel is squeezed into a narrow column.
6. Typed URLs: only the start page. `/output/resume` opens in a new tab from the "Public link" on My Resume.
7. External sandbox blocks (fonts, three.js CDN) logged as `external_blocked`; no page errors on either surface.

## Cleanup

Drivers and server stopped by PID; database `sb_rl_val_5200_7` dropped; RESTORE applied after J5.1 and after E.2, so no fault table remained; no product code, spec or baseline file changed.
