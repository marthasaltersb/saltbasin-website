# Tailored application packages (local only)

Package JSON files live here **on your machine only** — this folder is
git-ignored because the repository is public and packages contain private
application material (cover letters, contact details, appendix notes).

## Workflow

1. **Extract** the package's `.docx` files into one JSON file:

   ```bash
   pip install python-docx
   python scripts/extract-application-package.py acme-2026-09 \
     server/data/applicationPackages/acme-2026-09.json \
     --company Acme --created 2026-09-30T13:00:01Z \
     --authors "Author One; Author Two" \
     resume_salt_basin=Resume_Salt_Basin.docx resume_ats=Resume_ATS.docx \
     cover_letter=Cover_Letter.docx application_package=Application_Package.docx
   ```

   `--created` is the real creation date. Don't use the `.docx` file's own
   date: python-docx stamps a fixed 2013-12-23 placeholder on every file
   it writes.

2. **Import** into your Resume Output History (safe to re-run; unchanged
   outputs are skipped, changed ones become new draft versions):

   ```bash
   PUBLIC_BASE_URL=https://saltbasin.net node scripts/import-application-package.mjs \
     server/data/applicationPackages/acme-2026-09.json
   ```

3. **Approve** each document in My Resume → Resume Output History →
   **Approve for QR**. That records you as the approver and creates the
   document's private `/r/<slug>` link + QR code (SVG/PNG download beside it;
   the PDF download embeds it). Approving a newer version later moves the
   same QR to it, so printed copies keep working. **Revoke QR** kills the link.

4. **Sync the site** with the package's facts (dry run by default):

   ```bash
   PUBLIC_BASE_URL=https://saltbasin.net node scripts/sync-site-with-application-package.mjs \
     server/data/applicationPackages/acme-2026-09.json            # report only
   # … --apply            saves fixes to the site draft
   # … --apply --publish  saves and publishes
   ```

   Career Master differences (titles/dates) are reported, never changed —
   fix those in the Career Master tab.
