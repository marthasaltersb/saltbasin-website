# qr-gated-outputs round 7 scope review

Method: read-only review at integration head 9989faa plus the base (`aa14653^1`, first parent of the earliest qr-gated-outputs merge) via git. No build or database was needed: F6-1 is two static string literals, and F6-4/5/6/7 are spec-amendment governance items with no runtime behaviour. No code changed, nothing committed, nothing started.

## qr-gated-outputs-F6-1 (J2.1, E.5) - this_feature
- Two parts. The `MyResumePanel.jsx` "Read-only" em dash is this feature's own J2.1 surface: round 6 already classed T1 as this_feature, reused here. The `server/routes/auth.js` sign-in limit em dash (E.5) reproduces on the base (initial import a875b9b), so that part alone is pre_existing, as round 6 decided for T5.
- Current state: commit 8b73f29 ("Fix round 6: hyphen...") already changed both strings to a hyphen on the head (`MyResumePanel.jsx:1109`, `auth.js:28`). The "fix agent did not run the app" root cause is a process observation. The item needs re-validation, not new code.
- Single owner for the item: this_feature (the J2.1 half is this feature's).

## qr-gated-outputs-F6-4 (docx and site sync; A3, A8) - this_feature
- A3 and A8 are this feature's own amendments for the stamped .docx download, which is part of its request ("clickable QR in PDF/docx"). Both are status `rejected` by the reviewer, with unresolved Exact/Reachable/Deterministic findings (A3 invalid id `[B10.1]`; A8 mixes a browser click with a cli inspection). The remedy is a resubmitted, reviewer-approved amendment from a non-proposer. Not a code or base issue.

## qr-gated-outputs-F6-5 (P.1 and navigation; A6) - this_feature
- A6 amends this feature's own P.1 for the owner direction "journeys run as a member from the World Shell". It is `rejected`: the import steps (P.4, J8.1, P.5) file documents under the administrator, so the signed-in member would see no cards. Resubmit as one amendment that aligns the import account, P.1, "Where things are" and P.2 navigation. Spec-only, this feature's spec.

## qr-gated-outputs-F6-6 (J10.3, E.1, E.2, E.4; A7) - this_feature
- A7 adds fixture step P.5 to create the Draft card those steps need. It is `rejected`: the command defers to the admin-signed P.4 import, and E.3 is left unedited so it would report `new_version` instead of `unchanged` after P.5. Fixture and ordering gap in this feature's own spec.

## qr-gated-outputs-F6-7 (MCP parity; A4) - this_feature
- The tools exist in `server/lib/mcpToolRegistry.js` (`application_package_import`, `application_output_approve_for_qr`, `application_output_revoke_qr`, `shared_output_resolve`), added by this feature under interface parity v3. A4 is the scored step proving them. It is `rejected`: `[P.2]` is already a used id, MCP transport/auth/syntax and package argument are missing, and re-import would report `unchanged`. Resubmit with a new id and exact commands. This feature's own parity gap, not pre-existing.

## Process notes
- F6-4/5/6/7 all stop at the same governance gate: amendments need approval by a reviewer other than the proposer, and every proposal so far was rejected. Nobody may edit the frozen spec or baselines meanwhile.
- No item belongs to another feature; none reproduces independently of this feature other than the E.5 half of F6-1.
