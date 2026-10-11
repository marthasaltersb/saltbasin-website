# Release log — 2026-10-10-production-hardening-resume

Integration branch: `claude/zealous-meitner-5tuft5`. Process definition: `server/data/releaseLoop/definition.json`. Recorded 2026-10-11 by the release recorder. Nothing pushed.

This log covers two resume runs of the loop. Run 1 covered **session-mapping**, picking up at round 6. Run 2 covered **owner-error-messages**, round 1. No sweep was run in either (`sweep: null`).

## Final results

| Feature | Run | Status | Last round | Score | Baseline | Commit tested | Open blocking items |
|---|---|---|---|---|---|---|---|
| session-mapping | 1 | **passed** | 7 | 56 / 56 | v3 | `aca458d` | none |
| owner-error-messages | 2 | **passed** | 1 | 25 / 25 | v1 | `1032699` | none (8 open bugs, none mapped to a baseline step; see that section) |

**Features that did NOT pass in these runs: none.** Only session-mapping and owner-error-messages were in scope. Every other feature in `active-release.features.json` is outside this log; their state is in `docs/release-log/active-release.state.json` and the tracker, and this log makes no claim about them.

---

## session-mapping

Title: After-session context / prompt / cache / memory mapping with token, spend and time trends.
Status: **passed** (round 7, 56/56 on baseline v3).

### Rounds

| Round | Baseline | Commit tested | Steps passed / total | Not run | Result | Report |
|---|---|---|---|---|---|---|
| 6 | v2 | `1032699cf11fb7d00646b79dfb85ff1414dceca8` | 55 / 56 | none | failed (E.1) | [round-6.md](../test-results/session-mapping/round-6.md) |
| 7 | v3 | `aca458d` | 56 / 56 | none | **passed** | [round-7.md](../test-results/session-mapping/round-7.md) |

Score comparison across versions: rounds 6 and 7 ran on different baselines. The only change between v2 and v3 is amendment **A2** (step E.1 expected text changed; 55 step ids identical, none added, none retired, 56 scored steps in both). Only because of that amendment are the two scores compared like for like. Earlier rounds (1-5) are on v1/v2 and are not compared here.

#### Round 6 (baseline v2) — 55 / 56

Failure:

- **[E.1]** (desktop + mobile) Import, Analysis JSON `{not json`, File analysis.
  - Expected (v2): red message starting "The analysis is not valid JSON:" (HTTP 400), nothing filed.
  - Observed: red alert, HTTP 400, nothing filed, reading "The analysis could not be read because part of its text is mistyped or missing. Check for a missing comma, quote or bracket, fix it, then try again." with a second line "Technical detail: Expected property name or '}' in JSON at position 1 (line 1 column 2)". The wording follows the owner plain-error direction of 2026-10-10, so it no longer starts with the frozen text.
  - Evidence: `/var/tmp/sbpg/release-loop/session-mapping/round-6/desktop-E.1.png`, `mobile-E.1.png`, `steps.jsonl`, `refusals-desktop.json`.

Observations (not scored failures):

- E.8 and the MCP scan gap are fixed: the UI shows the red "Cannot read transcripts folder ... ENOENT" alert with HTTP 400 on desktop and phone; `session_mapping_import kind=scan` returns `isError: true`, status 400, same message.
- MCP parity verified on desktop and phone: 10 `session_mapping_*` tools listed with a UI-created token; config, sessions (5), trends (totalSessions 5), proposals applied (demo-commit-1) and failures match UI/API; `session_mapping_config_save {rules:{nope:1}}` gives `isError: true` with an unknown-rule-key message.
- Classic Tools -> Platform Lifecycle Management lists no Sessions entry on desktop or phone (B7 / F2-2 / F3-1 verified).
- Hook with `DATABASE_URL` unset exits 0 silently and spools a metrics-only file (0 occurrences of transcript text); nothing files it automatically, only Scan (F3-4 unchanged; no step covers it).
- F5-5 not fixed: the frozen spec parity table still marks the six MCP tools as planned while the registry has 10 tools; needs an amendment (see Proposed amendments below).
- F5-4 partly seen: on the phone a toast overlaps content for a few seconds (`mobile-J5.3.png`, `mobile-E.8.png`); cosmetic.
- J6.4 queue order after Restore defaults differs from J4.1 order; J6.4 names no order, scored as pass.

