import crypto from 'node:crypto';
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

// Conversion creates ONLY the Member rod — no Customer, no Revenue rod. A
// person becoming a member is not, by itself, an opportunity or a customer;
// those get created lazily, from real signals (see ensureUserRevenueRod,
// ensureMemberOrganizationRods, promoteLeadToOrganizationLead below), never
// pre-emptively at signup.
//
// Exception: if the member already has real org_memberships at conversion
// time (e.g. an admin-created account), that's an existing fact, not a
// speculative one — ensureMemberOrganizationRods still runs for those, same
// as before.
export async function ensureMemberJourneyRods(userId, leadId = null) {
  const profile = await db.prepare(`SELECT id FROM personal_profiles WHERE user_id=$1`).get(userId);
  const member = await ensureRod({ rodType: 'member', userId, personalProfileId: profile?.id || null, stage: 'member_active', metadata: { sourceLeadId: leadId } });
  const orgs = await db.prepare(`SELECT org_id FROM org_memberships WHERE user_id=$1`).all(userId);
  for (const org of orgs) await ensureMemberOrganizationRods(userId, Number(org.org_id));
  return member;
}

export async function ensureMemberOrganizationRods(userId, orgId) {
  await ensureRod({ rodType: 'customer', userId, orgId, stage: 'organization_connected', metadata: { payerRequired: false } });
  return ensureRod({ rodType: 'revenue_lifecycle', userId, orgId, stage: 'first_interaction', metadata: { payerRequired: false, tracksOrganizationPotential: true } });
}

// Lazy revenue-rod creation for real commerce events (purchases, onboarding
// completion) — replaces the old pattern of calling ensureMemberJourneyRods
// defensively before every commerce event, which had the side effect of also
// pre-creating a Customer rod. Only ever creates a revenue_lifecycle rod.
export async function ensureUserRevenueRod(userId, orgId = null) {
  const profile = await db.prepare(`SELECT id FROM personal_profiles WHERE user_id=$1`).get(userId);
  return ensureRod({
    rodType: 'revenue_lifecycle', userId, orgId, personalProfileId: profile?.id || null,
    stage: 'first_interaction', metadata: { payerRequired: false, tracksOrganizationPotential: !!orgId },
  });
}

// Re-links an existing rod row to a new owner instead of creating a new one
// — the mechanism that makes "a lead becomes a rod" literal rather than
// metaphorical. Preserves the rod's id and all of its journey_rod_events /
// journey_rod_evidence history.
export async function transitionRodOwnership(rodId, { toUserId = null, toOrgId = null, clearLeadId = true } = {}) {
  const now = Date.now();
  await db.prepare(`
    UPDATE journey_data_rods
    SET lead_id = CASE WHEN $1 THEN NULL ELSE lead_id END,
        user_id = COALESCE($2, user_id),
        org_id = COALESCE($3, org_id),
        updated_at = $4
    WHERE id = $5
  `).run(clearLeadId, toUserId, toOrgId, now, rodId);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,metadata,created_at) VALUES ($1,'ownership_transitioned',$2::jsonb,$3)`)
    .run(rodId, JSON.stringify({ toUserId, toOrgId }), now);
  return db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId);
}

// Master data account record — upserted at member conversion (account_type
// 'member') and at org qualification (account_type 'organization'). Not
// member-visible yet; internal/admin construct only.
export async function upsertAccountRecord({ accountType, userId = null, orgId = null, leadId = null, displayName = null, metadata = {} }) {
  const now = Date.now();
  const conflictCol = accountType === 'organization' ? 'org_id' : 'user_id';
  const conflictVal = accountType === 'organization' ? orgId : userId;
  const existing = await db.prepare(`SELECT id FROM account_records WHERE ${conflictCol} = $1`).get(conflictVal);
  if (existing) {
    await db.prepare(`UPDATE account_records SET display_name = COALESCE($1, display_name), metadata = metadata || $2::jsonb, updated_at = $3 WHERE id = $4`)
      .run(displayName, JSON.stringify(metadata), now, existing.id);
    return existing;
  }
  const result = await db.prepare(`
    INSERT INTO account_records (account_type, user_id, org_id, lead_id, display_name, metadata, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$7) RETURNING id
  `).run(accountType, userId, orgId, leadId, displayName, JSON.stringify(metadata), now);
  return { id: Number(result.lastInsertRowid) };
}

// Creates a Member Organization Lead — a first-class lead record (not a rod)
// representing the member's organization, spawned when there's a signal the
// member belongs to one (a non-personal email domain, or explicit org info
// given in conversation). It matures like any lead: ensureLeadRevenueRod
// gives it its own revenue_lifecycle rod immediately, which accumulates
// evidence/stage the normal way. When that rod reaches the
// 'qualified_opportunity' gate, evaluateJourneyRod (below) promotes it —
// transitions the SAME rod row from lead-linked to org-linked — which is
// this lead "becoming" the organization's Revenue Journey Data Rod.
export async function promoteLeadToOrganizationLead(memberUserId, { orgSignalSource = null, emailDomain = null, orgName = null } = {}) {
  const member = await db.prepare(`SELECT email FROM users WHERE id=$1`).get(memberUserId);
  const publicId = crypto.randomBytes(12).toString('hex');
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO leads (source, email, name, public_id, lead_type, originating_member_user_id, created_at, updated_at)
    VALUES ($1,$2,$3,$4,'member_organization',$5,$6,$6) RETURNING id
  `).run('member_journey_branch', null, orgName || (emailDomain ? `Organization @ ${emailDomain}` : null), publicId, memberUserId, now);
  const leadId = Number(result.lastInsertRowid);
  const rod = await ensureLeadRevenueRod(leadId, {
    isOrganizationLead: true, sourceMemberUserId: memberUserId, orgSignalSource, emailDomain,
    memberEmail: member?.email || null,
  });
  return { leadId, publicId, rod };
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

