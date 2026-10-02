# Change spec: Release loop tooling

Version 1 · 2026-10-02 · feature key `release-loop-tooling`

## Traces to

- Commit `2086080` Release loop: process definition, saved workflow, skill and session rule (introduces `server/data/releaseLoop/definition.json` v1, `.claude/workflows/release-loop.js`, `.claude/skills/salt-basin-release-loop/SKILL.md`, `docs/release-process.md`, the CLAUDE.md "Release loop" section).
- Commit `dd3f321` Release loop: after-session context/prompt/cache/memory mapping (adds `sessionMapping` to the definition).
- Commit `ac66592` Release loop: per-bug fix-attempt limit hands stuck bugs to a person; tracker sync (adds `bugEscalation.maxFixAttemptsPerBug = 2` and `scripts/release-tracker-sync.mjs`).
- Commit `03b359e` Release tracker sync: follow several workflow runs at once (repeatable `--run`).
- Commit `f400e0f` Release loop: reconcile every reported failure before work counts as finished (adds `failureReconciliation` and `liveLogging` to the definition; workflow reconcile/carry steps; tracker status `done_unreconciled`).
- Commit `4d8cff3` Test agents use ready member/admin accounts with career terms accepted (adds `scripts/create-test-member.mjs`). Depends on `b586d4f`, which made the password-change and terms gates guard `/api/` only so the app shell loads.
- Commit `4d6a48e` Release loop: safe parallel runs (per-run database and scratch names, merge lock in the workflow).
- Commit `eb6ceba` Release loop: a relaunched feature can continue from a later round with its fix notes (workflow `startRound`/carry).
- Earlier specs: none for this feature. Related format precedent: `docs/changes/proficiency-rules-and-live-qr.md`, `docs/training/proficiency-rules-and-live-qr.md`.

## What changed

Those four commits had no change or training spec. This pass adds both, plus a committed copy of the tracker page and a local harness, covers the later commits above (reconciliation, test accounts, parallel runs, continuation), and fixes two defects found while testing the sync script.

### Data model

None. No tables or columns. The process definition is a JSON file.

### Server

None. Tooling only (no routes, no auth, no finalize/approve/publish path touched).

### Client / tooling

- `tools/release-tracker/index.html`: copy of the tracker page (fragment written for the claude.ai artifact host; reads `tracker/current` through `claude.use('db')`).
- `tools/release-tracker/preview.html` + `serve.mjs`: local harness. It stubs `window.claude.use('db')` with a snapshot file and drops the Google Fonts link so the page makes no external request. `?theme=dark|light` forces a theme.
- `tools/release-tracker/make-fixture.mjs`: writes SYNTHETIC runs (fictional features) and `expected.json`. `verify-snapshot.mjs` compares a snapshot with it.
- `scripts/create-test-member.mjs` (unchanged here): creates a member plus readies the admin in a local database only.
- `scripts/release-tracker-sync.mjs`: two minimal fixes (below).

## Behaviour changes to know

1. A feature whose latest agent ended with no result (died) now shows status `failed` instead of `between_stages`.
2. New `--steps-root <dir>` option (default `/var/tmp/sbpg/release-loop`, the old hardcoded path) for where live validator `steps.jsonl` logs are read. Without it a fixture could not exercise the live-failure path.
3. Known behaviour, unchanged: the snapshot contains agent labels, result summaries, a tool-description label (at most 140 characters) of each agent's latest tool call, and lines that start with `PAGEERROR`/`REQFAIL`. It never contains message text, thinking or prompts.

## Verified (initial check)

- `npm run build` passes; server boots on a fresh database.
- Every journey of `docs/training/release-loop-tooling.md` walked once in Chromium and the shell on a fresh database `sb_rl_bld_4600_3`: definition valid, workflow parses, test member created (member lands on `/world`, non-local database refused), sync matches the fixture, two runs merge, no transcript text, tracker renders at 1280 and 390 px in light and dark with no horizontal page scroll and no console errors.

## Known limitations

- An agent with a `started` journal entry and no end entry stays `running` forever; the idle check applies only to `--extra` agents.
- The page shown inside the claude.ai host (live database) is not exercised here; only the harness is.
- Tables on a 390 px screen scroll inside their panel rather than reflowing.
- The tracker is a Claude Code session tool; the in-platform World Shell "Release loop" view named in the definition is not part of this change.

## Fix notes per round

(none yet)
