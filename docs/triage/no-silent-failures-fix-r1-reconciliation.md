# Reconciliation: no-silent-failures, fix round 1 (branch release-loop/no-silent-failures-fix-r1, commit 7be432e)

Checked by reading the diff and code, and `npm run build` (passes). No server was started; nothing to clean up. No code or spec changed.

## Reported item

| # | Reported | Kind | Status |
| --- | --- | --- | --- |
| R1 | "Did not walk the failed journey steps in the browser; round-2 validator should confirm J3.4 and the banner." | process | unresolved |

Evidence: the fix is present. `src/lib/toast.js` now gives `toast.error` class `sb-toast sb-toast-error`, `role="alert"` and a 6000 ms default; `toast.success` gets `role="status"`. `src/brand.css:474-480` styles the error toast for both `.sb-toast` and `.sb-admin-shell .sb-toast` (specificity higher than line 269, so it wins). `SharedLiveStates.jsx` prints "RECORDED DATA - ... (live data unavailable)" and "Live career data could not be loaded, so these charts show the last recorded state." when live is false, healthy text unchanged. This covers T2 and T9 only. Nothing was run in a browser, so it is not "verified working" and stays unresolved until round 2 passes J3.4 and J2.2/J2.3.
Step: J3.4, J2.2. Proposed fix: none in code; round-2 validator re-walks them.

## Gaps the report missed (from round-1 triage and the change spec)

| # | Item | Kind | Status |
| --- | --- | --- | --- |
| G1 | T1 / J5.2: `/output/resume` shows "No dated roles" for a signed-in member | product_defect | unresolved |
| G2 | T3-T8 spec errors (J2.2, J3.2, J4.1, J1.2/J3.1/J5.1, E.1, E.4), plus RESTORE using `ALTER TABLE IF EXISTS` | process | unresolved |
| G3 | T10 coverage gaps: new steps J2.3 and J5.2b | process | unresolved |
| G4 | Known limitation: other `/output/*` pages still turn a failed Career Master load into an empty master | requirement_gap | unresolved |
| G5 | Known limitation: Career Atom sync and fire-and-forget audit-log writes still silent | requirement_gap | unresolved (pre-existing, out of scope) |
| G6 | Known limitation: stale list after a save in an already-open dialog while `career_jobs` is missing | informational | unresolved (accepted) |
| G7 | MCP_GAP: approve-for-QR, History and career reads have no MCP tool (`server/lib/mcpToolRegistry.js` absent) | requirement_gap | unresolved (belongs to platform-mcp) |

### G1 (J5.2)
Evidence: commit 7be432e touches only toast.js, brand.css, SharedLiveStates.jsx and the change spec. `src/components/Output.jsx:1150-1176, 1222-1231` still send `owner` only when the URL has one, and `grep ownedByViewer` finds nothing in `src/` or `server/`. The server falls back to the default admin for master and rollups, while proficiency and the primary template are session-scoped.
Root cause: owner resolution mismatch between master/rollups and the session-scoped endpoints.
Files: `src/components/Output.jsx` (useOutputTemplateConfig), `server/routes/outputTemplates.js` (`/primary`).
Proposed fix: as in triage T1. Return `ownedByViewer: true` from `/api/output-templates/primary` when the row came from the `user_id` branch; use `effectiveOwner = owner || (ownedByViewer ? 'me' : '')` for master, rollups and resume-rollups, and make those effects depend on it. Do not change the server fallback (public pages rely on it).

### G2 and G3
Class spec_error and coverage_gap. Only the amendment reviewer may act, via docs/spec-amendments/no-silent-failures/ (that folder does not exist yet). Proposed amendments are written out in docs/triage/no-silent-failures-round-1.md, T3-T8 and T10. Frozen baseline v1 stays byte-for-byte unchanged until approved by a reviewer other than the proposer.

### G4
Files: `src/lib/careerMaster.js` `fetchCareerMaster()`, called from Output.jsx (about lines 1402, 1696, 2015, 2501, 2911, 3014, 3230, 3370). Proposed fix: make a strict fetch the default, keep the cache, and show the same "loading error, not missing Career Master data" notice on case study, portfolio and the other pages. Needs an owner decision on scope; the change spec marks it as not covered.

### G5
Files: `server/lib/careerAtomMigration.js` (`syncSingleEntry`, `removeEntryEvidence`), fire-and-forget audit writes in `server/routes/careerMaster.js`. Listed in failed-commands-reconciliation.md. Proposed fix: log and surface a sync-error marker like `share_sync_error`.

### G7
Proposed fix: add MCP tools when `mcpToolRegistry.js` exists, calling the same server functions with the same permissions.

## Owner-direction check
The round-1 fix adds no admin-navigation entry points and no admin-only journey. No owner_direction_conflict.

## Verdict
Round 2 is needed. Before it: fix G1 (code), and have the amendment reviewer process G2/G3.
