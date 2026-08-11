// Scrum Agent — Phase A scaffold.
//
// Phase A goals:
//   - Threads + messages persistence
//   - /chat endpoint that accepts a message, calls Claude with NO tools,
//     stores both turns, returns the assistant reply
//   - Sets up the system prompt that future-phase tool wiring will use
//
// Phase B (next session) wires up actual backlog tools (list/get/update/...).
//
// Auth: admin-only for now. Member-side agent could come later but the
// scrum agent specifically is for backlog work, which only admin sees.

import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { assertAgentLlmBudget, recordAgentLlmUsage } from '../lib/agentLlmUsage.js';
import { compileSessionContext, ensureDefaultContextProfile, extractionPrompt, recordExtraction } from '../lib/codeAgentContext.js';
import { executeApprovedCodeRun } from '../lib/codeAgentRunner.js';
import { ensureBacklogIntelligenceSchema } from '../lib/backlogIntelligenceSchema.js';
import { reconcileBacklogHistory } from '../lib/backlogHistoryReconciler.js';

const router = Router();
router.use(requireAdmin);

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_OPENAI_MODEL = 'gpt-5.6-sol';

const SYSTEM_PROMPT = `You are the Salt Basin Scrum Agent — a focused product management assistant embedded inside Betsy Salter's admin backlog dashboard at saltbasin.net.

Your job is to help Betsy plan, prioritize, and refine her product backlog. You can hold a real-time conversation about scope, sprint planning, defect triage, and JIRA syncing.

You have governed read context from the selected context profile, backlog item, capability registry, and approved knowledge registry. You do not have filesystem, shell, backlog-write, deployment, or JIRA tools in this runtime, so never claim those actions occurred. Focus on:
- Helping her think through user stories and acceptance criteria
- Drafting requirement detail / business rules / design specs in the format the backlog already uses
- Sprint planning conversations (reflect what she tells you, ask clarifying questions)
- Capturing durable decisions, rules, lessons, and implementation evidence for the platform's extraction registry

Voice: direct, dry, never sycophantic. Match the Salt Basin Strategic Operator brand voice. No emojis unless she uses them first.

Format: when listing requirements or fields, use the same structure the Backlog drawer uses (User Story · Requirement Detail · Business Rules · Design Spec · Acceptance Criteria · Process Steps).`;

// ── Helpers ──
async function getMemberAnthropicKey(userId) {
  // Read from member_configs.draft.integrations.anthropicKey if member;
  // for admin, fall back to the platform's ANTHROPIC_API_KEY env var.
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const row = await db
    .prepare(`SELECT data FROM member_configs WHERE user_id = $1 AND kind = 'draft'`)
    .get(userId);
  if (!row) return null;
  try {
    const cfg = JSON.parse(row.data);
    return cfg?.integrations?.anthropicKey || null;
  } catch { return null; }
}

function rowToThread(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    title: r.title,
    kind: r.kind,
    provider: r.provider || 'anthropic',
    model: r.model || null,
    contextProfileId: r.context_profile_id == null ? null : Number(r.context_profile_id),
    backlogItemId: r.backlog_item_id == null ? null : Number(r.backlog_item_id),
    stage: r.stage || 'definition',
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}
function rowToMessage(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    threadId: Number(r.thread_id),
    role: r.role,
    content: r.content,
    toolCalls: r.tool_calls ? safeJSON(r.tool_calls) : null,
    createdAt: Number(r.created_at),
  };
}
function safeJSON(s) { try { return JSON.parse(s); } catch { return null; } }

async function dispatchAnthropic({ apiKey, model, system, messages, maxTokens = 4096 }) {
  const response = await fetch(CLAUDE_API, { method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body?.error?.message || body?.message || JSON.stringify(body)), { status: response.status });
  return { text: (body.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n'), usage: body.usage || null, sessionId: null };
}

async function dispatchOpenAI({ apiKey, model, system, messages, maxTokens = 4096 }) {
  const input = messages.map((m) => ({ role: m.role, content: m.content }));
  const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model, instructions: system, input, max_output_tokens: maxTokens }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body?.error?.message || body?.message || JSON.stringify(body)), { status: response.status });
  const text = body.output_text || (body.output || []).flatMap((o) => o.content || []).filter((c) => c.type === 'output_text').map((c) => c.text).join('\n');
  return { text, usage: body.usage || null, sessionId: body.id || null };
}

async function dispatchProvider(args) {
  return args.provider === 'openai' ? dispatchOpenAI(args) : dispatchAnthropic(args);
}

