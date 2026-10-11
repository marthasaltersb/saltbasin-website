# Test results — session-mapping, round 7

Tested commit: aca458d (integration head `claude/zealous-meitner-5tuft5`). Validator: val-15700-5. Fresh database per surface (desktop, then reset and phone), production build on port 15710, TZ=UTC, en-US, light scheme, desktop 1280x900, mobile 390x844 (isMobile, hasTouch, taps and touch drags). Date 2026-10-11.

```json
{
  "feature": "session-mapping",
  "baseline": 3,
  "specSha256": "94f71f2dd08ef53991e838c8f0122ffad891001cd66c634749945d832182065c",
  "total": 56,
  "passed": 56,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: **56 / 56. passed = true.** `release-spec-baseline.mjs check` passed (`baselines match: session-mapping v3`).

## Baseline diff (v2 -> v3, amendment A2)
Same: all ids except E.1 (55 same). Changed: E.1. Added: none. Retired: none. Scores are like for like (56 steps in both; round 6 was 55/56).

## Fix status by step id
- E.1 (amendment A2, new expected text): passes on desktop and mobile. Red alert (HTTP 400 on `POST /api/session-mapping/import/metrics`) starts "The analysis could not be read because part of its text is mistyped or missing." with a second line starting "Technical detail:"; nothing filed.
- All other steps (P.1-P.3, J1.1-J10.4, E.2-E.9) pass on desktop and mobile; CLI steps once.

## Evidence and notes
- Evidence: `/var/tmp/sbpg/release-loop/session-mapping/round-7/` (steps.jsonl, screenshots per expectation, cli-*.txt, mcp-*.txt, refusals-*.json, network-*.jsonl).
- HTTP 400s per surface are exactly those the spec names (J4.4, J7.5, E.1, E.2, E.3, E.4, E.6, E.7, E.8). No page errors, no failed application requests; 2 external requests blocked by the sandbox (external_blocked). Admin in this harness: `admin@test.local` / `AdminPass!2345` (used in place of the spec's example e-mail).
- MCP parity: tokens created through the UI on desktop and phone (scopes sessions.read, sessions.write); 10 `session_mapping_*` tools listed. At end state `session_mapping_sessions` (5), `_trends` (`totalSessions: 5`), `_proposals` status applied (`appliedOn 2030-03-03`, `appliedRef demo-commit-1`), `_failures` (1 reconciled with note) and `_config` match the UI and API on both surfaces.
- Environment cleanup: server killed by PID file, database `sb_rl_val_15700_5` dropped.

## Observations (outside the baseline; not scored)
None new this round. Carried from round 6 and unchanged: the frozen spec's parity table still labels MCP tools "(planned)" (context text only); transient toasts overlap content for a few seconds on the phone (cosmetic).
