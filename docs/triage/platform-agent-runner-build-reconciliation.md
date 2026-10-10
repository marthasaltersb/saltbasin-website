# Reconciliation: platform-agent-runner build (release 2026-10-02-application-packages-resume)

Reconciliation agent rec-6400-2, 2026-10-10. Branch `release-loop/platform-agent-runner-build` at a679da7. No code changed.

Re-verified on a fresh database: `npm run build` passes; spec walk on desktop 88 checks, 0 failed; command journeys J12/J13/E 28 checks, 0 failed (after the last code edit; a second run fails J12.3 only because the worker token was already rotated); `node --test tests/agent-runner.test.js` 13 pass; `check-interface-parity.mjs` 82/82; `agent-worker.mjs --self-test` passes and `--live` skips without a key. The 390px pass was not re-run here.

## Reported notes

| # | Item | Kind | Status | Evidence |
|---|---|---|---|---|
| 1 | Branch name already existed, merged integration into it | process | resolved | Branch exists, HEAD a679da7. BUT the branch is stale against the current integration head: see U1 |
| 2 | Python edit denied by classifier, redone with Edit | process | resolved | File is edited in the branch; no state left |
| 3 | Compound Bash refused by worktree guard | environment | resolved | No state change; also hit again in this run |
| 4 | 7 of 88 first-walk steps failed | test_harness | resolved | Re-walked 88/88 here on desktop. The J8.6 wording was changed in the build agent's own unfrozen spec (no baseline exists), so no frozen-spec rule was broken |
| 5 | J12.6 self-test left a placeholder key | product_defect (fixed) | resolved | `--self-test --live` with no key prints SKIPPED; J12.6 passes |
| 6 | J12.8 grep matched a comment | test_harness | resolved | J12.8 passes in the current spec |
| 7 | J12.3 fails on rerun (token rotated by J12.7) | test_harness | resolved | Reproduced: first run passes, rerun fails only J12.3. Spec should say "fresh database only" |
| 8 | "fatal: expected acknowledgments, received packfile" in unit tests | environment | resolved | git 2.43 protocol v2 noise from the worker test's push to a local repository ("warning: push negotiation failed; proceeding anyway with push"). Emitted by tests 1 and 12, the push still happens, test passes. Harmless, but never traced by the build agent |
| 9 | `release-spec-baseline.mjs check --all` says no frozen baseline | process | unresolved | Output "platform-agent-runner: no frozen baseline", exit 0. The integrator must freeze v1 (spec plus `smoke.json`) before validators run |
| 10 | Command journeys not re-run after last edit | process | resolved | Re-run here, all pass |

## Unresolved items

### U1 - Branch is behind the integration branch and conflicts
- kind: process, unresolved
- Evidence: `git log HEAD..claude/zealous-meitner-5tuft5` lists new integration commits (chart-gallery, qr-gated-outputs, resume-rollups, tracker state). `git merge-tree` reports content conflicts in `server/lib/capabilityParity.js` and `server/lib/mcpToolRegistry.js` (auto-merges of `server/index.js`, `WorldShell.jsx`, `api.js`, `worldIslands.js`). A plain diff against the integration head shows renderBindings and worldLayers files as deleted, i.e. the build never saw them.
- rootCause: the build merged integration at b7b90dc and integration has moved on.
- files: server/lib/capabilityParity.js, server/lib/mcpToolRegistry.js, server/data/mcpToolManifest.json
- proposedFix: integrator merges integration into the branch. mcpToolRegistry.js and the manifest are append-only, so keep both sides' tools; re-run `check-interface-parity.mjs`, build, and `release-spec-baseline.mjs check --all`.

### U2 - Fixes do not reach the integration branch (owner decision 2 not implemented)
- kind: requirement_gap, unresolved
- Evidence: change spec "Owner decisions" 2: fixes reach the code by pushing to the integration branch, gated by tests. `agents/release-loop/release_integrator/prompt.md` says "Never push", while `scripts/agent-worker.mjs:115` hands the integrator push credentials (`agentEnv`). `agentWorker.js` pushes only a run's own work branch. `agentRunner.js:741` trusts the agent-reported `merged`/`head` with no check that the integration branch advanced, that the build passed, or that `check --all` passed.
- rootCause: the build never pushes integration; the integration step is self-reported.
- files: agents/release-loop/release_integrator/prompt.md, server/lib/agentWorker.js, scripts/agent-worker.mjs, server/lib/agentRunner.js
- proposedFix: have the worker (not the agent) perform or verify the push of a branch that passed the diff check, build and baseline check; record the head pushed; verify `merged:true` against the remote ref. Fix the prompt to match. Ask the owner only if worker pushes to integration are not wanted.

