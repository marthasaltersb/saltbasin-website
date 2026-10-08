# Triage: world-shell-navigation, round 1

All three failures share ONE root cause: spec_error (item `wsn-r1-auto-cover-letter`). No product defect.

## Root cause
`server/lib/coverLetterAutoDraft.js:103` registers `onOpportunityCreated(...)` on the hook seam in
`server/lib/opportunityHooks.js`, which `careerOpportunityRollups.createCareerOpportunity()` runs after every tracked
opportunity is created. Unless the member's `cover_letter_settings.autoDraft` is false (default `true`,
`server/lib/coverLetterTemplate.js:50,77`), the hook calls `ensureCoverLetterForOpportunity()`, which files a template-built
cover letter DRAFT linked to the new opportunity (source "Generated from your Career Master").
This shipped in commit 4be0bec (2026-10-02, `docs/changes/cover-letter-agent.md`, "Every career_opportunity_target rod
gets a template-built cover letter"). The navigation training spec was written against the earlier World Shell behavior
(opportunity starts with zero outputs), so its expected results predate the feature. The validator's observations
are exactly what the shipped design produces; the opportunity-outputs UI behaved correctly in all three steps.

## Per-step
- J2 2.3: `src/components/OpportunityOutputsSection.jsx:185` shows "No outputs linked..." only when the list is empty. The auto letter is linked, so the list is not empty and the "Every output you have is already linked" text correctly appears. Correct behavior.
- J4 4.1: package import adds two cards to the auto letter (3 cards; ids #2/#3). Order of the two spec cards correct.
- J9 9.1: after unlinking Northwind Freight - Cover Letter, the auto letter and the resume remain (2 cards). Select options matched.
- Knock-on (validator noted as passes, same cause): J10 10.1 imported doc is the fourth card, and 9.2 shows three cards.

## Fix (spec only, no code change)
Update `docs/training/world-shell-navigation.md` (and its `docs/changes` Traces-to section: add 4be0bec / cover-letter-agent):
1. 2.3: expect an APPLICATION OUTPUTS list containing one DRAFT card "Cover Letter - <role> at <company>" (Source: Generated from your Career Master) instead of the empty-state sentence. To keep an empty-state check, add a step before J2 that turns off Auto-draft in My Resume -> Cover-letter settings, or add a separate journey asserting the empty sentence with autoDraft off.
2. 4.1: expect three cards (auto letter + the two package cards), ids not asserted; 9.1: expect two cards after unlinking; 9.2 three; 10.1 fourth card.
3. Never assert numeric output ids (spec already allows ids to differ).

No fix-agent code work required; re-validate after the spec edit.
