const n = (value) => Number(value || 0);

export const evaluateFormula = (node, variables) => {
  if (node.op === 'literal') return node.value;
  if (node.op === 'variable') return n(variables[node.key]);
  if (node.op === 'add') return node.args.reduce((sum, item) => sum + evaluateFormula(item, variables), 0);
  if (node.op === 'subtract') return evaluateFormula(node.left, variables) - evaluateFormula(node.right, variables);
  if (node.op === 'multiply') return node.args.reduce((product, item) => product * evaluateFormula(item, variables), 1);
  if (node.op === 'divide') {
    const denominator = evaluateFormula(node.denominator, variables);
    return denominator === 0 ? null : evaluateFormula(node.numerator, variables) / denominator;
  }
  if (node.op === 'annualize') return evaluateFormula(node.value, variables) * (12 / n(node.periodMonths || 1));
  if (node.op === 'sum') return (variables[node.collection] || []).reduce((sum, row) => sum + n(row[node.field]), 0);
  throw new Error(`Unsupported formula operation: ${node.op}`);
};

const annualContractValue = { op: 'sum', collection: 'eligible_contract_lines', field: 'annualized_value' };

export const ARR_DEFINITION = {
  metricId: 'metric.revenue.arr', metricKey: 'arr', displayName: 'Annual Recurring Revenue',
  family: 'saas_recurring_revenue', subfamily: 'recurring_revenue', unit: 'currency', timeGrain: 'point_in_time',
  economicDefinition: 'Annualized recurring contract value in force at the measurement date under the selected eligibility policy.',
  businessQuestion: 'What recurring revenue run-rate is economically supported at this point in time?',
  directionality: 'higher_is_generally_better', calculationVersion: '1.0.0',
  variables: [
    { key: 'eligible_contract_lines', meaning: 'Recurring contract lines satisfying the selected variant eligibility policy.', grain: 'contract_line_as_of_date', preferredSources: ['subscription_billing', 'crm_contracts'], accountingTags: ['RECURRING_REVENUE'] },
  ],
  variants: [
    { key: 'committed_arr', label: 'Committed ARR', priority: 10, predicate: { includeSignedNotLive: true }, formula: annualContractValue, policy: 'Signed, non-cancelled recurring contract lines, including future commencement.' },
    { key: 'live_arr', label: 'Live ARR', priority: 20, predicate: { requireLive: true }, formula: annualContractValue, policy: 'Recurring contract lines whose service has commenced and not ended.' },
    { key: 'billed_arr', label: 'Billed ARR', priority: 30, predicate: { requireBilled: true }, formula: annualContractValue, policy: 'Recurring value represented by active billing schedules.' },
    { key: 'exit_arr', label: 'Exit ARR', priority: 40, predicate: { measurementDate: 'period_end' }, formula: annualContractValue, policy: 'Live ARR measured on the final day of the reporting period.' },
  ],
};

const v = (key) => ({ op: 'variable', key });
const add = (...args) => ({ op: 'add', args });
const sub = (left, right) => ({ op: 'subtract', left, right });
const div = (numerator, denominator) => ({ op: 'divide', numerator, denominator });
const metric = (key, name, family, economicDefinition, businessQuestion, formula, variables, unit = 'currency') => ({
  metricId: `metric.${family}.${key}`, metricKey: key, displayName: name, family, subfamily: family,
  economicDefinition, businessQuestion, unit, timeGrain: 'reporting_period', calculationVersion: '1.0.0',
  variables: variables.map((key) => ({ key, meaning: key.replaceAll('_', ' '), grain: 'entity_reporting_period', preferredSources: ['general_ledger', 'finance_model'], accountingTags: [key.toUpperCase()] })),
  variants: [{ key: 'canonical', label: 'Canonical', priority: 1, predicate: {}, formula, policy: economicDefinition }],
});

