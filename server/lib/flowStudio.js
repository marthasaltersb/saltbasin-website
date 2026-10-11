// Journey flow studio server module (docs/changes/journey-flow-studio.md). ONE implementation: the API routes
// (server/routes/flowStudio.js) and the MCP tools (mcpToolRegistry.js) both call these exports with the acting user.
//
// Persistence reuses the Channel Journey substrate: a flow or template is a `journey_data_rods` row of rod_type
// 'journey_flow' (metadata holds the draft and published documents), and every version is a `journey_rod_events` row
// carrying the document snapshot, the actor and the SOURCE ACTION (editor / import / template_use / restore / publish /
// api / mcp / agent). No new table.
//
// Global change standard: a change with downstream impact (publishing a flow that replaces a published journey,
// overwriting or deleting a template that flows were made from, changing the definition under saved flows) returns an
// impact preview and a token; the same call made again with the token is the one approval and applies automatically.
import { db } from '../db.js';
import { DEFAULT_DEFINITION, loadDefinition, validateDefinition, writeDefinition } from './flowStudioDefinition.js';
import { SEED_TEMPLATES, seedTemplateDoc } from './flowStudioSeedTemplates.js';
import { emptyDoc, normalizeDoc, validateFlow, parseImport, diffDocs, shapesInUse, fieldsInUse, toJourneyDefinition, exportJson, exportHtml } from '../../src/lib/flowStudioDoc.js';

export const ROD_TYPE = 'journey_flow';
export const SOURCE_ACTIONS = ['editor', 'import', 'template_use', 'restore', 'publish', 'agent', 'api', 'mcp', 'create'];
const err = (status, message, code, extra = {}) => Object.assign(new Error(message), { status, code, ...extra });

const actorOf = (u) => ({ id: u.id, label: u.name || u.email || `user ${u.id}` });
const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export async function ensureRodType() {
  await db.prepare(`INSERT INTO journey_rod_types (id, label, description, is_active, sort_order, created_at, updated_at)
    VALUES ('journey_flow','Journey Flow','A process flow / journey definition authored in the Journey flow studio: versioned draft and published documents, history as events (docs/changes/journey-flow-studio.md).',true,21,$1,$1) ON CONFLICT (id) DO NOTHING`).run(Date.now());
}

const can = (def, user, action) => (def.access[action] || []).includes(user.role);
function requireCan(def, user, action, what) {
  if (!can(def, user, action)) throw err(403, `Your role cannot ${what}. Ask an administrator to allow it in the studio Settings.`, 'role_not_allowed');
}

async function orgIdOf(userId) {
  try { const r = await db.prepare(`SELECT org_id FROM org_memberships WHERE user_id=$1 ORDER BY joined_at LIMIT 1`).get(userId); return r ? Number(r.org_id) : null; } catch { return null; }
}

