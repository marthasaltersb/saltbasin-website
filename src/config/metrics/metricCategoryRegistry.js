// The 10 fixed metric-category vocabulary from the Visual Metrics master prompt (§XIV). Every entry in
// metricDefinitionRegistry.js must use one of these category ids — do not introduce a new category ad hoc
// in a component; add it here first so the taxonomy stays centralized and consistently worded everywhere.

export const METRIC_CATEGORY_REGISTRY = Object.freeze({
  POSITION: { categoryId: 'POSITION', name: 'Position', archetypeQuestion: 'Where is it?' },
  COMPLETENESS: { categoryId: 'COMPLETENESS', name: 'Completeness', archetypeQuestion: 'How much required context exists?' },
  CONFIDENCE: { categoryId: 'CONFIDENCE', name: 'Confidence', archetypeQuestion: 'How strongly do we trust it?' },
  MATURITY: { categoryId: 'MATURITY', name: 'Maturity', archetypeQuestion: 'How well-defined and governed is it?' },
  READINESS: { categoryId: 'READINESS', name: 'Readiness', archetypeQuestion: 'Can it naturally move forward?' },
  ALIGNMENT: { categoryId: 'ALIGNMENT', name: 'Alignment', archetypeQuestion: 'Do related states make sense together?' },
  COHERENCE: { categoryId: 'COHERENCE', name: 'Coherence', archetypeQuestion: 'Does the information agree internally?' },
  DENSITY: { categoryId: 'DENSITY', name: 'Density', archetypeQuestion: 'How much meaningful complexity or history has accumulated?' },
  RELEVANCE: { categoryId: 'RELEVANCE', name: 'Relevance', archetypeQuestion: 'How related is it to the active query?' },
  STABILITY: { categoryId: 'STABILITY', name: 'Stability', archetypeQuestion: 'How likely is the current interpretation to change?' },
});
