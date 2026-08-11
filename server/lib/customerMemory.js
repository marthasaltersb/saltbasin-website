import { db } from '../db.js';

async function upsertMemory({ userId, moduleScope, key, classification, orgId = null, value, sourceType, sourceId = null, now }) {
  const existing = orgId == null
    ? await db.prepare(`SELECT id FROM customer_agent_memory WHERE user_id=$1 AND module_scope=$2 AND memory_key=$3 AND org_id IS NULL`).get(userId, moduleScope, key)
    : await db.prepare(`SELECT id FROM customer_agent_memory WHERE user_id=$1 AND module_scope=$2 AND memory_key=$3 AND org_id=$4`).get(userId, moduleScope, key, orgId);
  if (existing) return db.prepare(`UPDATE customer_agent_memory SET classification=$1,value=$2,source_type=$3,source_id=$4,refreshed_at=$5 WHERE id=$6`).run(classification, value, sourceType, sourceId, now, existing.id);
  return db.prepare(`INSERT INTO customer_agent_memory (user_id,module_scope,memory_key,classification,org_id,value,source_type,source_id,refreshed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`).run(userId, moduleScope, key, classification, orgId, value, sourceType, sourceId, now);
}

export async function refreshCustomerMemory(now = Date.now()) {
  const users = await db.prepare(`SELECT id,email,display_name FROM users`).all();
  for (const user of users) {
    const lead = await db.prepare(`SELECT id,agent_memory,context_metadata,stage_gate_metadata FROM leads WHERE converted_user_id=$1 ORDER BY updated_at DESC LIMIT 1`).get(user.id);
    if (lead) await upsertMemory({ userId: user.id, moduleScope: 'member', key: 'lead_context', classification: 'private', value: { memory: lead.agent_memory || {}, context: lead.context_metadata || {}, gates: lead.stage_gate_metadata || {} }, sourceType: 'lead', sourceId: String(lead.id), now });
    const memberships = await db.prepare(`SELECT om.org_id,om.role,op.name FROM org_memberships om JOIN organization_profiles op ON op.id=om.org_id WHERE om.user_id=$1`).all(user.id);
    for (const membership of memberships) await upsertMemory({ userId: user.id, moduleScope: 'organization', key: `org:${membership.org_id}`, classification: 'organization', orgId: membership.org_id, value: { organizationName: membership.name, memberRole: membership.role }, sourceType: 'org_membership', sourceId: String(membership.org_id), now });
    const licenses = await db.prepare(`SELECT id,product_id,tier,is_active,org_id FROM product_licenses WHERE user_id=$1 OR org_id IN (SELECT org_id FROM org_memberships WHERE user_id=$1)`).all(user.id);
    await upsertMemory({ userId: user.id, moduleScope: 'products', key: 'provisioned_products', classification: 'private', value: { licenses: licenses.map((item) => ({ productKey: item.product_id, tier: item.tier, active: item.is_active, organizationId: item.org_id })) }, sourceType: 'product_licenses', now });
  }
  return { refreshedUsers: users.length };
}

export async function permittedCustomerMemory(userId, moduleScope) {
  const rows = await db.prepare(`SELECT module_scope,memory_key,classification,org_id,value,refreshed_at FROM customer_agent_memory WHERE user_id=$1 AND (module_scope=$2 OR module_scope IN ('member','products')) ORDER BY refreshed_at DESC`).all(userId, moduleScope);
  const orgIds = new Set((await db.prepare(`SELECT org_id FROM org_memberships WHERE user_id=$1`).all(userId)).map((row) => Number(row.org_id)));
  return rows.filter((row) => row.classification !== 'organization' || orgIds.has(Number(row.org_id))).map((row) => ({ scope: row.module_scope, key: row.memory_key, classification: row.classification, value: row.value, refreshedAt: Number(row.refreshed_at) }));
}

export async function captureMemberChatMemory({ userId, moduleScope = 'member', userMessage, assistantMessage, toolCalls = [] }) {
  const now = Date.now();
  const scope = String(moduleScope || 'member').slice(0, 80);
  await db.prepare(`INSERT INTO member_agent_messages (user_id,module_scope,role,content,metadata,created_at) VALUES ($1,$2,'user',$3,$4,$5),($1,$2,'assistant',$6,$7,$5)`).run(userId, scope, String(userMessage).slice(0, 20000), { source: 'member_agent_chat' }, now, String(assistantMessage || '').slice(0, 20000), { source: 'member_agent_chat', toolCalls: toolCalls.slice(0, 20) });
  const recent = await db.prepare(`SELECT role,content,created_at FROM member_agent_messages WHERE user_id=$1 AND module_scope=$2 ORDER BY created_at DESC,id DESC LIMIT 24`).all(userId, scope);
  const signals = [];
  const text = String(userMessage || '');
  if (/urgent|asap|deadline|soon/i.test(text)) signals.push('urgency');
  if (/budget|price|cost|afford/i.test(text)) signals.push('commercial_interest');
  if (/hire|proposal|contract|engage/i.test(text)) signals.push('buying_intent');
  if (/career|resume|portfolio|job|role/i.test(text)) signals.push('career_intent');
  await upsertMemory({ userId, moduleScope: scope, key: 'chat_feedback', classification: 'private', value: { customerSignals: signals, latestQuote: text.slice(0, 2000), latestAssistantContext: String(assistantMessage || '').slice(0, 4000), transcript: recent.reverse(), updatedFromChatAt: now }, sourceType: 'member_agent_chat', sourceId: String(now), now });
}
