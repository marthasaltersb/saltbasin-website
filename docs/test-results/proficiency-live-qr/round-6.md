# Test result: proficiency rules, technology categories, finalization gate, live QR page

- Feature: Proficiency rules, technology categories, finalization gate, live QR page
- Release: 2026-10-02-application-packages-resume
- Round: 6 (validation agent val-5000-1)
- Commit tested: c3a71b4 (integration head `claude/zealous-meitner-5tuft5`)
- Baseline: v1, spec sha256 124c64c1f985e3972e848b87bd2578a2c3f06a29a99388158a3cf387e5524ef5 (`check` passed; version unchanged since round 5, so no `diff` table is needed and the score compares like for like)
- **passed = false** (29 of 32 scored steps pass; 3 fail: J5.1 and J5.2 on the phone, J8.4 on both surfaces)

Score from `release-spec-baseline.mjs score` (verbatim): baseline 1, total 32, passed 29, notRun [], failed [J5.1, J5.2, J8.4], preconditionsFailed [].

Step log: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-6/steps.jsonl. Screenshots: same folder, prefixed `desktop-` / `mobile-`. A leftover earlier attempt in that folder was moved to `_stale-earlier-attempt/`. Four of my own harness misses (J2.2 mobile regexp case, J7.3 desktop counted the banner's change list, J7.5 both surfaces wrong "†" assertion) were re-run or re-judged and the false fail lines moved to `steps-superseded-harness-misses.jsonl`, because the scorer fails an id when any line for it failed.

Environment: production build, `node server/index.js` on port 5002, fresh database `sb_rl_val_5000_1` seeded with `npm run seed`, members from `scripts/create-test-member.mjs` only (member@test.local for desktop, member2@test.local for the phone walkthrough, empty@test.local and empty2@test.local for E.1). Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900 with mouse; phone 390x844, isMobile, hasTouch, every click replaced by a tap, the QR slider dragged with real touch events. Login went through the form, reached from the start page's "Enter my member world" link. Server stopped and database dropped at the end. Fictional data only.

## Fix verdicts (open bugs from the fix details)

| Bug | Maps to | Verdict | Evidence |
|---|---|---|---|
| proficiency-live-qr-F2-4, F3-4, F4-4 (Salt particles design, awaiting owner) | J7.4 | Still open (owner design feedback). Behaviour passes both surfaces: grains fall over about 1.7 s (lit pixels rise then hold constant), settle into a column with a gold line and "6 yrs" on top, tooltip on hover (desktop) or tap (phone) reads "Northwind Advisory / Senior Consultant / 6 yrs", Table shows a "Since printed" column reading Same. | desktop-J7-4-particles-settled, desktop-J7-4-particles-hover, mobile-J7-4-particles-settled |
| proficiency-live-qr-F3-1, F4-5 (third wording state) | J7.1, J7.2 | Not verified, still open. The "not career-bound, unchanged" sentence ("always stays exactly as approved") could not be reached through the interface: the only creation control with content is "New career-bound resume from Career Master". "Save as Output" on the Primary Resume returned 200 (POST /api/resume-outputs) but no new output appeared in the history. The two career-bound states were checked and pass. | desktop-F31-after-save-as-output |
| proficiency-live-qr-F4-8 (spec nits, weak edge coverage) | E.3 (and E.1, E.4) | Improved coverage, spec wording still open. E.3 now driven through the UI (removing every level threshold gives toast "A formula needs at least one level threshold.", nothing saved). The unknown-input case cannot be produced in the UI (the input picker offers only known inputs), so it was checked against the server route only: 400 "Unknown formula input: nonexistent", nothing saved. | desktop-E3-error-toast |
| resume-rollups-B4 (reassigned) | none in this baseline | Not part of this feature; not tested. | |

## Failures

- **[J5.1] (phone) MOBILE_GAP.** Expected: gold-bordered "New formula" editor with an inputs table and a level-threshold table. Observed: the editor opens and the name reads "My formula", but at 390px every select in both tables is 33px (inputs) or 41px (levels) wide, so the dropdown shows no text. The user cannot see which row is "Years performed", "Engagements / roles applied in", "Certification bonus points", or which level is "Expert". The inputs table header also runs past the card's right border. Evidence: mobile-J5-1-editor.png, probe (select widths 33/41, selected options "Years performed" and "Expert"). The same editor on desktop is readable.
- **[J5.2] (phone) MOBILE_GAP.** The flow works (toast "Now using your formula — affected levels are marked †", My formula selected, every row "Your formula †", "Years performed: 11 (capped at 10) × 1 = 10"), but the rows to edit (Years performed cap, Expert minimum) cannot be identified on screen because of the blank selects above. I located the inputs by order in the page. Evidence: mobile-J5-2-after.png.
- **[J8.4] (both surfaces, 390px) recurrence of the round-5 failure.** Expected: no sideways panning inside the page or its scroller to read the Rules & why panel. Observed: tab row wraps (3 + 2), Rules & why is reachable, the editor stacks in one column and the page itself does not scroll sideways (scrollWidth 390), but the "Levels and why" table is 940px wide inside a 239px scroller, so "How it was used", "Decided by", "Points behind it", "Methodology alone" and "Your override" need an in-table swipe (a caption says to swipe). Desktop was checked by resizing the window to 390px. Evidence: desktop-J8-4-rules-levels.png, mobile-J8-4-rules-levels.png. Question for the owner, unchanged from round 5: accept the captioned in-table scroll and reword J8.4 (as Career Master's table, which rounds 4 and 5 accepted), or stack the table as cards at phone width.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist and no MCP route exists. Capabilities with no tool: read proficiency rules and levels, set a technology's "How it was used" category, override a level, duplicate/save/select a formula, certification bonuses, finalize gate (approve/share with categories), live QR data read. Not a baseline step, so it is not in the score.

## Per-step results

Every step below ran on desktop and on the 390px phone unless noted; "pass" means both surfaces passed.

| Step | Result | What was seen | Screenshot (desktop-/mobile- prefix) |
|---|---|---|---|
| P.1 | pass | Logged in through the form on both surfaces | P1-login-after |
| P.2 | pass | Skills, tools, certification and a fictional job added through Manual Intake | P-final-tools |
| P.3 | pass | Career-bound resume output created | P3-after-new-output |
| J1.1 | pass | Three cards, LOCKED tag, radio selected | J1-1-rules-top |
| J1.2 | pass | Ledgerly ERP Advanced, Salt Basin methodology, 8 pts, both lines, Methodology alone Advanced · 8 pts (phone needs an in-table swipe, accepted precedent) | J1-2-levels |
| J1.3 | pass | Amber banner "2 technologies need a proficiency category (Ledgerly ERP, QuoteFlow CPQ)", two "Required before any output can be finalized" notes | J1-3-banner |
| J2.1 | pass | Toast, note gone, banner count 1 | J2-1-after |
| J2.2 | pass | Field reads integration_design | J2-2-tool-edit |
| J3.1 | pass | Toast, Advanced †, Your override †, Set by hand, Expert · 17 pts, closing † sentence | J3-1-after |
| J3.2 | pass | Back to Expert, Salt Basin methodology | J3-2-undo |
| J4.1 | pass | Form with Save bonus opens | J4-1-form |
| J4.2 | pass | Lapsed box ticked, chip dark (rgb 27,42,59), toast, "→ +3 pts to Ledgerly ERP", Expert 11 pts, breakdown lines | J4-2-after |
| J4.3 | pass | Confirm dialog, back to Advanced 8 pts | J4-3-after |
| J5.1 | fail on phone | See Failures; desktop pass (gold border rgb 196,132,58, name My formula, both tables) | J5-1-editor |
| J5.2 | fail on phone | See Failures; desktop pass | J5-2-after |
| J5.3 | pass | Radio selected immediately, toast, rows back without † | J5-3-after |
| J5.4 | pass | "(read-only)", no inputs | J5-4-view |
| J6.1 | pass | QuoteFlow CPQ still uncategorised | J6-2-history |
| J6.2 | pass | Amber banner on Resume Output History naming QuoteFlow CPQ | J6-2-history |
| J6.3 | pass | Dialog "Set how each technology was used", QuoteFlow CPQ with "Hands-on (suggested)" | J6-3-dialog |
| J6.4 | pass | Dialog closes, toast "Approved — private QR link created (copied to clipboard).", QR code and link, banner gone | J6-4-qr-after |
| J6.5 | pass | Second uncategorised tool (Fiscalis TMS); Cancel gives the exact toast; links unchanged | J6-5-cancelled |
| J7.1 | pass | Dark banner (rgb 27,42,59, white text), green stripe, approval date, "The document wording currently matches the printed version." | J7-1-qr-page-top |
| J7.2 | pass | "LIVE DATA — 1 change since the approved printed version" (gold stripe), "Changed: Northwind Advisory — printed Senior Consultant, 2015–2020 · Software → now Principal Consultant, 2015–2020 · Software", wording-changed sentence | J7-2-banner |
| J7.3 | pass | Slider dragged left (touch drag on phone): "Viewing Approved · printed — exactly what the printed copy shows." | J7-3-slider-left |
| J7.4 | pass | See bug table; grains fall and settle, gold line and value, tooltip, Table "Since printed" Same | J7-4-particles-settled |
| J7.5 | pass | "LIVE DATA — 3 changes": "Changed: Ledgerly ERP — printed Advanced · Integration design → now Advanced · Hands-on" exact; level change reads "Forecast modeling — printed Expert → now Advanced (user-defined)" (see observations) | J7-5-qr-top |
| J8.1 | pass | Output Templates island opens the editor with the five tabs and live preview | J8-1-entered |
| J8.2 | pass | "Rules & why" card with intro and panel | J8-2-rules |
| J8.3 | pass | Override to Proficient: toast, thumbnails and preview show "Forecast modeling † / Proficient" | J8-3-infographics-after |
| J8.4 | fail on both | See Failures | J8-4-rules-levels |
| E.1 | pass | Rules & why shows the exact empty message; approved output of an empty Career Master shows no charts section | E1-empty-rules, E1-empty-qr |
| E.2 | pass | After Revoke QR, and for a never-approved slug, "This link isn't available" | E2-revoked |
| E.3 | pass | UI error toast, nothing saved (see bug table for the unknown-input part) | E3-error-toast |
| E.4 | pass | PUT and DELETE on the methodology both 403, methodology still present | none |

## Observations (not counted)

- **Classic Tools tab row is hidden at 390px.** `sb-admin-topbar-actions` is `display: none` on the phone, so My Resume cannot be reached through Classic Tools as J6.2 words it. It is reachable through World Shell, Journeys, My Resume, which I used for the phone walkthrough. Worth a decision on whether the spec path should read "My Resume (World Shell Journeys island or Classic Tools)". On the phone the Classic Tools landing screen (Career Placement Agents) also renders in squeezed columns with the Back to World button overlapping the page title (mobile-dbg-classic.png).
- **J7.5 wording:** the spec example writes "Forecast modeling printed Expert → now Advanced †"; the page writes "Advanced (user-defined)". I treated the example as the "e.g." variant because the exact Ledgerly line matches. Proposed spec wording: "…now Advanced (user-defined)".
- **J8.3:** the preview pane shows proficiency only when the Proficiency chart is in the template; here it was present. Unchanged suggestion from round 5: add "after adding the Proficiency chart" to the step.
- **Empty Career Master QR page** still says "The career charts on this page update from the Salt Basin Career Master" although there are no charts (E1-empty-qr). Spec-compliant, slightly contextless.
- **"Save as Output"** on the Primary Resume (0 sections) returns 200 but no new output card was visible afterwards. Possibly a silent no-op; not investigated further.
- The expected 409 from `POST /api/resume-outputs/:id/share` (the finalization gate's trigger, 4 times), 400s from the invalid formula saves, and 404s from unknown or revoked slugs were the only HTTP errors. No page errors and no failed app requests; external font requests are logged as external_blocked.
- **Harness note:** J5.3's radio lookup matched both radios (identical container text) and used the first; it is the Salt Basin methodology radio, and the resulting rows confirm it.

## Spec ambiguities handled

- Preconditions list no job, but J7.2 needs one; I added a fictional job (Northwind Advisory, Senior Consultant) in the same Manual Intake pass.
- P.3 and J6/J7 need document content; the output was made with "New career-bound resume from Career Master".
- J6.5 "repeat with another uncategorised tool": added a fictional tool (Fiscalis TMS) after J7 so the QR change list was not disturbed.
- J8.4 on the desktop surface was run by resizing the window to 390px wide (no touch), since the step names 390px.
- J7.1 has several wording states; the two career-bound states were checked, the third is not reachable (see bug table).
- Order run: preconditions, J1 to J5, J6.1 to J6.4, J7, J8, J6.5, edge cases (E.2 revoke last).
