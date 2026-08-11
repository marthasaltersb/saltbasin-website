// Deterministic Crystal World audit. This agent never calls an LLM: it
// validates the canonical registries and checks that the primary scene
// builders participate in the runtime lineage-manifest contract.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORLD_VARIANT_REGISTRY, validateSemanticInvariantCoverage, validateWorldVariantRegistry } from '../../../src/config/visual/worldVariantRegistry.js';
import { WORLD_VARIANT_ENCODING_PROFILES, validateAllVisualEncodingProfiles } from '../../../src/config/visual/worldVariantEncodingProfiles.js';
import { WORLD_VARIANT_COMPONENT_PROFILES, validateAllWorldVariantComponentProfiles } from '../../../src/config/visual/worldVariantComponentProfiles.js';
import { GEOMETRY_REGISTRY, VISUAL_SEMANTIC_REGISTRY } from '../../../src/config/visual/visualSemanticRegistry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SCENE_FILES = ['src/components/WorldShell.jsx', 'src/components/SpatialJourneyWorld.jsx', 'src/components/SaltBasinCrystal.jsx'];

function finding(category, title, detail, filePath = null, severity = 'high') {
  return { category, severity, title, detail, filePath };
}

export function auditCrystalRegistries() {
  const findings = [];
  const validators = [
    ['variant-registry', validateWorldVariantRegistry],
    ['semantic-invariants', validateSemanticInvariantCoverage],
    ['encoding-profile', validateAllVisualEncodingProfiles],
    ['component-profile', validateAllWorldVariantComponentProfiles],
  ];
  for (const [category, validate] of validators) {
    for (const detail of validate()) findings.push(finding(category, 'Crystal registry validation failed', detail));
  }

  for (const [key, variant] of Object.entries(WORLD_VARIANT_REGISTRY)) {
    if (!WORLD_VARIANT_ENCODING_PROFILES[key]) findings.push(finding('lineage', `${key} has no encoding profile`, variant.variantId));
    if (!WORLD_VARIANT_COMPONENT_PROFILES[key]) findings.push(finding('lineage', `${key} has no component profile`, variant.variantId));
  }
  for (const [semanticId, semantic] of Object.entries(VISUAL_SEMANTIC_REGISTRY)) {
    if (!GEOMETRY_REGISTRY[semantic.geometryId]) {
      findings.push(finding('visual-semantics', `${semanticId} references unknown geometry`, semantic.geometryId, 'src/config/visual/visualSemanticRegistry.js'));
    }
    for (const field of ['materialId', 'colorRule', 'outlineRule', 'lightingRule', 'opacityRule', 'meaning']) {
      if (!semantic[field]) findings.push(finding('visual-semantics', `${semanticId} is missing ${field}`, 'Every governed semantic needs a complete visual rule chain.', 'src/config/visual/visualSemanticRegistry.js'));
    }
  }
  return findings;
}

export async function auditSceneInstrumentation() {
  const findings = [];
  for (const filePath of SCENE_FILES) {
    const content = await fs.readFile(path.join(ROOT, filePath), 'utf8');
    const sceneAdds = (content.match(/scene\.add\s*\(/g) || []).length;
    const attachments = (content.match(/attachSceneManifest(?:Tree)?\s*\(/g) || []).length;
    if (!content.includes('sceneManifest')) {
      findings.push(finding('runtime-lineage', 'Scene has no runtime manifest instrumentation', `${sceneAdds} scene.add call(s) cannot be traced at runtime.`, filePath));
    } else if (sceneAdds > 0 && attachments === 0) {
      findings.push(finding('runtime-lineage', 'Scene imports lineage support but registers no objects', `${sceneAdds} scene.add call(s) and no attachSceneManifest calls.`, filePath));
    }
  }
  return findings;
}

export async function auditExperientialContracts() {
  const findings = [];
  for (const filePath of SCENE_FILES) {
    const content = await fs.readFile(path.join(ROOT, filePath), 'utf8');
    if (content.includes('<canvas') && !content.includes('data-ux-3d-alternative') && !content.includes('data-ux-3d-role="decorative"')) {
      findings.push(finding(
        '3d-accessibility',
        '3D scene has no declared non-visual interaction contract',
        'Declare a keyboard/non-visual equivalent with data-ux-3d-alternative, or explicitly classify a non-interactive canvas as decorative.',
        filePath,
      ));
    }
  }
  return findings;
}

export async function run() {
  const registryFindings = auditCrystalRegistries();
  const instrumentationFindings = await auditSceneInstrumentation();
  const experientialFindings = await auditExperientialContracts();
  const findings = [...registryFindings, ...instrumentationFindings, ...experientialFindings];
  return {
    summary: findings.length
      ? `Crystal World audit found ${findings.length} governance or experiential issue(s). No LLM was called.`
      : 'Crystal World governance and experiential audit passed. No LLM was called.',
    stats: {
      variants: Object.keys(WORLD_VARIANT_REGISTRY).length,
      visualSemantics: Object.keys(VISUAL_SEMANTIC_REGISTRY).length,
      sceneFilesChecked: SCENE_FILES.length,
      experientialContractsChecked: SCENE_FILES.length,
      findings: findings.length,
      llmCalls: 0,
    },
    findings,
  };
}
