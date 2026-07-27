# Handover: Salt Basin 2,400-Scenario Canonical Registry

## Objective

Continue integrating `Salt_Basin_2400_Scenario_Repository.xlsx` as a governed scenario vocabulary:

```text
Workbook -> deterministic importer -> validation -> normalized registry
         -> signatures/mappings -> runtime and fixture consumers
```

The workbook is an authoring/import artifact, not a live UI data source or a set of rows to scatter into application tables. `SB-SCN-0001` through `SB-SCN-2400` are permanent identities. Scenario behavior must remain configuration, never scenario-specific conditionals in React/routes/metric code.

The full user specification is in the originating Codex task attachment (`pasted-text.txt`). The core requirements include architecture assessment, idempotent normalized import, version/hash detection, governed dimensions/atoms/molecules/rods/events, signatures, explainable similarity, novel-combination observations, entity/transaction expectations, controls, metric dependencies, propagation, temporal/security policy, fixture contracts, tests, and documentation.

## Source artifact

The user supplied:

`C:\Users\mbets\Downloads\Salt_Basin_2400_Scenario_Repository.xlsx`

It has been copied to:

`data/scenarios/Salt_Basin_2400_Scenario_Repository.xlsx`

Workbook SHA-256 has not yet been recorded in a completed generated manifest; the importer is intended to calculate it.

## Workbook inspection completed

The workbook contains nine sheets:

1. `README`
2. `Scenario Repository` — 2,400 data rows, 38 columns (`A1:AL2401`)
3. `Dimension Dictionary`
4. `Source Event Map`
5. `Atom-Molecule Map`
6. `Metric Registry 150`
7. `Reconciliation Map`
8. `Coverage Dashboard`
9. `Implementation Guide`

The scenario columns match the requested contract, including Scenario ID/family/tier, 16 governed dimensions, source event, L1/L2/L3 journey, rods/channels, atoms, molecules, generated outputs, controls, metrics, propagation, temporal requirements, agent policy, expected state/variance, fixture key, and implementation status.

## Existing architecture assessment

Do not create replacements for these existing concepts:

- `journey_data_rods`, `journey_rod_events`, evidence, decisions, threshold profiles: reuse for rods/channels, event history, and branch lineage.
- `src/lib/journeyEngine/*`: reuse atom geometry, lineage, bonding, maturity, and path-color mechanics.
- `server/lib/molecule.js`: reuse molecule/bond visibility and reader-specific exposure behavior.
- `src/config/metrics/metricDefinitionRegistry.js` plus metric DB tables/services: map workbook dependencies to governed metric identifiers; never import metric values.
- Audit and field-lineage tables/services: reuse for provenance and temporal history.
- Existing QA scenarios are a separate test-management concept; do not overload them as the canonical business-pattern registry.

No database migration was added in the partial work. That was deliberate for the first safe slice: generated configuration and runtime services first, reviewed version-history/observation persistence later.

## Partial files created (not yet verified)

- `scripts/import-salt-basin-scenarios.py`
  - Standard-library XLSX reader (`zipfile` + XML), avoiding a production Excel dependency.
  - Normalizes scenarios/dimensions/atoms/mappings.
  - Calculates workbook, definition, and signature hashes.
  - Writes JSON under `generated/scenarios/`.
  - Validates counts, unique IDs, and atom/metric/control/event references.
- `src/scenarios/scenarioSignature.js`
- `src/scenarios/scenarioRegistry.js`
- `src/scenarios/scenarioObservation.js`
- `src/scenarios/fixtureGenerator.js`
- `scripts/validate-scenario-registry.mjs`
- `scripts/generate-scenario-fixture.mjs`
- `tests/scenarios.test.js`
- `docs/SCENARIO_REGISTRY.md`
- `docs/SCENARIO_REGISTRY_ARCHITECTURE_ASSESSMENT.md`

These were written immediately before the handover request. They have **not** been run, debugged, or reviewed for syntax/logic errors. Treat them as a promising work-in-progress, not completed implementation.

Temporary inspection helpers also exist:

- `tmp/scenario-workbook-inspect.mjs`
- `tmp/inspect-scenario-workbook.py`
- `tmp/node_modules` may be a junction to the Codex bundled dependencies.

Remove temporary helpers only after confirming they are no longer needed and verifying resolved targets remain within `tmp`.

## Dirty-worktree warning

The repository already contained many modified and untracked user files before this work began. Preserve all unrelated changes. Do not reset, clean, discard, or broadly reformat the worktree. Restrict edits to scenario-registry files and carefully merge any required `package.json` changes.

## Immediate continuation sequence

1. Read `AGENTS.md` and the original specification.
2. Inspect every partial file listed above.
3. Run the importer with the bundled Python or a Python 3 runtime:

   ```powershell
   python scripts/import-salt-basin-scenarios.py
   ```

4. Fix all importer failures. Confirm generated files:

   - `generated/scenarios/scenario-registry.json`
   - `generated/scenarios/scenario-dimensions.json`
   - `generated/scenarios/scenario-mappings.json`
   - `generated/scenarios/scenario-validation.json`

5. Report exact scenario count, unique signature count, duplicate signatures, and unresolved mappings from validation output. Do not assume they are zero.
6. Add package scripts carefully without overwriting current user changes:

   ```json
   "scenarios:import": "python scripts/import-salt-basin-scenarios.py",
   "scenarios:validate": "node scripts/validate-scenario-registry.mjs",
   "scenarios:fixture": "node scripts/generate-scenario-fixture.mjs",
   "test:scenarios": "node --test tests/scenarios.test.js"
   ```

7. Run:

   ```powershell
   npm run scenarios:validate
   npm run test:scenarios
   npm run scenarios:fixture -- SB-SCN-0842
   npm run build
   ```

8. Add deterministic idempotence verification: run import twice with a fixed validation timestamp or exclude volatile timestamps from deterministic comparison, then compare generated hashes.
9. Add definition-change detection against a prior registry. Existing IDs with changed definition hashes must produce an explicit review/version result, not silent overwrite.
10. Expand validation for atom-to-molecule consistency, empty molecule memberships, conflicting assignments, dimension value resolution, and workbook-required sheets.
11. Decide whether the next safe slice includes a read-only authenticated scenario API. Do not build a UI unless useful after service contracts are stable.
12. Update the requested broader documentation (`CANONICAL_MODEL.md`, `BUILD_STATE.md`, `TRACEABILITY.md`, `COMPONENT_SERVICE_INVENTORY.md`) only where those files exist or can be added without conflicting with active user documentation work.

## Important design constraints

- Generated registry JSON is a build artifact and runtime configuration source.
- The registry resolves and explains; it does not generate financial records itself.
- Fixture generation must invoke production domain rules when those services exist. The current partial generator only creates an execution/expectation contract.
- Novel combinations create unresolved observations and do not receive automatic permanent Scenario IDs.
- Similarity must stay deterministic and explain matching/differing/missing/novel atoms.
- Security policy must be normalized; raw workbook policy text must not become the authorization evaluator.
- Scenario timestamps and generated business timestamps should eventually use existing Salt Basin temporal conventions; avoid a parallel timestamp architecture.

## Recommended next vertical slice after validation

Persist versioned scenario definitions and unresolved observations in reviewed Postgres tables, then connect one representative Expansion scenario end-to-end:

`scenario resolution -> source event -> domain generation rule -> expected transactions -> controls -> metric invalidation/recalculation -> retained lineage`

That proves the architecture without prematurely wiring all 2,400 patterns into incomplete transaction services.
