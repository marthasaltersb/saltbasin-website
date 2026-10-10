# Test result: output-version-history, round 1

Validator: val-5500-2. Commit tested: `c3a71b490991e2f7c7616cb326bd9cfe1084b7d0` (integration branch `claude/zealous-meitner-5tuft5`). Evidence: `/var/tmp/sbpg/release-loop/output-version-history/round-1/` (`steps.jsonl`, screenshots `desktop-*.png` / `mobile-*.png`).

Score (from `release-spec-baseline.mjs score`, copied verbatim):

```json
{ "feature": "output-version-history", "baseline": 1,
  "specSha256": "a6c32e6977e43213b36152db038991c9c2936c185ccd358bfa4cb7044c6040d6",
  "total": 37, "passed": 33, "failed": ["J1.2","J5.1","E.2","E.5"], "blocked": [], "notRun": [], "preconditionsFailed": [], "observations": [] }
```

Baseline v1 (unchanged; `check` passed). passed = false.

## Setup (fixed constraints)
Fresh database `sb_rl_val_5500_2`, `npm run build` + production server on 5504, `npm run seed`, `scripts/create-test-member.mjs`: desktop 1280x900 as `member@test.local`, phone 390x844 touch as a second member `member2@test.local` (a fresh member is needed so the phone walkthrough starts from the same empty state). Both accounts have the display name "Test Member". Chromium pinned, light, en-US, UTC. Logged in once through the login form per surface (`/login`).

Test-member name: the spec says the member is "Riley Fenn" (and "Approved by Riley Fenn"); the harness account is "Test Member". Everywhere the spec names the person I accepted the account holder's display name. This is the B14 conflict (spec preconditions and Journey 0 use `riley.member@example.test` + public signup, contrary to the harness rule); the spec is unchanged, so B14 is still open (proposed amendment: use the harness account and say "the member's display name").

## Fix verification by step id
| Bug | Maps to | Result |
|---|---|---|
| B8 draft content not frozen | no baseline step (J5.3 and J3.1 actually require drafts to follow Career Master) | Still open as a requirement: v2/v3 drafts display "Wording is resolved from your current Career Master" and changed with the Career Master title (J5.3). Not testable as a pass/fail baseline step. |
| B10 chart-only changes show no diff | no baseline step | `src/lib/outputVersionDiff.js` still has no chart handling (grep "chart" finds only a comment). Still open. |
| B11 entry point in Output Template editor | no baseline step | `OutputTemplateConfigurator.jsx` has no Version history control; entry points only in CareerBoundOutputEditor, MyResumePanel, OpportunityOutputsSection, WorldShell. Still open. |
| B14 precondition conflict | spec preconditions / Journey 0 (not a scored step) | Still open, see above. |

## Failures
- **J1.2 (mobile) MOBILE_GAP**: at 390px **Classic Tools** shows only the Career Placement Agents panel squashed into a narrow column (scene about 45px wide, tracked-opportunities card overlapped, "Back to World" button over the heading). The tool list (MY RESUME, CAREER MASTER, ...) is not reachable: `sb-admin-topbar-actions` is `display:none` and the only visible buttons are "Back to World" and "+ Track Opportunity". Screenshot `mobile-j1-classic.png`. I continued the walkthrough through the **Journeys** cards (My Resume, Career Master), which work and are not "Classic Tools"; later steps J1.3 onward passed from there.
- **J5.1 (mobile) MOBILE_GAP**: same reason (the step's route is Classic Tools -> CAREER MASTER / MY RESUME). Via the Journeys cards the edit works (title saved as Finance Systems Director). Desktop J5.1 passed.
- **E.2 (both) UI_GAP**: no point-and-click way to make a saved version unreadable (needs corrupted stored content, i.e. a database edit, which is forbidden). Not exercised. Proposed amendment: move E.2 to a unit-level or setup-only check.
- **E.5 (both) UI_GAP**: the interface never exposes another member's output id. Observation only (not a step performance): from member2's session a direct request for member1's output id `7` returned `404 {"error":"Resume output not found"}`, as the spec expects.
- **MCP_GAP: platform MCP server not built yet (feature platform-mcp)**: `server/lib/mcpToolRegistry.js` does not exist. Capabilities with no MCP tool: list an output's versions with dates/approval metadata (UI calls `GET /api/resume-outputs/:id/versions`), compare two versions (tracked changes), read a version body as it stood. Not part of the score.

## Passed (both surfaces unless stated)
J1.1, J1.3-J1.5, J2.1-J2.4, J3.1-J3.4, J4.1-J4.6, J5.2, J5.3, J6.1-J6.3, J7.1-J7.6, E.1, E.3, E.4, E.6, and J1.2 / J5.1 on desktop. Notes:
- Timeline slider: Home/End via the keyboard (focus + key press) on both surfaces; on touch the v1/v2 labels were tapped (J3.4). Tracked changes: `four` is a `DEL` line-through (red text on pink), `five` an `INS` underline (green); CHANGED/ADDED/REMOVED chips render; Hide unchanged text removes the grey lines.
- Phone: the history dialog is 374px wide inside the 390px screen (about 8px margins), the document has no horizontal scroll (390 = 390), the versions table scrolls inside its card (Approved by and Changes columns off to the right until scrolled). Add Entry modal in Career Master scrolls; Save is reachable.
- J6.1: no proficiency dialog appeared; v2 shows "1 added, 2 changed" and the frozen-wording note. Times are Oct 9, 2026 UTC (the test clock), not Oct 2.
- E.3 was driven by a browser network rule returning HTTP 500 for the versions request (no API call used): dialog showed the red alert "Could not load version history: Simulated server error" and a **Retry** button, an error toast with the same text appeared (gone after about 2 seconds), Retry then loaded the history. The first mobile measurement missed the toast by timing; it was re-measured with polling and the earlier mobile E.3 line replaced.
- E.6 used a fixture I created (`/tmp/ovh-c/ovh-other.txt`, different file name): a second row appeared with its own 1-version history while `ovh-resume.txt` kept 2 versions.

## Observations (not scored)
1. Unchanged-line type labels in TRACKED CHANGES read NAME, HEADING, ROLE, PARAGRAPH; spec J4.2 lists "HEADER fields". Spec wording looks stale (proposed amendment: "NAME").
2. `steps.jsonl` in the round-1 evidence folder already contained id-less lines written by earlier sessions (port 4110/4114/8504/10504 runs, incl. old B8 and B11 findings); they are ignored by the score. My own lines start at 2026-10-09T15:58Z. One mistaken mobile J2.2 line I produced by accident (a script sent to the wrong surface) and one superseded E.3 mobile line were deleted from the file before scoring.
3. The `http_error`/`console_error` lines at 16:08-16:23Z (500 on `/api/resume-outputs/7/versions` and `/14/versions`, 404 on `/7/versions`) are my own simulated-failure and E.5 probes, not product failures. No `pageerror` and no genuine request failures were recorded during the journeys.
4. External font/CDN requests were blocked by the sandbox (`external_blocked`), ignored.

## Cleanup
Server (port 5504) stopped, browsers stopped, database `sb_rl_val_5500_2` dropped. No product code, specs or baselines changed.
