# Test result — release-cut-and-session-plans — round 1

Commit tested: 384d046 (integration head). Baseline v1, spec sha 89a7db47639d75cb09ef8ec0531d737c5314d0746b9f467c6f25c035270ebc64. Surfaces: desktop 1280x900, mobile 390x844 (touch), cli. Evidence: /var/tmp/sbpg/release-loop/release-cut-and-session-plans/round-1/ (steps.jsonl, screenshots).

```json
{
  "feature": "release-cut-and-session-plans",
  "baseline": 1,
  "specSha256": "89a7db47639d75cb09ef8ec0531d737c5314d0746b9f467c6f25c035270ebc64",
  "total": 62,
  "passed": 53,
  "failed": ["J3.1","J3.4","J3.5","J6.6","J7.8","J7.9","J7.11","J8.6","J8.7"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: NOT PASSED (53 of 62).

## Failures

Eight of nine share one cause: the spec fixes `in-app-release-loop` at 60/60 (round 3, baseline v2), but the integration branch now holds `docs/test-results/in-app-release-loop/round-4.md` with 59/60 on baseline v2. The product correctly reads the newest round, so it records actual 59/60 and Missed. The spec's data is stale. Proposed amendment, not edited: change the expected actual in J3.1, J3.4, J3.5, J7.8, J7.9, J7.11, J8.6, J8.7 to 59/60 (round 4, met false), or pin the fixture feature to one that has a stable round.

- J3.1 (desktop, mobile): expected item "expected 60/60 · actual 60/60" with green Met; saw actual 59/60 with red Missed. The guided-training-agent line (actual not validated, no label, no 0) was correct.
- J3.4: item line reads actual 59/60, not 60/60. "1 re-estimate (original kept)" was correct.
- J3.5: S-garden-02 shows actual 59/60 (expected 60/60). Red Missed was correct.
- J7.8: merge result is round 4, passed 59, not round 3 / 60.
- J7.9: row has actual 59/60, met false.
- J7.11 (desktop, mobile): card shows actual 59/60 · Missed.
- J8.6: passed 59, round 4.
- J8.7: S-garden-mcp actual 59/60, met false.
- J6.6 (a different cause): `release-cut.mjs` printed `Froze 1.0.0 at 384d046: 1/2 planned delivered, 1 carried, 0 in backlog, 0 added after the cut. Opened 1.1.0 with 1 features (1 carried, 0 new).` The spec expects `Froze 1.0.0 at <HEAD7>: 1/2 delivered, 1 carried. Opened 1.1.0 with 1 features (1 carried, 0 new).` The commit, counts and the freeze are correct; the wording differs. Proposed amendment: update the expected text, or restore the shorter message.

## Notes

- J6 ran once (cli). The J7 and J8 cli steps were scored on the desktop pass. On the phone pass the same J7/J8 commands were re-run silently, because that pass has a fresh database and `docs/release-log/session-plans/S-garden-*.json` was cleared (P.2), and J7.11 and E.3 need those cards. All of them showed the same 59/60 diff.
- The mobile E.3 reload returned to the Release loop panel on its Runs tab, not Session plans. A first run of the script mis-navigated there (a script bug, not a product bug). I re-ran E.3 from the logged-in phone session, reloaded and tapped Session plans, and it passed. The failed script line was removed.
- No page errors and no failed application requests other than the spec's named 400/409 refusals. The blocked external three.js CDN request is environment noise.
- Interface parity: every UI capability has its API route and MCP tool (J7 and J8 exercised them with the same results as the UI). The only mismatches are the stale score figures above. No UI_GAP, MOBILE_GAP or MCP_GAP found. E.1 passed on both surfaces (no horizontal scroll, all controls at least 44px).
- Cleanup: server stopped (PID file), database sb_rl_val_6600_3 dropped, S-garden-*.json removed from the worktree, /tmp/garden-cut removed.
