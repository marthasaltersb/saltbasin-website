import React from 'react';
import { styles } from './adminStyles.js';

// Default layout config — absence of section.layout is equivalent to this,
// so sections created before this feature existed render unchanged.
export const DEFAULT_LAYOUT = {
  width: 'full',
  height: { mode: 'auto', px: null },
  padding: { mode: 'default', top: null, bottom: null },
  columnGap: null, // reserved for a future phase — not exposed in this UI (see SectionShell.jsx)
};

export function getLayout(section) {
  const l = section?.layout || {};
  return {
    width: l.width || DEFAULT_LAYOUT.width,
    height: { mode: l.height?.mode || 'auto', px: l.height?.px ?? null },
    padding: { mode: l.padding?.mode || 'default', top: l.padding?.top ?? null, bottom: l.padding?.bottom ?? null },
    columnGap: l.columnGap ?? null,
  };
}

const WIDTH_OPTS = [
  { val: 'full', label: 'Full' },
  { val: 'contained', label: 'Contained' },
  { val: 'narrow', label: 'Narrow' },
];

const BG_OPTS = ['ivory', 'navy', 'linen', 'teal', 'cream'];
const COLUMN_OPTS = [1, 2, 3, 4];

// Mirrors the [data-theme] blocks in src/brand.css. Empty value = inherit
// whatever theme the page root (PublicSite.jsx / PublicProfile.jsx) is set
// to — most sections should leave this alone; it's for the rare section that
// needs to break from the page's theme on purpose (e.g. a single dark
// spotlight band inside an otherwise light page).
const SECTION_THEME_OPTS = [
  { val: '', label: 'Inherit page theme' },
  { val: 'strategic', label: 'Strategic Operator' },
  { val: 'glow-light', label: 'Glow — Light' },
  { val: 'glow-dark', label: 'Glow — Dark' },
  { val: 'momentum-warm', label: 'Momentum — Warm' },
  { val: 'lagoon', label: 'Lagoon' },
];

function segBtnStyle(selected) {
  return {
    padding: '0.35rem 0.75rem',
    background: selected ? 'var(--sb-admin-gold-tint)' : 'transparent',
    border: '0.5px solid var(--sb-admin-border-strong)',
    borderRadius: 'var(--sb-radius)',
    color: selected ? 'var(--sb-admin-gold-warm)' : 'var(--sb-admin-text-soft)',
    fontSize: '0.68rem',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    fontFamily: 'var(--sb-font-body)',
  };
}

const smallLabel = { ...styles.fieldLabel, fontSize: '0.6rem', marginBottom: '0.3rem' };

// Presentational layout/theme editor for a section. `onUpdate` is expected to
// be AdminShell's updateSection: a shallow-merge patch function that special-
// cases `layoutPatch` by merging it into the *live* section.layout itself
// (see AdminShell.updateSection). Controls here send only the single layout
// key they own via `layoutPatch` — never a pre-merged full layout object —
// so that two controls patched in the same tick (before React re-renders)
// can't clobber each other by each closing over the same stale `layout` prop.
export default function SectionLayoutFields({ section, onUpdate }) {
  const layout = getLayout(section);

  function patchLayout(patch) {
    onUpdate({ layoutPatch: patch });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Width</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {WIDTH_OPTS.map((o) => (
            <button key={o.val} type="button" onClick={() => patchLayout({ width: o.val })} style={segBtnStyle(layout.width === o.val)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Height</label>
        <div style={{ display: 'flex', gap: 4, marginBottom: layout.height.mode === 'fixed' ? '0.5rem' : 0 }}>
          <button type="button" onClick={() => patchLayout({ height: { mode: 'auto', px: null } })} style={segBtnStyle(layout.height.mode === 'auto')}>
            Auto
          </button>
          <button type="button" onClick={() => patchLayout({ height: { mode: 'fixed', px: layout.height.px || 480 } })} style={segBtnStyle(layout.height.mode === 'fixed')}>
            Fixed (min-height)
          </button>
        </div>
        {layout.height.mode === 'fixed' && (
          <input
            type="number"
            className="sb-input"
            style={{ fontSize: '0.75rem', maxWidth: 140 }}
            value={layout.height.px ?? ''}
            min={0}
            placeholder="Height in px"
            onChange={(e) => patchLayout({ height: { mode: 'fixed', px: e.target.value === '' ? null : Number(e.target.value) } })}
          />
        )}
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Padding</label>
        <div style={{ display: 'flex', gap: 4, marginBottom: layout.padding.mode === 'custom' ? '0.5rem' : 0 }}>
          <button type="button" onClick={() => patchLayout({ padding: { mode: 'default', top: null, bottom: null } })} style={segBtnStyle(layout.padding.mode === 'default')}>
            Default
          </button>
          <button
            type="button"
            onClick={() => patchLayout({ padding: { mode: 'custom', top: layout.padding.top ?? 80, bottom: layout.padding.bottom ?? 80 } })}
            style={segBtnStyle(layout.padding.mode === 'custom')}
          >
            Custom
          </button>
        </div>
        {layout.padding.mode === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={smallLabel}>Top (px)</label>
              <input
                type="number"
                className="sb-input"
                style={{ fontSize: '0.75rem' }}
                value={layout.padding.top ?? ''}
                min={0}
                onChange={(e) => patchLayout({ padding: { ...layout.padding, top: e.target.value === '' ? null : Number(e.target.value) } })}
              />
            </div>
            <div>
              <label style={smallLabel}>Bottom (px)</label>
              <input
                type="number"
                className="sb-input"
                style={{ fontSize: '0.75rem' }}
                value={layout.padding.bottom ?? ''}
                min={0}
                onChange={(e) => patchLayout({ padding: { ...layout.padding, bottom: e.target.value === '' ? null : Number(e.target.value) } })}
              />
            </div>
          </div>
        )}
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Columns</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {COLUMN_OPTS.map((n) => (
            <button key={n} type="button" onClick={() => onUpdate({ columns: n })} style={segBtnStyle((section.columns || 1) === n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Background</label>
        <select className="sb-input" value={section.bg || 'ivory'} onChange={(e) => onUpdate({ bg: e.target.value })}>
          {BG_OPTS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div style={{ ...styles.fieldGroup, marginBottom: 0 }}>
        <label style={styles.fieldLabel}>Section Theme</label>
        <select className="sb-input" value={section.theme || ''} onChange={(e) => onUpdate({ theme: e.target.value || null })}>
          {SECTION_THEME_OPTS.map((t) => (
            <option key={t.val} value={t.val}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
