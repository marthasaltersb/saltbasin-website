# Training spec — Definition Studio: compose modules and products on a configurable process canvas

Audience: a test agent driving a real browser as an administrator and as a member, plus a terminal for the
API and MCP steps. Every step says exactly what to do and what you should see. All data is fictional
(shape **Hand-off**, field **Evidence required**, level name **Journey Flow**, product **Harbor Onboarding Kit**).

Version 1 · 2026-10-10 · every journey names its UI path, API route and MCP tool on its `Interfaces:` line
(the MCP tools call the same functions as the routes) · change spec: `docs/changes/definition-studio.md`

## Where things are

- **World Shell**: `/world`. Top bar tabs **World**, **Journeys**, **Classic Tools**. **Journeys** lists cards;
  administrators see a **Definition Studio** card. Clicking it opens the panel full screen with
  **← Back to World**.
- **Definition Studio** panel (heading **Definition Studio**): a **Working on** dropdown (group
  **Salt Basin modules**: **Personal Brand Website**, **Resume Output Creator (Career Master)**; group
  **Products composed here** once a product exists), a **+ New product** button, a line
  "Module · API name …" or "Product PRODUCT-L0-… · API name …", and tabs **Canvas**, **Studio settings**,
  **History**.
- **Canvas** tab: **Open full screen** link and the canvas page in a frame. In the canvas: a header whose title
  is the module or product name and whose small line reads "DEFINITION STUDIO · MODULE · <api name>" (or
  "… · PRODUCT PRODUCT-L0-NNN · <api name>"); toolbars; the **Add** shape bar; **Do** buttons **Select / Move**,
  **Connect**, **⚙ Configure**, **Delete**; a status line; a scenario banner; the canvas; and a rounded save
  state at the bottom left: "Connected to Salt Basin · <name>", "Saving…", "Saved to Salt Basin · version N",
  or a red "Not saved — <reason> …".
- **Studio settings** tab: sections **Levels**, **Shapes on the canvas**, **Step specification fields**,
  **Execution types**, **Concurrency types**, **Pain root causes**, **Geometry sizes**, then the save bar
  (**Change note (required)**, **Save settings**, **Discard changes**) and **Settings history**. Every item
  shows a grey line "<ID> · API name <api name>".
- **History** tab: one card per saved document ("Working canvas (autosave)", "Template", …) with a
  **Versions** button; each version line has **Restore this version** unless it is current.
- Phone width: the same panel at 390px wide, one column, no sideways scrolling.

Fixed test constraints that apply to every step: fresh database; test accounts from
`scripts/create-test-member.mjs`: administrator **betsy@test.local** and member **member@test.local**, both
password `TestPass!2345`. Sign in **once per account and reuse the session** — sign-in is limited to 10 attempts
per 15 minutes per address. Wait up to 15 seconds for any expected text. `ANTHROPIC_API_KEY` is **not** set.
Fonts and the spreadsheet library come from public CDNs; if the test machine blocks them, the page still works.

## Preconditions

1. [P.1] ADMIN WINDOW: sign in as betsy@test.local and open `/world`. MEMBER WINDOW: sign in as
   member@test.local and open `/world`. Expect both land in the World Shell.
2. [P.2] In both windows click **Journeys**. Expect the ADMIN WINDOW shows a **Definition Studio** card and the
   MEMBER WINDOW does not.
3. [P.3] ADMIN WINDOW: click **Definition Studio**. Expect the heading **Definition Studio**, the **Working on**
   dropdown, **+ New product**, and the tabs **Canvas**, **Studio settings**, **History**.

## Journey 1 — Compose the Career module on the canvas, and it is saved to the platform

Interfaces: UI World Shell > Journeys > Definition Studio > Canvas. API `GET /api/definition-studio/canvas`,
`GET|PUT /api/definition-studio/document`. MCP tools `definition_studio_document_read`,
`definition_studio_document_save`.

1. [J1.1] In **Working on** choose **Resume Output Creator (Career Master)**. Expect the line under the dropdown
   reads "Module · API name resume_career · …" and the canvas title reads **Resume Output Creator (Career
   Master)** with the small line "DEFINITION STUDIO · MODULE · RESUME_CAREER" (letter case may follow the
   page style).
2. [J1.2] Read the **Add** shape bar. Expect exactly seven buttons in this order: **Step**, **Sub-process**,
   **Decision**, **Parallel gate**, **Event**, **Data object**, **Start / end**. Expect the toolbar button
   **🏛 L1 · Industry** and the scenario dropdown option **Base (L2 · Flow — consistent for every scenario)**.
