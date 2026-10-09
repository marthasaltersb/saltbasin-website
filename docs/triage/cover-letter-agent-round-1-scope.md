# Scope review: cover-letter-agent round 1

Base for reproduction: 312f128 (first parent of merge a5e7883, which merged release-loop/cover-letter-agent-build / 4be0bec).
Reuse from docs/triage/scope-review.json: B3, B9, B11 are this_feature (T9 relies on them). No existing entry contradicts the decisions below.
No code was changed, nothing committed. No server or database was started; each decision rests on the base tree's source, which is deterministic for these items.

| id | scope | owner | evidence |
|---|---|---|---|
| T1 | pre_existing | - | At 312f128, src/brand.css already hides `.sb-admin-topbar-actions` at <=900px (line 622), AdminShell.jsx:653 renders that class, and `sb-admin-mobile-current` appears only in brand.css (2 hits, 0 in any JSX). The replacement CSS arrived in eb62057 (2026-08-09, world-scoped agent orbits), long before the base. `git diff 312f128 HEAD -- AdminShell.jsx brand.css` is 21 added lines, none touching the mobile nav, and 4be0bec never touched AdminShell.jsx. The gap exists without this feature and is not in its request. |
| T2 | this_feature | cover-letter-agent | server/lib/coverLetterTemplate.js does not exist at 312f128 (added by 4be0bec). The metrics-template condition at line 196 is this feature's own code. Cannot be reproduced on the base, so it is this_feature. |
| T3 | this_feature | cover-letter-agent | coverLetterRules.js and coverLetterAgent.js are new in 4be0bec; the route mapping of 'info' to 'search_only' is the feature's own. Not present on the base. |
| T4 | this_feature | cover-letter-agent | packageSearch.js (jobRecText / hasJobRec) is new in 4be0bec. Not present on the base. |
| T5 | this_feature | cover-letter-agent | The product matches the change spec; the defect is in docs/training/cover-letter-agent.md (the feature's own spec), which scores an API-only branch on the UI surface. The spec needs an amendment. Spec error, not product. |
| T6 | this_feature | cover-letter-agent | Same: the feature's spec step E.6 second half is reachable only through the API (POST /api/cover-letters/packages/assemble). The spec needs an amendment. |
| T7 | this_feature | cover-letter-agent | Same: coverLetterAutoDraft.js is new in 4be0bec and its failure alert needs an injected failure; the feature's spec step E.7 cannot be driven by a supported user action. The spec needs an amendment. |
| T8 | this_feature | cover-letter-agent | server/lib/mcpToolRegistry.js did not exist at 312f128 (added by b77049b, platform-mcp). The cover-letter capabilities (settings, opportunity list with letter/package state, job rec save, generate/regenerate, package build, turn history) were introduced by 4be0bec's routes/coverLetters.js and are listed as gaps in capabilityParity.js. Interface parity (definition v3) requires every capability of a feature to have an MCP tool, so these tools belong to this feature. Accept/reject is the owner-decided exclusion (capabilityParity.js:78), not part of the fix. platform-mcp itself is not at fault (it provided cover_letter_open, cover_letter_agent_turn, application_output_approve_for_qr). |
| T9 | this_feature | cover-letter-agent | The request says the agent is "reachable from the World Shell opportunity view" and includes a "Generate for this opportunity" action. B3 and B11 (already classified this_feature) are the open product bugs; the missing baseline step proving reachability is this feature's spec coverage gap and must go through an amendment. |

## Proposed amendments (for the amendment reviewer; specs not edited)
- T5: re-score E.3/E.4 on the API or MCP surface (cover_letter_open), not the UI.
- T6: second half of E.6 on API/MCP only.
- T7: E.7 needs a seeded failure event or is moved to the API/test surface.
- T9: add a step proving the agent, package build and settings are reachable from the World Shell opportunity view (after B3/B11 are fixed).
