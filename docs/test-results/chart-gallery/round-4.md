# Test result — chart gallery, round 4

Feature: Visual chart gallery in the Output Template editor · Round 4 · Commit tested: `0800b1c` (integration head `claude/zealous-meitner-5tuft5`) · Date: 2026-10-10 (sandbox clock; year 2026, Forecast modeling = 13 yrs) · Spec: `docs/training/chart-gallery.md` baseline v2 (amendment A1; unchanged since round 3, so the scores compare like for like).

## Score (from `release-spec-baseline.mjs score`, verbatim)

```json
{
  "feature": "chart-gallery",
  "baseline": 2,
  "specSha256": "ee2b02cd52830821049ca032ac55d29d387b105ea77855f4fdd470f93b703b34",
  "total": 20,
  "passed": 17,
  "failed": ["J2.2", "J2.3", "E.4"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

`release-spec-baseline.mjs check --feature chart-gallery`: `baselines match: chart-gallery v2`. The baseline did not change since round 3, so no new diff table is needed (diff shows the same v1 -> v2 table as round 3).

Result: **FAILED** (3 baseline steps fail: J2.2 phone, J2.3 phone, E.4 desktop and phone).

## Method

Production build (`npm run build`), `node server/index.js` NODE_ENV=production on port 5702, fresh database `sb_rl_val_5700_1` (booted once, `npm run seed`, `scripts/create-test-member.mjs` for member@test.local, empty@test.local, mobile@test.local and the readied admin). Chromium via Playwright, signed in through the login form (Home -> Enter my member world), navigated only by clicking (Journeys -> Output Templates -> Resume -> Infographics; Career Master -> Manual Intake for P.1-P.4; admin via Classic Tools -> Network Relationship Management -> Output Templates). Desktop 1280x900; phone 390x844 (isMobile, hasTouch, taps), light scheme, en-US, TZ=UTC. P.1-P.4 were entered through the UI on desktop (member) and again on the phone (mobile member). Empty-member edge cases on empty@test.local on both surfaces. J2.3 as the admin. The E.2 outage was injected by Playwright route interception on `/api/career/proficiency` (HTTP 500) and removed afterwards. Screenshots and `steps.jsonl`: `/var/tmp/sbpg/release-loop/chart-gallery/round-4/`. An older aborted attempt's files were moved to `round-4-stale/` and are not part of this result.

## Per-step results

| Step | Desktop | Phone (390px) |
|---|---|---|
| P.1-P.4 | pass | pass (entered on the phone UI too; logged once as setup) |
| J1.1 | pass | pass |
| J1.2 | pass | pass |
| J2.1 | pass | pass |
| J2.2 | pass | **fail** |
| J2.3 | pass | **fail** (MOBILE_GAP) |
| J3.1-J3.4 | pass | pass |
| J4.1, J5.1, J5.2 | pass | pass |
| J6.1-J6.3 | pass | pass |
| E.1, E.2, E.3 | pass | pass |
| E.4 | **fail** | **fail** |
| E.5 | pass | pass |

## Failures

1. **J2.2 (phone)** — Expected: nothing clipped at the right edge, no horizontal scrollbar inside the preview. Seen: the Skill strength chart fits (svg x 49-267 in a 316px column; rows, heading, legend correct; preview below the gallery) but the preview document is horizontally scrollable (scrollWidth 354 > clientWidth 316): footer pills "CLAUDE (ANTHROPIC) — SECONDARY AUTHOR" (right edge 335) and "DESIGN SYSTEM — CO-AUTHORED WITH CHATGPT" (right edge 354) are cut off. Unchanged from rounds 2 and 3 (bug F3-4: chip spans keep `white-space: nowrap`, `src/components/Output.jsx`). Evidence: `J2.2-chips-mobile.png`, `J2.2-preview-mobile.png`. Desktop passes: svg 49-329 in a 378px column, no horizontal overflow; at a 1400px window the preview stays at y=114 through every scroll; at a 600px window it sits below the gallery (x=36, w=528) with no overlap.
2. **J2.3 (phone) — MOBILE_GAP** — At 390px the admin shell hides its view selector (`.sb-admin-topbar-actions` is `display: none`) and renders no menu button or drawer (the only toggle, `sb-admin-mobile-toggle`, is for the content tab's pages list). "Classic Tools" opens the Commercial Opportunity Pipeline view whose only tappable tabs are Leads, Commercial Opportunity Pipeline, Lead-to-Revenue Diagnostic, Career Reasoning Compiler. Admin -> Output Templates cannot be reached on the phone. Unchanged from round 3 (bug F3-3). Evidence: `A1-mobile.png`.
3. **E.4 (desktop and phone)** — Bar Chart (Horizontal)/(Vertical) `+ Add` are disabled and Capacity Gauge `+ Add` is enabled, as expected, but for an empty member the gauge (gallery thumbnail and Live Preview after adding) shows no number: the value element above "ROLES HELD" is an empty `<div>` (dasharray `0,157`); expected "the number 0". Unchanged from round 3 (bug F3-5, falsy-zero in `interpolate()`/gauge value). Evidence: `E.4-preview-desktop.png`, `E.4-preview-mobile.png`.
4. **MCP_GAP (output templates)** — The editor calls `GET /api/output-templates?output_type=resume` (list), `POST/PUT /api/output-templates` (save, J6.1) and `DELETE /api/output-templates/:id`. `server/lib/mcpToolRegistry.js` / `mcpRouteTools.js` have no output-template list/save/delete tool and `capabilityParity.js` has no row for it (bug F3-6, partly open). Checked through `/mcp` with a personal access token created through Connected Agents in the UI (scopes career.read, career.write): 94 tools listed, none for output templates.
5. **MCP_GAP (rollups mismatch)** — The UI calls `GET /api/career/rollups?owner=me` and gets Roles Held 3, Skills 4, Tools 2, Case Studies 1, skills_by_category Operations 2 / Strategy 2. The MCP tool `career_rollups_read` (same member, same token) returns Roles Held 0, Skills 0, Tools 0, Case Studies 0 and empty groups, and rejects an `owner` argument (`Unknown argument "owner"`), so it cannot return what the UI shows.
   - Matching: `proficiency_rules_read` (`GET /api/career/proficiency`) returns the same levels and points as the Rules & why screen (Process design Expert 16, Forecast modeling Expert 17, Pricing analytics Advanced 8, Stakeholder reporting Advanced 7.5, Ledgerly ERP Advanced 8, QuoteFlow CPQ Expert 15); `career_master_read` returns 3 jobs, 4 skills, 2 tools, 1 engagement.

## Fixes verified by step id (bugs handed over)

| Item | Step | Result |
|---|---|---|
| CG-R3-1 / F2-8 / CG-R2b-6 admin shell sticky preview (adminStyles / AdminShell scroller) | J2.3 desktop | **Fixed, passes.** `.sb-admin-scroll` is now a real scroller (scrollHeight 2012, clientHeight 799); wheel scroll 500/1000/1500 moves it (max 1212); the Live Preview iframe stays at y=120 (bottom 760) beside the gallery; every Add button and Save & Set Primary are reachable. |
| CG-R2-1 preview chart not clipped (`careerCharts.js` min-width) | J2.2 desktop | Still passes (svg 49-329 of 378px, no overflow). On the phone the chart fits; the phone failure is the footer chips (F3-4), not the chart. |
| CG-R2b-4 phone preview below gallery | J1.1 / J2.2 phone | Passes under amended J1.1 (preview iframe at x=36, y=4019 below the gallery). |
| CG-R2b-1 bar-chart `+ Add` disabled for empty member | E.4 | Disabled/enabled parts match the amended spec; the "shows the number 0" clause fails (F3-5). |
| F3-3 admin shell phone menu | J2.3 phone | **Not fixed**, MOBILE_GAP (failure 2). |
| F3-4 chip overflow in preview | J2.2 phone | **Not fixed** (failure 1). |
| F3-5 falsy-zero | E.4 | **Not fixed** (failure 3). |
| F3-6 MCP tools | MCP | Partly fixed: `proficiency_rules_read` exists and matches; output-template tools still missing and `career_rollups_read` mismatches (failures 4, 5). |
| F3-7 aria-label "Edit <title>" on a button that shows "Done" | J3.4 | **Not fixed**: `ChartGallery.jsx` line 381 still sets `aria-label="Edit Skill strength"` on the button whose visible text toggles to "Done". Pressable by visible text, so the step passes; a name-based lookup of "Done" does not find it. |
| F2-2 / F3-8 unmerged hunks (`careerAtomMigration` jsonb cast, `careerMaster` atomSyncError) | none (outside baseline) | **Still reproduces.** Server log: `[careerMaster] atom sync failed: cannot cast type boolean to jsonb` (2 occurrences, one per member that entered Career Master rows; the UI saved normally and shows no error). `atomSyncError` does not exist anywhere in `server/` or `src/`. |
| F2-7 / B10 setup shortcuts, B9 two-step pick then Add | process | This round set up P.1-P.4 through the Manual Intake UI on both surfaces and used the two-step pick (click card, then + Add) as the spec writes it; no shortcut taken. |

## Console errors and failed requests

- External font/CDN requests (fonts.googleapis.com, cdnjs three.js: `ERR_CERT_AUTHORITY_INVALID` and `ERR_TUNNEL_CONNECTION_FAILED`) are recorded as `external_blocked` or as generic "Failed to load resource" lines on public pages. No page errors on either surface.
- Deliberate: HTTP 500 on `/api/career/proficiency` during E.2 (route interception) and the app's own "loading proficiency failed" console line; one 400 from `/api/platform/tokens` when I submitted the Connected Agents form with no scope ticked (outside the spec; the UI showed a clear message).
- No other 4xx/5xx or failed app requests.

## Observations (outside any baseline step; not scored)

- Spec J2.2 lists rows "Process design, Forecast modeling, ..." but before the J3.1 override the preview lists Forecast modeling first (13 yrs sorts above 11); after J3.1 the order matches. Treated as set membership.
- Gallery thumbnail and Live Preview chart row labels are tiny (about 5px).
- At 1280px in the admin shell a floating "Back to World" button overlaps the brand text at the top left.
- On the phone the gallery thumbnails have large blank gaps under the charts (cards stay tall); not blank, so not scored.
- The expanded Proficiency Tiers card on the phone shows a very small thumbnail next to the options; usable.
- ERR_TUNNEL_CONNECTION_FAILED console lines are a second sandbox failure code for external hosts; spec E.5 names only ERR_CERT_AUTHORITY_INVALID. Treated as external-resource blocks; if E.5 should be literal, name both codes in an amendment.
- F3-7 (aria-label) and the unmerged atom-sync hunks (F2-2/F3-8) are described above.

## Proposed amendments

None. No step was ambiguous.

## Cleanup

Both Playwright REPL processes and the server on port 5702 were stopped via their PID files; database `sb_rl_val_5700_1` dropped; the personal access token file removed (the token lived only in the dropped database).
