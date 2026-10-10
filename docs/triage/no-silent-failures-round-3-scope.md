# no-silent-failures round 3: scope review

Base for comparison: eb6ceba (first parent of merge 9e729b6, the earliest no-silent-failures merge). Head reviewed: 7d67014.
Method note: I did NOT build and run the base on a fresh database. The base evidence below is from reading base sources (git show eb6ceba:...), which is sufficient because each claim is about unchanged code paths. No code was changed.

| id | scope | owner |
|---|---|---|
| T-R2-2 | pre_existing | - |
| T-R2-4 | process_note | - |
| T-R3-3 | this_feature | no-silent-failures |
| T-R2-5 | this_feature | no-silent-failures |

## T-R2-2 - pre_existing
At eb6ceba, Output.jsx already had the same owner-less path: the refresh fetch built `/api/career/master${owner ? ?owner=... : ''}` (line 1216) and the other pages call `fetchCareerMaster(ownerSlug)` with an empty slug. `resolveOwnerUserId` in server/routes/careerMaster.js falls back to `resolveDefaultAdminUserId()` when no owner is given, and is unchanged by this feature. So plain /output/resume reading the platform admin's master happens without this feature. It is also the same class as already-reviewed B11 (pre_existing) and docs/changes/no-silent-failures.md "Known limitations" line 71. This feature's request is about surfacing errors, not about which owner a plain /output/resume resolves to. J4.1 passing is expected: the notice depends on the request failing, not on the owner.

## T-R2-4 - process_note
Validator tested 47ee197, before 49d0e2d added the output-templates governed route, capability row and 7 MCP tools. 49d0e2d is in head. Environment/staleness of the validated build, not a product or spec problem. Re-validation on current head should clear it (check-interface-parity reported 0 MCP gaps).

## T-R3-3 - this_feature
Setup P4 in docs/training/no-silent-failures.md is the feature's own spec and says "if gallery present use it, otherwise console fixture". The two paths give different header and titles, but J4.1 expectations only match the fixture. Spec ambiguity in this feature's spec. Fix by proposing an amendment in docs/spec-amendments/no-silent-failures/ (e.g. make the console fixture mandatory for J4, or state expected text for both); do not edit the frozen spec directly.

## T-R2-5 - this_feature
Reproduced on base in the sense that line 363 of CareerMasterPanel.jsx (`toast('Failed to load career master data: ...')`) is identical at eb6ceba, so the plain call is old. But the request is "load errors surfaced", J1 of this feature's spec asserts exactly this toast as the surfaced error, and this feature added the red `toast.error` mechanism (T2 in docs/changes/no-silent-failures.md) without switching the load-failure call to it. A surfaced failure that looks like success is within the request. Two parts: (1) code: use `toast.error(...)` at CareerMasterPanel.jsx:363; (2) coverage gap: J1.3 should assert the toast is red / role=alert, via a spec amendment. The J1.3 "Saved" toast stays plain.
