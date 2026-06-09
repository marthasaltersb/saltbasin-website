import React from 'react';
import { styles } from './adminStyles.js';

const BADGE_MAP = {
  live: { cls: 'sb-badge-live', txt: '● Live' },
  draft: { cls: 'sb-badge-draft', txt: '◐ Draft' },
  soon: { cls: 'sb-badge-soon', txt: '◌ Soon' },
};

export default function Sidebar({
  site,
  currentPageKey,
  currentSectionId,
  onSelectPage,
  onSelectSection,
  onAddPage,
  onAddSection,
  onDeleteSection,
  onCycleSectionStatus,
  onDeletePage,
}) {
  const pages = Object.entries(site?.pages || {}).sort(
    (a, b) => (a[1].order ?? 0) - (b[1].order ?? 0)
  );
  const currentPage = site?.pages?.[currentPageKey];

  return (
    <div style={styles.sidebar}>

      {/* ── Pages (fixed, non-scrolling) ─────────────────────────────── */}
      <div style={{ ...styles.sidebarSection, flexShrink: 0 }}>
        <div style={styles.sidebarLabel}>Pages</div>
        {pages.map(([key, pg]) => {
          const b = BADGE_MAP[pg.status] || BADGE_MAP.live;
          const active = key === currentPageKey;
          return (
            <div
              key={key}
              onClick={() => onSelectPage(key)}
              style={{ ...styles.pageItem, ...(active ? styles.pageItemActive : null) }}
            >
              <span className={`sb-badge ${b.cls}`}>{b.txt}</span>
              <span style={{ fontSize: '0.83rem', flex: 1, color: active ? 'var(--sb-gold)' : 'var(--sb-sage)' }}>
                {pg.name}
              </span>
              <button
                title="Delete page"
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete page "${pg.name}"?`)) onDeletePage(key); }}
                style={iconBtn}
              >✕</button>
            </div>
          );
        })}
        <button style={styles.addBtn} onClick={onAddPage}>+ New Page</button>
      </div>

      <div style={{ height: '0.5px', background: 'rgba(196,132,58,0.15)', margin: '0.25rem 1rem', flexShrink: 0 }} />

      {/* ── Sections label (fixed) ────────────────────────────────────── */}
      <div style={{ padding: '0.75rem 1rem 0.25rem', flexShrink: 0 }}>
        <div style={styles.sidebarLabel}>
          Sections —{' '}
          <span style={{ color: 'var(--sb-cream)', textTransform: 'none', letterSpacing: 0, fontSize: '0.75rem' }}>
            {currentPage?.name || ''}
          </span>
        </div>
      </div>

      {/* ── Section list (scrollable, takes all remaining space) ─────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 0.5rem', minHeight: 0 }}>
        {(currentPage?.sections || []).map((sec) => {
          const b = BADGE_MAP[sec.status] || BADGE_MAP.live;
          const active = sec.id === currentSectionId;
          return (
            <div
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              style={{ ...styles.secItem, ...(active ? styles.secItemActive : null) }}
            >
              <span style={{ color: 'var(--sb-teal-deep)', fontSize: '0.7rem' }}>⋮⋮</span>
              <span className={`sb-badge ${b.cls}`} style={{ fontSize: '0.55rem' }}>{b.txt}</span>
              <span style={{ fontSize: '0.8rem', flex: 1, color: 'var(--sb-sage)' }}>{sec.name}</span>
              <button
                title="Cycle status"
                onClick={(e) => { e.stopPropagation(); onCycleSectionStatus(sec.id); }}
                style={iconBtn}
              >↻</button>
              <button
                title="Delete"
                onClick={(e) => { e.stopPropagation(); if (confirm(`Remove section "${sec.name}"?`)) onDeleteSection(sec.id); }}
                style={{ ...iconBtn, color: 'var(--sb-risk-critical)' }}
              >✕</button>
            </div>
          );
        })}
      </div>

      {/* ── Add Section button (pinned to bottom, always visible) ────── */}
      <div style={{ padding: '0.5rem 1rem 1rem', flexShrink: 0, borderTop: '0.5px solid rgba(196,132,58,0.12)' }}>
        <button style={{ ...styles.addBtn, width: '100%' }} onClick={onAddSection}>
          + Add Section
        </button>
      </div>

    </div>
  );
}

const iconBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--sb-teal-deep)',
  cursor: 'pointer',
  fontSize: '0.7rem',
  padding: '2px 4px',
  borderRadius: 'var(--sb-radius)',
};
