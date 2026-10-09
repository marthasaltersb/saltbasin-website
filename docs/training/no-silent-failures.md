# Training spec — no silent failures (snapshot, QR history, live data, chart and suggestion errors)

Version 1.1 · 2026-10-02 · traces to `docs/changes/no-silent-failures.md` v1.1, commits `8fc685e`, `dd58da6`, and `docs/training/proficiency-rules-and-live-qr.md` (the healthy paths).

Audience: a test agent driving a browser, and a person training on the feature. All data is fictional. Every journey makes a failure really happen in the test database and checks what the user sees. Follow the steps in order: later journeys depend on state left by earlier ones.

## Where things are

- **Sign in**: `/login`. The login endpoint allows 10 attempts per 15 minutes per address, so sign in once and reuse the session.
- **First visit only**: a "Career Portfolio Terms & Data Conditions" page. Tick all four checkboxes, click **I Agree — Continue**.
- **Member workspace (Classic Tools)**: `/member?workspace=1&scope=member`. The top bar has tabs **Career Master**, **My Resume**, **Output Templates**. (From `/world` the same place is the **Classic Tools** button.)
- **Career Master → Manual Intake**: tab **Career Master**, then the card **Manual Intake**. Sub-tabs **Skills (n)**, **Jobs (n)**, **Tools (n)**, **Certifications (n)**; **+ Add** opens a dialog "Add Entry"; clicking a row opens "Edit Entry". Dialog buttons: **Cancel**, **Save**.
- **My Resume → Resume Output History**: tab **My Resume**, section **Resume Output History**. Each output has **Approve for QR**, **View**, **Revoke QR**, **Archive**. An approved output shows its QR code and a link `/r/<slug>`.
- **QR page**: `/r/<slug>`, opened in a private window (no sign-in).
- **Template output**: `/output/resume` (the "Public link" under Primary Resume on My Resume).

## Fault injection (the only database commands in this spec)

Run from a shell on the test machine. Replace `<DB>` with the test database name (`PGHOST=/tmp`, port `5433`, user `postgres`).

```
FAULT A (Career Master cannot be read):
psql -h /tmp -p 5433 -U postgres -d <DB> -c "ALTER TABLE career_jobs RENAME TO career_jobs_held"
FAULT B (proficiency cannot be resolved):
psql -h /tmp -p 5433 -U postgres -d <DB> -c "ALTER TABLE career_proficiency_assertions RENAME TO career_proficiency_assertions_held"
RESTORE (both):
psql -h /tmp -p 5433 -U postgres -d <DB> -c "ALTER TABLE IF EXISTS career_jobs_held RENAME TO career_jobs" -c "ALTER TABLE IF EXISTS career_proficiency_assertions_held RENAME TO career_proficiency_assertions"
```

Do **not** restart the server while a fault is in place (boot recreates the missing table empty). Always RESTORE before finishing, even if a step fails.

## Preconditions (fictional data)

P1. Sign in as the test admin (`ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` from the environment) and accept the terms.

P2. In **Career Master → Manual Intake** add, using **+ Add** then **Save** each time:
- Skills tab: **Process design** (category *Operations*, tier *Expert*, years 11, engagements 14, first used 2012) and **Forecast modeling** (*Strategy*, *Advanced*, 13, 8, 2013).
- Tools tab: **Ledgerly ERP** (category *ERP*, tier *Advanced*, first used 2019, roles 2) and **QuoteFlow CPQ** (*CPQ*, *Advanced*, 2014, 6). On both, leave "How it was used — proficiency category" as **(none)**.
- Certifications tab: **Ledgerly Certified Consultant**, issuer *Ledgerly*, status *Active*.
- Jobs tab: company **Northwind Advisory**, title **Senior Consultant**, start 2019-01, end 2023-06, function *Finance*, industry *Software*.
- Expect each tab count to rise: Skills (2), Jobs (1), Tools (2), Certifications (1).

P3. Two fictional outputs in Resume Output History. There is no screen for importing a document package, so use the repository's documented import path with the fictional package in Appendix A (save it as `pkg.json` outside the repository; never under `server/data/applicationPackages/`):
```
PUBLIC_BASE_URL=http://127.0.0.1:<PORT> node scripts/import-application-package.mjs pkg.json
```
Expect the output `resume_standard #<n> created` and `cover_letter #<n> created`. Open **My Resume**: Resume Output History lists **Example Corp - Cover Letter · cover letter** and **Example Corp - Resume**, both *Draft*, both with **Approve for QR**, and an amber banner "**2 technologies need a proficiency category** before any output can be approved or shared (Ledgerly ERP, QuoteFlow CPQ)…".

