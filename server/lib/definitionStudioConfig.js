// Definition Studio configuration — what the Studio canvas itself offers a Composer.
//
// Owner direction (2026-10-10): the process flow builder becomes the Definition Studio, and "even the
// process builder needs to be configurable". Everything the prototype hardcoded (its shape bar, the step
// specification fields, execution/concurrency options, pain root causes, level names) is data here.
//
// Identifier rule (Betsy, 2026-10-10, DEC-SLT-03): anything with a name carries a plain `name`, a unique
// L-number `id` qualified by its hierarchy (e.g. `FLOW-L2-SHAPE-001`), and an immutable snake_case
// `apiName`. Ids and API names are never changed or reused; a rename changes only `name`. Items are
// retired by `enabled: false`, never deleted, so saved flows that reference them keep working.
//
// Pure module: no database import, so it is testable and readable without DATABASE_URL.

export const STUDIO_CONFIG_SCHEMA_VERSION = 1;

// The canvas can draw exactly these geometries (shape drawing code lives in the canvas page).
// A configured shape picks one; new geometries need code, new shapes do not.
export const GEOMETRIES = Object.freeze(['step', 'subprocess', 'decision', 'parallel', 'event', 'data', 'terminal']);
export const FIELD_TYPES = Object.freeze(['text', 'textarea']);
export const FIELD_VIEWS = Object.freeze([null, 'current', 'future']);

const ID_RE = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)+$/;
const API_RE = /^[a-z][a-z0-9_]*$/;
const KEY_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// The flow hierarchy the canvas logic is built around (Industry → Flow → Scenario). Names are editable;
// the three levels themselves are structural in the canvas code, so levels cannot be added or removed.
const LEVELS = [
  { id: 'FLOW-L1', hierarchy: 'FLOW', level: 1, apiName: 'industry', name: 'Industry', description: 'The industry or business area a flow belongs to, defined as classification type and role type pairs.' },
  { id: 'FLOW-L2', hierarchy: 'FLOW', level: 2, apiName: 'flow', name: 'Flow', description: 'An end-to-end base flow: the high-level steps that stay consistent for a domain or channel.' },
  { id: 'FLOW-L3', hierarchy: 'FLOW', level: 3, apiName: 'scenario', name: 'Scenario', description: 'A scenario variant built on a flow, with its own steps, branches and overridden requirements.' },
];

const GEOMETRY_SIZES = {
  step: { width: 150, height: 64 }, subprocess: { width: 172, height: 72 }, decision: { width: 118, height: 118 },
  parallel: { width: 110, height: 110 }, event: { width: 62, height: 62 }, data: { width: 120, height: 56 },
  terminal: { width: 128, height: 52 },
};

const shape = (n, apiName, name, geometry, defaultLabel, color, hint) => ({
  id: `FLOW-L2-SHAPE-${String(n).padStart(3, '0')}`, levelId: 'FLOW-L2', apiName, name, geometry, defaultLabel, color, hint, enabled: true,
});
const SHAPES = [
  shape(1, 'step', 'Step', 'step', 'New step', '#4A7C8E', 'Click the canvas to place a step.'),
  shape(2, 'subprocess', 'Sub-process', 'subprocess', 'Sub-process', '#345A68', 'Click the canvas to place a sub-process.'),
  shape(3, 'decision', 'Decision', 'decision', 'Decision?', '#C4843A', 'Click the canvas to place a decision (XOR) gate.'),
  shape(4, 'parallel', 'Parallel gate', 'parallel', 'Parallel', '#345A68', 'Click the canvas to place a parallel (AND) gate.'),
  shape(5, 'event', 'Event', 'event', 'Event', '#D98CA0', 'Click the canvas to place an event.'),
  shape(6, 'data_object', 'Data object', 'data', 'Data', '#C4843A', 'Click the canvas to place a data object.'),
  shape(7, 'start_end', 'Start / end', 'terminal', 'Start', '#345A68', 'Click the canvas to place a start/end node.'),
];

