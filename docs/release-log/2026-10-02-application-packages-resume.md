# Release log: 2026-10-02-application-packages-resume

- Release: 2026-10-02-application-packages-resume
- Integration branch: `claude/zealous-meitner-5tuft5` (not pushed by this release)
- Integration head when recorded: 6082e1b (last feature merge 8f1c8c4)
- Process: `server/data/releaseLoop/definition.json` (spec governance, interface parity, per-bug fix-attempt limit)
- Recorded: 2026-10-09 by the release recorder. This recording replaces the earlier one in 17a67e9, which covered only `proficiency-live-qr`; that feature's section is kept below.
- Data: fictional only. No employer or application-target name appears in this log.

## Final results

| Feature | Final status | Last round | Commit tested | Steps passed / total (baseline) | Open blocking items | Backlog (not blocking) |
|---|---|---|---|---|---|---|
| release-loop-tooling | **PASSED** | 5 | 8f1c8c4 | 30 / 30 on **v3** | none in the workflow data (see "State discrepancy" below) | T4-2 (MCP_GAP, pre_existing), F1-7, B5 (pre_existing), B4 (process_note) |
| proficiency-live-qr | **NOT PASSED** | 5 (earlier release) | 6ac1df0 | 29 / 30 (pre-baseline) | 6 items, 3 owner questions | 5 |

Only `release-loop-tooling` was handed to the recorder in this run, and it passed. Its last two scores are on different baselines: round 4 was 29/30 on v2, round 5 was 30/30 on v3. The only difference between v2 and v3 is step J3b.3, changed by approved amendment A2. The scores are comparable only through that amendment.

**Features that did NOT pass.** The bug-state export (`active-release.state.json`, exported 2026-10-09T16:12Z) lists these features. None of them has a passing result, so none of them is releasable:

| Feature | State status | Last round | Last score | Open bugs | Backlog |
|---|---|---|---|---|---|
| proficiency-live-qr | validate | 5 | 29/30 | 6 | 5 |
| world-shell-navigation | validate | 1 | 45/48 | 2 | 4 |
| career-bound-outputs | validate | 2 | 54/56 | 10 | 5 |
| qr-gated-outputs | validate | 1 | 45/48 | 6 | 2 |
| chart-gallery | validate | 1 | 17/20 | 8 | 2 |
| no-silent-failures | validate | 0 | not run | 3 | 3 |
| release-intelligence | validate | 0 | not run | 3 | 1 |
| output-version-history | validate | 0 | not run | 4 | 3 |
| resume-rollups | validate | 0 | not run | 7 | 3 |
| cover-letter-agent | validate | 0 | not run | 5 | 7 |
| session-mapping | **failed** | 0 | not run | 0 | 0 |
| in-app-release-loop | build | 0 | not run | 0 | 0 |
| world-shell-layers | build | 0 | not run | 0 | 0 |
| live-release-tracker | build | 0 | not run | 0 | 0 |
| render-bindings | build | 0 | not run | 0 | 0 |
| platform-mcp | build | 0 | not run | 0 | 0 |

**The release as a whole did not pass.** One feature passed. Under the push gate, the integration branch must not be pushed unless the owner says otherwise. No sweep was run (`sweep: null`).

---

## Feature: release-loop-tooling

Title: Release loop tooling: definition, saved workflow, skill, bug-attempt limit, failure reconciliation, live step logs, tracker sync, test accounts.

Status: **PASSED** in round 5. It scored 30/30 on baseline v3 at commit 8f1c8c4, with no steps blocked or not run. The spec sha256 was `03924b9abae72dd99085b511db948016cfb8c7f49bd2f7a86a95432a31b177bc`.

- Training spec: [docs/training/release-loop-tooling.md](../training/release-loop-tooling.md); baselines: [v1](../training/baselines/release-loop-tooling/v1.json), [v2](../training/baselines/release-loop-tooling/v2.json), [v3](../training/baselines/release-loop-tooling/v3.json)
- Change spec: [docs/changes/release-loop-tooling.md](../changes/release-loop-tooling.md)

