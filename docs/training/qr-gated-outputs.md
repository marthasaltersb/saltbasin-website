# Training spec: QR-gated tailored application outputs

Version 1 · 2026-10-02 · feature key `qr-gated-outputs` · change spec: `docs/changes/qr-gated-outputs.md`

Audience: a member using the platform, and a test agent driving a real browser. Every step says what to do and what you should see. All data is fictional. Replace `<BASE>` with the app's address (for example `http://127.0.0.1:3802`) and `<REPO>` with the repository checkout.

Labels are written as they appear in the DOM; some screens display them in capitals through styling.

## Where things are

- **Sign in**: `<BASE>/login`. After the first sign-in a "Career Portfolio Terms & Data Conditions" screen may appear: tick every checkbox, then click **I Agree — Continue**.
- **My Resume**: open `<BASE>/world`, click **Classic Tools** (top), click the top tab **Network Relationship Management**, then the sub tab **My Resume**. The section **Resume Output History** is lower on the page (below the Primary Resume card).
- **Career Master**: same place, sub tab **Career Master**, then the button **Tools (n)**.
- **Private link page**: `<BASE>/r/<slug>`; it is also what the QR code opens.
- A **private window** means a fresh browser context with no cookies and no sign-in.

## Preconditions (fictional data)

Do these once, in order, on a fresh database. A fresh database must show the **My Resume** sub tab on first boot (a defect where it only appeared after a second boot was fixed in this release; see the change spec).

1. **Sign in** at `<BASE>/login` as the seeded administrator (the `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` of the environment). Sign in once and reuse the session; sign-in is limited to 10 attempts per 15 minutes. Accept the terms screen if it appears.
2. **Add a technology with no category** (this is what makes the finalization gate appear). Go to Career Master, click **Tools (0)**, click **+ Add**, and fill:
   - Name When Used: `Harborbook ERP`
   - Category: `ERP`
   - First Used (Year): `2019`
   - # Roles: `2`
   - leave "How it was used ..." as `(none)`

   Click **Save**. Expect the button to read **Tools (1)**.
3. **Create the fictional package file** (outside the repository; never commit it). Run:

   ```bash
   mkdir -p /var/tmp/qr-demo
   cat > /var/tmp/qr-demo/pkg-v1.json <<'EOF'
   {
     "packageKey": "harbor-demo-2026-10",
     "company": "Harbor Demo Works",
     "createdAt": "2026-09-30T13:00:01Z",
     "authors": ["Avery Example", "Jordan Sample"],
     "outputs": [
       { "variant": "resume_main", "name": "Harbor Demo Resume", "outputType": "resume",
         "content": { "format": "document_blocks", "version": 1,
           "header": { "name": "Avery Example", "headline": "Operations strategist with 12 years of fictional experience", "contact": ["avery@example.test", "Example City"] },
           "blocks": [
             { "type": "heading", "text": "Summary" },
             { "type": "paragraph", "text": "Leads fictional process redesign programs." },
             { "type": "heading", "text": "Experience" },
             { "type": "role", "title": "Director of Operations, Example Freight Co", "dates": "2019 - 2024" },
             { "type": "bullet", "text": "Cut fictional cycle time by 30 percent." }
           ] } },
       { "variant": "cover_letter", "name": "Harbor Demo Cover Letter", "outputType": "cover_letter",
         "content": { "format": "document_blocks", "version": 1,
           "header": { "name": "Avery Example", "headline": "Cover letter", "contact": ["avery@example.test"] },
           "blocks": [ { "type": "paragraph", "text": "Dear hiring team, this is a fictional cover letter." } ] } }
     ]
   }
   EOF
   sed 's/"Leads fictional process redesign programs."/"Revised summary: leads fictional process redesign programs."/' /var/tmp/qr-demo/pkg-v1.json > /var/tmp/qr-demo/pkg-v2.json
   ```

