# Training spec - Platform agent runner: work-order-capped agent sessions and a promptable quality-agent roster

Version 1 · 2026-10-09 · change spec: `docs/changes/platform-agent-runner.md` (version 3). Audience: a test agent driving a real browser (desktop, then a 390px phone walkthrough) with a shell for the few command steps. Follow literally. All data is fictional (a garden-supplies shop); nothing here names an employer or application target.

## Where things are

- World Shell (`/world`) -> top tab **Journeys** -> card **Agent runner** (small text under the title: **Open configuration**). Administrators only. A full-screen panel opens with **← Back to World**, the heading **Agent runner** and seven tabs in this order: **Overview**, **Agents**, **Runs**, **Outputs**, **Test plan**, **Backlog seeds**, **Settings**. **Overview** is open first.
- The release loop's own screen: **Journeys** -> card **Release loop** -> **Open configuration** -> tab **Runs** -> the button **Open run seed-catalog**. Inside an open run there is a card **Agent runner** (new in this feature) that starts the stage agent for the run's current stage.
- **Connected Agents** (card subtitle **Tokens for AI agents (MCP)**) is where an access token for MCP is created (feature `platform-mcp`).
- Nothing in the journeys needs an API call or a script to set something up. Every configurable value (size limits, turn limit, concurrency, stalled-after seconds, model, shared modules, forbidden paths) is edited on the **Settings** tab. The command steps are only in Journey 12, Journey 13 and the edge cases (marked as commands).
- "Text" in an expected result means visible text. The page also holds a hidden `output` element (`data-ux-audit-probe`) whose JSON repeats page text: ignore it.
- Which agent does what, and what each one writes (this is also shown on the **Agents** tab):

| Agent | You can ask it to | It writes (the governed object) | Who decides |
| --- | --- | --- | --- |
| Test script writer | Write the training spec for a feature | **Draft spec** | a person approves or rejects; the amendment reviewer freezes baseline v1 |
| Test runner | Run a feature's smoke suite or full regression | **Test results** scored by `release-spec-baseline.mjs score` | nobody: a record |
| Test extender | Add test steps for something not covered | **Amendment proposal** | a person (never the proposer) approves or rejects |
| Bug triager | File or link a bug and write the work order for its fix | **Bug** on a release-loop run, with its work order | the release loop's own gates |
| Smoke vs regression planner | Decide what to run after a change | **Test plan** computed by the platform from the changed files | nobody: a record |
| Enhancement proposer | Suggest an improvement | **Enhancement proposal** | a person accepts (it becomes a backlog **seed**) or declines |
| Backlog gardener | Grow a one-line seed | **Shaped seed** (problem, questions for you, acceptance criteria, draft change spec and journeys, size) | a person answers, marks ready and promotes |
| Validation agent (stage) | Follow the pinned baseline and record the round | live steps and a **round** | the release loop's gates |
| Fix agent (stage) | Fix the items of a work order, and nothing else | commits on a fix branch | the work order: refused edits, scope requests, `SCOPE_EXCEEDED` |
| Integration agent (stage) | Merge a branch | a merge result | one integration at a time per branch |

Interface parity, per journey (UI path -> API route -> MCP tool). Every API route is admin-only (`/api/agent-runner/*`) except the worker routes (`/api/agent-runner/worker/*`, worker token). Every MCP tool is administrators-only and calls the same function as the route.

| Journey | UI path | API | MCP tool |
| --- | --- | --- | --- |
| 1 Settings and tokens | Agent runner -> Settings | `GET/PUT /settings`, `PUT/DELETE /settings/github-token`, `POST /settings/worker-token` | `agent_runner_settings` (secrets are website-only, by design) |
| 2, 3 Validation rounds | Release loop -> a run -> card Agent runner; Agent runner -> Runs | `POST /runs`, `GET /runs`, `GET /runs/:id` | `agent_runner_start_run`, `agent_runner_list_runs`, `agent_runner_get_run` |
| 4 to 9 Quality agents | Agent runner -> Agents, Outputs, Test plan, Backlog seeds | `GET /agents`, `POST /runs`, `GET /outputs`, `POST /outputs/:id/decision`, `GET /outputs/:id/amendment`, `GET /baselines`, `POST /test-plan`, `/seeds...` | `agent_runner_list_agents`, `agent_runner_start_run`, `agent_runner_outputs`, `agent_runner_decide_output`, `agent_runner_baselines`, `agent_runner_test_plan`, `agent_runner_seeds` |
| 10 Work orders | Agent runner -> Runs -> Fix agent; a run's Scope requests | `POST /runs`, `POST /runs/:id/scope-requests/:rid/decision`, `POST /runs/:id/retry` | `agent_runner_start_run`, `agent_runner_scope_decision`, `agent_runner_run_action` |
| 11 Queue and stop | Agent runner -> Runs | `POST /runs/:id/stop`, `/requeue` | `agent_runner_run_action` |
| 12 Worker | Settings -> Worker token; Overview | worker routes, `GET /overview`, `GET /rejected-worker-calls` | `agent_runner_overview` |
| 13 Parity | Connected Agents; Capabilities | all of the above | all `agent_runner_*` tools |

The seven quality agents and the three stage agents each run a versioned prompt file under `agents/release-loop/<role>/` (the same files the Claude Code workflow reads); the **Agents** tab shows the file and version.

## Preconditions

