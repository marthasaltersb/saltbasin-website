#!/usr/bin/env node
// Serves the tracker page for local checking.   node tools/release-tracker/serve.mjs <snapshot.json> <port> [pidFile]
// Open http://127.0.0.1:<port>/preview.html  (add ?theme=dark or ?theme=light to force a theme).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [snap, portArg, pidFile] = process.argv.slice(2);
if (!snap || !portArg) { console.error('usage: serve.mjs <snapshot.json> <port> [pidFile]'); process.exit(2); }
if (!fs.existsSync(snap)) { console.error(`snapshot not found: ${snap}`); process.exit(2); }
const here = path.dirname(fileURLToPath(import.meta.url));
const files = { '/index.html': path.join(here, 'index.html'), '/preview.html': path.join(here, 'preview.html'), '/snapshot.json': snap };
http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const f = files[new URL(req.url, 'http://x').pathname];
  if (!f) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': f.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(fs.readFileSync(f));
}).listen(Number(portArg), '127.0.0.1', () => {
  if (pidFile) fs.writeFileSync(pidFile, String(process.pid));
  console.log(`tracker preview on http://127.0.0.1:${portArg}/preview.html`);
});
