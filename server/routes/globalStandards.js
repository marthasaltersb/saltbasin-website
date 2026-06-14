import { Router } from 'express';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';

const router = Router();

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') { res.status(403).json({ error: 'Admin only' }); return null; }
  return user;
}

// GET /api/standards — list all (public: published only; admin: all)
router.get('/', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    const isAdmin = user?.role === 'admin';
    const rows = await db.prepare(`
      SELECT * FROM global_standards
      ${isAdmin ? '' : "WHERE status = 'active'"}
      ORDER BY domain, name
    `).all();
    res.json({ standards: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load standards' });
  }
});

// GET /api/standards/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await db.prepare('SELECT * FROM global_standards WHERE id=$1').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ standard: row });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST /api/standards — admin create
router.post('/', async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;
    const { name, domain, category, definition, source_type, status = 'active', tags } = req.body;
    if (!name || !domain) return res.status(400).json({ error: 'name and domain required' });
    const id = `std_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    await db.prepare(`
      INSERT INTO global_standards (id, name, domain, category, definition, source_type, status, tags, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `).run(id, name, domain, category || null, definition || null, source_type || 'platform', status, tags ? JSON.stringify(tags) : null, user.id, now, now);
    res.json({ standard: { id, name, domain, category, definition, status } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create' });
  }
});

// PUT /api/standards/:id — admin update
router.put('/:id', async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;
    const { name, domain, category, definition, source_type, status, tags } = req.body;
    const now = Date.now();
    await db.prepare(`
      UPDATE global_standards SET
        name=$1, domain=$2, category=$3, definition=$4,
        source_type=$5, status=$6, tags=$7, updated_at=$8
      WHERE id=$9
    `).run(name, domain, category || null, definition || null, source_type || 'platform', status || 'active', tags ? JSON.stringify(tags) : null, now, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE /api/standards/:id — admin only (soft delete via status=archived)
router.delete('/:id', async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;
    await db.prepare(`UPDATE global_standards SET status='archived', updated_at=$1 WHERE id=$2`).run(Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to archive' });
  }
});

// POST /api/standards/:id/publish — mark as published (pushes to /resources/standards)
router.post('/:id/publish', async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;
    await db.prepare(`UPDATE global_standards SET status='published', updated_at=$1 WHERE id=$2`).run(Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to publish' });
  }
});

// GET /api/standards/public/list — public resources/standards page feed
router.get('/public/list', async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT id, name, domain, category, definition, status, updated_at
      FROM global_standards WHERE status='published'
      ORDER BY domain, name
    `).all();
    res.json({ standards: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
