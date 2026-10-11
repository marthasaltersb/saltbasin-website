# Triage: release-scope, round 2

Baseline v2 (A1 approved, A2 rejected). Reproduced by reading code and the round-2 evidence; no code changed.

| Item | Step | Class | Root cause |
|---|---|---|---|
| T2-1 | J3.1 | spec_error | scripts/release-loop-resume.mjs:82-85 deliberately launches a backlog feature that owns an open production bug (HANDOVER "production bugs first"). qr-gated-outputs has open bugs qr-gated-outputs-PR1-2 and -PR1-3 (verifyBy production). The step forbids any qr-gated-outputs file, which contradicts that standing rule and depends on live bug state. |
| T2-2 | J3.2 | spec_error | "no Not launched line" also matches the unrelated line at release-loop-resume.mjs:81 ("Not launched locally (validated on production)"). |
| T2-3 | J4.1 | defect | scripts/session-plan.mjs:45 prints a fixed note; the change spec and the step want "(added after the cut)" for a feature carrying `added`. releaseCut.js:126-129 records only `outOfScope`, so the CLI cannot tell. |
| T2-4 | J5.1 | defect | Parity gap row release-tracker-admin (server/lib/capabilityParity.js:174): server/lib/releaseTrackerService.js:505-515 describes RELEASE_TRACKER_TOOLS but server/lib/mcpToolRegistry.js registers only release_tracker_read and release_tracker_get_state (line ~874). Same root as bug release-scope-F1-3 (earlier triage list was empty, so no triage id to reuse). |
| T2-5 | J5.3 | spec_error | Product is correct: src/components/releaseTracker/TrackerLayers.jsx:37-41 renders one note per `added` entry (9 now, 6 counted, 3 backlog). Step still says "four notes ... other three"; A1 left it unchanged. |

## T2-1 (J3.1, spec_error)
Product matches owner direction (production bugs first; the stderr line "Launched for their production bugs only: qr-gated-outputs" says why). Step is wrong.
Amendment (op change, stepId J3.1, tracesTo HANDOVER "Production bugs" section and release-loop-resume.mjs:82-85):
- before: "Expect no file in `$FX/wf` whose name contains `qr-gated-outputs`, `career-application-journey` or `global-change-standard`, and one whose name contains `release-scope`."
- after: "Expect no file in `$FX/wf` whose name contains `career-application-journey` or `global-change-standard`, and one whose name contains `release-scope`. A file containing `qr-gated-outputs` exists only if stderr also has `Launched for their production bugs only:` naming qr-gated-outputs (it has open production bugs); any other backlog feature without open production bugs has no file."
- why: the launcher's production-bug exception is a standing rule; the old wording fails whenever a backlog feature has an open production bug. J3.2 stays valid with --include-backlog.

## T2-2 (J3.2, spec_error)
Amendment (op change, stepId J3.2, tracesTo docs/changes/release-scope.md line 54, round-2 observation):
- before: "Expect no \"Not launched\" line and a file whose name contains `qr-gated-outputs`."
- after: "Expect no stderr line starting `Not launched (backlog,` and a file whose name contains `qr-gated-outputs`. (A `Not launched locally (validated on production)` line may appear.)"
- why: removes the ambiguity with the unrelated production-validated line.

## T2-3 (J4.1, defect)
Files: scripts/session-plan.mjs:45, server/lib/releaseCut.js:126-129.
Fix: in session-plan.mjs, look up the item's feature in the open release defs (export `activeDefs`, already at releaseCut.js:35, or add `addedAfterCut: true` beside `outOfScope` in releaseCut.js:129; if the latter, keep `outOfScope` the only key J4.2 checks) and print `Note: <feature> is in the backlog of release <v> (added after the cut), not its planned work; recorded as outOfScope.` when `isAddedAfterCut(def)` (releaseScope.js:22), otherwise the current text without the parenthesis. global-change-standard is added after the cut, so the step text is right. Re-run J4.1 to confirm stdout unchanged.

## T2-4 (J5.1, defect)
Files: server/lib/mcpToolRegistry.js (add after release_tracker_get_state, ~line 887), server/lib/releaseTrackerService.js:505, server/lib/capabilityParity.js:174, server/data/mcpToolManifest.json.
Fix: register at least `release_tracker_ingest_snapshot` (admin only; args snapshot/history/updates as object or JSON string with the same safeParse and `jsonProblemMessage` errors as server/routes/releaseTracker.js:76-92, calling `ingestSnapshot({source:'manual', sourceRef:'admin <email>', ...})`) and, to close the whole row, list_snapshots, pull_now, get_settings, save_settings, create_token, revoke_token with the same viewer check as the routes (admin). Append names to the manifest (append-only), set `mcp:` and drop `gap` on the row, run `node scripts/check-interface-parity.mjs` and `--self-test`. Tokens: plaintext is returned once, as the route does. The UI part already passes.

## T2-5 (J5.3, spec_error)
Amendment (op change, stepId J5.3, tracesTo A1 follow-up note; TrackerLayers.jsx:37-41; `show --json`):
- before: "In **Added after the cut**, expect four notes, each with `added 2026-10-10`: release-scope says `counted in this release`; the other three say `kept in backlog`. Each note ends with its reason."
- after: "In **Added after the cut**, expect one note per `added` entry of `node scripts/release-scope.mjs show --json` (A of them), each with `added 2026-10-10`; a note whose entry has `scope` `planned` says `counted in this release` (C of them), the others say `kept in backlog`. Each note ends with its reason. At 2026-10-10T21:05Z these were 9 notes, 6 counted, 3 kept in backlog."
- why: A1 tied counts to the release file; this step was missed. J6.2 has no count and needs no change.

## Validator observations
- Fix verification: F1-3 is T2-4 above. F1-4 (scope change has no UI/MCP) is a documented exclusion; no new step. F1-5, F1-6, F1-7 verified.
- Phone: notes sit in one bordered box with 6px spacing, lines touch the right edge (TrackerLayers.jsx:39-40). Not a baseline failure; coverage_gap candidate: add a J6.2 check "no note line wider than the box (scrollWidth = clientWidth)". Optional, low priority; fix `overflow-wrap:anywhere` and padding in the same file.
- Tracker release key `2026-10-10-production-hardening` vs headings "Release 0.3.0": cosmetic; nothing.
- Terminal-only steps listed as desktop+mobile: spec labelling only; nothing.
- Toast disappearing and identical-snapshot message: expected behavior; nothing.
- Console errors only blocked CDN (environment): nothing.
