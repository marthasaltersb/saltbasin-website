# Release log: 2026-10-02-proficiency-live-qr

- Release: 2026-10-02-proficiency-live-qr
- Integration branch: `claude/zealous-meitner-5tuft5` (not pushed)
- Process: `server/data/releaseLoop/definition.json` (maxFixRounds 4)
- Recorded: 2026-10-08 by the release recorder
- Data: fictional only (test member `member@test.local`, fictional tools such as Ledgerly ERP, QuoteFlow CPQ, Fiscalis TMS, fictional employer "Northwind Advisory")

## Final results

| Feature | Final status | Rounds | Last commit tested | Last round steps | Open items |
|---|---|---|---|---|---|
| proficiency-live-qr: Proficiency rules, technology categories, finalization gate, live QR page | **NOT PASSED** (`not_passed_after_max_rounds`) | 5 validation rounds, 4 fix rounds | 6ac1df0 | 29 / 30 | J8.4 Levels table needs sideways scroll at 390px; 3 owner questions (below) |

**This release did not pass.** The one feature in it, `proficiency-live-qr`, used all 4 fix rounds and still failed one step in round 5 (Journey 8 step 4). Under the push gate, the integration branch must not be pushed unless the owner says otherwise.

The workflow data passed to the recorder had empty `escalated` and `needsHuman` lists. The round logs, however, raise three owner questions that are still open. They are listed under "Escalated for a business definition" below so they are not lost. No bug was recorded as hitting the per-bug fix-attempt limit (`needsHuman` is empty). The one failure that recurred across rounds (390px readability in Rules & why) is listed with its full history under "Recurring item for a person to take over", because the feature as a whole hit the round limit on it.

## Escalated for a business definition (owner questions, not answered, not guessed)

1. **Salt particles chart design (J7.4, triage F2-4 / F3-4).** Exact question: "After seeing the first Salt particles rendition (QR page, chart view, Journey 7 step 4), what should change: grain size or density, colours, motion, heap shape?" `src/components/SaltParticleChart.jsx` is unchanged and nothing will be built until answered. Round 5 confirmed the first rendition behaves as specified (grains fall for about 1.7 s, settle with a gold line and value, hover tooltip).
2. **Non-career-bound outputs (third J7.2 wording state, triage F3-1).** Exact question raised by the round-5 validator: "How should a member create an output that is not bound to Career Master?" Round 5 found only "New career-bound resume from Career Master" on My Resume. Note: the round-4 fix reconciliation found an existing UI path (World Shell opportunity panel, Import resume/cover letter, `POST /api/career-agents/opportunities/:id/import-output`) that files a `source='imported'` output and should show the frozen-text sentence "The document text above always stays exactly as approved." The training spec does not yet name that path and no validator has driven it. The owner should confirm whether that import path is the intended way, or define another.
3. **Levels table at phone width (J8.4, round-5 failure).** Exact question: "In the Output Templates editor at 390px, is the captioned in-table sideways scroll of the Levels and why table acceptable (same behaviour Career Master already has and round 4 accepted), so J8.4 should be reworded? Or should the Levels table stack as cards at phone width?"

## Feature: proficiency-live-qr

Status: **NOT PASSED** after the maximum number of fix rounds. Already built before this release (a0ff84a, f1ad622, b1ae2d3, 8fc685e, dd58da6); the loop validated and fixed it.

- Training spec: `docs/training/proficiency-rules-and-live-qr.md`
- Change spec (with fix notes per round): `docs/changes/proficiency-rules-and-live-qr.md`

### Round 1 (from the committed logs; not in the workflow data passed to the recorder)

- Validation: [docs/test-results/proficiency-live-qr/round-1.md](../test-results/proficiency-live-qr/round-1.md). Commits tested: ac66592 (journeys 1 to 7, phone check) and 4d8cff3 (post-fix login check and empty-state edge case). passed = false.
- Failures:
  - F1: member without accepted career terms or with forced password change got HTTP 428 on page and script loads; fixed upstream in b586d4f before triage, re-checked on 4d8cff3.
  - F2 (J7.1): zero-change LIVE DATA banner light, not dark.
  - F3 (J7.5): spec example not reproducible after Journey 2.
  - F4 (390px, Rules & why): Levels table clipped, no scroll cue.
  - Two edge cases BLOCKED (bad slug UI text, methodology 403 not exercised live) because the validator's database and server were destroyed by something outside its session.
