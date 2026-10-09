# Change spec — Platform agent runner: Salt Basin runs the release loop's agents itself

Feature key: `platform-agent-runner` · Release: `2026-10-02-application-packages` (0.2.0) · Version 1 (design) · 2026-10-09
Training spec: `docs/training/platform-agent-runner.md` (written by the build agent, from the journeys below)
Version 2 (design) · 2026-10-09: sessions capped by the change they are allowed to make, not by spend; a promptable roster of quality agents.
Status: design. Owner decisions recorded at the end; billing and hosting remain open. Nothing here is built yet.

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

No new tables are proposed.

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
