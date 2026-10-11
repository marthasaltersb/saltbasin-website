# Release log — 2026-10-10-production-hardening-resume

Integration branch: `claude/zealous-meitner-5tuft5`. Process definition: `server/data/releaseLoop/definition.json`. Recorded 2026-10-11 by the release recorder. Nothing pushed.

This run of the loop covered one feature, **session-mapping**, picking up at round 6. No sweep was run in this resume (`sweep: null`).

## Final results

| Feature | Status | Last round | Score | Baseline | Commit tested | Open blocking items |
|---|---|---|---|---|---|---|
| session-mapping | **passed** | 7 | 56 / 56 | v3 | `aca458d` | none |

**Features that did NOT pass in this run: none.** Only session-mapping was in this run's scope. Every other feature in `active-release.features.json` is outside this log; their state is in `docs/release-log/active-release.state.json` and the tracker, and this log makes no claim about them.

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

## Failed / refused commands and gaps reported in this run

- **Missing triage files:** `docs/triage/session-mapping-round-6.md` and `docs/triage/session-mapping-round-6-scope.md` were reported as written by the triage and scope agents but do not exist in the main checkout, any worktree, or git history. Their content is preserved in this log only. State left: files absent.
- **Integration agent:** `git add docs/test-results docs/triage docs/spec-amendments` staged nothing, so no log commit was made at integration. It left `docs/release-log/bug-ledger.json`, `history.json` and `tracker-carry.json` modified (one-line snapshot rewrites, probably from a concurrent tracker sync); these were since committed by tracker sync commits (`00dd16c`, `c4f3aa4`) and are not part of this recorder's commit.
- **Round 7 test result** `docs/test-results/session-mapping/round-7.md` was untracked at recording time; committed with this log.
- No command failed or was refused during amendment, integration or validation.
