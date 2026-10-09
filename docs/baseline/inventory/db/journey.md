# Database — `journey` table group

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← DB index](../db-schema.md)

## journey_atom_affinity_rules

Element `TE-DB-journey_atom_affinity_rules` · declared at `server/db.js:653` · RLS not enabled · rows after empty-DB bootstrap: 1024

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_atom_affinity_rules_id_seq'::regclass)` |
| 2 | `cluster_key` | text | NOT NULL |  |
| 3 | `molecule_key` | text | NOT NULL |  |
| 4 | `org_id` | bigint | yes |  |
| 5 | `minimum_affinity` | numeric | NOT NULL | `0.5` |
| 6 | `source_authority_modifier` | numeric | NOT NULL | `0` |
| 7 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 8 | `is_active` | boolean | NOT NULL | `true` |
| 9 | `created_at` | bigint | NOT NULL |  |
| 10 | `updated_at` | bigint | NOT NULL |  |
| 11 | `scope_type` | text | NOT NULL | `'master_data'::text` |
| 12 | `current_key` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_atom_affinity_rules_cluster_key_fkey | foreign key | `FOREIGN KEY (cluster_key) REFERENCES journey_metadata_clusters(cluster_key) ON DELETE CASCADE` |
| journey_atom_affinity_rules_molecule_key_fkey | foreign key | `FOREIGN KEY (molecule_key) REFERENCES journey_metadata_molecules(molecule_key) ON DELETE CASCADE` |
| journey_atom_affinity_rules_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| journey_atom_affinity_rules_pkey | primary key | `PRIMARY KEY (id)` |
| journey_atom_affinity_rules_scope_type_check | check | `CHECK ((scope_type = ANY (ARRAY['master_data'::text, 'channel_current'::text])))` |

**Indexes**

| Name | Definition |
|---|---|
| idx_affinity_rule_global | `UNIQUE btree (cluster_key, molecule_key) WHERE (org_id IS NULL)` |
| idx_affinity_rule_org | `UNIQUE btree (cluster_key, molecule_key, org_id) WHERE (org_id IS NOT NULL)` |
| journey_atom_affinity_rules_pkey | `UNIQUE btree (id)` |

## journey_current_definitions

