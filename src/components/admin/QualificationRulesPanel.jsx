// Qualification Rules (2026-10-09, administrators): view and edit the qualification gate definition that every
// member's career pipeline is checked against (PUT /api/career-agents/verification-current - the same route
// the MCP tool career_verification_current_save runs, so the website and agents are held to one validation).
// Errors show inline (role="alert"); nothing fails silently.
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { jsonProblem } from '../../lib/friendlyError.js';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', bad: '#a5391f', ok: '#2f7d4f' };

export default function QualificationRulesPanel() {
  const [current, setCurrent] = useState(null);
  const [text, setText] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { ok, text }

  useEffect(() => {
    let cancelled = false;
    api.getCareerVerificationCurrent()
      .then((r) => { if (cancelled) return; setCurrent(r); setText(JSON.stringify(r.gates, null, 2)); })
      .catch((e) => { if (!cancelled) setLoadError(e.message); });
    return () => { cancelled = true; };
  }, []);

  async function save() {
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { setMessage({ ok: false, text: jsonProblem('gate list', e) }); return; }
    setBusy(true); setMessage(null);
    try {
      const r = await api.saveCareerVerificationCurrent(parsed);
      setText(JSON.stringify(r.gates, null, 2));
      setMessage({ ok: true, text: `Saved ${r.gates.length} gate${r.gates.length === 1 ? '' : 's'}.` });
      toast.success('Qualification rule saved.');
    } catch (e) {
      setMessage({ ok: false, text: e.message });
      toast.error(e.message);
    }
    setBusy(false);
  }

  return (
    <div data-testid="qualification-rules" style={{ background: '#fff', color: C.ink, borderRadius: 12, padding: '1.1rem', maxWidth: 900, margin: '0 auto', fontSize: '0.88rem' }}>
      <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Qualification Rules</h1>
      <p style={{ color: C.sec, fontSize: '0.8rem', lineHeight: 1.5, margin: '0.25rem 0 1rem' }}>
        The gate chain every career opportunity is checked against (platform default). Each gate needs a <code>key</code> and a known <code>checkType</code>; saving replaces the chain.
      </p>
      {loadError && <div role="alert" style={{ color: C.bad, border: `1px solid ${C.bad}`, borderRadius: 8, padding: '0.6rem' }}>Could not load the qualification rule: {loadError}</div>}
      {!current && !loadError && <div role="status">Loading…</div>}
      {current && (
        <>
          <div style={{ color: C.sec, fontSize: '0.78rem', marginBottom: '0.4rem' }}>
            {current.label} ({current.currentKey}). Known check types: {(current.availableCheckTypes || []).join(', ')}. Known actions: {(current.availableActions || []).join(', ')}.
          </div>
          <label htmlFor="gate-definition-json" style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem' }}>Gates (JSON)</label>
          <textarea id="gate-definition-json" value={text} onChange={(e) => setText(e.target.value)} rows={16} spellCheck={false}
            style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.78rem', border: `1px solid ${C.line}`, borderRadius: 8, padding: '0.5rem' }} />
          <button onClick={save} disabled={busy} style={{ minHeight: 44, marginTop: '0.6rem', padding: '0.45rem 1.1rem', borderRadius: 8, border: 'none', background: C.ink, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {busy ? 'Saving…' : 'Save qualification rule'}
          </button>
          {message && <div role={message.ok ? 'status' : 'alert'} style={{ marginTop: '0.6rem', whiteSpace: 'pre-line', color: message.ok ? C.ok : C.bad }}>{message.text}</div>}
        </>
      )}
    </div>
  );
}
