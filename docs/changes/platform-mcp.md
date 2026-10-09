# Change spec - Platform MCP server: every capability usable by AI agents, with the website's permissions, plus a parity map

Feature key: `platform-mcp` · Release: `2026-10-02-application-packages-resume` · Version 1 · 2026-10-09
Branch: `release-loop/platform-mcp-build` (built on integration head `c3a71b4`)
Training spec: `docs/training/platform-mcp.md`

## Owner direction

> "make sure the user interface is accessible not just through APIs but also through MCP and platform interface through my website" - 2026-10-09

## Traces to

| Earlier spec / commit | Version | How this builds on or supersedes it |
| --- | --- | --- |
| `server/data/releaseLoop/definition.json` `interfaceParity` (v3, 2026-10-09) | v4 | This is the MCP surface that rule names: "a tool in the platform MCP server (`server/lib/mcpToolRegistry.js`) that calls the same server function, with the same permission checks". Before this, capabilities missing an MCP tool were recorded and assigned here; the parity map below is where those records now live. |
| `docs/changes/world-shell-opportunity-outputs.md` | v1 (commit `dd3f321` era) | The tools wrap `listOpportunityOutputs`, `getOutputContentForEdit`, `saveEditedVersion`, `linkOutputToOpportunity` (not yet a tool) and the new `trackCareerOpportunity` / `openCareerOpportunity`. Nothing superseded; `POST /api/career-agents/opportunities` now delegates to `trackCareerOpportunity` (same behaviour). |
| `docs/changes/proficiency-rules-and-live-qr.md` | commits `a0ff84a`, `f1ad622`, `b1ae2d3` | `application_output_approve_for_qr` calls `approveOutputForSharing`, which calls `assertReadyToFinalize`; the finalization gate (409 `tool_category_required`) therefore applies to agents exactly as to the website. |
| `docs/changes/qr-gated-outputs.md` | commits `d78bcda`, `76b33ad` | The QR slug follows the document lineage; an agent approving a newer version moves the same `/r/<slug>`. |
| `docs/changes/cover-letter-agent.md` | v1 | `cover_letter_agent_turn` calls `runTurn`; the agent stays confined to one letter and its package, proposals are not applied until accepted in the website (accept/reject deliberately has no tool). |
| `docs/changes/release-intelligence.md` | v1 | `release_tracker_read` calls `listReleases` / `getReleaseDetail`; admin-only exactly like `/api/release-intelligence`. |
| `docs/changes/no-silent-failures.md`, `docs/changes/failed-commands-reconciliation.md` | commits `8fc685e`, `dd58da6` | Same rule: tool failures come back as MCP errors with status, code and message; tracking failures are reported to the agent, never swallowed. |
| `docs/changes/render-bindings.md` | v1 (design only) | The "render-binding data map + pending changes" tools named in the brief are NOT built: that feature has no code on this branch yet. When it lands, its tools are appended to the registry and its routes get capability rows (the check script fails until they do). |
| CLAUDE.md "Deployment-safety invariants" | - | Block-registry append-only rule is applied to the tool registry (manifest + check). Additive schema only; nothing writes member rows from seed/bootstrap. |

## What changed, in one paragraph

An AI agent can now work in Salt Basin as a real platform user through an MCP server at `/mcp` (official `@modelcontextprotocol/sdk`, Streamable HTTP, stateless). A person creates, names, scopes and revokes personal access tokens on a new **Connected Agents** screen in the World Shell (phone-usable); the token is shown once and only its SHA-256 hash is stored. Every tool call re-checks scope, role, forced password change and Career Portfolio terms, then calls the same server function the matching API route calls. Eleven seed tools cover Career Master read, career opportunities (list, create, open), application outputs (list, open, save a new draft version, approve for QR through the finalization gate), the cover-letter agent (open, one turn) and, for administrators, the release tracker. A **parity map** (`server/lib/capabilityParity.js`, a config registry with no table) lists every capability with its World Shell path, API route and MCP tool; an admin **Capabilities** screen shows it with gaps highlighted, and `scripts/check-interface-parity.mjs` fails when a route in the governed files has no row, when a row points at something that does not exist, or when a shipped tool was removed.

## Data model (additive only)

