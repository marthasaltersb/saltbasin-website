// Cover-letter agent + application-package API (2026-10-02) — member-scoped.
// Approving/publishing a cover letter or a combined package is NOT done here: it uses the
// existing PATCH /api/resume-outputs/:id/status and POST /api/resume-outputs/:id/share, which
// run assertReadyToFinalize on the server.
import express from 'express';
import { requireUser } from '../auth.js';
import { listCareerOpportunities } from '../lib/careerOpportunityRollups.js';
import { ensureCoverLetterForOpportunity, latestAutoDraftError, loadOpportunity, setJobRecText } from '../lib/coverLetterAutoDraft.js';
import { getSettings, saveSettings, PROVIDERS, PLACEHOLDERS, DEFAULT_SETTINGS } from '../lib/coverLetterTemplate.js';
import { openLetter, listTurns, runTurn, decideTurn, metricsSummary, AgentRequestError } from '../lib/coverLetterAgent.js';
import { assembleApplicationPackage, peekOpportunityPackage } from '../lib/packageAssembly.js';

const router = express.Router();
router.use(requireUser);

function fail(res, e) {
  const status = e instanceof AgentRequestError ? e.status : e.status && e.status >= 400 && e.status < 600 ? e.status : 400;
  res.status(status).json({ error: e.message });
}

const rowView = (r) => (r ? { id: Number(r.id), name: r.preset_name, status: r.output_status, outputType: r.output_type, createdAt: Number(r.created_at), approvedAt: r.approved_at != null ? Number(r.approved_at) : null } : null);

router.get('/settings', async (req, res) => {
  try {
    res.json({ settings: await getSettings(req.user.id), providers: PROVIDERS, placeholders: PLACEHOLDERS, defaults: DEFAULT_SETTINGS });
  } catch (e) { fail(res, e); }
});

router.put('/settings', async (req, res) => {
  try {
    res.json({ settings: await saveSettings(req.user.id, req.body?.settings) });
  } catch (e) { fail(res, e); }
});

// Tracked opportunities with their cover letter + package state. Read-only.
router.get('/opportunities', async (req, res) => {
  try {
    const { opportunities } = await listCareerOpportunities(req.user.id);
    const out = [];
    for (const o of opportunities) {
      const peek = await peekOpportunityPackage(req.user.id, o.id);
      out.push({
        id: o.id, stage: o.currentStage, jobTitle: o.metadata?.jobTitle || '', company: o.entities?.[0]?.canonicalName || '',
        hasJobRecText: !!o.metadata?.notes, jobRecText: o.metadata?.notes || '',
        letter: rowView(peek.letter), resumes: peek.resumes.map(rowView),
        combined: rowView(peek.combined), combinedCurrent: peek.combinedCurrent,
        autoDraftError: peek.letter ? null : await latestAutoDraftError(o.id),
      });
    }
    res.json({ opportunities: out });
  } catch (e) { fail(res, e); }
});

router.put('/opportunities/:id/job-rec', async (req, res) => {
  try { res.json(await setJobRecText(req.user.id, Number(req.params.id), req.body?.text)); } catch (e) { fail(res, e); }
});

router.post('/opportunities/:id/cover-letter', async (req, res) => {
  try {
    await loadOpportunity(req.user.id, Number(req.params.id));
    const result = await ensureCoverLetterForOpportunity(req.user.id, Number(req.params.id), { force: !!req.body?.force });
    res.status(result.created ? 201 : 200).json({ created: result.created, letter: rowView(result.row) });
  } catch (e) { fail(res, e); }
});

router.post('/opportunities/:id/package', async (req, res) => {
  try {
    await loadOpportunity(req.user.id, Number(req.params.id));
    const result = await assembleApplicationPackage(req.user.id, { opportunityRodId: Number(req.params.id) });
    res.status(result.status === 'unchanged' ? 200 : 201).json({ status: result.status, sections: result.sections, package: rowView(result.row) });
  } catch (e) { fail(res, e); }
});

router.post('/packages/assemble', async (req, res) => {
  try {
    const key = String(req.body?.packageKey || '');
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(key)) return res.status(400).json({ error: 'packageKey must be a lowercase slug.' });
    const result = await assembleApplicationPackage(req.user.id, { packageKey: key });
    res.status(result.status === 'unchanged' ? 200 : 201).json({ status: result.status, sections: result.sections, package: rowView(result.row) });
  } catch (e) { fail(res, e); }
});

router.get('/letters/:id', async (req, res) => {
  try { res.json(await openLetter(req.user.id, Number(req.params.id))); } catch (e) { fail(res, e); }
});

router.get('/letters/:id/turns', async (req, res) => {
  try { res.json({ turns: await listTurns(req.user.id, Number(req.params.id)) }); } catch (e) { fail(res, e); }
});

router.post('/letters/:id/turns', async (req, res) => {
  try {
    const turn = await runTurn(req.user.id, { projectionId: Number(req.params.id), request: req.body?.request, sessionKey: req.body?.sessionKey });
    res.status(201).json({ turn });
  } catch (e) { fail(res, e); }
});

router.post('/turns/:id/accept', async (req, res) => {
  try { res.json(await decideTurn(req.user.id, Number(req.params.id), 'accept')); } catch (e) { fail(res, e); }
});

router.post('/turns/:id/reject', async (req, res) => {
  try { res.json(await decideTurn(req.user.id, Number(req.params.id), 'reject')); } catch (e) { fail(res, e); }
});

router.get('/metrics', async (req, res) => {
  try { res.json(await metricsSummary(req.user.id, { sessionKey: req.query.sessionKey ? String(req.query.sessionKey) : null })); } catch (e) { fail(res, e); }
});

export default router;
