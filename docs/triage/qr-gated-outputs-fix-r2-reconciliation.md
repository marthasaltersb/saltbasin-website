# Reconciliation: qr-gated-outputs fix round 2 (branch release-loop/qr-gated-outputs-fix-r2, 73505f4)

Release 2026-10-02-application-packages-resume. Checked by reading the branch code and re-running the build. No code changed. A boot against a scratch database was not possible in this agent's sandbox (shell construct refused); the scratch database was created and dropped.

## A. Reported items

| id | item | kind | status | evidence |
| --- | --- | --- | --- | --- |
| R1 | Failed steps J2.1, J3.3, J7.1, J8.3 not walked in a browser | process | unresolved | Only T3 (J3.3, J7.1, J8.3 toast) and T2 (contact line) were changed. `git diff c3a71b4..73505f4` touches MyResumePanel.jsx:636 (toast now hyphen, matches spec lines 100/155/169), headerContact.js, DocumentBlocksView.jsx, outputRendering.js, documentBlocksEditor.js only. J2.1 is NOT fixed (see N1). The toast fix is correct by reading but unverified in a browser. Needs a re-validation round. |
| R2 | `npm run build` exits non-zero (postbuild DATABASE_URL) | environment | resolved | Re-ran `npm run build` with DATABASE_URL unset here: build passes, postbuild prints "No Codex sandbox logs ...; skipped". The fix agent's machine had Codex logs so the script tried to import to the DB. Not a product defect of this feature; vite build itself passes. Note for the owner: postbuild making a production build depend on a database is a separate build-tooling issue (feature release-loop-tooling), not changed here. |
| R3 | "column name collision" errors from bootstrap on a fresh DB | environment | unresolved (informational, uninvestigated) | Could not reproduce in this sandbox. CLAUDE.md already records a known fresh-database bootstrap ordering bug (`organization_profiles` FK created before the table). Round-2 validator booted fresh databases without reporting it. Needs one boot of a fresh DB with the log captured; if the message names a table, file it as its own bug. Not caused by this fix (no db.js change in the diff). |

## B. Failures the fix left in place or missed

### N1. J2.1 View dialog note still uses an em dash (triage T1 never applied)
- kind: product_defect, status: unresolved
- step: J2.1 (desktop and phone)
- rootCause: triage T1 said replace the dash at MyResumePanel.jsx:1062; fix round 2 changed only line 636. Line 1062 still reads `Read-only — no edits can be made here.`; spec line 88 expects `Read-only - no edits can be made here.`
- files: src/components/admin/MyResumePanel.jsx:1062
- proposedFix: replace ` — ` with ` - ` in that string only (leave the code comment at 1053). Re-walk J2.1.

### N2. E.5 sign-in limit message still uses an em dash (triage T5 never applied)
- kind: product_defect, status: unresolved
- step: E.5
- rootCause: server/routes/auth.js:28 still `Too many attempts — please try again in 15 minutes`; spec line 200 expects a hyphen. Fix round 2 did not touch it and the fix report does not mention E.5.
- files: server/routes/auth.js:28
- proposedFix: use ` - `. Nothing else depends on the dash (cover-letter-agent spec matches only "Too many attempts"). Check no other spec expects the em dash form before changing.

### N3. Spec self-inconsistency to flag (not an edit)
- kind: informational, status: unresolved (reviewer decision)
- E.2 (spec line 197) expects the em dash in "Finalization cancelled — technologies ..." while J3.3 expects hyphen toasts. Shipped copy matches both today. Do not change E.2's product text. Any dash-style amendment must go through docs/spec-amendments/qr-gated-outputs/ by a reviewer other than the proposer.

### N4. T2 contact separator fix verified only by PDF render
- kind: test_harness, status: unresolved
- evidence: code shows `src/lib/headerContact.js` shared by DocumentBlocksView.jsx and outputRendering.js, and the editor adapter spreads arrays. Plausible and correct by reading, but the View dialog and `/r/<slug>` rendering ("avery@example.test · Example City") were not seen in a browser. Verify in round 3 (observation J2.1b).

## C. Gaps listed by the change spec's "Known limitations" and validator parity notes that the fix missed

| id | gap | kind | status | step / files | proposedFix |
| --- | --- | --- | --- | --- | --- |
| G1 | Import is a CLI script only, no in-app import | requirement_gap | unresolved | P.4, J8; scripts/import-application-package.mjs, server/routes/resumeOutputs.js (`POST /import-package` exists), MyResumePanel.jsx | Add an "Import package" file picker in Resume Output History posting to `/api/resume-outputs/import-package`, showing created / unchanged / new_version and surfacing errors as toasts; same server function. Or owner records acceptance of the script. |
| G2 | .docx QR stamping and site sync are scripts with no UI, journey, or verification (bug B10; request says "clickable QR in PDF/docx") | requirement_gap | unresolved | scripts/stamp-application-package-docx.py, scripts/sync-site-with-application-package.mjs, server/lib/outputRendering.js | Offer Download .docx stamped with the slug QR and real created/modified dates beside Download PDF, add a journey checking the hyperlink target equals the slug URL; or owner confirms docx is out of scope. |
| G3 | MOBILE_GAP: at 390 px the Classic Tools tab strip is hidden; `.sb-admin-mobile-menu-button` (src/brand.css:607, 638) has no element in any .jsx (grep confirms), so My Resume is unreachable by the spec's documented path on a phone | product_defect | unresolved | src/brand.css, admin shell header, docs "Where things are" | Render the mobile menu button in the admin/member shell, or make World Shell -> Journeys -> My Resume the documented route (the island exists: src/lib/worldIslands.js:183). Amendment needed for the spec text either way. |
| G4 | MCP_GAP: no `server/lib/mcpToolRegistry.js`; no MCP tool for list/view/approve/revoke/QR download/import/read shared output | requirement_gap | unresolved | server/lib/mcpToolRegistry.js (missing) | Register tools calling the same functions as the routes (`approveOutputForSharing`, `revokeOutputSharing`, `importApplicationPackage`, `getSharedOutputByToken`) with the same permissions and the finalization gate. Owned by feature platform-mcp; track as dependency. |
| G5 | Owner direction: everything from the World Shell. Spec "Where things are" still routes via Classic Tools -> Network Relationship Management and runs as the admin | owner_direction_conflict | unresolved | docs/training/qr-gated-outputs.md (Preconditions, Where things are, J3 step 4); a My Resume island exists (worldIslands.js:183) | Amendment: member journeys (member@test.local) entered from the World Shell, "Approved by" shows the member. Round 2 validator ran as the seeded administrator. Re-walk as the member and on a 390 px phone. |
| G6 | Draft-card fixture for J10.3, E.1, E.2, E.4 is not supplied by the spec (validator imported a third package version) | test_harness | unresolved | docs/training/qr-gated-outputs.md | Amendment adding a v3 package step. Reviewer-only edit. |
| G7 | Browser cannot show PDF annotations; J6.2 relies on `grep -a -o '/URI (...)'` (bug B11) | test_harness | resolved | Validator round 2 verified three identical /URI lines from the browser-downloaded file. No change needed. |
| G8 | Package JSON must never be committed | informational | resolved | `git status` clean of applicationPackages in round-2 E.6 pass. |

## Summary
Resolved: R2, G7, G8. Unresolved and needing a fix agent: N1, N2 (small string edits), G3 (mobile menu), G1, G2, G4 (requirement gaps, may need owner decision), G5/G6 (spec amendments by a reviewer). Needs re-validation: R1, N4. Round 3 cannot pass until N1 and N2 are fixed (steps J2.1 and E.5).
