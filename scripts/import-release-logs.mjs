#!/usr/bin/env node
// Idempotent importer: files the release-loop outputs under docs/ (release
// logs, test results, triage + reconciliation reports, change + training specs)
// and, optionally, a tracker snapshot (scripts/release-tracker-sync.mjs --out)
// into the release_* tables behind Admin -> Release Intelligence (reachable
// from the World Shell).
//
//   node scripts/import-release-logs.mjs [--root <repo root>]
//   node scripts/import-release-logs.mjs --snapshot snapshot.json --release 2026-10-02-release-intelligence
//
// Re-running is safe: a document whose content hash is unchanged is skipped;
// a changed one replaces only the rows it produced; a reviewer's disposition on
// a failed run survives. Uses DATABASE_URL (same database as the server).
// Every problem is printed and the exit code is non-zero if anything failed;
// nothing is dropped silently.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const known = new Set(['--root', '--snapshot', '--release']);
for (const a of argv) {
  if (a.startsWith('--') && !known.has(a)) { console.error(`Unknown option ${a}`); process.exit(2); }
}
const root = path.resolve(opt('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const snapshotFile = opt('--snapshot');
const releaseKey = opt('--release');
if (snapshotFile && !releaseKey) { console.error('--snapshot needs --release <release key>'); process.exit(2); }

const actor = { id: null, label: 'scripts/import-release-logs.mjs' };
let failed = 0;
try {
  const { importRepository, importSnapshot } = await import('../server/lib/releaseLogImporter.js');
  if (snapshotFile) {
    const snap = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
    const r = await importSnapshot(releaseKey, snap, { actor });
    console.log(`Snapshot -> ${r.releaseKey}:`, JSON.stringify(r.counts));
    for (const w of r.warnings) console.warn(`  warning: ${w}`);
  } else {
    const r = await importRepository(root, { actor });
    for (const d of r.documents) {
      console.log(`${d.status.padEnd(9)} ${d.kind || '-'}  ${d.path}${d.error ? `  ERROR: ${d.error}` : ''}`);
      for (const w of d.warnings || []) console.warn(`            warning: ${w}`);
    }
    for (const n of r.notes) console.warn(`note: ${n}`);
    console.log(`Read ${r.filesRead} file(s); ${r.errors.length} error(s).`);
    failed = r.errors.length;
  }
} catch (e) {
  console.error(`Import failed: ${e.message}`);
  failed = 1;
}
process.exit(failed ? 1 : 0);
