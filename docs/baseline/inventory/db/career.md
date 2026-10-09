# Database — `career` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## career_certifications

Element `TE-DB-career_certifications` · declared at `server/db.js:3781` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_certifications_id_seq'::regclass)` |
| 2 | `name` | text | NOT NULL |  |
| 3 | `issuer` | text | yes |  |
| 4 | `category` | text | yes |  |
| 5 | `first_earned` | text | yes |  |
| 6 | `last_renewed` | text | yes |  |
| 7 | `expires` | text | yes |  |
| 8 | `status` | text | yes |  |
| 9 | `credential_id` | text | yes |  |
| 10 | `notes` | text | yes |  |
| 11 | `order_index` | integer | NOT NULL | `0` |
| 12 | `created_at` | bigint | NOT NULL |  |
| 13 | `updated_at` | bigint | NOT NULL |  |
| 14 | `user_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_certifications_pkey | primary key | `PRIMARY KEY (id)` |
| career_certifications_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_certifications_pkey | `UNIQUE btree (id)` |
| idx_career_certifications_user | `btree (user_id)` |
| idx_career_certs_order | `btree (order_index)` |

## career_deals

Element `TE-DB-career_deals` · declared at `server/db.js:3798` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_deals_id_seq'::regclass)` |
| 2 | `deal_name` | text | NOT NULL |  |
| 3 | `portfolio_company` | text | yes |  |
| 4 | `employer_at_time` | text | yes |  |
| 5 | `deal_role` | text | yes |  |
| 6 | `investment_type` | text | yes |  |
| 7 | `deal_size` | text | yes |  |
| 8 | `deal_size_musd` | numeric | yes |  |
| 9 | `entry_date` | text | yes |  |
| 10 | `exit_date` | text | yes |  |
| 11 | `exit_value` | text | yes |  |
| 12 | `exit_value_musd` | numeric | yes |  |
| 13 | `gross_return_pct` | numeric | yes |  |
| 14 | `attribution_pct` | numeric | yes |  |
| 15 | `individual_return` | text | yes |  |
| 16 | `stake_type` | text | yes |  |
| 17 | `outcome_status` | text | yes |  |
| 18 | `is_active_portfolio` | boolean | NOT NULL | `false` |
| 19 | `arr_entry_musd` | numeric | yes |  |
| 20 | `arr_prior_year_musd` | numeric | yes |  |
| 21 | `arr_current_musd` | numeric | yes |  |
| 22 | `notes` | text | yes |  |
| 23 | `order_index` | integer | NOT NULL | `0` |
| 24 | `created_at` | bigint | NOT NULL |  |
| 25 | `updated_at` | bigint | NOT NULL |  |
| 26 | `user_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_deals_pkey | primary key | `PRIMARY KEY (id)` |
| career_deals_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_deals_pkey | `UNIQUE btree (id)` |
| idx_career_deals_active | `btree (is_active_portfolio)` |
| idx_career_deals_order | `btree (order_index)` |
| idx_career_deals_user | `btree (user_id)` |

## career_domains

Element `TE-DB-career_domains` · declared at `server/db.js:3759` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_domains_id_seq'::regclass)` |
| 2 | `group_type` | text | NOT NULL |  |
| 3 | `title` | text | NOT NULL |  |
| 4 | `icon` | text | yes |  |
| 5 | `description` | text | yes |  |
| 6 | `items` | jsonb | NOT NULL | `'[]'::jsonb` |
| 7 | `accent_color` | text | yes |  |
| 8 | `extra` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `order_index` | integer | NOT NULL | `0` |
| 10 | `created_at` | bigint | NOT NULL |  |
| 11 | `updated_at` | bigint | NOT NULL |  |
| 12 | `user_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_domains_pkey | primary key | `PRIMARY KEY (id)` |
| career_domains_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_domains_pkey | `UNIQUE btree (id)` |
| idx_career_domains_group | `btree (group_type, order_index)` |
| idx_career_domains_user | `btree (user_id)` |

## career_engagements

Element `TE-DB-career_engagements` · declared at `server/db.js:3729` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_engagements_id_seq'::regclass)` |
| 2 | `name` | text | NOT NULL |  |
| 3 | `employer` | text | NOT NULL |  |
| 4 | `client_name_real` | text | yes |  |
| 5 | `client_display_name` | text | NOT NULL |  |
| 6 | `industry` | text | yes |  |
| 7 | `period` | text | yes |  |
| 8 | `scale` | text | yes |  |
| 9 | `roles` | jsonb | NOT NULL | `'[]'::jsonb` |
| 10 | `context` | text | yes |  |
| 11 | `actions` | text | yes |  |
| 12 | `outcomes` | jsonb | NOT NULL | `'[]'::jsonb` |
| 13 | `metrics` | jsonb | NOT NULL | `'[]'::jsonb` |
| 14 | `testimonial` | text | yes |  |
| 15 | `testimonial_attr` | text | yes |  |
| 16 | `scenarios` | jsonb | NOT NULL | `'[]'::jsonb` |
| 17 | `publish_case_study` | boolean | NOT NULL | `true` |
| 18 | `investment_type` | text | yes |  |
| 19 | `acquired_detail` | text | yes |  |
| 20 | `exit_detail` | text | yes |  |
| 21 | `financial_return` | text | yes |  |
| 22 | `outcome_status` | text | yes |  |
| 23 | `order_index` | integer | NOT NULL | `0` |
| 24 | `created_at` | bigint | NOT NULL |  |
| 25 | `updated_at` | bigint | NOT NULL |  |
| 26 | `user_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_engagements_pkey | primary key | `PRIMARY KEY (id)` |
| career_engagements_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_engagements_pkey | `UNIQUE btree (id)` |
| idx_career_engagements_emp | `btree (employer)` |
| idx_career_engagements_order | `btree (order_index)` |
| idx_career_engagements_user | `btree (user_id)` |

## career_experience_definitions

Element `TE-DB-career_experience_definitions` · declared at `server/db.js:2957` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_experience_definitions_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `definition_type` | text | NOT NULL |  |
| 4 | `definition_key` | text | NOT NULL |  |
| 5 | `label` | text | NOT NULL |  |
| 6 | `description` | text | yes |  |
| 7 | `definition` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `sort_order` | integer | NOT NULL | `0` |
| 9 | `is_active` | boolean | NOT NULL | `true` |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_experience_definitions_pkey | primary key | `PRIMARY KEY (id)` |
| career_experience_definitions_user_id_definition_type_defin_key | unique | `UNIQUE (user_id, definition_type, definition_key)` |
| career_experience_definitions_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| career_experience_definitions_pkey | `UNIQUE btree (id)` |
| career_experience_definitions_user_id_definition_type_defin_key | `UNIQUE btree (user_id, definition_type, definition_key)` |
| idx_career_experience_definitions_user | `btree (user_id)` |

## career_intake_documents

Element `TE-DB-career_intake_documents` · declared at `server/db.js:3988` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_intake_documents_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `owner_scope` | text | NOT NULL | `'member'::text` |
| 4 | `intake_kind` | text | NOT NULL |  |
| 5 | `source_truth_status` | text | NOT NULL | `'user_attested'::text` |
| 6 | `source_use_scope` | text | NOT NULL | `'career_master_and_outputs'::text` |
| 7 | `client_name_policy` | text | NOT NULL | `'generalize_private_clients'::text` |
| 8 | `portfolio_name_policy` | text | NOT NULL | `'allow_if_user_provided'::text` |
| 9 | `case_study_title_policy` | text | NOT NULL | `'industry_company_type'::text` |
| 10 | `public_primary_research` | boolean | NOT NULL | `false` |
| 11 | `primary_resume_requested` | boolean | NOT NULL | `true` |
| 12 | `analysis_passes_requested` | integer | NOT NULL | `3` |
| 13 | `redaction_ack` | boolean | NOT NULL | `false` |
| 14 | `public_output_validation_ack` | boolean | NOT NULL | `false` |
| 15 | `no_private_name_persistence_ack` | boolean | NOT NULL | `false` |
| 16 | `original_filename` | text | NOT NULL |  |
| 17 | `storage_bucket` | text | NOT NULL |  |
| 18 | `storage_key` | text | NOT NULL |  |
| 19 | `mime_type` | text | yes |  |
| 20 | `file_size` | bigint | yes |  |
| 21 | `upload_notes` | text | yes |  |
| 22 | `status` | text | NOT NULL | `'uploaded'::text` |
| 23 | `created_at` | bigint | NOT NULL |  |
| 24 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_intake_documents_pkey | primary key | `PRIMARY KEY (id)` |
| career_intake_documents_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| career_intake_documents_pkey | `UNIQUE btree (id)` |
| idx_career_intake_docs_kind | `btree (intake_kind, created_at DESC)` |
| idx_career_intake_docs_user | `btree (user_id, created_at DESC)` |

## career_intake_runs

Element `TE-DB-career_intake_runs` · declared at `server/db.js:4017` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_intake_runs_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `owner_scope` | text | NOT NULL | `'member'::text` |
| 4 | `run_kind` | text | NOT NULL | `'career_master_mapping'::text` |
| 5 | `status` | text | NOT NULL | `'queued'::text` |
| 6 | `document_ids` | jsonb | NOT NULL | `'[]'::jsonb` |
| 7 | `analysis_passes_requested` | integer | NOT NULL | `3` |
| 8 | `primary_resume_requested` | boolean | NOT NULL | `true` |
| 9 | `public_primary_research` | boolean | NOT NULL | `false` |
| 10 | `resume_preset_created` | boolean | NOT NULL | `false` |
| 11 | `summary` | text | yes |  |
| 12 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 13 | `created_at` | bigint | NOT NULL |  |
| 14 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_intake_runs_pkey | primary key | `PRIMARY KEY (id)` |
| career_intake_runs_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| career_intake_runs_pkey | `UNIQUE btree (id)` |
| idx_career_intake_runs_status | `btree (status, created_at DESC)` |
| idx_career_intake_runs_user | `btree (user_id, created_at DESC)` |

## career_jobs

Element `TE-DB-career_jobs` · declared at `server/db.js:3680` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_jobs_id_seq'::regclass)` |
| 2 | `company` | text | NOT NULL |  |
| 3 | `title` | text | NOT NULL |  |
| 4 | `start_date` | text | yes |  |
| 5 | `end_date` | text | yes |  |
| 6 | `duration` | text | yes |  |
| 7 | `salary` | text | yes |  |
| 8 | `job_function` | text | yes |  |
| 9 | `industry` | text | yes |  |
| 10 | `key_metrics` | text | yes |  |
| 11 | `order_index` | integer | NOT NULL | `0` |
| 12 | `created_at` | bigint | NOT NULL |  |
| 13 | `updated_at` | bigint | NOT NULL |  |
| 14 | `user_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_jobs_pkey | primary key | `PRIMARY KEY (id)` |
| career_jobs_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_jobs_pkey | `UNIQUE btree (id)` |
| idx_career_jobs_order | `btree (order_index)` |
| idx_career_jobs_user | `btree (user_id)` |

## career_meta_options

Element `TE-DB-career_meta_options` · declared at `server/db.js:3828` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_meta_options_id_seq'::regclass)` |
| 2 | `field_key` | text | NOT NULL |  |
| 3 | `value` | text | NOT NULL |  |
| 4 | `description` | text | yes |  |
| 5 | `order_index` | integer | NOT NULL | `0` |
| 6 | `created_at` | bigint | NOT NULL |  |
| 7 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_meta_options_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_meta_options_pkey | `UNIQUE btree (id)` |
| idx_career_meta_options_key | `btree (field_key, order_index)` |

