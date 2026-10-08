# Test result: proficiency rules, technology categories, finalization gate, live QR page

- Feature: Proficiency rules, technology categories, finalization gate, live QR page
- Release: 2026-10-02-proficiency-live-qr
- Round: 3 (validation agent val-4500-5)
- Commit tested: fe28090 (integration head)
- Date: 2026-10-08
- **passed = false** (one step fails: a spec-wording error, product behaviour is correct)

Screenshots: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-3/
Step log: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-3/steps.jsonl (two early lines, J3.1 and J5.4, are harness locator misses that were re-run and logged as pass further down; the later line is authoritative)

Environment: production build on port 4510, fresh database sb_rl_val_4500_5, member created only by `scripts/create-test-member.mjs`. Headless Chromium via Playwright, login through the form, World Shell navigation by clicking, QR page opened in a fresh context (no cookies). Fictional data. Server stopped and database dropped at the end.

## Fix verdicts

| Fix | Verdict | Evidence |
|---|---|---|
| T2-1 banner always dark, stripe green/gold | PASS | Zero changes: bg rgb(27,42,59), white text, stripe rgb(47,154,104). With changes: same bg and text, stripe rgb(201,131,32). (J7-1-qr-page-top, J7-2-qr-page-top) |
| T2-2 J7.5 example now matches reachable data | PASS | Page listed "Changed: Ledgerly ERP — printed Advanced · Integration design → now Advanced · Hands-on" exactly as the spec now says (J7-5-qr-page-top) |
| T2-3 five tabs reachable at 390px | PASS for reachability, spec detail wrong | All five tabs visible and clickable, no horizontal scroll; tabs 4 and 5 opened. They wrap one per row (five lines); spec line 7 says "two lines" (PH-tabs) |
| T2-4 wording sentence by state | PASS for the two states reachable here | Career-bound unchanged: "The document wording currently matches the printed version." After the job-title change: "The document wording has changed since approval; use the notice at the top of the page to switch between the printed and current wording." The amber top notice now agrees with the banner (round-2 F6 contradiction gone). The third state (non-career-bound, frozen text) was not exercised: no non-career-bound output with document content could be approved in the UI (Save as Output on Primary Resume yields no document content, as in round 2). |

## Failures

- **Phone, workspace tabs (spec only)**: spec line 7 says the tab row "wraps onto two lines" at 390px; observed five lines, one tab per row, because the card is about 285px wide and no two tabs fit together. All five are reachable and readable. Fix the spec sentence (say "wraps, one tab per row"); no product defect.

## Observations (not counted)

- J7.5 callout for an override reads "Forecast modeling — printed Expert → now Advanced (user-defined)", not a literal "†". The chart label reads "Forecast modeling †" with the † footnote beneath; spec says "e.g." so counted as pass.
- At 390px the Definitions workspace (tab 1) shows the "Definition" text input running to the card edge, clipped on the right (PH-tabs). Pre-existing content outside this feature's steps.
- Plain **Approve** was not exercised; only Approve for QR (native confirm, then the dialog, as in round 2).
- J6.5 needed an unapproved output; I created a second career-bound output (a harness retry created one extra). Order swapped: Fiscalis TMS (fictional tool) added after J7 so the J7.1 zero-change check stayed clean.
- Not re-run this round (unchanged since round 2 pass): empty Career Master edge, no-thresholds/unknown-input formula save, terms screen.

## Spec ambiguities handled

- Preconditions list no job but J7.2 needs one; I added a fictional job (Northwind Advisory, Senior Consultant) before generating the output.
- Output created with "New career-bound resume from Career Master" (J6/J7 need document content).
- J7.1 has two states; both checked (zero change before J7.2, changes after).

## Per-step results

| Journey | Step | Result | What was seen | Screenshot |
|---|---|---|---|---|
| Pre | 1-3 | pass | Skills, tools (blank how used), cert, job, output created | pre3-after-new-output |
| J1 | 1.1 | pass | Three cards, LOCKED, radio selected | J1-1-rules-top |
| J1 | 1.2 | pass | Advanced, Salt Basin methodology, 8 pts, both lines | J1-2-levels |
| J1 | 1.3 | pass | Amber banner, two Required notes | J1-3-banner |
| J2 | 2.1 | pass | Toast, note gone, count 1 | J2-1-after |
| J2 | 2.2 | pass | Field reads integration_design | J2-2-tool-edit |
| J3 | 3.1 | pass | Advanced †, Your override †, Set by hand, Expert 17 pts, † sentence | J3-1-sentence |
| J3 | 3.2 | pass | Back to Expert / methodology | J3-2-undo |
| J4 | 4.1-4.2 | pass | Chip dark, toast, line, Expert 11 pts, breakdown | J4-2-after |
| J4 | 4.3 | pass | Back to Advanced 8 pts | J4-3-after |
| J5 | 5.1 | pass | Editor "New formula", name My formula | J5-1-editor |
| J5 | 5.2 | pass | Toast, My formula, all rows Your formula †, capped breakdown | J5-2-after |
| J5 | 5.3 | pass | Radio immediate, toast, no † | J5-3-after |
| J5 | 5.4 | pass | "(read-only)", no inputs | J5-4-view |
| J6 | 6.1-6.2 | pass | Amber banner with QuoteFlow CPQ | J6-2-history |
| J6 | 6.3 | pass | Dialog, QuoteFlow CPQ, "Hands-on (suggested)" preset | J6-3-dialog |
| J6 | 6.4 | pass | Dialog closes, toast, QR code and link, banner gone | J6-4-qr-after |
| J6 | 6.5 | pass | Exact cancel toast, link unchanged | J6-5-cancelled |
| J7 | 7.1 zero change | pass | Dark banner, green stripe, "currently matches" sentence | J7-1-qr-page-top |
| J7 | 7.1 changes | pass | Dark banner, gold stripe, "has changed" sentence | J7-2-qr-page-top |
| J7 | 7.2 | pass | "1 change" and exact Changed line | J7-2-qr-page-top |
| J7 | 7.3 | pass | "Viewing Approved · printed — exactly what the printed copy shows." | J7-3-printed-top |
| J7 | 7.4 | pass | Grains falling, settle with gold line and value, tooltip, Table Same | J7-4-fall-60, J7-4-particles-hover, J7-4-table |
| J7 | 7.5 | pass | 3 changes incl. corrected Ledgerly example | J7-5-qr-page-top |
| Phone | Tabs | FAIL (spec) | Five lines not two; all reachable | PH-tabs |
| Phone | QR page | pass | No horizontal scroll, readable | PH-qr-full |
| Phone | Rules & why | pass | Readable, table scrolls in own container | PH-rules-levels |
| Edge | Unknown slug | pass | "This link isn't available" | EDGE-slug-unknown |
| Edge | Methodology PUT/DELETE | pass | Both 403 | none |

Counted steps: 29; passed: 28; failed: 1.

## Console errors and failed requests

- Page errors: none. Failed app requests (requestfailed): none.
- External blocked by sandbox: fonts.googleapis.com / fonts.gstatic.com, cdnjs three r128 (also appear as generic console "Failed to load resource" lines).
- Expected HTTP errors: 409 on POST /api/resume-outputs/1/share and /3/share from the finalization gate, 404 on GET /api/shared-outputs/<slug> for the unknown slug, 403 from the deliberate methodology edit/delete.
