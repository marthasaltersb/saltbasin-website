#!/usr/bin/env node
// Appends tracker events from any pipeline (CI job, shell script, another agent framework) — no Claude
// Code workflow needed. Each call writes one line to <run dir>/journal.jsonl or a validator step log.
//
//   node log.mjs start  <runDir> <label> [phase]            # an agent/job began; label = role:feature[:rN]
//   node log.mjs result <runDir> <label> '<json result>'     # it finished with a structured result
//   node log.mjs fail   <runDir> <label> [reason]            # it died with no result (shown as failed)
//   node log.mjs step   <stepsRoot> <feature> <round> <journey> <step> pass|fail|blocked "<expected>" "<seen>"
//
// The agent id is derived from the label, so start/result/fail for the same label pair up.
import fs from 'node:fs';
import path from 'node:path';

const [cmd, dir, ...rest] = process.argv.slice(2);
const append = (file, row) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.appendFileSync(file, `${JSON.stringify({ ...row, at: new Date().toISOString() })}\n`); };
const idFor = (label) => label.replace(/[^a-zA-Z0-9]+/g, '-');
const PHASE = { build: 'Build', integrate: 'Integrate', validate: 'Validate', triage: 'Triage', fix: 'Fix', reconcile: 'Triage', record: 'Record' };
const journal = () => path.join(dir, 'journal.jsonl');

if (cmd === 'start') {
  const [label, phase] = rest;
  append(journal(), { type: 'started', agentId: idFor(label), label, phase: phase || PHASE[label.split(':')[0]] || 'Other' });
} else if (cmd === 'result') {
  const [label, json] = rest;
  append(journal(), { type: 'result', agentId: idFor(label), label, result: JSON.parse(json) });
} else if (cmd === 'fail') {
  const [label, reason] = rest;
  append(journal(), { type: 'error', agentId: idFor(label), label, reason: reason || null });
} else if (cmd === 'step') {
  const [feature, round, journey, step, result, expect, seen] = rest;
  append(path.join(dir, feature, `round-${round}`, 'steps.jsonl'), { journey, step, result, expect, seen });
} else {
  console.error('usage: log.mjs start|result|fail <runDir> <label> … | step <stepsRoot> <feature> <round> <journey> <step> <result> <expected> <seen>');
  process.exit(2);
}
