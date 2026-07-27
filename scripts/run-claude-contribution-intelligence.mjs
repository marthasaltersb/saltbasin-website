// Claude-side raw event adapter for Contribution Intelligence — the
// counterpart to scripts/run-codex-contribution-intelligence.mjs, which
// already ships a working Codex adapter. Reads real Claude Code session
// JSONL transcripts and writes immutable raw_events rows to Postgres
// (server/db.js — see the "Contribution Intelligence v2" schema block).
//
// Per the governing spec's Phase 1 reconciliation decision (Betsy, 2026-07-13,
// docs/salt-basin-contribution-intelligence-progress.md): the new raw event
// store is Postgres, not flat JSON files — unlike the Codex adapter, which
// keeps writing its own JSON checkpoint unchanged for now. This script is a
// separate, additive ingestion path; it does not modify the Codex adapter.
//
// Idempotent: each row's id is sha256(file:line:content), the same dedup
// pattern the Codex adapter uses, inserted with ON CONFLICT (id) DO NOTHING.
// Re-running this script (e.g. after a session accumulates new lines) only
// inserts genuinely new rows.
//
// Usage: node scripts/run-claude-contribution-intelligence.mjs
//   [--projects-dir <path>]  defaults to this project's Claude projects dir
import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { db } from '../server/db.js';

const args = process.argv.slice(2);
function argVal(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
}

const DIR = argVal(
  '--projects-dir',
  path.join(os.homedir(), '.claude', 'projects', 'C--Users-mbets-saltbasin-website')
);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Mirrors analyze-contribution-sessions.mjs's synthetic-message filter, kept
// in sync manually since that script computes aggregates and this one emits
// raw events — both need the same "what counts as a real human message"
// definition, but merging them is out of scope for this pass.
function isRealHumanMessage(o) {
  const content = o.message?.content;
  let text = null;
  if (typeof content === 'string') text = content;
  else if (Array.isArray(content)) {
    const hasText = content.some((c) => c.type === 'text' && c.text?.trim().length > 0);
    if (!hasText) return false;
    text = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  }
  if (!text || !text.trim()) return false;
  const isSynthetic = /^This session is being continued from a previous conversation/.test(text.trim())
    || /<task-notification>/.test(text)
    || /<scheduled-task /.test(text);
  return !isSynthetic;
}

function classify(o) {
  if (o.type === 'assistant') return 'ASSISTANT_TURN';
  if (o.type === 'user') return isRealHumanMessage(o) ? 'USER_TURN' : 'TOOL_RESULT_ECHO';
  if (o.type === 'system') return 'SYSTEM_EVENT';
  return 'OTHER';
}

function snippet(o) {
  const content = o.message?.content;
  let text = null;
  if (typeof content === 'string') text = content;
  else if (Array.isArray(content)) {
    const textBlock = content.find((c) => c.type === 'text' && c.text);
    text = textBlock?.text ?? (content[0]?.type ? `[${content[0].type}]` : null);
  }
  if (!text) return null;
  return text.length > 500 ? `${text.slice(0, 500)}…` : text;
}

if (!fs.existsSync(DIR)) {
  console.log(`[contribution:claude] No Claude projects dir at ${DIR}; skipped.`);
  process.exit(0);
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));
if (files.length === 0) {
  console.log(`[contribution:claude] No .jsonl session transcripts found in ${DIR}; skipped.`);
  process.exit(0);
}

const rows = [];
for (const name of files) {
  const fullPath = path.join(DIR, name);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').filter(Boolean);
  const sourceSessionId = path.basename(name, '.jsonl');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const id = sha256(`${name}:${i + 1}:${line}`);
    const sourceTimestamp = o.timestamp ? new Date(o.timestamp).getTime() : null;
    rows.push({
      id,
      source_platform: 'CLAUDE',
      source_session_id: o.sessionId || sourceSessionId,
      source_message_id: o.uuid || null,
      source_event_id: null,
      source_file: name,
      source_line: i + 1,
      source_timestamp: Number.isFinite(sourceTimestamp) ? sourceTimestamp : null,
      event_type: classify(o),
      payload_hash: sha256(line),
      observable_evidence: snippet(o),
      evidence_type: 'SESSION_TRANSCRIPT',
      raw_payload: JSON.stringify(o),
    });
  }
}

console.log(`[contribution:claude] Parsed ${rows.length} raw event candidate(s) from ${files.length} session file(s) in ${DIR}.`);

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

console.log(`[contribution:claude] Inserted ${inserted} new raw_events row(s) (${rows.length - inserted} already present).`);
process.exit(0);
