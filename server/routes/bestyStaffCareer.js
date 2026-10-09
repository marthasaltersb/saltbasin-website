import { Router } from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { resolveReconciliationTask } from '../lib/careerReconciliation.js';
import { assertAgentLlmBudget, recordAgentLlmUsage } from '../lib/agentLlmUsage.js';

const router = Router();
const MAX_HISTORY_TURNS = 16;
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// No Anthropic tool calls here — applying a resolution is a deterministic
// decision this route makes in code (see the `if (extraction.resolved ...)`
// check below), never something the model triggers via tool_use. Claude is
// called once per turn as a plain (tool-less) completion whose only job is
// the genuinely probabilistic part: understanding the member's free-text
// reply well enough to (a) extract a structured judgement matching
// ExtractionSchema and (b) draft the next clarifying line if not yet
// resolved. The route parses and validates that JSON itself — Claude never
// decides whether resolveReconciliationTask() actually runs.
const ExtractionSchema = z.object({
  resolved: z.boolean(),
  method: z.enum(['chose_source', 'user_dictated']).nullable(),
  chosenSourceReference: z.string().nullable(),
  correctedValue: z.union([z.string(), z.number(), z.boolean()]).nullable(),
  reply: z.string(),
});

function parseConfig(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

// Extracts a JSON object from Claude's plain-text response. Claude is asked
// to emit ONLY the object (no prose, no code fences) but models sometimes
// wrap it anyway — strip a leading/trailing fence before parsing rather than
// failing the turn over formatting.
function extractJson(text) {
  const stripped = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  return JSON.parse(stripped);
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
    const llmPolicy = config.llm || { provider: 'anthropic', model: 'claude-opus-4-8', maxOutputTokensPerResponse: 2048, tokenCap: 500000, capPeriod: 'month' };
    if (llmPolicy.mode === 'none') return res.json({ offline: true, deterministicOnly: true });
    if (llmPolicy.provider !== 'anthropic') return res.status(503).json({ error: `Configured LLM provider "${llmPolicy.provider}" is not available` });

    const evidenceRefs = typeof task.evidence_refs === 'string' ? JSON.parse(task.evidence_refs) : (task.evidence_refs || []);
    const cleanHistory = (Array.isArray(history) ? history : [])
      .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string')
      .slice(-MAX_HISTORY_TURNS)
      .map((item) => ({ role: item.role, content: item.content.slice(0, 8000) }));
    const messages = [...cleanHistory, { role: 'user', content: message }];

    const systemPrompt = `You are BestyStaff helping an authenticated member resolve one Career Foundation reconciliation task.
Task id: ${Number(task.id)}
Task type: ${task.task_type}
Entry type: ${task.entry_type}
Atom key: ${task.atom_key || 'unmapped'}
Evidence options: ${JSON.stringify(evidenceRefs).slice(0, 12000)}

The sources have equal standing. Never choose automatically. Your only job is to read the conversation and report, as JSON, whether the member has clearly supplied an exact choice or corrected value — never infer a correction they did not state. Ask a concise clarification if not.

Respond with ONLY a JSON object (no prose, no code fence) matching exactly this shape:
{
  "resolved": boolean,               // true only if the member has clearly and unambiguously chosen a source or dictated a corrected value
  "method": "chose_source" | "user_dictated" | null,
  "chosenSourceReference": string | null,   // required when method is "chose_source"
  "correctedValue": string | number | boolean | null,  // required when method is "user_dictated" — the normalized value; preserve member meaning, do not add facts
  "reply": string                    // what to say to the member next: a clarifying question if not resolved, or a plain confirmation of the result if resolved
}`;

    await assertAgentLlmBudget(Number(agentDefinition.id), llmPolicy);
    const response = await anthropic.messages.create({
      model: llmPolicy.model,
      max_tokens: Math.max(256, Math.min(16384, Number(llmPolicy.maxOutputTokensPerResponse || 2048))),
      system: systemPrompt,
      messages,
    });
    await recordAgentLlmUsage(Number(agentDefinition.id), llmPolicy, response.usage || {});

    const replyText = (response.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    let extraction;
    try {
      extraction = ExtractionSchema.parse(extractJson(replyText));
    } catch {
      return res.json({ reply: "I need one more message to finish that correction.", resolved: null });
    }

    // Deterministic gate — the route decides whether to actually apply a
    // resolution, never the model. Mirrors executeTool's old validation.
    let resolved = null;
    if (
      extraction.resolved
      && extraction.method
      && ((extraction.method === 'chose_source' && extraction.chosenSourceReference)
        || (extraction.method === 'user_dictated' && extraction.correctedValue !== null && extraction.correctedValue !== ''))
    ) {
      const resolution = extraction.method === 'chose_source'
        ? { method: 'chose_source', chosenSourceReference: extraction.chosenSourceReference }
        : { method: 'user_dictated', dictatedInstruction: message, appliedValue: extraction.correctedValue };
      resolved = await resolveReconciliationTask(req.user.id, Number(task.id), resolution);
    }

    res.json({ reply: extraction.reply || '…', resolved });
  } catch (error) {
    console.error('[bestystaff-career] failed:', error.message);
    if (error.code === 'AGENT_LLM_CAP_REACHED') return res.status(429).json({ error: 'BestyStaff has reached its configured token cap.', usage: error.usage });
    res.status(500).json({ error: 'BestyStaff could not complete that career correction.' });
  }
});

export default router;
