import express from 'express';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';

const router = express.Router();

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

// POST /api/field-audit
// Body: { sectionId, fieldKey, before, after }
router.post('/', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { sectionId, fieldKey, before, after } = req.body || {};
  if (!sectionId || !fieldKey) return res.status(400).json({ error: 'sectionId and fieldKey required' });

  try {
    await db.prepare(
      `INSERT INTO field_audit_log (user_id, section_id, field_key, before_value, after_value)
       VALUES ($1, $2, $3, $4, $5)`
    ).run(user.id, sectionId, fieldKey, before != null ? String(before) : null, after != null ? String(after) : null);
    res.json({ ok: true });
  } catch (e) {
    console.error('[field-audit] insert error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/field-audit?sectionId=&fieldKey=
router.get('/', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { sectionId, fieldKey, limit = 50 } = req.query;
  if (!sectionId) return res.status(400).json({ error: 'sectionId required' });

  try {
    let rows;
    if (fieldKey) {
      rows = await db.prepare(
        `SELECT l.*, u.email FROM field_audit_log l
         LEFT JOIN users u ON u.id = l.user_id
         WHERE l.section_id = $1 AND l.field_key = $2
         ORDER BY l.created_at DESC LIMIT $3`
      ).all(sectionId, fieldKey, Number(limit));
    } else {
      rows = await db.prepare(
        `SELECT l.*, u.email FROM field_audit_log l
         LEFT JOIN users u ON u.id = l.user_id
         WHERE l.section_id = $1
         ORDER BY l.created_at DESC LIMIT $2`
      ).all(sectionId, Number(limit));
    }
    res.json({ rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
