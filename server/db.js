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
import 'dotenv/config';
import postgres from 'postgres';

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
  await sql.unsafe(`
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
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rods_lead_type ON journey_data_rods (lead_id, rod_type) WHERE lead_id IS NOT NULL AND user_id IS NULL AND org_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rods_user_type ON journey_data_rods (user_id, rod_type) WHERE user_id IS NOT NULL AND org_id IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rods_user_org_type ON journey_data_rods (user_id, org_id, rod_type) WHERE user_id IS NOT NULL AND org_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_rods_org ON journey_data_rods (org_id, rod_type);

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
    CREATE INDEX IF NOT EXISTS idx_org_profiles_slug ON organization_profiles (slug);
    CREATE INDEX IF NOT EXISTS idx_org_profiles_originating_lead ON organization_profiles (originating_lead_id);

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
  `);

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
