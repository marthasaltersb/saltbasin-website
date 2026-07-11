// One-off cleanup: removes the "Smart Graphics Test" HERQ output record
// created during smart-graphics-blocks verification (no delete endpoint
// exists yet for unified_outputs, so this runs directly against the DB).
import { db } from '../server/db.js';

const result = await db.prepare(
  `DELETE FROM unified_outputs WHERE app_id = 'app.herq' AND title = $1`
).run('Smart Graphics Test');

console.log(`Deleted ${result.changes} row(s).`);
process.exit(0);
