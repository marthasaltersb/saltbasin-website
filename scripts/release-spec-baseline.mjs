#!/usr/bin/env node
// Frozen test baselines for training specs: every retry tests the same fixed set of steps.
//
//   node scripts/release-spec-baseline.mjs freeze  --feature <key> [--spec docs/training/x.md] [--amendment A2]
//   node scripts/release-spec-baseline.mjs check   [--feature <key> | --all]
//   node scripts/release-spec-baseline.mjs diff    --feature <key> [--from 1] [--to 2]
//   node scripts/release-spec-baseline.mjs score   --feature <key> --steps <steps.jsonl> [--version N]
//   node scripts/release-spec-baseline.mjs show    --feature <key> [--version N]
//
// A training spec is parsed into steps with STABLE IDS written into the spec itself:
//   numbered items under "## Journey 3 …"  → [J3.1], [J3.2] …   (journey ids like 3b work too)
//   items under "## Edge cases"            → [E.1], [E.2] …
//   items under "## Preconditions …"       → [P.1], [P.2] …     (setup; a failed one blocks, it is not scored)
// `freeze` tags any untagged item (a new step always gets the next unused number, an id is never reused),
// then writes docs/training/baselines/<feature>/v<N>.json: each step's id, text hash and required test
// surfaces, a hash of every other section (Where things are, fixtures, appendices), the fixed test
// constraints, and the amendment that produced it. Version 1 is the first freeze; every later version must
// name an APPROVED amendment in docs/spec-amendments/<feature>/<id>.json (definition.json specGovernance).
// `check` fails (exit 1) when the spec on disk differs from its latest baseline, or when that baseline has
// no approved amendment — the integrator runs it before every merge, so an unreviewed step change cannot
// reach a validator. `score` measures a validator's steps.jsonl against the pinned baseline: the total is
// always the baseline's scored step count, missing steps count as not run, ids outside the baseline are
// listed as observations and never change the score.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const BASE_DIR = path.join(root, 'docs/training/baselines');
const AMEND_DIR = path.join(root, 'docs/spec-amendments');
const FEATURES = JSON.parse(fs.readFileSync(path.join(root, 'docs/release-log/active-release.features.json'), 'utf8')).features;
const DEFINITION = JSON.parse(fs.readFileSync(path.join(root, 'server/data/releaseLoop/definition.json'), 'utf8'));

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const TAG = /^\[([JEP][0-9a-z]*\.[0-9]+)\]\s*/;
// A step is a command-line step (no browser surface) when its action is a shell command.
const CLI = /^(?:\[[^\]]+\]\s*)?(?:Run\s+)?`(?:node|npm|grep|git|createdb|dropdb|psql|curl|bash|sh|kill|ls|cat)\b|^(?:\[[^\]]+\]\s*)?`[^`]*`\s+(?:exits|prints|returns)/;

export function parseSpec(text) {
  const lines = text.split('\n');
  const steps = []; const sections = []; let sec = null; let kind = null; let jid = null; let item = null;
  const close = () => { if (item) { steps.push(item); item = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2) {
      close();
      const title = h2[1].trim();
      const j = /^Journey\s+([0-9]+[a-z]?)\b/i.exec(title);
      kind = j ? 'journey' : /^Edge cases/i.test(title) ? 'edge' : /^Preconditions/i.test(title) ? 'precondition' : 'context';
      jid = j ? j[1] : null;
      sec = { title, kind, body: [] }; sections.push(sec);
      continue;
    }
    if (!sec) continue;   // the title and intro above the first section are free text
    const start = kind !== 'context' && (/^(\d+)\.\s+(.*)$/.exec(line) || (kind === 'edge' ? /^()-\s+(.*)$/.exec(line) : null));
    if (start) {
      close();
      const rest = start[2]; const t = TAG.exec(rest);
      item = { kind: kind === 'journey' ? 'step' : kind, journey: jid, tag: t ? t[1] : null, line: i, lines: [t ? rest.slice(t[0].length) : rest], marker: start[1] };
      continue;
    }
    if (item && (line === '' || /^\s/.test(line))) { item.lines.push(line); continue; }
    close();
    sec.body.push(line);
  }
  close();
  for (const s of steps) {
    s.text = s.lines.join('\n').replace(/\n+$/, '');
    s.hash = sha(norm(s.text)).slice(0, 16);
    s.surfaces = s.kind === 'precondition' ? ['setup'] : CLI.test(s.lines[0]) ? ['cli'] : ['desktop', 'mobile'];
  }
  return { steps, sections: sections.map((x) => ({ title: x.title, kind: x.kind, hash: sha(norm(x.body.join('\n'))).slice(0, 16) })) };
}

const prefix = (s) => (s.kind === 'step' ? `J${s.journey}` : s.kind === 'edge' ? 'E' : 'P');

// Gives every untagged item an id: the next unused number in its group (never one that was ever retired).
export function assignIds(steps, retired = []) {
  const used = new Map();
  for (const id of [...steps.map((s) => s.tag).filter(Boolean), ...retired]) {
    const [g, n] = [id.slice(0, id.lastIndexOf('.')), Number(id.slice(id.lastIndexOf('.') + 1))];
    used.set(g, Math.max(used.get(g) || 0, n));
  }
  const fresh = [];
  for (const s of steps) {
    if (s.tag) { s.id = s.tag; continue; }
    const g = prefix(s); const n = (used.get(g) || 0) + 1; used.set(g, n);
    s.id = `${g}.${n}`; fresh.push(s);
  }
  return fresh;
}

function writeTags(file, text, fresh) {
  if (!fresh.length) return text;
  const lines = text.split('\n');
  for (const s of fresh) {
    lines[s.line] = lines[s.line].replace(/^(\d+\.\s+|-\s+)/, `$1[${s.id}] `);
  }
  const out = lines.join('\n'); fs.writeFileSync(file, out); return out;
}

const featureOf = (key) => FEATURES.find((f) => f.key === key) || null;
const dirOf = (key) => path.join(BASE_DIR, key);
function versions(key) {
  if (!fs.existsSync(dirOf(key))) return [];
  return fs.readdirSync(dirOf(key)).map((f) => /^v(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
}
function load(key, v) {
  const vs = versions(key); const n = v ? Number(v) : vs[vs.length - 1];
  if (!n) return null;
  return JSON.parse(fs.readFileSync(path.join(dirOf(key), `v${n}.json`), 'utf8'));
}
function amendment(key, id) {
  const f = path.join(AMEND_DIR, key, `${id}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
// Approved means decided by someone other than the proposer.
const approved = (a) => a?.review?.status === 'approved' && a.review.reviewer && a.review.reviewer !== a.proposedBy;
const scored = (b) => b.steps.filter((s) => s.kind !== 'precondition');

export function diffBaselines(a, b) {
  const A = new Map(a.steps.map((s) => [s.id, s])); const B = new Map(b.steps.map((s) => [s.id, s]));
  const out = { same: [], changed: [], added: [], retired: [], contextChanged: [] };
  for (const [id, s] of B) { const o = A.get(id); if (!o) out.added.push(id); else if (o.hash !== s.hash || o.surfaces.join() !== s.surfaces.join()) out.changed.push(id); else out.same.push(id); }
  for (const id of A.keys()) if (!B.has(id)) out.retired.push(id);
  const AS = new Map(a.sections.map((s) => [s.title, s.hash]));
  for (const s of b.sections) if (s.kind !== 'journey' && AS.get(s.title) !== s.hash) out.contextChanged.push(s.title);
  for (const t of AS.keys()) if (!b.sections.some((s) => s.title === t)) out.contextChanged.push(`${t} (removed)`);
  return out;
}

function freeze() {
  const key = opt('--feature'); const f = featureOf(key);
  const spec = opt('--spec') || f?.trainingSpec;
  if (!key || !spec) { console.error('freeze needs --feature <key> (and --spec when the feature is not in active-release.features.json)'); process.exit(2); }
  const file = path.join(root, spec);
  if (!fs.existsSync(file)) { console.error(`training spec not found: ${spec}`); process.exit(2); }
  const prev = load(key);
  const amendId = opt('--amendment');
  if (prev && !amendId) { console.error(`${key} already has baseline v${prev.version}; a new version needs --amendment <id> (an approved spec amendment)`); process.exit(1); }
  if (amendId) {
    const a = amendment(key, amendId);
    if (!a) { console.error(`amendment not found: docs/spec-amendments/${key}/${amendId}.json`); process.exit(1); }
    if (!approved(a)) { console.error(`amendment ${amendId} is "${a.review?.status || 'proposed'}"${a.review?.status === 'approved' ? ' but has no reviewer distinct from its proposer' : ''}: not approved`); process.exit(1); }
  }
  let text = fs.readFileSync(file, 'utf8');
  let parsed = parseSpec(text);
  const retired = prev ? [...(prev.retired || []), ...prev.steps.map((s) => s.id)] : [];
  const fresh = assignIds(parsed.steps, retired.filter((id) => !parsed.steps.some((s) => s.tag === id)));
  if (fresh.length) { text = writeTags(file, text, fresh); parsed = parseSpec(text); assignIds(parsed.steps); }
  const dup = parsed.steps.map((s) => s.id).filter((id, i, l) => l.indexOf(id) !== i);
  if (dup.length) { console.error(`duplicate step ids in ${spec}: ${[...new Set(dup)].join(', ')}`); process.exit(1); }
  const version = prev ? prev.version + 1 : 1;
  let commit = null; try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim(); } catch { /* not a checkout */ }
  const baseline = {
    feature: key, spec, version, frozenAt: new Date().toISOString(), commitAtFreeze: commit,
    specSha256: sha(text), amendment: amendId || null, previous: prev ? prev.version : null,
    retired: prev ? [...new Set([...(prev.retired || []), ...prev.steps.map((s) => s.id).filter((id) => !parsed.steps.some((s) => s.id === id))])] : [],
    constraints: DEFINITION.specGovernance?.testConstraints || null,
    steps: parsed.steps.map((s) => ({ id: s.id, kind: s.kind, journey: s.journey, surfaces: s.surfaces, hash: s.hash, summary: norm(s.lines[0]).slice(0, 160) })),
    sections: parsed.sections,
  };
  if (prev && amendId) baseline.comparedWithPrevious = diffBaselines(prev, baseline);
  fs.mkdirSync(dirOf(key), { recursive: true });
  fs.writeFileSync(path.join(dirOf(key), `v${version}.json`), `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`${key}: baseline v${version} — ${scored(baseline).length} scored steps, ${baseline.steps.length - scored(baseline).length} preconditions${fresh.length ? `, ${fresh.length} step ids written into ${spec}` : ''}${amendId ? ` (amendment ${amendId})` : ''}.`);
}

function checkOne(key) {
  const b = load(key); const problems = [];
  if (!b) return [`${key}: no frozen baseline (run freeze before the first validation round)`];
  const file = path.join(root, b.spec);
  if (!fs.existsSync(file)) return [`${key}: training spec ${b.spec} is missing`];
  const text = fs.readFileSync(file, 'utf8');
  if (sha(text) === b.specSha256) {
    if (b.version > 1) {
      const a = amendment(key, b.amendment || '');
      if (!approved(a)) problems.push(`${key}: baseline v${b.version} names amendment "${b.amendment}", which is not approved`);
    }
    return problems;
  }
  const p = parseSpec(text);
  const untagged = p.steps.filter((s) => !s.tag);
  assignIds(p.steps, b.retired || []);
  const d = diffBaselines(b, { steps: p.steps.map((s) => ({ id: s.id, hash: s.hash, surfaces: s.surfaces })), sections: p.sections });
  const parts = [];
  if (untagged.length) parts.push(`untagged new item(s) at line ${untagged.map((s) => s.line + 1).join(', ')}`);
  if (d.changed.length) parts.push(`changed ${d.changed.join(', ')}`);
  if (d.added.length) parts.push(`added ${d.added.join(', ')}`);
  if (d.retired.length) parts.push(`removed ${d.retired.join(', ')}`);
  if (d.contextChanged.length) parts.push(`context changed: ${d.contextChanged.join('; ')}`);
  problems.push(`${key}: ${b.spec} differs from baseline v${b.version}${parts.length ? ` — ${parts.join(' · ')}` : ' (whitespace or free text only)'}. Step changes go through a spec amendment (docs/spec-amendments/${key}/), never a direct edit.`);
  return problems;
}

function check() {
  const keys = argv.includes('--all') ? (fs.existsSync(BASE_DIR) ? fs.readdirSync(BASE_DIR) : []) : [opt('--feature')];
  if (!keys[0]) { console.error('check needs --feature <key> or --all'); process.exit(2); }
  const problems = keys.flatMap(checkOne);
  if (problems.length) { for (const p of problems) console.error(p); process.exit(1); }
  console.log(`baselines match: ${keys.map((k) => `${k} v${load(k).version}`).join(', ')}`);
}

function diff() {
  const key = opt('--feature'); const vs = versions(key);
  const to = Number(opt('--to') || vs[vs.length - 1]); const from = Number(opt('--from') || to - 1);
  const a = load(key, from); const b = load(key, to);
  if (!a || !b) { console.error(`${key}: need baselines v${from} and v${to}`); process.exit(2); }
  const d = diffBaselines(a, b);
  console.log(JSON.stringify({ feature: key, from, to, amendment: b.amendment, comparable: d.same.length, ...d }, null, 2));
}

export function score(b, lines) {
  const by = new Map();
  const unknown = new Set();
  const ids = new Set(b.steps.map((s) => s.id));
  for (const l of lines) {
    if (!l.id) continue;
    if (!ids.has(l.id)) { unknown.add(l.id); continue; }
    const k = `${l.id}|${l.surface || 'desktop'}`;
    (by.get(k) || by.set(k, []).get(k)).push(l.result);
  }
  const res = { feature: b.feature, baseline: b.version, specSha256: b.specSha256, total: 0, passed: 0, failed: [], blocked: [], notRun: [], preconditionsFailed: [], observations: [...unknown] };
  for (const s of b.steps) {
    const surf = s.surfaces.map((x) => by.get(`${s.id}|${x}`));
    const missing = s.surfaces.filter((x, i) => !surf[i]);
    const all = surf.flat().filter(Boolean);
    const verdict = missing.length ? 'not_run' : all.every((r) => r === 'pass') ? 'pass' : all.includes('fail') ? 'fail' : 'blocked';
    if (s.kind === 'precondition') { if (verdict !== 'pass') res.preconditionsFailed.push(s.id); continue; }
    res.total++;
    if (verdict === 'pass') res.passed++;
    else if (verdict === 'fail') res.failed.push(s.id);
    else if (verdict === 'blocked') res.blocked.push(s.id);
    else res.notRun.push(`${s.id} (${missing.join('+')})`);
  }
  return res;
}

function scoreCmd() {
  const key = opt('--feature'); const b = load(key, opt('--version'));
  if (!b) { console.error(`${key}: no baseline`); process.exit(2); }
  const raw = fs.existsSync(opt('--steps') || '') ? fs.readFileSync(opt('--steps'), 'utf8') : '';
  const lines = raw.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  console.log(JSON.stringify(score(b, lines), null, 2));
}

function show() {
  const b = load(opt('--feature'), opt('--version'));
  if (!b) { console.error('no baseline'); process.exit(2); }
  console.log(`${b.feature} baseline v${b.version} (${b.spec}, sha ${b.specSha256.slice(0, 12)}, frozen ${b.frozenAt}${b.amendment ? `, amendment ${b.amendment}` : ''})`);
  for (const s of b.steps) console.log(`${s.id.padEnd(8)} ${s.surfaces.join('+').padEnd(15)} ${s.summary}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const run = { freeze, check, diff, score: scoreCmd, show }[cmd];
  if (!run) { console.error('usage: freeze | check | diff | score | show (see the header of this file)'); process.exit(2); }
  run();
}
