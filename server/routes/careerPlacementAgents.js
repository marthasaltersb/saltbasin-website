// Career Placement Agents API (2026-08-06, Phase 2 — vertical slice of the
// Salt Basin Weekly Research & Outreach Master Agent spec's career
// pipeline). Member-scoped throughout (requireUser -> req.user.id), same
// auth pattern as career/consent-status and career/catalogs in
// careerMaster.js. Agent *execution* (actual research, scoring, drafting)
// is a later phase — these routes expose the real data model from Phase 1
// (server/lib/opportunityPipelineRegistry.js, careerOpportunityRollups.js)
// so a member can track opportunities and record evidence-backed scores now.
import { Router } from 'express';
import multer from 'multer';
import { requireUser } from '../auth.js';
import { listCareerOpportunities, createCareerOpportunity, recordDimensionScores, getCareerAgentHub } from '../lib/careerOpportunityRollups.js';
import { researchCareerOpportunities } from '../lib/careerResearchAgent.js';
import { generateResumeContent } from '../lib/resumeTargeting.js';
import { createResumeOutputProjection, listResumeOutputProjectionsForOpportunity, listResumeOutputProjections } from '../lib/resumeProjection.js';
import { parseCareerPipelineWorkbook, rowToOpportunityPayload } from '../lib/careerPipelineImport.js';
import { db } from '../db.js';

const router = Router();

const pipelineUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Same ownership-check shape recordDimensionScores() already uses — a
// career_opportunity_target rod's own user_id isn't set, only its parent
// career_master rod's is.
async function requireOwnedOpportunity(userId, rodId) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_opportunity_target'`).get(rodId);
  if (!rod) throw new Error('Career opportunity not found.');
  const careerRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rod.parent_rod_id);
  if (!careerRod || Number(careerRod.user_id) !== Number(userId)) throw new Error('Not your career opportunity.');
  return rod;
}

