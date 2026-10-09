# Training spec: Live release tracker inside the platform

Version 1 · 2026-10-09 · feature key `live-release-tracker` · change spec: `docs/changes/live-release-tracker.md`

Audience: a person using the platform, and a test agent driving a real browser. Every step says what to do and what you should see. All data is fictional and comes from the fixtures in `docs/training/fixtures/live-release-tracker/`. Replace `<BASE>` with the app's address (for example `http://127.0.0.1:6102`) and `<FIX>` with the fixture repository address (`http://127.0.0.1:7300`).

Labels are written as they appear in the DOM; some headings are displayed in capitals through styling.

Surfaces. Every capability here is reachable three ways: (1) the website, by point-and-click from the World Shell on desktop and as a 390px phone walkthrough; (2) the API route named in the journey (same permission checks as the screen); (3) an MCP tool. `server/lib/mcpToolRegistry.js` does not exist on this branch, so the MCP surface is a recorded gap (`MCP_GAP`, assigned to `platform-mcp`); the tool descriptors that will be registered are `RELEASE_TRACKER_TOOLS` in `server/lib/releaseTrackerService.js` and each calls the same function as the route. Do not fail a step for the missing registry; record it once.

## Where things are

- **Sign in**: `<BASE>/login`. Sign in once per account and reuse the session; sign-in is limited to 10 attempts per 15 minutes.
- **The tracker (admin and granted members)**: `<BASE>/world`, click **Journeys** (top), click the card **Release tracker**. The same screen is at `<BASE>/release-tracker` (this is the address a shared link points to) and, for an admin, in **Classic Tools** under **Platform Lifecycle Management**.
- **Header controls**: **Board** / **World** (group named View), **Auto** / **Light** / **Dark** (Theme), **Tracker** / **Settings** (group named Screen, admins only), a **Release** selector (only when two or more releases exist), and the freshness line (for example `Live · Updated 4 s ago`).
- **Settings**: the **Settings** button in the Screen group. Sections: **Source repository (pull)**, **GitHub webhook**, **Ingest tokens (push)**, **Who can view** (with **Share links**), **Paste a snapshot**, **Recent ingests**.
- **Fixture repository server** (a stand-in for GitHub's raw file host, serving the fictional repository `demo-org/demo-repo` branch `main`): `node scripts/release-tracker-fixture-server.mjs --port 7300`. It serves repository state `v1` until told `curl -X POST <FIX>/__use/v2`.
- **Push fixtures**: `docs/training/fixtures/live-release-tracker/push/v1.json`, `v2.json`, `v3-snapshot-only.json` (release `2030-02-05-demo-tide`).

Expected non-2xx and aborted requests (not failures): [J1.3] makes one `POST /api/release-tracker/pull` answer 400; Journey 7 makes denied views answer 401/403 on `/api/release-tracker/state`, `/stream` or `/shared/...`; the live stream request is reported as aborted whenever the page navigates or reloads; Google Fonts requests may fail in an offline sandbox.

## Preconditions (fictional data)

Do these once, in order, on a fresh database (booted once, then `npm run seed`).

1. [P.1] **Create the accounts**: run `node scripts/create-test-member.mjs` (creates `member@test.local`) and `node scripts/create-test-member.mjs --email other@test.local --name "Other Member"`. The administrator is the seeded one (`ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` of the environment). Terms are accepted by the script.
2. [P.2] **Start the fixture repository server**: run `node scripts/release-tracker-fixture-server.mjs --port 7300` in the background and confirm `curl <FIX>/__state` prints `v1`.
3. [P.3] **Sign in** in the browser as the administrator at `<BASE>/login`, and sign in once as `member@test.local` and once as `other@test.local` in two more browser contexts (reuse those sessions below).
4. [P.4] **Open the tracker as the administrator**: at `<BASE>/world` click **Journeys**, click the card **Release tracker**.

## Journey 1: first open, empty state, Settings layout

1. [J1.1] Look at the screen opened in P.4.
   - Expect a "Back to World" control and the title **Release tracker**, the page heading **Release tracker**, and a card headed **No release data has arrived yet** with the text "Open Settings to point the tracker at a repository and fetch it, create an ingest token for a machine to push with, or paste a snapshot." and a link/button **Open Settings**.
   - Expect the freshness line to read `Live` (no "Updated" part, because nothing has arrived) and the **Board / World** group to be absent.
2. [J1.2] Click **Open Settings**.
   - Expect the heading **Release tracker settings** and, in this order, the sections **Source repository (pull)**, **GitHub webhook**, **Ingest tokens (push)**, **Who can view**, **Paste a snapshot**, **Recent ingests**.
   - Expect under **Recent ingests** the text "Nothing has been ingested yet."
   - Expect under **GitHub webhook** the text "Secret: not set" and the payload URL `<BASE>/api/release-tracker/webhook/github`.
3. [J1.3] Click **Fetch from repository now** before any repository is entered.
   - Expect a red alert reading exactly "No repository is configured. Set it on the Settings tab." and no row added under **Recent ingests**.

## Journey 2: ingest by pull (a repository state)

API: `POST /api/release-tracker/pull` (admin), `GET|PUT /api/release-tracker/settings`. MCP descriptors: `release_tracker_pull_now`, `release_tracker_save_settings`.

1. [J2.1] Fill **Repository (owner/name)** with `demo-org/demo-repo`, **Branch** with `main`, **Source base URL** with `<FIX>` (for example `http://127.0.0.1:7300`), leave **Poll interval** at `0`, and click **Save source settings**.
   - Expect a toast "Source settings saved" and no alert.
2. [J2.2] Click **Fetch from repository now**.
   - Expect the note "Fetched and stored snapshot 1 for 2030-01-09-demo-reef."
3. [J2.3] Click **Fetch from repository now** again.
   - Expect the note "Nothing new: the repository matches snapshot 1."
4. [J2.4] Read **Recent ingests**.
   - Expect two rows, newest first: via `pull`, result `unchanged`, detail "Release 2030-01-09-demo-reef: nothing new since snapshot 1 (snapshot 1)"; and via `pull`, result `stored`, detail "Release 2030-01-09-demo-reef: 4 features, 5 bugs (snapshot 1)".
5. [J2.5] Click **Tracker** in the Screen group.
   - Expect the panel heading "Release trends · 0.1.0" and the line "History since Jan 9 08:00 UTC · 4 recorded states · 3 updates".
   - Expect the **Board / World** group to appear.
6. [J2.6] Read the stat tiles under the trends panel (each is a link ending "Open ›").
   - Expect, in order: `1 / 4` **Features passed**; `0` **Agents running**; `3` **Open bugs (this work)**; `1` **Backlog: not this work**; `1` **Bugs verified fixed**; `0` **Need a person**; `0` **Finished with unreconciled failures**; `0.1.0-u3` **Status updates**; `0 / 0` **Tokens out / cache read**.
   - Expect no purple "need a person" callout, and under **Agents working now** the text "No agent is running here right now."
7. [J2.7] Read the **Features** table.
   - Expect four rows: `reef-survey` **Passed**, "Round 2: 20/20 steps", rounds `2`, "1 of 1"; `tide-ledger` **Failing**, "Round 1: 12/16 steps", rounds `1`, "0 of 2" and "+ 1 in backlog"; `kelp-sync` **Fixed, awaiting retest**, "Round 1: 9/10 steps", rounds `1`, "0 of 1"; `coral-notes` **Queued**, "Not tested yet", rounds `0`, "None of its own".

## Journey 3: the trends panel (toggles, filter, slider, table)

All values below are for the repository state loaded in Journey 2, reading the panel under **Release trends · 0.1.0**.

1. [J3.1] Read the as-of tiles and the as-of line (Show **Bugs**, As **Totals**, Feature **All features**, slider at **Live**).
   - Expect four tiles: `3` **Open (this work)** "-2 since 0.1.0-u2"; `1` **Verified fixed** "+1 since 0.1.0-u2"; `1` **Backlog (not this work)** "+1 since 0.1.0-u2"; `0` **Waiting on a person** "no change since 0.1.0-u2".
   - Expect the line "Live · As of Jan 10 10:00 UTC · commit d4e5f60 · after update 0.1.0-u3" and the note "0.1.0-u3 — reef-survey passes · Read the update notes ›".
   - Expect update markers `u1`, `u2`, `u3` above the slider and a legend of four buttons: **Open (this work)**, **Verified fixed**, **Backlog (not this work)**, **Waiting on a person**.
2. [J3.2] Click **Previous update** (the ‹ button).
   - Expect "As of Jan 10 06:00 UTC · commit c3d4e5f · after update 0.1.0-u3" (no "Live ·") and tiles `3` "-2 since 0.1.0-u2", `2` "+2 since 0.1.0-u2", `1` "+1 since 0.1.0-u2", `0` "no change since 0.1.0-u2".
3. [J3.3] Click **Previous update** again.
   - Expect "As of Jan 9 14:00 UTC · commit b2c3d4e · after update 0.1.0-u2" and tiles `5` "+5 since 0.1.0-u1", `0` "no change since 0.1.0-u1", `0` "no change since 0.1.0-u1", `0` "no change since 0.1.0-u1".
4. [J3.4] Click **Next update** (the › button), then **Live**.
   - Expect after **Next update** "As of Jan 10 06:00 UTC · commit c3d4e5f · after update 0.1.0-u3", and after **Live** the line from step [J3.1] again with the **Live** button pressed.
5. [J3.5] In the Show group click **Test scores**.
   - Expect one tile: `88.3%` **Average step pass rate (tested features)** "+19.5% since 0.1.0-u2".
6. [J3.6] In the Show group click **Features passed** (the first button with that name, not the legend).
   - Expect two tiles: `1` **Features passed** "+1 since 0.1.0-u2" and `3` **Features tested at least once** "+1 since 0.1.0-u2".
7. [J3.7] Click **Bugs** in the Show group, click **Change per update** in the As group.
   - Expect a bar chart with 12 bars (three comparisons, 0.1.0-u1 → 0.1.0-u2, 0.1.0-u2 → 0.1.0-u3, 0.1.0-u3 → Live, times four series), and the chart has no update markers. Click **Totals** to return to the line chart.
8. [J3.8] Choose `tide-ledger` in the **Feature filter**.
   - Expect tiles `2` **Open (this work)** "-1 since 0.1.0-u2", `0` **Verified fixed** "no change since 0.1.0-u2", `1` **Backlog (not this work)** "+1 since 0.1.0-u2", `0` **Waiting on a person** "no change since 0.1.0-u2", and under **Test score by feature** exactly one card reading "tide-ledger round 1: 12/16 steps (75%) · Failing". Choose **All features** to restore four cards.
9. [J3.9] Click the legend button **Open (this work)**, then click it again.
   - Expect it to be unpressed (`aria-pressed` false, dimmed) after the first click and the blue line to disappear from the chart; pressed again after the second click.
10. [J3.10] Click **Table view**.
    - Expect the chart to be replaced by a table with columns **When (UTC)**, **Update**, **Open (this work)**, **Verified fixed**, **Backlog (not this work)**, **Waiting on a person** and four rows, newest first: `Jan 10 10:00 | 0.1.0-u3 | 3 | 1 | 1 | 0`, `Jan 10 06:00 | 0.1.0-u3 | 3 | 2 | 1 | 0`, `Jan 9 14:00 | 0.1.0-u2 | 5 | 0 | 0 | 0`, `Jan 9 08:00 | 0.1.0-u1 | 0 | 0 | 0 | 0`. Click **Table view** again to return to the chart.
11. [J3.11] Move the pointer over the far right of the line chart, then the far left.
    - Expect a tooltip. Far right: starts "Jan 10 10:00" and lists "Open (this work): 3". Far left: starts "Jan 9 08:00" and "after 0.1.0-u1" and lists "Open (this work): 0".
12. [J3.12] Click the far left of the line chart.
    - Expect the slider and line to read "As of Jan 9 08:00 UTC · commit a1b2c3d · after update 0.1.0-u1" and **Live** no longer pressed. Click **Live** to return.
13. [J3.13] Under **Test score by feature** read the four cards.
    - Expect each card to name its feature, a status and a small line chart: `reef-survey` "round 2: 20/20 steps (100%) · Passed", `tide-ledger` "round 1: 12/16 steps (75%) · Failing", `kelp-sync` "round 1: 9/10 steps (90%) · Fixed, awaiting retest", `coral-notes` "not tested yet · Queued". Clicking a card opens that feature's layer (Journey 4).

## Journey 4: drill-down layers, breadcrumbs, URL, Back and refresh

1. [J4.1] On the overview click the stat tile **Open bugs (this work)**.
   - Expect the address to end `#/rt/stat:open-bugs`, the heading "Open bugs (this work): 3", the breadcrumb trail "Overview › Open bugs (this work)", and a table of three bugs (`tide-ledger-F1-1`, `tide-ledger-F1-2`, `kelp-sync-F1-1`).
2. [J4.2] Click the bug `tide-ledger-F1-1`.
   - Expect the address to end `#/rt/stat:open-bugs/bug:tide-ledger-F1-1`, the trail "Overview › Open bugs (this work) › tide-ledger-F1-1", the heading "[J2.3] Total row shows 12", a status pill **Open**, "fix attempts 0 of 2", and a Details block: Root cause "The total ignores rows added after the first refresh.", Class "defect", Files "src/demo/ledger.js", Whose bug "This feature" with "Introduced by the ledger rewrite commit (scope:tide-ledger:r1)", Reported against "tide-ledger · rounds 1". Under **History**: "R1 Found Total row shows 11 instead of 12".
3. [J4.3] Click the browser Back button.
   - Expect the address to end `#/rt/stat:open-bugs` and the list from step [J4.1].
4. [J4.4] Reload the page.
   - Expect the same layer (heading "Open bugs (this work): 3"). Then click **Overview** in the trail and expect the overview with the trends panel.
5. [J4.5] On the overview click the card `kelp-sync` under **Test score by feature**.
   - Expect the heading `kelp-sync`, a pill **Fixed, awaiting retest**, "1 test round · latest: round 1, 9/10 steps", a **Test rounds** chip "Round 1", and sections **Working now** ("No agent is running here right now."), **Its own bugs (1)** (`kelp-sync-F1-1`), and **Agent runs (0)** ("No agent runs here.").
6. [J4.6] Click the chip **Round 1**.
   - Expect the trail "Overview › kelp-sync › kelp-sync · round 1", the heading "kelp-sync — round 1", the line "Result recorded in the release log: 9/10 steps (docs/test-results/kelp-sync/round-1.md)", and under "Bugs found, fixed or verified in this round (1)" the bug `kelp-sync-F1-1`.
7. [J4.7] Click `kelp-sync-F1-1`, then in the Reported-against line click the feature name `kelp-sync`.
   - Expect the bug layer (pill **Fixed, awaiting re-test**, History "R1 Found Badge stays grey" and "R1 Fix applied Listen for sync:done" with the commit link `c0ffee1`), then the feature layer again.
8. [J4.8] Click **Overview**, then the stat tile **Status updates**.
   - Expect the heading "Status updates — release 0.1.0" and a table, newest first: `0.1.0-u3` "2030-01-10 06:05 UTC" "reef-survey passes" "1 / 4" open `3` verified `2`; `0.1.0-u2` "2030-01-09 14:05 UTC" "First test round" "0 / 4" `5` `0`; `0.1.0-u1` "2030-01-09 08:05 UTC" "Build started" "0 / 4" `0` `0`.
9. [J4.9] Click `0.1.0-u3`.
   - Expect the heading "reef-survey passes", the line "0.1.0-u3 · 2030-01-10 06:05 UTC · commit c3d4e5f · compared with 0.1.0-u2", the section **What happened** "reef-survey passed its second round; tide-ledger moved one bug to backlog.", **Compared with the previous update** listing "Features passed 1 of 4 (was 0).", "Open bugs 3 (was 5).", "Verified fixed 2 (was 0).", **Feature changes** listing `reef-survey` and `kelp-sync`, and **Every feature at this update** with four rows. The trail reads "Overview › Status updates › Update 0.1.0-u3".
10. [J4.10] Click **Status updates** in the trail, then **Overview**.
    - Expect the updates list, then the overview, each showing its layer.

## Journey 5: ingest by push with a per-release token, and revoking it

API: `POST /api/release-tracker/snapshots` with `Authorization: Bearer <token>`; `POST|GET /api/release-tracker/tokens`, `DELETE /api/release-tracker/tokens/:id`. MCP descriptors: `release_tracker_create_token`, `release_tracker_revoke_token`, `release_tracker_ingest_snapshot`.

1. [J5.1] Open **Settings**. Under **Ingest tokens (push)** type `2030-02-05-demo-tide` in **Release key** and `agent container` in **Token label**, and click **Create ingest token**.
   - Expect a toast "Ingest token created" and a highlighted block reading "New ingest token (shown once): rti_" followed by the token. Copy the token (it is never shown again).
   - Expect a table row: label `agent container`, release `2030-02-05-demo-tide`, "Ends in" `…` plus four characters, status **Active**, a **Revoke** button.
2. [J5.2] Run `curl -s -o /dev/null -w "%{http_code}" -X POST <BASE>/api/release-tracker/snapshots -H "Content-Type: application/json" -H "Authorization: Bearer <token>" --data @docs/training/fixtures/live-release-tracker/push/v1.json` and expect it to print `201`.
3. [J5.3] Run the identical command again and expect it to print `200` (nothing new, not stored twice).
4. [J5.4] Click **Tracker**.
   - Expect "Release trends · 0.2.0" and "History since Feb 5 08:30 UTC · 3 recorded states · 2 updates", and a **Release** selector whose options are `2030-02-05-demo-tide` and `2030-01-09-demo-reef`.
5. [J5.5] Read the stat tiles.
   - Expect `1 / 3` **Features passed**, `1` **Agents running**, `2` **Open bugs (this work)**, `0` **Backlog: not this work**, `1` **Bugs verified fixed**, `1` **Need a person**, `0.2.0-u2` **Status updates**, `13k / 1.4M` **Tokens out / cache read**, and the purple callout "1 bug needs a person. Open them ›".
6. [J5.6] Under **Agents working now** read the card.
   - Expect "VALIDATE · ROUND 2", `wave-gauge`, "$ node walk-journeys --journey 2", "14 checks · 12 passed · 1 failed".
7. [J5.7] Click the card.
   - Expect the heading "Validate · round 2 — wave-gauge", the trail "Overview › Validate · round 2 · wave-gauge", a **Live test log** with "Checks logged 14 (12 passed)" and one failed check "[J2.3]" with "Expected: Total shows 12" and "Saw: Total shows 11". Click **Overview**.
8. [J5.8] In the **Release** selector choose `2030-01-09-demo-reef`.
   - Expect "Release trends · 0.1.0" and the Journey 2 tiles; choose `2030-02-05-demo-tide` to return.
9. [J5.9] Run the push command of [J5.2] with the header `Authorization: Bearer rti_notarealtokennotarealtoken` and expect `401`; run it with no Authorization header and expect `401`.
10. [J5.10] Open **Settings** and click **Revoke token agent container**.
    - Expect the row status to change to **Revoked** and the **Revoke** button to disappear.
11. [J5.11] Run the push command of [J5.2] with the revoked token and expect `401`. Under **Recent ingests** expect, newest first, a row via `push` result `unchanged` (the [J5.3] push) and a row via `push` result `stored` for snapshot 2 (the [J5.2] push), and no row for the refused pushes.
12. [J5.12] Run `PLATFORM_URL=<BASE> RELEASE_TRACKER_INGEST_TOKEN=<revoked token> node scripts/release-tracker-push.mjs docs/training/fixtures/live-release-tracker/push/v1.json` and expect it to print a line starting "[release-tracker] push FAILED: 401" on stderr and exit with status 3.

## Journey 6: a second ingest while the screen is open updates it live (no reload)

API: `GET /api/release-tracker/stream` (server-sent events). MCP descriptor: `release_tracker_get_state`.

1. [J6.1] Create a new ingest token as in [J5.1] (label `live demo`, same release key) and keep it. In a second browser tab (same signed-in session) open **Release tracker** and stay on the overview ("Release trends · 0.2.0", tile `0.2.0-u2` **Status updates**).
2. [J6.2] In that tab click **Previous update** once (the line then reads "As of Feb 5 08:30 UTC · commit 1111111 · after update 0.2.0-u1", **Live** not pressed).
3. [J6.3] Run the push command of [J5.2] with the new token and `push/v2.json`.
   - Expect `201`.
4. [J6.4] Without touching or reloading the second tab, wait up to 10 seconds.
   - Expect the stat tile to read `0.2.0-u3` **Status updates**, the panel line "History since Feb 5 08:30 UTC · 4 recorded states · 3 updates", the freshness line `Live · Updated` with a value between `0 s ago` and `10 s ago`, and under **Agents working now** a card "BUILD" `moon-clock` "Write src/demo/moon.js".
   - Expect the slider to be where you left it: the as-of line still reads "As of Feb 5 08:30 UTC · commit 1111111 · after update 0.2.0-u1" and **Live** is not pressed (the screen did not reload or jump).
5. [J6.5] Click **Live**.
   - Expect "Live · As of Feb 5 10:15 UTC · commit 3333333 · after update 0.2.0-u3" and the note "0.2.0-u3 — Gauge fix proposed · Read the update notes ›".
6. [J6.6] Run the push command with `push/v3-snapshot-only.json` (a snapshot that carries no history).
   - Expect `201`, and within 10 seconds the panel line "History since Feb 5 08:30 UTC · 5 recorded states · 3 updates" (the platform recorded a state from the snapshot) and, after clicking **Live**, "As of Feb 5 11:00 UTC".
7. [J6.7] In **Settings**, paste the text of `push/v3-snapshot-only.json` into **Snapshot JSON** and click **Store snapshot**.
   - Expect a toast "Nothing new: identical to the latest snapshot" and the box still holds nothing (it is cleared).

## Journey 7: access (admins always, members by email, share link) and revocation

API: `GET|PUT /api/release-tracker/settings`, `GET /api/release-tracker/state`, `GET /api/release-tracker/shared/:token/state`, `POST|DELETE /api/release-tracker/tokens`. MCP descriptors: `release_tracker_save_settings`, `release_tracker_create_token`.

1. [J7.1] In the `other@test.local` browser open `<BASE>/world`, click **Journeys**.
   - Expect no card named **Release tracker**. Then open `<BASE>/release-tracker`.
   - Expect a card headed **No access to the release tracker** with the text "You do not have access to the release tracker. Ask an admin to add your email on its Settings tab." and the freshness line `Not connected`.
2. [J7.2] As the administrator open **Settings**, type `member@test.local` into **Member emails**, click **Save access**.
   - Expect a toast "Access saved" and the box still containing `member@test.local`.
3. [J7.3] In the `member@test.local` browser open `<BASE>/world`, click **Journeys**, click **Release tracker**.
   - Expect the tracker overview with the same data the admin sees, **no** Screen group (**Tracker** / **Settings** absent), and calling `GET <BASE>/api/release-tracker/settings` from this browser returns 403.
4. [J7.4] As the administrator type `partner view` into **Share link label** and click **Create share link**.
   - Expect a toast "Share link created" and a block "New share link (shown once): <BASE>/release-tracker/shared/" followed by a token; copy the whole link. Expect a row with label `partner view`, status **Active**.
5. [J7.5] In a private window (no sign-in) open the share link.
   - Expect the tracker overview ("Release trends · 0.2.0"), the line "Read-only view shared with a link.", no Screen group and no Settings button.
6. [J7.6] As the administrator clear **Member emails** and click **Save access**.
   - Expect, within 10 seconds and without any action in the member's browser, that browser to show **No access to the release tracker** with the text from [J7.1].
7. [J7.7] As the administrator click **Revoke share link partner view**.
   - Expect the private window, within 10 seconds, to show **No access to the release tracker** with "This share link is not valid. It may have been revoked or switched off."; reloading it shows the same text.

## Journey 8: World view (the same data as a crystal world)

Reading the world needs the push release `2030-02-05-demo-tide` from Journeys 5 and 6 (newest state `push/v3-snapshot-only.json`). Use the administrator's browser, Tracker screen, overview. The world publishes two aids for testing on the stage element: `data-crystals` (each crystal's screen position in CSS pixels) and `data-world` (counts and mode).

