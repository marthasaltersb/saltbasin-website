# Test result — chart gallery, round 2

Feature: Visual chart gallery in the Output Template editor · Round 2 · Commit tested: `c3a71b4` (integration head `claude/zealous-meitner-5tuft5`) · Date: 2026-10-09 (sandbox clock; year 2026, Forecast modeling = 13 yrs) · Spec: `docs/training/chart-gallery.md` v1 (baseline v1, sha `819c4db02306c393b723a5d594373cf01f48c46b981354d933f27de5607c0554`).

Note: this file replaces an earlier, abandoned "round 2" report written against commit `a207b21` (before the fix branch merged); that run is not part of this score.

Method: production build on port 5702 against a fresh database (`sb_rl_val_5700_1`, booted, `npm run seed`, `scripts/create-test-member.mjs`). Chromium via Playwright; signed in through the login form, navigated by clicking from the World Shell (Journeys -> Output Templates -> Resume -> Infographics, Career Master -> Manual Intake for the preconditions). Desktop 1280x900 and phone 390x844 (isMobile, hasTouch, taps), light scheme, en-US, TZ=UTC. Desktop used `member@test.local`; the phone walkthrough used its own fresh member `mobile2@test.local` whose preconditions P.1-P.4 were entered on the phone UI (an earlier phone attempt on `mobile@test.local` created duplicate skills through my own re-run and was discarded); empty-member edge cases used `empty@test.local`. All created with `create-test-member.mjs` only. Screenshots and `steps.jsonl`: `/var/tmp/sbpg/release-loop/chart-gallery/round-2/`.

## Score (from `release-spec-baseline.mjs score`, verbatim)

```json
{ "feature": "chart-gallery", "baseline": 1, "specSha256": "819c4db02306c393b723a5d594373cf01f48c46b981354d933f27de5607c0554",
  "total": 19, "passed": 16, "failed": ["J1.1", "J2.2", "E.4"], "blocked": [], "notRun": [], "preconditionsFailed": [], "observations": [] }
```

Baseline check passed (`baselines match: chart-gallery v1`). Baseline version unchanged since round 1 (v1), so no diff table. Round 1's 17/20 was counted on a different step list and is not directly comparable by count.

Result: **FAILED** (3 baseline steps fail; plus one MCP gap).

## Per-step results

| Step | Desktop | Phone (390px) |
|---|---|---|
| P.1-P.4 preconditions (setup) | pass (UI, Manual Intake) | entered on the phone for the phone member; not scored separately |
| J1.1 | pass | **fail (AMBIGUOUS)** |
| J1.2 | pass | pass |
| J2.1 | pass | pass |
| J2.2 | pass | **fail** |
| J3.1 - J3.4 | pass | pass |
| J4.1 | pass | pass |
| J5.1, J5.2 | pass | pass |
| J6.1 - J6.3 | pass | pass |
| E.1 empty member | pass | pass |
| E.2 failed load | pass | pass |
| E.3 top rows blank | pass | pass |
| E.4 classic charts disabled | **fail** | **fail** |
| E.5 console | pass | pass |

## Failures

1. **E.4 (desktop and phone)** — Expected: Bar Chart and Capacity Gauge `+ Add` disabled until a roll-up source is available. Seen, empty member (no Career Master data): Bar Chart (Horizontal) and (Vertical) are disabled (opacity 0.45, not-allowed) but **Capacity Gauge `+ Add` is enabled** (disabled=false, opacity 1) and its thumbnail shows "ROLES HELD" with no number. `E.4-desktop.png`, `E.4-mobile.png`. Round 1 recorded the gauge as disabled; if the gauge now deliberately has its own count source, the spec wording needs an amendment, otherwise it is a regression.
2. **J2.2 (phone)** — Expected: nothing clipped and "no horizontal scrollbar inside the preview". Seen at 390px: the Skill strength chart itself fits (SVG 218px in a 316px column; preview sits below the gallery without overlap), but the preview document is horizontally scrollable (scrollWidth 354 > clientWidth 316): the standard footer author pills "CLAUDE (ANTHROPIC) — SECONDARY AUTHOR" and "DESIGN SYSTEM — CO-AUTHORED WITH CHATGPT" overflow and are cut off. Chart row labels render at about 4-5px. `J2.2-preview-footer-mobile.png`, `J2.2-preview-mobile.png`. (MOBILE_GAP: preview not clean at 390px.)
3. **J1.1 (phone) — AMBIGUOUS** — Step says the Live Preview is "visible on the right at the same time". At 390px everything else passes (six cards in order with drawn thumbnails, 12 "Best for", 12 `+ Add`, Classic section, no alert, no horizontal overflow) but the preview is below the gallery, about 4000px down. J2.2 of the spec accepts "below the gallery" for narrow windows. Proposed wording: "Expect the Live Preview column visible on the right at the same time (on screens narrower than about 900px, such as a 390px phone, it appears below the gallery and is reachable by scrolling)." The page intro copy also says "Changes preview live on the right", which is wrong on a phone.
4. **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist. Capabilities this spec exercises with no MCP tool: read career proficiency (`GET /api/career/proficiency?period=current`), career rollups (`/api/career/rollups`), Career Master (`/api/career/master`), list/save output templates (`/api/output-templates`), set/clear a proficiency level override, create Career Master entries (skills, tools, jobs, engagements).

