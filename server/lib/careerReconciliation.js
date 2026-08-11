// Career Foundation Sourcing & Reconciliation, Phase 2 (2026-08-10) —
// detects when multiple equal-standing sources disagree about the same
// Career Master fact (a "source conflict"), or when an AI-proposed mapping
// from a source document had no confident atom match (an "ambiguous
// mapping"), and surfaces both as prioritized review tasks in
// career_reconciliation_tasks. Conflicts are reviewed before ambiguous
// mappings — task_type itself is the priority signal, no separate column.
//
// Deliberately does not pick a winner: every conflict is recorded with all
// disagreeing sources attached, and stays open until a human (via the UI or
// BestyStaff — see server/routes/careerReconciliation.js) resolves it. No
// source_tier or confidence value here ever auto-selects a value.
import { db } from '../db.js';
import { recordRodEvent } from './journeyRods.js';
import { ensureCareerMasterRod, syncSingleEntry } from './careerAtomMigration.js';
import { CAREER_ENTRY_SOURCES, atomDefinitionByKey, isJsonbSourceColumn } from './careerAtomRegistry.js';

export const TABLE_BY_ENTRY_TYPE = Object.fromEntries(CAREER_ENTRY_SOURCES.map((s) => [s.entryType, s.table]));

// The one shared identity-match definition — previously duplicated inline in
// both /mappings/classify and /mappings/commit in server/routes/careerMaster.js;
// both now import this instead of keeping their own copy.
export const IDENTITY_COLUMNS_BY_ENTRY_TYPE = {
  career_job_entry: ['company', 'title'], career_skill_entry: ['skill'], career_tool_entry: ['current_name', 'name_used'],
  career_engagement_entry: ['name'], career_domain_entry: ['title'], career_certification_entry: ['name', 'issuer'], career_deal_entry: ['deal_name'],
};

const CONFIDENT_AFFINITY_FLOOR = 0.6;