async function rodRow(id) {
  const r = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='journey_flow'`).get(Number(id));
  if (!r) return null;
  return { ...r, metadata: parse(r.metadata) || {} };
}

async function canRead(user, row) {
  if (!row || row.metadata.archived) return false;
  if (user.role === 'admin' || Number(row.user_id) === Number(user.id)) return true;
  if (row.metadata.kind === 'template') {
    if (row.metadata.visibility === 'platform') return true;
    if (row.metadata.visibility === 'org' && row.metadata.orgId && row.metadata.orgId === await orgIdOf(user.id)) return true;
  }
  return false;
}
const canWrite = (user, row) => user.role === 'admin' || Number(row.user_id) === Number(user.id);

async function load(user, id, { write = false } = {}) {
  const row = await rodRow(id);
  if (!row || !(await canRead(user, row))) throw err(404, 'That flow was not found, or you do not have access to it.', 'not_found');
  if (write && !canWrite(user, row)) throw err(403, 'Only the owner or an administrator can change this. Make your own copy first.', 'not_owner');
  return row;
}

async function logEvent(rodId, type, user, payload) {
  await db.prepare(`INSERT INTO journey_rod_events (rod_id, event_type, metadata, created_at) VALUES ($1,$2,$3::jsonb,$4)`)
    .run(rodId, type, { actor: actorOf(user), ...payload }, Date.now());
}
const srcOf = (s, fallback) => (SOURCE_ACTIONS.includes(s) ? s : fallback);

async function saveMeta(rodId, meta, stage) {
  await db.prepare(`UPDATE journey_data_rods SET metadata=$1::jsonb, current_stage=$2, updated_at=$3 WHERE id=$4`).run(meta, stage, Date.now(), rodId);
}

const summarize = (row) => ({
  id: Number(row.id), kind: row.metadata.kind, name: row.metadata.name, domain: row.metadata.domain || '', description: row.metadata.description || '',
  version: row.metadata.version || 1, publishedVersion: row.metadata.publishedVersion || null, status: row.metadata.publishedVersion ? (row.metadata.publishedVersion === row.metadata.version ? 'published' : 'published, newer draft') : 'draft',
  visibility: row.metadata.visibility || 'private', ownerId: Number(row.user_id), derivedFrom: row.metadata.derivedFrom || null, updatedAt: Number(row.updated_at),
});

// ── definition ──────────────────────────────────────────────────────────────
export async function getDefinition() { return loadDefinition(); }

export async function definitionImpact(newDef) {
  const rows = await db.prepare(`SELECT metadata FROM journey_data_rods WHERE rod_type='journey_flow'`).all();
  const cur = (await loadDefinition()).definition;
  const newShapes = new Set(newDef.shapeTypes.map((s) => s.key)); const newFields = new Set(newDef.fields.map((f) => f.key));
  const usedShapes = new Map(); const usedFields = new Map();
  for (const t of SEED_TEMPLATES) { const d = normalizeDoc(t.doc, cur); for (const k of shapesInUse(d)) usedShapes.set(k, (usedShapes.get(k) || 0) + 1); }
  for (const r of rows) {
    const m = parse(r.metadata) || {}; if (m.archived) continue;
    for (const doc of [m.draft, m.published]) {
      if (!doc) continue;
      const d = normalizeDoc(doc, cur);
      for (const t of shapesInUse(d)) usedShapes.set(t, (usedShapes.get(t) || 0) + 1);
      for (const f of fieldsInUse(d)) usedFields.set(f, (usedFields.get(f) || 0) + 1);
    }
  }
  const removedShapesInUse = [...usedShapes.keys()].filter((k) => !newShapes.has(k));
  const removedFieldsInUse = [...usedFields.entries()].filter(([k]) => !newFields.has(k)).map(([k, n]) => ({ key: k, documents: n }));
  const lines = [];
  for (const k of removedShapesInUse) lines.push(`The shape "${k}" is used by saved flows and cannot be removed.`);
  for (const f of removedFieldsInUse) lines.push(`The field "${f.key}" holds text in ${f.documents} saved document(s). The text stays stored but is no longer shown.`);
  return { blocking: removedShapesInUse.length > 0, removedShapesInUse, removedFieldsInUse, lines, flows: rows.length, token: `def${cur.version}:${lines.length}` };
}

export async function saveDefinition(user, input, { note, approved } = {}) {
  const cur = await loadDefinition();
  requireCan(cur.definition, user, 'editDefinition', 'change the studio definition');
  const { definition, errors } = validateDefinition(input);
  if (errors.length) throw err(400, errors.join(' '), 'invalid_definition', { errors });
  if (!String(note || '').trim()) throw err(400, 'Add a short note saying why the definition changed.', 'note_required');
  const impact = await definitionImpact(definition);
  if (impact.blocking) throw err(409, `${impact.lines.join(' ')} Keep the shape or move those flows to another shape first.`, 'definition_in_use', { impact });
  if (impact.lines.length && approved !== impact.token) throw err(409, 'This change affects saved flows. Review the impact and approve it to apply.', 'impact_approval_required', { impact });
  const version = (cur.definition.version || 1) + 1;
  const history = [...(cur.history || []), { version, note: note.trim(), by: actorOf(user), at: Date.now(), sourceAction: 'settings' }].slice(-50);
  await writeDefinition(definition, version, history);
  return { definition: { ...definition, version }, version, history };
}

export async function resetDefinition(user, { note } = {}) {
  const cur = await loadDefinition();
  requireCan(cur.definition, user, 'editDefinition', 'change the studio definition');
  return saveDefinition(user, structuredClone(DEFAULT_DEFINITION), { note: note || 'Reset to the platform default', approved: (await definitionImpact(DEFAULT_DEFINITION)).token });
}

// ── flows ───────────────────────────────────────────────────────────────────
export async function listFlows(user) {
  const rows = await db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='journey_flow' ORDER BY updated_at DESC`).all();
  const flows = []; const templates = [];
  for (const r of rows) {
    const row = { ...r, metadata: parse(r.metadata) || {} };
    if (!(await canRead(user, row))) continue;
    (row.metadata.kind === 'template' ? templates : flows).push(summarize(row));
  }
  const def = (await loadDefinition()).definition;
  return {
    flows: flows.filter((f) => f.ownerId === Number(user.id) || user.role === 'admin'),
    templates: [
      ...SEED_TEMPLATES.map((t) => ({ key: t.key, seed: true, name: t.name, description: t.description, visibility: 'platform', steps: ['current', 'future'].reduce((n, k) => n + t.doc.states[k].nodes.length, 0) })),
      ...templates,
    ],
    meId: Number(user.id), meRole: user.role,
    canCreate: can(def, user, 'create'), canShareTemplate: can(def, user, 'shareTemplate'), canEditDefinition: can(def, user, 'editDefinition'), canPublish: can(def, user, 'publish'),
  };
}

