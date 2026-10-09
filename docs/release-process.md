# Release process — the Salt Basin release loop

Version 2 · 2026-10-09 · definition: `server/data/releaseLoop/definition.json` (v2)

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

**Whose bug is it?** After triage, a scope agent sorts each item: *this feature* (its diff or spec caused
it — blocks the feature), *pre-existing* (reproduces on the base without this feature's commits — backlog),
*another feature's* (reassigned to that feature), or *process note* (test harness, environment or spec
wording — recorded, not a product bug). Every decision names its evidence. A feature whose only remaining
items are out of scope ends **passed with backlog**; backlog items stay on the tracker until fixed and
verified. Earlier decisions are kept in `docs/triage/scope-review.json` and reused.

## Who does what

| Role | Does | Leaves behind |
| --- | --- | --- |
| Build agent | Builds one feature on its own branch; initial check; writes specs | commits, `docs/changes/<feature>.md`, `docs/training/<feature>.md` |
| Integration agent | Merges one branch at a time, resolves conflicts, rebuilds, commits logs | merge commits |
| Validation agent | Follows the training spec literally in a real browser on a fresh database | `docs/test-results/<feature>/round-N.md` + screenshots |
| Triage agent | Reproduces, root-causes, classifies, dedupes failures | `docs/triage/<feature>-round-N.md` |
| Fix agent | Fixes root causes, re-walks failed steps, writes fix notes | commits, fix notes in the change spec |
| Release recorder | Writes the release log | `docs/release-log/<release>.md` |

## Specs that trace to earlier versions

- **Change/design spec**: version + date, *Traces to* (earlier specs and commits it builds on or replaces),
  what changed, behaviour changes, verification, limitations, and fix notes per round.
- **Training spec**: where things are in the UI, preconditions with fictional data, numbered journeys with
  exact expected results, edge cases. The validation agent runs this document, so it doubles as the user
  guide.

## Running it

- Claude Code: the `salt-basin-release-loop` skill and the saved workflow `.claude/workflows/release-loop.js`.
- In the platform: World Shell → Release loop (admin) shows the definition, the agent roles, every run with
  its rounds, test results, triage items and fixes. In-app agents read the same definition.

## Changing the process

Edit `definition.json`, bump `version`, and add a line below.

| Version | Date | Change |
| --- | --- | --- |
| 1 | 2026-10-02 | First version, from the application-package / proficiency / live-QR session |
| 2 | 2026-10-09 | Scope check after triage: pre-existing, other-feature and process-note items become non-blocking backlog with evidence |
