// After-session mapping API (admin only). Every route calls the same service
// function the CLI script and (later) the MCP tool call, so permissions are
// decided here once. "Mark applied" is a finalize path and goes through
// assertReadyToFinalize like every other approval (server/lib/finalizationGates.js).
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { assertReadyToFinalize, sendFinalizationError, FinalizationBlockedError } from '../lib/finalizationGates.js';
import { loadRules, saveRules, resetRules, DEFAULT_RULES } from '../lib/sessionMappingConfig.js';
import {
  listSessions, getSession, listProposals, rejectProposal, applyProposal, remapSession, remapAll, getTrends,
  importTranscriptText, importMetricsJson, scanTranscripts, listCaptureFailures, setCaptureFailureDisposition,
} from '../lib/sessionMapping.js';

const router = Router();
router.use(requireAdmin);

const actorOf = (req) => ({ id: req.user.id, label: req.user.name || req.user.email || `user ${req.user.id}` });
const fail = (res, e) => res.status(e.status || 500).json({ error: e.message, code: e.code, gaps: e.gaps });
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { fail(res, e); } };

router.get('/config', wrap(async (req, res) => {
  const { rules, overrideError, overridden } = await loadRules();
  res.json({ rules, defaults: DEFAULT_RULES, overrideError, overridden });
}));
router.put('/config', wrap(async (req, res) => { const rules = await saveRules(req.body?.rules); res.json({ rules, remapped: await remapAll() }); }));
router.delete('/config', wrap(async (req, res) => { await resetRules(); res.json({ ok: true, remapped: await remapAll() }); }));

router.get('/sessions', wrap(async (req, res) => { res.json(await listSessions()); }));
router.get('/sessions/:id', wrap(async (req, res) => {
  const d = await getSession(Number(req.params.id));
  if (!d) return res.status(404).json({ error: 'Session not found' });
  res.json(d);
}));
router.post('/sessions/:id/remap', wrap(async (req, res) => { await remapSession(Number(req.params.id)); res.json(await getSession(Number(req.params.id))); }));

router.get('/proposals', wrap(async (req, res) => { res.json({ proposals: await listProposals({ status: req.query.status, area: req.query.area }) }); }));
router.post('/proposals/:id/reject', wrap(async (req, res) => { res.json({ proposal: await rejectProposal(Number(req.params.id), req.body?.note, actorOf(req)) }); }));
router.post('/proposals/:id/apply', async (req, res) => {
  try {
    await assertReadyToFinalize(req.user.id);
    res.json({ proposal: await applyProposal(Number(req.params.id), req.body || {}, actorOf(req)) });
  } catch (e) {
    if (e instanceof FinalizationBlockedError) return sendFinalizationError(res, e);
    return fail(res, e);
  }
});

router.get('/trends', wrap(async (req, res) => { res.json(await getTrends()); }));

router.post('/import/transcript', wrap(async (req, res) => { res.status(201).json(await importTranscriptText(req.body || {}, { actor: actorOf(req) })); }));
router.post('/import/metrics', wrap(async (req, res) => { res.status(201).json(await importMetricsJson(req.body?.analysis, { actor: actorOf(req) })); }));
router.post('/import/scan', wrap(async (req, res) => { res.json(await scanTranscripts({ actor: actorOf(req) })); }));

router.get('/failures', wrap(async (req, res) => { res.json({ failures: await listCaptureFailures() }); }));
router.put('/failures/:id/disposition', wrap(async (req, res) => { res.json({ failure: await setCaptureFailureDisposition(Number(req.params.id), req.body || {}, actorOf(req)) }); }));

export default router;
