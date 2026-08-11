import { db } from '../db.js';

let ready;

export function ensureBacklogIntelligenceSchema() {
  if (ready) return ready;
  ready = db.exec(`
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS canonical_key TEXT;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS design_definition JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS production_state JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS composition_scores JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS estimated_agent_hours NUMERIC;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS estimated_user_hours NUMERIC;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS actual_agent_hours NUMERIC;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS actual_user_hours NUMERIC;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_backlog_canonical_key ON backlog_items(canonical_key) WHERE canonical_key IS NOT NULL;

    CREATE TABLE IF NOT EXISTS agent_session_participants (
      id BIGSERIAL PRIMARY KEY, thread_id BIGINT REFERENCES agent_threads(id) ON DELETE CASCADE,
      source_session_id TEXT, participant_type TEXT NOT NULL, participant_key TEXT NOT NULL,
      display_name TEXT, role_label TEXT, metadata JSONB NOT NULL DEFAULT '{}', created_at BIGINT NOT NULL,
      UNIQUE(source_session_id,participant_type,participant_key)
    );
    CREATE TABLE IF NOT EXISTS backlog_requirement_sources (
      id BIGSERIAL PRIMARY KEY, backlog_item_id BIGINT NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
      source_platform TEXT NOT NULL, source_session_id TEXT, source_message_id TEXT, raw_event_ids JSONB NOT NULL DEFAULT '[]',
      extracted_title TEXT, extracted_requirement TEXT NOT NULL, extraction_model TEXT, confidence NUMERIC,
      first_observed_at BIGINT, last_observed_at BIGINT, metadata JSONB NOT NULL DEFAULT '{}', created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL,
      UNIQUE(backlog_item_id,source_platform,source_session_id,source_message_id)
    );
    CREATE TABLE IF NOT EXISTS backlog_contribution_links (
      backlog_item_id BIGINT NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
      contribution_event_row_id BIGINT NOT NULL REFERENCES contribution_events(row_id) ON DELETE CASCADE,
      allocation_pct NUMERIC NOT NULL DEFAULT 100, allocated_active_minutes NUMERIC NOT NULL DEFAULT 0,
      contributor_type TEXT, participant_key TEXT, created_at BIGINT NOT NULL,
      PRIMARY KEY(backlog_item_id,contribution_event_row_id)
    );
    CREATE TABLE IF NOT EXISTS backlog_components (
      id BIGSERIAL PRIMARY KEY, backlog_item_id BIGINT NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
      component_type TEXT NOT NULL DEFAULT 'file', component_key TEXT NOT NULL, folder_path TEXT, file_path TEXT,
      build_name TEXT, runtime_surface TEXT, metadata JSONB NOT NULL DEFAULT '{}', created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL,
      UNIQUE(backlog_item_id,component_type,component_key)
    );
    ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS user_profile JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS process_steps JSONB NOT NULL DEFAULT '[]';
    ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS data_values JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS actions JSONB NOT NULL DEFAULT '[]';
    ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS required_for_promotion BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE test_scenario_steps ADD COLUMN IF NOT EXISTS data_values JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE test_scenario_steps ADD COLUMN IF NOT EXISTS automation_ref TEXT;
    ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS deployment_id BIGINT;
    ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS executed_by_type TEXT DEFAULT 'user';
    ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS executed_by_key TEXT;
    ALTER TABLE test_run_step_results ADD COLUMN IF NOT EXISTS actual_behavior TEXT;
    ALTER TABLE test_run_step_results ADD COLUMN IF NOT EXISTS screenshot_urls JSONB NOT NULL DEFAULT '[]';
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS defect_fix_type TEXT;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS requires_redeployment BOOLEAN;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS reproduction_steps JSONB NOT NULL DEFAULT '[]';
    CREATE TABLE IF NOT EXISTS backlog_deployments (
      id BIGSERIAL PRIMARY KEY, environment TEXT NOT NULL, environment_slug TEXT, git_sha TEXT, git_ref TEXT,
      provider TEXT DEFAULT 'github', deployment_ref TEXT, deployed_at BIGINT, status TEXT NOT NULL DEFAULT 'planned',
      is_current BOOLEAN NOT NULL DEFAULT false, metadata JSONB NOT NULL DEFAULT '{}', created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backlog_deployment_items (
      deployment_id BIGINT NOT NULL REFERENCES backlog_deployments(id) ON DELETE CASCADE,
      backlog_item_id BIGINT NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
      change_type TEXT, requires_redeployment BOOLEAN NOT NULL DEFAULT true, production_confirmed BOOLEAN NOT NULL DEFAULT false,
      PRIMARY KEY(deployment_id,backlog_item_id)
    );
    CREATE TABLE IF NOT EXISTS backlog_deployment_components (
      deployment_id BIGINT NOT NULL REFERENCES backlog_deployments(id) ON DELETE CASCADE,
      component_id BIGINT NOT NULL REFERENCES backlog_components(id) ON DELETE CASCADE,
      artifact_digest TEXT, deployed_at BIGINT, is_current BOOLEAN NOT NULL DEFAULT false,
      PRIMARY KEY(deployment_id,component_id)
    );
    CREATE TABLE IF NOT EXISTS backlog_promotion_gates (
      id BIGSERIAL PRIMARY KEY, deployment_id BIGINT NOT NULL REFERENCES backlog_deployments(id) ON DELETE CASCADE,
      from_environment TEXT NOT NULL, to_environment TEXT NOT NULL, required_pass_pct NUMERIC NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'blocked', evaluation JSONB NOT NULL DEFAULT '{}', evaluated_at BIGINT, approved_by BIGINT REFERENCES users(id),
      created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backlog_output_publications (
      id BIGSERIAL PRIMARY KEY, deployment_id BIGINT REFERENCES backlog_deployments(id) ON DELETE SET NULL,
      output_type TEXT NOT NULL, herq_template_ref TEXT, configuration JSONB NOT NULL DEFAULT '{}', generated_content JSONB NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'review', review_user_id BIGINT REFERENCES users(id), published_at BIGINT,
      created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backlog_output_rule_configs (
      id BIGSERIAL PRIMARY KEY, config_key TEXT NOT NULL UNIQUE, label TEXT NOT NULL,
      grouping_rules JSONB NOT NULL DEFAULT '{}', visual_rules JSONB NOT NULL DEFAULT '{}',
      brand_profile JSONB NOT NULL DEFAULT '{}', is_active BOOLEAN NOT NULL DEFAULT true,
      created_by BIGINT REFERENCES users(id), created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backlog_output_image_jobs (
      id BIGSERIAL PRIMARY KEY, publication_id BIGINT NOT NULL REFERENCES backlog_output_publications(id) ON DELETE CASCADE,
      scenario_prompt TEXT NOT NULL, provider TEXT NOT NULL DEFAULT 'openai', model TEXT,
      source_asset_urls JSONB NOT NULL DEFAULT '[]', generated_asset_url TEXT, branded_asset_url TEXT,
      logo_asset_ref TEXT, copyright_text TEXT, status TEXT NOT NULL DEFAULT 'draft', provenance JSONB NOT NULL DEFAULT '{}',
      created_by BIGINT REFERENCES users(id), created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backlog_reconciliation_runs (
      id BIGSERIAL PRIMARY KEY, provider TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
      stats JSONB NOT NULL DEFAULT '{}', error TEXT, started_at BIGINT, finished_at BIGINT,
      created_by BIGINT REFERENCES users(id), created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
  `);
  return ready;
}
