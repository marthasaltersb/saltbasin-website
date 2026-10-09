# Training spec — release loop inside the platform

Version 1 · 2026-10-09 · covers `docs/changes/in-app-release-loop.md` v1. Audience: a test agent driving a real browser (desktop and a 390px phone walkthrough) with a shell for the few command steps. Follow literally. All data is fictional (a garden-supplies product); nothing here names an employer or application target.

## Where things are

- World Shell (`/world`) -> top tab **Journeys** -> card **Release loop** (small text under the title: "Open configuration"). A full-screen panel opens with a **← Back to World** button, the title **Release loop**, and inside it the heading **Release loop** and three tabs in this order: **Definition**, **Runs**, **Escalations**. The **Runs** tab is open first.
- On a desktop-width window it is also listed under **Classic Tools** -> **PLATFORM LIFECYCLE MANAGEMENT** -> **RELEASE LOOP** (not a scored step: the Classic Tools console has no module menu at 390px, which predates this feature; the World Shell card above is the phone path).
- Nothing in the journeys needs an API call or a terminal. Every configurable value (the definition) is edited on the **Definition** tab. The command steps are only in "Journey 6" and "Edge cases" (marked as commands).
- "Text" in an expected result means visible text. The page also holds a hidden `output` element (`data-ux-audit-probe`) whose JSON repeats page text: ignore it.

Interface parity, per journey (UI path -> API route -> MCP tool). The MCP tools are named here so the platform MCP server can register them; the registry file does not exist at this baseline (Edge case about MCP).

| Journey | UI path | API (admin cookie, same checks) | MCP tool (calls the same server function) |
| --- | --- | --- | --- |
| 1 Definition | Definition tab | `GET/PUT/DELETE /api/release-loop/definition` | `release_loop_get_definition`, `release_loop_save_definition` -> `getDefinitionView`, `saveDefinition`, `resetDefinition` |
| 2 A run to done | Runs tab -> Start a run, Open run | `POST /api/release-loop/runs`, `GET /runs/:id`, `POST /runs/:id/transition`, `/rounds`, `/steps`, `/bugs`, `/reconciliation`, `PUT /runs/:id/reconciliation/:itemId`, `POST /bugs/:id/start-fix|fix|retest` | `release_loop_start_run`, `release_loop_get_run`, `release_loop_transition_run`, `release_loop_record_round`, `release_loop_log_step`, `release_loop_add_bug`, `release_loop_bug_action`, `release_loop_add_reconciliation`, `release_loop_resolve_reconciliation` |
| 3 Limits | Runs tab, Escalations tab | same, plus `POST /bugs/:id/decision`, `GET /escalations` | `release_loop_bug_action`, `release_loop_list_escalations` |
| 4 Business definition | Runs tab, Escalations tab | `POST /bugs/:id/answer`, `POST /bugs/:id/scope` | `release_loop_bug_action` |
| 5 Release Intelligence | Journeys -> Release Intelligence -> Releases | `GET /api/release-intelligence/releases/:id` | existing release-intelligence tools, when the registry exists |
| 6 Live steps | Run detail -> Live steps | `GET/POST /api/release-loop/runs/:id/steps` | `release_loop_log_step` |

## Preconditions

