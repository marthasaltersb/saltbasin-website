import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSWORD_POLICY, validatePasswordPolicy } from '../server/lib/passwordPolicyRules.js';
import { DEFAULT_BESTYSTAFF_GATE_DEFINITIONS, classifyLeadIntent, emailGateFor, evaluateLeadConversion, mergedGateDefinitions } from '../server/lib/bestyStaffGateDefinitions.js';
import { generateTotpSecret, totpCode, verifyTotp, totpUri } from '../server/lib/totp.js';

test('intake order places email and CAPTCHA immediately after relationship', () => {
  assert.deepEqual(DEFAULT_BESTYSTAFF_GATE_DEFINITIONS.sequence.slice(0, 4), ['relationship', 'primary_email', 'captcha', 'context_consent']);
  assert.equal(DEFAULT_BESTYSTAFF_GATE_DEFINITIONS.captcha.placement, 'after_primary_email');
});

test('career and B2B intent classification is deterministic', () => {
  assert.equal(classifyLeadIntent('career portfolio'), 'career');
  assert.equal(classifyLeadIntent('hire Salt Basin'), 'b2b');
  assert.equal(classifyLeadIntent('general curiosity'), 'other');
});

test('career email gate recognizes consumer domain without manual work validation', () => {
  assert.deepEqual(emailGateFor('career_portfolio', 'person@gmail.com'), { intentClass: 'career', domainKind: 'consumer', manualValidation: false });
});

test('B2B generic email remains accepted but requires manual work validation', () => {
  assert.deepEqual(emailGateFor('hire_salt_basin', 'buyer@gmail.com'), { intentClass: 'b2b', domainKind: 'consumer', manualValidation: true });
});

test('B2B custom-domain email avoids the manual-domain flag', () => {
  assert.deepEqual(emailGateFor('b2b_product', 'buyer@clientco.example'), { intentClass: 'b2b', domainKind: 'custom', manualValidation: false });
});

test('career conversion requires verified email plus registration or pledge', () => {
  const base = { lead_intent: 'career_portfolio', any_verified_email: true };
  assert.equal(evaluateLeadConversion({ ...base, confirmed_early_registrant: true }).eligible, true);
  assert.equal(evaluateLeadConversion({ ...base, pledged_at: Date.now() }).eligible, true);
  assert.equal(evaluateLeadConversion(base).eligible, false);
  assert.equal(evaluateLeadConversion({ ...base, any_verified_email: false, confirmed_early_registrant: true }).eligible, false);
});

test('B2B conversion requires verified email, validated work email, and contract output', () => {
  const complete = { lead_intent: 'hire_salt_basin', any_verified_email: true, work_email_manual_validation: false, contract_output_ready: true };
  assert.equal(evaluateLeadConversion(complete).eligible, true);
  assert.equal(evaluateLeadConversion({ ...complete, work_email_manual_validation: true }).eligible, false);
  assert.equal(evaluateLeadConversion({ ...complete, contract_output_ready: false }).eligible, false);
});

test('gate definitions can override nested rules without dropping defaults', () => {
  const merged = mergedGateDefinitions({ stageGates: { pledge: { provider: 'test' }, email: { minimumVerifiedForConversion: 2 } } });
  assert.equal(merged.email.minimumVerifiedForConversion, 2);
  assert.equal(merged.email.verificationRequired, true);
  assert.deepEqual(merged.pledge, { provider: 'test' });
});

test('password policy accepts only the complete criteria', () => {
  assert.equal(PASSWORD_POLICY.minimumLength, 12);
  assert.equal(PASSWORD_POLICY.historyDepth, 5);
  assert.equal(validatePasswordPolicy('Correct-Horse7!').valid, true);
  assert.equal(validatePasswordPolicy('lowercase7!').valid, false);
  assert.equal(validatePasswordPolicy('NoNumberHere!').valid, false);
  assert.equal(validatePasswordPolicy('NoSpecialHere7').valid, false);
  assert.equal(validatePasswordPolicy('Short7!').valid, false);
});

test('authenticator codes verify only inside the accepted time window', () => {
  const secret = generateTotpSecret();
  const at = 1_786_411_700_000;
  const code = totpCode(secret, at);
  assert.equal(code.length, 6);
  assert.equal(verifyTotp(secret, code, at), true);
  assert.equal(verifyTotp(secret, code, at + 120_000), false);
  assert.match(totpUri({ secret, email: 'member@example.com' }), /^otpauth:\/\/totp\//);
});
