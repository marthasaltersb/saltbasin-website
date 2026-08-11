import crypto from 'node:crypto';
import { db } from '../db.js';

export const WORK_STAGES = ['definition', 'design', 'implementation', 'verification', 'deployment', 'learning'];
export const KNOWLEDGE_TYPES = ['business_rule', 'decision', 'lesson', 'requirement', 'assumption', 'implementation_note'];

const BASE_CONTEXT = `You are a Salt Basin code and operating-model agent. Work inside the existing architecture and data model. Treat business context as governed data, not disposable prose. Connect requirements, rules, decisions, lessons, implementation evidence, EIDOS domains/capabilities, and backlog progression. Never claim a code change, verification result, or deployment without evidence. Flag proposed scope changes before acting.`;

function json(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function ensureDefaultContextProfile(userId) {
  const existing = await db.prepare(`SELECT * FROM agent_context_profiles WHERE is_default=true AND is_active=true ORDER BY updated_at DESC LIMIT 1`).get();
  if (existing) return existing;
  const now = Date.now();
  return db.prepare(`
    INSERT INTO agent_context_profiles (profile_key,label,instructions,source_config,is_default,is_active,created_by,created_at,updated_at)
    VALUES ('salt-basin-code-default','Salt Basin code + EIDOS context',$1,$2::jsonb,true,true,$3,$4,$4)
    ON CONFLICT (profile_key) DO UPDATE SET is_default=true,is_active=true,updated_at=EXCLUDED.updated_at
    RETURNING *
  `).get(BASE_CONTEXT, { includeBacklog: true, includeCapabilities: true, includeKnowledge: true }, userId, now);
}

export async function compileSessionContext({ profileId, backlogItemId }) {
  const profile = profileId
    ? await db.prepare(`SELECT * FROM agent_context_profiles WHERE id=$1 AND is_active=true`).get(profileId)
    : await db.prepare(`SELECT * FROM agent_context_profiles WHERE is_default=true AND is_active=true ORDER BY updated_at DESC LIMIT 1`).get();
  const backlog = backlogItemId ? await db.prepare(`
    SELECT b.*, c.slug capability_slug, c.name capability_name
    FROM backlog_items b LEFT JOIN capability_groups c ON c.id=b.capability_id WHERE b.id=$1
  `).get(backlogItemId) : null;
  const capabilities = await db.prepare(`SELECT id,slug,name,description FROM capability_groups ORDER BY sort_order,name LIMIT 100`).all();
  const knowledge = await db.prepare(`
    SELECT record_type,title,statement,status,domain_keys,capability_ids,reuse_score,template_candidate
    FROM agent_knowledge_records WHERE status IN ('approved','active')
    ORDER BY template_candidate DESC,reuse_score DESC,updated_at DESC LIMIT 80
  `).all();
  const snapshot = {
    version: 1,
    compiledAt: Date.now(),
    profile: profile ? { id: Number(profile.id), key: profile.profile_key, label: profile.label, instructions: profile.instructions } : null,
    backlog: backlog ? {
      id: Number(backlog.id), title: backlog.title, status: backlog.status, capabilityId: backlog.capability_id ? Number(backlog.capability_id) : null,
      capability: backlog.capability_name, requirementDetail: backlog.requirement_detail, businessRules: backlog.business_rules,
      designSpec: backlog.design_spec, acceptanceCriteria: backlog.acceptance_criteria,
    } : null,
    capabilityRegistry: capabilities.map((c) => ({ id: Number(c.id), slug: c.slug, name: c.name, description: c.description })),
    reusableKnowledge: knowledge.map((r) => ({ ...r, domain_keys: json(r.domain_keys, []), capability_ids: json(r.capability_ids, []) })),
  };
  const system = `${BASE_CONTEXT}\n\nCONTEXT PROFILE\n${profile?.instructions || BASE_CONTEXT}\n\nGOVERNED SESSION CONTEXT (JSON)\n${JSON.stringify(snapshot)}`;
  return { profile, snapshot, system };
}

export function extractionPrompt(threadId, backlogItemId, text) {
  return `Extract durable business and implementation knowledge from this code-agent exchange. Return only valid JSON with shape {"records":[{"recordType":"business_rule|decision|lesson|requirement|assumption|implementation_note","title":"short","statement":"atomic durable statement","rationale":"why","domainKeys":["domain-slug"],"capabilityIds":[1],"eidosObjectLinks":[{"type":"capability|feature|task|deliverable|rod|molecule|atom","key":"value"}],"confidence":0.0,"reuseScore":0.0,"templateCandidate":false,"implementation":{"stage":"definition|design|implementation|verification|deployment|learning","files":[],"verification":[],"commit":null}}],"stageEvents":[{"stage":"definition|design|implementation|verification|deployment|learning","eventType":"entered|progressed|completed|blocked","summary":"short","evidence":{}}]}. Rules must be atomic and testable. Do not invent domains, capabilities, files, commits, verification, or completed stages. Use empty arrays when unknown. Thread=${threadId}; backlogItem=${backlogItemId || 'none'}. Exchange:\n${text}`;
}

export async function recordExtraction({ threadId, messageId, backlogItemId, userId, extraction }) {
  const records = Array.isArray(extraction?.records) ? extraction.records : [];
  const stages = Array.isArray(extraction?.stageEvents) ? extraction.stageEvents : [];
  let inserted = 0;
  for (const item of records) {
    if (!KNOWLEDGE_TYPES.includes(item.recordType) || !item.statement) continue;
    const key = crypto.createHash('sha256').update(`${threadId}:${messageId}:${item.recordType}:${item.statement}`).digest('hex');
    await db.prepare(`
      INSERT INTO agent_knowledge_records
      (record_key,record_type,title,statement,rationale,confidence,domain_keys,capability_ids,eidos_object_links,backlog_item_id,source_thread_id,source_message_id,implementation,reuse_score,template_candidate,created_by,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13::jsonb,$14,$15,$16,$17,$17)
      ON CONFLICT (record_key) DO NOTHING
    `).run(key, item.recordType, item.title || item.statement.slice(0, 100), item.statement, item.rationale || null,
      item.confidence ?? null, item.domainKeys || [], item.capabilityIds || [], item.eidosObjectLinks || [], backlogItemId || null,
      threadId, messageId, item.implementation || {}, item.reuseScore || 0, !!item.templateCandidate, userId, Date.now());
    inserted += 1;
  }
  for (const event of stages) {
    if (!WORK_STAGES.includes(event.stage)) continue;
    await db.prepare(`INSERT INTO agent_work_stage_events (thread_id,backlog_item_id,stage,event_type,summary,evidence,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`)
      .run(threadId, backlogItemId || null, event.stage, event.eventType || 'progressed', event.summary || null, event.evidence || {}, userId, Date.now());
    await db.prepare(`UPDATE agent_threads SET stage=$1,updated_at=$2 WHERE id=$3`).run(event.stage, Date.now(), threadId);
  }
  return { inserted, stageEvents: stages.length };
}

