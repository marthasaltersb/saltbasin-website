#!/usr/bin/env node
// Compares a tracker snapshot with the expected.json written by make-fixture.mjs.   node verify-snapshot.mjs <snapshot.json> <expected.json>
import fs from 'node:fs';

const [snapFile, expFile] = process.argv.slice(2);
const raw = fs.readFileSync(snapFile, 'utf8');
const snap = JSON.parse(raw); const exp = JSON.parse(fs.readFileSync(expFile, 'utf8'));
const fails = [];
const eq = (what, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); };
for (const [k, st] of Object.entries(exp.features)) eq(`feature ${k}`, snap.features.find((f) => f.key === k)?.status, st);
for (const [id, w] of Object.entries(exp.bugs)) { const b = snap.bugs.find((x) => x.id === id); eq(`bug ${id} status`, b?.status, w.status); eq(`bug ${id} attempts`, b?.attempts || 0, w.attempts); }
eq('totals', snap.totals, exp.totals);
eq('agent count', snap.agents.length, exp.agentCount);
for (const [id, u] of Object.entries(exp.agentTokens)) eq(`tokens ${id}`, snap.agents.find((a) => a.id === id)?.tokens, u);
if (raw.includes(exp.sentinel)) fails.push('snapshot contains transcript text (sentinel found)');
if (fails.length) { console.error(fails.join('\n')); process.exit(1); }
console.log('snapshot matches expected');
