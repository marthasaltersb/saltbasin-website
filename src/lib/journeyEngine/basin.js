// Propagation layer of Salt Basin Divergent State Mechanics: how state is
// distributed and settles, as opposed to what it's made of (bonding.js) or
// how far correlated states have diverged (divergence.js). See the
// "divergent-state-mechanics-framework" memory for the full pressure-tested
// vocabulary — this file was rebuilt from an earlier linear "State Depth"
// model to the current density/sedimentation model after that concept
// survived prior-art review better.
//
// The core reframe: evidence is not manually ranked "shallow to deep." It
// computationally settles, remains suspended, or resuspends according to
// its own properties and the rate of change (State Current) acting on its
// Data Basin — sediment/water/surface, not a fixed hierarchy.

import { ROD_MATHEMATICS_METHODOLOGY } from '../../config/metrics/rodMathematicsMethodology.js';

export const STATE_STRATA = [
  { id: 'surface', label: 'Surface', order: 0, densityMax: 0.2, note: 'Active/volatile, rapidly changing, current signals' },
  { id: 'water', label: 'Water Column', order: 1, densityMax: 0.42, note: 'Flowing operational data, transactions, states in motion' },
  { id: 'suspended', label: 'Suspended Matter', order: 2, densityMax: 0.6, note: 'Unresolved evidence, conflicting atoms, exceptions' },
  { id: 'sediment', label: 'Sediment', order: 3, densityMax: 0.85, note: 'Settled evidence, historical lineage, validated definitions' },
  { id: 'bedrock', label: 'Bedrock', order: 4, densityMax: 1.01, note: 'Invariant identity, governing definitions, permanent lineage anchors' },
];

// Bounded, named evidence domains per rod type — not exhaustive, matches
// this demo's evidence source strings; a real deployment would configure
// this per client.
export const DATA_BASINS = {
  revenue: { basinId: 'revenue', name: 'Revenue Data Basin', expectedSources: ['CPQ', 'Contract Ops Sheet', 'Salesforce (CRM)', 'Financing Partner Docs'] },
  customer: { basinId: 'customer', name: 'Customer Data Basin', expectedSources: ['Salesforce (CRM)', 'Approval Workflow (v1)', 'Approval Workflow (v2, branch)'] },
  member: { basinId: 'member', name: 'Member Data Basin', expectedSources: ['Identity Provider', 'Portal Directory'] },
};

