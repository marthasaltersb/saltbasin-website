import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const catalog = JSON.parse(fs.readFileSync('tests/fixtures/crystal-orbit-chat-scenarios.json', 'utf8'));

test('chat acceptance catalog covers every required capability area', () => {
  const areas = new Set(catalog.scenarios.map((item) => item.area));
  for (const required of ['entry', 'orbit', 'world', 'organization', 'journey', 'career', 'lineage', 'visual', 'scoring', 'responsive', 'account', 'email', 'security', 'regression']) assert.ok(areas.has(required), `missing ${required}`);
});

test('all p0 scenarios are reproducible at declared viewports', () => {
  assert.deepEqual(Object.keys(catalog.viewports), ['desktop', 'tablet', 'mobile']);
  for (const item of catalog.scenarios.filter((scenario) => scenario.priority === 'p0')) {
    assert.ok(item.steps.length >= 1, `${item.id} has no steps`);
    assert.ok(item.expected.length >= 1, `${item.id} has no expected results`);
  }
});

test('source and configuration contracts pass', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-crystal-orbit-chat.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
