// Render binding registry (2026-10-09, docs/changes/render-bindings.md).
//
// A rendering (a crystal world, a board, a tile) never reads data directly. Every visual channel it
// draws is declared here as a BINDING: one channel <- one source field (a Port object field) or one
// calculation, plus a transform, a legend, and a change policy (live | requires_approval). The
// resolver (renderBindings.js) hands the renderer only bound values; a channel with no binding is
// reported as "not mapped" and nothing is invented for it.
//
// Same shape as currentRegistry.js: platform defaults live here in code (append-only: ids and port /
// object / field keys are never renamed or removed once a member or org may reference them), and an
// org/admin override seam (config_state 'render_binding_overrides') may only disable a binding, change
// its change policy, or map a channel that has no default binding. Overrides never edit this file.
//
// Sources are L1 Ports (data_ports / port_source_objects / port_source_fields). PORTS below describes
// where the data lives; the data itself is not moved. Calculations are Ports of type 'calculation' whose
// fields are metrics evaluated with metricIntelligence.evaluateFormula; their declared variables are what
// impact analysis uses to find every metric a field feeds.

export const ROLES = ['admin', 'member'];
export const CHANGE_POLICIES = ['live', 'requires_approval'];
export const PORT_TYPES = ['platform_table', 'connector', 'calculation', 'manual'];
export const APPROVAL_PIPELINE = 'data_change';

const v = (key) => ({ op: 'variable', key });
const div = (numerator, denominator) => ({ op: 'divide', numerator, denominator });
const mul = (...args) => ({ op: 'multiply', args });

const RELEASE_STATUS_OPTIONS = ['passed', 'passed_with_backlog', 'failing', 'not passed', 'needs_human', 'queued'];