## Open bugs from round 1: verification by baseline step

| Bug | Maps to | Result |
|---|---|---|
| CG-R1-1 sticky preview | J2.2 (sticky clause) | **Verified fixed on desktop.** At 1400px the preview iframe stays at y=95 beside the gallery through the whole scroll (gallery 1928px tall); at 600px it sits below the gallery (x=36, w=528) with no overlap. `J2.2-sticky-*`. |
| CG-R1-2 failed load shows HTTP status | E.2 | **Verified fixed** (desktop and phone): alert reads "proficiency (HTTP 500 Internal Server Error - simulated outage)...", and for an empty 500 body "(HTTP 500 Internal Server Error)" (no JSON parse text); card message includes the status; Retry recovers. |
| CG-R2-1 preview chart clipped by min-width | J2.2 visual clause | **Verified fixed on desktop** (SVG 280px in a 378px column, all five tier segments and level labels visible, legend complete, no horizontal scrollbar). On the phone the chart fits but the preview footer overflows (failure 2). |
| chart-gallery-B9 two-step pick then Add | J2.1, J2.2 | Verified: clicking the card expands it; options apply to the added row; Add collapses it and adds row "1. Skill strength". |
| chart-gallery-F2-8 sticky, only one host | J2.2 | **Not verifiable by a baseline step**: only the member World Shell host was exercised; the admin-scope host (`AdminShell`) is covered by no step. |
| chart-gallery-F2-2 unmerged hunks (careerAtomMigration jsonb cast, careerMaster atomSyncError) | none (setup) | No failure seen: all Manual Intake saves (skills, tools, jobs, engagements) succeeded on four members with no HTTP error. No baseline step asserts the sync itself. |
| chart-gallery-F2-7, chart-gallery-B10 validation-setup shortcuts | setup | Not repeated: every precondition was entered through the UI; no scripts, API calls or DB edits beyond `create-test-member.mjs`. |

## Console errors and failed requests

- `external_blocked` only: Google Fonts `ERR_CERT_AUTHORITY_INVALID`, cdnjs three.js `ERR_TUNNEL_CONNECTION_FAILED`.
- The only app errors are the deliberately injected HTTP 500 responses on `/api/career/proficiency` during E.2 (Playwright route interception, removed afterwards) and the console lines the product logs for them. No page errors; no other failed or 4xx/5xx app requests across all journeys.

## Observations (outside any baseline step; not scored)

- J2.2 lists rows "Process design (Expert), Forecast modeling (Expert), ..." but before the override the preview lists Forecast modeling first (13 yrs sorts above 11); after J3.1 the order matches. Treated as set membership, not order.
- Preview chart text is very small (about 5px row labels at 378px, 4px on the phone); legible only when zoomed.
- The preview footer ("Authored by Betsy Salter · Co-Authored with Claude ...", author pills) appears in a test member's output preview; it is standard output chrome, but it is what overflows on the phone.
- On the phone, an expanded gallery card keeps a two-column layout (thumbnail left, options right), so options are cramped and the Title placeholder is truncated; still usable.
- Page intro says "Changes preview live on the right", untrue below the desktop breakpoint.
- Capacity Gauge shows a "ROLES HELD" gauge with no value for an empty member (see E.4).

## Cleanup

Browser processes, the server on port 5702 and database `sb_rl_val_5700_1` removed at the end of the round.
