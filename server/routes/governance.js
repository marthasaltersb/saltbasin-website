import { Router } from 'express';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';

const router = Router();

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  if (user.role !== 'admin') { res.status(403).json({ error: 'Admin only' }); return null; }
  return user;
}

// GET /api/governance/pending — list pending standard proposals awaiting review
router.get('/pending', async (req, res) => {
  try {
    await requireAdmin(req, res);
    // requireAdmin already sent the error response if it returns null,
    // but we still need to guard. Re-read user for the check.
    const user = await getUserFromCookie(req);
    if (!user || user.role !== 'admin') return;

    const rows = await db.prepare(`
      SELECT ps.*,
             u.display_name AS proposed_by_name, u.email AS proposed_by_email,
             gs.name AS base_standard_name, gs.domain AS base_standard_domain
      FROM pending_standards ps
      LEFT JOIN users u ON u.id = ps.proposed_by
      LEFT JOIN global_standards gs ON gs.id = ps.base_standard_id
      WHERE ps.review_status = 'pending'
      ORDER BY ps.created_at DESC
    `).all();
    res.json({ pending: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load pending standards' });
  }
});

// GET /api/governance/overrides — user overrides awaiting governance review
router.get('/overrides', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const rows = await db.prepare(`
      SELECT so.*,
             u.display_name AS user_name, u.email AS user_email,
             gs.name AS standard_name, gs.domain
      FROM standard_overrides so
      LEFT JOIN users u ON u.id = so.user_id
      LEFT JOIN global_standards gs ON gs.id = so.standard_id
      WHERE so.escalated_to_governance = true
      ORDER BY so.created_at DESC
    `).all();
    res.json({ overrides: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load overrides' });
  }
});

// POST /api/governance/pending — submit a new proposed standard
router.post('/pending', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { base_standard_id, name, domain, category, definition, rationale } = req.body;
    if (!name || !domain) return res.status(400).json({ error: 'name and domain required' });
    const id = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    await db.prepare(`
      INSERT INTO pending_standards
        (id, base_standard_id, proposed_name, proposed_domain, proposed_category,
         proposed_definition, rationale, proposed_by, review_status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10)
    `).run(id, base_standard_id || null, name, domain, category || null, definition || null, rationale || null, user.id, now, now);
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
});

// POST /api/governance/pending/:id/approve — merge into global_standards
router.post('/pending/:id/approve', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const pending = await db.prepare('SELECT * FROM pending_standards WHERE id=$1').get(req.params.id);
    if (!pending) return res.status(404).json({ error: 'Not found' });

    const now = Date.now();
    if (pending.base_standard_id) {
      // Update existing standard
      await db.prepare(`
        UPDATE global_standards SET
          name=$1, domain=$2, category=$3, definition=$4,
          status='active', updated_at=$5
        WHERE id=$6
      `).run(pending.proposed_name, pending.proposed_domain, pending.proposed_category, pending.proposed_definition, now, pending.base_standard_id);
    } else {
      // Create new standard
      const newId = `std_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await db.prepare(`
        INSERT INTO global_standards (id, name, domain, category, definition, source_type, status, created_by, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,'governance','active',$6,$7,$8)
      `).run(newId, pending.proposed_name, pending.proposed_domain, pending.proposed_category, pending.proposed_definition, user.id, now, now);
    }

    await db.prepare(`
      UPDATE pending_standards SET review_status='approved', reviewed_by=$1, reviewed_at=$2 WHERE id=$3
    `).run(user.id, now, req.params.id);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve' });
  }
});

// POST /api/governance/pending/:id/reject
router.post('/pending/:id/reject', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { reason } = req.body;
    await db.prepare(`
      UPDATE pending_standards SET review_status='rejected', rejection_reason=$1, reviewed_by=$2, reviewed_at=$3 WHERE id=$4
    `).run(reason || null, user.id, Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject' });
  }
});

export default router;
