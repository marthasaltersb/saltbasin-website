import crypto from 'node:crypto';
import { db } from '../db.js';
import { ensureBacklogIntelligenceSchema } from './backlogIntelligenceSchema.js';

function tokens(value) {
  return new Set(String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((v) => v.length > 2));
}
function similarity(a, b) {
  const left = tokens(a), right = tokens(b);
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((v) => right.has(v)).length;
  return intersection / (left.size + right.size - intersection);
}
function canonicalKey(title) {
  return crypto.createHash('sha256').update([...tokens(title)].sort().join('|')).digest('hex').slice(0, 32);
}
function parseJson(text) {
  try { return JSON.parse(String(text).replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()); } catch { return { requirements: [] }; }
}

async function extract(provider, transcript) {
  const prompt = `Extract product requirements from this historical Salt Basin coding chat. Return JSON only: {"requirements":[{"title":"canonical concise title","summary":"one sentence","userStory":"As...","requirementDetail":"complete merged-ready requirement","businessRules":"atomic rules","designSpec":{"dataSchema":[],"functionality":[],"currentProductionImplementation":"known only"},"acceptanceCriteria":"testable","processSteps":[],"componentPaths":[],"estimatedAgentHours":0,"estimatedUserHours":0,"confidence":0.0}]}. Do not invent implementation or production state. Separate materially different requirements; combine restatements.\n\n${transcript.slice(0, 60000)}`;
  if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: process.env.BACKLOG_RECONCILIATION_OPENAI_MODEL || 'gpt-5.6-sol', instructions: 'You are a strict product-requirement extraction service.', input: prompt, max_output_tokens: 10000 }) });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.error?.message || 'OpenAI extraction failed');
    return parseJson(body.output_text || (body.output || []).flatMap((o) => o.content || []).map((c) => c.text || '').join(''));
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is required');
  const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: process.env.BACKLOG_RECONCILIATION_ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 10000, system: 'You are a strict product-requirement extraction service.', messages: [{ role: 'user', content: prompt }] }) });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || 'Anthropic extraction failed');
  return parseJson((body.content || []).map((c) => c.text || '').join(''));
}

async function findCanonical(item, existing) {
  const exactKey = canonicalKey(item.title);
  const exact = existing.find((row) => row.canonical_key === exactKey);
  if (exact) return { row: exact, score: 1 };
  let best = null, bestScore = 0;
  for (const row of existing) {
    const score = Math.max(similarity(item.title, row.title), similarity(`${item.title} ${item.requirementDetail}`, `${row.title} ${row.requirement_detail || ''}`));
    if (score > bestScore) { best = row; bestScore = score; }
  }
  return bestScore >= 0.58 ? { row: best, score: bestScore } : { row: null, score: bestScore };
}

async function upsertRequirement(item, source, existing, userId) {
  const match = await findCanonical(item, existing);
  const now = Date.now();
  let backlogId;
  if (match.row) {
    backlogId = Number(match.row.id);
    const mergedDesign = { ...(match.row.design_definition || {}), ...(item.designSpec || {}), reconciliation: { matchScore: match.score, lastSource: source.sessionId } };
    await db.prepare(`UPDATE backlog_items SET summary=COALESCE(summary,$1),user_story=COALESCE(user_story,$2),requirement_detail=CASE WHEN requirement_detail IS NULL OR length($3)>length(requirement_detail) THEN $3 ELSE requirement_detail END,business_rules=CASE WHEN business_rules IS NULL OR length($4)>length(business_rules) THEN $4 ELSE business_rules END,acceptance_criteria=CASE WHEN acceptance_criteria IS NULL OR length($5)>length(acceptance_criteria) THEN $5 ELSE acceptance_criteria END,process_steps=COALESCE(process_steps,$6),design_definition=$7::jsonb,estimated_agent_hours=COALESCE(estimated_agent_hours,$8),estimated_user_hours=COALESCE(estimated_user_hours,$9),canonical_key=COALESCE(canonical_key,$10),updated_at=$11 WHERE id=$12`)
      .run(item.summary || null, item.userStory || null, item.requirementDetail || '', item.businessRules || '', item.acceptanceCriteria || '', JSON.stringify(item.processSteps || []), mergedDesign, item.estimatedAgentHours || null, item.estimatedUserHours || null, canonicalKey(item.title), now, backlogId);
  } else {
    const row = await db.prepare(`INSERT INTO backlog_items (kind,title,summary,user_story,requirement_detail,business_rules,acceptance_criteria,process_steps,status,priority,canonical_key,design_definition,estimated_agent_hours,estimated_user_hours,tags,created_at,updated_at) VALUES ('feature',$1,$2,$3,$4,$5,$6,$7,'pending','p2',$8,$9::jsonb,$10,$11,$12,$13,$13) RETURNING *`)
      .get(item.title, item.summary || null, item.userStory || null, item.requirementDetail || null, item.businessRules || null, item.acceptanceCriteria || null, JSON.stringify(item.processSteps || []), canonicalKey(item.title), item.designSpec || {}, item.estimatedAgentHours || null, item.estimatedUserHours || null, JSON.stringify(['chat-reconstructed']), now);
    backlogId = Number(row.id); existing.push(row);
  }
  await db.prepare(`INSERT INTO backlog_requirement_sources (backlog_item_id,source_platform,source_session_id,source_message_id,raw_event_ids,extracted_title,extracted_requirement,extraction_model,confidence,first_observed_at,last_observed_at,metadata,created_at,updated_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$13) ON CONFLICT (backlog_item_id,source_platform,source_session_id,source_message_id) DO UPDATE SET extracted_requirement=EXCLUDED.extracted_requirement,confidence=EXCLUDED.confidence,last_observed_at=EXCLUDED.last_observed_at,updated_at=EXCLUDED.updated_at`)
    .run(backlogId, source.platform, source.sessionId, source.messageId || 'session', source.rawEventIds, item.title, item.requirementDetail || item.summary || item.title, source.model, item.confidence || null, source.firstAt, source.lastAt, { matchScore: match.score }, now);
  for (const path of item.componentPaths || []) {
    await db.prepare(`INSERT INTO backlog_components (backlog_item_id,component_type,component_key,folder_path,file_path,build_name,runtime_surface,metadata,created_at,updated_at) VALUES ($1,'file',$2,$3,$4,$5,$6,'{}',$7,$7) ON CONFLICT (backlog_item_id,component_type,component_key) DO UPDATE SET updated_at=EXCLUDED.updated_at`)
      .run(backlogId, path, String(path).includes('/') ? String(path).split('/').slice(0, -1).join('/') : null, path, String(path).split('/')[0] || null, String(path).startsWith('server/') ? 'server' : 'client', now);
  }
  return backlogId;
}

