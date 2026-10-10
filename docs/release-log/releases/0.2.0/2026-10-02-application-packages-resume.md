# Release log: 2026-10-02-application-packages-resume

- Release: 2026-10-02-application-packages-resume
- Integration branch: `claude/zealous-meitner-5tuft5` (not pushed by this release)
- Integration head when recorded: b81eeff (design-spec commit; the state commit 42fbef7 just before it also committed round-8.md). `qr-gated-outputs` round 8 tested faaebbf. The `qr-gated-outputs` section was rewritten at 647fff8 and checked against the 42fbef7 state export. The `resume-rollups` section was recorded at 13edeb2, and the `release-loop-tooling` section at c020576. Neither of those two was changed by this recording.
- Process: `server/data/releaseLoop/definition.json` (spec governance, interface parity, per-bug fix-attempt limit)
- Recorded: 2026-10-10 by the release recorder. This recording adds `qr-gated-outputs` rounds 6, 7 and 8 and its final result. The previous recording (94bf9a4) added `resume-rollups` (rounds 1 and 2). The one before it (acaaf03) added `qr-gated-outputs` (rounds 1 to 5); then (7d89f3c) added round 6 of `release-loop-tooling`. Earlier recordings: dfc466b (2026-10-09, rounds 1 to 5) and 17a67e9 (only `proficiency-live-qr`, whose section is kept below).
- Data: fictional only. No employer or application-target name appears in this log.

## Final results

| Feature | Final status | Last round | Commit tested | Steps passed / total (baseline) | Open blocking items | Backlog (not blocking) |
|---|---|---|---|---|---|---|
| release-loop-tooling | **PASSED** | 6 | 0800b1c | 30 / 30 on **v3** | none in the workflow data (see "State discrepancy" below) | T4-2 (MCP_GAP, pre_existing), F1-7, B5 (pre_existing), B4 (process_note) |
| qr-gated-outputs | **PASSED** (baseline v2; supersedes the round-5 passed_with_backlog) | 8 | faaebbf | **38 / 38 on v2** (round 7: 38/38 on v2 at 6a71095) | none on a scored step. 5 open spec gaps with no scored step (F7-2 to F7-6) wait on a reviewer or the owner | Boot race (round-8 O1, not filed), F2-5, F2-7/F3-9/B9, F2-9/B8, stale T1/T5 records (pre_existing); cover-letter-agent-T11, cover-letter-agent-F1-12, resume-rollups-B9 (reassigned to this feature, unfixed); F2-1, F3-3 (process_note) |
| resume-rollups | **NOT PASSED** (workflow verdict passed_with_backlog, refused under definition 13edeb2) | 2 | 0800b1c | **30 / 32 on v2**; [J12.1] (desktop + 390px) and [E.4] (390px) fail | RR1-3 [J12.1], RR1-4 [E.4] (scoped pre_existing, but block under 13edeb2); state export: 15 open | B4, B9 (other_feature), B14 (process_note), mobile header clip (cosmetic) |
| proficiency-live-qr | **NOT PASSED** | 6 (state export) | see state export | 29 / 32 (state export; not handed to the recorder) | 8 open in the state export, 3 owner questions | see state export |

**This recording (qr-gated-outputs, rounds 6 to 8).** `qr-gated-outputs` now **passes**: 38/38 on baseline v2 in round 7 (6a71095) and again in round 8 (faaebbf), on desktop and at 390px, with nothing failed, blocked or not run. Fix r6 (8b73f29, merged 8f7e111) changed the two em-dash strings behind [J2.1] and [E.5] to hyphens, the first fix round to apply them. Rounds 3 to 8 are all on v2 with the same spec sha256, and no amendment changed a step, so 36/38 to 38/38 is a like-for-like gain. This replaces the round-5 passed_with_backlog verdict, which 13edeb2 made invalid.

Three things a person still needs to handle:
- Five spec gaps have no scored step: the docx stamp, the member account in P.1, the Draft-card fixture, MCP parity and the in-app import card (F7-2 to F7-6). Every amendment after A1 was rejected and none has been resubmitted.
- The import card is unreadable at 390px (round-8 O3, cover-letter-agent-T11). It is a real defect, but no v2 step covers it.
- The round-6 test-result report was never written. Only a local step log exists.

The feature also ran six fix rounds against `maxFixRounds: 4`.

**Previous recording (resume-rollups).** The workflow handed `resume-rollups` over as passed_with_backlog: round 2 scored 30/32 on baseline v2 at 0800b1c, and [J12.1] and [E.4] still fail. Both causes (RR1-3, RR1-4) were scoped `pre_existing` and moved to backlog. While the recorder worked, the process definition was changed at 13edeb2 (now the integration head): "a feature never ends passed or passed_with_backlog while a baseline step fails". The recorder therefore records `resume-rollups` as **NOT PASSED**. RR1-3 and RR1-4 have failed in two rounds and have never been in a fix list. The same rule applies to `qr-gated-outputs` (2 failing frozen steps), whose section below was written before 13edeb2. Under the current definition, it has not passed either.

**Previous recording (qr-gated-outputs).** The workflow ended `qr-gated-outputs` as passed_with_backlog, scoring 36/38 on baseline v2 at 0800b1c. Rounds 3, 4 and 5 all scored 36/38 on v2, with the same two failures: [J2.1] and [E.5]. Both are em-dash copy strings that the round-5 scope review found already present before the feature (base 9e729b6), so they went to backlog. Neither has ever been fixed, and both frozen steps still fail. The state export of 2026-10-10T00:40:17Z still says `failing` with 17 open bugs. Treat this feature as **not releasable until a person reconciles the state and either fixes T1/T5 or accepts them**. See the feature section below.

In the previous recording, `release-loop-tooling` passed again in round 6: 30/30 on baseline v3 at 0800b1c, with no steps failed, blocked or not run. Rounds 5 and 6 are on the same baseline (v3, spec sha256 `03924b9a...177bc`), so they compare like for like. Round 4 (29/30) was on v2; it compares with rounds 5 and 6 only through approved amendment A2, which changed step J3b.3 and nothing else.

**Features that did NOT pass.** The bug-state export (`active-release.state.json`, exported 2026-10-10T00:16:59Z, committed in d2beb30) lists these features. None of them was handed to this recorder with a passing result, so none of them is releasable. Scores are copied from the export; the recorder has no baseline version for them and does not compare them with each other or with earlier recordings.

| Feature | State status | Last round | Last score (state export) | Open blocking bugs (this_feature, not verified) |
|---|---|---|---|---|
| proficiency-live-qr | validate | 6 | 29/32 | 8 |
| world-shell-navigation | validate | 2 | 36/47 | 9 |
| career-bound-outputs | validate | 3 | 48/56 | 9 |
| qr-gated-outputs | **passed** (round 8; export 20:01:09Z agrees) | 8 | 38/38 on v2 | 0 per export; the recorder counts F7-2 to F7-6 as open spec gaps with no scored step |
| no-silent-failures | validate | 1 | 18/28 | 7 |
| chart-gallery | validate | 3 | 17/20 | 10 |
| output-version-history | validate | 3 | 30/37 | 0 by status count (not handed to the recorder) |
| resume-rollups | triage (export 00:43:34Z; workflow says passed_with_backlog, refused under 13edeb2; see its section) | 2 | 30/32 on v2 | 15 per export |
| release-intelligence | validate | 1 | 1/54 | 4 |
| cover-letter-agent | validate | 1 | 38/46 | 10 |
| in-app-release-loop | validate | 1 | 59/60 | 2 |
| platform-mcp | validate | 1 | 62/62 (not marked passed in the state export) | 6 |
| session-mapping | **failed** | 0 | not run | 3 |
| live-release-tracker | validate | 0 | not run | 7 |
| world-shell-layers | build | 0 | not run | 0 |
| render-bindings | build | 0 | not run | 0 |
| platform-agent-runner | build | 0 | not run | 0 |

The open-bug column counts state-export bugs for that feature whose status is not verified, backlog or process_note. It is the recorder's count from the export, not a triage decision.

**The release as a whole did not pass.** Two features passed every frozen step: `release-loop-tooling` (30/30 on v3) and `qr-gated-outputs` (38/38 on v2, round 8). `resume-rollups` (30/32) ended passed_with_backlog while frozen steps still fail, which the current definition (13edeb2) forbids, so the recorder counts it as **not passed**. Every other feature in the table above (`proficiency-live-qr`, `world-shell-navigation`, `career-bound-outputs`, `no-silent-failures`, `chart-gallery`, `output-version-history`, `release-intelligence`, `cover-letter-agent`, `in-app-release-loop`, `platform-mcp`, `session-mapping`, `live-release-tracker`, `world-shell-layers`, `render-bindings`, `platform-agent-runner`) was not handed to this recorder with a passing result and has **not passed**. Their scores are from the earlier export and were not re-read for this recording. Under the push gate, the integration branch must not be pushed unless the owner says otherwise. Nothing was pushed. No sweep was run (`sweep: null`).

---

## Feature: release-loop-tooling

Title: Release loop tooling: definition, saved workflow, skill, bug-attempt limit, failure reconciliation, live step logs, tracker sync, test accounts.

Status: **PASSED** in round 6, confirming round 5. It scored 30/30 on baseline v3 at commit 0800b1c, with no steps failed, blocked or not run. The spec sha256 was `03924b9abae72dd99085b511db948016cfb8c7f49bd2f7a86a95432a31b177bc`, the same as round 5. `node scripts/release-spec-baseline.mjs check --feature release-loop-tooling` prints "baselines match: release-loop-tooling v3" at d2beb30 (re-run by the recorder, exit 0).

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
| 6 | 0800b1c | **v3** (unchanged) | **PASS, 30 / 30 steps** | [round-6](../test-results/release-loop-tooling/round-6.md) | none needed |

Round 1 to 3 counts are checked expectations across 5 viewport and theme runs. Round 4 to 6 counts are baseline steps scored by `release-spec-baseline.mjs score`. These are different units. Round 3's 104/126 cannot be compared with round 4's 29/30 or round 5's 30/30.

Rounds 1 to 3 are summarized here from their committed files. Rounds 4 and 5 come from the workflow data of the previous recording (dfc466b). The workflow data for this recording carried round 6 in full.

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

#### Round 6 (baseline v3): 30 / 30, PASSED

- Commit tested: 0800b1c (integration head, merge of release-intelligence-spec-r1). Report: [round-6](../test-results/release-loop-tooling/round-6.md). Failed: none. Blocked: none. Not run: none.
- Score output: `{"baseline":3,"specSha256":"03924b9abae72dd99085b511db948016cfb8c7f49bd2f7a86a95432a31b177bc","total":30,"passed":30,"failed":[],"blocked":[],"notRun":[]}`.
- Baseline unchanged since round 5 (v3), so no baseline diff table was needed and the scores compare directly.
- Why it was re-run: between 8f1c8c4 and 0800b1c, other work changed this feature's files: `scripts/release-tracker-sync.mjs` (+47), `tools/release-tracker/index.html`, `tools/release-tracker/SETUP-FOR-CLAUDE.md`, `.claude/skills/salt-basin-release-loop/SKILL.md` and `.claude/workflows/release-loop.js` (commits 6f9a155, d7340d6 via 281e863, af2ee11, 86d4ada). Round 6 confirms the pass still holds after those changes.
- Environment: fresh database, seed, test accounts via `scripts/create-test-member.mjs`; Chromium 1280x900 and 390x844 touch; light, dark and `?theme=dark`; en-US; UTC.

Open bugs verified by baseline step in round 6 (the state export still shows them open; see "State discrepancy"):

