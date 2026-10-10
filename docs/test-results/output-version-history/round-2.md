# Test result: output-version-history, round 2

Validator: val-5500-6. Code under test: integration head `058cf24` (`claude/zealous-meitner-5tuft5`, "Merge ... spec amendment A1 (output-version-history baseline v2)"). Evidence: `/var/tmp/sbpg/release-loop/output-version-history/round-2/` (`steps.jsonl`, screenshots `desktop-*.png` / `mobile-*.png`).

Score (from `release-spec-baseline.mjs score`, copied verbatim):

```json
{ "feature": "output-version-history", "baseline": 2,
  "specSha256": "20c124641a9bbd9b94bf0bce8508107a79f8b75a69fc8742cdb052457c9e8b66",
  "total": 37, "passed": 30,
  "failed": ["J1.2","J1.4","J2.4","J3.2","J5.1","J6.1","E.2"],
  "blocked": [], "notRun": [], "preconditionsFailed": [], "observations": ["MCP"] }
```

Baseline v2 (`check` passed: "baselines match: output-version-history v2"). passed = false.

Baseline diff v1 -> v2 (amendment A1): comparable 36 ids, all same except E.5 (changed: now an exact curl command with body and status, moved to the `cli` surface). Scores are comparable like for like only with E.5's new form. Round 1 on v1: 33/37, failures J1.2, J5.1, E.2, E.5.

## Setup (fixed constraints)
Fresh database `sb_rl_val_5500_6`, `npm run build`, production server (`NODE_ENV=production node server/index.js`) on port 5512, `npm run seed`, `scripts/create-test-member.mjs`. Desktop 1280x900 as `member@test.local`; phone 390x844 isMobile+hasTouch as a second member `member2@test.local` (so the phone walkthrough starts from the same empty state). Both have display name "Test Member". Chromium pinned, light, en-US, TZ=UTC. Logged in once per surface through the login form and reused the session. The fixtures `/tmp/ovh-a/ovh-resume.txt` and `/tmp/ovh-b/ovh-resume.txt` already existed with exactly the spec's text (verified). E.6 used a different-named file made from the same text (the spec gives no fixture for E.6).

## Fix verification by step id (no product fixes this round)
| Step | Result |
|---|---|
| E.5 (amendment A1, now cli) | PASS. Logged in as second member `member2@test.local` via curl, `GET /api/resume-outputs/7/versions` printed `{"error":"Resume output not found"} 404`, no version data; control: the first member's own id 7 returns 200. Id 7 was read from the first member's Resume Output History request in the browser. |
| J1.2, J5.1 (mobile) | Still FAIL (MOBILE_GAP, unchanged, see below). |
| E.2 | Still FAIL (UI_GAP; A2 is `needs_owner`). |
| A3 / B10 (chart-only changes) | No baseline step; A3 rejected. Not tested. |
| A4 (entry point in Output Template editor) | No baseline step; `needs_owner`. Not tested. |
| A5 (account/label) | Rejected. The J4.2 "HEADER fields" label wording is unchanged in the spec (see observations). |

