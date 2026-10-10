# Training spec — World Shell layers: the Sun is the root menu and every click goes one layer deeper

Audience: a member or admin using the platform, and a test agent driving a real browser. Every step says exactly what to do and what you should see. All data is fictional (company **Northwind Freight**, role **Principal Value Architect**, second role **Senior Pricing Lead** at **Contoso Logistics**). Everything happens inside the World Shell (`/world`).

Version 1 · 2026-10-09 · change spec: `docs/changes/world-shell-layers.md`

## Where things are

- **The layer model.** The **Sun** (the big faceted crystal in the middle of the 3D world) is layer 0, the root menu. Every click into an object pushes exactly one layer after it: island, then item (an opportunity), then sub-object (the outputs list, one output, its draft editor or version history). The stack is written in the address bar as `/world?at=<layer>,<layer>,...` (for example `/world?at=island:careerPlacementAgents,opp:12,outputs`). Nothing is stored except what is in that address.
- **The trail (breadcrumbs).** A bar directly under the top bar. It is the path you actually took, summary pages included. Every crumb except the last is a button that returns to that layer; the last one (gold, bold) is where you are. At the right is **Copy link**. In this spec "the trail reads X" means the full trail with ` › ` between crumbs:
  - Desktop (1280 x 900): the bar itself reads, for example, `Sun › Career Placement Agents › Principal Value Architect`.
  - Phone (390 x 844): a trail with more than two crumbs collapses to `… › <current>`; tap the **…** button (label "Show full trail") and the full trail appears as a numbered list under the bar; the list entries read the same names in the same order as the desktop bar. On the phone, read the full trail that way, then press **…** again (or anywhere outside the bar) to close the list before doing anything else - while it is open it covers the top of the page.
- **The Sun menu.** At layer 0 the right-hand panel is titled **Sun menu** and lists every place this user may go as a labelled button with a small hint at the right. For the test member the entries are, in order: **Career Placement Agents** (OPENS A PANEL), **My Website** (ENTER THE PLANET), **Fund & Portfolio Demo** (OPENS FULL SCREEN), **Career Master** (OPENS FULL SCREEN), **Career Sources to Review** (OPENS FULL SCREEN), **My Resume** (OPENS FULL SCREEN), **Site Configuration** (ENTER THE PLANET), **Output Templates** (OPENS FULL SCREEN), **Journeys** (CARD LIST). At phone width this panel is a bottom sheet that fills the lower two thirds of the screen.
- **Journeys** tab = a grid of cards (one per island, same labels). Clicking a card pushes that island on top of **Journeys**.
- **Layers of Career Placement Agents:** the tracked list (summary page) then one opportunity (stage, score, a short **APPLICATION OUTPUTS** summary with the cards and a button **Open application outputs (n) ›**) then **Application outputs** (a list of clickable entries and a status filter) then **one output** (full provenance and a **Versions of this output** list) then **Draft editor** or **Version history** on top of it.
- **Back buttons** at the top of a panel still read as before (**← Back to World**, **← Back to Career Placement Agents**, **← Tracked list**) and now each pops exactly one layer.
- **Phone tap targets** are at least 44 px tall: every crumb, **Copy link**, **…**, the Sun menu entries, the Journeys cards and the panel buttons.
- **API:** `GET /api/world-layers/resolve?at=<stack>` (signed-in user; same permissions as the UI). **MCP:** tool `world_layers_resolve` (input `at`, scope `career.read`) calls the same function `resolveWorldLayers` with the authenticated user. Capability row `world-layers-resolve` in the parity map (World Shell > Capabilities).
- **Timing:** the test browser renders the 3D scene in software and is slow. Wherever a step says a layer appears, allow up to 60 seconds before calling it failed.

## Preconditions (set up once, on a fresh database)

