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
