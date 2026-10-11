#!/usr/bin/env node
// CI-style interface-parity check (platform MCP server, 2026-10-09).
//
//   node scripts/check-interface-parity.mjs [--strict] [--json] [--update-manifest] [--self-test]
//
// Verifies server/lib/capabilityParity.js (the parity map) and server/lib/mcpToolRegistry.js against the code:
//   1. every route in the governed route files is listed by a capability (a new API route with no row FAILS);
//   2. every API route a capability lists really exists in a mounted router;
//   3. every MCP tool a capability lists exists in the registry, and every registered tool is used by a capability
//      and names a valid scope and a permission;
//   4. a capability with no website path or no MCP tool says why (gap note or an explicit exclusion);
//   5. the tool registry is append-only: every name in server/data/mcpToolManifest.json is still registered, and
//      every registered name is in the manifest (--update-manifest appends new names; it never removes any).
// Default mode exits 1 only for the problems above. --strict also exits 1 while ANY capability still has a
// website, API or MCP gap (the CI gate once the map is complete). --self-test proves the check can fail: it
// injects an unlisted route, a removed shipped tool and a row pointing at a missing tool, in memory, and exits 0
// only if all three are detected. Needs no database.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const asJson = argv.includes('--json');
const updateManifest = argv.includes('--update-manifest');
const selfTest = argv.includes('--self-test');

const { CAPABILITIES, GOVERNED_ROUTE_FILES, GOVERNED_ROUTE_FILTERS, evaluateCapabilities, summarizeCapabilities } = await import(pathToFileURL(path.join(root, 'server/lib/capabilityParity.js')).href);
const { MCP_TOOLS, MCP_SCOPES } = await import(pathToFileURL(path.join(root, 'server/lib/mcpToolRegistry.js')).href);

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// ── mounted routers: file -> mount path, from server/index.js ──
const indexSrc = read('server/index.js');
const importFile = new Map();
for (const m of indexSrc.matchAll(/import\s+(\w+)(?:\s*,\s*\{[^}]*\})?\s+from\s+'\.\/routes\/([^']+)'/g)) importFile.set(m[1], `server/routes/${m[2]}`);
const mounts = new Map(); // file -> [mount]
for (const m of indexSrc.matchAll(/app\.use\(\s*'([^']+)'\s*,\s*(\w+Router)\s*\)/g)) {
  const file = importFile.get(m[2]);
  if (file) mounts.set(file, [...(mounts.get(file) || []), m[1]]);
}
const routesOf = (file, mount) => {
  const out = [];
  for (const m of read(file).matchAll(/router\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)) out.push(`${m[1].toUpperCase()} ${mount}${m[2] === '/' ? '' : m[2]}`);
  // Resource routers built by a factory (careerMaster.js makeResourceRouter) and mounted with
  // router.use('/tools', makeResourceRouter(...)): expand the factory's r.<verb>('/path') routes under each mount.
  const src = read(file);
  const factory = src.match(/function makeResourceRouter\([\s\S]*?\n}\n/);
  if (factory) {
    const verbs = [...factory[0].matchAll(/\br\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)];
    for (const u of src.matchAll(/router\.use\(\s*'([^']+)'\s*,[^\n]*makeResourceRouter\(/g)) {
      for (const v of verbs) out.push(`${v[1].toUpperCase()} ${mount}${u[1]}${v[2] === '/' ? '' : v[2]}`);
    }
  }
  return out;
};
const known = new Set();
for (const [file, ms] of mounts) for (const mount of ms) for (const r of routesOf(file, mount)) known.add(r);

