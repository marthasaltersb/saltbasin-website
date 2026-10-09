# Scope review: qr-gated-outputs, round 4

Base: e0ea466 (commit before the feature's first commit d78bcda). Items T1 and T5 are static strings, so reproduction was done by `git grep` on e0ea466 (no server boot needed; round 3 already booted that base). Other items reuse scope-review.json / round 3 decisions; no contrary evidence found. No code changed, nothing started, no database created.

| Id | Scope | Evidence |
|---|---|---|
| T1 | pre_existing | `Read-only — no edits can be made here.` exists at e0ea466 (src/components/admin/MyResumePanel.jsx:922). Predates the feature (same as round 3 T1 / F2-2; scope-review.json's older this_feature entry is superseded by this reproduction). Still needs a code fix to a hyphen to match frozen step J2.1. |
| T5 | pre_existing | `authLimiter` message `Too many attempts — please try again...` exists at e0ea466 (server/routes/auth.js:28). Login limiter is outside the request. Still needs a hyphen fix for frozen step E.5. |
| qr-gated-outputs-F3-3 | process_note | Fix agent skipped browser verification: loop-process item, no product cause. |
| qr-gated-outputs-F3-5 | this_feature | Spec's own preconditions/where-things-are (reuse B7 / round 3 F2-11). Goes through docs/spec-amendments/qr-gated-outputs/, not a direct edit of the frozen spec. |
| qr-gated-outputs-F3-6 | this_feature | Spec fixture gap for J10.3, E.1, E.2, E.4 (round 3 F2-12). Amendment, not direct edit. |
| qr-gated-outputs-F3-7 | pre_existing | Same defect as T1 (string present at e0ea466). Duplicate of T1; one code fix closes both. |
| qr-gated-outputs-F3-8 | pre_existing | Same defect as T5 (string present at e0ea466). Duplicate of T5. |
| qr-gated-outputs-F3-9 | pre_existing | In-app import is not in the request (script import, reuse B9 / round 3 F2-7). Script-only since d78bcda; MyResumePanel never had an import control. |
| qr-gated-outputs-F3-10 | this_feature | "Clickable QR in PDF/docx" is in the request. scripts/sync-site-with-application-package.mjs was added by d78bcda (this feature) and the docx stamping path has no journey (reuse B10 / round 3 F2-8). Docx done, sync and its journey missing. |
| qr-gated-outputs-F3-11 | this_feature | Phone (390px) walkthrough of this feature's own journeys was never run; interface parity (MOBILE_GAP) applies to the feature. Unverified, so not provable as pre-existing. The separate pre-existing navigation gap (hidden Classic Tools on mobile, B8 / round 3 F2-9) stays pre_existing and out of scope. |
