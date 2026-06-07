// Parses docs/TEST-SCENARIOS.md into a flat CSV for Google Sheets.
// Output: docs/TEST-SCENARIOS.csv
// Usage: node scripts/test-scenarios-to-csv.mjs

import fs from 'node:fs';
import path from 'node:path';

const MD  = path.join('docs', 'TEST-SCENARIOS.md');
const OUT = path.join('docs', 'TEST-SCENARIOS.csv');

const md = fs.readFileSync(MD, 'utf8');

// Map H1 group headings ("# Group N — Name") to the group label that follows.
const groupRe = /^# Group \d+ — (.+)$/gm;
const groupSpans = [];
let gm;
while ((gm = groupRe.exec(md))) {
  groupSpans.push({ name: gm[1].trim(), start: gm.index });
}
for (let i = 0; i < groupSpans.length; i++) {
  groupSpans[i].end = (i + 1 < groupSpans.length) ? groupSpans[i + 1].start : md.length;
}
const groupAt = (idx) => groupSpans.find(g => idx >= g.start && idx < g.end)?.name || '';

// Find every "## Scenario N: Title" block.
const scenRe = /^## Scenario (\d+): (.+)$/gm;
const scenarios = [];
let m;
const positions = [];
while ((m = scenRe.exec(md))) {
  positions.push({ id: m[1], title: m[2].trim(), start: m.index });
}
for (let i = 0; i < positions.length; i++) {
  positions[i].end = (i + 1 < positions.length) ? positions[i + 1].start : md.length;
}

const grab = (block, label) => {
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`);
  const r = block.match(re);
  return r ? r[1].trim() : '';
};

const grabSection = (block, header, stopHeaders) => {
  const startRe = new RegExp(`\\*\\*${header}:?\\*\\*`);
  const startMatch = block.match(startRe);
  if (!startMatch) return '';
  const startIdx = startMatch.index + startMatch[0].length;
  let endIdx = block.length;
  for (const s of stopHeaders) {
    const sr = new RegExp(`\\*\\*${s}:?\\*\\*`);
    const sm = block.slice(startIdx).match(sr);
    if (sm && sm.index !== undefined) {
      endIdx = Math.min(endIdx, startIdx + sm.index);
    }
  }
  return block.slice(startIdx, endIdx).trim();
};

const cleanList = (s) => s
  .split('\n')
  .map(l => l.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, '').trim())
  .filter(Boolean)
  .join('\n');

for (const p of positions) {
  const block = md.slice(p.start, p.end);
  const group = groupAt(p.start);
  const requirement = grab(block, 'Requirement covered');
  const user        = grab(block, 'User logged in');
  const deps        = grab(block, 'Dependencies');
  const steps       = cleanList(grabSection(block, 'Steps', ['Expected outcomes', 'How to verify', 'Log Test Run']));
  const expected    = cleanList(grabSection(block, 'Expected outcomes', ['How to verify', 'Log Test Run']));
  const verify      = cleanList(grabSection(block, 'How to verify', ['Log Test Run']));
  scenarios.push({
    'Scenario #': p.id,
    'Capability Group': group,
    'Requirement Covered': requirement,
    'Scenario Title': p.title,
    'User Logged In': user,
    'Dependencies': deps,
    'Steps': steps,
    'Expected Outcomes': expected,
    'How to Verify': verify,
    'Result (Pass/Fail/Blocked)': '',
    'Defect Notes': '',
    'Tester': '',
    'Run Date': '',
  });
}

const headers = Object.keys(scenarios[0]);
const csvCell = (v) => {
  const s = String(v ?? '');
  // Always quote — preserves newlines and commas; double internal quotes.
  return `"${s.replace(/"/g, '""')}"`;
};
const csv = [
  headers.map(csvCell).join(','),
  ...scenarios.map(row => headers.map(h => csvCell(row[h])).join(',')),
].join('\r\n');

fs.writeFileSync(OUT, '﻿' + csv, 'utf8');  // BOM helps Excel/Sheets detect UTF-8.
console.log(`wrote ${scenarios.length} scenarios → ${OUT}`);
