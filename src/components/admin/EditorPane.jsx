import React from 'react';
import { styles } from './adminStyles.js';
import { SOURCE_TYPES, TAG_CATEGORIES, MERGED_FIELD_DEFAULTS } from '../../data/capabilityTags.js';

// ── Field source-type badge + inline meta editor ──────────────────────────────

const SRC_BADGE_BASE = {
  display: 'inline-block',
  fontSize: '0.6rem',
  fontFamily: 'var(--sb-font-label)',
  letterSpacing: '0.05em',
  padding: '1px 5px',
  borderRadius: 3,
  cursor: 'pointer',
  userSelect: 'none',
  marginLeft: 6,
  verticalAlign: 'middle',
  border: '1px solid transparent',
};

function SourceBadge({ type, onClick }) {
  const def = SOURCE_TYPES[type] || SOURCE_TYPES.user_input;
  return (
    <span
      style={{ ...SRC_BADGE_BASE, background: def.color + '22', color: def.color, borderColor: def.color + '55' }}
      title={`Source: ${def.label} — click to edit`}
      onClick={onClick}
    >
      {def.short}
    </span>
  );
}

const FIELD_TYPES = [
  { value: 'text',        label: 'Text' },
  { value: 'textarea',    label: 'Long Text' },
  { value: 'number',      label: 'Number' },
  { value: 'date',        label: 'Date' },
  { value: 'boolean',     label: 'Boolean (on/off)' },
  { value: 'select',      label: 'Select (one)' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'url',         label: 'URL' },
  { value: 'email',       label: 'Email' },
  { value: 'json',        label: 'JSON / Array' },
  { value: 'image',       label: 'Image URL' },
  { value: 'color',       label: 'Color' },
  { value: 'richtext',    label: 'Rich Text' },
];

