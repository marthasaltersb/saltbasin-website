# Salt Basin application packages release — status updates

Release **0.2.0** (`2026-10-02-application-packages`), built on branch `claude/zealous-meitner-5tuft5`. Each update is numbered `0.2.0-u<n>`, pinned to the commit it describes, and compared with the update before it. Newest first.

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

