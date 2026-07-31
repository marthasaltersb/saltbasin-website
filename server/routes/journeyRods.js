import { Router } from 'express';
import { db } from '../db.js';
import { requireUser, requireAdmin } from '../auth.js';
import { evaluateJourneyRod, upsertJourneyEvidence } from '../lib/journeyRods.js';
import { generateScenarioMatrix, estimateMatrixSize, DRAFT_DIMENSION_DEFINITIONS } from '../lib/scenarioGenerator.js';
import { applyScenarioLibrary } from '../lib/scenarioLibraryApply.js';
import { resolveConfigEnvelope } from '../lib/configEnvelope.js';
import '../lib/methodologyEnvelopes.js'; // side effect: registers the envelopes

const router = Router();

// Applies the current `scenario-library` envelope into journey_scenarios /
// journey_gate_definitions. Pass ?dryRun=1 to validate every cluster/atom/stage
// reference and report what would be written, without touching either table.
router.post('/scenario-library/apply', requireAdmin, async (req, res) => {
  const { value } = await resolveConfigEnvelope('scenario-library');
  const result = await applyScenarioLibrary(value, { dryRun: req.query.dryRun === '1' });
  if (!result.ok) return res.status(400).json({ error: 'Scenario library references vocabulary that does not exist', details: result.errors });
  res.json(result);
});

async function requireRodOwnerOrAdmin(req, res) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(req.params.rodId);
  if (!rod) { res.status(404).json({ error: 'Journey rod not found' }); return null; }
  if (req.user.role !== 'admin' && Number(rod.user_id) !== Number(req.user.id)) { res.status(403).json({ error: 'Not authorized for this journey rod' }); return null; }
  return rod;
}