Element `TE-DB-journey_current_definitions` · declared at `server/db.js:4896` · RLS not enabled · rows after empty-DB bootstrap: 8

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_current_definitions_id_seq'::regclass)` |
| 2 | `current_key` | text | NOT NULL |  |
| 3 | `org_id` | bigint | yes |  |
| 4 | `label` | text | NOT NULL |  |
| 5 | `rod_type` | text | NOT NULL |  |
| 6 | `scope_type` | text | NOT NULL | `'channel_current'::text` |
| 7 | `primary_scenario_key` | text | yes |  |
| 8 | `port_stages` | jsonb | NOT NULL | `'[]'::jsonb` |
| 9 | `entry_criteria` | jsonb | NOT NULL | `'{}'::jsonb` |
| 10 | `minimum_carry` | jsonb | NOT NULL | `'[]'::jsonb` |
| 11 | `transition_rules` | jsonb | NOT NULL | `'[]'::jsonb` |
| 12 | `tributary_trigger_rules` | jsonb | NOT NULL | `'[]'::jsonb` |
| 13 | `is_active` | boolean | NOT NULL | `true` |
| 14 | `created_at` | bigint | NOT NULL |  |
| 15 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_current_definitions_org_id_fkey | foreign key | `FOREIGN KEY (org_id) REFERENCES organization_profiles(id) ON DELETE CASCADE` |
| journey_current_definitions_pkey | primary key | `PRIMARY KEY (id)` |
| journey_current_definitions_rod_type_fkey | foreign key | `FOREIGN KEY (rod_type) REFERENCES journey_rod_types(id)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_current_def_key_global | `UNIQUE btree (current_key) WHERE (org_id IS NULL)` |
| idx_current_def_key_org | `UNIQUE btree (current_key, org_id) WHERE (org_id IS NOT NULL)` |
| journey_current_definitions_pkey | `UNIQUE btree (id)` |

## journey_data_rods

Element `TE-DB-journey_data_rods` · declared at `server/db.js:411` · RLS not enabled · rows after empty-DB bootstrap: 5

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_data_rods_id_seq'::regclass)` |
| 2 | `rod_type` | text | NOT NULL |  |
| 3 | `lead_id` | bigint | yes |  |
| 4 | `user_id` | bigint | yes |  |
| 5 | `personal_profile_id` | bigint | yes |  |
| 6 | `org_id` | bigint | yes |  |
| 7 | `current_stage` | text | NOT NULL | `'first_interaction'::text` |
| 8 | `stage_score` | numeric | NOT NULL | `0` |
| 9 | `potential_revenue_cents` | bigint | NOT NULL | `0` |
| 10 | `actual_revenue_cents` | bigint | NOT NULL | `0` |
| 11 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 12 | `parent_rod_id` | bigint | yes |  |
| 13 | `rod_relationship_type` | text | yes |  |
| 14 | `module_key` | text | yes |  |
| 15 | `provisioning_origin` | text | yes |  |
| 16 | `onboarding_email_status` | text | NOT NULL | `'not_applicable'::text` |
| 17 | `first_login_at` | bigint | yes |  |
| 18 | `created_at` | bigint | NOT NULL |  |
| 19 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_data_rods_lead_id_fkey | foreign key | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE` |
| journey_data_rods_parent_rod_id_fkey | foreign key | `FOREIGN KEY (parent_rod_id) REFERENCES journey_data_rods(id) ON DELETE SET NULL` |
| journey_data_rods_pkey | primary key | `PRIMARY KEY (id)` |
| journey_data_rods_user_id_fkey | foreign key | `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rods_lead_type | `UNIQUE btree (lead_id, rod_type) WHERE ((lead_id IS NOT NULL) AND (user_id IS NULL) AND (org_id IS NULL))` |
| idx_rods_org | `btree (org_id, rod_type)` |
| idx_rods_parent | `btree (parent_rod_id)` |
| idx_rods_user_entitlement_module | `UNIQUE btree (user_id, module_key) WHERE ((user_id IS NOT NULL) AND (org_id IS NULL) AND (rod_type = 'member_entitlement'::text))` |
| idx_rods_user_org_type | `UNIQUE btree (user_id, org_id, rod_type) WHERE ((user_id IS NOT NULL) AND (org_id IS NOT NULL) AND (rod_type <> ALL (ARRAY['commercial_opportunity_target'::text, 'career_opportunit` |
| idx_rods_user_type | `UNIQUE btree (user_id, rod_type) WHERE ((user_id IS NOT NULL) AND (org_id IS NULL) AND (rod_type <> ALL (ARRAY['member_entitlement'::text, 'commercial_opportunity_target'::text, 'c` |
| journey_data_rods_pkey | `UNIQUE btree (id)` |

## journey_gate_definitions

Element `TE-DB-journey_gate_definitions` · declared at `server/db.js:496` · RLS not enabled · rows after empty-DB bootstrap: 681

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_gate_definitions_id_seq'::regclass)` |
| 2 | `scenario_id` | bigint | NOT NULL |  |
| 3 | `stage_key` | text | NOT NULL |  |
| 4 | `required_clusters` | jsonb | NOT NULL | `'[]'::jsonb` |
| 5 | `required_molecules` | jsonb | NOT NULL | `'[]'::jsonb` |
| 6 | `required_dimensions` | jsonb | NOT NULL | `'[]'::jsonb` |
| 7 | `required_actor_roles` | jsonb | NOT NULL | `'[]'::jsonb` |
| 8 | `dependency_rules` | jsonb | NOT NULL | `'[]'::jsonb` |
| 9 | `judgment_policy` | text | NOT NULL | `'when_ambiguous'::text` |
| 10 | `human_prompt` | text | yes |  |
| 11 | `sort_order` | integer | NOT NULL | `0` |
| 12 | `is_active` | boolean | NOT NULL | `true` |
| 13 | `created_at` | bigint | NOT NULL |  |
| 14 | `updated_at` | bigint | NOT NULL |  |
| 15 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 16 | `label` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_gate_definitions_pkey | primary key | `PRIMARY KEY (id)` |
| journey_gate_definitions_scenario_id_fkey | foreign key | `FOREIGN KEY (scenario_id) REFERENCES journey_scenarios(id) ON DELETE CASCADE` |
| journey_gate_definitions_scenario_id_stage_key_key | unique | `UNIQUE (scenario_id, stage_key)` |

