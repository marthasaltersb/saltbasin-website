// After-session mapping + token / spend / time trends (2026-10-09).
//
// One service module behind the API routes, the CLI script
// (scripts/analyze-session.mjs), the in-app agent completion path and (when it
// exists) the platform MCP server: every interface calls these same functions,
// so permissions are decided once, by the caller's requireAdmin.
//
// Metrics only. Records hold counts, model ids, tool/skill names, agent labels
// and timestamps; never transcript text (see sessionAnalysis.js).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { db } from '../db.js';
import { ensureSessionMappingSchema } from './sessionMappingSchema.js';
import { loadRules, priceSession, MAPPING_AREAS } from './sessionMappingConfig.js';
import { proposeMappings } from './sessionMappingRules.js';
import {
  analyzeLines, combineAgents, analyzeSessionFile, listSessionFiles, projectFolderFor, cacheHitRatio, TOKEN_TYPES,
} from './sessionAnalysis.js';
import { jsonProblemMessage } from './friendlyErrors.js';

const n = (v) => (v == null ? null : Number(v));
const bad = (message, status = 400) => { const e = new Error(message); e.status = status; return e; };

// ── Row mapping ─────────────────────────────────────────────────────────────

function mapSession(r, rules) {
  const tokens = r.tokens_input == null && r.tokens_output == null && r.tokens_cache_read == null && r.tokens_cache_write == null
    ? null
    : { input: n(r.tokens_input), cacheWrite: n(r.tokens_cache_write), cacheRead: n(r.tokens_cache_read), output: n(r.tokens_output) };
  const spend = rules ? priceSession(rules, r.by_model) : null;
  return {
    id: Number(r.id), sessionKey: r.session_key, source: r.source, label: r.label, gitBranch: r.git_branch,
    startedAt: n(r.started_at), endedAt: n(r.ended_at), elapsedMinutes: n(r.elapsed_minutes), activeMinutes: n(r.active_minutes),
    messages: Number(r.messages), tokens,
    cacheHitRatio: tokens && tokens.cacheRead != null ? cacheHitRatio(tokens) : null,
    peakContext: n(r.peak_context), byModel: r.by_model || {}, agents: r.agents || [], limitEvents: r.limit_events || [],
    toolCounts: r.tool_counts || {}, skillCounts: r.skill_counts || {}, prefix: r.prefix || null,
    compactionCount: Number(r.compaction_count), limitCount: Number(r.limit_count), apiErrors: Number(r.api_errors), badLines: Number(r.bad_lines),
    spend, importedBy: r.imported_by, importedAt: n(r.imported_at), updatedAt: n(r.updated_at),
  };
}

function mapProposal(p) {
  return {
    id: Number(p.id), analysisId: Number(p.analysis_id), area: p.area, ruleKey: p.rule_key, targetPath: p.target_path, title: p.title,
    evidence: p.evidence || [], suggestedEdit: p.suggested_edit, status: p.status, decidedBy: p.decided_by, decidedAt: n(p.decided_at),
    decisionNote: p.decision_note, appliedOn: p.applied_on, appliedAt: n(p.applied_at), appliedRef: p.applied_ref,
    sessionLabel: p.session_label, createdAt: n(p.created_at),
  };
}

// ── Persist ─────────────────────────────────────────────────────────────────

function validateRecord(rec) {
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) throw bad('The analysis must be a JSON object');
  if (typeof rec.sourceKey !== 'string' || !rec.sourceKey.trim()) throw bad('The analysis needs a "sourceKey" (for example "claude_code:<session id>")');
  if (!rec.tokens || typeof rec.tokens !== 'object') throw bad('The analysis needs a "tokens" object with input, cacheWrite, cacheRead and output');
  for (const k of TOKEN_TYPES) {
    const v = rec.tokens[k];
    if (v != null && (!Number.isFinite(Number(v)) || Number(v) < 0)) throw bad(`tokens.${k} must be a number of zero or more`);
  }
  for (const k of ['startedAt', 'endedAt']) {
    if (rec[k] != null && !Number.isFinite(Number(rec[k]))) throw bad(`${k} must be a millisecond timestamp`);
  }
  return true;
}

