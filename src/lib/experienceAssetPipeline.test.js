import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssetRequest } from './experienceAssetPipeline.js';

test('reuses a governed asset before generating a new one', () => {
  const result = resolveAssetRequest({ artifactType: 'procedural_asset_family', visualFamily: 'crystalline' });
  assert.equal(result.strategy, 'reuse');
  assert.equal(result.artifact.artifactId, 'geometry.crystal-family');
});

test('requires approval when the genome cannot express the asset', () => {
  const result = resolveAssetRequest({ artifactType: 'sound-rig', visualFamily: 'unknown' });
  assert.equal(result.state, 'candidate_new');
  assert.equal(result.approvalRequired, true);
});
