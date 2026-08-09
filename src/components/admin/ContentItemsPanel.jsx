import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';
import AttachmentList from './AttachmentList.jsx';

// Generic panel for the Content Entry Journey hierarchy items — Observation,
// Season, Theme, Topic, Framework — all reuse the same /api/herq/items?type=
// endpoint (unified_content_items with a type-tagged row, not a new table
// per concept). One component, five tabs, rather than five near-duplicate
// panels.
const h = {
  card: { background: 'rgba(0,0,0,0.04)', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 4, padding: '1rem' },
  label: { fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--herq-teal, #4A7C8E)', fontFamily: 'var(--sb-font-label)', display: 'block', marginBottom: '0.3rem' },
  input: { width: '100%', background: 'rgba(255,255,255,0.8)', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 2, padding: '0.45rem 0.7rem', color: 'var(--herq-text, #1A1A1A)', fontSize: '0.85rem', fontFamily: 'var(--sb-font-body)' },
  btn: (primary) => ({ padding: '0.45rem 1.1rem', background: primary ? 'var(--herq-teal, #4A7C8E)' : 'transparent', color: primary ? '#fff' : 'var(--herq-teal, #4A7C8E)', border: `0.5px solid ${primary ? 'var(--herq-accent, #E8407A)' : 'rgba(74,124,142,0.4)'}`, borderRadius: 2, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }),
};

const FIELD_HINTS = {
  observation: { topic: 'What did you notice?', summary: 'Why did it stand out?' },
  season: { topic: 'Season thesis', summary: 'Narrative progression' },
  theme: { topic: 'Theme statement', summary: 'Narrative role' },
  topic: { topic: 'Core question', summary: 'Underlying tension / operational blind spot' },
  framework: { topic: 'Primary argument', summary: 'Opening tension → framework conclusion' },
};

export default function ContentItemsPanel({ itemType, label, parentType }) {
  const [items, setItems] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const hints = FIELD_HINTS[itemType] || { topic: 'Topic', summary: 'Summary' };

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/herq/items?type=${itemType}`, { credentials: 'include' });
      const data = await res.json();
      setItems(data.items || []);
      if (parentType) {
        const pRes = await fetch(`/api/herq/items?type=${parentType}`, { credentials: 'include' });
        const pData = await pRes.json();
        setParents(pData.items || []);
      }
    } catch (e) {
      toast.error(`Failed to load ${label.toLowerCase()}s`);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [itemType]);

  async function deleteItem(id) {
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return;
    await fetch(`/api/herq/items/${id}`, { method: 'DELETE', credentials: 'include' });
    toast.success(`${label} deleted`);
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--herq-teal, #4A7C8E)', fontFamily: 'var(--sb-font-label)' }}>{label}s ({items.length})</div>
        <button style={h.btn(true)} onClick={() => { setShowNew(true); setEditItem(null); }}>+ New {label}</button>
      </div>

      {(showNew || editItem) && (
        <div style={{ ...h.card, marginBottom: '1.25rem', borderTop: '3px solid var(--herq-accent, #E8407A)' }}>
          <ItemForm
            itemType={itemType}
            hints={hints}
            parents={parents}
            parentType={parentType}
            initial={editItem || {}}
            onSave={async (form) => {
              const url = editItem ? `/api/herq/items/${editItem.id}` : '/api/herq/items';
              const method = editItem ? 'PUT' : 'POST';
              const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, type: itemType }) });
              if (!res.ok) { toast.error('Failed to save'); return; }
              toast.success(editItem ? `${label} updated` : `${label} created`);
              setShowNew(false); setEditItem(null); load();
            }}
            onCancel={() => { setShowNew(false); setEditItem(null); }}
          />
        </div>
      )}

      {loading && <div style={{ color: 'var(--herq-teal, #4A7C8E)', fontSize: '0.85rem' }}>Loading…</div>}
      {!loading && items.length === 0 && <div style={{ color: 'var(--herq-teal, #4A7C8E)', fontSize: '0.85rem' }}>No {label.toLowerCase()}s yet.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((it) => {
          const parent = parents.find((p) => p.id === it.parent_item_id);
          return (
            <div key={it.id} style={h.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  {parent && <div style={{ fontSize: '0.6rem', color: 'var(--herq-accent)', marginBottom: '0.2rem' }}>↳ {parent.title}</div>}
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>{it.title}</div>
                  {it.topic && <div style={{ fontSize: '0.78rem', color: 'var(--herq-teal, #4A7C8E)', fontStyle: 'italic' }}>{it.topic}</div>}
                  {it.summary && <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '0.25rem' }}>{it.summary}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button style={{ ...h.btn(false), padding: '0.25rem 0.6rem' }} onClick={() => { setEditItem(it); setShowNew(false); }}>Edit</button>
                  <button style={{ ...h.btn(false), padding: '0.25rem 0.6rem', borderColor: 'rgba(200,60,60,0.3)', color: '#C44A4A' }} onClick={() => deleteItem(it.id)}>×</button>
                </div>
              </div>
              <AttachmentList entityType={`herq_item_${itemType}`} entityId={it.id} compact />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemForm({ itemType, hints, parents, parentType, initial, onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', topic: '', summary: '', parent_item_id: '', export_status: 'idea', ...initial });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={h.label}>Title *</label>
        <input style={h.input} value={form.title} onChange={set('title')} placeholder={`${itemType} title`} />
      </div>
      {parentType && (
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={h.label}>Parent {parentType}</label>
          <select style={h.input} value={form.parent_item_id || ''} onChange={set('parent_item_id')}>
            <option value="">None</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={h.label}>{hints.topic}</label>
        <input style={h.input} value={form.topic} onChange={set('topic')} />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={h.label}>{hints.summary}</label>
        <textarea style={{ ...h.input, minHeight: 70, resize: 'vertical' }} value={form.summary} onChange={set('summary')} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button style={h.btn(true)} onClick={() => onSave(form)}>Save</button>
        <button style={h.btn(false)} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
