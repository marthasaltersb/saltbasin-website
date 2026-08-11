import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreUxFindings } from './uxRuntimeAudit.js';

test('experiential score reflects severity instead of registry validity', () => {
  assert.equal(scoreUxFindings([{ severity: 'high' }, { severity: 'medium' }, { severity: 'low' }]), 83);
});

test('repeated instances of one rule do not erase the entire score', () => {
  assert.equal(scoreUxFindings(Array.from({ length: 20 }, () => ({ ruleId: 'same-rule', severity: 'high' }))), 75);
});
