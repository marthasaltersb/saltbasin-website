// Lonetree MVP demo API (2026-07-29) — read-only surface over the seeded
// Fund/PortCo demo dataset (server/scripts/seedLonetreeMvpFund.js) and the
// reconciliation engine (server/lib/lonetreeReconciliation.js). Was
// admin-only; opened to any authenticated user (2026-07-29, Member Experience
// Module) per Betsy's direction that this demo tab now also surfaces inside
// the member interface, alongside the new guided Proposal Experience.
import express from 'express';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { computePortcoCommercialReconciliation, computeFundEconomics, traceMetricLineage, traceEnterpriseValueDrivers, computeSignalPropagationDemonstration } from '../lib/lonetreeReconciliation.js';

const router = express.Router();

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

async function getEvidenceRows(rodId, moleculeKey) {
  const rows = await db.prepare(
    `SELECT source_reference, value, confidence, observed_at FROM journey_rod_evidence WHERE rod_id=$1 AND molecule_key=$2 ORDER BY observed_at ASC`
  ).all(rodId, moleculeKey);
  return rows.map((r) => ({
    sourceReference: r.source_reference,
    value: r.value, // journey_rod_evidence.value is JSONB — postgres.js already deserializes it; re-parsing a plain string throws.
    confidence: r.confidence === null ? null : Number(r.confidence),
    observedAt: Number(r.observed_at),
  }));
}

async function findDemoRods() {
  const fundRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='fund_deal' ORDER BY id ASC LIMIT 1`).get();
  if (!fundRod) return { fundRod: null, portcoRod: null };
  const portcoRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='portfolio_company' AND parent_rod_id=$1 LIMIT 1`).get(fundRod.id);
  return { fundRod, portcoRod };
}

router.get('/summary', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { fundRod, portcoRod } = await findDemoRods();
  if (!fundRod) return res.status(404).json({ error: 'Lonetree demo not seeded — run node server/scripts/seedLonetreeMvpFund.js' });
  const [targets, theses, signals, hypotheses, initiatives] = await Promise.all([
    getEvidenceRows(fundRod.id, 'market_target'),
    getEvidenceRows(fundRod.id, 'investment_thesis'),
    getEvidenceRows(portcoRod.id, 'signal_type'),
    getEvidenceRows(portcoRod.id, 'hypothesis_status'),
    getEvidenceRows(portcoRod.id, 'fund_value_creation_initiative'),
  ]);
  res.json({
    fund: { id: fundRod.id, name: fundRod.metadata?.entityName, currentStage: fundRod.current_stage },
    portco: { id: portcoRod.id, name: portcoRod.metadata?.entityName, currentStage: portcoRod.current_stage },
    targetCount: targets.length,
    targets: targets.map((t) => ({ targetId: t.sourceReference, name: t.value?.Target_Name, sector: t.value?.Sector, compositeScore: t.value?.Composite_Score, decision: t.value?.Decision })),
    thesisCount: theses.filter((t) => !t.sourceReference.startsWith('diligence-')).length,
    openSignalCount: signals.length,
    hypothesisCount: hypotheses.length,
    valueCreationInitiativeCount: initiatives.length,
  });
});

router.get('/reconciliation', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { portcoRod } = await findDemoRods();
  if (!portcoRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  res.json(await computePortcoCommercialReconciliation(portcoRod.id));
});

router.get('/fund-economics', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { fundRod, portcoRod } = await findDemoRods();
  if (!fundRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  res.json(await computeFundEconomics(fundRod.id, portcoRod.id));
});

router.get('/signals', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { portcoRod } = await findDemoRods();
  if (!portcoRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  const [types, variances, confidences, statuses, structures] = await Promise.all([
    getEvidenceRows(portcoRod.id, 'signal_type'),
    getEvidenceRows(portcoRod.id, 'signal_variance'),
    getEvidenceRows(portcoRod.id, 'signal_confidence'),
    getEvidenceRows(portcoRod.id, 'signal_status'),
    getEvidenceRows(portcoRod.id, 'signal_affected_structures'),
  ]);
  const byRef = (rows) => Object.fromEntries(rows.map((r) => [r.sourceReference, r]));
  const variancesByRef = byRef(variances), confidencesByRef = byRef(confidences), statusesByRef = byRef(statuses), structuresByRef = byRef(structures);
  res.json(types.map((t) => ({
    signalId: t.sourceReference,
    type: t.value,
    magnitude: variancesByRef[t.sourceReference]?.value ?? null,
    confidence: confidencesByRef[t.sourceReference]?.value ?? null,
    status: statusesByRef[t.sourceReference]?.value ?? null,
    ...(structuresByRef[t.sourceReference]?.value || {}),
  })));
});

