# Training spec: Release loop tooling

Audience: a test agent with a shell and Chromium. Fictional data only. Paths are relative to the repository root. `$FX` = `/var/tmp/rt-fx-validate` (use your own directory; delete it at the end). This feature is developer tooling: there is no platform screen, so the browser journey uses the local preview page.

## Where things are

- Process definition: `server/data/releaseLoop/definition.json`; workflow `.claude/workflows/release-loop.js`.
- Tracker sync: `scripts/release-tracker-sync.mjs`; page and harness in `tools/release-tracker/` (`index.html`, `preview.html`, `serve.mjs`, `make-fixture.mjs`, `verify-snapshot.mjs`).
- Nothing here is configurable from the platform UI; the settings live in the definition file, edited in the repository.

## Preconditions

1. `node tools/release-tracker/make-fixture.mjs $FX` prints `fixture written to <dir> (18 agents)`.
2. `node scripts/release-tracker-sync.mjs --run $FX/runA --run $FX/runB --steps-root $FX/steps --out $FX/snap.json` exits 0 and prints nothing.
3. Pick a free port P. Start `node tools/release-tracker/serve.mjs $FX/snap.json P $FX/serve.pid` in the background (it prints `tracker preview on http://127.0.0.1:P/preview.html`). Stop it at the end with `kill $(cat $FX/serve.pid)`.

## Journey 1 - Definition file

1. Run `node -e "const d=JSON.parse(require('fs').readFileSync('server/data/releaseLoop/definition.json','utf8'));console.log(d.roles.length,d.stages.length,d.bugEscalation.maxFixAttemptsPerBug,Object.keys(d.sessionMapping.destinations).join(','),Object.keys(d.gates).join(','))"`.
   - Expect exactly: `6 8 2 context,prompt,cache,memory initialCheck,validation,noSilentCaps,push`.
2. Expect `d.bugEscalation.statuses` to be the seven values open, fixing, fixed_awaiting_retest, verified, recurred, needs_human, needs_business_definition.

## Journey 2 - Workflow script parses

1. Make a wrapped copy: replace the leading `export const meta` with `const meta`, put `async function run(args){` on the line before and `}` after, save under `$FX/wf.js`.
2. `node --check $FX/wf.js` exits 0 with no output.

## Journey 3 - Sync output matches the fixture

1. `node tools/release-tracker/verify-snapshot.mjs $FX/snap.json $FX/expected.json` prints `snapshot matches expected` and exits 0.
2. In `$FX/snap.json` expect: `runId` = `runA + runB` (two runs merged); feature statuses alpha-ledger `passed`, bravo-forms `needs_human`, charlie-export `failed`, delta-board `validate`; bug A1 `verified` with attempts 1; bug B1 `needs_human` with attempts 2 (the bug recurred as B2 and B3 and is tracked under B1); bug B9 `needs_business_definition`; delta-board has four bugs with status `seen_in_test`.
3. `totals` equal `expected.json` totals (output 391, cacheRead 20000, input 40, cacheWrite 2000): each assistant message in the transcripts is streamed twice and counted once.
4. The agent `build:charlie-export` has status `failed`; `validate:delta-board:r1` has status `running`; `build:delta-board` has status `done_unreconciled` (it reported one failure).
5. `grep -c ZZ-SENTINEL-DO-NOT-LEAK $FX/snap.json` prints `0` (no transcript text).
6. Run the sync with only `--run $FX/runA`: expect `runId` = `runA` and no `delta-board` feature.

## Journey 3b - Test account script

Uses your own fresh local database `$DB` (create with `createdb -h /tmp -p 5433 -U postgres $DB`) and a production-mode server on your own port Q (`NODE_ENV=production`, `DATABASE_URL=postgres://postgres@127.0.0.1:5433/$DB`, `PORT=Q`, plus `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` from `/var/tmp/sbpg/env.sh`), booted once so tables exist. Run `npm run build` first. Drop `$DB` and stop the server at the end.

