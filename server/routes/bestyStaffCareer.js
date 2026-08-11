import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { resolveReconciliationTask } from '../lib/careerReconciliation.js';
import { runInteractiveAgentLoop } from '../lib/interactiveAgentLoop.js';

const router = Router();
const MAX_HISTORY_TURNS = 16;
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const CAREER_TOOLS = [{
  name: 'resolve_career_conflict',
  description: 'Resolve the member-owned open career reconciliation task after the member has clearly stated the corrected value or selected a source. Never infer a correction the member did not state.',
  input_schema: {
    type: 'object',
    properties: {
      taskId: { type: 'integer' },
      method: { type: 'string', enum: ['chose_source', 'user_dictated'] },
      chosenSourceReference: { type: 'string' },
      dictatedInstruction: { type: 'string' },
      correctedValue: { description: 'The normalized value to apply. Preserve the member meaning; do not add facts.' },
    },
    required: ['taskId', 'method'],
  },
}];

function parseConfig(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

router.post('/', requireUser, async (req, res) => {
  const { message, history = [], taskId } = req.body || {};
  if (!message || typeof message !== 'string' || message.length > 8000) {
    return res.status(400).json({ error: 'message required (max 8000 chars)' });
  }
  if (!Number.isInteger(Number(taskId))) return res.status(400).json({ error: 'taskId required' });
  if (!anthropic) return res.json({ offline: true });

  try {
    const task = await db.prepare(`
      SELECT t.*, r.user_id AS rod_user_id
      FROM career_reconciliation_tasks t
      JOIN journey_data_rods r ON r.id=t.rod_id
      WHERE t.id=$1 AND t.status='open'
    `).get(Number(taskId));
    if (!task || Number(task.rod_user_id) !== Number(req.user.id)) return res.status(404).json({ error: 'Task not found' });

    const agentDefinition = await db.prepare(`
      SELECT * FROM agent_hub_definitions
      WHERE public_key='bestystaff' AND execution_mode='interactive' AND enabled=true
      LIMIT 1
    `).get();
    if (!agentDefinition) return res.status(404).json({ error: 'BestyStaff is not available' });
    const config = parseConfig(agentDefinition.config);
    const llmPolicy = config.llm || { provider: 'anthropic', model: 'claude-opus-4-8', maxOutputTokensPerResponse: 2048, tokenCap: 500000, capPeriod: 'month', maxToolIterations: 4 };
    if (llmPolicy.mode === 'none') return res.json({ offline: true, deterministicOnly: true });
    if (llmPolicy.provider !== 'anthropic') return res.status(503).json({ error: `Configured LLM provider "${llmPolicy.provider}" is not available` });

    const evidenceRefs = typeof task.evidence_refs === 'string' ? JSON.parse(task.evidence_refs) : (task.evidence_refs || []);
    const cleanHistory = (Array.isArray(history) ? history : [])
      .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string')
      .slice(-MAX_HISTORY_TURNS)
      .map((item) => ({ role: item.role, content: item.content.slice(0, 8000) }));
    const messages = [...cleanHistory, { role: 'user', content: message }];
    let resolved = null;
    const systemPrompt = `You are BestyStaff helping an authenticated member resolve one Career Foundation reconciliation task.
Task id: ${Number(task.id)}
Task type: ${task.task_type}
Entry type: ${task.entry_type}
Atom key: ${task.atom_key || 'unmapped'}
Evidence options: ${JSON.stringify(evidenceRefs).slice(0, 12000)}

The sources have equal standing. Never choose automatically. Ask a concise clarification if the member has not supplied an exact choice or corrected value. Once clear, call resolve_career_conflict exactly once. Do not alter any other task or field. Explain the applied result plainly.`;

    const loop = await runInteractiveAgentLoop({
      anthropic,
      agentDefinition,
      llmPolicy,
      systemPrompt,
      tools: CAREER_TOOLS,
      messages,
      executeTool: async (name, input) => {
        if (name !== 'resolve_career_conflict') return { ok: false, error: 'Unknown tool' };
        if (Number(input.taskId) !== Number(task.id)) return { ok: false, error: 'Task id is outside this conversation scope' };
        const resolution = input.method === 'chose_source'
          ? { method: 'chose_source', chosenSourceReference: input.chosenSourceReference }
          : { method: 'user_dictated', dictatedInstruction: input.dictatedInstruction || message, appliedValue: input.correctedValue };
        if (resolution.method === 'user_dictated' && (resolution.appliedValue === undefined || resolution.appliedValue === null || resolution.appliedValue === '')) {
          return { ok: false, error: 'A corrected value is required' };
        }
        resolved = await resolveReconciliationTask(req.user.id, Number(task.id), resolution);
        return { ok: true, ...resolved };
      },
    });
    res.json({ reply: loop.exhausted ? 'I need one more message to finish that correction.' : loop.reply, resolved });
  } catch (error) {
    console.error('[bestystaff-career] failed:', error.message);
    if (error.code === 'AGENT_LLM_CAP_REACHED') return res.status(429).json({ error: 'BestyStaff has reached its configured token cap.', usage: error.usage });
    res.status(500).json({ error: 'BestyStaff could not complete that career correction.' });
  }
});

export default router;