## career_proficiency_assertions

Element `TE-DB-career_proficiency_assertions` · declared at `server/db.js:2973` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_proficiency_assertions_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `entity_type` | text | NOT NULL |  |
| 4 | `entity_id` | bigint | NOT NULL |  |
| 5 | `period_key` | text | NOT NULL |  |
| 6 | `level_key` | text | NOT NULL |  |
| 7 | `confidence` | numeric | NOT NULL | `1` |
| 8 | `assessment_source` | text | NOT NULL | `'user_confirmed'::text` |
| 9 | `evidence_count` | integer | NOT NULL | `0` |
| 10 | `last_practiced_at` | bigint | yes |  |
| 11 | `visibility` | text | NOT NULL | `'private'::text` |
| 12 | `notes` | text | yes |  |
| 13 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 14 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_proficiency_assertions_pkey | primary key | `PRIMARY KEY (id)` |
| career_proficiency_assertions_user_id_entity_type_entity_id_key | unique | `UNIQUE (user_id, entity_type, entity_id, period_key)` |
| career_proficiency_assertions_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| career_proficiency_assertions_pkey | `UNIQUE btree (id)` |
| career_proficiency_assertions_user_id_entity_type_entity_id_key | `UNIQUE btree (user_id, entity_type, entity_id, period_key)` |
| idx_career_proficiency_assertions_user | `btree (user_id)` |

