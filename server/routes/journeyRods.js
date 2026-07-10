import { Router } from 'express';
import { db } from '../db.js';
import { requireUser, requireAdmin } from '../auth.js';

const router = Router();

router.get('/me', requireUser, async (req, res) => {
  const rods = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 ORDER BY rod_type, org_id NULLS FIRST`).all(req.user.id);
  res.json({ rods: rods.map(normalizeRod) });
});

router.get('/lead/:leadId', requireAdmin, async (req, res) => {
  const rods = await db.prepare(`SELECT * FROM journey_data_rods WHERE lead_id=$1 ORDER BY created_at`).all(req.params.leadId);
  const events = rods.length ? await db.prepare(`SELECT * FROM journey_rod_events WHERE rod_id = ANY($1::bigint[]) ORDER BY created_at`).all(rods.map((r) => Number(r.id))) : [];
  res.json({ rods: rods.map(normalizeRod), events });
});

router.get('/stage-gates', requireAdmin, async (_req, res) => {
  res.json({ gates: await db.prepare(`SELECT * FROM journey_stage_gates ORDER BY rod_type, sort_order`).all() });
});

router.put('/stage-gates/:rodType/:stageKey', requireAdmin, async (req, res) => {
  const { label, sortOrder = 0, qualificationMetadata = {}, isActive = true } = req.body || {};
  if (!label) return res.status(400).json({ error: 'label is required' });
  const now = Date.now();
  await db.prepare(`INSERT INTO journey_stage_gates (rod_type,stage_key,label,sort_order,qualification_metadata,is_active,created_at,updated_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$7)
    ON CONFLICT (rod_type,stage_key) DO UPDATE SET label=EXCLUDED.label,sort_order=EXCLUDED.sort_order,qualification_metadata=EXCLUDED.qualification_metadata,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`)
    .run(req.params.rodType,req.params.stageKey,label,sortOrder,JSON.stringify(qualificationMetadata),!!isActive,now);
  res.json({ ok: true });
});

function normalizeRod(row) {
  return { ...row, id: Number(row.id), lead_id: row.lead_id ? Number(row.lead_id) : null, user_id: row.user_id ? Number(row.user_id) : null, org_id: row.org_id ? Number(row.org_id) : null, potential_revenue_cents: Number(row.potential_revenue_cents || 0), actual_revenue_cents: Number(row.actual_revenue_cents || 0) };
}

export default router;
