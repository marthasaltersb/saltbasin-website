# resume-rollups round 4 scope review

Base: first merge of the feature is c2ccaa3 (build of 4f35fd4); first parent = pre-feature integration head.

## resume-rollups-B11 (MOBILE_GAP, 6-column tile grid) -> pre_existing
- At the pre-feature base (`c2ccaa3^1`) `src/components/Output.jsx:530` already had `gridTemplateColumns: 'repeat(6, 1fr)'` for the Executive Summary tiles and `src/lib/outputBlocks.js:530` had `repeat(6,1fr)`. The feature only changed it to `minmax(0, 1fr)` (marginally better) and made the tile set configurable.
- The default tile set was already six tiles, so the 390px rendering is the same on the base. Proven by identical CSS at the base commit (code comparison, not a browser run: layout is deterministic from the style string).
- Making the output page responsive is not part of this feature's request (configurable KPI tiles, industry buckets, skill groups, Career Atom rollups). Note: the earlier scope-review.json entry for B11 (about the column count vs. new default tile set) is a different finding; no contrary evidence here to that one.
- Suggest: track as a separate output-layout item (a narrow-width case for both files).

## resume-rollups-RR2-2 (AMBIGUOUS spec step E.3, empty Career Master) -> this_feature
- The step text lives in this feature's own training spec (`docs/training/resume-rollups.md`) and contradicts this feature's own behaviour (`server/lib/resumeRollups.js` manual metric returns the member's own value; `docs/changes/resume-rollups.md:23`). Spec error owned by the feature.
- Not code. Fix path is a spec amendment in `docs/spec-amendments/resume-rollups/` (reviewer other than proposer): change E.3 to "every Career Master-computed tile shows a dash with a reason; a manual tile shows the member's own value". Recurrence of round-2 RR2-2; still undecided.