| Bug | Step | Round-6 evidence |
|---|---|---|
| release-loop-tooling-F1-2 | [J5.3] | 390px stacked cards with `data-label` cells (Status, Latest test, Rounds, Its own bugs verified); no `.panel` overflow on overview, feature, round and Tokens layers; tapping card text opens the feature layer. Light, dark and `?theme=dark`. |
| release-loop-tooling-B3 | [J5.3] | Same evidence as F1-2. |
| release-loop-tooling-F1-5 | [J4.1] | Agent card matches the current spec wording (VALIDATE - ROUND 1, delta-board, "Click the Save button", "2 checks - 1 passed - 1 failed", started / last step line). |
| release-loop-tooling-B1 | [J1.3] | `d.tracker` mentions the tracker artifact and has no `World Shell` or `/api/release-loop`; the grep prints nothing. |
| release-loop-tooling-B2 | [J3.4], [E.4] | `validate:echo-audit:r1` reported stalled and the feature stalled; running with `--stale-minutes 60` passes. |
| T4-1 | [J3b.3] | Passes under A2: desktop shows Your World, Journeys, Classic Tools; phone shows Journeys and Classic Tools. |

Note: the round-5 log above said no baseline step covers B1, B2 or F1-5. The round-6 validator mapped them to J1.3, J3.4/E.4 and J4.1. Those steps were already in v3 (v3 has not changed), so this is a more precise mapping by the validator, not a spec change and not validator drift.

Observations and non-step findings (none affects the score):

- **MCP_GAP (not a baseline step).** `server/lib/mcpToolRegistry.js` now exists (platform-mcp, merged 20b2769), but has no tool for the tracker sync, the tracker preview or the test-account script. The related `release_tracker_read` tool reads the release-intelligence database, not this tooling. This feature is developer tooling with no platform screen, so it stays an observation, as in round 5. Tracked as backlog T4-2 below.
- **Flake, second time.** `preview.html?theme=dark` at 1280 failed J4.1 once in the full run: the heading element was not present after the fixed 1.5 s wait. An immediate re-run of that config passed every step. Round 5 saw the same flake on the 390 config. Likely slow first paint of the preview page. Recorded here as a process note; it recurred, so a person should decide whether the validator's fixed wait needs a wait-for-element (that would be an amendment, not an edit).
- After login on the 390px phone, the Career Placement Agents panel fills the screen and hides the world. Journeys and Classic Tools stay usable, so J3b.3 passes under A2. Not filed as a bug in this feature; a candidate for the owner or world-shell-navigation.
- Port 6302 was already in use by another process, so the preview server used 6352.
- The app and tracker load external fonts and Chart.js/three.js, which the sandbox blocks (`external_blocked`, not counted).

Triage and fix for round 6: none. The round passed, so no triage agent or fix agent ran.

### Spec amendments

| Id | Status | Round | What changed | Proposed by | Reviewer | Branch / commit | Merged in | New baseline |
|---|---|---|---|---|---|---|---|---|
| [A1](../spec-amendments/release-loop-tooling/A1.json) | approved | 3 | J1.1 now expects `7 9 2 ... ,baseline` (definition v4). J4.1 tightened so the Status updates tile value is checked against the last `updates` entry in snap.json. J4.5 gained a scope note. J5.2 changed the page tokens to #F8F4EC / #161A1C. J5.3 makes the stalled-pill style checkable by reference to the Agent stopped pill. The cli sync-setup-guide check was split out into new step **J5.5**. | fix:release-loop-tooling:r3 (fe190e2) and owner direction 2026-10-09 | amend:release-loop-tooling:r3 | release-loop/release-loop-tooling-spec-r3 / 4cf9d9a | 9be77fb | v2 (30 scored steps, 3 preconditions) |
| [A2](../spec-amendments/release-loop-tooling/A2.json) | approved | 4 | J3b.3: Journeys and Classic Tools are required at both sizes. The "Your World" subtitle is required on desktop only, because it is hidden below 700px by design. The "not weaker" check passes because the old 390px expectation contradicted the documented phone layout. The reviewer noted that if the Career Placement Agents panel ever hides Journeys or Classic Tools, the step fails as a product defect. | triage:release-loop-tooling:r4 (T4-1) | amend:release-loop-tooling:r4 | release-loop/release-loop-tooling-spec-r4 / ffb5fce | 8f1c8c4 | v3 |

Both amendment runs reported no failures.

No amendment was proposed or made in round 6.

**Validator drift:** none found. Each scored round names its baseline and spec sha256. `release-spec-baseline.mjs check --all` passed at both integrations. The round-5 and round-6 sha256 values are both the v3 spec, and the recorder's `check --feature release-loop-tooling` at d2beb30 matched v3. The proposed J3b.3 clarification from round 4 was filed as A2, not edited in.

### Integration commits

| Commit | What | Conflicts | Build | Notes |
|---|---|---|---|---|
| 991999d | Merge `release-loop-tooling-build` (bed12f0) | n/a | n/a | Earlier in this release |
| 8a687ee | Merge `fix-r1` (082eed1) | n/a | n/a | Earlier in this release |
| 06bd1c8 | Merge `fix-r3b` (dac3ce6) | n/a | n/a | Earlier in this release |
| 9be77fb | Merge `spec-r3` (4cf9d9a, A1, baseline v2); pre-merge HEAD ec5e365 | none | passed | `check --all` exit 0. No logs commit (nothing staged). |
| 8f1c8c4 | Merge `spec-r4` (ffb5fce, A2, baseline v3); pre-merge HEAD 1b6eb38 | none | passed (twice; vite built in 55.45s) | `check --all` exit 0, with all 11 baselines matching. No logs commit. |

No integration commit was made for this feature in round 6: the round passed and nothing was fixed. Round 6 tested 0800b1c, the merge of `release-loop/release-intelligence-spec-r1` (another feature). The commits after 0800b1c (ed234db, c1ef03b, d2beb30) are release-state and tracker-update commits with no code for this feature.

The rows marked n/a predate the workflow data given to this recorder. Their merges are in `git log`; build results for them are in the earlier test-result files.

### State discrepancy (reported, not resolved here)

The workflow data marks this feature passed, with no blocking items left. The bug-state export (2026-10-10T00:16:59Z, d2beb30) still has the feature at `validate`, last round 5, `openBugs: 6`, and still lists these items as not closed. Round 6 verified each of them by step id (table in Round 6). A person or the loop's state writer should move them to verified before relying on the state file. The recorder did not edit the state file.

- **T4-1** (spec_error): `open`, 0 attempts. Resolved by A2; J3b.3 passed in rounds 5 and 6.
- **release-loop-tooling-F1-2** (defect, 390px stacked cards and stalled label): `recurred`, 0 attempts. J5.3 passed in rounds 4, 5 and 6.
- **B3** (390px reflow, requirement_gap): `open`. Same subject as F1-2; J5.3 passed in round 6.
- **B1** (requirement_gap, `open`): the docs claim of a World Shell release-loop view. Round 6 passed J1.3 (`d.tracker` no longer mentions `World Shell` or `/api/release-loop`). Note that `in-app-release-loop` has since been merged (50b5c98, 3e4bcc1) and does add a World Shell release-loop screen, so a person should confirm the docs now describe both correctly.
- **B2** (requirement_gap, `open`): `fromRun` agents and the idle check. J3.4 and E.4 passed in round 6.
- **release-loop-tooling-F1-5** (requirement_gap, `open`): the agent card. J4.1 passed against the current spec wording in round 6. The owner question below (page-errors count) is still unanswered, so "verified" here means "matches the frozen spec", not "owner approved the design".

### Escalated for a business definition

There are none in the round-6 workflow data (`escalated: []`). One owner decision is still open from earlier rounds (F1-5). The question is: "Should the agent card on the release tracker show a page-errors count again, as the original design did, or is the current `checks · passed · failed` card final?"

Round 4 also raised a non-blocking question under T4-2: "Should creating test accounts be reachable over MCP, given it is restricted to local test databases?"

### Bugs at the per-bug fix-attempt limit (needsHuman)

None. The workflow data for round 6 lists no `needsHuman` items, and no bug in the state export (any feature) is marked needs_human. The highest attempt count on any release-loop-tooling item is 1 (RLT-T1, RLT-T2, F1-6, T3-1, T3-3, all verified).

### Backlog: NOT blocking this feature

| Id | Scope | Class / status | Evidence | Owner |
|---|---|---|---|---|
| T4-2 | pre_existing | environment, `backlog_pre_existing` (round 4; seen again in round 6) | Not part of this feature's request. `server/lib/mcpToolRegistry.js` belongs to the separate feature platform-mcp. In round 4 the file did not exist; by round 6 it exists (merged 20b2769) but has no tool for the tracker sync/preview or `create-test-member.mjs`. Its `release_tracker_read` tool reads the release-intelligence database, not this tooling. No merged feature caused the gap. | platform-mcp feature (no person assigned) |
| (round-6 flake) | process_note | process, not filed in the bug state | `preview.html?theme=dark` at 1280 failed J4.1 once (heading not present after the fixed 1.5 s wait); re-run passed. Same flake in round 5 on the 390 config. | not assigned |
| F1-7 | pre_existing | requirement_gap, `backlog_pre_existing` | The release loop inside the platform for in-app agents is out of this feature's request. definition.json and the change spec already say the tracker has no platform screen. When built, it must be reached from the World Shell. | in-app-release-loop feature (no person assigned) |
| B5 | pre_existing | owner_direction_conflict, `backlog_pre_existing` | The feature definition lists a static tracker page and scripts with no World Shell requirement. The World Shell surface belongs to the separate in-app-release-loop feature. | in-app-release-loop feature (no person assigned) |
| B4 | process_note | process | Only the local harness stub of the host check was tested. This is a limit of the validation environment. | not assigned |

No item has scope `other_feature`.

---

## Feature: qr-gated-outputs

Title: QR-gated tailored application outputs: import, metadata, approve for QR, private slug, clickable QR in PDF/docx, revoke.

Status: **PASSED** on baseline v2. Round 8 scored **38 / 38 on baseline v2** at commit faaebbf, on desktop (1280x900, clicks) and on a 390px phone (touch), with no steps failed, blocked or not run, and no page errors. Round 7 had already scored 38 / 38 on v2 at 6a71095. This is a clean pass of every frozen step. Under definition 13edeb2 ("a feature never ends passed or passed_with_backlog while a baseline step fails") it is now allowed: no baseline step fails. The earlier passed_with_backlog verdict (round 5, 36/38) is **superseded**. It was never valid under 13edeb2, and this recording replaces it.

The pass covers baseline v2 only. Five open items (qr-gated-outputs-F7-2 to F7-6) are gaps in the spec, not failing steps: the docx stamp, the in-app import card, the MCP tools and the member account have **no scored step**, because every amendment after A1 was rejected and none has been resubmitted. They need a reviewer and the owner, not code. See "Open items that map to no scored step" below. They do not block this verdict, but they mean the "PDF/docx", "in-app import" and MCP parts of the title are working only by the validators' unscored observations, not by a frozen step.

- Training spec: [docs/training/qr-gated-outputs.md](../training/qr-gated-outputs.md); baselines: [v1](../training/baselines/qr-gated-outputs/v1.json), [v2](../training/baselines/qr-gated-outputs/v2.json). The recorder ran `node scripts/release-spec-baseline.mjs check --feature qr-gated-outputs` at 647fff8. It printed "baselines match: qr-gated-outputs v2" (exit 0). The spec and baselines have no commits since the previous recording (94bf9a4).
- Change spec: [docs/changes/qr-gated-outputs.md](../changes/qr-gated-outputs.md) (fix notes for rounds 6 and 7 added by 8b73f29 and 0e38ca2).
- Built in d78bcda and 76b33ad (branch `release-loop/qr-gated-outputs-build`, 51b006c).
- The recorder confirmed by grep at 647fff8 that both strings are now hyphens: `src/components/admin/MyResumePanel.jsx:1109` "Read-only - no edits can be made here." and `server/routes/auth.js:28` "Too many attempts - please try again in 15 minutes".

