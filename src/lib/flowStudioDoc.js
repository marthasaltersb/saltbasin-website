// Journey flow studio: the flow DOCUMENT (pure, no database). Shared by the editor (live validation, undo/redo
// snapshots), the server (persist/validate/import/export) and the MCP tools. Everything configurable (shape types,
// fields, validation rules, messages) is read from the definition passed in.
import { stateSvg, esc } from './flowGeometry.js';

export const FLOW_FORMAT = 'salt-basin-journey-flow';
export const FLOW_SCHEMA_VERSION = 1;

export const emptyState = () => ({ nodes: [], edges: [], lanes: [{ id: 'lane1', label: 'Lane 1' }, { id: 'lane2', label: 'Lane 2' }], scenarios: [] });
export const emptyDoc = (name = 'Untitled flow', domain = '') => ({
  format: FLOW_FORMAT, schemaVersion: FLOW_SCHEMA_VERSION, name, domain, description: '',
  states: { current: emptyState(), future: emptyState() },
});

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const s = (v) => (typeof v === 'string' ? v : '');
const tags = (v) => (Array.isArray(v) ? v.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim()) : []);

/** Fills defaults and drops unknown keys. Never invents content. */
export function normalizeDoc(raw, def) {
  const doc = isObj(raw) ? raw : {};
  const fixState = (st) => {
    const x = isObj(st) ? st : {};
    const lanes = (Array.isArray(x.lanes) && x.lanes.length ? x.lanes : emptyState().lanes).map((l, i) => ({ id: s(l?.id) || `lane${i + 1}`, label: s(l?.label) || `Lane ${i + 1}` }));
    const nodes = (Array.isArray(x.nodes) ? x.nodes : []).map((n) => ({
      id: s(n.id), type: s(n.type), x: Number.isFinite(n.x) ? n.x : 0, y: Number.isFinite(n.y) ? n.y : 0, label: s(n.label),
      lane: s(n.lane) || null, execMode: s(n.execMode), concurrency: n.concurrency === 'parallel' ? 'parallel' : 'sequential',
      scenarioTags: tags(n.scenarioTags), meta: isObj(n.meta) ? n.meta : { base: {} },
      resolves: (Array.isArray(n.resolves) ? n.resolves : []).filter((r) => r && s(r.nodeId) && s(r.kind)).map((r) => ({ nodeId: s(r.nodeId), kind: s(r.kind) })),
    }));
    const edges = (Array.isArray(x.edges) ? x.edges : []).map((e) => ({
      id: s(e.id), from: s(e.from), to: s(e.to), label: s(e.label), params: s(e.params), notes: s(e.notes),
      scenarioTags: tags(e.scenarioTags), overlays: isObj(e.overlays) ? e.overlays : {},
      bind: isObj(e.bind) ? { ...(isObj(e.bind.condition) ? { condition: { field: s(e.bind.condition.field), op: s(e.bind.condition.op), value: s(e.bind.condition.value) } } : {}) } : {},
    }));
    return { nodes, edges, lanes, scenarios: tags(x.scenarios) };
  };
  return {
    format: FLOW_FORMAT, schemaVersion: FLOW_SCHEMA_VERSION, name: s(doc.name) || 'Untitled flow', domain: s(doc.domain), description: s(doc.description),
    states: { current: fixState(doc.states?.current), future: fixState(doc.states?.future) },
  };
}

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
const metaFor = (n, scenario) => ({ ...(n.meta?.base || {}), ...(scenario && scenario !== 'base' ? n.meta?.[scenario] || {} : {}) });

