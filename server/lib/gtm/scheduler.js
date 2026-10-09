// Recurring-schedule resolution and execution. Cadence/topic selection are
// DB-configured (edited via the admin UI) rather than a YAML cron string --
// see the plan's "Scheduling architecture decision" for why this is
// decoupled from server/index.js's in-process setInterval pattern.
import { db } from '../../db.js';
import { submitBenchmarkRefreshBatch } from './generate.js';

export function computeNextRunAt(cadence, cadenceDays, fromMs = Date.now()) {
  const d = new Date(fromMs);
  if (cadence === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (cadence === 'custom_days') {
    if (!cadenceDays || cadenceDays < 1) throw new Error('cadence_days is required for custom_days cadence');
    d.setDate(d.getDate() + cadenceDays);
  } else {
    // monthly (default)
    d.setMonth(d.getMonth() + 1);
  }
  return d.getTime();
}

function pickRandom(arr, n) {
  const pool = [...arr];
  const picked = [];
  while (pool.length && picked.length < n) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

async function resolveScheduleScenarios(schedule) {
  if (schedule.topic_selection_mode === 'specific_scenario_ids') {
    // JSONB columns come back from the postgres driver already parsed in
    // most contexts, but a raw string sometimes surfaces depending on the
    // query path -- defensive parse matches the rest of this codebase's
    // convention (see server/db.js's own `typeof row.metadata === 'string'`
    // guard).
    const raw = schedule.selected_scenario_ids;
    const ids = typeof raw === 'string' ? JSON.parse(raw) : raw || [];
    if (!ids.length) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    return db
      .prepare(`SELECT * FROM gtm_scenario_library WHERE id IN (${placeholders}) ORDER BY sort_order`)
      .all(...ids);
  }

  const active = await db
    .prepare(`SELECT * FROM gtm_scenario_library WHERE is_active = true ORDER BY sort_order`)
    .all();

  if (schedule.topic_selection_mode === 'random_n') {
    return pickRandom(active, schedule.random_n || 1);
  }
  // all_active_scenarios (default)
  return active;
}

async function executeSchedule(schedule) {
  const scenarios = await resolveScheduleScenarios(schedule);
  if (!scenarios.length) {
    throw new Error('No scenarios resolved for this schedule -- check topic_selection_mode and the scenario library.');
  }

  const topics = scenarios.map((s) => s.topic_prompt);
  const { batchId } = await submitBenchmarkRefreshBatch(topics, schedule.exec_style);

  const now = Date.now();
  for (let i = 0; i < scenarios.length; i++) {
    await db
      .prepare(
        `INSERT INTO gtm_deliverables
           (mode, schedule_id, topic, exec_style, status, batch_id, batch_custom_id, created_at, updated_at)
         VALUES ('benchmark_refresh', $1, $2, $3, 'generating', $4, $5, $6, $6)`
      )
      .run(schedule.id, topics[i], schedule.exec_style, batchId, `benchmark-${i}`, now);
  }

  return { batchId, deliverableCount: scenarios.length };
}

// Runs anything past-due, advancing next_run_at on success. On failure, does
// NOT advance next_run_at so it's retried the next time this is called
// (e.g. the next daily cron tick) rather than silently skipping a whole
// cadence period.
export async function runDueSchedules() {
  const now = Date.now();
  const due = await db
    .prepare(`SELECT * FROM gtm_schedules WHERE enabled = true AND next_run_at <= $1`)
    .all(now);

  const results = [];
  for (const schedule of due) {
    try {
      const { batchId, deliverableCount } = await executeSchedule(schedule);
      const nextRunAt = computeNextRunAt(schedule.cadence, schedule.cadence_days, now);
      await db
        .prepare(
          `UPDATE gtm_schedules SET next_run_at = $1, last_run_at = $2, last_run_status = 'ok', last_run_error = NULL, updated_at = $2 WHERE id = $3`
        )
        .run(nextRunAt, now, schedule.id);
      results.push({ scheduleId: schedule.id, ok: true, batchId, deliverableCount });
    } catch (e) {
      await db
        .prepare(
          `UPDATE gtm_schedules SET last_run_at = $1, last_run_status = 'error', last_run_error = $2, updated_at = $1 WHERE id = $3`
        )
        .run(now, e.message, schedule.id);
      results.push({ scheduleId: schedule.id, ok: false, error: e.message });
    }
  }
  return results;
}

// Admin "Run Now" -- ignores next_run_at, but still advances it on success
// so the natural cadence doesn't immediately re-fire right after a manual run.
export async function runScheduleNow(scheduleId) {
  const schedule = await db.prepare(`SELECT * FROM gtm_schedules WHERE id = $1`).get(scheduleId);
  if (!schedule) throw new Error(`Schedule ${scheduleId} not found`);

  const now = Date.now();
  const { batchId, deliverableCount } = await executeSchedule(schedule);
  const nextRunAt = computeNextRunAt(schedule.cadence, schedule.cadence_days, now);
  await db
    .prepare(
      `UPDATE gtm_schedules SET next_run_at = $1, last_run_at = $2, last_run_status = 'ok', last_run_error = NULL, updated_at = $2 WHERE id = $3`
    )
    .run(nextRunAt, now, scheduleId);
  return { batchId, deliverableCount };
}
