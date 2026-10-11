# Test result - resume-rollups - round 5

Score (from `scripts/release-spec-baseline.mjs score`):

```json
{"feature":"resume-rollups","baseline":3,"specSha256":"f183054e731c06bffc5090e86646081271d3117d941ba7d9f7bdc67b038f1296","total":32,"passed":32,"failed":[],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":[]}
```

Baseline check: "baselines match: resume-rollups v3". The baseline moved from v2 (round 4) to v3 (amendment A4). `diff` table: 34 comparable; same = P.1-P.3, J1.1-J12.1 (all), E.1, E.2, E.4; changed = E.3 (wording now says a manual tile keeps the member's own value with the dagger mark); added none; retired none. Rounds 2-4 scores (30/32) and this 32/32 compare like for like on every step except E.3.

Commit tested: integration head 70535bf (claude/zealous-meitner-5tuft5). Production build served by `node server/index.js` on port 15402, fresh database sb_rl_val_15400_1 + `npm run seed` + `scripts/create-test-member.mjs` per surface (database dropped and recreated between the desktop and the phone pass because the journeys build on each other and E.3 is destructive). Chromium, light, en-US, TZ=UTC, 1280x900 desktop and 390x844 isMobile+hasTouch phone. Run as member@test.local through the World Shell by login form and clicks/taps only (the only reload is J9.5's). P.1: the terms screen does not appear because `create-test-member.mjs` pre-accepts terms (fixed constraint); the top bar World / Journeys / Classic Tools was seen. P rows also logged once as surface "setup".
Steps log: /var/tmp/sbpg/release-loop/resume-rollups/round-5/steps.jsonl (last result per id and surface; raw log steps.raw.jsonl also holds lines from an earlier aborted round-5 attempt at 2026-10-10 21:37-21:44 on a different port, which were excluded). Screenshots in the same folder.

## Failures
None. 32/32 baseline steps pass on every required surface.

Notes on how two steps were judged:
- J4.1 (desktop and mobile): the "At or above level" selector lists Exposure, Foundational, Proficient, Advanced, Expert but also a leading placeholder "Choose a level…". Judged a pass (five levels listed in order, computed line correct). Same wording point as open bug F4-8; a reviewer may want to amend the text.
- E.2 failure is forced by browser request interception (GET /api/career/resume-rollups returns 500), not by a typed URL or API call.

## Status of the handed-over fixes, by baseline step
- F4-4 / F3-7 / J12.1 mobile (1px overflow, header wrap): FIXED. Output page scrollWidth 390 = clientWidth 390; header wraps and is not cut by the Print button; Executive Summary tiles lay out in 2 readable columns at 390px (mobile-J12_1-output-top.png, mobile-J12_1-output-full.png). J12.1 passes on desktop (5-column grid wrapping to a second row) and mobile.
- B11 / RR1-6 column count: fixed as above.
- F4-6 / RR2-2 / E.3: passes on both surfaces under the v3 wording: with all skills, jobs and engagements deleted through Manual Intake every Career-Master-computed tile shows `—` with a reason, the manual tile Certified partners shows `5†`, Capability Confidence says "No capability groups contain skills yet.", Industry Experience says "No industry bucket matches a role or engagement yet." Verified.
- B3 / J7.3: passes both surfaces. Verified.
- B8 / P.1-P.3 and all journeys: run as member@test.local in the World Shell on both surfaces. P.1 text still says "admin test user" (wording, F3-6 / F4-8).
- B10 / F3-5 / F4-7 / B12 (capability bars / Expert count): J1.2, J10.2, J12.1 pass as written. The output still shows Strategy & Advisory `0 Expert · 2 skills` although Stakeholder alignment is hand-set to Expert, which is what the spec says; the business rule is still with the owner.
- B13 / E.1-E.4: all pass on both surfaces. E.1: "Remove “Care delivery”?" removes on confirm; with one Career Atom grouping left Remove is refused with a red toast (untick Shown instead). E.2: amber alert with Retry, Retry recovers, output shows "Resume rollups could not be loaded… not missing Career Master data". E.4: only expected noise (400 on rollups preview for an empty-keyword bucket, forced 500s in E.2, sandbox-blocked cdnjs request).
- RR1-2 / J9.5: passes as a UI reload check (both surfaces).
- F1-2 / RR2-4 / MCP_GAP: no gap found. A token created in World Shell > Journeys > Connected Agents (career.read, career.write) gave 124 tools including `resume_rollups_read`, `resume_rollup_preview`, `career_atom_rollups_read`, `career_experience_definitions_read/save/delete`, `career_proficiency_override_save/clear`, `proficiency_rules_read`, `career_rollups_read`, `career_rollup_preview_read`, `career_record_list/create/update/delete`. On both surfaces `resume_rollups_read` matched the UI tiles (Years in operations 8, Certified partners 5 user-defined, Expert skills 2 user-defined, Total skill years 21), `career_atom_rollups_read` / `career_experience_definitions_read` returned the single "Skills by proficiency" grouping left after E.1, `resume_rollup_preview` with an empty-keyword bucket returned an isError 400 like the API, `career_record_create` returned `{"id":5}` and `career_record_delete` `{"ok":true}`.
- B5 / RR1-6 / F4-5 / F3-4 (site editor Career Rollup block picker): no baseline step; not browser-tested. Needs an approved amendment.
- F1-3, F3-6, F4-8, RR1-2 (typed API URL wording): spec wording / amendment decisions for a reviewer, not code.

## Observations (not scored)
- Mobile "Levels and why" table: "Level shown" (`Expert †`) is visible only after swiping sideways.
- Connected Agents shows MCP address `http://localhost:5173/mcp` regardless of real origin; `/mcp` worked on the served origin.
- Adding an industry bucket raises a 400 on the rollups preview immediately (also in J7.1); expected by design.
- Career Master dialog labels are not bound to their inputs.
- Output footer for a member's resume still says "Authored by Betsy Salter · Co-Authored with Claude (Anthropic AI)" and "Edit this in your admin dashboard" (pre-existing).
- First mobile E.1/E.2 attempts ran on the wrong screen because of driver navigation; re-run correctly after confirming no data changed.
- Cleanup: server and drivers killed, database sb_rl_val_15400_1 dropped.
