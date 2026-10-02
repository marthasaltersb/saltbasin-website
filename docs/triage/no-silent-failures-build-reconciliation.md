# Reconciliation — No silent failures (build 8fc685e, dd58da6)

Reconciled 2026-10-02 against branch `release-loop/no-silent-failures-build` (head f1ebf29). Source: `/var/tmp/sbpg/fail-a1a32d6576e815900.json` (11 items, numbered 1-11 below). Evidence is from reading code on the branch; no code changed, no server started.

## Reported items

| # | Reported | Kind | Status | Evidence |
|---|---|---|---|---|
| 1 | Bash commands refused by worktree guard; re-issued simply | process | resolved | Nothing ran, nothing changed (agent report). No repo state. |
| 2 | DB sb_rl_bld_2 held by another agent; used sb_rl_bld_2_nsf, dropped it | environment | resolved | Change spec "Fix notes" records it; own DB dropped, other's untouched. |
| 3 | 404 at / because NODE_ENV not production | environment | resolved | Dev mode does not serve dist/. Spec should say to run with NODE_ENV=production (G6d). |
| 4 | Login 429 (10 per 15 min) | test_harness | resolved | `server/routes/auth.js:28` limiter max 10 / 15 min, in memory. Training spec already says sign in once and reuse the session. |
| 5 | Playwright timeouts: rate limit; modal needs Cancel (Escape does not close) | test_harness | resolved | Script issues; spec already names the Cancel button. |
| 6 | Script picked the wrong `<select>` | test_harness | resolved | No product change. |
| 7 | `POST /api/output-templates` 500 (`user_id` missing) on fresh DB | product_defect | resolved | Fixed as F-1: `server/db.js:3056-3057` `ADD COLUMN IF NOT EXISTS user_id / is_primary`. Additive, no row written. Present on branch. |
| 8 | Template page showed "Not enough dated records" with career_jobs broken | product_defect | resolved | Fixed as F-2: `src/components/Output.jsx:1212-1225` uses a strict fetch and sets `loadErrors`. Present on branch. Only covers the template-config path (see G3). |
| 9 | Faults injected by renaming tables; restored; share_sync_error left; printed snapshot permanently missing | informational | resolved | Confined to the dropped test DB. The permanently missing baseline is the documented "Behaviour changes" item, not a defect. |
| 10 | `GET /api/members/me/profile` 404 for member with no profile row | informational | resolved | Pre-existing, listed as expected noise in the training spec. |
| 11 | Other `/output/*` pages use `fetchCareerMaster()`, turning failure into an empty master | requirement_gap | UNRESOLVED | `src/lib/careerMaster.js:24` `.catch(() => ({jobs:[],...}))`; callers `Output.jsx:19`, `blocks/index.jsx:2167,3319,3933,5334,5408`, `MyResumePanel.jsx:561`. See G3. |

### Item 11 / G3 (unresolved)
- step: any `/output/*` page (case study, portfolio, public career blocks) or My Resume while Fault A (career_jobs renamed) is active.
- rootCause: `fetchCareerMaster()` swallows non-OK responses and returns an empty master, so a failure renders as "no data", which the request says must never happen. `MyResumePanel.jsx:561` also swallows a failed master load.
- files: `src/lib/careerMaster.js`, `src/components/blocks/index.jsx`, `src/components/Output.jsx`, `src/components/admin/MyResumePanel.jsx`.
- proposedFix: give `fetchCareerMaster` an error result (or add a strict variant), have each caller carry an error state and render the same "loading error, not missing Career Master data" notice. Add a training journey for it.

## Gaps the reported failures missed

All unresolved.

- **G1 owner_direction_conflict — training spec drives an admin account.** `docs/training/no-silent-failures.md` P1 says "Sign in as the test admin". Every journey is a member feature (Career Master, My Resume, QR). step: P1 and each journey sign-in. rootCause: spec written against the admin. files: `docs/training/no-silent-failures.md`. proposedFix: sign in as `member@test.local` (from `scripts/create-test-member.mjs`) everywhere; no journey needs admin.
- **G2 owner_direction_conflict — entry points and setup are not reachable from the World Shell / UI.** The spec standard requires "reachable from the UI — no API-only configuration", and the owner direction is that everything comes from the World Shell. The spec (a) starts at `/member?workspace=1&scope=member`, mentioning `/world` -> Classic Tools only in a parenthesis; (b) P3 needs a CLI import script; (c) P4 needs a browser-console `fetch` POST; (d) faults are `psql` commands. files: `docs/training/no-silent-failures.md`. proposedFix: start every journey from `/world` and navigate through the World Shell; keep fault injection but label it an explicit out-of-band harness step; replace P3/P4 with UI paths or mark them as the open requirement in G4.
- **G3 requirement_gap** — see item 11 above.
- **G4 requirement_gap — no UI to add a career chart block to a template.** Spec "Known limitations": Output Templates has no control adding career charts, so Journey 7 needs a console-POST fixture. The template chart load-error check cannot be reached by a user. files: `src/components/Output.jsx` and the Output Templates editor. proposedFix: add the chart-gallery control, or include career charts in the default primary resume template; then drop P4's console fixture.
- **G5 requirement_gap — QR banner wording under "RECORDED DATA".** Banner still says "matches the approved printed version" without stating the comparison is against recorded states only (spec limitation). files: `src/components/SharedLiveStates.jsx`, training spec expected text. proposedFix: when `liveError` is set, say the comparison is between recorded states only.
- **G6 requirement_gap / informational — remaining silent paths and spec accuracy.** (a) Career Atom sync (`syncSingleEntry`/`removeEntryEvidence`) and fire-and-forget audit-log writes remain silent (pre-existing, listed in `failed-commands-reconciliation.md`). (b) While `career_jobs` is missing, a save from an already-open Career Master dialog succeeds but the list does not refresh. (c) `/output/resume` shows placeholder content when there is no primary template (pre-existing). (d) Training spec lacks "run with `NODE_ENV=production npm start`" and a database-name-collision note; add them under "Where things are".

## Summary
Resolved: items 1-10 (two real defects, F-1 and F-2, verified present in the branch code). Unresolved: item 11 and G1-G6 (G1, G2 owner-direction conflicts; G3-G6 requirement gaps). The feature should not be marked passed until G1 and G2 are corrected in the training spec and the owner decides whether G3-G5 are in scope.
