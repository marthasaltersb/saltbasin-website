# Training spec — Journey flow to experience: structured bindings, experience mapping, and a journey the platform runs

Audience: a test agent driving a real browser as a member and as an administrator (two windows), plus a few command-line steps. Every step says exactly what to do and what you should see. All data is fictional (flows **Seed Shop Orders** and **Pilot Check**; a shop selling garden seed packets). Everything happens inside the World Shell (`/world`); no admin URL is typed.

Version 1 · 2026-10-11 · every journey names its UI path, API route and MCP tool on its `Interfaces:` line (the MCP tools call the same functions as the routes) · change spec: `docs/changes/journey-flow-experience-mapping.md` · builds on `docs/training/journey-flow-studio.md` (baseline v1): the editor basics (Add buttons, Connect, Save draft, Publish) are described there and are not repeated.

## Where things are

- **World Shell**: `/world`. Top bar tabs **World**, **Journeys**, **Classic Tools**. **Journeys** lists cards; **Journey Flow Studio** opens the studio. **Connected Agents** is another card there.
- **Studio home**: tabs **Flows**, **Templates** and, for administrators only, **Settings**. A pale blue **confirmation line** shows the result of your last action; a red box (role alert) shows a plain-words error. **Your flows**: one button per flow with a line `Version n · draft|published`. An administrator also sees every member's flows here.
- **Flow editor** buttons (top row): **Save draft**, **Undo**, **Redo**, **Publish**, **Journey**, **History**, **Export**, **Save as template**. Below: **Current state** / **Future state**, **Scenario**, **Lanes**, the Add buttons, **Select**, **Connect**, **Delete mode**. **Steps and connectors** lists the flow as buttons: `Step: <label>` per step and, under it, `→ <target>` (plus ` (<path label>)`) per connector. Tapping an entry selects it and opens the **Inspector**.
- **Step panel** (heading `Step: <label>`): the group names (fieldset legends) now include **Experience binding** and **Structured bindings**. **Extension fields** is not shown until an administrator adds a field to it.
  - **Experience binding** holds **Scene or static asset**, **Animation or interaction**, **Destination link** (text boxes), and the lists **World Shell layer**, **Crystal variant**, **Interaction kind** (each starts at **Not set**).
  - **Structured bindings** holds, in this order: **Variants this step belongs to**, **Actors (roles or profiles)**, **Platform capabilities**, **System of record (data port)** (one list), **Action authority (permission or licence)**, **Data this step reads**, **Data this step writes**. A "many" binding shows its picks as lines with a **Remove** button each (or **Nothing picked.**) and an **Add…** list under them. Picking in the **Add…** list adds the pick at once. **Data this step reads / writes** use two lists instead: `<name>: data object` then `<name>: field`; picking the field adds `table.column`.
  - The existing text fields **Gate key**, **System name**, **System authority**, **Actors involved**, **Capabilities** (Authority & system / Actors & data flow) still exist as notes; the structured ones above are what the journey is generated from, and **Gate key** is the key of a gate.
- **Connector panel** (heading `Connector: <from> → <to>`): after **Branch parameters** there is the group **Branch condition**: the line `No data field picked.` (or `Data field: table.column`), `Condition: data object`, `Condition: field`, `Condition: operator` (options **equals**, **does not equal**, **is greater than**, **is at least**, **is less than**, **is at most**, **is one of (comma separated)**, **is empty**, **is filled in**), `Condition: value` (only for operators that compare), and **Clear condition**.
- **Journey panel** (button **Journey**, heading **Journey**): buttons **Preview published version** and **Preview saved draft**; then, for the preview shown: the line `Preview of published version n.` or `Preview of saved draft version n.` with a pill (`no problems`, `n warning(s)` or `n problem(s) block activation`), the findings, the list **Variant**, **Generated user journey** (numbered steps), **Gates**, **Experience map** (a table, one row per step, one column per channel, each cell `mapped` + the value, `not set`, `not mapped` or `invalid` + the value), the card **Impact of activating** with **Note (optional)** and **Approve and activate**, and under **Active journey** either a line saying the flow is not active or the read-back with **Start a test journey**.
- **Settings** (administrators): the cards **Shape types**, **Step fields**, **Checks**, **Option lists for structured bindings**, **Experience channels**, **Who can do what**, **Save**. **Who can do what** has a new row **Activate a published flow as a journey the platform runs** (admin ticked by default, member not).
- Phone width: the same screens at 390px wide, one column; every control at least 44px tall; the page never scrolls sideways (the Experience map table scrolls inside its own box).