### Rounds

| Round | Commit tested | Baseline | Result | Test result | Triage |
|---|---|---|---|---|---|
| 1 | 8430eae | none (before spec governance) | FAIL, 45 / 48 checked expectations | [round-1](../test-results/qr-gated-outputs/round-1.md) | No round-1 triage file was written. Build reconciliation: [build](../triage/qr-gated-outputs-build-reconciliation.md) |
| 2 | c3a71b4 | **v1** (sha256 `a5778429...0cb779`) | FAIL, 33 / 38 steps | [round-2](../test-results/qr-gated-outputs/round-2.md) | [round-2](../triage/qr-gated-outputs-round-2.md), [round-2 scope](../triage/qr-gated-outputs-round-2-scope.md), [fix-r2 reconciliation](../triage/qr-gated-outputs-fix-r2-reconciliation.md) |
| 3 | 379d72a | **v2** (A1; sha256 `ec0b3830...b2e00e`) | FAIL, 36 / 38 steps | [round-3](../test-results/qr-gated-outputs/round-3.md) | [round-3](../triage/qr-gated-outputs-round-3.md), [round-3 scope](../triage/qr-gated-outputs-round-3-scope.md), [fix-r3 reconciliation](../triage/qr-gated-outputs-fix-r3-reconciliation.md) |
| 4 | 2fd2e2e | **v2** (unchanged) | FAIL, 36 / 38 steps | [round-4](../test-results/qr-gated-outputs/round-4.md) | [round-4](../triage/qr-gated-outputs-round-4.md), [round-4 scope](../triage/qr-gated-outputs-round-4-scope.md), [fix-r4 reconciliation](../triage/qr-gated-outputs-fix-r4-reconciliation.md) |
| 5 | 0800b1c | **v2** (unchanged) | FAIL, 36 / 38 steps (workflow verdict then: passed_with_backlog, now superseded) | [round-5](../test-results/qr-gated-outputs/round-5.md) | [round-5](../triage/qr-gated-outputs-round-5.md), [round-5 scope](../triage/qr-gated-outputs-round-5-scope.md) |
| 6 | not recorded (run 00:55 to 01:14Z on 2026-10-10, before fix 8b73f29) | **v2** (unchanged) | FAIL, 36 / 38 steps (J2.1, E.5 on both surfaces) | **missing**: no `round-6.md` in the checkout, any worktree or any git ref. Evidence only in `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-6/steps.jsonl` (local, not committed) | [round-6 scope](../triage/qr-gated-outputs-round-6-scope.md), [fix-r6 reconciliation](../triage/qr-gated-outputs-fix-r6-reconciliation.md). No round-6 triage file exists. |
| 7 | 6a71095 | **v2** (unchanged) | **PASS, 38 / 38 steps** | [round-7](../test-results/qr-gated-outputs/round-7.md) | [round-7 scope](../triage/qr-gated-outputs-round-7-scope.md), [fix-r7 reconciliation](../triage/qr-gated-outputs-fix-r7-reconciliation.md). No triage (nothing failed). |
| 8 | faaebbf | **v2** (unchanged) | **PASS, 38 / 38 steps** | [round-8](../test-results/qr-gated-outputs/round-8.md) | none (nothing failed) |

**Comparing scores.** Round 1 counted checked expectations, not baseline steps, so its 45/48 cannot be compared with any later round. Round 2 (v1, 33/38) compares with rounds 3 to 8 (v2) only through amendment A1. A1 changed no scored step: the v1-to-v2 diff is 38 steps the same, none changed, added or retired. It added only a phone-route note to "Where things are". Rounds 3 to 8 are all on v2 with the same spec sha256 (`ec0b38300916588f2be4249e36c6237ef9b95636972ebfc7ed8dfec2a2e2b00e`). The round-8 report states that the `diff` since round 7 changed, added and retired nothing, so they compare directly. The move from 36/38 (rounds 3 to 6) to 38/38 (rounds 7 and 8) comes entirely from fix r6 (8b73f29), which made [J2.1] and [E.5] pass. No step was rescored by an amendment.

**Round 6 report missing.** The bug-state export records round 6 as 36/38 (history point 285b9f4, `scope`, round 6). The round-6 scope review and fix r6 both act on its failures. But no `docs/test-results/qr-gated-outputs/round-6.md` was ever written to the main checkout, a worktree or any branch (`git log --all` finds nothing). The recorder did **not** create one. The only evidence is the validator's local step log, `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-6/steps.jsonl`, which has 86 pass rows and these 4 fail rows:

| Step | Surface | Seen (from steps.jsonl) |
|---|---|---|
| [J2.1] | desktop, mobile | `missing=["Read-only - no edits can be made here."]`, `readonlyText="Read-only — no edits can be made here."` |
| [E.5] | desktop, mobile | after 6 attempts, `message="Too many attempts — please try again in 15 minutes"` |

The commit tested is not recorded in that log. The run (port 7102) ended at 01:14Z, before fix 8b73f29 (01:19Z), so it tested a head without the fix.

#### Rounds 1 to 5 (summary; full detail in the previous recording, acaaf03)

- **Round 1** (8430eae, no baseline, 45/48): failures J2.1 (Read-only em dash), J2.1b (contact entries ran together), J3.3 (approve toast em dash). No triage file. They carried into round 2 as T1, T2 and T3.
- **Round 2** (c3a71b4, v1, 33/38): J2.1, J3.3, J7.1, J8.3 and E.5 failed on both surfaces, each a single em dash where the spec has a hyphen.

| Id | Step | Class | Scope (round 2) | Root cause | Files |
|---|---|---|---|---|---|
| T1 | [J2.1] | defect | pre_existing (round 6: this_feature) | `MyResumePanel.jsx` Read-only note uses an em dash; already at e0ea466 (blame 9b5ad4f0, 2026-08-09) | `src/components/admin/MyResumePanel.jsx` |
| T3 | [J3.3], [J7.1], [J8.3] | defect | this_feature | `approveForQr` toast uses an em dash; introduced by d78bcda | `src/components/admin/MyResumePanel.jsx` |
| T2 | [J2.1] (contact) | defect | this_feature | `DocumentBlocksView.jsx:94` renders an array `header.contact` with no separator; the PDF used commas | `DocumentBlocksView.jsx`, `outputRendering.js`, `documentBlocksEditor.js` |
| T5 | [E.5] | defect | pre_existing | `server/routes/auth.js:28` `authLimiter` message uses an em dash; at e0ea466 (blame a875b9b, 2026-07-10) | `server/routes/auth.js` |
| G1 | navigation | coverage_gap | this_feature | No phone route to My Resume in the spec | training spec (amendment A1, approved) |
| G2 | [J10.3], [E.1], [E.2], [E.4] | coverage_gap | this_feature | No step leaves a Draft card after Journey 9 | training spec (A2, rejected) |

- **Fix r2** (73505f4, merged fc1e20b): fixed T3 and T2. Files: `MyResumePanel.jsx` (toast), `src/lib/headerContact.js` (new), `DocumentBlocksView.jsx`, `outputRendering.js`, `documentBlocksEditor.js`. T1 and T5 were left off the fix list.
- **Round 3** (379d72a, v2, 36/38): T2 and T3 verified. J2.1 and E.5 still failed. **Fix r3** (27e4fda, merged 238767f): MCP tools `application_output_revoke_qr`, `application_package_import`, `shared_output_resolve`, and a stamped `.docx` download (`mcpToolRegistry.js`, `mcpToolManifest.json`, `capabilityParity.js`, `outputDocx.js` new, `outputRendering.js`, `resumeOutputs.js`, `MyResumePanel.jsx`, `api.js`). T1 and T5 again not applied.
- **Round 4** (2fd2e2e, v2, 36/38): same two failures. **Fix r4** (e7a28dd, merged 4620984): change-spec notes only, no code. T1 and T5 not applied for the third time.
- **Round 5** (0800b1c, v2, 36/38): same two failures, first run as member@test.local. The scope review (base 9e729b6) classed T1 and T5 `pre_existing`, and the workflow ended the feature passed_with_backlog. No fix round 5. Process definition 13edeb2 (00:47Z, same day) then forbade that verdict while a frozen step fails, and the loop reopened the feature.

#### Round 6 (baseline v2): 36 / 38, FAIL

- Failures: [J2.1] and [E.5] on desktop and mobile, as in rounds 3 to 5 (table above). Test-result report missing (see above).
- **Scope** ([round-6 scope](../triage/qr-gated-outputs-round-6-scope.md), base `aa14653^1`): 
  - qr-gated-outputs-T1 **this_feature**. The em dash predates the feature (9b5ad4f, 2026-08-09), but the dialog is the surface this feature's own step J2.1 tests, and `scope-review.json` already classes it so.
  - qr-gated-outputs-T5 **pre_existing**. The identical line 28 is on the base (initial import a875b9b). Under 13edeb2 it stays this feature's to fix anyway, because it makes frozen step E.5 fail.
- **Fix r6** (8b73f29, merged 8f7e111), the first fix round to apply T1 and T5:
  - T1: `src/components/admin/MyResumePanel.jsx:1109` now reads "Read-only - no edits can be made here."
  - T5: `server/routes/auth.js:28` now reads "Too many attempts - please try again in 15 minutes".
  - Notes in `docs/changes/qr-gated-outputs.md`. Checked by grep and `npm run build`. **Not walked in a browser** by the fix agent.
- [Fix-r6 reconciliation](../triage/qr-gated-outputs-fix-r6-reconciliation.md):
  - N1/N2 resolved in code. R1 unresolved until a validator re-walked (closed by round 7).
  - R2: em dashes remain in the checkout and signup limiters (`server/routes/commerce.js:30`, `server/routes/members.js:29`). Informational; no spec step.
  - G1: the in-app import card (`data-testid="package-import"`) exists but is unscored.
  - G2, G5, G6, G7: docx/site sync, P.1 member account, Draft-card fixture and MCP step. All wait on amendments.
- Bug filed by the fix agent: qr-gated-outputs-F6-1 (class process, "J2.1, E.5 not walked"), scope this_feature (round-7 scope), **verified** in round 7.

#### Round 7 (baseline v2): 38 / 38, PASS

- Commit 6a71095. Validator val-7100-6, port 7112, member@test.local, each surface on its own fresh database. Report: [round-7](../test-results/qr-gated-outputs/round-7.md).
- Score output: `{"baseline":2,"specSha256":"ec0b3830...b2e00e","total":38,"passed":38,"failed":[],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":["J2.1b","J3.2b","J5.1m"]}`
- T1 verified: J2.1 passes on both surfaces. T5 verified: E.5 passes on both surfaces.
- Interface parity: no MOBILE_GAP and no MCP_GAP. The four MCP tools matched the UI, but **outside the score**.
- Observations: O1 member desktop path has no "Network Relationship Management" tab. O3 Draft card via a harness import. O5 the spec's E.2 toast keeps an em dash and the product matches it.
- [Round-7 scope](../triage/qr-gated-outputs-round-7-scope.md) (head 9989faa): F6-1, F6-4, F6-5, F6-6 and F6-7 are all this_feature. F6-4 to F6-7 are spec-amendment governance items with no runtime behaviour.
- **Fix r7** (0e38ca2, merged c85d59b): **no product code**.
  - Updated the stale "Known limitations" import line in the change spec to describe the import card.
  - Self-walked J2.1 and E.5 at 1280px and 390px (port 7116) and recorded the fix notes.
  - Touched nothing under `docs/training/` or `docs/spec-amendments/`.
