# Triage: world-shell-navigation, round 2

Baseline v1 is unchanged since round 1 and no amendment was ever filed for this feature (`docs/spec-amendments/` has no `world-shell-navigation`), so round 1's spec_error items recur unchanged. No BASELINE_MISMATCH. Nothing here edits code or specs.

| Item | Steps | Class | Summary |
|---|---|---|---|
| wsn-r1-auto-cover-letter (recurred) | J2.3, J4.1, J9.1, J9.2, J10.1 | spec_error | Template cover letter auto-drafted on every tracked opportunity; step counts predate it |
| wsn-B9 (recurred) | J0.1, J0.2, E.1 | spec_error | Spec precondition uses a signup curl; fixed test accounts never have a provisional password |
| wsn-r2-mobile-counters | J0.3 (mobile) | defect | `MOBILE_CSS` hides TRACKED/AGENTS at <=700px |
| wsn-r2-e5-ai-output | E.5 | environment | No ANTHROPIC_API_KEY, so no AI-generated JSON output can be made |
| wsn-r2-failure-toast | (E.5 observation) | defect | Failures shown as a 2.4 s success-styled toast |
| wsn-r2-e7-foreign-id | E.7 | spec_error | Foreign-id half is not reachable by point-and-click |
| wsn-r2-mcp-gap | MCP_GAP | defect | Registry exists on integration head but has no link/unlink/details tools |
| wsn-r2-b11-island-entry | (none) | coverage_gap | 3D island entry has no step |

## wsn-r1-auto-cover-letter (recurrence of round 1) - J2.3, J4.1, J9.1, J9.2, J10.1

Root cause (unchanged): `server/lib/coverLetterAutoDraft.js:103` registers `onOpportunityCreated` on `server/lib/opportunityHooks.js`; `createCareerOpportunity()` runs it, and with `cover_letter_settings.autoDraft` default true (`server/lib/coverLetterTemplate.js:50,77`) it files a template cover letter DRAFT linked to the new opportunity ("Cover Letter - <role> at <company>", Source: Generated from your Career Master). Shipped by commit 4be0bec (`docs/changes/cover-letter-agent.md`: "Every career_opportunity_target rod gets a template-built cover letter"). `OpportunityOutputsSection.jsx:185` shows the empty sentence only for an empty list.

Both sides shown: the change spec says every tracked opportunity gets a letter; training spec J2.3 says none is linked. The product matches the change spec, so the steps are wrong. Validator evidence matches (3 cards, 3->2 on unlink, 3 after relink, imported doc fourth).

Proposed amendments (one per step, ids kept):
- J2.3: replace the empty-state sentence with "a card **Cover Letter - Principal Value Architect at Northwind Freight** with badge DRAFT and Source Generated from your Career Master", keep the **LINK AN EXISTING OUTPUT** text.
- J4.1: "exactly two cards" -> "exactly three cards, all DRAFT: the two package cards plus the auto-drafted Cover Letter" (order to be confirmed by the reviewer against a live run).
- J9.1: "one card left" -> "two cards left (the auto-drafted letter and the resume)".
- J9.2: "two cards again" -> "three cards again".
- J10.1: "a third card" -> "a fourth card".
Traces to: 4be0bec / `docs/changes/cover-letter-agent.md`; round-1 triage item of this id.

## wsn-B9 (recurrence) - J0.1, J0.2, E.1

Root cause: the spec precondition (lines 15-25) creates the member with `curl /api/members/signup`, which gives a provisional password. The fixed test rule forbids creating users that way, and `scripts/create-test-member.mjs:51` sets `must_change_password = false` unconditionally with no flag to keep it. So login lands on `/world` with the terms prompt, which is correct product behavior for that account (`WorldShell` handles `mustChangePassword`, `docs/changes/world-shell-opportunity-outputs.md` line 50). The step is unreachable; the product is not wrong.

Fix, two parts: (1) tooling (environment): add a `--provisional` flag to `scripts/create-test-member.mjs` leaving `must_change_password = true`, so J0.1/J0.2/E.1 stay testable as written; (2) amendment to the precondition replacing the signup curl with `node scripts/create-test-member.mjs --email riley.member@example.test --password 'Member!Pass#2468xx' --name 'Riley Fenn' --provisional --no-terms`. Until the flag exists, mark J0.2 and E.1 blocked-by-tooling, not passed. Alternative if the owner declines the flag: retire J0.2 and E.1.

## wsn-r2-mobile-counters - J0.3 (mobile) - defect

