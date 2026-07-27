// Post-build Codex telemetry adapter for Contribution Intelligence.
// Uses observable sandbox execution evidence only; private reasoning is neither
// available nor required. The command is intentionally a safe no-op on hosts
// without Codex logs so ordinary CI and production builds remain portable.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const projectNeedles = new Set([
  projectRoot.toLowerCase(),
  projectRoot.replaceAll('\\', '/').toLowerCase(),
  path.basename(projectRoot).toLowerCase(),
]);
const codexRoot = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const sandboxDir = path.join(codexRoot, '.sandbox');
const outputDir = path.join(projectRoot, '.codex', 'contribution-intelligence');
const outputFile = path.join(outputDir, 'codex-observable-events.json');
const checkpointFile = path.join(outputDir, 'codex-sync-checkpoint.json');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function timestampFrom(line) {
  const match = line.match(/^\[(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2}:\d{2})?/);
  if (!match) return null;
  const value = new Date(`${match[1]}T${match[2]}${match[3] || 'Z'}`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function eventType(line) {
  const text = line.toLowerCase();
  if (/test|npm run build|vite build/.test(text)) return 'TEST_EXECUTION';
  if (/error|failed|failure/.test(text)) return 'ERROR';
  if (/apply_patch|write|createfile|updatefile/.test(text)) return 'FILE_UPDATE';
  if (/success|exit code|command/.test(text)) return 'COMMAND_EXECUTION';
  return 'TOOL_ACTIVITY';
}

function isProjectEvent(line) {
  const lower = line.toLowerCase();
  return [...projectNeedles].some((needle) => lower.includes(needle));
}

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

if (!fs.existsSync(sandboxDir)) {
  console.log(`[contribution:codex] No Codex sandbox logs at ${sandboxDir}; skipped.`);
  process.exit(0);
}

const previous = loadJson(outputFile, { schemaVersion: 1, sourcePlatform: 'CODEX', events: [] });
const byId = new Map((previous.events || []).map((event) => [event.id, event]));
const files = fs.readdirSync(sandboxDir)
  .filter((name) => /^sandbox\..+\.log$/i.test(name))
  .sort();

for (const name of files) {
  const fullPath = path.join(sandboxDir, name);
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = lines[lineNumber];
    if (!line || !isProjectEvent(line)) continue;
    const sourceKey = `${name}:${lineNumber + 1}:${line}`;
    const id = sha256(sourceKey);
    if (byId.has(id)) continue;
    byId.set(id, {
      id,
      sourcePlatform: 'CODEX',
      sourceFile: name,
      sourceLine: lineNumber + 1,
      sourceTimestamp: timestampFrom(line),
      ingestedTimestamp: new Date().toISOString(),
      eventType: eventType(line),
      payloadHash: sha256(line),
      observableEvidence: line,
      evidenceType: 'SYSTEM_LOG',
    });
  }
}

const events = [...byId.values()].sort((a, b) =>
  String(a.sourceTimestamp || '').localeCompare(String(b.sourceTimestamp || ''))
  || a.id.localeCompare(b.id));
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify({
  schemaVersion: 1,
  sourcePlatform: 'CODEX',
  limitation: 'Observable sandbox execution telemetry only; no private reasoning or unsupported session fields are inferred.',
  generatedAt: new Date().toISOString(),
  events,
}, null, 2)}\n`);
fs.writeFileSync(checkpointFile, `${JSON.stringify({
  sourcePlatform: 'CODEX',
  processedAt: new Date().toISOString(),
  sourceFiles: files,
  eventCount: events.length,
  output: path.relative(projectRoot, outputFile),
}, null, 2)}\n`);
console.log(`[contribution:codex] Recorded ${events.length} idempotent observable events from ${files.length} log file(s).`);
