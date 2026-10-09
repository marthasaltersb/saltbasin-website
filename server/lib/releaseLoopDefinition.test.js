import { describe, test, expect } from '@jest/globals';
import { loadDefaultDefinition, validateDefinition } from './releaseLoopDefinition.js';
import { buildReleaseLoopRoster } from './releaseLoopAgents.js';

describe('release loop definition', () => {
  test('the shipped definition passes its own validation', () => {
    expect(validateDefinition(loadDefaultDefinition())).toEqual([]);
  });

  test('refuses out-of-range limits and removed required statuses', () => {
    const d = loadDefaultDefinition();
    d.maxFixRounds = 0;
    d.bugEscalation.maxFixAttemptsPerBug = 9;
    d.bugEscalation.statuses = d.bugEscalation.statuses.filter((s) => s !== 'needs_human');
    const problems = validateDefinition(d).join(' | ');
    expect(problems).toMatch(/maxFixRounds/);
    expect(problems).toMatch(/maxFixAttemptsPerBug/);
    expect(problems).toMatch(/needs_human/);
  });

  test('refuses a stage that points at a missing stage or role', () => {
    const d = loadDefaultDefinition();
    d.stages = d.stages.map((s) => (s.key === 'build' ? { ...s, next: 'nowhere', role: 'ghost' } : s));
    const problems = validateDefinition(d).join(' | ');
    expect(problems).toMatch(/nowhere/);
    expect(problems).toMatch(/ghost/);
  });
});

describe('release loop roster', () => {
  test('has every definition role plus the reconciliation and scope agents, all in the release_loop pipeline', () => {
    const def = loadDefaultDefinition();
    const roster = buildReleaseLoopRoster(def);
    expect(roster.map((r) => r.key)).toEqual([...def.roles.map((r) => r.key), 'release_reconciler', 'release_scope_reviewer']);
    expect(new Set(roster.map((r) => r.pipeline))).toEqual(new Set(['release_loop']));
    expect(roster.every((r) => r.boundaries.length > 0 && r.capabilities.length > 0)).toBe(true);
  });
});
