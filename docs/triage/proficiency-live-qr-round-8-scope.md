# Scope review: proficiency-live-qr, round 8

Method: read git history, the change spec and the spec amendments on integration head 9d76307. No base reproduction was run: ProficiencyRulesPanel.jsx was created by f1ad622 in this feature, so the table cannot exist on the base. docs/triage/scope-review.json has no entry for T6-3; the round 7 ruling (docs/triage/proficiency-live-qr-round-7-scope.md) was reused and no contrary evidence was found.

## T6-3: Rules & why "Levels and why" table scrolls sideways at 390px (step J8.4)
Scope: this_feature. Class stays needs_business_definition: the owner must decide; do not guess.
- The code and the step are both this feature's own. The step is J8.4 in docs/training/proficiency-rules-and-live-qr.md line 101: "no sideways panning inside the page or its scroller".
- docs/changes/proficiency-rules-and-live-qr.md (T1-2) records that the table deliberately kept its 940px width with a swipe caption and that a stacked-card layout was "not built (kept minimal)". The product behaviour was a chosen shortcut and contradicts the step as written.
- Amendments A1 (J7.5, J8.3) and A2 (J6.4) do not touch J8.4, so no decision exists in the repo.
- Recurrence (rounds 6, 7, 8) is because nothing was decided, not because a fix failed.
- Owner question, exact: at 390px, should the "Levels and why" table (a) stay a captioned horizontal scroller, with J8.4 amended to allow panning inside that scroller, or (b) be rebuilt as stacked cards so no panning is needed?
  - If (a): file an amendment to J8.4 in docs/spec-amendments/proficiency-live-qr/, approved by a reviewer other than the proposer.
  - If (b): a fix agent restacks the table in src/components/admin/ProficiencyRulesPanel.jsx (about lines 408-410) as cards below the narrow breakpoint.
