# Release log: 2026-10-02-application-packages-resume

- Release: 2026-10-02-application-packages-resume
- Integration branch: `claude/zealous-meitner-5tuft5` (not pushed by this release)
- Integration head when recorded: 13d5b65
- Process: `server/data/releaseLoop/definition.json` (version 2, maxFixRounds 4)
- Recorded: 2026-10-09 by the release recorder
- Data: fictional only. No employer or application-target name appears in this log.

## Final results

| Feature | Final status | Rounds in this release | Last commit tested (any release) | Last round steps (any release) | Open items |
|---|---|---|---|---|---|
| proficiency-live-qr: Proficiency rules, technology categories, finalization gate, live QR page | **NOT PASSED** (`not_started` in this release) | 0 validation, 0 triage, 0 fix | 6ac1df0 (round 5 of release 2026-10-02-proficiency-live-qr) | 29 / 30 | 6 open this-feature items, 3 owner questions, 5 backlog items (not blocking) |

**This release did not pass.** Its one feature, `proficiency-live-qr`, was handed to the recorder with status `not_started`, no rounds, no escalations and no `needsHuman` items. No build, validation, triage or fix agent ran for it in this release. No sweep was run (`sweep: null`). Under the push gate, the integration branch must not be pushed on the strength of this release unless the owner says otherwise.

The feature has history from the earlier release `2026-10-02-proficiency-live-qr` ([release log](2026-10-02-proficiency-live-qr.md)). There it reached round 5 and was recorded as not passed after the maximum fix rounds. That history is summarised below so this log stands alone. It is evidence from the earlier release, not a result of this one.

### Why the last result is out of date

Round 5 tested commit 6ac1df0. Since then `src/components/admin/OutputTemplateConfigurator.jsx`, which is the Output Templates editor in Journey 8, has changed. Fix 95c2adf (career-bound-outputs fix round 2, merged in 957726a) added text colours, `ovPicks` override state and lighter-grey label changes. Many other files also changed between 6ac1df0 and 13d5b65 (26 files, including a `main` merge in 715125b). No validator has run this feature's training spec against the current head. Any new round must test 13d5b65 or later.

## Escalated for a business definition (owner questions, not answered, not guessed)

The workflow data for this release lists no escalations. The questions below are still open from the earlier release, and the bug state (`docs/release-log/active-release.state.json`, exported 2026-10-09T05:46Z) still shows them open. They are repeated here so they are not lost.

1. **Salt particles chart design (J7.4; items proficiency-live-qr-F2-4, F3-4, F4-4).** Exact question: "After seeing the first Salt particles rendition (QR page, chart view, Journey 7 step 4), what should change: grain size or density, colours, motion, heap shape?" `src/components/SaltParticleChart.jsx` was created in a0ff84a. Nothing will be built until this is answered.
2. **Non-career-bound outputs (third J7.2 wording state; items F3-1, F4-5).** Exact question: "How should a member create an output that is not bound to Career Master? Is the World Shell opportunity panel's Import resume/cover letter path (`POST /api/career-agents/opportunities/:id/import-output`, filing `source='imported'`) the intended way, or should there be another?" Until it is answered, the training spec cannot name a path that produces the frozen-text sentence "The document text above always stays exactly as approved."
3. **Levels table at phone width (J8.4, the round-5 failure).** Exact question: "In the Output Templates editor at 390px, is the captioned in-table sideways scroll of the Levels and why table acceptable, the same behaviour Career Master already has and round 4 accepted, so that J8.4 should be reworded? Or should the Levels table stack as cards at phone width?"

## Bugs at the per-bug fix-attempt limit (needsHuman)

None. The workflow data lists no `needsHuman` items. In the state export, the highest attempt count on any proficiency-live-qr item is 2 (T2-3, verified). No open item has had a fix attempt. Every open item is waiting on an owner answer or a spec edit, as listed below.

## Feature: proficiency-live-qr

Status: **NOT PASSED**. Not started in this release.

- Training spec: [docs/training/proficiency-rules-and-live-qr.md](../training/proficiency-rules-and-live-qr.md)
- Change spec (with fix notes per round): [docs/changes/proficiency-rules-and-live-qr.md](../changes/proficiency-rules-and-live-qr.md)
- Built before either release: a0ff84a, f1ad622, b1ae2d3, 8fc685e, dd58da6 (validate and fix only)

### Rounds in this release

None. No test-result, triage or fix file was produced for this release.

### Rounds from the earlier release (2026-10-02-proficiency-live-qr), for reference

