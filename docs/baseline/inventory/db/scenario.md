# Database — `scenario` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## scenario_definition_versions

Element `TE-DB-scenario_definition_versions` · declared at `server/db.js:181` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('scenario_definition_versions_id_seq'::regclass)` |
| 2 | `scenario_id` | text | NOT NULL |  |
| 3 | `version` | integer | NOT NULL |  |
| 4 | `definition_hash` | text | NOT NULL |  |
| 5 | `signature_id` | text | NOT NULL |  |
| 6 | `definition` | jsonb | NOT NULL |  |
| 7 | `import_id` | bigint | yes |  |
| 8 | `review_status` | text | NOT NULL | `'pending_review'::text` |
| 9 | `active` | boolean | NOT NULL | `false` |
| 10 | `effective_from` | bigint | yes |  |
| 11 | `effective_to` | bigint | yes |  |
| 12 | `created_at` | bigint | NOT NULL |  |
| 13 | `reviewed_by` | bigint | yes |  |
| 14 | `reviewed_at` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| scenario_definition_versions_import_id_fkey | foreign key | `FOREIGN KEY (import_id) REFERENCES scenario_imports(id) ON DELETE RESTRICT` |
| scenario_definition_versions_pkey | primary key | `PRIMARY KEY (id)` |
| scenario_definition_versions_scenario_id_definition_hash_key | unique | `UNIQUE (scenario_id, definition_hash)` |
| scenario_definition_versions_scenario_id_version_key | unique | `UNIQUE (scenario_id, version)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_scenario_one_active_version | `UNIQUE btree (scenario_id) WHERE (active = true)` |
| idx_scenario_signature | `btree (signature_id) WHERE (active = true)` |
| scenario_definition_versions_pkey | `UNIQUE btree (id)` |
| scenario_definition_versions_scenario_id_definition_hash_key | `UNIQUE btree (scenario_id, definition_hash)` |
| scenario_definition_versions_scenario_id_version_key | `UNIQUE btree (scenario_id, version)` |

## scenario_imports

Element `TE-DB-scenario_imports` · declared at `server/db.js:169` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('scenario_imports_id_seq'::regclass)` |
| 2 | `workbook_hash` | text | NOT NULL |  |
| 3 | `workbook_version` | text | NOT NULL |  |
| 4 | `scenario_count` | integer | NOT NULL |  |
| 5 | `validation` | jsonb | NOT NULL | `'{}'::jsonb` |
| 6 | `status` | text | NOT NULL | `'pending_review'::text` |
| 7 | `imported_by` | bigint | yes |  |
| 8 | `imported_at` | bigint | NOT NULL |  |
| 9 | `reviewed_by` | bigint | yes |  |
| 10 | `reviewed_at` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| scenario_imports_pkey | primary key | `PRIMARY KEY (id)` |
| scenario_imports_workbook_hash_key | unique | `UNIQUE (workbook_hash)` |

**Indexes**

| Name | Definition |
|---|---|
| scenario_imports_pkey | `UNIQUE btree (id)` |
| scenario_imports_workbook_hash_key | `UNIQUE btree (workbook_hash)` |

## scenario_observations

Element `TE-DB-scenario_observations` · declared at `server/db.js:201` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `observation_id` | text | NOT NULL |  |
| 2 | `signature_id` | text | NOT NULL |  |
| 3 | `atom_assignments` | jsonb | NOT NULL |  |
| 4 | `nearest_scenarios` | jsonb | NOT NULL | `'[]'::jsonb` |
| 5 | `source_event_id` | text | yes |  |
| 6 | `customer_id` | text | yes |  |
| 7 | `contract_id` | text | yes |  |
| 8 | `evidence` | jsonb | NOT NULL | `'[]'::jsonb` |
| 9 | `review_status` | text | NOT NULL | `'pending_review'::text` |
| 10 | `resolution_scenario_id` | text | yes |  |
| 11 | `reviewer_id` | bigint | yes |  |
| 12 | `review_note` | text | yes |  |
| 13 | `created_at` | bigint | NOT NULL |  |
| 14 | `reviewed_at` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| scenario_observations_pkey | primary key | `PRIMARY KEY (observation_id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_scenario_observation_review | `btree (review_status, created_at DESC)` |
| scenario_observations_pkey | `UNIQUE btree (observation_id)` |
