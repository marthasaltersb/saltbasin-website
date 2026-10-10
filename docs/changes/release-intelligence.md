# Change spec — release reconciliation, failed-run states and contribution intelligence trends

Version 1 · 2026-10-02 · feature key `release-intelligence` · release `2026-10-02-release-intelligence` · branch `release-loop/release-intelligence-build`

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| `server/data/releaseLoop/definition.json` (v1) and `docs/release-process.md` | commits `2086080`, `ac66592`, `f400e0f` | Defines the outputs this feature reconciles (change spec, training spec, test results, triage, release log, reconciliation report) and their folders (`logLocations`) |
| `scripts/release-tracker-sync.mjs` | commits `ac66592`, `03b359e` | The tracker snapshot shape the importer reads (`agents[].tokens`, `startedAt`/`lastActivityAt`, `failures`, `features[].lastResult`, `bugs[].history`) |
| `docs/changes/failed-commands-reconciliation.md` | 2026-10-02 | Origin of the "nothing fails silently" rule; its process-failures table is itself imported as real failed runs |
| `docs/changes/no-silent-failures.md` | v1.1, commits `8fc685e`, `dd58da6`, `f1ebf29` | Same rule inside the product: every action here shows its error inline |
| `docs/changes/chart-gallery.md` | v1, commit `6dd06e5` | `src/lib/careerCharts.js` tokens and the validated categorical palette reused by the trend charts |
| `docs/changes/world-shell-opportunity-outputs.md` | 2026-10-02 | World Shell "embed island" pattern used to mount the screen |
| `.claude/skills/salt-basin-contribution-intelligence/SKILL.md` | conventions | Never state inferred time or cost as observed; label the basis; never flatten missing data into zero |
| Partial work from an earlier agent that died at a usage limit (`/var/tmp/sbpg/salvage-release-intelligence-limit.diff`, 16 files, ~2500 lines, never tested) | reviewed and reused | See "Salvage review" below |

Supersedes nothing. No existing table, route or screen is changed in behaviour.

## What changed, in one paragraph

Build, design and session outputs under `docs/` (change specs, training specs, test results, triage and reconciliation reports, release logs) and the release tracker snapshot are now filed into additive `release_*` tables and reconciled to a **release record**: its features, the spec versions each traces to, validation status per round, fixes, and failed runs. Failed, refused, partial and interrupted commands and failed agent runs (including an agent that died at a usage limit) are first-class rows that stay open until a reviewer gives them a disposition with a note. A new admin screen shows the records and **dated trend charts** (tokens, time, rounds-to-pass, failure classes) with a **timeline slider** across releases.

## Salvage review (the earlier agent's untested work)

Reused after review and testing: the schema, config, parser, importer, reconciliation, query layer, routes, panel and chart module. Defects found by the walk and fixed here:

- The `WorldShell.jsx` hunk did not apply (the file had moved on); re-applied by hand (lazy import plus an entry in `SIMPLE_EMBED_COMPONENTS`).
- `scripts/import-release-logs.mjs` (named in the brief) did not exist; written.
- A reviewer could change a failed run's disposition but not its class, and a re-import overwrote the class; the class is now editable on the row and survives re-import (a reviewer decision is never overwritten).
- An agent that stopped at a usage limit was indistinguishable from any other failure; it is now state `interrupted` with its own wording.
- Plural forms ("1 rounds", "1 runs") fixed in checks and chart tooltips.
- Import errors for user mistakes (release log without a date, snapshot without agents, missing release key) returned HTTP 500; now 400.
- The parser test used `@jest/globals`; it runs with the repo's `npm test` (jest), 14 tests pass.

## Data model (additive only)

Created lazily on first use by `ensureReleaseIntelligenceSchema()` (`server/lib/releaseIntelligenceSchema.js`), all `CREATE TABLE IF NOT EXISTS`; nothing in `bootstrap()` writes rows and no existing row or table is touched.

| Table | Holds |
| --- | --- |
| `release_records` | One row per release (`release_key` unique, `release_date`, `status` open/approved, `approved_by/at/note`) |
| `release_features` | A feature in a release: final status, the release log's declared rounds and spec versions, tracker status and open bugs |
| `release_rounds` | One validation round per feature (commit, date, steps passed/total, console errors, failed requests, report path) |
| `release_fixes` | A fix per bug and round, with files |
| `release_failed_runs` | Failed/refused/partial/interrupted commands, failed agent runs, validation failures. State, class, description, state it left, `disposition` (+ note, by, at) |
| `release_metrics` | One row per agent run: role, round, tokens (input / cache-write / cache-read / output), elapsed minutes, start/end. Null when not recorded, never zero |
| `release_outputs` | Each imported document: kind, feature key, spec version, date, parsed "Traces to", content, hash |
| `release_reconciliation_events` | Append-only history of imports, links, dispositions, approvals, reopenings |

