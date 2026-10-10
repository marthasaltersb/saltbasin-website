# Change spec — Platform agent runner: Salt Basin runs the release loop's agents itself

Feature key: `platform-agent-runner` · Release: `2026-10-02-application-packages` (0.2.0) · Version 3 (built) · 2026-10-09
Training spec: `docs/training/platform-agent-runner.md` (version 1, written by the build agent from the journeys below)
Version 1 (design) · 2026-10-09. Version 2 (design) · 2026-10-09: sessions capped by the change they are allowed to make, not by spend; a promptable roster of quality agents. Version 3 (built) · 2026-10-09: the build, described in "What changed (version 3)" and the sections after it. The design sections above it are kept as the record of the requirement.
Status: built and initially checked against fixture sessions. Billing and the Render plan for the worker remain open owner decisions (see the end); nothing in the build calls the real Anthropic API.

## Owner direction

> "Can it be in this website platform instead of in Claude? I want to call Claude Code APIs from an agent
> from inside of Salt Basin." — 2026-10-09

Today the release loop is driven from a Claude Code session: a saved workflow starts the agents, a shell
script syncs their journals into the tracker, and the session's own scheduled check-ins keep it moving.
When the session ends, the orchestration ends with it. This feature moves the orchestration into the
platform: a Salt Basin agent starts each stage as a Claude agent session through the Anthropic API,
receives the result, enforces the gates, and records everything in the platform's own tables, which the
platform tracker reads live.

## Traces to

| Earlier spec / code | How this builds on it |
| --- | --- |
| `in-app-release-loop` (`docs/changes/in-app-release-loop.md`, `server/lib/releaseLoopPlatform.js`) | Already stores runs, live steps and bugs (`release_loop_runs`, `release_loop_steps`, `release_loop_bugs`) and enforces the gates server-side. The runner is the missing executor: it creates the agent sessions those rows describe. No second run store. |
| `live-release-tracker` | The platform tracker. With the runner, its data comes straight from the platform tables (real time), not from a Claude Code session's sync script. Its pull-from-GitHub ingest imports the history the Claude Code era committed (`bug-ledger.json`, `tracker-carry.json`, `history.json`, `updates.json`), so nothing is lost at cut-over. |
| `platform-mcp` (`server/lib/mcpToolRegistry.js`) | Interface parity: starting, stopping and inspecting runs are MCP tools calling the same functions as the API. |
| `render-bindings` | Real-time updates over SSE; agent status changes are `journey_rod_events`-style events the screens subscribe to. |
| Spec governance v4 (`definition.json` `specGovernance`, `scripts/release-spec-baseline.mjs`) | Unchanged rules: each agent session runs `check`, validators score with `score`, amendments go to a separate reviewer session. The runner adds a server-side check that refuses to record a validation scored against a baseline other than the one pinned for the round. |
| Agent definitions (`agent_definitions`, `resolveAgentRoster()`) | The release-loop roles are already seeded here by `in-app-release-loop`; each row gains the id of its Claude agent configuration. No new roster table. |
| `.claude/workflows/release-loop.js` | The role prompts move from this script into versioned agent configurations, so the platform and the Claude Code workflow use the same prompts until cut-over. |
| Session mapping / release intelligence | Per-session usage (tokens, list cost, active seconds) is recorded per agent run, so spend trends come from observed numbers. |
| `release-intelligence` (`docs/changes/release-intelligence.md`, `server/lib/releaseIntelligence.js`) | A failed, refused, stopped or `SCOPE_EXCEEDED` agent run on a release-loop run becomes a `release_failed_runs` reconciliation item (`addManualFailedRun`); every run, stop and decision is a `release_reconciliation_events` row (`recordEvent`). Nothing is added to those tables. |
| Earlier partial build (commit `5573227`, branch `release-loop/platform-agent-runner-build`, stopped by a usage limit, untested) | Reviewed and reused: `agentRunner.js`, `agentRunnerAdapters.js`, `agentRunnerCatalog.js`, `agentTestPlan.js`, `agentWorkOrder.js`, `agentWorker.js`, `backlogSeeds.js`, the ten prompt files and the recorded fixtures. Fixed while testing (see "Fix notes"). |

## Choice of Claude surface (recommendation: Managed Agents)

