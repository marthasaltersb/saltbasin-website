// Session analysis (2026-10-09): turns Claude Code transcripts into METRICS ONLY.
//
// Privacy rule (docs/changes/session-mapping.md): this module reads transcript
// lines to count tokens, messages, tool names, timestamps and error statuses.
// It never returns, stores or logs message text, tool inputs/outputs or file
// contents. The only free-text values that survive are identifiers the
// platform itself produced: model ids, tool names, skill names, and a short
// agent label (the subagent description, trimmed to 80 characters).
//
// Counting rule: Claude Code writes one transcript line per content block, so
// a single API message appears on several lines with the same `message.id`.
// usage is counted ONCE per message id (field-wise maximum across its lines).
//
// Pure functions + a small filesystem reader; no database access, so the CLI
// script and the server import path share exactly this code.
import fs from 'node:fs';
import path from 'node:path';

export const TOKEN_TYPES = ['input', 'cacheWrite', 'cacheRead', 'output'];
const LABEL_MAX = 80;

const zeroTokens = () => ({ input: 0, cacheWrite: 0, cacheRead: 0, output: 0 });
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const ms = (ts) => { const t = Date.parse(ts); return Number.isFinite(t) ? t : null; };

/** Cache-hit ratio = cache reads / everything the model read (input + cache write + cache read). null when nothing was read. */
export function cacheHitRatio(t) {
  const denom = num(t.input) + num(t.cacheWrite) + num(t.cacheRead);
  return denom > 0 ? num(t.cacheRead) / denom : null;
}

function classifyApiError(rec) {
  const status = Number(rec.apiErrorStatus) || null;
  let text = '';
  const c = rec.message?.content;
  if (typeof c === 'string') text = c;
  else if (Array.isArray(c)) text = c.map((b) => (b && typeof b.text === 'string' ? b.text : '')).join(' ');
  if (/usage limit|limit reached|out of extra usage|hit your .*limit/i.test(text)) return { kind: 'usage_limit', status };
  if (status === 429) return { kind: 'rate_limit', status };
  return { kind: 'api_error', status };
}

/**
 * Analyse the lines of ONE transcript file (main session or one subagent).
 * `lines` is an array of already-split JSONL strings. Malformed lines are
 * counted in `badLines`, never dropped silently.
 */
