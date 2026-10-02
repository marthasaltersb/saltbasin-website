// Resume Output Projection API (2026-07-16) — member-scoped.
import express from 'express';
import { getUserFromCookie } from '../auth.js';
import {
  createResumeOutputProjection,
  listResumeOutputProjections,
  checkStaleness,
  updateProjectionStatus,
} from '../lib/resumeProjection.js';
import QRCode from 'qrcode';
import {
  importApplicationPackage,
  approveOutputForSharing,
  revokeOutputSharing,
  getOwnedOutputWithApprover,
  shareUrlFor,
} from '../lib/applicationPackages.js';

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

// ── Tailored application packages + QR-gated sharing (2026-10-02) ──────────
// See server/lib/applicationPackages.js. Import never approves anything;
// approval is always this explicit, per-version owner action.
router.post('/import-package', async (req, res) => {
  try {
    const results = await importApplicationPackage(req.user.id, req.body?.package);
    res.status(201).json({ results });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/share', async (req, res) => {
  try {
    const shared = await approveOutputForSharing(Number(req.params.id), req.user);
    if (!shared) return res.status(404).json({ error: 'Resume output not found' });
    res.json({ ...shared, url: shareUrlFor(shared.token, req) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id/share', async (req, res) => {
  const ok = await revokeOutputSharing(Number(req.params.id), req.user.id);
  if (!ok) return res.status(404).json({ error: 'Resume output not found' });
  res.json({ ok: true });
});

// QR image for the approved version's slug — .svg for print/Word, .png for
// anything that can't place SVG. 404 until the version is approved.
router.get('/:id/qr.:format(svg|png)', async (req, res) => {
  try {
    const row = await getOwnedOutputWithApprover(Number(req.params.id), req.user.id);
    if (!row?.share_token || row.output_status !== 'published') return res.status(404).json({ error: 'Approve this version for sharing first.' });
    const url = shareUrlFor(row.share_token, req);
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.params.format === 'svg') {
      res.type('image/svg+xml').send(await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }));
    } else {
      res.type('image/png').send(await QRCode.toBuffer(url, { type: 'png', margin: 1, width: 600, errorCorrectionLevel: 'M' }));
    }
  } catch (e) { res.status(400).json({ error: e.message }); }
});

export default router;
