# Test result: proficiency rules, technology categories, finalization gate, live QR page

- Feature: Proficiency rules, technology categories, finalization gate, live QR page
- Release: 2026-10-02-proficiency-live-qr
- Round: 2 (validation agent val-4500-1)
- Commit tested: 8430eae (integration head; contains fb77c78 and b586d4f)
- Date: 2026-10-02
- **passed = false**

Screenshots: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-2/
Step log: /var/tmp/sbpg/release-loop/proficiency-live-qr/round-2/steps.jsonl

Environment: production build served on port 4502, fresh database, member created only with `scripts/create-test-member.mjs` (member@test.local; a second noterms@test.local with `--no-terms` for the terms check). Headless Chromium via Playwright, logged in through the login form, World Shell navigation by clicking. Fictional data only. Server and browser killed, database dropped.

## Fix verdicts

| Fix | Verdict | Evidence |
|---|---|---|
| T1-1 configurator heading and selected path card readable | PASS at 1280px and 390px | Dark text on a light cream surface, cards opaque (J1-1-rules-top, PH-rules-top) |
| T1-2 Levels-and-why table not clipped at 390px | PASS (cramped) | Own horizontal scroll container, swipe caption, sticky first column, right-edge shadow; scrolling reveals Decided by through Your override (PH-rules-levels-scrolled-end). About one data column visible at a time. |
| b586d4f member without terms sees terms screen, not blank | PASS | noterms@test.local lands on /world showing "Career Portfolio Terms & Data Conditions" (TERMS-world); the 428s on member APIs for that account are expected |
| F2 zero-change banner should be dark | STILL FAILS (J7.1) | Zero-change banner is light beige (rgb 243,238,230) with green stripe; dark (rgb 27,42,59) only when changes exist. Owner decision: change design or spec. |
| F3 spec example for J7.5 cannot occur | CONFIRMED spec error | J2 sets Ledgerly ERP's category before approval and approval requires every category, so "printed Advanced → now Advanced · Integration design" is impossible. Behaviour is right with other changes. |
| F5 bad slug text | PASS | Revoked and unknown slugs both show "This link isn't available" |
| F5 403 editing/deleting methodology | PASS | PUT and DELETE returned 403 with the locked messages |
| F5 no thresholds error | PASS | UI toast "A formula needs at least one level threshold."; nothing saved |
| F5 unknown input error | PASS (API only) | UI select cannot produce one; same API call returns 400 "Unknown formula input: bogusInput" |
| J5.2 overrides still read "Your override †" | PASS | With a temporary override on Process design under My formula the row read "Advanced † / Your override † / Set by hand"; after removing it the row read "Years performed: 11 (capped at 10) × 1 = 10" |

## Failures

- **F2 (J7.1)**: banner light, spec says dark.
- **F3 (J7.5)**: literal example not reproducible (spec error).
- **F6 (J7.2, new, product)**: after a Career Master job-title change the approved career-bound document text on the QR page shows the NEW title ("Principal Consultant") under an amber notice "The wording of this document has changed since the printed version was approved. Showing the current wording. Show printed wording", while the dark LIVE DATA banner on the same page says "The document text above always stays exactly as approved." The messages contradict, and the spec says the text stays as approved (J7-2-qr-changed-full, PH-qr-page-full).
- **F7 (390px, new)**: on Proficiency & Rollup Configuration the 4th tab "4 · Preview rollups" extends to x=425, past the 390px viewport, clipped by an overflow-hidden ancestor; only a sliver shows, no scroll cue (PH-tabs).
- Observations, not counted: native selects in the Levels table truncate their visible text ("Use forr", "Choose — required (sug"). At 390px the World landing opens with a side panel covering almost all of the 3D scene (PH-after-reload). For plain Approve no confirm appeared (spec says "and confirm"); Approve for QR showed a native confirm before the dialog.

## Spec ambiguities handled

- Preconditions list no job, but J7.2 needs one; I added a fictional job (Harbor Light Advisory, Senior Consultant) in Manual Intake before generating the output.
- Save as Output on Primary Resume yields an output with no document content (no View / Approve for QR). I used "New career-bound resume from Career Master" for the QR journey. J6.5 Cancel needs a second uncategorised tool, so I added Fiscalis TMS after J6.4 and ran Cancel then (order swapped).
- J5.2 needs an override present; I set one temporarily on Process design and removed it.
- My first API attempt for the unknown-input case used the wrong body key (`inputs`, correct is `terms`) and saved a junk formula `zz_unknown_test` in the test database; deleted via the API. Harness error, not a product defect.

