# Training spec — Output version history: dates, tracked changes and a timeline slider

Audience: a member using the platform, and a test agent driving a real browser. Every step says exactly what to do and what you should see. All data is fictional (member **Test Member**, employer **Harborline Freight Systems**, role **Finance Systems Lead**, opportunity **Regional Finance Lead** at **Fictional Works**).

Version 1 · 2026-10-02 · change spec: `docs/changes/output-version-history.md`

## Where things are

- **My Resume**: `/world` → **Classic Tools** → **MY RESUME** in the left list. The panel has a section **Resume Output History**; every output row has the small buttons **Version history**, **Edit sections** (career-bound outputs), **Approve for QR**.
- **Career Master**: `/world` → **Journeys** → card **Career Master**. Tab **Jobs (n)**, button **+ Add**.
- **World Shell opportunity view**: `/world` → **Journeys** → **Career Placement Agents** → select a tracked opportunity. Section **OUTPUT VERSION HISTORY** (one row per output with a **Version history** button), below the import buttons, and the cards under **APPLICATION OUTPUTS** with **Edit draft**.
- **The history dialog** (everywhere): title **Version history: <output name>**, sub-line **<n> version(s) of this output**, a **Close** button, then the cards **VERSIONS** (a table with columns Version, Status, Created, Modified, Approved by, Changes from previous), **TIMELINE: SLIDE ACROSS THE VERSIONS OF THIS OUTPUT** (a range slider), **<vN> AS IT STOOD** (the rendered document) and **TRACKED CHANGES** (selects **Compare from** / **to**, checkbox **Hide unchanged text**). Times read like `Oct 2, 2026, 13:04 UTC` (UTC). Escape or **Close** dismisses it.

## Preconditions (set up once, on a fresh database)

Harness-level (not part of the journeys): the member exists, created by `node scripts/create-test-member.mjs` (account `member@test.local`, password `TestPass!2345`, display name `Test Member`, terms accepted, no forced password change).

Two text files created outside the repository, **with the same file name in two folders**:

`/tmp/ovh-a/ovh-resume.txt` (paragraphs separated by blank lines)

```
Morgan Ellis
Finance Systems Manager candidate

Led a ledger consolidation across four regions.

Cut month-end close from ten days to six.
```

`/tmp/ovh-b/ovh-resume.txt`

```
Morgan Ellis
Finance Systems Manager candidate

Led a ledger consolidation across five regions.

Cut month-end close from ten days to six.

Mentored three analysts.
```

Notes: the login endpoint allows 10 attempts per 15 minutes per IP, so log in once and reuse the browser session. `ERR_CERT_AUTHORITY_INVALID` console errors for external fonts/CDN are environmental; ignore them. All dates below are "today" in UTC.

## Journey 0 — First login

Open `/login` and log in with `member@test.local` / `TestPass!2345`. Expect the World Shell with **Test Member · Member** and no password or consent page.

## Journey 1 — A new output has one version

1. [J1.1] **Journeys → Career Master → Jobs → + Add**. Fill **Company** `Harborline Freight Systems`, **Title** `Finance Systems Lead`, **Start Date** `Jan 2018`, **End Date** `Mar 2022`, click **Save**. Expect the tab to read **Jobs (1)**. Click **← Back to World**.
2. [J1.2] **Classic Tools → MY RESUME**. In the field with accessible name **Name of the new career-bound resume** type `Version demo resume`, click **New career-bound resume from Career Master**. Expect the career-bound editor.
3. [J1.3] In **New bullet for Harborline Freight Systems** type `Led the ledger consolidation across four regions.` and click **Add to Career Master and this output**. Click **Save changes**, then **Close**.
4. [J1.4] In **Resume Output History** click **Version history** on the row **Version demo resume**.
   - Expect the dialog title `Version history: Version demo resume` and `1 version of this output`.
   - Table row: `v1 (latest)`, status **Draft**, Created and Modified both `<today>, hh:mm UTC` (for example `Oct 2, 2026, 13:04 UTC`), Approved by **Not approved**, Changes from previous **First version**.
   - The slider is disabled; the text **This output has only one version so far. Editing it after it is approved files the edit as a new version.** is shown.
   - Under **V1 AS IT STOOD**: `Test Member`, `EXPERIENCE`, `Harborline Freight Systems | Finance Systems Lead`, `Jan 2018 – Mar 2022`, bullet `Led the ledger consolidation across four regions.`
   - Under **TRACKED CHANGES**: **Pick two different versions to see what changed.**