4. **Import version 1** (this one command is the only non-UI precondition; there is no import screen):

   ```bash
   cd <REPO> && PUBLIC_BASE_URL=<BASE> ADMIN_EMAIL=<admin email> ADMIN_INITIAL_PASSWORD=<admin password> \
     node scripts/import-application-package.mjs /var/tmp/qr-demo/pkg-v1.json
   ```

   Expect exactly:
   ```
   resume_main            #<n>  created
   cover_letter           #<n>  created
   ```
   followed by a "Next: My Resume ..." hint.

## Journey 1: imported outputs appear with authors, created and modified dates

1. Open My Resume and scroll to **Resume Output History** (reload the page if you were already on it).
   - Expect an amber notice: "**1 technology needs a proficiency category** before any output can be approved or shared (Harborbook ERP). You'll be asked to set it when you approve; your choices save to Career Master."
   - Expect two cards: **Harbor Demo Cover Letter** with the suffix "cover letter", and **Harbor Demo Resume**; each shows a small **IMPORTED** tag.
2. Read each card.
   - Expect "Generated <date and time> · Draft".
   - Expect the metadata line exactly: `Authors: Avery Example; Jordan Sample · Created Sep 30, 2026 · Modified <today, as Mon D, YYYY> · Not yet approved`.
   - Expect the buttons **View**, **Download PDF**, **Approve**, **Approve for QR**, **Archive**, and no QR image or link.

## Journey 2: view an output in the platform

1. On **Harbor Demo Resume** click **View**.
   - Expect a dialog titled **Harbor Demo Resume** with "Read-only - no edits can be made here."
   - Expect the document: name `Avery Example`, headline `Operations strategist with 12 years of fictional experience`, contact `avery@example.test`, heading `Summary`, text `Leads fictional process redesign programs.`, heading `Experience`, role `Director of Operations, Example Freight Co` with `2019 - 2024`, and the bullet `Cut fictional cycle time by 30 percent.`
   - Expect at the bottom the same metadata line as Journey 1 (ending "Not yet approved") and a **Download PDF** link.
2. Click **Close**. Expect the dialog to disappear.

## Journey 3: Approve for QR through the technology-category gate

1. On **Harbor Demo Resume** click **Approve for QR**.
   - Expect a browser confirm dialog starting `Approve "Harbor Demo Resume" as the final version for its QR code?` and containing "You'll be recorded as the approver." Accept it.
