# Triage: output-version-history, round 1

Validator report: docs/test-results/output-version-history/round-1.md (33 of 37 passed; failed J1.2, J5.1, E.2, E.5; plus MCP_GAP). Baseline v1. No earlier triage items, no earlier amendments. Method: code reading in a fresh worktree at the integration head (c3867d3). I did not boot the app; the failures are explained by static evidence below. No code or spec was changed.

| Id | Step | Class | Scope |
|---|---|---|---|
| T1 | J1.2 | defect | pre_existing (admin-shell mobile menu never built), but blocks this feature's phone steps |
| T2 | J5.1 | defect | same root cause as T1 |
| T3 | E.2 | spec_error | step needs a corrupted row; UI cannot produce it |
| T4 | E.5 | spec_error | step is API-only by nature |
| T5 | MCP_GAP | environment | other_feature (platform-mcp) |
| T6 | B10 | coverage_gap | chart-only diff |
| T7 | B11 | coverage_gap | Output Template editor entry point |
| T8 | B14 and "HEADER fields" | spec_error | spec text vs harness |
| T9 | B8 | needs_business_definition | spec J3.1/J5.3 vs bug B8 |

## T1 / T2 [J1.2, J5.1] Classic Tools tool list unreachable at 390px
Root cause: `src/brand.css` lines ~605-709 (added in commit eb62057) define a mobile admin-shell layout. At `max-width: 900px` it hides `.sb-admin-topbar-actions` (the only place the tool tabs render, `src/components/admin/AdminShell.jsx` ~line 656) and `.sb-admin-desktop-subnav`. It also styles `.sb-admin-mobile-menu-button`, `.sb-admin-mobile-current`, `.sb-admin-mobile-backdrop` and `.sb-admin-mobile-drawer*`. No JSX anywhere in `src/` renders any of those classes (a grep over `src` finds only an unrelated comment in `Sidebar.jsx:57`). So the CSS removes the tabs on phones and the replacement menu was never built. `WorldShell.jsx:570` mounts `<AdminShell>` for Classic Tools, so all of Classic Tools has no tool list at 390px. The squashed Career Placement Agents panel is just the default tab filling the narrow area.
Why it blocks here: J1.2 and J5.1 route through Classic Tools, and the spec's route allows no Journeys-card workaround.
Fix: in `AdminShell.jsx`, render in the topbar a `.sb-admin-mobile-current` label (active tab/view) and a `.sb-admin-mobile-menu-button`, plus a backdrop and `.sb-admin-mobile-drawer.open`. The drawer lists the same items as the desktop strip (member: `configDraft.navigation.memberTabs`, enabled and sorted; admin: `adminNav.views` and the active view's sub-tabs), grouped in `.sb-admin-mobile-nav-group`, closes on selection (reuse `setTab` / `switchView`), and puts Back to World in `.sb-admin-mobile-drawer-actions`. Also make the Career Placement Agents panel stack single-column under 900px (scene full width, card not overlapping, Back to World not over the heading). Re-validate J1.2 and J5.1 at 390px.
Scope suggestion: pre_existing for the missing drawer (reproduces on the base before this feature's commits), but it fails this feature's required phone walkthrough, so it needs fixing before the feature can pass.

## T3 [E.2] Unreadable version
The product behaviour exists and matches the spec: `server/lib/outputVersionHistory.js:122` sets `version.error = "This version's content could not be read: ..."` and line 124 sets the summary "Cannot compare (a version could not be read)". `src/components/admin/OutputVersionHistory.jsx:213` shows "One of the selected versions could not be read, so they cannot be compared." No interface produces a corrupt stored version, and the test constraints forbid DB edits. The step cannot be performed as written; this is not a product defect.
Amendment (change E.2): before, "A version whose content cannot be read is still listed with a red message; comparing against it shows **One of the selected versions could not be read, so they cannot be compared.** The server logs the reason." After: same expectation, surfaces changed to `cli`, performed by a committed fixture check (a script feeding `getOutputVersionHistory` a lineage whose second version has unparseable content, fictional data) expecting that version's `error` to start with "This version's content could not be read" while the other versions are still listed. Traces to docs/changes/output-version-history.md (error handling) and definition.json interfaceParity. Why: the step cannot pass on any surface without a forbidden DB edit.

## T4 [E.5] Another member's output id
The product is correct: `server/routes/resumeOutputs.js:54-60` returns 404 `Resume output not found` when `getOutputVersionHistory(req.user.id, id)` returns null, and the validator observed exactly that for the second member. The UI never exposes another member's id, so a browser step is impossible by design; it is an authorization negative test.
Amendment (change E.5): surfaces from `desktop, mobile` to `cli`; wording: "As the second harness member, `GET /api/resume-outputs/<first member's output id>/versions` returns 404 `Resume output not found`; a member can never see someone else's history." Traces to the change spec (owner-scoped, read-only history) and interfaceParity (API surface). Why: no point-and-click performance of this step exists.

## T5 [MCP_GAP] No MCP tools for version history
`server/lib/mcpToolRegistry.js` does not exist; the platform MCP server is the separate feature platform-mcp. definition.json interfaceParity says that before the server exists the gap is recorded and assigned to platform-mcp. Not a defect here and not blocking. Action: record against platform-mcp that it must register tools to list versions (dates and approval metadata), compare two versions and read a version body, calling the existing `getOutputVersionHistory(userId, id)` and `versionBody(row)` (`server/lib/outputVersionHistory.js`, lines 87 and 57) with the same owner check. No fix in this feature.

## T6 [validator B10] Chart-only changes show no diff (coverage_gap)
`src/lib/outputVersionDiff.js` has no chart handling, so a version that only changes a chart reads as unchanged. Worth a step.
Amendment (add, new id E.7): "Two versions that differ only in a chart block: the compare area lists that chart as CHANGED (or ADDED/REMOVED) and the summary counts it; it never says there are no changes." Traces to the change spec requirement that every content change between versions is shown. A product fix is needed too (diff chart blocks by their data/spec in `outputVersionDiff.js`).

## T7 [validator B11] No Version history entry in OutputTemplateConfigurator (coverage_gap)
Entry points exist only in CareerBoundOutputEditor, MyResumePanel, OpportunityOutputsSection and WorldShell.
Amendment (add, new id E.8): "In the Output Template editor, open Version history for the output being edited; the dialog opens on desktop and at 390px." Fix: add the same `OutputVersionHistory` button to `src/components/admin/OutputTemplateConfigurator.jsx` where an output id exists.

## T8 [validator B14 and unchanged-line labels] Spec text vs harness (spec_error)
(a) The preconditions and Journey 0 use `riley.member@example.test` with public signup, and the spec says "Riley Fenn". The harness mandates `create-test-member.mjs` (member@test.local, display name "Test Member"). Amendment (change, preconditions and Journey 0 text): use the harness account and write "the member's display name" wherever "Riley Fenn" appears.
(b) J4.2 says "HEADER fields"; the product labels are NAME / HEADING / ROLE / PARAGRAPH. Amendment (change J4.2): replace "HEADER fields" with "NAME".
Traces to: the harness rule on test accounts and the shipped labels in OutputVersionHistory.jsx. Neither is a product defect.

## T9 [validator B8] Draft wording not frozen (needs_business_definition)
Spec J3.1 and J5.3 require drafts to follow the Career Master title change (live resolution; the validator confirmed it), while bug B8 asked for drafts to be frozen. These conflict, so nobody should guess. Question for the owner: "Should a draft version of a career-bound output keep following the live Career Master wording until it is approved (as training spec J3.1 and J5.3 currently require), or should it freeze its wording at the moment each draft version is saved?" Until answered, J5.3 stands.

## Cleanup
No processes started, no databases created, nothing committed. Only this report was written.
