# Change spec — release loop inside the platform

Version 1 · 2026-10-09 · feature key `in-app-release-loop` · release `2026-10-02-application-packages-resume` · branch `release-loop/in-app-release-loop-build`

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| `server/data/releaseLoop/definition.json` | v4, integration head `c3a71b4` (introduced in `2086080`) | The process this feature mirrors in the platform. Read, never rewritten: the shipped file stays the default; platform edits are stored as an override |
| `docs/changes/release-intelligence.md` / `docs/training/release-intelligence.md` | v1, 2026-10-02 | Its `release_*` tables hold releases, rounds, fixes and reconciliation items; this feature writes into them so Release Intelligence shows platform runs with no import step. Its screen is the model for this one |
| `docs/changes/release-loop-tooling.md` / `docs/training/release-loop-tooling.md` | latest, 2026-10-09 | The tracker, workflow and spec-governance tooling. Not changed. That spec's check that `docs/release-process.md` and the skill make no claim of a World Shell "Release loop" view is why those two files are left untouched (see Known limitations) |
| `docs/changes/failed-commands-reconciliation.md` and `definition.json` `failureReconciliation` | 2026-10-02 / v4 | A failure is "unresolved" until a reviewer closes it with evidence: reused as the reconciliation items gate |
| `docs/changes/no-silent-failures.md` | v1.1 | Every action on the screen shows its error inline and in a toast |
| `server/lib/finalizationGates.js`, `src/components/admin/ToolCategoryGate.jsx` | 2026-10-02 | "Mark done" is a finalize path: `assertReadyToFinalize` server-side, `useToolCategoryGate().run` client-side |
| `agent_definitions` (db.js, Phase 1 of Career Placement Agents) | 2026-08-06 | Platform-default roster seeding convention (insert-if-missing, org/owner NULL) |
| `definition.json` `interfaceParity`, `specGovernance` | v3/v4, 2026-10-09 | This spec names, per journey, the UI path, API route and MCP tool; steps carry stable ids when frozen |

Supersedes nothing. No existing table, route or screen changes behaviour.

## What changed, in one paragraph

An admin (or an in-app agent acting through the same server functions) can now run the release loop inside the platform. The **Release loop** screen (World Shell -> Journeys -> Release loop) has three tabs. **Definition** shows the effective process definition, edits it as a new version (the server picks the number; a change note is required) and lists the nine platform agents that carry the loop's roles. **Runs** starts one run per feature per release and walks it through the definition's stages with the gates enforced server-side, with rounds, live validation steps, bugs, fixes, reconciliation items and a history. **Escalations** lists what left the automated loop: bugs that used every fix attempt and bugs that need a business definition.

## Data model (additive only)