### Rounds

| Round | Commit tested | Baseline | Result | Test result | Triage |
|---|---|---|---|---|---|
| 1 | d23759e | none (before spec governance) | PASS (validator verdict) | [round-1](../test-results/release-loop-tooling/round-1.md) | [round-1 scope](../triage/release-loop-tooling-round-1-scope.md), [fix-r1 reconciliation](../triage/release-loop-tooling-fix-r1-reconciliation.md) |
| 2 | d8ee228 | none | PASS, 108 / 108 checks | [round-2](../test-results/release-loop-tooling/round-2.md) | [round-2 scope](../triage/release-loop-tooling-round-2-scope.md) |
| 3 | 536aa29 | v1 (frozen afterwards) | FAIL, 104 / 126 checks | [round-3](../test-results/release-loop-tooling/round-3.md) | [round-3](../triage/release-loop-tooling-round-3.md), [round-3 scope](../triage/release-loop-tooling-round-3-scope.md) |
| 4 | 08468b1 | **v2** (A1) | FAIL, 29 / 30 steps | [round-4](../test-results/release-loop-tooling/round-4.md) | `docs/triage/release-loop-tooling-round-4.md` and `-round-4-scope.md` are **missing** (see failed commands) |
| 5 | 8f1c8c4 | **v3** (A2) | **PASS, 30 / 30 steps** | [round-5](../test-results/release-loop-tooling/round-5.md) | none needed |

Round 1 to 3 counts are checked expectations across 5 viewport and theme runs. Round 4 and 5 counts are baseline steps scored by `release-spec-baseline.mjs score`. These are different units. Round 3's 104/126 cannot be compared with round 4's 29/30 or round 5's 30/30.

Rounds 1 to 3 are summarized here from their committed files. The workflow data for this recording carried rounds 4 and 5 in full.

#### Round 3 (v1): failures and triage (summary)

The failures were 22 failed checks, from 5 distinct defects, each repeated across the 5 runs. The triage file is [release-loop-tooling-round-3.md](../triage/release-loop-tooling-round-3.md).

- **T3-1**, nine tiles instead of eight: spec_error, verified. Root cause: a `Status updates` tile was added by 44609c2, and spec line 54 still said eight.
- **T3-2**, stalled label raw, and `Agent stopped` vs `Failed`: defect plus spec_error. Root cause: fix-r1 (082eed1) work was lost when 9084b2c rewrote `tools/release-tracker/index.html`. This recurs F1-2/B2.
- **T3-3**, page background colours: spec_error, verified. Root cause: 9084b2c intentionally moved the page to the cream palette.
- **T3-4**, Features table not stacked at 390px: defect. Root cause: the `data-label` and 640px card CSS were lost in 9084b2c. This recurs F1-2/B3.
- **Fixes:** fix-r3 (fe190e2) edited the spec directly. It could not merge under spec governance (definition v4) and is **not merged**. fix-r3b (dac3ce6) re-applied the code changes without spec edits and was merged in 06bd1c8. It changed `tools/release-tracker/index.html` (stalled label and pill, 390px stacked cards, `data-label`) and the setup-guide sync check. The spec edits went through amendment A1.
- **fix-r2** (fc60764, "Salvaged partial work from an agent stopped by the usage limit (untested)") was **never merged**. This is a failed agent run; see failed commands.

#### Round 4 (baseline v2): 29 / 30

- Commit tested: 08468b1. Report: [round-4](../test-results/release-loop-tooling/round-4.md). Not run: none.
- Baseline diff v1 to v2: 27 steps the same; 5 changed (J1.1, J4.1, J4.5, J5.2, J5.3); 1 added (J5.5); 0 retired.

Failures:

| Step | Surface | Expected | Observed | Evidence |
|---|---|---|---|---|
| [J3b.3] Sign in as member@test.local, land on /world | mobile 390x844 | URL /world; page shows Your World, Journeys and Classic Tools; no password or terms page | URL is /world and Journeys and Classic Tools show, but "Your World" is not shown at 390px (subtitle hidden on phones). A Career Placement Agents side panel covers the page. Desktop passes. | `/var/tmp/sbpg/release-loop/release-loop-tooling/round-4/J3b3-mobile.png` |
| MCP_GAP (not a baseline step) | cli | MCP tools for the capabilities the spec exercises | `server/lib/mcpToolRegistry.js` does not exist | `ls server/lib/mcpToolRegistry.js`: No such file |