function parseJsonResponse(text) {
  const cleaned = String(text || '').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch { return { records: [], stageEvents: [] }; }
}

// ── Threads ──
router.get('/threads', async (req, res) => {
  const rows = await db
    .prepare(`SELECT * FROM agent_threads WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50`)
    .all(req.user.id);
  res.json({ threads: rows.map(rowToThread) });
});

router.post('/threads', async (req, res) => {
  const { title, provider = 'anthropic', model, contextProfileId, backlogItemId } = req.body || {};
  if (!['anthropic', 'openai'].includes(provider)) return res.status(400).json({ error: 'provider must be anthropic or openai' });
  const profile = contextProfileId ? { id: Number(contextProfileId) } : await ensureDefaultContextProfile(req.user.id);
  const compiled = await compileSessionContext({ profileId: profile?.id, backlogItemId });
  const r = await db
    .prepare(`INSERT INTO agent_threads (user_id,kind,title,provider,model,context_profile_id,backlog_item_id,context_snapshot) VALUES ($1,'code',$2,$3,$4,$5,$6,$7::jsonb) RETURNING id,created_at`)
    .run(req.user.id, title || null, provider, model || (provider === 'openai' ? DEFAULT_OPENAI_MODEL : DEFAULT_MODEL), profile?.id || null, backlogItemId || null, compiled.snapshot);
  await db.prepare(`INSERT INTO agent_work_stage_events (thread_id,backlog_item_id,stage,event_type,summary,created_by,created_at) VALUES ($1,$2,'definition','entered','Code-agent session started',$3,$4)`)
    .run(r.lastInsertRowid, backlogItemId || null, req.user.id, Date.now());
  res.json({ id: Number(r.lastInsertRowid), createdAt: Date.now() });
});

router.get('/context-profiles', async (req, res) => {
  await ensureDefaultContextProfile(req.user.id);
  const profiles = await db.prepare(`SELECT * FROM agent_context_profiles WHERE is_active=true ORDER BY is_default DESC,label`).all();
  res.json({ profiles: profiles.map((p) => ({ id: Number(p.id), key: p.profile_key, label: p.label, instructions: p.instructions, sourceConfig: p.source_config, isDefault: !!p.is_default })) });
});

router.post('/context-profiles', async (req, res) => {
  const { key, label, instructions, sourceConfig = {}, isDefault = false } = req.body || {};
  if (!key || !label || !instructions) return res.status(400).json({ error: 'key, label, and instructions are required' });
  if (isDefault) await db.prepare(`UPDATE agent_context_profiles SET is_default=false WHERE is_default=true`).run();
  const row = await db.prepare(`INSERT INTO agent_context_profiles (profile_key,label,instructions,source_config,is_default,created_by,created_at,updated_at) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$7) RETURNING *`)
    .get(key, label, instructions, sourceConfig, !!isDefault, req.user.id, Date.now());
  res.status(201).json({ profile: { id: Number(row.id), key: row.profile_key, label: row.label } });
});

router.get('/knowledge', async (req, res) => {
  const rows = await db.prepare(`SELECT k.*, b.title backlog_title FROM agent_knowledge_records k LEFT JOIN backlog_items b ON b.id=k.backlog_item_id ORDER BY k.template_candidate DESC,k.reuse_score DESC,k.updated_at DESC LIMIT 300`).all();
  res.json({ records: rows.map((r) => ({ id: Number(r.id), recordType: r.record_type, title: r.title, statement: r.statement, rationale: r.rationale, status: r.status, confidence: r.confidence == null ? null : Number(r.confidence), domainKeys: r.domain_keys, capabilityIds: r.capability_ids, eidosObjectLinks: r.eidos_object_links, backlogItemId: r.backlog_item_id == null ? null : Number(r.backlog_item_id), backlogTitle: r.backlog_title, implementation: r.implementation, reuseScore: Number(r.reuse_score || 0), templateCandidate: !!r.template_candidate, createdAt: Number(r.created_at) })) });
});

router.patch('/knowledge/:id', async (req, res) => {
  const { status, reuseScore, templateCandidate, implementation } = req.body || {};
  await db.prepare(`UPDATE agent_knowledge_records SET status=COALESCE($1,status),reuse_score=COALESCE($2,reuse_score),template_candidate=COALESCE($3,template_candidate),implementation=COALESCE($4::jsonb,implementation),updated_at=$5 WHERE id=$6`)
    .run(status ?? null, reuseScore ?? null, templateCandidate ?? null, implementation ?? null, Date.now(), req.params.id);
  res.json({ ok: true });
});

