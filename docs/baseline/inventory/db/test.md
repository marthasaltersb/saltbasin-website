# Database — `test` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## test_run_step_results

Element `TE-DB-test_run_step_results` · declared at `server/db.js:2274` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('test_run_step_results_id_seq'::regclass)` |
| 2 | `run_id` | bigint | NOT NULL |  |
| 3 | `step_id` | bigint | NOT NULL |  |
| 4 | `result` | text | NOT NULL |  |
| 5 | `notes` | text | yes |  |
| 6 | `evidence_url` | text | yes |  |
| 7 | `defect_backlog_item_id` | bigint | yes |  |
| 8 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| test_run_step_results_defect_backlog_item_id_fkey | foreign key | `FOREIGN KEY (defect_backlog_item_id) REFERENCES backlog_items(id) ON DELETE SET NULL` |
| test_run_step_results_pkey | primary key | `PRIMARY KEY (id)` |
| test_run_step_results_result_check | check | `CHECK ((result = ANY (ARRAY['pass'::text, 'fail'::text, 'blocked'::text])))` |
| test_run_step_results_run_id_fkey | foreign key | `FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE` |
| test_run_step_results_step_id_fkey | foreign key | `FOREIGN KEY (step_id) REFERENCES test_scenario_steps(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_test_run_step_results_def | `btree (defect_backlog_item_id) WHERE (defect_backlog_item_id IS NOT NULL)` |
| idx_test_run_step_results_run | `btree (run_id)` |
| test_run_step_results_pkey | `UNIQUE btree (id)` |

## test_runs

Element `TE-DB-test_runs` · declared at `server/db.js:2264` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('test_runs_id_seq'::regclass)` |
| 2 | `scenario_id` | bigint | NOT NULL |  |
| 3 | `tester_user_id` | bigint | yes |  |
| 4 | `environment` | text | NOT NULL |  |
| 5 | `overall_result` | text | NOT NULL |  |
| 6 | `notes` | text | yes |  |
| 7 | `run_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| test_runs_environment_check | check | `CHECK ((environment = ANY (ARRAY['test'::text, 'prod'::text])))` |
| test_runs_overall_result_check | check | `CHECK ((overall_result = ANY (ARRAY['pass'::text, 'fail'::text, 'blocked'::text])))` |
| test_runs_pkey | primary key | `PRIMARY KEY (id)` |
| test_runs_scenario_id_fkey | foreign key | `FOREIGN KEY (scenario_id) REFERENCES test_scenarios(id) ON DELETE CASCADE` |
| test_runs_tester_user_id_fkey | foreign key | `FOREIGN KEY (tester_user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| idx_test_runs_scenario | `btree (scenario_id, run_at DESC)` |
| idx_test_runs_tester | `btree (tester_user_id)` |
| test_runs_pkey | `UNIQUE btree (id)` |

## test_scenario_features

Element `TE-DB-test_scenario_features` · declared at `server/db.js:2401` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `scenario_id` | bigint | NOT NULL |  |
| 2 | `backlog_item_id` | bigint | NOT NULL |  |
| 3 | `is_primary` | boolean | NOT NULL | `false` |
| 4 | `sort_order` | integer | NOT NULL | `0` |
| 5 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| test_scenario_features_backlog_item_id_fkey | foreign key | `FOREIGN KEY (backlog_item_id) REFERENCES backlog_items(id) ON DELETE CASCADE` |
| test_scenario_features_pkey | primary key | `PRIMARY KEY (scenario_id, backlog_item_id)` |
| test_scenario_features_scenario_id_fkey | foreign key | `FOREIGN KEY (scenario_id) REFERENCES test_scenarios(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_tsf_feature | `btree (backlog_item_id)` |
| idx_tsf_one_primary | `UNIQUE btree (scenario_id) WHERE is_primary` |
| idx_tsf_scenario | `btree (scenario_id, sort_order)` |
| test_scenario_features_pkey | `UNIQUE btree (scenario_id, backlog_item_id)` |

## test_scenario_steps

Element `TE-DB-test_scenario_steps` · declared at `server/db.js:2255` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('test_scenario_steps_id_seq'::regclass)` |
| 2 | `scenario_id` | bigint | NOT NULL |  |
| 3 | `step_order` | integer | NOT NULL |  |
| 4 | `action` | text | NOT NULL |  |
| 5 | `expected_outcome` | text | NOT NULL |  |
| 6 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| test_scenario_steps_pkey | primary key | `PRIMARY KEY (id)` |
| test_scenario_steps_scenario_id_fkey | foreign key | `FOREIGN KEY (scenario_id) REFERENCES test_scenarios(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_test_scenario_steps_sc | `btree (scenario_id, step_order)` |
| test_scenario_steps_pkey | `UNIQUE btree (id)` |

## test_scenarios

Element `TE-DB-test_scenarios` · declared at `server/db.js:2241` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('test_scenarios_id_seq'::regclass)` |
| 2 | `backlog_item_id` | bigint | yes |  |
| 3 | `capability_id` | bigint | yes |  |
| 4 | `title` | text | NOT NULL |  |
| 5 | `summary` | text | yes |  |
| 6 | `preconditions` | text | yes |  |
| 7 | `environment_scope` | text | NOT NULL | `'both'::text` |
| 8 | `priority` | text | yes |  |
| 9 | `sort_order` | integer | NOT NULL | `0` |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| test_scenarios_backlog_item_id_fkey | foreign key | `FOREIGN KEY (backlog_item_id) REFERENCES backlog_items(id) ON DELETE CASCADE` |
| test_scenarios_capability_id_fkey | foreign key | `FOREIGN KEY (capability_id) REFERENCES capability_groups(id) ON DELETE SET NULL` |
| test_scenarios_environment_scope_check | check | `CHECK ((environment_scope = ANY (ARRAY['test'::text, 'prod'::text, 'both'::text])))` |
| test_scenarios_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_test_scenarios_backlog | `btree (backlog_item_id)` |
| idx_test_scenarios_capability | `btree (capability_id)` |
| test_scenarios_pkey | `UNIQUE btree (id)` |
