# Scope review: journey-flow-experience-mapping, round 2

Base for comparison: 7d54686 (first parent of merge 30eabe4, the feature's first merge). None of these ids is classified in docs/triage/scope-review.json. No code was changed and no processes or databases were started. `server/lib/flowJourney.js` does not exist at 7d54686 (checked with `git cat-file`), so items on it cannot be reproduced on the base and are this_feature by rule. Round 1 decisions (docs/triage/journey-flow-experience-mapping-round-1-scope.md) are reused for B8, B10 and B11.

| id | scope | owner |
|---|---|---|
| journey-flow-experience-mapping-F1-1 | process_note | |
| journey-flow-experience-mapping-F1-3 | this_feature | |
| journey-flow-experience-mapping-F1-4 | this_feature | |
| journey-flow-experience-mapping-F1-5 | this_feature | |
| journey-flow-experience-mapping-F1-6 | process_note | |
| journey-flow-experience-mapping-F1-7 | this_feature | |

## F1-1 process_note
The fix pass did not run a browser walk. This is a gap in how the fix round was run, not a product or spec defect. The fix-r1 reconciliation lists it as "process, unresolved". The remedy is the round-2 re-validation, with J10.4 at 390px first. It does not need a code change.

## F1-3 this_feature (round 1: B8)
The request asks for each node's experience (asset, World Shell layer or scene, crystal variant, animation, interaction, destination) to be rendered and consumed by SpatialJourneyWorld and World Shell layers. Fix round 1 only lists `stage.experience` in the stage panel. No layer push and no crystal-variant rendering exist. This is requested work that is not done, in this feature's request.

## F1-4 this_feature (round 1: B10)
"Decision tree branch conditions" is in the request. A connector holds one condition. The limitation is in this feature's own `flowJourney.js` and `FlowStudioPanel.jsx` area and cannot be shown on the base. If the owner later rules compound conditions out of scope, reclassify as a documented limitation.

## F1-5 this_feature (round 1: B11)
Variant/scenario is a named binding and the compiled journey is the published artifact. Variants compile to a path only, and per-scenario overrides do not change generated gates or experience. This is in this feature's own `flowJourney.js`, absent on the base.

## F1-6 process_note
"Awaiting browser/API validation" for T1, B12 and B13 is not a defect. The code fixes exist (fix-r1 reconciliation: T1 CSS, B12 actor rows, B13 token) and are unproven only because no walk was run. It resolves when round 2 validates them. If a walk then fails, that failure gets its own item and is scoped then.

## F1-7 this_feature
"Known limitations missed" is the change spec's own list (World Shell and crystal rendering not built, one condition per connector, variants compile to a path only). Each is requested work in this feature's request, in its own files (`flowJourney.js`, and the World Shell consumption). Not reproducible on the base. It overlaps F1-3, F1-4 and F1-5, and should be fixed with them, not separately.

## Notes for the round
- F1-3, F1-4, F1-5 and F1-7 are one body of work, not four.
- The B7 (platform-mcp amendment, pre_existing) and B9 (security-provisioning-model, pre_existing) carry-overs from round 1 are unchanged and are not in this round's item list.
