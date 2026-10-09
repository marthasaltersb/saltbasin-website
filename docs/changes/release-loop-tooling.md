# Change spec: Release loop tooling

Version 1 · 2026-10-02 · feature key `release-loop-tooling`

## Traces to

- Commit `2086080` Release loop: process definition, saved workflow, skill and session rule (introduces `server/data/releaseLoop/definition.json` v1, `.claude/workflows/release-loop.js`, `.claude/skills/salt-basin-release-loop/SKILL.md`, `docs/release-process.md`, the CLAUDE.md "Release loop" section).
- Commit `dd3f321` Release loop: after-session context/prompt/cache/memory mapping (adds `sessionMapping` to the definition).
- Commit `ac66592` Release loop: per-bug fix-attempt limit hands stuck bugs to a person; tracker sync (adds `bugEscalation.maxFixAttemptsPerBug = 2` and `scripts/release-tracker-sync.mjs`).
- Commit `03b359e` Release tracker sync: follow several workflow runs at once (repeatable `--run`).
- Commit `f400e0f` Release loop: reconcile every reported failure before work counts as finished (adds `failureReconciliation` and `liveLogging` to the definition; workflow reconcile/carry steps; tracker status `done_unreconciled`).
- Commit `4d8cff3` Test agents use ready member/admin accounts with career terms accepted (adds `scripts/create-test-member.mjs`). Depends on `b586d4f`, which made the password-change and terms gates guard `/api/` only so the app shell loads.
- Commit `c0b9d58` / `a42b3cc` Release loop v2: scope check after triage; out-of-scope bugs shown as non-blocking backlog (adds `backlog_pre_existing`, `reassigned`, `process_note` to `bugEscalation.statuses`).
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

- A journal agent with a `started` entry and no end entry shows `stalled` once its last sign of life is older than `--stale-minutes` (default 15); `--extra` transcript agents show `idle_or_done` instead.
- The page shown inside the claude.ai host (live database) is not exercised here; only the harness is.
- Tables reflow as stacked cards (column names as labels) below 640 px; the panel's own sideways scroll is only a fallback.
- The tracker is a Claude Code session tool; the in-platform World Shell "Release loop" view named in the definition is not part of this change.

## Fix notes per round

Round 1 and the later rounds are recorded in the per-round sections below.


## Fix notes — round 1

- **RLT-T1 (spec_error).** Training spec J1 step 2 now lists the ten statuses in the definition's order; Traces to gained the scope-check commits. Files: `docs/training/release-loop-tooling.md`, this file. Check: ran the J1 node command and compared the printed list.
- **RLT-T2 (spec_error).** J4 and J5 rewritten for the drill-down page (8 tiles, click-through layers, crumbs, no filters; Open bugs layer expects B1 and B9). Counts are from the fixture, now 5 features / 19 agents. Files: `docs/training/release-loop-tooling.md`. Check: drove the page in Chromium (1280 light/dark, 390 light/dark) and read every tile layer. Open question for the spec author: the agent card no longer shows the "page errors / failed requests seen" count (page errors appear on the agent layer instead); I did not re-add it.
- **release-loop-tooling-B1 (defect).** Removed the claim of a World Shell "Release loop" view and `/api/release-loop/*` from `docs/release-process.md`, the skill's SKILL.md and the `tracker` string in `definition.json`; they now describe the tracker artifact and say in-app agents read the definition file. CLAUDE.md needed no edit (no such claim). `grep` finds no code reading `definition.tracker`; JSON still parses. J1 step 3 added.
- **release-loop-tooling-B2 (defect).** `scripts/release-tracker-sync.mjs`: the idle check now covers every running agent (last sign of life = transcript, else the journal entry's `at`/`ts`/`timestamp`); journal agents become `stalled`, `--extra` ones stay `idle_or_done`; threshold via `--stale-minutes` (default 15); a feature whose latest agent stalled is `stalled`. `stalled` added to the page and markdown status labels. Running-status consumers (live-step bugs, retest, fix-in-progress, running list) correctly skip stalled agents. Fixture gained echo-audit with a stale validator; spec J2/J3 and edge case 4 cover it. Check: sync output matches expected; stalled at default, running with `--stale-minutes 60`.
- **release-loop-tooling-B3 (defect).** `tools/release-tracker/index.html`: below 640px `.panel` tables become stacked cards with `data-label` captions (header visually hidden, `box-sizing: border-box`, panel overflow-x kept as fallback). Check: at 390 px no panel overflows on overview, feature, round, Tokens and bug layers; link and whole-row clicks still navigate; no console errors. J5 step 3 reworded.


## Fix notes — round 3

- **T3-1 (spec_error).** The page has nine tiles (Status updates was added after the spec was written). Training spec J4 step 1 now lists nine tiles with Status updates between Finished with unreconciled failures and Tokens, and says the Board/World switch and trends panel are covered by the live-release-tracker spec. Files: `docs/training/release-loop-tooling.md`. Check: counted `.strip .stat` = 9 in Chromium at 1280 and 390.
- **release-loop-tooling-F1-2, status labels (defect).** Added `stalled: 'Stalled (no sign of life)'` to `STATUS` and `.s-stalled` to the red pill rule in `tools/release-tracker/index.html`. Kept "Agent stopped" for `failed` (deliberate, 98e05dd); spec J4 now says `charlie-export Agent stopped`. Restored `tools/release-tracker/sync-setup-guide.mjs` (from fix-r2) and regenerated the embedded copy in `SETUP-FOR-CLAUDE.md` with `--write`. Only the needed hunks were ported, not fix-r2 wholesale. Check: echo-audit pill reads "Stalled (no sign of life)" in red (light and dark); `sync-setup-guide.mjs` exits 0.
- **T3-3 (spec_error).** J5 step 2 background is now light `rgb(248, 244, 236)`, dark `rgb(22, 26, 28)` (the Salt Basin palette). Check: computed body background measured in all three contexts.
- **release-loop-tooling-F1-2, 390px cards (defect).** Re-added the `@media (max-width: 640px)` stacked-card CSS (also for `.tableview`, plus `overflow-wrap: anywhere` on cells) and `data-label` on every non-first cell of `featureRows`, `bugRows`, `agentRows`, the updates table, the per-update features table and the trends data table. Regenerated the embedded copy. Prevention: the definition's `initialCheck`, the skill and J5 step 3 now require `sync-setup-guide.mjs` to exit 0 when `tools/release-tracker/` changes. Check: at 390 px (light and dark), no `.panel`/`.tableview` has scrollWidth > clientWidth on overview, feature, round, Tokens, Status updates and Open bugs layers; page scrollWidth equals clientWidth; clicking the bottom of a card opens `#/feature:bravo-forms`; no page errors.
- **release-loop-tooling-F1-6 (spec_error).** Known limitations rewritten (stalled journey agents; tables reflow as cards) and the "Fix notes per round" placeholder replaced. Files: this file.
