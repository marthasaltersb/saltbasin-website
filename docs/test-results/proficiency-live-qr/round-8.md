# Test result: proficiency rules, technology categories, finalization gate, live QR page

- Feature: Proficiency rules, technology categories, finalization gate, live QR page
- Release: 2026-10-02-application-packages-resume
- Round: 8 (validation agent val-5000-5)
- Commit tested: 9b2cfaa23dadbbccdb98d93b3e696f45ef90fcd4 (integration head `claude/zealous-meitner-5tuft5`)
- Baseline: v3, spec sha256 8d535c9c196fb734d6208ef68cc8d1b20d35f85824feeff9a052cc7dec479a05 (`check` passed: "baselines match: proficiency-live-qr v3")
- **passed = false** (31 of 32 scored steps pass; J8.4 fails on both surfaces, unchanged from round 7)

Score from `release-spec-baseline.mjs score` (verbatim): baseline 3, total 32, passed 31, failed [J8.4], blocked [], notRun [], preconditionsFailed [].

Baseline diff v2 -> v3 (amendment A2): comparable 34 ids; same = all except J6.4; changed = J6.4 (toast now the plain hyphen "Approved - private QR link created..."); added none; retired none. Round 7 (v2) scored 30/32 with J6.4 and J8.4 failing, so this round reads like for like: J6.4 moves to pass through the amendment, J8.4 is unchanged.

Step log: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-8/steps.jsonl. Screenshots: same folder, prefixed `desktop-` / `mobile-`. One harness miss (E.3 on the phone: I ran the desktop E.3 script, which did not match the stacked threshold cards) was moved to `steps-superseded-harness-misses.jsonl` and re-run with the phone script (pass). P.1-P.3 are logged once per surface plus a `setup` line (the surface the scorer requires).

Environment: production build of the integration head, `node server/index.js` on port 5010, fresh database `sb_rl_val_5000_5` seeded with `npm run seed`, members from `scripts/create-test-member.mjs` only (member@test.local desktop, member2@test.local phone, empty@test.local and empty2@test.local for E.1). Chromium via Playwright, light scheme, en-US, TZ=UTC, desktop 1280x900 mouse, phone 390x844 isMobile + hasTouch with taps. Everything done by log-in form and point-and-click; typed addresses only for `/world` between scripts and the spec's own `/r/<slug>` steps.

## Fix verdicts

| Item | Maps to | Verdict | Evidence |
|---|---|---|---|
| Amendment A2 (J6.4 toast hyphen) | J6.4 | **Now passes on desktop and mobile.** Dialog closed, toast "Approved - private QR link created (copied to clipboard).", QR code and link under the output, banner gone. | desktop-J6-4-qr-after, mobile-J6-4-qr-after |
| No product fixes this round | all other steps | Unchanged and passing, except J8.4 | see per-step table |

## Failures

- **[J8.4] both surfaces (390px).** Expected: tab row wraps, Rules & why reachable, editor stacks in one column, "no sideways panning inside the page or its scroller to read the Rules & why panel". Observed: tab row wraps (3 + 2: Header / Footer, Stat Cards, Infographics / Sections, Rules & why), Rules & why reachable, editor stacks, the page itself does not scroll sideways (docSW 390 = viewport 390), but the "Levels and why" table is 940px wide inside a 239px scroller, so "How it was used", "Decided by", "Points behind it" and "Methodology alone" need an in-table sideways swipe. Same result as round 7 (needs_business_definition: either accept the in-table scroll in the step wording or ask for a stacked-card Levels table). Evidence: desktop-J8-4-rules-levels, mobile-J8-4-rules-levels.

No MCP_GAP, UI_GAP or MOBILE_GAP failures: every baseline step was done by point-and-click on both surfaces.

## Per-step results (desktop and mobile both ran; "pass" means both passed)

