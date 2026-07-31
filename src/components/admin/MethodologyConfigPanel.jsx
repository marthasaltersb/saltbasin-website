import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

// Generic editor for every registered Config Envelope (server/lib/configEnvelope.js)
// — this is the missing piece the runtime-config audit (2026-07-12,
// docs/salt-basin-runtime-config-audit-2026-07-12.md) flagged: storage and
// validation already existed as a pattern, but no admin UI could actually
// edit any of it without an engineer. One panel, driven entirely by what the
// server has registered — adding a new envelope server-side surfaces it here
// automatically, no new UI code needed.

const s = {
  page: { padding: '1.5rem', overflowY: 'auto', height: '100%' },
  eyebrow: { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' },
  title: { fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginBottom: '0.5rem' },
  intro: { fontSize: '0.8rem', color: 'var(--sb-dusty)', marginBottom: '1.25rem', maxWidth: 640, lineHeight: 1.5 },
  card: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '1rem 1.25rem', marginBottom: '0.9rem' },
  cardTitle: { fontSize: '0.95rem', color: 'var(--sb-cream)', fontFamily: 'var(--sb-font-display)', fontWeight: 400 },
  cardDesc: { fontSize: '0.72rem', color: 'var(--sb-dusty)', marginTop: '0.2rem', marginBottom: '0.6rem', lineHeight: 1.4 },
  meta: { fontSize: '0.65rem', color: 'var(--sb-dusty)', marginBottom: '0.5rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.04em' },
  textarea: { width: '100%', minHeight: 220, background: 'rgba(0,0,0,0.25)', color: 'var(--sb-cream)', border: '0.5px solid rgba(139,155,174,0.3)', borderRadius: 2, padding: '0.6rem', fontFamily: 'var(--sb-font-mono, monospace)', fontSize: '0.72rem', lineHeight: 1.5, resize: 'vertical' },
  errorBox: { marginTop: '0.5rem', padding: '0.5rem 0.7rem', background: 'rgba(196,74,74,0.1)', border: '0.5px solid rgba(196,74,74,0.4)', borderRadius: 2, fontSize: '0.72rem', color: '#e08080' },
  actions: { display: 'flex', gap: '0.5rem', marginTop: '0.6rem' },
  btn: (primary) => ({ padding: '0.35rem 0.85rem', background: primary ? 'var(--sb-gold)' : 'transparent', color: primary ? 'var(--sb-ivory)' : 'var(--sb-dusty)', border: `0.5px solid ${primary ? 'var(--sb-gold)' : 'rgba(139,155,174,0.35)'}`, borderRadius: 2, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)' }),
};

function EnvelopeCard({ envelope, onSaved }) {
  const [text, setText] = useState(JSON.stringify(envelope.value, null, 2));
  const [errors, setErrors] = useState(envelope.invalidStoredValueErrors || []);
  const [parseError, setParseError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    let parsed;
    try {
      parsed = JSON.parse(text);
      setParseError(null);
    } catch (e) {
      setParseError(`Not valid JSON: ${e.message}`);
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      await api.writeConfigEnvelope(envelope.id, parsed);
      toast.success(`${envelope.label} saved`);
      onSaved();
    } catch (e) {
      if (e.status === 400 && e.body?.details) setErrors(e.body.details);
      else toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  }

  async function resetToDefault() {
    if (!window.confirm(`Reset "${envelope.label}" to its shipped default? This deletes the saved override.`)) return;
    setSaving(true);
    try {
      await api.resetConfigEnvelope(envelope.id);
      toast.success(`${envelope.label} reset to default`);
      onSaved();
    } catch (e) {
      toast.error(e.message || 'Reset failed');
    }
    setSaving(false);
  }

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>{envelope.label}</div>
      {envelope.description && <div style={s.cardDesc}>{envelope.description}</div>}
      <div style={s.meta}>
        {envelope.source === 'stored'
          ? `Live override · saved ${new Date(envelope.updatedAt).toLocaleString()}`
          : 'Using shipped default · no override saved yet'}
      </div>
      <textarea style={s.textarea} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      {parseError && <div style={s.errorBox}>{parseError}</div>}
      {errors.length > 0 && (
        <div style={s.errorBox}>
          {errors.map((err, i) => <div key={i}>{err}</div>)}
        </div>
      )}
      <div style={s.actions}>
        <button style={s.btn(true)} onClick={save} disabled={saving}>Save</button>
        <button style={s.btn(false)} onClick={resetToDefault} disabled={saving || envelope.source !== 'stored'}>Reset to default</button>
      </div>
    </div>
  );
}

export default function MethodologyConfigPanel() {
  const [envelopes, setEnvelopes] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.listConfigEnvelopes();
      setEnvelopes(res.envelopes || []);
    } catch (e) {
      toast.error('Failed to load config envelopes');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={s.page}>
      <div style={s.eyebrow}>System</div>
      <div style={s.title}>Methodology Config</div>
      <div style={s.intro}>
        Edit the weighted composites driving Rod Mathematics and Query Convergence directly — no code
        deploy required. Every save is validated server-side (weights must sum to 1 where the methodology
        requires it) before it takes effect; an invalid edit is rejected and the previous value keeps
        running.
      </div>
      {loading && <div style={s.cardDesc}>Loading…</div>}
      {!loading && envelopes && envelopes.map((envelope) => (
        <EnvelopeCard key={envelope.id} envelope={envelope} onSaved={load} />
      ))}
    </div>
  );
}
