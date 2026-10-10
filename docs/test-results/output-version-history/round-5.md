# Test result: output-version-history, round 5

Validator: val-5500-2. Code under test: integration head `faaebbf` (`claude/zealous-meitner-5tuft5`, "Resume: a passed feature whose only open bugs wait on the owner is not relaunched"). Evidence: `/var/tmp/sbpg/release-loop/output-version-history/round-5/` (`steps.jsonl`, screenshots `desktop-*.png` / `mobile-*.png`).

Score (from `release-spec-baseline.mjs score`, copied verbatim):

```json
{ "feature": "output-version-history", "baseline": 3,
  "specSha256": "212fa625fbffedabe0b984e9c6dc89b5d595ad7be345405b6d947bf01a19a6f1",
  "total": 37, "passed": 34,
  "failed": ["J1.2","J5.1","E.2"],
  "blocked": [], "notRun": [], "preconditionsFailed": [], "observations": [] }
```

`check` passed ("baselines match: output-version-history v3", amendment A9). The baseline is still v3 (same as round 4), so no `diff` table is needed: the score is directly comparable to round 4 (34/37, same three failures). passed = false.

## Setup (fixed constraints)
Fresh database `sb_rl_val_5500_2`, `npm run build`, `npm run seed`, production server on port 5504, test accounts from `scripts/create-test-member.mjs`: `member3@test.local` (desktop 1280x900), `member2@test.local` (phone 390x844 isMobile+hasTouch, started from the same empty state), `second@test.local` (E.5). Chromium pinned, light, en-US, TZ=UTC; one login per surface through the login form, session reused; tap on phone. Fixtures `/tmp/ovh-a|b/ovh-resume.txt` match the spec. A first desktop attempt reached MY RESUME through the World card instead of Classic Tools; I discarded that attempt (moved to `/var/tmp/sbpg/agents/val-5500-2/stale5/`) and redid the whole desktop walk on a clean member so J1.2 followed Classic Tools -> MY RESUME literally. Only this clean run is scored.

## Fix verification by step id / open bug
| Item | Result |
|---|---|
| J1.4, J2.4, J3.2, J6.1 (T8, "Test Member" wording) | Pass on desktop and mobile. T8 resolved by the spec v3 wording. |
| B14 (spec preconditions/Journey 0 credentials) | Resolved by spec v3 (member@test.local style account). |
| J1.2 / J5.1 mobile (Classic Tools tool list at 390px) | Still fails: **MOBILE_GAP**. Classic Tools at 390px shows only the Career Placement Agents panel (scene column ~45px wide, Back to World overlapping the heading); visible buttons are Sun, Copy link, Back to World, + Track Opportunity. MY RESUME / CAREER MASTER cannot be tapped (screenshot `mobile-j1-classic.png`). I continued through Journeys -> My Resume / Career Master, which works. Desktop passes both. |
| E.2 / T3 (no UI way to make a version unreadable) | Still **UI_GAP** on desktop and mobile; not exercisable without corrupting stored content (database edit). A10 awaits an owner answer. |
| T4 / E.5 | E.5 passes: as `second@test.local`, `GET /api/resume-outputs/5/versions` prints `{"error":"Resume output not found"} 404`; owner gets 200. |
| T5 / T11 (MCP) | Pass. See interface parity. |
| B8 / T9 (draft wording not frozen) | Unchanged by design (J3.1 and J5.3 pass because drafts resolve live). Needs an owner decision. |
| B10 / T6 (chart-only change shows no diff) | Not fixed: `src/lib/outputVersionDiff.js` still has no chart handling (only a comment mentions "chart rows"). No baseline step. |
| B11 / T7 (no Version history entry in OutputTemplateConfigurator) | Not fixed: `OutputTemplateConfigurator.jsx` has no Version history control (0 matches). No baseline step. |
| T10 (unchanged-line labels) | Unchanged: NAME / HEADING / ROLE vs spec "HEADER fields". J4.2 scored pass. |

## Failures
- **J1.2 (mobile) MOBILE_GAP** and **J5.1 (mobile) MOBILE_GAP**: as above.
- **E.2 (desktop and mobile) UI_GAP**: as above.

## Passed
J1.1, J1.3-J1.5, J2.1-J2.4, J3.1-J3.4, J4.1-J4.6, J5.2, J5.3, J6.1-J6.3, J7.1-J7.6, E.1, E.3, E.4, E.6 on desktop and mobile; J1.2 and J5.1 on desktop; E.5 (cli). Notes:
- Dates show `Oct 10, 2026, hh:mm UTC` (test clock). Statuses and counts matched: `1 added, 1 changed`, `1 added, 2 changed`, `1 changed`; frozen vs live wording notes; no proficiency dialog; Approve confirmation `Approve "Version demo resume" as the final version for its QR code? You'll be recorded as the approver...` accepted.
- `four` is a DEL (line-through, red), `five` an INS (underline, green); chips CHANGED/ADDED/REMOVED; Hide unchanged text leaves only CHANGED/REMOVED; equal selects show "Pick two different versions to see what changed."
- Phone: history dialog 374px wide at x=8 inside 390, document scroll width 390.
- J1.4 and J2.4 on mobile: my script first marked them fail because it required Created and Modified to share the same minute; on the slower phone run the values were 19:57 vs 19:58. Both are in the spec's `<today>, hh:mm UTC` format and every other expectation matched, so I corrected those two log lines to pass (the correction note is in each line's `seen`).
- E.3 simulated with a browser network rule returning HTTP 500: alert "Could not load version history: Simulated server error", Retry button, error toast, Retry loads the history. The two logged `http_error` 500s and their `console_error` lines are that simulation.
- E.4: the dialog holds only Close, the v1/v2 labels, the range slider, two selects and the checkbox.

## Interface parity
- Desktop and 390px phone walkthrough done for every browser step. The only MOBILE_GAP is the Classic Tools tool list (J1.2, J5.1).
- API route the UI calls: `GET /api/resume-outputs/:id/versions`.
- MCP: created a token in the UI (World Shell -> Journeys -> Connected Agents, scope career.read) and called `/mcp` as that member. `output_versions_list` returned the same 3 versions, statuses, approvedBy and change summaries as the dialog; `output_version_read` v1 shows `four regions` / `Finance Systems Lead`, v2 shows `five regions` / `Director`; `output_versions_compare` 3->4 = `1 added, 2 changed`, 4->3 = `1 removed, 2 changed`; a foreign output id returns `isError` `404 not_found: Resume output not found`. Matches UI and API.

## Observations (not scored)
1. Unchanged-line labels read NAME / HEADING / ROLE; spec J4.2 says "HEADER fields" (T10, spec wording stale).
2. B10 and B11 requirement gaps remain open (confirmed by code read, no step covers them).
3. B8/T9: draft wording is live by design (J3.1/J5.3); freezing drafts would contradict those steps and needs an owner decision.
4. `external_blocked` entries are the sandbox's font/CDN failures. No `pageerror` and no failed app request (`requestfailed`) was logged.
5. The 390px Classic Tools screen is visibly broken (squashed column, overlapping header), beyond the missing tool list.

## Cleanup
Server and both browser daemons stopped by PID file; database `sb_rl_val_5500_2` dropped. No product code, specs or baselines changed; nothing committed.
