import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateConvergenceStability, calculateQueryConfidence, calculateQueryCoverage, calculateQueryRelevance, deriveQueryEvidenceMetrics } from '../src/lib/journeyEngine/queryConvergence.js';
import { QUERY_CONVERGENCE_METHODOLOGY } from '../src/config/metrics/queryConvergenceMethodology.js';

test('every composite methodology is normalized configuration', () => {
  for (const weights of [QUERY_CONVERGENCE_METHODOLOGY.relevance.weights, QUERY_CONVERGENCE_METHODOLOGY.confidence.weights, QUERY_CONVERGENCE_METHODOLOGY.stability.riskWeights]) {
    assert.ok(Math.abs(Object.values(weights).reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
  }
});

test('relevance exposes configured component contributions', () => {
  const result = calculateQueryRelevance({ directSemanticRelationship: 1, rodRelationship: 1, lineageRelationship: 0.5, hierarchyRelationship: 0, semanticSimilarity: 0.5 });
  assert.equal(result.score, 0.75);
  assert.equal(result.components.directSemanticRelationship.weight, 0.35);
  assert.equal(result.band.key, 'strong');
});

test('coverage deduplicates atoms and excludes optional dimensions', () => {
  const context = { requiredContextDimensions: [{ dimensionId: 'a', tier: 'required', matchAtomIds: ['x'] }, { dimensionId: 'b', tier: 'conditional', matchAtomIds: ['y'] }, { dimensionId: 'c', tier: 'optional', matchAtomIds: ['z'] }] };
  const result = calculateQueryCoverage([{ atomId: 'x' }, { atomId: 'x' }], context);
  assert.equal(result.coveredWeight, 1);
  assert.equal(result.applicableWeight, 1.65);
});

test('confidence remains separate from coverage', () => {
  assert.equal(calculateQueryConfidence({ evidenceQuality: 1, sourceAuthority: 1, agreement: 1, temporalFreshness: 1, lineageIntegrity: 1, validationStatus: 1 }).score, 1);
});

test('stability is inverse configured unresolved-evidence risk', () => {
  assert.equal(calculateConvergenceStability({ unresolvedContradictions: 1, pendingEvidence: 1, incompleteBranches: 1, sourceVolatility: 1, lowConfidenceLineage: 1, unvalidatedDefinitions: 1 }).score, 0);
});

test('evidence adapter never invents confidence or stability without evidence fields', () => {
  assert.deepEqual(deriveQueryEvidenceMetrics([{ atomId: 'x' }]), { confidence: null, stability: null });
});

test('evidence adapter derives separate metrics from real evidence fields', () => {
  const result = deriveQueryEvidenceMetrics([{ atomId: 'x', conflict: true, evidence: [{ quality: 0.8, sourceAuthority: 0.9, temporalFreshness: 0.7 }], lineageIntegrity: 0.8, validationScore: 0.9, validationStatus: 'validated' }]);
  assert.ok(result.confidence); assert.ok(result.stability); assert.notEqual(result.confidence.score, result.stability.score);
});
