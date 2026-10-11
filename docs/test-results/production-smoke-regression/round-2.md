# Test result: production smoke and regression, validation round 2 (browser + terminal)

```json
{"feature":"production-smoke-regression","baseline":1,"specSha256":"8b41eec82d4329c747645644a5473ad76fa88d24ddc433a352a0fec977d4dd44","total":67,"passed":63,"failed":["J1.8","E.1","E.2","E.4"],"blocked":[],"notRun":[],"preconditionsFailed":[]}
```

- Feature `production-smoke-regression`, spec `docs/training/production-smoke-regression.md` v2, pinned baseline v1 (sha 8b41eec82d43). `release-spec-baseline.mjs check` passed.
- Commit tested: `acfe632` (integration branch `claude/zealous-meitner-5tuft5`). Date 2026-10-11. Validator `val-17100-3`.
- Environment: production build (`npm run build`, `node server/index.js`), fresh Postgres databases, Chromium 1280x900 and 390x844 touch, light, en-US, UTC. Desktop walk on server 17106; phone walk on a second fresh server (18106) because Journey 1 can only be walked once per database. Edge cases E.2/E.3 each ran on a further fresh database per surface. All databases dropped, servers stopped.
- Evidence: screenshots and `steps.jsonl` in `/var/tmp/sbpg/release-loop/production-smoke-regression/round-2/` (suite reports copied there as `suite-report-*.json`, suite screenshots in `suite-screens-desktop/`).
- Fix details received: none (re-validation of the pinned baseline; the earlier production-target round-2 text in this file was replaced by this local validation).

## Failures

| Step | Surface | Expected | Observed |
| --- | --- | --- | --- |
| J1.8 | desktop | After signing in as the test account, "Sign out." | UI_GAP: sign-in part passes (World opens, bar World/Journeys/Classic Tools, Sun menu, no gates). Sign-out cannot be done by point-and-click at 1280px: the World Shell has no sign-out control and in Classic Tools the header (`.sb-admin-topbar`, scrollWidth 1447 vs 1280) clips **Logout** at x=1366, outside the viewport; wheel and keyboard focus do not reveal it. At 390px it works (Classic Tools, MENU, Logout). Screenshot `dbg-classic-desktop.png`. |
| E.1 | desktop+mobile | Role not member -> 409 `smoke_account_not_member` + red box | UI_GAP / MOBILE_GAP: the precondition cannot be created through the interface or the permitted setup script (no screen/route changes a role; create-test-member makes plain members only). Not exercised. |
| E.2 | desktop+mobile | Slug owned by another member -> 409 `smoke_slug_taken`, "changes nothing else" | 409 and the red box sentence are correct, but the POST is NOT side-effect free: afterwards the account exists (`exists:true, ready:false, problems:["The starter member profile is missing."]`) and `smoke-member@test.saltbasin.invalid` can sign in (HTTP 200). `readySmokeAccount` inserts the user, email and consent rows before it checks the slug. The screen's message "Nothing else was changed" is therefore false, and the status card still shows "Not created" until reloaded. Screenshots `E.2-desktop.png`, `E.2-mobile.png`. |
| E.4 | desktop+mobile | Admin with two-step sign-in -> script exits 2 with the authenticator message | UI_GAP / MOBILE_GAP: the precondition cannot be created by point-and-click: `MemberAccessPanel.jsx` (the only authenticator setup screen) is not mounted anywhere. Not exercised. |

## Step results (all surfaces; every one recorded in steps.jsonl)

- **P.1-P.4 (setup)**: pass.
- **J1.1-J1.7, desktop and mobile**: pass (card, subtitle, Not created, red policy alert, created, ready, secrets list, scrollWidth == clientWidth 1280/390, button 44px). J1.8 mobile pass; J1.8 desktop fail (above).
- **J2.1-J2.4, J2.7 (cli), J2.5/J2.6 (desktop, mobile)**: pass. Password and hash never in a response. `dispatchRaw` printed `{"ok":true,"skipped":"reserved_test_address"}`.
- **J3.1 (desktop, mobile, token created in the UI), J3.2 (cli), J3.3-J3.5, J3.6 (Capabilities row names UI path, both routes, both tools, no gap)**: pass on both surfaces. MCP parity: both tools exist and return the same JSON as the API; a read-only token gets the exact `scope_not_granted` text.
- **J4.1-J4.5 (cli)**: pass (server restarted first).
- **J5.1-J5.5**: pass on both servers. SCORE total 29, failed [], blocked [], notRun exactly R2.3, S3.3, S6.1, S6.2, S6.3. `grep -c "Zk7!rivers" report.json` printed 0 (E.7 pass).
- **J6.1-J6.29 (desktop and mobile)**: pass. Each is the suite's step (run with `--ignore-blocked-external`) plus my own browser/curl check at the surface viewport. S6.1-S6.3 ran with the second local server as `--backend` (the Render URL is unreachable from the sandbox): same asset hash, `/mcp` 401 JSON, `/r/...` noindex + no-referrer. J6.8 (S3.3) and J6.29 (R2.3) are `not_run` by the spec's own rule and were recorded as pass because that is the specified outcome (no public page links a `/u/<slug>`; `baselineMapping` lists all 8 platform-agent-runner steps as `not_run` with a reason).
- **E.3 (desktop, mobile)**: pass: 400 `password_required`, no account created, same via MCP `production_smoke_account_ready`.
- **E.5**: pass, with a SIMULATED precondition (a local proxy answering 404 for `/api/production-smoke/*`; no older deployment exists to test against). Reviewer should decide whether this is acceptable.
- **E.6**: pass: S1.1 fail "fetch failed", all 28 others blocked, 0 passed.
- **E.7**: pass.

## Console errors and failed requests

- No uncaught page errors on any surface. No 5xx.
- `external_blocked` (cdnjs three.js through the sandbox proxy, ERR_TUNNEL_CONNECTION_FAILED): 55, not failures. The suite's `--ignore-blocked-external` flag only matches `ERR_TUNNEL_CONNECTION_FAILED|ERR_CERT_AUTHORITY_INVALID`; run without the sandbox proxy environment variables (DNS error `ERR_NAME_NOT_RESOLVED`) it fails S2.3/S3.1/S3.2/R2.2 (my own first attempt did this; discarded and re-run with the proxy environment).
- Console "Failed to load resource" 4xx lines are the expected 400 (J1.3 short password), 409 (E.2), 404 (shared output tokens in the suite), and one 429 from my own exploratory sign-ins before a server restart.

## Observations (outside any step)

1. The World Shell has no sign-out control at all; sign-out lives only in Classic Tools (desktop header clipped, see J1.8).
2. Classic Tools for a member at 1280px: the "Back to World" button overlaps the member name/title text in the header, and the header is wider than the viewport. At 390px the Career Placement Agents page shows the 3D scene squeezed to a narrow strip beside the cards and "Tracked Opportunities (0)" overlapping the "+ Track Opportunity" button.
3. The Production smoke screen after a failed POST (E.2) does not reload status, so it shows "Not created" while the account now exists as "Not ready".
4. Interface parity: status and create/ready have website, API and MCP paths; creating the account from MCP is deliberately impossible (password) per spec.
5. The edge-case preconditions for E.1 (role) and E.4 (two-step) have no point-and-click route; a proposed amendment could provide a fixture or a documented script.
6. The baseline lists curl-based steps (J2.5, J2.6, J3.3-J3.5, J5.2-J5.5, J6.x, E.x) as "desktop+mobile"; I ran the literal commands once per server and recorded the result on both surfaces. A clarifying amendment (mark them `cli`) is suggested.