/** Structural validation driven by def.validationRules. Returns [{ rule, severity, nodeId?, message }]. */
export function validateFlow(doc, def, onlyState = null) {
  const out = [];
  const rules = def.validationRules.filter((r) => r.enabled);
  for (const stateKey of ['current', 'future']) {
    if (onlyState && onlyState !== stateKey) continue;
    const st = doc.states[stateKey];
    const stLabel = (def.states.find((x) => x.key === stateKey) || {}).label || stateKey;
    const shape = (t) => def.shapeTypes.find((x) => x.key === t);
    const outs = new Map(); const ins = new Map();
    for (const e of st.edges) { outs.set(e.from, (outs.get(e.from) || 0) + 1); ins.set(e.to, (ins.get(e.to) || 0) + 1); }
    const add = (r, n, extra = {}) => out.push({ rule: r.key, severity: r.severity, state: stateKey, nodeId: n?.id || null, message: `${stLabel}: ${fill(r.message, { label: n?.label || '', type: shape(n?.type)?.label?.toLowerCase() || n?.type || '', ...extra })}` });
    for (const r of rules) {
      if (r.kind === 'orphan_node') {
        if (st.nodes.length > 1) for (const n of st.nodes) if (!outs.get(n.id) && !ins.get(n.id)) add(r, n);
      } else if (r.kind === 'single_branch_decision') {
        for (const n of st.nodes) if (shape(n.type)?.branching && (outs.get(n.id) || 0) < 2) add(r, n, { count: String(outs.get(n.id) || 0) });
      } else if (r.kind === 'unreachable_step') {
        const starts = st.nodes.filter((n) => shape(n.type)?.startCapable && !ins.get(n.id));
        const roots = starts.length ? starts : st.nodes.filter((n) => !ins.get(n.id));
        const seen = new Set(roots.map((n) => n.id)); const q = [...seen];
        while (q.length) { const cur = q.shift(); for (const e of st.edges) if (e.from === cur && !seen.has(e.to)) { seen.add(e.to); q.push(e.to); } }
        for (const n of st.nodes) if (!seen.has(n.id) && (outs.get(n.id) || ins.get(n.id))) add(r, n);
      } else if (r.kind === 'missing_label') {
        for (const n of st.nodes) if (!n.label.trim()) add(r, n);
      } else if (r.kind === 'dangling_resolve' && stateKey === 'future') {
        for (const n of st.nodes) for (const link of n.resolves) {
          const target = doc.states.current.nodes.find((c) => c.id === link.nodeId);
          const kind = def.resolveKinds.find((k) => k.key === link.kind);
          const has = target && kind && typeof metaFor(target, 'base')[kind.field] === 'string' && metaFor(target, 'base')[kind.field].trim();
          if (!has) add(r, n, { resolveKind: kind?.label?.toLowerCase() || link.kind });
        }
      }
    }
  }
  return out;
}

/** Plain-language import check. Returns { doc, errors[] }; the first sentence of each error says what to do. */
export function parseImport(text, def) {
  let raw = text;
  if (typeof text === 'string') {
    try { raw = JSON.parse(text); } catch { return { doc: null, errors: ['This file is not a flow export. Choose a .json file saved with Export JSON from this studio.'] }; }
  }
  const errors = [];
  if (!isObj(raw) || raw.format !== FLOW_FORMAT) return { doc: null, errors: ['This file is not a Salt Basin journey flow. Choose a .json file saved with Export JSON from this studio.'] };
  if (!Number.isInteger(raw.schemaVersion) || raw.schemaVersion > FLOW_SCHEMA_VERSION) errors.push(`This flow was saved by a newer version of the studio (schema ${raw.schemaVersion}). Update the platform or re-export it from the older studio.`);
  if (!isObj(raw.states) || !isObj(raw.states.current) || !isObj(raw.states.future)) errors.push('The flow is missing its Current state or Future state. Re-export the flow and import the new file.');
  if (errors.length) return { doc: null, errors };
  const types = new Set(def.shapeTypes.map((x) => x.key));
  for (const key of ['current', 'future']) {
    const st = raw.states[key];
    const ids = new Set();
    for (const n of Array.isArray(st.nodes) ? st.nodes : []) {
      if (!isObj(n) || !s(n.id)) { errors.push(`A step in the ${key} state has no id. Re-export the flow and import the new file.`); continue; }
      if (ids.has(n.id)) errors.push(`Two steps in the ${key} state share the id "${n.id}". Remove the duplicate in the file, then import again.`);
      ids.add(n.id);
      if (!types.has(n.type)) errors.push(`Step "${s(n.label) || n.id}" uses the shape "${n.type}", which this platform does not define. Add that shape in Settings or change it in the file to one of: ${[...types].join(', ')}.`);
    }
    for (const e of Array.isArray(st.edges) ? st.edges : []) {
      if (!ids.has(e?.from) || !ids.has(e?.to)) errors.push(`A connector in the ${key} state points at a step that is not in the file. Remove that connector from the file, then import again.`);
    }
    if ((st.nodes || []).length > def.limits.maxNodes) errors.push(`The ${key} state has more than ${def.limits.maxNodes} steps. Split it into two flows.`);
  }
  if (errors.length) return { doc: null, errors };
  return { doc: normalizeDoc(raw, def), errors: [] };
}

