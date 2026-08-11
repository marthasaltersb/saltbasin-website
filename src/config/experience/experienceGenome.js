// Salt Basin's compositional visual grammar. New experiences select governed
// genes; renderers consume the compiled result and never infer business meaning.
export const EXPERIENCE_GENOME = Object.freeze({
  world: Object.freeze(['basin', 'river', 'orbit', 'lattice', 'crystal_field', 'research_universe', 'evidence_chamber', 'configuration_forge', 'journey_corridor']),
  object: Object.freeze(['atom', 'molecule', 'crystal', 'signal', 'token', 'rod', 'branch', 'evidence_fragment', 'claim', 'portal']),
  behavior: Object.freeze(['orbit', 'bond', 'branch', 'merge', 'flow', 'crystallize', 'fracture', 'pulse', 'emerge', 'reconcile', 'dissolve']),
  interaction: Object.freeze(['inspect', 'enter', 'grab', 'connect', 'separate', 'configure', 'validate', 'compare', 'rewind', 'simulate', 'approve']),
  agent: Object.freeze(['guide', 'researcher', 'validator', 'builder', 'reconciler', 'historian', 'simulator', 'operator']),
  presentation: Object.freeze(['hero', 'macro', 'micro', 'timeline', 'orbit', 'first_person', 'operator', 'cinematic', 'precision_surface']),
});

export function validateGenomeSelection(selection = {}) {
  const errors = [];
  for (const [family, genes] of Object.entries(selection)) {
    if (!EXPERIENCE_GENOME[family]) errors.push(`unknown genome family "${family}"`);
    else for (const gene of Array.isArray(genes) ? genes : [genes]) if (!EXPERIENCE_GENOME[family].includes(gene)) errors.push(`${family}: unknown gene "${gene}"`);
  }
  return errors;
}