| Round | Commit tested | Steps | Test result | Triage | Fix commit / merge | Fix files |
|---|---|---|---|---|---|---|
| 1 | ac66592, 4d8cff3 | not totalled (two edge cases BLOCKED) | [round-1](../test-results/proficiency-live-qr/round-1.md) | [round-1](../triage/proficiency-live-qr-round-1.md) | cffa621 / fb77c78 | `CareerExperienceConfigurator.jsx`, `CareerMasterEntryPoint.jsx`, `ProficiencyRulesPanel.jsx`, `careerCharts.js`, `ChartViews.jsx` |
| 2 | 8430eae | 28 / 31 | [round-2](../test-results/proficiency-live-qr/round-2.md) | [round-2](../triage/proficiency-live-qr-round-2.md), [fix-r2 reconciliation](../triage/proficiency-live-qr-fix-r2-reconciliation.md) | 47b1b42 / 53774b8 | `SharedLiveStates.jsx`, `SharedOutputPage.jsx`, `CareerExperienceConfigurator.jsx`, training spec |
| 3 | fe28090 | see file | [round-3](../test-results/proficiency-live-qr/round-3.md) | [round-3](../triage/proficiency-live-qr-round-3.md), [fix-r3 reconciliation](../triage/proficiency-live-qr-fix-r3-reconciliation.md) | c464731 / 01c0849 | training spec, change spec (docs only) |
| 4 | 6cc72e2 | see file | [round-4](../test-results/proficiency-live-qr/round-4.md) | round-4 triage file was never committed; see the [fix-r4 reconciliation](../triage/proficiency-live-qr-fix-r4-reconciliation.md) | 9b01768 / eda4f90 | `OutputTemplateConfigurator.jsx`, change spec |
| 5 | 6ac1df0 | 29 / 30 | [round-5](../test-results/proficiency-live-qr/round-5.md) | none (fix rounds exhausted) | none | none |

The one failure in round 5 was **J8 step 4**. At 390px in the Output Templates editor, Rules & why tab, the Levels and why table is 940px wide inside a 239px scroller. Five columns can only be read by swiping sideways inside the table. The page itself does not scroll sideways, and round 5 confirmed the layout fix R4-1. The validator raised owner question 3 above. The full per-round failures, triage and fix narrative is in the [earlier release log](2026-10-02-proficiency-live-qr.md).

### Triage items: verified fixed (earlier release)

| Id | Step | Class | Root cause | Fix commit | Verified |
|---|---|---|---|---|---|
| T1-1 | J1.1 heading and selected path card | defect | Navy text with no surface on the dark World embed (`CareerExperienceConfigurator.jsx:166`, `CareerMasterEntryPoint.jsx:27`) | cffa621 | round 2 and explicitly in round 5 |
| T1-2 | 390px Rules & why table and QR charts | defect | A 940px table with no scroll cue; fixed-viewBox SVGs scaled to about 0.5 | cffa621 | round 2 and explicitly in round 5 |
| T2-1 | J7.1 zero-change LIVE DATA banner | defect | `SharedLiveStates.jsx` showed the light background when there were no changes | 47b1b42 | round 3 |
| T2-2 | J7.5 spec example | spec_error | J2 sets the category before approval, so the example could not occur | 47b1b42 | round 3 |
| T2-3 | 390px workspace tabs | spec_error (2 attempts) | Tab row did not wrap; spec wording was then corrected | 47b1b42, c464731 | round 4 |
| T2-4 | J7.2 wording vs banner | defect | Banner text was hard-coded as frozen, but career-bound outputs re-resolve their wording | 47b1b42 | round 3 |
| F2-2 | Change spec fix notes, round 2 | process | Notes were written before the checks were run | c464731 | round 4 |
| F2-3 | Output Template editor | requirement_gap | Rules panel was already mounted; J8 added | c464731 | round 4 |

### Open items blocking this feature (scope: this_feature)

| Id | Step | Class | Root cause | Files | Owner | History |
|---|---|---|---|---|---|---|
| proficiency-live-qr-F2-4 | QR page chart view, Salt particles | requirement_gap | Waiting on owner design feedback | `src/components/SaltParticleChart.jsx` | not assigned | Found r2; not fixed r3 (owner question 1) |
| proficiency-live-qr-F3-4 | J7.4 | requirement_gap | Design decisions need the owner | `src/components/SaltParticleChart.jsx` | not assigned | Found r3; not fixed r4 (`needs_business_definition`) |
| proficiency-live-qr-F4-4 | J7.4 Salt particles (same as F3-4) | requirement_gap | Design choices cannot be invented | `src/components/SaltParticleChart.jsx` | not assigned | Found r4 |
| proficiency-live-qr-F3-1 | J8; J7.2 third state | process | Round 3 changed docs only. The J7.1/J7.2 path does not reach the third wording state | `OutputTemplateConfigurator.jsx`, `SharedLiveStates.jsx`, training spec | not assigned | Found r3 (owner question 2) |
| proficiency-live-qr-F4-5 | J7.1/J7.2 third wording state (same as F3-1) | process | The training spec does not name the import path | training spec, `SharedLiveStates.jsx`, `WorldShell.jsx` | not assigned | Found r4 |
| proficiency-live-qr-F4-8 | Known-limitations gaps: spec nits, weak edge coverage | process | Spec wording and the edge-case payload were not tightened | training spec, change spec, `OutputTemplateConfigurator.jsx` | not assigned | Found r4 |
| (round-5 failure) | J8.4 Levels table at 390px | not triaged (fix rounds exhausted) | Table inside a nested-card scroller | `src/components/admin/ProficiencyRulesPanel.jsx`, `OutputTemplateConfigurator.jsx` | not assigned | Round 5 (owner question 3) |

