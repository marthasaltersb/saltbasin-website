// Career Foundation Sourcing & Reconciliation, Phase 2 (2026-08-10) — the
// member-facing review queue API. Mirrors server/routes/careerPlacementAgents.js's
// convention: member-scoped via requireUser, no admin/member branching inside
// the route file.
import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { resolveReconciliationTask } from '../lib/careerReconciliation.js';

const router = Router();

function taskRow(row) {
  return {
    id: Number(row.id),
    taskType: row.task_type,
    entryType: row.entry_type,
    atomKey: row.atom_key,
    targetTable: row.target_table,
    targetId: row.target_id != null ? Number(row.target_id) : null,
    evidenceRefs: typeof row.evidence_refs === 'string' ? JSON.parse(row.evidence_refs) : row.evidence_refs,
    reasoning: typeof row.reasoning === 'string' ? JSON.parse(row.reasoning) : row.reasoning,
    status: row.status,
    resolution: typeof row.resolution === 'string' ? JSON.parse(row.resolution) : row.resolution,
    detectedAt: Number(row.detected_at),
    resolvedAt: row.resolved_at != null ? Number(row.resolved_at) : null,
  };
}

// Conflicts before ambiguous mappings (task_type is the priority signal —
// see careerReconciliation.js's header), each newest-first within its type.
router.get('/tasks', requireUser, async (req, res) => {
  try {
    const rod = await db.prepare(`SELECT id FROM journey_data_rods WHERE user_id=$1 AND rod_type='career_master'`).get(req.user.id);
    if (!rod) return res.json({ items: [] });
    const status = req.query.status === 'all' ? null : (req.query.status || 'open');
    const rows = await db.prepare(`
      SELECT * FROM career_reconciliation_tasks
      WHERE rod_id = $1 ${status ? 'AND status = $2' : ''}
      ORDER BY (task_type = 'source_conflict') DESC, detected_at DESC
    `).all(...(status ? [rod.id, status] : [rod.id]));
    res.json({ items: rows.map(taskRow) });
  } catch (e) {
    console.error('[career-reconciliation] list tasks failed:', e.message);
    res.status(500).json({ error: 'Failed to load reconciliation tasks' });
  }
});

router.post('/tasks/:id/resolve', requireUser, async (req, res) => {
  try {
    const result = await resolveReconciliationTask(req.user.id, Number(req.params.id), req.body || {});
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[career-reconciliation] resolve failed:', e.message);
    res.status(400).json({ error: e.message });
  }
});

export default router;
