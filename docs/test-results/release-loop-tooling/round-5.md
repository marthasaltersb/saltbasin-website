# Release loop tooling: validation round 5

Score (from `release-spec-baseline.mjs score`): `{"baseline":3,"specSha256":"03924b9abae72dd99085b511db948016cfb8c7f49bd2f7a86a95432a31b177bc","total":30,"passed":30,"failed":[],"blocked":[],"notRun":[]}`

Commit tested: 8f1c8c4 (integration head). Baseline v3 (amendment A2). Baseline check passed ("baselines match: release-loop-tooling v3").

## Baseline diff v2 to v3
Same (31 of 32 comparable ids, including all of P, J1, J2, J3, J4, J5, E); changed: J3b.3 only (A2: Your World subtitle checked on desktop only). Round 4 scored 29/30 on v2; round 5 is 30/30 on v3. Like for like, the only difference is the J3b.3 wording.

## Result
All 30 steps pass on every required surface.

## Fix verification by step
- J3b.3 (A2): desktop passes (URL /world; Your World, Journeys, Classic Tools shown; no password or terms page). Phone 390x844 touch passes: URL /world, Journeys and Classic Tools visible in the header, no password or terms page. The Career Placement Agents panel covers the world body on the phone but does not hide Journeys or Classic Tools, so the step passes under A2. Screenshots: round-5/J3b3-desktop.png, J3b3-mobile.png.
- All other steps unchanged and still pass (J3b.5 console: only blocked external font loads).

## Parity
- Desktop 1280x900 (light, dark, theme=dark) by click; phone 390x844 touch by tap (light, dark, theme=dark). All tracker steps matched; J5.3 stacked cards, pill style and panel overflow checks pass at 390.
- MCP_GAP: platform MCP server not built yet (feature platform-mcp); server/lib/mcpToolRegistry.js does not exist. Tracker sync and test-account capabilities have no tool. Routed to platform-mcp, not a baseline step.

## Observations (no baseline step)
- One transient failure: in the first full run, m-theme (390 touch, ?theme=dark) J4.1 threw (heading element not yet present after the fixed 1.5 s wait); re-run of that config passed every step. Likely slow first paint, not reproduced.
- On the phone, the Career Placement Agents panel fills the whole screen after login, hiding the world; only the header tabs remain usable.
- Tracker page loads external Chart.js, three.js and Google Fonts; blocked by the sandbox (external_blocked, not counted).
- Shell and CLI steps listed as desktop+mobile were run once by shell and recorded identically on both surfaces.

Logs: round-5/steps.jsonl. Cleanup: server and preview stopped, database dropped.
