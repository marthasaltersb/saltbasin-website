import test from 'node:test';
import assert from 'node:assert/strict';
import { compileExperience } from './experienceCompiler.js';
import { REFERENCE_JOURNEY_MANIFEST } from '../config/experience/referenceJourneyManifest.js';

test('compiles the reference journey through governed world and variant registries', () => {
  const result = compileExperience(REFERENCE_JOURNEY_MANIFEST);
  assert.equal(result.valid, true);
  assert.equal(result.runtime.world.id, 'journey');
  assert.equal(result.runtime.variant.variantKey, 'TEMPORAL_CANYON');
  assert.equal(result.runtime.stateReference.id, 'salt-basin-shared-semantic-query-state');
  assert.equal(result.runtime.stateReference.ownership, 'shared');
  assert.ok(result.manifest.objects.every((object) => object.compiledVisual));
});
