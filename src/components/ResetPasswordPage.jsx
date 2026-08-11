// Password-reset confirmation page.
//
// Reached via the email link delivered by /api/auth/reset-request. URL shape:
// /reset/:token. We POST the new password + token to /api/auth/reset-confirm;
// on success the server has cleared the user's existing sessions, so the user
// must sign in fresh with their new password.

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setErr('Use 12+ characters with a capital letter, number, and special character.');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.confirmPasswordReset(token, password);
      setDone(true);
    } catch (e) {
      setErr(e.message || 'Reset failed');
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

        {done ? (
          <>
            <h2 className="sb-display" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Password updated
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--sb-sage)',
                lineHeight: 1.55,
                marginBottom: '1.25rem',
              }}
            >
              Your password is set. Existing sessions have been cleared as a precaution — sign in
              with the new password.
            </p>
            <button
              type="button"
              className="sb-btn sb-btn-gold"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => nav('/login', { replace: true })}
            >
              Sign in ↗
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="sb-display" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
              Set a new password
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--sb-sage)',
                lineHeight: 1.55,
                marginBottom: '1.25rem',
              }}
            >
              Use at least 12 characters with a capital letter, number, and special character. You cannot reuse a previous password.
            </p>
            <label
              className="sb-label"
              style={{ color: 'var(--sb-dusty)', display: 'block', marginBottom: 4 }}
            >
              New password
            </label>
            <input
              className="sb-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoFocus
              minLength={12}
              style={{ marginBottom: '1rem' }}
            />
            <label
              className="sb-label"
              style={{ color: 'var(--sb-dusty)', display: 'block', marginBottom: 4 }}
            >
              Confirm new password
            </label>
            <input
              className="sb-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              required
              minLength={12}
              style={{ marginBottom: '1.5rem' }}
            />
            {err && (
              <div
                style={{
                  color: 'var(--sb-risk-critical)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {err}
              </div>
            )}
            <button
              type="submit"
              className="sb-btn sb-btn-gold"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
              disabled={submitting}
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: 'var(--sb-gold)', fontSize: '0.78rem' }}>
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
