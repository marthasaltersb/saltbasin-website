# Test result - resume-rollups - round 3

Score (from `scripts/release-spec-baseline.mjs score`):

```json
{"feature":"resume-rollups","baseline":2,"specSha256":"fd8842f5b44385300fd45e971bbdd792fd86a2db2ab68d56900872f3816a3662","total":32,"passed":30,"failed":["J12.1","E.4"],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":[]}
```

Baseline check: "baselines match: resume-rollups v2" (unchanged since round 2, so no diff table is needed; scores compare like for like with round 2: 30/32, same two failures).
Commit tested: integration head 47ee197 (claude/zealous-meitner-5tuft5). Fresh database sb_rl_val_7700_1 + seed per surface, built dist served by the production server on port 7702, Chromium, light, en-US, TZ=UTC, 1280x900 desktop and 390x844 touch mobile. Steps log: /var/tmp/sbpg/release-loop/resume-rollups/round-3/steps.jsonl (screenshots in the same folder). Run as member@test.local through the World Shell (Journeys > Career Master), by login form and clicks/taps only. P.1: terms screen does not appear because scripts/create-test-member.mjs pre-accepts terms (fixed constraint); the top bar World / Journeys / Classic Tools was seen. The P rows are also logged once as surface "setup" (both surfaces passed).

## Failures
- **J12.1** (desktop UI_GAP, mobile MOBILE_GAP). The only UI route (My Resume > Preview PDF > Modern SB > full tab) opens `/output/resume?layout=modern` with no `owner=me`; the page shows the platform owner's resume (BETSY SALTER, every tile an em-dash with a reason), not the signed-in member's. Fix RR1-3 is NOT present at this head: `src/lib/resumeUrls.js` contains no `owner` handling. Evidence: desktop-J12_1-output-full.png, desktop-J12-output-text.txt, desktop-J12-output-url.txt, and the mobile equivalents. Observation only (typed URL, not used for the verdict): `?layout=modern&owner=me` shows every J12.1 expectation (tiles ARR AUTOMATED, EXIT SIGNAL $250M, ENGAGEMENTS 1, INDUSTRIES 2, YEARS IN OPERATIONS 8, CERTIFIED PARTNERS 5†, EXPERT SKILLS 2†, TOTAL SKILL YEARS 21, no EMPLOYERS, both footnotes, Strategy & Advisory `0 Expert · 2 skills`, Care delivery / Clinical operations / 4 yrs, none of the old figures): `*-J12-OBS-owner-me-output-text.txt`.
- **E.4** (desktop and mobile). Unexpected console/network error `404 GET /api/output-templates/preset-default/public`, raised when the output opens (synthetic `preset-default` id). Fix RR1-4 is NOT present at this head. Evidence: desktop-E_4.png, mobile-E_4.png, `http404` rows in steps.jsonl. All other noise was expected (400 on rollups preview in J11, forced 500 in E.2, certificate/CDN errors for external hosts).

## Status of the handed-over fixes, by baseline step
- B3 / J7.3: passes (`he` added, still `4 yrs`, chip removable). Verified, desktop and mobile.
- B5 / RR1-6 / B11 (site-editor block picker, output column count): no baseline step. Not tested (observation).
- B8 / P.1-P.3 and all journeys: run as member@test.local in the World Shell; all pass. The step text "admin test user" is still unamended (see proposed amendment).
- B10 / J1.2, J10.2, J12.1: J1.2 and J10.2 pass. In the owner=me output Strategy & Advisory still shows `0 Expert · 2 skills` although Stakeholder alignment is hand-set to Expert (matches the spec text; business rule pending with the owner).
- B12 / J7, J8: pass as written.
- B13 / E.1, E.2, E.3: pass. E.1 (confirm "Remove “Care delivery”?", last row refused with red toast); E.2 (forced 500 via browser request interception: amber alert with Retry, output shows "Resume rollups could not be loaded", Retry recovers); E.3 (Career Master emptied through the UI, every computed tile an em-dash with a reason).
- RR1-1 (mobile card footer wrap): passes at 390px.
- RR1-2 / J9.5: passes as a UI reload check, desktop and mobile.
- RR1-3 (owner=me on My Resume links): NOT fixed - J12.1 fails.
- RR1-4 (404 preset-default/public): NOT fixed - E.4 fails.
- F1-2 / RR1-5 / MCP_GAP (rollup tools): fixed. With a token from World Shell > Journeys > Connected Agents (career.read, career.write) the MCP endpoint listed 94 tools. `resume_rollups_read`, `career_atom_rollups_read`, `career_experience_definitions_read`, `proficiency_rules_read` and `career_rollups_read` return exactly what the API routes return; invalid `resume_rollup_preview` returns isError `400 bad_request` with the same message as the API; `career_rollup_preview_read` with an unknown key returns `404` on both. No MCP_GAP for rollups.
- RR2-4 (Career Master record create/update/delete MCP tool): `career_record_list`, `career_record_create`, `career_record_update`, `career_record_delete` are now registered (listed; calls not exercised this round).
- RR2-2 / E.3 passes; F1-3 has no baseline step, not tested.

## Proposed amendments (not applied)
1. P.1: "admin test user" -> "member test user" (member@test.local); the screen exists only for members.
2. J12.1: state that the output is reached through My Resume and opens the signed-in member's data (depends on fix RR1-3), or give the exact owner parameter.

## Observations (not scored)
- Mobile output header "SALTBASIN.NET - RESUME - MODERN" is cut by the Print button (mobile-J12_1-output-view.png).
- No page errors. External font/CDN requests blocked by the sandbox were logged as external_blocked.
- Cleanup: server process killed, database sb_rl_val_7700_1 dropped.
