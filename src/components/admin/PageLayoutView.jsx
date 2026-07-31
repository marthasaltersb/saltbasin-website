import React from 'react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { styles } from './adminStyles.js';
import SectionLayoutFields, { getLayout } from './SectionLayoutFields.jsx';

const BADGE_MAP = {
  live: { cls: 'sb-badge-live', txt: '● Live' },
  draft: { cls: 'sb-badge-draft', txt: '◐ Draft' },
  soon: { cls: 'sb-badge-soon', txt: '◌ Soon' },
};

const WIDTH_LABEL = { full: 'Full', contained: 'Contained', narrow: 'Narrow' };

function humanType(type) {
  return String(type || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// Outline/layers view (Squarespace/Webflow-style), not a live WYSIWYG canvas —
// rendering the fully hydrated blocks here would fight dnd-kit's pointer
// sensor for interactive elements inside blocks like OutputGeneratorBlock /
// ReferencesRequestBlock, and is wasteful for what's meant to be a reorder +
// settings surface.
export default function PageLayoutView({ page, currentSectionId, onSelectSection, onReorderSections, onUpdateSection }) {
  const [openId, setOpenId] = React.useState(null);
  const sections = page?.sections || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorderSections(arrayMove(sections, oldIndex, newIndex));
  }

  function handleCardClick(id) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    onSelectSection(id);
  }

  if (!page) {
    return (
      <div style={{ ...styles.editorPane, alignItems: 'center', justifyContent: 'center', color: 'var(--sb-admin-teal-deep)' }}>
        Select a page to view its layout.
      </div>
    );
  }

  return (
    <div style={styles.editorPane}>
      <div style={styles.editorHeader}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-admin-text-soft)' }}>
          Page Layout — {page.name}
        </div>
      </div>
      <div style={{ ...styles.editorBody, maxWidth: 620 }}>
        {sections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--sb-admin-teal-deep)' }}>
            This page has no sections yet.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((sec) => (
                <SortableSectionCard
                  key={sec.id}
                  section={sec}
                  active={sec.id === currentSectionId}
                  open={openId === sec.id}
                  onClick={() => handleCardClick(sec.id)}
                  onUpdate={onUpdateSection}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function SortableSectionCard({ section, active, open, onClick, onUpdate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const layout = getLayout(section);
  const b = BADGE_MAP[section.status] || BADGE_MAP.live;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...styles.card,
    marginBottom: '0.6rem',
    ...(active ? { border: '0.5px solid rgba(196,132,58,0.4)' } : null),
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={onClick}>
        <span
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'grab', color: 'var(--sb-admin-teal-deep)', fontSize: '0.85rem', padding: '0 0.2rem', touchAction: 'none' }}
        >
          ⋮⋮
        </span>
        <span className={`sb-badge ${b.cls}`} style={{ fontSize: '0.55rem' }}>{b.txt}</span>
        <span style={{ flex: 1, fontSize: '0.85rem', color: active ? 'var(--sb-admin-gold-warm)' : 'var(--sb-admin-text)' }}>
          {section.name}
          <span style={{ marginLeft: 8, fontSize: '0.68rem', color: 'var(--sb-admin-text-soft)' }}>{humanType(section.type)}</span>
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--sb-admin-text-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {WIDTH_LABEL[layout.width]} · {section.columns || 1}col · {section.bg || 'ivory'}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--sb-admin-teal-deep)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '0.5px solid rgba(196,132,58,0.15)' }}>
          <SectionLayoutFields section={section} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}
