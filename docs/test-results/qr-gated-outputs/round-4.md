# Test result: QR-gated tailored application outputs, round 4

```json
{"feature":"qr-gated-outputs","baseline":2,"specSha256":"ec0b38300916588f2be4249e36c6237ef9b95636972ebfc7ed8dfec2a2e2b00e","total":38,"passed":36,"failed":["J2.1","E.5"],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":["J2.1b","J3.2b","J5.1m"]}
```

- Feature `qr-gated-outputs`, pinned baseline v2 (sha256 ec0b38300916...). `release-spec-baseline.mjs check` passed ("baselines match: qr-gated-outputs v2").
- Round 4, validation agent val-5100-13, integration head 2fd2e2e.
- Environment: fresh database + `npm run seed` per surface, vite build, `NODE_ENV=production node server/index.js` on port 5126, Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900 (click); phone 390x844 (isMobile, hasTouch, tap), each on its own fresh database. Phone route per amendment A1 (World Shell, Journeys, card My Resume / Career Master). Journeys run as the seeded administrator betsy@test.local, as the spec says.
- Result: **FAIL**. 38 scored steps, 36 passed, 2 failed (J2.1, E.5), none blocked, none not run. Same score and same two failures as round 3.
- Screenshots: `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-4/{desktop,mobile}/`. Live log: `.../round-4/steps.jsonl`.

## Baseline diff

Baseline is v2, unchanged since round 3 (no diff needed): same 38 scored steps, none changed, added or retired. Scores read like for like with round 3.

## Fixes handed to this round, by step id

| Fix | Steps | Result |
| --- | --- | --- |
| F2-8 stamped .docx | No baseline step. Observation O1 | Works (see O1). Not scored. |
| F2-10 MCP tools (revoke, import, resolve) | No baseline step. Observation O2 | Work and match the UI (see O2). Not scored. |
| F2-6 contact joined with " · " | J2.1b (observation), contact part of J2.1 | Browser-confirmed on desktop and phone: View dialog reads `avery@example.test · Example City`. Contact part passes. |
| F2-11, F2-12 | not fixed (need amendments) | Not testable. A v3 import step is still absent, so I imported pkg-v3 as harness setup for the Draft card (J10.3, E.1, E.2, E.4). |

## Failures (desktop and phone identical)

| Step | Expected | Observed | Evidence |
| --- | --- | --- | --- |
| J2.1 | "Read-only - no edits can be made here." (hyphen) | "Read-only — no edits can be made here." (em dash). Every other listed item is present. | `desktop/j2-1-view.png`, `mobile/j2-1-view.png`; steps.jsonl J2.1 |
| E.5 | "Too many attempts - please try again in 15 minutes" (hyphen) | "Too many attempts — please try again in 15 minutes" (em dash), after 6 attempts on the fresh server | `desktop/e5-limit.png`, `mobile/e5-limit.png`; steps.jsonl E.5 |

Same single-character copy mismatch (spec hyphen, product em dash) as rounds 2 and 3. Which one changes is a triage or amendment decision. The spec's own E.2 text uses an em dash.

## Step results (desktop and mobile identical)

P.1 to P.4, J1.1 to J1.2, J2.2, J3.1 to J3.5, J4.1 to J4.3, J5.1 to J5.4, J6.1 to J6.3, J7.1 to J7.2, J8.1 to J8.5, J9.1 to J9.3, J10.1 to J10.3, E.1 to E.4, E.6: **pass** on both surfaces. J2.1 and E.5: **fail** on both. Per-step detail is in steps.jsonl (exact hyphen toasts seen; 24-char slugs; 64px QR; 600x600 PNG; three identical `/URI` lines in the PDF; privacy headers; revoked, unknown and short slugs show the identical unavailable page; same slug moves to the newer version; revoke never reissues).

## Interface parity

- Desktop: all journeys by clicks from the World Shell (Classic Tools, Network Relationship Management, My Resume / Career Master). Typed addresses only: start page and the spec's private-window `/r/<slug>` links.
- Phone 390px: all steps ran by taps through Journeys cards. No MOBILE_GAP.
- MCP: the platform MCP server now exists (`/mcp`). I created a token through the Connected Agents screen (World Shell, Journeys, Connected Agents, all four scopes) and called tools as the same user. No MCP_GAP found (see O2).
- API routes seen: share POST (409 gate then 200) and DELETE, qr.svg/png, `/api/shared-outputs/:token[/download.pdf]`, `/api/career-agents/resume-outputs/:id/download.pdf`, `/api/resume-outputs/:id/download.docx`.

## Console errors and failed requests

- Page errors: none.
- Expected non-2xx: 409 on share POST (the gate); 404 on `/api/shared-outputs/<revoked|unknown|short>`; 401 and 429 from E.5.
- `net::ERR_ABORTED` on PDF and .docx download URLs: the browser turning the response into a download, not a failure.
- External font and three.js requests blocked by the sandbox (`external_blocked`); matching `console_error` lines are the blocked-resource and HTTP-status messages.

## Observations (not scored)

- O1. F2-8 .docx, walked in the browser on the phone (Download .docx button present on every card, desktop and phone). Files in `mobile/card*-Harbor-Demo-Resume-*.docx`: core properties created `2026-09-30T13:00:01Z`, modified = last content change, creator `Avery Example; Jordan Sample`, lastModifiedBy `betsy@test.local`. The approved card (output 3, Published) has `word/media/qr.png` in the header, header relationship target `http://127.0.0.1:5126/r/2JObfsRzTpMWnGakEtSQss04` equal to that card's link, plus a "Verified copy" line. The older unapproved card (output 1) has no media and no Verified copy line, correct. Clicking the QR inside Word is not a browser step; not exercised.
- O2. F2-10 MCP tools via `/mcp` with a token minted in the UI: `application_output_revoke_qr` on output 3 returned ok; `shared_output_resolve` on its slug then returned 404 not_found (matches the unavailable page and API 404). `application_output_approve_for_qr` returned 409 `tool_category_required` listing the unclassified Gatecheck Tool (same gate as the website's 409). `application_package_import` of pkg-v3 returned `unchanged`; a changed copy returned `new_version`, matching the importer script. `shared_output_resolve` on a live slug returned the same document as the private page.
- O3. pkg-v3 ("Second revision:") was imported after Journey 9 only to supply a Draft card for J10.3, E.1, E.2 and E.4, because the spec still supplies none (rejected amendments A2/A5; F2-12 open). Harness setup, not a spec step.
- O4. E.5 reached the limit after 6 attempts, not "more than 10", because earlier sign-ins on the same server run count toward the limit.
- O5. J2.1b, J3.2b (Save disabled at `Choose…`) and J5.1m (no horizontal scroll at 390) pass on both surfaces.
- O6. My Resume cards now also show "Version history" and, on cover letters, "Edit with cover-letter agent"; J1.2's required buttons are all still present.

## Cleanup

Server stopped by PID file, database `sb_rl_val_5100_13` dropped. Scratch under `/var/tmp/sbpg/agents/val-5100-13/`. No product code, spec or baseline changed; nothing committed; nothing under `server/data/applicationPackages/`; package JSON stayed in the scratch dir.
