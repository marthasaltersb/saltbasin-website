# Reconciliation: release-loop-tooling, fix round 1

Branch checked: release-loop/release-loop-tooling-fix-r1 (082eed1). Date 2026-10-09. No code changed.

| # | Item | Kind | Status |
|---|---|---|---|
| 1 | Bash calls refused by worktree guard, split and rerun | environment | resolved |
| 2 | SETUP-FOR-CLAUDE.md embeds an old copy of the tracker page | requirement_gap | unresolved |
| 3 | docs/release-log/* still mention the old World Shell claim | informational | resolved |
| 4 | Fixture server stopped, no DB, scratch dir remains | environment | resolved |
| 5 | RLT-T2: page-errors count not on agent card | requirement_gap | unresolved |
| 6 | Spec "Known limitations" still lists the stale-agent gap that B2 fixed | process | unresolved |
| 7 | In-platform "Release loop" view (task 13) not built | requirement_gap | unresolved (outside this fix round) |

## Evidence
1. No command failed; refusals were a tool guard, reruns completed. Re-ran the sync and verify commands on the branch, both succeeded.
2. tools/release-tracker/SETUP-FOR-CLAUDE.md (433 lines) has a "stale" CSS rule but no `stalled` label and no `data-label` mobile card CSS, while tools/release-tracker/index.html has both (index.html lines 55, 104-111, 138). Anyone setting up the tracker from that file gets the older page. Fix: regenerate the embedded page from index.html (or replace the embedded copy with an instruction to use index.html), and add a check that they match.
3. docs/release-log/* are dated history. Active docs no longer claim the view: the only remaining mentions of the World Shell "Release loop" view or `api/release-loop` are the spec and training text saying it was removed. definition.json `tracker` now says "there is no platform screen" and parses (10 bugEscalation statuses).
4. The fixture server was stopped and no database was created. I regenerated the fixture in my own scratch dir and removed it. No processes were started.
5. index.html no longer shows the count on the agent card (one "page error" mention remains, on the agent layer). The fix agent could not get an answer from the spec author. The spec (J4/J5) describes the current card, so tests pass, but the original design showed page errors and failed requests on the card. Needs an owner decision. Proposed fix: ask the owner; if the count should stay, add it to the agent card in index.html and J4, otherwise record the decision in the change spec and close it.
6. docs/changes/release-loop-tooling.md "Known limitations" still says an agent with a `started` entry and no end entry stays `running` forever, and that the idle check applies only to `--extra` agents. B2 changed this: scripts/release-tracker-sync.mjs lines 118-120 and 258 mark journal agents `stalled` after `--stale-minutes` (default 15) and set the feature to `stalled`. The bullet about tables on a 390 px screen is also stale (B3 made them stacked cards below 640px). Fix: update both bullets.
7. Known limitations bullet 4 and task 13 say the in-platform World Shell view is not part of this change. The request for this feature (definition, workflow, skill, attempt limit, reconciliation, live step logs, tracker sync, test accounts) did not include a platform view, so it is not a failure of this round. It remains an open requirement gap for the release loop as a whole; when built it must live in the World Shell, not admin navigation.

## Other gaps from the spec's Known limitations
- The claude.ai-hosted page (live `claude.use('db')`) is exercised only through the local harness. Not verifiable here; remains a limitation.

## Verified on the branch
- Sync of fixture runs A and B with the fixture steps root: `verify-snapshot.mjs` printed "snapshot matches expected", exit 0 (echo-audit `stalled`, as the spec expects).
- definition.json parses; tracker string corrected.
