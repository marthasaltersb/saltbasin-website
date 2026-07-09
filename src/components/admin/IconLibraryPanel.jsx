import React from 'react';
import Icon, { ICON_CATEGORIES, listIcons } from '../../lib/iconRegistry.jsx';

// Drag source: the browsable palette of every icon in the registry (river
// system, hot pink special-situation, metric icons). Each tile is a native
// HTML5 drag source carrying its icon key on the 'application/x-sb-icon'
// MIME type — IconPickerField in EditorPane.jsx (and any future drop target)
// reads that off `e.dataTransfer` on drop. Tiles are also clickable via
// `onPick`, so the palette works the same whether a user drags or clicks.
export default function IconLibraryPanel({ onPick, activeName }) {
  return (
    <div
      style={{
        padding: '0.85rem',
        background: 'var(--sb-navy)',
        border: '0.5px solid rgba(196,132,58,0.25)',
        borderRadius: 'var(--sb-radius)',
        maxHeight: 380,
        overflowY: 'auto',
      }}
    >
      {Object.entries(ICON_CATEGORIES).map(([catKey, catLabel]) => (
        <div key={catKey} style={{ marginBottom: '1rem' }}>
          <div
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.6rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--sb-teal)',
              marginBottom: '0.5rem',
            }}
          >
            {catLabel}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: '0.4rem' }}>
            {listIcons(catKey).map((def) => (
              <div
                key={def.key}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-sb-icon', def.key);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onPick?.(def.key)}
                title={`${def.label} — ${def.meaning}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.4rem 0.2rem',
                  borderRadius: 'var(--sb-radius)',
                  cursor: 'grab',
                  border: activeName === def.key ? '1.5px solid var(--sb-gold)' : '0.5px solid transparent',
                  background: activeName === def.key ? 'rgba(196,132,58,0.12)' : 'transparent',
                }}
              >
                <Icon name={def.key} size={22} />
                <span
                  style={{
                    fontSize: '0.52rem',
                    color: 'var(--sb-dusty)',
                    textAlign: 'center',
                    lineHeight: 1.15,
                    wordBreak: 'break-word',
                  }}
                >
                  {def.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)', lineHeight: 1.5, marginTop: '0.25rem' }}>
        Drag an icon onto any Icon field, or click a tile to assign it directly.
      </div>
    </div>
  );
}