#### Round 7 (baseline v3) — 56 / 56

No failures, nothing not run. `release-spec-baseline.mjs check` passed (`baselines match: session-mapping v3`). E.1 passes on desktop and mobile with the A2 text. Validator val-15700-5, fresh database per surface, production build, desktop 1280x900 and phone 390x844.

Observations carried from round 6 (not scored):

- Frozen spec parity table still labels the `session_mapping_*` MCP tools as planned although 10 exist (context text only).
- On the 390px phone, transient toasts overlap content for a few seconds (cosmetic).

### Triage

Round 6 triage report path given by the triage agent: `docs/triage/session-mapping-round-6.md`; scope report: `docs/triage/session-mapping-round-6-scope.md`. **Both files are missing** from the checkout, every worktree and git history (see "Failed / refused commands and gaps" below). The triage content as returned by the triage and scope agents is recorded here in full.

| Item | Step | Class | Scope | Owner |
|---|---|---|---|---|
| session-mapping-r6-E.1 | [E.1] | spec_error | other_feature (fixed here by amendment) | owner-error-messages |

- **Root cause:** `server/lib/sessionMapping.js:320` builds the message with `jsonProblemMessage('analysis', e)` (`server/lib/friendlyErrors.js:3-7`), introduced by commit `2d4e7be` under the owner plain-error rule of 2026-10-10 (`docs/changes/owner-error-messages.md`). The frozen step text (`docs/training/session-mapping.md:114`, baselines v1/v2) still expected the old raw-parser wording that the owner direction forbids. Product behaviour (red, HTTP 400, nothing filed, desktop, phone and MCP) is correct.
- **Files:** `server/lib/sessionMapping.js`, `server/lib/friendlyErrors.js`, `docs/training/session-mapping.md`, `docs/training/baselines/session-mapping/v2.json`.
- **Proposed fix:** no code change; amend E.1 (became A2).
- **Scope evidence:** commit `2d4e7be` (feature owner-error-messages) changed the one line from the raw "The analysis is not valid JSON: <parser msg>" to `jsonProblemMessage('analysis', e)`. Before that commit the step passed, so this is not pre-existing. Scope says other_feature, but it failed a frozen step of this feature, so it was resolved here through amendment A2. owner-error-messages is not in the listed owner keys but is the real owner.

### Fixes

No code fixes in this resume. The only change was spec amendment A2.

### Spec amendments

| Id | Status | Round | Baseline | What changed | Proposer | Reviewer | Commit |
|---|---|---|---|---|---|---|---|
| A1 | approved | 3 | v1 -> v2 | [B7] now: reachable from the World Shell only; Classic Tools -> Platform Lifecycle Management does not list Sessions. | (earlier session) | amend:session-mapping:r3 | `17c9139` |
| A2 | approved | 6 | v2 -> v3 | [E.1] expected text: "Expect a red message starting **The analysis could not be read because part of its text is mistyped or missing.** followed by a second line starting **Technical detail:** (HTTP 400); nothing is filed." (was: starting **The analysis is not valid JSON:**). Stricter: adds the second-line requirement. | triage:session-mapping:r6 | amend:session-mapping:r6 (approved 2026-10-11) | `786200b` on `release-loop/session-mapping-spec-r6` |

Files: [A1.json](../spec-amendments/session-mapping/A1.json), [A2.json](../spec-amendments/session-mapping/A2.json). A2 traces to the owner direction of 2026-10-10 (CLAUDE.md Frontend conventions), `docs/changes/owner-error-messages.md` and `docs/training/owner-error-messages.md` line 9. Reviewer is a different role from the proposer, as required.