1. [P.1] A freshly seeded database (`npm run seed`), `node scripts/create-test-member.mjs` run once, the production build served, and the server booted with the environment variable `AGENT_RUNNER_FIXTURE_WORKER=1` (the test environment's fixed constraint: the platform then runs its worker inside the server and replays recorded, fictional agent sessions: no network, no API key, no cost). The administrator `betsy@test.local` is signed in (password = the environment's `ADMIN_INITIAL_PASSWORD`), career and platform terms accepted, `server/data/releaseLoop/definition.json` unchanged at `"version": 4`. One browser session is reused for every step (sign-in allows 10 attempts per 15 minutes per IP). No other data exists. Replace `<API_BASE>` below with the address the browser's `/api` requests go to (the **MCP address** on Connected Agents without the trailing `/mcp`).
2. [P.2] Open `/world`, click **Journeys**, click the card **Agent runner**. Expect the heading **Agent runner**, the seven tabs **Overview**, **Agents**, **Runs**, **Outputs**, **Test plan**, **Backlog seeds**, **Settings**, and within 10 seconds the text **1 worker connected (fixture adapter)**.
3. [P.3] Open **Journeys** -> **Release loop** -> **Open configuration** (tab **Runs**). Type `2030-04-01-garden-gate` into **Release key**, `seed-catalog` into **Feature key**, `Seed catalog` into **Feature name (optional)**, click **Start run**. Expect the heading **seed-catalog · 2030-04-01-garden-gate**. Click **Move to integrate**, then **Move to validate**. Expect **Stage: validate (Validation agent)**. This is "run A"; keep it open for Journey 2. (The release loop's own behaviour is the `in-app-release-loop` feature's spec; here it is only the place the agents work.)
4. [P.4] Phone passes use a viewport 390px wide and 844px tall with touch and the same steps. Desktop passes use 1280px wide. Each pass runs on its own freshly seeded database. Times shown on the page (UTC) are the current time: never compare them.
5. [P.5] Expected noise: console errors for blocked web fonts or certificates (`net::ERR_CERT_AUTHORITY_INVALID`, `ERR_TUNNEL_CONNECTION_FAILED`) are environment noise. The only application requests allowed to fail are the refusals this spec names (HTTP 400, 404 or 409), each at the step that causes it. No page error is allowed.
6. [P.6] After every **Ask ...** or **Start run** the worker needs a moment (fixture sessions take 0 to 10 seconds). Wait until the thing the step names appears (each step says how long is allowed) and never continue on a half-finished run. Output rows are found by their title, never by their number.

## Journey 1 — Settings, size limits and tokens

UI path: Agent runner -> Settings. API: `/api/agent-runner/settings...`. MCP: `agent_runner_settings` (tokens are website-only).

1. [J1.1] Click the tab **Settings**.
   - Expect the cards **Work-order size limits**, **Run limits**, **Paths**, **Anthropic API key**, **GitHub token**, **Worker token**, **Settings history**; the fields **Size S (lines)** `40`, **Size M (lines)** `150`, **Size L (lines)** `400`; the texts **API key: not set in the website environment**, **GitHub token: none stored**, **Worker token: none created** and **No changes yet: the defaults are in use.**
2. [J1.2] Type `abc` into **GitHub token** and click **Save GitHub token**.
   - Expect a red alert **Paste the fine-grained GitHub token (at least 8 characters)** (HTTP 400).
3. [J1.3] Type `ghp_fictional_token_1234` into **GitHub token** and click **Save GitHub token**.
   - Expect **GitHub token: stored, ending in 1234**, the field emptied, and the text `ghp_fictional` nowhere on the page.
4. [J1.4] Click **Create new worker token**.
   - Expect a box **Copy this token now; it is shown once:** containing a token that starts with `sbw_` (keep it as **WORKER_TOKEN**) and the text **Worker token: created, ending in** followed by its last four characters.
5. [J1.5] Click **I have copied it**.
   - Expect the box gone and WORKER_TOKEN nowhere on the page.
6. [J1.6] Set **Size S (lines)** to `20` and **Size M (lines)** to `10`, click **Save settings**.
   - Expect a red alert **Size limits must grow: S no more than M, M no more than L** (HTTP 400).
7. [J1.7] Set **Size M (lines)** to `100`, **Size L (lines)** to `300` and **Stalled after (seconds)** to `30`, click **Save settings**.
   - Expect, in **Settings history**, an entry reading `betsy@test.local · Settings saved`.
8. [J1.8] Click **Overview**, then **Settings** again.
   - Expect **Size S (lines)** `20`, **Size M (lines)** `100`, **Size L (lines)** `300`, **Stalled after (seconds)** `30`, **Turn limit** `40`, **Concurrency** `2`, **Model** `sonnet` (saved, not just typed).
9. [J1.9] Type `0` into **Concurrency** and click **Save settings**; then type `2` back into **Concurrency** without saving.
   - Expect a red alert **Concurrency must be a whole number from 1 to 8** (HTTP 400).

## Journey 2 — A validation round, started from the Release loop screen

UI path: Release loop -> run seed-catalog -> card Agent runner; Agent runner -> Runs. API: `POST /api/agent-runner/runs`, `GET .../runs/:id`. MCP: `agent_runner_start_run`, `agent_runner_get_run`. Fixture baseline: see the appendix (the fictional feature `seed-catalog`, baseline v1, five scored steps).

1. [J2.1] Open **Journeys** -> **Release loop** -> **Open configuration** -> **Open run seed-catalog** (run A, stage validate).
   - Expect a card **Agent runner** containing **No agent runs for this release-loop run yet.**, a field **Fixture scenario (test environments)** and a button **Start validation round with the agent runner**.
2. [J2.2] Choose **validate_fail_one** in **Fixture scenario (test environments)** and click **Start validation round with the agent runner**.
   - Expect, within 5 seconds, a row beginning **Agent run #1 validator**.
3. [J2.3] Watch the card **Live steps** (no page reload).
   - Expect, within 20 seconds, an entry `fail J2.1 round 1 · desktop` with the note **Label is cut off**.
4. [J2.4] Wait for the run to finish.
   - Expect, within 20 seconds, the row **Agent run #1 validator succeeded** and, in **Validation rounds**, **Round 1: failed 4 of 5 steps · console errors 0 · failed requests 0 · fixture0001** (the score comes from the pinned baseline, not from what the agent said).
5. [J2.5] Read the card **Stage**.
   - Expect **Done gate: blocked** with the line **Validation round 1 did not pass**.
6. [J2.6] Click **← Back to World**, open **Journeys** -> **Agent runner** -> **Runs**, click **Open run #1**.
   - Expect the heading **Run #1 · Validation agent**, **Status: succeeded**, **Pinned baseline: seed-catalog v1 (scored steps: 5)**, in the **Timeline** the lines **J2.1 on desktop: fail (Label is cut off)** and **Round recorded from baseline seed-catalog v1: 4 of 5 steps passed (failed)**, and **Usage: 1300 input · 360 output tokens · cost not recorded (recorded fixture session)**.