Observations:

- F1-2/B3 (390px stacked cards) now passes at J5.3: cells carry `data-label`, and no panel overflows on the overview, feature, round or tokens layers.
- T3-1 and T3-3 pass under the amended steps.
- Shell-only steps listed for both desktop and mobile (J1.2, J1.3, J2.1, J3.2-3.4, J3.6, J3b.2, E.1, E.3, E.4) were run once by shell and recorded the same for both surfaces.
- External Chart.js, three.js and Google Fonts were blocked by the sandbox. These are `external_blocked` and not counted.
- No baseline step covers F1-5 (agent card count). That is still an owner decision.

Triage items. The workflow data has these, but the triage and scope files were not found on disk.

| Id | Step | Class | Scope | Root cause | Files | Proposed fix |
|---|---|---|---|---|---|---|
| T4-1 | [J3b.3] | spec_error | this_feature | `src/components/WorldShell.jsx` line 121 (MOBILE_CSS, max-width 700px) deliberately hides `.sb-world-brandsub`, the "Your World" subtitle at line 683. The only other "Your World" text (rail title, line 758) renders only for a member with no Career or Commercial island. The test member has the Career island, so the always-on pipeline rail (line 754) spans the phone screen. The step over-specifies a desktop-only label. Login behaviour is correct on both surfaces. | `src/components/WorldShell.jsx`, `docs/training/release-loop-tooling.md` | No code change. Amend J3b.3 (became A2). |
| T4-2 | MCP_GAP | environment | pre_existing | `server/lib/mcpToolRegistry.js` belongs to the separate feature platform-mcp, still in build | `server/data/releaseLoop/definition.json`, `docs/release-log/active-release.features.json` | None in this feature; see backlog |

Fix for round 4: no code fix. T4-1 was resolved by spec amendment A2, which produced baseline v3 and was merged in 8f1c8c4.

#### Round 5 (baseline v3): 30 / 30, PASSED

- Commit tested: 8f1c8c4. Report: [round-5](../test-results/release-loop-tooling/round-5.md). Not run: none. Blocked: none.
- Baseline diff v2 to v3: J3b.3 changed (A2); every other step is the same. This is the only like-for-like difference from round 4.
- J3b.3 passes on desktop. It also passes on the phone at 390x844 with touch: Journeys and Classic Tools are visible and there is no gate page.

The only listed failure is the MCP_GAP. It is not a baseline step and was routed to platform-mcp, so the score is unaffected.

Observations:

- **Transient:** in the first full run, the m-theme config (390 touch, `?theme=dark`) threw on J4.1. The heading was not present after a fixed 1.5 s wait. A re-run passed every step. This was likely slow first paint and was not reproduced. It is recorded here so it is not lost.
- On the phone after login, the Career Placement Agents panel fills the screen and hides the world. Only the header tabs stay usable. This is not a failure under A2, because the step checks the tabs. It is not filed as a bug. It is a candidate for the owner or the world-shell-navigation feature.
- External scripts and fonts were blocked by the sandbox (not counted).

### Spec amendments