**Proposed amendment, not yet raised (validator observation F5-5):** the spec's interface-parity table still marks the `session_mapping_*` MCP tools as planned while 10 are registered. Context text only, no scored step depends on it, so it does not block. Needs an amendment file in `docs/spec-amendments/session-mapping/` before it can change.

### Validator drift

None found. Both rounds scored against the pinned baseline (v2 in round 6, v3 in round 7); round 7 recorded the spec sha256 `94f71f2d…182065c` and a passing baseline check. The J6.4 ordering note was scored as written (the step names no order), not reinterpreted.

### Integration commits

| Commit | What | Conflicts | Build | Baseline check |
|---|---|---|---|---|
| `aca458d49d8932d02a9ecae426d8de1fd8f80e30` | `--no-ff` merge of `release-loop/session-mapping-spec-r6` (`786200b`) into `claude/zealous-meitner-5tuft5` (pre-merge HEAD `eeb9263`): adds A2.json and baseline v3.json, 1-line change to `docs/training/session-mapping.md` | none | `npm run build` passed | `check --all` exit 0, session-mapping v3 matches |

### Backlog (NOT blocking this feature)

No backlog items were recorded for session-mapping in this run (`backlog: []`). Items carried in the observations only, not filed as bugs by this run:

| Item | Kind | Evidence | Owner |
|---|---|---|---|
| F5-5 parity table says "planned" for MCP tools | process_note (spec text) | round 6 and 7 observations | session-mapping (needs amendment) |
| F5-4 toast overlaps content on 390px phone | other_feature / cosmetic | `mobile-J5.3.png`, `mobile-E.8.png` (round 6) | shared toast (`src/lib/toast.js`) |
| F3-4 spooled metrics are filed only by Scan | process_note | round 6 observation; no step covers it | session-mapping |

The tracker state (`active-release.state.json`, exported 2026-10-11T00:57Z) still lists session-mapping with lastRound 6 and 13 open bugs / 2 backlog in the continuous bug ledger; it was exported before round 7 and has not been re-synced by this recorder.

### Escalated for a business definition

None.

### Bugs at the per-bug fix-attempt limit (needsHuman)

None.

---

## owner-error-messages

Title: Remaining raw error messages rewritten under the owner error rule (plain first sentence, red for failures, amber for cautions).
Status: **passed** (round 1, 25/25 on baseline v1). Change spec: `docs/changes/owner-error-messages.md`. Training spec: `docs/training/owner-error-messages.md`, baseline `docs/training/baselines/owner-error-messages/v1.json` (commit `2867d61`).

### Rounds

| Round | Baseline | Commit tested | Steps passed / total | Not run | Result | Report |
|---|---|---|---|---|---|---|
| 1 | v1 | `1032699` | 25 / 25 | none | **passed** | [round-1.md](../test-results/owner-error-messages/round-1.md) |

Only one round, on one baseline version, so no cross-version comparison applies.

#### Round 1 (baseline v1) — 25 / 25

No failures, nothing blocked, nothing not run. P.1-P.3, J1.1-J1.5, J2.1-J2.5, J3.1-J3.6, J4.1-J4.4, J5.1 and E.1-E.4 passed on desktop (1280x900) and phone (390x844, touch). Validator val-16400-1, fresh database `sb_rl_val_16400_1`, production build on port 16402. `baseline check` passed. Interface parity: API (Journey 5, `POST /api/release-intelligence/import/snapshot`) and MCP (`release_import_snapshot` with a token created on World Shell -> Connected Agents) return the same plain sentence plus a `Technical detail:` line with `isError: true`, status 400. No UI_GAP, MOBILE_GAP or MCP_GAP.

Observations (not scored):

