# Test result: career-bound-outputs, round 4

- Feature: Outputs populate from Career Master with per-output overrides; packages enter Career Master via the reconciliation queue
- Round 4 (re-test after fix round 3). Commit tested: 0800b1c18ce1b2f1003085d0010f95a36fe75932 (integration head `claude/zealous-meitner-5tuft5`). Date: 2026-10-10
- Baseline: v1 of `docs/training/career-bound-outputs.md`, spec sha256 b3bc57959cb82a9cc7ef39f339b23ecf483493cdd633221ff0a8fb63092bb298. `check` passed ("baselines match: career-bound-outputs v1"). Same baseline version as round 3, so scores compare like for like (no diff table needed).
- Method: Chromium (pinned) via Playwright against the production build (`npm run build`, `node server/index.js` on port 5502), fresh database `sb_rl_val_5500_1` seeded with `npm run seed`, accounts from `scripts/create-test-member.mjs`. Logged in through the login form; journeys reached by clicking from the World Shell (typed URLs only `/login`, `/world` and the two the spec names: `/output/resume?owner=me`, `/r/<slug>`). Two full walkthroughs on two fresh databases: desktop 1280x900, then mobile 390x844 (isMobile, hasTouch, taps). Light scheme, en-US, TZ=UTC.
- Raw log: `/var/tmp/sbpg/release-loop/career-bound-outputs/round-4/steps.jsonl`; screenshots next to it.

## Score (from `scripts/release-spec-baseline.mjs score`, copied verbatim)