1. [J8.1] Click **World** in the View group.
   - Expect an underwater scene (blue-green water, a sand floor, light shafts, bubbles) with a large pale crystal labelled "Release 0.2.0" / "live" at the centre and three smaller crystals, and the hint "Drag to orbit · scroll or pinch to zoom · click a crystal".
   - Expect `data-world` to report `environment` "underwater", `nodes` 3, `satellites` 3, `rivers` 1.
2. [J8.2] Read the side panel.
   - Expect the heading "Release 0.2.0", the line "Live · drag to orbit, scroll to zoom, click a crystal to enter it", four tiles `2` **Open (this work)**, `1` **Verified fixed**, `0` **Backlog (not this work)**, `1` **Waiting on a person**, a **How to read the world** key (Crystal colour = feature status with six swatches; Crystal size = how many test steps it has; gold ring = share of steps passing; stream of bubbles = an agent working on it now; Small satellites = its bugs with four swatches), and **The world is a view — its data map** listing six mappings: "Crystal colour", "Crystal size", "Crystal gold ring", "Crystal bubble stream", "Satellite colour", "Satellite ghost (translucent)", each with a source such as `release-tracker › features › status` and a **Live** or **Needs approval** tag.
   - Expect under **Every crystal** a list of three links: "wave-gauge Fixed, awaiting retest 8/12 steps", "salt-pier Passed 10/10 steps", "moon-clock Validate not tested yet". This list is the keyboard route: Tab to a link and press Enter opens the same layer as clicking the crystal.
