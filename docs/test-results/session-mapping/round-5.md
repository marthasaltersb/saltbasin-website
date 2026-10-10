# Test results — session-mapping, round 5

Tested commit: f674ae8 (integration head `claude/zealous-meitner-5tuft5`). Validator: val-5900-3, fresh database per surface (desktop, then reset and mobile), production build served on port 5906, TZ=UTC, en-US, light scheme, desktop 1280x900, mobile 390x844 touch (isMobile, hasTouch; taps, and CDP touch drags for the J5.5 sliders).

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

Result: **55 / 56. passed = false.** `release-spec-baseline.mjs check` passed (`baselines match: session-mapping v2`). The baseline is still v2 (same as round 4), so the score is comparable like for like with round 4 (55/56); no diff table needed.

Evidence: `/var/tmp/sbpg/release-loop/session-mapping/round-5/` (steps.jsonl, one screenshot per expectation per surface, cli-*.txt command output, mcp-*.txt tool results, refusals-*.json).

## Failure (still open from round 4)

### E.8 (desktop and mobile) - a nonexistent transcripts folder is still not reported
- Expected: Settings Transcripts folder `/var/tmp/session-mapping-fixture/nope`, then Import -> **Scan server transcripts** shows the red message **Cannot read transcripts folder /var/tmp/session-mapping-fixture/nope: ENOENT: no such file or directory** (HTTP 400).
- Observed (both surfaces): no red message. The neutral note reads **Found 0 transcripts: 0 new, 0 updated, 0 unchanged, 0 failed.** `POST /api/session-mapping/import/scan` returned 200 (network log, step E.8). Screenshots `desktop-E.8.png`, `mobile-E.8.png`.
- Cause: unchanged from round 4. `server/lib/sessionMapping.js` `scanTranscripts()` (line ~339) catches the folder error into `result.dirError`; nothing in `src/` reads `dirError` and the route does not turn it into a 400.
- MCP_GAP: the same defect through MCP. `session_mapping_import {"kind":"scan"}` with that folder answers `isError: false` and carries the message only inside the body as `dirError` ("Cannot read transcripts folder ...: ENOENT: no such file or directory, scandir ..."). The website and API must refuse with a 400, and the tool must answer `isError: true` with the same status and message.
- Same silent failure also hides a bad folder when a spooled analysis is filed: after the no-database hook spool, **Scan** on the bad folder showed **Found 0 transcripts: 0 new, 1 updated ...** and no alert.
- Suggested fix: after filing spool and hook failures, if `dirError` is set and nothing was found, respond 400 with that message (and make the MCP tool return `isError: true`).

## Everything else passed

P.1-P.3 (setup), J1.1-J9.3 and E.1-E.7 on desktop and mobile, and the CLI steps once: J7.1, J7.2, J8.1-J8.5, J9.1, J10.1-J10.4, E.9. The CLI commands were also executed during the phone pass (needed for state) with the same output. HTTP 400 responses seen per surface are exactly the ones the spec names (J4.4, J7.5, E.1, E.2, E.3, E.4, E.6, E.7); no page errors, no failed application requests; external font/CDN requests blocked by the sandbox only (`external_blocked`). Admin credentials in this harness were `admin@test.local` / `AdminPass!2345` (J10.1 used them in place of the spec's example e-mail).

## Open bugs from the fix details: status by step id

| Bug | Maps to | Result this round |
| --- | --- | --- |
| session-mapping-B5 (no MCP tools) | MCP parity (no baseline step) | Verified fixed. A token created through the UI (World Shell -> Journeys -> Connected Agents, scopes sessions.read and sessions.write, on desktop and on the phone) lists 10 `session_mapping_*` tools. `session_mapping_config` (transcriptsDir `.../nope`, three default prices), `_sessions` (5 sessions), `_trends` (`totalSessions: 5`, `appliedOn: 2030-03-03`), `_proposals` status applied (`appliedRef: demo-commit-1`) and `_failures` (1 reconciled with the note) match the UI and API at the same state. Exception: the scan tool, see E.8 above. |
| session-mapping-B7, F2-2, F3-1 (Classic menu entry) | A1 context / no baseline step | Verified fixed on desktop: Classic Tools -> Platform Lifecycle Management lists Operating Model Dashboard, Backlog, Feedback, QA, Content Manager, Release Tracker, Render Bindings and no Sessions (`desktop-extra-plm.png`). The phone shows a collapsed Classic menu and was not drilled further. |
| session-mapping-B8, F2-3 (hook needs database) | J8.4 passes | Verified fixed. With `DATABASE_URL` unset, `analyze-session.mjs --hook` exits 0 silently and writes `server/data/sessionMapping/spool/claude_code_scan-demo-1.json` (metrics only, 0 occurrences of `"text"`). With a database J8.4 and J7.1/J7.2 pass. |
| session-mapping-F1-2 (junk config keys persist) | MCP parity | Verified fixed: `session_mapping_config_save {"rules":{"nope":1}}` -> `isError: true`, 400 `unknown rule key: "nope" (allowed: currency, prices, idleCapMinutes, transcriptsDir, thresholds, targets, maxSeries)`. |
| session-mapping-F2-5 (CLAUDE.md stale MCP statement) | none | Verified: CLAUDE.md now says MCP tools exist (`session_mapping_*`, scopes `sessions.read`/`sessions.write`). |
| session-mapping-F3-4 (spool filed only by Scan) | none | Not changed: the spooled file stays unfiled until an admin runs Scan (then **Found 0 transcripts: 0 new, 1 updated ...**). Observation below. |

## Observations (outside the baseline; not scored)

1. Order change in J6.4: after **Restore defaults** the Proposed queue lists **Context compacted 1 time** before **1 usage or rate-limit event** (J4.1 showed usage first). J6.4 names both without an order, so it is scored as a pass; if an order is intended, the spec should state it.
2. The frozen spec's parity table (`docs/training/session-mapping.md`) still marks all six MCP tools as "(planned)" and says no `mcpToolRegistry.js` exists; the code now has 10 tools. Context text only, no step depends on it (amendment candidate).
3. A spooled analysis is filed only when an admin presses Scan (F3-4); nothing files it automatically, and the Scan note does not say a spooled file was filed.
4. On the phone, a toast ("Analysis filed") overlaps the Timeline text on Trends for a few seconds (`mobile-J5.3.png`). Cosmetic, same as round 4.
5. At J5.3 the spec's "Spend" figures depend on the Not-priced note still being shown; it is (correct). No issue.
