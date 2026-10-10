# Test result: output-version-history, round 3

Validator: val-5500-14. Code under test: integration head `0fd2110` (`claude/zealous-meitner-5tuft5`). Evidence: `/var/tmp/sbpg/release-loop/output-version-history/round-3/` (`steps.jsonl`, screenshots `desktop-*.png` / `mobile-*.png`).

Score (from `release-spec-baseline.mjs score`, copied verbatim):

```json
{ "feature": "output-version-history", "baseline": 2,
  "specSha256": "20c124641a9bbd9b94bf0bce8508107a79f8b75a69fc8742cdb052457c9e8b66",
  "total": 37, "passed": 30,
  "failed": ["J1.2","J1.4","J2.4","J3.2","J5.1","J6.1","E.2"],
  "blocked": [], "notRun": [], "preconditionsFailed": [],
  "observations": ["E.3-superseded-measurement","MCP"] }
```

Baseline v2 (`check` passed: "baselines match: output-version-history v2"); the baseline version did not change since round 2, so no diff table is needed (same 37 ids as round 2). passed = false. Round 2 scored 30/37 with the same failed list.

## Setup (fixed constraints)
Fresh database `sb_rl_val_5500_14`, `npm run build`, production server on port 5528, `npm run seed`, `scripts/create-test-member.mjs`. Desktop 1280x900 as `member@test.local`; phone 390x844 isMobile+hasTouch as `member2@test.local` (so the phone walkthrough starts from the same empty state); `second@test.local` for E.5. Display name of the harness accounts is "Test Member". Chromium pinned, light, en-US, TZ=UTC; logged in once per surface through the login form and the session reused. Fixtures `/tmp/ovh-a|b/ovh-resume.txt` verified to match the spec text. E.6 used a different-named file with the same text as ovh-a (the spec gives no fixture for E.6).

## Fix verification by step id
No product fixes this round. Amendments A6 (rejected), A7 (needs_owner), A8 (rejected) leave the spec unchanged, so the same failures recur:
| Step | Result |
|---|---|
| J1.4, J2.4, J3.2, J6.1 (A6 rejected) | Still fail, AMBIGUOUS: structure matches, but the name reads "Test Member", not "Riley Fenn" |
| E.2 (A7 needs_owner) | Still fail, UI_GAP |
| J4.2 (A8 rejected) | Passes; see observation 1 |
| J1.2, J5.1 | Pass on desktop, fail on mobile (MOBILE_GAP, unchanged) |

## Failures
- **J1.2 (mobile) MOBILE_GAP**: at 390px **Classic Tools** shows only the Career Placement Agents panel squashed into a narrow column; the tool list (MY RESUME, CAREER MASTER) is not reachable by touch (only "Back to World" and "+ Track Opportunity" are tappable). Screenshot `mobile-j1-classic.png`. Walked on through Journeys -> My Resume card, which works. Desktop passed.
- **J5.1 (mobile) MOBILE_GAP**: same cause. Via Journeys -> Career Master card the edit works (Director saved). Desktop passed.
- **J1.4, J2.4, J3.2, J6.1 (both surfaces) AMBIGUOUS**: every structural expectation matched (titles, version counts, statuses, UTC dates `Oct 9, 2026, hh:mm UTC`, `1 added, 1 changed` / `1 added, 2 changed` / `1 changed`, slider, frozen/live notes, no proficiency dialog), but the spec names `Riley Fenn` (document heading, "Approved by", "approved by Riley Fenn.") while the fixed harness account shows `Test Member`. Proposed wording: the member's display name, one value only: `Test Member` for account `member@test.local`, listed at J1.4, J2.4, J3.2, J6.1. Not a product defect.
- **E.2 (both) UI_GAP**: no point-and-click way to make a saved version unreadable (needs corrupt stored content, a database edit). Not exercised (A2/A7 needs_owner).
- **MCP_GAP** (observation id `MCP`, not scored): `server/lib/mcpToolRegistry.js` now exists, but has no tool to list an output's versions, compare two versions or read a version body as it stood (UI uses `GET /api/resume-outputs/:id/versions`); `server/lib/capabilityParity.js` itself lists `resume-output-versions` with `mcp: null`. I did not call the MCP endpoint (it needs a bearer token minted in the UI); the registry source is the evidence.

## Passed (both surfaces unless stated)
J1.1, J1.3, J1.5, J2.1 (confirmation text `Approve "Version demo resume" as the final version for its QR code? …` seen), J2.2, J2.3, J3.1, J3.3, J3.4, J4.1-J4.6, J5.2, J5.3, J6.2, J6.3, J7.1-J7.6, E.1, E.3, E.4, E.6, E.5 (cli), and J1.2 / J5.1 on desktop. Notes:
- Slider driven by keyboard (focus, Home/End) and by tapping/clicking the `v1`/`v2` labels. `four` is a DEL with line-through (red), `five` an INS underlined (green); chips CHANGED / ADDED / REMOVED; Hide unchanged text removes grey lines; equal selects show "Pick two different versions to see what changed."
- E.5: as `second@test.local`, `GET /api/resume-outputs/3/versions` printed `{"error":"Resume output not found"} 404`; the first member gets 200 for the same id.
- E.3 simulated by a browser network rule returning HTTP 500 (no API call used for the step): red alert, Retry button and error toast; Retry then loads the history. On the phone the first measurement checked for the toast at 400 ms and missed it; it was re-measured with 100 ms polling (toast present, Retry loads). The earlier line is kept in `steps.jsonl` renamed `E.3-superseded-measurement` (so it appears under observations, not in the score).
- Phone: history dialog 374px wide inside 390 (about 8px margins), document scroll width 390 = 390, the versions table scrolls inside its card (Approved by / Changes columns reachable by horizontal scroll).
- Dates show Oct 9, 2026 (the test clock), not Oct 2.

## Observations (not scored)
1. Unchanged-line type labels in TRACKED CHANGES read NAME, HEADING, ROLE; J4.2 lists "HEADER fields". I scored J4.2 pass (CHANGED/ADDED chips, red strike, green underline, grey labelled unchanged lines all matched; the trailing "…" is open), consistent with round 2. Spec wording looks stale (A8 asks for exactly NAME, HEADING, ROLE).
2. Interface parity at 390px: the whole Classic Tools tool list is unreachable (cause of the two MOBILE_GAP failures); Journeys cards reach the same panels.
3. E.5 used the spec's `second@test.local`; the output id comes from the first member's list (Version demo resume newest row is id 3).
4. No `pageerror` and no failed app requests logged. Simulated E.3 failures were fulfilled by the browser route, so no `http_error` lines. External font/CDN requests blocked by the sandbox appear as `external_blocked`.
5. J6.3: the first "Version history" button on the page is the row button behind the editor; the in-editor button was addressed through the editor dialog (`aria-label="Career-bound resume editor"`).
6. Requirement gaps from earlier rounds (B8, B10, B11) are covered by no baseline step and were not re-tested.

## Cleanup
Server stopped (PID file), both browser daemons stopped, database `sb_rl_val_5500_14` dropped. No product code, specs or baselines changed; nothing committed.
