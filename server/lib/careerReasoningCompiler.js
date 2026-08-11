// Career Foundation Sourcing & Reconciliation, Phase 4 (2026-08-10) — the
// cross-user compiler. Groups every member-approved reasoning
// (career_reasoning_approvals, written by resolveReconciliationTask() in
// careerReconciliation.js whenever a member checks "this reasoning was
// right") by its LLM-proposed patternKey — never by raw reasoning text,
// which references each member's own facts and will never match verbatim
// across users. Surfaces candidates to the admin with the actual population
// denominator Betsy asked for: how many members who ever HAD a task of that
// shape approved this reasoning, not just how many approved it.
//
// Follows the existing rollup-builder convention (careerOpportunityRollups.js-
// style): compute, then upsert a materialized row per pattern for fast admin
// reads — the same justification journey_rod_settlement_states established
// for a queryable snapshot alongside raw evidence.
import { db } from '../db.js';

export async function computeReasoningPatternCandidates() {
  const approvals = await db.prepare(`
    SELECT reasoning_pattern->>'patternKey' AS pattern_key, entry_type, atom_key, raw_reasoning, approved_by
    FROM career_reasoning_approvals
  `).all();

  const byPattern = new Map();
  for (const row of approvals) {
    if (!row.pattern_key) continue;
    if (!byPattern.has(row.pattern_key)) byPattern.set(row.pattern_key, []);
    byPattern.get(row.pattern_key).push(row);
  }

  const results = [];
  const now = Date.now();
  for (const [patternKey, rows] of byPattern) {
    // Most-common (entry_type, atom_key) pair for this pattern — a pattern
    // key is meant to be a reusable rule, but display needs one
    // representative shape.
    const shapeCounts = new Map();
    for (const row of rows) {
      const shapeKey = `${row.entry_type}::${row.atom_key || ''}`;
      shapeCounts.set(shapeKey, (shapeCounts.get(shapeKey) || 0) + 1);
    }
    const [topShape] = [...shapeCounts.entries()].sort((a, b) => b[1] - a[1]);
    const [entryType, atomKey] = topShape[0].split('::');

    const approvedUserCount = new Set(rows.map((r) => Number(r.approved_by))).size;

    // The real population: every distinct user who ever had ANY
    // reconciliation task (open or resolved) of this exact entry_type/
    // atom_key shape, whether or not they approved this reasoning.
    const eligible = await db.prepare(`
      SELECT COUNT(DISTINCT r.user_id)::int AS n
      FROM career_reconciliation_tasks t
      JOIN journey_data_rods r ON r.id = t.rod_id
      WHERE t.entry_type = $1 AND (t.atom_key = $2 OR ($2 = '' AND t.atom_key IS NULL))
    `).get(entryType, atomKey || '');
    const totalEligibleUserCount = Math.max(Number(eligible?.n || 0), approvedUserCount);
    const approvalRatio = totalEligibleUserCount > 0 ? approvedUserCount / totalEligibleUserCount : 0;

    const sampleReasonings = [...new Set(rows.map((r) => r.raw_reasoning).filter(Boolean))].slice(0, 3);

    const row = await db.prepare(`
      INSERT INTO career_reasoning_cache_candidates
        (pattern_key, entry_type, atom_key, approved_user_count, total_eligible_user_count, approval_ratio, sample_reasonings, computed_at, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$8,$8)
      ON CONFLICT (pattern_key) DO UPDATE SET
        entry_type = EXCLUDED.entry_type, atom_key = EXCLUDED.atom_key,
        approved_user_count = EXCLUDED.approved_user_count,
        total_eligible_user_count = EXCLUDED.total_eligible_user_count,
        approval_ratio = EXCLUDED.approval_ratio,
        sample_reasonings = EXCLUDED.sample_reasonings,
        computed_at = EXCLUDED.computed_at, updated_at = EXCLUDED.updated_at
      RETURNING *
    `).get(patternKey, entryType, atomKey || null, approvedUserCount, totalEligibleUserCount, approvalRatio, sampleReasonings, now);
    results.push(row);
  }
  return results;
}
