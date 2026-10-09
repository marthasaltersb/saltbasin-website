/**
 * GtmScenarioLibraryPanel — list/add/edit the institutional GTM scenario
 * library (gtm_scenario_library). Seeded with the real 8-Scenario Revenue
 * Leakage Library; extensible directly here or via annotation promotion
 * from a deliverable's review (see GtmDeliverableDetail.jsx).
 */
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const TIERS = ['critical', 'high', 'moderate'];

const S = {
  toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' },
  btn: (style) => ({
    padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em',
    background: style === 'gold' ? 'var(--sb-gold, #c4843a)' : style === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.07)',
    color: style === 'gold' || style === 'navy' ? 'white' : '#333',
  }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', background: 'white', borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.1)' },
  th: { textAlign: 'left', padding: '0.55rem 0.75rem', background: 'rgba(0,0,0,0.04)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777', fontWeight: 700 },
  td: { padding: '0.55rem 0.75rem', borderTop: '0.5px solid rgba(0,0,0,0.06)', color: '#333', verticalAlign: 'top' },
  tierPill: (tier) => ({
    display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
    color: 'white', background: tier === 'critical' ? '#b5433a' : tier === 'high' ? '#c4843a' : '#4a7c8e',
  }),
  form: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' },
  input: { padding: '0.5rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' },
  textarea: { padding: '0.5rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%', minHeight: 70, boxSizing: 'border-box', outline: 'none' },
  label: { fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.25rem', display: 'block' },
  field: { marginBottom: '0.75rem' },
  empty: { padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' },
};

const BLANK = { title: '', root_cause: '', ebitda_impact_tier: 'high', topic_prompt: '' };

export default function GtmScenarioLibraryPanel() {
  const [scenarios, setScenarios] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { scenarios } = await api.listGtmScenarios();
      setScenarios(scenarios);
    } catch (e) {
      toast(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.title || !form.root_cause || !form.topic_prompt) {
      toast('Title, root cause, and topic prompt are required.');
      return;
    }
    setSaving(true);
    try {
      await api.createGtmScenario(form);
      toast('Scenario added.');
      setForm(BLANK);
      setShowForm(false);
      load();
    } catch (e) {
      toast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(scenario) {
    try {
      await api.updateGtmScenario(scenario.id, { is_active: !scenario.is_active });
      load();
    } catch (e) {
      toast(e.message);
    }
  }

  if (scenarios === null) return <div style={S.empty}>Loading scenario library…</div>;

  return (
    <div>
      <div style={S.toolbar}>
        <button style={S.btn('gold')} onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add Scenario'}
        </button>
      </div>

      {showForm && (
        <div style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Title</label>
            <input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Siloed Spreadsheet Pricing" />
          </div>
          <div style={S.field}>
            <label style={S.label}>Root Cause / Defect Pattern</label>
            <input style={S.input} value={form.root_cause} onChange={(e) => setForm({ ...form, root_cause: e.target.value })} />
          </div>
          <div style={S.field}>
            <label style={S.label}>EBITDA Impact Tier</label>
            <select style={S.input} value={form.ebitda_impact_tier} onChange={(e) => setForm({ ...form, ebitda_impact_tier: e.target.value })}>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Topic Prompt (what the research agent is told to study)</label>
            <textarea style={S.textarea} value={form.topic_prompt} onChange={(e) => setForm({ ...form, topic_prompt: e.target.value })} />
          </div>
          <button style={S.btn('navy')} onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Save Scenario'}</button>
        </div>
      )}

      {scenarios.length === 0 ? (
        <div style={S.empty}>No scenarios yet.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Title</th>
              <th style={S.th}>Root Cause</th>
              <th style={S.th}>Tier</th>
              <th style={S.th}>Source</th>
              <th style={S.th}>Active</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.id}>
                <td style={S.td}>{s.title}</td>
                <td style={S.td}>{s.root_cause}</td>
                <td style={S.td}><span style={S.tierPill(s.ebitda_impact_tier)}>{s.ebitda_impact_tier}</span></td>
                <td style={S.td}>{s.source}</td>
                <td style={S.td}>
                  <button style={S.btn(s.is_active ? undefined : 'gold')} onClick={() => toggleActive(s)}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
