// Journey flow studio: the versioned CONFIG DEFINITION (docs/changes/journey-flow-studio.md).
// Shape types, colours, execution/concurrency modes, field sections + fields, validation rules, scenario levels and
// the permission policy are DATA, not JSX. This file is only the platform default; the saved definition is the
// `config_state` row `flow_studio_definition` (version +1 per save with a note), edited on the Settings screen.
// Append-only in spirit: a shape key / field key that flows already use is never removed (saveDefinition refuses).
import { getJSON, setJSON } from '../db.js';

export const ADDED_BY = 'journey-flow-experience-mapping';
export const DEFINITION_ROW = 'flow_studio_definition';
export const FLOW_FORMAT = 'salt-basin-journey-flow';
export const FLOW_SCHEMA_VERSION = 1;

// `kind` is the drawing primitive the renderer knows (rect, diamond, circle, flag, pill); everything else (size,
// colours, label, whether the shape branches, whether it can start a flow) is configuration.
export const DEFAULT_DEFINITION = Object.freeze({
  key: 'journey_flow_studio',
  version: 1,
  shapeTypes: [
    { key: 'step', label: 'Step', kind: 'rect', w: 150, h: 64, fill: '#F8F4EC', stroke: '#C7BC9E', text: '#2B2A28', shadow: '#C7BC9E', defaultLabel: 'New step', branching: false, startCapable: false },
    { key: 'subprocess', label: 'Sub-process', kind: 'rect', w: 172, h: 72, fill: '#DCE9EC', stroke: '#4A7C8E', text: '#2B2A28', shadow: '#4A7C8E', defaultLabel: 'Sub-process', branching: false, startCapable: false },
    { key: 'decision', label: 'Decision', kind: 'diamond', w: 118, h: 118, fill: '#F3E3CE', stroke: '#C4843A', text: '#2B2A28', shadow: '#C4843A', defaultLabel: 'Decision?', branching: true, startCapable: false },
    { key: 'parallel', label: 'Parallel gate', kind: 'diamond', w: 110, h: 110, fill: '#DCE9EC', stroke: '#345A68', text: '#2B2A28', shadow: '#345A68', defaultLabel: 'Parallel', branching: true, fanout: true, startCapable: false },
    { key: 'event', label: 'Event', kind: 'circle', w: 62, h: 62, fill: '#F7E4E9', stroke: '#D98CA0', text: '#2B2A28', shadow: '#D98CA0', defaultLabel: 'Event', branching: false, startCapable: true },
    { key: 'data', label: 'Data object', kind: 'flag', w: 120, h: 56, fill: '#F3E3CE', stroke: '#C4843A', text: '#2B2A28', shadow: '#C4843A', defaultLabel: 'Data', branching: false, startCapable: false },
    { key: 'terminal', label: 'Start / End', kind: 'pill', w: 128, h: 52, fill: '#345A68', stroke: '#345A68', text: '#F8F4EC', shadow: '#1d3a45', defaultLabel: 'Start', branching: false, startCapable: true },
  ],
  execModes: [
    { key: '', label: 'Not set', badge: '', color: '#8a96a3' },
    { key: 'manual', label: 'User activity', badge: 'U', color: '#C4843A' },
    { key: 'automated', label: 'System automation', badge: 'S', color: '#345A68' },
    { key: 'hybrid', label: 'Hybrid', badge: 'H', color: '#7a5aa6' },
  ],
  concurrencyModes: [
    { key: 'sequential', label: 'Sequential', badge: '>', color: '#8a96a3' },
    { key: 'parallel', label: 'Parallel', badge: '||', color: '#2e7f9c' },
  ],
  scenarioLevels: [
    { key: 'L1', label: 'L1 domain / channel', note: 'The flow itself: which domain or channel it belongs to.' },
    { key: 'L2', label: 'L2 shared steps', note: 'Steps and connectors with no scenario tag. Always visible: the consistent skeleton.' },
    { key: 'L3', label: 'L3 scenario', note: 'Steps and connectors tagged with a scenario. Shown fully only when that scenario is active, and may override fields.' },
  ],
  states: [
    { key: 'current', label: 'Current state' },
    { key: 'future', label: 'Future state' },
  ],
  sections: [
    { key: 'identity', label: 'Identity & hierarchy' },
    { key: 'actors', label: 'Actors & data flow' },
    { key: 'authority', label: 'Authority & system' },
    { key: 'architecture', label: 'Architecture & data' },
    { key: 'experience', label: 'Experience' },
    { key: 'binding', label: 'Experience binding' },
    { key: 'structured', label: 'Structured bindings', addedBy: ADDED_BY },
    { key: 'extension', label: 'Extension fields', addedBy: ADDED_BY },
    { key: 'diagnostics', label: 'Current-state diagnostics', viewOnly: 'current' },
    { key: 'tracking', label: 'Future-state tracking', viewOnly: 'future' },
  ],
  fields: [
    { key: 'hierarchy', section: 'identity', label: 'Hierarchy / parent path', type: 'text', hint: 'e.g. Order channel > Fulfilment stage > this step' },
    { key: 'properties', section: 'identity', label: 'Properties', type: 'textarea', hint: 'Bounded definition, attributes, state values' },
    { key: 'product', section: 'identity', label: 'Product / journey', type: 'text', hint: 'Which product or user journey this step belongs to' },
    { key: 'translations', section: 'identity', label: 'Label translations', type: 'textarea', hint: 'One per line, e.g. es: Configurar' },
    { key: 'actors', section: 'actors', label: 'Actors involved', type: 'text', hint: 'Roles, agents, systems that act on this step' },
    { key: 'inputs', section: 'actors', label: 'Inputs', type: 'textarea' },
    { key: 'outputs', section: 'actors', label: 'Outputs', type: 'textarea' },
    { key: 'decisionParams', section: 'actors', label: 'Decision parameters', type: 'textarea', hint: 'Branching logic / gate conditions, if applicable' },
    { key: 'relTriggers', section: 'actors', label: 'Relationship creation triggers', type: 'textarea', hint: 'What this step creates or links downstream' },
    { key: 'gateKey', section: 'authority', label: 'Gate key', type: 'text', hint: 'Journey gate this step or decision becomes (e.g. credit_check)' },
    { key: 'variant', section: 'authority', label: 'Variant', type: 'text', hint: 'Variant of the journey this step belongs to' },
    { key: 'capabilities', section: 'authority', label: 'Capabilities', type: 'textarea', hint: 'Capabilities this step needs or provides' },
    { key: 'systemName', section: 'authority', label: 'System name', type: 'text', hint: 'System of record for this step' },
    { key: 'systemAuthority', section: 'authority', label: 'System authority', type: 'text', hint: 'What the system may decide or change on its own' },
    { key: 'actionAuthority', section: 'authority', label: 'Action authority', type: 'text', hint: 'Who or what may perform the action, and under which limits' },
    { key: 'archMapping', section: 'architecture', label: 'Related architecture components', type: 'textarea' },
    { key: 'dataModel', section: 'architecture', label: 'Data model requirements', type: 'textarea' },
    { key: 'automation', section: 'architecture', label: 'Automation requirements', type: 'textarea' },
    { key: 'functionality', section: 'experience', label: 'Expected functionality', type: 'textarea' },
    { key: 'interaction', section: 'experience', label: 'Expected user interaction', type: 'textarea' },
    { key: 'visualLayout', section: 'experience', label: 'Visual layout & components', type: 'textarea', hint: 'Screen, component, or UI pattern for this step' },
    { key: 'sceneAsset', section: 'binding', label: 'Scene or static asset', type: 'text', hint: 'Scene key or asset path shown for this step' },
    { key: 'animation', section: 'binding', label: 'Animation or interaction', type: 'text', hint: 'Animation or interaction played for this step' },
    { key: 'destinationLink', section: 'binding', label: 'Destination link', type: 'text', hint: 'Where the step sends the person (path or URL)' },
    { key: 'worldLayer', section: 'binding', label: 'World Shell layer', type: 'pick', source: 'worldLayers', hint: 'The layer of the World Shell this step opens', addedBy: ADDED_BY },
    { key: 'crystalVariant', section: 'binding', label: 'Crystal variant', type: 'pick', source: 'crystalVariants', hint: 'The crystal this step is drawn as', addedBy: ADDED_BY },
    { key: 'interactionKind', section: 'binding', label: 'Interaction kind', type: 'pick', source: 'interactions', hint: 'How the person interacts with this step', addedBy: ADDED_BY },
    { key: 'bindVariants', section: 'structured', label: 'Variants this step belongs to', type: 'multipick', source: 'variants', hint: 'Scenarios of this flow', addedBy: ADDED_BY },
    { key: 'bindActors', section: 'structured', label: 'Actors (roles or profiles)', type: 'multipick', source: 'actors', hint: 'Who acts on this step', addedBy: ADDED_BY },
    { key: 'bindCapabilities', section: 'structured', label: 'Platform capabilities', type: 'multipick', source: 'capabilities', hint: 'Capabilities from the capability map', addedBy: ADDED_BY },
    { key: 'bindSystemOfRecord', section: 'structured', label: 'System of record (data port)', type: 'pick', source: 'ports', hint: 'The system that holds the data this step works on', addedBy: ADDED_BY },
    { key: 'bindActionAuthority', section: 'structured', label: 'Action authority (permission or licence)', type: 'multipick', source: 'authorities', hint: 'What may perform this step', addedBy: ADDED_BY },
    { key: 'bindReads', section: 'structured', label: 'Data this step reads', type: 'multipick', source: 'dataFields', hint: 'Fields from the data model', addedBy: ADDED_BY },
    { key: 'bindWrites', section: 'structured', label: 'Data this step writes', type: 'multipick', source: 'dataFields', hint: 'Fields from the data model', addedBy: ADDED_BY },
    { key: 'painPoints', section: 'diagnostics', label: 'Pain points', type: 'textarea', viewOnly: 'current', hint: 'What hurts at this step today' },
    { key: 'frictionOpportunity', section: 'diagnostics', label: 'Friction & opportunity (quantified)', type: 'textarea', viewOnly: 'current', hint: 'e.g. 3.5 days average delay' },
    { key: 'dataSources', section: 'diagnostics', label: 'Data sources available today', type: 'textarea', viewOnly: 'current' },
    { key: 'dataAttributes', section: 'diagnostics', label: 'Data attributes captured', type: 'textarea', viewOnly: 'current' },
    { key: 'handoverGap', section: 'diagnostics', label: 'Handover gap', type: 'textarea', viewOnly: 'current', hint: 'Where ownership, data or context is lost; blank if none' },
    { key: 'leakageScenario', section: 'diagnostics', label: 'Leakage scenario', type: 'textarea', viewOnly: 'current', hint: 'How value, revenue or data leaks here; blank if none' },
    { key: 'businessGoal', section: 'tracking', label: 'Business goal', type: 'text', viewOnly: 'future' },
    { key: 'businessOutcome', section: 'tracking', label: 'Business outcome being tracked', type: 'textarea', viewOnly: 'future' },
  ],
  // Fields whose content marks a step in the picture (dots) and that a Future step can say it resolves.
  resolveKinds: [
    { key: 'pain', label: 'Pain point', field: 'painPoints' },
    { key: 'handover', label: 'Handover gap', field: 'handoverGap' },
    { key: 'leakage', label: 'Leakage scenario', field: 'leakageScenario' },
  ],
  // Rule `kind` is implemented in flowStudioDoc.js; severity, enabled and the message are configuration.
  validationRules: [
    { key: 'orphan_node', kind: 'orphan_node', label: 'Step with no connectors', severity: 'warning', enabled: true, message: '"{label}" has no connectors. Connect it to the flow or delete it.' },
    { key: 'single_branch_decision', kind: 'single_branch_decision', label: 'Gate with fewer than two branches', severity: 'error', enabled: true, message: '"{label}" is a {type} but has {count} outgoing branch(es). A gate needs at least two branches. Add more arrows out of it, or change it to a step.' },
    { key: 'unreachable_step', kind: 'unreachable_step', label: 'Step that cannot be reached', severity: 'error', enabled: true, message: '"{label}" cannot be reached from any start. Connect an arrow into it from the main flow.' },
    { key: 'missing_label', kind: 'missing_label', label: 'Step with no label', severity: 'warning', enabled: true, message: 'A {type} has no label. Select it and fill in Label in the step panel.' },
    { key: 'dangling_resolve', kind: 'dangling_resolve', label: 'Future step linked to a missing Current-state problem', severity: 'error', enabled: true, message: '"{label}" says it resolves a {resolveKind} on a Current-state step that has none recorded. Pick another step or record the problem first.' },
  ],
  // Option lists the structured pickers read (edited on the Settings screen). Platform-derived lists (capabilities,
  // permissions, data ports, World Shell layers, crystal variants, data fields) are read live from their registries.
  lists: {
    actors: [
      { key: 'member', label: 'Member' }, { key: 'admin', label: 'Administrator' }, { key: 'agent', label: 'Platform agent' },
      { key: 'customer', label: 'Customer' }, { key: 'reviewer', label: 'Reviewer' },
    ],
    licences: [
      { key: 'licence_finbridgeco', label: 'FinBridgeCo licence' }, { key: 'licence_handoveros', label: 'HandoverOS licence' },
    ],
    interactions: [
      { key: 'tap_to_open', label: 'Tap to open' }, { key: 'choose_branch', label: 'Choose a branch' }, { key: 'form_entry', label: 'Fill in a form' },
      { key: 'confirm_dialog', label: 'Confirm in a dialog' }, { key: 'watch_only', label: 'Watch only' },
    ],
  },
  access: {
    activateJourney: ['admin'],
    create: ['admin', 'member'],
    publish: ['admin', 'member'],
    shareTemplate: ['admin'],
    editDefinition: ['admin'],
  },
  limits: { maxNodes: 200, maxEdges: 400, maxLanes: 8, maxScenarios: 12 },
});

