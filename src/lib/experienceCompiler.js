import { getVisualEncodingProfile } from '../config/visual/worldVariantEncodingProfiles.js';
import { getWorldVariantComponentProfile } from '../config/visual/worldVariantComponentProfiles.js';
import { VISUAL_SEMANTIC_REGISTRY } from '../config/visual/visualSemanticRegistry.js';
import { validateExperienceManifest } from '../config/experience/experienceManifest.js';
import { resolveWorldComposition } from '../config/visual/worldCompositionRegistry.js';

// Navigation-context/active-lens resolution is centralized in resolveWorldComposition(). Its immutable
// stateReference is shared across journeys and views; compiling an experience must never imply that a
// world/variant pair owns a repeated version of business data.
export function compileExperience(manifest) {
  const diagnostics = validateExperienceManifest(manifest).map((detail) => ({ severity: 'error', detail }));
  const composition = resolveWorldComposition(manifest.world?.worldId, manifest.world?.variantKey);
  const { world, variant, errors: compositionErrors } = composition;
  if (!variant) diagnostics.push(...compositionErrors.map((detail) => ({ severity: 'error', detail })));
  const objects = (manifest.objects || []).map((object) => ({
    ...object,
    compiledVisual: VISUAL_SEMANTIC_REGISTRY[object.governance.semanticMappingId] || null,
  }));
  for (const object of objects) if (!object.compiledVisual && object.objectClass !== 'decorative') diagnostics.push({ severity: 'error', detail: `${object.experienceObjectId}: unresolved semantic mapping ${object.governance.semanticMappingId}` });
  return {
    manifest: { ...manifest, objects },
    runtime: { stateReference: composition.stateReference, world, variant, encodingProfile: getVisualEncodingProfile(manifest.world.variantKey), componentProfile: getWorldVariantComponentProfile(manifest.world.variantKey) },
    diagnostics,
    valid: !diagnostics.some((item) => item.severity === 'error'),
  };
}
