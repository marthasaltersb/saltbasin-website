import React from 'react';
import { styles } from './adminStyles.js';

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

export default function EditorPane({ section, page, onUpdateSection, onUpdatePageStatus }) {
  if (!section) {
    return (
      <div style={styles.editorPane}>
        <div style={styles.editorHeader}>
          <div>
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
              Select a section to edit
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)' }}>
              {page ? `/${page.slug || ''}` : ''}
            </div>
          </div>
        </div>
        <div style={styles.editorBody}>
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--sb-teal-deep)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--sb-gold)' }}>←</div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
              Pick a section from the sidebar to begin editing, or use the page status toggle below.
            </div>
            {page && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {STATUS_OPTS.map((o) => (
                  <button
                    key={o.val}
                    onClick={() => onUpdatePageStatus(o.val)}
                    style={statusBtnStyle(page.status === o.val)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function patchField(key, value) {
    onUpdateSection({ fields: { ...section.fields, [key]: value } });
  }
  function patchTop(key, value) {
    onUpdateSection({ [key]: value });
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
                return (
                  <RoleListEditor
                    key={k}
                    roles={v}
                    onChange={(next) => patchField(k, next)}
                  />
                );
              }
              if (Array.isArray(v) && k === 'domains') {
                return (
                  <DomainListEditor
                    key={k}
                    domains={v}
                    onChange={(next) => patchField(k, next)}
                  />
                );
              }
              if (Array.isArray(v) && k === 'cards') {
                return (
                  <CardListEditor
                    key={k}
                    cards={v}
                    onChange={(next) => patchField(k, next)}
                  />
                );
              }
              if (isImageField(k)) {
                return (
                  <div key={k} style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>{humanLabel(k)}</label>
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
                    <label style={styles.fieldLabel}>{humanLabel(k)}</label>
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
                  <label style={styles.fieldLabel}>{humanLabel(k)}</label>
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
