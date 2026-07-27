// Loop 14 (§38 Real-Time Multi-User Collaboration) — presence slice.
//
// "Multiple users may interact with the same checkpoint simultaneously. The
// world should show this." This is a heartbeat/poll implementation (no
// websocket transport exists in this codebase yet) — a real, working first
// slice of §38, not the full spec: it makes collaborator presence visible
// and policy-scoped, but does not yet implement the Agent's collaborative-
// reasoning compilation across simultaneous users (that depends on the
// multi-tier Agent hierarchy from Loop 8, which itself isn't built).
import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { PRESENCE_ACTION_STATES, PRESENCE_TTL_MS, canViewPresence, isDataScope } from '../lib/collaborationRegistry.js';

const router = Router();
router.use(requireUser);

async function loadRodAndViewer(req, res) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(req.params.rodId);
  if (!rod) { res.status(404).json({ error: 'Channel rod not found' }); return null; }

  const isRodOwner = req.user.role === 'admin' || Number(rod.user_id) === Number(req.user.id);
  let orgRole = null;
  if (rod.org_id) {
    const membership = await db.prepare(`SELECT role FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(req.user.id, rod.org_id);
    orgRole = membership?.role || null;
  }
  return { rod, viewer: { userId: Number(req.user.id), isRodOwner, orgRole } };
}

// Heartbeat: upsert the caller's own presence at this rod's current checkpoint.
router.put('/:rodId/heartbeat', async (req, res) => {
  const ctx = await loadRodAndViewer(req, res);
  if (!ctx) return;
  const b = req.body || {};
  const actionState = PRESENCE_ACTION_STATES.includes(b.actionState) ? b.actionState : 'viewing';
  const visibilityScope = isDataScope(b.visibilityScope) ? b.visibilityScope : 'ORGANIZATION_SHARED';
  const now = Date.now();

  await db.prepare(`
    INSERT INTO checkpoint_presence (rod_id, checkpoint_stage, user_id, selected_molecule_key, active_agent_id, action_state, visibility_scope, last_seen_at, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
    ON CONFLICT (rod_id, user_id) DO UPDATE SET
      checkpoint_stage=EXCLUDED.checkpoint_stage, selected_molecule_key=EXCLUDED.selected_molecule_key,
      active_agent_id=EXCLUDED.active_agent_id, action_state=EXCLUDED.action_state,
      visibility_scope=EXCLUDED.visibility_scope, last_seen_at=EXCLUDED.last_seen_at
  `).run(ctx.rod.id, ctx.rod.current_stage, req.user.id, b.selectedMoleculeKey || null, b.activeAgentId || null, actionState, visibilityScope, now);

  res.json({ ok: true, expiresInMs: PRESENCE_TTL_MS });
});

// Who's here: this rod's active (non-stale) presence rows the caller is authorized to see.
router.get('/:rodId', async (req, res) => {
  const ctx = await loadRodAndViewer(req, res);
  if (!ctx) return;
  const staleBefore = Date.now() - PRESENCE_TTL_MS;

  const rows = await db.prepare(`
    SELECT cp.*, u.email AS user_email
    FROM checkpoint_presence cp JOIN users u ON u.id = cp.user_id
    WHERE cp.rod_id=$1 AND cp.last_seen_at >= $2
  `).all(ctx.rod.id, staleBefore);

  const visible = rows
    .filter((row) => canViewPresence(row, ctx.viewer))
    .map((row) => ({
      userId: Number(row.user_id),
      userEmail: row.user_email,
      checkpointStage: row.checkpoint_stage,
      selectedMoleculeKey: row.selected_molecule_key,
      activeAgentId: row.active_agent_id,
      actionState: row.action_state,
      isSelf: Number(row.user_id) === ctx.viewer.userId,
    }));

  res.json({ rodId: ctx.rod.id, presentCount: visible.length, present: visible });
});

// Explicit departure (tab close, navigate away) rather than waiting out the TTL.
router.delete('/:rodId', async (req, res) => {
  const ctx = await loadRodAndViewer(req, res);
  if (!ctx) return;
  await db.prepare(`DELETE FROM checkpoint_presence WHERE rod_id=$1 AND user_id=$2`).run(ctx.rod.id, req.user.id);
  res.json({ ok: true });
});

export default router;
