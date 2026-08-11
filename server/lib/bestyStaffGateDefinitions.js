import { classifyEmailDomain } from './emailDomain.js';

export const DEFAULT_BESTYSTAFF_GATE_DEFINITIONS = Object.freeze({
  version: 1,
  sequence: ['relationship', 'primary_email', 'captcha', 'context_consent', 'discovery', 'registration_pledge'],
  metadata: {
    stageGateFields: ['interestArea', 'kind', 'emailDomainKind', 'emailFormatValid', 'primaryEmailVerified', 'captchaPassed', 'workEmailManualValidation', 'isBuyer', 'decisionRole', 'engagementType', 'pledgeInterest', 'earlyRegistration', 'contractOutputReady'],
    contextFields: ['knowsBetsy', 'knowsBetsyDetail', 'topQuestions', 'businessNeed', 'desiredOutcome', 'urgency', 'budgetRange', 'nextStep', 'notes', 'customerSignals', 'quotes', 'openQuestions'],
  },
  email: {
    verificationRequired: true,
    minimumVerifiedForConversion: 1,
    career: { requiredType: 'personal', acceptedDomainKinds: ['consumer'], customDomainFallback: 'request_personal_email' },
    b2b: { requiredType: 'work', acceptedDomainKinds: ['custom'], consumerDomainFallback: 'manual_validation' },
  },
  intents: {
    career: ['career_portfolio', 'build_own'],
    b2b: ['hire_salt_basin', 'b2b_product', 'lead_to_cash', 'operator_network', 'request_betsy'],
  },
  conversion: {
    career: { anyOf: ['confirmedEarlyRegistrant', 'pledged'], alsoRequire: ['verifiedEmail'] },
    b2b: { allOf: ['contractOutputReady', 'verifiedEmail', 'validatedWorkEmail'] },
    other: { enabled: false },
  },
  pledge: { paymentOptional: true, provider: 'square', allowRegistrationWithoutPayment: true },
  captcha: { action: 'bestystaff_lead_intake', placement: 'after_primary_email' },
});

export function mergedGateDefinitions(agentConfig = {}) {
  const custom = agentConfig.stageGates || {};
  return {
    ...DEFAULT_BESTYSTAFF_GATE_DEFINITIONS,
    ...custom,
    email: { ...DEFAULT_BESTYSTAFF_GATE_DEFINITIONS.email, ...(custom.email || {}) },
    intents: { ...DEFAULT_BESTYSTAFF_GATE_DEFINITIONS.intents, ...(custom.intents || {}) },
    conversion: { ...DEFAULT_BESTYSTAFF_GATE_DEFINITIONS.conversion, ...(custom.conversion || {}) },
  };
}

export function classifyLeadIntent(value, definitions = DEFAULT_BESTYSTAFF_GATE_DEFINITIONS) {
  const normalized = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  if ((definitions.intents?.career || []).some((v) => normalized.includes(v))) return 'career';
  if ((definitions.intents?.b2b || []).some((v) => normalized.includes(v))) return 'b2b';
  return 'other';
}

export function evaluateLeadConversion(lead, definitions = DEFAULT_BESTYSTAFF_GATE_DEFINITIONS) {
  const intentClass = classifyLeadIntent(lead.lead_intent, definitions);
  const verifiedEmail = !!lead.any_verified_email;
  const validatedWorkEmail = !lead.work_email_manual_validation;
  if (intentClass === 'career') return { eligible: verifiedEmail && (!!lead.confirmed_early_registrant || !!lead.pledged_at), intentClass };
  if (intentClass === 'b2b') return { eligible: verifiedEmail && validatedWorkEmail && !!lead.contract_output_ready, intentClass };
  return { eligible: false, intentClass };
}

export function emailGateFor(intent, email, definitions = DEFAULT_BESTYSTAFF_GATE_DEFINITIONS) {
  const intentClass = classifyLeadIntent(intent, definitions);
  const domainKind = classifyEmailDomain(email);
  return { intentClass, domainKind, manualValidation: intentClass === 'b2b' && domainKind !== 'custom' };
}
