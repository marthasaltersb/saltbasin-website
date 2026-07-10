import { db } from '../db.js';

async function ensureRod({ rodType, leadId = null, userId = null, personalProfileId = null, orgId = null, stage, metadata = {} }) {
  const existing = await db.prepare(`
    SELECT * FROM journey_data_rods
    WHERE rod_type=$1 AND lead_id IS NOT DISTINCT FROM $2 AND user_id IS NOT DISTINCT FROM $3 AND org_id IS NOT DISTINCT FROM $4
    LIMIT 1
  `).get(rodType, leadId, userId, orgId);
  if (existing) return existing;
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO journey_data_rods (rod_type, lead_id, user_id, personal_profile_id, org_id, current_stage, metadata, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$8) RETURNING id
  `).run(rodType, leadId, userId, personalProfileId, orgId, stage, JSON.stringify(metadata), now);
  const rodId = Number(result.lastInsertRowid);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'rod_created',$2,$3::jsonb,$4)`)
    .run(rodId, stage, JSON.stringify(metadata), now);
  return await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId);
}

export async function ensureLeadRevenueRod(leadId, metadata = {}) {
  return ensureRod({ rodType: 'revenue_lifecycle', leadId, stage: 'first_interaction', metadata });
}

export async function ensureMemberJourneyRods(userId, leadId = null) {
  const profile = await db.prepare(`SELECT id FROM personal_profiles WHERE user_id=$1`).get(userId);
  const member = await ensureRod({ rodType: 'member', userId, personalProfileId: profile?.id || null, stage: 'member_active', metadata: { sourceLeadId: leadId } });
  const orgs = await db.prepare(`SELECT org_id FROM org_memberships WHERE user_id=$1`).all(userId);
  await ensureRod({ rodType: 'customer', userId, personalProfileId: profile?.id || null, stage: orgs.length ? 'organization_connected' : 'member_profile' });
  await ensureRod({ rodType: 'revenue_lifecycle', userId, personalProfileId: profile?.id || null, stage: 'first_interaction', metadata: { sourceLeadId: leadId, payerRequired: false } });
  for (const org of orgs) await ensureMemberOrganizationRods(userId, Number(org.org_id));
  return member;
}

export async function ensureMemberOrganizationRods(userId, orgId) {
  await ensureRod({ rodType: 'customer', userId, orgId, stage: 'organization_connected', metadata: { payerRequired: false } });
  return ensureRod({ rodType: 'revenue_lifecycle', userId, orgId, stage: 'first_interaction', metadata: { payerRequired: false, tracksOrganizationPotential: true } });
}

