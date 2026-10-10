# career-bound-outputs round 3 scope review

Base commit (first parent of the earliest career-bound-outputs merge 76083cc): ed0024d. Method: file and string existence on the base via `git ls-tree` / `git grep` (no code changed, nothing built; each item is a feature-owned component or spec, so there is nothing to reproduce on the base).

| id | step | scope | evidence |
|---|---|---|---|
| career-bound-outputs-F2-6 | Save changes disabled styling | this_feature | CareerBoundOutputEditor.jsx is absent on ed0024d (new in 9df7a85). Prior scope-review decision stands. |
| cbo-r2-inherited-cream-text | Queue page legibility | this_feature | Base WorldShell.jsx has no `careerReconciliation` entry; the World Shell hosting of the queue was added by this feature (3472137). On the base the panel only rendered in AdminShell (light surface). The dark #0d1417 embedBody predates it, but the dark-on-dark pairing only exists because of this feature's change. Prior decision stands. |
| career-bound-outputs-F2-7 | Dialog visible title (Convert editor) | this_feature | "Career Sources to Review" does not occur anywhere in src on ed0024d; the MyResumePanel dialog was added by this feature (9df7a85, 3472137, 95c2adf). |
| career-bound-outputs-F2-7 | Dialog visible title (admin) | this_feature | Same dialog and code path as above. |
| T3-4 | Tool override selectable by name | this_feature | `masterOverrides` is absent on ed0024d in src and server. The tools override list is this feature's (95c2adf); it reads `currentName` where the product elsewhere uses `currentName` or `nameUsed`. |
| T3-5 | Revert skill keeps box | this_feature | Same override UI (`shownIds` from override keys plus local `ovPicks`), added by 95c2adf. |
| T3-6 | Sync failure toast and list | this_feature | The step is in docs/training/career-bound-outputs.md, this feature's own spec, and it cannot be reached by a browser user. A spec defect in the feature's own spec stays with the feature: propose an amendment (reviewer other than proposer), do not edit the spec. The sync-failed list and retry also come from the feature and from failed-commands-reconciliation (8fc685e, dd58da6), which the change spec lists as followed. |
| T3-7 | Invalid package error box | this_feature | Same: the feature's own spec asks for an error presentation the product (amber warnBox, role alert) does not use. Propose an amendment; spec stays frozen. |
| career-bound-outputs-F2-8 | Convert list ignores existing converted output | this_feature | The imported-resumes convert list and `packageReconciliation.js` are absent on ed0024d. They are part of the request (packages enter Career Master via the queue). Prior decision stands. Open bug, not fixed. |

Note: T3-6 and T3-7 are classed spec_error. Under spec governance they are fixed only through an approved amendment in docs/spec-amendments/career-bound-outputs/, not by editing docs/training/ or baselines.

Nothing failed or partially applied during this review. Worktree reset to the integration head 07e9942. No servers started, no database created.
