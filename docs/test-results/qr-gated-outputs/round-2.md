# Test result: QR-gated tailored application outputs, round 2

```json
{"feature":"qr-gated-outputs","baseline":1,"specSha256":"a57784296471ae79e8921426fe1f1f5e38c04b8f225d2900cf22295e3d0cb779","total":38,"passed":33,"failed":["J2.1","J3.3","J7.1","J8.3","E.5"],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":["J2.1b","J3.2b","J5.1m"]}
```

- Feature: `qr-gated-outputs`. Pinned baseline v1 (spec `docs/training/qr-gated-outputs.md`, sha256 a57784296471...). `release-spec-baseline.mjs check` passed. The baseline did not change since round 1, so no `diff` table applies.
- Round: 2 (validation agent val-5100-1). Integration head tested: c3a71b4.
- Environment: fresh database plus `npm run seed`, `npm run build`, `NODE_ENV=production node server/index.js` on port 5102. Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900 and phone 390x844 (isMobile, hasTouch, tap). Each surface was walked on its own fresh database. Test accounts were created with `scripts/create-test-member.mjs` and the journeys ran as the seeded administrator `betsy@test.local`, as the spec says. Private-window steps used a fresh browser context.
- Result: **FAIL**. Score from `release-spec-baseline.mjs score`: 38 scored steps, 33 passed, 5 failed (J2.1, J3.3, J7.1, J8.3, E.5), none blocked, none not run. Every failing step fails for one literal reason: the product shows an em dash where the frozen spec writes a hyphen. No lifecycle behaviour is wrong.
- Screenshots: `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-2/{desktop,mobile}/`. Live log: `.../round-2/steps.jsonl`. The log starts with 276 lines from an earlier aborted attempt (port 8102, no step ids); they do not affect the score.
- Fixtures: package JSON lived in the agent's own scratch directory, not the shared `/var/tmp/qr-demo`. Nothing under `server/data/applicationPackages/` was touched. A third package version (`pkg-v3`, "Second revision:") was imported after Journey 9 only to supply a Draft card for J10.3, E.1, E.2 and E.4, which the spec requires but does not provide a fixture for. It is not a spec step.
- Harness note: one early desktop J5.1 line failed because my script matched the button text case-sensitively (the UI renders "DOWNLOAD PDF" in capitals). I moved that single line to `/var/tmp/sbpg/agents/val-5100-1/superseded-harness-bug.jsonl` and the re-run passed. The product was not at fault.

## Step results (both surfaces unless noted)

| Step | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| P.1 to P.4 | pass | (setup, redone on the second database) | sign-in, Harborbook ERP added (Tools (1)), package files, import `resume_main #1 created`, `cover_letter #2 created` |
| J1.1, J1.2 | pass | pass | exact amber notice, two cards, IMPORTED tags, exact metadata line, buttons (plus "Version history" and, on the cover letter, "Edit with cover-letter agent", not in spec) |
| J2.1 | **fail** | **fail** | everything present except the note reads "Read-only — no edits can be made here." (em dash); spec says hyphen. Also see observation O1 |
| J2.2 | pass | pass | |
| J3.1, J3.2 | pass | pass | confirm text, gate dialog, options, Hands-on preselected |
| J3.3 | **fail** | **fail** | first toast exact; second reads "Approved — private QR link created (copied to clipboard)." (em dash) vs spec hyphen. Amber notice does go away |
| J3.4, J3.5 | pass | pass | 64 px QR, 24-char slug, links, buttons; Career Master reads `hands_on` |
| J4.1 to J4.3 | pass | pass | toast, clipboard equals card link, new tab, `qr-1.svg`, `qr-1.png` 600x600 |
| J5.1 to J5.4 | pass | pass | title, bar, buttons, document, QR caption, live-data panel, exact footer, privacy headers, robots meta; no horizontal scroll at 390 |
| J6.1 to J6.3 | pass | pass | 200 `application/pdf`, `Harbor-Demo-Resume-1.pdf`, three identical `/URI` lines, text checks via `pdftotext` |
| J7.1 | **fail** | **fail** | confirm shown, no category dialog, own QR and link, but toast uses an em dash (spec hyphen) |
| J7.2 | pass | pass | |
| J8.1, J8.2, J8.4, J8.5 | pass | pass | `new_version` / `unchanged`; slug moves; older card Approved with Publish and Approve for QR |
| J8.3 | **fail** | **fail** | same em-dash toast; no category dialog (correct) |
| J9.1 to J9.3 | pass | pass | exact revoke confirm and "QR link revoked." toast; page and API 404; new slug differs |
| J10.1 to J10.3 | pass | pass | unknown, short and revoked pages identical; Draft card has no link |
| E.1, E.2, E.3, E.4 | pass | pass | E.2 toast matches the spec's em dash; one expected 409 per gate |
| E.5 | **fail** | **fail** | message is "Too many attempts — please try again in 15 minutes" (em dash); spec hyphen. It also appeared after 5 and 3 wrong attempts because earlier sign-ins in the same run count toward the same limit |
| E.6 | pass | pass | `git status --porcelain` empty; applicationPackages holds only README.md |

