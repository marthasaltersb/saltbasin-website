# Test result — no-silent-failures — round 1

Feature: No silent failures (snapshot, history, live-data and load errors surfaced)
Round: 1 · Commit tested: 8430eae (integration head; feature built in 8fc685e, dd58da6)
Date: 2026-10-02 · Validator: val-4600-6 · Spec: docs/training/no-silent-failures.md v1.1
Environment: fresh local Postgres, production build served by Express on 4612, Chromium via Playwright, signed in as the test admin (the import script logs in as the admin). Both faults injected and restored with psql exactly as in the spec; server never restarted while a fault was in place. Fictional data only.

Result: 33 pass, 2 fail (both are spec-wording mismatches, no product error found).

## Per journey

| Journey / step | Result | Seen | Screenshot |
| --- | --- | --- | --- |
| P1 sign in, terms | pass | Login form to /world; terms pre-accepted | p1-after-login.png |
| P2 adds | pass | Skills (2), Jobs (1), Tools (2), Certifications (1) | p2-end.png |
| P3 import + banner | pass | "resume_standard #1 created", "cover_letter #2 created"; both Draft with Approve for QR; banner names Ledgerly ERP, QuoteFlow CPQ | p3-myresume.png |
| P4 chart template | pass | Gallery has Proficiency Tiers, Trend Bars, Career Timeline; added and Save & Set Primary. Console fixture also created (200) for J4 exact titles | p4-saved.png |
| J0.1 gate dialog | pass | Two dropdowns with Choose…, Hands-on (suggested), Integration design, Adjacent exposure; no "Suggestions are unavailable" | j0-1-gate-dialog.png |
| J0.2 approve resume | pass | Green toast, no red toast, QR + /r/ link (RESUME LINK) | j0-2-after.png |
| J0.3 approve cover letter | pass | No dialog, same toast, second link (COVER LINK) | j0-3-after.png |
| J0.4 QR resume | pass | "LIVE DATA — matches the approved printed version", no alert | j0-4-qr-resume.png |
| J0.5 Pipeline Tracker | pass | Tools (3); banner "1 technology needs a proficiency category … (Pipeline Tracker)" | j0-5-myresume.png |
| J1.1-1.2 | pass | Edit Entry open, 11 to 12, FAULT A applied | j1-1-dialog.png |
| J1.3 | pass | Toasts "Saved" and "Failed to load career master data: Failed to load career catalogs" | j1-3-toasts.png |
| J1.4 | pass | Both outputs show "QR history could not record a Career Master change (10/2/2026, 1:06:55 PM): relation "career_jobs" does not exist. It retries on your next Career Master save or when the QR page is opened." | j1-4-myresume.png |
| J1.5 | pass | Banner lists Pipeline Tracker | j1-4-myresume.png |
| J2.1 cover QR | pass | Alert exact; banner starts "RECORDED DATA —" | j2-1-qr-cover.png |
| **J2.2 resume QR** | **fail** | Alert exact, banner "RECORDED DATA — 1 change since the approved printed version"; spec says "RECORDED DATA — matches the approved printed version" | j2-2-qr-resume.png |
| J3.1 import v2 | pass | "resume_standard #3 new_version", "cover_letter #2 unchanged" | j3-2-myresume.png |
| **J3.2 reload** | **fail** | New Draft present with Approve for QR, but the earlier version still read "Published" with its QR image and Revoke QR; spec says it "now reads Approved, no QR image". It becomes Approved with no QR only after step 3.4 | j3-2-myresume.png |
| J3.3 gate (3 checks) | pass | Pipeline Tracker only; alert "Suggestions are unavailable (relation "career_proficiency_assertions" does not exist) — choose each category yourself."; options Choose…, Hands-on, Integration design, Adjacent exposure, no "(suggested)" | j3-3-gate.png |
| J3.4 approve | pass | Dialog closed; green toast then red toast "The chart snapshot for the printed version could not be captured (relation "career_jobs" does not exist). The QR page will say so and can't compare live data to print."; same link as RESUME LINK | j3-4-toast-2.png, j3-4-after.png |
| J3.5 RESUME LINK | pass | Alert exact; no dark banner; no slider | j3-5-qr-resume.png |
| J3 edge cancel | pass | Toast "Finalization cancelled — technologies still need a proficiency category." | j3-edge-cancel.png |
| J4.1 /output/resume | pass | Header Pat Example, three amber alerts in order with exact copy; neither empty-data message | j4-1-fixture.png |
| J5.1 RESTORE | pass | Both renames ok | |
| J5.2 | pass | No alerts; proficiency list in the spec order with levels; trend; timeline | j5-2-output.png |
| J5.3 | pass | Only "Saved"; row 11 | j5-3-after.png |
| J5.4 | pass | No "QR history could not record" line | j5-4-myresume.png |
| J5.5 | pass | No alert; "LIVE DATA — 1 change since the approved printed version" | j5-5-qr-cover.png |
| J5.6 | pass | Alert ends "Live career data is shown below." with live charts | j5-6-qr-resume.png |
| Edge: bogus slug | pass | "This link isn't available" | edge-bogus.png |
| Phone 390px | pass | QR page under FAULT A and /output/resume under faults readable, no clipping or horizontal scroll | phone-qr-cover.png, phone-output.png |

## Failures in detail

1. J2.2: the literal sentence after "RECORDED DATA —" differs. In the spec sequence a tool (Pipeline Tracker) is added after approval in J0.5 on the healthy path, so one recorded change already exists; the banner correctly counts it. Cover link shows the same form. Probable spec defect (the change spec itself says the banner "keeps the sentence 'matches…' / 'N changes since…'"). Classified as a spec/test-data problem, not product: suggest the spec say "RECORDED DATA —" only, or state the count.
2. J3.2: the parenthetical in the spec is true only after step 3.4. Before that the old approved version is still the published one with the live QR, which is correct behaviour (the link must keep working until the new version is approved). Probable spec defect.

## Console errors and failed requests

- Page errors: none.
- External: fonts.googleapis.com and cdnjs three.js blocked by the sandbox (external_blocked; they also appear as console errors with ERR_CERT_AUTHORITY_INVALID / ERR_TUNNEL_CONNECTION_FAILED).
- HTTP 500 on /api/career/master, /catalogs, /proficiency, /rollups only while a fault was in place (including the template editor preview showing "Could not load data for this preview" cards, which is correct behaviour).
- HTTP 409 on /api/resume-outputs/<id>/share on first approvals that opened the gate dialog (and the cancelled attempt).
- HTTP 404 on /api/members/me/profile and on /api/shared-outputs/<bogus slug> (bogus slug test).
- Nothing outside the spec's expected noise.

## Notes

- Gallery-created template (P4 path 1) uses titles "Proficiency Tiers / Trend Bars / Career Timeline" and an empty member name, so J4 exact titles and header "Pat Example" were verified with the console fixture; the gallery template showed the same notice copy with its own titles.
- Full machine log: /var/tmp/sbpg/release-loop/no-silent-failures/round-1/steps.jsonl and screenshots in the same folder.
- Cleanup: server stopped, database sb_rl_val_4600_6 dropped, both fault tables restored.