Fixed test constraints that apply to every step: fresh database; accounts from `scripts/create-test-member.mjs`: member **member@test.local** (display name **Test Member**, password `TestPass!2345`) and the administrator **admin@test.local** (seeded admin password), terms accepted. Two browser windows (MEMBER WINDOW, ADMIN WINDOW). Steps run in order; a flow made in one journey is reused later. Expected non-2xx responses (anything else is a failure): `409` on `PUT /api/flow-studio/experience-channels` in J8.1 and J8.4 (the impact preview before approving); `409` on `GET /api/flow-studio/flows/<id>/journey-preview?source=published` in J4.2; the command-line steps in Journey 9. Font/CDN requests may fail offline and `favicon.ico` may 404; ignore those. Flow ids in a fresh database are small numbers; where a step prints one it says `<ID>`.

## Preconditions

1. [P.1] MEMBER WINDOW: sign in as member@test.local and open `/world`. Expect the World Shell with the tabs **World**, **Journeys**, **Classic Tools**.
2. [P.2] MEMBER WINDOW: click **Journeys**, then **Journey Flow Studio**. Expect the heading **Journey Flow Studio**, the tabs **Flows** and **Templates** (no **Settings**) and the text **No flows yet. Create one above, or start from a template.**
3. [P.3] ADMIN WINDOW: sign in as the administrator, open `/world`, **Journeys**, **Journey Flow Studio**. Expect the tabs **Flows**, **Templates**, **Settings**. (Do nothing else yet.)

## Journey 1 — Structured bindings on a step

Interfaces: UI Journey Flow Studio > (flow) > Future state > (step) > Structured bindings. API `GET /api/flow-studio/catalogs`, `GET /api/flow-studio/catalogs/data-objects`, `GET /api/flow-studio/catalogs/data-fields?object=<table>`, `PUT /api/flow-studio/flows/:id`. MCP tools `flow_journey_catalogs_read`, `flow_studio_flow_save`.

1. [J1.1] MEMBER WINDOW: type **Seed Shop Orders** in **New flow name**, choose **Order to delivery** in **Start from**, click **Create flow**. Expect the confirmation line `Flow "Seed Shop Orders" created` and the editor.
2. [J1.2] Click **Future state**, then tap `Step: Check live stock` in **Steps and connectors**. Expect the Inspector heading `Step: Check live stock`, the group names to include **Experience binding** and **Structured bindings**, and no group called **Extension fields**.
3. [J1.3] In **Structured bindings**, in the **Add…** list under **Actors (roles or profiles)** choose **Platform agent**. Expect that group to show a line `Platform agent` with a **Remove** button.
4. [J1.4] In **System of record (data port)** choose **Release tracker**. Expect the list to read **Release tracker**.
5. [J1.5] In the **Add…** list under **Platform capabilities** choose **Preview the impact and publish a flow**. Expect that line with a **Remove** button under **Platform capabilities**.
6. [J1.6] Under **Data this step reads**: choose `career_jobs (15)` in **Data this step reads: data object**, then `title (text)` in **Data this step reads: field**. Expect the line `career_jobs.title` with a **Remove** button.
7. [J1.7] In the **Add…** list under **Action authority (permission or licence)** choose **flows.publish**. Expect the line `flows.publish`.
8. [J1.8] Under **Data this step writes**: choose `career_jobs (15)` then `key_metrics (text)`. Expect the line `career_jobs.key_metrics`.
9. [J1.9] Click **Save draft**. Expect `Draft saved as version 2`.
10. [J1.10] Click **← All flows**, open **Seed Shop Orders**, click **Future state**, tap `Step: Check live stock`. Expect the lines `Platform agent`, `career_jobs.title`, `career_jobs.key_metrics`, `flows.publish` and **System of record (data port)** reading **Release tracker** (structured bindings survive saving and reopening).

