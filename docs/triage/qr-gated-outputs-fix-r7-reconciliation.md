# Reconciliation: qr-gated-outputs fix round 7 (branch release-loop/qr-gated-outputs-fix-r7, 0e38ca2)

Release 2026-10-02-application-packages-resume. Checked by reading branch code, spec (baseline v2, sha ec0b3830...), the amendments A1-A8 (A3, A4, A6, A7, A8 still `rejected`), round-7 test result (38/38 pass) and the change spec. No server started, no code changed.

## A. Reported items

| id | item | kind | status | evidence |
| --- | --- | --- | --- | --- |
| F7-1 | Sign-in limiter exhausted by failed attempts; "View" button substring matched "Hide Preview"; refused shell commands | environment / test_harness | resolved | Limiter is in memory, 10 per 15 min per IP (round-7 O4: E.5 trips after 6 attempts, earlier sign-ins count). Not a product defect. Harness note: validators should use an exact-name match for View. Nothing partially applied (agent's own statement; no repo diff beyond fix notes). |
| F6-4 | .docx stamping and site sync not scored; needs A3 or A8 approved and owner decision on site sync | requirement_gap + process | unresolved | Product side exists: `GET /api/resume-outputs/:id/download.docx` (server/routes/resumeOutputs.js:122), Download .docx button. Baseline v2 has no docx step; A3 and A8 are `rejected` (not exact, wrong surface label, invalid id). Site sync remains the script `scripts/sync-site-with-application-package.mjs`, with no recorded owner decision. Fix: a non-proposer reviewer approves a corrected amendment (split browser download step from a literal CLI check with exact python -I command and expected values: dc:creator `Avery Example; Jordan Sample`, created `2026-09-30T13:00:01Z`, header hyperlink Target `<BASE>/r/<SLUG1>`), cut v3; owner records "site sync stays a script". |
| F6-5 | P.1 signs in as administrator; needs A6 approved and baseline v3 | owner_direction_conflict | unresolved | Spec lines 12-14 still say seeded administrator and desktop path World Shell > Classic Tools > Network Relationship Management > My Resume (Classic Tools is an entry point outside the Journeys cards). The owner said everything comes from the World Shell, as a member, desktop and 390px. Round 7 validated as member via Journeys at both widths, so the product works; the spec does not say so. A6 rejected: P.4, J8.1 and proposed P.5 import as the administrator, so member would see no cards. Fix: resubmit A6 with member-run import (CLI signing in as member@test.local, or the in-app import card), updated "Where things are", approved by a different reviewer, v3. |
| F6-6 | J10.3/E.1/E.2/E.4 need a Draft card; needs A7 | test_harness / requirement_gap | unresolved | Round 7 O3: third package import was harness setup, no spec step. A7 (P.5) rejected: import as admin, E.3 change is prose. Fix: resubmit with a literal member-run import command and a deterministic E.3. |
| F6-7 | MCP parity not scored; needs A4 | requirement_gap | unresolved | Tools registered at server/lib/mcpToolRegistry.js:279,294,309,323; `node scripts/check-interface-parity.mjs` reports 93/93, 152 tools, OK. Round 7 exercised them informally, no baseline step. A4 rejected: reuses id P.2, no transport/auth/call syntax. Fix: new unused id (e.g. J11.x), exact invocation and expected values. |

## B. Gaps in the change spec "Known limitations" the reported failures missed

| id | gap | kind | status | evidence / proposedFix |
| --- | --- | --- | --- | --- |
| G1 | In-app import card (`data-testid="package-import"`, MyResumePanel.jsx:947, `api.importApplicationPackage` -> POST /api/resume-outputs/import-package) is built but unscored; no baseline step walks it at desktop or 390px | requirement_gap | unresolved | Changes spec line says "No baseline step scores the card yet" (accurate now). Add to the same amendment as F6-6 as a member-run import step. |
| G2 | .docx QR stamping and site sync are scripts, not in the spec | requirement_gap | unresolved | Same as F6-4. |
| G3 | PDF link annotations checked via grep/pdftotext | informational | resolved | By design; three identical /URI lines in round 7. |
| G4 | Package JSON never committed | informational | resolved | Specs use fictional JSON under /var/tmp; nothing under server/data/applicationPackages in this branch's changes. |
| G5 | Em dashes in spec E.2 toast, commerce.js:30, members.js:29 | informational | resolved | Not spec steps (E.2 matches the spec). Optional cleanup. |

## Summary
Resolved: F7-1, G3, G4, G5. Unresolved, all blocked on reviewer/owner action rather than code: F6-4, F6-5, F6-6, F6-7, G1, G2. The product is validated 38/38 against baseline v2; remaining work is resubmitting amendments A3/A8, A4, A6, A7 in corrected form, approval by a non-proposer, baseline v3, and a full member re-walk.
