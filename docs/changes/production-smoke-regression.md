# Change spec — production smoke and regression

Version 2 · 2026-10-11 · feature key `production-smoke-regression` · release 0.3.0 (`2026-10-10-production-hardening`) · branch `release-loop/production-smoke-regression-build` (built on `claude/prod-smoke-regression-0.3.0`, version 1)

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| `docs/changes/production-smoke-regression.md` | v1, branch `claude/prod-smoke-regression-0.3.0` (`cbba5f7`) | The anonymous, read-only suite this version extends. v1's "no sign-in, no account" rule (C.2) is replaced by the owner decision below |
| `docs/training/production-smoke-regression.md` | v1 (never frozen as a baseline) | Replaced by v2: restructured into Preconditions / Journeys / Edge cases for the baseline parser; the suite steps keep their ids (S*, R*), including S6.1-S6.3 (public site vs the Render server, added on the branch after round 1), and become Journey 6; R2.1-R2.3 are redefined, see below |
| `docs/test-results/production-smoke-regression/round-1.md` | production round 1 (16/25 on `https://saltbasin.net`, 2026-10-10) | Failures S3.4-S3.6, S4.1, R1.1, R1.2 (bugs `platform-mcp-PR1-1`, `qr-gated-outputs-PR1-2`, `qr-gated-outputs-PR1-3`) |
| `netlify.toml` fix, `main` `bd6a576` | owner, 2026-10-10 | Proxies `/mcp`, sets `/r/*` and `/release-tracker/*` privacy headers, rebuilds the frontend. Already in this branch's `netlify.toml`. The next production run must re-test S3.4, S3.5, S3.6, S4.1, R1.1, R1.2 |
| `docs/release-log/HANDOVER-0.3.0.md` | 0.2.0 cut, `7d76341` | Defines the feature: test `https://saltbasin.net` after each merge to `main` |
| `docs/training/baselines/qr-gated-outputs/v2.json`, `in-app-release-loop/v2.json` | frozen | `[J10.1]`, `[J10.2]`, `[E.6]` replayed as R1.1-R1.3, and the member side of `[E.6]` inside R2.2 |
| `docs/changes/platform-mcp.md`, `server/lib/capabilityParity.js`, `server/lib/mcpToolRegistry.js` | v4 / append-only | Interface parity: the new capability gets a parity row and two MCP tools |
| `docs/changes/session-mapping.md`, `docs/changes/release-intelligence.md` | pattern | Admin screen, route and MCP-tool shape followed (World Shell entry point in `PLATFORM_ISLAND_TABS`, admin route file in `GOVERNED_ROUTE_FILES`) |
| `.github/workflows/render-deploy-verify.yml` | existing | Same `RENDER_API_KEY` / `RENDER_SERVICE_ID` secrets reused to wait for a deploy |

Supersedes training spec v1 of this feature. No earlier frozen baseline of another feature changes.

## Owner decisions (2026-10-10) and how this version meets them

1. **Netlify fix is on `main` (`bd6a576`).** Not repeated here. The suite is unchanged for S3.4-S3.6, S4.1, R1.1, R1.2; the next production run after it must pass them (the three open production bugs close only when it does).
2. **Failures need fixes, not quieter notifications.** The workflow stays red on any failed step (no `continue-on-error`, `process.exitCode = 1` on a failure). Nothing was loosened. The only change in tone is a warning annotation when the optional secret is missing, which makes a `not_run` louder, not quieter. **Proposed merge to `main` (not done here; nothing was pushed; the owner or integrator merges the integration branch or this feature branch):** `.github/workflows/production-smoke.yml`, `.github/workflows/provision-smoke-account.yml`, `scripts/production-smoke.mjs`, `scripts/provision-smoke-account.mjs` and `scripts/production-rounds.mjs` must be on `main`, because a `push` trigger fires from the workflow file on the pushed branch and `workflow_dispatch` only sees workflows on the default branch. Once they are on `main` the suite runs after every merge to `main` (after Render reports the merged commit live). The existing trigger on `claude/prod-smoke-regression-0.3.0` can be removed in the same merge.
3. **One dedicated fictional production test account was approved.** Built below: `smoke-member@test.saltbasin.invalid`, display name "Smoke Test Member", no real data, excluded from all email, platform and Career Portfolio terms accepted, provisioned through the platform's own admin API by a `workflow_dispatch` job that uses GitHub Actions secrets only, never a committed credential and never production database access. R2.1 and R2.2 now use it.

## What changed, in one paragraph