7. [J2.7] Click **← All runs**, then the tab **Overview**.
   - Expect **Queued 0 · Running 0 · Succeeded 1 · Failed 0 · SCOPE_EXCEEDED 0 · Stopped 0** and, under **Usage (observed, not capped)**, **1 run reported usage · 1300 input tokens · 360 output tokens · cost not recorded**.

## Journey 3 — A missing, invalid or wrongly scored result is never a pass

UI path: Release loop -> run seed-catalog -> card Agent runner. Each scenario below replays a recorded session. Start each one, wait until its row no longer says queued or running, then go on.

1. [J3.1] Open **Journeys** -> **Release loop** -> **Open run seed-catalog**. Choose **validate_wrong_baseline** and click **Start validation round with the agent runner**.
   - Expect, within 30 seconds, the newest agent run row to read **failed** with **The agent scored against baseline v2, but v1 is pinned for this round. Nothing was recorded; a validation round counts only against its pinned baseline.**
2. [J3.2] Choose **validate_no_result** and start a round.
   - Expect the newest row to read **failed** with **The session ended without a result. Nothing was recorded and nothing counts as passed.**
3. [J3.3] Choose **validate_bad_result** and start a round.
   - Expect the newest row to read **failed** with **The result does not match its schema: result.stepsTotal is missing**.
4. [J3.4] Choose **session_error** and start a round.
   - Expect the newest row to read **failed** with **The session failed: Fixture session error: the browser would not start**.
5. [J3.5] Read **Validation rounds** and **Reconciliation items**.
   - Expect only **Round 1: failed 4 of 5 steps** (no round 2), and four open reconciliation items, one per failed run (each with its message above, state **failed**).
6. [J3.6] Click **Mark done**.
   - Expect a red alert **This run cannot be marked done: Validation round 1 did not pass; 4 reconciliation items are unresolved** (HTTP 409).
7. [J3.7] Choose **validate_pass** and start a round.
   - Expect the newest row **succeeded** and, in **Validation rounds**, **Round 2: passed 5 of 5 steps · console errors 0 · failed requests 0 · fixture0001**.
8. [J3.8] Click **Mark done** again.
   - Expect a red alert **This run cannot be marked done: 4 reconciliation items are unresolved** (HTTP 409): a passing round does not hide the failed agent runs.
9. [J3.9] Click **← Back to World**, open **Agent runner** (tab **Overview**).
   - Expect **Queued 0 · Running 0 · Succeeded 2 · Failed 4 · SCOPE_EXCEEDED 0 · Stopped 0**.

## Journey 4 — Test script writer

UI path: Agent runner -> Agents -> Test script writer; Outputs. API: `POST /runs`, `GET /outputs`, `POST /outputs/:id/decision`. MCP: `agent_runner_start_run`, `agent_runner_outputs`, `agent_runner_decide_output`.

1. [J4.1] Click the tab **Agents**. In the card **Test script writer** read the text, then click **View prompt of Test script writer**.
   - Expect the lines **You can ask it to:**, **It writes:**, **Governance:** and **Prompt file agents/release-loop/release_test_script_writer/prompt.md · version 1**, and after the click a prompt text containing **ROLE: Test script writer.**
2. [J4.2] Type `Write the training spec for seed packet reminders` into **Your request to Test script writer** and click **Ask Test script writer**.
   - Expect a note **Run #<n> queued. Its output will appear in Outputs when the worker finishes it.** and a button **Open run #<n>**.
3. [J4.3] Click the tab **Outputs**. Wait for a row **Draft spec: Seed packet reminders** with the status **proposed** (up to 20 seconds). Click its **Open output** button, then **Show the draft text**.
   - Expect **Parsed as a training spec: 1 precondition, 2 journey steps, 1 edge case.**, **Feature seed-reminders.**, and the draft text containing **## Preconditions**.
4. [J4.4] Click **Approve draft** with **Decision note** empty.
   - Expect a red alert **Say why you decided this** (HTTP 400). Then type `Looks right` into **Decision note** and click **Approve draft** again: expect the row to read **Draft spec: Seed packet reminders approved** with **approved by betsy@test.local: Looks right**. (Approving records the decision only; the amendment reviewer freezes baseline v1.)
5. [J4.5] On **Agents**, choose **script_unparseable** in **Fixture scenario for Test script writer (test environments)**, type `Second draft` into the request and click **Ask Test script writer**; open the run from **Runs** once it ends.
   - Expect **Status: failed** and the message **The draft does not parse as a training spec: it needs a "## Preconditions" section and at least one "## Journey <n>" section with numbered steps (found 0 preconditions and 0 journey steps)**, and no second draft in **Outputs**.

## Journey 5 — Test runner: smoke and regression

UI path: Agent runner -> Agents -> Test runner; Outputs. MCP: `agent_runner_start_run`, `agent_runner_outputs`. The runner is pinned to the latest frozen baseline when it starts. The smoke suite of the fictional baseline is `J1.1` and `J2.1`.

1. [J5.1] On **Agents**, in **Test runner** choose **seed-catalog (baseline v1)** in **Feature for Test runner**, **Smoke** in **Suite for Test runner**, type `Run the smoke suite`, click **Ask Test runner**. Open **Outputs**, wait for the row **Test results: seed-catalog smoke v1: 2 of 2** and open it.
   - Expect **2 of 2 steps passed on baseline v1 (smoke)** and **Scored by the baseline script against the pinned baseline; smoke list from smoke.json.**
2. [J5.2] Ask **Test runner** again with **Regression**.
   - Expect a row **Test results: seed-catalog regression v1: 5 of 5**; opened it reads **5 of 5 steps passed on baseline v1 (regression)**.
3. [J5.3] Ask **Test runner** with **Smoke** and the fixture scenario **runner_one_failure**.
   - Expect a row **Test results: seed-catalog smoke v1: 1 of 2**; opened it reads **1 of 2 steps passed on baseline v1 (smoke)**, **Failed: J1.1 on desktop (Did not match the expected result)**, **Failed: J1.1 on mobile (Did not match the expected result)** and **Observation: The Reminders heading is clipped at 390px (not in any step)** (an observation never changes the score).
