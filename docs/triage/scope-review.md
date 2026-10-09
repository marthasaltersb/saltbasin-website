# Scope review

Reviewed 2026-10-09T01:02:16Z. Integration branch claude/zealous-meitner-5tuft5. Evidence is git history (git log -S, git blame, diff against e0ea466, the last pre-session commit) and the feature definitions in docs/release-log/active-release.features.json. No bug was reproduced on a base build; every pre_existing and other_feature call rests on code history.

## career-bound-outputs

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| career-bound-outputs-B9 | process_note |  | Commit trailer: the agent followed the session attribution reminder over the task text. Process wording only. |
| career-bound-outputs-F2-3 | this_feature |  | Overrides were stored on the preset because template outputs have no row. masterOverrides.js and the override UI came from 9df7a85/95c2adf, and the feature's request is overrides "stored on the output". |
| career-bound-outputs-F2-4 | process_note |  | Commit trailer: the agent followed the session attribution reminder over the task text. Process wording only. |
| career-bound-outputs-F2-5 | process_note |  | Fix agents recorded results in the change spec instead of docs/test-results/career-bound-outputs/round-N.md. Report-file location. |
| career-bound-outputs-F2-6 | this_feature |  | CareerBoundOutputEditor.jsx (new in 9df7a85): the Save changes button has no disabled styling. Feature's own component. |
| career-bound-outputs-F2-7 | this_feature |  | The Career Sources to Review dialog is CareerReconciliationPanel.jsx / MyResumePanel.jsx wiring added by 9df7a85 and fix r1/r2 (3472137, 95c2adf). The queue is the feature's deliverable. |
| career-bound-outputs-F2-8 | this_feature |  | The Convert to career-bound output flow is server/lib/careerBound.js and CareerReconciliationPanel.jsx, both introduced by 9df7a85. |
| career-bound-outputs-F2-9 | this_feature |  | The cream text comes from WorldShell.jsx embedShell color #f5f0e8 (blame 8fd7f7c, 2026-08-07, pre-existing), but the unreadable surfaces in J1.2a/J9.0 are this feature's own editors, so the fix belongs in its components. |
| career-bound-outputs-F2-10 | this_feature |  | The feature requests template-driven outputs that bind skills/tools/certifications to Career Master. The default layout in Output.jsx not rendering them means that request is not met. |
| cbo-r2-inherited-cream-text | this_feature |  | The inherited cream text from WorldShell.jsx:1406 predates the session (8fd7f7c, 2026-08-07), but the failing journeys J1 1.2a and J9 9.0 are this feature's, and CareerBoundOutputEditor.jsx (new, 9df7a85) sets no text colour. The other components named (OutputTemplateConfigurator, MyResumePanel dialogs) share the same missing colour. |
| career-bound-outputs-F1-3 | this_feature |  | The feature requests binding roles, skills, tools, certifications and KPIs. The override editor (OutputTemplateConfigurator.jsx, masterOverrides.js from 9df7a85) was built for jobs only. |
| career-bound-outputs-F1-4 | this_feature |  | Same as F2-3: the change spec Known limitations say overrides live on the preset because template outputs have no per-document row, while the request says stored on the output. |
| career-bound-outputs-F1-5 | this_feature |  | Journey ordering error in docs/training/career-bound-outputs.md (J8 mutates state that J7.4 needs). Feature's own spec. |
| career-bound-outputs-F1-7 | process_note |  | Commit trailer: the agent followed the session attribution reminder over the task text. Process wording only. |
| career-bound-outputs-F1-8 | process_note |  | Fix agents recorded results in the change spec instead of docs/test-results/career-bound-outputs/round-N.md. Report-file location. |