const manifestPath = path.join(root, 'server/data/mcpToolManifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { tools: [] };

/** All checks. `inject` adds fake inputs in memory (used only by --self-test). */
function runChecks(inject = {}) {
  const problems = [];
  const problem = (m) => problems.push(m);
  const capabilities = [...CAPABILITIES, ...(inject.capabilities || [])];
  const shipped = [...manifest.tools, ...(inject.manifestTools || [])];

  const governed = new Set(inject.governedRoutes || []);
  for (const [file, mount] of Object.entries(GOVERNED_ROUTE_FILES)) {
    if (!(mounts.get(file) || []).includes(mount)) problem(`Governed file ${file} is not mounted at ${mount} in server/index.js.`);
    for (const r of routesOf(file, mount)) if (!GOVERNED_ROUTE_FILTERS[file] || GOVERNED_ROUTE_FILTERS[file].test(r)) governed.add(r);
  }

  const listed = new Set();
  const keys = new Set();
  for (const c of capabilities) {
    if (keys.has(c.key)) problem(`Duplicate capability key "${c.key}".`);
    keys.add(c.key);
    for (const r of c.api || []) {
      listed.add(r);
      if (!known.has(r)) problem(`Capability "${c.key}" lists ${r} but no mounted router defines it.`);
    }
    if (!c.ui && !c.uiExclusion && !c.gap) problem(`Capability "${c.key}" has no website path and no gap note or uiExclusion.`);
    if (!(c.mcp || []).length && !c.mcpExclusion && !c.gap) problem(`Capability "${c.key}" has no MCP tool and no gap note or mcpExclusion.`);
  }
  for (const r of governed) if (!listed.has(r)) problem(`API route ${r} has no capability row in server/lib/capabilityParity.js (no UI path / MCP tool recorded).`);

  const toolNames = MCP_TOOLS.map((t) => t.name);
  if (new Set(toolNames).size !== toolNames.length) problem('Duplicate MCP tool names in the registry.');
  const usedTools = new Set(capabilities.flatMap((c) => c.mcp || []));
  for (const c of capabilities) for (const n of c.mcp || []) if (!toolNames.includes(n)) problem(`Capability "${c.key}" lists MCP tool ${n}, which is not registered.`);
  for (const t of MCP_TOOLS) {
    if (!usedTools.has(t.name)) problem(`MCP tool ${t.name} is not listed by any capability.`);
    if (!MCP_SCOPES[t.scope]) problem(`MCP tool ${t.name} names an unknown scope "${t.scope}".`);
    if (!['user', 'admin', 'permission'].includes(t.permission)) problem(`MCP tool ${t.name} has no valid permission.`);
    if (typeof t.handler !== 'function' || !t.inputSchema || !t.description) problem(`MCP tool ${t.name} is missing a handler, inputSchema or description.`);
  }

  for (const n of shipped) if (!toolNames.includes(n)) problem(`Shipped MCP tool "${n}" was removed or renamed. The registry is append-only.`);
  const fresh = toolNames.filter((n) => !shipped.includes(n));
  return { problems, governed, toolNames, fresh, capabilities };
}

if (selfTest) {
  const cases = [
    ['an API route in a governed file with no capability row', { governedRoutes: ['GET /api/cover-letters/parity-probe'] }, 'GET /api/cover-letters/parity-probe has no capability row'],
    ['a shipped MCP tool that was removed from the registry', { manifestTools: ['retired_tool'] }, 'Shipped MCP tool "retired_tool" was removed or renamed'],
    ['a capability row that points at an MCP tool that does not exist', { capabilities: [{ key: 'probe', title: 'Probe', group: 'Probe', ui: 'World Shell', api: [], mcp: ['no_such_tool'] }] }, 'lists MCP tool no_such_tool, which is not registered'],
  ];
  let missed = 0;
  console.log(`Baseline (nothing injected): ${runChecks().problems.length} problems.`);
  for (const [label, inject, expected] of cases) {
    const found = runChecks(inject).problems.find((p) => p.includes(expected));
    if (!found) missed += 1;
    console.log(`${found ? 'DETECTED' : 'MISSED'}: ${label}${found ? `\n    ${found}` : ''}`);
  }
  console.log(missed ? `SELF-TEST FAIL: ${missed} injected problem(s) were not detected.` : 'SELF-TEST OK: all 3 injected problems were detected.');
  process.exit(missed ? 1 : 0);
}

const { problems, governed, toolNames, fresh } = runChecks();
if (updateManifest) {
  fs.writeFileSync(manifestPath, JSON.stringify({ note: 'Shipped MCP tool names. Append-only: scripts/check-interface-parity.mjs fails if one disappears.', tools: [...manifest.tools, ...fresh] }, null, 2) + '\n');
  console.log(`Manifest updated: ${fresh.length} tool(s) appended.`);
  fresh.length = 0;
} else if (fresh.length) {
  problems.push(`MCP tool(s) ${fresh.join(', ')} are not in server/data/mcpToolManifest.json. Run: node scripts/check-interface-parity.mjs --update-manifest`);
}

// ── report ──
const rows = evaluateCapabilities();
const summary = summarizeCapabilities(rows);
const gaps = rows.filter((r) => !r.full);
if (asJson) {
  console.log(JSON.stringify({ summary, problems, gaps: gaps.map((g) => ({ key: g.key, ui: g.uiStatus, api: g.apiStatus, mcp: g.mcpStatus, gap: g.gap })) }, null, 2));
} else {
  console.log(`Interface parity: ${summary.full} of ${summary.total} capabilities work in all three interfaces (website UI gaps: ${summary.uiGaps}, MCP gaps: ${summary.mcpGaps}, API gaps: ${summary.apiGaps}).`);
  console.log(`Governed API routes: ${governed.size}; MCP tools registered: ${toolNames.length}; shipped manifest: ${manifest.tools.length}.`);
  if (gaps.length) {
    console.log('Gaps:');
    for (const g of gaps) console.log(`  - ${g.key}: ${[g.uiStatus === 'gap' ? 'UI_GAP' : null, g.mcpStatus === 'gap' ? 'MCP_GAP' : null, g.apiStatus === 'gap' ? 'API_GAP' : null].filter(Boolean).join(' ')}${g.gap ? ` - ${g.gap}` : ''}`);
  }
  if (problems.length) { console.log('Problems:'); for (const p of problems) console.log(`  ! ${p}`); }
}
const failed = problems.length > 0 || (strict && gaps.length > 0);
if (!asJson) console.log(failed ? (problems.length ? 'FAIL: the registry does not match the code.' : 'FAIL (--strict): gaps remain.') : 'OK: the registry matches the code.');
process.exit(failed ? 1 : 0);
