// Uses Node 22+ built-in node:sqlite (no native compile step).
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'salt-basin.db');
export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS site_state (
  id TEXT PRIMARY KEY,            -- 'draft' or 'published'
  data TEXT NOT NULL,             -- JSON: { pages, version }
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS config_state (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS detail_pages (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS landing_sessions (
  token TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,           -- arbitrary string: 'joinNetwork', 'forCompanies', or any future form key
  email TEXT NOT NULL,
  name TEXT,
  message TEXT,
  public_id TEXT UNIQUE,          -- short URL-safe identifier shown to the lead
  access_token TEXT,              -- proof of ownership for the lead-facing URL
  answers TEXT,                   -- JSON: { role, company, timeline, notes, ...future fields }
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS lead_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,             -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE TABLE IF NOT EXISTS lead_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  source TEXT NOT NULL,           -- which form/CTA fired
  message TEXT,                   -- optional message at time of submission
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_lead_activity_lead ON lead_activity(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

CREATE TABLE IF NOT EXISTS member_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  draft TEXT NOT NULL,            -- JSON profile
  published TEXT,                 -- JSON; null until first publish
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
`);

// Idempotent migrations for older databases that may have shipped earlier
// versions of the leads table. CREATE TABLE IF NOT EXISTS won't add new
// columns to an existing table, so we add missing ones explicitly.
function addColumnIfMissing(table, name, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}
addColumnIfMissing('leads', 'public_id', 'TEXT');
addColumnIfMissing('leads', 'access_token', 'TEXT');
addColumnIfMissing('leads', 'answers', 'TEXT');
addColumnIfMissing('leads', 'updated_at', "INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)");
addColumnIfMissing('leads', 'converted_user_id', 'INTEGER');  // set when lead → member

export function getJSON(table, id) {
  const row = db.prepare(`SELECT data FROM ${table} WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

export function setJSON(table, id, value) {
  const json = JSON.stringify(value);
  const now = Date.now();
  db.prepare(
    `INSERT INTO ${table} (id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(id, json, now);
}
