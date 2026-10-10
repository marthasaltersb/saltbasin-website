# Test result - platform-mcp - round 3

Validator: val-6300-7 · integration head aa329a5 (branch claude/zealous-meitner-5tuft5) · 2026-10-10

```json
{
  "feature": "platform-mcp",
  "baseline": 4,
  "specSha256": "112e4628c92037b86d796dbe756fb4b1597b43ef16371fe1a59d9394f733725a",
  "total": 65,
  "passed": 65,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: **PASS - 65 of 65 steps of baseline v4 passed.** `release-spec-baseline.mjs check` printed `baselines match: platform-mcp v4` (amendment A5 applied). The baseline changed since round 2 (v3 -> v4); round 2 scored 60/65 on v3, so the numbers are read like for like only through the amended steps: J1.4 (six scope checkboxes), J2.1 (96 tools), J11.1/J11.2 (no `Gaps:` line, strict exit 0) and the J10.4 wording. I did not run `diff`; the amended steps above are the A5 changes named in the task.

## Fix verification

- **platform-mcp-r2-T3** (empty state when Gaps only matches nothing): fixed. J10.4 passes on desktop and phone. With **Gaps only** selected there are zero cards and the message "No gaps: every capability works on the website, in the API and as an MCP tool." is shown under the filters (`desktop-J10.4-gaps.png`, `mobile-J10.4-gaps.png`). The three cells for **Import an application package** read Website ready (`World Shell > Journeys > My Resume > Import an application package`), API ready (`POST /api/resume-outputs/import-package`), MCP ready (`application_package_import`), with no gap cell.
- Round 2 failures J1.4, J2.1, J11.1, J11.2 pass against the amended wording (A5): 6 scope checkboxes; 96 tool lines in the stated order then `96 tools`; `check-interface-parity` prints `Interface parity: 72 of 72 ...` with exit 0, no `Gaps:` line, also under `--strict`.

## Interface parity

All 72 capabilities report ready in all three interfaces (J10.1, J10.2: 72 cards, 0 in Gaps only). Each journey that has both a website and a tool step was checked through the platform MCP endpoint with the same user's token, and the results matched what the website showed (J3.2/J3.3 vs J3.1, J4.3-J4.5 vs J4.6, J5.4 vs J5.5, J3.5 vs J3.4). No UI_GAP, MOBILE_GAP or MCP_GAP found.

## How it was run

- Two full passes from separate fresh databases (`sb_rl_val_6300_7`, dropped and recreated between passes), `npm run seed` ending `[seed] Done.`, then `scripts/create-test-member.mjs` (and `--email gated@test.local` for J6.7). API 6314, Vite dev client 7314 (my own config in the scratch directory, proxying /api, /uploads, /mcp to 6314); the CLI and curl steps used `http://127.0.0.1:7314` as API_BASE. Chromium 1280x900 and 390x844 isMobile + hasTouch, light, en-US, TZ=UTC. Login through the form, journeys reached by clicking from `/world`.
- cli steps were logged once (surface `cli`) and re-run in the phone pass with identical results. J6.7 is logged under `cli`; it also has desktop and mobile entries because it includes the gated member's browser token creation.
- Screenshots: `/var/tmp/sbpg/release-loop/platform-mcp/round-3/` (desktop-*.png, mobile-*.png). Step log: `/var/tmp/sbpg/release-loop/platform-mcp/round-3/steps.jsonl`.
- Expected non-2xx only: 400 on POST /api/platform/tokens (J1.3, J1.4, E.1) and 409 on POST /api/resume-outputs/:id/share (J5.2). External font and CDN requests (fonts.googleapis.com, cdnjs three.js) were blocked by the sandbox and are logged as external_blocked. No pageerror and no failed app request in the final runs.

## Harness corrections (not product failures)

- My first start of the test client had its proxy pointing at itself, so the first login failed (500, a dynamic import reset). I fixed the config, reset the log and database, and re-ran everything from J1.1; no result from that run is in the log.
- My J11.4 line from the first desktop run was `fail` only because the m value from J10.1 was not yet saved (j11 ran before j10); I removed that line and re-ran J11.4 after J10.1 (72 equals 72, problems empty). In the phone pass the same ordering printed one `DIVERGES` console line before J10; the later re-run matched.

## Observations (outside any step; not scored)

- **E.5 is stale**: it says the page lists "all eleven tool names (the ten from J2.1 and release_tracker_read)", but J2.1 now has 96 tools. The page lists the eleven named tools each with its scope (my check passes on those names), so it passed literally; the wording should be amended to match the 96-tool list.
- **J7.5**: the error for another person's opportunity is `status` 400 `code` `bad_request` with the required message; a 403/404 would arguably fit better. The spec checks only the message.
- The MCP address shown on Connected Agents is the API server's own address (`http://127.0.0.1:6314/mcp`), while the browser's `/api` goes via the client on 7314; both work.
- Console `Failed to load resource` entries (404 and certificate errors) on `/login` and `/world` come from external fonts and CDN requests, not app requests.
