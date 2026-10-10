# Test result - no-silent-failures - round 2

Feature: No silent failures (snapshot, history, live-data and load errors surfaced)
Round: 2 - Commit tested: 0800b1c (integration head `claude/zealous-meitner-5tuft5`) - Validator: val-5200-1 - 2026-10-10
Environment: fresh local Postgres (`sb_rl_val_5200_1`, recreated and seeded once per surface), production build on port 5202, Chromium via Playwright, TZ=UTC, en-US, light scheme. Desktop 1280x900 (click) and phone 390x844 (isMobile, hasTouch, tap), each a full walk on its own fresh database. Fictional data only. Signed in through the login form as the test member (see observation 1).

## Score (from `release-spec-baseline.mjs score`)

```json
{ "feature": "no-silent-failures", "baseline": 2, "specSha256": "5dc2135a8eebd1b242aa47feb20d605a74929c6235c87f418cf759e88471e78c",
  "total": 29, "passed": 24, "failed": ["J0.2", "J0.3", "J3.4", "J5.2", "E.4"], "blocked": [], "notRun": [] }
```

Baseline v2 (amendment A1); `check` passes. Diff v1 to v2: 20 same; changed J1.2 J2.2 J3.1 J3.2 J3.4 J5.1 E.1 E.4; added J2.3; retired none. Compare round 1 (v1) only on the 20 "same" ids.

Machine log: `/var/tmp/sbpg/release-loop/no-silent-failures/round-2-val-5200-1/steps.jsonl` (screenshots in the same folder, `<id>-desktop.png` / `<id>-mobile.png`). I wrote to this folder, not `.../round-2/`, because that folder already holds another validator's (val-5200-7) steps and screenshots and I did not overwrite or move them; the score above was computed from my file. Scripts: `/var/tmp/sbpg/agents/val-5200-1/r2/`.

## Fixes handed to this round, by step id

| Fix / bug | Step | Result |
| --- | --- | --- |
| T2 error toast looks like success | J3.4 | Verified on both surfaces: the snapshot error toast is a distinct dark red (rgb 122,31,31), white text, readable at 390px with no clipping, shown after the success toast. J3.4 still FAILS, only for the success-toast wording (failure 1). |
| T9 / B15 RECORDED DATA banner wording | J2.2, J2.3 | Verified, pass desktop and mobile: "RECORDED DATA — 1 recorded change since the approved printed version (live data unavailable)", then "Live career data could not be loaded, so these charts show the last recorded state. ...", and "update from the Salt Basin Career Master" is absent. Healthy banner (J0.4, J5.5) unchanged. |
| F1-1 (browser run of toast / banner) | J3.4, J2.2 | Done in this run (above). |
| T1 / F1-2 charts empty after restore | J5.2 | NOT fixed: still fails, desktop and mobile (failure 2). |
| T3 J2.2 wording, T4 J3.2 earlier version, T5 J4.1 header and titles, T6 shell-only steps, T7 E.1 bogus slug, T8 E.4 noise list | J2.2, J3.2, J3.4, J4.1, J1.2, J3.1, J5.1, E.1, E.4 | Handled by baseline v2 (A1). J2.2, J3.2, J4.1, E.1 pass; the cli steps J1.2, J3.1, J5.1 pass as cli; J3.4 and E.4 still fail for the reasons below. |
| T10 / F1-4 coverage | J2.3 added in v2; member-owned chart data has no step | J2.3 passes. The member-chart gap is real (it is what fails J5.2) but no step names "member's own data". |
| B12 spec signs in as admin (P1), B13 setup via URL/CLI/console | P1, P3, P4 | Still open as spec text, see observations 1 and 2. |
| F1-5, F1-6 (lenient fetch, fire-and-forget sync) | none | No baseline step covers them; not tested. |
| F1-7 MCP_GAP | all | Largely closed: see failure 4 (one gap left). |

## Failures

