#!/usr/bin/env node
// Baseline traceability check — run after editing anything under docs/baseline/.
//
//   node scripts/baseline/check-traceability.mjs
//
// Fails (exit 1) when a document references an ID that is not defined:
//   TE-…   must exist in the generated inventory (docs/baseline/inventory/**)
//   DEC-…  must have a "### DEC-…" heading in 07-decision-log.md
//   REQ-/DEF-/NEW-/AT-/MAP-/TASK-…  must be defined as the first cell of a table row
//          (or, for DEC/AT, a heading) somewhere under docs/baseline/
// A trailing "*" (e.g. TE-TAB-*, REQ-14-*) is a wildcard and must match at least one ID.
// Also reports (does not fail on) traceability gaps the program must track:
// requirements with no linked acceptance test, and unverified rows.
// Writes docs/baseline/inventory/traceability-report.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = path.join(ROOT, 'docs', 'baseline');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const all = walk(BASE).filter((f) => f.endsWith('.md'));
const inventory = all.filter((f) => f.includes(`${path.sep}inventory${path.sep}`) && !f.endsWith('traceability-report.md'));
const authored = all.filter((f) => !f.includes(`${path.sep}inventory${path.sep}`) && !f.includes(`${path.sep}intake${path.sep}`));
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

const teDefined = new Set();
for (const f of inventory) for (const m of fs.readFileSync(f, 'utf8').matchAll(/`?\b(TE-[A-Z]{2,4}-[A-Za-z0-9_.~-]*[A-Za-z0-9_])`?/g)) teDefined.add(m[1]);

// Hand-registered technical elements: a TE- ID in the first cell of an
// authored table row (e.g. 04-technical-element-register.md) defines it.
for (const f of authored) for (const m of fs.readFileSync(f, 'utf8').matchAll(/^\|\s*(TE-[A-Z]{2,5}-[A-Za-z0-9_.~-]+)\s*\|/gm)) teDefined.add(m[1]);

const defined = new Map(); // id -> file
const dupes = [];
const ID = /(REQ|DEF|NEW|AT|MAP|TASK|DEC)-[0-9A-Z]+(?:-[0-9]{3})?/;
for (const f of authored) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(new RegExp(`^\\|\\s*(${ID.source})\\s*\\|`, 'gm'))) {
    if (defined.has(m[1]) && defined.get(m[1]) !== rel(f)) dupes.push(`${m[1]} in ${rel(f)} and ${defined.get(m[1])}`);
    else if (defined.has(m[1])) dupes.push(`${m[1]} twice in ${rel(f)}`);
    defined.set(m[1], rel(f));
  }
  for (const m of text.matchAll(new RegExp(`^#{2,4}\\s+(${ID.source})\\b`, 'gm'))) {
    if (defined.has(m[1]) && defined.get(m[1]) !== rel(f)) dupes.push(`${m[1]} in ${rel(f)} and ${defined.get(m[1])}`);
    defined.set(m[1], rel(f));
  }
}

const dangling = [];
const refCount = new Map();
for (const f of authored) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\b(TE-[A-Z]{2,5}-[A-Za-z0-9_.~*-]*[A-Za-z0-9_*])/g)) {
      const id = m[1];
      const ok = id.endsWith('*') ? [...teDefined].some((d) => d.startsWith(id.slice(0, -1))) : teDefined.has(id);
      if (!ok) dangling.push(`${rel(f)}:${i + 1} ${id} (not in generated inventory)`);
    }
    for (const m of line.matchAll(/\b((?:REQ|DEF|NEW|AT|MAP|TASK|DEC)-[0-9A-Z]+(?:-[0-9]{3}|-\*)?)/g)) {
      const id = m[1];
      if (/^(REQ|DEF|AT|MAP|TASK)-[0-9]+$/.test(id) && !id.includes('*')) continue; // bare prefix in prose, e.g. "REQ-" schema text
      refCount.set(id, (refCount.get(id) || 0) + 1);
      const ok = id.endsWith('*') ? [...defined.keys()].some((d) => d.startsWith(id.slice(0, -1))) : defined.has(id);
      if (!ok) dangling.push(`${rel(f)}:${i + 1} ${id} (not defined)`);
    }
  });
}

// Coverage report over current-state rows
const rows = [];
for (const f of authored.filter((f) => f.includes(`${path.sep}03-modules${path.sep}`))) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const cells = line.split(/(?<!\\)\|/).map((c) => c.trim());
    if (!/^(REQ|DEF)-\d{2}-\d{3}$/.test(cells[1] || '')) continue;
    if (cells.length !== 13) dangling.push(`${rel(f)} ${cells[1]} has ${cells.length - 2} cells (expected 11) — unescaped "|"?`);
    rows.push({ id: cells[1], file: rel(f), maturity: cells[7], impl: cells[8], verification: cells[10] });
  }
}
const atText = fs.existsSync(path.join(BASE, '10-test-catalog.md')) ? fs.readFileSync(path.join(BASE, '10-test-catalog.md'), 'utf8') : '';
const tested = new Set([...atText.matchAll(/\b((?:REQ|DEF)-\d{2}-\d{3})\b/g)].map((m) => m[1]));
const count = (k, v) => rows.filter((r) => r[k].startsWith(v)).length;
const tally = (k) => [...new Set(rows.map((r) => r[k].replace(/\s*\(.*$/, '')))].sort().map((v) => `${v}: ${rows.filter((r) => r[k].replace(/\s*\(.*$/, '') === v).length}`).join(' · ');

let out = `# Traceability report\n\n> **GENERATED** by \`scripts/baseline/check-traceability.mjs\` — do not edit by hand.\n\n`;
out += `## Integrity\n\n- Authored documents scanned: ${authored.length}\n- Defined IDs (REQ/DEF/NEW/AT/MAP/TASK/DEC): ${defined.size}\n- Generated technical-element IDs available: ${teDefined.size}\n- **Dangling references: ${dangling.length}**\n- **Duplicate definitions: ${dupes.length}**\n\n`;
if (dangling.length) out += dangling.map((d) => `- ${d}`).join('\n') + '\n\n';
if (dupes.length) out += dupes.map((d) => `- ${d}`).join('\n') + '\n\n';
out += `## Current-state rows (03-modules)\n\n- Rows: ${rows.length} (REQ ${rows.filter((r) => r.id.startsWith('REQ')).length}, DEF ${rows.filter((r) => r.id.startsWith('DEF')).length})\n- Definition maturity — ${tally('maturity')}\n- Implementation state — ${tally('impl')}\n- Verification state — ${tally('verification')}\n- Rows referenced by at least one acceptance scenario in 10-test-catalog.md: ${rows.filter((r) => tested.has(r.id)).length}\n\n`;
out += `## Rows with no acceptance scenario yet (${rows.filter((r) => !tested.has(r.id)).length})\n\nExpected at this stage: acceptance scenarios are written against *decided target* behaviour (Stage 5), not against unreviewed current behaviour.\n\n${rows.filter((r) => !tested.has(r.id)).map((r) => `\`${r.id}\``).join(', ')}\n`;
fs.writeFileSync(path.join(BASE, 'inventory', 'traceability-report.md'), out);
console.log(`defined=${defined.size} te=${teDefined.size} rows=${rows.length} dangling=${dangling.length} dupes=${dupes.length}`);
if (dangling.length || dupes.length) {
  console.log([...dangling, ...dupes].slice(0, 60).join('\n'));
  process.exit(1);
}
