# Release loop tooling: validation round 6

Score (from `release-spec-baseline.mjs score`): `{"baseline":3,"specSha256":"03924b9abae72dd99085b511db948016cfb8c7f49bd2f7a86a95432a31b177bc","total":30,"passed":30,"failed":[],"blocked":[],"notRun":[]}`

Commit tested: 0800b1c (integration head, merge of release-intelligence-spec-r1). Baseline v3 (amendment A2). `release-spec-baseline.mjs check` printed "baselines match: release-loop-tooling v3". Baseline unchanged since round 5, so scores compare like for like (round 5: 30/30 on v3); no diff needed.

## Result
All 30 steps pass on every required surface. Fresh database, seed, test accounts via scripts/create-test-member.mjs, Chromium 1280x900 and 390x844 touch, light/dark, en-US, UTC.

## Open bugs, verified by baseline step
- release-loop-tooling-F1-2 (stacked cards at 390px, no panel overflow): J5.3 passes at 390 light, dark and ?theme=dark. Cards have data-label cells (Status, Latest test, Rounds, Its own bugs verified), no `.panel` overflows on overview, feature, round and Tokens layers, and tapping the name or other card text opens the feature layer. Verified.
- release-loop-tooling-B3 (tracker 390px reflow): same evidence as J5.3. Verified.
- release-loop-tooling-F1-5 (agent card): J4.1/J5.1 agent card matches the current spec (VALIDATE - ROUND 1, delta-board, "Click the Save button", "2 checks - 1 passed - 1 failed", started / last step line). Verified against the current spec wording.
- release-loop-tooling-B1 (docs claim): J1.3 passes: `d.tracker` mentions the tracker artifact, has no `World Shell` or `/api/release-loop`; the grep prints nothing. Verified.
- release-loop-tooling-B2 (dead-agent detection): J3.4 (`validate:echo-audit:r1` stalled, feature stalled) and E.4 (running with --stale-minutes 60) pass. Verified.
- T4-1 (Your World hidden at 390px): J3b.3 passes under A2 (subtitle checked on desktop only). Desktop shows Your World, Journeys, Classic Tools; phone shows Journeys and Classic Tools. Verified under the current spec.

## Parity
- Desktop by click and phone 390x844 by tap for every browser step; tracker steps ran in light, dark and ?theme=dark. CLI steps ran once by shell.
- MCP: server/lib/mcpToolRegistry.js now exists. It has no tool for the local tracker sync (scripts/release-tracker-sync.mjs, preview server) or the test-account script; the only related tool, `release_tracker_read`, reads the release-intelligence database, not this tooling. This feature is developer tooling with no platform screen, so it is recorded as an observation, not a baseline failure (as in round 5): the capabilities with no API route or MCP tool are tracker sync/preview and create-test-member.

## Observations (no baseline step)
- Flake seen again: `preview.html?theme=dark` at 1280 failed J4.1 in the first full run (heading element not yet present after the fixed 1.5 s wait); an immediate re-run of that config passed everything. Same as round 5 (then on the 390 config). Likely slow first paint of the preview page.
- On the phone after login, the Career Placement Agents panel fills the screen and hides the world; Journeys and Classic Tools remain usable.
- Port 6302 (the suggested Vite port) was occupied by another process, so the preview server used 6352.
- Tracker and app load external fonts and Chart.js/three.js; blocked by the sandbox (external_blocked, not counted).

Logs: /var/tmp/sbpg/release-loop/release-loop-tooling/round-6/steps.jsonl and screenshots in the same folder. Cleanup: app server and preview stopped, database dropped.
