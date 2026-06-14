import React, { useState, useEffect, useCallback } from 'react';

const S = {
  root: { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--sb-navy-deep)' },
  toolbar: { display: 'flex', gap: '0.6rem', alignItems: 'center', padding: '0.75rem 1.25rem', borderBottom: '0.5px solid rgba(196,132,58,0.18)', flexShrink: 0, flexWrap: 'wrap' },
  label: { fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' },
  select: { padding: '0.3rem 0.6rem', background: 'rgba(20,30,42,0.9)', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 2, color: 'var(--sb-cream)', fontSize: '0.78rem', outline: 'none' },
  input: { padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 2, color: 'var(--sb-cream)', fontSize: '0.78rem', outline: 'none', width: 180 },
  btnGhost: { padding: '0.3rem 0.75rem', background: 'none', border: '0.5px solid rgba(139,155,174,0.3)', color: 'var(--sb-dusty)', borderRadius: 2, fontSize: '0.72rem', cursor: 'pointer' },
  btnGold: { padding: '0.3rem 0.75rem', background: 'var(--sb-gold)', color: 'var(--sb-ivory)', border: 'none', borderRadius: 2, fontSize: '0.72rem', cursor: 'pointer' },
  body: { flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' },
  empty: { textAlign: 'center', color: 'var(--sb-dusty)', fontSize: '0.85rem', marginTop: '3rem', lineHeight: 1.7 },
};

const SOURCE_COLORS = {
  manual:   { bg: 'rgba(196,132,58,0.15)', color: 'var(--sb-gold)' },
  publish:  { bg: 'rgba(109,204,109,0.15)', color: '#6dcc6d' },
  ai:       { bg: 'rgba(120,100,220,0.15)', color: '#a890f0' },
  template: { bg: 'rgba(80,160,220,0.15)', color: '#5ab4e8' },
  import:   { bg: 'rgba(220,120,80,0.15)', color: '#e88a5a' },
};

function sourceStyle(s) {
  return SOURCE_COLORS[s] || SOURCE_COLORS.manual;
}

function relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function HashChip({ hash, long }) {
  const [copied, setCopied] = useState(false);
  function copy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(hash).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <code onClick={copy} title={long ? hash : 'Click to copy full hash'}
      style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--sb-gold)', opacity: 0.85, cursor: 'pointer', letterSpacing: '0.04em' }}>
      {copied ? '✓ copied' : (long ? hash : hash.slice(0, 8) + '…')}
    </code>
  );
}

