# Reconciliation - release-intelligence build (branch release-loop/release-intelligence-build, commit 01a4062)

Checked by reading code on the branch, re-running `npm test -- server/lib/releaseLogParser.test.js` (14 of 14 pass) and `npm run build` (passes; postbuild skip notice only). Items 1-6 are the build agent's reported list; G1-G5 are gaps it missed.

| # | Item | Kind | Status |
|---|---|---|---|
| 1 | Compound `source && export && nohup` refused by isolation guard | environment | resolved (nothing ran; no state change) |
| 2 | Compound command writing start.sh with `$S` refused | environment | resolved (nothing ran) |
| 3 | `npx jest` needs `--experimental-vm-modules` | test_harness | resolved (`npm test` re-run by me: 14/14) |
| 4 | start.sh not executable, nohup "Permission denied" | test_harness | resolved (reset.sh runs it via bash; server booted) |
| 5 | Combined `git add/commit; kill; dropdb` refused | environment | resolved (re-run as separate commands; commit 01a4062 exists with the Opus 5.5 trailer) |
| 6 | Reused scripts in `/var/tmp/sbpg/agents/bld-4400-1/` | process | resolved (no other agent's files touched; outside repo) |
| G1 | Admin-nav entry points added | owner_direction_conflict | unresolved |
| G2 | Commits not reconciled | requirement_gap | unresolved |
| G3 | No release-log/test-result/triage records for this feature; "Fix notes per round: (none yet)" | process | unresolved (expected until the loop runs) |
| G4 | Spec "Known limitations" not-built items | requirement_gap | unresolved (see below) |
| G5 | Admin-only screen validated as admin | informational | resolved (acceptable, see below) |

## Unresolved

### G1. Admin navigation entries although the owner said everything comes from the World Shell (owner_direction_conflict)
- Step: change spec "Client / Reachability" and training spec line 8 ("Also reachable from Classic Tools -> Platform Lifecycle Management -> Release Intelligence").
- Evidence: `git diff HEAD~2 HEAD` adds (a) `releaseIntelligence` to `TAB_COMPONENTS` and `FALLBACK_ADMIN_NAV` in `src/components/admin/AdminShell.jsx`, and (b) an `admin_nav` tab insert in `server/db.js bootstrap()` (`release-intelligence`, view `plm`). Prior triage (`career-bound-outputs-build-reconciliation.md` G1, `qr-gated-outputs-build-reconciliation.md`) records the same pattern as a conflict. The World Shell island itself is correct (`worldIslands.js` `releaseIntelligence`, `WorldShell.jsx` `SIMPLE_EMBED_COMPONENTS`, training Journey 1 starts at `/world`).
- Root cause: the salvaged partial build added a second, admin-nav entry point alongside the island.
- Files: `src/components/admin/AdminShell.jsx`, `server/db.js` (the comment line plus the `release-intelligence` tab row), `docs/changes/release-intelligence.md`, `docs/training/release-intelligence.md` (line 8), `CLAUDE.md` (the 4 added lines if they mention Classic Tools).
- Proposed fix: remove the `TAB_COMPONENTS` entry, the `FALLBACK_ADMIN_NAV` tab and the `db.js` nav insert (the shared `admin_nav` row on any DB that already ran it is additive and harmless; do not delete it from live data). Keep the World Shell island as the only entry point. Update both specs and re-validate Journey 1. Note `WorldShell.jsx` imports the panel directly, so removing the AdminShell import breaks nothing.

### G2. "Commits" do not reconcile to master outputs (requirement_gap)
- Step: request says outputs "plus commits" reconcile to a release record.
- Evidence: `server/lib/releaseReconcile.js` has checks for specs, versions, Traces-to, validation, last round, rounds count and open failed runs only. Commit shas are stored per round (`release_rounds.commit_sha`) and Traces-to commit refs are parsed (`releaseLogParser.js` ~line 94) but never checked against git, never listed on the release record, and fix commits are not recorded. The change spec does not list this as a limitation.
- Root cause: commit handling stopped at storing the sha text.
- Files: `server/lib/releaseReconcile.js`, `server/lib/releaseLogImporter.js`, `server/lib/releaseIntelligence.js`, `src/components/admin/ReleaseIntelligencePanel.jsx`.
- Proposed fix: add a `release_commits` view/columns (sha, subject, date, release, feature) filled by an optional `git log` pass in `scripts/import-release-logs.mjs` (importer script only; the server must not shell out), and a reconciliation check "every sha named in a round or Traces-to is a known commit, or flagged unverified". Never guess: an unresolvable sha is a gap. Add a training journey step.

### G3. No loop records for this feature (process)
- Evidence: `docs/test-results/`, `docs/triage/` and the release log have no `release-intelligence` entries; spec "Fix notes per round" says "(none yet)". The branch is based on an older integration head (`3fdc308`), so the integration branch has moved (`fe28090`); a merge will be needed before validation counts.
- Proposed fix: run validation round 1 against the training spec from `/world` as admin, write `docs/test-results/release-intelligence/round-1.md`, then triage. Merge or rebase onto the integration head first and rebuild.

### G4. Known limitations that are real gaps against the request (requirement_gap)
- Tokens/minutes exist only when a tracker snapshot is imported manually; older releases show "n/r". The request asks for trends "where recorded", so this is honest, but there is no automatic ingest from `scripts/release-tracker-sync.mjs` output; a release without a hand-run import never gets tokens. Proposed fix: a documented one-step path (importer reads the tracker snapshot file the sync script already writes, for a named release) or an on-screen "import latest snapshot" that takes a pasted file (already present); confirm with the owner whether manual is acceptable.
- Failure rows from the snapshot take only the snapshot's class; others are `unclassified` until a reviewer edits them. Acceptable by contribution-intelligence convention (no guessing) but means the Failure classes chart is mostly "unclassified" until reviewed. Proposed fix: owner decision; optionally a suggested-class rule table in Settings, never auto-applied.
- `POST /import/repository` reads `docs/` relative to the server cwd; undeployed `docs/` means script-only. Informational, accepted.
- Approval has no second reviewer. Accepted as design unless the owner asks otherwise.
- Charts place releases on equal-spaced categories labelled by date, not on a true time axis; releases months apart look adjacent. Minor: the request says "dated trend charts"; acceptable but note for the owner.

## Resolved and informational notes
- G5: the screen is admin-only (`requireAdmin`, island `requiredRole: 'admin'`), so validating as `admin` rather than `member@test.local` is correct; the finalize path uses `assertReadyToFinalize` and the tool-category gate as the spec says.
- Reuse audit: separate `release_*` tables are justified in the spec (platform-internal, no member scope); no Channel Journey rod added. Basis labels (OBSERVED tokens, INFERRED minutes, no cost shown, n/r never zero) match the contribution-intelligence conventions.
- Usage-limit agent death is a first-class `interrupted` state (`releaseLogParser.js` lines 134 and 351-362; unit-tested).
- Public repo: the diff adds no `server/data/applicationPackages/*` file and the specs use fictional data (garden/orchard names).
- Commit trailers on e4f85ca and 01a4062 are Opus 5.5 as the task rule requires; nothing pushed.
