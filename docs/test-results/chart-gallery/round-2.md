# Test result — chart gallery, round 2

Feature: Visual chart gallery in the Output Template editor · Round 2 · Commit tested: `a207b21` (integration head `claude/zealous-meitner-5tuft5`; the unmerged fix branch `release-loop/chart-gallery-fix-r1` is NOT in this commit) · Date: 2026-10-09 (sandbox clock; year 2026, Forecast modeling = 13 yrs) · Spec: `docs/training/chart-gallery.md`.

Method: production build on port 8702, fresh database `sb_rl_val_8700_1`; logged in through the login form as the ready member; preconditions entered through Career Master -> Manual Intake exactly as the spec says (4 skills, 3 jobs, 2 tools, 1 engagement); every journey driven by clicking from the World Shell in Chromium (Playwright). Screenshots and `steps.jsonl`: `/var/tmp/sbpg/release-loop/chart-gallery/round-2/`.

Result: **FAILED**. All 20 literal journey steps pass. Three regression-gate / edge-case checks fail, and two of the open bugs (CG-R1-1, CG-R1-2) are unchanged.

## Journey steps

| Step | Result | Seen | Screenshot |
|---|---|---|---|
| J1 1.1 heading, career section, six cards in order, thumbnails, Best for, + Add, Classic charts, Live Preview beside, no alert | pass | 6 cards in order, 12 Best for / 12 + Add, 6 classic, preview at right, 0 alerts | j1-1.png |
| J1 2.1 thumbnails (Forecast modeling 13 yrs first; Software 67% / Logistics 33%; $40M+, 35%) | pass | as expected | j1-1b.png |
| J2 1.1 card expands: Show, Group, Top rows 10, footnote ticked, Title | pass | | j2-1.png |
| J2 2.1 Skills only, Top rows 4, title, + Add: collapses, row "1. Skill strength / Proficiency Tiers", preview SKILL STRENGTH, 4 rows, legend, no dagger | pass (see visual failure below) | | j2-2.png |
| J3 1.1 override toast | pass | "Forecast modeling set to Advanced (marked †)" | j3-1-toast.png |
| J3 2.1 preview row with † and footnote sentence | pass | | j3-2.png |
| J3 3.1 / 3.2 footnote untick / tick | pass | | j3-3a.png, j3-3b.png |
| J3 4.1 / 4.2 Top rows 2 then 4, Done | pass | | j3-4a.png, j3-4b.png |
| J4 1.1 six rows 1-6; trend, tiles + footnote, timeline, dots 11/13 yrs, INDUSTRY SHARE BARS 67/33 | pass | | j4-1.png |
| J5 1.1 move up row 2 -> "1. Trend Bars" | pass | | j5-1.png |
| J5 2.1 remove last row: 5 rows, chart leaves preview | pass | | j5-2.png |
| J6 1.1 save toast and preset listed | pass | | j6-1.png |
| J6 2.1 reload: 5 rows same order, preview matches, no alert | pass | | j6-2.png |
| J6 3.1 cleanup Use formula | pass | | j6-3.png |

## Edge cases and regression-gate checks

| Check | Result | Seen |
|---|---|---|
| Empty member (second test member): sentence per card, add works, preview shows sentence | pass | `edge-empty*.png` |
| Top rows blank falls back to default | pass | `edge-topblank.png` |
| Classic Bar Chart / Gauge + Add disabled without source | pass | 2 disabled flags for empty member |
| Failed load: alert names data, "loading error, not missing Career Master data", Retry; Retry recovers | pass | `edge-retry.png` |
| **Failed load: alert includes the HTTP status (CG-R1-2)** | **FAIL** | Real 500 JSON body: "proficiency (simulated outage). This is a loading error..." Empty 500 body: "proficiency (Unexpected end of JSON input)". No status shown. `edge-failedload.png` |
| **Live Preview stays visible beside gallery (CG-R1-1)** | **FAIL** | iframe top 262px at scroll 0, -337px after 600px, -762px after 1400px (viewport 900). Preview scrolls out of view; after + Add on lower cards it cannot be seen in place. `sticky-600.png`, `sticky-1400.png` |
| **Live Preview chart clipped (new, CG-R2-1)** | **FAIL** | In the preview the Skill strength proficiency bars run off the right edge: 3-4 of 5 segments visible, per-row level labels (Expert/Advanced) not visible. Text exists in the DOM, so scripted text checks pass; visually the chart is clipped. Present in round 1 screenshots too. `j2-2.png` |
| Phone width 390px (round 1 failure) | pass | scrollWidth 390, no overflowing elements, one-column stack, cards readable, preview 318px wide below the gallery (reachable by scrolling, not beside) `phone-1.png`, `phone-3-added.png` |

## Open bugs

- **chart-gallery-B9** (two-step pick then Add): the spec's flow (click card to expand, set options, + Add) works; card collapses and the row appears. Verified, not a recurrence.
- **chart-gallery-B10** (builder shortcut in setup): preconditions were created through Manual Intake as the spec now says, and the counts match (Skills 4, Jobs 3, Tools 2, Engagements 1). Verified.
- **CG-R1-1** (sticky preview): NOT fixed in the tested commit. Recurs (`recurrenceOf: CG-R1-1`).
- **CG-R1-2** (HTTP status in failed-load alert): NOT fixed in the tested commit. Recurs (`recurrenceOf: CG-R1-2`).
- The fix branch `release-loop/chart-gallery-fix-r1` was not merged into `a207b21`, so none of its changes were exercised.

## Console errors and failed requests

- `external_blocked` only: Google Fonts `ERR_CERT_AUTHORITY_INVALID`, cdnjs three.js `ERR_TUNNEL_CONNECTION_FAILED`.
- Page errors: none.
- HTTP 500 on `/api/career/proficiency` and matching console errors occurred only in the injected failed-load tests.
- `net::ERR_ABORTED` on `/api/career-agents/agent-hub` and `/api/career-agents/opportunities` (one each, navigation aborts; no visible effect; noted only).

## Notes

- Ambiguity: spec J2 step 1 says "Click the card (not its Add button)". The cards now show "+ Add" with "Click card to customize"; clicking the card expands it, so this was followed literally with no issue.
- On phone, the preview sits below the gallery rather than beside it; the "Live Preview beside" requirement applies to desktop.

## Cleanup

Server on port 8702 stopped, database `sb_rl_val_8700_1` dropped.
