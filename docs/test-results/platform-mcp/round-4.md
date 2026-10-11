# Test result - platform-mcp - round 4

Validator: val-16100-1 · commit tested 1032699 (integration branch claude/zealous-meitner-5tuft5) · 2026-10-11

```json
{
  "feature": "platform-mcp",
  "baseline": 4,
  "specSha256": "112e4628c92037b86d796dbe756fb4b1597b43ef16371fe1a59d9394f733725a",
  "total": 65,
  "passed": 60,
  "failed": ["J1.4", "J2.1", "J6.2", "J10.4", "J11.2"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": []
}
```

Result: **FAIL - 60 of 65 steps of baseline v4 passed.** `release-spec-baseline.mjs check` printed `baselines match: platform-mcp v4`. The baseline did not change since round 3 (v4), so round 3 (65/65) and this round compare like for like. All five failures come from the code under test now having more MCP scopes, tools and capability rows than the spec's frozen literal values (6 scopes, 96 tools, 1 tool for a release.read token, 72 capabilities, no gap), plus one real MCP gap. The steps are failed as written; whether to amend is for the amendment process.

## Failures

- **J1.4** (desktop, mobile). Expected exactly six scope checkboxes. Seen 14: career.read, career.write, outputs.approve, release.read, release.write, release.loop.read, sessions.read, sessions.write, release.loop.write, renderings.read, renderings.write, renderings.approve, agent.runner.read, agent.runner.write. The red alert "Choose at least one scope for the token." did appear. Screenshots desktop-J1.4.png, mobile-J1.4.png.
- **J2.1** (cli). Expected 96 tool lines then `96 tools`. Seen exit 0, 126 tool lines, `126 tools`; first difference at index 43 (`platform_mcp_info` where the spec has `career_agent_hub_read`); 30 extra tools, none of the 96 missing.
- **J6.2** (cli). Expected only `release_tracker_read` and `1 tools`. Seen 7 tools: platform_capabilities_map, release_tracker_read, release_tracker_get_state, release_failed_runs_list, release_outputs_list, release_trends_read, release_config_read.
- **J10.4** (desktop, mobile). The Import an application package card is correct (Website ready; API ready `POST /api/resume-outputs/import-package`; MCP ready `application_package_import`; no gap cell). But with Gaps only selected there is 1 card, not zero, and no "no gaps" message: "Ingest, pull, settings, tokens and logs (admin)", reason "The administration routes have no MCP tools yet (RELEASE_TRACKER_TOOLS descriptors other than get_state are not registered); the live-release-tracker feature owns them."
- **J11.2** (cli). Expected exit 0 and `Interface parity: 72 of 72 ...`. Seen exit 1, `Interface parity: 116 of 117 capabilities work in all three interfaces (website UI gaps: 0, MCP gaps: 1, API gaps: 0).`, last line `FAIL (--strict): gaps remain.`
- **MCP_GAP: release-tracker-admin** (behind J10.4 and J11.2): the live release tracker's administration routes have no MCP tools. Not present in round 3's code.

## Steps that passed

All other steps passed on both required surfaces: J1.1-J1.3, J1.5-J1.7, J2.2, J2.3, J3.1-J3.5, J4.1-J4.7, J5.1-J5.5, J6.1, J6.3-J6.9, J7.1-J7.6, J8.1 (14 tool calls on both passes), J9.1-J9.6, J10.1-J10.3, J10.5, J10.6, J11.1, J11.3, J11.4 (summary.total 117 = m, problems empty), E.1-E.6, P.1-P.4. CLI steps were logged once as `cli` and re-run in the phone pass with identical results. J10.1/J10.2 use n and m (n=116, m=117, Gaps only = 1 = m-n). J10.6/E.6: 44px buttons, no horizontal scroll at 1280 and 390.

## Fix verification by step

- platform-mcp-PR1-1 (E.3, J2.2; verifyBy production, netlify.toml): not verifiable locally; E.3 (401) and J2.2 pass locally. Left to the production suite (S4.1).
- platform-mcp-B5 (interface parity for every capability): 116 of 117 ready; one remaining MCP gap (release-tracker-admin). Not fully fixed.
- platform-mcp-B10 (screens reachable from World Shell): J1.1, J7.1 pass. Verified.
- platform-mcp-B11 (bearer auth on /mcp): J2.2, J2.3, E.2, E.3 pass. Verified.
- platform-mcp-B12 / F1-4 (428 on tools/call): J6.8, J6.9 pass. Verified.
- F1-5, F1-8, F1-9, F1-11, F2-2, F2-4, F3-1, F3-2, F3-3: documentation/governance items with no baseline step. Not scored. J10.5 and J11.3/J11.4 show nothing contradicting F3-1/F3-3.

## Interface parity

Website, API and MCP results matched for every capability the spec exercises (J3.2/J3.3 vs J3.1, J4.3-J4.5 vs J4.6, J5.4 vs J5.5, J3.5 vs J3.4, J7.5). No UI_GAP or MOBILE_GAP. One MCP_GAP above.

## Console errors and failed requests

No pageerror and no failed app request other than the expected 400 on POST /api/platform/tokens (J1.3, J1.4, E.1) and 409 on POST /api/resume-outputs/:id/share (J5.2). Blocked cdnjs three.js requests logged as external_blocked.

## Observations (not scored)

- Spec names the administrator `betsy@test.local`; create-test-member created `admin@test.local` (from ADMIN_EMAIL). Used that account.
- On J1.4 three red alerts were stacked (the J1.3 "Give the token a name" alert stayed visible beside two "Choose at least one scope" alerts); stale alerts accumulate instead of being replaced.
- create-test-member for gated@test.local printed a `check_for_column_name_collision` error line yet created the account.
- An earlier validator left stale lines in the shared round-4 steps.jsonl (older timestamps, ports 7302). I kept only this run's lines (original copy: /var/tmp/sbpg/agents/val-16100-1/steps-all-before-filter.jsonl); some stale same-named screenshots may remain where mine did not overwrite.

## How it was run

Two full passes, each from a freshly dropped and recreated database sb_rl_val_16100_1 (seed ended `[seed] Done.`, then create-test-member, and `--email gated@test.local`). API 16102, Vite dev client 17102 proxying /api, /uploads, /mcp; CLI and curl steps used http://127.0.0.1:17102 as API_BASE. Chromium 1280x900 and 390x844 isMobile + hasTouch, light, en-US, TZ=UTC; login through the form, journeys reached by clicking from /world. Screenshots: /var/tmp/sbpg/release-loop/platform-mcp/round-4/. Step log: /var/tmp/sbpg/release-loop/platform-mcp/round-4/steps.jsonl. Processes stopped by PID, database dropped.
