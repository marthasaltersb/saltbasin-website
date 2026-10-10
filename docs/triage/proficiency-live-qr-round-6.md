# Triage: proficiency-live-qr, round 6

Release 2026-10-02-application-packages-resume, integration head d7340d6. No code changed, no server started: method is code and spec reading against the head plus the validator's round-6 report (`docs/test-results/proficiency-live-qr/round-6.md`). Fictional data only.

| Id | Step | Class | Summary |
|---|---|---|---|
| T6-1 | J5.1 | defect | Formula editor tables collapse selects to 33/41px at 390px |
| T6-2 | J5.2 | defect | Same root cause as T6-1 (blank selects); flow itself works |
| T6-3 | J8.4 | needs_business_definition | Levels and why table needs captioned in-table swipe; owner question open since round 5 |
| T6-4 | MCP_GAP | defect | Registry exists on head, but has no proficiency / category / formula / live-QR tools and the parity map does not govern those routes |
| T6-5 | (observation) F3-1/F4-5 | defect (unreproduced) | "Save as Output" returns 200 but no card appears |
| T6-6 | J7.5 | coverage_gap | Spec example says "Advanced dagger" but a level change reads "printed Expert -> now Advanced (user-defined)" |
| T6-7 | J8.3 | coverage_gap | Preview shows proficiency only when the Proficiency chart is in the template |

## T6-1 and T6-2: formula editor unusable at 390px (defect)

Root cause: `src/components/admin/ProficiencyRulesPanel.jsx` `FormulaEditor` (lines 46-95) renders two ordinary `<table style={{width:'100%'}}>` tables (inputs, 3 columns plus a Remove column, line 53; levels, 2 columns plus Remove, line 72) with `<select style={input}>` where `input` (line 25) is `width:100%`. The editor sits inside the `card` section (line 251, padding 1rem) in the World Shell, so about 239px of content width. Table auto-layout gives each cell its minimum, and 100%-width controls in a shrink-wrapped column resolve to the narrowest size (33px / 41px), so the option text is not visible and the header row overflows the card border. Desktop is wide enough, so it passes. J5.2 fails only because the rows to edit cannot be identified; the save flow itself passed (toast, My formula selected, dagger rows, "11 capped at 10 x 1 = 10"). Same file and fix, so one change closes both.

Proposed fix: at phone width stop using table layout for the editor. Either (a) render each term and threshold as a stacked card row with a visible label above each control (Input / Weight / Cap, Level / Minimum points; Remove at the end of the card), using the same `matchMedia('(max-width: 900px)')` state pattern already used in `OutputTemplateConfigurator.jsx` (declare the hook before any early return), or (b) minimum: wrap each table in `overflowX:'auto'` with `minWidth:480` and the captioned swipe used elsewhere. Prefer (a): J5.2 says "change the Cap on Years performed" and a label above each control keeps rows identifiable. Also give the selects `minWidth:0` so a long label ("Engagements / roles applied in") truncates rather than collapsing. Verify at 390px that the select shows its text and nothing crosses the card border.

## T6-3: Levels and why table at 390px (J8.4) - needs_business_definition

Reproduced by reading: `ProficiencyRulesPanel.jsx:360-361` is `overflowX:'scroll'` around a table with `minWidth:940`, with a caption (line 358) telling the user to swipe. Product matches the round-1 fix T1-2 and what Career Master does; the step text says "no sideways panning inside the page or its scroller". Both readings are defensible and the log (`docs/release-log/2026-10-02-proficiency-live-qr.md` line 23) already holds this as owner question 3; no amendment is decided or rejected (`docs/spec-amendments/` has no proficiency-live-qr folder). It is a recurrence of the round-5 failure. Triage will not guess.

Exact question for the owner: "In the Output Templates editor at 390px, is the captioned in-table sideways scroll of the Levels and why table acceptable (the same behaviour Career Master already has, accepted in round 4), so J8.4 is reworded to allow it? Or must the table stack as cards at phone width, so no panning at all is needed?"