A new admin-only capability readies the fictional test account (`server/lib/smokeAccount.js`, route `/api/production-smoke/account`, MCP tools `production_smoke_account_status` / `production_smoke_account_ready`, World Shell screen **Production smoke**). A manual workflow (**Provision smoke test account**, `scripts/provision-smoke-account.mjs`) calls that route as an administrator with repository secrets. The production suite (`scripts/production-smoke.mjs`) signs in as the test account when `SMOKE_MEMBER_PASSWORD` is set and replays signed-in read-only checks (R2.1 sign-in, R2.2 ten checks), then signs out. `email.js` now refuses to send to any reserved `.invalid` address, so the account can never trigger mail.

## Data model

Additive only, no new tables, no new columns, nothing written by seed/bootstrap. The account is an ordinary `users` row (`role = 'member'`) with `user_emails`, `member_profiles` (unpublished), `consent_actions` rows (`platform_terms`, `career_portfolio`) and the member's journey rods, created lazily the first time an administrator readies it. Only the row whose email is exactly `smoke-member@test.saltbasin.invalid` is ever read or written; it is refused (409) when that row is not a plain member. `member_profiles.draft` is TEXT, so it keeps `JSON.stringify`; the consent `context` is passed as a raw object (JSONB convention).

## Server

- `server/lib/smokeAccount.js` (new): `SMOKE_ACCOUNT` (fixed identity), `SMOKE_SECRET_NAMES`, `isReservedTestAddress()`, `getSmokeAccountStatus()` (read-only), `readySmokeAccount({ password, ctx })` (idempotent: creates, or readies: sets the password when it differs, clears a forced password change, records current terms, restores the starter profile). A password is required only to create; re-readying may omit it. The password is hashed with bcrypt, never returned, never logged.
- `server/routes/productionSmoke.js` (new, `requireAdmin`): `GET` and `POST /api/production-smoke/account`; the POST writes an audit row. Mounted in `server/index.js`.
- `server/lib/mcpToolRegistry.js` (append-only): scopes `smoke.read`, `smoke.write`; tools `production_smoke_account_status`, `production_smoke_account_ready`, both administrators only, calling the same functions as the route. `production_smoke_account_ready` takes no password and cannot create the account (a secret never passes through an agent session). `server/data/mcpToolManifest.json` updated.
- `server/lib/capabilityParity.js`: governed route file added and the row `production-smoke-account` (UI path, both routes, both tools).
- `server/lib/email.js`: `dispatch()` returns `{ ok: true, skipped: 'reserved_test_address' }` and logs a warning for any `.invalid` recipient, before the recipient-confirmation check and before the stub.

## Client

- `src/components/admin/ProductionSmokePanel.jsx` (new): World Shell -> Journeys -> **Production smoke** (admin; entry point in `PLATFORM_ISLAND_TABS`, `ISLAND_REGISTRY` entry `productionSmoke`, `SIMPLE_EMBED_COMPONENTS` entry in `WorldShell.jsx`, `api.getSmokeAccount` / `api.readySmokeAccount`). Shows the account, its status and terms, the password form, and the exact GitHub secret names to add. Errors are written for the member in a `role="alert"` box and a toast; one column and 44px tap targets at 390px.
- Everything configurable here is editable on that screen: the account's password. The account's identity (the `.invalid` address) is deliberately fixed, because a configurable address could point the suite at a real account.

## Workflows and scripts

- `.github/workflows/provision-smoke-account.yml` (new, manual only): runs `scripts/provision-smoke-account.mjs` with `SMOKE_ADMIN_EMAIL`, `SMOKE_ADMIN_PASSWORD`, `SMOKE_MEMBER_PASSWORD`, optional input `base_url`. The script signs in as the administrator through the API, reads the status, POSTs the member password, verifies `ready` and `emailExcluded`, and signs out even on failure. Exit 0 ready; 1 refused or not ready; 2 a secret is missing or sign-in failed. A two-step-sign-in administrator is refused with a plain explanation.
- `.github/workflows/production-smoke.yml`: passes `SMOKE_MEMBER_PASSWORD` into the suite step and raises a `::warning::` when it is empty. Still red on any failure.
- `scripts/production-smoke.mjs`: `runSignedIn()` records R2.1 (sign-in), R2.2 (ten read-only checks: `/api/auth/me`, career consent current, own profile, resume outputs list, career-agent opportunities list, `/api/release-loop/runs` 403 and `/api/production-smoke/account` 403 for a member, and `/world` at desktop and phone and `/member` at desktop with no sign-in prompt, no gate, no errors), and R2.3 (frozen smoke suites, `not_run` by design: they need an administrator, write data and run a fixture worker never enabled on Render). Total 29 steps (S1.1-S5.8, S6.1-S6.3, R1.1-R1.3, R2.1-R2.3). Each step also carries `baselineStep` (`J6.<position>`). Playwright path and Chromium path can be given with `PLAYWRIGHT_MODULE` / `SMOKE_CHROMIUM_PATH` for sandbox rehearsal.

