# Triage: journey-flow-studio, round 1

Note: the validator's report file was not present at the path given (`docs/test-results/journey-flow-studio/round-1.md` is empty/missing); triage used `/var/tmp/sbpg/release-loop/journey-flow-studio/round-1/steps.jsonl` plus the spec `docs/training/journey-flow-studio.md` and the code at integration head 86efef8. No code or spec was changed.

| Item | Step | Class | Root cause |
|---|---|---|---|
| T1 | J2.1 | spec_error | Step says "leave Start from on Blank flow", but J1.1 chose Order to delivery and the form keeps that choice |
| T2 | J7.5 | defect | `actorOf()` reads `u.name`, but the session user has `displayName` |
| T3 | J8.4 | defect | `toJourneyDefinition()` exports `resolves` with only `nodeId`, no label |

## T1 [J2.1] spec_error
Code: `src/components/admin/FlowStudioPanel.jsx` line 674 (`startFrom` state, default `'blank'`), line 689 (`create()` clears only `name`, never `startFrom`). So after J1.1 (Order to delivery) the select stays on that template. Neither the change spec nor owner direction says the form must reset. The step's expected result (a blank editor with "No steps yet") is right; only its precondition ("leave ... on Blank flow") is false after J1.1. The validator's proposed wording is accurate. (Product note, optional and not required for the step: resetting `startFrom` to `'blank'` after a successful create would also remove the hazard of silently creating a templated flow; if the owner wants that, it is a separate enhancement.)
Amendment (to the amendment reviewer):
- stepId: J2.1, op: change
- before: "...Type **Seed Packet Returns** in **New flow name**, leave **Start from** on **Blank flow**, click **Create flow**."
- after: "...Type **Seed Packet Returns** in **New flow name**, choose **Blank flow** in **Start from**, click **Create flow**."
- tracesTo: J1.1 (which chooses Order to delivery in the same form) and the step's own expected result (blank flow, "No steps yet").
- reason: the form retains the last Start from choice, so "leave on" is an incorrect precondition and ambiguous; both surfaces failed identically.

## T2 [J7.5] defect
Root cause: `server/lib/flowStudio.js` line 21, `const actorOf = (u) => ({ id: u.id, label: u.name || u.email || ... })`. The user object from `getUserFromCookie` (`server/auth.js` lines 61-74) exposes `displayName` (from `users.display_name`), never `name`, so the label always falls back to the email. The history panel (`FlowStudioPanel.jsx` line 432) just renders `h.actor.label`. The test member is created with display name "Test Member". Row order, wording and source actions were already correct.
Fix: `label: u.displayName || u.name || u.email || \`user ${u.id}\``. Also check the MCP path (`req.platformUser`) gives the same shape (it is the same user object, so the one fix covers it). Existing history events keep their stored email label; that is acceptable (nothing is rewritten), and new events will carry the name.
Files: server/lib/flowStudio.js

## T3 [J8.4] defect
Root cause: `src/lib/flowStudioDoc.js` line 164 (`toJourneyDefinition`): `resolves: ... st.nodes.filter(n => n.resolves.length).map(n => ({ step: n.id, resolves: n.resolves }))`, and `n.resolves` entries are `{nodeId, kind}` only (normalised at line 29). The Current-state target's label is never looked up, so the export names the problem only by id (`n2`). The spec and the export's purpose ("lists... experience bindings", human/agent readable) require naming the Current-state step.
Fix: in `toJourneyDefinition`, map each link to `{ nodeId, label: <label of doc.states.current node with that id, or ''>, kind, kindLabel optional }` (additive keys; keep `nodeId` and `kind`), and add the step's own `label` to the top-level entry (`stepLabel`). Keep `schemaVersion` 1 since keys are only added. The server export (`flowStudio.js` line 339) and the client both use this function, so one change covers UI, API and MCP export.
Files: src/lib/flowStudioDoc.js

## Validator observations
- Non-2xx responses (import 400, definition 409, stale save 409): all come from steps that expect a refusal. Nothing to do.
- J4.2 auto-select of a new scenario and J7.5 timestamp format ("YYYY-MM-DD HH:MM UTC" vs ISO in the spec prose): the steps do not assert either; not worth new steps.
- J12.3 inspector beside the list: passes per the layout section. Admin Settings checkbox height (24px): not covered by the 44px step, nothing to do.
- MCP parity checked with no gap; sandbox noise is not a product issue.
No coverage_gap items.

## Result
Two defects (T2, T3) go to a fix agent; one spec_error (T1) goes to the amendment reviewer. No recurrences (no earlier triage items).
