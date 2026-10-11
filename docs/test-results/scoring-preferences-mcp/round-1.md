# Test result - scoring-preferences-mcp - round 1

Commit tested: `1032699` (integration branch `claude/zealous-meitner-5tuft5`). Release 2026-10-10-production-hardening-resume.
Baseline: v1 (`docs/training/baselines/scoring-preferences-mcp/v1.json`), spec sha `9b1ab10e89e43357a2e9a781d487257555ebde7c97c9aff40adc763b2696a5b2`. `check` passed ("baselines match").

## Score (from `release-spec-baseline.mjs score`, verbatim)

```json
{
  "feature": "scoring-preferences-mcp",
  "baseline": 1,
  "specSha256": "9b1ab10e89e43357a2e9a781d487257555ebde7c97c9aff40adc763b2696a5b2",
  "total": 29,
  "passed": 22,
  "failed": ["J0.1", "J2.1", "J2.7", "J3.2", "J4.2", "J5.1", "E.4"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

passed = false. Step log: `/var/tmp/sbpg/release-loop/scoring-preferences-mcp/round-1/steps.jsonl`; screenshots in the same folder (`desktop-*.png`, `mobile-*.png`).

Setup: fresh Postgres database per pass (dropped and recreated), server booted once, `npm run seed`, `create-test-member.mjs`; Chromium 1280x900 and 390x844 touch, light, en-US, UTC. Production build served by `node server/index.js` on port 16502. CLI steps ran against the real `/mcp` endpoint with tokens created through the page (TOKEN_A / TOKEN_B).

## Failures

1. **J2.1, J3.2, J5.1 (desktop) - UI_GAP.** "Back to World" in the right-hand panel of Career Placement Agents cannot be clicked at 1280x900. The button sits at y=102..116 under the breadcrumb bar (`nav.sb-world-crumbs`, bottom 115.8); the element receiving the pointer is the NAV, so the click times out. The steps were continued through the breadcrumb "Sun" link so the expectation could still be checked; the token boxes appeared. (On the Connected Agents full-screen page the same-named button works; J2.7 and J6.1 used that one.)
2. **J2.7 (desktop and mobile) and J3.2 (desktop and mobile) - stale card.** After the MCP save (25,15,15,10,10,10,5,10) the card, reopened via Back to World, Journeys, Career Placement Agents, Scoring Weights, still showed 20,15,15,15,15,10,5,5. After the MCP reset it still showed "Your custom weights" with the reset button. The network log shows only ONE `GET /api/career-agents/scoring-preferences` per session. Cause: `src/components/WorldShell.jsx` line ~1323 only loads when `!scoringPreferences`, and the value lives in `useCareerPlacementAgents` state that outlives the panel. The spec says "Opening the card again always shows what is saved."
3. **J0.1 (mobile) - MOBILE_GAP.** At 390px the top bar shows only the avatar "T"; "Test Member" and "Member" are not visible. (Desktop shows both.) World Shell loads, no password or consent page.
4. **J4.2 (mobile) - harness false negative, re-checked passing.** My first attempt read the page before the toast rendered and logged fail, although its own screenshot shows "Reverted to the Salt Basin default weights." A re-check (later log line, `mobile-J4.2-recheck.png`) passed: toast, label "Salt Basin default", fields 15,15,15,15,15,10,5,10, reset button gone. The score tool still counts the earlier failing line; the reviewer should treat this step as passing.
5. **E.4 (cli).** `node scripts/check-interface-parity.mjs` exits 0 but prints `Interface parity: 116 of 117 capabilities work in all three interfaces (website UI gaps: 0, MCP gaps: 1, API gaps: 0)`, not "110 of 110 ... MCP gaps: 0". The one gap is `release-tracker-admin` (MCP_GAP, owned by feature live-release-tracker). Proposed amendment: the spec's literal numbers are stale; word the expectation as "the scoring-preferences capability row has no gaps" or update the counts.

## Passed

J1.1-J1.4 (defaults, red 105% total, save, custom label, reset button) on both surfaces. J2.1 on mobile (token box with `sbpat_`). J2.2-J2.6 (124 tools including the three scoring tools; read shows 0.2/0.05 and platform default 0.15; save 0.25/0.1; 400 `Weights must sum to 1.0 (got 0.900).`; 400 `weights must be an object of { dimensionKey: weight }.`). J3.1, J3.3, J4.1, J4.3 (reset via MCP, repeat reset safe, MCP confirms the website reset). J5.1 on mobile; J5.2-J5.4 (read-only token lists only the read tool, save refused 403 `scope_not_granted` naming `career.write` and `career_scoring_preferences_save`, read unchanged). J6.1 and J6.2 (no sideways scroll at either width; at 390px Save My Weights and Scoring Weights are both 44px tall). E.1, E.2, E.3 (401 `{"error":"unauthorized"}`), E.5 (second member sees the default while the first has custom). P.1-P.4.

## Interface parity

- Website: card works on desktop and phone (failures above). API route called by the card: `GET/PUT/DELETE /api/career-agents/scoring-preferences`, all 200.
- MCP: `career_scoring_preferences_read|save|reset` exist; their results matched what the card showed after UI saves (J2.3: 0.2 and 0.05 after the J1.4 save; J4.3 after the UI reset). No MCP_GAP for this capability.
- The only MCP gap in the registry is `release-tracker-admin` (E.4).

## Fixes handed to this round (by id)

- scoring-preferences-mcp-B7 (platform-mcp [J2.1] tool count): not a step of this baseline. Observed: a career.read+career.write token now lists 124 tools. Not verified here.
- scoring-preferences-mcp-B8 (no baseline): fixed. `check` passes, v1 exists.
- scoring-preferences-mcp-B9 (build evidence): this report and the log are the round 1 evidence.
- scoring-preferences-mcp-B10 (older base): the worktree reset to `1032699` cleanly; the parity check reports "the registry matches the code." No reverse changes were observed in behaviour.

## Observations (outside any step, not scored)

- The Back-to-World overlap (failure 1) probably affects every World Shell panel that renders that button under the breadcrumb bar, not only this card.
- Console: one `net::ERR_TUNNEL_CONNECTION_FAILED` for `cdnjs.cloudflare.com/.../three.min.js` (external, sandbox-blocked, logged as `external_blocked`). No page errors, no failed app requests, no HTTP errors from the app.
- The MCP endpoint locks out an address for about 12 minutes after repeated bad-token attempts (error -32029). It hit my harness once during an early run with a bad token and cleared on server restart.
- Cleanup: my server (PID file) was stopped and database `sb_rl_val_16500_1` dropped. Orphan Chromium processes from aborted harness runs may remain; I did not kill by name.
