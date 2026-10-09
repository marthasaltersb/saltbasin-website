# Test result: career-bound-outputs, round 3

- Feature: Outputs populate from Career Master with per-output overrides; packages enter Career Master via the reconciliation queue
- Round 3 (re-test after fix round 2). Commit tested: c3a71b490991e2f7c7616cb326bd9cfe1084b7d0 (integration head `claude/zealous-meitner-5tuft5`). Date: 2026-10-09
- Baseline: v1 of `docs/training/career-bound-outputs.md`, spec sha256 b3bc57959cb82a9cc7ef39f339b23ecf483493cdd633221ff0a8fb63092bb298. `check` passed ("baselines match"). First baseline for this feature, so no diff table applies (round 2 was scored against the unversioned v2/v3 spec text; its 54/56 is not comparable step for step).
- Method: Chromium (pinned) via Playwright against the production build served by `node server/index.js` on port 5502, fresh database `sb_rl_val_5500_1` seeded with `npm run seed`, test accounts from `scripts/create-test-member.mjs`. Logged in through the login form; every journey reached by clicking from the World Shell (only typed URLs: `/world`, `/login`, and the two the spec itself names, `/output/resume?owner=me` and the `/r/<slug>` link). Two full walkthroughs on two fresh databases: desktop 1280x900, then mobile 390x844 (isMobile, hasTouch, taps). Light scheme, en-US, TZ=UTC. Preconditions P.1-P.5 built through the UI on both.
- Raw log: `/var/tmp/sbpg/release-loop/career-bound-outputs/round-3/steps.jsonl`; screenshots (one per expectation, `<id>-<surface>.png`) in the same folder.

## Score (from `scripts/release-spec-baseline.mjs score`, copied verbatim)