function dimensionValues(profile, clusterMap, evidence, actors) {
  return new Map((profile?.dimension_definitions || []).map((definition) => {
    let value = 0;
    if (definition.sourceType === 'cluster') value = clusterMap.has(definition.sourceKey) && clusterPassed(clusterMap.get(definition.sourceKey), evidence) ? 1 : 0;
    if (definition.sourceType === 'molecule') {
      const raw = evidence.get(definition.sourceKey)?.value;
      value = typeof raw === 'number' ? raw : present(raw) ? 1 : 0;
    }
    if (definition.sourceType === 'actor_role') value = actors.some((actor) => actor.role_key === definition.sourceKey && actor.contribution_status === 'complete') ? 1 : 0;
    return [definition.key, Math.max(0, Math.min(1, Number(value) || 0))];
  }));
}

function combinationResults(profile, dimensions, stageKey) {
  return (profile?.combinations || []).filter((item) => !item.stageKeys?.length || item.stageKeys.includes(stageKey)).map((item) => {
    const members = item.members || [];
    const weightTotal = members.reduce((sum, member) => sum + Math.max(0, Number(member.weight) || 0), 0);
    const actual = weightTotal ? members.reduce((sum, member) => sum + (dimensions.get(member.dimensionKey) || 0) * Math.max(0, Number(member.weight) || 0), 0) / weightTotal : 0;
    const threshold = Math.max(0, Math.min(1, Number(item.threshold) || 0));
    return { key: item.key, actual, threshold, passed: actual + 0.0001 >= threshold, members };
  });
}

