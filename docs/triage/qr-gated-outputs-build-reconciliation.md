# Reconciliation: qr-gated-outputs build (branch release-loop/qr-gated-outputs-build, 51b006c)

Date 2026-10-02 · release 2026-10-02-qr-gated-outputs · source: /var/tmp/sbpg/fail-ab900e094edcd4f01.json plus the change spec's "Known limitations". No code changed.

## A. Reported items (6)

| id | item | kind | status | evidence |
| --- | --- | --- | --- | --- |
| R1 | createdb sb_rl_bld_1 failed (database existed); dropped and recreated | environment | resolved | Shared/stale DB name; recreated fresh, state was clean. Validators use their own per-agent DB, so no recurrence. |
| R2 | Sandbox refused compound source/git/sed commands | environment | resolved | Nothing ran, no state changed; split into plain commands. Harness-only. |
| R3 | Login rate limit (10/15 min) hit; server restarted to clear | test_harness | resolved | Limit is by design (documented in training spec edge cases). Sign in once and reuse the cookie. Not a product defect. |
| R4 | Fresh DB had no My Resume tab | product_defect | resolved | Fix in 51b006c: `server/db.js` default `admin_nav` now seeds `{id:'resume'...}` (diff checked, line ~2484). Later J8 failure was script not reloading, spec/script issue only. Fixed branch contains the change. NOTE: this seeds the tab into the admin nav, see O1. |
| R5 | Playwright APIRequestContext got 401 on QR routes (Secure cookie over http) | test_harness | resolved | In-page fetch returned 200; cookie is Secure so APIRequestContext omits it on http. Validators must use in-page fetch or the browser context. |
| R6 | Cleanup note (PID file, DB dropped, helpers left in /var/tmp) | informational | resolved | Nothing in repo; nothing pushed. |

The report said the agent ran before test accounts with accepted career terms existed and possibly on a shared DB (sb_rl_bld_1). Consequence: every journey was driven as the seeded ADMIN with terms accepted by hand, which is item O1/O2 below.

## B. Items the reported list missed

### O1. Training spec drives the admin account and the admin Classic Tools path instead of a member journey
- kind: owner_direction_conflict · status: unresolved
- step: training spec "Preconditions" step 1 and "Where things are" (My Resume via /world -> Classic Tools -> "Network Relationship Management" -> My Resume); import step 4 and Journey 8 pass `ADMIN_EMAIL`/`ADMIN_INITIAL_PASSWORD`; Journey 3 step 4 expects "Approved by <seeded administrator email>".
- rootCause: Spec was written before `scripts/create-test-member.mjs` accounts existed. The feature is for a member (CLAUDE.md: member-scoped `/api/resume-outputs`; `defaultMemberConfig` memberTabs has `resume`), but the walk only proved it as admin. Member scope tab labels and the terms (platform + career) gate (`CareerConsentGate`) were never exercised.
- files: docs/training/qr-gated-outputs.md, docs/changes/qr-gated-outputs.md (Verified section), scripts/import-application-package.mjs
- proposedFix: Rewrite the spec so every journey signs in as member@test.local / TestPass!2345 (SB_EMAIL/SB_PASSWORD for the import script), uses the member's route to My Resume, and expects the member's display name in "Approved by". Add one short journey that opens the same document as admin only if admin behaviour matters. Re-walk as the member; confirm the Career Terms gate does not block Approve for QR.

### O2. Fix R4 added an entry to the admin navigation seed; My Resume has no World Shell entry point
- kind: owner_direction_conflict · status: unresolved
- step: Where things are / every journey: My Resume is reached only through Classic Tools (admin nav tab) and the db.js `admin_nav` seed.
- rootCause: Owner direction is that everything comes from the World Shell. `src/lib/worldIslands.js` has no resume/outputs island (grep finds only `resumePresets`); the 51b006c fix re-seeds a Classic Tools tab rather than providing an island entry. The Classic Tools hand-off exists, but the spec is built on the admin nav.
- files: server/db.js (~2484), src/lib/worldIslands.js, src/components/WorldShell.jsx, docs/training/qr-gated-outputs.md
- proposedFix: Needs an owner decision. Either (a) add a World Shell island/moon for Resume Outputs (deep-linking to the `resume` tab like other islands do) and write the spec's navigation from it, keeping the db.js seed only as an additive fallback; or (b) record the owner's explicit OK for the Classic Tools path. Do not add further admin-nav entries meanwhile.

### O3. Import is script-only (no in-app entry point)
- kind: requirement_gap · status: unresolved
- step: Preconditions step 4 and Journey 8 (version 2 import).
- rootCause: Change spec "Known limitations": "no in-app import UI". Release-loop trainingSpec standard requires everything "reachable from the UI — no API-only configuration"; the request begins with "fictional package import". A member cannot import from the browser; a validator runs `node scripts/import-application-package.mjs` against the server with credentials.
- files: scripts/import-application-package.mjs, server/routes/resumeOutputs.js (`POST /import-package` exists), src/components/admin/MyResumePanel.jsx
- proposedFix: Add an "Import package" control in Resume Output History (file picker posting the JSON to `/api/resume-outputs/import-package`, with the created/unchanged/new-version result shown, errors as toasts), reachable by the member; update the spec to use it. If the owner accepts the script, record that decision in the spec.

### O4. docx QR stamping and site sync are not covered or reachable in the product
- kind: requirement_gap · status: unresolved
- step: request item "clickable QR in PDF/docx"; change spec Known limitations bullet 2.
- rootCause: Only PDF clickability is checked (grep/pdftotext). `.docx` stamping (`scripts/stamp-application-package-docx.py`, needs explicit `--created`/`--qr-url`) and `scripts/sync-site-with-application-package.mjs` are scripts with no UI and no training journey; docx clickable-link behaviour is unverified.
- files: scripts/stamp-application-package-docx.py, scripts/sync-site-with-application-package.mjs, server/lib/outputRendering.js, docs/training/qr-gated-outputs.md
- proposedFix: Either offer a "Download .docx" (stamped with the slug QR, authors, created/modified) beside Download PDF and add a journey that opens it and checks the hyperlink target equals the slug URL, or have the owner confirm docx is out of scope for this release.

### O5. Training spec checks PDF link annotations only by command line
- kind: test_harness · status: unresolved (low)
- step: Journey 6 (PDF).
- rootCause: Browser cannot show annotations; spec requires shell `grep`/`pdftotext`. Acceptable, but should be an explicit harness step with a fixed command and expected 3 `/URI` entries, and the download must come from the browser's real Download PDF click (not a script fetch).
- files: docs/training/qr-gated-outputs.md
- proposedFix: State the exact command and expected output in the spec; capture the file through the browser download.

### O6. Remaining limitations that are informational
- Package JSON never committed; spec uses fictional JSON under /var/tmp (informational, resolved). Spec file is fictional-only (no employer names found).
- "Modified" date equals import date, not package date (documented behaviour; informational).
- Superseded earlier version keeps "Approved by" and offers Approve for QR again (documented behaviour; informational; confirm with owner that moving the slug back is intended).
- `scripts/create-test-member.mjs` is not on the build branch but is on the integration branch (verified via `git ls-tree`); no action beyond validators using the integration head.

## Summary
Resolved: R1-R6 (R4's fix verified in branch). Unresolved and blocking a clean pass: O1, O2 (owner direction), O3, O4 (requirement gaps), O5 (harness polish).
