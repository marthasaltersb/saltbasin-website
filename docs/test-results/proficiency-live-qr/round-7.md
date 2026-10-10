# Test result: proficiency rules, technology categories, finalization gate, live QR page

- Feature: Proficiency rules, technology categories, finalization gate, live QR page
- Release: 2026-10-02-application-packages-resume
- Round: 7 (validation agent val-5000-1)
- Commit tested: 0800b1c (integration head `claude/zealous-meitner-5tuft5`)
- Baseline: v2, spec sha256 caa04485049cc7b48803df05b659eba217e4302816e8bc611138f58630dadf35 (`check` passed)
- **passed = false** (30 of 32 scored steps pass; 2 fail: J6.4 on both surfaces, J8.4 on both surfaces)

Score from `release-spec-baseline.mjs score` (verbatim): baseline 2, total 32, passed 30, failed [J6.4, J8.4], blocked [], notRun [], preconditionsFailed [].

Baseline diff v1 -> v2 (amendment A1): same = P.1-P.3, J1.1-J1.3, J2.1-J2.2, J3.1-J3.2, J4.1-J4.3, J5.1-J5.4, J6.1-J6.5, J7.1-J7.4, J8.1, J8.2, J8.4, E.1-E.4; changed = J7.5, J8.3; added none; retired none. Round 6 (v1) scored 29/32 over the same 32 ids, so scores compare like for like except J7.5 and J8.3, whose wording changed.

Step log: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-7/steps.jsonl. Screenshots: same folder, prefixed `desktop-` / `mobile-`. Harness misses that I re-ran (J8 on desktop x3: my "+ Add" selector for the Proficiency chart; E.3 on the phone: my threshold-removal selector found 0 rows because the phone shows level thresholds as stacked cards) were moved to `steps-superseded-harness-misses.jsonl`, as in round 6. Preconditions P.1-P.3 are logged with surface "setup" (observed on both surfaces).

Environment: production build of 0800b1c, `node server/index.js` on port 5002, fresh database `sb_rl_val_5000_1` seeded with `npm run seed`, members from `scripts/create-test-member.mjs` only (member@test.local desktop, member2@test.local phone, empty@test.local and empty2@test.local for E.1). Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900 with mouse; phone 390x844, isMobile, hasTouch, every click replaced by a tap, the QR slider dragged with real touch events. Login through the form from the start page's "Enter my member world" link; later scripts re-entered the app at `/world` (the spec names `/world` as the World Shell address; the start page link goes to `/member`, a different home, and I found no click path from it to `/world`). Server stopped and database dropped at the end. Fictional data only.

## Fix verdicts (open bugs from the fix details)

