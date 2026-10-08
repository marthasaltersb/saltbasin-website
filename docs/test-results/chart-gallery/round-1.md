# Test result — chart gallery, round 1

Feature: Visual chart gallery in the Output Template editor · Round 1 · Commit tested: `3fdc308` (integration head `claude/zealous-meitner-5tuft5`) · Date: 2026-10-08 (sandbox clock; current year per spec assumption 2026 holds, Forecast modeling = 13 yrs) · Spec: `docs/training/chart-gallery.md` v1.

Method: production build served on port 4306 against a fresh database; logged in through the login form as the ready test member; preconditions entered through Career Master -> Manual Intake (4 skills, 2 tools, 3 roles, 1 case study); journeys driven by clicking from the World Shell in Chromium (Playwright). Screenshots and `steps.jsonl`: `/var/tmp/sbpg/release-loop/chart-gallery/round-1/`.

Result: **FAILED** (all 16 literal journey steps pass; the edge cases and regression-gate checks produce 3 failures).

## Journey steps

| Step | Result | Seen | Screenshot |
|---|---|---|---|
| J1 1.1 heading, career section, six cards in order with thumbnails/"Best for"/+ Add, Classic charts, Live Preview visible, no alert | pass | 12 "Best for", 12 + Add, order correct, no alert | j1-1.png, j1-1b.png |
| J1 2.1 thumbnails: dots Forecast modeling 13 yrs first; Software 67% / Logistics 33%; $40M+ and 35% | pass | as expected | j1-2.png |
| J2 1.1 Proficiency Tiers expands (Show, Group, Top rows 10, footnote ticked, Title) | pass | | j2-1.png |
| J2 2.1 Skills only, Top 4, title, + Add: row "1. Skill strength", preview SKILL STRENGTH, 4 rows, legend, no dagger | pass | | j2-2.png |
| J3 1.1 override toast | pass | "Forecast modeling set to Advanced (marked †)" | j3-1-toast.png |
| J3 2.1 preview row with dagger and footnote | pass | | j3-2.png |
| J3 3.1 / 3.2 footnote untick/tick | pass | | j3-3a.png, j3-3b.png |
| J3 4.1 / 4.2 Top rows 2 then 4, Done | pass | | j3-4a.png, j3-4b.png |
| J4 1.1 six rows, all five charts in preview with expected values | pass | | j4-1.png |
| J5 1.1 move up row 2 -> "1. Trend Bars" | pass | | j5-1.png |
| J5 2.1 remove last: 5 rows | pass | | j5-2.png |
| J6 1.1 save toast and preset listed | pass | | j6-1.png |
| J6 2.1 reload: 5 rows, same order, no alert | pass | | j6-2.png |
| J6 3.1 cleanup Use formula | pass | | j6-3.png |

## Edge cases

| Case | Result | Seen |
|---|---|---|
| Empty member: sentence per card, add works, preview shows sentence | pass | `edge-empty*.png` |
| Top rows blank falls back to default | pass | 6 rows shown (`edge-topblank.png`) |
| Classic Bar Chart / Gauge: + Add disabled without a source | pass | empty member: those two flags disabled |
| Failed load: alert names data, "loading error, not missing Career Master data", Retry, cards show message; Retry recovers | pass | `edge-failedload.png`, `edge-retry.png` |
| **Failed load: alert includes the HTTP status** | **FAIL** | Real HTTP 500 JSON response: alert reads "proficiency (simulated outage). This is a loading error, not missing Career Master data." No "500" anywhere. With an empty 500 body it reads "(Unexpected end of JSON input)". The spec says "with the HTTP status". |

## Regression-gate checks

| Check | Result | Seen |
|---|---|---|
| **Live Preview stays visible beside the gallery (change spec "sticky preview")** | **FAIL** | A sticky ancestor (`top:0`) exists but the preview scrolls away: iframe top -337px after 600px scroll, -995px after 1400px (viewport 900). After + Add on a lower card, or Edit on a configured row, the preview cannot be seen without scrolling back up, so the J2/J3 "preview changes" cannot be observed in place. `sticky-600.png`, `sticky-1400.png`, `j4-1.png` |
| **Phone width 390px** | **FAIL** | No horizontal page scroll, but content is clipped on the right: gallery cards and inputs extend to ~545px, Preset Info inputs and tab pills are cut off, and the Live Preview iframe sits at x=565..945, unreachable. `phone-1.png`, `phone-2-open.png`, `phone-3-added.png`, `phone-full.png` |

## Console errors and failed requests

- `external_blocked` only: `ERR_CERT_AUTHORITY_INVALID` (Google Fonts) and `ERR_TUNNEL_CONNECTION_FAILED` (cdnjs three.js).
- Page errors: none.
- HTTP 500 on `/api/career/proficiency` and matching console errors occurred only during the failed-load test, where the outage was injected deliberately.
- `net::ERR_ABORTED` on `/api/career-agents/agent-hub` and `/api/career-agents/opportunities` (one each): requests aborted by page navigation; no visible effect. Noted, not counted as failure.
- `steps.jsonl` holds the phone failure twice (script plus summary pass); same finding.

## Notes

- A previous, interrupted attempt of this validation (old database, no report) left evidence in `/var/tmp/sbpg/release-loop/chart-gallery/round-1-attempt0/`; this round was rerun from a fresh database and does not rely on it.
- Preconditions saved through Manual Intake: Skills 4, Jobs 3, Tools 2, Engagements 1.
- Fix details received: none (round 1).

## Cleanup

Server on port 4306 stopped; database `sb_rl_val_4300_3` dropped.