Rows an import produces carry `source_path` + `source_key`; re-importing a source replaces only its own rows. A reviewer's disposition, class, and output-to-release link survive.

Reuse audit (`salt-basin-channel-journey-architecture`): the Channel Journey substrate models member/organization work (rods, Tributaries, Atoms); release records are platform-internal build records with no member scope, so no rod type was added. `build_progress_snapshots` is a backlog statistic and `raw_events` / `contribution_events` are per-session human-versus-AI evidence, so neither can carry a release's features, rounds or failed runs without bending its meaning; the new tables hold only what those lack. Configurable rules use the existing `config_state` row mechanism (`release_intelligence_rules`, TEXT JSON).

## Server

- `server/lib/releaseLogParser.js` (pure, tested): classifies a path by the configured folders and parses release logs, test results, triage and reconciliation reports, specs (version line, "Traces to"), and the tracker snapshot. Anything unparseable is returned as a warning, never guessed.
- `server/lib/releaseLogImporter.js`: `importDocument`, `importSnapshot`, `importRepository`, `attributeOrphans`. Idempotent by content hash.
- `server/lib/releaseReconcile.js` (pure): the per-feature checks (change and training spec present, declared versions match the files, Traces-to targets resolve, validated, last round passed, rounds match the log, no open failed run).
- `server/lib/releaseIntelligence.js`: queries and actions (release detail and list, create release, add feature, record failed run, set disposition, link output, approve, reopen, trends).
- `server/lib/releaseIntelligenceConfig.js`: defaults + validated overrides (run states, dispositions, failure classes, default token measure, max chart series, log folders).
- `server/routes/releaseIntelligence.js`, mounted at `/api/release-intelligence` behind `requireAdmin`.
- `scripts/import-release-logs.mjs`: command-line importer for the repository docs and an optional tracker snapshot (`--snapshot file --release key`); prints every status and warning, exits non-zero on any error.

## Client

- `src/components/admin/ReleaseIntelligencePanel.jsx`: tabs Trends, Releases, Failed runs, Outputs, Import, Settings. Every action shows its error inline in an alert and as a toast.
- `src/lib/releaseCharts.js`: stacked bar charts in the `careerCharts.js` styling (same tokens, same validated palette, 24px bars, rounded data end, 2px gaps, SVG `<title>` on every mark), one value axis per chart, up to five series then "Other", a highlighted selected release, and an "n/r" marker for a release with nothing recorded.
- Reachability: World Shell -> Journeys -> **Release Intelligence** only (`worldIslands.js` `releaseIntelligence`, `WorldShell.jsx` embed registry). There is no Classic Tools entry (owner direction, bug B7): `AdminShell.jsx` has no `TAB_COMPONENTS` entry or fallback nav item, and any `release-intelligence` tab in the stored `admin_nav` row is hidden from Classic Tools at render time (`withoutHiddenTabs`). The additive `db.js bootstrap()` insert stays, because World Shell islands resolve from `admin_nav` tabs; the row is the island's source, not a Classic Tools entry, and is never deleted from the shared row.

## Behaviour changes to know

- **Finalize path.** Approving a release reconciliation is a finalize action: client `useToolCategoryGate().run(() => api.approveReleaseRecord(...))`, server `assertReadyToFinalize(req.user.id)` before `approveRelease`. On top of that gate the server refuses approval with HTTP 409 `release_not_reconciled` and the list of gaps while any check fails. Reopening needs a written reason.
- **Basis labels** (contribution-intelligence convention). Tokens are OBSERVED (read from transcripts by the tracker); elapsed minutes are INFERRED from each agent's first to last recorded activity, not active time; no spend or cost is calculated or shown anywhere. A release (or agent) with nothing recorded shows "n/r" or "not recorded", never zero.
- A feature whose log says "passed" but has no recorded validation round is a gap, not a pass.
- A failed run is never deleted by an import: it can only be given a disposition (`reconciled`, `superseded`, `accepted_known_issue`) with a note.
- Anything configurable (states, dispositions, classes, folders, chart defaults) is edited on the Settings tab, not in code.

## Verified (initial check)

- `npm run build` passes. The server boots on a fresh database (`sb_rl_bld_4400_1`, all `release_*` tables created on first use, admin seeded).
- `npm test -- server/lib/releaseLogParser.test.js`: 14 tests pass (paths, every document kind, traces, tracker tokens only when recorded, usage-limit detection).
- Walked every journey of `docs/training/release-intelligence.md` once in Chromium (Playwright) from an empty database: 64 checks, all pass. No page errors; the only failed requests are the 400/409 refusals the spec names, plus a blocked web-font request (`net::ERR_CERT_AUTHORITY_INVALID`) that is sandbox noise.
- `node scripts/import-release-logs.mjs` run twice: 22 files `imported`, then 22 `unchanged`.

