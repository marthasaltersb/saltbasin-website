# Training spec — Render bindings: every rendering is a view over mapped source data

Audience: a test agent driving a real browser as an administrator and as a member. Every step says exactly what to do and what you should see. All data is fictional (board item **Harbor dashboard refresh**, release **2030-01-05-garden-gate**, feature **Dock scheduler**). Everything happens inside the World Shell (`/world`); no admin URL is typed.

Version 1 · 2026-10-09 · change spec: `docs/changes/render-bindings.md`

## Where things are

- **World Shell**: `/world`. Top bar tabs **World**, **Journeys**, **Classic Tools**. Tab **Journeys** is a list of cards. The **Render Bindings** card (text "Render Bindings", subtitle "Open configuration") opens the panel full screen with **← Back to World** at the top left. Administrators also have a **Release Intelligence** card.
- **Render Bindings** panel (heading **Render Bindings**): tabs **Renderings**, **Pending changes (n)** where *n* is the number of changes waiting, and (administrators only) **Settings**. Under the heading, a line shows "Updated live: …" when another person changes something, and a **confirmation line** shows the result of your last action (for example "status changed") until your next action; it turns red for an error.
- **Renderings** tab: one button per rendering the signed-in role may open (administrator: **Release world**, **Workshop board**; member: **Workshop board**). A rendering shows one card per item (a crystal picture, the item title, a line of text, and "n pending" when changes wait). Clicking a card opens the item (**← All items** returns).
- An open item shows: the crystal picture, **Data map** (one block per visual channel, in this order: Crystal colour, Crystal size, Crystal gold ring, Crystal badge, Crystal depth for the Workshop board), **Change a value** (one block per source field, with a form when your role may edit it), and **History** (a **Time slider** and an **Event log**).
- A Data map block shows the channel name and its value on the right, a legend line, **Source: <port> > <object> > <field>**, and facts: **Source type**, **Observed**, **Confidence**, **Last changed by**, **Transform**, **Change policy** (**Live** or **Needs approval**). A channel with no source shows only the name, **not mapped**, and a line saying nothing is drawn.
- Time format everywhere: `YYYY-MM-DD HH:MM UTC`.
- Phone width: the same screens at 390px wide; the panel is one column.

Fixed test constraints that apply to every step: fresh database; test accounts from `scripts/create-test-member.mjs`: administrator **betsy@test.local** (display shown as **betsy@test.local**) and member **member@test.local** (display name **Test Member**), both password `TestPass!2345`, terms accepted. Use two separate browser windows (two contexts) signed in at the same time: **ADMIN WINDOW** and **MEMBER WINDOW**. On the mobile surface both windows are 390px wide. Journeys run in order on one database; each builds on the state the one before left. Wait up to 15 seconds for any screen update before calling a step failed. Reload is never needed unless a step says so.

## Preconditions

1. [P.1] ADMIN WINDOW: sign in as betsy@test.local. MEMBER WINDOW: sign in as member@test.local. Open `/world` in each. Expect both land in the World Shell with the top bar **World / Journeys / Classic Tools** (admin chip **System Architect**, member chip **Member**).
2. [P.2] In both windows click **Journeys**, then the **Render Bindings** card. Expect the panel heading **Render Bindings**, tabs **Renderings** and **Pending changes (0)**; the administrator also sees **Settings**, the member does not.

## Journey 1 — The Data map: every channel and where it comes from

1. [J1.1] MEMBER WINDOW: on **Renderings** the **Workshop board** button is selected. Type **Harbor dashboard refresh** in **New item title**, click **Add item**. Expect the item opens: heading **Harbor dashboard refresh**, sub line "Workshop board · Added by Test Member", and the blocks **Data map**, **Change a value**, **History**.
2. [J1.2] Read the **Data map**. Expect exactly five channel blocks, in this order: **Crystal colour**, **Crystal size**, **Crystal gold ring**, **Crystal badge**, **Crystal depth**.
3. [J1.3] Crystal colour block: value **not set**; legend "Crystal colour = status"; "Source: member-board > items > status"; "Source type: Manual entry"; "Change policy: Live"; "Observed: not recorded"; "Confidence: not recorded".
4. [J1.4] Crystal size block: value **not set**; legend "Crystal size = effort points"; "Source: member-board > items > effort"; "Change policy: Needs approval".
5. [J1.5] Crystal gold ring block: value **not recorded**; "Source: board-metrics > metrics > urgency"; "Source type: Calculation"; "Calculated from: member-board > items > priority and member-board > items > effort"; the note "Cannot be calculated: priority, effort not recorded".
6. [J1.6] Crystal badge block: value **not set**; "Source: sandbox-crm > accounts > stage"; "Source type: Connector"; "Change policy: Needs approval".
7. [J1.7] Crystal depth block: name **Crystal depth**, value **not mapped**, the line "No source field is mapped to this channel, so nothing is drawn for it." and no "Source:" line.