- Environment problems reported: the first member was created with `POST /api/members/signup` instead of the test-member script, and the validator worked around the 428 gate with a direct consent call and a direct `UPDATE users`. Journeys 1 to 7 were not re-run on the fixed build.
- Triage: [docs/triage/proficiency-live-qr-round-1.md](../triage/proficiency-live-qr-round-1.md)
  - T1-1 (defect): dark-on-dark heading and selected path card in the World embed. Root cause: `CareerExperienceConfigurator.jsx:166` sets navy text with no surface; `CareerMasterEntryPoint.jsx:27` selected card translucent.
  - T1-2 (defect): 390px Levels table unreachable (`ProficiencyRulesPanel.jsx:358-361`, 940px table, no cue) and QR chart labels unreadable (`careerCharts.js` fixed viewBox SVGs scaled to about 0.5).
- Fix: branch `release-loop/proficiency-live-qr-fix-r1`, commit cffa621, merged as fb77c78.
  - T1-1: opaque light surfaces. Files: `src/components/admin/CareerExperienceConfigurator.jsx`, `src/components/admin/CareerMasterEntryPoint.jsx`.
  - T1-2: scroll area, edge cue, caption, sticky first column for the table; chart min-width and swipe wrapper. Files: `src/components/admin/ProficiencyRulesPanel.jsx`, `src/lib/careerCharts.js`, `src/components/ChartViews.jsx`.
  - Self-check: build only, no browser. Browser-verified only in round 5 (T1-1 PASS, T1-2 PASS).
  - F2 and F3 were not triaged in round 1 and carried into round 2.
- Integration: fb77c78 (merge), logs ed0024d.

### Round 2

- Validation: [docs/test-results/proficiency-live-qr/round-2.md](../test-results/proficiency-live-qr/round-2.md). Commit tested 8430eae. **28 / 31 steps passed.** passed = false.
- Failures:
  - J7.1 zero-change LIVE DATA banner. Expected a dark banner "LIVE DATA — matches the approved printed version"; saw light beige (rgb 243,238,230) with a green stripe, dark only when changes exist (round-1 F2 persists). Evidence `/var/tmp/sbpg/release-loop/proficiency-live-qr/round-2/J7-1-qr-page-full.png`.
  - J7.5 spec example. Expected "Changed: Ledgerly ERP — printed Advanced → now Advanced · Integration design"; behaviour correct with other changes, but the example cannot occur because J2 sets the category before approval (round-1 F3). Evidence `.../round-2/J7-5-qr-changed-full.png`.
  - Phone 390px workspace tabs. Tab "4 · Preview rollups" extends to x=425, clipped, no scroll cue (F7). Evidence `.../round-2/PH-tabs.png`.
  - J7.2 wording vs banner (F6, recorded as a note on a passing step). After a job-title change the document shows the new title under an amber "wording has changed" notice while the banner says the text always stays as approved. Evidence `.../round-2/J7-2-qr-changed-full.png`.
- Triage: [docs/triage/proficiency-live-qr-round-2.md](../triage/proficiency-live-qr-round-2.md)

| ID | Step | Class | Root cause | Files |
|---|---|---|---|---|
| T2-1 | J7.1 banner | defect | `SharedLiveStates.jsx` 106-108 switches background on `liveChanges.length`; spec and file header require dark in both states | `src/components/SharedLiveStates.jsx` |
| T2-2 | J7.5 example | spec_error | Spec example impossible after J2; diff behaviour correct | `docs/training/proficiency-rules-and-live-qr.md` |
| T2-3 | 390px tabs | defect | `CareerExperienceConfigurator.jsx:172` tab row flex with no wrap/overflow; five buttons exceed 390px, overflow-hidden ancestor clips; spec listed four workspaces, code has five | `src/components/admin/CareerExperienceConfigurator.jsx`, training spec |
| T2-4 | J7.2 wording | defect | `SharedLiveStates.jsx` 118-119 hard-codes "always stays exactly as approved"; career-bound outputs re-resolve wording; component received no `documentState` | `src/components/SharedLiveStates.jsx`, `src/components/SharedOutputPage.jsx`, training spec |

