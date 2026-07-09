// Small shared helpers used by multiple block files. Extracted here (rather
// than left inline in index.jsx) so ColumnWidgets.jsx can reuse them without
// a circular import between the two files.
import React from 'react';

export function useViewportWidth() {
  const [w, setW] = React.useState(
    typeof window === 'undefined' ? 1200 : window.innerWidth
  );
  React.useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

export function PanelCard({ title, children, headerRight, style }) {
  return (
    <div
      style={{
        background: 'white',
        border: '0.5px solid var(--sb-taupe)',
        borderTop: '2px solid var(--sb-gold)',
        borderRadius: 'var(--sb-radius)',
        padding: '1.25rem 1.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '0.5px solid rgba(196,132,58,0.18)',
        }}
      >
        <div
          className="sb-label"
          style={{ color: 'var(--sb-gold)', fontSize: '0.62rem', letterSpacing: '0.18em' }}
        >
          {title}
        </div>
        {headerRight}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
