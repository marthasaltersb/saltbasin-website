# Reconciliation - platform-mcp - fix round 4

Branch `release-loop/platform-mcp-fix-r4` (head 9994121). Reconciliation agent rec-16100-5. No code changed, nothing committed.

## Reported item

**"I did not boot the server, so no browser walk of J10.4 and no live MCP call to the two new tools (list_ingest_log, webhook_secret) was run."**

- kind: test_harness (an unrun check, not a defect). Status: resolved for the MCP half; one residual browser walk noted below.
- Evidence (fresh database `sb_rl_rec_16100_5`, port 16110, server stopped and database dropped afterwards):
  - `node scripts/check-interface-parity.mjs --strict` exits 0: 121 of 121 capabilities, UI/MCP/API gaps 0, 274 governed routes, 216 tools = manifest 216. `--self-test` OK.
  - Admin token with scopes release.read + release.write, then `scripts/mcp-call.mjs`:
    - `list` shows all 11 `release_tracker_*` tools, including `release_tracker_list_ingest_log` and `release_tracker_webhook_secret`.
    - `release_tracker_list_ingest_log {"limit":5}`: isError false, `{log: []}`, same as `GET /api/release-tracker/ingest-log`.
    - `release_tracker_webhook_secret {}`: isError false, secret generated. `{"clear":true}`: `{cleared:true}`. Same as `POST /settings/webhook-secret` (server/routes/releaseTracker.js 139-143).
  - Code read: `server/lib/mcpToolRegistry.js` lines 931-936 call `listIngestLog` / `setWebhookSecret` / `generateWebhookSecret`, the route's own functions, `permission: 'admin'`. Create-token runs `assertReadyToFinalize` for kind `share`, as the route does.
  - `GET /api/platform/capabilities` (admin): summary `{total:121, full:121, uiGaps:0, mcpGaps:0, apiGaps:0}`. The Gaps only list is computed from this, so J10.4 has zero gaps to show.
- Residual: the Capabilities screen was not driven in Chromium (Gaps only "No gaps" message, 1280 and 390 px). That message (round 2, T3) has never been browser-checked. The validator's next round covers it.

## Round 4 triage items status (docs/triage/platform-mcp-round-4.md)

| id | step | kind | status | evidence |
| --- | --- | --- | --- | --- |
| platform-mcp-r4-T1 | J10.4 / J11.2 exit code | product_defect | resolved | strict check exits 0, live calls above |
| platform-mcp-r4-T2 | J1.4 scope checkboxes | requirement_gap (spec) | unresolved | no amendment filed |
| platform-mcp-r4-T3 | J2.1 tool list | requirement_gap (spec) | unresolved | no amendment filed |
| platform-mcp-r4-T4 | J6.2 release.read list | requirement_gap (spec) | unresolved | no amendment filed |
| platform-mcp-r4-T5 | J11.2 count line | requirement_gap (spec) | unresolved | no amendment filed |

`docs/spec-amendments/platform-mcp/` holds only A1-A6; none covers J1.4, J2.1, J6.2 or J11.2 for the current state (A5 pinned 6 scopes / 96 tools / 72 of 72 at 7e301b7 and is stale). The fix agent may not edit the frozen spec, and its report did not mention these.

## Items the reported failures missed

1. **Amendments for J1.4, J2.1, J6.2, J11.2 (T2-T5).** kind: requirement_gap, unresolved.
   - rootCause: registry, scopes and parity map grew append-only after A5. At this head: 18 scopes, 216 tools, 121 parity rows; a career.read + career.write + outputs.approve token sees 126 tools; release.read now also carries the tracker read tools, so J6.2 must be recounted at the tested commit.
   - files: docs/spec-amendments/platform-mcp/ (new A7). No edit to docs/training/*.md or baselines.
   - proposedFix: write A7 with exact values recounted with `scripts/mcp-call.mjs list` (token A and a release.read token) and the scope labels from `GET /api/platform/mcp` at the tested commit; J11.2 first line `Interface parity: 121 of 121 capabilities work in all three interfaces (website UI gaps: 0, MCP gaps: 0, API gaps: 0).` A reviewer other than the proposer approves. Prefer asserting the scope boundary plus the count over a 126-name ordered list.

2. **Stale change-spec text.** kind: process, unresolved.
   - docs/changes/platform-mcp.md overview and Known limitations still say 141 tools / 87 of 87 and "render-binding tools are not built" (they are registered now). docs/changes/live-release-tracker.md line 66 still says `mcpToolRegistry.js` does not exist and registration is an MCP_GAP (the round 4 triage asked for removal).
   - proposedFix: update both to 216 tools / 121 of 121 and list the 11 `release_tracker_*` tools with scopes. (The "not registered yet" comment in releaseTrackerService.js is already gone.)

3. **Stale alerts stack on Connected Agents** (round 4 validator observation, J1.4). kind: product_defect (minor UX), unresolved. files: src/components/admin/ConnectedAgentsPanel.jsx. proposedFix: replace the error state instead of appending; clear it on success.

4. **Capabilities > Gaps only browser walk never run (J10.4).** kind: informational, unresolved (verification pending, data verified).

## Known limitations in docs/changes/platform-mcp.md

Listed exclusions (binary downloads, file uploads, accept/reject cover-letter proposals, terms consent, token management, Career Master seed, push ingest by bearer ingest token) await owner confirmation; they are not defects and no new one was added. Tokens authenticate /mcp only and the server is stateless, by design. No admin-navigation entry points were added in this round (World Shell only), so no owner_direction_conflict.
