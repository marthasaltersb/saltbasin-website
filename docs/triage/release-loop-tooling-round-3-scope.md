# release-loop-tooling round 3 scope review

Method: every file involved is release-loop tooling (tools/release-tracker/*, its specs). Base check: the earliest merge (991999d) has first parent 8430eae, where `git ls-tree 8430eae tools/release-tracker` is empty, so none of these can be reproduced without this feature. Reproduced at head 66facd1: `grep -c data-label tools/release-tracker/index.html` = 0; no `stalled` key in the STATUS map; change spec lines 51 and 53 still carry the stale limitations. Repo history: index.html was created by bed12f0 and rewritten by 9084b2c, both this feature's tracker work.

| id | scope | evidence |
|---|---|---|
| T3-1 | this_feature | Ninth tile ("Status updates") added by 44609c2 (this feature's numbered updates). Training spec line 54 still says eight tiles. Stale spec of this feature. |
| release-loop-tooling-F1-2 | this_feature | Covers two items. (a) Status labels: no `stalled` key in STATUS and no `.s-stalled` CSS in tools/release-tracker/index.html; fix-r1 (082eed1) additions were lost when 9084b2c rewrote the page. "Agent stopped" for failed is deliberate (98e05dd); the spec wording must follow. (b) 390px stacked cards: 0 `data-label` occurrences at head, so featureRows/bugRows/agentRows tables only scroll or clip. SETUP-FOR-CLAUDE.md and sync-setup-guide.mjs embed the same page and must be regenerated. All this feature's own code. |
| T3-3 | this_feature | Spec expects the original bed12f0 palette; 9084b2c intentionally moved the page to the Salt Basin cream palette. Spec line 71 of docs/training/release-loop-tooling.md is stale. |
| release-loop-tooling-F1-6 | this_feature | Same as round 2: docs/changes/release-loop-tooling.md line 51 (stalled detection contradicts it, see release-tracker-sync.mjs lines 118-120) and line 53 (390px reflow expected by spec step 5.3) are stale spec of this feature. Reuses the round 2 decision. |
