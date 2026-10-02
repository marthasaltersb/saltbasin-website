#!/usr/bin/env node
// Builds SYNTHETIC release-loop runs (fictional features, no real data) for testing scripts/release-tracker-sync.mjs
// and the tracker page.   node tools/release-tracker/make-fixture.mjs <outDir>
// Writes <outDir>/runA, <outDir>/runB, <outDir>/steps (live validator step logs) and <outDir>/expected.json.
// Every assistant message is streamed twice (a partial usage row, then the final one) like real transcripts,
// and every transcript carries a SENTINEL string in text/thinking/tool output that must never reach a snapshot.
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
if (!out) { console.error('usage: make-fixture.mjs <outDir>'); process.exit(2); }
const SENTINEL = 'ZZ-SENTINEL-DO-NOT-LEAK';
const T0 = Date.now() - 12 * 60 * 1000;   // relative to now so the page shows "N min ago"
let tick = 0;
const ts = () => new Date(T0 + (tick += 7000)).toISOString();
const dirA = path.join(out, 'runA'); const dirB = path.join(out, 'runB');
for (const d of [dirA, dirB, path.join(out, 'steps')]) fs.mkdirSync(d, { recursive: true });

const journals = { [dirA]: [{ type: 'launched' }], [dirB]: [{ type: 'launched' }] };
const expectedTokens = {};   // agentId -> final usage, once per message
let n = 0;

// messages: [{ in, cw, cr, out, tool? }]; each streamed twice, the first row with a smaller (partial) output count.
function transcript(dir, id, messages, extraUser = []) {
  const rows = [{ type: 'user', timestamp: ts(), message: { role: 'user', content: `${SENTINEL} prompt text` } }];
  const tot = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  messages.forEach((m, i) => {
    const mid = `msg_${id}_${i}`;
    const usage = (o) => ({ input_tokens: m.in, cache_creation_input_tokens: m.cw, cache_read_input_tokens: m.cr, output_tokens: o });
    rows.push({ type: 'assistant', timestamp: ts(), message: { id: mid, role: 'assistant', usage: usage(Math.min(3, m.out)), content: [{ type: 'thinking', thinking: `${SENTINEL} thinking` }] } });
    rows.push({ type: 'assistant', timestamp: ts(), message: { id: mid, role: 'assistant', usage: usage(m.out), content: [{ type: 'text', text: `${SENTINEL} assistant text` }, ...(m.tool ? [{ type: 'tool_use', id: `tu${i}`, name: 'Bash', input: m.tool }] : [])] } });
    tot.input += m.in; tot.cacheWrite += m.cw; tot.cacheRead += m.cr; tot.output += m.out;
  });
  for (const lines of extraUser) rows.push({ type: 'user', timestamp: ts(), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: lines }] } });
  fs.writeFileSync(path.join(dir, `agent-${id}.jsonl`), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  expectedTokens[id] = tot;
}

function agent(dir, label, phase, result, messages, opts = {}) {
  const id = `fx${String(++n).padStart(3, '0')}`;
  const key = `v2:${id}`;
  journals[dir].push({ type: 'started', key, agentId: id, label, phase });
  if (messages) transcript(dir, id, messages, opts.extraUser || []);
  if (!opts.running) journals[dir].push({ type: 'result', key, agentId: id, result });
  return id;
}
const M = (o, extra = {}) => ({ in: 2, cw: 100, cr: 1000, out: o, ...extra });
const cmd = { description: 'Run the build' };

// alpha-ledger: fails round 1 (one defect), fixed once, passes round 2 -> passed, bug verified.
agent(dirA, 'build:alpha-ledger', 'Build', { branch: 'release-loop/alpha-ledger-build', commit: 'a1', initialCheckPassed: true, failures: [] }, [M(50, { tool: cmd }), M(60)]);
agent(dirA, 'integrate:alpha-ledger', 'Integrate', { merged: true, head: 'abc1234def56', buildPassed: true, conflicts: [] }, [M(20)]);
agent(dirA, 'validate:alpha-ledger:r1', 'Validate', { passed: false, stepsPassed: 8, stepsTotal: 10, reportPath: 'docs/test-results/alpha-ledger/round-1.md' }, [M(30)]);
agent(dirA, 'triage:alpha-ledger:r1', 'Triage', { items: [{ id: 'A1', step: 'Journey 1 step 3', rootCause: 'The total ignores the discount line.', class: 'defect', files: ['src/ledger.js'] }] }, [M(25)]);
agent(dirA, 'fix:alpha-ledger:r1', 'Fix', { fixed: [{ id: 'A1', what: 'Subtract discount before total', files: ['src/ledger.js'] }], notFixed: [] }, [M(40)]);
agent(dirA, 'validate:alpha-ledger:r2', 'Validate', { passed: true, stepsPassed: 10, stepsTotal: 10, reportPath: 'docs/test-results/alpha-ledger/round-2.md' }, [M(30)]);

