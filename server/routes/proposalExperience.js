// Member Experience Module read/write API (2026-07-29) — serves the guided
// 9-stage Proposal Experience for the CALLING member's own proposal_experience
// Channel Rod. Every route is scoped to req.user.id; there is no orgId/rodId
// path param a member could substitute to reach someone else's rod.
import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { PROPOSAL_JOURNEY_STAGES, PROPOSAL_ACTIONS, recordProposalDecision, reconstructLatestDecision, recordProposalViewEvent, reconstructViewState } from '../lib/proposalExperienceRegistry.js';
import { compileProposalDocument, readRecordAtoms, ILLUSTRATIVE_DISCLAIMER } from '../lib/proposalDocumentProjection.js';
import { dispatchRaw } from '../lib/email.js';
import { createTextPdf } from '../lib/simplePdf.js';

const router = Router();
router.use(requireUser);

async function myRod(userId) {
  const memberRod = await db.prepare(`SELECT id FROM journey_data_rods WHERE rod_type='member' AND user_id=$1`).get(userId);
  if (!memberRod) return null;
  return db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='proposal_experience' AND parent_rod_id=$1`).get(memberRod.id);
}

async function myDeliveredVersion(userId, versionId = null) {
  const rod = await myRod(userId);
  if (!rod) return { rod: null, version: null };
  const version = versionId
    ? await db.prepare(`SELECT * FROM proposal_versions WHERE id=$1 AND rod_id=$2`).get(versionId, rod.id)
    : await db.prepare(`SELECT * FROM proposal_versions WHERE rod_id=$1 AND status IN ('delivered','approved','contracted') ORDER BY version_number DESC LIMIT 1`).get(rod.id);
  return { rod, version };
}

const evidenceFor = readRecordAtoms;

router.get('/state', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const [decision, viewState, illustrativeRow, activeVersion] = await Promise.all([
    reconstructLatestDecision(rod.id),
    reconstructViewState(rod.id),
    db.prepare(`SELECT 1 FROM journey_rod_evidence WHERE rod_id=$1 AND value->>'illustrativeFlag'='true' LIMIT 1`).get(rod.id),
    db.prepare(`SELECT id,version_number,status,proposal_class,approval_caveat,delivered_at FROM proposal_versions WHERE rod_id=$1 AND status IN ('delivered','approved','contracted') ORDER BY version_number DESC LIMIT 1`).get(rod.id),
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
    activeVersion,
  });
});

router.get('/versions', async (req, res) => {
  const rod = await myRod(req.user.id);
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const versions = await db.prepare(`SELECT id,version_number,status,proposal_class,approval_caveat,approved_at,delivered_at,archived_at,created_at,updated_at FROM proposal_versions WHERE rod_id=$1 ORDER BY version_number DESC`).all(rod.id);
  res.json({ versions });
});

router.get('/admin/:userId/versions', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  const rod = await myRod(Number(req.params.userId));
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const versions = await db.prepare(`SELECT id,version_number,status,proposal_class,approval_caveat,approved_at,delivered_at,archived_at,created_at,updated_at FROM proposal_versions WHERE rod_id=$1 ORDER BY version_number DESC`).all(rod.id);
  res.json({ versions });
});

router.get('/feedback', async (req, res) => {
  const { version } = await myDeliveredVersion(req.user.id, req.query.versionId ? Number(req.query.versionId) : null);
  if (!version) return res.json({ version: null, feedback: [] });
  const feedback = await db.prepare(`SELECT id,component_key,visual_layer_key,entry_type,body,context,status,published_at,created_at,updated_at FROM proposal_feedback_entries WHERE proposal_version_id=$1 AND user_id=$2 ORDER BY updated_at DESC`).all(version.id, req.user.id);
  res.json({ version: { id: version.id, versionNumber: version.version_number }, feedback });
});

router.post('/feedback', async (req, res) => {
  const { versionId, componentKey, visualLayerKey, entryType = 'comment', body, context = {} } = req.body || {};
  const { version } = await myDeliveredVersion(req.user.id, Number(versionId));
  if (!version) return res.status(404).json({ error: 'proposal version not found' });
  if (!componentKey || !String(body || '').trim()) return res.status(400).json({ error: 'componentKey and body are required' });
  const now = Date.now();
  const result = await db.prepare(`INSERT INTO proposal_feedback_entries (proposal_version_id,user_id,component_key,visual_layer_key,entry_type,body,context,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8,$8) RETURNING id`).run(version.id, req.user.id, componentKey, visualLayerKey || null, entryType, String(body).trim(), context, now);
  res.status(201).json({ ok: true, id: Number(result.lastInsertRowid), status: 'draft' });
});

router.post('/feedback/publish', async (req, res) => {
  const { versionId } = req.body || {};
  const { version } = await myDeliveredVersion(req.user.id, Number(versionId));
  if (!version) return res.status(404).json({ error: 'proposal version not found' });
  const now = Date.now();
  const result = await db.prepare(`UPDATE proposal_feedback_entries SET status='published',published_at=$1,updated_at=$1 WHERE proposal_version_id=$2 AND user_id=$3 AND status='draft'`).run(now, version.id, req.user.id);
  res.json({ ok: true, published: result.changes || 0 });
});

router.post('/admin/:userId/versions', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  const rod = await myRod(Number(req.params.userId));
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const latest = await db.prepare(`SELECT COALESCE(MAX(version_number),0) AS n FROM proposal_versions WHERE rod_id=$1`).get(rod.id);
  const now = Date.now();
  const result = await db.prepare(`INSERT INTO proposal_versions (rod_id,version_number,status,proposal_class,snapshot,approval_caveat,created_by,created_at,updated_at) VALUES ($1,$2,'draft',$3,$4,$5,$6,$7,$7) RETURNING id`).run(rod.id, Number(latest.n) + 1, req.body?.proposalClass === 'final' ? 'final' : 'budgetary', req.body?.snapshot || {}, req.body?.approvalCaveat || null, req.user.id, now);
  res.status(201).json({ ok: true, id: Number(result.lastInsertRowid), versionNumber: Number(latest.n) + 1 });
});

router.post('/admin/:userId/compile', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  const rod = await myRod(Number(req.params.userId));
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const [document, config] = await Promise.all([
    compileProposalDocument(rod.id),
    db.prepare(`SELECT data FROM member_configs WHERE user_id=$1 AND kind='draft'`).get(Number(req.params.userId)),
  ]);
  const latest = await db.prepare(`SELECT COALESCE(MAX(version_number),0) AS n FROM proposal_versions WHERE rod_id=$1`).get(rod.id);
  const now = Date.now();
  const proposalClass = req.body?.proposalClass === 'final' ? 'final' : 'budgetary';
  const snapshot = { compiledBy: 'proposal-metadata-compiler-v1', prompt: String(req.body?.prompt || '').slice(0, 2000), document, visualConfig: config?.data ? JSON.parse(config.data) : {}, compiledAt: now, commercialTerms: req.body?.commercialTerms || {}, performanceObligations: req.body?.performanceObligations || [] };
  const result = await db.prepare(`INSERT INTO proposal_versions (rod_id,version_number,status,proposal_class,snapshot,approval_caveat,created_by,created_at,updated_at) VALUES ($1,$2,'draft',$3,$4,$5,$6,$7,$7) RETURNING id`).run(rod.id, Number(latest.n) + 1, proposalClass, snapshot, proposalClass === 'budgetary' ? 'Modeled options only; subject to final commercial approval.' : null, req.user.id, now);
  res.status(201).json({ ok: true, id: Number(result.lastInsertRowid), versionNumber: Number(latest.n) + 1, compiler: snapshot.compiledBy });
});

router.post('/admin/:userId/versions/:versionId/deliver', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  const rod = await myRod(Number(req.params.userId));
  if (!rod) return res.status(404).json({ error: 'proposal_experience rod not found' });
  const candidate = await db.prepare(`SELECT proposal_class,status FROM proposal_versions WHERE id=$1 AND rod_id=$2`).get(Number(req.params.versionId), rod.id);
  if (candidate?.proposal_class === 'final' && candidate.status !== 'approved') return res.status(409).json({ error: 'final proposals require approval before delivery' });
  const now = Date.now();
  await db.prepare(`UPDATE proposal_versions SET status='archived',archived_at=$1,updated_at=$1 WHERE rod_id=$2 AND status='delivered' AND id<>$3`).run(now, rod.id, Number(req.params.versionId));
  const result = await db.prepare(`UPDATE proposal_versions SET status='delivered',approved_by=$1,approved_at=COALESCE(approved_at,$2),delivered_at=$2,updated_at=$2 WHERE id=$3 AND rod_id=$4 AND status IN ('draft','approved')`).run(req.user.id, now, Number(req.params.versionId), rod.id);
  if (!result.changes) return res.status(409).json({ error: 'version cannot be delivered' });
  await db.prepare(`INSERT INTO proposal_collaborators (proposal_version_id,user_id,rights,notified_at,created_at) VALUES ($1,$2,$3,$4,$4) ON CONFLICT (proposal_version_id,user_id) DO UPDATE SET rights=EXCLUDED.rights,notified_at=EXCLUDED.notified_at`).run(Number(req.params.versionId), Number(req.params.userId), ['view','comment'], now);
  const recipient = await db.prepare(`SELECT id,email,display_name FROM users WHERE id=$1`).get(Number(req.params.userId));
  const lead = await db.prepare(`SELECT id FROM leads WHERE converted_user_id=$1 ORDER BY updated_at DESC LIMIT 1`).get(Number(req.params.userId));
  const document = await compileProposalDocument(rod.id);
  const versionNumber = (await db.prepare(`SELECT version_number,proposal_class,approval_caveat FROM proposal_versions WHERE id=$1`).get(Number(req.params.versionId)));
  const proposalUrl = `${process.env.PUBLIC_BASE_URL || 'https://saltbasin.net'}/member?workspace=1&tab=proposal-experience`;
  const lines = [
    `Proposal version ${versionNumber.version_number} (${versionNumber.proposal_class})`,
    versionNumber.approval_caveat || 'Open the interactive proposal for current caveats and modeled options.',
    '', 'This walkthrough is intentionally abbreviated.',
    ...(document.chapters || []).map((chapter) => `${chapter.sequence}. ${chapter.name}: ${chapter.purpose}`),
    '', `Interactive proposal: ${proposalUrl}`,
  ];
  const delivery = await dispatchRaw({
    leadId: lead?.id ? Number(lead.id) : null,
    to: recipient.email,
    subject: `Your Salt Basin proposal · version ${versionNumber.version_number}`,
    text: `Hi ${recipient.display_name || 'there'},\n\nYour proposal is ready. The attached walkthrough is abbreviated; open the interactive proposal to explore the full data story and collaborate:\n${proposalUrl}`,
    html: `<p>Hi ${recipient.display_name || 'there'},</p><p>Your proposal is ready. The attached walkthrough is intentionally abbreviated. Open the interactive proposal for the complete data story, modeled options, and collaboration:</p><p><a href="${proposalUrl}">Open proposal version ${versionNumber.version_number}</a></p>`,
    attachments: [{ name: `salt-basin-proposal-v${versionNumber.version_number}-walkthrough.pdf`, content: createTextPdf('Salt Basin Proposal Walkthrough', lines) }],
  });
  await db.prepare(`INSERT INTO proposal_delivery_emails (proposal_version_id,recipient_user_id,to_email,provider_status,provider_id,sent_at) VALUES ($1,$2,$3,$4,$5,$6)`).run(Number(req.params.versionId), recipient.id, recipient.email, delivery.ok ? (delivery.stub ? 'stubbed' : 'sent') : 'failed', delivery.id || null, now);
  await db.prepare(`INSERT INTO notifications (user_id,source_type,source_id,title,body,severity,action_url,created_at) VALUES ($1,'proposal_version',$2,$3,$4,'info',$5,$6)`).run(recipient.id, Number(req.params.versionId), `Proposal version ${versionNumber.version_number} is ready`, 'Open the full interactive proposal and add component-level questions or feedback.', '/member?workspace=1&tab=proposal-experience', now);
  res.json({ ok: true, status: 'delivered', previousDeliveredVersionsArchived: true, notificationCreated: true, emailStatus: delivery.ok ? 'sent' : 'failed' });
});

router.post('/admin/:userId/versions/:versionId/approve', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  const rod = await myRod(Number(req.params.userId));
  const version = rod && await db.prepare(`SELECT * FROM proposal_versions WHERE id=$1 AND rod_id=$2 AND status='draft'`).get(Number(req.params.versionId), rod.id);
  if (!version) return res.status(409).json({ error: 'only a draft version can be approved' });
  const now = Date.now();
  await db.prepare(`INSERT INTO proposal_approval_actions (proposal_version_id,action,actor_user_id,rationale,metadata,created_at) VALUES ($1,'approved',$2,$3,$4,$5)`).run(version.id, req.user.id, req.body?.rationale || null, { proposalClass: version.proposal_class, engine: 'proposal-approval-v1' }, now);
  await db.prepare(`UPDATE proposal_versions SET status='approved',approved_by=$1,approved_at=$2,updated_at=$2 WHERE id=$3`).run(req.user.id, now, version.id);
  res.json({ ok: true, status: 'approved' });
});

router.post('/admin/:userId/versions/:versionId/contract', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  const rod = await myRod(Number(req.params.userId));
  const version = rod && await db.prepare(`SELECT * FROM proposal_versions WHERE id=$1 AND rod_id=$2 AND proposal_class='final' AND status IN ('approved','delivered')`).get(Number(req.params.versionId), rod.id);
  if (!version) return res.status(409).json({ error: 'only an approved or delivered final proposal can become a contract' });
  const now = Date.now();
  const snapshot = version.snapshot || {};
  const result = await db.prepare(`INSERT INTO proposal_contracts (proposal_version_id,rod_id,status,metadata,commercial_terms,performance_obligations,created_by,created_at,updated_at) VALUES ($1,$2,'draft',$3,$4,$5,$6,$7,$7) ON CONFLICT (proposal_version_id) DO UPDATE SET metadata=EXCLUDED.metadata,commercial_terms=EXCLUDED.commercial_terms,performance_obligations=EXCLUDED.performance_obligations,updated_at=EXCLUDED.updated_at RETURNING id`).run(version.id, rod.id, { sourceProposalVersion: version.version_number, conversion: 'proposal_to_contract_v1' }, snapshot.commercialTerms || {}, snapshot.performanceObligations || [], req.user.id, now);
  await db.prepare(`UPDATE proposal_versions SET status='contracted',updated_at=$1 WHERE id=$2`).run(now, version.id);
  res.json({ ok: true, contractId: Number(result.lastInsertRowid), status: 'draft' });
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
