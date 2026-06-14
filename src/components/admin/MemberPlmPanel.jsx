import React, { useEffect, useState } from 'react';

const s = {
  page: { padding: '1.5rem', overflowY: 'auto', height: '100%' },
  eyebrow: { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' },
  title: { fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginBottom: '0.25rem' },
  sub: { fontSize: '0.82rem', color: 'var(--sb-dusty)', marginBottom: '1.5rem', lineHeight: 1.5 },
  card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '0.85rem 1.1rem', marginBottom: '0.5rem' },
};

const STATUS_COLORS = {
  backlog: 'rgba(139,155,174,0.25)',
  'in-progress': '#BDE4FF',
  'in-review': '#C7B7FF',
  done: '#CDEEDC',
  blocked: '#FFD6A5',
  cancelled: 'rgba(139,155,174,0.1)',
};
const PRIORITY_COLORS = { critical: '#C44A4A', high: '#FFD6A5', medium: '#BDE4FF', low: 'rgba(139,155,174,0.3)' };

export default function MemberPlmPanel() {
  const [items, setItems] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/backlog', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/backlog/summary', { credentials: 'include' }).then(r => r.json()),
    ]).then(([bl, sn]) => {
      setItems(bl.items || []);
      setSnapshots(sn.snapshots || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statuses = ['all', 'in-progress', 'in-review', 'done', 'backlog', 'blocked'];
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  const counts = {
    done: items.filter(i => i.status === 'done').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
    total: items.length,
  };

  return (
    <div style={s.page}>
      <div style={s.eyebrow}>Platform Lifecycle Management</div>
      <div style={s.title}>Platform Roadmap</div>
      <div style={s.sub}>Read-only view of the Salt Basin Net Works build status and platform delivery progress.</div>

      {/* Progress summary */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Items', value: counts.total },
          { label: 'In Progress', value: counts.inProgress },
          { label: 'Completed', value: counts.done },
          { label: 'Completion', value: counts.total ? `${Math.round((counts.done / counts.total) * 100)}%` : '—' },
        ].map(c => (
          <div key={c.label} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '0.85rem 1.1rem', minWidth: 120 }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.3rem' }}>{c.label}</div>
            <div style={{ fontSize: '1.6rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Latest snapshot */}
      {snapshots.length > 0 && (() => {
        const snap = snapshots[0];
        const data = typeof snap.snapshot_data === 'string' ? JSON.parse(snap.snapshot_data) : (snap.snapshot_data || {});
        return (
          <div style={{ ...s.card, borderLeft: '3px solid var(--sb-gold)', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' }}>
              Latest Build Snapshot · {new Date(Number(snap.captured_at)).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--sb-dusty)', lineHeight: 1.6 }}>
              {data.summary || 'Build in progress.'}
            </div>
          </div>
        );
      })()}

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {statuses.map(st => (
          <button key={st} onClick={() => setFilter(st)} style={{
            padding: '0.25rem 0.75rem', fontSize: '0.68rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase',
            background: filter === st ? 'var(--sb-gold)' : 'transparent',
            color: filter === st ? 'var(--sb-ivory)' : 'var(--sb-dusty)',
            border: `0.5px solid ${filter === st ? 'var(--sb-gold)' : 'rgba(139,155,174,0.3)'}`,
            borderRadius: 2, cursor: 'pointer',
          }}>{st}</button>
        ))}
      </div>

      {loading && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading platform items…</div>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {filtered.map(item => (
            <div key={item.id} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ padding: '1px 7px', borderRadius: 10, background: STATUS_COLORS[item.status] || '#eee', fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)', fontWeight: 600 }}>{item.status}</span>
                    {item.priority && <span style={{ padding: '1px 7px', borderRadius: 10, background: PRIORITY_COLORS[item.priority] || '#eee', fontSize: '0.6rem', color: '#1A1A1A', fontFamily: 'var(--sb-font-label)' }}>{item.priority}</span>}
                    {item.area && <span style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)' }}>{item.area}</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--sb-cream)', fontWeight: 500 }}>{item.title}</div>
                  {item.description && <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginTop: '0.2rem', lineHeight: 1.5 }}>{item.description}</div>}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '1rem 0' }}>No items in this status.</div>}
        </div>
      )}
    </div>
  );
}
