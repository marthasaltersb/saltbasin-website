# Test result — Cover letter per opportunity, package table of contents, confined cover-letter agent (round 2)

- Feature: Cover letter per opportunity, package table of contents, confined cover-letter agent
- Training spec: `docs/training/cover-letter-agent.md`, frozen as baseline **v2** (amendment A1), sha256 `2eec191d69f2d64075b93902666356c0cfdabd8f509a0c3dc008ffb6130e4b5a`. `release-spec-baseline.mjs check` passed ("baselines match: cover-letter-agent v2").
- Round: 2 (validator `val-5800-1`)
- Commit tested: `0800b1c18ce1b2f1003085d0010f95a36fe75932` (integration branch `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-10
- Environment: fresh database `sb_rl_val_5800_1` per walk (recreated between the desktop and the phone walk, dropped at the end), `npm run build` + `NODE_ENV=production node server/index.js` on port 5802, seeded with `npm run seed`, Chromium 1194 via Playwright, TZ=UTC, en-US, light scheme. Desktop 1280x900 (click), phone 390x844 isMobile+hasTouch (tap). No `ANTHROPIC_API_KEY`.
- Live log: `/var/tmp/sbpg/release-loop/cover-letter-agent/round-2/steps.jsonl`. Screenshots: `/var/tmp/sbpg/release-loop/cover-letter-agent/round-2/<step>-<surface>.png`. Earlier harness attempts that were discarded (script defects, not product) are in `round-2-attempt0`, `round-2-attempt1` and `round-2-stale-attempt` next to it; none counts toward this score.
- Result: **FAIL** (45 of 48 scored steps passed; failing ids J1.1 (phone only), J2.6 (both), J10.1 (both))

## Score (from `release-spec-baseline.mjs score`, copied verbatim)

```json
{
  "feature": "cover-letter-agent",
  "baseline": 2,
  "specSha256": "2eec191d69f2d64075b93902666356c0cfdabd8f509a0c3dc008ffb6130e4b5a",
  "total": 48,
  "passed": 45,
  "failed": ["J1.1", "J2.6", "J10.1"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": ["(ids outside the baseline: J6.2-pre, E.7-setup and the MCP.* parity checks listed below; never scored)"]
}
```

## Baseline diff (v1 -> v2, A1) so the scores read like for like

`release-spec-baseline.mjs diff`: 48 comparable, **same** 48 ids (all v1 ids kept), **changed** E.3, E.4, E.6, E.7 (API/MCP-only branches moved to `cli` steps or given a harness fixture), **added** J10.1 (World Shell reachability) and E.8 (cli), **retired** none. Round 1 was 38 of 46 on v1; round 2 is 45 of 48 on v2. Compare only within one version: the two added steps (J10.1, E.8) and the four changed ones are new ground; J10.1 fails, E.8 and the changed E steps pass.

## Test accounts and spec setup

- The spec's member `casey.rowan@example.test` is hand-built; under the fixed constraints `scripts/create-test-member.mjs` made `member@test.local` ("Test Member"). Every "Casey Rowan" in the spec (letter name, PDF header, sign-off) therefore reads "Test Member" (harness substitution, not a failure; amendment A1 left P.1 as written).
- P.1 to P.6 were done through the UI (login form, Classic Tools, Career Master jobs/tool, Track Opportunity) and all passed on the desktop walk; for the phone walk the same setup was repeated after the database reset and P.1 was repeated with a phone login.
- `northwind-resume.txt` has exactly the spec's content and was chosen through the file chooser.
- E.3 fixture: `create-test-member.mjs --email second@test.local --name 'Second Member'` (allowed setup script); the second member logged in through the form and tracked "Operations Analyst — Tailspin Freight" in the UI (auto-draft on) which filed the letter. E.7 fixture: the spec's exact `psql` insert after tracking Data Steward / Contoso Rail through the UI.

## Per-step results (D = desktop, M = phone)

| Step | D | M | What was seen |
|---|---|---|---|
| P.1 to P.6 | pass | pass (setup) | Login lands on /world; Jobs (2), Tools (1), "Tracked Opportunities (1)". |
| J1.1 | pass | **fail** | D: My Resume tab, section "Cover letters and application packages", row "Principal Value Architect — Northwind Freight · discovered", the no-job-rec line, "Cover letter: Draft (#1)", both buttons. M: `MOBILE_GAP:` at 390px Classic Tools shows only "Back to World" and "+ Track Opportunity"; the "My Resume" button exists in the DOM with width 0 / height 0 (its parent tab bar is hidden), so "click the My Resume tab" cannot be done. The same panel was reached by World Shell > Journeys > My Resume and its content matched. Screenshots `J1.1-classic-tools-mobile.png`, `J1.1-mobile.png`. Same as open bugs T1 / cover-letter-agent-F1-5 (brand.css hides `.sb-admin-topbar-actions`): NOT fixed. |
| J1.2 | pass | pass | History row "Cover Letter — … · cover letter", Draft, "Authors: Test Member"; letter reads "At Harbor Logistics as Value Architect (2019 – present), led a pricing redesign that raised contract margin by 4 points." and "At Brightline Freight as Revenue Operations Lead (2015 – 2019), built renewal forecasting that cut churn surprises by 30 percent." Fix T2 / B7 for the metrics template is verified. |
| J1.3 | pass | pass | Toast and "Job rec text attached (183 characters)." exact. |
| J1.4 | pass | pass | Toast, Draft (#2), two versions in history, opening "My background lines up with your need for pricing, renewal and forecasting." |
| J1.5 | pass | pass | Toast "Cover-letter settings saved."; Hide settings. |
| J1.6 | pass | pass | Second row, "Cover letter: none yet", Generate button. |
| J1.7 | pass | pass | Toast "Cover letter drafted." (captured by a DOM observer), Draft (#3), history row. |
| J2.1 to J2.5 | pass | pass | Toasts and row lines exact; 3-page PDF with CONTENTS (`1. Cover letter … 2`, `2. Imported Resume — northwind-resume.txt … 3`), SECTION 1/2 pages, "Page n of 3", 4 link annotations (pypdf); Fabrikam package 2 pages; viewer Contents list scrolls to its section. |
| J2.6 | **fail** | **fail** | Everything else holds (browser confirm prompt, `/r/<slug>` link under the row, share page shows the Contents list, package PDF page 1 has the QR and the same table of contents), but the toast reads "Approved - private QR link created (copied to clipboard)." with a **hyphen**; the spec requires "Approved — private QR link created (copied to clipboard)." with an **em dash**. Cause: `MyResumePanel.jsx:656` (a fix round of another feature, commit 73505f4 "hyphen in Approve-for-QR toast", changed it). This is a cross-feature conflict between two specs; this step is scored literally. Proposed amendment (not edited): change the spec text to the hyphen if the other feature's wording is the owner's intent. |
| J3.1 | pass | pass | Dialog title, "Version #N · Draft", ¶1 to ¶10, exact scope text. |
| J3.2 | pass | pass | Answered by rules + Awaiting your decision, exact message, LLM: not used, Evidence list opened with ¶4 "Dear Northwind Freight hiring team,", ¶2/¶4 tracked ("Hiring" struck, "Talent" underlined, 2 `changed` tags), Accept/Reject. (An earlier discarded harness attempt failed this only because the collapsed Evidence list was read before it was opened; re-run with an open-state check, clean on both surfaces.) |
| J3.3, J3.4 | pass | pass | Accepted toast "(#7)… The earlier version is unchanged."; Versions line gains one entry; Kubernetes insertion and Reject toast exact. |
| J4.1 to J4.5 | pass | pass | Stub provider saved; "Offline test stub edit — not a real model.", ¶5 changed; Reject clears; "7 operations … (maximum 6)" after 2 attempts; session line "4 messages · 2 used a language model · 387 tokens in / 297 out · 1 accepted, 2 rejected". |
| J5.1 to J5.5 | pass | pass | All four refusals verbatim with Refused / No change / "LLM: not used — request refused"; J5.5 "Answered from package search", 5 matches. |
| J6.1 | pass | pass | Technology dialog lists Ledgerly ERP; toasts "Saved to Career Master: 1 technology categorised" and "Approved." both captured; "Version #7 · Approved"; Publish appears. |
| J6.2, J6.3 | pass | pass | New "Version #8 · Draft"; "v3 #7 (approved) v4 #8 (draft) ← current"; approved version still says "talent team"; both versions listed. |
| J7.1 to J7.3 | pass | pass | Exact "No Anthropic API key is configured…" alert, Could not run + No change, "LLM: not used — not available (see message)", no LLM turn counted; rules still answer. |
| J8.1 to J8.3 | pass | pass | All settings fields and Tone presets; bogus placeholder refused with the exact alert (400 on PUT, nothing saved); restore saves. |
| J8.4 | pass | pass | Formal replacements contain `a lot of => substantial`; "Make it more formal" is now tagged **Answered by rules** with the exact "found nothing to change" message and LLM: not used. Fix T3 verified (round 1 failed this). |
| J9.1, J9.2 | pass | pass | 390x844: dialog fills the screen, no horizontal scroll (docScrollW 390), header buttons on two rows, letter above chat, chips/box/Send reachable; "Shorten paragraph 6" gives "…so I proposed no change." with earlier Accept/Reject reachable. |
| J10.1 | **fail** | **fail** | `UI_GAP:` / `MOBILE_GAP:` World Shell > Journeys > Career Placement Agents > Principal Value Architect > APPLICATION OUTPUTS shows the cover letter with only "Open my Career Master", "Edit draft", "Approve for QR", "Unlink" (plus Generate/Import buttons below). There is no "Edit with cover-letter agent" and no "Build package with contents" anywhere on that screen, so the dialog cannot be opened from the World Shell. Phone: same, no horizontal scroll (390/390). Screenshots `J10.1-desktop.png`, `J10.1-mobile.png`. Open bugs B3, B11, F1-6, T9: NOT fixed. |
| E.1 | pass | pass | Tab B's older proposal: exact stale toast, letter unchanged; after refresh the reply is tagged "Superseded — the letter has a newer version" with no buttons. |
| E.2 | pass | pass | Send disabled when empty and when cleared, enabled when typed. |
| E.3 | pass (cli) | | `curl -b <Test Member cookie> /api/cover-letters/letters/15` (Second Member's letter): HTTP 404 `{"error":"Cover letter not found."}`; MCP `cover_letter_open` returns "Error 404 not_found: Cover letter not found." |
| E.4 | pass (cli) | | Own imported resume id: HTTP 400 `{"error":"The cover-letter agent only works on cover letters. This output is a resume."}`; MCP same message. |
| E.5 | pass | pass | Row says "No job rec text on this opportunity…"; agent scope now reads "I search only this package (2 outputs, no job rec text attached)". Fix T4 verified. |
| E.6 | pass | pass | A new opportunity with no letter: Build package with contents files a letter first (Draft #N) and the package; toast "Package built with a table of contents." |
| E.7 | pass | pass | After the spec's psql fixture: red "The automatic cover-letter draft failed (10/10/2026, …): test failure", "Cover letter: none yet", Generate button; click gives "Cover letter drafted.", "Cover letter: Draft (#14)" and the alert is gone. |
| E.8 | pass (cli) | | `POST /api/cover-letters/packages/assemble {"packageKey":"no-such-package"}`: HTTP 400 with "This package has no cover letter. Every application package must include one — create it from the opportunity first."; MCP `cover_letter_package_build` returns the same text. |

## Fixes handed over, by baseline step id

| Open bug | Maps to | Now |
|---|---|---|
| T2 (key metrics in first-draft letter; B7/F1-8 career-bound) | J1.2 | **Verified fixed** (desktop and phone). |
| T3 ("Make it more formal" tag) | J8.4 | **Verified fixed.** |
| T4 (no job rec text scope) | E.5 | **Verified fixed.** |
| T8 / F1-2 (MCP tools exist) | MCP parity | **Verified**: tools exist and match the UI; see below. Two documented exclusions remain. |
| T1 / F1-5 (phone My Resume tab hidden) | J1.1 (phone) | **Still failing.** |
| B3, B11, F1-6, T9 (World Shell entry points) | J10.1 | **Still failing.** |
| F1-1 (J1.2, J8.4, E.5 not driven) | J1.2, J8.4, E.5 | Driven through the UI this round; all pass. |
| T5, T6, T7 / F1-7 (E.3/E.4/E.6/E.7 UI) | E.3, E.4, E.6, E.7, E.8 | Now cli steps / fixtures; all pass. |
| F1-9 (chart blocks in packages) | none | Not covered by any baseline step; not observed. |
| F1-10 (428 handling) | none | Test accounts have terms accepted; not exercised. |
| F1-11 (real provider) | J4 | No API key; stub provider used as the spec says. |
| F1-12 (O2 "Not yet approved" wording on an Approved row, O3 170px letter pane at 390px, O4 1280px top bar overlap, O5 J6.2 ordering) | none | **All four still present**, see observations. |
| B6, B9 | none | Spec/process items; nothing to test in the browser. |
| wsn-r1-auto-cover-letter | none here | The auto-draft is expected by this spec (J1.1 passes). |

## Interface parity

- Desktop: every journey walked point-and-click; no typed URLs, scripts or database edits stood in for a step. The only non-UI actions are the spec's own fixtures (E.3 second member via `create-test-member.mjs`, E.7 psql insert) and the cli steps E.3/E.4/E.8, which are cli by design.
- Phone (390px): every journey walked with tap. Failures: `MOBILE_GAP` J1.1 (My Resume tab unreachable in Classic Tools), `MOBILE_GAP` J10.1.
- API routes seen from the UI: `/api/cover-letters/settings`, `/opportunities`, `/opportunities/:id/job-rec`, `/opportunities/:id/cover-letter`, `/opportunities/:id/package`, `/letters/:id`, `/letters/:id/turns`, `/turns/:id/accept`, `/turns/:id/reject`, `/api/resume-outputs/:id/status` and `/share`, `/api/career-agents/resume-outputs/:id/download.pdf`.
- MCP (platform MCP exists at this commit; token created through World Shell > Journeys > Connected Agents with scopes career.read, career.write, outputs.approve; same user): `cover_letter_opportunities_list` returned the same 4 rows as My Resume; `cover_letter_settings_read` (autoDraft false, provider anthropic) matches the saved settings; `cover_letter_open` returns the letter with the agent context; `cover_letter_agent_turn` gave the same text as the UI for "Rewrite my resume summary" (refusal), "Where do I mention pricing?" ("Here is what the package says (5 matches, best first)…") and a rules edit ('Replaced "recruiting team" with "hiring team" in 2 paragraphs (exact text match).'); `cover_letter_turns_list` returned the turns; `career_opportunity_create`, `cover_letter_job_rec_save` (171 chars), `cover_letter_generate`, `cover_letter_package_build` and `cover_letter_packages_list` all worked and filed the same kinds of rows. (Two non-baseline log lines "J3.2-variant" and the first "rules-edit" are marked fail only because my test request named text the letter no longer contained at that point; the tool correctly answered "I couldn't find …", and the corrected request passed.)
- **MCP_GAP: no MCP tool for two capabilities the spec exercises**: accepting or rejecting a proposal (J3.3, J3.4, J4.3, J6.2) and adding a resume file to a package (J2.1). `server/lib/capabilityParity.js` records both as deliberate exclusions ("Applying a proposal is a human decision made in the website, by design"; "File upload; an agent saves content with application_output_new_draft_version"). Reported for the owner/triage to confirm the exclusions satisfy interface parity; the package PDF download, Approve-for-QR and letter status approve have tools (`career_output_view`, `application_output_approve_for_qr`, `resume_output_status_set`) and were not separately exercised through MCP.

## Console errors and failed requests (app origin)

- No page errors on either walk.
- `net::ERR_CERT_AUTHORITY_INVALID` / `ERR_TUNNEL_CONNECTION_FAILED` console errors and blocked `fonts.googleapis.com`: sandbox blocks external fonts (`external_blocked`, not failures).
- `requestfailed ERR_ABORTED` on `/api/career-agents/resume-outputs/:id/download.pdf` (4): the browser cancelling the navigation when a download starts; the PDFs saved fine.
- 409 `PATCH /api/resume-outputs/:id/status` per walk: the expected technology-category gate in J6.1.
- 400 `PUT /api/cover-letters/settings` per walk: the expected bogus-placeholder refusal in J8.2.

## Observations (outside the baseline, never scored)

- O1. World Shell reachability: see J10.1. In addition, the World Shell opportunity view has no cover-letter settings entry, and two cover-letter generators coexist ("Generate Cover Letter for This Opportunity" there vs "Generate for this opportunity" in My Resume).
- O2. Still present: the history row of an Approved letter says "Not yet approved" in its Authors line while the status badge says Approved (`J6.3-history-desktop.png`).
- O3. Still present: at 390px the letter pane in the agent dialog is a ~170px scroll window (`J3.2-mobile.png`).
- O4. Still present: Classic Tools top bar at 1280px overlaps; the logo text sits under the "Back to World" button and the last tabs/buttons are clipped ("OUT… TEMPL…", "VISIT S… BASIN").
- O5. Still present: J6.2 says to open the approved version from Resume Output History while the full-screen dialog is open; the dialog must be closed first (proposed amendment: move "Click Close" to the end of J6.2).
- O6. New: on the phone My Resume screen (`J1.1-mobile.png`) the "Import an application package" card above the cover-letter section is rendered light-grey on a light card and is practically unreadable (washed-out heading and text) against the dark page.
- O7. J2.6 wording conflict between this spec (em dash) and the product (hyphen, per another feature's fix round); see J2.6.
- O8. Version numbers (#2, #7, #8) are shared with every output id in the database, so they are not sequential per letter (not a defect).

## Cleanup

Server stopped by PID file, database `sb_rl_val_5800_1` dropped, credential files removed, nothing listening on 5802. Nothing committed or pushed; product code, specs and baselines unchanged.
