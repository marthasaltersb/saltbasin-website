# Change spec: QR-gated tailored application outputs

Version 1 · 2026-10-02 · feature key `qr-gated-outputs` · release `2026-10-02-completed-commits`

This spec documents a feature that was already built and committed; the release-loop build step added the specs and one minimal product fix found while walking the journeys (see "Defect found and fixed").

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| `d78bcda` "Add QR-gated tailored application outputs with authorship metadata" | commit | The feature itself: import, metadata, approve-for-QR, private slug, revoke. This spec describes it. |
| `76b33ad` "Make QR codes clickable links to their private slug" | commit | Adds the clickable QR in the PDF, `.docx` stamp, `/r/<slug>` page and My Resume. |
| `CLAUDE.md` section "Tailored application packages + QR-gated sharing" | as of 2026-10-02 | Authoritative summary of the contract (QR gate, metadata, PDFs, no package JSON in git). |
| `server/data/applicationPackages/README.md` | as of 2026-10-02 | The extract, import, approve, site-sync workflow. |
| `docs/changes/proficiency-rules-and-live-qr.md` | unversioned, 2026-10-02 | Builds on top: adds the `shared_snapshot` / `share_history` columns and the live-data panel on the same `/r/<slug>` page, and the technology-category finalization gate that "Approve for QR" must pass. |
| `docs/training/proficiency-rules-and-live-qr.md` | unversioned, 2026-10-02 | Covers the proficiency screens and the live QR panel. This feature's training spec (`docs/training/qr-gated-outputs.md`) covers the import to approve to revoke lifecycle of the link and does not repeat the live-data journeys. |
| `docs/changes/failed-commands-reconciliation.md` | unversioned, 2026-10-02 | Convention: nothing fails silently. Applies to the error toasts below. |

Nothing is superseded.

## What changed (as built in `d78bcda`, `76b33ad`)

A **tailored application package** (for example a Salt Basin-format resume, an ATS resume, a cover letter) is filed as ordinary `resume_output_projections` rows, so it uses the existing view / PDF / ZIP / email / status pipeline. Each document can be shared through a private, unguessable `/r/<slug>` link and QR code that resolves only after the owner explicitly approves a version.

User-visible behaviour:

