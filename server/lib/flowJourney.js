// Journey flow -> experience mapping (docs/changes/journey-flow-experience-mapping.md). ONE implementation: the API routes
// (server/routes/flowStudio.js) and the MCP tools (mcpFlowStudioTools.js) both call these exports with the acting user.
//
//  1. Catalogs: what a structured binding can point at, read live from the platform (capability map, MCP permissions,
//     data ports, World Shell layers, the shared crystal family, the data model map / information_schema) and from the
//     studio definition's option lists (actors, licences, interactions).
//  2. Experience channels: which experience channel each step field feeds, through the render-bindings registry
//     (journey-flow rendering + port in renderBindingRegistry.js; mapping on/off lives in `render_binding_overrides`).
//  3. Preview / activate: a published flow version compiles (src/lib/flowJourneyCompile.js) into journey molecules, stage
//     gates and a scenario through the SAME applier the scenario library uses (scenarioLibraryApply.js). Activation is
//     the global change standard: impact preview -> one approval token -> automatic apply -> a history row whose source
//     action is `journey_publish`. No new table.
import crypto from 'node:crypto';
import { db } from '../db.js';
import { loadDefinition, writeDefinition, PICK_SOURCES } from './flowStudioDefinition.js';
import { _shared } from './flowStudio.js';
import { normalizeDoc } from '../../src/lib/flowStudioDoc.js';
import { compileJourney } from '../../src/lib/flowJourneyCompile.js';
import * as Reg from './renderBindingRegistry.js';

export const RUN_ROD_TYPE = 'journey_flow_run';
const err = (status, message, code, extra = {}) => Object.assign(new Error(message), { status, code, ...extra });
const SENSITIVE = /password|secret|token|_enc$|hash|api_key|credential/i;
const humanize = (k) => String(k).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
const stable = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((q) => [q, x[q]])) : x));
const hash = (v) => crypto.createHash('sha1').update(stable(v)).digest('hex').slice(0, 12);