- [Fix-r7 reconciliation](../triage/qr-gated-outputs-fix-r7-reconciliation.md): F7-1 resolved (harness: limiter exhaustion, "View" substring matched "Hide Preview", refused shell commands). F6-4 to F6-7 unresolved. They were refiled as qr-gated-outputs-F7-2 to F7-6, all waiting on a reviewer or the owner.

#### Round 8 (baseline v2): 38 / 38, PASS (final)

- Commit faaebbf. Validator val-5100-1, port 5102, member@test.local. Desktop 1280x900 (clicks) and phone 390x844 (touch), each on its own fresh database. Report: [round-8](../test-results/qr-gated-outputs/round-8.md).
- Score output: `{"feature":"qr-gated-outputs","baseline":2,"specSha256":"ec0b38300916588f2be4249e36c6237ef9b95636972ebfc7ed8dfec2a2e2b00e","total":38,"passed":38,"failed":[],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":["J2.1b","J3.2b","J5.1m"]}`
- Failures: none. Not run: none. Blocked: none.
- Baseline v2 is unchanged since round 7: the `diff` changed, added and retired nothing. Scores read like for like with rounds 3 to 7.
- No step regressed. All five open bugs (F7-2 to F7-6) map to no scored step.
- Interface parity: desktop by clicks from the World Shell, phone by taps via Journeys cards. No MOBILE_GAP.
  - MCP, unscored, as the same user with a token from World Shell > Journeys > Connected Agents:
    - `shared_output_resolve` returned the revised document for a live slug and 404 for a revoked one.
    - `application_output_revoke_qr` returned `{ok:true}`.
    - `application_package_import` returned `unchanged`.
    - `application_output_approve_for_qr` returned 409 `tool_category_required`, the same gate the website applies.
  - No MCP_GAP.
- Expected non-2xx only: 409 gate, 404 revoked, unknown and short slugs, 401/429 in E.5. `net::ERR_ABORTED` on the PDF download is the browser download. External fonts and three.js were `external_blocked`.

Observations from round 8 (from the workflow data and the report; none affects the score):

| Id | Observation | Where it goes |
|---|---|---|
| O1 | First server boot on the first fresh database crashed: `PostgresError` 23505 duplicate key `pg_type_typname_nsp_index`, `(metric_definitions, 2200)`. This is a bootstrap `CREATE TABLE IF NOT EXISTS` race (`server/db.js:122`). The server was left not listening (ECONNREFUSED). Two later fresh boots did not reproduce it. Evidence: `/var/tmp/sbpg/agents/val-5100-1/server-desktop.log` (first attempt) and `aborted-attempt1-steps.jsonl` (not scored). | **Not filed as a bug by anyone.** Same symptom as round 3's mobile boot crash ("duplicate-key error, bootstrap racing seed"). No baseline step covers it. Listed under Backlog below; needs an owner. |
| O2 | A member's desktop path has no "Network Relationship Management" tab, and P.1 names the administrator while the test-account constraint uses the member. | qr-gated-outputs-F7-3 (wording amendment still needed) |
| O3 | The "Import an application package" card in My Resume at 390px is cream text (rgb(245,240,232)) on a transparent card over cream, practically unreadable (`round-8/mobile/obs-import-card.png`). | Same as cover-letter-agent-T11 (reassigned to this feature) and part of qr-gated-outputs-F7-6. **A product defect with no scored step** (see below). |
| O4 | No spec step creates the Draft card needed by J10.3, E.1, E.2 and E.4. A third package import was harness setup. | qr-gated-outputs-F7-4 |
| O5 | Amendments A3, A4, A6, A7 and A8 are all rejected. The docx stamp, in-app import and MCP behaviour have no baseline step. | qr-gated-outputs-F7-2, F7-5 |
| O6 | The spec's E.2 toast keeps an em dash and the product matches it. J3.3, J7.1 and J8.3 use a hyphen in both. | informational |

### Open items that map to no scored step (handed to round 8, still open)

These five bugs were open in the state export of 2026-10-10T19:57:36Z. In the export of 20:01:09Z (42fbef7), all five are marked `verified`, but the round-8 report says each "stays open" (see State discrepancy). All have `scope: null` and `attempts: 0`, and all were found by the fix-r7 agent in round 7. None makes a v2 step fail, so none blocks the v2 verdict. All of them wait on a person: an amendment reviewer who is not the proposer, or the owner.

| Id | Class | Step / item | Root cause (export) | Files | Needed |
|---|---|---|---|---|---|
| qr-gated-outputs-F7-2 | requirement_gap | F6-4 / [B10.1] / J6.4 (docx stamp, site sync) | Amendments not exact, wrong surface labelling, invalid ids; the owner has not recorded the site-sync decision. | `docs/spec-amendments/qr-gated-outputs/A3.json`, `A8.json`, `scripts/sync-site-with-application-package.mjs` | Resubmit A3/A8 per review (J6.4 browser download plus J6.5 literal `python3 -I` check). The owner records that site sync stays a script. |
| qr-gated-outputs-F7-3 | owner_direction_conflict | F6-5 / P.1 | Spec predates the World Shell member-only direction; A6 left admin-run imports. | `docs/training/qr-gated-outputs.md`, `A6.json` | One amendment changing P.1, P.4, J8.1, "Where things are" and P.2 together, with a member-run import. |
| qr-gated-outputs-F7-4 | test_harness | F6-6 / P.5 | Spec has no step creating the Draft card. | `A7.json` | Resubmit A7 with a member-run import and a deterministic E.3. |
| qr-gated-outputs-F7-5 | requirement_gap | F6-7 / MCP | No scored MCP step in the baseline. | `A4.json`, `server/lib/mcpToolRegistry.js` | Resubmit A4 with an unused id and exact transport, auth and arguments. |
| qr-gated-outputs-F7-6 | requirement_gap | Known limitations: in-app import card | Spec covers only CLI import. | `src/components/admin/MyResumePanel.jsx`, `docs/training/qr-gated-outputs.md` | A scored step for the card. **Also a code fix**: the card is unreadable at 390px (round-8 O3, cover-letter-agent-T11). |

Reassigned to this feature by other features' scope reviews (status `reassigned`, owner qr-gated-outputs, not in this feature's fix lists so far):

| Id | Class | Item | Evidence | State |
|---|---|---|---|---|
| cover-letter-agent-T11 | defect | "Import an application package" card unreadable on phone | `MyResumePanel.jsx:947-951` card has only a border and no explicit background. Reproduced again in qr round 8 (O3). | Open, unfixed. No v2 step covers the card. |
| cover-letter-agent-F1-12 | defect | History row of an Approved letter says "Not yet approved" | `DocumentBlocksView.jsx:31` `formatMetadataLine` (recurred in cover-letter round 2) | Open, unfixed. Not in this feature's baseline. |
| resume-rollups-B9 | requirement_gap | Journey 12 (resume-rollups) | Build-agent report, no root cause recorded | Open. Not in this feature's baseline. |

These three are this feature's to fix by assignment, but they make no step of this feature's baseline v2 fail. Whether any of them makes another feature's frozen step fail is for that feature's log.

### Spec amendments

No amendment was proposed, reviewed, approved or merged for this feature since the previous recording. `docs/spec-amendments/qr-gated-outputs/` has no commits since 94bf9a4. `docs/training/qr-gated-outputs.md` and `docs/training/baselines/qr-gated-outputs/**` are byte-for-byte unchanged by this recording.

| Id | Status | Round | What it proposed / changed | Proposed by | Reviewer | Branch / merge | Baseline |
|---|---|---|---|---|---|---|---|
| [A1](../spec-amendments/qr-gated-outputs/A1.json) | **approved** | 2 | Adds a phone route to "Where things are": World Shell > Journeys > My Resume (or Career Master). No scored step changed. | triage:qr-gated-outputs:r2 (G1) | amend:qr-gated-outputs:r2 | `release-loop/qr-gated-outputs-spec-r2` 8055be7, merged 72fb85b | v1 to **v2** |
| [A2](../spec-amendments/qr-gated-outputs/A2.json) | rejected | 2 | Import a third package version so a Draft card exists for J10.3, E.1, E.2, E.4 | triage:qr-gated-outputs:r2 (G2) | amend:qr-gated-outputs:r2 | file only | none |
| [A3](../spec-amendments/qr-gated-outputs/A3.json) | rejected | 3 | New step [B10.1]: Download .docx, check QR hyperlink target, core-property dates and authors | fix:qr-gated-outputs:r3 | amend:qr-gated-outputs:r3 | file only | none |
| [A4](../spec-amendments/qr-gated-outputs/A4.json) | rejected | 3 | New step [P.2]: MCP import, approve, resolve, revoke, resolve | fix:qr-gated-outputs:r3 | amend:qr-gated-outputs:r3 | file only | none |
| [A5](../spec-amendments/qr-gated-outputs/A5.json) | rejected | 3 | New fixture step [J10.0]: import before J10.3, E.1, E.2, E.4 | fix:qr-gated-outputs:r3 | amend:qr-gated-outputs:r3 | file only | none |
| [A6](../spec-amendments/qr-gated-outputs/A6.json) | rejected | 4 | P.1: sign in as member@test.local, go to My Resume via World Shell > Journeys | fix:qr-gated-outputs:r4 | amend:qr-gated-outputs:r4 | file only | none |
| [A7](../spec-amendments/qr-gated-outputs/A7.json) | rejected | 4 | New P.5: create pkg-v3 with sed after J9.3 and import it | fix:qr-gated-outputs:r4 | amend:qr-gated-outputs:r4 | file only | none |
| [A8](../spec-amendments/qr-gated-outputs/A8.json) | rejected | 4 | New J6.4: Download .docx, then a cli read of `docProps/core.xml` and the header rels | fix:qr-gated-outputs:r4 | amend:qr-gated-outputs:r4 | file only | none |

The reasons for rejection are unchanged from the previous recording:
- A2, A5 and A7 failed on missing fixtures or commands, or on non-deterministic E.3.
- A3, A4 and A8 failed on invalid or reused ids, no literal command, and a browser step mixed into a cli step.
- A6: P.4, J8.1 and P.5 still import as the administrator.

The fix-r7 reconciliation adds the exact expected values a resubmitted A3/A8 should carry: dc:creator `Avery Example; Jordan Sample` (fictional), created `2026-09-30T13:00:01Z`, header hyperlink Target `<BASE>/r/<SLUG1>`. **Proposed, not filed:** the round-5 validator's O1 desktop-path wording, which overlaps A6.

### Validator drift

- **Account used vs P.1.** Rounds 5 to 8 ran as member@test.local under the test-account constraint, while P.1 (unscored precondition) still names the seeded administrator. Rounds 2 to 4 ran as the administrator. All 38 steps were scored on v2 in every round, so the scores are comparable, but rounds 5 to 8 depart from the P.1 text. Open as F7-3.
- **Desktop path.** As a member there is no "Network Relationship Management" tab. Rounds 5, 7 and 8 clicked Classic Tools > My Resume directly.
- **Harness fixture outside the spec.** Rounds 2, 4, 5, 7 and 8 imported a third package version as harness setup to get the Draft card for J10.3, E.1, E.2 and E.4. Those four steps pass on setup the spec does not define. Open as F7-4.
- **Aborted attempt in round 8.** The first attempt was abandoned after the boot crash (O1) and kept as `aborted-attempt1-steps.jsonl`. It was not scored. The scored run used fresh databases.
- No validator edited the spec or a baseline. The sha256 is identical for rounds 3 to 8.

