// Real background agent dispatcher (2026-08-09) — the first one anywhere in
// this codebase. Everything built before this (job research, resume
// generation, qualification gates, auto-queue) was on-demand only: a human
// had to click a button. agent_schedules.next_run_at existed since Phase 1
// but nothing ever read it. This does.
//
// Mirrors server/index.js's scheduleDailyDigest() conventions exactly — the
// only other recurring job in the codebase: setInterval tick, dynamic
// imports inside the job (avoids load-order issues at module init), try/catch
// per unit of work so one failure never stops the others, console.warn on
// failure rather than crashing the process. No persistence/locking beyond
// agent_schedules.next_run_at itself — a schedule due during downtime just
// runs on the next tick after boot, same as the daily digest already accepts.
import { db } from '../db.js';

const TICK_MS = 10 * 60 * 1000; // check every 10 minutes — fine granularity for daily/weekly cadences

// agentKey:actionKey -> async (ownerUserId) => result. Every scheduled
// action needs an explicit action_key on its agent_schedules row (no
// implicit "default action" — with career_researcher already having two
// independently-schedulable actions, an unnamed default would be ambiguous).
// Add a new automated action here, never fork the tick loop itself.
const ACTION_EXECUTORS = {
  'career_researcher:research': async (userId) => {
    const { researchCareerOpportunities } = await import('./careerResearchAgent.js');
    return researchCareerOpportunities(userId);
  },
  'career_researcher:posting_verification': async (userId) => {
    const { runQualificationGatesForUser } = await import('./careerVerificationAgent.js');
    return runQualificationGatesForUser(userId);
  },
  'resume_generator:auto_queue_on_approval': async (userId) => {
    const { autoQueueOutputsForNewlyApproved } = await import('./autoQueueAgent.js');
    return autoQueueOutputsForNewlyApproved(userId);
  },
};

async function resolveCadencePresets() {
  const { resolveConfigEnvelope } = await import('./configEnvelope.js');
  await import('./agentCadenceEnvelope.js'); // ensure registered
  const { value } = await resolveConfigEnvelope('agent_cadence_presets');
  return value.presets || [];
}

// Exported for direct testing (call one tick's worth of work without
// waiting for setInterval) — startAgentDispatcher() below is what production
// actually calls at boot.
export async function runDueSchedules() {
  const presets = await resolveCadencePresets();
  const now = Date.now();

  const due = await db.prepare(`
    SELECT s.*, d.key AS agent_key
    FROM agent_schedules s
    JOIN agent_definitions d ON d.id = s.agent_definition_id
    WHERE s.is_active = true AND s.cadence != 'on_demand' AND s.owner_user_id IS NOT NULL
      AND (s.next_run_at IS NULL OR s.next_run_at <= $1)
  `).all(now);

  for (const schedule of due) {
    const executorKey = `${schedule.agent_key}:${schedule.action_key || ''}`;
    const executor = ACTION_EXECUTORS[executorKey];
    const preset = presets.find((p) => p.key === schedule.cadence);
    const nextRunAt = preset?.intervalMs ? now + preset.intervalMs : null;

    if (!executor) {
      console.warn(`[agent-dispatcher] no executor registered for "${executorKey}" — skipping, not disabling (config may be ahead of code).`);
      await db.prepare(`UPDATE agent_schedules SET last_run_at=$1, next_run_at=$2, updated_at=$1 WHERE id=$3`).run(now, nextRunAt, schedule.id);
      continue;
    }

    try {
      const result = await executor(Number(schedule.owner_user_id));
      console.log(`[agent-dispatcher] ran ${executorKey} for user ${schedule.owner_user_id}:`, JSON.stringify(result)?.slice(0, 200));
    } catch (e) {
      // A failed run still advances next_run_at — a persistently-failing
      // schedule (no key configured, no Career Master data) retries next
      // cadence, not next tick, so it can't storm the run-cap or the logs.
      console.warn(`[agent-dispatcher] ${executorKey} failed for user ${schedule.owner_user_id}:`, e.message);
    }
    await db.prepare(`UPDATE agent_schedules SET last_run_at=$1, next_run_at=$2, updated_at=$1 WHERE id=$3`).run(now, nextRunAt, schedule.id);
  }

  return due.length;
}

export function startAgentDispatcher() {
  async function tick() {
    try {
      const count = await runDueSchedules();
      if (count) console.log(`[agent-dispatcher] tick processed ${count} due schedule(s)`);
    } catch (e) {
      console.warn('[agent-dispatcher] tick failed:', e.message);
    }
  }
  setInterval(tick, TICK_MS);
  tick(); // also run once immediately at boot, don't wait a full tick interval
  console.log(`[server] agent dispatcher started — checking every ${TICK_MS / 60000}min`);
}
