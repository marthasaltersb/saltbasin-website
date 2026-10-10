# Reconciliation - chart gallery, fix round 4 (branch release-loop/chart-gallery-fix-r4, head 673b364)

Checked by reading the branch code and re-running the build. No server or browser was started; code unchanged.
The fix commit touches Output.jsx (chip style), ChartGallery.jsx (Edit/Done aria-label) and the change spec only.

## Reported items
| item | kind | status | evidence |
|---|---|---|---|
| J2.2 at 390px not walked in a browser; scroll fix unconfirmed | process (unverified fix, CG-R2b-3) | unresolved | Code: `src/components/Output.jsx:109` chips now `whiteSpace:'normal'; maxWidth:'100%'; overflowWrap:'anywhere'; boxSizing:'border-box'`, so the intended change is in the branch. But round-4 scope review says the footer-chip root cause was NOT confirmed (chips already wrap in a flex-wrap row; nowrap in a 316px column did not overflow on the base). The element that overflows in the 390px preview was never measured. No browser evidence exists, so "resolved" cannot be claimed. Step: [J2.2] phone. Files: src/components/Output.jsx, src/lib/careerCharts.js, src/components/admin/OutputTemplateConfigurator.jsx. Proposed fix: validator re-walks J2.2 at 390px as member@test.local, measures which element in the preview iframe has scrollWidth > clientWidth; if it is not the chips, fix that element (likely a fixed width in a chart SVG/table or the 316px column). |
| First `npm run build` tail showed only a contribution-script line; confirmed with `npx vite build` | environment/informational | resolved | Re-ran `npm run build` on the branch: `built in 40.63s`, then postbuild prints `[contribution:codex] No Codex sandbox logs ... skipped.` The postbuild line is simply the last output; build succeeds. |

## Round-4 items the reported failures missed (per round-4 test results and scope review)
| id | step | kind | status | evidence / fix |
|---|---|---|---|---|
| CG-R4-3 Done button name | F3-7 | product_defect | resolved (by code) | `ChartGallery.jsx:381` aria-label is `Done editing <title>` when editing, `Edit <title>` otherwise; contains the visible text. Not run in a browser. |
| CG-R3-2 admin shell has no phone menu (MOBILE_GAP) | J2.3 phone | product_defect | unresolved | No `sb-admin-mobile-current`/drawer markup in `src/components/admin/*.jsx` (only `sb-admin-mobile-toggle` at AdminShell.jsx:637). Scope review: pre_existing, but the baseline step fails. Fix: add topbar menu button + drawer in AdminShell.jsx (hooks before early return); verify at 390px by tapping the menu. Owner-direction note: the spec runs J2.3 as admin in the admin shell; member path via World Shell should also be re-validated. |
| CG-R2b-2 falsy zero | E.4 | product_defect | unresolved | `src/lib/outputBlocks.js:485` `if (!text || !ctx) return text || '';` turns numeric 0 into ''. Fix: return `String(text)` for non-null non-string, keep 0; check other `ip()` callers. |
| CG-R2b-5 / CG-R4-1 MCP parity | MCP | requirement_gap | unresolved | No output-template list/save tools in `server/lib/mcpToolRegistry.js`; `career_rollups_read` falls back to the default admin owner when `owner` is absent (resolveOwnerUserId). Fix: add tools calling the same functions as `/api/output-templates` and force/accept `owner=me` for rollups; update mcpToolManifest.json and capabilityParity.js. Scope review marks these pre_existing. |
| CG-R4-2 atom sync `cannot cast type boolean to jsonb` | none (outside baseline) | product_defect | unresolved | Still logged on Career Master writes (`[careerMaster] atom sync failed`); boolean bound to `$3::jsonb` in careerAtomMigration.js / careerAtomRegistry.js. Also listed in the change spec's Known limitations. |
| CG-R4-4 E.5 wording | E.5 | test_harness / process | unresolved | Spec names only ERR_CERT_AUTHORITY_INVALID; sandbox also yields ERR_TUNNEL_CONNECTION_FAILED. Needs an approved amendment in docs/spec-amendments/chart-gallery/; never edit the frozen baseline. |

## Change spec "Known limitations"
- Thumbnails are scaled-down renders: informational, by design.
- Date-dependent values assume the stated current year: informational.
- Classic charts without data show "No data for this chart yet": informational, but see CG-R2b-2 (0 shows nothing).
- Layout stored only on Save: informational.
- Fresh-database atom-sync boolean/jsonb error: unresolved (CG-R4-2 above).
- The spec's Reachability note claims the editor is reachable from the World Shell Output Templates card, yet J2.3 evidence is admin-shell only: re-validate J2.3 as the member.

Status: release NOT clean. Unresolved: J2.2 phone (unverified), J2.3 phone, E.4, MCP parity, atom sync, E.5 amendment.