## Per-step results

| Journey | Step | Result | What was seen | Screenshot |
|---|---|---|---|---|
| Pre | 1-3 | pass | Skills, tools (blank how used), cert added; output created | 16-after-save-output |
| J1 | 1.1 | pass | Three cards, LOCKED, radio selected | J1-1-rules-top |
| J1 | 1.2 | pass | Advanced, 8 pts, both lines, Methodology alone Advanced 8 pts | J1-2-levels |
| J1 | 1.3 | pass | 2-technology banner, both Required notes | J1-2-levels |
| J2 | 2.1 | pass | Toast exact, banner count 1, note gone | J2-1-after |
| J2 | 2.2 | pass | integration_design | J2-2-tool-edit |
| J3 | 3.1 | pass | Toast, Advanced †, Your override †, Set by hand, Expert 17 pts, † sentence | J3-1-after |
| J3 | 3.2 | pass | Back to Expert / methodology | J3-2-undo |
| J4 | 4.1-4.2 | pass | Chip dark, toast, line, Expert 11 pts, breakdown | J4-2-after |
| J4 | 4.3 | pass | Back to Advanced 8 pts | J4-3-after |
| J5 | 5.1 | pass | Gold-bordered New formula editor | J5-1-editor |
| J5 | 5.2 | pass | Toast, My formula, Your formula †, capped breakdown | J5-2-after |
| J5 | 5.3 | pass | Immediate radio, toast, no † | J5-3-after |
| J5 | 5.4 | pass | (read-only), no inputs | J5-4-view |
| J6 | 6.1-6.2 | pass | Banner text exact | J6-2-history |
| J6 | 6.3 | pass | Dialog, QuoteFlow CPQ, "Hands-on (suggested)" | J6-3-dialog |
| J6 | 6.4 | pass | Dialog closes, approval completes, banner gone; Approve for QR gives toast, QR code, link | J6-4-qr-after |
| J6 | 6.5 | pass | Exact cancel toast, output unchanged | J6-5-cancelled |
| J7 | 7.1 | FAIL | Banner light, not dark (F2) | J7-1-qr-page-full |
| J7 | 7.2 | pass, F6 noted | "1 change" banner and exact Changed line; F6 contradiction | J7-2-qr-changed-full |
| J7 | 7.3 | pass | "Viewing Approved · printed — exactly what the printed copy shows." | J7-3-printed-top |
| J7 | 7.4 | pass | Particles fall and settle with gold line and value, tooltip, Table Same/Changed | J7-4-particles-settled, J7-4-table |
| J7 | 7.5 | FAIL (spec example) | 3 changes listed correctly with other values | J7-5-qr-changed-full |
| Fix | T1-1, T1-2 | pass | | J1-1-rules-top, PH-rules-levels-scrolled-end |
| Phone | QR page | pass | | PH-qr-page-full |
| Phone | Workspace tabs | FAIL (F7) | | PH-tabs |
| Edge | Bad slug | pass | | EDGE-slug-revoked |
| Edge | Methodology 403 | pass | API only | none |
| Edge | No thresholds / unknown input | pass | | F5-nothresholds-toast |
| Edge | Terms screen without terms | pass | | TERMS-world |

Counted steps: 31; failed: J7.1, J7.5, phone tabs (3); passed: 28.

## Console errors and failed requests

- Page errors: none.
- External blocked by sandbox: fonts.googleapis.com / fonts.gstatic.com certificate errors, cdnjs three r128 tunnel failure.
- Expected HTTP errors: 428 for the no-terms member; 409 from finalization gate refusals on PATCH /api/resume-outputs/1/status and POST /api/resume-outputs/3/share; 400/403 from deliberate edge-case API calls and the no-thresholds save.

## Fix details received

Round 1 fixes fb77c78 (T1-1, T1-2) and b586d4f (428 gate); open items F2, F3, F5, J5.2 as listed above.
