// Release intelligence — configurable rules (config-audit: nothing here is a
// product assumption that needs a code edit to change).
//
// Defaults live here; an admin overrides any key from the "Settings" tab of
// the Release intelligence screen, which writes a `config_state` row with id
// `release_intelligence_rules` (TEXT JSON, the same storage every other
// platform-wide config row uses). Overrides are shallow-merged over these
// defaults, so a partial override is safe. Reused (and trimmed) from the
// earlier partial build; the session-telemetry keys it carried are not used
// here because token/time data comes from the release tracker snapshot.

// db.js is imported lazily so the pure rules/validation can be unit-tested
// without a database connection.
const dbHelpers = () => import('../db.js');

export const CONFIG_ROW_ID = 'release_intelligence_rules';

export const DEFAULT_RULES = Object.freeze({
  // Where each kind of release-loop output lives (path prefixes, relative to
  // the repository root). Matches definition.json logLocations.
  logLocations: {
    changeSpec: 'docs/changes/',
    trainingSpec: 'docs/training/',
    testResult: 'docs/test-results/',
    triage: 'docs/triage/',
    releaseLog: 'docs/release-log/',
  },
  // What happened to a command or agent run. 'failed', 'refused' and
  // 'partial' are required (the importer maps to them); more can be added.
  runStates: ['failed', 'refused', 'partial', 'interrupted'],
  // Where a failed run stands. 'open' and 'reconciled' are required.
  dispositions: ['open', 'reconciled', 'superseded', 'accepted_known_issue'],
  // Failure classes: the failure-reconciliation classes plus the triage
  // classes from definition.json, and 'unclassified' for anything not yet
  // classified (never guessed).
  failureClasses: [
    'product_defect', 'requirement_gap', 'owner_direction_conflict', 'test_harness',
    'environment', 'process', 'informational',
    'defect', 'spec_error', 'needs_business_definition', 'unclassified',
  ],
  // Which token measure the trend charts start on.
  defaultTokenMeasure: 'output',
  // Maximum number of series drawn in a stacked chart before the rest fold
  // into "Other" (the validated palette has five categorical slots).
  maxSeries: 5,
});

const REQUIRED = {
  runStates: ['failed', 'refused', 'partial'],
  dispositions: ['open', 'reconciled'],
};
export const TOKEN_MEASURES = ['all', 'output', 'input', 'cacheWrite', 'cacheRead'];

function cleanList(name, value, errors) {
  if (!Array.isArray(value)) { errors.push(`${name} must be a list`); return null; }
  const out = [...new Set(value.map((v) => String(v ?? '').trim()).filter(Boolean))];
  for (const bad of out.filter((v) => !/^[a-z0-9_]+$/.test(v))) errors.push(`${name}: "${bad}" must use lowercase letters, digits and underscores only`);
  for (const req of REQUIRED[name] || []) if (!out.includes(req)) errors.push(`${name} must include "${req}"`);
  if (!out.length) errors.push(`${name} cannot be empty`);
  return out;
}

/** Validate an override. Returns { rules, errors }; errors is empty when valid. */
export function validateRules(input) {
  const errors = [];
  const src = input && typeof input === 'object' && !Array.isArray(input) ? input : null;
  if (!src) return { rules: null, errors: ['Rules must be an object'] };
  const rules = { ...DEFAULT_RULES, ...src };
  rules.runStates = cleanList('runStates', rules.runStates, errors);
  rules.dispositions = cleanList('dispositions', rules.dispositions, errors);
  rules.failureClasses = cleanList('failureClasses', rules.failureClasses, errors);
  if (rules.failureClasses && !rules.failureClasses.includes('unclassified')) errors.push('failureClasses must include "unclassified"');
  const loc = { ...DEFAULT_RULES.logLocations, ...(src.logLocations || {}) };
  for (const [k, v] of Object.entries(loc)) {
    if (!(k in DEFAULT_RULES.logLocations)) errors.push(`logLocations: unknown location "${k}"`);
    else if (typeof v !== 'string' || !v.trim() || v.startsWith('/') || v.includes('..') || !v.endsWith('/')) errors.push(`logLocations.${k} must be a relative folder ending in "/"`);
  }
  rules.logLocations = loc;
  if (!TOKEN_MEASURES.includes(rules.defaultTokenMeasure)) errors.push(`defaultTokenMeasure must be one of ${TOKEN_MEASURES.join(', ')}`);
  const ms = Number(rules.maxSeries);
  if (!Number.isInteger(ms) || ms < 1 || ms > 5) errors.push('maxSeries must be a whole number from 1 to 5');
  rules.maxSeries = ms;
  return { rules, errors };
}

export async function loadRules() {
  let override = null;
  try {
    const { getJSON } = await dbHelpers();
    override = await getJSON('config_state', CONFIG_ROW_ID);
  } catch (error) {
    // A malformed override row is reported to the caller (and shown on the
    // Settings tab), not silently replaced by the defaults.
    return { rules: { ...DEFAULT_RULES }, overrideError: `${CONFIG_ROW_ID} could not be read: ${error.message}`, overridden: false };
  }
  if (override && typeof override === 'object' && !Array.isArray(override)) {
    const { rules, errors } = validateRules(override);
    if (errors.length) return { rules: { ...DEFAULT_RULES }, overrideError: `Saved rules are invalid, defaults are in use: ${errors.join('; ')}`, overridden: false };
    return { rules, overrideError: null, overridden: true };
  }
  return { rules: { ...DEFAULT_RULES }, overrideError: null, overridden: false };
}

export async function saveRules(input) {
  const { rules, errors } = validateRules(input);
  if (errors.length) { const e = new Error(errors.join('; ')); e.status = 400; throw e; }
  const { setJSON } = await dbHelpers();
  await setJSON('config_state', CONFIG_ROW_ID, rules);
  return rules;
}

export async function resetRules() {
  const { setJSON } = await dbHelpers();
  await setJSON('config_state', CONFIG_ROW_ID, null);
}
