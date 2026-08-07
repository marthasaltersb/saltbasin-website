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

const router = Router();

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

export default router;