`src/components/WorldShell.jsx:127-133` (`MOBILE_CSS`, max-width 700px) sets `.sb-world-stats .sb-world-stat { display: none !important; }` because Journeys cards repeat the numbers. `TopBar` (about line 707) renders them, so desktop passes. The spec expects them on the phone walkthrough, and interface parity (definition.json v3) requires 390px parity; hiding was a space tradeoff, not owner direction. Fix: at <=700px keep Tracked and Agents visible in compact form (hide only Avg Score) and confirm no horizontal scroll at 390px. The 0 -> 7 AGENTS delay is `useCareerPlacementAgents` loading after consent, not a failure.

## wsn-r2-e5-ai-output - E.5 - environment

`POST /opportunities/:id/generate-resume` (`server/routes/careerPlacementAgents.js:275`) -> `generateResumeContent` (`server/lib/resumeTargeting.js:102-103`) throws "No Anthropic key configured..." when no key resolves; the route returns 400. The validation environment has no ANTHROPIC_API_KEY, so an AI-generated JSON output cannot be created through the UI. The behavior E.5 describes exists in code: `server/lib/opportunityOutputs.js:127-129` sets `editable=false` and `notEditableReason`, and `OpportunityOutputsSection.jsx:248-250` renders it instead of Edit draft. Fix: give the validation environment a test key or a seeded non-document_blocks output fixture; do not pass E.5 without seeing the text. The step itself is correct.

## wsn-r2-failure-toast - defect (E.5 observation, outside baseline)

`src/lib/hooks/useCareerPlacementAgents.js:355` (also 117, 130, 177, 241, 276, 290, 305, 324, 342) reports failures with `toast('... failed: ' + e.message)`, which defaults to `kind='success'` and 2400 ms (`src/lib/toast.js:11`). The documented convention `toast.error` (red, role=alert, 6 s, toast.js:35-39) exists so failures are not mistaken for success or missed. Fix: switch those calls to `toast.error(...)` and ideally add an inline error line near the Generate button.

## wsn-r2-e7-foreign-id - E.7 - spec_error

Server scoping is correct: `server/lib/opportunityOutputs.js:49,54,66,78,101` filter by `user_id`, and `requireOwnedOpportunity` rejects foreign ids with an error. The step bundles a UI-observable half with an API-only half that point-and-click cannot reach. Amendment (not weaker):
- Before: "Another member can never see, link, edit or approve these outputs (all routes are scoped to the logged-in member; a foreign id returns an error)."
- After: "[E.7] Signed in as a second member, TRACKED shows (0) and none of Riley's outputs appear under LINK AN EXISTING OUTPUT or in My Resume. [E.7b, surface cli] With the second member's session cookie, `GET /api/career-agents/opportunities/<Riley's opportunity id>/outputs` and `POST /api/resume-outputs/<Riley's output id>/share` each return a 4xx error and change nothing; MCP tools application_outputs_list and application_output_approve_for_qr called with the second member's token return the same error."
Traces to: interface parity v3 (UI, API and MCP) and the original E.7 text.

## wsn-r2-mcp-gap - defect

The report says `server/lib/mcpToolRegistry.js` does not exist. On the integration head it does (commit b77049b, extended in ee3dc2b) with career_opportunities_list, career_opportunity_create, career_opportunity_open, application_outputs_list, application_output_open, application_output_new_draft_version, application_output_approve_for_qr; the tested commit apparently predates it. The remaining true gaps, recorded with `mcp: null` in `server/lib/capabilityParity.js` lines 41 and 54: update opportunity details (`PATCH /opportunities/:id`) and list-unlinked / link / unlink outputs. So J9 and J11 have no MCP path. Fix: add `career_opportunity_update_details`, `application_outputs_unlinked_list`, `application_output_link`, `application_output_unlink` to `mcpToolRegistry.js`, calling the same functions as `server/routes/careerPlacementAgents.js:97,117,125,133` with the same member scoping; update the parity map and run `scripts/check-interface-parity.mjs`.

## wsn-r2-b11-island-entry - coverage_gap

No baseline step enters an island from the 3D world. Proposed new step (new id, none reused): "[J1.5] On the World tab select the Career Placement Agents island; the right rail opens the same panel as Journeys -> Career Placement Agents, showing TRACKED (n)." Traces to the World Shell navigation change spec. The reviewer should confirm headless WebGL selection is feasible first.

## Validator observations decided

- AGENTS counter delay: nothing.
- Parallel first-boot `pg_type` race on a fresh database: environment, not a user path; boot sequentially (server, seed, create-test-member).
- Validator script defects corrected in the log: nothing.
