# Test result: QR-gated tailored application outputs, round 5

```json
{"feature":"qr-gated-outputs","baseline":2,"specSha256":"ec0b38300916588f2be4249e36c6237ef9b95636972ebfc7ed8dfec2a2e2b00e","total":38,"passed":36,"failed":["J2.1","E.5"],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":["J2.1b","J3.2b","J5.1m"]}
```

- Feature `qr-gated-outputs`, pinned baseline v2 (sha256 ec0b38300916...). `release-spec-baseline.mjs check` passed ("baselines match: qr-gated-outputs v2").
- Round 5, validation agent val-5100-1, integration head 0800b1c.
- Environment: fresh database + `npm run seed` per surface, vite build, `NODE_ENV=production node server/index.js` on port 5102, Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900 (click); phone 390x844 (isMobile, hasTouch, tap), each on its own fresh database. Accounts: `scripts/create-test-member.mjs` (member@test.local, display name "Test Member", terms accepted). Package fixtures made from the spec's own heredoc, kept in the agent scratch dir.
- Result: **FAIL**. 38 scored steps, 36 passed, 2 failed (J2.1, E.5), none blocked, none not run. Same score and same two failures as rounds 3 and 4.
- Screenshots: `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-5/{desktop,mobile}/`. Live log: `.../round-5/steps.jsonl`.

## Baseline diff

Baseline is v2, unchanged since round 3: same 38 scored steps, none changed, added or retired. Scores read like for like with rounds 3 and 4.

## Failures (desktop and phone identical)

| Step | Expected | Observed | Evidence |
| --- | --- | --- | --- |
| J2.1 | "Read-only - no edits can be made here." (hyphen) | "Read-only — no edits can be made here." (em dash). Every other listed item present. | `desktop/j2-1-view.png`, `mobile/j2-1-view.png`; `src/components/admin/MyResumePanel.jsx:1109` still contains the em dash |
| E.5 | "Too many attempts - please try again in 15 minutes" (hyphen) | "Too many attempts — please try again in 15 minutes" (em dash) after 6 attempts | `desktop/e5-limit.png`, `mobile/e5-limit.png`; `server/routes/auth.js:28` still contains the em dash |

## Fixes handed to this round, by step id

| Fix | Step | Result |
| --- | --- | --- |
| T1 (J2.1 read-only note) | J2.1 | NOT fixed: the code at this head still has the em dash. Still fails. |
| T5 (E.5 limit message) | E.5 | NOT fixed: the code at this head still has the em dash. Still fails. |
| B7, F2-11, F3-5, G1 (member accounts, World Shell, phone route) | P.1, J1 to J10 navigation | All journeys run as member@test.local. Desktop path is World Shell > Classic Tools > My Resume / Career Master (see O1). Phone path via Journeys cards works (A1). Pass. |
| G2, F2-12, F3-6 (Draft card fixture) | J10.3, E.1, E.2, E.4 | Spec still gives no fixture (O3). Steps passed using harness setup. |
| B10, F3-10 (docx) | no baseline step | Not scored; button present (O4). |
| B11 (browser cannot show PDF annotations) | J6.2 | Passes via the spec's own grep of `/URI` in the PDF: three identical lines. |
| F3-11 (mobile) | all | Full phone walkthrough passed except the same two copy failures. |
| resume-rollups-B9 | none (Journey 12 belongs to another feature) | Not testable here. |

## Step results (desktop and mobile identical)

P.1 to P.4, J1.1, J1.2, J2.2, J3.1 to J3.5, J4.1 to J4.3, J5.1 to J5.4, J6.1 to J6.3, J7.1, J7.2, J8.1 to J8.5, J9.1 to J9.3, J10.1 to J10.3, E.1 to E.4, E.6: **pass** on both surfaces. J2.1 and E.5: **fail** on both. Per-step detail with seen text is in steps.jsonl. Notable: slugs 24 chars; QR image 64 px; PNG 600x600; three identical `/URI` lines in the PDF; privacy headers on page and API; revoked, unknown and short slugs show the identical unavailable page and API 404; same slug moved to the newer version; revoke never reissued; footer reads `Approved by Test Member on <today>`.

## Interface parity

- Desktop: all journeys by clicks from the World Shell (Classic Tools > My Resume / Career Master). Typed addresses: start page and the spec's private-window `/r/<slug>` links only.
- Phone 390px: all steps by taps via Journeys cards. No MOBILE_GAP.
- API routes seen: share POST (409 gate then 200) and DELETE, qr.svg/png, `/api/shared-outputs/:token[/download.pdf]`, `/api/career-agents/resume-outputs/:id/download.pdf`.
- MCP: token created through World Shell > Journeys > Connected Agents, then tools called on `/mcp` as the same user. `shared_output_resolve` on a live slug returned the same document as the private page; on a revoked slug returned 404 not_found (matches UI and API). `application_output_revoke_qr` returned ok. `application_package_import` returned `unchanged`, matching the importer. `application_output_approve_for_qr` returned 409 `tool_category_required` listing the unclassified Gatecheck Tool, the same gate as the website. No MCP_GAP.

## Console errors and failed requests

- Page errors: none.
- Expected non-2xx: 409 on share POST (the gate), 404 on revoked/unknown/short slugs, 401 and 429 from E.5.
- `net::ERR_ABORTED` on the PDF download URL: the browser turning the response into a download, not a failure.
- External font and three.js requests blocked by the sandbox (`external_blocked`); the matching `console_error` lines are blocked-resource and HTTP-status messages.

## Observations (not scored)

- O1. The spec's desktop path says to click the top tab "Network Relationship Management" then the sub tab. A member's Classic Tools view has no such tab: the sub tabs (Career Master, My Resume, ...) are the top row directly. The spec also says to sign in as the administrator (P.1); I signed in as member@test.local per the test-account constraint. Proposed amendment wording: "My Resume: open `<BASE>/world`, click **Classic Tools**, click the tab **My Resume** (administrators first click **Network Relationship Management**)."
- O2. J3.4/J5.1/J8.5 say "Approved by <your display name or email>"; the member's display name "Test Member" is shown, which the spec allows. The spec text "for the seeded administrator this is the email address" does not apply to the member account.
- O3. Draft card fixture: no spec step supplies a Draft card after Journey 9, so I imported a third package version (harness setup, not a spec step) for J10.3, E.1, E.2, E.4.
- O4. Download .docx button is present on every card; Version history and Check freshness buttons also appear (J1.2's required buttons all still present). Docx contents not re-inspected this round.
- O5. J2.1b (contact line `avery@example.test · Example City`), J3.2b (Save disabled at `Choose…`) and J5.1m (no horizontal scroll) pass on both surfaces.
- O6. E.5 reached the limit after 6 attempts, not "more than 10", because earlier sign-ins in the same server run count toward it.

## Cleanup

Server stopped by PID file, database `sb_rl_val_5100_1` dropped. Scratch under `/var/tmp/sbpg/agents/val-5100-1/`. No product code, spec or baseline changed; nothing committed; `git status` clean before this report; nothing under `server/data/applicationPackages/`.
