# Test result — Cover letter per opportunity, package table of contents, confined cover-letter agent (round 1)

- Feature: Cover letter per opportunity, package table of contents, confined cover-letter agent
- Training spec: `docs/training/cover-letter-agent.md`, frozen as baseline v1 (sha256 `7b770a0c75e5e8adc85ba1078589b9e402b2e1a81ec530c2ea35d178865fa880`); `release-spec-baseline.mjs check` passed ("baselines match: cover-letter-agent v1"). First scored round on a baseline, so no diff table.
- Round: 1 (validator `val-5800-1`)
- Commit tested: `c3a71b490991e2f7c7616cb326bd9cfe1084b7d0` (integration branch `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-09
- Environment: fresh database `sb_rl_val_5800_1` (recreated once between the desktop and the phone walk, dropped at the end), `npm run build` + `NODE_ENV=production node server/index.js` on port 5802, seeded with `npm run seed`, Chromium 1194 via Playwright, TZ=UTC, en-US, light scheme. Desktop 1280x900 (click) and mobile 390x844 isMobile+hasTouch (tap).
- Live log: `/var/tmp/sbpg/release-loop/cover-letter-agent/round-1/steps.jsonl` (the directory also holds stale files from earlier runs on other ports; mine are `v5802-*.png`). Screenshots: `/var/tmp/sbpg/release-loop/cover-letter-agent/round-1/v5802-<step>-<surface>.png`.
- Result: **FAIL** (38 of 46 scored steps passed)

## Score (from `release-spec-baseline.mjs score`, copied verbatim)

```json
{
  "feature": "cover-letter-agent",
  "baseline": 1,
  "specSha256": "7b770a0c75e5e8adc85ba1078589b9e402b2e1a81ec530c2ea35d178865fa880",
  "total": 46,
  "passed": 38,
  "failed": ["J1.1","J1.2","J8.4","E.3","E.4","E.5","E.6","E.7"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": ["MCP"]
}
```

("MCP" is the one platform-MCP failure line, id outside the baseline, reported below.)

## Test accounts and how the spec's setup was handled

- The spec's member (`casey.rowan@example.test`, created by API calls) cannot be used under the fixed constraints; `scripts/create-test-member.mjs` made `member@test.local` ("Test Member"). Every place the spec says "Casey Rowan" (letter name, PDF header, sign-off) therefore reads "Test Member". Treated as the harness substitution, not a failure.
- Preconditions P.1 to P.6 ran through the UI (login form, Classic Tools, Career Master jobs and tool, Track Opportunity) and all passed. They were redone after the database reset for the phone walk (only logged as `setup`).
- `northwind-resume.txt` was created with exactly the spec's content in the validator scratch directory and chosen through the file chooser.
- Server had no `ANTHROPIC_API_KEY` and the member no BYO key, so Journey 7 applied.

## Fix details from the handed-over bugs

| Bug | Maps to step | Verdict this round |
|---|---|---|
| wsn-r1-auto-cover-letter (auto-drafted letter on a new opportunity) | J2 2.3, J4 4.1, J9 9.1 of the navigation spec | In THIS spec the auto-draft is expected: J1.1 (desktop) passes, the draft is filed on tracking, and J1.5/J1.6 prove it turns off. The conflict is with the navigation spec, not here. |
| cover-letter-agent-B3 World Shell reachability | none (observation) | Still open. Observation O1 below. J1.1 phone also fails because the Classic Tools tab bar is hidden at 390px. |
| cover-letter-agent-B6 test account rule | none | Not applicable to the product; the spec still names a hand-built account (substituted, see above). |
| cover-letter-agent-B7 career-bound integration | J1.2 | Still open: the first-draft letter ignores the saved "key metrics" (J1.2 fails). With job rec text attached the metrics appear (J1.4 passes). |
| cover-letter-agent-B9 scope additions | none | Not observable from the baseline; panel is still inside Classic Tools / My Resume. |
| cover-letter-agent-B11 second cover-letter generator | none (observation) | Still open. Observation O1 below. |

## Per-step results (desktop D, mobile M)

| Step | D | M | What was seen |
|---|---|---|---|
| P.1 to P.6 | pass | n/a | Login lands on /world; Jobs (2), Tools (1); "Tracked Opportunities (1)". |
| J1.1 | pass | **fail** | D: row "Principal Value Architect — Northwind Freight · discovered", "No job rec text…" line, "Cover letter: Draft (#1)", both buttons. M: `MOBILE_GAP:` the Classic Tools tab bar (`.sb-admin-topbar-actions`) is `display:none` at 390px, so "click the My Resume tab" cannot be done. The same panel was reached through World Shell > Journeys > My Resume; the content then matches. |
| J1.2 | **fail** | **fail** | History row, Draft status and "Authors:" line are right. The letter reads "At Harbor Logistics I worked as Value Architect (2019 – present)." and "At Brightline Freight I worked as Revenue Operations Lead (2015 – 2019)." The spec expects "…as Value Architect (2019 – present), led a pricing redesign …" and "…, built renewal forecasting …". The saved Career Master key metrics are dropped when there is no job rec text. Screenshot `v5802-J1.2-letter-desktop.png`. |
| J1.3 | pass | pass | Toast and "Job rec text attached (183 characters)." exact. |
| J1.4 | pass | pass | Toast, Draft (#2), two versions in history; new opening "My background lines up with your need for pricing, renewal and forecasting." |
| J1.5 | pass | pass | Toast "Cover-letter settings saved."; Hide settings. |
| J1.6 | pass | pass | Second row, "Cover letter: none yet", Generate button (auto-draft off honoured). |
| J1.7 | pass | pass | "Cover letter drafted.", Draft (#3), history row present. |
| J2.1 | pass | pass | Toast and "Package: not built · includes the cover letter + 1 resume output". |
| J2.2 | pass | pass | Toast, "Package: Draft (#5)", history row "Application Package — … · application package". |
| J2.3 | pass | pass | 3-page PDF: header, CONTENTS with leader dots "1. Cover letter … 2", "2. Imported Resume — northwind-resume.txt … 3", "SECTION 1 / Cover letter", "SECTION 2 / …", "Page n of 3", four GoTo link annotations (`pypdf`). Name is "Test Member". |
| J2.4 | pass | pass | 2-page PDF with "1. Cover letter … 2". |
| J2.5 | pass | pass | Viewer shows CONTENTS list; tapping/clicking entry 2 scrolls to SECTION 2. |
| J2.6 | pass | pass | Browser confirm prompt shown; toast "Approved — private QR link created (copied to clipboard)."; `/r/<slug>` link under the row; link page shows Contents; package PDF page 1 has the QR at top right and the same contents. (On desktop the first approval's toast was missed by a harness slip, so the package was rebuilt and approved again to observe it; the slug stayed the same.) |
| J3.1 | pass | pass | Dialog title, "Version #N · Draft", ¶1 to ¶10, exact scope text. |
| J3.2 | pass | pass | Answered by rules + Awaiting your decision, exact message, LLM: not used, Evidence (4 matches), ¶2 and ¶4 tracked ("Hiring" struck, "Talent" underlined, 2 `changed` tags), Accept/Reject. |
| J3.3 | pass | pass | Toast "Accepted — saved as a new draft version (#7)…"; "talent team"; version line gains one entry. |
| J3.4 | pass | pass | Mention reply exact, inserted paragraph, Reject toast "Rejected — the letter is unchanged." |
| J4.1 to J4.5 | pass | pass | Stub provider saved; "Offline test stub edit — not a real model.", one changed paragraph (¶5) with appended insertion, "Replace ¶5."; Reject clears it; failure text "7 operations … (maximum 6)" with 2 attempts; session line "4 messages · 2 used a language model · … · 1 accepted, 2 rejected". |
| J5.1 to J5.5 | pass | pass | All four refusals verbatim with Refused/No change/"LLM: not used — request refused"; J5.5 "Answered from package search", 5 matches. |
| J6.1 | pass | pass | Technology dialog lists Ledgerly ERP; both toasts; "Version #7 · Approved"; Publish appears. |
| J6.2 | pass | pass | New "Version #8 · Draft"; "v3 #7 (approved) v4 #8 (draft) ← current"; approved version (via View in history) still says "talent team". Note: the full-screen dialog has to be closed before Resume Output History can be reached (the version labels in the dialog are plain text, not links). |
| J6.3 | pass | pass | Approved and new draft rows both listed. |
| J7.1 to J7.3 | pass | pass | Exact "No Anthropic API key is configured…" alert, tags Could not run + No change, "LLM: not used — not available (see message)", no LLM turn counted; rules still answer. |
| J8.1 to J8.3 | pass | pass | All settings fields present; bogus placeholder rejected with exact alert (400 on PUT, nothing saved); restore saves. |
| J8.4 | **fail** | **fail** | Formal replacements box contains `a lot of => substantial`. The reply to "Make it more formal" carries the message `The "Formal" tone preset found nothing to change in the letter. …` but the tag is **Answered from package search**, not **Answered by rules** as the spec requires for this request. |
| J9.1 | pass | pass | 390x844: dialog fills the screen, no horizontal scroll (docScrollW 390), header buttons on two rows, letter above chat, chips/box/Send reachable. The letter pane is only about 170px high (scrolls inside), see O3. |
| J9.2 | pass | pass | "Shorten paragraph 6" gives "…so I proposed no change." Accept/Reject of earlier proposals remain reachable. |
| E.1 | pass | pass | Tab B's older proposal: exact stale toast, letter unchanged; after refresh the reply is tagged "Superseded — the letter has a newer version" and has no buttons. |
| E.2 | pass | pass | Send disabled when empty and after clearing, enabled when typed. |
| E.3 | **fail** | **fail** | `UI_GAP:` opening a letter id that is not yours is only possible through the API; the interface offers the agent only on your own letters. Supplementary API check (not used to do the step): `GET /api/cover-letters/letters/987654` returns 404 `{"error":"Cover letter not found."}`. A real second member's letter was not tried. |
| E.4 | **fail** | **fail** | `UI_GAP:` the agent button exists only on cover-letter rows, so a resume id can't be sent from the interface. Server code (`coverLetterAgent.js:41`) carries the expected message; not exercised. |
| E.5 | **fail** | **fail** | A letter with no job rec text (Senior Pricing Analyst, resume added so the package has 2 outputs): the row says "No job rec text on this opportunity…", but the agent's scope text still reads "(2 outputs + job rec text)"; the spec expects "(2 outputs, no job rec text attached)". Screenshot `v5802-E.5-desktop.png`. |
| E.6 | **fail** | **fail** | `UI_GAP:` first half passes (a new opportunity with no letter: Build package with contents files a letter first, Draft (#12), and the package). The second half, the refusal "This package has no cover letter. Every application package must include one…", is only reachable through `POST /api/cover-letters/packages/assemble`; the interface always files a letter. |
| E.7 | **fail** | **fail** | `UI_GAP:` nothing in the interface can make the automatic draft fail, so the red "The automatic cover-letter draft failed…" alert could not be produced or seen. |

## Interface parity

- Desktop point-and-click: complete for J1 to J9 and E.1/E.2/E.5/E.6 (first half); no typed URLs or scripts were used for any step (API calls only as the supplementary evidence marked above).
- Phone (390px): every journey was walked with tap. Navigation difference: the Classic Tools tab bar is not available at 390px, so My Resume was reached through World Shell > Journeys > My Resume (`MOBILE_GAP` on J1.1). Career Placement Agents is the default Classic Tools panel on a phone.
- API routes seen from the UI: `/api/cover-letters/settings`, `/opportunities`, `/opportunities/:id/job-rec`, `/opportunities/:id/cover-letter`, `/opportunities/:id/package`, `/letters/:id`, `/letters/:id/turns`, `/turns/:id/accept`, `/turns/:id/reject`, `/api/resume-outputs/:id/status` and `/share`.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist at this commit. No MCP tool for: listing opportunities with letter/package state, saving job rec text, generating/regenerating a cover letter, building a package, adding a resume to a package, reading/saving cover-letter settings, opening a letter and its agent turns, sending a turn, accepting/rejecting a turn, approving a letter or package for QR.

## Console errors and failed requests (app origin, my runs only)

- No page errors.
- `net::ERR_CERT_AUTHORITY_INVALID` / `ERR_TUNNEL_CONNECTION_FAILED` console errors on /login and /world: external fonts and the CDN three.js script blocked by the sandbox (`external_blocked`, not failures).
- 8 `requestfailed ERR_ABORTED` on `/api/career-agents/resume-outputs/:id/download.pdf`: the browser cancelling the navigation when a download starts; the PDFs saved fine.
- 409 `PATCH /api/resume-outputs/:id/status` (twice, one per walk): the expected technology-category gate in J6.1.
- 400 `PUT /api/cover-letters/settings` (twice): the expected bogus-placeholder refusal in J8.2.

## Observations (outside the baseline, never scored)

- O1. World Shell reachability (bugs B3/B11): in World > Journeys > Career Placement Agents > an opportunity, the output section has its own "Generate Cover Letter for This Opportunity" and "Edit draft" (the shared document editor) but no "Edit with cover-letter agent", no "Build package with contents" and no cover-letter settings. Those live only in Journeys > My Resume / Classic Tools. Two cover-letter generators coexist.
- O2. The history row of an Approved letter says "Not yet approved" in its Authors line (that line refers to QR approval) while the status badge says Approved. Confusing wording.
- O3. At 390px the letter pane in the agent dialog is a ~170px scroll window, so tracked changes at ¶2/¶4 need an inner scroll; the Evidence list is collapsed by default and has to be tapped.
- O4. Classic Tools top bar at 1280px overlaps: the logo text sits under the "Back to World" button and the last tab/right buttons are clipped ("OUT… TEMPL…", "VISIT S… BASIN") (see `v5802-J1.2-letter-desktop.png`).
- O5. The spec step J6.2 says to open the approved version from Resume Output History while the full-screen dialog is open; the dialog must be closed first, which also makes the "Click Close" of J6.3 already done. Proposed amendment: move "Click **Close**" to the end of J6.2.
- O6. The version numbers (#2, #7, #8) are shared with every output id in the database, so they are not sequential per letter (not a defect).
- O7. E.3, E.4, E.6 (second half) and E.7 are unreachable from the website by design; if they are meant to be tested point-and-click the spec needs a way to get there (for example a second seeded member with a letter, and a way to make the automatic draft fail) or an amendment to test them through the API/MCP surface.

## Cleanup

Server (PID file) stopped, database `sb_rl_val_5800_1` dropped, no stray processes on port 5802. Nothing committed or pushed; product code, specs and baselines unchanged.