4. [J5.4] On **Agents**, choose **Choose a feature** in **Feature for Test runner**, type `Run it`, click **Ask Test runner**.
   - Expect a red alert **Choose the feature to test** (HTTP 400).
5. [J5.5] Ask **Test runner** (seed-catalog, Smoke) once more, open its run from **Runs**.
   - Expect **Status: succeeded** and **Pinned baseline: seed-catalog v1 (scored steps: 5)**.

## Journey 6 — Test extender

UI path: Agent runner -> Agents -> Test extender; Outputs. MCP: `agent_runner_start_run`, `agent_runner_decide_output`, `agent_runner_outputs` (with `amendment: true`).

1. [J6.1] On **Agents**, in **Test extender** choose **seed-catalog (baseline v1)**, type `A bug escaped: a second failed save keeps the old error`, click **Ask Test extender**. On **Outputs** open the row **Amendment proposal: Amendment for seed-catalog: 1 change** (status **proposed**).
   - Expect **A bug escaped: clearing the Product field after a failed save kept the old error text**, **Against baseline v1.**, **add: Clear **Product** after a failed save and click **Save**. Expect the error text to be replaced by **Choose a product**.** and **Traces to: Change spec: errors are shown for the current input only**.
2. [J6.2] Type `Reviewed against the checklist` into **Decision note** and click **Approve amendment**.
   - Expect the row to read **Amendment for seed-catalog: 1 change approved**.
3. [J6.3] Click **Show amendment file for output <n>**.
   - Expect a JSON text containing `"fromBaseline": 1`, `"proposedBy": "release_test_extender"` and `"status": "approved"`. (The file shape is `docs/spec-amendments/<feature>/A<n>.json`; the reviewer commits it. Nothing was changed in `docs/training`.)
4. [J6.4] On **Agents** ask **Test extender** (seed-catalog) with the fixture scenario **extender_retire**. On **Outputs** open the new **proposed** amendment row.
   - Expect **retire J1.2: Retire the step** and **Removing J1.2 names no duplicate step, so it goes to the owner.**
5. [J6.5] On **Agents**, choose **Choose a feature** in **Feature for Test extender**, type `x`, click **Ask Test extender**.
   - Expect a red alert **Choose the feature the new steps are for** (HTTP 400).

## Journey 7 — Bug triager and the work order it writes

UI path: Release loop (run B); Agent runner -> Agents -> Bug triager; Runs -> Fix agent. API: `POST /runs`. MCP: `agent_runner_start_run`.

1. [J7.1] Open **Journeys** -> **Release loop**. Type `2030-04-02-garden-gate` into **Release key**, `seed-catalog` into **Feature key**, `Seed catalog` into **Feature name (optional)**, click **Start run**, then **Move to integrate**, then **Move to validate**. This is "run B".
   - Expect **Stage: validate (Validation agent)** under the heading **seed-catalog · 2030-04-02-garden-gate**.
2. [J7.2] In the card **Agent runner** choose **validate_fail_one**, click **Start validation round with the agent runner**, wait for **Round 1: failed 4 of 5 steps**, then click **Move to triage** and **Move to fix**.
   - Expect **Stage: triage (Triage agent)** and then **Stage: fix (Fix agent)**.
3. [J7.3] Click **← Back to World**, open **Agent runner** -> **Agents**. In **Bug triager** open **Release-loop run for Bug triager**.
   - Expect exactly two run options besides **Choose a release-loop run**: **#1 seed-catalog · 2030-04-01-garden-gate (validate)** and **#2 seed-catalog · 2030-04-02-garden-gate (fix)**. Choose the second, type `The label is cut off on a phone` and click **Ask Bug triager**; expect **Run #<n> queued**.
4. [J7.4] On **Outputs** open the row **Bug: seed-catalog-B1: Label is cut off at 390px** (status **filed**).
   - Expect **seed-catalog-B1 · defect · size S · step J2.1**, **Observed: The label is clipped on a phone**, **Root cause: The label has a fixed width**, **Intended fix: Let the label wrap**, **Files: src/label.jsx · Done when: J2.1**.
