// Stage/molecule maturity rollups and gate evaluation.
//
// Gates are soft guidance ("here's what's missing"), never a hard stop —
// see evaluateGate. Crossing a gate can also decide whether a master-detail
// molecule gets *produced*: that's the `producesMolecule` flag, consumed by
// genesis.fromMoleculeProduction() to spawn a Master Data Journey Lifecycle
// Rod (see genesis.js).
//
// Maturity bands (Unresolved -> Trusted) are NOT reinvented here — they're
// the same 5-band language crystalExperienceConfig.js already established
// for the crystal-city walkthrough, reused so "how defined is this" reads
// the same everywhere in the product.

import { DEFAULT_CRYSTAL_EXPERIENCE } from '../../data/crystalExperienceConfig.js';
import { maturityBandFor } from '../maturityScoring.js';
import { ATOM_RENDER_PROFILE } from '../../config/visual/metricVisualEncodingRegistry.js';

export function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function rollupStageMaturity(stage) {
  if (!stage.atoms || !stage.atoms.length) return clamp01(stage.maturity);
  const sum = stage.atoms.reduce((total, atomInstance) => total + clamp01(atomInstance.maturity), 0);
  return sum / stage.atoms.length;
}

export function rollupMoleculeMaturity(memberAtoms = []) {
  if (!memberAtoms.length) return 0;
  return memberAtoms.reduce((total, atomInstance) => total + clamp01(atomInstance.maturity), 0) / memberAtoms.length;
}

export function bandForMaturity(maturity, bands = DEFAULT_CRYSTAL_EXPERIENCE.maturity) {
  return maturityBandFor(clamp01(maturity), bands);
}

// Config-driven visual channel engine: maps an atom's domain metrics
// (maturity, risk) onto the rendered mesh properties atomGeometry.js
// consumes. Kept here (not a separate module) since it's a direct
// consequence of the same maturity math above.
function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function computeAtomVisual(atomInstance, rodColorHex, { riskColor, queryConfidence = null } = {}) {
  const profile = ATOM_RENDER_PROFILE;
  const risk = atomInstance.conflict ? Math.max(atomInstance.risk || 0, profile.thresholds.conflictRiskFloor) : atomInstance.risk || 0;
  const c = profile.channels;

  const scaleY = c.scaleY.value;
  const facet = c.facet.value;
  const opacity = Number.isFinite(queryConfidence) ? lerp(c.opacity.min, c.opacity.max, clamp01(queryConfidence)) : c.opacity.missingValue;
  const metalness = c.metalness.value;
  const roughness = c.roughness.value;
  const emissiveIntensity = lerp(c.emissive.min, c.emissive.max, clamp01(risk));
  const haloIntensity = atomInstance.conflict ? profile.thresholds.conflictHalo : c.halo.min;

  let colorHex = rodColorHex;
  if (atomInstance.conflict) colorHex = riskColor ?? rodColorHex;

  return {
    scaleY, facet, opacity, metalness, roughness, emissiveIntensity, haloIntensity, colorHex,
    emissiveColor: atomInstance.conflict ? (riskColor ?? rodColorHex) : rodColorHex,
  };
}

// gate: { id, requiredAtomIds, atomThreshold?, moleculeId?, qualifiedMessage,
//         missingMessage }. atomsById: { [atomId]: atomInstance }.
export function evaluateGate(gate, atomsById) {
  if (!gate) return null;
  const requiredAtomIds = gate.requiredAtomIds || [];
  const threshold = gate.atomThreshold ?? 0.75;

  const missing = requiredAtomIds.filter((atomId) => {
    const atomInstance = atomsById[atomId];
    return !atomInstance || clamp01(atomInstance.maturity) < threshold || atomInstance.conflict;
  });

  const met = requiredAtomIds.length > 0 && missing.length === 0;

  return {
    gateId: gate.id,
    label: gate.label,
    met,
    missing,
    message: met ? gate.qualifiedMessage : gate.missingMessage,
    // Soft guidance for the missing case: which atoms, not an error code.
    guidance: met
      ? null
      : missing.map((atomId) => (atomsById[atomId]?.name ? `Missing or unresolved: ${atomsById[atomId].name}` : `Missing atom: ${atomId}`)),
    producesMolecule: met && !!gate.moleculeId,
    moleculeId: gate.moleculeId || null,
  };
}
