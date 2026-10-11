// Render bindings: resolver, change paths and impact analysis (2026-10-09, docs/changes/render-bindings.md).
//
// No new tables. Sources are L1 Ports (data_ports / port_source_objects / port_source_fields). A bound value
// that lives on a Channel Rod is a journey_rod_evidence row (status approved | proposed | rejected | superseded);
// every change is a journey_rod_events row; approval steps are agent_approval_workflows rows (pipeline
// 'data_change'). Bindings come from renderBindingRegistry.js. Every function here is what the API route calls
// and what an MCP tool would call, with the same permission checks (roleOf / canEditField / admin-only decide).
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { db, getJSON, setJSON } from '../db.js';
import { evaluateFormula } from './metricIntelligence.js';
import { getLinkedRods } from './tributaryRegistry.js';
import { ensureReleaseIntelligenceSchema } from './releaseIntelligenceSchema.js';
import * as Reg from './renderBindingRegistry.js';

export const CONFIG_ROW_ID = 'render_binding_overrides';
export const SUBJECT_ROD_TYPE = 'render_binding_subject';
export const EVENT_TYPES = ['value_changed', 'change_proposed', 'change_approved', 'change_rejected', 'writeback_failed'];

const err = (status, message, code) => Object.assign(new Error(message), { status, code });

// ── Fan-out ────────────────────────────────────────────────────────────────
export const bus = new EventEmitter();
bus.setMaxListeners(200);
function emitChange(payload) { bus.emit('change', { ...payload, at: Date.now() }); }

// ── Roles ──────────────────────────────────────────────────────────────────
export const roleOf = (user) => (user?.role === 'admin' ? 'admin' : 'member');

