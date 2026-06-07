// Build progress snapshot helpers.
//
// captureBaselineIfEmpty() runs once on server startup. If the
// build_progress_snapshots table is empty, it computes current totals from
// backlog_items + tier_workarounds and inserts a baseline row. Idempotent —
// re-runs after the baseline exists are no-ops.
//
// computeCurrentTotals() is the shared aggregation logic used by both the
// baseline writer here and the GET /api/backlog/summary handler. Keeping it
// in one place means daily auto-captures and the baseline use exactly the
// same numbers.

import { db } from '../db.js';
import { backlogSeed, PROJECT_STARTED_AT } from '../data/backlog/seed.js';

function safeJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function rowToItem(r) {
  return {
    id: Number(r.id),
    capabilityId: r.capability_id ? Number(r.capability_id) : null,
    parentId: r.parent_id ? Number(r.parent_id) : null,
    kind: r.kind,
    title: r.title,
    status: r.status,
    workSplitClaude: r.work_split_claude == null ? null : Number(r.work_split_claude),
    timeMinutes: r.time_minutes == null ? null : Number(r.time_minutes),
    costUsdClaude: r.cost_usd_claude == null ? null : Number(r.cost_usd_claude),
    hoursBetsy: r.hours_betsy == null ? null : Number(r.hours_betsy),
    hoursClaude: r.hours_claude == null ? null : Number(r.hours_claude),
    activitiesBetsy: r.activities_betsy == null ? null : Number(r.activities_betsy),
    activitiesClaude: r.activities_claude == null ? null : Number(r.activities_claude),
    traditionalCostUsd: r.traditional_cost_usd == null ? null : Number(r.traditional_cost_usd),
  };
}

function rowToWorkaround(r) {
  return {
    monthlySavings: r.monthly_savings == null ? null : Number(r.monthly_savings),
  };
}

function itemHoursClaude(it) {
  if (it.hoursClaude != null) return it.hoursClaude;
  return ((it.timeMinutes || 0) / 60) * (it.workSplitClaude ?? 0) / 100;
}
function itemHoursBetsy(it) {
  if (it.hoursBetsy != null) return it.hoursBetsy;
  return ((it.timeMinutes || 0) / 60) * (100 - (it.workSplitClaude ?? 0)) / 100;
}

/**
 * Compute current build-summary totals from live DB state. Mirrors the math
 * in routes/backlog.js's /summary handler. Kept in sync by sharing this lib.
 */
export async function computeCurrentTotals() {
  const items = (await db.prepare(`SELECT * FROM backlog_items WHERE status != 'archived'`).all()).map(rowToItem);
  const workarounds = (await db.prepare(`SELECT * FROM tier_workarounds`).all()).map(rowToWorkaround);
  const delivered = items.filter((it) => it.status === 'deployed' || it.status === 'completed');

  const totals = {
    requirementsTotal:     items.length,
    requirementsDelivered: delivered.length,
    hoursClaude:           delivered.reduce((s, it) => s + itemHoursClaude(it), 0),
    hoursBetsy:            delivered.reduce((s, it) => s + itemHoursBetsy(it), 0),
    activitiesClaude:      delivered.reduce((s, it) => s + (it.activitiesClaude || 0), 0),
    activitiesBetsy:       delivered.reduce((s, it) => s + (it.activitiesBetsy || 0), 0),
    costUsdClaude:         delivered.reduce((s, it) => s + (it.costUsdClaude || 0), 0),
    traditionalCostUsd:    delivered.reduce((s, it) => s + (it.traditionalCostUsd || 0), 0),
    monthlyTierSavings:    workarounds.reduce((s, w) => s + (w.monthlySavings || 0), 0),
  };
  totals.aiSavingsUsd = Math.round((totals.traditionalCostUsd - totals.costUsdClaude) * 100) / 100;
  return totals;
}

/**
 * If build_progress_snapshots is empty, capture a baseline row using current
 * totals. Returns { captured: true, id } on first run, { captured: false }
 * on subsequent runs. Safe to call repeatedly.
 */
export async function captureBaselineIfEmpty() {
  const existing = await db.prepare(`SELECT COUNT(*)::int AS n FROM build_progress_snapshots`).get();
  if (Number(existing?.n || 0) > 0) return { captured: false };

  const totals = await computeCurrentTotals();
  // We don't have the full payload pre-built here (it includes capabilities,
  // workarounds, items, groups) — that level of detail is only available from
  // the /summary handler. For the baseline we store the totals object as the
  // payload; subsequent /summary-triggered snapshots get the richer JSONB.
  const fullPayload = { totals, baselineNote: 'auto-captured on first deploy after snapshot infra landed' };

  const result = await db
    .prepare(
      `INSERT INTO build_progress_snapshots (
         requirements_total, requirements_delivered,
         hours_claude, hours_betsy, activities_claude, activities_betsy,
         cost_usd_claude, traditional_cost_usd, ai_savings_usd, monthly_tier_savings,
         full_payload, capture_source, note
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'baseline', $12)
       ON CONFLICT (captured_date, capture_source) DO NOTHING
       RETURNING id`
    )
    .run(
      totals.requirementsTotal,
      totals.requirementsDelivered,
      totals.hoursClaude,
      totals.hoursBetsy,
      totals.activitiesClaude,
      totals.activitiesBetsy,
      totals.costUsdClaude,
      totals.traditionalCostUsd,
      totals.aiSavingsUsd,
      totals.monthlyTierSavings,
      JSON.stringify(fullPayload),
      `Baseline captured ${new Date().toISOString().slice(0, 10)} — first day of snapshot tracking`
    );

  return { captured: true, id: result.lastInsertRowid ? Number(result.lastInsertRowid) : null };
}
