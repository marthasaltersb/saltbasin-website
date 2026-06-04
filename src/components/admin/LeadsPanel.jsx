import React, { useEffect, useState } from 'react';
import { styles } from './adminStyles.js';
import { toast } from '../../lib/toast.js';

const SOURCE_LABELS = {
  joinNetwork: 'Join the Network',
  forCompanies: 'For Companies',
  assessments: 'Assessments',
  contact: 'Contact',
};

export default function LeadsPanel() {
  const [leads, setLeads] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  async function load() {
    try {
      const res = await fetch('/api/leads', { credentials: 'include' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Load failed');
      setLeads(body.leads);
    } catch (e) {
      toast('Load failed: ' + e.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete this lead permanently?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
    setSelectedId(null);
  }

  function exportCsv() {
    if (!leads?.length) return toast('No leads to export');
    const headers = ['id', 'public_id', 'source', 'email', 'name', 'message', 'created_at', 'answers'];
    const rows = leads.map((l) => [
      l.id,
      l.public_id || '',
      l.source,
      l.email,
      l.name || '',
      l.message || '',
      new Date(l.created_at).toISOString(),
      l.answers ? JSON.stringify(l.answers) : '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!leads) return null;
  const selected = leads.find((l) => l.id === selectedId);

  return (
    <div style={{ ...styles.editorPane, flex: 1 }}>
      <div style={styles.editorHeader}>
        <div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
            Leads · {leads.length}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)', marginTop: 2 }}>
            Captured from public forms. Source identifies which CTA fired.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={load}>
            Refresh
          </button>
          <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Lead list */}
        <div style={{ width: 380, borderRight: '0.5px solid rgba(196,132,58,0.15)', overflowY: 'auto' }}>
          {leads.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
              No leads yet — they'll appear here as people fill in the public forms.
            </div>
          )}
          {leads.map((l) => {
            const active = l.id === selectedId;
            return (
              <div
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '0.5px solid rgba(196,132,58,0.1)',
                  cursor: 'pointer',
                  background: active ? 'rgba(196,132,58,0.1)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
                    {SOURCE_LABELS[l.source] || l.source}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--sb-teal-deep)' }}>
                    #{l.public_id || l.id}
                  </div>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--sb-cream)', wordBreak: 'break-all' }}>
                  {l.email}
                </div>
                {l.name && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginTop: 2 }}>
                    {l.name}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)', marginTop: 4 }}>
                  {new Date(l.created_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {selected ? (
            <LeadDetail lead={selected} onDelete={() => remove(selected.id)} />
          ) : (
            <div style={{ color: 'var(--sb-dusty)', textAlign: 'center', padding: '3rem' }}>
              ← Pick a lead to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadDetail({ lead, onDelete }) {
  const leadUrl = lead.public_id ? `/lead/${lead.public_id}` : null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div className="sb-eyebrow" style={{ marginBottom: '0.25rem' }}>
            {SOURCE_LABELS[lead.source] || lead.source}
          </div>
          <h2 className="sb-display" style={{ fontSize: '1.6rem', color: 'var(--sb-cream)', letterSpacing: '0.04em' }}>
            Lead #{lead.public_id || lead.id}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {leadUrl && (
            <a href={leadUrl} target="_blank" rel="noreferrer" className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}>
              View as lead ↗
            </a>
          )}
          <button onClick={onDelete} className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem', borderColor: 'var(--sb-risk-critical)', color: 'var(--sb-risk-critical)' }}>
            Delete
          </button>
        </div>
      </div>

      <Section label="Email" value={lead.email} />
      <Section label="Name" value={lead.name || '—'} />
      <Section label="Original message" value={lead.message || '—'} />
      <Section label="Submitted" value={new Date(lead.created_at).toLocaleString()} />
      <Section label="Last updated" value={new Date(lead.updated_at || lead.created_at).toLocaleString()} />

      <div style={{ marginTop: '1.5rem' }}>
        <div className="sb-label" style={{ color: 'var(--sb-gold)', fontSize: '0.62rem', letterSpacing: '0.16em', marginBottom: '0.6rem' }}>
          Captured Answers
        </div>
        {lead.answers && Object.keys(lead.answers).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {Object.entries(lead.answers).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 'var(--sb-radius)', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>
                  {k}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--sb-cream)', whiteSpace: 'pre-wrap' }}>
                  {String(v) || '—'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
            Lead hasn't filled in any additional info yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, value }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div className="sb-label" style={{ color: 'var(--sb-gold)', fontSize: '0.6rem', letterSpacing: '0.16em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.92rem', color: 'var(--sb-cream)', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}
