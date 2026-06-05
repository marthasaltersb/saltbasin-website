import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { styles } from './adminStyles.js';
import Sidebar from './Sidebar.jsx';
import EditorPane from './EditorPane.jsx';
import PreviewPane from './PreviewPane.jsx';
import ConfigPanel from './ConfigPanel.jsx';
import LeadsPanel from './LeadsPanel.jsx';

const STATUS_CYCLE = ['live', 'draft', 'soon'];

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function AdminShell() {
  const nav = useNavigate();
  const [savedSite, setSavedSite] = useState(null); // last server-confirmed draft
  const [draft, setDraft] = useState(null); // local in-progress draft
  const [savedConfig, setSavedConfig] = useState(null);
  const [configDraft, setConfigDraft] = useState(null);

  const [tab, setTab] = useState('content'); // 'content' | 'config'
  const [view, setView] = useState('split'); // 'split' | 'editor' | 'preview'

  const [currentPageKey, setCurrentPageKey] = useState('home');
  const [currentSectionId, setCurrentSectionId] = useState(null);
  // On desktop the sidebar is always visible; on mobile it slides over.
  // Default starts visible so first-time users can find pages.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [pageModal, setPageModal] = useState(null);
  const [sectionModal, setSectionModal] = useState(null);

  // ── Load ──
  useEffect(() => {
    Promise.all([api.getDraftSite(), api.getDraftConfig()])
      .then(([site, cfg]) => {
        setSavedSite(site);
        setDraft(site);
        setSavedConfig(cfg);
        setConfigDraft(cfg);
        const firstPage = Object.keys(site.pages)[0];
        if (firstPage) setCurrentPageKey(firstPage);
      })
      .catch((e) => toast('Failed to load: ' + e.message));
  }, []);

  // ── Derived ──
  const currentPage = draft?.pages?.[currentPageKey];
  const currentSection = currentPage?.sections?.find((s) => s.id === currentSectionId);
  const siteDirty = useMemo(() => !deepEqual(savedSite, draft), [savedSite, draft]);
  const configDirty = useMemo(() => !deepEqual(savedConfig, configDraft), [savedConfig, configDraft]);
  const dirty = siteDirty || configDirty;

  // ── Mutators (draft only) ──
  function patchDraft(updater) {
    setDraft((d) => updater(JSON.parse(JSON.stringify(d))));
  }

  function updateSection(patch) {
    patchDraft((d) => {
      const pg = d.pages[currentPageKey];
      const idx = pg.sections.findIndex((s) => s.id === currentSectionId);
      if (idx < 0) return d;
      pg.sections[idx] = { ...pg.sections[idx], ...patch };
      return d;
    });
  }

  function updatePageStatus(status) {
    patchDraft((d) => {
      d.pages[currentPageKey].status = status;
      return d;
    });
  }

  function cycleSectionStatus(id) {
    patchDraft((d) => {
      const sec = d.pages[currentPageKey].sections.find((s) => s.id === id);
      if (!sec) return d;
      sec.status = STATUS_CYCLE[(STATUS_CYCLE.indexOf(sec.status) + 1) % 3];
      return d;
    });
  }

  function deleteSection(id) {
    patchDraft((d) => {
      const pg = d.pages[currentPageKey];
      pg.sections = pg.sections.filter((s) => s.id !== id);
      return d;
    });
    if (currentSectionId === id) setCurrentSectionId(null);
  }

  function deletePage(key) {
    if (Object.keys(draft.pages).length <= 1) {
      toast("Can't delete the only page");
      return;
    }
    patchDraft((d) => {
      delete d.pages[key];
      return d;
    });
    if (currentPageKey === key) {
      setCurrentPageKey(Object.keys(draft.pages).filter((k) => k !== key)[0]);
      setCurrentSectionId(null);
    }
  }

  function addPage({ name, slug, type, status }) {
    const key = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!key) return toast('Page needs a name');
    if (draft.pages[key]) return toast('A page with that slug already exists');
    patchDraft((d) => {
      const order = Object.keys(d.pages).length;
      d.pages[key] = {
        key,
        name,
        slug: slug || key,
        type,
        status,
        order,
        sections: [
          {
            id: `${key}-hero`,
            type: 'hero',
            name: 'Hero',
            status: 'live',
            bg: 'navy',
            fields: { heading: name, subtitle: 'Add your intro here.' },
          },
        ],
      };
      return d;
    });
    setCurrentPageKey(key);
    setPageModal(null);
    toast(`"${name}" page created`);
  }

  function addSection({ name, type, bg, status, desc }) {
    if (!name) return toast('Section needs a name');
    const id = `sec-${Date.now()}`;
    const baseFields = { heading: name, intro: desc || 'Add your content here.' };
    if (type === 'cards') {
      Object.assign(baseFields, {
        card1Title: 'Card One',
        card1Desc: 'Description.',
        card2Title: 'Card Two',
        card2Desc: 'Description.',
        card3Title: 'Card Three',
        card3Desc: 'Description.',
      });
    }
    if (type === 'cta') Object.assign(baseFields, { cta1: 'Learn More', cta1Link: '#contact' });
    if (type === 'hero') Object.assign(baseFields, { subtitle: '', cta1: 'Get Started', cta1Link: '#contact' });
    patchDraft((d) => {
      d.pages[currentPageKey].sections.push({ id, type, name, status, bg, fields: baseFields });
      return d;
    });
    setCurrentSectionId(id);
    setSectionModal(null);
    toast(`"${name}" added`);
  }

  // ── Save / Publish / Discard ──
  async function save() {
    try {
      if (siteDirty) {
        await api.saveDraftSite(draft);
        setSavedSite(draft);
      }
      if (configDirty) {
        await api.saveDraftConfig(configDraft);
        setSavedConfig(configDraft);
      }
      toast('Draft saved');
    } catch (e) {
      toast('Save failed: ' + e.message);
    }
  }

  async function publish() {
    if (dirty) {
      const yes = confirm(
        'You have unsaved changes. Save first, then publish? (Cancel to abort.)'
      );
      if (!yes) return;
      await save();
    } else {
      const yes = confirm('Promote the current draft to the public site?');
      if (!yes) return;
    }
    try {
      await api.publish();
      toast('Published ↗ Public site updated');
    } catch (e) {
      toast('Publish failed: ' + e.message);
    }
  }

  function discard() {
    if (!confirm('Discard all unsaved changes since the last save?')) return;
    setDraft(savedSite);
    setConfigDraft(savedConfig);
    toast('Reverted to last saved draft');
  }

  async function logout() {
    await api.logout();
    nav('/admin/login', { replace: true });
  }

  if (!draft || !configDraft) return null;

  return (
    <div style={styles.shell}>
      <div style={styles.topbar}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {tab === 'content' && (
            <button
              type="button"
              className="sb-admin-mobile-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? 'Hide pages list' : 'Show pages list'}
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          )}
          <div>
            <div
              className="sb-display"
              style={{
                fontSize: '1.1rem',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--sb-cream)',
              }}
            >
              Salt Basin Net Works
            </div>
            <div
              className="sb-toggle-hide-mobile"
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--sb-gold)',
                marginTop: 1,
              }}
            >
              Site Management Console
            </div>
          </div>
        </div>
        <div
          className="sb-admin-topbar-actions"
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <TabToggle
            items={[
              { val: 'content', label: 'Content' },
              { val: 'config', label: 'Config' },
              { val: 'leads', label: 'Leads' },
            ]}
            active={tab}
            onChange={setTab}
          />
          {tab === 'content' && (
            <span className="sb-toggle-hide-mobile">
              <TabToggle
                items={[
                  { val: 'split', label: 'Split' },
                  { val: 'editor', label: 'Edit Only' },
                  { val: 'preview', label: 'Preview Only' },
                ]}
                active={view}
                onChange={setView}
              />
            </span>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="sb-btn sb-btn-outline sb-toggle-hide-mobile"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}
          >
            View Public
          </a>
          <button
            className="sb-btn sb-btn-outline"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="sb-admin-workspace" style={styles.workspace}>
        {tab === 'leads' ? (
          <LeadsPanel />
        ) : tab === 'content' ? (
          <>
            <div className={`sb-admin-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
              <Sidebar
                site={draft}
                currentPageKey={currentPageKey}
                currentSectionId={currentSectionId}
                onSelectPage={(k) => {
                  setCurrentPageKey(k);
                  setCurrentSectionId(null);
                  setSidebarOpen(false);  // auto-close on mobile after selecting
                }}
                onSelectSection={(id) => {
                  setCurrentSectionId(id);
                  setSidebarOpen(false);
                }}
                onAddPage={() => setPageModal({ name: '', slug: '', type: 'standard', status: 'draft' })}
                onAddSection={() => setSectionModal({ name: '', type: 'text', bg: 'ivory', status: 'draft', desc: '' })}
                onDeleteSection={deleteSection}
                onCycleSectionStatus={cycleSectionStatus}
                onDeletePage={deletePage}
              />
            </div>
            {(view === 'split' || view === 'editor') && (
              <div className="sb-admin-editor" style={{ display: 'flex', flex: 1, minWidth: 0 }}>
                <EditorPane
                  section={currentSection}
                  page={currentPage}
                  onUpdateSection={updateSection}
                  onUpdatePageStatus={updatePageStatus}
                />
              </div>
            )}
            {(view === 'split' || view === 'preview') && (
              <div className="sb-admin-preview" style={{ display: 'flex' }}>
                <PreviewPane site={draft} config={configDraft} currentPageKey={currentPageKey} />
              </div>
            )}
          </>
        ) : (
          <ConfigPanel config={configDraft} onChange={setConfigDraft} />
        )}
      </div>

      {tab !== 'leads' && (
        <PublishBar
          dirty={dirty}
          siteDirty={siteDirty}
          configDirty={configDirty}
          onSave={save}
          onDiscard={discard}
          onPublish={publish}
        />
      )}

      {pageModal && (
        <PageModal
          value={pageModal}
          onChange={setPageModal}
          onSubmit={() => addPage(pageModal)}
          onCancel={() => setPageModal(null)}
        />
      )}
      {sectionModal && (
        <SectionModal
          value={sectionModal}
          onChange={setSectionModal}
          onSubmit={() => addSection(sectionModal)}
          onCancel={() => setSectionModal(null)}
        />
      )}
    </div>
  );
}

function PublishBar({ dirty, siteDirty, configDirty, onSave, onDiscard, onPublish }) {
  const status = dirty
    ? `Unsaved: ${siteDirty ? 'content' : ''}${siteDirty && configDirty ? ' + ' : ''}${
        configDirty ? 'config' : ''
      }`
    : 'All changes saved';
  return (
    <div style={styles.saveBar}>
      <span style={{ flex: 1, fontSize: '0.78rem', color: dirty ? 'var(--sb-gold)' : 'var(--sb-green)' }}>
        {status}
      </span>
      <button
        className="sb-btn sb-btn-outline"
        style={{ padding: '0.5rem 1.1rem', fontSize: '0.72rem' }}
        onClick={onDiscard}
        disabled={!dirty}
      >
        Discard
      </button>
      <button
        className="sb-btn sb-btn-outline"
        style={{ padding: '0.5rem 1.1rem', fontSize: '0.72rem' }}
        onClick={onSave}
        disabled={!dirty}
      >
        Save Draft
      </button>
      <button
        className="sb-btn sb-btn-gold"
        style={{ padding: '0.5rem 1.25rem', fontSize: '0.72rem' }}
        onClick={onPublish}
      >
        Publish ↗
      </button>
    </div>
  );
}

function TabToggle({ items, active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        border: '0.5px solid rgba(181,196,193,0.2)',
        borderRadius: 'var(--sb-radius)',
        overflow: 'hidden',
      }}
    >
      {items.map((it) => (
        <button
          key={it.val}
          onClick={() => onChange(it.val)}
          style={{
            padding: '0.4rem 0.9rem',
            background: active === it.val ? 'var(--sb-gold)' : 'transparent',
            color: active === it.val ? 'var(--sb-ivory)' : 'var(--sb-dusty)',
            border: 'none',
            fontFamily: 'var(--sb-font-body)',
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, children, onCancel, onSubmit, submitLabel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--sb-navy-deep)',
          border: '0.5px solid var(--sb-gold)',
          borderRadius: 'var(--sb-radius)',
          padding: '1.75rem',
          width: '100%',
          maxWidth: 460,
        }}
      >
        <div className="sb-display" style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--sb-cream)' }}>
          {title}
        </div>
        {children}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button className="sb-btn sb-btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className="sb-btn sb-btn-gold" onClick={onSubmit}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageModal({ value, onChange, onSubmit, onCancel }) {
  return (
    <Modal title="Add New Page" onCancel={onCancel} onSubmit={onSubmit} submitLabel="Create Page">
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Page Name</label>
        <input
          className="sb-input"
          value={value.name}
          autoFocus
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>URL Slug</label>
        <input
          className="sb-input"
          value={value.slug}
          onChange={(e) => onChange({ ...value, slug: e.target.value })}
          placeholder="e.g. portfolio"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>Type</label>
          <select className="sb-input" value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value })}>
            <option value="standard">Standard</option>
            <option value="landing">Landing</option>
            <option value="blog">Blog</option>
            <option value="shop">Shop</option>
          </select>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>Initial Status</label>
          <select className="sb-input" value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="soon">Coming Soon</option>
            <option value="live">Live</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

function SectionModal({ value, onChange, onSubmit, onCancel }) {
  return (
    <Modal title="Add New Section" onCancel={onCancel} onSubmit={onSubmit} submitLabel="Add Section">
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Section Name</label>
        <input
          className="sb-input"
          value={value.name}
          autoFocus
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>Type</label>
          <select className="sb-input" value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value })}>
            <option value="text">Text</option>
            <option value="hero">Hero</option>
            <option value="cards">Cards</option>
            <option value="cta">Call to Action</option>
            <option value="twoCol">Two Column</option>
            <option value="scripture">Scripture Band</option>
            <option value="socialGrid">Social Grid</option>
            <option value="contact">Contact</option>
          </select>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>Background</label>
          <select className="sb-input" value={value.bg} onChange={(e) => onChange({ ...value, bg: e.target.value })}>
            <option value="ivory">Ivory</option>
            <option value="navy">Navy</option>
            <option value="linen">Linen</option>
            <option value="teal">Teal</option>
            <option value="cream">Cream</option>
          </select>
        </div>
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Initial Status</label>
        <select className="sb-input" value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="soon">Coming Soon</option>
          <option value="live">Live</option>
        </select>
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.fieldLabel}>Intro / description</label>
        <textarea
          className="sb-input sb-textarea"
          value={value.desc}
          onChange={(e) => onChange({ ...value, desc: e.target.value })}
        />
      </div>
    </Modal>
  );
}
