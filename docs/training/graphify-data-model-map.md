# Training spec — Graphify data model map: knowledge-graph visuals of the platform's data model, inside World Shell

Audience: a test agent driving a real browser as an administrator and as a member, plus a shell for the command steps. All data is fictional: the map is built from a fresh database with seed rows only, and every table name the steps use (`career_jobs`, `users`, `leads`) is a platform table, not member data. Everything in the browser happens inside the World Shell (`/world`); no admin URL is typed.

Version 1 · 2026-10-10 · every journey names its UI path, API route and MCP tool on its `Interfaces:` line (the MCP tools call the same functions as the routes) · change spec: `docs/changes/graphify-data-model-map.md`

## Where things are

- **World Shell**: `/world`. Top bar tabs **World**, **Journeys**, **Classic Tools**. Tab **Journeys** is a list of cards. The card **Data model map** (subtitle "Tables, relations and usage (Graphify)") is shown to administrators only; it opens the panel full screen with **← Back to World** at the top left and the breadcrumb **Sun › Journeys › Data model map**.
- **Data model map** panel (heading **Data model map**): a description line, a stamp line, four stat tiles, tabs **Map** and **Settings**.
- **Map** tab, top to bottom: a search box (placeholder "Search tables, columns or routes") with buttons **Search** and **Clear**; a row of domain buttons (**All domains**, then one per domain with its table count); the **crystal view** (a dark 3D scene with the text "Drag to turn. Tap a gem to open its table." and a button **Reset view**; it is exactly what the list below shows, drawn as gems); then two columns: the **table list** (tables grouped under their domain heading, each a button with its name and "<n> cols") and the **table detail** (empty text until a table is picked).
- **Table detail**: heading **Table: <name>**, a coloured pill with the domain name, a line "<n> columns, primary key <columns>", the button **Use as a data object**, then the sections **Columns** (a table with columns Column, Type, Links to, and a **Use field** button per row), **References (n)**, **Referenced by (n)** (each a button naming a table), **Used by routes (n)** and **Used by server modules (n)**.
- **Settings** tab: one block per domain (**Domain name**, **Colour**, **Table-name prefixes (comma separated)**, **Exact table names (comma separated)**, **Remove domain <name>**), buttons **Add a domain**, **Save grouping**, **Restore default grouping**, and a field **Why you are changing it (optional)**.
- Phone width: the same screens at 390px wide; every column becomes one column and the page never scrolls sideways.
- The committed catalog is `docs/data-model/catalog.json` (stamp: `graphify.version`, `generatedFromCommit`; counts under `counts`); `docs/data-model/REPORT.md` lists the same counts and the domains. Where a step says "the number in REPORT.md" read it from there.

Fixed test constraints that apply to every step: fresh database; test accounts from `scripts/create-test-member.mjs`: administrator **admin@test.local** and member **member@test.local** (display name **Test Member**), password `TestPass!2345` for the member and the environment's `ADMIN_INITIAL_PASSWORD` (written `<ADMIN_PASSWORD>`) for the administrator, terms accepted; production build served at `<API_BASE>`; the committed `docs/data-model/` files as they are in the commit under test (no regeneration except in Journey 7). Use two browser windows signed in at the same time: **ADMIN WINDOW** and **MEMBER WINDOW**. Browser steps are run on desktop (1280px wide) and again at 390px wide (Journey 8 lists the phone-specific checks); command steps run once.

## Preconditions

1. [P.1] ADMIN WINDOW: sign in as admin@test.local at `/login`, open `/world`. Expect the World Shell with the top bar **World / Journeys / Classic Tools**.
2. [P.2] MEMBER WINDOW: sign in as member@test.local at `/login`, open `/world`. Expect the World Shell with the top bar **World / Journeys / Classic Tools**.
3. [P.3] In a shell, from the repository root, run `ls docs/data-model`. Expect exactly four names: `REPORT.md`, `catalog.json`, `graph.json`, `view.html`.

## Journey 1 — Open the map and read its stamp

Interfaces: UI World Shell > Journeys > Data model map. API `GET /api/data-model/catalog`. MCP tool `data_model_catalog_read`.

