// Release intelligence API (admin only): release records reconciled to their
// specs/rounds/failed runs, the importer, and contribution trends.
// Finalize/approve goes through assertReadyToFinalize like every other
// approval path (server/lib/finalizationGates.js).
import path from 'node:path';
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { assertReadyToFinalize, sendFinalizationError, FinalizationBlockedError } from '../lib/finalizationGates.js';
import { loadRules, saveRules, resetRules, DEFAULT_RULES } from '../lib/releaseIntelligenceConfig.js';
import { importDocument, importSnapshot, importRepository, attributeOrphans } from '../lib/releaseLogImporter.js';
import {
  listReleases, getReleaseDetail, createRelease, addManualFeature, addManualFailedRun, setDisposition,
  listFailedRuns, listOutputs, linkOutput, approveRelease, reopenRelease, getTrends,
} from '../lib/releaseIntelligence.js';
import { jsonProblemMessage } from '../lib/friendlyErrors.js';

const router = Router();
router.use(requireAdmin);

const actorOf = (req) => ({ id: req.user.id, label: req.user.name || req.user.email || `user ${req.user.id}` });
const fail = (res, e) => res.status(e.status || 500).json({ error: e.message, code: e.code, gaps: e.gaps });
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { fail(res, e); } };

router.get('/config', wrap(async (req, res) => {
  const { rules, overrideError, overridden } = await loadRules();
  res.json({ rules, defaults: DEFAULT_RULES, overrideError, overridden });
}));
router.put('/config', wrap(async (req, res) => { res.json({ rules: await saveRules(req.body?.rules) }); }));
router.delete('/config', wrap(async (req, res) => { await resetRules(); res.json({ ok: true }); }));

router.get('/releases', wrap(async (req, res) => { res.json({ releases: await listReleases() }); }));
router.post('/releases', wrap(async (req, res) => { res.status(201).json(await createRelease(req.body || {}, actorOf(req))); }));
router.get('/releases/:id', wrap(async (req, res) => {
  const d = await getReleaseDetail(Number(req.params.id));
  if (!d) return res.status(404).json({ error: 'Release not found' });
  res.json(d);
}));
router.post('/releases/:id/features', wrap(async (req, res) => { res.json(await addManualFeature(Number(req.params.id), req.body || {}, actorOf(req))); }));

// Approve = finalize the reconciliation. Gated like every finalize path.
router.post('/releases/:id/approve', async (req, res) => {
  try {
    await assertReadyToFinalize(req.user.id);
    res.json(await approveRelease(Number(req.params.id), req.body?.note, actorOf(req)));
  } catch (e) {
    if (e instanceof FinalizationBlockedError) return sendFinalizationError(res, e);
    return fail(res, e);
  }
});
router.post('/releases/:id/reopen', wrap(async (req, res) => { res.json(await reopenRelease(Number(req.params.id), req.body?.note, actorOf(req))); }));

router.get('/failed-runs', wrap(async (req, res) => { res.json({ runs: await listFailedRuns(req.query) }); }));
router.post('/failed-runs', wrap(async (req, res) => { res.status(201).json({ id: await addManualFailedRun(req.body || {}, actorOf(req)) }); }));
router.put('/failed-runs/:id/disposition', wrap(async (req, res) => { res.json(await setDisposition(Number(req.params.id), req.body || {}, actorOf(req))); }));

router.get('/outputs', wrap(async (req, res) => { res.json({ outputs: await listOutputs() }); }));
router.put('/outputs/:id/release', wrap(async (req, res) => { res.json({ outputs: await linkOutput(Number(req.params.id), req.body?.releaseId || null, actorOf(req)) }); }));

router.get('/trends', wrap(async (req, res) => { res.json(await getTrends()); }));

// ── Import ──────────────────────────────────────────────────────────────────
router.post('/import/document', wrap(async (req, res) => {
  const { path: docPath, content } = req.body || {};
  if (!docPath || typeof content !== 'string' || !content.trim()) return res.status(400).json({ error: 'Give the document path and its text' });
  const result = await importDocument(docPath, content, { actor: actorOf(req) });
  const attributed = await attributeOrphans();
  res.json({ ...result, attributed });
}));
router.post('/import/snapshot', wrap(async (req, res) => {
  const { releaseKey, snapshot } = req.body || {};
  let snap = snapshot;
  if (typeof snap === 'string') {
    try { snap = JSON.parse(snap); } catch (e) { return res.status(400).json({ error: jsonProblemMessage('snapshot', e) }); }
  }
  const result = await importSnapshot(String(releaseKey || '').trim(), snap, { actor: actorOf(req) });
  res.json({ ...result, attributed: await attributeOrphans() });
}));
router.post('/import/repository', wrap(async (req, res) => {
  const root = path.resolve(process.cwd());
  res.json(await importRepository(root, { actor: actorOf(req) }));
}));

export default router;
