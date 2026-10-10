# Test result - world-shell-navigation - round 3

Commit tested: `0800b1c18ce1b2f1003085d0010f95a36fe75932` (integration head, "Merge release-loop/release-intelligence-spec-r1 (amendments A1, A2: baseline v3)")
Validator: validation agent val-5400-1 (Chromium 1194 via Playwright, desktop 1280x900, phone 390x844 isMobile+hasTouch, light, en-US, TZ=UTC; fresh database + `npm run seed` per surface, API 5402).
Evidence: `/var/tmp/sbpg/release-loop/world-shell-navigation/round-3/` (steps.jsonl, screenshots).

```json
{
  "feature": "world-shell-navigation",
  "baseline": 3,
  "specSha256": "f61ab19a9a82a2a758ab250543526c76f3ebbc14262cf8eb3d2187adcec0bb67",
  "total": 48,
  "passed": 38,
  "failed": ["J0.1","J0.2","J0.3","J2.3","J4.1","J9.1","J9.2","J10.1","E.1","E.5"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Result: NOT PASSED (38 of 48). `release-spec-baseline.mjs check` passed (v3). Round 2 scored 36/47 on v2; v3 only changed E.7 and added E.9 (diff: same 46, changed E.7, added E.9, retired none).

## Baseline diff (v2 -> v3, amendment A2)
| same | changed | added | retired |
|---|---|---|---|
| J0.1-J12.4, E.1-E.6, E.8 | E.7 (now UI half only) | E.9 (cli: second member API + MCP) | none |

## Method
Desktop pass then a full phone pass, each on a freshly created and seeded database; member created with the exact spec command (`create-test-member.mjs ... --provisional --no-terms`); second member `second.member@example.test` for E.7/E.9. Navigation by clicking from the World Shell; J3/E.8 are the spec's own CLI commands. J12 on the desktop surface = the desktop window resized to 390x800 (non-touch); on the mobile surface = the phone profile. Tokens for MCP were created in the UI (World Shell -> Journeys -> Connected Agents) and used against `/mcp`. External font/CDN requests are blocked in the sandbox (type `external_blocked`, ignored). No page errors, no failed app requests; the only 4xx/5xx were the expected ones (400 No changes to save, 409 category gate, 400 no Anthropic key, my injected 500 for E.2).

## Failures (every other step passed on desktop and phone)
| Step | Surface | Expected | Observed | Class guess |
|---|---|---|---|---|
| J0.1 | desktop, mobile | `/first-login-password?next=/world` with "Set your own password" | `UI_GAP`/`MOBILE_GAP`: `create-test-member.mjs` ignores `--provisional` (no such option) and always clears `must_change_password`; login went straight to `/world` (terms prompt). Recurrence of B9 / F2-6 / wsn-B9. | harness (script option missing) |
| J0.2 | desktop, mobile | password page, then `/world` with terms | blocked by J0.1, no password page exists to fill in | same |
| J0.3 | mobile | top bar, "Riley Fenn · Member", toast "Consent recorded", counters 0 TRACKED / 7 AGENTS | `AMBIGUOUS:` toast, tabs and counters 0 / 7 all seen on the phone (counters fix wsn-r2-mobile-counters verified), but the name chip collapses to the avatar R. Desktop passes. Proposed wording: "Riley Fenn · Member (at phone width only the avatar R)" | spec wording |
| J2.3 | desktop, mobile | detail view includes the sentence "No outputs linked to this opportunity yet..." | `AMBIGUOUS:` toast, placeholder box, score inputs, Save details, LINK AN EXISTING OUTPUT sentence all present, but a template-built "Cover Letter - Principal Value Architect at Northwind Freight" DRAFT card is auto-created on Track (cover-letter auto-draft 4be0bec), so the empty-outputs sentence is absent. Open F2-5. | spec predates auto-draft |
| J4.1 | desktop, mobile | exactly two cards (Cover Letter, Salt Basin Resume) | `AMBIGUOUS:` three cards: package Cover Letter, package Salt Basin Resume, auto-drafted cover letter. Proposed: expect three cards. F2-5. | spec predates auto-draft |
| J9.1 | desktop, mobile | after Unlink "one card left", select options `Choose an output...` and `Northwind Freight - Cover Letter (cover letter, Draft)` | `AMBIGUOUS:` the select shows exactly the specified options; two cards remain (resume + auto-drafted letter). Proposed: two cards left. F2-5. On the phone the card took about 4 s to disappear after the tap (see observations). | spec predates auto-draft |
| J9.2 | desktop, mobile | after Link output "two cards again" | `AMBIGUOUS:` three cards again. Proposed: three. F2-5. | spec predates auto-draft |
| J10.1 | desktop, mobile | import `/tmp/note.txt` gives "a third card" "Imported Resume - note.txt", Source "Imported document (uploaded by you)", Authors "none recorded", "resume - version 1 of 1" | card content is exactly as specified; it is the fourth card (auto-drafted letter). Same F2-5 count issue. | spec predates auto-draft |
| E.1 | desktop, mobile | provisional login redirects to password page | `UI_GAP`/`MOBILE_GAP`: no provisional-password member can be produced (same cause as J0.1). | harness |
| E.5 | desktop, mobile | a non-editable (AI-generated JSON) output shows the reason instead of Edit draft | not observable: the only UI path, "Generate Resume for This Opportunity", returns HTTP 400 "No Anthropic key configured..." and the UI shows "Resume generation failed: ..." (visible, nothing created). No fixture produces an AI-generated JSON output. F2-7. | missing fixture/key |

## Passed on both surfaces (highlights)
J0.3 (desktop), J1.1-J1.4, J2.1, J2.2, J2.4, J3.1-J3.3 (CLI; run with `Member!Pass#2468xx` because J0.2 could not set `...yy`; resume `#2`, cover letter `#3`, because the auto-drafted letter takes `#1`), J4.2 (every provenance value exact), J5.1-J5.2, J6.1-J6.5 (editor rows, preview, 400 "No changes to save.", only four block types, save as version 2), J7.1-J7.5 (confirm box, category dialog, cancel message, APPROVED - QR LIVE, QR page with LIVE DATA banner), J8.1-J8.2 (old QR bullets until re-approval, same slug), J10.2, J11.1, J12.1-J12.4 (no horizontal scroll, panel margins 8px, one-column editor, confirm box fits, no category dialog second time), E.2 (browser-level 500 on `/api/member-config/draft` shows "Your islands could not be loaded: Simulated outage"), E.3, E.4 (a second technology without a category re-triggers the dialog; Cancel leaves the draft), E.6 (unlinked output still in My Resume -> Resume Output History and under LINK AN EXISTING OUTPUT), E.7 (second member sees TRACKED (0); no Riley data in the link select or My Resume), E.8, E.9 (cli).