let fieldSeq = 0;
let sectionSeq = 0;
const section = (apiName, name, viewOnly, fields) => ({
  id: `FLOW-L2-FIELDSET-${String(++sectionSeq).padStart(3, '0')}`, levelId: 'FLOW-L2', apiName, name, viewOnly, enabled: true,
  fields: fields.map(([key, apiN, label, type, hint]) => ({
    id: `FLOW-L2-FIELD-${String(++fieldSeq).padStart(3, '0')}`, levelId: 'FLOW-L2', key, apiName: apiN, name: label, type, hint: hint || '', viewOnly, enabled: true,
  })),
});
// `key` is where a step stores the value (kept identical to the prototype so existing flows load);
// `apiName` is the immutable machine name.
const FIELD_SECTIONS = [
  section('identity_hierarchy', 'Identity & hierarchy', null, [
    ['hierarchy', 'hierarchy', 'Hierarchy / parent path', 'text', 'e.g. Revenue Rod → Billing Stage → this step'],
    ['properties', 'properties', 'Properties', 'textarea', 'Bounded definition, attributes, state values'],
    ['product', 'product', 'Product / journey', 'text', 'Which product or user journey this step belongs to'],
    ['translations', 'translations', 'Label translations', 'textarea', 'One per line, e.g. es: Configurar'],
  ]),
  section('actors_data_flow', 'Actors & data flow', null, [
    ['actors', 'actors', 'Actors involved', 'text', 'Roles, agents, systems that act on this step'],
    ['inputs', 'inputs', 'Inputs', 'textarea'],
    ['outputs', 'outputs', 'Outputs', 'textarea'],
    ['decisionParams', 'decision_params', 'Decision parameters', 'textarea', 'Branching logic / gate conditions, if applicable'],
    ['relTriggers', 'relationship_triggers', 'Relationship creation triggers', 'textarea', 'What this step creates or links downstream'],
  ]),
  section('architecture_data', 'Architecture & data', null, [
    ['archMapping', 'architecture_mapping', 'Related architecture components', 'textarea'],
    ['dataModel', 'data_model', 'Data model requirements', 'textarea'],
    ['automation', 'automation', 'Automation requirements', 'textarea'],
  ]),
  section('experience', 'Experience', null, [
    ['functionality', 'functionality', 'Expected functionality', 'textarea'],
    ['interaction', 'interaction', 'Expected user interaction', 'textarea'],
    ['visualLayout', 'visual_layout', 'Visual layout & components', 'textarea', 'Screen, component, or UI pattern for this step'],
  ]),
  section('current_state_diagnostics', 'Current-state diagnostics', 'current', [
    ['frictionOpportunity', 'friction_opportunity', 'Friction & opportunity (quantified)', 'textarea', 'e.g. 3.5 days average delay; ~$40K/mo recoverable if resolved'],
    ['dataSources', 'data_sources', 'Data sources available today', 'textarea', 'Systems/tables/feeds that exist today to quantify this step'],
    ['dataAttributes', 'data_attributes', 'Data attributes captured', 'textarea', 'Specific fields available for measurement'],
    ['handoverGap', 'handover_gap', 'Handover gap', 'textarea', 'Where ownership, data, or context is lost moving to the next step — blank if none'],
    ['leakageScenario', 'leakage_scenario', 'Leakage scenario', 'textarea', 'How value, revenue, or data leaks at this step — blank if none'],
  ]),
  section('future_state_tracking', 'Future-state tracking', 'future', [
    ['businessGoal', 'business_goal', 'Business goal', 'text', 'The future-state goal this step exists to serve'],
    ['businessOutcome', 'business_outcome', 'Business outcome being tracked', 'textarea', 'The metric or result this step is accountable for moving'],
  ]),
];

