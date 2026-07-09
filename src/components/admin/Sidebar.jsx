import React from 'react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { styles } from './adminStyles.js';
import SectionLayoutFields from './SectionLayoutFields.jsx';

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
  onExpandSection,
  onAddPage,
  onAddSection,
  onDeleteSection,
  onCycleSectionStatus,
  onDeletePage,
  onReorderSections,
  onUpdateSection,
}) {
  const [openId, setOpenId] = React.useState(null);
  const pages = Object.entries(site?.pages || {}).sort(
    (a, b) => (a[1].order ?? 0) - (b[1].order ?? 0)
  );
  const currentPage = site?.pages?.[currentPageKey];
  const sections = currentPage?.sections || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Reordering here (rather than the dedicated Layout view) means the preview
  // pane is very likely visible right alongside this panel (Split/Preview
  // Only views) — no extra "refresh" step is needed for the preview to show
  // the new order: onReorderSections patches the same draft state PreviewPane
  // already renders reactively from, so it re-renders on the next tick along
  // with everything else that reads draft.pages[key].sections.
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorderSections(arrayMove(sections, oldIndex, newIndex));
  }

  // Expanding a row's layout settings must also make it the *current* section
  // (onExpandSection sets currentSectionId without the mobile-drawer-closing
  // side effect onSelectSection carries) — SectionLayoutFields' onUpdate is
  // AdminShell's updateSection, which patches whichever section currentSectionId
  // points at, not an explicit id. Without this, editing a just-expanded row
  // while currentSectionId still pointed at a previously-selected section
  // would silently patch the wrong section.
  function toggleOpen(id) {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) onExpandSection(id);
  }

  return (
    <div style={styles.sidebar}>

      {/* ── Pages (fixed, non-scrolling) ─────────────────────────────── */}
      {/* One row per page — this list is exactly the top-level public nav.
          A page's sub-nav (e.g. "Consulting"'s dropdown) comes from that
          page's own sections, each toggled on via section.navSubPage in the
          Section Settings panel — not from anything configured here. */}
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
                {pg.navLabel || pg.name}
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((sec) => (
              <SortableSectionRow
                key={sec.id}
                section={sec}
                active={sec.id === currentSectionId}
                open={openId === sec.id}
                onSelect={() => onSelectSection(sec.id)}
                onToggleOpen={() => toggleOpen(sec.id)}
                onCycleSectionStatus={onCycleSectionStatus}
                onDeleteSection={onDeleteSection}
                onUpdateSection={onUpdateSection}
              />
            ))}
          </SortableContext>
        </DndContext>
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

function SortableSectionRow({ section, active, open, onSelect, onToggleOpen, onCycleSectionStatus, onDeleteSection, onUpdateSection }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const b = BADGE_MAP[section.status] || BADGE_MAP.live;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={onSelect}
        style={{ ...styles.secItem, ...(active ? styles.secItemActive : null) }}
      >
        <span
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          style={{ color: 'var(--sb-teal-deep)', fontSize: '0.7rem', cursor: 'grab', touchAction: 'none' }}
        >⋮⋮</span>
        <span className={`sb-badge ${b.cls}`} style={{ fontSize: '0.55rem' }}>{b.txt}</span>
        <span style={{ fontSize: '0.8rem', flex: 1, color: 'var(--sb-sage)' }}>{section.name}</span>
        {section.navSubPage && (
          <span title="Shows as a sub-page link in the nav" style={{ fontSize: '0.62rem', color: 'var(--sb-gold)' }}>▾ nav</span>
        )}
        <button
          title="Layout settings"
          onClick={(e) => { e.stopPropagation(); onToggleOpen(); }}
          style={{ ...iconBtn, color: open ? 'var(--sb-gold)' : 'var(--sb-teal-deep)' }}
        >{open ? '▲' : '▼'}</button>
        <button
          title="Cycle status"
          onClick={(e) => { e.stopPropagation(); onCycleSectionStatus(section.id); }}
          style={iconBtn}
        >↻</button>
        <button
          title="Delete"
          onClick={(e) => { e.stopPropagation(); if (confirm(`Remove section "${section.name}"?`)) onDeleteSection(section.id); }}
          style={{ ...iconBtn, color: 'var(--sb-risk-critical)' }}
        >✕</button>
      </div>
      {open && (
        <div style={{ padding: '0.75rem 0.6rem 1rem', marginBottom: '0.3rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--sb-radius)' }}>
          <SectionLayoutFields section={section} onUpdate={onUpdateSection} />
        </div>
      )}
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
