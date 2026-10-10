# Training spec — configurable resume rollups (version 1, 2026-10-02)

Audience: a member using the platform, and a test agent driving a browser. Each step says exactly what to do and what you should see. All data below is fictional. Journeys build on each other: run them in order on a fresh database.

## Where things are

- **The screen**: Classic Tools (`/member?workspace=1&scope=member`) → top tab **Career Master** → card **Proficiency & Rollups** → button **5 · Resume rollups**. (In the World Shell the same Career Master screens are reached through `/world` → Journeys → Career Master / Classic Tools.) Four sections stack down the page: **KPI tiles**, **Industry buckets**, **Capability groups**, **Career Atom rollups**, then a **Live preview** card at the bottom.
- **Career Master data entry**: Career Master → card **Manual Intake** → tabs `Skills (n)`, `Jobs (n)`, `Engagements (n)` → button **+ Add**.
- **Levels and why**: Career Master → Proficiency & Rollups → **3 · Rules & why**.
- **The output**: open `/output/resume?layout=modern` (its Executive Summary, Capability Confidence and Industry Experience sections are what this feature configures).

## Preconditions (fictional data, entered through the UI)

1. [P.1] Sign in as the admin test user. On `/world` a terms screen "Career Portfolio Terms & Data Conditions" appears: tick all four checkboxes and click **I Agree — Continue**. Expect the top bar **World · Journeys · Classic Tools**.
2. [P.2] Career Master → **Manual Intake**. In each add dialog the fields are labelled as below; click **Save** after each.
   - Jobs → **+ Add**: Company `Brightwater Software`, Title `Revenue Operations Lead`, Start Date `Jan 2016`, End Date `Dec 2019`, Function `Operations`, Industry `Enterprise Software`.
   - Jobs → **+ Add**: Company `Harborview Clinics`, Title `Systems Manager`, Start Date `Jan 2020`, End Date `Dec 2023`, Function `Operations`, Industry `Healthcare`.
   - Skills → **+ Add** (fields Skill, Category, Years Experience, # Engagements, First Used (Year), Proficiency Tier):
     `Pricing design` / `Pricing & Subscription` / 9 / 12 / 2016 / Expert;
     `Billing integration` / `Integration` / 6 / 5 / 2018 / Advanced;
     `Stakeholder alignment` / `Stakeholder Mgmt` / 4 / 3 / 2020 / Proficient;
     `Lease accounting` / `Treasury Ops` / 2 / 1 / 2022 / Foundational.
   - Engagements → **+ Add**: Internal Name `Pricing overhaul`, Employer `Brightwater Software`, Client Display Name (public) `A regional software vendor`, Industry `Enterprise Software`, Period `2017-2019`, Deal — Exit Detail `Sold in a $250M exit`, tick **Published to public case studies**.
   - Expect the tabs to read `Skills (4)`, `Jobs (2)`, `Engagements (1)`.
3. [P.3] Open the screen (path above) and click **5 · Resume rollups**.

## Journey 1 — The defaults and the live preview

1. [J1.1] Expect the page text "These three lists drive the resume's Executive Summary tiles…" and a **KPI tiles** section with six cards, in this order. Under each card's fields a computed line shows:
   - **Exit Signal** (metric "Largest $ figure in an engagement field", field `exitDetail`): bold **$250M** · "largest $ figure in career_engagements.exitDetail".
   - **ARR Automated**: **—** · `No "ARR automated" metric with a $ figure in engagement metrics`.
   - **Engagements**: **1** · "published career_engagements".
   - **Industries**: **2** · "distinct industry values across career_jobs and career_engagements".
   - **Years**: **8** · "career_jobs start/end dates, overlapping roles merged, month precision".
   - **Employers**: **2** · "distinct career_jobs.company".
2. [J1.2] Scroll to **Live preview**. Expect tiles showing `$250M`, `—`, `1`, `2`, `8`, `2` with their labels; under "Capability Confidence": `Revenue Operations · 100% · 1 Expert · 1 skills`, `Process & Architecture · 75% · 0 Expert · 1 skills`, `Strategy & Advisory · 50% · 0 Expert · 1 skills`; under "Industry Experience": `SaaS & Enterprise Software · 4 yrs` and `Healthcare Technology · 4 yrs`.

## Journey 2 — Edit a tile and see it before saving

1. [J2.1] In the **Years** card, change the Label to `Years in operations`. Wait about 1 second.
   - Expect the Live preview to show **YEARS IN OPERATIONS** already, before saving.
2. [J2.2] Click **Save** on that card.
   - Expect the toast "Years in operations saved".

## Journey 3 — A manual (user-defined) tile is marked †

1. [J3.1] Click **+ Add KPI tile**. In the new last card set Label `Certified partners`, Metric `Manual value (user-defined)`, then in the field "Your value (shown with †)" type `5`.
   - Expect the Live preview to show **5†** and, under the tiles, the italic line "Figures marked † are user-defined, not Salt Basin methodology-driven." Expect the card's footer to read "not saved yet".
2. [J3.2] Click **Save** on that card.
   - Expect the toast "Certified partners saved".

## Journey 4 — A proficiency tile uses the proficiency engine

1. [J4.1] Click **+ Add KPI tile**. In the new card set Label `Expert skills`, Metric `Skills/tools at or above a proficiency level`. Expect a "Counts" selector (Skills / Tools) and an "At or above level" selector listing `Exposure, Foundational, Proficient, Advanced, Expert`. Choose level `Expert`.
   - Expect the computed line: **1** · "proficiency engine: skills at or above the chosen level (Expert)".
2. [J4.2] Click **Save**. Expect the toast "Expert skills saved".

## Journey 5 — Aggregate any Career Master field

1. [J5.1] Click **+ Add KPI tile**. Label `Total skill years`, Metric `Aggregate of a Career Master field`, Collection `Skills`, Field `yearsExp`, Aggregation `Sum`.
   - Expect the computed line to start with **21** · "sum of skills.yearsExp in Career Master".
2. [J5.2] Click **Save**. Expect the toast "Total skill years saved".

## Journey 6 — Order and visibility

1. [J6.1] In the **ARR Automated** card click the **↑** (Move up) button.
   - Expect ARR Automated to become the first card in the list (after a moment).
2. [J6.2] In the **Employers** card untick **Shown**.
   - Expect the card's computed line to read "Hidden — not shown on outputs." and the Live preview to no longer contain EMPLOYERS.
3. [J6.3] Click **Save** on the Employers card. Expect the toast "Employers saved".

## Journey 7 — Industry buckets

1. [J7.1] In **Industry buckets** click **+ Add industry bucket**. In the new card set Label `Care delivery`, Sub-label `Clinical operations`. In the "Add keyword, press Enter" box type `clinic` and press Enter, then type `health` and click **Add**.
   - Expect two chips `clinic` and `health`, the line "**4 yrs** · 1 role/engagement(s) matched keywords: clinic, health" (one role matches), and the Live preview line `Care delivery · 4 yrs`.
2. [J7.2] Click **Save**. Expect the toast "Care delivery saved".
3. [J7.3] In the same card add keyword `he` (Enter).
   - Expect the years to stay **4 yrs** (keywords of three letters or fewer match whole words only, so `he` does not match "Healthcare"). Remove the chip with its × (button "Remove he").

## Journey 8 — Capability groups and unmapped categories

1. [J8.1] In the **Capability groups** section, expect a box "Your unmapped skill categories" with `Treasury Ops · 1 skill — not counted in any bar`.
2. [J8.2] In that row choose **Strategy & Advisory** from the "Map to group…" dropdown.
   - Expect the box to change to "Every skill category you use is mapped to a group." and the **Strategy & Advisory** group card to show a chip `Treasury Ops (1)` and a line ending "2 skills".

## Journey 9 — Career Atom rollups

1. [J9.1] In **Career Atom rollups** expect three cards: `Skills by category`, `Roles by industry`, `Tools by wheel bucket`.
2. [J9.2] Click **+ Add Career Atom grouping**. Label `Skills by proficiency`, "Group by" `tier`, Sort `A to Z`.
   - Expect the computed line "Advanced (1) · Expert (1) · Foundational (1) · Proficient (1)".
3. [J9.3] Click **Save**. Expect the toast "Skills by proficiency saved".
4. [J9.4] In the `Tools by wheel bucket` card untick **Shown** and click **Save**. Expect the toast "Tools by wheel bucket saved".
5. [J9.5] Reload Proficiency & Rollups and open Career Atom rollups. Expect the `Skills by proficiency` card still present with the computed line 'Advanced (1) · Expert (1) · Foundational (1) · Proficient (1)', and the `Tools by wheel bucket` card with Shown unticked. (The API result of GET /api/career/atom-rollups?owner=me is checked from the page session and kept as evidence, not as a tester step.)

## Journey 10 — A hand-set proficiency level flows into the tiles with †

1. [J10.1] Click **3 · Rules & why**. In **Levels and why**, row **Stakeholder alignment**, choose **Expert** in its override dropdown (last dropdown in the row).
   - Expect *Level shown* **Expert †** in that row.
2. [J10.2] Click **5 · Resume rollups**.
   - Expect the **Expert skills** card to show **2†** and the Live preview footnote to read "Figures marked † are user-defined, not Salt Basin methodology-driven. Proficiency levels marked † are user-defined (1 set directly by the member), not Salt Basin methodology-driven."

## Journey 11 — A bad draft is explained, not hidden

1. [J11.1] Click **+ Add industry bucket** (leave the keywords empty).
   - Expect, within about 1 second, an amber alert at the top of the panel: "**Live preview paused.** New industry bucket: an industry bucket needs at least one keyword. Your edits are kept…". (A `400` from `POST /api/career/resume-rollups/preview` is expected here.)
2. [J11.2] Click **Remove** on that unsaved card and confirm the dialog.
   - Expect the card to vanish and the alert to disappear.

## Journey 12 — The resume output uses the configuration

1. [J12.1] Open `/output/resume?layout=modern` and wait a few seconds.
   - Expect an **EXECUTIVE SUMMARY** with tiles in this order: ARR AUTOMATED (`—`, with the reason text), EXIT SIGNAL (`$250M`), ENGAGEMENTS (`1`), INDUSTRIES (`2`), YEARS IN OPERATIONS (`8`), CERTIFIED PARTNERS (`5†`), EXPERT SKILLS (`2†`), TOTAL SKILL YEARS (`21`). No EMPLOYERS tile.
   - Expect under the tiles the footnote "Figures marked † are user-defined, not Salt Basin methodology-driven. Proficiency levels marked † are user-defined (1 set directly by the member), not Salt Basin methodology-driven."
   - Expect **CAPABILITY CONFIDENCE** with `Strategy & Advisory` / `0 Expert · 2 skills` and **INDUSTRY EXPERIENCE & DURATION** listing `SaaS & Enterprise Software 4 yrs`, `Healthcare Technology 4 yrs`, `Care delivery` / `Clinical operations` / `4 yrs`.
   - Expect none of the old invented figures ($4.6B, $500M+, 12+, 13, AI-Native).

## Edge cases

- [E.1] Removing a saved row asks "Remove “<label>”?" and removes it on confirm; the last saved row of a type cannot be removed — a red toast says to untick **Shown** instead (not exercised in the builder's walk).
- [E.2] If the rollups cannot be loaded, the screen shows an amber alert "Resume rollups could not be loaded… not empty" with a **Retry** button, and an output shows "Resume rollups could not be loaded" instead of empty tiles (not exercised: needs a forced server failure).
- [E.3] A member with an empty Career Master sees every tile computed from Career Master as `—` with a reason; a manual (user-defined) tile shows the member's own value marked †; no figure is ever invented (not exercised).
- [E.4] Expected, non-defect console noise: `404 GET /api/members/me/profile` (admin test user has no member profile) and sandbox certificate errors for external hosts.
