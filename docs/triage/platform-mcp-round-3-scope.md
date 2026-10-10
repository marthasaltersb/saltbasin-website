# platform-mcp round 3 scope review

Integration head: 49ca0c7. Reviewed 2026-10-10. No code changed. docs/triage/scope-review.json has no platform-mcp entries, so every item was decided here. The MCP server, registry and parity map first appear in b77049b (feature's first merge 20b2769), so a base build has nothing to reproduce; git history is the evidence.

| id | scope | owner |
|---|---|---|
| platform-mcp-F2-2 | this_feature | platform-mcp |
| platform-mcp-F2-3 | pre_existing | - |
| platform-mcp-F2-4 | this_feature | platform-mcp |

- F2-2: docs/changes/platform-mcp.md "Known limitations" still says 25 capabilities lack an MCP tool, 3 lack a website screen and `--strict` fails. Fix round 1 (47cddd6) closed all of them; `node scripts/check-interface-parity.mjs --strict` at 49ca0c7 reports 86 of 86, 0 gaps, exit 0. The stale text is the feature's own change spec. Fix: rewrite the bullet (this is the change spec, not the frozen training spec, so it is editable by the fixer).
- F2-3: the "Render-binding tools" limitation. docs/changes/render-bindings.md (cd89438) is a design-only spec; the repo has only a client library (src/lib/renderBindings.js, releaseTrackerWorld.js) and no server routes, so there is no capability to expose and no route that capabilityParity.js could be missing a row for. The platform-mcp spec already says to append tools when that feature lands (the parity check fails until they do). This is a gap outside the request ("every capability that exists"), caused by a different, unbuilt feature. Not fixable here; no code change. The limitation text stays accurate and should remain.
- F2-4: "Scope narrowed by builder". capabilityParity.js carries 16 rows with `mcpExclusion` (file uploads, binary downloads, consent, token management, maintenance seeds, accept/reject of cover-letter edits). The request is "every capability usable by AI agents through MCP"; these exclusions were chosen by the builder (first in b77049b, extended in fix r1), not by the owner. Within this feature's request, so this_feature. It needs an owner decision (needs_business_definition): which exclusions the owner accepts (credentials, consent and human approval look deliberate; binary and upload ones could get base64/URL tools). Ask the owner exactly that; do not guess in code.

Process note: F2-2 was logged as class `process`, F2-3 `requirement_gap`, F2-4 `owner_direction_conflict` by the fix agent; classes are unchanged by this review.