/** Insert or replace one session record by sourceKey, then (re)propose mappings. */
export async function saveAnalysis(rec, { actor = 'system' } = {}) {
  await ensureSessionMappingSchema();
  validateRecord(rec);
  const { rules } = await loadRules();
  const tk = rec.tokens;
  const limitEvents = Array.isArray(rec.limitEvents) ? rec.limitEvents : [];
  const compactionCount = limitEvents.filter((e) => e.kind === 'compaction').length;
  const limitCount = limitEvents.length - compactionCount;
  const now = Date.now();
  const numOrNull = (v) => (v == null || v === '' ? null : Number(v));
  const key = String(rec.sourceKey).trim().slice(0, 200);
  const existing = await db.prepare(`SELECT id FROM session_analyses WHERE session_key=$1`).get(key);
  const common = [
    rec.source === 'in_app_agent' ? 'in_app_agent' : 'claude_code', String(rec.label || key).slice(0, 120), rec.gitBranch ? String(rec.gitBranch).slice(0, 120) : null,
    numOrNull(rec.startedAt), numOrNull(rec.endedAt), numOrNull(rec.elapsedMinutes), numOrNull(rec.activeMinutes), Number(rec.messages || 0),
    numOrNull(tk.input), numOrNull(tk.cacheWrite), numOrNull(tk.cacheRead), numOrNull(tk.output), numOrNull(rec.peakContext),
    rec.byModel && typeof rec.byModel === 'object' ? rec.byModel : {}, Array.isArray(rec.agents) ? rec.agents : [], limitEvents,
    rec.toolCounts && typeof rec.toolCounts === 'object' ? rec.toolCounts : {}, rec.skillCounts && typeof rec.skillCounts === 'object' ? rec.skillCounts : {},
    rec.prefix && typeof rec.prefix === 'object' ? rec.prefix : null,
    compactionCount, limitCount, Number(rec.apiErrors || 0), Number(rec.badLines || 0), String(actor).slice(0, 120), now,
  ];
  // UPDATE first, INSERT only when the session is new, so a re-filed session never burns an id.
  if (existing) {
    await db.prepare(`
      UPDATE session_analyses SET source=$2,label=$3,git_branch=$4,started_at=$5,ended_at=$6,elapsed_minutes=$7,active_minutes=$8,messages=$9,
        tokens_input=$10,tokens_cache_write=$11,tokens_cache_read=$12,tokens_output=$13,peak_context=$14,by_model=$15::jsonb,agents=$16::jsonb,
        limit_events=$17::jsonb,tool_counts=$18::jsonb,skill_counts=$19::jsonb,prefix=$20::jsonb,compaction_count=$21,limit_count=$22,api_errors=$23,
        bad_lines=$24,imported_by=$25,updated_at=$26
      WHERE session_key=$1
    `).run(key, ...common);
  } else {
    await db.prepare(`
      INSERT INTO session_analyses (session_key,source,label,git_branch,started_at,ended_at,elapsed_minutes,active_minutes,messages,
        tokens_input,tokens_cache_write,tokens_cache_read,tokens_output,peak_context,by_model,agents,limit_events,tool_counts,skill_counts,prefix,
        compaction_count,limit_count,api_errors,bad_lines,imported_by,imported_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17::jsonb,$18::jsonb,$19::jsonb,$20::jsonb,$21,$22,$23,$24,$25,$26,$26)
    `).run(key, ...common);
  }
  const row = await db.prepare(`SELECT * FROM session_analyses WHERE session_key=$1`).get(key);
  const proposals = await remapSession(Number(row.id), { rules });
  return { id: Number(row.id), created: !existing, proposals: proposals.length, open: proposals.filter((x) => x.status === 'proposed').length };
}

