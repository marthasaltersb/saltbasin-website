# Test results — session-mapping, round 4

Tested commit: fd0b68b (integration head `claude/zealous-meitner-5tuft5`). Validator: val-5900-2, fresh database per surface (desktop, then reset and mobile), production build served on port 5904, TZ=UTC, en-US, light scheme, desktop 1280x900, mobile 390x844 touch.

```json
{
  "feature": "session-mapping",
  "baseline": 2,
  "specSha256": "4d0c7d7fd134c49f6b26d7641ed9aaa3c7300a32027e3da2ce7f6f93b765922f",
  "total": 56,
  "passed": 55,
  "failed": ["E.8"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: **55 / 56. passed = false.** Baseline check passed (`baselines match: session-mapping v2`).

Baseline diff v1 -> v2 (amendment A1): 59 comparable ids all same (P.1-P.3, all J, all E); changed none, added none, retired none; only the context section "Where things are" changed. Scores are comparable like for like with round 3 (56/56).

Evidence: `/var/tmp/sbpg/release-loop/session-mapping/round-4/` (steps.jsonl, one screenshot per expectation per surface, `mcp-results.json`).

## Failure

### E.8 (desktop and mobile) - nonexistent transcripts folder is not reported

- Expected: **Scan server transcripts** with Transcripts folder `/var/tmp/session-mapping-fixture/nope` shows the red message `Cannot read transcripts folder /var/tmp/session-mapping-fixture/nope: ENOENT: no such file or directory ...` (HTTP 400).
- Observed: no error. The Import tab shows the neutral note `Found 0 transcripts: 0 new, 0 updated, 0 unchanged, 0 failed.` No HTTP 400 was made for `/import/scan`. The API returns `200` with `"dirError":"Cannot read transcripts folder /var/tmp/session-mapping-fixture/nope: ENOENT: ..."` in the body, and the UI never reads `dirError`.
- Cause (regression): round-3 commit 059e84b ("hook spool without DB") changed `scanTranscripts()` in `server/lib/sessionMapping.js` to catch the folder error into `result.dirError` so spooled analyses still get filed, but nothing surfaces `dirError`: `grep dirError src/` is empty and the route still returns 200. The failure is now silent, which the process forbids. Screenshots: `desktop-E.8-43.png`, `mobile-E.8-43.png`.
- Suggested fix: keep filing spool and hook failures, then, if `dirError` is set and nothing was found, respond 400 with that message after the spool work (or show `dirError` in a red `role="alert"` in `SessionMappingPanel.jsx`); the MCP `session_mapping_import` scan result should carry it as an error too.
- Round 3 scored 56/56, so this is new in 059e84b.

## Everything else

All other 55 baseline steps passed on every required surface: P.1-P.3 (setup), J1.1-J9.3 on desktop and mobile (including the J5.5 slider drag on the phone through touch events, J1.5 no horizontal scroll and tab height >= 44 px), CLI steps J7.1, J7.2, J8.1-J8.5, J9.1, J10.1-J10.4, E.9 once, and E.1-E.7 on both surfaces. No open bugs from earlier rounds. Amendment A1 (Sessions not in Classic Tools) is consistent with what was seen (Sessions is reachable from the World Shell only).

HTTP 400 responses seen are exactly those the spec names (J4.4, J7.5, E.1, E.2, E.3, E.4, E.6, E.7 on each surface); no page errors, no failed application requests. External font/CDN requests were blocked by the sandbox only (`external_blocked`).

## Interface parity

- Desktop: every journey walked by point and click (login form, Journeys tab, Sessions card). No typed URLs except the start page.
- Mobile 390px: every journey walked with taps; no `MOBILE_GAP`.
- MCP: token created through the UI (World Shell -> Journeys -> Connected Agents, scopes sessions.read/write); `/mcp` `tools/list` shows the 10 `session_mapping_*` tools. `session_mapping_config`, `_sessions`, `_trends`, `_proposals` (status applied) and `_failures` returned the same data as the UI/API. No `MCP_GAP`, except the scan path inherits the E.8 defect (folder error only inside a 200 body).

## Observations (outside the baseline; not scored)

1. On the phone, toasts from earlier steps (for example "Say why this mapping is rejected" from J4.4) were still stacked over the Trends content several steps later (`mobile-J5.3-22.png`), partly covering the Timeline card text. Cosmetic.
2. The Settings form refreshes its fields a moment after the "Defaults restored" message appears (price rows briefly show 4 rows); settled to 3 within a second.
