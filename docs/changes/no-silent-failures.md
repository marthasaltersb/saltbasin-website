# Change spec — No silent failures: snapshot, history, live-data and load errors surfaced

Version 1.1 · 2026-10-02 · feature key `no-silent-failures` · release `2026-10-02-completed-commits`

Version 1.0 was the original build (commits `8fc685e`, `dd58da6`). Version 1.1 is this spec plus two defects the release-loop build walk found and fixed (see "Fix notes" below).

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| `8fc685e` "No silent failures: surface snapshot, history, live-data and load errors" | commit | Built the feature this spec describes |
| `dd58da6` "QR page: never hide the live-data panel; state a missing baseline and failed live load" | commit | Completed it: the QR panel always renders |
| `docs/changes/failed-commands-reconciliation.md` ("Product failures that used to be silent") | 2026-10-02, the table this spec expands | Source list of the six surfaced failures |
| `docs/changes/proficiency-rules-and-live-qr.md` | commits `a0ff84a`, `f1ad622`, addendum `b1ae2d3` | The live QR page, share snapshot/history and the technology-category gate this feature adds error reporting to |
| `docs/training/proficiency-rules-and-live-qr.md` | 2026-10-02 | Journeys 6 and 7 there are the healthy paths; this spec's training journeys are their failure paths |
| `d78bcda` QR-gated tailored application outputs, `76b33ad` clickable QR links | commits | Origin of `share_token`, `shared_snapshot`, `share_history` |

Supersedes nothing. It changes behaviour only on failure paths; no healthy path changed.

## What changed, in one paragraph

Six places used to swallow an error and show something that looked like success or like empty data. Each now says what failed. Rule: a failure is never shown as "no data" or "matches the printed version".

## Data model (additive only)

| Where | What | Notes |
| --- | --- | --- |
| `resume_output_projections.share_sync_error` | `JSONB` `{ at, message }`, nullable | Added in `8fc685e` by an idempotent `ADD COLUMN IF NOT EXISTS` in `server/db.js bootstrap()`. Set when QR history cannot record a Career Master change, cleared by the next successful record. Passed as a raw object, never `JSON.stringify`ed (JSONB convention in `CLAUDE.md`). |
| `unified_outputs.user_id`, `unified_outputs.is_primary` | `BIGINT` / `BOOLEAN`, idempotent `ADD COLUMN IF NOT EXISTS` | Added in v1.1 (fix F-1). No row is written. |

No member row is written by seed or bootstrap.

## Server

- `server/lib/applicationPackages.js`
  - `approveOutputForSharing()` returns `warnings: string[]`. If the chart snapshot at approval cannot be built, the approval still succeeds (the QR must exist) but a warning states the cause and the consequence.
  - `recordShareStateChange()` records `share_sync_error` on every shared output when the live snapshot cannot be built, rethrows, and clears the error on the next successful run (even when nothing changed).
  - `publicSharedView()` returns `liveError` (live snapshot could not be built) and `approvedMissing` (no printed snapshot).
- `server/lib/resumeProjection.js` `listResumeOutputProjections()` exposes `shareSyncError`.
- `server/db.js`: the column above and, in v1.1, the two `unified_outputs` columns.

Finalization still goes through `assertReadyToFinalize()` on the server (`approveOutputForSharing`, `updateProjectionStatus`); this feature does not add a path around it.

## Client

- `src/components/admin/MyResumePanel.jsx`: error toast per approval warning; `role="alert"` line "QR history could not record a Career Master change (…)" on each affected output. `approveForQr` still runs inside `categoryGate.run()` (`useToolCategoryGate().run`).
- `src/components/SharedLiveStates.jsx`: `Notice` alert; "RECORDED DATA" label when live data failed; panel renders when there is neither a snapshot nor live data.
- `src/lib/outputBlocks.js` + `src/components/Output.jsx`: the four career chart blocks (`career-proficiency-bars`, `career-trend-bars`, `career-outcome-tiles`, `career-duration-timeline`) render a "data could not be loaded … a loading error, not missing Career Master data" notice when `ctx.loadErrors` says so.
- `src/components/admin/ToolCategoryGate.jsx`: the technology-category dialog states "Suggestions are unavailable (…)" when `GET /api/career/proficiency` fails.