/** Re-run the mapping rules for one stored session. Decided proposals keep their decision. */
export async function remapSession(id, { rules } = {}) {
  await ensureSessionMappingSchema();
  const r = rules || (await loadRules()).rules;
  const row = await db.prepare(`SELECT * FROM session_analyses WHERE id=$1`).get(id);
  if (!row) throw bad('Session not found', 404);
  const rec = mapSession(row, null);
  const proposed = proposeMappings(rec, r);
  const now = Date.now();
  for (const p of proposed) {
    await db.prepare(`
      INSERT INTO session_mapping_proposals (analysis_id,area,rule_key,target_path,title,evidence,suggested_edit,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$8)
      ON CONFLICT (analysis_id,rule_key,target_path) DO UPDATE SET
        title = CASE WHEN session_mapping_proposals.status='proposed' THEN excluded.title ELSE session_mapping_proposals.title END,
        evidence = CASE WHEN session_mapping_proposals.status='proposed' THEN excluded.evidence ELSE session_mapping_proposals.evidence END,
        suggested_edit = CASE WHEN session_mapping_proposals.status='proposed' THEN excluded.suggested_edit ELSE session_mapping_proposals.suggested_edit END,
        updated_at = excluded.updated_at
    `).run(id, p.area, p.ruleKey, p.targetPath, p.title, p.evidence, p.suggestedEdit, now);
  }
  // A proposal no longer produced by the rules (rules or thresholds edited) and never decided is withdrawn.
  const keep = new Set(proposed.map((p) => `${p.ruleKey}|${p.targetPath}`));
  const stored = await db.prepare(`SELECT id,rule_key,target_path,status FROM session_mapping_proposals WHERE analysis_id=$1`).all(id);
  for (const s of stored) {
    if (s.status === 'proposed' && !keep.has(`${s.rule_key}|${s.target_path}`)) {
      await db.prepare(`DELETE FROM session_mapping_proposals WHERE id=$1`).run(Number(s.id));
    }
  }
  return db.prepare(`SELECT * FROM session_mapping_proposals WHERE analysis_id=$1 ORDER BY id`).all(id);
}

export async function remapAll() {
  await ensureSessionMappingSchema();
  const { rules } = await loadRules();
  const ids = await db.prepare(`SELECT id FROM session_analyses ORDER BY id`).all();
  let count = 0;
  for (const { id } of ids) { count += (await remapSession(Number(id), { rules })).length; }
  return { sessions: ids.length, proposals: count };
}

// ── Reads ───────────────────────────────────────────────────────────────────

export async function listSessions() {
  await ensureSessionMappingSchema();
  const { rules } = await loadRules();
  const rows = await db.prepare(`SELECT * FROM session_analyses ORDER BY ended_at DESC NULLS LAST, id DESC`).all();
  const counts = await db.prepare(`SELECT analysis_id, COUNT(*) FILTER (WHERE status='proposed') AS open, COUNT(*) AS total FROM session_mapping_proposals GROUP BY analysis_id`).all();
  const byId = new Map(counts.map((c) => [Number(c.analysis_id), c]));
  return {
    currency: rules.currency,
    sessions: rows.map((r) => ({ ...mapSession(r, rules), openProposals: Number(byId.get(Number(r.id))?.open || 0), proposalCount: Number(byId.get(Number(r.id))?.total || 0) })),
  };
}

export async function getSession(id) {
  await ensureSessionMappingSchema();
  const { rules } = await loadRules();
  const row = await db.prepare(`SELECT * FROM session_analyses WHERE id=$1`).get(id);
  if (!row) return null;
  const proposals = await db.prepare(`SELECT p.*, a.label AS session_label FROM session_mapping_proposals p JOIN session_analyses a ON a.id=p.analysis_id WHERE p.analysis_id=$1 ORDER BY p.id`).all(id);
  return { currency: rules.currency, session: mapSession(row, rules), proposals: proposals.map(mapProposal) };
}

