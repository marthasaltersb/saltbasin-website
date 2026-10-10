# Triage: resume-rollups, round 3

Release 2026-10-02-application-packages-resume. Baseline v2 unchanged since round 2. Validator tested head 47ee197; the triage worktree reset to integration head 160edab. No code or spec changed here. Checked at 160edab: `src/lib/resumeUrls.js`, `src/components/admin/MyResumePanel.jsx` and `server/routes/outputTemplates.js` have no commits touching the relevant lines since the round 1 report (last commits to resumeUrls.js / outputTemplates.js predate the release), so both fixes are still absent. Both items are the SAME bugs as round 1 and round 2 (ids reused, third occurrence). Neither was ever put into a fix agent's list or was dropped; the fix round must include them explicitly and verify by diff.

| Id | Step | Class | Root cause |
|---|---|---|---|
| RR1-3 (recurred x2) | J12.1 | defect | My Resume layout, preview and full-tab links omit `owner=me` |
| RR1-4 (recurred x2) | E.4 | defect | `GET /api/output-templates/:id/public` returns 404 for the synthetic `preset-default` id |

## RR1-3 [J12.1] Output opened from My Resume shows the platform owner's data (defect, recurred)
Reproduction (code trace plus validator evidence): UI path My Resume > Preview PDF > Modern SB > full tab.
- `src/lib/resumeUrls.js` lines 1-7 (`LAYOUT_URLS`) and 9-20 (`resumeUrlFromPreset`) build `/output/resume?layout=modern` with no owner.
- `MyResumePanel.jsx`: `LAYOUTS[].url` at lines 54, 80, 106; `previewUrl` initial state line 577; `presetPreviewUrl` line 215-217; full-tab link line 1201; iframe line 1204; print fallback `window.open(previewUrl)` line 920; button highlight `LAYOUTS.find(l => l.url === previewUrl)` lines 1196-1199.
- `Output.jsx` `useOutputOwnerSlug()` (line ~1148-1150) returns '' without `owner`/`profile`; lines 1176, 1222-1231 then call `/api/career/master`, `/api/career/rollups` without owner, and the published (not member draft) site. `resolveOwnerUserId` (`server/routes/careerMaster.js` ~559-568) falls back to the default admin, so the signed-in member sees BETSY SALTER with em-dash tiles.
- Server and data are correct: with `&owner=me` typed by hand every J12.1 expectation matched (validator observation).

Fix:
1. `resumeUrlFromPreset(preset, { includePresetId, owner })`: when `owner` is set push `owner=${encodeURIComponent(owner)}` onto `params` (joining with `?`/`&` as the function already does for the bare classic URL).
2. `MyResumePanel.jsx`: `presetPreviewUrl` passes `owner: 'me'`. Apply `owner=me` to every `LAYOUTS[].url` used for preview (a helper `withOwnerMe(url)` applied where `setPreviewUrl`, the initial state, the iframe, full-tab link, print fallback and the highlight comparison use them, so `LAYOUTS.find(l => l.url === previewUrl)` still matches; simplest is to store the owner-qualified URL in `LAYOUTS` for member-scoped use and keep line 887's "Public link" on the unqualified URL).
3. Leave `primaryResumeUrl` and the public site-owner link without `owner`.
4. Re-verify desktop and the 390px tap path: the opened URL contains `owner=me` and shows ARR AUTOMATED, EXIT SIGNAL $250M, ... tiles.

The step stands as written (interface parity: UI path must reach the member's data). A hand-typed URL without owner shows the owner's resume by design.

## RR1-4 [E.4] 404 on `/api/output-templates/preset-default/public` (defect, recurred)
- `MyResumePanel.loadPresets()` lines 689-695 synthesise `{ id: 'preset-default' }` when the member has no saved presets; `presetPreviewUrl` adds `preset=preset-default`.
- `Output.jsx` line 1224 fetches `/api/output-templates/preset-default/public`.
- `server/routes/outputTemplates.js` lines 116-130: `GET /:id/public` returns 404 both when no row exists and when the preset is not `portfolioVisible`. The client tolerates `{template:null}` (`.catch`), so the only effect is console/network noise, which E.4 does not allow.

Fix (preferred, server): in `GET /:id/public` return `200 { template: null }` for both "not found" and "not portfolio-visible" (reveals nothing the 404 did not). Confirm the Output.jsx caller treats `{template:null}` as the no-template case (it already falls through to the primary template/default). Alternative (client): in `Output.jsx` skip the fetch when `presetId === 'preset-default'`. Do not widen the E.4 allowance.

## Validator observations
- Handed-over fixes B3/J7.3, B8, B12, B13, RR1-1, RR1-2/J9.5, MCP tools: passing. Nothing to do.
- B10 "0 Expert - 2 skills" despite hand-set Expert: matches spec text. Not a failure; the owner question from round 2 is still open (needs_business_definition, observation only): "On the Capability Confidence bars, should a skill whose proficiency tier was set by hand to Expert count toward the 'N Expert' figure, or only skills whose tier is computed by the methodology?"
- B5/B11/RR1-6 (block picker, output column count): coverage_gap RR1-6 from round 1 stays open with its amendment pending; nothing new.
- Mobile output header "SALTBASIN.NET - RESUME - MODERN" clipped by the Print button: cosmetic, outside the baseline, no step. Polish item for the owner (suggest `flex-wrap` or truncating the header text at 390px).
- Proposed amendment P.1 ("admin test user" -> "member test user"): already proposed in rounds 1 and 2 (spec_error, wording); belongs to the amendment reviewer, restated below as an item, not a product failure.
- Proposed amendment J12.1 (state the output is reached through My Resume and opens the member's data): not needed. After RR1-3 is fixed the step as written passes through the UI path, and "member's own configured tiles" is already in the step. Rejected as a triage recommendation; reviewer decides.