| Bug | Maps to | Verdict | Evidence |
|---|---|---|---|
| T6-1 (blank selects at 390px, J5.2 rows unidentifiable) | J5.1, J5.2 (phone) | **Verified fixed.** The formula editor stacks every input as a labelled card (INPUT / WEIGHT / CAP, readable select text "Years performed", "Engagements / roles applied in"); Cap 10 and Expert minimum 12 entered and saved, toast and "capped at 10" breakdown seen. | mobile-J5-1-editor, mobile-J5-2-after |
| F6-13 (J5.2 Save and use) | J5.2 | Passes on both surfaces. | J5-2-after |
| T6-4 / F6-5 (MCP tools for proficiency, certification bonus, delete, live QR) | MCP parity for J1-J7 | **Verified, except one tool defect (see observations).** The registry has `proficiency_rules_read`, `proficiency_override_set/clear`, `technology_category_set`, `proficiency_formula_save/select`, `certification_mapping_save`, `career_experience_definition_delete`, `shared_output_live_read`, `application_output_approve_for_qr/revoke_qr`. Called through `/mcp` as both test users with a token made on World Shell -> Journeys -> Connected Agents. Results match the UI: Ledgerly ERP Advanced 8 pts; override gives Advanced with `basis=member_override` and methodology Expert 17; cert bonus gives Expert 11 pts ("certificationBonus 3 x 1 = 3"); the delete tool returns it to Advanced 8 pts (the missing delete tool of round 6 now exists); a formula with cap 10 gives "Process design 11 (counted 10) = 10"; methodology edit and delete refused 403 as `isError`; unknown input refused 400; approving with an uncategorised technology refused `409 tool_category_required`; after categorising, approve returns the `/r/` url, `shared_output_live_read` returns the document, then 404 after revoke. | scripts mcp2/mcp2m/mcp4 in the agent scratch folder |
| F3-1, F4-5, F6-8, T6-5 (third wording state, history refresh) | J7.1 | Partly improved. "Save as Output" on the Primary Resume now creates a new output (history went from 2 to 3 cards, POST /api/resume-outputs 200), so the earlier silent no-op is gone. The "not career-bound, unchanged" sentence ("always stays exactly as approved") was still not reached: the only two cards offering "Approve for QR" were the career-bound ones, and I did not find the approve control on the saved card. The two career-bound states pass. | observation below |
| F2-4, F3-4, F4-4, F6-10 (Salt particles design, owner) | J7.4 | Still open for the owner. Behaviour passes both surfaces: grains fall over about 1.7 s then hold constant, settle into a column with a gold line and "6 yrs" on top, tooltip "Northwind Advisory / Senior Consultant / 6 yrs" on hover (desktop) or tap (phone), Table has a "Since printed" column reading Same. | desktop-J7-4-particles-settled, mobile-J7-4-particles-settled |
| F6-7, T6-3 (Levels table needs in-table swipe at 390px) | J8.4 | **Still failing**, unchanged (needs_business_definition). See Failures. | desktop-J8-4-rules-levels, mobile-J8-4-rules-levels |
| T6-6 (J7.5 level-change wording) | J7.5 | Resolved by amendment A1: the page prints "Forecast modeling — printed Expert → now Advanced (user-defined)", which the v2 spec now names. Passes. | J7-5-qr-top |
| T6-7 (J8.3 unstated Proficiency chart precondition) | J8.3 | Resolved by amendment A1 (the step now says to add the chart). I added the chart with "+ Add" on the Proficiency card; after the override the preview showed "PROFICIENCY TIERS" with "Forecast modeling † Proficient". Passes. | desktop-J8-3-after-add-chart, desktop-J8-3-infographics-after |
| F4-8, F6-9, F6-12, F6-14 (spec nits, non-career-bound creation, My Resume entry) | E.3 / J6.2 | E.3 passes on both surfaces through the UI (removing every level threshold gives toast "A formula needs at least one level threshold.", nothing saved); the unknown-input half is reachable only by API/MCP (400, nothing saved). My Resume on the phone is still reached through World Shell -> Journeys, not Classic Tools (no business definition given). | E3-error-toast |
| resume-rollups-B4 (reassigned) | none in this baseline | Not part of this feature; not tested. | |

## Failures

- **[J6.4] both surfaces.** Step: choose Hands-on, click "Save to Career Master and continue"; expect the dialog to close, the approval to complete (toast "Approved — private QR link created…", a QR code and link under the output), the banner gone. Observed: dialog closed, QR code and link shown, banner gone, but the toast reads "Approved - private QR link created (copied to clipboard)." with a plain hyphen, not the em dash the spec quotes. Captured from the page on the phone run (`.sb-toast` text). The desktop log line reads `toast=null` because my first desktop poll missed the 2.4 s toast, but the source and the production bundle carry the same hyphen. Cause: a commit after c3a71b4 changed `src/components/admin/MyResumePanel.jsx:656` from an em dash to a hyphen (the only quoted spec string that changed). Round 6 passed this step with the em dash. Probably cosmetic (spec_error or defect, for triage to classify); I report it literally and did not treat a hyphen as an equivalent. Evidence: desktop-J6-4-qr-after.png, mobile-J6-4-qr-after.png.
- **[J8.4] both surfaces (390px).** Expected: no sideways panning inside the page or its scroller to read the Rules & why panel. Observed: tab row wraps (3 + 2), Rules & why reachable, editor stacks in one column, the page itself does not scroll sideways (scrollWidth 390), but the Levels and why table is 940px wide inside a 239px scroller, so "How it was used", "Decided by", "Points behind it", "Methodology alone" and "Your override" need an in-table swipe. Same as rounds 5 and 6 (open bugs F6-7, T6-3, needs_business_definition): the owner must say whether the captioned in-table scroll is accepted (and J8.4 reworded) or the table must stack as cards at phone width. Desktop was run by resizing the window to 390px. Evidence: desktop-J8-4-rules-levels.png, mobile-J8-4-rules-levels.png.

