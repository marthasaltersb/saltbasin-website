// Canonical capability tag registry.
//
// Tags are sourced from two data models:
//   HandoverOS  — fund operations, portco financial metrics, governance, risk scenarios
//   RevenueEngineOS — Q2R, RevOps, CPQ/CLM, billing, integration stack, assessments
//
// Tags are used to annotate derived field sources in the member profile editor,
// enabling member data inputs to map back to matching capability insights in
// the Salt Basin platform intelligence layer.
//
// Structure:
//   { id, category, label, description, model, metricCode? }
//
//   model: 'handoveros' | 'revenueengineos' | 'both'
//   metricCode: the machine code from HandoverOS METRIC_DEFINITIONS where applicable

// ── Revenue Operations (RevenueEngineOS) ─────────────────────────────────────

const REVENUE_OPERATIONS = [
  { id: 'q2r',                category: 'revenue_operations', label: 'Quote-to-Revenue (Q2R)',          model: 'revenueengineos', description: 'End-to-end revenue workflow from opportunity to collected cash' },
  { id: 'q2r.cpq',            category: 'revenue_operations', label: 'CPQ — Configure Price Quote',     model: 'revenueengineos', description: 'Product configuration, pricing rules, and quoting automation' },
  { id: 'q2r.clm',            category: 'revenue_operations', label: 'CLM — Contract Lifecycle Mgmt',  model: 'revenueengineos', description: 'Contract authoring, redline, approval, execution, and renewal' },
  { id: 'q2r.billing',        category: 'revenue_operations', label: 'Billing & Invoicing',             model: 'revenueengineos', description: 'Invoice generation, exception handling, billing accuracy' },
  { id: 'q2r.collections',    category: 'revenue_operations', label: 'AR / Collections',               model: 'revenueengineos', description: 'Accounts receivable, DSO management, dunning workflows' },
  { id: 'q2r.usage_billing',  category: 'revenue_operations', label: 'Usage-Based Billing (UBB)',       model: 'revenueengineos', description: 'Consumption-based pricing models and metering infrastructure' },
  { id: 'revops',             category: 'revenue_operations', label: 'Revenue Operations',              model: 'revenueengineos', description: 'Cross-functional alignment of Sales, CS, Finance, and Marketing ops' },
  { id: 'revops.process',     category: 'revenue_operations', label: 'RevOps Process Design',           model: 'revenueengineos', description: 'Workflow design, handoff design, SLA definition' },
  { id: 'revops.toolstack',   category: 'revenue_operations', label: 'RevOps Systems & Tools',          model: 'revenueengineos', description: 'CRM, CPQ, ERP, billing, and analytics tool selection and config' },
  { id: 'revops.analytics',   category: 'revenue_operations', label: 'Revenue Analytics',               model: 'revenueengineos', description: 'Pipeline reporting, forecast accuracy, revenue attribution' },
  { id: 'revops.maturity',    category: 'revenue_operations', label: 'RevOps Maturity Assessment',      model: 'revenueengineos', description: 'Diagnostic scoring of RevOps process and systems maturity' },
  { id: 'q2r.readiness',      category: 'revenue_operations', label: 'Q2R Readiness Score',             model: 'revenueengineos', description: 'Structured assessment of Q2R process gaps and readiness' },
];

// ── Financial Intelligence (HandoverOS + RevenueEngineOS) ─────────────────────

const FINANCIAL_INTELLIGENCE = [
  { id: 'financial.arr',       category: 'financial_intelligence', label: 'ARR — Annual Recurring Revenue',  model: 'both',        metricCode: 'ARR',      description: 'Annualized recurring revenue from active contracts' },
  { id: 'financial.ebitda',    category: 'financial_intelligence', label: 'EBITDA',                          model: 'handoveros',  metricCode: 'EBITDA',   description: 'Earnings before interest, taxes, depreciation, amortization' },
  { id: 'financial.ebitda_m',  category: 'financial_intelligence', label: 'EBITDA Margin',                   model: 'handoveros',  metricCode: 'EBITDA_MARGIN', description: 'EBITDA as % of revenue' },
  { id: 'financial.gross_m',   category: 'financial_intelligence', label: 'Gross Margin',                    model: 'handoveros',  metricCode: 'GROSS_MARGIN',  description: '(Revenue − COGS) / Revenue' },
  { id: 'financial.fcf',       category: 'financial_intelligence', label: 'Free Cash Flow',                  model: 'handoveros',  metricCode: 'FCF',      description: 'Operating cash flow minus capex' },
  { id: 'financial.runway',    category: 'financial_intelligence', label: 'Cash Runway',                     model: 'handoveros',  metricCode: 'CASH_RUNWAY', description: 'Cash balance / monthly burn rate in months' },
  { id: 'financial.dso',       category: 'financial_intelligence', label: 'DSO — Days Sales Outstanding',    model: 'handoveros',  metricCode: 'DSO',      description: 'AR / Revenue × Days; efficiency of collections' },
  { id: 'financial.debt_eq',   category: 'financial_intelligence', label: 'Debt-to-Equity Ratio',            model: 'handoveros',  metricCode: 'DEBT_EQUITY', description: 'Total debt / total equity' },
  { id: 'financial.reporting', category: 'financial_intelligence', label: 'Financial Reporting',             model: 'revenueengineos', description: 'Board-ready financial package, LP reporting, management reporting' },
];

