# Scope review: release-cut-and-session-plans, round 1

No ids in docs/triage/scope-review.json for this feature (checked), so nothing reused.
Base reproduction was not possible for any item: the feature's screens, routes and tools first appear in merge 478bb76, and its first parent has none of them. Per the rule, items that cannot be reproduced on the base are this_feature.

| id | scope | evidence |
|---|---|---|
| T1-J3.1, J3.4, J3.5, J7.8, J7.9, J7.11, J8.6, J8.7 | this_feature | One cause: docs/training/release-cut-and-session-plans.md (added in c9de19c) hardcodes the live in-app-release-loop feature as "frozen at 60/60" (round 3, report round-3.md). docs/test-results/in-app-release-loop/round-4.md (cea5b94, 2026-10-10, 59/60 on baseline 2) is now the newest round. The product behaves as its change spec says (latestScore() picks the newest round-N.md); the spec's fixture depends on another feature's mutable test results. The defect is in this feature's own spec. Fix by amendment: use a fictional fixture root (as J6 does with seed-catalog) or a score read at run time. |
| T2-J6.6 | this_feature | Step expects "Froze 1.0.0 at <HEAD7>: 1/2 delivered, 1 carried. Opened ...". scripts/release-cut.mjs line 110 now also prints "N in backlog, N added after the cut". The wording came from 4841d2a (a wip commit, in the release-scope work). Release-scope is not an owner key in the allowed list. The script is this feature's cut command and J6.6 is its own step, so the stale wording is this feature's spec. Counts match the spec's numbers. Fix by amendment. |
| T3-OBS-alerts | this_feature | src/components/admin/ReleaseCutTabs.jsx is this feature's component (c9de19c). The error state is only cleared on some paths, so earlier red alerts stay after later actions (lines ~94-104, 143-160). Baseline steps do not assert it, so this is also a coverage gap. The 390px overlap is a fixed banner, probably the shared toast, over the Close session card. Not reproduced on a base because the screen does not exist there; treat the overlap as part of this screen's phone layout until shown otherwise. |

## Proposed amendments (not applied; spec and baselines left unchanged)
1. Replace every hardcoded in-app-release-loop 60/60 (steps J2.6, J3.1, J3.4, J3.5, J7.6 to J7.11, J8.5 to J8.7, E.2) with a fixture feature whose rounds the spec controls.
2. J6.6: match the output by prefix ("Froze 1.0.0 at <HEAD7>: 1/2 delivered, 1 carried") or add the backlog and added-after-cut counts.
3. New steps: an earlier error alert clears after a later successful action; at 390px no banner covers the Close session button.

No command failed in this review. The worktree was reset to 330f014; nothing was committed, no code changed.
