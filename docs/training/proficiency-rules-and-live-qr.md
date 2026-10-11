# Training spec — proficiency rules, technology categories, finalizing, and the live QR page

Audience: a member using the platform, and a test agent driving a browser. Each step says exactly what to do and what you should see. Data below is fictional.

## Where things are

- **Career Master → Proficiency & Rollups**: World Shell (`/world`) → Career Master island → tab **Proficiency & Rollups**. Workspaces: `1 · Definitions`, `2 · Assess proficiency`, `3 · Rules & why`, `4 · Preview rollups`, `5 · Resume rollups`. At 390px wide the tab row wraps (about one tab per row, because the card is roughly 285px wide); all five stay reachable and tapping each opens its workspace.
- **My Resume → Resume Output History**: Classic Tools / AdminShell → **My Resume** tab, section **Resume Output History**.
- **QR page**: the link `/r/<slug>` shown under an approved output (also what its QR code opens).

## Preconditions (set up once)

1. [P.1] Log in.
2. [P.2] Career Master → **Manual Intake**: add
   - Skill **Process design**, category *Operations*, years 11, engagements 14.
   - Skill **Forecast modeling**, category *Strategy*, first used 2013, engagements 8.
   - Tool **Ledgerly ERP**, category *ERP*, first used 2019, roles 2, *leave "How it was used" blank*.
   - Tool **QuoteFlow CPQ**, category *CPQ*, first used 2014, roles 6, *leave "How it was used" blank*.
   - Certification **Ledgerly Certified Consultant**, status *Active*.
3. [P.3] Have at least one output in **Resume Output History** (import one, or generate one).

Methodology reminder (shown on screen): points = years × 1 (max 15) + engagements × 0.5 (max 10) + certification bonus × 1. Levels: Exposure 0 · Foundational 2 · Proficient 4 · Advanced 7 · Expert 10 points.

## Journey 1 — See each level and why

1. [J1.1] Open Proficiency & Rollups → click **3 · Rules & why**.
   - Expect three cards: **Formula in use**, **Certification bonuses**, **Levels and why**.
   - Expect **Salt Basin methodology** with a **LOCKED** tag, its radio selected.
2. [J1.2] In **Levels and why**, find **Ledgerly ERP**.
   - Expect *Level shown* **Advanced**, *Decided by* **Salt Basin methodology**, *Points behind it* **8 pts** with lines "Years performed: 7 (from first-used year) × 1 = 7" and "Engagements / roles applied in: 2 × 0.5 = 1".
   - Expect *Methodology alone* **Advanced · 8 pts**.
3. [J1.3] Expect an amber banner above the table: "**2 technologies need a proficiency category** (Ledgerly ERP, QuoteFlow CPQ)…", and under each of those tools' dropdowns: "Required before any output can be finalized".

## Journey 2 — Set how a technology was used (saves to Career Master)

1. [J2.1] In **Levels and why**, Ledgerly ERP row, column **How it was used**, choose **Integration design**.
   - Expect a toast "Ledgerly ERP: Integration design (saved to Career Master)".
   - Expect the "Required…" note on that row to disappear and the banner count to drop to 1.
2. [J2.2] Open Career Master → **Manual Intake** → Tools → Ledgerly ERP.
   - Expect its "How it was used — proficiency category" field to read **integration_design**.

## Journey 3 — Override one level by hand

1. [J3.1] In **Levels and why**, row **Forecast modeling** (13 years + 4 = 17 pts → Expert), column **Your override**, choose **Advanced**.
   - Expect toast "Forecast modeling set to Advanced (marked †)".
   - Expect *Level shown* **Advanced †**, *Decided by* **Your override †**, *Points behind it* "Set by hand", *Methodology alone* **Expert · 17 pts**.
   - Expect the paragraph under "Levels and why" to end with a sentence saying levels marked † are user-defined, not Salt Basin methodology-driven.
2. [J3.2] To undo, choose **Use formula** in the same dropdown.
   - Expect the row back to **Expert**, **Salt Basin methodology**.

## Journey 4 — Certification bonus

1. [J4.1] In **Certification bonuses**, click **+ Add certification bonus**.
2. [J4.2] Choose certification **Ledgerly Certified Consultant**, bonus points **3**, keep "Count even if lapsed" ticked, click chip **Ledgerly ERP · tool** (it turns dark), click **Save bonus**.
   - Expect toast "Certification bonus saved" and a line "Ledgerly Certified Consultant → +3 pts to Ledgerly ERP".
   - Expect Ledgerly ERP to read **Expert**, **11 pts**, with "Certification bonus points: 3 × 1 = 3" and "↳ Ledgerly Certified Consultant +3".
3. [J4.3] Click **Delete** on that bonus and confirm.
   - Expect Ledgerly ERP back to **Advanced, 8 pts**.

## Journey 5 — Your own formula

1. [J5.1] In **Formula in use**, on the Salt Basin methodology row click **Duplicate**.
   - Expect a gold-bordered editor "New formula" with name "My formula", an inputs table and a level-threshold table.
