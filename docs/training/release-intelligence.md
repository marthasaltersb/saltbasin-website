# Training spec — release reconciliation, failed-run states and contribution trends

Version 1 · 2026-10-02 · covers `docs/changes/release-intelligence.md` v1. Audience: a test agent driving a real browser. Follow literally. All data is fictional (a garden-supplies product); nothing here names an employer or application target.

## Where things are

- World Shell (`/world`) -> top tab **Journeys** -> card **Release Intelligence** ("Open configuration"). A full-screen panel opens with the heading **Release Intelligence**, a link **← Back to World**, and six tabs in this order: **Trends**, **Releases**, **Failed runs**, **Outputs**, **Import**, **Settings**.
- Also reachable from **Classic Tools** -> menu **Platform Lifecycle Management** -> **Release Intelligence**.
- Nothing needs an API call or a terminal. The one optional terminal check is in "Edge cases".

## Preconditions

- A freshly seeded database and the admin account (the platform's first admin). The first time that account opens `/world` it shows "Career Portfolio Terms & Data Conditions": tick every box and press **I Agree — Continue**.
- No release data exists yet. Every document below is pasted into the screen by you; nothing is imported from disk.
- Expect one console error in every round, `net::ERR_CERT_AUTHORITY_INVALID` (a web-font request blocked by the test sandbox). It is environment noise, not a defect. The only application requests allowed to fail are the ones this spec names as refusals (HTTP 400 or 409), each at the step that causes it.
- Wait for a tab's "Loading…" text to disappear before reading it.

### Fixture documents (paste exactly)

Release log A, path `docs/release-log/2030-01-05-garden-gate.md`:

```markdown
# Garden Gate release
Release: 2030-01-05-garden-gate
Date: 2030-01-05

## Features
| Feature | Result | Rounds | Change spec version | Training spec version |
| --- | --- | --- | --- | --- |
| seed-catalog | passed | 2 | 1 | 1 |
| water-planner | not passed | 1 | | |

## Validation rounds
| Feature | Round | Commit | Steps passed | Steps total | Result |
| --- | --- | --- | --- | --- | --- |
| seed-catalog | 1 | abc1234 | 8 | 10 | FAIL |
| seed-catalog | 2 | def5678 | 10 | 10 | PASS |
| water-planner | 1 | 1112223 | 3 | 9 | FAIL |

## Fixes
| Feature | Round | Bug | Summary | Files |
| --- | --- | --- | --- | --- |
| seed-catalog | 1 | B-1 | Label was cut off | src/a.jsx, src/b.jsx |

## Failed runs
| Feature | Kind | Label | State | Class | What failed | State left | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| water-planner | agent_run | validate:water-planner:r1 | failed | environment | Browser would not start | nothing written | Unresolved |
| seed-catalog | command | npm run build | refused | process | Build command rejected by the user | no build output | Resolved |
```

Release log A, second version (same path; differs only in the water-planner rows), called **LOG A2** below. It is LOG A with the line `| water-planner | not passed | 1 | | |` replaced by `| water-planner | passed | 2 | 1 | 1 |`, and one extra line `| water-planner | 2 | 2224445 | 9 | 9 | PASS |` added directly after the line `| water-planner | 1 | 1112223 | 3 | 9 | FAIL |`.

Spec documents (path, then text):

`docs/changes/base-catalog.md`

```markdown
# Base catalog change spec
Version 1 · 2029-12-20

## Traces to
- none

## What changed
Starting point for the garden catalog.
```

`docs/changes/seed-catalog.md`

```markdown
# Seed catalog change spec
Version 1 · 2030-01-03

## Traces to
- docs/changes/base-catalog.md (v1)

## What changed
Adds a seed list.
```

`docs/training/seed-catalog.md`

```markdown
# Seed catalog training spec
Version 1 · 2030-01-03

## Where things are
Seeds tab.
```

`docs/changes/water-planner.md`

```markdown
# Water planner change spec
Version 1 · 2030-01-04

## Traces to
- docs/changes/base-catalog.md (v1)

## What changed
Adds a watering plan.
```

`docs/training/water-planner.md`

```markdown
# Water planner training spec
Version 1 · 2030-01-04

## Where things are
Plan tab.
```

`docs/changes/compost-notes.md`

```markdown
# Compost notes change spec
Version 1 · 2030-01-06

## Traces to
- none

## What changed
Compost bin notes.
```

Tracker snapshot A (release key `2030-01-05-garden-gate`):

```json
{
  "runId": "garden-gate-run",
  "syncedAt": "2030-01-05T12:00:00Z",
  "agents": [
    {
      "label": "build:seed-catalog:r0",
      "role": "build",
      "feature": "seed-catalog",
      "status": "done",
      "tokens": {
        "input": 40,
        "cacheWrite": 1200,
        "cacheRead": 30000,
        "output": 9000
      },
      "startedAt": "2030-01-04T08:00:00Z",
      "lastActivityAt": "2030-01-04T08:45:00Z",
      "failures": [
        "git push was refused"
      ]
    },
    {
      "label": "validate:seed-catalog:r1",
      "role": "validate",
      "feature": "seed-catalog",
      "round": 1,
      "status": "done",
      "tokens": {
        "input": 10,
        "cacheWrite": 400,
        "cacheRead": 9000,
        "output": 3000
      },
      "startedAt": "2030-01-04T08:50:00Z",
      "lastActivityAt": "2030-01-04T09:10:00Z"
    },
    {
      "label": "validate:water-planner:r1",
      "role": "validate",
      "feature": "water-planner",
      "round": 1,
      "status": "failed",
      "activity": "You've hit your usage limit",
      "tokens": {
        "input": 0,
        "cacheWrite": 0,
        "cacheRead": 0,
        "output": 0
      }
    }
  ],
  "features": [
    {
      "key": "seed-catalog",
      "status": "passed",
      "openBugs": 0,
      "lastResult": {
        "round": 2,
        "passed": true,
        "stepsPassed": 10,
        "stepsTotal": 10
      }
    }
  ],
  "bugs": [
    {
      "id": "B-1",
      "feature": "seed-catalog",
      "status": "verified",
      "class": "defect",
      "step": "1.2",
      "rootCause": "label clipped",
      "firstRound": 1,
      "history": [
        {
          "round": 1,
          "event": "fixed",
          "note": "widened the label",
          "files": [
            "src/a.jsx"
          ]
        }
      ]
    }
  ]
}
```

Release log B, path `docs/release-log/2030-02-09-harvest-board.md`:

```markdown
# Harvest Board release
Release: 2030-02-09-harvest-board
Date: 2030-02-09

## Features
| Feature | Result | Rounds | Change spec version | Training spec version |
| --- | --- | --- | --- | --- |
| tray-labels | passed | 1 | | |
| bin-counts | passed | 2 | | |

## Validation rounds
| Feature | Round | Commit | Steps passed | Steps total | Result |
| --- | --- | --- | --- | --- | --- |
| tray-labels | 1 | 2223334 | 8 | 8 | PASS |
| bin-counts | 1 | 3334445 | 5 | 9 | FAIL |
| bin-counts | 2 | 4445556 | 9 | 9 | PASS |

## Fixes
| Feature | Round | Bug | Summary | Files |
| --- | --- | --- | --- | --- |
| bin-counts | 1 | B-7 | Count box ignored decimals | src/c.jsx |

## Failed runs
| Feature | Kind | Label | State | Class | What failed | State left | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bin-counts | command | npm run seed | partial | environment | Seed ran halfway before the connection dropped | 3 of 6 rows written | Resolved |
```

Tracker snapshot B (release key `2030-02-09-harvest-board`):

```json
{
  "runId": "harvest-board-run",
  "syncedAt": "2030-02-09T12:00:00Z",
  "agents": [
    {
      "label": "build:tray-labels:r0",
      "role": "build",
      "feature": "tray-labels",
      "status": "done",
      "tokens": {
        "input": 30,
        "cacheWrite": 900,
        "cacheRead": 20000,
        "output": 6000
      },
      "startedAt": "2030-02-08T09:00:00Z",
      "lastActivityAt": "2030-02-08T09:30:00Z"
    },
    {
      "label": "build:bin-counts:r0",
      "role": "build",
      "feature": "bin-counts",
      "status": "done",
      "tokens": {
        "input": 10,
        "cacheWrite": 700,
        "cacheRead": 15000,
        "output": 5000
      },
      "startedAt": "2030-02-08T09:00:00Z",
      "lastActivityAt": "2030-02-08T09:50:00Z"
    },
    {
      "label": "validate:bin-counts:r1",
      "role": "validate",
      "feature": "bin-counts",
      "round": 1,
      "status": "done",
      "tokens": {
        "input": 5,
        "cacheWrite": 300,
        "cacheRead": 6000,
        "output": 2000
      },
      "startedAt": "2030-02-08T10:00:00Z",
      "lastActivityAt": "2030-02-08T10:20:00Z"
    }
  ],
  "features": [],
  "bugs": []
}
```

Release log C, path `docs/release-log/2030-03-14-orchard-map.md`:

```markdown
# Orchard Map release
Release: 2030-03-14-orchard-map
Date: 2030-03-14

## Features
| Feature | Result | Rounds | Change spec version | Training spec version |
| --- | --- | --- | --- | --- |
| orchard-map | passed | 1 | | |

## Validation rounds
| Feature | Round | Commit | Steps passed | Steps total | Result |
| --- | --- | --- | --- | --- | --- |
| orchard-map | 1 | 5556667 | 6 | 6 | PASS |
```

Tracker snapshot C (release key `2030-03-14-orchard-map`):

```json
{
  "runId": "orchard-map-run",
  "syncedAt": "2030-03-14T12:00:00Z",
  "agents": [
    {
      "label": "build:orchard-map:r0",
      "role": "build",
      "feature": "orchard-map",
      "status": "done",
      "tokens": {
        "input": 8,
        "cacheWrite": 500,
        "cacheRead": 9000,
        "output": 4000
      },
      "startedAt": "2030-03-13T14:00:00Z",
      "lastActivityAt": "2030-03-13T14:25:00Z"
    },
    {
      "label": "validate:orchard-map:r1",
      "role": "validate",
      "feature": "orchard-map",
      "round": 1,
      "status": "done",
      "tokens": {
        "input": 4,
        "cacheWrite": 200,
        "cacheRead": 3000,
        "output": 1500
      },
      "startedAt": "2030-03-13T14:30:00Z",
      "lastActivityAt": "2030-03-13T14:45:00Z"
    }
  ],
  "features": [],
  "bugs": []
}
```

To import a document: tab **Import** -> card **Import a document** -> type the path into **Document path**, paste the text into **Document text**, press **Import document**. To import a snapshot: card **Import a tracker snapshot** -> type the release key into **Release key for the snapshot**, paste the JSON into **Snapshot JSON**, press **Import snapshot**. The result appears in a box above the cards (a status region) listing each path, its status and counts.

## Journey 1 — Open the screen; empty state

1. [J1.1] Log in, open `/world`, accept the terms if asked, press **Journeys**, press the card **Release Intelligence**.
   - Expect the heading **Release Intelligence** and the six tabs **Trends**, **Releases**, **Failed runs**, **Outputs**, **Import**, **Settings**, with **Trends** selected.
   - Expect the text "No releases recorded yet. Import release logs on the Import tab, or create a release record on the Releases tab."

## Journey 2 — Import a release log; re-import is idempotent

1. [J2.1] **Import** tab: import LOG A at its path.
   - Expect the result line `docs/release-log/2030-01-05-garden-gate.md — imported (release_log) — 2 features, 3 rounds, 1 fix, 2 failed runs`.
2. [J2.2] Press **Import document** again without changing anything.
   - Expect `docs/release-log/2030-01-05-garden-gate.md — unchanged (release_log)`. Nothing is duplicated (checked in Journey 3: still 2 failed runs).

## Journey 3 — Release record, features and reconciliation checks

1. [J3.1] **Releases** tab.
   - Expect a "Release records" table with one row: release `2030-01-05-garden-gate`, name "Garden Gate release", date `2030-01-05`, status **Open**, features passed "1 of 2", failed runs "2 (1 open)", and a red pill "8 gaps".
2. [J3.2] Press **Open** on that row.
   - Expect the heading `2030-01-05-garden-gate` with a pill **Open**, and the line "Garden Gate release · 2030-01-05 · 8 gaps to reconcile · tokens not recorded · time not recorded".
   - Expect a box **Gaps:** listing eight lines, including "seed-catalog — Change spec present: No imported change spec carries this feature key", "water-planner — Last round passed: Round 1 did not pass" and "water-planner — No open failed runs: 1 failed run is still open".
3. [J3.3] In the Features table, row **seed-catalog**:
   - Outcome pill "passed"; specs cell "Change: not imported" and "Training: not imported"; rounds cell "Round 1: fail (8/10 steps) · abc1234", "Round 2: pass (10/10 steps) · def5678" and "Passed in round 2"; fixes cell "B-1 (round 1): Label was cut off"; failed runs "1 (0 open)"; a red pill "4 gaps".
   - Under the row, check lines: "✕ Change spec present", "✕ Training spec present", "✕ Change spec version matches the release log: Release log says version 1 but the spec is not imported", "– Traces-to targets resolve: No spec traces listed", "✓ Validated in at least one round: 2 rounds recorded", "✓ Last round passed: Round 2 passed", "✓ Recorded rounds match the release log: 2 rounds", "✓ No open failed runs: None open".
4. [J3.4] Row **water-planner**: outcome pill "not passed"; rounds cell "Round 1: fail (3/9 steps) · 1112223" and "Not passed"; fixes "none"; failed runs "1 (1 open)"; pill "4 gaps". Its check lines include "– Change spec version matches the release log: The release log declares no version", "✕ Last round passed: Round 1 did not pass", "✓ Recorded rounds match the release log: 1 round" and "✕ No open failed runs: 1 failed run is still open".

## Journey 4 — Failed runs are first-class: list, filter, record, dispose

1. [J4.1] **Failed runs** tab.
   - Expect two runs under "Failed runs": state **refused**, class `process`, "Build command rejected by the user", "State left: no build output", "command · seed-catalog · 2030-01-05-garden-gate"; and state **failed**, class `environment`, "Browser would not start", "State left: nothing written", "agent_run · water-planner · 2030-01-05-garden-gate".
2. [J4.2] Set **Filter by state** to `refused`: only the build run remains. Set it back to "Any state". Set **Filter by disposition** to `open`: only "Browser would not start" remains (the build run's log status was "Resolved"). Set it back to "Any disposition".
3. [J4.3] In the card **Record a failed run** press **Record failed run** with the form empty.
   - Expect a red alert "Describe what failed" and no new run.
4. [J4.4] Fill: **Release for new failed run** `2030-01-05-garden-gate`, **Failed run feature key** `water-planner`, **Failed run state** `partial`, **Failed run class** `environment`, **What failed** `Seed import stopped after 12 of 20 rows`, **State it left** `12 rows written, 8 missing`. Press **Record failed run**.
   - Expect a new run in the list: state partial, "Seed import stopped after 12 of 20 rows", "State left: 12 rows written, 8 missing", "command · water-planner".
5. [J4.5] In the row "Browser would not start" set the disposition select (aria-label "Disposition for Browser would not start") to `reconciled`, leave the note empty, press **Save disposition**.
   - Expect, inside that row, an alert "Add a note saying how this was resolved or why it is accepted". Nothing is saved.
6. [J4.6] In the same row set the class select ("Class for Browser would not start") to `test_harness`, type the note `Chromium path was wrong in the harness; fixed and re-run`, press **Save disposition**.
   - Expect the line "Set by betsy@test.local" followed by a UTC time, and the class column now `test_harness`.

## Journey 5 — Tracker snapshot: tokens, time, and an agent that died at a usage limit

1. [J5.1] **Import** tab: import tracker snapshot A under the key `2030-01-05-garden-gate`.
   - Expect "Snapshot filed under release 2030-01-05-garden-gate: 3 agents, 1 feature, 1 round, 3 failed runs, 1 fix."
2. [J5.2] **Failed runs** tab.
   - Expect a run in state **interrupted** reading `Agent run "validate:water-planner:r1" stopped at a usage limit before it finished` (an agent that hit a usage limit is its own state, not an ordinary failure), and a run "git push was refused" in state **refused**.
3. [J5.3] **Releases** -> **Open** `2030-01-05-garden-gate`.
   - Expect the header line to end "· 12,000 output tokens recorded · 65 min elapsed" and to say "9 gaps to reconcile". (12,000 = 9,000 build + 3,000 validate; 65 = 45 + 20 minutes. The usage-limit agent contributes neither: its tokens and times were not recorded, and it is never counted as zero.)

## Journey 6 — Outputs: nothing is left unattributed

1. [J6.1] **Import** tab: import the document at `docs/changes/compost-notes.md`.
   - Expect `docs/changes/compost-notes.md — imported (change_spec)`.
2. [J6.2] **Outputs** tab.
   - Expect the red status "1 output is not tied to any release. Link each one, or import the release log that lists its feature." and a row `docs/changes/compost-notes.md` with kind `change_spec`, feature `compost-notes`, "version 1" and a pill **Unattributed**.
3. [J6.3] In that row choose `2030-01-05-garden-gate` in the select (aria-label "Release for docs/changes/compost-notes.md") and press that row's **Link to release**.
   - Expect the row to show `2030-01-05-garden-gate` and "linked by betsy@test.local", and the status to read "Every imported output is tied to a release."

## Journey 7 — Reconcile a release to its specs, then approve

Open the release (`Releases` -> `Open`) after each import to read the header.

1. [J7.1] Import `docs/changes/seed-catalog.md`. Expect the header "8 gaps" and, in the seed-catalog row, "Change: docs/changes/seed-catalog.md (version 1)". (The spec file was matched to the release by its feature key, which the log lists.)
2. [J7.2] Import `docs/training/seed-catalog.md`. Expect "6 gaps" and "Training: docs/training/seed-catalog.md (version 1)". A gap now reads "seed-catalog — Traces-to targets resolve: Not found among imported outputs: docs/changes/base-catalog.md" (the change spec traces to a spec that is not imported yet).
3. [J7.3] Import `docs/changes/base-catalog.md`. Expect "5 gaps" and the check "✓ Traces-to targets resolve: 1 spec trace resolved".
4. [J7.4] Import `docs/changes/water-planner.md` and `docs/training/water-planner.md`. Expect "3 gaps": "seed-catalog — No open failed runs: 1 failed run is still open", "water-planner — Last round passed: Round 1 did not pass", "water-planner — No open failed runs: 2 failed runs are still open".
5. [J7.5] **Failed runs** tab. For each of these three runs set the disposition, class and note, and press **Save disposition** (each row then shows "Set by betsy@test.local"):
   - "Seed import stopped after 12 of 20 rows": `reconciled`, class `environment`, note `Re-ran the seed from the start; all 20 rows written`.
   - `Agent run "validate:water-planner:r1" stopped at a usage limit ...`: `accepted_known_issue`, class `environment`, note `Agent hit its usage limit; the round was re-run in the next window`.
   - "git push was refused": `reconciled`, class `process`, note `Push is held by the owner until the release log shows every feature passed`.
   - Set **Filter by disposition** to `open`: expect "No failed runs match." Set it back to "Any disposition".
6. [J7.6] **Releases** -> **Open** `2030-01-05-garden-gate`. Type `Looks complete` in **Approval or reopen note** and press **Approve reconciliation**.
   - Expect a red alert "This release is not reconciled yet: 1 gap remains" and a box "Not approved. Open gaps:" listing "water-planner — Last round passed: Round 1 did not pass". The release stays **Open**. (The browser reports a 409 for this request; it is expected.)
7. [J7.7] **Import** tab: import LOG A2 at the same path as LOG A.
   - Expect `... — updated (release_log)`.
8. [J7.8] **Failed runs** tab: the run "Browser would not start" still shows "Set by betsy@test.local" and class `test_harness` (a reviewer's decision survives a re-import).
9. [J7.9] **Releases** -> **Open** `2030-01-05-garden-gate`.
   - Expect "Reconciled: every check passes" in the header line and no **Gaps:** box. Row water-planner shows "Passed in round 2".
10. [J7.10] Type `Every check passes; specs, rounds and failed runs reconciled` in the note, press **Approve reconciliation**.
    - Expect the pill **Approved**, the text "Approved <UTC time> — Every check passes; specs, rounds and failed runs reconciled" and the button **Reopen release** in place of Approve. (Approval runs through the platform's finalization gate; an admin with no uncategorised technologies passes straight through. If a dialog "Set how each technology was used" appears, choose a category for each technology and press **Save to Career Master and continue**; the approval then completes.)
11. [J7.11] Clear the note and press **Reopen release**.
    - Expect an alert "Say why the release is being reopened". Type `A late failed run was found`, press **Reopen release** again: the pill returns to **Open** and the button to **Approve reconciliation**.
12. [J7.12] In **Reconciliation history** expect, newest first, events `reopen`, `approve`, `import` (document, "updated"), three `disposition` lines with their notes, and an `import` for `snapshot: tracker:2030-01-05-garden-gate`, each attributed to betsy@test.local.

## Journey 8 — Contribution trends over time

1. [J8.1] **Import** tab: import release log B and then tracker snapshot B (key `2030-02-09-harvest-board`); then import release log C only (no snapshot yet).
2. [J8.2] **Trends** tab.
   - Expect a "Timeline" slider labelled "Timeline: releases up to 2030-03-14-orchard-map" and the status line "Showing releases up to 2030-03-14-orchard-map (2030-03-14) — 3 of 3".
   - Expect the note beginning "Basis: tokens are OBSERVED" (tokens are read from transcripts, minutes are inferred, no spend is shown).
   - Expect four charts, titled **Tokens used**, **Time spent**, **Rounds to pass**, **Failure classes**, each with one value axis and the three release dates `2030-01-05`, `2030-02-09`, `2030-03-14` along the bottom.
   - Release C has no tracker data: under `2030-03-14` the Tokens chart shows **n/r** and the note "n/r = nothing recorded for that release (shown as a gap, never as zero)." The "As of" card reads "Agents with recorded tokens 0 of 0".
3. [J8.3] **Import** tab: import tracker snapshot C (key `2030-03-14-orchard-map`), return to **Trends**.
   - The **n/r** marker and note are gone. Hovering a bar shows its tooltip (the SVG title): Tokens used `2030-01-05-garden-gate (2030-01-05) — 12,000 tokens`, `2030-02-09-harvest-board (2030-02-09) — 13,000 tokens`, `2030-03-14-orchard-map (2030-03-14) — 5,500 tokens`; Time spent `65 min`, `100 min`, `40 min`; Rounds to pass `2 rounds`, `1.5 rounds`, `1 round`.
   - Failure classes tooltips for `2030-01-05-garden-gate`: `environment: 2 runs`, `process: 2 runs`, `test_harness: 1 run`, `defect: 1 run`; for `2030-02-09-harvest-board`: `environment: 1 run`; release C has no bar (none recorded).
   - The "As of 2030-03-14-orchard-map" card: Features passed "1 of 1", Agents with recorded tokens "2 of 2", Agents with recorded time "2 of 2", Mean rounds to pass "1", Failed runs (open / total) "0 / 0".
4. [J8.4] Focus the **Timeline slider** and press **Home**.
   - Expect "Showing releases up to 2030-01-05-garden-gate (2030-01-05) — 1 of 3", only one bar per chart, and an "As of 2030-01-05-garden-gate" card: Features passed "2 of 2", Agents with recorded tokens "2 of 3", Agents with recorded time "2 of 3", Mean rounds to pass "2", Failed runs (open / total) "0 / 6".
   - Press **ArrowRight**: "Showing releases up to 2030-02-09-harvest-board (2030-02-09) — 2 of 3"; the card shows Mean rounds to pass "1.5" and Failed runs "0 / 1".
5. [J8.5] Set **Break down by** to `By role`: the Tokens chart gets a legend with `build` and `validate`; tooltips for 2030-01-05 are `build: 9,000 tokens` and `validate: 3,000 tokens`; for 2030-02-09 `build: 11,000 tokens` and `validate: 2,000 tokens`.
6. [J8.6] Set **Break down by** to `By feature` and **Token measure** to `All tokens`: the chart subtitle reads "All tokens per release, by feature"; the tooltip for 2030-01-05 is `seed-catalog: 52,650 tokens` (water-planner has none recorded, so it has no bar segment); for 2030-02-09 `bin-counts: 29,015 tokens` and `tray-labels: 26,930 tokens`.

## Journey 9 — Everything configurable is editable on screen

1. [J9.1] **Settings** tab.
   - Expect "Showing the built-in defaults. Saving stores an override." and fields **Run states**, **Dispositions**, **Failure classes**, **Default token measure**, **Maximum chart series (1 to 5)** and five folder fields (**Change specs folder**, **Training specs folder**, **Test results folder**, **Triage folder**, **Release logs folder**).
2. [J9.2] Set **Maximum chart series** to `9`, press **Save settings**: alert "maxSeries must be a whole number from 1 to 5". Set it back to `5`.
3. [J9.3] Set **Change specs folder** to `docs/changes` (no trailing slash), press **Save settings**: alert `logLocations.changeSpec must be a relative folder ending in "/"`. Set it back to `docs/changes/`.
4. [J9.4] Remove `, unclassified` from **Failure classes**, press **Save settings**: alert `failureClasses must include "unclassified"`. Put it back.
5. [J9.5] Append `, flaky_network` to **Failure classes**, set **Default token measure** to `Input tokens`, press **Save settings**.
   - Expect "These settings override the built-in defaults."
6. [J9.6] **Failed runs** tab: **Failed run class** now offers `flaky_network`. **Trends** tab: **Token measure** starts on "Input tokens" and the Tokens chart subtitle starts "Input tokens per release".
7. [J9.7] **Settings** -> **Reset to defaults**: expect "Showing the built-in defaults. Saving stores an override."

## Journey 10 — Create a release record by hand

1. [J10.1] **Releases** tab, **New release record**. Type `pond` into **Release key**, press **Create release record**.
   - Expect an alert starting `Cannot create release "pond": it needs a date`.
2. [J10.2] Type `bad key!`: alert `Release key may use letters, digits, ".", "_" and "-" only`.
3. [J10.3] Type `2030-04-01-pond-lights` into **Release key** and `Pond Lights` into **Release name**, press **Create release record**.
   - Expect the release's page opening with "Pond Lights · 2030-04-01 · 1 gap to reconcile" and the gap "The release lists no features".
4. [J10.4] Under Features fill **Feature key** `pond-pump`, **Feature name** `Pond pump`, keep **Final status** `passed`, press **Add feature to release**.
   - Expect row `pond-pump` / "Pond pump" with outcome "passed", rounds "none recorded", "Not passed", and the header "3 gaps to reconcile" including "pond-pump — Validated in at least one round: No validation round recorded". (A feature claimed as passed with no recorded round is a gap, not a pass.)
5. [J10.5] Press **Approve reconciliation**: alert "This release is not reconciled yet". Press **← All releases**, type `2030-04-01-pond-lights` into **Release key** again and press **Create release record**: alert `Release "2030-04-01-pond-lights" already exists`.

## Edge cases

- [E.1] **Idempotent importer script** (needs a terminal, so it is optional for the browser validator): `node scripts/import-release-logs.mjs` run twice against the same database prints `imported`/`updated` lines the first time and only `unchanged` the second, exits 0, and prints a `warning:` line (never a silent skip) for each document missing a version line or a "Traces to" section. `--snapshot snapshot.json --release <key>` files a tracker snapshot the same way.
- [E.2] Importing a document outside the configured folders, or not ending in `.md`, is reported as `skipped` with the reason, not ignored.
- [E.3] A release log with no `Date:` header and a key that does not start with a date is refused with a message saying so; nothing is imported from it.
- [E.4] Pasting something that is not JSON into **Snapshot JSON**, or JSON without an `agents` list, shows an error alert; nothing is imported.
- [E.5] The platform's own repository logs (`docs/changes/failed-commands-reconciliation.md`) import as real failed runs, with their "Status" mapped to dispositions; none is hidden.
