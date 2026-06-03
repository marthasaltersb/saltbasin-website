import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await api.login(email, password);
      nav('/admin', { replace: true });
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--sb-navy-deep)',
          padding: '2rem',
          border: '0.5px solid rgba(196,132,58,0.25)',
          borderRadius: 'var(--sb-radius)',
        }}
      >
        <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
          Salt Basin Net Works
        </div>
        <h2 className="sb-display" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>
          Admin Login
        </h2>
        <label className="sb-label" style={{ color: 'var(--sb-dusty)', display: 'block', marginBottom: 4 }}>
          Email
        </label>
        <input
          className="sb-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          autoFocus
          style={{ marginBottom: '1rem' }}
        />
        <label className="sb-label" style={{ color: 'var(--sb-dusty)', display: 'block', marginBottom: 4 }}>
          Password
        </label>
        <input
          className="sb-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          style={{ marginBottom: '1.5rem' }}
        />
        {err && (
          <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {err}
          </div>
        )}
        <button
          type="submit"
          className="sb-btn sb-btn-gold"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign In ↗'}
        </button>
      </form>
    </div>
  );
}