router.get('/hypotheses', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { portcoRod } = await findDemoRods();
  if (!portcoRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  const [statements, signalsList, causes, statuses, confidences] = await Promise.all([
    getEvidenceRows(portcoRod.id, 'hypothesis_statement'),
    getEvidenceRows(portcoRod.id, 'hypothesis_supporting_signals'),
    getEvidenceRows(portcoRod.id, 'hypothesis_probable_causes'),
    getEvidenceRows(portcoRod.id, 'hypothesis_status'),
    getEvidenceRows(portcoRod.id, 'hypothesis_confidence'),
  ]);
  const byRef = (rows) => Object.fromEntries(rows.map((r) => [r.sourceReference, r.value]));
  const signalsByRef = byRef(signalsList), causesByRef = byRef(causes), statusesByRef = byRef(statuses), confidencesByRef = byRef(confidences);
  res.json(statements.map((s) => ({
    hypothesisId: s.sourceReference,
    statement: s.value,
    supportingSignals: signalsByRef[s.sourceReference] ?? null,
    alternativeExplanations: causesByRef[s.sourceReference] ?? null,
    status: statusesByRef[s.sourceReference] ?? null,
    confidence: confidencesByRef[s.sourceReference] ?? null,
  })));
});

router.get('/theses', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { fundRod, portcoRod } = await findDemoRods();
  if (!fundRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  const [theses, initiatives] = await Promise.all([
    getEvidenceRows(fundRod.id, 'investment_thesis'),
    getEvidenceRows(portcoRod.id, 'fund_value_creation_initiative'),
  ]);
  const realTheses = theses.filter((t) => !t.sourceReference.startsWith('diligence-'));
  const diligenceItems = theses.filter((t) => t.sourceReference.startsWith('diligence-'));
  res.json(realTheses.map((t) => ({
    thesisId: t.sourceReference,
    name: t.value.Thesis_Name,
    statement: t.value.Thesis_Statement,
    pillar: t.value.Value_Creation_Pillar,
    status: t.value.Status,
    confidence: t.confidence,
    linkedInitiatives: initiatives.filter((i) => i.value.Linked_Thesis_ID === t.sourceReference).map((i) => ({ initiativeId: i.sourceReference, name: i.value.Initiative_Name, status: i.value.Status })),
    linkedDiligence: diligenceItems.filter((d) => d.value.Linked_Thesis_ID === t.sourceReference).map((d) => ({ diligenceId: d.value.Diligence_ID, question: d.value.Question, status: d.value.Status, confidence: d.confidence })),
  })));
});

router.get('/value-creation', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { portcoRod } = await findDemoRods();
  if (!portcoRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  res.json((await getEvidenceRows(portcoRod.id, 'fund_value_creation_initiative')).map((r) => ({ initiativeId: r.sourceReference, confidence: r.confidence, ...r.value })));
});

const INITIATIVE_STATUS_STEPS = ['Planned', 'In Progress', 'Complete'];

// Real-time editable action (per Betsy 2026-07-29: "provide prompted user
// actions to update data elements in real time") — advances a value-creation
// initiative's Status one step and persists it to journey_rod_evidence, the
// same evidence row the read routes above already serve from. Scoped to
// Status only (not a generic field editor) since that's the one element the
// Enterprise Objectives panel actually surfaces as actionable.
router.patch('/value-creation/:initiativeId/advance', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { portcoRod } = await findDemoRods();
  if (!portcoRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  const row = await db.prepare(
    `SELECT id, value, confidence, observed_at FROM journey_rod_evidence WHERE rod_id=$1 AND molecule_key='fund_value_creation_initiative' AND source_reference=$2`
  ).get(portcoRod.id, req.params.initiativeId);
  if (!row) return res.status(404).json({ error: `Initiative ${req.params.initiativeId} not found` });

  const currentIdx = INITIATIVE_STATUS_STEPS.indexOf(row.value.Status);
  if (currentIdx === -1 || currentIdx >= INITIATIVE_STATUS_STEPS.length - 1) {
    return res.status(400).json({ error: `Cannot advance from status "${row.value.Status}"` });
  }
  const nextStatus = INITIATIVE_STATUS_STEPS[currentIdx + 1];
  const nextValue = { ...row.value, Status: nextStatus };
  await db.prepare(`UPDATE journey_rod_evidence SET value=$1::jsonb WHERE id=$2`).run(nextValue, row.id);
  res.json({ initiativeId: req.params.initiativeId, previousStatus: row.value.Status, status: nextStatus });
});

router.get('/trace-ev-drivers', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { fundRod, portcoRod } = await findDemoRods();
  if (!fundRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  res.json(await traceEnterpriseValueDrivers(fundRod.id, portcoRod.id));
});

router.get('/demonstration', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { fundRod, portcoRod } = await findDemoRods();
  if (!fundRod || !portcoRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  const result = await computeSignalPropagationDemonstration(fundRod.id, portcoRod.id, req.query.signalId || null);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json(result);
});

router.get('/trace/:metric', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  const { portcoRod } = await findDemoRods();
  if (!portcoRod) return res.status(404).json({ error: 'Lonetree demo not seeded' });
  res.json(await traceMetricLineage(portcoRod.id, req.params.metric));
});

export default router;