## Secrets the owner must add (exact names)

GitHub repository -> Settings -> Secrets and variables -> Actions:

| Name | Value | Used by |
| --- | --- | --- |
| `SMOKE_ADMIN_EMAIL` | an administrator's email; that administrator must not use two-step sign-in | Provision smoke test account only |
| `SMOKE_ADMIN_PASSWORD` | that administrator's password | Provision smoke test account only |
| `SMOKE_MEMBER_PASSWORD` | a new password for the test account (12+ characters, a capital, a number, a special character), never reused elsewhere | Provision smoke test account and every Production smoke run |
| `SMOKE_BASE_URL` (optional) | default `https://saltbasin.net` | both |

Already present and reused: `RENDER_API_KEY`, `RENDER_SERVICE_ID`. After adding them: Actions -> **Provision smoke test account** -> Run workflow (or use World Shell -> Journeys -> Production smoke), then **Production smoke and regression** -> Run workflow. The password can equally be typed on the website screen; use the same value as the secret.

## Behaviour changes to know

- A production run with `SMOKE_MEMBER_PASSWORD` set now signs in once and signs out once (a session row for the test account; one entry in the auth rate limiter for the runner's IP). Without it R2.1 and R2.2 are `not_run` and the run shows a warning annotation.
- A wrong or missing account fails R2.1 with the instruction to run the provisioning workflow, and R2.2 is `blocked`; the run is red.
- Any email aimed at an `.invalid` address is skipped (and logged), for every feature, not only this account.
- The test account's profile is not published, so S3.3 remains `not_run` unless a public page links to a member site.
- Finalization: readying the account records terms for a fictional account at the owner's explicit approval; it is not an approval or publish of member content, so it does not pass through `assertReadyToFinalize` / `useToolCategoryGate().run` (the gate would block the provisioning job on an administrator's unrelated tool-category state).

## Verified (initial check, 2026-10-11)

Build agent, production build (`npm run build` passes), fresh database `sb_rl_bld_17100_1`, server on port 17112 (17102 was already held by a process outside this worktree and was left alone), Chromium 1194. The earlier salvaged branch was untested; everything below was run by this agent.

- `node scripts/check-interface-parity.mjs`: registry matches the code; the new row `production-smoke-account` has no gap. One pre-existing gap from main (`release-tracker-admin`, MCP_GAP) is not this feature's and was left.
- Journey 1 (website, Chromium desktop 1280 and phone 390): passed, including the weak-password red alert text, create, idempotent re-run, the secrets card, no horizontal scroll, 44px button, and the test account's own sign-in landing in the World with no gates.
- Journey 2 (API, curl): passed (401 anonymous, 403 for the member on GET and POST, 400 policy failure with four sentences, create then idempotent, `.invalid` email skipped).
- Journey 3 (MCP): both tools listed and working with a token holding both scopes; a token with only `smoke.read` is refused with `scope_not_granted`; the Capabilities row is present. Finding: the Connected Agents form clears after each token, so the training step now says to tick the scope again.
- Journey 4 (provisioning script): all five steps matched the spec, no password in any output.
- Journey 5 (suite, local): 29 steps; with the password 24 passed, 0 failed, `notRun` R2.3, S3.3, S6.1-S6.3; without it 22 passed and R2.1/R2.2 `not_run`; wrong password R2.1 `fail`, R2.2 `blocked`, exit 1; the password never appears in `report.json`.
- Merge notes: the salvaged branch conflicted with the integration branch in `mcpToolManifest.json` and `capabilityParity.js` (both sides kept), `production-smoke.mjs` (S6 skip list extended with R2.*) and the training spec (S6.1-S6.3 folded into Journey 6 as steps 21-23, so R steps are now J6.24-J6.29).
- Journey 6 is the production suite and runs on GitHub Actions only; not run here.

## Known limitations

- The sandbox cannot reach `saltbasin.net`; Journey 6 against production happens only on GitHub Actions. Nothing here proves the production result; the next production round does.
- The workflow waits for the Render deploy only, not Netlify's (round 1's root cause). The suite catches the symptom (S3.4-S4.1) but does not wait for it.
- The signed-in checks read only; the test account has no Career Master, tracked opportunities or outputs, so R2.2 proves the read paths answer, not that member data renders.
- The agent-runner smoke steps (R2.3) are not replayed on production: they need an administrator, writes and a fixture worker that is never enabled on Render.
- The administrator used by the provisioning workflow must not have two-step sign-in.
- `scripts/provision-smoke-account.mjs` cannot be run against a site that has not deployed this release (it reports a 404 and what to do).

## Fix notes per round (appended by fix agents)

None yet.
