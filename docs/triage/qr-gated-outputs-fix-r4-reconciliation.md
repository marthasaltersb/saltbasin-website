# Reconciliation: qr-gated-outputs fix round 4 (branch release-loop/qr-gated-outputs-fix-r4, e7a28dd)

Release 2026-10-02-application-packages-resume. Checked by reading branch code, the spec, the amendments folder and the round-4 test result. No code changed. No server was started in this pass.

## A. Reported items

| id | item | kind | status | evidence |
| --- | --- | --- | --- | --- |
| R1 | Compound shell commands / `source` refused | process | resolved | Nothing ran, no state left; commands reran as plain calls. |
| R2 | First server stop killed only wrapper; DROP DATABASE blocked until real node PID killed | process | resolved | Fix notes say DROP succeeded afterwards. Lesson: write the node PID (not the wrapper) to the PID file. |
| R3 | Em dash copy MyResumePanel.jsx:1065 (J2.1) and auth.js:28 (E.5) left unfixed | product_defect | unresolved | Checked: line 1065 still reads `Read-only — no edits can be made here.`, auth.js:28 still reads `Too many attempts — please try again in 15 minutes`; spec lines 89 and 201 expect a hyphen. Round-4 validation failed exactly these two steps. Carried since round 2. See N1, N2. |
| F3-5 | Member journey from the World Shell: spec change only | owner_direction_conflict | unresolved | Product works (fix notes: member@test.local, Approve for QR 200, "Approved by Test Member", 390px no overflow). But spec P.1 line 22 still says sign in as the seeded administrator and "Where things are" (line 12) routes via Classic Tools. Round 4 was validated as the administrator (test result: "Journeys run as the seeded administrator"), so the owner's "member, everything from the World Shell" direction is not yet proven by any scored run. Amendment A3-A5 files exist but none covers P.1 (A3 docx, A4 MCP, A5 fixture); the P.1 change has no amendment file. Needs a reviewer-approved amendment (reviewer is not the proposer), new baseline, then a member re-walk. |
| F3-6 | No Draft card for J10.3, E.1, E.2, E.4 (pkg-v3 step) | test_harness | unresolved | A5 exists as a proposal in docs/spec-amendments/qr-gated-outputs/A5.json and is not applied (spec has no P.5). Round 4 imported pkg-v3 as unscored harness setup (O3). Needs approval of A5 with E.3 kept deterministic (E.3 before P.5, or expect unchanged on the latest file), plus the fixture command. Reviewer-only. |

## B. Failures left in place (not fixed, now hitting a fourth round)

### N1. J2.1 View dialog em dash
- kind: product_defect, status: unresolved
- step: J2.1
- rootCause: src/components/admin/MyResumePanel.jsx:1065 renders an em dash; spec expects `Read-only - no edits can be made here.`
- files: src/components/admin/MyResumePanel.jsx
- proposedFix: change only the rendered string to ` - ` (leave the code comment at 1056). Grep other specs/tests for the em dash form first. Re-walk J2.1 as the member.

### N2. E.5 sign-in limit message em dash
- kind: product_defect, status: unresolved
- step: E.5
- rootCause: server/routes/auth.js:28 message uses an em dash; spec line 201 expects a hyphen.
- files: server/routes/auth.js
- proposedFix: use ` - `. Check other specs match only "Too many attempts" before changing (cover-letter-agent does).

## C. Gaps from the change spec "Known limitations" (docs/changes/qr-gated-outputs.md lines 76-81) that the reported failures missed

| id | gap | kind | status | evidence / proposedFix |
| --- | --- | --- | --- | --- |
| G1 | Import is a CLI script only, no in-app import UI | requirement_gap | unresolved | Still listed under Known limitations. grep of src finds no caller of `/import-package` and no import control. Route `POST /api/resume-outputs/import-package` and MCP `application_package_import` exist, so the website path is the UI_GAP. Fix: "Import package" file picker in Resume Output History (reachable from World Shell Journeys > My Resume, with 390px layout) posting to the same route, showing created / unchanged / new_version and errors via toast; or owner records acceptance of the script. Not raised in round 4 notes. |
| G2 | .docx stamping and site sync are scripts, not in training spec | requirement_gap | partially resolved | Download .docx exists and was checked in a browser (round 4 O1; fix notes F3-10). Still no scored journey: A3 proposes it, unapproved. Site sync stays an owner-run script by explicit fix-agent decision (member would gain site-wide edit); that decision needs the owner to record it. Dry run exit 0 reported. |
| G3 | PDF link annotations checked by grep/pdftotext only | informational | resolved | By design per Known limitations; round 4 saw three identical /URI lines. |
| G4 | Package JSON never in git | informational | resolved | Round 4 reports nothing under server/data/applicationPackages/ committed; fixtures stayed in scratch. |
| G5 | MCP parity | requirement_gap | partially resolved | Tools registered and exercised through /mcp (round 4 O2) but no scored step; A4 proposed, unapproved. Download of QR image/PDF via MCP not seen. |
| G6 | Fix notes in the change spec for round 4 describe walks (desktop and 390px) not corroborated by an independent validator | process | informational | Round-4 validator walked as administrator; the member walk is by the fix agent only. Re-validate as member after amendments. |

## Summary
Resolved: R1, R2, G3, G4. Fix agent must do: N1, N2 (one-line strings), G1 (import UI or recorded owner acceptance). Reviewer must do: F3-5 amendment for P.1 (member, World Shell; none exists yet), approve A5 (F3-6), A3 (docx), A4 (MCP), and the owner must record the site-sync decision. Round 5 cannot pass J2.1 or E.5 until N1 and N2 are fixed.