const option = (kind, n, apiName, name) => ({ id: `FLOW-L2-${kind}-${String(n).padStart(3, '0')}`, levelId: 'FLOW-L2', apiName, name, enabled: true });
const EXECUTION_TYPES = [
  option('EXEC', 1, 'manual', 'Manual / user activity'),
  option('EXEC', 2, 'automated', 'System automation'),
  option('EXEC', 3, 'hybrid', 'Hybrid (system + user)'),
];
const CONCURRENCY_TYPES = [
  option('CONC', 1, 'sequential', 'Sequential (depends on the prior step)'),
  option('CONC', 2, 'parallel', 'Parallel (can run alongside other steps)'),
];
const PAIN_ROOT_CAUSES = [
  option('PAIN', 1, 'process', 'Process'),
  option('PAIN', 2, 'system', 'System'),
  option('PAIN', 3, 'policy', 'Policy'),
  option('PAIN', 4, 'people', 'People'),
];

export function defaultStudioConfig() {
  return structuredClone({
    schemaVersion: STUDIO_CONFIG_SCHEMA_VERSION,
    version: 1,
    levels: LEVELS,
    geometrySizes: GEOMETRY_SIZES,
    shapes: SHAPES,
    fieldSections: FIELD_SECTIONS,
    executionTypes: EXECUTION_TYPES,
    concurrencyTypes: CONCURRENCY_TYPES,
    painRootCauses: PAIN_ROOT_CAUSES,
  });
}

// Every named item in the config, with the list it belongs to — the unit the identifier rules apply to.
export function namedItems(config) {
  const out = [];
  for (const l of config.levels || []) out.push(['levels', l]);
  for (const s of config.shapes || []) out.push(['shapes', s]);
  for (const sec of config.fieldSections || []) {
    out.push(['fieldSections', sec]);
    for (const f of sec.fields || []) out.push(['fields', f]);
  }
  for (const listName of ['executionTypes', 'concurrencyTypes', 'painRootCauses']) {
    for (const o of config[listName] || []) out.push([listName, o]);
  }
  return out;
}

function fail(message, details) {
  const e = new Error(message);
  e.status = 400; e.code = 'STUDIO_CONFIG_INVALID'; e.details = details;
  return e;
}

/**
 * Validate a proposed configuration. With `previous`, also enforce the append-only identifier rules:
 * nothing that existed may disappear, and no id may change its apiName (or a field its storage key).
 * Returns a list of problems in plain words; empty means valid.
 */