2. Expect a dialog titled **Set how each technology was used** listing **Harborbook ERP** with a dropdown whose options are `Choose…`, `Hands-on (suggested)`, `Integration design`, `Adjacent exposure`.
   - Expect `Hands-on (suggested)` to be preselected (the suggestion comes from the tool's level) and the button **Save to Career Master and continue** to be enabled. (If you reset the dropdown to `Choose…`, the button becomes disabled until a category is chosen.)
3. Choose `Hands-on (suggested)` (already selected) and click **Save to Career Master and continue**.
   - Expect two toasts: "Saved to Career Master: 1 technology categorised" and "Approved - private QR link created (copied to clipboard)."
   - Expect the amber notice about technologies to be gone after the list refreshes.
4. Read the **Harbor Demo Resume** card.
   - Expect "Generated ... · Published".
   - Expect the metadata line to end `Approved by <your display name or email> on <today, Mon D, YYYY>` (for the seeded administrator this is the email address).
   - Expect a QR image (64 px square), a link of the form `<BASE>/r/<SLUG1>` where `<SLUG1>` is 24 characters of letters, digits, `-` and `_`, and the links **Copy link**, **QR (SVG)**, **QR (PNG)**.
   - Expect the buttons **View**, **Download PDF**, **Revoke QR**, **Archive**, and no **Approve for QR** button on this card.
   - Record `<SLUG1>`.
5. Open Career Master, **Tools (1)**, click Harborbook ERP. Expect its field "How it was used - proficiency category" to read `hands_on`.

## Journey 4: the QR image and link in My Resume

1. Click **Copy link**. Expect the toast "Link copied." Paste the clipboard into the address bar: it equals the link on the card.
2. Click the QR image. Expect a new tab opening `<BASE>/r/<SLUG1>` (the document renders).
3. Click **QR (SVG)** and **QR (PNG)**. Expect downloads named `qr-<id>.svg` and `qr-<id>.png`; the SVG is an image of a QR code, the PNG is at least 600 px wide.

## Journey 5: open the link in a private window

Use a fresh browser context with no cookies and open `<BASE>/r/<SLUG1>`.

1. Expect the page (no sign-in prompt) with:
   - Browser tab title `Harbor Demo Resume`.
   - Top bar "Salt Basin Net Works" with "Private link · Harbor Demo Resume" and the buttons **Download PDF** and **Print**.
   - The document exactly as in Journey 2 (Summary text `Leads fictional process redesign programs.`).
   - A QR code with the caption "Scan or click for current version".
   - A live-data panel (covered by the proficiency/live-QR spec; here only confirm it renders without an error).
   - A footer line exactly: `Authors: Avery Example; Jordan Sample · Created Sep 30, 2026 · Modified <today> · Approved by <approver> on <today>`.
2. Click the QR image. Expect to stay on `<BASE>/r/<SLUG1>` (the QR is a link to its own slug).
3. Check the page's privacy headers:

   ```bash
   curl -s -D - -o /dev/null <BASE>/r/<SLUG1> | grep -i -E 'x-robots-tag|referrer-policy'
   curl -s -D - -o /dev/null <BASE>/api/shared-outputs/<SLUG1> | grep -i -E 'x-robots-tag|referrer-policy|cache-control'
   ```
   - Expect `X-Robots-Tag: noindex, nofollow, noarchive` and `Referrer-Policy: no-referrer` on both, and `Cache-Control: private, no-store` on the API response.
4. In the browser console or developer tools, expect `meta[name=robots]` with content `noindex, nofollow, noarchive`.

## Journey 6: the PDF carries a clickable QR to the same slug

1. On the private page click **Download PDF** (or open `<BASE>/api/shared-outputs/<SLUG1>/download.pdf`). Expect an HTTP 200 `application/pdf` with a filename like `Harbor-Demo-Resume-<id>.pdf`.
2. Save it as `/var/tmp/qr-demo/resume.pdf` and run:

   ```bash
   curl -s -o /var/tmp/qr-demo/resume.pdf <BASE>/api/shared-outputs/<SLUG1>/download.pdf
   grep -a -o '/URI ([^)]*)' /var/tmp/qr-demo/resume.pdf
   pdftotext /var/tmp/qr-demo/resume.pdf - | head -20
   ```
   - Expect three `/URI (<BASE>/r/<SLUG1>)` lines, all identical (the QR, its caption, the footer URL).
   - Expect the text to include `Avery Example`, `Scan or click for current version`, the authors/created/modified/approved line, and `Verified copy: <BASE>/r/<SLUG1>`.
3. In My Resume click **Download PDF** on the same card. Expect the same kind of PDF (HTTP 200).

## Journey 7: approving the cover letter creates its own, independent link

1. On **Harbor Demo Cover Letter** click **Approve for QR**; accept the confirm (`Approve "Harbor Demo Cover Letter" ...`).
   - Expect no technology-category dialog (the category is already set).
   - Expect the toast "Approved - private QR link created (copied to clipboard)." and a card with its own QR and a link `<BASE>/r/<SLUG2>`.
2. Expect `<SLUG2>` to differ from `<SLUG1>`. Open both in a private window: each shows its own document (the cover letter text `Dear hiring team, this is a fictional cover letter.`).

## Journey 8: approving a newer version moves the same slug to it

1. Import a changed version of the package:

   ```bash
   cd <REPO> && PUBLIC_BASE_URL=<BASE> ADMIN_EMAIL=<admin email> ADMIN_INITIAL_PASSWORD=<admin password> \
     node scripts/import-application-package.mjs /var/tmp/qr-demo/pkg-v2.json
   ```
   - Expect `resume_main  #<new id>  new_version` and `cover_letter  #<id>  unchanged`.
2. Reload My Resume. Expect a **new** **Harbor Demo Resume** card at the top with the later Generated time, status **Draft**, "Not yet approved", and an **Approve for QR** button. The older Harbor Demo Resume card still shows `<SLUG1>`.
3. On the new card click **Approve for QR** and accept the confirm. Expect no category dialog.
   - Expect the toast "Approved - private QR link created (copied to clipboard)."
4. Read both Harbor Demo Resume cards.
   - Expect the **new** card to be **Published** and to show the link `<BASE>/r/<SLUG1>` (the same slug as before).
   - Expect the **older** card to show status **Approved**, no QR image or link, no **Revoke QR**, and the buttons **Publish** and **Approve for QR**.
5. In a private window open `<BASE>/r/<SLUG1>`. Expect the new text `Revised summary: leads fictional process redesign programs.` (and no longer the old summary). The metadata footer shows the approval date.

## Journey 9: revoke makes the link unavailable and the slug is never reissued

1. On the card showing `<SLUG1>` click **Revoke QR** and accept the confirm (`Revoke this QR link? Anyone scanning an already-printed copy will see "link not available".`).
   - Expect the toast "QR link revoked."
   - Expect the card to lose its QR image, link, **Copy link**, **QR (SVG)**, **QR (PNG)** and **Revoke QR**; status becomes **Approved**; **Approve for QR** reappears.
2. In a private window open `<BASE>/r/<SLUG1>`.
   - Expect the heading **This link isn't available** and the text "The document behind this QR code has been withdrawn or replaced. Contact the sender for a current copy." No document content.
   - `curl -s -o /dev/null -w '%{http_code}\n' <BASE>/api/shared-outputs/<SLUG1>` prints `404`.
3. Click **Approve for QR** again on that card and accept.
   - Expect a link `<BASE>/r/<SLUG3>` where `<SLUG3>` differs from `<SLUG1>`.
   - In a private window `<BASE>/r/<SLUG1>` is still **This link isn't available**, and `<BASE>/r/<SLUG3>` shows the document.

## Journey 10: unknown or never-approved slugs show the same page

1. In a private window open `<BASE>/r/AAAAAAAAAAAAAAAAAAAAAAAA`.
   - Expect the heading **This link isn't available**, identical to Journey 9 step 2, with no hint whether the slug ever existed.
2. Open `<BASE>/r/short`. Expect the same page.
3. A document that was imported but never approved has no slug: on a card whose status is **Draft** there is no link anywhere. (The unapproved version has nothing to open.)

## Edge cases

- **Cancel the confirm**: click **Approve for QR**, then choose Cancel in the browser dialog. Expect nothing to change.
- **Cancel the gate**: do this before Journey 3 step 1's save (or add another tool in Career Master with "How it was used" left at `(none)` first). Click **Approve for QR**, accept the confirm, and click **Cancel** in "Set how each technology was used". Expect an error toast "Finalization cancelled — technologies still need a proficiency category." and the card to remain Draft with no link. The browser network log shows one expected HTTP 409 from `/api/resume-outputs/<id>/share` per time the gate appears; that is the gate, not a failure.
- **Re-importing the same package**: running the Journey 8 command again reports every output `unchanged` and adds no cards.
- **Archived outputs**: after **Archive** on a card, expect no **Approve for QR** button on it.
- **Sign-in limit**: more than 10 sign-in attempts in 15 minutes returns "Too many attempts - please try again in 15 minutes"; sign in once and reuse the session.
- **Privacy of the repository**: package JSON stays under `/var/tmp`; never add anything under `server/data/applicationPackages/` to git.