## chart-gallery

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| chart-gallery-B8 | pre_existing |  | server/lib/careerAtomMigration.js (a boolean bound to $3::jsonb in the evidence INSERT at line 63; is_active_portfolio is a registry column) has no diff against e0ea466, and syncSingleEntry was already called from careerMaster.js in e0ea466 (git grep). It reproduces without chart-gallery by code history; not reproduced on a base build. |
| chart-gallery-B9 | this_feature |  | The request is "pick a chart -> it inserts/updates the block -> preview updates", but ChartGallery.jsx (6dd06e5) uses a two-step pick then Add. |
| chart-gallery-B10 | this_feature |  | docs/training/chart-gallery.md validation setup used a builder shortcut. The feature's own spec must be runnable by a literal validator. |
| CG-R1-1 | this_feature |  | The position:sticky live-preview column was added by 6dd06e5 (git log -S sticky) and does not engage. |
| CG-R1-2 | this_feature |  | docs/training/chart-gallery.md:77 requires the failed-load alert to include the HTTP status. The proficiency loader via api.getCareerProficiency in OutputTemplateConfigurator was wired by the gallery build, and src/lib/api.js request() omits the status. |
| CG-R1-3 | pre_existing |  | The fixed 3-column grid in OutputTemplateConfigurator.jsx dates from a875b9b (2026-07-10), and the chart-gallery spec and request do not mention 390px. Same layout defect as R4-1. |

## cover-letter-agent

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| cover-letter-agent-B1 | process_note |  | Worktree isolation blocked writing the report to the shared checkout. Report-file location. |
| cover-letter-agent-B2 | process_note |  | Build was done on an old base and rebased. Integration bookkeeping (merge a5e7883 resolved it). |
| cover-letter-agent-B3 | this_feature |  | The request says the agent is "reachable from the World Shell opportunity view", but the build placed entry points in Classic Tools / My Resume. |
| cover-letter-agent-B4 | pre_existing |  | The 428 for members owing terms/password has existed since ba89744 (2026-08-10) and src/lib/api.js had no 428 handling before the session. Not part of the cover-letter request. |
| cover-letter-agent-B5 | process_note |  | Informational note with no stated cause: an island click in the 3D canvas could not be driven by the agent. |
| cover-letter-agent-B6 | this_feature |  | docs/training/cover-letter-agent.md was written around a hand-built account. The spec must use create-test-member.mjs. |
| cover-letter-agent-B7 | this_feature |  | The request puts the letter "into its linked drafts", but coverLetterTemplate.js, packageSearch.js and packageAssembly.js (4be0bec) were written without the link mechanism and career-bound overrides they must integrate with. |
| cover-letter-agent-B8 | pre_existing |  | The request asks for a title block, TOC and the cover letter only; chart blocks are not in it. packageAssembly.js is new in 4be0bec, but the gap is not part of the ask. |
| cover-letter-agent-B9 | this_feature |  | The scope additions are in the Classic Tools CoverLetterPackagesPanel.jsx (new in 4be0bec), while the request says reachable from the World Shell. |
| cover-letter-agent-B10 | process_note |  | No Anthropic key in the test environment, so only the stub provider ran. Environment limitation. |
| cover-letter-agent-B11 | this_feature |  | The request includes a "Generate for this opportunity" action, but the new deterministic generator (coverLetterAutoDraft.js) was not wired into the WorldShell rail. |
| cover-letter-agent-B12 | process_note |  | Sandbox limits and harness notes. Environment. |