| Where | What | Notes |
| --- | --- | --- |
| `platform_access_tokens` (new table, `CREATE TABLE IF NOT EXISTS` in `db.js bootstrap()`) | `id, user_id, name, token_hash (unique, SHA-256), token_prefix, scopes JSONB, created_at, expires_at, last_used_at, revoked_at` | Justified new table: no existing table stores a named, scoped, revocable, hashed credential (`sessions` is a cookie session with no name/scope/revocation record). Never seeded; no member rows are written by bootstrap. `scopes` is bound as a raw JS array (JSONB param convention). |
| `SALT_BASIN_TRACKED_INTERACTIONS.resume_career` | appended interaction `mcp_tool_call` | Reuse, no analytics table: `recordMcpToolCall()` in `usageTracking.js` records through `recordInteraction()` when the user has the module's entitlement rod, else inserts the same-shaped `analytics_events` row (`object_type='platform_access_token'`). Metadata `{ tool, tokenId, ok, errorCode }`; the token list's "tool calls" count reads `analytics_events`. |
| `config_state` `admin_nav` | two appended tabs `connected-agents`, `capabilities` (System view) | Additive injection like the existing tabs; keys never renamed. |
| `defaultMemberConfig.js` `memberTabs` | one appended tab `connected-agents` | Existing members get it through `memberConfig.js` GET `/draft`'s read-time additive merge, never a write. |
| `server/data/mcpToolManifest.json` | names of shipped tools | Append-only guard, see below. |

## Server

- `server/lib/platformAccess.js` (new): `createToken` (name 1-80 chars, at least one known scope, optional expiry 1-365 days, max 20 active tokens), `listTokens` (never the secret; per-token tool-call counts), `revokeToken` (own tokens only; a revoked token is never reactivated), `authenticateToken` (HTTP 401 for missing / unknown / revoked / expired; user read fresh on every request), `touchToken`.
- `server/lib/mcpToolRegistry.js` (new, **append-only**): `MCP_SCOPES` (`career.read`, `career.write`, `outputs.approve`, `release.read`) and `MCP_TOOLS` - each `{ name, title, description, inputSchema, scope, permission, api, handler }`. Handlers import their server modules lazily, so the registry can be read without a database.

  | Tool | Scope | Permission | Same function as |
  | --- | --- | --- | --- |
  | `career_master_read` | career.read | user | `GET /api/career/master` (`loadMasterPayloadForOwner`, extracted from the route) |
  | `career_opportunities_list` | career.read | user | `GET /api/career-agents/opportunities` |
  | `career_opportunity_create` | career.write | user | `POST /api/career-agents/opportunities` (`trackCareerOpportunity`, extracted from the route) |
  | `career_opportunity_open` | career.read | user | **new** `GET /api/career-agents/opportunities/:id` (`openCareerOpportunity`) |
  | `application_outputs_list` | career.read | user | `GET /api/career-agents/opportunities/:id/outputs` |
  | `application_output_open` | career.read | user | `GET /api/career-agents/resume-outputs/:id/content` |
  | `application_output_new_draft_version` | career.write | user | `POST /api/career-agents/resume-outputs/:id/versions` |
  | `application_output_approve_for_qr` | outputs.approve | user | `POST /api/resume-outputs/:id/share` (`approveOutputForSharing` -> `assertReadyToFinalize`) |
  | `cover_letter_open` | career.read | user | `GET /api/cover-letters/letters/:id` |
  | `cover_letter_agent_turn` | career.write | user | `POST /api/cover-letters/letters/:id/turns` |
  | `release_tracker_read` | release.read | admin | `GET /api/release-intelligence/releases[/:id]` |
- `server/lib/mcpServer.js` (new): Express router mounted at `/mcp` (before the SPA fallback). Per request: bearer token -> 401 on failure; low-level SDK `Server` + `StreamableHTTPServerTransport` (stateless, JSON responses); `tools/list` returns the tools the token's scopes include; `tools/call` order is unknown tool (404 `unknown_tool`) -> scope (403 `scope_not_granted`) -> role (403 `forbidden`) -> account gates (428 `password_change_required` / `career_terms_required`, via `getAccountGateBlock`) -> argument schema (400 `invalid_arguments`) -> handler. Handler errors keep the status/code the API route would answer (`FinalizationBlockedError` 409 `tool_category_required` with its `details`; `AgentRequestError` statuses; plain errors 400 `bad_request`). Every failure is an MCP result with `isError: true`, text `Error <status> <code>: <message>` and `structuredContent.error`. GET/DELETE answer 405 (stateless). One tracked interaction is recorded per call, success or failure; if recording itself fails the result carries a "Warning" line.
- `server/auth.js`: `getAccountGateBlock(user)` extracted from `enforceCurrentCareerTerms` so the API middleware and MCP share one definition of the first-step gates (behaviour of the middleware unchanged).
- `server/routes/platformAccess.js` (new, mounted `/api/platform`, cookie auth only - a token cannot manage tokens): `GET/POST /tokens`, `DELETE /tokens/:id`, `GET /mcp` (address, scopes, tools), `GET /capabilities` (admin).
- `server/lib/capabilityParity.js` (new): `CAPABILITIES` (43 rows covering the 67 routes of the four governed route files plus the existing career-master and release-intelligence reads), `GOVERNED_ROUTE_FILES`, `evaluateCapabilities`, `summarizeCapabilities`.
- `scripts/check-interface-parity.mjs` (new): see "Verified". `scripts/mcp-call.mjs` (new): a small MCP client (list / call) used by the training spec and as an example for any MCP client.

