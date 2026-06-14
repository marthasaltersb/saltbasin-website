import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';

const s = {
  page: { padding: '1.5rem', overflowY: 'auto', height: '100%' },
  eyebrow: { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' },
  title: { fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginBottom: '1.25rem' },
  card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '1rem 1.25rem', marginBottom: '0.75rem' },
  label: { fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--sb-cream)', fontSize: '0.85rem', fontFamily: 'var(--sb-font-body)', boxSizing: 'border-box' },
  btn: (primary) => ({ padding: '0.4rem 1rem', background: primary ? 'var(--sb-gold)' : 'transparent', color: primary ? 'var(--sb-ivory)' : 'var(--sb-dusty)', border: `0.5px solid ${primary ? 'var(--sb-gold)' : 'rgba(139,155,174,0.35)'}`, borderRadius: 2, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }),
  tab: (active) => ({ padding: '0.4rem 1rem', fontSize: '0.75rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', color: active ? 'var(--sb-gold)' : 'var(--sb-dusty)', border: 'none', borderBottom: active ? '2px solid var(--sb-gold)' : '2px solid transparent', cursor: 'pointer' }),
};

const STATUS_COLORS = { draft: '#FFE08A', preview: '#BDE4FF', published: '#CDEEDC', archived: '#555' };

