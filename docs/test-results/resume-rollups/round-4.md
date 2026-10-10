# Test result - resume-rollups - round 4

Score (from `scripts/release-spec-baseline.mjs score`):

```json
{"feature":"resume-rollups","baseline":2,"specSha256":"fd8842f5b44385300fd45e971bbdd792fd86a2db2ab68d56900872f3816a3662","total":32,"passed":30,"failed":["J12.1","E.3"],"blocked":[],"notRun":[],"preconditionsFailed":[],"observations":[]}
```

Baseline check: "baselines match: resume-rollups v2" (unchanged since round 2, so no diff table; 30/32 compares like for like with rounds 2 and 3, but the two failures are different: J12.1 now fails on mobile only, E.3 is new, E.4 now passes).
Commit tested: integration head 79ca5ac (claude/zealous-meitner-5tuft5). Fresh database sb_rl_val_5600_1 + seed per surface (the database was dropped and recreated, with a new seed and new test member, between the desktop and phone passes because the journeys build on each other and E.1/E.3 are destructive). Built dist served by the production server on port 5602, Chromium, light, en-US, TZ=UTC, 1280x900 desktop and 390x844 isMobile+hasTouch phone. Run as member@test.local through the World Shell (Journeys > Career Master / My Resume), by login form and clicks/taps only (no typed URLs; the one browser reload is J9.5's reload). P.1: the terms screen does not appear because `scripts/create-test-member.mjs` pre-accepts terms (fixed constraint); the top bar World / Journeys / Classic Tools was seen. P rows also logged once as surface "setup" (both surfaces passed).
Steps log: /var/tmp/sbpg/release-loop/resume-rollups/round-4/steps.jsonl (de-duplicated, last result per id and surface; raw log in steps.raw.jsonl; screenshots in the same folder). Two early lines were my own driver mistakes (J1.1 key-prefix compare, J4.1 over-strict option list) and were re-logged; the product behaviour was never at fault there.

## Failures
- **J12.1 (mobile only, MOBILE_GAP).** Every text expectation is met at 390px (tile order ARR AUTOMATED, EXIT SIGNAL $250M, ENGAGEMENTS 1, INDUSTRIES 2, YEARS IN OPERATIONS 8, CERTIFIED PARTNERS 5†, EXPERT SKILLS 2†, TOTAL SKILL YEARS 21; no EMPLOYERS; both footnotes; Strategy & Advisory `0 Expert · 2 skills`; Care delivery / Clinical operations / 4 yrs; none of $4.6B, $500M+, 12+, 13, AI-Native), but the EXECUTIVE SUMMARY tile grid is unreadable on a phone: `grid-template-columns` computes to six 34px columns for 8 tiles, so values and labels overlap and are clipped ("$2", "ENGA", "INDU", reason text one word per line, labels 3px wide). Evidence: mobile-J12_1-output-top.png, mobile-J12_1-output-full.png. Desktop J12.1 passes (`desktop-J12_1-output-final.png`). Maps to open bug B11 (`src/lib/outputBlocks.js:535` still has `repeat(6,1fr)`; Output.jsx grid has no narrow-width columns).
- **E.3 (desktop and mobile, "AMBIGUOUS:").** After deleting all 4 skills, 2 jobs and 1 engagement through Manual Intake, every tile computed from Career Master shows `—` with a reason, Capability Confidence says "No capability groups contain skills yet." and Industry Experience says "No industry bucket matches a role or engagement yet." But the manual tile "Certified partners" (set in J3) still shows `5†`, so "every tile as `—`" is not literally true. Proposed wording: "A member with an empty Career Master sees every tile computed from Career Master as `—` with a reason; a manual (user-defined) tile shows the member's own value with †; no figure is ever invented." (This is open bug RR2-2.)

## Status of the handed-over fixes, by baseline step
- B3 / J7.3: passes, desktop and mobile (`he` added, years stay `4 yrs`, chip removed with "Remove he"). Verified.
- B8 / P.1-P.3 and all journeys: run as member@test.local in the World Shell on both surfaces; all pass. Step text still says "admin test user" (unamended; see proposed amendment).
- B10 / J1.2, J10.2, J12.1: J1.2 and J10.2 pass. In the output Strategy & Advisory still shows `0 Expert · 2 skills` although Stakeholder alignment is hand-set to Expert (matches the spec text; the business rule is still with the owner). F3-5 stays open.
- B12 / J7, J8: pass as written.
- B13 / E.1, E.2: pass on both surfaces. E.3 does not pass (see above). E.1: confirm "Remove “Care delivery”?" removes it; with one Career Atom grouping left, Remove is refused with a red toast ("Keep at least one Career Atom grouping: … Untick Shown to hide it from outputs instead."). E.2: forced 500 through browser request interception gives an amber alert with Retry on the screen and "Resume rollups could not be loaded" in the output instead of empty tiles; Retry recovers.
- RR1-2 / J9.5: passes as a UI reload check (desktop and mobile).
- RR1-3 (owner=me on My Resume links): FIXED. My Resume > Preview PDF > Modern SB > full tab opens `/output/resume?layout=modern&owner=me` and shows the member's own data. Desktop J12.1 passes.
- RR1-4 / E.4 (404 on `/api/output-templates/preset-default/public`): FIXED. No 404 in any output load this round; E.4 passes on both surfaces (only expected noise: 400 on rollups preview when an empty-keyword bucket is added, forced 500s in E.2, sandbox-blocked external CDN requests).
- F3-7 (output header wrap at narrow width): improved. At 390px the header "SALTBASIN.NET · RESUME · MODERN" now wraps and is not cut by the Print button (mobile-J12_1-output-top.png). The tile-grid problem above is separate (B11).
- B11 (column count): NOT fixed (see J12.1 mobile).
- B5 / RR1-6 / F3-4 (site editor Career Rollup block picker): no baseline step, not browser-tested. Code check only: `EditorPane.jsx`/`CareerProspectBlocks.jsx` now handle a `groupBy` of `atom:<key>`.
- F1-2 / RR2-4 / MCP_GAP: no gap found. With a token created in World Shell > Journeys > Connected Agents (career.read, career.write) the `/mcp` endpoint listed 121 tools including `resume_rollups_read`, `resume_rollup_preview`, `career_atom_rollups_read`, `career_experience_definitions_read/save/delete`, `career_proficiency_override_save/clear`, `proficiency_rules_read`, `career_rollups_read`, `career_rollup_preview_read`, `career_record_list/create/update/delete`. `resume_rollups_read` returned exactly the state the UI showed (empty-Career-Master tiles with `Certified partners` = 5); `career_atom_rollups_read` and `career_experience_definitions_read` returned the single remaining "Skills by proficiency" grouping seen in the UI after E.1; `career_record_create` (skills) then `career_record_delete` worked (`{"id":5}`, `{"ok":true}`); `resume_rollup_preview` with an invalid bucket returned an `isError` 400 `bad_request` result like the API. Open items F1-3, F3-6 (P.1 wording) and B3's spec-wording cause need reviewer decisions on amendments, not code.
- RR2-2 / E.3: unchanged (see Failures).

## Proposed amendments (not applied)
1. P.1: "admin test user" -> "member test user" (member@test.local); the screen exists only for members and the terms screen is pre-accepted by `create-test-member.mjs`.
2. E.3: the wording above (manual tile keeps its †-marked value).
3. J4.1: "an 'At or above level' selector listing `Exposure, Foundational, Proficient, Advanced, Expert`" -> add "after a placeholder 'Choose a level…'" (the placeholder option is present; treated as a pass).

## Observations (not scored)
- Mobile "Levels and why" table (3 · Rules & why): the scroll window is only 241px wide (table 940px), so "Level shown" (`Expert †`) is visible only after swiping sideways (mobile-J10_1-level-shown-visible.png); usable but cramped.
- Connected Agents shows the MCP address `http://localhost:5173/mcp` even though the app is served on another origin (127.0.0.1:5602 here); the real endpoint worked at `/mcp` on the served origin.
- Add-industry-bucket raises a 400 on the rollups preview as soon as an empty-keyword bucket is added, also in J7.1 (spec only mentions it in J11.1); expected by design, logged as console noise.
- Career Master add/edit dialog labels are not associated with their inputs (plain `<label>` siblings), so accessibility tooling cannot name the fields.
- Output footer for a member's own resume still reads "Authored by Betsy Salter · Co-Authored with Claude (Anthropic AI)" and the profile placeholder "Edit this in your admin dashboard" (pre-existing, outside this feature).
- On the public home page, the desktop "Net Works Sign In" menu opens on hover and a click then toggles it closed; the sign-in link must be hovered, not clicked.
- Cleanup: server and phone/desktop browser drivers killed, database sb_rl_val_5600_1 dropped.