// ── SaaS Metrics (HandoverOS) ─────────────────────────────────────────────────

const SAAS_METRICS = [
  { id: 'saas.nrr',           category: 'saas_metrics', label: 'NRR — Net Revenue Retention',     model: 'handoveros',  metricCode: 'NRR',            description: '(Starting ARR + Expansion − Contraction − Churn) / Starting ARR' },
  { id: 'saas.grr',           category: 'saas_metrics', label: 'GRR — Gross Revenue Retention',   model: 'handoveros',  metricCode: 'GRR',            description: '(Starting ARR − Contraction − Churn) / Starting ARR' },
  { id: 'saas.expansion_arr', category: 'saas_metrics', label: 'Expansion ARR',                   model: 'handoveros',  metricCode: 'EXPANSION_ARR',  description: 'ARR increase from upsell and cross-sell to existing customers' },
  { id: 'saas.logo_churn',    category: 'saas_metrics', label: 'Logo Churn',                      model: 'handoveros',  metricCode: 'LOGO_CHURN',     description: 'Churned customers / starting customer count' },
  { id: 'saas.rule_40',       category: 'saas_metrics', label: 'Rule of 40',                      model: 'handoveros',  metricCode: 'RULE_OF_40',     description: 'Revenue growth % + EBITDA margin %' },
  { id: 'saas.magic_num',     category: 'saas_metrics', label: 'Magic Number',                    model: 'handoveros',  metricCode: 'MAGIC_NUMBER',   description: 'Net new ARR × 4 / prior quarter S&M spend' },
];

// ── Fund Operations (HandoverOS) ──────────────────────────────────────────────

const FUND_OPERATIONS = [
  { id: 'fund.aum',       category: 'fund_operations', label: 'AUM — Assets Under Management',  model: 'handoveros', metricCode: 'AUM',         description: 'Total assets under management across active funds' },
  { id: 'fund.moic',      category: 'fund_operations', label: 'MOIC — Multiple on Invested Capital', model: 'handoveros', metricCode: 'MOIC',    description: 'Total value / invested capital' },
  { id: 'fund.irr',       category: 'fund_operations', label: 'IRR — Internal Rate of Return',   model: 'handoveros', metricCode: 'IRR',        description: 'Annualized return rate on fund investments' },
  { id: 'fund.tvpi',      category: 'fund_operations', label: 'TVPI — Total Value to Paid-In',   model: 'handoveros', metricCode: 'TVPI',       description: '(Distributed + Residual) / Paid-In Capital' },
  { id: 'fund.dpi',       category: 'fund_operations', label: 'DPI — Distributions to Paid-In', model: 'handoveros', metricCode: 'DPI',        description: 'Cash distributed to LPs / Paid-In Capital' },
  { id: 'fund.carry',     category: 'fund_operations', label: 'Carried Interest',                model: 'handoveros', metricCode: 'CARRY_ACCRUED', description: 'GP carry earned — accrued and/or distributed' },
  { id: 'fund.waterfall', category: 'fund_operations', label: 'Distribution Waterfall',          model: 'handoveros', description: 'Fund distribution methodology: European, American, or tiered carry' },
  { id: 'fund.portco',    category: 'fund_operations', label: 'Portfolio Company Monitoring',    model: 'handoveros', description: 'Portco KPI collection, data ingestion, board reporting' },
];

// ── Operational Risk (HandoverOS) ─────────────────────────────────────────────

