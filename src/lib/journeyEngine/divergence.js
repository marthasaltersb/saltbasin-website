// Divergence layer of Salt Basin Divergent State Mechanics — the surviving
// concept from prior-art pressure testing, renamed from "Orbital
// Divergence" to Heterosemantic State Divergence Kinetics (HSDK). See the
// "divergent-state-mechanics-framework" memory for the full reasoning.
//
// Multiple *semantically non-equivalent* state projections are computed for
// one common journey identity (a Revenue rod, a Customer rod, a Member rod
// sharing an entityLabel) from distinct admissible evidence compositions.
// Revenue truth is not Customer truth is not Member truth, and they are
// never meant to synchronize into identical states — their relative
// movement is the signal, not a discrepancy to eliminate. This is
// deliberately not state-machine replication (which runs replicas of one
// deterministic machine against one event history).
//
// Two distinct kinds of divergence are tracked, because they're different
// risk signals:
//   - Axial Divergence: correlated rods sitting at different lifecycle
//     positions (Revenue .74, Customer .41).
//   - Density Divergence: correlated rods at similar lifecycle positions
//     but wildly different degrees of semantic settlement (see basin.js) —
//     one side is corroborated, the other is still floating on declared
//     fields alone.
//
// Instead of a fixed "expected orbit," each rod's expected range is a
// Correlated State Envelope derived from the other rod's current position.
// Exceeding that envelope is a Reconciliation Boundary Exceedance (renamed
// from "Escape State"): a defined reconciliation-failure condition, not a
// vague red/green flag.

import { computeRodDensity } from './basin.js';
import { ROD_MATHEMATICS_METHODOLOGY } from '../../config/metrics/rodMathematicsMethodology.js';

export function computeStateVector(rod, { now = Date.now() } = {}) {
  const stages = rod.stages || [];
  const atoms = stages.flatMap((s) => s.atoms || []);
  const coordinate = stages.length ? stages.reduce((sum, s) => sum + (s.maturity || 0), 0) / stages.length : 0;
  const confidence = atoms.length ? atoms.reduce((sum, a) => sum + (a.conflict ? 0.2 : a.maturity), 0) / atoms.length : 0;
  const density = computeRodDensity(rod);
  const age = rod.createdAt ? Math.min(1, (now - rod.createdAt) / (1000 * 60 * 60)) : 0;
  const tributaryDensity = rod.tributary ? 1 : 0;
  const evidenceDensity = atoms.length ? Math.min(1, atoms.reduce((sum, a) => sum + (a.evidence?.length || 0), 0) / (atoms.length * 2)) : 0;
  return { coordinate, confidence, density, age, tributaryDensity, evidenceDensity };
}

function vectorDistance(a, b) {
  const keys = ['coordinate', 'confidence', 'density', 'tributaryDensity', 'evidenceDensity'];
  const sumSq = keys.reduce((sum, key) => sum + (a[key] - b[key]) ** 2, 0);
  return Math.sqrt(sumSq);
}

// rodId -> [{ t, vector }], capped, in-memory only (this session's proof of
// the mechanism — a real deployment would persist these for true
// cross-session rate analysis).
const snapshotHistory = new Map();

function recordSnapshot(rod, vector, maxHistory = 20) {
  const list = snapshotHistory.get(rod.id) || [];
  list.push({ t: Date.now(), vector });
  if (list.length > maxHistory) list.shift();
  snapshotHistory.set(rod.id, list);
  return list;
}

export function getSnapshots(rodId) {
  return snapshotHistory.get(rodId) || [];
}

// The expected coordinate range for one rod given another's current
// position — a range, not a fixed trajectory. Tolerance would vary by
// rod-type pairing in a real deployment (tighter for Customer<->Revenue,
// looser for loosely-coupled pairs); one flat tolerance here for the demo.
export function computeCorrelatedStateEnvelope(referenceCoordinate, tolerance = ROD_MATHEMATICS_METHODOLOGY.correlatedStateEnvelope.defaultTolerance) {
  return { min: Math.max(0, referenceCoordinate - tolerance), max: Math.min(1, referenceCoordinate + tolerance) };
}

export function computeHeterosemanticDivergence(rodA, rodB) {
  const vectorA = computeStateVector(rodA);
  const vectorB = computeStateVector(rodB);
  const distance = vectorDistance(vectorA, vectorB);
  const axialDivergence = Math.abs(vectorA.coordinate - vectorB.coordinate);
  const densityDivergence = Math.abs(vectorA.density - vectorB.density);

  const historyA = recordSnapshot(rodA, vectorA);
  const historyB = recordSnapshot(rodB, vectorB);

  let velocity = 0;
  let acceleration = 0;
  if (historyA.length >= 2 && historyB.length >= 2) {
    const prevDistance = vectorDistance(historyA[historyA.length - 2].vector, historyB[historyB.length - 2].vector);
    const dtSeconds = Math.max(1, (historyA[historyA.length - 1].t - historyA[historyA.length - 2].t) / 1000);
    velocity = (distance - prevDistance) / dtSeconds;
  }
  if (historyA.length >= 3 && historyB.length >= 3) {
    const priorDistance = vectorDistance(historyA[historyA.length - 3].vector, historyB[historyB.length - 3].vector);
    const midDistance = vectorDistance(historyA[historyA.length - 2].vector, historyB[historyB.length - 2].vector);
    acceleration = (distance - midDistance) - (midDistance - priorDistance);
  }

  const envelope = computeCorrelatedStateEnvelope(vectorA.coordinate);
  const boundaryExceeded = vectorB.coordinate < envelope.min || vectorB.coordinate > envelope.max;

  return { distance, axialDivergence, densityDivergence, velocity, acceleration, envelope, boundaryExceeded, vectorA, vectorB };
}

export function classifyDivergence({ distance, boundaryExceeded }) {
  if (boundaryExceeded) return 'reconciliation-boundary-exceeded';
  if (distance >= 0.4) return 'high';
  if (distance >= 0.2) return 'medium';
  return 'low';
}

export function isReconciliationBoundaryExceedance(divergenceResult) {
  return !!divergenceResult.boundaryExceeded;
}

// Any event that measurably moves a rod's state vector — callers record one
// whenever an atom resolves, a gate fires, or a merge commits, so the world
// can narrate *why* two correlated rods started diverging, not just *that*
// they did.
export function recordPerturbation(rod, { source, description }) {
  rod.perturbations = rod.perturbations || [];
  rod.perturbations.push({ source, description, at: Date.now() });
  return rod.perturbations;
}
