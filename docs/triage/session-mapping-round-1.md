# Triage: session-mapping, round 1 (release 2026-10-02-application-packages-resume)

Validator report: docs/test-results/session-mapping/round-1.md. Baseline steps all pass; one failure outside the score (MCP_GAP).

## T1 [MCP] No Sessions tools in the MCP server (open bug session-mapping-B5) - class: defect
- Reproduced by reading code: no `session_mapping_*` in server/lib/mcpToolRegistry.js, server/data/mcpToolManifest.json or server/lib/capabilityParity.js; 13 routes in server/routes/sessionMapping.js (all behind `requireAdmin`, line 15) have no tool.
- Root cause: docs/changes/session-mapping.md (Interface parity table, line 86) deferred MCP because the registry did not exist when the spec was frozen. It exists now (platform-mcp merged, mcpToolRegistry.js, append-only). definition.json v3 requires every capability to ship its tool in the same change; the registry header says the same. The recorded gap was a deferral, not an exclusion, so it is a defect, not a spec_error. The frozen spec says "No step below depends on MCP", so no amendment is needed: this fix adds tools and changes no step.
- Fix (follow the `rlTool` pattern, mcpToolRegistry.js:41-46 and 725+; permission 'admin'):
  1. Add scopes `sessions.read` and `sessions.write` to `MCP_SCOPES` (admin only, same wording style as release.loop.*).
  2. Append tools, each a thin call to server/lib/sessionMapping.js (lazy import), same functions and error statuses as the routes:
     - `session_mapping_config` (read: loadRules + DEFAULT_RULES; save `rules`: saveRules then remapAll; `reset`: resetRules then remapAll)
     - `session_mapping_sessions` (list: listSessions; `id`: getSession, 404 when null; `remapId`: remapSession then getSession)
     - `session_mapping_trends` (getTrends)
     - `session_mapping_proposals` (list status/area; reject id+note; apply id+appliedOn/note/ref, which MUST call `assertReadyToFinalize(user.id)` first exactly as the route does at routes/sessionMapping.js:40, mapping FinalizationBlockedError the way application_output_approve_for_qr does, registry line ~198)
     - `session_mapping_import` (transcript: importTranscriptText; metrics: importMetricsJson; scan: scanTranscripts; actor `{id,label}` as `rlActor`)
     - `session_mapping_failures` (list: listCaptureFailures; set disposition: setCaptureFailureDisposition)
     Never return transcript text (CLAUDE.md: metrics only). The `api` field of each tool names the matching route.
  3. Add the six names to server/data/mcpToolManifest.json (append only).
  4. Add capabilityParity.js rows (group 'Session mapping', ui `${WS} > Journeys > Sessions`, api lists above, mcp names); no exclusions needed.
  5. Update docs/changes/session-mapping.md Interface parity row and the "planned, not built" line (docs/changes is the change spec, not the frozen training spec). Do NOT edit docs/training/session-mapping.md or its baseline; its MCP paragraph (line 22) stays frozen.
  6. Check: `node scripts/check-interface-parity.mjs --strict` and call each tool via the MCP endpoint as admin and as a non-admin (expect refusal), comparing results with the API.
- Files: server/lib/mcpToolRegistry.js, server/data/mcpToolManifest.json, server/lib/capabilityParity.js, docs/changes/session-mapping.md.

## T2 SessionEnd hook captures nothing without DATABASE_URL (B8) - class: environment
- scripts/analyze-session.mjs --hook files via server/db.js, which throws at line 46 when DATABASE_URL is unset (dotenv/config at line 35 reads only .env). The checkout has only .env.example. The hook behaves as specified: exit 0, failure line in hook-failures.jsonl (J7.x, J8.4, J8.5 pass), and "Scan server transcripts" later files it. A developer machine without .env is a configuration state, not a code defect. No fix to code; optional doc line in docs/changes/session-mapping.md saying the hook needs DATABASE_URL in .env. No new step: the failure is already surfaced and recoverable, and a step would need owner direction on whether the hook should fall back to a local file.

## Observations (no fix agent work)
- B7 classic admin-menu entry (server/db.js:3335, AdminShell.jsx:126): the frozen spec and change spec document "also reachable from Classic Tools" as intended, and no step covers it. The release-loop fix removed its classic listing by owner direction for that feature only. Not a failure; if the owner wants Sessions World-Shell-only it is an amendment plus change-spec edit, so it is routed as a question, not guessed.
- J3.4 colon wording ("Input tokens 150" vs "Input tokens: 150"): the product matches the change spec; the validator passed the step. Proposed wording amendment is cosmetic and optional; not filed as blocking.
- Settings inputs aria-label differs from visible label (label-in-name): low-severity accessibility defect outside the baseline. Fix: make aria-labels equal the visible label text in the Sessions settings panel. Not a step; no amendment.
- Expected HTTP 400 console lines, aborted /api/config/admin-nav request, and discarded attempts: not product defects; nothing to do.
