# Scope review: proficiency-live-qr, round 7

Method: read git history and the specs on integration head 49ca0c7. No base-commit reproduction was run, because neither item can exist without this feature's code or spec. docs/triage/scope-review.json has no entry for either id.

## T7-1: Approve-for-QR toast uses an em dash in J6.4
Scope: this_feature (spec error). The product code is correct and must not change.
- src/components/admin/MyResumePanel.jsx:656 emits "Approved - private QR link created (copied to clipboard)." with a plain hyphen.
- Commit 73505f4 ("Fix round 2: hyphen in Approve-for-QR toast") is part of qr-gated-outputs-fix-r2 (merge fc1e20b). It changed the string on purpose.
- docs/training/qr-gated-outputs.md lines 101, 156 and 170 assert the hyphen text. no-silent-failures asserts it too.
- docs/training/proficiency-rules-and-live-qr.md line 79 (J6.3 and J6.4) expects "Approved — private QR link created…". That is a stale copy of the pre-73505f4 string.
- The defect is in this feature's own spec, so the ruling matches the earlier F3-1/F4-5 rulings on this feature's spec wording.
- Fix: propose an amendment in docs/spec-amendments/proficiency-live-qr/ changing the expected toast to the hyphen form, approved by a reviewer other than the proposer. Do not edit the spec directly, and do not revert the code.

## T6-3: Rules & why "Levels and why" table scrolls sideways at 390px
Scope: this_feature, and it needs an owner decision (needs_business_definition).
- src/components/admin/ProficiencyRulesPanel.jsx was created by f1ad622 in this feature, so the code is this feature's own and cannot exist on the base.
- The step is J8.4 in this feature's spec (the T6-3 label comes from the validator round). It requires "no sideways panning inside the page or its scroller".
- The table sits in an overflow-x scroller with minWidth 940. The page itself does not scroll sideways.
- The step text contradicts a captioned scroll. Only a stacked-card layout meets the step as written.
- The owner has not chosen between two options: (a) accept the captioned horizontal scroll and amend J8.4, or (b) rebuild the table as cards at narrow widths.
- Action: this is a question for the owner and must not be guessed. If (a), file an amendment to J8.4. If (b), a fix agent restacks the table as cards.