1. [J1.1] ADMIN WINDOW: click **Journeys**, then the card **Data model map**. Expect the panel heading **Data model map**, the breadcrumb **Sun › Journeys › Data model map**, the tabs **Map** (selected) and **Settings**, and a red-free page (no alert box).
2. [J1.2] Read the stamp line. Expect it to read "Graphify 0.9.84 - generated from commit <C> on <D> - AI pass: none" where <C> is the first nine characters of `generatedFromCommit` in `docs/data-model/catalog.json` and <D> is the first ten characters of its `generatedAt`.
3. [J1.3] Read the four stat tiles. Expect them in this order with these labels: **tables**, **columns**, **foreign keys**, **domains**, and numbers equal to `counts.tables`, `counts.columns` and `counts.foreignKeys` in `catalog.json`, and `10` for domains.
4. [J1.4] Read the domain buttons. Expect first **All domains** (selected), then exactly ten buttons in this order: **Career (n)**, **Journey and rods (n)**, **Release and testing (n)**, **Render bindings and ports (n)**, **Agents (n)**, **Members and identity (n)**, **Site and content (n)**, **Leads, commerce and proposals (n)**, **Finance and metrics (n)**, **Audit and system (n)**, with each n equal to the number in parentheses on that domain's line in `docs/data-model/REPORT.md`.
5. [J1.5] Read the crystal view. Expect a dark panel containing a drawn canvas, the text "Drag to turn. Tap a gem to open its table." and the button **Reset view**; the panel's accessible name starts "Data model crystal view".
6. [J1.6] Read the table list. Expect one group heading per domain, each reading "<Domain name> (n)" with the same n as its button, and under **Career (n)** the buttons `career_jobs`, `career_skills` and `career_tools` (each followed by "<n> cols"). Expect the table detail area to read "Pick a table from the list, or tap a gem, to see its columns, relations and the routes and modules that use it."

## Journey 2 — Filter, search and read one table

Interfaces: UI World Shell > Data model map > Map (domain buttons, Search, table list, table detail). API `GET /api/data-model/search?q=`, `GET /api/data-model/tables/:name`. MCP tools `data_model_search`, `data_model_table_read`.

1. [J2.1] Click the domain button **Career (n)** (n as in [J1.4]). Expect it becomes selected (**All domains** is no longer selected), the table list shows only the one heading "Career (n)", and `career_jobs` is in it; no heading "Agents" is shown.
2. [J2.2] Click **All domains**. Expect all ten group headings are back in the table list.
3. [J2.3] Type `career_jobs` into the search box and click **Search**. Expect a note reading `1 match for "career_jobs".` with exactly one button **Table: career_jobs**, and the table list shows only `career_jobs` (under **Career (n)**).
4. [J2.4] Click **Table: career_jobs**. Expect the table detail heading **Table: career_jobs**, the pill **Career**, the line "15 columns, primary key id", and the button **Use as a data object**.
5. [J2.5] Read **Columns**. Expect a table with the header Column, Type, Links to, and 15 rows; the first row reads `id` (key), type "bigint, required"; the second row `company`, type "text, required"; the row `user_id` has type "bigint" and a button **users.id** in Links to; the last row is `bullet_variants`, type "jsonb, required".
6. [J2.6] Read the relations. Expect **References (1)** with one button **users**, and **Referenced by (0)** with the text "No table references this one."
7. [J2.7] Read the usage. Expect **Used by routes (10)** whose first line reads "/api/career server/routes/careerMaster.js, directly" and whose other nine lines end ", through a module"; expect **Used by server modules (4)** listing `server/lib/applicationPackages.js`, `server/lib/careerBound.js`, `server/lib/memberAccess.js` and `server/lib/packageReconciliation.js`.
8. [J2.8] Click the button **users.id** in the `user_id` row. Expect the heading becomes **Table: users**, the pill **Members and identity**, and **Referenced by** contains a button `career_jobs`.
9. [J2.9] Click **Clear**. Expect the search note disappears, the search box is empty and all ten domain groups are back in the table list.
10. [J2.10] Type `company` into the search box and click **Search**. Expect the note `4 matches for "company".` followed by four buttons, each starting **Column:** (for example **Column: career_jobs.company**).
11. [J2.11] Click **Clear**, type `/api/career-agents` into the search box and click **Search**. Expect the note `27 matches for "/api/career-agents".` and at most eight buttons beneath it, each starting **Route:**.
12. [J2.12] Click **Clear**, type `zzzz_nothing` and click **Search**. Expect the note `0 matches for "zzzz_nothing".` followed by the line `Nothing matches. Try part of a table name, such as "career".` and the text "No tables match the current search and domain." in the table list.

## Journey 3 — The crystal view

Interfaces: UI World Shell > Data model map > Map (crystal view). API and MCP: the same catalog as Journey 1 (`GET /api/data-model/catalog`, `data_model_catalog_read`).