1. Harness-level, not part of the journeys: the database is booted once and seeded (`npm run seed`), then `node scripts/create-test-member.mjs` creates **member@test.local** (password `TestPass!2345`, display name **Test Member**) and readies the admin, and `node scripts/create-test-member.mjs --email other@test.local --name "Other Member"` creates **other@test.local** (password `TestPass!2345`). The admin signs in with the values of the environment variables `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`.
2. Create the file `/tmp/layers-resume.txt` containing exactly these three paragraphs, separated by blank lines: `Principal Value Architect resume`, `Builds quote-to-revenue systems for freight networks.`, `Led a pricing platform migration at Northwind Freight.`
3. Open `/login`, enter **member@test.local** and `TestPass!2345`, click **Sign In**. Expect the World Shell at `/world` with the trail `Sun` and the right-hand panel **Sun menu**.
4. In the Sun menu click **Career Placement Agents**, click **+ Add**, type **Principal Value Architect** in **Job title** and **Northwind Freight** in **Company**, click **Track**. Expect the opportunity to open as the next layer: trail `Sun › Career Placement Agents › Principal Value Architect`. Write down the number after `opp:` in the address bar as `<ID>`.
5. In that opportunity click **Import Resume (PDF/DOCX/TXT)** and choose `/tmp/layers-resume.txt`. Expect, under **APPLICATION OUTPUTS**, the line `2 outputs linked: 2 draft, 0 approved.` and two cards titled **Imported Resume — layers-resume.txt** and **Cover Letter — Principal Value Architect at Northwind Freight** (the cover letter is created automatically when the opportunity is tracked).
6. Click **← Tracked list**, click **+ Add**, type **Senior Pricing Lead** and **Contoso Logistics**, click **Track**, then click **← Tracked list**. Expect **TRACKED (2)** and the trail `Sun › Career Placement Agents`.

## Journey 1 — The Sun is the root menu

1. Click the **World** tab. Expect the trail `Sun`, no `at=` in the address bar, the panel **Sun menu** with its explanatory text (`The sun is the root of your world.`) and exactly the nine entries listed under "Where things are", each with its hint.
2. Activate the Sun: on the desktop click the Sun crystal in the 3D area (the large faceted crystal in the middle); on the phone tap the crumb **Sun** at the left of the trail bar (the crystal is behind the bottom sheet there). Expect the trail to stay `Sun` and keyboard focus to land on the first Sun menu entry, **Career Placement Agents** (it shows a focus ring).
3. Press Enter. Expect the trail `Sun › Career Placement Agents` and the address bar ending `?at=island:careerPlacementAgents`.
4. Press Escape. Expect one layer popped: the trail `Sun` and no `at=` in the address bar.
5. Press Escape again. Expect nothing to change: the trail still `Sun`, the Sun menu still shown.

## Journey 2 — Path A: Sun menu → island → opportunity → output → version, and back out by crumb

1. In the Sun menu click **Career Placement Agents**. Expect the trail `Sun › Career Placement Agents`, the panel **Career Placement Agents** with **TRACKED (2)**, the rows **Principal Value Architect** and **Senior Pricing Lead**, a filter box with the placeholder **Filter tracked...**, and the top-left button **← Back to World**.
2. Type `Principal` in the filter box. Expect exactly one row, **Principal Value Architect**.
3. Click the row **Principal Value Architect**. Expect the trail `Sun › Career Placement Agents › Principal Value Architect`, the address bar ending `,opp:<ID>`, the heading **PRINCIPAL VALUE ARCHITECT** with the line **Stage** / **Discovered**, the top-left button **← Back to Career Placement Agents**, the text `2 outputs linked: 2 draft, 0 approved.`, the two output cards each with a button **Open output ›**, and below them the button **Open application outputs (2) ›**.
4. Scroll the panel down until **Open application outputs (2) ›** is on screen, then click it. Expect the trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs`, the address bar ending `,opp:<ID>,outputs`, the panel title **Application Outputs** with the subtitle **PRINCIPAL VALUE ARCHITECT**, and two clickable entries: `Imported Resume — layers-resume.txt` (with the badge **Draft** and the line `resume - version 1 of 1`) and `Cover Letter — Principal Value Architect at Northwind Freight` (badge **Draft**, `cover letter - version 1 of 1`). The two entries show no provenance list.
5. In the select **Filter outputs by status** choose **Draft only**. Expect both entries to stay and the select to read **Draft only**.
6. Click the entry **Imported Resume — layers-resume.txt**. Expect the trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs › Imported Resume — layers-resume.txt`, the address bar ending `,outputs,output:<OID>` (write down the number after `output:` as `<OID>`), the panel title **Output**, the card with **PROVENANCE** (`Source` / `Imported document (uploaded by you)`, `Version` / `Version 1 of 1`, `Lineage` / `v1 Draft`), a section **Versions of this output** with one entry, **Version 1** (badge **Draft**), and the top-left button **← Back to Application outputs**.
7. Click **Edit draft**. Expect the editor to fill the screen with the title `Imported Resume — layers-resume.txt`, the text `Version 1 - shared block editor`, and the trail (still visible at the top) `Sun › Career Placement Agents › Principal Value Architect › Application outputs › Imported Resume — layers-resume.txt › Draft editor`.
8. Click the first **Body Text** row, replace its text with `Principal Value Architect resume - revised.` and click **Save**. Expect the toast **Saved as a new draft version**, the editor to close, the trail to return to `Sun › Career Placement Agents › Principal Value Architect › Application outputs › Imported Resume — layers-resume.txt`, the card line `resume - version 2 of 2`, `Lineage` / `v1 Draft > v2 Draft`, and two entries under **Versions of this output**: **Version 1** and **Version 2**.
9. Click the entry **Version 1**. Expect the dated version-history window titled `Version history: Imported Resume — layers-resume.txt`, the rows **v1** and **v2 (latest)**, the text `Viewing v1 of 2 (draft)`, and the trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs › Imported Resume — layers-resume.txt › Version history`.
10. Click the crumb **Application outputs**. Expect the window to close, the trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs`, and the select **Filter outputs by status** still reading **Draft only** (the page you left is remembered).
11. Click the crumb **Principal Value Architect**. Expect the trail `Sun › Career Placement Agents › Principal Value Architect` and the button **Open application outputs (2) ›** visible on screen without scrolling (the scroll position of this page is restored).
12. Click the crumb **Career Placement Agents**. Expect the trail `Sun › Career Placement Agents`, the filter box still containing `Principal`, and exactly one row, **Principal Value Architect**.
13. Click the crumb **Sun**. Expect the trail `Sun`, no `at=` in the address bar and the **Sun menu** panel.