- Fix: branch `release-loop/proficiency-live-qr-fix-r2`, commit 47b1b42c5466fdce1af06eeda3f58653e9478e33.
  - T2-1: banner always dark #1B2A3B, white text; stripe green (zero changes) or gold (changes). Files: `src/components/SharedLiveStates.jsx`.
  - T2-2: J7.5 example changed to the data the journeys leave behind. Files: training spec.
  - T2-3: tab row `flexWrap: 'wrap'`; spec line 7 lists five workspaces. Files: `src/components/admin/CareerExperienceConfigurator.jsx`, training spec.
  - T2-4: `documentState` passed into `SharedLiveStates`, sentence chosen by state (changed / career-bound unchanged / frozen). Files: `src/components/SharedLiveStates.jsx`, `src/components/SharedOutputPage.jsx`, training spec.
  - Not fixed: none.
  - Self-check: code reading and `npm run build` only; no browser.
- Failed or refused commands reported by the fix agent:
  - The first server boot (a compound command sourcing env.sh) was refused by the sandbox. No database or server was created; nothing left running. The agent did not retry, so no browser self-check happened.
  - The round-2 fix notes in the change spec claimed browser checks for T2-1 and a 390px check for T2-3 that were never run (inaccurate claim, later corrected in round 3).
- Fix reconciliation: [docs/triage/proficiency-live-qr-fix-r2-reconciliation.md](../triage/proficiency-live-qr-fix-r2-reconciliation.md)
  - Unresolved (process): browser checks for J7.1, J7.2, 390px tabs not done; carried to round 3.
  - Unresolved (process): change spec lines 82 and 84 claim browser checks that did not happen.
  - Unresolved (requirement_gap): Rules & why not mounted in the Output Template editor (listed as known limitation).
  - Unresolved (requirement_gap): Salt particles first rendition awaiting owner design feedback.
  - Resolved (informational): skills have no proficiency category, as requested.
- Integration: merge 53774b8 (no-ff, no conflicts, 5 files), logs fe28090. `npm run build` passed. Nothing pushed.

### Round 3

- Validation: [docs/test-results/proficiency-live-qr/round-3.md](../test-results/proficiency-live-qr/round-3.md). Commit tested fe28090. **28 / 29 steps passed.** passed = false.
- Failures:
  - Phone 390px workspace tabs (T2-3, spec line 7). Spec said the row wraps onto two lines; all five tabs are visible, clickable and reachable, but wrap one per row (card about 285px wide). Spec wording error; product acceptable. Evidence `/var/tmp/sbpg/release-loop/proficiency-live-qr/round-3/PH-tabs.png`.
- Round-2 fixes browser-confirmed: T2-1 PASS, T2-3 PASS at 390px, T2-4 PASS for two of three wording states (third carried).
- Triage: [docs/triage/proficiency-live-qr-round-3.md](../triage/proficiency-live-qr-round-3.md)

| ID | Step | Class | Root cause | Files |
|---|---|---|---|---|
| T2-3 (recurrence) | 390px tabs | spec_error | Spec line 7 says "two lines"; with `flexWrap` the five buttons wrap one per row | training spec |
| proficiency-live-qr-F2-1 | J7.1, J7.2, 390px tabs | defect (source: fix reconciliation, process) | Sandbox refused compound boot command; fix agent did not retry | `SharedLiveStates.jsx`, `SharedOutputPage.jsx`, `CareerExperienceConfigurator.jsx` |
| proficiency-live-qr-F2-2 | Change spec fix notes round 2 | defect (source: process) | Notes written before the checks and not corrected | change spec |
| proficiency-live-qr-F2-3 | Output Template editor | defect (source: requirement_gap) | Deferred pending chart-gallery merge | `src/components/admin/ProficiencyRulesPanel.jsx` |
| proficiency-live-qr-F2-4 | Salt particles | defect (source: requirement_gap) | Awaiting owner design feedback | `src/components/SaltParticleChart.jsx` |

  Note: F2-3 and F2-4 came from requirement gaps and F2-4 is really an owner question, but triage classed both as `defect`. F2-4 was handled as `needs_business_definition` by the fix agents from round 3 on.
- Fix: branch `release-loop/proficiency-live-qr-fix-r3`, commit c464731 (docs only).
  - T2-3: spec line 7 reworded (about one tab per row at 390px, all five reachable). Files: training spec.
  - F2-2: round-3 notes state round-2 notes were from build and code reading, browser checks pending. Files: change spec.
  - F2-3: found `ProficiencyRulesPanel` already mounted as the Rules & why tab of `OutputTemplateConfigurator` (commit 6dd06e5); added training Journey 8. Files: training spec, change spec. Checked by grep only.
  - Not fixed: F2-1 (process item for the validator; no code changed); F2-4 (owner question, see escalations).
  - Self-check: spec read-through and `npm run build`; no server, no browser.