| | Managed Agents (recommended) | Claude Agent SDK on the Salt Basin server | GitHub Actions running Claude Code |
| --- | --- | --- | --- |
| Where the agent's code runs | A container per session hosted by Anthropic (or, optionally, a self-hosted worker) | The Salt Basin server itself | GitHub's runners |
| Repository | Mounted per session (`github_repository` resource, branch checkout); git push goes through Anthropic's git proxy, so the token never enters the container | Clone on the server; the token sits on the server | Checked out by the workflow |
| Cost control | Hard per-session dollar cap (`budget`, pauses at `budget_reached`); `usage.list_cost`, tokens and `active_seconds` reported per session | Only what we write | Actions minutes plus API usage, no per-run cap |
| Telling Salt Basin it finished | Signed webhooks for status changes (no polling), plus an event stream | In process | Workflow-run webhooks |
| "Keep going until it passes" | Outcomes: a separate grader scores each iteration against a rubric | Only what we write | Only what we write |
| Effect on saltbasin.net | Light: API calls and webhooks | Heavy: builds, browsers and databases on the web server | None |

Managed Agents fits best: Salt Basin stays the orchestrator and record keeper, and the heavy work (npm build,
Postgres, Chromium) runs in disposable per-session containers with hard spend caps.

**Unverified, so it is the first task of the build (a spike, reported before anything else is built):** whether
the cloud container can install and run Chromium and a local Postgres 16 (environment packages, network
policy, resource and time limits) and how many sessions can run at once. If it cannot, the fallback is a
self-hosted sandbox worker (`config: {type: "self_hosted"}`) on a machine Salt Basin controls; the agent loop
stays on Anthropic's side either way. The spike result is recorded in this spec before any other work.

## The model

```
 Salt Basin (orchestrator)                            Anthropic (agent sessions)
 ─────────────────────────                            ─────────────────────────
 release_loop_runs  ──start stage──▶  agent run row ──sessions.create(agent, environment,
 (gates, rounds,                      (status,         repo@integration branch, budget,
  bugs, baselines)                     session id,     initial instruction / outcome)) ──▶ container:
        ▲                              usage, cost)                                         git, npm, Chromium,
        │                                   ▲                                               Postgres, spec check
        └──── result.json + usage ◀── webhook (signed) ◀── session idle / terminated ◀─────┘
```

1. **Agent configurations, versioned in the repo.** One Claude agent configuration per release-loop role
   (builder, integrator, validator, triage, scope, amendment reviewer, fixer, reconciler, recorder), kept as
   files under `agents/release-loop/<role>/` and synced with the Anthropic CLI. Each `agent_definitions` row
   for a role records the configuration id and version it runs. Changing a role's prompt is a reviewed
   change to those files, like a spec amendment.
2. **One environment** describing the container: Node 22, Postgres 16, Chromium plus the test fonts,
   networking limited to package registries, GitHub and the Anthropic API.
3. **A stage = one session.** The runner creates the session with the repository mounted at the integration
   branch, the session budget for that role, and the stage instruction (the same text the workflow sends
   today, including the fixed test constraints). The agent writes its result as JSON to
   `/mnt/session/outputs/result.json` against the existing schemas (`VALIDATE_SCHEMA`, `TRIAGE_SCHEMA` …).
4. **Completion.** A signed webhook reports the session idle or terminated. The runner fetches the result
   file and the session's usage, validates the result against its schema (an invalid or missing result is
   a failed run, never a pass), writes the rows, and the gates in `releaseLoopPlatform.js` decide the next
   stage. Polling is the fallback when a webhook is late.
5. **Serial merges.** The integration lock becomes a database row lock (one integration session at a time
   per branch), replacing the shared `mkdir` lock directory.
6. **Live steps.** Validators post each checked step to an authenticated runner endpoint as they go (a
   per-session ingest token, never the owner's credentials), so the tracker shows failures before the round
   ends, as `steps.jsonl` does today.
7. **Credentials.** `ANTHROPIC_API_KEY` stays a server environment variable. The GitHub token (a
   fine-grained token limited to this repository, contents read/write) is stored encrypted with
   `server/lib/crypto.js`, passed only as the session's repository credential (it never enters the
   container), and is rotatable from the UI.
