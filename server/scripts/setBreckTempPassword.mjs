// One-off, manually-run (2026-07-28) — sets a known temporary password for
// Breck Golden's converted member account (user 17) so Betsy can log in
// through the real UI login form and test as him directly. His original
// lead password_hash (reused verbatim at conversion) is overwritten and not
// recoverable — this is a local/dev-testing convenience, not something to
// run against a real production account without the member's consent.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';

const TEMP_PASSWORD = 'BreckTest2026!';

async function main() {
  const user = await db.prepare(`SELECT id, email FROM users WHERE id=17`).get();
  if (!user) throw new Error('User 17 not found — did the conversion run?');
  const hash = await bcrypt.hash(TEMP_PASSWORD, 10);
  await db.prepare(`UPDATE users SET password_hash=$1 WHERE id=$2`).run(hash, 17);
  console.log(`[set-breck-password] user ${user.id} (${user.email}) password set to: ${TEMP_PASSWORD}`);
  process.exit(0);
}

main().catch((e) => { console.error('[set-breck-password] failed:', e); process.exit(1); });