| Id | Status | Round | What changed | Proposed by | Reviewer | Branch / commit | Merged in | New baseline |
|---|---|---|---|---|---|---|---|---|
| [A1](../spec-amendments/release-loop-tooling/A1.json) | approved | 3 | J1.1 now expects `7 9 2 ... ,baseline` (definition v4). J4.1 tightened so the Status updates tile value is checked against the last `updates` entry in snap.json. J4.5 gained a scope note. J5.2 changed the page tokens to #F8F4EC / #161A1C. J5.3 makes the stalled-pill style checkable by reference to the Agent stopped pill. The cli sync-setup-guide check was split out into new step **J5.5**. | fix:release-loop-tooling:r3 (fe190e2) and owner direction 2026-10-09 | amend:release-loop-tooling:r3 | release-loop/release-loop-tooling-spec-r3 / 4cf9d9a | 9be77fb | v2 (30 scored steps, 3 preconditions) |
| [A2](../spec-amendments/release-loop-tooling/A2.json) | approved | 4 | J3b.3: Journeys and Classic Tools are required at both sizes. The "Your World" subtitle is required on desktop only, because it is hidden below 700px by design. The "not weaker" check passes because the old 390px expectation contradicted the documented phone layout. The reviewer noted that if the Career Placement Agents panel ever hides Journeys or Classic Tools, the step fails as a product defect. | triage:release-loop-tooling:r4 (T4-1) | amend:release-loop-tooling:r4 | release-loop/release-loop-tooling-spec-r4 / ffb5fce | 8f1c8c4 | v3 |

Both amendment runs reported no failures.

**Validator drift:** none found. Each scored round names its baseline and spec sha256. `release-spec-baseline.mjs check --all` passed at both integrations. The round-5 sha256 is the v3 spec. The proposed J3b.3 clarification from round 4 was filed as A2, not edited in.

### Integration commits

| Commit | What | Conflicts | Build | Notes |
|---|---|---|---|---|
| 991999d | Merge `release-loop-tooling-build` (bed12f0) | n/a | n/a | Earlier in this release |
| 8a687ee | Merge `fix-r1` (082eed1) | n/a | n/a | Earlier in this release |
| 06bd1c8 | Merge `fix-r3b` (dac3ce6) | n/a | n/a | Earlier in this release |
| 9be77fb | Merge `spec-r3` (4cf9d9a, A1, baseline v2); pre-merge HEAD ec5e365 | none | passed | `check --all` exit 0. No logs commit (nothing staged). |
| 8f1c8c4 | Merge `spec-r4` (ffb5fce, A2, baseline v3); pre-merge HEAD 1b6eb38 | none | passed (twice; vite built in 55.45s) | `check --all` exit 0, with all 11 baselines matching. No logs commit. |

The rows marked n/a predate the workflow data given to this recorder. Their merges are in `git log`; build results for them are in the earlier test-result files.

### State discrepancy (reported, not resolved here)

The workflow data marks this feature passed, with no blocking items left. The bug-state export (2026-10-09T16:12Z) still lists these items as not closed. A person should reconcile them before relying on the state file.

- **T4-1** (spec_error): `open`, 0 attempts. It was resolved by A2, and round 5 passed J3b.3. It should move to verified.
- **release-loop-tooling-F1-2** (defect, 390px stacked cards and stalled label): `recurred`, 0 attempts. Round 4 recorded J5.3 passing after fix-r3b, and round 5 passed J5.3. It should move to verified.
- **B3** (390px reflow, requirement_gap): `open`. This has the same subject as F1-2 and is covered by passing J5.3.
- **B1** (requirement_gap, `open`): `definition.json` line 210, `docs/release-process.md` line 52 and the skill claim a World Shell release-loop view and `/api/release-loop/*`, but the change spec says these are out of scope. No baseline step covers it. The capability belongs to `in-app-release-loop` (in build), but the docs claim is this feature's.
- **B2** (requirement_gap, `open`): `scripts/release-tracker-sync.mjs` line 115 skips the idle check for `fromRun` agents. No baseline step covers it.
- **release-loop-tooling-F1-5** (requirement_gap, `open`): an owner design decision on whether the agent card shows a page-errors count. No baseline step covers it.

B1, B2 and F1-5 are this_feature items with no baseline step. They did not block the frozen-spec pass. They remain open work, and B1 is a documentation accuracy problem.

### Escalated for a business definition

There are none in the workflow data. One owner decision is open from earlier rounds (F1-5). The question is: "Should the agent card on the release tracker show a page-errors count again, as the original design did, or is the current `checks · passed · failed` card final?"

Round 4 also raised a non-blocking question under T4-2: "Should creating test accounts be reachable over MCP, given it is restricted to local test databases?"