No MCP_GAP, UI_GAP or MOBILE_GAP failures this round: every baseline step was done by point-and-click on both surfaces.

## Per-step results

Every step ran on desktop and on the 390px phone unless noted; "pass" means both surfaces passed.

| Step | Result | What was seen | Screenshot (desktop-/mobile- prefix) |
|---|---|---|---|
| P.1 | pass | Logged in through the form on both surfaces | P1-login-after |
| P.2 | pass | Skills, tools, certification and a fictional job added through Manual Intake | P-final-tools |
| P.3 | pass | Career-bound resume output created via "New career-bound resume from Career Master" | P3-after-new-output |
| J1.1 | pass | Three cards, LOCKED tag, radio selected | J1-1-rules-top |
| J1.2 | pass | Ledgerly ERP Advanced, Salt Basin methodology, 8 pts, both lines, Methodology alone Advanced · 8 pts (phone needs the accepted in-table swipe) | J1-2-levels |
| J1.3 | pass | Amber banner "2 technologies need a proficiency category (Ledgerly ERP, QuoteFlow CPQ)", two "Required before any output can be finalized" notes | J1-3-banner |
| J2.1 | pass | Toast, note gone, banner count 1 | J2-1-after |
| J2.2 | pass | Field reads integration_design | J2-2-tool-edit |
| J3.1 | pass | Toast, Advanced †, Your override †, Set by hand, Expert · 17 pts, closing † sentence | J3-1-after |
| J3.2 | pass | Back to Expert, Salt Basin methodology | J3-2-undo |
| J4.1 | pass | Form with Save bonus opens | J4-1-form |
| J4.2 | pass | Lapsed box ticked, chip dark (rgb 27,42,59), toast, "→ +3 pts to Ledgerly ERP", Expert 11 pts, breakdown lines | J4-2-after |
| J4.3 | pass | Confirm dialog, back to Advanced 8 pts | J4-3-after |
| J5.1 | pass | Gold-bordered "New formula", name My formula, both tables; phone selects now readable (T6-1 fixed) | J5-1-editor |
| J5.2 | pass | Cap 10, Expert minimum 12, toast, My formula selected, every row "Your formula †", "Years performed: 11 (capped at 10) × 1 = 10" | J5-2-after |
| J5.3 | pass | Radio selected immediately, toast, rows back without † | J5-3-after |
| J5.4 | pass | "(read-only)", no inputs | J5-4-view |
| J6.1 | pass | QuoteFlow CPQ still uncategorised | J6-2-history |
| J6.2 | pass | Amber banner on Resume Output History naming QuoteFlow CPQ | J6-2-history |
| J6.3 | pass | Dialog "Set how each technology was used", QuoteFlow CPQ preset "Hands-on (suggested)" | J6-3-dialog |
| J6.4 | **fail** | See Failures (toast uses a hyphen, not an em dash); the rest of the step passed | J6-4-qr-after |
| J6.5 | pass | Second uncategorised tool (Fiscalis TMS); Cancel gives "Finalization cancelled — technologies still need a proficiency category."; links unchanged (2 before, 2 after) | J6-5-cancelled |
| J7.1 | pass | Dark banner (rgb 27,42,59, white text), green stripe, approval date, "The document wording currently matches the printed version." | J7-1-qr-page-top |
| J7.2 | pass | "LIVE DATA — 1 change since the approved printed version" (gold stripe), "Changed: Northwind Advisory — printed Senior Consultant, 2015–2020 · Software → now Principal Consultant, 2015–2020 · Software", wording-changed sentence | J7-2-banner |
| J7.3 | pass | Slider far left (touch drag on phone): "Viewing Approved · printed — exactly what the printed copy shows."; change lines gone from the chart view | J7-3-slider-left |
| J7.4 | pass | Grains fall and settle, gold line and "6 yrs" on top, tooltip, Table "Since printed" Same (owner design questions stay open) | J7-4-particles-settled |
| J7.5 | pass | "LIVE DATA — 3 changes": "Changed: Ledgerly ERP — printed Advanced · Integration design → now Advanced · Hands-on" exact; "Changed: Forecast modeling — printed Expert → now Advanced (user-defined)" | J7-5-qr-top |
| J8.1 | pass | Output Templates island opens the editor with five tabs and live preview | J8-1-entered |
| J8.2 | pass | "Rules & why" card with intro and the panel | J8-2-rules |
| J8.3 | pass | Proficiency chart added with "+ Add"; override to Proficient: toast, thumbnail and preview show "Forecast modeling † / Proficient" | J8-3-infographics-after |
| J8.4 | **fail** | See Failures | J8-4-rules-levels |
| E.1 | pass | Rules & why shows the exact empty message; approved output of an empty Career Master shows no charts section (banner and one sentence only) | E1-empty-rules, E1-empty-qr |
| E.2 | pass | After Revoke QR, and for a never-approved slug, "This link isn't available" | E2-revoked |
| E.3 | pass | UI error toast "A formula needs at least one level threshold.", nothing saved; unknown input refused 400 by API only | E3-error-toast |
| E.4 | pass | PUT and DELETE on the methodology both 403, methodology still present | none |

