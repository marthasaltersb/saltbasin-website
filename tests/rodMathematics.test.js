import test from 'node:test';
import assert from 'node:assert/strict';
import { ROD_MATHEMATICS_METHODOLOGY } from '../src/config/metrics/rodMathematicsMethodology.js';
import { calculateCrossRodAlignment, calculateJourneyDensity, calculateRodCoherence, calculateRodMaturity, calculateRodPosition, calculateStageCompleteness, calculateStageReadiness } from '../src/lib/journeyEngine/rodMathematics.js';

test('configured composite weights are normalized', () => {
  for (const weights of [ROD_MATHEMATICS_METHODOLOGY.stageCompleteness.bucketWeights, ROD_MATHEMATICS_METHODOLOGY.stageReadiness.weights, ROD_MATHEMATICS_METHODOLOGY.rodMaturity.weights, ROD_MATHEMATICS_METHODOLOGY.atomDensity.weights, ROD_MATHEMATICS_METHODOLOGY.coherence.weights]) assert.ok(Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) < 1e-12);
});

test('rod position separates cycle, stage, and intra-stage position', () => {
  const result = calculateRodPosition({ currentStageId: 'b', cycle: 2, stages: [{ id: 'a' }, { id: 'b', name: 'Proposal' }] }, { requirements: [{ satisfied: true }, { satisfied: false }] });
  assert.deepEqual({ cycle: result.cycle, stage: result.stageNumber, intra: result.intraStagePosition }, { cycle: 2, stage: 2, intra: 0.5 });
});

test('stage completeness uses configured requirement buckets', () => {
  const requirements = Object.keys(ROD_MATHEMATICS_METHODOLOGY.stageCompleteness.bucketWeights).map((bucket) => ({ id: bucket, bucket, satisfied: (state) => state[bucket] }));
  assert.equal(calculateStageCompleteness({ requirements }, { definitions: true, evidence: false, relationships: true, validation: false }).score, 0.45);
});

test('readiness explains contradictions rather than acting as a hard stop', () => {
  const result = calculateStageReadiness({ completeness: 1, minimumDefinitions: 1, requiredEvidence: 1, contradictions: [{ id: 'price-v3', severity: 1 }], dependencyState: 1, requiredDecisions: 1 });
  assert.ok(result.score > 0); assert.equal(result.blockers[0].type, 'contradiction');
});

test('maturity remains separate from position', () => assert.equal(calculateRodMaturity({ definitionMaturity: 1, evidenceMaturity: 1, lineageMaturity: 1, validationMaturity: 1, temporalMaturity: 1, relationshipMaturity: 1 }).score, 1));

test('journey density deduplicates repeated events', () => assert.equal(calculateJourneyDensity({ stateTransitions: [{ id: 'x' }, { id: 'x' }], branches: [{ id: 'b' }] }).materialContributionPoints, 2));

test('coherence wraps divergence with mismatch detail', () => assert.ok(calculateRodCoherence({ axialDivergence: 0.2, densityDivergence: 0.1, crossRodContradictions: [{ id: 'x', severity: 0.5 }] }).score < 1));

test('alignment uses configured expected relationships, not stage equality', () => assert.equal(calculateCrossRodAlignment({ revenue: 'active_subscription', customer: 'onboarding', member: 'provisioning' }).aligned, true));
