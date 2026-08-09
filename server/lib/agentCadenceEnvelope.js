// Agent cadence presets (2026-08-09) — the platform-wide, admin-editable
// list of cadence options a member can pick for a given agent+action
// schedule (Career Placement Agents' "Automation" section, and any future
// pipeline's schedule UI). Same Config Envelope pattern as
// agent_run_daily_cap/herq_publication_flow: admin-editable without a
// deploy, never breaks reads if no override has been saved.
//
// intervalMs === null means "on demand only" — the dispatcher (agentDispatcher.js)
// never auto-runs a schedule on this preset; the member has to click the
// button. A non-null intervalMs is how the dispatcher computes next_run_at
// after each run.
import { defineConfigEnvelope } from './configEnvelope.js';

const DEFAULT_PRESETS = [
  { key: 'on_demand', label: 'On demand only', intervalMs: null },
  { key: 'hourly', label: 'Hourly', intervalMs: 60 * 60 * 1000 },
  { key: 'every_6_hours', label: 'Every 6 hours', intervalMs: 6 * 60 * 60 * 1000 },
  { key: 'daily', label: 'Daily', intervalMs: 24 * 60 * 60 * 1000 },
  { key: 'every_3_days', label: 'Every 3 days', intervalMs: 3 * 24 * 60 * 60 * 1000 },
  { key: 'weekly', label: 'Weekly', intervalMs: 7 * 24 * 60 * 60 * 1000 },
];

defineConfigEnvelope({
  id: 'agent_cadence_presets',
  label: 'Agent Cadence Presets',
  description: 'The set of cadence options selectable per agent or per agent action in automation schedules. intervalMs of null means on-demand only (never auto-runs).',
  defaultValue: { presets: DEFAULT_PRESETS },
  validate: (value) => {
    if (!value || typeof value !== 'object' || !Array.isArray(value.presets)) return ['must be an object with a presets array'];
    const keys = new Set();
    for (const p of value.presets) {
      if (!p || typeof p !== 'object' || !p.key || !p.label) return ['each preset needs a key and a label'];
      if (p.intervalMs !== null && (typeof p.intervalMs !== 'number' || p.intervalMs <= 0)) {
        return [`preset "${p.key}": intervalMs must be null (on-demand) or a positive number of milliseconds`];
      }
      if (keys.has(p.key)) return [`duplicate preset key "${p.key}"`];
      keys.add(p.key);
    }
    if (!keys.has('on_demand')) return ['presets must include an "on_demand" (intervalMs: null) option'];
    return [];
  },
});

export function findCadencePreset(presets, key) {
  return (presets || []).find((p) => p.key === key) || null;
}