export function basinFor(rodType) {
  return DATA_BASINS[rodType] || null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

// ρstate = f(persistence, corroboration, temporal_stability, lineage_attachment,
// semantic_resolution). A working sketch, not a final patent equation — see
// the memory for the reasoning (a Salesforce field is low-density/near-
// surface; a signed contract is higher; invoice+payment+recognition
// together settle into sediment because multiple independent systems now
// agree).
export function computeAtomDensity(atomInstance) {
  const evidenceCount = atomInstance.evidence?.length || 0;
  const persistence = atomInstance.chosenSource ? 0.9 : clamp01(atomInstance.maturity);
  const corroboration = atomInstance.conflict ? 0 : clamp01(evidenceCount / 2);
  const temporalStability = (atomInstance.versionHistory?.length || 0) > 0 ? 0.6 : 0.85;
  const lineageAttachment = (atomInstance.version || 1) > 1 ? 0.7 : 0.5;
  const semanticResolution = atomInstance.conflict ? 0.1 : clamp01(atomInstance.maturity);

  const values = { persistence, corroboration, temporalStability, lineageAttachment, semanticResolution };
  return clamp01(Object.entries(ROD_MATHEMATICS_METHODOLOGY.atomDensity.weights).reduce((sum, [key, weight]) => sum + values[key] * weight, 0));
}

// Composition density can exceed any individual member atom's density —
// three individually-modest atoms that independently corroborate each
// other settle harder than any one of them alone.
export function computeCompositionDensity(memberAtoms) {
  if (!memberAtoms.length) return 0;
  const individualAvg = memberAtoms.reduce((sum, a) => sum + computeAtomDensity(a), 0) / memberAtoms.length;
  const densityConfig = ROD_MATHEMATICS_METHODOLOGY.atomDensity;
  const corroborationBonus = memberAtoms.length >= densityConfig.compositionCorroborationMinimum && memberAtoms.every((a) => !a.conflict) ? densityConfig.compositionCorroborationBonus : 0;
  return clamp01(individualAvg + corroborationBonus);
}

export function computeRodDensity(rod) {
  const atoms = (rod.stages || []).flatMap((s) => s.atoms || []);
  if (!atoms.length) return 0;
  return atoms.reduce((sum, a) => sum + computeAtomDensity(a), 0) / atoms.length;
}

// A conflicted atom is always Suspended Matter regardless of its computed
// density number — it exists, it isn't missing, but it cannot settle until
// the conflict resolves.
export function classifyStratum(atomInstance) {
  if (atomInstance.conflict) return STATE_STRATA[2];
  const density = computeAtomDensity(atomInstance);
  return STATE_STRATA.find((s) => density <= s.densityMax) || STATE_STRATA[STATE_STRATA.length - 1];
}

export function isSuspended(atomInstance) {
  return !!atomInstance.conflict;
}

// Sedimentation: the process by which corroborated evidence becomes part of
// persistent historical state. A real recorded event, not just a flipped
// boolean — called when a conflict resolves.
export function sedimentAtom(atomInstance, { reason } = {}) {
  atomInstance.sedimentationHistory = atomInstance.sedimentationHistory || [];
  atomInstance.sedimentationHistory.push({ at: Date.now(), reason: reason || 'Evidence corroborated to semantic settlement.' });
  return atomInstance;
}

// Resuspension: a previously settled evidence composition returns to an
// unresolved computational state because a perturbing evidence unit affects
// its effective period, lineage, or semantic compatibility — e.g. a
// document regenerated at a new version needs re-corroboration before it
// can resettle. This only lowers maturity/density (dropping the atom back
// toward the water column) and records the event; it does NOT set
// `conflict: true` unless the caller supplies real `conflictingEvidence` —
// `conflict` drives the evidence-resolution UI elsewhere, and flipping it
// on without actual competing evidence entries would leave the atom in an
// unresolvable dead end.
export function resuspendAtom(atomInstance, { reason, conflictingEvidence } = {}) {
  atomInstance.maturity = Math.min(atomInstance.maturity, 0.5);
  atomInstance.resuspensionHistory = atomInstance.resuspensionHistory || [];
  atomInstance.resuspensionHistory.push({ at: Date.now(), reason });
  if (conflictingEvidence?.length) {
    atomInstance.conflict = true;
    atomInstance.evidence = [...(atomInstance.evidence || []), ...conflictingEvidence];
  }
  return atomInstance;
}

// Evidence Stratification Gradient: orders a stage's atoms by how many
// independent evidence units back them (a proxy for consequence-distance
// from the original declared assertion) and walks the resulting density
// sequence for a discontinuous jump — the detected boundary is the State
// Pycnocline, the point where derived state changes materially as deeper
// evidence is incorporated.
export function findPycnocline(stage, { threshold = 0.25 } = {}) {
  const atoms = stage.atoms || [];
  if (atoms.length < 2) return null;
  const ordered = [...atoms].sort((a, b) => (a.evidence?.length || 0) - (b.evidence?.length || 0));
  const densities = ordered.map((a) => computeAtomDensity(a));
  for (let i = 1; i < densities.length; i += 1) {
    const delta = densities[i] - densities[i - 1];
    if (Math.abs(delta) >= threshold) {
      return {
        atomId: ordered[i].atomId,
        priorAtomId: ordered[i - 1].atomId,
        delta,
        note: 'Evidence-depth transition boundary — derived state changes materially between these two evidentiary strata.',
      };
    }
  }
  return null;
}

export function computeCrossDomainContributionRatio(atomInstance, rodType) {
  const basin = basinFor(rodType);
  const evidence = atomInstance.evidence || [];
  if (!basin || !evidence.length) return 0;
  const foreign = evidence.filter((ev) => !basin.expectedSources.includes(ev.source));
  return foreign.length / evidence.length;
}

export function contributionRatioBand(ratio) {
  if (ratio >= 0.5) return 'high';
  if (ratio >= 0.2) return 'elevated';
  return 'normal';
}
