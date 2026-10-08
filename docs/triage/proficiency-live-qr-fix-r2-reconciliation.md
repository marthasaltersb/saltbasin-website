# Reconciliation: proficiency-live-qr fix round 2

Branch checked: release-loop/proficiency-live-qr-fix-r2 (47b1b42), read against integration head ef13254. No code changed. Verified by reading the diff (3fdc308..47b1b42) and re-running `npm run build` (passes). No server or browser was started in this reconciliation.

## Item 1: browser self-check not performed (J7.1, J7.2, 390px tabs)
- kind: process
- status: unresolved
- Evidence: the code changes are present: SharedLiveStates.jsx banner is always `#1B2A3B` / white; `wordingSentence()` picks a sentence by `documentState.changedSinceApproval` / `careerBound`; SharedOutputPage.jsx:115 passes `documentState`; CareerExperienceConfigurator.jsx:172 has `flexWrap: 'wrap'`. `documentState.careerBound` is set at applicationPackages.js:302. Build passes. None of it was rendered, so "works" is not verified.
- step: J7.1, J7.2 and the 390px tab row of Career Master -> Proficiency & Rollups.
- rootCause: sandbox refused the compound boot command; fix agent stopped without retrying with simple commands.
- proposedFix: round-3 validator must drive the three checks in a browser: zero-change dark banner with green stripe (J7.1); each of the three wording sentences (changed / career-bound unchanged / frozen) (J7.2); all five workspace tabs reachable at 390px in /world. Keep this open until it has run.
- files: src/components/SharedLiveStates.jsx, src/components/SharedOutputPage.jsx, src/components/admin/CareerExperienceConfigurator.jsx

## Item 2: change spec claims browser checks that were not run
- kind: process
- status: unresolved
- Evidence: docs/changes/proficiency-rules-and-live-qr.md line 82 ("Checked by rendering the QR page with zero changes in the browser") and line 84 ("Checked by build and layout at 390px") are still in the branch and are inaccurate.
- rootCause: fix notes written before the checks, then not corrected.
- proposedFix: reword both to "Checked by build and code reading only; browser check pending round 3", then update after the validator passes.
- files: docs/changes/proficiency-rules-and-live-qr.md

## Gaps from the change spec's "Known limitations" that the reported failures missed
- G1 (requirement_gap, unresolved): Rules & why screen is not mounted inside the Output Template editor. Spec says planned; owner direction is that everything comes from the World Shell, so it should be reachable from the template editor there. step: Output Template editor. files: src/components/admin/ProficiencyRulesPanel.jsx, the output template editor component. proposedFix: mount ProficiencyRulesPanel in the template editor (World Shell path) once the chart-gallery merge conflict risk is cleared, with a training journey.
- G2 (informational, resolved): skills have no proficiency category; tools only, as asked. Not a defect.
- G3 (requirement_gap, unresolved): the salt-particle chart is a first rendition pending design feedback. No fix possible until owner feedback; ask the owner for it.
- Also noted (informational): fix-round-1 notes (T1-1, T1-2) state the dark-embed fix and 390px table/chart scroll were likewise never browser-checked; the round-3 validator should cover them too.
