// Cover-letter agent (2026-10-02) — a conversational editor confined to ONE cover letter.
//
// Confinement (enforced here, in one place):
//  - Data in/out: the agent reads and proposes edits to the cover letter output it is opened
//    on. It cannot modify any other output, Career Master, or another member's data.
//  - Library: every search runs only over the package's own content (packageSearch.js
//    buildPackageLibrary): the cover letter, the package's other outputs and the job-rec text.
//  - Order of work per turn: search -> deterministic rules -> LLM only if both cannot satisfy it.
//  - Output: edit operations shown as tracked changes; accepting files a NEW draft version in
//    the letter's lineage. An approved/published version is never edited in place.
//  - Every turn is recorded in cover_letter_agent_turns (LLM called?, model, tokens, latency).
import { db } from '../db.js';
import { createResumeOutputProjection } from './resumeProjection.js';
import { buildPackageLibrary, searchUnits, jobRecText } from './packageSearch.js';
import { getSettings } from './coverLetterTemplate.js';
import { resolveRequest } from './coverLetterRules.js';
import { validateOps, resultBlocks, buildDiff, describeOps } from './coverLetterEdits.js';
import { proposeEditsWithLlm, LlmUnavailableError } from './coverLetterLlm.js';

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
export class AgentRequestError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

/** Letter content normalised to { header, blocks } whatever shape the stored output has. */
export function toDocument(content) {
  if (content?.format === 'document_blocks') return { header: content.header || {}, blocks: (content.blocks || []).map((b) => ({ ...b })), base: content };
  const blocks = [];
  if (content?.rawText) String(content.rawText).split(/\n{2,}/).filter((p) => p.trim()).forEach((p) => blocks.push({ type: 'paragraph', text: p.trim() }));
  else {
    if (content?.openingHook) blocks.push({ type: 'paragraph', text: content.openingHook });
    (content?.bodyParagraphs || []).forEach((p) => blocks.push({ type: 'paragraph', text: p.text }));
    if (content?.closing) blocks.push({ type: 'paragraph', text: content.closing });
  }
  return { header: {}, blocks, base: null };
}

async function ownedLetter(userId, projectionId) {
  const row = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, userId);
  if (!row) throw new AgentRequestError('Cover letter not found.', 404);
  if (row.output_type !== 'cover_letter') throw new AgentRequestError('The cover-letter agent only works on cover letters. This output is a ' + (row.output_type || 'resume').replace('_', ' ') + '.', 400);
  if (!row.generated_content) throw new AgentRequestError('This cover letter has no content to edit.', 400);
  return row;
}

/** Newest non-archived version in the letter's lineage. */
export async function latestVersion(userId, row) {
  const root = Number(row.lineage_root_id || row.id);
  return (await db.prepare(`
    SELECT * FROM resume_output_projections
     WHERE user_id=$1 AND COALESCE(lineage_root_id,id)=$2 AND output_status<>'archived'
     ORDER BY id DESC LIMIT 1
  `).get(userId, root)) || row;
}

function versionSummary(r) {
  return { id: Number(r.id), status: r.output_status, createdAt: Number(r.created_at), approvedAt: r.approved_at != null ? Number(r.approved_at) : null, shared: !!r.share_token };
}

export async function openLetter(userId, projectionId) {
  const requested = await ownedLetter(userId, projectionId);
  const row = await latestVersion(userId, requested);
  const root = Number(row.lineage_root_id || row.id);
  const versions = await db.prepare(`SELECT * FROM resume_output_projections WHERE user_id=$1 AND COALESCE(lineage_root_id,id)=$2 ORDER BY id`).all(userId, root);
  const doc = toDocument(parseJson(row.generated_content));
  const lib = await buildPackageLibrary(userId, row);
  const settings = await getSettings(userId);
  return {
    id: Number(row.id), requestedId: Number(requested.id), name: row.preset_name, status: row.output_status,
    opportunityRodId: row.career_opportunity_rod_id != null ? Number(row.career_opportunity_rod_id) : null,
    header: doc.header, blocks: doc.blocks.map((b, i) => ({ n: i + 1, type: b.type, role: b.role || null, text: b.text ?? '' })),
    versions: versions.map(versionSummary),
    package: { members: lib.members, hasJobRec: lib.hasJobRec },
    llm: { provider: settings.provider, model: settings.provider === 'stub' ? 'offline-test-stub' : settings.model },
  };
}

