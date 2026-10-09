# Training spec: Release loop tooling

Audience: a test agent with a shell and Chromium. Fictional data only. Paths are relative to the repository root. `$FX` = `/var/tmp/rt-fx-validate` (use your own directory; delete it at the end). This feature is developer tooling: there is no platform screen, so the browser journey uses the local preview page.

## Where things are

- Process definition: `server/data/releaseLoop/definition.json`; workflow `.claude/workflows/release-loop.js`.
- Tracker sync: `scripts/release-tracker-sync.mjs`; page and harness in `tools/release-tracker/` (`index.html`, `preview.html`, `serve.mjs`, `make-fixture.mjs`, `verify-snapshot.mjs`).
- Nothing here is configurable from the platform UI; the settings live in the definition file, edited in the repository.

## Preconditions

1. [P.1] `node tools/release-tracker/make-fixture.mjs $FX` prints `fixture written to <dir> (19 agents)`.
2. [P.2] `node scripts/release-tracker-sync.mjs --run $FX/runA --run $FX/runB --steps-root $FX/steps --out $FX/snap.json` exits 0 and prints nothing.
3. [P.3] Pick a free port P. Start `node tools/release-tracker/serve.mjs $FX/snap.json P $FX/serve.pid` in the background (it prints `tracker preview on http://127.0.0.1:P/preview.html`). Stop it at the end with `kill $(cat $FX/serve.pid)`.

## Journey 1 - Definition file

1. [J1.1] Run `node -e "const d=JSON.parse(require('fs').readFileSync('server/data/releaseLoop/definition.json','utf8'));console.log(d.roles.length,d.stages.length,d.bugEscalation.maxFixAttemptsPerBug,Object.keys(d.sessionMapping.destinations).join(','),Object.keys(d.gates).join(','))"`.
   - Expect exactly: `7 9 2 context,prompt,cache,memory initialCheck,validation,noSilentCaps,push,baseline`.
2. [J1.2] Expect `d.bugEscalation.statuses` to be the ten values, in this order: open, fixing, fixed_awaiting_retest, verified, recurred, needs_human, needs_business_definition, backlog_pre_existing, reassigned, process_note.
3. [J1.3] Expect `d.tracker` to mention the tracker artifact and to contain neither `World Shell` nor `/api/release-loop`; `grep -n "World Shell → Release loop\|api/release-loop" docs/release-process.md .claude/skills/salt-basin-release-loop/SKILL.md` prints nothing (that platform view was never built).

## Journey 2 - Workflow script parses

1. [J2.1] Make a wrapped copy: replace the leading `export const meta` with `const meta`, put `async function run(args){` on the line before and `}` after, save under `$FX/wf.js`.
2. [J2.2] `node --check $FX/wf.js` exits 0 with no output.

## Journey 3 - Sync output matches the fixture

1. [J3.1] `node tools/release-tracker/verify-snapshot.mjs $FX/snap.json $FX/expected.json` prints `snapshot matches expected` and exits 0.
2. [J3.2] In `$FX/snap.json` expect: `runId` = `runA + runB` (two runs merged); feature statuses alpha-ledger `passed`, bravo-forms `needs_human`, charlie-export `failed`, delta-board `validate`, echo-audit `stalled`; bug A1 `verified` with attempts 1; bug B1 `needs_human` with attempts 2 (the bug recurred as B2 and B3 and is tracked under B1); bug B9 `needs_business_definition`; delta-board has four bugs with status `seen_in_test`.
3. [J3.3] `totals` equal `expected.json` totals (output 391, cacheRead 20000, input 40, cacheWrite 2000): each assistant message in the transcripts is streamed twice and counted once.
4. [J3.4] The agent `build:charlie-export` has status `failed`; `validate:delta-board:r1` has status `running`; `validate:echo-audit:r1` (started 40 minutes ago in the journal, no transcript, never ended) has status `stalled` and feature echo-audit has status `stalled`; `build:delta-board` has status `done_unreconciled` (it reported one failure).
5. [J3.5] `grep -c ZZ-SENTINEL-DO-NOT-LEAK $FX/snap.json` prints `0` (no transcript text).
6. [J3.6] Run the sync with only `--run $FX/runA`: expect `runId` = `runA` and no `delta-board` feature.

## Journey 3b - Test account script

Uses your own fresh local database `$DB` (create with `createdb -h /tmp -p 5433 -U postgres $DB`) and a production-mode server on your own port Q (`NODE_ENV=production`, `DATABASE_URL=postgres://postgres@127.0.0.1:5433/$DB`, `PORT=Q`, plus `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` from `/var/tmp/sbpg/env.sh`), booted once so tables exist. Run `npm run build` first. Drop `$DB` and stop the server at the end.

1. [J3b.1] `node scripts/create-test-member.mjs --out $FX/creds.json` exits 0. `$FX/creds.json` contains `member.email` = `member@test.local`, `member.password` = `TestPass!2345`, `member.slug` = `member`, `member.careerTerms` true, `member.platformTerms` true, and `admin.careerTerms` and `admin.platformTerms` true.
2. [J3b.2] Run it again: exits 0 with the same values (idempotent, no second account).
3. [J3b.3] In Chromium open `http://localhost:Q/login`, sign in as `member@test.local` / `TestPass!2345`. Expect the URL to become `/world` and the page to show **Your World**, **Journeys** and **Classic Tools**, with no password-change page and no terms page.
4. [J3b.4] `DATABASE_URL=postgres://postgres@db.example.supabase.co:5432/postgres node scripts/create-test-member.mjs` exits 2 and prints `Refusing: DATABASE_URL must point at a local test database (got host "db.example.supabase.co").`
5. [J3b.5] Console on step 3: the only errors allowed are failed loads of external hosts (fonts) blocked by the sandbox proxy; no page errors.

