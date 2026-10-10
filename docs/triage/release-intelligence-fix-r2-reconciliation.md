# Reconciliation: release-intelligence fix round 2 (branch release-loop/release-intelligence-fix-r2)

## Reported item 1: "deadlock detected" on first boot of a fresh database
- kind: environment (race between two processes bootstrapping the same fresh DB). Status: resolved for this release (no code change required), with a latent pre-existing platform note below.
- Evidence: `server/db.js:6071` runs `await bootstrap()` at module import, and there is no advisory lock (grep for `pg_advisory` finds nothing). `scripts/create-test-member.mjs` imports `server/db.js`, so running it while the server is still booting starts a second concurrent bootstrap. I reproduced this: two processes importing `server/db.js` at the same time against a fresh database, and one failed with `duplicate key value violates unique constraint "pg_type_typname_nsp_index"`, which is the same race class as the reported deadlock. The other process finished. The create-test-member header says to run it after the server has booted once, so the harness order was the cause. The fix agent's recreate-and-reboot workaround is valid. The race does not touch release-intelligence code.
- Note (informational, not a blocker): concurrent first boot of a fresh DB is unguarded. A pg advisory lock around `bootstrap()` would harden it. This is out of scope and does not affect existing members, because bootstrap is idempotent on a live database.
- Test database dropped and all processes finished.

## Gaps from the change spec "Known limitations" that the reported failures missed
1. Approval is the platform administrator's, with no second-reviewer step (informational / requirement_gap candidate). The definition.json spec-governance two-person rule covers spec amendments, not release approval, so this is not blocking. Status: unresolved only if the owner wants a second reviewer. Needs an owner decision. Do not guess.
2. `POST /import/repository` reads `docs/` relative to `process.cwd()`. A deployment without `docs/` must use paste or the script (informational, documented).
3. Importer accepts only the release-loop Markdown shapes, and unknown layouts import with warnings (informational, documented).
4. Tokens and minutes exist only for releases with an imported tracker snapshot. Older releases show "n/r" (informational, matches the "not recorded is never zero" rule).
5. Validation-bug rows from the snapshot take the snapshot's class. Other failure rows are `unclassified` until a reviewer picks one (informational).
6. Pre-existing `db.js` notice `idx_cover_letter_turns_proj already exists` on a fresh database (informational, unrelated). Also the `organization_profiles` FK ordering bug in CLAUDE.md, which is pre-existing.

## Previously fixed items checked in the branch
- RI-R1-7 MCP_GAP: `mcpToolRegistry.js` has the release_* tools (32 matches), and `server/routes/releaseIntelligence.js` is under parity governance in `capabilityParity.js` (line 24).
- B7 owner direction (World Shell only): `AdminShell.jsx:182` hides the `release-intelligence` tab from Classic Tools. The World Shell island is kept. No remaining conflict found.

Unresolved items requiring a fix agent: none. One owner question: does release approval need a second reviewer?
