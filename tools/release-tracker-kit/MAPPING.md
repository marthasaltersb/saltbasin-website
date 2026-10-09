# Mapping your project system to the release tracker

Use this when your team already tracks work somewhere else (Jira, Azure DevOps, Linear, GitHub, Asana, a
spreadsheet) or follows its own method (Scrum, Kanban, stage-gate). You don't change how your team
works. You answer seven mapping questions once, then send events in the tracker's format (see
`README.md`, "The contract").

## What the tracker counts

The tracker knows five things. Everything in your system has to land on one of them or be left out.

| Tracker concept | What it means | Usually called |
|---|---|---|
| **Feature** | One unit of work that ships and gets tested as a whole | Epic, feature, story, work package, deliverable |
| **Stage** | What is happening to a feature right now: `build`, `integrate`, `validate`, `triage`, `fix`, `record` | Workflow status, board column, phase, gate |
| **Round** | One full test pass of a feature. Round 2 is the re-test after fixes. | QA pass, test cycle, test run, UAT cycle |
| **Bug** | A failed check traced to a cause, linked to one feature | Defect, bug, issue, finding |
| **Agent** | Who or what did a stage: a person, a team, a CI job or an AI agent | Assignee, team, pipeline, bot |

## The seven mapping questions

Answer these in writing before connecting anything. Most mapping problems are a missing answer here.

1. **What is a feature in your system?** Pick *one* item type and the key that names it (e.g. Jira epic
   key `PAY-120`). Stories under it are not separate features unless each one is tested on its own.
2. **Which of your statuses mean each stage?** Map every status to a stage, to "not started", or to
   "done". A status that maps to nothing is a gap, so decide it now.
3. **What counts as one test round, and where do the results come from?** The tracker needs *steps
   passed* and *steps total* per round, from test cases, acceptance criteria or a checklist. "QA said OK"
   is not a result.
4. **How is a bug tied to its feature?** A parent link, an issue link, a label or a field. Every bug must
   resolve to exactly one feature.
5. **How do you tell a returning bug from a new one?** A reopened bug keeps its ID; a new bug report for
   the same cause should name the earlier bug. The tracker counts fix attempts per bug, so this matters.
6. **What needs a business decision rather than a fix?** A "Needs PO decision", "Needs info" or
   "Blocked: business" status maps to the triage class `needs_business_definition`. Those go to the
   owner with the exact question and are never guessed.
7. **When does a stuck bug go to a person?** The default is after 2 fix attempts that the re-test still
   fails (`maxFixAttemptsPerBug` in `tracker.config.json`).

## By method

| Method | Feature | Stages | Round | Business decision |
|---|---|---|---|---|
| **Scrum** | User story or epic that is demoed as a whole | Board statuses within the sprint | Each QA pass on the story (several can happen in one sprint) | Product Owner decision |
| **Kanban** | Card | Columns: "In progress" → `build`, "Review/Merge" → `integrate`, "Testing" → `validate`, "Fixing" → `fix` | Each time a card enters the testing column | Card moved to a "Needs decision" or blocked column |
| **Stage-gate / waterfall** | Work package or deliverable | Phases | Test cycles (SIT 1, SIT 2, UAT) | Gate review or change board |
| **SAFe** | Feature in the Program Increment | Feature Kanban states | System demo or test pass | Product Management decision |

## By tool

These are starting points. Your workflow may use other names, so check the actual statuses and fields.

| Tool | Feature | Bug → feature link | Round results | Returning bug |
|---|---|---|---|---|
| **Jira** | Epic (or story) issue key | Parent epic, or an issue link | Test cases in a test-management app (e.g. Xray, Zephyr), or an acceptance-criteria checklist | Same issue reopened |
| **Azure DevOps** | Feature or User Story work item | Parent/child or Related link | Test Plans: a test run's passed and total outcomes | Same Bug work item reactivated |
| **Linear** | Project or parent issue | Sub-issue or relation | A checklist in the issue, or your CI test report | Same issue reopened |
| **GitHub** | Issue or milestone | Sub-issue, label or "linked issue" | CI test report (e.g. passed/total from the test job) | Same issue reopened |
| **Asana / Monday / spreadsheet** | Task or row | Subtask, or a "Feature" column | A checklist or a pass/total column | Same row; add a "Reopened" count column |

## Sending the events

The tracker reads events in the format described in `README.md`. There is no ready-made Jira or Azure
connector in this kit yet, so a team picks one of two routes:

- **From CI or a script.** Call `log.mjs` when a stage starts and finishes. Example for a Jira epic
  `PAY-120` whose first test pass failed 2 of 12 checks:

  ```bash
  node log.mjs start  runs/2026-10-pay validate:PAY-120:r1
  node log.mjs result runs/2026-10-pay validate:PAY-120:r1 '{"passed":false,"stepsPassed":10,"stepsTotal":12}'
  node log.mjs start  runs/2026-10-pay triage:PAY-120:r1
  node log.mjs result runs/2026-10-pay triage:PAY-120:r1 '{"items":[{"id":"PAY-131","step":"Refund total","rootCause":"Tax not reversed","class":"defect"}]}'
  ```

- **From a webhook or export.** A small adapter reads status changes from your tool and translates them
  with the answers to the seven questions: status → stage, item key → feature, linked defect → bug.

Then run `sync.mjs` to rebuild `snapshot.json` for the board.

## Rules that don't bend

- A stage that ends with no result shows as **failed**, never done.
- A feature only shows **passed** when its latest round passed every step.
- Bug IDs stay stable across rounds. Use your tool's ID, and set `recurrenceOf` when a new report is the
  same bug.
- A missing number shows as "not recorded", never as zero.
- Only labels, statuses, summaries and counts reach the board. Keep personal or customer data out of
  titles and summaries, especially if the board is shared outside the team.
