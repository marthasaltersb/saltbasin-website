import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { PASSWORD_POLICY, validatePasswordPolicy } from './passwordPolicyRules.js';
export { PASSWORD_POLICY, validatePasswordPolicy } from './passwordPolicyRules.js';

export async function passwordWasUsed(userId, password, currentHash = null) {
  const hashes = [];
  if (currentHash) hashes.push(currentHash);
  const rows = await db.prepare(`SELECT password_hash FROM user_password_history WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT $2`).all(userId, PASSWORD_POLICY.historyDepth);
  hashes.push(...rows.map((row) => row.password_hash));
  for (const hash of hashes) if (await bcrypt.compare(password, hash)) return true;
  return false;
}

export async function replacePassword(userId, password, { clearMustChange = true } = {}) {
  const current = await db.prepare(`SELECT password_hash FROM users WHERE id=$1`).get(userId);
  if (!current) throw new Error('user not found');
  const validation = validatePasswordPolicy(password);
  if (!validation.valid) return { ok: false, error: 'password_policy_failed', details: validation.errors, policy: validation.policy };
  if (await passwordWasUsed(userId, password, current.password_hash)) return { ok: false, error: 'password_reuse_not_allowed', details: ['Choose a password you have not used previously.'] };
  const hash = await bcrypt.hash(password, 10);
  await db.prepare(`INSERT INTO user_password_history (user_id,password_hash,created_at) VALUES ($1,$2,$3)`).run(userId, current.password_hash, Date.now());
  await db.prepare(`UPDATE users SET password_hash=$1,must_change_password=$2,password_changed_at=$3 WHERE id=$4`).run(hash, clearMustChange ? false : true, Date.now(), userId);
  return { ok: true };
}
