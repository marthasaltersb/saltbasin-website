// Definition Studio — pure checks (no DATABASE_URL needed). Run: npm run test:definition-studio
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  defaultStudioConfig, studioConfigProblems, assertValidStudioConfig, nextStudioId, toApiName, namedItems, GEOMETRIES,
} from '../server/lib/definitionStudioConfig.js';
import { kindForKey, moduleWorkspaces } from '../server/lib/definitionStudio.js';

const clone = (x) => structuredClone(x);

test('defaults are valid and every named item has a name, an L-number id and an API name', () => {
  const cfg = defaultStudioConfig();
  assert.deepEqual(studioConfigProblems(cfg), []);
  for (const [, item] of namedItems(cfg)) {
    assert.match(item.id, /-L\d/, `${item.id} carries an L-number`);
    assert.match(item.apiName, /^[a-z][a-z0-9_]*$/);
    assert.ok(item.name.trim());
  }
});

test('defaults reproduce the prototype: 7 shapes, 6 field sections, 3 levels', () => {
  const cfg = defaultStudioConfig();
  assert.equal(cfg.shapes.length, 7);
  assert.deepEqual(cfg.shapes.map((s) => s.geometry), GEOMETRIES);
  assert.equal(cfg.fieldSections.length, 6);
  assert.deepEqual(cfg.levels.map((l) => l.id), ['FLOW-L1', 'FLOW-L2', 'FLOW-L3']);
  // Field storage keys stay the prototype's, so flows saved before the port still open.
  const keys = cfg.fieldSections.flatMap((s) => s.fields.map((f) => f.key));
  for (const k of ['hierarchy', 'decisionParams', 'relTriggers', 'archMapping', 'leakageScenario', 'businessOutcome']) assert.ok(keys.includes(k), k);
});

test('a renamed item saves; a removed item does not (switch it off instead)', () => {
  const prev = defaultStudioConfig();
  const renamed = clone(prev); renamed.shapes[0].name = 'Task';
  assert.deepEqual(studioConfigProblems(renamed, prev), []);
  const removed = clone(prev); removed.shapes.splice(1, 1);
  assert.match(studioConfigProblems(removed, prev).join(' '), /can't be removed — switch it off/);
  const off = clone(prev); off.shapes[1].enabled = false;
  assert.deepEqual(studioConfigProblems(off, prev), []);
});

test('API names and field storage keys are fixed once issued', () => {
  const prev = defaultStudioConfig();
  const a = clone(prev); a.shapes[0].apiName = 'task';
  assert.match(studioConfigProblems(a, prev).join(' '), /API name .* is fixed/);
  const b = clone(prev); b.fieldSections[0].fields[0].key = 'parentPath';
  assert.match(studioConfigProblems(b, prev).join(' '), /storage key .* is fixed/);
});

test('duplicate ids and duplicate API names in a list are rejected', () => {
  const cfg = defaultStudioConfig();
  const dupId = clone(cfg); dupId.shapes.push({ ...dupId.shapes[0], apiName: 'other' });
  assert.match(studioConfigProblems(dupId).join(' '), /used twice/);
  const dupApi = clone(cfg); dupApi.shapes.push({ ...dupApi.shapes[0], id: 'FLOW-L2-SHAPE-099' });
  assert.match(studioConfigProblems(dupApi).join(' '), /API name "step" is used twice/);
});

test('a new shape with a known geometry is accepted; an unknown geometry is not', () => {
  const prev = defaultStudioConfig();
  const next = clone(prev);
  const id = nextStudioId(next, 'FLOW-L2', 'SHAPE');
  assert.equal(id, 'FLOW-L2-SHAPE-008');
  next.shapes.push({ id, levelId: 'FLOW-L2', apiName: 'hand_off', name: 'Hand-off', geometry: 'step', defaultLabel: 'Hand-off', color: '#C4843A', hint: '', enabled: true });
  assert.deepEqual(studioConfigProblems(next, prev), []);
  next.shapes[7].geometry = 'hexagon';
  assert.match(studioConfigProblems(next, prev).join(' '), /must use one of these geometries/);
});

test('levels can be renamed but not added; at least one shape must stay on', () => {
  const cfg = defaultStudioConfig();
  const extra = clone(cfg); extra.levels.push({ id: 'FLOW-L4', hierarchy: 'FLOW', level: 4, apiName: 'variant', name: 'Variant' });
  assert.match(studioConfigProblems(extra).join(' '), /exactly three levels/);
  const none = clone(cfg); none.shapes.forEach((s) => { s.enabled = false; });
  assert.match(studioConfigProblems(none).join(' '), /at least one shape/);
});

test('assertValidStudioConfig throws a plain-words 400 with the full list', () => {
  const bad = defaultStudioConfig(); bad.shapes[0].name = '';
  assert.throws(() => assertValidStudioConfig(bad), (e) => e.status === 400 && /weren't saved/.test(e.message) && Array.isArray(e.details));
});

test('toApiName makes snake_case machine names', () => {
  assert.equal(toApiName('Hand-off review'), 'hand_off_review');
  assert.equal(toApiName('Portfolio Company Onboarding'), 'portfolio_company_onboarding');
  assert.match(toApiName('360 view'), /^item_360_view$/);
});

test('document kinds follow the canvas storage keys', () => {
  assert.equal(kindForKey('flow:default'), 'working_flow');
  assert.equal(kindForKey('templates:index'), 'template_index');
  assert.equal(kindForKey('template:custom:onboarding-1'), 'template');
  assert.equal(kindForKey('classificationtypes'), 'vocabulary');
  assert.equal(kindForKey('clients'), 'client_instances');
});

test('every Salt Basin module gets a workspace, including the Career module', () => {
  const ws = moduleWorkspaces();
  assert.ok(ws.some((w) => w.workspaceKey === 'module:resume_career'));
  assert.ok(ws.every((w) => w.kind === 'module' && w.apiName && w.name));
});

test('the canvas page parses, keeps the boot marker, and never calls Anthropic from the browser inside the platform', () => {
  const html = fs.readFileSync(new URL('../prototypes/definition-studio/definition-studio.html', import.meta.url), 'utf8');
  assert.ok(html.includes('<!--STUDIO_BOOT-->'));
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.ok(inline.length >= 2);
  inline.forEach((code, i) => assert.doesNotThrow(() => new vm.Script(code, { filename: `inline-${i}` })));
  // Both drafting calls route to the platform when the Studio boot data is present.
  const direct = html.match(/fetch\('https:\/\/api\.anthropic\.com/g) || [];
  assert.equal(direct.length, 0);
  assert.equal((html.match(/window\.STUDIO\.api \+ '\/agent-draft'/g) || []).length, 2);
  // Storage is bridged to the platform, not kept in this browser.
  assert.match(html, /window\.storage = \{/);
});
