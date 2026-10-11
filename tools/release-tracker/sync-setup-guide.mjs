// Keeps the page copy embedded in SETUP-FOR-CLAUDE.md identical to index.html.
//   node tools/release-tracker/sync-setup-guide.mjs          check (exit 1 if they differ)
//   node tools/release-tracker/sync-setup-guide.mjs --write  regenerate the embedded copy (and the world engine block of index.html)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkOrWrite as syncWorldEngine } from './sync-world-engine.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
// The page inlines the shared Tracker World engine; make sure that block is current before comparing the guide with the page.
const eng = syncWorldEngine(process.argv.includes('--write'));
console.log(eng.message);
if (!eng.ok) process.exit(eng.code);
const guidePath = path.join(dir, 'SETUP-FOR-CLAUDE.md');
const page = fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace(/\n+$/, '');
const guide = fs.readFileSync(guidePath, 'utf8');
const re = /(```html\n)([\s\S]*?)(\n```)/;
const m = guide.match(re);
if (!m) { console.error('No ```html block found in SETUP-FOR-CLAUDE.md'); process.exit(2); }
if (m[2] === page) { console.log('SETUP-FOR-CLAUDE.md embedded page matches index.html'); process.exit(0); }
if (process.argv.includes('--write')) {
  fs.writeFileSync(guidePath, guide.replace(re, (_, a, _b, c) => a + page + c));
  console.log('Regenerated embedded page in SETUP-FOR-CLAUDE.md');
  process.exit(0);
}
console.error('SETUP-FOR-CLAUDE.md embedded page differs from index.html. Run with --write.');
process.exit(1);
