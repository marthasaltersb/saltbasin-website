# Test result - resume-rollups - round 2

Score (from `scripts/release-spec-baseline.mjs score`): baseline v2, spec sha256 fd8842f5b44385300fd45e971bbdd792fd86a2db2ab68d56900872f3816a3662, total 32, passed 30, failed J12.1 and E.4, notRun none, blocked none.
Baseline check: "baselines match: resume-rollups v2". The baseline did not change since round 1's pin of v2 as given in the task (A1 amendment; diff v1 to v2 lists P/J/E ids as "same" - 34 comparable).

Commit tested: integration head 0800b1c (claude/zealous-meitner-5tuft5). Fresh database sb_rl_val_5600_1 + seed, Chromium, light, en-US, TZ=UTC, 1280x900 (desktop) and 390x844 touch (mobile). Steps log: /var/tmp/sbpg/release-loop/resume-rollups/round-2/steps.jsonl. Screenshots in the same folder.

Run as member@test.local through the World Shell (Journeys > Career Master; Classic Tools is not used). Desktop and mobile each ran on a fresh database. P.1: the terms screen does not appear because scripts/create-test-member.mjs pre-accepts terms (fixed constraint); the top bar World / Journeys / Classic Tools was seen.

## Failures
- J12.1 (desktop UI_GAP, mobile MOBILE_GAP): the only UI route to the output (My Resume > Preview PDF > Modern SB > full tab) opens /output/resume?layout=modern, which renders the platform owner's resume (BETSY SALTER, all tiles em-dash). The member's own output needs `&owner=me`. As an observation only (typed URL, not used for the verdict) `?layout=modern&owner=me` showed every expectation of J12.1: tiles ARR AUTOMATED, EXIT SIGNAL $250M, ENGAGEMENTS 1, INDUSTRIES 2, YEARS IN OPERATIONS 8, CERTIFIED PARTNERS 5+dagger, EXPERT SKILLS 2+dagger, TOTAL SKILL YEARS 21, no EMPLOYERS, both footnotes, Strategy & Advisory 0 Expert - 2 skills, Care delivery / Clinical operations / 4 yrs, none of the old figures (files `*-J12-OBS-owner-me-output-text.txt`). Screenshots desktop-J12_1*.png, mobile-J12_1*.png.
- E.4 (mobile only): unexpected console error `404 GET /api/output-templates/preset-default/public` while opening the output on the phone walkthrough (desktop run: only expected noise). Evidence mobile-E_4.png and steps.jsonl.

## Fixes handed over, by baseline step
- B8 (member vs admin): P.1-P.3 and every journey passed as member@test.local in the World Shell. Verified. (P.1 text says "admin test user"; the admin cannot reach Proficiency & Rollups through the UI: World Shell > Career Master for betsy@test.local shows no Proficiency & Rollups card, Classic Tools opens the admin shell. Evidence in round-2-admin-attempt. See amendment proposal.)
- B3 / J7.3 (exact match): passes - `he` added, still 4 yrs, chip removable.
- B5 / RR1-6 / B11: no baseline step (site editor block picker, output column count). Not tested; observation.
- B10 / J1.2, J10.2, J12.1: J1.2 and J10.2 pass. In the owner=me output Strategy & Advisory shows `0 Expert - 2 skills` even though Stakeholder alignment was hand-set to Expert (this matches the spec text; the question whether bars should count the hand-set tier is a business rule for the owner).
- B12 / J7, J8: pass as written.
- B13 / E.1-E.3: E.1 pass (confirm "Remove “Care delivery”?", last row refused with red toast), E.2 pass (forced 500 by browser request interception, amber alert with Retry, output shows "Resume rollups could not be loaded", Retry recovers), E.3 pass (Career Master emptied through the UI, every tile em-dash with a reason).
- RR1-1 (mobile card footer): fixed. Footer row wraps at 390px (mobile-J3_1.png, mobile-J1_1.png), no clipping.
- RR1-2 / J9.5: the step passes as a UI reload check (Skills by proficiency present with computed line, Tools by wheel bucket Shown unticked), desktop and mobile. The API URL part of RR1-2 is not a tester step.
- F1-2 / RR1-5 (MCP): fixed. With a token created in World Shell > Journeys > Connected Agents (career.read, career.write) the MCP endpoint returned 94 tools including resume_rollups_read, resume_rollup_preview, career_atom_rollups_read, career_experience_definitions_read, proficiency_rules_read, career_rollups_read, career_rollup_preview_read. Results equal the API routes byte for byte for rollups (with atom), atom-rollups, experience-definitions, proficiency and legacy rollups; invalid preview returns isError with 400 bad_request and the same message as the API; legacy rollup-preview with an unknown key returns 404 on both. No MCP_GAP.
- F1-3: not tested (no baseline step).

## Observations (not scored)
- Spec P.1 says "admin test user"; run as member (see above). Proposed amendment: name member@test.local, and for J12.1 state that the output is reached through My Resume and that the member's own data needs an owner parameter, or fix the UI route so the member's own resume opens (UI_GAP).
- Mobile output header: "SALTBASIN.NET - RESUME - MODERN" is cut by the Print button (mobile-J12_1-output-view.png).
- Desktop screenshots desktop-E_3.png and desktop-E_4.png were overwritten by a stray concurrent attempt (the discarded admin attempt); their rows in steps.jsonl are from the real run. Stray rows moved to round-2-admin-attempt/.
- Console noise seen and expected: 400 on rollups preview in J11, 500 forced in E.2, certificate errors for fonts.
