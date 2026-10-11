# Scope review: graphify-data-model-map, round 1

Integration head checked: cdf9504. Every item is decided by reading the code, the change spec and the request. None needed a base-commit reproduction. Each one is either caused by this feature's own files, or is a request item this feature did not meet, so none can be pre_existing.

| id | scope | reason |
|---|---|---|
| graphify-data-model-map-r1-1 | this_feature | The product behaviour is right. `WorldBreadcrumbs.jsx` line 67 (`collapsed = narrow && crumbs.length > 2`) is the shared, documented World Shell phone behaviour. The wrong text is this feature's own spec step, which omits the collapse. The fix is an amendment to `docs/training/graphify-data-model-map.md` and no code change. `world-shell-navigation` is not at fault. |
| graphify-data-model-map-B6 | this_feature | `server/routes/dataModelMap.js` uses `requireAdmin` (lines 5 and 9). The island, MCP tool and parity row were copied from the admin-only render-bindings pattern. CLAUDE.md "Universal functionality, provisioned" requires access by permission or license. The fix is this feature's own files. |
| graphify-data-model-map-B7 | this_feature | `getRules()` in `server/lib/dataModelMap.js` imports `db.js` unconditionally (line 38). The request and change spec say the catalog and the picker must work without a database. |
| graphify-data-model-map-B8 | this_feature | The request asked for baseline v1 to be frozen. `docs/training/baselines/graphify-data-model-map/v1.json` now exists at the integration head (commit 93576a6), so this is already resolved. The freeze is the integrator's step, and the finding was an ordering artifact of the round. |
| graphify-data-model-map-B9 | this_feature | The request asked for code mode over `server/` and `src/`. The in-app view is table-level only (change spec line 56: "symbol-level code graph ... not shown"). That is a request item the feature does not fully deliver. |
| graphify-data-model-map-B10 | this_feature | `CLAUDE.md` has no section for the Data model map, and this feature's change spec should add one. The request itself only says to note the pre-existing `organization_profiles` FK-ordering bug, and CLAUDE.md already records that. The missing note is this feature's own documentation gap. |

No other_feature or process_note items. `docs/triage/scope-review.json` has no entries for these ids.
