# Change spec — MCP tools and World Shell card for personal opportunity-scoring weights

Feature key: `scoring-preferences-mcp` · Release: `2026-10-10-production-hardening-resume` · Version 1 · 2026-10-10
Branch: `release-loop/scoring-preferences-mcp-build` (from integration head `c738308`)
Training spec: `docs/training/scoring-preferences-mcp.md`

## Traces to

| Earlier spec / commit | Version | How this builds on or supersedes it |
| --- | --- | --- |
| Personal opportunity-scoring weights (no spec file; shipped on `main` 2026-09-10 and merged into the release branch 2026-10-10, merge commit `c738308` and its parents) | n/a | Builds on: the routes `GET/PUT/DELETE /api/career-agents/scoring-preferences` and the Classic Tools card **Opportunity Scoring Weights** (`CareerPlacementAgentsPanel.jsx`). Nothing about the weights model changes (`career_match_scoring_v1`, per-member override row in `journey_current_definitions`, 8 dimensions, weights total 1.0). |
| `docs/changes/platform-mcp.md` | v1 (commit `8d1ea93` and earlier) | Builds on: the append-only tool registry, the parity map (`capabilityParity.js`) and the rule that a capability ships with its MCP tool. This change closes the `MCP_GAP` recorded on the row `career-scoring-preferences`. |
| `docs/changes/world-shell-opportunity-outputs.md` | v1 | Builds on: the member journey runs inside `/world`. The weights card existed only in Classic Tools, so the World Shell path recorded in the parity map did not exist (a hidden `UI_GAP`); this change adds it. |
| `docs/training/platform-mcp.md` | v1 | Reuses its conventions for creating a token in **Connected Agents** and calling tools with `scripts/mcp-call.mjs`. Not modified; its tool-count expectations are outside this feature (see Known limitations). |
| Release loop definition | `server/data/releaseLoop/definition.json` v1 | This spec follows its `specStandards`, `interfaceParity` and `specGovernance`. |

## What changed, in one paragraph

A member can now read, save and reset their personal opportunity-scoring weights three ways: in the World Shell (**Journeys → Career Placement Agents → Scoring Weights**, desktop and 390px phone), through the API (unchanged routes), and through three new MCP tools, `career_scoring_preferences_read`, `career_scoring_preferences_save` and `career_scoring_preferences_reset`. The MCP tools run the website routes' own handlers in-process (`mcpRouteInvoker.js`), so validation, ownership and error text are identical to the API. Failures from the weights card now show as red error toasts that say what happened and what is unchanged.

## Data model (additive only)

None. No table, column, seed or bootstrap change; no member row is written except by the member's own save/reset, exactly as before.

## Server

- `server/lib/mcpRouteTools.js`: three entries appended to `SPECS` (append-only), mapped to `careerAgents` `GET|PUT|DELETE /scoring-preferences`. Scope `career.read` for the read tool, `career.write` for save and reset; permission `user` (any signed-in member acting on their own data, like `requireUser`). `career_scoring_preferences_save` takes `body: { weights: { <dimensionKey>: <fraction> } }` (fractions that total 1.0, for example `0.15`); the website card works in whole percentages and converts.
- `server/data/mcpToolManifest.json`: the three names appended (`node scripts/check-interface-parity.mjs --update-manifest`).
- `server/lib/capabilityParity.js`: row `career-scoring-preferences` lists the three tools and the real World Shell path; the `gap` note is removed. `node scripts/check-interface-parity.mjs` reports 0 gaps.
- No finalize or approve path is involved, so no `assertReadyToFinalize` call is added (saving weights changes only the member's own scores).

## Client

- `src/components/WorldShell.jsx`: in the Career Placement Agents panel, a **Scoring Weights** button (toggles **Hide Scoring Weights**) opens the card `ScoringWeightsPanel` (eight labelled percentage fields, a running **Total: n%**, **Save My Weights**, **Reset to Salt Basin Default** only while custom weights are in force). Same hook state as the Classic Tools card (`useCareerPlacementAgents`), so both screens show the same data.
- `src/lib/hooks/useCareerPlacementAgents.js`: the three failure messages of the weights actions now use `toast.error` (red, `role="alert"`) and open with plain words about what happened and what is unchanged; the server's detail follows.

## Behaviour changes to know

- A save with fields that do not total 100% is blocked in the website (button disabled, red total line). Through the API or MCP the server rejects it with `Weights must sum to 1.0 (got 0.900).` (status 400, code `bad_request`).
- The card shows a member's own weights only; another member never sees or is affected by them.
- A read-only token (`career.read`) lists and can call the read tool only; save and reset need `career.write`.

## Verified (initial check)

- `npm run build` passes.
- Server boots on a fresh database (`sb_rl_bld_6800_1`, port 6802, production mode serving `dist/`).
- `node scripts/check-interface-parity.mjs`: 110 of 110 capabilities in all three interfaces; manifest matches the registry (191 tools).
- Every journey of `docs/training/scoring-preferences-mcp.md` walked once in Chromium by the build agent on desktop (1280x900) and phone (390x844, touch); results are in the release log.

## Known limitations

- `docs/training/platform-mcp.md` J2.1 lists an exact tool set for a `career.read` + `career.write` token; the registry had already grown past it before this change, and these three tools add to the list. Its owner must amend it if it is still scored.
- The weights card edits the career-match model only (`career_match_scoring_v1`); resume-requirement scoring and evidence-confidence scoring are separate concepts with no preference surface yet (DEC-006).
- MCP save takes fractions, the website takes percentages; this is deliberate (API compatibility) and stated in the tool description.

## Fix notes per round (appended by fix agents)

(none yet)
