# Release loop tooling: validation round 4

Score (from `release-spec-baseline.mjs score`): `{"baseline":2,"specSha256":"c9a9e560b1fa72842ca6014f68e6a293335e186ed5fb02ee1a4f8c8e3ae9cccd","total":30,"passed":29,"failed":["J3b.3"],"blocked":[],"notRun":[]}`

Commit tested: 08468b1. Baseline v2 (amendment A1). Baseline check passed.

## Baseline diff v1 to v2
Same (27): P.1-3, J1.2-3, J2.1-2, J3.1-6, J3b.1-5, J4.2-4, J5.1, J5.4, E.1-4. Changed (5): J1.1, J4.1, J4.5, J5.2, J5.3. Added: J5.5. Retired: none. Round 3 scored 104/126 on v1, so it is not comparable like for like.

## Result
29 of 30 pass. One failure: J3b.3 on the phone surface (390px): after login the URL is /world and Journeys and Classic Tools show, but the text "Your World" is not shown (the subtitle is hidden on phones) and a Career Placement Agents panel covers the page. Desktop passes. Screenshots: round-4/J3b3-desktop.png, J3b3-mobile.png.

Proposed amendment (ambiguity): J3b.3 should say whether "Your World" must be visible at 390px.

## Fix verification by step
- J5.3 (F1-2 / B3, 390px stacked cards, no panel overflow): now passes. Stacked cards with data-label labels (Status, Latest test, Rounds, Its own bugs verified), no .panel overflow on overview, feature, round and tokens layers; clicking card name or other text opens the feature layer. Verified.
- J4.1 (T3-1 nine tiles, status updates tile = u7): passes. J5.2 (T3-3 palette): passes.
- F1-6 doc fix and J5.5 (setup guide in sync): pass.
- F1-5 (agent card count) and B1/B2: no baseline step; B2 dead-agent detection: J3.4/E.4 show stalled and not-stalled correctly (passes).

## Parity
- Desktop 1280 (light, dark, theme=dark) by click; phone 390x844 touch by tap (light, dark, theme=dark). All tracker steps matched.
- MCP_GAP: platform MCP server not built yet (feature platform-mcp); server/lib/mcpToolRegistry.js does not exist. Tracker and test-account capabilities have no tool.

## Observations
- Tracker page loads external Chart.js and three.js from cdnjs plus Google Fonts; blocked by sandbox (external_blocked, not counted). "Release trends" shows "Trend history loads with the next sync" with this fixture.
- Steps listed as desktop+mobile that are shell checks (J1.2, J1.3, J2.1, J3.2-3.4, J3.6, J3b.2, E.1, E.3, E.4) were done by shell and recorded identically on both surfaces.
- Login page rate-limit not hit.

Logs: round-4/steps.jsonl. Cleanup: server and preview stopped, database dropped.