### Integration commits

| Commit | What | Code files | Notes |
|---|---|---|---|
| aa14653 | Merge `release-loop/qr-gated-outputs-build` (51b006c) | `server/db.js` (+4, My Resume tab in `admin_nav`), change spec, training spec | Feature code: d78bcda, 76b33ad |
| fc1e20b | Merge `fix-r2` (73505f4) | `MyResumePanel.jsx`, `headerContact.js` (new), `DocumentBlocksView.jsx`, `outputRendering.js`, `documentBlocksEditor.js` | T3 and T2 fixed |
| 72fb85b | Merge `spec-r2` (8055be7): A1 approved, A2 rejected, baseline v2 | training spec (+1 line), `baselines/qr-gated-outputs/v2.json` | Amendment merge |
| 238767f | Merge `fix-r3` (27e4fda) | `mcpToolRegistry.js`, `mcpToolManifest.json`, `capabilityParity.js`, `outputDocx.js` (new), `outputRendering.js`, `resumeOutputs.js`, `MyResumePanel.jsx`, `api.js` | MCP tools and .docx |
| 4620984 | Merge `fix-r4` (e7a28dd) | none (change spec notes) | |
| 13edeb2 | Process definition: bug ids qualified by feature; a failing frozen step is always the feature's to fix | `definition.json`, `.claude/workflows/release-loop.js`, `scripts/release-tracker-sync.mjs`, ledger files | Reopened this feature after round 5 |
| **8f7e111** | Merge `fix-r6` (8b73f29) | `src/components/admin/MyResumePanel.jsx` (1 line), `server/routes/auth.js` (1 line), change spec (+12) | **T1 and T5 fixed**; tested by rounds 7 and 8 |
| **c85d59b** | Merge `fix-r7` (0e38ca2) | none (change spec: Known limitations line, fix notes) | |
| faaebbf | "Resume: a passed feature whose only open bugs wait on the owner is not relaunched" | `scripts/release-loop-resume.mjs` | Commit tested by round 8 |
| 18e76d1, f2b44f7, 379d72a, 6a71095, 1db8990 | "Release loop logs: qr-gated-outputs" | none | 6a71095 actually contains only `docs/test-results/career-bound-outputs/round-4.md`. 1db8990 contains the fix-r7 reconciliation plus other features' files. qr round-6 scope, fix-r6 reconciliation, round-7 scope and round-7 result were committed inside other features' log or state commits (658bf15, 36fdd39, f2861c6, 9989faa). |

**Not merged:** `release-loop/qr-gated-outputs-fix-r1` (7d97fe8). It edited the frozen training spec directly, so it was refused under spec governance. The branch still exists.

No build or `check --all` output for 8f7e111 or c85d59b is in the workflow data. The round-7 and round-8 validators each ran a vite build successfully and `release-spec-baseline.mjs check` passed.

### Fix-round count vs maxFixRounds

`definition.json` sets `maxFixRounds: 4`. This feature had fix rounds r1 (not merged), r2, r3, r4, r6 and r7, which is **six**. The cap was passed after r4: round 5 was ended passed_with_backlog, then reopened under 13edeb2, and fix r6 (the fifth fix round) was the first to apply T1 and T5. Under `noSilentCaps`, the feature should have been recorded as not passed at the cap. The loop instead continued. This recorder reports the overrun as a process deviation for the owner. It does not change the fact that rounds 7 and 8 passed every frozen step.

### State discrepancy (reported, not resolved here)

- The state export of 2026-10-10T20:01:09Z (42fbef7, committed while the recorder worked) shows qr-gated-outputs as `status: passed`, `lastRound: 8`, `lastScore: 38/38`, `openBugs: 0`, `backlog: 14`. This agrees with the workflow verdict. The export before it (19:57:36Z) still showed `validate`, round 7, 5 open.
- **Disagreement:** the 20:01Z export marks qr-gated-outputs-F7-2 to F7-6 `verified`. The round-8 report's own table says each one is "not testable by a step" and "stays open" (pending amendments, the owner's site-sync decision, and the unreadable phone import card). Nothing was fixed or amended between the two exports. The recorder treats them as **open, not verified**, and did not edit the state file. A person should reopen them in the state, or record why they count as closed.
- The earlier collision of bare ids T1/T5 across features (reported in the previous recording) is fixed by 13edeb2. The export now carries `qr-gated-outputs-T1` / `-T5` (backlog_pre_existing, from round 5) and separate `qr-gated-outputs-T1 (rounds 2-5)` / `-T5 (rounds 2-5)` records, both `verified`, attempts 1. Two records exist for each of the same two bugs. The `backlog_pre_existing` ones are stale: the string fix is in and verified.
- F4-3 to F4-8 and F7-2 to F7-6 still have `scope: null`.

### Escalated for a business definition

The workflow data has none (`escalated: []`). The reconciliations still name these owner decisions. They are copied as written, not answered and not guessed:

- **Site sync** (fix-r4 G2, fix-r6 G2, fix-r7 F6-4): "Site sync stays an owner-run script by explicit fix-agent decision (member would gain site-wide edit); that decision needs the owner to record it." Question: does `scripts/sync-site-with-application-package.mjs` stay owner-run only, with no UI or MCP path?
- **Member account in the spec** (fix-r7 F6-5): "The owner said everything comes from the World Shell, as a member, desktop and 390px." Question: is the import step in the spec run by the member (CLI as member@test.local, or the in-app import card), so that A6 can be resubmitted?
- **Superseded version re-approval** (build reconciliation O6): "confirm with owner that moving the slug back is intended".
- **Entry point** (build reconciliation O2): is My Resume reached from the World Shell Journeys island only, or is the Classic Tools path acceptable? Rounds 7 and 8 used Classic Tools on desktop and Journeys on the phone.

### Bugs at the per-bug fix-attempt limit (needsHuman)

None (`needsHuman: []`). No qr-gated-outputs item in the export is `needs_human`. `maxFixAttemptsPerBug: 2`. For a person's reference, here is the history of the two long-running bugs, now closed:

| Round | T1 [J2.1] | T5 [E.5] |
|---|---|---|
| 1 | Seen (em dash), no triage file | not reported |
| 2 | Triaged defect; scope pre_existing (e0ea466) | Triaged defect; scope pre_existing (a875b9b) |
| fix r2, r3, r4 | Not applied (left off each fix list) | Not applied |
| 3, 4, 5 | Failed again each round | Failed again each round |
| 5 scope | pre_existing, moved to backlog (passed_with_backlog, later superseded by 13edeb2) | Same |
| 6 | Failed again (steps.jsonl; report missing). Scope: **this_feature** | Failed again. Scope: pre_existing, but blocking under 13edeb2 |
| fix r6 | **Applied** (8b73f29, `MyResumePanel.jsx:1109`), grep and build only | **Applied** (8b73f29, `auth.js:28`) |
| 7 | **Passed** desktop and 390px | **Passed** desktop and 390px |
| fix r7 | Self-walked by the fix agent, passed | Same |
| 8 | **Passed** | **Passed** |

One fix attempt each, so the limit was never reached.

### Backlog: NOT blocking this feature

Pre_existing, other_feature and process_note items. None of these makes a baseline v2 step fail.

| Id | Scope | Class | Evidence | Owner |
|---|---|---|---|---|
| Bootstrap boot race (round-8 O1; also round 3 mobile) | not triaged (no bug filed) | environment / possible product defect | 23505 `pg_type_typname_nsp_index` on `metric_definitions` (`server/db.js:122`). The first boot left the server not listening. 2 of 3 fresh boots in round 8 were fine. `/var/tmp/sbpg/agents/val-5100-1/server-desktop.log`. Related known issue: `organization_profiles` FK ordering on a fresh database (CLAUDE.md). | **not assigned**; needs a person to file it and decide |
| qr-gated-outputs-F2-5 | pre_existing | environment | Fresh-database bootstrap NOTICEs (42701/42P07) reproduce on e0ea466; not errors | not assigned |
| qr-gated-outputs-F2-7, F3-9, B9 | pre_existing | requirement_gap | In-app import was not in the request (script import). The card now exists (fix r6 reconciliation G1) but is unscored; see F7-6 | owner decision |
| qr-gated-outputs-F2-9, B8 | pre_existing | product_defect / owner_direction_conflict | The hidden Classic Tools strip at 390px predates the feature (eb62057). Phone route via Journeys (A1) | not assigned |
| qr-gated-outputs-T1, T5 (backlog_pre_existing records), F2-2, F2-3, F3-7, F3-8 | pre_existing | defect | Stale records of the em-dash strings. **Fixed by 8b73f29 and verified in rounds 7 and 8**; the records need closing in the state | state writer |
| Em dashes in `server/routes/commerce.js:30`, `server/routes/members.js:29` | not a step (fix-r6 R2, fix-r7 G5) | informational | Checkout and signup limiter messages; no spec step asserts them | not assigned (optional cleanup; grep other specs first) |
| cover-letter-agent-T11, cover-letter-agent-F1-12, resume-rollups-B9 | other_feature (reassigned **to** qr-gated-outputs) | defect / requirement_gap | See "Open items" above | qr-gated-outputs (unfixed) |
| qr-gated-outputs-F2-1, F3-3 | process_note | process | Fix agents in r2 and r3 skipped browser verification. Fix r6 did the same (F6-1, since verified) | not assigned |
| qr-gated-outputs-F7-1 | resolved (reconciliation) | environment / test_harness | Limiter exhaustion; "View" substring matching "Hide Preview"; refused shell commands | harness note for validators |

---


## Feature: resume-rollups

Title: Configurable resume rollups: KPI tiles, industry buckets, skill category groups, Career Atom rollups.

Status: **NOT PASSED.** The workflow handed this feature over as `passed_with_backlog`. The recorder does not accept that as a pass:

- Round 2 scored **30 / 32 on baseline v2** at commit 0800b1c. Two frozen steps still fail: **[J12.1]** on desktop and at 390px, and **[E.4]** on the 390px walkthrough.
- The scope review classed both causes (RR1-3, RR1-4) as `pre_existing`, so the workflow moved them to backlog.
- The process definition was amended at 13edeb2 (2026-10-10 00:47Z). The new rule in `scopeCheck.rule`: "an item that makes a frozen step of THIS feature fail stays this feature's to fix whatever its scope ... a feature never ends passed or passed_with_backlog while a baseline step fails." That commit is the current integration head. Under it, RR1-3 and RR1-4 block this feature.
- The state export (00:43:34Z) also says `triage`, 30/32, with 15 open bugs and 5 backlog. See "State discrepancy".

The feature needs a fix round for RR1-3 and RR1-4, then a round 3 on baseline v2.

- Change spec: [docs/changes/resume-rollups.md](../changes/resume-rollups.md). Training spec: [docs/training/resume-rollups.md](../training/resume-rollups.md). Baselines: [v1](../training/baselines/resume-rollups/v1.json), [v2](../training/baselines/resume-rollups/v2.json) (spec sha256 `fd8842f5...3662`).
- The recorder ran `node scripts/release-spec-baseline.mjs check --feature resume-rollups` at 13edeb2. It printed "baselines match: resume-rollups v2" (exit 0).

### Rounds