function FieldMetaEditor({ fieldKey, meta, onSave, onClose, memberDbs = [] }) {
  // ── existing source type state ──
  const [activeTab, setActiveTab] = React.useState('settings');
  const [type, setType] = React.useState(meta?.sourceType || 'user_input');
  const [mergedFrom, setMergedFrom] = React.useState(meta?.mergedFrom || '');
  const [sources, setSources] = React.useState(meta?.sources || []);

  // ── new field settings state ──
  const [visible, setVisible] = React.useState(meta?.visible !== false);
  const [auditable, setAuditable] = React.useState(meta?.auditable || false);
  const [fieldType, setFieldType] = React.useState(meta?.fieldType || 'text');
  const [multiSelect, setMultiSelect] = React.useState(meta?.multiSelect || false);
  const [description, setDescription] = React.useState(meta?.description || '');

  // valueSet: [{value, label}]
  const [valueSet, setValueSet] = React.useState(
    Array.isArray(meta?.valueSet) ? meta.valueSet : []
  );
  const [newOptVal, setNewOptVal] = React.useState('');
  const [newOptLabel, setNewOptLabel] = React.useState('');

  // cascades: [{triggerField, triggerValue, targetField, filterValues: []}]
  const [cascades, setCascades] = React.useState(
    Array.isArray(meta?.cascades) ? meta.cascades : []
  );

  function addSource() {
    setSources((s) => [...s, { sourceKind: 'merged', system: 'saltbasin', capabilityTag: '', description: '' }]);
  }
  function removeSource(i) {
    setSources((s) => s.filter((_, idx) => idx !== i));
  }
  function patchSource(i, patch) {
    setSources((s) => s.map((src, idx) => idx === i ? { ...src, ...patch } : src));
  }

  function addOption() {
    if (!newOptVal.trim()) return;
    setValueSet((vs) => [...vs, { value: newOptVal.trim(), label: newOptLabel.trim() || newOptVal.trim() }]);
    setNewOptVal(''); setNewOptLabel('');
  }
  function removeOption(i) {
    setValueSet((vs) => vs.filter((_, idx) => idx !== i));
  }

  function addCascade() {
    setCascades((c) => [...c, { triggerField: '', triggerValue: '', targetField: '', filterValues: [] }]);
  }
  function patchCascade(i, patch) {
    setCascades((c) => c.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }
  function removeCascade(i) {
    setCascades((c) => c.filter((_, idx) => idx !== i));
  }

  function save() {
    const payload = {
      sourceType: type,
      visible,
      auditable,
      fieldType,
      description,
    };
    if (type === 'merged') payload.mergedFrom = mergedFrom;
    if (type === 'derived') payload.sources = sources;
    if (['select', 'multiselect'].includes(fieldType)) {
      payload.valueSet = valueSet;
      payload.multiSelect = fieldType === 'multiselect' || multiSelect;
    }
    if (cascades.length) payload.cascades = cascades;
    onSave(payload);
  }

  const panelStyle = {
    background: '#f5f2ed',
    border: '1px solid #d4cdc6',
    borderRadius: 6,
    padding: '0.75rem',
    marginTop: '0.4rem',
    fontSize: '0.78rem',
  };
  const tabBtn = (id) => ({
    padding: '3px 12px', borderRadius: '4px 4px 0 0', border: '1px solid #d4cdc6',
    borderBottom: activeTab === id ? '1px solid #f5f2ed' : '1px solid #d4cdc6',
    background: activeTab === id ? '#f5f2ed' : '#ece8e2',
    cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--sb-font-label)',
    color: activeTab === id ? 'var(--sb-navy)' : '#888', marginRight: 2,
  });
  const lbl = { display: 'block', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: 3, fontFamily: 'var(--sb-font-label)' };
  const tog = (on) => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer',
    padding: '3px 10px', borderRadius: 12,
    background: on ? '#24bb7f22' : 'rgba(0,0,0,0.06)',
    border: `1px solid ${on ? '#24bb7f55' : 'rgba(0,0,0,0.12)'}`,
    color: on ? '#1a7a4f' : '#888', fontSize: '0.72rem', userSelect: 'none',
  });

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--sb-teal-deep)' }}>
        <span>Field Settings — {humanLabel(fieldKey)}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--sb-dusty)' }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 0 }}>
        {['settings', 'source', 'cascade'].map((t) => (
          <button key={t} style={tabBtn(t)} onClick={() => setActiveTab(t)}>
            {t === 'settings' ? '⚙ Settings' : t === 'source' ? '⇌ Source' : '⇒ Cascade'}
          </button>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #d4cdc6', marginBottom: '0.75rem' }} />

      {/* ── Settings tab ── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Visible + Auditable toggles */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={tog(visible)} onClick={() => setVisible((v) => !v)}>
              {visible ? '👁 Visible' : '🚫 Hidden'}
            </span>
            <span style={tog(auditable)} onClick={() => setAuditable((a) => !a)}>
              {auditable ? '📋 Auditable' : '○ Not audited'}
            </span>
          </div>
          {auditable && (
            <div style={{ fontSize: '0.68rem', color: '#888', lineHeight: 1.5, padding: '0.35rem 0.5rem', background: 'rgba(0,0,0,0.04)', borderRadius: 5 }}>
              Every edit to this field will be logged in the audit history with before/after values.
            </div>
          )}

          {/* Field type */}
          <div>
            <label style={lbl}>Field Type</label>
            <select className="sb-input" style={{ fontSize: '0.75rem' }} value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
              {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
            </select>
          </div>

          {/* Multi-select flag (for text/other non-select types used as multi-value) */}
          {!['select', 'multiselect'].includes(fieldType) && (
            <div>
              <span style={tog(multiSelect)} onClick={() => setMultiSelect((m) => !m)}>
                {multiSelect ? '☑ Multi-value allowed' : '☐ Single value only'}
              </span>
            </div>
          )}

          {/* Value set (for select / multiselect) */}
          {['select', 'multiselect'].includes(fieldType) && (
            <div>
              <label style={lbl}>Predefined Options</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.4rem' }}>
                {valueSet.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input className="sb-input" style={{ fontSize: '0.72rem', flex: 1 }} value={opt.value} onChange={(e) => setValueSet((vs) => vs.map((o, j) => j === i ? { ...o, value: e.target.value } : o))} placeholder="value" />
                    <input className="sb-input" style={{ fontSize: '0.72rem', flex: 1 }} value={opt.label} onChange={(e) => setValueSet((vs) => vs.map((o, j) => j === i ? { ...o, label: e.target.value } : o))} placeholder="label (display)" />
                    <button onClick={() => removeOption(i)} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 3, cursor: 'pointer', padding: '2px 7px', fontSize: '0.68rem', color: '#888' }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input className="sb-input" style={{ fontSize: '0.72rem', flex: 1 }} value={newOptVal} onChange={(e) => setNewOptVal(e.target.value)} placeholder="value" onKeyDown={(e) => e.key === 'Enter' && addOption()} />
                <input className="sb-input" style={{ fontSize: '0.72rem', flex: 1 }} value={newOptLabel} onChange={(e) => setNewOptLabel(e.target.value)} placeholder="label" onKeyDown={(e) => e.key === 'Enter' && addOption()} />
                <button onClick={addOption} style={{ padding: '3px 10px', borderRadius: 4, border: '1px dashed var(--sb-sage)', background: 'transparent', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--sb-sage)', whiteSpace: 'nowrap' }}>+ Add</button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label style={lbl}>Description / hint</label>
            <input className="sb-input" style={{ fontSize: '0.75rem' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain what this field is for…" />
          </div>
        </div>
      )}

      {/* ── Source tab ── */}
      {activeTab === 'source' && (
        <div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            {Object.entries(SOURCE_TYPES).map(([k, def]) => (
              <button key={k} onClick={() => setType(k)} style={{
                padding: '3px 10px', borderRadius: 4, border: `1px solid ${def.color}`,
                background: type === k ? def.color : 'transparent',
                color: type === k ? '#fff' : def.color,
                fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)',
              }}>
                {def.label}
              </button>
            ))}
          </div>
          <div style={{ color: 'var(--sb-dusty)', fontSize: '0.7rem', lineHeight: 1.5, marginBottom: '0.6rem' }}>
            {SOURCE_TYPES[type]?.description}
          </div>

          {type === 'merged' && (
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 3 }}>Merged from (system path)</label>
              <input className="sb-input" style={{ fontSize: '0.75rem' }} value={mergedFrom} onChange={(e) => setMergedFrom(e.target.value)} placeholder="e.g. users.display_name" />
            </div>
          )}

          {type === 'derived' && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>Sources</div>
              {sources.map((src, i) => (
                <div key={i} style={{ background: '#ede9e3', borderRadius: 5, padding: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <div>
                      <label style={{ fontSize: '0.68rem', display: 'block', marginBottom: 2 }}>Kind</label>
                      <select className="sb-input" style={{ fontSize: '0.72rem' }} value={src.sourceKind} onChange={(e) => patchSource(i, { sourceKind: e.target.value })}>
                        <option value="merged">Merged (Salt Basin internal)</option>
                        <option value="external">External (member DB / file)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', display: 'block', marginBottom: 2 }}>System</label>
                      <select className="sb-input" style={{ fontSize: '0.72rem' }} value={src.system} onChange={(e) => patchSource(i, { system: e.target.value })}>
                        <option value="saltbasin">Salt Basin</option>
                        {memberDbs.map((db) => <option key={db.id} value={db.id}>{db.name || db.id}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.68rem', display: 'block', marginBottom: 2 }}>Capability tag</label>
                    <select className="sb-input" style={{ fontSize: '0.72rem' }} value={src.capabilityTag} onChange={(e) => patchSource(i, { capabilityTag: e.target.value })}>
                      <option value="">— none —</option>
                      {TAG_CATEGORIES.map((cat) => (
                        <optgroup key={cat.id} label={cat.label}>
                          {cat.tags.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.68rem', display: 'block', marginBottom: 2 }}>Description / field path</label>
                      <input className="sb-input" style={{ fontSize: '0.72rem' }} value={src.description} onChange={(e) => patchSource(i, { description: e.target.value })} placeholder="e.g. revenue column from deals table" />
                    </div>
                    <button onClick={() => removeSource(i)} style={{ background: 'none', border: '1px solid #bbb', borderRadius: 4, cursor: 'pointer', padding: '3px 8px', fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>Remove</button>
                  </div>
                </div>
              ))}
              <button onClick={addSource} style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 4, border: '1px dashed var(--sb-sage)', background: 'transparent', cursor: 'pointer', color: 'var(--sb-sage)' }}>
                + Add source
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Cascade tab ── */}
      {activeTab === 'cascade' && (
        <div>
          <div style={{ fontSize: '0.68rem', color: '#888', lineHeight: 1.55, marginBottom: '0.6rem' }}>
            Define rules so that when a field has a particular value, the allowed options for another field are filtered. Useful for dependent dropdowns.
          </div>
          {cascades.map((rule, i) => (
            <div key={i} style={{ background: '#ede9e3', borderRadius: 5, padding: '0.6rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <div>
                  <label style={{ ...lbl }}>When field</label>
                  <input className="sb-input" style={{ fontSize: '0.72rem' }} value={rule.triggerField} onChange={(e) => patchCascade(i, { triggerField: e.target.value })} placeholder="e.g. industry" />
                </div>
                <div>
                  <label style={{ ...lbl }}>equals value</label>
                  <input className="sb-input" style={{ fontSize: '0.72rem' }} value={rule.triggerValue} onChange={(e) => patchCascade(i, { triggerValue: e.target.value })} placeholder="e.g. healthcare" />
                </div>
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                <label style={{ ...lbl }}>Then filter THIS field's options to (comma-separated values)</label>
                <input className="sb-input" style={{ fontSize: '0.72rem' }} value={(rule.filterValues || []).join(', ')} onChange={(e) => patchCascade(i, { filterValues: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} placeholder="e.g. billing,compliance,ehr" />
              </div>
              <button onClick={() => removeCascade(i)} style={{ fontSize: '0.68rem', padding: '2px 8px', border: '1px solid #bbb', borderRadius: 3, background: 'transparent', cursor: 'pointer', color: '#888' }}>Remove rule</button>
            </div>
          ))}
          <button onClick={addCascade} style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 4, border: '1px dashed var(--sb-sage)', background: 'transparent', cursor: 'pointer', color: 'var(--sb-sage)' }}>
            + Add cascade rule
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ fontSize: '0.72rem', padding: '4px 12px', borderRadius: 4, border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
        <button onClick={save} style={{ fontSize: '0.72rem', padding: '4px 12px', borderRadius: 4, border: 'none', background: 'var(--sb-sage)', color: '#fff', cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { val: 'live', label: '● Live', desc: 'Visible to visitors.' },
  { val: 'draft', label: '◐ Draft', desc: 'Hidden from visitors.' },
  { val: 'soon', label: '◌ Soon', desc: 'Visitors see a Coming Soon placeholder.' },
];

const BG_OPTS = ['ivory', 'navy', 'linen', 'teal', 'cream'];

const LONG_KEYS = ['concept', 'intro', 'p1', 'p2', 'p3', 'howIWork', 'aiBadge', 'desc', 'persona', 'aboutBio', 'subhead'];

function humanLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase());
}

export default function EditorPane({ section, page, site, onUpdateSection, onUpdatePageStatus, onUpdatePage }) {
  // All hooks must be declared before any early returns.
  const navGroups = React.useMemo(() => {
    if (!site?.pages) return [];
    return [...new Set(Object.values(site.pages).map((p) => p.navGroup).filter(Boolean))];
  }, [site]);

  const [openMetaKey, setOpenMetaKey] = React.useState(null);
  const [addFieldKey, setAddFieldKey] = React.useState('');
  const [showAddField, setShowAddField] = React.useState(false);

  const memberDbs = site?.config?.integrations?.memberDbs || [];

  const knownMerged = React.useMemo(() => {
    return MERGED_FIELD_DEFAULTS.filter((m) => m.blockType === section?.type);
  }, [section?.type]);

  if (!section) {
    if (!page) {
      return (
        <div style={styles.editorPane}>
          <div style={styles.editorHeader}>
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
              Page Settings
            </div>
          </div>
          <div style={styles.editorBody}>
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--sb-teal-deep)' }}>
              Select a page to view its settings.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.editorPane}>
        <div style={styles.editorHeader}>
          <div>
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
              Page Settings
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)' }}>
              /{page.slug || '(home)'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_OPTS.map((o) => (
              <button key={o.val} onClick={() => onUpdatePageStatus(o.val)} title={o.desc} style={statusBtnStyle(page.status === o.val)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.editorBody}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Page Identity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Page Name</label>
                <input className="sb-input" value={page.name || ''} onChange={(e) => onUpdatePage?.({ name: e.target.value })} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>URL Slug</label>
                <input className="sb-input" value={page.slug || ''} placeholder="leave blank for home" onChange={(e) => onUpdatePage?.({ slug: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Navigation</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
              By default this page appears in the nav using its page name. Use Nav Label to override the display text. Use Nav Group to nest it under a dropdown category — type a group name or pick an existing one.
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Nav Label (blank = use page name)</label>
              <input className="sb-input" value={page.navLabel || ''} placeholder={page.name || ''} onChange={(e) => onUpdatePage?.({ navLabel: e.target.value })} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Nav Group (blank = top-level link)</label>
              <input
                className="sb-input"
                list="nav-groups-list"
                value={page.navGroup || ''}
                placeholder="e.g. Work, Resources…"
                onChange={(e) => onUpdatePage?.({ navGroup: e.target.value })}
              />
              <datalist id="nav-groups-list">
                {navGroups.map((g) => <option key={g} value={g} />)}
              </datalist>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                checked={!!page.hideFromNav}
                onChange={(e) => onUpdatePage?.({ hideFromNav: e.target.checked })}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--sb-sage)' }}>Hide from navigation</span>
            </label>
          </div>

          <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: 'var(--sb-dusty)', lineHeight: 1.6 }}>
            Click a section in the sidebar to edit its content.
          </div>
        </div>
      </div>
    );
  }

  function patchField(key, value) {
    // Fire-and-forget audit log for auditable fields
    const meta = section.fieldMeta?.[key];
    if (meta?.auditable) {
      fetch('/api/field-audit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: section.id,
          fieldKey: key,
          before: section.fields?.[key] ?? null,
          after: value,
        }),
      }).catch(() => {/* non-fatal */});
    }
    onUpdateSection({ fields: { ...section.fields, [key]: value } });
  }
  function patchTop(key, value) {
    onUpdateSection({ [key]: value });
  }
  function updateFieldMeta(key, meta) {
    onUpdateSection({ fieldMeta: { ...(section.fieldMeta || {}), [key]: meta } });
  }
  function addField(newKey) {
    if (!newKey || section.fields?.[newKey] !== undefined) return;
    onUpdateSection({ fields: { ...section.fields, [newKey]: '' } });
  }
  function cloneField(key) {
    const suffix = `${key}_copy`;
    let finalKey = suffix;
    let i = 2;
    while (section.fields?.[finalKey] !== undefined) { finalKey = `${suffix}${i++}`; }
    onUpdateSection({
      fields: { ...section.fields, [finalKey]: section.fields[key] },
      fieldMeta: { ...(section.fieldMeta || {}), [finalKey]: { ...(section.fieldMeta?.[key] || {}) } },
    });
  }
  function removeField(key) {
    const newFields = { ...section.fields };
    const newMeta = { ...(section.fieldMeta || {}) };
    delete newFields[key];
    delete newMeta[key];
    onUpdateSection({ fields: newFields, fieldMeta: newMeta });
  }

  return (
    <div style={styles.editorPane}>
      <div style={styles.editorHeader}>
        <div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
            Editing: {section.name}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)' }}>
            /{page?.slug || ''} → {section.name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_OPTS.map((o) => (
            <button
              key={o.val}
              onClick={() => patchTop('status', o.val)}
              title={o.desc}
              style={statusBtnStyle(section.status === o.val)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.editorBody}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Section Settings</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Section Name</label>
              <input
                className="sb-input"
                value={section.name || ''}
                onChange={(e) => patchTop('name', e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Background</label>
              <select
                className="sb-input"
                value={section.bg || 'ivory'}
                onChange={(e) => patchTop('bg', e.target.value)}
              >
                {BG_OPTS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Type (read-only in Phase 1)</label>
            <input className="sb-input" value={section.type} disabled />
          </div>
        </div>

        {/* ── Section Actions / Buttons card ─────────────────────────── */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Action Buttons</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            Buttons that appear at the bottom of this section. Each button has a label, link, and style.
          </div>
          <SectionActionsEditor
            actions={Array.isArray(section.fields?.actions) ? section.fields.actions : []}
            onChange={(next) => patchField('actions', next)}
            site={site}
          />
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Content Fields</div>
          {section.status === 'soon' && (
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Coming Soon message (shown to visitors)</label>
              <input
                className="sb-input"
                value={section.fields?.soonMsg || ''}
                onChange={(e) => patchField('soonMsg', e.target.value)}
                placeholder="Coming Soon — check back shortly!"
              />
            </div>
          )}
          {Object.entries(section.fields || {})
            .filter(([k]) => k !== 'soonMsg')
            // Hide legacy fixed-slot fields when the equivalent dynamic array
            // is in use — otherwise the editor would show the dynamic list
            // editor AND the redundant single-string fields below it.
            //   roles  → role1/role1Desc … role6
            //   domains → d1Title/d1Desc … d8
            //   cards   → card1Title/card1Desc/card1Icon … card4
            .filter(([k]) => {
              if (Array.isArray(section.fields?.roles) && section.fields.roles.length > 0
                  && /^role\d+(Desc)?$/i.test(k)) return false;
              if (Array.isArray(section.fields?.domains) && section.fields.domains.length > 0
                  && /^d\d+(Title|Desc)$/i.test(k)) return false;
              if (Array.isArray(section.fields?.cards) && section.fields.cards.length > 0
                  && /^card\d+(Title|Desc|Icon)$/i.test(k)) return false;
              return true;
            })
            .map(([k, v]) => {
              // Dynamic list editors for array-typed fields.
              if (Array.isArray(v) && k === 'roles') {
                return <RoleListEditor key={k} roles={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'domains') {
                return <DomainListEditor key={k} domains={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'cards') {
                return <CardListEditor key={k} cards={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'cases') {
                return <CaseListEditor key={k} cases={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'stats') {
                return <StatListEditor key={k} stats={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'steps') {
                return <StepListEditor key={k} steps={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'cols') {
                return <ColListEditor key={k} cols={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'items') {
                return <IconItemListEditor key={k} items={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'skills') {
                return <SkillsListEditor key={k} skills={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'clients') {
                return <ClientSnapshotListEditor key={k} clients={v} onChange={(next) => patchField(k, next)} />;
              }
              if (Array.isArray(v) && k === 'actions') {
                return <SectionActionsEditor key={k} actions={v} onChange={(next) => patchField(k, next)} site={site} />;
              }
              const knownMergeDefault = knownMerged.find((m) => m.fieldKey === k);
              const effectiveMeta = section.fieldMeta?.[k] || (knownMergeDefault
                ? { sourceType: 'merged', mergedFrom: knownMergeDefault.mergedFrom }
                : { sourceType: 'user_input' });
              const srcType = effectiveMeta.sourceType;

              const isHidden = effectiveMeta.visible === false;
              const isAudited = !!effectiveMeta.auditable;

              const fieldLabel = (
                <label style={{ ...styles.fieldLabel, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                  <span style={{ flex: 1, opacity: isHidden ? 0.4 : 1 }}>
                    {humanLabel(k)}
                    {isHidden && <span style={{ fontSize: '0.6rem', color: '#aaa', marginLeft: 4 }}>(hidden)</span>}
                    {isAudited && <span style={{ fontSize: '0.6rem', color: 'var(--sb-teal-deep)', marginLeft: 4 }} title="Audited field">📋</span>}
                  </span>
                  <span style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    <SourceBadge type={srcType} onClick={() => setOpenMetaKey(openMetaKey === k ? null : k)} />
                    <span
                      title="Clone field"
                      onClick={() => cloneField(k)}
                      style={{ fontSize: '0.6rem', cursor: 'pointer', padding: '1px 5px', border: '1px solid #ccc', borderRadius: 3, color: '#888', userSelect: 'none' }}
                    >⧉</span>
                    <span
                      title="Remove field"
                      onClick={() => { if (window.confirm(`Remove field "${k}"?`)) removeField(k); }}
                      style={{ fontSize: '0.6rem', cursor: 'pointer', padding: '1px 5px', border: '1px solid #f9a29a', borderRadius: 3, color: '#c04040', userSelect: 'none' }}
                    >✕</span>
                  </span>
                </label>
              );

              if (isImageField(k)) {
                return (
                  <div key={k} style={styles.fieldGroup}>
                    {fieldLabel}
                    {openMetaKey === k && (
                      <FieldMetaEditor fieldKey={k} meta={effectiveMeta} memberDbs={memberDbs}
                        onSave={(m) => { updateFieldMeta(k, m); setOpenMetaKey(null); }}
                        onClose={() => setOpenMetaKey(null)} />
                    )}
                    <ImageUploadField value={v || ''} onChange={(url) => patchField(k, url)} />
                  </div>
                );
              }
              // Date-shaped fields (e.g. role1Start, role2EndDate) get a
              // native calendar picker. Heuristic matches common naming.
              const dateMatch = /(start|end|date|since|until|from|thru)(date)?$/i;
              const isDate = dateMatch.test(k);
              if (isDate) {
                // Normalize incoming value to YYYY-MM-DD if it parses; if not,
                // show empty so the user can pick fresh.
                const safe = toIsoDate(v);
                return (
                  <div key={k} style={styles.fieldGroup}>
                    {fieldLabel}
                    {openMetaKey === k && (
                      <FieldMetaEditor fieldKey={k} meta={effectiveMeta} memberDbs={memberDbs}
                        onSave={(m) => { updateFieldMeta(k, m); setOpenMetaKey(null); }}
                        onClose={() => setOpenMetaKey(null)} />
                    )}
                    <input
                      type="date"
                      className="sb-input"
                      value={safe}
                      onChange={(e) => patchField(k, e.target.value)}
                    />
                  </div>
                );
              }
              const isLong =
                LONG_KEYS.some((x) => k.toLowerCase().includes(x.toLowerCase())) ||
                (typeof v === 'string' && v.length > 90);
              return (
                <div key={k} style={styles.fieldGroup}>
                  {fieldLabel}
                  {openMetaKey === k && (
                    <FieldMetaEditor fieldKey={k} meta={effectiveMeta} memberDbs={memberDbs}
                      onSave={(m) => { updateFieldMeta(k, m); setOpenMetaKey(null); }}
                      onClose={() => setOpenMetaKey(null)} />
                  )}
                  {isLong ? (
                    <textarea
                      className="sb-input sb-textarea"
                      value={v || ''}
                      onChange={(e) => patchField(k, e.target.value)}
                    />
                  ) : (
                    <input
                      className="sb-input"
                      value={v || ''}
                      onChange={(e) => patchField(k, e.target.value)}
                    />
                  )}
                </div>
              );
            })}

          {/* ── Add Media (photo) ── */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
            <div style={styles.fieldLabel}>Media / Photo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Existing photo fields */}
              {Object.entries(section.fields || {}).filter(([k]) => /photo|image|media|Photo|Image/i.test(k) && typeof section.fields[k] === 'string').map(([k, v]) => (
                <div key={k} style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>{humanLabel(k)}</label>
                  <ImageUploadField value={v || ''} onChange={(url) => patchField(k, url)} />
                </div>
              ))}
              {/* Add new photo field */}
              <button
                onClick={() => { const key = `photoUrl_${Date.now()}`; patchField(key, ''); }}
                style={{ fontSize: '0.72rem', padding: '4px 14px', borderRadius: 6, border: '1px dashed rgba(0,0,0,0.2)', background: 'transparent', cursor: 'pointer', color: '#888', alignSelf: 'flex-start', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }}
              >
                + Add photo field
              </button>
            </div>
          </div>

          {/* ── Add Field UI ── */}
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
            {showAddField ? (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  className="sb-input"
                  style={{ fontSize: '0.78rem', flex: 1 }}
                  value={addFieldKey}
                  onChange={(e) => setAddFieldKey(e.target.value.replace(/\s/g, '_'))}
                  placeholder="fieldKey (camelCase or snake_case)"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { addField(addFieldKey); setAddFieldKey(''); setShowAddField(false); }
                    if (e.key === 'Escape') { setShowAddField(false); setAddFieldKey(''); }
                  }}
                />
                <button
                  onClick={() => { addField(addFieldKey); setAddFieldKey(''); setShowAddField(false); }}
                  style={{ padding: '4px 12px', borderRadius: 4, border: 'none', background: 'var(--sb-sage)', color: 'white', fontSize: '0.72rem', cursor: 'pointer' }}
                >Add</button>
                <button
                  onClick={() => { setShowAddField(false); setAddFieldKey(''); }}
                  style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', background: 'transparent', fontSize: '0.72rem', cursor: 'pointer', color: '#888' }}
                >Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddField(true)}
                style={{ fontSize: '0.75rem', padding: '4px 14px', borderRadius: 6, border: '1px dashed var(--sb-sage)', background: 'transparent', cursor: 'pointer', color: 'var(--sb-sage)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }}
              >
                + Add Field
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// A field is treated as an image upload if its key matches a known image-name
// pattern: photoUrl, imageUrl, or any *PhotoUrl / *ImageUrl variant.
function isImageField(key) {
  return /^(photo|image)Url$|(Photo|Image)Url$/i.test(key);
}

function ImageUploadField({ value, onChange }) {
  const inputRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload failed');
      onChange(body.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          padding: '0.75rem',
          background: 'var(--sb-navy)',
          border: '0.5px solid rgba(196,132,58,0.25)',
          borderRadius: 'var(--sb-radius)',
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 80,
            height: 100,
            background: 'var(--sb-navy-deep)',
            border: '0.5px solid var(--sb-taupe)',
            borderRadius: 'var(--sb-radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sb-teal-deep)',
            fontSize: '0.7rem',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {value ? (
            <img
              src={value}
              alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>No image</span>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="sb-btn sb-btn-gold"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.7rem' }}
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : value ? 'Replace Image' : 'Upload Image'}
            </button>
            {value && (
              <button
                type="button"
                className="sb-btn sb-btn-outline"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.7rem' }}
                onClick={() => onChange('')}
              >
                Clear
              </button>
            )}
          </div>
          <input
            className="sb-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/… or paste a URL"
            style={{ fontSize: '0.78rem' }}
          />
          {error && (
            <div style={{ fontSize: '0.75rem', color: 'var(--sb-risk-critical)' }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Normalize any incoming value to a YYYY-MM-DD string suitable for
// <input type="date">. Accepts ISO strings, "Jan 2023" loose text, etc.
// Returns '' if it cannot parse the value as a date.
function toIsoDate(v) {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function statusBtnStyle(selected) {
  return {
    padding: '0.35rem 0.75rem',
    background: selected ? 'rgba(196,132,58,0.18)' : 'transparent',
    border: '0.5px solid rgba(139,155,174,0.25)',
    borderRadius: 'var(--sb-radius)',
    color: selected ? 'var(--sb-gold)' : 'var(--sb-dusty)',
    fontSize: '0.68rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'var(--sb-font-body)',
  };
}

// ── RoleListEditor: dynamic add/remove list for resume roles ──
// Replaces the legacy role1/role2/role3/... fixed-slot pattern. Members can
// have as many roles as their career needs. Each row: title, company, start,
// end (or a "Current" toggle), and description. Reorder via up/down arrows,
// delete per row. The whole array patches to the parent EditorPane on every
// change so live preview stays in sync.
function RoleListEditor({ roles, onChange }) {
  const list = Array.isArray(roles) ? roles : [];

  function update(i, patch) {
    onChange(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRole() {
    onChange([...list, { title: '', company: '', start: '', end: '', current: false, description: '' }]);
  }
  function removeRole(i) {
    onChange(list.filter((_, idx) => idx !== i));
  }
  function moveRole(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div style={styles.fieldGroup}>
      <label style={styles.fieldLabel}>Roles ({list.length})</label>
      <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
        Add a row for each role in your career. Mark your current role with "Current" — the public profile shows it as "Present".
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {list.map((r, i) => (
          <div
            key={i}
            style={{
              border: '0.5px solid rgba(196,132,58,0.20)',
              borderRadius: 'var(--sb-radius)',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{
                fontFamily: 'var(--sb-font-label)',
                fontSize: '0.62rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--sb-gold)',
              }}>
                Role {i + 1}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button type="button" onClick={() => moveRole(i, -1)} disabled={i === 0}
                  style={iconBtnStyle(i === 0)} title="Move up">↑</button>
                <button type="button" onClick={() => moveRole(i, +1)} disabled={i === list.length - 1}
                  style={iconBtnStyle(i === list.length - 1)} title="Move down">↓</button>
                <button type="button" onClick={() => removeRole(i)}
                  style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)' }} title="Delete role">×</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input className="sb-input" placeholder="Title (e.g. Senior Engineer)"
                value={r.title || ''} onChange={(e) => update(i, { title: e.target.value })} />
              <input className="sb-input" placeholder="Company"
                value={r.company || ''} onChange={(e) => update(i, { company: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input type="date" className="sb-input"
                value={toIsoDate(r.start) || ''}
                onChange={(e) => update(i, { start: e.target.value })} />
              <input type="date" className="sb-input"
                value={toIsoDate(r.end) || ''}
                disabled={!!r.current}
                onChange={(e) => update(i, { end: e.target.value })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--sb-sage)', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!r.current}
                  onChange={(e) => update(i, { current: e.target.checked, end: e.target.checked ? '' : r.end })} />
                Current
              </label>
            </div>
            <textarea className="sb-input sb-textarea"
              placeholder="One-paragraph summary of the work and outcomes."
              value={r.description || ''}
              onChange={(e) => update(i, { description: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={addRole} className="sb-btn sb-btn-outline"
          style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}>
          + Add role
        </button>
      </div>
    </div>
  );
}

function iconBtnStyle(disabled) {
  return {
    width: 26,
    height: 26,
    padding: 0,
    background: 'transparent',
    border: '0.5px solid rgba(196,132,58,0.25)',
    borderRadius: 'var(--sb-radius)',
    color: disabled ? 'rgba(139,155,174,0.4)' : 'var(--sb-cream)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.85rem',
    lineHeight: 1,
  };
}

// ── DomainListEditor: dynamic add/remove list for domains-of-expertise ──
// Replaces the legacy d1Title/d1Desc/.../d8Title/d8Desc fixed-slot pattern.
// Each row: title, description. Reorder via up/down, delete per row. The
// whole array patches to the parent EditorPane on every change so live preview
// stays in sync.
function DomainListEditor({ domains, onChange }) {
  const list = Array.isArray(domains) ? domains : [];

  function update(i, patch) {
    onChange(list.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function addItem() {
    onChange([...list, { title: '', desc: '' }]);
  }
  function removeItem(i) {
    onChange(list.filter((_, idx) => idx !== i));
  }
  function moveItem(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div style={styles.fieldGroup}>
      <label style={styles.fieldLabel}>Domains ({list.length})</label>
      <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
        Add a row for each capability area you sell into. 3–8 works best.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {list.map((d, i) => (
          <div
            key={i}
            style={{
              border: '0.5px solid rgba(196,132,58,0.20)',
              borderRadius: 'var(--sb-radius)',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{
                fontFamily: 'var(--sb-font-label)',
                fontSize: '0.62rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--sb-gold)',
              }}>
                Domain {i + 1}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0}
                  style={iconBtnStyle(i === 0)} title="Move up">↑</button>
                <button type="button" onClick={() => moveItem(i, +1)} disabled={i === list.length - 1}
                  style={iconBtnStyle(i === list.length - 1)} title="Move down">↓</button>
                <button type="button" onClick={() => removeItem(i)}
                  style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)' }} title="Delete domain">×</button>
              </div>
            </div>
            <input className="sb-input" placeholder="Title (e.g. Operations Strategy)"
              value={d.title || ''} onChange={(e) => update(i, { title: e.target.value })}
              style={{ marginBottom: '0.5rem' }} />
            <textarea className="sb-input sb-textarea"
              placeholder="Short description of how you create value here."
              value={d.desc || ''}
              onChange={(e) => update(i, { desc: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={addItem} className="sb-btn sb-btn-outline"
          style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}>
          + Add domain
        </button>
      </div>
    </div>
  );
}

// ── CardListEditor: dynamic add/remove list for service / engagement cards ──
// Replaces the legacy card1Title/card1Desc/card1Icon/... fixed-slot pattern.
// Each row: title, description, optional icon character. Reorder via up/down,
// delete per row.
function CardListEditor({ cards, onChange }) {
  const list = Array.isArray(cards) ? cards : [];

  function update(i, patch) {
    onChange(list.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addItem() {
    onChange([...list, { title: '', desc: '', icon: '' }]);
  }
  function removeItem(i) {
    onChange(list.filter((_, idx) => idx !== i));
  }
  function moveItem(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div style={styles.fieldGroup}>
      <label style={styles.fieldLabel}>Cards ({list.length})</label>
      <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
        Add a card for each engagement shape or service you offer. The CardsBlock displays up to three side-by-side.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {list.map((c, i) => (
          <div
            key={i}
            style={{
              border: '0.5px solid rgba(196,132,58,0.20)',
              borderRadius: 'var(--sb-radius)',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{
                fontFamily: 'var(--sb-font-label)',
                fontSize: '0.62rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--sb-gold)',
              }}>
                Card {i + 1}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0}
                  style={iconBtnStyle(i === 0)} title="Move up">↑</button>
                <button type="button" onClick={() => moveItem(i, +1)} disabled={i === list.length - 1}
                  style={iconBtnStyle(i === list.length - 1)} title="Move down">↓</button>
                <button type="button" onClick={() => removeItem(i)}
                  style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)' }} title="Delete card">×</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input className="sb-input" placeholder="◆"
                value={c.icon || ''} onChange={(e) => update(i, { icon: e.target.value })}
                style={{ textAlign: 'center' }} />
              <input className="sb-input" placeholder="Title (e.g. Diagnostic Sprint)"
                value={c.title || ''} onChange={(e) => update(i, { title: e.target.value })} />
            </div>
            <textarea className="sb-input sb-textarea"
              placeholder="One-paragraph description of this engagement shape."
              value={c.desc || ''}
              onChange={(e) => update(i, { desc: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={addItem} className="sb-btn sb-btn-outline"
          style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}>
          + Add card
        </button>
      </div>
    </div>
  );
}

// ── Generic list editor factory ──
// Builds a dynamic add/remove/reorder list editor for simple array types.
// Each item definition: { key, placeholder, long? } drives one input/textarea.
function makeListEditor(singularLabel, defaultItem, fieldDefs) {
  return function GenericListEditor({ items: raw, onChange }) {
    const list = Array.isArray(raw) ? raw : [];
    function update(i, patch) { onChange(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r))); }
    function add() { onChange([...list, { ...defaultItem }]); }
    function remove(i) { onChange(list.filter((_, idx) => idx !== i)); }
    function move(i, dir) {
      const j = i + dir;
      if (j < 0 || j >= list.length) return;
      const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; onChange(next);
    }
    return (
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>{singularLabel}s ({list.length})</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {list.map((item, i) => (
            <div key={i} style={{ border: '0.5px solid rgba(196,132,58,0.20)', borderRadius: 'var(--sb-radius)', padding: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>{singularLabel} {i + 1}</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={iconBtnStyle(i === 0)} title="Move up">↑</button>
                  <button type="button" onClick={() => move(i, +1)} disabled={i === list.length - 1} style={iconBtnStyle(i === list.length - 1)} title="Move down">↓</button>
                  <button type="button" onClick={() => remove(i)} style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)' }} title={`Delete ${singularLabel.toLowerCase()}`}>×</button>
                </div>
              </div>
              {fieldDefs.map(({ key, placeholder, long, half }) => (
                half ? null : long ? (
                  <textarea key={key} className="sb-input sb-textarea" placeholder={placeholder} value={item[key] || ''} onChange={(e) => update(i, { [key]: e.target.value })} style={{ marginBottom: '0.4rem' }} />
                ) : (
                  <input key={key} className="sb-input" placeholder={placeholder} value={item[key] || ''} onChange={(e) => update(i, { [key]: e.target.value })} style={{ marginBottom: '0.4rem' }} />
                )
              ))}
              {/* Half-width fields rendered as grid row */}
              {(() => {
                const halves = fieldDefs.filter(f => f.half);
                if (!halves.length) return null;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${halves.length}, 1fr)`, gap: '0.5rem', marginBottom: '0.4rem' }}>
                    {halves.map(({ key, placeholder }) => (
                      <input key={key} className="sb-input" placeholder={placeholder} value={item[key] || ''} onChange={(e) => update(i, { [key]: e.target.value })} />
                    ))}
                  </div>
                );
              })()}
            </div>
          ))}
          <button type="button" onClick={add} className="sb-btn sb-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}>
            + Add {singularLabel.toLowerCase()}
          </button>
        </div>
      </div>
    );
  };
}

// Specialized list editors for each new block type.
// `cases` array for the caseStudies block:
function CaseListEditor({ cases, onChange }) {
  const list = Array.isArray(cases) ? cases : [];
  const [openIdx, setOpenIdx] = React.useState(null);
  function update(i, patch) { onChange(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r))); }
  function add() {
    onChange([...list, { title: '', clientSummary: '', problemStatement: '', kpiImprovement: '', methodsTaken: '', challenges: '', impact: '', feedback: '', tags: '' }]);
    setOpenIdx(list.length);
  }
  function remove(i) { onChange(list.filter((_, idx) => idx !== i)); if (openIdx === i) setOpenIdx(null); }
  function move(i, dir) { const j = i + dir; if (j < 0 || j >= list.length) return; const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; onChange(next); }

  const CASE_FIELDS = [
    { key: 'clientSummary',    label: 'Client Summary',       placeholder: 'Brief description of the client and engagement context', long: false },
    { key: 'problemStatement', label: 'Problem Statement',    placeholder: 'What problem or challenge existed that required solving?', long: true },
    { key: 'kpiImprovement',   label: 'KPI Improvement',      placeholder: 'Quantified metrics improved (e.g. "Reduced DSO by 22 days, recovered $2.4M ARR")', long: true },
    { key: 'methodsTaken',     label: 'Methods & Approach',   placeholder: 'What methods, frameworks, or approaches were used?', long: true },
    { key: 'challenges',       label: 'Challenges',           placeholder: 'Key obstacles encountered and how they were navigated', long: true },
    { key: 'impact',           label: 'Impact & Outcomes',    placeholder: 'Final business outcomes and lasting impact', long: true },
    { key: 'feedback',         label: 'Client Feedback / Quote', placeholder: '"A direct quote or paraphrased endorsement from the client"', long: true },
    { key: 'tags',             label: 'Tags',                 placeholder: 'Comma-separated: e.g. M&A, PMO, FinTech, ERP', long: false },
  ];

  return (
    <div style={styles.fieldGroup}>
      <label style={styles.fieldLabel}>Case Studies ({list.length})</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {list.map((c, i) => (
          <div key={i} style={{ border: `0.5px solid ${openIdx === i ? 'rgba(196,132,58,0.5)' : 'rgba(196,132,58,0.20)'}`, borderRadius: 'var(--sb-radius)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', cursor: 'pointer', background: openIdx === i ? 'rgba(196,132,58,0.07)' : 'transparent' }} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>Case {i + 1}</span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sb-sage)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || '(untitled)'}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={iconBtnStyle(i === 0)}>↑</button>
                <button type="button" onClick={() => move(i, +1)} disabled={i === list.length - 1} style={iconBtnStyle(i === list.length - 1)}>↓</button>
                <button type="button" onClick={() => remove(i)} style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)' }}>×</button>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)' }}>{openIdx === i ? '▲' : '▼'}</span>
            </div>
            {/* Expanded fields */}
            {openIdx === i && (
              <div style={{ padding: '0.75rem', borderTop: '0.5px solid rgba(196,132,58,0.15)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input className="sb-input" placeholder="Case Study Title" value={c.title || ''} onChange={(e) => update(i, { title: e.target.value })} />
                {CASE_FIELDS.map(({ key, label, placeholder, long }) => (
                  <div key={key}>
                    <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: 2, color: 'var(--sb-teal-deep)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>
                    {long
                      ? <textarea className="sb-input sb-textarea" placeholder={placeholder} value={c[key] || ''} onChange={(e) => update(i, { [key]: e.target.value })} style={{ minHeight: 64 }} />
                      : <input className="sb-input" placeholder={placeholder} value={c[key] || ''} onChange={(e) => update(i, { [key]: e.target.value })} />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={add} className="sb-btn sb-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}>+ Add case study</button>
      </div>
    </div>
  );
}

// `stats` array for the statGrid block:
const StatListEditor = makeListEditor('Stat', { value: '', label: '', sublabel: '' }, [
  { key: 'value', placeholder: 'Value (e.g. $2.4M, 94%, 12×)' },
  { key: 'label', placeholder: 'Label (e.g. Revenue recovered)' },
  { key: 'sublabel', placeholder: 'Sub-label or time period (optional)' },
]);

// `steps` array for the process block:
const StepListEditor = makeListEditor('Step', { title: '', description: '' }, [
  { key: 'title', placeholder: 'Step title (e.g. Discovery)' },
  { key: 'description', placeholder: 'What happens in this step', long: true },
]);

// `cols` array for the columns block:
const ColListEditor = makeListEditor('Column', { icon: '', title: '', body: '' }, [
  { key: 'icon', placeholder: '◆ Icon or emoji', half: true },
  { key: 'title', placeholder: 'Column heading', half: true },
  { key: 'body', placeholder: 'Body text', long: true },
]);

// `items` array for the iconGrid block:
const IconItemListEditor = makeListEditor('Item', { icon: '', label: '', tooltip: '' }, [
  { key: 'icon', placeholder: '◆ Icon or emoji', half: true },
  { key: 'label', placeholder: 'Label', half: true },
  { key: 'tooltip', placeholder: 'Hover tooltip text', long: true },
]);

// ── Skills editor ─────────────────────────────────────────────────────────────
// skills: [{category, items:[{name,level,years}]}]
function SkillsListEditor({ skills, onChange }) {
  const list = Array.isArray(skills) ? skills : [];
  const [openGrp, setOpenGrp] = React.useState(null);
  function addGroup() { onChange([...list, { category: '', items: [] }]); setOpenGrp(list.length); }
  function removeGroup(gi) { onChange(list.filter((_, i) => i !== gi)); }
  function updateGroup(gi, patch) { onChange(list.map((g, i) => i === gi ? { ...g, ...patch } : g)); }
  function addSkill(gi) { updateGroup(gi, { items: [...(list[gi].items || []), { name: '', level: 'proficient', years: '' }] }); }
  function updateSkill(gi, si, patch) { updateGroup(gi, { items: (list[gi].items||[]).map((sk, i) => i === si ? { ...sk, ...patch } : sk) }); }
  function removeSkill(gi, si) { updateGroup(gi, { items: (list[gi].items||[]).filter((_, i) => i !== si) }); }
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.fieldLabel}>Skills ({list.reduce((n,g)=>n+(g.items||[]).length,0)} skills in {list.length} groups)</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {list.map((g, gi) => (
          <div key={gi} style={{ border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 'var(--sb-radius)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', background: openGrp === gi ? 'rgba(196,132,58,0.07)' : 'transparent' }} onClick={() => setOpenGrp(openGrp === gi ? null : gi)}>
              <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', color: 'var(--sb-gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Group {gi+1}</span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sb-sage)' }}>{g.category || '(unnamed group)'} · {(g.items||[]).length} skills</span>
              <button onClick={e=>{e.stopPropagation();removeGroup(gi);}} style={{ ...iconBtnStyle(false), color:'var(--sb-risk-critical)' }}>×</button>
              <span style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)' }}>{openGrp===gi?'▲':'▼'}</span>
            </div>
            {openGrp === gi && (
              <div style={{ padding: '0.75rem', borderTop: '0.5px solid rgba(196,132,58,0.12)' }}>
                <input className="sb-input" placeholder="Category name (e.g. ERP Systems, Leadership)" value={g.category||''} onChange={e=>updateGroup(gi,{category:e.target.value})} style={{ marginBottom: '0.5rem' }} />
                {(g.items||[]).map((sk,si) => (
                  <div key={si} style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 0.4fr auto', gap: '0.35rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                    <input className="sb-input" placeholder="Skill name" value={sk.name||''} onChange={e=>updateSkill(gi,si,{name:e.target.value})} />
                    <select className="sb-input" value={sk.level||'proficient'} onChange={e=>updateSkill(gi,si,{level:e.target.value})} style={{ fontSize: '0.75rem' }}>
                      <option value="expert">Expert</option>
                      <option value="proficient">Proficient</option>
                      <option value="familiar">Familiar</option>
                    </select>
                    <input className="sb-input" placeholder="Years" value={sk.years||''} onChange={e=>updateSkill(gi,si,{years:e.target.value})} style={{ fontSize: '0.75rem' }} />
                    <button onClick={()=>removeSkill(gi,si)} style={{ ...iconBtnStyle(false), color:'var(--sb-risk-critical)' }}>×</button>
                  </div>
                ))}
                <button type="button" onClick={()=>addSkill(gi)} style={{ fontSize: '0.72rem', padding: '3px 10px', border: '1px dashed var(--sb-sage)', borderRadius: 4, background: 'transparent', cursor: 'pointer', color: 'var(--sb-sage)', marginTop: '0.25rem' }}>+ Add skill</button>
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={addGroup} className="sb-btn sb-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}>+ Add skill group</button>
      </div>
    </div>
  );
}

// ── Client Snapshot editor ────────────────────────────────────────────────────
// clients: [{name,industry,employerSponsor,capabilitiesDelivered,capabilitiesTouched,techDelivered,techTouched,revenueRange,tags}]
const CLIENT_SNAPSHOT_FIELDS = [
  { key: 'industry',               label: 'Industry',                  placeholder: 'e.g. Healthcare, Manufacturing' },
  { key: 'employerSponsor',        label: 'Employer / Sponsor',        placeholder: 'e.g. Deloitte, McKinsey, Direct' },
  { key: 'revenueRange',           label: 'Revenue Range',             placeholder: 'e.g. $10M–$100M, $1B+' },
  { key: 'capabilitiesDelivered',  label: 'Capabilities Delivered',    placeholder: 'Comma-separated: CPQ, Billing, Integration' },
  { key: 'capabilitiesTouched',    label: 'Capabilities Touched',      placeholder: 'Adjacent capabilities influenced' },
  { key: 'techDelivered',          label: 'Technology Delivered',      placeholder: 'Comma-separated: Salesforce, NetSuite, MuleSoft' },
  { key: 'techTouched',            label: 'Technology Touched',        placeholder: 'Tools used but not led' },
  { key: 'tags',                   label: 'Tags',                      placeholder: 'Comma-separated tags for filtering' },
];
function ClientSnapshotListEditor({ clients, onChange }) {
  const list = Array.isArray(clients) ? clients : [];
  const [openIdx, setOpenIdx] = React.useState(null);
  function add() { onChange([...list, { name: '' }]); setOpenIdx(list.length); }
  function remove(i) { onChange(list.filter((_,j) => j !== i)); if (openIdx === i) setOpenIdx(null); }
  function update(i, patch) { onChange(list.map((c,j) => j === i ? { ...c, ...patch } : c)); }
  function move(i, dir) { const j=i+dir; if(j<0||j>=list.length)return; const n=[...list];[n[i],n[j]]=[n[j],n[i]];onChange(n); }
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.fieldLabel}>Client Entries ({list.length})</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {list.map((c, i) => (
          <div key={i} style={{ border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 'var(--sb-radius)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', background: openIdx===i ? 'rgba(196,132,58,0.07)' : 'transparent' }} onClick={() => setOpenIdx(openIdx===i?null:i)}>
              <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', color: 'var(--sb-gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Client {i+1}</span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sb-sage)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || '(unnamed)'}{c.industry ? ` · ${c.industry}` : ''}</span>
              <div style={{ display: 'flex', gap: '0.2rem' }} onClick={e=>e.stopPropagation()}>
                <button type="button" onClick={()=>move(i,-1)} disabled={i===0} style={iconBtnStyle(i===0)}>↑</button>
                <button type="button" onClick={()=>move(i,1)} disabled={i===list.length-1} style={iconBtnStyle(i===list.length-1)}>↓</button>
                <button type="button" onClick={()=>remove(i)} style={{...iconBtnStyle(false),color:'var(--sb-risk-critical)'}}>×</button>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep)' }}>{openIdx===i?'▲':'▼'}</span>
            </div>
            {openIdx === i && (
              <div style={{ padding: '0.75rem', borderTop: '0.5px solid rgba(196,132,58,0.12)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <input className="sb-input" placeholder="Client name / identifier" value={c.name||''} onChange={e=>update(i,{name:e.target.value})} />
                {CLIENT_SNAPSHOT_FIELDS.map(({key,label,placeholder}) => (
                  <div key={key}>
                    <label style={{ fontSize: '0.62rem', display: 'block', marginBottom: 2, color: 'var(--sb-teal-deep)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>
                    <input className="sb-input" placeholder={placeholder} value={c[key]||''} onChange={e=>update(i,{[key]:e.target.value})} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={add} className="sb-btn sb-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', alignSelf: 'flex-start' }}>+ Add client</button>
      </div>
    </div>
  );
}

// ── Section Actions / CTA Buttons editor ──────────────────────────────────────
// actions: [{label, href, style}]
// Renders a guided link picker so the user can choose from existing pages,
// section anchors, output routes, or type a custom URL.

const OUTPUT_ROUTES = [
  { label: 'Resume PDF',           href: '/output/resume',       desc: 'Downloadable resume output' },
  { label: 'Executive Bio',        href: '/output/bio',          desc: 'Executive biography' },
  { label: 'One-Pager',            href: '/output/one-pager',    desc: 'One-page overview' },
  { label: 'Case Study',           href: '/output/case-study',   desc: 'Case study document' },
  { label: 'Build Summary',        href: '/output/build-summary',desc: 'Project build summary' },
  { label: 'Patch Notes',          href: '/output/patch-notes',  desc: 'Platform release log' },
];

const BTN_STYLES = [
  { value: 'gold',         label: 'Gold (primary)' },
  { value: 'navy',         label: 'Navy (dark)' },
  { value: 'teal',         label: 'Teal' },
  { value: 'outline',      label: 'Outline light' },
  { value: 'outline-dark', label: 'Outline dark' },
];

const STYLE_PREVIEW = {
  gold:         { background: 'var(--sb-gold,#c4843a)', color: '#fff' },
  navy:         { background: 'var(--sb-navy,#1b2a3b)', color: '#fff' },
  teal:         { background: 'var(--sb-teal-deep,#02a1a6)', color: '#fff' },
  outline:      { background: 'transparent', color: 'var(--sb-gold,#c4843a)', border: '1.5px solid var(--sb-gold,#c4843a)' },
  'outline-dark':{ background: 'transparent', color: 'var(--sb-navy,#1b2a3b)', border: '1.5px solid var(--sb-navy,#1b2a3b)' },
};

function SectionActionsEditor({ actions, onChange, site }) {
  const [addingIndex, setAddingIndex] = React.useState(null); // which row is open for link picker
  const list = Array.isArray(actions) ? actions : [];

  // Build link groups from site
  const linkGroups = React.useMemo(() => {
    const pages = Object.entries(site?.pages || {})
      .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0));

    const pageLinks = pages.map(([key, pg]) => ({
      group: 'Site Pages',
      label: pg.name,
      href: pg.slug ? `/${pg.slug}` : '/',
      desc: `Go to the ${pg.name} page`,
    }));

    const sectionLinks = pages.flatMap(([, pg]) =>
      (pg.sections || [])
        .filter(s => s.id && s.name)
        .map(s => ({
          group: 'Section Anchors',
          label: `↳ ${s.name}`,
          href: `#${s.id}`,
          desc: `Scroll to "${s.name}" on ${pg.name}`,
        }))
    );

    const outputLinks = OUTPUT_ROUTES.map(o => ({ group: 'Output Documents', ...o }));

    const misc = [
      { group: 'Common', label: 'Contact / Reach Out', href: '#contact',   desc: 'Scroll to contact section' },
      { group: 'Common', label: 'Back to Top',          href: '#top',       desc: 'Scroll to page top' },
      { group: 'Common', label: 'External URL',         href: '',           desc: 'Type any URL', isCustom: true },
    ];

    return [...misc, ...pageLinks, ...sectionLinks, ...outputLinks];
  }, [site]);

  // Group by group label for the picker UI
  const grouped = React.useMemo(() => {
    const map = {};
    for (const item of linkGroups) {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push(item);
    }
    return Object.entries(map);
  }, [linkGroups]);

  function add() {
    const next = [...list, { label: '', href: '', style: 'gold' }];
    onChange(next);
    setAddingIndex(next.length - 1);
  }
  function remove(i) {
    onChange(list.filter((_, j) => j !== i));
    if (addingIndex === i) setAddingIndex(null);
  }
  function update(i, patch) { onChange(list.map((a, j) => j === i ? { ...a, ...patch } : a)); }
  function pickLink(i, item) {
    const updated = { ...list[i], href: item.href };
    if (!list[i].label) updated.label = item.label;
    onChange(list.map((a, j) => j === i ? updated : a));
    if (!item.isCustom) setAddingIndex(null);
  }

  const pill = (style) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    ...(STYLE_PREVIEW[style] || STYLE_PREVIEW.gold),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {list.length === 0 && (
        <div style={{ fontSize: '0.72rem', color: '#888', fontStyle: 'italic', padding: '0.25rem 0' }}>
          No buttons yet. Add one below to give visitors a clear next action.
        </div>
      )}

      {list.map((a, i) => (
        <div key={i} style={{ background: 'rgba(0,0,0,0.03)', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

          {/* Row 1: label + style + remove */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              className="sb-input"
              placeholder="Button label"
              value={a.label || ''}
              onChange={e => update(i, { label: e.target.value })}
              style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600 }}
            />
            <select
              className="sb-input"
              value={a.style || 'gold'}
              onChange={e => update(i, { style: e.target.value })}
              style={{ width: 130, fontSize: '0.72rem' }}
            >
              {BTN_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={() => remove(i)} style={{ ...iconBtnStyle(false), color: 'var(--sb-risk-critical)', fontSize: '0.9rem' }}>×</button>
          </div>

          {/* Row 2: href + picker toggle + preview */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              className="sb-input"
              placeholder="Link URL or #anchor"
              value={a.href || ''}
              onChange={e => update(i, { href: e.target.value })}
              style={{ flex: 1, fontSize: '0.78rem', fontFamily: 'monospace' }}
            />
            <button
              onClick={() => setAddingIndex(addingIndex === i ? null : i)}
              style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.18)', background: addingIndex === i ? 'var(--sb-navy,#1b2a3b)' : 'white', color: addingIndex === i ? 'white' : '#555', fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {addingIndex === i ? '▲ Close' : '🔗 Pick Link'}
            </button>
          </div>

          {/* Preview pill */}
          {a.label && (
            <div>
              <span style={{ fontSize: '0.6rem', color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 6 }}>Preview:</span>
              <span style={pill(a.style || 'gold')}>{a.label}</span>
            </div>
          )}

          {/* Link picker panel */}
          {addingIndex === i && (
            <div style={{ border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 8, background: 'white', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
              {grouped.map(([groupName, items]) => (
                <div key={groupName}>
                  <div style={{ padding: '0.4rem 0.75rem', background: 'var(--sb-ivory,#faf8f4)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--sb-font-label)', borderBottom: '0.5px solid rgba(0,0,0,0.06)', position: 'sticky', top: 0 }}>
                    {groupName}
                  </div>
                  {items.map((item, k) => (
                    <button
                      key={k}
                      onClick={() => pickLink(i, item)}
                      style={{ display: 'flex', width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem', border: 'none', background: a.href === item.href && !item.isCustom ? 'rgba(196,132,58,0.08)' : 'transparent', cursor: 'pointer', gap: '0.5rem', alignItems: 'flex-start', borderBottom: '0.5px solid rgba(0,0,0,0.04)' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: a.href === item.href ? 600 : 400, color: 'var(--sb-navy,#1b2a3b)' }}>{item.label}</div>
                        <div style={{ fontSize: '0.68rem', color: '#888' }}>{item.desc}</div>
                      </div>
                      {!item.isCustom && (
                        <code style={{ fontSize: '0.62rem', color: '#aaa', background: 'rgba(0,0,0,0.04)', padding: '1px 5px', borderRadius: 4, alignSelf: 'center', whiteSpace: 'nowrap' }}>{item.href}</code>
                      )}
                      {a.href === item.href && !item.isCustom && (
                        <span style={{ color: 'var(--sb-gold,#c4843a)', fontSize: '0.75rem', alignSelf: 'center' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        style={{ fontSize: '0.72rem', padding: '5px 14px', border: '1px dashed rgba(196,132,58,0.5)', borderRadius: 6, background: 'transparent', cursor: 'pointer', color: 'var(--sb-gold,#c4843a)', alignSelf: 'flex-start' }}
      >
        + Add Button
      </button>
    </div>
  );
}
