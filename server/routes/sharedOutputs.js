// Public, QR-gated access to one approved application document (2026-10-02).
// The only way in is the unguessable slug printed in that version's QR code
// (server/lib/applicationPackages.js) — nothing lists, links, or indexes
// these, and a revoked or unapproved slug is indistinguishable from one that
// never existed (plain 404 either way).
import express from 'express';
import { getSharedOutputByToken, publicSharedView, shareUrlFor } from '../lib/applicationPackages.js';
import { renderProjectionToPdfBuffer, filenameFor } from '../lib/outputRendering.js';

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

router.get('/:token', async (req, res) => {
  try {
    const row = await getSharedOutputByToken(req.params.token);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(publicSharedView(row));
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:token/download.pdf', async (req, res) => {
  try {
    const row = await getSharedOutputByToken(req.params.token);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const buffer = await renderProjectionToPdfBuffer(row, { shareUrl: shareUrlFor(row.share_token, req) });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filenameFor(row)}"`);
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
