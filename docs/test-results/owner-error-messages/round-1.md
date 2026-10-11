# Test result - owner-error-messages - round 1

Score (from `scripts/release-spec-baseline.mjs score`, verbatim):

```json
{
  "feature": "owner-error-messages",
  "baseline": 1,
  "specSha256": "8eb46d8077e74a9881d566505fcb82782df39aa59eeb2d2ff014609d770948",
  "total": 25,
  "passed": 25,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Baseline version 1 (unchanged; no diff needed). Commit tested: 1032699 (integration head `claude/zealous-meitner-5tuft5`). `baseline check` passed. Result: **passed = true**.

Environment: fresh database `sb_rl_val_16400_1`, built `dist/` served by `node server/index.js` (NODE_ENV=production) on port 16402, `npm run seed`, `scripts/create-test-member.mjs` for the accounts. Chromium via Playwright, light scheme, en-US, UTC. Desktop 1280x900; phone 390x844 with isMobile and touch (taps). Every journey was walked on both surfaces in a fresh tab, signed in through the login form once and the session reused. Screenshots and the step log are in `/var/tmp/sbpg/release-loop/owner-error-messages/round-1/` (`steps.jsonl`).

## Results by step (desktop and mobile both pass for every row)

P.1, P.2, P.3 setup pass. J1.1 to J1.5, J2.1 to J2.5, J3.1 to J3.6, J4.1 to J4.4, J5.1, E.1, E.2, E.3, E.4 all pass.
Values seen: Journey 1 alert text rgb(165, 57, 31), button 44px, no sideways scroll; Journey 2 toast text exact with no detail line, red background rgb(122, 31, 31); Journey 3 alert background rgb(251, 228, 223), button 44px, red toast; Journey 4 alert colour rgb(179, 38, 30); Journey 5 `[400, "<plain sentence>\nTechnical detail: Unexpected end of JSON input"]`; E.4 `[401, "unauthorized"]`; E.3 phone alert right edge 348px of 390, parent card right edge 366px, no sideways scroll.

## Interface parity

- API: Journey 5 route `POST /api/release-intelligence/import/snapshot` (same route the UI calls in Journey 2) returns the same sentence.
- MCP: token created through World Shell -> Connected Agents (UI), then `release_import_snapshot` called on `/mcp` with the same broken text returned `isError: true`, `{status 400, code bad_request, message: <same sentence + newline + Technical detail: Unexpected end of JSON input>}`. Matches the UI and API. No MCP_GAP.
- No UI_GAP or MOBILE_GAP: every journey was completed by clicks or taps (file chooser via the page's own input).

## Open bugs from fix details (by baseline step)

None of the open bugs maps to a baseline step, so none can be verified or recurred by the scored steps. Code and behaviour seen (not scored):
- B1 (agent walk cleanup): process issue, not testable here. This agent killed its own server by PID and dropped its database.
- B5 (Methodology Config has no phone route): not a journey in the spec; the spec and change doc state the limitation. Not tested.
- B6 (LonetreeMvpPanel shares one status string for success and failure): still true in code (`setSaveState` used for both; change doc "Known limitations" says the same). Not covered by a step.
- B7 (about 200 pass-through `setError(e.message)` sites): still present (e.g. `src/components/blocks/ColumnWidgets.jsx:156`, `blocks/index.jsx:1532,1581`). Not covered.
- B10: `src/components/admin/MyResumePanel.jsx:712`, `OutputTemplateConfigurator.jsx:154,270` and `LeadsPanel.jsx:61` still fall back to a bare `HTTP <status>` message. Not covered.
- B11 (public-site blocks): `blocks/ProductExperienceBlocks.jsx:557` still shows `error.message || 'Unable to submit'`. Not covered.
- B12: `scripts/release-scope.mjs` and `server/lib/releaseScope.js` now exist on this head.
- B13: not tested (document cross-reference, no step).

## Observations (outside the baseline, not scored)

1. Sun menu clicks (desktop and phone) intermittently hang for 40s while the 3D scene starves the page. Fallback to `/world?at=island:<id>` as the spec allows was used for J1.5 on both surfaces and for the E.2 reopen of My Resume; all other opens were by click or tap.
2. E.2 in the same tab as Journey 3: the red toast from J3.5 is still on screen when the valid text is submitted, so a literal in-tab reading (any role=alert containing the parser words) would see the old toast. E.2 was run in a fresh tab, where no alert contained the words. Suggest the spec say "in a fresh tab" or wait for the toast to clear.
3. E.2 valid text `{"package": {}}` returns the raw server text `packageKey must be a lowercase slug.` (plain-ish but a field key, outside this step's scope).
4. `GET /api/career-agents/verification-current` was aborted once (net::ERR_ABORTED) when leaving the Qualification Rules screen; four console "Failed to load resource" lines appeared on `/world?at=island:resume` (the expected 400 from the broken-package import). No page errors.
5. Test environment: `ADMIN_INITIAL_PASSWORD` from `/var/tmp/sbpg/env.sh` did not reach the server process through my wrapper, so the admin account has the seed default password; the account script still readied the admin with terms accepted. A first boot also created `admin@saltbasin.net` until `ADMIN_EMAIL` was set explicitly; the database was dropped and recreated before testing.
6. A stale `steps.jsonl` from an earlier session in the round-1 folder was replaced by this run's log; exploratory runs are kept in `/var/tmp/sbpg/agents/val-16400-1/steps-explore.jsonl`.
7. The MCP tools for gate save and package import take structured objects, so the JSON-text sentence applies only to the website and to `release_import_snapshot`.

Cleanup: server stopped by PID, database `sb_rl_val_16400_1` dropped.
