import { db } from '../db.js';

let ready;

// Additive tables for after-session mapping + token/spend/time trends, created
// lazily on first use (same pattern as releaseIntelligenceSchema.js). None of
// them touches member rows; all are platform-internal build/operations records.
//
// Reuse audit (docs/changes/session-mapping.md): `release_metrics` is per
// release-loop agent and is filled from the release tracker, not from
// transcripts; `agent_llm_usage` is a monthly cap counter with no time series,
// cache split or limit events; `raw_events`/`contribution_events` hold
// human-vs-AI evidence. None can carry a per-session metric row with a mapping
// queue without being bent, so these are new, narrow tables.
//
// Metrics only: no column holds transcript text.
export function ensureSessionMappingSchema() {
  if (ready) return ready;
  ready = db.exec(`
    CREATE TABLE IF NOT EXISTS session_analyses (
      id               BIGSERIAL PRIMARY KEY,
      session_key      TEXT NOT NULL UNIQUE,
      source           TEXT NOT NULL,
      label            TEXT NOT NULL,
      git_branch       TEXT,
      started_at       BIGINT,
      ended_at         BIGINT,
      elapsed_minutes  NUMERIC,
      active_minutes   NUMERIC,
      messages         INTEGER NOT NULL DEFAULT 0,
      tokens_input       BIGINT,
      tokens_cache_write BIGINT,
      tokens_cache_read  BIGINT,
      tokens_output      BIGINT,
      peak_context     BIGINT,
      by_model         JSONB NOT NULL DEFAULT '{}',
      agents           JSONB NOT NULL DEFAULT '[]',
      limit_events     JSONB NOT NULL DEFAULT '[]',
      tool_counts      JSONB NOT NULL DEFAULT '{}',
      skill_counts     JSONB NOT NULL DEFAULT '{}',
      prefix           JSONB,
      compaction_count INTEGER NOT NULL DEFAULT 0,
      limit_count      INTEGER NOT NULL DEFAULT 0,
      api_errors       INTEGER NOT NULL DEFAULT 0,
      bad_lines        INTEGER NOT NULL DEFAULT 0,
      imported_by      TEXT,
      imported_at      BIGINT NOT NULL,
      updated_at       BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sa_ended ON session_analyses (ended_at);

    CREATE TABLE IF NOT EXISTS session_mapping_proposals (
      id            BIGSERIAL PRIMARY KEY,
      analysis_id   BIGINT NOT NULL REFERENCES session_analyses(id) ON DELETE CASCADE,
      area          TEXT NOT NULL,
      rule_key      TEXT NOT NULL,
      target_path   TEXT NOT NULL,
      title         TEXT NOT NULL,
      evidence      JSONB NOT NULL DEFAULT '[]',
      suggested_edit TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'proposed',
      decided_by    TEXT,
      decided_at    BIGINT,
      decision_note TEXT,
      applied_on    TEXT,
      applied_at    BIGINT,
      applied_ref   TEXT,
      created_at    BIGINT NOT NULL,
      updated_at    BIGINT NOT NULL,
      UNIQUE (analysis_id, rule_key, target_path)
    );
    CREATE INDEX IF NOT EXISTS idx_smp_status ON session_mapping_proposals (status, area);

    -- A capture that failed (hook could not reach the database, an unreadable
    -- transcript, an in-app completion that could not be recorded). Only a
    -- reviewer's disposition-with-note closes one; nothing is dropped.
    CREATE TABLE IF NOT EXISTS session_capture_failures (
      id            BIGSERIAL PRIMARY KEY,
      source        TEXT NOT NULL,
      ref           TEXT,
      error         TEXT NOT NULL,
      disposition   TEXT NOT NULL DEFAULT 'open',
      disposition_note TEXT,
      disposition_by   TEXT,
      disposition_at   BIGINT,
      created_at    BIGINT NOT NULL
    );
  `).catch((error) => {
    ready = null; // allow a retry on the next request instead of caching a failure
    throw error;
  });
  return ready;
}
