# Database — `agent` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## agent_approval_workflows

Element `TE-DB-agent_approval_workflows` · declared at `server/db.js:5162` · RLS not enabled · rows after empty-DB bootstrap: 2

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_approval_workflows_id_seq'::regclass)` |
| 2 | `org_id` | bigint | yes |  |
| 3 | `pipeline` | text | NOT NULL | `'shared'::text` |
| 4 | `step_key` | text | NOT NULL |  |
| 5 | `name` | text | NOT NULL |  |
| 6 | `sort_order` | integer | NOT NULL | `0` |
| 7 | `required_role_label` | text | yes |  |
| 8 | `note` | text | yes |  |
| 9 | `is_active` | boolean | NOT NULL | `true` |
| 10 | `created_at` | bigint | NOT NULL |  |
| 11 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_approval_workflows_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| agent_approval_workflows_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| agent_approval_workflows_pkey | `UNIQUE btree (id)` |
| idx_agent_workflow_step_global | `UNIQUE btree (pipeline, step_key) WHERE (org_id IS NULL)` |
| idx_agent_workflow_step_org | `UNIQUE btree (pipeline, step_key, org_id) WHERE (org_id IS NOT NULL)` |

## agent_code_run_events

Element `TE-DB-agent_code_run_events` · declared at `server/db.js:1938` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_code_run_events_id_seq'::regclass)` |
| 2 | `run_id` | bigint | NOT NULL |  |
| 3 | `event_type` | text | NOT NULL |  |
| 4 | `stream` | text | yes |  |
| 5 | `message` | text | yes |  |
| 6 | `payload` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_code_run_events_pkey | primary key | `PRIMARY KEY (id)` |
| agent_code_run_events_run_id_fkey | foreign key | `FOREIGN KEY (run_id) REFERENCES agent_code_runs(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| agent_code_run_events_pkey | `UNIQUE btree (id)` |
| idx_agent_code_run_events | `btree (run_id, id)` |

## agent_code_runs

Element `TE-DB-agent_code_runs` · declared at `server/db.js:1912` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_code_runs_id_seq'::regclass)` |
| 2 | `thread_id` | bigint | NOT NULL |  |
| 3 | `backlog_item_id` | bigint | yes |  |
| 4 | `provider` | text | NOT NULL |  |
| 5 | `model` | text | yes |  |
| 6 | `objective` | text | NOT NULL |  |
| 7 | `acceptance_criteria` | text | yes |  |
| 8 | `status` | text | NOT NULL | `'proposed'::text` |
| 9 | `approval_status` | text | NOT NULL | `'pending'::text` |
| 10 | `approved_by` | bigint | yes |  |
| 11 | `approved_at` | bigint | yes |  |
| 12 | `started_at` | bigint | yes |  |
| 13 | `finished_at` | bigint | yes |  |
| 14 | `exit_code` | integer | yes |  |
| 15 | `summary` | text | yes |  |
| 16 | `changed_files` | jsonb | NOT NULL | `'[]'::jsonb` |
| 17 | `preexisting_files` | jsonb | NOT NULL | `'[]'::jsonb` |
| 18 | `verification` | jsonb | NOT NULL | `'[]'::jsonb` |
| 19 | `error` | text | yes |  |
| 20 | `created_by` | bigint | yes |  |
| 21 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 22 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_code_runs_approved_by_fkey | foreign key | `FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL` |
| agent_code_runs_backlog_item_id_fkey | foreign key | `FOREIGN KEY (backlog_item_id) REFERENCES backlog_items(id) ON DELETE SET NULL` |
| agent_code_runs_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| agent_code_runs_pkey | primary key | `PRIMARY KEY (id)` |
| agent_code_runs_thread_id_fkey | foreign key | `FOREIGN KEY (thread_id) REFERENCES agent_threads(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| agent_code_runs_pkey | `UNIQUE btree (id)` |
| idx_agent_code_runs_thread | `btree (thread_id, created_at DESC)` |

## agent_context_profiles

Element `TE-DB-agent_context_profiles` · declared at `server/db.js:1852` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_context_profiles_id_seq'::regclass)` |
| 2 | `profile_key` | text | NOT NULL |  |
| 3 | `label` | text | NOT NULL |  |
| 4 | `instructions` | text | NOT NULL |  |
| 5 | `source_config` | jsonb | NOT NULL | `'{}'::jsonb` |
| 6 | `is_default` | boolean | NOT NULL | `false` |
| 7 | `is_active` | boolean | NOT NULL | `true` |
| 8 | `created_by` | bigint | yes |  |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 10 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_context_profiles_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| agent_context_profiles_pkey | primary key | `PRIMARY KEY (id)` |
| agent_context_profiles_profile_key_key | unique | `UNIQUE (profile_key)` |

**Indexes**

