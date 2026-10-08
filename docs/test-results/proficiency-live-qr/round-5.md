# Test result: proficiency rules, technology categories, finalization gate, live QR page

- Feature: Proficiency rules, technology categories, finalization gate, live QR page
- Release: 2026-10-02-proficiency-live-qr
- Round: 5 (validation agent val-4500-13)
- Commit tested: 6ac1df0 (integration head, "Release loop logs: proficiency-live-qr")
- Date: 2026-10-08
- **passed = false** (one step fails: Journey 8 step 4 read literally, the Levels table in Rules & why still needs sideways panning at 390px)

Screenshots: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-5/
Step log: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-5/steps.jsonl (two harness misses, J3 "3.1" and the first J5 "5.4", were re-run and logged as pass: "3.1b" and "5.4". The later line is authoritative.)

Environment: production build on port 4526, fresh database sb_rl_val_4500_13 (dropped, server stopped), member created only by `scripts/create-test-member.mjs` (plus a second empty member). Headless Chromium via Playwright, login through the form, World Shell navigation by clicking, QR page opened in a fresh context with no cookies. Fictional data.

## Fix verdicts

| Fix | Verdict | Evidence |
|---|---|---|
| R4-1 Output Templates editor at 390px | PASS for layout (the editor part of J8.4) | In /world, Journeys, Output Templates at 390px: document scrollWidth 390, nothing overflows the viewport in the editor, presets, Preset Info, tabs, editor and preview stack in one column, tabs wrap (3 + 2 rows) and Rules & why opens with a real click. The intro line and the Formula and Certification cards are readable. (PH-J8-1-editor, PH-J8-2-rules-intro) The Levels table is the remaining issue (see Failures). |
| F3-5 J8 layout / tab wrap | PASS for tab wrap and stacking; J8.4 as a whole fails on the Levels table | As above. J8 steps 1 to 3 pass on desktop, including the override refreshing the preview and thumbnails. |
| F3-6 round-1 fixes T1-1 and T1-2 never browser-verified | T1-1 PASS, T1-2 PASS | See carried items. |

## Carried items re-checked

- **T1-1 (dark embed readability)**: at 1280px the Career Master heading, intro, tabs and the selected path card ("Manual Intake", then "Proficiency & Rollups") are readable on the dark World shell. The selected card is opaque cream with a gold border, and the Proficiency & Rollup Configuration block sits on its own light surface with navy text. (T1-1-career-master-entry, T1-1-proficiency-heading)
- **T1-2 (390px rules table and chart scroll)**: Career Master, Rules & why at 390px: the table scrolls in its own area with a right-edge cue, a sticky first column and a caption "Swipe or scroll sideways to see every column, including 'How it was used' and 'Your override'". The QR page at 390px: page scrollWidth 390; charts show "Swipe sideways on a narrow screen to see the whole chart." and are readable at near designed size. (PH-rules-levels, PH-qr-full)
- **F3-4 Salt particles design**: not validated, waiting on owner. The behaviour matches the spec's first rendition: grains fall over about 1.7 seconds (lit pixels rise 0 to 318 upper and 387 lower, then stay constant), settle with a gold line and "6 yrs" on top, and the hover tooltip shows organisation, role and value. Owner question stays open.
- **F3-1 third J7.2 state (non-career-bound output)**: not reachable. The only creation control on My Resume is "New career-bound resume from Career Master", and the output list offers no other way to create a non-career-bound output. Raising as `needs_business_definition`: how should a member create an output that is not bound to Career Master?
- Round-3 and round-4 fixes T2-1, T2-2, T2-4 re-confirmed by J7: banner dark with white text in both states, stripe green (rgb 47,154,104) with zero changes and gold (rgb 201,131,32) with changes, wording sentences by state.

## Failures