## Interface parity

- Website: every baseline step was done by point-and-click on desktop and as a 390px touch walkthrough; no UI_GAP or MOBILE_GAP this round. Exceptions to "no typed URLs": re-entering `/world` between scripts (the spec's own address), the spec's own `/r/<slug>` steps, and the E.4 API step.
- API: routes seen in the network log: `PATCH /api/career/tools/:id`, `PUT/DELETE /api/career/experience-definitions/:type/:key`, `PUT/DELETE /api/career/proficiency-assertions/skill/:id/current`, `POST /api/career-bound/outputs`, `POST /api/resume-outputs`, `POST /api/resume-outputs/:id/share` (409 while a technology lacks a category, 200 after), `GET /api/shared-outputs/:token` (404 when revoked or unknown).
- MCP: see the T6-4 row above; 96 tools listed at `/mcp`; the proficiency, category, formula, certification, delete, approve, revoke and live-read tools matched the UI results for both test users.

## Observations (not counted)

- **MCP `technology_category_set` rejects `category: null`.** The tool advertises `category: ["string","null"]` and "or clears it with null", but `{toolId, category: null}` returns `Error 400 invalid_arguments: "category" is required.` and the value stays. The website cannot clear a category either (its dropdown offers only the three categories), so there is no UI mismatch, but the tool contradicts its own description.
- **Finalization-gate toast uses a hyphen** (see J6.4); the cancel toast still uses the em dash the spec quotes, so the two strings are now inconsistent.
- **J7.1 third wording state** (non-career-bound, unchanged) still unreached: "Save as Output" now creates a card, but I did not find an "Approve for QR" button on it. Suggested follow-up: name the control that approves a saved (non-career-bound) output in the spec.
- **Start page link goes to `/member`**, the "Choose a world" crystal home; I found no click path from it to the World Shell (`/world`), where the spec's journeys start. Login lands on `/world`, and my scripts re-entered it by address.
- **E.1 empty QR page** still says "The career charts on this page update from the Salt Basin Career Master" although there are no charts (spec-compliant, slightly contextless).
- **E.3 on the phone**: the level thresholds are stacked cards; my removal loop tapped "Remove" 8 times for 5 levels, so it may also have removed term cards; the toast still read "A formula needs at least one level threshold." and nothing was saved.
- **Console and network**: no page errors and no failed app requests. HTTP errors were only the expected ones: 409 from `POST /api/resume-outputs/:id/share` (the gate, 4 times), 400 from the two invalid formula saves, 404 from revoked or unknown slugs (3). The 54 other console errors are external resource loads blocked by the sandbox (`ERR_TOO_MANY_RETRIES`, `ERR_TUNNEL_CONNECTION_FAILED`), logged as external_blocked.

## Spec ambiguities handled

- Preconditions list no job, but J7.2 needs one; I added a fictional job (Northwind Advisory, Senior Consultant) in the same Manual Intake pass.
- P.3 and J6/J7 need document content; the output was made with "New career-bound resume from Career Master".
- J6.5 "repeat with another uncategorised tool": added a fictional tool (Fiscalis TMS) after J7 so the QR change list was not disturbed.
- J8.4 on the desktop surface was run by resizing the window to 390px wide (no touch), since the step names 390px.
- J8.3: the editor had no saved preset ("No presets yet"); the Proficiency chart was added to the working template with "+ Add" (not saved as a preset), and the override was undone afterwards.
- Order run: preconditions, J1 to J5, J6.1 to J6.4, J7, J8, J6.5, edge cases (E.2 revoke last), then MCP checks.
