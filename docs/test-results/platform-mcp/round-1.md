# Test result - platform-mcp - round 1

Validator: val-6300-3 · integration head 47203b1 (branch claude/zealous-meitner-5tuft5) · 2026-10-09

```json
{
  "feature": "platform-mcp",
  "baseline": 1,
  "specSha256": "90e711c826f727f990e87ab4494d127c71128f5b08662f8f2f1fc24ac1f74745",
  "total": 62,
  "passed": 62,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: **PASS - every step of baseline v1 passed on every required surface.**

`node scripts/release-spec-baseline.mjs check --feature platform-mcp` printed `baselines match: platform-mcp v1`.

## How it was run

- Two full passes, each from its own fresh database (`sb_rl_val_6300_3`, dropped and recreated between passes), `npm run seed`, then `scripts/create-test-member.mjs`. API on 6306, Vite client on 7306 (proxying /api, /uploads, /mcp to 6306). TZ=UTC, light scheme, en-US.
- Desktop pass: 1280x900, click only. Phone pass: 390x844, isMobile + hasTouch, tap only. Login through the form; every journey navigated by clicking from /world (typed URL only for the start page).
- `[cli]` steps were run with `scripts/mcp-call.mjs` against `http://127.0.0.1:6306/mcp` (the MCP address the Connected Agents page shows), `curl` for E.2-E.4, and `scripts/check-interface-parity.mjs` for J11. They were also repeated in the phone pass because the phone pass needs the same data, and matched.
- Screenshots: `/var/tmp/sbpg/release-loop/platform-mcp/round-1/` (desktop-*.png, mobile-*.png). Step log: `/var/tmp/sbpg/release-loop/platform-mcp/round-1/steps.jsonl`.

## Harness corrections (not product failures)

- An earlier scratch run of J5.2 failed only because my script read the page before the gate dialog rendered; fixed to wait for the dialog, and the full desktop pass was re-run from a fresh database.
- In the final desktop pass, J9.3 first failed because my locator matched the "Token ... revoked." toast instead of the entry (`desktop-J9.3.png` shows the pill Revoked, the line `Revoked 2026-10-09 17:06 UTC` and no buttons), and J11.2 failed because the gaps list line carries a `- ` bullet prefix that my string compare did not strip. Both were re-evaluated against the same pass data (`desktop-J9.3-recheck.png`); the two stale fail lines were removed from steps.jsonl and replaced by the re-evaluation lines. The phone pass used the corrected locator and passed J9.3 first time.

## Interface parity

- Website: every UI step passed on desktop and phone (no UI_GAP / MOBILE_GAP). No horizontal scroll at 390px on Connected Agents (scrollWidth 390) or Capabilities (scrollWidth 390); filter buttons 44px; scope rows 44px desktop / 56px phone; Revoke 44px.
- API/MCP match: for each capability the spec exercises the MCP result agreed with the website: list/open/create opportunity (J3, J4), outputs list/open/new draft version (J4), approve for QR with the same finalization gate (409 tool_category_required via MCP in J5.1, gate dialog in the website J5.2, then the same QR address moved to the newer version in J5.4/J5.5), career master read (J3.5), release tracker read (admin-only, J6.3/J7.3). No MCP_GAP found for any capability the spec exercises.
- The Capabilities screen reports 18 of 43 capabilities in all three interfaces, 3 website gaps, 25 MCP gaps, 0 API gaps; that is the designed parity map, and J10/J11 pass against it. The unexercised MCP gaps (agent hub summary, opportunity scores, outreach, QR revoke, resume outputs list, and others) are listed in the screen; none is covered by a baseline step.

## Network and console

- Page errors: none.
- Expected non-2xx only: 400 on POST /api/platform/tokens (J1.3, J1.4, E.1) and 409 on POST /api/resume-outputs/:id/share (J5.2), per pass, as the spec says.
- External font/CDN requests blocked by the sandbox (fonts.googleapis.com, cdnjs three.js: ERR_CERT_AUTHORITY_INVALID / ERR_TUNNEL_CONNECTION_FAILED, and the 404 console lines that accompany them) are logged as external_blocked. No failed same-origin app request.

## Observations (outside any baseline step, not scored)

1. Career Placement Agents panel (desktop 1280 and phone 390, `desktop-J4.2b.png`, `mobile-J4.2b.png`): the first tracked row (for example "Staff Revenue Engineer PLACEHOLDER") sits flush against the "Automation & Scheduling" button with no spacing, so the button and the row look joined.
2. Capabilities, card "Import an application package": the note says import is command-line only and the Website and MCP cells show GAP, but the API cell lists `POST /api/resume-outputs/import-package`. The note and the API cell read as contradictory; clarify whether that route is an upload route or an internal one.
3. J11.2 expects "the gaps list containing the line `application-package-import: ...`"; in the real output each gap is a bulleted line (`  - application-package-import: ...`). I counted the bulleted item as that line. A future amendment could say "a list item reading".

## Cleanup

Server, Vite and Chromium processes started by this validator were stopped by PID file and the database `sb_rl_val_6300_3` was dropped. No product code, spec or baseline file was changed.
