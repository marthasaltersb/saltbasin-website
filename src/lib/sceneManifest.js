// Runtime lineage contract for governed Three.js worlds. The manifest is
// metadata-only: attaching it never changes geometry, material, layout, or
// interaction behavior.
const REQUIRED_SOURCE_FIELDS = Object.freeze(['type', 'id']);
const REQUIRED_RULE_FIELDS = Object.freeze(['geometryId', 'materialId', 'colorRule']);

function clean(value) {
  return value === undefined ? null : value;
}

export function normalizeSceneManifest(entry = {}) {
  return Object.freeze({
    instanceId: clean(entry.instanceId),
    semanticId: clean(entry.semanticId),
    variantId: clean(entry.variantId),
    decorative: entry.decorative === true,
    source: Object.freeze({
      type: clean(entry.source?.type), id: clean(entry.source?.id), field: clean(entry.source?.field),
      endpoint: clean(entry.source?.endpoint), configEnvelope: clean(entry.source?.configEnvelope),
    }),
    visualRules: Object.freeze({
      geometryId: clean(entry.visualRules?.geometryId), materialId: clean(entry.visualRules?.materialId),
      colorRule: clean(entry.visualRules?.colorRule), outlineRule: clean(entry.visualRules?.outlineRule),
      lightingRule: clean(entry.visualRules?.lightingRule), opacityRule: clean(entry.visualRules?.opacityRule),
    }),
    scene: Object.freeze({
      component: clean(entry.scene?.component), builder: clean(entry.scene?.builder), parent: clean(entry.scene?.parent),
    }),
    interaction: Object.freeze({
      events: Object.freeze([...(entry.interaction?.events || [])]), stateTarget: clean(entry.interaction?.stateTarget),
    }),
  });
}

export function validateSceneManifest(entry) {
  const manifest = normalizeSceneManifest(entry);
  const errors = [];
  if (!manifest.instanceId) errors.push('missing instanceId');
  if (!manifest.scene.component) errors.push('missing scene.component');
  if (!manifest.scene.builder) errors.push('missing scene.builder');
  if (!manifest.decorative) {
    if (!manifest.semanticId) errors.push('missing semanticId');
    for (const field of REQUIRED_SOURCE_FIELDS) if (!manifest.source[field]) errors.push(`missing source.${field}`);
    for (const field of REQUIRED_RULE_FIELDS) if (!manifest.visualRules[field]) errors.push(`missing visualRules.${field}`);
  }
  return errors;
}

export function attachSceneManifest(object3d, entry) {
  if (!object3d?.userData) throw new Error('A Three.js Object3D with userData is required');
  const manifest = normalizeSceneManifest(entry);
  object3d.userData.sceneManifest = manifest;
  return object3d;
}

export function attachSceneManifestTree(object3d, entry) {
  const manifest = normalizeSceneManifest(entry);
  object3d?.traverse?.((child) => {
    if (child.isMesh || child.isLine || child.isPoints || child.isSprite) child.userData.sceneManifest = manifest;
  });
  return object3d;
}

export function collectSceneManifest(scene) {
  const entries = [];
  scene?.traverse?.((object) => {
    if (object.userData?.sceneManifest) entries.push({ uuid: object.uuid, ...object.userData.sceneManifest });
  });
  return entries;
}

export function auditSceneManifest(scene) {
  const findings = [];
  scene?.traverse?.((object) => {
    const isRenderable = !!(object.isMesh || object.isLine || object.isPoints || object.isSprite);
    const manifest = object.userData?.sceneManifest;
    if (isRenderable && !manifest) {
      findings.push({ code: 'unregistered-renderable', uuid: object.uuid, name: object.name || object.type });
      return;
    }
    for (const detail of manifest ? validateSceneManifest(manifest) : []) {
      findings.push({ code: 'invalid-manifest', uuid: object.uuid, instanceId: manifest.instanceId, detail });
    }
  });
  return findings;
}

export function publishSceneManifest(sceneId, scene) {
  if (typeof window === 'undefined') return;
  window.__SB_SCENE_MANIFESTS__ ||= {};
  window.__SB_SCENE_MANIFESTS__[sceneId] = {
    capturedAt: Date.now(), entries: collectSceneManifest(scene), findings: auditSceneManifest(scene),
  };
}

export function removePublishedSceneManifest(sceneId) {
  if (typeof window !== 'undefined' && window.__SB_SCENE_MANIFESTS__) delete window.__SB_SCENE_MANIFESTS__[sceneId];
}
