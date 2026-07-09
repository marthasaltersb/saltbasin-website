// Pluggable sub-section display widgets for the flexColumns section type —
// each column independently picks one of these via section.fields.flexCols[i].widgetType.
// WheelDisplay is also reused by the legacy IndustryWheelBlock (see index.jsx)
// so there's one generalized wheel renderer, not two.
import React from 'react';
import { useViewportWidth, PanelCard } from './blockUtils.jsx';

const BG_VAR = {
  ivory: 'var(--sb-ivory)',
  navy: 'var(--sb-navy)',
  linen: 'var(--sb-linen)',
  teal: 'var(--sb-teal)',
  cream: 'var(--sb-cream)',
};

// ── Text (today's plain column look — the default widgetType) ──────────────
function TextColumnWidget({ config }) {
  const c = config || {};
  return (
    <div style={{ textAlign: 'center' }}>
      {c.icon && <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{c.icon}</div>}
      {c.title && (
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>
          {c.title}
        </div>
      )}
      {c.body && <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#4a4a4a', margin: 0 }}>{c.body}</p>}
    </div>
  );
}

// ── Photo ────────────────────────────────────────────────────────────────────
function PhotoColumnWidget({ config }) {
  const c = config || {};
  if (!c.url) return <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)', fontStyle: 'italic', textAlign: 'center' }}>No photo set.</div>;
  return (
    <div>
      <img src={c.url} alt={c.caption || ''} style={{ width: '100%', height: 'auto', borderRadius: 'var(--sb-radius)', display: 'block' }} />
      {c.caption && <div style={{ fontSize: '0.78rem', color: 'var(--sb-teal-deep)', marginTop: '0.6rem', textAlign: 'center' }}>{c.caption}</div>}
    </div>
  );
}