const ROLES = ['admin', 'member'];
export const PICK_SOURCES = ['variants', 'actors', 'capabilities', 'ports', 'authorities', 'dataFields', 'worldLayers', 'crystalVariants', 'interactions'];
const str = (v) => (typeof v === 'string' ? v : '');
const KEY = /^[a-zA-Z][a-zA-Z0-9_]*$/;

/** Validates a definition. Returns { definition, errors[] }; errors are plain sentences. */
export function validateDefinition(input) {
  const errors = [];
  const d = input && typeof input === 'object' ? input : null;
  if (!d) return { definition: null, errors: ['The definition is empty. Load the default and try again.'] };
  const uniq = (list, what) => {
    const seen = new Set();
    for (const it of list) {
      if (!it || typeof it.key !== 'string' || (it.key !== '' && !KEY.test(it.key))) { errors.push(`Every ${what} needs a key made of letters, numbers and underscores.`); continue; }
      if (seen.has(it.key)) errors.push(`Two ${what}s share the key "${it.key}". Keys must be unique.`);
      seen.add(it.key);
    }
  };
  const shapeTypes = Array.isArray(d.shapeTypes) ? d.shapeTypes : [];
  if (!shapeTypes.length) errors.push('At least one shape type is required.');
  uniq(shapeTypes, 'shape type');
  const kinds = new Set(['rect', 'diamond', 'circle', 'flag', 'pill']);
  const colour = /^#[0-9a-fA-F]{6}$/;
  for (const s of shapeTypes) {
    if (!s || !s.key) continue;
    if (!kinds.has(s.kind)) errors.push(`Shape "${s.key}" has the drawing kind "${s.kind}". Choose one of: ${[...kinds].join(', ')}.`);
    for (const c of ['fill', 'stroke', 'text', 'shadow']) if (!colour.test(str(s[c]))) errors.push(`Shape "${s.key}" needs a ${c} colour written like #1A2B3C.`);
    if (!(s.w >= 30 && s.w <= 400 && s.h >= 30 && s.h <= 400)) errors.push(`Shape "${s.key}" needs a width and height between 30 and 400.`);
  }
  const sections = Array.isArray(d.sections) ? d.sections : [];
  uniq(sections, 'section');
  const fields = Array.isArray(d.fields) ? d.fields : [];
  uniq(fields, 'field');
  const secKeys = new Set(sections.map((s) => s.key));
  for (const f of fields) {
    if (!f || !f.key) continue;
    if (!secKeys.has(f.section)) errors.push(`Field "${f.key}" is in the section "${f.section}", which does not exist.`);
    if (!['text', 'textarea', 'pick', 'multipick'].includes(f.type)) errors.push(`Field "${f.key}" has the type "${f.type}". Use text, textarea, pick or multipick.`);
    if ((f.type === 'pick' || f.type === 'multipick') && !PICK_SOURCES.includes(f.source)) errors.push(`Field "${f.key}" is a ${f.type} list but its source "${f.source}" is not known. Choose one of: ${PICK_SOURCES.join(', ')}.`);
    if (!str(f.label).trim()) errors.push(`Field "${f.key}" needs a label.`);
  }
  uniq(Array.isArray(d.execModes) ? d.execModes : [], 'execution mode');
  uniq(Array.isArray(d.concurrencyModes) ? d.concurrencyModes : [], 'concurrency mode');
  const rules = Array.isArray(d.validationRules) ? d.validationRules : [];
  uniq(rules, 'validation rule');
  const ruleKinds = new Set(['orphan_node', 'single_branch_decision', 'unreachable_step', 'missing_label', 'dangling_resolve']);
  for (const r of rules) {
    if (!r || !r.key) continue;
    if (!ruleKinds.has(r.kind)) errors.push(`Validation rule "${r.key}" uses the check "${r.kind}", which the studio does not know. Choose one of: ${[...ruleKinds].join(', ')}.`);
    if (!['error', 'warning'].includes(r.severity)) errors.push(`Validation rule "${r.key}" needs a severity of error or warning.`);
  }
  const a = d.access || {};
  for (const k of ['create', 'publish', 'shareTemplate', 'editDefinition', 'activateJourney']) {
    if (k === 'activateJourney' && a[k] === undefined) continue;
    if (!Array.isArray(a[k]) || a[k].some((r) => !ROLES.includes(r))) errors.push(`Access "${k}" must be a list of roles (${ROLES.join(', ')}).`);
  }
  if (Array.isArray(a.editDefinition) && !a.editDefinition.includes('admin')) errors.push('Administrators must always be able to edit the definition, otherwise nobody could fix it.');
  const lists = d.lists === undefined ? undefined : d.lists;
  if (lists !== undefined) {
    if (!lists || typeof lists !== 'object') errors.push('The option lists must be an object with actors, licences and interactions.');
    else for (const name of ['actors', 'licences', 'interactions']) {
      if (lists[name] === undefined) continue;
      if (!Array.isArray(lists[name])) { errors.push(`The ${name} list must be a list of key and label pairs.`); continue; }
      uniq(lists[name], `${name} option`);
      for (const it of lists[name]) if (it && !str(it.label).trim()) errors.push(`Every ${name} option needs a label (the one with key "${it.key}" has none).`);
    }
  }
  if (errors.length) return { definition: null, errors };
  const base = JSON.parse(JSON.stringify(DEFAULT_DEFINITION));
  const definition = {
    ...base, ...d, shapeTypes, sections, fields, validationRules: rules,
    execModes: d.execModes, concurrencyModes: d.concurrencyModes,
    resolveKinds: Array.isArray(d.resolveKinds) ? d.resolveKinds : base.resolveKinds,
    scenarioLevels: base.scenarioLevels, states: base.states,
    lists: { ...base.lists, ...(lists || {}) }, access: { ...base.access, ...a }, limits: { ...base.limits, ...(d.limits || {}) },
  };
  return { definition, errors: [] };
}

