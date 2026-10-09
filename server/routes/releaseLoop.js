// Release loop API (admin only): the platform copy of the release process.
// Every route calls the same exported function an MCP tool would call
// (server/lib/releaseLoopPlatform.js); permissions are enforced here once
// (requireAdmin) and the "done" transition also goes through
// assertReadyToFinalize inside transitionRun.
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { FinalizationBlockedError, sendFinalizationError } from '../lib/finalizationGates.js';
import { saveDefinition, resetDefinition, getEffectiveDefinition } from '../lib/releaseLoopDefinition.js';
import * as loop from '../lib/releaseLoopPlatform.js';

const router = Router();
router.use(requireAdmin);

const actorOf = (req) => ({ id: req.user.id, label: req.user.name || req.user.email || `user ${req.user.id}` });
const fail = (res, e) => {
  if (e instanceof FinalizationBlockedError) return sendFinalizationError(res, e);
  return res.status(e.status || 500).json({ error: e.message, code: e.code, gaps: e.gaps });
};
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { fail(res, e); } };
const id = (req, k = 'id') => Number(req.params[k]);

router.get('/definition', wrap(async (req, res) => { res.json(await loop.getDefinitionView()); }));
router.put('/definition', wrap(async (req, res) => {
  await saveDefinition(req.body?.definition, req.body?.note, actorOf(req));
  res.json(await loop.getDefinitionView());
}));
router.delete('/definition', wrap(async (req, res) => {
  await resetDefinition(req.body?.note, actorOf(req));
  res.json(await loop.getDefinitionView());
}));

router.get('/runs', wrap(async (req, res) => { res.json({ runs: await loop.listRuns() }); }));
router.post('/runs', wrap(async (req, res) => { res.status(201).json(await loop.createRun(req.body || {}, actorOf(req))); }));
router.get('/runs/:id', wrap(async (req, res) => { res.json(await loop.getRunDetail(id(req))); }));
router.post('/runs/:id/transition', wrap(async (req, res) => {
  res.json(await loop.transitionRun(id(req), req.body?.to, { note: req.body?.note, actor: actorOf(req), userId: req.user.id }));
}));
router.post('/runs/:id/rounds', wrap(async (req, res) => { res.status(201).json(await loop.recordRound(id(req), req.body || {}, actorOf(req))); }));
router.get('/runs/:id/steps', wrap(async (req, res) => { res.json({ steps: await loop.listSteps(id(req), req.query.after) }); }));
router.post('/runs/:id/steps', wrap(async (req, res) => { res.status(201).json(await loop.addStep(id(req), req.body || {})); }));
router.post('/runs/:id/bugs', wrap(async (req, res) => { res.status(201).json(await loop.createBug(id(req), req.body || {}, actorOf(req))); }));
router.post('/runs/:id/reconciliation', wrap(async (req, res) => { res.status(201).json(await loop.addReconciliationItem(id(req), req.body || {}, actorOf(req))); }));
router.put('/runs/:id/reconciliation/:itemId', wrap(async (req, res) => {
  res.json(await loop.resolveReconciliationItem(id(req), id(req, 'itemId'), req.body || {}, actorOf(req)));
}));

router.post('/bugs/:id/start-fix', wrap(async (req, res) => { res.json(await loop.startFix(id(req), actorOf(req))); }));
router.post('/bugs/:id/fix', wrap(async (req, res) => { res.json(await loop.recordFix(id(req), req.body || {}, actorOf(req))); }));
router.post('/bugs/:id/retest', wrap(async (req, res) => { res.json(await loop.retestBug(id(req), req.body || {}, actorOf(req))); }));
router.post('/bugs/:id/scope', wrap(async (req, res) => { res.json(await loop.scopeBug(id(req), req.body || {}, actorOf(req))); }));
router.post('/bugs/:id/answer', wrap(async (req, res) => { res.json(await loop.answerBusinessQuestion(id(req), req.body || {}, actorOf(req))); }));
router.post('/bugs/:id/decision', wrap(async (req, res) => { res.json(await loop.decideNeedsHuman(id(req), req.body || {}, actorOf(req))); }));

router.get('/escalations', wrap(async (req, res) => { res.json({ escalations: await loop.listEscalations(), maxFixAttemptsPerBug: (await getEffectiveDefinition()).definition.bugEscalation.maxFixAttemptsPerBug }); }));

export default router;
