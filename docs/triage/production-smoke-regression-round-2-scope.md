# Scope review: production-smoke-regression, round 2

Integration head 12804d0. The feature is already merged (3f743c8, first parent aca458d, "Merge release-loop/production-smoke-regression-build-2"). No earlier entry for these ids in docs/triage/scope-review.json. Evidence is static against aca458d (base checked out in a worktree: no build or browser run; the claims are about code that is unchanged between aca458d and 3f743c8 except for 4 added lines in WorldShell.jsx that only register the Production smoke screen).

| id | scope | evidence |
| --- | --- | --- |
| T2-1 | pre_existing | At aca458d `WorldShell.jsx` has 0 occurrences of logout/sign out; `api.logout` is only called at AdminShell.jsx:653; `.sb-admin-topbar` (adminStyles.js `topbar`, line 11) already exists. adminStyles.js, AdminShell.jsx and brand.css have no diff between aca458d and 3f743c8. The feature only added a screen registration to WorldShell. Sign-out in /world and the Classic Tools topbar overflow are platform gaps not in this feature's request. |
| T2-2 | this_feature | The 409 `smoke_account_not_member` is this feature's own code (smokeAccount.js, absent at aca458d) and its spec step does not say how to create the precondition. The spec correction (as an amendment, not an edit) belongs to this feature. |
| T2-3 | this_feature | Defect in the feature's own `readySmokeAccount` (writes users/user_emails/consents before the slug check, so "Nothing else was changed" is false) and `ProductionSmokePanel.jsx` (no status reload on error). Neither file exists at aca458d. |
| T2-4 | pre_existing | Authenticator-enrollment UI gap: `MemberAccessPanel.jsx` has no importer in src/ at aca458d and is unchanged by the feature; the enrollment API in auth.js is unchanged. The feature's script refuses a 2FA admin with the specified message. The feature was not asked to build enrollment UI. (The spec should name the precondition; that wording is covered by the T2-2 amendment.) |
| C2-1 | this_feature | Missing coverage of the feature's own status card after a refused POST; second root cause of T2-3. |
| B6 | process_note | Builder edited the frozen-spec file instead of proposing an amendment; loop governance, not product. Fix by amendment under docs/spec-amendments/production-smoke-regression/ (directory does not exist yet). |
| B7 | process_note | Spec v2 was never frozen (only baselines/production-smoke-regression/v1.json exists). Loop step for the spec-baseline owner, not product. |
| B8 | process_note | Instruction forbids the builder pushing main; the files are now merged into the integration branch, and the main merge is the owner's/integrator's step, proposed in docs/changes/production-smoke-regression.md line 24. |
| B9 | this_feature | The Netlify-vs-Render deploy wait is a limitation of the feature's own workflow (.github/workflows/production-smoke.yml). |
| B10 | process_note | Production steps can only run on GitHub Actions after the main merge and after the owner adds secrets; the secret names are already listed in the change spec ("Secrets the owner must add"). Owner action, not a defect. |
| B11 | this_feature | Limitations of the feature's own checks (read-only signed-in checks, R2.3 not_run, S3.3 not_run, provision script behavior on an undeployed site, 2FA admin refused) are documented in its change spec and implemented in scripts/production-smoke.mjs. |
