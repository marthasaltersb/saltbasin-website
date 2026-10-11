#!/usr/bin/env node
// Regenerates docs/data-model/ (catalog.json, graph.json, REPORT.md, view.html) with Graphify, LOCALLY ONLY.
//
//   node scripts/graphify-data-model.mjs [--out docs/data-model] [--check]
//
// What it does (docs/changes/graphify-data-model-map.md):
//   1. checks Graphify (pip package graphifyy) is installed in a local venv - if not it STOPS with a plain message;
//   2. creates a FRESH, empty LOCAL Postgres database (refuses any non-local host), boots server/db.js bootstrap +
//      seed into it (schema and fictional seed rows only - never production, never member data);
//   3. runs Graphify code mode (tree-sitter AST, no LLM) over server/ and src/ and Graphify's Postgres
//      introspection against that database (scripts/graphify_data_model.py);
//   4. writes the catalog, the condensed graph, a report and a standalone HTML/SVG view, each stamped with the
//      Graphify version and the git commit it was generated from;
//   5. drops the database.
// Never runs Graphify's LLM/semantic pass; strips every *_API_KEY from the child environment.
//
// Where Graphify lives (first match): $GRAPHIFY_PYTHON, <repo>/.graphify-venv/bin/python. Install once with:
//   python3 -m venv .graphify-venv && .graphify-venv/bin/pip install "graphifyy[postgres]==0.9.84" tree-sitter-sql
// Database admin connection: $GRAPHIFY_PG_ADMIN_URL, else DATABASE_URL with the database name swapped for "postgres".
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { assignDomain, defaultRules } from '../server/lib/dataModelMap.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const argVal = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const outDir = path.resolve(root, argVal('--out', 'docs/data-model'));
const PINNED = '0.9.84';

function die(code, message) {
  console.error(`\ngraphify-data-model: ${message}\n`);
  process.exit(code);
}

// ── 0. Never a non-local database (checked first, whatever else is missing) ───────────────────
const baseUrl = process.env.GRAPHIFY_PG_ADMIN_URL || process.env.DATABASE_URL;
if (baseUrl) {
  let host = '';
  try { host = new URL(baseUrl).hostname; } catch { die(2, 'The database connection string is not a valid URL. Use a local one, for example postgres://postgres@127.0.0.1:5433/postgres.'); }
  if (!['localhost', '127.0.0.1', '::1', '[::1]', ''].includes(host)) die(2, `Refusing to run: the database host "${host}" is not local. The data model map is built only from a fresh local database, never from a hosted or production one.`);
}

// ── 1. Graphify present? ───────────────────────────────────────────────────────────────────────
const venvPy = path.join(root, '.graphify-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const py = process.env.GRAPHIFY_PYTHON || (fs.existsSync(venvPy) ? venvPy : null);
const INSTALL_HELP = `Graphify is not installed, so the data model map cannot be regenerated.
Install it locally (never globally), then run this again:
  python3 -m venv .graphify-venv
  .graphify-venv/bin/pip install "graphifyy[postgres]==${PINNED}" tree-sitter-sql
or point GRAPHIFY_PYTHON at a Python that already has it.`;
if (!py) die(2, INSTALL_HELP);
const probe = spawnSync(py, ['-I', '-c', 'from importlib import metadata; import graphify, psycopg, tree_sitter_sql; print(metadata.version("graphifyy"))'], { encoding: 'utf8' });
if (probe.status !== 0) die(2, `${INSTALL_HELP}\n\n(Python at ${py} could not import graphify, psycopg and tree_sitter_sql: ${probe.error ? probe.error.message : (probe.stderr || '').trim().split('\n').pop()})`);
const graphifyVersion = probe.stdout.trim();
if (graphifyVersion !== PINNED) console.warn(`graphify-data-model: warning - expected graphifyy ${PINNED}, found ${graphifyVersion}. Output is stamped with the version actually used.`);

// ── 2. Fresh LOCAL database ────────────────────────────────────────────────────────────────────
if (!baseUrl) die(2, 'No database server to build the fresh schema in. Set GRAPHIFY_PG_ADMIN_URL (or DATABASE_URL) to a LOCAL Postgres, for example postgres://postgres@127.0.0.1:5433/postgres.');
const dbName = `sb_graphify_${process.pid}`;
const adminUrl = new URL(baseUrl); adminUrl.pathname = '/postgres';
const freshUrl = new URL(baseUrl); freshUrl.pathname = `/${dbName}`;
const admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => {} });
let created = false;

function cleanEnv(extra) {
  const env = { ...process.env, ...extra };
  for (const k of Object.keys(env)) if (/_API_KEY$|^ANTHROPIC_|^OPENAI_|^GEMINI_/.test(k)) delete env[k];
  return env;
}
const git = (args) => { const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : ''; };