If the owner answers "accept": spec_error amendment, step J8.4, before: "...no sideways panning inside the page or its scroller to read the Rules & why panel." after: "...no sideways panning of the page itself; the Levels and why table may scroll inside its own captioned scroller (the caption names the columns it hides: How it was used, Decided by, Points behind it, Methodology alone, Your override)." Traces to the round-4 acceptance of Career Master's table and change spec T1-2. If "stack": defect, fix in `ProficiencyRulesPanel.jsx` rows loop (lines 360-400): below 900px render each skill/tool as a card with labelled fields, reusing the same `matchMedia` state as T6-1, which also serves Career Master.

## T6-4: MCP_GAP (defect)

Correction to the report: `server/lib/mcpToolRegistry.js` exists on the integration head (commit b77049b, 2026-10-09 16:34 UTC, feature platform-mcp, 203 lines, 11 tools) - the validator ran against a checkout without it. The gap that remains is real: the registry has no tool for any capability this spec exercises except `application_output_approve_for_qr` (finalization gate, already calling `approveOutputForSharing` -> `assertReadyToFinalize`). Missing: read proficiency rules and levels (`GET /api/career/proficiency`, `careerMaster.js:1540`), set a tool's category (Career Master tool update), override a level (`PUT/DELETE /api/career/proficiency-assertions/...`, lines 1632, 1667), formula save/select and certification mappings (`career_experience_definitions` via the experience-definitions routes), live QR data (the public `/r/:token` data route in `sharedOutputs.js`). Also `server/lib/capabilityParity.js` `GOVERNED_ROUTE_FILES` (line 17) lists only careerPlacementAgents, resumeOutputs, coverLetters and platformAccess, so these proficiency routes have no parity row and `scripts/check-interface-parity.mjs` cannot flag them.

Proposed fix: add tools `proficiency_rules_read`, `proficiency_override_set` / `_clear`, `technology_category_set`, `proficiency_formula_save` / `_select`, `certification_mapping_save`, `shared_output_live_read` to `mcpToolRegistry.js`, each calling the same server function the route calls (extract the handler body into a shared function where the route logic is inline, as was done for `approveOutputForSharing`), with the same user scope and the 409 `tool_category_required` behaviour. Add `server/routes/careerMaster.js` (prefix `/api/career`) rows for the proficiency routes to `CAPABILITIES` and consider adding the file to `GOVERNED_ROUTE_FILES`. Ownership note: platform-mcp's change doc says capabilities missing a tool are recorded in the parity map; these are not recorded at all.

## T6-5: Save as Output on Primary Resume shows no card (defect, not reproduced)

Observation only (third wording state of J7.2 unreachable). Not reproduced here since no server was run; the validator saw `POST /api/resume-outputs` return 200 with no new card, which points either to the list not refreshing after create or to the call de-duplicating onto an existing row (`server/routes/resumeOutputs.js` POST handler vs the history loader in `src/components/MyResumePanel.jsx`). Proposed: fix agent reproduces with the test member (create, then `GET /api/resume-outputs`), and if the row exists, refresh the history list after the create; if it does not exist, report why a 200 returned nothing (nothing may fail silently). Then the validator can drive the third wording state.

## T6-6 (J7.5) and T6-7 (J8.3): spec wording

Both pass in the product; the spec text is loose. Amendments (reviewer other than the proposer):

- J7.5 before: "...or a level change such as Forecast modeling printed Expert -> now Advanced dagger;" after: "...or a level change such as Forecast modeling: printed Expert -> now Advanced (user-defined);" Traces to the change spec (basis labelled "user-defined" with a dagger footnote) and the validator's observed line, which matches the Ledgerly line format exactly.
- J8.3 before: "Override one level by hand (as Journey 3, step 1-2)." after: "Add the Proficiency chart to the template, then override one level by hand (as Journey 3, step 1-2); the preview shows proficiency only when that chart is present." Traces to the change spec's preview behaviour; removes an unstated precondition.

## Other observations, no item

- Classic Tools topbar actions are `display:none` at 390px (`src/brand.css:630`, `AdminShell.jsx:663`) and its landing screen is squeezed. J6.2 says "My Resume -> Resume Output History" and the interface-parity rule is met through World Shell, so no step fails; recommend the owner decide whether Classic Tools needs a phone layout (backlog, not this release).
- E.3 unknown-input via UI is not producible (picker offers only known inputs); server-side check is sufficient, no new step.
- Empty Career Master QR page caption is spec-compliant; no change.
- J7.4 Salt particles design feedback is still outstanding from the owner.