export async function listProposals({ status, area } = {}) {
  await ensureSessionMappingSchema();
  const where = []; const params = [];
  if (status) { params.push(status); where.push(`p.status=$${params.length}`); }
  if (area) { if (!MAPPING_AREAS.includes(area)) throw bad(`area must be one of ${MAPPING_AREAS.join(', ')}`); params.push(area); where.push(`p.area=$${params.length}`); }
  const rows = await db.prepare(`SELECT p.*, a.label AS session_label FROM session_mapping_proposals p JOIN session_analyses a ON a.id=p.analysis_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.id DESC`).all(...params);
  return rows.map(mapProposal);
}

// ── Decisions ───────────────────────────────────────────────────────────────

export async function rejectProposal(id, note, actor) {
  await ensureSessionMappingSchema();
  const text = String(note || '').trim();
  if (!text) throw bad('Say why this mapping is rejected');
  const p = await db.prepare(`SELECT status FROM session_mapping_proposals WHERE id=$1`).get(id);
  if (!p) throw bad('Proposal not found', 404);
  if (p.status !== 'proposed') throw bad(`Only a proposed mapping can be rejected (this one is ${p.status})`, 409);
  await db.prepare(`UPDATE session_mapping_proposals SET status='rejected',decision_note=$2,decided_by=$3,decided_at=$4,updated_at=$4 WHERE id=$1`).run(id, text, String(actor?.label || 'admin'), Date.now());
  return (await listProposals()).find((x) => x.id === id);
}

/**
 * Mark a mapping applied: the reviewer made the suggested edit (or an equivalent
 * one) and records the UTC day it took effect. Before/after trends compare sessions
 * ending before that day with sessions ending on or after it. The caller route runs
 * assertReadyToFinalize first.
 */
export async function applyProposal(id, { appliedOn, note, ref } = {}, actor) {
  await ensureSessionMappingSchema();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(appliedOn || ''))) throw bad('Give the day the edit took effect as YYYY-MM-DD');
  const at = Date.parse(`${appliedOn}T00:00:00Z`);
  if (!Number.isFinite(at)) throw bad('That date is not a real day');
  const p = await db.prepare(`SELECT status FROM session_mapping_proposals WHERE id=$1`).get(id);
  if (!p) throw bad('Proposal not found', 404);
  if (p.status !== 'proposed') throw bad(`Only a proposed mapping can be applied (this one is ${p.status})`, 409);
  await db.prepare(`UPDATE session_mapping_proposals SET status='applied',applied_on=$2,applied_at=$3,applied_ref=$4,decision_note=$5,decided_by=$6,decided_at=$7,updated_at=$7 WHERE id=$1`)
    .run(id, appliedOn, at, ref ? String(ref).slice(0, 200) : null, note ? String(note).trim() : null, String(actor?.label || 'admin'), Date.now());
  return (await listProposals()).find((x) => x.id === id);
}

// ── Trends ──────────────────────────────────────────────────────────────────

const dayOf = (t) => new Date(t).toISOString().slice(0, 10);

function aggregate(sessions, rules) {
  const tokens = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  let spend = 0; let unpricedSessions = 0; let active = 0; let elapsed = 0; let limits = 0; let compactions = 0;
  let cacheCounted = { cacheRead: 0, denom: 0 };
  const unpriced = new Set();
  for (const s of sessions) {
    for (const k of TOKEN_TYPES) tokens[k] += Number(s.tokens?.[k] || 0);
    const p = priceSession(rules, s.byModel);
    spend += p.total; if (p.unpriced.length) { unpricedSessions += 1; p.unpriced.forEach((m) => unpriced.add(m)); }
    active += s.activeMinutes || 0; elapsed += s.elapsedMinutes || 0; limits += s.limitCount; compactions += s.compactionCount;
    if (s.tokens && s.tokens.cacheRead != null) {
      cacheCounted.cacheRead += s.tokens.cacheRead;
      cacheCounted.denom += (s.tokens.input || 0) + (s.tokens.cacheWrite || 0) + s.tokens.cacheRead;
    }
  }
  const count = sessions.length;
  const total = TOKEN_TYPES.reduce((x, k) => x + tokens[k], 0);
  return {
    sessions: count, tokens, totalTokens: total, spend, unpriced: [...unpriced].sort(),
    cacheHitRatio: cacheCounted.denom > 0 ? cacheCounted.cacheRead / cacheCounted.denom : null,
    activeMinutes: Math.round(active * 100) / 100, elapsedMinutes: Math.round(elapsed * 100) / 100,
    limitEvents: limits, compactions,
    perSession: count ? {
      tokens: total / count, spend: spend / count, limitEvents: limits / count, activeMinutes: active / count,
    } : null,
  };
}