3. [J1.3] Click **Start / end**, then click an empty spot on the canvas. Click **Step**, click a spot to its
   right. Click **Decision**, click a spot further right. Expect three shapes labelled **Start**, **New step**
   and **Decision?**.
4. [J1.4] Click **Connect**, click **Start**, then click **New step**. Expect an arrow from Start to New step.
5. [J1.5] Within 15 seconds expect the save state reads "Saved to Salt Basin · version N" (any N ≥ 1).
6. [J1.6] Reload the browser page, open **Definition Studio** again if needed, and choose **Resume Output Creator
   (Career Master)**. Expect the same three shapes and the arrow are back.
7. [J1.7] Terminal (admin session cookie): `GET /api/definition-studio/document?workspace=module:resume_career&key=flow:default`.
   Expect HTTP 200 and a JSON `document` whose `value` text contains `"New step"`.

## Journey 2 — Configure the Studio itself: rename a level, add a shape, switch one off

Interfaces: UI World Shell > Journeys > Definition Studio > Studio settings. API `GET|PUT /api/definition-studio/config`.
MCP tools `definition_studio_config`, `definition_studio_config_save`.

1. [J2.1] Open **Studio settings**. Expect the note "…Version 1 (platform defaults)." and, under **Levels**, three
   cards **L1 name**, **L2 name**, **L3 name** with the values **Industry**, **Flow**, **Scenario** and the grey
   lines "FLOW-L1 · API name industry", "FLOW-L2 · API name flow", "FLOW-L3 · API name scenario".
2. [J2.2] Change **L2 name** to **Journey Flow**. Under **Shapes on the canvas** click **+ Add shape**. In the new
   card set **Name** to **Hand-off**, **Default label** to **Hand-off**, leave **Geometry** **step**. Expect its
   grey line reads "FLOW-L2-SHAPE-008 · API name hand_off (fixed once saved)".
3. [J2.3] Click **Save settings** with the change note empty. Expect a red message "Add a change note saying what
   changed and why, then save again." and nothing saved.
4. [J2.4] Type the note **Add hand-off shape (training)** and click **Save settings**. Expect a confirmation
   "Studio settings saved as version 2. The canvas now uses them.", the note now reads "Version 2", and
   **Settings history** shows "Version 2" with the note.
5. [J2.5] Open **Canvas** (Career module). Expect the shape bar now ends with **Hand-off**, the scenario dropdown
   option reads **Base (L2 · Journey Flow — consistent for every scenario)**. Click **Hand-off**, click an empty
   spot. Expect a shape labelled **Hand-off** with a small tag **HAND-OFF** under it.
6. [J2.6] Back in **Studio settings**, on the **Sub-process** shape click the **On** checkbox so it reads
   **Off (kept for saved flows)**, note **Retire sub-process (training)**, **Save settings**. Expect version 3.
   On **Canvas** expect **Sub-process** is gone from the shape bar and the shapes from Journey 1 still show.
7. [J2.7] Terminal: send `PUT /api/definition-studio/config` with the current config from
   `GET /api/definition-studio/config` minus the **Decision** shape, note "remove decision". Expect HTTP 400 and
   an `error` containing "can't be removed — switch it off instead".

## Journey 3 — Step specification uses the configured fields

Interfaces: UI World Shell > Journeys > Definition Studio > Studio settings, Canvas > ⚙ Configure.
API `PUT /api/definition-studio/config`, `PUT /api/definition-studio/document`. MCP tool `definition_studio_config_save`.

1. [J3.1] **Studio settings** → in section **Actors & data flow** click **+ Add field to "Actors & data flow"**. Set
   **Field name** to **Evidence required**, **Hint** to **What proves this step happened**. Expect the grey line
   "FLOW-L2-FIELD-023 · API name evidence_required (fixed once saved)". Note **Add evidence field (training)**,
   **Save settings**.
2. [J3.2] **Canvas** (Career module): click **⚙ Configure**, click the **New step** shape. Expect the step settings
   open and include a field **Evidence required** with the hint "What proves this step happened".
3. [J3.3] Type **Signed intake form** in **Evidence required**, click **Save specification**. Expect "Saved." in the
   step settings. Close them, reload the page, reopen the Career canvas, **⚙ Configure** the same step. Expect
   **Evidence required** still reads **Signed intake form**.

## Journey 4 — Create a new product and compose it

