// Page view event beacon.
// POST /api/events/page-view  { memberSlug, pageSlug, referrer }
// Called from the browser when a public profile page loads. No auth required.
// IP is hashed (SHA-256 + salt) so no raw PII is stored.

import { Router } from 'express';
import { db } from '../db.js';
import { hashIp } from '../lib/audit.js';

const router = Router();

router.post('/page-view', async (req, res) => {
  try {
    const { memberSlug, pageSlug, referrer } = req.body || {};
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || null;
    await db.prepare(`
      INSERT INTO page_events (member_slug, page_slug, referrer, user_agent, ip_hash)
      VALUES ($1, $2, $3, $4, $5)
    `).run(
      memberSlug || null,
      pageSlug   || null,
      referrer   || null,
      req.headers['user-agent'] || null,
      hashIp(ip),
    );
  } catch (e) {
    // Never let a failed beacon block the response
    console.warn('[events] page-view insert failed:', e.message);
  }
  res.json({ ok: true });
});

export default router;