// bravo-forms: bug B1 survives two fix attempts -> needs_human; B9 is a business question.
agent(dirA, 'build:bravo-forms', 'Build', { branch: 'release-loop/bravo-forms-build', commit: 'b1', initialCheckPassed: true, failures: [] }, [M(10)]);
agent(dirA, 'validate:bravo-forms:r1', 'Validate', { passed: false, stepsPassed: 5, stepsTotal: 12 }, [M(10)]);
agent(dirA, 'triage:bravo-forms:r1', 'Triage', { items: [
  { id: 'B1', step: 'Journey 2 step 1', rootCause: 'Save button posts an empty body.', class: 'defect', files: ['src/forms.js'] },
  { id: 'B9', step: 'Journey 4 step 2', rootCause: 'Rounding rule is not defined.', class: 'needs_business_definition', question: 'Should totals round half up or half even?' }] }, [M(10)]);
agent(dirA, 'fix:bravo-forms:r1', 'Fix', { fixed: [{ id: 'B1', what: 'Send the form body', files: ['src/forms.js'] }], notFixed: [{ id: 'B9', why: 'Needs a business decision' }] }, [M(10)]);
agent(dirA, 'validate:bravo-forms:r2', 'Validate', { passed: false, stepsPassed: 7, stepsTotal: 12 }, [M(10)]);
agent(dirA, 'triage:bravo-forms:r2', 'Triage', { items: [{ id: 'B2', recurrenceOf: 'B1', step: 'Journey 2 step 1', rootCause: 'Body is sent but the content type header is missing.', class: 'defect' }] }, [M(10)]);
agent(dirA, 'fix:bravo-forms:r2', 'Fix', { fixed: [{ id: 'B1', what: 'Add content type header', files: ['src/forms.js'] }], notFixed: [] }, [M(10)]);
agent(dirA, 'validate:bravo-forms:r3', 'Validate', { passed: false, stepsPassed: 9, stepsTotal: 12 }, [M(10)]);
agent(dirA, 'triage:bravo-forms:r3', 'Triage', { items: [{ id: 'B3', recurrenceOf: 'B1', step: 'Journey 2 step 1', rootCause: 'Server rejects the body on a stale session.', class: 'defect' }] }, [M(10)]);

// charlie-export: its build agent died (journal ended it with no result) -> failed.
agent(dirA, 'build:charlie-export', 'Build', null, [M(5)]);

// run B: a second workflow run. delta-board has a validator still running with live signals.
agent(dirB, 'build:delta-board', 'Build', { branch: 'release-loop/delta-board-build', commit: 'd1', initialCheckPassed: true, failures: ['npm audit exited 1 (advisory only)'] }, [M(15)]);
agent(dirB, 'validate:delta-board:r1', 'Validate', null, [M(12, { tool: { description: 'Click the Save button' } }), M(14)], {
  running: true,
  extraUser: [`PAGEERROR TypeError: x is undefined\nREQFAIL http://127.0.0.1:3806/api/boards 500\n${SENTINEL} tool output`],
});
fs.mkdirSync(path.join(out, 'steps', 'delta-board', 'round-1'), { recursive: true });
fs.writeFileSync(path.join(out, 'steps', 'delta-board', 'round-1', 'steps.jsonl'), [
  { journey: 'J1', step: '1', expect: 'Board title shows', seen: 'Board title shows', result: 'pass' },
  { journey: 'J1', step: '2', expect: 'Card count is 3', seen: 'Card count is 2', result: 'fail' },
  { type: 'pageerror', detail: 'Uncaught ReferenceError: foo' },
].map((r) => JSON.stringify(r)).join('\n') + '\n');

for (const [d, rows] of Object.entries(journals)) fs.writeFileSync(path.join(d, 'journal.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

const sum = (k) => Object.values(expectedTokens).reduce((t, u) => t + u[k], 0);
fs.writeFileSync(path.join(out, 'expected.json'), JSON.stringify({
  sentinel: SENTINEL,
  features: { 'alpha-ledger': 'passed', 'bravo-forms': 'needs_human', 'charlie-export': 'failed', 'delta-board': 'validate' },
  bugs: { A1: { status: 'verified', attempts: 1 }, B1: { status: 'needs_human', attempts: 2 }, B9: { status: 'needs_business_definition', attempts: 0 } },
  totals: { input: sum('input'), cacheWrite: sum('cacheWrite'), cacheRead: sum('cacheRead'), output: sum('output') },
  agentTokens: expectedTokens,
  agentCount: n,
}, null, 2));
console.log(`fixture written to ${out} (${n} agents)`);