export async function createFlow(user, { name, templateKey, templateId, doc: given, sourceAction } = {}) {
  const def = (await loadDefinition()).definition;
  requireCan(def, user, 'create', 'create flows');
  await ensureRodType();
  let doc; let derivedFrom = null; let src = srcOf(sourceAction, 'create');
  if (templateKey) {
    doc = seedTemplateDoc(templateKey, def);
    if (!doc) throw err(404, `There is no seed template called "${templateKey}".`, 'not_found');
    derivedFrom = { type: 'seed', key: templateKey }; src = 'template_use';
  } else if (templateId) {
    const t = await load(user, templateId);
    if (t.metadata.kind !== 'template') throw err(400, 'That is a flow, not a template.', 'bad_request');
    doc = normalizeDoc(structuredClone(t.metadata.draft), def); derivedFrom = { type: 'template', id: Number(t.id) }; src = 'template_use';
  } else if (given) { doc = normalizeDoc(given, def); } else { doc = emptyDoc(); }
  const baseName = String(name || '').trim() || doc.name || 'Untitled flow';
  const taken = new Set((await db.prepare(`SELECT metadata FROM journey_data_rods WHERE rod_type='journey_flow' AND user_id=$1`).all(user.id)).map((r) => parse(r.metadata) || {}).filter((m) => m.kind === 'flow' && !m.archived).map((m) => m.name));
  let flowName = baseName; for (let n = 2; taken.has(flowName); n += 1) flowName = `${baseName} (${n})`;
  doc.name = flowName;
  const now = Date.now();
  const meta = { kind: 'flow', name: flowName, domain: doc.domain, description: doc.description || '', version: 1, publishedVersion: null, visibility: 'private', draft: doc, published: null, derivedFrom };
  const r = await db.prepare(`INSERT INTO journey_data_rods (rod_type, user_id, current_stage, metadata, created_at, updated_at) VALUES ('journey_flow',$1,'draft',$2::jsonb,$3,$3) RETURNING id`).run(user.id, meta, now);
  const id = Number(r.lastInsertRowid);
  await logEvent(id, 'flow_version_saved', user, { version: 1, sourceAction: src, note: derivedFrom ? `Created from ${derivedFrom.type === 'seed' ? `seed template ${derivedFrom.key}` : `template ${derivedFrom.id}`}` : 'Created', doc });
  return getFlow(user, id);
}

export async function getFlow(user, id) {
  const row = await load(user, id);
  const def = await loadDefinition();
  const doc = normalizeDoc(row.metadata.draft, def.definition);
  return { ...summarize(row), doc, definition: def.definition, findings: validateFlow(doc, def.definition), canWrite: canWrite(user, row) };
}

