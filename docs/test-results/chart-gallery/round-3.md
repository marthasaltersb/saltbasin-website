# Test result — chart gallery, round 3

Feature: Visual chart gallery in the Output Template editor · Round 3 · Commit tested: `f16b238` (integration head `claude/zealous-meitner-5tuft5`) · Date: 2026-10-09 (sandbox clock; year 2026, Forecast modeling = 13 yrs) · Spec: `docs/training/chart-gallery.md` baseline v2 (amendment A1).

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

`release-spec-baseline.mjs check --feature chart-gallery`: `baselines match: chart-gallery v2`. No product fixes this round; the only change since round 2 is the approved amendment A1.

Result: **FAILED** (3 baseline steps fail).

## Baseline diff v1 -> v2 (`release-spec-baseline.mjs diff`)

Comparable 21. Same: P.1-P.4, J1.2, J2.1, J2.2, J3.1-J3.4, J4.1, J5.1, J5.2, J6.1-J6.3, E.1, E.2, E.3, E.5. Changed: J1.1, E.4. Added: J2.3. Retired: none. Round 2 scored 16/19 on baseline v1; this 17/20 is on v2, so compare by id, not by count.

## Method

Production build, `node server/index.js` with NODE_ENV=production on port 5710, fresh database `sb_rl_val_5700_5` (booted once, `npm run seed`, `scripts/create-test-member.mjs`). Chromium via Playwright, signed in through the login form, navigated by clicking (Journeys -> Output Templates -> Resume -> Infographics; Career Master -> Manual Intake for P.1-P.4). Desktop 1280x900, phone 390x844 (isMobile, hasTouch, taps), light scheme, en-US, TZ=UTC. Desktop member `member@test.local`; phone member `mobile@test.local` with its own P.1-P.4 entered on the phone UI; empty-member edge cases on `empty@test.local`; J2.3 as admin `betsy@test.local`. All accounts via `create-test-member.mjs` only. Screenshots and `steps.jsonl`: `/var/tmp/sbpg/release-loop/chart-gallery/round-3/`. E.2 outage was injected with Playwright route interception (as in round 2) and removed afterwards.

## Per-step results

| Step | Desktop | Phone (390px) |
|---|---|---|
| P.1-P.4 | pass | pass (entered on the phone) |
| J1.1 (amended: preview below the gallery at <=900px) | pass | pass |
| J1.2 | pass | pass |
| J2.1 | pass | pass |
| J2.2 | pass | **fail** |
| J2.3 (new) | **fail** | **fail** |
| J3.1-J3.4 | pass | pass |
| J4.1, J5.1, J5.2 | pass | pass |
| J6.1-J6.3 | pass | pass |
| E.1, E.2, E.3 | pass | pass |
| E.4 (amended) | **fail** | **fail** |
| E.5 | pass | pass |

## Failures

