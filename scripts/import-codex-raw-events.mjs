// One-time / repeatable sync: migrates the Codex adapter's existing JSON
// checkpoint (.codex/contribution-intelligence/codex-observable-events.json,
// written by scripts/run-codex-contribution-intelligence.mjs via npm's
// postbuild hook) into the Postgres raw_events table.
//
// Per Betsy's Phase 1 reconciliation decision (2026-07-13, see
// docs/salt-basin-contribution-intelligence-progress.md): the new
// Contribution Intelligence raw event store is Postgres, not flat JSON
// files. Rather than rewrite the already-working, build-pipeline-wired
// Codex adapter, this script leaves it untouched and syncs its output into
// the shared table instead — run it after `npm run contribution:codex` (or
// after a build) to pick up newly observed Codex events.
//
// Idempotent: reuses the adapter's own deterministic event id, inserted
// with ON CONFLICT (id) DO NOTHING.
//
// Usage: node scripts/import-codex-raw-events.mjs
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../server/db.js';

const projectRoot = path.resolve(process.cwd());
const eventsFile = path.join(projectRoot, '.codex', 'contribution-intelligence', 'codex-observable-events.json');

if (!fs.existsSync(eventsFile)) {
  console.log(`[contribution:import-codex] No Codex event file at ${eventsFile}; skipped.`);
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
const events = data.events || [];

if (events.length === 0) {
  console.log('[contribution:import-codex] Codex event file has no events; nothing to import.');
  process.exit(0);
}

const rows = events.map((e) => ({
  id: e.id,
  source_platform: e.sourcePlatform || 'CODEX',
  source_session_id: null,
  source_message_id: null,
  source_event_id: null,
  source_file: e.sourceFile || null,
  source_line: e.sourceLine ?? null,
  source_timestamp: e.sourceTimestamp ? new Date(e.sourceTimestamp).getTime() : null,
  event_type: e.eventType || null,
  payload_hash: e.payloadHash || null,
  observable_evidence: e.observableEvidence || null,
  evidence_type: e.evidenceType || null,
  raw_payload: JSON.stringify(e),
}));

const sql = db.raw;
const BATCH = 500;
let inserted = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const result = await sql`
    INSERT INTO raw_events ${sql(batch, 'id', 'source_platform', 'source_session_id', 'source_message_id', 'source_event_id', 'source_file', 'source_line', 'source_timestamp', 'event_type', 'payload_hash', 'observable_evidence', 'evidence_type', 'raw_payload')}
    ON CONFLICT (id) DO NOTHING
  `;
  inserted += result.count ?? 0;
}

console.log(`[contribution:import-codex] Read ${events.length} Codex event(s); inserted ${inserted} new raw_events row(s) (${events.length - inserted} already present).`);
process.exit(0);