export function analyzeLines(lines, { label = 'main session', agentId = 'main', idleCapMinutes = 10 } = {}) {
  const byMessage = new Map(); // message id -> { model, usage, firstTs }
  const limitEvents = [];
  const toolCounts = {};
  const skillCounts = {};
  const times = [];
  let badLines = 0;
  let apiErrors = 0;
  let sessionId = null;
  let gitBranch = null;
  let messages = 0;

  for (const raw of lines) {
    const line = typeof raw === 'string' ? raw.trim() : '';
    if (!line) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { badLines += 1; continue; }
    if (!rec || typeof rec !== 'object') { badLines += 1; continue; }
    const t = ms(rec.timestamp);
    if (t != null) times.push(t);
    if (!sessionId && typeof rec.sessionId === 'string') sessionId = rec.sessionId;
    if (!gitBranch && typeof rec.gitBranch === 'string') gitBranch = rec.gitBranch.slice(0, 120);

    if (rec.type === 'system' && rec.subtype === 'compact_boundary') {
      const cm = rec.compactMetadata || {};
      limitEvents.push({
        kind: 'compaction', at: t, agentId,
        trigger: typeof cm.trigger === 'string' ? cm.trigger.slice(0, 20) : null,
        preTokens: cm.preTokens != null ? num(cm.preTokens) : null,
        postTokens: cm.postTokens != null ? num(cm.postTokens) : null,
      });
      continue;
    }
    if (rec.isApiErrorMessage === true) {
      const c = classifyApiError(rec);
      if (c.kind === 'api_error') apiErrors += 1;
      else limitEvents.push({ kind: c.kind, at: t, agentId, status: c.status });
      continue;
    }
    if (rec.type !== 'assistant' || !rec.message) continue;
    const m = rec.message;
    if (m.model === '<synthetic>') continue;
    const id = m.id || rec.uuid;
    const u = m.usage;
    if (u && id) {
      const cur = byMessage.get(id) || { model: m.model || 'unknown', usage: zeroTokens(), firstTs: t };
      cur.usage.input = Math.max(cur.usage.input, num(u.input_tokens));
      cur.usage.cacheWrite = Math.max(cur.usage.cacheWrite, num(u.cache_creation_input_tokens));
      cur.usage.cacheRead = Math.max(cur.usage.cacheRead, num(u.cache_read_input_tokens));
      cur.usage.output = Math.max(cur.usage.output, num(u.output_tokens));
      if (m.model) cur.model = m.model;
      byMessage.set(id, cur);
    }
    if (Array.isArray(m.content)) {
      for (const b of m.content) {
        if (b && b.type === 'tool_use' && typeof b.name === 'string') {
          toolCounts[b.name] = (toolCounts[b.name] || 0) + 1;
          if (b.name === 'Skill' && b.input && typeof b.input.skill === 'string') {
            const k = b.input.skill.slice(0, 80);
            skillCounts[k] = (skillCounts[k] || 0) + 1;
          }
        }
      }
    }
  }

  const tokens = zeroTokens();
  const byModel = {};
  let peakContext = 0;
  for (const { model, usage } of byMessage.values()) {
    messages += 1;
    for (const k of TOKEN_TYPES) tokens[k] += usage[k];
    const bm = (byModel[model] ||= { ...zeroTokens(), messages: 0 });
    for (const k of TOKEN_TYPES) bm[k] += usage[k];
    bm.messages += 1;
    peakContext = Math.max(peakContext, usage.input + usage.cacheWrite + usage.cacheRead);
  }

  times.sort((a, b) => a - b);
  const startedAt = times.length ? times[0] : null;
  const endedAt = times.length ? times[times.length - 1] : null;
  let activeMs = 0;
  const cap = idleCapMinutes * 60000;
  for (let i = 1; i < times.length; i += 1) activeMs += Math.min(times[i] - times[i - 1], cap);

  return {
    agentId, label: String(label).slice(0, LABEL_MAX), sessionId, gitBranch,
    messages, tokens, byModel, peakContext, startedAt, endedAt,
    activeMinutes: times.length > 1 ? round2(activeMs / 60000) : 0,
    limitEvents, apiErrors, toolCounts, skillCounts, badLines,
  };
}

const round2 = (n) => Math.round(n * 100) / 100;

function mergeCounts(into, from) { for (const [k, v] of Object.entries(from)) into[k] = (into[k] || 0) + v; }

/**
 * Combine the main-thread analysis with each subagent's into one session record.
 * `prefix` is optional cache-prefix evidence: { systemHashes, toolsHashes } counts.
 */
export function combineAgents(sourceKey, agents, { prefix = null, idleCapMinutes = 10, extraBadLines = 0 } = {}) {
  const tokens = zeroTokens();
  const byModel = {};
  const toolCounts = {};
  const skillCounts = {};
  const limitEvents = [];
  let messages = 0; let badLines = extraBadLines; let apiErrors = 0; let peakContext = 0; let activeMinutes = 0;
  const starts = []; const ends = [];
  let gitBranch = null;
  for (const a of agents) {
    for (const k of TOKEN_TYPES) tokens[k] += a.tokens[k];
    for (const [model, bm] of Object.entries(a.byModel)) {
      const t = (byModel[model] ||= { ...zeroTokens(), messages: 0 });
      for (const k of TOKEN_TYPES) t[k] += bm[k];
      t.messages += bm.messages;
    }
    mergeCounts(toolCounts, a.toolCounts);
    mergeCounts(skillCounts, a.skillCounts);
    limitEvents.push(...a.limitEvents);
    messages += a.messages; badLines += a.badLines; apiErrors += a.apiErrors;
    peakContext = Math.max(peakContext, a.peakContext);
    activeMinutes += a.activeMinutes;
    if (a.startedAt != null) starts.push(a.startedAt);
    if (a.endedAt != null) ends.push(a.endedAt);
    gitBranch = gitBranch || a.gitBranch;
  }
  limitEvents.sort((x, y) => (x.at || 0) - (y.at || 0));
  const startedAt = starts.length ? Math.min(...starts) : null;
  const endedAt = ends.length ? Math.max(...ends) : null;
  return {
    sourceKey,
    source: 'claude_code',
    label: agents[0]?.label || sourceKey,
    gitBranch,
    startedAt, endedAt,
    // INFERRED from first/last timestamps; "active" caps each idle gap.
    elapsedMinutes: startedAt != null && endedAt != null ? round2((endedAt - startedAt) / 60000) : null,
    activeMinutes: round2(activeMinutes),
    messages, tokens, byModel, peakContext,
    cacheHitRatio: cacheHitRatio(tokens),
    agents: agents.map((a) => ({
      agentId: a.agentId, label: a.label, messages: a.messages, tokens: a.tokens, byModel: a.byModel,
      peakContext: a.peakContext, startedAt: a.startedAt, endedAt: a.endedAt, activeMinutes: a.activeMinutes,
      limitEvents: a.limitEvents.length,
    })),
    limitEvents,
    toolCounts, skillCounts, apiErrors, badLines,
    prefix: prefix || null,
    idleCapMinutes,
  };
}

