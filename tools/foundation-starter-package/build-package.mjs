#!/usr/bin/env node
// Assembles the Foundation Starter Package zip from the CURRENT repo files, so the copies never drift.
//   node build-package.mjs <out-dir> [--video <walkthrough.mp4>]
// Writes <out-dir>/foundation-starter-package/ and <out-dir>/foundation-starter-package.zip (needs `zip`).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const argv = process.argv.slice(2);
const outDir = argv[0];
if (!outDir || outDir.startsWith('--')) { console.error('usage: build-package.mjs <out-dir> [--video file]'); process.exit(2); }
const video = (() => { const i = argv.indexOf('--video'); return i >= 0 ? argv[i + 1] : null; })();

const root = path.join(path.resolve(outDir), 'foundation-starter-package');
fs.rmSync(root, { recursive: true, force: true });
const copy = (from, to) => {
  const src = path.join(repo, from);
  if (!fs.existsSync(src)) throw new Error(`missing in repo: ${from}`);
  fs.cpSync(src, path.join(root, to), { recursive: true, filter: (p) => !/node_modules|snapshot\.json$|bug-ledger\.json$/.test(p) });
};

copy('tools/foundation-starter-package', '.');
fs.rmSync(path.join(root, 'build-package.mjs'));
copy('tools/release-tracker-kit', 'kit');
copy('docs/changes/scene-instructions.md', 'specs/scene-instructions.md');
copy('docs/changes/foundation-rods-and-audit-history.md', 'specs/foundation-rods-and-audit-history.md');
copy('docs/release-process.md', 'specs/release-process.md');
copy('server/data/releaseLoop/definition.json', 'specs/release-loop-definition.json');
if (video) fs.copyFileSync(video, path.join(root, 'video', path.basename(video)));

const sha = (() => { try { return execFileSync('git', ['-C', repo, 'rev-parse', '--short', 'HEAD']).toString().trim(); } catch { return 'unknown'; } })();
fs.writeFileSync(path.join(root, 'BUILT.txt'), `Built ${new Date().toISOString()} from saltbasin-website commit ${sha}.\n`);

const zip = `${root}.zip`;
fs.rmSync(zip, { force: true });
try {
  execFileSync('zip', ['-qr', path.basename(zip), path.basename(root)], { cwd: path.dirname(root) });
  console.log(`package: ${zip}`);
} catch {
  console.log(`package folder: ${root} (install zip to also get a .zip)`);
}
