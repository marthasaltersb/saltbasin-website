# Salt Basin application packages release — status updates

Release **0.2.0** (`2026-10-02-application-packages`), built on branch `claude/zealous-meitner-5tuft5`. Each update is numbered `0.2.0-u<n>`, pinned to the commit it describes, and compared with the update before it. Newest first.

## 0.2.0-u9 — 2026-10-09 16:43 UTC

Commit [`5980892`](https://github.com/marthasaltersb/saltbasin-website/commit/598089293c274c54d7bb435ed8f2a4de412828fc) · compared with 0.2.0-u8

**Spec amendments working: 10 reviewed, 2 questions for the owner**

Validators now score every round against a frozen baseline. Reviewers have decided 10 amendments: 6 approved, 3 rejected (the step stands), 2 waiting on the owner (output-version-history A2 and A4). platform-mcp and in-app-release-loop are built, merged and frozen at v1. release-intelligence round 1 scored 1/54: every step passes on desktop, but at phone width the panel is wider than its card, so 52 steps fail the layout rule; a fix is next. qr-gated-outputs 33/38, output-version-history 33/37, chart-gallery 16/19, no-silent-failures 18/28 (fixing).

**Compared with the previous update**

- Features passed: 1 (no change) of 17
- Open bugs caused by this work: 60 → **107** (+47) — new failures found in testing
- Bugs verified fixed: 18 (no change)
- Backlog (not this work): 39 → **48** (+9)
- Waiting on a person: 0 → **3** (+3)
- Agents running: 15 → 15

**Feature changes**

- qr-gated-outputs: test round 1 45/48 → round 2 **33/38**
- no-silent-failures: test not run → round 1 **18/28**; in browser testing → **reviewing failed commands**
- chart-gallery: test round 1 17/20 → round 2 **16/19**
- output-version-history: test not run → round 1 **33/37**
- resume-rollups: test not run → round 1 **28/32**; in browser testing → **failures being triaged**
- release-intelligence: test not run → round 1 **1/54**; in browser testing → **failing**
- in-app-release-loop: being built → **in browser testing**
- session-mapping: agent stopped → **being built**
- platform-mcp: being built → **in browser testing**

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | in browser testing | round 5: 29/30 |
| world-shell-navigation | in browser testing | round 1: 45/48 |
| career-bound-outputs | in browser testing | round 2: 54/56 |
| qr-gated-outputs | in browser testing | round 2: 33/38 |
| no-silent-failures | reviewing failed commands | round 1: 18/28 |
| release-loop-tooling | passed | round 5: 30/30 |
| chart-gallery | in browser testing | round 2: 16/19 |
| output-version-history | in browser testing | round 1: 33/37 |
| resume-rollups | failures being triaged | round 1: 28/32 |
| release-intelligence | failing | round 1: 1/54 |
| cover-letter-agent | in browser testing | not tested yet |
| in-app-release-loop | in browser testing | not tested yet |
| session-mapping | being built | not tested yet |
| world-shell-layers | being built | not tested yet |
| live-release-tracker | being built | not tested yet |
| render-bindings | being built | not tested yet |
| platform-mcp | in browser testing | not tested yet |

</details>

## 0.2.0-u8 — 2026-10-09 16:17 UTC

Commit [`e9f4a01`](https://github.com/marthasaltersb/saltbasin-website/commit/e9f4a0100abcbec155615c1bf83101fa7242303a) · compared with 0.2.0-u7

**release-loop-tooling passed 30/30 on frozen baseline v3**

First feature through the new spec governance. Round 4 tested baseline v2 (amendment A1, decided by the reviewer before the round) and failed one step on the phone: the step asked for a label that is hidden by design at 390px. Triage proposed amendment A2, the reviewer approved it against the checklist, and round 5 passed every step on baseline v3. The step count stayed at 30 across both rounds. The platform MCP gap is recorded against the platform-mcp feature.

**Compared with the previous update**

- Features passed: 0 → **1** (+1) of 17
- Open bugs caused by this work: 62 → **60** (-2)
- Bugs verified fixed: 15 → **18** (+3)
- Backlog (not this work): 38 → **39** (+1)
- Waiting on a person: 0 (no change)
- Agents running: 0 → 15

**Feature changes**

- proficiency-live-qr: failing → **in browser testing**
- world-shell-navigation: fixed, awaiting re-test → **in browser testing**
- career-bound-outputs: fixed, awaiting re-test → **in browser testing**
- qr-gated-outputs: fixed, awaiting re-test → **in browser testing**
- no-silent-failures: agent stopped → **in browser testing**
- release-loop-tooling: test round 3 104/126 → round 5 **30/30**; fixed, awaiting re-test → **passed**
- chart-gallery: fixed, awaiting re-test → **in browser testing**
- release-intelligence: agent stopped → **in browser testing**
- output-version-history: agent stopped → **in browser testing**
- resume-rollups: agent stopped → **in browser testing**
- cover-letter-agent: agent stopped → **in browser testing**
- in-app-release-loop: agent stopped → **being built**
- world-shell-layers: agent stopped → **being built**
- live-release-tracker: agent stopped → **being built**
- render-bindings: agent stopped → **being built**
- platform-mcp: agent stopped → **being built**

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | in browser testing | round 5: 29/30 |
| world-shell-navigation | in browser testing | round 1: 45/48 |
| career-bound-outputs | in browser testing | round 2: 54/56 |
| qr-gated-outputs | in browser testing | round 1: 45/48 |
| no-silent-failures | in browser testing | not tested yet |
| release-loop-tooling | passed | round 5: 30/30 |
| chart-gallery | in browser testing | round 1: 17/20 |
| release-intelligence | in browser testing | not tested yet |
| output-version-history | in browser testing | not tested yet |
| resume-rollups | in browser testing | not tested yet |
| cover-letter-agent | in browser testing | not tested yet |
| session-mapping | agent stopped | not tested yet |
| in-app-release-loop | being built | not tested yet |
| world-shell-layers | being built | not tested yet |
| live-release-tracker | being built | not tested yet |
| render-bindings | being built | not tested yet |
| platform-mcp | being built | not tested yet |

</details>

## 0.2.0-u7 — 2026-10-09 12:09 UTC

Commit [`4239e1d`](https://github.com/marthasaltersb/saltbasin-website/commit/4239e1d45f684fc6be79e430bcdef6023425b7f4) · compared with 0.2.0-u6

**Release governance: every retry now tests the same frozen steps**

Retries were testing different step sets (one feature's total went 31 → 29 → 33 → 30) because fix agents could edit training specs between rounds. Now each spec is frozen as a versioned baseline with stable step ids; validators score only against it under fixed test constraints; step changes go through a reviewed amendment. Eleven specs frozen at v1. Fix round 3's direct spec edits are filed as amendment A1, and its product changes are merged. No test rounds ran in this update: agents resume after the usage reset.

**Compared with the previous update**

- Features passed: 0 (no change) of 17
- Open bugs caused by this work: 60 → **62** (+2) — new failures found in testing
- Bugs verified fixed: 15 (no change)
- Backlog (not this work): 38 (no change)
- Waiting on a person: 0 (no change)
- Agents running: 16 → 0

**Feature changes**

- proficiency-live-qr: in browser testing → **failing**
- world-shell-navigation: in browser testing → **fixed, awaiting re-test**
- career-bound-outputs: in browser testing → **fixed, awaiting re-test**
- qr-gated-outputs: in browser testing → **fixed, awaiting re-test**
- no-silent-failures: in browser testing → **agent stopped**
- release-loop-tooling: test round 2 108/108 → round 3 **104/126**; in browser testing → **fixed, awaiting re-test**
- chart-gallery: in browser testing → **fixed, awaiting re-test**
- release-intelligence: in browser testing → **agent stopped**
- output-version-history: in browser testing → **agent stopped**
- resume-rollups: in browser testing → **agent stopped**
- cover-letter-agent: in browser testing → **agent stopped**
- in-app-release-loop: being built → **agent stopped**
- world-shell-layers: being built → **agent stopped**
- live-release-tracker: being built → **agent stopped**
- render-bindings: being built → **agent stopped**
- platform-mcp: being built → **agent stopped**

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | failing | round 5: 29/30 |
| world-shell-navigation | fixed, awaiting re-test | round 1: 45/48 |
| career-bound-outputs | fixed, awaiting re-test | round 2: 54/56 |
| qr-gated-outputs | fixed, awaiting re-test | round 1: 45/48 |
| no-silent-failures | agent stopped | not tested yet |
| release-loop-tooling | fixed, awaiting re-test | round 3: 104/126 |
| chart-gallery | fixed, awaiting re-test | round 1: 17/20 |
| release-intelligence | agent stopped | not tested yet |
| output-version-history | agent stopped | not tested yet |
| resume-rollups | agent stopped | not tested yet |
| cover-letter-agent | agent stopped | not tested yet |
| in-app-release-loop | agent stopped | not tested yet |
| session-mapping | agent stopped | not tested yet |
| world-shell-layers | agent stopped | not tested yet |
| live-release-tracker | agent stopped | not tested yet |
| render-bindings | agent stopped | not tested yet |
| platform-mcp | agent stopped | not tested yet |

</details>

## 0.2.0-u6 — 2026-10-09 10:56 UTC

Commit [`46430ed`](https://github.com/marthasaltersb/saltbasin-website/commit/46430edf5bbb81555f53a41793643789a0da635e) · compared with 0.2.0-u5

**Release rule: every capability must work by point-and-click, on a phone, via API and via MCP**

Owner direction: a training guide that can't be walked by point-and-click and on a phone fails. The release process (v3) now requires every capability to work on the website — point-and-click on desktop and as a full 390px phone walkthrough, with no typed URLs, API calls or scripts standing in for a step — through the API, and through an MCP tool calling the same server function with the same permissions. Test agents walk every journey on both surfaces and check the MCP tool; gaps fail as UI_GAP, MOBILE_GAP or MCP_GAP. A new feature, platform-mcp, is building the MCP server (user-created, revocable tokens; same permission checks as the API), the tool registry and a capability parity map with a check. Runs already in progress keep their current rules until their next relaunch.

**Compared with the previous update**

- Features passed: 0 (no change) of 17
- Open bugs caused by this work: 60 (no change)
- Bugs verified fixed: 15 (no change)
- Backlog (not this work): 38 (no change)
- Waiting on a person: 0 (no change)
- Agents running: 15 → 16

**Feature changes**

- platform-mcp: new in this update (being built)

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | in browser testing | round 5: 29/30 |
| world-shell-navigation | in browser testing | round 1: 45/48 |
| career-bound-outputs | in browser testing | round 2: 54/56 |
| qr-gated-outputs | in browser testing | round 1: 45/48 |
| no-silent-failures | in browser testing | not tested yet |
| release-loop-tooling | in browser testing | round 2: 108/108 |
| chart-gallery | in browser testing | round 1: 17/20 |
| release-intelligence | in browser testing | not tested yet |
| output-version-history | in browser testing | not tested yet |
| resume-rollups | in browser testing | not tested yet |
| session-mapping | agent stopped | not tested yet |
| cover-letter-agent | in browser testing | not tested yet |
| in-app-release-loop | being built | not tested yet |
| world-shell-layers | being built | not tested yet |
| live-release-tracker | being built | not tested yet |
| render-bindings | being built | not tested yet |
| platform-mcp | being built | not tested yet |

</details>

## 0.2.0-u5 — 2026-10-09 10:52 UTC

Commit [`114c1a5`](https://github.com/marthasaltersb/saltbasin-website/commit/114c1a591f05b54b0885b4e94a9089b8c738e34b) · compared with 0.2.0-u4

**Relaunched after the usage limit; render bindings designed**

At 10:49 UTC all 13 feature runs relaunched after the usage limit reset, building on the work saved from stopped agents. Two new platform features joined the release: live-release-tracker (the tracker inside the Salt Basin site, real time) and render-bindings (every rendering is a view mapped to source data — platform tables, connectors, calculations or manual entry — updated live or through approval with impact analysis; design in docs/changes/render-bindings.md, no new tables). The tracker's World view now draws through explicit mappings, shows a Data map per crystal, and renders fixes awaiting re-test as pending ghosts with the list of what changes when they are approved.

**Compared with the previous update**

- Features passed: 0 (no change) of 16
- Open bugs caused by this work: 57 → **60** (+3) — new failures found in testing
- Bugs verified fixed: 18 → **15** (-3)
- Backlog (not this work): 38 (no change)
- Waiting on a person: 0 (no change)
- Agents running: 0 → 15

**Feature changes**

- proficiency-live-qr: failing → **in browser testing**
- world-shell-navigation: fixed, awaiting re-test → **in browser testing**
- career-bound-outputs: fixed, awaiting re-test → **in browser testing**
- qr-gated-outputs: fixed, awaiting re-test → **in browser testing**
- no-silent-failures: agent stopped → **in browser testing**
- release-loop-tooling: fixed, awaiting re-test → **in browser testing**
- chart-gallery: test round 2 21/24 → round 1 **17/20**; fixed, awaiting re-test → **in browser testing**
- release-intelligence: test round 1 69/74 → not run; failing → **in browser testing**
- output-version-history: agent stopped → **in browser testing**
- resume-rollups: agent stopped → **in browser testing**
- cover-letter-agent: agent stopped → **in browser testing**
- in-app-release-loop: agent stopped → **being built**
- world-shell-layers: agent stopped → **being built**
- live-release-tracker: new in this update (being built)
- render-bindings: new in this update (being built)

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | in browser testing | round 5: 29/30 |
| world-shell-navigation | in browser testing | round 1: 45/48 |
| career-bound-outputs | in browser testing | round 2: 54/56 |
| qr-gated-outputs | in browser testing | round 1: 45/48 |
| no-silent-failures | in browser testing | not tested yet |
| release-loop-tooling | in browser testing | round 2: 108/108 |
| chart-gallery | in browser testing | round 1: 17/20 |
| release-intelligence | in browser testing | not tested yet |
| output-version-history | in browser testing | not tested yet |
| resume-rollups | in browser testing | not tested yet |
| session-mapping | agent stopped | not tested yet |
| cover-letter-agent | in browser testing | not tested yet |
| in-app-release-loop | being built | not tested yet |
| world-shell-layers | being built | not tested yet |
| live-release-tracker | being built | not tested yet |
| render-bindings | being built | not tested yet |

</details>

## 0.2.0-u4 — 2026-10-09 06:19 UTC

Commit [`44faefc`](https://github.com/marthasaltersb/saltbasin-website/commit/44faefc45fa079235cee6a9df6d42142f7763936) · compared with 0.2.0-u3

**Runs paused at the usage limit; work saved; tracker now shows trends**

All test runs stopped at the account's usage limit around 06:10 UTC; it resets at 10:40 UTC and the relaunch is scheduled for 10:43. Before stopping: release-loop tooling's scope check confirmed 3 of its 4 remaining items as its own (1 moved to backlog) and a fix round began; chart gallery's 3 fixes passed the review and were merged (not yet re-tested); release intelligence's first test (69/74) was not yet triaged. All unfinished agent work was saved to branches for the relaunch. The tracker overview now charts the release over time — bugs, test scores or features passed, by feature, with a slider to replay any earlier moment.

**Compared with the previous update**

- Features passed: 0 (no change) of 14
- Open bugs caused by this work: 55 → **57** (+2) — new failures found in testing
- Bugs verified fixed: 18 (no change)
- Backlog (not this work): 37 → **38** (+1)
- Waiting on a person: 0 (no change)
- Agents running: 13 → 0

**Feature changes**

- proficiency-live-qr: in browser testing → **failing**
- world-shell-navigation: in browser testing → **fixed, awaiting re-test**
- career-bound-outputs: in browser testing → **fixed, awaiting re-test**
- qr-gated-outputs: in browser testing → **fixed, awaiting re-test**
- no-silent-failures: in browser testing → **agent stopped**
- release-loop-tooling: scope check → **fixed, awaiting re-test**
- output-version-history: in browser testing → **agent stopped**
- resume-rollups: in browser testing → **agent stopped**
- chart-gallery: reviewing failed commands → **fixed, awaiting re-test**
- cover-letter-agent: in browser testing → **agent stopped**
- in-app-release-loop: being built → **agent stopped**
- session-mapping: being built → **agent stopped**
- world-shell-layers: being built → **agent stopped**

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | failing | round 5: 29/30 |
| world-shell-navigation | fixed, awaiting re-test | round 1: 45/48 |
| career-bound-outputs | fixed, awaiting re-test | round 2: 54/56 |
| qr-gated-outputs | fixed, awaiting re-test | round 1: 45/48 |
| no-silent-failures | agent stopped | not tested yet |
| release-loop-tooling | fixed, awaiting re-test | round 2: 108/108 |
| output-version-history | agent stopped | not tested yet |
| resume-rollups | agent stopped | not tested yet |
| chart-gallery | fixed, awaiting re-test | round 2: 21/24 |
| release-intelligence | failing | round 1: 69/74 |
| cover-letter-agent | agent stopped | not tested yet |
| in-app-release-loop | agent stopped | not tested yet |
| session-mapping | agent stopped | not tested yet |
| world-shell-layers | agent stopped | not tested yet |

</details>

## 0.2.0-u3 — 2026-10-09 06:09 UTC

Commit [`d74be28`](https://github.com/marthasaltersb/saltbasin-website/commit/d74be28cdfbf069dd19088ede91695d4f9e45ff8) · compared with 0.2.0-u2

**Release-loop tooling passes every browser step; chart-gallery fixes in**

Release-loop tooling: round 2 re-test passed all 108 steps, so the round 1 fixes worked. It is not marked passed yet: 4 commands that failed during its fix round are still unresolved, and the release rules don't allow 'done' with unreconciled failures; the scope check is deciding whose they are. Chart gallery: the fix agent fixed all 3 round 2 bugs; 5 commands it reported as failed are being reviewed before its fixes are merged and re-tested. 13 agents are working.

**Compared with the previous update**

- Features passed: 0 (no change) of 14
- Open bugs caused by this work: 60 → **55** (-5)
- Bugs verified fixed: 13 → **18** (+5)
- Backlog (not this work): 37 (no change)
- Waiting on a person: 0 (no change)
- Agents running: 13 → 13

**Feature changes**

- release-loop-tooling: test round 1 24/35 → round 2 **108/108**; in browser testing → **scope check**
- chart-gallery: being fixed → **reviewing failed commands**

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | in browser testing | round 5: 29/30 |
| world-shell-navigation | in browser testing | round 1: 45/48 |
| career-bound-outputs | in browser testing | round 2: 54/56 |
| qr-gated-outputs | in browser testing | round 1: 45/48 |
| no-silent-failures | in browser testing | not tested yet |
| release-loop-tooling | scope check | round 2: 108/108 |
| output-version-history | in browser testing | not tested yet |
| resume-rollups | in browser testing | not tested yet |
| chart-gallery | reviewing failed commands | round 2: 21/24 |
| release-intelligence | failing | round 1: 69/74 |
| cover-letter-agent | in browser testing | not tested yet |
| in-app-release-loop | being built | not tested yet |
| session-mapping | being built | not tested yet |
| world-shell-layers | being built | not tested yet |

</details>

## 0.2.0-u2 — 2026-10-09 06:04 UTC

Commit [`e84a8ed`](https://github.com/marthasaltersb/saltbasin-website/commit/e84a8ed451309409d13c86b26c87162ae647904e) · compared with 0.2.0-u1

**First test results since the relaunch; first fixes merged**

Release-loop tooling: first browser test 24/35 steps; triage found 5 bugs, the scope check confirmed all 5 are this feature's, a fix agent fixed 5 and could not fix 1, and the fixes are merged — its round 2 re-test is next. A review of the fix agent's failed commands left 4 unresolved; they stay open as bugs. Chart gallery: round 2 passed 21/24 (round 1 was 17/20); its 3 failures are confirmed as its own and are being fixed. Release intelligence: first test 69/74; its 5 failures are in triage. Proficiency: its run had ended without testing because the round limit was counted from round 1 for a resumed feature; that is fixed and it is re-testing the current code. Three proficiency design questions still wait on the owner.

**Compared with the previous update**

- Features passed: 0 (no change) of 14
- Open bugs caused by this work: 53 → **60** (+7) — new failures found in testing
- Bugs verified fixed: 13 (no change)
- Backlog (not this work): 37 (no change)
- Waiting on a person: 0 (no change)
- Agents running: — → 13

**Feature changes**

- proficiency-live-qr: failing → **in browser testing**
- release-loop-tooling: test not run → round 1 **24/35**
- chart-gallery: test round 1 17/20 → round 2 **21/24**; in browser testing → **being fixed**
- release-intelligence: test not run → round 1 **69/74**; in browser testing → **failing**
- session-mapping: agent stopped → **being built**

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | in browser testing | round 5: 29/30 |
| world-shell-navigation | in browser testing | round 1: 45/48 |
| career-bound-outputs | in browser testing | round 2: 54/56 |
| qr-gated-outputs | in browser testing | round 1: 45/48 |
| no-silent-failures | in browser testing | not tested yet |
| release-loop-tooling | in browser testing | round 1: 24/35 |
| output-version-history | in browser testing | not tested yet |
| resume-rollups | in browser testing | not tested yet |
| chart-gallery | being fixed | round 2: 21/24 |
| release-intelligence | failing | round 1: 69/74 |
| cover-letter-agent | in browser testing | not tested yet |
| in-app-release-loop | being built | not tested yet |
| session-mapping | being built | not tested yet |
| world-shell-layers | being built | not tested yet |

</details>

## 0.2.0-u1 — 2026-10-09 05:46 UTC

Commit [`308925a`](https://github.com/marthasaltersb/saltbasin-website/commit/308925a40027e7518a8720933a204bf9596c58c2)

**All feature runs relaunched after the usage-limit reset**

All 11 feature runs restarted at 05:43 UTC after the usage limit reset, with the new scope check on: bugs that were already broken before this work, belong to another feature, or are test/process notes no longer block a feature. Unfinished work from agents that stopped earlier was saved to branches and handed to the new agents. Nothing had been re-tested yet at this point.

**Compared with the previous update**

- First update in this series: the baseline later updates are compared with.

<details><summary>Every feature at this update</summary>

| Feature | Status | Latest test |
|---|---|---|
| proficiency-live-qr | failing | round 5: 29/30 |
| world-shell-navigation | in browser testing | round 1: 45/48 |
| career-bound-outputs | in browser testing | round 2: 54/56 |
| qr-gated-outputs | in browser testing | round 1: 45/48 |
| no-silent-failures | in browser testing | not tested yet |
| release-loop-tooling | in browser testing | not tested yet |
| output-version-history | in browser testing | not tested yet |
| resume-rollups | in browser testing | not tested yet |
| chart-gallery | in browser testing | round 1: 17/20 |
| release-intelligence | in browser testing | not tested yet |
| session-mapping | agent stopped | not tested yet |
| cover-letter-agent | in browser testing | not tested yet |
| in-app-release-loop | being built | not tested yet |
| world-shell-layers | being built | not tested yet |

</details>

