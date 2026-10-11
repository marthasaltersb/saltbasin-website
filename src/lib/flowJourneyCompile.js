// Journey flow -> journey definition compiler (docs/changes/journey-flow-experience-mapping.md). PURE: no database, no
// network, so the server (preview, activate), the MCP tools and a test can all run exactly the same function.
//
// Input: a flow document (flowStudioDoc.js), the studio definition, and the resolved catalogs/channels the server
// read from the platform (capabilities, ports, permissions, layers, crystal variants, data fields, experience channels).
// Output: the generated journey - steps with their structured bindings, gates with branch conditions, the molecules
// each gate asks for, the experience each step renders as, the path per variant - plus errors (block activation) and
// warnings. Nothing is invented: an unresolved reference is reported as such, an unmapped channel reads "not mapped",
// an unset one "not set".

export const GATE_KEY = /^[a-z][a-z0-9_]{1,39}$/;
// Operator kinds are evaluation primitives (INTENTIONAL PLATFORM CONSTANT); labels are shown on the connector panel.
export const CONDITION_OPS = Object.freeze([
  { key: 'eq', label: 'equals', needsValue: true },
  { key: 'neq', label: 'does not equal', needsValue: true },
  { key: 'gt', label: 'is greater than', needsValue: true },
  { key: 'gte', label: 'is at least', needsValue: true },
  { key: 'lt', label: 'is less than', needsValue: true },
  { key: 'lte', label: 'is at most', needsValue: true },
  { key: 'in', label: 'is one of (comma separated)', needsValue: true },
  { key: 'empty', label: 'is empty', needsValue: false },
  { key: 'notempty', label: 'is filled in', needsValue: false },
]);

const str = (v) => (typeof v === 'string' ? v : '');
const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : (typeof v === 'string' && v.trim() ? [v.trim()] : []));
const metaOf = (n) => n.meta?.base || {};

export function conditionOf(edge) {
  const c = edge?.bind?.condition;
  if (!c || typeof c !== 'object') return null;
  const field = str(c.field).trim(); const op = str(c.op).trim(); const value = str(c.value);
  if (!field && !op && !value.trim()) return null;
  return { field, op, value };
}

export function describeCondition(c) {
  if (!c) return '';
  const op = CONDITION_OPS.find((o) => o.key === c.op);
  return `${c.field || '(no field)'} ${op ? op.label : c.op || '(no operator)'}${op && !op.needsValue ? '' : ` ${c.value}`}`.trim();
}

function checkValue(check, value, catalogs) {
  const sets = { worldLayers: catalogs.worldLayers, crystalVariants: catalogs.crystalVariants, interactions: catalogs.interactions };
  if (check === 'path_or_scene') return /^\/[^\s]*$/.test(value) || /^[a-z][a-z0-9_.-]{1,60}$/.test(value) ? null : 'Use a path that starts with / (for example /assets/welcome.png) or a scene key written in lower case letters, numbers, ., - and _ (for example scene.order-check).';
  if (check === 'link') return /^\/[^\s]*$/.test(value) || /^https:\/\/[^\s]+$/.test(value) ? null : 'Use a path that starts with / or an address that starts with https://.';
  if (check && check.startsWith('catalog:')) { const set = sets[check.slice(8)]; return !set || set.has(value) ? null : `"${value}" is not in the platform list. Pick one from the list in the step panel.`; }
  return null;
}

/**
 * @param {object} doc flow document (normalised)
 * @param {object} def studio definition
 * @param {object} ctx { flowId, version, catalogs: { capabilities:Set, ports:Set, actors:Set, authorities:Set, worldLayers:Set,
 *                      crystalVariants:Set, interactions:Set, dataFields:Set|null }, channels:[{key,label,fieldKey,mapped,check,source,legend}] }
 */