router.get('/agent-hub', requireUser, async (req, res) => {
  try {
    const hub = await getCareerAgentHub(req.user.id);
    res.json(hub);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/opportunities', requireUser, async (req, res) => {
  try {
    const result = await listCareerOpportunities(req.user.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/opportunities', requireUser, async (req, res) => {
  try {
    const { jobTitle, companyName, url, location, notes } = req.body || {};
    const opportunity = await createCareerOpportunity(req.user.id, { jobTitle, companyName, url, location, notes });
    res.status(201).json(opportunity);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/opportunities/:id/scores', requireUser, async (req, res) => {
  try {
    const { dimensionScores, sourceType, sourceReference, sourceTier } = req.body || {};
    const opportunity = await recordDimensionScores(req.user.id, Number(req.params.id), { dimensionScores, sourceType, sourceReference, sourceTier });
    res.json(opportunity);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Bulk import (2026-08-09) — a member's own real, externally-tracked career
// pipeline spreadsheet, not agent output, so rows are created with
// proposedByAgent: false (same trust level as a manually-added opportunity).
// Reuses the existing createCareerOpportunity write path row-by-row rather
// than a bespoke bulk-insert, so every import goes through the same
// Tributary/rod creation every other opportunity does. Idempotent by
// officialSource URL (falling back to jobTitle+companyName) so re-uploading
// the same workbook doesn't duplicate rows.
router.post('/import', requireUser, (req, res) => {
  pipelineUpload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    try {
      const { rows, error } = parseCareerPipelineWorkbook(req.file.buffer);
      if (error) return res.status(400).json({ error });
      if (!rows.length) return res.status(400).json({ error: 'No usable rows found — every row needs at least a Company and a Role.' });

      const { opportunities: existing } = await listCareerOpportunities(req.user.id);
      const existingKeys = new Set(existing.map((o) => dedupeKey(o.metadata?.officialSource, o.metadata?.jobTitle, o.metadata?.companyName ?? o.entities?.[0]?.canonicalName)));

      let imported = 0, skipped = 0;
      const errors = [];
      for (const row of rows) {
        const payload = rowToOpportunityPayload(row);
        const key = dedupeKey(payload.extraMetadata.officialSource, payload.jobTitle, payload.companyName);
        if (existingKeys.has(key)) { skipped++; continue; }
        try {
          await createCareerOpportunity(req.user.id, payload);
          existingKeys.add(key);
          imported++;
        } catch (e) {
          errors.push({ row: `${payload.companyName} — ${payload.jobTitle}`, error: e.message });
        }
      }
      res.json({ imported, skipped, totalRows: rows.length, errors });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
});

function dedupeKey(officialSource, jobTitle, companyName) {
  if (officialSource) return `url:${String(officialSource).trim().toLowerCase()}`;
  return `pair:${String(companyName || '').trim().toLowerCase()}|${String(jobTitle || '').trim().toLowerCase()}`;
}

// Real, on-demand job research (2026-08-07) — see server/lib/careerResearchAgent.js's
// header for why this is on-demand rather than unattended-scheduled this pass.
router.post('/research', requireUser, async (req, res) => {
  try {
    const created = await researchCareerOpportunities(req.user.id);
    res.json({ opportunities: created });
  } catch (e) {
    res.status(e.status === 429 ? 429 : 400).json({ error: e.message });
  }
});

// Real, evidence-grounded resume generation attached to a specific tracked
// opportunity ("the attached career pipeline lead"). Returns the generated
// content for review — does NOT persist a resume_output_projection until
// the member explicitly approves it via POST /opportunities/:id/resume-outputs.
router.post('/opportunities/:id/generate-resume', requireUser, async (req, res) => {
  try {
    const rod = await requireOwnedOpportunity(req.user.id, Number(req.params.id));
    const metadata = typeof rod.metadata === 'string' ? JSON.parse(rod.metadata) : rod.metadata;
    const jobDescription = req.body?.jobDescription || metadata?.notes || metadata?.jobTitle || '';
    const content = await generateResumeContent(req.user.id, jobDescription);
    res.json({ content, jobDescriptionUsed: jobDescription });
  } catch (e) {
    res.status(e.status === 429 ? 429 : 400).json({ error: e.message });
  }
});

// Approves generated content into a real, persisted resume_output_projections
// row attached to this opportunity — the explicit human approval step.
router.post('/opportunities/:id/resume-outputs', requireUser, async (req, res) => {
  try {
    await requireOwnedOpportunity(req.user.id, Number(req.params.id));
    const { presetId, generatedContent, targetJobDescription } = req.body || {};
    const projection = await createResumeOutputProjection(req.user.id, {
      presetId: presetId || 'agent_generated',
      presetName: 'Agent-Generated Resume',
      careerOpportunityRodId: Number(req.params.id),
      generatedContent,
      targetJobDescription,
    });
    res.status(201).json(projection);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/opportunities/:id/resume-outputs', requireUser, async (req, res) => {
  try {
    await requireOwnedOpportunity(req.user.id, Number(req.params.id));
    const projections = await listResumeOutputProjectionsForOpportunity(req.user.id, Number(req.params.id));
    res.json({ projections });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const PRIORITY_ORDER = ['Very High', 'High', 'Medium', 'Low', 'Monitor'];
function priorityRank(p) {
  const i = PRIORITY_ORDER.indexOf(p);
  return i === -1 ? PRIORITY_ORDER.length : i;
}

// Batch resume generation ("a queue for me to review and iterate," 2026-08-09)
// — unlike the single-opportunity generate-resume route above, this persists
// each result directly as a draft resume_output_projections row rather than
// holding it for a synchronous per-item approval click, since the point of a
// queue is to walk away and come back to review several at once (the
// existing "Resume Output History" list in My Resume, and each output's
// draft/approved/published/archived status there, IS the review/iterate
// surface — nothing here marks anything as human-approved). Always bounded
// by checkAndRecordRunAllowance inside generateResumeContent — a batch that
// hits the daily cap partway through stops and reports what it completed
// rather than failing the whole request.
router.post('/generate-resume-queue', requireUser, async (req, res) => {
  try {
    const limit = Math.min(Number(req.body?.limit) || 10, 25);
    const { opportunities } = await listCareerOpportunities(req.user.id);
    const existingProjections = await listResumeOutputProjections(req.user.id);
    const alreadyGenerated = new Set(existingProjections.map((p) => p.careerOpportunityRodId).filter((id) => id != null));

    const candidates = opportunities
      .filter((o) => !alreadyGenerated.has(o.id))
      .sort((a, b) => {
        const pr = priorityRank(a.metadata?.priority) - priorityRank(b.metadata?.priority);
        if (pr !== 0) return pr;
        return (b.metadata?.betsyScore || 0) - (a.metadata?.betsyScore || 0);
      })
      .slice(0, limit);

    const results = [];
    for (const o of candidates) {
      const jobDescription = o.metadata?.notes || o.metadata?.matchRationale || o.metadata?.jobTitle || '';
      try {
        const content = await generateResumeContent(req.user.id, jobDescription);
        const projection = await createResumeOutputProjection(req.user.id, {
          presetId: 'agent_generated_batch',
          presetName: `Agent-Generated Resume — ${o.metadata?.jobTitle || 'Untitled role'}`,
          careerOpportunityRodId: o.id,
          generatedContent: content,
          targetJobDescription: jobDescription,
        });
        results.push({ opportunityId: o.id, jobTitle: o.metadata?.jobTitle, status: 'generated', projectionId: projection.id });
      } catch (e) {
        results.push({ opportunityId: o.id, jobTitle: o.metadata?.jobTitle, status: 'failed', error: e.message });
        break; // a failure here (cap hit, no key, no Career Master data) is systemic — it would repeat
               // identically for every remaining candidate, so stop rather than burn the rest of the batch.
      }
    }
    res.json({ attempted: results.length, generated: results.filter((r) => r.status === 'generated').length, results });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
