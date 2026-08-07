// Commercial Opportunity Pipeline API (2026-08-06, Phase 3 — vertical slice
// of the Weekly Research & Outreach spec's commercial pipeline, mirroring
// careerPlacementAgents.js for the other pipeline). Admin-scoped
// (requireAdmin): this is Salt Basin's own business-development pipeline,
// not member self-service, so it lives on the admin side rather than
// requireUser. Agent *execution* is a later phase — these routes expose the
// real Phase 1 data model so an admin can track opportunities and record
// evidence-backed scores now.
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { listCommercialOpportunities, createCommercialOpportunity, recordCommercialDimensionScores, getCommercialAgentHub } from '../lib/commercialOpportunityRollups.js';

const router = Router();

router.get('/agent-hub', requireAdmin, async (req, res) => {
  try {
    const hub = await getCommercialAgentHub(req.user.id);
    res.json(hub);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/opportunities', requireAdmin, async (req, res) => {
  try {
    const result = await listCommercialOpportunities(req.user.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/opportunities', requireAdmin, async (req, res) => {
  try {
    const { companyName, eventTrigger, hypothesis, expansionRing, parentEntityName, reason } = req.body || {};
    const opportunity = await createCommercialOpportunity(req.user.id, { companyName, eventTrigger, hypothesis, expansionRing, parentEntityName, reason });
    res.status(201).json(opportunity);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/opportunities/:id/scores', requireAdmin, async (req, res) => {
  try {
    const { dimensionScores, sourceType, sourceReference, sourceTier } = req.body || {};
    const opportunity = await recordCommercialDimensionScores(req.user.id, Number(req.params.id), { dimensionScores, sourceType, sourceReference, sourceTier });
    res.json(opportunity);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