export async function getTrends() {
  await ensureSessionMappingSchema();
  const { rules } = await loadRules();
  const rows = await db.prepare(`SELECT * FROM session_analyses ORDER BY ended_at NULLS LAST, id`).all();
  const sessions = rows.map((r) => mapSession(r, null));
  const dated = sessions.filter((s) => s.endedAt != null);
  const byDay = new Map();
  for (const s of dated) { const d = dayOf(s.endedAt); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(s); }
  const days = [...byDay.keys()].sort().map((date) => ({ date, ...aggregate(byDay.get(date), rules) }));
  const applied = await db.prepare(`SELECT p.*, a.label AS session_label FROM session_mapping_proposals p JOIN session_analyses a ON a.id=p.analysis_id WHERE p.status='applied' ORDER BY p.applied_at, p.id`).all();
  const marks = applied.map((raw) => {
    const p = mapProposal(raw);
    const before = aggregate(dated.filter((s) => s.endedAt < p.appliedAt), rules);
    const after = aggregate(dated.filter((s) => s.endedAt >= p.appliedAt), rules);
    return { id: p.id, title: p.title, area: p.area, targetPath: p.targetPath, appliedOn: p.appliedOn, before, after };
  });
  return { currency: rules.currency, days, undated: sessions.length - dated.length, totalSessions: sessions.length, applied: marks, overall: aggregate(dated, rules) };
}

// ── Capture failures ────────────────────────────────────────────────────────

export async function recordCaptureFailure(source, ref, error) {
  try {
    await ensureSessionMappingSchema();
    await db.prepare(`INSERT INTO session_capture_failures (source,ref,error,created_at) VALUES ($1,$2,$3,$4)`)
      .run(String(source).slice(0, 60), ref ? String(ref).slice(0, 200) : null, String(error?.message || error).slice(0, 1000), Date.now());
  } catch (e) {
    // The failure log itself is unreachable: say so loudly, never silently.
    console.error(`[session-mapping] could not record a capture failure (${source}: ${error?.message || error}): ${e.message}`);
  }
}

export async function listCaptureFailures() {
  await ensureSessionMappingSchema();
  const rows = await db.prepare(`SELECT * FROM session_capture_failures ORDER BY id DESC LIMIT 200`).all();
  return rows.map((r) => ({ id: Number(r.id), source: r.source, ref: r.ref, error: r.error, disposition: r.disposition, dispositionNote: r.disposition_note, dispositionBy: r.disposition_by, dispositionAt: n(r.disposition_at), createdAt: n(r.created_at) }));
}

export async function setCaptureFailureDisposition(id, { disposition, note }, actor) {
  await ensureSessionMappingSchema();
  if (!['open', 'reconciled', 'accepted'].includes(disposition)) throw bad('disposition must be open, reconciled or accepted');
  if (disposition !== 'open' && !String(note || '').trim()) throw bad('Closing a capture failure needs a note saying what was done');
  const r = await db.prepare(`UPDATE session_capture_failures SET disposition=$2,disposition_note=$3,disposition_by=$4,disposition_at=$5 WHERE id=$1`)
    .run(id, disposition, note ? String(note).trim() : null, String(actor?.label || 'admin'), Date.now());
  if (!r.changes) throw bad('Capture failure not found', 404);
  return (await listCaptureFailures()).find((f) => f.id === id);
}

// ── Import paths ────────────────────────────────────────────────────────────

