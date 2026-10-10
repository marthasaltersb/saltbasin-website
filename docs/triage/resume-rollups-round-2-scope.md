# Scope review: resume-rollups, round 2

Base used: 2477b4a (first parent of the earliest resume-rollups merge c2ccaa3). No code changed. scope-review.json has no entry for RR1-3 or RR1-4.

Method: checked out 2477b4a in a worktree and inspected the exact code paths. I did NOT build and run the app on a fresh database. The evidence is a code-level reproduction at the base commit, where the failing logic is fully present. A runtime repro is a short follow-up if the reviewer requires one.

## RR1-3 -> pre_existing
At 2477b4a, `src/lib/resumeUrls.js` has no reference to `owner`. `MyResumePanel.jsx` builds `/output/resume?layout=...` without `owner=me`. `Output.jsx` `useOutputOwnerSlug()` then returns '', and `resolveOwnerUserId` (careerMaster.js:556-565) falls through to `resolveDefaultAdminUserId()`. So at the base, a signed-in member opening their resume output from My Resume already sees the platform owner's data (the whole `/api/career/master` and `/api/career/rollups` read, not only the new tiles). The feature added the tile and rollup content but did not introduce the link construction and was not asked to rework it. J12.1 exposes the gap; the cause is older. The files named in the item are correct for the fix.

## RR1-4 -> pre_existing
At 2477b4a, `MyResumePanel.jsx:666` already synthesises `{id:'preset-default'}`. `Output.jsx:1265` already fetches `/api/output-templates/<id>/public`. `outputTemplates.js:120-127` already returns 404 for a missing or non-portfolioVisible row. This is console noise only and not part of the rollups request.

## Note
Both items recur from round 1 (docs/triage/resume-rollups-round-1.md) and were not fixed in fix round 1.
