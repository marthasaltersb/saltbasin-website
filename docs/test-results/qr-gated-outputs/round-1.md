# Test result: QR-gated tailored application outputs, round 1

- Feature: `qr-gated-outputs` (built in d78bcda, 76b33ad). Training spec: `docs/training/qr-gated-outputs.md` v1.
- Round: 1 (validation agent val-4600-5)
- Commit tested: 8430eae (integration head `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-02
- Environment: fresh database, `npm run build` served by `NODE_ENV=production node server/index.js` on port 4610, Chromium via Playwright at 1280x1000 (plus 390px). Signed in once through the login form as the seeded administrator; all navigation by clicking from `/world` -> Classic Tools -> Network Relationship Management -> My Resume. Private-window steps used a fresh browser context.
- Result: **FAIL**. 48 checked expectations: 45 pass, 3 fail. The failures are literal-text or readability mismatches; the lifecycle (import, approve, slug, move, revoke, re-issue) works.
- Data: spec fictional data only. Package files were kept in the agent's own scratch directory (not the shared `/var/tmp/qr-demo`, which other agents were using). Nothing committed.
- Screenshots: `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-1/`. Live log: `.../steps.jsonl`.

## Per journey step

| Step | Result | Seen | Screenshot |
| --- | --- | --- | --- |
| Pre 0.1 My Resume sub tab exists on first boot of a fresh DB | pass | My Resume tab present | pre-0-1-subtabs.png |
| Pre 0.2 Harborbook ERP saved, button reads Tools (1) | pass | Tools (1) | pre-0-2-saved.png |
| Pre 0.4 Import v1 | pass | `resume_main #1 created`, `cover_letter #2 created`, Next hint | n/a |
| J1.1 amber notice, two cards, IMPORTED tags | pass | exact notice text; Cover Letter card (suffix "cover letter") above Resume | j1-1-1-cards.png |
| J1.2 Generated/Draft, metadata line, buttons, no QR | pass | exact metadata line; View, Download PDF, Approve, Approve for QR, Archive (cover letter card also has "Edit with cover-letter agent", from a later feature, not in this spec) | j1-1-2-CoverLetter.png, j1-1-2-Resume.png |
| J2.1 View dialog content | **fail** | All content present, but the note reads "Read-only — no edits can be made here." with an em dash; spec says "Read-only - no edits can be made here." (hyphen) | j2-2-1-view.png |
| J2.1b contact entries readable | **fail** | Header contact entries run together: "avery@example.testExample City" (no separator), also on `/r/<slug>` at desktop and 390px. PDF shows "avery@example.test,Example City". Readability failure under the regression-gate rule | j2-2-1-view.png, j5-5-1-private-full.png |
| J2.2 Close dismisses dialog | pass | dialog gone | j2-2-2-closed.png |
| J3.1 confirm text | pass | `Approve "Harbor Demo Resume" as the final version for its QR code?` ... `You'll be recorded as the approver.` | j3-3-1-gate.png |
| J3.2 gate dialog | pass | Harborbook ERP; options Choose..., Hands-on (suggested), Integration design, Adjacent exposure; Hands-on preselected; save enabled | j3-3-2-gate.png |
| J3.2b reset to Choose... disables save | pass | disabled | j3-3-2b-reset |
| J3.3 two toasts | **fail** | First toast exact. Second reads "Approved — private QR link created (copied to clipboard)." with an em dash; spec says hyphen | j3-3-3-toasts.png |
| J3.3b amber notice gone | pass | gone | n/a |
| J3.4 Resume card after approval | pass | Published; "Approved by betsy@test.local on Oct 2, 2026"; 64x64 QR image; link `http://127.0.0.1:4610/r/<24 chars>`; Copy link, QR (SVG), QR (PNG); View, Download PDF, Revoke QR, Archive; no Approve for QR. SLUG1 = nv93NgciD2yLo24-sQ0CeTQk | j3-3-4-card.png |
| J3.5 Career Master category | pass | field reads hands_on | j3-3-5-cm.png |
| J4.1 Copy link | pass | toast "Link copied."; clipboard equals card link | j4-4-1-copy.png |
| J4.2 click QR image | pass | new tab at /r/SLUG1, document renders | j4-4-2-newtab.png |
| J4.3 QR downloads | pass | qr-1.svg (valid svg), qr-1.png 600x600 | j4-4-3-downloads.png |
| J5.1 private window page | pass | no sign-in; title "Harbor Demo Resume"; top bar; Download PDF and Print; document; QR with caption; live-data panel renders; exact footer line | j5-5-1-private.png |
| J5.2 click QR stays on slug | pass | URL unchanged | j5-5-2-after-click.png |
| J5.3 headers | pass | `X-Robots-Tag: noindex, nofollow, noarchive`, `Referrer-Policy: no-referrer` on page and API; `Cache-Control: private, no-store` on API | n/a |
| J5.4 robots meta | pass | `noindex, nofollow, noarchive` | n/a |
| J6.1 Download PDF on private page | pass | 200 `application/pdf`, `inline; filename="Harbor-Demo-Resume-1.pdf"` (opens inline, no download event) | n/a |
| J6.2 PDF annotations and text | pass | three identical `/URI (http://127.0.0.1:4610/r/SLUG1)`; text has name, caption, authors/created/modified/approved line, `Verified copy: <url>` | j6-6-2-pdf-1.png |
| J6.3 My Resume Download PDF | pass | 200 PDF, filename Harbor-Demo-Resume-1.pdf | n/a |
| J7.1 approve cover letter | pass | confirm shown, no category dialog, toast shown, own QR and link SLUG2 = mqsGrJ0D2dzP1FVhA1Z8vurQ | j7-7-1-cl.png |
| J7.2 independent links | pass | SLUG2 differs; each opens its own document | j7-7-2-cl-private.png |
| J8.1 import v2 | pass | `resume_main #3 new_version`, `cover_letter #2 unchanged` | n/a |
| J8.2 new card at top | pass | new Draft card first, "Not yet approved", Approve for QR; older card still shows SLUG1 | j8-8-2-two-cards.png |
| J8.3 approve new version | pass | confirm, no category dialog, toast | j8-8-3-approved.png |
| J8.4 slug moved | pass | new card Published with SLUG1 link; older card Approved, no QR/link/Revoke, buttons Publish and Approve for QR | j8-8-4-both.png |
| J8.5 private window | pass | revised summary shown, old text gone, footer has approval date | j8-8-5-private.png |
| J9.1 revoke | pass | exact confirm; toast "QR link revoked."; card loses QR, link, Copy link, QR downloads, Revoke QR; status Approved; Approve for QR back | j9-9-1-revoked.png |
| J9.2 revoked page | pass | "This link isn't available" + withdrawn text, no document; API 404 | j9-9-2-unavailable.png |
| J9.3 re-approve | pass | SLUG3 = 9XoghAVwk1So80__caq2ygML differs; SLUG1 still unavailable; SLUG3 shows document | j9-9-3-reapproved.png |
| J10.1-10.2 unknown and `/r/short` | pass | identical unavailable page, text identical to the revoked page | j10-short.png |
| J10.3 Draft card has no link | pass | imported v3 draft: no link, no QR | j10-10-3-draft.png |
| Edge E1 re-import same package | pass | `resume_main #3 unchanged`, `cover_letter #2 unchanged`; no new cards | e1-cards.png |
| Edge E2 cancel the confirm | pass | nothing changed | e2-cancel-confirm.png |
| Edge E3 cancel the gate | pass | added "Gatecheck Tool" with How used (none); gate listed it; Cancel gave toast "Finalization cancelled — technologies still need a proficiency category." (matches spec); card stayed Draft, no link | e3-cancelled.png |
| Edge E4 archive | pass | archived card shows only View, Download PDF; no Approve for QR | e4-archived.png |
| Phone 390px (private page and My Resume history) | pass | no horizontal scroll (scrollWidth 390/390), readable, toast and buttons reachable | phone-r-slug.png, phone-myresume-history.png |

## Console errors and failed requests

- No page errors.
- Expected non-2xx: HTTP 409 on `POST /api/resume-outputs/1/share` (gate; twice because an earlier run of this agent's script opened the gate and aborted before saving, then the real approval) and on `POST /api/resume-outputs/4/share` (gate cancel, E3); HTTP 404 on `/api/shared-outputs/<revoked|unknown|short>`.
- `net::ERR_ABORTED` on `/api/career-agents/resume-outputs/1/download.pdf`: the browser turning the PDF response into a download; not a failure.
- External blocked by sandbox (`external_blocked`): Google Fonts CSS and cdnjs three.js, with matching generic console errors.

## Failures, for triage

1. **J2.1 / J3.3 dash mismatch**: the app uses em dashes ("Read-only — no edits can be made here.", "Approved — private QR link created ...") where the training spec writes " - ". Likely a spec wording fix unless the product intends hyphens. Source: `src/components/admin/MyResumePanel.jsx:627`.
2. **J2.1b contact line**: the document view renders `header.contact` entries with no separator on the web (platform modal and `/r/<slug>`), while the PDF uses a comma. Product fix; readability.

## Other observations (not failures)

- The cover letter card has an extra "Edit with cover-letter agent" button from a later feature; the spec does not mention it.
- The "Back to World" button overlaps the "Salt Basin Net Works" wordmark in the classic-tools header at both widths (pre-existing shell chrome).
- After adding a second technology (E3), the live-data panel on `/r/<slug>` correctly reports "1 change since the approved printed version"; unrelated to this feature.

## Cleanup

Server stopped by PID file; database `sb_rl_val_4600_5` dropped.
