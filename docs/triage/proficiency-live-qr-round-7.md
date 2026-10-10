# Triage - proficiency-live-qr - round 7

Baseline v2 (amendment A1). Two failures: J6.4 and J8.4. Neither was reproduced in a browser by me; both were confirmed from source, and the validator's evidence (screenshots, steps.jsonl) is consistent with the code. No code or spec changed.

| Id | Step | Class | Summary |
|---|---|---|---|
| T7-1 | J6.4 | spec_error | Toast uses a plain hyphen on purpose (commit 73505f4); the step quotes an em dash |
| T6-3 (recurred) | J8.4 | needs_business_definition | Levels and why table scrolls inside a captioned scroller at 390px; owner has not answered since round 5 |

Note: the earlier-triage list passed to this round was empty, but `docs/triage/proficiency-live-qr-round-6.md` holds T6-3 for the same J8.4 failure, so its id is reused.

## T7-1: J6.4 toast dash (spec_error)

Root cause: `src/components/admin/MyResumePanel.jsx:656` has `toast.success('Approved - private QR link created (copied to clipboard).')`. This is intentional. Commit `73505f4` ("Fix round 2: hyphen in Approve-for-QR toast") changed the em dash to a hyphen, and `src/components/OpportunityOutputsSection.jsx:149` uses the same hyphen. Other frozen specs assert the hyphen literally: `docs/training/qr-gated-outputs.md` lines 101, 156 and 170, and `docs/training/no-silent-failures.md` lines 70 and 110 ("plain hyphen"). The change spec `docs/changes/proficiency-rules-and-live-qr.md` does not specify this toast text. The J6.4 wording was never traced to a requirement; it copied the pre-73505f4 string.

Both sides:
- Product: hyphen, shared by `MyResumePanel.jsx:656` and `OpportunityOutputsSection.jsx:149`, and asserted by two other features' specs.
- Step J6.4: "toast 'Approved — private QR link created…'" (em dash).

Changing the code back to an em dash would break the `qr-gated-outputs` and `no-silent-failures` journeys, so this is a step wording error, not a defect. Everything else in J6.4 passed (dialog closes, QR code and link, banner gone), on desktop and phone.

Amendment (for the reviewer, not the proposer):
- op: change, step J6.4
- before: `toast "Approved — private QR link created…"`
- after: `toast "Approved - private QR link created…" (plain hyphen)`
- tracesTo: commit 73505f4; `docs/training/qr-gated-outputs.md` J-steps at lines 101/156/170; `docs/training/no-silent-failures.md` line 70; `MyResumePanel.jsx:656`.
- why: the shipped string is a plain hyphen by deliberate earlier decision.

Related, outside the baseline: `docs/training/cover-letter-agent.md` J2.6 also quotes the em dash and will fail the same way when that feature is next validated. Its owner should file the same amendment there. The J6.5 cancel toast does use an em dash in code, so the two toasts are inconsistent by design of past fixes; changing either is a product decision, not part of this fix.

## T6-3 (recurred, round 7): J8.4 Levels and why table at 390px (needs_business_definition)

Root cause: `src/components/admin/ProficiencyRulesPanel.jsx:409-410`. The table sits in `overflow-x: scroll` with `minWidth: 940`, and a caption at line 408 tells the viewer to swipe. At 390px the 239px scroller hides How it was used, Decided by, Points behind it, Methodology alone and Your override. Round 4's R4-1 stacked the editor and the page does not scroll sideways (scrollWidth 390), so that part of J8.4 passes. The remaining text, "no sideways panning inside ... its scroller", can only be satisfied by turning the table into cards. The formula editor already does this via `useNarrow()` (round 6 fix T6-1), so the build is small. Which behavior is wanted is the owner's call. Unchanged in rounds 5, 6 and 7 (open bugs F6-7, T6-3).

Exact question for the owner: "In the Output Templates editor at 390px, is the captioned in-table sideways scroll of the Levels and why table acceptable (the same behaviour Career Master already has, accepted in round 4), so J8.4 is reworded to allow it? Or must the table stack as cards at phone width, so no panning at all is needed?"

If accept: spec_error amendment on J8.4. before: "...no sideways panning inside the page or its scroller to read the Rules & why panel." after: "...no sideways panning of the page itself; the Levels and why table may scroll inside its own captioned scroller (the caption names the columns it hides: How it was used, Decided by, Points behind it, Methodology alone, Your override)." Traces to the round-4 acceptance of Career Master's table and change spec T1-2.
If stack: defect. Fix in the rows rendering of `ProficiencyRulesPanel.jsx` (around lines 396-420): below 900px render each skill or tool as a labelled card, reusing the `useNarrow()` hook, and remove the swipe caption in that mode.

## Validator observations

- MCP `technology_category_set` advertises `category: null` to clear, but rejects null with 400 "category is required". Not a baseline step and the website cannot clear a category either, so no UI mismatch. Decision: nothing to add to the spec; the tool's schema text should be corrected (drop "or null") or null should be accepted. Small defect for a later fix round, no step needed.
- Third J7.1 wording state (non-career-bound output) still not reached: no Approve for QR button on that card. This is the open owner question from round 4 (how a member creates a non-career-bound output). No new step; stays with the owner.
- The start page does not link to /world; scripts re-enter by address. Not a baseline step; coverage_gap is not worthwhile, but it is a navigation observation for the owner.
- E.1 empty QR page shows the LIVE DATA banner with no charts: spec-compliant, nothing to do.
- E.3 phone Remove-tap loop and harness misses: harness behavior, nothing to do.
- Console errors are sandbox-blocked external loads: environment, nothing to do.
- J6.4 vs J6.5 dash inconsistency: covered under T7-1.
