# Test result: resume-rollups, round 2

- Feature: Configurable resume rollups (KPI tiles, industry buckets, skill category groups, Career Atom rollups)
- Round: 2 (re-test after fixes RR1-1 and RR1-5)
- Commit tested: 85a4895 (integration branch `claude/zealous-meitner-5tuft5`, "Merge release-loop/career-bound-outputs-fix-r3")
- Tester: validation agent val-5600-7 (Chromium via Playwright, fresh database + `npm run seed` per surface, TZ=UTC, en-US, light scheme; desktop 1280x900, mobile 390x844 isMobile + hasTouch with taps). The journeys build on each other, so desktop and mobile each ran on their own fresh database (`sb_rl_val_5600_7` on port 5614, `sb_rl_val_5600_7b` on port 6914). Both databases were dropped and both servers stopped at the end.
- Account: `member@test.local` from `scripts/create-test-member.mjs`, signed in through the login form, every step reached by clicking from `/world` (Journeys, Career Master, Manual Intake / Proficiency & Rollups, "5 · Resume rollups").

## Score (from `release-spec-baseline.mjs score`, copied verbatim)

```json
{
  "feature": "resume-rollups",
  "baseline": 2,
  "specSha256": "fd8842f5b44385300fd45e971bbdd792fd86a2db2ab68d56900872f3816a3662",
  "total": 32,
  "passed": 29,
  "failed": ["J12.1", "E.3", "E.4"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Baseline check: `baselines match: resume-rollups v2`. passed = false.

Baseline diff (v1 -> v2, amendment A1): comparable 34; same = every id except J9.5; changed = J9.5; added none; retired none. So the score is comparable with round 1 (v1: 28 of 32) except for J9.5, whose wording changed to a UI check.

Evidence: `/var/tmp/sbpg/release-loop/resume-rollups/round-2/` holds `steps.jsonl` (live log), `{desktop,mobile}-<stepId>.png` screenshots (dots in ids become underscores), `*-J12-output-text.txt`, `*-E3-tiles.txt`, `mcp-report.txt`, `mobile-MCP-*.png`. Lines that my own automation got wrong (not product results) are kept in `steps.superseded.jsonl` in the same folder with the reason, see "Log corrections" below.

## Fix verification by id

| Fix | Steps it touches | Result |
|---|---|---|
| RR1-1 (footer wraps, Save no longer clipped at 390px) | J1.1 mobile, every "click Save" step on mobile | Fixed. On the phone the check measured every `Save` button against the viewport and its card: 19 Save buttons on the default screen, 0 clipped, rightmost edge inside 390px. The screenshot `mobile-J1_1.png` shows Shown, up, down, Remove and Save wrapping onto two rows with Save fully visible. All Save steps passed by tapping on the phone. |
| RR1-5 (8 new MCP tools + parity rows) | MCP check (no baseline step) | Fixed for the rollup capabilities, see the MCP section. One remaining gap (Career Master record add/delete) is reported below. |
| A1 (J9.5 now a UI check) | J9.5 | Passes on desktop and mobile: after a page reload and reopening Career Atom rollups, `Skills by proficiency` is still there with `Advanced (1) · Expert (1) · Foundational (1) · Proficient (1)`, and `Tools by wheel bucket` has Shown unticked. |

## Per step results (desktop / mobile)

| Id | Result | What was seen |
|---|---|---|
| P.1 | pass / pass | Signed in through the form; top bar World, Journeys, Classic Tools. The terms screen is not shown because `create-test-member.mjs` pre-accepts platform and career terms. Spec text still says "admin test user". |
| P.2 | pass / pass | After entering the fictional jobs, skills and engagement through the add dialogs the tabs read `Skills (4)`, `Jobs (2)`, `Engagements (1)`. "Published to public case studies" was already ticked. |
| P.3 | pass / pass | Resume rollups panel opens. |
| J1.1 | pass / pass | Intro text present; six cards in order Exit Signal, ARR Automated, Engagements, Industries, Years, Employers with the exact computed lines (`$250M`, `—` with the ARR reason, `1`, `2`, `8`, `2`); Exit Signal metric "Largest $ figure in an engagement field", field `exitDetail`. |
| J1.2 | pass / pass | Preview tiles `$250M — 1 2 8 2`; Revenue Operations 100% · 1 Expert · 1 skills; Process & Architecture 75% · 0 Expert · 1 skills; Strategy & Advisory 50% · 0 Expert · 1 skills; SaaS & Enterprise Software 4 yrs; Healthcare Technology 4 yrs. |
| J2.1 / J2.2 | pass / pass | Preview shows YEARS IN OPERATIONS before saving; toast "Years in operations saved". |
| J3.1 / J3.2 | pass / pass | Preview `5†`, italic footnote, card footer "not saved yet"; toast "Certified partners saved". |
| J4.1 / J4.2 | pass / pass | Counts selector (Skills, Tools); level selector lists Exposure, Foundational, Proficient, Advanced, Expert (plus a non-level "Choose a level…" prompt option, see observation 3); computed `1 · proficiency engine: skills at or above the chosen level (Expert)`; toast "Expert skills saved". |
| J5.1 / J5.2 | pass / pass | `21 · sum of skills.yearsExp in Career Master`; toast "Total skill years saved". |
| J6.1 / J6.2 / J6.3 | pass / pass | ARR Automated first; Employers shows "Hidden — not shown on outputs." and EMPLOYERS leaves the preview; toast "Employers saved". |
| J7.1 / J7.2 / J7.3 | pass / pass | Chips `clinic`, `health`; "4 yrs · 1 role/engagement(s) matched keywords: clinic, health"; preview `Care delivery · 4 yrs`; toast "Care delivery saved"; adding `he` keeps 4 yrs, chip removed with "Remove he". |
| J8.1 / J8.2 | pass / pass | Box lists `Treasury Ops · 1 skill — not counted in any bar`; after mapping to Strategy & Advisory the box says "Every skill category you use is mapped to a group." and the group shows `Treasury Ops (1)` and `38% · 0 Expert · 2 skills`. |
| J9.1 to J9.4 | pass / pass | Three cards; `Skills by proficiency` with tier and A to Z shows `Advanced (1) · Expert (1) · Foundational (1) · Proficient (1)`; toasts "Skills by proficiency saved" and "Tools by wheel bucket saved". |
| J9.5 | pass / pass | See fix verification above. |
| J10.1 / J10.2 | pass / pass | Stakeholder alignment row shows `Expert †`; Expert skills card shows `2†` and the footnote matches exactly, including "(1 set directly by the member)". |
| J11.1 / J11.2 | pass / pass | Amber alert "Live preview paused. New industry bucket: an industry bucket needs at least one keyword. Your edits are kept…"; the expected 400 from the preview route is logged; Remove asks `Remove “New industry bucket”?`, card and alert vanish. |
| J12.1 | FAIL / FAIL | See F1. |
| E.1 | pass / pass | `Remove “Care delivery”?` confirm and removal; after removing the others the last bucket cannot be removed (toast tells the member to untick Shown). |
| E.2 | pass / pass | With `GET /api/career/resume-rollups` forced to 500 by browser request interception: amber alert "Resume rollups could not be loaded… your tiles, buckets and groups are not empty" with Retry; the output page shows "Resume rollups could not be loaded"; after the interception was lifted the alert is gone. |
| E.3 | FAIL / FAIL | AMBIGUOUS, see F2. |
| E.4 | FAIL / FAIL | See F3. |

## Failures

- **F1, J12.1 (desktop and mobile), UI_GAP / MOBILE_GAP (unchanged from round 1 F3, not in this round's fix list).** Followed through the UI exactly as a member would: Journeys, My Resume, Preview PDF, Modern SB, "↗ full tab". It opens `/output/resume?layout=modern` (the literal URL in the spec) and renders the platform owner's resume: header BETSY SALTER, every Executive Summary tile in its empty state ("No dollar figure found in engagement exitDetail", "No published engagements yet", EMPLOYERS tile present), none of ARR AUTOMATED / EXIT SIGNAL `$250M` / YEARS IN OPERATIONS / CERTIFIED PARTNERS `5†` / EXPERT SKILLS `2†` / TOTAL SKILL YEARS `21`, no footnote, no Capability Confidence or Industry Experience entries for the member. The member's own data only appears if `&owner=me` is added to the URL by hand, which no button does (`MyResumePanel.jsx` and `resumeUrls.js` do not append the owner). The old invented figures ($4.6B, $500M+, 12+, AI-Native) were not present. Files: `desktop-J12-output-text.txt`, `mobile-J12-output-text.txt`, screenshots `*-J12_1-output*.png`. The same member's data is correct in the Live preview (J1.2, J10.2), so the defect is the output page not reading the signed-in member's data from this UI route.
- **F2, E.3 (desktop and mobile), AMBIGUOUS.** Step text: "A member with an empty Career Master sees every tile as `—` with a reason". Career Master emptied through the UI (`Skills (0)`, `Jobs (0)`, `Engagements (0)`). Seen: ARR Automated, Exit Signal, Engagements, Industries, Years in operations, Expert skills and Total skill years all show `—` with a reason ("No dated roles in Career Master yet", "No skills in Career Master yet", and so on); Employers is hidden; nothing is invented; but the member's own manual tile Certified partners still shows `5†` (user-defined by design). Followed literally, "every tile" is not `—`. Proposed wording: "A member with an empty Career Master sees every computed tile as `—` with a reason; a manual (user-defined) tile keeps the member's own value marked †; no figure is ever invented." Round 1 passed this step with the same observation by reading it that way; I followed the literal text per the ambiguity rule. Files: `desktop-E3-tiles.txt`, `mobile-E3-tiles.txt`.
- **F3, E.4 (desktop and mobile).** Unchanged from round 1 F4. The allowed noise is the `404 GET /api/members/me/profile` (did not occur for the member user) and sandbox certificate errors for external hosts (fonts.googleapis.com, cdnjs.cloudflare.com; seen, allowed). One error outside the allowed kinds occurs each time the output page is opened from My Resume: `404 GET /api/output-templates/preset-default/public`. Other non-200s were caused by steps: the 400 preview call (J11.1), the forced 500s (E.2) and `net::ERR_ABORTED` on `/api/career-agents/*` where my own page navigation cancelled requests. Proposed wording if the intent is only "no unexpected errors from this feature": add `404 GET /api/output-templates/preset-default/public (the default preset has no saved template)` to the allowed list.
- **MCP_GAP: Career Master records cannot be created or deleted through MCP.** The spec exercises adding skills, jobs and engagements (P.2) and deleting them (E.3) through the Career Master screen; `server/lib/mcpToolRegistry.js` has `career_master_read` only, no tool to add, change or delete a skill, job or engagement. Not attributable to a baseline step score, so not logged in `steps.jsonl`. (The platform MCP server itself exists and all rollup capabilities have tools, see below.)

## Interface parity

- Desktop point-and-click and 390px phone tap walkthrough: every baseline step was run on both surfaces. No UI_GAP or MOBILE_GAP other than J12.1 (F1). Tapping through the World Shell, Manual Intake dialogs and the rollups panel worked at 390px, and RR1-1 is fixed.
- Connected Agents (Journeys, "Tokens for AI agents (MCP)") was used at 390px to create a token with all four scopes; `mobile-MCP-connected-agents.png`, `mobile-MCP-token-created.png`. The token value is not recorded here.
- MCP (`POST /mcp` with that bearer token, same member): `tools/list` includes all eight new tools plus `career_master_read`; none missing. Compared with what the UI showed at the same moment (`mcp-report.txt`):
  - `resume_rollups_read`: tiles ARR Automated `—`, Exit Signal `$250M`, Engagements `1`, Industries `2`, Years in operations `8`, Certified partners `5` (userDefined), Expert skills `2` (userDefined), Total skill years `21` match the Live preview tile by tile; the three Capability Confidence groups match; the footnote text is identical to the screen's. Industry durations were empty on both sides at that moment because E.1 had removed the buckets.
  - `career_atom_rollups_read`: skills by category and jobs by industry match the four atom cards on screen (`Tools by wheel bucket` hidden on screen, still present in the data, as designed).
  - `career_experience_definitions_read`: returns the definitions.
  - `resume_rollup_preview` with an industry bucket that has no keywords: returns an error result "Error 400 bad_request: ... an industry bucket needs at least one keyword", same reason the screen shows in J11.1.
  - `career_experience_definition_save` then `_delete` of a temporary bucket: both ok.
  - `career_proficiency_override_save` then `_clear` on the Billing integration skill: both ok.
  - No mismatch found; the only MCP gap is Career Master record writes (above).

## Observations (outside the baseline, not scored)

1. At 390px the World Shell's inset panel leaves little width: the rollup cards are readable and usable but the page text is narrow with large side bands.
2. On an empty table the Career Master journey shows "Seed Initial Data"; entering fixtures through the add dialogs works on both surfaces.
3. J4.1: the "At or above level" select has an extra first option "Choose a level…" in addition to the five levels in the spec. I treated it as a prompt, not a level.
4. "Published to public case studies" in the engagement dialog is ticked by default.
5. The "Preview ↗" link in the My Resume preset editor and the "↗ full tab" link both open the platform owner's resume for a member (same cause as F1).
6. The spec still says "admin test user" for P.1 and P.2 while the rollups screen is reached as the member; round 1 observed the admin test user has no Proficiency & Rollups cards.
7. Requirement gaps named in the fix details that no baseline step covers: the J9.6 site-editor "Career Rollup block picker" (amendment A2 rejected, to be re-proposed after a walked path) and the J12.2 output column count (amendment A3 needs the owner); neither was tested.
8. Port 5714 is in use by another validator's server; I moved my second server to 6914 and did not touch the other one.

## Log corrections

My automation made four wrong checks on the desktop run; they are product-neutral and were re-checked, the original lines moved to `steps.superseded.jsonl`: P.1 (evaluated on a sub-view where the top bar is hidden, re-run on `/world`: pass), J7.3 (the "Remove he" tap matched the "Remove health" chip by substring; re-run with exact names: pass), J4.1 (strict option-list comparison ignored the "Choose a level…" prompt; re-evaluated from the captured screenshot: pass) and J8.1 (case-sensitive compare against CSS-uppercased text; re-evaluated from the captured screenshot: pass). Preconditions P.1 to P.3 are also logged once on surface `setup` as the baseline requires, from the two surface runs.

## Cleanup

Servers stopped by PID file, databases `sb_rl_val_5600_7` and `sb_rl_val_5600_7b` dropped, session state and credential files removed. No product code, spec or baseline file was changed; nothing was committed.
