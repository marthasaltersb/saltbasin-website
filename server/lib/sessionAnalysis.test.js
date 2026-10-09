import { describe, test, expect } from '@jest/globals';
import { analyzeLines, combineAgents, cacheHitRatio } from './sessionAnalysis.js';
import { proposeMappings } from './sessionMappingRules.js';
import { DEFAULT_RULES, priceSession, validateRules } from './sessionMappingConfig.js';

const line = (o) => JSON.stringify(o);
const asst = (id, ts, u, extra = {}) => line({ type: 'assistant', timestamp: ts, message: { id, model: 'claude-sonnet-demo', usage: { input_tokens: u[0], cache_creation_input_tokens: u[1], cache_read_input_tokens: u[2], output_tokens: u[3] } }, ...extra });

describe('analyzeLines', () => {
  const lines = [
    asst('m1', '2030-03-01T10:00:00.000Z', [10, 1000, 0, 100]),
    asst('m1', '2030-03-01T10:00:00.000Z', [10, 1000, 0, 100]), // same message id: counted once
    asst('m2', '2030-03-01T10:02:00.000Z', [10, 0, 1000, 200]),
    line({ type: 'system', subtype: 'compact_boundary', timestamp: '2030-03-01T10:05:00.000Z', compactMetadata: { trigger: 'auto', preTokens: 150000, postTokens: 20000 } }),
    line({ type: 'assistant', timestamp: '2030-03-01T10:07:00.000Z', isApiErrorMessage: true, apiErrorStatus: 429, message: { id: 'e1', model: '<synthetic>', content: [{ type: 'text', text: 'x' }] } }),
    asst('m3', '2030-03-01T10:30:00.000Z', [10, 0, 1000, 300]),
    'not json',
  ];
  const a = analyzeLines(lines);

  test('counts usage once per message id', () => {
    expect(a.messages).toBe(3);
    expect(a.tokens).toEqual({ input: 30, cacheWrite: 1000, cacheRead: 2000, output: 600 });
  });
  test('records compactions and rate limits as limit events, and unreadable lines', () => {
    expect(a.limitEvents.map((e) => e.kind)).toEqual(['compaction', 'rate_limit']);
    expect(a.limitEvents[0].preTokens).toBe(150000);
    expect(a.badLines).toBe(1);
  });
  test('caps idle gaps in active time', () => {
    // 2 + 3 + 2 minutes of work, then a 23 minute idle gap capped at 10
    expect(a.activeMinutes).toBe(17);
  });
  test('never carries message text', () => {
    expect(JSON.stringify(a)).not.toContain('"text"');
  });
});

describe('cache ratio, price table and mapping rules', () => {
  test('cacheHitRatio is null when nothing was read', () => {
    expect(cacheHitRatio({ input: 0, cacheWrite: 0, cacheRead: 0 })).toBeNull();
    expect(cacheHitRatio({ input: 10, cacheWrite: 0, cacheRead: 90 })).toBeCloseTo(0.9);
  });
  test('a model without a price row is not priced, never zero', () => {
    const s = priceSession(DEFAULT_RULES, { 'claude-sonnet-x': { input: 1000000, cacheWrite: 0, cacheRead: 0, output: 0 }, 'mystery-1': { input: 5, cacheWrite: 0, cacheRead: 0, output: 5 } });
    expect(s.total).toBeCloseTo(3);
    expect(s.unpriced).toEqual(['mystery-1']);
  });
  test('rules validation rejects a blank model prefix', () => {
    const { errors } = validateRules({ prices: [{ match: '', input: 1, cacheWrite: 1, cacheRead: 1, output: 1 }] });
    expect(errors.join(' ')).toContain('prices row 1: model prefix is required');
  });
  test('proposes cache, context, memory and prompt mappings from metrics', () => {
    const main = analyzeLines([
      asst('a', '2030-03-01T10:00:00.000Z', [10, 1000, 0, 100]),
      asst('b', '2030-03-01T10:01:00.000Z', [10, 0, 1000, 100]),
      asst('c', '2030-03-01T10:02:00.000Z', [10, 0, 1000, 100]),
      asst('d', '2030-03-01T10:03:00.000Z', [10, 0, 1000, 100]),
      asst('e', '2030-03-01T10:04:00.000Z', [10, 1000, 0, 100]),
      line({ type: 'system', subtype: 'compact_boundary', timestamp: '2030-03-01T10:05:00.000Z', compactMetadata: { trigger: 'auto', preTokens: 9 } }),
      line({ type: 'assistant', timestamp: '2030-03-01T10:06:00.000Z', isApiErrorMessage: true, apiErrorStatus: 429, message: { id: 'x', content: 'rate' } }),
    ]);
    const rec = combineAgents('claude_code:t', [main]);
    const keys = proposeMappings(rec, DEFAULT_RULES).map((p) => p.ruleKey);
    expect(keys).toEqual(expect.arrayContaining(['cache.low_hit_ratio', 'context.compaction', 'memory.compaction_loss', 'prompt.limit_event']));
  });
});
