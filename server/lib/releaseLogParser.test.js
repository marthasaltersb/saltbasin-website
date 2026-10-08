import { describe, test, expect } from '@jest/globals';
import { parseDocument, inferRunState, parseTraces, parseVersionLine, parseTrackerSnapshot, classifyPath, dispositionFromStatus } from './releaseLogParser.js';
import { DEFAULT_RULES } from './releaseIntelligenceConfig.js';

const L = DEFAULT_RULES.logLocations;

const RELEASE_LOG = `# Release log — Garden Gate
Release: 2030-01-05-garden-gate
Date: 2030-01-05

## Features
| Feature | Result | Rounds | Change spec version | Training spec version |
| --- | --- | --- | --- | --- |
| seed-catalog | passed | 2 | 1 | 1 |
| water-planner | not passed | 1 | | |

## Validation rounds
| Feature | Round | Commit | Steps passed | Steps total | Result |
| --- | --- | --- | --- | --- | --- |
| seed-catalog | 1 | abc1234 | 8 | 10 | FAIL |
| seed-catalog | 2 | def5678 | 10 | 10 | PASS |

## Fixes
| Feature | Round | Bug | Summary | Files |
| --- | --- | --- | --- | --- |
| seed-catalog | 1 | B-1 | Label was cut off | src/a.jsx, src/b.jsx |

## Failed runs
| Feature | Kind | Label | State | Class | What failed | State left | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| water-planner | agent_run | validate:water-planner:r1 | failed | environment | Browser would not start | nothing written | Unresolved |
| seed-catalog | command | npm run build | refused | process | Build command rejected by the user | no build output | Resolved |
`;

describe('classifyPath', () => {
  test('recognises each log location', () => {
    expect(classifyPath('docs/test-results/seed-catalog/round-2.md', L)).toEqual({ kind: 'test_result', featureKey: 'seed-catalog', roundNo: 2 });
    expect(classifyPath('docs/triage/seed-catalog-round-1.md', L)).toEqual({ kind: 'triage', featureKey: 'seed-catalog', roundNo: 1 });
    expect(classifyPath('docs/triage/seed-catalog-fix-r2-reconciliation.md', L).kind).toBe('reconciliation');
    expect(classifyPath('docs/changes/seed-catalog.md', L).featureKey).toBe('seed-catalog');
    expect(classifyPath('docs/changes/README.md', L)).toBeNull();
    expect(classifyPath('src/app.js', L)).toBeNull();
  });
});