- **Reused as-is** (created lazily by `ensureReleaseIntelligenceSchema()`): `release_records` (a run's release; `source = 'platform'`), `release_features` (final status set to `passed` / `not passed`), `release_rounds` (validation rounds, `source_path = 'platform:run:<id>'`), `release_fixes` (fix records, same source path), `release_failed_runs` (the **reconciliation items**; dispositions and class edits reuse `setDisposition`), `release_reconciliation_events` (the audit trail, subject kinds `loop_run` and `loop_bug`).
- **New, created lazily by `ensureReleaseLoopSchema()`** in `server/lib/releaseLoopPlatform.js` (none had a home): `release_loop_runs` (release, feature, stage, status `active | done | not_passed`, fix rounds used, definition version at start), `release_loop_steps` (live validation step log: round, step id, surface, status, note), `release_loop_bugs` (bug key, class, lifecycle status, fix attempts, owner question and answer, JSONB history). Reuse audit result: the tracker snapshot has bugs and steps but only inside the Claude Code session; nothing in the platform stored them.
- **Definition override**: one `config_state` row, id `release_loop_definition` (TEXT JSON, so `JSON.stringify` is correct): `{ definition, history[], restored? }`. The shipped file is the default. Versions only go up (a reset is a new version holding the shipped content).
- **Roles as agents**: nine `agent_definitions` rows, `pipeline = 'release_loop'`, `org_id` and `owner_user_id` NULL: the seven roles of `definition.json` plus `release_reconciler` and `release_scope_reviewer` (named in `failureReconciliation` and `scopeCheck`, which are not in `roles`). Inserted if missing at boot from `server/lib/releaseLoopAgents.js`; an edited or shadowed row is never overwritten. No member row is touched.
- `admin_nav` gains a `release-loop` tab (additive merge, `componentId: releaseLoop`); the island registry gains `releaseLoop` (append-only).

## Gates (server-side, in `releaseLoopPlatform.js`)

| Gate | Rule | Refusal |
| --- | --- | --- |
| Stage graph | A run moves only along the definition's edges (`next`, `onPass`, `onFail`, `onFixable`, `onBusinessDefinition`) plus three the definition leaves implicit: triage -> amend, amend -> integrate, escalate -> triage | 409 naming the allowed targets |
| Done | Latest validation round passed, zero reconciliation items with disposition `open`, no bug in `open`, `fixing`, `fixed_awaiting_retest`, `recurred`, `needs_human` or `needs_business_definition`; also `assertReadyToFinalize(userId)` first | 409 with the list of gaps |
| Round | A round cannot be recorded as passed with steps passed below total, with a failing / page-error / failed-request live step in that round, or with console errors or failed requests above 0 | 409 |
| maxFixRounds | Entering `fix` when the fix rounds used already equal `maxFixRounds` ends the run as `not_passed` (feature recorded `not passed`) instead of moving | 200 with `outcome: not_passed` and the message "Still failing after N fix rounds: recorded as not passed with its open items, never as done." |
| Per-bug attempts | A failed re-test after `maxFixAttemptsPerBug` fix attempts sets the bug `needs_human`; no fix can start or be recorded on it; only a person's decision (`retry` resets attempts to 0, history kept; `backlog`) moves it | 409 |
| Business definition | A `needs_business_definition` bug requires the exact question; it cannot start a fix; escalating needs at least one such bug; the owner's answer returns it to `open` | 400 / 409 |
| Verified | A bug becomes `verified` only through a passing re-test (needs a note) in the validate stage; scope decisions (`backlog_pre_existing`, `reassigned`, `process_note`) need evidence | 400 / 409 |
| Reconciliation | An item closes only with a note; a disposition of `open` can be set back | 400 |

## Server

- `server/lib/releaseLoopDefinition.js`: `loadDefaultDefinition`, `validateDefinition` (required stages, bug statuses, triage classes; `maxFixRounds` 1-10; attempts 1-5; stage targets and roles must exist), `getEffectiveDefinition`, `saveDefinition` (version = current + 1, note required), `resetDefinition`.
- `server/lib/releaseLoopAgents.js`: `buildReleaseLoopRoster`, `seedReleaseLoopAgents(sql)` (called from `db.js bootstrap()` inside its own try/catch).
- `server/lib/releaseLoopPlatform.js`: the single implementation (`getDefinitionView`, `listRuns`, `createRun`, `getRunDetail`, `transitionRun`, `recordRound`, `addStep`, `listSteps`, `createBug`, `startFix`, `recordFix`, `retestBug`, `scopeBug`, `answerBusinessQuestion`, `decideNeedsHuman`, `listEscalations`, `addReconciliationItem`, `resolveReconciliationItem`, `doneGate`).
- `server/routes/releaseLoop.js` mounted at `/api/release-loop` behind `requireAdmin`; `FinalizationBlockedError` is mapped by `sendFinalizationError`. Routes: `GET|PUT|DELETE /definition`; `GET|POST /runs`; `GET /runs/:id`; `POST /runs/:id/transition|rounds|steps|bugs|reconciliation`; `GET /runs/:id/steps?after=`; `PUT /runs/:id/reconciliation/:itemId`; `POST /bugs/:id/start-fix|fix|retest|scope|answer|decision`; `GET /escalations`.

## Client

- `src/components/admin/ReleaseLoopPanel.jsx` (lazy): tabs **Definition**, **Runs**, **Escalations**. One column, 44px minimum controls, no hover-only action, wraps long text (no horizontal page scroll at 390px). Live steps poll `GET /runs/:id/steps?after=<last id>` every 3 seconds while a run is validating; a failed refresh is shown in an alert, not hidden. **Mark done** goes through `useToolCategoryGate().run`.
- Wiring: `WorldShell.jsx` `SIMPLE_EMBED_COMPONENTS.releaseLoop`; `worldIslands.js` `releaseLoop` island (admin, enforced); `AdminShell.jsx` `TAB_COMPONENTS.releaseLoop` and the nav fallback; `api.js` methods; `db.js` nav seed and agent seed.
- `WorldShell.jsx` `SimpleEmbedView`: the **← Back to World** button now has a 44px minimum height (it was 14px, which made every embedded screen fail the phone tap-target rule).

## Interface parity

| Surface | Status |
| --- | --- |
| Website, desktop point-and-click | Complete: every capability above is a button or field on the screen; the definition is editable there |
| Website, 390px phone walkthrough | Complete; the builder walked every journey at 390px |
| API | Complete: the routes above, admin only, same functions as the UI |
| MCP | **Not yet.** `server/lib/mcpToolRegistry.js` does not exist at this commit (the `platform-mcp` feature owns it). The tools to register, each calling the exported function of the same name with the same admin-only permission: `release_loop_get_definition`, `release_loop_save_definition`, `release_loop_list_runs`, `release_loop_start_run`, `release_loop_get_run`, `release_loop_transition_run`, `release_loop_record_round`, `release_loop_log_step`, `release_loop_add_bug`, `release_loop_bug_action`, `release_loop_add_reconciliation`, `release_loop_resolve_reconciliation`, `release_loop_list_escalations`. Recorded as an MCP gap assigned to `platform-mcp` (`definition.json` `interfaceParity`) |

## Behaviour changes to know

- Release Intelligence now shows platform runs as ordinary release records (source `platform`). Its "specs not imported" gaps appear for a platform release until the spec documents are imported there; that is the existing reconciliation rule, not a new one.
- A new release key must start with a date (`YYYY-MM-DD`), as in Release Intelligence.
- Saving the definition in the platform does not change `server/data/releaseLoop/definition.json`; the Claude Code workflow keeps reading the file. Keeping the two aligned is a person's decision (copy the edited version into the file and `docs/release-process.md`).
- Runs started under an older definition keep `definition_version` for the record but are gated by the effective definition at the time of each action.

## Verified (initial check)

- `npm run build` passes. The server boots on a fresh database: the nine `release_loop` agents are seeded, the tables are created on first use, boot logs show only the known fresh-database warnings that predate this change.
- `npm test -- server/lib/releaseLoopDefinition.test.js`: 4 tests pass (shipped definition valid, out-of-range limits refused, bad stage references refused, roster has the nine agents).
- An API script (48 checks) drove every gate over HTTP: stage graph refusal, done gate (no round, failing live step, open reconciliation item, open bug), maxFixRounds -> `not_passed`, per-bug attempts -> `needs_human` -> person's decision, business-definition question and answer, scope evidence, owner/closed-run refusals, unauthenticated 401.
- The builder walked every journey of `docs/training/in-app-release-loop.md` in Chromium on a fresh database, once at 1280px and once at 390px: all steps pass, no page errors; the only failed requests are the 400/409 refusals the spec names. Layout checks (no horizontal scroll, controls at least 44px) pass on both.

## Known limitations

- No MCP tools yet (above).
- The stage graph is shown on the Definition tab but not editable there (roles, summary, gates and both limits are). Stage keys are referenced by the gate logic.
- `definition.json` `tracker` still says "there is no platform screen", and `docs/release-process.md` / the skill do not mention this screen, because `docs/training/release-loop-tooling.md` (journey 1 step 3) fails if they claim one. Proposed follow-up (needs an approved amendment of that spec): update all three together.
- Classic Tools shows no module menu at 390px (existing behaviour), so on a phone the World Shell card is the only path; desktop also has Classic Tools -> PLATFORM LIFECYCLE MANAGEMENT -> RELEASE LOOP.
- Live steps use polling (3 seconds), not push.
- One run per feature per release; a re-run after a spec amendment is a new release key.

## Fix notes per round

None yet.
