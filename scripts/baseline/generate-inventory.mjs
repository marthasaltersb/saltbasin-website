#!/usr/bin/env node
// Baseline inventory generator — docs/baseline/inventory/**
//
// Purpose: produce the mechanical, evidence-linked half of the current-state
// specification (docs/baseline/03-*, 04-*) so it can be regenerated on every
// patch release instead of hand-maintained. Everything this script writes is
// GENERATED — never edit the output by hand; edit this script or the source.
//
// What it does NOT do: judge behavior. Static extraction establishes that a
// definition exists in source at a revision ("static evidence only"), never
// that it works. Hand-authored module specs (docs/baseline/03-modules/*) carry
// requirement-level judgement and link to the stable element IDs emitted here.
//
// Usage:
//   node scripts/baseline/generate-inventory.mjs
//   BASELINE_CATALOG_DATABASE_URL=postgres://postgres@localhost:55432/sb_baseline \
//     node scripts/baseline/generate-inventory.mjs
//
// The optional catalog URL must point at a THROWAWAY LOCAL database that has
// had server/db.js bootstrap() run against it (see docs/baseline/inventory/
// README.md "How to regenerate"). The script refuses any non-local host so it
// can never be aimed at the production Supabase instance. Without the URL,
// the DB section is skipped and the previous db/* output is left untouched.
//
// Stable element IDs (never renumbered — derived from the source identity):
//   TE-API-<METHOD>-<path slug>   Express endpoint
//   TE-DB-<table>                 declared table (bootstrap catalog)
//   TE-UIR-<path slug>            React Router route (src/App.jsx)
//   TE-CMP-<file slug>            first-party src/ module (component/lib/config)
//   TE-SRV-<file slug>            first-party server/ module
//   TE-BLK-<registry key>         section block type (blocks REGISTRY)
//   TE-TAB-<componentId>          admin TAB_COMPONENTS entry
//   TE-ENV-<NAME>                 environment variable name (never a value)
//   TE-JOB-<slug>                 background job / schedule
//   TE-THM-<theme>                named theme in src/brand.css
//   TE-TST-<file slug>            automated test file
//   TE-SCR-<npm script>           package.json script

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'docs', 'baseline', 'inventory');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const slug = (s) => String(s).replace(/^\/+/, '').replace(/[:*]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'root';
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

function git(cmd) {
  try { return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return 'unknown'; }
}
const REV = git('rev-parse HEAD');
const REV_SHORT = REV.slice(0, 7);
const BRANCH = git('rev-parse --abbrev-ref HEAD');
const REV_DATE = git('log -1 --format=%cI HEAD');
// Tracked-files-only walk: honours .gitignore and never picks up node_modules/dist.
const TRACKED = git('ls-files').split('\n').filter(Boolean);

function table(headers, rows) {
  const head = `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n`;
  return head + rows.map((r) => `| ${r.map(esc).join(' | ')} |`).join('\n') + '\n';
}
function header(title, extra = '') {
  return `# ${title}\n\n> **GENERATED** by \`scripts/baseline/generate-inventory.mjs\` — do not edit by hand.\n> Revision \`${REV_SHORT}\` (\`${BRANCH}\`, committed ${REV_DATE}). Evidence class: **static extraction from source** — establishes declaration, not working behavior.\n${extra}\n`;
}
const written = [];
function write(file, content) {
  const full = path.join(OUT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  written.push(file);
}
const link = (file, line) => `\`${file}:${line}\``;

// ─────────────────────────────────────────────────────────────── API ──
function extractApi() {
  const index = read('server/index.js');
  const imports = {};
  for (const m of index.matchAll(/import\s+(\w+)(?:\s*,\s*\{[^}]*\})?\s+from\s+'\.\/routes\/([\w.]+)'/g)) imports[m[1]] = `server/routes/${m[2]}`;
  const mounts = []; // {prefix, file, line, middleware}
  for (const m of index.matchAll(/app\.use\(\s*'([^']+)'\s*,\s*([\w\s,]+?)\)/g)) {
    const names = m[2].split(',').map((s) => s.trim());
    const routerName = names[names.length - 1];
    if (imports[routerName]) mounts.push({ prefix: m[1], file: imports[routerName], line: lineOf(index, m.index), mw: names.slice(0, -1) });
  }
  const globalMw = [...index.matchAll(/app\.use\((enforce\w+)\)/g)].map((m) => ({ name: m[1], line: lineOf(index, m.index) }));
  const endpoints = [];
  // Endpoints declared directly on app in server/index.js
  for (const m of index.matchAll(/app\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2\s*,([^\n]*)/g)) {
    endpoints.push({ method: m[1].toUpperCase(), path: m[3], file: 'server/index.js', line: lineOf(index, m.index), guard: guessInlineGuard(m[4]) || inHandlerGuard(index, m.index) || 'none detected', mountLine: null });
  }
  for (const mount of mounts) {
    const src = read(mount.file);
    const lines = src.split('\n');
    // Router-level guards apply only to routes registered after them.
    const routerUses = [...src.matchAll(/^\s*router\.use\((\w+)\)/gm)].map((m) => ({ name: m[1], line: lineOf(src, m.index) }));
    // Anonymous router-level middleware: router.use(async (req, res, next) => { ... })
    for (const m of src.matchAll(/^\s*router\.use\(\s*(?:async\s*)?(?:\(\s*req[^)]*\)\s*=>|function\s*\w*\s*\(\s*req)/gm)) {
      const body = src.slice(m.index, m.index + 700).split('\n').slice(0, 10).join('\n');
      const calls = [...body.matchAll(/\b(getUserFromCookie|require[A-Z]\w*)\s*\(/g)].map((c) => c[1]);
      if (!calls.length) continue;
      const role = /role\s*!==?\s*'admin'|role\s*===?\s*'admin'/.test(body) ? '+admin-role' : '';
      routerUses.push({ name: `inline-mw(${[...new Set(calls)].join(',')}${role})`, line: lineOf(src, m.index) });
    }
    routerUses.sort((a, b) => a.line - b.line);
    const routerGuardAt = (line) => routerUses.filter((u) => u.line < line).map((u) => u.name);
    // Factory sub-routers: router.use('/x', [mw,] factory(...))
    const factories = {};
    for (const m of src.matchAll(/function\s+(\w+)\s*\(.*\)\s*\{\s*\n\s*const\s+(\w+)\s*=\s*(?:express\.)?Router\(\)/g)) factories[m[1]] = { varName: m[2], start: m.index };
    const defs = [];
    for (const m of src.matchAll(/(?:^|[^.\w])(router|\w+)\.(get|post|put|patch|delete|all)\(\s*(['"`])([^'"`]+)\3\s*,([^\n]*)/g)) {
      defs.push({ recv: m[1], method: m[2].toUpperCase(), path: m[4], rest: m[5], idx: m.index, line: lineOf(src, m.index + 1) });
    }
    for (const d of defs.filter((d) => d.recv === 'router')) {
      const parts = [];
      if (mount.mw.length) parts.push(`mount: ${mount.mw.join(',')}`);
      const rg = routerGuardAt(d.line); if (rg.length) parts.push(`router: ${rg.join(',')}`);
      const ig = guessInlineGuard(d.rest); if (ig) parts.push(`inline: ${ig}`);
      const hg = inHandlerGuard(src, d.idx); if (hg) parts.push(`handler: ${hg}`);
      endpoints.push({ method: d.method, path: joinPath(mount.prefix, d.path), file: mount.file, line: d.line, guard: parts.join('; ') || 'none detected', mountLine: mount.line });
    }
    for (const m of src.matchAll(/router\.use\(\s*'([^']+)'\s*,\s*(?:(\w+)\s*,\s*)?(\w+)\(/g)) {
      const fac = factories[m[3]]; if (!fac) continue;
      const subLine = lineOf(src, m.index);
      for (const d of defs.filter((d) => d.recv === fac.varName && d.idx > fac.start)) {
        const parts = [];
        const rg = routerGuardAt(subLine); if (rg.length) parts.push(`router: ${rg.join(',')}`);
        if (m[2]) parts.push(`sub-mount: ${m[2]}`);
        const hg = inHandlerGuard(src, d.idx); if (hg) parts.push(`handler: ${hg}`);
        endpoints.push({ method: d.method, path: joinPath(joinPath(mount.prefix, m[1]), d.path), file: mount.file, line: d.line, guard: parts.join('; ') || 'none detected', mountLine: mount.line, factory: `${m[3]} (mounted line ${subLine})` });
      }
    }
  }
  const allRouteFiles = TRACKED.filter((f) => /^server\/routes\/[^/]+\.js$/.test(f));
  const unmounted = allRouteFiles.filter((f) => !mounts.some((m) => m.file === f));
  return { mounts, endpoints, globalMw, unmounted };
}
function joinPath(a, b) { return (a.replace(/\/$/, '') + '/' + b.replace(/^\//, '')).replace(/\/$/, '') || '/'; }
function guessInlineGuard(rest) {
  const names = [...rest.matchAll(/\b(require\w+|authorize|ensure\w+Auth\w*|requireIntegrationKey)\b/g)].map((m) => m[1]);
  return names.length ? [...new Set(names)].join(',') : '';
}
function inHandlerGuard(src, idx) {
  const window = src.slice(idx, idx + 900).split('\n').slice(0, 14).join('\n');
  const names = [...window.matchAll(/\b(require[A-Z]\w*|getUserFromCookie|isLandingUnlocked|requireIntegrationKey|verify\w*Signature\w*|constructEvent)\s*\(/g)].map((m) => m[1]);
  return names.length ? [...new Set(names)].join(',') : '';
}

function writeApi(api) {
  const byFile = {};
  for (const e of api.endpoints) (byFile[e.file] ||= []).push(e);
  const ids = new Map();
  for (const e of api.endpoints) {
    let id = `TE-API-${e.method}-${slug(e.path)}`;
    if (ids.has(id)) { let n = 2; while (ids.has(`${id}~${n}`)) n++; id = `${id}~${n}`; }
    ids.set(id, e); e.id = id;
  }
  const noGuard = api.endpoints.filter((e) => e.guard === 'none detected');
  let idx = header('API endpoint inventory', `\n${api.endpoints.length} endpoint definitions across ${Object.keys(byFile).length} files; ${api.mounts.length} router mounts in \`server/index.js\`.\n`);
  idx += `\n## How to read the guard column\n\nGuard evidence is a **static pattern match**, recorded so a reviewer can see *why* an endpoint is believed protected — it is not proof of enforcement:\n\n- \`mount:\` middleware passed in \`app.use(prefix, …)\`\n- \`router:\` a \`router.use(guard)\` registered *above* the route in its file (Express applies it only to later routes)\n- \`inline:\` middleware argument in the route definition\n- \`handler:\` a guard-like call in the first ~14 lines of the handler body (e.g. local \`requireAuth(req,res)\`)\n- \`none detected\` — **no guard pattern found**. Means: needs manual review. Many are intentionally public (published site, BestyStaff intake, output routes); some may not be. It does **not** by itself mean the endpoint is unprotected.\n\nGlobal middleware applied to every request after \`/api/auth\`: ${api.globalMw.map((g) => `\`${g.name}\` (server/index.js:${g.line})`).join(', ')}.\n\n`;
  idx += `## Router files\n\n` + table(['Router file', 'Mount prefix(es)', 'Endpoints', 'No guard detected', 'Detail'], Object.entries(byFile).sort().map(([f, es]) => [
    `\`${f}\``, [...new Set(api.mounts.filter((m) => m.file === f).map((m) => m.prefix))].join(', ') || '(app)', es.length, es.filter((e) => e.guard === 'none detected').length, `[api/${slug(path.basename(f, '.js'))}.md](api/${slug(path.basename(f, '.js'))}.md)`,
  ]));
  idx += `\n## Route files present but not mounted in server/index.js\n\n${api.unmounted.length ? api.unmounted.map((f) => `- \`${f}\``).join('\n') : '- none'}\n`;
  idx += `\n## Endpoints with no guard pattern detected (${noGuard.length}) — review list\n\n` + table(['Element ID', 'Method', 'Path', 'Location'], noGuard.map((e) => [e.id, e.method, `\`${e.path}\``, link(e.file, e.line)]));
  write('api-endpoints.md', idx);
  for (const [f, es] of Object.entries(byFile)) {
    let doc = header(`API — ${f}`);
    doc += `\n[← API index](../api-endpoints.md)\n\n` + table(['Element ID', 'Method', 'Path', 'Location', 'Guard evidence', 'Notes'], es.map((e) => [e.id, e.method, `\`${e.path}\``, link(e.file, e.line), e.guard, e.factory ? `via factory ${e.factory}` : '']));
    write(`api/${slug(path.basename(f, '.js'))}.md`, doc);
  }
}

// ──────────────────────────────────────────────────────────── UI routes ──
function extractUiRoutes() {
  const src = read('src/App.jsx');
  const rows = [];
  for (const m of src.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)/g)) {
    const comp = m[2];
    const lazyM = src.match(new RegExp(`const ${comp} = (?:lazy\\(\\(\\) => import\\('([^']+)'\\)|lazyOutput\\('(\\w+)'\\))`));
    const importM = src.match(new RegExp(`import ${comp} from '([^']+)'`));
    const fn = src.match(new RegExp(`function ${comp}\\(`));
    let target = lazyM?.[1] ? `src/${lazyM[1].replace('./', '')}` : lazyM?.[2] ? `src/components/Output.jsx#${lazyM[2]}` : importM ? `src/${importM[1].replace('./', '')}` : fn ? `src/App.jsx#${comp}` : 'unresolved';
    rows.push({ id: `TE-UIR-${slug(m[1])}`, path: m[1], comp, target, line: lineOf(src, m.index), lazy: !!lazyM });
  }
  return rows;
}

// ─────────────────────────────────────────────────────────── modules ──
function extractModules() {
  const files = TRACKED.filter((f) => /^(src|server)\/.*\.(jsx?|mjs)$/.test(f) && !/\.test\.js$/.test(f));
  const texts = Object.fromEntries(files.map((f) => [f, read(f)]));
  const importCount = Object.fromEntries(files.map((f) => [f, 0]));
  for (const [f, t] of Object.entries(texts)) {
    for (const m of t.matchAll(/(?:from\s+|import\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) {
      let target = path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1]));
      for (const cand of [target, `${target}.js`, `${target}.jsx`, `${target}/index.js`, `${target}/index.jsx`]) if (cand in importCount) { importCount[cand]++; break; }
    }
  }
  return files.map((f) => {
    const t = texts[f];
    const exportsList = [...t.matchAll(/export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|let)\s+(\w+)/g)].map((m) => m[1]);
    const hasDefault = /export\s+default/.test(t);
    const head = (t.match(/^(?:\s*\/\/[^\n]*\n){1,3}/)?.[0] || '').replace(/\/\/\s?/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
    return { file: f, id: `${f.startsWith('src/') ? 'TE-CMP' : 'TE-SRV'}-${slug(f.replace(/^(src|server)\//, '').replace(/\.(jsx?|mjs)$/, ''))}`, lines: t.split('\n').length, exportsList, hasDefault, importedBy: importCount[f], head };
  });
}

// ────────────────────────────────────────────────────────── registries ──
function extractRegistries() {
  const out = {};
  const blocks = read('src/components/blocks/index.jsx');
  const regStart = blocks.indexOf('const REGISTRY = {');
  const regBody = blocks.slice(regStart, blocks.indexOf('};', regStart));
  out.blocks = [...regBody.matchAll(/^\s*(\w+):\s*(\w+)/gm)].map((m) => {
    const def = blocks.search(new RegExp(`function ${m[2]}\\b`));
    const imp = blocks.match(new RegExp(`import\\s*\\{[^}]*\\b${m[2]}\\b[^}]*\\}\\s*from\\s*'([^']+)'`)) || blocks.match(new RegExp(`import\\s+${m[2]}\\s+from\\s*'([^']+)'`));
    return { key: m[1], comp: m[2], loc: def >= 0 ? link('src/components/blocks/index.jsx', lineOf(blocks, def)) : imp ? `\`src/components/blocks/${imp[1].replace('./', '')}\`` : 'unresolved', regLine: lineOf(blocks, regStart + m.index) };
  });
  const subStart = blocks.indexOf('export const SUBSECTION_REGISTRY = {');
  out.subBlocks = subStart < 0 ? [] : [...blocks.slice(subStart, blocks.indexOf('};', subStart)).matchAll(/^\s*(\w+):\s*(\w+)/gm)].map((m) => ({ key: m[1], comp: m[2] }));
  out.blockFallback = /REGISTRY\[section\.type\]\s*\|\|\s*(\w+)/.exec(blocks)?.[1] || null;
  const shell = read('src/components/admin/AdminShell.jsx');
  const tStart = shell.indexOf('const TAB_COMPONENTS = {');
  out.tabs = [...shell.slice(tStart, shell.indexOf('};', tStart)).matchAll(/^\s*(\w+):\s*\(([^)]*)\)\s*=>\s*<(\w+)([^/]*)\/>/gm)].map((m) => ({ id: m[1], comp: m[3], props: m[4].trim(), line: lineOf(shell, tStart + m.index) }));
  const cfg = read('src/components/admin/ConfigPanel.jsx');
  const thStart = cfg.indexOf('THEME_OPTIONS');
  out.themeOptions = thStart < 0 ? [] : [...cfg.slice(thStart, cfg.indexOf('];', thStart)).matchAll(/(?:id|value|key):\s*'([\w-]+)'/g)].map((m) => m[1]);
  if (exists('src/lib/crystalGeometry.js')) {
    const cg = read('src/lib/crystalGeometry.js');
    const cs = cg.indexOf('export const CRYSTAL_VARIANTS = {');
    // Walk the object literal by brace depth; record depth-1 member names
    // (`key(args) {` methods or `key: value` properties).
    out.crystalVariants = [];
    if (cs >= 0) {
      let depth = 0; let i = cg.indexOf('{', cs);
      const start = i;
      for (; i < cg.length; i++) {
        const ch = cg[i];
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) break; }
        else if (depth === 1 && ch === '\n') {
          const m = cg.slice(i + 1, i + 120).match(/^\s{2}(\w+)\s*(?:\(|:)/);
          if (m) out.crystalVariants.push({ key: m[1], line: lineOf(cg, i + 2) });
        }
      }
      void start;
    }
  }
  return out;
}

