import React, { useState } from 'react';
import { api } from '../lib/api.js';

export default function LandingGate({ status, onUnlocked }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.unlockLanding(password);
      onUnlocked();
    } catch (err) {
      setError(err.message || 'Invalid password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--sb-navy)',
        color: 'var(--sb-cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div className="sb-eyebrow" style={{ marginBottom: '1.25rem' }}>
          Salt Basin Net Works
        </div>
        <h1
          className="sb-display"
          style={{ fontSize: '3.5rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          {status.headline}
        </h1>
        <div className="sb-gold-rule" style={{ margin: '1.25rem auto' }} />
        <p
          style={{
            fontFamily: 'var(--sb-font-display)',
            fontSize: '1.1rem',
            fontStyle: 'italic',
            color: 'var(--sb-sage)',
            lineHeight: 1.85,
            marginBottom: '2rem',
          }}
        >
          {status.subhead}
        </p>

        <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="sb-input"
            style={{ maxWidth: 280 }}
            autoFocus
          />
          <button type="submit" className="sb-btn sb-btn-gold" disabled={submitting}>
            {submitting ? 'Unlocking…' : 'Enter ↗'}
          </button>
        </form>
        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--sb-risk-critical)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