| Round | Commit tested | Baseline | Steps passed / total | Failed steps | Report |
|---|---|---|---|---|---|
| 1 | c3a71b4 | **v1** (sha256 `9cdd3c06...6bd0`) | 28 / 32 | J1.1 (mobile), J9.5, J12.1, E.4; observation MCP_GAP | [round-1](../test-results/resume-rollups/round-1.md) |
| 2, first run (superseded) | 85a4895 | v2 | 29 / 32 | J12.1, E.3, E.4; observation MCP_GAP (Career Master record writes) | overwritten; preserved in git at e798b47:`docs/test-results/resume-rollups/round-2.md` |
| 2 (scored run handed to the recorder) | 0800b1c | v2 | **30 / 32** | J12.1 (desktop + mobile), E.4 (mobile) | [round-2](../test-results/resume-rollups/round-2.md) |

**How the scores compare.** Round 1 is on v1 and round 2 is on v2. They compare only through amendment **A1**, which changed step J9.5 and nothing else. The baseline diff from v1 to v2 shows 34 comparable ids, every one "same" except J9.5. Excluding J9.5:
- Round 1: 28 of 31.
- Round 2: 30 of 31.

Round 2 fixed J1.1 (mobile). J12.1 and E.4 failed in both rounds.

#### Round 1 (baseline v1): 28 / 32

Failures:
- F1 [J1.1] MOBILE_GAP: the card footer overflows at 390px, which clips Save.
- F2 [J9.5] UI_GAP / MOBILE_GAP: the step tells the tester to type an API URL.
- F3 [J12.1] UI_GAP / MOBILE_GAP: My Resume opens the platform owner's resume, not the member's.
- F4 [E.4]: unlisted `404 GET /api/output-templates/preset-default/public`.
- Observation MCP_GAP: no rollup MCP tools.

Triage ([round-1](../triage/resume-rollups-round-1.md), integration head 1eebaf6):

| Id | Step | Class | Root cause | Outcome |
|---|---|---|---|---|
| RR1-1 | J1.1 | defect | `Footer` rows in `src/components/admin/RollupGroupingsPanel.jsx` (243-254) cannot wrap | Fixed in fix r1 (ee3dc2b, merged 07e9942); passed in round 2 on both runs |
| RR1-2 | J9.5 | spec_error | The step is a typed API URL, which interface parity v3 bans | Amendment A1 approved (baseline v2); J9.5 passed in round 2 |
| RR1-3 | J12.1 | defect | My Resume layout, preview and full-tab links omit `owner=me` | **Not in fix r1's list, never fixed**; recurred in round 2 |
| RR1-4 | E.4 | defect | `GET /api/output-templates/:id/public` returns 404 for the synthetic `preset-default` | **Not in fix r1's list, never fixed**; recurred in round 2 |
| RR1-5 | MCP_GAP | defect | No MCP tools for the rollup capabilities | Fixed in fix r1 (8 tools; `server/routes/careerMaster.js`, `server/lib/mcpToolRegistry.js`, `server/data/mcpToolManifest.json`, `server/lib/capabilityParity.js`); verified in round 2 |
| RR1-6 | (B5/B11 observation) | coverage_gap | No baseline step for the Career Rollup block picker or for the output column count | Amendments A2 (rejected) and A3 (needs_owner); still open |

Fix round 1 (branch `release-loop/resume-rollups-fix-r1`, head ee3dc2b, merged 07e9942) changed these files:
- `src/components/admin/RollupGroupingsPanel.jsx`
- `server/routes/careerMaster.js`
- `server/lib/mcpToolRegistry.js`
- `server/data/mcpToolManifest.json`
- `server/lib/capabilityParity.js`
- `docs/changes/resume-rollups.md`

The [fix-r1 reconciliation](../triage/resume-rollups-fix-r1-reconciliation.md) left two items open:
- **F1-2**: MCP_GAP for the read-only proficiency, rollup-preview and legacy rollups routes.
- **F1-3**: the browser walk of the Career Rollup block "Group by" and of an empty-Career-Master member.

It also noted that RR1-3 and RR1-4 were not addressed. The recorder confirms that: the fix-r1 diff does not touch `src/lib/resumeUrls.js`, `MyResumePanel.jsx` or `server/routes/outputTemplates.js`.

F1-2 was closed later, outside this feature's own fix branch. `proficiency_rules_read` came from 390e1ef (proficiency-live-qr round-6 fixes). `career_rollups_read` and `career_rollup_preview_read` came from 47cddd6 (platform-mcp fix r1). Round 2 confirmed all of them.

#### Round 2 (baseline v2): 30 / 32 at 0800b1c

Validator val-5600-1 ran the steps as `member@test.local` through the World Shell. Desktop (1280x900) and 390x844 touch each ran on a fresh database (`sb_rl_val_5600_1`, dropped afterwards). Score from `release-spec-baseline.mjs score`: total 32, passed 30, failed J12.1 and E.4, nothing not run or blocked.

Failures:

| Step | Surface | Expected | Observed | Evidence |
|---|---|---|---|---|
| [J12.1] UI_GAP / MOBILE_GAP | desktop + mobile | Executive Summary tiles ARR AUTOMATED, EXIT SIGNAL $250M, ENGAGEMENTS 1, INDUSTRIES 2, YEARS IN OPERATIONS 8, CERTIFIED PARTNERS 5†, EXPERT SKILLS 2†, TOTAL SKILL YEARS 21; no EMPLOYERS; footnote, capability and industry sections | The only UI route (My Resume > Preview PDF > Modern SB > full tab) opens `/output/resume?layout=modern`. That page renders the platform owner's resume with every tile as an em-dash, not the member's resume. Observation only: the typed URL with `&owner=me` showed every expectation | round-2/desktop-J12_1-output-view.png, mobile-J12_1-output-view.png, desktop-J12-OBS-owner-me-output-text.txt |
| [E.4] | mobile | Only 404 `/api/members/me/profile` and certificate errors for external hosts | The mobile run also logged `404 GET /api/output-templates/preset-default/public` when it opened the output. The desktop run was clean | round-2/mobile-E_4.png, steps.jsonl E.4 mobile row |

Evidence folder: `/var/tmp/sbpg/release-loop/resume-rollups/round-2/` (local, not committed).

Fix verification in round 2:
- **RR1-1 fixed**: the footer wraps at 390px (mobile-J3_1.png, mobile-J1_1.png).
- **RR1-2 / A1**: J9.5 passes as a UI reload check.
- **RR1-5 and F1-2 fixed**: with a token created in Connected Agents, MCP lists 94 tools. These include `resume_rollups_read`, `resume_rollup_preview`, `career_atom_rollups_read`, `career_experience_definitions_read`, `proficiency_rules_read`, `career_rollups_read` and `career_rollup_preview_read`. Results equal the API routes, invalid-preview errors match (400), and there is no MCP_GAP.
- **B3 (J7.3), B12 (J7/J8), B13 (E.1-E.3)**: pass as written.
- **B8**: the run used the member in the World Shell. P.1 still names the admin test user; see the proposed amendment.
- **B5, B11, RR1-6, F1-3**: not tested, because no baseline step covers them.

Validator observations (not scored):
- **P.1 cannot be followed as admin.** As admin, World Shell Career Master has no Proficiency & Rollups card, and Classic Tools opens the admin shell (evidence in `round-2-admin-attempt`). The terms screen of P.1 does not appear, because the fixture pre-accepts terms.
- **B10.** The owner=me output shows Strategy & Advisory "0 Expert - 2 skills", although Stakeholder alignment was set to Expert by hand. This matches the spec text. Whether the bars count the hand-set tier is an owner business rule (see below).
- **Mobile output header.** "SALTBASIN.NET - RESUME - MODERN" is clipped by the Print button. This is cosmetic and has no step.
- **Overwritten screenshots.** desktop-E_3.png and desktop-E_4.png were overwritten by a stray concurrent admin attempt. Their steps.jsonl rows are from the real run.

Triage ([round-2](../triage/resume-rollups-round-2.md), written at integration head 47f12e3; no code or spec changed):

| Id | Step | Class | Root cause | Files | Proposed fix |
|---|---|---|---|---|---|
| RR1-3 (recurred) | J12.1 | defect | My Resume builds output URLs without `owner=me`: `resumeUrls.js` `LAYOUT_URLS` / `resumeUrlFromPreset` (lines 1-20), `MyResumePanel.jsx` `LAYOUTS[].url` (~54/80/106), `presetPreviewUrl` (215), `previewUrl` state (577), full-tab link and iframe (1199-1204), print fallback (920). `Output.jsx` `useOutputOwnerSlug()` (~1148) returns '' and `resolveOwnerUserId` (`careerMaster.js` ~559-568) falls back to the default admin. Data and server are correct | `src/lib/resumeUrls.js`, `src/components/admin/MyResumePanel.jsx`, `src/components/Output.jsx`, `server/routes/careerMaster.js` | Give `resumeUrlFromPreset` an owner option that appends `owner=me` (joining with ? or &). Use it from `presetPreviewUrl`, the LAYOUTS urls, the initial state, the iframe, the full-tab link and the print fallback. Keep the LAYOUTS highlight working and leave the public site-owner link without owner. Verify at 390px. The step stands; no amendment |
| RR1-4 (recurred) | E.4 | defect | `MyResumePanel.loadPresets()` (689-695) synthesises `{id:'preset-default'}`. `Output.jsx` (~1224) fetches `/api/output-templates/preset-default/public`, and `server/routes/outputTemplates.js` 120-131 answers 404 for a missing or non-portfolioVisible row. It is console noise only. It depends on whether the member has a saved preset, so it is state-dependent, not flaky | `server/routes/outputTemplates.js`, `src/components/admin/MyResumePanel.jsx`, `src/components/Output.jsx` | Preferred: `GET /:id/public` returns `200 {template:null}` for not found and for not portfolio-visible. Alternative: skip the fetch for the synthetic id. Do not widen the E.4 allowance |

Scope review ([round-2 scope](../triage/resume-rollups-round-2-scope.md), base 2477b4a, the first parent of the first feature merge c2ccaa3):
- **RR1-3: `pre_existing`.** At the base, `resumeUrls.js` has no owner handling and My Resume builds URLs without `owner=me`, so a member already saw the admin's resume before this feature.
- **RR1-4: `pre_existing`.** At the base, `MyResumePanel.jsx:666` already synthesises `preset-default`, `Output.jsx:1265` already fetches the public template, and `outputTemplates.js:120-127` already returns 404.

Both decisions rest on a code-level reproduction at the base only. The scope agent did not run the app on a fresh database. Its write to the main checkout was refused by worktree isolation, so it wrote the report in `.claude/worktrees/wf_44548e15-70c-3/`. The recorder copied that report unchanged into `docs/triage/resume-rollups-round-2-scope.md`. A concurrent state commit (d357db8) committed it.

No fix round followed round 2.

### Spec amendments

| Id | Step | Status | What changed | Reviewer |
|---|---|---|---|---|
| [A1](../spec-amendments/resume-rollups/A1.json) | J9.5 (change) | **approved** (2026-10-09T18:00Z), produced baseline v2 (merged 0fd2110) | J9.5 changed from "open `/api/career/atom-rollups?owner=me` in the browser" to a UI reload check: the `Skills by proficiency` card still shows 'Advanced (1) · Expert (1) · Foundational (1) · Proficient (1)', and `Tools by wheel bucket` has Shown unticked. The API result is kept as evidence only | amend:resume-rollups:r1 (proposer triage:resume-rollups:r1) |
| [A2](../spec-amendments/resume-rollups/A2.json) | J9.6 (add) | **rejected** | Would have added a site-editor step: pick `Skills by proficiency` in the Career Rollup block. Rejected because it is not exact, not reachable and not deterministic (no click path, no labels, no expected preview text). The coverage gap remains; it is to be re-proposed after the path has been walked | amend:resume-rollups:r1 |
| [A3](../spec-amendments/resume-rollups/A3.json) | J12.2 (add) | **needs_owner** | Would have added a check of the Capability Confidence column count. The requirement is undefined in the change spec. The owner question is below | amend:resume-rollups:r1 |