async function allocateContributions(backlogId, sessionId) {
  const rows = await db.prepare(`SELECT * FROM contribution_events WHERE source_session_id=$1 AND classification_status<>'superseded'`).all(sessionId);
  for (const row of rows) {
    await db.prepare(`INSERT INTO backlog_contribution_links (backlog_item_id,contribution_event_row_id,allocation_pct,allocated_active_minutes,contributor_type,participant_key,created_at) VALUES ($1,$2,100,$3,$4,$5,$6) ON CONFLICT (backlog_item_id,contribution_event_row_id) DO NOTHING`)
      .run(backlogId, row.row_id, Number(row.estimated_active_duration_min || 0), row.contributor_type, row.contributor_id || row.agent_id || 'unknown', Date.now());
    await db.prepare(`INSERT INTO agent_session_participants (source_session_id,participant_type,participant_key,display_name,role_label,metadata,created_at) VALUES ($1,$2,$3,$4,$5,'{}',$6) ON CONFLICT (source_session_id,participant_type,participant_key) DO NOTHING`)
      .run(sessionId, row.contributor_type === 'human' ? 'user' : 'agent', row.contributor_id || row.agent_id || 'unknown', row.contributor_id || row.agent_id || 'Unknown', row.contributor_role || null, Date.now());
  }
  const totals = await db.prepare(`SELECT COALESCE(SUM(allocated_active_minutes) FILTER (WHERE contributor_type='human'),0)/60.0 user_hours,COALESCE(SUM(allocated_active_minutes) FILTER (WHERE contributor_type<>'human'),0)/60.0 agent_hours FROM backlog_contribution_links WHERE backlog_item_id=$1`).get(backlogId);
  await db.prepare(`UPDATE backlog_items SET actual_user_hours=$1,actual_agent_hours=$2,hours_betsy=COALESCE(hours_betsy,$1),hours_claude=COALESCE(hours_claude,$2),updated_at=$3 WHERE id=$4`).run(totals.user_hours, totals.agent_hours, Date.now(), backlogId);
}

export async function reconcileBacklogHistory({ provider = 'anthropic', limit = 0, userId = null } = {}) {
  await ensureBacklogIntelligenceSchema();
  const sessions = await db.prepare(`SELECT source_platform,source_session_id,MIN(source_timestamp) first_at,MAX(source_timestamp) last_at,jsonb_agg(id ORDER BY source_timestamp) raw_ids,string_agg(COALESCE(observable_evidence,raw_payload::text),'\n' ORDER BY source_timestamp) transcript FROM raw_events WHERE source_session_id IS NOT NULL AND UPPER(source_platform) IN ('CODEX','CLAUDE','CLAUDE_CODE') GROUP BY source_platform,source_session_id ORDER BY MIN(source_timestamp)${limit ? ` LIMIT ${Number(limit)}` : ''}`).all();
  const existing = await db.prepare(`SELECT * FROM backlog_items ORDER BY id`).all();
  const stats = { sessions: sessions.length, requirements: 0, sources: 0, failures: [] };
  for (const session of sessions) {
    try {
      const result = await extract(provider, session.transcript || '');
      for (const item of result.requirements || []) {
        if (!item.title) continue;
        const backlogId = await upsertRequirement(item, { platform: session.source_platform, sessionId: session.source_session_id, rawEventIds: session.raw_ids || [], firstAt: Number(session.first_at || 0), lastAt: Number(session.last_at || 0), model: provider }, existing, userId);
        await allocateContributions(backlogId, session.source_session_id);
        stats.requirements += 1; stats.sources += 1;
      }
    } catch (error) { stats.failures.push({ sessionId: session.source_session_id, error: error.message }); }
  }
  return stats;
}
