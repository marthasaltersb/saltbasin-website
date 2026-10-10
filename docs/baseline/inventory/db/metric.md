# Database — `metric` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## metric_calculations

Element `TE-DB-metric_calculations` · declared at `server/db.js:136` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('metric_calculations_id_seq'::regclass)` |
| 2 | `metric_id` | text | NOT NULL |  |
| 3 | `variant_key` | text | NOT NULL |  |
| 4 | `calculation_version` | text | NOT NULL |  |
| 5 | `as_of` | bigint | NOT NULL |  |
| 6 | `value` | numeric | yes |  |
| 7 | `unit` | text | NOT NULL |  |
| 8 | `confidence` | numeric | NOT NULL |  |
| 9 | `formula_json` | jsonb | NOT NULL |  |
| 10 | `inputs_json` | jsonb | NOT NULL |  |
| 11 | `methodology` | text | NOT NULL |  |
| 12 | `context_json` | jsonb | NOT NULL | `'{}'::jsonb` |
| 13 | `created_by` | bigint | yes |  |
| 14 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| metric_calculations_metric_id_fkey | foreign key | `FOREIGN KEY (metric_id) REFERENCES metric_definitions(metric_id)` |
| metric_calculations_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_metric_calculations_lookup | `btree (metric_id, variant_key, as_of DESC)` |
| metric_calculations_pkey | `UNIQUE btree (id)` |

## metric_definitions

Element `TE-DB-metric_definitions` · declared at `server/db.js:122` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `metric_id` | text | NOT NULL |  |
| 2 | `metric_key` | text | NOT NULL |  |
| 3 | `display_name` | text | NOT NULL |  |
| 4 | `metric_family` | text | NOT NULL |  |
| 5 | `metric_subfamily` | text | yes |  |
| 6 | `definition_json` | jsonb | NOT NULL |  |
| 7 | `calculation_version` | text | NOT NULL |  |
| 8 | `effective_from` | bigint | NOT NULL |  |
| 9 | `effective_to` | bigint | yes |  |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| metric_definitions_metric_key_key | unique | `UNIQUE (metric_key)` |
| metric_definitions_pkey | primary key | `PRIMARY KEY (metric_id)` |

**Indexes**

| Name | Definition |
|---|---|
| metric_definitions_metric_key_key | `UNIQUE btree (metric_key)` |
| metric_definitions_pkey | `UNIQUE btree (metric_id)` |

## metric_observations

Element `TE-DB-metric_observations` · declared at `server/db.js:155` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('metric_observations_id_seq'::regclass)` |
| 2 | `calculation_id` | bigint | NOT NULL |  |
| 3 | `entity_type` | text | NOT NULL | `'portfolio_company'::text` |
| 4 | `entity_id` | text | NOT NULL |  |
| 5 | `period_start` | bigint | yes |  |
| 6 | `period_end` | bigint | NOT NULL |  |
| 7 | `observed_value` | numeric | yes |  |
| 8 | `status` | text | NOT NULL | `'calculated'::text` |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| metric_observations_calculation_id_fkey | foreign key | `FOREIGN KEY (calculation_id) REFERENCES metric_calculations(id) ON DELETE CASCADE` |
| metric_observations_calculation_id_key | unique | `UNIQUE (calculation_id)` |
| metric_observations_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_metric_observations_entity | `btree (entity_type, entity_id, period_end DESC)` |
| metric_observations_calculation_id_key | `UNIQUE btree (calculation_id)` |
| metric_observations_pkey | `UNIQUE btree (id)` |
