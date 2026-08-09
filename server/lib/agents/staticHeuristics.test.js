import { describe, test, expect } from '@jest/globals';
import { detectTestGaps, detectHardcodedCandidates, pickTestCandidates } from './staticHeuristics.js';

describe('detectTestGaps', () => {
  test('flags files with no sibling test, skips files that have one', () => {
    const excerpts = [
      { path: 'server/lib/a.js', content: '', hasTest: false },
      { path: 'server/lib/b.js', content: '', hasTest: true },
    ];
    const gaps = detectTestGaps(excerpts);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].filePath).toBe('server/lib/a.js');
  });
});

describe('detectHardcodedCandidates', () => {
  test('flags an inline hex color', () => {
    const excerpts = [{ path: 'src/components/Widget.jsx', content: `const style = { color: '#C4843A' };`, hasTest: true }];
    const candidates = detectHardcodedCandidates(excerpts);
    expect(candidates.some((c) => c.pattern === 'inline-hex-color')).toBe(true);
  });

  test('flags a magic timing constant', () => {
    const excerpts = [{ path: 'server/lib/presence.js', content: `const PRESENCE_TTL_MS = 45_000;`, hasTest: true }];
    const candidates = detectHardcodedCandidates(excerpts);
    expect(candidates.some((c) => c.pattern === 'magic-timing-constant' && c.snippet.includes('PRESENCE_TTL_MS'))).toBe(true);
  });

  test('flags a domain-vocabulary literal array', () => {
    const excerpts = [{ path: 'server/lib/policy.js', content: `const AGENT_CONTEXT_POLICIES = ['a', 'b'];`, hasTest: true }];
    const candidates = detectHardcodedCandidates(excerpts);
    expect(candidates.some((c) => c.pattern === 'domain-vocabulary-literal')).toBe(true);
  });

  test('flags a long switch/case chain', () => {
    const content = `switch (kind) { case 'a': break; case 'b': break; case 'c': break; case 'd': break; }`;
    const excerpts = [{ path: 'server/lib/dispatch.js', content, hasTest: true }];
    const candidates = detectHardcodedCandidates(excerpts);
    expect(candidates.some((c) => c.pattern === 'switch-chain-on-literal')).toBe(true);
  });

  test('does not flag anything under a config/ or data/ directory', () => {
    const excerpts = [
      { path: 'src/config/visual/visualSemanticRegistry.js', content: `const PRESENCE_TTL_MS = 45_000; const c = '#ffffff';`, hasTest: true },
      { path: 'src/data/capabilityTags.js', content: `const PRESENCE_TTL_MS = 45_000;`, hasTest: true },
    ];
    expect(detectHardcodedCandidates(excerpts)).toHaveLength(0);
  });

  test('DOES flag a *Registry.js file outside config/data — filename alone is not an exemption', () => {
    // Regression: server/lib/agentContextRegistry.js was wrongly exempted by
    // an earlier "anything named *Registry.js" pattern, even though it's
    // exactly the kind of under-configured registry this agent should catch
    // (confirmed by the AI pass flagging it in the same live run).
    const excerpts = [{ path: 'server/lib/agentContextRegistry.js', content: `const AGENT_CONTEXT_POLICIES = ['a'];`, hasTest: true }];
    const candidates = detectHardcodedCandidates(excerpts);
    expect(candidates.some((c) => c.pattern === 'domain-vocabulary-literal')).toBe(true);
  });

  test('a clean file with none of the patterns produces no candidates', () => {
    const excerpts = [{ path: 'server/lib/clean.js', content: `export function add(a, b) { return a + b; }`, hasTest: true }];
    expect(detectHardcodedCandidates(excerpts)).toHaveLength(0);
  });
});

describe('pickTestCandidates', () => {
  test('only considers files with no test', () => {
    const excerpts = [
      { path: 'a.js', content: 'export function f() {}', hasTest: true },
      { path: 'b.js', content: 'export function g() {}', hasTest: false },
    ];
    const picked = pickTestCandidates(excerpts);
    expect(picked.map((f) => f.path)).toEqual(['b.js']);
  });

  test('ranks files with more exports higher and respects max', () => {
    const excerpts = [
      { path: 'one-export.js', content: 'export function f() {}', hasTest: false },
      { path: 'three-exports.js', content: 'export function f() {} export function g() {} export const h = () => {};', hasTest: false },
      { path: 'two-exports.js', content: 'export function f() {} export function g() {}', hasTest: false },
    ];
    const picked = pickTestCandidates(excerpts, { max: 2 });
    expect(picked.map((f) => f.path)).toEqual(['three-exports.js', 'two-exports.js']);
  });

  test('skips files with no exported functions at all', () => {
    const excerpts = [{ path: 'constants.js', content: 'const X = 1;', hasTest: false }];
    expect(pickTestCandidates(excerpts)).toHaveLength(0);
  });
});