export async function validateOnly(user, id, docIn) {
  const def = (await loadDefinition()).definition;
  const doc = docIn ? normalizeDoc(docIn, def) : normalizeDoc((await load(user, id)).metadata.draft, def);
  return { findings: validateFlow(doc, def) };
}

export async function saveDraft(user, id, { doc: docIn, baseVersion, note, sourceAction, name } = {}) {
  const def = (await loadDefinition()).definition;
  requireCan(def, user, 'create', 'save flows');
  const row = await load(user, id, { write: true });
  const meta = row.metadata;
  if (baseVersion != null && Number(baseVersion) !== (meta.version || 1)) throw err(409, `Someone saved a newer version (${meta.version}) while you were editing. Reload the flow, re-apply your change and save again.`, 'version_conflict', { currentVersion: meta.version });
  const doc = normalizeDoc(docIn, def);
  const { maxNodes, maxEdges, maxLanes, maxScenarios } = def.limits;
  for (const k of ['current', 'future']) {
    const st = doc.states[k];
    if (st.nodes.length > maxNodes || st.edges.length > maxEdges || st.lanes.length > maxLanes || st.scenarios.length > maxScenarios) throw err(400, `The ${k} state is larger than the limits set in Settings (${maxNodes} steps, ${maxEdges} connectors, ${maxLanes} lanes, ${maxScenarios} scenarios).`, 'too_large');
    const types = new Set(def.shapeTypes.map((s) => s.key));
    const bad = st.nodes.find((n) => !types.has(n.type));
    if (bad) throw err(400, `Step "${bad.label || bad.id}" uses the shape "${bad.type}", which is not defined. Pick one of: ${[...types].join(', ')}.`, 'unknown_shape');
  }
  if (name != null && String(name).trim()) doc.name = String(name).trim();
  const version = (meta.version || 1) + 1;
  const next = { ...meta, version, name: doc.name, domain: doc.domain, description: doc.description || '', draft: doc };
  await saveMeta(Number(row.id), next, meta.publishedVersion ? 'published' : 'draft');
  await logEvent(Number(row.id), 'flow_version_saved', user, { version, sourceAction: srcOf(sourceAction, 'api'), note: note || '', doc });
  return getFlow(user, id);
}

export async function history(user, id) {
  const row = await load(user, id);
  const ev = await db.prepare(`SELECT id, event_type, metadata, created_at FROM journey_rod_events WHERE rod_id=$1 ORDER BY id DESC`).all(Number(row.id));
  return {
    history: ev.map((e) => { const m = parse(e.metadata) || {}; return { id: Number(e.id), type: e.event_type, version: m.version ?? null, sourceAction: m.sourceAction || null, note: m.note || '', actor: m.actor || null, at: Number(e.created_at), hasDocument: !!m.doc, impact: m.impact || null }; }),
  };
}

export async function restoreVersion(user, id, version) {
  const row = await load(user, id, { write: true });
  const ev = await db.prepare(`SELECT metadata FROM journey_rod_events WHERE rod_id=$1 AND event_type IN ('flow_version_saved','flow_published') ORDER BY id DESC`).all(Number(row.id));
  const hit = ev.map((e) => parse(e.metadata)).find((m) => m.doc && Number(m.version) === Number(version));
  if (!hit) throw err(404, `Version ${version} of this flow was not found in its history.`, 'not_found');
  return saveDraft(user, id, { doc: hit.doc, note: `Restored version ${version}`, sourceAction: 'restore' });
}