## Journey 4 - Tracker page, desktop light (layered drill-down)

The page is a layered drill-down: an overview of tiles, and every number, feature, round, bug and agent opens one layer deeper. The trail ("crumbs") at the top goes back. There are no filter buttons.

1. [J4.1] Open `http://127.0.0.1:P/preview.html` in Chromium at 1280 x 900, colour scheme light.
   - Expect heading **Release tracker**, the hint text "Click any number, feature, round, bug or agent to go one layer deeper.", and `Updated <N> min ago` (the age grows).
   - Expect nine tiles, each with an "Open" link, in this order: `1 / 5` Features passed, `1` Agents running, `2` Open bugs (this work), `0` Backlog: not this work, `1` Bugs verified fixed, `2` Need a person, `1` Finished with unreconciled failures, a Status updates tile whose value is the `version` of the last entry of `updates` in `$FX/snap.json` (`—` when `updates` is empty), `391 / 20k` Tokens out / cache read.
   - Expect a purple callout `2 bugs need a person.` that links to the Need a person layer.
   - **Agents working now**: one card, `VALIDATE · ROUND 1`, delta-board, `Click the Save button`, `2 checks · 1 passed · 1 failed`, and a started / last step line.
   - **Features** table, columns Feature, Status, Latest test, Rounds, Its own bugs verified: alpha-ledger Passed, Round 2: 10/10 steps, 2, 1 of 1; bravo-forms Needs a person, Round 3: 9/12 steps, 3, 0 of 2; charlie-export Agent stopped, Not tested yet, 0, None of its own; delta-board Validate, Not tested yet, 1, None of its own; echo-audit Stalled (no sign of life), Not tested yet, 1, None of its own.
2. [J4.2] Click each tile in turn (use the crumb **Overview** to return) and expect:
   - Open bugs (this work): heading `Open bugs (this work): 2`, crumbs `Overview › Open bugs (this work)`, table rows B1 (Needs a person, 2 / 2) then B9 (Needs a business decision, 0 / 2).
   - Need a person: the same two rows. Backlog: `0`, text "No bugs here." Bugs verified fixed: one row, A1 (Verified fixed, 1 / 2).
   - Agents running: one row, Validate · round 1, delta-board, Running. Finished with unreconciled failures: one row, Build, delta-board, "Finished, failures not reconciled".
   - Features passed: `1 / 5`, one row, alpha-ledger. Tokens out / cache read: 19 rows, most output tokens first, including `Validate · round 1` echo-audit with status `Stalled (no sign of life)`.
3. [J4.3] From the Open bugs layer click the **B1** row (on the row text, not only the id): expect the bug layer, crumbs `Overview › Open bugs (this work) › B1`, "fix attempts 2 of 2", and a History of R1 Found, R1 Fix applied, R2 Came back, R2 Fix applied, R3 Came back. Open B9's layer and expect `Question for you: Should totals round half up or half even?`. Click the crumb `Open bugs (this work)` and expect to be back on that layer.
4. [J4.4] Click the **bravo-forms** feature row from the overview: expect rounds chips Round 1, 2, 3, its own bugs B1 and B9, and its agent runs. Click Round 3: expect its validate, triage stages and bug B1.
5. [J4.5] The Board/World switch and the trends panel belong to the live-release-tracker spec and are not tested here. Expect no console errors, no page errors, no failed requests, and `document.documentElement.scrollWidth` equals `clientWidth`.

## Journey 5 - Tracker page, other sizes and themes

For each of: 1280 dark (`colorScheme: dark`), 390 x 844 light, 390 x 844 dark, and also `preview.html?theme=dark` with a light scheme:
1. [J5.1] Same content as Journey 4 steps 1 to 4 appears.
2. [J5.2] Page background: light `rgb(248, 244, 236)`, dark `rgb(22, 26, 28)`.
3. [J5.3] `scrollWidth` equals `clientWidth`. On the overview the echo-audit status pill reads `Stalled (no sign of life)`, never the raw word `stalled`, and is styled like the `Agent stopped` pill (failure style), not unstyled. At 390 px no table needs sideways scroll: on the overview, each Features row is a stacked card whose cells carry their column name as a small label (Status, Latest test, Rounds, Its own bugs verified), and no `.panel` has `scrollWidth` greater than `clientWidth`, on the overview, a feature layer, a round layer and the Tokens layer. Clicking a card's feature name, or any other text in the card, opens the feature layer.
4. [J5.4] No console errors, page errors or failed requests.
5. [J5.5] `node tools/release-tracker/sync-setup-guide.mjs` exits 0 and prints `SETUP-FOR-CLAUDE.md embedded page matches index.html`.

## Edge cases

1. [E.1] `serve.mjs` with a missing snapshot path exits 2 and prints `snapshot not found: <path>`.
2. [E.2] `preview.html?snapshot=missing.json` shows the text `Preview failed: snapshot 404` and no tracker.
3. [E.3] A run directory with no `journal.jsonl` gives a snapshot with zero agents, not a crash.
4. [E.4] Stale agent detection: `node scripts/release-tracker-sync.mjs --run $FX/runA --run $FX/runB --steps-root $FX/steps --stale-minutes 60 --out $FX/snap60.json` then expect `validate:echo-audit:r1` to be `running` (40 minutes is under the 60 minute threshold), and echo-audit's status `validate`.
