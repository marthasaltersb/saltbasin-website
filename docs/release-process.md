# Release process — the Salt Basin release loop

Version 4 · 2026-10-09 · definition: `server/data/releaseLoop/definition.json` (v4)

Every change to the platform goes through one loop, whether a Claude Code session or an in-app agent does
the work:

```
build ─▶ initial check ─▶ integrate ─▶ validate (browser, follows the training spec)
                                          │ pass ─▶ done
                                          ▼ fail
                                        triage ─▶ needs a business definition ─▶ escalate to owner
                                          ▼
                                        scope ─▶ pre-existing / another feature's / process note ─▶ backlog (non-blocking)
                                          │ this feature's
                                          ▼
                                         fix ─▶ integrate ─▶ validate again (with the fix notes) …
```

It repeats until every journey passes, a failure needs an owner decision, or the round limit is reached
(then the feature is recorded as **not passed**, with its open items).

**Three interfaces, or it fails.** Every capability a training guide uses must work on the website
(point-and-click on desktop *and* a full walkthrough at phone width, with no typed URLs, API calls or
scripts standing in for a step), through the API, and through an MCP tool. Validators walk every journey on
desktop and on a phone and check the MCP tool; a missing path fails as `UI_GAP`, `MOBILE_GAP` or `MCP_GAP`.

**Fixed steps, only the code varies.** Each retry must test the same thing, so a training guide is
frozen as a versioned **baseline** (`docs/training/baselines/<feature>/v<N>.json`) before its first round.
Every step has a stable id written into the guide (`[J3.2]` journey step, `[E.1]` edge case, `[P.1]`
precondition) that is never renumbered or reused. The database, test accounts, viewports, locale, time zone
and fixtures are fixed too (`testConstraints`). Validators test exactly the pinned baseline's ids, on the
surfaces it lists, and the score comes from `scripts/release-spec-baseline.mjs score`, so its total is always
the baseline's step count; a step that was not run counts as not passed, and anything seen outside the
baseline is an observation that never changes the score. Nobody edits a guide mid-release: a wrong step
(`spec_error`), a missing one (`coverage_gap`), an ambiguous one, or steps a fix agent wants to add become a
**spec amendment** (`docs/spec-amendments/<feature>/A<n>.json`) with before/after wording, what it traces to
and why. A separate amendment reviewer decides it against a fixed checklist (traced, not weaker, retire only
duplicates, exact, reachable on desktop and phone, deterministic, fictional, independent of the fix).
Approved: the guide changes and the next baseline version is frozen. Rejected: the step stands and the failure
is a product defect. Removing a real step or weakening an expectation goes to the owner. The integrator
refuses any merge whose guide differs from its latest approved baseline. Scores are compared only within one
baseline version; when the version changes, the report and tracker show which ids are the same, changed,
added or retired.

**Whose bug is it?** After triage, a scope agent sorts each item: *this feature* (its diff or spec caused
it — blocks the feature), *pre-existing* (reproduces on the base without this feature's commits — backlog),
*another feature's* (reassigned to that feature), or *process note* (test harness, environment or spec
wording — recorded, not a product bug). Every decision names its evidence. A feature whose only remaining
items are out of scope ends **passed with backlog**; backlog items stay on the tracker until fixed and
verified. Earlier decisions are kept in `docs/triage/scope-review.json` and reused. One exception: if a frozen test step of this feature fails, the cause is this feature's to fix even when it is older code or another feature's file, because a feature never passes with a failing step. Bug ids carry their feature (`qr-gated-outputs-T1`), since every feature's triage numbers from T1.

## Who does what

| Role | Does | Leaves behind |
| --- | --- | --- |
| Build agent | Builds one feature on its own branch; initial check; writes specs | commits, `docs/changes/<feature>.md`, `docs/training/<feature>.md` |
| Integration agent | Merges one branch at a time, resolves conflicts, rebuilds, commits logs | merge commits |
| Validation agent | Tests every step id of the pinned baseline literally in a real browser on a fresh database, desktop and phone | `docs/test-results/<feature>/round-N.md` + screenshots |
| Triage agent | Reproduces, root-causes, classifies, dedupes failures | `docs/triage/<feature>-round-N.md` |
| Fix agent | Fixes root causes in the product, re-walks failed steps, writes fix notes; never edits a guide (proposes steps instead) | commits, fix notes in the change spec |
| Amendment reviewer | Decides proposed guide changes against the fixed checklist; freezes the next baseline for approved ones | `docs/spec-amendments/<feature>/A<n>.json`, new baseline version |
| Release recorder | Writes the release log | `docs/release-log/<release>.md` |

## Specs that trace to earlier versions

- **Change/design spec**: version + date, *Traces to* (earlier specs and commits it builds on or replaces),
  what changed, behaviour changes, verification, limitations, and fix notes per round.
- **Training spec**: where things are in the UI, preconditions with fictional data, numbered journeys with
  exact expected results, edge cases. The validation agent runs this document, so it doubles as the user
  guide.

## Running it

- Claude Code: the `salt-basin-release-loop` skill and the saved workflow `.claude/workflows/release-loop.js`.
- Tracker: the release tracker artifact (`tools/release-tracker`, fed by `scripts/release-tracker-sync.mjs`)
  shows every run, round, bug and agent live in the Claude Code session. There is no platform screen for it.
  In-app agents read the same definition file, `server/data/releaseLoop/definition.json`.

## Changing the process

Edit `definition.json`, bump `version`, and add a line below.

| Version | Date | Change |
| --- | --- | --- |
| 1 | 2026-10-02 | First version, from the application-package / proficiency / live-QR session |
| 2 | 2026-10-09 | Scope check after triage: pre-existing, other-feature and process-note items become non-blocking backlog with evidence |
| 3 | 2026-10-09 | Interface parity: every capability usable on desktop and phone by point-and-click, via the API and via an MCP tool; validators walk both and check MCP |
| 4 | 2026-10-09 | Spec governance: frozen, versioned baselines with stable step ids and fixed test constraints; scores computed against the baseline; guide changes only by reviewed amendment; integrator gate. Owner: retries had different test steps (e.g. one feature's step total went 31 → 29 → 33 → 30) |