export const CORE_METRICS = [ARR_DEFINITION,
  metric('gross_profit', 'Gross Profit', 'profit_and_loss', 'Revenue remaining after direct cost of goods and services.', 'How much profit remains after direct delivery costs?', sub(v('net_revenue'), v('cogs')), ['net_revenue', 'cogs']),
  metric('gross_margin', 'Gross Margin', 'profit_and_loss', 'Gross profit as a proportion of net revenue.', 'What share of revenue remains after direct costs?', div(v('gross_profit'), v('net_revenue')), ['gross_profit', 'net_revenue'], 'ratio'),
  metric('ebitda', 'EBITDA', 'profit_and_loss', 'Operating earnings before interest, taxes, depreciation, and amortization.', 'What operating earnings does the business produce before capital structure and non-cash D&A?', add(v('ebit'), v('depreciation'), v('amortization')), ['ebit', 'depreciation', 'amortization']),
  metric('free_cash_flow', 'Free Cash Flow', 'cash_conversion', 'Cash generated after operating cash flow and capital expenditures.', 'How much cash remains after funding operations and capital investment?', sub(v('operating_cash_flow'), v('capital_expenditures')), ['operating_cash_flow', 'capital_expenditures']),
  metric('net_debt', 'Net Debt', 'leverage_debt', 'Interest-bearing gross debt less unrestricted cash and cash equivalents.', 'What debt remains after available cash is applied?', sub(v('gross_debt'), v('unrestricted_cash')), ['gross_debt', 'unrestricted_cash']),
  metric('net_debt_to_ebitda', 'Net Debt to EBITDA', 'leverage_debt', 'Net debt divided by trailing-twelve-month adjusted EBITDA.', 'How many years of current EBITDA are represented by net debt?', div(v('net_debt'), v('ttm_adjusted_ebitda')), ['net_debt', 'ttm_adjusted_ebitda'], 'multiple'),
  metric('enterprise_value', 'Enterprise Value', 'enterprise_value_returns', 'Equity value plus net debt and other debt-like claims less non-operating assets.', 'What is the value of the operating enterprise independent of financing mix?', add(v('equity_value'), v('net_debt'), v('debt_like_items'), { op: 'multiply', args: [{ op: 'literal', value: -1 }, v('non_operating_assets')] }), ['equity_value', 'net_debt', 'debt_like_items', 'non_operating_assets']),
  metric('moic', 'Multiple on Invested Capital', 'fund_performance', 'Total realized and unrealized investment value divided by invested capital.', 'How many dollars of value exist for each dollar invested?', div(add(v('realized_value'), v('unrealized_value')), v('invested_capital')), ['realized_value', 'unrealized_value', 'invested_capital'], 'multiple'),
  metric('net_revenue_retention', 'Net Revenue Retention', 'saas_recurring_revenue', 'Ending recurring revenue from the opening customer cohort divided by its opening recurring revenue.', 'How well does the installed base retain and expand recurring revenue?', div(sub(add(v('opening_arr'), v('expansion_arr')), add(v('contraction_arr'), v('churned_arr'))), v('opening_arr')), ['opening_arr', 'expansion_arr', 'contraction_arr', 'churned_arr'], 'ratio'),
];

export const METRIC_DEPENDENCIES = CORE_METRICS.flatMap((definition) => definition.variants.flatMap((variant) => {
  const keys = [];
  const walk = (node) => { if (!node) return; if (node.op === 'variable') keys.push(node.key); Object.values(node).forEach((value) => { if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value); }); };
  walk(variant.formula);
  return keys.filter((key) => CORE_METRICS.some((candidate) => candidate.metricKey === key)).map((key) => ({ from: key, to: definition.metricKey }));
}));

export const resolveVariant = (metric, requestedVariant = 'live_arr') => {
  const variant = metric.variants.find((item) => item.key === requestedVariant);
  if (!variant) throw new Error(`Unknown ${metric.metricKey} variant: ${requestedVariant}`);
  return variant;
};