**Indexes**

| Name | Definition |
|---|---|
| journey_gate_definitions_pkey | `UNIQUE btree (id)` |
| journey_gate_definitions_scenario_id_stage_key_key | `UNIQUE btree (scenario_id, stage_key)` |

## journey_metadata_clusters

Element `TE-DB-journey_metadata_clusters` · declared at `server/db.js:485` · RLS not enabled · rows after empty-DB bootstrap: 200

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_metadata_clusters_id_seq'::regclass)` |
| 2 | `cluster_key` | text | NOT NULL |  |
| 3 | `label` | text | NOT NULL |  |
| 4 | `description` | text | yes |  |
| 5 | `molecule_keys` | jsonb | NOT NULL | `'[]'::jsonb` |
| 6 | `completion_rule` | text | NOT NULL | `'all'::text` |
| 7 | `minimum_count` | integer | yes |  |
| 8 | `is_active` | boolean | NOT NULL | `true` |
| 9 | `created_at` | bigint | NOT NULL |  |
| 10 | `updated_at` | bigint | NOT NULL |  |
| 11 | `domain_key` | text | yes |  |
| 12 | `l2r_stage_ref` | text | yes |  |
| 13 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 14 | `alignment_rules` | jsonb | NOT NULL | `'[]'::jsonb` |
| 15 | `attraction_tags` | jsonb | NOT NULL | `'[]'::jsonb` |
| 16 | `min_attraction_overlap` | numeric | NOT NULL | `1` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_metadata_clusters_cluster_key_key | unique | `UNIQUE (cluster_key)` |
| journey_metadata_clusters_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| journey_metadata_clusters_cluster_key_key | `UNIQUE btree (cluster_key)` |
| journey_metadata_clusters_pkey | `UNIQUE btree (id)` |

## journey_metadata_molecules

Element `TE-DB-journey_metadata_molecules` · declared at `server/db.js:479` · RLS not enabled · rows after empty-DB bootstrap: 1516

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_metadata_molecules_id_seq'::regclass)` |
| 2 | `molecule_key` | text | NOT NULL |  |
| 3 | `label` | text | NOT NULL |  |
| 4 | `data_type` | text | NOT NULL | `'text'::text` |
| 5 | `source_paths` | jsonb | NOT NULL | `'[]'::jsonb` |
| 6 | `validation_config` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `is_sensitive` | boolean | NOT NULL | `false` |
| 8 | `is_active` | boolean | NOT NULL | `true` |
| 9 | `created_at` | bigint | NOT NULL |  |
| 10 | `updated_at` | bigint | NOT NULL |  |
| 11 | `canonical_definition` | text | yes |  |
| 12 | `value_domain` | text | yes |  |
| 13 | `mutability_class` | text | NOT NULL | `'revisable'::text` |
| 14 | `molecule_kind` | text | yes |  |
| 15 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_metadata_molecules_molecule_key_key | unique | `UNIQUE (molecule_key)` |
| journey_metadata_molecules_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| journey_metadata_molecules_molecule_key_key | `UNIQUE btree (molecule_key)` |
| journey_metadata_molecules_pkey | `UNIQUE btree (id)` |

## journey_rod_actors