export default function ServicesPanel() {
  const [tab, setTab] = useState('proposals');
  const [proposals, setProposals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const [pR, lR] = await Promise.all([
        fetch('/api/services/proposals', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/services/leads', { credentials: 'include' }).then(r => r.json()),
      ]);
      setProposals(pR.proposals || []);
      setLeads(lR.leads || []);
    } catch {
      toast.error('Failed to load services data');
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div style={s.page}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={s.eyebrow}>Content Manager · Services</div>
        <div style={s.title}>Services Proposal Manager</div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid rgba(196,132,58,0.15)', marginBottom: '1.5rem' }}>
        {[['proposals', 'Proposals'], ['leads', 'Access Requests & Leads']].map(([id, label]) => (
          <button key={id} style={s.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {loading && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading…</div>}

      {!loading && tab === 'proposals' && <ProposalsList proposals={proposals} onRefresh={loadAll} />}
      {!loading && tab === 'leads'     && <LeadsList leads={leads} />}
    </div>
  );
}

function ProposalsList({ proposals, onRefresh }) {
  const [showNew, setShowNew] = useState(false);
  const [editProposal, setEditProposal] = useState(null);

  async function deleteProposal(id) {
    if (!confirm('Delete this proposal?')) return;
    await fetch(`/api/services/proposals/${id}`, { method: 'DELETE', credentials: 'include' });
    toast.success('Proposal deleted');
    onRefresh();
  }

  async function publish(id) {
    const res = await fetch(`/api/services/proposals/${id}/publish`, { method: 'POST', credentials: 'include' });
    if (!res.ok) { toast.error('Failed to publish'); return; }
    toast.success('Proposal published');
    onRefresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', textTransform: 'uppercase' }}>Proposals ({proposals.length})</div>
        <button style={s.btn(true)} onClick={() => { setShowNew(true); setEditProposal(null); }}>+ New Proposal</button>
      </div>

      {(showNew || editProposal) && (
        <div style={{ ...s.card, borderTop: '2px solid var(--sb-gold)', marginBottom: '1.25rem' }}>
          <ProposalForm
            initial={editProposal || {}}
            onSave={async (form) => {
              const url = editProposal ? `/api/services/proposals/${editProposal.id}` : '/api/services/proposals';
              const method = editProposal ? 'PUT' : 'POST';
              const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
              if (!res.ok) { toast.error('Failed to save'); return; }
              toast.success(editProposal ? 'Proposal updated' : 'Proposal created');
              setShowNew(false); setEditProposal(null); onRefresh();
            }}
            onCancel={() => { setShowNew(false); setEditProposal(null); }}
          />
        </div>
      )}

      {proposals.length === 0 ? (
        <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '1rem 0' }}>No proposals yet. Create your first service proposal above.</div>
      ) : (
        proposals.map(p => {
          const content = typeof p.body === 'string' ? JSON.parse(p.body || '{}') : (p.body || {});
          return (
            <div key={p.id} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ padding: '1px 8px', borderRadius: 10, background: STATUS_COLORS[p.export_status] || '#555', fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)', fontWeight: 600 }}>{p.export_status}</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sb-cream)', marginBottom: '0.2rem' }}>{p.title}</div>
                  {p.summary && <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', lineHeight: 1.5, marginBottom: '0.25rem' }}>{p.summary}</div>}
                  {content.audience && <div style={{ fontSize: '0.72rem', color: 'rgba(196,132,58,0.7)' }}>Audience: {content.audience}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginLeft: '1rem', flexShrink: 0 }}>
                  {p.export_status !== 'published' && (
                    <button style={{ ...s.btn(true), fontSize: '0.7rem', padding: '0.3rem 0.75rem' }} onClick={() => publish(p.id)}>Publish</button>
                  )}
                  <button style={{ ...s.btn(false), fontSize: '0.7rem', padding: '0.3rem 0.75rem' }} onClick={() => { setEditProposal(p); setShowNew(false); }}>Edit</button>
                  <button style={{ ...s.btn(false), fontSize: '0.7rem', padding: '0.3rem 0.75rem', borderColor: 'rgba(200,60,60,0.3)', color: '#C44A4A' }} onClick={() => deleteProposal(p.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ProposalForm({ initial, onSave, onCancel }) {
  const parsedBody = typeof initial.body === 'string' ? JSON.parse(initial.body || '{}') : (initial.body || {});
  const [form, setForm] = useState({
    title: '', summary: '', export_status: 'draft',
    ...initial,
    body: { audience: '', problem: '', approach: '', deliverables: '', pricing_note: '', timeline: '', ...parsedBody },
  });

  const setBody = k => e => setForm(f => ({ ...f, body: { ...f.body, [k]: e.target.value } }));

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '1rem' }}>{initial.id ? 'Edit Proposal' : 'New Service Proposal'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
          <label style={s.label}>Title *</label>
          <input style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
          <label style={s.label}>Summary</label>
          <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Status</label>
          <select style={s.input} value={form.export_status} onChange={e => setForm(f => ({ ...f, export_status: e.target.value }))}>
            {['draft', 'preview', 'published', 'archived'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Target Audience</label>
          <input style={s.input} value={form.body.audience || ''} onChange={setBody('audience')} />
        </div>
        {[['problem', 'Problem Statement'], ['approach', 'Approach'], ['deliverables', 'Deliverables'], ['timeline', 'Timeline'], ['pricing_note', 'Pricing Note']].map(([k, label]) => (
          <div key={k} style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
            <label style={s.label}>{label}</label>
            <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }} value={form.body[k] || ''} onChange={setBody(k)} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button style={s.btn(true)} onClick={() => onSave(form)}>Save Proposal</button>
        <button style={s.btn(false)} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function LeadsList({ leads }) {
  if (leads.length === 0) {
    return (
      <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '1rem 0' }}>
        No access requests yet. When a member requests access to a proposal, a lead record appears here.
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Access Requests / Leads ({leads.length})</div>
      {leads.map(l => {
        return (
          <div key={l.id} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--sb-cream)', fontSize: '0.9rem' }}>{l.org_name || 'Unknown Org'}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginTop: '0.15rem' }}>{l.email || l.contact_email}</div>
                {l.request_context && <div style={{ fontSize: '0.75rem', color: 'rgba(196,132,58,0.8)', marginTop: '0.35rem', fontStyle: 'italic' }}>"{l.request_context}"</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, background: l.status === 'qualified' ? '#CDEEDC' : '#FFE08A', fontSize: '0.62rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)', fontWeight: 600 }}>{l.status || 'new'}</span>
                <div style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)', marginTop: '0.3rem' }}>{new Date(Number(l.created_at)).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