## Journey 2 — Decision branch conditions

Interfaces: UI (flow) > Future state > (connector) > Branch condition. API `PUT /api/flow-studio/flows/:id` (edge `bind.condition` = `{field, op, value}`). MCP tool `flow_studio_flow_save`.

1. [J2.1] Tap the connector `→ Pick and pack (Yes)` under `Decision: In stock?`. Expect the Inspector heading `Connector: In stock? → Pick and pack`, a group **Branch condition** and the line `No data field picked.`
2. [J2.2] In **Condition: data object** choose `career_jobs (15)`, in **Condition: field** choose `order_index (integer)`, in **Condition: operator** choose **is greater than**, type `0` in **Condition: value**. Expect the line `Data field: career_jobs.order_index`.
3. [J2.3] Click **Save draft**. Expect `Draft saved as version 3`.

## Journey 3 — Experience mapping on a step

Interfaces: UI (flow) > Future state > (step) > Experience binding. API `PUT /api/flow-studio/flows/:id`. MCP tool `flow_studio_flow_save`.

1. [J3.1] Tap `Step: Check live stock`. Expect **Scene or static asset** reading `scene.order-check` and **Destination link** reading `/orders/status` (from the template). Choose **Flow Studio** in **World Shell layer**, **Signature** in **Crystal variant**, **Tap to open** in **Interaction kind**, and type `not a link` in **Destination link**. Expect **World Shell layer** to read **Flow Studio**.
2. [J3.2] Click **Save draft**. Expect `Draft saved as version 4`.

## Journey 4 — Preview the generated journey, fix, publish

Interfaces: UI (flow) > Journey. API `GET /api/flow-studio/flows/:id/journey-preview?source=draft|published`. MCP tool `flow_journey_preview`.

1. [J4.1] Click **Journey**. Expect the line `Preview of saved draft version 4.` (the flow is not published yet, so the draft is shown), the pill `1 warning(s)` and the finding `Step "Check live stock": destination link "not a link". Use a path that starts with / or an address that starts with https://.`, and under **Active journey** the text `This flow has not been activated as a journey yet. Publish it, then activate it from the Journey panel.`
2. [J4.2] Click **Preview published version**. Expect the red message `This flow has not been published yet. Publish it first, or preview the draft.` and no preview. Click **Preview saved draft**; the preview returns.
3. [J4.3] Read the preview. Expect **Generated user journey** (variant **Base (L2)**) to list in order: `Order received terminal · Customer`, `Check live stock step · Operations · actors: agent` followed by the line `Static asset or scene: scene.order-check · World Shell layer: island:flowStudio · Crystal variant: signature · Animation: pulse · Interaction: tap_to_open`, `In stock? gate · Operations`, `Pick and pack step · Operations`, `Order shipped terminal · Customer`. Expect **Gates** to list `In stock? (key stock_check) asks for 1 step(s), roles: agent` with the branches `→ Pick and pack (Yes): career_jobs.order_index is greater than 0` and `→ Notify the customer of the backorder (No): otherwise (no condition)`, then `End of journey (closing stage) asks for 2 step(s)`. Expect the experience summary `5 value(s) render · 30 not set · 0 not mapped · 1 invalid` and, in the **Experience map** row **Check live stock**, **Destination link** showing `invalid` and `not a link`, the other five cells `mapped`.
4. [J4.4] In **Impact of activating** expect the lines `First activation: flow version 4 becomes a journey the platform runs.`, `Gates added 2, removed 0, changed 0; 3 step molecule(s) are registered.`, `No member is running this journey yet.`, `Experience: 5 value(s) render, 30 not set, 0 not mapped, 1 invalid.` and `Only a published version can be activated. Publish the flow, then preview the published version.`, and **Approve and activate** disabled.
5. [J4.5] Tap `Step: Check live stock`, type `/world` in **Destination link**, click **Save draft** (expect `Draft saved as version 5`), click **Journey** if it closed, click **Preview saved draft**. Expect the pill `no problems`.
6. [J4.6] Click **Publish**, then **Approve and publish**. Expect `Published version 5`. Click **Journey**, then **Preview published version**. Expect `Preview of published version 5.`, the **Impact of activating** line `First activation: flow version 5 becomes a journey the platform runs.` and the line `Experience: 6 value(s) render, 30 not set, 0 not mapped, 0 invalid.`
7. [J4.7] Expect, because a member may not activate, the text `Your role cannot activate journeys. An administrator can allow it in the studio Settings, or activate it for you.` and **Approve and activate** disabled. The page has no sideways scroll.

