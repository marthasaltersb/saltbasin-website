# Test result - platform-mcp - round 2

Validator: val-6300-1 · integration head 0800b1c (branch claude/zealous-meitner-5tuft5) · 2026-10-10

```json
{
  "feature": "platform-mcp",
  "baseline": 3,
  "specSha256": "5b0b3bc8c3c4bf0c977e49f66e592d7370a566bc0edab9fd3ed2e50f3220726c",
  "total": 65,
  "passed": 60,
  "failed": ["J1.4", "J2.1", "J10.4", "J11.1", "J11.2"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: **FAIL - 60 of 65 steps of baseline v3 passed; 5 failed.** `release-spec-baseline.mjs check` printed `baselines match: platform-mcp v3`. The baseline changed since round 1 (v1 -> v3, amendments A1-A3): `diff` v2 -> v3 shows 69 comparable ids, all same, none changed/added/retired. Round 1's 62/62 was against v1, so it is not like for like with 60/65 on v3 (v3 adds the gated-member steps J6.7-J6.9 and new J10.4 wording).

## Failures (baseline step ids)

All five come from the product having grown past what the frozen spec literally says (the B5 fix built the missing tools and screens), except J10.4, which is a product empty-state bug. Reported as failures with proposed amendments; spec untouched.

- **[J1.4]** Expected four scope checkboxes. Seen 6: career.read, career.write, outputs.approve, release.read (administrators only), plus release.loop.read and release.loop.write (administrators only), on desktop and phone (`desktop-J1.4.png`, `mobile-J1.4.png`). The red alert text is correct. Proposed amendment: "Expect six scope checkboxes (the four named plus release.loop.read and release.loop.write)".
- **[J2.1]** Expected exactly 10 tool lines ending `10 tools`. Seen the 10 expected tools interleaved with many more (output_versions_list, output_version_read, output_versions_compare, application_output_revoke_qr, application_package_import, shared_output_resolve, career_opportunity_update_details, application_outputs_unlinked_list, application_output_link, application_output_unlink, cover_letter_settings_read, ...); the registry holds 110 tools. Proposed amendment: the 10 named tools are present in this relative order and the final line equals the number of tool lines.
- **[J10.4]** The cells now read correctly (Website ready `World Shell > Journeys > My Resume > Import an application package`, API ready `POST /api/resume-outputs/import-package`, MCP ready `application_package_import`, no gap cell). But with **Gaps only** selected there are zero cards and **no message**: the area under the filters is blank (`desktop-J10.4-gaps.png`, `mobile-J10.4-gaps.png`). The spec requires the no-gaps message; a blank, contextless result is a product defect. Same on phone.
- **[J11.1]** Expected a `Gaps:` list. The script prints `Interface parity: 72 of 72 capabilities work in all three interfaces (website UI gaps: 0, MCP gaps: 0, API gaps: 0).`, the governed routes line (134 routes, 110 tools, manifest 110) and `OK: the registry matches the code.`, exit 0; no `Gaps:` list because there are none. Proposed amendment: "a `Gaps:` list when any gap exists".
- **[J11.2]** Expected exit 1, the `application-package-import: UI_GAP MCP_GAP - ...` line and `FAIL (--strict): gaps remain.`. Seen exit 0 and the same output as J11.1 (no gaps remain; J10.4 in the same baseline says that capability is ready, so J10.4 and J11.2 contradict each other). Proposed amendment: with zero gaps `--strict` exits 0; test the failing case another way.

## Fix verification (open bugs from the fix details)

- **platform-mcp-B5** (parity for every capability): verified. 72 of 72 capabilities work in all three interfaces, 0 UI / MCP / API gaps (J10.1, J10.2, J10.3, J10.4 cells, J10.5, J11.3, J11.4 pass). The residual failures are J10.4 empty state and the J11.1/J11.2 wording, above.
- **platform-mcp-B10** (screens reachable from the World Shell): verified. Connected Agents and Capabilities are Journeys cards that open full-screen on desktop and phone (J1.1, J1.2, J7.1, J10.1 pass; J7.6 member has no Capabilities card). No admin_nav / AdminShell / defaultMemberConfig entry for either screen found by grep.
- **platform-mcp-B11** (bearer-token auth on /mcp): verified. J2.2, J2.3, J9.4, J9.5, E.3 (401), E.2 (GET 405) pass.
- **platform-mcp-B12** (account gates, 428): verified. J6.7 (cli), J6.8 (428 `career_terms_required` with the exact message; `list` exits 0) and J6.9 (terms page for the gated member; after accepting, the same call returns isError false) pass on desktop and phone.

## How it was run

- Two full passes from separate fresh databases (`sb_rl_val_6300_1`, dropped and recreated between passes), `npm run seed` ending `[seed] Done.`, then `scripts/create-test-member.mjs` (and `--email gated@test.local` for J6.7). API 6302, Vite dev client 7302 proxying /api, /uploads, /mcp. Chromium 1280x900 and 390x844 isMobile + hasTouch, light, en-US, TZ=UTC. Login through the form, journeys reached by clicking from `/world`.
- `[cli]` steps (`scripts/mcp-call.mjs`, curl for E.2-E.4 and the J6.7 consent withdrawal, `check-interface-parity.mjs`) were logged once as surface `cli`; they were re-run in the phone pass and matched (J2.1, J11.1, J11.2 diverge identically).
- Screenshots: `/var/tmp/sbpg/release-loop/platform-mcp/round-2/` (desktop-*.png, mobile-*.png). Step log: `/var/tmp/sbpg/release-loop/platform-mcp/round-2/steps.jsonl`.

## Harness corrections (not product failures)

- My first J6.7 helper run executed `create-test-member.mjs` against the shared `DATABASE_URL` from `env.sh` instead of mine (my run script had not overridden it). It created `gated@test.local` and re-readied `betsy@test.local` in the shared database `sb`, and the login in my app then failed (one `http_401 POST /api/auth/login` in the log). I fixed `run.sh` and re-ran J6.7-J6.9 correctly. Residual: user `gated@test.local` exists in database `sb`; I did not delete it.
- E.6 (desktop and phone): my first evaluation also demanded exactly four scope rows, which belongs to J1.4. Re-evaluated literally (all scope rows >= 44px: 44px desktop, 56/85px phone; Revoke 44px): pass. The stale fail lines were removed from steps.jsonl.
- J3.1 (phone): the harness read the page 3.0s after Track; the auto-created cover letter card appeared at ~3.4s (probe), so the first evaluation saw no card. Re-evaluated as pass and the stale fail line removed; the Tracked-list half had passed in the same run.
- P.1-P.4 lines logged prematurely were removed and re-logged after both passes were complete.

## Interface parity

- Website: every UI step passed on desktop and phone except J1.4 and J10.4; no UI_GAP / MOBILE_GAP. No horizontal scroll at 390px on Connected Agents (scrollWidth 390) or Capabilities (390); Create token and filter buttons 44px; Revoke 44px.
- API/MCP: results matched the website for opportunities (J3, J4), outputs and drafts (J4), approve for QR with the same finalization gate (409 `tool_category_required` via MCP in J5.1, dialog in the website in J5.2, same QR address moved in J5.4/J5.5), Career Master read (J3.5), release tracker (J6.3, J7.3), gated terms (J6.8). No MCP_GAP found.

## Console errors and failed requests

- Expected non-2xx: `POST /api/platform/tokens` 400 x6 (J1.3, J1.4, E.1 on both passes), `POST /api/resume-outputs/:id/share` 409 x2 (J5.2).
- One unexpected 401 on `/api/auth/login` (harness mistake above). No page errors, no failed app requests.
- Blocked external requests only: Google Fonts css2 (ERR_CERT_AUTHORITY_INVALID), cdnjs three.js r128 (ERR_TUNNEL_CONNECTION_FAILED), the generic `Failed to load resource` lines they cause, and a favicon 404.

## Observations (not scored)

- Connected Agents: a failed token create shows the alert in the page and a toast at once; at 1280x900 two copies of the toast overlap at bottom right (`desktop-J1.4.png`).
- On phone the auto-created cover letter card in APPLICATION OUTPUTS appears ~3.4s after Track and sits below the "Placeholder opportunity" editor, so at first view the detail shows no outputs.
- The spec header still reads "Version 1 · 2026-10-09" while the frozen baseline is v3 (no steps affected).
- E.5 passes literally (all eleven tools with scopes are listed) but the page lists far more tools; goes with the J2.1 proposed amendment.

## Fix details received

Open bugs platform-mcp-B5, B10, B11, B12 (see Fix verification). B12's "training spec lacks a step" is now covered by J6.7-J6.9, which pass.
