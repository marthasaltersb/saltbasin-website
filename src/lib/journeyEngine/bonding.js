// Magnetic-property compatibility -> Bond formation -> Molecule assembly.
//
// An atom carries `magneticProperties` (attraction tags). A molecule
// definition declares the tags it draws ("its field") and, optionally, which
// scenario dimension selects its variant shape (e.g. a Pricing Molecule
// looks different for a tiered-pricing deal than a flat-rate one). Atoms
// never carry a hardcoded `atom.moleculeId` — which molecule an atom belongs
// to is *computed* here, every time, from magnetic compatibility. This is
// what lets a new molecule type be a pure config addition.
//
// A Bond is the first-class edge formed between two compatible atoms within
// the same molecule's field. A Molecule instance is the converged cluster:
// its member atoms, the bonds between them, the selected variant, and a
// rolled-up maturity — this is the "record/data-model state" the molecule
// represents.
//
// Each bond carries a Contribution Affinity (deliberately not called "Bond
// Strength" — that phrase collides with prior art combining "bond strength"
// and "semantic distance" for closeness in semantic space; see the
// divergent-state-mechanics memory). Affinity is not confidence in either
// atom individually — it's a measure of this evidence unit's capacity to
// contribute to this semantic state composition: two atoms can both
// individually be highly mature while their affinity is low (little tag
// overlap between them), or one atom mid-conflict can drag affinity down
// even though its partner is perfectly resolved.

function overlap(tagsA = [], tagsB = []) {
  return tagsA.filter((tag) => tagsB.includes(tag));
}

// What fraction of `referenceTags` (e.g. a query context's coreTags/relatedTags)
// a given atom's magneticProperties actually satisfies. Exported so other
// modules (queryConvergence.js) reuse this exact tag-matching logic instead
// of re-deriving their own overlap calculation — see the visual-metrics
// skill's "never duplicate a calculation" rule.
export function tagOverlapRatio(tagsA = [], referenceTags = []) {
  if (!referenceTags.length) return 0;
  return overlap(tagsA, referenceTags).length / referenceTags.length;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function computeContributionAffinity(atomA, atomB) {
  const sharedTags = overlap(atomA.magneticProperties, atomB.magneticProperties).length;
  const maxTags = Math.max(atomA.magneticProperties?.length || 0, atomB.magneticProperties?.length || 0, 1);
  const tagAffinity = sharedTags / maxTags;
  const conflictPenalty = (atomA.conflict ? 0.5 : 0) + (atomB.conflict ? 0.5 : 0);
  return clamp01(tagAffinity - conflictPenalty * 0.3);
}

// Picks which variant of a molecule definition applies, based on the current
// value of its declared scenario dimension (read from `dimensionValues`, a
// plain map of dimensionId -> value gathered from the rod's captured atoms).
// Falls back to the definition's `defaultVariant` (or null) when the
// dimension hasn't been captured yet — a molecule can start forming before
// its variant is fully determined.
export function selectMoleculeVariant(moleculeDef, dimensionValues = {}) {
  if (!moleculeDef.variantDimension || !moleculeDef.variants) return moleculeDef.defaultVariant || null;
  const dimensionValue = dimensionValues[moleculeDef.variantDimension];
  if (dimensionValue && moleculeDef.variants[dimensionValue]) return dimensionValue;
  return moleculeDef.defaultVariant || null;
}

// Computes every Bond between atoms that are compatible with a given
// molecule's field (share at least `minAttractionOverlap` magnetic-property
// tags with the molecule's `attractionTags`).
export function computeBonds(atoms, moleculeDef) {
  const minOverlap = moleculeDef.minAttractionOverlap ?? 1;
  const compatible = atoms.filter(
    (atomInstance) => overlap(atomInstance.magneticProperties, moleculeDef.attractionTags).length >= minOverlap
  );

  const bonds = [];
  for (let i = 0; i < compatible.length; i += 1) {
    for (let j = i + 1; j < compatible.length; j += 1) {
      const a = compatible[i];
      const b = compatible[j];
      bonds.push({
        bondId: `bond::${moleculeDef.moleculeId}::${a.atomId}::${b.atomId}`,
        moleculeId: moleculeDef.moleculeId,
        atomIds: [a.atomId, b.atomId],
        affinity: computeContributionAffinity(a, b),
      });
    }
  }

  return { compatibleAtoms: compatible, bonds };
}

// Assembles every molecule instance a rod's atoms produce, given the rod's
// molecule definitions (its config) and any captured dimension values
// (e.g. { pricingModel: 'tiered' }). Returns one Molecule per definition
// that has at least one compatible atom — a molecule with zero bonded atoms
// simply doesn't exist yet, it isn't rendered as an empty shell.
export function assembleMolecules(atoms, moleculeDefs, dimensionValues = {}) {
  return moleculeDefs
    .map((moleculeDef) => {
      const { compatibleAtoms, bonds } = computeBonds(atoms, moleculeDef);
      if (!compatibleAtoms.length) return null;
      const variant = selectMoleculeVariant(moleculeDef, dimensionValues);
      const maturity = compatibleAtoms.reduce((sum, a) => sum + (a.maturity ?? 0), 0) / compatibleAtoms.length;
      const hasConflict = compatibleAtoms.some((a) => a.conflict);

      return {
        moleculeId: moleculeDef.moleculeId,
        name: moleculeDef.name,
        variant,
        memberAtomIds: compatibleAtoms.map((a) => a.atomId),
        bonds,
        maturity,
        conflict: hasConflict,
        // The "record/data-model state" this molecule currently represents —
        // a plain map of the member atoms' captured values, keyed by atomId,
        // so a molecule instance is directly queryable as a state object.
        recordState: compatibleAtoms.reduce((state, a) => {
          state[a.atomId] = a.value ?? null;
          return state;
        }, {}),
      };
    })
    .filter(Boolean);
}
