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
import { renderProjectionToDocxBuffer, filenameFor } from '../lib/outputRendering.js';
import {
  importApplicationPackage,
  approveOutputForSharing,
  revokeOutputSharing,
  getOwnedOutputWithApprover,
  shareUrlFor,
} from '../lib/applicationPackages.js';
import { ensurePlaceholderOpportunity, linkOutputToOpportunity } from '../lib/opportunityOutputs.js';
import { getOutputVersionHistory } from '../lib/outputVersionHistory.js';
import { sendFinalizationError, toolsMissingCategory } from '../lib/finalizationGates.js';

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

// Version history of one output's lineage: dates, approvals and every
// version's blocks for the timeline slider / tracked changes (read-only).
router.get('/:id/versions', async (req, res) => {
  try {
    const history = await getOutputVersionHistory(req.user.id, Number(req.params.id));
    if (!history) return res.status(404).json({ error: 'Resume output not found' });
    res.json(history);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {};
  try {
    const projection = await updateProjectionStatus(req.params.id, req.user.id, status);
    res.json({ projection });
  } catch (e) { sendFinalizationError(res, e); }
});

// What stands between this member's outputs and "final" — lets a screen
// prompt before the user clicks Approve, not only after a refusal.
router.get('/finalization-check', async (req, res) => {
  try {
    const tools = await toolsMissingCategory(req.user.id);
    res.json({ ready: tools.length === 0, toolsMissingCategory: tools });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Tailored application packages + QR-gated sharing (2026-10-02) ──────────
// See server/lib/applicationPackages.js. Import never approves anything;
// approval is always this explicit, per-version owner action.
router.post('/import-package', async (req, res) => {
  try {
    const pkg = req.body?.package;
    // linkOpportunity: create (or reuse) a placeholder opportunity from the
    // package's own company + role, validated BEFORE anything is imported so a
    // bad package never half-applies.
    if (req.body?.linkOpportunity && (!String(pkg?.company || '').trim() || !String(pkg?.role || '').trim())) {
      return res.status(400).json({ error: 'linkOpportunity needs the package JSON to carry both "company" and "role". Nothing was imported.' });
    }
    const results = await importApplicationPackage(req.user.id, pkg);
    let opportunity = null;
    if (req.body?.linkOpportunity) {
      try {
        opportunity = await ensurePlaceholderOpportunity(req.user.id, { company: pkg.company, role: pkg.role });
        for (const r of results) await linkOutputToOpportunity(req.user.id, r.id, opportunity.id);
      } catch (e) {
        return res.status(500).json({ error: `The outputs were imported (${results.length}) but linking them to the opportunity failed: ${e.message}. Re-run the import with --link-opportunity to retry; unchanged outputs are skipped.`, results });
      }
    }
    res.status(201).json({ results, opportunity });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/share', async (req, res) => {
  try {
    const shared = await approveOutputForSharing(Number(req.params.id), req.user);
    if (!shared) return res.status(404).json({ error: 'Resume output not found' });
    res.json({ ...shared, url: shareUrlFor(shared.token, req) });
  } catch (e) { sendFinalizationError(res, e); }
});

router.delete('/:id/share', async (req, res) => {
  const ok = await revokeOutputSharing(Number(req.params.id), req.user.id);
  if (!ok) return res.status(404).json({ error: 'Resume output not found' });
  res.json({ ok: true });
});

// Stamped .docx twin of the PDF: true created/modified dates, authors, and (once approved) the slug QR as a
// clickable header image whose hyperlink is the /r/<slug> URL.
router.get('/:id/download.docx', async (req, res) => {
  try {
    const row = await getOwnedOutputWithApprover(Number(req.params.id), req.user.id);
    if (!row) return res.status(404).json({ error: 'Resume output not found' });
    const buffer = await renderProjectionToDocxBuffer(row, { shareUrl: row.share_token ? shareUrlFor(row.share_token, req) : null });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameFor(row).replace(/\.pdf$/, '.docx')}"`);
    res.send(buffer);
  } catch (e) { res.status(400).json({ error: e.message }); }
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
