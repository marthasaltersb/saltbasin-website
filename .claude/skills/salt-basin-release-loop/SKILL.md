---
name: salt-basin-release-loop
description: Required release process for every Salt Basin session that changes code — build features in parallel agents, initial check, integrate, hand each feature to browser validation agents that follow its training spec literally, route failures to triage, fix agents, and back to validation until everything passes, with dated change specs, training specs, test results, triage and a release log. Use whenever a session has made or is about to make code changes, before pushing, or when Betsy asks to "run the release loop", "validate", "triage", or "push when tests pass".
---

# Salt Basin release loop

The process is data: `server/data/releaseLoop/definition.json` (roles, stages, gates, spec standards, log
locations). In-app agents read the same definition file (there is no API or World Shell view for it), so
Claude Code sessions and in-app agents follow one process. Change the process by editing that
file (version bump + note in `docs/release-process.md`), never by improvising per session.

## Every session that changes code

1. **Specs while building.** For each feature write `docs/changes/<feature>.md` (design/change spec with a
   *Traces to* section naming the prior spec versions and commits it builds on) and
   `docs/training/<feature>.md` (journeys a separate agent can follow literally in a browser). No
   API-only configuration: if it's configurable, a UI screen changes it.
2. **Initial check** per feature: `npm run build`, server boots on a fresh database, the builder walks its
   own journeys once. If `tools/release-tracker/` changed, `node tools/release-tracker/sync-setup-guide.mjs`
   must exit 0 (run with `--write` to regenerate the embedded page copy).
3. **Run the loop** with the saved workflow:
   `Workflow({ name: 'release-loop', args: { release, repo, integrationBranch, env, chromium, commitTrailer, features: [...], sweep: true } })`.
   Each feature: build (own worktree) → integrate (serial) → validate (browser, literal spec) → triage →
   fix → integrate → validate … until pass, a business-definition escalation, or `maxFixRounds` (recorded
   as NOT passed — never as done). Validate-only features (`build: null`) re-test existing specs.
   Concurrency is limited by CPUs; that's fine — the loop keeps going.
4. **Sweep** (`sweep: true`): every training spec end to end plus a crawl of every World Shell island,
   member/admin tab, `/r/<token>` and `/output/*`, through the same triage → fix loop.
5. **Release log** `docs/release-log/<release>.md` plus `docs/test-results/<feature>/round-N.md` and
   `docs/triage/<feature>-round-N.md` are committed on the integration branch.
6. **Push** only when the release log shows every feature passed, or the owner explicitly says otherwise.
   Items classed `needs_business_definition` go to the owner as exact questions; they are never guessed.

## Resuming in a new session (no re-instruction needed)

If `docs/release-log/active-release.state.json` shows unfinished features, a new session continues them:

1. Work on the WIP branch named in `docs/release-log/active-release.features.json` (`wipBranch`): fetch it,
   check it out, and use it as the integration branch for this session. Set up the local environment
   (Postgres 16 on port 5433 with socket in /tmp, `/var/tmp/sbpg/env.sh` with test admin credentials) if it
   is missing, and record how in `docs/release-process.md`.
2. `node scripts/release-loop-resume.mjs --args --scripts <scratch dir>` writes one self-contained workflow
   script per run (args built in). Set `integrationBranch` and `commitTrailer` (this session's attribution
   lines) first, then launch each with `Workflow({ scriptPath })`, all in parallel; nothing should sit idle.
   A resumed run (`resumeFromRunId`) does not keep its args, so relaunch from these scripts instead.
   Before launching, check Postgres is up (a container restart stops it) and salvage any unmerged agent
   work: commit dirty `.claude/worktrees/wf_*` trees to their branches and name the branch in the
   feature's `fixNotes` (or `salvage` for a build).
3. Keep the tracker live: write the new runs' transcript dirs to a run_dir file, run
   `scripts/release-tracker-sync.mjs --run <dir>... --ledger /var/tmp/sbpg/tracker/bug-ledger.json`, and
   publish the snapshot to the tracker artifact (`trackerArtifact`, collection `tracker`, doc `current`,
   field `json`). Bugs never leave the tracker; they end as verified fixed.