3. [J8.3] Move the pointer over the `wave-gauge` crystal (use its position from `data-crystals`).
   - Expect a tooltip "wave-gauge / Fixed, awaiting retest · 8/12 steps / 2 bugs in orbit · click to enter". The crystal has a gold ring about two thirds complete.
4. [J8.4] Click **Pause motion**, then read `data-crystals` twice one second apart.
   - Expect the positions to match within 3 pixels, and the button to read **Resume motion**. Click **Resume motion**.
5. [J8.5] Click the `wave-gauge` crystal in the scene.
   - Expect the camera to fly in and the address to end `#/rt/feature:wave-gauge`, the trail "Overview › wave-gauge", `data-world` `focusId` "wave-gauge", the other crystals faded, and the side panel to start with **Data map — what this crystal draws, and from where**: "Crystal colour" value "Fixed, awaiting retest"; "Crystal size" "12 steps"; "Crystal gold ring" "8/12 (67%)" tagged **Needs approval**; "Crystal bubble stream" "no"; "Satellite colour" "2 bugs"; "Satellite ghost (translucent)" "1 pending".
6. [J8.6] Read the next panel section.
   - Expect **Pending changes (1) — awaiting approval** with the card "wave-gauge-F1-1 · fix proposed in 3333333 · approver: the next browser re-test", "If approved, it changes:" and four lines, the first reading "Satellite wave-gauge-F1-1: colour Open (this work) → Verified fixed; no longer translucent", and "If rejected (the re-test still fails), the bug returns to Open and the fix attempt is counted." One small satellite near the crystal is translucent with a dashed edge.