5. [J1.5] Click **Close**.

## Journey 2 — Approve, edit, and a second version appears

1. [J2.1] On the row click **Approve for QR**; in the browser confirmation `Approve "Version demo resume" as the final version for its QR code? …` accept. Expect the row status **published** with an **Approved by** line.
2. [J2.2] Click **Edit sections**. Expect the banner **This version is published. Saving will not change it - your edits become a new draft version, …**.
3. [J2.3] Replace **Bullet 1 for Harborline Freight Systems** with `Led the ledger consolidation across five regions.`; in **New bullet for Harborline Freight Systems** type `Presented results to the board quarterly.` and click **Add to this output only**; click **Save changes**. Expect the editor to show a **Version history** button beside **Save changes**. Click **Close**.
4. [J2.4] Expect two rows in Resume Output History. Click **Version history** on the **newest** row (the first row in the list).
   - Title `Version history: Version demo resume`, `2 versions of this output`.
   - Row v1: **Published · QR live**, Created and Modified `<today>, hh:mm UTC`, Approved by `Test Member, <today>, hh:mm UTC`, Changes **First version**.
   - Row v2 `(latest)`: **Draft**, Approved by **Not approved**, Changes from previous **1 added, 1 changed**.
   - **Viewing v2 of 2 (draft), modified <time> UTC, not approved.**

## Journey 3 — The timeline slider

1. [J3.1] In the open dialog (slider on v2): **V2 AS IT STOOD** shows `…across five regions.` and `Presented results to the board quarterly.` and the note **Wording is resolved from your current Career Master, so it follows Career Master edits.**
2. [J3.2] Click the slider, press **Home**. Expect **Viewing v1 of 2 (published)…, approved by Test Member.** The rendered document now shows `…across four regions.` and **neither** `five regions` **nor** `board quarterly`, with the note **Wording as frozen when this version was approved.**
3. [J3.3] Press **End**. Expect the v2 text again.
4. [J3.4] Click the label `v1` under the slider: same as Home; click `v2`: same as End.

## Journey 4 — Tracked changes between any two versions

1. [J4.1] With v2 selected the **Compare from** select reads `v1 (published)` and **to** reads `v2 (draft)`. Expect the summary **v1 to v2: 1 added, 1 changed**.
2. [J4.2] In the list: the line for the sentence has the chip **CHANGED**, the word `four` struck through in red and `five` underlined in green, the rest plain; a green chip **ADDED** followed by the underlined text `Presented results to the board quarterly.`; unchanged lines are grey with a small type label (HEADER fields, HEADING, ROLE, …).
3. [J4.3] Set **Compare from** to `v2 (draft)` and **to** to `v1 (published)`. Expect **v2 to v1: 1 removed, 1 changed** (the bullet appears with chip **REMOVED**, struck through).
4. [J4.4] Tick **Hide unchanged text**. Expect no grey lines remain (only CHANGED/REMOVED lines).
5. [J4.5] Set both selects to the same version. Expect **Pick two different versions to see what changed.**
6. [J4.6] Click **Close**.

## Journey 5 — Frozen wording vs. current Career Master

1. [J5.1] **Career Master** (Classic Tools → CAREER MASTER) → **Jobs** → click `Harborline Freight Systems` → change **Title** to `Finance Systems Director` → **Save**. Go to **MY RESUME**.
2. [J5.2] Open **Version history** on the newest row, press **Home** on the slider. Expect v1 still reads `Finance Systems Lead` (and not `Director`): it was frozen at approval.
3. [J5.3] Press **End**. Expect v2 reads `Finance Systems Director` and the note **Wording is resolved from your current Career Master, so it follows Career Master edits.** Click **Close**.

