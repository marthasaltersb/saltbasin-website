// Journey flow studio API (docs/changes/journey-flow-studio.md). Signed-in users; each call applies the permission
// policy in the studio definition (access.create / publish / shareTemplate / editDefinition), the same checks the
// screen shows. These routes call the exports an MCP tool calls (server/lib/flowStudio.js).
import { Router } from 'express';
import { requireUser } from '../auth.js';
import { assertReadyToFinalize, sendFinalizationError, FinalizationBlockedError } from '../lib/finalizationGates.js';
import * as FS from '../lib/flowStudio.js';

const router = Router();
router.use(requireUser);

const fail = (res, e) => res.status(e.status || 500).json({ error: e.message, code: e.code, errors: e.errors, impact: e.impact, currentVersion: e.currentVersion });
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { fail(res, e); } };
const src = (req, d = 'editor') => req.body?.sourceAction || d;
const sendFile = (res, f) => { res.set({ 'Content-Type': `${f.contentType}; charset=utf-8`, 'Content-Disposition': `attachment; filename="${f.filename}"`, 'X-Content-Type-Options': 'nosniff' }); res.send(f.body); };

router.get('/definition', wrap(async (req, res) => res.json(await FS.getDefinition())));
router.put('/definition', wrap(async (req, res) => res.json(await FS.saveDefinition(req.user, req.body?.definition, { note: req.body?.note, approved: req.body?.approved }))));
router.delete('/definition', wrap(async (req, res) => res.json(await FS.resetDefinition(req.user, { note: req.body?.note }))));

router.get('/flows', wrap(async (req, res) => res.json(await FS.listFlows(req.user))));
router.post('/flows', wrap(async (req, res) => res.status(201).json(await FS.createFlow(req.user, { ...req.body, sourceAction: src(req, 'create') }))));
router.post('/flows/import', wrap(async (req, res) => res.status(201).json(await FS.importFlow(req.user, req.body?.payload, req.body || {}))));
router.get('/flows/:id', wrap(async (req, res) => res.json(await FS.getFlow(req.user, req.params.id))));
router.put('/flows/:id', wrap(async (req, res) => res.json(await FS.saveDraft(req.user, req.params.id, { ...req.body, sourceAction: src(req) }))));
router.delete('/flows/:id', wrap(async (req, res) => res.json(await FS.archiveFlow(req.user, req.params.id))));
router.post('/flows/:id/validate', wrap(async (req, res) => res.json(await FS.validateOnly(req.user, req.params.id, req.body?.doc))));
router.get('/flows/:id/history', wrap(async (req, res) => res.json(await FS.history(req.user, req.params.id))));
router.post('/flows/:id/restore', wrap(async (req, res) => res.json(await FS.restoreVersion(req.user, req.params.id, req.body?.version))));
router.get('/flows/:id/publish-preview', wrap(async (req, res) => res.json(await FS.publishPreview(req.user, req.params.id))));
router.post('/flows/:id/publish', async (req, res) => {
  try {
    await assertReadyToFinalize(req.user.id);
    res.json(await FS.publish(req.user, req.params.id, { approved: req.body?.approved, note: req.body?.note }));
  } catch (e) {
    if (e instanceof FinalizationBlockedError) return sendFinalizationError(res, e);
    return fail(res, e);
  }
});
router.get('/flows/:id/export', wrap(async (req, res) => sendFile(res, await FS.exportFlow(req.user, req.params.id, req.query.format || 'json', { state: req.query.state || 'future' }))));
router.post('/flows/:id/agent-draft', wrap(async (req, res) => res.json(await FS.agentDraft(req.user, req.body || {}))));

router.post('/flows/:id/save-as-template', wrap(async (req, res) => res.status(201).json(await FS.saveAsTemplate(req.user, req.params.id, req.body || {}))));
router.get('/templates/seed/:key/export', wrap(async (req, res) => sendFile(res, await FS.exportSeedTemplate(req.params.key, req.query.format || 'json'))));
router.get('/templates/:id/impact', wrap(async (req, res) => res.json(await FS.templateImpact(req.user, req.params.id, { op: req.query.op }))));
router.put('/templates/:id', wrap(async (req, res) => res.json(await FS.overwriteTemplate(req.user, req.params.id, req.body || {}))));
router.delete('/templates/:id', wrap(async (req, res) => res.json(await FS.deleteTemplate(req.user, req.params.id, req.body || {}))));
router.get('/templates/:id/export', wrap(async (req, res) => sendFile(res, await FS.exportFlow(req.user, req.params.id, req.query.format || 'json'))));

export default router;