// ── Seeding (idempotent, insert-only: never overwrites an administrator's later edit) ─────────────
let seeded;
export function ensureSeeded() {
  if (seeded) return seeded;
  seeded = (async () => {
    const now = Date.now();
    for (const p of Reg.PORTS) {
      let port = await db.prepare(`SELECT id FROM data_ports WHERE port_key=$1 AND org_id IS NULL`).get(p.port_key);
      if (!port) {
        port = await db.prepare(
          `INSERT INTO data_ports (port_key, org_id, name, port_type, native_system_type, policy, created_at, updated_at) VALUES ($1,NULL,$2,$3,$4,$5,$6,$6) RETURNING id`,
        ).get(p.port_key, p.name, p.port_type, p.native_system_type || null, p.policy || {}, now);
      }
      for (const o of p.objects) {
        let obj = await db.prepare(`SELECT id FROM port_source_objects WHERE port_id=$1 AND object_key=$2`).get(port.id, o.object_key);
        if (!obj) {
          obj = await db.prepare(
            `INSERT INTO port_source_objects (port_id, object_key, native_object_name, business_definition, metadata, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING id`,
          ).get(port.id, o.object_key, o.native_object_name, o.business_definition || null, {}, now);
        }
        for (const f of o.fields) {
          const exists = await db.prepare(`SELECT id FROM port_source_fields WHERE source_object_id=$1 AND field_key=$2`).get(obj.id, f.field_key);
          if (exists) continue;
          const { field_key, native_field_name, business_definition, value_domain, editable_roles, ...meta } = f;
          await db.prepare(
            `INSERT INTO port_source_fields (source_object_id, field_key, native_field_name, business_definition, value_domain, editable_roles, metadata, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
          ).run(obj.id, field_key, native_field_name, business_definition || null, value_domain || null, editable_roles || [], meta, now);
        }
      }
    }
    const steps = [
      ['owner_review', 'Data owner review', 0, 'Data owner', 'Confirms the proposed value is correct and the impact is understood.'],
      ['final_approval', 'Final approval', 1, 'Final approver', 'Approves the change so every bound rendering and calculation updates.'],
    ];
    for (const [key, name, order, label, note] of steps) {
      const has = await db.prepare(`SELECT id FROM agent_approval_workflows WHERE pipeline=$1 AND step_key=$2 AND org_id IS NULL`).get(Reg.APPROVAL_PIPELINE, key);
      if (!has) await db.prepare(
        `INSERT INTO agent_approval_workflows (org_id, pipeline, step_key, name, sort_order, required_role_label, note, created_at, updated_at) VALUES (NULL,$1,$2,$3,$4,$5,$6,$7,$7)`,
      ).run(Reg.APPROVAL_PIPELINE, key, name, order, label, note, now);
    }
  })().catch((e) => { seeded = null; throw e; });
  return seeded;
}

/** The registry with the stored editable_roles / view roles applied (these are edited from the Settings tab). */
export async function loadCatalog() {
  await ensureSeeded();
  const rows = await db.prepare(
    `SELECT p.port_key, p.policy, o.object_key, f.field_key, f.editable_roles, f.id AS field_id
       FROM data_ports p JOIN port_source_objects o ON o.port_id=p.id JOIN port_source_fields f ON f.source_object_id=o.id
      WHERE p.org_id IS NULL AND p.port_key = ANY($1)`,
  ).all(Reg.PORTS.map((p) => p.port_key));
  const byKey = new Map(rows.map((r) => [`${r.port_key}.${r.object_key}.${r.field_key}`, r]));
  const portPolicy = new Map(rows.map((r) => [r.port_key, r.policy]));
  return Reg.PORTS.map((p) => ({
    ...p,
    policy: { ...p.policy, ...(portPolicy.get(p.port_key) || {}) },
    objects: p.objects.map((o) => ({
      ...o,
      fields: o.fields.map((f) => {
        const row = byKey.get(`${p.port_key}.${o.object_key}.${f.field_key}`);
        const roles = row && Array.isArray(row.editable_roles) ? row.editable_roles : f.editable_roles;
        return { ...f, editable_roles: f.derived ? [] : roles, fieldId: row ? Number(row.field_id) : null };
      }),
    })),
  }));
}
function lookup(catalog, ref) {
  const port = catalog.find((p) => p.port_key === ref.port_key);
  const object = port?.objects.find((o) => o.object_key === ref.object_key);
  const field = object?.fields.find((f) => f.field_key === ref.field_key);
  return port && object && field ? { port, object, field } : null;
}
const keyOf = Reg.fieldRefKey;
const labelOf = (ref, catalog) => { const l = lookup(catalog, ref); return l ? `${l.port.name} / ${l.field.field_key.replace(/_/g, ' ')}` : keyOf(ref); };
const fieldLabel = (field) => field.field_key.replace(/_/g, ' ');

// ── Overrides (Settings tab) ───────────────────────────────────────────────
export async function loadOverrides() {
  try {
    const stored = await getJSON('config_state', CONFIG_ROW_ID);
    if (!stored) return { overrides: { bindings: {} }, overrideError: null };
    const { overrides, errors } = Reg.validateOverrides(stored);
    if (errors.length) return { overrides: { bindings: {} }, overrideError: `Saved binding overrides are invalid, platform defaults are in use: ${errors.join('; ')}` };
    return { overrides, overrideError: null };
  } catch (e) {
    return { overrides: { bindings: {} }, overrideError: `${CONFIG_ROW_ID} could not be read: ${e.message}` };
  }
}
export async function saveOverrides(input) {
  const { overrides, errors } = Reg.validateOverrides(input);
  if (errors.length) throw err(400, errors.join('; '));
  await setJSON('config_state', CONFIG_ROW_ID, overrides);
  return overrides;
}
export async function loadBindings() {
  const { overrides, overrideError } = await loadOverrides();
  return { bindings: Reg.applyOverrides(overrides), overrideError, overrides };
}

export async function updateFieldRoles(portKey, objectKey, fieldKey, roles) {
  const catalog = await loadCatalog();
  const l = lookup(catalog, { port_key: portKey, object_key: objectKey, field_key: fieldKey });
  if (!l) throw err(404, 'Field not found');
  if (l.field.derived) throw err(400, 'A derived field is read only and cannot be made editable');
  if (!Array.isArray(roles) || roles.some((r) => !Reg.ROLES.includes(r))) throw err(400, `Roles must be a list of: ${Reg.ROLES.join(', ')}`);
  await db.prepare(`UPDATE port_source_fields SET editable_roles=$1, updated_at=$2 WHERE id=$3`).run([...new Set(roles)], Date.now(), l.field.fieldId);
  return { ok: true, editableRoles: [...new Set(roles)] };
}

// ── Approval steps ─────────────────────────────────────────────────────────
export async function listWorkflowSteps() {
  await ensureSeeded();
  return (await db.prepare(`SELECT id, step_key, name, sort_order, required_role_label, note, is_active FROM agent_approval_workflows WHERE pipeline=$1 AND org_id IS NULL ORDER BY sort_order, id`).all(Reg.APPROVAL_PIPELINE))
    .map((r) => ({ id: Number(r.id), key: r.step_key, name: r.name, order: Number(r.sort_order), roleLabel: r.required_role_label, note: r.note, active: !!r.is_active }));
}
export async function updateWorkflowStep(id, { name, roleLabel, active }) {
  const steps = await listWorkflowSteps();
  const step = steps.find((s) => s.id === Number(id));
  if (!step) throw err(404, 'Approval step not found');
  const nextActive = active === undefined ? step.active : !!active;
  if (!nextActive && steps.filter((s) => s.active && s.id !== step.id).length === 0) throw err(400, 'At least one approval step must stay active');
  const nextName = name === undefined ? step.name : String(name).trim();
  if (!nextName) throw err(400, 'Give the step a name');
  await db.prepare(`UPDATE agent_approval_workflows SET name=$1, required_role_label=$2, is_active=$3, updated_at=$4 WHERE id=$5`)
    .run(nextName, roleLabel === undefined ? step.roleLabel : (String(roleLabel).trim() || null), nextActive, Date.now(), step.id);
  return listWorkflowSteps();
}

// ── Subjects (the things a rendering draws) ───────────────────────────────
async function findRod(subjectKey) {
  return db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type=$1 AND metadata->>'subjectKey'=$2 ORDER BY id LIMIT 1`).get(SUBJECT_ROD_TYPE, subjectKey);
}
async function ensureRod(rendering, subject) {
  const found = await findRod(subject.subjectKey);
  if (found) return Number(found.id);
  const now = Date.now();
  const r = await db.prepare(
    `INSERT INTO journey_data_rods (rod_type, current_stage, metadata, created_at, updated_at) VALUES ($1,'bound',$2::jsonb,$3,$3) RETURNING id`,
  ).get(SUBJECT_ROD_TYPE, { renderingKey: rendering.key, subjectKey: subject.subjectKey, title: subject.title }, now);
  return Number(r.id);
}

export async function listSubjects(renderingKey) {
  const rendering = Reg.findRendering(renderingKey);
  if (!rendering) throw err(404, 'Rendering not found');
  if (rendering.key === 'release-world') {
    await ensureReleaseIntelligenceSchema();
    const rows = await db.prepare(
      `SELECT f.id, f.feature_key, f.name, r.release_key FROM release_features f JOIN release_records r ON r.id=f.release_id ORDER BY r.release_date_ms DESC, f.feature_key`,
    ).all();
    return rows.map((r) => ({ subjectKey: `release_features:${r.id}`, title: r.name || r.feature_key, sub: `${r.release_key} / ${r.feature_key}`, recordId: Number(r.id) }));
  }
  const rods = await db.prepare(`SELECT id, metadata FROM journey_data_rods WHERE rod_type=$1 AND metadata->>'renderingKey'=$2 ORDER BY id`).all(SUBJECT_ROD_TYPE, rendering.key);
  return rods.map((r) => ({ subjectKey: `board:${r.id}`, title: r.metadata?.title || `Item ${r.id}`, sub: `Added by ${r.metadata?.createdByLabel || 'unknown'}`, rodId: Number(r.id) }));
}
export async function getSubject(renderingKey, subjectKey) {
  const list = await listSubjects(renderingKey);
  const s = list.find((x) => x.subjectKey === subjectKey);
  if (!s) throw err(404, 'That item was not found in this rendering');
  return s;
}
export async function createBoardItem(user, title) {
  const t = String(title || '').trim();
  if (!t) throw err(400, 'Give the item a title');
  if (t.length > 80) throw err(400, 'Keep the title to 80 characters or fewer');
  const now = Date.now();
  const row = await db.prepare(`INSERT INTO journey_data_rods (rod_type, current_stage, metadata, created_at, updated_at) VALUES ($1,'bound',$2::jsonb,$3,$3) RETURNING id`)
    .get(SUBJECT_ROD_TYPE, { renderingKey: 'member-board', title: t, createdBy: user.id, createdByLabel: user.name || user.displayName || user.email }, now);
  const subjectKey = `board:${row.id}`;
  await db.prepare(`UPDATE journey_data_rods SET metadata = metadata || $1::jsonb WHERE id=$2`).run({ subjectKey }, row.id);
  return getSubject('member-board', subjectKey);
}

// ── Reading values ─────────────────────────────────────────────────────────
async function evidenceFor(rodId, molecule, status) {
  if (!rodId) return null;
  return db.prepare(
    `SELECT * FROM journey_rod_evidence WHERE rod_id=$1 AND molecule_key=$2 AND status=$3 ORDER BY observed_at DESC, id DESC LIMIT 1`,
  ).get(rodId, molecule, status);
}
async function latestRound(subject) {
  if (!subject.recordId) return null;
  const f = await db.prepare(`SELECT release_id, feature_key FROM release_features WHERE id=$1`).get(subject.recordId);
  if (!f) return null;
  return db.prepare(`SELECT steps_passed, steps_total FROM release_rounds WHERE release_id=$1 AND feature_key=$2 ORDER BY round_no DESC, id DESC LIMIT 1`).get(f.release_id, f.feature_key);
}
const emptyText = (port) => (port.port_type === 'platform_table' || port.port_type === 'calculation' ? 'not recorded' : 'not set');
const SOURCE_LABEL = { platform_table: 'Platform table', connector: 'Connector', calculation: 'Calculation', manual: 'Manual entry' };

/**
 * Read one source field for one subject. `assume` maps "port.object.field" -> a value to use instead of the
 * stored one (that is how a ghost and an impact "after" are computed without writing anything).
 */
export async function readField(catalog, ref, subject, ctx = {}) {
  const l = lookup(catalog, ref);
  if (!l) return { value: null, display: 'not mapped', note: 'The source field does not exist', sourceType: null };
  const { port, field } = l;
  const k = keyOf(ref);
  const base = { ref, sourceType: port.port_type, sourceLabel: SOURCE_LABEL[port.port_type], portName: port.name, emptyText: emptyText(port) };
  if (ctx.assume && Object.prototype.hasOwnProperty.call(ctx.assume, k)) return { ...base, value: ctx.assume[k], assumed: true, observedAt: null, confidence: null };
  if (port.port_type === 'calculation') {
    const vars = {};
    const missing = [];
    let observedAt = null; let confidence = null; let ghostDeps = false;
    for (const variable of field.metric.variables) {
      const r = await readField(catalog, variable.source, subject, ctx);
      if (r.value === null || r.value === undefined || Number.isNaN(Number(r.value))) missing.push(variable.key); else vars[variable.key] = Number(r.value);
      if (r.observedAt) observedAt = Math.max(observedAt || 0, r.observedAt);
      if (r.confidence !== null && r.confidence !== undefined) confidence = confidence === null ? r.confidence : Math.min(confidence, r.confidence);
      ghostDeps = ghostDeps || r.assumed;
    }
    if (missing.length) return { ...base, value: null, note: `Cannot be calculated: ${missing.join(', ')} not recorded`, observedAt, confidence, assumed: ghostDeps };
    const value = evaluateFormula(field.metric.formula, vars);
    if (value === null) return { ...base, value: null, note: 'Cannot be calculated: division by zero', observedAt, confidence, assumed: ghostDeps };
    return { ...base, value, inputs: vars, unit: field.metric.unit, observedAt, confidence, assumed: ghostDeps, note: null };
  }
  if (port.port_type === 'platform_table') {
    if (field.source?.derived === 'latest_round') {
      const round = await latestRound(subject);
      const value = round ? round[field.source.column] : null;
      return { ...base, value: value === null || value === undefined ? null : Number(value), observedAt: null, confidence: null, note: round ? null : 'No validation round recorded for this feature' };
    }
    if (!subject.recordId) return { ...base, value: null, note: 'No record' };
    const row = await db.prepare(`SELECT ${field.source.column} AS v, updated_at FROM ${field.source.table} WHERE id=$1`).get(subject.recordId);
    const raw = row ? row.v : null;
    const value = raw === null || raw === undefined ? null : (field.kind === 'integer' ? Number(raw) : raw);
    const ev = await evidenceFor(subject.rodId, k, 'approved');
    return { ...base, value, observedAt: ev ? Number(ev.observed_at) : (row ? Number(row.updated_at) : null), confidence: null, changedBy: ev?.metadata?.actorLabel || null, evidenceId: ev ? Number(ev.id) : null };
  }
  // manual + connector: the latest approved evidence row is the value.
  const ev = await evidenceFor(subject.rodId, k, 'approved');
  const out = { ...base, value: ev ? ev.value : null, observedAt: ev ? Number(ev.observed_at) : null, confidence: ev && ev.confidence !== null ? Number(ev.confidence) : null, changedBy: ev?.metadata?.actorLabel || null, evidenceId: ev ? Number(ev.id) : null };
  if (port.port_type === 'connector') {
    out.note = 'Last approved value. The connector is not read live.';
    if (ev?.metadata?.writeback?.status === 'failed') out.writebackFailed = ev.metadata.writeback.error;
  }
  return out;
}

const TONE = {
  passed: 'good', passed_with_backlog: 'good', failing: 'bad', 'not passed': 'bad', needs_human: 'human', queued: 'muted',
  draft: 'muted', active: 'teal', done: 'good', prospect: 'muted', negotiating: 'teal', won: 'good',
};
const human = (v) => String(v).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const round2 = (n) => Math.round(n * 100) / 100;

export function transformValue(binding, read) {
  if (read.value === null || read.value === undefined) return { display: read.emptyText || 'not recorded', normalized: null, tone: 'muted', empty: true };
  const v = read.value;
  const [d0, d1] = binding.domain || [0, 1];
  switch (binding.transform) {
    case 'status_tone': return { display: human(v), normalized: null, tone: TONE[v] || 'teal' };
    case 'scale': return { display: String(round2(Number(v))), normalized: clamp01((Number(v) - d0) / ((d1 - d0) || 1)), tone: 'teal' };
    case 'arc': return binding.domain
      ? { display: `${round2(Number(v))} of ${d1}`, normalized: clamp01((Number(v) - d0) / ((d1 - d0) || 1)), tone: 'gold' }
      : { display: `${Math.round(Number(v) * 100)}%`, normalized: clamp01(Number(v)), tone: 'gold' };
    case 'count': return { display: String(Math.round(Number(v))), normalized: Math.min(Math.round(Number(v)), d1), tone: 'bad', count: Math.min(Math.round(Number(v)), d1) };
    case 'pulse': return { display: String(round2(Number(v))), normalized: clamp01((Number(v) - d0) / ((d1 - d0) || 1)), tone: 'gold' };
    default: return { display: human(v), normalized: null, tone: 'teal' };
  }
}

function dependencies(catalog, binding) {
  const l = lookup(catalog, binding.source);
  if (!l) return [];
  if (l.port.port_type === 'calculation') return l.field.metric.variables.map((x) => x.source);
  return [binding.source];
}
const readsField = (catalog, binding, ref) => dependencies(catalog, binding).some((d) => Reg.sameField(d, ref));

async function pendingMap(rodId) {
  if (!rodId) return new Map();
  const rows = await db.prepare(`SELECT * FROM journey_rod_evidence WHERE rod_id=$1 AND status='proposed' ORDER BY id`).all(rodId);
  return new Map(rows.map((r) => [r.molecule_key, r]));
}

function describePending(ev, steps) {
  const idx = Number(ev.metadata?.stepIndex || 0);
  const snap = ev.metadata?.steps || steps;
  const step = snap[Math.min(idx, snap.length - 1)];
  return {
    id: Number(ev.id), value: ev.value, before: ev.metadata?.before ?? null, proposedByLabel: ev.metadata?.proposedByLabel || 'unknown', proposedBy: ev.proposed_by ? Number(ev.proposed_by) : null,
    note: ev.metadata?.note || null, stepNumber: idx + 1, stepTotal: snap.length, stepName: step?.name || null, roleLabel: step?.roleLabel || null, proposedAt: Number(ev.observed_at),
  };
}

/** Everything a rendering may draw for one subject: only bound values, each with its provenance. */
export async function resolveSubject(rendering, subject, { catalog, bindings, steps }) {
  const rodRow = subject.rodId ? { id: subject.rodId } : await findRod(subject.subjectKey);
  const withRod = { ...subject, rodId: rodRow ? Number(rodRow.id) : null };
  const pend = await pendingMap(withRod.rodId);
  const pendingAssume = {};
  for (const [k, ev] of pend) pendingAssume[k] = ev.value;
  const channels = [];
  for (const ch of rendering.channels) {
    const binding = bindings.find((b) => b.rendering === rendering.key && b.channel === ch.key && b.enabled);
    const row = { channelKey: ch.key, mark: ch.mark, channel: ch.channel, label: `${ch.mark} ${ch.channel.toLowerCase()}` };
    if (!binding) { channels.push({ ...row, mapped: false, display: 'not mapped', legend: 'No source field is mapped to this channel, so nothing is drawn for it.' }); continue; }
    const l = lookup(catalog, binding.source);
    if (!l) { channels.push({ ...row, mapped: false, display: 'not mapped', legend: 'The mapped source field no longer exists.' }); continue; }
    const read = await readField(catalog, binding.source, withRod);
    const t = transformValue(binding, read);
    const entry = {
      ...row, mapped: true, bindingId: binding.id, legend: binding.legend, transform: binding.transformText, changePolicy: binding.change_policy, approver: binding.approver || null,
      source: { portKey: l.port.port_key, portName: l.port.name, portType: l.port.port_type, sourceTypeLabel: SOURCE_LABEL[l.port.port_type], objectKey: l.object.object_key, fieldKey: l.field.field_key, text: `${l.port.port_key} > ${l.object.object_key} > ${l.field.field_key}`,
        calculation: l.port.port_type === 'calculation' ? l.field.metric.variables.map((x) => `${x.source.port_key} > ${x.source.object_key} > ${x.source.field_key}`) : null },
      value: read.value, display: t.display, normalized: t.normalized, tone: t.tone, count: t.count ?? null, empty: !!t.empty, note: read.note || null,
      observedAt: read.observedAt || null, confidence: read.confidence ?? null, changedBy: read.changedBy || null, writebackFailed: read.writebackFailed || null,
    };
    // Ghost: the same channel computed with every pending proposal applied.
    const depKeys = dependencies(catalog, binding).map(keyOf);
    const pendingDeps = depKeys.filter((k) => pend.has(k));
    if (pendingDeps.length) {
      const gRead = await readField(catalog, binding.source, withRod, { assume: pendingAssume });
      const g = transformValue(binding, gRead);
      entry.ghost = { display: g.display, normalized: g.normalized, tone: g.tone, count: g.count ?? null, pending: pendingDeps.map((k) => describePending(pend.get(k), steps)) };
    }
    channels.push(entry);
  }
  return { subjectKey: subject.subjectKey, title: subject.title, sub: subject.sub, channels, pendingCount: pend.size };
}

/** Editable (non-derived) fields reachable from the rendering's bindings, with the caller's permission. */
export function editableFields(rendering, { catalog, bindings }, user) {
  const role = roleOf(user);
  const seen = new Map();
  for (const b of bindings.filter((x) => x.rendering === rendering.key && x.enabled)) {
    for (const dep of dependencies(catalog, b)) {
      const l = lookup(catalog, dep);
      if (!l || l.field.derived || l.port.port_type === 'calculation') continue;
      const k = keyOf(dep);
      const cur = seen.get(k) || { ref: Reg.findField(dep) ? dep : dep, port: l.port, object: l.object, field: l.field, policy: 'live', channels: [] };
      // The field's policy is the strictest policy of any binding reading it.
      if (b.change_policy === 'requires_approval') cur.policy = 'requires_approval';
      cur.channels.push(`${rendering.channels.find((c) => c.key === b.channel)?.mark} ${rendering.channels.find((c) => c.key === b.channel)?.channel.toLowerCase()}`);
      seen.set(k, cur);
    }
  }
  return [...seen.values()].map((x) => ({
    portKey: x.port.port_key, portName: x.port.name, portType: x.port.port_type, objectKey: x.object.object_key, fieldKey: x.field.field_key,
    label: fieldLabel(x.field), kind: x.field.kind, options: x.field.options || null, min: x.field.min ?? null, max: x.field.max ?? null,
    definition: x.field.business_definition, valueDomain: x.field.value_domain, editableRoles: x.field.editable_roles,
    canEdit: x.field.editable_roles.includes(role), changePolicy: x.policy, drives: [...new Set(x.channels)],
  }));
}

async function context() {
  const catalog = await loadCatalog();
  const { bindings, overrideError } = await loadBindings();
  const steps = (await listWorkflowSteps()).filter((s) => s.active);
  return { catalog, bindings, steps, overrideError };
}

function assertCanView(rendering, user) {
  if (!rendering.viewRoles.includes(roleOf(user))) throw err(403, `Your role (${roleOf(user)}) cannot open the ${rendering.label}`);
}

export async function listRenderings(user) {
  const out = [];
  for (const r of Reg.RENDERINGS) {
    if (r.internal) continue;
    if (!r.viewRoles.includes(roleOf(user))) continue;
    out.push({ key: r.key, label: r.label, description: r.description, subjectNoun: r.subjectNoun, canAddSubjects: r.key === 'member-board', channels: r.channels });
  }
  return out;
}

export async function viewRendering(user, renderingKey) {
  const rendering = Reg.findRendering(renderingKey);
  if (!rendering) throw err(404, 'Rendering not found');
  assertCanView(rendering, user);
  const ctx = await context();
  const subjects = await listSubjects(renderingKey);
  const items = [];
  for (const s of subjects) items.push(await resolveSubject(rendering, s, ctx));
  return { rendering: { key: rendering.key, label: rendering.label, description: rendering.description, subjectNoun: rendering.subjectNoun, canAddSubjects: rendering.key === 'member-board' }, subjects: items, overrideError: ctx.overrideError };
}

export async function viewSubject(user, renderingKey, subjectKey) {
  const rendering = Reg.findRendering(renderingKey);
  if (!rendering) throw err(404, 'Rendering not found');
  assertCanView(rendering, user);
  const ctx = await context();
  const subject = await getSubject(renderingKey, subjectKey);
  const resolved = await resolveSubject(rendering, subject, ctx);
  const fields = editableFields(rendering, ctx, user);
  const rod = await findRod(subjectKey);
  const pend = await pendingMap(rod ? Number(rod.id) : null);
  const withVals = [];
  for (const f of fields) {
    const ref = { port_key: f.portKey, object_key: f.objectKey, field_key: f.fieldKey };
    const read = await readField(ctx.catalog, ref, { ...subject, rodId: rod ? Number(rod.id) : null });
    const p = pend.get(keyOf(ref));
    withVals.push({ ...f, value: read.value, display: read.value === null || read.value === undefined ? read.emptyText : String(read.value), pending: p ? describePending(p, ctx.steps) : null, writebackFailed: read.writebackFailed || null });
  }
  return { ...resolved, renderingKey, renderingLabel: rendering.label, fields: withVals, steps: ctx.steps };
}

// ── Impact analysis (computed on demand; a snapshot rides on the change_proposed event) ─────────────
const valueText = (t) => t.display;
export async function computeImpact(ctx, rendering, subject, ref, afterValue) {
  const { catalog, bindings } = ctx;
  const rodId = subject.rodId || null;
  const withRod = { ...subject, rodId };
  const assume = { [keyOf(ref)]: afterValue };
  const marks = [];
  const alsoRead = [];
  for (const b of bindings.filter((x) => x.enabled && readsField(catalog, x, ref))) {
    const r = Reg.findRendering(b.rendering);
    const l = lookup(catalog, b.source);
    const ch = r.channels.find((c) => c.key === b.channel);
    const via = l.port.port_type === 'calculation' ? `${l.field.field_key.replace(/_/g, ' ')} (calculation)` : null;
    if (b.rendering !== rendering.key) { alsoRead.push({ rendering: r.label, mark: ch.mark, channel: ch.channel }); continue; }
    const before = transformValue(b, await readField(catalog, b.source, withRod));
    const after = transformValue(b, await readField(catalog, b.source, withRod, { assume }));
    marks.push({ rendering: r.label, mark: ch.mark, channel: ch.channel, via, before: valueText(before), after: valueText(after), changes: valueText(before) !== valueText(after) });
  }
  const metrics = [];
  for (const p of catalog.filter((x) => x.port_type === 'calculation')) {
    for (const f of p.objects[0].fields) {
      if (!f.metric.variables.some((x) => Reg.sameField(x.source, ref))) continue;
      const mref = { port_key: p.port_key, object_key: p.objects[0].object_key, field_key: f.field_key };
      const b = await readField(catalog, mref, withRod);
      const a = await readField(catalog, mref, withRod, { assume });
      const show = (x) => (x.value === null || x.value === undefined ? (x.note || 'not recorded') : `${round2(Number(x.value))} ${f.metric.unit}`);
      metrics.push({ metric: fieldLabel(f), portName: p.name, before: show(b), after: show(a), changes: show(b) !== show(a) });
    }
  }
  const connected = [];
  if (rodId) {
    try {
      for (const l of await getLinkedRods(rodId)) connected.push({ rodId: Number(l.linkedRodId), relationship: l.tributaryType });
      const kids = await db.prepare(`SELECT id, rod_type FROM journey_data_rods WHERE parent_rod_id=$1`).all(rodId);
      for (const k of kids) connected.push({ rodId: Number(k.id), relationship: `child (${k.rod_type})` });
      const par = await db.prepare(`SELECT parent_rod_id FROM journey_data_rods WHERE id=$1`).get(rodId);
      if (par?.parent_rod_id) connected.push({ rodId: Number(par.parent_rod_id), relationship: 'parent' });
    } catch (e) { throw err(500, `Connected rods could not be read: ${e.message}`); }
  }
  const lines = [
    ...marks.map((m) => `${m.rendering}: ${m.mark} ${m.channel.toLowerCase()}${m.via ? ` via ${m.via}` : ''} ${m.before} -> ${m.after}`),
    ...metrics.map((m) => `Calculation ${m.metric}: ${m.before} -> ${m.after}`),
    ...connected.map((c) => `Connected rod #${c.rodId} (${c.relationship})`),
  ];
  if (!connected.length) lines.push('No connected rods');
  return { computedAt: Date.now(), marks, metrics, connectedRods: connected, alsoRead, lines };
}

export async function impactForChange(user, evidenceId) {
  const ev = await db.prepare(`SELECT * FROM journey_rod_evidence WHERE id=$1`).get(evidenceId);
  if (!ev) throw err(404, 'Change not found');
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(ev.rod_id);
  const ref = refFromKey(ev.molecule_key);
  const rendering = Reg.findRendering(rod.metadata.renderingKey);
  const ctx = await context();
  const subject = { ...(await getSubject(rendering.key, rod.metadata.subjectKey)), rodId: Number(rod.id) };
  const fresh = await computeImpact(ctx, rendering, subject, ref, ev.value);
  const proposedEvent = await db.prepare(`SELECT metadata FROM journey_rod_events WHERE rod_id=$1 AND event_type='change_proposed' AND metadata->>'evidenceId'=$2 ORDER BY id DESC LIMIT 1`).get(ev.rod_id, String(ev.id));
  return { current: fresh, snapshot: proposedEvent?.metadata?.impact || null };
}
function refFromKey(k) { const [port_key, object_key, field_key] = k.split('.'); return { port_key, object_key, field_key }; }

// ── Changing a value ───────────────────────────────────────────────────────
function coerce(field, raw) {
  if (field.kind === 'enum') {
    const v = String(raw ?? '').trim();
    if (!field.options.includes(v)) throw err(400, `${fieldLabel(field)} must be one of: ${field.options.join(', ')}`);
    return v;
  }
  if (field.kind === 'integer') {
    const s = String(raw ?? '').trim();
    if (!/^-?\d+$/.test(s)) throw err(400, `${fieldLabel(field)} must be a whole number`);
    const n = Number(s);
    if (n < field.min || n > field.max) throw err(400, `${fieldLabel(field)} must be between ${field.min} and ${field.max}`);
    return n;
  }
  throw err(400, `${fieldLabel(field)} cannot be edited`);
}
const actorLabel = (user) => user.name || user.displayName || user.email || `user ${user.id}`;

async function insertEvent(rodId, type, metadata) {
  await db.prepare(`INSERT INTO journey_rod_events (rod_id, event_type, metadata, created_at) VALUES ($1,$2,$3::jsonb,$4)`).run(rodId, type, metadata, Date.now());
}

async function writeBack(catalog, ref, subject, value, user) {
  const l = lookup(catalog, ref);
  if (l.port.port_type === 'platform_table') {
    const res = await db.prepare(`UPDATE ${l.field.source.table} SET ${l.field.source.column}=$1, updated_at=$2 WHERE id=$3`).run(value, Date.now(), subject.recordId);
    if (!res.changes) throw err(404, 'The source record no longer exists, so the value was not written');
    return { status: 'written' };
  }
  if (l.port.port_type === 'connector') {
    // Write-back goes through the connector's own API. No connector adapter is implemented yet, so every
    // attempt reports exactly why it did not reach the system: never a silent success.
    const provider = l.port.policy?.provider;
    const conn = await db.prepare(`SELECT allow_write FROM member_oauth_connections WHERE user_id=$1 AND provider=$2`).get(user.id, provider);
    if (!conn) throw new Error(`${human(provider)} is not connected for ${actorLabel(user)}, so the value was not written to ${l.port.name}. The approved value is kept here.`);
    if (!conn.allow_write) throw new Error(`Write access is off for the ${human(provider)} connection, so the value was not written to ${l.port.name}. The approved value is kept here.`);
    throw new Error(`Write-back to ${human(provider)} is not implemented yet, so the value was not written to ${l.port.name}. The approved value is kept here.`);
  }
  return { status: 'recorded' };
}

async function applyApproved({ catalog, ref, subject, rodId, value, before, user, mode, evidenceId, stepInfo }) {
  const l = lookup(catalog, ref);
  const molecule = keyOf(ref);
  // 1) the source first: if a platform table cannot be written the change is not recorded as applied.
  if (l.port.port_type === 'platform_table') await writeBack(catalog, ref, subject, value, user);
  const now = Date.now();
  let id = evidenceId;
  if (id) {
    await db.prepare(`UPDATE journey_rod_evidence SET status='superseded' WHERE rod_id=$1 AND molecule_key=$2 AND status='approved' AND id<>$3`).run(rodId, molecule, id);
    await db.prepare(`UPDATE journey_rod_evidence SET status='approved', decided_by=$1, decided_at=$2, observed_at=$2, metadata = metadata || $3::jsonb WHERE id=$4`)
      .run(user.id, now, { decidedByLabel: actorLabel(user), actorLabel: actorLabel(user) }, id);
  } else {
    await db.prepare(`UPDATE journey_rod_evidence SET status='superseded' WHERE rod_id=$1 AND molecule_key=$2 AND status='approved'`).run(rodId, molecule);
    const row = await db.prepare(
      `INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, status, proposed_by, decided_by, decided_at, metadata)
       VALUES ($1,$2,$3,$4,$5,1,$6,'approved',$7,$7,$6,$8) RETURNING id`,
    ).get(rodId, molecule, value, 'live_change', `change:${crypto.randomUUID()}`, now, user.id, { before, actorLabel: actorLabel(user), mode });
    id = Number(row.id);
  }
  const base = { evidenceId: id, field: molecule, fieldLabel: fieldLabel(l.field), before, after: value, by: user.id, byLabel: actorLabel(user), portName: l.port.name, emptyText: emptyText(l.port) };
  await insertEvent(rodId, mode === 'live' ? 'value_changed' : 'change_approved', { ...base, mode, final: true, ...(stepInfo || {}) });
  // 2) connectors are written after the value is recorded; a failure is recorded and shown, never swallowed.
  let writeback = null;
  if (l.port.port_type === 'connector') {
    try { await writeBack(catalog, ref, subject, value, user); writeback = { status: 'written' }; } catch (e) {
      writeback = { status: 'failed', error: e.message };
      await db.prepare(`UPDATE journey_rod_evidence SET metadata = metadata || $1::jsonb WHERE id=$2`).run({ writeback }, id);
      await insertEvent(rodId, 'writeback_failed', { ...base, error: e.message });
    }
  }
  return { evidenceId: id, writeback };
}

export async function submitChange(user, { renderingKey, subjectKey, portKey, objectKey, fieldKey, value, note }) {
  const rendering = Reg.findRendering(renderingKey);
  if (!rendering) throw err(404, 'Rendering not found');
  assertCanView(rendering, user);
  const ctx = await context();
  const ref = { port_key: portKey, object_key: objectKey, field_key: fieldKey };
  const found = lookup(ctx.catalog, ref);
  if (!found) throw err(404, 'Source field not found');
  const editable = editableFields(rendering, ctx, user).find((f) => f.portKey === portKey && f.objectKey === objectKey && f.fieldKey === fieldKey);
  if (!editable) throw err(400, `${fieldLabel(found.field)} is not drawn by the ${rendering.label}, so it cannot be changed from here`);
  if (!found.field.editable_roles.includes(roleOf(user))) {
    throw err(403, `Your role (${roleOf(user)}) cannot edit ${fieldLabel(found.field)}. Roles allowed to edit it: ${found.field.editable_roles.join(', ') || 'none (read only)'}.`, 'role_not_allowed');
  }
  const next = coerce(found.field, value);
  const subject = await getSubject(renderingKey, subjectKey);
  const rodId = await ensureRod(rendering, subject);
  const withRod = { ...subject, rodId };
  const pend = await pendingMap(rodId);
  if (pend.has(keyOf(ref))) throw err(409, `A change to ${fieldLabel(found.field)} is already waiting for approval. Approve or reject it first.`, 'change_pending');
  const cur = await readField(ctx.catalog, ref, withRod);
  if (cur.value !== null && cur.value !== undefined && String(cur.value) === String(next)) throw err(400, `${fieldLabel(found.field)} is already ${next}`);
  const before = cur.value ?? null;
  if (editable.changePolicy === 'live') {
    const res = await applyApproved({ catalog: ctx.catalog, ref, subject: withRod, rodId, value: next, before, user, mode: 'live' });
    emitChange({ type: 'value_changed', renderingKey, subjectKey, field: keyOf(ref), by: actorLabel(user) });
    return { mode: 'live', before, after: next, evidenceId: res.evidenceId, writeback: res.writeback };
  }
  if (!ctx.steps.length) throw err(409, 'No approval step is active, so this change cannot be routed for approval. Activate a step in Settings.');
  const impact = await computeImpact(ctx, rendering, withRod, ref, next);
  const now = Date.now();
  const snapshotSteps = ctx.steps.map((s) => ({ key: s.key, name: s.name, roleLabel: s.roleLabel }));
  const row = await db.prepare(
    `INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, status, proposed_by, metadata)
     VALUES ($1,$2,$3,'proposed_change',$4,1,$5,'proposed',$6,$7) RETURNING id`,
  ).get(rodId, keyOf(ref), next, `change:${crypto.randomUUID()}`, now, user.id,
    { before, note: note ? String(note).slice(0, 300) : null, proposedByLabel: actorLabel(user), actorLabel: actorLabel(user), stepIndex: 0, steps: snapshotSteps, approvals: [] });
  await insertEvent(rodId, 'change_proposed', {
    evidenceId: String(row.id), field: keyOf(ref), fieldLabel: fieldLabel(found.field), before, after: next, by: user.id, byLabel: actorLabel(user), portName: found.port.name,
    steps: snapshotSteps, note: note ? String(note).slice(0, 300) : null, impact, emptyText: emptyText(found.port),
  });
  emitChange({ type: 'change_proposed', renderingKey, subjectKey, field: keyOf(ref), by: actorLabel(user) });
  return { mode: 'proposed', before, after: next, evidenceId: Number(row.id), step: { number: 1, total: snapshotSteps.length, name: snapshotSteps[0].name }, impact };
}

async function loadProposal(id) {
  const ev = await db.prepare(`SELECT * FROM journey_rod_evidence WHERE id=$1`).get(id);
  if (!ev || ev.status === undefined) throw err(404, 'Change not found');
  if (ev.status !== 'proposed') throw err(409, `This change was already decided (${ev.status})`, 'already_decided');
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(ev.rod_id);
  return { ev, rod };
}

export async function decideChange(user, id, decision, note) {
  if (user.role !== 'admin') throw err(403, 'Only an administrator can approve or reject a change', 'role_not_allowed');
  const { ev, rod } = await loadProposal(Number(id));
  const ctx = await context();
  const ref = refFromKey(ev.molecule_key);
  const found = lookup(ctx.catalog, ref);
  const subject = { ...(await getSubject(rod.metadata.renderingKey, rod.metadata.subjectKey)), rodId: Number(rod.id) };
  const steps = ev.metadata.steps || [];
  const idx = Number(ev.metadata.stepIndex || 0);
  const common = { evidenceId: ev.id, field: ev.molecule_key, fieldLabel: fieldLabel(found.field), before: ev.metadata.before ?? null, after: ev.value, by: user.id, byLabel: actorLabel(user), portName: found.port.name, emptyText: emptyText(found.port), note: note ? String(note).slice(0, 300) : null };
  if (decision === 'reject') {
    await db.prepare(`UPDATE journey_rod_evidence SET status='rejected', decided_by=$1, decided_at=$2, metadata = metadata || $3::jsonb WHERE id=$4`)
      .run(user.id, Date.now(), { decidedByLabel: actorLabel(user), rejectedAtStep: idx + 1, decisionNote: common.note }, ev.id);
    await insertEvent(Number(rod.id), 'change_rejected', { ...common, evidenceId: String(ev.id), step: idx + 1, stepName: steps[idx]?.name || null, stepTotal: steps.length });
    emitChange({ type: 'change_rejected', renderingKey: rod.metadata.renderingKey, subjectKey: rod.metadata.subjectKey, field: ev.molecule_key, by: actorLabel(user) });
    return { decision: 'rejected', value: null };
  }
  if (idx + 1 < steps.length) {
    await db.prepare(`UPDATE journey_rod_evidence SET metadata = metadata || $1::jsonb WHERE id=$2`)
      .run({ stepIndex: idx + 1, approvals: [...(ev.metadata.approvals || []), { step: idx + 1, by: actorLabel(user), at: Date.now() }] }, ev.id);
    await insertEvent(Number(rod.id), 'change_approved', { ...common, evidenceId: String(ev.id), final: false, step: idx + 1, stepName: steps[idx]?.name || null, nextStepName: steps[idx + 1].name, stepTotal: steps.length });
    emitChange({ type: 'change_approved', renderingKey: rod.metadata.renderingKey, subjectKey: rod.metadata.subjectKey, field: ev.molecule_key, by: actorLabel(user) });
    return { decision: 'step_approved', nextStep: { number: idx + 2, total: steps.length, name: steps[idx + 1].name } };
  }
  const res = await applyApproved({
    catalog: ctx.catalog, ref, subject, rodId: Number(rod.id), value: ev.value, before: ev.metadata.before ?? null, user, mode: 'approval', evidenceId: Number(ev.id),
    stepInfo: { step: idx + 1, stepName: steps[idx]?.name || null, stepTotal: steps.length, evidenceId: String(ev.id), note: common.note },
  });
  emitChange({ type: 'change_approved', renderingKey: rod.metadata.renderingKey, subjectKey: rod.metadata.subjectKey, field: ev.molecule_key, by: actorLabel(user) });
  return { decision: 'approved', value: ev.value, writeback: res.writeback };
}

export async function listPending(user) {
  const catalog = await loadCatalog();
  const steps = (await listWorkflowSteps()).filter((s) => s.active);
  const rows = await db.prepare(
    `SELECT e.*, r.metadata AS rod_meta FROM journey_rod_evidence e JOIN journey_data_rods r ON r.id=e.rod_id
      WHERE e.status='proposed' AND r.rod_type=$1 ORDER BY e.observed_at, e.id`,
  ).all(SUBJECT_ROD_TYPE);
  const role = roleOf(user);
  const out = [];
  for (const e of rows) {
    const rendering = Reg.findRendering(e.rod_meta.renderingKey);
    if (!rendering || !rendering.viewRoles.includes(role)) continue;
    const ref = refFromKey(e.molecule_key);
    const l = lookup(catalog, ref);
    const p = describePending(e, steps);
    out.push({
      id: Number(e.id), renderingKey: rendering.key, renderingLabel: rendering.label, subjectKey: e.rod_meta.subjectKey, subjectTitle: e.rod_meta.title,
      field: l ? fieldLabel(l.field) : e.molecule_key, portName: l?.port.name || '', fieldKey: ref.field_key, ...p, canDecide: user.role === 'admin',
    });
  }
  return out;
}

// ── History + time slider ──────────────────────────────────────────────────
export function describeEvent(ev) {
  const m = ev.metadata || {};
  const f = m.fieldLabel || m.field;
  const a = m.before === null || m.before === undefined ? (m.emptyText || 'not set') : m.before;
  switch (ev.event_type) {
    case 'value_changed': return `${m.byLabel} changed ${f}: ${a} -> ${m.after} (live)`;
    case 'change_proposed': return `${m.byLabel} proposed ${f}: ${a} -> ${m.after}, waiting for ${m.steps?.[0]?.name || 'approval'} (step 1 of ${m.steps?.length || 1})`;
    case 'change_approved': return m.final === false
      ? `${m.byLabel} approved step ${m.step} of ${m.stepTotal} (${m.stepName}) for ${f}: ${a} -> ${m.after}`
      : `${m.byLabel} approved ${f}: ${a} -> ${m.after}${m.mode === 'approval' ? ' (change applied)' : ''}`;
    case 'change_rejected': return `${m.byLabel} rejected ${f}: ${a} -> ${m.after} at step ${m.step} of ${m.stepTotal} (${m.stepName}); the approved value stays: ${a}`;
    case 'writeback_failed': return `Write-back to ${m.portName} failed for ${f}: ${m.error}`;
    default: return ev.event_type;
  }
}

export async function subjectHistory(user, renderingKey, subjectKey) {
  const rendering = Reg.findRendering(renderingKey);
  if (!rendering) throw err(404, 'Rendering not found');
  assertCanView(rendering, user);
  const ctx = await context();
  const subject = await getSubject(renderingKey, subjectKey);
  const rod = await findRod(subjectKey);
  const events = rod ? (await db.prepare(`SELECT * FROM journey_rod_events WHERE rod_id=$1 AND event_type = ANY($2) ORDER BY id`).all(rod.id, EVENT_TYPES)) : [];
  const withRod = { ...subject, rodId: rod ? Number(rod.id) : null };
  // Replay: start from the earliest known "before" of each changed field, then apply events in order.
  const initial = {}; const touched = new Set();
  for (const e of events) { const f = e.metadata.field; if (!touched.has(f) && ['value_changed', 'change_approved', 'change_proposed'].includes(e.event_type)) { touched.add(f); initial[f] = e.metadata.before ?? null; } }
  const fieldsByKey = new Map();
  for (const b of ctx.bindings.filter((x) => x.rendering === rendering.key && x.enabled)) for (const d of dependencies(ctx.catalog, b)) fieldsByKey.set(keyOf(d), d);
  const steps = [];
  const eff = { ...initial }; const pend = {};
  const snapshot = async (label, at, eventId) => {
    const assumeEff = {}; for (const [k, v] of Object.entries(eff)) assumeEff[k] = v;
    const assumeGhost = { ...assumeEff }; for (const [k, p] of Object.entries(pend)) assumeGhost[k] = p.value;
    const channels = [];
    for (const ch of rendering.channels) {
      const b = ctx.bindings.find((x) => x.rendering === rendering.key && x.channel === ch.key && x.enabled);
      if (!b) { channels.push({ label: `${ch.mark} ${ch.channel.toLowerCase()}`, display: 'not mapped', ghost: null }); continue; }
      const t = transformValue(b, await readField(ctx.catalog, b.source, withRod, { assume: assumeEff }));
      const dep = dependencies(ctx.catalog, b).map(keyOf);
      const g = dep.some((k) => pend[k]) ? transformValue(b, await readField(ctx.catalog, b.source, withRod, { assume: assumeGhost })) : null;
      channels.push({ label: `${ch.mark} ${ch.channel.toLowerCase()}`, display: t.display, tone: t.tone, normalized: t.normalized, count: t.count ?? null, ghost: g ? { display: g.display, tone: g.tone, normalized: g.normalized, count: g.count ?? null } : null });
    }
    steps.push({ label, at, eventId, channels, pending: Object.values(pend).map((p) => `${p.fieldLabel}: ${p.before ?? 'not set'} -> ${p.value} (${p.byLabel}, ${p.stepName})`) });
  };
  await snapshot('Before any recorded change', null, null);
  for (const e of events) {
    const m = e.metadata;
    if (e.event_type === 'value_changed') eff[m.field] = m.after;
    if (e.event_type === 'change_proposed') pend[m.field] = { value: m.after, before: m.before, byLabel: m.byLabel, fieldLabel: m.fieldLabel, stepName: m.steps?.[0]?.name };
    if (e.event_type === 'change_approved') { if (m.final === false) { if (pend[m.field]) pend[m.field].stepName = m.nextStepName || null; } else { eff[m.field] = m.after; delete pend[m.field]; } }
    if (e.event_type === 'change_rejected') delete pend[m.field];
    await snapshot(describeEvent(e), Number(e.created_at), Number(e.id));
  }
  return {
    events: events.map((e) => ({ id: Number(e.id), type: e.event_type, at: Number(e.created_at), text: describeEvent(e), error: e.event_type === 'writeback_failed' ? e.metadata.error : null,
      impact: e.event_type === 'change_proposed' ? e.metadata.impact?.lines || [] : null })),
    steps,
  };
}
