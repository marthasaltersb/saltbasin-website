# Training spec: Release tracker World as the whole navigation

Version 1 · 2026-10-11 · feature key `tracker-world-navigation` · change spec: `docs/changes/tracker-world-navigation.md`

Audience: a person using the release tracker, and a test agent driving a real browser. Every step says what to do and what you should see. All data is fictional and comes from `docs/training/fixtures/tracker-world-navigation/` (a demo release "0.9.0", internal name `2030-03-01-demo-harbor`, six features). Replace `<BASE>` with the platform address (for example `http://127.0.0.1:6102`) and `<ART>` with the artifact preview address (for example `http://127.0.0.1:6103`).

Two surfaces draw the same World with one shared engine: the **artifact page** (`tools/release-tracker/index.html`, opened locally through the preview harness) and the **platform screen** (World Shell, island **Release tracker**). Journeys 1 to 5, 8 and 9 use the artifact page; Journey 6 uses the platform screen; Journey 7 is the API and MCP. Every browser step is run twice, on desktop (1280x900) and on a phone (390x844 with touch), and has the same expected result on both unless the step names a difference.

Surfaces. Every capability is reachable three ways: (1) the website, by point-and-click (desktop) and as a 390px phone walkthrough; (2) the API route `GET /api/release-tracker/world/object` (and `GET /api/release-tracker/state`) with the same permission check as the screen; (3) the MCP tool `release_tracker_world_object` (and `release_tracker_get_state`) calling the same server function. Journey 7 walks the API and MCP.

## Where things are