function turnRow(t) {
  return {
    id: Number(t.id), request: t.request_text, route: t.route, message: t.outcome_message, status: t.status,
    hits: parseJson(t.search_hits) || [], ops: parseJson(t.proposed_ops) || [],
    llm: { called: !!t.llm_called, model: t.model, provider: t.provider, inputTokens: t.input_tokens, outputTokens: t.output_tokens, tokensEstimated: !!t.tokens_estimated, latencyMs: t.latency_ms, attempts: Number(t.llm_attempts || 0) },
    baseId: Number(t.projection_id), resultId: t.result_projection_id != null ? Number(t.result_projection_id) : null, createdAt: Number(t.created_at),
  };
}

async function diffFor(userId, t) {
  const ops = parseJson(t.proposed_ops) || [];
  if (!ops.length) return null;
  const base = await db.prepare(`SELECT generated_content FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(t.projection_id, userId);
  if (!base) return null;
  const { blocks } = toDocument(parseJson(base.generated_content));
  return { rows: buildDiff(blocks, validateOps(ops, blocks.length)), summary: describeOps(ops) };
}

export async function listTurns(userId, projectionId) {
  const requested = await ownedLetter(userId, projectionId);
  const root = Number(requested.lineage_root_id || requested.id);
  const rows = await db.prepare(`
    SELECT * FROM cover_letter_agent_turns WHERE user_id=$1 AND lineage_root_id=$2 ORDER BY id DESC LIMIT 40
  `).all(userId, root);
  const latest = await latestVersion(userId, requested);
  const turns = [];
  for (const t of rows.reverse()) {
    const view = turnRow(t);
    if (t.status === 'proposed' && Number(t.projection_id) !== Number(latest.id)) {
      // Made against an older version of the letter — shown, but no longer acceptable.
      view.status = 'superseded';
    } else if (t.status === 'proposed') {
      view.diff = await diffFor(userId, t);
    }
    turns.push(view);
  }
  return turns;
}

async function saveTurn(userId, row, sessionKey, request, data) {
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO cover_letter_agent_turns
      (user_id, session_key, projection_id, lineage_root_id, opportunity_rod_id, request_text, route, outcome_message, search_hits, proposed_ops,
       status, llm_called, model, provider, input_tokens, output_tokens, tokens_estimated, latency_ms, llm_attempts, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    RETURNING id
  `).run(userId, sessionKey, row.id, row.lineage_root_id || row.id, row.career_opportunity_rod_id ?? null, request, data.route, data.message ?? null,
    data.hits || [], data.ops || [], data.status, !!data.llm?.called, data.llm?.model ?? null, data.llm?.provider ?? null,
    data.llm?.inputTokens ?? null, data.llm?.outputTokens ?? null, !!data.llm?.tokensEstimated, data.llm?.latencyMs ?? null, data.llm?.attempts ?? 0, now);
  return db.prepare(`SELECT * FROM cover_letter_agent_turns WHERE id=$1`).get(Number(result.lastInsertRowid));
}

const hitView = (h) => ({ source: h.sourceLabel, sourceKey: h.source, paragraph: h.index, text: h.text.length > 400 ? `${h.text.slice(0, 399)}…` : h.text, score: h.score, matchedTerms: h.matchedTerms });

