# Salt Basin Canonical Scenario Registry

The workbook at `data/scenarios/Salt_Basin_2400_Scenario_Repository.xlsx` is the governed authoring artifact. Production consumers read deterministic JSON from `generated/scenarios/`; they do not query Excel.

`Scenario_ID` is permanent identity. Imports retain the workbook hash and a definition hash for every normalized scenario. A changed definition hash for an existing ID must be reviewed and versioned before replacement; the current importer emits version 1 and never writes application database rows.

## Existing architecture mapping

| Existing Salt Basin component | Workbook concept | Decision | Migration impact |
|---|---|---|---|
| `journey_data_rods`, rod events, evidence, decisions | Rod/channel, branch, event lineage | Reuse through references | None in this slice |
| Journey atom geometry, lineage, path color | Atom assignment and permanent color | Reuse; import governed paths/color keys | None |
| Molecule library and visibility renderer | Molecule rollup and exposure | Reuse; scenario stores memberships/policy config | None |
| Metric definition registry/database | Metric dependencies | Map workbook names to governed `MET-*` IDs | No metric values imported |
| Audit/field lineage and BIGINT timestamps | Temporal and source lineage | Reuse at runtime | No parallel timestamp model |
| QA scenarios | Executable verification | Keep separate; scenario fixtures are domain contracts | No table collision |

## Commands

```powershell
python scripts/import-salt-basin-scenarios.py
npm run scenarios:validate
npm run scenarios:fixture -- SB-SCN-0842
npm run test:scenarios
```

Signatures lowercase and sort atom paths, preserve governed values, join them with `|`, and hash the canonical text with SHA-256 under the `SBSIG-` prefix. Similarity is a weighted intersection over the union of atom paths and returns matching, differing, missing, and novel atoms. Novel combinations create pending observations and never receive an automatic permanent scenario ID.

The fixture generator produces an event-rooted execution contract. Domain generation services remain responsible for records and transactions. Reconciliation controls, metric IDs, and propagation targets are expectations and dependency references, not copied business logic.

## Runtime API and persistence

Authenticated users can read the governed registry through `/api/scenarios/summary`, `/api/scenarios/:scenarioId`, `/api/scenarios/:scenarioId/dependencies`, and `POST /api/scenarios/resolve/atoms`. The resolve endpoint is read-only despite using POST for a structured atom query. It returns exact signature matches or deterministic, explained nearest candidates.

`scenario_imports` records workbook-level provenance and review state. `scenario_definition_versions` stores immutable versioned definitions with at most one active version per permanent ID. `scenario_observations` stores unresolved novel combinations for human review. Bootstrapping creates the tables but deliberately does not copy generated JSON into them or activate versions; that requires an explicit reviewed import workflow.

## Known gaps

- The persistence schema exists, but the reviewed import/activation command and observation write path remain to be implemented.
- Domain transaction generators are not yet complete enough to execute all 2,400 fixture contracts end to end.
- Security policy is normalized configuration; enforcement continues through existing agent/data-policy services.
- The Orbit UI can consume this registry later through an adapter; it must not own another scenario model.
