import { Router } from 'express';
import { db } from '../db.js';
import { requireUser, requireAdmin } from '../auth.js';
import { evaluateJourneyRod, upsertJourneyEvidence } from '../lib/journeyRods.js';

const router = Router();

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
    .run(req.params.rodType,req.params.stageKey,label,sortOrder,JSON.stringify(qualificationMetadata),!!isActive,now);
  res.json({ ok: true });
});

for (const [path, table, order] of [
  ['molecules','journey_metadata_molecules','molecule_key'], ['clusters','journey_metadata_clusters','cluster_key'],
  ['scenarios','journey_scenarios','scenario_key'], ['gate-definitions','journey_gate_definitions','scenario_id, sort_order'],
]) router.get(`/${path}`, requireAdmin, async (_req, res) => res.json({ items: await db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all() }));

router.put('/molecules/:key', requireAdmin, async (req, res) => {
  const b=req.body||{}, now=Date.now();
  await db.prepare(`INSERT INTO journey_metadata_molecules (molecule_key,label,data_type,source_paths,validation_config,is_sensitive,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$8)
    ON CONFLICT (molecule_key) DO UPDATE SET label=EXCLUDED.label,data_type=EXCLUDED.data_type,source_paths=EXCLUDED.source_paths,validation_config=EXCLUDED.validation_config,is_sensitive=EXCLUDED.is_sensitive,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`)
    .run(req.params.key,b.label||req.params.key,b.dataType||'text',JSON.stringify(b.sourcePaths||[]),JSON.stringify(b.validationConfig||{}),!!b.isSensitive,b.isActive!==false,now);
  res.json({ok:true});
});

router.put('/clusters/:key', requireAdmin, async (req,res)=>{ const b=req.body||{},now=Date.now(); await db.prepare(`INSERT INTO journey_metadata_clusters (cluster_key,label,description,molecule_keys,completion_rule,minimum_count,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$8) ON CONFLICT (cluster_key) DO UPDATE SET label=EXCLUDED.label,description=EXCLUDED.description,molecule_keys=EXCLUDED.molecule_keys,completion_rule=EXCLUDED.completion_rule,minimum_count=EXCLUDED.minimum_count,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`).run(req.params.key,b.label||req.params.key,b.description||null,JSON.stringify(b.moleculeKeys||[]),b.completionRule||'all',b.minimumCount??null,b.isActive!==false,now); res.json({ok:true}); });

router.put('/scenarios/:key', requireAdmin, async (req,res)=>{ const b=req.body||{},now=Date.now(); await db.prepare(`INSERT INTO journey_scenarios (scenario_key,rod_type,label,description,selected_cluster_keys,dimensions,actor_roles,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$9) ON CONFLICT (scenario_key) DO UPDATE SET rod_type=EXCLUDED.rod_type,label=EXCLUDED.label,description=EXCLUDED.description,selected_cluster_keys=EXCLUDED.selected_cluster_keys,dimensions=EXCLUDED.dimensions,actor_roles=EXCLUDED.actor_roles,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`).run(req.params.key,b.rodType||'revenue_lifecycle',b.label||req.params.key,b.description||null,JSON.stringify(b.selectedClusterKeys||[]),JSON.stringify(b.dimensions||[]),JSON.stringify(b.actorRoles||[]),b.isActive!==false,now); res.json({ok:true}); });

router.put('/scenarios/:key/gates/:stageKey', requireAdmin, async (req,res)=>{ const b=req.body||{},now=Date.now(); const scenario=await db.prepare(`SELECT id FROM journey_scenarios WHERE scenario_key=$1`).get(req.params.key); if(!scenario) return res.status(404).json({error:'scenario not found'}); await db.prepare(`INSERT INTO journey_gate_definitions (scenario_id,stage_key,required_clusters,required_molecules,required_dimensions,required_actor_roles,dependency_rules,judgment_policy,human_prompt,sort_order,is_active,created_at,updated_at) VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12,$12) ON CONFLICT (scenario_id,stage_key) DO UPDATE SET required_clusters=EXCLUDED.required_clusters,required_molecules=EXCLUDED.required_molecules,required_dimensions=EXCLUDED.required_dimensions,required_actor_roles=EXCLUDED.required_actor_roles,dependency_rules=EXCLUDED.dependency_rules,judgment_policy=EXCLUDED.judgment_policy,human_prompt=EXCLUDED.human_prompt,sort_order=EXCLUDED.sort_order,is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at`).run(scenario.id,req.params.stageKey,JSON.stringify(b.requiredClusters||[]),JSON.stringify(b.requiredMolecules||[]),JSON.stringify(b.requiredDimensions||[]),JSON.stringify(b.requiredActorRoles||[]),JSON.stringify(b.dependencyRules||[]),b.judgmentPolicy||'when_ambiguous',b.humanPrompt||null,b.sortOrder||0,b.isActive!==false,now); res.json({ok:true}); });

