import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';

const s = {
  page: { padding: '1.5rem', overflowY: 'auto', height: '100%' },
  eyebrow: { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' },
  title: { fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginBottom: '0.25rem' },
  sub: { fontSize: '0.82rem', color: 'var(--sb-dusty)', marginBottom: '1.5rem', lineHeight: 1.5 },
  card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '1rem 1.25rem', marginBottom: '0.75rem' },
  label: { fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--sb-cream)', fontSize: '0.85rem', fontFamily: 'var(--sb-font-body)', boxSizing: 'border-box' },
  btn: (primary) => ({ padding: '0.4rem 1rem', background: primary ? 'var(--sb-gold)' : 'transparent', color: primary ? 'var(--sb-ivory)' : 'var(--sb-dusty)', border: `0.5px solid ${primary ? 'var(--sb-gold)' : 'rgba(139,155,174,0.35)'}`, borderRadius: 2, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)' }),
};

export default function FinBridgeCoPanel() {
  const [configs, setConfigs] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ key: '', value: '' });

  async function load() {
    setLoading(true);
    try {
      const [cR, sR] = await Promise.all([
        fetch('/api/finbridgeco/configs', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/finbridgeco/status', { credentials: 'include' }).then(r => r.json()),
      ]);
      setConfigs(cR.configs || []);
      setStatus(sR);
    } catch {
      toast.error('Failed to load FinBridgeCo data');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveConfig() {
    if (!form.key) { toast.error('Key is required'); return; }
    const res = await fetch('/api/finbridgeco/configs', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error('Failed to save'); return; }
    toast.success('Config saved');
    setForm({ key: '', value: '' });
    setShowNew(false);
    load();
  }

  async function deleteConfig(id) {
    if (!confirm('Delete this config entry?')) return;
    await fetch(`/api/finbridgeco/configs/${id}`, { method: 'DELETE', credentials: 'include' });
    toast.success('Deleted');
    load();
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={s.eyebrow}>Platform Application</div>
          <div style={s.title}>FinBridgeCo Manager</div>
          <div style={s.sub}>Configuration placeholder for the FinBridgeCo application. Use this layer to define application-specific settings, feature flags, and context parameters as the product spec is refined.</div>
        </div>
        {status && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 2, padding: '0.75rem 1rem', textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Active Licenses</div>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-gold)', fontWeight: 300 }}>{status.license_count ?? '—'}</div>
          </div>
        )}
      </div>

      {/* Phase note */}
      <div style={{ ...s.card, borderLeft: '3px solid rgba(196,132,58,0.4)', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.4rem' }}>Phase 2 Build — Object Model Mapping</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--sb-dusty)', lineHeight: 1.6 }}>
          The FinBridgeCo application-specific object model is defined in <code style={{ color: 'var(--sb-cream)', background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 2 }}>handoveros/</code>.
          Phase 2 will map this into the Unified Object Model and build out the full application UI layer including deal tracking, document orchestration, and data room access management.
        </div>
      </div>

      {/* Config entries */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)' }}>Configuration ({configs.length})</div>
        <button style={s.btn(true)} onClick={() => setShowNew(!showNew)}>+ Add Config</button>
      </div>

      {showNew && (
        <div style={{ ...s.card, borderTop: '2px solid var(--sb-gold)', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={s.label}>Key *</label>
              <input style={s.input} value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="e.g. feature_flag_deal_room" />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={s.label}>Value</label>
              <input style={s.input} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="true / false / JSON string" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={s.btn(true)} onClick={saveConfig}>Save</button>
            <button style={s.btn(false)} onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading…</div>}

      {!loading && configs.length === 0 && !showNew && (
        <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '1rem 0' }}>No configuration entries yet. Use the + Add Config button to begin defining the FinBridgeCo application context.</div>
      )}

      {configs.map(c => (
        <div key={c.id} style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.82rem', color: 'var(--sb-cream)', letterSpacing: '0.05em' }}>{c.key}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginTop: '0.15rem', fontFamily: 'monospace' }}>{c.value}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '1rem' }}>
            <button style={{ ...s.btn(false), padding: '0.25rem 0.6rem', fontSize: '0.7rem', borderColor: 'rgba(200,60,60,0.3)', color: '#C44A4A' }} onClick={() => deleteConfig(c.id)}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}
