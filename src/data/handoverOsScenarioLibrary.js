export const HOS_EDGE_CASES = [
  { id: 'manual_approvals', label: 'Approvals happen in email or chat', categories: ['salesPipeline', 'contractExecution'], risk: 'Approval evidence and cycle time may be fragmented.' },
  { id: 'custom_terms', label: 'Non-standard pricing or contract terms are common', categories: ['contractExecution', 'billingTrack'], risk: 'Commercial exceptions may not reach billing and revenue operations consistently.' },
  { id: 'split_accounts', label: 'Sold-to, bill-to, or fulfillment accounts differ', categories: ['contractExecution', 'billingTrack', 'collections'], risk: 'Account-role mismatch can create invoicing, entitlement, or collections exceptions.' },
  { id: 'usage_pricing', label: 'Usage, overage, or consumption pricing applies', categories: ['metering', 'billingTrack'], risk: 'Meter-to-bill completeness and late-arriving usage may be material.' },
  { id: 'multi_currency', label: 'Multiple currencies or legal entities apply', categories: ['billingTrack', 'revenueRecognition'], risk: 'Entity, currency, tax, and accounting treatment may diverge across handoffs.' },
  { id: 'renewal_changes', label: 'Renewals frequently include amendments or repricing', categories: ['salesPipeline', 'contractExecution', 'revenueRecognition'], risk: 'Renewal baselines and amendment lineage may be difficult to reconcile.' },
  { id: 'manual_collections', label: 'Collections prioritization is mostly manual', categories: ['collections'], risk: 'Dispute reasons and collection effort may not be tied back to upstream causes.' },
  { id: 'system_reentry', label: 'Teams re-enter the same data in multiple systems', categories: ['salesPipeline', 'contractExecution', 'metering', 'billingTrack'], risk: 'Duplicate entry increases timing, ownership, and definition mismatch risk.' },
];

export function compileHosScenarioInsights(categories, values, selectedEdgeCases) {
  const selected = HOS_EDGE_CASES.filter((edge) => selectedEdgeCases.includes(edge.id));
  return categories.map((category) => {
    const inputValue = Number(values[category.key]) || 0;
    const relevant = selected.filter((edge) => edge.categories.includes(category.key));
    const baselinePct = Number(category.defaultExposurePct) || 0;
    const scenarioPct = baselinePct + Math.min(6, relevant.length * 1.25);
    return { key: category.key, label: category.label, inputValue, baselinePct, scenarioPct,
      exposure: inputValue * scenarioPct / 100,
      confidence: relevant.length ? 'CONTEXTUAL_HYPOTHESIS' : 'BASELINE_ONLY',
      scenarios: relevant.map((edge) => edge.label), riskMappings: relevant.map((edge) => edge.risk) };
  });
}