## Known limitations

- The importer reads Markdown tables and headers in the shapes the release-loop skill produces; a log in another layout imports with warnings (shown) rather than being guessed at.
- Tokens and minutes exist only for releases whose tracker snapshot was imported; older releases show "n/r".
- Rows the tracker snapshot creates for validation bugs take the class the snapshot gives (`defect`, ...); other failure rows are `unclassified` until a reviewer picks a class on the row.
- `POST /import/repository` reads the `docs/` folders relative to the server's working directory; a deployment that does not ship `docs/` should use document paste or the command-line script.
- Approval is the platform administrator's; there is no second-reviewer step.
- The `fresh database` notices from `db.js` (`idx_cover_letter_turns_proj already exists`) are pre-existing and unrelated.

## Fix notes per round

(none yet)

## Fix notes - round 1

- **RI-R1-1** (E.1): added a validated `generatedFiles` rule (default `release-tracker.md`, `updates.md`, editable on the Settings tab) to `releaseIntelligenceConfig.js`; `importRepository` in `releaseLogImporter.js` reports those files as `skipped` lines instead of erroring. Real release logs without a date still refuse (E.3). Checked: the import script run twice against a fresh database exits 0, 110 files read, 0 errors, two `skipped` lines.
- **RI-R1-3**: in `ReleaseIntelligencePanel.jsx` the shared input style now has `boxSizing: border-box; minWidth: 0; maxWidth: 100%`, every hardcoded `minWidth` input became `width: 100%` with a `maxWidth`, and `Field`/label/card have `minWidth: 0`.
- **RI-R1-4**: every table is wrapped in a `TableScroll` (`overflowX: auto`, `maxWidth: 100%`).
- **RI-R1-5**: the three auto-fit grids use `minmax(min(100%, Npx), 1fr)`; `releaseCharts.js` unchanged.
- **RI-R1-6**: `S.root` got `minWidth: 0; boxSizing: border-box; overflowX: hidden` as a guard. Checked in Chromium at 390px as admin, World Shell -> Journeys -> Release Intelligence, all six tabs: card left edge 24, right edge 366, no horizontal-scroll ancestor, no element past the card outside a scroll wrapper. `WorldShell.jsx` needed no change.
- **RI-R1-7** (MCP_GAP): not fixed here. `mcpToolRegistry.js` is not on this branch; the tools stay assigned to platform-mcp per definition.json. No file changed.
- **release-intelligence-B7**: removed the `TAB_COMPONENTS` entry and lazy import and the fallback-nav item from `AdminShell.jsx`; `withoutHiddenTabs` hides a `release-intelligence` tab from Classic Tools at render time (non-destructive, `admin_nav` stays additive-only). The `db.js` bootstrap insert is kept: World Shell islands resolve from `admin_nav` tabs, so removing it also removed the World Shell island (found by trying it; the island vanished). Change spec reachability line updated. Checked: the island is present in the World Shell Journeys list and opens.

## Fix notes — round 2

- **RI-R1-7** (MCP_GAP, recurrence): the tools were never written, and the route file was not under parity governance, so the check passed with 17 of 19 routes unreachable over MCP. Added 16 admin-only tools to `server/lib/mcpToolRegistry.js` (`release_create`, `release_feature_add`, `release_approve`, `release_reopen`, `release_failed_runs_list`, `release_failed_run_record`, `release_failed_run_dispose`, `release_outputs_list`, `release_output_link`, `release_trends_read`, `release_import_document`, `release_import_snapshot`, `release_import_repository`, `release_config_read`, `release_config_save`, `release_config_reset`). Each calls the same `releaseIntelligence.js` / `releaseLogImporter.js` / `releaseIntelligenceConfig.js` export as its route. `release_approve` runs `assertReadyToFinalize` first, and a `FinalizationBlockedError` or an unreconciled release comes back as an `isError` result with status 409. The snapshot tool accepts an object or a JSON string and answers 400 on invalid JSON. The repository import takes no path and uses `process.cwd()` only. New scope `release.write`; reads use `release.read`. Added `server/routes/releaseIntelligence.js` to `GOVERNED_ROUTE_FILES` and eight parity rows in `server/lib/capabilityParity.js`. Files: `server/lib/mcpToolRegistry.js`, `server/lib/capabilityParity.js`, `server/data/mcpToolManifest.json` (16 names appended).
  Checked: `check-interface-parity.mjs --update-manifest`, then the plain check (80 of 80, 152 governed routes, 126 tools, manifest 126) and `--self-test` (3 of 3 detected). Over `/mcp` on a fresh database, each tool was compared with the matching API response: lists and reads equal, the bad-JSON snapshot gives the same 400 message, approve of an unreconciled release gives the same 409 `release_not_reconciled` as the API, and a member token is refused with 403 on both a write and a read tool. `npm run build` passes.
