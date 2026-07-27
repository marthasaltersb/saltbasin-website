// Contribution Intelligence — Phase 2 heuristic classifier.
//
// Reads raw_events not yet covered by any contribution_events row and
// inserts provisional, versioned classifications using ONLY observable
// signals: JSONL/log event_type, and — for AI turns — the tool name of each
// tool_use content block. This does not attempt semantic classification of
// human turns or AI free-text reasoning (see contributionTaxonomy.js's
// TOOL_CLASS_MAP comment) — those get contributor_type set (highly
// observable: who authored the line) but contribution_class left null with
// low confidence, honestly disclosed as unclassified rather than guessed.
// A single ASSISTANT_TURN raw event with multiple tool_use blocks emits one
// contribution_event PER block (§II: never flatten a turn into one
// undifferentiated event).
//
// Idempotent: a raw_event already covered by an existing contribution_events
// row (any raw_event_ids array containing its id) is skipped. Re-running
// only classifies newly-ingested raw_events.
//
// Usage: node scripts/classify-contribution-events.mjs [--limit <n>]
import 'dotenv/config';
import crypto from 'node:crypto';
import { db } from '../server/db.js';
import { TAXONOMY_VERSION, TOOL_CLASS_MAP, CODEX_EVENT_TYPE_CLASS_MAP } from '../server/data/contributionTaxonomy.js';

const CLASSIFICATION_METHOD = 'heuristic-v1';
const args = process.argv.slice(2);
function argVal(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 ? Number(args[i + 1]) : fallback;
}
const LIMIT = argVal('--limit', Infinity);

const sql = db.raw;

function docClassForWrite(toolInput) {
  const p = toolInput?.file_path || toolInput?.path || '';
  return /\.mdx?$/i.test(p) ? 'DOCUMENT_GENERATION' : 'CODE_GENERATION';
}

function newLogicalId() {
  return crypto.randomUUID();
}

// Decompose one CLAUDE ASSISTANT_TURN raw event into one contribution_event
// per content block. Returns an array of partial rows (contributor_type,
// contribution_class, confidence, scores, action_type, raw_input_reference,
// normalized_semantic_summary already set; caller fills in shared fields).
function classifyAssistantTurn(rawEvent) {
  let payload;
  try { payload = rawEvent.raw_payload; } catch { payload = null; }
  const content = payload?.message?.content;
  const blocks = Array.isArray(content) ? content : (typeof content === 'string' ? [{ type: 'text', text: content }] : []);

  if (blocks.length === 0) {
    return [{
      contributor_type: 'AI_MODEL',
      contribution_class: null,
      action_type: 'unparseable_content',
      confidence: 0.1,
      scores: { contributor_type_confidence: 0.6, contribution_class_confidence: 0 },
      classification_status: 'provisional',
    }];
  }

  return blocks.map((block) => {
    if (block.type === 'tool_use') {
      let cls = TOOL_CLASS_MAP[block.name] || null;
      if (block.name === 'Write' || block.name === 'Edit') cls = docClassForWrite(block.input);
      if (!cls && typeof block.name === 'string' && block.name.startsWith('mcp__')) cls = 'EXECUTION';
      return {
        contributor_type: 'AI_MODEL',
        contribution_class: cls,
        action_type: block.name || 'tool_use',
        raw_input_reference: block.input ? JSON.stringify(block.input).slice(0, 500) : null,
        confidence: cls ? 0.7 : 0.25,
        scores: { contributor_type_confidence: 0.95, contribution_class_confidence: cls ? 0.7 : 0 },
        classification_status: 'provisional',
      };
    }
    if (block.type === 'thinking') {
      return {
        contributor_type: 'AI_MODEL',
        contribution_class: null,
        action_type: 'reasoning_trace',
        normalized_semantic_summary: (block.thinking || '').slice(0, 300) || null,
        confidence: 0.15,
        scores: { contributor_type_confidence: 0.95, contribution_class_confidence: 0 },
        classification_status: 'provisional',
      };
    }
    // text block (or unrecognized block type, treated as text-shaped)
    const text = block.text || '';
    return {
      contributor_type: 'AI_MODEL',
      contribution_class: null,
      action_type: 'text_response',
      normalized_semantic_summary: text.slice(0, 300) || null,
      confidence: 0.2,
      scores: { contributor_type_confidence: 0.95, contribution_class_confidence: 0 },
      classification_status: 'provisional',
    };
  });
}