7. [J8.7] In the panel click the bug `wave-gauge-F1-1`.
   - Expect the address to end `#/rt/feature:wave-gauge/bug:wave-gauge-F1-1` and the trail "Overview › wave-gauge › wave-gauge-F1-1" (the same bug layer the Board shows).
8. [J8.8] Click **Overview** in the trail.
   - Expect the camera to fly back out, `focusId` null, and the world overview panel of [J8.2].
9. [J8.9] Move the world's history slider (labelled "Replay the world at an earlier moment") to its far left.
   - Expect the panel line "Release 0.2.0 as of Feb 5 08:30 UTC", four tiles reading `0`, `data-world` `satellites` 0 and `rivers` 0, and the **Live** button no longer pressed. Click **Live** and expect the live world back (`satellites` 3, `rivers` 1).
10. [J8.10] Click **Board**.
    - Expect the Board overview, and on clicking **World** again the world returns to the same release.
11. [J8.11] Reduced motion: in a browser started with "prefers-reduced-motion: reduce", open the World.
    - Expect `data-world` `reducedMotion` true, `data-crystals` positions identical (within 3 pixels) 1.2 seconds apart without pressing **Pause motion**, and clicking a crystal to cut straight to it (`focusId` set, no flight).
12. [J8.12] The same data map, ghosts and breadcrumbs must also exist for the Board: open `#/rt/feature:wave-gauge` on the Board.
    - Expect the feature layer without the Data map (the Data map is a World-panel feature), and the same URL opening the same feature in World when you click **World**.