P4. A primary Resume template with career charts (needed only for Journey 7). The Output Templates editor in this build has no control that adds a career chart (that is the separate chart-gallery feature). If that gallery is present and offers **Proficiency Tiers**, **Trend Bars** and **Career Timeline**, add those three and click **Save & Set Primary**. Otherwise create the fixture once, from the browser console on any signed-in page of the app:
```js
fetch('/api/output-templates', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
  output_type: 'resume', name: 'Chart fixture', is_primary: true,
  config: { schemaVersion: 2, outputType: 'resume', meta: { roleLabel: '', industryLabel: '', portfolioVisible: false },
    layer1_header: { memberName: 'Pat Example', headerText: 'Fictional template fixture', memberTagline: '', contactEmail: '', websiteUrl: '', memberFooterLines: [], memberFooterLinks: [] },
    layer2_stats: { cards: [] },
    layer3_infographics: { items: [
      { id: 'c1', blockType: 'career-proficiency-bars', sourceKey: '', params: { title: 'Proficiency' }, order: 0, visible: true },
      { id: 'c2', blockType: 'career-trend-bars', sourceKey: '', params: { title: 'Experience trend', sourceKey: 'experience_years' }, order: 1, visible: true },
      { id: 'c3', blockType: 'career-duration-timeline', sourceKey: '', params: { title: 'Career timeline' }, order: 2, visible: true } ] },
    layer4_sections: { sections: [], densityMode: 'auto' } } }) }).then(r => r.status)
```
Expect `200`. If you cannot create it, mark Journey 7 **BLOCKED** (not failed) and say why.

## Journey 0 — Healthy baseline (no faults)

1. [J0.1] My Resume → on **Example Corp - Resume** click **Approve for QR**; accept the browser confirm "Approve "Example Corp - Resume" as the final version for its QR code?".
   - Expect a dialog **Set how each technology was used** listing **Ledgerly ERP** and **QuoteFlow CPQ**, each with a dropdown (options *Choose…*, *Hands-on (suggested)*, *Integration design*, *Adjacent exposure*).
   - Expect **no** line containing "Suggestions are unavailable".
2. [J0.2] In each dropdown choose **Hands-on (suggested)**, click **Save to Career Master and continue**.
   - Expect the dialog to close, a toast "Approved — private QR link created (copied to clipboard).", **no** red toast, and under the output a QR image and a link `/r/<slug>`. Note this link as **RESUME LINK**.
3. [J0.3] On **Example Corp - Cover Letter** click **Approve for QR**, accept the confirm.
   - Expect no dialog (every technology now has a category), the same success toast, and a second link. Note it as **COVER LINK**.
4. [J0.4] Open RESUME LINK in a private window.
   - Expect the document, then a dark banner starting "**LIVE DATA — matches the approved printed version**". Expect **no** alert box on the page.
5. [J0.5] Back in Career Master → Tools → **+ Add**, add **Pipeline Tracker** (category *Sales Operations*, tier *Proficient*, first used 2021, roles 3, "How it was used" **(none)**), **Save**.
   - Expect Tools (3). On My Resume expect the amber banner "**1 technology needs a proficiency category** … (Pipeline Tracker)".

## Journey 1 — A Career Master change that QR history cannot record

1. [J1.1] Career Master → Skills → click the row **Process design** (dialog "Edit Entry"). Leave the dialog open. Change **Years experience** from 11 to **12**.
2. [J1.2] [cli] `psql -h /tmp -p 5433 -U postgres -d <DB> -c "ALTER TABLE career_jobs RENAME TO career_jobs_held"` (**FAULT A**).
3. [J1.3] Click **Save** in the dialog. Wait 4 seconds.
   - Expect a toast "Saved" and a second toast "Failed to load career master data: Failed to load career catalogs" (the list cannot refresh; that is expected, not silent).
