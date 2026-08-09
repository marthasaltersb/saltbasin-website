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
import { requireUser, requireAdmin } from '../auth.js';
import { listCareerOpportunities, createCareerOpportunity, recordDimensionScores, getCareerAgentHub, approveCareerOpportunity } from '../lib/careerOpportunityRollups.js';
import { researchCareerOpportunities } from '../lib/careerResearchAgent.js';
import { generateResumeContent } from '../lib/resumeTargeting.js';
import { generateCoverLetterContent } from '../lib/coverLetterTargeting.js';
import { runQualificationGatesForUser } from '../lib/careerVerificationAgent.js';
import { autoQueueOutputsForNewlyApproved } from '../lib/autoQueueAgent.js';
import { createResumeOutputProjection, listResumeOutputProjectionsForOpportunity, listResumeOutputProjections } from '../lib/resumeProjection.js';
import { parseCareerPipelineWorkbook, rowToOpportunityPayload } from '../lib/careerPipelineImport.js';
import { upsertAgentSchedule, GATE_ACTION_KEYS } from '../lib/opportunityPipelineRegistry.js';
import { resolveConfigEnvelope } from '../lib/configEnvelope.js';
import '../lib/agentCadenceEnvelope.js';
import { CHECKERS } from '../lib/qualificationGateCheckers.js';
import { getCurrent } from '../lib/currentRegistry.js';
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

