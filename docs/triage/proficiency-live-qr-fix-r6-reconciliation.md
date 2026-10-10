# Reconciliation: proficiency-live-qr fix round 6

Branch checked: `release-loop/proficiency-live-qr-fix-r6` (head 390e1ef), read in a fresh worktree. Fictional data only. No code changed.

Checks I ran myself: `node --check` on `careerMaster.js` and `mcpToolRegistry.js` (both parse); `node scripts/check-interface-parity.mjs` prints "OK: the registry matches the code" and lists `proficiency-definition-delete` as an open MCP_GAP; the manifest diff adds the 8 new tools; `ProficiencyRulesPanel.jsx` has the `matchMedia` hook. I did not boot a server or a browser, so the round-6 browser claims rest on the fix agent's report plus code reading.

## Reported items

| # | Reported | Kind | Status | Evidence |
|---|---|---|---|---|
| 1 | Duplicate `METHODOLOGY_FORMULA_KEY` SyntaxError on first start | process | resolved | `node --check server/routes/careerMaster.js` passes on the branch; the constant is declared once. |
| 2 | `createdb` "already exists" on the second start.sh run | environment | resolved | Harmless re-run of an idempotent script. The database was dropped at cleanup. |
| 3 | Multi-line shell commands refused by the sandbox guard | environment | resolved | Re-run as script files in the agent's scratch directory. No code or partial state in the branch. |
| 4 | Cleanup (server stopped by PID file, database dropped) | process | resolved | Cleanup done as required. Nothing in the branch depends on it. I did not check the live process list. |
| 5 | T6-4 partial: deleting a formula or certification bonus has no MCP tool | requirement_gap | **unresolved** | See below. |
| 6 | PDF download on the live QR page recorded as an mcpExclusion | informational | resolved, with one note | See below. |

### Item 5: no MCP tool to delete a formula or certification bonus (unresolved)
- Step: Journey 4 step [J4.3] ("Click Delete on that bonus and confirm") and formula removal.
- Root cause: the website and API can delete (`DELETE /api/career/experience-definitions/:type/:key`, `careerMaster.js:1648`), but there is no tool for it. The release-loop rule (interface parity, definition v3) says every capability must work through the website, the API and an MCP tool. The validators fail this as `MCP_GAP`. The parity map shows it as an open gap, so the check script can pass while the requirement is still unmet. The fix agent's "the spec only needs save, select and mapping" is wrong, because J4.3 exercises delete.
- Files: `server/lib/mcpToolRegistry.js`, `server/routes/careerMaster.js` (lines around 1648), `server/lib/capabilityParity.js` (row `proficiency-definition-delete`, line 91), `server/data/mcpToolManifest.json`.
- Proposed fix: extract the delete handler body into an exported function in `careerMaster.js`, as was done for `saveExperienceDefinition`. Add a tool `proficiency_definition_delete` (`{ type: 'proficiency_formula' | 'certification_mapping', key }`) that calls it. It must keep the 403 for the locked `salt_basin_methodology` key and the 404 for an unknown key, and must emit the same Career Master change event. Then replace the parity row's `gap` with `mcp: ['proficiency_definition_delete']`, update the manifest, and re-run `scripts/check-interface-parity.mjs` and `--self-test`.

### Item 6: PDF download recorded as an mcpExclusion (informational)
`capabilityParity.js:93` sets `mcpExclusion: 'Binary document; shared_output_live_read returns the same content as data.'`. This is reasonable and matches how `opportunity-import-output` is excluded. One inconsistency: the authenticated PDF download (`resume-output-view-download`, line 75) is recorded as a `gap`, not an exclusion. The owner should confirm the two are meant to be treated differently. No code change needed for this release.

## Gaps the fix agent did not report (from the round-6 triage and the change spec's "Known limitations")

| Step | Kind | Status | Detail |
|---|---|---|---|
| T6-3 / J8.4 | requirement_gap (needs_business_definition) | unresolved | The Levels and why table at 390px scrolls sideways inside a captioned scroller (`ProficiencyRulesPanel.jsx` around lines 358-361). The step text says "no sideways panning inside the page or its scroller". The owner has not answered. Question: "In the Output Templates editor at 390px, is the captioned in-table sideways scroll of the Levels and why table acceptable, so J8.4 is reworded? Or must it stack as cards at phone width?" If "stack", the fix is to reuse the new `useNarrow()` hook and render each skill or tool as a labelled card below 900px. If "accept", it is a spec_error amendment to J8.4 (text in `docs/triage/proficiency-live-qr-round-6.md`). This round's fix did not touch the Levels table, only the formula editor (T6-1, T6-2). |
| T6-5 | product_defect (not reproduced) | unresolved | "Save as Output" on Primary Resume returned 200 but showed no new card, so the third J7.2 wording state (output not bound to Career Master) cannot be driven. Round 6 did not change `MyResumePanel.jsx` or `resumeOutputs.js`. Fix agent: reproduce as the test member (create, then `GET /api/resume-outputs`). If the row exists, refresh the history list after create. If not, report why a 200 returned nothing. Nothing may fail silently. |
| T6-6, T6-7 | process (spec wording) | unresolved | Amendments for J7.5 ("Expert -> Advanced (user-defined)") and J8.3 (add the Proficiency chart first) are proposed in the round-6 triage. They need a reviewer other than the proposer in `docs/spec-amendments/proficiency-live-qr/`. Spec files must stay untouched until then. |
| Known limitation: salt particles | requirement_gap (needs_business_definition) | unresolved | `SaltParticleChart.jsx` is a first rendition. The owner has not answered what should change (grain size, density, colours, motion, heap shape). Do not build until answered. |
| Known limitation: skills have no proficiency category | informational | resolved | Tools only, as the owner asked. |
| Known limitation: Rules & why not mounted in the Output Template editor | informational | resolved | Already mounted as tab 4 of `OutputTemplateConfigurator.jsx` (fix notes round 3, F2-3). Not re-verified in a browser by me. |
| Non-career-bound output creation (owner question 2 in the release log) | requirement_gap (needs_business_definition) | unresolved | The owner has not answered how a member creates an output not bound to Career Master. It overlaps T6-5. |
| Round 6 "Save and use" not re-driven in a browser | process | unresolved | The fix notes say Save and use was not re-driven at 390px, so [J5.2] save needs a round-7 browser pass. The select-width fix (T6-1) is browser-checked only by the fix agent's own Playwright run. |
| Round-1 fixes T1-1 and T1-2 never browser-verified | process | unresolved | Carried from F3-6. The round-7 validator must drive them. |
| Classic Tools phone layout and My Resume entry point | owner_direction_conflict | unresolved | Spec line 8 and J6.2 start the finalize flow ("Approve", "Publish", "Approve for QR", the category gate) from Classic Tools / AdminShell My Resume, not the World Shell. The owner direction is that everything comes from the World Shell. The finalize gate is also wired only into `MyResumePanel`. In the World Shell, the opportunity outputs path calls `useToolCategoryGate` separately (per CLAUDE.md). The Classic Tools topbar is `display:none` at 390px. Needs an owner decision, since it is a spec and navigation question. Do not add new admin-nav entry points. |

## Summary
Items 1-4 are environment or process noise and are resolved. Item 5 is a real requirement gap that a fix agent can build now. Item 6 is accepted. The release still has four open owner or amendment questions (J8.4, salt particles, non-career-bound output, spec wording) and one defect not yet reproduced (T6-5), so the feature should not be marked passed.
