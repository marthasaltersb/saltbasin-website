# Data model map

Generated from commit `e63df368c285693c755156c0684eda2a3d03822d` by Graphify 0.9.84 (code (tree-sitter AST, no LLM); postgres introspection (graphify.pg_introspect)). No LLM pass, no external API.
Source: fresh local database booted from server/db.js bootstrap + seed (schema and fictional seed rows only).

- 229 tables and 0 views, 2653 columns, 313 foreign keys
- 584 code files scanned (5699 symbols, 15109 edges); condensed graph 420 nodes / 1360 edges in 17 communities
- Cross-check: Graphify's introspection found 294 table-to-table reference edges; the catalog's foreign keys give 294; they agree.

## Domains (default grouping; editable in the app)

- **Members and identity** (44): consent_actions, data_entitlements, email_delivery_preferences, entitlement_renewals, member_capability_allocations, member_configs, member_connections, member_feature_grants, member_json_store, member_messages, member_oauth_connections, member_profiles, member_site_unlocks, member_sites, member_subscription_seats, member_subscriptions, member_templates, network_requests, notifications, nrm_contact_groups, nrm_contacts, nrm_reference_requests, oauth_connections, org_configs, org_document_projections, org_memberships, org_sites, organization_authentication_policies, organization_profiles, organization_sso_login_states, password_reset_tokens, personal_org_links, personal_profiles, platform_applications, portfolio_requests, product_licenses, product_onboarding_runs, resume_temp_access, sessions, user_authentication_routes, user_emails, user_password_history, user_password_reset_preferences, users
- **Leads, commerce and proposals** (36): analytics_events, capability_groups, commerce_offerings, commerce_payments, contribution_events, feedback_advisors, feedback_category_weights, gtm_deliverable_annotations, gtm_deliverables, gtm_scenario_library, gtm_schedules, herq_comment_insights, herq_research_inputs, herq_series_versions, jira_config, lead_activity, lead_email_addresses, lead_email_verifications, lead_emails, lead_messages, lead_sessions, lead_visits, leads, offering_features, product_feedback, proposal_approval_actions, proposal_collaborators, proposal_contracts, proposal_delivery_emails, proposal_feedback_entries, proposal_feedback_reminders, proposal_versions, raw_events, revenue_journey_contacts, revenue_journeys, services_proposal_access
- **Release and testing** (35): backlog_components, backlog_contribution_links, backlog_deployment_components, backlog_deployment_items, backlog_deployments, backlog_items, backlog_output_image_jobs, backlog_output_publications, backlog_output_rule_configs, backlog_promotion_gates, backlog_reconciliation_runs, backlog_requirement_sources, build_progress_snapshots, release_failed_runs, release_features, release_fixes, release_loop_bugs, release_loop_runs, release_loop_steps, release_metrics, release_outputs, release_reconciliation_events, release_records, release_rounds, release_tracker_ingest_log, release_tracker_snapshots, release_tracker_tokens, session_analyses, session_capture_failures, session_mapping_proposals, test_run_step_results, test_runs, test_scenario_features, test_scenario_steps, test_scenarios
- **Journey and rods** (34): checkpoint_presence, divergence_states, economic_composition_requirements, entities, field_audit_log, field_lineage, genesis_configurations, genesis_object_overlaps, historical_observations, journey_atom_affinity_rules, journey_current_definitions, journey_data_rods, journey_gate_definitions, journey_metadata_clusters, journey_metadata_molecules, journey_rod_actors, journey_rod_decisions, journey_rod_entity_links, journey_rod_events, journey_rod_evidence, journey_rod_person_links, journey_rod_settlement_states, journey_rod_threshold_profiles, journey_rod_tributary_links, journey_rod_types, journey_scenarios, journey_stage_gates, persons, reciprocity_comparisons, relationships, scenario_definition_versions, scenario_imports, scenario_observations, tier_workarounds
- **Agents** (21): agent_approval_workflows, agent_code_run_events, agent_code_runs, agent_context_profiles, agent_definitions, agent_hub_definitions, agent_hub_run_findings, agent_hub_runs, agent_knowledge_records, agent_llm_usage, agent_messages, agent_run_log, agent_runner_outputs, agent_runner_runs, agent_schedules, agent_session_participants, agent_threads, agent_work_stage_events, customer_agent_memory, member_agent_messages, platform_access_tokens
- **Career** (21): career_certifications, career_deals, career_domains, career_engagements, career_experience_definitions, career_intake_documents, career_intake_runs, career_jobs, career_meta_options, career_proficiency_assertions, career_reasoning_approvals, career_reasoning_cache_candidates, career_reconciliation_tasks, career_skills, career_source_mappings, career_tools, cover_letter_agent_turns, cover_letter_settings, output_templates, resume_member_reasons, resume_output_projections
- **Finance and metrics** (20): account_records, accounting_policies, accounting_topology_definitions, deliverable_packages, external_financial_connections, financial_account_definitions, financial_consents, financial_output_shares, finbridgeco_configs, gl_accounts, global_standards, journal_entries, journal_entry_lines, metric_calculations, metric_definitions, metric_observations, pending_standards, rate_configs, standard_overrides, user_tasks
- **Site and content** (12): client_basin_templates, config_state, content_attachments, content_interactions, content_publications, detail_pages, landing_sessions, page_events, site_state, temp_attachments, unified_content_items, unified_outputs
- **Render bindings and ports** (4): data_ports, data_snapshots, port_source_fields, port_source_objects
- **Audit and system** (2): audit_events, audit_log

## Most referenced tables

- `users`: referenced by 133 foreign key(s)
- `organization_profiles`: referenced by 31 foreign key(s)
- `journey_data_rods`: referenced by 23 foreign key(s)
- `leads`: referenced by 16 foreign key(s)
- `backlog_items`: referenced by 13 foreign key(s)
- `release_records`: referenced by 7 foreign key(s)
- `proposal_versions`: referenced by 6 foreign key(s)
- `agent_threads`: referenced by 5 foreign key(s)
- `entities`: referenced by 5 foreign key(s)
- `agent_hub_definitions`: referenced by 4 foreign key(s)

## Tables no server file reads or writes by name

`detail_pages`, `historical_observations`, `nrm_contact_groups`, `org_configs`, `org_sites`, `output_templates`, `platform_applications`, `rate_configs`, `scenario_definition_versions`, `scenario_imports`, `scenario_observations`

(Dynamic SQL built from variables is invisible to the text scan; treat this list as a lead, not proof.)