export async function evaluateJourneyRod(rodId, { requestJudgment = true } = {}) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId);
  if (!rod) throw new Error('Journey rod not found');
  const scenarioKey = rod.metadata?.scenarioKey || 'default_revenue';
  const scenario = await db.prepare(`SELECT * FROM journey_scenarios WHERE scenario_key=$1 AND is_active=true`).get(scenarioKey);
  if (!scenario) return { rod, scenario: null, eligibleStage: rod.current_stage, gates: [] };
  const [gates, clusters, evidenceRows, actors, thresholdProfile] = await Promise.all([
    db.prepare(`SELECT * FROM journey_gate_definitions WHERE scenario_id=$1 AND is_active=true ORDER BY sort_order`).all(scenario.id),
    db.prepare(`SELECT * FROM journey_metadata_clusters WHERE cluster_key = ANY($1::text[]) AND is_active=true`).all(scenario.selected_cluster_keys || []),
    db.prepare(`SELECT * FROM journey_rod_evidence WHERE rod_id=$1 ORDER BY observed_at DESC`).all(rodId),
    db.prepare(`SELECT * FROM journey_rod_actors WHERE rod_id=$1`).all(rodId),
    db.prepare(`SELECT * FROM journey_rod_threshold_profiles WHERE rod_id=$1`).get(rodId),
  ]);
  const evidence = new Map();
  for (const row of evidenceRows) if (!evidence.has(row.molecule_key)) evidence.set(row.molecule_key, row);
  const clusterMap = new Map(clusters.map((cluster) => [cluster.cluster_key, cluster]));
  const dimensions = dimensionValues(thresholdProfile, clusterMap, evidence, actors);
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
    const dimensionCombinations = combinationResults(thresholdProfile, dimensions, gate.stage_key);
    const missingDimensions = (gate.required_dimensions || []).filter((key) => !dimensionCombinations.find((item) => item.key === key)?.passed);
    const passed = !missingClusters.length && !missingMolecules.length && !missingActors.length && !unmetDependencies.length && !missingDimensions.length;
    results.push({ stageKey: gate.stage_key, passed, missingClusters, missingMolecules, missingActors, unmetDependencies, missingDimensions, dimensionCombinations });
    if (!passed) {
      if (requestJudgment && gate.judgment_policy !== 'never') await requestJourneyDecision(rodId, 'stage_gate_judgment', { stageKey: gate.stage_key, gaps: results.at(-1) }, gate.human_prompt || `Review whether this journey has sufficient evidence to advance to ${gate.stage_key}.`);
      break;
    }
    eligibleStage = gate.stage_key;
  }
  if (eligibleStage !== rod.current_stage) await recordRodEvent(rodId, { eventType: 'evidence_gate_advanced', fromStage: rod.current_stage, toStage: eligibleStage, metadata: { scenarioKey } });

  // Member Organization Lead promotion gate: a lead-lineage revenue rod that
  // just reached 'qualified_opportunity' becomes the organization's Revenue
  // Journey Data Rod — same row, re-linked, not a new object.
  if (eligibleStage === 'qualified_opportunity' && rod.rod_type === 'revenue_lifecycle' && rod.lead_id && rod.metadata?.isOrganizationLead) {
    await promoteOrganizationLeadRod(rodId, rod);
  }

  return { rod: await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId), scenario, thresholdProfile, dimensions: Object.fromEntries(dimensions), eligibleStage, gates: results };
}

// Creates (or reuses) the organization_profiles row for a qualifying Member
// Organization Lead, re-links its revenue rod onto that org, and upserts the
// org's master data account record. Idempotent — a second call for the same
// lead finds the org via originating_lead_id and no-ops the creation.
async function promoteOrganizationLeadRod(rodId, rod) {
  const lead = await db.prepare(`SELECT id, name, originating_member_user_id FROM leads WHERE id=$1`).get(rod.lead_id);
  if (!lead) return;
  let org = await db.prepare(`SELECT id FROM organization_profiles WHERE originating_lead_id=$1`).get(lead.id);
  if (!org) {
    const baseName = lead.name || `Organization ${lead.id}`;
    const slug = `org-${lead.id}-${crypto.randomBytes(3).toString('hex')}`;
    const now = Date.now();
    const result = await db.prepare(`
      INSERT INTO organization_profiles (slug, name, org_type, originating_lead_id, created_at, updated_at)
      VALUES ($1,$2,'client_org',$3,$4,$4) RETURNING id
    `).run(slug, baseName, lead.id, now);
    org = { id: Number(result.lastInsertRowid) };
  }
  await transitionRodOwnership(rodId, { toOrgId: Number(org.id), clearLeadId: true });
  await upsertAccountRecord({
    accountType: 'organization', orgId: Number(org.id), leadId: lead.id,
    displayName: lead.name || null, metadata: { promotedFromLeadId: lead.id },
  });
  // Also seat the originating member as the org's founding admin, if they
  // aren't already — the qualifying member is who this organization came
  // from.
  if (lead.originating_member_user_id) {
    await db.prepare(`
      INSERT INTO org_memberships (user_id, org_id, role) VALUES ($1,$2,'admin')
      ON CONFLICT (user_id, org_id) DO NOTHING
    `).run(Number(lead.originating_member_user_id), Number(org.id));
  }
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