export function studioConfigProblems(config, previous = null) {
  const problems = [];
  if (!config || typeof config !== 'object') return ['The configuration is missing.'];
  for (const list of ['levels', 'shapes', 'fieldSections', 'executionTypes', 'concurrencyTypes', 'painRootCauses']) {
    if (!Array.isArray(config[list])) problems.push(`"${list}" must be a list.`);
  }
  if (problems.length) return problems;

  const seenIds = new Set();
  const apiByList = {};
  for (const [list, item] of namedItems(config)) {
    const label = item?.name || item?.id || '(unnamed)';
    if (!item || typeof item !== 'object') { problems.push(`An entry in ${list} is empty.`); continue; }
    if (!ID_RE.test(String(item.id || ''))) problems.push(`"${label}" needs an id like FLOW-L2-SHAPE-008 (capital letters, digits and dashes).`);
    else if (seenIds.has(item.id)) problems.push(`The id ${item.id} is used twice — every id must be unique.`);
    else seenIds.add(item.id);
    if (!API_RE.test(String(item.apiName || ''))) problems.push(`"${label}" needs an API name in lowercase letters, digits and underscores, starting with a letter (e.g. hand_off).`);
    else {
      const key = list === 'fields' ? 'fields' : list;
      apiByList[key] = apiByList[key] || new Set();
      if (apiByList[key].has(item.apiName)) problems.push(`The API name "${item.apiName}" is used twice in ${list} — API names must be unique within their list.`);
      apiByList[key].add(item.apiName);
    }
    if (typeof item.name !== 'string' || !item.name.trim()) problems.push(`${item.id || 'An item'} needs a plain name.`);
    else if (item.name.length > 80) problems.push(`"${item.name.slice(0, 30)}…" is longer than 80 characters.`);
  }

  if (config.levels.length !== 3) problems.push('The Studio has exactly three levels (L1, L2, L3); rename them, but do not add or remove levels.');

  const enabledShapes = config.shapes.filter((s) => s.enabled !== false);
  if (!enabledShapes.length) problems.push('Keep at least one shape switched on, or nothing can be placed on the canvas.');
  for (const s of config.shapes) {
    if (!GEOMETRIES.includes(s.geometry)) problems.push(`Shape "${s.name}" must use one of these geometries: ${GEOMETRIES.join(', ')}.`);
    if (s.color && !HEX_RE.test(s.color)) problems.push(`Shape "${s.name}" needs a colour like #4A7C8E.`);
    if (typeof s.defaultLabel !== 'string' || !s.defaultLabel.trim()) problems.push(`Shape "${s.name}" needs a default label for new steps.`);
  }

  const sizes = config.geometrySizes || {};
  for (const g of GEOMETRIES) {
    const sz = sizes[g];
    const ok = sz && Number.isFinite(sz.width) && Number.isFinite(sz.height) && sz.width >= 40 && sz.width <= 400 && sz.height >= 30 && sz.height <= 400;
    if (!ok) problems.push(`The ${g} geometry needs a width and height between 40 and 400 pixels.`);
  }

  const fieldKeys = new Set();
  for (const sec of config.fieldSections) {
    if (!FIELD_VIEWS.includes(sec.viewOnly ?? null)) problems.push(`Field section "${sec.name}" must apply to both views, Current State only, or Future State only.`);
    if (!Array.isArray(sec.fields)) { problems.push(`Field section "${sec.name}" needs a list of fields.`); continue; }
    for (const f of sec.fields) {
      if (!KEY_RE.test(String(f.key || ''))) problems.push(`Field "${f.name}" needs a storage key made of letters, digits and underscores.`);
      else if (fieldKeys.has(f.key)) problems.push(`Two fields store their value under "${f.key}" — each field needs its own storage key.`);
      else fieldKeys.add(f.key);
      if (!FIELD_TYPES.includes(f.type)) problems.push(`Field "${f.name}" must be a single line (text) or a paragraph (textarea).`);
    }
  }

  if (previous) {
    const prevItems = new Map(namedItems(previous).map(([list, item]) => [item.id, { list, item }]));
    const nextItems = new Map(namedItems(config).map(([list, item]) => [item.id, { list, item }]));
    for (const [id, { list, item }] of prevItems) {
      const nxt = nextItems.get(id);
      if (!nxt) { problems.push(`"${item.name}" (${id}) can't be removed — switch it off instead, so saved flows that use it still open.`); continue; }
      if (nxt.list !== list) problems.push(`${id} can't move from ${list} to ${nxt.list}.`);
      if (nxt.item.apiName !== item.apiName) problems.push(`The API name of "${item.name}" (${id}) is fixed as "${item.apiName}" — change its plain name instead.`);
      if (list === 'fields' && nxt.item.key !== item.key) problems.push(`The storage key of field "${item.name}" (${id}) is fixed as "${item.key}".`);
    }
  }
  return problems;
}

export function assertValidStudioConfig(config, previous = null) {
  const problems = studioConfigProblems(config, previous);
  if (problems.length) throw fail(`The Studio settings weren't saved: ${problems[0]}`, problems);
  return config;
}

/** Suggest the next free id for a new item, e.g. nextStudioId(config, 'FLOW-L2', 'SHAPE') → FLOW-L2-SHAPE-008. */
export function nextStudioId(config, levelId, kind) {
  const prefix = `${levelId}-${kind}-`;
  let max = 0;
  for (const [, item] of namedItems(config)) {
    if (String(item.id || '').startsWith(prefix)) max = Math.max(max, Number(item.id.slice(prefix.length)) || 0);
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

/** Turn a plain name into a candidate API name ("Hand-off review" → "hand_off_review"). */
export function toApiName(name) {
  const s = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return /^[a-z]/.test(s) ? s.slice(0, 60) : `item_${s}`.slice(0, 60);
}