### Bugs at the per-bug fix-attempt limit (needsHuman)

None. The highest attempt count on any release-loop-tooling item is 1 (RLT-T1, RLT-T2, F1-6, T3-1, T3-3, all verified).

### Backlog: NOT blocking this feature

| Id | Scope | Class / status | Evidence | Owner |
|---|---|---|---|---|
| T4-2 | pre_existing | environment, `backlog_pre_existing` (round 4) | Not part of this feature's request. `server/lib/mcpToolRegistry.js` belongs to the separate feature platform-mcp (active-release.features.json line 146, still in build). definition.json `interfaceParity.rule` assigns missing MCP tools to platform-mcp until the server exists. No merged feature caused it. platform-mcp should add tracker-read and test-account-status tools. | platform-mcp feature (no person assigned) |
| F1-7 | pre_existing | requirement_gap, `backlog_pre_existing` | The release loop inside the platform for in-app agents is out of this feature's request. definition.json and the change spec already say the tracker has no platform screen. When built, it must be reached from the World Shell. | in-app-release-loop feature (no person assigned) |
| B5 | pre_existing | owner_direction_conflict, `backlog_pre_existing` | The feature definition lists a static tracker page and scripts with no World Shell requirement. The World Shell surface belongs to the separate in-app-release-loop feature. | in-app-release-loop feature (no person assigned) |
| B4 | process_note | process | Only the local harness stub of the host check was tested. This is a limit of the validation environment. | not assigned |

No item has scope `other_feature`.

---

## Feature: proficiency-live-qr (from the earlier recording, 17a67e9)

Status: **NOT PASSED**. It was not in this run's workflow data. No agent ran for it in this run. Its last result is round 5 of release `2026-10-02-proficiency-live-qr`: 29 / 30 at 6ac1df0. That round predates baselines, so there is no baseline version. The result is out of date, because `OutputTemplateConfigurator.jsx` changed after 6ac1df0 (fix 95c2adf, merged in 957726a). The full earlier text follows, unchanged except for heading levels. The [earlier release log](2026-10-02-proficiency-live-qr.md) has the per-round detail.

### Escalated for a business definition (owner questions, not answered, not guessed)

The workflow data for this release lists no escalations. The questions below are still open from the earlier release, and the bug state (`docs/release-log/active-release.state.json`, exported 2026-10-09T05:46Z) still shows them open. They are repeated here so they are not lost.

1. **Salt particles chart design (J7.4; items proficiency-live-qr-F2-4, F3-4, F4-4).** Exact question: "After seeing the first Salt particles rendition (QR page, chart view, Journey 7 step 4), what should change: grain size or density, colours, motion, heap shape?" `src/components/SaltParticleChart.jsx` was created in a0ff84a. Nothing will be built until this is answered.
2. **Non-career-bound outputs (third J7.2 wording state; items F3-1, F4-5).** Exact question: "How should a member create an output that is not bound to Career Master? Is the World Shell opportunity panel's Import resume/cover letter path (`POST /api/career-agents/opportunities/:id/import-output`, filing `source='imported'`) the intended way, or should there be another?" Until it is answered, the training spec cannot name a path that produces the frozen-text sentence "The document text above always stays exactly as approved."
3. **Levels table at phone width (J8.4, the round-5 failure).** Exact question: "In the Output Templates editor at 390px, is the captioned in-table sideways scroll of the Levels and why table acceptable, the same behaviour Career Master already has and round 4 accepted, so that J8.4 should be reworded? Or should the Levels table stack as cards at phone width?"

### Bugs at the per-bug fix-attempt limit (needsHuman)

None. The workflow data lists no `needsHuman` items. In the state export, the highest attempt count on any proficiency-live-qr item is 2 (T2-3, verified). No open item has had a fix attempt. Every open item is waiting on an owner answer or a spec edit, as listed below.


Status: **NOT PASSED**. Not started in this release.