// ── 1. Catalogs ─────────────────────────────────────────────────────────────
let dm = { at: 0, value: null };
/** Tables and columns: the Graphify data model map when generated, else information_schema (schema names only). */
async function dataModel() {
  if (dm.value && Date.now() - dm.at < 60000) return dm.value;
  let value;
  try {
    const DM = await import('./dataModelMap.js');
    const c = DM.loadCatalog();
    value = { source: 'data model map', tables: c.tables.map((t) => ({ name: t.name, kind: t.kind || 'table', columns: t.columns.map((x) => ({ name: x.name, type: x.type })) })) };
  } catch {
    const rows = await db.prepare(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`).all();
    const by = new Map();
    for (const r of rows) { if (!by.has(r.table_name)) by.set(r.table_name, []); by.get(r.table_name).push({ name: r.column_name, type: r.data_type }); }
    value = { source: 'information_schema', tables: [...by].map(([name, columns]) => ({ name, kind: 'table', columns })) };
  }
  value = { ...value, tables: value.tables.map((t) => ({ ...t, columns: t.columns.filter((c) => !SENSITIVE.test(c.name)) })) };
  dm = { at: Date.now(), value };
  return value;
}

export async function dataObjects({ q } = {}) {
  const m = await dataModel(); const needle = String(q || '').trim().toLowerCase();
  return { source: m.source, objects: m.tables.filter((t) => !needle || t.name.includes(needle)).map((t) => ({ key: t.name, label: t.name, fieldCount: t.columns.length })) };
}
export async function dataFieldsOf(object) {
  const m = await dataModel(); const t = m.tables.find((x) => x.name === String(object || '').toLowerCase());
  if (!t) throw err(404, `There is no data object called "${object}". Pick one from the list of objects.`, 'not_found');
  return { object: t.name, source: m.source, fields: t.columns.map((c) => ({ key: `${t.name}.${c.name}`, label: c.name, type: c.type })) };
}

export async function bindingCatalogs() {
  const def = (await loadDefinition()).definition;
  const [{ CAPABILITIES }, { MCP_SCOPES }, { ISLAND_REGISTRY }, { CRYSTAL_VARIANTS }, m] = await Promise.all([
    import('./capabilityParity.js'), import('./mcpToolRegistry.js'), import('../../src/lib/worldIslands.js'), import('../../src/lib/crystalGeometry.js'), dataModel(),
  ]);
  return {
    pickSources: PICK_SOURCES,
    capabilities: CAPABILITIES.map((c) => ({ key: c.key, label: c.title, group: c.group })),
    ports: Reg.PORTS.filter((p) => !p.internal).map((p) => ({ key: p.port_key, label: p.name, group: p.port_type.replace('_', ' ') })),
    actors: (def.lists?.actors || []).map((a) => ({ key: a.key, label: a.label })),
    authorities: [...Object.entries(MCP_SCOPES).map(([key, note]) => ({ key, label: key, group: 'Permission', note })), ...(def.lists?.licences || []).map((l) => ({ key: l.key, label: l.label, group: 'Licence' }))],
    worldLayers: [{ key: 'journeys', label: 'Journeys (summary page)', group: 'Layer' }, { key: 'outputs', label: 'Application outputs (summary page)', group: 'Layer' },
      ...Object.keys(ISLAND_REGISTRY).map((k) => ({ key: `island:${k}`, label: humanize(k), group: 'Island' }))],
    crystalVariants: Object.keys(CRYSTAL_VARIANTS).map((k) => ({ key: k, label: humanize(k) })),
    interactions: (def.lists?.interactions || []).map((i) => ({ key: i.key, label: i.label })),
    dataSource: m.source, dataObjectCount: m.tables.length,
  };
}

/** Key sets the compiler checks references against (a null set means "cannot check", never "valid"). */
async function catalogSets() {
  const c = await bindingCatalogs(); const m = await dataModel();
  const set = (l) => new Set(l.map((x) => x.key));
  return { capabilities: set(c.capabilities), ports: set(c.ports), actors: set(c.actors), authorities: set(c.authorities), worldLayers: set(c.worldLayers), crystalVariants: set(c.crystalVariants), interactions: set(c.interactions),
    dataFields: new Set(m.tables.flatMap((t) => t.columns.map((x) => `${t.name}.${x.name}`))) };
}

// ── 2. Experience channels (render-bindings machinery) ─────────────────────
export async function experienceChannels() {
  const RB = await import('./renderBindings.js');
  const catalog = await RB.loadCatalog(); const { bindings, overrideError } = await RB.loadBindings();
  const rendering = Reg.findRendering('journey-flow');
  const channels = rendering.channels.map((ch) => {
    const id = `journey-flow:${ch.key}`; const b = bindings.find((x) => x.id === id);
    const port = catalog.find((p) => p.port_key === b?.source.port_key); const obj = port?.objects.find((o) => o.object_key === b.source.object_key); const field = obj?.fields.find((f) => f.field_key === b.source.field_key);
    const enabled = !!b && b.enabled !== false && !!field;
    return { key: ch.key, bindingId: id, label: ch.channel, enabled, mapped: enabled, fieldKey: field?.flowField || null, check: field?.check || null,
      source: field ? `${port.port_key} > ${obj.object_key} > ${field.field_key}` : null, legend: b?.legend || 'No source field is mapped to this channel, so nothing is drawn for it.' };
  });
  return { channels, overrideError };
}

async function usageOfFields(fieldKeys) {
  const rows = await db.prepare(`SELECT metadata FROM journey_data_rods WHERE rod_type='journey_flow'`).all();
  const counts = Object.fromEntries(fieldKeys.map((k) => [k, 0]));
  for (const r of rows) {
    const m = _shared.parse(r.metadata) || {}; if (m.archived || m.kind !== 'flow' || !m.published) continue;
    const doc = m.published;
    for (const n of doc.states?.future?.nodes || []) for (const k of fieldKeys) if (typeof n.meta?.base?.[k] === 'string' && n.meta.base[k].trim()) counts[k] += 1;
  }
  return counts;
}

export async function experienceChannelsImpact(user, changes) {
  const { channels } = await experienceChannels();
  const touched = channels.filter((c) => changes[c.key] !== undefined && !!changes[c.key] !== c.enabled);
  const usage = await usageOfFields(touched.map((c) => c.fieldKey).filter(Boolean));
  const lines = touched.map((c) => `${c.label} will be ${changes[c.key] ? 'mapped' : 'unmapped'}. ${usage[c.fieldKey] || 0} published step(s) have a value for it; ${changes[c.key] ? 'they start to render with it' : 'they read "not mapped" in the generated journey'} the next time their flow is activated. Already activated journeys keep what they were activated with.`);
  return { lines, changed: touched.map((c) => c.key), token: `ec:${hash(touched.map((c) => [c.key, !!changes[c.key]]))}:${touched.length}` };
}

export async function saveExperienceChannels(user, { channels, note, approved } = {}) {
  const def = (await loadDefinition());
  _shared.requireCan(def.definition, user, 'editDefinition', 'change the experience channels');
  if (!channels || typeof channels !== 'object') throw err(400, 'Send the channels to change, for example {"step.asset": false}.', 'bad_request');
  const known = new Set(Reg.findRendering('journey-flow').channels.map((c) => c.key));
  for (const k of Object.keys(channels)) if (!known.has(k)) throw err(400, `There is no experience channel called "${k}".`, 'bad_request');
  if (!String(note || '').trim()) throw err(400, 'Add a short note saying why the channels changed.', 'note_required');
  const impact = await experienceChannelsImpact(user, channels);
  if (!impact.changed.length) return { ...(await experienceChannels()), impact, applied: false };
  if (approved !== impact.token) throw err(409, 'This change affects published flows. Review the impact and approve it to apply.', 'impact_approval_required', { impact });
  const RB = await import('./renderBindings.js');
  const { overrides } = await RB.loadOverrides(); const next = { bindings: { ...(overrides.bindings || {}) } };
  for (const k of impact.changed) { const id = `journey-flow:${k}`; if (channels[k]) delete next.bindings[id]; else next.bindings[id] = { enabled: false }; }
  await RB.saveOverrides(next);
  const history = [...(def.history || []), { version: def.definition.version, note: `Experience channels: ${impact.changed.map((k) => `${k} ${channels[k] ? 'mapped' : 'unmapped'}`).join(', ')}. ${String(note).trim()}`, by: _shared.actorOf(user), at: Date.now(), sourceAction: 'settings' }].slice(-50);
  await writeDefinition(def.definition, def.definition.version, history);
  return { ...(await experienceChannels()), impact, applied: true };
}

// ── 3. Preview and activate ─────────────────────────────────────────────────
async function compileFor(row, source) {
  const defRes = await loadDefinition(); const def = defRes.definition;
  const raw = source === 'draft' ? row.metadata.draft : row.metadata.published;
  if (!raw) throw err(409, 'This flow has not been published yet. Publish it first, or preview the draft.', 'not_published');
  const doc = normalizeDoc(structuredClone(raw), def);
  const [catalogs, ch] = await Promise.all([catalogSets(), experienceChannels()]);
  const version = source === 'draft' ? row.metadata.version : row.metadata.publishedVersion;
  const compiled = compileJourney(doc, def, { flowId: Number(row.id), version, catalogs, channels: ch.channels });
  return { compiled, doc, version, def };
}

const gateSig = (g) => hash({ label: g.label, m: g.requiredMolecules, r: g.requiredActorRoles, h: g.humanPrompt || null });

async function journeyImpact(row, compiled) {
  const key = compiled.scenarioKey;
  const sc = await db.prepare(`SELECT id FROM journey_scenarios WHERE scenario_key=$1`).get(key);
  const oldGates = sc ? await db.prepare(`SELECT stage_key, label, required_molecules, required_actor_roles, human_prompt FROM journey_gate_definitions WHERE scenario_id=$1 AND is_active=true ORDER BY sort_order`).all(sc.id) : [];
  const oldBy = new Map(oldGates.map((g) => [g.stage_key, g.label ? { label: g.label, requiredMolecules: g.required_molecules || [], requiredActorRoles: g.required_actor_roles || [], humanPrompt: g.human_prompt || null } : { label: null, requiredMolecules: g.required_molecules || [], requiredActorRoles: g.required_actor_roles || [], humanPrompt: g.human_prompt || null }]));
  const newBy = new Map(compiled.gates.map((g) => [g.stageKey, g]));
  const added = compiled.gates.filter((g) => !oldBy.has(g.stageKey)).map((g) => g.label);
  const removed = [...oldBy.keys()].filter((k) => !newBy.has(k));
  const changed = compiled.gates.filter((g) => oldBy.has(g.stageKey) && gateSig(g) !== gateSig({ ...oldBy.get(g.stageKey) })).map((g) => g.label);
  const rods = await db.prepare(`SELECT user_id, current_stage FROM journey_data_rods WHERE metadata->>'scenarioKey'=$1`).all(key);
  const members = new Set(rods.map((r) => Number(r.user_id)));
  const atRemoved = rods.filter((r) => removed.includes(r.current_stage)).length;
  const prev = row.metadata.journeyActive || null;
  const lines = [];
  lines.push(prev ? `Replaces the active journey (flow version ${prev.version}) with flow version ${compiled.scenario.metadata.flowJourney.version}.` : `First activation: flow version ${compiled.scenario.metadata.flowJourney.version} becomes a journey the platform runs.`);
  lines.push(`Gates added ${added.length}, removed ${removed.length}, changed ${changed.length}; ${compiled.molecules.length} step molecule(s) are registered.`);
  lines.push(rods.length ? `${rods.length} journey(s) belonging to ${members.size} member(s) are running this journey now; ${atRemoved} of them sit at a gate this version removes.` : 'No member is running this journey yet.');
  if (compiled.actorRoles?.length) lines.push(`Test runs: whoever starts a test run is recorded as every actor role this journey asks for (${compiled.actorRoles.join(', ')}), marked as a test-run assignment, so one person can walk every gate alone. Real runs are not changed.`);
  lines.push(`Experience: ${compiled.experience.mapped} value(s) render, ${compiled.experience.notSet} not set, ${compiled.experience.notMapped} not mapped, ${compiled.experience.invalid} invalid.`);
  return { lines, gatesAdded: added, gatesRemoved: removed, gatesChanged: changed, runningJourneys: rods.length, runningMembers: members.size, atRemovedGates: atRemoved, firstActivation: !prev };
}

export async function previewJourney(user, id, { source = 'published' } = {}) {
  if (!['published', 'draft'].includes(source)) throw err(400, 'Choose what to preview: published or draft.', 'bad_request');
  const row = await _shared.load(user, id);
  const { compiled, version } = await compileFor(row, source);
  const impact = await journeyImpact(row, compiled);
  const def = (await loadDefinition()).definition;
  const { scenario, ...rest } = compiled;
  return {
    flowId: Number(row.id), flowName: row.metadata.name, source, version, publishedVersion: row.metadata.publishedVersion || null, scenarioKey: compiled.scenarioKey,
    ...rest, scenario: scenario ? { scenarioKey: scenario.scenarioKey, rodType: scenario.rodType, label: scenario.label, actorRoles: scenario.actorRoles, gates: scenario.gates.length } : null,
    impact, canActivate: source === 'published' && compiled.ok && _shared.can(def, user, 'activateJourney'), token: compiled.ok ? `j${version}:${hash({ s: scenario, m: compiled.molecules, r: impact.runningJourneys, x: impact.atRemovedGates })}` : null,
  };
}

async function applyCompiled(compiled, flowId) {
  const now = Date.now();
  await db.prepare(`INSERT INTO journey_rod_types (id, label, description, is_active, sort_order, created_at, updated_at)
    VALUES ($1,'Journey from a flow','Journeys generated from a published Journey Flow Studio flow (docs/changes/journey-flow-experience-mapping.md).',true,22,$2,$2) ON CONFLICT (id) DO NOTHING`).run(RUN_ROD_TYPE, now);
  for (const mol of compiled.molecules) {
    await db.prepare(`INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,created_at,updated_at)
      VALUES ($1,$2,'text',$3::jsonb,$4::jsonb,false,true,$5,$5)
      ON CONFLICT (molecule_key) DO UPDATE SET label=EXCLUDED.label, source_paths=EXCLUDED.source_paths, is_active=true, updated_at=EXCLUDED.updated_at`).run(mol.key, mol.label, mol.sourcePaths, { flowId, nodeId: mol.nodeId }, now);
  }
  const molKeys = compiled.molecules.map((m) => m.key);
  if (molKeys.length) await db.raw`UPDATE journey_metadata_molecules SET is_active=false, updated_at=${now} WHERE starts_with(molecule_key, ${`flow_${flowId}_`}) AND is_active=true AND NOT (molecule_key = ANY(${molKeys}))`;
  for (const g of compiled.gates) {
    await db.prepare(`INSERT INTO journey_stage_gates (rod_type, stage_key, label, sort_order, qualification_metadata, is_active, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5::jsonb,true,$6,$6) ON CONFLICT (rod_type, stage_key) DO UPDATE SET label=EXCLUDED.label, sort_order=EXCLUDED.sort_order, is_active=true, updated_at=EXCLUDED.updated_at`).run(RUN_ROD_TYPE, g.stageKey, g.label, g.sortOrder, { flowId, gateKey: g.gateKey }, now);
  }
  const stageKeys = compiled.gates.map((g) => g.stageKey);
  await db.raw`UPDATE journey_stage_gates SET is_active=false, updated_at=${now} WHERE rod_type=${RUN_ROD_TYPE} AND starts_with(stage_key, ${`f${flowId}_`}) AND is_active=true AND NOT (stage_key = ANY(${stageKeys}))`;
  const { applyScenarioLibrary } = await import('./scenarioLibraryApply.js');
  const res = await applyScenarioLibrary({ scenarios: [compiled.scenario] });
  if (!res.ok) throw err(500, `The platform refused the generated journey, so the scenario was not changed (the step molecules and gate stages it needed were registered and are harmless): ${res.errors.join(' ')}`, 'apply_failed', { errors: res.errors });
  return res.applied;
}

export async function activateJourney(user, id, { approved, note } = {}) {
  const def = (await loadDefinition()).definition;
  _shared.requireCan(def, user, 'activateJourney', 'activate journeys');
  const row = await _shared.load(user, id, { write: true });
  const prev = await previewJourney(user, id, { source: 'published' });
  if (!prev.ok) throw err(400, `The generated journey has ${prev.errors.length} problem(s) that block activating it: ${prev.errors.map((e) => e.message).join(' ')}`, 'compile_blocked', { impact: prev });
  if (row.metadata.journeyActive?.token && row.metadata.journeyActive.token === prev.token) return { ok: true, alreadyActive: true, message: 'This journey is already active at this version with nothing changed, so nothing was applied.', scenarioKey: prev.scenarioKey, version: prev.version, applied: null, impact: prev.impact };
  if (approved !== prev.token) throw err(409, 'Review the impact and approve it to activate the journey.', 'impact_approval_required', { impact: prev });
  const { compiled, version } = await compileFor(row, 'published');
  const applied = await applyCompiled(compiled, Number(row.id));
  const journeyActive = { version, scenarioKey: compiled.scenarioKey, activatedAt: Date.now(), activatedBy: _shared.actorOf(user), gates: compiled.gates.map((g) => g.stageKey), token: prev.token };
  await _shared.saveMeta(Number(row.id), { ...row.metadata, journeyActive }, row.metadata.publishedVersion ? 'published' : 'draft');
  await _shared.logEvent(Number(row.id), 'flow_journey_activated', user, { version, sourceAction: 'journey_publish', note: note || '', approvedBy: _shared.actorOf(user), scenarioKey: compiled.scenarioKey, applied, impact: { lines: prev.impact.lines, gatesAdded: prev.impact.gatesAdded, gatesRemoved: prev.impact.gatesRemoved, gatesChanged: prev.impact.gatesChanged } });
  return { ok: true, scenarioKey: compiled.scenarioKey, version, applied, impact: prev.impact };
}

export async function activeJourney(user, id) {
  const row = await _shared.load(user, id);
  const ja = row.metadata.journeyActive;
  if (!ja) return { active: false, message: 'This flow has not been activated as a journey yet. Publish it, then activate it from the Journey panel.' };
  const sc = await db.prepare(`SELECT * FROM journey_scenarios WHERE scenario_key=$1`).get(ja.scenarioKey);
  if (!sc) return { active: false, message: 'The journey this flow was activated as no longer exists on the platform.' };
  const gates = await db.prepare(`SELECT stage_key, label, required_molecules, required_actor_roles, human_prompt, sort_order FROM journey_gate_definitions WHERE scenario_id=$1 AND is_active=true ORDER BY sort_order`).all(sc.id);
  const mols = await db.prepare(`SELECT molecule_key, label FROM journey_metadata_molecules WHERE starts_with(molecule_key, $1) AND is_active=true`).all(`flow_${Number(row.id)}_`);
  const label = new Map(mols.map((m) => [m.molecule_key, m.label]));
  const fj = _shared.parse(sc.metadata)?.flowJourney || null;
  const running = await db.prepare(`SELECT id, user_id, current_stage FROM journey_data_rods WHERE metadata->>'scenarioKey'=$1 ORDER BY id`).all(ja.scenarioKey);
  return {
    active: true, scenarioKey: ja.scenarioKey, version: ja.version, activatedAt: ja.activatedAt, activatedBy: ja.activatedBy, rodType: sc.rod_type,
    actorRoles: sc.actor_roles || [],
    gates: gates.map((g) => ({ stageKey: g.stage_key, label: g.label, requiredMolecules: (g.required_molecules || []).map((k) => ({ key: k, label: label.get(k) || k })), requiredActorRoles: g.required_actor_roles || [], humanPrompt: g.human_prompt || null, experience: fj?.stages?.[g.stage_key]?.experience || [], branches: fj?.stages?.[g.stage_key]?.branches || [] })),
    running: running.map((r) => ({ rodId: Number(r.id), mine: Number(r.user_id) === Number(user.id), currentStage: r.current_stage })),
  };
}

export async function startTestJourney(user, id) {
  const row = await _shared.load(user, id);
  const ja = row.metadata.journeyActive;
  if (!ja) throw err(409, 'This flow is not an active journey yet. Activate it first.', 'not_active');
  const { createUserJourneyRod } = await import('./journeyRods.js');
  try { await createUserJourneyRod(user.id, { scenarioKey: ja.scenarioKey, label: `${row.metadata.name} (test run)` }); } catch (e) { throw err(400, `The test journey could not start: ${e.message}`, 'start_failed'); }
  const rod = await db.prepare(`SELECT id, current_stage FROM journey_data_rods WHERE user_id=$1 AND metadata->>'scenarioKey'=$2 ORDER BY id DESC LIMIT 1`).get(user.id, ja.scenarioKey);
  const sc = await db.prepare(`SELECT actor_roles FROM journey_scenarios WHERE scenario_key=$1`).get(ja.scenarioKey);
  const roles = sc?.actor_roles || [];
  const now = Date.now();
  for (const roleKey of roles) {
    await db.prepare(`INSERT INTO journey_rod_actors (rod_id,actor_key,role_key,contribution_status,contribution,required_from_stage,added_at) VALUES ($1,$2,$3,'complete',$4::jsonb,NULL,$5) ON CONFLICT (rod_id,actor_key,role_key) DO UPDATE SET contribution_status='complete'`).run(rod.id, `user:${user.id}`, roleKey, { testRun: true, assignedBy: 'flow_test_run' }, now);
  }
  return { ok: true, rodId: Number(rod.id), currentStage: rod.current_stage, scenarioKey: ja.scenarioKey, actorRolesAssigned: roles };
}