| Name | Definition |
|---|---|
| agent_context_profiles_pkey | `UNIQUE btree (id)` |
| agent_context_profiles_profile_key_key | `UNIQUE btree (profile_key)` |

## agent_definitions

Element `TE-DB-agent_definitions` · declared at `server/db.js:5096` · RLS not enabled · rows after empty-DB bootstrap: 11

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_definitions_id_seq'::regclass)` |
| 2 | `org_id` | bigint | yes |  |
| 3 | `owner_user_id` | bigint | yes |  |
| 4 | `key` | text | NOT NULL |  |
| 5 | `name` | text | NOT NULL |  |
| 6 | `pipeline` | text | NOT NULL | `'shared'::text` |
| 7 | `role_description` | text | yes |  |
| 8 | `objective` | text | yes |  |
| 9 | `capabilities` | jsonb | NOT NULL | `'[]'::jsonb` |
| 10 | `boundaries` | jsonb | NOT NULL | `'[]'::jsonb` |
| 11 | `reports_to_agent_id` | bigint | yes |  |
| 12 | `tier` | integer | NOT NULL | `0` |
| 13 | `agent_boundary_ref` | jsonb | yes |  |
| 14 | `is_active` | boolean | NOT NULL | `true` |
| 15 | `created_at` | bigint | NOT NULL |  |
| 16 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_definitions_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| agent_definitions_owner_user_id_fkey | foreign key | `FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE` |
| agent_definitions_pkey | primary key | `PRIMARY KEY (id)` |
| agent_definitions_reports_to_agent_id_fkey | foreign key | `FOREIGN KEY (reports_to_agent_id) REFERENCES agent_definitions(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| agent_definitions_pkey | `UNIQUE btree (id)` |
| idx_agent_def_key_global | `UNIQUE btree (key) WHERE ((org_id IS NULL) AND (owner_user_id IS NULL))` |
| idx_agent_def_key_org | `UNIQUE btree (key, org_id) WHERE (org_id IS NOT NULL)` |
| idx_agent_def_key_user | `UNIQUE btree (key, owner_user_id) WHERE (owner_user_id IS NOT NULL)` |

## agent_hub_definitions

Element `TE-DB-agent_hub_definitions` · declared at `server/db.js:5669` · RLS not enabled · rows after empty-DB bootstrap: 13

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_hub_definitions_id_seq'::regclass)` |
| 2 | `key` | text | NOT NULL |  |
| 3 | `public_key` | text | yes |  |
| 4 | `label` | text | NOT NULL |  |
| 5 | `description` | text | yes |  |
| 6 | `kind` | text | NOT NULL | `'code_review'::text` |
| 7 | `execution_mode` | text | NOT NULL | `'scheduled'::text` |
| 8 | `scope_type` | text | NOT NULL | `'platform'::text` |
| 9 | `scope_id` | bigint | yes |  |
| 10 | `schedule_cron` | text | yes |  |
| 11 | `enabled` | boolean | NOT NULL | `false` |
| 12 | `auto_branch` | boolean | NOT NULL | `false` |
| 13 | `config` | jsonb | NOT NULL | `'{}'::jsonb` |
| 14 | `created_at` | bigint | NOT NULL |  |
| 15 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_hub_definitions_key_key | unique | `UNIQUE (key)` |
| agent_hub_definitions_pkey | primary key | `PRIMARY KEY (id)` |
| agent_hub_definitions_public_key_key | unique | `UNIQUE (public_key)` |

**Indexes**

| Name | Definition |
|---|---|
| agent_hub_definitions_key_key | `UNIQUE btree (key)` |
| agent_hub_definitions_pkey | `UNIQUE btree (id)` |
| agent_hub_definitions_public_key_key | `UNIQUE btree (public_key)` |
| idx_agent_hub_public_key | `UNIQUE btree (public_key) WHERE (public_key IS NOT NULL)` |
| idx_agent_hub_scope | `btree (scope_type, scope_id)` |

## agent_hub_run_findings