router.get('/me', requireUser, async (req, res) => {
  const rods = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 ORDER BY rod_type, org_id NULLS FIRST`).all(req.user.id);
  res.json({ rods: rods.map(normalizeRod) });
});

router.get('/lead/:leadId', requireAdmin, async (req, res) => {
  const rods = await db.prepare(`SELECT * FROM journey_data_rods WHERE lead_id=$1 ORDER BY created_at`).all(req.params.leadId);
  const events = rods.length ? await db.prepare(`SELECT * FROM journey_rod_events WHERE rod_id = ANY($1::bigint[]) ORDER BY created_at`).all(rods.map((r) => Number(r.id))) : [];
  res.json({ rods: rods.map(normalizeRod), events });
});

router.get('/stage-gates', requireAdmin, async (_req, res) => {
  res.json({ gates: await db.prepare(`SELECT * FROM journey_stage_gates ORDER BY rod_type, sort_order`).all() });
});

router.put('/stage-gates/:rodType/:stageKey', requireAdmin, async (req, res) => {
  const { label, sortOrder = 0, qualificationMetadata = {}, isActive = true } = req.body || {};
  if (!label) return res.status(400).json({ error: 'label is required' });
  const now = Date.now();
  await db.prepare(`INSERT INTO journey_stage_gates (rod_type,stage_key,label,sort_order,qualification_metadata,is_active,created_at,updated_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$7)
    ON CONFLICT (rod_type,stage_key) DO UPDATE SET label=EXCLUDED.label,sort_order=EXCLUDED.sort_order,qualification_metadata=EXCLUDED.qualification_metadata,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`)
    .run(req.params.rodType,req.params.stageKey,label,sortOrder,qualificationMetadata,!!isActive,now);
  res.json({ ok: true });
});

for (const [path, table, order] of [
  ['molecules','journey_metadata_molecules','molecule_key'], ['clusters','journey_metadata_clusters','cluster_key'],
  ['scenarios','journey_scenarios','scenario_key'], ['gate-definitions','journey_gate_definitions','scenario_id, sort_order'],
]) router.get(`/${path}`, requireAdmin, async (_req, res) => res.json({ items: await db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all() }));

router.put('/molecules/:key', requireAdmin, async (req, res) => {
  const b=req.body||{}, now=Date.now();
  await db.prepare(`INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,canonical_definition,value_domain,mutability_class,created_at,updated_at) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$11)
    ON CONFLICT (molecule_key) DO UPDATE SET label=EXCLUDED.label,data_type=EXCLUDED.data_type,source_paths=EXCLUDED.source_paths,validation_config=EXCLUDED.validation_config,is_sensitive=EXCLUDED.is_sensitive,is_active=EXCLUDED.is_active,canonical_definition=EXCLUDED.canonical_definition,value_domain=EXCLUDED.value_domain,mutability_class=EXCLUDED.mutability_class,updated_at=EXCLUDED.updated_at`)
    .run(req.params.key,b.label||req.params.key,b.dataType||'text',b.sourcePaths||[],b.validationConfig||{},!!b.isSensitive,b.isActive!==false,b.canonicalDefinition||null,b.valueDomain||null,b.mutabilityClass||'revisable',now);
  res.json({ok:true});
});

router.put('/clusters/:key', requireAdmin, async (req,res)=>{ const b=req.body||{},now=Date.now(); await db.prepare(`INSERT INTO journey_metadata_clusters (cluster_key,label,description,molecule_keys,completion_rule,minimum_count,is_active,alignment_rules,created_at,updated_at) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8::jsonb,$9,$9) ON CONFLICT (cluster_key) DO UPDATE SET label=EXCLUDED.label,description=EXCLUDED.description,molecule_keys=EXCLUDED.molecule_keys,completion_rule=EXCLUDED.completion_rule,minimum_count=EXCLUDED.minimum_count,is_active=EXCLUDED.is_active,alignment_rules=EXCLUDED.alignment_rules,updated_at=EXCLUDED.updated_at`).run(req.params.key,b.label||req.params.key,b.description||null,b.moleculeKeys||[],b.completionRule||'all',b.minimumCount??null,b.isActive!==false,b.alignmentRules||[],now); res.json({ok:true}); });

router.put('/scenarios/:key', requireAdmin, async (req,res)=>{ const b=req.body||{},now=Date.now(); await db.prepare(`INSERT INTO journey_scenarios (scenario_key,rod_type,label,description,selected_cluster_keys,dimensions,actor_roles,is_active,current_key,created_at,updated_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10,$10) ON CONFLICT (scenario_key) DO UPDATE SET rod_type=EXCLUDED.rod_type,label=EXCLUDED.label,description=EXCLUDED.description,selected_cluster_keys=EXCLUDED.selected_cluster_keys,dimensions=EXCLUDED.dimensions,actor_roles=EXCLUDED.actor_roles,is_active=EXCLUDED.is_active,current_key=EXCLUDED.current_key,updated_at=EXCLUDED.updated_at`).run(req.params.key,b.rodType||'revenue_lifecycle',b.label||req.params.key,b.description||null,b.selectedClusterKeys||[],b.dimensions||[],b.actorRoles||[],b.isActive!==false,b.currentKey||null,now); res.json({ok:true}); });

// Channel Current definitions — server/lib/currentRegistry.js's DB-backed
// table. org_id omitted/null on write = platform default; pass orgId to
// create/update an org-specific override (same seam as data_ports etc.).
router.get('/currents', requireAdmin, async (req, res) => {
  const rows = req.query.orgId
    ? await db.prepare(`SELECT * FROM journey_current_definitions WHERE org_id=$1 OR org_id IS NULL ORDER BY current_key`).all(req.query.orgId)
    : await db.prepare(`SELECT * FROM journey_current_definitions WHERE org_id IS NULL ORDER BY current_key`).all();
  res.json({ items: rows });
});

router.put('/currents/:key', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  if (!b.rodType) return res.status(400).json({ error: 'rodType is required' });
  const orgId = b.orgId || null;
  // Two different partial unique indexes back this table (global-default vs.
  // org-override), and Postgres requires ON CONFLICT to name one concrete
  // index inference — can't conditionally target either in one statement.
  const conflictClause = orgId
    ? `ON CONFLICT (current_key, org_id) WHERE org_id IS NOT NULL DO UPDATE SET`
    : `ON CONFLICT (current_key) WHERE org_id IS NULL DO UPDATE SET`;
  await db.prepare(`
    INSERT INTO journey_current_definitions
      (current_key,org_id,label,rod_type,scope_type,primary_scenario_key,port_stages,entry_criteria,minimum_carry,transition_rules,tributary_trigger_rules,is_active,created_at,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$13)
    ${conflictClause} label=EXCLUDED.label,rod_type=EXCLUDED.rod_type,scope_type=EXCLUDED.scope_type,primary_scenario_key=EXCLUDED.primary_scenario_key,port_stages=EXCLUDED.port_stages,entry_criteria=EXCLUDED.entry_criteria,minimum_carry=EXCLUDED.minimum_carry,transition_rules=EXCLUDED.transition_rules,tributary_trigger_rules=EXCLUDED.tributary_trigger_rules,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at
  `).run(req.params.key, orgId, b.label || req.params.key, b.rodType, b.scopeType || 'channel_current', b.primaryScenarioKey || null, b.portStages || [], b.entryCriteria || {}, b.minimumCarry || [], b.transitionRules || [], b.tributaryTriggerRules || [], b.isActive !== false, now);
  res.json({ ok: true });
});

// §26 scenario generator: cross-products dimensionDefinitions into the L2
// scenario matrix instead of hand-authoring rows. GET previews the count for
// any dimension set (defaults to the DRAFT placeholder set — see
// scenarioGenerator.js) without writing anything; POST requires
// confirmDraft:true when no custom dimensionDefinitions are supplied, so the
// full placeholder cross-product is never written by accident.
router.get('/scenarios/generate/preview', requireAdmin, async (req, res) => {
  const dimensionDefinitions = req.query.dimensionDefinitions ? JSON.parse(req.query.dimensionDefinitions) : DRAFT_DIMENSION_DEFINITIONS;
  res.json({ dimensionDefinitions, estimatedCount: estimateMatrixSize(dimensionDefinitions), isDraftSet: !req.query.dimensionDefinitions });
});

router.post('/scenarios/generate', requireAdmin, async (req, res) => {
  const b = req.body || {};
  const dimensionDefinitions = b.dimensionDefinitions || DRAFT_DIMENSION_DEFINITIONS;
  if (!b.dimensionDefinitions && !b.confirmDraft) {
    return res.status(400).json({ error: 'Pass dimensionDefinitions with your real business taxonomy, or confirmDraft:true to generate the placeholder DRAFT matrix.', estimatedCount: estimateMatrixSize(DRAFT_DIMENSION_DEFINITIONS) });
  }
  const scenarios = generateScenarioMatrix(dimensionDefinitions, { rodType: b.rodType || 'revenue_lifecycle' });
  const now = Date.now();
  for (const scenario of scenarios) {
    await db.prepare(`INSERT INTO journey_scenarios (scenario_key,rod_type,label,description,selected_cluster_keys,dimensions,actor_roles,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$9) ON CONFLICT (scenario_key) DO NOTHING`)
      .run(scenario.scenarioKey, scenario.rodType, scenario.label, b.dimensionDefinitions ? null : 'Generated from DRAFT placeholder dimensions — not a business-approved scenario.', [], scenario.dimensions, [], true, now);
  }
  res.json({ ok: true, generatedCount: scenarios.length });
});

router.put('/scenarios/:key/gates/:stageKey', requireAdmin, async (req,res)=>{ const b=req.body||{},now=Date.now(); const scenario=await db.prepare(`SELECT id FROM journey_scenarios WHERE scenario_key=$1`).get(req.params.key); if(!scenario) return res.status(404).json({error:'scenario not found'}); await db.prepare(`INSERT INTO journey_gate_definitions (scenario_id,stage_key,required_clusters,required_molecules,required_dimensions,required_actor_roles,dependency_rules,judgment_policy,human_prompt,sort_order,is_active,created_at,updated_at) VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12,$12) ON CONFLICT (scenario_id,stage_key) DO UPDATE SET required_clusters=EXCLUDED.required_clusters,required_molecules=EXCLUDED.required_molecules,required_dimensions=EXCLUDED.required_dimensions,required_actor_roles=EXCLUDED.required_actor_roles,dependency_rules=EXCLUDED.dependency_rules,judgment_policy=EXCLUDED.judgment_policy,human_prompt=EXCLUDED.human_prompt,sort_order=EXCLUDED.sort_order,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`).run(scenario.id,req.params.stageKey,b.requiredClusters||[],b.requiredMolecules||[],b.requiredDimensions||[],b.requiredActorRoles||[],b.dependencyRules||[],b.judgmentPolicy||'when_ambiguous',b.humanPrompt||null,b.sortOrder||0,b.isActive!==false,now); res.json({ok:true}); });

router.post('/:rodId/actors', requireAdmin, async (req,res)=>{ const b=req.body||{}; if(!b.actorKey||!b.roleKey) return res.status(400).json({error:'actorKey and roleKey are required'}); await db.prepare(`INSERT INTO journey_rod_actors (rod_id,actor_key,role_key,contribution_status,contribution,required_from_stage,added_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT (rod_id,actor_key,role_key) DO UPDATE SET contribution_status=EXCLUDED.contribution_status,contribution=EXCLUDED.contribution,required_from_stage=EXCLUDED.required_from_stage`).run(req.params.rodId,b.actorKey,b.roleKey,b.contributionStatus||'invited',b.contribution||{},b.requiredFromStage||null,Date.now()); res.json(await evaluateJourneyRod(Number(req.params.rodId))); });

router.get('/:rodId/threshold-profile', requireUser, async (req,res)=>{ if(!await requireRodOwnerOrAdmin(req,res)) return; res.json({profile:await db.prepare(`SELECT * FROM journey_rod_threshold_profiles WHERE rod_id=$1`).get(req.params.rodId)}); });
router.put('/:rodId/threshold-profile', requireUser, async (req,res)=>{ if(!await requireRodOwnerOrAdmin(req,res)) return; const b=req.body||{},now=Date.now(); if(!Array.isArray(b.dimensionDefinitions)||!Array.isArray(b.combinations)) return res.status(400).json({error:'dimensionDefinitions and combinations must be arrays'}); await db.prepare(`INSERT INTO journey_rod_threshold_profiles (rod_id,dimension_definitions,combinations,configured_by,created_at,updated_at) VALUES ($1,$2::jsonb,$3::jsonb,$4,$5,$5) ON CONFLICT (rod_id) DO UPDATE SET dimension_definitions=EXCLUDED.dimension_definitions,combinations=EXCLUDED.combinations,configured_by=EXCLUDED.configured_by,updated_at=EXCLUDED.updated_at`).run(req.params.rodId,b.dimensionDefinitions,b.combinations,req.user.id,now); res.json(await evaluateJourneyRod(Number(req.params.rodId))); });

router.post('/:rodId/evidence', requireAdmin, async (req,res)=>{ try { res.json(await upsertJourneyEvidence(Number(req.params.rodId),req.body||{})); } catch(e){ res.status(400).json({error:e.message}); } });
router.post('/:rodId/evaluate', requireAdmin, async (req,res)=>{ try { res.json(await evaluateJourneyRod(Number(req.params.rodId))); } catch(e){ res.status(400).json({error:e.message}); } });
router.get('/decisions/pending', requireAdmin, async (_req,res)=>res.json({decisions:await db.prepare(`SELECT * FROM journey_rod_decisions WHERE status='pending' ORDER BY requested_at`).all()}));
router.post('/decisions/:id/resolve', requireAdmin, async (req,res)=>{ const status=req.body?.status; if(!['approved','rejected'].includes(status)) return res.status(400).json({error:'status must be approved or rejected'}); await db.prepare(`UPDATE journey_rod_decisions SET status=$1,decided_at=$2,decided_by=$3,decision_notes=$4 WHERE id=$5 AND status='pending'`).run(status,Date.now(),req.user.id,req.body?.notes||null,req.params.id); res.json({ok:true}); });

function normalizeRod(row) {
  return { ...row, id: Number(row.id), lead_id: row.lead_id ? Number(row.lead_id) : null, user_id: row.user_id ? Number(row.user_id) : null, org_id: row.org_id ? Number(row.org_id) : null, potential_revenue_cents: Number(row.potential_revenue_cents || 0), actual_revenue_cents: Number(row.actual_revenue_cents || 0) };
}

export default router;