export const PORTS = [
  {
    port_key: 'release-tracker', name: 'Release tracker', port_type: 'platform_table', native_system_type: 'salt_basin_postgres',
    policy: { viewRoles: ['admin'], note: 'Describes the release_* tables. The data stays in those tables.' },
    objects: [{
      object_key: 'release_features', native_object_name: 'release_features',
      business_definition: 'One feature of a release: its outcome and how many bugs are open against it.',
      fields: [
        { field_key: 'final_status', native_field_name: 'final_status', kind: 'enum', options: RELEASE_STATUS_OPTIONS, editable_roles: ['admin'],
          business_definition: 'Where the feature ended up after validation (passed, failing, needs a human, queued).', value_domain: RELEASE_STATUS_OPTIONS.join(' | '),
          source: { table: 'release_features', column: 'final_status' } },
        { field_key: 'declared_rounds', native_field_name: 'declared_rounds', kind: 'integer', min: 0, max: 20, editable_roles: ['admin'],
          business_definition: 'How many validation rounds the release log declares for the feature.', value_domain: 'whole number 0-20',
          source: { table: 'release_features', column: 'declared_rounds' } },
        { field_key: 'tracker_open_bugs', native_field_name: 'tracker_open_bugs', kind: 'integer', min: 0, max: 50, editable_roles: ['admin'],
          business_definition: 'Open bugs the tracker reports against the feature.', value_domain: 'whole number 0-50',
          source: { table: 'release_features', column: 'tracker_open_bugs' } },
        { field_key: 'steps_total', native_field_name: 'release_rounds.steps_total', kind: 'integer', min: 0, max: 400, editable_roles: [], derived: true,
          business_definition: 'Training-spec steps in the feature\'s latest validation round (read only: derived from release_rounds).', value_domain: 'whole number',
          source: { derived: 'latest_round', column: 'steps_total' } },
        { field_key: 'steps_passed', native_field_name: 'release_rounds.steps_passed', kind: 'integer', min: 0, max: 400, editable_roles: [], derived: true,
          business_definition: 'Steps that passed in the latest validation round (read only: derived from release_rounds).', value_domain: 'whole number',
          source: { derived: 'latest_round', column: 'steps_passed' } },
      ],
    }],
  },
  {
    port_key: 'release-metrics', name: 'Release calculations', port_type: 'calculation', native_system_type: 'metric_intelligence',
    policy: { viewRoles: ['admin'] },
    objects: [{
      object_key: 'metrics', native_object_name: 'metrics', business_definition: 'Calculated measures over release tracker fields.',
      fields: [
        { field_key: 'pass_share', native_field_name: 'pass_share', kind: 'ratio', editable_roles: [], derived: true,
          business_definition: 'Share of the latest round\'s steps that passed (steps passed divided by steps total).', value_domain: '0 to 1',
          metric: { unit: 'ratio', formula: div(v('steps_passed'), v('steps_total')),
            variables: [
              { key: 'steps_passed', source: { port_key: 'release-tracker', object_key: 'release_features', field_key: 'steps_passed' } },
              { key: 'steps_total', source: { port_key: 'release-tracker', object_key: 'release_features', field_key: 'steps_total' } },
            ] } },
        { field_key: 'bugs_per_round', native_field_name: 'bugs_per_round', kind: 'ratio', editable_roles: [], derived: true,
          business_definition: 'Open bugs divided by declared validation rounds.', value_domain: '0 or more',
          metric: { unit: 'bugs per round', formula: div(v('tracker_open_bugs'), v('declared_rounds')),
            variables: [
              { key: 'tracker_open_bugs', source: { port_key: 'release-tracker', object_key: 'release_features', field_key: 'tracker_open_bugs' } },
              { key: 'declared_rounds', source: { port_key: 'release-tracker', object_key: 'release_features', field_key: 'declared_rounds' } },
            ] } },
      ],
    }],
  },
  {
    port_key: 'member-board', name: 'Workshop board entries', port_type: 'manual', native_system_type: 'manual_entry',
    policy: { viewRoles: ['admin', 'member'], note: 'Values typed in by people. The approved evidence rows are the data.' },
    objects: [{
      object_key: 'items', native_object_name: 'board items', business_definition: 'A piece of work on the workshop board.',
      fields: [
        { field_key: 'status', native_field_name: 'status', kind: 'enum', options: ['draft', 'active', 'done'], editable_roles: ['member', 'admin'],
          business_definition: 'Where the piece of work stands.', value_domain: 'draft | active | done' },
        { field_key: 'effort', native_field_name: 'effort', kind: 'integer', min: 0, max: 13, editable_roles: ['member', 'admin'],
          business_definition: 'Effort estimate in points.', value_domain: 'whole number 0-13' },
        { field_key: 'priority', native_field_name: 'priority', kind: 'integer', min: 1, max: 5, editable_roles: ['admin'],
          business_definition: 'How much the work matters (set by an administrator).', value_domain: 'whole number 1-5' },
      ],
    }],
  },
  {
    port_key: 'board-metrics', name: 'Workshop board calculations', port_type: 'calculation', native_system_type: 'metric_intelligence',
    policy: { viewRoles: ['admin', 'member'] },
    objects: [{
      object_key: 'metrics', native_object_name: 'metrics', business_definition: 'Calculated measures over workshop board fields.',
      fields: [
        { field_key: 'urgency', native_field_name: 'urgency', kind: 'integer', editable_roles: [], derived: true,
          business_definition: 'Priority multiplied by effort.', value_domain: '0 to 65',
          metric: { unit: 'points', formula: mul(v('priority'), v('effort')),
            variables: [
              { key: 'priority', source: { port_key: 'member-board', object_key: 'items', field_key: 'priority' } },
              { key: 'effort', source: { port_key: 'member-board', object_key: 'items', field_key: 'effort' } },
            ] } },
      ],
    }],
  },
  {
    port_key: 'sandbox-crm', name: 'Sandbox CRM', port_type: 'connector', native_system_type: 'salesforce',
    policy: { viewRoles: ['admin', 'member'], provider: 'salesforce', note: 'Data stays in the CRM. Changes are written back through the connector after approval.' },
    objects: [{
      object_key: 'accounts', native_object_name: 'Account', business_definition: 'The CRM account the work is for.',
      fields: [
        { field_key: 'stage', native_field_name: 'Stage', kind: 'enum', options: ['prospect', 'negotiating', 'won'], editable_roles: ['admin'],
          business_definition: 'The account\'s sales stage in the CRM.', value_domain: 'prospect | negotiating | won' },
      ],
    }],
  },
];