Proposed and not yet filed or reviewed:
- **P.1 wording (spec_error).** Change "admin test user" to "member test user". Raised by the round-1 and round-2 validators and by the round-2 triage.
- **E.3 wording (spec_error, RR2-2 in the state export).** Change it to "every computed tile is `—` with a reason; a manual (user-defined) tile keeps the member's own value marked †". Raised by the superseded first run of round 2.

No spec or baseline file was changed by this recording.

### Validator drift

The same baseline (v2) scored differently across two round-2 runs:

- **Run 1** (val-5600-7, commit 85a4895): **29/32**. It failed [E.3] as AMBIGUOUS, because the manual tile Certified partners keeps `5†` while "every tile" should be `—`.
- **Run 2** (val-5600-1, commit 0800b1c): **30/32**. It passed [E.3] with the same observation. Round 1 (v1) also passed E.3 that way.

The step text is identical in both runs, so this is interpretation drift, not a product change. The round-2 triage file says "E.3 is listed as failed in the round-2 report (AMBIGUOUS, F2)", which refers to run 1's report. Run 2 overwrote that report in 891751a. The 30/32 handed to the recorder is run 2's score.

Until the E.3 wording amendment is decided, E.3's verdict depends on the validator's reading. Run 1's report is kept only in git history (e798b47).

### Integration commits

| Commit | What |
|---|---|
| c2ccaa3 | Merge `release-loop/resume-rollups-build` (2026-10-02). It adds `server/lib/resumeRollups.js`, `RollupGroupingsPanel.jsx` and `src/lib/resumeRollups.js`, plus changes to `careerMaster.js`, `Output.jsx`, `careerAtomRollups.js` and `CareerProspectBlocks.jsx`, the change spec and the training spec |
| 07e9942 | Merge `release-loop/resume-rollups-fix-r1` (head ee3dc2b): RR1-1 and RR1-5 |
| 3244ed3 | Release loop logs: resume-rollups (round 1) |
| a1d6d1d / 0fd2110 | Spec amendment A1 and baseline v2 (merge of `release-loop/resume-rollups-spec-r1`) |
| 390e1ef, 47cddd6 | Other features' fixes that closed F1-2 (MCP tools `proficiency_rules_read`, `career_rollups_read`, `career_rollup_preview_read`) |
| e798b47 | Committed round-2 run 1's report (85a4895, 29/32) |
| 891751a | Overwrote it with round-2 run 2's report (0800b1c, 30/32) |
| 13edeb2 | Process definition change: a failing frozen step blocks the feature whatever its scope |

### State discrepancy (reported, not resolved here)

The state export (`active-release.state.json`, 2026-10-10T00:43:34Z) records `resume-rollups` as `status: triage`, `lastScore 30/32`, `openBugs 15`, `backlog 5`. It disagrees with the workflow data in these ways:

- **RR1-1 and RR1-5** are `retest_failed_pending_triage` with 1 attempt each, although round 2 verified both fixed.
- **RR1-3 and RR1-4** are `backlog_pre_existing`. Under the 13edeb2 rule they should be this feature's open bugs.
- **resume-rollups-F1-2** is `open`, although round 2 found no MCP_GAP.
- **RR2-2** (E.3 spec_error) and **RR2-4** are `open` with no scope. RR2-4 is a defect: Career Master record create/update/delete has no MCP tool (`capabilityParity.js` row `career-master-records`). Both come from round-2 run 1. Neither is in the workflow data handed to the recorder, and the committed round-2 triage file contains neither.
- Bugs **B3, B5, B8, B10, B11, B12, B13** and **F1-3** are `open`. Round 2 reports:
  - B3, B8, B12 and B13 pass.
  - B10 is an owner question.
  - B5, B11 and F1-3 have no baseline step.
- **B4 and B9** are reassigned to another feature. **B14** is a process note.

A person or the state writer must reconcile these. The recorder did not edit the state file.

### Escalated for a business definition

The workflow data lists no escalations (`escalated: []`). The following owner questions were raised in the logs and remain unanswered. The recorder has not guessed answers.

1. **B10** (round-2 triage): "On the Capability Confidence bars, should a skill whose proficiency tier was set by hand to Expert count toward the 'N Expert' figure, or only skills whose tier is computed by the methodology? Today the bar for Strategy & Advisory shows '0 Expert - 2 skills' while one of those skills is hand-set to Expert."
2. **A3 / B11** (amendment review, needs_owner): "Is the number of columns in the resume output's Capability Confidence block meant to be a member-configurable setting? If yes: where does the member set it (screen and control), what values are allowed, what is the default, and how many columns should the modern resume show for the J1.2 fixture (3 capability groups)? If no: should B11 be dropped from the coverage list?"

### Bugs at the per-bug fix-attempt limit (needsHuman)

None. The workflow data has `needsHuman: []`.

RR1-3 and RR1-4 have failed in two rounds, but they were never in a fix list, so they have 0 fix attempts. Nobody has tried to fix them. The next fix round must address them; they are not stuck.

### Backlog as classed by the workflow (stated NOT blocking by the workflow; blocking under definition 13edeb2)

The workflow classed these items as `pre_existing` backlog that does not block this feature. Each one makes a frozen step of this feature fail. Under the current `scopeCheck` rule they therefore **stay this feature's to fix**, and the recorder lists them as blocking.

| Id | Step | Scope | Class | Evidence | Owner |
|---|---|---|---|---|---|
| RR1-3 | [J12.1] | pre_existing (round 2 scope review) | defect | Code at base 2477b4a: `resumeUrls.js` has no owner handling and My Resume omits `owner=me`, so a member already saw the admin's resume. Code-level reproduction only; no runtime run on a fresh database | Unassigned in the workflow data. Under 13edeb2: resume-rollups (next fix round) |
| RR1-4 | [E.4] | pre_existing (round 2 scope review) | defect | Code at base 2477b4a: `MyResumePanel.jsx:666`, `Output.jsx:1265` and `outputTemplates.js:120-127` already show the 404 path. Code-level reproduction only | Unassigned in the workflow data. Under 13edeb2: resume-rollups (next fix round) |

Other non-blocking items, as recorded in the state export:
- **B4, B9**: `other_feature`, reassigned to another feature as owner.
- **B14**: `process_note`, "Branch not rebased".
- **Mobile output header clipped by Print**: a cosmetic observation with no step and no owner.

### What has to happen for this feature to pass