// ── publish (impact preview + one approval) ─────────────────────────────────
async function derivedFlows(rodId, type) {
  const rows = await db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='journey_flow'`).all();
  return rows.map((r) => ({ ...r, metadata: parse(r.metadata) || {} }))
    .filter((r) => !r.metadata.archived && r.metadata.derivedFrom && r.metadata.derivedFrom.type === type && Number(r.metadata.derivedFrom.id) === Number(rodId))
    .map((r) => ({ id: Number(r.id), name: r.metadata.name, kind: r.metadata.kind }));
}

export async function publishPreview(user, id) {
  const defRes = await loadDefinition(); const def = defRes.definition;
  requireCan(def, user, 'publish', 'publish flows');
  const row = await load(user, id, { write: true });
  const doc = normalizeDoc(row.metadata.draft, def);
  const findings = validateFlow(doc, def);
  const errors = findings.filter((f) => f.severity === 'error');
  const diff = diffDocs(row.metadata.published ? normalizeDoc(structuredClone(row.metadata.published), def) : null, doc);
  const templatesMade = (await derivedFlows(row.id, 'flow')).filter((x) => x.kind === 'template');
  const lines = [];
  lines.push(row.metadata.published ? `Replaces the published version ${row.metadata.publishedVersion} with version ${row.metadata.version}.` : `First publish: version ${row.metadata.version} becomes the published journey definition.`);
  lines.push(`Steps added ${diff.totals.added}, removed ${diff.totals.removed}, changed ${diff.totals.changed}.`);
  lines.push(templatesMade.length ? `Templates made from this flow stay as they are: ${templatesMade.map((t) => t.name).join(', ')}.` : 'No templates were made from this flow.');
  lines.push(errors.length ? `Blocked: ${errors.length} problem(s) must be fixed first.` : `${findings.length} warning(s); nothing blocks publishing.`);
  return { version: row.metadata.version, publishedVersion: row.metadata.publishedVersion || null, findings, blocked: errors.length > 0, diff, lines, token: `v${row.metadata.version}:${Number(row.updated_at)}` };
}

export async function publish(user, id, { approved, note } = {}) {
  const prev = await publishPreview(user, id);
  if (prev.blocked) throw err(400, `This flow has ${prev.findings.filter((f) => f.severity === 'error').length} problem(s) that block publishing: ${prev.findings.filter((f) => f.severity === 'error').map((f) => f.message).join(' ')}`, 'validation_blocked', { impact: prev });
  if (approved !== prev.token) throw err(409, 'Review the impact and approve it to publish.', 'impact_approval_required', { impact: prev });
  const row = await load(user, id, { write: true });
  const meta = { ...row.metadata, published: row.metadata.draft, publishedVersion: row.metadata.version, publishedAt: Date.now() };
  await saveMeta(Number(row.id), meta, 'published');
  await logEvent(Number(row.id), 'flow_published', user, { version: meta.version, sourceAction: 'publish', note: note || '', doc: meta.published, impact: { lines: prev.lines, diff: prev.diff.totals } });
  return getFlow(user, id);
}

export async function archiveFlow(user, id) {
  const row = await load(user, id, { write: true });
  await saveMeta(Number(row.id), { ...row.metadata, archived: true }, 'archived');
  await logEvent(Number(row.id), 'flow_archived', user, { sourceAction: 'api', version: row.metadata.version });
  return { ok: true };
}

// ── templates ───────────────────────────────────────────────────────────────
export async function saveAsTemplate(user, flowId, { name, visibility = 'private', description } = {}) {
  const def = (await loadDefinition()).definition;
  requireCan(def, user, 'create', 'save templates');
  if (visibility !== 'private') requireCan(def, user, 'shareTemplate', 'share templates with your organization or the platform');
  if (!['private', 'org', 'platform'].includes(visibility)) throw err(400, 'Visibility must be private, org or platform.', 'bad_request');
  if (visibility === 'platform' && user.role !== 'admin') throw err(403, 'Only an administrator can share a template with the whole platform.', 'role_not_allowed');
  const row = await load(user, flowId);
  const orgId = visibility === 'org' ? await orgIdOf(user.id) : null;
  if (visibility === 'org' && !orgId) throw err(400, 'You are not a member of an organization, so there is nobody to share this template with. Choose Only me.', 'no_org');
  const tName = String(name || '').trim() || `${row.metadata.name} template`;
  const doc = normalizeDoc(structuredClone(row.metadata.draft), def); doc.name = tName;
  const now = Date.now();
  const meta = { kind: 'template', name: tName, domain: doc.domain, description: description || row.metadata.description || '', version: 1, visibility, orgId, draft: doc, derivedFrom: { type: 'flow', id: Number(row.id) } };
  const r = await db.prepare(`INSERT INTO journey_data_rods (rod_type, user_id, current_stage, metadata, created_at, updated_at) VALUES ('journey_flow',$1,'template',$2::jsonb,$3,$3) RETURNING id`).run(user.id, meta, now);
  const id = Number(r.lastInsertRowid);
  await logEvent(id, 'flow_version_saved', user, { version: 1, sourceAction: 'editor', note: `Saved from flow ${row.id} (${visibility})`, doc });
  return summarize(await rodRow(id));
}

export async function templateImpact(user, templateId, { op, fromFlowId } = {}) {
  const t = await load(user, templateId, { write: true });
  if (t.metadata.kind !== 'template') throw err(400, 'That is a flow, not a template.', 'bad_request');
  const used = await derivedFlows(t.id, 'template');
  const lines = used.length
    ? [`${used.length} flow(s) were started from this template: ${used.map((u) => u.name).join(', ')}. They keep their own copy and are not changed.`]
    : ['No flows were started from this template.'];
  lines.push(op === 'delete' ? 'Deleting removes it from the template list for everyone who could use it.' : 'Overwriting changes what everyone who can use this template starts from next time.');
  if (t.metadata.visibility !== 'private') lines.push(`It is shared (${t.metadata.visibility === 'org' ? 'with your organization' : 'with the whole platform'}).`);
  return { id: Number(t.id), name: t.metadata.name, usedBy: used, lines, token: `t${Number(t.updated_at)}:${used.length}`, op: op || 'overwrite', fromFlowId: fromFlowId || null };
}

export async function overwriteTemplate(user, templateId, { flowId, approved } = {}) {
  const imp = await templateImpact(user, templateId, { op: 'overwrite', fromFlowId: flowId });
  if (approved !== imp.token) throw err(409, 'Review the impact and approve it to overwrite the template.', 'impact_approval_required', { impact: imp });
  const def = (await loadDefinition()).definition;
  const t = await load(user, templateId, { write: true }); const f = await load(user, flowId);
  const doc = normalizeDoc(structuredClone(f.metadata.draft), def); doc.name = t.metadata.name;
  const version = (t.metadata.version || 1) + 1;
  await saveMeta(Number(t.id), { ...t.metadata, version, draft: doc }, 'template');
  await logEvent(Number(t.id), 'flow_version_saved', user, { version, sourceAction: 'editor', note: `Overwritten from flow ${f.id}`, doc, impact: { lines: imp.lines } });
  return summarize(await rodRow(t.id));
}

export async function deleteTemplate(user, templateId, { approved } = {}) {
  const imp = await templateImpact(user, templateId, { op: 'delete' });
  if (approved !== imp.token) throw err(409, 'Review the impact and approve it to delete the template.', 'impact_approval_required', { impact: imp });
  const t = await load(user, templateId, { write: true });
  await saveMeta(Number(t.id), { ...t.metadata, archived: true }, 'archived');
  await logEvent(Number(t.id), 'flow_archived', user, { sourceAction: 'api', impact: { lines: imp.lines } });
  return { ok: true };
}

// ── import / export ─────────────────────────────────────────────────────────
export async function importFlow(user, payload, { name, asTemplate, visibility } = {}) {
  const def = (await loadDefinition()).definition;
  requireCan(def, user, 'create', 'import flows');
  const { doc, errors } = parseImport(payload, def);
  if (errors.length) throw err(400, errors.join(' '), 'invalid_import', { errors });
  const flow = await createFlow(user, { name: name || doc.name, doc, sourceAction: 'import' });
  await logEvent(flow.id, 'flow_imported', user, { sourceAction: 'import', version: 1 });
  if (asTemplate) return { flow, template: await saveAsTemplate(user, flow.id, { name: name || doc.name, visibility: visibility || 'private' }) };
  return { flow };
}

export async function exportFlow(user, id, format = 'json', { state = 'future' } = {}) {
  const def = (await loadDefinition()).definition;
  const row = await load(user, id);
  const doc = normalizeDoc(row.metadata.draft, def);
  const base = { exportedAt: new Date().toISOString(), flowVersion: row.metadata.version, kind: row.metadata.kind };
  if (format === 'json') return { filename: `${slug(doc.name)}.json`, contentType: 'application/json', body: exportJson(doc, base) };
  if (format === 'html') return { filename: `${slug(doc.name)}.html`, contentType: 'text/html', body: exportHtml(doc, def) };
  if (format === 'journey') return { filename: `${slug(doc.name)}-journey-definition.json`, contentType: 'application/json', body: JSON.stringify(toJourneyDefinition(doc, def, { state }), null, 2) };
  throw err(400, 'Choose a format: json, html or journey.', 'bad_request');
}
export async function exportSeedTemplate(key, format = 'json') {
  const def = (await loadDefinition()).definition;
  const doc = seedTemplateDoc(key, def);
  if (!doc) throw err(404, `There is no seed template called "${key}".`, 'not_found');
  if (format === 'html') return { filename: `${slug(doc.name)}.html`, contentType: 'text/html', body: exportHtml(doc, def) };
  return { filename: `${slug(doc.name)}.json`, contentType: 'application/json', body: exportJson(doc, { kind: 'template' }) };
}
const slug = (s) => String(s || 'flow').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'flow';

// ── in-builder AI draft (existing in-app agent path; fixture provider in tests) ──
const useFixture = () => process.env.AGENT_RUNNER_FIXTURE_WORKER === '1' || process.env.FLOW_STUDIO_FIXTURE === '1';

export async function agentDraft(user, { kind, label, type, prompt, fields } = {}) {
  const def = (await loadDefinition()).definition;
  requireCan(def, user, 'create', 'ask the studio agent for a draft');
  if (!['node', 'edge'].includes(kind)) throw err(400, 'Choose what to draft: node (a step) or edge (a connector).', 'bad_request');
  const want = kind === 'node' ? (Array.isArray(fields) && fields.length ? fields : ['actors', 'inputs', 'outputs']).filter((k) => def.fields.some((f) => f.key === k)) : ['label', 'params', 'notes'];
  let draft; let provider;
  if (useFixture()) {
    provider = 'fixture';
    draft = Object.fromEntries(want.map((k) => [k, `Fixture draft for ${k} of "${label || 'this item'}"`]));
  } else {
    provider = 'anthropic';
    const { getAnthropicKey } = await import('../routes/memberAgent.js');
    const apiKey = await getAnthropicKey(user.id);
    if (!apiKey) throw err(503, 'No Anthropic API key is configured, so nothing was sent to a model and your flow is unchanged. Add a key in your Config panel or ask an administrator to set one.', 'no_api_key');
    const { checkAndRecordRunAllowance } = await import('./agentRunGovernance.js');
    try { await checkAndRecordRunAllowance(user.id, 'flow_studio_agent', 'draft'); } catch (e) { throw err(429, `${e.message} Nothing was sent to a model and your flow is unchanged.`, 'run_cap'); }
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const res = await new Anthropic({ apiKey }).messages.create({
      model: process.env.FLOW_STUDIO_MODEL || 'claude-sonnet-4-5', max_tokens: 900,
      system: 'You draft short, concrete process-step metadata through the propose_draft tool. Use only what the person wrote; never invent names, numbers or systems. Leave a value empty if you cannot support it.',
      tools: [{ name: 'propose_draft', description: 'Return the draft values.', input_schema: { type: 'object', properties: Object.fromEntries(want.map((k) => [k, { type: 'string' }])), additionalProperties: false } }],
      tool_choice: { type: 'tool', name: 'propose_draft' },
      messages: [{ role: 'user', content: JSON.stringify({ kind, label, shape: type, request: String(prompt || '').slice(0, 800), fieldsWanted: want }) }],
    });
    const tool = res.content.find((b) => b.type === 'tool_use');
    if (!tool) throw err(502, 'The model did not return a draft. Nothing was changed; try again.', 'no_draft');
    draft = Object.fromEntries(want.map((k) => [k, String(tool.input?.[k] || '')]));
  }
  return { draft, provider, note: provider === 'fixture' ? 'Offline test draft, not a real model. Nothing has been applied: review it, then apply.' : 'Drafted by the model from what you wrote. Review it, then apply.' };
}
