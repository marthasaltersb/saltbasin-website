// Career Placement Agents API (2026-08-06, Phase 2 — vertical slice of the
// Salt Basin Weekly Research & Outreach Master Agent spec's career
// pipeline). Member-scoped throughout (requireUser -> req.user.id), same
// auth pattern as career/consent-status and career/catalogs in
// careerMaster.js. Agent *execution* (actual research, scoring, drafting)
// is a later phase — these routes expose the real data model from Phase 1
// (server/lib/opportunityPipelineRegistry.js, careerOpportunityRollups.js)
// so a member can track opportunities and record evidence-backed scores now.
import { Router } from 'express';
import { requireUser } from '../auth.js';
import { listCareerOpportunities, createCareerOpportunity, recordDimensionScores, getCareerAgentHub } from '../lib/careerOpportunityRollups.js';
import { researchCareerOpportunities } from '../lib/careerResearchAgent.js';
import { generateResumeContent } from '../lib/resumeTargeting.js';
import { createResumeOutputProjection, listResumeOutputProjectionsForOpportunity } from '../lib/resumeProjection.js';
import { db } from '../db.js';

const router = Router();

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

export default router;
