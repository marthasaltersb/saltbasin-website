import test from 'node:test';
import assert from 'node:assert/strict';
import { ATOM_RENDER_PROFILE, METRIC_VISUAL_ENCODING_REGISTRY, resolveQueryDistance, validateVisualEncodingRegistry } from '../src/config/visual/metricVisualEncodingRegistry.js';

test('visual channels have one semantic source each', () => assert.deepEqual(validateVisualEncodingRegistry(), []));
test('distance means relevance and fill means completeness', () => {
  assert.equal(METRIC_VISUAL_ENCODING_REGISTRY.distance_from_query_context.metricKey, 'QUERY_RELEVANCE');
  assert.equal(METRIC_VISUAL_ENCODING_REGISTRY.rod_fill.metricKey, 'STAGE_COMPLETENESS');
});
test('atom renderer ranges resolve from a named profile', () => {
  assert.equal(ATOM_RENDER_PROFILE.profileId, 'atom-semantic-render-v2');
  assert.equal(ATOM_RENDER_PROFILE.channels.opacity.metricKey, 'QUERY_CONFIDENCE');
});
test('higher relevance always resolves closer to the query context', () => assert.ok(resolveQueryDistance(0.9) < resolveQueryDistance(0.2)));