1. Fix RR1-3 and RR1-4 as proposed in the round-2 triage.
2. Run a round-3 validation on baseline v2. J12.1 must pass on desktop and at 390px through the My Resume UI route, and E.4 must pass on both surfaces.
3. Have a reviewer decide the P.1 and E.3 wording amendments. Until then, E.3's verdict depends on the validator's reading.
4. The owner answers the B10 and A3 questions.
5. Reconcile the state export.

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
| release-loop-tooling round 6 validator | First full run: `preview.html?theme=dark` at 1280, J4.1 threw (heading not present after the fixed 1.5 s wait). | Immediate re-run of that config passed every step. Not reproduced. App server and preview stopped, database dropped (per round-6 report). |
| release-loop-tooling round 6 validator | Port 6302 (suggested preview port) already in use by another process | Not a failure of the feature. Preview server used 6352 instead. The other process was not touched. |
| release-loop-tooling round 6 validator | External fonts, Chart.js and three.js requests blocked by the sandbox | `external_blocked`, not counted. Nothing left behind. |
| Release recorder (this recording) | `node scripts/release-spec-baseline.mjs check release-loop-tooling` refused: "check needs --feature <key> or --all" | Read-only. Re-run as `check --feature release-loop-tooling`, which printed "baselines match: release-loop-tooling v3" (exit 0). |
| release-loop-tooling round 5 validator | First full run: config m-theme (390 touch, `?theme=dark`) J4.1 threw (heading not present after a fixed 1.5 s wait). | Re-run passed. Not reproduced. The validator stopped its server and preview and dropped its database. |
| Integration 9be77fb | No failure. The working tree had two edits the integrator did not make: `scripts/release-tracker-sync.mjs` (+18 lines, present before it started) and `docs/release-log/history.json`. | Left uncommitted and unreverted at that time. The recorder found a clean tree at 6082e1b, so they were later committed or discarded by another run sharing the checkout. Not verified which. |
| Integration 8f1c8c4 | No failure. `npm run build` regenerated `docs/release-log/history.json` (1 line). | Left uncommitted at that time. Clean at 6082e1b (see above). |
| Concurrent writers | Another process committed "Release loop state" commits (27668ef, 24636dc, 6082e1b) to this checkout while the recorder worked. 6082e1b also committed `docs/test-results/release-loop-tooling/round-5.md`. | Informational. The recorder built on 6082e1b. |
| Concurrent writers (this recording) | "Release loop state" and "Release update" commits (ed234db, c1ef03b, d2beb30) landed after 0800b1c. `docs/test-results/release-loop-tooling/round-6.md` was untracked when the recorder started. | Informational. While the recorder worked, another process committed 39ffdd1 ("Release loop state ... 00:20Z"), which also committed round-6.md. The recorder's log commit sits on top of 39ffdd1 and contains only this log. |
| qr-gated-outputs build | `createdb sb_rl_bld_1` failed because the database already existed | Dropped and recreated fresh ([build reconciliation](../triage/qr-gated-outputs-build-reconciliation.md) R1) |
| qr-gated-outputs build | The sandbox refused compound source/git/sed commands | Nothing ran, so no state changed; split into plain commands (R2) |
| qr-gated-outputs build | Login rate limit (10 per 15 min) hit; server restarted to clear it | By design; reuse the session (R3) |
| qr-gated-outputs build | Playwright APIRequestContext got 401 on QR routes (Secure cookie over http) | Harness only; validators use in-page fetch (R5) |
| qr-gated-outputs fix r1 | 7d97fe8 edited the frozen training spec directly (97 lines) | **Not merged.** Branch `release-loop/qr-gated-outputs-fix-r1` still exists. Its import UI and in-world island were never re-applied. |
| qr-gated-outputs fix r2 | `npm run build` exited non-zero (postbuild needed DATABASE_URL because Codex logs were present) | The vite build itself passed; the reconciler's re-run passed ([fix-r2 reconciliation](../triage/qr-gated-outputs-fix-r2-reconciliation.md) R2). Postbuild depending on a database is a release-loop-tooling issue. |
| qr-gated-outputs fix r2 reconciler | Booting against a scratch database was refused by the sandbox (shell construct) | Scratch database created and dropped; boot not done. R3 ("column name collision") was later found to be harmless NOTICEs in the fix-r3 reconciliation. |
| qr-gated-outputs fix r2, r3 | Fix agents skipped browser verification (F2-1, F3-3) | Process notes; covered by the next validation round |
| qr-gated-outputs fix r2, r3, r4 | T1 and T5 were in the triage fix list each round but never applied | **Partial**: both are still failing at c020576. See "Bugs at the per-bug fix-attempt limit" in the qr-gated-outputs section. |
| qr-gated-outputs fix r3 | Compound shell lines refused by the worktree guard | Nothing ran; re-run as separate calls |
| qr-gated-outputs fix r4 | Compound commands and `source` refused; the first server stop killed only the wrapper, so DROP DATABASE was blocked until the real node PID was killed | DROP then succeeded ([fix-r4 reconciliation](../triage/qr-gated-outputs-fix-r4-reconciliation.md) R1, R2) |
| qr-gated-outputs round 2 validator | One desktop J5.1 line failed on a case-sensitive harness match; also 276 log lines from an aborted attempt on port 8102 | Superseded line moved aside; re-run passed. Server stopped, database `sb_rl_val_5100_1` dropped |
| qr-gated-outputs round 3 validator | First desktop pass logged J7.1 as failing (harness checked the toast too late); first mobile pass crashed at boot (duplicate-key error, bootstrap racing seed after 8 s) | Both passes re-run in full on fresh databases; superseded logs kept under `/var/tmp/sbpg/agents/val-5100-7/superseded/`. Database `sb_rl_val_5100_7` dropped |
| qr-gated-outputs rounds 1 to 5 | External fonts and three.js blocked by the sandbox; `net::ERR_ABORTED` on PDF download | `external_blocked` and download behaviour; not counted |
| qr-gated-outputs round 6 validator | The test-result report `docs/test-results/qr-gated-outputs/round-6.md` was never written (not in the checkout, any worktree or any git ref) | **Partial.** The 36/38 result survives only in the state history (285b9f4) and the local `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-6/steps.jsonl` (plus `steps-attempt1-backup.jsonl`, `steps-all-attempts.jsonl`, i.e. at least one repeated attempt). The commit tested is not recorded. The recorder did not create a report. |
| qr-gated-outputs fix r6 | Fix agent checked by grep and build only, no browser walk (F6-1) | Closed by round 7 (verified). |
| qr-gated-outputs fix r7 | Validator-side refused shell commands, sign-in limiter exhaustion, and a "View" button substring match on "Hide Preview" (F7-1) | Resolved in the fix-r7 reconciliation. Nothing partially applied. |
| qr-gated-outputs round 8 validator | First server boot on the first fresh database crashed (PostgresError 23505, `pg_type_typname_nsp_index`, `metric_definitions`), so the server was not listening (ECONNREFUSED) | The attempt was aborted, its steps were kept as `aborted-attempt1-steps.jsonl` (not scored) and it was re-run on fresh databases. Two later boots were fine. Server stopped by PID file, database `sb_rl_val_5100_1` dropped. **Not filed as a bug.** |
| qr-gated-outputs rounds 6 to 8 | External fonts and three.js blocked by the sandbox; `net::ERR_ABORTED` on the PDF download | `external_blocked` and download behaviour; not counted |
| qr-gated-outputs log commits | 6a71095 "Release loop logs: qr-gated-outputs" holds only a career-bound-outputs file. qr round-6 scope, fix-r6 reconciliation, round-7 scope and the round-7 result were committed inside other features' commits | Informational. Every file is now in the checkout and linked below. |
| qr-gated-outputs loop | Six fix rounds (r1 to r4, r6, r7) against `maxFixRounds: 4` | Process deviation, reported to the owner. Not a product failure. |
| Release recorder (this recording, qr) | None failed. The `release-spec-baseline.mjs check --feature qr-gated-outputs` run at 647fff8 exited 0 | Read-only. The recorder started no server or database. |
| qr-gated-outputs round 5 triage | The triage report was written inside worktree `.claude/worktrees/wf_20655f2f-37c-2/`, not the main checkout | Recorder copied it unchanged into `docs/triage/qr-gated-outputs-round-5.md` |
| Bug-state export (c020576) | Bare ids T1/T5 collide across five features; qr-gated-outputs T1/T5 carry other features' evidence and scope | Not fixed by the recorder. A person or the state writer must namespace them. |
| resume-rollups round 2 scope review | Write of `docs/triage/resume-rollups-round-2-scope.md` to the main checkout refused by worktree isolation | Report left in `.claude/worktrees/wf_44548e15-70c-3/docs/triage/`. Recorder copied it unchanged into `docs/triage/resume-rollups-round-2-scope.md`. A concurrent "Release loop state" commit (d357db8) committed that copy before the recorder's own commit |
| resume-rollups round 2 scope review | Base reproduction for RR1-3 and RR1-4 was code-level only; the app was not run on a fresh base database | **Partial evidence.** Both `pre_existing` decisions rest on code inspection at 2477b4a |
| resume-rollups round 2 validator (run 2) | A stray concurrent admin attempt overwrote `desktop-E_3.png` and `desktop-E_4.png` | Screenshots lost for those two steps. The steps.jsonl rows are from the real run, and the stray rows were moved to `round-2-admin-attempt/`. Server stopped, database `sb_rl_val_5600_1` dropped |
| resume-rollups round 2 validator (run 1, 85a4895) | Four wrong automation checks (P.1, J7.3, J4.1, J8.1); port 5714 already in use by another validator | Re-checked, all pass. Original lines in `steps.superseded.jsonl`. Second server moved to 6914. Databases `sb_rl_val_5600_7` and `sb_rl_val_5600_7b` dropped |
| resume-rollups round 2 (both runs) | The run 2 report overwrote run 1's report at the same path (891751a over e798b47) | Run 1's 29/32 result and its E.3 failure survive only in git history. See "Validator drift" |
| resume-rollups fix r1 | RR1-3 and RR1-4 were in the round-1 triage but not in the fix list; `check-interface-parity --strict` not run by the fix agent | **Partial**: RR1-3 and RR1-4 are still failing at 0800b1c. The reconciler ran `--strict`: it failed with 28 of 56 capabilities having MCP gaps, mostly other features |
| resume-rollups round 1 validator | External fonts blocked (`ERR_CERT_AUTHORITY_INVALID` / `ERR_TUNNEL_CONNECTION_FAILED`) | `external_blocked`, not counted. Server stopped, database dropped |
| resume-rollups state export | RR1-1 and RR1-5 marked `retest_failed_pending_triage` although they are verified fixed; RR2-2 and RR2-4 have no triage file in the main checkout | Not fixed by the recorder; see the resume-rollups "State discrepancy" |
| Process definition (concurrent) | 13edeb2 changed `scopeCheck.rule` at 00:47Z, after the workflow had given its verdict for resume-rollups | The recorder applied the current rule. The workflow verdict is reported but not accepted |
| Earlier recording (17a67e9) | A recursive `grep -r` timed out and was replaced by `git grep` | Read-only; nothing written |
| Earlier release (proficiency-live-qr) | 11 failed or refused commands | See the [earlier release log](2026-10-02-proficiency-live-qr.md) |

The recorder started no server or database and has nothing to clean up. Nothing was pushed. One recorder command, a `git grep` over 200 revisions searching for RR2-2, ran past the 120 s foreground limit. It was moved to the background, completed later with exit 0, and wrote nothing. The same search was repeated with `git log -S` (13edeb2, ed234db, d3a2622).

## Log index

- release-loop-tooling test results: [round-1](../test-results/release-loop-tooling/round-1.md), [round-2](../test-results/release-loop-tooling/round-2.md), [round-3](../test-results/release-loop-tooling/round-3.md), [round-4](../test-results/release-loop-tooling/round-4.md), [round-5](../test-results/release-loop-tooling/round-5.md), [round-6](../test-results/release-loop-tooling/round-6.md). Step logs and screenshots are in `/var/tmp/sbpg/release-loop/release-loop-tooling/round-N/`, local and not committed.
- release-loop-tooling triage: [round-1 scope](../triage/release-loop-tooling-round-1-scope.md), [fix-r1 reconciliation](../triage/release-loop-tooling-fix-r1-reconciliation.md), [round-2 scope](../triage/release-loop-tooling-round-2-scope.md), [round-3](../triage/release-loop-tooling-round-3.md), [round-3 scope](../triage/release-loop-tooling-round-3-scope.md). The round-4 and round-4 scope files are **missing**.
- release-loop-tooling amendments: [A1](../spec-amendments/release-loop-tooling/A1.json), [A2](../spec-amendments/release-loop-tooling/A2.json)
- proficiency-live-qr test results: [round-1](../test-results/proficiency-live-qr/round-1.md) to [round-5](../test-results/proficiency-live-qr/round-5.md) (earlier release). Triage: [round-1](../triage/proficiency-live-qr-round-1.md), [round-2](../triage/proficiency-live-qr-round-2.md), [round-3](../triage/proficiency-live-qr-round-3.md); reconciliations [r2](../triage/proficiency-live-qr-fix-r2-reconciliation.md), [r3](../triage/proficiency-live-qr-fix-r3-reconciliation.md), [r4](../triage/proficiency-live-qr-fix-r4-reconciliation.md)
- Cross-feature: [scope review](../triage/scope-review.md), [bug state](active-release.state.json) (exported 2026-10-10T20:01:09Z at this recording), [release tracker](release-tracker.md)
- qr-gated-outputs test results: [round-1](../test-results/qr-gated-outputs/round-1.md), [round-2](../test-results/qr-gated-outputs/round-2.md), [round-3](../test-results/qr-gated-outputs/round-3.md), [round-4](../test-results/qr-gated-outputs/round-4.md), [round-5](../test-results/qr-gated-outputs/round-5.md), round-6 **missing** (local steps.jsonl only), [round-7](../test-results/qr-gated-outputs/round-7.md), [round-8](../test-results/qr-gated-outputs/round-8.md). Step logs and screenshots are in `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-N/`, local and not committed.
- qr-gated-outputs triage: [build reconciliation](../triage/qr-gated-outputs-build-reconciliation.md), [round-2](../triage/qr-gated-outputs-round-2.md), [round-2 scope](../triage/qr-gated-outputs-round-2-scope.md), [fix-r2 reconciliation](../triage/qr-gated-outputs-fix-r2-reconciliation.md), [round-3](../triage/qr-gated-outputs-round-3.md), [round-3 scope](../triage/qr-gated-outputs-round-3-scope.md), [fix-r3 reconciliation](../triage/qr-gated-outputs-fix-r3-reconciliation.md), [round-4](../triage/qr-gated-outputs-round-4.md), [round-4 scope](../triage/qr-gated-outputs-round-4-scope.md), [fix-r4 reconciliation](../triage/qr-gated-outputs-fix-r4-reconciliation.md), [round-5](../triage/qr-gated-outputs-round-5.md), [round-5 scope](../triage/qr-gated-outputs-round-5-scope.md), [round-6 scope](../triage/qr-gated-outputs-round-6-scope.md), [fix-r6 reconciliation](../triage/qr-gated-outputs-fix-r6-reconciliation.md), [round-7 scope](../triage/qr-gated-outputs-round-7-scope.md), [fix-r7 reconciliation](../triage/qr-gated-outputs-fix-r7-reconciliation.md). No round-1 or round-6 triage file exists. Rounds 7 and 8 failed nothing, so they have no triage.
- qr-gated-outputs amendments: [A1](../spec-amendments/qr-gated-outputs/A1.json) (approved), [A2](../spec-amendments/qr-gated-outputs/A2.json) to [A8](../spec-amendments/qr-gated-outputs/A8.json) (rejected)
- resume-rollups test results: [round-1](../test-results/resume-rollups/round-1.md), [round-2](../test-results/resume-rollups/round-2.md) (run 2; run 1 is in git at e798b47). Step logs and screenshots are in `/var/tmp/sbpg/release-loop/resume-rollups/round-N/`, local and not committed.
- resume-rollups triage: [round-1](../triage/resume-rollups-round-1.md), [fix-r1 reconciliation](../triage/resume-rollups-fix-r1-reconciliation.md), [round-2](../triage/resume-rollups-round-2.md), [round-2 scope](../triage/resume-rollups-round-2-scope.md). No round-1 scope file exists.
- resume-rollups amendments: [A1](../spec-amendments/resume-rollups/A1.json) (approved), [A2](../spec-amendments/resume-rollups/A2.json) (rejected), [A3](../spec-amendments/resume-rollups/A3.json) (needs_owner)
- Sweep: none run for this release.
