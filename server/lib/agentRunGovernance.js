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
//
// Generalized 2026-08-09 (real scheduling/verification work): caps per
// (agentKey, runType) instead of agentKey alone — a multi-action agent (e.g.
// Career Researcher's 'job_research' vs 'posting_verification') would
// otherwise share one bucket, letting a frequent re-verification loop starve
// the member's actual research budget. overrides is empty by default (every
// agent+action shares defaultMaxRunsPerDay) so nothing changes in practice
// until an admin adds a specific override — no envelope value has ever been
// saved for this id in production, so this shape change is safe.
import { defineConfigEnvelope, resolveConfigEnvelope } from './configEnvelope.js';
import { db } from '../db.js';

defineConfigEnvelope({
  id: 'agent_run_daily_cap',
  label: 'Agent Run Daily Cap',
  description: 'Maximum number of on-demand or scheduled agent runs a user may trigger per rolling 24 hours, per agent key and action. Configurable per agent, or per specific agent action, via overrides.',
  defaultValue: { defaultMaxRunsPerDay: 10, overrides: [] },
  validate: (value) => {
    if (!value || typeof value !== 'object') return ['must be an object'];
    if (typeof value.defaultMaxRunsPerDay !== 'number' || !Number.isFinite(value.defaultMaxRunsPerDay) || value.defaultMaxRunsPerDay < 1) {
      return ['defaultMaxRunsPerDay must be a positive number'];
    }
    if (!Array.isArray(value.overrides)) return ['overrides must be an array'];
    for (const o of value.overrides) {
      if (!o || typeof o !== 'object' || !o.agentKey || typeof o.maxRunsPerDay !== 'number' || o.maxRunsPerDay < 1) {
        return ['each override needs agentKey and a positive maxRunsPerDay (runType is optional)'];
      }
    }
    return [];
  },
});

/** Most-specific-wins: (agentKey+runType) override > (agentKey-only) override > platform default. */
function resolveMaxRunsPerDay(envelopeValue, agentKey, runType) {
  const overrides = envelopeValue.overrides || [];
  const exact = overrides.find((o) => o.agentKey === agentKey && o.runType === runType);
  if (exact) return exact.maxRunsPerDay;
  const agentWide = overrides.find((o) => o.agentKey === agentKey && !o.runType);
  if (agentWide) return agentWide.maxRunsPerDay;
  return envelopeValue.defaultMaxRunsPerDay;
}

/**
 * Throws if the user has hit today's cap for this agent key + run type;
 * otherwise records the run and returns. Call this BEFORE making the
 * Anthropic call, not after — a denied run should never reach the model.
 */
export async function checkAndRecordRunAllowance(userId, agentKey, runType) {
  const { value } = await resolveConfigEnvelope('agent_run_daily_cap');
  const maxRunsPerDay = resolveMaxRunsPerDay(value, agentKey, runType);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const row = await db.prepare(
    `SELECT COUNT(*)::int AS count FROM agent_run_log WHERE user_id=$1 AND agent_key=$2 AND run_type=$3 AND created_at >= $4`
  ).get(userId, agentKey, runType, cutoff);
  const countToday = row?.count || 0;
  if (countToday >= maxRunsPerDay) {
    const err = new Error(`Daily limit reached for ${agentKey}/${runType} (${maxRunsPerDay}/day) — try again later.`);
    err.status = 429;
    throw err;
  }
  await db.prepare(
    `INSERT INTO agent_run_log (user_id, agent_key, run_type, created_at) VALUES ($1,$2,$3,$4)`
  ).run(userId, agentKey, runType, Date.now());
}
