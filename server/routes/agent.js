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

const router = Router();
router.use(requireAdmin);

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT = `You are the Salt Basin Scrum Agent — a focused product management assistant embedded inside Betsy Salter's admin backlog dashboard at saltbasin.net.

Your job is to help Betsy plan, prioritize, and refine her product backlog. You can hold a real-time conversation about scope, sprint planning, defect triage, and JIRA syncing.

You are currently in PHASE A — scaffold only. You do NOT yet have access to backlog tools or JIRA. When Betsy asks you to do something concrete (create an item, update status, push to JIRA), acknowledge the request but explain that tool wiring lands in Session 3 (backlog tools) and Session 4 (JIRA tools). For now, focus on:
- Helping her think through user stories and acceptance criteria
- Drafting requirement detail / business rules / design specs in the format the backlog already uses
- Sprint planning conversations (reflect what she tells you, ask clarifying questions)
- Capturing decisions she makes so she can paste them into the backlog herself

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

// ── Threads ──
router.get('/threads', async (req, res) => {
  const rows = await db
    .prepare(`SELECT * FROM agent_threads WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50`)
    .all(req.user.id);
  res.json({ threads: rows.map(rowToThread) });
});

router.post('/threads', async (req, res) => {
  const { title } = req.body || {};
  const r = await db
    .prepare(`INSERT INTO agent_threads (user_id, kind, title) VALUES ($1, 'scrum', $2) RETURNING id, created_at`)
    .run(req.user.id, title || null);
  res.json({ id: Number(r.lastInsertRowid), createdAt: Date.now() });
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
  const { threadId: threadIdIn, message, model } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message required' });
  }
  const apiKey = await getMemberAnthropicKey(req.user.id);
  if (!apiKey) {
    return res.status(400).json({
      error: 'No Anthropic API key configured. Set ANTHROPIC_API_KEY in Render env, or paste a BYO key in your member Config panel.',
    });
  }

  // Get or create thread
  let threadId = threadIdIn ? Number(threadIdIn) : null;
  if (threadId) {
    const t = await db.prepare(`SELECT id FROM agent_threads WHERE id = $1 AND user_id = $2`).get(threadId, req.user.id);
    if (!t) return res.status(404).json({ error: 'thread not found' });
  } else {
    const r = await db
      .prepare(`INSERT INTO agent_threads (user_id, kind) VALUES ($1, 'scrum') RETURNING id`)
      .run(req.user.id);
    threadId = Number(r.lastInsertRowid);
  }

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

  // Call Claude
  try {
    const claudeRes = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
    const body = await claudeRes.json().catch(() => ({}));
    if (!claudeRes.ok) {
      const errMsg = body?.error?.message || body?.message || JSON.stringify(body);
      console.error('[agent] Claude error:', claudeRes.status, body);
      return res.status(claudeRes.status).json({ error: errMsg });
    }
    const assistantText = (body.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    // Persist the assistant reply
    await db
      .prepare(`INSERT INTO agent_messages (thread_id, role, content) VALUES ($1, 'assistant', $2)`)
      .run(threadId, assistantText);
    await db.prepare(`UPDATE agent_threads SET updated_at = $1 WHERE id = $2`).run(Date.now(), threadId);

    res.json({
      threadId,
      assistant: assistantText,
      usage: body.usage || null,
    });
  } catch (e) {
    console.error('[agent] dispatch failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
