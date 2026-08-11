import { validateGenomeSelection } from './experienceGenome.js';

export const EXPERIENCE_MANIFEST_VERSION = '1.0.0';

export function validateExperienceObject(object) {
  const errors = [];
  if (!object?.experienceObjectId) errors.push('missing experienceObjectId');
  if (object?.objectClass !== 'decorative' && !object?.semanticObjectRef?.id) errors.push(`${object?.experienceObjectId || 'object'}: missing semanticObjectRef.id`);
  if (!object?.visual?.geometryRef) errors.push(`${object?.experienceObjectId || 'object'}: missing visual.geometryRef`);
  if ((object?.interaction?.actionIds || []).length && !object?.interaction?.stateTarget) errors.push(`${object.experienceObjectId}: actions require interaction.stateTarget`);
  return errors;
}

export function validateExperienceManifest(manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== EXPERIENCE_MANIFEST_VERSION) errors.push('unsupported schemaVersion');
  if (!manifest?.experienceId) errors.push('missing experienceId');
  if (!manifest?.world?.worldId || !manifest?.world?.variantKey) errors.push('worldId and variantKey are required');
  errors.push(...validateGenomeSelection(manifest?.genome || {}));
  for (const object of manifest?.objects || []) errors.push(...validateExperienceObject(object));
  const ids = new Set();
  for (const object of manifest?.objects || []) { if (ids.has(object.experienceObjectId)) errors.push(`duplicate object ${object.experienceObjectId}`); ids.add(object.experienceObjectId); }
  return errors;
}