## Fix verification (by step id)
| Open item | Maps to | Result |
|---|---|---|
| world-shell-navigation-B9, F2-6, wsn-B9 (no `--provisional`) | J0.1, J0.2, E.1 | NOT fixed: the option is still missing |
| wsn-r2-mobile-counters | J0.3 (phone) | Fixed: phone top bar shows 0 TRACKED and 7 AGENTS (remaining J0.3 phone failure is only the name chip wording above) |
| wsn-r2-mcp-gap / F2-12 | parity | Fixed on this head: `/mcp` serves 110 tools incl. the spec capabilities below; parity checked |
| F2-2 (J9/J11 browser walk) | J9.x, J11.1 | Walked in a browser on both surfaces: J11.1 passes; J9.x fails only on the auto-draft card count (F2-5) |
| F2-5 | J2.3, J4.1, J9.1, J9.2, J10.1 | NOT fixed: baseline v3 still predates cover-letter auto-draft (needs an approved amendment) |
| F2-7 | E.5 | NOT fixed: no key/fixture, the step is not testable as written |
| F2-8 | E.5 observation | The generation error is shown as visible text ("Resume generation failed: ..."); toast styling not separately judged |
| F2-9 / wsn-r2-e7-foreign-id | E.7 / E.9 | Fixed by A2: UI half passes (E.7), API + MCP half passes (E.9) |
| F2-10 (J1.5 coverage), F2-11, B11 / wsn-r2-b11-island-entry | none | No baseline step; not scored. The 3D world rendered (WebGL via software) but entering an island by clicking it was not exercised (no step) |
| F2-11 (package filing only by script) | J3 | still script only; the spec's own step, not a gap by itself |

## Interface parity
- API: the UI calls (`POST /api/career-agents/opportunities`, `.../resume-outputs/:id/versions`, `POST /api/resume-outputs/:id/share`, `GET /api/career-agents/opportunities/:id/outputs`, generate-resume, link/unlink) were seen in the network log; permission refusals return 400/404 for another member.
- MCP (`/mcp`, personal access token made in the UI, both members): `career_opportunities_list`, `application_outputs_list` (same provenance as the UI), `application_output_open`, `application_outputs_unlinked_list`, `career_master_read`, `application_output_approve_for_qr` (409 `tool_category_required`, same gate as the dialog), `application_output_new_draft_version` ("No changes to save." 400, same as UI) all match. Second member: `application_outputs_list` -> "Not your career opportunity.", `application_output_approve_for_qr` -> 404 not found (E.9).
- MCP_GAP: J1.3 (add a Career Master entry) - only `career_master_read` exists, no write tool for tools/skills/jobs. MCP_GAP: J10.1 (import a PDF/DOCX/TXT document into an opportunity) - only `application_package_import` exists, no document upload tool. J0.x (password/consent) are human-only gates, listed for the owner, not counted as gaps.

## Observations (not scored)
1. Editor opens with "0 BLOCKS / No blocks yet - add one below." for about 1 to 3 seconds before "9 BLOCKS" loads (a misleading empty state while loading).
2. On the phone, Unlink took about 4 s to remove the card (select updated first); a 1.8 s check still saw the card.
3. Re-running `--link-opportunity` after the resume was edited filed a new version (`#10`/`#11 new_version`) of the package resume; opportunity and cover letter were not duplicated (E.8 passes), but the second run is not a no-op for edited outputs.
4. On the phone the right rail fills the screen over the 3D world after "Back to World"; there is no visible close control (tabs still work).
5. The J3.2 ids on a fresh database are `#2` and `#3`, not `#1` and `#2`, because the auto-drafted letter takes `#1`.
6. The J12.3 layout recheck and the J6.4 live-preview recheck on desktop re-opened the editor without saving; the corresponding saves were verified in the same walk.

## Proposed amendments (for the amendment reviewer)
- J2.3, J4.1, J9.1, J9.2, J10.1: expect the auto-drafted "Cover Letter - Principal Value Architect at Northwind Freight" card (three cards after J3, two after J9.1 unlink, three after J9.2 relink, four after J10.1); J2.3: replace the empty-outputs sentence with the auto-drafted card.
- J0.3: add "at phone width only the avatar R".
- E.5: provide a fixture or key, or restate as "Generate Resume shows the visible failure when no key is configured".
- Harness: add `--provisional` to `scripts/create-test-member.mjs` (J0.1, J0.2, E.1).

## Cleanup
Server stopped (PID file), database `sb_rl_val_5400_1` dropped. Nothing committed; spec and baseline files untouched.
