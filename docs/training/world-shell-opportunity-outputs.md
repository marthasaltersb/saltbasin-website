# Training spec — World Shell: track a job opportunity, see its outputs and provenance, edit a draft, approve for QR

Audience: a member using the platform, and a test agent driving a real browser. Every step says exactly what to do and what you should see. All data is fictional (company **Northwind Freight**, role **Principal Value Architect**, member **Riley Fenn**). The whole journey happens inside the World Shell (`/world`) — admin navigation is not used.

Version 1 · 2026-10-02 · change spec: `docs/changes/world-shell-opportunity-outputs.md`

## Where things are

- **World Shell**: `/world`. Top bar: **SALT BASIN / Your World**, tabs **World**, **Journeys**, **Classic Tools**, and your name chip (**Riley Fenn · Member**) at the right.
- **Journeys** tab = a list of cards (works without WebGL). Cards in order: **Career Placement Agents**, **My Website**, **Fund & Portfolio Demo**, **Career Master**, **Site Configuration**, **Output Templates**. (In the 3D World the same modules are islands you can click; this spec uses the cards.)
- **Career Placement Agents** card → right-hand panel titled **Career Placement Agents** (at phone width the panel spans the screen). It lists tracked opportunities; selecting one shows its detail, including the section **APPLICATION OUTPUTS**.
- **Career Master** card → full-screen **Career Master** with tabs **Career Orbit · Upload & Map · Manual Intake · Proficiency & Rollups · Career World BestyStaff**, and **← Back to World** at the top left.
- QR page: the link shown under an approved output (`/r/<slug>`).

## Preconditions (set up once, on a fresh database)

Harness-level (not part of the journeys): the member exists, created with the fixed test-account script (the only permitted way to create a test user):

```
node scripts/create-test-member.mjs --email riley.member@example.test --password 'Member!Pass#2468xx' --name 'Riley Fenn' --provisional --no-terms
```

`--provisional` leaves the password marked as provisional (the member must change it at first login); `--no-terms` leaves the career terms unaccepted. The script prints the member's credentials as JSON.

Two files the test creates outside the repository (never inside `server/data/applicationPackages/`):

`/tmp/northwind-package.json`

```json
{
  "packageKey": "northwind-2026-10",
  "company": "Northwind Freight",
  "role": "Principal Value Architect",
  "createdAt": "2026-09-30T13:00:01Z",
  "authors": ["Avery Quill", "Jordan Reed"],
  "outputs": [
    {"variant": "resume_salt_basin", "outputType": "resume", "name": "Northwind Freight - Salt Basin Resume",
     "content": {"format": "document_blocks", "version": 1,
       "header": {"name": "Avery Quill", "headline": "VALUE ARCHITECT", "contact": "avery@example.test | Remote"},
       "blocks": [
         {"type": "heading", "text": "Summary"},
         {"type": "paragraph", "text": "Builds quote-to-revenue systems for freight networks."},
         {"type": "heading", "text": "Experience"},
         {"type": "role", "title": "Value Engineering Lead, Harbor Logistics", "dates": "2018 - 2024"},
         {"type": "bullet", "text": "Cut quote cycle time by 30 percent."},
         {"type": "bullet", "text": "Standardized pricing across 4 regions."},
         {"type": "table", "rows": [[["Metric"],["Result"]],[["Cycle time"],["-30%"]]]}
       ]}},
    {"variant": "cover_letter", "outputType": "cover_letter", "name": "Northwind Freight - Cover Letter",
     "content": {"format": "document_blocks", "version": 1,
       "header": {"name": "Avery Quill", "headline": "", "contact": "avery@example.test"},
       "blocks": [{"type": "paragraph", "text": "Dear Hiring Team, I am writing about the Principal Value Architect role."}]}}
  ]
}
```

`/tmp/note.txt` (three paragraphs, separated by blank lines, as shown):

```
Avery Quill
Principal Value Architect candidate

Summary of fit for the Northwind Freight opportunity.

Led a quote-to-revenue redesign that cut cycle time by 30 percent.
```

The first two lines form one paragraph, so the file has three paragraphs.

Notes for the tester: the login endpoint allows 10 attempts per 15 minutes per IP — reuse the browser session instead of logging in repeatedly. External Google Fonts / CDN requests may fail offline; ignore those. A single `favicon.ico` 404 is normal.

## Journey 0 — First login lands you in your world

1. [J0.1] Open `/login`. Enter email `riley.member@example.test`, password `Member!Pass#2468xx`, click **Sign In**.
   - Expect the page `/first-login-password?next=/world` showing **BESTYSTAFF · REQUIRED FIRST STEP**, heading **Set your own password**, fields **Current password**, **New password**, **Confirm new password**.