Configurability: nothing here is a setting. The messages are fixed product copy by design (a failure notice must not be switchable off).

## Behaviour changes to know

- Approving for QR with a failed snapshot is **not** blocked. It succeeds, and warns. The QR page for that output then says the printed baseline is missing, permanently, until a later version is approved while Career Master is healthy.
- The QR banner reads "RECORDED DATA" instead of "LIVE DATA" while live data cannot be loaded, but keeps the sentence "matches the approved printed version" / "N changes since…", which then compares only recorded states.
- `share_sync_error` is cleared for all of a member's shared outputs by the next successful record, including a QR page view that detects no change.

## Verified (initial check)

Release-loop build walk, 2026-10-02, local Postgres, fresh database, Chromium, fictional data only (the walk is `docs/training/no-silent-failures.md`, every journey):

- `npm run build` passes; the server boots on a fresh database.
- Fault A (`career_jobs` renamed) and Fault B (`career_proficiency_assertions` renamed) injected with `psql`; every notice in the training spec observed with the exact text recorded there; both tables restored; the next save cleared every error and live data returned.
- Console/network during the walk: only the requests the faults cause (HTTP 500 on `/api/career/*`, 409 on the first approval of an uncategorised tool) and `GET /api/members/me/profile` 404 for a member with no profile row (unrelated, pre-existing).

## Known limitations

- The QR banner still says "matches the approved printed version" under the "RECORDED DATA" label; it does not repeat that the comparison is against recorded states only. The amber alert above it does.
- Career charts in the Output Template editor's chart gallery are a separate feature. In this build there is no screen that adds a career chart block to a template, so the template-chart journey needs a one-time fixture (training spec precondition P4). The notice itself is exercised on the real `/output/resume` page.
- Other `/output/*` pages (case study, portfolio, etc.) still read Career Master through `fetchCareerMaster()` in `src/lib/careerMaster.js`, which converts a failed response into an empty master. Those pages are not covered by this feature. Not changed here.
- Still silent, pre-existing and listed in `failed-commands-reconciliation.md`: Career Atom sync (`syncSingleEntry`/`removeEntryEvidence`) and several fire-and-forget audit-log writes.
- While `career_jobs` is missing, the Career Master screen cannot list entries (its own toast says so); a save made in an already-open edit dialog succeeds in the database but the list does not refresh.
- A pre-existing issue outside this feature: `/output/resume` shows built-in placeholder resume content when the member has no primary template. Not changed.

## Fix notes per round

### Build walk (before round 1)

- **F-1 (defect, fixed).** On a fresh database `POST /api/output-templates` returned 500 (`column "user_id" does not exist`) and `GET /api/output-templates/primary` 500: `routes/outputTemplates.js` reads and writes `unified_outputs.user_id` / `is_primary`, which only databases with the (never-committed) output_templates consolidation have. Fix: idempotent `ADD COLUMN IF NOT EXISTS` for both in `server/db.js`. Without it the template-chart journey cannot be set up on a fresh database.
- **F-2 (defect, fixed).** The template output charts showed "Not enough dated Career Master records to show a trend yet." and "No dated roles in Career Master yet." when `/api/career/master` failed with 500, only the proficiency chart showed the loading-error notice. Cause: the initial load in `useOutputTemplateConfig` (`src/components/Output.jsx`) used `fetchCareerMaster()`, which maps any failed response to an empty master, so `loadErrors.master` was never set (only the refresh path used a strict fetch). Fix: always use the strict fetch (checks `r.ok`). Re-walked: all three charts show the notice.
- Environment note: database `sb_rl_bld_2` was already held by another agent's server (port 3404); this walk used `sb_rl_bld_2_nsf` on port 3804 instead.
