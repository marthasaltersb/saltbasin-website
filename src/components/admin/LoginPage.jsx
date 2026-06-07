// Sign-in page.
//
// One page, three modes:
//   'login'    — email + password → /api/auth/login
//   'forgot-password' — email → /api/auth/reset-request → check-your-email screen
//   'forgot-email'    — phone → /api/auth/email-recover → check-your-email screen
//
// Both recovery flows always render the same generic success screen regardless
// of whether a record matched — the server has the matching logic but never
// tells the client whether an email or phone is on file (anti-enumeration).
//
// On successful login the redirect target depends on user.role: admins land at
// /admin, members at /member. A ?next= URL param overrides this if it's a path
// (not an external URL, for safety).

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';

export default function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const nextRaw = params.get('next') || '';
  // Only honor `next` if it's a same-origin path (starts with / and not //).
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : null;

  const [mode, setMode] = useState('login'); // 'login' | 'forgot-password' | 'forgot-email' | 'check-email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submitLogin(e) {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      const body = await api.login(email, password);
      const role = body?.user?.role;
      const target = next || (role === 'admin' ? '/admin' : '/member');
      nav(target, { replace: true });
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitForgotPassword(e) {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await api.requestPasswordReset(email);
      setMode('check-email');
    } catch (e) {
      setErr(e.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitForgotEmail(e) {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await api.recoverEmail(phone);
      setMode('check-email');
    } catch (e) {
      setErr(e.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  // Reset transient state when switching modes so the user doesn't see old
  // error messages on the wrong form.
  function go(m) {
    setMode(m);
    setErr('');
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
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--sb-navy-deep)',
          padding: '2rem',
          border: '0.5px solid rgba(196,132,58,0.25)',
          borderRadius: 'var(--sb-radius)',
        }}
      >
        <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
          Salt Basin Net Works
        </div>

        {/* ────────── Mode: login ────────── */}
        {mode === 'login' && (
          <form onSubmit={submitLogin}>
            <h2 className="sb-display" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Sign In
            </h2>
            <Label>Email</Label>
            <input
              className="sb-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoFocus
              style={{ marginBottom: '1rem' }}
            />
            <Label>Password</Label>
            <input
              className="sb-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              style={{ marginBottom: '1.5rem' }}
            />
            {err && <ErrorBox>{err}</ErrorBox>}
            <button
              type="submit"
              className="sb-btn sb-btn-gold"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
              disabled={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign In ↗'}
            </button>
            <div style={linkRow}>
              <button type="button" style={linkBtn} onClick={() => go('forgot-password')}>
                Forgot password?
              </button>
              <button type="button" style={linkBtn} onClick={() => go('forgot-email')}>
                Forgot your email?
              </button>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--sb-dusty)', textAlign: 'center' }}>
              No account yet?{' '}
              <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} style={{ color: 'var(--sb-gold)' }}>
                Sign up
              </Link>
            </div>
          </form>
        )}

        {/* ────────── Mode: forgot-password ────────── */}
        {mode === 'forgot-password' && (
          <form onSubmit={submitForgotPassword}>
            <h2 className="sb-display" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Reset password
            </h2>
            <p style={subtitleStyle}>
              Enter the email on your account. We'll send you a link to set a new password.
            </p>
            <Label>Email</Label>
            <input
              className="sb-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoFocus
              style={{ marginBottom: '1.5rem' }}
            />
            {err && <ErrorBox>{err}</ErrorBox>}
            <button
              type="submit"
              className="sb-btn sb-btn-gold"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <div style={linkRow}>
              <button type="button" style={linkBtn} onClick={() => go('login')}>
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* ────────── Mode: forgot-email ────────── */}
        {mode === 'forgot-email' && (
          <form onSubmit={submitForgotEmail}>
            <h2 className="sb-display" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Find your email
            </h2>
            <p style={subtitleStyle}>
              Enter the phone number you used when you first reached out.
              If we have a matching account, we'll email a reminder of the address to whoever owns that account.
            </p>
            <Label>Phone number</Label>
            <input
              className="sb-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              required
              autoFocus
              placeholder="e.g. 555-123-4567"
              style={{ marginBottom: '1.5rem' }}
            />
            {err && <ErrorBox>{err}</ErrorBox>}
            <button
              type="submit"
              className="sb-btn sb-btn-gold"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
              disabled={submitting}
            >
              {submitting ? 'Looking up…' : 'Send reminder'}
            </button>
            <div style={linkRow}>
              <button type="button" style={linkBtn} onClick={() => go('login')}>
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* ────────── Mode: check-email (success state for both recovery flows) ────────── */}
        {mode === 'check-email' && (
          <div>
            <h2 className="sb-display" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Check your email
            </h2>
            <p style={subtitleStyle}>
              If we found a matching account, an email is on its way.
              Check your inbox (and spam folder) for a message from Salt Basin Net Works.
              Reset links expire in 1 hour.
            </p>
            <button
              type="button"
              className="sb-btn sb-btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { go('login'); setEmail(''); setPhone(''); }}
            >
              ← Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="sb-label" style={{ color: 'var(--sb-dusty)', display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );
}

function ErrorBox({ children }) {
  return (
    <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem', marginBottom: '1rem' }}>
      {children}
    </div>
  );
}

const subtitleStyle = {
  fontSize: '0.85rem',
  color: 'var(--sb-sage)',
  lineHeight: 1.55,
  marginBottom: '1.25rem',
};

const linkRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const linkBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--sb-gold)',
  cursor: 'pointer',
  fontSize: '0.78rem',
  padding: '0.25rem 0',
  textDecoration: 'underline',
  fontFamily: 'inherit',
};
