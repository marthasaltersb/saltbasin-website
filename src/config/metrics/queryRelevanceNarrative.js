// §XVI Steps 4–5: "Why This Element Converged" drill-through and the generated plain-language
// business-meaning sentence. Every sentence here is built from the real component contributions
// `calculateQueryRelevance()` (queryConvergence.js) already returns for that specific atom — never a
// canned string keyed off an atom name or id. If a real deployment adds source-specific component labels
// (e.g. "Customer Journey Rod" instead of the generic "Rod Relationship"), extend this map — don't inline
// a label choice inside the component that renders it.

export const RELEVANCE_COMPONENT_LABELS = Object.freeze({
  directSemanticRelationship: 'Direct Relationship',
  rodRelationship: 'Rod Relationship',
  lineageRelationship: 'Lineage Relationship',
  hierarchyRelationship: 'Hierarchy Context',
  semanticSimilarity: 'Semantic Relationship',
});

// relevanceEntry: the object `calculateQueryRelevance()` returns — { score, band, components: { [key]: { input, weight, contribution } } }.
// Returns only components that actually contributed (contribution > 0), highest first — matches §III's
// "the user must be able to understand where the number came from" requirement without listing zero-value
// noise.
export function describeRelevanceComponents(relevanceEntry) {
  const components = relevanceEntry?.components || {};
  return Object.entries(components)
    .map(([key, value]) => ({ key, label: RELEVANCE_COMPONENT_LABELS[key] || key, contribution: value?.contribution || 0 }))
    .filter((row) => row.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution);
}

// Builds the §XVI Step 5 plain-language sentence from the atom's own top contributing components — never
// a template keyed on the atom's name/type. An atom with no positive component reads as genuinely
// unconnected rather than being given an invented reason.
export function generateElementBusinessMeaning({ atomName, contextLabel, relevanceEntry }) {
  const rows = describeRelevanceComponents(relevanceEntry);
  const bandLabel = relevanceEntry?.band?.label || 'Unclassified';
  if (!rows.length) {
    return `${atomName} has no measurable connection to ${contextLabel} context yet — none of Direct Relationship, Rod Relationship, Lineage Relationship, Hierarchy Context, or Semantic Relationship returned a signal.`;
  }
  const [top, second] = rows;
  const reason = second
    ? `${top.label.toLowerCase()} (+${top.contribution.toFixed(2)}) and ${second.label.toLowerCase()} (+${second.contribution.toFixed(2)})`
    : `${top.label.toLowerCase()} (+${top.contribution.toFixed(2)})`;
  return `${atomName} is classified ${bandLabel} to ${contextLabel} context, driven mainly by ${reason}.`;
}
