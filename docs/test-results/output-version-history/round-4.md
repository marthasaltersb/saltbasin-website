# Test result: output-version-history, round 4

Validator: val-5500-2. Code under test: integration head `0800b1c` (`claude/zealous-meitner-5tuft5`, "Merge release-loop/release-intelligence-spec-r1 (amendments A1, A2: baseline v3)"). Evidence: `/var/tmp/sbpg/release-loop/output-version-history/round-4/` (`steps.jsonl`, screenshots `desktop-*.png` / `mobile-*.png`).

Score (from `release-spec-baseline.mjs score`, copied verbatim):

```json
{ "feature": "output-version-history", "baseline": 3,
  "specSha256": "212fa625fbffedabe0b984e9c6dc89b5d595ad7be345405b6d947bf01a19a6f1",
  "total": 37, "passed": 34,
  "failed": ["J1.2","J5.1","E.2"],
  "blocked": [], "notRun": [], "preconditionsFailed": [],
  "observations": ["MCP"] }
```

`check` passed ("baselines match: output-version-history v3", amendment A9). The baseline moved from v2 to v3 since round 3; `diff`: comparable 33, same = every id except **changed J1.4, J2.4, J3.2, J6.1** (the A9 wording: the member's name is now `Test Member`, not `Riley Fenn`); added none, retired none; context changed: Preconditions section. Scores are comparable like for like: round 3 was 30/37 with failures J1.2, J1.4, J2.4, J3.2, J5.1, J6.1, E.2; now J1.4, J2.4, J3.2, J6.1 pass. passed = false.

## Setup (fixed constraints)
Fresh database `sb_rl_val_5500_2`, `npm run build`, `npm run seed`, production server on port 5504, `scripts/create-test-member.mjs` (member@test.local), plus `second@test.local` (E.5) and `member2@test.local` (phone walkthrough from the same empty state, as in round 3). Desktop 1280x900 as member@test.local; phone 390x844 isMobile+hasTouch as member2. Chromium pinned, light, en-US, TZ=UTC; logged in once per surface through the login form, session reused; tap on phone. Fixtures `/tmp/ovh-a|b/ovh-resume.txt` match the spec. A stale `round-4/` evidence folder from an earlier attempt (other port) was moved aside to `/var/tmp/sbpg/agents/val-5500-2/stale/` so only this run is scored.

## Fix verification by step id / open bug
| Item | Result |
|---|---|
| J1.4, J2.4, J3.2, J6.1 (T8 / A9 wording `Test Member`) | Now pass on both surfaces. T8 resolved by the spec change. |
| B14 (spec preconditions/Journey 0 used other credentials) | Resolved: spec v3 Journey 0 uses member@test.local. |
| T1 (mobile drawer; J1.2, J5.1) | Still fails at 390px: **MOBILE_GAP** (details below). Desktop passes. |
| T3 / E.2 (no UI way to make a version unreadable) | Still **UI_GAP** (both surfaces). Not exercised. |
| T4 (foreign output id) | Product correct: E.5 passes (404 `{"error":"Resume output not found"}`). The UI_GAP wording is moot. |
| T5 / T11 (MCP) | Fixed: `output_versions_list`, `output_version_read`, `output_versions_compare` (and `resume_output_versions`) exist and match the UI/API (see below). Observation id `MCP`, pass. |
| B8 / T9 (draft wording not frozen) | Unchanged by design: J3.1 and J5.3 require drafts to resolve live from Career Master and pass. Still needs an owner decision (not a step). |
| B10 / T6 (chart-only changes show no diff) | Not fixed: `src/lib/outputVersionDiff.js` has no chart handling (code read). No baseline step. |
| B11 / T7 (no entry in OutputTemplateConfigurator) | Not fixed: `OutputTemplateConfigurator.jsx` has no Version history control (code read). No baseline step. |
| T10 (unchanged-line labels) | Unchanged: labels read NAME / HEADING / ROLE; spec says "HEADER fields ...". J4.2 scored pass (see observation 1). |

## Failures
- **J1.2 (mobile) MOBILE_GAP**: at 390px **Classic Tools** shows only the Career Placement Agents panel in a squashed column (scene ~45px wide, Back to World overlapping the heading); the tool list (MY RESUME, CAREER MASTER, ...) is not reachable by touch: visible controls are only "Back to World" and "+ Track Opportunity", and no drawer/menu control is rendered. Screenshot `mobile-j1-classic.png`. I continued via Journeys -> My Resume, which works (J1.3-J1.5 pass). Desktop: pass (tab bar).
- **J5.1 (mobile) MOBILE_GAP**: same cause for CAREER MASTER / MY RESUME. Via Journeys -> Career Master the title change saved as `Finance Systems Director`; desktop pass.
- **E.2 (desktop and mobile) UI_GAP**: no point-and-click way to make a saved version unreadable (needs corrupt stored content, i.e. a database edit). Not exercised.

## Passed
J1.1, J1.3, J1.4, J1.5, J2.1-J2.4, J3.1-J3.4, J4.1-J4.6, J5.2, J5.3, J6.1-J6.3, J7.1-J7.6, E.1, E.3, E.4, E.6 on desktop and mobile; J1.2 and J5.1 on desktop; E.5 (cli). Notes:
- Dialogs show `Oct 10, 2026, hh:mm UTC`; Approved by reads `Test Member, Oct 10, 2026, hh:mm UTC`; v1/v2/v3 statuses, change counts (`1 added, 1 changed` / `1 added, 2 changed` / `1 changed`), frozen/live notes, no proficiency dialog all matched.
- Approve confirmation text: `Approve "Version demo resume" as the final version for its QR code? You'll be recorded as the approver. ...` accepted on both surfaces.
- `four` is a DEL (line-through, red rgb(122,35,35)), `five` an INS (underline, green rgb(20,83,45)); chips CHANGED/ADDED/REMOVED; Hide unchanged text leaves only CHANGED/REMOVED; equal selects show "Pick two different versions to see what changed."
- J7: re-import with the same name keeps one imported-resume row and gives `2 versions`; Escape closes only the dialog, the editor stays.
- Phone: history dialog 374px wide inside 390 (about 8px margins), document scroll width 390.
- E.3 simulated by a browser network rule returning HTTP 500 (no API shortcut): alert "Could not load version history: Simulated server error", Retry button, error toast (polled at 100 ms, found on both surfaces); Retry loads the history. The two logged `http_error` 500s and matching `console_error` lines are that simulation.
- E.4: the dialog contains only Close, the v1/v2 slider labels, the range slider, two compare selects and the Hide-unchanged checkbox. (My first evaluation of E.4 on desktop rejected the slider-label buttons because of a too-narrow control whitelist; I corrected that line in `steps.jsonl` with a note, and the mobile run used the corrected check.)
- E.5: as `second@test.local`, `GET /api/resume-outputs/1/versions` printed `{"error":"Resume output not found"} 404`; as the first member, 200 with the versions.

## Interface parity
- Desktop and 390px phone walkthrough both done for every browser step. Only MOBILE_GAP: the Classic Tools tool list at 390px (J1.2, J5.1).
- API route seen: `GET /api/resume-outputs/:id/versions` (the UI call).
- MCP (observation id `MCP`, pass): created a token in the UI (World Shell -> Journeys -> Connected Agents, scope career.read), then called `/mcp` as that member. `output_versions_list` returned the same 3 versions, statuses, dates, approvedBy and change summaries as the API; `output_version_read` v1 shows `four regions` / `Finance Systems Lead` (no `five regions`, no `Director`) and v3 shows `every quarter` / `Director`; `output_versions_compare` v1->v2 = `1 added, 2 changed` (matches the dialog), v2->v1 = `1 removed, 2 changed`; a foreign output id returned `isError` with `Error 404 not_found: Resume output not found`. `server/lib/capabilityParity.js` row `resume-output-versions` lists these tools.

## Observations (not scored)
1. Unchanged-line type labels in TRACKED CHANGES read NAME, HEADING, ROLE; J4.2 lists "HEADER fields". J4.2 scored pass (chips, red strike, green underline, grey labelled unchanged lines all match; trailing "..." is open). Suggest the spec wording follow the product (T10).
2. Requirement gaps B10 (chart-only change shows no diff) and B11 (no Version history entry in the Output Template editor) remain open; confirmed by reading the code, no step covers them, not tested in the browser.
3. B8: draft wording is live by design (J3.1/J5.3); a freeze would contradict those steps and needs an owner decision.
4. The dialog's first "Version history" button on the page belongs to the row behind the editor; the in-editor button was addressed through the editor dialog (`aria-label="Career-bound resume editor"`).
5. The `external_blocked` entries are the sandbox's font/CDN certificate failures; no `pageerror` and no failed app request (`requestfailed`) was logged.
6. Dates show Oct 10, 2026 (the test clock), not Oct 2.

## Cleanup
Server (PID 9868, found by PORT=5504 and cwd) and both browser daemons stopped; database `sb_rl_val_5500_2` dropped. No product code, specs or baselines changed; nothing committed.
