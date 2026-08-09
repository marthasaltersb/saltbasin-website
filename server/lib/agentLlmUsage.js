import { db } from '../db.js';

export function usagePeriodKey(period = 'month', now = new Date()) {
  if (period === 'day') return now.toISOString().slice(0, 10);
  if (period === 'year') return now.toISOString().slice(0, 4);
  return now.toISOString().slice(0, 7);
}

export async function getAgentLlmUsage(definitionId, policy = {}) {
  const provider = policy.provider || 'anthropic';
  const model = policy.model || 'unknown';
  const periodKey = usagePeriodKey(policy.capPeriod);
  const row = await db.prepare(`SELECT input_tokens, output_tokens, request_count FROM agent_llm_usage WHERE definition_id=$1 AND provider=$2 AND model=$3 AND period_key=$4`).get(definitionId, provider, model, periodKey);
  const inputTokens = Number(row?.input_tokens || 0);
  const outputTokens = Number(row?.output_tokens || 0);
  const tokenCap = Number(policy.tokenCap || 0);
  return { provider, model, periodKey, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, requestCount: Number(row?.request_count || 0), tokenCap, remainingTokens: tokenCap > 0 ? Math.max(0, tokenCap - inputTokens - outputTokens) : null };
}

export async function assertAgentLlmBudget(definitionId, policy = {}) {
  if (policy.mode === 'none') return getAgentLlmUsage(definitionId, policy);
  const usage = await getAgentLlmUsage(definitionId, policy);
  const reservedOutput = Number(policy.maxOutputTokensPerResponse || 4096);
  if (usage.tokenCap > 0 && usage.totalTokens + reservedOutput > usage.tokenCap) {
    const error = new Error(`Agent LLM token cap reached for ${usage.periodKey}`);
    error.code = 'AGENT_LLM_CAP_REACHED'; error.usage = usage; throw error;
  }
  return usage;
}

export async function recordAgentLlmUsage(definitionId, policy = {}, usage = {}) {
  const provider = policy.provider || 'anthropic';
  const model = policy.model || 'unknown';
  const periodKey = usagePeriodKey(policy.capPeriod);
  await db.prepare(`
    INSERT INTO agent_llm_usage (definition_id,provider,model,period_key,input_tokens,output_tokens,request_count,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,1,$7)
    ON CONFLICT (definition_id,provider,model,period_key) DO UPDATE SET
      input_tokens=agent_llm_usage.input_tokens + excluded.input_tokens,
      output_tokens=agent_llm_usage.output_tokens + excluded.output_tokens,
      request_count=agent_llm_usage.request_count + 1,
      updated_at=excluded.updated_at
  `).run(definitionId, provider, model, periodKey, Number(usage.input_tokens || 0), Number(usage.output_tokens || 0), Date.now());
}
