import test from 'node:test';
import assert from 'node:assert/strict';
import { attachSceneManifest, auditSceneManifest, collectSceneManifest, validateSceneManifest } from './sceneManifest.js';

function object({ mesh = false } = {}) {
  return { uuid: crypto.randomUUID(), type: mesh ? 'Mesh' : 'Group', isMesh: mesh, userData: {}, children: [] };
}
function scene(children) {
  return { traverse(fn) { const walk = (o) => { fn(o); o.children.forEach(walk); }; children.forEach(walk); } };
}

const governed = {
  instanceId: 'atom:1', semanticId: 'evidence_atom', source: { type: 'atom', id: '1' },
  visualRules: { geometryId: 'atom_crystal', materialId: 'crystalline-metal', colorRule: 'global-path-color' },
  scene: { component: 'TestWorld', builder: 'buildAtom' }, interaction: { events: ['SELECT'], stateTarget: 'activeAtom' },
};

test('attaches and collects a governed scene entry', () => {
  const mesh = object({ mesh: true });
  attachSceneManifest(mesh, governed);
  assert.equal(validateSceneManifest(mesh.userData.sceneManifest).length, 0);
  assert.equal(collectSceneManifest(scene([mesh]))[0].instanceId, 'atom:1');
});

test('reports renderables without lineage', () => {
  const findings = auditSceneManifest(scene([object({ mesh: true })]));
  assert.equal(findings[0].code, 'unregistered-renderable');
});

test('allows explicitly decorative renderables', () => {
  const mesh = object({ mesh: true });
  attachSceneManifest(mesh, { instanceId: 'background:1', decorative: true, scene: { component: 'TestWorld', builder: 'background' } });
  assert.deepEqual(auditSceneManifest(scene([mesh])), []);
});
