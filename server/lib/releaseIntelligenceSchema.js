import { db } from '../db.js';

let ready;

// Additive tables for release reconciliation + contribution trends, created
// lazily on first use (same pattern as backlogIntelligenceSchema.js). None of
// them touches member rows; all are platform-internal build records.
//
// Reuse audit (see docs/changes/release-intelligence.md): no existing table
// holds a release, its features, validation rounds, failed runs or per-agent
// telemetry. `build_progress_snapshots` is a point-in-time backlog stat and
// `raw_events`/`contribution_events` are per-session human-vs-AI evidence, not
// release-loop agent runs, so none could carry these without bending them.
//
// Rows derived from an imported document or snapshot carry `source_path` +
// `source_key`; re-importing the same source replaces its own rows (keeping
// any reviewer decision, which lives in release_reconciliation_events and is
// re-applied by key) so the importer is idempotent.
export function ensureReleaseIntelligenceSchema() {
  if (ready) return ready;
  ready = db.exec(`
    CREATE TABLE IF NOT EXISTS release_records (
      id              BIGSERIAL PRIMARY KEY,
      release_key     TEXT NOT NULL UNIQUE,
      name            TEXT,
      release_date    TEXT NOT NULL,
      release_date_ms BIGINT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'open',
      approved_by     BIGINT,
      approved_at     BIGINT,
      approval_note   TEXT,
      source          TEXT NOT NULL DEFAULT 'imported',
      created_at      BIGINT NOT NULL,
      updated_at      BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS release_features (
      id                          BIGSERIAL PRIMARY KEY,
      release_id                  BIGINT NOT NULL REFERENCES release_records(id) ON DELETE CASCADE,
      feature_key                 TEXT NOT NULL,
      name                        TEXT,
      final_status                TEXT,
      declared_rounds             INTEGER,
      declared_change_spec_version   TEXT,
      declared_training_spec_version TEXT,
      tracker_status              TEXT,
      tracker_open_bugs           INTEGER,
      log_path                    TEXT,
      updated_at                  BIGINT NOT NULL,
      UNIQUE (release_id, feature_key)
    );

    CREATE TABLE IF NOT EXISTS release_rounds (
      id             BIGSERIAL PRIMARY KEY,
      release_id     BIGINT REFERENCES release_records(id) ON DELETE CASCADE,
      feature_key    TEXT NOT NULL,
      round_no       INTEGER NOT NULL,
      commit_sha     TEXT,
      tested_on      TEXT,
      passed         BOOLEAN,
      steps_passed   INTEGER,
      steps_total    INTEGER,
      console_errors INTEGER,
      failed_requests INTEGER,
      report_path    TEXT,
      source_path    TEXT NOT NULL,
      source_key     TEXT NOT NULL,
      UNIQUE (source_path, source_key)
    );
    CREATE INDEX IF NOT EXISTS idx_rr_release ON release_rounds (release_id, feature_key, round_no);

    CREATE TABLE IF NOT EXISTS release_fixes (
      id          BIGSERIAL PRIMARY KEY,
      release_id  BIGINT REFERENCES release_records(id) ON DELETE CASCADE,
      feature_key TEXT,
      round_no    INTEGER,
      bug_id      TEXT,
      summary     TEXT,
      files       JSONB NOT NULL DEFAULT '[]',
      source_path TEXT NOT NULL,
      source_key  TEXT NOT NULL,
      UNIQUE (source_path, source_key)
    );

    CREATE TABLE IF NOT EXISTS release_failed_runs (
      id           BIGSERIAL PRIMARY KEY,
      release_id   BIGINT REFERENCES release_records(id) ON DELETE CASCADE,
      feature_key  TEXT,
      run_kind     TEXT NOT NULL,
      role         TEXT,
      label        TEXT,
      state        TEXT NOT NULL,
      failure_class TEXT NOT NULL DEFAULT 'unclassified',
      description  TEXT NOT NULL,
      state_left   TEXT,
      round_no     INTEGER,
      disposition  TEXT NOT NULL DEFAULT 'open',
      disposition_note TEXT,
      disposition_by   TEXT,
      disposition_at   BIGINT,
      source_path  TEXT NOT NULL,
      source_key   TEXT NOT NULL,
      created_at   BIGINT NOT NULL,
      UNIQUE (source_path, source_key)
    );
    CREATE INDEX IF NOT EXISTS idx_rfr_release ON release_failed_runs (release_id, disposition);

    CREATE TABLE IF NOT EXISTS release_metrics (
      id               BIGSERIAL PRIMARY KEY,
      release_id       BIGINT REFERENCES release_records(id) ON DELETE CASCADE,
      feature_key      TEXT,
      role             TEXT,
      round_no         INTEGER,
      agent_label      TEXT NOT NULL,
      status           TEXT,
      tokens_input       BIGINT,
      tokens_cache_write BIGINT,
      tokens_cache_read  BIGINT,
      tokens_output      BIGINT,
      elapsed_minutes    NUMERIC,
      started_at       BIGINT,
      ended_at         BIGINT,
      source_path      TEXT NOT NULL,
      source_key       TEXT NOT NULL,
      UNIQUE (source_path, source_key)
    );
    CREATE INDEX IF NOT EXISTS idx_rm_release ON release_metrics (release_id, feature_key, role);

    CREATE TABLE IF NOT EXISTS release_outputs (
      id           BIGSERIAL PRIMARY KEY,
      path         TEXT NOT NULL UNIQUE,
      output_kind  TEXT NOT NULL,
      feature_key  TEXT,
      release_id   BIGINT REFERENCES release_records(id) ON DELETE SET NULL,
      linked_by    TEXT,
      spec_version TEXT,
      doc_date     TEXT,
      title        TEXT,
      traces       JSONB NOT NULL DEFAULT '[]',
      content      TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      imported_at  BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS release_reconciliation_events (
      id           BIGSERIAL PRIMARY KEY,
      subject_kind TEXT NOT NULL,
      subject_ref  TEXT NOT NULL,
      event_type   TEXT NOT NULL,
      release_key  TEXT,
      state        TEXT,
      note         TEXT,
      details      JSONB NOT NULL DEFAULT '{}',
      actor_user_id BIGINT,
      actor_label  TEXT,
      created_at   BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rre_subject ON release_reconciliation_events (subject_kind, subject_ref, id DESC);

    -- Live release tracker (docs/changes/live-release-tracker.md). Append-only:
    -- every ingested snapshot is kept so the time slider can replay any state.
    -- Tokens are stored as SHA-256 hashes only; the plaintext is shown once.
    CREATE TABLE IF NOT EXISTS release_tracker_snapshots (
      id            BIGSERIAL PRIMARY KEY,
      release_key   TEXT NOT NULL,
      source        TEXT NOT NULL,
      source_ref    TEXT,
      content_hash  TEXT NOT NULL,
      snapshot_at   BIGINT NOT NULL,
      received_at   BIGINT NOT NULL,
      snapshot      JSONB NOT NULL,
      extras        JSONB NOT NULL DEFAULT '{}',
      reconcile_note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_rts_release ON release_tracker_snapshots (release_key, id DESC);

    CREATE TABLE IF NOT EXISTS release_tracker_tokens (
      id           BIGSERIAL PRIMARY KEY,
      kind         TEXT NOT NULL,
      release_key  TEXT,
      label        TEXT,
      token_hash   TEXT NOT NULL UNIQUE,
      token_hint   TEXT,
      created_by   BIGINT,
      created_at   BIGINT NOT NULL,
      revoked_at   BIGINT,
      revoked_by   BIGINT,
      last_used_at BIGINT
    );

    CREATE TABLE IF NOT EXISTS release_tracker_ingest_log (
      id          BIGSERIAL PRIMARY KEY,
      at          BIGINT NOT NULL,
      source      TEXT NOT NULL,
      outcome     TEXT NOT NULL,
      detail      TEXT,
      snapshot_id BIGINT
    );
    CREATE INDEX IF NOT EXISTS idx_rtil_at ON release_tracker_ingest_log (id DESC);
  `).catch((error) => {
    ready = null; // allow a retry on the next request instead of caching a failure
    throw error;
  });
  return ready;
}