// Visual channels each rendering can draw. A channel with no binding is "not mapped".
export const RENDERINGS = [
  {
    key: 'release-world', label: 'Release world', subjectKind: 'release_feature', subjectNoun: 'feature', viewRoles: ['admin'],
    description: 'Release features drawn as crystals. Reads the release tracker tables; add a release and features in Release Intelligence first.',
    channels: [
      { key: 'crystal.colour', mark: 'Crystal', channel: 'Colour' },
      { key: 'crystal.size', mark: 'Crystal', channel: 'Size' },
      { key: 'crystal.ring', mark: 'Crystal', channel: 'Gold ring' },
      { key: 'crystal.satellites', mark: 'Satellites', channel: 'Count' },
      { key: 'crystal.pulse', mark: 'Crystal', channel: 'Pulse' },
      { key: 'crystal.depth', mark: 'Crystal', channel: 'Depth' },
    ],
  },
  {
    key: 'member-board', label: 'Workshop board', subjectKind: 'board_item', subjectNoun: 'item', viewRoles: ['admin', 'member'],
    description: 'Pieces of work you add here, drawn as crystals. Every value is typed in by a person.',
    channels: [
      { key: 'crystal.colour', mark: 'Crystal', channel: 'Colour' },
      { key: 'crystal.size', mark: 'Crystal', channel: 'Size' },
      { key: 'crystal.ring', mark: 'Crystal', channel: 'Gold ring' },
      { key: 'crystal.badge', mark: 'Crystal', channel: 'Badge' },
      { key: 'crystal.depth', mark: 'Crystal', channel: 'Depth' },
    ],
  },
];

const src = (port_key, object_key, field_key) => ({ port_key, object_key, field_key });

export const DEFAULT_BINDINGS = [
  { id: 'release-world:crystal.colour', rendering: 'release-world', channel: 'crystal.colour', source: src('release-tracker', 'release_features', 'final_status'),
    transform: 'status_tone', transformText: 'status -> colour', legend: 'Crystal colour = feature status', change_policy: 'live' },
  { id: 'release-world:crystal.size', rendering: 'release-world', channel: 'crystal.size', source: src('release-tracker', 'release_features', 'steps_total'),
    transform: 'scale', domain: [0, 100], transformText: 'steps / 100, capped at 1', legend: 'Crystal size = test steps in the suite', change_policy: 'live' },
  { id: 'release-world:crystal.ring', rendering: 'release-world', channel: 'crystal.ring', source: src('release-metrics', 'metrics', 'pass_share'),
    transform: 'arc', transformText: 'share 0-1 -> arc', legend: 'Gold ring = share of steps passing', change_policy: 'live' },
  { id: 'release-world:crystal.satellites', rendering: 'release-world', channel: 'crystal.satellites', source: src('release-tracker', 'release_features', 'tracker_open_bugs'),
    transform: 'count', domain: [0, 12], transformText: 'one satellite per open bug (up to 12)', legend: 'Satellites = open bugs', change_policy: 'requires_approval', approver: 'a data owner and a final approver' },
  { id: 'release-world:crystal.pulse', rendering: 'release-world', channel: 'crystal.pulse', source: src('release-metrics', 'metrics', 'bugs_per_round'),
    transform: 'pulse', domain: [0, 5], transformText: 'bugs per round -> pulse speed', legend: 'Pulse = open bugs per validation round', change_policy: 'live' },
  { id: 'member-board:crystal.colour', rendering: 'member-board', channel: 'crystal.colour', source: src('member-board', 'items', 'status'),
    transform: 'status_tone', transformText: 'status -> colour', legend: 'Crystal colour = status', change_policy: 'live' },
  { id: 'member-board:crystal.size', rendering: 'member-board', channel: 'crystal.size', source: src('member-board', 'items', 'effort'),
    transform: 'scale', domain: [0, 13], transformText: 'effort / 13', legend: 'Crystal size = effort points', change_policy: 'requires_approval', approver: 'a data owner and a final approver' },
  { id: 'member-board:crystal.ring', rendering: 'member-board', channel: 'crystal.ring', source: src('board-metrics', 'metrics', 'urgency'),
    transform: 'arc', domain: [0, 65], transformText: 'urgency / 65 -> arc', legend: 'Gold ring = urgency (priority x effort)', change_policy: 'live' },
  { id: 'member-board:crystal.badge', rendering: 'member-board', channel: 'crystal.badge', source: src('sandbox-crm', 'accounts', 'stage'),
    transform: 'label', transformText: 'CRM stage text', legend: 'Badge = CRM account stage', change_policy: 'requires_approval', approver: 'a data owner and a final approver' },
];

export const TRANSFORMS = ['status_tone', 'scale', 'arc', 'count', 'pulse', 'label'];

