# Reconciliation - career-bound-outputs build (branch release-loop/career-bound-outputs-build, commit 9df7a85)

Checked by reading code on the branch. Items 1-11 are the build agent's reported list; G1-G6 are gaps it missed.

| # | Item | Kind | Status |
|---|---|---|---|
| 1 | Missing CareerBoundOutputEditor.jsx import | informational | resolved (file exists in commit; build agent's build passed) |
| 2 | Binding/editor/World Shell/admin tab built | informational | resolved for what exists; see G1-G4 |
| 3 | Login 429 | environment | resolved (test-session reuse; no product change) |
| 4 | "View" vs "View public" script bug | test_harness | resolved |
| 5 | QR "wording changed" order-sensitivity | product_defect | resolved (comparison now key-sorted per spec/applicationPackages.js) |
| 6 | My Resume/Inbox tabs only after 2nd boot | product_defect | resolved (db.js re-reads admin_nav after first seed) |
| 7 | Discarded invalid helper runs | process | resolved |
| 8 | Harness refused compound commands | environment | resolved |
| 9 | Trailer Sonnet 5.5 vs Opus 5.5 | process | unresolved (needs a decision) |
| 10 | Known gaps (certs, preview, template overrides) | requirement_gap | unresolved (see G2, G3, G4) |
| 11 | Nothing pushed / no package JSON committed | informational | resolved |

## Unresolved

### 9. Commit trailer (process)
- Step: commit message of 9df7a85.
- Evidence: it carries "Co-Authored-By: Claude Sonnet 5.5"; all earlier commits and the task rule use "Claude Opus 5.5".
- Root cause: the build agent followed the system attribution reminder over the task text.
- Proposed fix: owner/orchestrator to decide which trailer is authoritative; if Opus, `git commit --amend` the trailer (do not push).

### G1. Admin-nav tab added although the owner said everything comes from the World Shell (owner_direction_conflict)
- Evidence: server/db.js injects `careerReconciliation` ("Career Sources to Review") into the `admin_nav` content view. The training spec's own route to the editor is `/world` -> Classic Tools -> Network Relationship Management -> My Resume.
- Root cause: the queue was wired as an admin tab; the World Shell island was added as a second route.
- Files: server/db.js (nav injection block ~4209), docs/training/career-bound-outputs.md, docs/changes/career-bound-outputs.md.
- Proposed fix: make the World Shell Journeys island the primary route and verify it works as a member; remove the admin_nav injection (or keep only as a secondary entry, confirmed by owner). Update both specs.

### G2. The output editor is not reachable from the World Shell (owner_direction_conflict / requirement_gap)
- Evidence: grep of WorldShell.jsx and worldIslands.js shows no My Resume / resume-output-history island; MyResumePanel (which hosts the career-bound editor and Approve/Publish/QR) is mounted only in AdminShell.jsx (componentId `resume`). Only the review queue got an island.
- Files: src/components/WorldShell.jsx, src/lib/worldIslands.js (append-only registry), src/components/admin/MyResumePanel.jsx.
- Proposed fix: add a `resume` island/embed (SIMPLE_EMBED_COMPONENTS) rendering MyResumePanel inside CareerConsentGate, for member and admin scope; the review queue's "convert" and the editor must open from it; update training spec to start at Journeys.

### G3. Per-output overrides for template-driven outputs missing (requirement_gap)
- Evidence: change spec Known limitations: "Template-driven outputs keep their existing `master` binding; per-output overrides for them are not part of this release." Request required template-driven AND imported outputs to bind with overrides, shown as overridden with per-field revert.
- Files: server/lib/outputRendering.js, server/lib/careerBound.js, src/components/admin/MyResumePanel.jsx, src/components/DocumentBlocksView.jsx (and the template output editor).
- Proposed fix: store an `overrides` map on the template-driven projection (keyed by bound field path), apply it in the render context over `master`, show "Overridden for this output" with Revert per field, keep Career Master edits flowing to non-overridden fields. Additive only; never rewrite existing rows.

### G4. Package certifications not raised as review tasks (requirement_gap)
- Evidence: spec Known limitations; packageReconciliation.js has no certification task type (task types: package_field_conflict, package_new_bullet, package_add_job, package_new_skill, package_new_tool).
- Files: server/lib/packageReconciliation.js (detectPackageTasks, resolvePackageTask), server/lib/careerBound.js (listGroupsFromDocument/buildCareerBoundFromPackage), src/components/admin/CareerReconciliationPanel.jsx.
- Proposed fix: add `package_new_certification` (target career_certifications, entry type matching the existing certification CRUD/atom sync), approve via the normal CRUD path with Atom sync, reject keeps output override; block conversion until decided.

### G5. Editor preview refreshes only on Save (requirement_gap, minor)
- Evidence: CareerBoundOutputEditor.jsx line ~308 "Preview (as last saved; save to refresh)".
- Proposed fix: debounced call to the existing preview endpoint (`convert/:id/preview` style resolve) with unsaved state so the overridden badges and reverts show live; no write.

### G6. Walked as platform admin, not a member (test_harness / owner_direction_conflict)
- Evidence: training spec step 1 "Log in (test admin account)"; the build agent's walk and "Verified" section use the admin account. Member scope (`/member`, member-scoped /api/career-bound via requireUser, memberTabs, island registry for member nav) is unverified.
- Proposed fix: rewrite the training spec for member@test.local (created by scripts/create-test-member.mjs) entering via /world Journeys, re-walk J1-J8 as member, plus one admin check for the admin-scope path if kept.

## Verified fine (no action)
- Finalization gate reused: routes/careerBound.js exposes no approve/publish; approve/publish/QR remain in resume-outputs paths calling assertReadyToFinalize.
- Reject keeps Career Master unchanged and suppresses re-raise (packageReconciliation.js resolvePackageTask); approve goes through CRUD side effects with sync-failure retry.
- Additive schema only (`bullet_variants`), registry append-only, no member-row seed writes.
- Spec limitations also accepted as design, not gaps: exact-name skill/tool matching; ambiguous role -> "Add job"; approve buttons stay in Resume Output History (but that location must itself be reachable from the World Shell, see G2).