Interfaces: UI World Shell > Journeys > Definition Studio (+ New product). API `POST /api/definition-studio/products`,
`GET /api/definition-studio/workspaces`. MCP tools `definition_studio_product_create`, `definition_studio_workspaces`.

1. [J4.1] Click **+ New product**. Type **Harbor Onboarding Kit** in **Name**. Expect the line "API name will be
   harbor_onboarding_kit". Click **Create product**.
2. [J4.2] Expect a confirmation "Created Harbor Onboarding Kit (PRODUCT-L0-001). You're now composing it.", the
   dropdown shows the group **Products composed here** with **Harbor Onboarding Kit · PRODUCT-L0-001** selected,
   and the canvas small line reads "DEFINITION STUDIO · PRODUCT PRODUCT-L0-001 · HARBOR_ONBOARDING_KIT".
3. [J4.3] Place one **Step** on this product's canvas. Switch **Working on** back to the Career module. Expect the
   Career canvas still shows its own shapes and not the product's.
4. [J4.4] Click **+ New product** again with the same name **Harbor Onboarding Kit**, **Create product**. Expect a
   red message "A module or product with the API name "harbor_onboarding_kit" already exists. Choose a
   different name."

## Journey 5 — History: versions and restore

Interfaces: UI World Shell > Journeys > Definition Studio > History. API `GET /api/definition-studio/documents`,
`GET /api/definition-studio/document/versions`, `POST /api/definition-studio/document/restore`.
MCP tools `definition_studio_documents_list`, `definition_studio_document_versions`, `definition_studio_document_restore`.

1. [J5.1] Choose the Career module, open **History**. Expect a card **Working canvas (autosave)** with the line
   "flow:default · version N · <date> · betsy@test.local".
2. [J5.2] Terminal: `PUT /api/definition-studio/document` with `{"workspace":"module:resume_career","key":"flow:default","value":<the current value>,"note":"Training save point"}`.
   Click **Versions** (or reopen **History**). Expect at least two version lines, the newest marked "(current)".
3. [J5.3] On an older version click **Restore this version**. Expect a confirmation "Version K restored as version M.
   Reopen the canvas to see it." and a new current version whose note reads "Restored version K".

## Journey 6 — Drafting is honest when AI is not set up

Interfaces: UI World Shell > Journeys > Definition Studio > Canvas > ⚙ Configure > ✦ Ask agent to draft.
API `POST /api/definition-studio/agent-draft`. MCP: none (an agent drafts itself and saves with `definition_studio_document_save`).

1. [J6.1] On the Career canvas click **⚙ Configure**, click **New step**, click **✦ Ask agent to draft**. Expect the
   status next to the button reads "AI drafting is not set up on this server yet (no ANTHROPIC_API_KEY). You can
   still fill in every field by hand." and no field changed.

## Journey 7 — An AI agent composes through MCP

Interfaces: UI World Shell > Journeys > Connected Agents (token). MCP tools `definition_studio_workspaces`,
`definition_studio_document_read`, `definition_studio_document_save`.

1. [J7.1] ADMIN WINDOW: **Journeys** → **Connected Agents**, type **Studio probe**, tick **definitions.read** and
   **definitions.write**, **Create token**. Keep it as TOKEN.
2. [J7.2] `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN> list`. Expect the list includes
   `definition_studio_workspaces` and `definition_studio_document_save`.
3. [J7.3] `… call definition_studio_workspaces '{}'`. Expect `isError: false` and workspaces including
   `module:resume_career` and `product:harbor_onboarding_kit`.
4. [J7.4] `… call definition_studio_document_read '{"workspace":"module:resume_career","key":"flow:default"}'`.
   Expect `isError: false` and the same value the website shows.

## Edge cases

- [E.1] MEMBER WINDOW (terminal with the member's cookie): `GET /api/definition-studio/workspaces`. Expect `403`.
- [E.2] No cookie: `GET /api/definition-studio/canvas?workspace=module:resume_career`. Expect `401`.
- [E.3] Admin: `GET /api/definition-studio/documents?workspace=module:does_not_exist`. Expect `404` with "That module
  does not exist. Pick a module or product from the list."
- [E.4] Admin: `PUT /api/definition-studio/document` with a `value` of 3.6 MB of text. Expect `413` with "That document
  is larger than 3.5 MB and was not saved."
- [E.5] Phone, 390px wide: open **Definition Studio**, then **Studio settings**. Expect no sideways scrolling; with no
  unsaved changes the save bar sits at the end of the page (it does not float over the content).
