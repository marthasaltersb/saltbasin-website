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

// GET /api/finbridgeco/configs
router.get('/configs', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.prepare(`SELECT * FROM finbridgeco_configs ORDER BY config_key ASC`).all();
    res.json({ configs: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load configs' });
  }
});

// POST /api/finbridgeco/configs
router.post('/configs', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { config_key, config_value, description } = req.body;
    if (!config_key) return res.status(400).json({ error: 'config_key required' });
    const id = `fbc.${crypto.randomUUID().split('-')[0]}`;
    await db.prepare(`
      INSERT INTO finbridgeco_configs (id, config_key, config_value, description, updated_by, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (id) DO NOTHING
    `).run(id, config_key, JSON.stringify(config_value ?? {}), description || null, user.id, Date.now());
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create config' });
  }
});

// PUT /api/finbridgeco/configs/:id
router.put('/configs/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { config_key, config_value, description } = req.body;
    await db.prepare(`
      UPDATE finbridgeco_configs SET config_key=$1, config_value=$2, description=$3, updated_by=$4, updated_at=$5 WHERE id=$6
    `).run(config_key, JSON.stringify(config_value ?? {}), description || null, user.id, Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// DELETE /api/finbridgeco/configs/:id
router.delete('/configs/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    await db.prepare(`DELETE FROM finbridgeco_configs WHERE id=$1`).run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

// GET /api/finbridgeco/status — license count summary
router.get('/status', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const licenses = await db.prepare(`
      SELECT pl.*, u.email, u.display_name, o.name AS org_name
      FROM product_licenses pl
      JOIN users u ON u.id = pl.user_id
      LEFT JOIN organization_profiles o ON o.id = pl.org_id
      WHERE pl.product_id = 'finbridgeco' AND pl.is_active = true
      ORDER BY pl.granted_at DESC
    `).all();
    res.json({ licenses, total: licenses.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load status' });
  }
});

export default router;
