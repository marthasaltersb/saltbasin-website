# Reconciliation - world-shell-navigation fix round 3

Branch checked: release-loop/world-shell-navigation-fix-r3 (cabdbc7). Method: code reading, diff against 78f458e, `vite build` (passes). No browser walk (see item 1).

## Reported items
1. No browser self-check was run - kind: process, status: unresolved. Evidence: change spec fix notes say "code-path review only". The build passes and the diff (HerqOutputConfigurator.jsx lines ~559-575) is correct on reading: config is `useState(null)`, set by the `[selectedId]` effect, so the first render now shows "Loading..." (testid editor-loading) instead of "No blocks yet". It is not browser-verified. A validator must walk J6.1 and confirm the 9 BLOCKS rows appear after loading and that no "No blocks yet" flash shows.
2. Root cause in HerqOutputConfigurator.jsx, not the triaged files - kind: informational, status: resolved. Evidence: the file is the shared editor (`config` initial null, populated in an effect), and the diff touches only it plus the change spec. This is the right place, and it was the round-3 observation 1, which is not a scored step.

## Missed failures (the round-3 validation failed 10 of 48 steps; this fix touched none of them)
| Step(s) | kind | status | rootCause | files | proposedFix |
|---|---|---|---|---|---|
| J0.1, J0.2, E.1 | test_harness | unresolved | scripts/create-test-member.mjs has no `--provisional` option (grep count 0), so a must-change-password member cannot be created. Amendment A1 exists in docs/spec-amendments/world-shell-navigation/ but the script was never changed. | scripts/create-test-member.mjs | Add `--provisional` (sets must_change_password, leaves terms per flags). Not a product defect. |
| J2.3, J4.1, J9.1, J9.2, J10.1 | requirement_gap | unresolved | Baseline v3 predates the cover-letter auto-draft, so card counts and the empty-outputs sentence are wrong. Needs an approved amendment, not a code change. | docs/training/world-shell-navigation.md, docs/spec-amendments/world-shell-navigation/ | Amendment reviewer (not the proposer) approves counts 3/2/3/4 and the J2.3 wording; no code edit. |
| J0.3 (phone) | requirement_gap | unresolved | Name chip collapses to the avatar at phone width; spec says full name. | docs/training/world-shell-navigation.md or src/components/WorldShell.jsx | Amend wording ("at phone width only the avatar R"), or show the name at 390px. Owner decides. |
| E.5 | environment | unresolved | No Anthropic key and no fixture for an AI-generated JSON output, so the step cannot be observed. | test fixtures | Provide a fixture, or amend E.5 to the visible generation-failure message. |

## Gaps from the change spec / validation notes the failures missed
- MCP_GAP (owner direction: interface parity, requirement_gap, unresolved): J1.3 has no MCP write tool for Career Master entries (only `career_master_read`); J10.1 has no MCP document-import tool (only `application_package_import`). Files: server/lib/mcpToolRegistry.js, server/lib/capabilityParity.js, server/data/mcpToolManifest.json. Fix: add tools calling the same functions as the routes, parity rows, append to manifest.
- Known limitation: no in-app upload for a package JSON (CLI import script only), so the first package output needs a script. Open requirement gap, owner to accept or schedule.
- Known limitation: tables and figures are preserved, not editable; style fields not editable. Intentional, informational.
- Known limitation: provenance wraps tightly in the 300px rail. Informational.
- Round-3 observations, not fixed: phone Unlink takes about 4 s to remove the card (product_defect, unresolved; OpportunityOutputsSection.jsx refresh path); the right rail covers the 3D world on phone with no close control after Back to World (requirement_gap, unresolved; WorldShell.jsx); re-running `--link-opportunity` after an edit files a new version (product_defect/informational, scripts/import-application-package.mjs); F2-11 package filing is script-only.
- Amendment A3 (J1.5 island entry) is proposed but no step covers entering an island by clicking; still unverified.

Conclusion: the reported fix is correct by reading and build but unverified in a browser; the feature is NOT ready, because 9 of 10 round-3 failures are untouched (harness, amendments, MCP gaps).