### Backlog: NOT blocking this feature

These items are in the state export with a non-blocking scope. Each one lists its evidence and owner.

| Id | Scope | Class / status | Evidence | Owner |
|---|---|---|---|---|
| R4-1 | pre_existing | defect, `backlog_pre_existing` | The fixed `220px 1fr 380px` grid in `OutputTemplateConfigurator.jsx` came from a875b9b (2026-07-10), before this feature. The clipping reproduces without the feature. A responsive fix was already committed (9b01768), and round 5 passed the layout part of J8.4. | not assigned |
| proficiency-live-qr-F2-1 | process_note | process | The agent sandbox refused a compound boot command and the round-2 fix agent did not retry. This was a tooling refusal with no product or spec cause. | not assigned |
| proficiency-live-qr-F3-5 | process_note | process (fixed in 9b01768) | Journey J8 was added after round 3, so earlier rounds never ran it. The layout defect itself is tracked as R4-1. | not assigned |
| proficiency-live-qr-F3-6 | process_note | process (fixed in 9b01768) | Fix notes in the change spec did not cite browser evidence. This is loop record-keeping, not product. T1-1 and T1-2 were browser-verified in round 5. | not assigned |
| proficiency-live-qr-F4-7 | process_note | process | No validator step explicitly asserts T1-1 (dark embed readability). This is a coverage note about the loop, not a defect. | not assigned |

No item has scope `other_feature`.

## Integration commits

None in this release. No branch was built, fixed or merged for `proficiency-live-qr`. For reference, the earlier release's integration commits were fb77c78, 53774b8, 01c0849 and eda4f90 (logs commits ed0024d, fe28090, 6cc72e2 and 6ac1df0). Commits that later touched this feature's files came from other features (957726a, merging 95c2adf from career-bound-outputs).

## Every reported failed or refused command

| Source | Command | State it left |
|---|---|---|
| Workflow data for this release | None reported (no agents ran for the feature) | n/a |
| Release recorder (this log) | A recursive `grep -r` over `docs server .claude` for the release name exceeded the 120s timeout and was moved to the background | Read-only. Replaced with `git grep`, which found no prior mention of this release name. The background search was left to end with the recorder session and wrote nothing to the repo. |
| Earlier release | 11 failed or refused commands (a database destroyed outside the session, sandbox refusals, a missing round-4 triage file, and others) | See "Every reported failed or refused command" in the [earlier release log](2026-10-02-proficiency-live-qr.md) |

The recorder started no server or database and has nothing to clean up.

## What has to happen for this feature to pass

1. The owner answers questions 1 to 3 above.
2. The training spec is updated: name the import path for the third J7.2 state, reword or redefine J8.4, and tighten the F4-8 nits.
3. A validator follows the full training spec in a browser against a fresh database on the current head (13d5b65 or later), because the editor changed after round 5.

## Log index

- Test results: [round-1](../test-results/proficiency-live-qr/round-1.md), [round-2](../test-results/proficiency-live-qr/round-2.md), [round-3](../test-results/proficiency-live-qr/round-3.md), [round-4](../test-results/proficiency-live-qr/round-4.md), [round-5](../test-results/proficiency-live-qr/round-5.md) (all from the earlier release; none from this one)
- Triage: [round-1](../triage/proficiency-live-qr-round-1.md), [round-2](../triage/proficiency-live-qr-round-2.md), [round-3](../triage/proficiency-live-qr-round-3.md), round-4 (never committed), [scope review](../triage/scope-review.md)
- Fix reconciliations: [r2](../triage/proficiency-live-qr-fix-r2-reconciliation.md), [r3](../triage/proficiency-live-qr-fix-r3-reconciliation.md), [r4](../triage/proficiency-live-qr-fix-r4-reconciliation.md)
- Bug state: [active-release.state.json](active-release.state.json) (exported 2026-10-09T05:46Z), [release tracker](release-tracker.md)
- Sweep: none run for this release.