4. After each merge, `--export` the snapshot to the state file, commit, and push the WIP branch so the next
   session can resume again. Push the owner's integration branch only when every feature has passed.

## Status updates to the owner

Every status update given to the owner is also recorded as a numbered release update:
`node scripts/release-update.mjs --snapshot /var/tmp/sbpg/tracker/snapshot.json --headline "..." --note "..."`
(sync first). It is versioned `<release version>-u<n>` (release version = `version` in
`docs/release-log/active-release.features.json`, the version the release ships as), pinned to the commit,
and compared automatically with the previous update; `docs/release-log/updates.md` is the copy to send to
others, and the tracker shows the latest update and the full history. Write the note for a reader outside
the project. Number the next release by bumping `version` when this one ships.
The tracker overview charts the release's history (`scripts/release-history.mjs` rebuilds
`docs/release-log/history.json` from every committed state file; publish it to the tracker doc
`tracker/history`). History is never overwritten — the slider replays any earlier moment.

## Owner directions that always apply

- Everything a member does is reachable from the World Shell (`/world`); admin navigation is not a route.
- Career Master is the source of truth for outputs; per-output overrides are allowed and marked.
- No API-only configuration; every rule and rollup is editable in a screen.
- Interface parity: every capability works by point-and-click on desktop, as a phone walkthrough at 390px, via the API and via an MCP tool (`definition.json` `interfaceParity`). A training guide that can't be walked that way fails.
- Fixed test constraints (`definition.json` `specGovernance`): training specs are frozen baselines with stable step ids (`node scripts/release-spec-baseline.mjs freeze | check | diff | score | show`). Only the code varies between rounds. No agent edits a spec mid-release; step changes are amendments in `docs/spec-amendments/<feature>/` decided by the amendment reviewer, never the proposer. Before relaunching, run `check --all`; a new feature's spec is frozen as v1 by the integrator when it first merges. Proposed amendments on disk are reviewed before the feature's next round (`release-loop-resume.mjs` passes them as `pendingAmendments`).
- Failures are never silent, never "done" while unreconciled, and a blank or clipped screen is a failure.
- Test as `member@test.local` from `scripts/create-test-member.mjs` (career terms accepted).
- Repo is public: fictional data only; never an employer or application-target name.
- Fix urgent breakage at once; bugs failing 2 fix attempts go to the owner as "needs a person".

## After every session — session mapping

Run `node scripts/analyze-session.mjs` (see `docs/changes/session-mapping.md`) before the session ends. It
records the session's token usage (input / cache write / cache read / output), estimated spend, time and
limit events, and proposes where each learned or repeated item belongs — **context** (CLAUDE.md, skill
references), **prompt** (skills, workflows, agent role prompts), **cache** (stable reusable prefixes),
**memory** (the agent memory register). Apply the accepted mappings, then the trends screen shows whether
sessions are getting cheaper and faster before hitting limits. Only metrics and mapping summaries are
committed — never transcript text.

## Environment (cloud sessions)

Local Postgres 16 (`/var/tmp/sbpg/data`, socket `/tmp`, port 5433), env file with test admin credentials,
Playwright + the preinstalled Chromium. Test accounts come only from `scripts/create-test-member.mjs`
(member + admin with platform and career terms accepted, no forced password change). Every agent gets its own database and ports; it kills what it
started (PID files, never `pkill -f`) and drops its database. If the environment is missing, the first
agent sets it up and records how in `docs/release-process.md`.

## Non-negotiables

- Real browser validation following the training spec; a script check never substitutes.
- A blank, clipped or contextless screen is a failure even without an error (see salt-basin-regression-gate).
- Never skip, weaken or delete a journey step to get green; a spec error is fixed in the spec with a reason.
- Nothing fails silently — failed, refused and partially applied commands are logged with the state they left.
- Public repo: fictional data only in specs and logs; no employer/application-target names; nothing under
  `server/data/applicationPackages/` but its README.
