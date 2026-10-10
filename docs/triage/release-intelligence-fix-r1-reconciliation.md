# Reconciliation - release-intelligence fix round 1

Branch `release-loop/release-intelligence-fix-r1` (commit `6fc3bd3`). Fictional data only.

Re-run by me on a fresh database: `scripts/import-release-logs.mjs` ends "Read 110 file(s); 0 error(s)". Server stopped, database dropped.

## Reported items

### 1. First B7 attempt removed the db.js insert and with it the World Shell island; reverted
- kind: informational. status: resolved.
- Evidence: `server/db.js:3327` has the `release-intelligence` admin_nav insert; the island is in `src/lib/worldIslands.js:196` and `src/components/WorldShell.jsx:60`.

### 2. Commands refused by the worktree sandbox
- kind: environment. status: resolved.
- Evidence: reproduced (compound and `psql` commands refused, plain `node --env-file` worked). No branch state left.

### 3. Classic Tools hiding not browser-checked (B7, RI-R1-8, RI-R1-9)
- kind: requirement_gap (plus unverified fix). status: unresolved.
- Evidence: code read only. `AdminShell.jsx` has no TAB_COMPONENTS entry or fallback item; `withoutHiddenTabs` (~line 186, used ~348) filters tab id `release-intelligence`. Looks right; I did not run it in a browser. The World Shell island correctly still reads the unfiltered nav (`WorldShell.jsx` calls `getAdminNav` itself).
- step: B7, [J1.1] nearest; proposed [J1.2].
- rootCause: not validated in a browser; triage RI-R1-9 amendment (add step [J1.2], retire "Also reachable from Classic Tools" at `docs/training/release-intelligence.md:8`) was never made; `docs/spec-amendments/release-intelligence/` does not exist, so no step asserts the single entry point.
- files: src/components/admin/AdminShell.jsx; docs/spec-amendments/release-intelligence/; docs/training/release-intelligence.md (amendment reviewer only).
- proposedFix: validator opens Classic Tools -> Platform Lifecycle Management as admin and confirms no Release Intelligence entry while World Shell -> Journeys still lists it; amendment reviewer applies RI-R1-9.

### 4. RI-R1-7 not fixed (mcpToolRegistry.js not on integration branch)
- kind: requirement_gap (MCP_GAP). status: unresolved.
- Evidence: interface parity (definition.json v3) requires an MCP tool per capability; branches `release-loop/platform-mcp-build` and `-fix-r1` are not merged. Correctly deferred, not done.
- step: MCP-surface steps, RI-R1-7.
- rootCause: platform-mcp not integrated.
- files: server/lib/mcpToolRegistry.js, server/routes/releaseIntelligence.js, parity map.
- proposedFix: after platform-mcp merges, add registry tools calling the same functions with the same requireAdmin and finalize gate: import document, import snapshot, list/open/create release, add feature, approve/reopen, list/record/dispose failed runs, list/link outputs, trends, read/save/reset config; re-test.

## Round 1 triage items the fix agent did not report

| Item | Kind | Status | Evidence / action |
|---|---|---|---|
| RI-R1-1 importer exit | product_defect | resolved | Re-ran importer: 0 errors; `generatedFiles` rule in releaseIntelligenceConfig.js, skipped lines in releaseLogImporter.js |
| RI-R1-3/4/5/6 390px layout | product_defect | unresolved | Code present (TableScroll, min(100%,N) grids, S.root guard); fix agent's 390px check not independently repeated; needs a validation round on all six tabs |
| RI-R1-2 E.1 surface tag -> cli | requirement_gap | unresolved | Needs approved amendment; none exists |
| RI-R1-10 B8 commit reconciliation | requirement_gap | unresolved | Needs owner answer (sha exists in history / matches test record / unverified; gap or warning), then amend J3.3/J3.4 and implement in releaseReconcile.js. Nothing done |
| RI-R1-11 B10 auto snapshot ingest, class rules, proportional trend axis | requirement_gap | unresolved | Needs the three owner answers from round 1 triage. Nothing done |

## Gaps from the change spec's Known limitations (lines 86-93)
- Unclassified failed runs until a reviewer sets a class: requirement_gap, tied to B10 owner decision.
- Approval is the administrator's with no second-reviewer step: requirement_gap, owner decision needed (spec governance requires a different reviewer for amendments).
- Importer reads only skill-produced layouts: observed live, many old triage files import with "No triage items found". informational, unresolved by design.
- Tokens/minutes only where a tracker snapshot was imported (n/r otherwise); `POST /import/repository` depends on `docs/` in the server working directory: informational.
- The change spec still shows "Fix notes per round: (none yet)" above the round 1 notes: informational doc tidy.
