// Agent run governance (2026-08-07) — the only cost/rate guardrail that
// exists anywhere in this codebase for an agent-triggered (not a live user
// request/response) Anthropic call. server/lib/rateLimit.js is IP-keyed
// Express middleware and has no meaning outside an HTTP request; every
// Anthropic call site before this one lived inside a request handler
// answering a human directly. Real on-demand agent execution (job research,
// resume generation) needed this before it needed anything else.
//
// The cap itself is a Config Envelope (server/lib/configEnvelope.js) — same
// "admin-editable at runtime, no deploy" reasoning as
// publicationFlowEnvelopes.js — not a hardcoded constant.
import { defineConfigEnvelope, resolveConfigEnvelope } from './configEnvelope.js';
import { db } from '../db.js';

defineConfigEnvelope({
  id: 'agent_run_daily_cap',
  label: 'Agent Run Daily Cap',
  description: 'Maximum number of on-demand agent runs (job research, resume generation, ...) a single user may trigger per rolling 24 hours, per agent key.',
  defaultValue: { maxRunsPerDay: 10 },
  validate: (value) => {
    if (!value || typeof value !== 'object') return ['must be an object'];
    if (typeof value.maxRunsPerDay !== 'number' || !Number.isFinite(value.maxRunsPerDay) || value.maxRunsPerDay < 1) {
      return ['maxRunsPerDay must be a positive number'];
    }
    return [];
  },
});

/**
 * Throws if the user has hit today's cap for this agent key; otherwise
 * records the run and returns. Call this BEFORE making the Anthropic call,
 * not after — a denied run should never reach the model.
 */
export async function checkAndRecordRunAllowance(userId, agentKey, runType) {
  const { value } = await resolveConfigEnvelope('agent_run_daily_cap');
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const row = await db.prepare(
    `SELECT COUNT(*)::int AS count FROM agent_run_log WHERE user_id=$1 AND agent_key=$2 AND created_at >= $3`
  ).get(userId, agentKey, cutoff);
  const countToday = row?.count || 0;
  if (countToday >= value.maxRunsPerDay) {
    const err = new Error(`Daily limit reached for ${agentKey} (${value.maxRunsPerDay}/day) — try again later.`);
    err.status = 429;
    throw err;
  }
  await db.prepare(
    `INSERT INTO agent_run_log (user_id, agent_key, run_type, created_at) VALUES ($1,$2,$3,$4)`
  ).run(userId, agentKey, runType, Date.now());
}