describe('release log', () => {
  const parsed = parseDocument('docs/release-log/2030-01-05-garden-gate.md', RELEASE_LOG, L);
  test('reads header, features, rounds, fixes and failed runs', () => {
    expect(parsed.releaseKey).toBe('2030-01-05-garden-gate');
    expect(parsed.date).toBe('2030-01-05');
    expect(parsed.features.map((f) => [f.featureKey, f.finalStatus, f.declaredRounds, f.declaredChangeSpecVersion])).toEqual([
      ['seed-catalog', 'passed', 2, '1'], ['water-planner', 'not passed', 1, null],
    ]);
    expect(parsed.rounds).toHaveLength(2);
    expect(parsed.rounds[1]).toMatchObject({ roundNo: 2, passed: true, stepsPassed: 10, stepsTotal: 10, commitSha: 'def5678' });
    expect(parsed.fixes[0]).toMatchObject({ bugId: 'B-1', files: ['src/a.jsx', 'src/b.jsx'] });
    expect(parsed.failedRuns).toHaveLength(2);
    expect(parsed.failedRuns[1]).toMatchObject({ stateText: 'refused', statusText: 'Resolved' });
    expect(parsed.warnings).toEqual([]);
  });
  test('warns instead of guessing when the release key and features are missing', () => {
    const p = parseDocument('docs/release-log/odd.md', '# Notes\n', L);
    expect(p.releaseKey).toBe('odd');
    expect(p.warnings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('test result', () => {
  const doc = `# Test result
Feature: seed-catalog
Round: 2
Commit tested: def5678
Date: 2030-01-04
Console errors: 0
Failed requests: 1

| Journey step | Result | Seen |
| --- | --- | --- |
| 1.1 | pass | ok |
| 1.2 | FAIL | wrong text |
| 1.3 | pass | ok |
`;
  test('counts steps from the table and derives the result', () => {
    const p = parseDocument('docs/test-results/seed-catalog/round-2.md', doc, L);
    expect(p.round).toMatchObject({ featureKey: 'seed-catalog', roundNo: 2, stepsPassed: 2, stepsTotal: 3, passed: false, failedRequests: 1, consoleErrors: 0, commitSha: 'def5678' });
  });
  test('falls back to the path for feature and round and warns without a result', () => {
    const p = parseDocument('docs/test-results/water-planner/round-1.md', '# Empty\n', L);
    expect(p.round).toMatchObject({ featureKey: 'water-planner', roundNo: 1, passed: null });
    expect(p.warnings.join(' ')).toMatch(/No result/);
  });
});

describe('triage and reconciliation', () => {
  test('reads a table of items', () => {
    const doc = '| id | journey step | observed vs expected | root cause | class | files | proposed fix | first seen round |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| T-1 | 1.2 | saw X expected Y | missing key | defect | src/x.js | add key | 1 |\n';
    const p = parseDocument('docs/triage/seed-catalog-round-1.md', doc, L);
    expect(p.items).toHaveLength(1);
    expect(p.items[0]).toMatchObject({ id: 'T-1', classText: 'defect', firstSeen: 1 });
  });
  test('reads section-style items', () => {
    const doc = '### T-2\n- **Class:** spec_error\n- **Journey step:** 2.1\n- **Root cause:** typo\n';
    const p = parseDocument('docs/triage/seed-catalog-round-2.md', doc, L);
    expect(p.items[0]).toMatchObject({ id: 'T-2', classText: 'spec_error', rootCause: 'typo' });
  });
  test('reconciliation statuses map to dispositions', () => {
    expect(dispositionFromStatus('Resolved')).toBe('reconciled');
    expect(dispositionFromStatus('Unresolved')).toBe('open');
    expect(dispositionFromStatus('')).toBe('open');
    expect(dispositionFromStatus('Pending user go-ahead')).toBe('open');
  });
});

describe('specs', () => {
  const spec = `# Seed catalog change spec
Version 2 · 2030-01-03

## Traces to
- docs/changes/base-catalog.md (v1)
- docs/training/base-catalog.md version 3
- commit abc1234def

## What changed
Nothing.
`;
  test('version line and traces', () => {
    expect(parseVersionLine(spec)).toEqual({ version: '2', date: '2030-01-03' });
    expect(parseTraces(spec)).toEqual([
      { kind: 'spec', ref: 'docs/changes/base-catalog.md', version: '1' },
      { kind: 'spec', ref: 'docs/training/base-catalog.md', version: '3' },
      { kind: 'commit', ref: 'abc1234def', version: null },
    ]);
  });
  test('a spec without a version or traces section warns', () => {
    const p = parseDocument('docs/changes/x.md', '# X\n', L);
    expect(p.warnings.length).toBe(2);
  });
});

describe('tracker snapshot', () => {
  test('records tokens only when present; elapsed from timestamps', () => {
    const p = parseTrackerSnapshot({
      agents: [
        { label: 'build:f:r0', role: 'build', feature: 'f', status: 'done', tokens: { input: 5, cacheWrite: 10, cacheRead: 100, output: 50 }, startedAt: '2030-01-01T00:00:00Z', lastActivityAt: '2030-01-01T00:30:00Z', failures: ['x was refused'] },
        { label: 'validate:f:r1', role: 'validate', feature: 'f', round: 1, status: 'failed', tokens: { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 } },
      ],
      features: [{ key: 'f', status: 'failing', openBugs: 1, lastResult: { round: 1, passed: false, stepsPassed: 3, stepsTotal: 4 } }],
      bugs: [],
    });
    expect(p.agents[0].tokens.output).toBe(50);
    expect(p.agents[0].elapsedMinutes).toBe(30);
    expect(p.agents[1].tokens).toBeNull();
    expect(p.agents[1].elapsedMinutes).toBeNull();
    expect(p.features[0].lastResult.stepsTotal).toBe(4);
  });
  test('an agent that died at a usage limit is flagged, not silently counted as ordinary', () => {
    const p = parseTrackerSnapshot({ agents: [
      { label: 'build:f:r0', role: 'build', feature: 'f', status: 'failed', activity: "You've hit your usage limit" },
      { label: 'validate:f:r1', role: 'validate', feature: 'f', status: 'failed' },
    ] });
    expect(p.agents.map((a) => a.limitHit)).toEqual([true, false]);
  });
  test('inferRunState maps a usage limit to interrupted', () => {
    expect(inferRunState('agent stopped: usage limit reached', ['failed', 'interrupted'])).toBe('interrupted');
  });
  test('rejects a non-snapshot', () => {
    expect(parseTrackerSnapshot({}).warnings[0]).toMatch(/Not a tracker snapshot/);
  });
});