- **Artifact page, World**: open `<ART>/preview.html`. The header has a group named **View** with the buttons **Board** and **World**. Click **World**. The trail ("breadcrumb") is the row under the header; it reads **Overview** with nothing else until an object is opened.
- **Platform screen, World**: sign in at `<BASE>/login`, open `<BASE>/world`, click **Journeys**, click the card **Release tracker**. Its header has the group **View** (**Board** / **World**), the group **Screen** (**Tracker** / **Settings**) and the trail row. The trail in the address bar starts with `#/rt`.
- **Inside the World** (both surfaces): the whole stage is the 3D world. Over it: a row of headline chips (desktop only; on a phone they are at the top of the **Objects** panel), the **Legend** (a disclosure; open on desktop, closed on a phone), the buttons **Current** / **Historic** (group named "World state"), **Objects**, **Data map** and (desktop only) **Pause motion**, the time bar (buttons **‹** "Previous update (world)", a slider named "Replay the world at an earlier moment", **›** "Next update (world)", **Live**, and the as-of text), and, once an object is open, the **data view** (a panel with the buttons **‹ Back** and, on a phone, **Collapse** / **Expand**). **Overview** inside the data view goes straight back to the top.
- **Test aids on the stage element** (the element with class `tw-stage`, accessible name starting "Release world."): attribute `data-world` holds JSON with `environment`, `nodes`, `satellites`, `bugs`, `rounds`, `agents`, `rivers`, `districts` (list of `{key,total}`), `focusId`, `cameraMode` (`overview`, `object` or `district`), `selected` (the opened object's token), `related` (every highlighted token), `mode` (`current` or `historic`), `at` (history point number or null), `changed` (features that changed since the chosen point), `paused`, `reducedMotion`. Attribute `data-crystals` holds JSON, a list of `{id, kind, x, y, visible}` giving the position of every feature crystal and satellite in CSS pixels from the stage's top-left corner. Tokens look like `feature:tide-table`, `bug:tide-table-F1-1`, `agent:a1`, `round:tide-table:1`, `scope:added`.
- **Trail tokens** (the address bar after `#/`, one token per layer): `feature:<key>`, `bug:<id>`, `agent:<id>`, `round:<key>:<n>`, `scope:planned|added|backlog`, `stat:<key>`. Board and World read the same trail.
- **Objects**: the **Objects** button opens a list of every object in the world: each district as a heading (a link), under it each feature (a link showing its status and score) and under each feature its bugs, rounds and agents (links). Every object in the world is in this list, so everything is reachable without aiming at the 3D scene.
- **Preview server for the artifact page**: `node tools/release-tracker/serve.mjs docs/training/fixtures/tracker-world-navigation/artifact.json <port>`. It serves `preview.html`. The artifact page loads three.js r128 from `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`; in an offline test browser that one request is answered from the file `experience-proof/vendor/three.min.js` (request interception in the test harness; the page is not changed). The Chart.js request may fail; the World does not use it.
- **Expected failed requests** (not failures): Google Fonts, the Chart.js script, `favicon.ico`, the aborted live-update stream whenever the platform page navigates, and in Journey 7 the 400, 401, 403 and 404 answers the steps name.

## Preconditions

1. [P.1] Boot the platform once against a fresh database and run `npm run seed`, then run `node scripts/create-test-member.mjs` (creates `member@test.local`, password `TestPass!2345`, terms accepted). The administrator is the seeded one (`ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` of the test environment). Nothing else exists.
2. [P.2] Start the artifact preview server in the background with `node tools/release-tracker/serve.mjs docs/training/fixtures/tracker-world-navigation/artifact.json <port>` and confirm `curl -s -o /dev/null -w "%{http_code}" <ART>/preview.html` prints `200`.
3. [P.3] In the browser, sign in once as the administrator at `<BASE>/login` and keep that session; sign-in is limited to 10 attempts per 15 minutes. At `<BASE>/world` click **Journeys**, click the card **Release tracker**, click **Open Settings**.
4. [P.4] In **Paste a snapshot**, put the full text of `docs/training/fixtures/tracker-world-navigation/push.json` into the box named **Snapshot JSON** and click **Store snapshot**. Expect a toast "Snapshot 1 stored", and under **Recent ingests** one row for `paste` with result `stored` and the detail "Release 2030-03-01-demo-harbor: 6 features, 6 bugs (snapshot 1)". Click **Tracker** in the group **Screen**; expect the header line "Live · Updated" followed by a few seconds.

## Journey 1 — The World is the whole view (artifact page)

1. [J1.1] Open `<ART>/preview.html`. Expect the heading **Release tracker**, the **View** group with **Board** pressed, and the Board overview. Click **World** in the **View** group.
   - Expect the Board to be replaced by one full-width 3D stage: the stage's width is within 60 pixels of the browser window's width, and no panel sits beside it (no element with class `world-panel` exists). The trail still reads **Overview**.
2. [J1.2] Read the stage's `data-world`.
   - Expect `environment` "underwater", `nodes` 6, `bugs` 6, `rounds` 6, `agents` 10, `satellites` 22, `rivers` 2, `districts` exactly `[{"key":"planned","total":3},{"key":"added","total":2},{"key":"backlog","total":1}]`, `mode` "current", `selected` null, `cameraMode` "overview", `reducedMotion` false.
3. [J1.3] Read the labels drawn over the world (elements with class `tw-wl` that are displayed).
   - On desktop expect exactly these ten, as lines of text joined by " | ": "Release 0.9.0 | live · 1 of 4 passed (this release)"; "THIS RELEASE 1/3 passed"; "ADDED AFTER THE CUT 0/2 passed"; "BACKLOG 0/1 passed"; "harbor-chart | Passed · 14/14 steps · 100%"; "tide-table | Fixed, awaiting retest · 12/16 steps · 75%"; "buoy-sync | Queued · not tested yet"; "pier-booking | Failing · 6/9 steps · 67%"; "lighthouse-log | Queued · not tested yet"; "net-mender | Failing · 18/20 steps · 90%".
   - On a phone expect exactly the first four (the release label and the three district labels); the six feature labels collapse into the **Objects** list (checked in [J1.6]).
4. [J1.4] Look at the **Legend**.
   - On desktop it is open; on a phone it is closed and shows only the word **Legend**, and clicking it opens it. Open, it reads: heading "RINGS (WHERE A FEATURE SITS)" with "This release 3 features · 1 passed", "Added after the cut 2 features · 0 passed", "Backlog 1 feature · 0 passed"; heading "CRYSTAL = A FEATURE" with the six states "In progress", "Passed", "Failing", "Awaiting re-test", "Needs a person", "Queued, not started or agent stopped" and the line "Size = steps in its test suite · gold arc = share of steps passing · bubbles = an agent working on it now"; heading "SATELLITES" with "Bug (colour = its state)", "Test round (green = all steps passed)", "Agent", and the four bug states "Open (this work)", "Verified fixed", "Backlog (not this work)", "Waiting on a person".
5. [J1.5] Read the headline chips (on desktop over the world; on a phone they are listed at the top of the panel opened in [J1.6]).
   - Expect five chips in order: "3 Open bugs (this work)", "1 Bugs verified fixed", "2 Backlog: not this work", "1 Need a person", "2 Agents running".
6. [J1.6] Click **Objects**.
   - Expect a panel headed **OBJECTS** with a **Close** button, and the button **Objects** reporting expanded. On a phone the five chips of [J1.5] are the first thing in the panel. Then expect, in order, the district **THIS RELEASE 3** with: harbor-chart (Passed, 14/14 steps) containing BUG harbor-chart-F1-1, ROUND "R1 10/14", ROUND "R2 14/14", AGENT "Validate r2", "Fix r1", "Validate r1", "Build"; tide-table (Fixed, awaiting retest, 12/16 steps) containing BUG tide-table-F1-1, BUG tide-table-F1-2, ROUND "R1 12/16", ROUND "R2", AGENT "Validate r2", "Fix r1", "Triage r1", "Validate r1"; buoy-sync (Queued, not tested yet) with nothing under it. Then **ADDED AFTER THE CUT 2** with pier-booking (Failing, 6/9 steps: BUG pier-booking-F1-1, ROUND "R1 6/9", AGENT "Fix r1", "Validate r1") and lighthouse-log (Queued, not tested yet). Then **BACKLOG 1** with net-mender (Failing, 18/20 steps: BUG net-mender-F2-1, BUG net-mender-F3-1, ROUND "R3 18/20").
   - Expect the list to hold exactly 6 feature links, 6 bug links, 6 round links and 10 agent links, matching `bugs` 6, `rounds` 6 and `agents` 10 of [J1.2].
7. [J1.7] Click **Close**. Expect the panel gone and the button **Objects** not expanded.
8. [J1.8] Read the untested features. In the labels (desktop) and in the **Objects** list find buoy-sync and lighthouse-log.
   - Expect their score to read "not tested yet" and nowhere "0/", "0 steps" or "0%" on those two features' labels or list rows: an untested feature is never drawn as zero.

## Journey 2 — Click an object: its data view opens and what is related lights up

1. [J2.1] Click **Objects**, then click the feature **tide-table** in the list.
   - Expect the address to end `#/feature:tide-table`, the trail "Overview › tide-table", the **Objects** panel to close by itself, and the data view to open, starting with "FEATURE", the title **tide-table**, the pill "Fixed, awaiting retest" and the note "Current state: what the release looks like right now."
2. [J2.2] Read the stage's `data-world`.
   - Expect `selected` "feature:tide-table", `focusId` "tide-table", `cameraMode` "object", and `related` exactly these twelve tokens as a set: `feature:tide-table`, `scope:planned`, `bug:tide-table-F1-1`, `bug:tide-table-F1-2`, `round:tide-table:1`, `round:tide-table:2`, `agent:a1`, `agent:a9`, `agent:a8`, `agent:a7`, `feature:harbor-chart`, `feature:buoy-sync`. Every other object is dimmed. On desktop, where all six feature labels are drawn, the labels of pier-booking, lighthouse-log and net-mender carry the class `tw-dim` and the labels of tide-table, harbor-chart and buoy-sync do not; on a phone only the labels of the opened object and its related features are drawn.
3. [J2.3] Read the data view from the top.
   - Expect the section "WHERE IT SITS" with District "This release · counted in this release", Latest test "12/16 steps (75%) · round 1 · baseline v1", Test rounds "1", Depends on "harbor-chart". Expect "JOURNEY THROUGH THE RELEASE" with a line chart whose axis reads "Mar 1 08:00 UTC", "now (live)", "Mar 4 10:00 UTC", then these rows in order: "Mar 1 14:00 Round 1 12/16 steps (75%) · Failing"; "R1 Found tide-table-F1-1 Total row shows 11 instead of 12"; "R1 Found tide-table-F1-2 Badge stays grey"; "R1 Fix applied tide-table-F1-2 Read the low-tide token 7777777"; "Mar 4 09:30 Round 2 being tested now, no score yet". Expect "ITS BUGS (2)" listing tide-table-F1-1 (Open, [J2.3] Total row shows 12) and tide-table-F1-2 (Fixed, awaiting re-test, [J2.5] Low-tide badge colour); "AGENTS (4)" listing Validate · round 2 (Running), Validate · round 1 (Done), Triage · round 1 (Done), Fix · round 1 (Done); and "RELATED (HIGHLIGHTED IN THE WORLD)" with ten rows: bug tide-table-F1-1 "its bug", bug tide-table-F1-2 "its bug", round "R1 12/16" "its test round", round "R2" "its test round", agents "Validate r2", "Fix r1", "Triage r1", "Validate r1" each "an agent working on it", feature harbor-chart "tide-table depends on it", feature buoy-sync "depends on tide-table".
4. [J2.4] In the **RELATED** list click the feature **harbor-chart**.
   - Expect the address to end `#/feature:tide-table/feature:harbor-chart` (one more layer on the same trail), the trail "Overview › tide-table › harbor-chart", `selected` "feature:harbor-chart", and in its data view the RELATED rows "FEATURE net-mender · shares bug net-mender-F2-1" and "FEATURE tide-table · depends on harbor-chart".
5. [J2.5] Read harbor-chart's `related` in `data-world`.
   - Expect exactly these eleven tokens as a set: `feature:harbor-chart`, `scope:planned`, `bug:harbor-chart-F1-1`, `round:harbor-chart:1`, `round:harbor-chart:2`, `agent:a6`, `agent:a5`, `agent:a4`, `agent:a3`, `feature:net-mender`, `feature:tide-table` (a bug reported against net-mender belongs to harbor-chart, and tide-table depends on it). `feature:pier-booking` is not among them.
6. [J2.6] Click the **‹ Back** button in the data view.
   - Expect the address to end `#/feature:tide-table` (exactly one layer popped), the trail "Overview › tide-table", and `selected` "feature:tide-table".
7. [J2.7] Click **‹ Back** again.
   - Expect the address with no token (`#/`), the trail reading only **Overview**, `selected` null and `cameraMode` "overview". Wait 2.5 seconds for the camera to settle.
8. [J2.8] Click the crystal of **pier-booking** in the 3D scene: read its position from `data-crystals` (the entry with id `feature:pier-booking`), then click (mouse on desktop, tap on the phone) that point of the stage.
   - Expect the address to end `#/feature:pier-booking`, `selected` "feature:pier-booking", and its data view to show District "Added after the cut · added 2030-03-03 (b7c8d9e) · counted in this release" with the reason "The owner asked for pier booking after the cut." (A tap on or next to a crystal opens the crystal, not a small satellite beside it.)
9. [J2.9] Click **‹ Back**.
   - Expect the address with no token (`#/`), the trail reading only **Overview**, the data view closed, `selected` null and `cameraMode` "overview".

## Journey 3 — Bug, agent, test round and district views

Start every step below from the overview: if the trail is longer than **Overview**, click **Overview** in the trail first (a link opened from **Objects** adds one layer to the current trail).

1. [J3.1] Click **Objects**, click the bug **tide-table-F1-2** under tide-table.
   - Expect the data view "BUG", the title "[J2.5] Low-tide badge colour", the pill "Fixed, awaiting re-test" and "tide-table-F1-2 · fix attempts 1 of 2". Expect the ribbon "Found / Being fixed / Verified fixed" with **Being fixed** as the current step (marked `aria-current="step"`), under it the rows "R1 Found Badge stays grey" and "R1 Fix applied Read the low-tide token src/demo/badge.js 7777777", then Details: Root cause "The badge reads the high-tide colour token.", Class "defect", Files "src/demo/badge.js", Fix attempts "1 of 2", Whose bug "This feature", Reported against "tide-table · rounds 1".
2. [J3.2] Read the RELATED section and `data-world`.
   - Expect the rows feature **tide-table** "reported against", round "R1 12/16" "round it was touched in", and agents "Validate r1", "Triage r1", "Fix r1" each "worked in a round this bug was touched"; `related` exactly `bug:tide-table-F1-2`, `feature:tide-table`, `scope:planned`, `round:tide-table:1`, `agent:a7`, `agent:a8`, `agent:a9`.
3. [J3.3] Click **Objects**, click the bug **net-mender-F2-1** under net-mender.
   - Expect the title "[J2.2] Chart legend overlaps", the pill "Belongs to another feature", Whose bug "Another feature — harbor-chart" with the line "The legend is drawn by harbor-chart (scope:net-mender:r3)", and in RELATED the features **net-mender** "reported against" and **harbor-chart** "the feature this bug belongs to". `related` is exactly `bug:net-mender-F2-1`, `feature:net-mender`, `scope:backlog`, `feature:harbor-chart`, `round:net-mender:3`.
4. [J3.4] Click **Objects**, click the bug **pier-booking-F1-1**.
   - Expect a highlighted box "Question for you: What is the latest time of day a same-day pier booking can be made?", the pill "Needs a person" and "fix attempts 2 of 2".
5. [J3.5] Click **Objects**, click the agent **Validate r2** listed under **tide-table** (not the one under harbor-chart).
   - Expect the data view "AGENT", the title "Validate · round 2 — tide-table", the pill "Running", a row of seven loop stages "Build, Validate, Triage, Scope check, Fix, Reconcile, Integrate" with **Validate** current, Latest step "$ node walk-journeys --journey 2", TOKENS "9k out, 1k in, 30k cache write, 900k cache read", LIVE TEST LOG "Checks logged 14 (12 passed)" with "[J2.3] expected: Total shows 12 · saw: Total shows 11", and "AGENTS ON TIDE-TABLE IN ORDER (4)". `related` is exactly `agent:a1`, `feature:tide-table`, `scope:planned`, `round:tide-table:2`.
6. [J3.6] Click **Objects**, click the round **R1 12/16** under tide-table.
   - Expect the data view titled "TEST ROUND", "tide-table — round 1", "Done · 12/16 steps passed", a table "STAGES IN THIS ROUND" with Validate · round 1, Triage · round 1 and Fix · round 1, and "BUGS FOUND, FIXED OR VERIFIED IN THIS ROUND (2)". `related` is exactly `round:tide-table:1`, `feature:tide-table`, `scope:planned`, `bug:tide-table-F1-1`, `bug:tide-table-F1-2`, `agent:a7`, `agent:a8`, `agent:a9`.
7. [J3.7] Click **Objects**, click the district heading **ADDED AFTER THE CUT**.
   - Expect the data view "DISTRICT", the title "Added after the cut: 2", At a glance "Features 2", "Passed 0 of 2", "Open bugs (this work) 1", the two notes "pier-booking · added 2030-03-03 (b7c8d9e) · counted in this release · The owner asked for pier booking after the cut." and "lighthouse-log · added 2030-03-03 (c8d9e0f) · kept in backlog · Parked in the backlog until the harbor chart is stable.", and a table of the two features. `cameraMode` "district", `related` exactly `scope:added`, `feature:pier-booking`, `feature:lighthouse-log`.
8. [J3.8] On desktop, wait 2 seconds and click with the mouse at the centre of the district label **BACKLOG 0/1 passed** drawn over the world (the label is part of the scene: it takes the click wherever no crystal is); on a phone click the heading **BACKLOG** in the **Objects** list.
   - Expect the data view "Backlog: 1" listing net-mender, and the address to end with `scope:backlog` as one more layer.
9. [J3.9] Click **Data map** (the button over the world, not in the data view).
   - Expect the data view titled "DATA MAP" with the heading "The world is a view — its data map" (displayed in capitals) and one card per mapped channel, among them "Crystal colour" (source "release-tracker › features › status", policy "Live") and "Crystal gold ring" (policy "Needs approval"). Click **‹ Back**; expect the data view to close.

## Journey 4 — Current versus Historic, and what changed

1. [J4.1] With nothing open, click **Historic** in the group "World state".
   - Expect **Historic** pressed and **Current** not, the time bar reading "Mar 3 10:00 UTC · after 0.9.0-u4", the slider with minimum 0, maximum 4 and value 3, `data-world` `mode` "historic", `at` 3 and `changed` exactly `["tide-table"]`.
   - Expect the release label to read "Release 0.9.0 | as of Mar 3 10:00 UTC · 1 of 4 passed (this release)" and, on desktop, the tide-table label to read "tide-table | Failing · 12/16 steps · 75% | changed since" while the other five labels are unchanged from [J1.3].
2. [J4.2] Click **Objects**, click **tide-table**.
   - Expect a note "Historic state: Mar 3 10:00 UTC · after 0.9.0-u4. Amber items changed since then; rows marked after this point had not happened yet.", the pill "Failing" with the chip "changed since", a section "CHANGED SINCE THIS POINT" with the single line "Status: Failing → Fixed, awaiting retest", the journey row "Mar 4 09:30 Round 2 being tested now, no score yet" marked "after this point", and "ITS BUGS (2)" reading "At this point the record holds counts only: 2 open (this work), 0 verified fixed, 0 backlog (not this work), 0 waiting on a person. Switch to Current to open the individual bugs." and "AGENTS (4)" reading "Agent runs are shown for the Current state only."
   - Expect the chart's marker line to read "chosen point · Mar 3 10:00 UTC".
3. [J4.3] Drag the slider (or set it) to 0.
   - Expect the as-of text "Mar 1 08:00 UTC · after 0.9.0-u1", `at` 0, `changed` exactly `["harbor-chart","tide-table","pier-booking","lighthouse-log","net-mender"]`, and in the data view of tide-table the status "Queued" with "Latest test Not tested yet", "Test rounds 0", and the rows of Round 1 marked "after this point".
4. [J4.4] Click the feature **pier-booking** in the **Objects** list while at point 0.
   - Expect the notice "This feature was not tracked yet at the chosen point." and a section "CHANGED SINCE THIS POINT" with "Not tracked yet at this point in time; it joined the release later."; on desktop its label reads "pier-booking | Not tracked yet · not tracked yet | not tracked yet then".
5. [J4.5] Click **›** ("Next update (world)") once.
   - Expect the as-of text "Mar 1 14:00 UTC · after 0.9.0-u2" and `at` 1; click **‹** ("Previous update (world)") once; expect "Mar 1 08:00 UTC · after 0.9.0-u1" and `at` 0.
6. [J4.6] Click **Live**.
   - Expect the as-of text **Live**, **Current** pressed, `mode` "current", `at` null, `changed` empty, and the data view back to the current rows (no "after this point" marks).
7. [J4.7] With the feature **pier-booking** still open ([J4.4]), click **Historic**, then **Current**.
   - Expect **Historic** to return to point 0 (the point last used; the first time it opens at point 3 as in [J4.1]) and, after **Current**, the live state (`mode` "current"); `selected` stays "feature:pier-booking" through both switches.
8. [J4.8] Click **Overview** in the trail, click **Objects**, click the bug **tide-table-F1-1**, click **Historic**, set the slider to 0.
   - Expect the journey row "R1 Found Total row shows 11 instead of 12" to carry the mark "after this point". Click **Live**.

## Journey 5 — One trail shared with the Board

1. [J5.1] Click **Objects**, click **tide-table**, click **Objects**, click the bug **tide-table-F1-2**.
   - Expect the address to end `#/feature:tide-table/bug:tide-table-F1-2` and the trail "Overview › tide-table › tide-table-F1-2".
2. [J5.2] Click **Board** in the **View** group.
   - Expect the address and the trail unchanged, the Board's bug page for "[J2.5] Low-tide badge colour" instead of the world, and no 3D stage on the page.
3. [J5.3] Click **World** in the **View** group.
   - Expect the same address and trail, the world back, and `selected` "bug:tide-table-F1-2".
4. [J5.4] Click **‹ Back**, then use the browser's Back.
   - Expect `#/feature:tide-table` after **‹ Back** (one layer popped); the browser's Back then returns to the address before it (`#/feature:tide-table/bug:tide-table-F1-2`), because **‹ Back** is itself a step in the history.
5. [J5.5] Click the **tide-table** link in the trail.
   - Expect `#/feature:tide-table` and `selected` "feature:tide-table".
6. [J5.6] Click **Overview** in the trail.
   - Expect no token in the address, the data view closed and `selected` null.

## Journey 6 — The platform screen uses the same World

1. [J6.1] In the platform (precondition P.4 done), click **World** in the **View** group.
   - Expect the stage with class `tw-stage` filling the screen's content width, and the same `data-world` counts as [J1.2] (nodes 6, bugs 6, rounds 6, agents 10, satellites 22, rivers 2, the same three districts), the same ten labels on desktop (four on a phone) as [J1.3], and the heading line "Live · Updated" in the header.
2. [J6.2] Click **Objects**, click **tide-table**.
   - Expect the address to end `#/rt/feature:tide-table`, the trail "Overview › tide-table", and the same data view as [J2.1] to [J2.3], followed at the bottom by the platform-only sections "DATA MAP — WHAT THIS CRYSTAL DRAWS, AND FROM WHERE" (including "Crystal gold ring" with value "12/16 (75%)" and policy "Needs approval") and "PENDING CHANGES (1) — AWAITING APPROVAL".
3. [J6.3] Click **‹ Back**, then click the chip "3 Open bugs (this work)" (on a phone: open **Objects** and click that chip at the top).
   - Expect the address to end `#/rt/stat:open-bugs`, the trail "Overview › Open bugs (this work)", and the data view titled "Open bugs (this work): 3" listing pier-booking-F1-1, tide-table-F1-1 and tide-table-F1-2 (the Board's own page, drawn inside the world).
4. [J6.4] Click **‹ Back**, click **Historic**.
   - Expect the time bar "Mar 3 10:00 UTC · after 0.9.0-u4" and `changed` exactly `["tide-table"]`, the same as [J4.1]; click **Live**.
5. [J6.5] Click **Objects**, click **tide-table**, then click **Board** in the **View** group.
   - Expect the Board's feature page for tide-table with the trail "Overview › tide-table" and the address `#/rt/feature:tide-table`; click **World** and expect the data view of tide-table again.
6. [J6.6] Click **Settings** in the group **Screen**, then **Tracker**, then **World** is still the chosen view.
   - Expect the World to draw again with the same counts, and no page error.

## Journey 7 — API and MCP

Run in a shell with the platform running. `<ADMIN_EMAIL>` and `<ADMIN_PASSWORD>` are the seeded administrator's.

1. [J7.1] Run `curl -s -c jar.txt -H "content-type: application/json" -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}' <BASE>/api/auth/login`. Expect `"ok":true` and `"role":"admin"`.
2. [J7.2] Run `curl -s -b jar.txt "<BASE>/api/release-tracker/world/object?object=feature:tide-table"`. Expect JSON with `releaseKey` "2030-03-01-demo-harbor", `kind` "feature", `mode` "current", `related` holding exactly the eleven ids `scope:planned`, `bug:tide-table-F1-1`, `bug:tide-table-F1-2`, `round:tide-table:1`, `round:tide-table:2`, `agent:a1`, `agent:a9`, `agent:a8`, `agent:a7`, `feature:harbor-chart`, `feature:buoy-sync` (the same set as [J2.2] without the object itself), each with a `reason`, and `journey` holding two `round` rows then three `bug_event` rows (tide-table-F1-1 found, tide-table-F1-2 found, tide-table-F1-2 fixed with commit "7777777").
3. [J7.3] Run `curl -s -b jar.txt "<BASE>/api/release-tracker/world/object?object=bug:net-mender-F2-1"`. Expect `kind` "bug", `status` "reassigned", `scope.owner` "harbor-chart", and `related` ids `feature:net-mender`, `scope:backlog`, `feature:harbor-chart`, `round:net-mender:3` (the same as [J3.3] without the object itself).
4. [J7.4] Run `curl -s -b jar.txt "<BASE>/api/release-tracker/world/object?object=feature:tide-table&at=3"`. Expect `mode` "historic", `at` 3, `changedSince` exactly `["Status: failing → awaiting_retest"]`, `related` holding no `bug:` ids, and the `round` row of round 2 with `afterChosenPoint` true.
5. [J7.5] Run `curl -s -o /dev/null -w "%{http_code}" -b jar.txt "<BASE>/api/release-tracker/world/object"`. Expect `400`; and `curl -s -b jar.txt "<BASE>/api/release-tracker/world/object"` returns an error whose `code` is `object_required` and whose message starts "Say which object to open".
6. [J7.6] Run `curl -s -w " %{http_code}" -b jar.txt "<BASE>/api/release-tracker/world/object?object=bug:nope"`. Expect status `404`, `code` `object_not_found` and a message that starts `"bug:nope" is not in release 2030-03-01-demo-harbor`; and with `object=feature:tide-table&at=99` expect `400`, `code` `at_invalid`, message "This release has 5 recorded states, so the point in time must be between 0 and 4."
7. [J7.7] Run `curl -s -o /dev/null -w "%{http_code}" "<BASE>/api/release-tracker/world/object?object=feature:tide-table"` with no cookie. Expect `401`. Then sign in as `member@test.local` (a second cookie jar) and run the same request with it; expect `403` while the member's email is not listed under **Who can view** on the tracker's Settings tab.
8. [J7.8] In the browser as the administrator open `<BASE>/world`, click **Journeys**, click **Connected Agents**, type **World reader** in **Token name**, tick **release.read (administrators only)**, click **Create token**, and keep the token shown (starts `sbpat_`) as TOKEN. Expect the box "Copy your token now. It will not be shown again."
9. [J7.9] Run `node scripts/mcp-call.mjs --url <BASE>/mcp --token <TOKEN> call release_tracker_world_object '{"object":"feature:tide-table"}'`. Expect `isError: false` and a printed JSON whose `result.related` ids are the same eleven as [J7.2].
10. [J7.10] Run `node scripts/mcp-call.mjs --url <BASE>/mcp --token <TOKEN> call release_tracker_world_object '{"object":"bug:nope"}'`. Expect `isError: true` and a printed `error` with `status` 404 and `code` `object_not_found`.
11. [J7.11] Run `node scripts/mcp-call.mjs --url <BASE>/mcp --token <TOKEN> list`. Expect a line `release_tracker_world_object` among the tool lines.

## Journey 8 — Keyboard, touch, reduced motion, pause

1. [J8.1] On the artifact page in World, move the keyboard focus to the world stage (press Tab until the focus ring surrounds the stage, whose accessible name starts "Release world."). Press **ArrowRight** four times.
   - Expect a small note over the world reading "harbor-chart" and "Enter to open" (the first three presses visit the three districts, the fourth the first feature), and the label of harbor-chart outlined.
2. [J8.2] Press **Enter**.
   - Expect the address to end `#/feature:harbor-chart` and `selected` "feature:harbor-chart".
3. [J8.3] Move the focus back to the stage and press **Escape**.
   - Expect the address with no token (`#/`).
4. [J8.4] On desktop wait 3 seconds, then click **Pause motion**; on a phone skip to [J8.5]. Read the positions in `data-crystals`, wait 1.2 seconds, read them again.
   - Expect the button to read **Resume motion**, `paused` true in `data-world`, and every crystal within 3 pixels of where it was; click **Resume motion** and expect `paused` false.
5. [J8.5] Start a new browser context that asks for reduced motion (the "prefers-reduced-motion: reduce" setting), open the artifact page, click **World**, wait 4 seconds for the stage to finish laying out, read `data-crystals`, wait 1.2 seconds without pressing anything and read it again.
   - Expect `reducedMotion` true in `data-world` and every position within 3 pixels of where it was; click a crystal and expect `cameraMode` "object" immediately (the camera cuts, it does not fly).
6. [J8.6] On the phone pass, tap the crystal of harbor-chart (its position from `data-crystals`). On desktop, click it.
   - Expect the address to end `#/feature:harbor-chart` (a tap on a crystal opens it, not the ring or sun behind it).

## Journey 9 — Phone layout (390px)

1. [J9.1] On the artifact page in World, at 390px wide, read the page's scroll width and the heights of the buttons **Current**, **Historic**, **Objects** and **Data map**.
   - Expect the page's `scrollWidth` not to exceed 390 (no sideways scrolling) and each of the four buttons to be at least 44 pixels tall. On desktop expect only that the page's scroll width does not exceed 1280.
2. [J9.2] Click **Objects**, then click **tide-table**.
   - Expect the Objects panel to close and the data view to open as a sheet at the bottom of the stage (on a phone it spans the stage's width), with a **Collapse** button (not shown on desktop, where the data view is a panel on the right).
3. [J9.3] On the phone click **Collapse**; on desktop skip this step.
   - Expect the button to read **Expand**, the data view's body to be hidden while its header stays, and the world to be visible above it; click **Expand** and expect the body back and the button reading **Collapse**.
4. [J9.4] Read `data-world` and the Objects list on the phone.
   - Expect every feature, bug, round and agent still reachable from **Objects** (the same counts as [J1.6]) even though only four labels are drawn over the world.

## Edge cases

- [E.1] Open the artifact page and, with the World showing, paste a link ending `#/bug:does-not-exist` into the address bar and press Enter. Expect the data view to read **NOT FOUND** with "That item is no longer in the tracker. Use the trail above to go back." and the trail "Overview › does-not-exist"; **‹ Back** returns to `#/`.
- [E.2] A feature that was never tested is never shown with a score of zero: in the data view of buoy-sync expect "Latest test Not tested yet" and the sentence "No test round has been recorded for this feature yet."
- [E.3] The district **Added after the cut** is a separate ring from **This release** even though pier-booking counts toward the release score: `districts` in `data-world` has three entries and the release label counts "1 of 4 passed (this release)" (four counted features: the three planned and pier-booking).
- [E.4] In the platform, opening a stale link (`#/rt/agent:does-not-exist`) shows the data view **NOT FOUND**, the trail "Overview › does-not-exist" and no page error.
