/**
 * GtmSchedulePanel — configure the recurring benchmark-refresh cadence.
 * Cadence/topic-selection/exec-style live in gtm_schedules (DB-configured,
 * not a GitHub Actions cron YAML) so this is editable from here. Actual
 * timing is driven by POST /api/gtm-deliverables/run-due, called daily by
 * .github/workflows/gtm-deliverables-cron.yml.
 */
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const EXEC_STYLES = ['financial_first', 'narrative_first', 'dashboard'];
const CADENCES = ['weekly', 'monthly', 'custom_days'];
const TOPIC_MODES = ['all_active_scenarios', 'specific_scenario_ids', 'random_n'];

const S = {
  toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' },
  btn: (style) => ({
    padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em',
    background: style === 'gold' ? 'var(--sb-gold, #c4843a)' : style === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.07)',
    color: style === 'gold' || style === 'navy' ? 'white' : '#333',
  }),
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' },
  input: { padding: '0.5rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' },
  label: { fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.25rem', display: 'block' },
  field: { marginBottom: '0.75rem' },
  row: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  col: { flex: '1 1 200px' },
  meta: { fontSize: '0.75rem', color: '#777', marginTop: '0.5rem' },
  statusPill: (status) => ({
    display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
    color: 'white', background: status === 'ok' ? '#6b8f71' : status === 'error' ? '#b5433a' : '#999',
  }),
  empty: { padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' },
};

const BLANK = {
  name: '',
  cadence: 'monthly',
  cadence_days: '',
  topic_selection_mode: 'all_active_scenarios',
  random_n: '',
  exec_style: 'financial_first',
  enabled: true,
};

export default function GtmSchedulePanel() {
  const [schedules, setSchedules] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState(null);

  async function load() {
    try {
      const { schedules } = await api.listGtmSchedules();
      setSchedules(schedules);
    } catch (e) {
      toast(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.name) {
      toast('Name is required.');
      return;
    }
    setSaving(true);
    try {
      await api.createGtmSchedule({
        ...form,
        cadence_days: form.cadence === 'custom_days' && form.cadence_days ? Number(form.cadence_days) : null,
        random_n: form.topic_selection_mode === 'random_n' && form.random_n ? Number(form.random_n) : null,
      });
      toast('Schedule created — due immediately, will pick up on the next daily check (or click Run Now).');
      setForm(BLANK);
      setShowForm(false);
      load();
    } catch (e) {
      toast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(schedule) {
    try {
      await api.updateGtmSchedule(schedule.id, { enabled: !schedule.enabled });
      load();
    } catch (e) {
      toast(e.message);
    }
  }

  async function runNow(schedule) {
    setRunningId(schedule.id);
    try {
      const result = await api.runGtmScheduleNow(schedule.id);
      toast(`Submitted — ${result.deliverableCount} deliverable(s) generating.`);
      load();
    } catch (e) {
      toast(e.message);
    } finally {
      setRunningId(null);
    }
  }

  if (schedules === null) return <div style={S.empty}>Loading schedules…</div>;

  return (
    <div>
      <div style={S.toolbar}>
        <button style={S.btn('gold')} onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New Schedule'}
        </button>
      </div>

      {showForm && (
        <div style={S.card}>
          <div style={S.field}>
            <label style={S.label}>Name</label>
            <input style={S.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Revenue Leakage Refresh" />
          </div>
          <div style={S.row}>
            <div style={{ ...S.col, ...S.field }}>
              <label style={S.label}>Cadence</label>
              <select style={S.input} value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value })}>
                {CADENCES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {form.cadence === 'custom_days' && (
              <div style={{ ...S.col, ...S.field }}>
                <label style={S.label}>Days between runs</label>
                <input style={S.input} type="number" min="1" value={form.cadence_days} onChange={(e) => setForm({ ...form, cadence_days: e.target.value })} />
              </div>
            )}
            <div style={{ ...S.col, ...S.field }}>
              <label style={S.label}>Executive Summary Style</label>
              <select style={S.input} value={form.exec_style} onChange={(e) => setForm({ ...form, exec_style: e.target.value })}>
                {EXEC_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={S.row}>
            <div style={{ ...S.col, ...S.field }}>
              <label style={S.label}>Topic Selection</label>
              <select style={S.input} value={form.topic_selection_mode} onChange={(e) => setForm({ ...form, topic_selection_mode: e.target.value })}>
                {TOPIC_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {form.topic_selection_mode === 'random_n' && (
              <div style={{ ...S.col, ...S.field }}>
                <label style={S.label}>How many scenarios per run</label>
                <input style={S.input} type="number" min="1" value={form.random_n} onChange={(e) => setForm({ ...form, random_n: e.target.value })} />
              </div>
            )}
          </div>
          {form.topic_selection_mode === 'specific_scenario_ids' && (
            <p style={S.meta}>Specific-scenario selection is editable after creation — save this schedule, then use the scenario library to curate which ones it targets (coming via PATCH; not yet wired in this form).</p>
          )}
          <button style={S.btn('navy')} onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Save Schedule'}</button>
        </div>
      )}

      {schedules.length === 0 ? (
        <div style={S.empty}>No schedules yet.</div>
      ) : (
        schedules.map((s) => (
          <div key={s.id} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{s.name}</strong>{' '}
                <span style={S.statusPill(s.enabled ? 'ok' : 'off')}>{s.enabled ? 'enabled' : 'disabled'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={S.btn()} onClick={() => toggleEnabled(s)}>{s.enabled ? 'Disable' : 'Enable'}</button>
                <button style={S.btn('gold')} onClick={() => runNow(s)} disabled={runningId === s.id}>
                  {runningId === s.id ? 'Running…' : 'Run Now'}
                </button>
              </div>
            </div>
            <p style={S.meta}>
              {s.cadence}{s.cadence === 'custom_days' ? ` (every ${s.cadence_days}d)` : ''} · {s.topic_selection_mode}
              {s.topic_selection_mode === 'random_n' ? ` (${s.random_n})` : ''} · style: {s.exec_style}
            </p>
            <p style={S.meta}>
              Next run: {s.next_run_at ? new Date(s.next_run_at).toLocaleString() : '—'} · Last run:{' '}
              {s.last_run_at ? new Date(s.last_run_at).toLocaleString() : 'never'}
              {s.last_run_status && <span style={S.statusPill(s.last_run_status)}> {s.last_run_status}</span>}
            </p>
            {s.last_run_error && <p style={{ ...S.meta, color: '#b5433a' }}>Last error: {s.last_run_error}</p>}
          </div>
        ))
      )}
    </div>
  );
}
