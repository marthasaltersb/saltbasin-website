# Reconciliation: qr-gated-outputs fix round 6 (branch release-loop/qr-gated-outputs-fix-r6, 8b73f29)

Release 2026-10-02-application-packages-resume. Checked by reading branch code (git show HEAD, grep), the training spec, the amendments folder, the round-5 test result and the change spec. No code changed. No server was started in this pass, so no browser walk was done here.

## A. Reported items

| id | item | kind | status | evidence |
| --- | --- | --- | --- | --- |
| R1 | J2.1 and E.5 were not walked in a browser; check was grep plus a passing build | process | unresolved | The code fixes are in the branch (see N1, N2) and match the spec text exactly, but no run has scored them since round 5 failed exactly these two. Closes only when a validator re-walks J2.1 and E.5 as the member (round 6 validation). |
| R2 | Em dashes remain in limiter messages in server/routes/commerce.js:30 and server/routes/members.js:29 | informational | resolved | Verified both lines still carry an em dash (checkout and signup limiters). Neither is a spec step: E.5 asserts only the sign-in limiter in auth.js. Out of scope for this feature; no step can fail on them. Optional style cleanup only, and if changed, grep other specs (cover-letter-agent) for the old strings first. |

### N1. J2.1 View dialog text (the fix under review)
- kind: product_defect, status: resolved in code (pending validator confirmation, see R1)
- evidence: src/components/admin/MyResumePanel.jsx:1109 now reads `Read-only - no edits can be made here.` (hyphen), as spec line 89 expects. `git show HEAD` shows this is the only changed rendered string. Code comment at 1100 keeps an em dash (not rendered).

### N2. E.5 sign-in limit message (the fix under review)
- kind: product_defect, status: resolved in code (pending validator confirmation, see R1)
- evidence: server/routes/auth.js:28 now reads `Too many attempts - please try again in 15 minutes`, matching spec line 201.

## B. Gaps from the change spec "Known limitations" (docs/changes/qr-gated-outputs.md lines 76-81) and related round-5 notes that the reported items missed

| id | gap | kind | status | evidence / proposedFix |
| --- | --- | --- | --- | --- |
| G1 | Import is a CLI script only, no in-app import UI | requirement_gap | resolved in code, not scored | The branch now has an "Import an application package" card (`data-testid="package-import"`, file picker, link-opportunity checkbox, 44px min height) in MyResumePanel.jsx ~lines 947-960 and `importPackageFile` calling `api.importApplicationPackage` -> POST /api/resume-outputs/import-package. No baseline step exercises it and nobody has walked it at 390px. The Known limitations text (line 78) is still stale and says there is no UI. Fix agent should update that line. Needs a validator or amendment step to score. |
| G2 | .docx stamping and site sync are scripts, not in the training spec | requirement_gap | unresolved | Download .docx exists (round-5 O4: button present). No scored step: amendments A3 (B10.1) and A8 (J6.4) are proposals only; baseline is still v2. Site sync stays an owner-run script by the fix agent's decision (a member would gain site-wide edit); the owner has not recorded that decision. Needs: reviewer approval of A3 or A8 and the owner's note on site sync. |
| G3 | PDF link annotations checked by grep/pdftotext only | informational | resolved | By design; round 5 J6.2 passed with three identical /URI lines. |
| G4 | Package JSON never in git | informational | resolved | Round 5 used scratch fixtures; nothing under server/data/applicationPackages/ is in the branch diff for this round. |
| G5 | Owner direction: every journey as a member from the World Shell (desktop and 390px) | owner_direction_conflict | unresolved | Round 5 ran as member@test.local, but the spec still says P.1 sign in as the seeded administrator and the desktop path is World Shell > Classic Tools (spec lines 12-24, round-5 O1). Classic Tools is an entry point outside the Journeys cards. Amendment A6 proposes the P.1 change but is not approved and no baseline v3 exists (baselines: v1, v2). Needs: reviewer (not the proposer) approves A6, new baseline, desktop path through World Shell Journeys > My Resume, re-walk as member. |
| G6 | No Draft card fixture for J10.3, E.1, E.2, E.4 | test_harness | unresolved | Spec has no step (round-5 O3: passed with harness setup). A5/A7 propose P.5, unapproved. Reviewer must approve; E.3 ordering must stay deterministic. |
| G7 | MCP parity has no scored step | requirement_gap | unresolved | Tools registered (application_output_revoke_qr, application_package_import, shared_output_resolve, approve). A4 proposes a step; unapproved. |

## Summary
Resolved: R2, N1 (code), N2 (code), G1 (code), G3, G4. Open: R1 (needs the round 6 validator to re-walk J2.1 and E.5 as the member on desktop and 390px; expected to pass, since the strings match the spec), G2, G5, G6, G7 (all reviewer or owner actions on amendments A3-A8, then a baseline v3 and a full member re-walk). Fix agent action: update the stale Known limitations line 78 in docs/changes/qr-gated-outputs.md to describe the new import card.