function normalize(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

async function upsertReconciliationTask(rod, { taskType, entryType, atomKey, targetTable, targetId, evidenceRefs, reasoning }) {
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO career_reconciliation_tasks
      (rod_id, task_type, entry_type, atom_key, target_table, target_id, evidence_refs, reasoning, detected_at, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$9,$9)
    ON CONFLICT (rod_id, entry_type, atom_key, task_type) WHERE status = 'open'
    DO UPDATE SET evidence_refs = EXCLUDED.evidence_refs, reasoning = EXCLUDED.reasoning, updated_at = EXCLUDED.updated_at
    RETURNING id, (xmax = 0) AS inserted
  `).get(rod.id, taskType, entryType, atomKey || null, targetTable || null, targetId || null, evidenceRefs, reasoning || null, now);
  const row = result;
  if (row?.inserted) {
    // fresh insert only — a re-detection that just refreshed an existing
    // open task's evidence does not re-emit the flagged event
    await recordRodEvent(rod.id, {
      eventType: taskType === 'source_conflict' ? 'career_conflict_detected' : 'career_ambiguous_mapping_flagged',
      metadata: { taskId: Number(row.id), entryType, atomKey: atomKey || null },
    });
  }
  return row;
}

// Scans committed career_source_mappings for a user's Career Master rod and
// flags any (target_table, target_id, atom_key) where two or more distinct
// sources committed different values. Call after POST /mappings/commit.
export async function detectConflicts(userId) {
  const rod = await ensureCareerMasterRod(userId);
  const rows = await db.prepare(`
    SELECT * FROM career_source_mappings WHERE user_id = $1 AND target_id IS NOT NULL ORDER BY target_table, target_id, atom_key, created_at
  `).all(userId);

  const groups = new Map();
  for (const row of rows) {
    const key = `${row.target_table}:${row.target_id}:${row.atom_key}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const flagged = [];
  for (const [, group] of groups) {
    const bySource = new Map();
    for (const row of group) {
      const sourceKey = row.document_id != null ? `doc:${row.document_id}` : `kind:${row.source_kind}`;
      // Later commits from the same source supersede earlier ones for that
      // source's own claim — keep the latest per source, not every revision.
      bySource.set(sourceKey, row);
    }
    if (bySource.size < 2) continue;
    const distinctValues = new Set([...bySource.values()].map((row) => normalize(row.committed_value)));
    if (distinctValues.size < 2) continue;

    const first = group[0];
    const evidenceRefs = [...bySource.values()].map((row) => ({
      sourceMappingId: Number(row.id),
      documentId: row.document_id != null ? Number(row.document_id) : null,
      sourceKind: row.source_kind,
      sourceFilename: row.source_filename,
      sourceLocation: row.source_location,
      value: row.committed_value,
    }));
    flagged.push(await upsertReconciliationTask(rod, {
      taskType: 'source_conflict',
      entryType: first.entry_type,
      atomKey: first.atom_key,
      targetTable: first.target_table,
      targetId: Number(first.target_id),
      evidenceRefs,
    }));
  }
  return flagged;
}

// Scans a bondProposedMappings()-shaped proposal (from an intake run or
// resume analysis, before commit) for entries with no confident atom match —
// unresolvedHeaders (no match at all) and low-affinity fieldBonds (a match,
// but weak) — and flags them for review with the source excerpt and the
// model's own reasoning attached. Unresolved (no-overlap) items are the
// higher-priority ambiguous case per Betsy's spec; both land as
// 'ambiguous_mapping' tasks, but unresolved ones lead the queue within that
// type since they're detected/inserted first below.
export async function detectAmbiguousMappings(userId, boundProposal) {
  const rod = await ensureCareerMasterRod(userId);
  const flagged = [];

  for (const [entryType, entries] of Object.entries(boundProposal || {})) {
    for (const entry of entries) {
      for (const unresolved of entry.unresolvedHeaders || []) {
        flagged.push(await upsertReconciliationTask(rod, {
          taskType: 'ambiguous_mapping',
          entryType,
          atomKey: null,
          evidenceRefs: [{ header: unresolved.header, value: unresolved.value, sourceFilename: entry.sourceFilename || null }],
          reasoning: { llmReasoning: unresolved.reasoning || entry.reasoning || null, sourceExcerpt: unresolved.sourceExcerpt || entry.sourceExcerpt || null, sourceLocation: unresolved.sourceLocation || null, reasoningPatternKey: unresolved.reasoningPatternKey || entry.reasoningPatternKey || null, overlap: 'none' },
        }));
      }
      for (const [atomKey, bond] of Object.entries(entry.fieldBonds || {})) {
        if (Number(bond.affinity) >= CONFIDENT_AFFINITY_FLOOR) continue;
        flagged.push(await upsertReconciliationTask(rod, {
          taskType: 'ambiguous_mapping',
          entryType,
          atomKey,
          evidenceRefs: [{ header: bond.header, value: bond.value, sourceFilename: bond.sourceFilename || entry.sourceFilename || null, affinity: bond.affinity }],
          reasoning: { llmReasoning: bond.reasoning || entry.reasoning || null, sourceExcerpt: bond.sourceExcerpt || entry.sourceExcerpt || null, sourceLocation: bond.sourceLocation || null, reasoningPatternKey: bond.reasoningPatternKey || entry.reasoningPatternKey || null, overlap: 'weak' },
        }));
      }
    }
  }
  return flagged;
}

// The one shared write path for "apply this value to this Career Master
// field" — used both by a reconciliation task's UI resolve button and (Phase
// 3) BestyStaff's resolve_career_conflict tool, so a chat-dictated correction
// and a UI-driven one always produce the identical DB result. Scoped to a
// single existing row + atom (a conflict always has one, since it only forms
// once a source has already been committed) — inserting a brand-new
// multi-field entry stays the job of the normal CareerMappingPreview commit
// flow, not this narrower resolution path.
export async function applyCareerFieldUpdate({ userId, targetTable, targetId, atomKey, value }) {
  const atomDef = atomDefinitionByKey(atomKey);
  if (!atomDef) throw new Error(`Unknown atom: ${atomKey}`);
  const column = atomDef.sourceColumn;
  const now = Date.now();
  if (isJsonbSourceColumn(column)) {
    const jsonValue = Array.isArray(value) ? value : [value];
    await db.prepare(`UPDATE ${targetTable} SET ${column}=$1::jsonb, updated_at=$2 WHERE id=$3 AND user_id=$4`).run(jsonValue, now, targetId, userId);
  } else {
    await db.prepare(`UPDATE ${targetTable} SET ${column}=$1, updated_at=$2 WHERE id=$3 AND user_id=$4`).run(value, now, targetId, userId);
  }
  await syncSingleEntry(userId, targetTable, targetId);
}

// Resolves an open task: applies the chosen/dictated value (when the task
// has a concrete target row — always true for source_conflict; only
// sometimes true for ambiguous_mapping) and closes it. Never auto-picks a
// value itself — the caller (the UI resolve button or BestyStaff's tool,
// per resolution.method) always supplies the decision.
export async function resolveReconciliationTask(userId, taskId, resolution) {
  const task = await db.prepare(`
    SELECT t.*, r.user_id AS rod_user_id FROM career_reconciliation_tasks t
    JOIN journey_data_rods r ON r.id = t.rod_id
    WHERE t.id = $1
  `).get(taskId);
  if (!task || Number(task.rod_user_id) !== Number(userId)) throw new Error('Task not found');
  if (task.status !== 'open') throw new Error('Task is already resolved');

  const { method } = resolution;
  let appliedValue = null;
  if (method === 'chose_source') {
    const refs = typeof task.evidence_refs === 'string' ? JSON.parse(task.evidence_refs) : task.evidence_refs;
    const chosen = (refs || []).find((ref) => String(ref.sourceMappingId) === String(resolution.chosenSourceReference));
    if (!chosen) throw new Error('chosenSourceReference does not match any evidence on this task');
    appliedValue = chosen.value;
  } else if (method === 'user_dictated') {
    appliedValue = resolution.appliedValue;
  } else if (method !== 'acknowledge') {
    throw new Error(`Unknown resolution method: ${method}`);
  }

  if (appliedValue !== null && task.target_table && task.target_id) {
    await applyCareerFieldUpdate({ userId, targetTable: task.target_table, targetId: Number(task.target_id), atomKey: task.atom_key, value: appliedValue });
  }

  const now = Date.now();
  if (resolution.reasoningApproved === true) {
    const reasoning = typeof task.reasoning === 'string' ? JSON.parse(task.reasoning) : (task.reasoning || {});
    const patternKey = reasoning.reasoningPatternKey || `unclassified_${task.entry_type}_${task.atom_key || 'unmapped'}`;
    await db.prepare(`
      INSERT INTO career_reasoning_approvals
        (rod_id, task_id, entry_type, atom_key, reasoning_pattern, raw_reasoning, source_excerpt, approved_by, approved_at, created_at)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$9)
      ON CONFLICT (task_id, approved_by) DO NOTHING
    `).run(task.rod_id, taskId, task.entry_type, task.atom_key, {
      patternKey,
      situationShape: { taskType: task.task_type, overlap: reasoning.overlap || null },
    }, reasoning.llmReasoning || null, reasoning.sourceExcerpt || null, userId, now);
  }
  await db.prepare(`
    UPDATE career_reconciliation_tasks SET status='resolved', resolution=$1::jsonb, resolved_by=$2, resolved_at=$3, updated_at=$3 WHERE id=$4
  `).run({ ...resolution, appliedValue }, userId, now, taskId);
  await recordRodEvent(task.rod_id, {
    eventType: task.task_type === 'source_conflict' ? 'career_conflict_resolved' : 'career_ambiguous_mapping_resolved',
    metadata: { taskId: Number(taskId), method },
  });
  return { taskId: Number(taskId), status: 'resolved' };
}