## Journey 2 — Live path: a change redraws every open window

1. [J2.1] MEMBER WINDOW, **Change a value**, block **status**: it shows "Change policy: Live" and "Can edit: member, admin". In **New status** choose **active**, click **Change status**. Expect the confirmation line "status changed"; the **Crystal colour** block now reads **Active**, "Last changed by: Test Member", "Confidence: 100%" and an "Observed: YYYY-MM-DD HH:MM UTC" time (not "not recorded").
2. [J2.2] ADMIN WINDOW: **Renderings**, click **Workshop board**, click the card **Harbor dashboard refresh**. Expect **Crystal colour** reads **Active**.
3. [J2.3] MEMBER WINDOW: in **New status** choose **done**, click **Change status**. Within 15 seconds, without touching the ADMIN WINDOW, expect there **Crystal colour** reads **Done** and the line under the heading reads "Updated live: value_changed by Test Member".

## Journey 3 — Approval path: proposal, ghost, impact, two steps, apply, reject

1. [J3.1] ADMIN WINDOW (item open): block **priority** shows "Can edit: admin". In **New priority** enter **3**, click **Change priority**. Expect the confirmation line "priority changed". **Crystal gold ring** still reads **not recorded** (effort is not set).
2. [J3.2] MEMBER WINDOW, block **effort** ("Change policy: Needs approval"): enter **8** in **New effort**, click **Propose effort**. Expect the confirmation line "effort proposed, waiting for Data owner review"; block **effort** now reads "Waiting for approval: 8 proposed by Test Member, step 1 of 2 (Data owner review). Decide it in Pending changes." and has no form.
3. [J3.3] MEMBER WINDOW, ghost: **Crystal size** still reads **not set** and shows "Pending: proposed 8 by Test Member, waiting for step 1 of 2 (Data owner review). Shown as a ghost: would draw 8; the approved value not set is still drawn."; the crystal picture shows a dashed translucent outline (the ghost) and the text "1 pending change: the dashed ghost shows the proposed value".
4. [J3.4] ADMIN WINDOW: click the tab **Pending changes (1)** (the count updates by itself). Expect one card titled "Harbor dashboard refresh · effort", the pill "Step 1 of 2: Data owner review", the line "effort: not set → 8", and the box "If approved, this changes:" with exactly these four lines: "Workshop board: Crystal size not set -> 8"; "Workshop board: Crystal gold ring via urgency (calculation) not recorded -> 24 of 65"; "Calculation urgency: Cannot be calculated: effort not recorded -> 24 points"; "No connected rods".
5. [J3.5] Click **Approve step 1 of 2**. Expect the confirmation line "Step approved, now waiting for Final approval", the card now shows "Step 2 of 2: Final approval" and a button **Approve and apply (step 2 of 2)**. In the MEMBER WINDOW **Crystal size** still reads **not set**.
6. [J3.6] Click **Approve and apply (step 2 of 2)**. Expect the confirmation line "Change approved and applied", the text "No changes are waiting for approval." and the tab **Pending changes (0)**. In the MEMBER WINDOW, within 15 seconds and without reload: **Crystal size** reads **8**, **Crystal gold ring** reads **24 of 65**, and the ghost outline and its text are gone.
7. [J3.7] MEMBER WINDOW: propose **13** for **effort** (button **Propose effort**). ADMIN WINDOW: **Pending changes (1)**; type **Estimate not agreed** in **Decision note**, click **Reject**. Expect the confirmation line "Change rejected", **Pending changes (0)**; in the MEMBER WINDOW **Crystal size** still reads **8** and no ghost is drawn.

## Journey 4 — History and the time slider