export const shapesInUse = (doc) => [...new Set(['current', 'future'].flatMap((k) => doc.states[k].nodes.map((n) => n.type)))];
export const fieldsInUse = (doc) => {
  const used = new Set();
  for (const k of ['current', 'future']) for (const n of doc.states[k].nodes) for (const m of Object.values(n.meta || {})) for (const [f, v] of Object.entries(m || {})) if ((typeof v === 'string' && v.trim()) || (Array.isArray(v) && v.length)) used.add(f);
  return [...used];
};

/** Counts of what differs between two docs (for the impact preview). */
const stable = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((q) => [q, x[q]])) : x));
export function diffDocs(a, b) {
  const out = { states: {}, totals: { added: 0, removed: 0, changed: 0 } };
  for (const k of ['current', 'future']) {
    const A = new Map((a?.states?.[k]?.nodes || []).map((n) => [n.id, stable(n)]));
    const B = new Map((b?.states?.[k]?.nodes || []).map((n) => [n.id, stable(n)]));
    let added = 0; let removed = 0; let changed = 0;
    for (const [id, v] of B) { if (!A.has(id)) added++; else if (A.get(id) !== v) changed++; }
    for (const id of A.keys()) if (!B.has(id)) removed++;
    const ea = (a?.states?.[k]?.edges || []).length; const eb = (b?.states?.[k]?.edges || []).length;
    out.states[k] = { stepsAdded: added, stepsRemoved: removed, stepsChanged: changed, connectorsBefore: ea, connectorsAfter: eb };
    out.totals.added += added; out.totals.removed += removed; out.totals.changed += changed;
  }
  return out;
}

/**
 * Translates a flow into a user-journey definition: each step becomes a journey step with its actors, authority,
 * system, capabilities and the experience it binds to (scene / animation / destination); each branching shape becomes
 * a gate whose branches are the labelled connectors; scenarios become variants.
 */
