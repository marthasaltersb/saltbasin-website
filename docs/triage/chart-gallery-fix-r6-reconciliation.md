# Reconciliation - chart gallery, fix round 6 (branch release-loop/chart-gallery-fix-r6, head 82b8d62)

Method: read the branch code and fix diff (git show HEAD), cross-checked against docs/changes/chart-gallery.md, the round-4 reconciliation and baseline v3. No server or browser was started in this pass, so "resolved" below means the change is present in the branch and matches the stated root cause; browser behaviour rests on the fix agent's report. Code unchanged.

## Reported items
| item | kind | status | evidence |
|---|---|---|---|
| Compound shell commands refused by the worktree-isolation guard; re-run as plain commands | process | resolved | Guard refuses commands that cd out of the worktree (I hit it too). Nothing partially applied. |
| Browser login/URL failures (selector, "Cannot GET" without NODE_ENV=production), fixed in scratch scripts | test_harness | resolved | Scratch-script problems only; the fix diff touches no auth or routing code. |
| First J2.3 run clicked a hidden "Resume" button in the drawer; selector scoped to the workspace | test_harness | unresolved (note for validator) | The new mobile drawer (`AdminShell.jsx`, `sb-admin-mobile-drawer`) stays in the DOM when closed (`aria-hidden`, CSS translate) and has no "Resume" button, so a validator following J2.3 literally can hit hidden controls. Proposed: validators scope to `.sb-admin-workspace`; if the drawer should be non-focusable when closed, add `inert` or `visibility:hidden` to the closed drawer. |
| db warning "relation journey_data_rods does not exist" on first boot of a fresh DB | environment | resolved (informational) | Pre-existing; same family as the fresh-database ordering bug in CLAUDE.md. No effect on this feature. |
| Server killed via PID file, DB dropped; Playwright proxy-denied google connections | environment | resolved | Proxy noise. Baseline v3 amendment A2 covers ERR_CERT_AUTHORITY_INVALID and ERR_TUNNEL_CONNECTION_FAILED. |

## Round-6 fixes (verified in code)
| id | step | kind | status | evidence |
|---|---|---|---|---|
| chart-gallery-T6-1 admin shell phone menu | J2.3 mobile | product_defect | resolved (code); browser re-validation pending | Drawer, Menu button and `sb-admin-mobile-current` exist in `AdminShell.jsx`; `brand.css` has the `.sb-admin-mobile-*` rules. Validator must re-run J2.3 at 390px. |
| chart-gallery-T6-2 gauge shows 0 | E.4 | product_defect | resolved | `outputBlocks.js:484-485` now returns '' only for null/empty and `String(text)` otherwise. |
| chart-gallery-T6-3 MCP rollups owner | E.4 / MCP | product_defect | resolved (code) | `mcpRouteTools.js` `career_rollups_read` now has `defaultQuery: { owner: 'me' }`, merged under caller query. Tool name unchanged. Caveat: exact E.4 figures were not entered by the fix agent (see gap G4). |

## Owner-direction check
| item | kind | status | evidence / fix |
|---|---|---|---|
| The fix adds a phone navigation drawer to the admin shell (and member-scope drawer) | owner_direction_conflict (possible) | unresolved - owner decision needed | Owner direction is that everything is reachable from the World Shell. The drawer only mirrors the existing admin_nav/memberTabs on phones and adds no new destination, but it is a new admin-navigation entry surface, added only because baseline J2.3 walks the admin shell. Ask the owner: keep the mobile admin drawer, or drive J2.3 mobile from World Shell -> Journeys -> Output Templates. Files: `src/components/admin/AdminShell.jsx`, `src/brand.css`. |

## Gaps the reported failures missed
| id | step | kind | status | detail |
|---|---|---|---|---|
| G1 Atom sync `cannot cast type boolean to jsonb` | none (outside baseline) | product_defect | unresolved | Change spec "Known limitations" lists it; round 4 reconciliation listed it; this branch does not touch `careerAtomMigration.js` / `careerAtomRegistry.js`. Logged as `[careerMaster] atom sync failed` on Career Master writes. Step: Career Master write on a fresh DB. Root cause: a boolean value bound to a `$n::jsonb` parameter (see the jsonb param note in CLAUDE.md and `JSONB_COLUMNS` in careerAtomRegistry.js). Proposed fix: serialise boolean (and scalar) values correctly for jsonb columns in the atom sync, with a fresh-database check that no atom-sync error is logged. |
| G2 J2.3 member path via World Shell | J2.3 | requirement_gap | unresolved | Change spec says reachability is the World Shell Output Templates card (registered in `WorldShell.jsx`), yet J2.3 and all fix evidence use the admin account and admin shell. Needs a member journey at 1280px and 390px through /world. Fix agent should hand a validator this walk; no code known to be needed. |
| G3 Layout stored only on Save | n/a | informational | resolved | By design per spec. |
| G4 E.4 exact figures never entered | E.4 | process | unresolved | Fix notes admit Roles Held 3, Skills 4, Tools 2, Case Studies 1 were not entered; only owner scoping was proven with one role. Validator must walk E.4 with the spec data. |
| G5 J2.2 at 390px editor not walked end to end after round 5 | J2.2 phone | process | unresolved | Round-5 fix measured only the preview document, not the full editor walk. Validator must re-drive. |
| G6 Known limitations (thumbnails scaled, date-dependent values, classic charts without data show "No data for this chart yet", test data created via API by the builder) | n/a | informational | resolved | By design; validator creates data via Career Master -> Manual Intake as the spec says. |
| G7 MCP parity | MCP | requirement_gap | resolved | `output_templates_*` and `output_template_*` tools exist in `mcpRouteTools.js` with a `capabilityParity.js` row (`output-template-presets`). The chart-gallery options are config in the preset, so create/update covers them. |

## Build note
Branch `release-loop/chart-gallery-fix-r6` is based on an older integration commit; diffing it against the current integration head shows many unrelated removals. The integrator must merge, not overwrite.

Status: NOT clean. Unresolved: owner decision on the mobile admin drawer, G1 atom sync, G2 member World Shell J2.3, G4, G5, closed-drawer hidden-control note.
