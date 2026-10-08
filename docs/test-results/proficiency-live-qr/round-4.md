# Test result: proficiency rules, technology categories, finalization gate, live QR page

- Feature: Proficiency rules, technology categories, finalization gate, live QR page
- Release: 2026-10-02-proficiency-live-qr
- Round: 4 (validation agent val-4500-9)
- Commit tested: 6cc72e2 (integration head, "Release loop logs: proficiency-live-qr")
- Date: 2026-10-08
- **passed = false** (one step fails: Journey 8 step 4, the Output Templates editor is unreadable at 390px)

Screenshots: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-4/
Step log: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-4/steps.jsonl (two early fail lines, J3.1 and the first J5.4, are harness locator or text-capture misses; both were re-run and logged as pass further down: J3 "3.1b" and J5 "5.4". The later line is authoritative.)

Environment: production build on port 4518, fresh database sb_rl_val_4500_9, member created only by `scripts/create-test-member.mjs` (plus a second empty member for the empty-Career-Master edge case). Headless Chromium via Playwright, login through the form, World Shell navigation by clicking, QR page opened in a fresh context (no cookies). Fictional data. Server stopped and database dropped at the end.

## Fix verdicts

| Fix | Verdict | Evidence |
|---|---|---|
| T2-3 spec line 7 reworded (one tab per row at 390px) | PASS | Career Master → Proficiency & Rollups at 390px: tabs wrap one per row (five rows), all five reachable, tabs 4 and 5 opened their workspaces, page scrollWidth 390 = viewport. The spec sentence now matches what is seen. (PH-tabs, PH-tab4, PH-tab5) |
| proficiency-live-qr-F2-2 round-3 notes state round-2 notes were code reading | PASS | docs/changes/proficiency-rules-and-live-qr.md "Fix notes — round 3" says the round-2 notes were written from build and code reading and that the browser checks are pending. Accurate; this round's browser results close that gap. One nit: it calls Rules & why "tab 4"; in the editor it is the fifth tab (Header / Footer, Stat Cards, Infographics, Sections, Rules & why). |
| proficiency-live-qr-F2-3 / new Journey 8 (Rules & why inside Output Template editor) | PARTIAL: mount works, phone layout fails | Mounted and functional on desktop (8.1, 8.2, 8.3 pass). Journey 8 step 4 fails at 390px (see Failures). |

## Carried items re-checked

- **F2-1 (J7.1, J7.2, 390px tabs were not browser-driven in round 2)**: now driven in a browser. J7.1 zero-change: banner rgb(27,42,59) with white text and green stripe rgb(47,154,104), sentence "The document wording currently matches the printed version." J7.1 with changes: same dark banner, gold stripe rgb(201,131,32), sentence "The document wording has changed since approval; use the notice at the top of the page to switch between the printed and current wording." The amber notice at the top of the page agrees. The third wording state (non-career-bound, frozen text) was not reachable: no non-career-bound output with document content could be approved in the UI (same as rounds 2 and 3). 390px tabs: pass (above).
- **F2-4 (salt particle design)**: not a validation item, waiting on owner. Observed behaviour matches the spec's first rendition: grains fall over about 1.7 seconds (sampled lit pixels rose from 0 to a constant 318 upper / 387 lower), settle with a gold line and the value ("6 yrs") on top, hover tooltip shows name, role and value. Owner question stays open.
- **Round-3 fixes T2-1, T2-2, T2-4**: re-confirmed by the J7 steps (banner always dark, stripe colour by state; Ledgerly example text exactly as the spec; wording sentence by state).

## Failures