// ──────────────────────────────────────────────────────────── env vars ──
function extractEnv() {
  const files = TRACKED.filter((f) => /^(src|server|scripts)\/.*\.(jsx?|mjs)$/.test(f) || /^(vite\.config\.js|netlify\.toml|render\.yaml|\.env\.example)$/.test(f) || /^\.github\/workflows\//.test(f));
  const vars = {};
  const add = (name, f, line, how) => { (vars[name] ||= { refs: [], how: new Set() }).refs.push(`${f}:${line}`); vars[name].how.add(how); };
  for (const f of files) {
    const t = read(f);
    for (const m of t.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)|process\.env\[\s*['"]([A-Z][A-Z0-9_]+)['"]\s*\]/g)) add(m[1] || m[2], f, lineOf(t, m.index), 'server/process.env');
    for (const m of t.matchAll(/import\.meta\.env\.([A-Z][A-Z0-9_]+)/g)) add(m[1], f, lineOf(t, m.index), 'client/import.meta.env');
    if (/\.github\/workflows/.test(f)) for (const m of t.matchAll(/\$\{\{\s*(secrets|vars)\.([A-Z][A-Z0-9_]+)/g)) add(m[2], f, lineOf(t, m.index), `actions ${m[1]}`);
    if (f === '.env.example') for (const m of t.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)) add(m[1], f, lineOf(t, m.index), 'declared in .env.example');
    if (f === 'render.yaml') for (const m of t.matchAll(/key:\s*([A-Z][A-Z0-9_]+)/g)) add(m[1], f, lineOf(t, m.index), 'declared in render.yaml');
  }
  // Dynamic OAuth provider credentials: `${PROVIDER}_CLIENT_ID` built at runtime.
  const op = exists('server/lib/oauthProviders.js') ? read('server/lib/oauthProviders.js') : '';
  const dynamic = [...op.matchAll(/(?:clientIdEnv|envPrefix|env)\s*:\s*'([A-Z][A-Z0-9_]+)'/g)].map((m) => m[1]);
  return { vars, dynamic };
}

// ──────────────────────────────────────────────────────────────── jobs ──
function extractJobs() {
  const files = TRACKED.filter((f) => /^server\/.*\.js$/.test(f) && !/\.test\.js$/.test(f));
  const rows = [];
  for (const f of files) {
    const t = read(f);
    for (const m of t.matchAll(/cron\.schedule\(\s*['"]([^'"]+)['"]/g)) rows.push({ kind: 'node-cron', schedule: m[1], file: f, line: lineOf(t, m.index) });
    for (const m of t.matchAll(/setInterval\(([^\n]{0,140})/g)) {
      const iv = m[1].match(/,\s*([\d_ *]+(?:\*\s*\d+)*)\s*\)/)?.[1]?.trim();
      rows.push({ kind: 'setInterval', schedule: iv ? `every ${iv} ms` : 'see source', file: f, line: lineOf(t, m.index) });
    }
  }
  rows.forEach((r) => { r.id = `TE-JOB-${slug(r.file.replace(/^server\//, '').replace(/\.js$/, ''))}-L${r.line}`; });
  return rows;
}

// ─────────────────────────────────────────────────────── design tokens ──
function extractTokens() {
  const css = read('src/brand.css');
  const blocks = [];
  for (const m of css.matchAll(/(^|\n)(:root|\[data-theme="([\w-]+)"\])\s*\{([^}]*)\}/g)) {
    const vars = [...m[4].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((v) => [v[1], v[2].trim()]);
    blocks.push({ selector: m[2], theme: m[3] || null, line: lineOf(css, m.index + m[1].length), vars });
  }
  const media = [...css.matchAll(/@media\s*\(([^)]+)\)/g)].map((m) => m[1].replace(/\s*:\s*/g, ': ').replace(/\s+/g, ' ').trim());
  const mediaCounts = media.reduce((a, k) => ((a[k] = (a[k] || 0) + 1), a), {});
  return { blocks, mediaCounts };
}

// ──────────────────────────────────────────────────────────────── tests ──
function extractTests() {
  const pkg = JSON.parse(read('package.json'));
  const testFiles = TRACKED.filter((f) => /\.test\.(m?js|jsx)$/.test(f) && !f.startsWith('node_modules/'));
  return {
    scripts: Object.entries(pkg.scripts).map(([k, v]) => ({ id: `TE-SCR-${slug(k)}`, name: k, cmd: v })),
    tests: testFiles.map((f) => {
      const t = read(f);
      const runner = /from\s+'node:test'/.test(t) ? 'node:test' : /\b(describe|it|test|expect)\(/.test(t) ? 'jest' : 'unknown';
      const cases = [...t.matchAll(/\b(?:test|it)\(\s*(['"`])(.+?)\1/g)].map((m) => m[2]);
      return { id: `TE-TST-${slug(f.replace(/\.test\.(m?js|jsx)$/, ''))}`, file: f, runner, cases };
    }),
    verifyScripts: TRACKED.filter((f) => /^scripts\/verify-.*\.mjs$/.test(f)),
  };
}

// ──────────────────────────────────────────────────────── documentation ──
function extractDocs() {
  const docs = TRACKED.filter((f) => /\.(md|csv|json)$/i.test(f) && /^(docs\/|[^/]+\.md$|HANDOVER|\.claude\/|\.agents\/|\.codex\/|migrations\/|context-reconciliation\/|experience-(memory|proof)\/|prototypes\/)/.test(f) && !f.startsWith('docs/baseline/inventory/'));
  return docs.map((f) => {
    const t = read(f);
    const title = f.endsWith('.md') ? (t.match(/^#\s+(.+)$/m)?.[1] || '') : '';
    const last = git(`log -1 --format=%cs -- "${f}"`);
    return { f, title: title.slice(0, 110), lines: t.split('\n').length, last };
  });
}

// ─────────────────────────────────────────────────────── DB catalog ──
async function extractDb() {
  const url = process.env.BASELINE_CATALOG_DATABASE_URL;
  if (!url) return null;
  const host = new URL(url).hostname;
  if (!['localhost', '127.0.0.1', '::1', ''].includes(host)) {
    throw new Error(`Refusing BASELINE_CATALOG_DATABASE_URL host "${host}": the catalog step only runs against a throwaway LOCAL database.`);
  }
  const { default: postgres } = await import('postgres');
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const tables = await sql`select c.relname as name, c.relrowsecurity as rls, obj_description(c.oid) as comment
      from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by 1`;
    const cols = await sql`select table_name, column_name, ordinal_position, data_type, udt_name, is_nullable, column_default
      from information_schema.columns where table_schema='public' order by table_name, ordinal_position`;
    const cons = await sql`select con.conname, rel.relname as table_name, con.contype, pg_get_constraintdef(con.oid) as def
      from pg_constraint con join pg_class rel on rel.oid=con.conrelid join pg_namespace n on n.oid=rel.relnamespace
      where n.nspname='public' order by 2,1`;
    const idx = await sql`select tablename, indexname, indexdef from pg_indexes where schemaname='public' order by 1,2`;
    const counts = {};
    for (const t of tables) counts[t.name] = Number((await sql.unsafe(`select count(*)::int as n from "${t.name}"`))[0].n);
    const misc = {
      views: await sql`select table_name from information_schema.views where table_schema='public'`,
      functions: await sql`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'`,
      triggers: await sql`select trigger_name, event_object_table from information_schema.triggers where trigger_schema='public'`,
      policies: await sql`select * from pg_policies`,
      extensions: await sql`select extname, extversion from pg_extension order by 1`,
      server: (await sql`show server_version`)[0].server_version,
    };
    let configIds = [];
    try { configIds = await sql`select id, length(data) as bytes from config_state order by id`; } catch {}
    return { tables, cols, cons, idx, counts, misc, configIds };
  } finally { await sql.end(); }
}

function locateCreateTable(dbSrc, name) {
  const m = new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${name}\\s*\\(`, 'i').exec(dbSrc);
  if (m) return lineOf(dbSrc, m.index);
  const m2 = new RegExp(`CREATE TABLE\\s+(?:IF NOT EXISTS\\s+)?"?${name}"?\\s*\\(`, 'i').exec(dbSrc);
  return m2 ? lineOf(dbSrc, m2.index) : null;
}

function domainOf(name) {
  const p = name.split('_')[0];
  return p;
}

function writeDb(cat) {
  const dbSrc = read('server/db.js');
  const otherDecl = TRACKED.filter((f) => /^server\/.*\.js$/.test(f) && f !== 'server/db.js');
  const findDecl = (name) => {
    const l = locateCreateTable(dbSrc, name);
    if (l) return link('server/db.js', l);
    for (const f of otherDecl) { const t = read(f); const l2 = locateCreateTable(t, name); if (l2) return link(f, l2); }
    return 'not located by pattern';
  };
  const groupsRaw = {};
  for (const t of cat.tables) (groupsRaw[domainOf(t.name)] ||= []).push(t.name);
  const group = {}; // table -> group file
  for (const [g, ts] of Object.entries(groupsRaw)) for (const t of ts) group[t] = ts.length >= 3 ? g : 'misc';
  const byGroup = {};
  for (const t of cat.tables) (byGroup[group[t.name]] ||= []).push(t);
  const colsBy = {}; for (const c of cat.cols) (colsBy[c.table_name] ||= []).push(c);
  const consBy = {}; for (const c of cat.cons) (consBy[c.table_name] ||= []).push(c);
  const idxBy = {}; for (const i of cat.idx) (idxBy[i.tablename] ||= []).push(i);
  const fkTargets = (t) => (consBy[t] || []).filter((c) => c.contype === 'f').map((c) => c.def.match(/REFERENCES\s+(\w+)/)?.[1]).filter(Boolean);
  const seeded = Object.entries(cat.counts).filter(([, n]) => n > 0);

  let idx = header('Database schema inventory (declared)', `
**Source of this catalog:** the repository's own \`server/db.js\` \`bootstrap()\` (plus \`server/data/seed.js\` \`ensureSeeded()\` where noted) executed against a **throwaway local PostgreSQL ${cat.misc.server}** database, then read back from \`pg_catalog\`/\`information_schema\`. This is the schema **the repository declares** at this revision — it is **not** an observation of the live Supabase database. Live-schema drift is unverified (no live access; see \`../02-coverage-and-limitations.md\`).
`);
  idx += `\n## Totals\n\n` + table(['Object', 'Count (declared)'], [
    ['Tables', cat.tables.length], ['Columns', cat.cols.length], ['Constraints (PK/FK/unique/check)', cat.cons.length],
    ['Indexes', cat.idx.length], ['Views', cat.misc.views.length], ['Functions', cat.misc.functions.length],
    ['Triggers', cat.misc.triggers.length], ['RLS policies', cat.misc.policies.length], ['Tables with RLS enabled', cat.tables.filter((t) => t.rls).length],
    ['Tables holding rows after bootstrap/seed on an empty DB', seeded.length],
  ]);
  idx += `\nExtensions present in the scratch database (Postgres defaults, not declared by the repo unless listed in db.js): ${cat.misc.extensions.map((e) => `\`${e.extname}\``).join(', ')}.\n`;
  idx += `\n## Tables\n\n` + table(['Element ID', 'Table', 'Group file', 'Cols', 'PK', 'FK → tables', 'Indexes', 'Declared at', 'Rows after empty-DB bootstrap'], cat.tables.map((t) => {
    const pk = (consBy[t.name] || []).find((c) => c.contype === 'p')?.def.replace('PRIMARY KEY ', '') || '—';
    return [`TE-DB-${t.name}`, `\`${t.name}\``, `[${group[t.name]}](db/${group[t.name]}.md#${t.name.replace(/_/g, '_')})`, (colsBy[t.name] || []).length, pk, [...new Set(fkTargets(t.name))].join(', ') || '—', (idxBy[t.name] || []).length, findDecl(t.name), cat.counts[t.name]];
  }));
  // Tables declared somewhere other than bootstrap(): lazy runtime DDL and
  // standalone SQL files. Compared against the bootstrap catalog by name.
  const declared = new Set(cat.tables.map((t) => t.name));
  const codeFiles = TRACKED.filter((f) => /^(server|src|scripts)\/.*\.(jsx?|mjs)$/.test(f) && !f.startsWith('scripts/baseline/'));
  const outside = [];
  for (const f of TRACKED.filter((f) => (/^server\/.*\.js$/.test(f) && f !== 'server/db.js') || /\.sql$/.test(f))) {
    const t = read(f);
    for (const m of t.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(/g)) {
      if (declared.has(m[1])) continue;
      const users = codeFiles.filter((cf) => cf !== f && new RegExp(`\\b${m[1]}\\b`).test(read(cf)));
      outside.push([`\`${m[1]}\``, link(f, lineOf(t, m.index)), f.endsWith('.sql') ? 'standalone SQL file — no code path in the repo applies it' : 'runtime DDL executed by application code (lazy, not at boot)', users.length ? users.map((u) => `\`${u}\``).join(' ') : 'none']);
    }
  }
  idx += `\n## Tables declared outside \`bootstrap()\` (${outside.length})\n\nNot present in the bootstrap catalog above. Three schema mechanisms therefore exist in the repository: boot-time \`bootstrap()\`, lazy runtime DDL, and standalone SQL files. Whether any of these exist in the **live** database is unverified.\n\n` + table(['Table', 'Declared at', 'Mechanism', 'Referenced by (other code files)'], outside);
  if (cat.configIds.length) idx += `\n## Platform rows seeded into \`config_state\` on an empty database\n\nThese are the platform-wide config rows bootstrap/seed creates when absent (\`config_state.data\` is TEXT JSON). Their **live** content may differ (admins edit them in the UI).\n\n` + table(['config_state.id', 'Seeded size (bytes)'], cat.configIds.map((r) => [`\`${r.id}\``, r.bytes]));
  write('db-schema.md', idx);

  for (const [g, ts] of Object.entries(byGroup)) {
    let doc = header(`Database — \`${g}\` table group`) + `\n[← DB index](../db-schema.md)\n`;
    for (const t of ts) {
      doc += `\n## ${t.name}\n\nElement \`TE-DB-${t.name}\` · declared at ${findDecl(t.name)} · RLS ${t.rls ? 'enabled' : 'not enabled'} · rows after empty-DB bootstrap: ${cat.counts[t.name]}\n\n`;
      doc += table(['#', 'Column', 'Type', 'Null', 'Default'], (colsBy[t.name] || []).map((c) => [c.ordinal_position, `\`${c.column_name}\``, c.data_type === 'USER-DEFINED' || c.data_type === 'ARRAY' ? c.udt_name : c.data_type, c.is_nullable === 'YES' ? 'yes' : 'NOT NULL', c.column_default ? `\`${c.column_default.slice(0, 70)}\`` : '']));
      const cs = (consBy[t.name] || []).filter((c) => c.contype !== 'n');
      if (cs.length) doc += `\n**Constraints**\n\n` + table(['Name', 'Type', 'Definition'], cs.map((c) => [c.conname, { p: 'primary key', f: 'foreign key', u: 'unique', c: 'check', x: 'exclusion' }[c.contype] || c.contype, `\`${c.def.slice(0, 160)}\``]));
      const is = (idxBy[t.name] || []);
      if (is.length) doc += `\n**Indexes**\n\n` + table(['Name', 'Definition'], is.map((i) => [i.indexname, `\`${i.indexdef.replace(/^CREATE (UNIQUE )?INDEX \S+ ON public\.\S+ USING /, (m, u) => (u ? 'UNIQUE ' : '')).slice(0, 180)}\``]));
    }
    write(`db/${g}.md`, doc);
  }
}

// ─────────────────────────────────────────────────────────────── main ──
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const api = extractApi(); writeApi(api);

  const ui = extractUiRoutes();
  write('ui-routes.md', header('Frontend route inventory (src/App.jsx)') + `\n${ui.length} \`<Route>\` declarations. Authorization is **not** declared at the router level — each screen performs its own session check (see module specs).\n\n` + table(['Element ID', 'Path', 'Element', 'Resolves to', 'Lazy', 'Location'], ui.map((r) => [r.id, `\`${r.path}\``, r.comp, `\`${r.target}\``, r.lazy ? 'yes' : 'no', link('src/App.jsx', r.line)])));

  const mods = extractModules();
  const groupDir = (f) => f.split('/').slice(0, f.startsWith('src/components/admin') || f.startsWith('server/lib/') ? 3 : 2).join('/');
  const byDir = {}; for (const m of mods) (byDir[groupDir(m.file)] ||= []).push(m);
  let mdoc = header('First-party module inventory (src/, server/)') + `\n${mods.length} files, ${mods.reduce((a, m) => a + m.lines, 0)} lines (tests excluded — see tests.md). "Imported by" counts static relative imports and dynamic \`import()\` across src/ and server/; **0 means no static importer was found** (candidate dead code, an entry point, or loaded another way — verify before treating as obsolete).\n\n`;
  mdoc += table(['Directory', 'Files', 'Lines', 'Files with 0 importers'], Object.entries(byDir).sort().map(([d, ms]) => [`\`${d}\``, ms.length, ms.reduce((a, m) => a + m.lines, 0), ms.filter((m) => m.importedBy === 0).length]));
  for (const [d, ms] of Object.entries(byDir).sort()) {
    mdoc += `\n## \`${d}\`\n\n` + table(['Element ID', 'File', 'Lines', 'Imported by', 'Exports (named)', 'Header comment (first lines)'], ms.sort((a, b) => a.file.localeCompare(b.file)).map((m) => [m.id, `\`${m.file}\``, m.lines, m.importedBy, (m.hasDefault ? 'default; ' : '') + m.exportsList.slice(0, 8).join(', ') + (m.exportsList.length > 8 ? ` … +${m.exportsList.length - 8}` : ''), m.head]));
  }
  write('modules.md', mdoc);

  const reg = extractRegistries();
  let rdoc = header('Registries (block types, admin tabs, themes, crystal variants)');
  rdoc += `\n## Section block REGISTRY — \`src/components/blocks/index.jsx\`\n\nAppend-only per CLAUDE.md deployment-safety invariant. Unknown \`section.type\` falls back to \`${reg.blockFallback}\` (static evidence: \`REGISTRY[section.type] || ${reg.blockFallback}\`). ${reg.blocks.length} keys.\n\n` + table(['Element ID', 'section.type key', 'Component', 'Component defined at', 'Registry line'], reg.blocks.map((b) => [`TE-BLK-${b.key}`, `\`${b.key}\``, b.comp, b.loc, link('src/components/blocks/index.jsx', b.regLine)]));
  rdoc += `\n### SUBSECTION_REGISTRY (${reg.subBlocks.length})\n\n` + table(['Key', 'Component'], reg.subBlocks.map((b) => [`\`${b.key}\``, b.comp]));
  rdoc += `\n## Admin \`TAB_COMPONENTS\` — \`src/components/admin/AdminShell.jsx\`\n\n${reg.tabs.length} componentIds. \`content\` and \`config\` are handled inline in AdminShell (not in this map). Which tabs a user actually sees is driven by \`config_state\` id \`admin_nav\` (admins) or the member's \`navigation.memberTabs\` (members) — see module spec.\n\n` + table(['Element ID', 'componentId', 'Component', 'Props', 'Location'], reg.tabs.map((t) => [`TE-TAB-${t.id}`, `\`${t.id}\``, t.comp, t.props, link('src/components/admin/AdminShell.jsx', t.line)]));
  rdoc += `\n## Theme picker options (\`ConfigPanel.jsx\` THEME_OPTIONS)\n\n${reg.themeOptions.map((t) => `\`${t}\``).join(', ') || 'not parsed'}\n`;
  rdoc += `\n## CRYSTAL_VARIANTS keys (\`src/lib/crystalGeometry.js\`)\n\n${(reg.crystalVariants || []).map((t) => `\`${t.key}\` (line ${t.line})`).join(', ') || 'not parsed'}\n`;
  write('registries.md', rdoc);

  const env = extractEnv();
  const ex = exists('.env.example') ? read('.env.example') : '';
  write('env-vars.md', header('Environment variable names') + `\nNames and reference locations only — **no values are read or recorded**. ${Object.keys(env.vars).length} distinct names.\n\n` + table(['Element ID', 'Name', 'Kind of reference', 'In .env.example', 'References (first 4)', 'Ref count'], Object.entries(env.vars).sort().map(([k, v]) => [`TE-ENV-${k}`, `\`${k}\``, [...v.how].join(', '), new RegExp(`^${k}=`, 'm').test(ex) ? 'yes' : 'no', v.refs.slice(0, 4).map((r) => `\`${r}\``).join(' '), v.refs.length])) + `\n\nDynamically constructed names (OAuth providers, \`server/lib/oauthProviders.js\`) are not visible to static extraction beyond what's listed; see the OAuth module spec.\n`);

  const jobs = extractJobs();
  write('jobs.md', header('Background jobs and timers (server)') + `\n${jobs.length} scheduling call sites. Static extraction only — whether a job is actually started depends on its caller being reached at boot (see module specs).\n\n` + table(['Element ID', 'Kind', 'Schedule', 'Location'], jobs.map((j) => [j.id, j.kind, `\`${j.schedule}\``, link(j.file, j.line)])));

  const tok = extractTokens();
  let tdoc = header('Design tokens (src/brand.css)');
  tdoc += `\n${tok.blocks.length} \`:root\`/\`[data-theme]\` blocks. Named themes: ${tok.blocks.filter((b) => b.theme).map((b) => `\`${b.theme}\` (TE-THM-${b.theme})`).join(', ')}.\n\nResponsive breakpoints used (\`@media\` condition → occurrences): ${Object.entries(tok.mediaCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `\`${k}\`×${v}`).join(', ')}.\n`;
  for (const b of tok.blocks) tdoc += `\n## \`${b.selector}\` — ${link('src/brand.css', b.line)}\n\n` + table(['Token', 'Value'], b.vars.map(([k, v]) => [`\`${k}\``, `\`${v}\``]));
  write('design-tokens.md', tdoc);

  const tests = extractTests();
  write('tests.md', header('Automated tests and scripts') + `\n## Test files (${tests.tests.length})\n\nRunner detected from imports. Case names are extracted from \`test(…)\`/\`it(…)\` calls; execution results are **not** recorded here (see \`../10-test-catalog.md\`).\n\n` + table(['Element ID', 'File', 'Runner', 'Cases', 'Case names'], tests.tests.map((t) => [t.id, `\`${t.file}\``, t.runner, t.cases.length, t.cases.join('; ').slice(0, 400)])) + `\n## Verification scripts\n\n${tests.verifyScripts.map((f) => `- \`${f}\``).join('\n')}\n\n## package.json scripts\n\n` + table(['Element ID', 'Script', 'Command'], tests.scripts.map((s) => [s.id, `\`${s.name}\``, `\`${s.cmd}\``])));

  const docs = extractDocs();
  write('documentation.md', header('Documentation inventory') + `\n${docs.length} tracked Markdown/CSV/JSON documentation files (root-level \`*.md\`, \`docs/**\` excluding this generated folder, \`.claude/\`, \`.agents/\`, \`.codex/\`, \`migrations/\`, and memory/proof/prototype folders). Last-commit date is from git history, not the document's own claimed date.\n\n` + table(['File', 'Title', 'Lines', 'Last commit'], docs.map((d) => [`\`${d.f}\``, d.title, d.lines, d.last])));

  // ── Module coverage: every element assigned to exactly one module ──
  const map = JSON.parse(read('scripts/baseline/module-map.json')).modules.map((m) => ({ ...m, re: Object.fromEntries(['api', 'tables', 'ui', 'files'].map((k) => [k, (m[k] || []).map((p) => new RegExp(p))])) }));
  const assign = (kind, key) => map.find((m) => m.re[kind].some((r) => r.test(key)))?.id || 'UNASSIGNED';
  const tableNames = new Set();
  for (const f of TRACKED.filter((f) => /^server\/.*\.js$/.test(f) || /\.sql$/.test(f))) for (const m of read(f).matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(/g)) tableNames.add(m[1]);
  const elements = [
    ...api.endpoints.map((e) => ({ kind: 'api', id: e.id, key: e.path, mod: assign('api', e.path) })),
    ...[...tableNames].sort().map((t) => ({ kind: 'tables', id: `TE-DB-${t}`, key: t, mod: assign('tables', t) })),
    ...ui.map((r) => ({ kind: 'ui', id: r.id, key: r.path, mod: assign('ui', r.path) })),
    ...mods.map((m) => ({ kind: 'files', id: m.id, key: m.file, mod: assign('files', m.file) })),
  ];
  const kinds = { api: 'Endpoints', tables: 'Tables', ui: 'UI routes', files: 'Source files' };
  let cdoc = header('Module coverage — element → module assignment') + `\nEvery inventoried element is assigned to one module by \`scripts/baseline/module-map.json\` (first matching pattern wins). This is the **completeness boundary** for the current-state specification: an element is "accounted for" when it is assigned to a module; \`UNASSIGNED\` elements are listed in full below and must be classified (map updated) or explicitly excluded before the inventory is called complete. Tables include those declared outside \`bootstrap()\` (see db-schema.md).\n\n`;
  const ids = [...map.map((m) => m.id), 'UNASSIGNED'];
  cdoc += table(['Module', 'Name', ...Object.values(kinds), 'Lines of source'], ids.map((id) => {
    const m = map.find((x) => x.id === id);
    const els = elements.filter((e) => e.mod === id);
    const lines = mods.filter((x) => assign('files', x.file) === id).reduce((a, x) => a + x.lines, 0);
    return [id, m?.name || '—', ...Object.keys(kinds).map((k) => els.filter((e) => e.kind === k).length), lines];
  }));
  const unassigned = elements.filter((e) => e.mod === 'UNASSIGNED');
  cdoc += `\n## UNASSIGNED elements (${unassigned.length})\n\n` + (unassigned.length ? table(['Kind', 'Element ID', 'Key'], unassigned.map((e) => [kinds[e.kind], e.id, `\`${e.key}\``])) : 'None.\n');
  for (const id of map.map((m) => m.id)) {
    const els = elements.filter((e) => e.mod === id);
    cdoc += `\n## ${id} — ${map.find((m) => m.id === id).name}\n\n` + Object.entries(kinds).map(([k, label]) => {
      const list = els.filter((e) => e.kind === k);
      return `**${label} (${list.length}):** ${list.length ? list.map((e) => `\`${e.id}\``).join(', ') : '—'}`;
    }).join('\n\n') + '\n';
  }
  write('module-coverage.md', cdoc);

  let dbNote = 'skipped (BASELINE_CATALOG_DATABASE_URL not set — previous db output left in place)';
  const cat = await extractDb();
  if (cat) { writeDb(cat); dbNote = `${cat.tables.length} tables from local catalog`; }

  const summary = {
    revision: REV, branch: BRANCH, committed: REV_DATE,
    endpoints: api.endpoints.length, endpointsNoGuard: api.endpoints.filter((e) => e.guard === 'none detected').length, routerMounts: api.mounts.length, unmountedRouteFiles: api.unmounted.length,
    uiRoutes: ui.length, modules: mods.length, moduleLines: mods.reduce((a, m) => a + m.lines, 0), modulesZeroImporters: mods.filter((m) => m.importedBy === 0).length,
    blockTypes: reg.blocks.length, adminTabs: reg.tabs.length, envVars: Object.keys(env.vars).length, jobs: jobs.length,
    unassignedElements: unassigned.length,
    themes: tok.blocks.filter((b) => b.theme).length, testFiles: tests.tests.length, npmScripts: tests.scripts.length, docs: docs.length, db: dbNote,
  };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`wrote ${written.length} files under ${rel(OUT)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
