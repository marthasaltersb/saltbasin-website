import React, { useState } from 'react';
import HerqPanel from './HerqPanel.jsx';
import ServicesPanel from './ServicesPanel.jsx';
import GlobalStandardsPanel from './GlobalStandardsPanel.jsx';

const SUB_TABS = [
  { id: 'herq',     label: 'HERQ',     mode: 'herq'       },
  { id: 'services', label: 'Services', mode: 'strategic'  },
  { id: 'standards',label: 'Standards',mode: 'strategic'  },
];

export default function ContentManagerShell() {
  const [active, setActive] = useState('herq');

  const current = SUB_TABS.find(t => t.id === active) || SUB_TABS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '0.5px solid rgba(196,132,58,0.18)', background: 'var(--sb-navy-deep)', padding: '0 1.25rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-dusty)', fontFamily: 'var(--sb-font-label)', marginRight: '1rem' }}>Content Manager</span>
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding: '0.65rem 1.1rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--sb-font-label)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: active === t.id ? 'var(--sb-gold)' : 'var(--sb-dusty)',
              border: 'none',
              borderBottom: active === t.id ? '2px solid var(--sb-gold)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: -1,
            }}
          >
            {t.id === 'herq' && <span style={{ marginRight: '0.4rem', fontSize: '0.62rem' }}>◈</span>}
            {t.label}
          </button>
        ))}
      </div>

      {/* Sub-app content */}
      <div
        data-brand-mode={current.mode}
        style={{ flex: 1, overflowY: 'auto', background: current.mode === 'herq' ? 'var(--herq-bg, #F5F0E8)' : undefined }}
      >
        {active === 'herq'     && <HerqPanel />}
        {active === 'services' && <ServicesPanel />}
        {active === 'standards'&& <GlobalStandardsPanel />}
      </div>
    </div>
  );
}