/** One chat turn. Never throws for "the agent couldn't / wouldn't" — those are recorded outcomes; throws only for bad input. */
export async function runTurn(userId, { projectionId, request, sessionKey }) {
  const text = String(request || '').trim();
  if (!text) throw new AgentRequestError('Type a request for the cover-letter agent.');
  if (text.length > 1000) throw new AgentRequestError('Keep the request under 1000 characters.');
  const session = String(sessionKey || '').slice(0, 64) || 'no-session';
  const requested = await ownedLetter(userId, projectionId);
  const row = await latestVersion(userId, requested);
  const doc = toDocument(parseJson(row.generated_content));
  const blocks = doc.blocks;

  // 1. Package-confined search — always first, always shown.
  const lib = await buildPackageLibrary(userId, row);
  const search = searchUnits(lib.units, text);
  const hits = search.hits.map(hitView);
  const settings = await getSettings(userId);
  const jobRec = await jobRecText(row);

  // 2. Deterministic rules.
  const decision = resolveRequest({ request: text, blocks, search, units: lib.units, settings, jobRec });
  const base = { hits, llm: { called: false } };
  let data;

  if (decision.kind === 'edits') {
    const ops = validateOps(decision.ops, blocks.length);
    data = { ...base, route: 'rules', message: decision.summary, ops, status: 'proposed' };
  } else if (decision.kind === 'info') {
    data = { ...base, route: 'search_only', message: decision.message, ops: [], status: 'none' };
  } else if (decision.kind === 'unsatisfied') {
    data = { ...base, route: 'rules', message: decision.message, ops: [], status: 'none' };
  } else if (decision.kind === 'refused') {
    data = { ...base, route: 'refused', message: decision.message, ops: [], status: 'none', refusal: decision.reason };
  } else {
    // 3. Only now: the LLM, with the search hits and only the affected paragraph(s).
    try {
      const r = await proposeEditsWithLlm({
        userId, settings, request: text, letter: blocks, affected: decision.affected,
        hits: search.hits.filter((h) => h.source !== 'cover_letter' || decision.affected.includes(h.index)), jobTitle: row.preset_name,
      });
      data = {
        ...base, route: 'llm', message: r.summary || 'Proposed edit from the language model.', ops: r.ops, status: 'proposed',
        llm: { called: true, model: r.model, provider: r.provider, inputTokens: r.usage.input, outputTokens: r.usage.output, tokensEstimated: r.usage.estimated, latencyMs: r.latencyMs, attempts: r.attempts },
      };
    } catch (e) {
      if (e instanceof LlmUnavailableError) {
        data = { ...base, route: 'blocked', message: e.message, ops: [], status: 'none', blockedCode: e.code, llm: { called: false, provider: settings.provider, model: settings.provider === 'stub' ? 'offline-test-stub' : settings.model } };
      } else {
        data = {
          ...base, route: 'failed', message: e.message, ops: [], status: 'none',
          llm: { called: (e.attempts || 0) > 0, model: e.model, provider: e.provider, inputTokens: e.usage?.input ?? null, outputTokens: e.usage?.output ?? null, tokensEstimated: !!e.usage?.estimated, latencyMs: e.latencyMs ?? null, attempts: e.attempts || 0 },
        };
      }
    }
  }

  const saved = await saveTurn(userId, row, session, text, data);
  const view = turnRow(saved);
  view.diff = data.ops.length ? { rows: buildDiff(blocks, data.ops), summary: describeOps(data.ops) } : null;
  view.refusal = data.refusal || null;
  view.blockedCode = data.blockedCode || null;
  return view;
}