1. [P.1] A freshly seeded database, the production build served, and the admin account (the platform's first admin) signed in. The first time that account opens `/world` it shows "Career Portfolio Terms & Data Conditions": tick every box and press **I Agree — Continue**. `server/data/releaseLoop/definition.json` is unchanged at `"version": 4`. Reuse one signed-in session for every step (sign-in allows 10 attempts per 15 minutes per IP).
2. [P.2] Open World -> **Journeys** -> the **Release loop** card -> **Open configuration**. Expect the heading **Release loop**, the tabs **Definition**, **Runs**, **Escalations**, the text **No runs yet. Start one above.** and a **Start a run** card with fields **Release key**, **Feature key**, **Feature name (optional)** and a **Start run** button.
3. [P.3] Phone passes use a viewport 390px wide and 844px tall and the same steps. Desktop passes use 1280px wide. Run each pass on its own freshly seeded database.
4. [P.4] Expected noise: console errors for blocked web fonts or certificates (`net::ERR_CERT_AUTHORITY_INVALID`, `ERR_TUNNEL_CONNECTION_FAILED`) are environment noise. The only application requests allowed to fail are the refusals this spec names (HTTP 400 or 409), each at the step that causes it. No page error is allowed.

## Journey 1 — The editable definition and its versions

UI path: Definition tab. API: `/api/release-loop/definition`. MCP: `release_loop_get_definition`, `release_loop_save_definition`.

1. [J1.1] Click the tab **Definition**.
   - Expect the text **Definition version 4** and the text **Source: shipped file (version 4).** inside the first card, whose title is **Salt Basin release loop**.
2. [J1.2] Read the card **Platform agents** and the card **Version history**.
   - Expect exactly nine agents in this order: **Build agent**, **Integration agent**, **Validation agent**, **Triage agent**, **Fix agent**, **Release recorder**, **Amendment reviewer**, **Reconciliation agent**, **Scope agent**. Expect the card **Version history** to say **No edits yet: the shipped definition is in use.**
3. [J1.3] In the card **Edit the definition** set **Max fix rounds** to `2`, leave **Change note** empty, and click **Save new version**.
   - Expect a red alert **Add a change note saying what changed and why** (HTTP 400). The text **Definition version 4** is still shown.
4. [J1.4] Type `Shorter loop for the walkthrough` into **Change note** and click **Save new version**.
   - Expect the text **Definition version 5**, the text **Source: edited in the platform.**, a **Version history** entry beginning **Version 5** with the note **Shorter loop for the walkthrough**, the field **Max fix rounds** showing `2`, and a button **Reset to shipped definition**.
5. [J1.5] Set **Max fix attempts per bug** to `9`, type `Too many attempts` into **Change note**, and click **Save new version**. Then set **Max fix attempts per bug** back to `2` without saving.
   - Expect a red alert containing **maxFixAttemptsPerBug must be a whole number from 1 to 5** (HTTP 400) and the text **Definition version 5** unchanged.

## Journey 2 — One feature's run, from build to done

UI path: Runs tab -> Start a run -> Open run. API: `/api/release-loop/runs...`, `/api/release-loop/bugs/...`. MCP: `release_loop_start_run` and the run tools in the table above. The release key used throughout is `2030-04-01-garden-gate`.

1. [J2.1] Click the tab **Runs**.
   - Expect the text **No runs yet. Start one above.**
2. [J2.2] Type `not-a-date` into **Release key**, `seed-catalog` into **Feature key**, and click **Start run**.
   - Expect a red alert **The release key must start with a date (YYYY-MM-DD)** (HTTP 400).
3. [J2.3] Type `2030-04-01-garden-gate` into **Release key**, `Seed Catalog` into **Feature key**, and click **Start run**.
   - Expect a red alert **Feature key may use lowercase letters, digits and "-" only** (HTTP 400).
4. [J2.4] Type `seed-catalog` into **Feature key**, `Seed catalog` into **Feature name (optional)**, and click **Start run**.
   - Expect the run to open with the heading **seed-catalog · 2030-04-01-garden-gate**, the text **Stage: build (Build agent) · Status: active**, the text **Fix rounds used: 0 of 2 · definition version 5**, the text **Done gate: blocked** with the line **No validation round has been recorded**, and a button **Move to integrate**.
5. [J2.5] Click **Move to integrate**, then **Move to validate**.
   - Expect first **Stage: integrate (Integration agent)**, then **Stage: validate (Validation agent)** with two buttons **Mark done** and **Move to triage**.
6. [J2.6] Click **Mark done**.
   - Expect a red alert **This run cannot be marked done: No validation round has been recorded** (HTTP 409). The stage is still validate.
7. [J2.7] In the card **Live steps** type `J1.1` into **Step id**, choose `desktop` in **Step surface**, choose `fail` in **Step status**, type `Label cut off` into **Step note**, and click **Log step**.
   - Expect the card to show a step with the status **fail**, the id **J1.1**, the text **round 1 · desktop**, the note **Label cut off**, and the card title note **(refreshing every 3 seconds, round 1)**.
8. [J2.8] In the card **Validation rounds** under **Record round 1** type `2` into **Steps passed**, `3` into **Steps total**, choose `Passed` in **Round result**, and click **Record round**.
   - Expect a red alert **A round cannot pass with 2 of 3 steps passed** (HTTP 409).
9. [J2.9] Set **Steps passed** to `3` (keep **Round result** `Passed`) and click **Record round**.
   - Expect a red alert **A round cannot pass while 1 live step in it failed or logged a page error or failed request** (HTTP 409).
10. [J2.10] Set **Steps passed** to `2`, choose `Failed` in **Round result**, and click **Record round**.
    - Expect the line **Round 1: failed** with **2 of 3 steps** and the form heading now reads **Record round 2**.
11. [J2.11] Click **Move to triage**.
    - Expect **Stage: triage (Triage agent)**.
12. [J2.12] In the card **Bugs** under **Add a bug from triage** type `Label cut off` into **Bug title**, choose `defect` in **Bug class**, type `J1.1` into **Bug step id**, type `Label is clipped at 390px` into **Observed**, and click **Add bug**.
    - Expect a bug **seed-catalog-B1** with the status **open**, the line **defect · step J1.1 · Fix attempts: 0 of 2**, and the **Done gate** now listing **1 bug is not closed**.
13. [J2.13] Click **Move to escalate**.
    - Expect a red alert **Nothing to escalate: record a bug classed needs_business_definition with its exact question first** (HTTP 409). The stage is still triage.
14. [J2.14] Click **Start fix for seed-catalog-B1**.
    - Expect a red alert **Fixes start while the run is in the "fix" stage** (HTTP 409).
15. [J2.15] Click **Move to fix**.
    - Expect **Stage: fix (Fix agent)**, the text **Fix rounds used: 1 of 2**, and a button **Move to integrate_fix**.
16. [J2.16] Click **Start fix for seed-catalog-B1**, type `Wrapped the label` into **Fix summary for seed-catalog-B1**, type `src/gate.jsx, src/label.jsx` into **Files changed for seed-catalog-B1**, and click **Record fix for seed-catalog-B1**.
    - Expect the bug status **fixed_awaiting_retest**, **Fix attempts: 1 of 2**, and in the card **Fixes** the line **seed-catalog-B1 · fix round 1: Wrapped the label** with the files **src/gate.jsx, src/label.jsx**.
17. [J2.17] Click **Move to integrate_fix**, then **Move to validate**.
    - Expect first **Stage: integrate_fix (Integration agent)**, then **Stage: validate (Validation agent)**.
18. [J2.18] Click **Re-test passed for seed-catalog-B1** with **Re-test note for seed-catalog-B1** empty. Then type `Label wraps at 390px` into that note and click **Re-test passed for seed-catalog-B1** again.
    - Expect first a red alert **Say what the re-test showed** (HTTP 400), then the bug status **verified** with **Fix attempts: 1 of 2**. The **Done gate** is still **blocked**.
19. [J2.19] In the card **Reconciliation items** under **Add a reconciliation item** type `Browser would not start on first try` into **What failed**, `nothing written` into **State it left**, choose `failed` in **Item state**, choose `environment` in **Item class**, and click **Add reconciliation item**.
    - Expect an item with the pill **open**, the text **Browser would not start on first try**, the line **State left: nothing written**, and the **Done gate** listing **1 reconciliation item is unresolved**.
20. [J2.20] In **Live steps** log `J1.1`, surface `desktop`, status `pass`, note `Label wraps`; then under **Record round 2** set **Steps passed** `3`, **Steps total** `3`, **Round result** `Passed`, and click **Record round**.
    - Expect the step **Label wraps** listed, then the line **Round 2: passed** with **3 of 3 steps**.
21. [J2.21] Click **Mark done**.
    - Expect a red alert **This run cannot be marked done: 1 reconciliation item is unresolved** (HTTP 409).
22. [J2.22] Click the button **Mark item 1 reconciled** (its number is the item's id) with **Resolution note for item 1** empty. Then type `Re-ran with a fresh browser, passes` into that note and click the button again.
    - Expect first a red alert **Add a note saying how this was resolved or why it is accepted** (HTTP 400), then the pill **reconciled**, the line **Note: Re-ran with a fresh browser, passes**, and **Done gate: ready**.
23. [J2.23] Click **Mark done**.
    - Expect the text **Stage: done (Release recorder) · Status: done**. The buttons **Mark done** and **Add bug** and the forms for rounds, steps and reconciliation are gone.
24. [J2.24] Click **← All runs**.
    - Expect the run card **seed-catalog** to read **Stage done · done · 2 rounds · 0 open bugs**.

## Journey 3 — Limits: attempts, fix rounds, and a person's decision

UI path: Runs tab, Escalations tab. API: as Journey 2 plus `POST /api/release-loop/bugs/:id/decision` and `GET /api/release-loop/escalations`. MCP: `release_loop_bug_action`, `release_loop_list_escalations`. The definition now allows 2 fix rounds and 2 fix attempts per bug.

1. [J3.1] In **Start a run** type `2030-04-01-garden-gate` into **Release key**, `water-planner` into **Feature key**, and click **Start run**.
   - Expect the heading **water-planner · 2030-04-01-garden-gate** and **Fix rounds used: 0 of 2**.
2. [J3.2] Click **Move to integrate**, **Move to validate**, then with **Round result** `Failed` and every other round field untouched click **Record round**. Click **Move to triage**. Type `Watering plan blank` into **Bug title** and click **Add bug**.
   - Expect the line **Round 1: failed** with **steps not recorded** and **console errors 0**, **Stage: triage**, and a bug **water-planner-B1**.
3. [J3.3] Click **Move to fix**, **Start fix for water-planner-B1**, type `Seeded default plan` into **Fix summary for water-planner-B1**, click **Record fix for water-planner-B1**, then **Move to integrate_fix** and **Move to validate**.
   - Expect **Fix rounds used: 1 of 2**, **Fix attempts: 1 of 2** and **Stage: validate**.
4. [J3.4] Type `Plan still blank` into **Re-test note for water-planner-B1** and click **Re-test failed for water-planner-B1**.
   - Expect the bug status **recurred** and **Fix attempts: 1 of 2**.
5. [J3.5] With **Round result** `Failed` click **Record round**, then **Move to triage**, **Move to fix**, **Start fix for water-planner-B1**, type `Loaded plan from catalog` into the fix summary, click **Record fix for water-planner-B1**, then **Move to integrate_fix** and **Move to validate**.
   - Expect **Round 2: failed**, **Fix rounds used: 2 of 2**, **Fix attempts: 2 of 2** and **Stage: validate**.
6. [J3.6] Type `Still blank` into **Re-test note for water-planner-B1** and click **Re-test failed for water-planner-B1**. Then with **Round result** `Failed` click **Record round** and **Move to triage**.
   - Expect the bug status **needs_human**, the text **This bug used all 2 fix attempts and left the automated loop.**, no button **Start fix for water-planner-B1**, **Round 3: failed**, and **Stage: triage**.
7. [J3.7] Click the tab **Escalations**.
   - Expect a card with **water-planner-B1**, the line **water-planner · 2030-04-01-garden-gate** and the text **This bug used all 2 fix attempts**.
8. [J3.8] Type `Owner agrees to one more go` into **Decision note for water-planner-B1** and click **Give another round of attempts to water-planner-B1**.
   - Expect the text **Nothing is waiting for a person or the owner.**
9. [J3.9] Click the tab **Runs**, click **Open run water-planner**, note **Fix attempts: 0 of 2** on the bug, and click **Move to fix**.
   - Expect the text **Still failing after 2 fix rounds: recorded as not passed with its open items, never as done.**, the text **Stage: triage (Triage agent) · Status: not_passed**, and no **Move to fix** button.
10. [J3.10] Click **← All runs**.
    - Expect the run card **water-planner** to read **Stage triage · not_passed · 3 rounds · 1 open bug**.

## Journey 4 — A business definition goes to the owner

UI path: Runs tab, Escalations tab. API: `POST /api/release-loop/bugs/:id/answer` and `/scope`. MCP: `release_loop_bug_action`.

1. [J4.1] In **Start a run** type `2030-04-01-garden-gate` into **Release key**, `compost-notes` into **Feature key**, click **Start run**, then **Move to integrate**, **Move to validate**, choose **Round result** `Failed`, click **Record round**, and **Move to triage**.
   - Expect the heading **compost-notes · 2030-04-01-garden-gate**, **Round 1: failed** and **Stage: triage**.
2. [J4.2] Type `Which unit for bin size` into **Bug title**, choose `needs_business_definition` in **Bug class**, and click **Add bug**.
   - Expect a field **Exact question for the owner** to appear when the class is chosen, and after the click a red alert **A needs_business_definition item must carry the exact question for the owner** (HTTP 400).
3. [J4.3] Type `Should bin size be shown in litres or gallons?` into **Exact question for the owner** and click **Add bug**.
   - Expect a bug **compost-notes-B1** with status **needs_business_definition**, the line **Question for the owner: Should bin size be shown in litres or gallons?**, **1 bug is not closed** in the **Done gate**, and no button **Start fix for compost-notes-B1**.
4. [J4.4] Click **Move to escalate**.
   - Expect **Stage: escalate (Release recorder)** and a button **Move to triage**.
5. [J4.5] Click the tab **Escalations**, type `Litres` into **Owner's answer for compost-notes-B1**, and click **Record owner's answer for compost-notes-B1**.
   - Before the click expect the card for **compost-notes-B1** with the question text. After it expect **Nothing is waiting for a person or the owner.**
6. [J4.6] Click the tab **Runs**, click **Open run compost-notes**, then **Move to triage**.
   - Expect the line **Owner's answer: Litres** on **compost-notes-B1** and **Stage: triage**.
7. [J4.7] Click **Scope decision for compost-notes-B1**, choose `process_note` in **Scope for compost-notes-B1**, and click **Set scope for compost-notes-B1** with **Evidence for compost-notes-B1** empty. Then type `Wording problem in the guide, not the product` into the evidence field and click it again.
   - Expect first a red alert beginning **Scope decisions carry evidence** (HTTP 400), then the bug status **process_note**. The **Done gate** stays **blocked** (no validation round has passed).

## Journey 5 — Release Intelligence shows the same runs

UI path: Journeys -> Release Intelligence -> Releases. API: `GET /api/release-intelligence/releases`. MCP: the release-intelligence tools, when the registry exists.

1. [J5.1] Click **← Back to World**, click the tab **Journeys**, click **Open configuration** on the card **Release Intelligence**, click the tab **Releases**.
   - Expect a row for **2030-04-01-garden-gate** with **1 of 3** features passed.
2. [J5.2] Click the button **Open 2030-04-01-garden-gate**.
   - Expect **← All releases**, the features **compost-notes**, **seed-catalog** and **water-planner**, for seed-catalog the lines **Round 1: fail (2/3 steps)**, **Round 2: pass (3/3 steps)**, **Passed in round 2** and **seed-catalog-B1 (round 1): Wrapped the label**, for water-planner **Round 3: fail** and **Not passed**, a line **Round 2 passed**, and in the reconciliation history a line containing **loop_bug: 3:compost-notes-B1**.

## Journey 6 — Live steps arrive from another interface

UI path: run detail -> Live steps. API: `POST /api/release-loop/runs/4/steps`. MCP: `release_loop_log_step`. Command steps need a shell.

1. [J6.1] Open World -> Journeys -> **Release loop** -> **Open configuration**, click the tab **Runs**, start a run with **Release key** `2030-04-01-garden-gate` and **Feature key** `tide-chart`, then click **Move to integrate** and **Move to validate**.
   - Expect the heading **tide-chart · 2030-04-01-garden-gate**, **Stage: validate** and, in **Live steps**, the text **No steps logged yet.**
2. [J6.2] Run `curl` with the signed-in admin's session cookie: POST `/api/release-loop/runs/4/steps` with the JSON `{"stepId":"J9.9","surface":"api","status":"info","note":"Logged from the API"}` (run 4 is tide-chart on a fresh database).
   - Expect HTTP status `201`.
3. [J6.3] Without reloading, watch the card **Live steps** for up to 8 seconds.
   - Expect a step with the note **Logged from the API** and the text **round 1 · api**.

## Edge cases

- [E.1] **Layout, both passes**: after Journey 1, Journey 2 and Journey 4 the document has no horizontal scroll (`document.documentElement.scrollWidth` is not more than `window.innerWidth`) and every visible button, select, input, textarea and summary is at least 44px tall, including **← Back to World**.
- [E.2] **Starting the same feature twice** in one release: on **Runs** type `2030-04-01-garden-gate` and `seed-catalog` and click **Start run** (after Journey 6). Expect a red alert **A run for feature "seed-catalog" already exists in release 2030-04-01-garden-gate** (HTTP 409) and no new run card.
- [E.3] **Reload keeps everything**: reopen the screen from World. Expect run cards **Open run seed-catalog**, **Open run water-planner**, **Open run compost-notes** and **Open run tide-chart**.
- [E.4] **Reset**: on **Definition** with **Definition version 5** shown, type `Back to shipped` into **Change note** and click **Reset to shipped definition**. Expect **Definition version 6**, the text **Source: shipped content restored by a reset (the shipped file is version 4)**, a history entry with the note **Back to shipped**, **Max fix rounds** showing `4`, and no **Reset to shipped definition** button.
- [E.5] Run `curl` to log in (`POST /api/auth/login` with the admin email and password, saving cookies) and then `GET /api/release-loop/definition` with those cookies. Expect HTTP 200 and JSON whose `definition.version` equals the number the Definition tab shows and whose `agents` list has 9 entries.
- [E.6] Run `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:<port>/api/release-loop/runs` with no cookie. It prints `401`.
- [E.7] Run `curl` with the admin cookie: POST `/api/release-loop/runs/2/transition` with `{"to":"validate"}` (run 2 is water-planner, recorded as not passed). Expect HTTP 409 and the error **This run is not passed and cannot move**: the API enforces the same gate as the screen.
- [E.8] Run `ls server/lib/mcpToolRegistry.js`. At this baseline it prints `ls: cannot access 'server/lib/mcpToolRegistry.js': No such file or directory`. Record it as an MCP gap assigned to the `platform-mcp` feature (`definition.json` `interfaceParity`); it does not fail this feature. The server functions the tools will call are the exports of `server/lib/releaseLoopPlatform.js` and `server/lib/releaseLoopDefinition.js`.
- [E.9] Run `psql` against the test database: `select key from agent_definitions where pipeline='release_loop' order by id` prints nine rows, starting `release_builder` and ending `release_scope_reviewer`.