// The real "human confirms this is worth pursuing" stage transition
// (2026-08-09) — see careerOpportunityRollups.js's approveCareerOpportunity
// header for what this triggers (auto-queue eligibility, gate-loop exemption).
router.post('/opportunities/:id/approve', requireUser, async (req, res) => {
  try {
    const opportunity = await approveCareerOpportunity(req.user.id, Number(req.params.id));
    res.json(opportunity);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Cover letter generation — same review-then-explicit-approve shape as
// generate-resume/resume-outputs above, coverLetterTargeting.js's sibling
// generator, persisted with outputType: 'cover_letter' into the same table.
router.post('/opportunities/:id/generate-cover-letter', requireUser, async (req, res) => {
  try {
    const rod = await requireOwnedOpportunity(req.user.id, Number(req.params.id));
    const metadata = typeof rod.metadata === 'string' ? JSON.parse(rod.metadata) : rod.metadata;
    const jobDescription = req.body?.jobDescription || metadata?.notes || metadata?.jobTitle || '';
    const content = await generateCoverLetterContent(req.user.id, jobDescription);
    res.json({ content, jobDescriptionUsed: jobDescription });
  } catch (e) {
    res.status(e.status === 429 ? 429 : 400).json({ error: e.message });
  }
});

router.post('/opportunities/:id/cover-letter-outputs', requireUser, async (req, res) => {
  try {
    await requireOwnedOpportunity(req.user.id, Number(req.params.id));
    const { generatedContent, targetJobDescription } = req.body || {};
    const projection = await createResumeOutputProjection(req.user.id, {
      presetId: 'agent_generated',
      presetName: 'Agent-Generated Cover Letter',
      careerOpportunityRodId: Number(req.params.id),
      generatedContent,
      targetJobDescription,
      outputType: 'cover_letter',
    });
    res.status(201).json(projection);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// On-demand triggers for the same actions the dispatcher runs
// automatically once a schedule is set below — a member shouldn't have to
// wait for a cadence to fire just to try "Verify Pipeline Now" once.
router.post('/verify-pipeline', requireUser, async (req, res) => {
  try {
    const result = await runQualificationGatesForUser(req.user.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/auto-queue-outputs', requireUser, async (req, res) => {
  try {
    const result = await autoQueueOutputsForNewlyApproved(req.user.id);
    res.json(result);
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

// The career pipeline's schedulable agent actions — a small static list
// (mirrors ACTION_EXECUTORS in agentDispatcher.js 1:1) rather than trying to
// auto-derive "schedulable actions" from agent_definitions.capabilities,
// which is free text, not a machine-checkable action registry.
const SCHEDULABLE_ACTIONS = [
  { agentKey: 'career_researcher', actionKey: 'research', label: 'Job Research', description: 'Search the web for new open roles matching your Career Master profile.' },
  { agentKey: 'career_researcher', actionKey: 'posting_verification', label: 'Posting Verification', description: 'Re-check open, unapproved postings are still live; auto-archives ones that are no longer found.' },
  { agentKey: 'resume_generator', actionKey: 'auto_queue_on_approval', label: 'Auto-Generate on Approval', description: 'Generate a resume + cover letter draft automatically for any newly-approved opportunity.' },
];

// Automation schedule config ("where can I configure the autonomous
// agents for scheduling," 2026-08-09) — per agent-action cadence, sourced
// from the platform-configurable agent_cadence_presets envelope.
router.get('/schedule', requireUser, async (req, res) => {
  try {
    const { value: cadenceValue } = await resolveConfigEnvelope('agent_cadence_presets');
    const rows = await db.prepare(`
      SELECT s.*, d.key AS agent_key FROM agent_schedules s
      JOIN agent_definitions d ON d.id = s.agent_definition_id
      WHERE s.owner_user_id=$1 AND s.is_active=true
    `).all(req.user.id);
    const byActionKey = {};
    for (const r of rows) byActionKey[`${r.agent_key}:${r.action_key}`] = r;

    const schedules = SCHEDULABLE_ACTIONS.map((a) => {
      const row = byActionKey[`${a.agentKey}:${a.actionKey}`];
      return {
        ...a,
        cadence: row?.cadence || 'on_demand',
        lastRunAt: row?.last_run_at ? Number(row.last_run_at) : null,
        nextRunAt: row?.next_run_at ? Number(row.next_run_at) : null,
      };
    });
    res.json({ schedules, presets: cadenceValue.presets });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/schedule', requireUser, async (req, res) => {
  try {
    const { agentKey, actionKey, cadence } = req.body || {};
    const action = SCHEDULABLE_ACTIONS.find((a) => a.agentKey === agentKey && a.actionKey === actionKey);
    if (!action) return res.status(400).json({ error: `Unknown schedulable action "${agentKey}:${actionKey}".` });

    const { value: cadenceValue } = await resolveConfigEnvelope('agent_cadence_presets');
    const preset = cadenceValue.presets.find((p) => p.key === cadence);
    if (!preset) return res.status(400).json({ error: `Unknown cadence "${cadence}".` });

    const agentDef = await db.prepare(`SELECT id FROM agent_definitions WHERE key=$1 AND org_id IS NULL AND owner_user_id IS NULL`).get(agentKey);
    if (!agentDef) return res.status(400).json({ error: `Unknown agent "${agentKey}".` });

    const nextRunAt = preset.intervalMs ? Date.now() + preset.intervalMs : null;
    const schedule = await upsertAgentSchedule({
      agentDefinitionId: agentDef.id,
      ownerUserId: req.user.id,
      actionKey,
      cadence,
      nextRunAt,
    });
    res.json({ agentKey, actionKey, cadence: schedule.cadence, nextRunAt: schedule.next_run_at ? Number(schedule.next_run_at) : null });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Qualification gate chain — read-only view for every member (transparency:
// "what rule decides whether my pipeline gets auto-archived"), edit is
// admin-governed (platform default, same tier as every other cross-cutting
// policy surface in this codebase) since a per-member override tier doesn't
// exist for journey_current_definitions.
router.get('/verification-current', requireUser, async (req, res) => {
  try {
    const current = await getCurrent('career_opportunity_verification_v1');
    if (!current) return res.status(404).json({ error: 'career_opportunity_verification_v1 Current is not configured.' });
    res.json({ currentKey: current.currentKey, label: current.label, gates: current.entryCriteria.gates, availableCheckTypes: Object.keys(CHECKERS), availableActions: GATE_ACTION_KEYS });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/verification-current', requireAdmin, async (req, res) => {
  try {
    const { gates } = req.body || {};
    if (!Array.isArray(gates) || !gates.length) return res.status(400).json({ error: 'gates must be a non-empty array.' });
    for (const g of gates) {
      if (!g.key || !g.checkType || !CHECKERS[g.checkType]) return res.status(400).json({ error: `Gate "${g.key || '(no key)'}" has unknown checkType "${g.checkType}".` });
      if (g.onFail?.action && !GATE_ACTION_KEYS.includes(g.onFail.action)) return res.status(400).json({ error: `Gate "${g.key}" onFail.action "${g.onFail.action}" is not a known action (${GATE_ACTION_KEYS.join(', ')}).` });
      if (g.onPass?.action && !GATE_ACTION_KEYS.includes(g.onPass.action)) return res.status(400).json({ error: `Gate "${g.key}" onPass.action "${g.onPass.action}" is not a known action (${GATE_ACTION_KEYS.join(', ')}).` });
    }
    const now = Date.now();
    await db.prepare(`
      UPDATE journey_current_definitions SET entry_criteria=$1::jsonb, updated_at=$2
      WHERE current_key='career_opportunity_verification_v1' AND org_id IS NULL
    `).run({ gateModel: 'qualification_gate_chain', gates }, now);
    const updated = await getCurrent('career_opportunity_verification_v1');
    res.json({ currentKey: updated.currentKey, label: updated.label, gates: updated.entryCriteria.gates });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