/** Pasted transcript lines (main session + optional subagents). Text is parsed in memory and discarded. */
export async function importTranscriptText({ sessionId, main, subagents = [] }, { actor } = {}) {
  const { rules } = await loadRules();
  const id = String(sessionId || '').trim();
  if (!id) throw bad('Give a session id (any short name, for example the transcript file name)');
  if (typeof main !== 'string' || !main.trim()) throw bad('Paste the main session transcript lines');
  const idle = rules.idleCapMinutes;
  const agents = [analyzeLines(main.split('\n'), { label: 'main session', agentId: 'main', idleCapMinutes: idle })];
  subagents.forEach((s, i) => {
    if (typeof s?.text === 'string' && s.text.trim()) agents.push(analyzeLines(s.text.split('\n'), { label: String(s.label || `subagent ${i + 1}`), agentId: `sub${i + 1}`, idleCapMinutes: idle }));
  });
  const bads = agents.reduce((x, a) => x + a.badLines, 0);
  if (agents.every((a) => a.messages === 0)) throw bad(`No assistant messages with token usage were found${bads ? ` (${bads} line${bads === 1 ? '' : 's'} could not be read as JSON)` : ''}`);
  const rec = combineAgents(`claude_code:${id}`, agents, { idleCapMinutes: idle });
  rec.label = `Session ${id.slice(0, 8)}`;
  return saveAnalysis(rec, { actor: actor?.label });
}

export async function importMetricsJson(input, { actor } = {}) {
  let rec = input;
  if (typeof rec === 'string') {
    try { rec = JSON.parse(rec); } catch (e) { throw bad(jsonProblemMessage('analysis', e)); }
  }
  return saveAnalysis(rec, { actor: actor?.label });
}

export function defaultTranscriptsDir(rules) {
  if (rules.transcriptsDir) return rules.transcriptsDir.startsWith('~') ? path.join(os.homedir(), rules.transcriptsDir.slice(1)) : rules.transcriptsDir;
  return path.join(os.homedir(), '.claude', 'projects', projectFolderFor(process.cwd()));
}

export const HOOK_SPOOL_DIR = () => path.join(process.cwd(), 'server', 'data', 'sessionMapping', 'spool');
export const HOOK_FAILURE_LOG = () => path.join(process.cwd(), 'server', 'data', 'sessionMapping', 'hook-failures.jsonl');

/** Scan the server's Claude Code transcripts folder; also files any failures the SessionEnd hook logged while the database was unreachable. */
export async function scanTranscripts({ actor } = {}) {
  await ensureSessionMappingSchema();
  const { rules } = await loadRules();
  const dir = defaultTranscriptsDir(rules);
  // A missing transcripts folder must not stop spooled analyses and hook failures being filed.
  let files = [];
  let dirError = null;
  try { files = listSessionFiles(dir); } catch (e) { dirError = e; }
  const result = { dir, found: files.length, imported: 0, updated: 0, unchanged: 0, failed: [], hookFailuresFiled: 0, spooledFiled: 0 };
  for (const f of files) {
    try {
      const rec = analyzeSessionFile(f, { idleCapMinutes: rules.idleCapMinutes });
      if (rec.messages === 0) { result.unchanged += 1; continue; }
      const before = await db.prepare(`SELECT messages,tokens_output,tokens_input,tokens_cache_read,tokens_cache_write FROM session_analyses WHERE session_key=$1`).get(rec.sourceKey);
      const same = before && Number(before.messages) === rec.messages && Number(before.tokens_output) === rec.tokens.output && Number(before.tokens_input) === rec.tokens.input
        && Number(before.tokens_cache_read) === rec.tokens.cacheRead && Number(before.tokens_cache_write) === rec.tokens.cacheWrite;
      if (same) { result.unchanged += 1; continue; }
      const r = await saveAnalysis(rec, { actor: actor?.label });
      if (r.created) result.imported += 1; else result.updated += 1;
    } catch (e) {
      await recordCaptureFailure('scan', path.basename(f), e);
      result.failed.push({ file: path.basename(f), error: e.message });
    }
  }
  // Analyses the SessionEnd hook spooled because it had no database (metrics only).
  const spool = HOOK_SPOOL_DIR();
  if (fs.existsSync(spool)) {
    for (const name of fs.readdirSync(spool).filter((n) => n.endsWith('.json'))) {
      const full = path.join(spool, name);
      try {
        const r = await importMetricsJson(fs.readFileSync(full, 'utf8'), { actor });
        if (r.created) result.imported += 1; else result.updated += 1;
        result.spooledFiled += 1;
        fs.renameSync(full, `${full}.filed-${Date.now()}`);
      } catch (e) {
        await recordCaptureFailure('session_end_hook', name, e);
        result.failed.push({ file: name, error: e.message });
        fs.renameSync(full, `${full}.failed-${Date.now()}`);
      }
    }
  }
  const logFile = HOOK_FAILURE_LOG();
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      let rec = null; try { rec = JSON.parse(line); } catch { rec = { error: 'unreadable hook failure line', ref: null }; }
      await recordCaptureFailure('session_end_hook', rec.ref, rec.error || 'unknown hook failure');
      result.hookFailuresFiled += 1;
    }
    fs.renameSync(logFile, `${logFile}.filed-${Date.now()}`);
  }
  // The folder problem is still a failure the member must see: surface it (400) after the spooled work was filed.
  if (dirError) {
    const filed = result.spooledFiled + result.hookFailuresFiled;
    dirError.message = `${dirError.message}${filed ? `\nStill filed ${result.spooledFiled} spooled analys${result.spooledFiled === 1 ? 'is' : 'es'} and ${result.hookFailuresFiled} hook failure${result.hookFailuresFiled === 1 ? '' : 's'}.` : ''}`;
    throw dirError;
  }
  return result;
}

