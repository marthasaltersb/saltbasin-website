// Postgres database layer backed by Supabase.
//
// The original code was written against the synchronous node:sqlite API
// (`db.prepare(sql).get(...)` etc.). The `postgres` npm package is async only,
// so we wrap it in a small adapter that returns the same shape — except every
// `get / all / run / exec` call is now async and must be awaited.
//
// Caller migration cheat-sheet:
//   sqlite                                 →  postgres (this file)
//   db.prepare(sql).get(a, b)              →  await db.prepare(sql).get(a, b)
//   db.prepare(sql).all(a, b)              →  await db.prepare(sql).all(a, b)
//   db.prepare(sql).run(a, b)              →  await db.prepare(sql).run(a, b)
//   db.exec('...')                         →  await db.exec('...')
//   ? placeholders                         →  $1, $2 numbered placeholders
//   AUTOINCREMENT                          →  BIGSERIAL
//   strftime('%s','now') * 1000            →  (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
//   INSERT OR REPLACE INTO t (...)         →  INSERT INTO t (...) ON CONFLICT (...) DO UPDATE SET ...
//
// The schema migration helpers below are idempotent — safe to run on every
// boot. ALTER TABLE ADD COLUMN IF NOT EXISTS works natively in Postgres 9.6+.
//
// jsonb param convention (2026-07-27): db.prepare(sql).run/get/all(...params)
// wraps sql.unsafe(query, params) below. For a param bound to a JSONB column
// (with or without an explicit ::jsonb cast in the SQL text), ALWAYS pass the
// raw JS value (object/array/string/number) — NEVER JSON.stringify() it
// first. Doing so double-encodes: the column ends up holding a JSON *string*
// scalar containing the JSON text (jsonb_typeof(col) = 'string', not
// 'object'/'array'), which every `row.col?.x` reader then silently reads as
// undefined instead of throwing, masking the corruption. This is a real,
// confirmed driver behavior (verified by direct reproduction against this
// Supabase connection), not a hypothetical. Columns that are plain TEXT
// (site_state.data, config_state.data, member_profiles.draft/published) are
// unaffected and must keep using JSON.stringify() — check the column's
// actual CREATE TABLE type before "fixing" a call site.
import 'dotenv/config';
import postgres from 'postgres';
import { generateCareerAtomDefinitions, generateCareerMoleculeDefinitions } from './lib/careerAtomRegistry.js';
import { generateSignalMoleculeDefinitions, generateBusinessHypothesisMoleculeDefinitions, generateRecordAtomDefinitions } from './lib/lonetreeDemoRegistry.js';
import { generateDeltaAtomDefinitions, generateRecordMoleculeAtomDefinitions } from './lib/proposalExperienceRegistry.js';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set. Add it to .env (see DEPLOY.md).');
}

// Single shared connection pool. Supabase's pooler defaults to a small pool;
// `max: 5` is plenty for a personal portfolio site.
const sql = postgres(url, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // simpler with Supabase's transaction pooler
});

// ── Adapter that imitates node:sqlite's prepared-statement API ──
// Every method returns a Promise because the underlying driver is async.
export const db = {
  prepare(query) {
    return {
      async get(...params) {
        const rows = await sql.unsafe(query, params);
        return rows[0] || null;
      },
      async all(...params) {
        return await sql.unsafe(query, params);
      },
      async run(...params) {
        const rows = await sql.unsafe(query, params);
        // Mimic better-sqlite3 / node:sqlite return: lastInsertRowid + changes.
        // If the query used RETURNING id, surface it. Otherwise fall back to
        // `rows.count` (postgres library exposes affected row count there).
        return {
          lastInsertRowid: rows[0]?.id ?? null,
          changes: rows.count ?? rows.length ?? 0,
        };
      },
    };
  },
  async exec(query) {
    return await sql.unsafe(query);
  },
  // Direct access for callers that want raw tagged-template style.
  raw: sql,
};

// ── Schema + idempotent migrations ──
// Run once at boot. CREATE TABLE IF NOT EXISTS is universal; ALTER TABLE
// ... ADD COLUMN IF NOT EXISTS works in PG 9.6+ (Supabase is 15+).