## Journey 3 — Path B: Journeys grid → same opportunity, a different trail that returns to the Journeys grid

1. Click the **Journeys** tab. Expect the trail `Sun › Journeys`, the address bar ending `?at=journeys`, and a grid of cards in which **Career Placement Agents** reads `2 tracked · 7 agents`.
2. Click the card **Career Placement Agents**. Expect the trail `Sun › Journeys › Career Placement Agents`, the address bar ending `?at=journeys,island:careerPlacementAgents`, **TRACKED (2)**, both rows shown, and the filter box empty (this is a different trail from Journey 2, so the filter typed there is not remembered here).
3. Click the row **Principal Value Architect**. Expect the trail `Sun › Journeys › Career Placement Agents › Principal Value Architect` and the same opportunity detail as in Journey 2 step 3.
4. Click **Open application outputs (2) ›**. Expect the trail `Sun › Journeys › Career Placement Agents › Principal Value Architect › Application outputs` and the select **Filter outputs by status** reading **All statuses** (not **Draft only**).
5. Click the crumb **Principal Value Architect**, then on the **Imported Resume — layers-resume.txt** card click **Open output ›**. Expect the trail `Sun › Journeys › Career Placement Agents › Principal Value Architect › Imported Resume — layers-resume.txt` (no **Application outputs** crumb: you did not pass through that page this time), the panel title **Output** and the button **← Back to Principal Value Architect**.
6. Click the crumb **Journeys**. Expect the trail `Sun › Journeys` and the grid of cards (the summary page this trail came from), not the Sun menu.
7. Click the crumb **Sun**. Expect the trail `Sun` and the **Sun menu** panel.

## Journey 4 — Back buttons, Escape and the browser's Back and Forward each pop or replay one layer

1. In the Sun menu click **Career Placement Agents**, click the row **Principal Value Architect**, click **Open application outputs (2) ›**, click the entry **Imported Resume — layers-resume.txt**. Expect the trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs › Imported Resume — layers-resume.txt`.
2. Press Escape. Expect exactly one layer popped: the trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs`.
3. Use the browser's Back (the browser button, or Alt+Left). Expect the trail `Sun › Career Placement Agents › Principal Value Architect` (the page before the outputs list).
4. Use the browser's Forward (Alt+Right). Expect the trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs`.
5. Click the top-left button **← Back to Principal Value Architect**. Expect the trail `Sun › Career Placement Agents › Principal Value Architect`.
6. Click the top-left button **← Back to Career Placement Agents**. Expect the trail `Sun › Career Placement Agents` and the tracked list.
7. Click the top-left button **← Back to World**. Expect the trail `Sun` and the **Sun menu** panel.
8. In the Sun menu click **Career Placement Agents**, click **Principal Value Architect**, click the button **← Tracked list**. Expect the trail `Sun › Career Placement Agents` (the same one-layer pop through the old button label).
9. Click into the filter box (the box is shown because two items are tracked), type `x`, and press Escape. Expect the trail to stay `Sun › Career Placement Agents` and the filter box to still contain `x` (Escape inside a text field does not pop a layer). Clear the box.

