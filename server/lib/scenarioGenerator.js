// L2 scenario matrix generator (master prompt §26 / HOS methodology doc,
// docs/salt-basin-hos-journey-methodology.md line 75): "L2 scenarios are
// generated from dimensional variables ... rather than hand-authored one at
// a time. The proliferated scenario library targets ~2,400+ combinations as
// a starting matrix." No such generator existed anywhere in this codebase —
// `journey_scenarios` (server/db.js) is a real, empty table. This module is
// the generator; DRAFT_DIMENSION_DEFINITIONS below is placeholder value data
// (flagged DRAFT, not a business-approved catalog) so the combinatorics are
// demonstrable without inventing Betsy's real segment/pricing/industry
// taxonomy on her behalf — replace its value arrays with the real catalog to
// reach production scale.

// One dimension: { key, label, values: string[] }. Cross-product of every
// dimension's values is the scenario matrix — this is what makes the count
// scale (or shrink) with the real business taxonomy instead of ten demo rows.
export const DRAFT_DIMENSION_DEFINITIONS = [
  { key: 'segment', label: 'Customer segment', values: ['smb', 'strategic', 'enterprise'] },
  { key: 'productType', label: 'Product type', values: ['platform', 'services', 'usage_addon'] },
  { key: 'pricingModel', label: 'Pricing model', values: ['fixed_subscription', 'tiered_usage', 'included_usage_overage', 'volume', 'revenue_share'] },
  { key: 'contractStructure', label: 'Contract structure', values: ['single_entity', 'parent_master_agreement', 'multi_entity_rollup'] },
  { key: 'billToPattern', label: 'Sold-To/Bill-To/Fulfill-To pattern', values: ['unified', 'split_billing', 'split_fulfillment'] },
  { key: 'billingFrequency', label: 'Billing frequency', values: ['monthly', 'quarterly', 'annual'] },
  { key: 'billingTiming', label: 'Billing timing', values: ['advance', 'arrears'] },
  { key: 'paymentMethod', label: 'Payment method / collection', values: ['card', 'ach', 'invoice_net_terms'] },
  { key: 'renewalModel', label: 'Renewal behavior', values: ['auto_renew', 'manual_renew', 'evergreen'] },
  { key: 'industry', label: 'Industry', values: ['general'] },
];

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// Cross-product of every dimension's values. dimensionDefinitions:
// [{ key, label, values }]. Returns [{ scenarioKey, rodType, label, dimensions: { [key]: value } }].
export function generateScenarioMatrix(dimensionDefinitions, { rodType = 'revenue_lifecycle' } = {}) {
  if (!dimensionDefinitions?.length) return [];

  let combinations = [{}];
  for (const dimension of dimensionDefinitions) {
    const next = [];
    for (const partial of combinations) {
      for (const value of dimension.values) next.push({ ...partial, [dimension.key]: value });
    }
    combinations = next;
  }

  return combinations.map((dimensions) => {
    const scenarioKey = [rodType, ...dimensionDefinitions.map((d) => slug(dimensions[d.key]))].join('__');
    const label = dimensionDefinitions.map((d) => dimensions[d.key]).join(' / ');
    return { scenarioKey, rodType, label, dimensions };
  });
}

export function estimateMatrixSize(dimensionDefinitions) {
  return dimensionDefinitions.reduce((total, dimension) => total * dimension.values.length, 1);
}