// ── Filesystem reader (CLI + server scan) ───────────────────────────────────

function readJsonSafe(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function findAgentFiles(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) findAgentFiles(p, out);
    else if (/^agent-.+\.jsonl$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Read a session transcript file plus its subagents folder (<dir>/<sessionId>/subagents/**). */
export function analyzeSessionFile(sessionFile, opts = {}) {
  const idleCapMinutes = opts.idleCapMinutes ?? 10;
  const sessionId = path.basename(sessionFile, '.jsonl');
  const main = analyzeLines(fs.readFileSync(sessionFile, 'utf8').split('\n'), { label: 'main session', agentId: 'main', idleCapMinutes });
  const agents = [main];
  const subDir = path.join(path.dirname(sessionFile), sessionId, 'subagents');
  const hashesSys = new Set(); const hashesTools = new Set();
  for (const f of findAgentFiles(subDir).sort()) {
    const base = f.replace(/\.jsonl$/, '');
    const meta = readJsonSafe(`${base}.meta.json`) || {};
    const label = meta.description || meta.agentType || path.basename(base);
    const a = analyzeLines(fs.readFileSync(f, 'utf8').split('\n'), { label, agentId: path.basename(base).replace(/^agent-/, ''), idleCapMinutes });
    if (meta.agentType) a.agentType = String(meta.agentType).slice(0, 40);
    agents.push(a);
    const pre = readJsonSafe(`${base}.prefix.json`);
    if (pre?.state?.systemHash != null) hashesSys.add(String(pre.state.systemHash));
    if (pre?.state?.toolsHash != null) hashesTools.add(String(pre.state.toolsHash));
  }
  const prefix = hashesSys.size || hashesTools.size
    ? { subagentsWithPrefix: hashesSys.size ? agents.length - 1 : 0, distinctSystemPrefixes: hashesSys.size, distinctToolSets: hashesTools.size }
    : null;
  const rec = combineAgents(`claude_code:${main.sessionId || sessionId}`, agents, { prefix, idleCapMinutes });
  rec.label = `Session ${(main.sessionId || sessionId).slice(0, 8)}`;
  return rec;
}

/** Newest-first list of top-level session transcripts in a Claude Code project folder. */
export function listSessionFiles(projectDir) {
  let entries = [];
  try { entries = fs.readdirSync(projectDir, { withFileTypes: true }); } catch (e) { const err = new Error(`Cannot read transcripts folder ${projectDir}: ${e.message}`); err.status = 400; throw err; }
  return entries.filter((e) => e.isFile() && e.name.endsWith('.jsonl')).map((e) => path.join(projectDir, e.name));
}

/** Folder Claude Code uses for a working directory: every non-alphanumeric character becomes "-". */
export function projectFolderFor(cwd) {
  return String(cwd).replace(/[^A-Za-z0-9]/g, '-');
}
