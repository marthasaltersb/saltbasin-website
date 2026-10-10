# Test result: QR-gated tailored application outputs, round 7

```json
{"feature":"qr-gated-outputs","baseline":2,"specSha256":"ec0b38300916588f2be4249e36c6237ef9b95636972ebfc7ed8dfec2a2e2b00e","total":38,"passed":38,"failed":[],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":["J2.1b","J3.2b","J5.1m"]}
```

- Feature `qr-gated-outputs`, pinned baseline v2 (sha256 ec0b38300916...). `release-spec-baseline.mjs check` passed ("baselines match: qr-gated-outputs v2").
- Round 7, validation agent val-7100-6, integration head 6a71095.
- Environment: fresh database + `npm run seed` per surface, vite build, `NODE_ENV=production node server/index.js` on port 7112, Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900 (click); phone 390x844 (isMobile, hasTouch, tap), each on its own fresh database. Accounts from `scripts/create-test-member.mjs` (member@test.local).
- Result: **PASS**. 38 scored steps, 38 passed, none failed, blocked or not run.
- Screenshots: `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-7/{desktop,mobile}/`. Live log: `.../round-7/steps.jsonl`.

## Baseline diff

Baseline v2, unchanged since round 3 (diff: nothing changed, added or retired; only context "Where things are" differs). Scores read like for like with rounds 3 to 5.

## Fixes handed to this round, by step id

| Fix | Step | Result |
| --- | --- | --- |
| T1 (View dialog note, hyphen) | J2.1 | FIXED. Dialog reads "Read-only - no edits can be made here." on desktop and phone. Passes. |
| T5 (sign-in limit message, hyphen) | E.5 | FIXED. After 6 attempts the message is "Too many attempts - please try again in 15 minutes" on desktop and phone. Passes. |

## Step results

P.1 to P.4, J1.1 to J10.3, E.1 to E.6: **pass** on desktop and mobile (setup steps once each per surface run). Notable: slugs 24 chars; QR image 64x64; PNG 600x600; three identical `/URI` lines in the PDF; privacy headers on page and API; revoked, unknown and short slugs show the identical unavailable page and API 404; same slug moved to the newer version; revoked slug never reissued; footer reads `Approved by Test Member on <today>`. Unscored extra checks J2.1b, J3.2b, J5.1m also pass.

## Interface parity

- Desktop: all journeys by clicks from the World Shell. Typed addresses only: start page and the spec's private-window `/r/<slug>` links.
- Phone 390px: all steps by taps via Journeys cards. No MOBILE_GAP.
- API routes seen: share POST (409 gate then 200) and DELETE, qr.svg/png, `/api/shared-outputs/:token[/download.pdf]`, `/api/career-agents/resume-outputs/:id/download.pdf`.
- MCP: token created via World Shell > Journeys > Connected Agents, tools called on `/mcp` as the same user. `shared_output_resolve` on a live slug returned the same document as the private page (revised text); on a revoked slug returned 404 not_found (matches UI and API). `application_output_revoke_qr` returned ok. `application_package_import` returned `unchanged`. `application_output_approve_for_qr` returned 409 `tool_category_required` for the unclassified tool, the same gate as the website. No MCP_GAP.

## Console errors and failed requests

- Page errors: none.
- Expected non-2xx: 409 on share POST (the gate), 404 for revoked/unknown/short slugs, 401 and 429 from E.5.
- `net::ERR_ABORTED` on the PDF download URL: browser turning the response into a download, not a failure.
- External font and three.js requests blocked by the sandbox (`external_blocked`); matching `console_error` lines are blocked-resource and HTTP-status messages.

## Observations (not scored)

- O1. Desktop path for a member has no "Network Relationship Management" tab; sub tabs are directly under Classic Tools (unchanged from round 5; proposed amendment wording there still applies). I used the member account per the test-account constraint, not the administrator named in P.1.
- O2. "Approved by" shows the member display name "Test Member", which the spec allows.
- O3. No spec step supplies a Draft card after Journey 9; a third package version import was harness setup for J10.3, E.1, E.2, E.4.
- O4. E.5 reached the limit after 6 attempts (earlier sign-ins in the same run count).
- O5. Spec's E.2 toast keeps an em dash ("Finalization cancelled — technologies ...") and the product matches it; only the E.5 and J2.1 strings were changed to hyphens.

## Cleanup

Server stopped by PID file, database `sb_rl_val_7100_6` dropped. Scratch under `/var/tmp/sbpg/agents/val-7100-6/`. No product code, spec or baseline changed; nothing committed; worktree `git status` clean; nothing under `server/data/applicationPackages/`.
