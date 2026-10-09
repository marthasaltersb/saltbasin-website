// Career-bound outputs API (2026-10-02) - member-scoped via requireUser.
// See server/lib/careerBound.js for data shapes. Nothing here approves or
// publishes an output; those paths (resume-outputs /status and /share) call
// assertReadyToFinalize() themselves.
import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import {
  loadJobs, bulletsOf, addBulletVariant, updateBulletVariant, deleteBulletVariant,
  createCareerBoundOutput, updateCareerBoundOutput, getCareerBoundEditorState, convertPackageToCareerBound,
  buildCareerBoundFromPackage, resolveCareerBound, packageKeyOf, defaultCareerBoundContent, openPackageTaskCount,
} from '../lib/careerBound.js';

const router = Router();
router.use(requireUser);

const fail = (res, e) => {
  if (!e.status) console.error('[career-bound]', e.message);
  res.status(e.status || 400).json({ error: e.message, ...(e.details || {}) });
};
const jobShape = (j) => ({ id: Number(j.id), company: j.company, title: j.title, startDate: j.start_date, endDate: j.end_date, keyMetrics: j.key_metrics, bullets: bulletsOf(j) });

// Career Master jobs with their bullet-variant libraries.
router.get('/jobs', async (req, res) => {
  try { res.json({ items: (await loadJobs(req.user.id)).map(jobShape) }); } catch (e) { fail(res, e); }
});
router.post('/jobs/:jobId/bullets', async (req, res) => {
  try { res.status(201).json(await addBulletVariant(req.user.id, Number(req.params.jobId), { text: req.body?.text, tags: req.body?.tags || [], source: { kind: 'manual', ref: null } })); } catch (e) { fail(res, e); }
});
router.patch('/jobs/:jobId/bullets/:bulletId', async (req, res) => {
  try { res.json(await updateBulletVariant(req.user.id, Number(req.params.jobId), req.params.bulletId, req.body || {})); } catch (e) { fail(res, e); }
});
router.delete('/jobs/:jobId/bullets/:bulletId', async (req, res) => {
  try { res.json(await deleteBulletVariant(req.user.id, Number(req.params.jobId), req.params.bulletId)); } catch (e) { fail(res, e); }
});

// Imported package resumes the member can convert, with how many of that
// package's reconciliation tasks are still open.
router.get('/convertible', async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT id, preset_id, preset_name, output_status, generated_content FROM resume_output_projections
       WHERE user_id=$1 AND preset_id LIKE 'application\\_package:%' AND output_type='resume' ORDER BY created_at DESC
    `).all(req.user.id);
    const open = await db.prepare(`
      SELECT t.metadata->>'packageKey' AS package_key, COUNT(*) AS n FROM career_reconciliation_tasks t
        JOIN journey_data_rods r ON r.id = t.rod_id
       WHERE r.user_id=$1 AND t.status='open' AND t.task_type LIKE 'package\\_%' GROUP BY 1
    `).all(req.user.id);
    const openBy = new Map(open.map((o) => [o.package_key, Number(o.n)]));
    const items = rows
      .filter((r) => (typeof r.generated_content === 'string' ? JSON.parse(r.generated_content) : r.generated_content)?.format === 'document_blocks')
      .map((r) => {
        const pk = packageKeyOf(r.preset_id);
        return { id: Number(r.id), name: r.preset_name, packageKey: pk?.packageKey, variant: pk?.variant, outputStatus: r.output_status, openTasks: openBy.get(pk?.packageKey) || 0 };
      });
    res.json({ items });
  } catch (e) { fail(res, e); }
});

// Dry run: what the conversion would produce (and any role it could not bind).
router.get('/convert/:projectionId/preview', async (req, res) => {
  try {
    const built = await buildCareerBoundFromPackage(req.user.id, Number(req.params.projectionId));
    const { content: resolved, warnings } = await resolveCareerBound(req.user.id, built.content);
    res.json({ content: built.content, resolved, warnings: [...built.warnings, ...warnings.map((w) => w.message)] });
  } catch (e) { fail(res, e); }
});
router.post('/convert/:projectionId', async (req, res) => {
  try { res.status(201).json(await convertPackageToCareerBound(req.user.id, Number(req.params.projectionId))); } catch (e) { fail(res, e); }
});

router.post('/outputs', async (req, res) => {
  try {
    // No content given: start from everything in Career Master (the member then deselects / overrides).
    const name = String(req.body?.name || '').trim() || 'Career-bound resume';
    const content = req.body?.content || await defaultCareerBoundContent(req.user.id, { name: req.user.displayName || '' });
    const projection = await createCareerBoundOutput(req.user.id, { name, content });
    res.status(201).json({ id: Number(projection.id) });
  } catch (e) { fail(res, e); }
});
router.get('/review-count', async (req, res) => {
  try { res.json({ open: await openPackageTaskCount(req.user.id) }); } catch (e) { fail(res, e); }
});
router.get('/outputs/:id', async (req, res) => {
  try { res.json(await getCareerBoundEditorState(req.user.id, Number(req.params.id))); } catch (e) { fail(res, e); }
});
// Live preview of UNSAVED editor state: resolves the posted content against
// Career Master and returns it. Writes nothing. The output must be the caller's.
router.post('/outputs/:id/preview', async (req, res) => {
  try {
    await getCareerBoundEditorState(req.user.id, Number(req.params.id)); // ownership / existence (404 otherwise)
    const { content: resolved, warnings } = await resolveCareerBound(req.user.id, req.body?.content);
    res.json({ resolved, warnings: warnings.map((w) => ({ kind: w.kind, message: w.message })) });
  } catch (e) { fail(res, e); }
});
router.put('/outputs/:id', async (req, res) => {
  try {
    const result = await updateCareerBoundOutput(req.user.id, Number(req.params.id), { name: req.body?.name, content: req.body?.content });
    res.json({ ok: true, ...result, state: await getCareerBoundEditorState(req.user.id, result.id) });
  } catch (e) { fail(res, e); }
});

export default router;
