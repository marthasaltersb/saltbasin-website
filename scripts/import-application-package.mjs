// Files a tailored application package (server/data/applicationPackages/*.json,
// produced by scripts/extract-application-package.py) into the signed-in
// member's Resume Output History. Re-running is safe: unchanged outputs are
// skipped, changed ones become new draft versions in the same lineage.
//
// This never approves anything — open My Resume → Resume Output History and
// click "Approve for QR" on each version you want a private QR link for.
//
// Usage: node scripts/import-application-package.mjs server/data/applicationPackages/acme-2026-09.json [--link-opportunity]
//
// --link-opportunity  also create (or reuse) a placeholder tracked opportunity
//   in Career Placement Agents from the package JSON's own "company" and "role"
//   fields (nothing is hardcoded here) and link every imported output to it,
//   so the package is reachable from World Shell -> Career Placement Agents.
//   Refused up front, before importing, if the JSON has no "role".
// Requires in .env: ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD (or SB_EMAIL +
// SB_PASSWORD). PUBLIC_BASE_URL selects the server (default: local dev API).
import 'dotenv/config';
import fs from 'node:fs';

const args = process.argv.slice(2);
const linkOpportunity = args.includes('--link-opportunity');
const unknown = args.filter((a) => a.startsWith('--') && a !== '--link-opportunity');
if (unknown.length) throw new Error(`Unknown option(s): ${unknown.join(', ')}`);
const pkgPath = args.find((a) => !a.startsWith('--'));
if (!pkgPath) throw new Error('Usage: node scripts/import-application-package.mjs <package.json> [--link-opportunity]');

const BASE = (process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
const EMAIL = process.env.SB_EMAIL || process.env.ADMIN_EMAIL;
const PASS = process.env.SB_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
if (!EMAIL || !PASS) throw new Error('Set ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD (or SB_EMAIL + SB_PASSWORD) in .env');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const login = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASS }),
});
if (!login.ok) throw new Error(`login failed: ${login.status} ${await login.text()}`);
const cookie = login.headers.get('set-cookie').split(';')[0];

const res = await fetch(`${BASE}/api/resume-outputs/import-package`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookie },
  body: JSON.stringify({ package: pkg, linkOpportunity }),
});
const body = await res.json().catch(() => ({}));
if (!res.ok) throw new Error(`import failed: ${res.status} ${body.error || ''}`);

for (const r of body.results) console.log(`${r.variant.padEnd(22)} #${r.id}  ${r.status}`);
if (body.opportunity) {
  console.log(`\nOpportunity #${body.opportunity.id} ${body.opportunity.created ? 'created as a placeholder' : 'already existed'}; ${body.results.length} output(s) linked.`);
}
console.log('\nNext: My Resume → Resume Output History → "Approve for QR" on each version to share.');
