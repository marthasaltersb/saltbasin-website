// Release loop definition (platform copy). The file server/data/releaseLoop/
// definition.json is the shipped default; an admin edits the effective
// definition from the World Shell "Release loop" screen. An edit never
// rewrites the file: it is stored as a config_state row (TEXT JSON, id
// `release_loop_definition`) holding the full definition plus a version
// history. Every save bumps the version by exactly one (the server sets it;
// the client cannot choose it) and needs a change note.
//
// db.js is imported lazily so the pure validation can be unit-tested without
// a database connection.
import fs from 'node:fs';

const dbHelpers = () => import('../db.js');
export const CONFIG_ROW_ID = 'release_loop_definition';

const DEFAULT_PATH = new URL('../data/releaseLoop/definition.json', import.meta.url);
export function loadDefaultDefinition() {
  return JSON.parse(fs.readFileSync(DEFAULT_PATH, 'utf8'));
}

// Bug statuses, triage classes and stages the gate logic itself refers to by
// name. An edit may add more, never remove these.
export const REQUIRED_BUG_STATUSES = [
  'open', 'fixing', 'fixed_awaiting_retest', 'verified', 'recurred', 'needs_human',
  'needs_business_definition', 'backlog_pre_existing', 'reassigned', 'process_note',
];
export const REQUIRED_TRIAGE_CLASSES = ['defect', 'spec_error', 'environment', 'needs_business_definition', 'coverage_gap'];
export const REQUIRED_STAGES = ['build', 'integrate', 'validate', 'triage', 'fix', 'integrate_fix', 'escalate', 'done'];

const err = (m, status = 400) => Object.assign(new Error(m), { status });

/** Returns a list of problems; empty when the definition is usable by the gates. */
export function validateDefinition(def) {
  const problems = [];
  if (!def || typeof def !== 'object' || Array.isArray(def)) return ['The definition must be an object'];
  if (!String(def.name || '').trim()) problems.push('name is required');
  if (!String(def.summary || '').trim()) problems.push('summary is required');
  if (!Array.isArray(def.roles) || !def.roles.length) problems.push('roles must be a non-empty list');
  else {
    const seen = new Set();
    for (const r of def.roles) {
      if (!r || !/^[a-z0-9_]+$/.test(r.key || '')) { problems.push(`role key "${r?.key}" must use lowercase letters, digits and underscores`); continue; }
      if (seen.has(r.key)) problems.push(`role "${r.key}" is listed twice`);
      seen.add(r.key);
      if (!String(r.name || '').trim()) problems.push(`role "${r.key}" needs a name`);
      if (!String(r.does || '').trim()) problems.push(`role "${r.key}" needs a description`);
    }
  }
  if (!Array.isArray(def.stages)) problems.push('stages must be a list');
  else {
    const keys = def.stages.map((s) => s?.key);
    for (const k of REQUIRED_STAGES) if (!keys.includes(k)) problems.push(`stages must include "${k}"`);
    const roleKeys = new Set((def.roles || []).map((r) => r?.key));
    for (const s of def.stages) {
      if (s?.role && !roleKeys.has(s.role)) problems.push(`stage "${s.key}" names role "${s.role}" which is not in roles`);
      for (const f of ['next', 'onPass', 'onFail', 'onFixable', 'onBusinessDefinition']) {
        if (s?.[f] && !keys.includes(s[f])) problems.push(`stage "${s.key}" ${f} points at "${s[f]}" which is not a stage`);
      }
    }
  }
  const mfr = Number(def.maxFixRounds);
  if (!Number.isInteger(mfr) || mfr < 1 || mfr > 10) problems.push('maxFixRounds must be a whole number from 1 to 10');
  const att = Number(def.bugEscalation?.maxFixAttemptsPerBug);
  if (!Number.isInteger(att) || att < 1 || att > 5) problems.push('bugEscalation.maxFixAttemptsPerBug must be a whole number from 1 to 5');
  const statuses = def.bugEscalation?.statuses;
  if (!Array.isArray(statuses)) problems.push('bugEscalation.statuses must be a list');
  else for (const s of REQUIRED_BUG_STATUSES) if (!statuses.includes(s)) problems.push(`bugEscalation.statuses must include "${s}"`);
  const classes = Array.isArray(def.triageClasses) ? def.triageClasses.map((c) => c?.key) : null;
  if (!classes) problems.push('triageClasses must be a list');
  else for (const c of REQUIRED_TRIAGE_CLASSES) if (!classes.includes(c)) problems.push(`triageClasses must include "${c}"`);
  if (!def.gates || typeof def.gates !== 'object') problems.push('gates must be an object');
  return problems;
}

async function readRow() {
  const { getJSON } = await dbHelpers();
  return getJSON('config_state', CONFIG_ROW_ID);
}

/** Effective definition: the saved override when there is one, else the file default. */
export async function getEffectiveDefinition() {
  const base = loadDefaultDefinition();
  let row = null;
  let overrideError = null;
  try { row = await readRow(); } catch (e) { overrideError = `${CONFIG_ROW_ID} could not be read: ${e.message}`; }
  if (row?.definition) {
    const problems = validateDefinition(row.definition);
    if (problems.length) {
      return { definition: base, history: [], overridden: false, defaultVersion: base.version, overrideError: `Saved definition is invalid, the shipped default is in use: ${problems.join('; ')}` };
    }
    return { definition: row.definition, history: row.history || [], overridden: true, restored: row.restored === true, defaultVersion: base.version, overrideError: null };
  }
  return { definition: base, history: [], overridden: false, defaultVersion: base.version, overrideError };
}

export async function saveDefinition(next, note, actor) {
  const cleanNote = String(note || '').trim();
  if (!cleanNote) throw err('Add a change note saying what changed and why');
  const cur = await getEffectiveDefinition();
  const def = { ...next, key: cur.definition.key, version: Number(cur.definition.version) + 1 };
  def.maxFixRounds = Number(def.maxFixRounds);
  if (def.bugEscalation) def.bugEscalation = { ...def.bugEscalation, maxFixAttemptsPerBug: Number(def.bugEscalation.maxFixAttemptsPerBug) };
  const problems = validateDefinition(def);
  if (problems.length) throw err(problems.join('; '));
  const history = [...(cur.history || []), { version: def.version, note: cleanNote, by: actor?.label || 'admin', at: Date.now() }].slice(-50);
  const { setJSON } = await dbHelpers();
  await setJSON('config_state', CONFIG_ROW_ID, { definition: def, history });
  return getEffectiveDefinition();
}

/** Back to the shipped file's content. The version keeps counting up so a version number is never reused. */
export async function resetDefinition(note, actor) {
  const cur = await getEffectiveDefinition();
  if (!cur.overridden || cur.restored) return cur;
  const base = loadDefaultDefinition();
  const version = Math.max(Number(cur.definition.version), Number(base.version)) + 1;
  const history = [...(cur.history || []), { version, note: String(note || '').trim() || 'Reset to the shipped definition', by: actor?.label || 'admin', at: Date.now() }].slice(-50);
  const { setJSON } = await dbHelpers();
  await setJSON('config_state', CONFIG_ROW_ID, { definition: { ...base, version }, history, restored: true });
  return getEffectiveDefinition();
}
