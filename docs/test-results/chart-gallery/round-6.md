# Test result — chart-gallery — round 6

Commit tested: `c738308d0778ada111a2bebbf980672b20a885c5` (integration head `claude/zealous-meitner-5tuft5`). Release 2026-10-10-production-hardening-resume. Validator: round 6 (database `sb_rl_val_5700_1`, port 5702, production build served by Express, Chromium via Playwright, light scheme, en-US, TZ=UTC). Evidence: `/var/tmp/sbpg/release-loop/chart-gallery/round-6/` (steps.jsonl and screenshots).

## Score (from `release-spec-baseline.mjs score`, copied verbatim)

```json
{
  "feature": "chart-gallery",
  "baseline": 3,
  "specSha256": "829b2c1b808a5594b1103d50644ae9237c49ba58f40a8355738a2f4a90877b44",
  "total": 20,
  "passed": 18,
  "failed": ["J2.3", "E.4"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: NOT PASSED (18/20). `baseline check` passed ("baselines match: chart-gallery v3"). Baseline v3 is newer than the one round 5 used (v2); `diff` output: comparable 23; same: P.1-P.4, J1.1, J1.2, J2.1-J2.3, J3.1-J3.4, J4.1, J5.1, J5.2, J6.1-J6.3, E.1-E.4; changed: E.5 (now names both ERR_CERT_AUTHORITY_INVALID and ERR_TUNNEL_CONNECTION_FAILED); added none; retired none. The 18/20 is therefore like for like with round 5.

## Per-step results

| Step | Desktop | Mobile (390x844, touch) |
|---|---|---|
| P.1-P.4 (setup, once, through Career Master > Manual Intake) | pass | n/a (setup) |
| J1.1, J1.2 | pass | pass |
| J2.1, J2.2 | pass | pass |
| J2.3 | pass | FAIL (MOBILE_GAP) |
| J3.1-J3.4 | pass | pass |
| J4.1 | pass | pass |
| J5.1, J5.2 | pass | pass |
| J6.1-J6.3 | pass | pass |
| E.1, E.2, E.3 | pass | pass |
| E.4 | FAIL | FAIL |
| E.5 | pass | pass |

## Failures

1. **J2.3 (mobile) — MOBILE_GAP: admin shell cannot reach Output Templates at 390px.** Signed in as the admin, World Shell > Classic Tools opens the admin shell. At 390px only the default group's sub-tabs (Leads, Commercial Opportunity Pipeline, Lead-to-Revenue Diagnostic, Career Reasoning Compiler) are visible. The group buttons (Network Relationship Management ... Publication) are in the DOM but render at 0x0, and there is no menu control, so "Admin -> Output Templates" cannot be tapped. Desktop J2.3 passes. Screenshot `mobile-J2.3-no-nav.png`. Maps to open bugs F3-3, F5-5, F5-9: still open, root cause unchanged (AdminShell has no mobile navigation markup).
2. **E.4 (desktop and mobile) — the Capacity Gauge shows no number for an empty member.** The Bar Chart (Horizontal) and (Vertical) **+ Add** are disabled and the gauge **+ Add** is enabled, as specified. But the gauge thumbnail and the preview after adding show only the arc and the label "ROLES HELD". The spec expects the number 0. The value element is rendered empty: `<div style="font-size:1.3rem;font-weight:700;..."></div>`. This matches the falsy-text defect (numeric 0 becomes ''). Screenshots `desktop-E.4-classic.png`, `desktop-E.4-gauge-preview.png`, `mobile-E.4-*.png`. Maps to open bugs F3-5 and F5-6 (src/lib/outputBlocks.js `interpolate()`): NOT fixed.

## Fix verification (by baseline step id)

| Bug | Step | Round 6 |
|---|---|---|
| F4-1 (retesting), F5-4, F3-4, CG-R2-1 (preview chart clipped, min-width 500px) | J2.2 (phone and desktop) | VERIFIED. In the preview iframe the svg is 280px wide inside a 378px column (min-width 0px), no horizontal overflow (docScrollW = clientW = 378). All five segments, level labels and the complete legend are visible on both surfaces. |
| F2-8, CG-R2b-6 (sticky preview, only one host exercised) | J2.2 (World Shell host) and J2.3 (admin shell host, desktop) | VERIFIED on desktop in both hosts. World Shell at 1400px: preview top stays at 152px after scrolling. Admin shell: scroller DIV.sb-admin-scroll scrolled to its maximum of 1280px (the page cannot scroll 1500px), preview top 339 -> 159, inside the window and beside the gallery. |
| CG-R2b-4 (phone preview below gallery) | J1.1, J2.2 | VERIFIED: at 390px and at a 600px window the preview sits below the gallery with no overlap. |
| F3-3, F5-5, F5-9 (admin shell on mobile) | J2.3 mobile | STILL FAILING (failure 1). |
| F3-5, F5-6 (falsy 0) | E.4 | STILL FAILING (failure 2). |
| F3-7 (aria-label "Edit <title>" vs visible "Done") | J3.3/J3.4 | VERIFIED: the control is found by accessible name Edit and, once open, by name Done. |
| F4-7, CG-R4-4 (E.5 wording) | E.5 | VERIFIED: with baseline v3 only external-resource codes ERR_CERT_AUTHORITY_INVALID and ERR_TUNNEL_CONNECTION_FAILED are excused. Observed: 35 external errors (cdnjs three.js, fonts.gstatic.com), 0 page errors, 0 failed same-origin requests outside E.2's injected 503. |
| CG-R2b-1 (Classic bar charts disabled for an empty member) | E.4 | The disabled bar charts and the enabled gauge behave as spec v3 says; the gauge number is the failure above. |
| F2-2, F3-8, F5-8 (atom sync "boolean bound to ::jsonb") | outside the gallery (P.1) | STILL REPRODUCES: server log shows `[careerMaster] atom sync failed: cannot cast type boolean to jsonb` once during the P.x Career Master writes (the record still saved and the gallery works). No baseline step covers it (see observations). |
| F3-6, F5-7 (MCP parity) | all | PARTLY FIXED. Present and consistent with the UI: `proficiency_rules_read` (matches the Rules & why table), `career_master_read` (matches), `output_templates_list` / `output_templates_primary_read` (empty, matching the UI with no preset), `output_template_create` / `output_template_update` / `output_template_delete`, `career_proficiency_override_save` / `_clear`, `career_record_create`. NEW MCP_GAP below. |
| F2-7, B10 (setup shortcuts), B9 (two-step pick then Add) | process | Not shortcut this round: preconditions created through Manual Intake, fresh database, no seed shortcuts. The "pick then Add" flow is the spec's own J2 flow and works as written. |

## MCP / interface parity

- **MCP_GAP: `career_rollups_read` returns different data from the UI.** The gallery's career charts read `GET /api/career/rollups?owner=me` (Roles Held 3, Skills Tracked 4, Tools 2, Case Studies 1, plus category/industry groups). The tool (`server/lib/mcpRouteTools.js` line 67) is registered with an empty input schema, cannot send `owner=me`, and returns the owner-less result: all totals 0 and no groups, for the same signed-in member. An agent cannot read the data that feeds the Classic charts (Bar Chart, Capacity Gauge). Maps to E.4 and J4.1 (Classic chart data).
- Desktop and mobile were both walked point-and-click. The only non-UI setup was `scripts/create-test-member.mjs` (two members: member@test.local with data, empty@test.local for E.1/E.4). The MCP token was created through World Shell > Journeys > Connected Agents.
- E.2 was driven by injecting an HTTP 503 on `/api/career/proficiency` with Playwright request interception; the UI showed the alert and Retry recovered it.
- Admin steps used the admin account; J2.3 mobile could not run (failure 1).

## Observations (not scored)

- Tiny label size on a phone: the Skill strength chart's row and level labels are roughly 5-6px effective at 390px. They are complete and unclipped (J2.2 passes) but hard to read.
- Preview row order: the Skill strength rows appear as Forecast modeling, Process design (points order) while the spec lists Process design first. The spec lists the rows without stating an order, so this was scored as pass.
- Admin shell, desktop and mobile: the "Back to World" button overlaps the site logo at the top-left (`desktop-J2.3-scrolled.png`, `mobile-J2.3-no-nav.png`).
- World Shell > Connected Agents shows the MCP address as `http://localhost:5173/mcp` although the app is served on port 5702. The address display looks tied to the dev port.
- Seed prints a Postgres error trace at the end of `npm run seed` ("check_for_column_name_collision") before "[seed] Done." against the fresh database.
- Proposed amendment for E.5: state that console and HTTP errors that are the direct result of the failure injected for E.2 are excused, so E.2 and E.5 cannot contradict each other (the E.2 503 produces a console "Failed to load resource" and the page's own "Output template: loading proficiency failed" message). Scored as pass this round on that reading.
- Proposed amendment for J2.3: the step says to scroll the real scroller down 1500px; the admin shell's scroller can only scroll 1280px. Suggest "scroll to the bottom of the page".
- Gallery thumbnail for Industry Share Bars leaves a large empty area under two bars (cosmetic).
- Test harness note: between the desktop and mobile walkthroughs the saved preset was removed through the UI (Delete) so that both started from the same state; preset persistence was verified in J6.2 first.

## Cleanup

Server stopped by PID file, database `sb_rl_val_5700_1` dropped. No product code, spec or baseline file was changed.