- **J8 step 4 (phone, Output Templates → Rules & why)**. Expected: at 390px the tab row wraps and Rules & why stays reachable. Observed: the tab row does wrap (one tab per row) and Rules & why is clickable, but the editor is a roughly 799px-wide layout inside a 342px horizontal scroller. Tab and field labels are clipped at the right edge ("Header / Foo…", "Rules & wh…", the Preset info inputs cut off). After tapping Rules & why the view is cut off on both sides: the panel spans about 980px (heading box 277 to 1259 inside a 390 viewport), so the title, intro line and the formula cards are not readable without panning the inner scroller sideways, and the page gives no cue to do so. By the regression-gate ground rule (clipped or unreadable is a failure even without an error) this fails. The page itself does not scroll horizontally (scrollWidth 390). The cause is the host Output Template editor's multi-column layout (presets, editor, live preview), not the Rules panel itself; the same panel in Career Master at 390px is readable (PH-rules-levels). Evidence: PH-J8-1-tabs, PH-J8-2-rules, PH-J8-4-after-click, PH-J8-4-scrollleft0.

## Observations (not counted)

- At 1280px, in the Output Templates editor, the Rules & why levels table sits in a narrow centre column and is cut at its right edge until scrolled sideways (J8-3-after-override). Usable, tight.
- J8.3 literal reading: with no chart added to the template, the right-hand preview has no proficiency content to refresh. I added the **Proficiency Tiers** infographic ("+ Add"), then set Forecast modeling by hand; preview and Infographics thumbnails both changed in step ("Forecast modeling † Proficient" to "Forecast modeling † Advanced"), and "Use formula" returned the preview to "Forecast modeling / Expert". Consider adding "after adding the Proficiency Tiers chart" to the spec step.
- J8.1: the Output Templates island is entered from World Shell → Journeys → Output Templates ("Open configuration"). The editor opens directly with a default Resume draft; no "create a template" step was needed ("No presets yet" is shown).
- J7.4: screenshot latency is longer than the fall animation, so the falling frame cannot be captured by a screenshot. I verified the fall by sampling the canvas in-page over time (see F2-4 above) and captured the settled state with hover tooltip and Table.
- J6.3: the dialog preset reads "Hands-on (suggested)"; the spec says choose "Hands-on". Same option; treated as a pass.
- Early in the run the J3.1 sentence check read the wrong DOM node (harness miss); the real sentence reads: "Proficiency levels marked † are user-defined (1 set directly by the member), not Salt Basin methodology-driven."
- Edge "Saving a formula with an unknown input or no thresholds": driven through the API only, with a guessed payload. Both attempts returned 400 ("A formula needs at least one level threshold."); the unknown-input case was therefore refused for the threshold reason, not for the unknown input. The UI error toast was not driven. Weak coverage.
- Not re-run this round: terms screen.
- Console and network noise: only external font requests blocked by the sandbox (type external_blocked), the expected 409 from the finalization gate (POST /api/resume-outputs/:id/share, three times, the gate's trigger), and the expected 404 for the unknown slug. No page errors. No failed app requests.

## Spec ambiguities handled

- Preconditions list no job but J7.2 needs one; I added a fictional job (Northwind Advisory, Senior Consultant) before generating the output.
- Output created with "New career-bound resume from Career Master" (J6 and J7 need document content).
- J6.5 "repeat with another uncategorised tool": I added a fictional tool (Fiscalis TMS) after J7.5, and a second output, so the J7.1 zero-change check stayed clean.
- J7.1 has two states; both checked (zero change before J7.2, changes after).
- Order run: preconditions, output created, J1 to J5, J6.1 to J6.4, J7, J6.5 (second tool and output), J8, phone checks, edge cases.

## Per-step results

| Journey | Step | Result | What was seen | Screenshot |
|---|---|---|---|---|
| Pre | 1-3 | pass | Two skills, two tools (blank how-used), certification, job, career-bound output | P-final-tools |
| J1 | 1.1 | pass | Three cards, LOCKED, radio selected | J1-1-rules-top |
| J1 | 1.2 | pass | Ledgerly ERP Advanced, Salt Basin methodology, 8 pts, both lines, Methodology alone Advanced 8 pts | J1-2-levels |
| J1 | 1.3 | pass | Amber banner, two "Required before any output can be finalized" notes | J1-3-banner |
| J2 | 2.1 | pass | Toast, note gone, count 1 | J2-1-after |
| J2 | 2.2 | pass | Field reads integration_design | none (text read) |
| J3 | 3.1 | pass (re-run as 3.1b) | Toast, Advanced †, Your override †, Set by hand, Expert 17 pts, † sentence | J3-1-sentence-final |
| J3 | 3.2 | pass | Back to Expert, Salt Basin methodology | J3-2-undo |
| J4 | 4.1-4.2 | pass | Chip dark, toast, line, Expert 11 pts, breakdown | J4-2-after |
| J4 | 4.3 | pass | Back to Advanced 8 pts | J4-3-after |
| J5 | 5.1 | pass | Editor "New formula", name My formula | J5-1-editor |
| J5 | 5.2 | pass | Toast, My formula selected, every row Your formula †, capped breakdown (11 capped at 10) | J5-2-after |
| J5 | 5.3 | pass | Radio selected immediately, toast, no † | J5-3-after |
| J5 | 5.4 | pass (re-run) | "(read-only)", no inputs | J5-4-view |
| J6 | 6.1-6.2 | pass | Amber banner on Resume Output History with QuoteFlow CPQ | J6-2-history |
| J6 | 6.3 | pass | Dialog lists QuoteFlow CPQ with "Hands-on (suggested)" preset | J6-3-dialog |
| J6 | 6.4 | pass | Dialog closes, toast "Approved — private QR link created…", QR code and link, banner gone | J6-4-qr-after |
| J6 | 6.5 | pass | Exact cancel toast, link unchanged | J6-5-cancelled |
| J7 | 7.1 zero change | pass | Dark banner, green stripe, approval date, "currently matches" sentence | J7-1-banner, J7-1-qr-page-top |
| J7 | 7.2 (and 7.1 with changes) | pass | "LIVE DATA — 1 change…", exact Changed line, gold stripe, "has changed" sentence | J7-4-particles-hover, J7-2-banner |
| J7 | 7.3 | pass | "Viewing Approved · printed — exactly what the printed copy shows." | J7-3-printed-top |
| J7 | 7.4 | pass | Grains fall and settle, gold line and value, hover tooltip, Table "Since printed" = Same | J7-4-particles-hover, J7-4-table |
| J7 | 7.5 | pass | 3 changes incl. "Ledgerly ERP — printed Advanced · Integration design → now Advanced · Hands-on" and Forecast modeling Expert → Advanced (user-defined) | J7-5-banner |
| J8 | 8.1 | pass | Five tabs incl. Rules & why | J8-1-tabs |
| J8 | 8.2 | pass | "Rules & why" card with intro and Formula in use, Levels and why | J8-2-rules |
| J8 | 8.3 | pass (with note) | Thumbnails and live preview refresh to the new level once a Proficiency chart is in the template | J8-3-infographics-advanced |
| J8 | 8.4 | FAIL | Tab row wraps and tab is reachable, but editor clipped and unreadable at 390px | PH-J8-4-after-click |
| Phone | Career Master tabs | pass | One tab per row, all five reachable, no horizontal page scroll | PH-tabs |
| Phone | QR page | pass | No horizontal scroll, banner and notice readable | PH-qr-top |
| Phone | Career Master Rules & why | pass | Cards stack, table scrolls in own container with hint | PH-rules-levels |
| Edge | Unknown slug | pass | "This link isn't available" | EDGE-slug-unknown |
| Edge | Methodology PUT and DELETE | pass | Both 403 | none |
| Edge | Empty Career Master | pass | "No skills or tools yet — add them in Career Master → Manual Intake." | EDGE-empty-rules |
| Edge | Bad formula via API | pass (weak) | 400 on both attempts, see Observations | none |

Counted steps: 33 (duplicates from re-runs excluded); passed: 32; failed: 1.
