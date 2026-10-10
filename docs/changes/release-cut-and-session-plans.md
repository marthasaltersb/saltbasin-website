# Change spec — release cut (frozen per-release history) and session estimates tracked against each merge

Version 1 · 2026-10-10 · feature key `release-cut-and-session-plans` · release `2026-10-10-production-hardening` (0.3.0) · branch `release-loop/release-cut-and-session-plans-build`

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| `scripts/release-cut.mjs`, `scripts/session-plan.mjs` | commit `7d76341` ("Release cut: freeze 0.2.0, open 0.3.0, session estimates tracked against each merge"), 0.2.0 cut | The two command-line tools this feature was first built as. Their behaviour and output text are unchanged; their logic moved into `server/lib/releaseCut.js` so the website, API and MCP run the same code |
| `docs/release-log/releases/<version>/`, `releases/index.json`, `session-plans/*.json` | written by `7d76341` | The only data. Read as they are; the format is unchanged (no migration) |
| `docs/release-log/HANDOVER-0.3.0.md` | 2026-10-10 | Names this feature as unblocked work: "write its training spec and validate it" |
| `tools/release-tracker/index.html` (Release picker, Releases and Sessions panels) | `7d76341`, `docs/changes/live-release-tracker.md` | The published tracker already shows the same two things; this feature adds the in-platform screen next to it and does not change the tracker |
| `docs/changes/in-app-release-loop.md` / `docs/training/in-app-release-loop.md` | v1 / baseline v2 | The **Release loop** screen gains two tabs; its existing tabs, routes and tools are untouched. Closing a session reuses its finalize-gate pattern |
| `docs/changes/platform-mcp.md` / `docs/training/platform-mcp.md`, `server/lib/capabilityParity.js` | v1 | Interface parity: tools are appended to `server/lib/mcpToolRegistry.js` and `server/data/mcpToolManifest.json` (append-only); capability rows added |
| `server/lib/finalizationGates.js`, `src/components/admin/ToolCategoryGate.jsx` | 2026-10-02 | Closing a session is a finalize path: `assertReadyToFinalize` server-side, `useToolCategoryGate().run` client-side |
| `definition.json` `interfaceParity`, `specGovernance` | v4 | Journeys name UI path, API route and MCP tool; steps carry stable ids when frozen as baseline v1 |

Supersedes nothing.

## What changed, in one paragraph

An administrator can now read every release and every session estimate inside the platform, and record estimates and merges there, instead of only with command-line scripts and the published tracker. **World Shell -> Journeys -> Release loop** has two new tabs. **Releases** lists each release (frozen ones as they were cut, the open one as it stands) and opens one to its features, last score and baseline, counts and sessions. **Session plans** lists what each session expected to deliver before it started and the score at each merge, records a new estimate (or a re-estimate with a reason once a merge exists), records a merge (the score is read from the newest validated round, never typed), and closes a session. Cutting a release stays a repository command by design.

## Data model (additive only)

None. No table, column or config row. The data are files already in the repository: `docs/release-log/releases/index.json`, `docs/release-log/releases/<version>/summary.json`, `docs/release-log/active-release.features.json` / `.state.json`, and one `docs/release-log/session-plans/<session>.json` per session. `SB_RELEASE_ROOT` (or `--root <dir>` on the scripts) points the code at another folder holding `docs/`; it is used by the training spec's fixture and defaults to the repository root.

## Server