Element `TE-DB-agent_hub_run_findings` · declared at `server/db.js:5713` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_hub_run_findings_id_seq'::regclass)` |
| 2 | `run_id` | bigint | NOT NULL |  |
| 3 | `category` | text | NOT NULL |  |
| 4 | `severity` | text | NOT NULL | `'medium'::text` |
| 5 | `file_path` | text | yes |  |
| 6 | `line` | integer | yes |  |
| 7 | `title` | text | NOT NULL |  |
| 8 | `detail` | text | yes |  |
| 9 | `status` | text | NOT NULL | `'open'::text` |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_hub_run_findings_pkey | primary key | `PRIMARY KEY (id)` |
| agent_hub_run_findings_run_id_fkey | foreign key | `FOREIGN KEY (run_id) REFERENCES agent_hub_runs(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| agent_hub_run_findings_pkey | `UNIQUE btree (id)` |

## agent_hub_runs

Element `TE-DB-agent_hub_runs` · declared at `server/db.js:5707` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_hub_runs_id_seq'::regclass)` |
| 2 | `definition_id` | bigint | NOT NULL |  |
| 3 | `status` | text | NOT NULL | `'queued'::text` |
| 4 | `trigger` | text | NOT NULL | `'schedule'::text` |
| 5 | `started_at` | bigint | yes |  |
| 6 | `finished_at` | bigint | yes |  |
| 7 | `summary` | text | yes |  |
| 8 | `stats` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `branch_name` | text | yes |  |
| 10 | `pr_url` | text | yes |  |
| 11 | `report_path` | text | yes |  |
| 12 | `codebase_fingerprint` | text | yes |  |
| 13 | `error` | text | yes |  |
| 14 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_hub_runs_definition_id_fkey | foreign key | `FOREIGN KEY (definition_id) REFERENCES agent_hub_definitions(id) ON DELETE CASCADE` |
| agent_hub_runs_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| agent_hub_runs_pkey | `UNIQUE btree (id)` |

## agent_knowledge_records

Element `TE-DB-agent_knowledge_records` · declared at `server/db.js:1873` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_knowledge_records_id_seq'::regclass)` |
| 2 | `record_key` | text | NOT NULL |  |
| 3 | `record_type` | text | NOT NULL |  |
| 4 | `title` | text | NOT NULL |  |
| 5 | `statement` | text | NOT NULL |  |
| 6 | `rationale` | text | yes |  |
| 7 | `status` | text | NOT NULL | `'proposed'::text` |
| 8 | `confidence` | numeric | yes |  |
| 9 | `domain_keys` | jsonb | NOT NULL | `'[]'::jsonb` |
| 10 | `capability_ids` | jsonb | NOT NULL | `'[]'::jsonb` |
| 11 | `eidos_object_links` | jsonb | NOT NULL | `'[]'::jsonb` |
| 12 | `backlog_item_id` | bigint | yes |  |
| 13 | `source_thread_id` | bigint | yes |  |
| 14 | `source_message_id` | bigint | yes |  |
| 15 | `implementation` | jsonb | NOT NULL | `'{}'::jsonb` |
| 16 | `reuse_score` | numeric | NOT NULL | `0` |
| 17 | `template_candidate` | boolean | NOT NULL | `false` |
| 18 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 19 | `created_by` | bigint | yes |  |
| 20 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 21 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_knowledge_records_backlog_item_id_fkey | foreign key | `FOREIGN KEY (backlog_item_id) REFERENCES backlog_items(id) ON DELETE SET NULL` |
| agent_knowledge_records_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| agent_knowledge_records_pkey | primary key | `PRIMARY KEY (id)` |
| agent_knowledge_records_record_key_key | unique | `UNIQUE (record_key)` |
| agent_knowledge_records_source_message_id_fkey | foreign key | `FOREIGN KEY (source_message_id) REFERENCES agent_messages(id) ON DELETE SET NULL` |
| agent_knowledge_records_source_thread_id_fkey | foreign key | `FOREIGN KEY (source_thread_id) REFERENCES agent_threads(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| agent_knowledge_records_pkey | `UNIQUE btree (id)` |
| agent_knowledge_records_record_key_key | `UNIQUE btree (record_key)` |
| idx_agent_knowledge_backlog | `btree (backlog_item_id) WHERE (backlog_item_id IS NOT NULL)` |
| idx_agent_knowledge_type | `btree (record_type, status)` |

## agent_llm_usage

Element `TE-DB-agent_llm_usage` · declared at `server/db.js:5700` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_llm_usage_id_seq'::regclass)` |
| 2 | `definition_id` | bigint | NOT NULL |  |
| 3 | `provider` | text | NOT NULL |  |
| 4 | `model` | text | NOT NULL |  |
| 5 | `period_key` | text | NOT NULL |  |
| 6 | `input_tokens` | bigint | NOT NULL | `0` |
| 7 | `output_tokens` | bigint | NOT NULL | `0` |
| 8 | `request_count` | bigint | NOT NULL | `0` |
| 9 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_llm_usage_definition_id_fkey | foreign key | `FOREIGN KEY (definition_id) REFERENCES agent_hub_definitions(id) ON DELETE CASCADE` |
| agent_llm_usage_definition_id_provider_model_period_key_key | unique | `UNIQUE (definition_id, provider, model, period_key)` |
| agent_llm_usage_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| agent_llm_usage_definition_id_provider_model_period_key_key | `UNIQUE btree (definition_id, provider, model, period_key)` |
| agent_llm_usage_pkey | `UNIQUE btree (id)` |

## agent_messages