## no-silent-failures

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| no-silent-failures-B11 | pre_existing |  | src/lib/careerMaster.js fetchCareerMaster is unchanged since a875b9b (2026-07-10), and docs/changes/no-silent-failures.md Known limitations explicitly excludes the other /output/* pages (the feature covers six named places). |
| no-silent-failures-B12 | this_feature |  | docs/training/no-silent-failures.md P1 signs in as admin. The spec must use a member account. |
| no-silent-failures-B13 | this_feature |  | docs/training/no-silent-failures.md relies on a classic URL, CLI and console setup. The spec entry points are the feature's own. |
| no-silent-failures-B14 | pre_existing |  | No UI to add a career chart block to a template existed in e0ea466. The gallery that supplies it is chart-gallery (6dd06e5, merged later) and is not in no-silent-failures' request. |
| no-silent-failures-B15 | this_feature |  | The RECORDED DATA banner and liveError notices in SharedLiveStates.jsx were introduced by 8fc685e (git log -S). The banner sentence not adapting when liveError is set is this feature's own wording. |
| no-silent-failures-B16 | pre_existing |  | The remaining silent paths (for example server/lib/careerAtomMigration.js, which has no diff against e0ea466) are outside the six places in docs/changes/no-silent-failures.md. |

## output-version-history

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| output-version-history-B3 | process_note |  | Integration advanced after the rebase, so a diff against its tip shows later release-intelligence files as deletions. Integration bookkeeping. |
| output-version-history-B8 | this_feature |  | versionBody() in server/lib/outputVersionHistory.js (e2752fd) resolves draft content live. The feature requests a scrubbing timeline of previous states, which needs a reproducible body. |
| output-version-history-B9 | other_feature | career-bound-outputs | Career-bound drafts are computed from Career Master plus overrides and have no stored document (design from 9df7a85), so there is nothing frozen to recover for a version. |
| output-version-history-B10 | this_feature |  | toDiffItems in src/lib/outputVersionDiff.js (e2752fd) is text-only, while the feature requests block-level tracked changes between versions. |
| output-version-history-B11 | this_feature |  | The request says reachable from "the output editor". The entry points omit OutputTemplateConfigurator, and the history feature is e2752fd. |
| output-version-history-B12 | process_note |  | Only the build agent walked the journeys and no round results exist yet. Loop record gap. |
| output-version-history-B14 | this_feature |  | docs/training/output-version-history.md preconditions require a signup flag and riley.member credentials instead of create-test-member.mjs. Feature's own spec. |

## proficiency-live-qr

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| proficiency-live-qr-F2-1 | process_note |  | Agent sandbox refused a compound boot command and the fix agent did not retry. Tooling refusal, no product or spec cause. |
| proficiency-live-qr-F2-4 | this_feature |  | src/components/SaltParticleChart.jsx was created by a0ff84a (proficiency-live-qr chart views). The open item is an owner design decision on this feature's own chart; it needs an owner answer. |
| proficiency-live-qr-F3-1 | this_feature |  | The third wording state of the live-data banner is in src/components/SharedLiveStates.jsx (a0ff84a, 8fc685e, 47b1b42). The J7.1/J7.2 path in docs/training/proficiency-rules-and-live-qr.md does not reach it, so the feature's spec must be corrected. |
| proficiency-live-qr-F3-4 | this_feature |  | src/components/SaltParticleChart.jsx was created by a0ff84a (proficiency-live-qr chart views). The open item is an owner design decision on this feature's own chart; it needs an owner answer. |
| proficiency-live-qr-F3-5 | process_note |  | Loop-process item: journey J8 was added to the training spec after round 3, so earlier rounds never ran it. The layout defect itself is tracked as R4-1. |
| proficiency-live-qr-F3-6 | process_note |  | Fix notes in docs/changes/proficiency-rules-and-live-qr.md were written without citing browser evidence. Release-loop record keeping, not product. |
| proficiency-live-qr-F4-4 | this_feature |  | src/components/SaltParticleChart.jsx was created by a0ff84a (proficiency-live-qr chart views). The open item is an owner design decision on this feature's own chart; it needs an owner answer. |
| proficiency-live-qr-F4-5 | this_feature |  | Same defect as F3-1: the feature's training spec does not name the import path that produces the third wording state. |
| proficiency-live-qr-F4-7 | process_note |  | No validator step explicitly asserts T1-1 (dark embed readability). Validation-coverage note about the loop, not a product defect. |
| proficiency-live-qr-F4-8 | this_feature |  | Spec wording nits and a weak edge payload in docs/training/proficiency-rules-and-live-qr.md and docs/changes/proficiency-rules-and-live-qr.md, the feature's own specs. |
| R4-1 | pre_existing |  | OutputTemplateConfigurator.jsx S.shell grid "220px 1fr 380px" was introduced by a875b9b (2026-07-10, before the session; git log -S). The clipping reproduces without this feature, which only added a 5th tab inside the existing layout. A responsive fix is already committed in the r4 fix. |

## qr-gated-outputs

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| qr-gated-outputs-B7 | this_feature |  | docs/training/qr-gated-outputs.md preconditions were written before member test accounts existed. The spec must be right. |
| qr-gated-outputs-B8 | pre_existing |  | The World Shell had no My Resume island before 3472137 (career-bound fix r1), and the qr-gated-outputs request does not include World Shell navigation. The gap predates the feature and is not in its request. |
| qr-gated-outputs-B9 | pre_existing |  | Import is script-only (scripts/import-application-package.mjs). The request says "fictional package import" with no in-app control, and MyResumePanel never had one in e0ea466. |
| qr-gated-outputs-B10 | this_feature |  | The feature title and request include "clickable QR in PDF/docx". The docx path (scripts/stamp-application-package-docx.py, d78bcda/76b33ad) has no journey or UI, so the requested capability is untested. |
| qr-gated-outputs-B11 | this_feature |  | Journey 6 of docs/training/qr-gated-outputs.md asks to verify PDF annotations that a browser cannot show. The spec must give a runnable check. |
| T1 | this_feature |  | MyResumePanel.jsx:1052 uses an em dash where docs/training/qr-gated-outputs.md:88 has a hyphen. Feature's own spec. |
| T2 | this_feature |  | DocumentBlocksView.jsx, the document_blocks path in outputRendering.js and applicationPackages.js were introduced by d78bcda, and header.contact has no defined type there. |
| T3 | this_feature |  | Toast wording differs from docs/training/qr-gated-outputs.md lines 100/155/169 (hyphen). Feature's own spec. |

## release-intelligence

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| release-intelligence-B7 | this_feature |  | The admin-nav entry in AdminShell.jsx and server/db.js came from the feature's own salvaged partial build (e4f85ca). |
| release-intelligence-B8 | this_feature |  | The request lists commits in reconciliation, but releaseReconcile.js and releaseLogImporter.js (this feature) stop at storing the sha. |
| release-intelligence-B9 | process_note |  | Validation round 1 has not run yet. Loop record gap. |
| release-intelligence-B10 | this_feature |  | Known limitations of the feature's own code: the chart is categorical although the request names dated trend charts and a timeline slider, and scripts/import-release-logs.mjs has no auto ingest. |

## release-loop-tooling

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| release-loop-tooling-B1 | this_feature |  | Docs written by this feature (docs/release-process.md, SKILL.md, definition.json, CLAUDE.md) describe a capability that was never implemented. |
| release-loop-tooling-B2 | this_feature |  | Dead-agent detection in scripts/release-tracker-sync.mjs is this feature's own script and is limited to extras. |
| release-loop-tooling-B3 | this_feature |  | tools/release-tracker/index.html was created by this feature (bed12f0). The 390px reflow is its own gap. |
| release-loop-tooling-B4 | process_note |  | Only the local harness stub of the host check was tested. Validation-environment limitation. |
| release-loop-tooling-B5 | pre_existing |  | The feature definition lists a static tracker page and scripts with no World Shell requirement. The World Shell surface belongs to the separate in-app-release-loop feature, so this gap is not in this feature's request. |

## resume-rollups

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| resume-rollups-B3 | this_feature |  | docs/training/resume-rollups.md Journey 7 step 3 does not state exact match. Feature's own spec. |
| resume-rollups-B4 | other_feature | proficiency-live-qr | PER_TYPE_SEEDED_DEFINITION_TYPES (re-seed when a type has no rows) was introduced by a0ff84a for proficiency_formula. resume-rollups (4f35fd4) only added its types to the set, so the behaviour reproduces for proficiency_formula without this feature. |
| resume-rollups-B5 | this_feature |  | No journey in docs/training/resume-rollups.md selects the new grouping in the block picker. The Career Rollup Group-by option (CareerProspectBlocks.jsx, EditorPane.jsx) is added by 4f35fd4. |
| resume-rollups-B8 | this_feature |  | Journeys were validated as admin through /member. The spec must use member@test.local via the World Shell. |
| resume-rollups-B9 | other_feature | qr-gated-outputs | The hero wording "Betsy Salter is a Strategic Operator: 13 years, 8 employers..." (Output.jsx:1467,1471) was added by d78bcda (git log -S "13 years, 8 employers"), qr-gated-outputs. The teaser tagline at Output.jsx:2032 predates the session (a875b9b). resume-rollups replaced the figures but not these labels. |
| resume-rollups-B10 | this_feature |  | The capability bars in Output.jsx are now computed by resume-rollups (4f35fd4, replacing computeCapabilityMeters) and count the recorded tier, while the feature request says proficiency comes from careerProficiencyEngine. |
| resume-rollups-B11 | this_feature |  | src/lib/outputBlocks.js column count was last changed by 4f35fd4; the new default tile set was not reflected by the feature. |
| resume-rollups-B12 | this_feature |  | Equal keyword hits counted across buckets is the feature's own rule in server/lib/resumeRollups.js (4f35fd4), with an undefined business rule. |
| resume-rollups-B13 | this_feature |  | docs/training/resume-rollups.md has no edge-case journeys. Feature's own spec. |
| resume-rollups-B14 | process_note |  | Branch was not rebased before integration. Integration bookkeeping. |

## world-shell-navigation

| Bug | Scope | Owner | Evidence |
| --- | --- | --- | --- |
| world-shell-navigation-B8 | process_note |  | Commit trailer wording conflict between the task text and the session attribution reminder. Not product or spec. |
| world-shell-navigation-B9 | this_feature |  | docs/training/world-shell-opportunity-outputs.md predates the scripts/create-test-member.mjs rule. The spec is the feature's own and must use member accounts. |
| world-shell-navigation-B11 | this_feature |  | Spec gap in docs/training/world-shell-opportunity-outputs.md: the 3D island entry in WorldShell.jsx was never exercised, and reaching the pipeline from a World Shell island is the feature's request. |
| world-shell-navigation-B12 | pre_existing |  | The feature definition asks only for an import-application-package.mjs option to create/link the placeholder. An in-app package upload is not in its request. Package import has been script-only since d78bcda. |
| world-shell-navigation-B14 | process_note |  | Header of docs/changes/world-shell-opportunity-outputs.md names a stale release/integration branch. Documentation bookkeeping. |
| wsn-r1-auto-cover-letter | other_feature | cover-letter-agent | coverLetterAutoDraft.js registers the onOpportunityCreated hook and cover_letter_settings.autoDraft defaults to true; both were added in 4be0bec (merged by a5e7883, branch release-loop/cover-letter-agent-build), whose request is "every job opportunity gets a template cover letter". The extra draft changes world-shell-navigation spec counts (J2.3, J4.1, J9.1). |

## Summary

| Scope | Count |
| --- | --- |
| this_feature | 53 |
| pre_existing | 12 |
| other_feature | 4 |
| process_note | 21 |
| total | 90 |

| Feature | this_feature | pre_existing | other_feature | process_note |
| --- | --- | --- | --- | --- |
| career-bound-outputs | 10 | 0 | 0 | 5 |
| chart-gallery | 4 | 2 | 0 | 0 |
| cover-letter-agent | 5 | 2 | 0 | 5 |
| no-silent-failures | 3 | 3 | 0 | 0 |
| output-version-history | 4 | 0 | 1 | 2 |
| proficiency-live-qr | 6 | 1 | 0 | 4 |
| qr-gated-outputs | 6 | 2 | 0 | 0 |
| release-intelligence | 3 | 0 | 0 | 1 |
| release-loop-tooling | 3 | 1 | 0 | 1 |
| resume-rollups | 7 | 0 | 2 | 1 |
| world-shell-navigation | 2 | 1 | 1 | 2 |
