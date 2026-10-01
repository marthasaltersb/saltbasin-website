# Database schema inventory (declared)

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.

**Source of this catalog:** the repository's own `server/db.js` `bootstrap()` (plus `server/data/seed.js` `ensureSeeded()` where noted) executed against a **throwaway local PostgreSQL 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)** database, then read back from `pg_catalog`/`information_schema`. This is the schema **the repository declares** at this revision — it is **not** an observation of the live Supabase database. Live-schema drift is unverified (no live access; see `../02-coverage-and-limitations.md`).


## Totals

| Object | Count (declared) |
|---|---|
| Tables | 191 |
| Columns | 2128 |
| Constraints (PK/FK/unique/check) | 548 |
| Indexes | 488 |
| Views | 0 |
| Functions | 0 |
| Triggers | 0 |
| RLS policies | 0 |
| Tables with RLS enabled | 0 |
| Tables holding rows after bootstrap/seed on an empty DB | 45 |

Extensions present in the scratch database (Postgres defaults, not declared by the repo unless listed in db.js): `plpgsql`.

## Tables

| Element ID | Table | Group file | Cols | PK | FK → tables | Indexes | Declared at | Rows after empty-DB bootstrap |
|---|---|---|---|---|---|---|---|---|
| TE-DB-account_records | `account_records` | [misc](db/misc.md#account_records) | 9 | (id) | leads, organization_profiles, users | 3 | `server/db.js:1997` | 0 |
| TE-DB-accounting_policies | `accounting_policies` | [misc](db/misc.md#accounting_policies) | 12 | (id) | organization_profiles | 3 | `server/db.js:748` | 0 |
| TE-DB-accounting_topology_definitions | `accounting_topology_definitions` | [misc](db/misc.md#accounting_topology_definitions) | 11 | (id) | organization_profiles, accounting_policies | 3 | `server/db.js:784` | 0 |
| TE-DB-agent_approval_workflows | `agent_approval_workflows` | [agent](db/agent.md#agent_approval_workflows) | 11 | (id) | organization_profiles | 3 | `server/db.js:5162` | 2 |
| TE-DB-agent_code_run_events | `agent_code_run_events` | [agent](db/agent.md#agent_code_run_events) | 7 | (id) | agent_code_runs | 2 | `server/db.js:1938` | 0 |
| TE-DB-agent_code_runs | `agent_code_runs` | [agent](db/agent.md#agent_code_runs) | 22 | (id) | users, backlog_items, agent_threads | 2 | `server/db.js:1912` | 0 |
| TE-DB-agent_context_profiles | `agent_context_profiles` | [agent](db/agent.md#agent_context_profiles) | 10 | (id) | users | 2 | `server/db.js:1852` | 0 |
| TE-DB-agent_definitions | `agent_definitions` | [agent](db/agent.md#agent_definitions) | 16 | (id) | organization_profiles, users, agent_definitions | 4 | `server/db.js:5096` | 11 |
| TE-DB-agent_hub_definitions | `agent_hub_definitions` | [agent](db/agent.md#agent_hub_definitions) | 15 | (id) | — | 5 | `server/db.js:5669` | 13 |
| TE-DB-agent_hub_run_findings | `agent_hub_run_findings` | [agent](db/agent.md#agent_hub_run_findings) | 10 | (id) | agent_hub_runs | 1 | `server/db.js:5713` | 0 |
| TE-DB-agent_hub_runs | `agent_hub_runs` | [agent](db/agent.md#agent_hub_runs) | 14 | (id) | agent_hub_definitions | 1 | `server/db.js:5707` | 0 |
| TE-DB-agent_knowledge_records | `agent_knowledge_records` | [agent](db/agent.md#agent_knowledge_records) | 21 | (id) | backlog_items, users, agent_messages, agent_threads | 4 | `server/db.js:1873` | 0 |
| TE-DB-agent_llm_usage | `agent_llm_usage` | [agent](db/agent.md#agent_llm_usage) | 9 | (id) | agent_hub_definitions | 2 | `server/db.js:5700` | 0 |
| TE-DB-agent_messages | `agent_messages` | [agent](db/agent.md#agent_messages) | 6 | (id) | agent_threads | 2 | `server/db.js:1838` | 0 |
| TE-DB-agent_run_log | `agent_run_log` | [agent](db/agent.md#agent_run_log) | 5 | (id) | users | 2 | `server/db.js:5153` | 0 |
| TE-DB-agent_schedules | `agent_schedules` | [agent](db/agent.md#agent_schedules) | 14 | (id) | agent_definitions, organization_profiles, users | 2 | `server/db.js:5120` | 0 |
| TE-DB-agent_threads | `agent_threads` | [agent](db/agent.md#agent_threads) | 13 | (id) | backlog_items, agent_context_profiles, users | 2 | `server/db.js:1829` | 0 |
| TE-DB-agent_work_stage_events | `agent_work_stage_events` | [agent](db/agent.md#agent_work_stage_events) | 9 | (id) | backlog_items, users, agent_threads | 2 | `server/db.js:1899` | 0 |
| TE-DB-analytics_events | `analytics_events` | [misc](db/misc.md#analytics_events) | 12 | (id) | users | 4 | `server/db.js:2800` | 2 |
| TE-DB-audit_events | `audit_events` | [misc](db/misc.md#audit_events) | 10 | (id) | users | 3 | `server/db.js:2314` | 0 |
| TE-DB-audit_log | `audit_log` | [misc](db/misc.md#audit_log) | 12 | (id) | users | 4 | `server/db.js:1603` | 6 |
| TE-DB-backlog_items | `backlog_items` | [misc](db/misc.md#backlog_items) | 48 | (id) | capability_groups, backlog_items, test_scenarios | 7 | `server/db.js:1684` | 0 |
| TE-DB-build_progress_snapshots | `build_progress_snapshots` | [misc](db/misc.md#build_progress_snapshots) | 16 | (id) | — | 4 | `server/db.js:2344` | 1 |
| TE-DB-capability_groups | `capability_groups` | [misc](db/misc.md#capability_groups) | 11 | (id) | — | 2 | `server/db.js:1674` | 0 |
| TE-DB-career_certifications | `career_certifications` | [career](db/career.md#career_certifications) | 14 | (id) | users | 3 | `server/db.js:3781` | 0 |
| TE-DB-career_deals | `career_deals` | [career](db/career.md#career_deals) | 26 | (id) | users | 4 | `server/db.js:3798` | 0 |
| TE-DB-career_domains | `career_domains` | [career](db/career.md#career_domains) | 12 | (id) | users | 3 | `server/db.js:3759` | 0 |
| TE-DB-career_engagements | `career_engagements` | [career](db/career.md#career_engagements) | 26 | (id) | users | 4 | `server/db.js:3729` | 0 |
| TE-DB-career_experience_definitions | `career_experience_definitions` | [career](db/career.md#career_experience_definitions) | 11 | (id) | users | 3 | `server/db.js:2957` | 0 |
| TE-DB-career_intake_documents | `career_intake_documents` | [career](db/career.md#career_intake_documents) | 24 | (id) | users | 3 | `server/db.js:3988` | 0 |
| TE-DB-career_intake_runs | `career_intake_runs` | [career](db/career.md#career_intake_runs) | 14 | (id) | users | 3 | `server/db.js:4017` | 0 |
| TE-DB-career_jobs | `career_jobs` | [career](db/career.md#career_jobs) | 14 | (id) | users | 3 | `server/db.js:3680` | 1 |
| TE-DB-career_meta_options | `career_meta_options` | [career](db/career.md#career_meta_options) | 7 | (id) | — | 2 | `server/db.js:3828` | 0 |
| TE-DB-career_proficiency_assertions | `career_proficiency_assertions` | [career](db/career.md#career_proficiency_assertions) | 14 | (id) | users | 3 | `server/db.js:2973` | 0 |
| TE-DB-career_reasoning_approvals | `career_reasoning_approvals` | [career](db/career.md#career_reasoning_approvals) | 11 | (id) | users, journey_data_rods, career_reconciliation_tasks | 3 | `server/db.js:4088` | 0 |
| TE-DB-career_reasoning_cache_candidates | `career_reasoning_cache_candidates` | [career](db/career.md#career_reasoning_cache_candidates) | 13 | (id) | journey_rod_decisions | 2 | `server/db.js:4105` | 0 |
| TE-DB-career_reconciliation_tasks | `career_reconciliation_tasks` | [career](db/career.md#career_reconciliation_tasks) | 17 | (id) | users, journey_data_rods | 3 | `server/db.js:4065` | 0 |
| TE-DB-career_skills | `career_skills` | [career](db/career.md#career_skills) | 12 | (id) | users | 4 | `server/db.js:3697` | 0 |
| TE-DB-career_source_mappings | `career_source_mappings` | [career](db/career.md#career_source_mappings) | 16 | (id) | career_intake_documents, users | 3 | `server/db.js:4036` | 0 |
| TE-DB-career_tools | `career_tools` | [career](db/career.md#career_tools) | 13 | (id) | users | 3 | `server/db.js:3713` | 0 |
| TE-DB-checkpoint_presence | `checkpoint_presence` | [misc](db/misc.md#checkpoint_presence) | 10 | (id) | journey_data_rods, users | 3 | `server/db.js:907` | 0 |
| TE-DB-client_basin_templates | `client_basin_templates` | [misc](db/misc.md#client_basin_templates) | 12 | (id) | — | 2 | `server/db.js:1415` | 3 |
| TE-DB-commerce_offerings | `commerce_offerings` | [misc](db/misc.md#commerce_offerings) | 9 | (id) | — | 1 | `server/db.js:2875` | 1 |
| TE-DB-commerce_payments | `commerce_payments` | [misc](db/misc.md#commerce_payments) | 11 | (id) | deliverable_packages, product_licenses, users | 3 | `server/db.js:4351` | 0 |
| TE-DB-config_state | `config_state` | [misc](db/misc.md#config_state) | 3 | (id) | — | 1 | `server/db.js:242` | 4 |
| TE-DB-consent_actions | `consent_actions` | [misc](db/misc.md#consent_actions) | 9 | (id) | users | 2 | `server/db.js:1630` | 1 |
| TE-DB-content_attachments | `content_attachments` | [content](db/content.md#content_attachments) | 14 | (id) | — | 3 | `server/db.js:5808` | 0 |
| TE-DB-content_interactions | `content_interactions` | [content](db/content.md#content_interactions) | 14 | (id) | — | 2 | `server/db.js:5860` | 0 |
| TE-DB-content_publications | `content_publications` | [content](db/content.md#content_publications) | 20 | (id) | — | 4 | `server/db.js:5832` | 0 |
| TE-DB-contribution_events | `contribution_events` | [misc](db/misc.md#contribution_events) | 51 | (row_id) | — | 7 | `server/db.js:3513` | 0 |
| TE-DB-customer_agent_memory | `customer_agent_memory` | [misc](db/misc.md#customer_agent_memory) | 10 | (id) | organization_profiles, users | 3 | `server/db.js:1489` | 1 |
| TE-DB-data_entitlements | `data_entitlements` | [data](db/data.md#data_entitlements) | 4 | (id) | product_licenses | 1 | `server/db.js:2077` | 0 |
| TE-DB-data_ports | `data_ports` | [data](db/data.md#data_ports) | 13 | (id) | organization_profiles | 3 | `server/db.js:670` | 0 |
| TE-DB-data_snapshots | `data_snapshots` | [data](db/data.md#data_snapshots) | 10 | (id) | users | 3 | `server/db.js:3102` | 0 |
| TE-DB-deliverable_packages | `deliverable_packages` | [misc](db/misc.md#deliverable_packages) | 14 | (id) | — | 2 | `server/db.js:4322` | 2 |
| TE-DB-detail_pages | `detail_pages` | [misc](db/misc.md#detail_pages) | 4 | (id) | — | 1 | `server/db.js:248` | 0 |
| TE-DB-divergence_states | `divergence_states` | [misc](db/misc.md#divergence_states) | 10 | (id) | journey_data_rods | 2 | `server/db.js:863` | 0 |
| TE-DB-economic_composition_requirements | `economic_composition_requirements` | [misc](db/misc.md#economic_composition_requirements) | 7 | (id) | accounting_topology_definitions | 1 | `server/db.js:838` | 0 |
| TE-DB-email_delivery_preferences | `email_delivery_preferences` | [misc](db/misc.md#email_delivery_preferences) | 5 | (user_id) | users | 1 | `server/db.js:1589` | 0 |
| TE-DB-entities | `entities` | [misc](db/misc.md#entities) | 12 | (id) | entities, organization_profiles, users | 4 | `server/db.js:4984` | 0 |
| TE-DB-entitlement_renewals | `entitlement_renewals` | [misc](db/misc.md#entitlement_renewals) | 7 | (id) | product_licenses | 2 | `server/db.js:4340` | 0 |
| TE-DB-external_financial_connections | `external_financial_connections` | [misc](db/misc.md#external_financial_connections) | 16 | (id) | financial_consents, users | 2 | `server/db.js:2125` | 0 |
| TE-DB-feedback_advisors | `feedback_advisors` | [misc](db/misc.md#feedback_advisors) | 4 | (user_id) | users | 1 | `server/db.js:4403` | 0 |
| TE-DB-feedback_category_weights | `feedback_category_weights` | [misc](db/misc.md#feedback_category_weights) | 4 | (category) | users | 1 | `server/db.js:4410` | 4 |
| TE-DB-field_audit_log | `field_audit_log` | [misc](db/misc.md#field_audit_log) | 7 | (id) | users | 3 | `server/db.js:2534` | 0 |
| TE-DB-field_lineage | `field_lineage` | [misc](db/misc.md#field_lineage) | 12 | (id) | users | 5 | `server/db.js:3083` | 0 |
| TE-DB-financial_account_definitions | `financial_account_definitions` | [financial](db/financial.md#financial_account_definitions) | 17 | (id) | external_financial_connections, users | 3 | `server/db.js:2145` | 0 |
| TE-DB-financial_consents | `financial_consents` | [financial](db/financial.md#financial_consents) | 8 | (id) | users | 2 | `server/db.js:2113` | 0 |
| TE-DB-financial_output_shares | `financial_output_shares` | [financial](db/financial.md#financial_output_shares) | 11 | (id) | organization_profiles, users | 3 | `server/db.js:2169` | 0 |
| TE-DB-finbridgeco_configs | `finbridgeco_configs` | [misc](db/misc.md#finbridgeco_configs) | 6 | (id) | users | 1 | `server/db.js:2821` | 0 |
| TE-DB-genesis_configurations | `genesis_configurations` | [misc](db/misc.md#genesis_configurations) | 10 | (id) | users | 3 | `server/db.js:5597` | 0 |
| TE-DB-genesis_object_overlaps | `genesis_object_overlaps` | [misc](db/misc.md#genesis_object_overlaps) | 26 | (overlap_id) | users | 4 | `server/db.js:5613` | 34 |
| TE-DB-gl_accounts | `gl_accounts` | [misc](db/misc.md#gl_accounts) | 12 | (id) | organization_profiles | 3 | `server/db.js:765` | 0 |
| TE-DB-global_standards | `global_standards` | [misc](db/misc.md#global_standards) | 11 | (id) | global_standards | 4 | `server/db.js:2569` | 0 |
| TE-DB-herq_comment_insights | `herq_comment_insights` | [herq](db/herq.md#herq_comment_insights) | 15 | (id) | users | 1 | `server/db.js:2710` | 0 |
| TE-DB-herq_research_inputs | `herq_research_inputs` | [herq](db/herq.md#herq_research_inputs) | 20 | (id) | users | 1 | `server/db.js:2691` | 0 |
| TE-DB-herq_series_versions | `herq_series_versions` | [herq](db/herq.md#herq_series_versions) | 11 | (id) | — | 1 | `server/db.js:2674` | 5 |
| TE-DB-historical_observations | `historical_observations` | [misc](db/misc.md#historical_observations) | 8 | (id) | journey_data_rods | 3 | `server/db.js:885` | 1 |
| TE-DB-jira_config | `jira_config` | [misc](db/misc.md#jira_config) | 8 | (id) | — | 1 | `server/db.js:1804` | 0 |
| TE-DB-journal_entries | `journal_entries` | [misc](db/misc.md#journal_entries) | 15 | (id) | organization_profiles, journey_data_rods | 3 | `server/db.js:800` | 0 |
| TE-DB-journal_entry_lines | `journal_entry_lines` | [misc](db/misc.md#journal_entry_lines) | 9 | (id) | gl_accounts, journal_entries | 2 | `server/db.js:820` | 0 |
| TE-DB-journey_atom_affinity_rules | `journey_atom_affinity_rules` | [journey](db/journey.md#journey_atom_affinity_rules) | 12 | (id) | journey_metadata_clusters, journey_metadata_molecules, organization_profiles | 3 | `server/db.js:653` | 1024 |
| TE-DB-journey_current_definitions | `journey_current_definitions` | [journey](db/journey.md#journey_current_definitions) | 15 | (id) | organization_profiles, journey_rod_types | 3 | `server/db.js:4896` | 8 |
| TE-DB-journey_data_rods | `journey_data_rods` | [journey](db/journey.md#journey_data_rods) | 19 | (id) | leads, journey_data_rods, users | 7 | `server/db.js:411` | 5 |
| TE-DB-journey_gate_definitions | `journey_gate_definitions` | [journey](db/journey.md#journey_gate_definitions) | 16 | (id) | journey_scenarios | 2 | `server/db.js:496` | 681 |
| TE-DB-journey_metadata_clusters | `journey_metadata_clusters` | [journey](db/journey.md#journey_metadata_clusters) | 16 | (id) | — | 2 | `server/db.js:485` | 200 |
| TE-DB-journey_metadata_molecules | `journey_metadata_molecules` | [journey](db/journey.md#journey_metadata_molecules) | 15 | (id) | — | 2 | `server/db.js:479` | 1516 |
| TE-DB-journey_rod_actors | `journey_rod_actors` | [journey](db/journey.md#journey_rod_actors) | 8 | (id) | journey_data_rods | 2 | `server/db.js:518` | 0 |
| TE-DB-journey_rod_decisions | `journey_rod_decisions` | [journey](db/journey.md#journey_rod_decisions) | 11 | (id) | users, journey_data_rods | 2 | `server/db.js:524` | 0 |
| TE-DB-journey_rod_entity_links | `journey_rod_entity_links` | [journey](db/journey.md#journey_rod_entity_links) | 10 | (id) | entities, journey_data_rods | 4 | `server/db.js:5055` | 0 |
| TE-DB-journey_rod_events | `journey_rod_events` | [journey](db/journey.md#journey_rod_events) | 9 | (id) | journey_data_rods | 2 | `server/db.js:466` | 3 |
| TE-DB-journey_rod_evidence | `journey_rod_evidence` | [journey](db/journey.md#journey_rod_evidence) | 15 | (id) | journey_rod_evidence, journey_data_rods | 3 | `server/db.js:504` | 2 |
| TE-DB-journey_rod_person_links | `journey_rod_person_links` | [journey](db/journey.md#journey_rod_person_links) | 7 | (id) | persons, journey_data_rods | 4 | `server/db.js:5071` | 0 |
| TE-DB-journey_rod_settlement_states | `journey_rod_settlement_states` | [journey](db/journey.md#journey_rod_settlement_states) | 7 | (id) | journey_data_rods | 3 | `server/db.js:720` | 0 |
| TE-DB-journey_rod_threshold_profiles | `journey_rod_threshold_profiles` | [journey](db/journey.md#journey_rod_threshold_profiles) | 7 | (rod_id) | users, journey_data_rods | 1 | `server/db.js:511` | 0 |
| TE-DB-journey_rod_tributary_links | `journey_rod_tributary_links` | [journey](db/journey.md#journey_rod_tributary_links) | 6 | (id) | journey_data_rods | 4 | `server/db.js:4878` | 0 |
| TE-DB-journey_rod_types | `journey_rod_types` | [journey](db/journey.md#journey_rod_types) | 7 | (id) | — | 1 | `server/db.js:735` | 22 |
| TE-DB-journey_scenarios | `journey_scenarios` | [journey](db/journey.md#journey_scenarios) | 13 | (id) | — | 2 | `server/db.js:490` | 227 |
| TE-DB-journey_stage_gates | `journey_stage_gates` | [journey](db/journey.md#journey_stage_gates) | 9 | (id) | — | 2 | `server/db.js:398` | 22 |
| TE-DB-landing_sessions | `landing_sessions` | [misc](db/misc.md#landing_sessions) | 2 | (token) | — | 1 | `server/db.js:255` | 0 |
| TE-DB-lead_activity | `lead_activity` | [lead](db/lead.md#lead_activity) | 6 | (id) | leads | 2 | `server/db.js:334` | 1 |
| TE-DB-lead_email_addresses | `lead_email_addresses` | [lead](db/lead.md#lead_email_addresses) | 10 | (id) | leads | 3 | `server/db.js:1294` | 1 |
| TE-DB-lead_email_verifications | `lead_email_verifications` | [lead](db/lead.md#lead_email_verifications) | 7 | (id) | leads | 3 | `server/db.js:1513` | 1 |
| TE-DB-lead_emails | `lead_emails` | [lead](db/lead.md#lead_emails) | 12 | (id) | leads | 2 | `server/db.js:318` | 0 |
| TE-DB-lead_messages | `lead_messages` | [lead](db/lead.md#lead_messages) | 5 | (id) | leads | 1 | `server/db.js:310` | 0 |
| TE-DB-lead_sessions | `lead_sessions` | [lead](db/lead.md#lead_sessions) | 4 | (token) | leads | 2 | `server/db.js:1284` | 1 |
| TE-DB-lead_visits | `lead_visits` | [lead](db/lead.md#lead_visits) | 6 | (id) | leads | 3 | `server/db.js:387` | 0 |
| TE-DB-leads | `leads` | [misc](db/misc.md#leads) | 39 | (id) | agent_hub_definitions, leads, organization_profiles, users | 6 | `server/db.js:260` | 1 |
| TE-DB-member_agent_messages | `member_agent_messages` | [member](db/member.md#member_agent_messages) | 7 | (id) | users | 2 | `server/db.js:1503` | 0 |
| TE-DB-member_capability_allocations | `member_capability_allocations` | [member](db/member.md#member_capability_allocations) | 8 | (id) | users, organization_profiles | 2 | `server/db.js:1473` | 0 |
| TE-DB-member_configs | `member_configs` | [member](db/member.md#member_configs) | 4 | (user_id, kind) | users | 2 | `server/db.js:1555` | 0 |
| TE-DB-member_connections | `member_connections` | [member](db/member.md#member_connections) | 7 | (id) | users | 4 | `server/db.js:3169` | 0 |
| TE-DB-member_feature_grants | `member_feature_grants` | [member](db/member.md#member_feature_grants) | 6 | (id) | users | 2 | `server/db.js:2922` | 0 |
| TE-DB-member_json_store | `member_json_store` | [member](db/member.md#member_json_store) | 4 | (user_id, key) | users | 2 | `server/db.js:2521` | 0 |
| TE-DB-member_messages | `member_messages` | [member](db/member.md#member_messages) | 6 | (id) | users | 3 | `server/db.js:3183` | 0 |
| TE-DB-member_oauth_connections | `member_oauth_connections` | [member](db/member.md#member_oauth_connections) | 13 | (id) | users | 4 | `server/db.js:2186` | 0 |
| TE-DB-member_profiles | `member_profiles` | [member](db/member.md#member_profiles) | 10 | (user_id) | users | 2 | `server/db.js:343` | 1 |
| TE-DB-member_site_unlocks | `member_site_unlocks` | [member](db/member.md#member_site_unlocks) | 3 | (token) | users | 2 | `server/db.js:2849` | 0 |
| TE-DB-member_sites | `member_sites` | [member](db/member.md#member_sites) | 4 | (user_id, kind) | users | 1 | `server/db.js:1547` | 2 |
| TE-DB-member_subscription_seats | `member_subscription_seats` | [member](db/member.md#member_subscription_seats) | 4 | (id) | member_subscriptions, users | 3 | `server/db.js:2913` | 0 |
| TE-DB-member_subscriptions | `member_subscriptions` | [member](db/member.md#member_subscriptions) | 11 | (id) | commerce_offerings, organization_profiles, users | 3 | `server/db.js:2894` | 1 |
| TE-DB-member_templates | `member_templates` | [member](db/member.md#member_templates) | 11 | (id) | — | 2 | `server/db.js:1815` | 0 |
| TE-DB-metric_calculations | `metric_calculations` | [metric](db/metric.md#metric_calculations) | 14 | (id) | metric_definitions | 2 | `server/db.js:136` | 0 |
| TE-DB-metric_definitions | `metric_definitions` | [metric](db/metric.md#metric_definitions) | 11 | (metric_id) | — | 2 | `server/db.js:122` | 0 |
| TE-DB-metric_observations | `metric_observations` | [metric](db/metric.md#metric_observations) | 9 | (id) | metric_calculations | 3 | `server/db.js:155` | 0 |
| TE-DB-network_requests | `network_requests` | [misc](db/misc.md#network_requests) | 10 | (id) | leads, users | 2 | `server/db.js:3145` | 0 |
| TE-DB-notifications | `notifications` | [misc](db/misc.md#notifications) | 10 | (id) | users | 1 | `server/db.js:5719` | 0 |
| TE-DB-nrm_contact_groups | `nrm_contact_groups` | [nrm](db/nrm.md#nrm_contact_groups) | 5 | (id) | users | 1 | `server/db.js:2755` | 0 |
| TE-DB-nrm_contacts | `nrm_contacts` | [nrm](db/nrm.md#nrm_contacts) | 16 | (id) | users | 3 | `server/db.js:2731` | 0 |
| TE-DB-nrm_reference_requests | `nrm_reference_requests` | [nrm](db/nrm.md#nrm_reference_requests) | 9 | (id) | users | 3 | `server/db.js:2766` | 0 |
| TE-DB-oauth_connections | `oauth_connections` | [misc](db/misc.md#oauth_connections) | 15 | (id) | users | 5 | `server/db.js:2089` | 0 |
| TE-DB-offering_features | `offering_features` | [misc](db/misc.md#offering_features) | 3 | (offering_id, feature_key) | commerce_offerings | 1 | `server/db.js:2887` | 5 |
| TE-DB-org_configs | `org_configs` | [org](db/org.md#org_configs) | 4 | (org_id, kind) | organization_profiles | 1 | `server/db.js:2037` | 0 |
| TE-DB-org_document_projections | `org_document_projections` | [org](db/org.md#org_document_projections) | 12 | (id) | users, organization_profiles, journey_data_rods | 2 | `server/db.js:998` | 0 |
| TE-DB-org_memberships | `org_memberships` | [org](db/org.md#org_memberships) | 6 | (id) | users, organization_profiles | 4 | `server/db.js:2017` | 0 |
| TE-DB-org_sites | `org_sites` | [org](db/org.md#org_sites) | 4 | (org_id, kind) | organization_profiles | 1 | `server/db.js:2030` | 0 |
| TE-DB-organization_authentication_policies | `organization_authentication_policies` | [organization](db/organization.md#organization_authentication_policies) | 8 | (org_id) | organization_profiles, users | 1 | `server/db.js:1452` | 0 |
| TE-DB-organization_profiles | `organization_profiles` | [organization](db/organization.md#organization_profiles) | 14 | (id) | leads | 5 | `server/db.js:293` | 1 |
| TE-DB-organization_sso_login_states | `organization_sso_login_states` | [organization](db/organization.md#organization_sso_login_states) | 8 | (token_hash) | organization_profiles, users | 2 | `server/db.js:1462` | 0 |
| TE-DB-output_templates | `output_templates` | [misc](db/misc.md#output_templates) | 8 | (id) | users | 3 | `server/db.js:3023` | 0 |
| TE-DB-page_events | `page_events` | [misc](db/misc.md#page_events) | 7 | (id) | — | 3 | `server/db.js:1648` | 0 |
| TE-DB-password_reset_tokens | `password_reset_tokens` | [misc](db/misc.md#password_reset_tokens) | 5 | (token) | users | 3 | `server/db.js:2378` | 0 |
| TE-DB-pending_standards | `pending_standards` | [misc](db/misc.md#pending_standards) | 23 | (id) | global_standards, users | 3 | `server/db.js:2589` | 0 |
| TE-DB-personal_org_links | `personal_org_links` | [misc](db/misc.md#personal_org_links) | 3 | (personal_profile_id, org_id) | organization_profiles, personal_profiles | 1 | `server/db.js:2051` | 0 |
| TE-DB-personal_profiles | `personal_profiles` | [misc](db/misc.md#personal_profiles) | 10 | (id) | users | 3 | `server/db.js:1954` | 0 |
| TE-DB-persons | `persons` | [misc](db/misc.md#persons) | 14 | (id) | entities, persons, organization_profiles, users | 3 | `server/db.js:5004` | 0 |
| TE-DB-platform_applications | `platform_applications` | [misc](db/misc.md#platform_applications) | 10 | (id) | — | 1 | `server/db.js:2553` | 13 |
| TE-DB-port_source_fields | `port_source_fields` | [misc](db/misc.md#port_source_fields) | 10 | (id) | port_source_objects | 2 | `server/db.js:702` | 0 |
| TE-DB-port_source_objects | `port_source_objects` | [misc](db/misc.md#port_source_objects) | 10 | (id) | data_ports | 2 | `server/db.js:688` | 0 |
| TE-DB-portfolio_requests | `portfolio_requests` | [misc](db/misc.md#portfolio_requests) | 29 | (id) | agent_hub_definitions, leads, users, organization_profiles | 3 | `server/db.js:3933` | 0 |
| TE-DB-product_feedback | `product_feedback` | [product](db/product.md#product_feedback) | 11 | (id) | backlog_items, users | 4 | `server/db.js:4386` | 0 |
| TE-DB-product_licenses | `product_licenses` | [product](db/product.md#product_licenses) | 10 | (id) | users, organization_profiles | 4 | `server/db.js:2061` | 0 |
| TE-DB-product_onboarding_runs | `product_onboarding_runs` | [product](db/product.md#product_onboarding_runs) | 7 | (id) | users | 3 | `server/db.js:4367` | 0 |
| TE-DB-proposal_approval_actions | `proposal_approval_actions` | [proposal](db/proposal.md#proposal_approval_actions) | 7 | (id) | users, proposal_versions | 1 | `server/db.js:1406` | 0 |
| TE-DB-proposal_collaborators | `proposal_collaborators` | [proposal](db/proposal.md#proposal_collaborators) | 6 | (id) | proposal_versions, users | 2 | `server/db.js:1352` | 0 |
| TE-DB-proposal_contracts | `proposal_contracts` | [proposal](db/proposal.md#proposal_contracts) | 10 | (id) | users, proposal_versions, journey_data_rods | 2 | `server/db.js:1394` | 0 |
| TE-DB-proposal_delivery_emails | `proposal_delivery_emails` | [proposal](db/proposal.md#proposal_delivery_emails) | 7 | (id) | proposal_versions, users | 1 | `server/db.js:1377` | 0 |
| TE-DB-proposal_feedback_entries | `proposal_feedback_entries` | [proposal](db/proposal.md#proposal_feedback_entries) | 13 | (id) | proposal_versions, users | 2 | `server/db.js:1361` | 0 |
| TE-DB-proposal_feedback_reminders | `proposal_feedback_reminders` | [proposal](db/proposal.md#proposal_feedback_reminders) | 5 | (id) | proposal_versions, users | 2 | `server/db.js:1386` | 0 |
| TE-DB-proposal_versions | `proposal_versions` | [proposal](db/proposal.md#proposal_versions) | 14 | (id) | users, journey_data_rods | 3 | `server/db.js:1334` | 0 |
| TE-DB-rate_configs | `rate_configs` | [misc](db/misc.md#rate_configs) | 9 | (id) | — | 1 | `server/db.js:3395` | 4 |
| TE-DB-raw_events | `raw_events` | [misc](db/misc.md#raw_events) | 15 | (id) | — | 3 | `server/db.js:3481` | 0 |
| TE-DB-reciprocity_comparisons | `reciprocity_comparisons` | [misc](db/misc.md#reciprocity_comparisons) | 9 | (id) | journal_entries, journey_data_rods | 2 | `server/db.js:849` | 0 |
| TE-DB-relationships | `relationships` | [misc](db/misc.md#relationships) | 13 | (id) | entities, organization_profiles, users, persons | 4 | `server/db.js:5029` | 0 |
| TE-DB-resume_member_reasons | `resume_member_reasons` | [resume](db/resume.md#resume_member_reasons) | 4 | (id) | users | 2 | `server/db.js:3137` | 0 |
| TE-DB-resume_output_projections | `resume_output_projections` | [resume](db/resume.md#resume_output_projections) | 18 | (id) | journey_data_rods, resume_output_projections, users | 3 | `server/db.js:933` | 0 |
| TE-DB-resume_temp_access | `resume_temp_access` | [resume](db/resume.md#resume_temp_access) | 12 | (id) | leads | 4 | `server/db.js:3120` | 0 |
| TE-DB-revenue_journey_contacts | `revenue_journey_contacts` | [misc](db/misc.md#revenue_journey_contacts) | 7 | (id) | revenue_journeys, users | 2 | `server/db.js:1442` | 0 |
| TE-DB-revenue_journeys | `revenue_journeys` | [misc](db/misc.md#revenue_journeys) | 11 | (id) | organization_profiles, leads, users, client_basin_templates | 1 | `server/db.js:1429` | 0 |
| TE-DB-scenario_definition_versions | `scenario_definition_versions` | [scenario](db/scenario.md#scenario_definition_versions) | 14 | (id) | scenario_imports | 5 | `server/db.js:181` | 0 |
| TE-DB-scenario_imports | `scenario_imports` | [scenario](db/scenario.md#scenario_imports) | 10 | (id) | — | 2 | `server/db.js:169` | 0 |
| TE-DB-scenario_observations | `scenario_observations` | [scenario](db/scenario.md#scenario_observations) | 14 | (observation_id) | — | 2 | `server/db.js:201` | 0 |
| TE-DB-services_proposal_access | `services_proposal_access` | [misc](db/misc.md#services_proposal_access) | 9 | (id) | leads, users | 3 | `server/db.js:2783` | 0 |
| TE-DB-sessions | `sessions` | [misc](db/misc.md#sessions) | 16 | (token) | users | 3 | `server/db.js:229` | 2 |
| TE-DB-site_state | `site_state` | [misc](db/misc.md#site_state) | 3 | (id) | — | 1 | `server/db.js:236` | 2 |
| TE-DB-standard_overrides | `standard_overrides` | [misc](db/misc.md#standard_overrides) | 10 | (id) | pending_standards, global_standards, users | 1 | `server/db.js:2609` | 0 |
| TE-DB-temp_attachments | `temp_attachments` | [misc](db/misc.md#temp_attachments) | 9 | (id) | — | 2 | `server/db.js:3971` | 0 |
| TE-DB-test_run_step_results | `test_run_step_results` | [test](db/test.md#test_run_step_results) | 8 | (id) | backlog_items, test_runs, test_scenario_steps | 3 | `server/db.js:2274` | 0 |
| TE-DB-test_runs | `test_runs` | [test](db/test.md#test_runs) | 7 | (id) | test_scenarios, users | 3 | `server/db.js:2264` | 0 |
| TE-DB-test_scenario_features | `test_scenario_features` | [test](db/test.md#test_scenario_features) | 5 | (scenario_id, backlog_item_id) | backlog_items, test_scenarios | 4 | `server/db.js:2401` | 0 |
| TE-DB-test_scenario_steps | `test_scenario_steps` | [test](db/test.md#test_scenario_steps) | 6 | (id) | test_scenarios | 2 | `server/db.js:2255` | 0 |
| TE-DB-test_scenarios | `test_scenarios` | [test](db/test.md#test_scenarios) | 11 | (id) | backlog_items, capability_groups | 3 | `server/db.js:2241` | 0 |
| TE-DB-tier_workarounds | `tier_workarounds` | [misc](db/misc.md#tier_workarounds) | 9 | (id) | capability_groups | 2 | `server/db.js:1776` | 0 |
| TE-DB-unified_content_items | `unified_content_items` | [misc](db/misc.md#unified_content_items) | 24 | (id) | users | 4 | `server/db.js:2623` | 0 |
| TE-DB-unified_outputs | `unified_outputs` | [misc](db/misc.md#unified_outputs) | 16 | (id) | users | 2 | `server/db.js:2654` | 0 |
| TE-DB-user_authentication_routes | `user_authentication_routes` | [user](db/user.md#user_authentication_routes) | 9 | (id) | organization_profiles, users | 2 | `server/db.js:1523` | 0 |
| TE-DB-user_emails | `user_emails` | [user](db/user.md#user_emails) | 8 | (id) | users | 4 | `server/db.js:1575` | 1 |
| TE-DB-user_password_history | `user_password_history` | [user](db/user.md#user_password_history) | 4 | (id) | users | 2 | `server/db.js:1321` | 1 |
| TE-DB-user_password_reset_preferences | `user_password_reset_preferences` | [user](db/user.md#user_password_reset_preferences) | 4 | (user_id) | users | 1 | `server/db.js:1328` | 0 |
| TE-DB-user_tasks | `user_tasks` | [user](db/user.md#user_tasks) | 10 | (id) | users | 1 | `server/db.js:5725` | 0 |
| TE-DB-users | `users` | [misc](db/misc.md#users) | 10 | (id) | — | 2 | `server/db.js:221` | 2 |

## Tables declared outside `bootstrap()` (20)

Not present in the bootstrap catalog above. Three schema mechanisms therefore exist in the repository: boot-time `bootstrap()`, lazy runtime DDL, and standalone SQL files. Whether any of these exist in the **live** database is unverified.

| Table | Declared at | Mechanism | Referenced by (other code files) |
|---|---|---|---|
| `experience_worlds` | `migrations/20260809_member_crystal_worlds.sql:5` | standalone SQL file — no code path in the repo applies it | none |
| `experience_orbits` | `migrations/20260809_member_crystal_worlds.sql:23` | standalone SQL file — no code path in the repo applies it | none |
| `experience_journeys` | `migrations/20260809_member_crystal_worlds.sql:40` | standalone SQL file — no code path in the repo applies it | none |
| `experience_journey_gates` | `migrations/20260809_member_crystal_worlds.sql:58` | standalone SQL file — no code path in the repo applies it | none |
| `experience_agent_bindings` | `migrations/20260809_member_crystal_worlds.sql:73` | standalone SQL file — no code path in the repo applies it | none |
| `member_home_experience` | `migrations/20260809_member_crystal_worlds.sql:91` | standalone SQL file — no code path in the repo applies it | none |
| `member_journey_instances` | `migrations/20260809_member_crystal_worlds.sql:101` | standalone SQL file — no code path in the repo applies it | none |
| `member_journey_collaborators` | `migrations/20260809_member_crystal_worlds.sql:116` | standalone SQL file — no code path in the repo applies it | none |
| `agent_session_participants` | `server/lib/backlogIntelligenceSchema.js:18` | runtime DDL executed by application code (lazy, not at boot) | `server/lib/backlogHistoryReconciler.js` |
| `backlog_requirement_sources` | `server/lib/backlogIntelligenceSchema.js:24` | runtime DDL executed by application code (lazy, not at boot) | `server/lib/backlogHistoryReconciler.js` |
| `backlog_contribution_links` | `server/lib/backlogIntelligenceSchema.js:31` | runtime DDL executed by application code (lazy, not at boot) | `server/lib/backlogHistoryReconciler.js` `server/routes/backlogOutputs.js` |
| `backlog_components` | `server/lib/backlogIntelligenceSchema.js:38` | runtime DDL executed by application code (lazy, not at boot) | `server/lib/backlogHistoryReconciler.js` `server/routes/backlog.js` `server/routes/backlogOutputs.js` `server/routes/deploymentIntelligence.js` |
| `backlog_deployments` | `server/lib/backlogIntelligenceSchema.js:59` | runtime DDL executed by application code (lazy, not at boot) | `server/routes/backlogOutputs.js` `server/routes/deploymentIntelligence.js` |
| `backlog_deployment_items` | `server/lib/backlogIntelligenceSchema.js:64` | runtime DDL executed by application code (lazy, not at boot) | `server/routes/backlogOutputs.js` `server/routes/deploymentIntelligence.js` |
| `backlog_deployment_components` | `server/lib/backlogIntelligenceSchema.js:70` | runtime DDL executed by application code (lazy, not at boot) | `server/routes/deploymentIntelligence.js` |
| `backlog_promotion_gates` | `server/lib/backlogIntelligenceSchema.js:76` | runtime DDL executed by application code (lazy, not at boot) | `server/routes/deploymentIntelligence.js` |
| `backlog_output_publications` | `server/lib/backlogIntelligenceSchema.js:82` | runtime DDL executed by application code (lazy, not at boot) | `server/routes/backlogOutputs.js` |
| `backlog_output_rule_configs` | `server/lib/backlogIntelligenceSchema.js:88` | runtime DDL executed by application code (lazy, not at boot) | `server/routes/backlogOutputs.js` |
| `backlog_output_image_jobs` | `server/lib/backlogIntelligenceSchema.js:94` | runtime DDL executed by application code (lazy, not at boot) | `server/routes/backlogOutputs.js` |
| `backlog_reconciliation_runs` | `server/lib/backlogIntelligenceSchema.js:101` | runtime DDL executed by application code (lazy, not at boot) | `server/routes/agent.js` |

## Platform rows seeded into `config_state` on an empty database

These are the platform-wide config rows bootstrap/seed creates when absent (`config_state.data` is TEXT JSON). Their **live** content may differ (admins edit them in the UI).

| config_state.id | Seeded size (bytes) |
|---|---|
| `admin_nav` | 3666 |
| `draft` | 5812 |
| `page_type_definitions` | 2103 |
| `published` | 5812 |
