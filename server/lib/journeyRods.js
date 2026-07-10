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

