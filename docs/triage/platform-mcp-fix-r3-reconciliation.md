# Reconciliation - platform-mcp fix round 3 (branch release-loop/platform-mcp-fix-r3, d9e7333)

Verified: `node scripts/check-interface-parity.mjs --strict` exits 0 (87/87 capabilities, 141 tools, 167 governed routes). 13 `mcpExclusion` rows remain in `server/lib/capabilityParity.js`.

## Item 1 - platform-mcp-F2-4 remaining exclusions
- kind: requirement_gap (partly owner decision) - status: unresolved
- The request: every capability usable by AI agents through MCP with the same permissions as website/API. The parity check passes only because exclusions are recorded as "explicit", not because tools exist. The change spec itself says each exclusion is "waiting for the owner to confirm", i.e. not parity.
- Split:
  - Buildable as JSON tools (gap, build): file uploads (`pipeline-import`, `opportunity-import-output`, `cover-letter-add-resume`, intake uploads) - accept base64/JSON content and call the same route handler; binary downloads (`application-output-qr-image`, `-docx`, `shared-output-pdf`) - return base64 content with mime type (or a URL) via the route invoker (currently answers 415); accept/reject cover-letter proposals (`cover-letter-turn-decide`) - the member's own action under the member's token, same ownership checks, `useToolCategoryGate`/finalization gate where the route applies it; Career Master seed (`career-seed-definitions`) - admin-only tool.
  - Genuine owner decisions (ask the owner, do not guess): consent (`career-consent`) and token create/list/revoke (`access-tokens`). Recommend keeping excluded, with the owner's explicit confirmation recorded.
- files: server/lib/capabilityParity.js, server/lib/mcpRouteTools.js, server/lib/mcpToolRegistry.js, server/lib/mcpRouteInvoker.js, server/data/mcpToolManifest.json, docs/changes/platform-mcp.md
- proposedFix: append tools (append-only manifest) for uploads, binary reads, proposal decide, seed; replace those exclusions with `mcp` rows; ask owner exact question for consent and token management; keep `--strict` and `--self-test` green. Do not edit frozen specs; propose an amendment if a baseline step describes the exclusions.

## Gaps from the change spec's Known limitations that the report missed
- Render-binding tools (data map, pending changes): not built, feature has no code on this branch. requirement_gap, unresolved (blocked on that feature); add when it lands.
- Tokens authenticate `/mcp` only, not `/api/*`: informational, by design.
- Stateless server (no notifications/resources/prompts): informational.
- Parity checker cannot verify UI path strings match screen labels: informational/process; covered by the training walk.
- Possible coverage hole (noticed, not in spec): `server/routes/releaseLoop.js` (`/api/release-loop`) is not in `GOVERNED_ROUTE_FILES`, though parity rows and tools exist for it, so a new release-loop route would not fail the check. product_defect (minor), unresolved; proposedFix: add it to `GOVERNED_ROUTE_FILES` and add rows for any unlisted route.