## career_reasoning_approvals

Element `TE-DB-career_reasoning_approvals` · declared at `server/db.js:4088` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_reasoning_approvals_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `task_id` | bigint | NOT NULL |  |
| 4 | `entry_type` | text | NOT NULL |  |
| 5 | `atom_key` | text | yes |  |
| 6 | `reasoning_pattern` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `raw_reasoning` | text | yes |  |
| 8 | `source_excerpt` | text | yes |  |
| 9 | `approved_by` | bigint | NOT NULL |  |
| 10 | `approved_at` | bigint | NOT NULL |  |
| 11 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_reasoning_approvals_approved_by_fkey | foreign key | `FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE CASCADE` |
| career_reasoning_approvals_pkey | primary key | `PRIMARY KEY (id)` |
| career_reasoning_approvals_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| career_reasoning_approvals_task_id_approved_by_key | unique | `UNIQUE (task_id, approved_by)` |
| career_reasoning_approvals_task_id_fkey | foreign key | `FOREIGN KEY (task_id) REFERENCES career_reconciliation_tasks(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| career_reasoning_approvals_pkey | `UNIQUE btree (id)` |
| career_reasoning_approvals_task_id_approved_by_key | `UNIQUE btree (task_id, approved_by)` |
| idx_career_reasoning_approvals_pattern | `btree (((reasoning_pattern ->> 'patternKey'::text)))` |

## career_reasoning_cache_candidates

Element `TE-DB-career_reasoning_cache_candidates` · declared at `server/db.js:4105` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_reasoning_cache_candidates_id_seq'::regclass)` |
| 2 | `pattern_key` | text | NOT NULL |  |
| 3 | `entry_type` | text | NOT NULL |  |
| 4 | `atom_key` | text | yes |  |
| 5 | `approved_user_count` | integer | NOT NULL | `0` |
| 6 | `total_eligible_user_count` | integer | NOT NULL | `0` |
| 7 | `approval_ratio` | double precision | NOT NULL | `0` |
| 8 | `sample_reasonings` | jsonb | NOT NULL | `'[]'::jsonb` |
| 9 | `status` | text | NOT NULL | `'pending_review'::text` |
| 10 | `admin_decision_id` | bigint | yes |  |
| 11 | `computed_at` | bigint | NOT NULL |  |
| 12 | `created_at` | bigint | NOT NULL |  |
| 13 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_reasoning_cache_candidates_admin_decision_id_fkey | foreign key | `FOREIGN KEY (admin_decision_id) REFERENCES journey_rod_decisions(id) ON DELETE SET NULL` |
| career_reasoning_cache_candidates_pattern_key_key | unique | `UNIQUE (pattern_key)` |
| career_reasoning_cache_candidates_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_reasoning_cache_candidates_pattern_key_key | `UNIQUE btree (pattern_key)` |
| career_reasoning_cache_candidates_pkey | `UNIQUE btree (id)` |

