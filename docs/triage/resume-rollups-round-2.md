# Triage: resume-rollups, round 2

Release 2026-10-02-application-packages-resume. Integration head 47f12e3. No code or spec changed. The task listed no earlier triage items, but `docs/triage/resume-rollups-round-1.md` exists and both failures are recurrences of its items RR1-3 and RR1-4. The ids are reused. Neither was in round 1's fix list. Checked at 47f12e3: `src/lib/resumeUrls.js`, `MyResumePanel.jsx` and `server/routes/outputTemplates.js` are unchanged in the relevant lines. No amendments decided.

| Id | Step | Class | Root cause |
|---|---|---|---|
| RR1-3 (recurred) | J12.1 | defect | My Resume layout, preview and full-tab links omit `owner=me` |
| RR1-4 (recurred) | E.4 | defect | `GET /api/output-templates/:id/public` returns 404 for the synthetic `preset-default` id |

## RR1-3 [J12.1] Resume output opened from My Resume shows the admin's data (defect, recurred)
Reproduction by code trace. The UI route is My Resume > Preview PDF > Modern SB > full tab.
- `MyResumePanel.jsx` line 892 sets `previewUrl` from `presetPreviewUrl(primaryPreset)` (line 215), which calls `resumeUrlFromPreset` in `src/lib/resumeUrls.js` (`LAYOUT_URLS`, lines 1-7 and 9-20).
- The `LAYOUTS[].url` constants (about lines 54, 80, 106) and the "full tab" link and iframe (lines 1199-1204) also point at `/output/resume?layout=...`.
- None of them adds `owner=me`.
- `Output.jsx` `useOutputOwnerSlug()` (about line 1148) returns '' when neither `owner` nor `profile` is present.
- `/api/career/rollups`, `/api/career/resume-rollups` and the career master fetch then fall back through `resolveOwnerUserId` (`server/routes/careerMaster.js`, about lines 559-568) to the default admin. The signed-in member sees the platform owner's resume.
- The validator's observation matches: adding `&owner=me` by hand shows every expected tile. The data and server are correct; only the link is wrong.
- Line 577 `previewUrl` initial state and the print fallback `window.open(previewUrl)` (line 920) carry the same URL.

Fix:
1. Give `resumeUrlFromPreset` an `owner` option that appends `owner=me`. Use `base.includes('?') ? '&' : '?'` joining, because the bare classic URL has no query.
2. In `MyResumePanel.jsx`, pass `owner: 'me'` from `presetPreviewUrl`.
3. Add `owner=me` to `LAYOUTS[].url`, either at use sites or with a helper. This keeps `LAYOUTS.find(l => l.url === previewUrl)` and the highlighted button (lines 1196-1199) working.
4. Cover the initial state, the full-tab link, the iframe and the print fallback.
5. Leave the public site-owner link, line 887 and `primaryResumeUrl` for the public site, without `owner`.
6. Re-check that the mobile 390px tap path opens the member's resume.

The step stands. The UI path then reaches the member's data, as intended by interface parity v3. A hand-typed `/output/resume?layout=modern` still shows the platform owner's resume by design, because an anonymous URL has no owner. The validator should keep following the UI path.

## RR1-4 [E.4] 404 on `/api/output-templates/preset-default/public` (defect, recurred)
- `MyResumePanel.loadPresets()` (lines 689-695) synthesises `{id:'preset-default'}` when the member has no saved presets. `presetPreviewUrl` then puts `preset=preset-default` in the URL.
- `Output.jsx` (about line 1224) fetches `/api/output-templates/preset-default/public`.
- `server/routes/outputTemplates.js` lines 120-131 answer 404 when no row exists, and also when the row is not `portfolioVisible`.
- The client already tolerates `{template:null}` through its `.catch`, so the only effect is console and network noise. E.4 allows only the listed items.
- Round 2 desktop was clean and mobile was not. The cause is whether the member has a saved preset at the time. The 404 depends on state, not timing. It is not flaky.

Fix (preferred, server): in `GET /:id/public`, return `200 { template: null }` for "not found" and for "not portfolio-visible". This reveals nothing the 404 did not. Check that the Output.jsx caller treats `{template:null}` as the no-template case. Alternative (client): skip the fetch in `Output.jsx` when `presetId` is the synthetic `preset-default`. Do not widen the E.4 allowance.

## Validator observations
- E.3 is listed as failed in the round-2 report (AMBIGUOUS, F2) but was not in this triage list. The wording amendment the validator proposed, "every computed tile", belongs to the amendment reviewer. It is not decided here.
- P.1 names the admin test user, but the screen exists only for members. Wording amendment proposal: the member user. It was also noted in round 1. Class spec_error. It is not a failure of the product.
- B10 owner=me output shows Strategy & Advisory "0 Expert - 2 skills" although Stakeholder alignment was hand-set to Expert. This matches the spec text. Whether bars should count the hand-set tier is a business rule, so it is not a defect. See the question below.
- B5, B11, RR1-6 and F1-3 have no baseline step. Coverage gap RR1-6 from round 1 is still open with its amendment pending. Nothing new is added.
- Mobile output header text "SALTBASIN.NET - RESUME - MODERN" is clipped by the Print button. Outside the baseline and cosmetic. No step. Mention it to the owner as a polish item.
- The overwritten desktop-E_3 and desktop-E_4 screenshots are a harness issue only. No item.
- Fixed and passing: RR1-1, RR1-2 and J9.5 (as a reload check), RR1-5 MCP, B3, B12 and B13.

## Proposed amendments
1. P.1 (spec_error, wording). Before: "admin test user". After: "member test user". Traces to: the change spec, where Proficiency & Rollups is a member screen. Why: the admin World Shell has no such card, so the step cannot be followed as written.

## needs_business_definition (observation only, not a failure)
B10 question for the owner: "On the Capability Confidence bars, should a skill whose proficiency tier was set by hand to Expert count toward the 'N Expert' figure, or only skills whose tier is computed by the methodology? Today the bar for Strategy & Advisory shows '0 Expert - 2 skills' while one of those skills is hand-set to Expert."
