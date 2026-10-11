# Test result: graphify-data-model-map, round 1

- Feature: Graphify data model map (World Shell)
- Round: 1 (validation agent val-16800-3)
- Commit tested: `eeb9263` (integration head `claude/zealous-meitner-5tuft5`)
- Date: 2026-10-11
- Environment: fresh database `sb_rl_val_16800_3` + `npm run seed`, production build on port 16806, test accounts from `scripts/create-test-member.mjs`, Chromium 1194 via Playwright, desktop 1280x900 and mobile 390x844 (isMobile, hasTouch), light, en-US, UTC. Two windows (admin and member) signed in at once, through the login form.

## Score (from `release-spec-baseline.mjs score`)

```json
{
  "feature": "graphify-data-model-map",
  "baseline": 1,
  "specSha256": "a407bca04dd4895f8bb3d4f28adc4b55a94fa43f654718f4cdc564062e92b5a4",
  "total": 60,
  "passed": 59,
  "failed": ["J1.1"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Baseline check: `baselines match: graphify-data-model-map v1`. Result: **not passed (59 of 60)**.

Step log: `/var/tmp/sbpg/release-loop/graphify-data-model-map/round-1/steps.jsonl`. Screenshots and command transcripts are in the same folder, named `<stepId>-<surface>.png|txt`.

## Failure

### J1.1 (mobile) - AMBIGUOUS
- Expected (spec): breadcrumb `Sun › Journeys › Data model map`, at both widths.
- Seen at 390px: the shared World Shell breadcrumb collapses a deep trail to `… › Data model map`. Tapping `…` (aria-label "Show full trail") shows Sun, Journeys, Data model map. Heading, Map tab selected, Settings tab and no alert were all correct. Desktop shows the full trail and passes.
- Evidence: `J1.1-mobile.png`, `J1.1-mobile-trail-expanded.png`. The collapse is documented in `src/components/WorldBreadcrumbs.jsx`.
- Proposed amendment wording: "On a phone (390px) the breadcrumb reads `… › Data model map`, and tapping `…` shows Sun, Journeys, Data model map. On desktop it reads `Sun › Journeys › Data model map`."

## Per-step results

Pass on desktop and mobile unless noted. "Seen" is abbreviated; the full text is in steps.jsonl.

| Step | Result | Seen |
|---|---|---|
| P.1, P.2 | pass (setup) | Form login as admin and member lands on the World Shell with World / Journeys / Classic Tools |
| P.3 | pass | `REPORT.md catalog.json graph.json view.html` |
| J1.1 | desktop pass, mobile FAIL | see above |
| J1.2 | pass | `Graphify 0.9.84 - generated from commit e63df368c on 2026-10-11 - AI pass: none` |
| J1.3 | pass | 229 tables, 2653 columns, 313 foreign keys, 10 domains |
| J1.4 | pass | All domains selected, then the ten domains with REPORT.md counts (21, 34, 35, 4, 21, 44, 12, 36, 20, 2) |
| J1.5 | pass | dark panel (rgb 15,23,26), 1 canvas, drag text, Reset view, accessible name starts "Data model crystal view" |
| J1.6 | pass | ten headings, `career_jobs 15 cols`, `career_skills 12 cols`, `career_tools 13 cols`, empty-detail text present |
| J2.1 to J2.12 | pass | filter, search (1 / 4 / 27 / 0 matches), table detail (15 columns, References (1), Referenced by (0), routes (10), modules (4)), users.id jump, Clear |
| J3.1 to J3.3 | pass | drag (mouse on desktop, touch scroll gesture on mobile) leaves the canvas drawn with no alert; Reset view fine; the crystal image differs between Career-only and All domains |
| J4.1 to J4.6 | pass | empty name gives red alert plus red toast, save gives version 2, Career (22) / Leads (35), survives reload, restore default |
| J5.1, J5.2 | pass | `Picker key: career_jobs ...` and `career_jobs.company` notes |
| J6.1 | pass | token `sbpat_...` once-only box, closes on "I have copied it" |
| J6.2 | pass (cli) | 6 tool lines plus `6 tools`, exit 0 |
| J6.3 to J6.7 | pass (cli) | 15 columns / domain career / pk ["id"]; total 4; one field career_jobs.company; 404 not_found message; 400 message |
| J6.8, J6.9, J6.12 | pass (cli) | picker objects for career_jobs/skills/tools; 401 without cookie; 403 as member |
| J6.10, J6.11 | pass | member sees Connected Agents and no Data model map card; member MCP call returns the exact 403 forbidden message |
| J6.13 | pass | all three cards show Website ready, API ready, MCP ready |
| J6.14 | pass (cli) | last line `OK: the registry matches the code.` |
| J7.1 | pass | venv and pip install exit 0, `graphifyy 0.9.84` listed (run once per surface) |
| J7.2 | pass | exit 0 in 31 to 42 s, ordered lines, sb_graphify_N created and dropped with the same N |
| J7.3 to J7.5 (cli) | pass | 4 files, 0 leftover databases, `0.9.84 false false true true true string 40`, 229 polygons = 229 tables, git status clean |
| J8.1 to J8.6 | pass | 390px: tiles wrap to 2 rows, docScrollWidth = 390, minimum tap-target height 44 across 246 controls, detail below list, red alert visible, Agents-only list, crystal width equals content width (316px) |
| E.1, E.2, E.5 | pass | empty search no-op; `1 match for "CAREER_JOBS".`; New domain not shown as a button, restore default works |
| E.3, E.4 | pass | messages match, `exit=2`, git status clean (run once per surface) |
| E.6 | pass (cli) | `isError: false`, source default |

J8 was also run at 1280px (the baseline lists desktop and mobile). The phone-only expectations (tiles wrapping into rows, detail below the list) are recorded as facts there. At 1280px the tiles sit in one row and the detail is beside the list, and these checks were treated as not applicable. The 44px tap targets, no horizontal scroll and the other checks held at both widths.

## Console errors and failed requests

- No `pageerror` events. No failed app requests.
- Four `400 PUT /api/data-model/rules` responses are the expected rejections in J4.2 and J8.5, on both surfaces.
- `external_blocked` (4): `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`, blocked by the sandbox, on the login page. The matching console "Failed to load resource" lines are the same event.

## Interface parity

- Website, desktop and 390px: every journey walked by clicking or tapping. The only setup exception was `scripts/create-test-member.mjs`. The J6 command steps use curl and the MCP client as the spec's own text says.
- API routes used by the UI: `GET /api/data-model/catalog|search|tables/:name|picker|rules`, `PUT` and `DELETE /api/data-model/rules`.
- MCP: the 6 `data_model_*` tools exist and match the UI (table `career_jobs` has 15 columns, search "company" gives 4, picker gives one field). Permission parity holds: a member token and a member cookie are both refused with 403. No `MCP_GAP`, `UI_GAP` or `MOBILE_GAP` found.

## Observations (not scored)

1. E.3: the not-installed message is preceded by one blank line, so the output does not literally begin with `graphify-data-model:`. The text is otherwise exact, and the step was treated as a pass.
2. J8.5 on a phone: the Settings page is about 3000px tall. After tapping **Save grouping** at the bottom, the in-page red alert is at the top of the page, far off screen. Only the red toast at the bottom is visible, and it fades. The step passes because the red message was fully visible, but the inline alert is not scrolled into view.
3. The `npm run seed` output prints PostgreSQL NOTICE objects ("column already exists, skipping") that look like errors. Cosmetic.
4. A server started with `npm start` and no `NODE_ENV=production` does not serve `dist/`, so `/login` returns "Cannot GET /login". Test-harness note, not a product defect.

## Fix details received

None (round 1).

## Cleanup

Server stopped, database `sb_rl_val_16800_3` dropped. The `sb_graphify_*` databases were dropped by the generator itself. Worktree files unchanged (no product code, specs or baselines edited).