## Journey 5 — An administrator activates the journey (impact, one approval, history)

Interfaces: UI (flow) > Journey > Approve and activate; History. API `POST /api/flow-studio/flows/:id/journey/activate` (body `{"approved":"<token>"}`), `GET /api/flow-studio/flows/:id/journey`. MCP tools `flow_journey_activate`, `flow_journey_active_read`.

1. [J5.1] ADMIN WINDOW: **Flows**. Expect the button **Seed Shop Orders** with `Version 5 · published`. Open it, click **Journey**. Expect `Preview of published version 5.`, the pill `no problems`, no "Your role cannot activate" text, and **Approve and activate** enabled, with the impact line `First activation: flow version 5 becomes a journey the platform runs.`
2. [J5.2] Type `First activation` in **Activation note**, click **Approve and activate**. Expect `Journey activated from version 5`, and under **Active journey** the line `Running as flow-<ID> from flow version 5, activated by admin@test.local. 2 gate(s); 0 journey(s) running.` followed by `In stock?: asks for Check live stock; roles agent` and `End of journey: asks for Pick and pack, Notify the customer of the backorder`, and the button **Start a test journey**.
3. [J5.3] Click **History**. Expect a row starting `journey activated v5 · source action: journey_publish · admin@test.local` with the note `First activation` and the impact lines (the same four lines as the preview), above the row `published v5 · source action: publish · member@test.local`.

## Journey 6 — The member runs the journey

Interfaces: UI (flow) > Journey > Active journey > Start a test journey. API `POST /api/flow-studio/flows/:id/journey/test-run`, `GET /api/journey-rods/me/world`. MCP tool `flow_journey_test_start`.

1. [J6.1] MEMBER WINDOW: reload `/world`, open **Journey Flow Studio**, open **Seed Shop Orders**, click **Journey**. Expect under **Active journey** `Running as flow-<ID> from flow version 5, activated by admin@test.local.` Click **Start a test journey**. Expect `Test journey started at gate f<ID>_stock_check` and the lines `1 journey(s) running` and `Your test journeys: #<n> at f<ID>_stock_check`.
2. [J6.2] In the MEMBER WINDOW address bar open `/api/journey-rods/me/world`. Expect JSON with a journey whose `scenarioKey` is `flow-<ID>` and `rodType` `journey_flow_run`, two stages `f<ID>_stock_check` (title `In stock?`, one atom `Check live stock`) and `f<ID>__end` (title `End of journey`, atoms `Pick and pack` and `Notify the customer of the backorder`), each with a `flowJourney` object.

## Journey 7 — Change, publish, and see who is affected before activating

Interfaces: UI (flow) > Future state > (step) > Gate key; Publish; Journey. API as J5. MCP tools `flow_journey_preview`, `flow_journey_activate`.

1. [J7.1] MEMBER WINDOW: click **Future state**, tap `Decision: In stock?`, change **Gate key** to `stock_ready`, click **Save draft** (expect `Draft saved as version 6`), **Publish**, **Approve and publish** (expect `Published version 6`).
2. [J7.2] ADMIN WINDOW: **← All flows**, open **Seed Shop Orders**, click **Journey**. Expect the impact lines `Replaces the active journey (flow version 5) with flow version 6.`, `Gates added 1, removed 1, changed 0; 3 step molecule(s) are registered.` and `1 journey(s) belonging to 1 member(s) are running this journey now; 1 of them sit at a gate this version removes.`
3. [J7.3] Click **Approve and activate**. Expect `Journey activated from version 6` and `Running as flow-<ID> from flow version 6` with `1 journey(s) running`.

## Journey 8 — Settings: experience channels and option lists

Interfaces: UI Settings > Experience channels / Option lists for structured bindings. API `GET|PUT /api/flow-studio/experience-channels`, `PUT /api/flow-studio/definition`. MCP tools `flow_experience_channels_read`, `flow_experience_channels_save`, `flow_studio_definition_save`.

