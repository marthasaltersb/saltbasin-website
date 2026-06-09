// Audit log helper — call audit() from any route to record a write event.
// Failures are swallowed so a broken audit write never blocks the real action.

import { db } from '../db.js';
import crypto from 'node:crypto';

/**
 * @param {object} opts
 * @param {import('express').Request} opts.req   — for IP + user-agent
 * @param {object|null}  opts.actor              — req.user (has id, role, email) or null
 * @param {string}       opts.action             — e.g. 'login', 'draft.save', 'section.add'
 * @param {string}       [opts.entityType]       — e.g. 'member_site', 'member_config', 'user'
 * @param {string}       [opts.entityId]         — stringified PK
 * @param {string}       [opts.summary]          — human-readable one-liner
 * @param {object}       [opts.diff]             — { before, after } — heavy; only for config/site saves
 */
export async function audit({ req, actor, action, entityType, entityId, summary, diff }) {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    const ua = req?.headers?.['user-agent'] || null;
    await db.prepare(`
      INSERT INTO audit_log
        (actor_id, actor_email, actor_role, action, entity_type, entity_id, summary, diff, ip, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `).run(
      actor?.id    || null,
      actor?.email || null,
      actor?.role  || null,
      action,
      entityType   || null,
      entityId != null ? String(entityId) : null,
      summary      || null,
      diff ? JSON.stringify(diff) : null,
      ip,
      ua,
    );
  } catch (e) {
    console.warn('[audit] write failed:', e.message);
  }
}

// Hash an IP address for privacy-preserving analytics storage.
export function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'sb')).digest('hex').slice(0, 16);
}