1. [J4.1] MEMBER WINDOW, block **History**: the **Time slider** caption reads "Step 9 of 9: betsy@test.local rejected effort: 8 -> 13 at step 1 of 2 (Data owner review); the approved value stays: 8". Below it, **Event log** lists exactly eight events, in this order, with these pills: **value_changed**, **value_changed**, **value_changed**, **change_proposed**, **change_approved**, **change_approved**, **change_proposed**, **change_rejected**.
2. [J4.2] Click the **Time slider**, press **Home**. Expect the caption "Step 1 of 9: Before any recorded change" and every slider channel reading **not set** or **not recorded** (Crystal depth reads **not mapped**).
3. [J4.3] Press **ArrowRight** four times. Expect the caption "Step 5 of 9: Test Member proposed effort: not set -> 8, waiting for Data owner review (step 1 of 2)"; slider channel **Crystal size** reads **not set** with the line "Ghost (pending): 8"; the box "Pending at this point: effort: not set -> 8 (Test Member, Data owner review)".
4. [J4.4] Press **ArrowRight** twice. Expect the caption "Step 7 of 9: betsy@test.local approved effort: not set -> 8 (change applied)"; slider channel **Crystal size** reads **8** with no "Ghost (pending)" line anywhere in History.
5. [J4.5] In the **Event log** the **change_proposed** entry for effort lists "Impact recorded when proposed:" with the same four lines as step [J3.4].

## Journey 5 — Who may change a field, and policy per binding

1. [J5.1] MEMBER WINDOW: reopen the item (**← All items**, click the card). Block **priority** reads "Your role cannot edit this field. Roles that can: admin." and has no input and no button.
2. [J5.2] ADMIN WINDOW: tab **Settings**. In the card "Who can edit each source field", under **Workshop board entries**, tick **member can edit member-board priority**. Expect the confirmation line "Editable roles saved".
3. [J5.3] MEMBER WINDOW: reopen the item. Block **priority** now has **New priority** and the button **Change priority**. Enter **5**, click **Change priority**. Expect the confirmation line "priority changed" and **Crystal gold ring** reads **40 of 65**.
4. [J5.4] ADMIN WINDOW: untick **member can edit member-board priority** (confirmation line "Editable roles saved"). MEMBER WINDOW: reopen the item; block **priority** again reads "Your role cannot edit this field. Roles that can: admin."
5. [J5.5] ADMIN WINDOW, **Settings**, card **Bindings**, row "Workshop board / Crystal size": set **Change policy: member-board:crystal.size** to **Live** (confirmation line "Binding settings saved"). MEMBER WINDOW: reopen the item; block **effort** now has the button **Change effort** (not **Propose effort**) and **Crystal size** shows "Change policy: Live". Then ADMIN WINDOW sets that policy back to **Needs approval** and the MEMBER WINDOW (reopened) shows **Propose effort** again.

## Journey 6 — A connector write-back that fails is shown, never hidden

1. [J6.1] ADMIN WINDOW: **Renderings** → **Workshop board** → open **Harbor dashboard refresh**. Block **stage** reads "Change policy: Needs approval". In **New stage** choose **negotiating**, click **Propose stage**. Expect the confirmation line "stage proposed, waiting for Data owner review".
2. [J6.2] Tab **Pending changes (1)**: the box lists "Workshop board: Crystal badge not set -> Negotiating" and "No connected rods". Click **Approve step 1 of 2**, then **Approve and apply (step 2 of 2)**. Expect the red confirmation line "Write-back failed: Salesforce is not connected for betsy@test.local, so the value was not written to Sandbox CRM. The approved value is kept here."
3. [J6.3] Reopen the item. **Crystal badge** reads **Negotiating** and contains a red alert "Write-back failed: Salesforce is not connected for betsy@test.local, so the value was not written to Sandbox CRM. The approved value is kept here."
4. [J6.4] In **Event log** an entry with pill **writeback_failed** reads "Write-back to Sandbox CRM failed for stage: Salesforce is not connected for betsy@test.local, so the value was not written to Sandbox CRM. The approved value is kept here."

## Journey 7 — Not mapped is never filled in; bindings are configurable

1. [J7.1] ADMIN WINDOW, **Settings**, card **Bindings**: untick **Mapped: member-board:crystal.size** (confirmation line "Binding settings saved"). Open the item: **Crystal size** reads **not mapped** with no "Source:" line.
2. [J7.2] **Settings**: tick **Mapped: member-board:crystal.size** again (confirmation line "Binding settings saved"). In the row "Workshop board / Crystal depth" (value **not mapped**) choose **member-board > items > effort** in **Source field for custom:member-board:crystal.depth**, click **Map channel** (confirmation line "Binding settings saved"). Open the item: **Crystal size** reads **8** again; **Crystal depth** reads **8** with "Source: member-board > items > effort".
3. [J7.3] **Settings**: click **Reset bindings to platform defaults** (confirmation line "Binding settings saved"). Open the item: **Crystal depth** reads **not mapped** again and **Crystal size** reads **8**.
4. [J7.4] **Settings**, card **Approval steps**: two steps listed, **Data owner review** (role label *Data owner*) and **Final approval** (*Final approver*), both **Active**.