1. None of the open bugs (B1, B5, B6, B7, B10, B11, B12, B13) maps to a baseline step, so the scored steps neither verify nor reproduce any of them. Code inspection, not scored: B6, B7, B10 (bare `HTTP <status>` fallbacks in `MyResumePanel.jsx:712`, `OutputTemplateConfigurator.jsx:154,270`, `LeadsPanel.jsx:61`) and B11 (`blocks/ProductExperienceBlocks.jsx:557`) are still present. B12's files now exist.
2. Sun menu clicks sometimes hang for 40s while the 3D scene starves the page. The validator used the `/world?at=island:<id>` fallback, which the spec allows, for J1.5 on desktop and phone and to reopen My Resume in E.2. Every other screen was opened by click or tap.
3. E.2 in the same tab as Journey 3: the red toast from J3.5 is still on screen when the valid text is submitted, so a literal in-tab reading would find the parser words in an old toast. E.2 passed in a fresh tab. (Proposed amendment, below.)
4. E.2 valid text `{"package": {}}` returns the raw server text "packageKey must be a lowercase slug." This is outside the step's scope.
5. The MCP tools for gate save and package import take structured objects, so the JSON-text sentence applies only to the website and to `release_import_snapshot`.
6. Network log: one aborted `GET /api/career-agents/verification-current` on leaving Qualification Rules. The 400 responses on package-sources and import/snapshot are what the journeys expect. No page errors.
7. Test environment: `ADMIN_INITIAL_PASSWORD` from `/var/tmp/sbpg/env.sh` did not reach the server through the validator's wrapper, so the admin had the seed default password. A first boot created `admin@saltbasin.net` until `ADMIN_EMAIL` was set explicitly. The validator dropped and recreated the database before testing. A stale round-1 `steps.jsonl` from an earlier session was replaced by this run's log. Exploratory runs are in `/var/tmp/sbpg/agents/val-16400-1/steps-explore.jsonl`.

### Triage

No triage this run: round 1 had no failures, so no triage or scope file was written for owner-error-messages (none exists under `docs/triage/`).

### Fixes

None in this run. The feature code is from the build: commit `2d4e7be` (adds `src/lib/friendlyError.js`, `server/lib/friendlyErrors.js`; rewrites messages in `server/lib/sessionMapping.js`, `server/routes/releaseIntelligence.js`, `server/lib/releaseTrackerService.js`, `server/lib/mcpToolRegistry.js` and the client panels), merged by `4460f88`.

### Spec amendments

None raised or approved. Baseline stays v1.

**Proposed amendment, not yet raised (validator observation 3):** [E.2] should say "in a fresh tab" or "after the earlier toast has cleared", so the J3.5 toast still on screen cannot be read as the E.2 result. No amendment file exists yet in `docs/spec-amendments/owner-error-messages/`. The step was scored as written (fresh tab), so this does not block.

Cross-feature note: this feature's wording change caused session-mapping's [E.1] failure in round 6. That was resolved by session-mapping amendment A2 (see that section), not by changing this feature.

### Validator drift

None found. Scored against pinned baseline v1. The round report's and the input's `specSha256` (`8eb46d80…aa59eeb2d2ff…948`, 62 hex characters) is the real hash with two characters missing. `sha256sum docs/training/owner-error-messages.md` gives `8eb46d8077e74a9881d566505fcb82782df39aa59f5eeb2d2ff014609d770948` (64 characters). At recording time `release-spec-baseline.mjs check` printed `baselines match: owner-error-messages v1`. So the spec did not change. The value in the report was copied wrong.

### Integration commits

| Commit | What |
|---|---|
| `2d4e7be` | Build: rewrite remaining raw parser/HTTP error messages under the owner error rule |
| `4460f88` | Merge `release-loop/owner-error-messages-build` into `claude/zealous-meitner-5tuft5` |
| `2867d61` | Baseline v1: owner-error-messages |
| `731a52b` | Release loop logs: owner-error-messages |
| `a3524da` | Tracker state sync. Contains `docs/test-results/owner-error-messages/round-1.md` |

### Open bugs and backlog (NOT blocking this feature)

The tracker state (`active-release.state.json`, exported 2026-10-11T01:09Z, before round 1 was synced) lists 8 open bugs for owner-error-messages, all found by the build agent at round 0 with 0 fix attempts. None maps to a baseline step, and round 1 passed every scored step, so none blocks this feature. Scope was never assigned (`scope: null`). The classification below is the recorder's reading of each bug's own class. It needs confirmation by triage.

