// Lonetree MVP demo API (2026-07-29) — read-only surface over the seeded
// Fund/PortCo demo dataset (server/scripts/seedLonetreeMvpFund.js) and the
// reconciliation engine (server/lib/lonetreeReconciliation.js). Was
// admin-only; opened to any authenticated user (2026-07-29, Member Experience
// Module) per Betsy's direction that this demo tab now also surfaces inside
// the member interface, alongside the new guided Proposal Experience.
import express from 'express';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { computePortcoCommercialReconciliation, computeFundEconomics, traceMetricLineage, traceEnterpriseValueDrivers, computeSignalPropagationDemonstration } from '../lib/lonetreeReconciliation.js';
import { LONETREE_PROSPECT_EXPERIENCE, validateLonetreeProspectExperience } from '../../src/config/visual/lonetreeProspectExperience.js';

const router = express.Router();
const prospectPackagePath = fileURLToPath(new URL('../assets/lonetree-proposal/Salt_Basin_LoneTree_Prospect_Experience_v5.zip', import.meta.url));
const prospectHtmlPath = fileURLToPath(new URL('../assets/lonetree-proposal/OPEN_SALT_BASIN_EXPERIENCE.html', import.meta.url));

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

async function requirePlatformAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  if (user.role !== 'admin') { res.status(403).json({ error: 'Admin access is required to save or publish proposal configuration changes.' }); return null; }
  return user;
}

const proposalConfigRowId = (userId, kind) => `prospect-proposal:${Number(userId)}:${kind}`;

async function readProposalConfig(userId, kind) {
  const row = await db.prepare('SELECT data, updated_at FROM config_state WHERE id=$1').get(proposalConfigRowId(userId, kind));
  if (!row) {
    if (kind === 'draft') return readProposalConfig(userId, 'published');
    return { value: LONETREE_PROSPECT_EXPERIENCE, source: 'default', updatedAt: null };
  }
  try {
    const value = JSON.parse(row.data);
    const errors = validateLonetreeProspectExperience(value);
    if (!errors.length) return { value, source: kind, updatedAt: Number(row.updated_at) };
    return { value: LONETREE_PROSPECT_EXPERIENCE, source: 'default', updatedAt: null, invalidStoredValueErrors: errors };
  } catch {
    return { value: LONETREE_PROSPECT_EXPERIENCE, source: 'default', updatedAt: null, invalidStoredValueErrors: ['Stored proposal configuration is not valid JSON.'] };
  }
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

router.get('/prospect-package', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  res.download(prospectPackagePath, 'Salt_Basin_LoneTree_Prospect_Experience_v5.zip');
});

router.get('/prospect-html', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  res.sendFile(prospectHtmlPath);
});

router.get('/proposal-config', async (req, res) => {
  const user = await requireAdmin(req, res); if (!user) return;
  res.json({ prospect: { id: user.id, email: user.email, displayName: user.displayName }, ...(await readProposalConfig(user.id, 'published')) });
});

router.get('/admin/prospects', async (req, res) => {
  const admin = await requirePlatformAdmin(req, res); if (!admin) return;
  const prospects = await db.prepare(`
    SELECT DISTINCT u.id, u.email, u.display_name
      FROM users u
      JOIN journey_data_rods member_rod ON member_rod.user_id=u.id AND member_rod.rod_type='member'
      JOIN journey_data_rods proposal_rod ON proposal_rod.parent_rod_id=member_rod.id AND proposal_rod.rod_type='proposal_experience'
     WHERE u.role='member'
     ORDER BY u.display_name NULLS LAST, u.email
  `).all();
  res.json({ prospects: prospects.map((p) => ({ id: Number(p.id), email: p.email, displayName: p.display_name || p.email })) });
});

router.get('/admin/prospects/:userId/proposal-config', async (req, res) => {
  const admin = await requirePlatformAdmin(req, res); if (!admin) return;
  const prospect = await db.prepare(`SELECT id, email, display_name FROM users WHERE id=$1 AND role='member'`).get(Number(req.params.userId));
  if (!prospect) return res.status(404).json({ error: 'Prospect member not found' });
  const kind = req.query.kind === 'published' ? 'published' : 'draft';
  res.json({ prospect: { id: Number(prospect.id), email: prospect.email, displayName: prospect.display_name || prospect.email }, kind, ...(await readProposalConfig(prospect.id, kind)) });
});

router.put('/admin/prospects/:userId/proposal-config/draft', async (req, res) => {
  const admin = await requirePlatformAdmin(req, res); if (!admin) return;
  const prospect = await db.prepare(`SELECT id FROM users WHERE id=$1 AND role='member'`).get(Number(req.params.userId));
  if (!prospect) return res.status(404).json({ error: 'Prospect member not found' });
  const errors = validateLonetreeProspectExperience(req.body?.value);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  const now = Date.now();
  await db.prepare(`INSERT INTO config_state (id,data,updated_at) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET data=$2,updated_at=$3`).run(proposalConfigRowId(prospect.id, 'draft'), JSON.stringify(req.body.value), now);
  res.json({ ok: true, value: req.body.value, updatedAt: now });
});

router.post('/admin/prospects/:userId/proposal-config/publish', async (req, res) => {
  const admin = await requirePlatformAdmin(req, res); if (!admin) return;
  const draft = await readProposalConfig(Number(req.params.userId), 'draft');
  const errors = validateLonetreeProspectExperience(draft.value);
  if (errors.length) return res.status(400).json({ error: 'Draft validation failed', details: errors });
  const now = Date.now();
  await db.prepare(`INSERT INTO config_state (id,data,updated_at) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET data=$2,updated_at=$3`).run(proposalConfigRowId(req.params.userId, 'published'), JSON.stringify(draft.value), now);
  res.json({ ok: true, value: draft.value, updatedAt: now });
});

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