| Step | Result | What was seen |
|---|---|---|
| P.1 | pass | Logged in through the form (setup, both surfaces) |
| P.2 | pass | Two skills, two tools, one certification (and a fictional job for J7.2) added through Manual Intake; read-only count check 2/2/1/1 per user |
| P.3 | pass | "New career-bound resume from Career Master" created an output after P.2 |
| J1.1 | pass | Three cards, LOCKED tag, methodology radio selected |
| J1.2 | pass | Ledgerly ERP Advanced, Salt Basin methodology, 8 pts, both breakdown lines, Methodology alone Advanced · 8 pts |
| J1.3 | pass | Amber banner "2 technologies need a proficiency category (Ledgerly ERP, QuoteFlow CPQ)", two "Required before any output can be finalized" notes |
| J2.1 | pass | Toast, note gone, banner count 1 |
| J2.2 | pass | Field reads integration_design |
| J3.1 | pass | Toast, Advanced †, Your override †, Set by hand, Expert · 17 pts, closing † sentence |
| J3.2 | pass | Back to Expert, Salt Basin methodology |
| J4.1 | pass | Form with Save bonus opens |
| J4.2 | pass | Lapsed box ticked, chip dark (rgb 27,42,59), toast, "+3 pts to Ledgerly ERP", Expert 11 pts, breakdown lines |
| J4.3 | pass | Confirm dialog, back to Advanced 8 pts |
| J5.1 | pass | Gold-bordered "New formula", name My formula, inputs and thresholds tables |
| J5.2 | pass | Cap 10, Expert minimum 12, toast, My formula selected, every row "Your formula †", "Years performed: 11 (capped at 10) × 1 = 10" |
| J5.3 | pass | Radio selected immediately, toast, rows back without † |
| J5.4 | pass | "(read-only)", no inputs |
| J6.1 | pass | QuoteFlow CPQ still uncategorised |
| J6.2 | pass | Amber banner on Resume Output History naming QuoteFlow CPQ |
| J6.3 | pass | Dialog "Set how each technology was used", QuoteFlow CPQ preset "Hands-on (suggested)" |
| J6.4 | pass | Hyphen toast per v3, QR code and link, banner gone |
| J6.5 | pass | Second uncategorised tool (Fiscalis TMS); Cancel gives "Finalization cancelled — technologies still need a proficiency category."; QR links unchanged |
| J7.1 | pass | Dark banner (white text), green stripe, approval date, matching-wording sentence |
| J7.2 | pass | "LIVE DATA — 1 change since the approved printed version" and "Changed: Northwind Advisory — printed Senior Consultant, 2015–2020 · Software → now Principal Consultant, 2015–2020 · Software" |
| J7.3 | pass | Slider far left: "Viewing Approved · printed — exactly what the printed copy shows."; change lines gone from the chart view |
| J7.4 | pass | Grains fall and settle with gold line and value on top, tooltip "Northwind Advisory / Senior Consultant / 6 yrs", Table "Since printed" column |
| J7.5 | pass | "LIVE DATA — 3 changes": Ledgerly ERP printed Advanced · Integration design → now Advanced · Hands-on; Forecast modeling printed Expert → now Advanced (user-defined) |
| J8.1 | pass | Output Templates island opens the editor; five tabs and live preview |
| J8.2 | pass | "Rules & why" card with intro and the panel |
| J8.3 | pass | Proficiency chart present, override to Proficient: toast, thumbnail and preview show "Forecast modeling † / Proficient" |
| J8.4 | **fail** | See Failures |
| E.1 | pass | Rules & why shows the exact empty message; approved output of an empty Career Master shows banner and one sentence, no charts section |
| E.2 | pass | Revoked slug and never-approved slug both show "This link isn't available" |
| E.3 | pass | Removing every level threshold gives toast "A formula needs at least one level threshold.", nothing saved (phone: stacked cards, 8 removals); unknown input reachable only by API (400, nothing saved) |
| E.4 | pass | PUT and DELETE on the methodology both 403, methodology still present |

## Interface parity

- Website: both surfaces walked by point-and-click; no UI_GAP or MOBILE_GAP.
- API routes seen in the network log: `PATCH /api/career/tools/:id`, `PUT/DELETE /api/career/experience-definitions/:type/:key`, `POST /api/career-bound/outputs`, `POST /api/resume-outputs/:id/share` (409 while a technology lacks a category, 200 after), `GET /api/shared-outputs/:token` (404 when revoked or unknown).
- MCP (`/mcp`, 96 tools, tokens created on Journeys -> Connected Agents for both test users): `proficiency_rules_read`, `technology_category_set`, `proficiency_override_set/clear`, `certification_mapping_save`, `career_experience_definition_delete`, `proficiency_formula_save/select`, `application_output_approve_for_qr` (409 `tool_category_required` with an uncategorised tool, matching the UI gate; 200 after), `shared_output_live_read`, `application_output_revoke_qr` (live read then 404). Results matched the UI (Advanced 8 pts, Expert 11 pts with +3 bonus, Expert to Advanced override, "capped at 10" breakdown, methodology 403 on edit and delete, unknown formula input 400).

## Observations (not counted)

- **MCP `technology_category_set` rejects `category: null`** although its schema advertises `["string","null"]` and "or clears it with null": returns `Error 400 invalid_arguments: "category" is required.`, value stays (unchanged since round 7; the website dropdown also cannot clear a category, so no UI mismatch).
- **Gate wording**: the finalization-gate success toast uses a hyphen (A2) while the cancel toast keeps an em dash.
- **Start page** link goes to `/member`; I found no click path from there to `/world`, so scripts re-enter `/world` by address (as in round 7).
- **E.1 empty QR page** still says "The career charts on this page update from the Salt Basin Career Master" although no charts are shown.
- **Home page** now has a second button whose name contains "Journeys" ("Journeys card list", sun menu item); my script selector needed `exact: true`. Not a product failure.
- **Console and network**: no page errors and no failed app requests. HTTP errors only the expected ones: 409 from the share gate (4), 400 from invalid formula saves (2), 404 from revoked or unknown slugs (4). The 50 other console errors and 69 external_blocked entries are blocked external fonts, CDN scripts and Google resources.

## Spec ambiguities handled

- Preconditions list no job but J7.2 needs one: a fictional job (Northwind Advisory, Senior Consultant) was added in the same Manual Intake pass.
- P.3 and J6/J7 need document content: the output was made with "New career-bound resume from Career Master" after P.2.
- J6.5 "repeat with another uncategorised tool": added a fictional tool (Fiscalis TMS) after J7 so the QR change list was not disturbed.
- J8.4 on the desktop surface was run by resizing the window to 390px wide (no touch).
- J8.3: the editor had no saved preset; the Proficiency chart was added to the working template, not saved as a preset.
- Order run: preconditions, J1 to J5, J6.1-J6.4, J7, J8, J6.5, edge cases (E.2 revoke last), then MCP checks.
