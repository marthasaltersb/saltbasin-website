# Reconciliation: platform-mcp build (release 2026-10-02-application-packages-resume)

Branch reviewed: `release-loop/platform-mcp-build` (b77049b, based on c3a71b4). No code changed.

## Reported items
1. Shared node_modules got the SDK (environment, resolved): package.json (`^1.32.1`) and package-lock.json (`node_modules/@modelcontextprotocol/sdk`) record it. The SDK is NOT present in the main checkout's node_modules today, so any validator or integrator must run `npm install` in its own tree. Not a code defect.
2. Harness-refused compound commands (process, resolved): refused commands ran nothing; reruns via helper scripts.
3. Stale tokens from killed walks (test_harness, resolved): final walks on fresh databases.
4. High machine load (environment, informational).
5. Known gaps (requirement_gap, unresolved): 25 capabilities without an MCP tool, 3 without a website screen; `--strict` exits 1. The brief asked for every capability usable through all three interfaces.
6. Render-binding data map + pending-changes tools not built (requirement_gap, unresolved, blocked: render-bindings has no code on this branch). Must be appended with capability rows when it lands.
7. Bootstrap warnings on fresh DB (informational, pre-existing, documented in CLAUDE.md).
8. Attribution trailer (process, informational, task trailer used correctly).
9. Nothing pushed / harness config deleted (informational).

## Missed by the build report
- owner_direction_conflict (unresolved): the change adds admin-navigation entry points although the owner direction is that everything is reached from the World Shell. `server/db.js` injects `connected-agents` and `capabilities` tabs into `config_state.admin_nav` (System view); `AdminShell.jsx` adds both to `TAB_COMPONENTS`; `defaultMemberConfig.js` adds a `connected-agents` member dashboard tab (`/member`). Fix: keep only the `worldIslands.js`/`WorldShell.jsx` islands; remove the admin_nav injection, the AdminShell TAB_COMPONENTS entries and the memberTabs entry (and the matching read-time merge effect). Note the admin_nav rows are additive-only once written, so removal must not delete rows already stored; just stop injecting and confirm the World Shell is the only path.
- requirement_gap (unresolved): no rate limiting on `/mcp` (change spec Known limitations). Token auth endpoint can be hammered; recommend reuse of the existing auth rate limiter.
- requirement_gap (informational-level): tokens authenticate `/mcp` only; stateless server (no resources/prompts). Acceptable per brief, recorded.
- Spec's Known limitation: "terms lapse then re-accept" path is untested by the training spec; propose an amendment (do not edit the frozen spec).
- No `docs/test-results/platform-mcp/` or triage yet exist on the branch; the build agent's 64/64 walk logs are not committed, so validators cannot cross-check them (process, unresolved until round-1 validation writes them).
