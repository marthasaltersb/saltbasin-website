#!/usr/bin/env node
// Serves the fictional fixture repository used by the live-release-tracker
// training spec, laid out like raw.githubusercontent.com:
//   http://127.0.0.1:<port>/demo-org/demo-repo/main/docs/release-log/<file>.json
//
//   node scripts/release-tracker-fixture-server.mjs [--port 7300] [--state v1]
//
// Switch the "repository state" while it runs (this is how a later commit is
// simulated, deterministically):   curl -X POST http://127.0.0.1:7300/__use/v2
// Show which state is served:      curl http://127.0.0.1:7300/__state
// Fixtures: docs/training/fixtures/live-release-tracker/pull/<state>/ (fictional data only).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/training/fixtures/live-release-tracker/pull');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const port = Number(opt('--port', 7300));
let state = opt('--state', 'v1');

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname.startsWith('/__use/')) {
    const next = url.pathname.slice('/__use/'.length);
    if (!/^[a-z0-9_-]+$/i.test(next) || !fs.existsSync(path.join(root, next))) { res.writeHead(404).end(`no such state: ${next}\n`); return; }
    state = next; res.writeHead(200).end(`serving ${state}\n`); return;
  }
  if (url.pathname === '/__state') { res.writeHead(200).end(`${state}\n`); return; }
  const m = /^\/demo-org\/demo-repo\/main\/(docs\/release-log\/[a-z.-]+\.json)$/.exec(url.pathname);
  const file = m && path.join(root, state, m[1]);
  if (!file || !fs.existsSync(file)) { res.writeHead(404).end('not found\n'); return; }
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(fs.readFileSync(file));
}).listen(port, '127.0.0.1', () => console.log(`fixture repository on http://127.0.0.1:${port} serving ${state}`));