### U3 - Agent usage not filed into Release Intelligence / session mapping
- kind: requirement_gap, unresolved
- Evidence: the reuse audit says spend trends reuse release intelligence / session mapping with observed list cost per run. `grep session_analyses|recordInAppAgentRun` in `server/lib/agentRunner*.js` and the route returns nothing; usage lives only in `agent_runner_runs.usage` and the runner's own Overview sum (`agentRunner.js:914-922`).
- files: server/lib/agentRunner.js (complete path), session mapping recorder (`recordInAppAgentRun`)
- proposedFix: on completion call the existing in-app-agent-run recorder (metrics only, never throws into the request, "not priced" when no cost) so Sessions and trends include runner runs. Add a journey step.

### U4 - The Claude Code workflow does not read the prompt files
- kind: requirement_gap (also a spec cut-over limitation), unresolved
- Evidence: design says prompts are "the same files the Claude Code workflow reads". `grep agents/release-loop .claude/workflows` finds nothing; `agents/release-loop/README.md` admits the workflow keeps its own copy.
- files: .claude/workflows/release-loop.js, agents/release-loop/*/prompt.md
- proposedFix: make the workflow read the prompt files for the roles that exist, so there is one source.

### U5 - Pre-edit check covers only file-writing tools
- kind: product_defect, unresolved
- Evidence: `agentRunnerAdapters.js:136-148` checks `EDIT_TOOLS` only; every other tool including Bash is allowed. `sed -i` or a redirect in Bash edits outside the work order unchecked until the post-run diff (SCOPE_EXCEEDED, which still blocks the push). `env: { ...process.env }` hands the agent's Bash the worker token and API key. `permissionMode: 'acceptEdits'` is untested live.
- files: server/lib/agentRunnerAdapters.js
- proposedFix: in the hook, deny Bash commands whose write targets fall outside the work order (or run Bash read-only); strip `AGENT_RUNNER_TOKEN` and the GitHub header from the agent env; keep the diff check as backstop; unit-test on the dry-run stand-in.

### U6 - Live Agent SDK adapter never run
- kind: requirement_gap (spec "Known limitations"), unresolved by design
- Evidence: only the dry-run self-test exists. The owner-approved single live check is still to be done and logged.
- proposedFix: owner-approved single run once a key is provisioned; record observed cost in the release log.

### U7 - Worker not deployed, image not built
- kind: requirement_gap (spec limitation, open decisions 3 and 4), unresolved
- Evidence: `Dockerfile.worker` never built; the render.yaml block is commented ("NEEDS A PAID PLAN"); the website service block is unchanged (checked in the diff).
- proposedFix: owner decisions on plan, billing and GitHub account; then build the image and run a deployed smoke run.

### U8 - Other release-loop roles not started by the runner
- kind: requirement_gap (spec limitation), unresolved
- Evidence: builder, triage, spec reviewer, scope agent, reconciler and recorder remain in the workflow. Ten prompt directories exist (seven quality agents plus validator, fixer, integrator).
- proposedFix: follow-up cut-over feature; not needed for the owner's stated request.

### U9 - Amendment approval stops at the decision
- kind: requirement_gap (spec limitation), unresolved
- Evidence: approving a draft spec or amendment records a decision; freezing the baseline and committing the amendment is manual. Consistent with the rule that only the amendment reviewer edits specs, but "approved ones freeze the next baseline" is not automated.
- proposedFix: owner confirms this is acceptable, or add a reviewer hand-off.

### U10 - Real-time delivery is polling
- kind: requirement_gap (minor), unresolved
- Evidence: Overview polls every 3 s, runs every 1.5 s; the design named the render-bindings event stream. Journey 2 ("without reload") is met by polling.
- proposedFix: optional; move to the shared event stream after the U1 merge.

### U11 - Reuse audit and navigation
- kind: informational, resolved
- Evidence: the build added `agent_runner_runs` and `agent_runner_outputs` with a documented justification, lazily and additively. The screen is a World Shell entry point (`PLATFORM_ISLAND_TABS`, `AdminShell.jsx` unchanged, no nav row) plus a card in Release loop run detail, so there is no owner-direction conflict. `smoke.json` was created for the build's own feature (no frozen baseline existed), not an edit of a frozen file.

## Other checks
- No spend cap anywhere; no real Anthropic call in tests (the adapter self-test uses a stand-in).
- Interface parity: 13 MCP tools, 12 parity rows, two stated exclusions (secrets, worker protocol).
- Cleanup: server stopped via PID file, database `sb_rl_rec_6400_2` dropped.
