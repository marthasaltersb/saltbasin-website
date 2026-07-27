import { randomUUID } from 'node:crypto';

export function createScenarioObservation(registry, atomAssignments, context = {}) {
  const resolution = registry.resolveFromAtoms(atomAssignments, context);
  if (resolution.exactMatch) return { observationCreated: false, resolution };
  return { observationCreated: true, resolution, observation: { observationId: `SB-OBS-${randomUUID()}`, signature: resolution.signature.id, atomAssignments: resolution.signature.atoms, nearestScenarios: resolution.candidateScenarios, novelCombination: true, sourceEventId: context.sourceEventId || null, customerId: context.customerId || null, contractId: context.contractId || null, evidence: context.evidence || [], reviewStatus: 'pending_review', createdAt: new Date().toISOString() } };
}