1. J0.2, J0.3, J3.4 (desktop and mobile): the success toast reads "Approved - private QR link created (copied to clipboard)." with an ASCII hyphen; the spec has an em dash and calls it a "green toast", while the toast is a dark navy (rgb 17,25,40) with cream text. Source: `src/components/admin/MyResumePanel.jsx:656` (same string at `OpportunityOutputsSection.jsx:129`). Everything else in these steps passed (dialog closes, no red toast, QR image and link, same link across versions, earlier version Approved with no QR, red snapshot toast with exact copy). Same finding as the previous round-2 run; neither product nor spec has changed. Fix is either the dash in the product or an amendment (including "green").
2. J5.2 (desktop and mobile), open bug T1 / F1-2: after RESTORE the `/output/resume` page shows no alert and the PROFICIENCY list is right (Forecast modeling Expert, Process design Expert, QuoteFlow CPQ Expert Hands-on, Ledgerly ERP Advanced Hands-on, Pipeline Tracker Proficient Hands-on), but EXPERIENCE TREND says "Not enough dated Career Master records to show a trend yet." and CAREER TIMELINE says "No dated roles in Career Master yet." although the member has the job Northwind Advisory (2019-01 to 2023-06), whose timeline and cumulative-years chart the same member's `/r/<slug>` page draws. The empty-state messages are exactly the ones J4.1 says mean "genuinely empty data". Evidence: `J5.2-desktop.png`, `J5.2-mobile.png`. Cause per T1: the template page reads Career Master without the member's owner, so it resolves to the default admin, while proficiency is session-scoped.
3. E.4 (desktop and mobile), marked "AMBIGUOUS:": the only item outside the expected-noise list is one `GET /api/career/jobs net::ERR_ABORTED` on `/world`, a request cancelled by the page reload that J1.4 requires. Everything else matched: HTTP 500 on `/api/career/master` (7 desktop / 6 mobile), `/api/career/catalogs` (1), `/api/career/proficiency` (2) only while a fault was in place (`/api/career/rollups` and `resume-rollups` were not requested), one 404 on `/api/shared-outputs/<slug>` after the E.1 revoke, four 409s on `/api/resume-outputs/<id>/share` (J0.1, J3.3, the J3.4 re-approve after the E.3 cancel, E.2 - one per approval attempt that opened the gate dialog, not "one" in total), no 404 on `/api/members/me/profile` this time, no page errors. Proposed wording: "a request cancelled by a page navigation or reload (net::ERR_ABORTED) is not a finding", and "one 409 per approval attempt that opens the gate dialog (four occur in the specified walk)".
4. MCP_GAP: output templates have no MCP tool. The platform MCP server exists (`/mcp`, 110 tools, token created in the UI at World Shell, Journeys, Connected Agents, all 6 scopes). I compared as the same member to the UI's API: `career_master_read` = `GET /api/career/master?owner=me` (same keys, 1 job); `career_record_list`/`career_record_update` cover the Career Master edit (J1.1, J5.3; list returned Process design with the same years as `GET /api/career/skills`); `resume_outputs_list` = `GET /api/resume-outputs` (same ids 1-4, and it returns `shareSyncError`, the J1.4/J5.4 state); `shared_output_live_read` = `GET /api/shared-outputs/:slug` (same keys), a revoked slug is 404 over HTTP and `isError` `not_found` over MCP (E.1); `finalization_check` identical to the website's list (Pipeline Tracker); `technology_category_set` answers a missing `toolId` with a 400 error result; `career_rollups_read` and `resume_rollups_read` match their routes; `application_output_approve_for_qr` / `application_output_revoke_qr` exist (previous round showed the gate matches). Remaining gap: `/api/output-templates` (create or set the primary template, P4; read what `/output/resume` draws, J4.1/J5.2) has no tool and the route is not in `GOVERNED_ROUTE_FILES` or `capabilityParity.js`; the only template-named tool is `career_semantic_template_read`. This does not change the score (no step id owns it); listed for the scope check.
5. UI parity: no UI_GAP or MOBILE_GAP on any baseline step. The cli steps (J1.2, J3.1, J5.1) are shell by design and pass as `cli`. Phone path: World Shell, Journeys (Career Master, My Resume, Output Templates cards), then the panels; the QR pages and `/output/resume` open from the links on My Resume. Desktop path: Classic Tools button then the tab strip.

## Per step (both surfaces pass unless stated)

