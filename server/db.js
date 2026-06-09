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
    ['lead_activity', 'cta_location', 'TEXT'],
    ['users', 'display_name', 'TEXT'],
  ];
  for (const [table, col, def] of colMigrations) {
    await sql.unsafe(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${def}`).catch((e) => {
      if (!/already exists|duplicate column/i.test(e.message)) throw e;
    });
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
  `);

  // Multi-tenant CMS: each member gets their own draft + published site, plus
  // their own config (brand colors, opt-in flags, BYO Claude key). Same JSON
  // shape as the platform-level site_state / config_state.
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

    -- Pre-AI cost: total hours × 2.5x effort multiplier × $150 blended rate.
    -- Both Betsy hours and Claude hours represented the build's total work,
    -- so the comparison treats the whole as one project that would need a
    -- traditional dev team.
    UPDATE backlog_items
       SET traditional_cost_usd = ROUND(((COALESCE(hours_claude, 0) + COALESCE(hours_betsy, 0)) * 2.5 * 150)::numeric, 2)
     WHERE traditional_cost_usd IS NULL;
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
      created_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );
    CREATE INDEX IF NOT EXISTS idx_org_profiles_slug ON organization_profiles (slug);

    -- ── Org memberships (user ↔ org, with role) ──────────────────────────────
    CREATE TABLE IF NOT EXISTS org_memberships (
      id         BIGSERIAL PRIMARY KEY,
      user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      org_id     BIGINT NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
      role       TEXT NOT NULL DEFAULT 'member',
        -- owner | admin | member | viewer
      invited_by BIGINT REFERENCES users(id),
      joined_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      UNIQUE (user_id, org_id)
    );
    CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON org_memberships (user_id);
    CREATE INDEX IF NOT EXISTS idx_org_memberships_org  ON org_memberships (org_id);

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
        { id: 'backlog', label: 'Backlog', componentId: 'backlog', sortOrder: 0 },
        { id: 'qa',      label: 'QA',      componentId: 'qa',      sortOrder: 1 },
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