2. [J0.2] Enter current `Member!Pass#2468xx`, new and confirm `Member!Pass#2468yy`, click **Save password and continue**.
   - Expect `/world` showing **BESTYSTAFF · REQUIRED FIRST PROMPT** and **Career Portfolio Terms & Data Conditions** (not an empty world).
3. [J0.3] Tick every checkbox, click **I Agree — Continue**.
   - Expect the World Shell: top bar with **World / Journeys / Classic Tools**, **Riley Fenn · Member** (at phone width, 390px, only the avatar **R** is shown in place of the name text), toast **Consent recorded**. Counters read **0 TRACKED**, **7 AGENTS**.

## Journey 1 — Add a technology to Career Master (so provenance and the finalization gate have real data)

1. [J1.1] Click **Journeys**. Expect the card **Career Placement Agents — 0 tracked · 7 agents**.
2. [J1.2] Click the card **Career Master**. Expect a full-screen **Career Master** with the tabs listed above. Click **Manual Intake**, then the button **Tools (0)**, then **+ Add**.
   - Expect a dialog **Add Entry** with fields NAME WHEN USED, CURRENT NAME (IF RENAMED), CATEGORY, PROFICIENCY TIER, FIRST USED (YEAR), # ROLES, HOW IT WAS USED — PROFICIENCY CATEGORY, NOTES.
3. [J1.3] Type **Ledgerly ERP** in NAME WHEN USED, **ERP** in CATEGORY, **2019** in FIRST USED (YEAR), **2** in # ROLES. Leave HOW IT WAS USED at **(none)**. Click **Save**.
   - Expect the button **Tools (1)** and a row **Ledgerly ERP**.
4. [J1.4] Click **← Back to World**.

## Journey 2 — Create a placeholder opportunity (company + role only)

1. [J2.1] Click **Journeys → Career Placement Agents**. Expect the panel **Career Placement Agents**, **TRACKED (0)**, **Nothing tracked yet.**, and buttons **+ Add**, **Run Job Research**, **Import Pipeline Spreadsheet**, **Generate Resume Queue (top 10)**, **Automation & Scheduling**.
2. [J2.2] Click **+ Add**. Expect two inputs (placeholders **Job title**, **Company**), the hint **Only a job title and company are needed - add details later.** and a button **Track**.
3. [J2.3] Enter Job title **Principal Value Architect**, Company **Northwind Freight**, click **Track**.
   - Expect toast **Tracked "Principal Value Architect".** and the detail view: sub-heading **PRINCIPAL VALUE ARCHITECT**, **Stage Discovered**, **Score Not yet scored**, the eight score inputs, then the section **APPLICATION OUTPUTS** containing **Placeholder opportunity** with the tag **DETAILS TO BE FILLED LATER**, inputs **Posting URL / Location / Notes**, a button **Save details**, the sentence **No outputs linked to this opportunity yet. Link an existing output below, or import an application package.**, and **LINK AN EXISTING OUTPUT** with **Every output you have is already linked, or you have none yet.**
4. [J2.4] Click **← Tracked list**. Expect **TRACKED (1)** and a row **Principal Value Architect** with the small tag **PLACEHOLDER**.

## Journey 3 — File a package and link it (script option)

