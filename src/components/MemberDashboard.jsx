import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast.js';
import { RenderSection } from './blocks/index.jsx';

const STATUS_CYCLE = ['live', 'draft', 'soon'];

// Minimal Phase-2 member dashboard: list sections, edit fields, save & publish.
// Rich block / drag-drop editing comes in Phase 3.
export default function MemberDashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);     // { slug, draft, published }
  const [draft, setDraft] = useState(null);   // the live in-progress copy
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then((r) => r.json());
      if (!me.user) return nav('/admin/login', { replace: true });
      if (me.user.role === 'admin') return nav('/admin', { replace: true });
      const p = await fetch('/api/members/me/profile', { credentials: 'include' }).then((r) =>
        r.json()
      );
      const c = await fetch('/api/config/public').then((r) => r.json()).catch(() => null);
      setData(p);
      setDraft(p.draft);
      setConfig(c);
      if (p.draft?.profile?.sections?.[0]) setCurrentSectionId(p.draft.profile.sections[0].id);
    })();
  }, [nav]);

  if (!draft) return null;

  function patch(updater) {
    setDraft((d) => updater(JSON.parse(JSON.stringify(d))));
  }
  const sections = draft.profile.sections || [];
  const currentSection = sections.find((s) => s.id === currentSectionId);

  async function save() {
    const res = await fetch('/api/members/me/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) toast('Draft saved');
    else toast('Save failed');
  }

  async function publish() {
    await save();
    const res = await fetch('/api/members/me/profile/publish', {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) toast(`Published → /u/${data.slug}`);
    else toast('Publish failed');
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    nav('/admin/login', { replace: true });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--sb-navy)', color: 'var(--sb-cream)' }}>
      <div
        style={{
          padding: '0 1.5rem',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--sb-navy-deep)',
          borderBottom: '0.5px solid rgba(196,132,58,0.25)',
        }}
      >
        <div>
          <div className="sb-display" style={{ fontSize: '1.1rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {draft.profile.displayName}
          </div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
            Operator Profile · /u/{data.slug}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/u/${data.slug}`} target="_blank" className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}>
            View Public
          </Link>
          <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={save}>
            Save Draft
          </button>
          <button className="sb-btn sb-btn-gold" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={publish}>
            Publish ↗
          </button>
          <button className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Section list */}
        <div style={{ width: 240, background: 'var(--sb-navy-deep)', borderRight: '0.5px solid rgba(196,132,58,0.18)', padding: '1rem', overflowY: 'auto' }}>
          <div className="sb-eyebrow" style={{ marginBottom: '0.75rem' }}>
            Sections
          </div>
          {sections.map((sec) => (
            <div
              key={sec.id}
              onClick={() => setCurrentSectionId(sec.id)}
              style={{
                padding: '0.5rem 0.65rem',
                marginBottom: 2,
                borderRadius: 'var(--sb-radius)',
                cursor: 'pointer',
                background: sec.id === currentSectionId ? 'rgba(196,132,58,0.12)' : 'transparent',
                border: sec.id === currentSectionId ? '0.5px solid rgba(196,132,58,0.25)' : '0.5px solid transparent',
                fontSize: '0.85rem',
                color: 'var(--sb-sage)',
              }}
            >
              <span
                style={{
                  fontSize: '0.55rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '1px 5px',
                  borderRadius: 'var(--sb-radius)',
                  marginRight: '0.5rem',
                  background:
                    sec.status === 'live'
                      ? 'rgba(168,184,154,0.2)'
                      : sec.status === 'draft'
                      ? 'rgba(139,155,174,0.15)'
                      : 'rgba(196,132,58,0.15)',
                  color:
                    sec.status === 'live'
                      ? 'var(--sb-green)'
                      : sec.status === 'draft'
                      ? 'var(--sb-dusty)'
                      : 'var(--sb-gold)',
                }}
              >
                {sec.status}
              </span>
              {sec.name}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', borderRight: '0.5px solid rgba(196,132,58,0.15)' }}>
          {currentSection ? (
            <SectionFieldEditor
              section={currentSection}
              onChange={(patched) => {
                patch((d) => {
                  const idx = d.profile.sections.findIndex((s) => s.id === currentSection.id);
                  if (idx >= 0) d.profile.sections[idx] = { ...d.profile.sections[idx], ...patched };
                  return d;
                });
              }}
              onCycleStatus={() => {
                patch((d) => {
                  const idx = d.profile.sections.findIndex((s) => s.id === currentSection.id);
                  if (idx >= 0) {
                    const cur = d.profile.sections[idx].status;
                    d.profile.sections[idx].status =
                      STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % 3];
                  }
                  return d;
                });
              }}
            />
          ) : (
            <div style={{ color: 'var(--sb-dusty)', padding: '2rem', textAlign: 'center' }}>
              Pick a section to edit.
            </div>
          )}
        </div>

        {/* Preview */}
        <div style={{ width: '46%', minWidth: 380, background: 'var(--sb-ivory)', overflowY: 'auto', color: 'var(--sb-navy)' }}>
          {sections.map((sec) => (
            <RenderSection key={sec.id} section={sec} config={config} mode="preview" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionFieldEditor({ section, onChange, onCycleStatus }) {
  const LONG_KEYS = ['concept', 'intro', 'desc', 'p1', 'p2', 'p3', 'howIWork', 'aiBadge', 'subhead', 'message'];
  function patchField(k, v) {
    onChange({ fields: { ...section.fields, [k]: v } });
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div className="sb-eyebrow" style={{ marginBottom: 2 }}>Editing</div>
          <div className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-cream)' }}>
            {section.name}
          </div>
        </div>
        <button onClick={onCycleStatus} className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}>
          Status: {section.status}  ↻
        </button>
      </div>
      <div
        style={{
          background: 'var(--sb-navy-deep)',
          border: '0.5px solid rgba(196,132,58,0.18)',
          borderRadius: 'var(--sb-radius)',
          padding: '1.25rem',
        }}
      >
        {Object.entries(section.fields || {}).map(([k, v]) => {
          const isLong = LONG_KEYS.some((x) => k.toLowerCase().includes(x.toLowerCase())) || (typeof v === 'string' && v.length > 90);
          return (
            <div key={k} style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  fontFamily: 'var(--sb-font-label)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sb-dusty)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                {k}
              </label>
              {isLong ? (
                <textarea
                  className="sb-input sb-textarea"
                  value={v || ''}
                  onChange={(e) => patchField(k, e.target.value)}
                />
              ) : (
                <input className="sb-input" value={v || ''} onChange={(e) => patchField(k, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