2. [J5.2] Change the *Cap* on **Years performed** to **10**; change the *Minimum points* for **Expert** to **12**. Click **Save and use this formula**.
   - Expect toast "Now using your formula — affected levels are marked †", the **My formula** row selected.
   - Expect every row's *Decided by* to read **Your formula †** (overrides still read **Your override †**); Process design's breakdown reads "Years performed: 11 (capped at 10) × 1 = 10".
3. [J5.3] Click the **Salt Basin methodology** radio.
   - Expect it selected immediately, then toast "Now using the Salt Basin methodology", and rows back to **Salt Basin methodology** without †.
4. [J5.4] Try to edit the methodology: click **View** — expect "(read-only)" and no inputs.

## Journey 6 — Finalizing requires every technology's category

1. [J6.1] Make sure one tool still has no category (e.g. QuoteFlow CPQ).
2. [J6.2] Open **My Resume → Resume Output History**.
   - Expect an amber banner: "**1 technology needs a proficiency category** before any output can be approved or shared (QuoteFlow CPQ)…".
3. [J6.3] On any output click **Approve for QR** (or **Approve** / **Publish**) and confirm.
   - Expect a dialog "**Set how each technology was used**" listing QuoteFlow CPQ with a dropdown preset to a value marked "(suggested)".
4. [J6.4] Choose **Hands-on**, click **Save to Career Master and continue**.
   - Expect the dialog to close, the approval to complete (for Approve for QR: toast "Approved - private QR link created…", a QR code and link under the output), and the banner gone.

## Journey 7 — The live QR page

1. [J7.1] Open the output's link `/r/<slug>` (or scan its QR code) in a private window.
   - Expect the approved document, then a dark banner "**LIVE DATA — matches the approved printed version**" (or "…N changes since the approved printed version") stating the approval date. The banner is dark (white text) in both the zero-change and changes states; only its left stripe differs (green with zero changes, gold with changes). The last sentence depends on the wording state: if the wording is unchanged and the output is not career-bound, "The document text above always stays exactly as approved."; if career-bound and unchanged, "The document wording currently matches the printed version."; if the wording changed since approval, "The document wording has changed since approval; use the notice at the top of the page to switch between the printed and current wording."
2. [J7.2] Back in Career Master, change a job title (Manual Intake → Jobs) and save. Wait ~3 seconds. Reload the QR page.
   - Expect "LIVE DATA — 1 change since the approved printed version" and a line "Changed: <company> — printed <old title, years · industry> → now <new title, years · industry>".
3. [J7.3] Use the slider **Data timeline — slide from the printed version to live**: drag to the far left.
   - Expect "Viewing Approved · printed — exactly what the printed copy shows." and charts as printed.
4. [J7.4] On a chart click **Salt particles**: expect grains falling into columns, settling with a gold line and value on top; hover a column → tooltip with its name and value. Click **Table**: expect rows with a **Since printed** column reading Same / Changed.
5. [J7.5] Set a tool category or override a level, wait ~3 seconds, reload — expect the change listed (e.g. "Changed: Ledgerly ERP — printed Advanced · Integration design → now Advanced · Hands-on", or a level change such as "Changed: Forecast modeling — printed Expert → now Advanced (user-defined)"; J2 already set Integration design before approval, so it is part of the printed side).

## Journey 8 — Rules & why inside the Output Template editor

1. [J8.1] World Shell (`/world`) -> **Output Templates** island (title "Output Templates"). Open or create a template so the editor with the live preview opens.
   - Expect a tab row: Header / Footer, Stat Cards, Infographics, Sections, **Rules & why**.
2. [J8.2] Click **Rules & why**.
   - Expect the card "Rules & why" with its intro line ("Configure how proficiency levels are calculated...") and the same proficiency rules panel as Journey 3-5 (Formula in use, Levels and why).
3. [J8.3] On the Infographics tab make sure the Proficiency chart is in the template (add it if it is not), then override one level by hand (as Journey 3, step 1-2); the preview shows proficiency only when that chart is present.
   - Expect the Infographics tab thumbnails and the preview on the right to refresh with the new level.
4. [J8.4] At 390px wide, expect the tab row to wrap and **Rules & why** to stay reachable, and the whole editor (presets, Preset Info, tab content, preview) to stack in a single column that fits the screen: no sideways panning inside the page or its scroller to read the Rules & why panel.
5. [J8.5] Add a fictional tool with no category (Career Master → Manual Intake → Tools, name Fiscalis TMS). Then open **My Resume → Resume Output History**, click **Approve for QR** on any output and, in the dialog "**Set how each technology was used**", click **Cancel**.
   - Expect toast "Finalization cancelled — technologies still need a proficiency category.", the dialog closed, and the output unchanged (no approval, no new QR link). This runs after Journey 7 on purpose: adding a tool after approval changes what the live QR page counts in J7.1 and J7.2.

## Edge cases

- [E.1] Empty Career Master: Rules & why shows "No skills or tools yet — add them in Career Master → Manual Intake."; QR page shows no charts section.
- [E.2] A link that was revoked or never approved: QR page shows "This link isn't available".
- [E.3] Saving a formula with an unknown input or no thresholds: error toast, nothing saved.
- [E.4] Editing or deleting the Salt Basin methodology via the API: refused (403).
