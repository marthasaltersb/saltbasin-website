// CareerConsentGate (2026-07-16) — blocks all career configuration (My
// Resume, Career Master, Upload Data, Career Orbit) until the member has
// granted current consent. Renders its children only once
// api.getCareerConsentStatus() reports granted:true; otherwise shows the
// acknowledgement checkboxes (sourced from the server's consentRegistry.js,
// not hardcoded here, so wording changes there don't need a client change)
// and requires all of them checked before "I Agree — Continue" submits a
// real, timestamped consent_actions row via api.recordCareerConsent().
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const S = {
  wrap: { maxWidth: 640, margin: '3rem auto', padding: '2rem', background: 'white', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 12 },
  title: { fontSize: '1.3rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.5rem' },
  sub: { fontSize: '0.85rem', color: '#666', lineHeight: 1.6, marginBottom: '1.5rem' },
  check: { display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.82rem', color: '#333', lineHeight: 1.5, marginBottom: '1rem' },
  btn: (enabled) => ({
    padding: '0.65rem 1.5rem', borderRadius: 8, border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: '0.85rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.05em',
    background: enabled ? 'var(--sb-gold, #c4843a)' : 'rgba(0,0,0,0.12)', color: enabled ? 'white' : '#999',
  }),
};

export default function CareerConsentGate({ children }) {
  const [status, setStatus] = useState(null); // null = loading
  const [checks, setChecks] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getCareerConsentStatus('career_portfolio').then(setStatus).catch((e) => toast.error(e.message));
  }, []);

  if (status === null) return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading…</div>;
  if (status.granted) return children;

  const allChecked = status.acknowledgements.every((ack) => checks[ack.key]);

  async function submit() {
    setSubmitting(true);
    try {
      await api.recordCareerConsent('career_portfolio', true);
      const refreshed = await api.getCareerConsentStatus('career_portfolio');
      setStatus(refreshed);
      toast.success('Consent recorded');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.title}>Career Portfolio Data Handling</div>
      <div style={S.sub}>
        Before you configure your Career Master, upload data, or enter Career Orbit, please review and confirm the following. This applies every time the wording changes — you're seeing version {status.consentVersion}.
      </div>
      {status.acknowledgements.map((ack) => (
        <label key={ack.key} style={S.check}>
          <input
            type="checkbox"
            checked={!!checks[ack.key]}
            onChange={(e) => setChecks((current) => ({ ...current, [ack.key]: e.target.checked }))}
            style={{ marginTop: 2, accentColor: 'var(--sb-gold, #c4843a)' }}
          />
          <span>{ack.text}</span>
        </label>
      ))}
      <button style={S.btn(allChecked && !submitting)} disabled={!allChecked || submitting} onClick={submit}>
        {submitting ? 'Recording…' : 'I Agree — Continue'}
      </button>
    </div>
  );
}
