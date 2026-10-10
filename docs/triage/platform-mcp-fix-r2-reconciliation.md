# Platform MCP, fix round 2 reconciliation

Branch checked: `release-loop/platform-mcp-fix-r2` (e83bb96, detached worktree on integration head). The fix is one commit, a one-line change in `src/components/admin/CapabilitiesPanel.jsx`, plus a change-spec note.
Checked myself: `node scripts/check-interface-parity.mjs --strict` (72 of 72, 110 tools, exit 0), `release-spec-baseline.mjs check --all` (platform-mcp v3 matches), code read of the panel. I did not start a server or a browser.

| # | Reported | Kind | Status | Evidence |
|---|---|---|---|---|
| 1 | Browser selfCheck of J10.4 not performed (no server or DB started); build and code reading only | process | resolved (code), browser confirmation deferred to the validator | `CapabilitiesPanel.jsx:81` renders `<div role="status">No gaps: every capability works on the website, in the API and as an MCP tool.</div>` when `data && !error && gapsOnly && rows.length === 0`. `rows` is filtered by `!r.full`, and the parity check shows 72 of 72 full, so Gaps only yields zero rows and the message shows. All capabilities never shows it (rows non-empty). Spec [J10.4] expects "the message that there are no gaps (zero cards)", which the text satisfies. The fix agent said so honestly, and the change spec says re-validation must confirm. Not a product defect. |

## Gaps the reported failure missed

| Gap | Kind | Status | Evidence / fix |
|---|---|---|---|
| G1. `docs/changes/platform-mcp.md` "Known limitations" (lines 84-91) is stale: it says 25 MCP gaps and 3 website gaps remain, `--strict` fails, and rate limiting is not added. All false now (strict exit 0, rate limiting built in B11). The overview (11 tools, 43 rows) and the Data model rows for the `admin_nav` / `memberTabs` entries also describe pre-fix state. Raised in round 1, still open. | process | unresolved | Rewrite those sections. Not a frozen spec. |
| G2. Render-binding tools (data map, pending changes) not built; feature has no code on this branch. | requirement_gap | unresolved, blocked | Listed in Known limitations. When `renderBindingRegistry` lands, add tools and rows to `capabilityParity.js`. Ask the owner whether this blocks the release. |
| G3. Recorded non-tool exclusions (file uploads, PDF/ZIP/docx/QR downloads, consent, maintenance seeds, accept/reject of a cover-letter proposal, QR revoke, token management) vs the owner's "every capability". | owner_direction_conflict (possible) | unresolved | Needs the owner to confirm each exclusion. |
| G4. Parity check cannot prove a UI path string matches a screen label. | test_harness | resolved as informational | Covered only by the browser walk; the new screens are in the v3 baseline. |
| G5. Tokens authenticate `/mcp` only; server stateless (no notifications, resources, prompts). | informational | resolved | Deliberate, stated in the change spec. |
| G6. 428 `career_terms_required` after terms lapse, "by design, not separately tested". | requirement_gap (coverage) | unresolved | Confirm J6.7-J6.9 from amendment A1 are in baseline v3 and walked; if not, add. |

## Fix agent next steps
1. Update the stale sections of `docs/changes/platform-mcp.md` (G1).
2. Re-validate [J10.4] in Chromium at 1280x900 and 390x844 (Capabilities, Gaps only, expect the status message and zero cards).
3. Owner decisions on G2 and G3.
