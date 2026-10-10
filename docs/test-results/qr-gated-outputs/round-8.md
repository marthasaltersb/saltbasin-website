# Test result: QR-gated tailored application outputs, round 8

```json
{"feature":"qr-gated-outputs","baseline":2,"specSha256":"ec0b38300916588f2be4249e36c6237ef9b95636972ebfc7ed8dfec2a2e2b00e","total":38,"passed":38,"failed":[],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":["J2.1b","J3.2b","J5.1m"]}
```

- Feature `qr-gated-outputs`, pinned baseline v2 (sha256 ec0b38300916...). `release-spec-baseline.mjs check` passed ("baselines match: qr-gated-outputs v2"). `diff`: nothing changed, added or retired since round 7 (only context "Where things are" differs), so the score reads like for like with rounds 3 to 7.
- Round 8, validation agent val-5100-1, integration head faaebbf.
- Environment: fresh database + `npm run seed` per surface, vite build, `NODE_ENV=production node server/index.js` on port 5102, Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900 (click); phone 390x844 (isMobile, hasTouch, tap), each on its own fresh database. Accounts from `scripts/create-test-member.mjs` (member@test.local).
- Result: **PASS**. 38 scored steps, 38 passed, none failed, blocked or not run.
- Screenshots: `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-8/{desktop,mobile}/`. Live log: `.../round-8/steps.jsonl`. An aborted first attempt (server crashed on first boot, see O1) is kept as `aborted-attempt1-steps.jsonl` and was not scored.

## Open bugs handed to this round, by baseline step

| Bug | Maps to | Result |
| --- | --- | --- |
| F7-2 (amendments A3/A8 not exact, site-sync decision) | no baseline step (J6.4 does not exist in baseline v2) | Not testable by a step. A3, A4, A6, A7, A8 are all `rejected` in `docs/spec-amendments/qr-gated-outputs/`; baseline unchanged. Stays open pending a new amendment and the owner's site-sync decision. |
| F7-3 (spec predates member-only World Shell; P.1 says administrator) | P.1 | P.1 passes as run (member account per test constraints). Spec text unchanged; stays open as a wording amendment (O2). |
| F7-4 (no step creating the Draft card) | J10.3 / E.1 / E.2 / E.4 | Steps pass, but only because I imported a third package version as harness setup (not a spec step). Stays open as a coverage gap (O4). |
| F7-5 (no scored MCP step) | none | MCP checked outside the score, see Interface parity; all matched the UI. Stays open as a coverage gap. |
| F7-6 (in-app import card, spec covers only CLI import) | P.4 | P.4 (CLI) passes. The in-app card exists but is unreadable on the phone (O3). Stays open. |
| resume-rollups-B9, cover-letter-agent-F1-12, cover-letter-agent-T11 | reassigned, other features | T11: the same unreadable import card still reproduces at 390px (O3). Others are not in this feature's baseline. |

## Step results

P.1 to P.4, J1.1 to J10.3, E.1 to E.6: **pass** on desktop and mobile (setup steps once per surface run). Notable: 24-character slugs; QR image 64x64; PNG 600x600; three identical `/URI` lines in the PDF; privacy headers on page and API; meta robots; revoked, unknown and short slugs show the identical unavailable page and API 404; same slug moved to the newer version; revoked slug never reissued (SLUG3 differs); footer reads `Approved by Test Member on <today>`; E.5 limit message reached after 6 attempts: "Too many attempts - please try again in 15 minutes". Unscored extra checks J2.1b, J3.2b, J5.1m pass.

## Interface parity

- Desktop: all journeys by clicks from the World Shell (Classic Tools, then sub tab My Resume / Career Master). Typed addresses only: the start page and the spec's private-window `/r/<slug>` links.
- Phone 390px: all steps by taps via World Shell, Journeys cards. No MOBILE_GAP.
- API routes seen in the network log: share POST (409 gate then 200) and DELETE, qr.svg/png, `/api/shared-outputs/:token[/download.pdf]`, `/api/career-agents/resume-outputs/:id/download.pdf`.
- MCP: token created through World Shell > Journeys > Connected Agents, tools called on `/mcp` as the same user. `shared_output_resolve` on a live slug returned the revised document (same as the private page); on a revoked slug returned 404 not_found (matches UI and API). `application_output_revoke_qr` returned `{ok:true}`. `application_package_import` returned `unchanged` for both outputs. `application_output_approve_for_qr` returned 409 `tool_category_required` listing the unclassified tool, the same gate as the website. No MCP_GAP.

## Console errors and failed requests

- Page errors: none.
- Expected non-2xx: 409 on share POST (the gate), 404 for revoked/unknown/short slugs, 401 and 429 from E.5.
- `net::ERR_ABORTED` on `/api/career-agents/resume-outputs/1/download.pdf` (desktop and mobile): the browser turning the response into a download, not a failure.
- External font and three.js requests blocked by the sandbox (`external_blocked`); matching `console_error` lines are blocked-resource and HTTP-status messages.

## Observations (not scored)

- O1. First boot of the server against the first fresh database crashed: `PostgresError: duplicate key value violates unique constraint "pg_type_typname_nsp_index"`, `Key (typname, typnamespace)=(metric_definitions, 2200) already exists` (code 23505, a concurrent `CREATE TABLE IF NOT EXISTS` race during bootstrap). The server was left not listening (ECONNREFUSED). Two later fresh-database boots (desktop, mobile) did not reproduce it. Possible product defect (boot race in `server/db.js` bootstrap); no baseline step covers it.
- O2. A member's desktop path has no "Network Relationship Management" tab; sub tabs sit directly under Classic Tools. P.1 names the administrator, but the test-account constraint uses the member (F7-3).
- O3. In My Resume at 390px, the "Import an application package" card (file chooser, "Link the documents to an opportunity ..." checkbox) renders cream text on a cream background and is practically unreadable (screenshot `mobile/obs-import-card.png`, text colour rgb(245,240,232), transparent card background). Regression-gate "unreadable screen" rule; same as cover-letter-agent-T11 and part of F7-6.
- O4. J10.3 / E.1 / E.2 / E.4 need a Draft card but no step makes one; a third package import was harness setup (F7-4).
- O5. Amendments A3 (docx stamp, proposed step id `[B10.1]`), A4, A6, A7, A8 are all `rejected`; the docx download, in-app import and MCP behaviour have no baseline step.
- O6. The spec's E.2 toast keeps an em dash and the product matches; the J3.3, J7.1 and J8.3 toasts use a hyphen in the spec and the product matches.

## Cleanup

Server stopped by PID file, database `sb_rl_val_5100_1` dropped. Scratch under `/var/tmp/sbpg/agents/val-5100-1/`. No product code, spec or baseline changed; nothing committed; nothing under `server/data/applicationPackages/`.
