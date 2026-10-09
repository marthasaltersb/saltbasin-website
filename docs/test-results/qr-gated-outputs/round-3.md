# Test result: QR-gated tailored application outputs, round 3

```json
{"feature":"qr-gated-outputs","baseline":2,"specSha256":"ec0b38300916588f2be4249e36c6237ef9b95636972ebfc7ed8dfec2a2e2b00e","total":38,"passed":36,"failed":["J2.1","E.5"],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":["J2.1b","J3.2b","J5.1m"]}
```

- Feature: `qr-gated-outputs`. Pinned baseline v2 (spec `docs/training/qr-gated-outputs.md`, sha256 ec0b38300916...). `release-spec-baseline.mjs check` passed ("baselines match: qr-gated-outputs v2").
- Round 3, validation agent val-5100-7. Integration head tested: 379d72a.
- Environment: fresh database plus `npm run seed` per surface, vite build, `NODE_ENV=production node server/index.js` on port 5114. Chromium via Playwright, light scheme, en-US, TZ=UTC. Desktop 1280x900 (click); phone 390x844 (isMobile, hasTouch, tap), each on its own fresh database. Test accounts from `scripts/create-test-member.mjs`; journeys ran as the seeded administrator `betsy@test.local`, as the spec says.
- Result: **FAIL**. 38 scored steps, 36 passed, 2 failed (J2.1, E.5), none blocked, none not run.
- Screenshots: `/var/tmp/sbpg/release-loop/qr-gated-outputs/round-3/{desktop,mobile}/`. Live log: `.../round-3/steps.jsonl`.

## Baseline diff (v1 to v2)

All 38 scored steps are the same; changed: none; added: none; retired: none. Only the "Where things are" context changed (amendment A1, the phone route). Round 2 (v1) scored 33 of 38, so the two rounds read like for like.

## Fixes handed to this round

| Fix | Steps | Result |
| --- | --- | --- |
| T3, toast hyphen ("Approved - private QR link created (copied to clipboard).") | J3.3, J7.1, J8.3 | **Now pass** on desktop and mobile. The exact toast was seen in each. |
| T2, contact normaliser (array joined with " · ") | J2.1 (contact `avery@example.test`), observation J2.1b | Contact now reads `avery@example.test · Example City` in the View dialog. The contact part of J2.1 passes. **J2.1 still fails for a different reason** (below). |

## Failures

| Step | Expected | Observed | Evidence |
| --- | --- | --- | --- |
| J2.1 (desktop and mobile) | Dialog contains "Read-only - no edits can be made here." (hyphen) | Dialog reads "Read-only — no edits can be made here." (em dash). Every other listed item is present (name, headline, contact, Summary and text, Experience, role and dates, bullet, metadata line ending "Not yet approved", Download PDF link). | `desktop/j2-1-view*.png`, `mobile/j2-1-view*.png`; steps.jsonl J2.1 |
| E.5 (desktop and mobile) | "Too many attempts - please try again in 15 minutes" (hyphen) | "Too many attempts — please try again in 15 minutes" (em dash), shown after 6 attempts on the fresh server | `desktop/e5-limit.png`, `mobile/e5-limit.png`; steps.jsonl E.5 |

Both are the same class of problem as round 2: one punctuation character differs between the frozen spec (hyphen) and shipped copy (em dash). The fix details covered only T3 (the approve toast); the View-dialog note (round 2 T1) and the sign-in limit message (E.5) were not in this round's fix list and are unchanged. No lifecycle behaviour is wrong. Whether the product or the spec should change is a triage and amendment decision, not mine. The spec's own E.2 text uses an em dash ("Finalization cancelled — technologies ...") while J2.1, J3.3 and E.5 use hyphens.

## Step results (desktop and mobile identical unless noted)

