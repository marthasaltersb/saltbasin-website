// Session mapping — configurable rules (config-audit: nothing here needs a code
// edit to change; every key is editable on the Sessions screen's Settings tab).
//
// Stored as a `config_state` row (id `session_mapping_rules`, TEXT JSON), shallow
// merged over these defaults — the same storage and merge rule as
// releaseIntelligenceConfig.js. The price table lives here so spend is always
// computed at READ time from the current table: editing a price re-prices every
// stored session, and a model with no price is reported as "not priced", never
// as zero.
const dbHelpers = () => import('../db.js');

export const CONFIG_ROW_ID = 'session_mapping_rules';
export const MAPPING_AREAS = ['context', 'prompt', 'cache', 'memory'];

export const DEFAULT_RULES = Object.freeze({
  currency: 'USD',
  // Price per MILLION tokens, matched by model-id prefix (first match wins).
  // Starter values only: edit to match your plan. A model with no match is "not priced".
  prices: [
    { match: 'claude-opus', input: 15, cacheWrite: 18.75, cacheRead: 1.5, output: 75 },
    { match: 'claude-sonnet', input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
    { match: 'claude-haiku', input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 },
  ],
  // A gap between two transcript lines longer than this is idle time, not work.
  idleCapMinutes: 10,
  // Folder holding Claude Code project transcripts on the server. Blank = ~/.claude/projects/<working directory>.
  transcriptsDir: '',
  thresholds: {
    cacheHitRatioMin: 0.8,      // below this a session proposes a cache mapping
    minMessagesForCache: 5,     // ...but only with at least this many messages
    compactionsMax: 0,          // more compactions than this proposes context + memory mappings
    agentTokenShareMax: 0.6,    // one agent above this share of all tokens proposes a prompt mapping
    minAgentsForShare: 2,
    limitEventsMax: 0,          // more usage/rate-limit events than this proposes a prompt mapping
    skillRepeatMin: 5,          // a skill invoked this many times proposes a prompt mapping
  },
  // Where each mapping area's suggested edit points (repository-relative paths).
  targets: {
    context: 'CLAUDE.md',
    prompt: '.claude/workflows/release-loop.js',
    cache: 'CLAUDE.md',
    memory: 'docs/active-universal-salt-basin-agent-memory-register.md',
  },
  // Metrics compared before/after an applied mapping.
  maxSeries: 5,
});

const THRESHOLD_KEYS = Object.keys(DEFAULT_RULES.thresholds);
const PRICE_FIELDS = ['input', 'cacheWrite', 'cacheRead', 'output'];

/** Validate an override. Returns { rules, errors }; errors is empty when valid. */
export function validateRules(input) {
  const errors = [];
  const src = input && typeof input === 'object' && !Array.isArray(input) ? input : null;
  if (!src) return { rules: null, errors: ['Rules must be an object'] };
  const ALLOWED_KEYS = ['currency', 'prices', 'idleCapMinutes', 'transcriptsDir', 'thresholds', 'targets', 'maxSeries'];
  const unknown = Object.keys(src).filter((k) => !ALLOWED_KEYS.includes(k));
  if (unknown.length) errors.push(`unknown rule key${unknown.length > 1 ? 's' : ''}: ${unknown.map((k) => `"${k}"`).join(', ')} (allowed: ${ALLOWED_KEYS.join(', ')})`);
  const rules = { ...DEFAULT_RULES, ...src };

  rules.currency = String(rules.currency || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(rules.currency)) errors.push('currency must be a three-letter code such as USD');

  if (!Array.isArray(rules.prices)) errors.push('prices must be a list');
  else {
    const seen = new Set();
    rules.prices = rules.prices.map((p, i) => {
      const match = String(p?.match ?? '').trim();
      if (!match) errors.push(`prices row ${i + 1}: model prefix is required`);
      else if (seen.has(match)) errors.push(`prices row ${i + 1}: model prefix "${match}" appears twice`);
      seen.add(match);
      const row = { match };
      for (const f of PRICE_FIELDS) {
        const v = Number(p?.[f]);
        if (p?.[f] === '' || p?.[f] == null || !Number.isFinite(v) || v < 0) errors.push(`prices row ${i + 1}: ${f} must be a number of zero or more`);
        row[f] = v;
      }
      return row;
    });
  }

  const idle = Number(rules.idleCapMinutes);
  if (!Number.isFinite(idle) || idle < 1 || idle > 240) errors.push('idleCapMinutes must be a number from 1 to 240');
  rules.idleCapMinutes = idle;

  rules.transcriptsDir = String(rules.transcriptsDir ?? '').trim();

  const th = { ...DEFAULT_RULES.thresholds, ...(src.thresholds || {}) };
  for (const k of Object.keys(th)) {
    if (!THRESHOLD_KEYS.includes(k)) { errors.push(`thresholds: unknown key "${k}"`); continue; }
    const v = Number(th[k]);
    if (!Number.isFinite(v) || v < 0) errors.push(`thresholds.${k} must be a number of zero or more`);
    th[k] = v;
  }
  if (th.cacheHitRatioMin > 1) errors.push('thresholds.cacheHitRatioMin must be between 0 and 1');
  if (th.agentTokenShareMax > 1) errors.push('thresholds.agentTokenShareMax must be between 0 and 1');
  rules.thresholds = th;

  const targets = { ...DEFAULT_RULES.targets, ...(src.targets || {}) };
  for (const a of Object.keys(targets)) {
    if (!MAPPING_AREAS.includes(a)) { errors.push(`targets: unknown area "${a}"`); continue; }
    const v = String(targets[a] ?? '').trim();
    if (!v || v.startsWith('/') || v.includes('..')) errors.push(`targets.${a} must be a relative repository path`);
    targets[a] = v;
  }
  rules.targets = targets;

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
    return { rules: structuredClone(DEFAULT_RULES), overrideError: `${CONFIG_ROW_ID} could not be read: ${error.message}`, overridden: false };
  }
  if (override && typeof override === 'object' && !Array.isArray(override)) {
    const { rules, errors } = validateRules(override);
    if (errors.length) return { rules: structuredClone(DEFAULT_RULES), overrideError: `Saved rules are invalid, defaults are in use: ${errors.join('; ')}`, overridden: false };
    return { rules, overrideError: null, overridden: true };
  }
  return { rules: structuredClone(DEFAULT_RULES), overrideError: null, overridden: false };
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

/** Price one model's tokens. Returns null when the model has no price row (never 0). */
export function priceModel(rules, model, tokens) {
  const row = (rules.prices || []).find((p) => String(model || '').startsWith(p.match));
  if (!row) return null;
  return (
    (Number(tokens.input || 0) * row.input +
      Number(tokens.cacheWrite || 0) * row.cacheWrite +
      Number(tokens.cacheRead || 0) * row.cacheRead +
      Number(tokens.output || 0) * row.output) / 1e6
  );
}

/** Spend for a by-model breakdown: { total, unpriced: [model...] }. */
export function priceSession(rules, byModel) {
  let total = 0; const unpriced = [];
  for (const [model, t] of Object.entries(byModel || {})) {
    const c = priceModel(rules, model, t);
    if (c == null) unpriced.push(model); else total += c;
  }
  return { total, unpriced };
}
