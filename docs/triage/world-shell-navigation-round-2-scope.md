# world-shell-navigation round 2 - scope review

Base: first merge of the feature is 575f0e6, first parent 18e76d1 (feature code commit 7cc95ed). Existing decisions in docs/triage/scope-review.json were reused unless noted. Method note: for the pre-existing item the base was checked by reading the code at 7cc95ed^ (git show), not by building and running it; the behavior is deterministic from source.

| id | scope | owner | evidence |
|---|---|---|---|
| wsn-r1-auto-cover-letter (J2.3, J4.1, J9.1, J9.2, J10.1) | other_feature | cover-letter-agent | scope-review.json already classifies it: coverLetterAutoDraft.js hook and cover_letter_settings.autoDraft default true came from 4be0bec (merged a5e7883, cover-letter-agent), whose request is a template letter per opportunity. No contrary evidence. |
| wsn-B9 (J0.1, J0.2, E.1) | this_feature | - | scope-review.json (world-shell-navigation-B9): the feature's own spec docs/training/world-shell-opportunity-outputs.md uses curl signup, which the fixed test-account rule forbids. WorldShell's mustChangePassword handling is this feature's own (change spec line 20). |
| wsn-r2-mobile-counters (J0.3) | this_feature | - | MOBILE_CSS hiding .sb-world-stat in src/components/WorldShell.jsx was introduced by 7cc95ed (git log -S sb-world-stat), the feature's own shell work; the spec requires them on the 390px walkthrough. |
| wsn-r2-e5-ai-output (E.5) | process_note | - | Validation environment has no ANTHROPIC_API_KEY, so an AI-generated output cannot be produced; the feature's behavior (editable=false with reason) exists. Environment limitation, not a product or spec fault. |
| wsn-r2-failure-toast | pre_existing | - | useCareerPlacementAgents.js already had 28 toast('...') calls at 7cc95ed^, and toast() defaults to success styling and 2400 ms there; the feature did not add or change the generate-resume failure path and error toasts are not in its request. Verified from source at the base commit. |
| wsn-r2-e7-foreign-id (E.7) | this_feature | - | Server scoping is correct; the step mixes a UI-observable half with an API-only half in the feature's own spec. Spec fix. |
| wsn-r2-mcp-gap | this_feature | - | The PATCH /opportunities/:id details route and the link/unlink/unlinked-outputs routes were added by 7cc95ed (change spec lines 37-40) and the feature's capabilityParity.js entries (opportunity-details, application-output-link) record mcp:null. Interface parity v3 requires MCP for the feature's own capabilities. |
| wsn-r2-b11-island-entry | this_feature | - | Reuses world-shell-navigation-B11 in scope-review.json: spec has no step for the 3D island entry the feature is about. |