- Failed or refused commands reported by the fix agent:
  - No server booted and no browser walk this round.
  - First tool call used a lowercase tool name and errored; retried with the correct name; nothing partially applied.
- Fix reconciliation: [docs/triage/proficiency-live-qr-fix-r3-reconciliation.md](../triage/proficiency-live-qr-fix-r3-reconciliation.md)
  - Unresolved (process): J8 and third J7.2 state never browser-run.
  - Resolved (informational): lowercase tool-name retry left a clean state.
  - Resolved (process): F2-1 confirmed by round-3 verdicts.
  - Unresolved (requirement_gap): F2-4 Salt particles, owner question.
  - Unresolved (process): J8 needs a browser run.
  - Unresolved (process): change spec lines 82/84 still claim browser checks; round-1 fixes T1-1/T1-2 never browser-checked.
- Integration: merge 01c0849 (no-ff, no conflicts, 2 docs files), logs 6cc72e2. `npm run build` passed. Nothing pushed.

### Round 4

- Validation: [docs/test-results/proficiency-live-qr/round-4.md](../test-results/proficiency-live-qr/round-4.md). Commit tested 6cc72e2. **32 / 33 steps passed.** passed = false.
- Failures:
  - J8 step 4, Output Templates editor at 390px, Rules & why tab. Tab row wraps and Rules & why is clickable, but the editor is about 799px wide in a 342px scroller; labels clipped ("Header / Foo", "Rules & wh"); after the tap the panel spans about 980px, cut off on both sides with no hint. The same panel in Career Master at 390px is readable. Evidence `/var/tmp/sbpg/release-loop/proficiency-live-qr/round-4/PH-J8-1-tabs.png`, `PH-J8-2-rules.png`, `PH-J8-4-after-click.png`, `PH-J8-4-scrollleft0.png`.
- Triage: `docs/triage/proficiency-live-qr-round-4.md` **is missing.** The workflow data names this path, but no such file exists in the checkout, any worktree, or git history (checked 2026-10-08). The items below come from the workflow data passed to the recorder, not from a committed triage file.

| ID | Step | Class | Root cause | Files |
|---|---|---|---|---|
| R4-1 | J8.4 at 390px | defect | `OutputTemplateConfigurator.jsx:65` `S.shell` fixed 3-column grid (220px 1fr 380px), no media query; layout from 2026-07-10, surfaced by the new tab and the 390px rule. Not a recurrence of T2-3 | `src/components/admin/OutputTemplateConfigurator.jsx` |
| proficiency-live-qr-F3-1 | J8; third J7.2 state | defect (source: process) | r3 changed docs only | `OutputTemplateConfigurator.jsx`, `SharedLiveStates.jsx`, training spec |
| proficiency-live-qr-F3-4 | J7.4 | defect (source: requirement_gap) | Design decisions need the owner | `src/components/SaltParticleChart.jsx` |
| proficiency-live-qr-F3-5 | J8 | defect (source: process) | Journey added after round 3 | `OutputTemplateConfigurator.jsx` |
| proficiency-live-qr-F3-6 | T1-1, T1-2 | defect (source: process) | Notes not updated; round-1 fixes never browser-checked | change spec |

- Fix: branch `release-loop/proficiency-live-qr-fix-r4`, commit 9b01768edc379a7f888f0e4639cab69c2203ef6e.
  - R4-1: `matchMedia(max-width 900px)` hook declared before the early return; single `minmax(0,1fr)` column at narrow width, smaller wrap padding, two 1fr 1fr grids stack. Files: `src/components/admin/OutputTemplateConfigurator.jsx`, training spec, change spec. Self-check: `npm run build` and Playwright at 390px as `member@test.local` (scrollWidth 390, no overflow), reached by `dispatchEvent('click')`.
  - F3-5: fix notes appended; only the 390px layout part of J8 browser-driven; override/preview-refresh steps not driven. Files: change spec.
  - F3-6: notes now say T1-1 and T1-2 were never browser-verified. Files: change spec. Docs only.
  - Not fixed: F3-4 (owner question); F3-1 third J7.2 state (fix agent found no UI path; would escalate if the validator cannot either).
- Failed or refused commands reported by the fix agent:
  - Two combined shell commands refused by the worktree-isolation guard (sourcing env.sh plus a background start; a git commit chained with cleanup). Nothing ran from either; both re-run as separate commands.
  - Playwright could not click Output Templates at 390px in Classic Tools (button hidden); worked around with `dispatchEvent('click')`, so a real user's route at that width was not checked by the fix agent.
  - Cleanup done: server killed by PID file, database `sb_rl_fix_4500_11` dropped.