/** Accept (files a new draft version in the lineage) or reject a proposed turn. */
export async function decideTurn(userId, turnId, decision) {
  const t = await db.prepare(`SELECT * FROM cover_letter_agent_turns WHERE id=$1 AND user_id=$2`).get(turnId, userId);
  if (!t) throw new AgentRequestError('Turn not found.', 404);
  if (t.status !== 'proposed') throw new AgentRequestError(`This proposal was already ${t.status}.`, 409);
  const now = Date.now();
  if (decision === 'reject') {
    await db.prepare(`UPDATE cover_letter_agent_turns SET status='rejected', decided_at=$1 WHERE id=$2 AND status='proposed'`).run(now, turnId);
    return { status: 'rejected' };
  }
  const baseRow = await ownedLetter(userId, t.projection_id);
  const latest = await latestVersion(userId, baseRow);
  if (Number(latest.id) !== Number(baseRow.id)) {
    throw new AgentRequestError('The letter has a newer version than the one this proposal was made against. Ask again so the edit applies to the current text.', 409);
  }
  const doc = toDocument(parseJson(baseRow.generated_content));
  const ops = validateOps(parseJson(t.proposed_ops), doc.blocks.length);
  const blocks = resultBlocks(doc.blocks, ops);
  if (!blocks.length) throw new AgentRequestError('Accepting this would leave the letter empty. Reject it and ask for a smaller change.', 400);
  const claimed = await db.prepare(`UPDATE cover_letter_agent_turns SET status='accepted', decided_at=$1 WHERE id=$2 AND status='proposed'`).run(now, turnId);
  if (!claimed.changes) throw new AgentRequestError('This proposal was already decided.', 409);
  try {
    const prior = doc.base || { format: 'document_blocks', version: 1, header: doc.header };
    const content = { ...prior, format: 'document_blocks', version: 1, header: doc.header, blocks, generation: { ...(prior.generation || {}), lastEdit: { turnId: Number(turnId), route: t.route, at: now } } };
    const authors = parseJson(baseRow.authors);
    const created = await createResumeOutputProjection(userId, {
      presetId: baseRow.preset_id, presetName: baseRow.preset_name, careerOpportunityRodId: baseRow.career_opportunity_rod_id != null ? Number(baseRow.career_opportunity_rod_id) : null,
      generatedContent: content, outputType: 'cover_letter', source: 'generated', regenerateFromId: Number(baseRow.id),
      authors: [...new Set([...(Array.isArray(authors) ? authors : []), 'Cover-letter agent'])],
    });
    if (baseRow.target_job_description) await db.prepare(`UPDATE resume_output_projections SET target_job_description=$1 WHERE id=$2`).run(baseRow.target_job_description, created.id);
    await db.prepare(`UPDATE cover_letter_agent_turns SET result_projection_id=$1 WHERE id=$2`).run(created.id, turnId);
    return { status: 'accepted', newVersionId: Number(created.id) };
  } catch (e) {
    // Put the proposal back so the member can retry; the failure is returned, not swallowed.
    await db.prepare(`UPDATE cover_letter_agent_turns SET status='proposed', decided_at=NULL WHERE id=$1`).run(turnId);
    throw e;
  }
}

/** Per-session and overall usage so session/contribution trends can show LLM vs rules/search turns. */
export async function metricsSummary(userId, { sessionKey = null } = {}) {
  const where = sessionKey ? 'user_id=$1 AND session_key=$2' : 'user_id=$1';
  const params = sessionKey ? [userId, sessionKey] : [userId];
  const t = await db.prepare(`
    SELECT COUNT(*)::int AS turns, COUNT(*) FILTER (WHERE llm_called)::int AS llm_turns,
           COALESCE(SUM(input_tokens),0)::int AS input_tokens, COALESCE(SUM(output_tokens),0)::int AS output_tokens,
           COALESCE(AVG(latency_ms) FILTER (WHERE llm_called),0)::int AS avg_llm_latency_ms,
           COUNT(*) FILTER (WHERE status='accepted')::int AS accepted, COUNT(*) FILTER (WHERE status='rejected')::int AS rejected
      FROM cover_letter_agent_turns WHERE ${where}
  `).get(...params);
  return { turns: t.turns, llmTurns: t.llm_turns, inputTokens: t.input_tokens, outputTokens: t.output_tokens, avgLlmLatencyMs: t.avg_llm_latency_ms, accepted: t.accepted, rejected: t.rejected };
}