## Journey 8 — First consumer: the release tracker (a platform table Port, data not moved)

1. [J8.1] ADMIN WINDOW: **Journeys** → **Release Intelligence** → tab **Releases**. Fill **Release key** with `2030-01-05-garden-gate` and **Release name** with `Garden gate release`, click **Create release record**. In the new release fill **Feature key** `dock-scheduler`, **Feature name** `Dock scheduler`, **Final status** **failing**, click **Add feature to release**. Expect the feature `dock-scheduler` listed.
2. [J8.2] **Journeys** → **Render Bindings** → **Renderings** → click **Release world** → click the card **Dock scheduler**. Expect Data map blocks **Crystal colour**, **Crystal size**, **Crystal gold ring**, **Satellites count**, **Crystal pulse**, **Crystal depth**. **Crystal colour** reads **Failing**, "Source: release-tracker > release_features > final_status", "Source type: Platform table", "Change policy: Live". **Crystal size** reads **not recorded**, "Source: release-tracker > release_features > steps_total". **Crystal gold ring** shows "Cannot be calculated: steps_passed, steps_total not recorded". **Satellites count** shows "Change policy: Needs approval". **Crystal pulse** shows "Calculated from: release-tracker > release_features > tracker_open_bugs and release-tracker > release_features > declared_rounds". **Crystal depth** reads **not mapped**.
3. [J8.3] In block **final status** choose **passed**, click **Change final status**: confirmation line "final status changed", **Crystal colour** reads **Passed**. In block **declared rounds** enter **2**, click **Change declared rounds**: confirmation line "declared rounds changed". Open **Journeys** → **Release Intelligence** → tab **Releases**, click **Open** on the row `2030-01-05-garden-gate`: the feature row `dock-scheduler` shows **passed** (the source table itself was updated).
4. [J8.4] Back in **Render Bindings** → **Release world** → **Dock scheduler**: block **tracker open bugs** enter **4**, click **Propose tracker open bugs** (confirmation line "tracker open bugs proposed, waiting for Data owner review"). Tab **Pending changes (1)** lists: "Release world: Satellites count not recorded -> 4"; "Release world: Crystal pulse via bugs per round (calculation) not recorded -> 2"; "Calculation bugs per round: Cannot be calculated: tracker_open_bugs not recorded -> 2 bugs per round"; "No connected rods". Approve step 1 then **Approve and apply (step 2 of 2)** (confirmation line "Change approved and applied"). Reopen the item: **Satellites count** reads **4**, **Crystal pulse** reads **2**.

## Edge cases

- [E.1] Phone width (390px, both windows): every journey above is walkable with taps only; the page never scrolls sideways; every button, select and text input in the panel is at least 44px tall; the tabs wrap onto more than one line rather than clipping.
- [E.2] Run `curl -s -c jar.txt -H 'Content-Type: application/json' -d '{"email":"member@test.local","password":"TestPass!2345"}' http://127.0.0.1:<API_PORT>/api/auth/login`, then `curl -s -b jar.txt http://127.0.0.1:<API_PORT>/api/render-bindings/renderings/member-board` and note the `subjectKey` of the item, then `curl -s -i -b jar.txt -H 'Content-Type: application/json' -d '{"renderingKey":"member-board","subjectKey":"<subjectKey>","portKey":"member-board","objectKey":"items","fieldKey":"priority","value":4}' http://127.0.0.1:<API_PORT>/api/render-bindings/changes`. Expect status `403` and body `{"error":"Your role (member) cannot edit priority. Roles allowed to edit it: admin.","code":"role_not_allowed"}` (the API enforces the same role rule as the screen).
- [E.3] Opening **Pending changes** as the member (with a change waiting) shows the same card but no **Approve** or **Reject** buttons, instead "Only an administrator can approve or reject this change."
- [E.4] A member sees only **Workshop board** in the rendering buttons; asking for the release world through the API answers 403 "Your role (member) cannot open the Release world".
- [E.5] Dark colour scheme: the panel background is dark and all text stays readable (no black text on a dark background). Reduced-motion preference: the crystal pulse on **Release world** does not animate.
- [E.6] Proposing a value that equals the current value is refused with the inline error "effort is already 8"; proposing out-of-range text for a number (for example 99 for effort) shows "effort must be between 0 and 13".
- [E.7] Expected network noise during the walk: none besides external font and CDN requests that may fail offline and one `favicon.ico` 404. The server-sent-events request `/api/render-bindings/stream` stays open; HTTP 409 and 403 responses appear only where a step above provokes them.