1. [J8.1] ADMIN WINDOW: **← All flows**, tab **Settings**. In the card **Experience channels** expect six channels (**Static asset or scene**, **World Shell layer**, **Crystal variant**, **Animation**, **Interaction**, **Destination link**), each ticked, destination showing `Source: journey-flow > steps > destination`. Untick **Channel Destination link mapped**, type `Destination is not ready yet` in **Experience channels note**, click **Save experience channels**. Expect the card **Impact on published flows** with the line `Destination link will be unmapped. 1 published step(s) have a value for it; they read "not mapped" in the generated journey the next time their flow is activated. Already activated journeys keep what they were activated with.`
2. [J8.2] Click **Approve and apply**. Expect `Experience channels saved` and the channel unticked.
3. [J8.3] MEMBER WINDOW: **← All flows**, open **Seed Shop Orders**, **Journey**. Expect the experience summary `5 value(s) render · 25 not set · 6 not mapped · 0 invalid` and `not mapped` in the **Destination link** column.
4. [J8.4] ADMIN WINDOW: tick **Channel Destination link mapped**, note `Destination is ready`, **Save experience channels**, **Approve and apply**. Expect `Experience channels saved`.
5. [J8.5] ADMIN WINDOW: in **Option lists for structured bindings** click **Add actor option**; set the new row's key (**Actor options 6 key**) to `courier` and label to `Courier`; type `Add the courier actor` in **Definition change note**; click **Save definition**. Expect a confirmation line beginning `Definition saved as version 2`.
6. [J8.6] MEMBER WINDOW: **← All flows**, open **Seed Shop Orders**, **Future state**, tap `Step: Pick and pack`, in the **Add…** list under **Actors (roles or profiles)** choose **Courier**. Expect the line `Courier` there.

## Journey 9 — The same capabilities by API and MCP

Interfaces: API `/api/flow-studio/catalogs...`, `/journey-preview`, `/journey/activate`; MCP tools `flow_journey_catalogs_read`, `flow_journey_preview`, `flow_journey_active_read`, `flow_journey_activate`, `flow_journey_test_start`, `flow_experience_channels_read`, `flow_experience_channels_save`. Uses `scripts/mcp-call.mjs` as in the Connected Agents journeys. `<API_BASE>` is the address the browser's `/api` requests go to.