- `server/lib/releaseCut.js` (new, the one implementation): `listReleases`, `getRelease`, `listSessionPlans`, `getSessionPlan`, `sessionReport`, `recordEstimate`, `recordMerge`, `closeSession`, plus `featureRows` (the per-feature status, score, baseline and bug counts that `release-cut.mjs` writes into `summary.json`; moved here, same output). Errors are `Error`s with `status` and `code` and a message written for the person (for example `Session S-x already recorded a merge, so its estimate is fixed. To change it, give a reason for the re-estimate; the original is kept beside it.`).
- Rules kept from the scripts: an estimate is fixed once a merge is recorded (a later change needs a reason and is stored beside the original in `reEstimates`); saving again before any merge replaces the estimate; the expected score must be `passed/total` with passed no larger than total; size is S, M or L; the feature must be in the open release (or `production`); a merge reads each feature's newest `docs/test-results/<feature>/round-N.md` score block (`passed`, `total`, `baseline`), and a feature with no validated round has `null` scores, never 0; `ifNew` records only when a feature has a newer validated round.
- `server/routes/releaseCut.js` (new, mounted at `/api/release-cut`, `requireAdmin`): `GET /releases`, `GET /releases/:version`, `GET /sessions`, `GET /sessions/report`, `GET /sessions/:session`, `POST /sessions/estimate`, `POST /sessions/:session/merge`, `POST /sessions/:session/close` (runs `assertReadyToFinalize(req.user.id)` first; a gate refusal is 409 `tool_category_required` like every other finalize path). Registered as a governed route file in `capabilityParity.js`.
- MCP (append-only in `server/lib/mcpToolRegistry.js`, listed in `mcpToolManifest.json`): `release_cut_list_releases`, `release_cut_get_release`, `release_cut_list_sessions`, `release_cut_session_report` (scope `release.loop.read`) and `release_cut_record_estimate`, `release_cut_record_merge`, `release_cut_close_session` (scope `release.loop.write`). They call the same functions; `release_cut_close_session` runs `assertReadyToFinalize` first. Existing scopes are reused; none added. Administrators only (a member token gets 403 `forbidden`).
- Parity rows in `capabilityParity.js` (group **Release cut**): `release-cut-read`, `session-plans-read`, `session-plans-write`, `session-plans-close`. The cut itself has no row: it is a repository command (it copies files and rewrites the next release's feature list, with a commit behind it), so it has no website, API or MCP form by design; its result is read through the rows above.
- `scripts/session-plan.mjs` and `scripts/release-cut.mjs` now import the library; flags, output text and exit codes are unchanged. New flag on both: `--root <dir>`.

## Client

- `src/components/admin/ReleaseCutTabs.jsx` (new): `ReleasesTab` and `SessionPlansTab`, wired into `ReleaseLoopPanel.jsx`'s `TABS` (appended after **Escalations**). Every tap target is at least 44px; cards instead of tables so there is no horizontal scroll at 390px; errors are red `role="alert"` boxes in plain words and a toast; closing runs through `useToolCategoryGate().run`.
- `src/lib/api.js`: `listReleaseCutReleases`, `getReleaseCutRelease`, `listReleaseCutSessions`, `releaseCutSessionReport`, `recordReleaseCutEstimate`, `recordReleaseCutMerge`, `closeReleaseCutSession`.

## Behaviour changes to know

- A session that is already closed is refused a second close (409 `already_closed`, "Session <id> was already closed on <date>. A closed session is not changed."); the screen hides the buttons once closed. (The scripts' old `close` overwrote the close time; this is the only difference.)

- The session plan files are written by the server when an administrator uses the screen, API or MCP. On a host with an ephemeral file system (the production web service) those writes do not survive a redeploy; the committed files in the repository are the durable record. Use the command-line tools in a session's worktree for records that must be committed.
- The Releases tab never writes. A frozen release is read from `summary.json` exactly as cut.

## Verified (initial check)

- `npm run build` passes; the server boots against a fresh database (`sb_rl_bld_6600_1`), seeded, with test accounts.
- Every journey of `docs/training/release-cut-and-session-plans.md` walked once in Chromium: Journeys 1 to 5 and the edge cases on desktop (1280px) and as a 390px phone walkthrough; Journeys 6 to 8 as commands (fixture cut, API with admin, member and no cookie, MCP with admin and member tokens); `node scripts/check-interface-parity.mjs` exits 0 and `--self-test` passes (the one remaining gap it lists, `career-scoring-preferences` MCP, predates this feature).

## Known limitations

- Cutting a release is not available from the website, API or MCP (by design, above).
- No in-screen "expected vs actual" summary table beyond the per-item lines on each session card; the report is available through the API and MCP (`sessions/report`, `release_cut_session_report`).
- Closing a session through the finalization gate's refusal path (a technology with no proficiency category) is shared code covered by other specs; this spec's journeys close sessions on an account with no Career Master technologies.

## Fix notes per round

(Appended by fix agents.)