## career_reconciliation_tasks

Element `TE-DB-career_reconciliation_tasks` · declared at `server/db.js:4065` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_reconciliation_tasks_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `task_type` | text | NOT NULL |  |
| 4 | `entry_type` | text | NOT NULL |  |
| 5 | `atom_key` | text | yes |  |
| 6 | `target_table` | text | yes |  |
| 7 | `target_id` | bigint | yes |  |
| 8 | `evidence_refs` | jsonb | NOT NULL | `'[]'::jsonb` |
| 9 | `reasoning` | jsonb | yes |  |
| 10 | `status` | text | NOT NULL | `'open'::text` |
| 11 | `resolution` | jsonb | yes |  |
| 12 | `resolved_by` | bigint | yes |  |
| 13 | `resolved_at` | bigint | yes |  |
| 14 | `detected_at` | bigint | NOT NULL |  |
| 15 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 16 | `created_at` | bigint | NOT NULL |  |
| 17 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_reconciliation_tasks_pkey | primary key | `PRIMARY KEY (id)` |
| career_reconciliation_tasks_resolved_by_fkey | foreign key | `FOREIGN KEY (resolved_by) REFERENCES users(id)` |
| career_reconciliation_tasks_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| career_reconciliation_tasks_pkey | `UNIQUE btree (id)` |
| idx_reconciliation_tasks_open_unique | `UNIQUE btree (rod_id, entry_type, atom_key, task_type) WHERE (status = 'open'::text)` |
| idx_reconciliation_tasks_rod | `btree (rod_id, status)` |

