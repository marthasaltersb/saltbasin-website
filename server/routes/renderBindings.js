// Render bindings API (2026-10-09, docs/changes/render-bindings.md). Signed-in users only; each call applies
// the same permission checks the screen shows (rendering view roles, field editable_roles, admin-only decide and
// settings). The functions called here are the ones an MCP tool would call.
import { Router } from 'express';
import { requireUser } from '../auth.js';
import { assertReadyToFinalize, sendFinalizationError, FinalizationBlockedError } from '../lib/finalizationGates.js';
import * as RB from '../lib/renderBindings.js';
import * as Reg from '../lib/renderBindingRegistry.js';

const router = Router();
router.use(requireUser);

const fail = (res, e) => res.status(e.status || 500).json({ error: e.message, code: e.code });
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { fail(res, e); } };
const adminOnly = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Only an administrator can change binding settings', code: 'role_not_allowed' }));

// Live fan-out: a server-sent-events stream of change notices. Renderings re-read when one arrives.
router.get('/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();
  res.write(': connected\n\n');
  const onChange = (payload) => res.write(`event: change\ndata: ${JSON.stringify(payload)}\n\n`);
  RB.bus.on('change', onChange);
  const beat = setInterval(() => res.write(': ping\n\n'), 20000);
  req.on('close', () => { clearInterval(beat); RB.bus.off('change', onChange); });
});

router.get('/renderings', wrap(async (req, res) => { await RB.ensureSeeded(); res.json({ renderings: await RB.listRenderings(req.user) }); }));
router.get('/renderings/:key', wrap(async (req, res) => { res.json(await RB.viewRendering(req.user, req.params.key)); }));
router.post('/renderings/:key/subjects', wrap(async (req, res) => {
  if (req.params.key !== 'member-board') return res.status(400).json({ error: 'Items can only be added to the workshop board; the release world draws release features' });
  res.status(201).json({ subject: await RB.createBoardItem(req.user, req.body?.title) });
}));
router.get('/renderings/:key/subjects/:subjectKey', wrap(async (req, res) => { res.json(await RB.viewSubject(req.user, req.params.key, req.params.subjectKey)); }));
router.get('/renderings/:key/subjects/:subjectKey/history', wrap(async (req, res) => { res.json(await RB.subjectHistory(req.user, req.params.key, req.params.subjectKey)); }));

router.post('/changes', wrap(async (req, res) => { res.status(201).json(await RB.submitChange(req.user, req.body || {})); }));
router.get('/changes/pending', wrap(async (req, res) => { res.json({ pending: await RB.listPending(req.user) }); }));
router.get('/changes/:id/impact', wrap(async (req, res) => { res.json(await RB.impactForChange(req.user, Number(req.params.id))); }));
router.post('/changes/:id/approve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only an administrator can approve or reject a change', code: 'role_not_allowed' });
    await assertReadyToFinalize(req.user.id);
    res.json(await RB.decideChange(req.user, req.params.id, 'approve', req.body?.note));
  } catch (e) {
    if (e instanceof FinalizationBlockedError) return sendFinalizationError(res, e);
    return fail(res, e);
  }
});
router.post('/changes/:id/reject', wrap(async (req, res) => { res.json(await RB.decideChange(req.user, req.params.id, 'reject', req.body?.note)); }));

// Settings (administrators): sources, bindings, approval steps.
router.get('/settings', adminOnly, wrap(async (req, res) => {
  const catalog = await RB.loadCatalog();
  const { bindings, overrideError } = await RB.loadBindings();
  res.json({
    ports: catalog.filter((p) => !p.internal).map((p) => ({ portKey: p.port_key, name: p.name, portType: p.port_type, viewRoles: p.policy.viewRoles || [], note: p.policy.note || null,
      fields: p.objects.flatMap((o) => o.fields.map((f) => ({ objectKey: o.object_key, fieldKey: f.field_key, kind: f.kind, derived: !!f.derived, editableRoles: f.editable_roles, definition: f.business_definition }))) })),
    bindings: bindings.filter((b) => !Reg.findRendering(b.rendering)?.internal).map((b) => ({ id: b.id, rendering: b.rendering, channel: b.channel, source: b.source, legend: b.legend, changePolicy: b.change_policy, defaultPolicy: Reg.DEFAULT_BINDINGS.find((d) => d.id === b.id)?.change_policy || 'live', enabled: b.enabled, custom: !!b.custom })),
    renderings: Reg.RENDERINGS.filter((r) => !r.internal).map((r) => ({ key: r.key, label: r.label, channels: r.channels })),
    steps: await RB.listWorkflowSteps(), roles: Reg.ROLES, overrideError,
  });
}));
router.put('/settings/bindings', adminOnly, wrap(async (req, res) => { res.json({ overrides: await RB.saveOverrides(req.body?.overrides) }); }));
router.delete('/settings/bindings', adminOnly, wrap(async (req, res) => { await RB.saveOverrides({ bindings: {} }); res.json({ ok: true }); }));
router.put('/settings/fields/:portKey/:objectKey/:fieldKey', adminOnly, wrap(async (req, res) => { res.json(await RB.updateFieldRoles(req.params.portKey, req.params.objectKey, req.params.fieldKey, req.body?.editableRoles)); }));
router.put('/settings/steps/:id', adminOnly, wrap(async (req, res) => { res.json({ steps: await RB.updateWorkflowStep(req.params.id, req.body || {}) }); }));

export default router;
