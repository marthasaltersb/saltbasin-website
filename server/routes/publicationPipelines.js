// Publication Pipeline API (2026-08-07) — the agent/schedule/flow-config
// surface for Salt Basin's own content-publication process (HERQ, and later
// Marketing Ads / Research Reports, same pattern). Admin-scoped: this is
// Betsy's own content operations, not member self-service, mirroring
// commercialOpportunities.js's scoping. Reuses opportunityPipelineRegistry.js's
// agent/schedule functions directly rather than duplicating them — they were
// already pipeline-parametrized with no career/commercial-specific
// assumptions. The HERQ content items themselves stay owned by herq.js
// (GET /api/herq/posts etc.) — this router only adds the agent-hub/schedule
// layer that never existed for HERQ before, plus a read-only items list
// scoped to whichever app_id the caller asks for.
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { db } from '../db.js';
import { resolveAgentRoster, resolveApprovalWorkflow, assignAgentSchedule, resolveAgentSchedules } from '../lib/opportunityPipelineRegistry.js';

const router = Router();

router.get('/agent-hub', requireAdmin, async (req, res) => {
  try {
    const pipeline = req.query.pipeline || 'herq';
    const [agents, workflow] = await Promise.all([
      resolveAgentRoster({ pipeline }),
      resolveApprovalWorkflow({ pipeline }),
    ]);
    res.json({ agents, workflow });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/items', requireAdmin, async (req, res) => {
  try {
    const appId = req.query.appId || 'app.herq';
    const rows = await db.prepare(
      `SELECT id, title, topic, export_status, created_at, updated_at FROM unified_content_items WHERE app_id=$1 ORDER BY updated_at DESC LIMIT 100`
    ).all(appId);
    res.json({
      items: rows.map((r) => ({
        id: r.id, title: r.title, topic: r.topic, exportStatus: r.export_status,
        createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/schedule', requireAdmin, async (req, res) => {
  try {
    const agentDefinitionId = Number(req.query.agentDefinitionId);
    if (!agentDefinitionId) return res.status(400).json({ error: 'agentDefinitionId is required' });
    const rows = await resolveAgentSchedules(agentDefinitionId);
    res.json({ schedules: rows.map(rowToSchedule) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/schedule', requireAdmin, async (req, res) => {
  try {
    const { agentDefinitionId, cadence, cadenceDetail, triggerMode, triggerMoleculeKey } = req.body || {};
    if (!agentDefinitionId) return res.status(400).json({ error: 'agentDefinitionId is required' });
    const schedule = await assignAgentSchedule({
      agentDefinitionId: Number(agentDefinitionId),
      cadence: cadence || 'on_demand',
      cadenceDetail: cadenceDetail || {},
      triggerMode: triggerMode || 'scheduled',
      triggerMoleculeKey: triggerMoleculeKey || null,
    });
    res.json(rowToSchedule(schedule));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function rowToSchedule(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    agentDefinitionId: Number(row.agent_definition_id),
    cadence: row.cadence,
    cadenceDetail: row.cadence_detail,
    triggerMode: row.trigger_mode,
    triggerMoleculeKey: row.trigger_molecule_key,
    isActive: row.is_active,
    createdAt: Number(row.created_at),
  };
}

export default router;
