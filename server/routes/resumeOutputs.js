// Resume Output Projection API (2026-07-16) — member-scoped.
import express from 'express';
import { getUserFromCookie } from '../auth.js';
import {
  createResumeOutputProjection,
  listResumeOutputProjections,
  checkStaleness,
  updateProjectionStatus,
} from '../lib/resumeProjection.js';

const router = express.Router();

router.use(async (req, res, next) => {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
});

router.get('/', async (req, res) => {
  try {
    res.json({ projections: await listResumeOutputProjections(req.user.id) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { presetId, presetName, includedSections, regenerateFromId, targetJobDescription } = req.body || {};
  if (!presetId) return res.status(400).json({ error: 'presetId is required' });
  try {
    const projection = await createResumeOutputProjection(req.user.id, { presetId, presetName, includedSections, regenerateFromId, targetJobDescription });
    res.json({ projection });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/:id/staleness', async (req, res) => {
  const staleness = await checkStaleness(req.params.id, req.user.id);
  if (!staleness) return res.status(404).json({ error: 'Resume output not found' });
  res.json(staleness);
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {};
  try {
    const projection = await updateProjectionStatus(req.params.id, req.user.id, status);
    res.json({ projection });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

export default router;
