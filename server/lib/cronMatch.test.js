import { describe, test, expect } from '@jest/globals';
import { isValidCron, isCronDue } from './cronMatch.js';

describe('isValidCron', () => {
  test('accepts a standard 5-field expression', () => {
    expect(isValidCron('0 3 * * *')).toBe(true);
  });
  test('accepts step and range syntax', () => {
    expect(isValidCron('*/15 9-17 * * 1-5')).toBe(true);
  });
  test('rejects wrong field count', () => {
    expect(isValidCron('0 3 * *')).toBe(false);
  });
  test('rejects an out-of-range value', () => {
    expect(isValidCron('61 3 * * *')).toBe(false);
  });
});

describe('isCronDue', () => {
  test('matches an exact minute/hour', () => {
    const date = new Date(2026, 0, 15, 3, 0); // Jan 15 2026, 03:00
    expect(isCronDue('0 3 * * *', date)).toBe(true);
    expect(isCronDue('1 3 * * *', date)).toBe(false);
  });
  test('matches a step schedule', () => {
    const date = new Date(2026, 0, 15, 9, 30);
    expect(isCronDue('*/15 * * * *', date)).toBe(true);
    expect(isCronDue('*/15 * * * *', new Date(2026, 0, 15, 9, 31))).toBe(false);
  });
  test('respects day-of-week', () => {
    const monday = new Date(2026, 0, 12, 8, 0); // 2026-01-12 is a Monday
    const tuesday = new Date(2026, 0, 13, 8, 0);
    expect(isCronDue('0 8 * * 1', monday)).toBe(true);
    expect(isCronDue('0 8 * * 1', tuesday)).toBe(false);
  });
  test('an invalid cron string is never due', () => {
    expect(isCronDue('not a cron', new Date())).toBe(false);
  });
});
