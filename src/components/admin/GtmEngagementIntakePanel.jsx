/**
 * GtmEngagementIntakePanel — on-demand engagement deliverable: a topic, an
 * optional client CSV/XLSX export, and an exec-style choice. Runs
 * synchronously (not batched) since this is a user-initiated admin action
 * expecting a prompt result — see server/lib/gtm/generate.js's
 * generateEngagementSync. Client financial data never leaves the request;
 * only the normalized summary (matched fields, aggregates, small samples of
 * unmatched columns) is persisted or sent to Anthropic.
 */
import React, { useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const EXEC_STYLES = ['financial_first', 'narrative_first', 'dashboard'];

const S = {
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1.25rem', maxWidth: 600 },
  input: { padding: '0.5rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' },
  label: { fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.25rem', display: 'block' },
  field: { marginBottom: '0.85rem' },
  btn: { padding: '0.6rem 1.3rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em', background: 'var(--sb-navy, #1b2a3b)', color: 'white' },
  note: { fontSize: '0.75rem', color: '#777', marginTop: '0.75rem' },
  result: { marginTop: '1.25rem', padding: '1rem', borderRadius: 10, background: 'rgba(107,143,113,0.1)', border: '0.5px solid rgba(107,143,113,0.4)' },
};

export default function GtmEngagementIntakePanel() {
  const [topic, setTopic] = useState('');
  const [clientName, setClientName] = useState('');
  const [execStyle, setExecStyle] = useState('financial_first');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit() {
    if (!topic) {
      toast('Topic is required.');
      return;
    }
    if (file && !clientName) {
      toast('Client name is required when a file is attached.');
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('topic', topic);
      formData.append('execStyle', execStyle);
      if (clientName) formData.append('clientName', clientName);
      if (file) formData.append('clientFile', file);
      const { deliverable } = await api.submitGtmEngagement(formData);
      toast('Deliverable generated — landed in the Deliverables Queue as Draft.');
      setResult(deliverable);
      setTopic('');
      setClientName('');
      setFile(null);
    } catch (e) {
      toast(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={S.card}>
        <div style={S.field}>
          <label style={S.label}>Topic</label>
          <input style={S.input} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Revenue leakage in usage-based billing" />
        </div>
        <div style={S.field}>
          <label style={S.label}>Client Name (optional — required if attaching a file)</label>
          <input style={S.input} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Acme Inc" />
        </div>
        <div style={S.field}>
          <label style={S.label}>Client Export (CSV or XLSX, optional)</label>
          <input style={S.input} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div style={S.field}>
          <label style={S.label}>Executive Summary Style</label>
          <select style={S.input} value={execStyle} onChange={(e) => setExecStyle(e.target.value)}>
            {EXEC_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button style={S.btn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Generating…' : 'Generate Deliverable'}
        </button>
        <p style={S.note}>
          Row-level client data is never sent to the API or stored — only matched column names, numeric aggregates,
          and small samples of unmatched columns. This runs live (not batched), so expect a short wait, not an
          instant response.
        </p>
      </div>

      {result && (
        <div style={S.result}>
          <strong>Deliverable #{result.id} generated.</strong>
          <p style={S.note}>Status: {result.status} — open it from the Deliverables Queue tab to review, annotate, and download the xlsx.</p>
        </div>
      )}
    </div>
  );
}
