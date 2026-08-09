-- Crystal Orbit experience topology. Definitions are tenant-scoped and
-- versionable; member presentation preferences are separate from licensed
-- access so hiding a shortcut never changes authorization.

CREATE TABLE IF NOT EXISTS experience_worlds (
  id TEXT PRIMARY KEY,
  org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  world_type TEXT NOT NULL CHECK (world_type IN ('account','member','platform','organization','application')),
  visual_variant TEXT NOT NULL DEFAULT 'crystal_city',
  required_feature_keys JSONB NOT NULL DEFAULT '[]',
  public_site_route JSONB NOT NULL DEFAULT '{}',
  configuration JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_experience_worlds_scope ON experience_worlds(org_id,module_key,status);

CREATE TABLE IF NOT EXISTS experience_orbits (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL REFERENCES experience_worlds(id) ON DELETE CASCADE,
  capability_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  required_feature_key TEXT,
  workspace_route JSONB NOT NULL DEFAULT '{}',
  visual_variant TEXT NOT NULL DEFAULT 'crystal_tower',
  health_rule_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE(world_id,capability_key)
);

CREATE TABLE IF NOT EXISTS experience_journeys (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL REFERENCES experience_worlds(id) ON DELETE CASCADE,
  orbit_id TEXT REFERENCES experience_orbits(id) ON DELETE CASCADE,
  template_key TEXT,
  label TEXT NOT NULL,
  description TEXT,
  industry_keys JSONB NOT NULL DEFAULT '[]',
  scenario_keys JSONB NOT NULL DEFAULT '[]',
  entry_criteria JSONB NOT NULL DEFAULT '{}',
  permission_policy JSONB NOT NULL DEFAULT '{}',
  visual_variant TEXT NOT NULL DEFAULT 'flowing_river',
  configuration JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS experience_journey_gates (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL REFERENCES experience_journeys(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  capability_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  required_inputs JSONB NOT NULL DEFAULT '[]',
  produced_outputs JSONB NOT NULL DEFAULT '[]',
  approval_policy JSONB NOT NULL DEFAULT '{}',
  maturity_rule_key TEXT,
  convergence_target_id TEXT,
  configuration JSONB NOT NULL DEFAULT '{}',
  UNIQUE(journey_id,sort_order)
);

CREATE TABLE IF NOT EXISTS experience_agent_bindings (
  id BIGSERIAL PRIMARY KEY,
  world_id TEXT REFERENCES experience_worlds(id) ON DELETE CASCADE,
  orbit_id TEXT REFERENCES experience_orbits(id) ON DELETE CASCADE,
  journey_id TEXT REFERENCES experience_journeys(id) ON DELETE CASCADE,
  gate_id TEXT REFERENCES experience_journey_gates(id) ON DELETE CASCADE,
  agent_definition_key TEXT NOT NULL,
  input_criteria JSONB NOT NULL DEFAULT '{}',
  schedule_config JSONB NOT NULL DEFAULT '{}',
  action_config JSONB NOT NULL DEFAULT '{}',
  deliverable_config JSONB NOT NULL DEFAULT '{}',
  review_policy JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CHECK (world_id IS NOT NULL OR orbit_id IS NOT NULL OR journey_id IS NOT NULL OR gate_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS member_home_experience (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  shortcut_crystals JSONB NOT NULL DEFAULT '[]',
  dashboard_cards JSONB NOT NULL DEFAULT '[]',
  panel_preferences JSONB NOT NULL DEFAULT '{}',
  default_world_id TEXT REFERENCES experience_worlds(id) ON DELETE SET NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_journey_instances (
  id BIGSERIAL PRIMARY KEY,
  journey_id TEXT NOT NULL REFERENCES experience_journeys(id),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
  current_gate_id TEXT REFERENCES experience_journey_gates(id),
  status TEXT NOT NULL DEFAULT 'active',
  health_score NUMERIC(5,2),
  maturity_score NUMERIC(5,2),
  state JSONB NOT NULL DEFAULT '{}',
  started_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_journey_instances_member ON member_journey_instances(user_id,org_id,status);

CREATE TABLE IF NOT EXISTS member_journey_collaborators (
  journey_instance_id BIGINT NOT NULL REFERENCES member_journey_instances(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_role TEXT NOT NULL,
  invited_by BIGINT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'invited',
  created_at BIGINT NOT NULL,
  PRIMARY KEY(journey_instance_id,user_id)
);

