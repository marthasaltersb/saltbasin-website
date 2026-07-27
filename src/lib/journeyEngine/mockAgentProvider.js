// Deterministic mock agent responses — the demo must function without any
// external AI API, so every message here is generated from real rod/atom/
// gate state, never hand-picked copy.
//
// Security model: agents are omniscient. Every function below receives the
// *full* rod/atom/gate context, unfiltered — that's necessary for context
// and for producing a unified experience. What actually gets exposed or
// offered as an action is filtered against the *interacting user's*
// permission profile at the point of response. Restriction lives here, at
// the response/action layer — never by hiding data from the agent itself.

export const ROLE_PERMISSIONS = {
  reviewer: { label: 'Reviewer (commit rights)', canResolveConflicts: true, canApproveMerges: true, canRunOutputsAgent: true },
  observer: { label: 'Observer (read-only)', canResolveConflicts: false, canApproveMerges: false, canRunOutputsAgent: false },
};

export function getPermissionProfile(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.observer;
}

export function describeAtomConflict(atomInstance, rod, { role } = {}) {
  const profile = getPermissionProfile(role);
  const agentName = rod?.agent?.name || 'Journey Agent';
  const message = `${agentName}: this journey cannot establish a single authoritative value for "${atomInstance.name}".`;
  const actions = profile.canResolveConflicts
    ? (atomInstance.evidence || []).map((ev) => ({ type: 'resolve', label: `Adopt ${ev.source} as authoritative`, source: ev.source, value: ev.value }))
    : [{ type: 'propose-only', label: 'Propose only — switch to Reviewer to commit' }];
  return { message, actions };
}

export function describeGateStatus(gateResult, rod) {
  const agentName = rod?.agent?.name || 'Journey Agent';
  if (!gateResult) return { message: `${agentName}: no gate configured for this stage.` };
  if (gateResult.met) return { message: `${agentName}: ${gateResult.message}` };
  const missingText = gateResult.guidance?.length ? gateResult.guidance.join(' ') : 'More definitions are needed before this gate opens.';
  return { message: `${agentName}: ${missingText}` };
}

export function describeMergeProposal(masterDataRod, targetRod, { role } = {}) {
  const profile = getPermissionProfile(role);
  return {
    message: `Historical Lineage Agent: "${masterDataRod.name}" proposes merging into "${targetRod.name}". Branch provenance is preserved regardless of the outcome.`,
    canApprove: profile.canApproveMerges,
  };
}

export function describeOutputsAgentAvailability(gateResult, { role } = {}) {
  const profile = getPermissionProfile(role);
  if (!gateResult?.met) return { available: false, reason: 'This gate is not yet qualified — nothing to generate yet.' };
  if (!profile.canRunOutputsAgent) return { available: false, reason: 'Switch to Reviewer to generate outputs.' };
  return { available: true, reason: null };
}

export function describeModuleAccess(memberRod, moduleScope) {
  if (moduleScope !== 'personal') return { available: true };
  const personalEmailAtom = (memberRod.stages || [])
    .flatMap((stage) => stage.atoms || [])
    .find((atomInstance) => atomInstance.elementId === 'EmailAddress' && atomInstance.magneticProperties?.includes('personalScope'));
  const verified = personalEmailAtom && personalEmailAtom.maturity >= 0.75 && !personalEmailAtom.conflict;
  return {
    available: !!verified,
    reason: verified ? null : 'Add and verify a personal email address to unlock personal-scope modules (site config, financial management, resume outputs).',
  };
}