1. **J2.2 (phone)** — Expected: nothing clipped at the right edge, no horizontal scrollbar inside the preview. Seen: the Skill strength chart itself fits (svg 49-267 in a 316px column, preview below the gallery, no overlap) but the preview document is horizontally scrollable (scrollWidth 354 > clientWidth 316): footer author pills "CLAUDE (ANTHROPIC) — SECONDARY AUTHOR" and "DESIGN SYSTEM — CO-AUTHORED WITH CHATGPT" are cut off at the right edge. Unchanged from round 2 (MOBILE_GAP). Desktop passes: svg 49-329 in a 378px column, no overflow, sticky at 1400px (iframe stays at y=95 through the whole scroll), below the gallery at 600px (x=36, w=528) with no overlap. The 1400/600px resize clause cannot be exercised on the 390px phone surface. Evidence: `J2.2-preview-mobile.png`, `J2.2-chart-mobile.png`.
2. **J2.3 (desktop)** — Expected: signed in as admin, Admin -> Output Templates -> Resume -> Infographics, scroll the real scroller 1500px, Live Preview stays in view beside the gallery. Seen: reached via Classic Tools -> NETWORK RELATIONSHIP MANAGEMENT -> OUTPUT TEMPLATES. The admin workspace (`.sb-admin-workspace`, `overflow: hidden`, clientHeight 799, scrollHeight 2012) has no scroller at 1280x900: mouse wheel at four positions, the End key and direct scrollTop all leave every scrollTop at 0 and `window.scrollY` at 0. The preview iframe top stays at y=288 only because nothing can move, and the gallery below the first ~800px is clipped and unreachable (the `+ Add` buttons of 10 of the 12 charts sit at y>=954 in a 900px viewport, no scrollbar). Fails the "gallery taller than the window, scroll 1500px" premise and the regression-gate rule (clipped, unreachable content). Evidence: `J2.3-pre-desktop.png`, `J2.3-wheel-desktop.png`. Cause is in `AdminShell.jsx`/`adminStyles.js` (`workspace: overflow hidden`); the panel has no own scroll container at desktop width, and `brand.css` only makes the workspace `overflow-y: auto` at <=900px.
3. **J2.3 (phone) — MOBILE_GAP** — At 390px the admin shell hides its view selector (`.sb-admin-topbar-actions` is `display: none` at <=900px) and no menu button or drawer markup is rendered (`brand.css` has `.sb-admin-mobile-menu-button` / `.sb-admin-mobile-drawer` rules but `AdminShell.jsx` renders neither). Only the current view's sub-tabs (Leads, Commercial Opportunity Pipeline, Lead-to-Revenue Diagnostic, Career Reasoning Compiler) can be tapped, so Admin -> Output Templates cannot be reached on the phone. Evidence: `admin-classic-mobile.png`.
4. **E.4 (desktop and phone)** — Amended expectation: Bar Chart cards disabled for an empty member (they are: disabled, opacity 0.45), Capacity Gauge `+ Add` enabled (it is), and "for an empty member it shows the number 0". Seen: the gauge thumbnail and the Live Preview chart render an empty value element above "ROLES HELD" (empty `<div>`, dasharray `0,157`); no number at all. Likely a falsy-zero check. Evidence: `E.4-desktop.png`, `E.4-mobile.png`, `E.4-preview-desktop.png`.
5. **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist. Capabilities exercised with no MCP tool: read career proficiency (`GET /api/career/proficiency`), career rollups, Career Master, list/save output templates (`/api/output-templates`), set/clear a proficiency level override, create Career Master entries.

## Fixes verified by step id

| Item | Step | Result |
|---|---|---|
| A1: J1.1 reworded (preview below gallery at <=900px) | J1.1 | Passes on desktop and phone: preview at x=852 beside the gallery at 1280px; at 390px below the gallery (iframe y~3985), no horizontal overflow of the page. |
| A1: E.4 gauge expectation | E.4 | The enabled/disabled part matches the product; the "shows the number 0" clause fails (failure 4). |
| A1: new J2.3 sticky preview in admin shell | J2.3 | Fails on desktop (no scroller) and phone (page unreachable). |
| Round 2 phone preview footer overflow | J2.2 phone | Still failing (failure 1). |
| Round 2 sticky preview, World Shell host | J2.2 desktop | Still passes. |
| Round 2 E.2 status text | E.2 | Still passes on both surfaces. |

## Console errors and failed requests

- External font/CDN requests blocked by the sandbox are recorded as `external_blocked` only.
- This agent's surfaces show only the deliberately injected HTTP 500s on `/api/career/proficiency` during E.2 and the product's own "loading proficiency failed" console lines for them. No page errors, no other 4xx/5xx or failed app requests.

## Observations (outside any baseline step; not scored)

- `steps.jsonl` for this round also contains about 20 lines with no `surface` field and URLs on `localhost:10702` (failed `/api/career-agents/*`, `/api/commercial-opportunities/*`, `/api/career/proficiency` 500s with simulated outage). They were not written by this agent (port 5710); another validator process is writing to the same `round-3` directory. If it is a stale or duplicate run for this feature, disregard those lines.
- Spec J2.2 lists rows "Process design, Forecast modeling, ..." but before the J3.1 override the preview lists Forecast modeling first (13 yrs sorts above 11); after J3.1 the order matches. Treated as set membership, as in round 2.
- Preview chart row labels are tiny (about 5px at 378px, 4px on the phone); legible only zoomed.
- The "Done" button in the Configured-list edit panel is not found by role and exact name "Done" (lookup timed out); a visible-text match works.
- The page intro still says "Changes preview live on the right", untrue below the 900px breakpoint.
- In the admin shell at 1280x900 the whole Output Templates panel is clipped below about 800px, including the Configured list and Save & Set Primary, so they are unreachable by pointer there. Broader than J2.3's wording; recorded here.
- The preview footer author-pill overflow at 390px (failure 1) affects every output preview, not only this chart.

## Cleanup

REPL browsers and the server on port 5710 stopped via their PID files; database `sb_rl_val_5700_5` dropped.