Element `TE-DB-journey_rod_actors` · declared at `server/db.js:518` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_rod_actors_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `actor_key` | text | NOT NULL |  |
| 4 | `role_key` | text | NOT NULL |  |
| 5 | `contribution_status` | text | NOT NULL | `'invited'::text` |
| 6 | `contribution` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `required_from_stage` | text | yes |  |
| 8 | `added_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_actors_pkey | primary key | `PRIMARY KEY (id)` |
| journey_rod_actors_rod_id_actor_key_role_key_key | unique | `UNIQUE (rod_id, actor_key, role_key)` |
| journey_rod_actors_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| journey_rod_actors_pkey | `UNIQUE btree (id)` |
| journey_rod_actors_rod_id_actor_key_role_key_key | `UNIQUE btree (rod_id, actor_key, role_key)` |

## journey_rod_decisions

Element `TE-DB-journey_rod_decisions` · declared at `server/db.js:524` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_rod_decisions_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | yes |  |
| 3 | `decision_type` | text | NOT NULL |  |
| 4 | `proposed_action` | jsonb | NOT NULL | `'{}'::jsonb` |
| 5 | `human_prompt` | text | NOT NULL |  |
| 6 | `status` | text | NOT NULL | `'pending'::text` |
| 7 | `requested_at` | bigint | NOT NULL |  |
| 8 | `decided_at` | bigint | yes |  |
| 9 | `decided_by` | bigint | yes |  |
| 10 | `decision_notes` | text | yes |  |
| 11 | `decision_scope` | text | NOT NULL | `'rod'::text` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_decisions_decided_by_fkey | foreign key | `FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL` |
| journey_rod_decisions_pkey | primary key | `PRIMARY KEY (id)` |
| journey_rod_decisions_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rod_decisions_pending | `btree (status, requested_at)` |
| journey_rod_decisions_pkey | `UNIQUE btree (id)` |

## journey_rod_entity_links

Element `TE-DB-journey_rod_entity_links` · declared at `server/db.js:5055` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_rod_entity_links_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `entity_id` | bigint | NOT NULL |  |
| 4 | `tributary_type` | text | NOT NULL |  |
| 5 | `role_in_context` | text | yes |  |
| 6 | `expansion_ring` | text | yes |  |
| 7 | `parent_entity_id` | bigint | yes |  |
| 8 | `reason` | text | yes |  |
| 9 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 10 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_entity_links_entity_id_fkey | foreign key | `FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE` |
| journey_rod_entity_links_parent_entity_id_fkey | foreign key | `FOREIGN KEY (parent_entity_id) REFERENCES entities(id) ON DELETE SET NULL` |
| journey_rod_entity_links_pkey | primary key | `PRIMARY KEY (id)` |
| journey_rod_entity_links_rod_id_entity_id_tributary_type_key | unique | `UNIQUE (rod_id, entity_id, tributary_type)` |
| journey_rod_entity_links_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rod_entity_links_entity | `btree (entity_id)` |
| idx_rod_entity_links_rod | `btree (rod_id)` |
| journey_rod_entity_links_pkey | `UNIQUE btree (id)` |
| journey_rod_entity_links_rod_id_entity_id_tributary_type_key | `UNIQUE btree (rod_id, entity_id, tributary_type)` |

## journey_rod_events

Element `TE-DB-journey_rod_events` · declared at `server/db.js:466` · RLS not enabled · rows after empty-DB bootstrap: 3

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_rod_events_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `event_type` | text | NOT NULL |  |
| 4 | `from_stage` | text | yes |  |
| 5 | `to_stage` | text | yes |  |
| 6 | `score_delta` | numeric | NOT NULL | `0` |
| 7 | `potential_revenue_delta_cents` | bigint | NOT NULL | `0` |
| 8 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 9 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_events_pkey | primary key | `PRIMARY KEY (id)` |
| journey_rod_events_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rod_events_rod | `btree (rod_id, created_at DESC)` |
| journey_rod_events_pkey | `UNIQUE btree (id)` |

## journey_rod_evidence

Element `TE-DB-journey_rod_evidence` · declared at `server/db.js:504` · RLS not enabled · rows after empty-DB bootstrap: 2

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_rod_evidence_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `molecule_key` | text | NOT NULL |  |
| 4 | `value` | jsonb | NOT NULL | `'null'::jsonb` |
| 5 | `source_type` | text | yes |  |
| 6 | `source_reference` | text | yes |  |
| 7 | `actor_key` | text | yes |  |
| 8 | `confidence` | numeric | yes |  |
| 9 | `observed_at` | bigint | NOT NULL |  |
| 10 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 11 | `effective_from` | bigint | yes |  |
| 12 | `effective_to` | bigint | yes |  |
| 13 | `lineage_parent_id` | bigint | yes |  |
| 14 | `magnetic_properties` | jsonb | NOT NULL | `'[]'::jsonb` |
| 15 | `source_tier` | smallint | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_evidence_lineage_parent_id_fkey | foreign key | `FOREIGN KEY (lineage_parent_id) REFERENCES journey_rod_evidence(id) ON DELETE SET NULL` |
| journey_rod_evidence_pkey | primary key | `PRIMARY KEY (id)` |
| journey_rod_evidence_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| journey_rod_evidence_rod_id_molecule_key_source_reference_key | unique | `UNIQUE (rod_id, molecule_key, source_reference)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rod_evidence_rod | `btree (rod_id, molecule_key)` |
| journey_rod_evidence_pkey | `UNIQUE btree (id)` |
| journey_rod_evidence_rod_id_molecule_key_source_reference_key | `UNIQUE btree (rod_id, molecule_key, source_reference)` |

