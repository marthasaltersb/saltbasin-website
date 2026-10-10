# Platform MCP, fix round 1 reconciliation

Branch checked: `release-loop/platform-mcp-fix-r1` (47cddd6, merge-base b0d209b; integration head fb5561a is ahead, so a merge is still needed).
Checked myself: `check-interface-parity.mjs --strict` (65 of 65, 90 tools, exit 0), `release-spec-baseline.mjs check --all` (all baselines match, platform-mcp v1), no change under docs/training, amendments A1/A2/A3 present, code reads below.

| # | Reported | Kind | Status | Evidence |
|---|---|---|---|---|
| 1 | Shell commands refused as too complex | environment | resolved | Sandbox limit, no half-applied state; branch is clean. |
| 2 | MCP_CALL_MAX=30 hit 429 mid-walk, default raised to 300 | informational | resolved | `server/lib/mcpServer.js:26` default 300, env override. Designed behaviour. |
| 3 | MCP_AUTH_FAIL_MAX=4 locked out local address | informational | resolved | `mcpServer.js:25` default 10 per 15 min; lockout is by design, restart clears it (in-memory counter). |
| 4 | 428 path on tools/call not exercised | requirement_gap (test coverage) | unresolved | Code exists (`mcpServer.js:89-90`, getAccountGateBlock) but no frozen-spec step and it was never run. A1 only proposes J6.7-J6.9. Same item as #8 and G5. |
| 5 | Default per-token limit (300/min) not exercised | test_harness | unresolved | Only 30 was tested. Amendment A2 (E.7) covers the failed-auth limit, not the per-token limit. Add a step or a unit check of `makeHitCounter` at the default. |
| 6 | Old admin_nav tabs stay and render nothing in Classic Tools | informational | resolved | Entry points now come only from `PLATFORM_ISLAND_TABS` (`src/lib/worldIslands.js:249`) merged in WorldShell. `connected-agents` and `capabilities` are gone from `db.js`, `defaultMemberConfig.js` and `AdminShell.jsx` (grep confirms), which matches the owner's World Shell-only direction. Leaving stored rows is required by the additive-only invariant. Residual: dead nav rows are visible to anyone editing the nav. |
| 7 | Cleanup of server, DB and Chromium | process | resolved | Nothing pushed; branch contains only the one fix commit. |
| 8 | B12 not fixed: spec step gap, amendment A1 only | process | unresolved | Spec governance blocks editing the frozen spec, so proposing is correct. It stays open until a reviewer other than the proposer approves A1, A2, A3 and baseline v2 is cut. Until then the v1 baseline still expects the OLD gap state in J2.1, J10.4, J11.2, E.5 (A3), so a validator scoring v1 will fail those four steps although the product is right. |

## Gaps the reported failures missed

| Gap | Kind | Status | Evidence / fix |
|---|---|---|---|
| G1. `docs/changes/platform-mcp.md` "Known limitations" is stale. It still says 25 MCP gaps and 3 website gaps remain, `--strict` fails, and rate limiting is not added. All three are now false. The overview (43 rows, 11 tools) and the Data model rows for the two `admin_nav` tabs and the `memberTabs` entry also describe the pre-fix state. | process | unresolved | Rewrite those sections in `docs/changes/platform-mcp.md` (lines 27-36, 84-91). It is not a frozen spec. |
| G2. Render-binding tools (data map, pending changes) not built. | requirement_gap | unresolved, blocked | `src/lib/renderBindings.js` says the platform registry `server/lib/renderBindingRegistry.js` is "not merged yet"; no routes exist, so parity cannot be built now. When it lands, add rows to `server/lib/capabilityParity.js` and tools to the registry (the parity check fails on a new governed route file otherwise). Ask the owner whether this blocks the release. |
| G3. Tokens authenticate `/mcp` only, not `/api/*`; server is stateless (no notifications, resources, prompts). | informational | resolved | Deliberate design stated in the change spec. |
| G4. Parity check cannot prove a UI path string matches a screen label. | test_harness | unresolved | Only the browser walk covers it. The new screens (Check freshness, Import an application package, Qualification Rules) are covered only by proposed A3, not by frozen v1 steps. |
| G5. A token created before terms lapse returns 428 until re-accepted; "by design, not separately tested". | requirement_gap (coverage) | unresolved | Same fix as #4: walk A1 J6.7-J6.9 once approved. |
| G6. Recorded non-tool exclusions: file uploads, PDF/ZIP/docx/QR downloads (415), consent, maintenance seeds, accept/reject of a cover-letter proposal, revoking a QR link, token management. | owner_direction_conflict (possible) | unresolved | The request was "every capability". The exclusions are recorded in the map with reasons but the owner has not confirmed them. Ask the owner to confirm each, especially binary downloads and QR revoke. |

## Fix agent next steps
1. Update the stale sections of `docs/changes/platform-mcp.md` (G1).
2. Have a non-proposer reviewer approve A1-A3 and cut baseline v2; re-validate (closes #4, #8, G4, G5).
3. Add a per-token default-limit check (#5).
4. Ask the owner about exclusions G6 and render-binding scope G2.
5. Merge integration head into the branch before release (branch is behind fb5561a).