const OPERATIONAL_RISK = [
  { id: 'risk.invoice_exc',   category: 'operational_risk', label: 'Invoice Exception Rate',       model: 'handoveros', metricCode: 'INVOICE_EXCEPTION_RATE', description: 'Exception invoices / total invoices' },
  { id: 'risk.billing_acc',   category: 'operational_risk', label: 'Billing Accuracy',              model: 'handoveros', metricCode: 'BILLING_ACCURACY',      description: 'Accurate invoices / total invoices' },
  { id: 'risk.price_real',    category: 'operational_risk', label: 'Price Realization',             model: 'handoveros', metricCode: 'PRICE_REALIZATION',     description: 'Actual price / list or contract price' },
  { id: 'risk.rev_leakage',   category: 'operational_risk', label: 'Revenue Leakage',               model: 'both',       description: 'Identified gap between contracted and collected revenue' },
  { id: 'risk.price_esc',     category: 'operational_risk', label: 'Price Escalation Risk',         model: 'handoveros', description: 'Contracts renewed without applying price escalation clauses' },
  { id: 'risk.usage_tier',    category: 'operational_risk', label: 'Usage Tier Mismatch',           model: 'handoveros', description: 'Billing tiers misaligned against actual product usage' },
  { id: 'risk.amendment',     category: 'operational_risk', label: 'Amendment-Billing Divergence',  model: 'handoveros', description: 'Contract amendments not reflected in billing system' },
  { id: 'risk.discount',      category: 'operational_risk', label: 'Expired Discount Risk',         model: 'handoveros', description: 'Discounts billed after expiry date' },
  { id: 'risk.churn_div',     category: 'operational_risk', label: 'Churn Rate Divergence',         model: 'handoveros', description: 'Churn definition or attribution inconsistency vs plan' },
  { id: 'risk.renewal_uplift',category: 'operational_risk', label: 'Missed Renewal Uplift',         model: 'handoveros', description: 'Renewal processed at flat rate without contractual uplift' },
];

// ── Governance & Data Quality (HandoverOS) ────────────────────────────────────

const GOVERNANCE = [
  { id: 'gov.confidence',    category: 'governance', label: 'Confidence Score',      model: 'handoveros', metricCode: 'CONFIDENCE_SCORE',    description: 'Weighted composite of data quality and reconciliation coverage' },
  { id: 'gov.completeness',  category: 'governance', label: 'Data Completeness',     model: 'handoveros', metricCode: 'DATA_COMPLETENESS',   description: 'Populated required fields / total required fields' },
  { id: 'gov.recon',         category: 'governance', label: 'Reconciliation Variance',model: 'handoveros', metricCode: 'RECON_VARIANCE',      description: 'Difference between same metric across sources' },
  { id: 'gov.data_readiness',category: 'governance', label: 'Data Readiness',         model: 'both',       description: 'Structured assessment of data infrastructure readiness for reporting or AI' },
  { id: 'gov.ai_readiness',  category: 'governance', label: 'AI Adoption Readiness',  model: 'revenueengineos', description: 'Assessment of data, process, and org readiness for AI tooling' },
];

// ── Systems Integration (RevenueEngineOS) ────────────────────────────────────

const SYSTEMS_INTEGRATION = [
  { id: 'int.salesforce',  category: 'systems_integration', label: 'Salesforce',             model: 'revenueengineos', description: 'CRM, CPQ, Billing, Service Cloud configuration and customization' },
  { id: 'int.netsuite',    category: 'systems_integration', label: 'NetSuite ERP',            model: 'revenueengineos', description: 'Financial, inventory, and order management on NetSuite' },
  { id: 'int.sap',         category: 'systems_integration', label: 'SAP',                    model: 'revenueengineos', description: 'SAP ERP/S4HANA financial and operational modules' },
  { id: 'int.oracle',      category: 'systems_integration', label: 'Oracle',                 model: 'revenueengineos', description: 'Oracle ERP, Fusion, and revenue management modules' },
  { id: 'int.adaptive',    category: 'systems_integration', label: 'Adaptive Insights (Workday)', model: 'revenueengineos', description: 'FP&A, budgeting, and forecasting on Adaptive/Workday' },
  { id: 'int.quickbooks',  category: 'systems_integration', label: 'QuickBooks',             model: 'revenueengineos', description: 'SMB accounting, AP/AR, and financial reporting' },
  { id: 'int.hubspot',     category: 'systems_integration', label: 'HubSpot',                model: 'revenueengineos', description: 'CRM, marketing automation, and pipeline management' },
  { id: 'int.architecture',category: 'systems_integration', label: 'Integration Architecture', model: 'revenueengineos', description: 'System-to-system integration design, API, middleware, iPaaS' },
  { id: 'int.erp',         category: 'systems_integration', label: 'ERP (General)',           model: 'revenueengineos', description: 'Enterprise resource planning platform administration and optimization' },
];

