# Test result - platform-mcp - round 5

Validator: val-16100-7 · commit tested 0398c95 (integration branch claude/zealous-meitner-5tuft5) · 2026-10-11

```json
{
  "feature": "platform-mcp",
  "baseline": 5,
  "specSha256": "0b5773fe7461adc67abc1fb4664be9636b567280659acdfffd9b3355e5ee2942",
  "total": 65,
  "passed": 65,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: **PASS - 65 of 65 steps of baseline v5 passed** on every required surface (desktop, phone, cli, setup). `release-spec-baseline.mjs check` printed `baselines match: platform-mcp v5`.

## Baseline change since round 4 (v4 to v5, amendment A7)

`release-spec-baseline.mjs diff`: comparable 65; same 61 (P.1-P.4, J1.1-J1.3, J1.5-J1.7, J2.2, J2.3, J3.x, J4.x, J5.x, J6.1, J6.3-J6.9, J7.x, J8.1, J9.x, J10.x, J11.1, J11.3, J11.4, E.1-E.6); changed 4 (J1.4, J2.1, J6.2, J11.2); added none; retired none. Round 4 scored 60 of 65 on v4, with failures in exactly the changed steps plus J10.4. The four changed steps now carry the current registry values (18 scopes, 126 tools, 10 tools for a release.read token, 121 of 121). Round 4 and round 5 compare like for like on the 61 unchanged steps; J10.4 (unchanged) failed in round 4 and now passes.

## Fix verification by step

- platform-mcp-r4-T1 (release-tracker-admin MCP gap): fixed. J10.4 now passes: with Gaps only selected there are 0 cards and the no-gaps message shows. J11.2 passes: `Interface parity: 121 of 121 capabilities work in all three interfaces (website UI gaps: 0, MCP gaps: 0, API gaps: 0).`, no Gaps line, exit 0. J10.1/J10.2 show 121 of 121 and 0 gaps (desktop and phone). J11.4 shows `summary.total` 121 with `problems` empty. J6.2 lists the 10 release.read tools in the spec order, including `release_tracker_list_ingest_log`. Outside the baseline, calling `release_tracker_list_ingest_log` with an admin token that has release.read returned `isError: false` and `{"result":{"log":[]}}`.
- Spec amendment A7 steps (J1.4, J2.1, J6.2, J11.2): all pass as amended (18 checkboxes in order; 126 names, no missing or extra tool; 10 names; 121 of 121).

## Interface parity

Website, API and MCP results matched for every capability the spec exercises (J3.2/J3.3 vs J3.1, J3.5 vs J3.4, J4.3-J4.5 vs J4.6, J5.4 vs J5.5, J7.5, J8.1). No UI_GAP, MOBILE_GAP or MCP_GAP. Every desktop step was walked by clicking and every one again at 390x844 with touch.

## Console errors and failed requests

No pageerror, no console error and no failed app request other than the expected 400 on `POST /api/platform/tokens` (J1.3, J1.4, E.1) and 409 on `POST /api/resume-outputs/:id/share` (J5.2). The blocked cdnjs three.js request is logged as `external_blocked`. Screens checked for blank or clipped layout: none found (spot-checked phone J1.4 and J10.1).

## Observations (not scored)

- The MCP address shown on Connected Agents is `http://localhost:5173/mcp` (the default Vite port), not the address the page was served from (`http://127.0.0.1:17114`). J1.2 only requires a value ending in `/mcp`, so it passes. Copying it verbatim would not reach the server in this environment.
- Red alerts stack instead of replacing each other: after J1.3 and J1.4 three "The token could not be created: ..." alerts were visible at once, and each alert text appears twice in the page text. Also seen on E.1.
- E.5 still says "eleven tool names (the ten from J2.1 and release_tracker_read)", which no longer matches the registry (the page lists 216 tool lines with scopes). I applied the literal check that the eleven named tools each appear with a scope; it passes. Already flagged in the A7 note.
- The J2.1 check (126 names in registry order) is order-sensitive, as A7 noted.
- J6.7 `create-test-member.mjs --email gated@test.local` exited 0 on both passes.
- The spec names the administrator `betsy@test.local`; create-test-member created `admin@test.local` (from ADMIN_EMAIL). I used that account.
- A harness slip: my first phone pass ran at the desktop viewport because the surface argument was not passed. I discarded its 73 duplicate log lines (kept at /var/tmp/sbpg/agents/val-16100-7/dup-desktop-run2.jsonl), re-created the database and re-ran the phone pass correctly. The desktop results in steps.jsonl come from the first, clean desktop pass.

## How it was run

Two full passes, each from a freshly dropped and recreated database sb_rl_val_16100_7 (seed ended `[seed] Done.`, then create-test-member, then `--email gated@test.local`). API on 16114, Vite dev client on 17114 proxying /api, /uploads and /mcp; the CLI and curl steps used http://127.0.0.1:17114 as API_BASE. Chromium 1280x900 and 390x844 isMobile + hasTouch, light scheme, en-US, TZ=UTC; sign-in through the login form, journeys reached by clicking from /world. CLI steps are logged once as `cli` (from the desktop pass) and were re-run in the phone pass with identical results. J8.1 read 14 tool calls on both passes. Screenshots: /var/tmp/sbpg/release-loop/platform-mcp/round-5/. Step log: /var/tmp/sbpg/release-loop/platform-mcp/round-5/steps.jsonl. Scripts: /var/tmp/sbpg/agents/val-16100-7/. API and Vite stopped by PID, database dropped. No product code, spec or baseline was changed.