## Journey 6 — Approving records who and when; a third version

1. [J6.1] On the newest row click **Approve for QR** and accept the confirmation. (No proficiency dialog appears: Career Master has no technologies.) Open **Version history** on the newest row.
   - Row v1 status is now **Approved** (its QR link moved on); row v2 `(latest)` is **Published · QR live** with Approved by `Test Member, <today>, hh:mm UTC`; v2 Changes from previous reads **1 added, 2 changed** (the title and sentence changes are counted because v2's wording is now frozen).
   - `Wording as frozen when this version was approved.` shows for v2. Click **Close**.
2. [J6.2] Click **Edit sections** on the newest row, replace **Bullet 2 for Harborline Freight Systems** with `Presented results to the board every quarter.`, **Save changes**.
3. [J6.3] Without closing, click **Version history** inside the editor (beside **Save changes**).
   - Expect `3 versions of this output`; row v3 `(latest)` **Draft**, **Not approved**, **1 changed**.

## Journey 7 — World Shell opportunity view and re-imported documents

1. [J7.1] **Close** the editor. Back in the World Shell: **Journeys → Career Placement Agents → + Add**, Job title `Regional Finance Lead`, Company `Fictional Works`, **Track**. Expect the detail view with a section **OUTPUT VERSION HISTORY**.
2. [J7.2] Click **Import Resume (PDF/DOCX/TXT)** and choose `/tmp/ovh-a/ovh-resume.txt`. Expect under **OUTPUT VERSION HISTORY** the row **Imported Resume — ovh-resume.txt (Draft)** with a **Version history** button (a **Cover Letter — Regional Finance Lead at Fictional Works (Draft)** row may also be listed).
3. [J7.3] Click that **Version history**. Expect `Version history: Imported Resume — ovh-resume.txt`, `1 version of this output`, the note **Generated text shown as plain sections.**, and the three paragraphs. Click **Close**.
4. [J7.4] Click **Import Resume (PDF/DOCX/TXT)** again and choose `/tmp/ovh-b/ovh-resume.txt` (same file name, new text). Expect **one** imported-resume row still (not two).
5. [J7.5] Click its **Version history**. Expect `2 versions of this output`, **Viewing v2 of 2 (draft)**, summary **v1 to v2: 1 added, 1 changed**, the changed sentence with `four` struck through and `five` underlined, and an **ADDED** line `Mentored three analysts.` Click **Close**.
6. [J7.6] In **APPLICATION OUTPUTS** click **Edit draft** on the imported resume card. In the full-screen editor click the button **Version history** in the top bar. Expect the dialog above the editor with `2 versions of this output`. Press **Escape**: only the dialog closes; the editor stays open.

## Journey 8 — Phone width (390 × 800)

With the session reused, open `/world` in a 390px-wide window: **Journeys → Career Placement Agents → Regional Finance Lead → Version history** (Imported Resume row). Expect the dialog to fit inside the screen (about 8px margins), the page itself to have no horizontal scroll (document width 390), and the versions table to scroll inside its card if needed.

## Edge cases

- [E.1] An output with a single version shows the disabled slider and the explanation; the compare area asks for two different versions.
- [E.2] A version whose content cannot be read is still listed with a red message; comparing against it shows **One of the selected versions could not be read, so they cannot be compared.** The server logs the reason.
- [E.3] If the history cannot be loaded (network or server error) the dialog shows **Could not load version history: <reason>** with a **Retry** button and an error toast; it never shows an empty dialog.
- [E.4] The history is read-only: nothing in it approves, publishes or edits. Approving stays in **Approve for QR** (finalization gate).
- [E.5] `curl -s -w " %{http_code}" -b <cookie jar of a second harness member> http://localhost:<API_PORT>/api/resume-outputs/<first member's output id>/versions` prints `{"error":"Resume output not found"}` followed by status 404, and none of the first member's version data. (The second member is created with `scripts/create-test-member.mjs --email second@test.local` and signed in; the output id is read from the first member's Resume Output History. A member can never see someone else's history.)
- [E.6] Importing a file with a **different** name for the same opportunity creates a separate output (its own history).
