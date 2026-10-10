# Triage - chart gallery, round 3 (baseline v2)

Validator report: `docs/test-results/chart-gallery/round-3.md`. Analysis from code and the round-3 report; no code changed, no spec edited. Amendment A1 (approved) already settled CG-R2b-1/4/6, so none of those are spec_error or coverage_gap again.

| id | step | class | note |
|---|---|---|---|
| CG-R2b-3 (recurred) | J2.2 mobile | defect | Output footer chips `nowrap`, not fixed since round 2 |
| CG-R3-1 | J2.3 desktop | defect | Admin workspace is `overflow:hidden` and the Output Templates hub has no scroller |
| CG-R3-2 | J2.3 mobile | defect | Admin shell CSS for mobile menu/drawer exists but the JSX markup was never written |
| CG-R2b-2 (recurred) | E.4 | defect | `interpolate()` drops numeric 0; not fixed since round 2 |
| CG-R2b-5 (recurred) | MCP | environment | Owned by feature `platform-mcp` |

## CG-R2b-3 (recurred) - J2.2 mobile horizontal scroll in preview (defect)
- `src/components/Output.jsx` `OutputAuthorshipFooter()` lines ~104-113: chip spans have `whiteSpace: 'nowrap'`, uppercase, letter-spacing. Two chips are about 350px wide, wider than the 316px preview column, so the document scrolls horizontally (354 > 316). The chart fits; the CG-R2-1 fix holds.
- Fix: chip style `whiteSpace: 'normal'`, add `maxWidth: '100%'`, `overflowWrap: 'anywhere'`, `boxSizing: 'border-box'`. Do not change the AUTHORSHIP lock text. Verify at 390px: preview scrollWidth equals clientWidth, chips wrap onto two lines.
- Affects every output preview (validator observation); one fix covers all.

## CG-R3-1 - J2.3 desktop: admin Output Templates cannot scroll (defect)
- `src/components/admin/adminStyles.js` `workspace` (line 21-25) is `display:flex; flex:1; overflow:hidden`. `AdminShell.jsx` line 895 returns `<OutputTemplateConfiguratorHub scope={scope} />` directly into it. The hub root (`OutputTemplateConfigurator.jsx` line 111) is a plain `<div style={{background}}>` with no height or overflow, so content (scrollHeight 2012) is clipped at 799px. Panels that work in this host own their scroller (e.g. `MyResumePanel.jsx` line 845 `flex:1, overflowY:'auto'`). The same clip hides the Configured list and Save & Set Primary, as the validator noted. The sticky preview "stays in view" only because nothing scrolls. This is exactly the host difference named in CG-R2b-6; the CG-R1-1 fix is correct, the admin host just never provided a scroller.
- Fix: in `AdminShell.jsx` wrap the `outputTemplates` branch: `<div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}><OutputTemplateConfiguratorHub scope={scope} /></div>` (do the same for TAB_COMPONENTS line 84 if that path is hit for admin). Do NOT put overflow on the hub root, to keep the World Shell host (where sticky already works) unchanged. At 900px or narrower `.sb-admin-workspace` already is `overflow-y:auto` (brand.css 723), so make sure the wrapper does not create a nested second scroller there (use `overflowY: 'visible'` under the narrow media query, or give the wrapper a class). Verify J2.3: at 1280x900 scrolling 1500px works, Add buttons of all 12 charts reachable, Live Preview top stays inside the window.
- Not a spec_error: A1's J2.3 matches the change spec (sticky preview beside the gallery) and the product fails it.

## CG-R3-2 - J2.3 mobile: admin Output Templates unreachable at 390px (defect, MOBILE_GAP)
- `src/brand.css` lines 617 and 630-700 define `.sb-admin-topbar-actions {display:none}` at 900px or narrower, plus `.sb-admin-mobile-current` and `.sb-admin-mobile-drawer(.open)`, `-head`, `-scroll`. `AdminShell.jsx` renders the view selector only inside `.sb-admin-topbar-actions` (line 666) and contains no `sb-admin-mobile-current`, `sb-admin-mobile-drawer` or menu button markup (grep: zero matches; only `sb-admin-mobile-toggle` for the page list at line 631). So on a phone the view selector is hidden and nothing replaces it. Interface parity (definition.json) requires the phone walkthrough.
- Fix: add to AdminShell a topbar menu button, a `sb-admin-mobile-current` label (active view and tab), and a drawer (`sb-admin-mobile-drawer` + backdrop class from brand.css ~665) listing `adminNav.views` and their tabs (members: `memberTabs`), calling `switchView`/`setTab` and closing on select. Hook order: declare the `useState` for open state before the early `return null` at line 622. Verify: 390px, tap menu, Output Templates, Resume, Infographics, preview below the gallery with no overlap.

## CG-R2b-2 (recurred) - E.4 gauge shows no number for 0 (defect)
- `src/lib/outputBlocks.js` line 484-486: `interpolate()` starts `if (!text || !ctx) return text || ''`, so numeric `0` becomes `''`. `capacity-gauge` (line ~692-706) prints `ip(rollup.value)`. The gallery thumbnail and the Live Preview both use this renderer, matching both symptoms.
- The disabled-state part of E.4 is already correct and now matches A1 (bar charts disabled, gauge enabled); only the number is wrong.
- Fix: make `interpolate` number-safe: `if (text == null || text === '' || !ctx) return text == null ? '' : String(text)` and `return val != null ? val : ''` already keeps 0 in the replace branch. Alternatively in the gauge use `ip(String(rollup.value ?? 0))`. Check other `ip(...)` number callers (stat card values/changes). Verify: empty member, add Capacity Gauge, thumbnail and preview show 0 and a zero-length arc.

## CG-R2b-5 (recurred) - MCP_GAP (environment)
- `server/lib/mcpToolRegistry.js` does not exist. definition.json interfaceParity records capabilities with no MCP tool against feature `platform-mcp` until the server exists. Not fixable inside chart-gallery. Needed tools (same server function and permissions as `/api/career/*`, `/api/output-templates`): read career proficiency, set/clear proficiency override, career rollups, Career Master read and create entries, list/save output templates. Track under platform-mcp; do not mark chart-gallery passed on MCP until that feature ships, or the owner waives it.

## Validator observations
- steps.jsonl with localhost:10702 and no surface field: another validator writing to the same round-3 directory; process issue, not a product step. Recommend one results directory per validator. No new step.
- J2.2 row order (Process design, Forecast modeling): treated as set membership; no amendment.
- Tiny preview row labels (4-5px on phone/378px): cosmetic, no step; optional follow-up, not a coverage_gap.
- Done button not found by role and name: likely a non-button element or name mismatch; accessibility defect candidate, check the edit panel Done control in `ChartGallery.jsx` (use a real `<button>` with accessible name "Done"). No spec change.
- Intro text "Changes preview live on the right" (`OutputTemplateConfigurator.jsx` line 331) is untrue at 900px or narrower; fix copy to "beside (or below, on narrow screens) the gallery". Defect-level copy fix bundled with CG-R3-1.
- Admin panel clipped below about 800px, broader than J2.3: same root as CG-R3-1.
- Baseline diff v1->v2 as reported; no BASELINE_MISMATCH, so no environment item for the spec.
