# Reconciliation: qr-gated-outputs fix round 3 (branch release-loop/qr-gated-outputs-fix-r3, 27e4fda)

Release 2026-10-02-application-packages-resume. Checked by reading branch code and re-running a fresh-database boot. No code changed. Scratch database sb_rl_rec_5100_11 created and dropped.

## A. Reported items

| id | item | kind | status | evidence |
| --- | --- | --- | --- | --- |
| R1 | Compound shell lines refused by worktree guard | process | resolved | Nothing ran, no state left; commands work as separate calls or script files (this agent used a script file). |
| R2 | index_create Postgres error from db bootstrap | environment | resolved | Booted db.js bootstrap against a fresh database: exit 0, "done". The logged entries are NOTICEs (severity NOTICE, code 42P07 "relation ... already exists, skipping"; 42701 column exists; DROP INDEX IF EXISTS "does not exist, skipping"), all from idempotent IF NOT EXISTS statements. Not errors. |
| R3 | No Playwright or 390px walk this round | process | unresolved | J2.1b and the member and phone journeys are unverified in a browser. Round 4 validator must walk as member@test.local from the World Shell and at 390px. |
| R4 | Server killed, DB dropped | process | resolved | Informational; nothing left behind to check. |
| R5 | F2-11 not fixed (spec amendment: member journeys from World Shell) | owner_direction_conflict | unresolved | docs/training/qr-gated-outputs.md P.1 still says sign in as the seeded administrator; "Where things are" still routes via Classic Tools. A1 only added a phone navigation bullet. Needs reviewer-approved amendment A3 (member@test.local, entry via /world Journeys > My Resume, "Approved by" shows the member); then re-walk as member and at 390px. |
| R6 | F2-12 not fixed (spec lacks a v3 import step for the Draft card) | test_harness | unresolved | A2 was rejected (no fixture, makes E.3 order-dependent). Needs resubmitted amendment: write the fixture file, the import command, expected output, and keep E.3 deterministic (for example, a third package imported only in a separate named step after E.3, or a distinct fixture). Reviewer-only edit; spec and baselines are unchanged and must stay so. |

## B. Failures left in place by earlier rounds (not reported by the fix agent)

### N1. J2.1 View dialog still uses an em dash
- kind: product_defect, status: unresolved
- step: J2.1
- rootCause: src/components/admin/MyResumePanel.jsx:1065 reads `Read-only — no edits can be made here.`; spec line 89 expects `Read-only - no edits can be made here.` Carried unfixed since round 2 triage T1 and the r2 reconciliation N1.
- files: src/components/admin/MyResumePanel.jsx
- proposedFix: replace the em dash with a hyphen in that rendered string only (leave the code comment at line 1056). Re-walk J2.1.

### N2. E.5 sign-in limit message still uses an em dash
- kind: product_defect, status: unresolved
- step: E.5
- rootCause: server/routes/auth.js:28 `Too many attempts — please try again in 15 minutes`; spec line 201 expects a hyphen. Carried unfixed since r2 N2.
- files: server/routes/auth.js
- proposedFix: use ` - `. Grep other specs for the em dash form before changing (cover-letter-agent matches only "Too many attempts").

### N3. Contact separator fix (T2) never seen in a browser
- kind: test_harness, status: unresolved
- evidence: `src/lib/headerContact.js` is shared by DocumentBlocksView, the PDF and the new docx path (by reading). Needs observation J2.1b in a browser as the member.

## C. Gaps from the change spec "Known limitations" and earlier reconciliation

| id | gap | kind | status | evidence / proposedFix |
| --- | --- | --- | --- | --- |
| G1 | Import is a CLI script only; no in-app import UI | requirement_gap | unresolved | Change spec Known limitations still lists it. grep of src finds no caller of `/import-package` or any import control in MyResumePanel.jsx. Route `POST /api/resume-outputs/import-package` and MCP tool `application_package_import` exist, so only the website path is missing (UI_GAP). Fix: an "Import package" file picker in Resume Output History posting to the same route, showing created/unchanged/new_version, errors as toasts, plus a phone layout; or the owner records acceptance of the script. |
| G2 | .docx QR stamping and site sync are scripts | requirement_gap | partially resolved, unresolved | Download .docx exists (MyResumePanel.jsx:1019, `download.docx` route, outputDocx.js); per fix notes the header hyperlink equals the slug URL, checked with python-docx, not in a browser and not in any training journey. `scripts/sync-site-with-application-package.mjs` is still script-only and unexercised. Fix: add a journey via amendment, verify the docx link target in a browser download, and decide whether site sync needs a UI/MCP path. |
| G3 | MOBILE_GAP: Classic Tools hidden at 390px | product_defect | partially resolved | AdminShell.jsx:631 now renders `sb-admin-mobile-toggle` and spec/A1 documents World Shell > Journeys > My Resume. Not walked at 390px. Needs a phone walk. |
| G4 | MCP_GAP | requirement_gap | resolved | server/lib/mcpToolRegistry.js registers application_outputs_list, application_output_open, application_output_new_draft_version, application_output_approve_for_qr, application_output_revoke_qr, application_package_import, shared_output_resolve (lines 89-176). Fix agent ran interface-parity check OK and exercised handlers. Download of QR image/PDF via MCP not seen; confirm in validation. |
| G5 | Owner direction: everything from the World Shell | owner_direction_conflict | unresolved | Same as R5. |
| G6 | Draft-card fixture for J10.3, E.1, E.2, E.4 | test_harness | unresolved | Same as R6. |
| G7 | Package JSON never in git; PDF annotation check via grep | informational | resolved | Unchanged from r2; no applicationPackages files in the r3 diff scope reported. |

## Summary
Resolved: R1, R2, R4, G4, G7. Fix agent must do: N1, N2 (one-line strings), G1 (import UI or owner acceptance), G2 (site sync decision and journey), R3/N3/G3 re-walk as member and at 390px. Reviewer (not fix agent) must do: R5/G5 amendment A3 and R6/G6 resubmitted amendment. Round 4 cannot pass J2.1 or E.5 until N1 and N2 are fixed.