// ── Photo slideshow — interactive, web-only ─────────────────────────────────
function SlideshowColumnWidget({ config }) {
  const c = config || {};
  const images = Array.isArray(c.images) ? c.images.filter((i) => i.url) : [];
  const [idx, setIdx] = React.useState(0);
  const intervalMs = Number(c.autoplayMs) || 4000;

  React.useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(t);
  }, [images.length, intervalMs]);

  if (images.length === 0) {
    return <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)', fontStyle: 'italic', textAlign: 'center' }}>No slideshow images set.</div>;
  }
  const current = images[idx % images.length];
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <img src={current.url} alt={current.caption || ''} style={{ width: '100%', height: 'auto', borderRadius: 'var(--sb-radius)', display: 'block' }} />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
              style={slideNavBtn('left')}
            >‹</button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              aria-label="Next image"
              style={slideNavBtn('right')}
            >›</button>
          </>
        )}
      </div>
      {current.caption && <div style={{ fontSize: '0.78rem', color: 'var(--sb-teal-deep)', marginTop: '0.6rem', textAlign: 'center' }}>{current.caption}</div>}
      {images.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
          {images.map((_, i) => (
            <span
              key={i}
              onClick={() => setIdx(i)}
              style={{ width: 6, height: 6, borderRadius: '50%', cursor: 'pointer', background: i === idx ? 'var(--sb-gold)' : 'rgba(0,0,0,0.15)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function slideNavBtn(side) {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 8,
    transform: 'translateY(-50%)',
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(27,42,59,0.65)',
    color: 'white',
    fontSize: '1.1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

// ── User form — submits through the existing /api/leads pipeline ───────────
// `source` lets other callers (e.g. Phase D's popup action buttons) tag their
// leads distinctly from the flexColumns widget while reusing the same form.
export function FormColumnWidget({ config, source }) {
  const c = config || {};
  const fields = Array.isArray(c.fields) ? c.fields : [];
  const [values, setValues] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);

  const hasEmailField = fields.some((f) => f.key === 'email');

  function setVal(key, v) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!values.email) return;
    setSubmitting(true);
    setError('');
    try {
      const known = { email: values.email, name: values.name || null, phone: values.phone || null };
      const customLines = fields
        .filter((f) => !['email', 'name', 'phone', 'message'].includes(f.key))
        .map((f) => (values[f.key] ? `${f.label}: ${values[f.key]}` : null))
        .filter(Boolean);
      const message = [values.message, ...customLines].filter(Boolean).join('\n') || null;
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source || 'flex-columns-form', ...known, message, ctaLocation: c.title || 'Flexible Columns Form' }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Submission failed');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasEmailField) {
    return <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)', fontStyle: 'italic', textAlign: 'center' }}>This form needs an email field configured.</div>;
  }
  if (done) {
    return <div style={{ fontSize: '0.9rem', color: 'var(--sb-teal-deep)', textAlign: 'center' }}>Thanks — I'll be in touch.</div>;
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {c.title && <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-navy)' }}>{c.title}</div>}
      {fields.map((f) => (
        <div key={f.key}>
          {f.type === 'textarea' ? (
            <textarea
              className="sb-input sb-textarea"
              placeholder={f.label}
              required={!!f.required}
              value={values[f.key] || ''}
              onChange={(e) => setVal(f.key, e.target.value)}
            />
          ) : (
            <input
              className="sb-input"
              type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text'}
              placeholder={f.label}
              required={!!f.required}
              value={values[f.key] || ''}
              onChange={(e) => setVal(f.key, e.target.value)}
            />
          )}
        </div>
      ))}
      <button type="submit" className="sb-btn sb-btn-gold" style={{ justifyContent: 'center' }} disabled={submitting}>
        {submitting ? 'Sending…' : (c.submitLabel || 'Submit')}
      </button>
      {error && <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.82rem' }}>{error}</div>}
    </form>
  );
}

// ── Wheel infographic — generalized wheel + node detail panel ──────────────
// Owns its own selection state and renders a complete two-panel unit (wheel +
// detail). `renderDefaultPanel` lets a caller (e.g. IndustryWheelBlock) show
// custom content when nothing is selected instead of the generic prompt.
export function WheelDisplay({ centerLabel = 'Overview', nodes, renderDefaultPanel, wheelTitle }) {
  const list = Array.isArray(nodes) ? nodes : [];
  const [selected, setSelected] = React.useState(null);
  const viewportWidth = useViewportWidth();

  const wheelSize = viewportWidth <= 480 ? 260 : viewportWidth <= 768 ? 320 : 360;
  const nodeSize = viewportWidth <= 480 ? 58 : viewportWidth <= 768 ? 64 : 72;
  const radius = wheelSize / 2 - nodeSize / 2 - 6;
  const center = wheelSize / 2;
  const positioned = list.map((n, i) => {
    const angle = (Math.PI * 2 * i) / (list.length || 1) - Math.PI / 2;
    return { ...n, x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  });
  const selectedNode = selected ? list.find((n) => n.id === selected) : null;

  return (
    <div className="sb-grid-wheel">
      <PanelCard title={wheelTitle || `${centerLabel} · click any to focus`}>
        <div style={{ position: 'relative', width: wheelSize, height: wheelSize, margin: '0 auto' }}>
          <svg width={wheelSize} height={wheelSize} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(196,132,58,0.18)" strokeWidth="0.5" />
            <circle cx={center} cy={center} r={Math.max(radius - 32, 0)} fill="none" stroke="rgba(196,132,58,0.1)" strokeWidth="0.5" strokeDasharray="2 4" />
            {positioned.map((n) => (
              <line
                key={n.id}
                x1={center}
                y1={center}
                x2={n.x}
                y2={n.y}
                stroke={selected === n.id ? 'var(--sb-gold)' : selected ? 'rgba(196,132,58,0.1)' : 'rgba(196,132,58,0.22)'}
                strokeWidth={selected === n.id ? 1.5 : 0.5}
              />
            ))}
          </svg>
          <div
            onClick={() => setSelected(null)}
            style={{
              position: 'absolute', left: center - nodeSize / 2, top: center - nodeSize / 2,
              width: nodeSize, height: nodeSize, borderRadius: '50%',
              background: 'var(--sb-navy)', color: 'var(--sb-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--sb-font-display)', fontSize: nodeSize >= 70 ? '0.85rem' : '0.72rem',
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
              border: '1.5px solid var(--sb-gold)', textAlign: 'center', zIndex: 2, lineHeight: 1.15, padding: '0 4px',
            }}
            title="Reset"
          >
            {centerLabel}
          </div>
          {positioned.map((n) => {
            const isSelected = selected === n.id;
            const isDimmed = selected && !isSelected;
            return (
              <button
                key={n.id}
                onClick={() => setSelected(n.id)}
                style={{
                  position: 'absolute', left: n.x - nodeSize / 2, top: n.y - nodeSize / 2,
                  width: nodeSize, height: nodeSize, borderRadius: '50%',
                  background: isSelected ? 'var(--sb-gold)' : 'white',
                  color: isSelected ? 'var(--sb-ivory)' : 'var(--sb-navy)',
                  border: isSelected ? '1.5px solid var(--sb-gold-warm)' : '0.5px solid var(--sb-taupe)',
                  opacity: isDimmed ? 0.45 : 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontFamily: 'var(--sb-font-body)',
                  fontSize: nodeSize >= 70 ? '0.58rem' : '0.52rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '0 3px', transition: 'all 0.18s',
                  boxShadow: isSelected ? '0 4px 14px rgba(196,132,58,0.35)' : '0 1px 3px rgba(0,0,0,0.06)',
                  zIndex: isSelected ? 3 : 1, overflow: 'hidden',
                }}
                title={n.label}
              >
                {n.photoUrl ? (
                  <img src={n.photoUrl} alt="" style={{ width: '60%', height: '60%', objectFit: 'cover', borderRadius: '50%', marginBottom: 2 }} />
                ) : (
                  <span style={{ fontSize: '1rem', marginBottom: 2 }}>{n.icon}</span>
                )}
                <span style={{ lineHeight: 1.1, textAlign: 'center' }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </PanelCard>

      <PanelCard title={selectedNode ? selectedNode.label : 'Details'}>
        {selectedNode ? (
          <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--sb-teal-deep)', whiteSpace: 'pre-line' }}>
            {selectedNode.expandText}
          </div>
        ) : renderDefaultPanel ? (
          renderDefaultPanel()
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>Click a node on the wheel to see more.</div>
        )}
      </PanelCard>
    </div>
  );
}

function WheelColumnWidget({ config }) {
  const c = config || {};
  return <WheelDisplay centerLabel={c.centerLabel || 'Overview'} nodes={c.nodes} />;
}

export const WIDGET_REGISTRY = {
  text: TextColumnWidget,
  photo: PhotoColumnWidget,
  photoSlideshow: SlideshowColumnWidget,
  userForm: FormColumnWidget,
  wheelInfographic: WheelColumnWidget,
};

export const WIDGET_TYPES = [
  { type: 'text', label: 'Text' },
  { type: 'photo', label: 'Photo' },
  { type: 'photoSlideshow', label: 'Photo Slideshow' },
  { type: 'userForm', label: 'User Form' },
  { type: 'wheelInfographic', label: 'Wheel Infographic' },
];

export function FlexColumnsBlock({ section }) {
  const f = section.fields || {};
  const cols = Array.isArray(f.flexCols) ? f.flexCols : [];
  // flexCols.length is authoritative (each entry is one grid slot) — fall
  // back to section.columns only when flexCols is empty, which shouldn't
  // normally happen.
  const colCount = Math.min(Math.max(cols.length || Number(section.columns) || 2, 1), 4);
  return (
    <section id={section.id} style={{ background: BG_VAR[section.bg] || 'var(--sb-linen)', padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.2rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ fontSize: '0.96rem', lineHeight: 1.8, color: '#4a4a4a', maxWidth: 740, marginBottom: '2.5rem' }}>{f.intro}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: '2rem' }}>
          {cols.map((col) => {
            const Widget = WIDGET_REGISTRY[col.widgetType] || WIDGET_REGISTRY.text;
            return <Widget key={col.id} config={col.config} />;
          })}
        </div>
      </div>
    </section>
  );
}
