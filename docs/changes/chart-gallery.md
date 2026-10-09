# Change spec — visual chart gallery in the Output Template editor

Version 1 · 2026-10-02 · release `2026-10-02-chart-gallery` · branch `release-loop/chart-gallery-build`

## Traces to

- `docs/changes/proficiency-rules-and-live-qr.md` (v1, commits `a0ff84a`, `f1ad622`, `b1ae2d3`, `d502e1c`): builds on the career chart family in `src/lib/careerCharts.js`, the `career-*` block types, the proficiency resolution (`GET /api/career/proficiency`) and the Rules & why screen. This change fulfils that spec's known limitation "The Rules & why screen is not yet also mounted inside the Output Template editor".
- `docs/training/proficiency-rules-and-live-qr.md` (v1): the Rules & why journeys there still apply; this change mounts the same component in a second place.
- `docs/changes/failed-commands-reconciliation.md` and commit `8fc685e` ("No silent failures"): load failures here are shown, never turned into empty charts.
- Supersedes the old Infographics tab (a dropdown plus "+ Add", the picker described as unacceptable). No block type was removed: `bar-chart-h`, `bar-chart-v`, `capacity-gauge`, `venn-overlap`, `cert-badges`, `tool-usage-snapshot` stay available as "Classic charts", so saved presets keep rendering.
- Partial work reviewed and reused from an earlier stopped agent (never tested): `ChartGallery.jsx` and the Configurator diff. Reused after review; added the missing options (Top N, Show footnote), two new charts, the sticky preview and the fresh-database fix below.

## What changed

Output Template editor (World Shell -> Journeys -> Output Templates, also Classic Tools) now has, in one screen beside the live preview:

- **Infographics tab = chart gallery.** Each card shows a real thumbnail rendered from the member's own Career Master data (same renderer as the preview and the printed output). Cards: Proficiency Tiers, Trend Bars, Outcome Tiles, Career Timeline, **Skill Years Dots** (new), **Industry Share Bars** (new), then Classic charts.
- **Pick = configure in place = insert.** Click a card to open its options, press **+ Add** to insert it. A **Configured Infographics** list then lets you **Edit** options in place, reorder (up/down) or remove. Every change posts to the live preview within about a second.
- **Options per chart:** title (all), grouping (Proficiency Tiers: By individual / By category / By how it was used, plus Show: Skills + tools / Skills only / Tools only), Top N (Proficiency Tiers, Career Timeline, Skill Years Dots, Industry Share Bars), Show footnote (Proficiency Tiers, Outcome Tiles), series (Trend Bars), editable tiles (Outcome Tiles), data source (classic bar charts and gauge).
- **Rules & why tab** (fifth tab) mounts `ProficiencyRulesPanel`. Changing a rule or override refreshes both the preview and the gallery thumbnails.
- The preview column is sticky so it stays visible while scrolling the gallery.
- Load failures (Career Master, rollups, proficiency, presets) show an alert with a Retry button and a per-card message; they never render as an empty chart.

## Data model (additive only)

- No new tables. Infographic items keep the stored shape `{ id, blockType, sourceKey, params, order, visible }`; new `params` keys are optional: `maxItems`, `showFootnote`.
- `server/db.js`: `unified_outputs` gains `user_id BIGINT`, `is_primary BOOLEAN NOT NULL DEFAULT false` and index `idx_uo_user_type` (all `IF NOT EXISTS`). The routes already used these columns (the consolidation was applied to the live database out of band), but a fresh database lacked them, so presets could not be listed or saved there (HTTP 500). No existing row is touched.

## Server

- `server/routes/outputTemplates.js`: the previously silent `catch` blocks now log the error server-side (response codes unchanged).
- Block registry (`src/lib/outputBlocks.js`, append-only): new `career-skill-years-dots`, `career-industry-share`; new optional `maxItems` on `career-duration-timeline`, `showFootnote` on `career-proficiency-bars` and `career-outcome-tiles`.

## Client

