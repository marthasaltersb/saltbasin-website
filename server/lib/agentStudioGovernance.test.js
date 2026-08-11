import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_STUDIO_PROFILES, hydrateAgentStudioConfig, validateAgentStudioConfig } from './agentStudioGovernance.js';

test('hydrates canonical authority and iteration gates', () => {
  const config = hydrateAgentStudioConfig({ studioRole: 'coding', iteration: { requireApprovalOnScopeChange: true } });
  assert.deepEqual(config.iteration.gates, AGENT_STUDIO_PROFILES.coding.gates);
  assert.ok(config.authority.prohibited.includes('changing visual language'));
  assert.equal(config.iteration.requireApprovalOnScopeChange, true);
});

test('rejects self-expanded authority', () => {
  assert.deepEqual(
    validateAgentStudioConfig({ studioRole: 'ux', authority: { mayChange: ['database'] } }),
    ['authority.mayChange is code-owned and cannot be overridden'],
  );
});

test('accepts role configuration that does not redefine its boundary', () => {
  assert.deepEqual(validateAgentStudioConfig({ studioRole: 'engine', contextSources: ['api-routes'] }), []);
});
