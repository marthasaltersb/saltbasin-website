import test from 'node:test';
import assert from 'node:assert/strict';
import { auditCrystalRegistries, auditExperientialContracts, auditSceneInstrumentation, run } from './crystalWorldAuditAgent.js';

test('canonical Crystal World registries pass deterministic validation', () => {
  assert.deepEqual(auditCrystalRegistries(), []);
});

test('primary scenes participate in runtime lineage collection', async () => {
  assert.deepEqual(await auditSceneInstrumentation(), []);
});

test('experiential audit does not confuse valid lineage with usable 3D navigation', async () => {
  const findings = await auditExperientialContracts();
  assert.ok(findings.length > 0);
  assert.ok(findings.every((item) => item.category === '3d-accessibility'));
});

test('audit records zero LLM calls', async () => {
  const result = await run();
  assert.equal(result.stats.llmCalls, 0);
});
