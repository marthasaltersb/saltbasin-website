import { Router } from 'express';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';

const router = Router();

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user || user.role !== 'admin') {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return user;
}

// GET /api/lineage/snapshots?entity_type=&entity_id=&limit=30
// Returns the N most recent snapshots for an entity, newest first.
router.get('/snapshots', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { entity_type, entity_id, limit = 30 } = req.query;
    const params = [];
    let q = `SELECT * FROM data_snapshots WHERE 1=1`;
    if (entity_type) { params.push(entity_type); q += ` AND entity_type = $${params.length}`; }
    if (entity_id)   { params.push(entity_id);   q += ` AND entity_id = $${params.length}`; }
    params.push(Math.min(Number(limit) || 30, 200));
    q += ` ORDER BY captured_at DESC LIMIT $${params.length}`;
    const rows = await db.prepare(q).all(...params);
    res.json({ snapshots: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load snapshots' });
  }
});

// GET /api/lineage/snapshots/:id/fields
// Returns every field_lineage row captured in the same millisecond window as the snapshot.
router.get('/snapshots/:id/fields', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const snap = await db.prepare(`SELECT * FROM data_snapshots WHERE id = $1`).get(req.params.id);
    if (!snap) return res.status(404).json({ error: 'Snapshot not found' });
    // Field rows share the same captured_at timestamp (same sync write batch)
    const fields = await db.prepare(`
      SELECT * FROM field_lineage
       WHERE entity_type = $1
         AND entity_id   = $2
         AND captured_at = $3
       ORDER BY field_path ASC
    `).all(snap.entity_type, snap.entity_id, snap.captured_at);
    res.json({ snapshot: snap, fields });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load snapshot fields' });
  }
});

// GET /api/lineage/field?entity_type=&entity_id=&field_path=&limit=50
// Full history for one field path — useful for the "drill into one value" view.
router.get('/field', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { entity_type, entity_id, field_path, limit = 50 } = req.query;
    if (!entity_type || !field_path) {
      return res.status(400).json({ error: 'entity_type and field_path required' });
    }
    const params = [entity_type, field_path];
    let q = `SELECT * FROM field_lineage WHERE entity_type = $1 AND field_path = $2`;
    if (entity_id) { params.push(entity_id); q += ` AND entity_id = $${params.length}`; }
    params.push(Math.min(Number(limit) || 50, 500));
    q += ` ORDER BY captured_at DESC LIMIT $${params.length}`;
    const rows = await db.prepare(q).all(...params);
    res.json({ history: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load field history' });
  }
});

// GET /api/lineage/entities
// Returns the distinct (entity_type, entity_id) pairs that have lineage data — used to
// populate the entity picker in the waterfall panel.
router.get('/entities', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.prepare(`
      SELECT entity_type, entity_id, COUNT(*) AS snapshot_count, MAX(captured_at) AS last_captured
        FROM data_snapshots
       GROUP BY entity_type, entity_id
       ORDER BY last_captured DESC
       LIMIT 100
    `).all();
    res.json({ entities: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load entities' });
  }
});

export default router;