function rowToCodeRun(r) {
  return { id: Number(r.id), threadId: Number(r.thread_id), backlogItemId: r.backlog_item_id == null ? null : Number(r.backlog_item_id), provider: r.provider, model: r.model, objective: r.objective, acceptanceCriteria: r.acceptance_criteria, status: r.status, approvalStatus: r.approval_status, approvedAt: r.approved_at ? Number(r.approved_at) : null, startedAt: r.started_at ? Number(r.started_at) : null, finishedAt: r.finished_at ? Number(r.finished_at) : null, exitCode: r.exit_code, changedFiles: r.changed_files || [], preexistingFiles: r.preexisting_files || [], verification: r.verification || [], error: r.error, createdAt: Number(r.created_at) };
}

router.get('/code-runs', async (req, res) => {
  const threadId = req.query.threadId ? Number(req.query.threadId) : null;
  const rows = threadId
    ? await db.prepare(`SELECT r.* FROM agent_code_runs r JOIN agent_threads t ON t.id=r.thread_id WHERE r.thread_id=$1 AND t.user_id=$2 ORDER BY r.created_at DESC LIMIT 50`).all(threadId, req.user.id)
    : await db.prepare(`SELECT r.* FROM agent_code_runs r JOIN agent_threads t ON t.id=r.thread_id WHERE t.user_id=$1 ORDER BY r.created_at DESC LIMIT 100`).all(req.user.id);
  res.json({ runs: rows.map(rowToCodeRun) });
});

router.post('/code-runs', async (req, res) => {
  const { threadId, objective, acceptanceCriteria } = req.body || {};
  if (!threadId || !objective) return res.status(400).json({ error: 'threadId and objective are required' });
  const thread = await db.prepare(`SELECT * FROM agent_threads WHERE id=$1 AND user_id=$2`).get(threadId, req.user.id);
  if (!thread) return res.status(404).json({ error: 'thread not found' });
  const row = await db.prepare(`INSERT INTO agent_code_runs (thread_id,backlog_item_id,provider,model,objective,acceptance_criteria,created_by,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING *`)
    .get(thread.id, thread.backlog_item_id, thread.provider, thread.model, objective, acceptanceCriteria || null, req.user.id, Date.now());
  await db.prepare(`INSERT INTO agent_code_run_events (run_id,event_type,message,created_at) VALUES ($1,'proposed','Work order proposed; explicit approval required.',$2)`).run(row.id, Date.now());
  res.status(201).json({ run: rowToCodeRun(row) });
});

router.post('/code-runs/:id/approve', async (req, res) => {
  const run = await db.prepare(`SELECT r.* FROM agent_code_runs r JOIN agent_threads t ON t.id=r.thread_id WHERE r.id=$1 AND t.user_id=$2`).get(req.params.id, req.user.id);
  if (!run) return res.status(404).json({ error: 'run not found' });
  if (run.status !== 'proposed') return res.status(409).json({ error: `run is already ${run.status}` });
  await db.prepare(`UPDATE agent_code_runs SET status='approved',approval_status='approved',approved_by=$1,approved_at=$2,updated_at=$2 WHERE id=$3`).run(req.user.id, Date.now(), run.id);
  await db.prepare(`INSERT INTO agent_code_run_events (run_id,event_type,message,created_at) VALUES ($1,'approved','Admin approved repository execution.',$2)`).run(run.id, Date.now());
  setImmediate(() => executeApprovedCodeRun(Number(run.id)).catch((error) => console.error('[code-run]', error.message)));
  res.status(202).json({ ok: true, runId: Number(run.id), status: 'approved' });
});

router.post('/code-runs/:id/reject', async (req, res) => {
  const run = await db.prepare(`SELECT r.id,r.status FROM agent_code_runs r JOIN agent_threads t ON t.id=r.thread_id WHERE r.id=$1 AND t.user_id=$2`).get(req.params.id, req.user.id);
  if (!run) return res.status(404).json({ error: 'run not found' });
  if (run.status !== 'proposed') return res.status(409).json({ error: `run is already ${run.status}` });
  await db.prepare(`UPDATE agent_code_runs SET status='rejected',approval_status='rejected',error=$1,updated_at=$2 WHERE id=$3`).run(req.body?.reason || 'Rejected by admin', Date.now(), run.id);
  res.json({ ok: true });
});

