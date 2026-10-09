# Triage — chart gallery, round 2 (re-validation at c3a71b4)

Validator report: `docs/test-results/chart-gallery/round-2.md` (baseline v1, 16 of 19 pass). This file replaces the earlier triage written against the abandoned `a207b21` run (items CG-R1-1, CG-R1-2, CG-R2-1 there are all verified fixed now). Analysis from code and the round-2 report; no code changed, no spec edited.

## Summary

| id | step | class | note |
|---|---|---|---|
| CG-R2b-1 | E.4 | spec_error | Gauge always has a source (count rollups); step wording is wrong. Not a regression |
| CG-R2b-2 | E.4 (visible symptom) | defect | Gauge value 0 renders blank (`interpolate()` drops 0) |
| CG-R2b-3 | J2.2 (mobile) | defect | Output footer chips are `nowrap`; one chip is wider than the 316px preview |
| CG-R2b-4 | J1.1 (mobile) | spec_error | "on the right" is false below 900px by design; J2.2 already accepts "below" |
| CG-R2b-5 | MCP_GAP | environment | Owned by separate feature `platform-mcp` (definition.json interfaceParity) |
| CG-R2b-6 | (none) | coverage_gap | Sticky preview in the admin-scope host is covered by no step |

## CG-R2b-1 — E.4 Capacity Gauge + Add enabled for an empty member (spec_error)

- Code: `src/components/admin/ChartGallery.jsx` line 57 (`capacity-gauge`, `configure: 'key'`), `rollupKeyOptions()` lines 86-90, `canAdd = !needsSource || !!draft.sourceKey` line 286. The 'key' options are every `staticRollups` entry. `server/lib/rollupMetrics.js` `computeStaticRollups()` lines 44-48 ALWAYS emits `total_jobs`, `total_skills`, `total_tools`, `total_case_studies`, `total_certifications` (value 0 for an empty member). So a source key always exists, the gauge defaults to `total_jobs` ("Roles Held") and + Add is enabled. The group charts (`bar-chart-*`, `configure: 'group'`) need a `prefix:` key, which only exists once there is grouped data, so they are disabled.
- Not a regression: `ChartGallery.jsx` has one commit (`6dd06e5`) and `rollupMetrics.js` has not changed since before this feature. Round 1/2 "pass" rows say "2 disabled flags for empty member", i.e. the two bar charts only; the gauge was never disabled. The change spec ("data source (classic bar charts and gauge)") does not say the gauge is disabled either.
- Both sides: change spec lists a data source for the gauge but no disabled rule; the step says the gauge is disabled "until a roll-up source is available", and a roll-up source (the count rollups) is always available. Owner direction does not require blocking a zero-valued headline count, so the step is wrong, not the product.
- Amendment: see item. The visible oddity (blank number) is the separate defect CG-R2b-2.

## CG-R2b-2 — Gauge shows no number for a value of 0 (defect)

- Code: `src/lib/outputBlocks.js` line 484-486, `interpolate(text, ctx)` begins `if (!text || !ctx) return text || ''`, so numeric `0` becomes `''`. `capacity-gauge` (line 692-706) calls `ip(rollup.value)`, so a legitimately zero count prints an empty value under "ROLES HELD". Zero is data ("none recorded"), not missing; a blank reads like a load failure.
- Fix: in the gauge case render `rollup.value` directly via an escape helper that keeps 0 (e.g. `ip(String(rollup.value ?? 0))`), or make `interpolate` return `String(text)` for numbers (`if (text == null || text === '' || !ctx) ...`). Check the other `ip(...)` callers (`ip(c.change)`, stat cards) for the same falsy-number drop. Verify: empty member, add Capacity Gauge, preview and thumbnail show "0" and a zero-length arc.

## CG-R2b-3 — J2.2 mobile: preview document scrolls horizontally (defect, MOBILE_GAP)

- Code: `src/components/Output.jsx` `OutputAuthorshipFooter()` lines 98-118. The chips row is `display:flex; flexWrap:wrap` but each chip has `whiteSpace:'nowrap'` with uppercase text and letter spacing. "CLAUDE (ANTHROPIC) — SECONDARY AUTHOR" and "DESIGN SYSTEM — CO-AUTHORED WITH CHATGPT" are each about 350px wide, wider than the 316px preview column at 390px, so they overflow (scrollWidth 354 > clientWidth 316). The chart itself fits (SVG 218px) — the CG-R2-1 fix holds.
- Fix: replace `whiteSpace:'nowrap'` with `whiteSpace:'normal'` plus `maxWidth:'100%'` and `overflowWrap:'anywhere'` on the chip. The credit text is frozen (AUTHORSHIP lock) — change only layout style, not strings. Also check the copyright/contact lines wrap (they are plain divs). Verify at 390px: iframe `document.documentElement.scrollWidth <= clientWidth`.
- Related, not a baseline failure (observation): preview chart text is ~4-5px at 316-378px because the SVGs scale down from a fixed viewBox. Readability is a design improvement, not required by J2.2 ("nothing clipped"); not triaged as a defect.

## CG-R2b-4 — J1.1 mobile: "Live Preview ... on the right" (spec_error)

- Code: `OutputTemplateConfigurator.jsx` line 131-133 `narrow = matchMedia('(max-width: 900px)')`; line 334 collapses the grid to one column and line 657 un-sticks the preview when narrow. Change spec: "preview column is sticky so it stays visible while scrolling the gallery" (desktop) and nothing promises a side-by-side phone layout. Training spec J2.2 (same file) already says the preview "sits below the gallery" for narrow windows, and the phone walkthrough is required by the interface-parity rule, so J1.1 must hold at 390px with the preview below. Both J1.1 and J2.2 describe the same product, with J1.1 incomplete.
- Secondary copy defect (low priority, not a baseline failure): `OutputTemplateConfigurator.jsx` line 331 says "Changes preview live on the right". Change to "Changes preview live beside the gallery (below it on narrow screens)".

## CG-R2b-5 — MCP_GAP (environment)

- `server/lib/mcpToolRegistry.js` does not exist. `server/data/releaseLoop/definition.json` interfaceParity (line 251): "A capability with no MCP tool fails as an MCP gap once the platform MCP server exists; before that, it is recorded and assigned to the platform-mcp feature." `platform-mcp` is defined at definition.json line 132 / `active-release.features.json` and is still in build. Not a defect of this feature and not fixable in it. Record against platform-mcp: tools needed for career proficiency (read, set/clear override), career rollups, career master (read, create skills/tools/jobs/engagements), and output templates (list/save). These must call the same server functions as `/api/career/*` and `/api/output-templates` with the same permissions. Re-check this feature once `mcpToolRegistry.js` lands.

## CG-R2b-6 — Sticky preview in the admin-scope host is untested (coverage_gap)

- The configurator is mounted in two hosts (member World Shell and `AdminShell`, each with a different scroller). The CG-R1-1 fix (remove `flex:1; overflowY:auto` wrappers) was only verified in the World Shell. Round-1 finding F2-8 stays uncovered. Propose a new step under Journey 2.

## Fix order

1. CG-R2b-3 (footer chip wrap) and CG-R2b-2 (zero value) as code fixes; copy tweak on line 331 alongside.
2. Amendments CG-R2b-1, CG-R2b-4, CG-R2b-6 go to the amendment reviewer; do not edit `docs/training/chart-gallery.md` or the baseline directly.
3. Re-validate: J2.2 and E.4 at 390px and 1280px.