4. [J1.4] Open **My Resume** (reload the page if you were already on it).
   - Expect **both** approved outputs (Cover Letter and Resume) to show, under their metadata line, a line starting "**QR history could not record a Career Master change (**" followed by a date/time, then `): relation "career_jobs" does not exist. It retries on your next Career Master save or when the QR page is opened.`
5. [J1.5] The Resume Output History banner still lists Pipeline Tracker (the page itself still loads).

## Journey 2 — The QR page when live data cannot be loaded

(FAULT A still in place.)

1. [J2.1] Open COVER LINK in a private window.
   - Expect an alert box: "**Live career data could not be loaded right now.** Showing the recorded states only; the newest one may be behind Career Master."
   - Expect the dark banner to start "**RECORDED DATA —**" (not "LIVE DATA"). The document text above is unchanged.
2. [J2.2] Open RESUME LINK in a private window.
   - Expect the same alert and a banner starting "**RECORDED DATA —**" (words after the dash are not checked here; see J2.3).
3. [J2.3] On RESUME LINK (FAULT A still in place) the banner contains "**(live data unavailable)**" and the sentence under it begins "**Live career data could not be loaded, so these charts show the last recorded state.**" and does not contain "update from the Salt Basin Career Master".

## Journey 3 — Approving when the chart snapshot cannot be captured, and a failed suggestions lookup

1. [J3.1] [cli] `psql -h /tmp -p 5433 -U postgres -d <DB> -c "ALTER TABLE career_proficiency_assertions RENAME TO career_proficiency_assertions_held"` (**FAULT B**; FAULT A stays in place). Then run the import again with Appendix B's changed package (`pkg_v2.json`, identical except "eleven" becomes "twelve" in the resume summary):
   `PUBLIC_BASE_URL=http://127.0.0.1:<PORT> node scripts/import-application-package.mjs pkg_v2.json`.
   - Expect `resume_standard #<n> new_version` and `cover_letter #<n> unchanged`.
2. [J3.2] Reload **My Resume**. Expect the Resume has a new *Draft* version with **Approve for QR** (the earlier version still reads *Published* with its QR image, link and **Revoke QR**).
3. [J3.3] On the new Draft Resume click **Approve for QR**, accept the confirm.
   - Expect a dialog **Set how each technology was used** listing **Pipeline Tracker** only.
   - Expect, inside the dialog, an alert: "**Suggestions are unavailable (**" … `relation "career_proficiency_assertions" does not exist) — choose each category yourself.`
   - Expect the dropdown options to be *Choose…*, *Hands-on*, *Integration design*, *Adjacent exposure* with **no** "(suggested)" on any option.
4. [J3.4] Choose **Hands-on**, click **Save to Career Master and continue**.
   - Expect the dialog to close and a green toast "Approved — private QR link created (copied to clipboard)." followed by a **red** toast: `The chart snapshot for the printed version could not be captured (relation "career_jobs" does not exist). The QR page will say so and can't compare live data to print.`
   - Expect the new version to show a QR code and the **same** link as RESUME LINK (the link follows the lineage).
   - Expect the earlier version now reads *Approved* with no QR image.
5. [J3.5] Open RESUME LINK in a private window.
   - Expect an alert box: "**The printed version's chart snapshot was not captured when it was approved**, so changes since printing can't be compared. Live career data could not be loaded right now."
   - Expect **no** dark LIVE/RECORDED banner and no timeline slider (there is nothing to compare). The panel is **not** missing: the alert is the panel's content.

## Journey 4 — Template output charts that cannot load

(FAULT A and FAULT B still in place; precondition P4 done.)

1. [J4.1] Open `/output/resume` while signed in.
   - Expect the header "Pat Example" and **three** alert boxes, in this order, each in an amber box:
     - "**Proficiency: data could not be loaded.** Proficiency request failed (500). This is a loading error, not missing Career Master data — reload to retry."
     - "**Experience trend: data could not be loaded.** Career Master request failed (500). This is a loading error, not missing Career Master data — reload to retry."
     - "**Career timeline: data could not be loaded.** Career Master request failed (500). This is a loading error, not missing Career Master data — reload to retry."
   - Expect **not** to see "Not enough dated Career Master records to show a trend yet." or "No dated roles in Career Master yet." anywhere (those mean genuinely empty data; showing them here would be a silent failure).

## Journey 5 — Restore, and the next save clears every error