try {
  await admin.unsafe(`CREATE DATABASE "${dbName}"`);
  created = true;
  console.log(`[graphify-data-model] fresh local database ${dbName} created`);
  const boot = spawnSync(process.execPath, [path.join('scripts', 'graphify-boot-schema.mjs')], { cwd: root, env: cleanEnv({ DATABASE_URL: freshUrl.toString() }), encoding: 'utf8' });
  process.stdout.write((boot.stdout || '').split('\n').filter((l) => l.startsWith('[graphify-boot]')).join('\n') + '\n');
  if (boot.status !== 0) die(3, `Booting the fresh database failed, so nothing was written.\n${(boot.stderr || '').split('\n').filter((l) => /FAILED|Error/.test(l)).slice(0, 6).join('\n')}`);

  // ── 3. Graphify ──────────────────────────────────────────────────────────────────────────────
  const commit = git(['rev-parse', 'HEAD']) || 'unknown';
  fs.mkdirSync(outDir, { recursive: true });
  const run = spawnSync(py, ['-I', path.join('scripts', 'graphify_data_model.py'), '--root', root, '--dsn', freshUrl.toString(), '--out', outDir, '--commit', commit, '--domains', path.join('server', 'data', 'dataModelDomains.json')],
    { cwd: root, env: cleanEnv({ PYTHONIOENCODING: 'utf-8' }), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
  if (run.status !== 0) die(4, 'Graphify failed (its message is above). Nothing was committed; the previous docs/data-model/ files are unchanged unless listed above.');
  console.log('[graphify-data-model] ' + run.stdout.trim().split('\n').pop());

  // ── 4. Stamp + report + view ─────────────────────────────────────────────────────────────────
  const catPath = path.join(outDir, 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  catalog.generatedAt = new Date().toISOString();
  fs.writeFileSync(catPath, JSON.stringify(catalog, null, 1) + '\n');
  const rules = defaultRules();
  fs.writeFileSync(path.join(outDir, 'REPORT.md'), buildReport(catalog, rules));
  fs.writeFileSync(path.join(outDir, 'view.html'), buildView(catalog, rules));
  console.log(`[graphify-data-model] wrote catalog.json, graph.json, REPORT.md, view.html to ${path.relative(root, outDir) || '.'} (graphify ${catalog.graphify.version}, commit ${commit.slice(0, 9)})`);
} finally {
  if (created) {
    try { await admin.unsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`); console.log(`[graphify-data-model] database ${dbName} dropped`); }
    catch (e) { console.error(`graphify-data-model: could not drop ${dbName}: ${e.message}. Drop it by hand.`); process.exitCode = 5; }
  }
  await admin.end();
}

function buildReport(c, rules) {
  const dom = new Map();
  for (const t of c.tables) { const d = assignDomain(t.name, rules); (dom.get(d.label) || dom.set(d.label, []).get(d.label)).push(t); }
  const hubs = [...c.tables].sort((a, b) => b.referencedBy.length - a.referencedBy.length).slice(0, 10);
  const unused = c.tables.filter((t) => !t.usedBy.modules.length && !t.usedBy.routes.length);
  const L = [];
  L.push('# Data model map', '');
  L.push(`Generated from commit \`${c.generatedFromCommit}\` by Graphify ${c.graphify.version} (${c.graphify.modes.join('; ')}). No LLM pass, no external API.`);
  L.push(`Source: ${c.source}.`, '');
  L.push(`- ${c.counts.tables} tables and ${c.counts.views} views, ${c.counts.columns} columns, ${c.counts.foreignKeys} foreign keys`);
  L.push(`- ${c.counts.codeFilesScanned} code files scanned (${c.counts.codeSymbols} symbols, ${c.counts.codeEdges} edges); condensed graph ${c.counts.graphNodes} nodes / ${c.counts.graphEdges} edges in ${c.counts.communities} communities`);
  L.push(`- Cross-check: Graphify's introspection found ${c.crossCheck.graphifyReferenceEdges} table-to-table reference edges; the catalog's foreign keys give ${c.crossCheck.foreignKeyTablePairs}; they ${c.crossCheck.agree ? 'agree' : 'DISAGREE (see catalog.json crossCheck)'}.`, '');
  L.push('## Domains (default grouping; editable in the app)', '');
  for (const [label, ts] of [...dom.entries()].sort((a, b) => b[1].length - a[1].length)) L.push(`- **${label}** (${ts.length}): ${ts.map((t) => t.name).join(', ')}`);
  L.push('', '## Most referenced tables', '');
  for (const t of hubs) L.push(`- \`${t.name}\`: referenced by ${t.referencedBy.length} foreign key(s)`);
  L.push('', '## Tables no server file reads or writes by name', '');
  L.push(unused.length ? unused.map((t) => `\`${t.name}\``).join(', ') : 'None.');
  L.push('', '(Dynamic SQL built from variables is invisible to the text scan; treat this list as a lead, not proof.)', '');
  return L.join('\n');
}

function buildView(c, rules) {
  const doms = [...rules.domains, rules.fallback].map((d) => ({ ...d, tables: c.tables.filter((t) => assignDomain(t.name, rules).key === d.key) })).filter((d) => d.tables.length);
  const W = 1400, H = 1000, cx = W / 2, cy = H / 2, R = 360;
  const pos = new Map(); const clusters = [];
  doms.forEach((d, i) => {
    const a = (i / doms.length) * Math.PI * 2 - Math.PI / 2;
    const dx = cx + Math.cos(a) * R, dy = cy + Math.sin(a) * R * 0.82;
    const r = 28 + Math.sqrt(d.tables.length) * 14;
    clusters.push({ d, dx, dy, r });
    d.tables.forEach((t, j) => { const ta = (j / d.tables.length) * Math.PI * 2; const rr = d.tables.length === 1 ? 0 : r * (0.45 + 0.55 * ((j % 3) / 2)); pos.set(t.name, [dx + Math.cos(ta) * rr, dy + Math.sin(ta) * rr]); });
  });
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const links = [];
  for (const t of c.tables) for (const r of t.references) { const a = pos.get(t.name), b = pos.get(r.table); if (a && b) links.push(`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`); }
  const dots = c.tables.map((t) => { const p = pos.get(t.name); const col = assignDomain(t.name, rules).color; const r = 3 + Math.min(7, Math.sqrt(t.columns.length)); return `<polygon class="t" data-name="${esc(t.name)}" points="${p[0]},${p[1] - r} ${p[0] + r},${p[1]} ${p[0]},${p[1] + r} ${p[0] - r},${p[1]}" fill="${col}"><title>${esc(t.name)} (${t.columns.length} columns)</title></polygon>`; }).join('');
  const labels = clusters.map(({ d, dx, dy, r }) => `<g><circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${(r + 10).toFixed(1)}" fill="${d.color}" fill-opacity="0.07" stroke="${d.color}" stroke-opacity="0.4"/><text x="${dx.toFixed(1)}" y="${(dy - r - 16).toFixed(1)}" text-anchor="middle" fill="${d.color}" font-size="15" font-weight="600">${esc(d.label)} (${d.tables.length})</text></g>`).join('');
  const data = JSON.stringify(c.tables.map((t) => ({ n: t.name, c: t.columns.map((x) => x.name + ' ' + x.type), r: t.references.map((x) => x.table), u: [...t.usedBy.routes, ...t.usedBy.routesViaModules].map((x) => x.mount) }))).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Data model map</title>
<style>:root{--bg:#0f171a;--ink:#f5f0e8;--mut:#9aa5aa}body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,sans-serif}header{padding:12px 16px}h1{font-size:1.1rem;margin:0}p{color:var(--mut);margin:.3rem 0;font-size:.85rem}input{width:100%;max-width:420px;min-height:44px;padding:0 12px;border-radius:8px;border:1px solid #3a4a50;background:#16232a;color:var(--ink);font-size:1rem}svg{width:100%;height:auto;display:block}line{stroke:#c4843a;stroke-opacity:.18}.t{cursor:pointer;stroke:#0f171a;stroke-width:.6}.t.dim{opacity:.12}.t.sel{stroke:#fff;stroke-width:2}#d{padding:12px 16px;font-size:.9rem;white-space:pre-wrap}</style></head>
<body><header><h1>Data model map</h1>
<p>${esc(c.counts.tables)} tables, ${esc(c.counts.foreignKeys)} foreign keys. Graphify ${esc(c.graphify.version)} (code mode + Postgres introspection, no LLM), commit ${esc(c.generatedFromCommit.slice(0, 9))}.</p>
<input id="q" type="search" placeholder="Search tables or columns" aria-label="Search tables or columns"></header>
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tables grouped by domain, joined by foreign keys"><g>${links.join('')}</g>${labels}<g>${dots}</g></svg>
<div id="d">Tap a table for its columns, relations and routes.</div>
<script>const D=${data};const by=Object.fromEntries(D.map(t=>[t.n,t]));const el=[...document.querySelectorAll('.t')];
function show(n){const t=by[n];el.forEach(e=>e.classList.toggle('sel',e.dataset.name===n));document.getElementById('d').textContent=t.n+'\\n\\nColumns:\\n  '+t.c.join('\\n  ')+'\\n\\nReferences: '+(t.r.join(', ')||'none')+'\\nRoutes: '+(t.u.join(', ')||'none found')}
el.forEach(e=>e.addEventListener('click',()=>show(e.dataset.name)));
document.getElementById('q').addEventListener('input',ev=>{const s=ev.target.value.trim().toLowerCase();el.forEach(e=>{const t=by[e.dataset.name];e.classList.toggle('dim',!!s&&!(t.n.includes(s)||t.c.some(x=>x.toLowerCase().includes(s))))})});</script>
</body></html>
`;
}