/**
 * Read-time, additive only: a definition saved before journey-flow-experience-mapping gets that feature's sections and
 * fields appended (by key, never overwriting). Once an administrator saves the definition the merged result is stored
 * (`bindingsMerged`), so a field they later remove stays removed. Nothing is written here.
 */
function additiveDefaults(def) {
  if (def.bindingsMerged) return def;
  const out = { ...def, sections: [...def.sections], fields: [...def.fields] };
  const secKeys = new Set(out.sections.map((x) => x.key)); const fieldKeys = new Set(out.fields.map((x) => x.key));
  const at = out.sections.findIndex((x) => x.key === 'binding');
  const addS = DEFAULT_DEFINITION.sections.filter((x) => x.addedBy === ADDED_BY && !secKeys.has(x.key));
  out.sections.splice(at >= 0 ? at + 1 : out.sections.length, 0, ...addS.map((x) => ({ ...x })));
  for (const f of DEFAULT_DEFINITION.fields) if (f.addedBy === ADDED_BY && !fieldKeys.has(f.key)) out.fields.push({ ...f });
  out.access = { ...DEFAULT_DEFINITION.access, ...out.access };
  out.lists = { ...DEFAULT_DEFINITION.lists, ...(out.lists || {}) };
  out.shapeTypes = out.shapeTypes.map((s) => (s.key === 'parallel' && s.fanout === undefined ? { ...s, fanout: true } : s));
  return out;
}

/** The effective definition: the saved row when valid, else the platform default (reason reported, never silent). */
export async function loadDefinition() {
  try {
    const stored = await getJSON('config_state', DEFINITION_ROW);
    if (!stored) return { definition: structuredClone(DEFAULT_DEFINITION), saved: false, error: null, history: [] };
    const { definition, errors } = validateDefinition(stored.definition || stored);
    if (errors.length) return { definition: structuredClone(DEFAULT_DEFINITION), saved: false, error: `The saved definition is invalid, so the platform default is in use: ${errors.join(' ')}`, history: stored.history || [] };
    return { definition: { ...additiveDefaults(definition), version: stored.version || definition.version }, saved: true, error: null, history: stored.history || [] };
  } catch (e) {
    return { definition: structuredClone(DEFAULT_DEFINITION), saved: false, error: `The saved definition could not be read (${e.message}), so the platform default is in use.`, history: [] };
  }
}

export async function writeDefinition(definition, version, history) {
  await setJSON('config_state', DEFINITION_ROW, { version, definition: { ...definition, bindingsMerged: true }, history });
}
