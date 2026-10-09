# Release tracker kit (generic)

A project-agnostic copy of the Salt Basin release tracker. It is a live board for a
build → validate → triage → fix → re-test loop, showing features, running agents/jobs, bugs (with
escalation to a person) and token use. Nothing in this folder depends on the rest of this repo. To use it
in another project, copy the folder there.

| File | What it does |
| --- | --- |
| `tracker.config.example.json` | Copy to `tracker.config.json`. Sets the project name, tagline, role labels, fix-attempt limit and steps folder. |
| `sync.mjs` | Reads run journals (plus agent transcripts and step logs when they exist) and writes `snapshot.json`. |
| `log.mjs` | Appends journal and step events from any pipeline (CI, shell scripts, other agent frameworks). |
| `index.html` | The board. Reads `snapshot.json` next to it, or a claude.ai artifact's shared db when it runs there. |
| `serve.mjs` | Serves the board and a snapshot locally. |
| `MAPPING.md` | How to map Jira, Azure DevOps, Linear, GitHub, Scrum, Kanban and other systems onto the tracker. |
| `make-fixture.mjs`, `verify-snapshot.mjs` | Fictional test runs and a checker for `sync.mjs`. |

## Quick start

```bash
cp tracker.config.example.json tracker.config.json        # set projectName etc.
node log.mjs start  runs/r1 build:checkout
node log.mjs result runs/r1 build:checkout '{"branch":"feat/checkout","initialCheckPassed":true}'
node log.mjs start  runs/r1 validate:checkout:r1
node log.mjs step   .release-tracker/steps checkout 1 J1 1 fail "Total is 30.00" "Total is 0.00"
node log.mjs result runs/r1 validate:checkout:r1 '{"passed":false,"stepsPassed":0,"stepsTotal":1}'
node sync.mjs --run runs/r1 --ledger bug-ledger.json --out snapshot.json
node serve.mjs snapshot.json 4173                          # http://127.0.0.1:4173/ (?theme=dark|light)
```

## The contract (how a run reports to the tracker)

**Labels** name every agent or job as `role:feature[:rN]`, for example `build:checkout` or
`validate:checkout:r2`. The built-in roles are `build`, `integrate`, `validate`, `triage`, `fix`,
`reconcile` and `record`. Any other role also works. It shows with its `roles` label from the config and
its result's `summary` string.

**Journal**: `<run dir>/journal.jsonl`, one JSON object per line:

```json
{"type":"started","agentId":"a1","label":"validate:checkout:r1","phase":"Validate","at":"<ISO>"}
{"type":"result","agentId":"a1","label":"validate:checkout:r1","result":{ … }}
```

A finish with no result, or a `type` containing error/fail/abort/kill/skip, is shown as **failed**, never
done. Claude Code workflow runs already write this file.

**Result shapes** the tracker reads by role:

| Role | Result |
| --- | --- |
| build | `{ branch, initialCheckPassed, failures: [] }` |
| integrate | `{ merged, head, buildPassed, conflicts: [] }` |
| validate | `{ passed, stepsPassed, stepsTotal, reportPath?, commitTested? }` |
| triage | `{ items: [{ id, step, rootCause, class, files?, question?, recurrenceOf? }] }`. Set `class` to `needs_business_definition` to send the item to the owner. Set `recurrenceOf` to link it to an earlier bug. |
| fix | `{ fixed: [{ id, what, files }], notFixed: [{ id, why }], commit? }` |
| reconcile | `{ items: [{ status, kind, step, rootCause }] }` |
| anything else | `{ summary }` |

**Optional inputs:**
- Live step logs at `<stepsRoot>/<feature>/round-N/steps.jsonl`. Each line is
  `{journey, step, expect, seen, result: pass|fail|blocked}` or `{type: pageerror|requestfailed, detail}`.
  Failures show while a validator is still running.
- Agent transcripts at `<run dir>/agent-<agentId>.jsonl` (Claude Code format). These add "last activity"
  and token counts. Without them, tokens show as 0.

**Bug rules:** a bug that still fails after `maxFixAttemptsPerBug` fix attempts becomes **needs a person**
and leaves the automated loop. With `--ledger`, a bug never drops off the board, even if its run is
replaced.

## Hosting the board

- **Any static host** (GitHub Pages, S3, a folder served by your app): publish `index.html` and keep
  `snapshot.json` next to it, updated by `sync.mjs`. The page re-reads it every minute.
- **claude.ai artifact**: publish `index.html` with the `db` capability and write the snapshot string to
  collection `tracker`, doc `current`, field `json`. The page then updates live.

## Check after changing `sync.mjs`

```bash
node make-fixture.mjs /tmp/fx
node sync.mjs --run /tmp/fx/runA --run /tmp/fx/runB --steps-root /tmp/fx/steps --out /tmp/fx/snap.json
node verify-snapshot.mjs /tmp/fx/snap.json /tmp/fx/expected.json   # "snapshot matches expected"
```

Snapshots hold labels, statuses, summaries and counts only, never transcript text. The fixture checks this
with a sentinel string.