## journey_rod_person_links

Element `TE-DB-journey_rod_person_links` · declared at `server/db.js:5071` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_rod_person_links_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `person_id` | bigint | NOT NULL |  |
| 4 | `tributary_type` | text | NOT NULL |  |
| 5 | `role_in_context` | text | yes |  |
| 6 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_person_links_person_id_fkey | foreign key | `FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE` |
| journey_rod_person_links_pkey | primary key | `PRIMARY KEY (id)` |
| journey_rod_person_links_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| journey_rod_person_links_rod_id_person_id_tributary_type_key | unique | `UNIQUE (rod_id, person_id, tributary_type)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rod_person_links_person | `btree (person_id)` |
| idx_rod_person_links_rod | `btree (rod_id)` |
| journey_rod_person_links_pkey | `UNIQUE btree (id)` |
| journey_rod_person_links_rod_id_person_id_tributary_type_key | `UNIQUE btree (rod_id, person_id, tributary_type)` |

## journey_rod_settlement_states

Element `TE-DB-journey_rod_settlement_states` · declared at `server/db.js:720` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_rod_settlement_states_id_seq'::regclass)` |
| 2 | `rod_id` | bigint | NOT NULL |  |
| 3 | `molecule_key` | text | NOT NULL |  |
| 4 | `settlement_density` | numeric | NOT NULL | `0` |
| 5 | `settlement_class` | text | NOT NULL | `'surface'::text` |
| 6 | `computed_at` | bigint | NOT NULL |  |
| 7 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_settlement_states_pkey | primary key | `PRIMARY KEY (id)` |
| journey_rod_settlement_states_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| journey_rod_settlement_states_rod_id_molecule_key_key | unique | `UNIQUE (rod_id, molecule_key)` |

**Indexes**

| Name | Definition |
|---|---|
| idx_settlement_rod | `btree (rod_id)` |
| journey_rod_settlement_states_pkey | `UNIQUE btree (id)` |
| journey_rod_settlement_states_rod_id_molecule_key_key | `UNIQUE btree (rod_id, molecule_key)` |

## journey_rod_threshold_profiles