export function compileJourney(doc, def, ctx = {}) {
  const { flowId = 0, version = 1, catalogs = {}, channels = [] } = ctx;
  const errors = []; const warnings = [];
  const err = (code, message, nodeId = null) => errors.push({ code, message, nodeId });
  const warn = (code, message, nodeId = null) => warnings.push({ code, message, nodeId });
  const st = doc.states.future;
  const shape = (t) => def.shapeTypes.find((x) => x.key === t) || {};
  const extFields = def.fields.filter((f) => f.section === 'extension');
  if (!st.nodes.length) {
    err('no_steps', 'The Future state has no steps. Draw the journey in the Future state, save and publish it, then try again.');
    return { ok: false, errors, warnings, steps: [], gates: [], molecules: [], variants: [], path: [], experience: { mapped: 0, notMapped: 0, notSet: 0, invalid: 0 }, scenario: null };
  }

  // Order: breadth first from the starts, then anything left over.
  const outs = new Map(); const ins = new Map();
  for (const e of st.edges) { (outs.get(e.from) || outs.set(e.from, []).get(e.from)).push(e); (ins.get(e.to) || ins.set(e.to, []).get(e.to)).push(e); }
  const orderOf = (nodes, edges) => {
    const o = new Map(); const out2 = new Map();
    for (const e of edges) (out2.get(e.from) || out2.set(e.from, []).get(e.from)).push(e);
    const inc = new Set(edges.map((e) => e.to));
    const starts = nodes.filter((n) => shape(n.type).startCapable && !inc.has(n.id));
    const roots = starts.length ? starts : nodes.filter((n) => !inc.has(n.id));
    const q = [...roots]; roots.forEach((n) => o.set(n.id, o.size));
    while (q.length) { const cur = q.shift(); for (const e of out2.get(cur.id) || []) { if (!o.has(e.to)) { const t = nodes.find((n) => n.id === e.to); if (t) { o.set(t.id, o.size); q.push(t); } } } }
    for (const n of nodes) if (!o.has(n.id)) o.set(n.id, o.size);
    return o;
  };
  const order = orderOf(st.nodes, st.edges);
  const laneLabel = (id) => st.lanes.find((l) => l.id === id)?.label || '';

  const refs = (kind, values, set, label, nodeLabel, nodeId) => values.map((key) => {
    const resolved = !set || set.has(key);
    if (set && !resolved) warn('unknown_reference', `Step "${nodeLabel}": the ${label} "${key}" is not in the platform list, so it is shown as not mapped. Pick another one in the step panel.`, nodeId);
    return { kind, key, resolved };
  });

  const gateNodes = st.nodes.filter((n) => shape(n.type).branching || str(metaOf(n).gateKey).trim());
  const gateKeyOf = new Map(); const seenKeys = new Map();
  for (const n of gateNodes) {
    const key = str(metaOf(n).gateKey).trim();
    if (!key) { err('gate_key_missing', `"${n.label || n.id}" is a gate but has no Gate key. Select it and fill in Gate key (lower case letters, numbers and _, for example credit_check).`, n.id); continue; }
    if (!GATE_KEY.test(key)) { err('gate_key_invalid', `The Gate key "${key}" on "${n.label || n.id}" is not allowed. Use lower case letters, numbers and _ only, starting with a letter (2 to 40 characters).`, n.id); continue; }
    if (seenKeys.has(key)) { err('gate_key_duplicate', `Two gates use the Gate key "${key}" ("${seenKeys.get(key)}" and "${n.label || n.id}"). Give each gate its own key.`, n.id); continue; }
    seenKeys.set(key, n.label || n.id); gateKeyOf.set(n.id, key);
  }
  if (!gateNodes.length) err('no_gate', 'The Future state has no gate. Add a Decision (or fill in Gate key on a step) so the journey has at least one gate.');

  const isGate = (id) => gateKeyOf.has(id) || gateNodes.some((g) => g.id === id);
  const isTerminal = (n) => shape(n.type).kind === 'pill';
  const moleculeKey = (n) => `flow_${flowId}_${n.id}`;

  const steps = st.nodes.slice().sort((a, b) => order.get(a.id) - order.get(b.id)).map((n) => {
    const m = metaOf(n); const sh = shape(n.type);
    const actors = refs('actor', list(m.bindActors), catalogs.actors, 'actor', n.label || n.id, n.id);
    const capabilities = refs('capability', list(m.bindCapabilities), catalogs.capabilities, 'capability', n.label || n.id, n.id);
    const sor = refs('system_of_record', list(m.bindSystemOfRecord), catalogs.ports, 'system of record', n.label || n.id, n.id);
    const authority = refs('action_authority', list(m.bindActionAuthority), catalogs.authorities, 'action authority', n.label || n.id, n.id);
    const reads = refs('data_read', list(m.bindReads), catalogs.dataFields, 'data field', n.label || n.id, n.id);
    const writes = refs('data_write', list(m.bindWrites), catalogs.dataFields, 'data field', n.label || n.id, n.id);
    const variants = list(m.bindVariants);
    for (const v of variants) if (!st.scenarios.includes(v)) warn('unknown_variant', `Step "${n.label || n.id}": the variant "${v}" is not a scenario of this flow. Add the scenario or pick another.`, n.id);
    const experience = channels.map((ch) => {
      const value = str(m[ch.fieldKey]).trim();
      const base = { channelKey: ch.key, label: ch.label, fieldKey: ch.fieldKey, source: ch.source || null };
      if (!ch.mapped) return { ...base, status: 'not mapped', display: 'not mapped', value: null };
      if (!value) return { ...base, status: 'not set', display: 'not set', value: null };
      const problem = checkValue(ch.check, value, catalogs);
      if (problem) { warn('experience_invalid', `Step "${n.label || n.id}": ${ch.label.toLowerCase()} "${value}". ${problem}`, n.id); return { ...base, status: 'invalid', display: value, value, problem }; }
      return { ...base, status: 'ok', display: value, value };
    });
    return {
      nodeId: n.id, order: order.get(n.id), label: n.label || n.id, type: n.type, typeLabel: sh.label || n.type, lane: laneLabel(n.lane), executedBy: n.execMode || null, concurrency: n.concurrency,
      kind: isGate(n.id) ? 'gate' : isTerminal(n) ? 'terminal' : 'step', gateKey: gateKeyOf.get(n.id) || null, tags: n.scenarioTags,
      variants: variants, actors, capabilities, systemOfRecord: sor[0] || null, systemName: str(m.systemName), systemAuthority: str(m.systemAuthority), actionAuthority: authority, reads, writes,
      extensions: Object.fromEntries(extFields.map((f) => [f.key, m[f.key] ?? '']).filter(([, v]) => (Array.isArray(v) ? v.length : String(v).trim()))),
      notes: Object.fromEntries(['actors', 'capabilities', 'variant', 'inputs', 'outputs', 'decisionParams'].map((k) => [k, str(m[k])]).filter(([, v]) => v.trim())),
      experience,
    };
  });
  const stepOf = new Map(steps.map((s2) => [s2.nodeId, s2]));

  // Molecules: one per ordinary step (not a gate, not a Start / End). Their source paths are the data they read and write.
  const molecules = steps.filter((s2) => s2.kind === 'step').map((s2) => ({
    key: moleculeKey({ id: s2.nodeId }), label: s2.label, nodeId: s2.nodeId,
    sourcePaths: [...new Set([...s2.reads, ...s2.writes].map((r) => r.key))],
  }));

  // Gates: a gate asks for the molecules of the steps that lead to it (walking back until another gate), and for the roles of those steps.
  const gates = gateNodes.filter((g) => gateKeyOf.has(g.id)).sort((a, b) => order.get(a.id) - order.get(b.id)).map((g, index) => {
    const seen = new Set([g.id]); const collected = []; const q = [g.id];
    while (q.length) {
      const cur = q.shift();
      for (const e of ins.get(cur) || []) {
        if (seen.has(e.from)) continue; seen.add(e.from);
        const from = st.nodes.find((n) => n.id === e.from); if (!from) continue;
        if (isGate(from.id)) continue;
        collected.push(from); q.push(from.id);
      }
    }
    const feeding = collected.filter((n) => !isTerminal(n)).sort((a, b) => order.get(a.id) - order.get(b.id));
    const requiredMolecules = feeding.map(moleculeKey);
    const roles = [...new Set([...feeding, g].flatMap((n) => list(metaOf(n).bindActors)))];
    if (!requiredMolecules.length) warn('gate_no_requirements', `The gate "${g.label || g.id}" has no steps leading into it, so it asks for nothing. Connect the steps that must be done before it.`, g.id);
    const sh = shape(g.type);
    const branches = (outs.get(g.id) || []).map((e) => {
      const cond = conditionOf(e); const target = st.nodes.find((n) => n.id === e.to);
      if (cond) {
        const op = CONDITION_OPS.find((o) => o.key === cond.op);
        if (!cond.field) err('condition_incomplete', `The connector from "${g.label || g.id}" to "${target?.label || e.to}" has a condition with no data field. Pick the field, or clear the condition.`, g.id);
        else if (!op) err('condition_incomplete', `The connector from "${g.label || g.id}" to "${target?.label || e.to}" has a condition with no operator. Pick one, or clear the condition.`, g.id);
        else if (op.needsValue && !cond.value.trim()) err('condition_incomplete', `The connector from "${g.label || g.id}" to "${target?.label || e.to}" needs a value to compare with ("${op.label}").`, g.id);
        else if (catalogs.dataFields && !catalogs.dataFields.has(cond.field)) warn('unknown_reference', `The condition on the connector from "${g.label || g.id}" to "${target?.label || e.to}" uses the data field "${cond.field}", which is not in the platform data model, so it is shown as not mapped.`, g.id);
      }
      return { to: target?.label || e.to, toNodeId: e.to, toGateKey: gateKeyOf.get(e.to) || null, label: e.label, params: e.params, variants: e.scenarioTags, condition: cond ? { ...cond, text: describeCondition(cond), resolved: !catalogs.dataFields || catalogs.dataFields.has(cond.field) } : null };
    });
    if (!sh.fanout && branches.filter((b) => !b.condition).length > 1) warn('branches_unconditioned', `The gate "${g.label || g.id}" has ${branches.filter((b) => !b.condition).length} branches with no condition. Only one branch can be the "otherwise" path; give the others a condition.`, g.id);
    return { stageKey: `f${flowId}_${gateKeyOf.get(g.id)}`, gateKey: gateKeyOf.get(g.id), nodeId: g.id, label: g.label || gateKeyOf.get(g.id), requiredMolecules, requiredActorRoles: roles, humanPrompt: str(metaOf(g).decisionParams).trim() || null, sortOrder: (index + 1) * 10, fanout: !!sh.fanout, branches };
  });

  // Steps no gate asks for (the steps after the last gate) are asked for by one closing stage, so no step is orphaned.
  const covered = new Set(gates.flatMap((g) => g.requiredMolecules));
  const uncovered = molecules.filter((x) => !covered.has(x.key));
  if (gates.length && uncovered.length) {
    const roles = [...new Set(uncovered.flatMap((x) => stepOf.get(x.nodeId).actors.map((a) => a.key)))];
    gates.push({ stageKey: `f${flowId}__end`, gateKey: null, nodeId: null, implicit: true, label: 'End of journey', requiredMolecules: uncovered.map((x) => x.key), requiredActorRoles: roles, humanPrompt: null, sortOrder: (gates.length + 1) * 10, fanout: false, branches: [] });
  }

  // Path per variant (the user journey as one person would walk it).
  const variantKeys = ['base', ...st.scenarios];
  const path = variantKeys.map((vk) => {
    const inV = (tags) => !tags.length || (vk !== 'base' && tags.includes(vk));
    const nodes = st.nodes.filter((n) => inV(n.scenarioTags));
    const ids = new Set(nodes.map((n) => n.id));
    const edges = st.edges.filter((e) => inV(e.scenarioTags) && ids.has(e.from) && ids.has(e.to));
    const ord = orderOf(nodes, edges);
    return {
      key: vk, label: vk === 'base' ? 'Base (L2)' : vk,
      steps: nodes.slice().sort((a, b) => ord.get(a.id) - ord.get(b.id)).map((n, i) => {
        const s2 = stepOf.get(n.id);
        return { n: i + 1, nodeId: n.id, label: s2.label, kind: s2.kind, lane: s2.lane, actors: s2.actors.map((a) => a.key), experience: s2.experience.filter((x) => x.status === 'ok').map((x) => `${x.label}: ${x.display}`) };
      }),
    };
  });

  const exp = { mapped: 0, notMapped: 0, notSet: 0, invalid: 0 };
  for (const s2 of steps) for (const x of s2.experience) { if (x.status === 'not mapped') exp.notMapped++; else if (x.status === 'not set') exp.notSet++; else if (x.status === 'invalid') exp.invalid++; else exp.mapped++; }

  const actorRoles = [...new Set(gates.flatMap((g) => g.requiredActorRoles))];
  const scenarioKey = `flow-${flowId}`;
  const scenario = {
    scenarioKey, rodType: 'journey_flow_run', label: doc.name, description: `Journey generated from the flow "${doc.name}" (version ${version}).`,
    selectedClusterKeys: [], dimensions: [], actorRoles,
    metadata: { flowJourney: { flowId, flowName: doc.name, version, domain: doc.domain, variants: st.scenarios, stages: Object.fromEntries(gates.map((g) => {
      const s2 = stepOf.get(g.nodeId) || { actors: [], capabilities: [], systemOfRecord: null, systemName: '', actionAuthority: [], reads: [], writes: [], experience: [] };
      return [g.stageKey, { gateKey: g.gateKey, implicit: !!g.implicit, nodeId: g.nodeId, branches: g.branches, fanout: g.fanout, actors: s2.actors.map((a) => a.key), capabilities: s2.capabilities.map((c) => c.key), systemOfRecord: s2.systemOfRecord?.key || null, systemName: s2.systemName, actionAuthority: s2.actionAuthority.map((a) => a.key), reads: s2.reads.map((r) => r.key), writes: s2.writes.map((r) => r.key), experience: s2.experience.map(({ channelKey, status, display, value }) => ({ channelKey, status, display, value })),
        steps: g.requiredMolecules.map((mk) => { const mol = molecules.find((x) => x.key === mk); const st2 = stepOf.get(mol?.nodeId); return { molecule: mk, label: mol?.label, nodeId: mol?.nodeId, experience: (st2?.experience || []).map(({ channelKey, status, display, value }) => ({ channelKey, status, display, value })) }; }) }];
    })) } },
    gates: gates.map((g) => ({ stageKey: g.stageKey, label: g.label, requiredClusters: [], requiredMolecules: g.requiredMolecules, requiredDimensions: [], requiredActorRoles: g.requiredActorRoles, dependencyRules: [], judgmentPolicy: 'when_ambiguous', humanPrompt: g.humanPrompt, sortOrder: g.sortOrder })),
  };
  return { ok: errors.length === 0, errors, warnings, steps, gates, molecules, variants: st.scenarios, path, experience: exp, scenario, scenarioKey, actorRoles };
}