## Journey 9: 390px phone walkthrough and dark mode

Repeat as a phone (viewport 390x844, touch). All earlier journeys must be walkable at this width; this journey names what is different.

1. [J9.1] At 390px open the tracker overview.
   - Expect no horizontal page scroll (the page's scroll width equals its width), the header controls wrapping onto several lines, every button, select and slider at least 44 pixels tall (the slider buttons, **Live**, the View/Theme/Screen buttons, the legend buttons, **Revoke**, the Save buttons), and tables shown as stacked cards with a small caption above each value (for example "STATUS", "LATEST TEST").
2. [J9.2] Open the World at 390px.
   - Expect the scene on top and the side panel below it as a sheet (not beside it), the hint and **Pause motion** visible, only the label "Release 0.2.0" drawn over the water (the three crystal names are hidden because they would crowd; they are in the **Every crystal** list), and the world's slider bar showing the buttons and the slider without the as-of text (the panel line "Live" / "as of …" shows it).
3. [J9.3] Tap a crystal (use `data-crystals`), then tap **Overview** in the trail.
   - Expect the same results as [J8.5] and [J8.8], and no horizontal page scroll in either state.
4. [J9.4] Open **Settings** at 390px.
   - Expect every field and button reachable without horizontal scroll and the forms one field per row.
5. [J9.5] Dark mode: in a browser started with "prefers-color-scheme: dark", open the overview with the **Auto** theme selected.
   - Expect the page background `rgb(22, 26, 28)` and the **Open (this work)** legend swatch `rgb(39, 148, 201)`; clicking **Light** changes them to `rgb(248, 244, 236)` and `rgb(11, 121, 168)`; clicking **Dark** while the browser is in light mode gives the dark values; **Auto** follows the browser again.
6. [J9.6] Open the World in dark mode.
   - Expect a darker water gradient (deep blue-black), the same crystals and labels, readable text in the side panel (no black-on-dark), and no crystal drawn in a light-mode colour.

## Edge cases

- [E.1] **Invalid JSON pasted**: in **Settings** > **Paste a snapshot** type `{not json` and click **Store snapshot**. Expect a red alert beginning "That is not valid JSON:" and nothing stored.
- [E.2] **A snapshot with no features**: paste `{"snapshot":{"features":[]}}` and click **Store snapshot**. Expect a red alert reading `The snapshot lists no features with a "key"` and a **Recent ingests** row via `manual` with result `rejected`.
- [E.3] **Invalid repository**: type `not a repo` into **Repository (owner/name)** and click **Save source settings**. Expect a red alert "Repository must look like owner/name" and nothing saved.
- [E.4] **A token for another release**: with an ingest token for release `2030-02-05-demo-tide`, push a body `{"snapshot":{"release":{"release":"2030-03-01-other"},"features":[{"key":"x"}]}}`. Run the push command of [J5.2] with `-d` of that body. Expect HTTP 403 and the message "This ingest token is for release "2030-02-05-demo-tide" but the snapshot is for "2030-03-01-other"".
- [E.5] **Webhook**: in **Settings** click **Generate webhook secret**. Expect a block "New secret (shown once): " followed by 48 hex characters and the line "Secret: set". Then (cli) switch the fixture repository with `curl -X POST <FIX>/__use/v2`, and POST to `<BASE>/api/release-tracker/webhook/github` the body `{"ref":"refs/heads/main","after":"e5f60718293a","repository":{"full_name":"demo-org/demo-repo"}}` with headers `X-GitHub-Event: push` and `X-Hub-Signature-256: sha256=<HMAC-SHA256 of the exact body using the secret>`. Expect HTTP 200 with `"outcome":"stored"`; with `X-Hub-Signature-256: sha256=00` expect HTTP 401; with `X-GitHub-Event: ping` and a correct signature of its body expect `"pong":true`. After the stored one, choose release `2030-01-09-demo-reef` in the **Release** selector and expect "History since Jan 9 08:00 UTC · 5 recorded states · 4 updates", tile `2 / 4` **Features passed** and `0.1.0-u4` **Status updates**; **Recent ingests** shows a row via `webhook` with result `stored`.
- [E.6] **Share links switched off**: with a share link created, untick **Allow read-only share links**, click **Save access**. Expect **Create share link** disabled and an open copy of that link to show "No access to the release tracker" within 10 seconds.
- [E.7] **Server stops**: stop the server process (cli) while the tracker is open. Expect, within 15 seconds, the freshness line to read "Live stream interrupted — checking every 10 s" followed by "Updated <time> ago", with the data still on screen (never a blank or silently stale screen). Start the server again and expect `Live` again within 30 seconds.
- [E.8] **Unknown item**: open `<BASE>/release-tracker#/rt/bug:nope`. Expect "That item is no longer in the tracker. Use the trail above to go back." and the trail "Overview › nope".
- [E.9] **Nothing leaks**: a granted member's `GET <BASE>/api/release-tracker/tokens` returns 403, and the response of `GET <BASE>/api/release-tracker/state` never contains a token or the webhook secret.
- [E.10] **Failed push is not hidden**: the command of [J5.12] with the right release but the server stopped exits 3 and prints "[release-tracker] push FAILED:" with the reason.
