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

An AI agent can now work in Salt Basin as a real platform user through an MCP server at `/mcp` (official `@modelcontextprotocol/sdk`, Streamable HTTP, stateless). A person creates, names, scopes and revokes personal access tokens on a new **Connected Agents** screen in the World Shell (phone-usable); the token is shown once and only its SHA-256 hash is stored. Every tool call re-checks scope, role, forced password change and Career Portfolio terms, then calls the same server function the matching API route calls. Eleven seed tools cover Career Master read, career opportunities (list, create, open), application outputs (list, open, save a new draft version, approve for QR through the finalization gate), the cover-letter agent (open, one turn) and, for administrators, the release tracker. Fix rounds 1 and 3 grew the registry to 141 tools: route-backed tools run each website route's own handler in-process (`mcpRouteInvoker.js`, `mcpRouteTools.js`), so every API capability has a tool except the deliberate exclusions listed under Known limitations. A **parity map** (`server/lib/capabilityParity.js`, a config registry with no table) lists every capability with its World Shell path, API route and MCP tool; an admin **Capabilities** screen shows it with gaps highlighted, and `scripts/check-interface-parity.mjs` fails when a route in the governed files has no row, when a row points at something that does not exist, or when a shipped tool was removed.

## Data model (additive only)

| Where | What | Notes |
| --- | --- | --- |
| `platform_access_tokens` (new table, `CREATE TABLE IF NOT EXISTS` in `db.js bootstrap()`) | `id, user_id, name, token_hash (unique, SHA-256), token_prefix, scopes JSONB, created_at, expires_at, last_used_at, revoked_at` | Justified new table: no existing table stores a named, scoped, revocable, hashed credential (`sessions` is a cookie session with no name/scope/revocation record). Never seeded; no member rows are written by bootstrap. `scopes` is bound as a raw JS array (JSONB param convention). |
| `SALT_BASIN_TRACKED_INTERACTIONS.resume_career` | appended interaction `mcp_tool_call` | Reuse, no analytics table: `recordMcpToolCall()` in `usageTracking.js` records through `recordInteraction()` when the user has the module's entitlement rod, else inserts the same-shaped `analytics_events` row (`object_type='platform_access_token'`). Metadata `{ tool, tokenId, ok, errorCode }`; the token list's "tool calls" count reads `analytics_events`. |
| World Shell entry points | `PLATFORM_ISLAND_TABS` in `src/lib/worldIslands.js` (round 1) | No `admin_nav` / `memberTabs` entry is added any more (the original injection was removed in round 1, B10); already-stored rows are never deleted or rewritten. |
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
- `server/lib/capabilityParity.js` (new): `CAPABILITIES` (87 rows as of round 3, covering the 167 governed routes), `GOVERNED_ROUTE_FILES`, `evaluateCapabilities`, `summarizeCapabilities`.
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
- Parity map as of round 3: 87 of 87 capabilities have a recorded status and `check-interface-parity.mjs --strict` exits 0 (141 tools, 167 governed routes). Capabilities without an MCP tool are recorded as explicit `mcpExclusion` rows, shown on World Shell -> Capabilities, and are waiting for the owner to confirm each one or ask for a tool (they are not claimed as parity):
  - binary downloads (QR image, stamped .docx, PDF from the live QR page): a tool cannot return a file the way the website saves it; the data equivalents exist (`shared_output_live_read`, the approve tool's URL);
  - file uploads (pipeline workbook import, document import into an opportunity, add a resume to a package from a file, intake uploads): MCP arguments are JSON; the agent files content with `application_output_new_draft_version`;
  - accept / reject a cover-letter proposal: a human decision made in the website, by design;
  - Career Portfolio terms (consent): a personal decision; MCP calls return 428 until it is made;
  - token create / list / revoke: credentials are managed by a signed-in person; a token can never mint or revoke tokens;
  - the one-time Career Master definition seed (`POST /api/career/seed`): platform maintenance.
- Closed in round 3: public/shared Career Master reads (`career_catalogs_read`, `career_public_rollup_read`), site metadata sync (`career_site_metadata_sync`), the MCP connection info (`platform_mcp_info`) and the parity map (`platform_capabilities_map`, administrators).
- Tokens authenticate `/mcp` only, not `/api/*`.
- The MCP server is stateless: no server-initiated notifications, resources or prompts. `/mcp` is rate limited (round 1, B11): failed token attempts per IP and requests per token.
- `capabilityParity.js` verifies that routes, tools and rows agree; it cannot prove that a UI path string matches a screen label (that is what the training spec's walk checks).
- A token created before a user's terms lapse keeps working only after the user re-accepts: calls return 428 `career_terms_required` until they do.

## Fix notes per round

### Fix notes - round 1

Branch `release-loop/platform-mcp-fix-r1`. The frozen spec and baselines are untouched; spec changes are proposed in `docs/spec-amendments/platform-mcp/` (A1-A3).

**platform-mcp-B5 - interface parity for every capability.**
- What changed: all 25 MCP gaps and 3 website gaps are closed; `check-interface-parity.mjs --strict` now exits 0 (65 of 65 capabilities, 90 tools, manifest updated append-only). 56 tools were appended. They are the MCP face of existing routes and run each route's OWN handler in-process (`server/lib/mcpRouteInvoker.js`: a synthetic request carrying `platformUser`, honoured by `getUserFromCookie` only for that request, so `requireUser` / `requireAdmin`, ownership checks, validation, the finalization gate and error statuses are exactly the website's; failures keep the route's status/code/message/details; binary routes answer 415). The tool table is `server/lib/mcpRouteTools.js` (agent hub, scores, approve, advance stage, research, qualification gates read/save, schedule, outreach x6, resume generate/file/list/queue/auto-queue, legacy cover letter x2, output view and email, resume outputs list/generate/staleness/versions/status/finalization-check, cover-letter settings/packages/turns/metrics, rollup policy previews, intake runs, mappings, bounded agent action, and `career_record_list/create/update/delete` over the eight Career Master record types). Deliberately still not tools (recorded exclusions in the map): file uploads, PDF/ZIP/docx/QR downloads, consent, maintenance seeds. `mcpServer.js` validation also now enforces `enum`. Three website screens: **My Resume > Check freshness** (staleness result beside each output), **My Resume > Import an application package** (JSON file, optional link to an opportunity, visible result or error), **Journeys > Qualification Rules** (administrators; new World Shell-only island `qualificationRules`, saves through `PUT /api/career-agents/verification-current`).
- Files: `server/lib/mcpRouteInvoker.js`, `server/lib/mcpRouteTools.js`, `server/lib/mcpToolRegistry.js`, `server/lib/mcpServer.js`, `server/lib/capabilityParity.js`, `server/data/mcpToolManifest.json`, `server/auth.js`, `src/components/admin/QualificationRulesPanel.jsx`, `src/components/admin/MyResumePanel.jsx`, `src/components/WorldShell.jsx`, `src/lib/worldIslands.js`, `src/lib/api.js`.
- Checked: `--strict` exit 0 and `--self-test` OK; against a fresh database with a real token, called 14 of the new tools through `scripts/mcp-call.mjs` (reads, a create, and error paths: invalid stage keeps the route's 400 message, missing record 404, member calling the admin tool 403 `forbidden`, `meta-options` as a member 403 from the route's own `requireAdmin`, unknown resource refused by enum). In Chromium at 1280x900 and 390x844: package import card shows a visible result (`Package has no outputs.` for an empty fictional package), Check freshness shows `Up to date with your Career Master.`, the administrator's Qualification Rules page shows red alerts for an unknown check type and for invalid JSON, a member sees no Qualification Rules card, the Capabilities screen reads 65 of 65, no horizontal scroll, no page errors. Four baseline steps describe the old gap state (J2.1, J10.4, J11.2, E.5): proposed as amendment A3, not edited.

**platform-mcp-B10 - Connected Agents / Capabilities reachable only from the World Shell.**
- What changed: the `admin_nav` injection of `connected-agents` and `capabilities` was removed from `db.js bootstrap()`, the `memberTabs` entry from `defaultMemberConfig.js`, and the two `TAB_COMPONENTS` entries (and lazy imports) from `AdminShell.jsx`. Because World Shell islands were derived from nav tabs, the entry points now come from `PLATFORM_ISLAND_TABS` / `withPlatformIslandTabs()` in `src/lib/worldIslands.js` (Connected Agents for everyone, Capabilities and Qualification Rules for administrators), merged in `WorldShell.jsx`; a stored tab with the same componentId still wins. Already-stored config rows are not deleted or rewritten (additive-only invariant).
- Files: `server/db.js`, `server/data/defaultMemberConfig.js`, `src/components/admin/AdminShell.jsx`, `src/lib/worldIslands.js`, `src/components/WorldShell.jsx`.
- Checked: fresh database, member's Journeys shows Connected Agents and not Capabilities; administrator's shows both plus Qualification Rules; Connected Agents page opens (desktop and phone). A dev database whose `admin_nav` already stores the old two tabs keeps them (they now render nothing in Classic Tools; remove them by editing the nav, they are not part of the supported entry points).

**platform-mcp-B11 - rate limiting on /mcp.**
- What changed: `makeHitCounter()` added to `server/lib/rateLimit.js` (additive). `/mcp` counts only failed bearer-token attempts per IP (10 per 15 minutes, the website login's limit; env `MCP_AUTH_FAIL_MAX`) and requests per token (300 per minute, a tool call is 2-3 HTTP requests; env `MCP_CALL_MAX`). Both answer HTTP 429 with `Retry-After` and a JSON-RPC error whose `data.code` is `rate_limited`. A locked-out address is refused before the token is read (also for a valid token), as login does.
- Files: `server/lib/mcpServer.js`, `server/lib/rateLimit.js`.
- Checked: with the failure limit lowered to 4, the fifth bad token returned 429 (`401 401 401 401 429`) and a valid token from the same address was then refused with 429 and `retryAfter` 900; with the per-token limit lowered to 30 a burst of calls returned 429 with the retry time, and with the default no call in the walks was limited.

**platform-mcp-B12 - account gates on tools/call (428) lack a spec step.**
- What changed: no product change (the behaviour exists). Proposed amendment `docs/spec-amendments/platform-mcp/A1.json` adds J6.7-J6.9 (withdraw terms, expect 428 `career_terms_required` from a tool call, accept again, expect success). A2 adds the rate-limit step E.7 for B11. The frozen spec and baseline were not edited (`release-spec-baseline.mjs check --all` passes).
- Checked: amendment files are valid JSON; baseline check passes.

## Fix notes — round 2

**platform-mcp-r2-T3 - Gaps only showed a blank area when there were no gaps ([J10.4]).**
- What changed: `CapabilitiesPanel.jsx` now renders a status message ("No gaps: every capability works on the website, in the API and as an MCP tool.") when Gaps only is selected, data has loaded, there is no error and zero rows match. All capabilities is unchanged.
- Files: `src/components/admin/CapabilitiesPanel.jsx`.
- Checked: `npm run build` passes. The condition is `gapsOnly && rows.length === 0` on loaded data, so All capabilities (rows non-empty) never shows it. A full browser walk at 1280x900 and 390x844 was not run in this fix round; re-validation should confirm it.

## Fix notes — round 3

**platform-mcp-F2-2 - change spec out of date after fix round 1.**
- What changed: the overview paragraph, the data model table (removed the `admin_nav` / `memberTabs` injection rows that round 1 removed), the parity-map row count and the Known limitations section were rewritten to the current state (141 tools, 87 capabilities, rate limiting present, exclusions listed by name instead of "25 gaps").
- Files: `docs/changes/platform-mcp.md`.
- Checked: counts compared with `node scripts/check-interface-parity.mjs --strict` output (87 of 87 capabilities, 167 governed routes, 141 tools).

**platform-mcp-F2-4 - exclusions narrowed the owner's direction ("accessible through MCP").**
- What changed: every exclusion that is data-shaped was turned into a tool, appended to the registry: `career_catalogs_read`, `career_public_rollup_read`, `career_site_metadata_sync` (route-backed, the route's own handler), `platform_mcp_info` and `platform_capabilities_map` (administrators; same data as the two `/api/platform` routes). The mixed "site metadata sync and definition seeding" row was split so the seed route has its own explicit exclusion instead of borrowing the sync tool. Binary downloads, file uploads, accept/reject of proposals, consent, token management and the seed stay as named exclusions: these are not buildable as JSON tools or are deliberate security/consent decisions, so they need the owner's explicit confirmation (listed in Known limitations); no exclusion was added or widened.
- Files: `server/lib/mcpRouteTools.js`, `server/lib/mcpToolRegistry.js`, `server/lib/capabilityParity.js`, `server/data/mcpToolManifest.json`.
- Checked: `check-interface-parity.mjs --strict` exits 0 and `--self-test` passes; on a fresh database with a member token, `platform_mcp_info`, `career_catalogs_read` return data, `career_public_rollup_read` for an unknown slug returns the route's 404, and `platform_capabilities_map` as a member returns 403 `forbidden`.
