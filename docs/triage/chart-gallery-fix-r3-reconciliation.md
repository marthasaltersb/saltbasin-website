# Reconciliation - chart gallery, fix round 3 (branch release-loop/chart-gallery-fix-r3, head 874a9d6)

Checked by reading the branch code. The fix commit touches only AdminShell.jsx, brand.css, OutputTemplateConfigurator.jsx (copy) and the change spec; it fixes CG-R3-1 only.

## Reported item
| item | kind | status | evidence |
|---|---|---|---|
| First logins rate-limited (429) after repeated Playwright runs; 390px check reached Output Templates via the admin view toggle | test_harness | resolved | `server/routes/auth.js:28` authLimiter is 10 attempts / 15 min / IP, as documented in CLAUDE.md. Not a product failure. The fix agent's workaround (restart own server, reuse one session) is the documented practice. |

The second half of the note is not a harmless detail: reaching the page "via the admin view toggle" at 390px hides CG-R3-2 (below).

## Items from the round-3 triage missed by the reported failures
| id | step | kind | status | evidence |
|---|---|---|---|---|
| CG-R3-1 | J2.3 desktop | product_defect | resolved (by code) | `AdminShell.jsx` both mounts wrapped in `sb-admin-scroll` (`overflowY:auto`); `brand.css` `.sb-admin-scroll` turns off at 900px. Fix agent's own browser check reported 1280px scroll works. I did not re-run the browser. |
| CG-R2b-3 | J2.2 mobile | product_defect | unresolved | `src/components/Output.jsx:109` chip spans still `whiteSpace: 'nowrap'`; preview scrolls horizontally at 390px. |
| CG-R3-2 | J2.3 mobile | product_defect (MOBILE_GAP) | unresolved | grep finds no `sb-admin-mobile-current` / `sb-admin-mobile-drawer` markup in `src/components/admin/*.jsx`; the CSS exists in `brand.css`. The view selector sits in `.sb-admin-topbar-actions`, hidden at 900px or narrower. |
| CG-R2b-2 | E.4 | product_defect | unresolved | `src/lib/outputBlocks.js:~484` `interpolate()` starts `if (!text \|\| !ctx) return text \|\| ''`, so numeric 0 becomes ''. |
| CG-R2b-5 | MCP | requirement_gap | unresolved | `server/lib/mcpToolRegistry.js` now exists, but has no tool to read career proficiency, or to list/save output templates (only `career_proficiency_override_save/clear`, `career_master_read`, `career_atom_rollups_read`, `resume_rollups_read`). Interface parity (MCP_GAP) is not met for the gallery and Rules & why. |
| Done button (a11y) | J2 | product_defect | unresolved | `ChartGallery.jsx:381` the button shows "Done" but has `aria-label="Edit <title>"`, so it cannot be found by name "Done". |

## Gaps from the change spec "Known limitations"
- Thumbnails are scaled-down renders: accepted, by design (informational, resolved).
- Date-dependent values assume a stated current year: informational.
- Classic charts with no data show "No data for this chart yet": informational (but see CG-R2b-2, where 0 shows nothing).
- Layout stored only on Save: informational.
- Fresh-database `cannot cast type boolean to jsonb` atom-sync error logged on Career Master writes (`[careerMaster] atom sync failed`): unresolved, product_defect, pre-existing and outside the gallery; flagged for a separate item (`server/lib/careerAtomMigration.js` jsonb params, see the CLAUDE.md jsonb convention). Not verified here.
- The spec says the member journey runs from the World Shell; CG-R3-1 and CG-R3-2 were found and checked as the admin account on the admin shell. The member path is not a conflict, but round-3 evidence is admin-scoped: owner_direction_conflict risk for validation, not for the product. Re-validate J2.3 as member@test.local.

## Proposed fixes
- CG-R2b-3: chip style `whiteSpace:'normal'`, `maxWidth:'100%'`, `overflowWrap:'anywhere'`, `boxSizing:'border-box'` in `Output.jsx` (do not change the AUTHORSHIP lock text). Verify at 390px scrollWidth equals clientWidth.
- CG-R3-2: add topbar menu button, `sb-admin-mobile-current` label and drawer in `AdminShell.jsx` listing views and tabs; declare its `useState` before the early return. Verify at 390px by tapping the menu, not the desktop toggle.
- CG-R2b-2: `interpolate` returns `String(text)` for non-null non-string input and keeps 0; check other `ip(...)` number callers.
- MCP: add read-proficiency, list-output-templates and save-output-template tools calling the same server functions as `/api/career/proficiency` and `/api/output-templates`, with the same permissions.
- Done button: remove the aria-label or make it `Done`/`Edit` to match the visible text.

Status: the release is NOT clean; five items are open.
