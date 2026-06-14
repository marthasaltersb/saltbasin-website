import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';

const router = Router();

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user || user.role !== 'admin') { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

async function getUser(req) {
  try { return await getUserFromCookie(req); } catch { return null; }
}

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + (process.env.SESSION_SECRET || '')).digest('hex').slice(0, 16);
}

function getReferrerDomain(ref) {
  if (!ref) return null;
  try { return new URL(ref).hostname; } catch { return null; }
}

// POST /api/analytics/events — ingest a tracking event from the frontend
router.post('/events', async (req, res) => {
  try {
    const user = await getUser(req);
    const {
      event_type, app_id, object_type, object_id,
      member_user_id, session_id, metadata,
    } = req.body;

    if (!event_type) return res.status(400).json({ error: 'event_type required' });

    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0];
    const referrer = req.headers['referer'] || req.headers['referrer'];

    await db.prepare(`
      INSERT INTO analytics_events
        (event_type, app_id, object_type, object_id, member_user_id, visitor_user_id, session_id, ip_hash, referrer_domain, metadata, occurred_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `).run(
      event_type,
      app_id || null,
      object_type || null,
      object_id || null,
      member_user_id ? Number(member_user_id) : null,
      user?.id || null,
      session_id || null,
      hashIp(ip),
      getReferrerDomain(referrer),
      JSON.stringify(metadata || {}),
      Date.now()
    );

    res.json({ ok: true });
  } catch (e) {
    console.error('[analytics] event ingest error:', e.message);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// GET /api/analytics/admin/summary — platform-wide summary (admin only)
router.get('/admin/summary', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const { days = 30 } = req.query;
    const since = Date.now() - Number(days) * 24 * 60 * 60 * 1000;

    const byType = await db.prepare(`
      SELECT event_type, COUNT(*)::int AS count
      FROM analytics_events
      WHERE occurred_at >= $1
      GROUP BY event_type
      ORDER BY count DESC
    `).all(since);

    const byMember = await db.prepare(`
      SELECT ae.member_user_id, u.display_name, u.email,
             COUNT(*)::int AS events,
             COUNT(*) FILTER (WHERE ae.event_type = 'visit')::int AS visits,
             COUNT(*) FILTER (WHERE ae.event_type = 'pdf-download')::int AS downloads
      FROM analytics_events ae
      LEFT JOIN users u ON u.id = ae.member_user_id
      WHERE ae.occurred_at >= $1 AND ae.member_user_id IS NOT NULL
      GROUP BY ae.member_user_id, u.display_name, u.email
      ORDER BY events DESC
      LIMIT 50
    `).all(since);

    const downloads = await db.prepare(`
      SELECT ae.*, u.display_name AS visitor_name
      FROM analytics_events ae
      LEFT JOIN users u ON u.id = ae.visitor_user_id
      WHERE ae.event_type = 'pdf-download' AND ae.occurred_at >= $1
      ORDER BY ae.occurred_at DESC
      LIMIT 100
    `).all(since);

    const dailyTrend = await db.prepare(`
      SELECT TO_CHAR(TO_TIMESTAMP(occurred_at / 1000), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS events
      FROM analytics_events
      WHERE occurred_at >= $1
      GROUP BY day
      ORDER BY day DESC
      LIMIT 30
    `).all(since);

    res.json({ byType, byMember, downloads, dailyTrend, days: Number(days) });
  } catch (e) {
    console.error('[analytics] admin summary error:', e.message);
    res.status(500).json({ error: 'Failed to load summary' });
  }
});

// GET /api/analytics/admin/member/:userId — per-member detail (admin)
router.get('/admin/member/:userId', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const memberId = Number(req.params.userId);
    const { days = 30 } = req.query;
    const since = Date.now() - Number(days) * 24 * 60 * 60 * 1000;

    const events = await db.prepare(`
      SELECT * FROM analytics_events
      WHERE member_user_id = $1 AND occurred_at >= $2
      ORDER BY occurred_at DESC LIMIT 500
    `).all(memberId, since);

    const summary = await db.prepare(`
      SELECT event_type, COUNT(*)::int AS count
      FROM analytics_events
      WHERE member_user_id = $1 AND occurred_at >= $2
      GROUP BY event_type ORDER BY count DESC
    `).all(memberId, since);

    res.json({ events, summary });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load member analytics' });
  }
});

// GET /api/analytics/member/summary — member's own analytics
router.get('/member/summary', async (req, res) => {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { days = 30 } = req.query;
    const since = Date.now() - Number(days) * 24 * 60 * 60 * 1000;

    const summary = await db.prepare(`
      SELECT event_type, COUNT(*)::int AS count
      FROM analytics_events
      WHERE member_user_id = $1 AND occurred_at >= $2
      GROUP BY event_type ORDER BY count DESC
    `).all(user.id, since);

    const downloads = await db.prepare(`
      SELECT occurred_at, metadata
      FROM analytics_events
      WHERE member_user_id = $1 AND event_type = 'pdf-download' AND occurred_at >= $2
      ORDER BY occurred_at DESC LIMIT 50
    `).all(user.id, since);

    const dailyTrend = await db.prepare(`
      SELECT TO_CHAR(TO_TIMESTAMP(occurred_at / 1000), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS events
      FROM analytics_events
      WHERE member_user_id = $1 AND occurred_at >= $2
      GROUP BY day ORDER BY day DESC LIMIT 30
    `).all(user.id, since);

    res.json({ summary, downloads, dailyTrend, days: Number(days) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// POST /api/analytics/member/resume-download — record download request with reason
router.post('/member/resume-download', async (req, res) => {
  const visitor = await getUserFromCookie(req);
  if (!visitor) return res.status(401).json({ error: 'Must be a member to download' });

  try {
    const { member_user_id, reason, slug } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'Reason is required' });

    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0];

    await db.prepare(`
      INSERT INTO analytics_events
        (event_type, app_id, object_type, object_id, member_user_id, visitor_user_id, ip_hash, metadata, occurred_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `).run(
      'pdf-download',
      'app.resume',
      'resume',
      slug || null,
      member_user_id ? Number(member_user_id) : null,
      visitor.id,
      hashIp(ip),
      JSON.stringify({ reason: reason.trim(), visitor_email: visitor.email }),
      Date.now()
    );

    // Alert the resume owner by email (non-blocking)
    if (member_user_id) {
      const owner = await db.prepare(`SELECT email, display_name FROM users WHERE id = $1`).get(Number(member_user_id));
      if (owner) {
        try {
          const { dispatchRaw } = await import('../lib/email.js');
          if (dispatchRaw) await dispatchRaw({
            to: owner.email,
            subject: `[Salt Basin] Resume downloaded by a member`,
            text: `Someone downloaded your resume.\n\nReason: ${reason.trim()}\nDownloader: ${visitor.email}\n\nView your analytics at /member`,
          });
        } catch {}
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[analytics] resume-download error:', e.message);
    res.status(500).json({ error: 'Failed to record download' });
  }
});

export default router;
