import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrRefresh } from '../server/lib/contextCache.js';
import { renderContextCacheKey, resolveAgentContextPolicy } from '../server/lib/agentContextRegistry.js';

test('BestyStaff cache behavior resolves from a registered policy', () => {
  const policy = resolveAgentContextPolicy('bestystaff_lead_intake_v1');
  assert.equal(policy.agentId, 'bestystaff');
  assert.equal(renderContextCacheKey(policy, 'leadMemory', { id: 42 }), 'lead-memory:42');
  assert.deepEqual(policy.sourceIds, ['leads', 'portfolio_requests']);
});

test('context cache refuses an implicit freshness policy', async () => {
  await assert.rejects(() => getOrRefresh({ cacheId: 'x', agentId: 'a', contextDomain: 'd', loader: async () => ({ value: null }) }), /configured positive freshness/);
});