## career_skills

Element `TE-DB-career_skills` · declared at `server/db.js:3697` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_skills_id_seq'::regclass)` |
| 2 | `skill` | text | NOT NULL |  |
| 3 | `category` | text | yes |  |
| 4 | `tier` | text | yes |  |
| 5 | `years_exp` | numeric | yes |  |
| 6 | `num_engagements` | integer | yes |  |
| 7 | `first_used` | integer | yes |  |
| 8 | `resume_language` | text | yes |  |
| 9 | `order_index` | integer | NOT NULL | `0` |
| 10 | `created_at` | bigint | NOT NULL |  |
| 11 | `updated_at` | bigint | NOT NULL |  |
| 12 | `user_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_skills_pkey | primary key | `PRIMARY KEY (id)` |
| career_skills_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_skills_pkey | `UNIQUE btree (id)` |
| idx_career_skills_cat | `btree (category)` |
| idx_career_skills_order | `btree (order_index)` |
| idx_career_skills_user | `btree (user_id)` |

## career_source_mappings

Element `TE-DB-career_source_mappings` · declared at `server/db.js:4036` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_source_mappings_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `document_id` | bigint | yes |  |
| 4 | `source_kind` | text | NOT NULL |  |
| 5 | `source_filename` | text | yes |  |
| 6 | `source_location` | text | yes |  |
| 7 | `source_label` | text | yes |  |
| 8 | `entry_type` | text | NOT NULL |  |
| 9 | `target_table` | text | NOT NULL |  |
| 10 | `target_id` | bigint | NOT NULL |  |
| 11 | `atom_key` | text | NOT NULL |  |
| 12 | `original_value` | jsonb | yes |  |
| 13 | `committed_value` | jsonb | yes |  |
| 14 | `match_type` | text | yes |  |
| 15 | `affinity` | double precision | yes |  |
| 16 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_source_mappings_document_id_fkey | foreign key | `FOREIGN KEY (document_id) REFERENCES career_intake_documents(id) ON DELETE SET NULL` |
| career_source_mappings_pkey | primary key | `PRIMARY KEY (id)` |
| career_source_mappings_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| career_source_mappings_pkey | `UNIQUE btree (id)` |
| idx_career_source_mappings_document | `btree (document_id)` |
| idx_career_source_mappings_target | `btree (target_table, target_id)` |

## career_tools

Element `TE-DB-career_tools` · declared at `server/db.js:3713` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('career_tools_id_seq'::regclass)` |
| 2 | `name_used` | text | NOT NULL |  |
| 3 | `current_name` | text | yes |  |
| 4 | `category` | text | yes |  |
| 5 | `tier` | text | yes |  |
| 6 | `first_used` | integer | yes |  |
| 7 | `num_roles` | integer | yes |  |
| 8 | `notes` | text | yes |  |
| 9 | `wheel_bucket` | text | yes |  |
| 10 | `order_index` | integer | NOT NULL | `0` |
| 11 | `created_at` | bigint | NOT NULL |  |
| 12 | `updated_at` | bigint | NOT NULL |  |
| 13 | `user_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| career_tools_pkey | primary key | `PRIMARY KEY (id)` |
| career_tools_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id)` |

**Indexes**

| Name | Definition |
|---|---|
| career_tools_pkey | `UNIQUE btree (id)` |
| idx_career_tools_order | `btree (order_index)` |
| idx_career_tools_user | `btree (user_id)` |
