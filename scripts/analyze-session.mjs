#!/usr/bin/env node
// After-session analysis (2026-10-09). Reads a Claude Code transcript (plus its
// subagents) and prints METRICS and a mapping summary. It never prints, stores
// or uploads transcript text.
//
//   node scripts/analyze-session.mjs <transcript.jsonl | session-id> [--dir <projects folder>]
//        [--json] [--import] [--prices <file.json>]
//   node scripts/analyze-session.mjs            (newest session in the default folder)
//   node scripts/analyze-session.mjs --hook     (SessionEnd hook: JSON on stdin, never blocks)
//
// --import files the result in the platform database (needs DATABASE_URL, the
// same one the server uses) so it appears on World Shell -> Journeys -> Sessions.
// Without it nothing is written anywhere.
//
// Hook mode ALWAYS exits 0 so it can never block a session ending. If the
// import fails, the failure is appended to server/data/sessionMapping/hook-failures.jsonl
// (git-ignored); the Sessions screen's "Scan server transcripts" files it as a
// capture failure that a reviewer must dispose. Nothing is dropped silently.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeSessionFile, listSessionFiles, projectFolderFor } from '../server/lib/sessionAnalysis.js';
import { DEFAULT_RULES, priceSession } from '../server/lib/sessionMappingConfig.js';
import { proposeMappings } from '../server/lib/sessionMappingRules.js';

// Importing the database module prints Postgres "already exists, skipping" notices; drop only those.
const realLog = console.log;
console.log = (...a) => { if (a.length === 1 && a[0] && typeof a[0] === 'object' && a[0].severity === 'NOTICE') return; realLog(...a); };

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const hook = flag('--hook');
const quiet = flag('--quiet') || hook;
const positional = argv.filter((a, i) => !a.startsWith('--') && !['--dir', '--prices'].includes(argv[i - 1]));

const FAILURE_LOG = path.join(process.cwd(), 'server', 'data', 'sessionMapping', 'hook-failures.jsonl');

function logFailure(ref, error) {
  const msg = `analyze-session failed${ref ? ` (${ref})` : ''}: ${error?.message || error}`;
  console.error(msg);
  try {
    fs.mkdirSync(path.dirname(FAILURE_LOG), { recursive: true });
    fs.appendFileSync(FAILURE_LOG, JSON.stringify({ at: Date.now(), ref: ref || null, error: String(error?.message || error) }) + '\n');
  } catch (e) {
    console.error(`could not write ${FAILURE_LOG}: ${e.message}`);
  }
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function resolveSessionFile(arg, dirOpt) {
  if (arg && fs.existsSync(arg) && fs.statSync(arg).isFile()) return arg;
  const dir = dirOpt || path.join(os.homedir(), '.claude', 'projects', projectFolderFor(process.cwd()));
  if (arg) {
    const direct = path.join(dir, arg.endsWith('.jsonl') ? arg : `${arg}.jsonl`);
    if (fs.existsSync(direct)) return direct;
    throw new Error(`No transcript found for "${arg}"`);
  }
  const files = listSessionFiles(dir).map((f) => ({ f, t: fs.statSync(f).mtimeMs })).sort((a, b) => b.t - a.t);
  if (!files.length) throw new Error(`No session transcripts in ${dir}`);
  return files[0].f;
}

const fmt = (v) => Number(v).toLocaleString('en-US');
const pct = (r) => (r == null ? 'not recorded' : `${(r * 100).toFixed(1)}%`);

function printSummary(rec, rules, proposals) {
  const spend = priceSession(rules, rec.byModel);
  const L = [];
  L.push(`Session ${rec.sourceKey}`);
  L.push(`  Branch: ${rec.gitBranch || 'not recorded'}`);
  L.push(`  Started: ${rec.startedAt ? new Date(rec.startedAt).toISOString() : 'not recorded'}   Ended: ${rec.endedAt ? new Date(rec.endedAt).toISOString() : 'not recorded'}`);
  L.push(`  Time (inferred from timestamps): elapsed ${rec.elapsedMinutes ?? 'not recorded'} min, active ${rec.activeMinutes} min (idle gaps over ${rec.idleCapMinutes} min excluded)`);
  L.push(`  Messages (usage counted once per message id): ${fmt(rec.messages)}`);
  L.push(`  Tokens: input ${fmt(rec.tokens.input)}, cache-write ${fmt(rec.tokens.cacheWrite)}, cache-read ${fmt(rec.tokens.cacheRead)}, output ${fmt(rec.tokens.output)}`);
  L.push(`  Cache-hit ratio: ${pct(rec.cacheHitRatio)}`);
  L.push(`  Spend (${rules.currency}): ${spend.total.toFixed(4)}${spend.unpriced.length ? `  (NOT PRICED: ${spend.unpriced.join(', ')})` : ''}`);
  L.push(`  Agents: ${rec.agents.length}`);
  for (const a of rec.agents) {
    const total = a.tokens.input + a.tokens.cacheWrite + a.tokens.cacheRead + a.tokens.output;
    L.push(`    - ${a.label}: ${fmt(a.messages)} messages, ${fmt(total)} tokens`);
  }
  const comp = rec.limitEvents.filter((e) => e.kind === 'compaction').length;
  L.push(`  Limit events: ${rec.limitEvents.length - comp} usage/rate-limit, ${comp} compaction`);
  if (rec.badLines) L.push(`  Unreadable lines skipped: ${rec.badLines}`);
  L.push(`Mapping proposals: ${proposals.length}`);
  for (const p of proposals) L.push(`  [${p.area}] ${p.targetPath} :: ${p.title}`);
  console.log(L.join('\n'));
}

let hookTarget = null;
async function main() {
  let target = positional[0] || null;
  if (hook) {
    const raw = await readStdin();
    let payload = null;
    try { payload = raw.trim() ? JSON.parse(raw) : null; } catch (e) { throw new Error(`hook input was not JSON: ${e.message}`); }
    target = payload?.transcript_path || payload?.session_id || null;
    hookTarget = target;
    if (!target) throw new Error('hook input carried no transcript_path or session_id');
  }
  let rules = DEFAULT_RULES;
  const pricesFile = opt('--prices');
  if (pricesFile) rules = { ...DEFAULT_RULES, ...JSON.parse(fs.readFileSync(pricesFile, 'utf8')) };

  const file = resolveSessionFile(target, opt('--dir'));
  const rec = analyzeSessionFile(file, { idleCapMinutes: rules.idleCapMinutes });
  if (rec.messages === 0) throw new Error(`${path.basename(file)} has no assistant messages with token usage`);

  if (flag('--import') || hook) {
    const svc = await import('../server/lib/sessionMapping.js');
    const cfg = await import('../server/lib/sessionMappingConfig.js');
    rules = (await cfg.loadRules()).rules;
    const saved = await svc.saveAnalysis(rec, { actor: hook ? 'SessionEnd hook' : 'analyze-session script' });
    if (!quiet) console.log(`Filed as session #${saved.id} (${saved.created ? 'new' : 'updated'}); ${saved.open} mapping proposal(s) in the queue.`);
  }
  const proposals = proposeMappings(rec, rules);
  if (flag('--json')) console.log(JSON.stringify({ analysis: rec, proposals }, null, 2));
  else if (!quiet) printSummary(rec, rules, proposals);
}

try {
  await main();
  process.exit(0);
} catch (error) {
  if (hook) {
    logFailure(hookTarget, error);
    process.exit(0); // never block a session ending
  }
  console.error(`analyze-session: ${error.message}`);
  process.exit(1);
}
