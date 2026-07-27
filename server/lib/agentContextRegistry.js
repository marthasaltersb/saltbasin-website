export const AGENT_CONTEXT_POLICIES = Object.freeze({
  bestystaff_lead_intake_v1: Object.freeze({
    policyId: 'bestystaff-lead-intake-v1',
    agentId: 'bestystaff',
    contextDomain: 'lead_intake',
    freshnessThresholdMs: 20_000,
    invalidationRules: Object.freeze([
      Object.freeze({ eventType: 'portfolio_request.submitted', action: 'invalidate_cache_entry' }),
    ]),
    sourceIds: Object.freeze(['leads', 'portfolio_requests']),
    cacheKeyStrategies: Object.freeze({
      leadMemory: 'lead-memory:{id}',
      actorCookie: 'actor:{actorKey}',
    }),
  }),
});

export function resolveAgentContextPolicy(policyKey) {
  return AGENT_CONTEXT_POLICIES[policyKey] || null;
}

export function renderContextCacheKey(policy, strategy, values) {
  const template = policy?.cacheKeyStrategies?.[strategy];
  if (!template) return null;
  return Object.entries(values).reduce((result, [key, value]) => result.replace(`{${key}}`, String(value)), template);
}
