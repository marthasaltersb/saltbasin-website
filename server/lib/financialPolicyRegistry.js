export const DATA_SCOPES = Object.freeze([
  'MEMBER_PRIVATE',
  'MEMBER_PUBLIC',
  'ORGANIZATION_PRIVATE',
  'ORGANIZATION_SHARED',
  'CROSS_ORGANIZATION_AUTHORIZED',
  'PUBLIC',
]);

export const FINANCIAL_CONNECTION_POLICIES = Object.freeze({
  member_private_v1: Object.freeze({
    securityPolicyId: 'member-financial-private-v1',
    retentionPolicyId: 'member-financial-consent-v1',
    defaultScope: 'MEMBER_PRIVATE',
    permittedAccountClasses: Object.freeze([
      'checking', 'savings', 'money_market', 'credit_card',
      'personal_loan', 'unsecured_line_of_credit', 'other',
    ]),
    liabilityByAccountClass: Object.freeze({
      checking: 'not_applicable', savings: 'not_applicable', money_market: 'not_applicable',
      credit_card: 'unsecured', personal_loan: 'unknown',
      unsecured_line_of_credit: 'unsecured', other: 'unknown',
    }),
    experience: Object.freeze({
      kicker: 'Member-private by default',
      title: 'Financial Connections',
      privacyNotice: 'Organization Admin access never grants access to these accounts. Only a derived output you explicitly authorize can be shared with an Organization.',
      credentialsNotice: 'Credentials and raw provider tokens are never stored as Evidence Atoms.',
      defaultProviderId: 'manual_reference',
      defaultPermittedAccountClasses: Object.freeze(['checking', 'savings']),
    }),
  }),
});

export const FINANCIAL_PROVIDERS = Object.freeze({
  manual_reference: Object.freeze({
    providerId: 'manual_reference',
    connectionType: 'reference_only',
    storesCredentials: false,
    label: 'Manual reference',
    sortOrder: 10,
    supportedAccountClasses: FINANCIAL_CONNECTION_POLICIES.member_private_v1.permittedAccountClasses,
  }),
  plaid: Object.freeze({
    providerId: 'plaid',
    connectionType: 'consumer_aggregation',
    storesCredentials: false,
    label: 'Plaid',
    sortOrder: 20,
    supportedAccountClasses: FINANCIAL_CONNECTION_POLICIES.member_private_v1.permittedAccountClasses,
    availability: 'configuration_required',
  }),
});

export const FINANCIAL_SHARE_OUTPUT_TYPES = Object.freeze({
  cash_liquidity_summary: Object.freeze({ label: 'Cash liquidity summary', dataScope: 'ORGANIZATION_SHARED' }),
  unsecured_debt_summary: Object.freeze({ label: 'Unsecured debt summary', dataScope: 'ORGANIZATION_SHARED' }),
  credit_health_summary: Object.freeze({ label: 'Credit health summary', dataScope: 'ORGANIZATION_SHARED' }),
  reimbursement_summary: Object.freeze({ label: 'Reimbursement summary', dataScope: 'ORGANIZATION_SHARED' }),
});

export function resolveFinancialProvider(providerId) {
  return FINANCIAL_PROVIDERS[providerId] || null;
}

export function classifyLiability(accountClass, requested) {
  const policy = FINANCIAL_CONNECTION_POLICIES.member_private_v1;
  const expected = policy.liabilityByAccountClass[accountClass];
  if (!expected) return null;
  if (accountClass === 'personal_loan') {
    return ['secured', 'unsecured', 'unknown'].includes(requested) ? requested : 'unknown';
  }
  return expected;
}