| Bug | Class | Kind | What / root cause | Evidence | Files | Owner |
|---|---|---|---|---|---|---|
| B1 | process | process_note | Build agent's walk cleanup: kill pattern matched the agent's own shell | build reconciliation; round 1 obs. 1 | none | release-loop process |
| B5 | requirement_gap | needs a decision | Methodology Config is Classic Tools only, so it has no phone route. Parity needs a route or an explicit exclusion | change doc "Known limitations" | `MethodologyConfigPanel.jsx`, `capabilityParity.js` | owner-error-messages |
| B6 | requirement_gap | open gap | LonetreeMvpPanel uses one `saveState` string for success and failure | code inspection round 1 | `LonetreeMvpPanel.jsx` | owner-error-messages |
| B7 | requirement_gap | open gap | About 200 pass-through `setError(e.message)` sites remain (e.g. `blocks/ColumnWidgets.jsx:156`, `blocks/index.jsx:1532,1581`) | code inspection round 1 | `src/lib/api.js`, `src/lib/friendlyError.js`, `server/routes` | owner-error-messages |
| B10 | requirement_gap | open gap | Bare `HTTP <status>` fallbacks missed by the build sweep | `MyResumePanel.jsx:712`, `OutputTemplateConfigurator.jsx:154,270`, `LeadsPanel.jsx:61` | same | owner-error-messages |
| B11 | requirement_gap | open gap | Public-site blocks were outside the sweep: `error.message \|\| 'Unable to submit'` | `blocks/ProductExperienceBlocks.jsx:557` | `src/components/blocks`, `PublicSite.jsx` | owner-error-messages |
| B12 | process | process_note (likely resolved) | Build branch predated integration commits | round 1: `scripts/release-scope.mjs` and `server/lib/releaseScope.js` now exist | same | release-loop process |
| B13 | requirement_gap | process_note | Change spec has no cross-reference between the change and training docs | not tested (no step) | `docs/changes/owner-error-messages.md`, `docs/training/owner-error-messages.md` | owner-error-messages |

### Escalated for a business definition

None filed (`escalated: []`). B5 needs an owner decision, but triage has not escalated it. The question would be: "Should Methodology Config get a phone route, or be recorded as an explicit `uiExclusion` for phone in `capabilityParity.js`?"

### Bugs at the per-bug fix-attempt limit (needsHuman)

None (`needsHuman: []`). Every open bug has 0 fix attempts.

---

## Failed / refused commands and gaps reported

### Run 2 (owner-error-messages)

- No command failed or was refused during validation or recording.
- Data discrepancy: the round-1 `specSha256` is 62 characters, two short of the real hash (see owner-error-messages -> Validator drift). The baseline check passes. State left: the report is unchanged, because the recorder does not rewrite validator output.
- Test environment: `ADMIN_INITIAL_PASSWORD` was not passed through and the first boot used the wrong `ADMIN_EMAIL`. The validator recreated the database. State left: the database was dropped and the server stopped by PID, according to the report.
- Tracker state `active-release.state.json` was exported before round 1 (it shows lastRound 0, status validate). The recorder has not re-synced it.

### Run 1 (session-mapping)


- **Missing triage files:** `docs/triage/session-mapping-round-6.md` and `docs/triage/session-mapping-round-6-scope.md` were reported as written by the triage and scope agents but do not exist in the main checkout, any worktree, or git history. Their content is preserved in this log only. State left: files absent.
- **Integration agent:** `git add docs/test-results docs/triage docs/spec-amendments` staged nothing, so no log commit was made at integration. It left `docs/release-log/bug-ledger.json`, `history.json` and `tracker-carry.json` modified (one-line snapshot rewrites, probably from a concurrent tracker sync); these were since committed by tracker sync commits (`00dd16c`, `c4f3aa4`) and are not part of this recorder's commit.
- **Round 7 test result** `docs/test-results/session-mapping/round-7.md` was untracked at recording time; committed with this log.
- No command failed or was refused during amendment, integration or validation.