1. **Import** (script, local only): `scripts/import-application-package.mjs <package.json>` signs in as the member and calls `POST /api/resume-outputs/import-package`. Each output becomes a draft row labelled **Imported**. Re-running skips unchanged outputs; changed ones become new draft versions in the same lineage. Import never approves anything.
2. **Metadata** on every output: authors, real creation date (`createdAt` from the package), last-modified date (the date the content last changed; approval never bumps it), approver and approval date. Shown as one line in My Resume, in the View modal, on the QR page footer and in the PDF; also written into the PDF info dictionary.
3. **Approve for QR** (My Resume, Resume Output History): confirms, passes the technology-category gate, publishes this version, records the approver, and mints the document's slug on first approval. The row then shows the QR image, the full `/r/<slug>` link, **Copy link**, **QR (SVG)** and **QR (PNG)**.
4. **One QR per document**: approving a newer version of the same document moves the same slug to it (the earlier version loses its link and drops from Published to Approved). Printed QR codes keep working and always open the version approved last.
5. **Revoke QR** clears the slug. A revoked slug is never reissued; approving again mints a fresh slug.
6. **`/r/<slug>` page**: public (no sign-in), renders the document as approved, a clickable QR (caption "Scan or click for current version"), the live-data panel, **Download PDF**, **Print** and the metadata footer. A revoked, unapproved, superseded-and-cleared or unknown slug all show the same page: "This link isn't available".
7. **PDF**: document_blocks render with the bundled DejaVu Sans; the QR, its caption and the footer "Verified copy: <url>" are pdfkit link annotations to the same slug.
8. **Search/privacy**: `/r/*` and `/api/shared-outputs/*` answer `X-Robots-Tag: noindex, nofollow, noarchive`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store`; the page also adds a `robots` meta tag.

## Data model (additive only)

`resume_output_projections` gained (idempotent `ADD COLUMN IF NOT EXISTS` in `server/db.js bootstrap()`): `share_token` (unique partial index), `authors` JSONB array, `source_created_at`, `updated_at`, `approved_by`, `approved_at`. `shared_snapshot` / `share_history` JSONB and `share_sync_error` were added later by the proficiency/live-QR work. No member rows are written by seed or bootstrap. `generated_content` uses `{ format: 'document_blocks', version: 1, header, blocks }`. JSONB parameters are passed as raw JS values, never pre-stringified.

## Server

- `server/lib/applicationPackages.js`: `importApplicationPackage`, `approveOutputForSharing` (calls `assertReadyToFinalize` first), `revokeOutputSharing`, `getSharedOutputByToken` (only `published` rows with `approved_by`), `publicSharedView`, `shareUrlFor`.
- `server/routes/resumeOutputs.js` (authenticated, member-scoped): `POST /import-package`, `POST /:id/share`, `DELETE /:id/share`, `GET /:id/qr.svg|png`.
- `server/routes/sharedOutputs.js` (public): `GET /api/shared-outputs/:token`, `GET /api/shared-outputs/:token/download.pdf`. Unknown, revoked and unapproved all answer a plain 404.
- `server/lib/outputRendering.js`: document_blocks PDF, metadata, clickable QR.
- `server/lib/finalizationGates.js`: `assertReadyToFinalize` returns HTTP 409 `tool_category_required` when a Career Master tool has no "How it was used" category.

## Client

- `src/components/admin/MyResumePanel.jsx`: **Approve for QR** runs through `useToolCategoryGate().run(...)`, so the "Set how each technology was used" prompt appears, saves to Career Master and retries. **Revoke QR**, QR image, link, **Copy link**, QR downloads. Errors are shown as toasts, never swallowed.
- `src/components/SharedOutputPage.jsx`, `src/components/DocumentBlocksView.jsx`: the public page, the metadata line (`formatMetadataLine`) and the clickable QR.
- `src/App.jsx`: route `/r/:token`.

## Behaviour changes to know

- The slug is a 144-bit base64url string (24 characters). Anyone holding the link can read the document; nothing lists it.
- Approving the cover letter and the resume are independent: each document (version lineage) has its own slug.
- After a newer version takes over the slug, the earlier row keeps its "Approved by ..." metadata line and status **Approved**; it still offers **Approve for QR** (which would move the slug back).
- The "Modified" date is the date the row's content was filed or last changed (the import date in the walk below), not the package's creation date.
- The link base is `APP_BASE_URL` when set, otherwise the request host; the QR and the PDF embed whichever the server resolves.
- Login is rate limited to 10 attempts per 15 minutes per client; test agents should sign in once and reuse the session.

## Verified (initial check)

Run 2026-10-02 against a fresh database `sb_rl_bld_1` (Postgres 16, local) with `npm run build` output served by `NODE_ENV=production node server/index.js` on port 3802:

- `npm run build` passes. The server boots on the empty database ("listening on port 3802", admin seeded). The `[db] ... may not exist yet on first install` warnings and `NOTICE ... already exists, skipping` lines are expected, benign output.
- Every journey in `docs/training/qr-gated-outputs.md` walked once in Chromium with no failures, no page errors, and no failed network requests other than the expected HTTP 409 from the first Approve for QR (the category gate) and the expected 404 for revoked and unknown slugs. Observed values are the ones written in the training spec.
- Server-side: PDF `/URI` annotations all equal the page's slug URL (3 annotations); QR SVG/PNG routes return 200 with `image/svg+xml` / `image/png` while approved.
- Final walk: a scripted Chromium run of every journey and edge case of the training spec (73 checks) against a freshly created database passed with 0 failures. Expected non-2xx responses only: HTTP 409 from `POST /api/resume-outputs/<id>/share` (twice: the gate appeared once for the cancelled attempt and once for the approved attempt) and 404 for revoked/unknown slugs. No page errors.

## Defect found and fixed

- **Fresh database had no "My Resume" tab on first boot.** `server/db.js bootstrap()` seeded the default `admin_nav` content view with only "My Profile". The code that adds "My Resume" runs only when the `admin_nav` row already exists at boot, so a brand-new database (every validation environment, every new install) showed Classic Tools without "My Resume" until the server was restarted once, making Resume Output History unreachable from the UI. Fix: the default nav now includes `{ id: 'resume', label: 'My Resume', componentId: 'resume', sortOrder: 1 }`. It applies only when the row is first inserted, so it never touches an existing install's navigation (additive, honours the "shared config rows are additive-only" invariant). Verified by recreating the database, booting once, and reaching My Resume.

## Known limitations

- Import is a command-line script (`scripts/import-application-package.mjs`), not a screen. It files documents and does not configure anything, but there is no in-app import UI yet.
- `.docx` QR stamping and site sync are scripts too (`scripts/stamp-application-package-docx.py`, `scripts/sync-site-with-application-package.mjs`); not covered by the training spec.
- The training spec checks the PDF's link annotations with a command line (`grep`/`pdftotext`), since a browser cannot show them.
- Package JSON must never be committed (the repo is public); the training spec uses fictional JSON under `/var/tmp`.

## Fix notes per round

(none yet; fix agents append here)

### Fix notes — round 2

- **T3 (J3.3, J7.1, J8.3)**: the Approve-for-QR toast in `approveForQr` used an em dash; changed to ` - ` to match the specified text. File: `src/components/admin/MyResumePanel.jsx`. Checked: the string is the only occurrence in the source and now matches the spec text; the vite build passes.
- **T2 (J2.1)**: `header.contact` may be an array; the view concatenated entries with no separator. Added a shared normaliser `contactText()` in `src/lib/headerContact.js` (array joined with ` · `, string passed through) and used it in `src/components/DocumentBlocksView.jsx` and `server/lib/outputRendering.js`; `src/lib/documentBlocksEditor.js` now spreads an array contact into the editor's items instead of nesting it. Checked: rendered a PDF from an array-contact fixture and extracted "avery@example.test · Example City"; vite build passes. The in-browser walk of the journey steps was not run in this round (only the build and the PDF render were checked).

## Fix notes — round 3

- **qr-gated-outputs-F2-6** (contact separator): no code change needed. `contactText()` in `src/lib/headerContact.js` already joins an array with " · " and is used by `DocumentBlocksView.jsx`, the PDF path and the new .docx path. Checked: a fictional package with `contact: ["avery@example.test", "Example City"]` was imported and its downloaded .docx reads "avery@example.test · Example City". No browser walk of the View dialog was done this round.
- **qr-gated-outputs-F2-8** (docx QR / site sync): added `GET /api/resume-outputs/:id/download.docx` (`server/routes/resumeOutputs.js`), `server/lib/outputDocx.js`, `renderProjectionToDocxBuffer` in `server/lib/outputRendering.js`, a "Download .docx" button beside Download PDF in `MyResumePanel.jsx`, and `api.downloadResumeOutputDocxUrl`. The file carries the real created date, authors and approver in core properties, and (once approved) the slug QR in the header as an image whose hyperlink target is the slug URL, plus a "Verified copy" link line. Checked against a local server: imported, approved, downloaded; python-docx opened the file (created 2026-09-30T13:00:01Z) and the header relationship target equals the `/r/<slug>` URL returned by approve. Not re-walked in a browser. `scripts/sync-site-with-application-package.mjs` was not changed or exercised.
- **qr-gated-outputs-F2-10** (MCP_GAP): registered `application_output_revoke_qr`, `application_package_import`, `shared_output_resolve` in `server/lib/mcpToolRegistry.js` (approve already existed). Each calls the same server function as its route (`revokeOutputSharing`, `importApplicationPackage`, `getSharedOutputByToken`). Approve keeps the finalization gate. Parity map and manifest updated; `node scripts/check-interface-parity.mjs` reports OK. Handlers exercised directly against a local database: resolve, revoke (then resolve gives not_found, new approval mints a new slug), re-import as new version, approve.
- **qr-gated-outputs-F2-11 / F2-12**: spec amendments, not edited here (see proposedSteps in the fix output).