- Fix reconciliation: [docs/triage/proficiency-live-qr-fix-r4-reconciliation.md](../triage/proficiency-live-qr-fix-r4-reconciliation.md)
  - Resolved (environment): isolation guard refusals; reconciler hit the same and used launcher scripts.
  - Resolved (product_defect, outside this feature): Classic Tools tab navigation hidden at 390px and "Back to World" overlaps the title (`src/components/AdminShell.jsx`, `src/components/WorldShell.jsx`); the J8 World route works by real clicks. Optional separate task.
  - Resolved (informational): cleanup.
  - Unresolved (requirement_gap): F3-4 Salt particles, owner question.
  - Unresolved (process): F3-1 third J7.2 state; reconciler found the opportunity Import path (`WorldShell.jsx` about 942-957, `careerPlacementAgents.js:228`) and proposed a training step; not driven.
  - Resolved (product_defect): R4-1 verified at 390px by the reconciler.
  - Unresolved (process): T1-1/T1-2 need explicit verdicts.
  - Unresolved (process): spec nits (J8.3 "after adding the Proficiency chart"; change spec calls Rules & why "tab 4" but it is the fifth; unknown-input formula edge payload).
  - Resolved (informational): Rules & why mounted as tab 5; skills have no category by request.
- Integration: merge eda4f90 (no-ff, no conflicts, 3 files), logs 6ac1df0. `npm run build` passed (chunk-size warning only). Nothing pushed.

### Round 5 (final; no triage or fix rounds remain)

- Validation: [docs/test-results/proficiency-live-qr/round-5.md](../test-results/proficiency-live-qr/round-5.md). Commit tested 6ac1df0. **29 / 30 steps passed.** passed = false.
- Confirmed in the browser this round: R4-1 layout PASS; T1-1 PASS; T1-2 PASS; T2-1, T2-2, T2-4 re-confirmed (dark banner both states, green/gold stripe, wording by state); J8 steps 1 to 3 PASS; bad and revoked slug PASS; methodology edit/delete 403 PASS.
- Failure:
  - J8 step 4 (Output Templates, Rules & why at 390px), read literally. The layout fix works (scrollWidth 390, editor stacked, tabs wrap, Rules & why opens by a real click), but the Levels and why table is 940px wide in a 239px scroller, so five columns need sideways swiping (a caption says so). Ambiguity escalated as owner question 3 above. Evidence `/var/tmp/sbpg/release-loop/proficiency-live-qr/round-5/PH-J8-2-levels.png`, `PH-J8-2-rules-full.png`.
- Not reachable: third J7.2 wording state (owner question 2). Not validated: Salt particles design (owner question 1).
- Observations (not counted): Career Master Definitions "Definition" input overflows its card at 390px; QR data-timeline slider labels cramped at 6 updates; J8.3 needs "after adding the Proficiency chart"; bad-formula no-thresholds refusal not isolated and its UI toast not driven; empty member's QR page not driven.
- Harness misses reported: J3.1 and J5.4 first runs read the wrong node or checked too early; re-run and passed. A J7.5 setup toast check read false while the PATCH returned 200.
- No triage file exists for round 5: the feature had used all 4 fix rounds, so the loop stopped here.

### Recurring item for a person to take over: 390px readability of Rules & why

The fix-attempt limit was hit at feature level on this thread. History:

1. Round 1 F4: Levels table clipped in Career Master at 390px. Triage T1-2 (defect, `ProficiencyRulesPanel.jsx:358-361`). Fix r1 (cffa621): scroll area, edge cue, caption, sticky first column; stacked cards deliberately not built. Re-test: browser-verified only in round 5 (PASS in Career Master).
2. Round 2 F7: workspace tab row clipped at 390px. Triage T2-3 (defect, `CareerExperienceConfigurator.jsx:172`). Fix r2 (47b1b42): `flexWrap`. Re-test round 3: product PASS, spec wording failed; triage T2-3 recurrence (spec_error); fix r3 (c464731) reworded spec. Re-test rounds 4 and 5: PASS.
3. Round 4: same panel inside the Output Templates editor unreadable at 390px. Triage R4-1 (defect, `OutputTemplateConfigurator.jsx:65` fixed 3-column grid). Fix r4 (9b01768): `matchMedia` single-column layout. Re-test round 5: layout PASS.
4. Round 5: the remaining failure is the Levels table's in-table sideways scroll inside the now-narrower Output Templates column (239px scroller). Not triaged.