| Step | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| P.1 to P.4 | pass | pass | sign-in via the login form; Harborbook ERP saved (Tools (1)); package files; import `resume_main #1 created`, `cover_letter #2 created`, "Next: My Resume" hint |
| J1.1, J1.2 | pass | pass | exact amber notice, two cards with IMPORTED tags, exact metadata line, buttons |
| J2.1 | **fail** | **fail** | em dash, see above |
| J2.2 | pass | pass | |
| J3.1 to J3.5 | pass | pass | confirm text; gate dialog with options and Hands-on preselected; both toasts exact; card, 64 px QR, 24-char slug; Career Master reads `hands_on` |
| J4.1 to J4.3 | pass | pass | toast, clipboard equals card link, new tab, `qr-1.svg`, `qr-1.png` 600x600 |
| J5.1 to J5.4 | pass | pass | title, top bar, document, QR caption, live-data panel, exact footer, privacy headers, robots meta; no horizontal scroll at 390 |
| J6.1 to J6.3 | pass | pass | 200 `application/pdf`, `Harbor-Demo-Resume-1.pdf`, three identical `/URI` lines, text checks |
| J7.1, J7.2 | pass | pass | no gate, exact toast, own slug, both documents correct |
| J8.1 to J8.5 | pass | pass | `new_version` / `unchanged`; same slug moves; older card Approved; revised text on the link |
| J9.1 to J9.3 | pass | pass | revoke toast; page "This link isn't available", API 404; new slug differs |
| J10.1 to J10.3 | pass | pass | unknown, short and revoked pages identical; Draft card has no link |
| E.1 to E.4 | pass | pass | one expected 409 per gate |
| E.5 | **fail** | **fail** | em dash, see above |
| E.6 | pass | pass | worktree clean; `server/data/applicationPackages/` holds only README.md; package JSON under `/var/tmp/sbpg/agents/val-5100-7/qr-demo` |

## Interface parity

- Desktop: every journey by clicks from `/world` -> Classic Tools -> Network Relationship Management -> My Resume / Career Master. Only typed addresses: the start page and the spec's private-window `/r/<slug>` links.
- Phone (390px): amendment A1's route (`/world` -> Journeys -> card My Resume / Career Master) works; all steps ran on it. No MOBILE_GAP for the spec's own route.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist. Capabilities with no MCP tool: list outputs, view an output, approve for QR (`POST /api/resume-outputs/:id/share`), revoke QR (`DELETE /api/resume-outputs/:id/share`), QR svg/png download (`GET /api/resume-outputs/:id/qr.svg|png`), import package, read a private shared output (`GET /api/shared-outputs/:token`) and its PDF.
- API routes seen in the network log: the share POST (409 gate then 200) and DELETE, qr.svg/png, `/api/shared-outputs/:token[/download.pdf]`, `/api/career-agents/resume-outputs/:id/download.pdf`.

## Console errors and failed requests

- Page errors: none.
- Expected non-2xx: 409 on `POST /api/resume-outputs/{1,4}/share` (the gate, per surface); 404 on `/api/shared-outputs/<revoked|unknown|short>`; 401 and 429 on `/api/auth/login` from E.5.
- `net::ERR_ABORTED` on `/api/career-agents/resume-outputs/1/download.pdf`: the browser turning the PDF response into a download (J6.3), not a failure.
- External font and three.js requests blocked by the sandbox (`external_blocked`, plus matching cert and tunnel console lines).

## Observations (not scored)

- O1. A third package version (`pkg-v3`, "Second revision:") was imported after Journey 9 purely to give J10.3, E.1, E.2 and E.4 a Draft card, because the spec supplies none after J9 (the gap in rejected amendment A2). It is harness setup, not a spec step.
- O2. E.5 reached the limit after 6 attempts, not "more than 10": earlier sign-ins in the same server run count toward the same limit.
- O3. The `.docx` stamp path still has no UI journey (no baseline step covers it).
- O4. J2.1b (contact separator, fixed by T2), J3.2b (Save disabled when the dropdown is reset to `Choose…`) and J5.1m (no horizontal scroll at 390) all pass on both surfaces.

## Harness notes (no product impact)

- The first desktop attempt logged J7.1 as a failure because my script checked for the hyphen toast only after it had already disappeared (the screenshot showed the hyphen toast). I fixed the check to watch during the toast, moved that attempt's log to `/var/tmp/sbpg/agents/val-5100-7/superseded/desktop-attempt1-steps.jsonl`, and re-ran the whole desktop pass on a fresh database. Reported scores come from that full re-run.
- The first mobile attempt crashed at server boot (a duplicate-key error in bootstrap racing the seed command after only 8 seconds). Its four log lines are in `superseded/mobile-attempt0-crash.jsonl`; I raised the wait and re-ran the whole mobile pass.

## Cleanup

Server stopped by PID file; database `sb_rl_val_5100_7` dropped. Scratch and logs remain under `/var/tmp/sbpg/agents/val-5100-7/`.
