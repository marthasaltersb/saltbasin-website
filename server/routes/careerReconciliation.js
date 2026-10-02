// Career Foundation Sourcing & Reconciliation, Phase 2 (2026-08-10) — the
// member-facing review queue API. Mirrors server/routes/careerPlacementAgents.js's
// convention: member-scoped via requireUser, no admin/member branching inside
// the route file.
import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { resolveReconciliationTask } from '../lib/careerReconciliation.js';
import { importPackageAsSource, resolvePackageTask, retryTaskSync, PACKAGE_TASK_TYPES } from '../lib/packageReconciliation.js';

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
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
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
    const wanted = req.query.status === 'all' ? null : (req.query.status || 'open');
    // 'sync_failed' = decided package tasks whose Career Atom sync failed (applied, not yet synced).
    const syncFailed = wanted === 'sync_failed';
    const status = syncFailed ? null : wanted;
    const rows = await db.prepare(`
      SELECT * FROM career_reconciliation_tasks
      WHERE rod_id = $1 ${status ? 'AND status = $2' : ''} ${syncFailed ? `AND metadata ? 'syncError'` : ''}
      ORDER BY CASE task_type WHEN 'source_conflict' THEN 0 WHEN 'package_field_conflict' THEN 1 WHEN 'package_add_job' THEN 2 WHEN 'package_new_bullet' THEN 3 WHEN 'package_new_skill' THEN 4 WHEN 'package_new_tool' THEN 5 ELSE 6 END, detected_at DESC
    `).all(...(status ? [rod.id, status] : [rod.id]));
    res.json({ items: rows.map(taskRow) });
  } catch (e) {
    console.error('[career-reconciliation] list tasks failed:', e.message);
    res.status(500).json({ error: 'Failed to load reconciliation tasks' });
  }
});

router.post('/tasks/:id/resolve', requireUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await db.prepare(`
      SELECT t.task_type FROM career_reconciliation_tasks t JOIN journey_data_rods r ON r.id = t.rod_id WHERE t.id=$1 AND r.user_id=$2
    `).get(id, req.user.id);
    if (row && PACKAGE_TASK_TYPES.includes(row.task_type)) {
      return res.json({ ok: true, ...(await resolvePackageTask(req.user.id, id, req.body || {})) });
    }
    const result = await resolveReconciliationTask(req.user.id, id, req.body || {});
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[career-reconciliation] resolve failed:', e.message);
    res.status(e.status || 400).json({ error: e.message });
  }
});

// A tailored application package as a reconciliation source: files its
// outputs (never approving anything) and raises one task per difference.
router.post('/package-sources', requireUser, async (req, res) => {
  try {
    res.status(201).json({ ok: true, ...(await importPackageAsSource(req.user.id, req.body?.package)) });
  } catch (e) {
    console.error('[career-reconciliation] package import failed:', e.message);
    res.status(e.status || 400).json({ error: e.message });
  }
});

router.post('/tasks/:id/retry-sync', requireUser, async (req, res) => {
  try {
    res.json({ ok: true, ...(await retryTaskSync(req.user.id, Number(req.params.id))) });
  } catch (e) {
    res.status(e.status || 400).json({ error: e.message });
  }
});

export default router;
