// Data model map (docs/changes/graphify-data-model-map.md). One module behind the API routes
// (server/routes/dataModelMap.js), the MCP tools (server/lib/mcpToolRegistry.js) and the World Shell island.
//
// The catalog is a COMMITTED FILE (docs/data-model/catalog.json) produced locally by
// scripts/graphify-data-model.mjs: Graphify code mode (tree-sitter AST, no LLM) over server/ and src/, plus
// Graphify's Postgres introspection against a fresh local database. Reading it needs no database and no Graphify;
// only the domain grouping rules are stored (config_state row `data_model_map_rules`, editable on the screen),
// so the grouping can change without regenerating anything. Schema names only - never row data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const CATALOG_PATH = path.resolve(here, '../../docs/data-model/catalog.json');
const DEFAULT_RULES_PATH = path.resolve(here, '../data/dataModelDomains.json');
export const RULES_ROW_ID = 'data_model_map_rules';

const bad = (message, status = 400, code = 'bad_request') => Object.assign(new Error(message), { status, code });

let cached = { mtimeMs: 0, catalog: null };
/** The committed catalog; a missing file reads as a plain-language 404 that says how to generate it. */
export function loadCatalog() {
  let st;
  try { st = fs.statSync(CATALOG_PATH); } catch {
    throw bad('The data model map has not been generated yet. An administrator can generate it with "node scripts/graphify-data-model.mjs" (it needs Graphify installed locally); the committed output lives in docs/data-model/.', 404, 'not_generated');
  }
  if (cached.catalog && cached.mtimeMs === st.mtimeMs) return cached.catalog;
  cached = { mtimeMs: st.mtimeMs, catalog: JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) };
  return cached.catalog;
}

export function defaultRules() {
  return JSON.parse(fs.readFileSync(DEFAULT_RULES_PATH, 'utf8'));
}

/** Stored rules (config_state, TEXT column -> getJSON) or the shipped default. */
export async function getRules() {
  let stored = null;
  try {
    const { getJSON } = await import('../db.js');
    stored = await getJSON('config_state', RULES_ROW_ID);
  } catch { stored = null; } // reading the catalog needs no database: no saved rules means the shipped default
  if (stored && Array.isArray(stored.domains) && stored.domains.length) return { ...stored, source: 'saved' };
  return { ...defaultRules(), source: 'default' };
}