## Journey 5 — Refresh, shared link, and links that no longer work

1. Open the output layer again: Sun menu → **Career Placement Agents** → **Principal Value Architect** → **Open application outputs (2) ›** → **Imported Resume — layers-resume.txt**. Click **Copy link** at the right of the trail. Expect a message under the bar reading `Link to this layer: ` followed by exactly the address shown in the address bar (it ends `?at=island:careerPlacementAgents,opp:<ID>,outputs,output:<OID2>`; write down the number after `output:` as `<OID2>` - it can differ from `<OID>` because saving a version in Journey 2 moved the output to its newest version).
2. Reload the page (F5). Expect the same address, the same trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs › Imported Resume — layers-resume.txt`, the panel title **Output** with the card **Imported Resume — layers-resume.txt**, and no note.
3. Open the copied address in a new browser tab of the same signed-in browser. Expect the same trail and the same panel.
4. Type `/world?at=island:careerPlacementAgents,opp:999999` into the address bar and open it. Expect the trail `Sun › Career Placement Agents`, the address to change to `?at=island:careerPlacementAgents`, and a note under the trail reading exactly `The link pointed to "opp 999999", which is not available here (that opportunity no longer exists or is not yours). Showing the deepest layer that is.` with a **Dismiss** button. Click **Dismiss** and expect the note to disappear.
5. Open `/world?at=island:nonsense`. Expect the trail `Sun` and the note `The link pointed to "island nonsense", which is not available here (it is not one of your islands). Showing the deepest layer that is.`
6. Open `/world?at=bogus:1`. Expect the trail `Sun` and the note `The link pointed to "bogus 1", which is not available here (unknown layer). Showing the deepest layer that is.`
7. Open `/world?at=island:careerPlacementAgents,opp:<ID>,outputs,output:777` (with your `<ID>`). Expect the trail `Sun › Career Placement Agents › Principal Value Architect › Application outputs`, the address to end `,opp:<ID>,outputs`, and the note `That output is no longer linked to this opportunity. Showing the layer above.`
8. Open `/world?at=island:careerPlacementAgents,opp:<ID>,outputs,output:<OID2>,editor:<OID2>` (your numbers). Expect the draft editor to open on **Imported Resume — layers-resume.txt** with the trail ending `› Draft editor`. Reload: expect the same editor and trail. Click **← Back** in the editor toolbar. Expect the trail to return to `Sun › Career Placement Agents › Principal Value Architect › Application outputs › Imported Resume — layers-resume.txt`.
9. In a separate private browser window sign in as **other@test.local** (`TestPass!2345`) and open the address from step 1. Expect the trail `Sun › Career Placement Agents`, **TRACKED (0)**, **Nothing tracked yet.**, and the note `The link pointed to "opp <ID>", which is not available here (that opportunity no longer exists or is not yours). Showing the deepest layer that is.` (with your `<ID>`). Nothing of the first member's opportunity is shown.

## Journey 6 — Full-screen modules, planets and Classic Tools are layers too

1. In the Sun menu click **Career Master**. Expect the full-screen **Career Master**, the trail `Sun › Career Master` and the address bar ending `?at=island:careerMaster`. Click **← Back to World**. Expect the trail `Sun`.
2. In the Sun menu click **My Website**. Expect the planet view, the trail `Sun › My Website`, the address ending `?at=island:content`, and the buttons **Definition Journey** and **Site Composition Journey**. Click **← Back to World**. Expect the trail `Sun`.
3. Click the **Classic Tools** tab. Expect the trail `Sun › Classic Tools` and the address ending `?at=classic:_`. Click **← Back to World**. Expect the trail `Sun`.
4. Click the **Journeys** tab, then the card **Career Master**. Expect the trail `Sun › Journeys › Career Master`. Click **← Back to World**. Expect exactly one layer popped: the trail `Sun › Journeys` and the grid of cards. Use the browser's Forward: expect the trail `Sun › Journeys › Career Master` again.

## Journey 7 — The same layers for an administrator

1. In a new private browser window open `/login` and sign in with the administrator account (`ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`). Expect `/world` with the trail `Sun` and a **Sun menu** whose entries, in order, are **My Profile**, **Leads**, **Config**, **Lonetree MVP**, **HERQ Publications**, **My Resume**, **Commercial Opportunity Pipeline**, **Career Master**, **Output Templates**, **Release Intelligence**, **Journeys**.
2. Click **Commercial Opportunity Pipeline**. Expect the trail `Sun › Commercial Opportunity Pipeline`. Click **+ Add**, type **Northwind Freight** in **Company** and **Quarter-end pricing review** in **Event trigger**, click **Track**. Expect the trail `Sun › Commercial Opportunity Pipeline › Northwind Freight`, the heading **NORTHWIND FREIGHT**, **Stage** / **Discovered** and the button **← Back to Commercial Opportunity Pipeline**.
3. Click the button **← Tracked list**. Expect the trail `Sun › Commercial Opportunity Pipeline`.
4. Click the crumb **Sun**, then **Leads** in the Sun menu. Expect the full-screen Leads module and the trail `Sun › Leads`. Click **← Back to World**. Expect the trail `Sun`.
5. Click the **Journeys** tab, the card **Commercial Opportunity Pipeline**, the row **Northwind Freight**. Expect the trail `Sun › Journeys › Commercial Opportunity Pipeline › Northwind Freight`. Click the crumb **Commercial Opportunity Pipeline**: expect the tracked list with the trail `Sun › Journeys › Commercial Opportunity Pipeline`.

## Journey 8 — Phone (390 x 844): the same journey with a collapsed trail

1. On the phone profile, signed in as **member@test.local**, open `/world`. Expect no horizontal scrolling (the page is exactly 390 px wide), the trail bar reading `Sun`, and the **Sun menu** as a bottom sheet with nine entries, each at least 44 px tall.
2. Tap the **Journeys** tab, the card **Career Placement Agents**, the row **Principal Value Architect**, **Open application outputs (2) ›**, the entry **Imported Resume — layers-resume.txt**. Expect the trail bar to read `… › Imported Resume — layers-resume.txt` (a **…** button, then the current name in gold).
3. Tap **…** (label "Show full trail"). Expect a numbered list under the bar with exactly six entries in this order: `Sun`, `Journeys`, `Career Placement Agents`, `Principal Value Architect`, `Application outputs`, `Imported Resume — layers-resume.txt`; each entry except the last is a button at least 44 px tall.
4. Tap the entry `Application outputs`. Expect the trail `Sun › Journeys › Career Placement Agents › Principal Value Architect › Application outputs` (read via **…**) and the list of two entries.
5. Tap the entry **Imported Resume — layers-resume.txt**, then **Edit draft**. Expect the editor to fill the screen, the trail bar still visible at the top and not covered by the editor, reading `… › Draft editor`.
6. Tap **← Back** in the editor toolbar, then **Version 2** under **Versions of this output**. Expect the version-history window fitting the screen (no horizontal page scroll) and the trail bar reading `… › Version history`.
7. Tap the **…** button, then the entry `Journeys`. Expect the window to close and the trail `Sun › Journeys` with the grid of cards.
8. Measure the buttons **Copy link**, **…** and every crumb button: each is at least 44 px high.

## Journey 9 — Reduced motion

1. With the browser's reduced-motion setting on (emulate `prefers-reduced-motion: reduce`), open `/world` signed in as **member@test.local**. Expect the **Sun menu** panel to show, under its explanatory text, the line `Reduced motion is on: the camera cuts to each layer instead of flying.`
2. In the Sun menu click **Career Placement Agents**. Expect the trail `Sun › Career Placement Agents` and the panel at once, with no travelling animation; then click the crumb **Sun**. Expect the trail `Sun`.
3. Turn reduced motion off (default) and reload: expect the **Sun menu** panel to show no such line.

## Journey 10 — The API and MCP

1. `curl -s -c /tmp/layers-jar -H 'Content-Type: application/json' -d '{"email":"member@test.local","password":"TestPass!2345"}' http://localhost:<API_PORT>/api/auth/login` returns HTTP 200 and sets the session cookie.
2. `curl -s -b /tmp/layers-jar 'http://localhost:<API_PORT>/api/world-layers/resolve?at=island:careerPlacementAgents,opp:<ID>,outputs,output:<OID2>'` returns JSON with `"valid":true`, `"scope":"member"`, `"at"` equal to the requested stack, `"note":""`, a `trail` whose labels are, in order, `Sun`, `Career Placement Agents`, `Principal Value Architect`, `Application outputs`, `Imported Resume — layers-resume.txt`, and a `sunMenu` array of nine entries whose first is `{"key":"careerPlacementAgents","label":"Career Placement Agents","kind":"docked"}`.
3. `curl -s -b /tmp/layers-jar 'http://localhost:<API_PORT>/api/world-layers/resolve?at=island:careerPlacementAgents,opp:999999'` returns `"valid":false`, `"at":"island:careerPlacementAgents"` and the same note text as Journey 5 step 4.
4. `curl -s 'http://localhost:<API_PORT>/api/world-layers/resolve?at=island:careerPlacementAgents'` (no cookie) returns HTTP 401 with `{"error":"unauthorized"}`.
5. `curl -s -c /tmp/layers-jar-other -H 'Content-Type: application/json' -d '{"email":"other@test.local","password":"TestPass!2345"}' http://localhost:<API_PORT>/api/auth/login` returns HTTP 200, and then `curl -s -b /tmp/layers-jar-other` with the request of step 2 returns `"valid":false` and `"at":"island:careerPlacementAgents"` (the other member can neither see nor learn about the first member's opportunity).
6. Run `node scripts/check-interface-parity.mjs` in the repository. Expect the last line `OK: the registry matches the code.` and exit code 0 (the capability `world-layers-resolve` lists the route of step 2 and the MCP tool `world_layers_resolve`, with no gap).

## Edge cases

- [E.1] A link whose layer is not allowed for the viewer (another member's opportunity, an island they do not have, a layer kind that does not exist) never shows a blank screen or an error page: the shell opens the deepest layer that is valid, replaces the address with it, and shows the note with the exact wording in Journey 5.
- [E.2] A link to an output (or draft) that was unlinked or never existed falls back one layer with the note `That output is no longer linked to this opportunity. Showing the layer above.` Check it on the output layer by clicking **Unlink** on the output card: expect the trail to return to `Sun › Career Placement Agents › Principal Value Architect › Application outputs` with that note (then click **Link output** after choosing the output under **Link an Existing Output** to restore it).
- [E.3] The Escape key never pops a layer while a text field, text area or select has focus, while the version-history window is open (that window closes itself, which pops its layer), inside a full-screen module, or while another dialog is open.
- [E.4] A layer that is only a hop to another place is not itself a layer: choosing a moon that points at another planet pushes that planet's island; choosing a moon that lives in Classic Tools pushes Classic Tools.
- [E.5] Without WebGL the 3D area shows `This device/browser doesn't support WebGL — use the Sun menu on the right, or the Journeys tab above, for a list view.` and every layer stays reachable through the Sun menu, the Journeys cards and the trail.
- [E.6] Opening the same opportunity from the Sun menu and from the Journeys grid gives different trails and different remembered filters, scroll positions and select values (Journeys 2 and 3); returning by crumb always lands on the page that trail came from.
- [E.7] The Sun menu entries and the Journeys cards are keyboard operable: Tab reaches each, Enter or Space opens it.
- [E.8] The old training spec `world-shell-navigation` (docs/training/world-shell-opportunity-outputs.md) steps still work: the output cards, **Edit draft**, **Approve for QR** (through the finalization gate), **Unlink**, **← Tracked list** and **← Back to World** are all still on the opportunity page and the full-screen Career Master.
- [E.9] Approving an output for its QR link from any layer goes through the same finalization gate as before (`useToolCategoryGate().run` on the client, `assertReadyToFinalize` on the server); layers add no second approval path.
- [E.10] Saving the editor with no change shows the red status `Error: No changes to save.` and stays on the **Draft editor** layer (no layer is popped on failure); the browser reports one HTTP 400 for the save request, which is expected.
- [E.11] When the opportunity list cannot be loaded the panel shows the load error and the trail still reads `Sun › Career Placement Agents`; the layers never hide an error.
- [E.12] MCP: the tool `world_layers_resolve` is registered in `server/lib/mcpToolRegistry.js` (append-only, listed in `server/data/mcpToolManifest.json`) and returns the same JSON as Journey 10 step 2 for the same signed-in user; a token without the `career.read` scope is refused. `node scripts/check-interface-parity.mjs` exits 0 and lists the capability `world-layers-resolve` with no gap.