// ── Operator Profile Attributes ───────────────────────────────────────────────

const OPERATOR_PROFILE = [
  { id: 'profile.expertise',       category: 'operator_profile', label: 'Domain Expertise',         model: 'both', description: "Operator's primary skill domains and depth of experience" },
  { id: 'profile.industries',      category: 'operator_profile', label: 'Industry Experience',      model: 'both', description: 'Sectors the operator has worked in (SaaS, Healthcare IT, Logistics, etc.)' },
  { id: 'profile.engagement',      category: 'operator_profile', label: 'Engagement Model',         model: 'revenueengineos', description: 'How the operator engages: Sprint, Embedded, Advisory' },
  { id: 'profile.assessments',     category: 'operator_profile', label: 'Assessment Capabilities',  model: 'revenueengineos', description: 'Structured diagnostic and readiness assessment offerings' },
  { id: 'profile.case_studies',    category: 'operator_profile', label: 'Case Studies',             model: 'both', description: 'Documented client outcomes with challenge, approach, and result' },
  { id: 'profile.references',      category: 'operator_profile', label: 'References',               model: 'both', description: "Validated contacts who can speak to the operator's work" },
  { id: 'profile.certifications',  category: 'operator_profile', label: 'Certifications & Credentials', model: 'revenueengineos', description: 'Platform certifications, credentials, and professional designations' },
];

// ── Registry exports ──────────────────────────────────────────────────────────

export const ALL_TAGS = [
  ...REVENUE_OPERATIONS,
  ...FINANCIAL_INTELLIGENCE,
  ...SAAS_METRICS,
  ...FUND_OPERATIONS,
  ...OPERATIONAL_RISK,
  ...GOVERNANCE,
  ...SYSTEMS_INTEGRATION,
  ...OPERATOR_PROFILE,
];

export const TAG_CATEGORIES = [
  { id: 'revenue_operations',    label: 'Revenue Operations',        tags: REVENUE_OPERATIONS },
  { id: 'financial_intelligence',label: 'Financial Intelligence',    tags: FINANCIAL_INTELLIGENCE },
  { id: 'saas_metrics',          label: 'SaaS Metrics',              tags: SAAS_METRICS },
  { id: 'fund_operations',       label: 'Fund Operations',           tags: FUND_OPERATIONS },
  { id: 'operational_risk',      label: 'Operational Risk',          tags: OPERATIONAL_RISK },
  { id: 'governance',            label: 'Governance & Data Quality', tags: GOVERNANCE },
  { id: 'systems_integration',   label: 'Systems Integration',       tags: SYSTEMS_INTEGRATION },
  { id: 'operator_profile',      label: 'Operator Profile',          tags: OPERATOR_PROFILE },
];

// Lookup by id
export const TAG_BY_ID = Object.fromEntries(ALL_TAGS.map((t) => [t.id, t]));

// Source type definitions with display metadata
export const SOURCE_TYPES = {
  user_input: {
    label: 'User Input',
    description: 'User provides this value directly — no defaults or system sources.',
    color: '#C4843A',
    short: 'UI',
  },
  merged: {
    label: 'Merged',
    description: 'Defaults from an existing system value. Updates automatically when the source changes.',
    color: '#A8B89A',
    short: 'M',
  },
  derived: {
    label: 'Derived',
    description: 'Computed from multiple internal and/or external sources with defined logic.',
    color: '#4A9EBF',
    short: 'D',
  },
  direct: {
    label: 'Direct',
    description: 'Read directly from a source system — display only, not manually edited.',
    color: '#8B9BAE',
    short: 'DR',
  },
};

// Known merged field mappings — auto-set when member profile is created.
// Maps section field paths to their internal source.
export const MERGED_FIELD_DEFAULTS = [
  { blockType: 'hero',    fieldKey: 'heading',   mergedFrom: 'users.display_name',      description: 'Defaults from display name set at signup' },
  { blockType: 'hero',    fieldKey: 'ownerName', mergedFrom: 'config.site.ownerName',   description: 'Defaults from site config owner name' },
  { blockType: 'contact', fieldKey: 'email',     mergedFrom: 'users.email',             description: 'Defaults from primary signup email' },
];
