# in-app-release-loop round 4: scope review

| id | scope | owner |
|---|---|---|
| in-app-release-loop-T4-1 | other_feature | world-shell-navigation |

## in-app-release-loop-T4-1 (desktop controls under 44px)

- The failing controls (Sun, Journeys, Copy link, Dismiss) are the buttons in `src/components/WorldBreadcrumbs.jsx`. This feature never touched that file.
- The file was first added by the World Shell layers work (`git log --diff-filter=A`: 5e16323 and the merge 770b8aa, "World Shell layered navigation", 2026-10-10 00:59). The in-app-release-loop first merge (3e4bcc1, first parent 4620984, 2026-10-09 17:43) is earlier.
- At the base (4620984) the file does not exist, so the breadcrumb bar and its short buttons do not exist there either. It is therefore not pre_existing, and it cannot be reproduced without the layers merge.
- Round 3 passed E.1 before the layers merge, which matches the triage root cause.
- The breadcrumb's `crumbBtn` has no height, and the only 44px rule sits inside `@media (max-width: 700px)`. That is the layers feature's own gap, and its change doc only promised 44px at phone width.
- The in-app-release-loop request (release loop inside the platform) does not include breadcrumb sizing.

Decision: other_feature, owner world-shell-navigation. The fix belongs to that feature (a desktop min-height on the crumb buttons, and an update to its change doc). The in-app-release-loop E.1 step is blocked by this defect, not by the feature's own code.

No code was changed and nothing was committed.