export async function recordRodEvent(rodId, { eventType, fromStage = null, toStage = null, scoreDelta = 0, potentialRevenueDeltaCents = 0, metadata = {} }) {
  const now = Date.now();
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,from_stage,to_stage,score_delta,potential_revenue_delta_cents,metadata,created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`).run(rodId,eventType,fromStage,toStage,scoreDelta,potentialRevenueDeltaCents,JSON.stringify(metadata),now);
  await db.prepare(`UPDATE journey_data_rods SET current_stage=COALESCE($1,current_stage), stage_score=stage_score+$2, potential_revenue_cents=potential_revenue_cents+$3, updated_at=$4 WHERE id=$5`)
    .run(toStage,scoreDelta,potentialRevenueDeltaCents,now,rodId);
}

const present = (value) => value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);

function clusterPassed(cluster, evidence) {
  const keys = cluster.molecule_keys || [];
  const found = keys.filter((key) => present(evidence.get(key)?.value));
  if (cluster.completion_rule === 'any') return found.length > 0;
  if (cluster.completion_rule === 'minimum') return found.length >= Number(cluster.minimum_count || 1);
  return keys.length > 0 && found.length === keys.length;
}

export async function evaluateJourneyRod(rodId, { requestJudgment = true } = {}) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId);
  if (!rod) throw new Error('Journey rod not found');
  const scenarioKey = rod.metadata?.scenarioKey || 'default_revenue';
  const scenario = await db.prepare(`SELECT * FROM journey_scenarios WHERE scenario_key=$1 AND is_active=true`).get(scenarioKey);
  if (!scenario) return { rod, scenario: null, eligibleStage: rod.current_stage, gates: [] };
  const [gates, clusters, evidenceRows, actors] = await Promise.all([
    db.prepare(`SELECT * FROM journey_gate_definitions WHERE scenario_id=$1 AND is_active=true ORDER BY sort_order`).all(scenario.id),
    db.prepare(`SELECT * FROM journey_metadata_clusters WHERE cluster_key = ANY($1::text[]) AND is_active=true`).all(scenario.selected_cluster_keys || []),
    db.prepare(`SELECT * FROM journey_rod_evidence WHERE rod_id=$1 ORDER BY observed_at DESC`).all(rodId),
    db.prepare(`SELECT * FROM journey_rod_actors WHERE rod_id=$1`).all(rodId),
  ]);
  const evidence = new Map();
  for (const row of evidenceRows) if (!evidence.has(row.molecule_key)) evidence.set(row.molecule_key, row);
  const clusterMap = new Map(clusters.map((cluster) => [cluster.cluster_key, cluster]));
  let eligibleStage = gates[0]?.stage_key || rod.current_stage;
  const results = [];
  for (const gate of gates) {
    const missingClusters = (gate.required_clusters || []).filter((key) => !clusterMap.has(key) || !clusterPassed(clusterMap.get(key), evidence));
    const missingMolecules = (gate.required_molecules || []).filter((key) => !present(evidence.get(key)?.value));
    const missingActors = (gate.required_actor_roles || []).filter((role) => !actors.some((actor) => actor.role_key === role && actor.contribution_status === 'complete'));
    const unmetDependencies = (gate.dependency_rules || []).filter((rule) => {
      if (rule.type === 'actor_contribution') return !actors.some((actor) => actor.role_key === rule.role && actor.contribution_status === (rule.status || 'complete'));
      if (rule.type === 'molecule_present') return !present(evidence.get(rule.moleculeKey)?.value);
      return true;
    });
    const passed = !missingClusters.length && !missingMolecules.length && !missingActors.length && !unmetDependencies.length;
    results.push({ stageKey: gate.stage_key, passed, missingClusters, missingMolecules, missingActors, unmetDependencies });
    if (!passed) {
      if (requestJudgment && gate.judgment_policy !== 'never') await requestJourneyDecision(rodId, 'stage_gate_judgment', { stageKey: gate.stage_key, gaps: results.at(-1) }, gate.human_prompt || `Review whether this journey has sufficient evidence to advance to ${gate.stage_key}.`);
      break;
    }
    eligibleStage = gate.stage_key;
  }
  if (eligibleStage !== rod.current_stage) await recordRodEvent(rodId, { eventType: 'evidence_gate_advanced', fromStage: rod.current_stage, toStage: eligibleStage, metadata: { scenarioKey } });
  return { rod: await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId), scenario, eligibleStage, gates: results };
}

export async function upsertJourneyEvidence(rodId, { moleculeKey, value, sourceType = 'interaction', sourceReference = null, actorKey = null, confidence = null, metadata = {} }) {
  const reference = sourceReference || `${sourceType}:${Date.now()}`;
  await db.prepare(`INSERT INTO journey_rod_evidence (rod_id,molecule_key,value,source_type,source_reference,actor_key,confidence,observed_at,metadata)
    VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9::jsonb)
    ON CONFLICT (rod_id,molecule_key,source_reference) DO UPDATE SET value=EXCLUDED.value,confidence=EXCLUDED.confidence,observed_at=EXCLUDED.observed_at,metadata=EXCLUDED.metadata`)
    .run(rodId,moleculeKey,JSON.stringify(value),sourceType,reference,actorKey,confidence,Date.now(),JSON.stringify(metadata));
  return evaluateJourneyRod(rodId);
}

export async function requestJourneyDecision(rodId, decisionType, proposedAction, humanPrompt) {
  const existing = await db.prepare(`SELECT id FROM journey_rod_decisions WHERE rod_id=$1 AND decision_type=$2 AND proposed_action=$3::jsonb AND status='pending'`).get(rodId,decisionType,JSON.stringify(proposedAction));
  if (existing) return existing;
  const result = await db.prepare(`INSERT INTO journey_rod_decisions (rod_id,decision_type,proposed_action,human_prompt,requested_at) VALUES ($1,$2,$3::jsonb,$4,$5) RETURNING id`)
    .run(rodId,decisionType,JSON.stringify(proposedAction),humanPrompt,Date.now());
  return { id: Number(result.lastInsertRowid) };
}
