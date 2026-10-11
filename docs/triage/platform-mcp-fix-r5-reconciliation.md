# Reconciliation - platform-mcp - fix round 5

Branch `release-loop/platform-mcp-fix-r5` (head 2dde6b0). Reconciliation agent rec-16100-10. No code changed, nothing committed. Server stopped and database `sb_rl_rec_16100_10` dropped afterwards.

## Reported items

### 1. "Browser walk of J1.4 not run (sandbox refused Playwright; server/database not booted)"
- kind: test_harness. Status: resolved (the walk was run here), but it surfaced two real findings (1a, 1b).
- Evidence: fresh DB, `NODE_ENV=production npm start` on 16120, member@test.local and admin@test.local, Chromium at 1280x900 (member) and 390x844 (admin), page `/world?at=island:connected-agents`, name "Research assistant", Create token clicked three times with no scope:
  - role=alert count after each click: 2, 2, 2 (both accounts). No stacking across repeats (the toast de-dup works), no page errors, no horizontal scroll.
  - 1a. Two `role="alert"` elements are always on screen at once: the inline `.alert` (ConnectedAgentsPanel.jsx line 105) and the toast with identical text. The commit says "single alert"; it is one message but two alert nodes. Whether J1.4 ("a red alert") passes depends on how the validator counts. Status: unresolved (partial). files: `src/components/admin/ConnectedAgentsPanel.jsx`, `src/lib/toast.js`. proposedFix: for this panel's validation errors show the inline alert only (skip `toast.error` when the same text is already inline), or make that toast `role="status"`.
  - 1b. The page shows 21 scope checkboxes, not the 18 J1.4 (baseline v5, A7) expects: `flows.read`, `flows.write`, `flows.publish` were appended (after `datamodel.write`, before `agent.runner.read`) after A7's pinned commit. J1.4 fails at this head on count and order. Status: unresolved (see item 2).

### 2. "Counts at this head are 233 tools and 128 capabilities; change-spec gives 216 and 121"
- kind: requirement_gap (spec baseline stale). Status: unresolved.
- Evidence: `node scripts/check-interface-parity.mjs --strict` exits 0: `128 of 128 capabilities ... gaps 0`, 297 governed routes, 233 tools = manifest 233; `--self-test` OK; `release-spec-baseline.mjs check --all` OK (platform-mcp v5). `MCP_SCOPES` has 21 scopes, `MCP_TOOLS` 233. docs/changes/platform-mcp.md (lines 59, 86) pins tested-commit values 216/121 and says the head has grown; honest wording, not a defect.
- rootCause: A7 pinned J1.4 (18 scopes), J2.1 (216-tool list), J6.2 and J11.2 (121 of 121) at cdf9504. Registry, scopes and parity map are append-only and grow with other features (flows, render bindings, data model, runner, smoke), so any literal count in a frozen step goes stale every release.
- files: docs/spec-amendments/platform-mcp/ (new A8, approved by a reviewer other than the proposer). Fix agents must not edit docs/training/*.md or baselines.
- proposedFix: A8 recounts J1.4 (21 scopes in registry order including flows.*), J2.1, J6.2, J11.2 (first line `Interface parity: 128 of 128 capabilities ...`) at the commit under test; better, restate to assert the scope boundary and "count equals manifest / strict check exits 0" instead of pinned literals.

### 3. "not fixed platform-mcp-F4-2: A7 exists, no new amendment filed"
- kind: process (correct refusal: fix agents may not edit amendments/baselines). Status: unresolved, because the amendment is still needed (item 2).
- Evidence: A7.json exists, `fromBaseline: 4`, baseline v5 current; no change to docs/training or amendments in this fix round.

## Gaps from "Known limitations" (docs/changes/platform-mcp.md lines 83-97) that the reports missed

- Exclusions awaiting owner confirmation (binary downloads, file uploads, accept/reject cover-letter proposals, terms consent, token management, Career Master seed, push ingest by ingest token): requirement_gap candidates, unresolved, owner decision. The owner said everything should be accessible through MCP; each is a named `mcpExclusion` row. Not widened this round. Question for the owner: confirm each exclusion or request a tool.
- Line 85 "Render-binding tools ... not built because that feature has no code on this branch yet" is stale (render-binding tools are registered). kind: process, unresolved. file: docs/changes/platform-mcp.md. proposedFix: delete or restate.
- Line 27 overview still says "grew the registry to 141 tools" while lines 59/86 say 216/121: inconsistent text. kind: process, unresolved, same file.
- `capabilityParity.js` cannot verify UI path strings against screen labels: informational (covered by the walk only).
- Tokens authenticate `/mcp` only; server stateless: by design, informational.
- Owner-direction check: Connected Agents and Capabilities are World Shell islands only (`PLATFORM_ISLAND_TABS`); the walk reached Connected Agents via the World Shell as the member. No owner_direction_conflict.
- J10.4 "Capabilities > Gaps only" browser walk still not run (carried from r4): informational, unresolved.