Element `TE-DB-agent_messages` · declared at `server/db.js:1838` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_messages_id_seq'::regclass)` |
| 2 | `thread_id` | bigint | NOT NULL |  |
| 3 | `role` | text | NOT NULL |  |
| 4 | `content` | text | NOT NULL |  |
| 5 | `tool_calls` | text | yes |  |
| 6 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_messages_pkey | primary key | `PRIMARY KEY (id)` |
| agent_messages_thread_id_fkey | foreign key | `FOREIGN KEY (thread_id) REFERENCES agent_threads(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| agent_messages_pkey | `UNIQUE btree (id)` |
| idx_agent_messages_thread | `btree (thread_id, created_at)` |

## agent_run_log

Element `TE-DB-agent_run_log` · declared at `server/db.js:5153` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_run_log_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `agent_key` | text | NOT NULL |  |
| 4 | `run_type` | text | NOT NULL |  |
| 5 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_run_log_pkey | primary key | `PRIMARY KEY (id)` |
| agent_run_log_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| agent_run_log_pkey | `UNIQUE btree (id)` |
| idx_agent_run_log_user_day | `btree (user_id, agent_key, created_at)` |

## agent_schedules

Element `TE-DB-agent_schedules` · declared at `server/db.js:5120` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_schedules_id_seq'::regclass)` |
| 2 | `agent_definition_id` | bigint | NOT NULL |  |
| 3 | `org_id` | bigint | yes |  |
| 4 | `owner_user_id` | bigint | yes |  |
| 5 | `cadence` | text | NOT NULL | `'on_demand'::text` |
| 6 | `cadence_detail` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `trigger_mode` | text | NOT NULL | `'scheduled'::text` |
| 8 | `trigger_molecule_key` | text | yes |  |
| 9 | `is_active` | boolean | NOT NULL | `true` |
| 10 | `last_run_at` | bigint | yes |  |
| 11 | `next_run_at` | bigint | yes |  |
| 12 | `created_at` | bigint | NOT NULL |  |
| 13 | `updated_at` | bigint | NOT NULL |  |
| 14 | `action_key` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_schedules_agent_definition_id_fkey | foreign key | `FOREIGN KEY (agent_definition_id) REFERENCES agent_definitions(id) ON DELETE CASCADE` |
| agent_schedules_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| agent_schedules_owner_user_id_fkey | foreign key | `FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE` |
| agent_schedules_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| agent_schedules_pkey | `UNIQUE btree (id)` |
| idx_agent_schedules_agent | `btree (agent_definition_id)` |

## agent_threads

Element `TE-DB-agent_threads` · declared at `server/db.js:1829` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_threads_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `kind` | text | NOT NULL | `'scrum'::text` |
| 4 | `title` | text | yes |  |
| 5 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 6 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 7 | `provider` | text | NOT NULL | `'anthropic'::text` |
| 8 | `model` | text | yes |  |
| 9 | `context_profile_id` | bigint | yes |  |
| 10 | `backlog_item_id` | bigint | yes |  |
| 11 | `stage` | text | NOT NULL | `'definition'::text` |
| 12 | `context_snapshot` | jsonb | NOT NULL | `'{}'::jsonb` |
| 13 | `provider_session_id` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_threads_backlog_item_id_fkey | foreign key | `FOREIGN KEY (backlog_item_id) REFERENCES backlog_items(id) ON DELETE SET NULL` |
| agent_threads_context_profile_id_fkey | foreign key | `FOREIGN KEY (context_profile_id) REFERENCES agent_context_profiles(id) ON DELETE SET NULL` |
| agent_threads_pkey | primary key | `PRIMARY KEY (id)` |
| agent_threads_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| agent_threads_pkey | `UNIQUE btree (id)` |
| idx_agent_threads_user | `btree (user_id, updated_at DESC)` |

## agent_work_stage_events

Element `TE-DB-agent_work_stage_events` · declared at `server/db.js:1899` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('agent_work_stage_events_id_seq'::regclass)` |
| 2 | `thread_id` | bigint | NOT NULL |  |
| 3 | `backlog_item_id` | bigint | yes |  |
| 4 | `stage` | text | NOT NULL |  |
| 5 | `event_type` | text | NOT NULL | `'entered'::text` |
| 6 | `summary` | text | yes |  |
| 7 | `evidence` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `created_by` | bigint | yes |  |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| agent_work_stage_events_backlog_item_id_fkey | foreign key | `FOREIGN KEY (backlog_item_id) REFERENCES backlog_items(id) ON DELETE SET NULL` |
| agent_work_stage_events_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| agent_work_stage_events_pkey | primary key | `PRIMARY KEY (id)` |
| agent_work_stage_events_thread_id_fkey | foreign key | `FOREIGN KEY (thread_id) REFERENCES agent_threads(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| agent_work_stage_events_pkey | `UNIQUE btree (id)` |
| idx_agent_stage_thread | `btree (thread_id, created_at)` |
