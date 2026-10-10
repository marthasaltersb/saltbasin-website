# chart-gallery round 5: scope review

Base: a5e7883^1 (312f128), first parent of the earliest chart-gallery merge 8430eae. Feature build commit 6dd06e5. Integration head a21aaec.
No server started, no database created; this review reuses round 4 decisions (docs/triage/chart-gallery-round-4-scope.md, docs/triage/scope-review.json) after re-checking the base code by git inspection. No contrary evidence found. Code unchanged.

| id | scope | evidence |
|---|---|---|
| CG-R3-2 | pre_existing | Base AdminShell.jsx has only `sb-admin-mobile-toggle` (editor sidebar toggle, lines ~618/640) and no view-selector menu/drawer JSX; the view selector lives only in `.sb-admin-topbar-actions`, hidden at <=900px. The brand.css drawer classes predate the gallery (eb62057). Admin mobile navigation is not in the gallery request. Recurrence across rounds does not change ownership. |
| CG-R2b-2 | pre_existing | Base outputBlocks.js line 462 already has `if (!text \|\| !ctx) return text \|\| ''` (round 4 reproduced the empty gauge on base). Gauge and interpolate date from a875b9b; the gallery's six charts do not use the gauge. |
| CG-R2b-5 | pre_existing | outputTemplates.js differs from base only by console.error lines; the gallery adds no route or capability (saves via the existing PUT). Route was never in the MCP invoker or parity map. |
| CG-R4-1 | pre_existing | resolveOwnerUserId default-admin fallthrough is identical on base; the career_rollups_read tool belongs to platform-mcp (47cddd6); the gallery UI already passes owner=me. Fix belongs with the platform-mcp tool schema. |
| chart-gallery-F4-1 | this_feature | Same item as CG-R2b-3 (round 4: could not reproduce on base; the 316px preview column and the 390px chart-fit requirement are the feature's own). Output.jsx and careerCharts.js changed in the feature range. Fixer note: root cause is unconfirmed, so measure which element has scrollWidth > clientWidth in the live preview before changing code. |
| chart-gallery-F4-3 | pre_existing | Same defect as CG-R3-2 (mobile nav JSX never written; not part of the gallery request). |
| chart-gallery-F4-4 | pre_existing | Same defect as CG-R2b-2 (falsy check in interpolate exists on base). |
| chart-gallery-F4-5 | pre_existing | Interface parity gap for output templates and career rollups; same as CG-R2b-5 and CG-R4-1. Registry and parity map belong to platform-mcp, and the gallery added no route. |
| chart-gallery-F4-6 | pre_existing | Reuses decision chart-gallery-B8: careerAtomMigration.js and careerAtomRegistry.js have no diff against base; boolean bound to $3::jsonb is base code. |
| chart-gallery-F4-7 | this_feature | Step [E.5] of docs/training/chart-gallery.md is the feature's own spec and names only ERR_CERT_AUTHORITY_INVALID (same as CG-R4-4). Change only via an approved amendment in docs/spec-amendments/chart-gallery/ (reviewer other than proposer), never by editing the frozen baseline. |
