# Training spec — Career-bound outputs, overrides, and the Career Sources to Review queue

Version 1 · 2026-10-02 · feature `career-bound-outputs` · change spec: `docs/changes/career-bound-outputs.md`

Audience: a person using the platform, and a test agent driving a browser. Each step says exactly what to do and what you should see. All data below is fictional. Buttons and labels are written exactly as they appear; some headings display in capitals (CSS), which is fine — match the words, not the capitalisation.

Use a **freshly seeded database**. Do the preconditions once, then run the journeys **in order** (they build on each other).

## Where things are

- **World Shell**: `/world`. Top bar buttons: **World**, **Journeys**, **Classic Tools**.
  - **Journeys** lists one card per module. **Career Master** (subtitle "Open Career Master journey") opens the Career Master tables. **Career Sources to Review** (subtitle "Open configuration") opens the review queue.
  - **Back to World** (top left of any opened module) returns.
- **Classic Tools**: `/world` → **Classic Tools**. Row of views; click **Network Relationship Management**. Its tab row reads: My Profile · **My Resume** · Net Works · **Career Master** · Output Templates · **Career Sources to Review** · Network Contacts · Inbox.
- **My Resume**: card **Career-bound resumes** (name field, **New career-bound resume from Career Master**, **Career Sources to Review**) above the list **Resume Output History**. If a consent screen appears the first time, tick every box and click **I Agree**.
- **Career-bound resume editor**: opens as a dialog from My Resume (**Edit sections** on a row, or after creating one). Its parts: **Output name**, **Save changes**, **Career Sources to Review (N open)**, a column "Experience from Career Master" with one card per job, cards "Skills from Career Master", "Tools & technologies from Career Master", "Certifications from Career Master", and on the right **Preview**.
- **Review queue** (**Career Sources to Review**): card "Import a tailored package as a source", then task cards, then "Imported resumes you can convert to career-bound".
- **QR page**: the `/r/<slug>` link shown under an approved output in Resume Output History.

## Preconditions (create through the UI)

1. Log in (test admin account). Open `/world`, click **Journeys**, click the **Career Master** card. Click the tab **Jobs (0)**, **+ Add**, fill and **Save**:
   - Company `Harborline Freight Systems`, Title `Finance Systems Lead`, Start Date `Jan 2018`, End Date `Mar 2022`, Key Metrics & Achievements `Cut month-end close from 9 days to 4.`
   - Company `Northgate Analytics`, Title `Senior Analyst`, Start Date `Apr 2022`, End Date `Present`.
2. Tab **Skills**, **+ Add**, **Save**: Skill `Process design`, Years Experience `11`, # Engagements `14`. Then Skill `Forecast modeling`, First Used (Year) `2013`, # Engagements `8`.
3. Tab **Tools**, **+ Add**: Name When Used `Ledgerly ERP`, First Used (Year) `2019`, # Roles `2`, and set the select "How it was used — proficiency category …" to `hands_on`. **Save**.
4. Tab **Certifications**, **+ Add**: Certification Name `Ledgerly Certified Consultant`, Status `Active`. **Save**.
5. Expect the tab labels to read: Skills (2), Jobs (2), Tools (1), Certifications (1).

The package used in Journey 6 (paste exactly; it is fictional):

```json
{"packageKey":"demo-pkg-2026","company":"Fictional Corp","createdAt":"2026-10-01T09:00:00Z","authors":["Test Author"],"outputs":[{"variant":"resume_main","outputType":"resume","name":"Demo Package Resume","content":{"format":"document_blocks","version":1,"header":{"name":"Pat Example","headline":"FINANCE SYSTEMS","contact":"pat@example.test"},"blocks":[{"type":"heading","text":"EXPERIENCE"},{"type":"role","title":"Harborline Freight Systems | Finance Systems Lead","dates":"Jan 2018 – Mar 2022"},{"type":"bullet","text":"Led the ledger consolidation across four regions."},{"type":"bullet","text":"Introduced a weekly cash forecast for the executive team."},{"type":"role","title":"Westbrook Logistics | Operations Analyst","dates":"2015 – 2017"},{"type":"bullet","text":"Built the first carrier scorecard."},{"type":"heading","text":"SKILLS"},{"type":"paragraph","text":"Process design, Revenue recognition"},{"type":"heading","text":"TOOLS"},{"type":"paragraph","text":"Ledgerly ERP, QuoteFlow CPQ"}]}}]}
```

## Journey 1 — Create a career-bound resume from Career Master

