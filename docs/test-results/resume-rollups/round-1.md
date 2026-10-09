# Test result: resume-rollups, round 1

- Feature: Configurable resume rollups (KPI tiles, industry buckets, skill category groups, Career Atom rollups)
- Round: 1 (re-test after fixes; round 0 was not tested)
- Commit tested: c3a71b4 (integration branch `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-09
- Tester: validation agent val-5600-1 (Chromium via Playwright, fresh database + `npm run seed`, TZ=UTC, en-US, light scheme; desktop 1280x900, mobile 390x844 touch). Desktop and mobile were each run on their own freshly reset database because the journeys build on each other.

## Score (from `release-spec-baseline.mjs score`)

```json
{
  "feature": "resume-rollups",
  "baseline": 1,
  "specSha256": "9cdd3c063cf92f7b2e6f33dde68525713cc9d40bafce14b799d993b6b7926bd0",
  "total": 32,
  "passed": 28,
  "failed": ["J1.1", "J9.5", "J12.1", "E.4"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": ["MCP_GAP"]
}
```

Baseline check: `baselines match: resume-rollups v1` (baseline version unchanged since the last round, so no diff table is needed). passed = false.

Evidence: steps `/var/tmp/sbpg/release-loop/resume-rollups/round-1/steps.jsonl` (earlier-session and exploratory lines were moved to `steps.earlier-session.jsonl` in the same folder), screenshots `/var/tmp/sbpg/release-loop/resume-rollups/round-1/{desktop,mobile}-<stepId>.png`, API routes the UI called `{desktop,mobile}-api-calls.txt`, output text dumps `{desktop,mobile}-J12-*.txt`.

## How the journeys were run

- Everything was reached through the website from the start page: login form (as `member@test.local`), then World Shell, Journeys, Career Master card, Manual Intake / Proficiency & Rollups, then "5 · Resume rollups". The same path was used on desktop and on the 390px phone. My Resume was reached through Journeys, My Resume.
- The test member (not the admin) was used, as the fix details require (B8). The spec text for P.1 still says "admin test user"; see observations.
- Preconditions P.1-P.3 all passed on both surfaces. The terms screen of P.1 did not appear because `scripts/create-test-member.mjs` pre-accepts platform and career terms; the top bar `World / Journeys / Classic Tools` was shown.
- "Published to public case studies" in the engagement dialog is already ticked by default, so it was left ticked.

## Per step results (desktop / mobile)

Screenshot names are `desktop-<id>.png` and `mobile-<id>.png` (dots in the id become underscores, e.g. `desktop-J7_1.png`) in the evidence folder above.

| Id | Result (desktop / mobile) | What was seen |
|---|---|---|
| P.1 | pass / pass | Signed in through the form; top bar World, Journeys, Classic Tools; terms screen not shown (pre-accepted) |
| P.2 | pass / pass | Tabs read `Skills (4),Jobs (2),Engagements (1)` after entering all fixtures through the add dialogs |
| P.3 | pass / pass | Rollups panel visible |
| J1.1 | pass / FAIL | Desktop: intro text, six cards in order (Exit Signal `$250M`, ARR Automated `—`, Engagements `1`, Industries `2`, Years `8`, Employers `2`) with the exact computed lines, Exit metric "Largest $ figure in an engagement field", field `exitDetail`. Mobile: same content, but see F1 (card footer clipped) |
| J1.2 | pass / pass | Preview tiles `$250M — 1 2 8 2`; Revenue Operations 100% 1 Expert 1 skills; Process & Architecture 75% 0 Expert 1 skills; Strategy & Advisory 50% 0 Expert 1 skills; SaaS & Enterprise Software 4 yrs; Healthcare Technology 4 yrs |
| J2.1 | pass / pass | Preview shows YEARS IN OPERATIONS before saving |
| J2.2 | pass / pass | Toast "Years in operations saved" |
| J3.1 | pass / pass | Preview `5†`, italic footnote, card footer "not saved yet" |
| J3.2 | pass / pass | Toast "Certified partners saved" |
| J4.1 | pass / pass | Counts Skills/Tools; levels Exposure, Foundational, Proficient, Advanced, Expert; `1 · proficiency engine: skills at or above the chosen level (Expert)` |
| J4.2 | pass / pass | Toast "Expert skills saved" |
| J5.1 | pass / pass | `21 · sum of skills.yearsExp in Career Master` |
| J5.2 | pass / pass | Toast "Total skill years saved" |
| J6.1 | pass / pass | ARR Automated became the first card |
| J6.2 | pass / pass | Computed line "Hidden — not shown on outputs."; preview has no EMPLOYERS |
| J6.3 | pass / pass | Toast "Employers saved" |
| J7.1 | pass / pass | Chips `clinic`, `health`; `4 yrs · 1 role/engagement(s) matched keywords: clinic, health`; preview `Care delivery · 4 yrs` |
| J7.2 | pass / pass | Toast "Care delivery saved" |
| J7.3 | pass / pass | After adding `he` the years stayed `4 yrs`; chip removed with "Remove he" |
| J8.1 | pass / pass | Box lists `Treasury Ops · 1 skill — not counted in any bar` |
| J8.2 | pass / pass | Box became "Every skill category you use is mapped to a group."; Strategy & Advisory shows chip `Treasury Ops (1)` and `... 2 skills` |
| J9.1 | pass / pass | Three cards: Skills by category, Roles by industry, Tools by wheel bucket |
| J9.2 | pass / pass | `Advanced (1) · Expert (1) · Foundational (1) · Proficient (1)` |
| J9.3 | pass / pass | Toast "Skills by proficiency saved" |
| J9.4 | pass / pass | Toast "Tools by wheel bucket saved" |
| J9.5 | FAIL / FAIL | UI_GAP / MOBILE_GAP, see F2 (no screenshot: nothing in the UI to open) |
| J10.1 | pass / pass | Row shows `Expert †` |
| J10.2 | pass / pass | Expert skills `2†`; footnote exactly as specified (with "1 set directly by the member") |
| J11.1 | pass / pass | Amber alert "Live preview paused. New industry bucket: an industry bucket needs at least one keyword. Your edits are kept..."; the expected 400 from the preview route was logged |
| J11.2 | pass / pass | Confirm text `Remove “New industry bucket”?`; card removed; alert gone |
| J12.1 | FAIL / FAIL | UI_GAP / MOBILE_GAP, see F3 (screenshots `desktop-J12_1*.png`, `mobile-J12_1*.png`, text dumps `*-J12-output-text.txt`) |
| E.1 | pass / pass | Confirm text `Remove “Care delivery”?`, removed on confirm; after removing the other buckets the last one could not be removed: toast "Keep at least one industry bucket..." and no confirm shown |
| E.2 | pass / pass | With the rollups GET forced to 500 (browser request interception): amber alert "Resume rollups could not be loaded ... This is a loading error — your tiles, buckets and groups are not empty." with Retry; the output showed "Resume rollups could not be loaded"; Retry recovered |
| E.3 | pass / pass | Career Master emptied through the UI (Skills 0, Jobs 0, Engagements 0): every computed tile shows `—` with a reason (e.g. "No dated roles in Career Master yet"); the only non-dash tile is the manual `Certified partners 5†` (user-defined by design); Employers hidden |
| E.4 | FAIL / FAIL | See F4 |

## Failures

- **F1, J1.1 (mobile only), MOBILE_GAP (clipped screen).** Expected: the six KPI cards readable and usable at 390px. Seen: each card's footer row (Shown, up, down, Remove, Save) overflows the card; the Save button right edge is at x=418.9 against a 390px viewport and a card edge at 320, cut off by an `overflow:hidden` ancestor (only `Sa`/`S` visible in `mobile-J2_2.png`). The Save control is not visible on the default cards on a phone. Evidence: `mobile-J1_1.png`, `mobile-J2_2.png`. Component: the `Footer` row in `src/components/admin/RollupGroupingsPanel.jsx` (non-wrapping flex row inside a fixed-width container). It affects every card type on the screen.
- **F2, J9.5 (desktop and mobile), UI_GAP / MOBILE_GAP.** The step is to open `/api/career/atom-rollups?owner=me` in the browser. No control in the UI (Career Master, Proficiency & Rollups, My Website, View My Profile) opens or shows that JSON, so it can only be done by typing a URL. For information only, not used for the verdict: through the page session the API returned `tools_by_wheel_bucket: []` and a `groupings` array containing "Skills by proficiency", so the behaviour behind the step works.
- **F3, J12.1 (desktop and mobile), UI_GAP / MOBILE_GAP.** The only UI route to the modern resume output (Journeys, My Resume, Preview PDF, Modern SB, full tab) opens `/output/resume?layout=modern`, which renders the platform owner's resume (header BETSY SALTER, all six tiles in their empty state such as "No dollar figure found in engagement exitDetail"), not the signed-in member's Career Master. None of the expected tiles, footnote, Capability Confidence or Industry Experience entries appear. The member's own output is only reachable by typing `&owner=me` (the layout buttons in `MyResumePanel.jsx` and `resumeUrls.js` do not append the owner). Observation run (typed URL `/output/resume?layout=modern&owner=me`, not used for any verdict): the output matched every J12.1 expectation: tiles ARR AUTOMATED `—`, EXIT SIGNAL `$250M`, ENGAGEMENTS `1`, INDUSTRIES `2`, YEARS IN OPERATIONS `8`, CERTIFIED PARTNERS `5†`, EXPERT SKILLS `2†`, TOTAL SKILL YEARS `21`, no EMPLOYERS, the footnote, Strategy & Advisory `0 Expert · 2 skills`, and `Care delivery / Clinical operations / 4 yrs`. Files: `desktop-J12-OBS-owner-me-output-text.txt`, `mobile-J12-OBS-owner-me-output-text.txt`.
- **F4, E.4 (desktop and mobile).** Expected console noise is only `404 GET /api/members/me/profile` and external-host certificate errors. Seen: the certificate errors, the expected 400 preview call (J11.1) and my own forced 500s (E.2), plus one unlisted error: `404 GET /api/output-templates/preset-default/public`, raised when the output page is opened for the default (unsaved) preset through My Resume. The `404 /api/members/me/profile` did not occur for the member user. Because the 404 is not on the allowed list the step is marked failed; if the intent is only "no errors from this feature", triage may prefer an amendment.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist. No MCP tool for: reading, saving, deleting and reordering KPI tile / industry bucket / capability group / Career Atom grouping definitions, the live preview, the computed rollups (`GET /api/career/resume-rollups`), Career Master add/delete, and the proficiency override. The API routes the UI used are listed in `desktop-api-calls.txt` and `mobile-api-calls.txt`.

## Console errors and failed requests

- Page errors: none.
- Failed app requests: only the intended 400 (preview with an empty bucket, J11.1), two forced 500s on `GET /api/career/resume-rollups` per surface (E.2, browser interception) and the `404 /api/output-templates/preset-default/public` above.
- External hosts (Google fonts etc.): `net::ERR_CERT_AUTHORITY_INVALID` / `ERR_TUNNEL_CONNECTION_FAILED`, logged as sandbox noise, not failures.

## Fix details received and verification by step id

| Bug | Maps to | Result |
|---|---|---|
| resume-rollups-B3 (exact match not stated) | J7.3 | Verified: `he` does not change the years (stays `4 yrs`); the whole-word rule is written in the page text. |
| resume-rollups-B5 (Site editor: no journey selects the new grouping in the block picker) | none (no baseline step) | Not tested: no baseline step covers it; recorded as an observation. |
| resume-rollups-B8 (validated as admin, not as the member in the World Shell) | P.1, all journeys | Run as `member@test.local` through the World Shell on desktop and phone. This exposed F3 (J12.1 shows the platform owner's resume to the member), which an admin run could not. The P.1 spec wording still says admin. |
| resume-rollups-B10 (bars count recorded tier) | J10.2, J12.1 | The on-screen preview is consistent with the fix (Revenue Operations 1 Expert, Strategy & Advisory 0 Expert · 2 skills after the override). The output expectation `0 Expert · 2 skills` was confirmed only in the typed `owner=me` observation, not through a UI route (F3). Still open for J12.1. |
| resume-rollups-B11 (block column count not updated) | J12.1 (block) | No baseline step covers it; not tested. Observation only. |
| resume-rollups-B12 (undefined business rule) | J7.1, J7.3, J8.1, J8.2 | Verified: all four pass on both surfaces. |
| resume-rollups-B13 (edge cases with no journeys) | E.1-E.4 | E.1, E.2, E.3 pass on both surfaces (E.2 with a forced failure, E.3 by emptying the Career Master through the UI). E.4 fails (F4). |

## Observations (outside the baseline, not scored)

1. At 390px the Classic Tools console (the top bar "Classic Tools") hides the whole tab strip (Career Master, My Resume, ...): the tabs have zero width and no menu replaces them. The Journeys cards are the only phone route. The "Back to World" button also overlaps the member name in the header.
2. The admin test user cannot open this screen: Classic Tools, Network Relationship Management, Career Master shows only the table, without the "Proficiency & Rollups" cards. The spec's original "sign in as the admin test user" route is therefore not available in this build.
3. J7.3: after adding `he` the card's computed line lists the keyword (`...matched keywords: clinic, health, he`) although `he` matches nothing; the years are correct.
4. The spec says E.3 is "not exercised"; it was run for real by deleting all Career Master rows through the UI. The manual tile stays `5†` by design.
5. B5 (Site editor block-picker journey) and B11 (output block column count) have no baseline step; proposed as coverage-gap amendments (a journey that adds the Career Rollup block in the site editor and picks the new grouping; a step checking the block column count after adding or hiding groupings).
6. Because of F1, every "Click Save" step is hard to perform visually on a phone even though the automated tap succeeded.

## Cleanup

Server process stopped via its PID file, database `sb_rl_val_5600_1` dropped, session state files removed. No product code, spec or baseline file was changed; nothing was committed.