router.get('/code-runs/:id/events', async (req, res) => {
  const run = await db.prepare(`SELECT r.* FROM agent_code_runs r JOIN agent_threads t ON t.id=r.thread_id WHERE r.id=$1 AND t.user_id=$2`).get(req.params.id, req.user.id);
  if (!run) return res.status(404).json({ error: 'run not found' });
  const after = Number(req.query.after || 0);
  const events = await db.prepare(`SELECT * FROM agent_code_run_events WHERE run_id=$1 AND id>$2 ORDER BY id LIMIT 500`).all(run.id, after);
  res.json({ run: rowToCodeRun(run), events: events.map((e) => ({ id: Number(e.id), eventType: e.event_type, stream: e.stream, message: e.message, payload: e.payload, createdAt: Number(e.created_at) })) });
});

router.get('/backlog-reconciliation', async (_req, res) => {
  await ensureBacklogIntelligenceSchema();
  const runs = await db.prepare(`SELECT * FROM backlog_reconciliation_runs ORDER BY created_at DESC LIMIT 20`).all();
  res.json({ runs: runs.map((r) => ({ id: Number(r.id), provider: r.provider, status: r.status, stats: r.stats || {}, error: r.error, startedAt: r.started_at ? Number(r.started_at) : null, finishedAt: r.finished_at ? Number(r.finished_at) : null, createdAt: Number(r.created_at) })) });
});

router.post('/backlog-reconciliation', async (req, res) => {
  await ensureBacklogIntelligenceSchema();
  const provider = req.body?.provider === 'openai' ? 'openai' : 'anthropic';
  const limit = Math.max(0, Number(req.body?.limit || 0));
  const active = await db.prepare(`SELECT id FROM backlog_reconciliation_runs WHERE status IN ('queued','running') LIMIT 1`).get();
  if (active) return res.status(409).json({ error: `reconciliation run ${active.id} is already active` });
  const row = await db.prepare(`INSERT INTO backlog_reconciliation_runs (provider,status,stats,created_by,created_at,updated_at) VALUES ($1,'queued',$2::jsonb,$3,$4,$4) RETURNING id`).get(provider, { limit }, req.user.id, Date.now());
  setImmediate(async () => {
    try {
      await db.prepare(`UPDATE backlog_reconciliation_runs SET status='running',started_at=$1,updated_at=$1 WHERE id=$2`).run(Date.now(), row.id);
      const stats = await reconcileBacklogHistory({ provider, limit, userId: req.user.id });
      await db.prepare(`UPDATE backlog_reconciliation_runs SET status='completed',stats=$1::jsonb,finished_at=$2,updated_at=$2 WHERE id=$3`).run(stats, Date.now(), row.id);
    } catch (error) {
      await db.prepare(`UPDATE backlog_reconciliation_runs SET status='failed',error=$1,finished_at=$2,updated_at=$2 WHERE id=$3`).run(error.message, Date.now(), row.id);
    }
  });
  res.status(202).json({ runId: Number(row.id), status: 'queued' });
});

router.get('/threads/:id/messages', async (req, res) => {
  const threadId = Number(req.params.id);
  // Confirm thread belongs to this user
  const t = await db.prepare(`SELECT id FROM agent_threads WHERE id = $1 AND user_id = $2`).get(threadId, req.user.id);
  if (!t) return res.status(404).json({ error: 'thread not found' });
  const rows = await db
    .prepare(`SELECT * FROM agent_messages WHERE thread_id = $1 ORDER BY created_at, id`)
    .all(threadId);
  res.json({ messages: rows.map(rowToMessage) });
});

router.delete('/threads/:id', async (req, res) => {
  const id = Number(req.params.id);
  await db.prepare(`DELETE FROM agent_threads WHERE id = $1 AND user_id = $2`).run(id, req.user.id);
  res.json({ ok: true });
});