Element `TE-DB-journey_rod_threshold_profiles` · declared at `server/db.js:511` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `rod_id` | bigint | NOT NULL |  |
| 2 | `dimension_definitions` | jsonb | NOT NULL | `'[]'::jsonb` |
| 3 | `combinations` | jsonb | NOT NULL | `'[]'::jsonb` |
| 4 | `configured_by` | bigint | yes |  |
| 5 | `created_at` | bigint | NOT NULL |  |
| 6 | `updated_at` | bigint | NOT NULL |  |
| 7 | `current_key` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_threshold_profiles_configured_by_fkey | foreign key | `FOREIGN KEY (configured_by) REFERENCES users(id) ON DELETE SET NULL` |
| journey_rod_threshold_profiles_pkey | primary key | `PRIMARY KEY (rod_id)` |
| journey_rod_threshold_profiles_rod_id_fkey | foreign key | `FOREIGN KEY (rod_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| journey_rod_threshold_profiles_pkey | `UNIQUE btree (rod_id)` |

## journey_rod_tributary_links

Element `TE-DB-journey_rod_tributary_links` · declared at `server/db.js:4878` · RLS not enabled · rows after empty-DB bootstrap: 0

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_rod_tributary_links_id_seq'::regclass)` |
| 2 | `tributary_type` | text | NOT NULL |  |
| 3 | `rod_a_id` | bigint | NOT NULL |  |
| 4 | `rod_b_id` | bigint | NOT NULL |  |
| 5 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 6 | `created_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_tributary_links_pkey | primary key | `PRIMARY KEY (id)` |
| journey_rod_tributary_links_rod_a_id_fkey | foreign key | `FOREIGN KEY (rod_a_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |
| journey_rod_tributary_links_rod_b_id_fkey | foreign key | `FOREIGN KEY (rod_b_id) REFERENCES journey_data_rods(id) ON DELETE CASCADE` |

**Indexes**

| Name | Definition |
|---|---|
| idx_rod_tributary_links_a | `btree (rod_a_id)` |
| idx_rod_tributary_links_b | `btree (rod_b_id)` |
| idx_rod_tributary_links_pair | `UNIQUE btree (tributary_type, rod_a_id, rod_b_id)` |
| journey_rod_tributary_links_pkey | `UNIQUE btree (id)` |

## journey_rod_types

Element `TE-DB-journey_rod_types` · declared at `server/db.js:735` · RLS not enabled · rows after empty-DB bootstrap: 22

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | text | NOT NULL |  |
| 2 | `label` | text | NOT NULL |  |
| 3 | `description` | text | yes |  |
| 4 | `is_active` | boolean | NOT NULL | `true` |
| 5 | `sort_order` | integer | NOT NULL | `0` |
| 6 | `created_at` | bigint | NOT NULL |  |
| 7 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_rod_types_pkey | primary key | `PRIMARY KEY (id)` |

**Indexes**

| Name | Definition |
|---|---|
| journey_rod_types_pkey | `UNIQUE btree (id)` |

## journey_scenarios

Element `TE-DB-journey_scenarios` · declared at `server/db.js:490` · RLS not enabled · rows after empty-DB bootstrap: 227

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_scenarios_id_seq'::regclass)` |
| 2 | `scenario_key` | text | NOT NULL |  |
| 3 | `rod_type` | text | NOT NULL |  |
| 4 | `label` | text | NOT NULL |  |
| 5 | `description` | text | yes |  |
| 6 | `selected_cluster_keys` | jsonb | NOT NULL | `'[]'::jsonb` |
| 7 | `dimensions` | jsonb | NOT NULL | `'[]'::jsonb` |
| 8 | `actor_roles` | jsonb | NOT NULL | `'[]'::jsonb` |
| 9 | `is_active` | boolean | NOT NULL | `true` |
| 10 | `created_at` | bigint | NOT NULL |  |
| 11 | `updated_at` | bigint | NOT NULL |  |
| 12 | `metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 13 | `current_key` | text | yes |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_scenarios_pkey | primary key | `PRIMARY KEY (id)` |
| journey_scenarios_scenario_key_key | unique | `UNIQUE (scenario_key)` |

**Indexes**

| Name | Definition |
|---|---|
| journey_scenarios_pkey | `UNIQUE btree (id)` |
| journey_scenarios_scenario_key_key | `UNIQUE btree (scenario_key)` |

## journey_stage_gates

Element `TE-DB-journey_stage_gates` · declared at `server/db.js:398` · RLS not enabled · rows after empty-DB bootstrap: 22

| # | Column | Type | Null | Default |
|---|---|---|---|---|
| 1 | `id` | bigint | NOT NULL | `nextval('journey_stage_gates_id_seq'::regclass)` |
| 2 | `rod_type` | text | NOT NULL |  |
| 3 | `stage_key` | text | NOT NULL |  |
| 4 | `label` | text | NOT NULL |  |
| 5 | `sort_order` | integer | NOT NULL | `0` |
| 6 | `qualification_metadata` | jsonb | NOT NULL | `'{}'::jsonb` |
| 7 | `is_active` | boolean | NOT NULL | `true` |
| 8 | `created_at` | bigint | NOT NULL |  |
| 9 | `updated_at` | bigint | NOT NULL |  |

**Constraints**

| Name | Type | Definition |
|---|---|---|
| journey_stage_gates_pkey | primary key | `PRIMARY KEY (id)` |
| journey_stage_gates_rod_type_stage_key_key | unique | `UNIQUE (rod_type, stage_key)` |

**Indexes**

| Name | Definition |
|---|---|
| journey_stage_gates_pkey | `UNIQUE btree (id)` |
| journey_stage_gates_rod_type_stage_key_key | `UNIQUE btree (rod_type, stage_key)` |