function classifyRawEvent(rawEvent) {
  const { source_platform, event_type } = rawEvent;

  if (source_platform === 'CLAUDE') {
    if (event_type === 'ASSISTANT_TURN') return classifyAssistantTurn(rawEvent);
    if (event_type === 'USER_TURN') {
      return [{
        contributor_type: 'HUMAN',
        contribution_class: null,
        action_type: 'user_message',
        normalized_semantic_summary: rawEvent.observable_evidence?.slice(0, 300) || null,
        confidence: 0.3,
        scores: { contributor_type_confidence: 0.95, contribution_class_confidence: 0 },
        classification_status: 'provisional',
      }];
    }
    if (event_type === 'TOOL_RESULT_ECHO') {
      return [{
        contributor_type: 'SYSTEM_PROCESS',
        contribution_class: null,
        action_type: 'tool_result',
        evidence_type: 'TOOL_OUTPUT',
        confidence: 0.4,
        scores: { contributor_type_confidence: 0.9, contribution_class_confidence: 0 },
        classification_status: 'provisional',
      }];
    }
    // SYSTEM_EVENT, OTHER — Claude Code transcript bookkeeping (compaction
    // summaries, file-history snapshots, etc.). Genuinely ambiguous who/what
    // this represents without deeper transcript-format-specific parsing —
    // disclosed as low confidence rather than guessed.
    return [{
      contributor_type: 'SYSTEM_PROCESS',
      contribution_class: null,
      action_type: event_type?.toLowerCase() || 'unknown',
      confidence: 0.1,
      scores: { contributor_type_confidence: 0.3, contribution_class_confidence: 0 },
      classification_status: 'provisional',
    }];
  }

  if (source_platform === 'CODEX') {
    if (event_type === 'ERROR') {
      return [{
        contributor_type: 'SYSTEM_PROCESS',
        contribution_class: null,
        action_type: 'error_signal',
        evidence_type: 'ERROR_LOG',
        confidence: 0.2,
        scores: { contributor_type_confidence: 0.5, contribution_class_confidence: 0 },
        classification_status: 'provisional',
      }];
    }
    const cls = CODEX_EVENT_TYPE_CLASS_MAP[event_type] || null;
    return [{
      contributor_type: 'AI_AGENT',
      contribution_class: cls,
      action_type: event_type?.toLowerCase() || 'tool_activity',
      normalized_semantic_summary: rawEvent.observable_evidence?.slice(0, 300) || null,
      confidence: cls ? 0.55 : 0.2,
      scores: { contributor_type_confidence: 0.85, contribution_class_confidence: cls ? 0.55 : 0 },
      classification_status: 'provisional',
    }];
  }

  // Unknown source platform — should not happen given only CLAUDE/CODEX
  // adapters exist, but fail honestly rather than silently.
  return [{
    contributor_type: 'SYSTEM_PROCESS',
    contribution_class: null,
    action_type: 'unrecognized_source_platform',
    confidence: 0,
    scores: { contributor_type_confidence: 0, contribution_class_confidence: 0 },
    classification_status: 'provisional',
  }];
}

console.log('[classify] Fetching unclassified raw_events...');
const BATCH = 1000;
let offset = 0;
let totalRawSeen = 0;
let totalEventsInserted = 0;
const byClass = {};
const byContributorType = {};

for (;;) {
  if (totalRawSeen >= LIMIT) break;
  const rows = await sql`
    SELECT re.id, re.source_platform, re.event_type, re.observable_evidence, re.raw_payload
    FROM raw_events re
    WHERE NOT EXISTS (
      SELECT 1 FROM contribution_events ce WHERE ce.raw_event_ids ? re.id
    )
    ORDER BY re.id
    LIMIT ${BATCH}
  `;
  if (rows.length === 0) break;

  const insertRows = [];
  for (const rawEvent of rows) {
    const parts = classifyRawEvent(rawEvent);
    for (const part of parts) {
      const logicalId = newLogicalId();
      byClass[part.contribution_class || '(unclassified)'] = (byClass[part.contribution_class || '(unclassified)'] || 0) + 1;
      byContributorType[part.contributor_type] = (byContributorType[part.contributor_type] || 0) + 1;
      insertRows.push({
        contribution_event_id: logicalId,
        attribution_version: 1,
        classification_status: part.classification_status,
        raw_event_ids: JSON.stringify([rawEvent.id]),
        source_platform: rawEvent.source_platform,
        contributor_type: part.contributor_type,
        contribution_class: part.contribution_class,
        action_type: part.action_type || null,
        evidence_type: part.evidence_type || null,
        confidence: part.confidence,
        scores: JSON.stringify(part.scores || {}),
        raw_input_reference: part.raw_input_reference || null,
        normalized_semantic_summary: part.normalized_semantic_summary || null,
        classification_method: CLASSIFICATION_METHOD,
        classification_version: TAXONOMY_VERSION,
      });
    }
  }

  if (insertRows.length > 0) {
    await sql`
      INSERT INTO contribution_events ${sql(insertRows,
        'contribution_event_id', 'attribution_version', 'classification_status', 'raw_event_ids',
        'source_platform', 'contributor_type', 'contribution_class', 'action_type', 'evidence_type',
        'confidence', 'scores', 'raw_input_reference', 'normalized_semantic_summary',
        'classification_method', 'classification_version')}
    `;
    totalEventsInserted += insertRows.length;
  }

  totalRawSeen += rows.length;
  offset += rows.length;
  console.log(`[classify] Processed ${totalRawSeen} raw_events -> ${totalEventsInserted} contribution_events so far...`);
}

console.log('\n[classify] Done.');
console.log('Raw events classified:', totalRawSeen);
console.log('Contribution events inserted:', totalEventsInserted);
console.log('By contributor_type:', byContributorType);
console.log('By contribution_class:', byClass);
process.exit(0);
