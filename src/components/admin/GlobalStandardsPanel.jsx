import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';

const s = {
  page: { padding: '1.5rem', overflowY: 'auto', height: '100%' },
  eyebrow: { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' },
  title: { fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginBottom: '1.25rem' },
  card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '0.85rem 1.1rem', marginBottom: '0.5rem' },
  label: { fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--sb-cream)', fontSize: '0.85rem', fontFamily: 'var(--sb-font-body)', boxSizing: 'border-box' },
  btn: (primary) => ({ padding: '0.4rem 1rem', background: primary ? 'var(--sb-gold)' : 'transparent', color: primary ? 'var(--sb-ivory)' : 'var(--sb-dusty)', border: `0.5px solid ${primary ? 'var(--sb-gold)' : 'rgba(139,155,174,0.35)'}`, borderRadius: 2, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)' }),
};

const DOMAINS = ['lead-to-cash', 'process-flow', 'governance', 'architecture', 'data-model', 'integration', 'platform', 'other'];
const STATUS_COLORS = { active: '#CDEEDC', published: '#BDE4FF', draft: '#FFE08A', archived: '#555' };

export default function GlobalStandardsPanel() {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [editItem, setEditItem] = useState(null);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/standards', { credentials: 'include' }).then(r => r.json());
    setStandards(r.standards || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = standards.filter(st => {
    if (filterDomain !== 'all' && st.domain !== filterDomain) return false;
    if (filterStatus !== 'all' && st.status !== filterStatus) return false;
    return true;
  });

  async function publish(id) {
    const res = await fetch(`/api/standards/${id}/publish`, { method: 'POST', credentials: 'include' });
    if (!res.ok) { toast.error('Failed to publish'); return; }
    toast.success('Standard published to /resources/standards');
    load();
  }

  async function archive(id) {
    if (!confirm('Archive this standard?')) return;
    await fetch(`/api/standards/${id}`, { method: 'DELETE', credentials: 'include' });
    toast.success('Archived');
    load();
  }

  return (
    <div style={s.page}>
      <div style={s.eyebrow}>Content Manager · Global Standards</div>
      <div style={s.title}>Standards Library</div>

      {/* Filters + new button */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} style={{ ...s.input, width: 'auto' }}>
          <option value="all">All Domains</option>
          {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...s.input, width: 'auto' }}>
          <option value="all">All Status</option>
          {['active', 'published', 'draft', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button style={s.btn(true)} onClick={() => { setShowNew(true); setEditItem(null); }}>+ New Standard</button>
      </div>

      {(showNew || editItem) && (
        <div style={{ ...s.card, borderTop: '2px solid var(--sb-gold)', marginBottom: '1.25rem' }}>
          <StandardForm
            initial={editItem || {}}
            onSave={async (form) => {
              const url = editItem ? `/api/standards/${editItem.id}` : '/api/standards';
              const method = editItem ? 'PUT' : 'POST';
              const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
              if (!res.ok) { toast.error('Failed to save'); return; }
              toast.success(editItem ? 'Standard updated' : 'Standard created');
              setShowNew(false); setEditItem(null); load();
            }}
            onCancel={() => { setShowNew(false); setEditItem(null); }}
          />
        </div>
      )}

      {loading && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading standards…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '1rem 0' }}>
          {standards.length === 0 ? 'No standards yet. Global standards from capabilityTags.js are available as a seed — create your first definition above.' : 'No standards match this filter.'}
        </div>
      )}

      {filtered.map(st => (
        <div key={st.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '1px 8px', borderRadius: 10, background: STATUS_COLORS[st.status] || '#eee', fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)', fontWeight: 600 }}>{st.status}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em' }}>{st.domain}</span>
                {st.category && <span style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)' }}>{st.category}</span>}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sb-cream)', marginBottom: '0.2rem' }}>{st.name}</div>
              {st.definition && <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)', lineHeight: 1.5 }}>{st.definition}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
              {st.status !== 'published' && <button style={{ ...s.btn(true), padding: '0.25rem 0.65rem', fontSize: '0.68rem' }} onClick={() => publish(st.id)}>Publish</button>}
              <button style={{ ...s.btn(false), padding: '0.25rem 0.65rem', fontSize: '0.68rem' }} onClick={() => { setEditItem(st); setShowNew(false); }}>Edit</button>
              {st.status !== 'archived' && <button style={{ ...s.btn(false), padding: '0.25rem 0.65rem', fontSize: '0.68rem', borderColor: 'rgba(200,60,60,0.3)', color: '#C44A4A' }} onClick={() => archive(st.id)}>Archive</button>}
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(196,132,58,0.06)', border: '0.5px dashed rgba(196,132,58,0.25)', borderRadius: 2, fontSize: '0.78rem', color: 'var(--sb-dusty)' }}>
        Published standards appear at <strong style={{ color: 'var(--sb-cream)' }}>/resources/standards</strong> on the public site.
      </div>
    </div>
  );
}

function StandardForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', domain: 'lead-to-cash', category: '', definition: '', source_type: 'platform', status: 'draft',
    ...initial,
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '1rem' }}>{initial.id ? 'Edit Standard' : 'New Standard Definition'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
          <label style={s.label}>Name *</label>
          <input style={s.input} value={form.name} onChange={set('name')} placeholder="e.g. Lead-to-Cash Process Flow" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Domain *</label>
          <select style={s.input} value={form.domain} onChange={set('domain')}>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Category</label>
          <input style={s.input} value={form.category} onChange={set('category')} placeholder="e.g. definition, process, governance" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Source Type</label>
          <select style={s.input} value={form.source_type} onChange={set('source_type')}>
            {['platform', 'industry', 'user-defined', 'ai-generated'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={s.label}>Status</label>
          <select style={s.input} value={form.status} onChange={set('status')}>
            {['draft', 'active', 'published', 'archived'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1', marginBottom: '0.75rem' }}>
          <label style={s.label}>Definition</label>
          <textarea style={{ ...s.input, minHeight: 100, resize: 'vertical' }} value={form.definition} onChange={set('definition')} placeholder="Full definition of this standard…" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button style={s.btn(true)} onClick={() => onSave(form)}>Save Standard</button>
        <button style={s.btn(false)} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