async function bootstrap() {
  // Isolated backfill for the Member Entitlement Provisioning columns added
  // to journey_data_rods on 2026-07-13 (parent_rod_id, rod_relationship_type,
  // module_key, provisioning_origin — onboarding_email_status included too,
  // same gap). All four/five only ever lived inside the CREATE TABLE IF NOT
  // EXISTS below, which is a no-op on any install where journey_data_rods
  // already existed (this one has, for a while). Without this ALTER, the
  // CREATE UNIQUE INDEX statements further down that reference module_key
  // and parent_rod_id throw "column does not exist" inside the large
  // unisolated multi-statement block below, aborting bootstrap() entirely
  // for every process that imports this file — the same failure class as
  // the v0.17 sessions-table collision documented near the Contribution
  // Intelligence v0.17 block. Isolated here, ahead of that block, so it
  // always runs first regardless of the block's own lack of per-statement
  // isolation. CLAUDE.md's own convention is new columns get an ALTER here;
  // this batch just missed it.
  const journeyRodsBackfill = [
    `ALTER TABLE journey_data_rods ADD COLUMN IF NOT EXISTS parent_rod_id BIGINT REFERENCES journey_data_rods(id) ON DELETE SET NULL`,
    `ALTER TABLE journey_data_rods ADD COLUMN IF NOT EXISTS rod_relationship_type TEXT`,
    `ALTER TABLE journey_data_rods ADD COLUMN IF NOT EXISTS module_key TEXT`,
    `ALTER TABLE journey_data_rods ADD COLUMN IF NOT EXISTS provisioning_origin TEXT`,
    `ALTER TABLE journey_data_rods ADD COLUMN IF NOT EXISTS onboarding_email_status TEXT NOT NULL DEFAULT 'not_applicable'`,
    `ALTER TABLE journey_data_rods ADD COLUMN IF NOT EXISTS first_login_at BIGINT`,
  ];
  for (const stmt of journeyRodsBackfill) {
    await sql.unsafe(stmt).catch((e) => console.warn('[db] journey_data_rods Member Entitlement Provisioning column backfill warning (table may not exist yet on first install, which is fine):', stmt, '--', e.message));
  }

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS metric_definitions (
      metric_id TEXT PRIMARY KEY,
      metric_key TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      metric_family TEXT NOT NULL,
      metric_subfamily TEXT,
      definition_json JSONB NOT NULL,
      calculation_version TEXT NOT NULL,
      effective_from BIGINT NOT NULL,
      effective_to BIGINT,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS metric_calculations (
      id BIGSERIAL PRIMARY KEY,
      metric_id TEXT NOT NULL REFERENCES metric_definitions(metric_id),
      variant_key TEXT NOT NULL,
      calculation_version TEXT NOT NULL,
      as_of BIGINT NOT NULL,
      value NUMERIC,
      unit TEXT NOT NULL,
      confidence NUMERIC NOT NULL,
      formula_json JSONB NOT NULL,
      inputs_json JSONB NOT NULL,
      methodology TEXT NOT NULL,
      context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by BIGINT,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_metric_calculations_lookup
      ON metric_calculations(metric_id, variant_key, as_of DESC);

    CREATE TABLE IF NOT EXISTS metric_observations (
      id BIGSERIAL PRIMARY KEY,
      calculation_id BIGINT NOT NULL UNIQUE REFERENCES metric_calculations(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL DEFAULT 'portfolio_company',
      entity_id TEXT NOT NULL,
      period_start BIGINT,
      period_end BIGINT NOT NULL,
      observed_value NUMERIC,
      status TEXT NOT NULL DEFAULT 'calculated',
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    -- Governed scenario vocabulary. Definitions are immutable by
    -- (scenario_id, version); activation is a separate reviewed decision.
    CREATE TABLE IF NOT EXISTS scenario_imports (
      id BIGSERIAL PRIMARY KEY,
      workbook_hash TEXT NOT NULL UNIQUE,
      workbook_version TEXT NOT NULL,
      scenario_count INTEGER NOT NULL,
      validation JSONB NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending_review',
      imported_by BIGINT,
      imported_at BIGINT NOT NULL,
      reviewed_by BIGINT,
      reviewed_at BIGINT
    );
    CREATE TABLE IF NOT EXISTS scenario_definition_versions (
      id BIGSERIAL PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      definition_hash TEXT NOT NULL,
      signature_id TEXT NOT NULL,
      definition JSONB NOT NULL,
      import_id BIGINT REFERENCES scenario_imports(id) ON DELETE RESTRICT,
      review_status TEXT NOT NULL DEFAULT 'pending_review',
      active BOOLEAN NOT NULL DEFAULT false,
      effective_from BIGINT,
      effective_to BIGINT,
      created_at BIGINT NOT NULL,
      reviewed_by BIGINT,
      reviewed_at BIGINT,
      UNIQUE (scenario_id, version),
      UNIQUE (scenario_id, definition_hash)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_scenario_one_active_version ON scenario_definition_versions (scenario_id) WHERE active = true;
    CREATE INDEX IF NOT EXISTS idx_scenario_signature ON scenario_definition_versions (signature_id) WHERE active = true;
    CREATE TABLE IF NOT EXISTS scenario_observations (
      observation_id TEXT PRIMARY KEY,
      signature_id TEXT NOT NULL,
      atom_assignments JSONB NOT NULL,
      nearest_scenarios JSONB NOT NULL DEFAULT '[]',
      source_event_id TEXT,
      customer_id TEXT,
      contract_id TEXT,
      evidence JSONB NOT NULL DEFAULT '[]',
      review_status TEXT NOT NULL DEFAULT 'pending_review',
      resolution_scenario_id TEXT,
      reviewer_id BIGINT,
      review_note TEXT,
      created_at BIGINT NOT NULL,
      reviewed_at BIGINT
    );
    CREATE INDEX IF NOT EXISTS idx_scenario_observation_review ON scenario_observations (review_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_metric_observations_entity
      ON metric_observations(entity_type, entity_id, period_end DESC);

    CREATE TABLE IF NOT EXISTS users (
      id            BIGSERIAL PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'admin',
      created_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at  BIGINT NOT NULL,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS site_state (
      id          TEXT PRIMARY KEY,
      data        TEXT NOT NULL,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS config_state (
      id          TEXT PRIMARY KEY,
      data        TEXT NOT NULL,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS detail_pages (
      id          TEXT PRIMARY KEY,
      state       TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS landing_sessions (
      token       TEXT PRIMARY KEY,
      expires_at  BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id              BIGSERIAL PRIMARY KEY,
      source          TEXT NOT NULL,
      email           TEXT NOT NULL,
      phone           TEXT,                       -- normalized: digits only
      name            TEXT,
      message         TEXT,
      public_id       TEXT UNIQUE,
      access_token    TEXT,                       -- legacy URL-token access (kept for back-compat)
      password_hash   TEXT,                       -- bcrypt hash of access password
      answers         TEXT,
      prior_notes     TEXT,                       -- preserved notes from any leads merged into this one (JSON array of {at, source, text})
      merged_into_id  BIGINT REFERENCES leads(id) ON DELETE SET NULL, -- non-null = this row was merged INTO another lead
      merged_from_ids TEXT,                       -- JSON array of lead ids that were merged INTO this one
      verified_email  BOOLEAN NOT NULL DEFAULT false,
      verified_phone  BOOLEAN NOT NULL DEFAULT false,
      converted_user_id BIGINT,
      created_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS lead_messages (
      id          BIGSERIAL PRIMARY KEY,
      lead_id     BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      role        TEXT NOT NULL,
      content     TEXT NOT NULL,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS lead_emails (
      id          BIGSERIAL PRIMARY KEY,
      lead_id     BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      to_email    TEXT NOT NULL,
      from_email  TEXT NOT NULL,
      subject     TEXT NOT NULL,
      body_text   TEXT,
      body_html   TEXT,
      provider    TEXT NOT NULL,             -- 'resend' or 'console'
      status      TEXT NOT NULL,             -- 'sent', 'stubbed', 'failed'
      provider_id TEXT,                      -- external id (Resend message id)
      error       TEXT,
      sent_at     BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_lead_emails_lead ON lead_emails (lead_id, sent_at DESC);

    CREATE TABLE IF NOT EXISTS lead_activity (
      id            BIGSERIAL PRIMARY KEY,
      lead_id       BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      source        TEXT NOT NULL,
      cta_location  TEXT,                 -- e.g. '/#contact' or '/consulting/services'
      message       TEXT,
      created_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS member_profiles (
      user_id     BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      slug        TEXT NOT NULL UNIQUE,
      draft       TEXT NOT NULL,
      published   TEXT,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_lead_activity_lead ON lead_activity (lead_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
  `);

  // Backwards-compatible column additions (no-op if already present)
  const colMigrations = [
    ['leads', 'public_id', 'TEXT UNIQUE'],
    ['leads', 'access_token', 'TEXT'],
    ['leads', 'answers', 'TEXT'],
    ['leads', 'converted_user_id', 'BIGINT'],
    ['leads', 'updated_at', "BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint"],
    ['leads', 'phone', 'TEXT'],
    ['leads', 'password_hash', 'TEXT'],
    ['leads', 'prior_notes', 'TEXT'],
    ['leads', 'merged_into_id', 'BIGINT REFERENCES leads(id) ON DELETE SET NULL'],
    ['leads', 'merged_from_ids', 'TEXT'],
    ['leads', 'verified_email', 'BOOLEAN NOT NULL DEFAULT false'],
    ['leads', 'verified_phone', 'BOOLEAN NOT NULL DEFAULT false'],
    ['leads', 'actor_key', 'TEXT'],
    ['leads', 'provisional', 'BOOLEAN NOT NULL DEFAULT false'],
    ['leads', 'visit_count', 'INTEGER NOT NULL DEFAULT 0'],
    ['leads', 'last_visit_at', 'BIGINT'],
    ['leads', 'originating_member_user_id', 'BIGINT REFERENCES users(id) ON DELETE SET NULL'],
    ['lead_activity', 'cta_location', 'TEXT'],
    ['users', 'display_name', 'TEXT'],
  ];
  for (const [table, col, def] of colMigrations) {
    await sql.unsafe(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${def}`).catch((e) => {
      if (!/already exists|duplicate column/i.test(e.message)) throw e;
    });
  }
  await sql.unsafe(`
    ALTER TABLE leads ALTER COLUMN email DROP NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_actor_key ON leads (actor_key) WHERE actor_key IS NOT NULL AND merged_into_id IS NULL;
    CREATE TABLE IF NOT EXISTS lead_visits (
      id BIGSERIAL PRIMARY KEY,
      lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      visit_key TEXT NOT NULL,
      entry_path TEXT,
      first_message TEXT,
      created_at BIGINT NOT NULL,
      UNIQUE(lead_id, visit_key)
    );
    CREATE INDEX IF NOT EXISTS idx_lead_visits_lead ON lead_visits (lead_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS journey_stage_gates (
      id BIGSERIAL PRIMARY KEY,
      rod_type TEXT NOT NULL,
      stage_key TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      qualification_metadata JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE(rod_type, stage_key)
    );

    CREATE TABLE IF NOT EXISTS journey_data_rods (
      id BIGSERIAL PRIMARY KEY,
      rod_type TEXT NOT NULL,
      lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE,
      user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      personal_profile_id BIGINT,
      org_id BIGINT,
      current_stage TEXT NOT NULL DEFAULT 'first_interaction',
      stage_score NUMERIC NOT NULL DEFAULT 0,
      potential_revenue_cents BIGINT NOT NULL DEFAULT 0,
      actual_revenue_cents BIGINT NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}',
      -- Member Entitlement Provisioning (2026-07-13): parent_rod_id +
      -- rod_relationship_type model a *typed rod relationship* — a Member
      -- Channel Rod spawning a Member Entitlement / Public Site / Career
      -- Master Channel Rod is rod formation, not a Tributary (a Tributary is
      -- a bounded scenario divergence within one rod's own lifecycle, per
      -- terminology-migration-registry.json's own "Member Organization
      -- Branch -> Member Organization Relationship" precedent, which
      -- rejected calling an analogous rod-to-rod link a Tributary). See
      -- server/lib/memberProvisioning.js.
      parent_rod_id BIGINT REFERENCES journey_data_rods(id) ON DELETE SET NULL,
      rod_relationship_type TEXT,
        -- e.g. member_entitlement_provisioning | member_public_site_provisioning
        --      | member_career_provisioning | member_organization_provisioning (future)
      module_key TEXT,
        -- member_entitlement rods only: which module (personal_brand_website, resume_career, ...)
      provisioning_origin TEXT,
        -- member_entitlement rods only: direct_to_consumer | organization_provisioned
      onboarding_email_status TEXT NOT NULL DEFAULT 'not_applicable',
        -- not_applicable | pending | sent | failed
      first_login_at BIGINT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rods_lead_type ON journey_data_rods (lead_id, rod_type) WHERE lead_id IS NOT NULL AND user_id IS NULL AND org_id IS NULL;
    -- A member can hold multiple member_entitlement rods (one per module),
    -- multiple explicitly configured deal journeys (identified by the
    -- scenarioKey stored in metadata), and multiple commercial_opportunity_
    -- target / career_opportunity_target rods (2026-08-06, Career Placement
    -- Agents — a member tracks many independent opportunities, each its own
    -- rod, with no natural per-user dedup key the way member_entitlement has
    -- module_key). Ordinary member/customer/revenue rods remain singleton
    -- records per user and type.
    -- DROP+CREATE changes only the constraint's WHERE clause, not any row
    -- data, and existing rod_types (member/customer/revenue_lifecycle etc.)
    -- keep exactly the enforcement they always had.
    DROP INDEX IF EXISTS idx_rods_user_type;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rods_user_type ON journey_data_rods (user_id, rod_type) WHERE user_id IS NOT NULL AND org_id IS NULL AND rod_type NOT IN ('member_entitlement','commercial_opportunity_target','career_opportunity_target') AND NOT (metadata ? 'scenarioKey');
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rods_user_entitlement_module ON journey_data_rods (user_id, module_key) WHERE user_id IS NOT NULL AND org_id IS NULL AND rod_type = 'member_entitlement';
    DROP INDEX IF EXISTS idx_rods_user_org_type;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rods_user_org_type ON journey_data_rods (user_id, org_id, rod_type) WHERE user_id IS NOT NULL AND org_id IS NOT NULL AND rod_type NOT IN ('commercial_opportunity_target','career_opportunity_target');
    CREATE INDEX IF NOT EXISTS idx_rods_org ON journey_data_rods (org_id, rod_type);
    CREATE INDEX IF NOT EXISTS idx_rods_parent ON journey_data_rods (parent_rod_id);

    CREATE TABLE IF NOT EXISTS journey_rod_events (
      id BIGSERIAL PRIMARY KEY,
      rod_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      from_stage TEXT,
      to_stage TEXT,
      score_delta NUMERIC NOT NULL DEFAULT 0,
      potential_revenue_delta_cents BIGINT NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rod_events_rod ON journey_rod_events (rod_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS journey_metadata_molecules (
      id BIGSERIAL PRIMARY KEY, molecule_key TEXT NOT NULL UNIQUE, label TEXT NOT NULL,
      data_type TEXT NOT NULL DEFAULT 'text', source_paths JSONB NOT NULL DEFAULT '[]',
      validation_config JSONB NOT NULL DEFAULT '{}', is_sensitive BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS journey_metadata_clusters (
      id BIGSERIAL PRIMARY KEY, cluster_key TEXT NOT NULL UNIQUE, label TEXT NOT NULL,
      description TEXT, molecule_keys JSONB NOT NULL DEFAULT '[]', completion_rule TEXT NOT NULL DEFAULT 'all',
      minimum_count INTEGER, is_active BOOLEAN NOT NULL DEFAULT true, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS journey_scenarios (
      id BIGSERIAL PRIMARY KEY, scenario_key TEXT NOT NULL UNIQUE, rod_type TEXT NOT NULL,
      label TEXT NOT NULL, description TEXT, selected_cluster_keys JSONB NOT NULL DEFAULT '[]',
      dimensions JSONB NOT NULL DEFAULT '[]', actor_roles JSONB NOT NULL DEFAULT '[]',
      is_active BOOLEAN NOT NULL DEFAULT true, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS journey_gate_definitions (
      id BIGSERIAL PRIMARY KEY, scenario_id BIGINT NOT NULL REFERENCES journey_scenarios(id) ON DELETE CASCADE,
      stage_key TEXT NOT NULL, required_clusters JSONB NOT NULL DEFAULT '[]', required_molecules JSONB NOT NULL DEFAULT '[]',
      required_dimensions JSONB NOT NULL DEFAULT '[]', required_actor_roles JSONB NOT NULL DEFAULT '[]',
      dependency_rules JSONB NOT NULL DEFAULT '[]', judgment_policy TEXT NOT NULL DEFAULT 'when_ambiguous',
      human_prompt TEXT, sort_order INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL, UNIQUE(scenario_id, stage_key)
    );
    CREATE TABLE IF NOT EXISTS journey_rod_evidence (
      id BIGSERIAL PRIMARY KEY, rod_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      molecule_key TEXT NOT NULL, value JSONB NOT NULL DEFAULT 'null', source_type TEXT,
      source_reference TEXT, actor_key TEXT, confidence NUMERIC, observed_at BIGINT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}', UNIQUE(rod_id, molecule_key, source_reference)
    );
    CREATE INDEX IF NOT EXISTS idx_rod_evidence_rod ON journey_rod_evidence (rod_id, molecule_key);
    CREATE TABLE IF NOT EXISTS journey_rod_threshold_profiles (
      rod_id BIGINT PRIMARY KEY REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      dimension_definitions JSONB NOT NULL DEFAULT '[]',
      combinations JSONB NOT NULL DEFAULT '[]',
      configured_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS journey_rod_actors (
      id BIGSERIAL PRIMARY KEY, rod_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      actor_key TEXT NOT NULL, role_key TEXT NOT NULL, contribution_status TEXT NOT NULL DEFAULT 'invited',
      contribution JSONB NOT NULL DEFAULT '{}', required_from_stage TEXT, added_at BIGINT NOT NULL,
      UNIQUE(rod_id, actor_key, role_key)
    );
    CREATE TABLE IF NOT EXISTS journey_rod_decisions (
      id BIGSERIAL PRIMARY KEY, rod_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      decision_type TEXT NOT NULL, proposed_action JSONB NOT NULL DEFAULT '{}', human_prompt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', requested_at BIGINT NOT NULL, decided_at BIGINT,
      decided_by BIGINT REFERENCES users(id) ON DELETE SET NULL, decision_notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_rod_decisions_pending ON journey_rod_decisions (status, requested_at);
  `);

  const nowJourney = Date.now();
  for (const gate of [
    ['revenue_lifecycle','first_interaction','First Interaction',0],
    ['revenue_lifecycle','qualified_context','Qualified Context',10],
    // Promotion gate for lead-lineage rods (Member Organization Leads): once a
    // revenue_lifecycle rod tied to a lead reaches this stage, journeyRods.js
    // transitionRodOwnership() re-links it from lead_id to org_id — this is
    // the lead "becoming" the org's Revenue Journey Data Rod, not a new rod.
    ['revenue_lifecycle','qualified_opportunity','Qualified Opportunity',15],
    ['revenue_lifecycle','solution_fit','Solution Fit',20],
    ['revenue_lifecycle','scope_defined','Scope Defined',30],
    ['revenue_lifecycle','proposal','Proposal',40],
    ['revenue_lifecycle','committed','Committed',50],
    ['revenue_lifecycle','customer','Customer',60],
    ['member','lead','Lead',0],
    ['member','member_active','Member Active',10],
    ['customer','member_profile','Member Profile',0],
    ['customer','organization_connected','Organization Connected',10],
  ]) {
    await sql.unsafe(`INSERT INTO journey_stage_gates (rod_type, stage_key, label, sort_order, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$5) ON CONFLICT (rod_type, stage_key) DO UPDATE SET label=EXCLUDED.label, sort_order=EXCLUDED.sort_order, updated_at=EXCLUDED.updated_at`,
      [gate[0], gate[1], gate[2], gate[3], nowJourney]);
  }

  // ── EIDOS Operating Model schema (Salt Basin Divergent State Mechanics) ──
  // Extends the journey_data_rods family above with the layers documented in
  // docs/eidos-operating-model-playbook.md. Phase 1 is broad-shallow: schema
  // + basic CRUD for every layer; real settlement-density math, accounting-
  // topology inference, and Port query/sync execution are deferred to a
  // later phase (see that doc's "non-goals"). New definition tables carry an
  // optional org_id column — NULL = global/platform default, set = an
  // org-scoped override — the same alternate-scope pattern journey_data_rods
  // already uses for lead_id/user_id/org_id. Already-shipped tables
  // (journey_metadata_molecules/clusters) are extended with ADD COLUMN only;
  // their existing UNIQUE constraints are untouched.
  await sql.unsafe(`
    -- L2 Evidence Atoms — additive columns onto the already-shipped atom
    -- definition + instance tables.
    ALTER TABLE journey_metadata_molecules ADD COLUMN IF NOT EXISTS canonical_definition TEXT;
    ALTER TABLE journey_metadata_molecules ADD COLUMN IF NOT EXISTS value_domain TEXT;
    ALTER TABLE journey_metadata_molecules ADD COLUMN IF NOT EXISTS mutability_class TEXT NOT NULL DEFAULT 'revisable';
    ALTER TABLE journey_rod_evidence ADD COLUMN IF NOT EXISTS effective_from BIGINT;
    ALTER TABLE journey_rod_evidence ADD COLUMN IF NOT EXISTS effective_to BIGINT;
    ALTER TABLE journey_rod_evidence ADD COLUMN IF NOT EXISTS lineage_parent_id BIGINT REFERENCES journey_rod_evidence(id) ON DELETE SET NULL;

    -- L3 Semantic Fields — journey_metadata_clusters doubles as "semantic
    -- field"; alignment_rules is separate from the existing molecule_keys
    -- membership list because affinity (relevance to a cluster) and
    -- alignment (compatibility with the cluster's other members) are
    -- deliberately distinct axes.
    ALTER TABLE journey_metadata_clusters ADD COLUMN IF NOT EXISTS alignment_rules JSONB NOT NULL DEFAULT '[]';

    CREATE TABLE IF NOT EXISTS journey_atom_affinity_rules (
      id BIGSERIAL PRIMARY KEY,
      cluster_key TEXT NOT NULL REFERENCES journey_metadata_clusters(cluster_key) ON DELETE CASCADE,
      molecule_key TEXT NOT NULL REFERENCES journey_metadata_molecules(molecule_key) ON DELETE CASCADE,
      org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
      minimum_affinity NUMERIC NOT NULL DEFAULT 0.5,
      source_authority_modifier NUMERIC NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_affinity_rule_global ON journey_atom_affinity_rules (cluster_key, molecule_key) WHERE org_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_affinity_rule_org ON journey_atom_affinity_rules (cluster_key, molecule_key, org_id) WHERE org_id IS NOT NULL;

    -- L1 Ports — governed interfaces to external source systems. Governance
    -- metadata only; does not replace or touch server/lib/oauthProviders.js.
    CREATE TABLE IF NOT EXISTS data_ports (
      id BIGSERIAL PRIMARY KEY,
      port_key TEXT NOT NULL,
      org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      port_type TEXT NOT NULL DEFAULT 'crm',
      native_system_type TEXT,
      environment TEXT NOT NULL DEFAULT 'production',
      query_mode TEXT NOT NULL DEFAULT 'pull',
      centralization_allowed BOOLEAN NOT NULL DEFAULT true,
      policy JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_data_ports_key_global ON data_ports (port_key) WHERE org_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_data_ports_key_org ON data_ports (port_key, org_id) WHERE org_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS port_source_objects (
      id BIGSERIAL PRIMARY KEY,
      port_id BIGINT NOT NULL REFERENCES data_ports(id) ON DELETE CASCADE,
      object_key TEXT NOT NULL,
      native_object_name TEXT NOT NULL,
      business_definition TEXT,
      natural_key_definition TEXT,
      system_of_record_claim TEXT,
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE(port_id, object_key)
    );

    CREATE TABLE IF NOT EXISTS port_source_fields (
      id BIGSERIAL PRIMARY KEY,
      source_object_id BIGINT NOT NULL REFERENCES port_source_objects(id) ON DELETE CASCADE,
      field_key TEXT NOT NULL,
      native_field_name TEXT NOT NULL,
      business_definition TEXT,
      value_domain TEXT,
      editable_roles JSONB NOT NULL DEFAULT '[]',
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE(source_object_id, field_key)
    );

    -- L5 Settlement — how corroborated a molecule's contribution to one
    -- specific rod's projection is, computed per (rod, molecule) pair, never
    -- stored on the atom itself. Table + read path only in this phase; not
    -- yet wired into journeyRods.js evaluateJourneyRod()'s gate math.
    CREATE TABLE IF NOT EXISTS journey_rod_settlement_states (
      id BIGSERIAL PRIMARY KEY,
      rod_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      molecule_key TEXT NOT NULL,
      settlement_density NUMERIC NOT NULL DEFAULT 0,
      settlement_class TEXT NOT NULL DEFAULT 'surface',
        -- surface | water | suspended | sediment | bedrock
      computed_at BIGINT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      UNIQUE(rod_id, molecule_key)
    );
    CREATE INDEX IF NOT EXISTS idx_settlement_rod ON journey_rod_settlement_states (rod_id);

    -- L6 Journey Rods — a real registry for rod_type, previously a bare TEXT
    -- column with no canonical list anywhere.
    CREATE TABLE IF NOT EXISTS journey_rod_types (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );

    -- L7 Accounting — Reciprocal Economic-Accounting State Projection
    -- (Invention 4, docs/salt-basin-divergent-state-mechanics-claim-tree.md
    -- §9). Skeleton + CRUD only; no posting/GL-sync logic in this phase.
    CREATE TABLE IF NOT EXISTS accounting_policies (
      id BIGSERIAL PRIMARY KEY,
      policy_key TEXT NOT NULL,
      org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
      framework TEXT NOT NULL DEFAULT 'GAAP',
      legal_entity TEXT,
      jurisdiction TEXT,
      recognition_rules JSONB NOT NULL DEFAULT '{}',
      measurement_rules JSONB NOT NULL DEFAULT '{}',
      allocation_rules JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_accounting_policy_global ON accounting_policies (policy_key) WHERE org_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_accounting_policy_org ON accounting_policies (policy_key, org_id) WHERE org_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS gl_accounts (
      id BIGSERIAL PRIMARY KEY,
      account_key TEXT NOT NULL,
      org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
      native_account_id TEXT,
      legal_entity TEXT,
      account_type TEXT NOT NULL DEFAULT 'asset',
        -- asset | liability | equity | revenue | expense
      normal_balance TEXT NOT NULL DEFAULT 'debit',
        -- debit | credit
      semantic_definition TEXT,
      permitted_event_classes JSONB NOT NULL DEFAULT '[]',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_gl_account_global ON gl_accounts (account_key) WHERE org_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_gl_account_org ON gl_accounts (account_key, org_id) WHERE org_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS accounting_topology_definitions (
      id BIGSERIAL PRIMARY KEY,
      topology_key TEXT NOT NULL,
      org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      economic_composition_requirements JSONB NOT NULL DEFAULT '[]',
      required_account_roles JSONB NOT NULL DEFAULT '[]',
      balancing_constraints JSONB NOT NULL DEFAULT '{}',
      policy_id BIGINT REFERENCES accounting_policies(id) ON DELETE SET NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_topology_def_global ON accounting_topology_definitions (topology_key) WHERE org_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_topology_def_org ON accounting_topology_definitions (topology_key, org_id) WHERE org_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS journal_entries (
      id BIGSERIAL PRIMARY KEY,
      org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
      rod_id BIGINT REFERENCES journey_data_rods(id) ON DELETE SET NULL,
      native_journal_id TEXT,
      legal_entity TEXT,
      accounting_date BIGINT,
      posting_date BIGINT,
      effective_date BIGINT,
      currency TEXT NOT NULL DEFAULT 'USD',
      total_debit NUMERIC NOT NULL DEFAULT 0,
      total_credit NUMERIC NOT NULL DEFAULT 0,
      source_type TEXT NOT NULL DEFAULT 'manual',
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_journal_entries_org ON journal_entries (org_id);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_rod ON journal_entries (rod_id);

    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id BIGSERIAL PRIMARY KEY,
      journal_entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      line_sequence INTEGER NOT NULL DEFAULT 0,
      gl_account_id BIGINT REFERENCES gl_accounts(id) ON DELETE SET NULL,
      debit_amount NUMERIC NOT NULL DEFAULT 0,
      credit_amount NUMERIC NOT NULL DEFAULT 0,
      dimensions JSONB NOT NULL DEFAULT '{}',
      description TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_je_lines_entry ON journal_entry_lines (journal_entry_id);

    -- L8 Reciprocal Inference — divergence between an independently-derived
    -- journey projection and an accounting-implied economic composition for
    -- the same journey identity. Skeleton + a stub computation entry point
    -- only; the inference algorithm itself is still research-stage (see the
    -- claim-tree doc §9).
    CREATE TABLE IF NOT EXISTS economic_composition_requirements (
      id BIGSERIAL PRIMARY KEY,
      topology_id BIGINT NOT NULL REFERENCES accounting_topology_definitions(id) ON DELETE CASCADE,
      required_composition_type TEXT NOT NULL,
      required_state JSONB NOT NULL DEFAULT '{}',
      necessity_type TEXT NOT NULL DEFAULT 'required',
        -- required | conditional | explanatory
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reciprocity_comparisons (
      id BIGSERIAL PRIMARY KEY,
      rod_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      journal_entry_id BIGINT REFERENCES journal_entries(id) ON DELETE SET NULL,
      actual_coordinate NUMERIC,
      inferred_coordinate NUMERIC,
      axial_difference NUMERIC,
      reciprocity_state TEXT NOT NULL DEFAULT 'indeterminate',
        -- aligned | divergent | indeterminate
      computed_at BIGINT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_reciprocity_rod ON reciprocity_comparisons (rod_id);

    CREATE TABLE IF NOT EXISTS divergence_states (
      id BIGSERIAL PRIMARY KEY,
      rod_id_a BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      rod_id_b BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      axial_divergence NUMERIC NOT NULL DEFAULT 0,
      density_divergence NUMERIC NOT NULL DEFAULT 0,
      divergence_rate NUMERIC NOT NULL DEFAULT 0,
      divergence_acceleration NUMERIC NOT NULL DEFAULT 0,
      boundary_exceeded BOOLEAN NOT NULL DEFAULT false,
      computed_at BIGINT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_divergence_pair ON divergence_states (rod_id_a, rod_id_b);

    -- Legacy Maturity Observation (migrations/terminology-migration-registry.json
    -- rule #5: "Maturity Score" -> preferred term "Legacy Maturity Observation",
    -- targetObjectType historical_observation. Preserves a rod's pre-EIDOS
    -- stage_score verbatim, with its observation time, as a historical fact —
    -- explicitly NOT equated to journey coordinate or settlement (that's
    -- journey_rod_settlement_states, computed independently from real
    -- evidence). journey_data_rods.stage_score itself is never renamed or
    -- dropped; this is an additive preservation record, not a replacement.
    CREATE TABLE IF NOT EXISTS historical_observations (
      id BIGSERIAL PRIMARY KEY,
      rod_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      observation_type TEXT NOT NULL DEFAULT 'legacy_maturity_score',
      observed_value NUMERIC,
      observed_at BIGINT NOT NULL,
      source_term TEXT NOT NULL DEFAULT 'stage_score',
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at BIGINT NOT NULL,
      UNIQUE(rod_id, observation_type, observed_at)
    );
    CREATE INDEX IF NOT EXISTS idx_historical_observations_rod ON historical_observations (rod_id);

    -- Loop 14 (§38 Real-Time Multi-User Collaboration) — presence slice.
    -- Full scope (real-time transport + Agent collaborative-reasoning
    -- compilation across simultaneous users) is a larger build than one
    -- pass; this is the real, working first slice: who is at a checkpoint
    -- right now, doing what, visible to whom. TTL-expired via last_seen_at
    -- rather than a hard delete-on-disconnect, since there is no websocket
    -- transport yet — the API layer (server/routes/presence.js) is a
    -- heartbeat/poll model, upgradeable to push transport later without a
    -- schema change.
    CREATE TABLE IF NOT EXISTS checkpoint_presence (
      id BIGSERIAL PRIMARY KEY,
      rod_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
      checkpoint_stage TEXT NOT NULL,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      selected_molecule_key TEXT,
      active_agent_id TEXT,
      action_state TEXT NOT NULL DEFAULT 'viewing',
        -- viewing | editing | proposing
      visibility_scope TEXT NOT NULL DEFAULT 'ORGANIZATION_SHARED',
        -- reuses the canonical Data Scope enum (server/lib/financialPolicyRegistry.js DATA_SCOPES)
      last_seen_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      UNIQUE(rod_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_checkpoint_presence_rod ON checkpoint_presence (rod_id, last_seen_at);

    -- Resume Output Projection (master-org-admin-config.md §5, 2026-07-16).
    -- "A Resume Output is a projection of the canonical Career state ... Do
    -- not create a second resume data record. Create an Output Projection."
    -- The existing member_json_store 'resume_presets' blob remains the
    -- reusable CONFIGURATION (template/layout/section choices) — this table
    -- is the separate, new thing: a lineage-tracked snapshot of *when* a
    -- member generated output from that configuration and what Career state
    -- backed it, so staleness can be detected without silently rewriting an
    -- approved output.
    CREATE TABLE IF NOT EXISTS resume_output_projections (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      preset_id TEXT NOT NULL,
      preset_name TEXT,
      included_sections JSONB NOT NULL DEFAULT '[]',
      career_state_fingerprint TEXT NOT NULL,
      atom_count INTEGER NOT NULL DEFAULT 0,
      generated_at BIGINT NOT NULL,
      effective_career_state_at BIGINT NOT NULL,
      output_status TEXT NOT NULL DEFAULT 'draft',
        -- draft | approved | published | archived
      lineage_root_id BIGINT REFERENCES resume_output_projections(id) ON DELETE SET NULL,
      target_job_description TEXT,
      targeting_result JSONB,
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_resume_output_projections_user ON resume_output_projections (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_resume_output_projections_lineage ON resume_output_projections (lineage_root_id);
  `);

  // Additive columns for the already-existing resume_output_projections
  // table (2026-08-07, real resume generation): career_opportunity_rod_id is
  // the actual "attached to the career pipeline lead" link — a generated
  // resume tied to the specific career_opportunity_target rod it was
  // written for. generated_content holds the real, evidence-grounded resume
  // section content generateResumeContent() (resumeTargeting.js) produces —
  // distinct from the pre-existing targeting_result, which is only
  // category-emphasis metadata, never actual resume prose.
  try {
    await sql.unsafe(`ALTER TABLE resume_output_projections ADD COLUMN IF NOT EXISTS career_opportunity_rod_id BIGINT REFERENCES journey_data_rods(id) ON DELETE SET NULL`);
    await sql.unsafe(`ALTER TABLE resume_output_projections ADD COLUMN IF NOT EXISTS generated_content JSONB`);
  } catch (e) {
    console.warn('[db] resume_output_projections agent-generation columns warning:', e.message);
  }

  // output_type (2026-08-09, cover letters): distinguishes a resume
  // projection from a cover-letter projection in the SAME table/list/status
  // workflow rather than a parallel one — cover letters are just another
  // kind of generated output attached to an opportunity.
  try {
    await sql.unsafe(`ALTER TABLE resume_output_projections ADD COLUMN IF NOT EXISTS output_type TEXT NOT NULL DEFAULT 'resume'`);
  } catch (e) {
    console.warn('[db] resume_output_projections output_type column warning:', e.message);
  }

  // source (2026-08-09, output view/export/import): distinguishes a
  // member-imported document (an existing resume/cover-letter PDF or DOCX
  // they already had) from one this platform generated — both go through
  // the identical view/PDF/ZIP/email pipeline, this only labels provenance
  // for the UI, never gates functionality.
  try {
    await sql.unsafe(`ALTER TABLE resume_output_projections ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ai_generated'`);
  } catch (e) {
    console.warn('[db] resume_output_projections source column warning:', e.message);
  }

  await sql.unsafe(`
    -- ── Organization Document Projections (2026-07-27) ──────────────────────
    -- Satellite table for the 'customer_document_delivery' Tributary
    -- (server/lib/tributaryRegistry.js) — gated proposal / product-resource
    -- documents delivered to a Customer Channel Journey's organization.
    -- Mirrors resume_output_projections' satellite shape: a real, typed table
    -- (not a journey_data_rods row pretending to be generic), linked back to
    -- its parent Customer rod via parent_rod_id + rod_relationship_type.
    CREATE TABLE IF NOT EXISTS org_document_projections (
      id BIGSERIAL PRIMARY KEY,
      org_id BIGINT NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
      parent_rod_id BIGINT REFERENCES journey_data_rods(id) ON DELETE SET NULL,
      rod_relationship_type TEXT,
      document_type TEXT NOT NULL,
        -- 'proposal' | 'product_resource'
      title TEXT NOT NULL,
      summary TEXT,
      content JSONB NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
        -- draft | published | archived
      created_by BIGINT REFERENCES users(id),
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_org_doc_projections_org ON org_document_projections (org_id, document_type);
  `);
  // Additive — job-description-targeted resume output (2026-07-27). Both
  // columns are nullable and absent for every pre-existing projection row.
  await sql.unsafe(`ALTER TABLE resume_output_projections ADD COLUMN IF NOT EXISTS target_job_description TEXT`)
    .catch((e) => console.warn('[db] resume_output_projections target_job_description backfill warning:', e.message));
  await sql.unsafe(`ALTER TABLE resume_output_projections ADD COLUMN IF NOT EXISTS targeting_result JSONB`)
    .catch((e) => console.warn('[db] resume_output_projections targeting_result backfill warning:', e.message));

  // Legacy Maturity Observation backfill — insert-only, one snapshot per rod
  // of its stage_score at the time this migration ran. Never re-runs for a
  // rod that already has one (ON CONFLICT DO NOTHING), so a later stage_score
  // change creates a new observation on the *next* explicit backfill rather
  // than silently rewriting history here.
  await sql.unsafe(`
    INSERT INTO historical_observations (rod_id, observation_type, observed_value, observed_at, source_term, metadata, created_at)
    SELECT r.id, 'legacy_maturity_score', r.stage_score, r.updated_at, 'stage_score',
      '{"migrationRule":"terminology-migration-registry.json#Maturity Score","note":"Preserved verbatim; not equated to journey coordinate or settlement."}'::jsonb,
      EXTRACT(EPOCH FROM NOW())::bigint*1000
    FROM journey_data_rods r
    WHERE NOT EXISTS (
      SELECT 1 FROM historical_observations h WHERE h.rod_id = r.id AND h.observation_type = 'legacy_maturity_score'
    );
  `);

  // Canonical Atom + Semantic Field seed — journey_metadata_molecules/
  // journey_metadata_clusters were real, empty tables (schema shipped, zero
  // rows). This is the master build prompt's own §34 worked example
  // ("How does ARR relate to pipeline, onboarded customers, and actual user
  // adoption?"), used verbatim as the seed source rather than invented
  // business vocabulary — insert-only, never overwrites an admin's later
  // edit to label/definition/is_active.
  const nowAtomSeed = Date.now();
  for (const [key, label, dataType, canonicalDefinition, valueDomain] of [
    ['arr', 'ARR', 'currency', 'Annual recurring revenue attributed to this Channel Rod.', 'currency_usd'],
    ['opportunity_amount', 'Opportunity Amount', 'currency', 'Total contract value of the open opportunity.', 'currency_usd'],
    ['probability', 'Probability', 'percentage', 'Sales-stage-derived likelihood of the opportunity closing.', 'percentage_0_100'],
    ['contract_effective_date', 'Contract Effective Date', 'date', 'The date contractual obligations begin.', 'date'],
    ['onboarding_state', 'Onboarding State', 'enum', 'Where the customer is in provisioning/onboarding.', 'onboarding_state_enum'],
    ['provisioned_user_count', 'Provisioned User Count', 'integer', 'Number of user seats provisioned under the contract.', 'integer_nonneg'],
    ['active_user_count', 'Active User Count', 'integer', 'Number of provisioned users observed as actively using the product.', 'integer_nonneg'],
    ['adoption_rate', 'Adoption Rate', 'percentage', 'active_user_count / provisioned_user_count.', 'percentage_0_100'],
  ]) {
    await sql.unsafe(
      `INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,canonical_definition,value_domain,mutability_class,created_at,updated_at)
       VALUES ($1,$2,$3,'[]'::jsonb,'{}'::jsonb,false,true,$4,$5,'revisable',$6,$6) ON CONFLICT (molecule_key) DO NOTHING`,
      [key, label, dataType, canonicalDefinition, valueDomain, nowAtomSeed]
    );
  }
  for (const [key, label, description, moleculeKeys] of [
    ['revenue_recognition_readiness', 'Revenue Recognition Readiness', 'Master prompt §34 worked example: "How does ARR relate to pipeline?" — the commercial-commitment atoms.', ['arr', 'opportunity_amount', 'probability', 'contract_effective_date']],
    ['adoption_signal', 'Adoption Signal', 'Master prompt §34 worked example: "...onboarded customers, and actual user adoption?" — the consumption atoms.', ['onboarding_state', 'provisioned_user_count', 'active_user_count', 'adoption_rate']],
  ]) {
    await sql.unsafe(
      `INSERT INTO journey_metadata_clusters (cluster_key,label,description,molecule_keys,completion_rule,minimum_count,is_active,alignment_rules,created_at,updated_at)
       VALUES ($1,$2,$3,$4::jsonb,'all',NULL,true,'[]'::jsonb,$5,$5) ON CONFLICT (cluster_key) DO NOTHING`,
      [key, label, description, moleculeKeys, nowAtomSeed]
    );
  }

  // Career Atom + Career Molecule vocabulary seed (master prompt §77,
  // 2026-07-16) — generated from server/lib/careerAtomRegistry.js's
  // table-driven field mapping (79 atoms across 7 entry types) rather than
  // hand-authored, same reasoning as the scenario generator. Definitions
  // only; the actual career_* row migration into journey_rod_evidence is a
  // separate, explicit one-time action (server/lib/careerAtomMigration.js)
  // since it touches real per-member data, not vocabulary.
  const nowCareerAtomSeed = Date.now();
  for (const atom of generateCareerAtomDefinitions()) {
    await sql.unsafe(
      `INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,canonical_definition,value_domain,mutability_class,created_at,updated_at)
       VALUES ($1,$2,$3,'[]'::jsonb,'{}'::jsonb,false,true,$4,NULL,'revisable',$5,$5) ON CONFLICT (molecule_key) DO NOTHING`,
      [atom.atomKey, atom.label, atom.dataType, `Migrated from legacy ${atom.sourceTable}.${atom.sourceColumn}.`, nowCareerAtomSeed]
    );
  }
  for (const molecule of generateCareerMoleculeDefinitions()) {
    await sql.unsafe(
      `INSERT INTO journey_metadata_clusters (cluster_key,label,description,molecule_keys,completion_rule,minimum_count,is_active,alignment_rules,created_at,updated_at)
       VALUES ($1,$2,$3,$4::jsonb,'all',NULL,true,'[]'::jsonb,$5,$5) ON CONFLICT (cluster_key) DO NOTHING`,
      [molecule.entryType, molecule.label, `Migrated from legacy ${molecule.sourceTable} rows — one Career Molecule instance per row, distinguished by source_reference on the underlying journey_rod_evidence.`, molecule.atomKeys, nowCareerAtomSeed]
    );
  }

  // Career Bonding Rules seed (2026-07-27, Career Configuration Overhaul
  // Phase 1) — journey_atom_affinity_rules was real schema, zero rows for
  // any Career cluster/atom pair. Every Career Atom belongs to exactly one
  // Career Molecule (entryType) by deterministic table-column membership
  // (careerAtomRegistry.js's own generator), so minimum_affinity=1.0 here
  // records "this atom IS a member of this molecule," not a fuzzy threshold
  // — the fuzzy-matching case (an uploaded Excel header or AI-proposed
  // resume field label that doesn't arrive as a real atomKey) is handled at
  // request time by careerBondingEngine.js's looser DEFAULT_MINIMUM_AFFINITY
  // against these same atom definitions, not by a second seeded rule set.
  for (const atom of generateCareerAtomDefinitions()) {
    await sql.unsafe(
      `INSERT INTO journey_atom_affinity_rules (cluster_key,molecule_key,minimum_affinity,source_authority_modifier,metadata,is_active,created_at,updated_at)
       VALUES ($1,$2,1.0,0,'{}'::jsonb,true,$3,$3) ON CONFLICT (cluster_key, molecule_key) WHERE org_id IS NULL DO NOTHING`,
      [atom.entryType, atom.atomKey, nowCareerAtomSeed]
    );
  }

  // Signal + Business Hypothesis Atom/Molecule vocabulary seed (OBJ-013/
  // OBJ-014, 2026-07-29 Lonetree MVP build) — same reuse-first mechanism as
  // the EIDOS worked-example and Career Atom seeds above: new Atom
  // definitions in journey_metadata_molecules, grouped by a new cluster_key
  // in journey_metadata_clusters. No new tables. Instances are
  // journey_rod_evidence rows against these molecule_keys on whichever
  // Channel Rod (e.g. a Portfolio Company's commercial/revenue rod)
  // originates the Signal or Hypothesis.
  const nowLonetreeAtomSeed = Date.now();
  for (const def of [generateSignalMoleculeDefinitions(), generateBusinessHypothesisMoleculeDefinitions()]) {
    for (const atom of def.atoms) {
      await sql.unsafe(
        `INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,canonical_definition,value_domain,mutability_class,created_at,updated_at)
         VALUES ($1,$2,$3,'[]'::jsonb,'{}'::jsonb,false,true,$4,NULL,'revisable',$5,$5) ON CONFLICT (molecule_key) DO NOTHING`,
        [atom.atomKey, atom.label, atom.dataType, atom.canonicalDefinition, nowLonetreeAtomSeed]
      );
    }
    await sql.unsafe(
      `INSERT INTO journey_metadata_clusters (cluster_key,label,description,molecule_keys,completion_rule,minimum_count,is_active,alignment_rules,created_at,updated_at)
       VALUES ($1,$2,$3,$4::jsonb,'any',1,true,'[]'::jsonb,$5,$5) ON CONFLICT (cluster_key) DO NOTHING`,
      [def.cluster.clusterKey, def.cluster.label, def.cluster.description, def.cluster.atomKeys, nowLonetreeAtomSeed]
    );
  }

  // Record-level Atom definitions for the Lonetree PortCo commercial/fund
  // reconciliation chain (2026-07-29) — see lonetreeDemoRegistry.js's own
  // header comment for why these are record-level (one atom per business
  // object type, not per field). Definitions only; no cluster (each is used
  // standalone against a rod, not as a completion-gated group).
  const recordAtomSeed = generateRecordAtomDefinitions();
  for (const atom of recordAtomSeed.atoms) {
    await sql.unsafe(
      `INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,canonical_definition,value_domain,mutability_class,created_at,updated_at)
       VALUES ($1,$2,$3,'[]'::jsonb,'{}'::jsonb,false,true,$4,NULL,'revisable',$5,$5) ON CONFLICT (molecule_key) DO NOTHING`,
      [atom.atomKey, atom.label, atom.dataType, atom.canonicalDefinition, recordAtomSeed.now]
    );
  }

  // Member Experience Module — Proposal Experience record-atom + delta-atom
  // vocabulary seed (2026-07-29, Salt_Basin_MVP_Proposal_Experience_Delta_
  // Spec_v0.1). Same reuse-first mechanism as the Lonetree Signal/Business
  // Hypothesis seed above and the EIDOS worked example: new Atom definitions
  // in journey_metadata_molecules, no new tables. Definitions only — no
  // cluster, since each record atom is used standalone against a member's
  // proposal_experience rod, not as a completion-gated group (same choice as
  // generateRecordAtomDefinitions() above).
  const nowProposalAtomSeed = Date.now();
  for (const atomSeed of [generateDeltaAtomDefinitions(), generateRecordMoleculeAtomDefinitions()]) {
    for (const atom of atomSeed.atoms) {
      await sql.unsafe(
        `INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,canonical_definition,value_domain,mutability_class,created_at,updated_at)
         VALUES ($1,$2,$3,'[]'::jsonb,'{}'::jsonb,false,true,$4,NULL,'revisable',$5,$5) ON CONFLICT (molecule_key) DO NOTHING`,
        [atom.atomKey, atom.label, atom.dataType, atom.canonicalDefinition, nowProposalAtomSeed]
      );
    }
  }

  // journey_rod_types backfill — insert-only (never overwrite an admin's
  // is_active/label/description edit on a later boot). The 3 shipped types
  // plus 8 aspirational types from docs/salt-basin-hos-journey-methodology.md,
  // seeded inactive until an admin turns them on.
  const nowRodTypes = Date.now();
  for (const [rtId, rtLabel, rtDescription, rtActive, rtSort] of [
    ['revenue_lifecycle', 'Revenue Lifecycle', 'Lead through closed revenue and renewal.', true, 0],
    ['member', 'Member', "An individual's own journey as a portal member.", true, 1],
    ['customer', 'Customer', "An organization's journey as a paying counterparty.", true, 2],
    ['fund_deal', 'Fund Deal', 'A private equity or investment fund deal lifecycle.', false, 10],
    ['portfolio_company', 'Portfolio Company', 'A fund-owned operating company journey.', false, 11],
    ['contract_obligation', 'Contract Obligation', 'A single contractual obligation lifecycle.', false, 12],
    ['financial_transaction', 'Financial Transaction', 'A discrete financial transaction lifecycle.', false, 13],
    ['resource_contribution', 'Resource Contribution', 'An internal resource/staffing contribution lifecycle.', false, 14],
    ['confidence_reconciliation', 'Confidence Reconciliation', 'Cross-source confidence reconciliation lifecycle.', false, 15],
    ['product_definition', 'Product Definition', 'A product/offering definition lifecycle.', false, 16],
    ['value_creation', 'Value Creation', 'A value-creation initiative lifecycle.', false, 17],
    ['member_entitlement', 'Member Entitlement', 'A Member\'s provisioned access to one product/feature module — one rod per module, formed from the Member Channel Rod.', true, 2],
    ['public_site', 'Public Site', "A Member's Personal Brand Website/World, governed as a Channel Rod per the Salt Basin data model.", true, 3],
    ['career_master', 'Career Master', "A Member's Career Master — Career Atoms and Resume Output Projection source, governed as a Channel Rod.", true, 4],
    ['proposal_experience', 'Proposal / Member Experience', "A Member's guided 9-stage Proposal Experience journey (Welcome->Workspace) — the landing experience on /member login, governed as a Channel Rod (2026-07-29, Member Experience Module).", true, 5],
    ['commercial_opportunity_target', 'Commercial Opportunity Target', 'A tracked company/event-pair opportunity in the Salt Basin commercial pipeline — one rod per company-event pair per the Weekly Research & Outreach Master Agent spec (2026-08-06).', true, 6],
    ['career_opportunity_target', 'Career Opportunity Target', "A tracked external job opening/lead in a Member's career pipeline, Tributary-linked to their own Career Master rod — one rod per opportunity per the Weekly Research & Outreach Master Agent spec (2026-08-06).", true, 7],
    ['career_outreach_effort', 'Career Outreach Effort', "A member's hiring-manager-research + direct-outreach process for one applied-to career opportunity — Tributary-linked (hierarchical) to the career_opportunity_target rod it's pursuing outreach for (2026-08-09).", true, 8],
  ]) {
    await sql.unsafe(
      `INSERT INTO journey_rod_types (id, label, description, is_active, sort_order, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$6) ON CONFLICT (id) DO NOTHING`,
      [rtId, rtLabel, rtDescription, rtActive, rtSort, nowRodTypes]
    );
  }

  // Lead sessions — password-based access cookie scoped to one lead record.
  // Separate from `sessions` (admin/member) so authentication concerns stay
  // partitioned.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS lead_sessions (
      token       TEXT PRIMARY KEY,
      lead_id     BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      expires_at  BIGINT NOT NULL,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_lead_sessions_lead ON lead_sessions (lead_id);
    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads (phone) WHERE phone IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_active ON leads (id) WHERE merged_into_id IS NULL;

    CREATE TABLE IF NOT EXISTS lead_email_addresses (
      id          BIGSERIAL PRIMARY KEY,
      lead_id     BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      email       TEXT NOT NULL,
      email_type  TEXT NOT NULL DEFAULT 'personal',
      org_name    TEXT,
      is_primary  BOOLEAN NOT NULL DEFAULT false,
      subscribed  BOOLEAN NOT NULL DEFAULT true,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      UNIQUE(lead_id, email)
    );
    CREATE INDEX IF NOT EXISTS idx_lea_lead ON lead_email_addresses (lead_id);
  `);

  // Multi-tenant CMS: each member gets their own draft + published site, plus
  // their own config (brand colors, opt-in flags, BYO Claude key). Same JSON
  // shape as the platform-level site_state / config_state.
  //
  // Deploy-safety invariant: bootstrap()/seed.js only ever ADD COLUMN or
  // insert missing platform-wide rows — they must never UPDATE or reseed an
  // existing member_sites/member_configs/member_profiles row. Schema changes
  // to the JSON shape are versioned (`version`/`schemaVersion` field inside
  // the JSON) and migrated per-member explicitly, not applied in bulk here.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS member_sites (
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL CHECK (kind IN ('draft', 'published')),
      data        TEXT NOT NULL,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      PRIMARY KEY (user_id, kind)
    );

    CREATE TABLE IF NOT EXISTS member_configs (
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL CHECK (kind IN ('draft', 'published')),
      data        TEXT NOT NULL,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      PRIMARY KEY (user_id, kind)
    );

    -- Partial index over the published config to make the public "featured
    -- members" lookup cheap. The opt-in flag lives in JSON; we still need a
    -- regular index on user_id so the join from member_profiles is fast.
    CREATE INDEX IF NOT EXISTS idx_member_configs_published_user
      ON member_configs (user_id) WHERE kind = 'published';
  `);

  // Multi-email per user. A member's signup email is their primary (stored in
  // users.email). Additional personal/work emails are stored here. Any verified
  // row can be used to log in. The signup email is also inserted here as a
  // verified 'primary' row so the email list UI shows it.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS user_emails (
      id                  BIGSERIAL PRIMARY KEY,
      user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email               TEXT NOT NULL,
      type                TEXT NOT NULL DEFAULT 'personal',
      verified            BOOLEAN NOT NULL DEFAULT false,
      verification_code   TEXT,
      code_expires_at     BIGINT,
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      UNIQUE(email)
    );
    CREATE INDEX IF NOT EXISTS idx_user_emails_user ON user_emails (user_id);
    CREATE INDEX IF NOT EXISTS idx_user_emails_verified ON user_emails (email) WHERE verified = true;
  `);

  // ── Audit log — every write action across the platform. ──
  // actor_id nullable to allow pre-auth events (failed logins). entity_id is
  // a stringified PK so it works for every table. summary is human-readable;
  // diff stores before/after JSON for config/site saves.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id            BIGSERIAL PRIMARY KEY,
      actor_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
      actor_email   TEXT,
      actor_role    TEXT,
      action        TEXT NOT NULL,
      entity_type   TEXT,
      entity_id     TEXT,
      summary       TEXT,
      diff          TEXT,
      ip            TEXT,
      user_agent    TEXT,
      created_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_audit_actor    ON audit_log (actor_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_entity   ON audit_log (entity_type, entity_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_log (created_at DESC);

    -- Consent actions (2026-07-16) — the authoritative, timestamped record of
    -- every consent grant/revoke, modeled on audit_log above. Career Master's
    -- existing redaction_ack/public_output_validation_ack/
    -- no_private_name_persistence_ack booleans on career_intake_documents
    -- stay in place for backward compatibility, but this table (not those
    -- booleans) is the record of truth going forward: one row per action,
    -- never overwritten, full history, not a mutable flag. Consent is
    -- required BEFORE any career configuration/upload/orbit entry — see
    -- consentRegistry.js.
    CREATE TABLE IF NOT EXISTS consent_actions (
      id             BIGSERIAL PRIMARY KEY,
      user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      consent_type   TEXT NOT NULL,
      action         TEXT NOT NULL, -- 'granted' | 'revoked'
      consent_version TEXT NOT NULL,
      context        JSONB NOT NULL DEFAULT '{}',
      ip             TEXT,
      user_agent     TEXT,
      created_at     BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_consent_actions_user ON consent_actions (user_id, consent_type, created_at DESC);
  `);

  // ── Page events — visitor analytics for member profile pages + platform. ──
  // Logged server-side on every GET /api/member-site/by-slug/:slug. No PII
  // beyond IP (hashed). member_slug=null for platform pages.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS page_events (
      id            BIGSERIAL PRIMARY KEY,
      member_slug   TEXT,
      page_slug     TEXT,
      referrer      TEXT,
      user_agent    TEXT,
      ip_hash       TEXT,
      created_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_page_events_member  ON page_events (member_slug, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_page_events_created ON page_events (created_at DESC);
  `);

  // ── Backlog / Requirements Management (admin-only) ──
  //
  // Phase 1: capability_groups + backlog_items.
  // Future phases will add: deployments (Render/Netlify/GitHub sync),
  // test_cases + test_scripts + test_runs, defects, time/token logs.
  //
  // backlog_items.kind is open-ended ('feature' | 'defect' | 'chore' | 'spike')
  // so defects from failed test runs (future) slot in without a new table.
  //
  // Text fields (requirement_detail, business_rules, etc.) are markdown-ish
  // — UI renders newlines and bullet syntax but doesn't parse to HTML, so
  // there's no XSS risk on read.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS capability_groups (
      id           BIGSERIAL PRIMARY KEY,
      slug         TEXT NOT NULL UNIQUE,         -- e.g. 'multi-tenant-cms'
      name         TEXT NOT NULL,                -- e.g. 'Multi-tenant CMS'
      description  TEXT,
      color        TEXT,                         -- hex used for chips
      sort_order   INTEGER NOT NULL DEFAULT 0,
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS backlog_items (
      id                  BIGSERIAL PRIMARY KEY,
      capability_id       BIGINT REFERENCES capability_groups(id) ON DELETE SET NULL,
      parent_id           BIGINT REFERENCES backlog_items(id) ON DELETE SET NULL,  -- defect → feature
      kind                TEXT NOT NULL DEFAULT 'feature',  -- feature | defect | chore | spike
      title               TEXT NOT NULL,
      summary             TEXT,                  -- one-liner shown on the card
      user_story          TEXT,                  -- "As X, I want Y, so that Z"
      requirement_detail  TEXT,
      business_rules      TEXT,
      design_spec         TEXT,
      acceptance_criteria TEXT,
      process_steps       TEXT,                  -- functional process steps impacted
      status              TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | completed | deployed | blocked | archived
      priority            TEXT,                  -- p0 | p1 | p2 | p3
      work_split_claude   INTEGER,               -- 0..100, % done by Claude
      time_minutes        INTEGER,               -- estimated minutes spent
      deployed_github     BOOLEAN NOT NULL DEFAULT false,
      deployed_render     BOOLEAN NOT NULL DEFAULT false,
      deployed_netlify    BOOLEAN NOT NULL DEFAULT false,
      deploy_relevance    TEXT,                  -- JSON {github:bool,render:bool,netlify:bool} — which systems even apply
      tags                TEXT,                  -- JSON array of free-form tags
      external_ref        TEXT,                  -- commit sha / PR url / task id from earlier tracking
      sort_order          INTEGER NOT NULL DEFAULT 0,
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE INDEX IF NOT EXISTS idx_backlog_capability  ON backlog_items (capability_id);
    CREATE INDEX IF NOT EXISTS idx_backlog_status      ON backlog_items (status);
    CREATE INDEX IF NOT EXISTS idx_backlog_kind        ON backlog_items (kind);
    CREATE INDEX IF NOT EXISTS idx_backlog_parent      ON backlog_items (parent_id) WHERE parent_id IS NOT NULL;
  `);

  // Backlog Phase 1.5: extend with tech_stack (on capability_groups for the
  // "tech per capability" view) + cost_usd_claude (per item).
  await sql.unsafe(`
    ALTER TABLE capability_groups ADD COLUMN IF NOT EXISTS tech_stack TEXT;       -- JSON array of tools/services used
    ALTER TABLE backlog_items     ADD COLUMN IF NOT EXISTS tech_stack TEXT;       -- optional per-item override
    ALTER TABLE backlog_items     ADD COLUMN IF NOT EXISTS cost_usd_claude NUMERIC;
  `);

  // Backlog Phase 1.6: hours and activity counts BY PERSON. Replaces the
  // single work_split_claude % with explicit breakdowns. Old columns stay
  // for back-compat but the per-person fields are now the source of truth
  // for capability rollups.
  await sql.unsafe(`
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS hours_betsy NUMERIC;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS hours_claude NUMERIC;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS activities_betsy INTEGER;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS activities_claude INTEGER;
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS traditional_cost_usd NUMERIC;  -- estimated pre-AI cost
  `);

  // One-time backfill: if hours_* are NULL but the legacy fields exist,
  // compute splits from time_minutes + work_split_claude. Activities are
  // estimated at ~10min per Claude activity, ~20min per Betsy activity.
  // Idempotent — only runs where new fields are still null.
  await sql.unsafe(`
    UPDATE backlog_items
       SET hours_claude = ROUND((time_minutes / 60.0) * COALESCE(work_split_claude, 50) / 100.0, 2),
           hours_betsy  = ROUND((time_minutes / 60.0) * (100 - COALESCE(work_split_claude, 50)) / 100.0, 2)
     WHERE hours_claude IS NULL
       AND time_minutes IS NOT NULL;

    UPDATE backlog_items
       SET activities_claude = GREATEST(1, CEILING(hours_claude * 6)),
           activities_betsy  = GREATEST(1, CEILING(hours_betsy  * 3))
     WHERE activities_claude IS NULL
       AND hours_claude IS NOT NULL;

    -- Pre-AI cost: total hours × $175/hr onshore-senior benchmark rate
    -- (RATE_CONFIGS_2026 benchmark_onshore_senior in contributionMethodology.js).
    -- Assumes a traditional team takes the same wall-clock duration — not a
    -- separately-estimated engineer-equivalent effort, which remains a
    -- disclosed unverified gap (see RETROACTIVE_SESSION_ANALYSIS.knownGaps).
    UPDATE backlog_items
       SET traditional_cost_usd = ROUND(((COALESCE(hours_claude, 0) + COALESCE(hours_betsy, 0)) * 175)::numeric, 2)
     WHERE traditional_cost_usd IS NULL;

    -- Claude build cost: hoursClaude × $115/hr quality-adjusted rate
    -- (RATE_CONFIGS_2026 claude_quality_adjusted).
    UPDATE backlog_items
       SET cost_usd_claude = ROUND((COALESCE(hours_claude, 0) * 115)::numeric, 2)
     WHERE cost_usd_claude IS NULL
       AND hours_claude IS NOT NULL;
  `);

  // Tier workarounds — capture the strategic decisions we made to stay on
  // free tiers instead of upgrading. Surfaced on the build-summary one-pager
  // and editable from the Backlog admin.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS tier_workarounds (
      id                BIGSERIAL PRIMARY KEY,
      capability_id     BIGINT REFERENCES capability_groups(id) ON DELETE SET NULL,
      product           TEXT NOT NULL,         -- 'Netlify', 'Resend', 'Zoho', etc.
      tier_avoided      TEXT,                  -- e.g. 'Netlify Pro ($19/mo)'
      monthly_savings   NUMERIC,               -- USD/mo we avoided
      problem           TEXT NOT NULL,         -- what would have forced an upgrade
      solution          TEXT NOT NULL,         -- how we worked around it
      sort_order        INTEGER NOT NULL DEFAULT 0,
      created_at        BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_tier_workarounds_capability ON tier_workarounds (capability_id);
  `);

  // ── Session 2: JIRA integration + Member Templates + Scrum Agent ──
  //
  // jira_config: one row keyed by 'singleton'. Stores the API token plus
  // project metadata. Token is stored as TEXT (Postgres at rest is encrypted
  // by Supabase). A future hardening step would add app-layer encryption.
  //
  // member_templates: curated starter templates a member can apply to their
  // site. pages_preset matches member_sites.draft shape; brand_kit follows
  // defaultMemberConfig.brand.
  //
  // agent_threads + agent_messages: one thread per conversation. messages
  // store user/assistant turns + proposed tool calls (awaiting approval) for
  // the Phase 2 propose-and-approve flow.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS jira_config (
      id            TEXT PRIMARY KEY,
      base_url      TEXT,
      email         TEXT,
      api_token     TEXT,
      project_key   TEXT,
      field_map     TEXT,
      last_pull_at  BIGINT,
      updated_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS member_templates (
      id                BIGSERIAL PRIMARY KEY,
      slug              TEXT NOT NULL UNIQUE,
      name              TEXT NOT NULL,
      archetype         TEXT,
      tagline           TEXT,
      description       TEXT,
      preview_image_url TEXT,
      brand_kit         TEXT,
      pages_preset      TEXT NOT NULL,
      sort_order        INTEGER NOT NULL DEFAULT 0,
      created_at        BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS agent_threads (
      id          BIGSERIAL PRIMARY KEY,
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL DEFAULT 'scrum',
      title       TEXT,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS agent_messages (
      id           BIGSERIAL PRIMARY KEY,
      thread_id    BIGINT NOT NULL REFERENCES agent_threads(id) ON DELETE CASCADE,
      role         TEXT NOT NULL,
      content      TEXT NOT NULL,
      tool_calls   TEXT,
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_agent_messages_thread ON agent_messages (thread_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_agent_threads_user    ON agent_threads (user_id, updated_at DESC);

    -- backlog_items.jira_issue_key for round-trip identification.
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS jira_issue_key TEXT;
    CREATE INDEX IF NOT EXISTS idx_backlog_jira_key ON backlog_items (jira_issue_key) WHERE jira_issue_key IS NOT NULL;

    -- ── Personal profiles (1:1 with users, auto-created at signup) ─────────
    CREATE TABLE IF NOT EXISTS personal_profiles (
      id           BIGSERIAL PRIMARY KEY,
      user_id      BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT,
      bio          TEXT,
      avatar_url   TEXT,
      location     TEXT,
      pronouns     TEXT,
      metadata     JSONB NOT NULL DEFAULT '{}',
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_personal_profiles_user ON personal_profiles (user_id);

    -- ── Organization profiles ────────────────────────────────────────────────
    -- An org can be anything from a solo LLC to a large enterprise.
    -- org_type drives which integration categories are surfaced in the UI.
    CREATE TABLE IF NOT EXISTS organization_profiles (
      id           BIGSERIAL PRIMARY KEY,
      slug         TEXT NOT NULL UNIQUE,
      name         TEXT NOT NULL,
      org_type     TEXT NOT NULL DEFAULT 'llc',
        -- sole_proprietor | llc | corporation | partnership | nonprofit
        -- | freelance_platform | client_org
      description  TEXT,
      logo_url     TEXT,
      website      TEXT,
      industry     TEXT,
      metadata     JSONB NOT NULL DEFAULT '{}',
      -- Traces this org back to the Member Organization Lead that qualified
      -- into it (see server/lib/journeyRods.js promoteLeadToOrganizationLead /
      -- the qualified_opportunity promotion) — null for orgs created directly
      -- through the member dashboard's self-service flow, which has no lead
      -- lineage. NOT the same as org creation itself; this only gets set when
      -- an org is born from a promoted lead.
      originating_lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    ALTER TABLE organization_profiles ADD COLUMN IF NOT EXISTS originating_lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL;
    -- Lets a verified work email's domain find-or-create its organization —
    -- see ensureCustomerOrgFromWorkEmail() in server/lib/journeyRods.js.
    -- Null for every org created through any other path (lead promotion,
    -- self-service dashboard creation).
    ALTER TABLE organization_profiles ADD COLUMN IF NOT EXISTS email_domain TEXT;
    CREATE INDEX IF NOT EXISTS idx_org_profiles_slug ON organization_profiles (slug);
    CREATE INDEX IF NOT EXISTS idx_org_profiles_originating_lead ON organization_profiles (originating_lead_id);
    CREATE INDEX IF NOT EXISTS idx_org_profiles_email_domain ON organization_profiles (email_domain) WHERE email_domain IS NOT NULL;

    -- ── Master data account records ──────────────────────────────────────────
    -- One row per Member (created at lead→member conversion) and one row per
    -- qualifying Member Organization (created when its lead-lineage rod is
    -- promoted to a Revenue Journey Data Rod). Admin/system-visible only for
    -- now — no member-facing UI reads this yet.
    CREATE TABLE IF NOT EXISTS account_records (
      id           BIGSERIAL PRIMARY KEY,
      account_type TEXT NOT NULL, -- 'member' | 'organization'
      user_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
      org_id       BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
      lead_id      BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      display_name TEXT,
      metadata     JSONB NOT NULL DEFAULT '{}',
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_account_records_user ON account_records (user_id) WHERE user_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_account_records_org ON account_records (org_id) WHERE org_id IS NOT NULL;

    -- ── Org memberships (user ↔ org, with role) ──────────────────────────────
    -- Role vocabulary: 'admin' (the mandatory seat — every org must have at
    -- least one) | 'member' | 'viewer' (a restricted/specialized permission
    -- set). There is no 'owner' — equity/ownership-stake relationships
    -- between orgs are a separate concept from platform admin rights and are
    -- modeled elsewhere, not as a membership role.
    CREATE TABLE IF NOT EXISTS org_memberships (
      id         BIGSERIAL PRIMARY KEY,
      user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      org_id     BIGINT NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
      role       TEXT NOT NULL DEFAULT 'member',
        -- admin | member | viewer
      invited_by BIGINT REFERENCES users(id),
      joined_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      UNIQUE (user_id, org_id)
    );
    CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON org_memberships (user_id);
    CREATE INDEX IF NOT EXISTS idx_org_memberships_org  ON org_memberships (org_id);

    CREATE TABLE IF NOT EXISTS org_sites (
      org_id BIGINT NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('draft', 'published')),
      data TEXT NOT NULL,
      updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      PRIMARY KEY (org_id, kind)
    );
    CREATE TABLE IF NOT EXISTS org_configs (
      org_id BIGINT NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('draft', 'published')),
      data TEXT NOT NULL,
      updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      PRIMARY KEY (org_id, kind)
    );

    -- One-shot, idempotent: the 'owner' role was folded into 'admin' — an org
    -- admin already has full management rights, and ownership stakes are a
    -- separate (not-yet-modeled) concept. No-ops once no 'owner' rows remain.
    UPDATE org_memberships SET role = 'admin' WHERE role = 'owner';

    -- ── Personal → org links (self-employed connecting their own LLC, etc.) ──
    CREATE TABLE IF NOT EXISTS personal_org_links (
      personal_profile_id BIGINT NOT NULL REFERENCES personal_profiles(id) ON DELETE CASCADE,
      org_id              BIGINT NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
      linked_at           BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      PRIMARY KEY (personal_profile_id, org_id)
    );

    -- ── Product licenses ─────────────────────────────────────────────────────
    -- A license grants a user access to a Salt Basin product (finbridgeco,
    -- handoveros, etc.) scoped to a specific org profile.
    CREATE TABLE IF NOT EXISTS product_licenses (
      id           BIGSERIAL PRIMARY KEY,
      user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      org_id       BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
      product_id   TEXT NOT NULL,  -- 'finbridgeco' | 'handoveros' | 'saltbasin_pro'
      tier         TEXT NOT NULL DEFAULT 'standard',  -- standard | professional | enterprise
      granted_by   BIGINT REFERENCES users(id),       -- null = self-service
      granted_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      expires_at   BIGINT,         -- null = perpetual
      is_active    BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE INDEX IF NOT EXISTS idx_licenses_user    ON product_licenses (user_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_org     ON product_licenses (org_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_product ON product_licenses (product_id);

    -- ── Data entitlements (what a licensed user can access within an org) ───
    CREATE TABLE IF NOT EXISTS data_entitlements (
      id         BIGSERIAL PRIMARY KEY,
      license_id BIGINT NOT NULL REFERENCES product_licenses(id) ON DELETE CASCADE,
      scope      JSONB NOT NULL DEFAULT '{}',
        -- { capabilities: ['arr','nrr',...], providers: ['salesforce','snowflake'],
        --   maxRows: 10000, allowExport: false }
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    -- ── OAuth connections (scoped to personal profile or org) ───────────────
    -- profile_scope: 'personal' | 'org'
    -- profile_id: personal_profiles.id OR organization_profiles.id
    CREATE TABLE IF NOT EXISTS oauth_connections (
      id                BIGSERIAL PRIMARY KEY,
      user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      profile_scope     TEXT NOT NULL DEFAULT 'personal',
      profile_id        BIGINT NOT NULL,
      provider          TEXT NOT NULL,
      external_id       TEXT,
      label             TEXT,
      access_token_enc  TEXT NOT NULL,
      refresh_token_enc TEXT,
      token_expires_at  BIGINT,
      scopes            TEXT,
      metadata          JSONB NOT NULL DEFAULT '{}',
      allow_write       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at        BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at        BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      UNIQUE (profile_scope, profile_id, provider)
    );
    CREATE INDEX IF NOT EXISTS idx_oauth_user         ON oauth_connections (user_id);
    CREATE INDEX IF NOT EXISTS idx_oauth_profile      ON oauth_connections (profile_scope, profile_id);
    CREATE INDEX IF NOT EXISTS idx_oauth_provider     ON oauth_connections (provider);

    -- Personal financial connections are Member-owned. Tokens remain in the
    -- provider vault/secure token architecture and never become Evidence Atoms.
    CREATE TABLE IF NOT EXISTS financial_consents (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
      permitted_account_classes JSONB NOT NULL DEFAULT '[]',
      granted_at BIGINT NOT NULL,
      revoked_at BIGINT,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_financial_consents_user ON financial_consents(user_id);

    CREATE TABLE IF NOT EXISTS external_financial_connections (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL,
      provider_connection_ref TEXT,
      connection_type TEXT NOT NULL,
      consent_id BIGINT NOT NULL REFERENCES financial_consents(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','attention_required','revoked','expired')),
      permitted_account_classes JSONB NOT NULL DEFAULT '[]',
      security_policy_id TEXT NOT NULL,
      retention_policy_id TEXT NOT NULL,
      data_scope TEXT NOT NULL DEFAULT 'MEMBER_PRIVATE' CHECK (data_scope='MEMBER_PRIVATE'),
      last_successful_refresh_at BIGINT,
      next_refresh_at BIGINT,
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_financial_connections_user ON external_financial_connections(user_id);

    CREATE TABLE IF NOT EXISTS financial_account_definitions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      connection_id BIGINT NOT NULL REFERENCES external_financial_connections(id) ON DELETE CASCADE,
      provider_account_ref TEXT,
      account_class TEXT NOT NULL CHECK (account_class IN ('checking','savings','money_market','credit_card','personal_loan','unsecured_line_of_credit','other')),
      liability_class TEXT NOT NULL CHECK (liability_class IN ('unsecured','secured','not_applicable','unknown')),
      institution_name TEXT NOT NULL,
      account_display_name TEXT NOT NULL,
      masked_account_reference TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      semantic_atom_refs JSONB NOT NULL DEFAULT '{}',
      connection_status TEXT NOT NULL DEFAULT 'active',
      security_policy_id TEXT NOT NULL,
      data_scope TEXT NOT NULL DEFAULT 'MEMBER_PRIVATE' CHECK (data_scope='MEMBER_PRIVATE'),
      effective_from BIGINT NOT NULL,
      effective_to BIGINT,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      UNIQUE(connection_id, provider_account_ref)
    );
    CREATE INDEX IF NOT EXISTS idx_financial_accounts_user ON financial_account_definitions(user_id);

    -- Only derived/authorized outputs may cross into an Organization context.
    -- Raw connections and account definitions have no org_id column by design.
    CREATE TABLE IF NOT EXISTS financial_output_shares (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      org_id BIGINT NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
      output_type TEXT NOT NULL,
      output_payload JSONB NOT NULL,
      source_account_ids JSONB NOT NULL DEFAULT '[]',
      data_scope TEXT NOT NULL DEFAULT 'ORGANIZATION_SHARED' CHECK (data_scope='ORGANIZATION_SHARED'),
      consent_statement TEXT NOT NULL,
      revoked_at BIGINT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_financial_output_shares_member ON financial_output_shares(user_id);
    CREATE INDEX IF NOT EXISTS idx_financial_output_shares_org ON financial_output_shares(org_id);

    -- Keep old table for backward compat during migration — new code writes oauth_connections.
    CREATE TABLE IF NOT EXISTS member_oauth_connections (
      id               BIGSERIAL PRIMARY KEY,
      user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider         TEXT NOT NULL,
      external_id      TEXT,
      label            TEXT,
      access_token_enc TEXT NOT NULL,
      refresh_token_enc TEXT,
      token_expires_at BIGINT,
      scopes           TEXT,
      metadata         JSONB NOT NULL DEFAULT '{}',
      allow_write      BOOLEAN NOT NULL DEFAULT FALSE,
      created_at       BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at       BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      UNIQUE (user_id, provider)
    );
    CREATE INDEX IF NOT EXISTS idx_legacy_oauth_user     ON member_oauth_connections (user_id);
    CREATE INDEX IF NOT EXISTS idx_legacy_oauth_provider ON member_oauth_connections (provider);
  `);

  await sql.unsafe(`
    INSERT INTO journey_data_rods (rod_type,lead_id,current_stage,metadata,created_at,updated_at)
    SELECT 'revenue_lifecycle',l.id,'first_interaction','{"backfilled":true}'::jsonb,l.created_at,EXTRACT(EPOCH FROM NOW())::bigint*1000
    FROM leads l WHERE l.merged_into_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM journey_data_rods r WHERE r.lead_id=l.id AND r.rod_type='revenue_lifecycle' AND r.user_id IS NULL AND r.org_id IS NULL);

    INSERT INTO journey_data_rods (rod_type,user_id,personal_profile_id,current_stage,metadata,created_at,updated_at)
    SELECT 'member',u.id,pp.id,'member_active','{"backfilled":true}'::jsonb,COALESCE(pp.created_at,EXTRACT(EPOCH FROM NOW())::bigint*1000),EXTRACT(EPOCH FROM NOW())::bigint*1000
    FROM users u LEFT JOIN personal_profiles pp ON pp.user_id=u.id WHERE u.role='member'
      AND NOT EXISTS (SELECT 1 FROM journey_data_rods r WHERE r.user_id=u.id AND r.rod_type='member' AND r.org_id IS NULL);

    INSERT INTO journey_data_rods (rod_type,user_id,personal_profile_id,current_stage,metadata,created_at,updated_at)
    SELECT t.rod_type,u.id,pp.id,CASE WHEN t.rod_type='customer' THEN 'member_profile' ELSE 'first_interaction' END,
      '{"backfilled":true,"payerRequired":false}'::jsonb,COALESCE(pp.created_at,EXTRACT(EPOCH FROM NOW())::bigint*1000),EXTRACT(EPOCH FROM NOW())::bigint*1000
    FROM users u LEFT JOIN personal_profiles pp ON pp.user_id=u.id CROSS JOIN (VALUES ('customer'),('revenue_lifecycle')) t(rod_type)
    WHERE u.role='member' AND NOT EXISTS (SELECT 1 FROM journey_data_rods r WHERE r.user_id=u.id AND r.rod_type=t.rod_type AND r.org_id IS NULL);

    INSERT INTO journey_data_rods (rod_type,user_id,org_id,current_stage,metadata,created_at,updated_at)
    SELECT t.rod_type,om.user_id,om.org_id,CASE WHEN t.rod_type='customer' THEN 'organization_connected' ELSE 'first_interaction' END,
      '{"backfilled":true,"payerRequired":false,"tracksOrganizationPotential":true}'::jsonb,om.joined_at,EXTRACT(EPOCH FROM NOW())::bigint*1000
    FROM org_memberships om CROSS JOIN (VALUES ('customer'),('revenue_lifecycle')) t(rod_type)
    WHERE NOT EXISTS (SELECT 1 FROM journey_data_rods r WHERE r.user_id=om.user_id AND r.org_id=om.org_id AND r.rod_type=t.rod_type);
  `);

  // ── QA: test scenarios, scripts, runs, per-step results ──
  //
  // Every deployed backlog_item gets one or more test_scenarios. A scenario's
  // numbered test_scenario_steps form its script (action + expected outcome
  // per row). A test_run is one execution of a scenario by a tester in a
  // given environment ('test' | 'prod'); test_run_step_results stores the
  // pass/fail/blocked verdict per step. Any failing step auto-creates a
  // backlog_items row with kind='defect', and the defect_backlog_item_id
  // column on test_run_step_results captures that link so the UI can navigate
  // run → failing step → defect → original feature.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS test_scenarios (
      id                  BIGSERIAL PRIMARY KEY,
      backlog_item_id     BIGINT REFERENCES backlog_items(id) ON DELETE CASCADE,  -- the feature this scenario covers
      capability_id       BIGINT REFERENCES capability_groups(id) ON DELETE SET NULL,
      title               TEXT NOT NULL,
      summary             TEXT,
      preconditions       TEXT,
      environment_scope   TEXT NOT NULL DEFAULT 'both' CHECK (environment_scope IN ('test', 'prod', 'both')),
      priority            TEXT,                            -- p0 | p1 | p2 | p3
      sort_order          INTEGER NOT NULL DEFAULT 0,
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS test_scenario_steps (
      id                  BIGSERIAL PRIMARY KEY,
      scenario_id         BIGINT NOT NULL REFERENCES test_scenarios(id) ON DELETE CASCADE,
      step_order          INTEGER NOT NULL,                -- 1-based position within the scenario
      action              TEXT NOT NULL,                   -- what the tester does
      expected_outcome    TEXT NOT NULL,                   -- what should happen
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS test_runs (
      id                  BIGSERIAL PRIMARY KEY,
      scenario_id         BIGINT NOT NULL REFERENCES test_scenarios(id) ON DELETE CASCADE,
      tester_user_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
      environment         TEXT NOT NULL CHECK (environment IN ('test', 'prod')),
      overall_result      TEXT NOT NULL CHECK (overall_result IN ('pass', 'fail', 'blocked')),
      notes               TEXT,
      run_at              BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS test_run_step_results (
      id                       BIGSERIAL PRIMARY KEY,
      run_id                   BIGINT NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
      step_id                  BIGINT NOT NULL REFERENCES test_scenario_steps(id) ON DELETE CASCADE,
      result                   TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'blocked')),
      notes                    TEXT,
      evidence_url             TEXT,
      defect_backlog_item_id   BIGINT REFERENCES backlog_items(id) ON DELETE SET NULL,
      created_at               BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE INDEX IF NOT EXISTS idx_test_scenarios_backlog     ON test_scenarios (backlog_item_id);
    CREATE INDEX IF NOT EXISTS idx_test_scenarios_capability  ON test_scenarios (capability_id);
    CREATE INDEX IF NOT EXISTS idx_test_scenario_steps_sc     ON test_scenario_steps (scenario_id, step_order);
    CREATE INDEX IF NOT EXISTS idx_test_runs_scenario         ON test_runs (scenario_id, run_at DESC);
    CREATE INDEX IF NOT EXISTS idx_test_runs_tester           ON test_runs (tester_user_id);
    CREATE INDEX IF NOT EXISTS idx_test_run_step_results_run  ON test_run_step_results (run_id);
    CREATE INDEX IF NOT EXISTS idx_test_run_step_results_def  ON test_run_step_results (defect_backlog_item_id) WHERE defect_backlog_item_id IS NOT NULL;

    -- Backwards link from defect backlog_items to the scenario that surfaced it.
    -- parent_id still points to the ORIGINAL feature backlog_item (so the
    -- defect groups under the feature in the existing tree), and
    -- test_scenario_id captures which scenario's run produced the defect.
    ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS test_scenario_id BIGINT REFERENCES test_scenarios(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_backlog_test_scenario ON backlog_items (test_scenario_id) WHERE test_scenario_id IS NOT NULL;
  `);

  // ── Audit log for every mutation on backlog + QA entities ──
  //
  // Every POST/PATCH/DELETE on /api/backlog/* and /api/qa/* routes through
  // server/audit.js writeAudit() and lands here. Same table whether the change
  // came from a manual form, an approved brain-dump reconciler proposal, a
  // bulk ingestion script, a JIRA sync, or initial seed — the `source` column
  // distinguishes them.
  //
  // before_value / after_value are JSONB (not TEXT like other JSON-ish columns
  // in this schema) because we'll query into the history for diffs and
  // field-level forensics. The deviation from the surrounding convention is
  // intentional: an audit log without queryable structure is just a haystack.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id              BIGSERIAL PRIMARY KEY,
      user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
      entity_type     TEXT NOT NULL,                  -- 'backlog_item' | 'test_scenario' | 'test_scenario_step' | 'test_run' | 'test_run_step_result' | 'capability_group'
      entity_id       BIGINT NOT NULL,
      action          TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change')),
      before_value    JSONB,                          -- NULL on create
      after_value     JSONB,                          -- NULL on delete
      source          TEXT NOT NULL CHECK (source IN ('manual_ui', 'brain_dump', 'bulk_script', 'jira_sync', 'seed')),
      reason          TEXT,                           -- optional context (brain-dump original prompt, PR description, etc.)
      created_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE INDEX IF NOT EXISTS idx_audit_entity  ON audit_events (entity_type, entity_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_events (user_id, created_at DESC) WHERE user_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_audit_source  ON audit_events (source, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events (created_at DESC);
  `);

  // ── Build progress snapshots ──
  //
  // Periodic rollup snapshots of the build-summary totals so we can chart
  // progress over time. /api/backlog/summary lazily inserts one snapshot per
  // UTC day on first access (idempotent — second access same-day no-ops);
  // admin can also force-capture via POST /api/backlog/snapshot with an
  // optional note for milestone labelling ("baseline", "post-launch", etc.).
  //
  // full_payload mirrors the /summary response JSONB so future chart series
  // can pull any metric without a new column.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS build_progress_snapshots (
      id                     BIGSERIAL PRIMARY KEY,
      captured_at            BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      captured_date          DATE NOT NULL DEFAULT CURRENT_DATE,  -- UTC; dedup key for daily idempotency
      requirements_total     INTEGER NOT NULL,
      requirements_delivered INTEGER NOT NULL,
      hours_claude           NUMERIC NOT NULL DEFAULT 0,
      hours_betsy            NUMERIC NOT NULL DEFAULT 0,
      activities_claude      INTEGER NOT NULL DEFAULT 0,
      activities_betsy       INTEGER NOT NULL DEFAULT 0,
      cost_usd_claude        NUMERIC NOT NULL DEFAULT 0,
      traditional_cost_usd   NUMERIC NOT NULL DEFAULT 0,
      ai_savings_usd         NUMERIC NOT NULL DEFAULT 0,
      monthly_tier_savings   NUMERIC NOT NULL DEFAULT 0,
      full_payload           JSONB NOT NULL,
      capture_source         TEXT NOT NULL DEFAULT 'auto' CHECK (capture_source IN ('auto', 'manual', 'baseline', 'milestone')),
      note                   TEXT,
      UNIQUE (captured_date, capture_source)
    );

    CREATE INDEX IF NOT EXISTS idx_bps_captured_at ON build_progress_snapshots (captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bps_captured_date ON build_progress_snapshots (captured_date DESC);
  `);

  // ── Password reset tokens ──
  //
  // Single-use, time-limited tokens for the "Forgot password?" flow. POST
  // /api/auth/reset-request generates a row + emails the user a link to
  // /reset/<token>; the reset page POSTs to /api/auth/reset-confirm which
  // verifies expiry + un-used + updates users.password_hash + stamps used_at.
  //
  // Tokens are opaque random strings, not signed JWTs — server is the
  // source of truth and revocation is immediate (delete the row).
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token       TEXT PRIMARY KEY,
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at  BIGINT NOT NULL,
      used_at     BIGINT,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens (user_id);
    CREATE INDEX IF NOT EXISTS idx_prt_active ON password_reset_tokens (expires_at) WHERE used_at IS NULL;
  `);

  // ── QA: many-to-many between scenarios and the features they cover ──
  //
  // A scenario can cover multiple deployed features (e.g., "sign up with
  // email + phone" exercises lead-capture, email-validation, AND phone-
  // validation). The junction lets us link any number, and `is_primary`
  // designates which one auto-created defects should parent to. We keep
  // test_scenarios.backlog_item_id as a denormalized cache of the primary,
  // so the defect-creation logic in /api/qa/runs doesn't need to look up
  // the junction on every failed step.
  //
  // Partial unique index enforces "at most one primary per scenario."
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS test_scenario_features (
      scenario_id      BIGINT NOT NULL REFERENCES test_scenarios(id) ON DELETE CASCADE,
      backlog_item_id  BIGINT NOT NULL REFERENCES backlog_items(id) ON DELETE CASCADE,
      is_primary       BOOLEAN NOT NULL DEFAULT false,
      sort_order       INTEGER NOT NULL DEFAULT 0,
      created_at       BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      PRIMARY KEY (scenario_id, backlog_item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_tsf_scenario ON test_scenario_features (scenario_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_tsf_feature  ON test_scenario_features (backlog_item_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tsf_one_primary
      ON test_scenario_features (scenario_id)
      WHERE is_primary;
  `);

  // Backfill: any pre-existing scenario whose junction is empty but which has
  // a backlog_item_id gets its primary feature populated in the junction.
  // Idempotent — only touches scenarios with no junction rows yet.
  await sql.unsafe(`
    INSERT INTO test_scenario_features (scenario_id, backlog_item_id, is_primary)
    SELECT ts.id, ts.backlog_item_id, true
      FROM test_scenarios ts
     WHERE ts.backlog_item_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM test_scenario_features tsf
          WHERE tsf.scenario_id = ts.id
       );
  `);

  // ── Seed: default admin_nav into config_state if missing ──
  //
  // The admin nav structure (views + tabs + ordering) lives as a JSON blob
  // under config_state with id='admin_nav'. Loaded once at boot if missing
  // so AdminShell always has a structure to render. Members ignore this —
  // their nav stays hardcoded (only 2 tabs and no need for grouping).
  //
  // To re-seed after manual edits: DELETE the row in config_state where
  // id='admin_nav' and reboot. The structure can also be edited via PUT
  // /api/config/admin-nav (admin-only).
  const existingNav = await sql.unsafe(`SELECT id, data FROM config_state WHERE id = 'admin_nav'`);
  // The member's primary editing surface is "My Profile" (not "Content" / "My Site").
  // Profile = single source of truth for a member's career + brand data; public site
  // and generated outputs (resume PDF etc.) read from this. See project memory
  // "project-saltbasin-profile-vision".
  const defaultNav = {
    views: [
      { id: 'content', label: 'My Profile', sortOrder: 0, tabs: [
        { id: 'content', label: 'My Profile', componentId: 'content', sortOrder: 0 },
      ]},
      { id: 'plm', label: 'Platform Lifecycle Management', sortOrder: 1, tabs: [
        { id: 'plm-dashboard', label: 'Operating Model', componentId: 'plmDashboard', sortOrder: 0 },
        { id: 'backlog', label: 'Backlog', componentId: 'backlog', sortOrder: 1 },
        { id: 'qa',      label: 'QA',      componentId: 'qa',      sortOrder: 2 },
      ]},
      { id: 'crm', label: 'Customer Relationship Management', sortOrder: 2, tabs: [
        { id: 'leads',    label: 'Leads',    componentId: 'leads',    sortOrder: 0 },
        { id: 'networks', label: 'Net Works', componentId: 'networks', sortOrder: 1 },
      ]},
      { id: 'system', label: 'System', sortOrder: 3, tabs: [
        { id: 'config', label: 'Config', componentId: 'config', sortOrder: 0 },
      ]},
    ],
  };
  const now = Date.now();
  if (existingNav.length === 0) {
    await sql.unsafe(
      `INSERT INTO config_state (id, data, updated_at) VALUES ($1, $2, $3)`,
      ['admin_nav', JSON.stringify(defaultNav), now]
    );
  } else {
    // One-shot relabel: the previous boot seeded the content view with label
    // "Content" / "My Site". Bump those to "My Profile" without touching any
    // manual edits the admin may have made to OTHER views (PLM/CRM/System).
    // We only rewrite if the content view still has the legacy labels.
    try {
      const current = JSON.parse(existingNav[0].data);
      let changed = false;
      const contentView = (current.views || []).find((v) => v.id === 'content');
      if (contentView) {
        if (contentView.label === 'Content') { contentView.label = 'My Profile'; changed = true; }
        const contentTab = (contentView.tabs || []).find((t) => t.id === 'content');
        if (contentTab && (contentTab.label === 'My Site' || contentTab.label === 'Content')) {
          contentTab.label = 'My Profile'; changed = true;
        }
        // One-shot: inject "My Resume" tab into the content view if not already present.
        const hasResume = (contentView.tabs || []).some((t) => t.id === 'resume');
        if (!hasResume) {
          contentView.tabs = [
            ...(contentView.tabs || []),
            { id: 'resume', label: 'My Resume', componentId: 'resume', sortOrder: 1 },
          ];
          changed = true;
        }
        // One-shot: inject "Inbox" tab into the content view if not already present.
        const hasInbox = (contentView.tabs || []).some((t) => t.id === 'inbox');
        if (!hasInbox) {
          contentView.tabs = [
            ...(contentView.tabs || []),
            { id: 'inbox', label: 'Inbox', componentId: 'inbox', sortOrder: 10 },
          ];
          changed = true;
        }
      }
      if (changed) {
        await sql.unsafe(
          `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
          [JSON.stringify(current), now]
        );
      }
    } catch {
      // Bad JSON — leave the row alone rather than clobbering manual state.
    }
  }

  // ── Generic member key-value JSON store ────────────────────────────────────
  // Stores arbitrary JSON blobs scoped to a member + key. Used by My Resume
  // (key='resume_presets') and any future member-specific settings that don't
  // fit into the draft/published content model.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS member_json_store (
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key         TEXT NOT NULL,
      data        TEXT NOT NULL DEFAULT '{}',
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      PRIMARY KEY (user_id, key)
    );
    CREATE INDEX IF NOT EXISTS idx_member_json_store_user ON member_json_store (user_id);
  `);

  // ── Field audit log ─────────────────────────────────────────────────────────
  // Records before/after values for fields with auditable: true in fieldMeta.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS field_audit_log (
      id           BIGSERIAL PRIMARY KEY,
      user_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
      section_id   TEXT NOT NULL,
      field_key    TEXT NOT NULL,
      before_value TEXT,
      after_value  TEXT,
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_field_audit_section ON field_audit_log (section_id);
    CREATE INDEX IF NOT EXISTS idx_field_audit_user    ON field_audit_log (user_id);
  `);

  // ── UNIFIED PLATFORM LAYER ────────────────────────────────────────────────
  // Phase 1A: Global Standards Repository + Unified Object Model + NRM +
  // Analytics Events + HERQ content tables + Services Proposal + FinBridgeCo.

  // Platform applications registry
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS platform_applications (
      id               TEXT PRIMARY KEY,
      display_name     TEXT NOT NULL,
      slug             TEXT NOT NULL,
      purpose          TEXT,
      brand_mode       TEXT NOT NULL DEFAULT 'strategic',
      admin_only       BOOLEAN NOT NULL DEFAULT false,
      object_label_map JSONB NOT NULL DEFAULT '{}',
      atomic_set_id    TEXT,
      status           TEXT NOT NULL DEFAULT 'active',
      created_at       BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `);

  // Global Standards Repository — single source of truth for all vocabulary
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS global_standards (
      id           TEXT PRIMARY KEY,
      type         TEXT NOT NULL,
      slug         TEXT NOT NULL,
      display_name TEXT NOT NULL,
      short_label  TEXT,
      description  TEXT,
      parent_id    TEXT REFERENCES global_standards(id),
      status       TEXT NOT NULL DEFAULT 'active',
      metadata     JSONB NOT NULL DEFAULT '{}',
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_gs_type   ON global_standards (type, status);
    CREATE INDEX IF NOT EXISTS idx_gs_slug   ON global_standards (slug);
    CREATE INDEX IF NOT EXISTS idx_gs_parent ON global_standards (parent_id) WHERE parent_id IS NOT NULL;
  `);

  // Pending standards — overrides that need review before merging into global_standards
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS pending_standards (
      id                    TEXT PRIMARY KEY,
      proposed_value        TEXT NOT NULL,
      standard_type         TEXT NOT NULL,
      app_id                TEXT,
      context_ref_id        TEXT,
      proposed_by_user_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
      status                TEXT NOT NULL DEFAULT 'pending',
      review_notes          TEXT,
      published_output_id   TEXT,
      created_at            BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      reviewed_at           BIGINT,
      reviewed_by_user_id   BIGINT REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ps_status ON pending_standards (status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ps_app    ON pending_standards (app_id);
  `);

  // Standard overrides — per-object overrides linked to pending standards
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS standard_overrides (
      id                  TEXT PRIMARY KEY,
      standard_id         TEXT REFERENCES global_standards(id),
      override_value      TEXT NOT NULL,
      app_id              TEXT,
      context_ref_id      TEXT,
      user_id             BIGINT REFERENCES users(id) ON DELETE SET NULL,
      pending_standard_id TEXT REFERENCES pending_standards(id),
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `);

  // Unified content items — shared primitive across all applications
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS unified_content_items (
      id               TEXT PRIMARY KEY,
      app_id           TEXT NOT NULL,
      type             TEXT NOT NULL,
      title            TEXT NOT NULL,
      topic            TEXT,
      summary          TEXT,
      body             JSONB,
      domain_refs      TEXT[],
      capability_refs  TEXT[],
      audience_refs    TEXT[],
      system_refs      TEXT[],
      data_slice_refs  TEXT[],
      source_refs      JSONB,
      export_status    TEXT NOT NULL DEFAULT 'draft',
      export_status_updated_at BIGINT,
      series_ref       TEXT,
      output_refs      TEXT[],
      created_by       BIGINT REFERENCES users(id) ON DELETE SET NULL,
      updated_by       BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at       BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at       BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      metadata         JSONB NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_uci_app    ON unified_content_items (app_id, export_status);
    CREATE INDEX IF NOT EXISTS idx_uci_type   ON unified_content_items (type);
    CREATE INDEX IF NOT EXISTS idx_uci_series ON unified_content_items (series_ref) WHERE series_ref IS NOT NULL;
  `);

  // Unified outputs — configured publishable output documents
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS unified_outputs (
      id              TEXT PRIMARY KEY,
      app_id          TEXT NOT NULL,
      template_ref    TEXT,
      title           TEXT NOT NULL,
      purpose         TEXT,
      source_item_ids TEXT[],
      config          JSONB NOT NULL DEFAULT '{}',
      export_status   TEXT NOT NULL DEFAULT 'draft',
      published_link  TEXT,
      published_at    BIGINT,
      created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
      updated_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      version_history JSONB NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_uo_app    ON unified_outputs (app_id, export_status);
  `);

  // HERQ series versions (5 seeded below)
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS herq_series_versions (
      id                   TEXT PRIMARY KEY,
      acronym              TEXT NOT NULL DEFAULT 'HERQ',
      series_title         TEXT NOT NULL,
      classification_type  TEXT,
      definition           TEXT,
      default_color_token  TEXT,
      status               TEXT NOT NULL DEFAULT 'active',
      target_audience_refs TEXT[],
      zero_post_eligible   BOOLEAN NOT NULL DEFAULT true,
      created_at           BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at           BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `);

  // HERQ research inputs
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS herq_research_inputs (
      id                  TEXT PRIMARY KEY,
      title               TEXT NOT NULL,
      source_name         TEXT,
      source_type         TEXT,
      url                 TEXT,
      retrieved_date      BIGINT,
      stat                TEXT,
      why_it_matters      TEXT,
      verification_status TEXT NOT NULL DEFAULT 'needsVerification',
      linked_post_refs    TEXT[],
      linked_output_refs  TEXT[],
      created_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `);

  // HERQ comment insights
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS herq_comment_insights (
      id                  TEXT PRIMARY KEY,
      source_type         TEXT NOT NULL DEFAULT 'user note',
      body                TEXT NOT NULL,
      author_or_source    TEXT,
      captured_date       BIGINT,
      sentiment           TEXT NOT NULL DEFAULT 'neutral',
      actionability       TEXT NOT NULL DEFAULT 'medium',
      linked_post_refs    TEXT[],
      linked_series_refs  TEXT[],
      linked_domain_refs  TEXT[],
      linked_capability_refs TEXT[],
      follow_up_needed    BOOLEAN NOT NULL DEFAULT false,
      notes               TEXT,
      created_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `);

  // NRM contacts
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS nrm_contacts (
      id                TEXT PRIMARY KEY,
      user_id           BIGINT REFERENCES users(id) ON DELETE SET NULL,
      first_name        TEXT,
      last_name         TEXT,
      email             TEXT,
      org_name          TEXT,
      role_title        TEXT,
      relationship_type TEXT NOT NULL DEFAULT 'contact',
      opted_in          BOOLEAN NOT NULL DEFAULT false,
      contact_group_ids TEXT[],
      domain_refs       TEXT[],
      notes             TEXT,
      last_contacted_at BIGINT,
      owner_user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at        BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at        BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_nrm_contacts_owner ON nrm_contacts (owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_nrm_contacts_user  ON nrm_contacts (user_id) WHERE user_id IS NOT NULL;
  `);

  // NRM contact groups
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS nrm_contact_groups (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT,
      owner_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      created_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `);

  // NRM reference requests — intake from public forms
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS nrm_reference_requests (
      id                      TEXT PRIMARY KEY,
      requester_name          TEXT NOT NULL,
      requester_email         TEXT NOT NULL,
      requester_org           TEXT,
      target_member_user_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
      context                 TEXT,
      status                  TEXT NOT NULL DEFAULT 'new',
      created_at              BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at              BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_nrm_ref_req_target ON nrm_reference_requests (target_member_user_id);
    CREATE INDEX IF NOT EXISTS idx_nrm_ref_req_status ON nrm_reference_requests (status, created_at DESC);
  `);

  // Services proposal access
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS services_proposal_access (
      id             TEXT PRIMARY KEY,
      proposal_id    TEXT NOT NULL,
      user_id        BIGINT REFERENCES users(id) ON DELETE SET NULL,
      org_name       TEXT,
      request_context TEXT,
      lead_id        BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      granted        BOOLEAN NOT NULL DEFAULT true,
      granted_at     BIGINT,
      created_at     BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_spa_proposal ON services_proposal_access (proposal_id);
    CREATE INDEX IF NOT EXISTS idx_spa_user     ON services_proposal_access (user_id) WHERE user_id IS NOT NULL;
  `);

  // Platform analytics events — replaces/extends page_events
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id               BIGSERIAL PRIMARY KEY,
      event_type       TEXT NOT NULL,
      app_id           TEXT,
      object_type      TEXT,
      object_id        TEXT,
      member_user_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
      visitor_user_id  BIGINT REFERENCES users(id) ON DELETE SET NULL,
      session_id       TEXT,
      ip_hash          TEXT,
      referrer_domain  TEXT,
      metadata         JSONB NOT NULL DEFAULT '{}',
      occurred_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_ae_member   ON analytics_events (member_user_id, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ae_type     ON analytics_events (event_type, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ae_occurred ON analytics_events (occurred_at DESC);
  `);

  // FinBridgeCo placeholder config
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS finbridgeco_configs (
      id           TEXT PRIMARY KEY,
      config_key   TEXT NOT NULL,
      config_value JSONB NOT NULL DEFAULT '{}',
      description  TEXT,
      updated_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `);

  // Column migrations for existing tables
  await sql.unsafe(`
    ALTER TABLE member_profiles ADD COLUMN IF NOT EXISTS opted_in_network BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE member_profiles ADD COLUMN IF NOT EXISTS network_bio TEXT;
  `).catch(() => {});

  // Extend pending_standards with governance workflow columns
  await sql.unsafe(`
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS base_standard_id TEXT REFERENCES global_standards(id) ON DELETE SET NULL;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS proposed_name TEXT;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS proposed_domain TEXT;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS proposed_category TEXT;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS proposed_definition TEXT;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS rationale TEXT;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS proposed_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE pending_standards ADD COLUMN IF NOT EXISTS updated_at BIGINT;
  `).catch(() => {});

  // Extend standard_overrides with escalation flag
  await sql.unsafe(`
    ALTER TABLE standard_overrides ADD COLUMN IF NOT EXISTS escalated_to_governance BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE standard_overrides ADD COLUMN IF NOT EXISTS override_note TEXT;
  `).catch(() => {});

  // ── Output block template system ─────────────────────────────────────────
  // Adds template_config (block JSON) and output_type to unified_outputs.
  await sql.unsafe(`
    ALTER TABLE unified_outputs ADD COLUMN IF NOT EXISTS output_type TEXT;
    ALTER TABLE unified_outputs ADD COLUMN IF NOT EXISTS template_config TEXT;
  `).catch(() => {});

  // ── Output templates table (standalone named templates, reusable across outputs) ──
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS output_templates (
      id           TEXT PRIMARY KEY,
      user_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
      output_type  TEXT NOT NULL,
      name         TEXT NOT NULL,
      is_primary   BOOLEAN NOT NULL DEFAULT false,
      config       JSONB NOT NULL DEFAULT '{}',
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_ot_user_type ON output_templates (user_id, output_type);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ot_primary ON output_templates (user_id, output_type) WHERE is_primary = true;
  `);

  // ── Salt Basin Net Works org profile seed ─────────────────────────────────
  // Seeds the platform's own org profile and links it to the admin user (Betsy).
  // This separates Betsy's personal user account from the Salt Basin entity profile.
  try {
    const existing = await sql.unsafe(`SELECT id FROM organization_profiles WHERE slug = 'salt-basin-net-works' LIMIT 1`);
    if (existing.length === 0) {
      const orgRow = await sql.unsafe(`
        INSERT INTO organization_profiles (slug, name, org_type, description, website, industry, created_at, updated_at)
        VALUES ('salt-basin-net-works', 'Salt Basin Net Works', 'llc',
                'Strategic consulting, platform development, and AI-enabled delivery at the intersection of RevOps, governance, and enterprise architecture.',
                'https://saltbasin.net', 'consulting',
                ${Date.now()}, ${Date.now()})
        RETURNING id
      `);
      const orgId = orgRow[0]?.id;
      if (orgId) {
        // Link to admin user's personal profile and org membership
        await sql.unsafe(`
          INSERT INTO org_memberships (user_id, org_id, role, joined_at)
          SELECT u.id, ${orgId}, 'admin', ${Date.now()}
            FROM users u WHERE u.role = 'admin' LIMIT 1
          ON CONFLICT (user_id, org_id) DO NOTHING
        `);
        await sql.unsafe(`
          INSERT INTO personal_org_links (personal_profile_id, org_id, linked_at)
          SELECT pp.id, ${orgId}, ${Date.now()}
            FROM personal_profiles pp
            JOIN users u ON u.id = pp.user_id
           WHERE u.role = 'admin' LIMIT 1
          ON CONFLICT DO NOTHING
        `);
      }
    }
  } catch (e) {
    console.warn('[db] salt basin org seed skipped:', e.message);
  }

  // ── Data lineage + snapshot tables ───────────────────────────────────────
  // field_lineage: one row per changed field per save event. Captures the
  // before/after value, who changed it, from what source, and a 16-char
  // context hash that uniquely fingerprints this value-in-context.
  //
  // data_snapshots: one row per save event summarising how many fields changed
  // and a composite hash of all field hashes at that moment. This is the
  // "point-in-time fingerprint" shown in the waterfall timeline.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS field_lineage (
      id            TEXT PRIMARY KEY,
      entity_type   TEXT NOT NULL,
      entity_id     TEXT NOT NULL,
      field_path    TEXT NOT NULL,
      value         TEXT,
      prev_value    TEXT,
      source_type   TEXT NOT NULL DEFAULT 'manual',
      source_ref    TEXT,
      author_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
      author_email  TEXT,
      captured_at   BIGINT NOT NULL,
      context_hash  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fl_entity   ON field_lineage (entity_type, entity_id, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_fl_field    ON field_lineage (entity_type, entity_id, field_path, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_fl_author   ON field_lineage (author_id, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_fl_captured ON field_lineage (captured_at DESC);

    CREATE TABLE IF NOT EXISTS data_snapshots (
      id             TEXT PRIMARY KEY,
      entity_type    TEXT NOT NULL,
      entity_id      TEXT NOT NULL,
      snapshot_hash  TEXT NOT NULL,
      field_count    INTEGER NOT NULL DEFAULT 0,
      changed_count  INTEGER NOT NULL DEFAULT 0,
      triggered_by   TEXT NOT NULL DEFAULT 'manual',
      author_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,
      author_email   TEXT,
      captured_at    BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ds_entity   ON data_snapshots (entity_type, entity_id, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ds_captured ON data_snapshots (captured_at DESC);
  `);

  // ── Resume access control tables ─────────────────────────────────────────
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS resume_temp_access (
      id              BIGSERIAL PRIMARY KEY,
      email           TEXT NOT NULL,
      token           TEXT NOT NULL UNIQUE,
      request_context TEXT,
      org             TEXT,
      role_type       TEXT,
      question        TEXT,
      missing_info    TEXT,
      terms_accepted  BOOLEAN NOT NULL DEFAULT false,
      lead_id         BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      created_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      expires_at      BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rta_token  ON resume_temp_access (token);
    CREATE INDEX IF NOT EXISTS idx_rta_email  ON resume_temp_access (email);

    CREATE TABLE IF NOT EXISTS resume_member_reasons (
      id         BIGSERIAL PRIMARY KEY,
      user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason     TEXT NOT NULL,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_rmr_user ON resume_member_reasons (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS network_requests (
      id                   BIGSERIAL PRIMARY KEY,
      user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      request_type         TEXT NOT NULL DEFAULT 'resume-download',
      reason               TEXT,
      org                  TEXT,
      role_type            TEXT,
      question             TEXT,
      missing_info         TEXT,
      created_at           BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      converted_to_lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_nr_user ON network_requests (user_id, created_at DESC);

    -- Job-specific lead fields (v0.15)
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'network';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_description TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_url TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS company TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS hiring_manager TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_status TEXT NOT NULL DEFAULT 'new';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS pledged_at BIGINT;

    -- Member connections (v0.15)
    CREATE TABLE IF NOT EXISTS member_connections (
      id           BIGSERIAL PRIMARY KEY,
      requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status       TEXT NOT NULL DEFAULT 'pending',
      message      TEXT,
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      UNIQUE(requester_id, recipient_id)
    );
    CREATE INDEX IF NOT EXISTS idx_mc_requester ON member_connections (requester_id);
    CREATE INDEX IF NOT EXISTS idx_mc_recipient ON member_connections (recipient_id);

    -- Member direct messages (v0.15)
    CREATE TABLE IF NOT EXISTS member_messages (
      id           BIGSERIAL PRIMARY KEY,
      sender_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body         TEXT NOT NULL,
      read_at      BIGINT,
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_mm_recipient ON member_messages (recipient_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_mm_sender    ON member_messages (sender_id, created_at DESC);
  `);

  // ── Seed: platform_applications ──────────────────────────────────────────
  const appDefs = [
    { id: 'app.herq',           display_name: 'HERQ Content Manager',          slug: 'herq',            brand_mode: 'herq',       admin_only: true  },
    { id: 'app.services',       display_name: 'Services Proposal Manager',      slug: 'services',        brand_mode: 'strategic',  admin_only: false },
    { id: 'app.globalStandards',display_name: 'Global Standard Content Manager',slug: 'global-standards',brand_mode: 'strategic',  admin_only: true  },
    { id: 'app.eidosOperatingModel', display_name: 'EIDOS Operating Model',      slug: 'eidos-operating-model', brand_mode: 'strategic', admin_only: true },
    { id: 'app.contributionIntelligence', display_name: 'Contribution Intelligence', slug: 'contribution-intelligence', brand_mode: 'strategic', admin_only: true },
    { id: 'app.nrm',            display_name: 'Network Relationship Manager',   slug: 'nrm',             brand_mode: 'strategic',  admin_only: false },
    { id: 'app.crm',            display_name: 'Customer Relationship Manager',  slug: 'crm',             brand_mode: 'strategic',  admin_only: false },
    { id: 'app.plm',            display_name: 'Platform Lifecycle Management',  slug: 'plm',             brand_mode: 'strategic',  admin_only: true  },
    { id: 'app.finbridgeco',    display_name: 'FinBridgeCo Manager',            slug: 'finbridgeco',     brand_mode: 'strategic',  admin_only: true  },
    { id: 'app.resume',         display_name: 'Resume Output Generator',        slug: 'resume',          brand_mode: 'strategic',  admin_only: false },
    { id: 'app.analytics',      display_name: 'Platform Analytics Hub',         slug: 'analytics',       brand_mode: 'strategic',  admin_only: false },
    { id: 'app.memberSite',     display_name: 'Member Website CMS',             slug: 'member-site',     brand_mode: 'strategic',  admin_only: false },
    { id: 'app.publicSite',     display_name: 'Salt Basin Public Site CMS',     slug: 'public-site',     brand_mode: 'strategic',  admin_only: true  },
  ];
  for (const app of appDefs) {
    await sql.unsafe(
      `INSERT INTO platform_applications (id, display_name, slug, brand_mode, admin_only)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [app.id, app.display_name, app.slug, app.brand_mode, app.admin_only]
    );
  }

  // ── Seed: HERQ series versions ────────────────────────────────────────────
  const herqSeries = [
    { id: 'series.base',   series_title: 'Hot Elephant Resident Question',    classification_type: 'baseFramework',   default_color_token: '--herq-pink',   target_audience_refs: ['audience.general'] },
    { id: 'series.hazard', series_title: 'Hazardous Enterprise Reality Question', classification_type: 'acronymVariation', default_color_token: '--herq-orange', target_audience_refs: ['audience.pe', 'audience.revops'] },
    { id: 'series.retain', series_title: 'Highly Evaded Retention Question',  classification_type: 'acronymVariation', default_color_token: '--herq-sky',    target_audience_refs: ['audience.cx', 'audience.hr'] },
    { id: 'series.human',  series_title: 'Human Enterprise Resource Question',classification_type: 'acronymVariation', default_color_token: '--herq-mint',   target_audience_refs: ['audience.peopleOps', 'audience.leadership'] },
    { id: 'series.earn',   series_title: 'Hindered Earnings Reporting Question', classification_type: 'acronymVariation', default_color_token: '--herq-yellow', target_audience_refs: ['audience.finance', 'audience.cfo'] },
  ];
  const nowTs = Date.now();
  for (const s of herqSeries) {
    await sql.unsafe(
      `INSERT INTO herq_series_versions (id, series_title, classification_type, default_color_token, target_audience_refs, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.series_title, s.classification_type, s.default_color_token, s.target_audience_refs, nowTs]
    );
  }

  // ── Seed / migrate admin_nav to include new tabs ─────────────────────────
  // One-shot injection: add Content Manager, NRM, Analytics, FinBridgeCo tabs
  // to the existing admin nav without overwriting manual edits.
  try {
    const navRow = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRow.length > 0) {
      const nav = JSON.parse(navRow[0].data);
      let changed = false;

      // Find or create a top-level "platform" view for new platform tabs
      const allTabIds = (nav.views || []).flatMap(v => (v.tabs || []).map(t => t.id));

      const newTabs = [
        { viewId: 'plm',      viewLabel: 'Platform Lifecycle Management', id: 'plm-dashboard',   label: 'Operating Model', componentId: 'plmDashboard',   sortOrder: 0 },
        { viewId: 'plm',      viewLabel: 'Platform Lifecycle Management', id: 'content-manager', label: 'Content Manager',  componentId: 'contentManager', sortOrder: 3 },
        { viewId: 'platform', viewLabel: 'Platform',                      id: 'nrm',             label: 'Network',         componentId: 'nrm',            sortOrder: 0 },
        { viewId: 'platform', viewLabel: 'Platform',                      id: 'analytics',       label: 'Analytics',       componentId: 'analytics',      sortOrder: 1 },
        { viewId: 'system',   viewLabel: 'System',                        id: 'finbridgeco',     label: 'FinBridgeCo',     componentId: 'finbridgeco',    sortOrder: 2 },
        { viewId: 'system',   viewLabel: 'System',                        id: 'lineage',         label: 'Data Lineage',    componentId: 'lineage',        sortOrder: 3 },
        { viewId: 'content',  viewLabel: 'My Profile',                    id: 'inbox',           label: 'Inbox',           componentId: 'inbox',          sortOrder: 10 },
        { viewId: 'system',   viewLabel: 'System',                        id: 'command-center',  label: 'Command Center',  componentId: 'commandCenter',  sortOrder: 4 },
      ];

      for (const t of newTabs) {
        if (allTabIds.includes(t.id)) continue;
        let view = (nav.views || []).find(v => v.id === t.viewId);
        if (!view) {
          view = { id: t.viewId, label: t.viewLabel, sortOrder: nav.views.length, tabs: [] };
          nav.views.push(view);
        }
        view.tabs = view.tabs || [];
        view.tabs.push({ id: t.id, label: t.label, componentId: t.componentId, sortOrder: t.sortOrder });
        changed = true;
      }

      const plmView = (nav.views || []).find(v => v.id === 'plm');
      const plmSort = { 'plm-dashboard': 0, backlog: 1, qa: 2, 'content-manager': 3 };
      if (plmView?.tabs) {
        for (const tab of plmView.tabs) {
          if (plmSort[tab.id] !== undefined && tab.sortOrder !== plmSort[tab.id]) {
            tab.sortOrder = plmSort[tab.id];
            changed = true;
          }
        }
      }

      if (changed) {
        await sql.unsafe(
          `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
          [JSON.stringify(nav), Date.now()]
        );
      }
    }
  } catch (e) {
    console.warn('[db] admin_nav merge skipped:', e.message);
  }

  // ── Migrate admin_nav: fold My Profile + Net Works + NRM into one
  // "Network Relationship Management" module ────────────────────────────────
  // One-shot, idempotent: relocates the 'networks' and 'nrm' tabs into the
  // 'content' view (wherever they currently live — 'crm' and 'platform' in
  // the common case, but this doesn't assume a fixed prior location so it's
  // safe even against a manually-edited nav) and relabels views/tabs. Skips
  // any step already done, so re-running on a boot that already migrated is
  // a no-op.
  try {
    const navRow2 = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRow2.length > 0) {
      const nav = JSON.parse(navRow2[0].data);
      let changed = false;
      const views = nav.views || [];

      const contentView = views.find((v) => v.id === 'content');
      if (contentView) {
        if (contentView.label !== 'Network Relationship Management') {
          contentView.label = 'Network Relationship Management';
          changed = true;
        }
        contentView.tabs = contentView.tabs || [];

        // Relocate a tab (by id) from wherever it currently lives into the
        // content view, applying the given label/sortOrder/componentId.
        const relocate = (tabId, label, componentId, sortOrder) => {
          const alreadyHere = contentView.tabs.some((t) => t.id === tabId);
          if (alreadyHere) return;
          for (const v of views) {
            if (v.id === contentView.id) continue;
            const idx = (v.tabs || []).findIndex((t) => t.id === tabId);
            if (idx >= 0) v.tabs.splice(idx, 1);
          }
          contentView.tabs.push({ id: tabId, label, componentId, sortOrder });
          changed = true;
        };
        relocate('networks', 'Net Works', 'networks', 2);
        relocate('nrm', 'Network Contacts', 'nrm', 3);
      }

      const plmView2 = views.find((v) => v.id === 'plm');
      const plmDashTab = plmView2?.tabs?.find((t) => t.id === 'plm-dashboard');
      if (plmDashTab && plmDashTab.label !== 'Operating Model Dashboard') {
        plmDashTab.label = 'Operating Model Dashboard';
        changed = true;
      }

      if (changed) {
        await sql.unsafe(
          `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
          [JSON.stringify(nav), Date.now()]
        );
      }
    }
  } catch (e) {
    console.warn('[db] admin_nav NRM-merge skipped:', e.message);
  }

  // ── Contribution Intelligence — sessions + enhanced backlog (v0.17) ───────
  // Each statement is isolated so one failure doesn't block the rest.

  // sessions table — create if missing
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS sessions (
      id                  BIGSERIAL PRIMARY KEY,
      jsonl_filename      TEXT,
      project_directory   TEXT,
      date_start          BIGINT,
      date_end            BIGINT,
      active_hours        NUMERIC,
      total_turns         INT,
      user_turns          INT,
      turn_density        NUMERIC,
      oversight_intensity TEXT,
      versions_covered    TEXT,
      burst_count         INT,
      notes               TEXT,
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `).catch((e) => console.warn('[db] sessions table warning:', e.message));

  // sessions columns — ADD IF NOT EXISTS handles both new installs and upgrades
  await sql.unsafe(`
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS jsonl_filename TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS project_directory TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS date_start BIGINT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS date_end BIGINT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS active_hours NUMERIC;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_turns INT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_turns INT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS turn_density NUMERIC;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS oversight_intensity TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS versions_covered TEXT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS burst_count INT;
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS notes TEXT;
    CREATE INDEX IF NOT EXISTS idx_sessions_filename ON sessions (jsonl_filename);
  `).catch((e) => console.warn('[db] sessions columns warning:', e.message));

  // rate_configs table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS rate_configs (
      id              TEXT PRIMARY KEY,
      rate_type       TEXT NOT NULL,
      contributor     TEXT,
      rate_per_hour   NUMERIC NOT NULL,
      effective_year  INT NOT NULL DEFAULT 2026,
      basis           TEXT,
      applies_to      TEXT,
      note            TEXT,
      created_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `).catch((e) => console.warn('[db] rate_configs table warning:', e.message));

  // backlog_items + capability_groups new columns.
  //
  // CRITICAL: each ALTER TABLE runs in its OWN sql.unsafe() call. A single
  // multi-statement string is one query to Postgres — if any statement in
  // it fails, the whole batch aborts, INCLUDING statements that would have
  // succeeded. That's exactly what happened here: session_id's FK
  // (REFERENCES sessions(id)) fails because "sessions" is the live
  // auth-cookie table (token/user_id/expires_at, no usable id for this FK
  // — the same v0.17 sessions-table collision documented in
  // contributionMethodology.js knownGaps), which silently prevented EVERY
  // other column below (including data_source/est_*/actual_*) from ever
  // being created, and once the API layer started writing to them
  // (v0.18.3), the resulting "column does not exist" error was an
  // uncaught rejection that crashed the whole process. Dropped the FK
  // entirely (session_id is just a plain BIGINT now — nothing reads it)
  // and isolated every statement so this class of bug can't cascade again.
  const backlogColumnMigrations = [
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS session_id BIGINT`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS l2r_stage TEXT`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS contribution_type TEXT`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS est_director_hours NUMERIC`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS est_claude_hours NUMERIC`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS actual_director_hours NUMERIC`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS actual_claude_hours NUMERIC`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS oversight_intensity TEXT`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS automation_potential TEXT`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS patch_note_version TEXT`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'estimated'`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS fee_type TEXT`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS hours_strategic_direction NUMERIC`,
    `ALTER TABLE backlog_items ADD COLUMN IF NOT EXISTS hours_domain_authoring NUMERIC`,
    `ALTER TABLE capability_groups ADD COLUMN IF NOT EXISTS l2r_stages TEXT`,
    `ALTER TABLE capability_groups ADD COLUMN IF NOT EXISTS business_function TEXT`,
    `ALTER TABLE capability_groups ADD COLUMN IF NOT EXISTS maturity_level TEXT DEFAULT 'building'`,
  ];
  for (const stmt of backlogColumnMigrations) {
    await sql.unsafe(stmt).catch((e) => console.warn('[db] v0.17 column migration warning:', stmt, '--', e.message));
  }

  // Seed 2026 rate configs — idempotent
  const rateSeeds = [
    { id: 'betsy_director_2026',       rate_type: 'director',    contributor: 'Betsy Salter',       rate_per_hour: 225, effective_year: 2026, basis: 'Principal Consultant / Director of Engineering — US market, 2026', applies_to: 'strategic_direction,domain_authoring,active_supervision', note: 'Single rate for all Betsy contribution types. Activity type is more meaningful than in-session vs prep location.' },
    { id: 'claude_senior_2026',        rate_type: 'ai_senior',   contributor: 'Claude (Anthropic)', rate_per_hour: 115, effective_year: 2026, basis: 'Offshore senior engineer equivalent, quality-adjusted — boutique firm, 2026', applies_to: 'code_generation', note: 'Above offshore entry floor ($65). Below onshore senior ($175). Confirmed by Betsy Salter, June 2026.' },
    { id: 'benchmark_offshore_2026',   rate_type: 'benchmark',   contributor: null,                 rate_per_hour: 65,  effective_year: 2026, basis: 'Boutique offshore entry-level code generation — 2026 market rate', applies_to: null, note: 'Comparison benchmark only. Floor reference.' },
    { id: 'benchmark_onshore_2026',    rate_type: 'benchmark',   contributor: null,                 rate_per_hour: 175, effective_year: 2026, basis: 'US senior engineer consulting rate — 2026 market rate', applies_to: null, note: 'Comparison benchmark only. Traditional team replacement cost.' },
  ];
  for (const r of rateSeeds) {
    await sql.unsafe(
      `INSERT INTO rate_configs (id, rate_type, contributor, rate_per_hour, effective_year, basis, applies_to, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.rate_type, r.contributor ?? null, r.rate_per_hour, r.effective_year, r.basis, r.applies_to ?? null, r.note]
    );
  }

  // ── Contribution Intelligence v2 — Contribution Event model (Phase 1) ─────
  // Additive alongside the v0.17 backlog-centric methodology above (which
  // keeps serving /output/methodology unchanged for now — see
  // docs/salt-basin-contribution-intelligence-progress.md open decisions).
  // This is the source-agnostic, event-level model from
  // .claude/skills/salt-basin-contribution-intelligence/reference/master-build-prompt.md
  // §I/§XIX/§XX: an immutable raw event store, and a versioned, reprocessable
  // classification layer on top of it. Each statement isolated per the same
  // rule documented above the v0.17 backlogColumnMigrations block — one
  // failure must not silently block the rest.

  // raw_events — immutable evidence. `id` is the source adapter's own
  // deterministic hash (e.g. sha256(file:line:content), matching the pattern
  // already shipped in scripts/run-codex-contribution-intelligence.mjs) so
  // every adapter's insert is naturally idempotent via ON CONFLICT DO NOTHING
  // — no separate dedup bookkeeping table needed. Never UPDATE a row here;
  // if an adapter needs to correct itself, it inserts a new id.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS raw_events (
      id                  TEXT PRIMARY KEY,
      source_platform     TEXT NOT NULL,
      source_session_id   TEXT,
      source_message_id   TEXT,
      source_event_id     TEXT,
      source_file         TEXT,
      source_line         INT,
      source_timestamp    BIGINT,
      ingested_timestamp  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      event_type          TEXT,
      payload_hash        TEXT,
      observable_evidence TEXT,
      evidence_type       TEXT,
      raw_payload         JSONB,
      created_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `).catch((e) => console.warn('[db] raw_events table warning:', e.message));

  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS idx_raw_events_platform ON raw_events (source_platform, source_timestamp);
    CREATE INDEX IF NOT EXISTS idx_raw_events_session  ON raw_events (source_session_id) WHERE source_session_id IS NOT NULL;
  `).catch((e) => console.warn('[db] raw_events index warning:', e.message));

  // contribution_events — governed semantic interpretation of one or more
  // raw_events rows. Versioned per §XX: reclassifying a Contribution Event
  // INSERTs a new row sharing the same contribution_event_id with
  // attribution_version incremented, rather than UPDATE-ing the prior row's
  // substantive columns. classification_status on the prior row may move to
  // 'superseded' — that status flip is metadata about currency, not a
  // rewrite of what was actually observed/classified at that version.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS contribution_events (
      row_id                        BIGSERIAL PRIMARY KEY,
      contribution_event_id         TEXT NOT NULL,
      attribution_version           INT NOT NULL DEFAULT 1,
      classification_status         TEXT NOT NULL DEFAULT 'provisional',
      raw_event_ids                 JSONB,
      source_platform                TEXT,
      source_session_id              TEXT,
      organization_id                TEXT,
      workspace_id                    TEXT,
      channel_id                      TEXT,
      project_id                      TEXT,
      initiative_id                   TEXT,
      workstream_id                   TEXT,
      outcome_id                      TEXT,
      artifact_id                     TEXT,
      artifact_version_id             TEXT,
      contributor_type                TEXT NOT NULL,
      contributor_id                  TEXT,
      contributor_role                TEXT,
      agent_id                        TEXT,
      model_id                        TEXT,
      model_version                   TEXT,
      parent_contribution_event_id    TEXT,
      causal_predecessor_ids          JSONB,
      causal_successor_ids            JSONB,
      effective_timestamp             BIGINT,
      start_timestamp                 BIGINT,
      end_timestamp                   BIGINT,
      estimated_active_duration_min   NUMERIC,
      estimated_wait_duration_min     NUMERIC,
      contribution_class              TEXT,
      contribution_subclass           TEXT,
      action_type                     TEXT,
      reasoning_type                  TEXT,
      decision_type                   TEXT,
      transformation_type             TEXT,
      evidence_type                   TEXT,
      validation_type                 TEXT,
      confidence                      NUMERIC,
      scores                          JSONB,
      raw_input_reference             TEXT,
      raw_output_reference            TEXT,
      normalized_semantic_summary     TEXT,
      evidence_references             JSONB,
      assumptions                     JSONB,
      classification_method           TEXT,
      classification_version          TEXT,
      created_at                      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      created_by                      TEXT,
      updated_at                      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_by                      TEXT
    );
  `).catch((e) => console.warn('[db] contribution_events table warning:', e.message));

  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS idx_contrib_events_logical    ON contribution_events (contribution_event_id, attribution_version DESC);
    CREATE INDEX IF NOT EXISTS idx_contrib_events_current    ON contribution_events (contribution_event_id) WHERE classification_status <> 'superseded';
    CREATE INDEX IF NOT EXISTS idx_contrib_events_session    ON contribution_events (source_session_id) WHERE source_session_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_contrib_events_contributor ON contribution_events (contributor_type, contributor_id);
    CREATE INDEX IF NOT EXISTS idx_contrib_events_outcome     ON contribution_events (outcome_id) WHERE outcome_id IS NOT NULL;
  `).catch((e) => console.warn('[db] contribution_events index warning:', e.message));

  // GIN index for the `raw_event_ids ? id` containment check the Phase 2
  // classifier (scripts/classify-contribution-events.mjs) uses to find
  // not-yet-classified raw_events. Without this, that NOT EXISTS check
  // degrades as contribution_events grows past its first (empty-table) run.
  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS idx_contrib_events_raw_ids ON contribution_events USING GIN (raw_event_ids);
  `).catch((e) => console.warn('[db] contribution_events GIN index warning:', e.message));

  // ── Seed: default page_type_definitions into config_state if missing ──
  //
  // Platform-wide "New Page" type taxonomy — a JSON blob under config_state
  // with id='page_type_definitions'. Same check-then-insert pattern as
  // admin_nav above: seeded once, never overwritten by a later boot, editable
  // via PUT /api/config/page-types (admin-only). Both admin and member scopes
  // read this same shared row — it's one taxonomy, not per-member data.
  const existingPageTypes = await sql.unsafe(`SELECT id FROM config_state WHERE id = 'page_type_definitions'`);
  if (existingPageTypes.length === 0) {
    const defaultPageTypes = {
      types: [
        {
          id: 'standard',
          label: 'Standard',
          description: 'A general-purpose page with a hero and flexible content sections.',
          defaultSections: [
            { type: 'hero', name: 'Hero', bg: 'navy', fields: { heading: '{{pageName}}', subtitle: 'Add your intro here.' } },
          ],
        },
        {
          id: 'landing',
          label: 'Landing',
          description: 'A focused page built to drive a single call to action.',
          defaultSections: [
            { type: 'hero', name: 'Hero', bg: 'navy', fields: { heading: '{{pageName}}', subtitle: 'Add your intro here.' } },
            { type: 'cta', name: 'Call to Action', bg: 'linen', fields: {} },
          ],
        },
        {
          id: 'blog',
          label: 'Blog',
          description: 'A long-form content page for articles and posts.',
          defaultSections: [
            { type: 'hero', name: 'Hero', bg: 'navy', fields: { heading: '{{pageName}}', subtitle: 'Add your intro here.' } },
            { type: 'text', name: 'Article Body', bg: 'ivory', fields: {} },
          ],
        },
        {
          id: 'shop',
          label: 'Shop',
          description: 'A page for showcasing products or offerings as cards.',
          defaultSections: [
            { type: 'hero', name: 'Hero', bg: 'navy', fields: { heading: '{{pageName}}', subtitle: 'Add your intro here.' } },
            { type: 'cards', name: 'Offerings', bg: 'ivory', fields: {} },
          ],
        },
      ],
    };
    await sql.unsafe(
      `INSERT INTO config_state (id, data, updated_at) VALUES ($1, $2, $3)`,
      ['page_type_definitions', JSON.stringify(defaultPageTypes), Date.now()]
    );
  }

  // One-shot: append the "Career Prospect" page type into the existing
  // page_type_definitions row (the seed-if-missing block above only runs on
  // a genuinely fresh install — this row already exists in the live DB, so
  // editing defaultPageTypes above alone would never reach it). Never
  // renames or removes an existing type.
  try {
    const pageTypesRow = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'page_type_definitions'`);
    if (pageTypesRow.length > 0) {
      const pageTypes = JSON.parse(pageTypesRow[0].data);
      pageTypes.types = pageTypes.types || [];
      const hasCareerProspect = pageTypes.types.some((t) => t.id === 'career-prospect');
      if (!hasCareerProspect) {
        pageTypes.types.push({
          id: 'career-prospect',
          label: 'Career Prospect',
          description: 'A guided, evidence-driven view of your career — hero, audience-lens tabs, an auto-populated Career Master rollup, and a member journey stepper.',
          defaultSections: [
            { type: 'careerHeroOrbit', name: 'Career Hero', bg: 'cream', fields: { eyebrow: 'MEMBER PROSPECT EXPERIENCE', heading: '{{pageName}}', lede: 'Add your intro here.', statBadges: [] } },
            { type: 'careerLensTabs', name: 'Choose Your Lens', bg: 'linen', fields: { eyebrow: 'CHOOSE YOUR LENS', heading: 'The experience begins with the question.', lensTabs: [] } },
            { type: 'careerRollupShowcase', name: 'Career Rollup', bg: 'ivory', fields: { eyebrow: 'CAREER CLAIM OBJECTS', heading: 'Proof, organized like an operating system.', groupBy: 'skills', chartType: 'bar' } },
            { type: 'careerJourneyStepper', name: 'Member Journey', bg: 'linen', fields: { eyebrow: 'MEMBER JOURNEY', heading: 'The experience adapts to the visitor.', stages: [] } },
          ],
        });
        await sql.unsafe(
          `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'page_type_definitions'`,
          [JSON.stringify(pageTypes), Date.now()]
        );
      }
    }
  } catch (e) {
    console.warn('[db] career-prospect page-type injection skipped:', e.message);
  }

  // ── Career master data ────────────────────────────────────────────────────
  // Single source of truth for Betsy's resume/portfolio content — feeds the
  // public timeline, industry wheel, case studies, resume output templates,
  // and the elevated public profile view. Single-tenant admin data (~115
  // rows total), so plain purpose-built tables with JSONB for list-shaped
  // sub-fields rather than the heavier capability_groups-style normalization
  // backlog_items uses. See PLATFORM_MERGE_SPEC.md / plan history for the
  // "Career Master Data Model" rework.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS career_jobs (
      id            BIGSERIAL PRIMARY KEY,
      company       TEXT NOT NULL,
      title         TEXT NOT NULL,
      start_date    TEXT,
      end_date      TEXT,
      duration      TEXT,
      salary        TEXT,
      job_function  TEXT,
      industry      TEXT,
      key_metrics   TEXT,
      order_index   INTEGER NOT NULL DEFAULT 0,
      created_at    BIGINT NOT NULL,
      updated_at    BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_jobs_order ON career_jobs (order_index);

    CREATE TABLE IF NOT EXISTS career_skills (
      id                BIGSERIAL PRIMARY KEY,
      skill             TEXT NOT NULL,
      category          TEXT,
      tier              TEXT,
      years_exp         NUMERIC,
      num_engagements   INTEGER,
      first_used        INTEGER,
      resume_language   TEXT,
      order_index       INTEGER NOT NULL DEFAULT 0,
      created_at        BIGINT NOT NULL,
      updated_at        BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_skills_order ON career_skills (order_index);
    CREATE INDEX IF NOT EXISTS idx_career_skills_cat   ON career_skills (category);

    CREATE TABLE IF NOT EXISTS career_tools (
      id            BIGSERIAL PRIMARY KEY,
      name_used     TEXT NOT NULL,
      current_name  TEXT,
      category      TEXT,
      tier          TEXT,
      first_used    INTEGER,
      num_roles     INTEGER,
      notes         TEXT,
      wheel_bucket  TEXT,
      order_index   INTEGER NOT NULL DEFAULT 0,
      created_at    BIGINT NOT NULL,
      updated_at    BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_tools_order ON career_tools (order_index);

    CREATE TABLE IF NOT EXISTS career_engagements (
      id                    BIGSERIAL PRIMARY KEY,
      name                  TEXT NOT NULL,
      employer              TEXT NOT NULL,
      client_name_real      TEXT,
      client_display_name   TEXT NOT NULL,
      industry              TEXT,
      period                TEXT,
      scale                 TEXT,
      roles                 JSONB NOT NULL DEFAULT '[]',
      context               TEXT,
      actions               TEXT,
      outcomes              JSONB NOT NULL DEFAULT '[]',
      metrics               JSONB NOT NULL DEFAULT '[]',
      testimonial           TEXT,
      testimonial_attr      TEXT,
      scenarios             JSONB NOT NULL DEFAULT '[]',
      publish_case_study    BOOLEAN NOT NULL DEFAULT true,
      investment_type       TEXT,
      acquired_detail       TEXT,
      exit_detail           TEXT,
      financial_return      TEXT,
      outcome_status        TEXT,
      order_index           INTEGER NOT NULL DEFAULT 0,
      created_at            BIGINT NOT NULL,
      updated_at            BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_engagements_order ON career_engagements (order_index);
    CREATE INDEX IF NOT EXISTS idx_career_engagements_emp   ON career_engagements (employer);

    CREATE TABLE IF NOT EXISTS career_domains (
      id            BIGSERIAL PRIMARY KEY,
      group_type    TEXT NOT NULL,
      title         TEXT NOT NULL,
      icon          TEXT,
      description   TEXT,
      items         JSONB NOT NULL DEFAULT '[]',
      accent_color  TEXT,
      extra         JSONB NOT NULL DEFAULT '{}',
      order_index   INTEGER NOT NULL DEFAULT 0,
      created_at    BIGINT NOT NULL,
      updated_at    BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_domains_group ON career_domains (group_type, order_index);
  `);

  // Investor / operating-principal extension of the Career Master model:
  // certifications (with renewal tracking), deal transactions (role-in-deal
  // varies by employer-at-time; individual return carve-outs), and the
  // meta-options table holding recommended selectable values for those
  // fields (deal roles, investment types, stake types, cert categories…).
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS career_certifications (
      id            BIGSERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      issuer        TEXT,
      category      TEXT,
      first_earned  TEXT,
      last_renewed  TEXT,
      expires       TEXT,
      status        TEXT,
      credential_id TEXT,
      notes         TEXT,
      order_index   INTEGER NOT NULL DEFAULT 0,
      created_at    BIGINT NOT NULL,
      updated_at    BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_certs_order ON career_certifications (order_index);

    CREATE TABLE IF NOT EXISTS career_deals (
      id                   BIGSERIAL PRIMARY KEY,
      deal_name            TEXT NOT NULL,
      portfolio_company    TEXT,
      employer_at_time     TEXT,
      deal_role            TEXT,
      investment_type      TEXT,
      deal_size            TEXT,
      deal_size_musd       NUMERIC,
      entry_date           TEXT,
      exit_date            TEXT,
      exit_value           TEXT,
      exit_value_musd      NUMERIC,
      gross_return_pct     NUMERIC,
      attribution_pct      NUMERIC,
      individual_return    TEXT,
      stake_type           TEXT,
      outcome_status       TEXT,
      is_active_portfolio  BOOLEAN NOT NULL DEFAULT false,
      arr_entry_musd       NUMERIC,
      arr_prior_year_musd  NUMERIC,
      arr_current_musd     NUMERIC,
      notes                TEXT,
      order_index          INTEGER NOT NULL DEFAULT 0,
      created_at           BIGINT NOT NULL,
      updated_at           BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_deals_order  ON career_deals (order_index);
    CREATE INDEX IF NOT EXISTS idx_career_deals_active ON career_deals (is_active_portfolio);

    CREATE TABLE IF NOT EXISTS career_meta_options (
      id           BIGSERIAL PRIMARY KEY,
      field_key    TEXT NOT NULL,
      value        TEXT NOT NULL,
      description  TEXT,
      order_index  INTEGER NOT NULL DEFAULT 0,
      created_at   BIGINT NOT NULL,
      updated_at   BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_meta_options_key ON career_meta_options (field_key, order_index);
  `);

  // ── Career master multi-tenancy retrofit ──────────────────────────────────
  // Career Master started single-tenant (Betsy's data only, no user_id at
  // all). Every member now gets their own Career Master dataset, matching
  // the ownership model already used for member_sites/member_configs.
  // Nullable + backfilled rather than a forced NOT NULL migration — existing
  // rows are assigned to the platform admin so nothing regresses.
  await sql.unsafe(`
    ALTER TABLE career_jobs           ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
    ALTER TABLE career_skills         ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
    ALTER TABLE career_tools          ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
    ALTER TABLE career_engagements    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
    ALTER TABLE career_domains        ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
    ALTER TABLE career_certifications ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
    ALTER TABLE career_deals          ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);
    CREATE INDEX IF NOT EXISTS idx_career_jobs_user           ON career_jobs (user_id);
    CREATE INDEX IF NOT EXISTS idx_career_skills_user         ON career_skills (user_id);
    CREATE INDEX IF NOT EXISTS idx_career_tools_user          ON career_tools (user_id);
    CREATE INDEX IF NOT EXISTS idx_career_engagements_user    ON career_engagements (user_id);
    CREATE INDEX IF NOT EXISTS idx_career_domains_user        ON career_domains (user_id);
    CREATE INDEX IF NOT EXISTS idx_career_certifications_user ON career_certifications (user_id);
    CREATE INDEX IF NOT EXISTS idx_career_deals_user          ON career_deals (user_id);
  `);

  // One-time idempotent backfill — existing (pre-retrofit) rows had no
  // owner, so they belong to the platform admin. Guarded by `user_id IS
  // NULL` so it never touches rows a member has since created for themselves.
  await sql.unsafe(`
    UPDATE career_jobs           SET user_id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1) WHERE user_id IS NULL;
    UPDATE career_skills         SET user_id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1) WHERE user_id IS NULL;
    UPDATE career_tools          SET user_id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1) WHERE user_id IS NULL;
    UPDATE career_engagements    SET user_id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1) WHERE user_id IS NULL;
    UPDATE career_domains        SET user_id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1) WHERE user_id IS NULL;
    UPDATE career_certifications SET user_id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1) WHERE user_id IS NULL;
    UPDATE career_deals          SET user_id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1) WHERE user_id IS NULL;
  `).catch((e) => console.warn('[db] career_* user_id backfill skipped:', e.message));

  // Portfolio request lead funnel: intake rows from the public teaser views
  // ("Want to request Betsy's Career Portfolio?" / "Want to build a Career
  // Portfolio and Salt Basin Profile for yourself?") plus a temporary
  // attachment context space — uploads expire and are hard-deleted 24 hours
  // after upload by the sweep in server/routes/portfolioRequests.js.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS portfolio_requests (
      id                  BIGSERIAL PRIMARY KEY,
      kind                TEXT NOT NULL,
      source_output       TEXT,
      knows_betsy         BOOLEAN,
      knows_betsy_detail  TEXT,
      comparing_to_role   BOOLEAN,
      job_description     TEXT,
      coverage            JSONB NOT NULL DEFAULT '[]',
      coverage_notes      TEXT,
      role_type           TEXT,
      career_stage        TEXT,
      goal                TEXT,
      showcase            JSONB NOT NULL DEFAULT '[]',
      recommended_portfolio TEXT,
      contact_name        TEXT,
      contact_email       TEXT NOT NULL,
      contact_company     TEXT,
      contact_title       TEXT,
      contact_phone       TEXT,
      notes               TEXT,
      status              TEXT NOT NULL DEFAULT 'new',
      created_at          BIGINT NOT NULL,
      updated_at          BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_portfolio_requests_created ON portfolio_requests (created_at);

    -- public_token: opaque per-lead token so a returning anonymous visitor's
    -- browser (via localStorage, no login required) can look up their own
    -- prior submission for the BestyStaff "welcome back" greeting, without
    -- exposing other visitors' records (sequential ids are guessable).
    -- top_questions: verbatim capture of the cache-layer "top 5 questions"
    -- answer, persisted so it can be replayed back as memory context.
    ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS public_token TEXT;
    ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS top_questions TEXT;
    ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_portfolio_requests_token ON portfolio_requests (public_token);

    CREATE TABLE IF NOT EXISTS temp_attachments (
      id                 BIGSERIAL PRIMARY KEY,
      request_id         BIGINT,
      original_filename  TEXT,
      mime_type          TEXT,
      file_size          BIGINT,
      storage_bucket     TEXT,
      storage_key        TEXT,
      expires_at         BIGINT NOT NULL,
      created_at         BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_temp_attachments_exp ON temp_attachments (expires_at);
  `);

  // Career Master intake uploads. These tables intentionally store document
  // metadata and user policy acknowledgements, not extracted client names.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS career_intake_documents (
      id                                 BIGSERIAL PRIMARY KEY,
      user_id                            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      owner_scope                        TEXT NOT NULL DEFAULT 'member',
      intake_kind                        TEXT NOT NULL,
      source_truth_status                TEXT NOT NULL DEFAULT 'user_attested',
      source_use_scope                   TEXT NOT NULL DEFAULT 'career_master_and_outputs',
      client_name_policy                 TEXT NOT NULL DEFAULT 'generalize_private_clients',
      portfolio_name_policy              TEXT NOT NULL DEFAULT 'allow_if_user_provided',
      case_study_title_policy            TEXT NOT NULL DEFAULT 'industry_company_type',
      public_primary_research            BOOLEAN NOT NULL DEFAULT false,
      primary_resume_requested           BOOLEAN NOT NULL DEFAULT true,
      analysis_passes_requested          INTEGER NOT NULL DEFAULT 3,
      redaction_ack                      BOOLEAN NOT NULL DEFAULT false,
      public_output_validation_ack       BOOLEAN NOT NULL DEFAULT false,
      no_private_name_persistence_ack    BOOLEAN NOT NULL DEFAULT false,
      original_filename                  TEXT NOT NULL,
      storage_bucket                     TEXT NOT NULL,
      storage_key                        TEXT NOT NULL,
      mime_type                          TEXT,
      file_size                          BIGINT,
      upload_notes                       TEXT,
      status                             TEXT NOT NULL DEFAULT 'uploaded',
      created_at                         BIGINT NOT NULL,
      updated_at                         BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_intake_docs_user ON career_intake_documents (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_career_intake_docs_kind ON career_intake_documents (intake_kind, created_at DESC);

    CREATE TABLE IF NOT EXISTS career_intake_runs (
      id                         BIGSERIAL PRIMARY KEY,
      user_id                    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      owner_scope                TEXT NOT NULL DEFAULT 'member',
      run_kind                   TEXT NOT NULL DEFAULT 'career_master_mapping',
      status                     TEXT NOT NULL DEFAULT 'queued',
      document_ids               JSONB NOT NULL DEFAULT '[]',
      analysis_passes_requested  INTEGER NOT NULL DEFAULT 3,
      primary_resume_requested   BOOLEAN NOT NULL DEFAULT true,
      public_primary_research    BOOLEAN NOT NULL DEFAULT false,
      resume_preset_created      BOOLEAN NOT NULL DEFAULT false,
      summary                    TEXT,
      metadata                   JSONB NOT NULL DEFAULT '{}',
      created_at                 BIGINT NOT NULL,
      updated_at                 BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_intake_runs_user ON career_intake_runs (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_career_intake_runs_status ON career_intake_runs (status, created_at DESC);

    CREATE TABLE IF NOT EXISTS career_source_mappings (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_id BIGINT REFERENCES career_intake_documents(id) ON DELETE SET NULL,
      source_kind TEXT NOT NULL,
      source_filename TEXT,
      source_location TEXT,
      source_label TEXT,
      entry_type TEXT NOT NULL,
      target_table TEXT NOT NULL,
      target_id BIGINT NOT NULL,
      atom_key TEXT NOT NULL,
      original_value JSONB,
      committed_value JSONB,
      match_type TEXT,
      affinity DOUBLE PRECISION,
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_career_source_mappings_target ON career_source_mappings (target_table, target_id);
    CREATE INDEX IF NOT EXISTS idx_career_source_mappings_document ON career_source_mappings (document_id);
  `);

  // One-shot: inject "Career Master" tab into the admin_nav content view.
  try {
    const navRow3 = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRow3.length > 0) {
      const nav = JSON.parse(navRow3[0].data);
      const contentView = (nav.views || []).find((v) => v.id === 'content');
      if (contentView) {
        contentView.tabs = contentView.tabs || [];
        const hasCareerMaster = contentView.tabs.some((t) => t.id === 'career-master');
        if (!hasCareerMaster) {
          contentView.tabs.push({ id: 'career-master', label: 'Career Master', componentId: 'careerMaster', sortOrder: 2 });
          await sql.unsafe(
            `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
            [JSON.stringify(nav), Date.now()]
          );
        }
      }
    }
  } catch (e) {
    console.warn('[db] career-master nav injection skipped:', e.message);
  }

  // One-shot: inject "Output Templates" tab into the admin_nav content view
  // — the 4-layer output template configurator (src/components/admin/
  // OutputTemplateConfigurator.jsx), additive alongside the existing "My
  // Resume" tab rather than replacing it.
  try {
    const navRow4 = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRow4.length > 0) {
      const nav = JSON.parse(navRow4[0].data);
      const contentView = (nav.views || []).find((v) => v.id === 'content');
      if (contentView) {
        contentView.tabs = contentView.tabs || [];
        const hasOutputTemplates = contentView.tabs.some((t) => t.id === 'output-templates');
        if (!hasOutputTemplates) {
          contentView.tabs.push({ id: 'output-templates', label: 'Output Templates', componentId: 'outputTemplates', sortOrder: 2.5 });
          await sql.unsafe(
            `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
            [JSON.stringify(nav), Date.now()]
          );
        }
      }
    }
  } catch (e) {
    console.warn('[db] output-templates nav injection skipped:', e.message);
  }

  // One-shot: inject "Commercial Opportunity Pipeline" tab into the admin_nav
  // crm view (2026-08-06, Phase 3 — Weekly Research & Outreach commercial
  // pipeline), alongside the existing "Leads" tab rather than replacing it.
  try {
    const navRow4b = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRow4b.length > 0) {
      const nav = JSON.parse(navRow4b[0].data);
      const crmView = (nav.views || []).find((v) => v.id === 'crm');
      if (crmView) {
        crmView.tabs = crmView.tabs || [];
        const hasCommercialOpportunities = crmView.tabs.some((t) => t.id === 'commercial-opportunities');
        if (!hasCommercialOpportunities) {
          crmView.tabs.push({ id: 'commercial-opportunities', label: 'Commercial Opportunity Pipeline', componentId: 'commercialOpportunities', sortOrder: 1 });
          await sql.unsafe(
            `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
            [JSON.stringify(nav), Date.now()]
          );
        }
      }
    }
  } catch (e) {
    console.warn('[db] commercial-opportunities nav injection skipped:', e.message);
  }

  // One-shot: inject "Methodology Config" tab into the admin_nav system view
  // — the generic Config Envelope editor (src/components/admin/
  // MethodologyConfigPanel.jsx, server/lib/configEnvelope.js), additive
  // alongside Config/Data Lineage/Command Center rather than replacing them.
  try {
    const navRow5 = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRow5.length > 0) {
      const nav = JSON.parse(navRow5[0].data);
      const systemView = (nav.views || []).find((v) => v.id === 'system');
      if (systemView) {
        systemView.tabs = systemView.tabs || [];
        const hasMethodologyConfig = systemView.tabs.some((t) => t.id === 'methodology-config');
        if (!hasMethodologyConfig) {
          systemView.tabs.push({ id: 'methodology-config', label: 'Methodology Config', componentId: 'methodologyConfig', sortOrder: 3 });
          await sql.unsafe(
            `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
            [JSON.stringify(nav), Date.now()]
          );
        }
      }
    }
  } catch (e) {
    console.warn('[db] methodology-config nav injection skipped:', e.message);
  }

  // ── Member product onboarding + self-service commerce ──────────────────
  //
  // product_licenses already carries the fields this needs (user/org scope,
  // tier, granted_by null = self-service, expires_at null = perpetual) — see
  // CREATE TABLE product_licenses above. access_mode makes a license's
  // commercial shape explicit instead of inferring it from tier + expires_at.
  //
  // deliverable_packages: the reusable 3D-rendered HTML deliverable a
  // product_license grants access to. entitlement_renewals: backs the
  // annual-entitlement tier's quarterly update inclusions. commerce_payments:
  // minimal payment-event log — Stripe remains the source of truth for the
  // actual transaction. product_onboarding_runs: the 5-question sample
  // journey per product, generalized from career_intake_runs.
  await sql.unsafe(`
    ALTER TABLE product_licenses ADD COLUMN IF NOT EXISTS access_mode TEXT;
      -- 'self_service_view' | 'self_service_download' | 'annual_entitlement' | 'custom_enterprise'

    -- Gates self-service commerce to SMB. Unset = treated as SMB-eligible by
    -- default (individuals and new orgs aren't blocked); an admin flags an
    -- org 'mid_market' or 'enterprise' via the existing profile tools to move
    -- it to the custom-scoping path instead.
    ALTER TABLE organization_profiles ADD COLUMN IF NOT EXISTS segment TEXT;
      -- 'smb' | 'mid_market' | 'enterprise'

    CREATE TABLE IF NOT EXISTS deliverable_packages (
      id                   TEXT PRIMARY KEY,   -- natural key, e.g. 'dp.hos-scenario-explorer' — seeded idempotently below
      product_id           TEXT NOT NULL,
      title                TEXT NOT NULL,
      description          TEXT,
      html_storage_key     TEXT,       -- points into the existing uploads storage (server/routes/uploads.js)
      version              TEXT NOT NULL DEFAULT '1',
      smb_eligible          BOOLEAN NOT NULL DEFAULT TRUE,
      view_price_cents      INTEGER,       -- period-gated view-only self-service price; null = not sold this way
      view_period_days      INTEGER NOT NULL DEFAULT 30,
      flat_fee_price_cents  INTEGER,       -- one-time downloadable traditional-deliverable price; null = not offered
      annual_price_cents    INTEGER,       -- annual entitlement price; null = not offered
      is_active             BOOLEAN NOT NULL DEFAULT TRUE,
      created_at             BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at             BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_deliverable_packages_product ON deliverable_packages (product_id);

    CREATE TABLE IF NOT EXISTS entitlement_renewals (
      id                        BIGSERIAL PRIMARY KEY,
      license_id                BIGINT NOT NULL REFERENCES product_licenses(id) ON DELETE CASCADE,
      period_start               BIGINT NOT NULL,
      period_end                 BIGINT NOT NULL,
      quarterly_updates_included INTEGER NOT NULL DEFAULT 4,
      quarterly_updates_used     INTEGER NOT NULL DEFAULT 0,
      created_at                 BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_entitlement_renewals_license ON entitlement_renewals (license_id);

    CREATE TABLE IF NOT EXISTS commerce_payments (
      id                 BIGSERIAL PRIMARY KEY,
      user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deliverable_id     TEXT REFERENCES deliverable_packages(id) ON DELETE SET NULL,
      license_id         BIGINT REFERENCES product_licenses(id) ON DELETE SET NULL,
      purchase_kind      TEXT NOT NULL,   -- 'self_service_view' | 'self_service_download' | 'annual_entitlement'
      stripe_session_id  TEXT,
      amount_cents       INTEGER NOT NULL,
      status             TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | failed | refunded
      stub               BOOLEAN NOT NULL DEFAULT FALSE,   -- true when created via the no-Stripe-key stdout stub
      created_at         BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at         BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_commerce_payments_user ON commerce_payments (user_id);
    CREATE INDEX IF NOT EXISTS idx_commerce_payments_session ON commerce_payments (stripe_session_id);

    CREATE TABLE IF NOT EXISTS product_onboarding_runs (
      id           BIGSERIAL PRIMARY KEY,
      user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id   TEXT NOT NULL,
      answers      JSONB NOT NULL DEFAULT '[]',  -- [{ question, answer }, ...] — up to 5
      status       TEXT NOT NULL DEFAULT 'in_progress',  -- in_progress | completed
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_product_onboarding_runs_user ON product_onboarding_runs (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_onboarding_runs_product ON product_onboarding_runs (product_id);

    -- ── Beta product feedback loop ────────────────────────────────────────
    -- Member-submitted feedback on beta products, scored automatically
    -- (server/lib/feedbackScoring.js) from a per-category weight and upvote
    -- count, then auto-routed into backlog_items once the score clears
    -- ROUTE_THRESHOLD. feedback_category_weights is the "curated individuals
    -- advising on real weights" mechanic — admins and active feedback_advisors
    -- can adjust it, which reprices every future (not retroactive) score.
    CREATE TABLE IF NOT EXISTS product_feedback (
      id                     BIGSERIAL PRIMARY KEY,
      user_id                BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id             TEXT,
      category               TEXT NOT NULL DEFAULT 'idea',  -- bug | friction | idea | praise
      message                TEXT NOT NULL,
      status                 TEXT NOT NULL DEFAULT 'new',   -- new | reviewing | routed | archived
      score                  NUMERIC NOT NULL DEFAULT 0,
      upvotes                INTEGER NOT NULL DEFAULT 0,
      routed_backlog_item_id BIGINT REFERENCES backlog_items(id) ON DELETE SET NULL,
      created_at             BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at             BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_product_feedback_user ON product_feedback (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_feedback_score ON product_feedback (score DESC);
    CREATE INDEX IF NOT EXISTS idx_product_feedback_status ON product_feedback (status);

    CREATE TABLE IF NOT EXISTS feedback_advisors (
      user_id     BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      is_active   BOOLEAN NOT NULL DEFAULT true,
      note        TEXT,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS feedback_category_weights (
      category    TEXT PRIMARY KEY,
      weight      NUMERIC NOT NULL DEFAULT 1,
      updated_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
      updated_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
  `);

  // Seed default category weights — insert-if-missing so an admin/advisor's
  // later edits are never overwritten by a reboot.
  for (const [category, weight] of [['bug', 3], ['friction', 2], ['idea', 1], ['praise', 0.5]]) {
    await sql.unsafe(
      `INSERT INTO feedback_category_weights (category, weight, updated_at) VALUES ($1, $2, $3) ON CONFLICT (category) DO NOTHING`,
      [category, weight, Date.now()]
    );
  }

  // One-shot: inject "Feedback" tab into the admin_nav PLM view, next to
  // Backlog — same additive pattern as the output-templates injection above.
  try {
    const navRow5 = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRow5.length > 0) {
      const nav = JSON.parse(navRow5[0].data);
      const plmView = (nav.views || []).find((v) => v.id === 'plm');
      if (plmView) {
        plmView.tabs = plmView.tabs || [];
        const hasFeedback = plmView.tabs.some((t) => t.id === 'feedback');
        if (!hasFeedback) {
          plmView.tabs.push({ id: 'feedback', label: 'Feedback', componentId: 'feedback', sortOrder: 1.5 });
          await sql.unsafe(
            `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
            [JSON.stringify(nav), Date.now()]
          );
        }
      }
    }
  } catch (e) {
    console.warn('[db] feedback nav injection skipped:', e.message);
  }

  // One-shot: inject "EIDOS Operating Model" as its own top-level admin_nav
  // view (not a tab inside an existing view — it's its own domain). Single
  // componentId 'eidos' backs all its internal sub-tabs; the component
  // itself owns its own tab bar (see EidosOperatingModelPanel.jsx), same
  // pattern as CareerMasterPanel.
  try {
    const navRow6 = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRow6.length > 0) {
      const nav = JSON.parse(navRow6[0].data);
      nav.views = nav.views || [];
      const hasEidos = nav.views.some((v) => v.id === 'eidos');
      if (!hasEidos) {
        nav.views.push({
          id: 'eidos', label: 'EIDOS Operating Model', sortOrder: 4, tabs: [
            { id: 'eidos', label: 'EIDOS Operating Model', componentId: 'eidos', sortOrder: 0 },
          ],
        });
        await sql.unsafe(
          `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
          [JSON.stringify(nav), Date.now()]
        );
      }
    }
  } catch (e) {
    console.warn('[db] eidos nav injection skipped:', e.message);
  }

  // One-shot: inject "Lonetree MVP" as its own top-level admin_nav view
  // (2026-07-29) — Betsy's Fund/PortCo demonstration surface, single
  // componentId backing its own internal tab bar, same pattern as EIDOS.
  try {
    const navRowLonetree = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRowLonetree.length > 0) {
      const nav = JSON.parse(navRowLonetree[0].data);
      nav.views = nav.views || [];
      const hasLonetree = nav.views.some((v) => v.id === 'lonetreeMvp');
      if (!hasLonetree) {
        nav.views.push({
          id: 'lonetreeMvp', label: 'Lonetree MVP', sortOrder: 5, tabs: [
            { id: 'lonetreeMvp', label: 'Lonetree MVP', componentId: 'lonetreeMvp', sortOrder: 0 },
          ],
        });
        await sql.unsafe(
          `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
          [JSON.stringify(nav), Date.now()]
        );
      }
    }
  } catch (e) {
    console.warn('[db] lonetreeMvp nav injection skipped:', e.message);
  }

  // One-shot: inject "Publication" as its own top-level admin_nav view
  // (2026-08-07) — Betsy's content-publication journey (HERQ now; Marketing
  // Ads / Research Reports follow the identical pattern once their own
  // content model exists, see server/lib/publicationFlowEnvelopes.js's
  // header). Single componentId backing the World Shell island, same
  // pattern as lonetreeMvp/eidos above.
  try {
    const navRowPub = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRowPub.length > 0) {
      const nav = JSON.parse(navRowPub[0].data);
      nav.views = nav.views || [];
      const hasPublication = nav.views.some((v) => v.id === 'publication');
      if (!hasPublication) {
        nav.views.push({
          id: 'publication', label: 'Publication', sortOrder: 7, tabs: [
            { id: 'herqPublications', label: 'HERQ Publications', componentId: 'herqPublications', sortOrder: 0 },
          ],
        });
        await sql.unsafe(
          `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
          [JSON.stringify(nav), Date.now()]
        );
      }
    }
  } catch (e) {
    console.warn('[db] publication nav injection skipped:', e.message);
  }

  // Metric Intelligence is a governed finance capability surfaced inside
  // Analytics. Additive and idempotent: existing admin navigation edits are
  // preserved and only the missing tab is appended.
  try {
    const navRows = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRows.length) {
      const nav = JSON.parse(navRows[0].data);
      let analytics = (nav.views || []).find((view) => view.id === 'analytics');
      if (!analytics) {
        analytics = { id: 'analytics', label: 'Analytics', sortOrder: 5, tabs: [] };
        nav.views.push(analytics);
      }
      analytics.tabs = analytics.tabs || [];
      if (!analytics.tabs.some((tab) => tab.id === 'metric-intelligence')) {
        analytics.tabs.push({ id: 'metric-intelligence', label: 'Metric Intelligence', componentId: 'metricIntelligence', sortOrder: 1 });
        await sql.unsafe(`UPDATE config_state SET data=$1, updated_at=$2 WHERE id='admin_nav'`, [JSON.stringify(nav), Date.now()]);
      }
    }
  } catch (e) {
    console.warn('[db] metric intelligence nav injection skipped:', e.message);
  }

  // Additive Website Intelligence workspace. This only updates admin
  // navigation configuration; it never modifies draft or published site data.
  try {
    const navRows = await sql.unsafe(`SELECT data FROM config_state WHERE id = 'admin_nav'`);
    if (navRows.length > 0) {
      const nav = JSON.parse(navRows[0].data);
      nav.views = nav.views || [];
      if (!nav.views.some((view) => view.id === 'website-intelligence')) {
        nav.views.push({
          id: 'website-intelligence', label: 'Website Intelligence', sortOrder: 4.5, tabs: [
            { id: 'website-intelligence', label: 'Public Site Inventory', componentId: 'websiteIntelligence', sortOrder: 0 },
          ],
        });
        await sql.unsafe(
          `UPDATE config_state SET data = $1, updated_at = $2 WHERE id = 'admin_nav'`,
          [JSON.stringify(nav), Date.now()]
        );
      }
    }
  } catch (e) {
    console.warn('[db] website intelligence nav injection skipped:', e.message);
  }

  // Compatibility for databases that briefly received the commerce draft
  // with BIGINT package/product identifiers before natural string keys were
  // finalized. Convert in place before seeding the canonical dp.* IDs.
  await sql.unsafe(`
    ALTER TABLE commerce_payments DROP CONSTRAINT IF EXISTS commerce_payments_deliverable_id_fkey;
    ALTER TABLE deliverable_packages ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE deliverable_packages ALTER COLUMN product_id TYPE TEXT USING product_id::text;
    ALTER TABLE commerce_payments ALTER COLUMN deliverable_id TYPE TEXT USING deliverable_id::text;
    ALTER TABLE product_onboarding_runs ALTER COLUMN product_id TYPE TEXT USING product_id::text;
    ALTER TABLE commerce_payments
      ADD CONSTRAINT commerce_payments_deliverable_id_fkey
      FOREIGN KEY (deliverable_id) REFERENCES deliverable_packages(id) ON DELETE SET NULL;
  `).catch((e) => {
    if (!/already exists|duplicate object/i.test(e.message)) throw e;
  });

  // ── Seed: deliverable_packages ───────────────────────────────────────────
  // Starter catalog for SMB self-service commerce. Prices are placeholders —
  // Betsy should confirm actual pricing before this is exposed publicly.
  const deliverablePackageDefs = [
    { id: 'dp.hos-journey-rod-explorer', product_id: 'hos', title: 'Journey Data Rod Explorer',
      description: 'Interactive 3D view of your Revenue, Customer, and Member journey rods with scenario-driven maturity.',
      view_price_cents: 49500, view_period_days: 30, flat_fee_price_cents: 129500, annual_price_cents: 495000 },
    { id: 'dp.hos-architecture-translation', product_id: 'hos', title: 'Architecture Translation Package',
      description: 'Current-state system map translated into the atoms, joints, and molecules of your future Salt Basin Net Work.',
      view_price_cents: 79500, view_period_days: 30, flat_fee_price_cents: 179500, annual_price_cents: 795000 },
  ];
  for (const dp of deliverablePackageDefs) {
    await sql.unsafe(
      `INSERT INTO deliverable_packages (id, product_id, title, description, view_price_cents, view_period_days, flat_fee_price_cents, annual_price_cents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [dp.id, dp.product_id, dp.title, dp.description, dp.view_price_cents, dp.view_period_days, dp.flat_fee_price_cents, dp.annual_price_cents]
    );
  }
  // One-time text fix: the seed above only inserts once (ON CONFLICT DO
  // NOTHING — intentional, so it never clobbers an admin's future catalog
  // edits). This corrects wording from the pre-redesign 5-tier vocabulary
  // to the canonical Atom/Joint/Molecule model in an already-seeded row,
  // scoped to the exact stale string so it never touches a real edit.
  await sql.unsafe(`
    UPDATE deliverable_packages
    SET description = 'Current-state system map translated into the atoms, joints, and molecules of your future Salt Basin Net Work.'
    WHERE id = 'dp.hos-architecture-translation'
      AND description = 'Current-state system map translated into HOS™ capability clusters, metadata, and API dependencies.'
  `);

  // One-shot: replace the "Coming Soon Resources" placeholder on the public
  // Resources page with two real sections (IP Stack, Acronym & Brand System)
  // plus a third, deeper technical section (Methodology Mathematics — the
  // actual HOS™ stage-gate algebra from server/lib/journeyRods.js and the
  // institutional-constants table it depends on). No admin session touched
  // this — same pattern as the admin_nav one-shot injections above, applied
  // to site_state draft instead. Guarded by section id so it never re-runs
  // or clobbers a manual edit; only ever applies to DRAFT — publishing is a
  // deliberate human action via the existing admin Publish button.
  try {
    const siteDraftRow = await sql.unsafe(`SELECT data FROM site_state WHERE id = 'draft'`);
    if (siteDraftRow.length > 0) {
      const site = JSON.parse(siteDraftRow[0].data);
      const resourcesPage = site.pages?.resources;
      const hasIpStack = resourcesPage?.sections?.some((s) => s.id === 'res-ip-stack');
      if (resourcesPage && !hasIpStack) {
        const ipStackSection = {
          id: 'res-ip-stack', type: 'architectureSteps', name: 'The IP Stack', status: 'live', bg: 'navy',
          fields: {
            eyebrow: 'The IP Stack',
            heading: 'Methodology → Diagnostic → Platform → Deliverable',
            intro: 'Five layers, each one operationalizing the layer above it.',
            steps: [
              { title: 'The Salter Momentum™* — Master Methodology', description: 'Universal sequencing spine: Understanding → Rendering → Manifesting (U/R/M). Applies to any initiative, not just revenue.' },
              { title: 'RLMM™ (Revenue Lifecycle Mechanics Maturity™) — Diagnostic', description: 'Proprietary diagnostic capability model that tactically applies the Salter Momentum spine to revenue operations.' },
              { title: 'HOS™ (Highway Operating System) — Methodology', description: 'The named operating methodology for Quote-to-Revenue intelligence. Journey Data Rods live inside this methodology, tracked through SaltBridge.' },
              { title: 'Salt Basin MRS (Measurement Rendering Systems) — Platform', description: "The product/platform that operationalizes HOS™ to design, build, and maintain a client's Enterprise Ecosystem — delivered as a Salt Basin Net Work." },
              { title: 'Client Deliverables — Output Layer', description: 'Assessments, workbooks, frameworks, and reports produced from everything above.' },
            ],
          },
        };
        const acronymSection = {
          id: 'res-acronyms', type: 'columns', name: 'Acronym & Brand System', status: 'live', bg: 'ivory',
          fields: {
            eyebrow: 'Brand & Naming System',
            heading: 'Acronyms That Carry More Than One Meaning',
            intro: 'Deliberate wordplay across the entity structure — never auto-corrected to "just one" reading.',
            columnCount: 3,
            cols: [
              { icon: '◇', title: 'MESS — MES Subsidiaries, LLC', body: 'Martha Elizabeth Salter Subsidiaries (legacy anchor) · Monetized Economic Spending Solutions · Managed Equity Security Services · Measured Enterprise Scaling Solutions.' },
              { icon: '◈', title: 'MES Solutions, LLC', body: 'Measured Enterprise Success Solutions. Houses MESS Platforms, SaltTide™, SaltBridge, SaltChannels, Salt Covenant Solutions, Revenue Intelligence, RLMM™, and Salt Basin MRS.' },
              { icon: '◰', title: 'MESA — MES Agencies, LLC', body: 'Advisory, delivery, and diagnostic services across industries — the only Tier 4 entity confirmed filed. Formerly "The Salter Influence."' },
            ],
          },
        };
        const methodologyMathSection = {
          id: 'res-methodology-math', type: 'methodologyMath', name: 'Methodology Mathematics', status: 'live',
          fields: {
            eyebrow: 'For the technically curious',
            heading: 'Methodology Mathematics',
            intro: 'How each methodology actually computes, and how the constants an institution configures plug into a single evaluation engine.',
            methodologies: [
              {
                kind: 'Master Methodology — Qualitative', name: 'The Salter Momentum™*',
                summary: 'No scoring formula of its own — it is the fixed sequencing constant every other methodology inherits. Every diagnostic, journey, or build always runs Understanding → Rendering → Manifesting, in that order.',
                formula: '', notes: '',
              },
              {
                kind: 'Diagnostic — Pending Finalization', name: 'RLMM™ (Revenue Lifecycle Mechanics Maturity™)',
                summary: 'Applies the same weighted-maturity pattern used by the Journey Data Rod evaluation engine (below) to revenue-lifecycle diagnostics specifically. Exact stage names and default weights are not yet finalized — no RLMM-specific formula is final until confirmed.',
                formula: '', notes: "Open item: RLMM™ process-stage names pending Betsy's finalization.",
              },
              {
                kind: 'Methodology — Shipped, Journey Data Rods', name: 'HOS™ Stage-Gate Evaluation',
                summary: "The real, running evaluation engine (server/lib/journeyRods.js). A cluster passes based on its configured rule; a dimension is the clamped [0,1] value of a cluster pass, a molecule's evidence value, or an actor-role's completion; a stage gate passes only when every required cluster, molecule, actor, dependency, and weighted-dimension threshold clears.",
                formula:
`Cluster_passed(C):
  |found(C)| = |keys(C)|          if rule(C) = "all"
  |found(C)| > 0                  if rule(C) = "any"
  |found(C)| ≥ min_count(C)       if rule(C) = "minimum"

Dimension value:
  d(k) = clamp( value_source(k), 0, 1 )

Weighted combination (per stage gate G):
  Actual(G) = Σ [ d(k_i) × w_i ] / Σ w_i
  Passed(G) = Actual(G) + ε ≥ θ(G),  ε = 0.0001

Gate advancement:
  Gate_passed(G) = missing_clusters = ∅ ∧ missing_molecules = ∅
                    ∧ missing_actors = ∅ ∧ unmet_dependencies = ∅
                    ∧ missing_dimensions = ∅
  Eligible_stage = last G (in sort order) where Gate_passed(G) = true,
                    evaluated in sequence, halting at first failure

Rod state, per event:
  stage_score(t+1) = stage_score(t) + Δscore
  potential_revenue(t+1) = potential_revenue(t) + Δrevenue
  current_stage(t+1) = to_stage, if provided`,
                notes: 'This is the actual algebra running in production — not illustrative.',
              },
              {
                kind: 'Platform — Execution Layer', name: 'Salt Basin MRS',
                summary: "Owns no separate formula. It is the platform that stores an institution's constants, runs the HOS™ evaluation above against real evidence, and renders the result as a living, board-ready record.",
                formula: '', notes: '',
              },
            ],
            constantsHeading: 'The Unified Data Model of Institutional Constants',
            constants: [
              { constant: 'Cluster completion rule', symbol: 'rule(C)', location: 'journey_metadata_clusters.completion_rule', configurableBy: 'Institution, per metadata cluster' },
              { constant: 'Cluster minimum count', symbol: 'min_count(C)', location: 'journey_metadata_clusters.minimum_count', configurableBy: 'Institution, per metadata cluster' },
              { constant: 'Dimension weight', symbol: 'w_i', location: 'journey_rod_threshold_profiles.combinations[].members[].weight', configurableBy: 'Institution, per journey rod / scenario' },
              { constant: 'Combination threshold', symbol: 'θ(G)', location: 'journey_rod_threshold_profiles.combinations[].threshold', configurableBy: 'Institution, per journey rod / scenario' },
              { constant: 'Required clusters / molecules / actor roles', symbol: 'R(G)', location: 'journey_gate_definitions.required_*', configurableBy: 'Institution, per scenario stage gate' },
              { constant: 'Event score / revenue delta', symbol: 'Δscore, Δrevenue', location: "recordRodEvent() caller input, per event type", configurableBy: 'Salt Basin default per event type, overridable per institution' },
            ],
            agentHeading: 'The Agent Experience',
            agentSteps: [
              { label: 'Signal Ingestion', desc: 'A Salt Basin agent observes a real institutional event — a purchase, a completed sample journey, an uploaded document — and records it as evidence.' },
              { label: 'Institutional Context', desc: "The engine loads that institution's own configured constants: its clusters, gates, and threshold profile — never a shared default once the institution has its own." },
              { label: 'Capability Model Execution', desc: "The fixed, Salt-Basin-maintained HOS™ algebra above runs against the institution's constants and evidence — the institution never touches the evaluation code, only its business rules." },
              { label: 'Human Judgment Where Ambiguous', desc: "When a gate doesn't clearly pass, the agent requests a decision instead of guessing — a human stays in the loop exactly where the institution's own rules are unclear." },
              { label: 'Living Record', desc: "Every event, evidence value, and decision is preserved, so the organization's operating history and context compounds instead of resetting." },
              { label: 'Board-Ready Output', desc: 'Salt Basin renders the accumulated maturity, score, and stage into reportable views — accurate, presentable, and ready for the room.' },
            ],
            footnote: "Institutions define business rules by adjusting these constants — or adopt Salt Basin's pre-built default scenario, cluster, and gate templates unchanged.",
          },
        };

        resourcesPage.sections = (resourcesPage.sections || []).filter((s) => s.id !== 'res-coming');
        resourcesPage.sections.push(ipStackSection, acronymSection, methodologyMathSection);
        await sql.unsafe(`UPDATE site_state SET data = $1, updated_at = $2 WHERE id = 'draft'`, [JSON.stringify(site), Date.now()]);
      }
    }
  } catch (e) {
    console.warn('[db] resources-page methodology sections injection skipped:', e.message);
  }

  // ── Real bonding-rule schema additions (2026-07-27) — Semantic Affinity
  // Field / dual-scoped bonding rules, per the salt-basin-channel-journey-
  // architecture skill's reuse-first law. Additive columns only, no new
  // tables: Atom Clusters stay computed on demand (never a static
  // pre-declared list — see server/lib/eidosBonding.js), Molecule state
  // stays event-sourced via journey_rod_events. These columns are what makes
  // that computation real instead of the static molecule_keys[] approximation
  // a prior session mistakenly built for Career Molecules (2026-07-16).
  const bondingRuleBackfill = [
    `ALTER TABLE journey_rod_evidence ADD COLUMN IF NOT EXISTS magnetic_properties JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE journey_metadata_clusters ADD COLUMN IF NOT EXISTS attraction_tags JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE journey_metadata_clusters ADD COLUMN IF NOT EXISTS min_attraction_overlap NUMERIC NOT NULL DEFAULT 1`,
    `ALTER TABLE journey_atom_affinity_rules ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'master_data'`,
    `ALTER TABLE journey_atom_affinity_rules ADD COLUMN IF NOT EXISTS current_key TEXT`,
  ];
  for (const stmt of bondingRuleBackfill) {
    await sql.unsafe(stmt).catch((e) => console.warn('[db] bonding-rule schema backfill warning (safe to ignore on repeat boots):', stmt, '--', e.message));
  }
  // CHECK constraint added separately and only once — Postgres has no "ADD
  // CONSTRAINT IF NOT EXISTS," and errors on re-adding an existing one.
  try {
    const hasScopeCheck = await sql.unsafe(`
      SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'journey_atom_affinity_rules_scope_type_check'
    `);
    if (hasScopeCheck.length === 0) {
      await sql.unsafe(`ALTER TABLE journey_atom_affinity_rules ADD CONSTRAINT journey_atom_affinity_rules_scope_type_check CHECK (scope_type IN ('master_data','channel_current'))`);
    }
  } catch (e) {
    console.warn('[db] journey_atom_affinity_rules scope_type check constraint warning:', e.message);
  }

  // One-shot: give every existing journey_metadata_clusters row (molecule
  // definition) a real, tag-based attraction field instead of leaving the
  // new attraction_tags column empty. Generic and platform-wide — applies to
  // Career's clusters and the pre-existing revenue-lifecycle clusters alike,
  // not a Career-specific backfill. Default: a molecule attracts atoms
  // tagged with its own cluster_key, overlap of 1 — the simplest real
  // bonding rule, refined per-cluster later if a richer field is needed.
  try {
    await sql.unsafe(`
      UPDATE journey_metadata_clusters
      SET attraction_tags = to_jsonb(ARRAY[cluster_key]), min_attraction_overlap = 1
      WHERE attraction_tags = '[]'::jsonb
    `);
  } catch (e) {
    console.warn('[db] journey_metadata_clusters attraction_tags backfill warning:', e.message);
  }

  // One-time repair of the JSONB double-encoding damage in
  // journey_metadata_clusters.molecule_keys (found 2026-07-29: 9 of 11 rows
  // held a JSON *string* of the array rather than the array). The seed writers
  // above have all passed raw JS arrays since the 2026-07-27 audit — verified
  // by direct reproduction — but every one of them uses ON CONFLICT DO NOTHING,
  // so an already-corrupt row can never self-heal no matter how many times
  // bootstrap runs. Hence an explicit repair rather than relying on reseed.
  //
  // This mattered more than it looked: clusterPassed() (server/lib/journeyRods.js)
  // calls .filter() on this value, which throws TypeError against a string. It
  // had never fired only because journey_scenarios is empty, so
  // evaluateJourneyRod() returns before reaching cluster logic — seeding the
  // first scenario would have detonated it for 9 clusters at once.
  //
  // Idempotent by construction: the WHERE clause matches only non-array rows,
  // so a repaired row is never touched again. Rows whose text does not parse to
  // a JSON array are left alone and reported rather than coerced.
  try {
    const repaired = await sql.unsafe(`
      UPDATE journey_metadata_clusters
      SET molecule_keys = (molecule_keys #>> '{}')::jsonb
      WHERE jsonb_typeof(molecule_keys) = 'string'
        AND jsonb_typeof((molecule_keys #>> '{}')::jsonb) = 'array'
      RETURNING cluster_key
    `);
    if (repaired.length) console.log(`[db] repaired double-encoded molecule_keys on ${repaired.length} cluster(s): ${repaired.map((r) => r.cluster_key).join(', ')}`);
    const stillBad = await sql.unsafe(`SELECT cluster_key FROM journey_metadata_clusters WHERE jsonb_typeof(molecule_keys) <> 'array'`);
    if (stillBad.length) console.warn(`[db] journey_metadata_clusters rows whose molecule_keys is still not an array (manual review needed): ${stillBad.map((r) => r.cluster_key).join(', ')}`);
  } catch (e) {
    console.warn('[db] journey_metadata_clusters molecule_keys repair warning:', e.message);
  }

  // One-shot: tag every existing journey_rod_evidence row's magnetic_properties
  // with its own entryType (from metadata.entryType, already stamped by
  // careerAtomMigration.js and any other evidence writer that sets it) —
  // rows migrated before this session's bonding work exist with the
  // magnetic_properties column defaulted to '[]', which would otherwise make
  // every Molecule assembly find zero compatible atoms for pre-existing
  // evidence (confirmed by direct testing, 2026-07-27). Generic, not
  // Career-specific: applies to any evidence row whose metadata carries an
  // entryType, from any rod_type.
  //
  // Done row-by-row in JS, not a single SQL UPDATE using metadata->>'entryType'
  // — sql.unsafe(query, params) double-encodes a pre-JSON.stringify'd string
  // passed to a ::jsonb param (fixed at every write call site 2026-07-27; see
  // db.js's jsonb-param convention note near the top of this file), but rows
  // written before that fix still hold double-encoded JSON text
  // (jsonb_typeof(metadata) = 'string', not 'object'), so Postgres's native
  // ->> operator can't extract from them server-side. This backfill reads
  // with a JS-side JSON.parse() fallback to cope with both old and new rows.
  try {
    const untagged = await sql.unsafe(`SELECT id, metadata FROM journey_rod_evidence WHERE magnetic_properties = '[]'::jsonb`);
    for (const row of untagged) {
      let meta;
      try { meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata; } catch { continue; }
      if (!meta?.entryType) continue;
      await sql.unsafe(`UPDATE journey_rod_evidence SET magnetic_properties = $1::jsonb WHERE id = $2`, [[meta.entryType], row.id]);
    }
  } catch (e) {
    console.warn('[db] journey_rod_evidence magnetic_properties backfill warning:', e.message);
  }

  // ── Peer-link Tributaries + Channel Current definitions (2026-07-28) ──
  // Two additions, per the salt-basin-channel-journey-architecture skill's
  // reuse-first law:
  //   1. journey_rod_tributary_links — a genuinely new relationship shape
  //      (relationshipKind:'peer' Tributaries connect two INDEPENDENTLY
  //      existing rods that share Atoms/Molecules — never parent_rod_id,
  //      which encodes containment/ownership and is reserved for
  //      relationshipKind:'hierarchical' Tributaries). Many-to-many by
  //      design since a rod may end up peer-linked more than once.
  //   2. journey_current_definitions — every Channel (rod_type) can have a
  //      business-defined Current: which journey_scenarios stage sequence
  //      it uses, minimum atom/molecule maturity, and (for now, declarative-
  //      only — no executor yet) transition and Tributary-trigger rules.
  //      Replaces server/lib/currentRegistry.js's static object with a real,
  //      admin-editable table — same org_id-NULL-is-default/org_id-set-is-
  //      override seam as journey_atom_affinity_rules/data_ports.
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS journey_rod_tributary_links (
        id BIGSERIAL PRIMARY KEY,
        tributary_type TEXT NOT NULL,
        rod_a_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
        rod_b_id BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at BIGINT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_rod_tributary_links_pair ON journey_rod_tributary_links (tributary_type, rod_a_id, rod_b_id);
      CREATE INDEX IF NOT EXISTS idx_rod_tributary_links_a ON journey_rod_tributary_links (rod_a_id);
      CREATE INDEX IF NOT EXISTS idx_rod_tributary_links_b ON journey_rod_tributary_links (rod_b_id);
    `);
  } catch (e) {
    console.warn('[db] journey_rod_tributary_links schema warning:', e.message);
  }

  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS journey_current_definitions (
        id BIGSERIAL PRIMARY KEY,
        current_key TEXT NOT NULL,
        org_id BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        rod_type TEXT NOT NULL REFERENCES journey_rod_types(id),
        scope_type TEXT NOT NULL DEFAULT 'channel_current',
        primary_scenario_key TEXT,
        port_stages JSONB NOT NULL DEFAULT '[]',
        entry_criteria JSONB NOT NULL DEFAULT '{}',
        minimum_carry JSONB NOT NULL DEFAULT '[]',
        transition_rules JSONB NOT NULL DEFAULT '[]',
        tributary_trigger_rules JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_current_def_key_global ON journey_current_definitions (current_key) WHERE org_id IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_current_def_key_org ON journey_current_definitions (current_key, org_id) WHERE org_id IS NOT NULL;
    `);
  } catch (e) {
    console.warn('[db] journey_current_definitions schema warning:', e.message);
  }

  try {
    await sql.unsafe(`ALTER TABLE journey_rod_threshold_profiles ADD COLUMN IF NOT EXISTS current_key TEXT`);
    await sql.unsafe(`ALTER TABLE journey_scenarios ADD COLUMN IF NOT EXISTS current_key TEXT`);
  } catch (e) {
    console.warn('[db] current_key schema warning:', e.message);
  }

  // One-shot seed: migrate the previously-hardcoded career_master_intake
  // Current into the new table, plus the new Revenue Channel Current.
  // scenario_key/gate_definitions for 'default_revenue' are NOT created here
  // — this only registers that the Current, once evaluated, should look
  // there; whether that scenario row exists yet is a separate, pre-existing
  // question this change doesn't resolve.
  try {
    const now = Date.now();
    await sql.unsafe(`
      INSERT INTO journey_current_definitions
        (current_key, org_id, label, rod_type, scope_type, primary_scenario_key, port_stages, entry_criteria, minimum_carry, transition_rules, tributary_trigger_rules, created_at, updated_at)
      VALUES
        ('career_master_intake', NULL, 'Career Master Intake Current', 'career_master', 'master_data', NULL, $1::jsonb, $2::jsonb, $3::jsonb, '[]'::jsonb, '[]'::jsonb, $4, $4)
      ON CONFLICT (current_key) WHERE org_id IS NULL DO NOTHING
    `, [
      JSON.stringify(['requested', 'atoms_captured', 'molecules_bonded']),
      JSON.stringify({ minAtoms: 1 }),
      JSON.stringify(['career_skill_skill', 'career_job_title']),
      now,
    ]);
    await sql.unsafe(`
      INSERT INTO journey_current_definitions
        (current_key, org_id, label, rod_type, scope_type, primary_scenario_key, port_stages, entry_criteria, minimum_carry, transition_rules, tributary_trigger_rules, created_at, updated_at)
      VALUES
        ('revenue_deal_lifecycle', NULL, 'Revenue Channel Current — Deal Lifecycle', 'revenue_lifecycle', 'channel_current', 'default_revenue', $1::jsonb, $2::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, $3, $3)
      ON CONFLICT (current_key) WHERE org_id IS NULL DO NOTHING
    `, [
      JSON.stringify(['qualified_context', 'qualified_opportunity', 'solution_fit', 'scope_defined', 'proposal', 'committed', 'customer']),
      JSON.stringify({ minAtoms: 1 }),
      now,
    ]);
  } catch (e) {
    console.warn('[db] journey_current_definitions seed warning:', e.message);
  }

  // ── Career Placement Agents / Weekly Research & Outreach pipeline
  // (2026-08-06) — reuse-first audit performed via the
  // salt-basin-channel-journey-architecture skill before this landed. See
  // server/lib/opportunityPipelineRegistry.js's header comment for the full
  // classification. Summary: Signal/Event taxonomy, source tiers, and
  // Claim/Evidence reuse the existing journey_rod_evidence +
  // journey_metadata_molecules substrate (signal/business_hypothesis cluster
  // keys already exist from the Lonetree build); scoring dimensions and
  // outreach cadence reuse journey_current_definitions (org-override seam
  // already built); target-expansion adjacency reuses tributaryRegistry.js's
  // TRIBUTARY_TYPES (new 'reference' relationshipKind, since Entity/Person
  // are shared master data referenced by many rods, not owned by exactly one
  // parent rod the way a 'satellite' is). Entity, Person, Relationship, and
  // the agent role/schedule/approval-workflow registry are genuinely new
  // shapes with no existing surface — justified in that same header comment.
  try {
    await sql.unsafe(`
      -- Entity: a governed company/fund/org/product master record, shared
      -- across every opportunity rod that references it (many-to-many via
      -- journey_rod_entity_links below) — not owned by any single parent
      -- rod, so it does NOT use the existing hierarchical 'satellite'
      -- Tributary shape (which assumes exclusive parent_rod_id ownership).
      CREATE TABLE IF NOT EXISTS entities (
        id                 BIGSERIAL PRIMARY KEY,
        org_id             BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
        owner_user_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
        canonical_name     TEXT NOT NULL,
        aliases            JSONB NOT NULL DEFAULT '[]',
        entity_type        TEXT NOT NULL DEFAULT 'company',
        ownership_summary  TEXT,
        metadata           JSONB NOT NULL DEFAULT '{}',
        merged_into_id     BIGINT REFERENCES entities(id) ON DELETE SET NULL,
        merged_from_ids    JSONB NOT NULL DEFAULT '[]',
        created_at         BIGINT NOT NULL,
        updated_at         BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_entities_org ON entities (org_id);
      CREATE INDEX IF NOT EXISTS idx_entities_owner ON entities (owner_user_id);
      CREATE INDEX IF NOT EXISTS idx_entities_name ON entities (canonical_name);

      -- Person: a public professional identity, optionally affiliated with
      -- an Entity. Same shared-master-data reasoning as Entity above.
      CREATE TABLE IF NOT EXISTS persons (
        id                 BIGSERIAL PRIMARY KEY,
        org_id             BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
        owner_user_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
        entity_id          BIGINT REFERENCES entities(id) ON DELETE SET NULL,
        full_name          TEXT NOT NULL,
        public_role        TEXT,
        -- confidence_label per the spec's Section 11 contact-confidence
        -- taxonomy: confirmed_by_employer | strong_public_functional_evidence
        -- | plausible_function_only | recruiter_route | unverified_lead.
        confidence_label   TEXT NOT NULL DEFAULT 'unverified_lead',
        source_type        TEXT,
        source_reference   TEXT,
        metadata           JSONB NOT NULL DEFAULT '{}',
        merged_into_id     BIGINT REFERENCES persons(id) ON DELETE SET NULL,
        merged_from_ids    JSONB NOT NULL DEFAULT '[]',
        created_at         BIGINT NOT NULL,
        updated_at         BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_persons_org ON persons (org_id);
      CREATE INDEX IF NOT EXISTS idx_persons_entity ON persons (entity_id);

      -- Relationship: the known connection between a Person and/or Entity
      -- and a specific member (owner_user_id) — persists independent of any
      -- one opportunity rod, so it is not evidence on a single rod either.
      CREATE TABLE IF NOT EXISTS relationships (
        id                   BIGSERIAL PRIMARY KEY,
        org_id               BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
        owner_user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        person_id            BIGINT REFERENCES persons(id) ON DELETE CASCADE,
        entity_id            BIGINT REFERENCES entities(id) ON DELETE CASCADE,
        route                TEXT,
        strength             TEXT,
        origin               TEXT,
        consent              BOOLEAN NOT NULL DEFAULT false,
        last_interaction_at  BIGINT,
        metadata             JSONB NOT NULL DEFAULT '{}',
        created_at           BIGINT NOT NULL,
        updated_at           BIGINT NOT NULL,
        CONSTRAINT relationships_target_chk CHECK (person_id IS NOT NULL OR entity_id IS NOT NULL)
      );
      CREATE INDEX IF NOT EXISTS idx_relationships_owner ON relationships (owner_user_id);
      CREATE INDEX IF NOT EXISTS idx_relationships_person ON relationships (person_id);
      CREATE INDEX IF NOT EXISTS idx_relationships_entity ON relationships (entity_id);

      -- The 'reference' Tributary join tables — a Channel Rod (typically a
      -- commercial_opportunity_target or career_opportunity_target rod)
      -- referencing a shared Entity/Person, carrying the target-expansion
      -- adjacency metadata (which ring, which parent target, why) from the
      -- spec's Section 4. See tributaryRegistry.js's new 'reference'
      -- relationshipKind.
      CREATE TABLE IF NOT EXISTS journey_rod_entity_links (
        id                BIGSERIAL PRIMARY KEY,
        rod_id            BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
        entity_id         BIGINT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
        tributary_type    TEXT NOT NULL,
        role_in_context   TEXT,
        expansion_ring    TEXT,
        parent_entity_id  BIGINT REFERENCES entities(id) ON DELETE SET NULL,
        reason            TEXT,
        metadata          JSONB NOT NULL DEFAULT '{}',
        created_at        BIGINT NOT NULL,
        UNIQUE(rod_id, entity_id, tributary_type)
      );
      CREATE INDEX IF NOT EXISTS idx_rod_entity_links_rod ON journey_rod_entity_links (rod_id);
      CREATE INDEX IF NOT EXISTS idx_rod_entity_links_entity ON journey_rod_entity_links (entity_id);

      CREATE TABLE IF NOT EXISTS journey_rod_person_links (
        id                BIGSERIAL PRIMARY KEY,
        rod_id            BIGINT NOT NULL REFERENCES journey_data_rods(id) ON DELETE CASCADE,
        person_id         BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        tributary_type    TEXT NOT NULL,
        role_in_context   TEXT,
        metadata          JSONB NOT NULL DEFAULT '{}',
        created_at        BIGINT NOT NULL,
        UNIQUE(rod_id, person_id, tributary_type)
      );
      CREATE INDEX IF NOT EXISTS idx_rod_person_links_rod ON journey_rod_person_links (rod_id);
      CREATE INDEX IF NOT EXISTS idx_rod_person_links_person ON journey_rod_person_links (person_id);

      -- Agent Boundary gap (per salt-basin-channel-journey-architecture's own
      -- surface table: "Design-stage only — not implemented anywhere.
      -- Reserve a nullable agent_boundary_ref JSONB column; do not claim
      -- enforcement that doesn't exist.") agent_definitions is the genuinely
      -- new worker/capability registry that gap calls for — a role isn't a
      -- rod_type (not a subject progressing through journey stages), isn't a
      -- Tributary, isn't an event_type, isn't a tracked interaction, and
      -- isn't an Atom/Molecule definition (those describe evidence about a
      -- rod, not a standalone capability-bearing worker). Agent *actions*
      -- (delegate/evidence-return/propose/approve) reuse journey_rod_events
      -- against whichever rod the agent is working — only the role/
      -- capability/schedule *definitions* are new tables.
      CREATE TABLE IF NOT EXISTS agent_definitions (
        id                   BIGSERIAL PRIMARY KEY,
        org_id               BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
        owner_user_id        BIGINT REFERENCES users(id) ON DELETE CASCADE,
        key                  TEXT NOT NULL,
        name                 TEXT NOT NULL,
        -- pipeline: 'commercial' | 'career' | 'shared' — which half of the
        -- spec's two non-collapsing pipelines this agent serves.
        pipeline             TEXT NOT NULL DEFAULT 'shared',
        role_description     TEXT,
        objective            TEXT,
        capabilities         JSONB NOT NULL DEFAULT '[]',
        boundaries           JSONB NOT NULL DEFAULT '[]',
        reports_to_agent_id  BIGINT REFERENCES agent_definitions(id) ON DELETE SET NULL,
        tier                 INTEGER NOT NULL DEFAULT 0,
        agent_boundary_ref   JSONB,
        is_active            BOOLEAN NOT NULL DEFAULT true,
        created_at           BIGINT NOT NULL,
        updated_at           BIGINT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_def_key_global ON agent_definitions (key) WHERE org_id IS NULL AND owner_user_id IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_def_key_org ON agent_definitions (key, org_id) WHERE org_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_def_key_user ON agent_definitions (key, owner_user_id) WHERE owner_user_id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS agent_schedules (
        id                    BIGSERIAL PRIMARY KEY,
        agent_definition_id   BIGINT NOT NULL REFERENCES agent_definitions(id) ON DELETE CASCADE,
        org_id                BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
        owner_user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
        cadence               TEXT NOT NULL DEFAULT 'on_demand',
        cadence_detail        JSONB NOT NULL DEFAULT '{}',
        -- trigger_mode (2026-08-07, Publication Journey): 'scheduled' runs
        -- purely on cadence; 'observation_required' means the agent must not
        -- act until a matching Signal/Hypothesis Atom (journey_rod_evidence
        -- under journey_metadata_clusters key trigger_molecule_key, e.g.
        -- 'signal') exists — the first real link between the Lonetree-demo
        -- Signal cluster (server/lib/lonetreeDemoRegistry.js) and an agent's
        -- schedule. No executor reads this yet (no live scheduler exists for
        -- any pipeline) — this records the rule for when one is built.
        trigger_mode          TEXT NOT NULL DEFAULT 'scheduled',
        trigger_molecule_key  TEXT,
        is_active             BOOLEAN NOT NULL DEFAULT true,
        last_run_at           BIGINT,
        next_run_at           BIGINT,
        created_at            BIGINT NOT NULL,
        updated_at            BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_agent_schedules_agent ON agent_schedules (agent_definition_id);

      -- agent_run_log (2026-08-07, real on-demand agent execution): one row
      -- per agent-triggered Anthropic call (job research, resume
      -- generation, ...). The only cost/rate governance that exists for a
      -- non-HTTP-request-scoped AI call anywhere in this codebase —
      -- server/lib/rateLimit.js is IP-keyed Express middleware, meaningless
      -- here. checkAndRecordRunAllowance() in opportunityPipelineRegistry.js
      -- reads today's count against the agent_run_daily_cap Config Envelope
      -- before allowing a new run.
      CREATE TABLE IF NOT EXISTS agent_run_log (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_key    TEXT NOT NULL,
        run_type     TEXT NOT NULL,
        created_at   BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_agent_run_log_user_day ON agent_run_log (user_id, agent_key, created_at);

      CREATE TABLE IF NOT EXISTS agent_approval_workflows (
        id                    BIGSERIAL PRIMARY KEY,
        org_id                BIGINT REFERENCES organization_profiles(id) ON DELETE CASCADE,
        pipeline              TEXT NOT NULL DEFAULT 'shared',
        step_key              TEXT NOT NULL,
        name                  TEXT NOT NULL,
        sort_order            INTEGER NOT NULL DEFAULT 0,
        -- required_role_label is a free-text business-function label (e.g.
        -- "Deal Desk", "Customer Success Lead") — the platform has no
        -- generic org-approver-role registry yet (org_memberships.role is
        -- only admin|member|viewer, a coarser concept). A real approver-role
        -- registry is a follow-up, not smuggled into this table.
        required_role_label   TEXT,
        note                  TEXT,
        is_active             BOOLEAN NOT NULL DEFAULT true,
        created_at            BIGINT NOT NULL,
        updated_at            BIGINT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_workflow_step_global ON agent_approval_workflows (pipeline, step_key) WHERE org_id IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_workflow_step_org ON agent_approval_workflows (pipeline, step_key, org_id) WHERE org_id IS NOT NULL;
    `);
  } catch (e) {
    console.warn('[db] opportunity-pipeline schema warning:', e.message);
  }

  // Additive columns for an already-existing agent_schedules table (the
  // CREATE TABLE IF NOT EXISTS above no-ops once the table is real, same
  // idempotent-ALTER pattern as every other schema addition in this file).
  try {
    await sql.unsafe(`ALTER TABLE agent_schedules ADD COLUMN IF NOT EXISTS trigger_mode TEXT NOT NULL DEFAULT 'scheduled'`);
    await sql.unsafe(`ALTER TABLE agent_schedules ADD COLUMN IF NOT EXISTS trigger_molecule_key TEXT`);
  } catch (e) {
    console.warn('[db] agent_schedules trigger columns warning:', e.message);
  }

  // action_key (2026-08-09, real dispatcher): NULL means "this agent's
  // default action"; a non-null value scopes the schedule to one specific
  // action a multi-action agent performs (e.g. Career Researcher's
  // 'research' vs 'posting_verification') so each can carry its own
  // independently-configured cadence rather than sharing one schedule row
  // per agent.
  try {
    await sql.unsafe(`ALTER TABLE agent_schedules ADD COLUMN IF NOT EXISTS action_key TEXT`);
  } catch (e) {
    console.warn('[db] agent_schedules action_key column warning:', e.message);
  }

  try {
    await sql.unsafe(`ALTER TABLE journey_rod_evidence ADD COLUMN IF NOT EXISTS source_tier SMALLINT`);
  } catch (e) {
    console.warn('[db] journey_rod_evidence.source_tier schema warning:', e.message);
  }

  // Platform-default (org_id NULL) seed for the 8 spec agent roles and the
  // shared 2-step approval workflow — seed DATA an org can override via the
  // same org_id seam used everywhere else in this file, never hardcoded
  // logic. Insert-only (ON CONFLICT DO NOTHING), matching the
  // journey_rod_types backfill convention above — never overwrites an
  // admin's later edit.
  try {
    const nowAgentSeed = Date.now();
    const AGENT_ROSTER = [
      { key: 'orchestrator', name: 'Orchestrator / Weekly Research Lead', pipeline: 'shared', tier: 0, reportsTo: null,
        roleDescription: 'Loads canonical state, sets time window, allocates searches, resolves conflicts, ranks results and produces the final run manifest.',
        objective: 'Run the next governed weekly research cycle across both pipelines without losing history.',
        capabilities: ['Load canonical registries and prior run state', 'Allocate searches to other agents', 'Resolve conflicts between agent outputs', 'Produce the run manifest'],
        boundaries: ['Erase history', 'Merge the two pipelines into one score or one message', 'Publish unsupported conclusions'] },
      { key: 'market_signal_researcher', name: 'Market Signal Researcher', pipeline: 'commercial', tier: 1, reportsTo: 'orchestrator',
        roleDescription: 'Finds verified funding, ownership, financing, exit, growth, AI, product, restructuring and partnership events.',
        objective: 'Surface net-new or materially-changed company-event pairs, never syndicated repeats.',
        capabilities: ['Search Tier 1-3 sources for consequential events', 'Link a material update to its prior signal'],
        boundaries: ['Treat syndication as novelty', 'Infer internal problems as facts'] },
      { key: 'target_expansion_researcher', name: 'Target Expansion Researcher', pipeline: 'commercial', tier: 1, reportsTo: 'orchestrator',
        roleDescription: 'Traverses ownership, peer, event, talent and ecosystem graphs; qualifies net-new entities.',
        objective: 'Grow the target universe in relevance, not just size, recording why each entity was added.',
        capabilities: ['Add a new Entity with a recorded parent target, expansion ring and reason'],
        boundaries: ['Expand indiscriminately', 'Add entities without an adjacency reason'] },
      { key: 'salt_basin_opportunity_analyst', name: 'Salt Basin Opportunity Analyst', pipeline: 'commercial', tier: 1, reportsTo: 'orchestrator',
        roleDescription: 'Maps events to solutions, KPIs, evidence gaps, value classification and diagnostic hypotheses.',
        objective: 'Turn a verified company-event record into a testable, honestly-scoped opportunity hypothesis.',
        capabilities: ['Score a company-event pair against the commercial scoring Current', 'Keep fact, inference and modeled value separate'],
        boundaries: ['Claim modeled or potential value as realized'] },
      { key: 'career_researcher', name: 'Career Researcher', pipeline: 'career', tier: 1, reportsTo: 'orchestrator',
        roleDescription: 'Finds and revalidates open roles; scores experience fit and commercial relevance.',
        objective: 'Only ever queue a role that was re-opened and verified this run.',
        capabilities: ['Re-open every employer-controlled job URL before scoring it', 'Score a role against the career scoring Current'],
        boundaries: ['Use stale aggregators as proof of availability'] },
      { key: 'resume_generator', name: 'Resume & Cover Letter Generator', pipeline: 'career', tier: 1, reportsTo: 'orchestrator',
        roleDescription: 'Drafts evidence-grounded resume and cover letter content for a specific approved opportunity.',
        objective: 'Produce review-ready, never-fabricated output content tied to a real tracked opportunity.',
        capabilities: ['Draft resume section content citing real Career Atom entries', 'Draft cover letter content citing real Career Atom entries'],
        boundaries: ['Invent an outcome, metric, or responsibility not present in the member\'s Career Atom evidence', 'Publish or send anything without human approval'] },
      { key: 'herq_content_agent', name: 'HERQ Content & Publication Agent', pipeline: 'herq', tier: 1, reportsTo: 'orchestrator',
        roleDescription: 'Researches a HERQ Series\' assigned scope, drafts post/output recommendations against real research inputs and comment insights, and flags when a draft is ready for review.',
        objective: 'Turn a governed research scope into a review-ready HERQ post or output — never a published one.',
        capabilities: ['Research within an assigned Series scope', 'Draft a post referencing recorded research inputs', 'Flag a draft ready for human review'],
        boundaries: ['Publish, post, or send anything without human approval', 'Generate or select a final image without human review', 'Invent a statistic, quote, or source it did not record as research input'] },
      { key: 'contact_relationship_analyst', name: 'Contact & Relationship Analyst', pipeline: 'shared', tier: 1, reportsTo: 'orchestrator',
        roleDescription: 'Finds accountable functions, public leaders, recruiters and warm routes; maintains confidence labels.',
        objective: 'Find the best route to a person without ever inventing one.',
        capabilities: ['Search warm routes before cold routes', 'Label a Person record with the correct confidence tier'],
        boundaries: ['Invent identities, emails, phone numbers or relationships'] },
      { key: 'outreach_strategist', name: 'Outreach Strategist', pipeline: 'shared', tier: 1, reportsTo: 'orchestrator',
        roleDescription: "Drafts first contacts and follow-ups based on verified facts and Betsy's proof points.",
        objective: 'Produce one individualized, review-ready draft per queued action.',
        capabilities: ['Draft an outreach action citing one verified trigger, one proof point and one CTA'],
        boundaries: ['Send messages', 'Overstate fit', 'Repeat generic outreach'] },
      { key: 'evidence_qa_controller', name: 'Evidence & QA Controller', pipeline: 'shared', tier: 1, reportsTo: 'orchestrator',
        roleDescription: 'Deduplicates, checks sources, timestamps, financial classification, job status, claims and output completeness.',
        objective: 'Issue a pass/fail manifest for the run — never approve records that fail a gate to meet a volume target.',
        capabilities: ['Audit a run against the quality gates', 'Reject a record that fails a gate'],
        boundaries: ['Approve records that fail a gate merely to meet a volume target'] },
    ];
    const idByKey = {};
    for (const a of AGENT_ROSTER) {
      const inserted = await sql.unsafe(
        `INSERT INTO agent_definitions (org_id, owner_user_id, key, name, pipeline, role_description, objective, capabilities, boundaries, reports_to_agent_id, tier, is_active, created_at, updated_at)
         VALUES (NULL, NULL, $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,NULL,$8,true,$9,$9)
         ON CONFLICT (key) WHERE org_id IS NULL AND owner_user_id IS NULL DO NOTHING
         RETURNING id`,
        [a.key, a.name, a.pipeline, a.roleDescription, a.objective, a.capabilities, a.boundaries, a.tier, nowAgentSeed]
      );
      const existingId = inserted[0]?.id
        ?? (await sql.unsafe(`SELECT id FROM agent_definitions WHERE key=$1 AND org_id IS NULL AND owner_user_id IS NULL`, [a.key]))[0]?.id;
      idByKey[a.key] = existingId;
    }
    for (const a of AGENT_ROSTER) {
      if (a.reportsTo && idByKey[a.key] && idByKey[a.reportsTo]) {
        await sql.unsafe(`UPDATE agent_definitions SET reports_to_agent_id=$1 WHERE id=$2 AND reports_to_agent_id IS NULL`, [idByKey[a.reportsTo], idByKey[a.key]]);
      }
    }

    for (const [pipeline, stepKey, name, sortOrder, requiredRoleLabel, note] of [
      ['shared', 'evidence_review', 'Evidence Review', 0, null, 'Any bounded agent may surface evidence — no approval gate.'],
      ['shared', 'proposal_approval', 'Proposal Approval', 1, 'Deal Desk', 'A human holding this role must approve before a proposal commits — nothing is ever sent, applied, or posted automatically (spec Section 2).'],
    ]) {
      await sql.unsafe(
        `INSERT INTO agent_approval_workflows (org_id, pipeline, step_key, name, sort_order, required_role_label, note, is_active, created_at, updated_at)
         VALUES (NULL,$1,$2,$3,$4,$5,$6,true,$7,$7)
         ON CONFLICT (pipeline, step_key) WHERE org_id IS NULL DO NOTHING`,
        [pipeline, stepKey, name, sortOrder, requiredRoleLabel, note, nowAgentSeed]
      );
    }
  } catch (e) {
    console.warn('[db] agent roster/workflow seed warning:', e.message);
  }

  // Scoring + cadence Currents (journey_current_definitions) for the two
  // pipelines — entryCriteria carries a `dimensions`/`tiers` (scoring) or
  // `touches` (cadence) shape here rather than the simpler `minAtoms`-style
  // shape currentRegistry.js's own evaluateEntryCriteria() reads; see
  // opportunityPipelineRegistry.js's evaluateWeightedScore(), which
  // interprets this shape the same way eidosBonding.js interprets
  // journey_atom_affinity_rules — currentRegistry.js itself stays
  // domain-agnostic. Depends on the commercial_opportunity_target/
  // career_opportunity_target rod_types seeded earlier in this function.
  try {
    const nowCurrentSeed = Date.now();
    for (const [currentKey, label, rodType, dimensions, tiers] of [
      ['commercial_opportunity_scoring_v1', 'Salt Basin Commercial Opportunity Scoring', 'commercial_opportunity_target',
        [
          { key: 'trigger_strength', label: 'Trigger strength', weight: 0.20 },
          { key: 'solution_fit', label: 'Salt Basin problem/solution fit', weight: 0.20 },
          { key: 'economic_materiality', label: 'Economic materiality', weight: 0.15 },
          { key: 'timing_urgency', label: 'Timing and urgency', weight: 0.15 },
          { key: 'evidence_gap_plausibility', label: 'Evidence gap plausibility', weight: 0.10 },
          { key: 'access_relationship_path', label: 'Access and relationship path', weight: 0.10 },
          { key: 'serviceability', label: 'Serviceability', weight: 0.10 },
        ],
        [
          { tierLabel: 'A — Act now', min: 80, max: 100 },
          { tierLabel: 'B — Develop', min: 65, max: 79 },
          { tierLabel: 'C — Monitor', min: 50, max: 64 },
          { tierLabel: 'D — Archive/weak', min: 0, max: 49 },
        ]],
      ['career_match_scoring_v1', 'Career Match Scoring', 'career_opportunity_target',
        [
          { key: 'scope_altitude', label: 'Role scope and altitude', weight: 0.15 },
          { key: 'strategic_ops_transformation', label: 'Strategic operations and transformation', weight: 0.15 },
          { key: 'revenue_systems_q2r', label: 'Revenue systems / Q2R / monetization', weight: 0.15 },
          { key: 'ai_validation_data_intel', label: 'AI validation and data intelligence', weight: 0.15 },
          { key: 'pe_value_creation_finance', label: 'PE / value creation / finance relevance', weight: 0.15 },
          { key: 'leadership_stakeholder_fit', label: 'Leadership and stakeholder fit', weight: 0.10 },
          { key: 'transferable_industry_fit', label: 'Transferable industry fit', weight: 0.05 },
          { key: 'practical_fit', label: 'Practical fit', weight: 0.10 },
        ],
        []],
    ]) {
      await sql.unsafe(
        `INSERT INTO journey_current_definitions (current_key, org_id, label, rod_type, scope_type, primary_scenario_key, port_stages, entry_criteria, minimum_carry, transition_rules, tributary_trigger_rules, created_at, updated_at)
         VALUES ($1,NULL,$2,$3,'master_data',NULL,'[]'::jsonb,$4::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,$5,$5)
         ON CONFLICT (current_key) WHERE org_id IS NULL DO NOTHING`,
        [currentKey, label, rodType, { scoringModel: 'weighted_sum_x20', dimensions, tiers }, nowCurrentSeed]
      );
    }

    for (const [currentKey, label, rodType, touches] of [
      ['commercial_outreach_cadence_v1', 'Commercial Outreach Cadence', 'commercial_opportunity_target',
        [
          { touch: 0, name: 'Warm-route check', timing: 'Before cold outreach', purpose: 'Look for a sponsor, portco, former colleague, partner, board, recruiter, event or shared professional route.' },
          { touch: 1, name: 'Trigger-led first contact', timing: 'Day 0', purpose: 'Reference one verified event, frame one testable value question, offer a focused diagnostic conversation.' },
          { touch: 2, name: 'Evidence contribution', timing: 'Day 4-5', purpose: 'Share one concise KPI/evidence-chain insight relevant to the event.' },
          { touch: 3, name: 'Role-specific route', timing: 'Day 10-12', purpose: 'Approach an adjacent accountable function or request a correct referral.' },
          { touch: 4, name: 'New-signal follow-up', timing: 'Day 21-30 or upon catalyst', purpose: 'Only follow up with new information, a changed event or a distinct useful artifact.' },
          { touch: 5, name: 'Nurture', timing: 'Every 30-60 days', purpose: 'Continue only while the target remains qualified; stop on opt-out, irrelevance or repeated non-response.' },
        ]],
      ['career_outreach_cadence_v1', 'Career Outreach Cadence', 'career_opportunity_target',
        [
          { touch: 0, name: 'Application readiness', timing: 'Before contact', purpose: 'Re-open the role, tailor resume proof, identify function and recruiter, log the requisition.' },
          { touch: 1, name: 'Hiring-function contact', timing: 'Day 0-1', purpose: 'Short role-specific note linking 2-3 requirements to credible outcomes and one substantive question.' },
          { touch: 2, name: 'Recruiter/application follow-up', timing: 'Day 4-6', purpose: 'Confirm application and restate differentiated fit in one paragraph.' },
          { touch: 3, name: 'Value contribution', timing: 'Day 10-12', purpose: 'Share a concise perspective relevant to the role mandate.' },
          { touch: 4, name: 'Final active follow-up', timing: 'Day 18-21', purpose: 'Close the loop respectfully; ask about adjacent roles if the role has moved.' },
          { touch: 5, name: 'Nurture', timing: 'On new role or material company event', purpose: 'Reconnect based on a new and relevant reason, not a mechanical cadence.' },
        ]],
    ]) {
      await sql.unsafe(
        `INSERT INTO journey_current_definitions (current_key, org_id, label, rod_type, scope_type, primary_scenario_key, port_stages, entry_criteria, minimum_carry, transition_rules, tributary_trigger_rules, created_at, updated_at)
         VALUES ($1,NULL,$2,$3,'channel_current',NULL,'[]'::jsonb,$4::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,$5,$5)
         ON CONFLICT (current_key) WHERE org_id IS NULL DO NOTHING`,
        [currentKey, label, rodType, { cadenceModel: 'touch_sequence', touches }, nowCurrentSeed]
      );
    }

    // Qualification gate chain Currents (2026-08-09) — a third entryCriteria
    // shape (gateModel) alongside scoringModel/cadenceModel above, same
    // org-overridable seam. Interpreted by readQualificationGates()/
    // applyGateOutcome() in opportunityPipelineRegistry.js. Only career is
    // seeded this pass — commercial's equivalent research/verification agent
    // doesn't exist yet, so a commercial gate chain would have nothing to
    // execute it; add commercial_opportunity_verification_v1 when that agent
    // is built, not before.
    for (const [currentKey, label, rodType, gates] of [
      ['career_opportunity_verification_v1', 'Career Opportunity Verification', 'career_opportunity_target',
        [
          {
            key: 'posting_still_live',
            label: 'Posting still live on company careers site',
            checkType: 'posting_still_live',
            params: {},
            onFail: { action: 'archive', reasonTemplate: 'Posting no longer found on {company}\'s careers site as of {date}.' },
            onPass: { action: 'none' },
          },
        ]],
    ]) {
      await sql.unsafe(
        `INSERT INTO journey_current_definitions (current_key, org_id, label, rod_type, scope_type, primary_scenario_key, port_stages, entry_criteria, minimum_carry, transition_rules, tributary_trigger_rules, created_at, updated_at)
         VALUES ($1,NULL,$2,$3,'channel_current',NULL,'[]'::jsonb,$4::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,$5,$5)
         ON CONFLICT (current_key) WHERE org_id IS NULL DO NOTHING`,
        [currentKey, label, rodType, { gateModel: 'qualification_gate_chain', gates }, nowCurrentSeed]
      );
    }
  } catch (e) {
    console.warn('[db] opportunity scoring/cadence Current seed warning:', e.message);
  }

  // Career scoring dimension Atom definitions (2026-08-06, Phase 2 — Career
  // Placement Agents vertical slice) — a dimension score an agent (or a
  // member, manually) records against a career_opportunity_target rod is
  // real evidence, not an ad-hoc unregistered molecule_key string. Same
  // convention as every other Atom definition in this file (career atoms,
  // Lonetree signal/hypothesis atoms): register in journey_metadata_molecules
  // first. Keys match career_match_scoring_v1's entry_criteria.dimensions[].key
  // 1:1, prefixed career_dim_ to namespace them as Atoms.
  try {
    const nowCareerDimSeed = Date.now();
    for (const [dimKey, label, definition] of [
      ['scope_altitude', 'Role Scope & Altitude Score', 'Rated 0-5: real decision ownership at COO/portfolio-operator/C-suite-partner/director/VP scope, not title alone.'],
      ['strategic_ops_transformation', 'Strategic Operations & Transformation Score', 'Rated 0-5: operating-model, enterprise-transformation, cross-functional-governance, executive-partnership fit.'],
      ['revenue_systems_q2r', 'Revenue Systems / Q2R / Monetization Score', 'Rated 0-5: CPQ, CLM, billing, RevOps, pricing, GTM systems, revenue architecture, monetization fit.'],
      ['ai_validation_data_intel', 'AI Validation & Data Intelligence Score', 'Rated 0-5: AI workflow validation, evidence, data governance, model benefit realization, explainability fit.'],
      ['pe_value_creation_finance', 'PE / Value Creation / Finance Relevance Score', 'Rated 0-5: portfolio operations, office of CFO, underwriting, EBITDA, cash, valuation, diligence, exit-readiness fit.'],
      ['leadership_stakeholder_fit', 'Leadership & Stakeholder Fit Score', 'Rated 0-5: C-suite partnership, team leadership, difficult stakeholders, consulting/operator credibility.'],
      ['transferable_industry_fit', 'Transferable Industry Fit Score', 'Rated 0-5: enterprise software, SaaS, healthcare technology, PE, manufacturing, education, or adjacent-sector fit.'],
      ['practical_fit', 'Practical Fit Score', 'Rated 0-5: location/remote, disclosed compensation, travel, employment type, seniority, application feasibility.'],
    ]) {
      await sql.unsafe(
        `INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,canonical_definition,value_domain,mutability_class,created_at,updated_at)
         VALUES ($1,$2,'decimal','[]'::jsonb,'{}'::jsonb,false,true,$3,'0-5','revisable',$4,$4) ON CONFLICT (molecule_key) DO NOTHING`,
        [`career_dim_${dimKey}`, label, definition, nowCareerDimSeed]
      );
    }
  } catch (e) {
    console.warn('[db] career scoring dimension Atom seed warning:', e.message);
  }

  // Commercial scoring dimension Atom definitions (2026-08-06, Phase 3 —
  // Commercial Opportunity Pipeline vertical slice), same convention and
  // reasoning as the career_dim_* seed above. Keys match
  // commercial_opportunity_scoring_v1's entry_criteria.dimensions[].key 1:1,
  // prefixed commercial_dim_. Deferred from Phase 1 since nothing consumed
  // them yet; needed now that a real UI records real scores.
  try {
    const nowCommercialDimSeed = Date.now();
    for (const [dimKey, label, definition] of [
      ['trigger_strength', 'Trigger Strength Score', 'Rated 0-5: 0 rumor/weak lead, 1 indirect, 3 credible event, 5 consequential primary-sourced event.'],
      ['solution_fit', 'Salt Basin Problem/Solution Fit Score', 'Rated 0-5: fit to evidence chain, revenue lifecycle, journey rods, Data Basin, value-creation registry, AI validation, diligence, financing, or exit readiness.'],
      ['economic_materiality', 'Economic Materiality Score', 'Rated 0-5: potential relevance to revenue, EBITDA, cash, risk, or transaction value — never counted as fact.'],
      ['timing_urgency', 'Timing & Urgency Score', 'Rated 0-5: event recency, deadline, financing/exit window, integration milestone, announced launch, or hiring need.'],
      ['evidence_gap_plausibility', 'Evidence Gap Plausibility Score', 'Rated 0-5: how strongly the event implies a need to reconcile claims to source events, stated as a testable hypothesis.'],
      ['access_relationship_path', 'Access & Relationship Path Score', 'Rated 0-5: named function, warm route, sponsor/portfolio link, public contact channel, or partner path.'],
      ['serviceability', 'Serviceability Score', 'Rated 0-5: can Salt Basin credibly deliver a diagnostic, operating design, value registry, AI validation, or Q2R intervention.'],
    ]) {
      await sql.unsafe(
        `INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,canonical_definition,value_domain,mutability_class,created_at,updated_at)
         VALUES ($1,$2,'decimal','[]'::jsonb,'{}'::jsonb,false,true,$3,'0-5','revisable',$4,$4) ON CONFLICT (molecule_key) DO NOTHING`,
        [`commercial_dim_${dimKey}`, label, definition, nowCommercialDimSeed]
      );
    }
  } catch (e) {
    console.warn('[db] commercial scoring dimension Atom seed warning:', e.message);
  }

  // Agent worlds: shared definitions, world scope, LLM budgets, scheduled
  // run history, findings, and cross-feature notifications.
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS agent_hub_definitions (
      id BIGSERIAL PRIMARY KEY, key TEXT NOT NULL UNIQUE, public_key TEXT UNIQUE,
      label TEXT NOT NULL, description TEXT, kind TEXT NOT NULL DEFAULT 'code_review',
      execution_mode TEXT NOT NULL DEFAULT 'scheduled', scope_type TEXT NOT NULL DEFAULT 'platform', scope_id BIGINT,
      schedule_cron TEXT, enabled BOOLEAN NOT NULL DEFAULT FALSE, auto_branch BOOLEAN NOT NULL DEFAULT FALSE,
      config JSONB NOT NULL DEFAULT '{}', created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL
    );
    -- Production had an earlier agent_hub_definitions table. CREATE TABLE IF
    -- NOT EXISTS does not reconcile that legacy shape, so upgrade every field
    -- used by the scoped Agent Hub before creating indexes or seeding rows.
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS public_key TEXT;
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT 'Agent';
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'code_review';
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'scheduled';
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'platform';
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS scope_id BIGINT;
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS schedule_cron TEXT;
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS auto_branch BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint;
    ALTER TABLE agent_hub_definitions ADD COLUMN IF NOT EXISTS updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_hub_public_key ON agent_hub_definitions(public_key) WHERE public_key IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_agent_hub_scope ON agent_hub_definitions(scope_type, scope_id);
    ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS agent_definition_id BIGINT REFERENCES agent_hub_definitions(id) ON DELETE SET NULL;
    ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organization_profiles(id) ON DELETE SET NULL;
    ALTER TABLE portfolio_requests ADD COLUMN IF NOT EXISTS member_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_definition_id BIGINT REFERENCES agent_hub_definitions(id) ON DELETE SET NULL;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organization_profiles(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS agent_llm_usage (
      id BIGSERIAL PRIMARY KEY, definition_id BIGINT NOT NULL REFERENCES agent_hub_definitions(id) ON DELETE CASCADE,
      provider TEXT NOT NULL, model TEXT NOT NULL, period_key TEXT NOT NULL,
      input_tokens BIGINT NOT NULL DEFAULT 0, output_tokens BIGINT NOT NULL DEFAULT 0,
      request_count BIGINT NOT NULL DEFAULT 0, updated_at BIGINT NOT NULL,
      UNIQUE(definition_id, provider, model, period_key)
    );
    CREATE TABLE IF NOT EXISTS agent_hub_runs (
      id BIGSERIAL PRIMARY KEY, definition_id BIGINT NOT NULL REFERENCES agent_hub_definitions(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'queued', trigger TEXT NOT NULL DEFAULT 'schedule', started_at BIGINT, finished_at BIGINT,
      summary TEXT, stats JSONB NOT NULL DEFAULT '{}', branch_name TEXT, pr_url TEXT, report_path TEXT,
      codebase_fingerprint TEXT, error TEXT, created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE TABLE IF NOT EXISTS agent_hub_run_findings (
      id BIGSERIAL PRIMARY KEY, run_id BIGINT NOT NULL REFERENCES agent_hub_runs(id) ON DELETE CASCADE,
      category TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'medium', file_path TEXT, line INTEGER,
      title TEXT NOT NULL, detail TEXT, status TEXT NOT NULL DEFAULT 'open',
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL, source_id BIGINT, title TEXT NOT NULL, body TEXT,
      severity TEXT NOT NULL DEFAULT 'info', action_url TEXT, read_at BIGINT,
      created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE TABLE IF NOT EXISTS user_tasks (
      id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL, source_id BIGINT, title TEXT NOT NULL, detail TEXT,
      status TEXT NOT NULL DEFAULT 'open', due_at BIGINT, created_at BIGINT NOT NULL, completed_at BIGINT
    );

    INSERT INTO agent_hub_definitions (key,public_key,label,description,kind,execution_mode,scope_type,enabled,config,created_at,updated_at) VALUES
      ('bestystaff-salt-basin','bestystaff','BestyStaff · Salt Basin','Deterministic-first Salt Basin lead intake.','lead_intake','interactive','platform',TRUE,
       '{"identity":{"name":"BestyStaff","organizationName":"Salt Basin Net Works","ownerName":"Betsy Salter"},"deployment":{"saltBasinSite":true,"memberSubpage":false,"externalEmbed":false},"conversation":{"deferredResponseMs":650,"loopBack":{"enabled":true,"afterTurns":6,"prompt":"Before we wrap up, did you get all of your questions answered?"},"memory":{"enabled":true,"maxHistoryTurns":24,"capture":["businessNeed","desiredOutcome","contact","consent","openQuestions"]}},"llm":{"mode":"conditional","required":false,"provider":"anthropic","model":"claude-opus-4-8","purpose":"Optional fallback for uncovered open-ended reasoning; deterministic journeys and lead actions do not require an LLM.","maxOutputTokensPerResponse":4096,"tokenCap":500000,"capPeriod":"month","maxToolIterations":5},"emailPolicy":{"requirePersonalEmail":false,"allowedDomains":[],"blockedDomains":[],"notifyScopeUsers":true},"actions":{"createLead":true,"createRequest":true,"sendNotifications":true},"journey":{"introQuestions":[],"inferredPaths":[],"alternativeQuestions":[]}}'::jsonb,
       (EXTRACT(EPOCH FROM NOW())*1000)::bigint,(EXTRACT(EPOCH FROM NOW())*1000)::bigint),
      ('code-review-agent',NULL,'Code Review Agent','Static-first audit with conditional LLM escalation.','code_review','scheduled','platform',FALSE,
       '{"runtimeBinding":"server/lib/agents/codeReviewAgent.js","aiEnabled":true,"llm":{"mode":"conditional","required":false,"provider":"anthropic","model":"claude-sonnet-5","purpose":"Classify candidates found by static heuristics.","maxOutputTokensPerResponse":8192,"tokenCap":1000000,"capPeriod":"month","maxToolIterations":1}}'::jsonb,
       (EXTRACT(EPOCH FROM NOW())*1000)::bigint,(EXTRACT(EPOCH FROM NOW())*1000)::bigint),
      ('content-research-connection-audit',NULL,'Content Research Connection Audit','Deterministic data-port readiness audit.','content_research','scheduled','platform',FALSE,
       '{"runtimeBinding":"server/lib/agents/contentResearchAgent.js","llm":{"mode":"none","required":false,"provider":null,"model":null,"purpose":"Database and connection checks only.","maxOutputTokensPerResponse":0,"tokenCap":0,"capPeriod":"month","maxToolIterations":0}}'::jsonb,
       (EXTRACT(EPOCH FROM NOW())*1000)::bigint,(EXTRACT(EPOCH FROM NOW())*1000)::bigint),
      ('member-personal-brand-staff',NULL,'Personal Brand Staff','Member agent template.','internal_chat','internal_chat','platform',TRUE,
       '{"templateDefinition":true,"runtimeBinding":"server/routes/memberAgent.js#personal_brand","llm":{"mode":"required","required":true,"provider":"anthropic","model":"claude-sonnet-4-5","purpose":"Interpret member requests and choose bounded draft-site tools.","maxOutputTokensPerResponse":4096,"tokenCap":500000,"capPeriod":"month","maxToolIterations":8}}'::jsonb,
       (EXTRACT(EPOCH FROM NOW())*1000)::bigint,(EXTRACT(EPOCH FROM NOW())*1000)::bigint),
      ('member-profile-builder-staff',NULL,'Profile Builder Staff','Member profile-builder template.','internal_chat','internal_chat','platform',TRUE,
       '{"templateDefinition":true,"runtimeBinding":"server/routes/memberAgent.js#profile_builder","llm":{"mode":"required","required":true,"provider":"anthropic","model":"claude-sonnet-4-5","purpose":"Interpret member requests and select bounded profile tools.","maxOutputTokensPerResponse":4096,"tokenCap":500000,"capPeriod":"month","maxToolIterations":8}}'::jsonb,
       (EXTRACT(EPOCH FROM NOW())*1000)::bigint,(EXTRACT(EPOCH FROM NOW())*1000)::bigint),
      ('career-world-bestystaff',NULL,'Career World BestyStaff','Deterministic career mutation template.','internal_chat','internal_chat','platform',TRUE,
       '{"templateDefinition":true,"runtimeBinding":"server/routes/careerMaster.js","llm":{"mode":"none","required":false,"provider":null,"model":null,"purpose":"Schema-bounded deterministic patches.","maxOutputTokensPerResponse":0,"tokenCap":0,"capPeriod":"month","maxToolIterations":0}}'::jsonb,
       (EXTRACT(EPOCH FROM NOW())*1000)::bigint,(EXTRACT(EPOCH FROM NOW())*1000)::bigint),
      ('scrum-agent',NULL,'Scrum Agent','Internal backlog planning chat.','internal_chat','internal_chat','platform',TRUE,
       '{"runtimeBinding":"server/routes/agent.js","llm":{"mode":"required","required":true,"provider":"anthropic","model":"claude-sonnet-4-5","purpose":"Backlog reasoning and requirements drafting.","maxOutputTokensPerResponse":2048,"tokenCap":300000,"capPeriod":"month","maxToolIterations":1}}'::jsonb,
       (EXTRACT(EPOCH FROM NOW())*1000)::bigint,(EXTRACT(EPOCH FROM NOW())*1000)::bigint)
    ON CONFLICT (key) DO NOTHING;
  `);

  try {
    const navRow = await db.prepare(`SELECT data FROM config_state WHERE id='admin_nav'`).get();
    const nav = navRow?.data ? JSON.parse(navRow.data) : { views: [] };
    if (!nav.views.some((view) => view.id === 'agent-hub')) {
      nav.views.push({ id: 'agent-hub', label: 'Agent Orbit', sortOrder: 4.7, tabs: [
        { id: 'agent-hub-config', label: 'Agent Worlds', componentId: 'agentHubConfig', sortOrder: 0 },
        { id: 'agent-hub-outputs', label: 'Outputs', componentId: 'agentHubOutputs', sortOrder: 1 },
      ] });
      await db.prepare(`UPDATE config_state SET data=$1, updated_at=$2 WHERE id='admin_nav'`).run(JSON.stringify(nav), Date.now());
    }
  } catch (error) {
    console.warn('[db] Agent Orbit navigation seed warning:', error.message);
  }
}

// Awaited at module import time so routes can use db without worrying about
// initialization races.
await bootstrap();

// ── JSON state helpers used by site/config routes ──
export async function getJSON(table, id) {
  const row = await db.prepare(`SELECT data FROM ${table} WHERE id = $1`).get(id);
  return row ? JSON.parse(row.data) : null;
}

export async function setJSON(table, id, value) {
  const json = JSON.stringify(value);
  const now = Date.now();
  await db.prepare(
    `INSERT INTO ${table} (id, data, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(id, json, now);
}