1. `/world` → **Classic Tools** → **Network Relationship Management** → **My Resume**.
   - Expect the card **Career-bound resumes** with the text "A career-bound resume reads its roles, bullets, skills, tools and certifications from Career Master…", a name field, and the buttons **New career-bound resume from Career Master** and **Career Sources to Review**.
2. Replace the name field with `Finance systems resume`, click **New career-bound resume from Career Master**.
   - Expect a dialog "Career-bound resume editor". Preview (right) contains, in this order: `Harborline Freight Systems | Finance Systems Lead` with `Jan 2018 – Mar 2022`; `Northgate Analytics | Senior Analyst` with `Apr 2022 – Present`; a SKILLS heading with `Process design, Forecast modeling`; `Ledgerly ERP` under the tools heading; `Ledgerly Certified Consultant` under CERTIFICATIONS. No bullets yet.
   - Expect status text "Status: draft". **Save changes** is disabled (nothing changed).

## Journey 2 — Add bullets (Career Master library vs this output only)

In the editor, in the **Harborline Freight Systems** card:

1. Type `Led the ledger consolidation across four regions.` into the box labelled "New bullet for Harborline Freight Systems", click **Add to Career Master and this output**.
   - Expect a toast "Added to Career Master". A bullet box "Bullet 1 for Harborline Freight Systems" appears holding exactly that text.
2. Type `Presented results to the board quarterly.` into the same new-bullet box, click **Add to this output only**.
   - Expect "Bullet 2 for Harborline Freight Systems" with an `OUTPUT-ONLY` badge.
3. Click **Save changes**.
   - Expect a toast "Saved". Preview now lists both bullets under Harborline; the second ends with an `output-only` badge. The first has no badge.

## Journey 3 — Override one field, then revert it to Career Master

1. In "Bullet 1 for Harborline Freight Systems" replace the text with `Led the ledger consolidation across five regions.`
   - Expect the badge `OVERRIDDEN FOR THIS OUTPUT`, a button **Revert to Career Master**, and the line `Career Master: Led the ledger consolidation across four regions.`
2. Click **Save changes**. Expect the Preview bullet to read "...five regions." followed by an `output-only` badge.
3. Click **Revert to Career Master** (next to the badge).
   - Expect the box to read "...four regions." again and the badge to disappear.
4. Click **Save changes**. Expect the Preview to read "...four regions." with no "five regions" anywhere.

## Journey 4 — Skills, tools and certifications bound to Career Master

In the card **Skills from Career Master**:

1. Untick **Include Forecast modeling**. In the box "Wording for Process design" type `Process design (finance)`.
   - Expect `OVERRIDDEN FOR THIS OUTPUT` beside that row with **Revert to Career Master**.
2. **Save changes**. Expect Preview SKILLS to read `Process design (finance)` and not mention Forecast modeling.
3. Click **Revert to Career Master** in the Skills card, then **Save changes**. Expect Preview SKILLS to read `Process design` (no "(finance)").
4. Click **Close** (dialog top right). Expect, in Resume Output History, a row `Finance systems resume` with the label `Career-bound` and an **Edit sections** button.

## Journey 5 — A Career Master edit flows into the output with no re-save

1. **Classic Tools** → **Network Relationship Management** → **Career Master** → tab **Jobs**. Click the row `Harborline Freight Systems`. Change Title to `Finance Systems Director`, click **Save**.
2. Go to **My Resume**. On the row `Finance systems resume` click **View** (exact word).
   - Expect the read-only view to show `Harborline Freight Systems | Finance Systems Director`. Click **Close**.

## Journey 6 — A package enters Career Master through the review queue

1. Reachability from the World Shell: `/world` → **Journeys** → click the card **Career Sources to Review**.
   - Expect the heading "Career Sources to Review", the card "Import a tailored package as a source", and the text "Nothing needs review right now."
2. Click the box labelled "Package JSON", paste the package JSON from Preconditions, click **Import and check against Career Master**.
   - Expect "Filed 1 output; 5 new tasks". Five cards appear under "Tailored package vs Career Master (5)", tagged: **Package differs from Career Master**, **New bullet variant**, **Add job**, **New skill**, **New tool**.
