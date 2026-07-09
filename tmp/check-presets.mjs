import 'dotenv/config';
import { db } from '../server/db.js';
import fs from 'node:fs';

let out = '';
const rows = await db.prepare(
  `SELECT u.id, u.email, u.role, mjs.data
     FROM users u
     LEFT JOIN member_json_store mjs ON mjs.user_id = u.id AND mjs.key = 'resume_presets'
    WHERE u.role = 'admin' OR mjs.data IS NOT NULL`
).all();
for (const r of rows) {
  const presets = r.data ? (JSON.parse(r.data).presets || []) : null;
  out += `user=${r.id} email=${r.email} role=${r.role}\n`;
  if (!presets) { out += '  NO PRESETS ROW\n'; continue; }
  for (const p of presets) {
    out += `  preset id=${p.id} name="${p.name}" primary=${!!p.primaryResume} layout=${p.layout}\n`;
  }
}
const prof = await db.prepare(`SELECT user_id, slug FROM member_profiles`).all();
out += 'member_profiles slugs: ' + (prof.map((p) => `${p.user_id}:${p.slug}`).join(', ') || '(none)') + '\n';
fs.writeFileSync('tmp/check-presets-out.txt', out);
process.exit(0);