5. [J7.5] On **Runs** choose **Fix agent** in **Stage agent** and run #2 in **Release-loop run**.
   - Expect the line **Use work order of seed-catalog-B1 size S · src/label.jsx** (the triager's work order is attached to the bug).
6. [J7.6] On **Agents** ask **Bug triager** (run #2) with the fixture scenario **triager_duplicate**, type `seed-catalog-B1` into **Fixture parameter: duplicate of (bug id)** and `Label clipped again` as the request. On **Outputs** open the row **Bug: Duplicate of seed-catalog-B1: Label still clipped** (status **linked**).
   - Expect **Linked as a duplicate of seed-catalog-B1. No new bug was filed.**
7. [J7.7] Ask **Bug triager** (run #2) again with **triager_duplicate** and `seed-catalog-B9` as the duplicate parameter; open its run.
   - Expect **Status: failed** and **The agent linked the report to seed-catalog-B9, which is not a bug of this run**.
8. [J7.8] On **Agents** choose **Choose a release-loop run** in **Release-loop run for Bug triager**, type `x`, click **Ask Bug triager**.
   - Expect a red alert **Choose the release-loop run the bug belongs to** (HTTP 400).
9. [J7.9] Open **Journeys** -> **Release loop** -> the run **2030-04-02-garden-gate** (click the **Open run seed-catalog** button of that run), read **Bugs**.
   - Expect exactly one bug, **seed-catalog-B1 Label is cut off at 390px** with status **open** (the duplicate filed nothing).

## Journey 8 — Test plan: smoke always, regression where the change reaches

UI path: Agent runner -> Test plan; Agents -> Smoke vs regression planner; Settings -> Shared modules. API: `GET /baselines`, `POST /test-plan`. MCP: `agent_runner_baselines`, `agent_runner_test_plan`.

1. [J8.1] Open **Agent runner** -> **Test plan**.
   - Expect the card **Frozen baselines and smoke suites** listing, among the repository's own baselines, the line **seed-catalog · baseline v1 · smoke: 2 steps (smoke.json) · fictional fixture**.
2. [J8.2] Type `docs/fictional-note.md` into **Changed files** and click **Build test plan**.
   - Expect **Regression: 0 baselines, 0 steps**, the text **No feature's files or shared modules were touched, so no full regression is needed.** and, under **Smoke**, the line **seed-catalog v1: J1.1, J2.1 (smoke.json)**.
3. [J8.3] Replace the text with `server/db.js` and click **Build test plan**.
   - Expect the number in **Smoke: <n> suites** to equal the number in **Regression: <n> baselines** (a shared module forces every feature's regression), and the line **seed-catalog v1 (5 steps): shared module changed: server/db.js**.
4. [J8.4] Clear **Changed files** and click **Build test plan**.
   - Expect a red alert **Give at least one changed file** (HTTP 400).
5. [J8.5] Open **Agents**, in **Smoke vs regression planner** type `server/db.js` then a new line `docs/fictional-note.md` into **Changed files for Smoke vs regression planner (one per line)**, type `Plan the tests for this change` as the request, click **Ask Smoke vs regression planner**. On **Outputs** open the row beginning **Test plan: Test plan:**.
   - Expect **Changed: server/db.js, docs/fictional-note.md**, the line **seed-catalog v1: shared module changed: server/db.js** and **Agent's note: The change touches the files listed**.
6. [J8.6] Open **Settings**, remove the line `server/db.js` from **Shared modules (a change forces a full regression, one path or glob per line)** and click **Save settings**; open **Test plan**, build the plan for `server/db.js`.
   - Expect no line for **seed-catalog** under **Regression** any more (the shared-module list is configuration). Then restore the line in **Settings**, save, and build the plan again: expect the **seed-catalog v1 (5 steps): shared module changed: server/db.js** line back.

## Journey 9 — Enhancement proposer, backlog seeds and the Backlog gardener

UI path: Agent runner -> Agents -> Enhancement proposer; Outputs; Backlog seeds. API: `/seeds...`. MCP: `agent_runner_seeds`, `agent_runner_decide_output`.

1. [J9.1] On **Agents**, type `Suggest one improvement` into **Your request to Enhancement proposer** and click **Ask Enhancement proposer**. On **Outputs** open the row **Enhancement proposal: Show a seed packet count on the reminders list** (status **proposed**).
   - Expect **Problem: Owners cannot see how many reminders exist without scrolling**, **Evidence: Observation from the seed-catalog round 1 (fictional)**, **Value: Faster scanning of the list**, **Rough size: S**.
2. [J9.2] Click **Accept enhancement** with the note empty; then type `Worth doing` and click **Accept enhancement** again.
   - Expect first a red alert **Say why you decided this** (HTTP 400), then the text **Became backlog seed #1.**
3. [J9.3] Open **Backlog seeds**.
   - Expect the seed **#1 Show a seed packet count on the reminders list** in stage **seed**, its words ending in **(Enhancement proposal #<n>; evidence: Observation from the seed-catalog round 1 (fictional); value: Faster scanning of the list; rough size S)** (an accepted proposal becomes a seed, never a feature).
4. [J9.4] Type `Seed packet reminders` into **Seed title**, `Remind shop owners to re-order seed packets before planting season` into **Your idea in your own words**, click **Add seed**.
   - Expect the seed **#2 Seed packet reminders** in stage **seed** with **History of seed 2 (1)**.
5. [J9.5] Click **Move seed 2 to shaped**.
   - Expect a red alert **This seed cannot become shaped: the problem is not written; there is no acceptance criterion** (HTTP 409).
6. [J9.6] Click **Ask the Backlog gardener to grow seed 2**.
   - Expect the run page to open and, within 15 seconds, **Status: succeeded** with **Shaped seed: Seed #2 Seed packet reminders: shaped applied** under **What this run produced**.
7. [J9.7] Open **Backlog seeds** again.
   - Expect seed **#2** in stage **shaped** with **Problem: Shop owners forget to re-order seed packets before the planting season.**, **Question 1: Should reminders be sent by email, in the app, or both?**, the acceptance criteria **An owner can create a reminder for a product** and **A reminder shows its due date**, and **Size: M**.
8. [J9.8] Click **Mark seed 2 ready**.
   - Expect a red alert **This seed cannot become ready: 1 open question is unanswered** (HTTP 409).
9. [J9.9] Type `Both: email and in the app` into **Answer to question 1 of seed 2**, click **Save answer 1 of seed 2**, then **Mark seed 2 ready**.
   - Expect **Answer: Both: email and in the app** and then a button **Promote seed 2 to a feature**.
10. [J9.10] Click **Promote seed 2 to a feature**.
   - Expect **Promoted: it is a feature in the backlog now. Nothing was built by promoting it.** and **History of seed 2 (5)**. (If the proficiency-category gate opens, categorise the technologies it lists and continue: promotion is a finalize path.)
11. [J9.11] Open **Agents** and open **Backlog seed for Backlog gardener**.
   - Expect the option **#1 ...** and no option **#2 ...** (a promoted seed is no longer shaped by the gardener).
12. [J9.12] Count the rows on **Outputs**. On **Agents** ask **Enhancement proposer** with the fixture scenario **quality_bad_result** (request `Suggest again`); open its run from **Runs**.
   - Expect **Status: failed** and **The result does not match its schema: result.title is missing; result.problem is missing; result.evidence is missing; result.value is missing; result.size is missing**, and the same number of rows on **Outputs** as before.

## Journey 10 — Work orders: a fix agent can do what its work order lists, and nothing else

UI path: Agent runner -> Runs -> Start a stage run -> Fix agent; a run's Work order, Scope requests and Branch check; Release loop -> run B. API: `POST /runs` (with `workOrder` or `bugKeys`), `POST /runs/:id/scope-requests/:rid/decision`, `POST /runs/:id/retry`. MCP: `agent_runner_start_run`, `agent_runner_scope_decision`, `agent_runner_run_action`. Size limits are those saved in Journey 1 (S = 20 lines). Run B is the release-loop run in stage fix.

1. [J10.1] Open **Agent runner** -> **Runs**. Choose **Fix agent** in **Stage agent**, run #2 in **Release-loop run**, tick **Use work order of seed-catalog-B1**, choose **fix_in_scope** in **Fixture scenario (test environments)**, click **Start run**.
   - Expect the run page **Run #<n> · Fix agent** and, within 15 seconds, **Status: succeeded**. The card **Work order** reads **seed-catalog-B1 · size S (20 lines)**, **Let the label wrap**, **May edit: src/label.jsx**, **Done when these steps pass: J2.1** and **Forbidden unless an item is about them: docs/training/**, docs/spec-amendments/**, server/data/releaseLoop/definition.json, package-lock.json, package.json, server/data/applicationPackages/**, .git/**, .claude/**`.
2. [J10.2] Read **Branch check against the work order** and the **Timeline**.
   - Expect **within the work order** and **seed-catalog-B1: 14 of 20 lines (size S)**; the Timeline lines **Edit allowed: src/label.jsx** and **Fix branch release-loop/seed-catalog-fix-r1 (abc1234): 1 item fixed; diff within the work order, ready for the integrator**.
3. [J10.3] Open **Release loop** -> run **2030-04-02-garden-gate**.
   - Expect the bug **seed-catalog-B1 Label is cut off at 390px** with status **fixed_awaiting_retest** and under **Fixes** **seed-catalog-B1 · fix round 1: Wrapped the label**.
4. [J10.4] In **Add a bug from triage** add two bugs: **Bug title** `Label cut off two` and then `Label cut off three`, **Bug step id** `J2.1`, **Observed** `Clipped`, click **Add bug** each time.
   - Expect **seed-catalog-B2 Label cut off two open** and **seed-catalog-B3 Label cut off three open**.
5. [J10.5] Back in **Agent runner** -> **Runs**: **Fix agent**, run #2, type `seed-catalog-B2` into **Item id**, `Let the label wrap` into **Intent (the one change intended)**, `src/label.jsx` into **Files it may edit (one per line)**, leave **Size** `S`, type `J2.1` into **Done when (step ids)**, click **Add item to work order**, choose **fix_refused_edit**, click **Start run**.
   - Expect, within 15 seconds, **Status: succeeded** and in the Timeline **Edit refused: src/gate.jsx (NOT_IN_WORK_ORDER). src/gate.jsx is not listed in this work order.** then **Scope request S1: src/gate.jsx for seed-catalog-B2.**; the card **Scope requests** reads **S1 · src/gate.jsx for seed-catalog-B2 pending** with **The label width is computed in src/gate.jsx, so the root cause is there**; the last Timeline line says **0 items fixed, 1 not fixed (seed-catalog-B2)**.
6. [J10.6] Click **← All runs**, then the tab **Overview**.
   - Expect under **Waiting for you** **1 proposal · 1 scope request** (the one proposal is the retire amendment from Journey 6, waiting for the owner).
7. [J10.7] Open that run again (the newest **Fix agent** row), click **Approve scope request S1** with **Note for S1** empty; then type `The width is computed in the gate; root cause confirmed` and click **Approve scope request S1** again.
   - Expect first a red alert **Say why you decided this** (HTTP 400); then **approved by betsy@test.local: The width is computed in the gate; root cause confirmed**, the work order line **May edit: src/label.jsx, src/gate.jsx** and **Widened: src/gate.jsx added to seed-catalog-B2 by betsy@test.local (The width is computed in the gate; root cause confirmed)**.
8. [J10.8] Choose **fix_widened** in **Fixture scenario for the retry (test environments)** and click **Retry with the current work order**.
   - Expect a new run page that, within 15 seconds, reads **Status: succeeded**, with **seed-catalog-B2: 7 of 20 lines (size S)** in **Branch check against the work order** and the Timeline line **Edit allowed: src/gate.jsx**.
9. [J10.9] Click **← All runs**. Start a **Fix agent** run for run #2 with the item `seed-catalog-B3` (intent `Let the label wrap`, files `src/label.jsx`, size `S`, done when `J2.1`) and the scenario **fix_over_scope**.
   - Expect, within 15 seconds, **Status: SCOPE EXCEEDED** and the red message **SCOPE_EXCEEDED: src/extra.jsx changed but is not listed in the work order; seed-catalog-B3 changed 50 lines; size S allows 20; commit 9990000 does not name a work-order item: "tidy up". The branch was not merged; the agent's notes are kept for triage.** The card **Branch check against the work order** reads **violations**, **seed-catalog-B3: 50 of 20 lines (size S)**, **NOT_IN_WORK_ORDER: src/extra.jsx changed but is not listed in the work order**, **OVER_SIZE: seed-catalog-B3 changed 50 lines; size S allows 20** and **COMMIT_UNNAMED: commit 9990000 does not name a work-order item: "tidy up"**.
10. [J10.10] Open **Release loop** -> run **2030-04-02-garden-gate**.
   - Expect **seed-catalog-B3 Label cut off three open** (nothing was fixed or merged) and, under **Reconciliation items**, an **open** item starting **SCOPE_EXCEEDED: src/extra.jsx changed but is not listed in the work order**, state **refused**, with **State left: The branch was not merged; the agent's notes are kept on the run**.
11. [J10.11] In **Agent runner** -> **Runs** start a **Fix agent** run for run #2 with the item `seed-catalog-B3` (as above) and the scenario **fix_refused_edit**. On its page type `Not the cause` into **Note for S1** and click **Decline scope request S1**.
   - Expect **declined by betsy@test.local: Not the cause** and the work order still reading **May edit: src/label.jsx** only.
12. [J10.12] Click **← All runs**. With **Fix agent** and run #2 chosen and nothing added, click **Start run**; then type only `x` into **Intent** and click **Add item to work order**; then fill **Item id** `ghost-1`, **Intent** `x`, **Files it may edit** `src/a.jsx`, add the item and click **Start run**.
   - Expect, in order, the red alerts **Give the work order, or choose the bugs whose work orders it is built from** (HTTP 400), **An item needs its id, its intent and at least one file it may edit** (no request), and **Item ghost-1 is not a bug of this run** (HTTP 404).
13. [J10.13] Reload the page and open **Agent runner** -> **Runs**. Choose **Fix agent**, run #1 (the validate-stage run A), item `seed-catalog-B1` (intent `x`, files `src/a.jsx`), click **Add item to work order**, click **Start run**.
   - Expect a red alert **A fix run starts while the run is in the "fix" stage (it is in "validate")** (HTTP 409).

## Journey 11 — One integration at a time per branch, and stopping a run

UI path: Agent runner -> Runs -> Integration agent. API: `POST /runs`, `POST /runs/:id/stop`. MCP: `agent_runner_start_run`, `agent_runner_run_action`. The scenario **integrate_slow** holds the integration lock for about 8 seconds.

1. [J11.1] On **Runs** choose **Integration agent**, type `release-loop/seed-catalog-build` into **Branch to integrate**, choose **integrate_slow**, click **Start run**.
   - Expect the run page and, within 10 seconds, **Status: running**.
2. [J11.2] Click **← All runs** and start the same again (same branch, **integrate_slow**).
   - Expect **Status: queued** and **Waiting for integration run #<n> on branch release-loop/seed-catalog-build to finish (one integration at a time per branch)** (within 4 seconds).
3. [J11.3] Wait.
   - Expect, within 25 seconds, the second run's **Status: running** (it started only after the first finished), and in **Runs** the first run **succeeded**.
4. [J11.4] While the second run is **running**, click **Stop run**.
   - Expect, within 15 seconds, **Status: stopped**, **Stop requested by betsy@test.local**, the Timeline line **Stopped by betsy@test.local; the session was interrupted**, no button **Stop run**, and a button **Retry with the current work order**.
5. [J11.5] Click **← All runs**, then the tab **Overview**.
   - Expect **Stopped 1** in the line under **Runs**.

## Journey 12 — The worker program, its token and the Agent SDK dry run

Commands run in a shell in the repository. `<WORKER_TOKEN>` is the token kept in Journey 1. UI path for the evidence: Agent runner -> Overview and Settings.

1. [J12.1] Run `node scripts/agent-worker.mjs --once --api <API_BASE> --id cli-bad --token sbw_not-the-token`.
   - Expect exit code 3 and the lines `platform call failed: The worker token was not accepted` and `The worker token was rejected; stopping. Create a new token in World Shell > Journeys > Agent runner > Settings.`
2. [J12.2] Open **Agent runner** -> **Overview**.
   - Expect under **Rejected worker calls** an entry **A worker call used a token that is not the current worker token** with the path `/worker/heartbeat`.
3. [J12.3] Run `node scripts/agent-worker.mjs --once --api <API_BASE> --id cli-check --token <WORKER_TOKEN>`.
   - Expect exit code 0 and the lines `worker started: adapter fixture` and `worker stopped`.
4. [J12.4] Reload **Overview**.
   - Expect, under **Worker**, a line beginning **cli-check · fixture adapter**.
5. [J12.5] Run `node scripts/agent-worker.mjs --self-test`.
   - Expect exit code 0, the five lines `PASS  edit outside the work order is denied before it runs`, `PASS  edit inside the work order is allowed`, `PASS  a refusal is reported as an event`, `PASS  structured output becomes the result`, `PASS  usage is mapped from what the SDK reported`, and the last line `NOT RUN  live Agent SDK check (pass --live; it is skipped without ANTHROPIC_API_KEY)`.
6. [J12.6] Run `node scripts/agent-worker.mjs --self-test --live` in a shell where `ANTHROPIC_API_KEY` is not set.
   - Expect exit code 0 and the last line `SKIPPED  live Agent SDK check: ANTHROPIC_API_KEY is not set` (no network call is made).
7. [J12.7] In **Settings** click **Create new worker token**, click **I have copied it**, then run `node scripts/agent-worker.mjs --once --api <API_BASE> --id cli-old --token <WORKER_TOKEN>` (the first token).
   - Expect the Settings text **Worker token: created, ending in** with new last four characters, and the command to exit with code 3 (the old token stopped working at once).
8. [J12.8] Run `grep -n "^    plan: free" render.yaml` and then `grep -c "NEEDS A PAID PLAN" render.yaml`.
   - Expect the first command to print exactly one line (the website's own service, unchanged) and the second to print `1` (the worker service definition is commented and says it needs a paid plan). Run `ls Dockerfile.worker scripts/agent-worker.mjs` and expect both names printed.

## Journey 13 — The same actions through the API and MCP, with the same permissions

Commands run in a shell. `<ADMIN_PASSWORD>` is the environment's `ADMIN_INITIAL_PASSWORD`. The MCP client is `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN> list | call <tool> '<json>'` (see `platform-mcp`).

1. [J13.1] Open **Journeys** -> **Connected Agents**, type `Runner agent` into **Token name**, tick **agent.runner.read** and **agent.runner.write**, click **Create token**.
   - Expect the once-only box **Copy your token now. It will not be shown again.** with a token starting `sbpat_` (keep it as **TOKEN_R**); click **I have copied it**.
2. [J13.2] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_R> list`.
   - Expect exit code 0 and exactly these lines in this order: `agent_runner_overview`, `agent_runner_settings`, `agent_runner_list_agents`, `agent_runner_start_run`, `agent_runner_list_runs`, `agent_runner_get_run`, `agent_runner_run_action`, `agent_runner_scope_decision`, `agent_runner_outputs`, `agent_runner_decide_output`, `agent_runner_test_plan`, `agent_runner_baselines`, `agent_runner_seeds`, `13 tools`.
3. [J13.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_R> call agent_runner_list_agents`.
   - Expect `isError: false` and a result with exactly 10 agents whose `key` values include `release_test_script_writer`, `release_test_runner`, `release_test_extender`, `release_bug_triager`, `release_test_planner`, `release_enhancement_proposer`, `release_backlog_gardener`, `release_validator`, `release_fixer` and `release_integrator`, each with `promptVersion` 1.
4. [J13.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_R> call agent_runner_start_run '{"agentKey": "release_enhancement_proposer", "prompt": "Suggest one improvement through MCP"}'`.
   - Expect `isError: false`, `status` `queued`, `createdBy` `betsy@test.local`. Keep its `id` as **RUN_MCP**. In the website open **Agent runner** -> **Runs** -> **Open run #<RUN_MCP>**: expect **Request: Suggest one improvement through MCP** and, within 15 seconds, **Status: succeeded**.
5. [J13.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_R> call agent_runner_test_plan '{"changedFiles": [" "]}'`.
   - Expect `isError: true` and an error with `status` 400 and `message` `Give at least one changed file` (the message the **Test plan** tab showed in J8.4).
6. [J13.6] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_R> call agent_runner_run_action '{"runId": <RUN_MCP>, "action": "stop"}'`.
   - Expect `isError: true` and an error with `status` 409 and `message` `This run is already succeeded`.
7. [J13.7] Run `curl -s -c admin.jar -H "Content-Type: application/json" -d '{"email":"betsy@test.local","password":"<ADMIN_PASSWORD>"}' <API_BASE>/api/auth/login`, then `curl -s -b admin.jar <API_BASE>/api/agent-runner/agents`.
   - Expect the second command to print JSON whose `agents` list has 10 entries (the same list MCP returned).
8. [J13.8] Run `curl -s -o /dev/null -w "%{http_code}" -b admin.jar -H "Content-Type: application/json" -d '{"changedFiles":[]}' <API_BASE>/api/agent-runner/test-plan`.
   - Expect `400`.
9. [J13.9] Run `curl -s -o /dev/null -w "%{http_code}" -X POST <API_BASE>/api/agent-runner/worker/claim`.
   - Expect `401` (a worker call with no token is rejected; the Overview's **Rejected worker calls** lists it).
10. [J13.10] In a second browser session sign in as the member `member@test.local` (password `TestPass!2345`) at `/login`, open `/world`, click **Journeys**.
   - Expect the card **Connected Agents** and no card **Agent runner**.
11. [J13.11] As the member open **Connected Agents**, type `Member probe` into **Token name**, tick **agent.runner.read**, click **Create token** (keep the token as **TOKEN_M**), then run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_M> call agent_runner_overview`.
   - Expect `isError: true` and an error with `status` 403, `code` `forbidden` and `message` `agent_runner_overview is for administrators only. You are signed in as a member.`
12. [J13.12] Run `curl -s -c member.jar -H "Content-Type: application/json" -d '{"email":"member@test.local","password":"TestPass!2345"}' <API_BASE>/api/auth/login`, then `curl -s -o /dev/null -w "%{http_code}" -b member.jar <API_BASE>/api/agent-runner/overview`.
   - Expect `403` (the same permission refusal the MCP tool gave).
13. [J13.13] In the administrator's session open **Journeys** -> **Capabilities** and find the card **Prompt an agent, watch, stop, requeue and retry its run (admin)**.
   - Expect its three cells **Website ready**, **API ready** and **MCP ready** (MCP showing `agent_runner_start_run`).
14. [J13.14] Run `node scripts/check-interface-parity.mjs`.
   - Expect exit code 0 and the last line `OK: the registry matches the code.`

## Edge cases

- [E.1] On each of the seven tabs of **Agent runner** at the current viewport, expect no horizontal scrolling (the page is not wider than the viewport) and every button inside the panel at least 44 pixels tall (phone pass: 390px).
- [E.2] Run `node scripts/agent-worker.mjs --once --api <API_BASE> --adapter nope --token x`. Expect exit code 2 and a line starting `Unknown adapter "nope"`.
- [E.3] Run `curl -s -o /dev/null -w "%{http_code}" -b admin.jar -H "Content-Type: application/json" -d '{"agentKey":"release_enhancement_proposer","prompt":"x","fixtureScenario":"nope"}' <API_BASE>/api/agent-runner/runs`. Expect `400` (the scenario does not exist).
- [E.4] Run `grep -h '"version"' agents/release-loop/*/agent.json | sort | uniq -c`. Expect exactly one line, ignoring leading spaces: `10   "version": 1,` (ten versioned prompt files, all at version 1).
- [E.5] Run `node scripts/check-interface-parity.mjs --self-test`. Expect exit code 0 and the last line `SELF-TEST OK: all 3 injected problems were detected.`
- [E.6] Run `ls docs/training/baselines/platform-agent-runner/`. Expect the file `smoke.json` (the feature's own smoke suite, changed only by amendment) and, once the integrator has frozen this spec, `v1.json`.
- [E.7] On **Agents**, open **View prompt of Bug triager**. Expect the prompt text to contain **ROLE: Bug triager.** and the card to say **version 1**; there is no button anywhere on the screen that edits a prompt (a prompt changes only by a reviewed change to its file).

## Appendix - fixtures and fixed constraints

- Fictional baseline `seed-catalog` v1 (a fixture of the test environment, listed beside the repository's real baselines because `AGENT_RUNNER_FIXTURE_WORKER=1`): scored steps `J1.1` (open the catalog and read the heading), `J1.2` (search for a seed packet), `J2.1` (approve the catalog page), `J2.2` (read the catalog at 390px), `E.1` (empty search shows a hint); precondition `P.1`. Smoke suite: `J1.1`, `J2.1`.
- Recorded fixture scenarios used here (selectable only in this test environment): `validate_pass`, `validate_fail_one`, `validate_wrong_baseline`, `validate_no_result`, `validate_bad_result`, `session_error`, `script_ok` (default for the Test script writer), `script_unparseable`, `runner_ok` (default), `runner_one_failure`, `extender_ok` (default), `extender_retire`, `triager_ok` (default), `triager_duplicate`, `planner_ok` (default), `enhancement_ok` (default), `quality_bad_result`, `gardener_ok` (default), `fix_in_scope` (default), `fix_refused_edit`, `fix_widened`, `fix_over_scope`, `integrate_ok` (default), `integrate_slow`.
- Fixed test constraints: the pinned baseline of the feature under test, the accounts from `scripts/create-test-member.mjs`, desktop 1280x900 light and phone 390x844 touch light, `en-US`, UTC. No step may use the real Anthropic API: this environment has no key.