```json
{
  "feature": "career-bound-outputs",
  "baseline": 1,
  "specSha256": "b3bc57959cb82a9cc7ef39f339b23ecf483493cdd633221ff0a8fb63092bb298",
  "total": 56,
  "passed": 49,
  "failed": ["J9.3", "J9.10", "E.4", "E.5", "E.7"],
  "blocked": ["J9.4", "J9.5"],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

**49 of 56 passed (round 3: 48 of 56).** Failed: J9.3, J9.10, E.4, E.5, E.7. Blocked: J9.4, J9.5. Same result on desktop and mobile.

## Failures

| Step | Surfaces | Expected | Seen |
|---|---|---|---|
| J9.3 | desktop, mobile | Typing `Finance Systems Lead (template)` in the Title box shows the OVERRIDDEN badge, the `Career Master:` line and a Revert button; live preview updates | NEW REGRESSION. The first keystroke makes the whole World Shell go blank (page error `ReferenceError: revert is not defined`). Cause: `OutputTemplateConfigurator.jsx` line 549 (job-field card) uses `onClick={revert}`, but `revert` is only defined at line 586 inside the skills/tools/certifications block. Any job-field override crashes the screen. Screenshot J9.3-desktop.png is an empty dark-blue page. |
| J9.4, J9.5 | desktop, mobile | (blocked) | Depend on the J9.3 override; with the screen blank there is no Save & Set Primary or Revert button. Marked blocked, not skipped. |
| J9.10 | desktop, mobile | Revert on the skill leaves its box reading `Process design`, badge gone | After reload, reverting the skill still removes the whole row (back to the "Add skill override" select). Bug T3-5 NOT fixed. Tool and certification stay overridden; once all are reverted and saved no badge or "(template)" remains. |
| E.4 | desktop, mobile | UI_GAP: a Career Atom sync failure needs a server-side fault no browser user can trigger. Open bugs F3-2 / T3-6 (frozen step needs an amendment). |
| E.5 | desktop, mobile | AMBIGUOUS: spec says "in a red box"; `That is not valid JSON: ...` and `Unsupported outputType: hologram` appear and nothing is filed, but the box is amber (bg rgb(251,235,208)). Proposed wording: "in an amber warning box". Bugs F3-3 / T3-7. |
| E.7 | desktop, mobile | Only font blocks and the one expected 409 in the console | Unexpected page error `ReferenceError: revert is not defined` (the J9.3 crash). Everything else was expected (font blocks, J7.2 409, the 400/409 deliberately provoked by E.5/E.3, navigation aborts). |

## Status of each handed-over bug (by baseline step)

| Bug | Step | Verdict |
|---|---|---|
| F2-6 Save changes disabled styling | J1.2 | Verified fixed: disabled button opacity 0.5, not-allowed cursor, grey fill. J1.2 passes both surfaces. |
| F2-7 dialog visible title | J6.10, J11.2 | Verified fixed: "Career Sources to Review" is the visible dialog heading. Pass both surfaces. |
| cbo-r2-inherited-cream-text, F2-9, F3-8, F3-1 legibility | J1.2, J6.3, J9.6, J10.1 | Verified fixed: the queue page is now a white panel (heading 14.57:1); editor 14.57:1; Sections card 5.4-6.0:1. J6.3 passes. |
| T3-4 tool selectable by name | J9.8 | Verified fixed: `Ledgerly ERP` is in the select; box "Tool Ledgerly ERP for this output". J9.8 passes. |
| T3-5 revert skill keeps box | J9.10 | NOT fixed (fails). |
| F2-3, F1-4, F3-7 (per-document row) | J9.11 | Scope note stands (preset-scoped); J9.11 passes as informational. |
| F2-10, F3-6 (layout prints jobs only) | J9.9 | Matches the spec note; J9.9 passes (values persist, Career Master unchanged). |
| F2-8, F3-4 (convert list ignores existing converted output) | observation, no baseline step | RECURRED: after J6.8 the row still shows an enabled "Convert to career-bound output" and no note that a converted output exists. |
| F1-5 (J8 mutates J7.4 state) | J7.4 | Verified: passes with the spec ordering. |
| F3-2/T3-6 (E.4), F3-3/T3-7 (E.5) | E.4, E.5 | Still need spec amendments (above). |
| F3-5 interface parity | MCP | Still open (below). |
| F1-3 (editor jobs only) | J9.7-J9.10 | Skills/tools/certifications card works (J9.7-J9.9 pass) apart from J9.10. |
| output-version-history-B9, F3-9 | n/a | Not exercised. |

## Interface parity

- Desktop and 390 px phone: every step walked on both surfaces; layout fine at 390 px (J10.1 passes, no sideways scroll).
- API: the UI calls `GET/POST /api/career-bound/outputs`, `PUT /api/career-bound/outputs/:id`, `POST .../preview`, `GET /api/career-bound/convertible`, `POST /api/career-bound/convert/:id`, `POST /api/career-reconciliation/package-sources`, `POST /api/career-reconciliation/tasks/:id/resolve`, `POST /api/resume-outputs/:id/share`, `PATCH /api/resume-outputs/:id/status`.
- MCP_GAP: `server/lib/mcpToolRegistry.js` now exists (110 tools; `scripts/check-interface-parity.mjs` reports 72 of 72 capabilities) but has no tool and no `capabilityParity.js` row for this feature: create/edit a career-bound output, per-field override and revert, add a bullet to Career Master or one output, review-queue task approve/reject, convert a package to a career-bound output, per-preset master overrides. The only related tool, `application_package_import`, files outputs and does not create reconciliation tasks. The parity check passes only because these capabilities are not listed in the map.

## Observations (not scored)

- The J9.3 crash only happens when a job-field override exists, so J9.6-J9.9 (skills/tools/certifications) still work when no job override is typed.
- Default layout still prints jobs only (matches the spec's J9.9 note).
- Disclosure: the raw round-3 log `round-3/steps.jsonl` lost 13 lines (J9.x, J11.2, E.7 desktop) because a helper script of mine still pointed at that folder; the round-3 report text is unaffected.
- Test-run corrections (disclosed): the desktop walk was run twice. The first pass found the J9.3 crash; I then added crash handling to the harness (record J9.3 fail, J9.4/J9.5 blocked, reload, continue) and ran a full second desktop pass from a fresh database, which is what the log holds. For J9.8 on desktop the harness expected four Revert buttons (a stale count); the card correctly has three, so the result was corrected from fail to pass after reading the screenshot. For J11.2 the harness required an aria-label on the dialog; I changed it to the visible-title check, matching J6.10.
- Cleanup: server stopped, database `sb_rl_val_5500_1` dropped.