const HEX = /^#[0-9a-fA-F]{6}$/;
/** Validates a rules body; the message is written for the person editing it. */
export function validateRules(body) {
  const domains = body?.domains;
  if (!Array.isArray(domains) || !domains.length) throw bad('Add at least one domain before saving. Each domain needs a name, a colour and the table-name prefixes or table names that belong to it.');
  if (domains.length > 30) throw bad('A map can have at most 30 domains. Merge some of them and save again.');
  const seen = new Set();
  const clean = domains.map((d, i) => {
    const label = String(d?.label || '').trim();
    if (!label) throw bad(`Domain ${i + 1} has no name. Give it a name and save again.`);
    const key = String(d?.key || label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `domain_${i + 1}`;
    if (seen.has(key)) throw bad(`Two domains are both called "${label}". Rename one of them and save again.`);
    seen.add(key);
    const color = String(d?.color || '').trim();
    if (!HEX.test(color)) throw bad(`The colour for "${label}" must look like #C4843A (a # and six letters or digits). Fix it and save again.`);
    const list = (v) => [...new Set((Array.isArray(v) ? v : String(v || '').split(',')).map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
    return { key, label, color, prefixes: list(d.prefixes), tables: list(d.tables) };
  });
  const fb = body?.fallback || {};
  const fallback = { key: 'other', label: String(fb.label || 'Other').trim() || 'Other', color: HEX.test(String(fb.color || '')) ? fb.color : '#7C8A90' };
  return { domains: clean, fallback };
}

export async function saveRules(user, body) {
  const { getJSON, setJSON } = await import('../db.js');
  const clean = validateRules(body);
  const prev = await getJSON('config_state', RULES_ROW_ID);
  const next = { key: RULES_ROW_ID, version: (Number(prev?.version) || 1) + 1, note: String(body?.note || '').slice(0, 300), updatedAt: Date.now(), updatedBy: user?.id ?? null, ...clean };
  await setJSON('config_state', RULES_ROW_ID, next);
  return { ...next, source: 'saved' };
}

export async function resetRules() {
  const { db } = await import('../db.js');
  await db.prepare('DELETE FROM config_state WHERE id = $1').run(RULES_ROW_ID);
  return { ...defaultRules(), source: 'default' };
}

/** First domain whose `tables` names the table or whose `prefixes` match its start; else the fallback. */
export function assignDomain(name, rules) {
  const n = String(name).toLowerCase();
  for (const d of rules.domains) if ((d.tables || []).includes(n)) return d;
  for (const d of rules.domains) if ((d.prefixes || []).some((p) => n.startsWith(p))) return d;
  return rules.fallback || { key: 'other', label: 'Other', color: '#7C8A90' };
}

const stamp = (c) => ({
  graphifyVersion: c.graphify?.version, modes: c.graphify?.modes, llmPass: !!c.graphify?.llmPass, externalApis: !!c.graphify?.externalApis,
  generatedFromCommit: c.generatedFromCommit, generatedAt: c.generatedAt || null, source: c.source,
});

function tableRow(t, rules) {
  const d = assignDomain(t.name, rules);
  return {
    name: t.name, kind: t.kind, domain: d.key, domainLabel: d.label, color: d.color, columnCount: t.columns.length,
    referencesCount: new Set(t.references.map((r) => r.table)).size, referencedByCount: new Set(t.referencedBy.map((r) => r.table)).size,
    routeCount: t.usedBy.routes.length + t.usedBy.routesViaModules.length, moduleCount: t.usedBy.modules.length,
  };
}

/** Summary for the map: stamp, counts, domains with their tables, FK links between tables. */
export async function catalogSummary() {
  const c = loadCatalog();
  const rules = await getRules();
  const tables = c.tables.map((t) => tableRow(t, rules));
  const doms = [...rules.domains, rules.fallback].map((d) => ({ key: d.key, label: d.label, color: d.color, tableCount: tables.filter((t) => t.domain === d.key).length })).filter((d) => d.tableCount);
  const links = [];
  for (const t of c.tables) for (const r of t.references) links.push({ from: t.name, to: r.table });
  return { stamp: stamp(c), counts: c.counts, crossCheck: { agree: c.crossCheck?.agree, graphifyReferenceEdges: c.crossCheck?.graphifyReferenceEdges, foreignKeyTablePairs: c.crossCheck?.foreignKeyTablePairs }, rulesSource: rules.source, rulesVersion: rules.version || 1, domains: doms, tables, links };
}

export async function tableDetail(name) {
  const c = loadCatalog();
  const rules = await getRules();
  const t = c.tables.find((x) => x.name === String(name).toLowerCase());
  if (!t) throw bad(`There is no table called "${name}" in the data model map. Search for part of the name to find it.`, 404, 'not_found');
  const d = assignDomain(t.name, rules);
  return { ...t, domain: d.key, domainLabel: d.label, color: d.color, stamp: stamp(c) };
}

/** Search table names, column names and route files/mount paths. Case-insensitive, at most 60 hits. */
export async function searchCatalog(q) {
  const needle = String(q || '').trim().toLowerCase();
  if (!needle) throw bad('Type part of a table, column or route name to search.');
  const c = loadCatalog();
  const rules = await getRules();
  const hits = [];
  for (const t of c.tables) {
    const d = assignDomain(t.name, rules);
    const base = { table: t.name, domain: d.key, domainLabel: d.label, color: d.color };
    if (t.name.includes(needle)) hits.push({ ...base, type: 'table', matchedOn: t.name });
    for (const col of t.columns) if (col.name.toLowerCase().includes(needle)) hits.push({ ...base, type: 'column', column: col.name, matchedOn: `${t.name}.${col.name}` });
    for (const r of [...t.usedBy.routes, ...t.usedBy.routesViaModules]) if (r.file.toLowerCase().includes(needle) || r.mount.toLowerCase().includes(needle)) hits.push({ ...base, type: 'route', route: r.file, matchedOn: `${r.mount} (${r.file})` });
  }
  const order = { table: 0, column: 1, route: 2 };
  hits.sort((a, b) => order[a.type] - order[b.type] || a.matchedOn.localeCompare(b.matchedOn));
  return { query: q, total: hits.length, hits: hits.slice(0, 60) };
}

/**
 * Data-object / field picker source for journey-flow-experience-mapping (and any other builder that lets a
 * person choose "which data object / field does this step read or write"). Pass nothing to list the data
 * objects (tables); pass `object` to list that object's fields. Each entry carries a stable `key`
 * ("table" or "table.column") that is safe to store in a flow definition. Schema names only.
 */
export async function dataObjectPicker({ domain, q, object, limit = 200 } = {}) {
  const c = loadCatalog();
  const rules = await getRules();
  const needle = String(q || '').trim().toLowerCase();
  if (object) {
    const t = c.tables.find((x) => x.name === String(object).toLowerCase());
    if (!t) throw bad(`There is no data object called "${object}". Pick one from the list of objects.`, 404, 'not_found');
    const d = assignDomain(t.name, rules);
    return { object: t.name, domain: d.key, fields: t.columns.filter((col) => !needle || col.name.toLowerCase().includes(needle)).map((col) => ({ key: `${t.name}.${col.name}`, object: t.name, field: col.name, type: col.type, nullable: col.nullable, primaryKey: col.primaryKey, references: col.references ? `${col.references.table}.${col.references.column}` : null })) };
  }
  const objects = c.tables
    .map((t) => ({ t, d: assignDomain(t.name, rules) }))
    .filter(({ t, d }) => (!domain || d.key === domain) && (!needle || t.name.includes(needle)))
    .slice(0, Math.max(1, Math.min(Number(limit) || 200, 500)))
    .map(({ t, d }) => ({ key: t.name, label: t.name, kind: t.kind, domain: d.key, domainLabel: d.label, fieldCount: t.columns.length }));
  return { objects };
}

let cachedGraph = { mtimeMs: 0, graph: null };
function loadGraph() {
  const file = path.resolve(path.dirname(CATALOG_PATH), 'graph.json');
  let st;
  try { st = fs.statSync(file); } catch {
    throw bad('The code graph has not been generated yet. An administrator can generate it with "node scripts/graphify-data-model.mjs"; the committed output lives in docs/data-model/.', 404, 'not_generated');
  }
  if (cachedGraph.graph && cachedGraph.mtimeMs === st.mtimeMs) return cachedGraph.graph;
  cachedGraph = { mtimeMs: st.mtimeMs, graph: JSON.parse(fs.readFileSync(file, 'utf8')) };
  return cachedGraph.graph;
}

/**
 * Code-module view (the "code" half of the map). Source: the committed Graphify graph (docs/data-model/graph.json),
 * file nodes grouped by Graphify community, `imports` edges between files and `uses_table` edges to tables.
 * Without `file`: communities, each with its modules. With `file`: that module's imports, importers and tables.
 */
export async function codeModules({ file } = {}) {
  const g = loadGraph();
  const files = g.nodes.filter((n) => n.kind === 'file');
  const edges = g.edges;
  if (file) {
    const id = `file:${String(file)}`;
    const n = files.find((x) => x.id === id);
    if (!n) throw bad(`There is no code module called "${file}" in the map. Pick one from the list of modules.`, 404, 'not_found');
    const strip = (s) => s.replace(/^(file|table):/, '');
    return {
      file: n.label, area: n.area, symbols: n.symbols, community: n.community,
      imports: edges.filter((e) => e.relation === 'imports' && e.source === id).map((e) => strip(e.target)).sort(),
      importedBy: edges.filter((e) => e.relation === 'imports' && e.target === id).map((e) => strip(e.source)).sort(),
      tables: edges.filter((e) => e.relation === 'uses_table' && e.source === id).map((e) => strip(e.target)).sort(),
    };
  }
  const byC = new Map();
  for (const n of files) {
    if (!byC.has(n.community)) byC.set(n.community, []);
    byC.get(n.community).push({ file: n.label, area: n.area, symbols: n.symbols });
  }
  const communityOf = new Map(files.map((n) => [n.id, n.community]));
  const links = new Map();
  for (const e of edges) {
    if (e.relation !== 'imports') continue;
    const a = communityOf.get(e.source); const b = communityOf.get(e.target);
    if (a == null || b == null || a === b) continue;
    const k = `${a}>${b}`; links.set(k, (links.get(k) || 0) + 1);
  }
  return {
    counts: { modules: files.length, importLinks: edges.filter((e) => e.relation === 'imports').length, tableLinks: edges.filter((e) => e.relation === 'uses_table').length },
    communities: [...byC.entries()].sort((a, b) => b[1].length - a[1].length).map(([community, mods]) => ({ community, moduleCount: mods.length, modules: mods.sort((x, y) => x.file.localeCompare(y.file)) })),
    communityLinks: [...links.entries()].map(([k, n]) => { const [from, to] = k.split('>').map(Number); return { from, to, imports: n }; }),
  };
}