## Client

- `src/components/admin/ConnectedAgentsPanel.jsx` (new): "How to connect" (address + copy), "Create an access token" (name, scope checkboxes, optional expiry), the once-only secret box, "Your tokens" cards (status, scopes, created / last used / tool calls, inline Revoke -> Confirm revoke), "Tools an agent can call". Errors show in a `role="alert"` and a toast. Phone: single column, controls >= 44px, no horizontal scroll.
- `src/components/admin/CapabilitiesPanel.jsx` (new, admin): summary tiles, All / Gaps only filter, one card per capability with Website / API / MCP cells; gaps use a distinct fill plus the words "GAP"; deliberate non-offerings say "not offered" and why.
- Wiring: `worldIslands.js` (`connectedAgents`, `capabilities` islands), `WorldShell.jsx` (`SIMPLE_EMBED_COMPONENTS`, Journeys card subtitles), `AdminShell.jsx` (`TAB_COMPONENTS`), `api.js` (five calls).

## Behaviour changes to know

- A token acts with its owner's permissions. A scope never grants anything; a member holding `release.read` still gets 403 `forbidden` from `release_tracker_read`.
- `tools/list` shows only tools whose scope the token carries; calling an out-of-scope tool by name is refused with `scope_not_granted`.
- Accepting or rejecting a cover-letter proposal, revoking a QR link, and token management are not tools (see the map: "not offered" or gap). Applying an agent proposal stays a human decision in the website.
- The finalize path is unchanged and shared: approving through MCP is refused with the same gate the website shows, and succeeds with the same QR slug behaviour.

## Verified (initial check)

- `npm run build` passes (Vite production build; `postbuild` skipped with "No Codex sandbox logs").
- The server boots on a fresh Postgres database (the new `CREATE TABLE IF NOT EXISTS` and the admin_nav injection are idempotent; booted five times across resets).
- `node scripts/check-interface-parity.mjs` exits 0; `--strict` exits 1 and lists the recorded gaps; `--self-test` detects all three injected problems.
- Every journey and edge case of the training spec was walked in Chromium on a fresh database, once at 1280x900 and once at 390x844 (touch), through the real website with the MCP steps run by `scripts/mcp-call.mjs` (official SDK client over Streamable HTTP): 64 of 64 checks passed on each viewport, no page errors. The only non-2xx responses were the expected ones listed in the training spec (the 400 validation alerts on `POST /api/platform/tokens` and the 409 finalization gate on `POST /api/resume-outputs/:id/share`).
- A first desktop walk had three timing misses (fixed waits in the walking script, not product defects: the screenshot showed the gate dialog and approval working); the final walks above used explicit waits.

## Known limitations

- Render-binding tools (data map, pending changes) are not built because that feature has no code on this branch yet.
- Gaps recorded in the map (as of this version): 25 capabilities have no MCP tool, 3 have no website screen (`verification-current-edit`, `application-package-import`, `resume-output-staleness`). They are listed with reasons on World Shell -> Capabilities. `--strict` fails until they are closed; the default check passes because every gap is recorded.
- Tokens authenticate `/mcp` only, not `/api/*`.
- The MCP server is stateless: no server-initiated notifications, resources or prompts. Rate limiting of `/mcp` is not added in this version.
- `capabilityParity.js` verifies that routes, tools and rows agree; it cannot prove that a UI path string matches a screen label (that is what the training spec's walk checks).
- A token created before a user's terms lapse keeps working for reads only after the user re-accepts: calls return 428 `career_terms_required` until they do (by design, not separately tested in the spec).

## Fix notes per round

(none yet - appended by fix agents)