3. Under "Imported resumes you can convert to career-bound" the row `Demo Package Resume` says "5 review tasks for this package still need a decision before it can be converted." and **Convert to career-bound output** is disabled.
4. The **Package differs from Career Master** card is titled `Harborline Freight Systems - job title`. Expect the left box "Career Master now" = `Finance Systems Director` and the right box "Package says" = `Finance Systems Lead`. Click **Reject - leave Career Master as is**. Expect the card to disappear.
5. Click **Approve - apply to Career Master** on each of the remaining four cards (New bullet variant, Add job `Westbrook Logistics - Operations Analyst`, New skill `Revenue recognition`, New tool `QuoteFlow CPQ`). Each card disappears after its click. The New tool card says "you will be asked how it was used before any output is finalized".
6. Paste the same package again and click **Import and check against Career Master**. Expect "Filed 1 output; 0 new tasks; 1 already decided or merged." and no task cards (the rejected title is remembered; the approved items now exist).
7. Check Career Master: **Classic Tools** → **Career Master**. Expect tabs Jobs (3), Skills (3), Tools (2). Jobs lists `Westbrook Logistics` and Harborline's title is still `Finance Systems Director` (the rejection kept Career Master as it was).
8. **Classic Tools** → **Career Sources to Review**. On the row `Demo Package Resume` click **Convert to career-bound output**. Expect "Career-bound draft created." with a button **Open the editor**; click it.
   - Expect a dialog "Career-bound output editor". In the Harborline card the Title box reads `Finance Systems Lead` with `OVERRIDDEN FOR THIS OUTPUT` and the line `Career Master: Finance Systems Director`. A **Westbrook Logistics** card exists. Preview contains `Westbrook Logistics | Operations Analyst`, `Introduced a weekly cash forecast for the executive team.`, `Process design, Revenue recognition` and `Ledgerly ERP, QuoteFlow CPQ`. Click **Close**.
9. Reachability from the editor: **My Resume** → on the row `Demo Package Resume (career-bound)` click **Edit sections**. In the Harborline card click **Revert to Career Master** beside the Title, then **Save changes**. Expect Preview `Harborline Freight Systems | Finance Systems Director`.
10. Click the button `Career Sources to Review (0 open)` at the top of the editor. Expect the review queue (heading "Import a tailored package as a source").

## Journey 7 — Finalizing goes through the gate

1. **My Resume**. Above the history list expect the amber notice "1 technology needs a proficiency category … (QuoteFlow CPQ)".
2. On the row `Demo Package Resume (career-bound)` click **Approve**.
   - Expect a dialog "Set how each technology was used" listing `QuoteFlow CPQ` only. Choose **Hands-on** in the select "How QuoteFlow CPQ was used", click **Save to Career Master and continue**.
   - Expect the row status to read `approved`.
3. Click **Approve for QR** (accept the browser confirmation). Expect a link `/r/<slug>` and a QR image under the row (no gate dialog now).
4. Open that link. Expect `Pat Example`, `Westbrook Logistics | Operations Analyst`, and **no** "wording … has changed" banner.

## Journey 8 — The QR page shows when the wording changed

1. **Career Master** → **Jobs** → row `Westbrook Logistics`, Title `Operations Manager`, **Save**.
2. Reload the `/r/<slug>` page. Expect a banner "The wording of this document has changed since the printed version was approved. Showing the current wording." and the document showing `Westbrook Logistics | Operations Manager`.
3. Click **Show printed wording**. Expect `Westbrook Logistics | Operations Analyst`. The link then reads **Show current wording**.
4. **My Resume** → row `Demo Package Resume (career-bound)` → **Edit sections**. Expect the notice "This version is published. Saving will not change it …" (or "approved"). Change the Harborline Title box to `Finance Systems Lead`, click **Save changes**.
   - Expect "Status: draft" in the editor header (a new draft version). **Close**. Resume Output History now has two rows named `Demo Package Resume (career-bound)`; the approved one is unchanged.

## Edge cases

- **Revert is per field.** Reverting the title does not revert the bullets; an overridden bullet and an overridden title each have their own **Revert to Career Master**.
- **Removed from Career Master.** If a Career Master skill/job/bullet used by an output is deleted, the editor shows a notice such as "Career Master job #… no longer exists; it is left out of this output." Nothing is silently replaced.
- **Convert before deciding** is refused (Journey 6 step 3); calling it anyway returns "N reconciliation task(s) for this package still need a decision (approve or reject) before it can be converted."
- **Sync failure.** If a Career Atom sync fails after an approval, a toast says "Applied to Career Master, but the Career Atom sync failed: …" and the task appears under "Applied - sync failed" with **Retry sync**.
- **Invalid package.** Pasting text that is not JSON shows "That is not valid JSON: …" in a red box; a package with an unsupported output shows the server's message. Nothing is filed.
- **Expected browser noise.** In the sandbox, requests for external fonts fail (`ERR_CERT_AUTHORITY_INVALID`, `ERR_TUNNEL_CONNECTION_FAILED`) and Journey 7 step 2 produces one expected `409` from the gate. Anything else in the console is a failure.
