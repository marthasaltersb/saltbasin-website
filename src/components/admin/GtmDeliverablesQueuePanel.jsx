/**
 * GtmDeliverablesQueuePanel — list + status/mode filter, list-left/
 * detail-right layout matching LeadsPanel.jsx's convention. Selecting a row
 * opens GtmDeliverableDetail.
 */
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import GtmDeliverableDetail from './GtmDeliverableDetail.jsx';

const STATUSES = ['', 'generating', 'draft', 'reviewed', 'approved', 'sent', 'failed'];
const MODES = ['', 'benchmark_refresh', 'engagement'];

const S = {
  layout: { display: 'flex', gap: '1.25rem', alignItems: 'flex-start' },
  listCol: { width: 380, flexShrink: 0 },
  filterRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' },
  select: { padding: '0.4rem 0.6rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.78rem', fontFamily: 'inherit' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '70vh', overflowY: 'auto' },
  item: (active) => ({
    padding: '0.65rem 0.8rem', borderRadius: 8, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.1)',
    background: active ? 'rgba(27,42,59,0.08)' : 'white',
  }),
  itemTitle: { fontSize: '0.82rem', fontWeight: 600, color: '#222', marginBottom: '0.2rem' },
  itemMeta: { fontSize: '0.7rem', color: '#888' },
  statusPill: (status) => ({
    display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700,
    color: 'white', marginLeft: '0.4rem',
    background:
      status === 'draft' ? '#c4843a' :
      status === 'reviewed' ? '#4a7c8e' :
      status === 'approved' ? '#6b8f71' :
      status === 'sent' ? '#1b2a3b' :
      status === 'failed' ? '#b5433a' : '#999',
  }),
  detailCol: { flex: 1, minWidth: 0 },
  empty: { padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' },
  placeholder: { padding: '3rem', textAlign: 'center', color: '#999', fontSize: '0.85rem', background: 'white', borderRadius: 10, border: '0.5px dashed rgba(0,0,0,0.15)' },
};

export default function GtmDeliverablesQueuePanel() {
  const [deliverables, setDeliverables] = useState(null);
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  async function load() {
    try {
      const filters = {};
      if (status) filters.status = status;
      if (mode) filters.mode = mode;
      const { deliverables } = await api.listGtmDeliverables(filters);
      setDeliverables(deliverables);
    } catch (e) {
      toast(e.message);
    }
  }

  useEffect(() => { load(); }, [status, mode]);

  return (
    <div style={S.layout}>
      <div style={S.listCol}>
        <div style={S.filterRow}>
          <select style={S.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
          <select style={S.select} value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => <option key={m} value={m}>{m || 'All modes'}</option>)}
          </select>
        </div>
        {deliverables === null ? (
          <div style={S.empty}>Loading…</div>
        ) : deliverables.length === 0 ? (
          <div style={S.empty}>No deliverables match this filter.</div>
        ) : (
          <div style={S.list}>
            {deliverables.map((d) => (
              <div key={d.id} style={S.item(d.id === selectedId)} onClick={() => setSelectedId(d.id)}>
                <div style={S.itemTitle}>
                  {d.topic}
                  <span style={S.statusPill(d.status)}>{d.status}</span>
                </div>
                <div style={S.itemMeta}>
                  {d.mode === 'engagement' ? `Engagement — ${d.engagement_client_name || 'unnamed client'}` : 'Benchmark Refresh'}
                  {' · '}{new Date(d.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={S.detailCol}>
        {selectedId ? (
          <GtmDeliverableDetail id={selectedId} onChange={load} />
        ) : (
          <div style={S.placeholder}>← Pick a deliverable to review it.</div>
        )}
      </div>
    </div>
  );
}
