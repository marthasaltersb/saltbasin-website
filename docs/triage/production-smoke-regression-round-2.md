# Triage: production-smoke-regression, round 2

Triage agent output. No code or spec changed. Earlier triage items: none. Amendments decided: none.

## T2-1 [J1.8] Member cannot sign out by point-and-click at 1280px (defect)

Two root causes, one fix item.
1. `src/components/WorldShell.jsx` (top bar around line 894, `S.navTab` buttons) has no sign-out control at all. `api.logout` is called only from `AdminShell.jsx:652` (`logout`, button at line 828) and `MemberCrystalOrbit.jsx:100`, and the latter is not mounted in `/world`.
2. In Classic Tools, `AdminShell.jsx:696` renders `.sb-admin-topbar` with inline `styles.topbar` (`adminStyles.js:11`: `display:flex`, `justify-content:space-between`, fixed `height:56`, no wrap, no `min-width:0`). The actions group (line 746) holds the member tab toggle, View Public and Logout. The group is wider than the viewport minus the title (scrollWidth 1447 vs 1280), so Logout lands at x=1366. The only responsive rule is the `max-width:900px` block in `src/brand.css:623`, which swaps to the Menu button, so 390px works and 1280px does not. The fixed `classicBack` button (`WorldShell.jsx:1813`, `position:fixed; left:0.6rem`) also overlaps the title.

Fix: add a "Sign out" button to the World Shell top bar and Sun menu that calls `api.logout()` then navigates to `/login` (same fallback as `AdminShell.logout`). In `adminStyles.js` / `brand.css`, let `.sb-admin-topbar` shrink (`min-width:0` on the title block, `flex-wrap` or `overflow:hidden` on the actions group, `flex-shrink:0` on Logout) or switch to the Menu layout below about 1500px. Reserve left padding for `classicBack`. Add a 1280px Classic Tools check (no horizontal scroll, Logout visible).
Files: `src/components/WorldShell.jsx`, `src/components/admin/AdminShell.jsx`, `src/components/admin/adminStyles.js`, `src/brand.css`.

## T2-2 [E.1] Role-not-member precondition cannot be built (spec_error)

Product is correct: `server/lib/smokeAccount.js:80-82` throws 409 `smoke_account_not_member`, and the status text (line 51) says "Fix it by hand". Nothing in the platform changes a user's role (grep for `UPDATE users SET role` finds nothing), by design. The step names a state that exists only through the database but does not say how to create it, so a literal validator is blocked. The step's action (the POST and the red box) is reachable at both widths; only the precondition is not, so this is a fixture instruction, not a product gap.

Amendment (reviewer): stepId E.1, op change.
Before: "The test account row exists but its role is not `member`: ..."
After: "Precondition (validator's own throwaway test database only, never production): after creating the account, run `UPDATE users SET role='admin' WHERE email='smoke-member@test.saltbasin.invalid'` with psql. Then `POST /api/production-smoke/account` returns ..." (rest unchanged; screen checks at 1280px and 390px).
Traces to: change spec "refuses (409) when that row is not a plain member", `smokeAccount.js` header comment.

## T2-3 [E.2] Slug conflict is not side-effect free (defect)

`readySmokeAccount` in `server/lib/smokeAccount.js` inserts the user (lines 86-91), the `user_emails` row (101) and the consent rows (103-107) before it checks the slug at lines 109-112. When the slug is taken it throws 409 "Nothing else was changed", which is false: the account now exists as Not ready and can sign in. A second root cause is in `src/components/admin/ProductionSmokePanel.jsx:52-60`: the `catch` calls `fail(...)` but never `load()`, so the status card keeps "Not created".

Fix: do every refusal check before the first write. After the role check, when the user has no `member_profiles` row, look up the slug and throw `smoke_slug_taken` before any INSERT/UPDATE (this also covers the existing-user branch that changes the password and `must_change_password` at lines 93-98). Optionally wrap the writes in one transaction. In the panel, call `load()` in the failure path. The MCP tool shares this function, so it is fixed there too.
Files: `server/lib/smokeAccount.js`, `src/components/admin/ProductionSmokePanel.jsx`.
Step E.2 as written already covers this; no amendment needed.

## T2-4 [E.4] Two-step-sign-in administrator precondition cannot be built (spec_error)

Product is correct: `scripts/provision-smoke-account.mjs:35` exits 2 with the exact message when login returns 202 `challengeRequired`. The validator could not enroll an authenticator through a screen because `src/components/admin/MemberAccessPanel.jsx` (with `SecuritySettings`, `startTotp`/`enableTotp`) has no importer in `src/`, and `MemberCrystalOrbit.jsx` has a "Change password in security workspace" button with no handler. That is a real, pre-existing interface gap in authenticator enrollment (API `POST /api/auth/totp/setup` and `/enable`, `server/routes/auth.js:127,134`; `api.js:256-257`). It is outside this feature's change spec, so it should not fail this feature's step. Recommend the owner log it as its own backlog item (mount `MemberAccessPanel`); no business rule is missing.

Amendment (reviewer): stepId E.4, op change.
Before: "The administrator used by the provisioning workflow has two-step sign-in: ..."
After: "Precondition (test database only): as that administrator, `POST /api/auth/totp/setup`, then `POST /api/auth/totp/enable` with the 6-digit code computed from the returned secret by `totpCode()` in `server/lib/totp.js`. Then `scripts/provision-smoke-account.mjs` exits 2 and prints ..." (rest unchanged).
Traces to: change spec exit-code table for the provisioning script; `server/routes/auth.js` totp routes.

## Observations decided

- E.5 simulated precondition (404 proxy): acceptable, no older deployment can exist. Nothing to add.
- J6.8, J6.29: pass as specified. Nothing to add.
- Local `--backend` for S6.x and the proxy-env behaviour of `--ignore-blocked-external`: environment (sandbox network), not a product defect. Validators should always run with the sandbox proxy env.
- Classic Tools 1280px header overlap: covered by T2-1. The 390px Career Placement Agents layout (squeezed scene, heading overlapping Track Opportunity) is outside this feature; log as a separate backlog bug.
- Status card not reloading after a failed POST: fixed under T2-3, with a coverage gap below.
- curl steps marked desktop+mobile: a clarifying amendment marking them `cli` is reasonable; reviewer's call, not filed as an item.

## Coverage gap

C2-1: after a failed readying (E.2) the Production smoke status card must reflect the true state. Proposed new step [E.2b] (op add): "After the E.2 refusal, the screen's status card shows Not ready (not Not created) without a manual reload." Traces to the change spec's status behaviour; the validator found a stale card that no step covered.
