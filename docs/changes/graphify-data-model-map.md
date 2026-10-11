# Change spec — Graphify data model map: knowledge-graph visuals of the platform's data model and code, inside World Shell

Feature key: `graphify-data-model-map` · Release: `2026-10-10-production-hardening-resume` (0.3.0, planned) · Version 1 (built) · 2026-10-11
Training spec: `docs/training/graphify-data-model-map.md` (version 1, written by the build agent; frozen as baseline v1 by the integrator)

## Owner direction

Use Graphify (pip package `graphifyy` 0.9.84) to draw the platform's data model and code as a knowledge graph, inside the World Shell, as a view in the crystal family (`src/lib/crystalGeometry.js`). Tables grouped by domain, with search and click-through to a table's columns, relations and which routes and modules use it. Local only: Graphify runs in a local virtual environment against a fresh local database, never production or member data, and never its LLM/semantic pass or any external API.

## Traces to

| Earlier spec / code | How this builds on it |
| --- | --- |
| `docs/changes/render-bindings.md` (v2) and `RenderBindingsPanel.jsx` | Same island pattern (World Shell Journeys card, admin only, `PLATFORM_ISLAND_TABS`, no nav row) and the same "data map" vocabulary. This feature maps the platform's own schema; render bindings map renderings to sources. |
| `docs/changes/platform-mcp.md` (v1) | MCP tools are appended to `server/lib/mcpToolRegistry.js` (append-only), call the same functions as the routes, and carry a `capabilityParity.js` row. Scopes `datamodel.read` / `datamodel.write` are derived from the tool descriptors. |
| `src/lib/crystalGeometry.js` (`CRYSTAL_VARIANTS.signature`, `addCrystalLights`, `buildGemMesh`) | The 3D view reuses the shared crystal family: a signature core and one gem per table. No local variant forked. |
| `docs/changes/release-scope.md`, `active-release.features.json` (commit `de9b2f5`) | The feature joined 0.3.0 as planned scope at the owner's request. |
| `journey-flow-experience-mapping` (same release, being built in parallel) | `dataObjectPicker()` in `server/lib/dataModelMap.js` is the exported data-object / field picker source it consumes. |
| Partial build, branch `release-loop/graphify-data-model-map-build` commit `000d26c` | Salvaged and merged (commit `e63df36`): scripts, outputs, library, routes, panel and training draft were reviewed, run and kept. This version adds the change spec, fixes two spec defects found while walking it (test administrator address; polygon count command) and regenerates the outputs. |

## What changed

### Data model (additive only)
No table, no column. The catalog is a committed file. The only stored state is one `config_state` row, `data_model_map_rules` (TEXT column, written with `setJSON`, created on first save, removed by "Restore default grouping"), holding the domain grouping. Bootstrap and seed never touch it. The shipped default is `server/data/dataModelDomains.json`.

### Generation (local only)
- `scripts/graphify-data-model.mjs` regenerates `docs/data-model/` (`catalog.json`, `graph.json`, `REPORT.md`, `view.html`). Steps: refuse any non-local database host; check Graphify is importable in `.graphify-venv` (or `$GRAPHIFY_PYTHON`) and otherwise stop with a plain message that gives the install commands (exit 2); create a fresh `sb_graphify_<pid>` database; boot it with `scripts/graphify-boot-schema.mjs` (importing `server/db.js` runs bootstrap, then the platform seed and each lazily-created schema module); run `scripts/graphify_data_model.py`; write the stamped outputs; drop the database (also on failure). Every `*_API_KEY` is removed from the child environment.
- `scripts/graphify_data_model.py` uses Graphify code mode (tree-sitter AST over `server/` and `src/`), Graphify's `introspect_postgres`, a read-only `information_schema` / `pg_constraint` query for column detail, and a deterministic SQL-text scan of `server/` that says which files use which table; routes are resolved from the mounts in `server/index.js` (directly, or one import hop away). It cross-checks Graphify's reference edges against the catalog's foreign keys (`crossCheck.agree`).
- Each output carries the Graphify version, `llmPass: false`, `externalApis: false`, the commit it was generated from and a generation time.
- Outputs are 1.1 MB in total (`catalog.json` 684 KB, `graph.json` 252 KB, `view.html` 168 KB, `REPORT.md` 8 KB). The raw symbol-level graph (`graphify-out/`) and the venv are git-ignored.
- Known pre-existing issue from `CLAUDE.md` (`organization_profiles` foreign key ordering): not reproduced on this head. `db.js` now creates `organization_profiles` before its first reference (comment at about line 284), and the fresh-database boot succeeded without any workaround, so the script contains none. The note in `CLAUDE.md` is stale for this reason.

