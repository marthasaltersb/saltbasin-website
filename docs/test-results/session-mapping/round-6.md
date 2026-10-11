# Test results — session-mapping, round 6

Tested commit: 1032699 (integration head `claude/zealous-meitner-5tuft5`). Validator: val-15700-1. Fresh database per surface (desktop, then reset and mobile), production build served on port 15702, TZ=UTC, en-US, light scheme, desktop 1280x900, mobile 390x844 (isMobile, hasTouch; taps, CDP touch drags for the J5.5 sliders). Date 2026-10-11.

```json
{
  "feature": "session-mapping",
  "baseline": 2,
  "specSha256": "4d0c7d7fd134c49f6b26d7641ed9aaa3c7300a32027e3da2ce7f6f93b765922f",
  "total": 56,
  "passed": 55,
  "failed": ["E.1"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: **55 / 56. passed = false.** `release-spec-baseline.mjs check` passed (`baselines match: session-mapping v2`). Baseline is still v2 (same as round 5), so the score compares like for like with round 5 (55/56); no diff table needed. The failing step changed: E.8 (round 5) now passes; E.1 (passed in round 5) now fails.

Evidence: `/var/tmp/sbpg/release-loop/session-mapping/round-6/` (steps.jsonl, one screenshot per expectation per surface, cli-*.txt, mcp-*.txt, refusals-*.json, network-*.jsonl).

## Failure

### E.1 (desktop and mobile) - the invalid-JSON message was reworded and no longer starts with the spec text
- Step: Import, Analysis JSON `{not json`, File analysis. Expect a red message starting **The analysis is not valid JSON:** (HTTP 400); nothing filed.
- Observed (both surfaces): red alert (role=alert, HTTP 400 from `POST /api/session-mapping/import/metrics`), first sentence in plain words: "The analysis could not be read because part of its text is mistyped or missing. Check for a missing comma, quote or bracket, fix it, then try again." followed on its own line by "Technical detail: Expected property name or '}' in JSON at position 1 (line 1 column 2)". Nothing filed. Screenshots `desktop-E.1.png`, `mobile-E.1.png`.
- Assessment: the behaviour follows the owner direction of 2026-10-10 (CLAUDE.md "errors written for the member", and the review checklist's plain-error rule), which the frozen text predates; the literal expectation still fails. Class: spec_error. Proposed amendment (E.1 expected text): "a red message starting **The analysis could not be read because part of its text is mistyped or missing.** (HTTP 400), with a second line starting **Technical detail:**; nothing is filed." (This is stricter, not weaker.)

## Everything else passed

P.1-P.3, J1.1-J9.3 and E.2-E.8 on desktop and mobile; CLI steps once (J7.1, J7.2, J8.1-J8.5, J9.1, J10.1-J10.4, E.9; also executed during the phone pass for state). HTTP 400s seen per surface are exactly those the spec names (J4.4, J7.5, E.1, E.2, E.3, E.4, E.6, E.7, E.8); no page errors, no failed application requests; 3 external requests blocked by the sandbox (external_blocked). Admin in this harness: `admin@test.local` / `AdminPass!2345` (J10.1 and the login used it in place of the spec's example e-mail).

## Open bugs from the fix details: status by step id

| Bug | Maps to | Result this round |
| --- | --- | --- |
| session-mapping-F5-2 and "round 4 E.8 failure" (nonexistent transcripts folder not reported) | E.8 desktop and mobile; MCP `session_mapping_import` kind=scan | Verified fixed. UI shows red alert **Cannot read transcripts folder /var/tmp/session-mapping-fixture/nope: ENOENT: no such file or directory, scandir '...'** with HTTP 400 on `/import/scan` (desktop and phone). MCP `session_mapping_import {"kind":"scan"}` answers `isError: true`, status 400, same message (`mcp-scan-nope.txt`, `mcp-m-scan-nope.txt`). |
| session-mapping-F5-4 (toasts not auto-dismissed/capped on narrow screens; Settings form state set after message) | observations only | Partly seen: on the phone a toast still overlaps content for a few seconds (`mobile-J5.3.png` "Analysis filed" over the Timeline; `mobile-E.8.png` red toast over the next card). It disappears on its own in these runs. Settings form values were correct whenever the Saved message appeared (J6.1, J6.3, J6.4, J7.3 pass). Cosmetic only. |
| session-mapping-F5-5 (spec parity table stale) | none | Not fixed: the frozen spec still lists the six MCP tools as "(planned)". The registry now has 10 `session_mapping_*` tools. Needs an amendment (context text only, no step depends on it). |
| session-mapping-B5 (no MCP tools) | MCP parity | Verified. Tokens created through the UI (World Shell -> Journeys -> Connected Agents, scopes sessions.read and sessions.write) on desktop and on the phone list the 10 tools. At the end state `session_mapping_config` (transcriptsDir `.../nope`, 3 default prices), `_sessions` (5), `_trends` (`totalSessions: 5`), `_proposals` status applied (`appliedOn 2030-03-03`, `appliedRef demo-commit-1`) and `_failures` (1 reconciled with the note) match the UI and the API (J10.2/J10.3) on both surfaces. |
| session-mapping-B7, F2-2, F3-1 (Classic menu entry) | A1 / no baseline step | Verified fixed: Classic Tools -> Platform Lifecycle Management lists Operating Model Dashboard, Backlog, Feedback, QA, Content Manager, Release Tracker, Render Bindings; no Sessions (desktop `desktop-extra-plm.png`, phone menu `mobile-extra-plm.png`). |
| session-mapping-B8, F2-3 (hook needs a database) | J8.4 passes | Verified: with `DATABASE_URL` unset the hook exits 0 silently and writes `server/data/sessionMapping/spool/claude_code_scan-demo-1.json` (metrics only, 0 occurrences of `"text"`). With a database J7.1, J7.2, J8.4 pass. |
| session-mapping-F1-2 (junk config keys) | MCP parity | Verified: `session_mapping_config_save {"rules":{"nope":1}}` -> `isError: true`, 400 `unknown rule key: "nope" (allowed: ...)`. |
| session-mapping-F2-5 (CLAUDE.md stale MCP statement) | none | Not rechecked this round beyond round 5 (no baseline step). |
| session-mapping-F3-4 (spool filed only by Scan) | none | Not exercised end to end this round. The spool file is written and nothing files it automatically; it is filed only by an admin running Scan (as seen in round 5). No step covers it. |

## Observations (outside the baseline; not scored)

1. Wording drift: E.1's message was reworded (see failure). Other error texts the spec checks (E.2, E.3, E.4, E.6, E.7, E.8) still match their frozen text.
2. The frozen spec's parity table still says the MCP tools are "(planned)" (see F5-5).
3. Phone: transient toasts overlap content for a few seconds (F5-4, cosmetic).
4. A spooled analysis is not filed automatically; the Scan note does not say a spooled file was filed (F3-4; amendment candidate for a step).
5. Order after **Restore defaults** (J6.4): the Proposed queue lists the two mappings in a different order than J4.1 did; J6.4 names no order, so it passes.