Run from the repository root (the script only talks to the API over HTTP; use the member's credentials):

1. [J3.1] Refusal first. Make a copy of the package without the `role` key (`/tmp/northwind-package-norole.json`) and run
   `SB_EMAIL=riley.member@example.test SB_PASSWORD='Member!Pass#2468yy' PUBLIC_BASE_URL=http://localhost:<API_PORT> node scripts/import-application-package.mjs /tmp/northwind-package-norole.json --link-opportunity`
   - Expect failure with `import failed: 400 linkOpportunity needs the package JSON to carry both "company" and "role". Nothing was imported.`
2. [J3.2] Run the same command with `/tmp/northwind-package.json`.
   - Expect exactly these lines (ids on a fresh database): `resume_salt_basin      #1  created`, `cover_letter           #2  created`, then `Opportunity #<n> already existed; 2 output(s) linked.` (the placeholder from Journey 2 is reused, not duplicated).
3. [J3.3] Run it again. Expect `resume_salt_basin      #1  unchanged` and `cover_letter           #2  unchanged`, and the opportunity line again.

## Journey 4 — Open the opportunity and read each output's provenance

1. [J4.1] Reload `/world`. Click **Journeys → Career Placement Agents**, then the row **Principal Value Architect**. Scroll to **APPLICATION OUTPUTS**.
   - Expect **exactly two** cards, in this order: **Northwind Freight - Cover Letter** then **Northwind Freight - Salt Basin Resume**, each with the badge **DRAFT**.
2. [J4.2] On **Northwind Freight - Salt Basin Resume** expect the line **resume - version 1 of 1** and a **PROVENANCE** list with these exact values:
   - **Source** Imported application package
   - **Imported** today's date (format like `Oct 2, 2026`, UTC)
   - **Document created** Sep 30, 2026
   - **Last changed** today's date
   - **Authors** Avery Quill, Jordan Reed
   - **Version** Version 1 of 1
   - **Lineage** v1 Draft
   - **Career Master** `Filed against <n> Career Master data points (state <12 hex characters>). Unchanged since.`
   - **Draws on** Your Career Master - Jobs 0, Skills 0, Tools 1, Certifications 0, Engagements 0
   - **Salt Basin site** Not published yet.
   - Buttons **Open my Career Master**, **Edit draft**, **Approve for QR**, **Unlink**. (No "View my Salt Basin site" button, because the site is unpublished.)

## Journey 5 — Follow the link to the Career Master data and come back

1. [J5.1] On the resume card click **Open my Career Master**. Expect the full-screen **Career Master** (with **Manual Intake**).
2. [J5.2] Click **← Back to World**.
   - Expect to be back on the **Career Placement Agents** panel with **PRINCIPAL VALUE ARCHITECT** still selected and both output cards visible (not the empty world).

## Journey 6 — Open the draft in the shared editor and save a new version

1. [J6.1] On the resume card click **Edit draft**.
   - Expect a full-screen editor titled **Northwind Freight - Salt Basin Resume** with the sub-title **Version 1 - shared block editor**; left list headed **9 BLOCKS** with rows in this order: **Page Header — Avery Quill**, **Contact Line**, **Heading — Summary**, **Body Text — Builds quote-to-revenue…**, **Heading — Experience**, **Role Line — Value Engineering Lead, Harbor…**, **Bullet List**, **Bullet List**, **Preserved content**. Right side: **LIVE PREVIEW — UPDATES ON EVERY EDIT** showing a dark header with **Avery Quill** and **VALUE ARCHITECT**, the headings Summary and Experience, both bullets, and a dashed box **TABLE KEPT EXACTLY AS IMPORTED** with `Metric | Result` and `Cycle time | -30%`. Status text **Editing version 1 - Save creates version 2 (draft)**.
2. [J6.2] Click **Save** without changing anything. Expect a red status line **Error: No changes to save.** and the editor stays open.
3. [J6.3] Click **+ Add Block**. Expect only four choices: **Heading**, **Body Text**, **Bullet List**, **Role Line** (and **Cancel**). Click **Cancel**.
4. [J6.4] Click the row **Body Text**. Expect a textarea whose value is `Builds quote-to-revenue systems for freight networks.` Replace it with `Builds quote-to-revenue systems for freight networks and leads value engineering teams.` — the preview updates immediately.
5. [J6.5] Click **Save**. Expect the editor to close, toast **Saved as a new draft version**, and the resume card now reading **resume - version 2 of 2**, **Version 2 of 2 (edited from version 1)**, **Lineage v1 Draft > v2 Draft**.

## Journey 7 — Approve for QR (through the finalization gate)

1. [J7.1] On the resume card click **Approve for QR**. Expect an inline box: `Approve "Northwind Freight - Salt Basin Resume" (version 2) as the final version for its QR code? You will be recorded as the approver. …` with **Confirm approval** and **Cancel**. Click **Cancel**: the card still shows **DRAFT**.
2. [J7.2] Click **Approve for QR → Confirm approval**.
   - Expect a dialog **Set how each technology was used** listing **Ledgerly ERP** with a dropdown (preset to **Hands-on (suggested)** or empty) and buttons **Cancel**, **Save to Career Master and continue**. (This is the server's `assertReadyToFinalize` refusing, then the client gate.)
3. [J7.3] Click **Cancel**. Expect the message **Finalization cancelled — technologies still need a proficiency category.** and the card still **DRAFT**.
4. [J7.4] Repeat step 2, choose **Hands-on** in the dropdown, click **Save to Career Master and continue**.
   - Expect the badge **APPROVED - QR LIVE**, **Lineage v1 Draft > v2 Approved - QR live (QR)**, the line **Approved** `<today> by Riley Fenn`, the line **QR link is live on version 2:** followed by a link `/r/…`, and the Career Master line now ends **it has changed since.** (setting the category changed Career Master after the output was filed). The **Approve for QR** button is disabled.
5. [J7.5] Click the `/r/…` link (new tab).
   - Expect the private QR page: **Private link · Northwind Freight - Salt Basin Resume**, the document with **Avery Quill**, the edited summary sentence, both bullets, a table with **Cycle time** and **-30%**, and the dark banner starting **LIVE DATA**.

## Journey 8 — Edit an approved output: the QR keeps its version until you approve the new one

1. [J8.1] On the resume card click **Edit draft**, click the first **Bullet List** row, replace its text with two lines: `Cut quote cycle time by 30 percent.` and `Added a regional rollout playbook.` Click **Save**.
   - Expect **resume - version 3 of 3**, **Version 3 of 3 (edited from version 2)**, **Lineage v1 Draft > v2 Approved - QR live (QR) > v3 Draft**, the badge **DRAFT**, and **QR link is live on version 2 (a newer draft exists):**. The QR page still shows the old bullets.
2. [J8.2] Click **Approve for QR → Confirm approval**.
   - Expect **no** category dialog (already categorised), the badge **APPROVED - QR LIVE**, **Lineage v1 Draft > v2 Approved > v3 Approved - QR live (QR)**, **QR link is live on version 3:** with **the same `/r/<slug>`** as before. Reload the QR page: it now shows **Added a regional rollout playbook.**

## Journey 9 — Link and unlink outputs

1. [J9.1] On the **Northwind Freight - Cover Letter** card click **Unlink**. Expect the card to disappear (one card left) and, under **LINK AN EXISTING OUTPUT**, a select **Output to link** whose options are **Choose an output...** and **Northwind Freight - Cover Letter (cover letter, Draft)**.
2. [J9.2] Choose that option, click **Link output**. Expect two cards again.

## Journey 10 — Import a document from the UI and edit it

1. [J10.1] Under the opportunity (below the outputs) click **Import Resume (PDF/DOCX/TXT)** and choose `/tmp/note.txt`.
   - Expect a third card **Imported Resume — note.txt** with **Source Imported document (uploaded by you)**, **Authors none recorded**, **resume - version 1 of 1**.
2. [J10.2] Click **Edit draft** on it. Expect three **Body Text** rows (the three paragraphs). Edit the first to `Avery Quill, Principal Value Architect candidate`, **Save**.
   - Expect **Version 2 of 2 (edited from version 1)** on that card.

## Journey 11 — Fill in the placeholder later

1. [J11.1] In the **Placeholder opportunity** box type Posting URL `https://careers.northwind.example/principal-value-architect`, Location `Remote`, click **Save details**.
   - Expect toast **Opportunity details saved** and the box (**DETAILS TO BE FILLED LATER**) disappears; the tracked list row no longer shows **PLACEHOLDER**.

## Journey 12 — Phone width (390 × 800), same account

Open `/world` in a 390px-wide window (reuse the session).

1. [J12.1] Expect no horizontal scrolling (page width = 390). The top bar shows the brand, the three tabs and the avatar **R** on one or two rows, not clipped.
2. [J12.2] **Journeys → Career Placement Agents → Principal Value Architect**: the panel spans the screen (about 8px margins), nothing cut off at the right edge.
3. [J12.3] On the Salt Basin Resume card (scroll down) click **Edit draft**: the editor fills the screen in one column (block list, then **Print / Save PDF** and the preview below). Click **Body Text**: the textarea is fully on screen. Change the text, click **Save**. Expect **resume - version 4 of 4**.
4. [J12.4] Click **Approve for QR**: the confirmation box fits inside the card with both buttons visible; **Confirm approval**: badge **APPROVED - QR LIVE** (no category dialog), still no horizontal scroll.

## Edge cases

- [E.1] Login with a still-provisional password never shows an empty world: it redirects to the password page; after saving it returns to `/world`.
- [E.2] If the member's navigation cannot be loaded the right panel shows **Your islands could not be loaded: <reason>** (never a blank panel).
- [E.3] Saving the editor with no change → **Error: No changes to save.** (HTTP 400, visible, nothing created).
- [E.4] Approving when a technology has no category → dialog; **Cancel** leaves the draft untouched with the message above.
- [E.5] An output that is not editable (AI-generated JSON content) shows the reason instead of **Edit draft**; it can still be linked/unlinked.
- [E.6] Unlinking only removes the link; the output remains in My Resume → Resume Output History and appears under **LINK AN EXISTING OUTPUT**.
- [E.7] Signed in as a second member, TRACKED shows (0) and none of Riley's outputs appear under LINK AN EXISTING OUTPUT or in My Resume.
- [E.9] `curl -s -b <second member's cookie jar> http://localhost:<API_PORT>/api/career-agents/opportunities/<Riley's opportunity id>/outputs` and `curl -s -X POST -b <second member's cookie jar> http://localhost:<API_PORT>/api/resume-outputs/<Riley's output id>/share` each return a 4xx error and change nothing; MCP tools application_outputs_list and application_output_approve_for_qr called with the second member's token return the same error.
- [E.8] The `--link-opportunity` import is idempotent: re-running neither duplicates the opportunity nor re-links anything.
