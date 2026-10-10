# session-mapping round 5 scope review

Integration head: ac20fdf. Not committed. No code changed.

## Item: round 4 E.8 (nonexistent transcripts folder, scan is silent)

- Owner: this_feature
- Decision basis: `docs/triage/scope-review.json` has no entry for this id, so no earlier decision exists to reuse.
- `scanTranscripts()`, `listSessionFiles()`, the `/api/session-mapping` scan route, the `session_mapping_import` MCP tool and `SessionMappingPanel.jsx` were all added by session-mapping. They do not exist before its first merge, so the base commit cannot reproduce the behaviour. Nothing outside this feature is involved.
- The silent failure is a regression from round 3 (commit 059e84b, a session-mapping commit). It wrapped `listSessionFiles(dir)` in try/catch and stored `dirError` so that spooled analyses and hook failures still get filed. It never reports the error. Before that commit the 400 "Cannot read transcripts folder" error propagated and was shown.
- The scan screen and the MCP scan are exactly what this feature was asked to provide. Failing in plain words on all three interfaces (desktop, mobile, MCP) is part of that request, and the spec step E.8 requires it.
- Fix direction (not applied here):
  - After the spool and hook-failure filing finishes, surface `dirError`. The route should return a non-2xx status or an explicit error flag, and the MCP tool should return `isError: true`.
  - The panel should show a red `role="alert"` message that says what went wrong and what to do (for example, set the Transcripts folder in Settings). It should still report what was filed from the spool.
  - Keep the "never swallow" behaviour while preserving the round 3 goal of filing spooled data.
- Files: `server/lib/sessionMapping.js`, `server/routes/sessionMapping.js`, `server/lib/mcpToolRegistry.js`, `src/components/admin/SessionMappingPanel.jsx`.

No spec amendment is proposed. E.8 is correct as written.
