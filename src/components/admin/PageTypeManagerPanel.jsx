import React from 'react';
import { styles } from './adminStyles.js';
import { TEMPLATE_CATEGORIES } from './SectionTemplateModal.jsx';

// Flat, deduped list of { type, label } for the "which block type" picker —
// reuses SectionTemplateModal's template data so there's one source of truth
// for available section types rather than a second hardcoded list.
const SECTION_TYPE_OPTIONS = (() => {
  const seen = new Map();
  for (const cat of TEMPLATE_CATEGORIES) {
    for (const t of cat.templates) {
      if (!seen.has(t.type)) seen.set(t.type, t.label);
    }
  }
  return Array.from(seen, ([type, label]) => ({ type, label }));
})();

const BG_OPTS = ['ivory', 'navy', 'linen', 'teal', 'cream'];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
}

function uniqueTypeId(base, existingIds) {
  let id = base || 'type';
  let n = 1;
  while (existingIds.has(id)) id = `${base}-${++n}`;
  return id;
}

// Admin-only CRUD surface for the platform-wide page type registry. Local
// edits only commit to the server when Save is clicked — Close discards.
export default function PageTypeManagerPanel({ pageTypes, onSave, onClose }) {
  const [types, setTypes] = React.useState(() => JSON.parse(JSON.stringify(pageTypes?.types || [])));
  const [saving, setSaving] = React.useState(false);

  function patchType(idx, patch) {
    setTypes((ts) => ts.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function addType() {
    const existingIds = new Set(types.map((t) => t.id));
    const id = uniqueTypeId('custom', existingIds);
    setTypes((ts) => [...ts, { id, label: 'New Type', description: '', defaultSections: [] }]);
  }

  function removeType(idx) {
    setTypes((ts) => ts.filter((_, i) => i !== idx));
  }

  function addSection(typeIdx) {
    setTypes((ts) =>
      ts.map((t, i) =>
        i === typeIdx
          ? { ...t, defaultSections: [...(t.defaultSections || []), { type: SECTION_TYPE_OPTIONS[0]?.type || 'text', name: 'New Section', bg: 'ivory', fields: {} }] }
          : t
      )
    );
  }

  function patchSection(typeIdx, secIdx, patch) {
    setTypes((ts) =>
      ts.map((t, i) =>
        i === typeIdx
          ? { ...t, defaultSections: t.defaultSections.map((s, j) => (j === secIdx ? { ...s, ...patch } : s)) }
          : t
      )
    );
  }

  function removeSection(typeIdx, secIdx) {
    setTypes((ts) =>
      ts.map((t, i) => (i === typeIdx ? { ...t, defaultSections: t.defaultSections.filter((_, j) => j !== secIdx) } : t))
    );
  }

  function moveSection(typeIdx, secIdx, dir) {
    setTypes((ts) =>
      ts.map((t, i) => {
        if (i !== typeIdx) return t;
        const j = secIdx + dir;
        if (j < 0 || j >= t.defaultSections.length) return t;
        const next = [...t.defaultSections];
        [next[secIdx], next[j]] = [next[j], next[secIdx]];
        return { ...t, defaultSections: next };
      })
    );
  }

  async function handleSave() {
    for (const t of types) {
      if (!t.id || !t.label) return alert('Every type needs an id and a label.');
    }
    const ids = types.map((t) => t.id);
    if (new Set(ids).size !== ids.length) return alert('Type ids must be unique.');
    setSaving(true);
    try {
      await onSave({ types });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--sb-navy-deep)',
          border: '0.5px solid var(--sb-gold)',
          borderRadius: 'var(--sb-radius)',
          padding: '1.75rem',
          width: '100%',
          maxWidth: 760,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="sb-display" style={{ fontSize: '1.4rem', marginBottom: '0.25rem', color: 'var(--sb-cream)' }}>
          Manage Page Types
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginBottom: '1.25rem' }}>
          Each type defines what sections a new page starts with. Changes apply platform-wide, for admin and member sites alike.
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
          {types.map((t, typeIdx) => (
            <div key={t.id} style={{ ...styles.card, marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.6rem', alignItems: 'end', marginBottom: '0.75rem' }}>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Label</label>
                  <input
                    className="sb-input"
                    value={t.label}
                    onChange={(e) => patchType(typeIdx, { label: e.target.value })}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Id (stable key — leave alone once in use)</label>
                  <input
                    className="sb-input"
                    value={t.id}
                    onChange={(e) => patchType(typeIdx, { id: slugify(e.target.value) })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeType(typeIdx)}
                  style={{ padding: '0.45rem 0.7rem', borderRadius: 4, border: '1px solid rgba(220,80,80,0.4)', background: 'transparent', color: '#e08a8a', cursor: 'pointer', fontSize: '0.7rem', marginBottom: '1.1rem' }}
                >
                  Delete Type
                </button>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Description</label>
                <input
                  className="sb-input"
                  value={t.description || ''}
                  onChange={(e) => patchType(typeIdx, { description: e.target.value })}
                  placeholder="Shown to the user when picking this type in New Page"
                />
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <label style={styles.fieldLabel}>Default Sections</label>
                {(t.defaultSections || []).map((sec, secIdx) => (
                  <div key={secIdx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <select
                      className="sb-input"
                      style={{ fontSize: '0.75rem', flex: 1 }}
                      value={sec.type}
                      onChange={(e) => patchSection(typeIdx, secIdx, { type: e.target.value })}
                    >
                      {SECTION_TYPE_OPTIONS.map((o) => (
                        <option key={o.type} value={o.type}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      className="sb-input"
                      style={{ fontSize: '0.75rem', flex: 1 }}
                      value={sec.name}
                      onChange={(e) => patchSection(typeIdx, secIdx, { name: e.target.value })}
                      placeholder="Section name"
                    />
                    <select
                      className="sb-input"
                      style={{ fontSize: '0.75rem', width: 100 }}
                      value={sec.bg || 'ivory'}
                      onChange={(e) => patchSection(typeIdx, secIdx, { bg: e.target.value })}
                    >
                      {BG_OPTS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <button type="button" onClick={() => moveSection(typeIdx, secIdx, -1)} disabled={secIdx === 0} style={smallIconBtn}>↑</button>
                    <button type="button" onClick={() => moveSection(typeIdx, secIdx, 1)} disabled={secIdx === t.defaultSections.length - 1} style={smallIconBtn}>↓</button>
                    <button type="button" onClick={() => removeSection(typeIdx, secIdx)} style={{ ...smallIconBtn, color: '#e08a8a' }}>✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSection(typeIdx)}
                  style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 4, border: '1px dashed var(--sb-sage)', background: 'transparent', color: 'var(--sb-sage)', cursor: 'pointer', marginTop: '0.3rem' }}
                >
                  + Add Section
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addType}
            style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', borderRadius: 6, border: '1px dashed var(--sb-gold)', background: 'transparent', color: 'var(--sb-gold)', cursor: 'pointer', width: '100%' }}
          >
            + Add Page Type
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', flexShrink: 0 }}>
          <button className="sb-btn sb-btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="sb-btn sb-btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Page Types'}
          </button>
        </div>
      </div>
    </div>
  );
}

const smallIconBtn = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  color: 'var(--sb-teal-deep)',
  cursor: 'pointer',
  fontSize: '0.68rem',
  padding: '3px 7px',
};