1. [J9.1] MEMBER WINDOW: **Journeys → Connected Agents**. Type `Journey probe` in **Token name**, tick **flowjourney.read** and **flowjourney.write** (nothing else; a third scope **flowjourney.publish** is listed and left unticked), click **Create token**. Expect **Copy your token now. It will not be shown again.** and a token starting `sbpat_`; keep it as **TOKEN_A**.
2. [J9.2] Run `curl -s -c m.jar -H 'Content-Type: application/json' -d '{"email":"member@test.local","password":"TestPass!2345"}' <API_BASE>/api/auth/login`, then `curl -s -b m.jar <API_BASE>/api/flow-studio/flows`. Note the `id` of **Seed Shop Orders** (version 6, status `published`) as **FLOW_ID**.
3. [J9.3] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> list`. Expect exit code 0 and exactly these lines in this order: `flow_journey_catalogs_read`, `flow_journey_preview`, `flow_journey_active_read`, `flow_journey_test_start`, `flow_experience_channels_read`, `flow_experience_channels_save`, `6 tools` (no `flow_journey_activate`).
4. [J9.4] Run `... call flow_journey_catalogs_read '{"object":"career_jobs"}'`. Expect `isError: false` and a field with key `career_jobs.title`.
5. [J9.5] Run `... call flow_journey_preview '{"flowId": <FLOW_ID>}'`. Expect `isError: false`, `"ok": true` and `"scenarioKey": "flow-<FLOW_ID>"`.
6. [J9.6] Run `... call flow_journey_activate '{"flowId": <FLOW_ID>, "approved": "x"}'`. Expect `isError: true`, `status` 403, `code` `scope_not_granted` and a message containing `"flowjourney.publish" scope`.
7. [J9.7] Run `... call flow_experience_channels_read`. Expect `isError: false` and six channels including `step.destination`.
8. [J9.8] Run `curl -s -i -b m.jar -H 'Content-Type: application/json' -d '{"approved":"x"}' <API_BASE>/api/flow-studio/flows/<FLOW_ID>/journey/activate`. Expect status `403` and the body `{"error":"Your role cannot activate journeys. Ask an administrator to allow it in the studio Settings.","code":"role_not_allowed"}` (the API enforces the same permission as the screen).
9. [J9.9] Log in as the administrator the same way (cookie jar `a.jar`) and run the same call with `{"approved":"wrong"}`. Expect status `409`, `code` `impact_approval_required` and the error `Review the impact and approve it to activate the journey.` (the token comes from the preview; the same call with it activates).
10. [J9.10] As the member, run `curl -s -b m.jar "<API_BASE>/api/flow-studio/catalogs/data-fields?object=users"`. Expect status 200 and no field whose name contains `password`, `token` or `secret`.
11. [J9.11] Run the same with `object=nope_table`. Expect status `404` and the error `There is no data object called "nope_table". Pick one from the list of objects.`

## Journey 10 — On a phone

Interfaces: UI at 390px wide (touch).

1. [J10.1] MEMBER WINDOW at 390px wide: open the studio, open **Seed Shop Orders**, tap **Future state**, tap `Step: Pick and pack`. Expect the Inspector below the lists, no sideways page scroll.
2. [J10.2] In the **Add…** list under **Actors (roles or profiles)** choose **Reviewer**. Expect the line `Reviewer`; its **Remove** button is at least 44px tall; tap it and the line disappears.
3. [J10.3] Tap the connector `→ Pick and pack (Yes)`. Expect the group **Branch condition** and no sideways scroll.
4. [J10.4] Tap **Journey**. Expect the preview, and the **Experience map** table scrolling inside its own box, not the page.
5. [J10.5] Expect every button, list and text box in the studio to be at least 44px tall (tick boxes aside).
6. [J10.6] Tap **← All flows**. Expect no **Settings** tab for the member.

## Edge cases

- [E.1] MEMBER WINDOW: create a blank flow **Pilot Check**. In **Future state** add **Add Start / End** (Label **Begin**), **Add Decision** (Label **Pass?**), **Add Step** (Label **Approve**), **Add Step** (Label **Reject**); in **Connect** mode tap in the list **Begin** then **Pass?**, **Pass?** then **Approve**, **Pass?** then **Reject**; click **Select**, **Save draft**, **Journey**. Expect the pill `1 problem(s) block activation`, the finding `"Pass?" is a gate but has no Gate key. Select it and fill in Gate key (lower case letters, numbers and _, for example credit_check).` and **Approve and activate** disabled.
- [E.2] Tap `Decision: Pass?`, set **Gate key** to `Bad Key`, **Save draft**, **Preview saved draft**. Expect `The Gate key "Bad Key" on "Pass?" is not allowed. Use lower case letters, numbers and _ only, starting with a letter (2 to 40 characters).`
- [E.3] Set **Gate key** to `pass_check`. Tap the connector `→ Approve`, in **Condition: data object** choose `career_jobs (15)`, in **Condition: field** choose `title (text)` and leave the operator empty. **Save draft**, **Preview saved draft**. Expect `1 problem(s) block activation` and `The connector from "Pass?" to "Approve" has a condition with no operator. Pick one, or clear the condition.`
- [E.4] Click **Clear condition**, **Save draft**, **Preview saved draft**. Expect the pill `2 warning(s)` (not blocked), the warnings `The gate "Pass?" has no steps leading into it, so it asks for nothing. Connect the steps that must be done before it.` and `The gate "Pass?" has 2 branches with no condition. Only one branch can be the "otherwise" path; give the others a condition.`, and the **Gates** line `Pass? (key pass_check) asks for 0 step(s)`.
- [E.5] A Render Bindings check: MEMBER WINDOW **Journeys → Render Bindings → Renderings** lists only **Workshop board** (the internal journey experience rendering is not shown), and the ADMIN WINDOW **Settings** card **Bindings** has no row whose name contains `Journey flow experience`.