- Training spec: [docs/training/proficiency-rules-and-live-qr.md](../training/proficiency-rules-and-live-qr.md)
- Change spec (with fix notes per round): [docs/changes/proficiency-rules-and-live-qr.md](../changes/proficiency-rules-and-live-qr.md)
- Built before either release: a0ff84a, f1ad622, b1ae2d3, 8fc685e, dd58da6 (validate and fix only)

#### Rounds in this release

None. No test-result, triage or fix file was produced for this release.

#### Rounds from the earlier release (2026-10-02-proficiency-live-qr), for reference

| Round | Commit tested | Steps | Test result | Triage | Fix commit / merge | Fix files |
|---|---|---|---|---|---|---|
| 1 | ac66592, 4d8cff3 | not totalled (two edge cases BLOCKED) | [round-1](../test-results/proficiency-live-qr/round-1.md) | [round-1](../triage/proficiency-live-qr-round-1.md) | cffa621 / fb77c78 | `CareerExperienceConfigurator.jsx`, `CareerMasterEntryPoint.jsx`, `ProficiencyRulesPanel.jsx`, `careerCharts.js`, `ChartViews.jsx` |
| 2 | 8430eae | 28 / 31 | [round-2](../test-results/proficiency-live-qr/round-2.md) | [round-2](../triage/proficiency-live-qr-round-2.md), [fix-r2 reconciliation](../triage/proficiency-live-qr-fix-r2-reconciliation.md) | 47b1b42 / 53774b8 | `SharedLiveStates.jsx`, `SharedOutputPage.jsx`, `CareerExperienceConfigurator.jsx`, training spec |
| 3 | fe28090 | see file | [round-3](../test-results/proficiency-live-qr/round-3.md) | [round-3](../triage/proficiency-live-qr-round-3.md), [fix-r3 reconciliation](../triage/proficiency-live-qr-fix-r3-reconciliation.md) | c464731 / 01c0849 | training spec, change spec (docs only) |
| 4 | 6cc72e2 | see file | [round-4](../test-results/proficiency-live-qr/round-4.md) | round-4 triage file was never committed; see the [fix-r4 reconciliation](../triage/proficiency-live-qr-fix-r4-reconciliation.md) | 9b01768 / eda4f90 | `OutputTemplateConfigurator.jsx`, change spec |
| 5 | 6ac1df0 | 29 / 30 | [round-5](../test-results/proficiency-live-qr/round-5.md) | none (fix rounds exhausted) | none | none |

The one failure in round 5 was **J8 step 4**. At 390px in the Output Templates editor, Rules & why tab, the Levels and why table is 940px wide inside a 239px scroller. Five columns can only be read by swiping sideways inside the table. The page itself does not scroll sideways, and round 5 confirmed the layout fix R4-1. The validator raised owner question 3 above. The full per-round failures, triage and fix narrative is in the [earlier release log](2026-10-02-proficiency-live-qr.md).

#### Triage items: verified fixed (earlier release)

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

#### Open items blocking this feature (scope: this_feature)

| Id | Step | Class | Root cause | Files | Owner | History |
|---|---|---|---|---|---|---|
| proficiency-live-qr-F2-4 | QR page chart view, Salt particles | requirement_gap | Waiting on owner design feedback | `src/components/SaltParticleChart.jsx` | not assigned | Found r2; not fixed r3 (owner question 1) |
| proficiency-live-qr-F3-4 | J7.4 | requirement_gap | Design decisions need the owner | `src/components/SaltParticleChart.jsx` | not assigned | Found r3; not fixed r4 (`needs_business_definition`) |
| proficiency-live-qr-F4-4 | J7.4 Salt particles (same as F3-4) | requirement_gap | Design choices cannot be invented | `src/components/SaltParticleChart.jsx` | not assigned | Found r4 |
| proficiency-live-qr-F3-1 | J8; J7.2 third state | process | Round 3 changed docs only. The J7.1/J7.2 path does not reach the third wording state | `OutputTemplateConfigurator.jsx`, `SharedLiveStates.jsx`, training spec | not assigned | Found r3 (owner question 2) |
| proficiency-live-qr-F4-5 | J7.1/J7.2 third wording state (same as F3-1) | process | The training spec does not name the import path | training spec, `SharedLiveStates.jsx`, `WorldShell.jsx` | not assigned | Found r4 |
| proficiency-live-qr-F4-8 | Known-limitations gaps: spec nits, weak edge coverage | process | Spec wording and the edge-case payload were not tightened | training spec, change spec, `OutputTemplateConfigurator.jsx` | not assigned | Found r4 |
| (round-5 failure) | J8.4 Levels table at 390px | not triaged (fix rounds exhausted) | Table inside a nested-card scroller | `src/components/admin/ProficiencyRulesPanel.jsx`, `OutputTemplateConfigurator.jsx` | not assigned | Round 5 (owner question 3) |

