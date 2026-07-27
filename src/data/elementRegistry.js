// The periodic table of the Spatial Journey World: field datatypes / semantic
// primitives, defined once and reused by every atom on every rod template.
// An element is NOT a business concept — "Bill-To Party Definition" is an
// atom, built from the PartyIdentifier element plus bounded meaning,
// temporal/security/evidence context (see journeyWorldConfig.js). Elements
// only carry: a datatype category, and — for controlled-vocabulary types —
// a pre-approved set of value states (`allowedValues`), the way a real
// element carries fixed atomic properties.
//
// Never inline an ad hoc field shape on an atom. Add or reuse an element
// here first.

export const ELEMENT_CATEGORY = {
  IDENTITY: 'identity',
  PARTY: 'party',
  MONEY: 'money',
  TIME: 'time',
  RATE: 'rate',
  TERMS: 'terms',
  CONTACT: 'contact',
  DOCUMENT: 'document',
  STATE: 'state',
  TEXT: 'text',
};

export const ELEMENT_REGISTRY = {
  PartyIdentifier: {
    elementId: 'PartyIdentifier', symbol: 'Pty', name: 'Party Identifier',
    category: ELEMENT_CATEGORY.PARTY,
    defaultVisualHints: { facetBias: 0.1 },
  },
  PartyRoleEnum: {
    elementId: 'PartyRoleEnum', symbol: 'Rol', name: 'Party Role',
    category: ELEMENT_CATEGORY.PARTY,
    allowedValues: ['bill-to', 'ship-to', 'sold-to', 'signatory', 'financing-party'],
  },
  OrgIdentifier: {
    elementId: 'OrgIdentifier', symbol: 'Org', name: 'Organization Identifier',
    category: ELEMENT_CATEGORY.PARTY,
  },
  CurrencyAmount: {
    elementId: 'CurrencyAmount', symbol: 'Amt', name: 'Currency Amount',
    category: ELEMENT_CATEGORY.MONEY,
    defaultVisualHints: { metalnessBias: 0.15 },
  },
  PercentageRate: {
    elementId: 'PercentageRate', symbol: 'Pct', name: 'Percentage Rate',
    category: ELEMENT_CATEGORY.RATE,
  },
  EffectiveDate: {
    elementId: 'EffectiveDate', symbol: 'Dte', name: 'Effective Date',
    category: ELEMENT_CATEGORY.TIME,
  },
  DurationTerm: {
    elementId: 'DurationTerm', symbol: 'Trm', name: 'Duration Term',
    category: ELEMENT_CATEGORY.TIME,
  },
  EmailAddress: {
    elementId: 'EmailAddress', symbol: 'Eml', name: 'Email Address',
    category: ELEMENT_CATEGORY.CONTACT,
  },
  EmailKindEnum: {
    elementId: 'EmailKindEnum', symbol: 'EKd', name: 'Email Kind',
    category: ELEMENT_CATEGORY.CONTACT,
    allowedValues: ['personal', 'work'],
  },
  PricingModelEnum: {
    elementId: 'PricingModelEnum', symbol: 'Prc', name: 'Pricing Model',
    category: ELEMENT_CATEGORY.TERMS,
    allowedValues: ['flat-rate', 'tiered', 'usage-based'],
  },
  BillingCadenceEnum: {
    elementId: 'BillingCadenceEnum', symbol: 'Bil', name: 'Billing Cadence',
    category: ELEMENT_CATEGORY.TERMS,
    allowedValues: ['monthly', 'quarterly', 'annual', 'upfront'],
  },
  SegmentEnum: {
    elementId: 'SegmentEnum', symbol: 'Seg', name: 'Customer Segment',
    category: ELEMENT_CATEGORY.TERMS,
    allowedValues: ['smb', 'mid-market', 'strategic', 'portfolio-company'],
  },
  DocumentVersionRef: {
    elementId: 'DocumentVersionRef', symbol: 'Vrs', name: 'Document Version Reference',
    category: ELEMENT_CATEGORY.DOCUMENT,
  },
  ApprovalStateEnum: {
    elementId: 'ApprovalStateEnum', symbol: 'Apr', name: 'Approval State',
    category: ELEMENT_CATEGORY.STATE,
    allowedValues: ['pending', 'approved', 'merged', 'rejected'],
  },
  AccessScopeEnum: {
    elementId: 'AccessScopeEnum', symbol: 'Scp', name: 'Access Scope',
    category: ELEMENT_CATEGORY.STATE,
    allowedValues: ['personal', 'org'],
  },
  ConfidenceScore: {
    elementId: 'ConfidenceScore', symbol: 'Cnf', name: 'Confidence Score',
    category: ELEMENT_CATEGORY.STATE,
  },
  SourceSystemRef: {
    elementId: 'SourceSystemRef', symbol: 'Src', name: 'Source System Reference',
    category: ELEMENT_CATEGORY.DOCUMENT,
  },
  FreeTextNote: {
    elementId: 'FreeTextNote', symbol: 'Txt', name: 'Free Text Note',
    category: ELEMENT_CATEGORY.TEXT,
  },
};

export function getElement(elementId) {
  return ELEMENT_REGISTRY[elementId] || null;
}

// Validates a candidate value against an element's pre-approved value states.
// Elements without `allowedValues` are open datatypes (always valid here) —
// this only enforces controlled vocabularies.
export function isAllowedValue(elementId, value) {
  const element = getElement(elementId);
  if (!element || !element.allowedValues) return true;
  return element.allowedValues.includes(value);
}
