# Triage - no-silent-failures - round 3

Tested commit 47ee197 (baseline v3, 28 of 29 passed). Triage read integration head 24a15d8. No code or spec was changed.

## T-R3-1 [J5.2] Experience trend and Career timeline say "no data" after RESTORE (recurrence of T-R2-2, open bug T1)

- Class: defect.
- Root cause: `src/components/Output.jsx` `useOutputTemplateConfig()` (line ~1176) fetches `/api/career/master` with `?owner=` only when the URL has `?owner=` or `?profile=` (`useOutputOwnerSlug`, line 1148). On plain `/output/resume` the owner is empty. `server/routes/careerMaster.js` `resolveOwnerUserId()` (about lines 573-581) then falls back to `resolveDefaultAdminUserId()`, the platform admin, whose Career Master has no dated roles. The same hook's `/api/career/proficiency` call is session-scoped (`requireUser`), so PROFICIENCY shows the member's data while the trend and timeline charts read the admin's. This is why J5.2 shows "Not enough dated Career Master records..." and "No dated roles in Career Master yet." for a member who has a dated job. J5.6 (`/r/<slug>`) draws the same job because the shared-output route is owner-scoped.
- Why J4.1 still passes: with the fault injected, the master request returns 500, so the error alert shows whoever the owner is. The wrong-owner read is only visible when the request succeeds.
- Reproduce: sign in as member@test.local with a dated job, open `/output/resume` with no query string, and watch the `/api/career/master` request. It has no `owner` parameter, and its jobs array is the admin's. (Found by code reading plus the validator's screenshots J5.2-desktop.png and J5.2-mobile.png; not re-driven in a browser by triage.)
- Proposed fix (client only, no server or data change):
  1. In `useOutputTemplateConfig`, use `useAuthState()` (Output.jsx line 64) and wait for it to finish loading. Build the effective owner as `owner || (user ? 'me' : '')`. `resolveOwnerUserId` already maps `'me'` to the signed-in caller.
  2. Put that effective owner in the effect's dependency list.
  3. Anonymous visitors with no `?owner=` keep today's platform-admin fallback, so public pages are unchanged.
  4. Apply the same effective owner in `ResumeOutput` for `fetchCareerMaster(ownerSlug)` and `useResumeRollups(ownerSlug)`. They have the same empty-owner fallback.
  5. Do not change `resolveOwnerUserId`. Making the server prefer the session user would change what a signed-in visitor sees on Betsy's public pages.
- Files: src/components/Output.jsx, src/lib/resumeRollups.js, src/lib/careerMaster.js (its cache key is the slug, so `'me'` does not collide with `__admin__`).
- Also check the other `/output/*` pages that call `useOutputTemplateConfig` or `fetchCareerMaster` (open observation F1-5, no baseline step covers it).

## T-R3-2 [MCP_GAP] Output templates have no MCP tool (recurrence of T-R2-4)

- Class: environment. The validator tested a commit older than the fix.
- Root cause: at 47ee197, `server/lib/mcpRouteTools.js` and `capabilityParity.js` had no output-templates entries. Commit 49d0e2d ("Fix round 4: ... MCP tools for career-bound and reconciliation", 2026-10-10 01:43Z) added `'server/routes/outputTemplates.js': '/api/output-templates'` to `GOVERNED_ROUTE_FILES` (capabilityParity.js line 29), the capability row `output-template-presets` (line 96), and seven tools in `mcpRouteTools.js` (lines 101-107): `output_templates_list`, `output_templates_primary_read`, `output_templates_portfolio_read`, `output_template_public_read`, `output_template_create`, `output_template_update`, `output_template_delete`. 49d0e2d is in head 24a15d8 but not in the tested 47ee197.
- Check at 24a15d8: `node scripts/check-interface-parity.mjs` reports "99 of 99 capabilities work in all three interfaces (UI gaps 0, MCP gaps 0, API gaps 0)... 175 tools, manifest 175. OK".
- Fix: none. Re-validate on the current head. To confirm, call `output_templates_primary_read` and compare it with `GET /api/output-templates/primary`.
- Note: these tools cover the template config only. They do not read what `/output/resume` draws; the charts get Career Master data separately, which is why T-R3-1 is a different bug.

## Coverage items from the validator observations

### T-R3-3 P4 is ambiguous (gallery or console fixture) - coverage_gap
- Amendment (setup step P4):
  - Before: "if the gallery is present use it; otherwise use the console fixture"
  - After: "do the gallery steps, then also run the console fixture, so the saved primary template gives the header 'Pat Example' and the titles 'Proficiency:', 'Experience trend:', 'Career timeline:'"
  - Traces to: J4.1, which expects those exact strings. A gallery-only template gives "Test Member" and "Proficiency Tiers / Trend Bars / Career Timeline", so J4.1 cannot be met by the "use the gallery" reading. Wording is the validator's proposal; the reviewer should confirm it.

### T-R3-4 J1.3 "Failed to load career master data" toast is navy, not red (recurrence of T-R2-5) - coverage_gap
- Root cause: `CareerMasterPanel.jsx` (~line 363) calls `toast(...)`, the success style, for a load failure. The J1.3 step checks only the text.
- Amendment (J1.3):
  - Before: step checks the toast text only.
  - After: "...and the toast is a red error toast".
  - Traces to: the change spec's rule that load errors read as errors, and A4, which already requires red for the snapshot error toast. Apply it only together with the product fix (change that call to `toast.error(...)`), or the step will fail.

### Other observations: no new step
- Duplicate toast DOM nodes (one visible), the 390px red J3.4 toast overlapping card text for a few seconds, and the hidden Classic Tools tab strip at 390px (World Shell, Journeys is the phone route): cosmetic or already covered.
- Fresh-database boot race ("duplicate key value violates unique constraint pg_type_typname_nsp_index"): environment, a concurrent-DDL race in `db.js` bootstrap. Not part of any step; worth a separate bug.
- F1-5 and F1-6 (lenient fetches on other /output pages, fire-and-forget Career Atom sync and audit writes): outside this feature's journeys.
- E.2 has no written setup for FAULT A (the validator cleared Pipeline Tracker's category in the UI, applied FAULT A, imported pkg_v3, approved the new draft, cancelled, restored). Coverage gap for the reviewer to word; no wording proposed here.
- Process note: the validator's `pkill -f` may have killed a sibling validator's script around 01:32Z; that validator may need a re-run.