#### Backlog: NOT blocking this feature

These items are in the state export with a non-blocking scope. Each one lists its evidence and owner.

| Id | Scope | Class / status | Evidence | Owner |
|---|---|---|---|---|
| R4-1 | pre_existing | defect, `backlog_pre_existing` | The fixed `220px 1fr 380px` grid in `OutputTemplateConfigurator.jsx` came from a875b9b (2026-07-10), before this feature. The clipping reproduces without the feature. A responsive fix was already committed (9b01768), and round 5 passed the layout part of J8.4. | not assigned |
| proficiency-live-qr-F2-1 | process_note | process | The agent sandbox refused a compound boot command and the round-2 fix agent did not retry. This was a tooling refusal with no product or spec cause. | not assigned |
| proficiency-live-qr-F3-5 | process_note | process (fixed in 9b01768) | Journey J8 was added after round 3, so earlier rounds never ran it. The layout defect itself is tracked as R4-1. | not assigned |
| proficiency-live-qr-F3-6 | process_note | process (fixed in 9b01768) | Fix notes in the change spec did not cite browser evidence. This is loop record-keeping, not product. T1-1 and T1-2 were browser-verified in round 5. | not assigned |
| proficiency-live-qr-F4-7 | process_note | process | No validator step explicitly asserts T1-1 (dark embed readability). This is a coverage note about the loop, not a defect. | not assigned |

No item has scope `other_feature`.

### Integration commits

None in this release. No branch was built, fixed or merged for `proficiency-live-qr`. For reference, the earlier release's integration commits were fb77c78, 53774b8, 01c0849 and eda4f90 (logs commits ed0024d, fe28090, 6cc72e2 and 6ac1df0). Commits that later touched this feature's files came from other features (957726a, merging 95c2adf from career-bound-outputs).

### Every reported failed or refused command

| Source | Command | State it left |
|---|---|---|
| Workflow data for this release | None reported (no agents ran for the feature) | n/a |
| Release recorder (this log) | A recursive `grep -r` over `docs server .claude` for the release name exceeded the 120s timeout and was moved to the background | Read-only. Replaced with `git grep`, which found no prior mention of this release name. The background search was left to end with the recorder session and wrote nothing to the repo. |
| Earlier release | 11 failed or refused commands (a database destroyed outside the session, sandbox refusals, a missing round-4 triage file, and others) | See "Every reported failed or refused command" in the [earlier release log](2026-10-02-proficiency-live-qr.md) |

The recorder started no server or database and has nothing to clean up.

### What has to happen for this feature to pass

1. The owner answers questions 1 to 3 above.
2. The training spec is updated: name the import path for the third J7.2 state, reword or redefine J8.4, and tighten the F4-8 nits.
3. A validator follows the full training spec in a browser against a fresh database on the current head (13d5b65 or later), because the editor changed after round 5.


---

## Every reported failed or refused command (this recording)

