# Reconciliation: journey-flow-studio build (branch release-loop/journey-flow-studio-build-2 @ f44bd2a)

Release 2026-10-10-production-hardening-resume. Checked by reading the code on the branch, `npm run build` (passes),
`node scripts/check-interface-parity.mjs` (no flow-studio gap; the one gap, release-tracker-admin, is another feature),
and `JSON.parse` of `server/data/mcpToolManifest.json` (valid).

## Reported items
| # | Reported | Kind | Status | Evidence |
| - | --- | --- | --- | --- |
| 1 | Chained restart/reset/walk refused by shell guard | process | resolved | Nothing ran; separate calls used. No state left. |
| 2 | Walk against un-reset DB, killed with pkill | process | UNRESOLVED | Task rules say PID files, never pkill. Cannot verify what it matched. Confirm no other agent's process died. |
| 3 | Walker bugs (stale state, tab, disabled button, selector) | test_harness | resolved | Walker is outside the branch; no product code implicated. No walk log is committed under docs/test-results. |
| 4 | Mobile canvas 1030px on 390px | product_defect | resolved | FlowStudioPanel.jsx lines 43 and 55 carry `minmax(0,1fr)` and the 820px media query. Build passes. Not re-driven in a browser. |
| 5 | `branch -f` refused (worktree wf_e17e304d-05c-1) | process | informational | Old branch still at dc00c69. Build-2 contains it via merge 9b719fb. Integrator must merge build-2, not the old name. |
| 6 | Merge conflicts in mcpToolRegistry.js / manifest | process | resolved | Manifest valid JSON; parity check reports "registry matches the code", 215 tools registered = 215 in manifest. |
| 7 | Login rate limit | environment | informational | Known 10/15min/IP limit (CLAUDE.md). |
| 8 | Harness wrapper processes in ps | environment | informational | Not the agent's. |

## Gaps found beyond the reported items
1. owner_direction_conflict: the studio is also added to admin Classic Tools. `AdminShell.jsx` adds a FALLBACK_ADMIN_NAV entry and a TAB_COMPONENTS entry, `db.js` adds an admin_nav row, and `journey-flow-studio` is NOT in `HIDDEN_NAV_TAB_IDS` (AdminShell.jsx:194, which hides session-mapping). Owner direction: everything comes from the World Shell. Fix: add `journey-flow-studio` to HIDDEN_NAV_TAB_IDS; keep the admin_nav row (island source).
2. requirement_gap: agent draft is not recorded via `recordAgentLlmUsage` (no `agent_definitions` row for the studio agent). The request asked for the existing in-app agent path. Spec "Known limitations" lists it. Fix: seed an insert-if-missing platform-default agent_definitions row and call `recordAgentLlmUsage`/`recordInAppAgentRun` from `agentDraft()` in `server/lib/flowStudio.js`, never throwing into the request.
3. requirement_gap (minor): access roles are only `admin`/`member`; no per-org roles or per-flow share lists. Listed as TEMPORARY PROTOTYPE DEBT, owned by security-provisioning-model. Request says "by permission", which the access policy in the definition meets.
4. informational: no multi-select/bulk edit (Part 5 item, not in the five gaps requested); architecture mapping and data model stay free text; Graphify visual not built here (separate feature).
5. process: the build agent's walk results are only summarised in the change spec; no `docs/test-results/journey-flow-studio/` log. Baseline v1 is not yet frozen (`docs/training/baselines/journey-flow-studio` absent), which is the integrator's step.
6. informational: the branch is 46 commits behind the integration head; merge-base 1032699. Merge will need the usual conflict handling in mcpToolRegistry.js, mcpToolManifest.json and capabilityParity.js.