// ── Chat: append a user turn, call Claude, store assistant reply ──
router.post('/chat', async (req, res) => {
  const { threadId: threadIdIn, message, model, provider: providerIn = 'anthropic', contextProfileId, backlogItemId } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message required' });
  }
  const agentDefinition = await db.prepare(`SELECT id, config FROM agent_hub_definitions WHERE key='scrum-agent'`).get();
  const definitionConfig = typeof agentDefinition?.config === 'string' ? JSON.parse(agentDefinition.config) : (agentDefinition?.config || {});
  const llmPolicy = definitionConfig.llm || { provider: 'anthropic', model: DEFAULT_MODEL, maxOutputTokensPerResponse: 2048, tokenCap: 300000, capPeriod: 'month' };

  // Get or create thread
  let threadId = threadIdIn ? Number(threadIdIn) : null;
  let thread;
  if (threadId) {
    thread = await db.prepare(`SELECT * FROM agent_threads WHERE id = $1 AND user_id = $2`).get(threadId, req.user.id);
    if (!thread) return res.status(404).json({ error: 'thread not found' });
  } else {
    if (!['anthropic', 'openai'].includes(providerIn)) return res.status(400).json({ error: 'provider must be anthropic or openai' });
    const profile = contextProfileId ? { id: Number(contextProfileId) } : await ensureDefaultContextProfile(req.user.id);
    const compiled = await compileSessionContext({ profileId: profile?.id, backlogItemId });
    const r = await db
      .prepare(`INSERT INTO agent_threads (user_id,kind,provider,model,context_profile_id,backlog_item_id,context_snapshot) VALUES ($1,'code',$2,$3,$4,$5,$6::jsonb) RETURNING id`)
      .run(req.user.id, providerIn, model || (providerIn === 'openai' ? DEFAULT_OPENAI_MODEL : DEFAULT_MODEL), profile?.id || null, backlogItemId || null, compiled.snapshot);
    threadId = Number(r.lastInsertRowid);
    thread = await db.prepare(`SELECT * FROM agent_threads WHERE id=$1`).get(threadId);
    await db.prepare(`INSERT INTO agent_work_stage_events (thread_id,backlog_item_id,stage,event_type,summary,created_by,created_at) VALUES ($1,$2,'definition','entered','Code-agent session started',$3,$4)`).run(threadId, backlogItemId || null, req.user.id, Date.now());
  }

  const provider = thread.provider || providerIn;
  const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : await getMemberAnthropicKey(req.user.id);
  if (!apiKey) return res.status(400).json({ error: provider === 'openai' ? 'OPENAI_API_KEY is not configured.' : 'No Anthropic API key configured.' });

  // Persist the user turn
  await db
    .prepare(`INSERT INTO agent_messages (thread_id, role, content) VALUES ($1, 'user', $2)`)
    .run(threadId, message);

  // Load prior turns to pass to Claude
  const priorRows = await db
    .prepare(`SELECT role, content FROM agent_messages WHERE thread_id = $1 ORDER BY created_at, id`)
    .all(threadId);
  const messages = priorRows
    .filter((r) => r.role === 'user' || r.role === 'assistant')
    .map((r) => ({ role: r.role, content: r.content }));

  const compiled = await compileSessionContext({ profileId: thread.context_profile_id, backlogItemId: thread.backlog_item_id });
  const activeModel = model || thread.model || (provider === 'openai' ? DEFAULT_OPENAI_MODEL : DEFAULT_MODEL);

  // Call the selected code-agent provider, then run a governed extraction pass.
  try {
    if (agentDefinition) await assertAgentLlmBudget(Number(agentDefinition.id), llmPolicy);
    const result = await dispatchProvider({ provider, apiKey, model: activeModel, maxTokens: Number(llmPolicy.maxOutputTokensPerResponse || 4096), system: `${SYSTEM_PROMPT}\n\n${compiled.system}`, messages });
    if (agentDefinition) await recordAgentLlmUsage(Number(agentDefinition.id), llmPolicy, result.usage || {});
    const assistantText = result.text;
    // Persist the assistant reply
    const saved = await db.prepare(`INSERT INTO agent_messages (thread_id,role,content) VALUES ($1,'assistant',$2) RETURNING id`).get(threadId, assistantText);
    await db.prepare(`UPDATE agent_threads SET updated_at=$1,model=$2,provider_session_id=COALESCE($3,provider_session_id) WHERE id=$4`).run(Date.now(), activeModel, result.sessionId, threadId);

    let extractionStats = { inserted: 0, stageEvents: 0 };
    try {
      const extract = await dispatchProvider({ provider, apiKey, model: activeModel, maxTokens: 3000, system: 'You are a strict JSON knowledge extraction service.', messages: [{ role: 'user', content: extractionPrompt(threadId, thread.backlog_item_id, `USER: ${message}\nASSISTANT: ${assistantText}`) }] });
      extractionStats = await recordExtraction({ threadId, messageId: Number(saved.id), backlogItemId: thread.backlog_item_id, userId: req.user.id, extraction: parseJsonResponse(extract.text) });
    } catch (extractError) {
      console.warn('[agent] knowledge extraction skipped:', extractError.message);
    }

    res.json({
      threadId,
      assistant: assistantText,
      provider,
      model: activeModel,
      usage: result.usage || null,
      extraction: extractionStats,
    });
  } catch (e) {
    console.error('[agent] dispatch failed:', e.message);
    if (e.code === 'AGENT_LLM_CAP_REACHED') return res.status(429).json({ error: 'This agent has reached its configured LLM token cap for the current period.', usage: e.usage });
    res.status(e.status || 500).json({ error: e.message });
  }
});

export default router;
