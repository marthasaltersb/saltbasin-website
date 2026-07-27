import { OBJECT_TYPE_REGISTRY } from '../config/architecture/objectTypeRegistry.js';
import { semanticIdentity } from '../config/architecture/layerRegistry.js';

// Compatibility boundary only. It preserves legacy observations without
// pretending maturity/score are settlement, coordinate, or divergence.
export function migrateLegacyJourneyObject(input, { tenantId = 'salt-basin', observedAt = new Date().toISOString() } = {}) {
  const isTributary = input.objectType === 'journey_branch' || input.kind === 'scenario_divergence';
  const objectType = isTributary ? 'journey_tributary' : (input.objectType || 'journey_rod');
  const [layerIndex, layerKey] = OBJECT_TYPE_REGISTRY[objectType];
  const objectId = input.objectId || input.id;
  return {
    ...input, objectId, objectType, layerIndex, layerKey,
    semanticIdentity: semanticIdentity({ objectId, objectType, tenantId }),
    legacyObservations: {
      ...(input.legacyObservations || {}),
      ...(input.maturity == null ? {} : { maturity: { value: input.maturity, observedAt, interpretation: 'legacy_maturity_observation' } }),
      ...(input.score == null ? {} : { score: { value: input.score, observedAt, interpretation: 'legacy_journey_score_observation' } }),
    },
  };
}
