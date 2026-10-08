# Reconciliation: output-version-history build (release 2026-10-02-career-bound-outputs)

Branch reviewed: `release-loop/output-version-history-build` (HEAD d2df8ac, commits e2752fd + d2df8ac). Code, change spec and training spec read; `npm run build` re-run on the branch (passes); merge against current integration head checked with `git merge-tree`. No code changed.

| # | Item | Kind | Status |
|---|------|------|--------|
| 1 | git apply of salvage diff refused, then --reject, then discarded | process | resolved |
| 2 | Branch already existed (fuller earlier build); rebased instead of recreated | process | resolved |
| 3 | Branch is behind the integration head (now a5f0086, built on ef13254) | process | unresolved |
| 4 | Bash calls refused by worktree guard | environment | resolved |
| 5 | Server start/kill/db recreate sequence | informational | resolved |
| 6 | full.mjs "J2 v1 row" FAIL: regex hard-codes "Oct 2, 2026" | test_harness | resolved |
| 7 | PID 8855 not mine, left alone | informational | resolved |
| 8 | Unapproved career-bound versions show current Career Master wording | requirement_gap | unresolved |
| 9 | Approved versions predating shared_snapshot fall back to current wording | requirement_gap | unresolved |
| 10 | Images/figures skipped; tables compared as one block | requirement_gap | unresolved |
| 11 | No history entry in Output Template editor; template content not diffed | requirement_gap | unresolved |
| 12 | No test-result / release-log evidence on the branch; validation by build agent only | process | unresolved |
| 13 | No restore/revert, UTC-only times, no "modified by" | informational | resolved |

## Evidence and decisions

1. Resolved, process. The atomic `git apply` refusal left nothing changed; the `--reject` run was discarded with `git checkout`/`git clean`. Verified: the branch tree is clean, no `.rej` file is tracked, and the fuller earlier build is present (server/lib/outputVersionHistory.js, src/lib/outputVersionDiff.js, src/components/admin/OutputVersionHistory.jsx, `GET /api/resume-outputs/:id/versions`, import-output lineage change).
2. Resolved, process. The branch was rebased, not force-reset; commits e2752fd and d2df8ac sit on ef13254 (`git merge-base` confirms). The old commit 9aff689 survives only as the original ref and is not a deliverable.
3. Unresolved, process. The integration branch has since advanced to a5f0086 (release-intelligence merge). `git diff` of the branch against it therefore shows release-intelligence files as deletions; against ef13254 the feature diff is 12 files, +818/-1, all feature files. `git merge-tree` of integration with the branch is clean (no conflicts). Step: integrate. Root cause: integration moved after the rebase. Files: none. Proposed fix: integrate with a normal merge (or rebase onto a5f0086) and re-run `npm run build`; do not "fix" the apparent deletions.
4. Resolved, environment. Guard refusals changed no state; the commands were re-run as separate plain commands.
5. Resolved, informational. First server (4106) killed by PID, database dropped and recreated, final server killed and database dropped; each step reported.
6. Resolved, test_harness. `src/components/admin/OutputVersionHistory.jsx:23-25` formats dates as `<Mon D, YYYY>, hh:mm UTC` from the real timestamp, so the date varies by day. The training spec uses "for example" and `<today>`. The uncommitted script hard-coded the date. Validators must compute today's UTC date, not copy the example.
7. Resolved, informational. A pre-existing process (PID 8855) was not started by this agent and was left alone.
8. Unresolved, requirement_gap (spec Known limitations; the request asks to scrub previous states and show tracked changes between any two versions). `versionBody()` in `server/lib/outputVersionHistory.js` resolves an unapproved career-bound version against the CURRENT Career Master, so a draft's earlier states are not reproducible and a diff involving a draft can show or hide changes the member did not make in the output. Step: Journey 3 step 1, Journey 5 step 3. Files: `server/lib/outputVersionHistory.js`, `server/lib/careerBound.js` (save path), `server/routes/resumeOutputs.js`. Proposed fix: store the resolved blocks with each career-bound save (nullable key inside the existing JSON or one additive nullable column; no backfill, no member-row rewrite), prefer it in `versionBody`, and keep the labelled fallback for older rows. If the owner accepts the limitation, record that decision in the spec.
9. Unresolved, requirement_gap (spec Known limitations). Approved career-bound versions created before `shared_snapshot` existed show current wording with a label. No data exists to recover. Proposed fix: keep the labelled fallback, add a validation step confirming the label shows, and ask the owner whether that is acceptable (needs_business_definition if not).
10. Unresolved, requirement_gap (spec Known limitations). `src/lib/outputVersionDiff.js:20-23,35` renders a table as one block and skips `figure` blocks, so a chart-only change (the chart gallery shipped in this release) shows no change. Files: `src/lib/outputVersionDiff.js`, `server/lib/outputVersionHistory.js`. Proposed fix: diff a figure by its stored spec/data key and show a "figure changed" chip; diff table rows or cells; add a journey with a chart edit.
11. Unresolved, requirement_gap (partial). The request mentions "document_blocks / template content" and "reachable from ... the editor". Entry points exist in the career-bound editor, the World Shell shared block editor bar (`OpportunityOutputsSection.jsx`), My Resume rows and the World Shell opportunity view. There is no entry point in `src/components/admin/OutputTemplateConfigurator.jsx`, and template configuration content is not diffed (only `document_blocks`, `career_bound` and flattened generated text). Proposed fix: confirm with the owner whether template configurations are versioned in a lineage; if so add a `versionBody` branch and a Version history button in the template editor reachable from the World Shell, with no admin navigation; if not versioned, raise it as a needs_business_definition question rather than building it.
12. Unresolved, process. The change spec says journeys are "in the release log", but the branch has no `docs/test-results/output-version-history/` or `docs/release-log/` file, and "Fix notes per round" reads "(none yet)". Training Journeys 0-8 were walked once by the build agent. Journey 8 (390px) and the edge cases (unreadable version, load failure with Retry, foreign id 404) are not reported as walked. Proposed fix: the validator produces round-1 results with a fresh database (Journey 1 adds a Career Master job and is not idempotent) and today's UTC date.
13. Resolved, informational. All are documented in the spec's Behaviour changes / Known limitations: read-only by design (no restore), times in UTC, and only the approver is recorded (no per-edit "modified by" exists in the data model; the request asked only for who approved). Re-import of the same file name now joins the existing lineage (`careerPlacementAgents.js` `import-output`, via `regenerateFromId`; `createResumeOutputProjection` sets `lineage_root_id` from the prior row); covered by Journey 7.

## Owner-direction check

No conflict found. The branch diff touches no admin navigation config; entry points are in the World Shell and panels already reachable from it. The history route is member-scoped by `req.user.id` and adds no finalize path (approval stays on `assertReadyToFinalize`). Validation must run as `member@test.local`, not the admin. No `server/data/applicationPackages/*` file is in the diff and the specs use fictional names only.
