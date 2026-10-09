# Triage — chart gallery, round 2

Tested commit `a207b21`; triaged against integration head `7fb1525`. Validator report: `docs/test-results/chart-gallery/round-2.md`. Analysis from code and the round-2 screenshots; no code changed.

## Summary

| id | step | class | recurrence |
|---|---|---|---|
| CG-R1-1 | Live Preview stays visible beside gallery | defect | recurs (fix exists, unmerged) |
| CG-R1-2 | Failed-load alert includes HTTP status | defect | recurs (fix exists, unmerged) |
| CG-R2-1 | Live Preview proficiency chart clipped | defect | new |

## Process finding (root of the two recurrences)

Branch `release-loop/chart-gallery-fix-r1` (commit `dc6b5f0`, "Salvaged partial fix from a stopped agent (untested)") holds fixes for CG-R1-1 and CG-R1-2 but was never merged into the integration branch (`git merge-base --is-ancestor` confirms it is not in HEAD). Round 2 re-tested unchanged code. Merge it and re-validate. The branch also carries unrelated hunks (`careerAtomMigration.js`, `careerMaster.js`, an `atomSyncError` toast in `src/lib/api.js`); confirm they are intended before merging.

## CG-R1-1 — Preview scrolls away (recurrence of CG-R1-1)

- Class: defect. File: `src/components/admin/OutputTemplateConfigurator.jsx` lines 111 (Hub wrapper) and 321 (configurator wrapper); sticky column at line 653.
- Root cause: both wrappers are `flex:1; overflowY:'auto'` with no bounded height, nested inside the shell scroller (`WorldShell.jsx` `embedBody`, `overflowY:auto`). `position: sticky` binds to the nearest ancestor with non-visible overflow, which is the inner wrapper. That wrapper never scrolls (it grows to content height), so sticky has nothing to stick against and the column scrolls away with the real scroller. Matches measurements: iframe top 262, -337, -762.
- Fix (already on fix branch): remove `flex:1; overflowY:'auto'` from both wrappers so sticky binds to the real scroller; sticky only when not `narrow`; iframe height `min(640px, calc(100vh - 3.5rem))`; `minWidth:0` on grid children. Re-validate by scrolling the real scroller and checking the iframe top stays inside the viewport at 600 and 1400 px, in both World Shell and Admin Shell hosts.

## CG-R1-2 — Failed-load alert has no HTTP status (recurrence of CG-R1-2)

- Class: defect. File: `src/components/admin/OutputTemplateConfigurator.jsx` line 199 (`settle('proficiency', api.getCareerProficiency(), ...)`).
- Root cause: rollups and master go through `loadJson()`, which throws `HTTP <status> ...`, but proficiency goes through `api.getCareerProficiency()` and so `src/lib/api.js` `request()` (lines 12-20). That helper parses the body first (`res.json()` throws "Unexpected end of JSON input" on an empty 500) and otherwise throws only `body.error`, never the status. Hence "proficiency (simulated outage)" or "(Unexpected end of JSON input)". Status handling covered only 2 of 3 sources.
- Fix (already on fix branch): load proficiency via `loadJson('/api/career/proficiency?period=current')`, and have `loadJson` append the JSON `error` detail when present ("HTTP 500 Internal Server Error - simulated outage"). Confirm the URL matches what `api.getCareerProficiency` sends. Optional hardening: make `api.js request()` tolerate empty/non-JSON error bodies and include the status in the message for all callers.
- Re-validate with a JSON-body 500 and an empty-body 500; the alert must contain "500".

## CG-R2-1 — Live Preview proficiency bars clipped (new)

- Class: defect (rendering). File: `src/lib/careerCharts.js` line 112, in `proficiencyBarsHtml`.
- Root cause: the SVG is emitted with `style="display:block;max-width:100%;min-width:500px"` and a viewBox about 560-640 wide. `min-width:500px` overrides `max-width:100%`, so inside the Live Preview column (about 380px iframe, roughly 280px of content) the SVG stays 500px wide and runs past the right edge, where the page clips it. Only 3-4 of 5 segments show and the level labels are cut off. The gallery thumbnail scales the same HTML in a differently sized box, so it looks fine. The text remains in the DOM, which is why scripted text checks passed; this is a visual failure only. Round 1 screenshots show the same.
- Fix: remove `min-width:500px` so the viewBox scales to the container (labels get small but stay visible), or wrap the SVG in an `overflow-x:auto` container so it scrolls instead of clipping. Check other chart helpers in `careerCharts.js` for the same fixed-width pattern. Re-validate visually: all 5 segments and level labels visible in the preview column and the Output page print view.
- Spec change: J2 2.1 in `docs/training/chart-gallery.md` should say all five segments and the level labels are fully visible inside the preview with no clipping at the right edge, so a DOM-text check cannot pass a clipped chart.

## Environment / business definition

None. No `needs_business_definition` items.