export function canonicalPortKey(key) { return key; }
export function findPort(portKey) { return PORTS.find((p) => p.port_key === canonicalPortKey(portKey)) || null; }
export function findField(ref) {
  const port = findPort(ref?.port_key);
  const object = port?.objects.find((o) => o.object_key === ref.object_key);
  const field = object?.fields.find((f) => f.field_key === ref.field_key);
  return port && object && field ? { port, object, field } : null;
}
export function findRendering(key) { return RENDERINGS.find((r) => r.key === key) || null; }
export const fieldRefKey = (ref) => `${canonicalPortKey(ref.port_key)}.${ref.object_key}.${ref.field_key}`;
export const sameField = (a, b) => fieldRefKey(a) === fieldRefKey(b);

/**
 * Platform defaults + overrides -> the bindings in force. An override may only
 * { enabled: false }, change { change_policy }, or (for a channel with no default binding) supply a
 * `source` + `transform`. `map` lists every channel of a rendering, bound or not.
 */
export function applyOverrides(overrides) {
  const o = (overrides && overrides.bindings) || {};
  const bindings = DEFAULT_BINDINGS.map((b) => {
    const ov = o[b.id] || {};
    return { ...b, enabled: ov.enabled !== false, change_policy: CHANGE_POLICIES.includes(ov.change_policy) ? ov.change_policy : b.change_policy, overridden: !!o[b.id], custom: false };
  });
  for (const [id, ov] of Object.entries(o)) {
    if (!id.startsWith('custom:') || !ov?.source) continue;
    const [, renderingKey, channelKey] = id.split(':');
    if (!findRendering(renderingKey)?.channels.some((c) => c.key === channelKey)) continue;
    if (bindings.some((b) => b.rendering === renderingKey && b.channel === channelKey && b.enabled && !b.custom && !b.overridden)) continue;
    const found = findField(ov.source);
    if (!found) continue;
    bindings.push({
      id, rendering: renderingKey, channel: channelKey, source: ov.source, transform: customTransform(found.field), transformText: customTransform(found.field) === 'status_tone' ? 'value -> colour' : customTransform(found.field) === 'scale' ? 'value scaled to its range' : 'value as text',
      legend: ov.legend || `${channelKey} = ${found.field.field_key}`, change_policy: CHANGE_POLICIES.includes(ov.change_policy) ? ov.change_policy : 'live',
      domain: found.field.kind === 'enum' ? undefined : [found.field.min ?? 0, found.field.max ?? 1], enabled: ov.enabled !== false, overridden: true, custom: true,
    });
  }
  return bindings;
}

export function customTransform(field) { return field.kind === 'enum' ? 'status_tone' : field.kind === 'integer' || field.kind === 'ratio' ? 'scale' : 'label'; }

export function validateOverrides(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.bindings !== 'object' || input.bindings === null) return { overrides: null, errors: ['Overrides must be { bindings: { ... } }'] };
  const out = {};
  for (const [id, ov] of Object.entries(input.bindings)) {
    const isDefault = DEFAULT_BINDINGS.some((b) => b.id === id);
    const isCustom = /^custom:[a-z0-9-]+:[a-z.]+$/.test(id);
    if (!isDefault && !isCustom) { errors.push(`Unknown binding "${id}"`); continue; }
    const clean = {};
    if (ov.enabled === false) clean.enabled = false;
    if (ov.change_policy !== undefined) {
      if (!CHANGE_POLICIES.includes(ov.change_policy)) { errors.push(`${id}: change policy must be live or requires_approval`); continue; }
      clean.change_policy = ov.change_policy;
    }
    if (isCustom) {
      const [, renderingKey, channelKey] = id.split(':');
      const r = findRendering(renderingKey);
      if (!r || !r.channels.some((c) => c.key === channelKey)) { errors.push(`${id}: unknown rendering or channel`); continue; }
      if (DEFAULT_BINDINGS.some((b) => b.rendering === renderingKey && b.channel === channelKey)) { errors.push(`${id}: that channel already has a platform binding; change that one instead`); continue; }
      if (!findField(ov.source)) { errors.push(`${id}: source field not found`); continue; }
      clean.source = { port_key: canonicalPortKey(ov.source.port_key), object_key: ov.source.object_key, field_key: ov.source.field_key };
      if (ov.legend) clean.legend = String(ov.legend).slice(0, 120);
    }
    out[id] = clean;
  }
  return { overrides: { bindings: out }, errors };
}
