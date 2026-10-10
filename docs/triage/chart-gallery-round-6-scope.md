# chart-gallery round 6 scope review

Base: a5e7883 (first parent of the earliest chart-gallery merge 8430eae). Method: code-history comparison against the base tree (git grep / git show). No base build was run, so "reproduces" below means the defective code is present unchanged on the base.

| id | scope | owner |
|---|---|---|
| chart-gallery-T6-1 | pre_existing | - |
| chart-gallery-T6-2 | pre_existing | - |
| chart-gallery-T6-3 | other_feature | career-bound-outputs |

## T6-1 pre_existing
At a5e7883 brand.css already hides `.sb-admin-topbar-actions` at max-width 900px (lines 615-622, 738) and AdminShell.jsx line 653 renders the group selector only inside it. No JSX uses a mobile menu/drawer class. Admin navigation at 390px is not part of the gallery request.

## T6-2 pre_existing
At a5e7883 outputBlocks.js has the same `interpolate()` guard (`if (!text || !ctx) return text || ''`, line 462) and the same `capacity-gauge` case calling `ip(rollup.value)`. The renderer bug exists without the gallery.

## T6-3 other_feature (career-bound-outputs)
`career_rollups_read` is absent at a5e7883 (mcpRouteTools.js did not exist). It was added by 49d0e2d "Fix round 4 ... MCP tools for career-bound and reconciliation" (docs/changes/career-bound-outputs.md), registered with no `owner` query option. The default-admin fallback in careerMaster.js `resolveOwnerUserId` predates the gallery (4f35fd4). The gallery only reads `?owner=me`. The fix belongs in the tool registration (add an optional owner query).