export const calculateMetric = ({ metric = ARR_DEFINITION, variantKey, variables, asOf = Date.now() }) => {
  const variant = resolveVariant(metric, variantKey);
  const value = evaluateFormula(variant.formula, variables);
  return { metricId: metric.metricId, metricKey: metric.metricKey, variantKey: variant.key, value, unit: metric.unit,
    asOf, calculationVersion: metric.calculationVersion, formula: variant.formula, inputs: variables,
    confidence: variables.sourceConfidence ?? 1, methodology: variant.policy };
};

export const analyzeChange = (current, prior) => {
  const change = n(current.value) - n(prior.value);
  const rate = n(prior.value) === 0 ? null : change / n(prior.value);
  const currentDrivers = current.inputs.drivers || {};
  const priorDrivers = prior.inputs.drivers || {};
  const keys = new Set([...Object.keys(currentDrivers), ...Object.keys(priorDrivers)]);
  const drivers = [...keys].map((key) => ({ key, contribution: n(currentDrivers[key]) - n(priorDrivers[key]) }));
  const explained = drivers.reduce((sum, item) => sum + item.contribution, 0);
  return { change, rate, drivers, unexplained: change - explained,
    classification: current.calculationVersion === prior.calculationVersion ? 'economic' : 'methodology',
    explanation: change >= 0 ? `ARR increased by ${change}.` : `ARR decreased by ${Math.abs(change)}.` };
};

export const classifyChangeEvent = ({ current, prior, context = {} }) => {
  const reasons = [];
  if (current.calculationVersion !== prior.calculationVersion) reasons.push('formula_methodology');
  if (context.accountMappingChanged) reasons.push('accounting_mapping');
  if (context.sourceSystemChanged) reasons.push('source_system');
  if (context.contractModification) reasons.push('economic_contract');
  if (context.recognitionTimingChanged) reasons.push('timing');
  if (context.dataCorrection) reasons.push('data_correction');
  if (!reasons.length && n(current.value) !== n(prior.value)) reasons.push('economic');
  return { eventType: reasons[0] || 'no_change', contributingClassifications: reasons,
    isEconomic: reasons.some((reason) => reason === 'economic' || reason === 'economic_contract'),
    isDefinitional: reasons.includes('formula_methodology'), valueChange: n(current.value) - n(prior.value) };
};

// Pricing economics are calculated from underlying usage events and governed
// tier terms. Progressive tiers price each band independently; retroactive
// tiers price all units at the attained tier's rate.
export const calculateUsageCharge = ({ quantity, tiers, mode = 'progressive', minimumCommitment = 0 }) => {
  const units = Math.max(0, n(quantity));
  const ordered = [...tiers].sort((a, b) => a.from - b.from);
  let usageCharge = 0;
  if (mode === 'retroactive') {
    const attained = [...ordered].reverse().find((tier) => units >= tier.from) || ordered[0];
    usageCharge = units * n(attained?.rate);
  } else if (mode === 'progressive') {
    for (const tier of ordered) {
      const upper = tier.to == null ? units : Math.min(units, tier.to);
      const tierUnits = Math.max(0, upper - tier.from);
      usageCharge += tierUnits * n(tier.rate);
    }
  } else throw new Error(`Unknown tier mode: ${mode}`);
  const billedCharge = Math.max(usageCharge, n(minimumCommitment));
  return { quantity: units, mode, usageCharge, minimumCommitment: n(minimumCommitment), billedCharge,
    minimumCommitmentShortfall: Math.max(0, n(minimumCommitment) - usageCharge) };
};

export const DEMO_ARR = {
  prior: { eligible_contract_lines: [{ annualized_value: 900000 }], drivers: { opening_arr: 900000 }, sourceConfidence: 0.98 },
  current: { eligible_contract_lines: [{ annualized_value: 1080000 }], drivers: { opening_arr: 900000, new_arr: 120000, expansion_arr: 90000, contraction_arr: -20000, churned_arr: -10000 }, sourceConfidence: 0.98 },
};

export const serializeDefinition = (metric) => ({
  metricId: metric.metricId, metricKey: metric.metricKey, displayName: metric.displayName,
  family: metric.family, subfamily: metric.subfamily, definition: metric,
  calculationVersion: metric.calculationVersion,
});
