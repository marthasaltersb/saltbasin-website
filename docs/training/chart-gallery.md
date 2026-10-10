# Training spec — chart gallery in the Output Template editor

Version 1 · 2026-10-02 · covers `docs/changes/chart-gallery.md` v1. Audience: a member and a test agent driving a browser. Follow literally. All data is fictional.

## Where things are

- World Shell (`/world`) -> top tab **Journeys** -> card **Output Templates** ("Open configuration"). Inside: pills **Resume**, **Proposal**, **Case Study**, **One-Pager**, **Build Summary**; below them the editor tabs **Header / Footer**, **Stat Cards**, **Infographics**, **Sections**, **Rules & why**; the **Live Preview** column is on the right of the same screen.
- Career data: World Shell -> Journeys -> **Career Master** -> **Manual Intake**.

## Preconditions (set up once)

Log in as a ready member. In Career Master -> Manual Intake add:

1. [P.1] Skills (Skill / Category / Years Experience / # Engagements / First Used):
   - **Process design**, *Operations*, 11, 14
   - **Forecast modeling**, *Strategy*, blank years, 8, first used 2013
   - **Pricing analytics**, *Strategy*, 6, 4
   - **Stakeholder reporting**, *Operations*, blank years, 3, first used 2020
2. [P.2] Tools: **Ledgerly ERP** (category *ERP*, first used 2019, # Roles 2, "How it was used" = *integration_design*); **QuoteFlow CPQ** (category *CPQ*, first used 2014, # Roles 6, "How it was used" = *hands_on*).
3. [P.3] Roles (Company / Title / Start / End / Industry): **Northwind Analytics Ltd**, Senior Analyst, Jan 2012, Dec 2015, Software; **Harbor Freight Labs**, Operations Lead, Jan 2016, Dec 2020, Logistics; **Brightfield Systems**, Director, Jan 2021, Present, Software.
4. [P.4] Case study (Engagements): Internal Name **Billing Revamp**, Employer **Brightfield Systems**, Client Display Name **Project Aster**, Industry Software, Period 2022, Key Metrics (one per line): `$40M+ recurring revenue automated` and `35% faster month-end close`.

Values below assume the current year is 2026 (Forecast modeling = 13 years). If the year differs, years shift by the difference and levels may change; note it in the result.

## Journey 1 — Find the gallery beside the live preview

1. [J1.1] Open World Shell -> **Journeys** -> **Output Templates** -> pill **Resume** -> tab **Infographics**.
   - Expect the heading "Infographics — pick a chart" and a section "Career charts — previews use your real Career Master data".
   - Expect six cards, in order: **Proficiency Tiers**, **Trend Bars**, **Outcome Tiles**, **Career Timeline**, **Skill Years Dots**, **Industry Share Bars**, each with a drawn thumbnail (not blank, no spinner), the text "Best for: ...", and a **+ Add** button.
   - Expect a "Classic charts" section with Bar Chart (Horizontal), Bar Chart (Vertical), Capacity Gauge, Overlap (Venn), Certification Badges, Tool & Tech Snapshot.
   - Expect the **Live Preview** column visible on the right at the same time (at a window 900px wide or narrower, such as the 390px phone, it appears below the gallery and is reached by scrolling), and no orange alert box.
2. [J1.2] Look at the thumbnails: Skill Years Dots lists "Forecast modeling" with "13 yrs" first; Industry Share Bars shows "Software" 67% and "Logistics" 33%; Outcome Tiles shows "$40M+" and "35%".

## Journey 2 — Pick a chart, set options in place, insert, see the preview change

1. [J2.1] Click the **Proficiency Tiers** card (not its Add button).
   - Expect it to expand with option groups **Show**, **Group**, **Top rows** (a number box showing 10), a checkbox **Show footnote** (ticked) and **Title (optional)**.
2. [J2.2] Choose **Skills only** under Show; set **Top rows** to `4`; type `Skill strength` in the title box. Press **+ Add**.
   - Expect the card to collapse. Under "Configured Infographics ..." expect a row "1. Skill strength" with sub-label "Proficiency Tiers" and buttons Edit, up, down, remove.
   - Within about 2 seconds the Live Preview shows a heading **SKILL STRENGTH** and rows Process design (Expert), Forecast modeling (Expert), Pricing analytics (Advanced), Stakeholder reporting (Advanced), and a level legend (Exposure, Foundational, Proficient, Advanced, Expert). No dagger (†) and no footnote yet.
   - Visually (take a screenshot of the preview column; text found in the page source is not enough): the Skill strength chart fits inside the Live Preview column with nothing clipped at the right edge. All five tier segments of each row and each row's level label (Expert, Advanced, ...) are fully visible, and the legend is complete. There is no horizontal scrollbar inside the preview.
   - Scroll the page (the real scroller, at a 1400 px and again at a 600 px wide window) with the gallery taller than the window: at 1400 px the Live Preview column stays visible beside the gallery; at 600 px it sits below the gallery without overlapping it.

3. [J2.3] Signed in as the admin, open Admin -> Output Templates (the same editor in the admin shell) -> pill **Resume** -> **Infographics**. With the gallery taller than the window, scroll the page's real scroller down 1500px.
   - Expect, on the desktop surface (1280px wide), the Live Preview to stay in view beside the gallery (its top edge inside the visible window). Expect, on the mobile surface (390px wide), the Live Preview to sit below the gallery with no overlap.

## Journey 3 — Edit a configured chart in place; footnote follows the rules

1. [J3.1] Open the **Rules & why** tab. In **Levels and why**, row **Forecast modeling**, column **Your override**, choose **Advanced**.
   - Expect a toast "Forecast modeling set to Advanced (marked †)".
2. [J3.2] Return to **Infographics**.
   - Expect the preview row "Forecast modeling † Advanced" and, at the bottom of that chart, "† Levels marked † are user-defined by the member (own formula or set directly), not Salt Basin methodology-driven."
3. [J3.3] In the Configured list press **Edit** on "1. Skill strength". Untick **Show footnote**.
   - Expect the footnote sentence to disappear from the preview while the † stays on the row.
   - Tick it again: the sentence returns.
4. [J3.4] Set **Top rows** (in the same edit panel) to `2`: the preview shows only Process design and Forecast modeling (no Pricing analytics). Set it back to `4`. Press **Done**.

## Journey 4 — Add the other charts

1. [J4.1] Press **+ Add** on each of the other five career cards without opening them (Trend Bars, Outcome Tiles, Career Timeline, Skill Years Dots, Industry Share Bars).
   - Expect the Configured list to hold 6 rows, numbered 1 to 6.
   - Expect in the preview: a trend chart with an end label like "14.8 yrs" (value varies with the date); tiles "$40M+" with "recurring revenue automated" and "35%" with "faster month-end close", with the footnote "Brightfield Systems · Software client"; a timeline listing the three companies; dots rows "Process design" 11 yrs and "Forecast modeling" 13 yrs; and the heading **INDUSTRY SHARE BARS** with "Software 67%" and "Logistics 33%".

## Journey 5 — Reorder and remove

1. [J5.1] Press the up arrow ("Move up") on row 2.
   - Expect that row to become row 1 (list renumbers; row 1 reads "1. Trend Bars") and the preview order to follow.
2. [J5.2] Press the remove (✕) button on the last row.
   - Expect 5 rows remain and that chart leaves the preview.

## Journey 6 — Save and reload

1. [J6.1] Press **Save & Set Primary** (bottom of the editor).
   - Expect a toast "Output template saved — now available to select as a preset" and a preset appears under Presets on the left.
2. [J6.2] Reload the page, open the same editor and tab again.
   - Expect the 5 configured rows in the same order (row 1 "Trend Bars"), and the preview matching. No error alert.
3. [J6.3] Cleanup: Rules & why -> Forecast modeling -> **Your override** -> **Use formula**.

## Edge cases

- [E.1] **Empty member:** a brand-new member sees each career card with a plain sentence (e.g. "No proficiency levels yet — add skills or tools in Career Master...") and no chart; adding it still works and the preview shows the same sentence.
- [E.2] **Failed load:** if Career Master data cannot be loaded, an orange alert says which data failed (with the HTTP status) and "This is a loading error, not missing Career Master data", with a **Retry** button; affected cards show the same message instead of a chart.
- [E.3] **Top rows blank:** clearing the number box falls back to the chart's default (not zero rows).
- [E.4] **Classic charts:** the two Bar Chart cards need grouped roll-up data (for example skills by category); for a member with none, their **+ Add** is disabled. The Capacity Gauge always has a count source (Roles Held and the other totals), so its **+ Add** is enabled, and for an empty member it shows the number 0.
- [E.5] **Console:** any error other than the sandbox's `ERR_CERT_AUTHORITY_INVALID` or `ERR_TUNNEL_CONNECTION_FAILED` for an external resource (a host that is not the app's own origin) is a failure.
