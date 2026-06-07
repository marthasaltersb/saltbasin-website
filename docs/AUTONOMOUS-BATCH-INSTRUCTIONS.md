# Autonomous Batch Instructions

Betsy is away. You (Claude) have been invoked via `/loop` to work backlog items
without her input. Read this entire file before doing anything else, then act.

## Safety rails — non-negotiable

1. **NEVER push to `main`.** Work on the branch `feat/autonomous-batch-YYYY-MM-DD`
   (use today's UTC date). Create it from `main` on first run; reuse it on
   subsequent runs same-day. Tomorrow, create a new branch.
2. **NEVER touch auth, sessions, password handling, captcha, or member private
   data.** If a task drifts into those areas, stop and pick a different one.
3. **NEVER run any of the bulk-load scripts.** They require credentials in
   `.env` that you don't have access to in autonomous mode; only Betsy runs them.
4. **NEVER ask questions.** She's not here. Either pick a sensible default
   and proceed, or skip the task and try a different one.
5. **`npm run build` MUST pass before every commit.** If it fails twice in a
   row on the same task, abandon that task and pick another. Commit the
   failure with a clear note so she can see what got stuck.
6. **Small commits — one logical change per commit.** No mega-commits.
7. **No more than 6 iterations per autonomous session window.** Stop and wait
   for her to come back even if there's more on the list.

## Which tasks are fair game

Look at `TaskList()` and pick the first available task from this allowlist:

- **#14 Refactor Config-tab static fields to dynamic lists** — mirror the
  resume-roles pattern from commit `1e5c8f1`. Pure-additive UI work in
  `ConfigPanel.jsx` + maybe extending `EditorPane.jsx`'s array-aware field
  detection. No backend changes.
- **#20 Dynamic Domains + Service Cards sections** — same pattern as resume
  roles, applied to `defaultMemberSite.js` (home.domains + home.services
  sections) + the matching block renderers in `src/components/blocks/index.jsx`
  (DomainsBlock + CardsBlock or wherever) + EditorPane dynamic editors.
  Mirrors the work in `1e5c8f1` exactly — read that commit and adapt.
- **#31 Chart UI for build progress snapshots** — pure-render addition to
  `BuildSummaryOutput` in `src/components/Output.jsx`. Data is at
  `GET /api/backlog/snapshots`. If recharts isn't installed, install it
  (`npm install recharts`). Line charts of `requirementsDelivered` and
  `hoursClaude + hoursBetsy` and `aiSavingsUsd` over time. Time-range
  selector (7d / 30d / 90d / all). Milestone markers from
  `capture_source === 'milestone'`.

**Do NOT pick** any of these even if they're in the task list:
- #9 brain-dump reconciler (UX-heavy, needs her taste)
- #15 auto patch notes (touches release process)
- #21 content agent (major scoping)
- #22 profile → outputs (schema decisions)
- #23 e2e signup verification (needs her to actually walk it)
- #28 reCAPTCHA (auth-adjacent — already shipped, don't touch)
- #29 test mode side panel (UX-heavy, needs her taste)
- Anything involving `betsystaff` (FEAT.2026-06-07.2 — needs her judgment)

## Process for each task

1. `TaskList()` → pick first allowed task, `TaskUpdate(id, status='in_progress')`.
2. Ensure you're on `feat/autonomous-batch-YYYY-MM-DD`. Create if missing.
3. Read whatever code the task touches. Mirror existing patterns.
4. Make the change. `npm run build` must pass.
5. `git commit` with a clear message describing what + why.
6. `git push origin feat/autonomous-batch-YYYY-MM-DD`.
7. `TaskUpdate(id, status='completed')`.
8. Loop back to step 1. Stop after 6 iterations OR when no allowed task remains.

## When she comes back

She'll find a branch she can compare against `main`:

    git diff main..feat/autonomous-batch-YYYY-MM-DD

She'll merge what she likes, throw away what she doesn't. Render hasn't
deployed any of it because we never touched `main`.

## Stopping conditions

- All allowed tasks completed → stop, leave a summary comment in the latest
  commit.
- `npm run build` fails twice in a row on the same task → abandon that task,
  pick another. If you have nothing left to pick, stop.
- You find yourself wanting to ask a question → stop. Don't guess on
  judgment calls; she'll be back.
- 6 iterations done → stop. Don't drift.

## Key context loaded from memory

- `[[feedback-brain-dump-reconciler]]` — propose/approve pattern, never blind
  create
- `[[feedback-audit-everything]]` — every mutation through `writeAudit()`
- `[[project-saltbasin-profile-vision]]` — "My Profile" not "Content"; never
  use fixed-N slots; profile is the data record, outputs are generated views
- `[[project-saltbasin-website]]` — stack overview, table layout