// ── In-app agent completion path ────────────────────────────────────────────

/**
 * Called after every in-app LLM completion (agentLlmUsage.recordAgentLlmUsage) and
 * when an in-app agent hits its token cap. Never throws into the caller's request:
 * a failure is written to session_capture_failures (and the console) instead.
 */
export async function recordInAppAgentRun({ definitionId, label, model, usage = {}, startedAt, endedAt, limit = null }) {
  try {
    await ensureSessionMappingSchema();
    const end = Number(endedAt) || Date.now();
    const start = Number(startedAt) || null;
    const u = usage || {};
    const has = (k) => u[k] != null;
    const tokens = {
      input: Number(u.input_tokens || 0),
      cacheWrite: has('cache_creation_input_tokens') ? Number(u.cache_creation_input_tokens) : null,
      cacheRead: has('cache_read_input_tokens') ? Number(u.cache_read_input_tokens) : null,
      output: Number(u.output_tokens || 0),
    };
    const m = model || 'unknown';
    const by = { input: tokens.input, cacheWrite: tokens.cacheWrite || 0, cacheRead: tokens.cacheRead || 0, output: tokens.output, messages: limit ? 0 : 1 };
    const key = `in_app_agent:${definitionId}:${end}:${Math.random().toString(36).slice(2, 8)}`;
    await saveAnalysis({
      sourceKey: key, source: 'in_app_agent', label: String(label || `Agent ${definitionId}`).slice(0, 120),
      startedAt: start, endedAt: end,
      // Elapsed time is only known when the caller measured it; otherwise it stays 'not recorded' (null), never 0.
      elapsedMinutes: start ? Math.round(((end - start) / 60000) * 100) / 100 : null,
      activeMinutes: start ? Math.round(((end - start) / 60000) * 100) / 100 : null,
      messages: limit ? 0 : 1, tokens, byModel: { [m]: by },
      agents: [{ agentId: String(definitionId), label: String(label || `Agent ${definitionId}`).slice(0, 80), messages: limit ? 0 : 1, tokens, byModel: { [m]: by }, limitEvents: limit ? 1 : 0 }],
      limitEvents: limit ? [{ kind: limit, at: end, agentId: String(definitionId) }] : [],
    }, { actor: 'in-app agent' });
  } catch (error) {
    console.error(`[session-mapping] in-app agent run not recorded: ${error.message}`);
    await recordCaptureFailure('in_app_agent', `definition ${definitionId}`, error);
  }
}