- `src/components/admin/ChartGallery.jsx` (new): gallery, thumbnails, in-place option editor, configured list.
- `src/components/admin/OutputTemplateConfigurator.jsx`: gallery wired in, load-state/error handling, refresh of the preview iframe (`sb-output-data-refresh`), tab "Rules & why", sticky preview.
- `src/lib/careerCharts.js`: `skillYearsDotsHtml`, `industryShareBarsHtml`, `skillYearRows`, `industryShareRows`; Top N for the timeline; `showFootnote` for outcome tiles; outcome figure detection now keeps the plus sign ("$40M+", not "$40M" with a caption starting "+"). Colours follow the existing validated palette (single series in the first categorical slot, "Other" in the neutral grey, no generated hues).
- Reachability: World Shell Journeys "Output Templates" card (already registered) and Classic Tools. No navigation change was needed.

## Behaviour changes to know

- Adding a chart copies the card's current options; the card then closes and resets, so the same chart can be added again with different options.
- Outcome Tiles added from the gallery are pre-filled with the member's own quantified metrics and are editable.
- Skill Years Dots uses recorded Years Experience, else the current year minus First Used. Industry Share Bars counts whole years per role (minimum 1) by the role's Industry; roles without a start year are skipped; industries beyond Top N fold into "Other".
- Finalize/approve/publish paths: this change adds none. Saving a template preset is not a finalize action, so `assertReadyToFinalize` / `useToolCategoryGate().run` are not involved here.

## Verified (initial check)

- `npm run build` passes. Server boots on a fresh database (`sb_rl_bld_4300_1`); the `unified_outputs` columns are created on boot.
- Walked every journey of `docs/training/chart-gallery.md` once in Chromium (Playwright) with a fictional member: all steps pass; no page errors and no failed application requests after the fresh-database fix (before it, preset listing returned 500). Only console noise: `ERR_CERT_AUTHORITY_INVALID` for an external resource blocked by the sandbox proxy (environment).
- Test member data was created through the API for speed; the training spec has the validator create it through Career Master -> Manual Intake (that path was not re-walked by the builder).

## Known limitations

- Thumbnails are scaled-down renders; small text is not meant to be read there, the preview is the readable view.
- Date-dependent values (years since a first-used year) assume the stated current year; the training spec says how to adjust.
- Classic charts without data show "No data for this chart yet" rather than a sample.
- A configured layout is only stored when Save is pressed; the preview is unsaved until then.
- Known fresh-database defect not addressed here: a "cannot cast type boolean to jsonb" atom-sync error is logged on Career Master writes (`[careerMaster] atom sync failed`); it does not affect this feature.

## Fix notes per round



### Fix notes — round 2

- **CG-R1-1 (recurrence, preview not sticky)**: took only the `OutputTemplateConfigurator.jsx` hunks of fix branch `release-loop/chart-gallery-fix-r1` (dc6b5f0, the salvaged untested commit); its other files (ChartGallery.jsx, api.js, server) were not merged because they are outside this triage item. Dropped `flex:1`/`overflowY:auto` from the hub and configurator wrappers so `position:sticky` binds to the real shell scroller; the preview column is sticky only when not narrow; the iframe height is `min(640px, calc(100vh - 3.5rem))` (520px when narrow); `minWidth:0` on grid children. Files: `src/components/admin/OutputTemplateConfigurator.jsx`. Spec J2 step 2 now also checks sticky behaviour at 1400 and 600 px.
- **CG-R1-2 (recurrence, status in failed-load alert)**: proficiency now loads through `loadJson('/api/career/proficiency?period=current')`, and `loadJson` appends the JSON `error` detail when present, tolerating empty/non-JSON bodies (`HTTP 500 Internal Server Error - ...`). `api.js` left untouched.
- **CG-R2-1 (chart clipped in preview)**: removed `min-width:500px` from the proficiency, trend and timeline SVGs (all three had the same pattern) so the viewBox scales to the container. Files: `src/lib/careerCharts.js`; `docs/training/chart-gallery.md` J2 step 2 now requires visually unclipped segments and labels (screenshot-based).
- How checked (all three): `npm run build` passes; production server on a fresh database, fictional member with 4 skills, Chromium at 1400 px. The preview column stayed at the same top offset after scrolling the real scroller (sticky holds), at 600 px it stacks below. The proficiency SVG measured 280 px inside a 380 px iframe with no horizontal overflow; screenshot shows all five segments and level labels. Intercepted proficiency 500 (JSON body and empty body) shows "HTTP 500 Internal Server Error - boom" and "HTTP 500 Internal Server Error" in both alerts.
