import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';

const router = express.Router();

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

function newId() { return `tpl.${crypto.randomUUID().split('-')[0]}`; }

// GET /api/output-templates?output_type=resume
// Returns all templates for a given output type for the current user.
router.get('/', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    const { output_type } = req.query;
    let q = `SELECT * FROM output_templates WHERE 1=1`;
    const params = [];
    if (output_type) { params.push(output_type); q += ` AND output_type = $${params.length}`; }
    if (user) { params.push(user.id); q += ` AND (user_id = $${params.length} OR user_id IS NULL)`; }
    else { q += ` AND user_id IS NULL`; }
    q += ` ORDER BY is_primary DESC, updated_at DESC LIMIT 50`;
    const rows = await db.prepare(q).all(...params);
    res.json({ templates: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

// GET /api/output-templates/primary?output_type=resume
// Returns the primary template for the current user (or global default if not logged in).
router.get('/primary', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    const { output_type = 'resume' } = req.query;

    let row = null;
    if (user) {
      row = await db.prepare(`
        SELECT * FROM output_templates WHERE user_id = $1 AND output_type = $2 AND is_primary = true LIMIT 1
      `).get(user.id, output_type);
    }
    // Fall back to global primary (user_id IS NULL)
    if (!row) {
      row = await db.prepare(`
        SELECT * FROM output_templates WHERE user_id IS NULL AND output_type = $1 AND is_primary = true LIMIT 1
      `).get(output_type);
    }
    res.json({ template: row || null });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/output-templates
router.post('/', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const { output_type, name, config, is_primary } = req.body;
    if (!output_type || !name) return res.status(400).json({ error: 'output_type and name required' });
    const id = newId();
    const now = Date.now();
    if (is_primary) {
      await db.prepare(`UPDATE output_templates SET is_primary = false WHERE user_id = $1 AND output_type = $2`).run(user.id, output_type);
    }
    await db.prepare(`
      INSERT INTO output_templates (id, user_id, output_type, name, is_primary, config, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
    `).run(id, user.id, output_type, name, is_primary ?? false, JSON.stringify(config || {}), now);
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/output-templates/:id
router.put('/:id', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const { name, config, is_primary } = req.body;
    const row = await db.prepare(`SELECT * FROM output_templates WHERE id = $1 AND user_id = $2`).get(req.params.id, user.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (is_primary) {
      await db.prepare(`UPDATE output_templates SET is_primary = false WHERE user_id = $1 AND output_type = $2`).run(user.id, row.output_type);
    }
    await db.prepare(`
      UPDATE output_templates SET name = COALESCE($1, name), config = COALESCE($2, config), is_primary = $3, updated_at = $4 WHERE id = $5
    `).run(name || null, config ? JSON.stringify(config) : null, is_primary ?? row.is_primary, Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/output-templates/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    await db.prepare(`DELETE FROM output_templates WHERE id = $1 AND user_id = $2`).run(req.params.id, user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