- **J8 step 4 (phone, Output Templates, Rules & why), read literally.** Expected: at 390px the tab row wraps, Rules & why is reachable, the editor stacks in one column, and there is no sideways panning inside the page or its scroller to read the Rules & why panel. Observed: everything except the last clause is met. The Levels and why table is 940px wide inside a scroller only 239px wide (nested card padding), so "How it was used", "Decided by", "Points behind it", "Methodology alone" and "Your override" can only be read by swiping sideways inside the table (a caption says to swipe). The page itself does not scroll sideways (scrollWidth 390). Ambiguity: the spec does not say whether a captioned in-table scroll is acceptable. Followed literally, the panel cannot be read without sideways panning, so I record a failure. Question for the owner or spec author: accept the captioned table scroll (same behaviour as Career Master, which round 4 accepted) and reword J8.4, or stack the levels table as cards at phone width. Evidence: PH-J8-2-levels, PH-J8-2-rules-full (probe: scroller clientWidth 239, scrollWidth 940).

## Observations (not counted)

- Career Master, 1 · Definitions at 390px: the "Definition" text input in the Time periods cards extends past the card's right edge (PH-tabs). This is the Definitions workspace, not a feature step. Worth a look.
- QR page at 390px: the "Data timeline" slider labels are cramped once there are 6 updates (each label wraps to five lines), but remain readable.
- J8.3 literal reading: the Infographics thumbnails refresh with the override without any extra step; the right-hand preview only shows proficiency after the Proficiency chart is added to the template ("+ Add"). With the chart added, preview and thumbnails both moved Proficient to Advanced with a dagger, and "Use formula" returned the preview to "Forecast modeling / Expert". Suggest adding "after adding the Proficiency chart" to the step.
- J6.3: the preset reads "Hands-on (suggested)"; the spec says Hands-on. Same option, treated as pass.
- Edge "bad formula": with the server's real payload shape, an unknown input is refused (400, "Unknown formula input: nonexistent") and nothing is saved. My second call (empty thresholds, with an input name I guessed wrong) was refused for the unknown-input reason, so the no-thresholds refusal was not isolated this round (round 4's guessed payload showed it). The UI error toast was not driven.
- Edge "empty Career Master": the Rules & why message passes. The empty member's QR page ("no charts section") was not driven (that member has no approved output).
- Console and network: only external font requests blocked by the sandbox (type external_blocked, shown by the browser as ERR_TOO_MANY_RETRIES), the expected 409 from the finalization gate (POST /api/resume-outputs/:id/share, 3 times, the gate's trigger), and the expected 404 for the unknown and revoked slug. No page errors, no failed app requests.
- Harness misses, both re-run and passing: J3.1 first run read the wrong DOM node for the sentence; J5.4 first run checked before the panel opened. A toast check for "Ledgerly ERP: Hands-on" in the J7.5 setup script read false, but the PATCH returned 200 and the QR page listed the change (the same toast was verified in J2.1).

## Spec ambiguities handled

- Preconditions list no job but J7.2 needs one; I added a fictional job (Northwind Advisory, Senior Consultant) before generating the output, then changed its title to Principal Consultant for J7.2.
- Output created with "New career-bound resume from Career Master" (J6 and J7 need document content).
- J6.5 "repeat with another uncategorised tool": added a fictional tool (Fiscalis TMS) after J7.5 and made a second output.
- J7.1 has two states; both checked (zero change before J7.2, changes after). The third (non-career-bound) is not reachable (above).
- Order run: preconditions, output, J1 to J5, J6.1 to J6.4, J7, J6.5, J8 (desktop then 390px), phone checks, edge cases including revoke.

## Per-step results

| Journey | Step | Result | What was seen | Screenshot |
|---|---|---|---|---|
| Pre | 1-3 | pass | Two skills, two tools (blank how-used), certification, job, career-bound output | P-final-tools |
| J1 | 1.1 | pass | Three cards, LOCKED, radio selected | J1-1-rules-top |
| J1 | 1.2 | pass | Ledgerly ERP Advanced, Salt Basin methodology, 8 pts, both lines, Methodology alone Advanced 8 pts | J1-2-levels |
| J1 | 1.3 | pass | Amber banner for 2 technologies, two "Required before any output can be finalized" notes | J1-3-banner |
| J2 | 2.1 | pass | Toast, note gone, count 1 | J2-1-after |
| J2 | 2.2 | pass | Field reads integration_design | J2-2-tool-edit |
| J3 | 3.1 | pass (re-run as 3.1b) | Toast, Advanced dagger, Your override dagger, Set by hand, Expert 17 pts, dagger sentence | J3-1-sentence-final |
| J3 | 3.2 | pass | Back to Expert, Salt Basin methodology | J3-2-undo |
| J4 | 4.1-4.2 | pass | Chip dark (rgb 27,42,59), toast, line, Expert 11 pts, breakdown | J4-2-after |
| J4 | 4.3 | pass | Back to Advanced 8 pts | J4-3-after |
| J5 | 5.1 | pass | Editor "New formula", name My formula | J5-1-editor |
| J5 | 5.2 | pass | Toast, My formula selected, every row Your formula dagger, "11 (capped at 10) × 1 = 10" | J5-2-after |
| J5 | 5.3 | pass | Radio selected immediately, toast, rows back without dagger | J5-3-after |
| J5 | 5.4 | pass (re-run) | "(read-only)", no inputs | J5-4-view |
| J6 | 6.1-6.2 | pass | Amber banner with QuoteFlow CPQ on Resume Output History | J6-2-history |
| J6 | 6.3 | pass | Dialog lists QuoteFlow CPQ, preset "Hands-on (suggested)" | J6-3-dialog |
| J6 | 6.4 | pass | Dialog closes, toast "Approved — private QR link created (copied to clipboard).", QR and link, banner gone | J6-4-qr-after |
| J6 | 6.5 | pass | Exact cancel toast, link unchanged | J6-5-cancelled |
| J7 | 7.1 (zero change) | pass | Dark banner, green stripe, approval date, "currently matches" sentence | J7-1-qr-page-top |
| J7 | 7.2 (and 7.1 with changes) | pass | "LIVE DATA — 1 change…", exact Changed line, gold stripe, "has changed" sentence | J7-2-banner |
| J7 | 7.3 | pass | "Viewing Approved · printed — exactly what the printed copy shows." | J7-3-printed-top |
| J7 | 7.4 | pass | Grains fall and settle, gold line and value, hover tooltip, Table "Since printed" = Same | J7-4-settled, J7-4-particles-hover, J7-4-table |
| J7 | 7.5 | pass | 3 changes incl. Ledgerly ERP Integration design → Hands-on and Forecast modeling Expert → Advanced (user-defined) | J7-5-qr-page-top |
| J8 | 8.1 | pass | Five tabs incl. Rules & why | J8-1-tabs |
| J8 | 8.2 | pass | "Rules & why" card with intro line and the panel | J8-2-rules |
| J8 | 8.3 | pass (see observation) | Thumbnails and preview refresh with the new level | J8-3-infographics-advanced |
| J8 | 8.4 | **fail** | Layout stacked and fits; Levels table needs in-table sideways scroll | PH-J8-2-levels |
| Edge | bad slug / revoked link | pass | "This link isn't available" for an unknown slug and after Revoke QR | EDGE-slug-unknown, EDGE-revoked-qr |
| Edge | empty Career Master | pass | "No skills or tools yet — add them in Career Master → Manual Intake." | EDGE-empty-rules |
| Edge | bad formula | pass (partial) | Unknown input refused 400, nothing saved | none |
| Edge | methodology edit / delete | pass | PUT and DELETE both 403 | none |
| Phone | Career Master tabs, rules, QR page | pass | Five tabs wrap one per row, all reachable; no page scroll at 390px | PH-tabs, PH-rules-levels, PH-qr-full |