What a person needs to decide: accept the captioned scroll and reword J8.4 (spec_error route, no code), or build the stacked-card layout at phone width that round-1 triage preferred (`src/components/admin/ProficiencyRulesPanel.jsx`), which would also serve Career Master.

### Other open follow-ups (not blocking a verdict, recorded so they are not lost)

- Classic Tools has no tab navigation at 390px and "Back to World" overlaps the title (`src/components/AdminShell.jsx`, `src/components/WorldShell.jsx`); outside this feature's journeys.
- Career Master Definitions "Definition" input overflows at 390px (round-5 observation).
- Training spec: name the opportunity Import path for the third J7.2 state; add "after adding the Proficiency chart" to J8.3. Change spec: Rules & why is the fifth tab, not "tab 4".
- Bad-formula edge case: isolate the no-thresholds refusal and drive the UI error toast.

## Integration commits (this release, proficiency-live-qr)

| Round | Fix branch | Fix commit | Merge commit | Logs commit | Build | Conflicts |
|---|---|---|---|---|---|---|
| 1 | release-loop/proficiency-live-qr-fix-r1 | cffa621 | fb77c78 | ed0024d | passed | none recorded |
| 2 | release-loop/proficiency-live-qr-fix-r2 | 47b1b42 | 53774b8 | fe28090 | passed | none |
| 3 | release-loop/proficiency-live-qr-fix-r3 | c464731 | 01c0849 | 6cc72e2 | passed | none |
| 4 | release-loop/proficiency-live-qr-fix-r4 | 9b01768 | eda4f90 | 6ac1df0 | passed | none |

Every integration took and released the shared lock, started no servers or databases, and pushed nothing.

## Every reported failed or refused command

| Round / agent | Command | State it left |
|---|---|---|
| Round 1 validator | Database `sb_rl_val_1` and server destroyed by something outside the session | Recreated at 4d8cff3; journeys 1 to 7 not re-run on the fixed build; two edge cases BLOCKED |
| Round 1 validator | Member created via signup API, consent and `must_change_password` set directly (workaround) | Deviation from the test-account rule; flagged |
| Fix r2 | Compound server boot (sourcing env.sh) refused by sandbox; not retried | No DB/server created; no browser self-check |
| Fix r2 | Change spec notes claimed browser checks that were not run | Corrected by fix r3/r4 notes |
| Fix r3 | First tool call used a lowercase tool name and errored | Retried; nothing partially applied |
| Fix r3 | No server or browser run | Self-check limited to build and reading |
| Fix r4 | Two combined shell commands refused by the worktree-isolation guard | Nothing ran; re-run separately |
| Fix r4 | Playwright real click on hidden Output Templates button failed at 390px | `dispatchEvent` workaround; real route unchecked by fixer (reconciler later confirmed the World route works) |
| Fix r4 reconciler | Same isolation guard (source plus background start; heredoc plus cd) | Worked around with launcher scripts |
| Release recorder | Linked round-4 triage file `docs/triage/proficiency-live-qr-round-4.md` not found anywhere | Round-4 triage recorded from workflow data only; file never committed |
| Round 5 validator | External font requests blocked by the sandbox proxy | Environmental, not a product defect |

## Log index

- Test results: [round-1](../test-results/proficiency-live-qr/round-1.md), [round-2](../test-results/proficiency-live-qr/round-2.md), [round-3](../test-results/proficiency-live-qr/round-3.md), [round-4](../test-results/proficiency-live-qr/round-4.md), [round-5](../test-results/proficiency-live-qr/round-5.md)
- Triage: [round-1](../triage/proficiency-live-qr-round-1.md), [round-2](../triage/proficiency-live-qr-round-2.md), [round-3](../triage/proficiency-live-qr-round-3.md), round-4 (file missing, see Round 4)
- Fix reconciliations: [r2](../triage/proficiency-live-qr-fix-r2-reconciliation.md), [r3](../triage/proficiency-live-qr-fix-r3-reconciliation.md), [r4](../triage/proficiency-live-qr-fix-r4-reconciliation.md)
- Screenshots (local only, not committed): `/var/tmp/sbpg/release-loop/proficiency-live-qr/round-<n>/`
- Sweep: none run for this release.
