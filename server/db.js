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
      id            BIGSERIAL PRIMARY KEY,
      source        TEXT NOT NULL,
      email         TEXT NOT NULL,
      name          TEXT,
      message       TEXT,
      public_id     TEXT UNIQUE,
      access_token  TEXT,
      answers       TEXT,
      converted_user_id BIGINT,
      created_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
      updated_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS lead_messages (
      id          BIGSERIAL PRIMARY KEY,
      lead_id     BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      role        TEXT NOT NULL,
      content     TEXT NOT NULL,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    );

    CREATE TABLE IF NOT EXISTS lead_activity (
      id          BIGSERIAL PRIMARY KEY,
      lead_id     BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      source      TEXT NOT NULL,
      message     TEXT,
      created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
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
  ];
  for (const [table, col, def] of colMigrations) {
    await sql.unsafe(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${def}`).catch((e) => {
      // ADD COLUMN IF NOT EXISTS handles the missing case; only swallow benign
      // "duplicate column" errors that older PG variants might raise.
      if (!/already exists|duplicate column/i.test(e.message)) throw e;
    });
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