1. [J5.1] [cli] `psql -h /tmp -p 5433 -U postgres -d <DB> -c "ALTER TABLE IF EXISTS career_jobs_held RENAME TO career_jobs" -c "ALTER TABLE IF EXISTS career_proficiency_assertions_held RENAME TO career_proficiency_assertions"` (**RESTORE**).
2. [J5.2] Reload `/output/resume`.
   - Expect no alert boxes; a **PROFICIENCY** list (Forecast modeling, Process design, QuoteFlow CPQ, Ledgerly ERP, Pipeline Tracker with levels), an **EXPERIENCE TREND** chart and a **CAREER TIMELINE**.
3. [J5.3] Career Master → Skills → click **Process design**, change **Years experience** from 12 back to **11**, **Save**. Wait 4 seconds.
   - Expect toast "Saved" and **no** "Failed to load career master data" toast; the row now reads 11.
4. [J5.4] Open **My Resume** (reload).
   - Expect **no** line "QR history could not record a Career Master change" on any output.
5. [J5.5] Open COVER LINK in a private window.
   - Expect no alert box, and a banner starting "**LIVE DATA —**" (the number of changes since print depends on what you changed; any count is fine).
6. [J5.6] Open RESUME LINK in a private window.
   - Expect the alert "The printed version's chart snapshot was not captured when it was approved, so changes since printing can't be compared. **Live career data is shown below.**" followed by the live charts. (The missing baseline is permanent for that approved version; it does not heal on restore, and the page says so.)

## Edge cases

- [E.1] Run last, after J5.6: on My Resume click **Revoke QR** on Example Corp - Cover Letter (confirm). Open COVER LINK in a private window: the page shows "This link isn't available".
- [E.2] Fault A only (no Fault B) when the gate dialog opens: it shows suggestions normally (Pipeline Tracker preselected "Integration design (suggested)") and no "Suggestions are unavailable" line, because the suggestions lookup does not read `career_jobs`.
- [E.3] Cancelling the gate dialog in Journey 3 shows the toast "Finalization cancelled — technologies still need a proficiency category." and leaves the output unchanged.
- [E.4] Expected network noise during the whole walk: HTTP 500 on `/api/career/master`, `/api/career/catalogs`, `/api/career/proficiency`, `/api/career/rollups`, `/api/career/resume-rollups` only while a fault is in place; one HTTP 404 on `/api/shared-outputs/<slug>` after the E.1 revoke step; one HTTP 409 on `/api/resume-outputs/<id>/share` per first approval that opens the gate dialog; HTTP 404 on `/api/members/me/profile` (a member with no profile row). Anything else is a finding.

## Appendix A — fictional package `pkg.json`

```json
{
  "packageKey": "northwind-demo-2026",
  "company": "Example Corp",
  "createdAt": "2026-09-30T13:00:01Z",
  "authors": ["Pat Example", "Sam Sample"],
  "outputs": [
    { "variant": "resume_standard", "outputType": "resume", "name": "Example Corp - Resume",
      "content": { "format": "document_blocks", "version": 1,
        "header": { "name": "Pat Example", "headline": "OPERATIONS STRATEGIST | ERP AND QUOTING SYSTEMS", "contact": "555-0100 | pat@example.test | Remote" },
        "blocks": [
          { "type": "heading", "text": "PROFESSIONAL SUMMARY" },
          { "type": "paragraph", "text": "Fictional operations strategist with eleven years of process design and ERP delivery." },
          { "type": "heading", "text": "SELECTED EXPERIENCE" },
          { "type": "bullet", "text": "Led a fictional ERP rollout across three business units." } ] } },
    { "variant": "cover_letter", "outputType": "cover_letter", "name": "Example Corp - Cover Letter",
      "content": { "format": "document_blocks", "version": 1,
        "header": { "name": "Pat Example", "headline": "COVER LETTER", "contact": "555-0100 | pat@example.test" },
        "blocks": [
          { "type": "paragraph", "text": "Dear Hiring Team," },
          { "type": "paragraph", "text": "This is a fictional cover letter used only for training and testing." } ] } }
  ]
}
```

## Appendix B — `pkg_v2.json`

Identical to Appendix A except the resume summary paragraph reads "Fictional operations strategist with **twelve** years of process design and ERP delivery."
