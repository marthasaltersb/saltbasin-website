# Triage: resume-rollups, round 1

Release 2026-10-02-application-packages-resume. Integration head 1eebaf6. No code or spec changed. No earlier triage items; no amendments decided.

| Id | Step | Class | Root cause |
|---|---|---|---|
| RR1-1 | J1.1 | defect | `Footer` rows in RollupGroupingsPanel cannot wrap |
| RR1-2 | J9.5 | spec_error | step is a typed API URL, banned by interface parity v3 |
| RR1-3 | J12.1 | defect | My Resume layout/preview links omit `owner=me` |
| RR1-4 | E.4 | defect | `/api/output-templates/:id/public` 404s for a synthetic preset id |
| RR1-5 | MCP_GAP | defect | rollup capabilities have no MCP tools (registry now exists; the validator's "file absent" is stale) |
| RR1-6 | (obs. B5/B11) | coverage_gap | no baseline step for the Career Rollup block picker or output column count |

## RR1-1 [J1.1] Footer overflows at 390px (defect)
`src/components/admin/RollupGroupingsPanel.jsx:243-254`. `Footer` is a `display:flex; justifyContent:space-between` row holding the key `<code>` and a second flex row (Shown, up, down, Remove, Save). Neither flex container has `flexWrap`, so the second row's width (~420px) exceeds the card at phone width and an `overflow:hidden` ancestor (AdminShell.jsx:843/870/878) clips Save. The same component serves all four card types (lines 357, 383, 429, 467).
Fix: add `flexWrap: 'wrap', gap: '.5rem'` to the outer row and `flexWrap: 'wrap'` (with `justifyContent: 'flex-end'`) to the inner row. Re-check at 390px that Save is fully visible on all four card types. Spec step stands.

## RR1-2 [J9.5] No UI shows the Career Atom rollup JSON (spec_error)
The product matches the change spec: `GET /api/career/atom-rollups` (careerMaster.js:730) returns `tools_by_wheel_bucket: []` when the grouping is hidden and the new grouping in `groupings`; the validator confirmed that through the page session. The step is wrong: it tells the tester to type an API URL in the browser, which interface parity v3 forbids ("no typed URLs, API calls or scripts standing in for a step"). The same facts are visible by point and click (the J9.3/J9.4 toasts, the cards after reload, the public Career Rollup block). A raw-JSON viewer would be a debug screen, not a user capability, so none is proposed. See the amendment.

## RR1-3 [J12.1] Resume output opened from My Resume shows the admin's data (defect)
`src/lib/resumeUrls.js` (`LAYOUT_URLS`, `resumeUrlFromPreset`) and `src/components/admin/MyResumePanel.jsx` (`LAYOUTS[].url` ~lines 80/106, `previewUrl` state line 557, "full tab" link 1153, iframe 1156, `presetPreviewUrl` line 216) build `/output/resume?...` without `owner=me`. `Output.jsx` `useOutputOwnerSlug()` (line 1148) then returns '', so `/api/career/rollups` and `/api/career/resume-rollups` fall to `resolveOwnerUserId` (careerMaster.js:559-568), which returns the default admin. A signed-in member sees the platform owner's resume.
Fix: member-scoped callers pass an `owner: 'me'` option into `resumeUrlFromPreset` (append `owner=me`) and use it for every My Resume link, the iframe and the full-tab link; the public site-owner link stays without it. The step as written then passes through the UI path; no amendment.

## RR1-4 [E.4] 404 on `/api/output-templates/preset-default/public` (defect)
`MyResumePanel.loadPresets()` (~line 675) synthesises `{id:'preset-default'}` when the member has no presets; `presetPreviewUrl` adds `preset=preset-default`. `Output.jsx:1224` then fetches `/api/output-templates/preset-default/public`, and `server/routes/outputTemplates.js` `GET /:id/public` answers 404 for a missing row and for a non-portfolio-visible preset. The client already handles `{template:null}`, so this is only HTTP noise, but E.4 allows nothing beyond the listed items.
Fix (preferred, server): return `200 { template: null }` in `/:id/public` for "not found" and "not portfolio-visible" (it reveals nothing the 404 did not). Alternative: the client skips the fetch when the id is not a unified_outputs id. Do not widen the E.4 allowance.

## RR1-5 [MCP_GAP] Rollup capabilities have no MCP tool (defect)
Correction to the validator's evidence: `server/lib/mcpToolRegistry.js` now exists (commit b77049b, platform-mcp) with 11 tools (`server/data/mcpToolManifest.json`), but none covers rollups: no tool for KPI tile / industry bucket / capability group / Career Atom grouping read, save, delete or reorder, live preview, computed rollups, or proficiency override. `server/lib/capabilityParity.js` has no rows for these routes and `GOVERNED_ROUTE_FILES` does not list `server/routes/careerMaster.js`.
Fix: extract the handler bodies of `GET /resume-rollups`, `POST /resume-rollups/preview`, `GET /atom-rollups`, `GET/PUT/DELETE /experience-definitions` (careerMaster.js:653, 667, 730, 1552, 1573, 1603) into exported functions (as `loadMasterPayloadForOwner` was), and call them from both route and tool. Append tools (names are append-only): `resume_rollups_read`, `resume_rollup_preview`, `career_atom_rollups_read` (scope `career.read`, permission user); `career_experience_definitions_read`, `career_experience_definition_save`, `career_experience_definition_delete` (scope `career.write`; reorder is a save of `sortOrder`, say so in the description); and the proficiency override through its existing server function. Add the names to the manifest, add parity rows with UI paths, run `node scripts/check-interface-parity.mjs`.

## RR1-6 [coverage_gap] Block picker and output column count
B5 (site editor Career Rollup block picks the new grouping) and B11 (output block column count) have no baseline step. See the amendment.

## Observations needing no item
- J7.3: the keyword "he" matches the substring in "health", so the computed line is consistent.
- Phone Classic Tools tab strip hidden and "Back to World" overlapping the member name are outside this feature (world-shell-navigation).
- P.1 says "admin test user" but the screen is member-only; the validator used the member. Not a failure; the reviewer may raise a wording amendment.
- E.2 and E.3 were exercised for real and pass.

## Proposed amendments
1. spec_error J9.5. Before: "Open `/api/career/atom-rollups?owner=me` in the browser. Expect `"tools_by_wheel_bucket": []` and a `groupings` array containing an entry labelled "Skills by proficiency"." After: "Reload Proficiency & Rollups and open Career Atom rollups. Expect the `Skills by proficiency` card still present with the computed line 'Advanced (1) · Expert (1) · Foundational (1) · Proficient (1)', and the `Tools by wheel bucket` card with Shown unticked. (The API result `GET /api/career/atom-rollups?owner=me` is checked from the page session and kept as evidence, not as a tester step.)" Traces to: change spec for Career Atom rollups, and release-loop v3 interface parity.
2. coverage_gap. Add: "[J9.6] In the site editor add the Career Rollup block and pick the grouping `Skills by proficiency`. Expect the block preview to list the four proficiency groups." and "[J12.2] On the modern resume output, expect the Capability Confidence block to render in the column count configured for it." Traces to: change spec behaviours B5 and B11.
