import test from 'node:test';
import assert from 'node:assert/strict';
import { ROD_MATHEMATICS_METHODOLOGY } from '../src/config/metrics/rodMathematicsMethodology.js';
import { calculateChannelMaturity, calculateCrossRodAlignment, calculateJourneyDensity, calculateRodCoherence, calculateStateConfidence, calculateRodPosition, calculateStageCompleteness, calculateStageReadiness, recencyScore } from '../src/lib/journeyEngine/rodMathematics.js';

test('configured composite weights are normalized', () => {
  // channelMaturity is deliberately absent: its purposes are independent
  // scores, not a partition of 1.
  for (const weights of [ROD_MATHEMATICS_METHODOLOGY.stageCompleteness.bucketWeights, ROD_MATHEMATICS_METHODOLOGY.stageReadiness.weights, ROD_MATHEMATICS_METHODOLOGY.stateConfidence.weights, ROD_MATHEMATICS_METHODOLOGY.atomDensity.weights, ROD_MATHEMATICS_METHODOLOGY.coherence.weights]) assert.ok(Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) < 1e-12);
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

test('maturity is purpose-scoped and never collapses to one score', () => {
  const result = calculateChannelMaturity({ legal: 1, participation_coverage: 0.3, billing_readiness: 0.8, rev_rec_readiness: 0.5, renewal_stability: 0.2, expected_realization: 0.4 });
  // The whole point of the Maturity principle: 100% legal alongside a partial
  // everything-else, with no single headline number available at all.
  assert.equal(result.purposes.legal.score, 1);
  assert.ok(result.purposes.participation_coverage.score < 1);
  assert.equal(result.score, undefined);
});

test('a purpose is capped by its dependencies', () => {
  // Billing readiness cannot exceed legal maturity — you cannot bill against
  // an unsigned contract.
  const result = calculateChannelMaturity({ legal: 0.4, billing_readiness: 1 });
  assert.equal(result.purposes.billing_readiness.score, 0.4);
  assert.equal(result.purposes.billing_readiness.raw, 1);
  assert.equal(result.purposes.billing_readiness.cappedBy, 'legal');
});

test('confidence uses the MVP_20B components and risk can only lower it', () => {
  const inputs = { sourceAuthority: 1, evidenceAgreement: 1, evidenceRecency: 1, calculationCompleteness: 1, reconciliationStatus: 1, validationStatus: 1 };
  const clean = calculateStateConfidence(inputs);
  const risky = calculateStateConfidence(inputs, ROD_MATHEMATICS_METHODOLOGY, { scenarioRisk: 1 });
  assert.equal(clean.score, 1);
  assert.ok(risky.score < clean.score);
  assert.equal(risky.penalty, ROD_MATHEMATICS_METHODOLOGY.stateConfidence.riskAdjustment.maxPenalty);
});

test('recency is a banded step function, not a decay curve (CONF-002)', () => {
  const now = Date.now();
  const day = 86400000;
  // <=30 = 1.0; 31-90 = 0.8; 91-365 = 0.6; >365 = 0.4
  assert.equal(recencyScore(now - 10 * day, now), 1.0);
  assert.equal(recencyScore(now - 60 * day, now), 0.8);
  assert.equal(recencyScore(now - 200 * day, now), 0.6);
  assert.equal(recencyScore(now - 400 * day, now), 0.4);
  // A step function holds its value right up to the boundary.
  assert.equal(recencyScore(now - 30 * day, now), recencyScore(now - 1 * day, now));
});

test('journey density deduplicates repeated events', () => assert.equal(calculateJourneyDensity({ stateTransitions: [{ id: 'x' }, { id: 'x' }], branches: [{ id: 'b' }] }).materialContributionPoints, 2));

test('coherence wraps divergence with mismatch detail', () => assert.ok(calculateRodCoherence({ axialDivergence: 0.2, densityDivergence: 0.1, crossRodContradictions: [{ id: 'x', severity: 0.5 }] }).score < 1));

test('alignment uses configured expected relationships, not stage equality', () => assert.equal(calculateCrossRodAlignment({ revenue: 'active_subscription', customer: 'onboarding', member: 'provisioning' }).aligned, true));

// ── Generic maturity engine ────────────────────────────────────────────────
import { MATURITY_MODEL, MATURITY_PROFILES, AGGREGATION, MATURITY_SIGNALS } from '../src/config/metrics/maturityModel.js';
import { computeMaturity, applyVolatility, facetCountForMaturity } from '../src/lib/journeyEngine/maturityEngine.js';

const allSignals = (level) => Object.fromEntries(MATURITY_SIGNALS.map((s) => [s.key, level]));

test('one engine serves every maturity layer', () => {
  for (const profile of Object.values(MATURITY_PROFILES)) {
    const r = computeMaturity({ scores: Object.fromEntries(profile.dimensions.map((d) => [d, 1])) }, profile);
    assert.equal(r.score, 1);
    assert.equal(r.profileKey, profile.key);
  }
});

test('breadth cannot carry a claim past its weakest link', () => {
  // Six signals perfect, lineage absent. A plain weighted sum would read ~0.86
  // and label the chain "Explainable" despite having no lineage at all.
  const levels = { ...allSignals(5), data_lineage: 0 };
  const capped = computeMaturity({ levels }, MATURITY_PROFILES.evidence);
  const plain = computeMaturity({ levels }, { ...MATURITY_PROFILES.evidence, aggregation: AGGREGATION.WEIGHTED_SUM });
  assert.ok(plain.score > 0.8);
  assert.equal(capped.score, 0);
  assert.equal(capped.cappedBy, 'data_lineage');
  assert.equal(capped.weakestLink.key, 'data_lineage');
});

test('weighted sum still moves the score below the cap', () => {
  // Capping must not degenerate into a pure minimum: with the weak link held
  // constant, improving other dimensions must still raise the number.
  const weak = { ...allSignals(1), data_quality: 3 };
  const strong = { ...allSignals(4), data_quality: 3 };
  const a = computeMaturity({ levels: weak }, MATURITY_PROFILES.evidence);
  const b = computeMaturity({ levels: strong }, MATURITY_PROFILES.evidence);
  assert.ok(b.score > a.score);
});

test('levels carry their own descriptor, not just a number', () => {
  const r = computeMaturity({ levels: allSignals(3) }, MATURITY_PROFILES.evidence);
  assert.equal(r.dimensions.reconciliation.descriptor, 'Cross-system tested');
  assert.equal(r.band.label, 'Reconciled');
});

test('MAT-003 blocks converged state without altering the score', () => {
  const scores = { stage_completion: 1, evidence_coverage: 1, reconciliation_completeness: 0.5, approval_completeness: 1 };
  const r = computeMaturity({ scores }, MATURITY_PROFILES.journey);
  assert.equal(r.blocked.blocks, 'converged_state');
  assert.equal(r.blocked.actual, 0.5);
  // Blocking is a governance fact about what the score may be USED for; it must
  // not silently rewrite the score itself.
  assert.equal(r.score, 0.5);
});

test('volatility pulls maturity backward', () => {
  const before = allSignals(4);
  const { levels: after, affected } = applyVolatility(before, 'Billing redesign');
  assert.equal(affected[0].key, 'reconciliation');
  assert.ok(computeMaturity({ levels: after }, MATURITY_PROFILES.evidence).score
    < computeMaturity({ levels: before }, MATURITY_PROFILES.evidence).score);
});

test('structure steps with maturity level per VIS-004', () => {
  assert.equal(facetCountForMaturity(0), MATURITY_MODEL.atomVisual.facet.min);
  assert.equal(facetCountForMaturity(1), MATURITY_MODEL.atomVisual.facet.max);
  // Step, not a continuous ramp: values inside one level share a facet count.
  assert.equal(facetCountForMaturity(0.81), facetCountForMaturity(0.79));
});
