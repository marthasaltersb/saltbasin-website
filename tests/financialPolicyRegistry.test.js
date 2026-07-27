import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FINANCIAL_CONNECTION_POLICIES,
  FINANCIAL_SHARE_OUTPUT_TYPES,
  classifyLiability,
  resolveFinancialProvider,
} from '../server/lib/financialPolicyRegistry.js';

test('personal financial policy is member-private', () => {
  assert.equal(FINANCIAL_CONNECTION_POLICIES.member_private_v1.defaultScope, 'MEMBER_PRIVATE');
});

test('secured debt is never silently classified as unsecured', () => {
  assert.equal(classifyLiability('personal_loan', 'secured'), 'secured');
  assert.equal(classifyLiability('personal_loan'), 'unknown');
  assert.equal(classifyLiability('credit_card', 'secured'), 'unsecured');
});

test('providers retain credentials outside semantic evidence', () => {
  assert.equal(resolveFinancialProvider('plaid').storesCredentials, false);
  assert.equal(resolveFinancialProvider('manual_reference').storesCredentials, false);
});

test('sharing is limited to derived output classes', () => {
  assert.ok(FINANCIAL_SHARE_OUTPUT_TYPES.cash_liquidity_summary);
  assert.ok(!FINANCIAL_SHARE_OUTPUT_TYPES.raw_account_records);
});