## Open bugs from the fix details

| Bug | Maps to | Status this round |
| --- | --- | --- |
| qr-gated-outputs-B7 (spec predates test accounts) | P.1, P.4, J3.4, J8.x | Verified. With `create-test-member.mjs` readying the admin (terms accepted, no password change) all of P.1 to P.4, J3 and J8 pass on both surfaces. The spec text still names the administrator; that works. |
| qr-gated-outputs-B10 (docx path has no UI or journey) | no baseline step | Not testable. Observation O3. |
| qr-gated-outputs-B11 (browser cannot show PDF annotations) | J6.2 | Verified by `grep -a -o '/URI (...)'` on the downloaded PDF: three identical URIs. Annotations are still not viewable in the browser; no step requires it. |
| T1 (em dash in View dialog) | J2.1 | **Still failing**. Spec not amended. |
| T2 (contact line concatenated) | none (J2.1 lists contact `avery@example.test`, which is present) | **Still present**. Observation O1. |
| T3 (em dash toasts) | J3.3, J7.1, J8.3 | **Still failing**. Same cause as T1; also E.5. |
| resume-rollups-B9 | J12 of another feature | Not covered by this baseline. |

## Interface parity

- Desktop: all journeys by clicks from `/world` -> Classic Tools -> Network Relationship Management -> sub tabs. The only typed address was the start page and the spec's own private-window `/r/<slug>` links.
- **MOBILE_GAP (observation O2, not scored):** at 390 px the top-level tab strip in Classic Tools (and the member's tab strip) is `display:none` and the CSS for a mobile menu (`.sb-admin-mobile-menu-button` in `src/brand.css`) has no matching element in any `.jsx`, so Classic Tools -> Network Relationship Management -> My Resume cannot be reached. I walked the phone pass through World Shell -> Journeys -> My Resume / Career Master instead, which opens the same panel. All steps passed that way. The spec's "Where things are" path is not followable on a phone.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist. Capabilities with no MCP tool: list outputs, view an output, approve for QR (`POST /api/resume-outputs/:id/share`), revoke QR (`DELETE /api/resume-outputs/:id/share`), QR svg/png download, import package (`POST /api/resume-outputs/import-package`), read a private shared output (`GET /api/shared-outputs/:token`) and its PDF.
- API routes seen in the network log: `POST /api/resume-outputs/:id/share` (409 gate then 200), `DELETE /api/resume-outputs/:id/share`, `GET /api/resume-outputs/:id/qr.svg|png`, `GET /api/shared-outputs/:token[/download.pdf]`, `GET /api/career-agents/resume-outputs/:id/download.pdf`.

## Console errors and failed requests

- Page errors: none.
- Expected non-2xx: 409 on `POST /api/resume-outputs/1/share` and `/4/share` (the gate, once per gate on each surface); 404 on `/api/shared-outputs/<revoked|unknown|short>`; 401/429 on `/api/auth/login` from E.5.
- `net::ERR_ABORTED` on `/api/career-agents/resume-outputs/1/download.pdf`: the browser turning the PDF response into a download; not a failure.
- External font and three.js requests were blocked by the sandbox (`external_blocked`).

## Observations (not scored)

- O1. The document header's contact entries render with no separator in the View dialog and on `/r/<slug>` ("avery@example.testExample City"), at 1280 and 390 px; the PDF joins them with a comma. Under the regression-gate rule this is a readability defect (open bug T2, not fixed). Evidence: `desktop/j2-1-view.png`, `mobile/j2-1-view.png`. Logged as `J2.1b`.
- O2. The mobile navigation gap above.
- O3. No UI or journey exercises the `.docx` stamp path (B10).
- O4. The sign-in limit trips well before "more than 10" when earlier sign-ins in the same hour came from the same address. A tester should sign in once and reuse the session, as E.5 already says.
- O5. The "Back to World" button overlaps the "Salt Basin Net Works" wordmark in the Classic Tools header at both widths (pre-existing shell chrome).

## Proposed amendments

1. J2.1: change "Read-only - no edits can be made here." to "Read-only — no edits can be made here." (em dash, matches shipped copy and other specs).
2. J3.3, J7.1, J8.3: change "Approved - private QR link created (copied to clipboard)." to the em-dash form.
3. E.5: change "Too many attempts - please try again in 15 minutes" to the em-dash form.
4. Where things are: add the phone route (World Shell -> Journeys -> My Resume) or fix the missing mobile menu.

## Cleanup

Server stopped by PID file; database `sb_rl_val_5100_1` dropped. Scratch and logs remain under `/var/tmp/sbpg/agents/val-5100-1/`.