router.post('/:rodId/actors', requireAdmin, async (req,res)=>{ const b=req.body||{}; if(!b.actorKey||!b.roleKey) return res.status(400).json({error:'actorKey and roleKey are required'}); await db.prepare(`INSERT INTO journey_rod_actors (rod_id,actor_key,role_key,contribution_status,contribution,required_from_stage,added_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT (rod_id,actor_key,role_key) DO UPDATE SET contribution_status=EXCLUDED.contribution_status,contribution=EXCLUDED.contribution,required_from_stage=EXCLUDED.required_from_stage`).run(req.params.rodId,b.actorKey,b.roleKey,b.contributionStatus||'invited',JSON.stringify(b.contribution||{}),b.requiredFromStage||null,Date.now()); res.json(await evaluateJourneyRod(Number(req.params.rodId))); });

router.get('/:rodId/threshold-profile', requireUser, async (req,res)=>{ if(!await requireRodOwnerOrAdmin(req,res)) return; res.json({profile:await db.prepare(`SELECT * FROM journey_rod_threshold_profiles WHERE rod_id=$1`).get(req.params.rodId)}); });
router.put('/:rodId/threshold-profile', requireUser, async (req,res)=>{ if(!await requireRodOwnerOrAdmin(req,res)) return; const b=req.body||{},now=Date.now(); if(!Array.isArray(b.dimensionDefinitions)||!Array.isArray(b.combinations)) return res.status(400).json({error:'dimensionDefinitions and combinations must be arrays'}); await db.prepare(`INSERT INTO journey_rod_threshold_profiles (rod_id,dimension_definitions,combinations,configured_by,created_at,updated_at) VALUES ($1,$2::jsonb,$3::jsonb,$4,$5,$5) ON CONFLICT (rod_id) DO UPDATE SET dimension_definitions=EXCLUDED.dimension_definitions,combinations=EXCLUDED.combinations,configured_by=EXCLUDED.configured_by,updated_at=EXCLUDED.updated_at`).run(req.params.rodId,JSON.stringify(b.dimensionDefinitions),JSON.stringify(b.combinations),req.user.id,now); res.json(await evaluateJourneyRod(Number(req.params.rodId))); });

router.post('/:rodId/evidence', requireAdmin, async (req,res)=>{ try { res.json(await upsertJourneyEvidence(Number(req.params.rodId),req.body||{})); } catch(e){ res.status(400).json({error:e.message}); } });
router.post('/:rodId/evaluate', requireAdmin, async (req,res)=>{ try { res.json(await evaluateJourneyRod(Number(req.params.rodId))); } catch(e){ res.status(400).json({error:e.message}); } });
router.get('/decisions/pending', requireAdmin, async (_req,res)=>res.json({decisions:await db.prepare(`SELECT * FROM journey_rod_decisions WHERE status='pending' ORDER BY requested_at`).all()}));
router.post('/decisions/:id/resolve', requireAdmin, async (req,res)=>{ const status=req.body?.status; if(!['approved','rejected'].includes(status)) return res.status(400).json({error:'status must be approved or rejected'}); await db.prepare(`UPDATE journey_rod_decisions SET status=$1,decided_at=$2,decided_by=$3,decision_notes=$4 WHERE id=$5 AND status='pending'`).run(status,Date.now(),req.user.id,req.body?.notes||null,req.params.id); res.json({ok:true}); });

function normalizeRod(row) {
  return { ...row, id: Number(row.id), lead_id: row.lead_id ? Number(row.lead_id) : null, user_id: row.user_id ? Number(row.user_id) : null, org_id: row.org_id ? Number(row.org_id) : null, potential_revenue_cents: Number(row.potential_revenue_cents || 0), actual_revenue_cents: Number(row.actual_revenue_cents || 0) };
}

export default router;
