# Database — `misc` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## account_records

Element `TE-DB-account_records` · declared at `server/db.js:1997` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('account_records_id_seq'::regclass)` |
| 2 | `account_type` | text | NOT NULL |  |
| 3 | `user_id` | bigint | yes |  |
| 4 | `org_id` | bigint | yes |  |
| 5 | `lead_id` | bigint | yes |  |
| 6 | `display_name` | text | yes |  |
| 7 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 9 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| account_records_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL` |
| account_records_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| account_records_pkey | primary key | `PRIMARY KEY (id)` |
| account_records_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| account_records_pkey | `UNIQUE btree (id)` |
| idx_account_records_org | `UNIQUE btree (org_id) WHERE (org_id IS NOT NULL)` |
| idx_account_records_user | `UNIQUE btree (user_id) WHERE (user_id IS NOT NULL)` |

## accounting_policies

Element `TE-DB-accounting_policies` · declared at `server/db.js:748` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('accounting_policies_id_seq'::regclass)` |
| 2 | `policy_key` | text | NOT NULL |  |
| 3 | `org_id` | bigint | yes |  |
| 4 | `framework` | text | NOT NULL | `'GAAP'::text` |
| 5 | `legal_entity` | text | yes |  |
| 6 | `jurisdiction` | text | yes |  |
| 7 | `recognition_rules` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `measurement_rules` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `allocation_rules` | jsonb | NOT NULL | `'{}'::jsonb` |
| 10 | `is_active` | boolean | NOT NULL | `true` |
| 11 | `created_at` | bigint | NOT NULL |  |
| 12 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| accounting_policies_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| accounting_policies_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| accounting_policies_pkey | `UNIQUE btree (id)` |
| idx_accounting_policy_global | `UNIQUE btree (policy_key) WHERE (org_id IS NULL)` |
| idx_accounting_policy_org | `UNIQUE btree (policy_key, org_id) WHERE (org_id IS NOT NULL)` |

## accounting_topology_definitions

Element `TE-DB-accounting_topology_definitions` · declared at `server/db.js:784` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('accounting_topology_definitions_id_seq'::regclass)` |
| 2 | `topology_key` | text | NOT NULL |  |
| 3 | `org_id` | bigint | yes |  |
| 4 | `label` | text | NOT NULL |  |
| 5 | `economic_composition_requirements` | jsonb | NOT NULL | `'[]'::jsonb` |
| 6 | `required_account_roles` | jsonb | NOT NULL | `'[]'::jsonb` |
| 7 | `balancing_constraints` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `policy_id` | bigint | yes |  |
| 9 | `is_active` | boolean | NOT NULL | `true` |
| 10 | `created_at` | bigint | NOT NULL |  |
| 11 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| accounting_topology_definitions_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| accounting_topology_definitions_pkey | primary key | `PRIMARY KEY (id)` |
| accounting_topology_definitions_policy_id_fkey | foreign key | `FOREIGN KEY (policy_id) REFERENCES accounting_policies(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| accounting_topology_definitions_pkey | `UNIQUE btree (id)` |
| idx_topology_def_global | `UNIQUE btree (topology_key) WHERE (org_id IS NULL)` |
| idx_topology_def_org | `UNIQUE btree (topology_key, org_id) WHERE (org_id IS NOT NULL)` |

## analytics_events

Element `TE-DB-analytics_events` · declared at `server/db.js:2800` · RLS not enabled · rows after empty-DB bootstrap: 2

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('analytics_events_id_seq'::regclass)` |
| 2 | `event_type` | text | NOT NULL |  |
| 3 | `app_id` | text | yes |  |
| 4 | `object_type` | text | yes |  |
| 5 | `object_id` | text | yes |  |
| 6 | `member_user_id` | bigint | yes |  |
| 7 | `visitor_user_id` | bigint | yes |  |
| 8 | `session_id` | text | yes |  |
| 9 | `ip_hash` | text | yes |  |
| 10 | `referrer_domain` | text | yes |  |
| 11 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 12 | `occurred_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| analytics_events_member_user_id_fkey | foreign key | `FOREIGN KEY (member_user_id) REFERENCES users(id) ON DELETE SET NULL` |
| analytics_events_pkey | primary key | `PRIMARY KEY (id)` |
| analytics_events_visitor_user_id_fkey | foreign key | `FOREIGN KEY (visitor_user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| analytics_events_pkey | `UNIQUE btree (id)` |
| idx_ae_member | `btree (member_user_id, occurred_at DESC)` |
| idx_ae_occurred | `btree (occurred_at DESC)` |
| idx_ae_type | `btree (event_type, occurred_at DESC)` |

## audit_events

Element `TE-DB-audit_events` · declared at `server/db.js:2314` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('audit_events_id_seq'::regclass)` |
| 2 | `user_id` | bigint | yes |  |
| 3 | `entity_type` | text | NOT NULL |  |
| 4 | `entity_id` | bigint | NOT NULL |  |
| 5 | `action` | text | NOT NULL |  |
| 6 | `before_value` | jsonb | yes |  |
| 7 | `after_value` | jsonb | yes |  |
| 8 | `source` | text | NOT NULL |  |
| 9 | `reason` | text | yes |  |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| audit_events_action_check | check | `CHECK ((action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text, 'status_change'::text])))` |
| audit_events_pkey | primary key | `PRIMARY KEY (id)` |
| audit_events_source_check | check | `CHECK ((source = ANY (ARRAY['manual_ui'::text, 'brain_dump'::text, 'bulk_script'::text, 'jira_sync'::text, 'seed'::text])))` |
| audit_events_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| audit_events_pkey | `UNIQUE btree (id)` |
| idx_audit_source | `btree (source, created_at DESC)` |
| idx_audit_user | `btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL)` |

## audit_log

Element `TE-DB-audit_log` · declared at `server/db.js:1603` · RLS not enabled · rows after empty-DB bootstrap: 6

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('audit_log_id_seq'::regclass)` |
| 2 | `actor_id` | bigint | yes |  |
| 3 | `actor_email` | text | yes |  |
| 4 | `actor_role` | text | yes |  |
| 5 | `action` | text | NOT NULL |  |
| 6 | `entity_type` | text | yes |  |
| 7 | `entity_id` | text | yes |  |
| 8 | `summary` | text | yes |  |
| 9 | `diff` | text | yes |  |
| 10 | `ip` | text | yes |  |
| 11 | `user_agent` | text | yes |  |
| 12 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| audit_log_actor_id_fkey | foreign key | `FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL` |
| audit_log_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| audit_log_pkey | `UNIQUE btree (id)` |
| idx_audit_actor | `btree (actor_id, created_at DESC)` |
| idx_audit_created | `btree (created_at DESC)` |
| idx_audit_entity | `btree (entity_type, entity_id, created_at DESC)` |

## backlog_items

