# Reconciliation: graphify-data-model-map (build), branch release-loop/graphify-data-model-map-build-r2 @ 19a1c97

1. Merge conflict (mcpToolManifest.json, capabilityParity.js): resolved. Manifest parses; `check-interface-parity.mjs` reports OK (205 tools = manifest; one pre-existing gap release-tracker-admin owned by live-release-tracker). Diff vs merge-base is additive only.
2. Branch-name refusal: resolved/informational. Old branch still at 000d26c (verified); work is on -r2 at 19a1c97. Integrator must merge -r2.
3. Sandbox-refused compound commands: process/informational, nothing partial.
4. Spec defects (admin@test.local, grep -o): resolved. env.sh ADMIN_EMAIL=admin@test.local; `grep -o "<polygon" view.html | wc -l` = 229 = catalog counts.tables.
5. J7.2 relative --out path: informational, cosmetic.

Additional findings:
- OWNER DIRECTION CONFLICT (unresolved): access is hard-coded to the admin role (`adminOnly: true` in worldIslands.js, `router.use(requireAdmin)` in server/routes/dataModelMap.js, "administrators only" MCP tools, spec J6.11/J6.12 assert member 403). CLAUDE.md "Universal functionality, provisioned": express access as a permission/license grantable to any profile, never the admin role. Fix: gate on a permission (e.g. datamodel.read / datamodel.write) that admins hold by default; update routes, island, MCP registry, parity rows, and file a spec amendment for J6.11/J6.12.
- Product defect (unresolved, minor): dataObjectPicker() (the exported picker for journey-flow-experience-mapping) calls getRules() which imports server/db.js; without DATABASE_URL it throws (reproduced). Change spec says reading the catalog needs no DB. Fix: fall back to defaultRules() when no DB or on error.
- Process (unresolved): baseline v1 not yet frozen (docs/training/baselines/graphify-data-model-map missing); the integrator must run release-spec-baseline.mjs. Branch is also behind integration head (merge-base 1032699 vs 98efaa3).
- Stale CLAUDE.md note (informational, unresolved): change spec says the organization_profiles FK-ordering bug no longer reproduces (db.js ~284 creates it first; verified lines 284-293 before first FK at 657); CLAUDE.md still describes it as open.
- Known limitations from change spec: symbol-level code graph not shown in the app (requirement_gap vs "knowledge-graph visuals of the platform's data model and code", unresolved; table-level map only); SQL text scan misses dynamic table names (informational); stamp names parent commit (informational).
- Not re-run by me: browser journeys and the venv regeneration (J7); reported results taken from the build agent except the checks above.
