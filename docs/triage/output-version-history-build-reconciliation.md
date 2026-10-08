# Reconciliation: output-version-history build (release 2026-10-02-career-bound-outputs)

Branch reviewed: `release-loop/output-version-history-build` (9aff689). Read-only review of code, change spec and training spec. No code changed, no browser run by this agent.

| # | Item | Kind | Status |
|---|------|------|--------|
| 1 | git apply of salvage diff failed on 2 files; .rej hunks applied by hand | process | resolved |
| 2 | Bash calls refused by worktree guard | environment | resolved |
| 3 | Signup refused: invite-only without PUBLIC_MEMBER_SIGNUP_ENABLED | test_harness | resolved |
| 4 | full.mjs: "Network Relationship Management" label absent for a member | test_harness | resolved |
| 5 | full.mjs rerun failed "P1 job saved" (non-idempotent) | test_harness | resolved |
| 6 | Unscoped "Version history" locator, strict-mode violation | test_harness | resolved |
| 7 | Monitor matched itself, exit 144 | process | resolved |
| 8 | Reused earlier agent's files in bld-4100-3 | process | resolved |
| 9 | Product fixes beyond the salvage diff | informational | resolved |
| 10 | Unapproved career-bound version shows current Career Master wording | requirement_gap | unresolved |
| 11 | Approved pre-shared_snapshot versions fall back to current wording | requirement_gap | unresolved |
| 12 | No history entry in the Output Template editor; template content not diffed | requirement_gap | unresolved |
| 13 | Images/figures skipped, tables compared as one block | requirement_gap | unresolved |
| 14 | No test-result or release-log evidence on the branch | process | unresolved |
| 15 | Training spec validated only by the build agent | process | unresolved |
| 16 | Times shown in UTC only | informational | resolved |
| 17 | Re-import behaviour change (same file name becomes next version) | informational | resolved |
| 18 | No restore/revert | informational | resolved |

## Evidence and decisions

1. Resolved. No `.rej` files are tracked. The imports and hunks are present: `getOutputVersionHistory` import and `GET /:id/versions` in `server/routes/resumeOutputs.js`; `OutputVersionHistoryModal` import and mount in `src/components/admin/MyResumePanel.jsx` (lines 20 and 1105).
2-3. Resolved. Harness only. The training spec preconditions already name `PUBLIC_MEMBER_SIGNUP_ENABLED=true`. The validator should use `scripts/create-test-member.mjs`, per the release rules.
4-6. Resolved. Script errors, not product defects. Journey 1 step 1 (Career Master job add) is not idempotent, so each validation round needs a fresh database.
7-8. Resolved. Process noise. Nothing was deleted.
9. Resolved, informational. Verified in code:
   - `OutputVersionHistoryModal` uses `createPortal` to `document.body` (OutputVersionHistory.jsx:232-243).
   - `startAtLatest` exists and is passed from `WorldShell.jsx:1117`.
   - The World Shell shared block editor bar has the button (`OpportunityOutputsSection.jsx:14,156`). It opens without `startAtLatest`, so it starts on the draft being edited, normally the latest. Acceptable.
   - Server lineage ordering is `created_at ASC, id ASC`.
10. Unresolved, requirement_gap (spec Known limitations). The request asks for tracked changes between any two versions. For an unapproved career-bound version the wording is resolved from the current Career Master, so it shifts when Career Master changes. A diff involving an unapproved version can show changes the member never made in the output, or hide ones they did.
    - Step: Journey 3 step 1, Journey 5 step 3.
    - Root cause: nothing freezes career-bound wording until approval (`versionBody()`, `current_career_master` branch).
    - Files: `server/lib/outputVersionHistory.js`, `server/lib/careerBound.js`, `server/routes/resumeOutputs.js` (save path).
    - Proposed fix: on every save of a career-bound version, store the resolved blocks with it, as an additive nullable column or a key inside the existing JSON, with no backfill. `versionBody` prefers that copy and falls back to today's behaviour and note for older rows.
11. Unresolved, requirement_gap. Approved versions created before `shared_snapshot` existed fall back to current wording and say so. No data exists to recover. Keep the labelled fallback, have the validator confirm the label shows, and ask the owner whether that is acceptable. Same files as item 10.
12. Unresolved, requirement_gap (partial). The request names "output editor" and "document_blocks / template content". Entry points exist in the career-bound editor, the World Shell block editor bar, My Resume rows and the World Shell opportunity view. There is no entry point in `OutputTemplateConfigurator.jsx`, and nothing diffs template configuration content (only `document_blocks`, `career_bound` and flattened generated text). No training journey covers this.
    - Files: `src/components/admin/OutputTemplateConfigurator.jsx`, `server/lib/outputVersionHistory.js`, `src/lib/outputVersionDiff.js`.
    - Proposed fix: confirm with the owner whether template configurations are versioned in a lineage. If so, add a `versionBody` branch and a Version history button in the template editor, member scope, opened from the World Shell, with no new admin navigation. If not versioned, raise it as a needs_business_definition question rather than building it.
13. Unresolved, requirement_gap (spec Known limitation). `src/lib/outputVersionDiff.js:23,35` skips figures and diffs a table as one block, so a chart-only change (the chart gallery shipped in the same release) shows no change. Proposed fix: diff a figure by its stored spec or data key and show a "figure changed" chip, diff table rows or cells, and add a journey with a chart edit.
14. Unresolved, process. The change spec says journeys are "in the release log", but the branch has no `docs/test-results/output-version-history/` or `docs/release-log/` file. Evidence is only the build agent's report (33 of 33 on a clean database). The validator must produce round-1 results.
15. Unresolved, process. Training Journeys 0-8 were walked once by the build agent, not independently. Journey 8 (390px) and the edge cases (unreadable version, load failure with Retry, foreign id 404, single version) are not reported as walked. The validator must walk each.
16-18. Resolved, informational. All are documented in the change spec "Behaviour changes" and "Known limitations". Re-import is the one with a data-shape effect: same-name imports now join an existing lineage (`careerPlacementAgents.js`) instead of creating a second output. It is covered by Journey 7.

## Owner-direction check
No conflict found. The diff touches no admin nav config and adds no admin navigation entry. Entry points are in the World Shell and existing member panels. The history route is member-scoped by `req.user.id`. Validation must run as the member (`member@test.local`), not the admin. The view is read-only, and approving stays on `assertReadyToFinalize`. No `server/data/applicationPackages/*` file is in the diff, and the specs use fictional names only.
