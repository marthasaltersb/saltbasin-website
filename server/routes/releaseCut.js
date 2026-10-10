// Release cut records and session plans (admin only). Every route calls the same exported function the
// release_cut_* MCP tools call (server/lib/releaseCut.js); the admin check is made once here (requireAdmin).
// Closing a session seals its estimate-versus-result record, so it is a finalize path: assertReadyToFinalize first.
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { FinalizationBlockedError, sendFinalizationError, assertReadyToFinalize } from '../lib/finalizationGates.js';
import * as cut from '../lib/releaseCut.js';

const router = Router();
router.use(requireAdmin);

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (e) {
    if (e instanceof FinalizationBlockedError) return sendFinalizationError(res, e);
    return res.status(e.status || 500).json({ error: e.message, code: e.code });
  }
};

router.get('/releases', wrap(async (req, res) => { res.json(cut.listReleases()); }));
router.get('/releases/:version', wrap(async (req, res) => { res.json(cut.getRelease(req.params.version)); }));
router.get('/sessions', wrap(async (req, res) => { res.json({ release: req.query.release || cut.activeDefs().version, sessions: cut.listSessionPlans({ release: req.query.release }) }); }));
router.get('/sessions/report', wrap(async (req, res) => { res.json(cut.sessionReport({ release: req.query.release })); }));
router.get('/sessions/:session', wrap(async (req, res) => { res.json({ session: cut.getSessionPlan(req.params.session) }); }));
router.post('/sessions/estimate', wrap(async (req, res) => { res.status(201).json(cut.recordEstimate(req.body || {})); }));
router.post('/sessions/:session/merge', wrap(async (req, res) => { res.status(201).json(cut.recordMerge({ ...(req.body || {}), session: req.params.session })); }));
router.post('/sessions/:session/close', wrap(async (req, res) => {
  await assertReadyToFinalize(req.user.id);
  res.json(cut.closeSession({ note: req.body?.note, session: req.params.session }));
}));

export default router;