1. `node scripts/create-test-member.mjs --out $FX/creds.json` exits 0. `$FX/creds.json` contains `member.email` = `member@test.local`, `member.password` = `TestPass!2345`, `member.slug` = `member`, `member.careerTerms` true, `member.platformTerms` true, and `admin.careerTerms` and `admin.platformTerms` true.
2. Run it again: exits 0 with the same values (idempotent, no second account).
3. In Chromium open `http://localhost:Q/login`, sign in as `member@test.local` / `TestPass!2345`. Expect the URL to become `/world` and the page to show **Your World**, **Journeys** and **Classic Tools**, with no password-change page and no terms page.
4. `DATABASE_URL=postgres://postgres@db.example.supabase.co:5432/postgres node scripts/create-test-member.mjs` exits 2 and prints `Refusing: DATABASE_URL must point at a local test database (got host "db.example.supabase.co").`
5. Console on step 3: the only errors allowed are failed loads of external hosts (fonts) blocked by the sandbox proxy; no page errors.

## Journey 4 - Tracker page, desktop light

1. Open `http://127.0.0.1:P/preview.html` in Chromium at 1280 x 900, colour scheme light.
   - Expect heading **Release tracker**, header text `Updated <N> min ago · run runA + runB` (the age is relative to when the fixture was written, so it grows; the part after the dot is fixed).
   - Expect seven tiles: `1 / 4` Features passed, `1` Agents running, `6` Open bugs, `1` Bugs verified fixed, `2` Need a person, `1` Finished with unreconciled failures, `391 / 20k` Tokens out / cache read.
   - Expect a purple callout starting `2 bugs need a person.`
   - Expect filter buttons: All features, alpha-ledger, bravo-forms, charlie-export, delta-board.
   - **Agents working now**: one card, `VALIDATE · ROUND 1`, delta-board, `Click the Save button`, `2 checks logged · 1 passed · 1 failed · 3 page errors / failed requests seen`.
   - **Features** rows: alpha-ledger Passed, Round 2: 10/10 steps, 2 rounds, 0 open bugs; bravo-forms Needs a person, Round 3: 9/12 steps, 3, 2; charlie-export Failed, Not tested yet, 0, 0; delta-board Validate, Not tested yet, 1, 4.
   - **Bugs** table order: B1 (Needs a person, 2 / 2), B9 (Needs a business decision, 0 / 2, with "Question for you: Should totals round half up or half even?" after opening its row), four delta-board rows (Seen in test, awaiting triage), A1 (Verified fixed, 1 / 2).
   - **All agent runs** has 18 rows.
2. Click the **bravo-forms** filter: all sections show only bravo-forms rows (Bugs: B1 and B9; Agent cards: "No agent is running for this selection."). Click **All features** to restore.
3. Click the B1 row's text: expect its history lists R1 Found, R1 Fix applied, R2 Came back, R2 Fix applied, R3 Came back.
4. Expect no console errors, no page errors, no failed requests, and `document.documentElement.scrollWidth` equals `clientWidth`.

## Journey 5 - Tracker page, other sizes and themes

For each of: 1280 dark (`colorScheme: dark`), 390 x 844 light, 390 x 844 dark, and also `preview.html?theme=dark` with a light scheme:
1. Same content as Journey 4 appears.
2. Page background: light `rgb(243, 246, 247)`, dark `rgb(15, 26, 31)`.
3. `scrollWidth` equals `clientWidth` (390 px: tables scroll inside their panel; the page does not).
4. No console errors, page errors or failed requests.

## Edge cases

1. `serve.mjs` with a missing snapshot path exits 2 and prints `snapshot not found: <path>`.
2. `preview.html?snapshot=missing.json` shows the text `Preview failed: snapshot 404` and no tracker.
3. A run directory with no `journal.jsonl` gives a snapshot with zero agents, not a crash.