| Step | Desktop | Mobile | Seen |
| --- | --- | --- | --- |
| J0.1 | pass | pass | Gate dialog, two dropdowns (Choose..., Hands-on (suggested), Integration design, Adjacent exposure), no "Suggestions are unavailable" |
| J0.2 | FAIL | FAIL | All correct except toast dash and colour (failure 1) |
| J0.3 | FAIL | FAIL | No dialog, second link, toast dash (failure 1) |
| J0.4 | pass | pass | "LIVE DATA — matches the approved printed version", no alert |
| J0.5 | pass | pass | Tools (3); banner for Pipeline Tracker |
| J1.1 | pass | pass | Edit Entry open, 11 changed to 12 |
| J1.2 (cli) | pass | n/a | FAULT A applied (`ALTER TABLE`) |
| J1.3 | pass | pass | Toasts "Saved" and "Failed to load career master data: Failed to load career catalogs" |
| J1.4 | pass | pass | Both approved outputs show "QR history could not record a Career Master change (<date>): relation "career_jobs" does not exist. It retries ..." |
| J1.5 | pass | pass | Banner lists Pipeline Tracker |
| J2.1 | pass | pass | Alert exact, banner RECORDED DATA |
| J2.2 | pass | pass | Same alert, banner RECORDED DATA |
| J2.3 | pass | pass | Banner "(live data unavailable)", sentence exact, no "update from..." |
| J3.1 (cli) | pass | n/a | FAULT B; import `resume_standard #3 new_version`, `cover_letter #2 unchanged` |
| J3.2 | pass | pass | New Draft with Approve for QR; earlier version Published with QR image, link, Revoke QR |
| J3.3 | pass | pass | Pipeline Tracker only; "Suggestions are unavailable (... relation "career_proficiency_assertions" does not exist) — choose each category yourself."; options without "(suggested)"; dialog fully inside the viewport at 390px |
| J3.4 | FAIL | FAIL | Red toast exact; same link; earlier version Approved with no QR; fails only on the success toast (failure 1) |
| J3.5 | pass | pass | Alert exact, no banner, no slider |
| J4.1 | pass | pass | "Pat Example" header, three alerts in order with exact copy, neither empty-data message |
| J5.1 (cli) | pass | n/a | RESTORE |
| J5.2 | FAIL | FAIL | Failure 2 |
| J5.3 | pass | pass | Only "Saved"; row reads 11 |
| J5.4 | pass | pass | No QR-history line |
| J5.5 | pass | pass | "LIVE DATA — 1 change since the approved printed version", no alert |
| J5.6 | pass | pass | Alert ends "Live career data is shown below." |
| E.1 | pass | pass | After revoke (confirm shown) the cover link shows "This link isn't available" |
| E.2 | pass | pass | Fault A only: Pipeline Tracker preselected "Integration design (suggested)", no unavailable line |
| E.3 | pass | pass | Cancel toast exact (red), output unchanged |
| E.4 | FAIL | FAIL | Failure 3 |

Setup (surface "setup", not scored): P1 sign-in via the login form; P2 counts Skills (2), Jobs (1), Tools (2), Certifications (1); P3 import printed `resume_standard #1 created`, `cover_letter #2 created`, My Resume lists both Draft with the amber banner; P4 gallery offered Proficiency Tiers, Trend Bars, Career Timeline and Save & Set Primary worked, then the spec's console fixture returned 200 (needed for the "Pat Example" header and the chart titles J4.1 expects).

## Observations (not scored)

1. P1 says sign in as the test admin, but the admin's Classic Tools opens the admin console with no Career Master or My Resume. The whole spec was run as `member@test.local`, importer pointed at the same member via `SB_EMAIL`/`SB_PASSWORD`. Proposed amendment: P1 should say "test member" (open bug B12).
2. P3 (import script) and P4 (console fetch) are shell/console setup by the spec's own words, not UI; E.2 has no written setup. I did E.2 by clearing Pipeline Tracker's category in Career Master through the UI, applying FAULT A, importing a changed package ("thirteen"), approving the new draft, cancelling, then RESTORE. Proposed: give E.2 explicit steps (open bug B13).
3. The J1.3 load-failure toast "Failed to load career master data: ..." is a plain dark navy toast, not red, while the J3.4 snapshot error and the E.3 cancel toast are red. A load failure is shown in the success style (mild remaining form of T2).
4. Every toast is created twice (two identical entries in the DOM), seen for "Saved to Career Master", "Approved - ..." and the E.3 toast. Possible double render; not visible as two on screen in the screenshots checked.
5. At 1280px on the desktop Classic Tools My Resume view the "Back to World" button overlaps the top-left brand text ("TEST M..." header), clipping it (`J3.4-desktop.png`).
6. At 390px the Classic Tools tab strip is hidden; the only phone route to Career Master, My Resume and Output Templates is World Shell, Journeys. It works, with no clipping or horizontal scroll on the J2.x banner and alerts, the gate dialog, My Resume and the red toast.
7. Typed URLs: only the start page and `/login`; QR pages and `/output/resume` were opened from links on My Resume (private window = fresh browser context).
8. External sandbox blocks (fonts, three.js CDN) logged as `external_blocked`; no page errors on either surface.
9. Seed run concurrently with first boot hit a Postgres deadlock (`DeadLockReport` in `seed.log`); re-running `npm run seed` after boot succeeded. Boot-time race, not part of any step.
10. Not covered by any step: F1-5 (other /output pages with lenient fetch) and F1-6 (fire-and-forget Career Atom sync and audit writes).

## Cleanup

Server stopped by PID file; database `sb_rl_val_5200_1` dropped; RESTORE applied after J5.1 and after E.2 on both runs, so no fault table remained; no product code, spec or baseline file changed.