```json
{
  "feature": "career-bound-outputs",
  "baseline": 1,
  "specSha256": "b3bc57959cb82a9cc7ef39f339b23ecf483493cdd633221ff0a8fb63092bb298",
  "total": 56,
  "passed": 48,
  "failed": [
    "J1.2",
    "J6.3",
    "J6.10",
    "J9.8",
    "J9.10",
    "J11.2",
    "E.4",
    "E.5"
  ],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

**48 of 56 steps passed; 8 failed** (J1.2, J6.3, J6.10, J9.8, J9.10, J11.2, E.4, E.5). Nothing blocked, nothing not run.

## Failures

| Step | Surfaces | What the spec expects | What was seen |
|---|---|---|---|
| J1.2 | desktop, mobile | "Save changes is disabled (nothing changed)" | The button carries the disabled attribute but no disabled styling: opacity 1, cursor pointer, identical amber fill and white text as when enabled, so a person cannot tell. Open bug F2-6 not fixed (`CareerBoundOutputEditor.jsx:145`). Every other part of J1.2 passed, including legibility (14.57:1). |
| J6.3 | desktop, mobile | Row text and disabled Convert button under the heading "Imported resumes you can convert to career-bound" | Functional parts pass; the heading named in the step renders rgb(27,42,59) on rgb(13,20,23), 1.28:1 (page intro text 2.24:1, "Tailored package vs Career Master (6)" heading equally dark). Unreadable per the regression-gate ground rule. World Shell queue page, outside any dialog (`WorldShell.jsx` unchanged). |
| J6.10 | desktop, mobile | Dialog "Career Sources to Review" over My Resume | Dialog opens and Close works, but its header holds only a Close button: no visible title (only an aria-label), so the screen is contextless. Open bug F2-7 not fixed. |
| J11.2 | desktop, mobile | Same dialog from the admin account | Same: no visible title in the dialog header (F2-7). |
| J9.8 | desktop, mobile | In "Add tool override" choose `Ledgerly ERP`; box changed to `Ledgerly ERP (template)`; each shows badge, Career Master line, Revert | The tool select lists a blank option plus `QuoteFlow CPQ`; `Ledgerly ERP` cannot be chosen by name (the option text is the Current Name, which is empty for a tool entered with only "Name When Used" as P.3 specifies). Choosing the blank option gives a box labelled "Tool  for this output" and the line "Career Master: (empty)". Skill and certification parts of J9.8 work. |
| J9.10 | desktop, mobile | Revert the skill only; its box reads `Process design` and its badge disappears while tool and certification stay overridden | After the reload in J9.9, reverting the skill makes the whole row vanish (it returns to the "Add skill override" select) instead of showing `Process design` with no badge. Tool and certification stay overridden; once all three are reverted and saved, no badge and no "(template)" remain. |
| E.4 | desktop, mobile | Sync failure toast and "Applied - sync failed" list with Retry sync | UI_GAP: a Career Atom sync failure cannot be produced from the interface; it needs a server-side fault. The five approvals in J6.5 raised no sync-failed state. Needs an owner decision on how to make this testable. |
| E.5 | desktop, mobile | Invalid JSON shows "That is not valid JSON: ..." "in a red box" | AMBIGUOUS: the message appears and the unsupported-output case shows the server text "Unsupported outputType: hologram" with nothing filed, but the box is amber (bg rgb(251,235,208), text rgb(92,59,8)), not red. Proposed wording: "in an amber warning box". |

## Status of each handed-over bug

| Bug | Maps to | Verdict this round |
|---|---|---|
| career-bound-outputs-F2-3 (template overrides attached to the preset) | J9.1-J9.5, J9.11 | J9.1-J9.5 and J9.11 pass on both surfaces; overrides persist per preset and apply on `/output/resume?owner=me`. The preset scope is now the documented, by-design behaviour (J9.11); no per-document row exists. |
| career-bound-outputs-F2-6 (Save changes disabled styling) | J1.2 | NOT fixed. J1.2 fails on both surfaces. |
| career-bound-outputs-F2-7 (dialog header holds only Close) | J6.10, J11.2 | NOT fixed. Both fail on both surfaces. |
| career-bound-outputs-F2-8 (convertible list ignores an existing converted output) | J6.8 / J6.10 | NOT fixed (no baseline step asserts it, so it is an observation): after J6.8 converted the package, the queue row still shows an enabled "Convert to career-bound output" and no note that a converted output exists. |
| career-bound-outputs-F2-9 and cbo-r2-inherited-cream-text (cream text inherited into light dialogs) | J1.2, J2-J4, J9.2, J9.6, J10.1 | Fixed for the editor, Output Templates Sections and dialogs: measured 14.57:1 for editor labels, headings and checklist rows, 5.4-6.0:1 for the Sections card heading and labels, at 1280 and 390 px; J9.6 and J10.1 pass. Residual: the World Shell queue page headings (J6.3 above). |
| career-bound-outputs-F2-10 (default layout does not render skills/tools/certifications) | J9.9 | Unchanged and matches the spec's own note: after saving the three overrides `/output/resume` shows no "(template)" and no skills section. J9.9 passes as written. |
| career-bound-outputs-F1-3 (editor built for jobs only) | J9.7-J9.10 | Partly fixed: the skills/tools/certifications card exists and persists (J9.7, J9.9 pass), but J9.8 (tool not selectable by name) and J9.10 (row vanishes on revert) fail. |
| career-bound-outputs-F1-4 (no per-document row) | J9.11 | Same as F2-3; by design per the scope note. |
| career-bound-outputs-F1-5 (J8 mutates state J7.4 needs) | J7.4 | Verified: with J7 before J8 as the spec now orders it, J7.4 passes on both surfaces. |
| output-version-history-B9 | n/a | Reassigned; not exercised by this spec. |

## Interface parity

- **Desktop and phone**: every journey and edge case walked on both surfaces (see table); the editor and Output Templates are usable at 390 px (J10.1 passes: Title and Dates boxes 330 px, Preview below at 363 px, no sideways scroll).
- **API**: the UI calls the routes below (from `src/lib/api.js`, confirmed by the in-page 400/409 responses seen): `GET/POST /api/career-bound/outputs`, `PUT /api/career-bound/outputs/:id`, `POST /api/career-bound/outputs/:id/preview`, `GET /api/career-bound/convertible`, `POST /api/career-bound/convert/:id`, `POST /api/career-reconciliation/package-sources`, `POST /api/career-reconciliation/tasks/:id/resolve`, `POST /api/resume-outputs/:id/share`, `PATCH /api/resume-outputs/:id/status`.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp).** `server/lib/mcpToolRegistry.js` does not exist and no MCP route exists in `server/`. Capabilities with no tool: create a career-bound output, edit/override/revert a field, add a bullet to Career Master or only to an output, import a package, approve/reject a reconciliation task, convert a package to a career-bound output, approve and approve-for-QR an output, per-preset master overrides.

## Observations (not scored)

- The World Shell Career Sources to Review page has other low-contrast text: the teal intro paragraph is 2.24:1 and the section heading "Tailored package vs Career Master (6)" is dark on dark (screenshots `queue-legibility-desktop.png`, `J6.4-card-mobile.png`).
- E.2's notice reads "A skill selected for this output (#1) was removed from Career Master; it is left out." The spec says "such as ... no longer exists; it is left out of this output"; accepted as the same meaning.
- E.3 on the API route returns "1 reconciliation task for this package still need a decision (approve or reject) before it can be converted." (singular for N=1); accepted. This was verified with one in-page call to the UI's own route, as verification only; the step itself was done through the UI (button disabled).
- J5.2 and J10.1: when a Career Master Jobs list is opened right after Save it can still show "Loading..." for a moment (seen once on mobile in J8.1; re-checked and passed).
- Browser noise: only blocked external fonts, the expected single 409 at J7.2 (plus its console echo), and the 400/409 responses deliberately provoked by E.3 and E.5; in-flight requests aborted by the test's own next navigation (`net::ERR_ABORTED`) are not counted. E.7 passes on both surfaces.
- Test-run corrections (disclosed): J9 on desktop was run three times (the first two runs hit script defects and, for the second, leftover overrides from a crashed earlier run, which were cleaned up through the UI; E.2 deleting the Process design skill forced it to be re-added through Career Master before the final J9 run). Only the final J9 results are in the log. Mobile J8.1 was re-captured once after the first screenshot caught "Loading...". The mobile and desktop walks each started from a freshly seeded database.

## Per-step results

| Step | Surface | Result | What was seen |
|---|---|---|---|
| P.1 | setup | pass | missing=; tabs=Skills (0) / Jobs (2) / Tools (0) / Engagements (0) / Domains & Ventures (0) / Certifications (0) / Deals (0) |
| P.2 | setup | pass | missing=; tabs=Skills (2) / Jobs (2) / Tools (0) / Engagements (0) / Domains & Ventures (0) / Certifications (0) / Deals (0) |
| P.3 | setup | pass | missing=; tabs=Skills (2) / Jobs (2) / Tools (1) / Engagements (0) / Domains & Ventures (0) / Certifications (0) / Deals (0) |
| P.4 | setup | pass | missing=; tabs=Skills (2) / Jobs (2) / Tools (1) / Engagements (0) / Domains & Ventures (0) / Certifications (1) / Deals (0) |
| P.5 | setup | pass | Skills (2) / Jobs (2) / Tools (1) / Engagements (0) / Domains & Ventures (0) / Certifications (1) / Deals (0) |
| J1.1 | desktop | pass | CAREER-BOUND RESUMES / A career-bound resume reads its roles, bullets, skills, tools and certifications from Career Master, so a change there flows into it. Wording you c |
| J1.2 | desktop | fail | aria=Career-bound resume editor; orderOk=true; status="Status: Draft"; saveDisabled=true style={"opacity":"1","cursor":"pointer","bg":"rgb(196, 132, 58)","color":"rgb(255 |
| J2.1 | desktop | pass | toast=true; bullet1="Led the ledger consolidation across four regions." |
| J2.2 | desktop | pass | bullet2="Presented results to the board quarterly."; badges=5 |
| J2.3 | desktop | pass | live=true; both=true; heading="Preview (live, not saved yet)" |
| J2.4 | desktop | pass | toast=true; asSaved=true; badge2=true; badge1=false |
| J3.1 | desktop | pass | badge=true; revertButtons=1; cmLine=true; live5=true |
| J3.2 | desktop | pass | line="Led the ledger consolidation across five regions.OUTPUT-ONLY" next="•" |
| J3.3 | desktop | pass | value="Led the ledger consolidation across four regions."; badgeGone=true |
| J3.4 | desktop | pass | four=true; five=false |
| J4.1 | desktop | pass | badge=true; revert=true; legibilitySkillsRow={"color":"rgb(27, 42, 59)","bg":"rgb(255,255,255)","ratio":14.57,"text":"Process design (finance)output-only"} |
| J4.2 | desktop | pass | skills="SKILLS /  / Process design (finance)OUTPUT-ONLY /  / TOOLS & TECHNOLOGIES /  / Ledgerly ERP / " |
| J4.3 | desktop | pass | revertBtnsInCard=1; skills="SKILLS /  / Process design /  / TOOLS & TECHNOLOGIES /  / Ledgerly ERP /  / CERTIFICATIONS /  / Ledg" |
| J4.4 | desktop | pass | RESUME OUTPUT HISTORY / Finance systems resumeCAREER-BOUNDIMPORTED / Generated 10/9/2026, 4:01:25 PM · Draft / Version history / Edit sections / View / Download PDF / App |
| J5.1 | desktop | pass | row shows Finance Systems Director |
| J5.2 | desktop | pass | ← Back to World / My Resume / My Resume / Configure resume presets, generate tailored outputs, and preview or print directly from here. / Career Master Intake / Upload re |
| J6.1 | desktop | pass | ← Back to World / Career Sources to Review / Every source you've attached — resume, LinkedIn, Indeed, Fiverr — carries equal weight. Nothing is picked automatically when  |
| J6.2 | desktop | pass | filed=true; tags=[["Package differs from Career Master",true],["New bullet variant",true],["Add job",true],["New skill",true],["New tool",true],["New certification",true] |
| J6.3 | desktop | fail | FAIL (legibility): the heading "Imported resumes you can convert to career-bound" named in this step renders rgb(27,42,59) on rgb(13,20,23): contrast 1.28:1 (also the pag |
| J6.4 | desktop | pass | cardText="PACKAGE DIFFERS FROM CAREER MASTER / Harborline Freight Systems - job title / CAREER MASTER NOW / Finance Systems Director / → / PACKAGE SAYS / Finance Systems  |
| J6.5 | desktop | pass | results=[["Westbrook Logistics - Operations Analyst","disappeared"],["bullet not in this job","disappeared"],["Revenue recognition - skill not in Caree","disappeared"],[" |
| J6.6 | desktop | pass | msg="Filed 1 output; 0 new tasks; 1 already decided or merged."; approveButtons=0 |
| J6.7 | desktop | pass | tabs=Skills (3) / Jobs (3) / Tools (2) / Engagements (0) / Domains & Ventures (0) / Certifications (2) / Deals (0); westbrook=true; director=true; lead=false |
| J6.8 | desktop | pass | enabled=true; created=true; aria=Career-bound output editor; checks={"cm":true,"badge":true,"west":true,"p1":true,"p2":true,"p3":true,"p4":true,"p5":true} |
| J6.9 | desktop | pass | Preview (as saved) / Pat Example / FINANCE SYSTEMS / pat@example.test / EXPERIENCE / Harborline Freight Systems / Finance Systems Director / Jan 2018 – Mar 2022 / • |
| J6.10 | desktop | fail | dialogs=["Career Sources to Review"]; headerLines={"first":["Close","Every source you've attached — resume, LinkedIn, Indeed, Fiverr — carries equal weight. Nothing is pi |
| J7.1 | desktop | pass | elow. / RESUME OUTPUT HISTORY / 1 technology needs a proficiency category before any output can be approved or shared (QuoteFlow CPQ). You’ll be asked to set it when you  |
| J7.2 | desktop | pass | title=true; onlyQuoteFlow=true; row="Demo Package Resume (career-bound)CAREER-BOUNDIMPORTED / Generated 10/9/2026, 4:04:57 PM · Approved / Authors: Test Author · Created  |
| J7.3 | desktop | pass | link=http://localhost:5502/r/1i-aW2l4iiCnjcpN-ZtUWGtp; dialogs=0 |
| J7.4 | desktop | pass | Salt Basin Net WorksPrivate link · Demo Package Resume (career-bound) / DOWNLOAD PDF / PRINT / Pat Example / FINANCE SYSTEMS / pat@example.test / Scan or click for curren |
| J8.1 | desktop | pass | row shows Operations Manager |
| J8.2 | desktop | pass | banner=true; current=true; text="Salt Basin Net WorksPrivate link · Demo Package Resume (career-bound) / DOWNLOAD PDF / PRINT / The wording of this document has changed s |
| J10.1 | desktop | pass | ok 390: titleW=330; datesW=330; previewBelow=true; previewW=363; hscroll page=false dlg=false; legibility=Experience heading:14.57, Skills heading:14.57, Harborline card  |
| J11.1 | desktop | pass | myResume=true; careerSourcesCard=false |
| J11.2 | desktop | fail | aria=Career Sources to Review; firstLines=["Close","Every source you've attached — resume, LinkedIn, Indeed, Fiverr — carries equal weight. Nothing is picked automaticall |
| J11.3 | desktop | pass | aria=Career-bound resume editor; status="Status: Draft" |
| J8.3 | desktop | pass | printed=true; showCurrent=true |
| J8.4 | desktop | pass | notice="This version is published. Saving will not change it - your edits become a new draft version, and any QR link keeps showing the approved version until you approve |
| E.1 | desktop | pass | revertBefore=2; after=1; title=Finance Systems Director (orig Finance Systems Director); bullet=E1 bullet wording |
| E.5 | desktop | fail | invalidJson=true (rgb(92, 59, 8) / bg rgb(251, 235, 208) / border rgb(232, 201, 143)); unsupportedMsg=" Career Master until you approve a task. / Import and check against |
| E.3 | desktop | pass | UI: Convert disabled with row message; route returns 409 "1 reconciliation task for this package still need a decision (approve or reject) before it can be converted." (s |
| E.6 | desktop | pass | convertEnabledAfterDecline=true; inPreview=true; outputOnlyMarker=true; certCard="Certifications from Career Master / Heading on the output / Ledgerly Certified Consultan |
| E.4 | desktop | fail | UI_GAP: a Career Atom sync failure cannot be produced through the interface (it needs a server-side fault: broken Career Atom registry or database); under the fixed test  |
| E.2 | desktop | pass | Notice shown: "A skill selected for this output (#1) was removed from Career Master; it is left out." (spec says "such as ... no longer exists; it is left out of this out |
| J9.1 | desktop | pass | jobExperienceHeading=1; url=http://localhost:5502/world |
| J9.2 | desktop | pass | card=true; fields=true; title=Finance Systems Director; rowContrast={"color":"rgb(27, 42, 59)","bg":"rgb(255,255,255)","ratio":14.57,"text":"Finance Systems Director (Har |
| J9.3 | desktop | pass | badge=true; cmLine=true; revertButtons=1; livePreviewMs=523 |
| J9.4 | desktop | pass | lead(template)=true; director=false; text="Salt Basin Net Works / SALTBASIN.NET · RESUME / ⌘ PRINT / SAVE AS PDF / ← BACK / Test Member / SALTBASIN.NET · WE BUILD FOR THE |
| J9.5 | desktop | pass | valueAfterReopen=Finance Systems Lead (template); value=Finance Systems Director; revertBtns=0; badge=false; outHasDirector=true; outHasTemplate=false |
| J9.6 | desktop | pass | heading={"color":"rgb(95, 95, 95)","bg":"rgb(251,248,243)","ratio":6.03,"text":"Career Master wording for this output on"}; label={"color":"rgb(102, 102, 102)","bg":"rgb( |
| J9.7 | desktop | pass | card=true; selects=3; initial=Process design; badge=true; cmLine=true; revertBesideBox=1; skillOptions=Reword a skill for this output.../Forecast modeling/Process design/ |
| J9.8 | desktop | fail | toolOptionsInSelect=["Reword a tool for this output...","","QuoteFlow CPQ"]; toolNamedLedgerlyERP=false; toolBoxAriaLabel="Tool  for this output"; badges=3; cmLines(tool+ |
| J9.9 | desktop | pass | values=["Process design (template)","Ledgerly ERP (template)","Ledgerly Certified Consultant (template)"]; badges=3; cmLines=true; careerMasterUnchanged=true |
| J9.10 | desktop | fail | afterSkillRevert: skillBox=GONE (row removed from the list instead of reading Process design), badgesLeft=2, tool=Ledgerly ERP (template), cert=Ledgerly Certified Consult |
| J9.11 | desktop | pass | Informational scope note (by design, pending owner confirmation). Observed consistent with it: overrides persisted per preset (reopened in J9.9) and were applied on /outp |
| P.1 | setup-mobile | pass | missing=; tabs=Skills (0) / Jobs (2) / Tools (0) / Engagements (0) / Domains & Ventures (0) / Certifications (0) / Deals (0) |
| P.2 | setup-mobile | pass | missing=; tabs=Skills (2) / Jobs (2) / Tools (0) / Engagements (0) / Domains & Ventures (0) / Certifications (0) / Deals (0) |
| P.3 | setup-mobile | pass | missing=; tabs=Skills (2) / Jobs (2) / Tools (1) / Engagements (0) / Domains & Ventures (0) / Certifications (0) / Deals (0) |
| P.4 | setup-mobile | pass | missing=; tabs=Skills (2) / Jobs (2) / Tools (1) / Engagements (0) / Domains & Ventures (0) / Certifications (1) / Deals (0) |
| P.5 | setup-mobile | pass | Skills (2) / Jobs (2) / Tools (1) / Engagements (0) / Domains & Ventures (0) / Certifications (1) / Deals (0) |
| J1.1 | mobile | pass | CAREER-BOUND RESUMES / A career-bound resume reads its roles, bullets, skills, tools and certifications from Career Master, so a change there flows into it. Wording you c |
| J1.2 | mobile | fail | aria=Career-bound resume editor; orderOk=true; status="Status: Draft"; saveDisabled=true style={"opacity":"1","cursor":"pointer","bg":"rgb(196, 132, 58)","color":"rgb(255 |
| J2.1 | mobile | pass | toast=true; bullet1="Led the ledger consolidation across four regions." |
| J2.2 | mobile | pass | bullet2="Presented results to the board quarterly."; badges=5 |
| J2.3 | mobile | pass | live=true; both=true; heading="Preview (live, not saved yet)" |
| J2.4 | mobile | pass | toast=true; asSaved=true; badge2=true; badge1=false |
| J3.1 | mobile | pass | badge=true; revertButtons=1; cmLine=true; live5=true |
| J3.2 | mobile | pass | line="Led the ledger consolidation across five regions.OUTPUT-ONLY" next="•" |
| J3.3 | mobile | pass | value="Led the ledger consolidation across four regions."; badgeGone=true |
| J3.4 | mobile | pass | four=true; five=false |
| J4.1 | mobile | pass | badge=true; revert=true; legibilitySkillsRow={"color":"rgb(27, 42, 59)","bg":"rgb(255,255,255)","ratio":14.57,"text":"Process design (finance)output-only"} |
| J4.2 | mobile | pass | skills="SKILLS /  / Process design (finance)OUTPUT-ONLY /  / TOOLS & TECHNOLOGIES /  / Ledgerly ERP / " |
| J4.3 | mobile | pass | revertBtnsInCard=1; skills="SKILLS /  / Process design /  / TOOLS & TECHNOLOGIES /  / Ledgerly ERP /  / CERTIFICATIONS /  / Ledg" |
| J4.4 | mobile | pass | RESUME OUTPUT HISTORY / Finance systems resumeCAREER-BOUNDIMPORTED / Generated 10/9/2026, 4:40:27 PM · Draft / Version history / Edit sections / View / Download PDF / App |
| J5.1 | mobile | pass | row shows Finance Systems Director |
| J5.2 | mobile | pass | ← Back to World / My Resume / My Resume / Configure resume presets, generate tailored outputs, and preview or print directly from here. / Career Master Intake / Upload re |
| J6.1 | mobile | pass | ← Back to World / Career Sources to Review / Every source you've attached — resume, LinkedIn, Indeed, Fiverr — carries equal weight. Nothing is picked automatically when  |
| J6.2 | mobile | pass | filed=true; tags=[["Package differs from Career Master",true],["New bullet variant",true],["Add job",true],["New skill",true],["New tool",true],["New certification",true] |
| J6.3 | mobile | fail | Imported resumes you can convert to career-bound / Demo Package Resume (demo-pkg-2026 / resume_main) / 6 review tasks for this package still need a decision before it can |
| J6.4 | mobile | pass | cardText="PACKAGE DIFFERS FROM CAREER MASTER / Harborline Freight Systems - job title / CAREER MASTER NOW / Finance Systems Director / → / PACKAGE SAYS / Finance Systems  |
| J6.5 | mobile | pass | results=[["Westbrook Logistics - Operations Analyst","disappeared"],["bullet not in this job","disappeared"],["Revenue recognition - skill not in Caree","disappeared"],[" |
| J6.6 | mobile | pass | msg="Filed 1 output; 0 new tasks; 1 already decided or merged."; approveButtons=0 |
| J6.7 | mobile | pass | tabs=Skills (3) / Jobs (3) / Tools (2) / Engagements (0) / Domains & Ventures (0) / Certifications (2) / Deals (0); westbrook=true; director=true; lead=false |
| J6.8 | mobile | pass | enabled=true; created=true; aria=Career-bound output editor; checks={"cm":true,"badge":true,"west":true,"p1":true,"p2":true,"p3":true,"p4":true,"p5":true} |
| J6.9 | mobile | pass | Preview (as saved) / Pat Example / FINANCE SYSTEMS / pat@example.test / EXPERIENCE / Harborline Freight Systems / Finance Systems Director / Jan 2018 – Mar 2022 / • |
| J6.10 | mobile | fail | dialogs=["Career Sources to Review"]; headerLines={"first":["Close","Every source you've attached — resume, LinkedIn, Indeed, Fiverr — carries equal weight. Nothing is pi |
| J7.1 | mobile | pass | elow. / RESUME OUTPUT HISTORY / 1 technology needs a proficiency category before any output can be approved or shared (QuoteFlow CPQ). You’ll be asked to set it when you  |
| J7.2 | mobile | pass | title=true; onlyQuoteFlow=true; row="Demo Package Resume (career-bound)CAREER-BOUNDIMPORTED / Generated 10/9/2026, 4:43:21 PM · Approved / Authors: Test Author · Created  |
| J7.3 | mobile | pass | link=http://localhost:5502/r/a1AKOvOf3As_oXqs8Zrxue3y; dialogs=0 |
| J7.4 | mobile | pass | Salt Basin Net WorksPrivate link · Demo Package Resume (career-bound) / DOWNLOAD PDF / PRINT / Pat Example / FINANCE SYSTEMS / pat@example.test / Scan or click for curren |
| J8.2 | mobile | pass | banner=true; current=true; text="Salt Basin Net WorksPrivate link · Demo Package Resume (career-bound) / DOWNLOAD PDF / PRINT / The wording of this document has changed s |
| J8.3 | mobile | pass | printed=true; showCurrent=true |
| J8.4 | mobile | pass | notice="This version is published. Saving will not change it - your edits become a new draft version, and any QR link keeps showing the approved version until you approve |
| J9.1 | mobile | pass | jobExperienceHeading=1; url=http://localhost:5502/world |
| J9.2 | mobile | pass | card=true; fields=true; title=Finance Systems Director; rowContrast={"color":"rgb(27, 42, 59)","bg":"rgb(255,255,255)","ratio":14.57,"text":"Finance Systems Director (Har |
| J9.3 | mobile | pass | badge=true; cmLine=true; revertButtons=1; livePreviewMs=327 |
| J9.4 | mobile | pass | lead(template)=true; director=false; text="Salt Basin Net Works / SALTBASIN.NET · RESUME / ⌘ PRINT / SAVE AS PDF / ← BACK / Test Member / SALTBASIN.NET · WE BUILD FOR THE |
| J9.5 | mobile | pass | valueAfterReopen=Finance Systems Lead (template); value=Finance Systems Director; revertBtns=0; badge=false; outHasDirector=true; outHasTemplate=false |
| J9.6 | mobile | pass | heading={"color":"rgb(95, 95, 95)","bg":"rgb(251,248,243)","ratio":6.03,"text":"Career Master wording for this output on"}; label={"color":"rgb(102, 102, 102)","bg":"rgb( |
| J9.7 | mobile | pass | card=true; selects=3; initial=Process design; badge=true; cmLine=true; revertBesideBox=1; skillOptions=Reword a skill for this output.../Process design/Forecast modeling/ |
| J9.8 | mobile | fail | toolOptionsInSelect=["Reword a tool for this output...","","QuoteFlow CPQ"]; toolNamedLedgerlyERP=false; toolBoxAriaLabel="Tool  for this output"; badges=3; cmLines(tool+ |
| J9.9 | mobile | pass | values=["Process design (template)","Ledgerly ERP (template)","Ledgerly Certified Consultant (template)"]; badges=3; cmLines=true; careerMasterUnchanged=true |
| J9.10 | mobile | fail | afterSkillRevert: skillBox=GONE (row removed from the list instead of reading Process design), badgesLeft=2, tool=Ledgerly ERP (template), cert=Ledgerly Certified Consult |
| J9.11 | mobile | pass | Informational scope note (by design, pending owner confirmation). Observed consistent with it: overrides persisted per preset (reopened in J9.9) and were applied on /outp |
| J10.1 | mobile | pass | ok 390: titleW=330; datesW=330; previewBelow=true; previewW=363; hscroll page=false dlg=false; legibility=Experience heading:14.57, Skills heading:14.57, Harborline card  |
| J11.1 | mobile | pass | myResume=true; careerSourcesCard=false |
| J11.2 | mobile | fail | aria=Career Sources to Review; firstLines=["Close","Every source you've attached — resume, LinkedIn, Indeed, Fiverr — carries equal weight. Nothing is picked automaticall |
| J11.3 | mobile | pass | aria=Career-bound resume editor; status="Status: Draft" |
| E.1 | mobile | pass | revertBefore=2; after=1; title=Finance Systems Director (orig Finance Systems Director); bullet=E1 bullet wording |
| E.5 | mobile | fail | invalidJson=true (rgb(92, 59, 8) / bg rgb(251, 235, 208) / border rgb(232, 201, 143)); unsupportedMsg=" Career Master until you approve a task. / Import and check against |
| E.3 | mobile | pass | filed="Filed 1 output; 1 new task."; certCard=true; convertDisabled=true; rowText="Edge Package Resume (demo-pkg-edge / resume_edge) / 1 review task for this package stil |
| E.6 | mobile | pass | convertEnabledAfterDecline=true; inPreview=true; outputOnlyMarker=true; certCard="Certifications from Career Master / Heading on the output / Ledgerly Certified Consultan |
| E.4 | mobile | fail | UI_GAP: a Career Atom sync failure cannot be produced through the interface (it needs a server-side fault: broken Career Atom registry or database); under the fixed test  |
| E.2 | mobile | pass | deleteButtons=1; notice="A skill selected for this output (#1) was removed from Career Master; it is left out." |
| E.7 | mobile | pass | appErrors=11; expectedGate409=2(entries: http_error+console_error); ERR_ABORTED navigation cancels (not counted)=5; deliberate negative-test responses (E.5 400, E.3 409)= |
| J8.1 | mobile | pass | Jobs list shows Operations Manager (re-checked after the first capture caught the list still on "Loading...": step 8.1 save itself succeeded, the J8.2 page shows the new  |
| E.7 | desktop | pass | appErrors=11; expectedGate409=2(entries: http_error+console_error); ERR_ABORTED navigation cancels (not counted)=5; deliberate negative-test responses (E.5 400, E.3 409)= |
