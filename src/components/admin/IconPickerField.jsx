import React from 'react';
import Icon from '../../lib/iconRegistry.jsx';
import IconLibraryPanel from './IconLibraryPanel.jsx';

// Icon field control — a drop target for IconLibraryPanel's drag source,
// plus a click-to-browse popover for the same palette. Value stored is just
// the icon registry key (e.g. "anchor", "AUM"), resolved back to artwork by
// <Icon name={value} /> wherever the section actually renders.
export default function IconPickerField({ value, onChange }) {
  const [browsing, setBrowsing] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const key = e.dataTransfer.getData('application/x-sb-icon');
    if (key) onChange(key);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          padding: '0.75rem',
          background: 'var(--sb-admin-surface)',
          border: dragOver ? '1.5px dashed var(--sb-admin-gold)' : '0.5px solid var(--sb-admin-border-strong)',
          borderRadius: 'var(--sb-radius)',
          transition: 'border-color 0.15s',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: 'var(--sb-admin-surface-alt)',
            border: '0.5px solid var(--sb-admin-border)',
            borderRadius: 'var(--sb-radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {value ? <Icon name={value} size={26} /> : (
            <span style={{ fontSize: '0.6rem', color: 'var(--sb-admin-teal-deep)' }}>None</span>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="sb-btn sb-btn-gold"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.68rem' }}
              onClick={() => setBrowsing((b) => !b)}
            >
              {browsing ? 'Close' : 'Choose Icon'}
            </button>
            {value && (
              <button
                type="button"
                className="sb-btn sb-btn-outline"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.68rem' }}
                onClick={() => onChange('')}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sb-admin-text-soft)' }}>
            {value ? value : 'Drag an icon here from the library, or browse.'}
          </div>
        </div>
      </div>
      {browsing && (
        <div style={{ marginTop: '0.5rem' }}>
          <IconLibraryPanel
            activeName={value}
            onPick={(key) => { onChange(key); setBrowsing(false); }}
          />
        </div>
      )}
    </div>
  );
}
