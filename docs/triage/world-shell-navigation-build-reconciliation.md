# Reconciliation - World Shell navigation build (branch release-loop/world-shell-navigation-build, head 7cc95ed)

Reconciled 2026-10-02 by agent rec-4000-1. Evidence was gathered on the branch merged locally (detached, not pushed) with the integration head 4d6a48e, as a production build served by `node server/index.js` (NODE_ENV=production) on a fresh database `sb_rl_rec_4000_1`, port 4002. Server stopped and database dropped afterwards.

## Reproducibility of the build agent's claim

The build agent's own walk script (copied, repointed at this worktree, port and database) was re-run on a fresh database, merged tree, production mode:
- 1280x900: 28 of 28 PASS. Non-2xx responses were only the intentional ones: one 400 `No changes to save` and two 409 finalization-gate refusals (plus fonts/favicon).
- 390x800: 4 of 4 PASS, no console errors or failed requests.

The claim is reproducible, and also holds with integration commit b586d4f present.

## Items from the build report

| # | Reported | Kind | Status | Evidence |
|---|---|---|---|---|
| 1 | DB name sb_rl_bld_1 collided with another workflow | environment | resolved | Addressed on the integration side by 4d6a48e "safe parallel runs"; this run used its own unique DB, no collision. Build agent dropped its sb_wsn_build. |
| 2 | Shared scratchpad files overwritten | environment | resolved | Same cause as #1; this run used /var/tmp/sbpg/agents/rec-4000-1/ only. |
| 3 | Commands refused by worktree guard | environment | resolved | Nothing ran, no state left. I hit the same guard on compound commands and split them. |
| 4 | Python heredoc edit scripts failed assertions | process | resolved | Re-run succeeded; branch is consistent (build and walk pass). |
| 5 | Login rate limit 10/15min hit | test_harness | resolved | Documented in the spec's tester notes; walk reuses storageState; no 429 in my run. |
| 6 | seed scripts hit 428 | product_defect | resolved | See "Auth gating". Branch client change and integration b586d4f agree. |
| 7 | Playwright locator mistakes | test_harness | resolved | Product unchanged; walk selectors pass in my run. |
| 8 | J2.3 / J0.1 / J2.1 assertion failures | test_harness | resolved | Case/timing assertions only; full re-walk passes 28/28 (reproduced). |
| 9 | Editor and gate dialog clipped in 300px rail | product_defect | resolved | Portalled to body; J6, J7 and phone M3/M4 pass in my run. |
| 10 | Trailer says Sonnet 5.5, task text required Opus 5.5 | process | unresolved | Commit 7cc95ed has `Co-Authored-By: Claude Sonnet 5.5`; integration commits use Opus 5.5. Fix: integrator rewords this one trailer to the required text. No code change. |
| 11 | No push | informational | resolved | Branch local only. |
| 12 | Processes/DB/vite config cleaned | informational | resolved | Nothing to do. |

## Auth gating: do the two changes agree?

The branch does not touch `server/auth.js` or `server/index.js`. It fixes the same symptom only on the client: `WorldShell` calls `api.me()` (under /api/auth, exempt from both gates), redirects `mustChangePassword` members to `/first-login-password?next=/world`, and wraps the shell in `CareerConsentGate`. Integration b586d4f makes both server gates apply to `/api/` only so the page and chunks load in production. They are complementary and merge cleanly (clean merge performed locally). The combined production-mode walk, including J0.1 to J0.3, passes. Without b586d4f the branch would still give a blank app in production for a gated member (the build agent used the Vite dev server, so could not see that); with it, fine. Resolved.

## Owner-direction check (everything comes from the World Shell)

- The added code (`OpportunityOutputsSection.jsx`, `documentBlocksEditor.js`, the `WorldShell.jsx` diff) contains no `/admin` link or admin-route navigation. The editor opens in place from the opportunity card; "Open my Career Master" uses the World Shell Career Master island and returns to the same opportunity. Classic Tools is pre-existing and not used by the journey. No admin-navigation entry points were added. Resolved.
- Member journeys were walked as a member (role `member`); the admin account is never used. Resolved for that question. See G1 for how the account is created.

## Unresolved gaps and conflicts

### G1 - Test accounts created the disallowed way (test_harness / process) - unresolved
- Step: training spec "Preconditions" and Journey 0.
- Root cause: the spec creates the member with `POST /api/members/signup` (needs `PUBLIC_MEMBER_SIGNUP_ENABLED=true`) as `riley.member@example.test`. The rules now require `scripts/create-test-member.mjs` (member@test.local / TestPass!2345, terms accepted, no forced password change) and forbid other ways. That script cannot produce the provisional-password state J0.1 and J0.2 need.
- Files: docs/training/world-shell-opportunity-outputs.md (Preconditions, J0, every Riley Fenn / password literal, J3 SB_EMAIL and SB_PASSWORD), scripts/create-test-member.mjs.
- Proposed fix: rewrite preconditions to use create-test-member.mjs; J1 to J12 use member@test.local and "Test Member"; J0 uses `--no-terms` for the terms-prompt step and a new `--force-password-change` flag on create-test-member.mjs for the password-page step.

### G2 - 3D island entry never exercised (requirement_gap, partial) - unresolved
- Request: "reaches the career opportunity pipeline from a World Shell island/entry". The spec and walk use only the Journeys card list. Clicking the actual island in the 3D World (the primary entry), or the right-rail summary to island to opportunity path, was never walked, at either width.
- Files: docs/training/world-shell-opportunity-outputs.md ("Where things are", J2.1), src/components/WorldShell.jsx.
- Proposed fix: add a journey that clicks the Career Placement Agents island in the world view (Chromium with swiftshader is available) and reaches the same panel, at 1280 and 390; or document precisely why WebGL cannot be tested.

### G3 - Package filing is CLI-only (requirement_gap, owner decision) - unresolved
- Change spec "Known limitations": no in-app way to file a `document_blocks` package; the journey needs the CLI import (J3) before package outputs appear. The request asked only for the script option, so it meets the letter, but a member working entirely from the World Shell cannot get package outputs in without a terminal.
- Files: scripts/import-application-package.mjs, server/routes/resumeOutputs.js (`POST /import-package`), src/components/OpportunityOutputsSection.jsx.
- Proposed fix if wanted: an "Import application package (JSON)" file input in the opportunity's outputs section calling the existing `/import-package` with `linkOpportunity` for this opportunity. Otherwise record as an accepted limitation.

### G4 - Other limitations listed by the spec and missed by the failure list (informational)
Tables and figures are preserved but not editable; font/colour style fields are not editable; the large island label during camera dolly is existing 3D behaviour; the 300px rail makes provenance wrap tightly. Text editing was verified (J6.4, J8.1, J10.2).

### G5 - Spec header is stale (process) - unresolved, trivial
Change spec header says `Release: 2026-10-02-application-packages` (this run is `2026-10-02-world-shell-navigation`) and "built on integration head dd3f321" (integration is now 4d6a48e; merge is clean). Fix: update docs/changes/world-shell-opportunity-outputs.md on the next fix pass.

### G6 - Schema migration failure is warn-only (informational)
`server/db.js` wraps the new `ADD COLUMN IF NOT EXISTS parent_version_id` in try/catch with `console.warn`, matching local pattern. If it ever failed, saving a version would then error visibly, so not silent. No fix needed.

## Verdict

No product defects open. Open: G1 (harness/spec account creation), G2 (3D island entry untested), G3 (owner decision on in-app package filing), G5 and item 10 (documentation/process). Code was not changed by this agent.