export function toJourneyDefinition(doc, def, { state = 'future' } = {}) {
  const st = doc.states[state];
  const shape = (t) => def.shapeTypes.find((x) => x.key === t);
  const lane = (id) => st.lanes.find((l) => l.id === id)?.label || null;
  const m = (n) => n.meta?.base || {};
  const steps = st.nodes.map((n) => ({
    id: n.id, type: n.type, label: n.label, lane: lane(n.lane), executedBy: n.execMode || null, concurrency: n.concurrency,
    variants: n.scenarioTags, actors: m(n).actors || '', capabilities: m(n).capabilities || '', gateKey: m(n).gateKey || '',
    system: { name: m(n).systemName || '', authority: m(n).systemAuthority || '' }, actionAuthority: m(n).actionAuthority || '',
    inputs: m(n).inputs || '', outputs: m(n).outputs || '',
    experience: { scene: m(n).sceneAsset || '', animation: m(n).animation || '', destination: m(n).destinationLink || '', layout: m(n).visualLayout || '', interaction: m(n).interaction || '', worldLayer: m(n).worldLayer || '', crystalVariant: m(n).crystalVariant || '', interactionKind: m(n).interactionKind || '' },
    bindings: { variants: m(n).bindVariants || [], actors: m(n).bindActors || [], capabilities: m(n).bindCapabilities || [], systemOfRecord: m(n).bindSystemOfRecord || '', actionAuthority: m(n).bindActionAuthority || [], reads: m(n).bindReads || [], writes: m(n).bindWrites || [] },
    scenarioOverrides: Object.fromEntries(Object.entries(n.meta || {}).filter(([k, v]) => k !== 'base' && v && Object.keys(v).length)),
  }));
  const gates = st.nodes.filter((n) => shape(n.type)?.branching).map((n) => ({
    id: n.id, key: m(n).gateKey || n.id, label: n.label, kind: n.type, parameters: m(n).decisionParams || '',
    branches: st.edges.filter((e) => e.from === n.id).map((e) => ({ to: e.to, label: e.label, condition: e.params, structuredCondition: e.bind?.condition || null, notes: e.notes, variants: e.scenarioTags, overlays: e.overlays })),
  }));
  const transitions = st.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, label: e.label, variants: e.scenarioTags }));
  return {
    format: 'salt-basin-journey-definition', schemaVersion: 1, name: doc.name, domain: doc.domain, state,
    variants: st.scenarios, lanes: st.lanes.map((l) => l.label), steps, gates, transitions,
    resolves: state === 'future' ? st.nodes.filter((n) => n.resolves.length).map((n) => ({ step: n.id, resolves: n.resolves })) : [],
  };
}

export function exportJson(doc, extra = {}) { return JSON.stringify({ ...doc, ...extra }, null, 2); }

/** One self-contained HTML file: the flow JSON embedded, a state + scenario switch, no network. */
export function exportHtml(doc, def, { title } = {}) {
  const svgs = {};
  for (const k of ['current', 'future']) {
    svgs[k] = { base: stateSvg(def, doc.states[k], 'base') };
    for (const sc of doc.states[k].scenarios) svgs[k][sc] = stateSvg(def, doc.states[k], sc);
  }
  const t = esc(title || doc.name);
  const data = JSON.stringify({ svgs, scenarios: { current: doc.states.current.scenarios, future: doc.states.future.scenarios }, flow: doc }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title>
<style>:root{color-scheme:light dark;--ink:#1b2a3b;--bg:#fff;--line:#e5ded3}@media(prefers-color-scheme:dark){:root{--ink:#ece7de;--bg:#10181f;--line:#33414d}}body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--ink)}header{padding:12px 16px;border-bottom:1px solid var(--line)}h1{font-size:1.1rem;margin:0}.bar{display:flex;gap:8px;flex-wrap:wrap;padding:10px 16px}button,select{min-height:44px;font:inherit;padding:0 12px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}button[aria-pressed=true]{background:var(--ink);color:var(--bg)}#c{overflow:auto;padding:0 16px 16px}</style></head><body>
<header><h1>${t}</h1><div>Domain: ${esc(doc.domain || 'not set')} - read-only viewer</div></header>
<div class="bar"><button data-s="current" aria-pressed="true">Current state</button><button data-s="future" aria-pressed="false">Future state</button><label>Scenario <select id="sc"></select></label></div>
<div id="c"></div><script id="flow-data" type="application/json">${data}</script>
<script>var D=JSON.parse(document.getElementById('flow-data').textContent),S='current',C='base';function draw(){var sel=document.getElementById('sc');sel.innerHTML='<option value="base">Base (L2)</option>'+D.scenarios[S].map(function(x){return '<option>'+x.replace(/</g,'&lt;')+'</option>'}).join('');sel.value=C;if(!D.svgs[S][C]){C='base';sel.value='base'}document.getElementById('c').innerHTML=D.svgs[S][C]}document.querySelectorAll('[data-s]').forEach(function(b){b.onclick=function(){S=b.dataset.s;C='base';document.querySelectorAll('[data-s]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});draw()}});document.getElementById('sc').onchange=function(e){C=e.target.value;draw()};draw();</script></body></html>`;
}
