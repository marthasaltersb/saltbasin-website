# Triage: career-bound-outputs, round 4

Code read at integration head 6a71095. Root causes found by code reading (no server started; each is a deterministic JSX wiring error). No code changed, no spec edited.

## T4-1 (J9.3, J9.4, J9.5, E.7) defect, regression from commit 4a70228
Root cause: `src/components/admin/OutputTemplateConfigurator.jsx` line 549 (job-field override block) has `onClick={revert}`. `revert` is declared only at line 586, inside the skills/tools/certifications map callback, so it is out of scope at 549. The button renders only when `over` is true, so the first keystroke that creates a job override throws ReferenceError and React unmounts the World Shell. Commit 4a70228 (round 3 fix for T3-5) changed the wrong button.
J9.4 and J9.5 are blocked by this; E.7 fails only on the page error.
Fix: line 549 `onClick={() => setField(null)}`.

## T4-2 (J9.10) defect, recurrence of T3-5
Root cause: the skill/tool/certification Revert button at line 595 still has `onClick={() => setField(null)}`. `shownIds` (line 568) = override keys plus `ovPicks`. `withOverride` (src/lib/masterOverrides.js 37-44) deletes the id key when its last field clears. After reload `ovPicks` is empty, so the row leaves `shownIds` and returns to the "Add skill override" select. The `revert` helper at line 586 (clear field and add id to `ovPicks`) is the intended handler and is unused.
Fix: line 595 `onClick={revert}`. Re-validate J9.10 after a reload, and that tool and certification overrides stay.

## T4-3 (E.4) spec_error (recurrence of F3-2 / T3-6)
Product matches the change spec: `server/lib/packageReconciliation.js` records `syncError`, `server/routes/careerReconciliation.js` lists `status=sync_failed` and has `POST /tasks/:id/retry-sync`. The sync fails only on a server-side fault no browser user can cause, so the step cannot be executed as a browser journey.
Amendment (change, E.4):
- before: "Sync failure. If a Career Atom sync fails after an approval, a toast says "Applied to Career Master, but the Career Atom sync failed: ..." and the task appears under "Applied - sync failed" with Retry sync."
- after: "Sync failure (verified by the integrator script, not the browser walk). With the Career Atom sync forced to fail by a test fault, an approval returns syncFailed true with a syncError, GET /api/career-reconciliation/tasks?status=sync_failed lists the task, and POST /tasks/:id/retry-sync with the fault removed clears it. The toast text and the "Applied - sync failed" list with Retry sync are checked by rendering the panel with a task whose metadata carries syncError."
- traces to: change spec career-bound-outputs, reconciliation approvals with sync-failure retry.

## T4-4 (E.5) spec_error (recurrence of F3-3 / T3-7)
`CareerReconciliationPanel.jsx` line 239 throws "That is not valid JSON: ..." and the panel renders it in its standard `warnBox` (line 49, #FBEBD0 background, #5C3B08 text, amber). Message, server message and nothing-filed behavior all match; only the color word is wrong.
Amendment (change, E.5): before "... in a red box; ..." after "... in an amber warning box; ...". Traces to the panel's existing warnBox style; the change spec requires the message text, not a color.

## T4-5 (MCP_GAP) defect (recurrence of F3-5)
No entries for this feature in `server/lib/mcpToolRegistry.js` or `server/lib/capabilityParity.js`. `scripts/check-interface-parity.mjs` passes because `server/routes/careerReconciliation.js` and the output-override routes are not in `GOVERNED_ROUTE_FILES`.
Fix: add append-only tools calling the same exports as the routes (`importPackageAsSource`, `resolvePackageTask`, `retryTaskSync`, convert-to-career-bound, create/edit career-bound output, field override/revert, add bullet to Career Master or output only, per-preset master overrides), a parity row for each, update `server/data/mcpToolManifest.json`, and add the route file to `GOVERNED_ROUTE_FILES`.

## Validator observations
- F2-8/F3-4 recurrence (queue row keeps an enabled "Convert to career-bound output" after conversion): coverage_gap. Amendment (add): "[J6.8a] After converting, the queue row shows a note that a converted output exists, and the Convert button is disabled or reads 'Open converted output'." Traces to the round 2 and 3 convert-flow observations.
- Fixes verified (J1.2, J6.10, J11.2, J6.3, J9.8): nothing to do.
- Harness disclosures: nothing for product; raw logs should not be trimmed.

## Environment
No server or database started; nothing to clean up. No command failed.