| Source | Command / run | State it left |
|---|---|---|
| release-loop-tooling fix round 2 | The fix agent was stopped by a usage limit. Its partial work was salvaged to `release-loop/release-loop-tooling-fix-r2` (fc60764, "untested"). | **Not merged.** The branch still exists. Merging it wholesale would revert the newer tracker page (round-3 triage). Superseded by fix-r3b. |
| release-loop-tooling fix round 3 | fe190e2 edited the training spec directly, which was refused under spec governance (definition v4). | **Not merged.** The branch `release-loop/release-loop-tooling-fix-r3` still exists. The code was re-applied as fix-r3b (dac3ce6, merged 06bd1c8). The spec edits were filed as A1. |
| release-loop-tooling round 4 triage | The triage agent's reports `docs/triage/release-loop-tooling-round-4.md` and `docs/triage/release-loop-tooling-round-4-scope.md` are named in the workflow data, but neither exists on disk or in any git ref (`git log --all` finds nothing). | Partial. The triage content (T4-1, T4-2) survives only in the workflow data, which this log reproduces in full, and in `active-release.state.json`. A person should decide whether to regenerate the files. |
| release-loop-tooling round 5 validator | First full run: config m-theme (390 touch, `?theme=dark`) J4.1 threw (heading not present after a fixed 1.5 s wait). | Re-run passed. Not reproduced. The validator stopped its server and preview and dropped its database. |
| Integration 9be77fb | No failure. The working tree had two edits the integrator did not make: `scripts/release-tracker-sync.mjs` (+18 lines, present before it started) and `docs/release-log/history.json`. | Left uncommitted and unreverted at that time. The recorder found a clean tree at 6082e1b, so they were later committed or discarded by another run sharing the checkout. Not verified which. |
| Integration 8f1c8c4 | No failure. `npm run build` regenerated `docs/release-log/history.json` (1 line). | Left uncommitted at that time. Clean at 6082e1b (see above). |
| Concurrent writers | Another process committed "Release loop state" commits (27668ef, 24636dc, 6082e1b) to this checkout while the recorder worked. 6082e1b also committed `docs/test-results/release-loop-tooling/round-5.md`. | Informational. The recorder built on 6082e1b. |
| Earlier recording (17a67e9) | A recursive `grep -r` timed out and was replaced by `git grep` | Read-only; nothing written |
| Earlier release (proficiency-live-qr) | 11 failed or refused commands | See the [earlier release log](2026-10-02-proficiency-live-qr.md) |

The recorder started no server or database and has nothing to clean up. Nothing was pushed.

## Log index

- release-loop-tooling test results: [round-1](../test-results/release-loop-tooling/round-1.md), [round-2](../test-results/release-loop-tooling/round-2.md), [round-3](../test-results/release-loop-tooling/round-3.md), [round-4](../test-results/release-loop-tooling/round-4.md), [round-5](../test-results/release-loop-tooling/round-5.md). Step logs and screenshots are in `/var/tmp/sbpg/release-loop/release-loop-tooling/round-N/`, local and not committed.
- release-loop-tooling triage: [round-1 scope](../triage/release-loop-tooling-round-1-scope.md), [fix-r1 reconciliation](../triage/release-loop-tooling-fix-r1-reconciliation.md), [round-2 scope](../triage/release-loop-tooling-round-2-scope.md), [round-3](../triage/release-loop-tooling-round-3.md), [round-3 scope](../triage/release-loop-tooling-round-3-scope.md). The round-4 and round-4 scope files are **missing**.
- release-loop-tooling amendments: [A1](../spec-amendments/release-loop-tooling/A1.json), [A2](../spec-amendments/release-loop-tooling/A2.json)
- proficiency-live-qr test results: [round-1](../test-results/proficiency-live-qr/round-1.md) to [round-5](../test-results/proficiency-live-qr/round-5.md) (earlier release). Triage: [round-1](../triage/proficiency-live-qr-round-1.md), [round-2](../triage/proficiency-live-qr-round-2.md), [round-3](../triage/proficiency-live-qr-round-3.md); reconciliations [r2](../triage/proficiency-live-qr-fix-r2-reconciliation.md), [r3](../triage/proficiency-live-qr-fix-r3-reconciliation.md), [r4](../triage/proficiency-live-qr-fix-r4-reconciliation.md)
- Cross-feature: [scope review](../triage/scope-review.md), [bug state](active-release.state.json) (exported 2026-10-09T16:12Z), [release tracker](release-tracker.md)
- Sweep: none run for this release.
