---
name: salt-basin-release-loop
description: Required release process for every Salt Basin session that changes code — build features in parallel agents, initial check, integrate, hand each feature to browser validation agents that follow its training spec literally, route failures to triage, fix agents, and back to validation until everything passes, with dated change specs, training specs, test results, triage and a release log. Use whenever a session has made or is about to make code changes, before pushing, or when Betsy asks to "run the release loop", "validate", "triage", or "push when tests pass".
---

# Salt Basin release loop

The process is data: `server/data/releaseLoop/definition.json` (roles, stages, gates, spec standards, log
locations). The same definition is what in-app agents read (`/api/release-loop/*`, World Shell → Release
loop), so Claude Code sessions and platform agents follow one process. Change the process by editing that
file (version bump + note in `docs/release-process.md`), never by improvising per session.

## Every session that changes code

1. **Specs while building.** For each feature write `docs/changes/<feature>.md` (design/change spec with a
   *Traces to* section naming the prior spec versions and commits it builds on) and
   `docs/training/<feature>.md` (journeys a separate agent can follow literally in a browser). No
   API-only configuration: if it's configurable, a UI screen changes it.
2. **Initial check** per feature: `npm run build`, server boots on a fresh database, the builder walks its
   own journeys once.
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
