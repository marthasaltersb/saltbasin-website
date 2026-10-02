# Triage: proficiency-live-qr, round 1

Release 2026-10-02-proficiency-live-qr. Integration head 4d8cff3. No code changed. Two items, both defects, both new (no earlier triage items).
Method: read the validator's screenshots (J1-1-rules-top.png, PH-rules-levels.png) and traced the rendering code. No server was started; the causes below come from code and screenshots, not from a live reproduction.

## T1-1 Dark-on-dark text in the Proficiency & Rollups panel (defect)

Symptom: on every screen of the panel, the "Proficiency & Rollup Configuration" heading and the selected "Proficiency & Rollups" path-card title are dark navy on the dark World background.

Root causes, two places:
1. `src/components/admin/CareerExperienceConfigurator.jsx:166`: the root div sets `color: '#1b2a3b'` and has no background. The heading (line 168) inherits that colour and has no colour of its own. This panel was written for the light admin shell. The World Shell embed (`src/components/WorldShell.jsx`, `S.embedShell`, background `#0d1417`) now hosts it, so the heading lands on dark. The paragraph below it sets its own grey, so it stays visible. The white cards are fine.
2. `src/components/admin/CareerMasterEntryPoint.jsx:27`: the selected path card uses `background: 'rgba(196,132,58,.08)'`, which is translucent. Unselected cards use `#fff`. Over the dark embed the selected card is nearly transparent, and its title (line 28) is `var(--sb-navy, #1b2a3b)`, so the title disappears. In the light admin shell the same style looks fine.

Proposed fix, in two parts:
- Make the selected card opaque. Use a solid tinted background such as `#fbf3e8` with the gold border, so the navy title and grey description stay readable on any host.
- Give `CareerExperienceConfigurator`'s heading block its own readable surface. Either wrap the heading and intro in a light card (`background: '#f5f2ed'`, padding, radius, navy text), or have the heading take its colour from a prop or CSS variable that WorldShell sets. Prefer the light card, because it matches the other panels.
- Other embedded Career Master views have the same unconditional-navy pattern and should get a quick scan.

## T1-2 Phone width (390px): Levels table unreachable, QR chart labels unreadable (defect, two sub-causes)

### a. Levels and why table (`src/components/admin/ProficiencyRulesPanel.jsx:358-361`)
The table has 7 columns and `minWidth: 940` inside a wrapper with `overflowX: 'auto'`. At 390px the visible card is about 260px wide, so most columns sit beyond the edge. The screenshot shows the table cut exactly at the wrapper edge (inside the card padding), which fits a working but invisible scroller.
- Mobile browsers use overlay scrollbars, so nothing signals that the table scrolls sideways.
- Dropdown columns make rows very tall (about 130px each).
- The columns the user needs (How it was used, Your override) are the ones hidden.

Proposed fix: below about 760px, drop the table and render each skill or tool as a stacked card. Show label and level first, then labelled fields for How it was used, Decided by, Points, Methodology alone and Your override. Alternatively keep the table and add a visible scroll cue: a right-edge fade gradient, a "Scroll sideways for more" hint, and a sticky first column. The stacked card is preferred because the override and category controls are the primary actions of this screen.

### b. QR page chart labels (`src/lib/careerCharts.js`, rendered by `src/components/ChartViews.jsx:78` via `dangerouslySetInnerHTML`)
The charts are SVGs with a fixed `viewBox` and `width="100%"`:
- proficiency bars: line 103, viewBox about 470-560 wide, text 10.5-11px
- trend chart: line 113, `W = 520`, text 9-10px
- timeline: line 186, `W = 560`, text 10.5px

The content column at 390px is about 280-300px, so the scale is about 0.5-0.57 and 9-11px text renders at about 4.5-6px. The layout fits horizontally but the text is unreadable.

Proposed fix: wrap each static SVG in an `overflow-x: auto` container and give the SVG `min-width` of about 480-520px. Text then keeps at least 9px and the chart scrolls sideways, with a "Swipe for full chart" caption. A fuller fix is to pass the container width into the chart builders and lay out for it (shorter label width, labels above bars). The wrapper is the minimal fix. The Table view is already usable on mobile and the particle chart sizes itself with a ResizeObserver, so neither needs changes.

## Notes
- The validator's "other observations" (the Back to World overlap at 1360px and the truncated dropdown labels "Choose - required (sugg", "Use forn") are not in this round's failures. The dropdown truncation is the `width: 100%` select in `ProficiencyRulesPanel`'s `input` style inside a narrow column. Fixing it in T1-2a (wider selects or stacked cards) is cheap.
- The validator's setup notes also raise a product question that is outside this round's failures. A brand-new member hits `must_change_password` and the career-terms 428 gate, which blocks the JS bundle and page loads. This needs an owner decision on whether static assets and the shell should be exempt from `enforceCurrentCareerTerms`. It is not classified here because the validator worked around it and the failures above do not depend on it.