Element `TE-DB-backlog_items` · declared at `server/db.js:1684` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('backlog_items_id_seq'::regclass)` |
| 2 | `capability_id` | bigint | yes |  |
| 3 | `parent_id` | bigint | yes |  |
| 4 | `kind` | text | NOT NULL | `'feature'::text` |
| 5 | `title` | text | NOT NULL |  |
| 6 | `summary` | text | yes |  |
| 7 | `user_story` | text | yes |  |
| 8 | `requirement_detail` | text | yes |  |
| 9 | `business_rules` | text | yes |  |
| 10 | `design_spec` | text | yes |  |
| 11 | `acceptance_criteria` | text | yes |  |
| 12 | `process_steps` | text | yes |  |
| 13 | `status` | text | NOT NULL | `'pending'::text` |
| 14 | `priority` | text | yes |  |
| 15 | `work_split_claude` | integer | yes |  |
| 16 | `time_minutes` | integer | yes |  |
| 17 | `deployed_github` | boolean | NOT NULL | `false` |
| 18 | `deployed_render` | boolean | NOT NULL | `false` |
| 19 | `deployed_netlify` | boolean | NOT NULL | `false` |
| 20 | `deploy_relevance` | text | yes |  |
| 21 | `tags` | text | yes |  |
| 22 | `external_ref` | text | yes |  |
| 23 | `sort_order` | integer | NOT NULL | `0` |
| 24 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 25 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 26 | `tech_stack` | text | yes |  |
| 27 | `cost_usd_claude` | numeric | yes |  |
| 28 | `hours_betsy` | numeric | yes |  |
| 29 | `hours_claude` | numeric | yes |  |
| 30 | `activities_betsy` | integer | yes |  |
| 31 | `activities_claude` | integer | yes |  |
| 32 | `traditional_cost_usd` | numeric | yes |  |
| 33 | `jira_issue_key` | text | yes |  |
| 34 | `test_scenario_id` | bigint | yes |  |
| 35 | `session_id` | bigint | yes |  |
| 36 | `l2r_stage` | text | yes |  |
| 37 | `contribution_type` | text | yes |  |
| 38 | `est_director_hours` | numeric | yes |  |
| 39 | `est_claude_hours` | numeric | yes |  |
| 40 | `actual_director_hours` | numeric | yes |  |
| 41 | `actual_claude_hours` | numeric | yes |  |
| 42 | `oversight_intensity` | text | yes |  |
| 43 | `automation_potential` | text | yes |  |
| 44 | `patch_note_version` | text | yes |  |
| 45 | `data_source` | text | yes | `'estimated'::text` |
| 46 | `fee_type` | text | yes |  |
| 47 | `hours_strategic_direction` | numeric | yes |  |
| 48 | `hours_domain_authoring` | numeric | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| backlog_items_capability_id_fkey | foreign key | `FOREIGN KEY (capability_id) REFERENCES capability_groups(id) ON DELETE SET NULL` |
| backlog_items_parent_id_fkey | foreign key | `FOREIGN KEY (parent_id) REFERENCES backlog_items(id) ON DELETE SET NULL` |
| backlog_items_pkey | primary key | `PRIMARY KEY (id)` |
| backlog_items_test_scenario_id_fkey | foreign key | `FOREIGN KEY (test_scenario_id) REFERENCES test_scenarios(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| backlog_items_pkey | `UNIQUE btree (id)` |
| idx_backlog_capability | `btree (capability_id)` |
| idx_backlog_jira_key | `btree (jira_issue_key) WHERE (jira_issue_key IS NOT NULL)` |
| idx_backlog_kind | `btree (kind)` |
| idx_backlog_parent | `btree (parent_id) WHERE (parent_id IS NOT NULL)` |
| idx_backlog_status | `btree (status)` |
| idx_backlog_test_scenario | `btree (test_scenario_id) WHERE (test_scenario_id IS NOT NULL)` |

## build_progress_snapshots

Element `TE-DB-build_progress_snapshots` · declared at `server/db.js:2344` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('build_progress_snapshots_id_seq'::regclass)` |
| 2 | `captured_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 3 | `captured_date` | date | NOT NULL | `CURRENT_DATE` |
| 4 | `requirements_total` | integer | NOT NULL |  |
| 5 | `requirements_delivered` | integer | NOT NULL |  |
| 6 | `hours_claude` | numeric | NOT NULL | `0` |
| 7 | `hours_betsy` | numeric | NOT NULL | `0` |
| 8 | `activities_claude` | integer | NOT NULL | `0` |
| 9 | `activities_betsy` | integer | NOT NULL | `0` |
| 10 | `cost_usd_claude` | numeric | NOT NULL | `0` |
| 11 | `traditional_cost_usd` | numeric | NOT NULL | `0` |
| 12 | `ai_savings_usd` | numeric | NOT NULL | `0` |
| 13 | `monthly_tier_savings` | numeric | NOT NULL | `0` |
| 14 | `full_payload` | jsonb | NOT NULL |  |
| 15 | `capture_source` | text | NOT NULL | `'auto'::text` |
| 16 | `note` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| build_progress_snapshots_capture_source_check | check | `CHECK ((capture_source = ANY (ARRAY['auto'::text, 'manual'::text, 'baseline'::text, 'milestone'::text])))` |
| build_progress_snapshots_captured_date_capture_source_key | unique | `UNIQUE (captured_date, capture_source)` |
| build_progress_snapshots_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| build_progress_snapshots_captured_date_capture_source_key | `UNIQUE btree (captured_date, capture_source)` |
| build_progress_snapshots_pkey | `UNIQUE btree (id)` |
| idx_bps_captured_at | `btree (captured_at DESC)` |
| idx_bps_captured_date | `btree (captured_date DESC)` |

## capability_groups

Element `TE-DB-capability_groups` · declared at `server/db.js:1674` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('capability_groups_id_seq'::regclass)` |
| 2 | `slug` | text | NOT NULL |  |
| 3 | `name` | text | NOT NULL |  |
| 4 | `description` | text | yes |  |
| 5 | `color` | text | yes |  |
| 6 | `sort_order` | integer | NOT NULL | `0` |
| 7 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 8 | `tech_stack` | text | yes |  |
| 9 | `l2r_stages` | text | yes |  |
| 10 | `business_function` | text | yes |  |
| 11 | `maturity_level` | text | yes | `'building'::text` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| capability_groups_pkey | primary key | `PRIMARY KEY (id)` |
| capability_groups_slug_key | unique | `UNIQUE (slug)` |

**Indexes**

| Name | Definition |
|---|---|
| capability_groups_pkey | `UNIQUE btree (id)` |
| capability_groups_slug_key | `UNIQUE btree (slug)` |

## checkpoint_presence

Element `TE-DB-checkpoint_presence` · declared at `server/db.js:907` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('checkpoint_presence_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `checkpoint_stage` | text | NOT NULL |  |
| 4 | `user_id` | bigint | NOT NULL |  |
| 5 | `selected_molecule_key` | text | yes |  |
| 6 | `active_agent_id` | text | yes |  |
| 7 | `action_state` | text | NOT NULL | `'viewing'::text` |
| 8 | `visibility_scope` | text | NOT NULL | `'ORGANIZATION_SHARED'::text` |
| 9 | `last_seen_at` | bigint | NOT NULL |  |
| 10 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| checkpoint_presence_pkey | primary key | `PRIMARY KEY (id)` |
| checkpoint_presence_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| checkpoint_presence_rod_id_user_id_key | unique | `UNIQUE (rod_id, user_id)` |
| checkpoint_presence_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| checkpoint_presence_pkey | `UNIQUE btree (id)` |
| checkpoint_presence_rod_id_user_id_key | `UNIQUE btree (rod_id, user_id)` |
| idx_checkpoint_presence_rod | `btree (rod_id, last_seen_at)` |

## client_basin_templates

Element `TE-DB-client_basin_templates` · declared at `server/db.js:1415` · RLS not enabled · rows after empty-DB bootstrap: 3

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('client_basin_templates_id_seq'::regclass)` |
| 2 | `template_key` | text | NOT NULL |  |
| 3 | `label` | text | NOT NULL |  |
| 4 | `market_type` | text | NOT NULL |  |
| 5 | `entity_type` | text | NOT NULL |  |
| 6 | `opportunity_term` | text | NOT NULL |  |
| 7 | `process_flow` | jsonb | NOT NULL | `'[]'::jsonb` |
| 8 | `entity_model` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `semantic_mappings` | jsonb | NOT NULL | `'{}'::jsonb` |
| 10 | `is_active` | boolean | NOT NULL | `true` |
| 11 | `created_at` | bigint | NOT NULL |  |
| 12 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| client_basin_templates_opportunity_term_check | check | `CHECK ((opportunity_term = ANY (ARRAY['deal'::text, 'opportunity'::text])))` |
| client_basin_templates_pkey | primary key | `PRIMARY KEY (id)` |
| client_basin_templates_template_key_key | unique | `UNIQUE (template_key)` |

**Indexes**

| Name | Definition |
|---|---|
| client_basin_templates_pkey | `UNIQUE btree (id)` |
| client_basin_templates_template_key_key | `UNIQUE btree (template_key)` |

## commerce_offerings

Element `TE-DB-commerce_offerings` · declared at `server/db.js:2875` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `name` | text | NOT NULL |  |
| 3 | `price_cents` | integer | NOT NULL | `0` |
| 4 | `currency` | text | NOT NULL | `'usd'::text` |
| 5 | `billing_interval` | text | NOT NULL | `'trial'::text` |
| 6 | `trial_days` | integer | yes |  |
| 7 | `storage_limit_bytes` | bigint | yes |  |
| 8 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 9 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| commerce_offerings_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| commerce_offerings_pkey | `UNIQUE btree (id)` |

## commerce_payments

Element `TE-DB-commerce_payments` · declared at `server/db.js:4351` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('commerce_payments_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `deliverable_id` | text | yes |  |
| 4 | `license_id` | bigint | yes |  |
| 5 | `purchase_kind` | text | NOT NULL |  |
| 6 | `stripe_session_id` | text | yes |  |
| 7 | `amount_cents` | integer | NOT NULL |  |
| 8 | `status` | text | NOT NULL | `'pending'::text` |
| 9 | `stub` | boolean | NOT NULL | `false` |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| commerce_payments_deliverable_id_fkey | foreign key | `FOREIGN KEY (deliverable_id) REFERENCES deliverable_packages(id) ON DELETE SET NULL` |
| commerce_payments_license_id_fkey | foreign key | `FOREIGN KEY (license_id) REFERENCES product_licenses(id) ON DELETE SET NULL` |
| commerce_payments_pkey | primary key | `PRIMARY KEY (id)` |
| commerce_payments_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| commerce_payments_pkey | `UNIQUE btree (id)` |
| idx_commerce_payments_session | `btree (stripe_session_id)` |
| idx_commerce_payments_user | `btree (user_id)` |

## config_state

Element `TE-DB-config_state` · declared at `server/db.js:242` · RLS not enabled · rows after empty-DB bootstrap: 4

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `data` | text | NOT NULL |  |
| 3 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| config_state_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| config_state_pkey | `UNIQUE btree (id)` |

## consent_actions

Element `TE-DB-consent_actions` · declared at `server/db.js:1630` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('consent_actions_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `consent_type` | text | NOT NULL |  |
| 4 | `action` | text | NOT NULL |  |
| 5 | `consent_version` | text | NOT NULL |  |
| 6 | `context` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `ip` | text | yes |  |
| 8 | `user_agent` | text | yes |  |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| consent_actions_pkey | primary key | `PRIMARY KEY (id)` |
| consent_actions_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| consent_actions_pkey | `UNIQUE btree (id)` |
| idx_consent_actions_user | `btree (user_id, consent_type, created_at DESC)` |

## contribution_events

Element `TE-DB-contribution_events` · declared at `server/db.js:3513` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `row_id` | bigint | NOT NULL | `nextval('contribution_events_row_id_seq'::regclass)` |
| 2 | `contribution_event_id` | text | NOT NULL |  |
| 3 | `attribution_version` | integer | NOT NULL | `1` |
| 4 | `classification_status` | text | NOT NULL | `'provisional'::text` |
| 5 | `raw_event_ids` | jsonb | yes |  |
| 6 | `source_platform` | text | yes |  |
| 7 | `source_session_id` | text | yes |  |
| 8 | `organization_id` | text | yes |  |
| 9 | `workspace_id` | text | yes |  |
| 10 | `channel_id` | text | yes |  |
| 11 | `project_id` | text | yes |  |
| 12 | `initiative_id` | text | yes |  |
| 13 | `workstream_id` | text | yes |  |
| 14 | `outcome_id` | text | yes |  |
| 15 | `artifact_id` | text | yes |  |
| 16 | `artifact_version_id` | text | yes |  |
| 17 | `contributor_type` | text | NOT NULL |  |
| 18 | `contributor_id` | text | yes |  |
| 19 | `contributor_role` | text | yes |  |
| 20 | `agent_id` | text | yes |  |
| 21 | `model_id` | text | yes |  |
| 22 | `model_version` | text | yes |  |
| 23 | `parent_contribution_event_id` | text | yes |  |
| 24 | `causal_predecessor_ids` | jsonb | yes |  |
| 25 | `causal_successor_ids` | jsonb | yes |  |
| 26 | `effective_timestamp` | bigint | yes |  |
| 27 | `start_timestamp` | bigint | yes |  |
| 28 | `end_timestamp` | bigint | yes |  |
| 29 | `estimated_active_duration_min` | numeric | yes |  |
| 30 | `estimated_wait_duration_min` | numeric | yes |  |
| 31 | `contribution_class` | text | yes |  |
| 32 | `contribution_subclass` | text | yes |  |
| 33 | `action_type` | text | yes |  |
| 34 | `reasoning_type` | text | yes |  |
| 35 | `decision_type` | text | yes |  |
| 36 | `transformation_type` | text | yes |  |
| 37 | `evidence_type` | text | yes |  |
| 38 | `validation_type` | text | yes |  |
| 39 | `confidence` | numeric | yes |  |
| 40 | `scores` | jsonb | yes |  |
| 41 | `raw_input_reference` | text | yes |  |
| 42 | `raw_output_reference` | text | yes |  |
| 43 | `normalized_semantic_summary` | text | yes |  |
| 44 | `evidence_references` | jsonb | yes |  |
| 45 | `assumptions` | jsonb | yes |  |
| 46 | `classification_method` | text | yes |  |
| 47 | `classification_version` | text | yes |  |
| 48 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 49 | `created_by` | text | yes |  |
| 50 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 51 | `updated_by` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| contribution_events_pkey | primary key | `PRIMARY KEY (row_id)` |

**Indexes**

| Name | Definition |
|---|---|
| contribution_events_pkey | `UNIQUE btree (row_id)` |
| idx_contrib_events_contributor | `btree (contributor_type, contributor_id)` |
| idx_contrib_events_current | `btree (contribution_event_id) WHERE (classification_status <> 'superseded'::text)` |
| idx_contrib_events_logical | `btree (contribution_event_id, attribution_version DESC)` |
| idx_contrib_events_outcome | `btree (outcome_id) WHERE (outcome_id IS NOT NULL)` |
| idx_contrib_events_raw_ids | `gin (raw_event_ids)` |
| idx_contrib_events_session | `btree (source_session_id) WHERE (source_session_id IS NOT NULL)` |

## customer_agent_memory

Element `TE-DB-customer_agent_memory` · declared at `server/db.js:1489` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('customer_agent_memory_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `module_scope` | text | NOT NULL |  |
| 4 | `memory_key` | text | NOT NULL |  |
| 5 | `classification` | text | NOT NULL |  |
| 6 | `org_id` | bigint | yes |  |
| 7 | `value` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `source_type` | text | NOT NULL |  |
| 9 | `source_id` | text | yes |  |
| 10 | `refreshed_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| customer_agent_memory_classification_check | check | `CHECK ((classification = ANY (ARRAY['private'::text, 'organization'::text, 'public'::text])))` |
| customer_agent_memory_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| customer_agent_memory_pkey | primary key | `PRIMARY KEY (id)` |
| customer_agent_memory_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| customer_agent_memory_user_id_module_scope_memory_key_org_i_key | unique | `UNIQUE (user_id, module_scope, memory_key, org_id)` |

**Indexes**

| Name | Definition |
|---|---|
| customer_agent_memory_pkey | `UNIQUE btree (id)` |
| customer_agent_memory_user_id_module_scope_memory_key_org_i_key | `UNIQUE btree (user_id, module_scope, memory_key, org_id)` |
| idx_customer_agent_memory_scope | `btree (user_id, module_scope, classification, refreshed_at DESC)` |

## deliverable_packages

Element `TE-DB-deliverable_packages` · declared at `server/db.js:4322` · RLS not enabled · rows after empty-DB bootstrap: 2

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `product_id` | text | NOT NULL |  |
| 3 | `title` | text | NOT NULL |  |
| 4 | `description` | text | yes |  |
| 5 | `html_storage_key` | text | yes |  |
| 6 | `version` | text | NOT NULL | `'1'::text` |
| 7 | `smb_eligible` | boolean | NOT NULL | `true` |
| 8 | `view_price_cents` | integer | yes |  |
| 9 | `view_period_days` | integer | NOT NULL | `30` |
| 10 | `flat_fee_price_cents` | integer | yes |  |
| 11 | `annual_price_cents` | integer | yes |  |
| 12 | `is_active` | boolean | NOT NULL | `true` |
| 13 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 14 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| deliverable_packages_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| deliverable_packages_pkey | `UNIQUE btree (id)` |
| idx_deliverable_packages_product | `btree (product_id)` |

## detail_pages

Element `TE-DB-detail_pages` · declared at `server/db.js:248` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `state` | text | NOT NULL |  |
| 3 | `data` | text | NOT NULL |  |
| 4 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| detail_pages_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| detail_pages_pkey | `UNIQUE btree (id)` |

## divergence_states

Element `TE-DB-divergence_states` · declared at `server/db.js:863` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('divergence_states_id_seq'::regclass)` |
| 2 | `rod_id_a` | bigint | NOT NULL |  |
| 3 | `rod_id_b` | bigint | NOT NULL |  |
| 4 | `axial_divergence` | numeric | NOT NULL | `0` |
| 5 | `density_divergence` | numeric | NOT NULL | `0` |
| 6 | `divergence_rate` | numeric | NOT NULL | `0` |
| 7 | `divergence_acceleration` | numeric | NOT NULL | `0` |
| 8 | `boundary_exceeded` | boolean | NOT NULL | `false` |
| 9 | `computed_at` | bigint | NOT NULL |  |
| 10 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| divergence_states_pkey | primary key | `PRIMARY KEY (id)` |
| divergence_states_rod_id_a_fkey | foreign key | `FOREIGN KEY (rod_id_a) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| divergence_states_rod_id_b_fkey | foreign key | `FOREIGN KEY (rod_id_b) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| divergence_states_pkey | `UNIQUE btree (id)` |
| idx_divergence_pair | `btree (rod_id_a, rod_id_b)` |

## economic_composition_requirements

Element `TE-DB-economic_composition_requirements` · declared at `server/db.js:838` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('economic_composition_requirements_id_seq'::regclass)` |
| 2 | `topology_id` | bigint | NOT NULL |  |
| 3 | `required_composition_type` | text | NOT NULL |  |
| 4 | `required_state` | jsonb | NOT NULL | `'{}'::jsonb` |
| 5 | `necessity_type` | text | NOT NULL | `'required'::text` |
| 6 | `created_at` | bigint | NOT NULL |  |
| 7 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| economic_composition_requirements_pkey | primary key | `PRIMARY KEY (id)` |
| economic_composition_requirements_topology_id_fkey | foreign key | `FOREIGN KEY (topology_id) REFERENCES accounting_topology_definitions(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| economic_composition_requirements_pkey | `UNIQUE btree (id)` |

## email_delivery_preferences

Element `TE-DB-email_delivery_preferences` · declared at `server/db.js:1589` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `user_id` | bigint | NOT NULL |  |
| 2 | `automatic_enabled` | boolean | NOT NULL | `false` |
| 3 | `recipient_attribute` | text | NOT NULL | `'primary_email'::text` |
| 4 | `confirmed_at` | bigint | yes |  |
| 5 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| email_delivery_preferences_pkey | primary key | `PRIMARY KEY (user_id)` |
| email_delivery_preferences_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| email_delivery_preferences_pkey | `UNIQUE btree (user_id)` |

## entities

Element `TE-DB-entities` · declared at `server/db.js:4984` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('entities_id_seq'::regclass)` |
| 2 | `org_id` | bigint | yes |  |
| 3 | `owner_user_id` | bigint | yes |  |
| 4 | `canonical_name` | text | NOT NULL |  |
| 5 | `aliases` | jsonb | NOT NULL | `'[]'::jsonb` |
| 6 | `entity_type` | text | NOT NULL | `'company'::text` |
| 7 | `ownership_summary` | text | yes |  |
| 8 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `merged_into_id` | bigint | yes |  |
| 10 | `merged_from_ids` | jsonb | NOT NULL | `'[]'::jsonb` |
| 11 | `created_at` | bigint | NOT NULL |  |
| 12 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| entities_merged_into_id_fkey | foreign key | `FOREIGN KEY (merged_into_id) REFERENCES entities(id) ON DELETE SET NULL` |
| entities_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| entities_owner_user_id_fkey | foreign key | `FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE` |
| entities_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| entities_pkey | `UNIQUE btree (id)` |
| idx_entities_name | `btree (canonical_name)` |
| idx_entities_org | `btree (org_id)` |
| idx_entities_owner | `btree (owner_user_id)` |

## entitlement_renewals

Element `TE-DB-entitlement_renewals` · declared at `server/db.js:4340` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('entitlement_renewals_id_seq'::regclass)` |
| 2 | `license_id` | bigint | NOT NULL |  |
| 3 | `period_start` | bigint | NOT NULL |  |
| 4 | `period_end` | bigint | NOT NULL |  |
| 5 | `quarterly_updates_included` | integer | NOT NULL | `4` |
| 6 | `quarterly_updates_used` | integer | NOT NULL | `0` |
| 7 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| entitlement_renewals_license_id_fkey | foreign key | `FOREIGN KEY (license_id) REFERENCES product_licenses(id) ON DELETE CASCADE` |
| entitlement_renewals_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| entitlement_renewals_pkey | `UNIQUE btree (id)` |
| idx_entitlement_renewals_license | `btree (license_id)` |

## external_financial_connections

Element `TE-DB-external_financial_connections` · declared at `server/db.js:2125` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('external_financial_connections_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `provider_id` | text | NOT NULL |  |
| 4 | `provider_connection_ref` | text | yes |  |
| 5 | `connection_type` | text | NOT NULL |  |
| 6 | `consent_id` | bigint | NOT NULL |  |
| 7 | `status` | text | NOT NULL | `'pending'::text` |
| 8 | `permitted_account_classes` | jsonb | NOT NULL | `'[]'::jsonb` |
| 9 | `security_policy_id` | text | NOT NULL |  |
| 10 | `retention_policy_id` | text | NOT NULL |  |
| 11 | `data_scope` | text | NOT NULL | `'MEMBER_PRIVATE'::text` |
| 12 | `last_successful_refresh_at` | bigint | yes |  |
| 13 | `next_refresh_at` | bigint | yes |  |
| 14 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 15 | `created_at` | bigint | NOT NULL |  |
| 16 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| external_financial_connections_consent_id_fkey | foreign key | `FOREIGN KEY (consent_id) REFERENCES financial_consents(id)` |
| external_financial_connections_data_scope_check | check | `CHECK ((data_scope = 'MEMBER_PRIVATE'::text))` |
| external_financial_connections_pkey | primary key | `PRIMARY KEY (id)` |
| external_financial_connections_status_check | check | `CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'attention_required'::text, 'revoked'::text, 'expired'::text])))` |
| external_financial_connections_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| external_financial_connections_pkey | `UNIQUE btree (id)` |
| idx_financial_connections_user | `btree (user_id)` |

## feedback_advisors

Element `TE-DB-feedback_advisors` · declared at `server/db.js:4403` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `user_id` | bigint | NOT NULL |  |
| 2 | `is_active` | boolean | NOT NULL | `true` |
| 3 | `note` | text | yes |  |
| 4 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| feedback_advisors_pkey | primary key | `PRIMARY KEY (user_id)` |
| feedback_advisors_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| feedback_advisors_pkey | `UNIQUE btree (user_id)` |

## feedback_category_weights

Element `TE-DB-feedback_category_weights` · declared at `server/db.js:4410` · RLS not enabled · rows after empty-DB bootstrap: 4

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `category` | text | NOT NULL |  |
| 2 | `weight` | numeric | NOT NULL | `1` |
| 3 | `updated_by` | bigint | yes |  |
| 4 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| feedback_category_weights_pkey | primary key | `PRIMARY KEY (category)` |
| feedback_category_weights_updated_by_fkey | foreign key | `FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| feedback_category_weights_pkey | `UNIQUE btree (category)` |

## field_audit_log

Element `TE-DB-field_audit_log` · declared at `server/db.js:2534` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('field_audit_log_id_seq'::regclass)` |
| 2 | `user_id` | bigint | yes |  |
| 3 | `section_id` | text | NOT NULL |  |
| 4 | `field_key` | text | NOT NULL |  |
| 5 | `before_value` | text | yes |  |
| 6 | `after_value` | text | yes |  |
| 7 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| field_audit_log_pkey | primary key | `PRIMARY KEY (id)` |
| field_audit_log_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| field_audit_log_pkey | `UNIQUE btree (id)` |
| idx_field_audit_section | `btree (section_id)` |
| idx_field_audit_user | `btree (user_id)` |

## field_lineage

Element `TE-DB-field_lineage` · declared at `server/db.js:3083` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `entity_type` | text | NOT NULL |  |
| 3 | `entity_id` | text | NOT NULL |  |
| 4 | `field_path` | text | NOT NULL |  |
| 5 | `value` | text | yes |  |
| 6 | `prev_value` | text | yes |  |
| 7 | `source_type` | text | NOT NULL | `'manual'::text` |
| 8 | `source_ref` | text | yes |  |
| 9 | `author_id` | bigint | yes |  |
| 10 | `author_email` | text | yes |  |
| 11 | `captured_at` | bigint | NOT NULL |  |
| 12 | `context_hash` | text | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| field_lineage_author_id_fkey | foreign key | `FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL` |
| field_lineage_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| field_lineage_pkey | `UNIQUE btree (id)` |
| idx_fl_author | `btree (author_id, captured_at DESC)` |
| idx_fl_captured | `btree (captured_at DESC)` |
| idx_fl_entity | `btree (entity_type, entity_id, captured_at DESC)` |
| idx_fl_field | `btree (entity_type, entity_id, field_path, captured_at DESC)` |

## finbridgeco_configs

Element `TE-DB-finbridgeco_configs` · declared at `server/db.js:2821` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `config_key` | text | NOT NULL |  |
| 3 | `config_value` | jsonb | NOT NULL | `'{}'::jsonb` |
| 4 | `description` | text | yes |  |
| 5 | `updated_by` | bigint | yes |  |
| 6 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| finbridgeco_configs_pkey | primary key | `PRIMARY KEY (id)` |
| finbridgeco_configs_updated_by_fkey | foreign key | `FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| finbridgeco_configs_pkey | `UNIQUE btree (id)` |

## genesis_configurations

Element `TE-DB-genesis_configurations` · declared at `server/db.js:5597` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('genesis_configurations_id_seq'::regclass)` |
| 2 | `namespace` | text | NOT NULL |  |
| 3 | `version` | text | NOT NULL |  |
| 4 | `status` | text | NOT NULL | `'proposed'::text` |
| 5 | `data` | jsonb | NOT NULL | `'{}'::jsonb` |
| 6 | `effective_from` | bigint | yes |  |
| 7 | `effective_to` | bigint | yes |  |
| 8 | `created_by` | bigint | yes |  |
| 9 | `created_at` | bigint | NOT NULL |  |
| 10 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| genesis_configurations_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| genesis_configurations_namespace_version_key | unique | `UNIQUE (namespace, version)` |
| genesis_configurations_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| genesis_configurations_namespace_version_key | `UNIQUE btree (namespace, version)` |
| genesis_configurations_pkey | `UNIQUE btree (id)` |
| idx_genesis_config_namespace_status | `btree (namespace, status, updated_at DESC)` |

## genesis_object_overlaps

Element `TE-DB-genesis_object_overlaps` · declared at `server/db.js:5613` · RLS not enabled · rows after empty-DB bootstrap: 34

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `overlap_id` | text | NOT NULL |  |
| 2 | `domain` | text | NOT NULL |  |
| 3 | `source_kind` | text | NOT NULL |  |
| 4 | `source_key` | text | NOT NULL |  |
| 5 | `source_path` | text | yes |  |
| 6 | `canonical_repository` | text | NOT NULL |  |
| 7 | `canonical_type` | text | NOT NULL |  |
| 8 | `canonical_id` | text | NOT NULL |  |
| 9 | `mapping_relation` | text | NOT NULL |  |
| 10 | `overlap_status` | text | NOT NULL |  |
| 11 | `confidence` | numeric | NOT NULL |  |
| 12 | `rationale` | text | NOT NULL |  |
| 13 | `migration_action` | text | NOT NULL |  |
| 14 | `config_namespace` | text | yes |  |
| 15 | `review_status` | text | NOT NULL | `'proposed'::text` |
| 16 | `reviewed_by` | bigint | yes |  |
| 17 | `reviewed_at` | bigint | yes |  |
| 18 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 19 | `created_at` | bigint | NOT NULL |  |
| 20 | `updated_at` | bigint | NOT NULL |  |
| 21 | `resolution_kind` | text | yes |  |
| 22 | `resolution_proposal` | jsonb | NOT NULL | `'{}'::jsonb` |
| 23 | `resolution_status` | text | NOT NULL | `'not_started'::text` |
| 24 | `resolution_note` | text | yes |  |
| 25 | `decided_by` | bigint | yes |  |
| 26 | `decided_at` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| genesis_object_overlaps_decided_by_fkey | foreign key | `FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL` |
| genesis_object_overlaps_pkey | primary key | `PRIMARY KEY (overlap_id)` |
| genesis_object_overlaps_reviewed_by_fkey | foreign key | `FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL` |
| genesis_object_overlaps_source_kind_source_key_canonical_re_key | unique | `UNIQUE (source_kind, source_key, canonical_repository, canonical_id)` |

**Indexes**

| Name | Definition |
|---|---|
| genesis_object_overlaps_pkey | `UNIQUE btree (overlap_id)` |
| genesis_object_overlaps_source_kind_source_key_canonical_re_key | `UNIQUE btree (source_kind, source_key, canonical_repository, canonical_id)` |
| idx_genesis_overlap_canonical | `btree (canonical_repository, canonical_type, canonical_id)` |
| idx_genesis_overlap_domain_status | `btree (domain, overlap_status, review_status)` |

## gl_accounts

Element `TE-DB-gl_accounts` · declared at `server/db.js:765` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('gl_accounts_id_seq'::regclass)` |
| 2 | `account_key` | text | NOT NULL |  |
| 3 | `org_id` | bigint | yes |  |
| 4 | `native_account_id` | text | yes |  |
| 5 | `legal_entity` | text | yes |  |
| 6 | `account_type` | text | NOT NULL | `'asset'::text` |
| 7 | `normal_balance` | text | NOT NULL | `'debit'::text` |
| 8 | `semantic_definition` | text | yes |  |
| 9 | `permitted_event_classes` | jsonb | NOT NULL | `'[]'::jsonb` |
| 10 | `is_active` | boolean | NOT NULL | `true` |
| 11 | `created_at` | bigint | NOT NULL |  |
| 12 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| gl_accounts_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| gl_accounts_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| gl_accounts_pkey | `UNIQUE btree (id)` |
| idx_gl_account_global | `UNIQUE btree (account_key) WHERE (org_id IS NULL)` |
| idx_gl_account_org | `UNIQUE btree (account_key, org_id) WHERE (org_id IS NOT NULL)` |

## global_standards

Element `TE-DB-global_standards` · declared at `server/db.js:2569` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `type` | text | NOT NULL |  |
| 3 | `slug` | text | NOT NULL |  |
| 4 | `display_name` | text | NOT NULL |  |
| 5 | `short_label` | text | yes |  |
| 6 | `description` | text | yes |  |
| 7 | `parent_id` | text | yes |  |
| 8 | `status` | text | NOT NULL | `'active'::text` |
| 9 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| global_standards_parent_id_fkey | foreign key | `FOREIGN KEY (parent_id) REFERENCES global_standards(id)` |
| global_standards_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| global_standards_pkey | `UNIQUE btree (id)` |
| idx_gs_parent | `btree (parent_id) WHERE (parent_id IS NOT NULL)` |
| idx_gs_slug | `btree (slug)` |
| idx_gs_type | `btree (type, status)` |

## historical_observations

Element `TE-DB-historical_observations` · declared at `server/db.js:885` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('historical_observations_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `observation_type` | text | NOT NULL | `'legacy_maturity_score'::text` |
| 4 | `observed_value` | numeric | yes |  |
| 5 | `observed_at` | bigint | NOT NULL |  |
| 6 | `source_term` | text | NOT NULL | `'stage_score'::text` |
| 7 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| historical_observations_pkey | primary key | `PRIMARY KEY (id)` |
| historical_observations_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| historical_observations_rod_id_observation_type_observed_at_key | unique | `UNIQUE (rod_id, observation_type, observed_at)` |

**Indexes**

| Name | Definition |
|---|---|
| historical_observations_pkey | `UNIQUE btree (id)` |
| historical_observations_rod_id_observation_type_observed_at_key | `UNIQUE btree (rod_id, observation_type, observed_at)` |
| idx_historical_observations_rod | `btree (rod_id)` |

## jira_config

Element `TE-DB-jira_config` · declared at `server/db.js:1804` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `base_url` | text | yes |  |
| 3 | `email` | text | yes |  |
| 4 | `api_token` | text | yes |  |
| 5 | `project_key` | text | yes |  |
| 6 | `field_map` | text | yes |  |
| 7 | `last_pull_at` | bigint | yes |  |
| 8 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| jira_config_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| jira_config_pkey | `UNIQUE btree (id)` |

## journal_entries

Element `TE-DB-journal_entries` · declared at `server/db.js:800` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journal_entries_id_seq'::regclass)` |
| 2 | `org_id` | bigint | yes |  |
| 3 | `rod_id` | bigint | yes |  |
| 4 | `native_journal_id` | text | yes |  |
| 5 | `legal_entity` | text | yes |  |
| 6 | `accounting_date` | bigint | yes |  |
| 7 | `posting_date` | bigint | yes |  |
| 8 | `effective_date` | bigint | yes |  |
| 9 | `currency` | text | NOT NULL | `'USD'::text` |
| 10 | `total_debit` | numeric | NOT NULL | `0` |
| 11 | `total_credit` | numeric | NOT NULL | `0` |
| 12 | `source_type` | text | NOT NULL | `'manual'::text` |
| 13 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 14 | `created_at` | bigint | NOT NULL |  |
| 15 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journal_entries_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| journal_entries_pkey | primary key | `PRIMARY KEY (id)` |
| journal_entries_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| idx_journal_entries_org | `btree (org_id)` |
| idx_journal_entries_rod | `btree (rod_id)` |
| journal_entries_pkey | `UNIQUE btree (id)` |

## journal_entry_lines

Element `TE-DB-journal_entry_lines` · declared at `server/db.js:820` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journal_entry_lines_id_seq'::regclass)` |
| 2 | `journal_entry_id` | bigint | NOT NULL |  |
| 3 | `line_sequence` | integer | NOT NULL | `0` |
| 4 | `gl_account_id` | bigint | yes |  |
| 5 | `debit_amount` | numeric | NOT NULL | `0` |
| 6 | `credit_amount` | numeric | NOT NULL | `0` |
| 7 | `dimensions` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `description` | text | yes |  |
| 9 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journal_entry_lines_gl_account_id_fkey | foreign key | `FOREIGN KEY (gl_account_id) REFERENCES gl_accounts(id) ON DELETE SET NULL` |
| journal_entry_lines_journal_entry_id_fkey | foreign key | `FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE` |
| journal_entry_lines_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_je_lines_entry | `btree (journal_entry_id)` |
| journal_entry_lines_pkey | `UNIQUE btree (id)` |

## landing_sessions

Element `TE-DB-landing_sessions` · declared at `server/db.js:255` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `token` | text | NOT NULL |  |
| 2 | `expires_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| landing_sessions_pkey | primary key | `PRIMARY KEY (token)` |

**Indexes**

| Name | Definition |
|---|---|
| landing_sessions_pkey | `UNIQUE btree (token)` |

## leads

Element `TE-DB-leads` · declared at `server/db.js:260` · RLS not enabled · rows after empty-DB bootstrap: 1

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('leads_id_seq'::regclass)` |
| 2 | `source` | text | NOT NULL |  |
| 3 | `email` | text | yes |  |
| 4 | `phone` | text | yes |  |
| 5 | `name` | text | yes |  |
| 6 | `message` | text | yes |  |
| 7 | `public_id` | text | yes |  |
| 8 | `access_token` | text | yes |  |
| 9 | `password_hash` | text | yes |  |
| 10 | `answers` | text | yes |  |
| 11 | `prior_notes` | text | yes |  |
| 12 | `merged_into_id` | bigint | yes |  |
| 13 | `merged_from_ids` | text | yes |  |
| 14 | `verified_email` | boolean | NOT NULL | `false` |
| 15 | `verified_phone` | boolean | NOT NULL | `false` |
| 16 | `converted_user_id` | bigint | yes |  |
| 17 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 18 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 19 | `actor_key` | text | yes |  |
| 20 | `provisional` | boolean | NOT NULL | `false` |
| 21 | `visit_count` | integer | NOT NULL | `0` |
| 22 | `last_visit_at` | bigint | yes |  |
| 23 | `originating_member_user_id` | bigint | yes |  |
| 24 | `lead_intent` | text | yes |  |
| 25 | `work_email_manual_validation` | boolean | NOT NULL | `false` |
| 26 | `agent_memory` | jsonb | NOT NULL | `'{}'::jsonb` |
| 27 | `stage_gate_metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 28 | `context_metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 29 | `confirmed_early_registrant` | boolean | NOT NULL | `false` |
| 30 | `contract_output_ready` | boolean | NOT NULL | `false` |
| 31 | `lead_type` | text | NOT NULL | `'network'::text` |
| 32 | `job_description` | text | yes |  |
| 33 | `job_url` | text | yes |  |
| 34 | `company` | text | yes |  |
| 35 | `hiring_manager` | text | yes |  |
| 36 | `job_status` | text | NOT NULL | `'new'::text` |
| 37 | `pledged_at` | bigint | yes |  |
| 38 | `agent_definition_id` | bigint | yes |  |
| 39 | `org_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| leads_agent_definition_id_fkey | foreign key | `FOREIGN KEY (agent_definition_id) REFERENCES agent_hub_definitions(id) ON DELETE SET NULL` |
| leads_merged_into_id_fkey | foreign key | `FOREIGN KEY (merged_into_id) REFERENCES leads(id) ON DELETE SET NULL` |
| leads_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE SET NULL` |
| leads_originating_member_user_id_fkey | foreign key | `FOREIGN KEY (originating_member_user_id) REFERENCES users(id) ON DELETE SET NULL` |
| leads_pkey | primary key | `PRIMARY KEY (id)` |
| leads_public_id_key | unique | `UNIQUE (public_id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_leads_active | `btree (id) WHERE (merged_into_id IS NULL)` |
| idx_leads_actor_key | `UNIQUE btree (actor_key) WHERE ((actor_key IS NOT NULL) AND (merged_into_id IS NULL))` |
| idx_leads_email | `btree (lower(email))` |
| idx_leads_phone | `btree (phone) WHERE (phone IS NOT NULL)` |
| leads_pkey | `UNIQUE btree (id)` |
| leads_public_id_key | `UNIQUE btree (public_id)` |

## network_requests

Element `TE-DB-network_requests` · declared at `server/db.js:3145` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('network_requests_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `request_type` | text | NOT NULL | `'resume-download'::text` |
| 4 | `reason` | text | yes |  |
| 5 | `org` | text | yes |  |
| 6 | `role_type` | text | yes |  |
| 7 | `question` | text | yes |  |
| 8 | `missing_info` | text | yes |  |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 10 | `converted_to_lead_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| network_requests_converted_to_lead_id_fkey | foreign key | `FOREIGN KEY (converted_to_lead_id) REFERENCES leads(id) ON DELETE SET NULL` |
| network_requests_pkey | primary key | `PRIMARY KEY (id)` |
| network_requests_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_nr_user | `btree (user_id, created_at DESC)` |
| network_requests_pkey | `UNIQUE btree (id)` |

## notifications

Element `TE-DB-notifications` · declared at `server/db.js:5719` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('notifications_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `source_type` | text | NOT NULL |  |
| 4 | `source_id` | bigint | yes |  |
| 5 | `title` | text | NOT NULL |  |
| 6 | `body` | text | yes |  |
| 7 | `severity` | text | NOT NULL | `'info'::text` |
| 8 | `action_url` | text | yes |  |
| 9 | `read_at` | bigint | yes |  |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| notifications_pkey | primary key | `PRIMARY KEY (id)` |
| notifications_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| notifications_pkey | `UNIQUE btree (id)` |

## oauth_connections

Element `TE-DB-oauth_connections` · declared at `server/db.js:2089` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('oauth_connections_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `profile_scope` | text | NOT NULL | `'personal'::text` |
| 4 | `profile_id` | bigint | NOT NULL |  |
| 5 | `provider` | text | NOT NULL |  |
| 6 | `external_id` | text | yes |  |
| 7 | `label` | text | yes |  |
| 8 | `access_token_enc` | text | NOT NULL |  |
| 9 | `refresh_token_enc` | text | yes |  |
| 10 | `token_expires_at` | bigint | yes |  |
| 11 | `scopes` | text | yes |  |
| 12 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 13 | `allow_write` | boolean | NOT NULL | `false` |
| 14 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 15 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| oauth_connections_pkey | primary key | `PRIMARY KEY (id)` |
| oauth_connections_profile_scope_profile_id_provider_key | unique | `UNIQUE (profile_scope, profile_id, provider)` |
| oauth_connections_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_oauth_profile | `btree (profile_scope, profile_id)` |
| idx_oauth_provider | `btree (provider)` |
| idx_oauth_user | `btree (user_id)` |
| oauth_connections_pkey | `UNIQUE btree (id)` |
| oauth_connections_profile_scope_profile_id_provider_key | `UNIQUE btree (profile_scope, profile_id, provider)` |

## offering_features

Element `TE-DB-offering_features` · declared at `server/db.js:2887` · RLS not enabled · rows after empty-DB bootstrap: 5

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `offering_id` | text | NOT NULL |  |
| 2 | `feature_key` | text | NOT NULL |  |
| 3 | `enabled` | boolean | NOT NULL | `true` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| offering_features_offering_id_fkey | foreign key | `FOREIGN KEY (offering_id) REFERENCES commerce_offerings(id) ON DELETE CASCADE` |
| offering_features_pkey | primary key | `PRIMARY KEY (offering_id, feature_key)` |

**Indexes**

| Name | Definition |
|---|---|
| offering_features_pkey | `UNIQUE btree (offering_id, feature_key)` |

## output_templates

Element `TE-DB-output_templates` · declared at `server/db.js:3023` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `user_id` | bigint | yes |  |
| 3 | `output_type` | text | NOT NULL |  |
| 4 | `name` | text | NOT NULL |  |
| 5 | `is_primary` | boolean | NOT NULL | `false` |
| 6 | `config` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 8 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| output_templates_pkey | primary key | `PRIMARY KEY (id)` |
| output_templates_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| idx_ot_primary | `UNIQUE btree (user_id, output_type) WHERE (is_primary = true)` |
| idx_ot_user_type | `btree (user_id, output_type)` |
| output_templates_pkey | `UNIQUE btree (id)` |

## page_events

Element `TE-DB-page_events` · declared at `server/db.js:1648` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('page_events_id_seq'::regclass)` |
| 2 | `member_slug` | text | yes |  |
| 3 | `page_slug` | text | yes |  |
| 4 | `referrer` | text | yes |  |
| 5 | `user_agent` | text | yes |  |
| 6 | `ip_hash` | text | yes |  |
| 7 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| page_events_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_page_events_created | `btree (created_at DESC)` |
| idx_page_events_member | `btree (member_slug, created_at DESC)` |
| page_events_pkey | `UNIQUE btree (id)` |

## password_reset_tokens

Element `TE-DB-password_reset_tokens` · declared at `server/db.js:2378` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `token` | text | NOT NULL |  |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `expires_at` | bigint | NOT NULL |  |
| 4 | `used_at` | bigint | yes |  |
| 5 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| password_reset_tokens_pkey | primary key | `PRIMARY KEY (token)` |
| password_reset_tokens_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_prt_active | `btree (expires_at) WHERE (used_at IS NULL)` |
| idx_prt_user | `btree (user_id)` |
| password_reset_tokens_pkey | `UNIQUE btree (token)` |

## pending_standards

Element `TE-DB-pending_standards` · declared at `server/db.js:2589` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `proposed_value` | text | NOT NULL |  |
| 3 | `standard_type` | text | NOT NULL |  |
| 4 | `app_id` | text | yes |  |
| 5 | `context_ref_id` | text | yes |  |
| 6 | `proposed_by_user_id` | bigint | yes |  |
| 7 | `status` | text | NOT NULL | `'pending'::text` |
| 8 | `review_notes` | text | yes |  |
| 9 | `published_output_id` | text | yes |  |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 11 | `reviewed_at` | bigint | yes |  |
| 12 | `reviewed_by_user_id` | bigint | yes |  |
| 13 | `base_standard_id` | text | yes |  |
| 14 | `proposed_name` | text | yes |  |
| 15 | `proposed_domain` | text | yes |  |
| 16 | `proposed_category` | text | yes |  |
| 17 | `proposed_definition` | text | yes |  |
| 18 | `rationale` | text | yes |  |
| 19 | `review_status` | text | NOT NULL | `'pending'::text` |
| 20 | `rejection_reason` | text | yes |  |
| 21 | `proposed_by` | bigint | yes |  |
| 22 | `reviewed_by` | bigint | yes |  |
| 23 | `updated_at` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| pending_standards_base_standard_id_fkey | foreign key | `FOREIGN KEY (base_standard_id) REFERENCES global_standards(id) ON DELETE SET NULL` |
| pending_standards_pkey | primary key | `PRIMARY KEY (id)` |
| pending_standards_proposed_by_fkey | foreign key | `FOREIGN KEY (proposed_by) REFERENCES users(id) ON DELETE SET NULL` |
| pending_standards_proposed_by_user_id_fkey | foreign key | `FOREIGN KEY (proposed_by_user_id) REFERENCES users(id) ON DELETE SET NULL` |
| pending_standards_reviewed_by_fkey | foreign key | `FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL` |
| pending_standards_reviewed_by_user_id_fkey | foreign key | `FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| idx_ps_app | `btree (app_id)` |
| idx_ps_status | `btree (status, created_at DESC)` |
| pending_standards_pkey | `UNIQUE btree (id)` |

## personal_org_links

Element `TE-DB-personal_org_links` · declared at `server/db.js:2051` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `personal_profile_id` | bigint | NOT NULL |  |
| 2 | `org_id` | bigint | NOT NULL |  |
| 3 | `linked_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| personal_org_links_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| personal_org_links_personal_profile_id_fkey | foreign key | `FOREIGN KEY (personal_profile_id) REFERENCES personal_profiles(id) ON DELETE CASCADE` |
| personal_org_links_pkey | primary key | `PRIMARY KEY (personal_profile_id, org_id)` |

**Indexes**

| Name | Definition |
|---|---|
| personal_org_links_pkey | `UNIQUE btree (personal_profile_id, org_id)` |

## personal_profiles

Element `TE-DB-personal_profiles` · declared at `server/db.js:1954` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('personal_profiles_id_seq'::regclass)` |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `display_name` | text | yes |  |
| 4 | `bio` | text | yes |  |
| 5 | `avatar_url` | text | yes |  |
| 6 | `location` | text | yes |  |
| 7 | `pronouns` | text | yes |  |
| 8 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 10 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| personal_profiles_pkey | primary key | `PRIMARY KEY (id)` |
| personal_profiles_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |
| personal_profiles_user_id_key | unique | `UNIQUE (user_id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_personal_profiles_user | `btree (user_id)` |
| personal_profiles_pkey | `UNIQUE btree (id)` |
| personal_profiles_user_id_key | `UNIQUE btree (user_id)` |

## persons

Element `TE-DB-persons` · declared at `server/db.js:5004` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('persons_id_seq'::regclass)` |
| 2 | `org_id` | bigint | yes |  |
| 3 | `owner_user_id` | bigint | yes |  |
| 4 | `entity_id` | bigint | yes |  |
| 5 | `full_name` | text | NOT NULL |  |
| 6 | `public_role` | text | yes |  |
| 7 | `confidence_label` | text | NOT NULL | `'unverified_lead'::text` |
| 8 | `source_type` | text | yes |  |
| 9 | `source_reference` | text | yes |  |
| 10 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 11 | `merged_into_id` | bigint | yes |  |
| 12 | `merged_from_ids` | jsonb | NOT NULL | `'[]'::jsonb` |
| 13 | `created_at` | bigint | NOT NULL |  |
| 14 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| persons_entity_id_fkey | foreign key | `FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL` |
| persons_merged_into_id_fkey | foreign key | `FOREIGN KEY (merged_into_id) REFERENCES persons(id) ON DELETE SET NULL` |
| persons_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| persons_owner_user_id_fkey | foreign key | `FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE` |
| persons_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_persons_entity | `btree (entity_id)` |
| idx_persons_org | `btree (org_id)` |
| persons_pkey | `UNIQUE btree (id)` |

## platform_applications

Element `TE-DB-platform_applications` · declared at `server/db.js:2553` · RLS not enabled · rows after empty-DB bootstrap: 13

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `display_name` | text | NOT NULL |  |
| 3 | `slug` | text | NOT NULL |  |
| 4 | `purpose` | text | yes |  |
| 5 | `brand_mode` | text | NOT NULL | `'strategic'::text` |
| 6 | `admin_only` | boolean | NOT NULL | `false` |
| 7 | `object_label_map` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `atomic_set_id` | text | yes |  |
| 9 | `status` | text | NOT NULL | `'active'::text` |
| 10 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| platform_applications_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| platform_applications_pkey | `UNIQUE btree (id)` |

## port_source_fields

Element `TE-DB-port_source_fields` · declared at `server/db.js:702` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('port_source_fields_id_seq'::regclass)` |
| 2 | `source_object_id` | bigint | NOT NULL |  |
| 3 | `field_key` | text | NOT NULL |  |
| 4 | `native_field_name` | text | NOT NULL |  |
| 5 | `business_definition` | text | yes |  |
| 6 | `value_domain` | text | yes |  |
| 7 | `editable_roles` | jsonb | NOT NULL | `'[]'::jsonb` |
| 8 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `created_at` | bigint | NOT NULL |  |
| 10 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| port_source_fields_pkey | primary key | `PRIMARY KEY (id)` |
| port_source_fields_source_object_id_field_key_key | unique | `UNIQUE (source_object_id, field_key)` |
| port_source_fields_source_object_id_fkey | foreign key | `FOREIGN KEY (source_object_id) REFERENCES port_source_objects(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| port_source_fields_pkey | `UNIQUE btree (id)` |
| port_source_fields_source_object_id_field_key_key | `UNIQUE btree (source_object_id, field_key)` |

## port_source_objects

Element `TE-DB-port_source_objects` · declared at `server/db.js:688` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('port_source_objects_id_seq'::regclass)` |
| 2 | `port_id` | bigint | NOT NULL |  |
| 3 | `object_key` | text | NOT NULL |  |
| 4 | `native_object_name` | text | NOT NULL |  |
| 5 | `business_definition` | text | yes |  |
| 6 | `natural_key_definition` | text | yes |  |
| 7 | `system_of_record_claim` | text | yes |  |
| 8 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `created_at` | bigint | NOT NULL |  |
| 10 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| port_source_objects_pkey | primary key | `PRIMARY KEY (id)` |
| port_source_objects_port_id_fkey | foreign key | `FOREIGN KEY (port_id) REFERENCES data_ports(id) ON DELETE CASCADE` |
| port_source_objects_port_id_object_key_key | unique | `UNIQUE (port_id, object_key)` |

**Indexes**

| Name | Definition |
|---|---|
| port_source_objects_pkey | `UNIQUE btree (id)` |
| port_source_objects_port_id_object_key_key | `UNIQUE btree (port_id, object_key)` |

## portfolio_requests

Element `TE-DB-portfolio_requests` · declared at `server/db.js:3933` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('portfolio_requests_id_seq'::regclass)` |
| 2 | `kind` | text | NOT NULL |  |
| 3 | `source_output` | text | yes |  |
| 4 | `knows_betsy` | boolean | yes |  |
| 5 | `knows_betsy_detail` | text | yes |  |
| 6 | `comparing_to_role` | boolean | yes |  |
| 7 | `job_description` | text | yes |  |
| 8 | `coverage` | jsonb | NOT NULL | `'[]'::jsonb` |
| 9 | `coverage_notes` | text | yes |  |
| 10 | `role_type` | text | yes |  |
| 11 | `career_stage` | text | yes |  |
| 12 | `goal` | text | yes |  |
| 13 | `showcase` | jsonb | NOT NULL | `'[]'::jsonb` |
| 14 | `recommended_portfolio` | text | yes |  |
| 15 | `contact_name` | text | yes |  |
| 16 | `contact_email` | text | NOT NULL |  |
| 17 | `contact_company` | text | yes |  |
| 18 | `contact_title` | text | yes |  |
| 19 | `contact_phone` | text | yes |  |
| 20 | `notes` | text | yes |  |
| 21 | `status` | text | NOT NULL | `'new'::text` |
| 22 | `created_at` | bigint | NOT NULL |  |
| 23 | `updated_at` | bigint | NOT NULL |  |
| 24 | `public_token` | text | yes |  |
| 25 | `top_questions` | text | yes |  |
| 26 | `lead_id` | bigint | yes |  |
| 27 | `agent_definition_id` | bigint | yes |  |
| 28 | `org_id` | bigint | yes |  |
| 29 | `member_user_id` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| portfolio_requests_agent_definition_id_fkey | foreign key | `FOREIGN KEY (agent_definition_id) REFERENCES agent_hub_definitions(id) ON DELETE SET NULL` |
| portfolio_requests_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL` |
| portfolio_requests_member_user_id_fkey | foreign key | `FOREIGN KEY (member_user_id) REFERENCES users(id) ON DELETE SET NULL` |
| portfolio_requests_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE SET NULL` |
| portfolio_requests_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_portfolio_requests_created | `btree (created_at)` |
| idx_portfolio_requests_token | `btree (public_token)` |
| portfolio_requests_pkey | `UNIQUE btree (id)` |

## rate_configs

Element `TE-DB-rate_configs` · declared at `server/db.js:3395` · RLS not enabled · rows after empty-DB bootstrap: 4

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `rate_type` | text | NOT NULL |  |
| 3 | `contributor` | text | yes |  |
| 4 | `rate_per_hour` | numeric | NOT NULL |  |
| 5 | `effective_year` | integer | NOT NULL | `2026` |
| 6 | `basis` | text | yes |  |
| 7 | `applies_to` | text | yes |  |
| 8 | `note` | text | yes |  |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| rate_configs_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| rate_configs_pkey | `UNIQUE btree (id)` |

## raw_events

Element `TE-DB-raw_events` · declared at `server/db.js:3481` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `source_platform` | text | NOT NULL |  |
| 3 | `source_session_id` | text | yes |  |
| 4 | `source_message_id` | text | yes |  |
| 5 | `source_event_id` | text | yes |  |
| 6 | `source_file` | text | yes |  |
| 7 | `source_line` | integer | yes |  |
| 8 | `source_timestamp` | bigint | yes |  |
| 9 | `ingested_timestamp` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 10 | `event_type` | text | yes |  |
| 11 | `payload_hash` | text | yes |  |
| 12 | `observable_evidence` | text | yes |  |
| 13 | `evidence_type` | text | yes |  |
| 14 | `raw_payload` | jsonb | yes |  |
| 15 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| raw_events_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_raw_events_platform | `btree (source_platform, source_timestamp)` |
| idx_raw_events_session | `btree (source_session_id) WHERE (source_session_id IS NOT NULL)` |
| raw_events_pkey | `UNIQUE btree (id)` |

## reciprocity_comparisons

Element `TE-DB-reciprocity_comparisons` · declared at `server/db.js:849` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('reciprocity_comparisons_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `journal_entry_id` | bigint | yes |  |
| 4 | `actual_coordinate` | numeric | yes |  |
| 5 | `inferred_coordinate` | numeric | yes |  |
| 6 | `axial_difference` | numeric | yes |  |
| 7 | `reciprocity_state` | text | NOT NULL | `'indeterminate'::text` |
| 8 | `computed_at` | bigint | NOT NULL |  |
| 9 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| reciprocity_comparisons_journal_entry_id_fkey | foreign key | `FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL` |
| reciprocity_comparisons_pkey | primary key | `PRIMARY KEY (id)` |
| reciprocity_comparisons_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_reciprocity_rod | `btree (rod_id)` |
| reciprocity_comparisons_pkey | `UNIQUE btree (id)` |

## relationships

Element `TE-DB-relationships` · declared at `server/db.js:5029` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('relationships_id_seq'::regclass)` |
| 2 | `org_id` | bigint | yes |  |
| 3 | `owner_user_id` | bigint | NOT NULL |  |
| 4 | `person_id` | bigint | yes |  |
| 5 | `entity_id` | bigint | yes |  |
| 6 | `route` | text | yes |  |
| 7 | `strength` | text | yes |  |
| 8 | `origin` | text | yes |  |
| 9 | `consent` | boolean | NOT NULL | `false` |
| 10 | `last_interaction_at` | bigint | yes |  |
| 11 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 12 | `created_at` | bigint | NOT NULL |  |
| 13 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| relationships_entity_id_fkey | foreign key | `FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE` |
| relationships_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| relationships_owner_user_id_fkey | foreign key | `FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE` |
| relationships_person_id_fkey | foreign key | `FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE` |
| relationships_pkey | primary key | `PRIMARY KEY (id)` |
| relationships_target_chk | check | `CHECK (((person_id IS NOT NULL) OR (entity_id IS NOT NULL)))` |

**Indexes**

| Name | Definition |
|---|---|
| idx_relationships_entity | `btree (entity_id)` |
| idx_relationships_owner | `btree (owner_user_id)` |
| idx_relationships_person | `btree (person_id)` |
| relationships_pkey | `UNIQUE btree (id)` |

## revenue_journey_contacts

Element `TE-DB-revenue_journey_contacts` · declared at `server/db.js:1442` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('revenue_journey_contacts_id_seq'::regclass)` |
| 2 | `journey_id` | bigint | NOT NULL |  |
| 3 | `user_id` | bigint | yes |  |
| 4 | `contact_order` | integer | NOT NULL | `1` |
| 5 | `opportunity_role` | text | NOT NULL |  |
| 6 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| revenue_journey_contacts_journey_id_fkey | foreign key | `FOREIGN KEY (journey_id) REFERENCES revenue_journeys(id) ON DELETE CASCADE` |
| revenue_journey_contacts_journey_id_user_id_key | unique | `UNIQUE (journey_id, user_id)` |
| revenue_journey_contacts_pkey | primary key | `PRIMARY KEY (id)` |
| revenue_journey_contacts_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| revenue_journey_contacts_journey_id_user_id_key | `UNIQUE btree (journey_id, user_id)` |
| revenue_journey_contacts_pkey | `UNIQUE btree (id)` |

## revenue_journeys

Element `TE-DB-revenue_journeys` · declared at `server/db.js:1429` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('revenue_journeys_id_seq'::regclass)` |
| 2 | `org_id` | bigint | yes |  |
| 3 | `template_id` | bigint | yes |  |
| 4 | `source_user_id` | bigint | yes |  |
| 5 | `source_lead_id` | bigint | yes |  |
| 6 | `name` | text | NOT NULL |  |
| 7 | `channel_type` | text | NOT NULL | `'Revenue'::text` |
| 8 | `current_stage` | text | NOT NULL | `'proposal'::text` |
| 9 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 10 | `created_at` | bigint | NOT NULL |  |
| 11 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| revenue_journeys_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE SET NULL` |
| revenue_journeys_pkey | primary key | `PRIMARY KEY (id)` |
| revenue_journeys_source_lead_id_fkey | foreign key | `FOREIGN KEY (source_lead_id) REFERENCES leads(id) ON DELETE SET NULL` |
| revenue_journeys_source_user_id_fkey | foreign key | `FOREIGN KEY (source_user_id) REFERENCES users(id) ON DELETE SET NULL` |
| revenue_journeys_template_id_fkey | foreign key | `FOREIGN KEY (template_id) REFERENCES client_basin_templates(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| revenue_journeys_pkey | `UNIQUE btree (id)` |

## services_proposal_access

Element `TE-DB-services_proposal_access` · declared at `server/db.js:2783` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `proposal_id` | text | NOT NULL |  |
| 3 | `user_id` | bigint | yes |  |
| 4 | `org_name` | text | yes |  |
| 5 | `request_context` | text | yes |  |
| 6 | `lead_id` | bigint | yes |  |
| 7 | `granted` | boolean | NOT NULL | `true` |
| 8 | `granted_at` | bigint | yes |  |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| services_proposal_access_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL` |
| services_proposal_access_pkey | primary key | `PRIMARY KEY (id)` |
| services_proposal_access_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| idx_spa_proposal | `btree (proposal_id)` |
| idx_spa_user | `btree (user_id) WHERE (user_id IS NOT NULL)` |
| services_proposal_access_pkey | `UNIQUE btree (id)` |

## sessions

Element `TE-DB-sessions` · declared at `server/db.js:229` · RLS not enabled · rows after empty-DB bootstrap: 2

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `token` | text | NOT NULL |  |
| 2 | `user_id` | bigint | NOT NULL |  |
| 3 | `expires_at` | bigint | NOT NULL |  |
| 4 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 5 | `jsonl_filename` | text | yes |  |
| 6 | `project_directory` | text | yes |  |
| 7 | `date_start` | bigint | yes |  |
| 8 | `date_end` | bigint | yes |  |
| 9 | `active_hours` | numeric | yes |  |
| 10 | `total_turns` | integer | yes |  |
| 11 | `user_turns` | integer | yes |  |
| 12 | `turn_density` | numeric | yes |  |
| 13 | `oversight_intensity` | text | yes |  |
| 14 | `versions_covered` | text | yes |  |
| 15 | `burst_count` | integer | yes |  |
| 16 | `notes` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| sessions_pkey | primary key | `PRIMARY KEY (token)` |
| sessions_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_sessions_filename | `btree (jsonl_filename)` |
| idx_sessions_user | `btree (user_id)` |
| sessions_pkey | `UNIQUE btree (token)` |

## site_state

Element `TE-DB-site_state` · declared at `server/db.js:236` · RLS not enabled · rows after empty-DB bootstrap: 2

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `data` | text | NOT NULL |  |
| 3 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| site_state_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| site_state_pkey | `UNIQUE btree (id)` |

## standard_overrides

Element `TE-DB-standard_overrides` · declared at `server/db.js:2609` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `standard_id` | text | yes |  |
| 3 | `override_value` | text | NOT NULL |  |
| 4 | `app_id` | text | yes |  |
| 5 | `context_ref_id` | text | yes |  |
| 6 | `user_id` | bigint | yes |  |
| 7 | `pending_standard_id` | text | yes |  |
| 8 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 9 | `escalated_to_governance` | boolean | NOT NULL | `false` |
| 10 | `override_note` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| standard_overrides_pending_standard_id_fkey | foreign key | `FOREIGN KEY (pending_standard_id) REFERENCES pending_standards(id)` |
| standard_overrides_pkey | primary key | `PRIMARY KEY (id)` |
| standard_overrides_standard_id_fkey | foreign key | `FOREIGN KEY (standard_id) REFERENCES global_standards(id)` |
| standard_overrides_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| standard_overrides_pkey | `UNIQUE btree (id)` |

## temp_attachments

Element `TE-DB-temp_attachments` · declared at `server/db.js:3971` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('temp_attachments_id_seq'::regclass)` |
| 2 | `request_id` | bigint | yes |  |
| 3 | `original_filename` | text | yes |  |
| 4 | `mime_type` | text | yes |  |
| 5 | `file_size` | bigint | yes |  |
| 6 | `storage_bucket` | text | yes |  |
| 7 | `storage_key` | text | yes |  |
| 8 | `expires_at` | bigint | NOT NULL |  |
| 9 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| temp_attachments_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_temp_attachments_exp | `btree (expires_at)` |
| temp_attachments_pkey | `UNIQUE btree (id)` |

## tier_workarounds

Element `TE-DB-tier_workarounds` · declared at `server/db.js:1776` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('tier_workarounds_id_seq'::regclass)` |
| 2 | `capability_id` | bigint | yes |  |
| 3 | `product` | text | NOT NULL |  |
| 4 | `tier_avoided` | text | yes |  |
| 5 | `monthly_savings` | numeric | yes |  |
| 6 | `problem` | text | NOT NULL |  |
| 7 | `solution` | text | NOT NULL |  |
| 8 | `sort_order` | integer | NOT NULL | `0` |
| 9 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| tier_workarounds_capability_id_fkey | foreign key | `FOREIGN KEY (capability_id) REFERENCES capability_groups(id) ON DELETE SET NULL` |
| tier_workarounds_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_tier_workarounds_capability | `btree (capability_id)` |
| tier_workarounds_pkey | `UNIQUE btree (id)` |

## unified_content_items

Element `TE-DB-unified_content_items` · declared at `server/db.js:2623` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `app_id` | text | NOT NULL |  |
| 3 | `type` | text | NOT NULL |  |
| 4 | `title` | text | NOT NULL |  |
| 5 | `topic` | text | yes |  |
| 6 | `summary` | text | yes |  |
| 7 | `body` | jsonb | yes |  |
| 8 | `domain_refs` | _text | yes |  |
| 9 | `capability_refs` | _text | yes |  |
| 10 | `audience_refs` | _text | yes |  |
| 11 | `system_refs` | _text | yes |  |
| 12 | `data_slice_refs` | _text | yes |  |
| 13 | `source_refs` | jsonb | yes |  |
| 14 | `export_status` | text | NOT NULL | `'draft'::text` |
| 15 | `export_status_updated_at` | bigint | yes |  |
| 16 | `series_ref` | text | yes |  |
| 17 | `output_refs` | _text | yes |  |
| 18 | `created_by` | bigint | yes |  |
| 19 | `updated_by` | bigint | yes |  |
| 20 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 21 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 22 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 23 | `parent_item_id` | text | yes |  |
| 24 | `approvals` | jsonb | NOT NULL | `'{}'::jsonb` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| unified_content_items_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| unified_content_items_pkey | primary key | `PRIMARY KEY (id)` |
| unified_content_items_updated_by_fkey | foreign key | `FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL` |

**Indexes**

| Name | Definition |
|---|---|
| idx_uci_app | `btree (app_id, export_status)` |
| idx_uci_series | `btree (series_ref) WHERE (series_ref IS NOT NULL)` |
| idx_uci_type | `btree (type)` |
| unified_content_items_pkey | `UNIQUE btree (id)` |

## unified_outputs

Element `TE-DB-unified_outputs` · declared at `server/db.js:2654` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `app_id` | text | NOT NULL |  |
| 3 | `template_ref` | text | yes |  |
| 4 | `title` | text | NOT NULL |  |
| 5 | `purpose` | text | yes |  |
| 6 | `source_item_ids` | _text | yes |  |
| 7 | `config` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `export_status` | text | NOT NULL | `'draft'::text` |
| 9 | `published_link` | text | yes |  |
| 10 | `published_at` | bigint | yes |  |
| 11 | `created_by` | bigint | yes |  |
| 12 | `updated_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 13 | `version_history` | jsonb | NOT NULL | `'[]'::jsonb` |
| 14 | `output_type` | text | yes |  |
| 15 | `template_config` | text | yes |  |
| 16 | `approvals` | jsonb | NOT NULL | `'{}'::jsonb` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| unified_outputs_created_by_fkey | foreign key | `FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL` |
| unified_outputs_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_uo_app | `btree (app_id, export_status)` |
| unified_outputs_pkey | `UNIQUE btree (id)` |

## users

Element `TE-DB-users` · declared at `server/db.js:221` · RLS not enabled · rows after empty-DB bootstrap: 2

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('users_id_seq'::regclass)` |
| 2 | `email` | text | NOT NULL |  |
| 3 | `password_hash` | text | NOT NULL |  |
| 4 | `role` | text | NOT NULL | `'admin'::text` |
| 5 | `created_at` | bigint | NOT NULL | `((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint` |
| 6 | `display_name` | text | yes |  |
| 7 | `career_terms_version` | text | yes |  |
| 8 | `career_terms_agreed_at` | bigint | yes |  |
| 9 | `must_change_password` | boolean | NOT NULL | `false` |
| 10 | `password_changed_at` | bigint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| users_email_key | unique | `UNIQUE (email)` |
| users_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| users_email_key | `UNIQUE btree (email)` |
| users_pkey | `UNIQUE btree (id)` |
