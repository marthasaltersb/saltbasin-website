#!/usr/bin/env node
// Serves the tracker page and a snapshot locally.   node serve.mjs <snapshot.json> [port]
// Open http://127.0.0.1:<port>/  (add ?theme=dark or ?theme=light to force a theme).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [snap, portArg = '4173'] = process.argv.slice(2);
if (!snap) { console.error('usage: serve.mjs <snapshot.json> [port]'); process.exit(2); }
const here = path.dirname(fileURLToPath(import.meta.url));
const files = { '/': path.join(here, 'index.html'), '/index.html': path.join(here, 'index.html'), '/snapshot.json': path.resolve(snap) };
http.createServer((req, res) => {
  const f = files[new URL(req.url, 'http://x').pathname];
  if (!f || !fs.existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': f.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(fs.readFileSync(f));
}).listen(Number(portArg), '127.0.0.1', () => console.log(`release tracker on http://127.0.0.1:${portArg}/`));
