import React from 'react';
import { styles } from './adminStyles.js';
import ImageUploadField from './ImageUploadField.jsx';
import { WIDGET_TYPES } from '../blocks/ColumnWidgets.jsx';

// Default config shape per widget type — used both to seed a new column and
// to reset config when an existing column's widget type is changed.
function defaultConfigFor(widgetType) {
  switch (widgetType) {
    case 'photo':
      return { url: '', caption: '' };
    case 'photoSlideshow':
      return { images: [], autoplayMs: 4000 };
    case 'userForm':
      return { title: '', submitLabel: 'Submit', fields: [{ key: 'email', label: 'Email', type: 'email', required: true }] };
    case 'wheelInfographic':
      return { centerLabel: 'Overview', nodes: [] };
    case 'text':
    default:
      return { icon: '', title: '', body: '' };
  }
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

const iconBtnStyle = (disabled) => ({
  background: 'none',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  color: disabled ? 'rgba(255,255,255,0.2)' : 'var(--sb-teal-deep)',
  cursor: disabled ? 'default' : 'pointer',
  fontSize: '0.68rem',
  padding: '3px 7px',
});

const smallLabel = { ...styles.fieldLabel, fontSize: '0.6rem', marginBottom: '0.3rem' };

// Bespoke editor for a flexColumns section's `flexCols` array — not
// makeListEditor, since each column can be a different widget type with a
// different config shape (that factory assumes a uniform item shape).
export default function FlexColumnsEditor({ cols: raw, onChange }) {
  const cols = Array.isArray(raw) ? raw : [];
  const [openIdx, setOpenIdx] = React.useState(null);

  function patchCol(i, patch) {
    onChange(cols.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function patchConfig(i, patch) {
    onChange(cols.map((c, idx) => (idx === i ? { ...c, config: { ...c.config, ...patch } } : c)));
  }
  function addCol() {
    onChange([...cols, { id: newId(), widgetType: 'text', config: defaultConfigFor('text') }]);
    setOpenIdx(cols.length);
  }
  function removeCol(i) {
    onChange(cols.filter((_, idx) => idx !== i));
    if (openIdx === i) setOpenIdx(null);
  }
  function moveCol(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= cols.length) return;
    const next = [...cols];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function changeWidgetType(i, widgetType) {
    patchCol(i, { widgetType, config: defaultConfigFor(widgetType) });
  }

  return (
    <div style={styles.fieldGroup}>
      <label style={styles.fieldLabel}>Columns ({cols.length})</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {cols.map((col, i) => {
          const widgetLabel = WIDGET_TYPES.find((w) => w.type === col.widgetType)?.label || col.widgetType;
          const open = openIdx === i;
          return (
            <div key={col.id} style={{ border: `0.5px solid ${open ? 'rgba(196,132,58,0.5)' : 'rgba(196,132,58,0.20)'}`, borderRadius: 'var(--sb-radius)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', cursor: 'pointer', background: open ? 'rgba(196,132,58,0.07)' : 'transparent' }}
                onClick={() => setOpenIdx(open ? null : i)}
              >
                <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
                  Column {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--sb-sage)' }}>{widgetLabel}</span>
                <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => moveCol(i, -1)} disabled={i === 0} style={iconBtnStyle(i === 0)}>↑</button>
                  <button type="button" onClick={() => moveCol(i, 1)} disabled={i === cols.length - 1} style={iconBtnStyle(i === cols.length - 1)}>↓</button>
                  <button type="button" onClick={() => removeCol(i)} style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)' }}>×</button>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)' }}>{open ? '▲' : '▼'}</span>
              </div>
              {open && (
                <div style={{ padding: '0.75rem', borderTop: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <label style={smallLabel}>Widget Type</label>
                    <select className="sb-input" style={{ fontSize: '0.78rem' }} value={col.widgetType} onChange={(e) => changeWidgetType(i, e.target.value)}>
                      {WIDGET_TYPES.map((w) => <option key={w.type} value={w.type}>{w.label}</option>)}
                    </select>
                  </div>

                  {col.widgetType === 'text' && (
                    <TextConfig config={col.config} onChange={(patch) => patchConfig(i, patch)} />
                  )}
                  {col.widgetType === 'photo' && (
                    <PhotoConfig config={col.config} onChange={(patch) => patchConfig(i, patch)} />
                  )}
                  {col.widgetType === 'photoSlideshow' && (
                    <SlideshowConfig config={col.config} onChange={(patch) => patchConfig(i, patch)} />
                  )}
                  {col.widgetType === 'userForm' && (
                    <FormConfig config={col.config} onChange={(patch) => patchConfig(i, patch)} />
                  )}
                  {col.widgetType === 'wheelInfographic' && (
                    <WheelConfig config={col.config} onChange={(patch) => patchConfig(i, patch)} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={addCol}
        style={{ marginTop: '0.6rem', fontSize: '0.72rem', padding: '4px 12px', borderRadius: 4, border: '1px dashed var(--sb-sage)', background: 'transparent', color: 'var(--sb-sage)', cursor: 'pointer' }}
      >
        + Add Column
      </button>
    </div>
  );
}

function TextConfig({ config, onChange }) {
  const c = config || {};
  return (
    <>
      <input className="sb-input" style={{ fontSize: '0.78rem' }} placeholder="◆ Icon or emoji" value={c.icon || ''} onChange={(e) => onChange({ icon: e.target.value })} />
      <input className="sb-input" style={{ fontSize: '0.78rem' }} placeholder="Title" value={c.title || ''} onChange={(e) => onChange({ title: e.target.value })} />
      <textarea className="sb-input sb-textarea" placeholder="Body text" value={c.body || ''} onChange={(e) => onChange({ body: e.target.value })} />
    </>
  );
}

function PhotoConfig({ config, onChange }) {
  const c = config || {};
  return (
    <>
      <ImageUploadField value={c.url || ''} onChange={(url) => onChange({ url })} />
      <input className="sb-input" style={{ fontSize: '0.78rem' }} placeholder="Caption (optional)" value={c.caption || ''} onChange={(e) => onChange({ caption: e.target.value })} />
    </>
  );
}

function SlideshowConfig({ config, onChange }) {
  const c = config || {};
  const images = Array.isArray(c.images) ? c.images : [];
  function update(i, patch) {
    onChange({ images: images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)) });
  }
  function add() {
    onChange({ images: [...images, { url: '', caption: '' }] });
  }
  function remove(i) {
    onChange({ images: images.filter((_, idx) => idx !== i) });
  }
  return (
    <>
      <div>
        <label style={smallLabel}>Autoplay interval (ms)</label>
        <input
          type="number"
          className="sb-input"
          style={{ fontSize: '0.78rem', maxWidth: 140 }}
          value={c.autoplayMs ?? 4000}
          onChange={(e) => onChange({ autoplayMs: Number(e.target.value) || 4000 })}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {images.map((img, i) => (
          <div key={i} style={{ border: '0.5px solid rgba(196,132,58,0.15)', borderRadius: 'var(--sb-radius)', padding: '0.5rem' }}>
            <ImageUploadField value={img.url || ''} onChange={(url) => update(i, { url })} />
            <input
              className="sb-input"
              style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}
              placeholder="Caption (optional)"
              value={img.caption || ''}
              onChange={(e) => update(i, { caption: e.target.value })}
            />
            <button type="button" onClick={() => remove(i)} style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)', marginTop: '0.4rem' }}>Remove image</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 4, border: '1px dashed var(--sb-sage)', background: 'transparent', color: 'var(--sb-sage)', cursor: 'pointer', alignSelf: 'flex-start' }}>
        + Add image
      </button>
    </>
  );
}

const FIELD_TYPE_OPTS = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Long Text' },
];

export function FormConfig({ config, onChange }) {
  const c = config || {};
  const fields = Array.isArray(c.fields) ? c.fields : [];
  function update(i, patch) {
    onChange({ fields: fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });
  }
  function add() {
    onChange({ fields: [...fields, { key: `field_${newId()}`, label: '', type: 'text', required: false }] });
  }
  function remove(i) {
    onChange({ fields: fields.filter((_, idx) => idx !== i) });
  }
  const hasEmail = fields.some((f) => f.key === 'email');
  return (
    <>
      <input className="sb-input" style={{ fontSize: '0.78rem' }} placeholder="Form title (optional)" value={c.title || ''} onChange={(e) => onChange({ title: e.target.value })} />
      <input className="sb-input" style={{ fontSize: '0.78rem' }} placeholder="Submit button label" value={c.submitLabel || ''} onChange={(e) => onChange({ submitLabel: e.target.value })} />
      {!hasEmail && (
        <div style={{ fontSize: '0.7rem', color: 'var(--sb-risk-critical)', lineHeight: 1.5 }}>
          This form needs a field with key "email" to accept submissions.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {fields.map((f, i) => (
          <div key={i} style={{ border: '0.5px solid rgba(196,132,58,0.15)', borderRadius: 'var(--sb-radius)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <input className="sb-input" style={{ fontSize: '0.72rem' }} placeholder="Label" value={f.label} onChange={(e) => update(i, { label: e.target.value })} />
              <input className="sb-input" style={{ fontSize: '0.72rem' }} placeholder="key (e.g. email, company)" value={f.key} onChange={(e) => update(i, { key: e.target.value.replace(/\s/g, '_') })} />
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <select className="sb-input" style={{ fontSize: '0.72rem', flex: 1 }} value={f.type} onChange={(e) => update(i, { type: e.target.value })}>
                {FIELD_TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--sb-dusty)', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={!!f.required} onChange={(e) => update(i, { required: e.target.checked })} />
                Required
              </label>
              <button type="button" onClick={() => remove(i)} style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)' }}>×</button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 4, border: '1px dashed var(--sb-sage)', background: 'transparent', color: 'var(--sb-sage)', cursor: 'pointer', alignSelf: 'flex-start' }}>
        + Add field
      </button>
    </>
  );
}

function WheelConfig({ config, onChange }) {
  const c = config || {};
  return (
    <>
      <input className="sb-input" style={{ fontSize: '0.78rem' }} placeholder="Center label" value={c.centerLabel || ''} onChange={(e) => onChange({ centerLabel: e.target.value })} />
      <WheelNodesEditor nodes={c.nodes} onChange={(nodes) => onChange({ nodes })} />
    </>
  );
}

// Reused by both the wheelInfographic column widget (above) and the legacy
// standalone industryWheel section's `wheelNodes` field (wired in
// EditorPane.jsx) — one node editor, two callers.
export function WheelNodesEditor({ nodes: raw, onChange }) {
  const nodes = Array.isArray(raw) ? raw : [];
  function update(i, patch) {
    onChange(nodes.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));
  }
  function add() {
    onChange([...nodes, { id: newId(), label: '', icon: '◆', photoUrl: '', expandText: '' }]);
  }
  function remove(i) {
    onChange(nodes.filter((_, idx) => idx !== i));
  }
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {nodes.map((n, i) => (
          <div key={n.id} style={{ border: '0.5px solid rgba(196,132,58,0.15)', borderRadius: 'var(--sb-radius)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <input className="sb-input" style={{ fontSize: '0.72rem' }} placeholder="Label" value={n.label} onChange={(e) => update(i, { label: e.target.value })} />
              <input className="sb-input" style={{ fontSize: '0.72rem' }} placeholder="◆ Icon (used if no photo)" value={n.icon || ''} onChange={(e) => update(i, { icon: e.target.value })} />
            </div>
            <ImageUploadField value={n.photoUrl || ''} onChange={(url) => update(i, { photoUrl: url })} />
            <textarea className="sb-input sb-textarea" placeholder="Expanded detail text" value={n.expandText || ''} onChange={(e) => update(i, { expandText: e.target.value })} />
            <button type="button" onClick={() => remove(i)} style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)', alignSelf: 'flex-start' }}>Remove node</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 4, border: '1px dashed var(--sb-sage)', background: 'transparent', color: 'var(--sb-sage)', cursor: 'pointer', alignSelf: 'flex-start' }}>
        + Add node
      </button>
    </>
  );
}
