import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';

const s = {
  page: { padding: '1.5rem', overflowY: 'auto', height: '100%' },
  eyebrow: { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' },
  title: { fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginBottom: '1.25rem' },
  card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '1rem 1.25rem', marginBottom: '0.75rem' },
  tab: (active) => ({ padding: '0.4rem 1rem', fontSize: '0.75rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', color: active ? 'var(--sb-gold)' : 'var(--sb-dusty)', border: 'none', borderBottom: active ? '2px solid var(--sb-gold)' : '2px solid transparent', cursor: 'pointer' }),
  btn: (primary) => ({ padding: '0.35rem 0.85rem', background: primary ? 'var(--sb-gold)' : 'transparent', color: primary ? 'var(--sb-ivory)' : 'var(--sb-dusty)', border: `0.5px solid ${primary ? 'var(--sb-gold)' : 'rgba(139,155,174,0.35)'}`, borderRadius: 2, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)' }),
};

export default function GovernancePanel() {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [pR, oR] = await Promise.all([
        fetch('/api/governance/pending', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/governance/overrides', { credentials: 'include' }).then(r => r.json()),
      ]);
      setPending(pR.pending || []);
      setOverrides(oR.overrides || []);
    } catch { toast.error('Failed to load governance data'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    const res = await fetch(`/api/governance/pending/${id}/approve`, { method: 'POST', credentials: 'include' });
    if (!res.ok) { toast.error('Failed to approve'); return; }
    toast.success('Standard approved and merged');
    load();
  }

  async function reject(id) {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    const res = await fetch(`/api/governance/pending/${id}/reject`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (!res.ok) { toast.error('Failed to reject'); return; }
    toast.success('Proposal rejected');
    setRejectId(null);
    setRejectReason('');
    load();
  }

  return (
    <div style={s.page}>
      <div style={s.eyebrow}>Platform Governance</div>
      <div style={s.title}>Standards Governance Review</div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '0.85rem 1.1rem', minWidth: 130 }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' }}>Pending Review</div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--sb-font-display)', color: pending.length > 0 ? '#FFD6A5' : 'var(--sb-cream)', fontWeight: 300 }}>{loading ? '—' : pending.length}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '0.85rem 1.1rem', minWidth: 130 }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' }}>Escalated Overrides</div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--sb-font-display)', color: overrides.length > 0 ? '#BDE4FF' : 'var(--sb-cream)', fontWeight: 300 }}>{loading ? '—' : overrides.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(196,132,58,0.15)', marginBottom: '1.25rem' }}>
        <button style={s.tab(tab === 'pending')} onClick={() => setTab('pending')}>Pending Proposals ({pending.length})</button>
        <button style={s.tab(tab === 'overrides')} onClick={() => setTab('overrides')}>Escalated Overrides ({overrides.length})</button>
      </div>

      {loading && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading governance queue…</div>}

      {/* GOV-006/007: Published outputs trigger review; preview exports do NOT */}
      <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(196,132,58,0.06)', border: '0.5px dashed rgba(196,132,58,0.25)', borderRadius: 2, marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--sb-dusty)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--sb-cream)' }}>GOV-006/007:</strong> Preview exports do not trigger governance review. Only <em>published</em> outputs create pending standard proposals. Approve to merge into the Global Standards Repository, or reject with a reason.
      </div>

      {!loading && tab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '1rem 0' }}>No pending proposals. When a published HERQ output or user override is escalated, it appears here for review.</div>
          ) : pending.map(p => (
            <div key={p.id} style={s.card}>
              {rejectId === p.id ? (
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--sb-cream)', marginBottom: '0.75rem' }}>Rejecting: <strong>{p.proposed_name || p.proposed_value}</strong></div>
                  <textarea
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection…"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--sb-cream)', fontSize: '0.82rem', minHeight: 70, resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.75rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ ...s.btn(false), borderColor: 'rgba(200,60,60,0.4)', color: '#C44A4A' }} onClick={() => reject(p.id)}>Confirm Reject</button>
                    <button style={s.btn(false)} onClick={() => { setRejectId(null); setRejectReason(''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '1px 8px', borderRadius: 10, background: '#FFE08A', fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)', fontWeight: 600 }}>pending</span>
                      {(p.proposed_domain || p.base_standard_domain) && (
                        <span style={{ fontSize: '0.62rem', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' }}>{p.proposed_domain || p.base_standard_domain}</span>
                      )}
                      {p.base_standard_name && (
                        <span style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)' }}>extends: {p.base_standard_name}</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--sb-cream)', fontSize: '0.92rem', marginBottom: '0.25rem' }}>{p.proposed_name || p.proposed_value}</div>
                    {p.proposed_definition && <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)', lineHeight: 1.5, marginBottom: '0.35rem' }}>{p.proposed_definition}</div>}
                    {p.rationale && <div style={{ fontSize: '0.75rem', color: 'rgba(196,132,58,0.8)', fontStyle: 'italic' }}>Rationale: "{p.rationale}"</div>}
                    <div style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)', marginTop: '0.35rem' }}>
                      Proposed by {p.proposed_by_name || p.proposed_by_email || 'system'} · {new Date(Number(p.created_at)).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
                    <button style={{ ...s.btn(true), background: '#CDEEDC', color: '#1A1A1A', borderColor: '#CDEEDC' }} onClick={() => approve(p.id)}>✓ Approve</button>
                    <button style={{ ...s.btn(false), borderColor: 'rgba(200,60,60,0.3)', color: '#C44A4A' }} onClick={() => setRejectId(p.id)}>✕ Reject</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'overrides' && (
        <div>
          {overrides.length === 0 ? (
            <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '1rem 0' }}>No escalated overrides. Member-level standard overrides that have been flagged for governance review will appear here.</div>
          ) : overrides.map(o => (
            <div key={o.id} style={s.card}>
              <div style={{ fontWeight: 700, color: 'var(--sb-cream)', marginBottom: '0.2rem' }}>{o.standard_name || o.standard_id}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginBottom: '0.35rem' }}>Domain: {o.domain} · User: {o.user_name || o.user_email}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(196,132,58,0.85)', fontStyle: 'italic' }}>Override: "{o.override_value}"</div>
              {o.override_note && <div style={{ fontSize: '0.75rem', color: 'var(--sb-dusty)', marginTop: '0.25rem' }}>{o.override_note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