function ValueDiff({ prev, next }) {
  let prevStr, nextStr;
  try { prevStr = JSON.parse(prev ?? 'null'); } catch { prevStr = prev; }
  try { nextStr = JSON.parse(next ?? 'null'); } catch { nextStr = next; }
  const fmt = (v) => {
    if (v === null || v === undefined) return <em style={{ color: '#888' }}>null</em>;
    const s = String(v);
    return s.length > 80 ? s.slice(0, 80) + '…' : s;
  };
  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', marginTop: '0.3rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
      {prev !== undefined && (
        <span style={{ color: '#e88a8a', background: 'rgba(200,80,80,0.08)', padding: '0.1rem 0.4rem', borderRadius: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          − {fmt(prevStr)}
        </span>
      )}
      <span style={{ color: 'var(--sb-dusty)', alignSelf: 'center' }}>→</span>
      <span style={{ color: '#8fe88a', background: 'rgba(80,200,80,0.08)', padding: '0.1rem 0.4rem', borderRadius: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        + {fmt(nextStr)}
      </span>
    </div>
  );
}

function FieldRow({ field, onDrillDown }) {
  return (
    <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)', padding: '0.55rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <code style={{ fontSize: '0.7rem', color: 'var(--sb-cream)', fontFamily: 'monospace' }}>{field.field_path}</code>
        <HashChip hash={field.context_hash} />
        <button onClick={() => onDrillDown(field.field_path)} style={{ ...S.btnGhost, padding: '0.1rem 0.4rem', fontSize: '0.6rem', marginLeft: 'auto' }}>
          History →
        </button>
      </div>
      <ValueDiff prev={field.prev_value} next={field.value} />
    </div>
  );
}

function SnapshotCard({ snap, isOpen, onToggle, onDrillDown }) {
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const ss = sourceStyle(snap.triggered_by);

  useEffect(() => {
    if (!isOpen || fields !== null) return;
    setLoading(true);
    fetch(`/api/lineage/snapshots/${snap.id}/fields`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setFields(d.fields || []); setLoading(false); })
      .catch(() => { setFields([]); setLoading(false); });
  }, [isOpen, snap.id, fields]);

  return (
    <div style={{ marginBottom: '0.6rem', border: `0.5px solid ${isOpen ? 'rgba(196,132,58,0.35)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 3, overflow: 'hidden' }}>
      {/* Header row */}
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.9rem', cursor: 'pointer', background: isOpen ? 'rgba(196,132,58,0.06)' : 'transparent', flexWrap: 'wrap' }}>
        {/* Timeline dot */}
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: ss.color, flexShrink: 0 }} />

        {/* Source badge */}
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.45rem', borderRadius: 2, fontFamily: 'var(--sb-font-label)', ...ss }}>
          {snap.triggered_by}
        </span>

        {/* Entity */}
        <span style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>
          <span style={{ color: 'var(--sb-cream)' }}>{snap.entity_type}</span>
          <span style={{ margin: '0 0.25rem' }}>/</span>
          <span>{snap.entity_id}</span>
        </span>

        {/* Counts */}
        <span style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginLeft: 'auto' }}>
          {snap.changed_count} field{snap.changed_count !== 1 ? 's' : ''} changed
        </span>

        {/* Snapshot hash */}
        <HashChip hash={snap.snapshot_hash} />

        {/* Time */}
        <span style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)', whiteSpace: 'nowrap' }}>{relTime(Number(snap.captured_at))}</span>

        {/* Author */}
        {snap.author_email && (
          <span style={{ fontSize: '0.65rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>{snap.author_email}</span>
        )}

        <span style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginLeft: '0.25rem' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {/* Expanded field list */}
      {isOpen && (
        <div style={{ borderTop: '0.5px solid rgba(196,132,58,0.12)', background: 'rgba(0,0,0,0.15)' }}>
          {loading && <div style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--sb-dusty)' }}>Loading fields…</div>}
          {!loading && fields?.length === 0 && <div style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--sb-dusty)' }}>No field data (legacy snapshot)</div>}
          {!loading && fields?.map(f => (
            <FieldRow key={f.id} field={f} onDrillDown={onDrillDown} />
          ))}
        </div>
      )}
    </div>
  );
}

function FieldHistoryDrawer({ entityType, entityId, fieldPath, onClose }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ entity_type: entityType, entity_id: entityId, field_path: fieldPath });
    fetch(`/api/lineage/field?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => setHistory([]));
  }, [entityType, entityId, fieldPath]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ width: 480, background: 'var(--sb-navy-deep)', borderLeft: '0.5px solid rgba(196,132,58,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={S.label}>Field History</div>
            <code style={{ fontSize: '0.8rem', color: 'var(--sb-cream)', fontFamily: 'monospace' }}>{fieldPath}</code>
            <div style={{ fontSize: '0.65rem', color: 'var(--sb-dusty)', marginTop: '0.2rem' }}>{entityType} / {entityId}</div>
          </div>
          <button onClick={onClose} style={{ ...S.btnGhost, padding: '0.25rem 0.6rem' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
          {history === null && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.8rem' }}>Loading…</div>}
          {history?.length === 0 && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.8rem' }}>No history found.</div>}
          {history?.map((row, i) => {
            const ss = sourceStyle(row.source_type);
            return (
              <div key={row.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.1rem 0.4rem', borderRadius: 2, fontFamily: 'var(--sb-font-label)', ...ss }}>
                    {row.source_type}
                  </span>
                  <HashChip hash={row.context_hash} long={i === 0} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)', marginLeft: 'auto' }}>{relTime(Number(row.captured_at))}</span>
                </div>
                <ValueDiff prev={row.prev_value} next={row.value} />
                {row.author_email && <div style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)', marginTop: '0.3rem', fontStyle: 'italic' }}>{row.author_email}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function LineagePanel() {
  const [entities, setEntities] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null); // { entity_type, entity_id }
  const [snapshots, setSnapshots] = useState(null);
  const [openSnapshotId, setOpenSnapshotId] = useState(null);
  const [fieldDrill, setFieldDrill] = useState(null); // { entity_type, entity_id, fieldPath }
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Load entity index on mount
  useEffect(() => {
    fetch('/api/lineage/entities', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setEntities(d.entities || []))
      .catch(() => setEntities([]));
  }, []);

  // Load snapshots when entity changes
  useEffect(() => {
    if (!selectedEntity) { setSnapshots(null); return; }
    setLoading(true);
    setSnapshots(null);
    const p = new URLSearchParams({ entity_type: selectedEntity.entity_type, entity_id: selectedEntity.entity_id, limit: 50 });
    fetch(`/api/lineage/snapshots?${p}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setSnapshots(d.snapshots || []); setLoading(false); })
      .catch(() => { setSnapshots([]); setLoading(false); });
  }, [selectedEntity]);

  const filteredSnaps = (snapshots || []).filter(s => {
    if (!search) return true;
    return s.snapshot_hash.includes(search) || s.triggered_by.includes(search) || (s.author_email || '').includes(search);
  });

  const entityLabel = (e) => `${e.entity_type} / ${e.entity_id}`;

  return (
    <div style={S.root}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <div>
          <div style={S.label}>Data Lineage · Waterfall</div>
        </div>

        {/* Entity picker */}
        <select style={S.select} value={selectedEntity ? JSON.stringify(selectedEntity) : ''}
          onChange={e => { setSelectedEntity(e.target.value ? JSON.parse(e.target.value) : null); setOpenSnapshotId(null); setSearch(''); }}>
          <option value=''>— Select entity —</option>
          {(entities || []).map(e => (
            <option key={`${e.entity_type}/${e.entity_id}`} value={JSON.stringify({ entity_type: e.entity_type, entity_id: e.entity_id })}>
              {entityLabel(e)} · {e.snapshot_count} snapshot{e.snapshot_count !== 1 ? 's' : ''}
            </option>
          ))}
        </select>

        {selectedEntity && (
          <input style={S.input} placeholder="Filter by hash, source, author…"
            value={search} onChange={e => setSearch(e.target.value)} />
        )}

        {selectedEntity && (
          <button onClick={() => { setSnapshots(null); setLoading(true); const p = new URLSearchParams({ entity_type: selectedEntity.entity_type, entity_id: selectedEntity.entity_id, limit: 50 }); fetch(`/api/lineage/snapshots?${p}`, { credentials: 'include' }).then(r => r.json()).then(d => { setSnapshots(d.snapshots || []); setLoading(false); }); }}
            style={S.btnGhost}>↻ Refresh</button>
        )}
      </div>

      {/* Body */}
      <div style={S.body}>
        {!selectedEntity && entities?.length === 0 && (
          <div style={S.empty}>
            No lineage data yet.<br />
            Lineage is recorded automatically every time site content or HERQ output data is saved.
          </div>
        )}

        {!selectedEntity && (entities || []).length > 0 && (
          <div>
            <div style={{ ...S.label, marginBottom: '0.85rem' }}>Tracked Entities</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '0.6rem' }}>
              {entities.map(e => (
                <div key={`${e.entity_type}/${e.entity_id}`}
                  onClick={() => setSelectedEntity({ entity_type: e.entity_type, entity_id: e.entity_id })}
                  style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.15)', borderRadius: 2, cursor: 'pointer' }}
                  onMouseEnter={e2 => e2.currentTarget.style.borderColor = 'rgba(196,132,58,0.4)'}
                  onMouseLeave={e2 => e2.currentTarget.style.borderColor = 'rgba(196,132,58,0.15)'}>
                  <div style={S.label}>{e.entity_type}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--sb-cream)', margin: '0.2rem 0' }}>{e.entity_id}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)' }}>
                    {e.snapshot_count} snapshot{e.snapshot_count !== 1 ? 's' : ''} · last {relTime(Number(e.last_captured))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedEntity && loading && (
          <div style={{ color: 'var(--sb-dusty)', fontSize: '0.82rem' }}>Loading snapshots…</div>
        )}

        {selectedEntity && !loading && snapshots !== null && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={S.label}>Waterfall — {entityLabel(selectedEntity)}</div>
              <span style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)' }}>{filteredSnaps.length} snapshot{filteredSnaps.length !== 1 ? 's' : ''}</span>
              <button onClick={() => setSelectedEntity(null)} style={{ ...S.btnGhost, marginLeft: 'auto', fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>← All entities</button>
            </div>

            {filteredSnaps.length === 0 && (
              <div style={S.empty}>No snapshots match your filter.</div>
            )}

            {/* Timeline connector line */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 17, top: 0, bottom: 0, width: 1, background: 'rgba(196,132,58,0.12)', pointerEvents: 'none' }} />
              <div style={{ paddingLeft: 0 }}>
                {filteredSnaps.map(snap => (
                  <SnapshotCard
                    key={snap.id}
                    snap={snap}
                    isOpen={openSnapshotId === snap.id}
                    onToggle={() => setOpenSnapshotId(openSnapshotId === snap.id ? null : snap.id)}
                    onDrillDown={(fieldPath) => setFieldDrill({ entity_type: selectedEntity.entity_type, entity_id: selectedEntity.entity_id, fieldPath })}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Field history drawer */}
      {fieldDrill && (
        <FieldHistoryDrawer
          entityType={fieldDrill.entity_type}
          entityId={fieldDrill.entity_id}
          fieldPath={fieldDrill.fieldPath}
          onClose={() => setFieldDrill(null)}
        />
      )}
    </div>
  );
}