## Failures
- **J1.2 (mobile) MOBILE_GAP**: at 390px **Classic Tools** shows only the Career Placement Agents panel squashed into a narrow column (scene about 45px wide, "Tracked Opportunities" card clipped, "Back to World" button overlapping the heading). The tool list (MY RESUME, CAREER MASTER, ...) is not reachable by touch; the only visible buttons are "Back to World" and "+ Track Opportunity". Screenshot `mobile-j1-classic.png`. The walkthrough continued through the **Journeys** cards (My Resume, Career Master), which work. Desktop passed.
- **J5.1 (mobile) MOBILE_GAP**: same cause (route Classic Tools -> CAREER MASTER / MY RESUME). Via Journeys cards the edit works (title saved as Finance Systems Director). Desktop passed.
- **J1.4, J2.4, J3.2, J6.1 (both surfaces) AMBIGUOUS**: every structural expectation matched (titles, version counts, statuses, UTC dates `Oct 9, 2026, hh:mm UTC`, `1 added, 1 changed` / `1 added, 2 changed` / `1 changed`, slider behaviour, frozen/live notes, no proficiency dialog), but the spec names the person `Riley Fenn` (document heading, "Approved by Riley Fenn", "approved by Riley Fenn.") while the fixed harness account displays `Test Member`. Under the fixed test constraints the account cannot be Riley Fenn, so the literal text cannot appear. Proposed wording: "the member's display name (`Riley Fenn` in the fixtures of Journey 0, `Test Member` under the harness account `member@test.local`)", listing J1.4, J2.4, J3.2, J6.1 (A5 already rejected the combined proposal; this is the account-and-fixture amendment it asked to be resubmitted separately). Not a product defect.
- **E.2 (both) UI_GAP**: no point-and-click way to make a saved version unreadable (needs corrupted stored content, i.e. a database edit, which is forbidden). Not exercised. Amendment A2 is `needs_owner`.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp)**: `server/lib/mcpToolRegistry.js` does not exist. Capabilities with no MCP tool: list an output's versions with dates and approval metadata (UI calls `GET /api/resume-outputs/:id/versions`), compare two versions (tracked changes), read a version body as it stood. Not part of the score (logged as id `MCP`).

## Passed (both surfaces unless stated)
J1.1, J1.3, J1.5, J2.1, J2.2, J2.3, J3.1, J3.3, J3.4, J4.1-J4.6, J5.2, J5.3, J6.2, J6.3, J7.1-J7.6, E.1, E.3, E.4, E.6, E.5 (cli), and J1.2 / J5.1 on desktop. Notes:
- Slider: Home/End by keyboard (focus then key) on both surfaces; labels `v1`/`v2` clicked (desktop) or tapped (mobile). Tracked changes: `four` is a `DEL` with `line-through` in red, `five` an `INS` underlined in green, chips CHANGED / ADDED / REMOVED, Hide unchanged text removes grey lines, equal selects show "Pick two different versions to see what changed."
- J6.1: no proficiency dialog appeared; v2 `1 added, 2 changed`, frozen-wording note shown.
- J6.3: the first "Version history" button in the page was the row button behind the editor; the in-editor button had to be selected through the editor dialog (`aria-label="Career-bound resume editor"`). A user clicking the editor's own button is unaffected.
- Phone: history dialog 374px wide inside 390 (about 8px margins), document scroll width 390 = 390, versions table scrolls inside its card (Approved by / Changes columns off to the right until scrolled).
- E.3 driven by a browser network rule returning HTTP 500 for the versions request (no API call used): red alert "Could not load version history: Simulated server error", a **Retry** button and an error toast appeared; Retry then loaded the history. The first mobile measurement missed the toast by timing and was re-measured with polling (that earlier superseded line was removed from `steps.jsonl`).
- E.6: a differently named import created its own row with its own 1-version history while `ovh-resume.txt` kept 2 versions.
- Dates show Oct 9, 2026 (the test clock), not Oct 2.

## Observations (not scored)
1. Unchanged-line type labels in TRACKED CHANGES read NAME, HEADING, ROLE; J4.2 lists "HEADER fields". The spec wording looks stale (proposed: "NAME").
2. Interface parity at 390px: the whole Classic Tools tool list is unreachable (the cause of two MOBILE_GAP failures). The Journeys cards reach the same panels.
3. Spec E.5 says the second member is created with `--email second@test.local`; I used `member2@test.local` (same script, same pattern) because the phone walkthrough already used that account. Result identical.
4. No `pageerror` and no genuine request failures. The `http_error`/`console_error` 500 lines on `/api/resume-outputs/{7,14}/versions` are my own simulated E.3 failures. `external_blocked` lines are fonts and the CDN three.js, blocked by the sandbox.
5. Requirement gaps named in the fix details (B8 draft content not frozen, B10 chart-only changes show no diff, B11 no Version history entry point in the Output Template editor) are covered by no baseline step; not re-tested (A3 rejected, A4 needs_owner).

## Cleanup
Server (PID file) stopped, both browser daemons stopped, database `sb_rl_val_5500_6` dropped. No product code, specs or baselines changed.
