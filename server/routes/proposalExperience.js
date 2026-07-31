// Member Experience Module read/write API (2026-07-29) — serves the guided
// 9-stage Proposal Experience for the CALLING member's own proposal_experience
// Channel Rod. Every route is scoped to req.user.id; there is no orgId/rodId
// path param a member could substitute to reach someone else's rod.
import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { PROPOSAL_JOURNEY_STAGES, PROPOSAL_ACTIONS, recordProposalDecision, reconstructLatestDecision, recordProposalViewEvent, reconstructViewState } from '../lib/proposalExperienceRegistry.js';
import { compileProposalDocument, readRecordAtoms, ILLUSTRATIVE_DISCLAIMER } from '../lib/proposalDocumentProjection.js';

const router = Router();
router.use(requireUser);

async function myRod(userId) {
  const memberRod = await db.prepare(`SELECT id FROM journey_data_rods WHERE rod_type='member' AND user_id=$1`).get(userId);
  if (!memberRod) return null;
  return db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='proposal_experience' AND parent_rod_id=$1`).get(memberRod.id);
}

const evidenceFor = readRecordAtoms;

router.get('/state', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const [decision, viewState, illustrativeRow] = await Promise.all([
    reconstructLatestDecision(rod.id),
    reconstructViewState(rod.id),
    db.prepare(`SELECT 1 FROM journey_rod_evidence WHERE rod_id=$1 AND value->>'illustrativeFlag'='true' LIMIT 1`).get(rod.id),
  ]);
  const illustrative = Boolean(illustrativeRow);
  res.json({
    rodId: rod.id,
    currentStage: rod.current_stage,
    stages: PROPOSAL_JOURNEY_STAGES,
    actions: PROPOSAL_ACTIONS,
    decision,
    viewState,
    illustrative,
    // AC14 — the interactive projection shows the same disclaimer string the
    // executive/PDF projection uses, so the two can never drift apart.
    disclaimer: illustrative ? ILLUSTRATIVE_DISCLAIMER : null,
  });
});

router.get('/highways', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  res.json({ highways: await evidenceFor(rod.id, 'highway') });
});

router.get('/sections', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const [sections, scenes] = await Promise.all([evidenceFor(rod.id, 'proposal_section'), evidenceFor(rod.id, 'sales_narrative_scene')]);
  res.json({ sections: sections.sort((a, b) => (a.presentationOrder || 0) - (b.presentationOrder || 0)), scenes: scenes.sort((a, b) => (a.sequence || 0) - (b.sequence || 0)) });
});

router.get('/diagnostic', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const modules = await evidenceFor(rod.id, 'diagnostic_module');
  res.json({ modules: modules.sort((a, b) => (a.sequence || 0) - (b.sequence || 0)) });
});

router.get('/opportunity', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const [scenarios, evidence] = await Promise.all([evidenceFor(rod.id, 'opportunity_scenario'), evidenceFor(rod.id, 'evidence_item')]);
  const evidenceById = Object.fromEntries(evidence.map((e) => [e.id, e]));
  res.json({
    scenarios: scenarios.map((s) => ({ ...s, evidence: (s.evidenceIds || []).map((id) => evidenceById[id]).filter(Boolean) })),
  });
});

router.get('/evidence', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  res.json({ evidence: await evidenceFor(rod.id, 'evidence_item') });
});

router.post('/events/stage-viewed', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const { stageId } = req.body || {};
  if (!stageId) return res.status(400).json({ error: 'stageId is required' });
  if (!PROPOSAL_JOURNEY_STAGES.some((s) => s.stageId === stageId)) return res.status(400).json({ error: `unknown stageId "${stageId}"` });
  await db.prepare(`UPDATE journey_data_rods SET current_stage=$1, updated_at=$2 WHERE id=$3`).run(stageId, Date.now(), rod.id);
  const result = await recordProposalViewEvent(rod.id, 'stage_viewed', { stageId });
  res.json({ ok: true, ...result });
});

router.post('/events/scenario-expanded', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const { scenarioId } = req.body || {};
  if (!scenarioId) return res.status(400).json({ error: 'scenarioId is required' });
  const result = await recordProposalViewEvent(rod.id, 'scenario_expanded', { metadata: { scenarioId } });
  res.json({ ok: true, ...result });
});

router.post('/events/evidence-opened', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const { evidenceId } = req.body || {};
  if (!evidenceId) return res.status(400).json({ error: 'evidenceId is required' });
  const result = await recordProposalViewEvent(rod.id, 'evidence_opened', { metadata: { evidenceId } });
  res.json({ ok: true, ...result });
});

// Executive/PDF projection — compiled on read from the rod's own evidence and
// event log, so it always reflects current state (nothing is cached or stored).
router.get('/document', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  res.json(await compileProposalDocument(rod.id));
});

const DECISION_OPTIONS = ['proceed', 'discuss', 'revise', 'decline'];
router.post('/decision', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const { option, rationale } = req.body || {};
  if (!DECISION_OPTIONS.includes(option)) return res.status(400).json({ error: `option must be one of ${DECISION_OPTIONS.join(', ')}` });
  const nextRoute = '/workspace';
  const result = await recordProposalDecision(rod.id, { option, rationale: rationale || null, actorUserId: req.user.id, nextRoute });
  await db.prepare(`UPDATE journey_data_rods SET current_stage='J09', updated_at=$1 WHERE id=$2`).run(Date.now(), rod.id);
  res.json({ ok: true, ...result });
});

export default router;
