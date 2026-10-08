# Triage: proficiency-live-qr, round 2

Release 2026-10-02-proficiency-live-qr. No code changed. No earlier triage items were supplied for this round (a round-1 triage file exists with ids T1-1 and T1-2; none of today's four failures is the same root cause as those). Method: code trace against the integration head (c2ccaa3) and the training spec; the validator's round-2 report file was not present on disk, so the failure list in the task was used as given. No server was started; causes come from code reading.

## T2-1 Zero-change LIVE DATA banner is light, spec says dark (defect, validator F2, persists from round 1)
- Code: `src/components/SharedLiveStates.jsx:106-108`. Background and text colour switch on `liveChanges.length`: `#1B2A3B` (dark) with changes, `#F3EEE6` (light beige) with none.
- Spec: `docs/training/proficiency-rules-and-live-qr.md` J7.1 expects "a dark banner LIVE DATA — matches the approved printed version". The file header (line 3) says the panel "says so boldly".
- Classification: defect. The zero-change state is the first thing a QR scanner sees, and the code deviates from the stated design.
- Fix: always use the dark background `#1B2A3B` with white text. Keep the stripe colour as the differentiator (`#2F9A68` green when nothing changed, `#C98320` gold with changes). The `rgba(255,255,255,0.08)` change-list panel only renders when changes exist, so nothing else needs to change.

## T2-2 Spec example for J7.5 cannot occur (spec_error, validator F3)
- Spec: J7.5 expects "Changed: Ledgerly ERP — printed Advanced → now Advanced · Integration design". J2 step 1 (spec lines 36-38) already sets Ledgerly ERP's category to Integration design before approval, so the printed snapshot already carries "Integration design" and the "printed Advanced" side can never appear.
- Behaviour is correct: the validator saw "Advanced · Integration design → Advanced · Hands-on" and "Forecast modeling Expert → Advanced (user-defined)" listed properly (`src/lib/shareSnapshotDiff.js`).
- Fix (spec only): change J7.5 so it matches the data the journeys leave behind. Either change the example to "Changed: Ledgerly ERP — printed Advanced · Integration design → now Advanced · Hands-on" (after changing the category after approval), or set a category on QuoteFlow CPQ only after approval. Also note that J3 leaves Forecast modeling overridden, so "printed Expert → now Advanced †" is a second valid example.

## T2-3 Phone width: workspace tabs overflow, fifth tab unreachable (defect, validator F7)
- Code: `src/components/admin/CareerExperienceConfigurator.jsx:172`. The tab row is `display: 'flex'` with no `flexWrap`, no `overflowX`, and buttons that do not shrink. Five buttons ("1 · Definitions" through "5 · Resume rollups") total well over 390px. The World Shell embed clips with an overflow-hidden ancestor, so tab 4 is cut at x=425 and tab 5 is entirely off-screen with no scroll cue. The validator saw four tabs because tab 5 is fully hidden.
- Side note on the spec: the spec (line 7) lists four workspaces; the code has five (the resume-rollups feature added "5 · Resume rollups"). Update the spec text to mention five (documentation fix, same change).
- Classification: defect.
- Fix: add `flexWrap: 'wrap'` to the row at line 172 (simplest, every tab visible). Alternative if one line is wanted: `overflowX: 'auto'` plus `flexShrink: 0` on the buttons, but wrapping avoids the "no scroll cue" problem that round 1 flagged for tables. Verify at 390px that all five are reachable.

## T2-4 QR page contradicts itself about document wording (defect, validator F6)
- Code: `src/components/SharedLiveStates.jsx:118-119` always renders "The document text above always stays exactly as approved." But career-bound outputs (feature `career-bound-outputs`, `docs/changes/career-bound-outputs.md:69`) deliberately re-resolve wording from Career Master on every view, so after a job-title edit the document shows the new title. `src/components/SharedOutputPage.jsx:94-102` shows the amber "wording has changed" notice (driven by `doc.documentState.changedSinceApproval`, built in `server/lib/applicationPackages.js:302-304`). The two messages are both shown and disagree.
- Root cause: the banner copy was written for proficiency-live-qr when document text was frozen; the later career-bound feature changed that rule but did not update the copy. `SharedLiveStates` has no access to `documentState`.
- Classification: defect (stale copy across two features). The career-bound behaviour is documented and intended; no business rule is missing.
- Fix: in `SharedOutputPage.jsx:115`, pass `documentState={doc.documentState}` to `SharedLiveStates`. In `SharedLiveStates.jsx:118-119`, choose the sentence by state: if `documentState?.changedSinceApproval`, say "The document wording above differs from the printed version; use the notice at the top to switch between the printed and current wording."; if `documentState?.careerBound` and unchanged, say "The document wording above currently matches the printed version."; otherwise (a frozen, not career-bound document) keep "The document text above always stays exactly as approved." The two-sentence structure of the banner stays the same.
- Training: add a line to J7.2 of `docs/training/proficiency-rules-and-live-qr.md` saying that for a career-bound output the banner points to the wording notice instead of claiming the text is frozen.

## Notes
- All four are low risk. T2-2 is a spec edit only; T2-1, T2-3 and T2-4 are single-component UI edits.
- Nothing in this round needs an owner business decision.