8. **Sessions are capped by the change they may make, not by spend** (owner direction 2026-10-09, see
   "Work orders" below). Usage is still recorded per run for the trends, and a turn limit stops a run that
   loops without progress, but no dollar cap decides when an agent stops.
9. **Cut-over without losing history.** While both exist, the Claude Code workflow and the platform runner
   use the same prompts and gates. Before the platform takes over, `live-release-tracker` imports the
   committed history (`bug-ledger.json`, `tracker-carry.json`, `history.json`, `updates.json`, test results,
   triage files, baselines, amendments). From then on the platform is the record and keeps committing the
   same files back to the repository, so the git history remains complete.

## Work orders: every session is capped by the change it is allowed to make

Owner direction (2026-10-09): *"I'd rather not cap it by spend but more capping the session based on changes
needed so the agent is fixing really intentional items."*

Every agent session that may change code runs against a **work order**, written before it starts and stored
on its run row. The agent can do what the work order lists and nothing else.

| Work-order field | Set by | Meaning |
| --- | --- | --- |
| `items` | Triage (fixes), the backlog (builds) | The bug, amendment or enhancement ids this session addresses. Every commit names the item it serves. |
| `intent` per item | Triage (`proposedFix`) | The one change intended, in a sentence. |
| `files` per item | Triage (`files`), widened only by approval | The files the agent may edit. |
| `size` per item | Triage: S, M or L | A ceiling on changed lines per item (defaults S 40, M 150, L 400; editable in the UI). |
| `forbidden` | Process definition | Training specs, baselines, amendments, the process definition, lockfiles and dependency lists, unless the item is about them. |
| `done_when` | Triage | The baseline step ids that must pass afterwards (the fix's own check). |

Enforcement, in three places:

1. **While the agent works:** the worker checks each file edit against the work order before it happens
   (an Agent SDK pre-tool-use check). An edit outside it is refused with the reason, and the agent may file
   a **scope request** (the file, why, which item) instead of working around it.
2. **Scope requests** go to the triage agent for the same item. It approves when the root cause is in that
   file, and the owner decides anything that adds a dependency, touches another feature's files, or exceeds
   size L. The approval is recorded on the work order; nothing is widened silently.
3. **Before merge:** the integrator compares the branch's diff with the work order: every changed file
   listed, each item within its size, every commit naming an item, nothing forbidden touched. Anything
   outside fails the run as `SCOPE_EXCEEDED` and is not merged. The agent's notes still go to triage.

A session ends when every item is addressed or declared blocked (with the reason), not when a budget runs out.
Items that keep failing still leave the loop for a person after `maxFixAttemptsPerBug`, as today.

## Promptable quality agents

The release loop's roles become a roster of named agents the owner can **talk to directly** from the
platform (World Shell → Journeys → Release loop → Agents; also through the API and MCP). Each one is
confined like the cover-letter agent: a fixed purpose, the data it may read, what it may write, and every
change it proposes goes through the same governance. Prompting an agent creates a run with a work order (for
code changes) or a proposal (for specs and backlog); nothing an agent writes bypasses review.

| Agent | You can ask it to | It writes | Governance |
| --- | --- | --- | --- |
| **Test script writer** | Write the training spec (test script) for a feature or backlog item from its change spec | A draft training spec with stable step ids, preconditions and fixtures | A new spec becomes baseline v1 only after the amendment reviewer checks it against the review checklist |
| **Test runner** | Run a feature's tests: its **smoke** suite or its full **regression** baseline, on desktop and phone | Test results scored with `release-spec-baseline.mjs score` | Runs only pinned baselines under the fixed test constraints; cannot edit specs |
| **Test extender** | Add test steps or scripts for something not covered (a bug that escaped, an edge case) | Amendment proposals (`add` steps) with what they trace to | Amendment reviewer decides; approved ones freeze the next baseline |
| **Bug triager** | File a bug from what you saw, triage open bugs, link duplicates, size them (S/M/L), write work orders | Bugs with root cause, class, files, size and `done_when` steps; scope decisions | Same classes and scope rules as today; owner questions go to you |
| **Smoke vs regression planner** | Decide what to run after a change | A test plan: the smoke suites always, plus the regression baselines of every feature whose files or shared modules the change touched | Smoke suites are fixed lists of baseline step ids (`docs/training/baselines/<feature>/smoke.json`), changed only by amendment |
| **Enhancement proposer** | Suggest improvements from test observations, failed-run patterns, or a direction you give | Enhancement proposals (problem, evidence, value, rough size), never code | You accept, decline or turn one into a backlog seed |
| **Backlog gardener** | Nurture backlog seeds: take a one-line idea and grow it until it is ready to build | For each seed: the problem, your words, open questions for you, acceptance criteria, a draft change spec and draft journeys, a size | A seed is promoted to a feature only when you say so; until then nothing is built |

- **Smoke vs regression.** A smoke suite is a short, fixed set of each feature's most important steps (the
  first journey's happy path, the finalize path, the phone layout), run on every merge in minutes. Regression
  is the full frozen baseline of every passed feature that the change could affect, run before a release is
  approved and whenever shared modules change. Both use the same pinned baselines, so a smoke result and a
  regression result on the same step are comparable.
- **Backlog seeds** reuse the backlog that already exists (bugs placed as `backlog_pre_existing`, scope
  review), plus a seed stage before an item becomes a feature: `seed → shaped → ready → promoted`. A seed
  keeps its full history of questions and answers.
- **Every agent's prompt is a versioned file** in the repository, the same files the Claude Code workflow
  reads, so prompting an agent in the platform and running the workflow give the same behaviour.

## Reuse-first audit (salt-basin-channel-journey-architecture)

| Concept | Classification | Carried by |
| --- | --- | --- |
| Runs, steps, bugs, gates | REUSES EXISTING SUBSTRATE | `release_loop_*` tables and `releaseLoopPlatform.js` from `in-app-release-loop` |
| Agent roles and their prompts | REUSES — one additive column | `agent_definitions` (+ `claude_agent_ref` JSONB: configuration id and version); prompt files in the repo |
| One agent session per stage | REUSES — additive columns | `release_loop_runs` gains `session_id`, `session_status`, `usage` JSONB (tokens, `list_cost`, `active_seconds`), `budget` JSONB, `result` JSONB, via `ADD COLUMN IF NOT EXISTS` in its lazy schema |
| Status changes, real time | REUSES EXISTING SUBSTRATE | Events into the same stream render-bindings' SSE uses |
| GitHub credential | REUSES EXISTING SUBSTRATE | Encrypted with `crypto.js`, stored like other connection credentials (`oauth_connections`) |
| Spend trends | REUSES EXISTING SUBSTRATE | Release intelligence / session mapping, now with observed list cost per run |
| Webhook endpoint, runner service | New code, no new tables | `server/lib/agentRunner.js`, `server/routes/agentRunner.js` |
| Anthropic SDK | Dependency upgrade | `@anthropic-ai/sdk` is at `^0.40.0`; Managed Agents needs a current SDK. The other modules that use the SDK (`careerResumeExtraction.js`, `qualificationGateCheckers.js`, `hiringManagerResearchAgent.js`) are re-checked after the upgrade |

No new tables are proposed. (Version 3 correction: building it proved two gaps, so the build adds `agent_runner_runs` and `agent_runner_outputs`; see "Data model" under "What changed (version 3)".)

## Interface parity

Website (World Shell → Journeys → Release loop, desktop and 390px), API (`/api/agent-runner/*`, admin only,
same gate code) and MCP tools (`release_loop_start_stage`, `release_loop_stop_run`, `release_loop_run_status`,
`release_loop_set_budget`, appended to `mcpToolRegistry.js`) all call the same `agentRunner.js` functions.

## Testing without spending money

Validators cannot call the real API (no key in the test container, and every real session costs money). The
runner talks to Anthropic through one adapter with two implementations: the real Managed Agents adapter, and
a fixture adapter that replays recorded, fictional session timelines (created, running, idle with a
result file, budget reached, terminated with an error, webhook with a bad signature). Every training journey
runs on the fixture adapter. One owner-approved live check, with a small budget, runs a single validator
session against a tiny fixture spec and is recorded in the release log with its observed cost.

## Journeys the training spec must cover

1. Configure the runner from the UI: API key status (set or not set, never shown), GitHub token (stored,
   shown once as last four characters, rotatable), work-order size limits (S/M/L lines) and the turn limit.
2. Start a feature's validation round from the Release loop screen; the run appears as starting → running,
   live steps arrive, and the round finishes with the score from the baseline, in real time without reload.
3. A result missing or failing its schema marks the run failed with the reason; the feature does not pass.
4. A fix run that edits a file outside its work order is refused at the edit; its scope request appears for
   triage; a branch whose diff exceeds the work order fails as `SCOPE_EXCEEDED` and is not merged.
4b. Prompt each quality agent from its screen (test script writer, test runner with smoke and regression,
   test extender, bug triager, smoke-vs-regression planner, enhancement proposer, backlog gardener) and see
   its output land as the governed object (draft spec, results, amendment proposal, bug, plan, proposal,
   shaped seed), never as a direct change.
5. A webhook with a bad signature is rejected and logged; a late webhook is covered by polling.
6. Two integrations queued on one branch run one after the other.
7. Stopping a run interrupts its session and records who stopped it.
8. The same actions through the API and through MCP give the same results and the same permission errors
   for a non-admin.
9. 390px, dark mode, reduced motion; fictional data only.

## Owner decisions

Decided 2026-10-09:

1. **Where the agents run: on Salt Basin's own server, using the Claude Agent SDK** (not Managed Agents).
   The section "Choice of Claude surface" above stays as the record of the comparison. What this decision
   means in practice:
   - **Not inside the website process.** `render.yaml` deploys saltbasin.net as a Render *free* web service:
     it sleeps after 15 minutes idle, has an ephemeral disk and a small memory limit, and has no Chromium or
     Postgres. Builds, browsers and test databases cannot run there, and an agent mid-run would be killed when
     the service sleeps.
   - **A separate Salt Basin agent worker** from the same repository: a Render background worker (paid plan,
     Docker image with Node 22, Postgres 16, Chromium and the test fonts, persistent disk for repository
     clones). It runs `@anthropic-ai/claude-agent-sdk` `query()` for each stage, one working copy per run,
     with a concurrency limit. The website stays the orchestrator and record: it queues stage requests in
     `release_loop_runs`, the worker claims them, streams progress back to the platform API with a worker
     token, and the website shows them live. If the worker is down, queued runs wait and the screen says so.
   - The adapter interface and the fixture adapter for tests are unchanged; the live adapter becomes the
     Agent SDK in the worker instead of Managed Agents sessions.
   - Sessions are capped by their work order (see "Work orders"), with a turn limit only as a runaway stop;
     the worker records tokens and cost per run for the trends.
2. **Fixes reach the code by pushing to the integration branch**, gated by the tests, as the workflow does
   today; the owner approves the release at the end.

Open:

3. **Billing.** The owner asked whether the platform's agents can use the owner's Claude subscription
   instead of API billing. Anthropic's documentation: the Agent SDK overview says "Unless previously
   approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for
   their products, including agents built on the Claude Agent SDK. Use the API key authentication methods
   described in the Quickstart instead." The legal page says subscription sign-in "is designed to support
   ordinary use of Claude Code" and that subscription limits "assume ordinary, individual usage". A
   subscription token (`claude setup-token`) is documented for personal scripts and CI. Running a platform's
   agent worker on it is not documented as allowed, and that usage would draw down the same limits as the
   owner's own Claude use. The build therefore assumes an Anthropic API key (`ANTHROPIC_API_KEY`) unless
   Anthropic confirms otherwise in writing. No spend caps (owner direction): runs are capped by their work
   orders.
4. Which GitHub account owns the fine-grained token the worker pushes with, and the Render plan for the
   worker.

---

# Version 3 - the build

Built 2026-10-09/10 by the build agent from the design above and the earlier partial branch (commit `5573227`). Everything below is what exists in the repository now; the sections above are the requirement it answers.

## What changed (version 3)

### Data model (additive only)

Nothing in bootstrap and nothing touching member rows: every schema statement runs lazily from `ensureAgentRunnerSchema()` (`server/lib/agentRunner.js`) on first use of the runner, with `IF NOT EXISTS`.

| Change | Why it is not a reuse |
| --- | --- |
| New table `agent_runner_runs` (agent key, kind, optional `loop_run_id`, prompt and prompt version, `work_order` JSONB, pinned baseline, queue state, claim, timeline JSONB with a monotonic `seq`, scope requests JSONB, result, usage, diff and checks JSONB, stop request) | The reuse audit (see "Reuse-first audit" above) said no new tables. Building it proved a gap: `release_loop_runs` is one row per feature per release (a stage machine), but one stage needs many agent sessions (a retry, a second validator, an integration queue, a quality agent that belongs to no loop run). `release_failed_runs` holds failures only; `journey_rod_events` is rod-scoped. Queue state (claimed by which worker, attempt, stalled) has no home in any of them. Each row points at its loop run and writes its outcome into the existing `release_loop_*` tables. |
| New table `agent_runner_outputs` (run, kind, status, title, JSONB payload, ref, decision, note) | A proposal that waits for a person (draft spec, amendment proposal, enhancement proposal) and the record of a quality agent's result (test results, plan, bug link, shaped seed) need one place a screen can list by kind and status. The governed objects that already exist (bugs, rounds, seeds, backlog) are written to their own tables as before; this table is the index and the holder of what has no table yet. Nothing in it changes a spec, a baseline or code. |
| `agent_definitions.claude_agent_ref` (JSONB) | From the design: records the prompt file and version each role runs. Seven quality-agent rows are added to the platform default (`org_id`/`owner_user_id` NULL, `pipeline='release_loop_quality'`) insert-if-missing; the release-loop roles learn their prompt file only where unset. |
| `release_loop_bugs.work_order` (JSONB), `.size` | The bug triager's work order for the fix. The release loop's run detail now includes `workOrder` and `size` on each bug (null until filed). |
| `backlog_items.seed_stage`, `.seed_data` (JSONB), `.seed_history` (JSONB) | A seed is a backlog item; `seed -> shaped -> ready -> promoted` is a stage on the existing list, not a second list. A promoted seed becomes `kind='feature'`. |
| `config_state` rows `agent_runner_settings`, `agent_runner_workers` (TEXT JSON) | Settings (size limits, turn limit, concurrency, stalled-after seconds, model, shared modules, extra forbidden paths, settings history), the GitHub token (AES-256-GCM through `crypto.js`, last four characters shown, never returned), the worker token (SHA-256 hash only, shown once) and worker heartbeats. JSON.stringify is correct for these TEXT columns; the JSONB columns above receive raw values. |

### Server

- `server/lib/agentRunner.js`: the one implementation behind the API and MCP: settings, tokens, roster, runs (create, queue, claim, progress, scope requests, complete, stop, requeue, retry), outputs and decisions, overview, test plan, baselines. A run is verified server-side whatever the worker says: the claim, the result schema (`agentRunnerCatalog.js`), the pinned baseline (`BASELINE_MISMATCH`), the score (recomputed with `scripts/release-spec-baseline.mjs score`; the agent's own `passed` flag never decides), and the work-order diff (`SCOPE_EXCEEDED`).
- `server/lib/agentWorkOrder.js` (pure): work-order validation, the pre-edit check `checkEdit`, the post-run `checkDiff` (files, size per item, commits that name an item, forbidden paths), `widenWorkOrder`, `scopeNeedsOwner`. The worker and the platform call the same functions.
- `server/lib/agentRunnerAdapters.js`: ONE interface, two adapters. The **fixture adapter** replays recorded, fictional timelines from `server/data/agentRunner/fixtures/*.json` (no network, no key, no cost); the **Agent SDK adapter** runs `@anthropic-ai/claude-agent-sdk` `query()` with a `PreToolUse` hook that denies an edit outside the work order before it runs, an output schema, the turn limit and a stop signal. It is code-complete, checked against the SDK's type definitions (0.3.295), and exercised here only by the dry run (`node scripts/agent-worker.mjs --self-test`), which uses an in-memory stand-in for the SDK and skips the live call cleanly without a key.
- `server/lib/agentWorker.js` + `scripts/agent-worker.mjs`: the worker. It sends a heartbeat, claims a run, sets up one working copy per run (`git clone`, a work branch for code-editing agents), runs the adapter, streams progress, collects the branch diff, refuses uncommitted changes, pushes only a work branch that passes the same work-order check (never the integration branch), and reports completion. A failed working-copy setup, a rejected token (exit code 3) or an unpushable branch is reported, never swallowed. A stop request ends a quiet session within about a second.
- `server/lib/agentTestPlan.js`: smoke suites (`docs/training/baselines/<feature>/smoke.json`, or a labelled derived list when a feature has none), the shared-module list (editable in Settings) and the smoke-vs-regression plan. `server/lib/backlogSeeds.js` + `backlogSeedRules.js` (pure): the seed lifecycle and its gates.
- `server/routes/agentRunner.js`: `/api/agent-runner/*` (administrators) and `/api/agent-runner/worker/*` (worker token; a rejected call is written to `release_reconciliation_events` and listed on the Overview).
- `server/lib/agentRunnerEmbedded.js`: with `AGENT_RUNNER_FIXTURE_WORKER=1` the website process runs the worker engine in-process on the fixture adapter, so training journeys need no second process. It is refused whenever `RENDER` is set and it can never use the Agent SDK adapter. The same switch is what makes the fictional fixture baseline and scenarios visible; a deployed platform shows neither.
- Agent runs that fail, are refused (`SCOPE_EXCEEDED`) or are stopped on a release-loop run add a reconciliation item to that run, so the run cannot be marked done until a person closes it (`release-intelligence`).

### Client

World Shell -> Journeys -> **Agent runner** (administrators; a World Shell entry point, no nav row, like Capabilities): `src/components/admin/AgentRunnerPanel.jsx` (Overview, Test plan, Settings and the tab frame), `AgentRunnerAgents.jsx`, `AgentRunnerRuns.jsx`, `AgentRunnerOutputs.jsx`, `AgentRunnerSeeds.jsx`, shared bits in `agentRunnerUi.jsx`. Release loop -> a run gains the card **Agent runner** (`AgentRunnerLoopCard.jsx`). One column, 44px tap targets, no hover-only actions, no horizontal scroll at 390px. Every approve, accept, promote and scope-approval path goes through `useToolCategoryGate().run` and the matching server function's `assertReadyToFinalize`. Every error is shown inline (`role="alert"`) and as a toast.

### Quality agents and prompts

Ten prompt files under `agents/release-loop/<role>/` (`agent.json` with the version, `prompt.md`): the seven quality agents (test script writer, test runner, test extender, bug triager, smoke vs regression planner, enhancement proposer, backlog gardener) and the three stage agents (validator, fixer, integrator). The Agents tab shows each file and version read-only; a run records the version it used. Each agent's result is validated against a small schema and lands as its governed object: draft spec, test results, amendment proposal, bug (with work order) or duplicate link, test plan, enhancement proposal, shaped seed. Nothing an agent writes edits a spec, a baseline, the code or the feature list.

### Interface parity

12 rows added to `server/lib/capabilityParity.js` (`Agent runner` group, `server/routes/agentRunner.js` governed) and 13 MCP tools appended to `server/lib/mcpToolRegistry.js` (append-only; `server/data/mcpToolManifest.json` updated): `agent_runner_overview`, `agent_runner_settings`, `agent_runner_list_agents`, `agent_runner_start_run`, `agent_runner_list_runs`, `agent_runner_get_run`, `agent_runner_run_action`, `agent_runner_scope_decision`, `agent_runner_outputs`, `agent_runner_decide_output`, `agent_runner_test_plan`, `agent_runner_baselines`, `agent_runner_seeds`, with scopes `agent.runner.read` and `agent.runner.write`. This replaces the design's four tool names (`release_loop_start_stage` and so on): the tools follow the screens, and stop / requeue / retry are one tool with an action. Two capabilities carry a stated exclusion instead of a tool: the GitHub and worker tokens (a secret never passes through an agent session) and the worker protocol (a program, not a user action). `node scripts/check-interface-parity.mjs` reports every capability working in all three interfaces.

### Deployment

`Dockerfile.worker` (Node 22, git, Postgres 16, Chromium, fonts, the Agent SDK installed with `--no-save`, never in `package.json`; the build runs the dry-run self-test) and a commented, "NEEDS A PAID PLAN" worker service block at the end of `render.yaml`. The website's own service block is unchanged (`plan: free`).

## Behaviour changes to know

- Sessions are capped by their work order, not by spend. There is no spend cap anywhere; usage is recorded as observed (tokens, list cost, active seconds) and a run whose worker reported no cost shows "cost not recorded", never zero.
- A session's turn limit (default 40, editable) only stops a run that loops without progress.
- An edit outside the work order is refused with the reason before it happens; the agent files a scope request instead of working around it. Approving one adds the file to that item and is recorded with the approver and note; a dependency file or an item already at size L is flagged "Needs the owner".
- A branch that touches a file outside the work order, exceeds an item's size, touches a forbidden path or has a commit that names no item ends as `SCOPE_EXCEEDED` and is not merged or pushed.
- A validation round is scored by the platform from the pinned baseline's own steps; an agent that scored against another baseline version, returned nothing, or returned an invalid result is a failed run (and a reconciliation item), never a pass.
- The design's Managed Agents surface (version 1) is superseded by the owner decision of 2026-10-09 (Agent SDK on Salt Basin's own worker); the design's webhook journey (bad signature, late webhook) is replaced by its worker equivalents: a bad worker token is rejected and listed on the Overview, and a worker that stops reporting is shown as stalled and can be put back on the queue.
- The release loop's run detail gained `workOrder` and `size` on bugs (additive). `package.json` gained the script `test:agent-runner`.

## Verified (initial check)

Run on 2026-10-10 against a fresh database (`sb_rl_bld_6400_1`), the production build served, `AGENT_RUNNER_FIXTURE_WORKER=1`:

- `npm run build` passes. The server boots on a fresh database and the runner schema is created lazily.
- Every journey of `docs/training/platform-agent-runner.md` was walked once in Chromium, scripted from the spec, on the desktop pass (1280x900) and the phone pass (390x844, touch): all 88 browser steps passed on both passes, and the command steps of Journeys 12 and 13 and the edge cases passed (28 checks; J12.6 and J12.8 failed on the first run and were fixed, see "Fix notes", and re-checked).
- `node --test tests/agent-runner.test.js`: 13 tests pass (work-order checks, result schemas, test plan, fixture and SDK adapters, seed rules, and the worker against a real local repository: diff collection, push of an in-scope branch only, uncommitted changes, unnamed commits, failed setup).
- `node scripts/check-interface-parity.mjs`: every capability works in all three interfaces; `--self-test` proves the check can fail.
- `node scripts/agent-worker.mjs --self-test`: the Agent SDK adapter dry run passes; `--live` skips cleanly without a key. No real Anthropic API call was made anywhere.
- Also checked by hand (not scripted into the spec): putting a stalled run back on the queue, stopping a stalled run (the platform closes it itself), and that the worker routes answer 401 with a bad token.

## Known limitations

- The Agent SDK adapter has never run a real session in this build (no key, by design). Its first live check is the owner-approved single run described under "Testing without spending money"; until then its behaviour is verified only against the SDK's published types and the dry run.
- The worker has not been deployed: the Render plan for it and the GitHub account that owns its token are open decisions 3 and 4 above. The image has not been built here.
- A session's `usage` is whatever the adapter reports; the fixture adapter reports recorded numbers and no cost. Spend trends in Release Intelligence read observed numbers only.
- The release loop's other roles (builder, triage, spec reviewer, scope agent, reconciler, recorder) are not started by the runner yet; the three stage agents it does start (validation, fix, integration) plus the seven quality agents cover the owner's request. The remaining prompts stay in `.claude/workflows/release-loop.js` until the cut-over.
- Approving a draft spec or an amendment records the decision; the amendment reviewer still freezes the baseline and commits the amendment file (`GET /outputs/:id/amendment` gives its shape). The runner never edits `docs/training`.
- The open screens poll (Overview every 3 seconds, runs every 1.5 seconds); real-time server push from `render-bindings` is not used yet.

## Fix notes

Found and fixed while building and checking (before any validator round):

1. The first worker version exited with code 0 when its token was rejected; it now stops with code 3 and says so.
2. A stop request did not interrupt a quiet session (a replayed 8-second wait) and the fixture still printed the step it was about to run; waits now end early on a stop request and nothing runs after it.
3. `--self-test` left a placeholder key in the environment when `ANTHROPIC_API_KEY` was set to an empty string, which made the `--live` check try a real call; it now restores the environment exactly.
4. A failed working-copy setup left the run claimed forever; it is now reported as a failed run with the reason.
5. Fictional fixture baselines and scenarios were visible on any platform; they now need `AGENT_RUNNER_FIXTURE_WORKER=1` (or `AGENT_RUNNER_ALLOW_FIXTURES=1`) and are never available on Render.
6. `backlogSeeds.js` rules were untestable without a database; they moved to `backlogSeedRules.js`.