### Server
- `server/lib/dataModelMap.js`: `loadCatalog`, `catalogSummary`, `tableDetail`, `searchCatalog`, `dataObjectPicker`, `getRules` / `saveRules` / `resetRules` / `validateRules`, `assignDomain`. Reading the catalog needs no database and no Graphify.
- `server/routes/dataModelMap.js` mounted at `/api/data-model` (all `requireAdmin`): `GET /catalog`, `/search`, `/picker`, `/tables/:name`, `/rules`; `PUT` and `DELETE /rules`.
- MCP tools `data_model_catalog_read`, `data_model_table_read`, `data_model_search`, `data_model_picker`, `data_model_rules_read`, `data_model_rules_save` (administrators; call the same functions). Three rows in `capabilityParity.js`; manifest updated.
- Picker for flow builders: `dataObjectPicker({ domain, q, object })` returns data objects (key = table) or an object's fields (key = `table.column`), schema names only.

### Client
- `src/components/admin/DataModelMapPanel.jsx`: World Shell island **Data model map** (Journeys card, administrators). Crystal view (three.js, signature core, one gem per table, domains on a ring with labels, selected gem enlarged with its foreign-key links drawn), mirrored by a plain list (domain buttons, search, table list, table detail with **Use as a data object** / **Use field**), and a Settings tab to edit the grouping. Works without WebGL (the list does everything the 3D view does). Phone: one column, tap targets at least 44px, no sideways scroll.
- `worldIslands.js` (`dataModelMap`, admin only), `WorldShell.jsx` (lazy embed + card subtitle), `api.js` (`dm*`).

## Behaviour changes to know
- Errors are written for the person (for example "Domain 1 has no name. Give it a name and save again.") and shown as a red alert and toast; a missing catalog reads as a 404 that says how to generate it.
- Changing the grouping only regroups the map. It never regenerates the catalog.
- "Tables no server file reads or writes by name" in `REPORT.md` is a lead, not proof: dynamic SQL is invisible to the text scan.
- No finalize, approve or publish path exists in this feature, so no `assertReadyToFinalize` or `useToolCategoryGate` call is needed.

## Verified (initial check)
2026-10-11, commit `e63df36` plus this change, fresh database `sb_rl_bld_16800_1`, production build on port 16802, Chromium (desktop 1280px and phone 390px):
- `npm run build` passes; server boots on a fresh database; `node scripts/check-interface-parity.mjs` OK (one pre-existing gap, `release-tracker-admin`, owned by `live-release-tracker`).
- Every journey walked once: J1 to J5 and J8 in Chromium (43 checks, all pass), J6 (tokens created in the browser, MCP and curl commands, Capabilities cards read Website, API and MCP ready) and J7 (clean venv from the cached wheel, regeneration, database dropped), edge cases E.1 to E.6.
- Regeneration reproduces the committed counts: 229 tables, 2653 columns, 313 foreign keys, 584 code files, cross-check agrees (294 table pairs).

## Known limitations
- Only the table-level domain, relation and route map is in the app. The symbol-level code graph is regenerated locally into `graphify-out/` and not shown.
- The SQL-text scan does not see table names built at run time.
- The committed stamp names the commit the files were generated from, which is the parent of the commit that contains them.

## Fix notes per round (appended by fix agents)
None yet.