1. [J3.1] Click **Clear**. In the crystal view press the mouse inside the dark panel, drag 200px to the left, release. Expect no error box on the page, the panel is still drawn (canvas visible) and no table detail opens (the detail area still reads as in [J1.6] or shows the last table you opened).
2. [J3.2] Click **Reset view**. Expect the panel stays drawn and no error box appears.
3. [J3.3] Click the domain button **Career (n)**, then the table list button `career_skills`. Expect the table detail heading **Table: career_skills**; the crystal view stays drawn (the selected gem is enlarged and white-edged: look at the panel, then click **All domains** and see the other domains' gems come back at full brightness).

## Journey 4 — Edit the domain grouping from the screen

Interfaces: UI World Shell > Data model map > Settings. API `GET /api/data-model/rules`, `PUT /api/data-model/rules`, `DELETE /api/data-model/rules`. MCP tools `data_model_rules_read`, `data_model_rules_save`.

1. [J4.1] Click the tab **Settings**. Expect the sentence "A table goes to the domain that names it exactly (an exact name beats a prefix), otherwise to the first domain whose prefix it starts with; anything else is "Other"." and, ending that paragraph, "Currently: the shipped default.", then ten domain blocks, the first with **Domain name** `Career`.
2. [J4.2] Clear the **Domain name** of the first block (leave it empty) and click **Save grouping**. Expect a red alert reading "Domain 1 has no name. Give it a name and save again." (and the same text in a red toast); nothing is saved.
3. [J4.3] Type `Career` back into that **Domain name**. In the first block's **Exact table names (comma separated)** field, which reads `output_templates`, change it to `output_templates, leads`. Type `Leads belong to the career pipeline` into **Why you are changing it (optional)** and click **Save grouping**. Expect a line "Saved. The grouping is now version 2." and the line "Currently: your saved grouping." in the explanation.
4. [J4.4] Click the tab **Map**. Expect the domain button **Career (n+1)** (one more than in [J1.4]) and **Leads, commerce and proposals (m-1)** (one fewer than in [J1.4]). Click `leads` in the table list: expect **Table: leads** with the pill **Career**.
5. [J4.5] Reload the browser page, click **Journeys**, the card **Data model map**, then the tab **Settings**. Expect "Currently: your saved grouping." and the first block's **Exact table names (comma separated)** reads `output_templates, leads` (the change survived the reload).
6. [J4.6] Click **Restore default grouping**. Expect the line "Back to the shipped default grouping." and the explanation "Currently: the shipped default." Click the tab **Map**: expect the buttons **Career (n)** and **Leads, commerce and proposals (m)** with the numbers from [J1.4], and `leads` shown under the Leads heading again.

## Journey 5 — The data-object / field picker

Interfaces: UI World Shell > Data model map > (a table) > Use as a data object / Use field. API `GET /api/data-model/picker`. MCP tool `data_model_picker`.

1. [J5.1] Search `career_jobs`, click **Search**, click **Table: career_jobs**, then click **Use as a data object**. Expect a note "Picker key: career_jobs (copied when your browser allows it). A flow builder stores this key."
2. [J5.2] In the **Columns** table click the button **Use field** in the `company` row (its accessible name is "Use career_jobs.company as a field"). Expect the note now reads "Picker key: career_jobs.company (copied when your browser allows it). A flow builder stores this key."

## Journey 6 — The same actions through the API and MCP, with the same permissions

Commands run in a shell. `<ADMIN_PASSWORD>` is the environment's `ADMIN_INITIAL_PASSWORD`. The MCP client is `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN> list | call <tool> '<json>'` (see `platform-mcp`).

1. [J6.1] ADMIN WINDOW: open **Journeys** -> **Connected Agents**, type `Data model agent` into **Token name**, tick **datamodel.read** and **datamodel.write**, click **Create token**. Expect the once-only box **Copy your token now. It will not be shown again.** with a token starting `sbpat_` (keep it as **TOKEN_D**); click **I have copied it**.
2. [J6.2] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> list`. Expect exit code 0 and exactly these lines in this order: `data_model_catalog_read`, `data_model_table_read`, `data_model_search`, `data_model_picker`, `data_model_rules_read`, `data_model_rules_save`, `6 tools`.
3. [J6.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> call data_model_table_read '{"table": "career_jobs"}'`. Expect `isError: false` and a printed `result` whose `table.columns` has 15 entries, `table.domain` `career` and `table.primaryKey` `["id"]` (the same table the website showed in [J2.4]).
4. [J6.4] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> call data_model_search '{"query": "company"}'`. Expect `isError: false` and `result.total` 4 (the number the website showed in [J2.10]).
5. [J6.5] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> call data_model_picker '{"object": "career_jobs", "query": "comp"}'`. Expect `isError: false` and a `result.fields` list with exactly one field, with `key` `career_jobs.company`, `field` `company`, `type` `text`.
6. [J6.6] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> call data_model_table_read '{"table": "no_such_table"}'`. Expect `isError: true` and an error with `status` 404, `code` `not_found` and `message` `There is no table called "no_such_table" in the data model map. Search for part of the name to find it.`
7. [J6.7] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> call data_model_rules_save '{"domains": [{"label": " ", "color": "#C4843A"}]}'`. Expect `isError: true` and an error with `status` 400 and `message` `Domain 1 has no name. Give it a name and save again.`
8. [J6.8] Run `curl -s -c admin.jar -H "Content-Type: application/json" -d '{"email":"admin@test.local","password":"<ADMIN_PASSWORD>"}' <API_BASE>/api/auth/login`, then `curl -s -b admin.jar "<API_BASE>/api/data-model/picker?domain=career"`. Expect JSON whose `objects` list has entries with `key` `career_jobs`, `career_skills` and `career_tools`, each with `domain` `career`.
9. [J6.9] Run `curl -s -o /dev/null -w "%{http_code}" <API_BASE>/api/data-model/catalog`. Expect `401` (no cookie).
10. [J6.10] MEMBER WINDOW: open **Journeys**. Expect the card **Connected Agents** and no card **Data model map**.
11. [J6.11] MEMBER WINDOW: open **Connected Agents**, type `Member probe` into **Token name**, tick **datamodel.read**, click **Create token** (keep the token as **TOKEN_M**), then run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_M> call data_model_catalog_read`. Expect `isError: true` and an error with `status` 403, `code` `forbidden` and `message` `data_model_catalog_read is for administrators only. You are signed in as a member.`
12. [J6.12] Run `curl -s -c member.jar -H "Content-Type: application/json" -d '{"email":"member@test.local","password":"TestPass!2345"}' <API_BASE>/api/auth/login`, then `curl -s -o /dev/null -w "%{http_code}" -b member.jar <API_BASE>/api/data-model/catalog`. Expect `403` (the same refusal the MCP tool gave).
13. [J6.13] ADMIN WINDOW: open **Journeys** -> **Capabilities** and find the cards **Open the data model map: domains, tables, search, one table with its columns, relations and routes**, **Data-object and field picker source for flow builders** and **Edit the domain grouping rules (admin)**. Expect each shows **Website ready**, **API ready** and **MCP ready**.
14. [J6.14] Run `node scripts/check-interface-parity.mjs`. Expect the last line `OK: the registry matches the code.`

## Journey 7 — Regenerate the map with Graphify, locally only

Commands run in a shell from the repository root; `<SCRATCH>` is a new empty directory outside the repository. The local Postgres is at `postgres://postgres@127.0.0.1:5433/postgres` (the test environment's fixed database server). Nothing in this journey changes the committed `docs/data-model/` files (the output goes to `<SCRATCH>/out`).

1. [J7.1] Run `python3 -m venv <SCRATCH>/venv` then `<SCRATCH>/venv/bin/pip install /var/tmp/sbpg/uploads/graphifyy-0.9.84-py3-none-any.whl 'psycopg[binary]' tree-sitter-sql`. Expect exit code 0 for both. Then `<SCRATCH>/venv/bin/pip list` lists `graphifyy 0.9.84`.
2. [J7.2] Run `GRAPHIFY_PYTHON=<SCRATCH>/venv/bin/python GRAPHIFY_PG_ADMIN_URL=postgres://postgres@127.0.0.1:5433/postgres node scripts/graphify-data-model.mjs --out <SCRATCH>/out`. Expect exit code 0 (about a minute) and, among the printed lines in this order: `[graphify-data-model] fresh local database sb_graphify_<number> created`; `[graphify-boot] seed: ok`, `[graphify-boot] release intelligence: ok`, `[graphify-boot] release loop: ok`, `[graphify-boot] agent runner: ok`, `[graphify-boot] session mapping: ok`, `[graphify-boot] backlog intelligence: ok`, `[graphify-boot] render bindings: ok`; a line containing `"graphifyVersion": "0.9.84"` and `"crossCheckAgrees": true`; `[graphify-data-model] wrote catalog.json, graph.json, REPORT.md, view.html to`; and last `[graphify-data-model] database sb_graphify_<number> dropped` (same number as the first).
3. [J7.3] Run `ls <SCRATCH>/out`. Expect exactly `REPORT.md`, `catalog.json`, `graph.json`, `view.html`. Run `psql -h /tmp -p 5433 -U postgres -Atc "select count(*) from pg_database where datname like 'sb_graphify_%'"`. Expect `0`.
4. [J7.4] Run `node -e "const a=require('<SCRATCH>/out/catalog.json'),b=require('./docs/data-model/catalog.json');console.log(a.graphify.version,a.graphify.llmPass,a.graphify.externalApis,a.counts.tables===b.counts.tables,a.counts.foreignKeys===b.counts.foreignKeys,a.crossCheck.agree,typeof a.generatedAt,a.generatedFromCommit.length)"`. Expect exactly `0.9.84 false false true true true string 40`.
5. [J7.5] Run `grep -o "<polygon" <SCRATCH>/out/view.html | wc -l`. Expect a number equal to `counts.tables` in `docs/data-model/catalog.json`. Run `git status --short docs/data-model`. Expect no output (the committed files are untouched).

## Journey 8 — The whole map on a phone (390px)

Interfaces: UI World Shell > Journeys > Data model map at 390px wide. API and MCP: as above.

1. [J8.1] ADMIN WINDOW at 390px wide: open `/world`, click **Journeys**, the card **Data model map**. Expect the panel, the four stat tiles wrapping into rows, and no horizontal scrolling of the page (the page is not wider than the screen).
2. [J8.2] Check tap targets. Expect the search box, **Search**, **Clear**, **All domains**, every domain button, **Reset view**, the tabs **Map** and **Settings** and every table list button each at least 44px tall.
3. [J8.3] Type `career_jobs`, tap **Search**, tap **Table: career_jobs**. Expect the table detail appears below the table list (one column) with **Table: career_jobs**, and the page still has no horizontal scroll.
4. [J8.4] Tap **Use field** in the `company` row. Expect "Picker key: career_jobs.company (copied when your browser allows it). A flow builder stores this key."
5. [J8.5] Tap the tab **Settings**, clear the first **Domain name**, tap **Save grouping**. Expect the red alert "Domain 1 has no name. Give it a name and save again." fully visible with no sideways scroll; tap **Restore default grouping** and expect "Back to the shipped default grouping."
6. [J8.6] Tap the tab **Map**, tap **Clear**, then tap the domain button **Agents (n)**. Expect the table list shows only the heading "Agents (n)" and the crystal view is still drawn at the 390px width (its panel is as wide as the page content).

## Edge cases

1. [E.1] On the **Map** tab click **Search** with the search box empty. Expect no error box, no note, and the table list unchanged (all groups).
2. [E.2] Search `CAREER_JOBS` (capitals). Expect `1 match for "CAREER_JOBS".` with the button **Table: career_jobs** (search ignores capitals).
3. [E.3] Run `GRAPHIFY_PYTHON=/nonexistent node scripts/graphify-data-model.mjs; echo "exit=$?"`. Expect output beginning `graphify-data-model: Graphify is not installed, so the data model map cannot be regenerated.` with the lines `python3 -m venv .graphify-venv` and `.graphify-venv/bin/pip install "graphifyy[postgres]==0.9.84" tree-sitter-sql`, and the last line `exit=2`; `git status --short docs/data-model` prints nothing (no half-written files).
4. [E.4] Run `GRAPHIFY_PG_ADMIN_URL=postgres://u@db.example.com/postgres node scripts/graphify-data-model.mjs; echo "exit=$?"`. Expect `graphify-data-model: Refusing to run: the database host "db.example.com" is not local. The data model map is built only from a fresh local database, never from a hosted or production one.` and the last line `exit=2` (a non-local database is refused before anything else happens).
5. [E.5] On the **Settings** tab click **Add a domain**, leave **New domain** as it is and click **Save grouping**, then open the **Map** tab. Expect "Saved. The grouping is now version 2." and no button for **New domain** in the domain row (a domain with no tables is not shown). Click **Settings**, **Restore default grouping** to return to the default.
6. [E.6] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_D> call data_model_rules_save '{"reset": true}'`. Expect `isError: false` and a `result` with `source` `default` (the saved grouping is removed; the Settings tab then reads "Currently: the shipped default.").
