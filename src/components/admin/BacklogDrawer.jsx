// Right-side slide-over drawer that shows the full requirement detail for a
// backlog item — every field is editable inline. Save persists via PATCH.
//
// The drawer is intentionally tall and scrollable. Sections roughly map to
// the requirement structure Betsy asked for:
//   - Title + capability + status + kind + priority (header)
//   - User story
//   - Requirement detail
//   - Business rules
//   - Design spec
//   - Acceptance criteria
//   - Functional process steps
//   - Work split (% Claude) + time estimate
//   - Deploy relevance + deploy state (GH / Render / Netlify)
//   - Tags + external ref

import React, { useState, useEffect, useRef } from 'react';

const STATUSES = ['pending', 'in_progress', 'completed', 'deployed', 'blocked', 'archived'];
const KINDS    = ['feature', 'defect', 'chore', 'spike'];
const PRIORITIES = ['p0', 'p1', 'p2', 'p3'];

export default function BacklogDrawer({ item, groups, onClose, onPatch }) {
  // Local edit buffer; we commit on blur or via Save button.
  const [draft, setDraft] = useState(() => ({ ...item }));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Reset when a different item is opened.
  useEffect(() => { setDraft({ ...item }); setDirty(false); }, [item.id]);

  function set(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }

  async function save() {
    if (!dirty) return;
    setSaving(true);
    try {
      // Build a minimal patch: only the changed fields.
      const patch = {};
      for (const k of Object.keys(draftRef.current)) {
        if (JSON.stringify(draftRef.current[k]) !== JSON.stringify(item[k])) {
          patch[k] = draftRef.current[k];
        }
      }
      if (Object.keys(patch).length) await onPatch(patch);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  function setDeployRel(k, v) {
    const next = { ...(draft.deployRelevance || { github: true, render: true, netlify: true }) };
    next[k] = v;
    set('deployRelevance', next);
  }

  // ESC closes.
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const groupOptions = [{ id: '', name: '— No group —' }, ...groups];
  const rel = draft.deployRelevance || { github: true, render: true, netlify: true };

  return (
    <>
      {/* Backdrop — clickable to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1100,
        }}
      />
      {/* Drawer */}
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 720,
          background: 'var(--sb-navy-deep)', color: 'var(--sb-cream)',
          borderLeft: '0.5px solid rgba(196,132,58,0.4)',
          zIndex: 1101,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '0.5px solid rgba(196,132,58,0.18)',
            background: 'var(--sb-navy)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={draft.title || ''}
              onChange={(e) => set('title', e.target.value)}
              onBlur={save}
              className="sb-input"
              style={{
                background: 'transparent', border: 'none',
                fontFamily: 'var(--sb-font-display)', fontSize: '1.2rem',
                color: 'var(--sb-cream)', padding: 0, width: '100%',
                outline: 'none', letterSpacing: '0.02em',
              }}
            />
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginTop: 2 }}>
              Requirement · id #{item.id}
              {dirty && <span style={{ color: 'var(--sb-gold)', marginLeft: 8 }}>· unsaved</span>}
              {saving && <span style={{ color: 'var(--sb-dusty)', marginLeft: 8 }}>· saving…</span>}
            </div>
          </div>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="sb-btn sb-btn-gold"
            style={{ padding: '0.4rem 0.95rem', fontSize: '0.7rem' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="sb-btn sb-btn-outline"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {/* ── Meta row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Meta label="Capability">
              <select
                className="sb-input"
                value={draft.capabilityId || ''}
                onChange={(e) => set('capabilityId', e.target.value ? Number(e.target.value) : null)}
                onBlur={save}
                style={{ fontSize: '0.78rem' }}
              >
                {groupOptions.map((g) => (
                  <option key={g.id || 'none'} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Meta>
            <Meta label="Status">
              <select className="sb-input" value={draft.status} onChange={(e) => set('status', e.target.value)} onBlur={save} style={{ fontSize: '0.78rem' }}>
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </Meta>
            <Meta label="Kind">
              <select className="sb-input" value={draft.kind} onChange={(e) => set('kind', e.target.value)} onBlur={save} style={{ fontSize: '0.78rem' }}>
                {KINDS.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </Meta>
            <Meta label="Priority">
              <select className="sb-input" value={draft.priority || ''} onChange={(e) => set('priority', e.target.value || null)} onBlur={save} style={{ fontSize: '0.78rem' }}>
                <option value="">—</option>
                {PRIORITIES.map((p) => (<option key={p} value={p}>{p.toUpperCase()}</option>))}
              </select>
            </Meta>
          </div>

          {/* ── Summary ── */}
          <Section title="Summary (one-liner shown on card)">
            <textarea
              className="sb-input sb-textarea"
              value={draft.summary || ''}
              onChange={(e) => set('summary', e.target.value)}
              onBlur={save}
              rows={2}
            />
          </Section>

          {/* ── User Story ── */}
          <Section title="User Story" help="As <role>, I want <capability>, so that <outcome>.">
            <textarea
              className="sb-input sb-textarea"
              value={draft.userStory || ''}
              onChange={(e) => set('userStory', e.target.value)}
              onBlur={save}
              rows={3}
            />
          </Section>

          {/* ── Requirement Detail ── */}
          <Section title="Requirement Detail" help="What we built, in business terms.">
            <textarea
              className="sb-input sb-textarea"
              value={draft.requirementDetail || ''}
              onChange={(e) => set('requirementDetail', e.target.value)}
              onBlur={save}
              rows={6}
              style={{ minHeight: 120 }}
            />
          </Section>

          {/* ── Business Rules ── */}
          <Section title="Business Rules" help="The logic that governs behavior. One bullet per line, prefix with - or *.">
            <textarea
              className="sb-input sb-textarea"
              value={draft.businessRules || ''}
              onChange={(e) => set('businessRules', e.target.value)}
              onBlur={save}
              rows={5}
            />
          </Section>

          {/* ── Design Spec ── */}
          <Section title="Design Spec" help="UX / visual decisions.">
            <textarea
              className="sb-input sb-textarea"
              value={draft.designSpec || ''}
              onChange={(e) => set('designSpec', e.target.value)}
              onBlur={save}
              rows={4}
            />
          </Section>

          {/* ── Acceptance Criteria ── */}
          <Section title="Acceptance Criteria" help="Given / When / Then — what proves it works.">
            <textarea
              className="sb-input sb-textarea"
              value={draft.acceptanceCriteria || ''}
              onChange={(e) => set('acceptanceCriteria', e.target.value)}
              onBlur={save}
              rows={5}
            />
          </Section>

          {/* ── Process Steps ── */}
          <Section title="Functional Process Steps" help="Which user-facing flows this touches.">
            <textarea
              className="sb-input sb-textarea"
              value={draft.processSteps || ''}
              onChange={(e) => set('processSteps', e.target.value)}
              onBlur={save}
              rows={3}
            />
          </Section>

          {/* ── Hours + activities by person ── */}
          <Section title="Work split by person">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <PersonInput
                label="Betsy hours"
                value={draft.hoursBetsy}
                onChange={(v) => set('hoursBetsy', v)}
                onCommit={save}
                accent="var(--sb-sage)"
                hint="Time you spent — review, decisions, setup, DNS, signups."
              />
              <PersonInput
                label="Claude hours"
                value={draft.hoursClaude}
                onChange={(v) => set('hoursClaude', v)}
                onCommit={save}
                accent="var(--sb-gold)"
                hint="Time Claude spent — code, debugging, queries."
              />
              <PersonInput
                label="Betsy activities"
                value={draft.activitiesBetsy}
                onChange={(v) => set('activitiesBetsy', v)}
                onCommit={save}
                accent="var(--sb-sage)"
                integer
                hint="Discrete actions — clicks, approvals, manual steps."
              />
              <PersonInput
                label="Claude activities"
                value={draft.activitiesClaude}
                onChange={(v) => set('activitiesClaude', v)}
                onCommit={save}
                accent="var(--sb-gold)"
                integer
                hint="Discrete actions — edits, commits, tool calls."
              />
            </div>
            <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.7rem', background: 'rgba(196,132,58,0.06)', borderRadius: 'var(--sb-radius)', fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>
              {(() => {
                const hC = Number(draft.hoursClaude || 0);
                const hB = Number(draft.hoursBetsy || 0);
                const total = hC + hB;
                if (!total) return 'Total: —';
                const pctC = Math.round((hC / total) * 100);
                return `Total: ${total.toFixed(1)}h · Claude ${pctC}% · Betsy ${100 - pctC}%${draft.activitiesClaude != null ? ` · ${draft.activitiesClaude} + ${draft.activitiesBetsy || 0} = ${(draft.activitiesClaude || 0) + (draft.activitiesBetsy || 0)} activities` : ''}`;
              })()}
            </div>
          </Section>

          {/* ── Deploy state ── */}
          <Section title="Deployment State">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { sys: 'github',  field: 'deployedGithub',  label: 'GitHub' },
                { sys: 'render',  field: 'deployedRender',  label: 'Render' },
                { sys: 'netlify', field: 'deployedNetlify', label: 'Netlify' },
              ].map(({ sys, field, label }) => (
                <div
                  key={sys}
                  style={{
                    padding: '0.6rem',
                    background: 'rgba(245,240,232,0.03)',
                    border: '0.5px solid rgba(181,196,193,0.18)',
                    borderRadius: 'var(--sb-radius)',
                  }}
                >
                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-dusty)', marginBottom: 6 }}>
                    {label}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--sb-sage)', cursor: 'pointer', marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={!!rel[sys]}
                      onChange={(e) => setDeployRel(sys, e.target.checked)}
                      onBlur={save}
                    />
                    Relevant
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--sb-cream)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!draft[field]}
                      disabled={!rel[sys]}
                      onChange={(e) => set(field, e.target.checked)}
                      onBlur={save}
                    />
                    Deployed
                  </label>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Tags + external ref ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Section title="Tags (comma-separated)">
              <input
                className="sb-input"
                value={(draft.tags || []).join(', ')}
                onChange={(e) => set('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                onBlur={save}
                style={{ fontSize: '0.78rem' }}
              />
            </Section>
            <Section title="External reference (commit / task id)">
              <input
                className="sb-input"
                value={draft.externalRef || ''}
                onChange={(e) => set('externalRef', e.target.value)}
                onBlur={save}
                style={{ fontSize: '0.78rem' }}
              />
            </Section>
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({ title, help, children }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <div
        style={{
          fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--sb-gold)', marginBottom: 4,
        }}
      >
        {title}
      </div>
      {help && (
        <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: 6, lineHeight: 1.5 }}>
          {help}
        </div>
      )}
      {children}
    </div>
  );
}

function PersonInput({ label, value, onChange, onCommit, accent, integer, hint }) {
  return (
    <div
      style={{
        padding: '0.55rem 0.7rem',
        background: 'rgba(245,240,232,0.03)',
        border: '0.5px solid rgba(181,196,193,0.18)',
        borderLeft: `3px solid ${accent || 'var(--sb-gold)'}`,
        borderRadius: 'var(--sb-radius)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: accent || 'var(--sb-gold)' }}>
          {label}
        </span>
      </div>
      <input
        type="number"
        min="0"
        step={integer ? '1' : '0.25'}
        className="sb-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        onBlur={onCommit}
        style={{ fontSize: '1rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)' }}
      />
      {hint && (
        <div style={{ fontSize: '0.6rem', color: 'var(--sb-dusty)', marginTop: 3, lineHeight: 1.45 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Meta({ label, children }) {
  return (
    <div>
      <div
        style={{
          fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--sb-dusty)', marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
